"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import EditableYamlViewer from "../EditableYamlViewer";
import { useYamlData } from "../../contexts/YamlDataContext";

interface YamlDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  yamlData: string;
  title?: string;
  description?: string;
}

export default function YamlDataModal({
  isOpen,
  onClose,
  yamlData,
  title = "Resume Data (YAML)",
  description = "This is the raw YAML data used to generate your resume",
}: YamlDataModalProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const { yamlContent, updateYamlContent } = useYamlData();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yamlData);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleSaveChanges = async (newYamlData: string) => {
    await updateYamlContent(newYamlData);
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] min-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View/Edit Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode("view")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === "view"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                View
              </button>
              <button
                onClick={() => setViewMode("edit")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === "edit"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Edit
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {viewMode === "view" ? (
            <pre className="p-4 text-sm font-mono bg-gray-50 text-gray-800 whitespace-pre-wrap leading-relaxed">
              {yamlData}
            </pre>
          ) : (
            <div className="p-4">
              <EditableYamlViewer
                yamlContent={yamlData}
                onSave={handleSaveChanges}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {viewMode === "view"
                ? "This is the raw YAML data used to generate your resume"
                : "Edit mode: Changes are applied in real-time to the preview"}
            </span>
            <span>
              Press{" "}
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>{" "}
              to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
