"use client";

import React from "react";
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  TagIcon,
  PencilSquareIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface QuickActionsProps {
  hasUnsavedChanges?: boolean;
  onSave?: (commit: boolean) => void;
  onDiscard?: () => void;
  onDuplicate?: () => void;
  onViewHistory?: () => void;
  onEditTags?: () => void;
  onEditDescription?: () => void;
  disabled?: boolean;
}

export default function QuickActions({
  hasUnsavedChanges = false,
  onSave,
  onDiscard,
  onDuplicate,
  onViewHistory,
  onEditTags,
  onEditDescription,
  disabled = false,
}: QuickActionsProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center gap-2">
          {/* Save */}
          <button
            onClick={() => onSave?.(false)}
            disabled={disabled || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Save (creates temp file)"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Save</span>
          </button>

          {/* Commit */}
          <button
            onClick={() => onSave?.(true)}
            disabled={disabled || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Commit changes"
          >
            <CheckIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Commit</span>
          </button>

          {/* Discard */}
          {hasUnsavedChanges && (
            <button
              onClick={onDiscard}
              disabled={disabled}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Discard changes"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Duplicate */}
          <button
            onClick={onDuplicate}
            disabled={disabled}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Duplicate file"
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>

          {/* View History */}
          <button
            onClick={onViewHistory}
            disabled={disabled}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="View version history"
          >
            <ClockIcon className="h-5 w-5" />
          </button>

          {/* Edit Tags */}
          <button
            onClick={onEditTags}
            disabled={disabled}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Edit tags"
          >
            <TagIcon className="h-5 w-5" />
          </button>

          {/* Edit Description */}
          <button
            onClick={onEditDescription}
            disabled={disabled}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Edit description"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
        </div>

        {hasUnsavedChanges && (
          <div className="mt-2 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs rounded">
            You have unsaved changes
          </div>
        )}
      </div>
    </div>
  );
}
