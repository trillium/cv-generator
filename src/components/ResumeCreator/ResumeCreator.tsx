import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDirectoryManager } from "@/contexts/DirectoryManagerContext.hook";

interface CreatedResume {
  directoryName: string;
  position: string;
  company?: string;
}

interface ResumeCreatorProps {
  onClose: () => void;
  onResumeCreated: (resume: CreatedResume) => void;
}

interface DirectoryInfo {
  name: string;
  path: string;
}

const ResumeCreator: React.FC<ResumeCreatorProps> = ({
  onClose,
  onResumeCreated,
}) => {
  const router = useRouter();
  const { loading: contextLoading, error: contextError } =
    useDirectoryManager();

  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [directories, setDirectories] = useState<DirectoryInfo[]>([]);
  const [loadingDirs, setLoadingDirs] = useState(true);

  useEffect(() => {
    loadDirectories();
  }, []);

  const loadDirectories = async () => {
    try {
      setLoadingDirs(true);
      const response = await fetch(
        `/api/directory/hierarchy?path=${encodeURIComponent(process.env.NEXT_PUBLIC_PII_PATH || "pii")}`,
      );
      const result = await response.json();

      if (result.success) {
        const dirs = extractDirectories(result.hierarchy);
        setDirectories(dirs);
      }
    } catch (err) {
      console.error("Failed to load directories:", err);
    } finally {
      setLoadingDirs(false);
    }
  };

  const extractDirectories = (hierarchy: unknown): DirectoryInfo[] => {
    const dirs: DirectoryInfo[] = [];

    const traverse = (node: Record<string, unknown>, path: string = "") => {
      Object.entries(node).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          const dirPath = path ? `${path}/${key}` : key;
          dirs.push({
            name: formatDirectoryName(key),
            path: dirPath,
          });
          traverse(value as Record<string, unknown>, dirPath);
        }
      });
    };

    traverse(hierarchy as Record<string, unknown>);
    return dirs;
  };

  const formatDirectoryName = (dirName: string): string => {
    return dirName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const handleSubmit = async () => {
    setError(null);

    if (!position.trim()) {
      setError("Position is required");
      return;
    }

    try {
      setCreating(true);

      const directoryName = position.trim().toLowerCase().replace(/\s+/g, "-");

      const response = await fetch("/api/directory/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentPath: process.env.NEXT_PUBLIC_PII_PATH || "pii",
          directoryName,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create directory");
      }

      onResumeCreated({
        position: position.trim(),
        company: company.trim(),
        directoryName,
      });

      router.push(
        `/single-column/resume?dir=${encodeURIComponent(result.path)}`,
      );
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resume");
    } finally {
      setCreating(false);
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

  const handleCopyDirectory = async (sourcePath: string) => {
    try {
      router.push(
        `/single-column/resume?dir=${encodeURIComponent(sourcePath)}`,
      );
      onClose();
    } catch (err) {
      console.error("Copy directory error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Create New Resume
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Create a new resume directory or copy an existing one
        </p>
      </div>

      {!loadingDirs && directories.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            📁 Existing Directories
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {directories.map((dir) => (
              <div
                key={dir.path}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded text-sm"
              >
                <span className="text-gray-900 dark:text-white">
                  {dir.name}
                </span>
                <button
                  onClick={() => handleCopyDirectory(dir.path)}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
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

        {(error || contextError) && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-300">
              {error || contextError}
            </div>
          </div>
        )}

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
            disabled={creating || contextLoading}
            className="rounded-md border border-transparent bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Resume"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeCreator;
