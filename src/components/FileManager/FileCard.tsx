"use client";

import React, { useState } from "react";
import { FileMetadata } from "../../types/fileManager";
import {
  FiFile,
  FiMoreVertical,
  FiCopy,
  FiTrash2,
  FiClock,
  FiTag,
  FiEdit3,
} from "react-icons/fi";
import ResumeMetadataDisplay from "./ResumeMetadataDisplay";
import MetadataEditor from "./MetadataEditor";
import { useModal } from "../../contexts/ModalContext";
import { ResumeMetadata } from "../../types";

interface FileCardProps {
  file: FileMetadata;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMetadataUpdate: () => void;
}

export default function FileCard({
  file,
  onOpen,
  onDuplicate,
  onDelete,
  onMetadataUpdate,
}: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { openModal, closeModal } = useModal();

  const handleEditMetadata = () => {
    const handleSave = async (metadata: ResumeMetadata) => {
      try {
        const encodedPath = file.path
          .split("/")
          .map(encodeURIComponent)
          .join("/");
        console.log("[FileCard] Saving metadata:", {
          originalPath: file.path,
          encodedPath,
          url: `/api/files/${encodedPath}/metadata`,
        });
        const response = await fetch(`/api/files/${encodedPath}/metadata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[FileCard] Save failed:", errorData);
          throw new Error(errorData.error || "Failed to save metadata");
        }

        closeModal();
        onMetadataUpdate();
      } catch (err) {
        console.error("[FileCard] Error saving metadata:", err);
        throw err;
      }
    };

    openModal(
      <MetadataEditor
        metadata={file.resumeMetadata}
        filePath={file.path}
        onSave={handleSave}
        onCancel={closeModal}
      />,
      "lg",
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "resume":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "linkedin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(file.path);
    } catch (err) {
      console.error("[FileCard] Failed to copy path:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleCopyPath}
              className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              title="Copy file path"
            >
              <FiFile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                onClick={onOpen}
              >
                {file.name}
              </h3>
              {file.role && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                  {file.role}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate font-mono">
                {file.path}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(file.type)}`}
                >
                  {file.type}
                </span>
                {file.hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    unsaved
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiMoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      handleEditMetadata();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Edit Metadata
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiCopy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <ResumeMetadataDisplay
          metadata={file.resumeMetadata}
          onEdit={handleEditMetadata}
        />

        {file.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {file.description}
          </p>
        )}

        {file.tags && file.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <FiTag className="w-3 h-3 text-gray-400" />
            {file.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <FiClock className="w-3 h-3" />
            {formatDate(file.modified)}
          </div>

          {file.versions > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {file.versions} version{file.versions !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <button
          onClick={onOpen}
          className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Open
        </button>
      </div>
    </div>
  );
}
