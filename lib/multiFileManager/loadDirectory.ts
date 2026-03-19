import fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { CVData } from '@/types'
import type { DirectoryLoadResult, PdfMetadataFile } from '@/types/multiFileManager.types'
import { getPiiDirectory } from '../getPiiPath'
import { type ManifestSectionKey, resolveManifest, SINGLETON_SECTIONS } from '../manifest'
import {
  findDataFilesInDirectory,
  getAncestorDirectories,
  loadDataFile,
  mergeNumberedArrayFiles,
  parseNumberedArrayFile,
  validateNumberedArrayFiles,
} from '../multiFileMapper'
import { validateCVData } from './validateData'

const MANIFEST_FILENAME = 'manifest.yml'
const LOCAL_ONLY_SECTIONS = new Set(['info', 'metadata', 'llm', 'notes', 'linkedIn'])

function loadViaManifest(dirPath: string): {
  mergedData: Record<string, unknown>
  sources: Record<string, string | string[]>
  filesLoaded: string[]
  loadedDirectories: string[]
} {
  const piiPath = getPiiDirectory()
  const manifestPath = path.join(piiPath, dirPath, MANIFEST_FILENAME)
  const resolved = resolveManifest(manifestPath)

  const mergedData: Record<string, unknown> = {}
  const sources: Record<string, string | string[]> = {}
  const filesLoaded: string[] = [manifestPath]
  const loadedDirectories: string[] = [path.join(piiPath, dirPath)]

  const sectionFiles = new Map<ManifestSectionKey, { data: unknown[]; paths: string[] }>()

  for (const entry of resolved.entries) {
    const fileData = loadDataFile(entry.filePath)
    const sectionData = fileData[entry.section]
    filesLoaded.push(entry.filePath)

    if (SINGLETON_SECTIONS.includes(entry.section)) {
      mergedData[entry.section] = sectionData
      sources[entry.section] = entry.filePath
    } else {
      const existing = sectionFiles.get(entry.section) || { data: [], paths: [] }
      const items = Array.isArray(sectionData) ? sectionData : [sectionData]
      existing.data.push(...items)
      existing.paths.push(entry.filePath)
      sectionFiles.set(entry.section, existing)
    }
  }

  for (const [section, { data, paths }] of sectionFiles) {
    mergedData[section] = data
    sources[section] = paths
  }

  const ancestorDirs = getAncestorDirectories(dirPath)
  for (const dir of ancestorDirs) {
    const dataFiles = findDataFilesInDirectory(dir)
    for (const filePath of dataFiles) {
      const fileData = loadDataFile(filePath)
      for (const [section] of Object.entries(fileData)) {
        if (LOCAL_ONLY_SECTIONS.has(section)) {
          mergedData[section] = fileData[section]
          sources[section] = filePath
          filesLoaded.push(filePath)
          if (!loadedDirectories.includes(dir)) {
            loadedDirectories.push(dir)
          }
        }
      }
    }
  }

  return { mergedData, sources, filesLoaded, loadedDirectories }
}

function loadViaFiles(dirPath: string): {
  mergedData: Record<string, unknown>
  sources: Record<string, string | string[]>
  filesLoaded: string[]
  loadedDirectories: string[]
} {
  const ancestorDirs = getAncestorDirectories(dirPath)
  const filesLoaded: string[] = []
  const sources: Record<string, string | string[]> = {}
  const mergedData: Record<string, unknown> = {}

  for (const dir of ancestorDirs) {
    const dataFiles = findDataFilesInDirectory(dir)
    validateNumberedArrayFiles(dataFiles, dir)

    const numberedFiles: string[] = []
    const regularFiles: string[] = []

    for (const filePath of dataFiles) {
      const filename = path.basename(filePath)
      if (parseNumberedArrayFile(filename)) {
        numberedFiles.push(filePath)
      } else {
        regularFiles.push(filePath)
      }
    }

    for (const filePath of regularFiles) {
      filesLoaded.push(filePath)
      const fileData = loadDataFile(filePath)
      for (const [section, value] of Object.entries(fileData)) {
        mergedData[section] = value
        sources[section] = filePath
      }
    }

    if (numberedFiles.length > 0) {
      const mergedArrays = mergeNumberedArrayFiles(numberedFiles)
      for (const [sectionKey, { data, sources: fileSources }] of mergedArrays.entries()) {
        filesLoaded.push(...fileSources)
        mergedData[sectionKey] = data
        sources[sectionKey] = fileSources
      }
    }
  }

  return { mergedData, sources, filesLoaded, loadedDirectories: ancestorDirs }
}

function hasManifestFile(dirPath: string): boolean {
  const piiPath = getPiiDirectory()
  return fsSync.existsSync(path.join(piiPath, dirPath, MANIFEST_FILENAME))
}

export async function loadDirectory(dirPath: string): Promise<DirectoryLoadResult> {
  const useManifest = hasManifestFile(dirPath)
  const { mergedData, sources, filesLoaded, loadedDirectories } = useManifest
    ? loadViaManifest(dirPath)
    : loadViaFiles(dirPath)

  let pdfMetadata: PdfMetadataFile | undefined
  try {
    const piiPath = getPiiDirectory()
    const metadataPath = path.join(piiPath, dirPath, 'metadata.json')
    if (fsSync.existsSync(metadataPath)) {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8')
      pdfMetadata = JSON.parse(metadataContent)
    }
  } catch (err) {
    console.warn(`Could not load PDF metadata: ${err}`)
  }

  const cvData = mergedData as CVData
  const validationErrors = validateCVData(cvData, sources)

  return {
    data: cvData,
    sources,
    metadata: {
      directoryPath: dirPath,
      loadedDirectories,
      filesLoaded,
      hasUnsavedChanges: false,
    },
    pdfMetadata,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
  }
}
