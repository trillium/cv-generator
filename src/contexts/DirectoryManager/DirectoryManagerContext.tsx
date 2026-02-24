'use client'

import { type ReactNode, useCallback, useMemo, useState } from 'react'
import type {
  DirectoryFileInfo,
  DirectoryLoadResult,
  DirectoryMetadata,
} from '@/lib/multiFileManager'
import type { CVData } from '@/types'
import { DirectoryManagerContext } from './DirectoryManagerContext.context'
import { useDataUpdate } from './hooks/useDataUpdate'
import { useDirectoryOps } from './hooks/useDirectoryOps'
import { usePdfPolling } from './hooks/usePdfPolling'
import { useSseReload } from './hooks/useSseReload'

export interface PdfMetadata {
  pageCount?: number
  offScreenText?: string[]
  error?: string
}

export interface PdfJobState {
  jobId: string
  pdfTypes: string[]
  status: 'processing' | 'complete' | 'failed'
  metadata?: Record<string, PdfMetadata>
}

export interface DirectoryManagerContextType {
  allResumes: Record<string, DirectoryLoadResult>
  currentResumeKey: string | null
  currentDirectory: string | null
  data: CVData | null
  sources: Record<string, string | string[]>
  metadata: DirectoryMetadata | null
  files: DirectoryFileInfo[]
  validationErrors: import('@/types/multiFileManager.types').ValidationError[]
  loading: boolean
  error: string | null
  hasUnsavedChanges: boolean
  pdfJobs: PdfJobState[]
  storedPdfMetadata: import('@/lib/multiFileManager').PdfMetadataFile | null
  documentType: 'resume' | 'cover-letter' | null
  setDocumentType: (type: 'resume' | 'cover-letter' | null) => void
  parsedData: CVData | null
  content: string
  loadAllResumes: () => Promise<void>
  setCurrentResume: (key: string) => void
  ensureResumeLoaded: (key: string) => Promise<void>
  loadDirectory: (path: string) => Promise<void>
  updateDataPath: (yamlPath: string, value: unknown) => Promise<void>
  saveDirectory: () => Promise<void>
  discardChanges: () => Promise<void>
  getSourceFile: (section: string) => string | string[] | null
  getHierarchy: (path: string) => Promise<void>
  listDirectoryFiles: (path: string) => Promise<void>
  refreshFiles: () => Promise<void>
  createDirectory: (parentPath: string, directoryName: string) => Promise<void>
  splitSectionToFile: (
    sourceFilePath: string,
    sectionKeys: string[],
    targetFileName: string,
  ) => Promise<void>
  deleteFileToDeleted: (filePath: string) => Promise<void>
  currentFile: { path: string } | null
  updateContent: (newContent: string) => void
  saveFile: (commit?: boolean, message?: string) => Promise<void>
}

interface DirectoryManagerProviderProps {
  children: ReactNode
}

