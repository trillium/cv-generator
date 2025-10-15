"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
import { useFileManager } from "@/contexts/FileManagerContext.hook";
import DirectoryTree from "@/features/fileManager/parts/DirectoryTree";

interface ResumeNavigatorProps {
  onSelectResume?: (dirPath: string) => void;
}

function ResumeNavigator({ onSelectResume }: ResumeNavigatorProps) {
  const { closeModal } = useModal();
  const router = useRouter();
  const { files, loading, error } = useFileManager();

  const handleSelectDirectory = (dirPath: string) => {
    router.push(`/single-column-multi/resume/${encodeURIComponent(dirPath)}`);

    if (onSelectResume) {
      onSelectResume(dirPath);
    }

    closeModal();
  };

  const handleSelectFile = (filePath: string) => {
    const dirPath = filePath.split("/").slice(0, -1).join("/");
    handleSelectDirectory(dirPath);
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4 mb-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <DirectoryTree
        files={files}
        selectedFile={null}
        onSelectFile={handleSelectFile}
        onSelectDirectory={handleSelectDirectory}
        loading={loading}
      />

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
