"use client";

import { useState, useEffect } from "react";
import { useFileManager } from "@/contexts/FileManagerContext.hook";
import { DirectoryFileInfo } from "@/contexts/FileManagerContext";
import {
  MdFolder,
  MdFolderOpen,
  MdInsertDriveFile,
  MdCircle,
} from "react-icons/md";

interface EditingFieldState {
  path: string;
  value: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
  file?: DirectoryFileInfo;
}

function PageHeader({ currentDirectory }: { currentDirectory: string | null }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        File Manager
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        Path: {currentDirectory || "No directory loaded"}
      </p>
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p className="text-red-600 dark:text-red-400">{error}</p>
    </div>
  );
}

function buildTree(files: DirectoryFileInfo[]): TreeNode[] {
  const tree: Record<string, TreeNode> = {};

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentPath = "";

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!tree[currentPath]) {
        tree[currentPath] = {
          name: part,
          path: currentPath,
          type: isLast ? "file" : "directory",
          children: [],
          file: isLast ? file : undefined,
        };
      }

      if (parentPath && tree[parentPath]) {
        const parent = tree[parentPath];
        if (!parent.children) parent.children = [];
        if (!parent.children.find((c) => c.path === currentPath)) {
          parent.children.push(tree[currentPath]);
        }
      }
    });
  });

  const rootNodes = Object.values(tree).filter((node) => {
    const depth = node.path.split("/").length;
    return depth === 1;
  });

  return rootNodes;
}

