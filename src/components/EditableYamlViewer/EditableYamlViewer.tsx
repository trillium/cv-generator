"use client";

import React, { useState, useEffect } from "react";
import { clsx } from "clsx";
import * as yaml from "js-yaml";

interface EditableYamlViewerProps {
  yamlContent: string;
  onSave: (content: any) => void;
  className?: string;
}

const EditableYamlViewer: React.FC<EditableYamlViewerProps> = ({
  yamlContent,
  onSave,
  className = "",
}) => {
  const [editContent, setEditContent] = useState(yamlContent);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Update content when yamlContent prop changes
  useEffect(() => {
    setEditContent(yamlContent);
    setHasChanges(false);
  }, [yamlContent]);

  const validateYaml = (content: string) => {
    try {
      yaml.load(content);
      setError(null);
      return true;
    } catch (err) {
      setError(
        `Invalid YAML: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      return false;
    }
  };

  const handleContentChange = (newContent: string) => {
    setEditContent(newContent);
    setHasChanges(newContent !== yamlContent);

    // Debounced validation
    setIsValidating(true);
    setTimeout(() => {
      validateYaml(newContent);
      setIsValidating(false);
    }, 500);
  };

  const handleSave = () => {
    if (validateYaml(editContent)) {
      onSave(editContent);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setEditContent(yamlContent);
    setHasChanges(false);
    setError(null);
  };

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header with actions */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Edit YAML Data</h3>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-md border border-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || !!error || isValidating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-md transition-colors"
          >
            {isValidating ? "Validating..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Validation status */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm font-medium">
            Validation Error
          </div>
          <div className="text-red-700 text-sm mt-1">{error}</div>
        </div>
      )}

      {hasChanges && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-blue-800 text-sm">
            You have unsaved changes. Click "Save Changes" to apply them.
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          YAML Content
        </label>
        <textarea
          value={editContent}
          onChange={(e) => handleContentChange(e.target.value)}
          className={clsx(
            "w-full h-96 px-3 py-2 font-mono text-sm border rounded-md focus:outline-none focus:ring-2 resize-none",
            {
              "border-red-300 focus:ring-red-500 focus:border-red-500": error,
              "border-gray-300 focus:ring-blue-500 focus:border-blue-500":
                !error,
            },
          )}
          placeholder="Enter your YAML content here..."
          spellCheck={false}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Lines: {editContent.split("\n").length} | Characters:{" "}
            {editContent.length}
          </span>
          <span>
            {isValidating
              ? "Validating..."
              : error
                ? "❌ Invalid YAML"
                : "✅ Valid YAML"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EditableYamlViewer;
