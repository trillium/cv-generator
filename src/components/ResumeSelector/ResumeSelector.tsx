"use client";

import React, { useState, useEffect } from "react";
import { clsx } from "clsx";
import { useResumeContext } from "../../contexts/ResumeContext";
import { useModal } from "../../contexts/ModalContext";
import ResumeNavigator from "../ResumeNavigator/ResumeNavigator";
import ResumeCreator from "../ResumeCreator/ResumeCreator";

const ResumeSelector: React.FC = () => {
  const {
    currentResume,
    currentResumeFile,
    availableFiles,
    loadAvailableFiles,
    loadResumeFile,
    loading,
  } = useResumeContext();

  const { openModal, closeModal } = useModal();

  // Load available files on mount
  useEffect(() => {
    loadAvailableFiles();
  }, [loadAvailableFiles]);

  const handleResumeCreated = async (resume: {
    fileName: string;
    position: string;
    company?: string;
  }) => {
    await loadResumeFile(resume.fileName);
    closeModal();
  };

  const openResumeNavigator = () => {
    // ResumeNavigator now handles navigation automatically
    openModal(<ResumeNavigator />, "xl");
  };

  const openResumeCreator = () => {
    openModal(
      <ResumeCreator
        onResumeCreated={handleResumeCreated}
        onClose={closeModal}
      />,
    );
  };

  const formatResumeTitle = () => {
    if (!currentResume || !currentResumeFile) {
      return "No Resume Selected";
    }

    // Extract filename without extension
    const fileName =
      currentResumeFile
        .split("/")
        .pop()
        ?.replace(/\.(yml|yaml)$/i, "") || "Resume";

    // Format the filename to be more readable
    const formattedName = fileName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    return formattedName;
  };

  const formatResumeSubtitle = () => {
    if (!currentResume) {
      return null;
    }

    const parts = [];

    // Show role if available
    if (currentResume.info?.role) {
      parts.push(currentResume.info.role);
    }

    // Show file path for context
    if (currentResumeFile && parts.length === 0) {
      parts.push(currentResumeFile);
    }

    return parts.length > 0 ? parts.join(" • ") : null;
  };

  const getStatusColor = () => {
    if (!currentResume) return "gray";

    // Simple heuristic based on resume completeness
    const hasBasicInfo =
      currentResume.info?.firstName && currentResume.info?.lastName;
    const hasWorkExperience =
      currentResume.workExperience && currentResume.workExperience.length > 0;

    if (hasBasicInfo && hasWorkExperience) {
      return "green"; // Complete
    } else if (hasBasicInfo) {
      return "yellow"; // Partial
    } else {
      return "gray"; // Draft
    }
  };

  const getFileCount = () => {
    return availableFiles?.totalFiles || 0;
  };

  return (
    <>
      {/* Resume Selector Button */}
      <div className="flex">
        <button
          onClick={openResumeNavigator}
          disabled={loading}
          className="flex items-center space-x-2 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {/* Status indicator */}
          <div
            className={clsx("w-2 h-2 rounded-full", {
              "bg-green-500": getStatusColor() === "green",
              "bg-yellow-500": getStatusColor() === "yellow",
              "bg-gray-400": getStatusColor() === "gray",
            })}
          />

          <div className="text-left">
            <span className="font-medium">{formatResumeTitle()}</span>
            {formatResumeSubtitle() && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatResumeSubtitle()}
              </span>
            )}
          </div>

          <div>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="ml-2 inline-flex my-auto">
          <button
            onClick={openResumeCreator}
            disabled={loading}
            className="rounded-md bg-blue-600 dark:bg-blue-700 px-3 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            title="Create New Resume"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Current Resume Info */}
      {currentResume && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {currentResume.info?.role && (
            <span className=" whitespace-nowrap block">
              Role: {currentResume.info.role}
            </span>
          )}
          {currentResumeFile && (
            <span className=" whitespace-nowrap block">
              File: {currentResumeFile}
            </span>
          )}
          <span className=" whitespace-nowrap block">
            Available Files: {getFileCount()}
          </span>
        </div>
      )}
    </>
  );
};

export default ResumeSelector;
