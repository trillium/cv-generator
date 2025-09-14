"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllResumeFiles, type FileListResponse } from "../../lib/utility";
import { encodeFilePathForUrl } from "../../src/utils/urlSafeEncoding";

export default function ResumeListPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available resumes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600">{error}</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Available Resumes
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Found {resumeFiles.length} resume files. Click any to view in
              single-column format.
            </p>
            <p className="text-sm text-gray-500">
              Total files in workspace: {files?.totalFiles || 0}
            </p>
          </div>

          {resumeFiles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-600">No resume files found.</p>
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
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {displayName}
                        </h3>
                        <p className="text-sm text-gray-500">File: {file}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/single-column/resume/${urlPath}`}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          View Resume
                        </Link>
                        <Link
                          href={`/single-column/resume`}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Usage Examples
            </h2>
            <div className="bg-gray-100 rounded p-4 text-sm font-mono">
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Direct URL access:</span>
                </div>
                {resumeFiles.slice(0, 3).map((file: string) => {
                  const urlPath = encodeFilePathForUrl(file);
                  return (
                    <div key={file} className="ml-4">
                      <code className="text-blue-600">
                        /single-column/resume/{urlPath}
                      </code>
                    </div>
                  );
                })}
                {resumeFiles.length > 3 && (
                  <div className="ml-4 text-gray-500">
                    ... and {resumeFiles.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
