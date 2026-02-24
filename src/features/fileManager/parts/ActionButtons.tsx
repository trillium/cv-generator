import type * as React from 'react'

interface ActionButtonsProps {
  hasUnsavedChanges: boolean
  loading: boolean
  onDiscard: () => void
  onSave: () => void
  onSaveAndCommit: () => void
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  hasUnsavedChanges,
  loading,
  onDiscard,
  onSave,
  onSaveAndCommit,
}) => (
  <div className="mt-6 flex gap-3 justify-end">
    <button
      onClick={onDiscard}
      disabled={!hasUnsavedChanges || loading}
      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Discard Changes
    </button>
    <button
      onClick={onSave}
      disabled={!hasUnsavedChanges || loading}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Save
    </button>
    <button
      onClick={onSaveAndCommit}
      disabled={!hasUnsavedChanges || loading}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Save & Commit
    </button>
  </div>
)

export default ActionButtons
