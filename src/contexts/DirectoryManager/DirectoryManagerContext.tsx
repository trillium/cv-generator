'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import type {
  DirectoryFileInfo,
  DirectoryLoadResult,
  DirectoryMetadata,
} from '@/lib/multiFileManager'
import { ARRAY_INDEX_PATTERN } from '@/lib/multiFileManager/constants'
import type { CVData } from '@/types'
import { DirectoryManagerContext } from './DirectoryManagerContext.context'

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
  // Resume cache
  allResumes: Record<string, DirectoryLoadResult>
  currentResumeKey: string | null

  // Current directory state (computed from cache)
  currentDirectory: string | null
  data: CVData | null
  sources: Record<string, string | string[]>
  metadata: DirectoryMetadata | null
  files: DirectoryFileInfo[]
  validationErrors: import('@/types/multiFileManager.types').ValidationError[]

  // Loading states
  loading: boolean
  error: string | null
  hasUnsavedChanges: boolean

  // PDF generation state (can have multiple jobs running)
  pdfJobs: PdfJobState[]
  storedPdfMetadata: import('@/lib/multiFileManager').PdfMetadataFile | null

  // Document type (resume or cover-letter)
  documentType: 'resume' | 'cover-letter' | null
  setDocumentType: (type: 'resume' | 'cover-letter' | null) => void

  // Parsed data (for compatibility with EditableField)
  parsedData: CVData | null
  content: string

  // Cache management
  loadAllResumes: () => Promise<void>
  setCurrentResume: (key: string) => void
  ensureResumeLoaded: (key: string) => Promise<void>

  // Actions (legacy, still needed for file-manager)
  loadDirectory: (path: string) => Promise<void>
  updateDataPath: (yamlPath: string, value: unknown) => Promise<void>
  saveDirectory: () => Promise<void>
  discardChanges: () => Promise<void>
  getSourceFile: (section: string) => string | string[] | null

  // Hierarchy operations
  getHierarchy: (path: string) => Promise<void>
  listDirectoryFiles: (path: string) => Promise<void>
  refreshFiles: () => Promise<void>

  // Directory operations
  createDirectory: (parentPath: string, directoryName: string) => Promise<void>
  splitSectionToFile: (
    sourceFilePath: string,
    sectionKeys: string[],
    targetFileName: string,
  ) => Promise<void>
  deleteFileToDeleted: (filePath: string) => Promise<void>

  // File operations
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
  const [pdfJobs, setPdfJobs] = useState<PdfJobState[]>([])
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
        } catch (err) {
          console.warn(`Failed to load resume ${dir}:`, err)
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

  const pollPdfStatus = useCallback(
    async (jobId: string) => {
      const maxAttempts = 60
      const pollInterval = 1000
      let attempts = 0

      const poll = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          console.warn(`PDF generation polling timeout for job ${jobId}`)
          setPdfJobs((prev) =>
            prev.map((job) => (job.jobId === jobId ? { ...job, status: 'failed' as const } : job)),
          )
          return
        }

        try {
          const response = await fetch(`/api/pdf/status?jobId=${jobId}`)

          if (response.status === 404) {
            console.warn(
              `PDF job ${jobId} not found (may have been cleaned up or server restarted)`,
            )
            setPdfJobs((prev) => prev.filter((job) => job.jobId !== jobId))
            return
          }

          const result = await response.json()

          if (!result.success) {
            console.error('Failed to fetch PDF status:', result.error)
            setPdfJobs((prev) =>
              prev.map((job) =>
                job.jobId === jobId ? { ...job, status: 'failed' as const } : job,
              ),
            )
            return
          }

          const { job } = result

          if (!job) {
            console.warn(`No job data returned for ${jobId}`)
            return
          }

          if (job.status === 'complete') {
            console.log(`PDF generation completed for job ${jobId}`)
            setPdfJobs((prev) =>
              prev.map((j) => (j.jobId === jobId ? { ...j, status: 'complete' as const } : j)),
            )

            if (currentDirectory) {
              console.log(`🔄 Reloading directory to fetch updated PDF metadata`)
              await loadDirectory(currentDirectory)
            }

            return
          }

          if (job.status === 'failed') {
            console.error(`PDF generation failed for job ${jobId}`)
            setPdfJobs((prev) =>
              prev.map((j) => (j.jobId === jobId ? { ...j, status: 'failed' as const } : j)),
            )
            return
          }

          attempts++
          setTimeout(poll, pollInterval)
        } catch (err) {
          console.error(`Error polling PDF status for job ${jobId}:`, err)
          setPdfJobs((prev) =>
            prev.map((job) => (job.jobId === jobId ? { ...job, status: 'failed' as const } : job)),
          )
        }
      }

      await poll()
    },
    [currentDirectory, loadDirectory],
  )

  const updateDataPath = useCallback(
    async (yamlPath: string, value: unknown) => {
      if (!currentDirectory) {
        throw new Error('No directory loaded')
      }

      setLoading(true)
      setError(null)

      const setNestedValue = (obj: CVData, path: string, newValue: unknown): CVData => {
        const keys = path.split(/[.[\]]/).filter(Boolean)
        const result = { ...obj }
        let current: unknown = result

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]
          if (typeof current === 'object' && current !== null) {
            const currentObj = current as Record<string, unknown>
            const value = currentObj[key]

            if (Array.isArray(value)) {
              currentObj[key] = [...value]
            } else if (typeof value === 'object' && value !== null) {
              currentObj[key] = { ...value }
            } else {
              currentObj[key] = value
            }

            current = currentObj[key]
          }
        }

        if (typeof current === 'object' && current !== null) {
          if (Array.isArray(current)) {
            const index = parseInt(keys[keys.length - 1], 10)
            ;(current as unknown[])[index] = newValue
          } else {
            ;(current as Record<string, unknown>)[keys[keys.length - 1]] = newValue
          }
        }

        return result
      }

      const extractTopLevelKey = (path: string): string => {
        const match = path.match(/^([^.[]+)/)
        return match ? match[1] : path
      }

      const deriveDirectoryFromSources = (
        section: string,
        currentSources: Record<string, string | string[]>,
        path: string,
      ): string => {
        const sourceFile = currentSources[section]
        if (!sourceFile) {
          return currentDirectory
        }

        let sourcePath: string
        if (Array.isArray(sourceFile)) {
          const arrayIndexMatch = path.match(ARRAY_INDEX_PATTERN)
          const arrayIndex = arrayIndexMatch ? parseInt(arrayIndexMatch[1], 10) : 0
          sourcePath = sourceFile[arrayIndex] || sourceFile[0]
        } else {
          sourcePath = sourceFile
        }

        const withoutPii = sourcePath.replace(/^pii\//, '')
        const dirPath = withoutPii.substring(0, withoutPii.lastIndexOf('/'))

        return dirPath || currentDirectory
      }

      try {
        const optimisticData = data ? setNestedValue(data, yamlPath, value) : data

        if (optimisticData && currentResumeKey) {
          setAllResumes((prev) => ({
            ...prev,
            [currentResumeKey]: {
              ...prev[currentResumeKey],
              data: optimisticData,
            },
          }))
          setRecentUpdateTimestamp(Date.now())
        }

        const section = extractTopLevelKey(yamlPath)

        console.log(
          `🔍 DEBUG deriveDirectory inputs:`,
          `\n  section=${section}`,
          `\n  yamlPath=${yamlPath}`,
          `\n  sources=${JSON.stringify(sources, null, 2)}`,
          `\n  sources[section]=${JSON.stringify(sources[section])}`,
        )

        const targetDirectory = deriveDirectoryFromSources(section, sources, yamlPath)

        console.log(
          `🎯 Update target: section=${section}, directory=${targetDirectory}, yamlPath=${yamlPath}`,
        )

        const response = await fetch('/api/directory/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directoryPath: targetDirectory,
            yamlPath,
            value,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to update data')
        }

        if (result.pdf?.jobId) {
          const pdfTypes = result.pdf.pdfsToRegenerate || ['resume']
          setPdfJobs((prev) => [
            ...prev,
            {
              jobId: result.pdf.jobId,
              pdfTypes,
              status: 'processing',
            },
          ])
          pollPdfStatus(result.pdf.jobId)
        }

        setHasUnsavedChanges(false)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update data'
        setError(errorMsg)
        console.error('Error updating data path:', err)

        if (currentDirectory) {
          await loadDirectory(currentDirectory)
        }

        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentDirectory, currentResumeKey, data, sources, loadDirectory, pollPdfStatus],
  )

  const saveDirectory = useCallback(async () => {
    // In directory mode, saves are immediate (no temp files)
    // This is a no-op for compatibility
    setHasUnsavedChanges(false)
  }, [])

  const discardChanges = useCallback(async () => {
    if (currentDirectory) {
      // Reload directory to discard any unsaved changes
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

      // Store hierarchy info if needed
      console.log('Hierarchy:', result.hierarchy)
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

      console.log('Directory files:', result.files)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to list files'
      setError(errorMsg)
      console.error('Error listing directory files:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Always fetch ALL files from 'resumes' directory recursively
      // This ensures users can see and navigate to all files regardless of selected directory
      const response = await fetch(
        `/api/directory/files?path=${encodeURIComponent('resumes')}&recursive=true`,
      )
      const result = await response.json()

      if (result.success) {
        setFiles(result.files)
      } else {
        setError(result.error || 'Failed to refresh files')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh files')
    } finally {
      setLoading(false)
    }
  }, [])

  const createDirectory = useCallback(
    async (parentPath: string, directoryName: string) => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/directory/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentPath, directoryName }),
        })

        const result = await response.json()

        if (result.success) {
          await refreshFiles()
        } else {
          setError(result.error || 'Failed to create directory')
          throw new Error(result.error || 'Failed to create directory')
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create directory'
        setError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refreshFiles],
  )

  const splitSectionToFile = useCallback(
    async (sourceFilePath: string, sectionKeys: string[], targetFileName: string) => {
      try {
        setLoading(true)
        setError(null)

        const mergedData = currentResume?.data

        const response = await fetch('/api/directory/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceFilePath,
            sectionKeys,
            targetFileName,
            mergedData,
          }),
        })

        const result = await response.json()

        if (result.success) {
          if (currentDirectory) {
            await loadDirectory(currentDirectory)
          }
          await refreshFiles()
        } else {
          setError(result.error || 'Failed to split section')
          throw new Error(result.error || 'Failed to split section')
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to split section'
        setError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentDirectory, currentResume, loadDirectory, refreshFiles],
  )

  const deleteFileToDeleted = useCallback(
    async (filePath: string) => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/directory/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        })

        const result = await response.json()

        if (result.success) {
          await refreshFiles()
        } else {
          setError(result.error || 'Failed to delete file')
          throw new Error(result.error || 'Failed to delete file')
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete file'
        setError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refreshFiles],
  )

  // Compatibility methods for EditableField
  const updateContent = useCallback((_newContent: string) => {
    // This is called by EditableField but we handle updates differently in directory mode
    // We'll parse the content and trigger a full update
    console.warn('updateContent called in directory mode - this should use updateDataPath instead')
    setHasUnsavedChanges(true)
  }, [])

  const saveFile = useCallback(
    async (_commit?: boolean, _message?: string) => {
      // Compatibility method - in directory mode, saves are immediate
      await saveDirectory()
    },
    [saveDirectory],
  )

  const handleReloadEvent = useCallback(
    async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'connected') {
          console.log('[Reload] SSE connected')
          return
        }

        console.log('[Reload] File change detected:', payload)
        const changedPath = payload.path

        if (!currentResumeKey) {
          console.log('[Reload] No current resume loaded, skipping reload')
          return
        }

        const now = Date.now()
        const timeSinceLastUpdate = recentUpdateTimestamp ? now - recentUpdateTimestamp : Infinity

        if (timeSinceLastUpdate < 2000) {
          console.log(
            `[Reload] ⏭️  Skipping reload - recent update from this client (${timeSinceLastUpdate}ms ago)`,
          )
          return
        }

        const normalizedResumeKey = currentResumeKey.replace(/^resumes\//, '')
        const shouldReload =
          changedPath.startsWith(normalizedResumeKey) || changedPath.startsWith(currentResumeKey)

        console.log(
          `[Reload] Path matching: changedPath="${changedPath}", currentResumeKey="${currentResumeKey}", normalizedKey="${normalizedResumeKey}", shouldReload=${shouldReload}`,
        )

        if (shouldReload) {
          console.log(`[Reload] Reloading current resume: ${currentResumeKey}`)

          try {
            const response = await fetch(
              `/api/directory/load?path=${encodeURIComponent(currentResumeKey)}`,
            )
            const result = await response.json()

            if (result.success) {
              setAllResumes((prev) => ({
                ...prev,
                [currentResumeKey]: {
                  data: result.data,
                  sources: result.sources,
                  metadata: result.metadata,
                  pdfMetadata: result.pdfMetadata,
                  validationErrors: result.validationErrors,
                },
              }))
              console.log(`[Reload] ✓ Updated resume data for ${currentResumeKey}`)
            }
          } catch (err) {
            console.error(`[Reload] Failed to reload:`, err)
          }
        }
      } catch (err) {
        console.error('[Reload] Error handling SSE event:', err)
      }
    },
    [currentResumeKey, recentUpdateTimestamp],
  )

  useEffect(() => {
    const eventSource = new EventSource('/api/directory/reload')

    eventSource.onmessage = handleReloadEvent

    eventSource.onerror = (err) => {
      console.error('[Reload] SSE connection error:', err)
    }

    return () => {
      eventSource.close()
    }
  }, [handleReloadEvent])

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
    refreshFiles,
    createDirectory,
    splitSectionToFile,
    deleteFileToDeleted,
    updateContent,
    saveFile,
  }

  return (
    <DirectoryManagerContext.Provider value={value}>{children}</DirectoryManagerContext.Provider>
  )
}
