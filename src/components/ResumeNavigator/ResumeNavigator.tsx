"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  listAllResumeFiles,
  deleteResumeWithBackup,
  duplicateResume,
} from "../../../lib/utility";
import { useModal } from "../../contexts/ModalContext";
import { encodeFilePathForUrl } from "../../utils/urlSafeEncoding";

interface ResumeNavigatorProps {
  onSelectResume?: (filePath: string) => void; // Made optional since we'll navigate instead
}

function ResumeNavigator({ onSelectResume }: ResumeNavigatorProps) {
  const { closeModal } = useModal();
  const router = useRouter();
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<string | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState("");

  // Load files when component mounts
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAllResumeFiles();
      if (result.success && result.data) {
        // Filter for YAML resume files (same as ResumeListPage)
        const resumeFiles = result.data.allFiles.filter(
          (file: string) =>
            file.endsWith(".yml") &&
            !file.includes(".backup.") &&
            !file.includes(".temp.") &&
            file !== "data.yml.template",
        );
        setFiles(resumeFiles);
      } else {
        setError(result.error || "Failed to load files");
      }
    } catch (err) {
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = (filePath: string) => {
    // Encode the file path for URL-safe navigation
    const encodedPath = encodeFilePathForUrl(filePath);

    // Navigate to the dynamic resume route
    router.push(`/single-column/resume/${encodedPath}`);

    // Call the optional callback if provided (for backward compatibility)
    if (onSelectResume) {
      onSelectResume(filePath);
    }

    // Close the modal
    closeModal();
  };

  const handleDeleteResume = async (filePath: string) => {
    try {
      const result = await deleteResumeWithBackup(filePath);
      if (result.success) {
        await loadFiles(); // Refresh the list
        setDeleteConfirm(null);
      } else {
        setError(result.error || "Failed to delete file");
      }
    } catch (err) {
      setError("Failed to delete file");
    }
  };

  const handleDuplicateResume = async () => {
    if (!duplicateSource || !duplicateTarget) return;

    try {
      const result = await duplicateResume(duplicateSource, duplicateTarget);
      if (result.success) {
        await loadFiles(); // Refresh the list
        setDuplicateSource(null);
        setDuplicateTarget("");
      } else {
        setError(result.error || "Failed to duplicate file");
      }
    } catch (err) {
      setError("Failed to duplicate file");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Resume Navigator</h3>
        <p className="text-sm text-gray-600">
          Select a resume file to view or manage your resume files
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading files...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {!loading && !error && files && files.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No resume files found</p>
        </div>
      )}

      {!loading && files && files.length > 0 && (
        <div className="space-y-2">
          {files.map((filePath) => {
            // Create a clean display name (same as ResumeListPage)
            const displayName = filePath.replace(".yml", "");

            return (
              <div
                key={filePath}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <button
                    onClick={() => handleSelectResume(filePath)}
                    className="text-left hover:text-blue-600 font-medium w-full"
                  >
                    <div className="font-semibold">{displayName}</div>
                    <div className="text-sm text-gray-500">
                      File: {filePath}
                    </div>
                  </button>
                </div>

                <div className="flex space-x-2 ml-4">
                  {/* Duplicate button */}
                  <button
                    onClick={() => setDuplicateSource(filePath)}
                    className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    title="Duplicate file"
                  >
                    Copy
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteConfirm(filePath)}
                    className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    title="Delete file"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t mt-4">
        <button
          onClick={loadFiles}
          className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Close
        </button>
      </div>

      {/* Delete Confirmation - show inline when deleteConfirm is set */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Delete Resume File
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{deleteConfirm}"? This action
              cannot be undone, but a backup will be created.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirm && handleDeleteResume(deleteConfirm)
                }
                className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate form - show inline when duplicateSource is set */}
      {duplicateSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Duplicate Resume
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Create a copy of "{duplicateSource}"
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="duplicateTarget"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New filename
                </label>
                <input
                  id="duplicateTarget"
                  type="text"
                  value={duplicateTarget}
                  onChange={(e) => setDuplicateTarget(e.target.value)}
                  placeholder="Enter new filename (e.g., resume-copy.yml)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setDuplicateSource(null);
                    setDuplicateTarget("");
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateResume}
                  disabled={!duplicateTarget.trim()}
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeNavigator;
