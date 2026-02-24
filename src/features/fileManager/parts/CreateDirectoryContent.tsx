import type * as React from 'react'
import { useState } from 'react'
import { useModal } from '@/contexts/ModalContext'

interface CreateDirectoryContentProps {
  currentDirectory: string
  onClose: () => void
  onCreate: (directoryName: string) => void
}

const CreateDirectoryContent: React.FC<CreateDirectoryContentProps> = ({
  currentDirectory,
  onClose,
  onCreate,
}) => {
  const [directoryName, setDirectoryName] = useState('')
  const { useAutoFocus } = useModal()
  const inputRef = useAutoFocus<HTMLInputElement>()

  function handleCreate() {
    console.log('handleCreate', directoryName)
    if (directoryName.trim()) {
      onCreate(directoryName.trim())
    }
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Create New Directory
      </h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Parent: {currentDirectory}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={directoryName}
          onChange={(e) => setDirectoryName(e.target.value)}
          placeholder="Directory name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!directoryName.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create
        </button>
      </div>
    </>
  )
}

export default CreateDirectoryContent
