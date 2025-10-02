"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Version } from "../../types/fileManager";

interface RestoreModalProps {
  isOpen: boolean;
  fileName: string;
  version: Version | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RestoreModal({
  isOpen,
  fileName,
  version,
  onClose,
  onConfirm,
}: RestoreModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    if (!confirmed) return;
    onConfirm();
    onClose();
    setConfirmed(false);
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!isOpen || !version) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Restore Version
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Warning:</strong> Restoring this version will replace the
              current file content. A backup of the current state will be
              created automatically.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-400">
              {fileName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Restore from
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(version.timestamp)}
              </div>
              {version.changelogEntry.message && (
                <div className="text-gray-600 dark:text-gray-400 mt-1">
                  {version.changelogEntry.message}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm-restore"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="confirm-restore"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              I understand that this will replace the current file content with
              the selected version.
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Restore Version
          </button>
        </div>
      </div>
    </div>
  );
}
