'use client'

import { useCallback } from 'react'
import {
  deriveDirectoryFromSources,
  deriveSourceFile,
  extractTopLevelKey,
} from '@/lib/multiFileManager/pathUtils'
import type { CVData } from '@/types'
import type { DirectoryLoadResult } from '@/types/multiFileManager.types'

function setNestedValueImmutable(obj: CVData, path: string, newValue: unknown): CVData {
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

interface UseDataUpdateDeps {
  currentDirectory: string | null
  currentResumeKey: string | null
  data: CVData | null
  sources: Record<string, string | string[]>
  loadDirectory: (path: string) => Promise<void>
  addPdfJob: (jobId: string, pdfTypes: string[]) => void
  setAllResumes: React.Dispatch<React.SetStateAction<Record<string, DirectoryLoadResult>>>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHasUnsavedChanges: (value: boolean) => void
  setRecentUpdateTimestamp: (timestamp: number | null) => void
}

export function useDataUpdate({
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
}: UseDataUpdateDeps) {
  const updateDataPath = useCallback(
    async (yamlPath: string, value: unknown) => {
      if (!currentDirectory) {
        throw new Error('No directory loaded')
      }

      setLoading(true)
      setError(null)

      try {
        const optimisticData = data ? setNestedValueImmutable(data, yamlPath, value) : data

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
        const targetDirectory = deriveDirectoryFromSources(
          section,
          sources,
          yamlPath,
          currentDirectory,
        )
        const sourceFile = deriveSourceFile(section, sources, yamlPath)

        const response = await fetch('/api/directory/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directoryPath: targetDirectory,
            yamlPath,
            value,
            sourceFile,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to update data')
        }

        if (result.pdf?.jobId) {
          const pdfTypes = result.pdf.pdfsToRegenerate || ['resume']
          addPdfJob(result.pdf.jobId, pdfTypes)
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
    [
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
    ],
  )

  return { updateDataPath }
}