function TreeNodeItem({
  node,
  depth,
  selectedFile,
  onSelectFile,
  onSelectDirectory,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onSelectDirectory: (path: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isSelected = selectedFile === node.path;
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = depth * 16;

  function handleClick() {
    if (node.type === "directory") {
      setIsExpanded(!isExpanded);
      onSelectDirectory(node.path);
    } else {
      onSelectFile(node.path);
    }
  }

  return (
    <>
      <div
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors ${
          isSelected
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            : "hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
      >
        {node.type === "directory" && (
          <span className="mr-1.5 text-gray-500 dark:text-gray-400">
            {hasChildren ? (
              isExpanded ? (
                <MdFolderOpen className="inline w-4 h-4" />
              ) : (
                <MdFolder className="inline w-4 h-4" />
              )
            ) : (
              <MdCircle className="inline w-3 h-3" />
            )}
          </span>
        )}
        {node.type === "file" && (
          <span className="mr-1.5 text-gray-400 dark:text-gray-500">
            <MdInsertDriveFile className="inline w-4 h-4" />
          </span>
        )}
        <span
          className={`text-sm ${
            node.type === "directory"
              ? "font-medium text-gray-900 dark:text-gray-100"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {node.name}
        </span>
        {node.file && (
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            {node.file.sections.length > 0 &&
              `(${node.file.sections.join(", ")})`}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onSelectDirectory={onSelectDirectory}
            />
          ))}
        </div>
      )}
    </>
  );
}

function DirectoryTree({
  files,
  selectedFile,
  onSelectFile,
  onSelectDirectory,
  loading,
}: {
  files: DirectoryFileInfo[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onSelectDirectory: (path: string) => void;
  loading: boolean;
}) {
  const tree = buildTree(files);

  return (
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
        <div className="space-y-0.5">
          {tree.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onSelectDirectory={onSelectDirectory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DirectoryInfo({
  directoryPath,
  filesLoaded,
  loadedDirectories,
}: {
  directoryPath: string;
  filesLoaded: number;
  loadedDirectories: string[];
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Directory Info
      </h2>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Path:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {directoryPath}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">
            Files Loaded:
          </span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {filesLoaded}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Loaded From:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
            {loadedDirectories.join(" → ")}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionSources({ sources }: { sources: Record<string, string> }) {
  if (Object.keys(sources).length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Section Sources
      </h2>
      <div className="space-y-1 text-xs">
        {Object.entries(sources).map(([section, source]) => (
          <div key={section} className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{section}:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {String(source)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataPreview({ data }: { data: unknown }) {
  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Directory Data
      </h2>
      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-96 text-gray-900 dark:text-gray-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function SelectedFileInfo({
  selectedFile,
  files,
}: {
  selectedFile: string | null;
  files: DirectoryFileInfo[];
}) {
  if (!selectedFile) return null;

  const fileInfo = files.find((f) => f.path === selectedFile);
  if (!fileInfo) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Selected File
      </h2>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Path:</span>
          <div className="font-mono text-xs text-gray-900 dark:text-gray-100">
            {fileInfo.path}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Format:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {fileInfo.format.toUpperCase()}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Type:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {fileInfo.isFullData ? "Full Data" : "Section Specific"}
          </div>
        </div>
        {fileInfo.sections.length > 0 && (
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Sections ({fileInfo.sections.length}):
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {fileInfo.sections.map((section) => (
                <span
                  key={section}
                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButtons({
  hasUnsavedChanges,
  loading,
  onDiscard,
  onSave,
  onSaveAndCommit,
}: {
  hasUnsavedChanges: boolean;
  loading: boolean;
  onDiscard: () => void;
  onSave: () => void;
  onSaveAndCommit: () => void;
}) {
  return (
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
  );
}

function EditFieldModal({
  editingField,
  onSave,
  onCancel,
  onChange,
}: {
  editingField: EditingFieldState;
  onSave: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {
  return (
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
  );
}

function CreateDirectoryModal({
  currentDirectory,
  onClose,
  onCreate,
}: {
  currentDirectory: string;
  onClose: () => void;
  onCreate: (directoryName: string) => void;
}) {
  const [directoryName, setDirectoryName] = useState("");

  function handleCreate() {
    if (directoryName.trim()) {
      onCreate(directoryName.trim());
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Create New Directory
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Parent: {currentDirectory}
          </label>
          <input
            type="text"
            value={directoryName}
            onChange={(e) => setDirectoryName(e.target.value)}
            placeholder="Directory name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
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
      </div>
    </div>
  );
}

function SplitSectionModal({
  selectedFile,
  onClose,
  onSplit,
}: {
  selectedFile: string;
  onClose: () => void;
  onSplit: (sectionKey: string, targetFileName: string) => void;
}) {
  const [sectionKey, setSectionKey] = useState("");
  const [targetFileName, setTargetFileName] = useState("");

  function handleSplit() {
    if (sectionKey.trim() && targetFileName.trim()) {
      onSplit(sectionKey.trim(), targetFileName.trim());
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Split Section to New File
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source File: {selectedFile}
          </label>
          <input
            type="text"
            value={sectionKey}
            onChange={(e) => setSectionKey(e.target.value)}
            placeholder="Section key (e.g., workExperience)"
            className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            value={targetFileName}
            onChange={(e) => setTargetFileName(e.target.value)}
            placeholder="Target file name (e.g., work.yml)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleSplit()}
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
            onClick={handleSplit}
            disabled={!sectionKey.trim() || !targetFileName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Split
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteFileModal({
  selectedFile,
  onClose,
  onDelete,
}: {
  selectedFile: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Delete File
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Are you sure you want to delete <strong>{selectedFile}</strong>?
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The file will be moved to the deleted/ folder.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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
    createDirectory,
    splitSectionToFile,
    deleteFileToDeleted,
  } = useFileManager();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditingFieldState | null>(
    null,
  );
  const [showCreateDirModal, setShowCreateDirModal] = useState(false);
  const [showSplitSectionModal, setShowSplitSectionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (currentDirectory) {
      loadDirectory(currentDirectory);
    }
  }, []);

  async function handleSave() {
    await saveChanges(false);
  }

  async function handleSaveAndCommit() {
    await saveChanges(true);
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

  function handleFieldChange(value: string) {
    if (editingField) {
      setEditingField({ ...editingField, value });
    }
  }

  async function handleCreateDirectory(directoryName: string) {
    if (!currentDirectory) return;
    try {
      await createDirectory(currentDirectory, directoryName);
      setShowCreateDirModal(false);
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
      setShowSplitSectionModal(false);
    } catch (err) {
      console.error("Failed to split section:", err);
    }
  }

  async function handleDeleteFile() {
    if (!selectedFile) return;
    try {
      await deleteFileToDeleted(selectedFile);
      setShowDeleteModal(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <PageHeader currentDirectory={currentDirectory} />

        {error && <ErrorDisplay error={error} />}

        <div className="mb-4 flex gap-3">
          <button
            onClick={() => setShowCreateDirModal(true)}
            disabled={!currentDirectory || loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Directory
          </button>
          <button
            onClick={() => setShowSplitSectionModal(true)}
            disabled={!selectedFile || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Split Section
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!selectedFile || loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              onSelectDirectory={(dirPath) => loadDirectory(dirPath)}
              loading={loading}
            />
          </div>

          <div className="space-y-6">
            {selectedFile && (
              <SelectedFileInfo selectedFile={selectedFile} files={files} />
            )}

            {directoryMetadata && (
              <DirectoryInfo
                directoryPath={directoryMetadata.directoryPath}
                filesLoaded={directoryMetadata.filesLoaded.length}
                loadedDirectories={directoryMetadata.loadedDirectories}
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

        {showCreateDirModal && currentDirectory && (
          <CreateDirectoryModal
            currentDirectory={currentDirectory}
            onClose={() => setShowCreateDirModal(false)}
            onCreate={handleCreateDirectory}
          />
        )}

        {showSplitSectionModal && selectedFile && (
          <SplitSectionModal
            selectedFile={selectedFile}
            onClose={() => setShowSplitSectionModal(false)}
            onSplit={handleSplitSection}
          />
        )}

        {showDeleteModal && selectedFile && (
          <DeleteFileModal
            selectedFile={selectedFile}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDeleteFile}
          />
        )}
      </div>
    </div>
  );
}
