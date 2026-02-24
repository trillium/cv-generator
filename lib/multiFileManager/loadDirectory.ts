import fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { CVData } from '@/types'
import type { DirectoryLoadResult, PdfMetadataFile } from '@/types/multiFileManager.types'
import { getPiiDirectory } from '../getPiiPath'
import {
  findDataFilesInDirectory,
  getAncestorDirectories,
  loadDataFile,
  mergeNumberedArrayFiles,
  parseNumberedArrayFile,
  validateNumberedArrayFiles,
} from '../multiFileMapper'
import { validateCVData } from './validateData'

export async function loadDirectory(dirPath: string): Promise<DirectoryLoadResult> {
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
      loadedDirectories: ancestorDirs,
      filesLoaded,
      hasUnsavedChanges: false,
    },
    pdfMetadata,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
  }
}
