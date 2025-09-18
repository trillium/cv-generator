"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllResumeFiles, type FileListResponse } from "../lib/utility";
import { encodeFilePathForUrl } from "../src/utils/urlSafeEncoding";

export default function HomePage() {
  const [files, setFiles] = useState<FileListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        const response = await listAllResumeFiles();
        if (response.success && response.data) {
          setFiles(response.data);
        } else {
          throw new Error(response.error || "Failed to load files");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load files");
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading available resumes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Filter for YAML resume files
  const resumeFiles =
    files?.allFiles.filter(
      (file: string) =>
        file.endsWith(".yml") &&
        !file.includes(".backup.") &&
        !file.includes(".temp.") &&
        file !== "data.yml.template",
    ) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Available Resumes
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Found {resumeFiles.length} resume files. Click any to view in
              single-column format.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Total files in workspace: {files?.totalFiles || 0}
            </p>
          </div>

          {resumeFiles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-600 dark:text-gray-400">
                No resume files found.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resumeFiles.map((file: string) => {
                // Create a clean display name and URL-safe path using our encoding utility
                const displayName = file.replace(".yml", "");
                const urlPath = encodeFilePathForUrl(file);

                return (
                  <div
                    key={file}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-lg transition-all bg-white dark:bg-gray-800 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          {displayName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          File: {file}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/single-column/resume/${urlPath}`}
                          className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                        >
                          View Resume
                        </Link>
                        <Link
                          href={`/single-column/resume`}
                          className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-800 transition-colors"
                        >
                          Default View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
