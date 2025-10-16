"use client";

import { useState, useEffect } from "react";
import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";
import { useModal } from "@/contexts/ModalContext";
import PageHeader from "./parts/PageHeader";
import ErrorDisplay from "./parts/ErrorDisplay";
import DirectoryTree from "./parts/DirectoryTree";
import DirectoryInfo from "./parts/DirectoryInfo";
import SectionSources from "./parts/SectionSources";
import DataPreview from "./parts/DataPreview";
import SelectedFileInfo from "./parts/SelectedFileInfo";
import ActionButtons from "./parts/ActionButtons";
import EditFieldModal from "./parts/EditFieldModal";
import CreateDirectoryContent from "./parts/CreateDirectoryContent";
import SplitSectionContent from "./parts/SplitSectionContent";
import DeleteFileContent from "./parts/DeleteFileContent";
import { EditingFieldState } from "./parts/types";

export default function FileManagerFeature() {
  const {
    currentDirectory,
    metadata,
    sources,
    parsedData,
    hasUnsavedChanges,
    loading,
    error,
    files,
    loadAllResumes,
    setCurrentResume,
    updateDataPath,
    saveDirectory,
    discardChanges,
    createDirectory,
    splitSectionToFile,
    deleteFileToDeleted,
  } = useDirectoryManager();

  const { openModal, closeModal } = useModal();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditingFieldState | null>(
    null,
  );

  useEffect(() => {
    loadAllResumes().then(() => {
      if (!currentDirectory) {
        setCurrentResume("resumes");
      }
    });
  }, [loadAllResumes, setCurrentResume, currentDirectory]);

  async function handleSave() {
    await saveDirectory();
  }

  async function handleSaveAndCommit() {
    await saveDirectory();
  }

  async function handleDiscard() {
    await discardChanges();
  }

  async function handleFieldSave() {
    if (editingField) {
      await updateDataPath(editingField.path, editingField.value);
      setEditingField(null);
    }
  }

  function handleFieldCancel() {
    setEditingField(null);
  }

  function handleFieldChange(value: string) {
    if (editingField) {
      setEditingField({ ...editingField, value });
    }
  }

  async function handleCreateDirectory(directoryName: string) {
    if (!currentDirectory) return;
    try {
      await createDirectory(currentDirectory, directoryName);
      closeModal();
    } catch (err) {
      console.error("Failed to create directory:", err);
    }
  }

  async function handleSplitSection(
    sectionKey: string,
    targetFileName: string,
  ) {
    if (!selectedFile) return;
    try {
      await splitSectionToFile(selectedFile, sectionKey, targetFileName);
      closeModal();
    } catch (err) {
      console.error("Failed to split section:", err);
    }
  }

  async function handleDeleteFile() {
    if (!selectedFile) return;
    try {
      await deleteFileToDeleted(selectedFile);
      closeModal();
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  }

  function showCreateDirectoryModal() {
    if (!currentDirectory) return;
    openModal(
      <CreateDirectoryContent
        currentDirectory={currentDirectory}
        onClose={closeModal}
        onCreate={handleCreateDirectory}
      />,
      "md",
    );
  }

  function showSplitSectionModal() {
    if (!selectedFile) return;
    openModal(
      <SplitSectionContent
        selectedFile={selectedFile}
        onClose={closeModal}
        onSplit={handleSplitSection}
      />,
      "md",
    );
  }

  function showDeleteFileModal() {
    if (!selectedFile) return;
    openModal(
      <DeleteFileContent
        selectedFile={selectedFile}
        onClose={closeModal}
        onDelete={handleDeleteFile}
      />,
      "md",
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 rounded-md">
      <div className="max-w-full mx-auto p-6">
        <PageHeader currentDirectory={currentDirectory} />

        {error && <ErrorDisplay error={error} />}

        <div className="mb-4 flex gap-3">
          <button
            onClick={showCreateDirectoryModal}
            disabled={!currentDirectory || loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Directory
          </button>
          <button
            onClick={showSplitSectionModal}
            disabled={!selectedFile || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Split Section
          </button>
          <button
            onClick={showDeleteFileModal}
            disabled={!selectedFile || loading || selectedFile === "resumes"}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedFile === "resumes"
                ? "Cannot delete the root resumes folder"
                : ""
            }
          >
            Delete File
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DirectoryTree
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              loading={loading}
            />
          </div>

          <div className="space-y-6">
            {selectedFile && (
              <SelectedFileInfo selectedFile={selectedFile} files={files} />
            )}

            {metadata && (
              <DirectoryInfo
                directoryPath={metadata.directoryPath}
                filesLoaded={metadata.filesLoaded.length}
                loadedDirectories={metadata.loadedDirectories}
              />
            )}

            {sources && <SectionSources sources={sources} />}
          </div>
        </div>

        {parsedData && <DataPreview data={parsedData} />}

        {currentDirectory && (
          <ActionButtons
            hasUnsavedChanges={hasUnsavedChanges}
            loading={loading}
            onDiscard={handleDiscard}
            onSave={handleSave}
            onSaveAndCommit={handleSaveAndCommit}
          />
        )}

        {editingField && (
          <EditFieldModal
            editingField={editingField}
            onSave={handleFieldSave}
            onCancel={handleFieldCancel}
            onChange={handleFieldChange}
          />
        )}
      </div>
    </div>
  );
}