export function DirectoryManagerProvider({ children }: DirectoryManagerProviderProps) {
  const [allResumes, setAllResumes] = useState<Record<string, DirectoryLoadResult>>({})
  const [currentResumeKey, setCurrentResumeKey] = useState<string | null>(null)
  const [files, setFiles] = useState<DirectoryFileInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [documentType, setDocumentType] = useState<'resume' | 'cover-letter' | null>(null)
  const [recentUpdateTimestamp, setRecentUpdateTimestamp] = useState<number | null>(null)

  const currentResume = useMemo(() => {
    return currentResumeKey ? allResumes[currentResumeKey] : null
  }, [currentResumeKey, allResumes])

  const currentDirectory = currentResume?.metadata.directoryPath || null
  const data = currentResume?.data || null
  const sources = currentResume?.sources || {}
  const metadata = currentResume?.metadata || null
  const storedPdfMetadata = currentResume?.pdfMetadata || null
  const validationErrors = currentResume?.validationErrors || []

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true)
    setError(null)

    try {
      const filesResponse = await fetch(
        `/api/directory/files?path=${encodeURIComponent('resumes')}&recursive=true`,
      )
      const filesResult = await filesResponse.json()

      if (!filesResult.success) {
        throw new Error('Failed to fetch available files')
      }

      const allFiles = filesResult.files.map((f: DirectoryFileInfo) => f.path)
      const allDirs = filesResult.files
        .filter((f: DirectoryFileInfo) => f.metadata.type === 'directory')
        .map((f: DirectoryFileInfo) => f.path)

      let resolvedPath = path
      const isRootDirectory = path === 'resumes'
      const isDirectory = allDirs.includes(path)
      const isFile = allFiles.includes(path)

      if (!isRootDirectory && !isDirectory && !isFile) {
        if (!path.endsWith('.yml') && !path.endsWith('.yaml')) {
          const withExtension = `${path}.yml`
          if (allFiles.includes(withExtension)) {
            resolvedPath = withExtension
          } else {
            throw new Error(
              `Directory/file not found: ${path}. Available files: ${allFiles.slice(0, 5).join(', ')}...`,
            )
          }
        } else {
          const withoutExtension = path.replace(/\.(yml|yaml)$/i, '')
          if (allFiles.includes(withoutExtension) || allDirs.includes(withoutExtension)) {
            resolvedPath = withoutExtension
          } else {
            throw new Error(
              `Directory/file not found: ${path}. Available files: ${allFiles.slice(0, 5).join(', ')}...`,
            )
          }
        }
      }

      const response = await fetch(`/api/directory/load?path=${encodeURIComponent(resolvedPath)}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load directory')
      }

      setFiles(filesResult.files)
      setAllResumes((prev) => ({
        ...prev,
        [resolvedPath]: {
          data: result.data,
          sources: result.sources,
          metadata: result.metadata,
          pdfMetadata: result.pdfMetadata,
          validationErrors: result.validationErrors,
        },
      }))
      setCurrentResumeKey(resolvedPath)
      setHasUnsavedChanges(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load directory'
      setError(errorMsg)
      console.error('Error loading directory:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const directoryOps = useDirectoryOps(
    currentDirectory,
    currentResume ?? null,
    loadDirectory,
    setFiles,
  )

  const { pdfJobs, addPdfJob } = usePdfPolling(currentDirectory, loadDirectory)

  const { updateDataPath } = useDataUpdate({
    currentDirectory,
    currentResumeKey,
    data,
    sources,
    loadDirectory,
    addPdfJob,
    setAllResumes,
    setLoading,
    setError,
    setHasUnsavedChanges,
    setRecentUpdateTimestamp,
  })

  useSseReload(currentResumeKey, recentUpdateTimestamp, setAllResumes)

  const loadAllResumes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const filesResponse = await fetch(
        `/api/directory/files?path=${encodeURIComponent('resumes')}&recursive=true`,
      )
      const filesResult = await filesResponse.json()

      if (!filesResult.success) {
        throw new Error('Failed to fetch available files')
      }

      setFiles(filesResult.files)

      const directories = filesResult.files
        .filter((f: DirectoryFileInfo) => f.metadata.type === 'directory')
        .map((f: DirectoryFileInfo) => f.path)

      directories.unshift('resumes')

      const loadPromises = directories.map(async (dir: string) => {
        try {
          const response = await fetch(`/api/directory/load?path=${encodeURIComponent(dir)}`)
          const result = await response.json()

          if (result.success) {
            return {
              key: dir,
              data: {
                data: result.data,
                sources: result.sources,
                metadata: result.metadata,
                pdfMetadata: result.pdfMetadata,
                validationErrors: result.validationErrors,
              },
            }
          }
        } catch {
          // Individual resume load failures are non-fatal
        }
        return null
      })

      const results = await Promise.all(loadPromises)
      const resumeCache: Record<string, DirectoryLoadResult> = {}

      results.forEach((result) => {
        if (result) {
          resumeCache[result.key] = result.data
        }
      })

      setAllResumes(resumeCache)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load all resumes'
      setError(errorMsg)
      console.error('Error loading all resumes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const setCurrentResume = useCallback((key: string) => {
    setCurrentResumeKey(key)
  }, [])

  const ensureResumeLoaded = useCallback(
    async (key: string) => {
      if (allResumes[key]) {
        setCurrentResumeKey(key)
        return
      }

      await loadDirectory(key)
    },
    [allResumes, loadDirectory],
  )

  const saveDirectory = useCallback(async () => {
    setHasUnsavedChanges(false)
  }, [])

  const discardChanges = useCallback(async () => {
    if (currentDirectory) {
      await loadDirectory(currentDirectory)
      setHasUnsavedChanges(false)
    }
  }, [currentDirectory, loadDirectory])

  const getSourceFile = useCallback(
    (section: string): string | string[] | null => {
      return sources[section] || null
    },
    [sources],
  )

  const getHierarchy = useCallback(async (path: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/directory/hierarchy?path=${encodeURIComponent(path)}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get hierarchy')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get hierarchy'
      setError(errorMsg)
      console.error('Error getting hierarchy:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const listDirectoryFiles = useCallback(async (path: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/directory/files?path=${encodeURIComponent(path)}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to list files')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to list files'
      setError(errorMsg)
      console.error('Error listing directory files:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateContent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_newContent: string) => {
      setHasUnsavedChanges(true)
    },
    [],
  )

  const saveFile = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_commit?: boolean, _message?: string) => {
      await saveDirectory()
    },
    [saveDirectory],
  )

  const value: DirectoryManagerContextType = {
    allResumes,
    currentResumeKey,
    currentDirectory,
    data,
    sources,
    metadata,
    files,
    validationErrors,
    loading,
    error,
    hasUnsavedChanges,
    pdfJobs,
    storedPdfMetadata,
    documentType,
    setDocumentType,
    parsedData: data,
    content: data ? JSON.stringify(data, null, 2) : '',
    currentFile: currentDirectory ? { path: currentDirectory } : null,
    loadAllResumes,
    setCurrentResume,
    ensureResumeLoaded,
    loadDirectory,
    updateDataPath,
    saveDirectory,
    discardChanges,
    getSourceFile,
    getHierarchy,
    listDirectoryFiles,
    refreshFiles: directoryOps.refreshFiles,
    createDirectory: directoryOps.createDirectory,
    splitSectionToFile: directoryOps.splitSectionToFile,
    deleteFileToDeleted: directoryOps.deleteFileToDeleted,
    updateContent,
    saveFile,
  }

  return (
    <DirectoryManagerContext.Provider value={value}>{children}</DirectoryManagerContext.Provider>
  )
}
