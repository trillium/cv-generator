"use client";

import React, { useState, useRef, useEffect } from "react";
import DebugInfo from "./DebugInfo";

interface EditModalProps {
  editValue: string;
  fieldType: "text" | "textarea" | "array" | "link";
  yamlPath: string;
  canShowAddButtons: boolean;
  parsedData: unknown;
  isSaving: boolean;
  value: string | string[];
  onSave: (newValue: string | string[]) => Promise<void>;
  onCancel: () => void;
  linkData?: {
    text: string;
    url: string;
    icon?: React.ReactNode;
    textYamlPath: string;
    urlYamlPath: string;
    onSaveLink?: (text: string, url: string) => Promise<void>;
  };
}

export default function EditModal({
  editValue,
  fieldType,
  yamlPath,
  canShowAddButtons,
  parsedData,
  isSaving,
  value,
  onSave,
  onCancel,
  linkData,
}: EditModalProps) {
  const [modalEditValue, setModalEditValue] = useState(editValue);
  const [linkText, setLinkText] = useState(linkData?.text || "");
  const [linkUrl, setLinkUrl] = useState(linkData?.url || "");
  const modalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Determine if this is a links array that should show link editing
  const isLinksArray = fieldType === "array" && yamlPath.includes("links");

  useEffect(() => {
    if (modalInputRef.current) {
      modalInputRef.current.focus();
      if (fieldType !== "textarea") {
        (modalInputRef.current as HTMLInputElement).select();
      } else {
        const textarea = modalInputRef.current as HTMLTextAreaElement;
        textarea.setSelectionRange(0, textarea.value.length);
      }
    }
  }, [fieldType]);

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (fieldType === "textarea") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleModalSave();
        }
      } else {
        e.preventDefault();
        handleModalSave();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleModalSave = async () => {
    if (
      (fieldType === "link" || isLinksArray) &&
      (linkData?.onSaveLink || isLinksArray)
    ) {
      // Handle link save with both text and URL
      if (isLinksArray) {
        // For links arrays, add the first link to the empty array
        const newLink = {
          name: linkText.trim() || "Link",
          link: linkUrl.trim() || "",
          icon: "None",
        };
        // Save the new array with the first link
        await onSave([newLink]);
      } else if (linkData?.onSaveLink) {
        await linkData.onSaveLink(linkText, linkUrl);
      }
      return;
    }

    if (!modalEditValue.trim() && value && String(value).trim()) {
      // Don't save empty values if the current value is not empty
      onCancel();
      return;
    }

    const currentValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");

    if (modalEditValue !== currentValue) {
      await onSave(modalEditValue);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Edit Field
        </h3>
      </div>

      {fieldType === "link" || isLinksArray ? (
        <div className="space-y-3">
          {linkData?.icon && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {linkData.icon}
              <span>Edit Link</span>
            </div>
          )}
          {!linkData?.icon && isLinksArray && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Add Link</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Text
            </label>
            <input
              ref={modalInputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full border border-blue-400 dark:border-blue-500 rounded p-2"
              disabled={isSaving}
              autoFocus
              placeholder="Link display name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full border border-blue-400 dark:border-blue-500 rounded p-2"
              disabled={isSaving}
              placeholder="https://example.com"
            />
          </div>
        </div>
      ) : fieldType === "textarea" ? (
        <textarea
          ref={modalInputRef as React.RefObject<HTMLTextAreaElement>}
          value={modalEditValue}
          onChange={(e) => setModalEditValue(e.target.value)}
          onKeyDown={handleModalKeyDown}
          className="w-full min-h-[8rem] focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white dark:bg-gray-800 text-black dark:text-white shadow-md box-border border border-blue-400 rounded p-2"
          rows={Math.max(4, modalEditValue.split("\n").length)}
          autoFocus
        />
      ) : (
        <input
          ref={modalInputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={modalEditValue}
          onChange={(e) => setModalEditValue(e.target.value)}
          onKeyDown={handleModalKeyDown}
          className="w-full border border-blue-400 dark:border-blue-500 rounded p-2"
          disabled={isSaving}
          autoFocus
        />
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        {fieldType === "link" || isLinksArray
          ? "Edit both text and URL, then save"
          : fieldType === "textarea"
            ? "Ctrl+Enter to save, Esc to cancel, Tab to next field"
            : "Enter to save, Esc to cancel, Tab to next field"}
      </div>

      {/* Debug information */}
      <DebugInfo
        yamlPath={yamlPath}
        canShowAddButtons={canShowAddButtons}
        fieldType={isLinksArray ? "link" : fieldType}
        parsedData={parsedData}
      />

      <div className="flex gap-4 justify-end items-center pt-4 border-t">
        <div className="flex flex-col items-center">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleModalSave}
            disabled={isSaving}
            className="text-xs bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            title="Save (Enter)"
          >
            {isSaving ? "⏳" : "✓"}
          </button>
          <span className="text-[10px] text-blue-700 dark:text-blue-300 mt-1">
            Save
          </span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onCancel}
            className="text-xs bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-800 text-white px-4 py-2 rounded"
            title="Cancel (Esc)"
          >
            ✕
          </button>
          <span className="text-[10px] text-red-500 dark:text-red-400 mt-1">
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
}
