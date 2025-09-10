"use client";

import ReactDOM from "react-dom";
import React, { useState, useRef, useEffect, ReactNode } from "react";
import {
  useYamlPathUpdater,
  getNestedValue,
} from "../../hooks/useYamlPathUpdater";
import { useYamlData } from "../../contexts/YamlDataContext";

interface EditableFieldProps<T> {
  yamlPath: string;
  value: T;
  fieldType?: "text" | "textarea" | "array";
  children: ReactNode;
  className?: string;
}

/**
 * Generic Higher-Order Component that wraps any content to make it editable
 * Provides inline editing with YAML path updates and CSS-only visual feedback
 */
export default function EditableField<T extends string | string[]>({
  yamlPath,
  value,
  fieldType = "text",
  children,
  className = "",
}: EditableFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(
    Array.isArray(value) ? value.join("\n") : String(value || ""),
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { updateYamlPath } = useYamlPathUpdater();
  const { parsedData, error } = useYamlData();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update edit value when the YAML data changes externally
  useEffect(() => {
    const currentValue = getNestedValue(parsedData, yamlPath);
    const stringValue = Array.isArray(currentValue)
      ? currentValue.join("\n")
      : String(currentValue || "");
    setEditValue(stringValue);
  }, [parsedData, yamlPath]);

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (fieldType !== "textarea") {
        (inputRef.current as HTMLInputElement).select();
      } else {
        const textarea = inputRef.current as HTMLTextAreaElement;
        textarea.setSelectionRange(0, textarea.value.length);
      }
    }
  }, [isEditing, fieldType]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing && !error) {
      setIsEditing(true);
    }
  };

  const handleWrapperKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (!error) {
        setIsEditing(true);
      }
    }
  };

  const handleSave = async () => {
    if (!editValue.trim() && value && String(value).trim()) {
      // Don't save empty values if the current value is not empty
      handleCancel();
      return;
    }

    const currentValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");

    if (editValue !== currentValue) {
      setIsSaving(true);
      try {
        let newValue: any = editValue.trim();

        // Handle different field types
        if (fieldType === "array") {
          newValue = editValue
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        }

        await updateYamlPath(yamlPath, newValue);
      } catch (error) {
        console.error("Error saving field:", yamlPath, error);
        // Revert to original value on error
        const originalValue = Array.isArray(value)
          ? value.join("\n")
          : String(value || "");
        setEditValue(originalValue);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    const originalValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");
    setEditValue(originalValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (fieldType === "textarea") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSave();
        }
      } else {
        e.preventDefault();
        handleSave();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow clicking save/cancel buttons
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 150);
  };

  // Base styles with CSS-only visual feedback
  const wrapperStyles = `
    relative inline-block
    transition-all duration-200
    ${!isEditing && !error ? "cursor-pointer" : ""}
    ${isHovered && !isEditing && !error ? "editable-hover" : ""}
    ${isEditing ? "editable-editing" : ""}
    ${className}
  `.trim();

  // Always render the children (text element) in the document flow
  // If editing, also render the modal
  if (isEditing) {
    const inputStyles = `
      bg-white border-2 border-blue-500 rounded shadow-sm
      px-2 py-1 text-inherit font-inherit
      resize-none outline-none
      box-border
    `;

    const modal = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center print:hidden">
        {/* Modal backdrop */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: 0.7 }}
          onClick={handleCancel}
        />
        {/* Modal content */}
        <div
          className="relative bg-white border-2 border-blue-500 rounded shadow-lg p-6 max-w-[90vw]"
          style={{ minWidth: "60vw" }}
        >
          <div className="mb-4 font-semibold text-lg text-blue-700">
            Edit Field
          </div>
          {fieldType === "textarea" ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full min-h-[8rem] focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white text-black shadow-md box-border border border-blue-400 rounded p-2"
              style={{
                width: "100%",
                minHeight: "5rem",
                boxSizing: "border-box",
                display: "block",
              }}
              rows={Math.max(4, editValue.split("\n").length)}
              autoFocus
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full border border-blue-400 rounded p-2"
              disabled={isSaving}
              style={{
                minWidth: "120px",
                minHeight: "32px",
                maxWidth: "300px",
                right: "0",
              }}
            />
          )}
          <div className="flex gap-6 mt-6 justify-end items-end">
            <div className="flex flex-col items-center">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                title="Save (Enter)"
              >
                {isSaving ? "⏳" : "✓"}
              </button>
              <span className="text-[10px] text-blue-700 mt-1">Save</span>
            </div>
            <div className="flex flex-col items-center">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCancel}
                className="text-xs bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                title="Cancel (Esc)"
              >
                ✕
              </button>
              <span className="text-[10px] text-gray-700 mt-1">Cancel</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap mt-2">
            {fieldType === "textarea"
              ? "Ctrl+Enter to save, Esc to cancel, Tab to next field"
              : "Enter to save, Esc to cancel, Tab to next field"}
          </div>
        </div>
      </div>
    );
    return (
      <>
        {children}
        {ReactDOM.createPortal(modal, document.body)}
      </>
    );
  }

  // Render view mode
  return (
    <div
      className={wrapperStyles}
      onClick={handleClick}
      onKeyDown={handleWrapperKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={!error ? 0 : -1}
      role="button"
      aria-label={`Edit ${yamlPath.split(".").pop()}`}
      title={
        !error
          ? "Click to edit (or press Enter/Space)"
          : "Cannot edit: YAML has errors"
      }
    >
      {children}

      {/* Hover indicator */}
      {isHovered && !isEditing && !error && (
        <div className="absolute -top-1 -right-1 z-10 print:hidden">
          <div className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
