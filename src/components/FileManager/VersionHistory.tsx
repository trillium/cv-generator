"use client";

import React, { useState, useEffect } from "react";
import { Version, Diff } from "../../types/fileManager";
import {
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

interface VersionHistoryProps {
  filePath: string;
  onRestore?: (version: string) => void;
}

export default function VersionHistory({
  filePath,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [diff, setDiff] = useState<Diff | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [filePath]);

  async function loadVersions() {
    try {
      setLoading(true);
      const response = await fetch(`/api/files/${filePath}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.versions);
      } else {
        setError(data.error || "Failed to load versions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }

  async function loadDiff(versionPath: string) {
    try {
      setLoadingDiff(true);
      const response = await fetch(
        `/api/files/${filePath}/diff?from=${encodeURIComponent(versionPath)}&to=current`,
      );
      const data = await response.json();

      if (data.success) {
        setDiff(data);
      }
    } catch (err) {
      console.error("Failed to load diff:", err);
    } finally {
      setLoadingDiff(false);
    }
  }

  function toggleVersion(versionPath: string) {
    if (expandedVersion === versionPath) {
      setExpandedVersion(null);
      setDiff(null);
    } else {
      setExpandedVersion(versionPath);
      loadDiff(versionPath);
    }
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

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderDiff(diffText: string) {
    const lines = diffText.split("\n");
    return (
      <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs font-mono overflow-x-auto">
        {lines.map((line, i) => {
          let className = "";
          if (line.startsWith("+") && !line.startsWith("+++")) {
            className = "bg-green-900/30 text-green-300";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            className = "bg-red-900/30 text-red-300";
          } else if (line.startsWith("@@")) {
            className = "text-blue-400";
          }

          return (
            <div key={i} className={className}>
              {line || " "}
            </div>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <ClockIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No version history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Version History
        </h3>
        <button
          onClick={loadVersions}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Refresh"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        {versions.map((version, index) => (
          <div
            key={version.backupPath}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div className="p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(version.timestamp)}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatFileSize(version.size)}
                    {version.changelogEntry.message && (
                      <> • {version.changelogEntry.message}</>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRestore?.(version.backupPath)}
                    className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Restore
                  </button>

                  {version.diffAvailable && (
                    <button
                      onClick={() => toggleVersion(version.backupPath)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {expandedVersion === version.backupPath ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {expandedVersion === version.backupPath && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                {loadingDiff ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </div>
                ) : diff ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        +{diff.stats.additions} additions
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        -{diff.stats.deletions} deletions
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {diff.stats.changes} total changes
                      </span>
                    </div>
                    {renderDiff(diff.diff)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No diff available
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
