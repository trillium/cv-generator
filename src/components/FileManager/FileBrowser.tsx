"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileMetadata, FileType } from "../../types/fileManager";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import FileCard from "./FileCard";

interface FileBrowserProps {
  onSelectFile?: (file: FileMetadata) => void;
  onDuplicateFile?: (file: FileMetadata) => void;
  onDeleteFile?: (file: FileMetadata) => void;
  selectedFile?: string | null;
}

type ViewMode = "grid" | "list";

export default function FileBrowser({
  onDuplicateFile,
  onDeleteFile,
}: FileBrowserProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fileType, setFileType] = useState<FileType | "all">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, searchQuery, fileType, selectedTags]);

  async function loadFiles() {
    try {
      setLoading(true);
      const response = await fetch("/api/files/list");
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
      } else {
        setError(data.error || "Failed to load files");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  function filterFiles() {
    let filtered = [...files];

    // Filter by type
    if (fileType !== "all") {
      filtered = filtered.filter((f) => f.type === fileType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query) ||
          f.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((f) =>
        selectedTags.some((tag) => f.tags.includes(tag)),
      );
    }

    setFilteredFiles(filtered);
  }

  function handleOpenFile(file: FileMetadata) {
    if (file.type === "resume") {
      router.push(
        `/single-column/resume?file=${encodeURIComponent(file.path)}`,
      );
    } else if (file.type === "linkedin") {
      router.push(`/linkedIn?file=${encodeURIComponent(file.path)}`);
    }
  }

  // Get all unique tags
  const allTags = Array.from(new Set(files.flatMap((f) => f.tags)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={loadFiles}
          className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files, tags, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters and view toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* File type filter */}
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType | "all")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Types</option>
              <option value="resume">Resume</option>
              <option value="linkedin">LinkedIn</option>
              <option value="other">Other</option>
            </select>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const tag = e.target.value;
                  if (tag && !selectedTags.includes(tag)) {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Add tag filter...</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 shadow"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 shadow"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
              >
                {tag}
                <button
                  onClick={() =>
                    setSelectedTags(selectedTags.filter((t) => t !== tag))
                  }
                  className="hover:text-blue-600 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* File count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
        {filteredFiles.length !== files.length &&
          ` (filtered from ${files.length})`}
      </div>

      {/* Files grid/list */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.path}
              file={file}
              onOpen={() => handleOpenFile(file)}
              onDuplicate={() => onDuplicateFile?.(file)}
              onDelete={() => onDeleteFile?.(file)}
              onMetadataUpdate={loadFiles}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.path}
              file={file}
              onOpen={() => handleOpenFile(file)}
              onDuplicate={() => onDuplicateFile?.(file)}
              onDelete={() => onDeleteFile?.(file)}
              onMetadataUpdate={loadFiles}
            />
          ))}
        </div>
      )}

      {filteredFiles.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <DocumentIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No files found</p>
          {(searchQuery || fileType !== "all" || selectedTags.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFileType("all");
                setSelectedTags([]);
              }}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
