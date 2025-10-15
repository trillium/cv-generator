"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useDirectoryManager } from "@/contexts/DirectoryManagerContext.hook";
import { useModal } from "@/contexts/ModalContext";

interface ResumeNavigatorProps {
  onSelectResume?: (dirPath: string) => void;
}

interface DirectoryInfo {
  name: string;
  path: string;
}

function ResumeNavigator({ onSelectResume }: ResumeNavigatorProps) {
  const { closeModal } = useModal();
  const router = useRouter();
  const { loading: contextLoading, error: contextError } =
    useDirectoryManager();
  const [directories, setDirectories] = useState<DirectoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDirectories();
  }, []);

  const loadDirectories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/directory/hierarchy?path=${encodeURIComponent(process.env.NEXT_PUBLIC_PII_PATH || "pii")}`,
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load directories");
      }

      const dirs = extractDirectories(result.hierarchy);
      setDirectories(dirs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load directories",
      );
    } finally {
      setLoading(false);
    }
  };

  const extractDirectories = (hierarchy: unknown): DirectoryInfo[] => {
    const dirs: DirectoryInfo[] = [];

    if (typeof hierarchy === "object" && hierarchy !== null) {
      Object.entries(hierarchy as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (typeof value === "object" && value !== null) {
            dirs.push({
              name: formatDirectoryName(key),
              path: key,
            });
          }
        },
      );
    }

    return dirs.sort((a, b) => a.name.localeCompare(b.name));
  };

  const formatDirectoryName = (dirName: string): string => {
    return dirName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const handleSelectResume = (dirPath: string) => {
    router.push(`/single-column/resume?dir=${encodeURIComponent(dirPath)}`);

    if (onSelectResume) {
      onSelectResume(dirPath);
    }

    closeModal();
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Resume Navigator
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Select a resume directory to view
        </p>
      </div>

      {(loading || contextLoading) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Loading directories...
          </p>
        </div>
      )}

      {(error || contextError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4 mb-4">
          <p className="text-red-800 dark:text-red-300">
            {error || contextError}
          </p>
        </div>
      )}

      {!loading && !error && directories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            No resume directories found
          </p>
        </div>
      )}

      {!loading && !error && directories.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {directories.map((dir) => (
            <div
              key={dir.path}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {dir.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {dir.path}
                </p>
              </div>
              <button
                onClick={() => handleSelectResume(dir.path)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t mt-4">
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ResumeNavigator;
