import type * as React from 'react'
import type { EditingFieldState } from './types'

interface EditFieldModalProps {
  editingField: EditingFieldState
  onSave: () => void
  onCancel: () => void
  onChange: (value: string) => void
}

const EditFieldModal: React.FC<EditFieldModalProps> = ({
  editingField,
  onSave,
  onCancel,
  onChange,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Field</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Path: {editingField.path}
        </label>
        <input
          type="text"
          value={editingField.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Field
        </button>
      </div>
    </div>
  </div>
)

export default EditFieldModal
