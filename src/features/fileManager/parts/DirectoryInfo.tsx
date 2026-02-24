import type * as React from 'react'

interface DirectoryInfoProps {
  directoryPath: string
  filesLoaded: number
  loadedDirectories: string[]
}

const DirectoryInfo: React.FC<DirectoryInfoProps> = ({
  directoryPath,
  filesLoaded,
  loadedDirectories,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Directory Info</h2>
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-gray-600 dark:text-gray-400">Path:</span>
        <div className="font-medium text-gray-900 dark:text-gray-100">{directoryPath}</div>
      </div>
      <div>
        <span className="text-gray-600 dark:text-gray-400">Files Loaded:</span>
        <div className="font-medium text-gray-900 dark:text-gray-100">{filesLoaded}</div>
      </div>
      <div>
        <span className="text-gray-600 dark:text-gray-400">Loaded From:</span>
        <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
          {loadedDirectories.join(' → ')}
        </div>
      </div>
    </div>
  </div>
)

export default DirectoryInfo
