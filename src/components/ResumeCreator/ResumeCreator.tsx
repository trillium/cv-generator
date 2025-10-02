import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiClipboard } from "react-icons/fi";
import { useFileManager } from "../../contexts/FileManagerContext";
import * as yaml from "js-yaml";
import {
  listAllResumeFiles,
  duplicateResume,
  type FileListResponse,
} from "../../../lib/utility";

interface CreatedResume {
  fileName: string;
  position: string;
  company?: string;
}

interface ResumeCreatorProps {
  onClose: () => void;
  onResumeCreated: (resume: CreatedResume) => void;
}

const ResumeCreator: React.FC<ResumeCreatorProps> = ({
  onClose,
  onResumeCreated,
}) => {
  const router = useRouter();
  const { createNewFile, loading } = useFileManager();

  // Form state
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Folder structure state
  const [folderStructure, setFolderStructure] =
    useState<FileListResponse | null>(null);
  const [folderLoading, setFolderLoading] = useState(true);
  const [folderError, setFolderError] = useState<string | null>(null);

  // Copy operation state
  const [copyingFile, setCopyingFile] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Build directory tree from file paths
  const buildDirectoryTree = (files: string[]): Record<string, unknown> => {
    const tree: Record<string, unknown> = {};

    files.forEach((file) => {
      const parts = file.split("/");
      let current: Record<string, unknown> = tree;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? null : {};
        }
        if (typeof current[part] === "object" && current[part] !== null) {
          current = current[part] as Record<string, unknown>;
        }
      });
    });

    return tree;
  };

  // Render directory tree as ASCII art
  const renderDirectoryTree = (
    tree: Record<string, unknown>,
    prefix = "",
    isLast = true,
  ): string[] => {
    const lines: string[] = [];
    const entries = Object.keys(tree).sort();

    entries.forEach((entry, index) => {
      const isLastEntry = index === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const nextPrefix = prefix + (isLast ? "    " : "│   ");

      const subtree = tree[entry];
      const isFile = subtree === null;
      const displayName = isFile ? entry : entry + "/";

      lines.push(prefix + connector + displayName);

      if (subtree && typeof subtree === "object" && subtree !== null) {
        lines.push(
          ...renderDirectoryTree(
            subtree as Record<string, unknown>,
            nextPrefix,
            isLastEntry,
          ),
        );
      }
    });

    return lines;
  };

  // Helper function to render tree lines with copy buttons for .yml files
  const renderTreeLines = (files: string[]) => {
    const tree = buildDirectoryTree(files);
    const treeLines = renderDirectoryTree(tree);
    return treeLines.map((line: string, index: number) => {
      // Check if this line represents a .yml file
      const isYmlFile =
        line.trim().endsWith(".yml") || line.trim().endsWith('.yml"');
      const fileName = line
        .trim()
        .replace(/["└──├──│├─└─]/g, "")
        .trim();

      if (isYmlFile && fileName.endsWith(".yml")) {
        return (
          <div
            key={index}
            className="leading-relaxed mb-1 flex items-center justify-between group"
          >
            <span className="flex-1">{line}</span>
            <button
              onClick={() => handleCopyResume(fileName)}
              disabled={copyingFile === fileName}
              className="ml-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors disabled:cursor-not-allowed flex items-center gap-1.5"
              title={`Copy ${fileName} to timestamped subfolder`}
            >
              {copyingFile === fileName ? (
                "..."
              ) : (
                <>
                  <FiClipboard size={14} />
                  Copy
                </>
              )}
            </button>
          </div>
        );
      }

      return (
        <div key={index} className="leading-relaxed mb-1">
          {line}
        </div>
      );
    });
  };

  // Handle copying a resume file to a timestamped subfolder
  const handleCopyResume = async (sourceFile: string) => {
    setCopyingFile(sourceFile);
    setCopyError(null);

    try {
      // Generate timestamp for subfolder
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const fileName = sourceFile.replace(".yml", "");
      const subfolderName = `${fileName}_${timestamp}`;
      const destinationPath = `${subfolderName}/data.yml`;

      console.log(`Copying ${sourceFile} to ${destinationPath}`);

      // Copy the file
      const copyResult = await duplicateResume(sourceFile, destinationPath);
      if (!copyResult.success) {
        throw new Error(copyResult.error || "Failed to copy resume");
      }

      // Refresh folder structure
      const refreshResult = await listAllResumeFiles();
      if (refreshResult.success && refreshResult.data) {
        setFolderStructure(refreshResult.data);
      }

      // Navigate to the new resume
      const newResumePath = `${subfolderName}/data.yml`;
      router.push(
        `/single-column/resume?resume=${encodeURIComponent(newResumePath)}`,
      );

      // Close the modal
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to copy resume";
      setCopyError(errorMessage);
      console.error("Copy resume error:", err);
    } finally {
      setCopyingFile(null);
    }
  };

  // Fetch folder structure on component mount
  useEffect(() => {
    const fetchFolderStructure = async () => {
      try {
        setFolderLoading(true);
        setFolderError(null);
        const response = await listAllResumeFiles();

        if (response.success && response.data) {
          setFolderStructure(response.data);
        } else {
          throw new Error(response.error || "Failed to load folder structure");
        }
      } catch (err) {
        setFolderError(
          err instanceof Error
            ? err.message
            : "Failed to load folder structure",
        );
      } finally {
        setFolderLoading(false);
      }
    };

    fetchFolderStructure();
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (!position.trim()) {
      setError("Position is required");
      return;
    }

    try {
      const templateData = {
        info: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: position.trim(),
        },
        header: {
          name: "",
          title: [],
          resume: [],
        },
        workExperience: [],
        profile: {
          shouldDisplayProfileImage: false,
          lines: [],
          links: [],
        },
        technical: [],
        languages: [],
        education: [],
        projects: [],
        coverLetter: [],
        careerSummary: [],
      };

      const fileName = `${position.trim().toLowerCase().replace(/\s+/g, "-")}.yml`;
      const yamlContent = yaml.dump(templateData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });

      await createNewFile(fileName, yamlContent, true);

      onResumeCreated({
        position: position.trim(),
        company: company.trim(),
        fileName,
      });

      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resume");
    }
  };

  const resetForm = () => {
    setPosition("");
    setCompany("");
    setDescription("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Create New Resume
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Create a new resume file with a basic template
        </p>
      </div>

      {/* Folder Structure Display */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          📁 Current Folder Structure
        </h3>

        {folderLoading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Loading folder structure...
            </span>
          </div>
        )}

        {folderError && !folderLoading && (
          <div className="text-sm text-red-600 dark:text-red-400">
            ❌ Error loading folder structure: {folderError}
          </div>
        )}

        {copyError && (
          <div className="text-sm text-red-600 dark:text-red-400">
            ❌ Error copying file: {copyError}
          </div>
        )}

        {folderStructure && !folderLoading && !folderError && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                📂 Directory Structure:
              </h4>
              <div className="max-h-64 overflow-y-auto bg-gray-900 dark:bg-gray-900 rounded p-3">
                {folderStructure.allFiles.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No files found</p>
                ) : (
                  <div className="font-mono text-base text-green-400 space-y-1">
                    <div className="mb-3 text-gray-300">pii/</div>
                    {renderTreeLines(folderStructure.allFiles)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Position */}
        <div>
          <label
            htmlFor="position"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Position <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g., software-engineer, frontend-developer"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Company
          </label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name (optional)"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this resume version"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border border-transparent bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Resume"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeCreator;
