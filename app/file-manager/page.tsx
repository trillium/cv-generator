"use client";

import { useState, useEffect } from "react";
import { FileManagerProvider } from "../../src/contexts/FileManagerContext";
import { useFileManager } from "../../src/contexts/FileManagerContext.hook";
import FileBrowser from "../../src/components/FileManager/FileBrowser";
import VersionHistory from "../../src/components/FileManager/VersionHistory";
import QuickActions from "../../src/components/FileManager/QuickActions";
import DuplicateModal from "../../src/components/FileManager/DuplicateModal";
import RestoreModal from "../../src/components/FileManager/RestoreModal";
import { FileMetadata, Version } from "../../src/types/fileManager";

function FileManagerPage() {
  const {
    currentFile,
    content,
    hasUnsavedChanges,
    loading,
    error,
    loadFile,
    saveFile,
    discardChanges,
    duplicateFile,
    deleteFile,
    restoreVersion,
    refreshFiles,
    updateContent,
  } = useFileManager();

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  async function handleSelectFile(file: FileMetadata) {
    await loadFile(file.path);
  }

  async function handleDuplicateFile() {
    setShowDuplicateModal(true);
  }

  async function handleConfirmDuplicate(
    newName: string,
    tags?: string[],
    description?: string,
  ) {
    if (currentFile) {
      try {
        await duplicateFile(currentFile.path, newName, tags, description);
      } catch (err) {
        console.error("Failed to duplicate file:", err);
      }
    }
  }

  async function handleDeleteFile(file: FileMetadata) {
    if (
      confirm(
        `Are you sure you want to delete "${file.name}"? A backup will be created.`,
      )
    ) {
      try {
        await deleteFile(file.path);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }
  }

  async function handleRestoreVersion(versionPath: string) {
    if (currentFile) {
      try {
        await restoreVersion(currentFile.path, versionPath);
        setShowRestoreModal(false);
        setSelectedVersion(null);
      } catch (err) {
        console.error("Failed to restore version:", err);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            File Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your resume and LinkedIn YAML files
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Browser - Left Side */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <FileBrowser
                onSelectFile={handleSelectFile}
                onDuplicateFile={handleDuplicateFile}
                onDeleteFile={handleDeleteFile}
                selectedFile={currentFile?.path || null}
              />
            </div>
          </div>

          {/* File Details - Right Side */}
          <div className="space-y-6">
            {/* Current File Info */}
            {currentFile && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Current File
                </h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Name:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {currentFile.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Type:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {currentFile.type}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Size:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {(currentFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Modified:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(currentFile.modified).toLocaleString()}
                    </div>
                  </div>
                  {currentFile.tags.length > 0 && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Tags:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentFile.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {showVersionHistory ? "Hide" : "Show"} Version History
                </button>
              </div>
            )}

            {/* Version History */}
            {currentFile && showVersionHistory && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <VersionHistory
                  filePath={currentFile.path}
                  onRestore={() => {
                    setShowRestoreModal(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Editor */}
        {currentFile && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              File Content
            </h2>
            <textarea
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full h-96 font-mono text-sm p-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="YAML content..."
            />
          </div>
        )}

        {/* Quick Actions */}
        {currentFile && (
          <QuickActions
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={(commit) => saveFile(commit)}
            onDiscard={discardChanges}
            onDuplicate={() => setShowDuplicateModal(true)}
            onViewHistory={() => setShowVersionHistory(!showVersionHistory)}
            onEditTags={() => alert("Tag editor coming soon!")}
            onEditDescription={() => alert("Description editor coming soon!")}
            disabled={loading}
          />
        )}

        {/* Modals */}
        <DuplicateModal
          isOpen={showDuplicateModal}
          fileName={currentFile?.name || ""}
          onClose={() => setShowDuplicateModal(false)}
          onConfirm={handleConfirmDuplicate}
        />

        <RestoreModal
          isOpen={showRestoreModal}
          fileName={currentFile?.name || ""}
          version={selectedVersion}
          onClose={() => {
            setShowRestoreModal(false);
            setSelectedVersion(null);
          }}
          onConfirm={() => {
            if (selectedVersion) {
              handleRestoreVersion(selectedVersion.backupPath);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function FileManagerPageWrapper() {
  return (
    <FileManagerProvider>
      <FileManagerPage />
    </FileManagerProvider>
  );
}
