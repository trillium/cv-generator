"use client";

import { useState, useEffect } from "react";
import { useFileManager } from "../../src/contexts/FileManagerContext.hook";
import { DirectoryFileInfo } from "../../src/contexts/FileManagerContext";

export default function FileManagerFeature() {
  const {
    currentDirectory,
    directoryMetadata,
    sources,
    parsedData,
    hasUnsavedChanges,
    loading,
    error,
    files,
    loadDirectory,
    updateField,
    saveChanges,
    discardChanges,
  } = useFileManager();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{
    path: string;
    value: string;
  } | null>(null);

  useEffect(() => {
    if (currentDirectory) {
      loadDirectory(currentDirectory);
    }
  }, []);

  async function handleSave(commit = false) {
    await saveChanges(commit);
  }

  async function handleDiscard() {
    await discardChanges();
  }

  async function handleFieldSave() {
    if (editingField) {
      await updateField(editingField.path, editingField.value);
      setEditingField(null);
    }
  }

  function handleFieldCancel() {
    setEditingField(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            File Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your resume directory:{" "}
            {currentDirectory || "No directory loaded"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Files in Directory
              </h2>

              {loading ? (
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              ) : files.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No files found in this directory
                </p>
              ) : (
                <div className="space-y-2">
                  {files.map((file: DirectoryFileInfo) => (
                    <div
                      key={file.path}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedFile === file.path
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedFile(file.path)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {file.path}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Sections: {file.sections.join(", ")}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Format: {file.format}
                            {file.isFullData && " (Full Data)"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {directoryMetadata && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Directory Info
                </h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Path:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {directoryMetadata.directoryPath}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Files Loaded:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {directoryMetadata.filesLoaded.length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Loaded From:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                      {directoryMetadata.loadedDirectories.join(" → ")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sources && Object.keys(sources).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Section Sources
                </h2>
                <div className="space-y-1 text-xs">
                  {Object.entries(sources).map(([section, source]) => (
                    <div key={section} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {section}:
                      </span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {String(source)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {parsedData && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Directory Data
            </h2>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-96 text-gray-900 dark:text-gray-100">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </div>
        )}

        {currentDirectory && (
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={handleDiscard}
              disabled={!hasUnsavedChanges || loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={!hasUnsavedChanges || loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!hasUnsavedChanges || loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save & Commit
            </button>
          </div>
        )}

        {editingField && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Edit Field
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Path: {editingField.path}
                </label>
                <input
                  type="text"
                  value={editingField.value}
                  onChange={(e) =>
                    setEditingField({ ...editingField, value: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleFieldCancel}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFieldSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Field
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
