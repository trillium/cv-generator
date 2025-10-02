"use client";

import React, { useEffect } from "react";
import { clsx } from "clsx";
import { useFileManager } from "../../contexts/FileManagerContext";
import { useModal } from "../../contexts/ModalContext";
import ResumeNavigator from "../ResumeNavigator/ResumeNavigator";
import ResumeCreator from "../ResumeCreator/ResumeCreator";
import type { CVData } from "../../types";

const ResumeSelector: React.FC = () => {
  const { parsedData, currentFile, files, refreshFiles, loadFile, loading } =
    useFileManager();

  const { openModal, closeModal } = useModal();

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const handleResumeCreated = async (resume: {
    fileName: string;
    position: string;
    company?: string;
  }) => {
    await loadFile(resume.fileName);
    closeModal();
  };

  const openResumeNavigator = () => {
    openModal(<ResumeNavigator />, "xl");
  };

  const openResumeCreator = () => {
    openModal(
      <ResumeCreator
        onResumeCreated={handleResumeCreated}
        onClose={closeModal}
      />,
      "xl",
    );
  };

  const formatResumeTitle = () => {
    if (!parsedData || !currentFile) {
      return "No Resume Selected";
    }

    const fileName =
      currentFile.path
        .split("/")
        .pop()
        ?.replace(/\.(yml|yaml)$/i, "") || "Resume";

    const formattedName = fileName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    return formattedName;
  };

  const formatResumeSubtitle = () => {
    if (!parsedData) {
      return null;
    }

    const cvData = parsedData as CVData;
    const parts = [];

    if (cvData.info?.role) {
      parts.push(cvData.info.role);
    }

    if (currentFile && parts.length === 0) {
      parts.push(currentFile.path);
    }

    return parts.length > 0 ? parts.join(" • ") : null;
  };

  const getStatusColor = () => {
    if (!parsedData) return "gray";

    const cvData = parsedData as CVData;

    const hasBasicInfo = cvData.info?.firstName && cvData.info?.lastName;
    const hasWorkExperience =
      cvData.workExperience && cvData.workExperience.length > 0;

    if (hasBasicInfo && hasWorkExperience) {
      return "green";
    } else if (hasBasicInfo) {
      return "yellow";
    } else {
      return "gray";
    }
  };

  const getFileCount = () => {
    return files?.length || 0;
  };

  return (
    <>
      <div className="flex">
        <button
          onClick={openResumeNavigator}
          disabled={loading}
          className="flex items-center space-x-2 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
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

      {parsedData && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {(parsedData as CVData).info?.role && (
            <span className=" whitespace-nowrap block">
              Role: {(parsedData as CVData).info.role}
            </span>
          )}
          {currentFile && (
            <span className=" whitespace-nowrap block">
              File: {currentFile.path}
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
