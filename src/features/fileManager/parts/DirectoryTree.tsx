import type * as React from 'react'
import { useDirectoryManager } from '@/contexts/DirectoryManager/DirectoryManagerContext.hook'
import type { DirectoryFileInfo } from '@/lib/multiFileManager'
import TreeNodeItem from './TreeNodeItem'
import { buildTree } from './utils'

interface DirectoryTreeProps {
  files?: DirectoryFileInfo[]
  selectedFile: string | null
  onSelectFile: (path: string) => void
  loading?: boolean
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  files,
  selectedFile,
  onSelectFile,
  loading,
}) => {
  // If files or loading are not provided, get them from directory manager context
  const directoryManager = useDirectoryManager()
  const effectiveFiles = files ?? directoryManager.files
  const effectiveLoading = loading ?? directoryManager.loading
  const tree = buildTree(effectiveFiles)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Files in Directory
      </h2>
      {effectiveLoading ? (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      ) : effectiveFiles.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No files found in this directory</p>
      ) : (
        <div className="space-y-0.5">
          {tree.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DirectoryTree
