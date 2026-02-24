'use client'

import { useState } from 'react'
import { useDirectoryManager } from '@/contexts/DirectoryManager/DirectoryManagerContext.hook'
import { ErrorState, LoadingState } from '@/src/components/SharedUIStates'

export default function PlaygroundPage() {
  const [inputPath, setInputPath] = useState('')
  const [submittedPath, setSubmittedPath] = useState<string | null>(null)
  const { currentDirectory, data, sources, metadata, loading, error, loadDirectory } =
    useDirectoryManager()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPath.trim()) {
      setSubmittedPath(inputPath.trim())
      await loadDirectory(inputPath.trim())
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Playground: Directory Data Explorer
      </h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Enter directory path (e.g. base/google)"
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Load Data
        </button>
      </form>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {submittedPath && (
        <div className="mb-4">
          <p>
            <span className="font-semibold text-gray-900 dark:text-white">Current Directory:</span>{' '}
            {currentDirectory || '(none)'}
          </p>
        </div>
      )}
      {data && (
        <div>
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Merged Data</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      {sources && Object.keys(sources).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Section Source Files
          </h2>
          <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
            {JSON.stringify(sources, null, 2)}
          </pre>
        </div>
      )}
      {metadata && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Directory Metadata
          </h2>
          <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
