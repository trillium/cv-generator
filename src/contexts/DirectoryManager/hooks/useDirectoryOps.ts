'use client'

import { useCallback } from 'react'
import type { DirectoryFileInfo, DirectoryLoadResult } from '@/types/multiFileManager.types'

export function useDirectoryOps(
  currentDirectory: string | null,
  currentResume: DirectoryLoadResult | null,
  loadDirectory: (path: string) => Promise<void>,
  setFiles: React.Dispatch<React.SetStateAction<DirectoryFileInfo[]>>,
) {
  const refreshFiles = useCallback(async () => {
    const response = await fetch(
      `/api/directory/files?path=${encodeURIComponent('resumes')}&recursive=true`,
    )
    const result = await response.json()

    if (result.success) {
      setFiles(result.files)
    } else {
      throw new Error(result.error || 'Failed to refresh files')
    }
  }, [setFiles])

  const createDirectory = useCallback(
    async (parentPath: string, directoryName: string) => {
      const response = await fetch('/api/directory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPath, directoryName }),
      })

      const result = await response.json()

      if (result.success) {
        await refreshFiles()
      } else {
        throw new Error(result.error || 'Failed to create directory')
      }
    },
    [refreshFiles],
  )

  const splitSectionToFile = useCallback(
    async (sourceFilePath: string, sectionKeys: string[], targetFileName: string) => {
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
        throw new Error(result.error || 'Failed to split section')
      }
    },
    [currentDirectory, currentResume, loadDirectory, refreshFiles],
  )

  const deleteFileToDeleted = useCallback(
    async (filePath: string) => {
      const response = await fetch('/api/directory/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      })

      const result = await response.json()

      if (result.success) {
        await refreshFiles()
      } else {
        throw new Error(result.error || 'Failed to delete file')
      }
    },
    [refreshFiles],
  )

  return {
    refreshFiles,
    createDirectory,
    splitSectionToFile,
    deleteFileToDeleted,
  }
}
