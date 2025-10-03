"use client";

import { useState, useCallback, ReactNode } from "react";
import { FileManagerContext } from "./FileManagerContext.constants";
import { FileMetadata, FileType, Version, Diff } from "../types/fileManager";
import { CVData } from "../types";
import { LinkedInData } from "../types/linkedin";
import * as yaml from "js-yaml";

export interface FileManagerContextType {
  // Current file state
  currentFile: FileMetadata | null;
  content: string;
  parsedData: CVData | LinkedInData | null;
  hasUnsavedChanges: boolean;

  // File list
  files: FileMetadata[];
  filteredFiles: FileMetadata[];

  // Filters
  fileType: "all" | FileType;
  searchQuery: string;
  selectedTags: string[];

  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  loadFile: (path: string) => Promise<void>;
  saveFile: (commit?: boolean, message?: string) => Promise<void>;
  commitChanges: (message?: string) => Promise<void>;
  discardChanges: () => Promise<void>;
  updateContent: (newContent: string) => void;

  // File operations
  createNewFile: (
    path: string,
    content: string,
    commit?: boolean,
  ) => Promise<void>;
  duplicateFile: (
    path: string,
    name?: string,
    tags?: string[],
    description?: string,
  ) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  restoreVersion: (path: string, version: string) => Promise<void>;

  // Version history
  getVersionHistory: (path: string) => Promise<Version[]>;
  getFileDiff: (path: string, from: string, to: string) => Promise<Diff>;

  // Metadata
  updateTags: (path: string, tags: string[]) => Promise<void>;
  updateDescription: (path: string, desc: string) => Promise<void>;

  // Filters
  setFileType: (type: "all" | FileType) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;

  // Refresh
  refreshFiles: () => Promise<void>;
}

interface FileManagerProviderProps {
  children: ReactNode;
}

export function FileManagerProvider({ children }: FileManagerProviderProps) {
  const updateTags = useCallback(async (path: string, tags: string[]) => {
    try {
      // This would need a dedicated API endpoint, for now we can update via metadata
      // Implementation depends on backend support
      console.log("Update tags:", path, tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tags");
    }
  }, []);

  const updateDescription = useCallback(async (path: string, desc: string) => {
    try {
      // This would need a dedicated API endpoint
      console.log("Update description:", path, desc);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update description",
      );
    }
  }, []);
  const [currentFile, setCurrentFile] = useState<FileMetadata | null>(null);
  const [content, setContent] = useState("");
  const [parsedData, setParsedData] = useState<CVData | LinkedInData | null>(
    null,
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);

  const [fileType, setFileType] = useState<"all" | FileType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (fileType !== "all") params.set("type", fileType);
      if (searchQuery) params.set("search", searchQuery);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

      const response = await fetch(`/api/files/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setFilteredFiles(data.files);
      } else {
        setError(data.error || "Failed to load files");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [fileType, searchQuery, selectedTags]);

  const loadFile = useCallback(async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/files/${path}`);
      const data = await response.json();

      if (data.success) {
        setCurrentFile(data.metadata);
        setContent(data.content);
        setHasUnsavedChanges(data.hasUnsavedChanges);

        // Parse YAML content
        try {
          const parsed = yaml.load(data.content);
          setParsedData(parsed as CVData | LinkedInData);
        } catch (err) {
          console.error("Failed to parse YAML:", err);
          setParsedData(null);
        }
      } else {
        setError(data.error || "Failed to load file");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveFile = useCallback(
    async (commit = false, message?: string) => {
      if (!currentFile) {
        setError("No file loaded");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/files/${currentFile.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            commit,
            message,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setHasUnsavedChanges(!commit);
          await refreshFiles();

          // Reload current file to get updated metadata
          await loadFile(currentFile.path);
        } else {
          setError(data.error || "Failed to save file");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save file");
      } finally {
        setLoading(false);
      }
    },
    [currentFile, content, refreshFiles, loadFile],
  );

  const commitChanges = useCallback(
    async (message?: string) => {
      if (!currentFile) {
        setError("No file loaded");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/files/${currentFile.path}/commit`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        const data = await response.json();

        if (data.success) {
          setHasUnsavedChanges(false);
          await refreshFiles();
          await loadFile(currentFile.path);
        } else {
          setError(data.error || "Failed to commit changes");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to commit changes",
        );
      } finally {
        setLoading(false);
      }
    },
    [currentFile, refreshFiles, loadFile],
  );

  const discardChanges = useCallback(async () => {
    if (!currentFile) {
      setError("No file loaded");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/files/${currentFile.path}/discard`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setHasUnsavedChanges(false);
        await refreshFiles();
        await loadFile(currentFile.path);
      } else {
        setError(data.error || "Failed to discard changes");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to discard changes",
      );
    } finally {
      setLoading(false);
    }
  }, [currentFile, refreshFiles, loadFile]);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);

    // Try to parse and update parsedData
    try {
      const parsed = yaml.load(newContent);
      setParsedData(parsed as CVData | LinkedInData);
    } catch (err) {
      // Invalid YAML, keep previous parsed data
      console.error("Failed to parse YAML:", err);
    }
  }, []);

  const createNewFile = useCallback(
    async (path: string, content: string, commit = true): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/files/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            commit,
          }),
        });

        const data = await response.json();

        if (data.success) {
          await refreshFiles();
          await loadFile(path);
        } else {
          throw new Error(data.error || "Failed to create file");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to create file";
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [refreshFiles, loadFile],
  );

  // ...existing code...

  const duplicateFile = useCallback(
    async (
      path: string,
      name?: string,
      tags?: string[],
      description?: string,
    ): Promise<string> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/files/${path}/duplicate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        const data = await response.json();

        if (data.success) {
          // Update tags and description if provided
          if (tags || description) {
            if (tags) {
              await updateTags(data.newPath, tags);
            }
            if (description) {
              await updateDescription(data.newPath, description);
            }
          }

          await refreshFiles();
          return data.newPath;
        } else {
          throw new Error(data.error || "Failed to duplicate file");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to duplicate file";
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [refreshFiles, updateTags, updateDescription],
  );

  const deleteFile = useCallback(
    async (path: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/files/${path}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          // If we're deleting the current file, clear it
          if (currentFile?.path === path) {
            setCurrentFile(null);
            setContent("");
            setParsedData(null);
            setHasUnsavedChanges(false);
          }

          await refreshFiles();
        } else {
          setError(data.error || "Failed to delete file");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete file");
      } finally {
        setLoading(false);
      }
    },
    [currentFile, refreshFiles],
  );

  const restoreVersion = useCallback(
    async (path: string, version: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/files/${path}/restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version }),
        });

        const data = await response.json();

        if (data.success) {
          await refreshFiles();

          // Reload current file if it's the one we restored
          if (currentFile?.path === path) {
            await loadFile(path);
          }
        } else {
          setError(data.error || "Failed to restore version");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to restore version",
        );
      } finally {
        setLoading(false);
      }
    },
    [currentFile, refreshFiles, loadFile],
  );

  const getVersionHistory = useCallback(
    async (path: string): Promise<Version[]> => {
      try {
        const response = await fetch(`/api/files/${path}/versions`);
        const data = await response.json();

        if (data.success) {
          return data.versions;
        } else {
          throw new Error(data.error || "Failed to get version history");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get version history";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [],
  );

  const getFileDiff = useCallback(
    async (path: string, from: string, to: string): Promise<Diff> => {
      try {
        const response = await fetch(
          `/api/files/${path}/diff?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        const data = await response.json();

        if (data.success) {
          return {
            diff: data.diff,
            stats: data.stats,
          };
        } else {
          throw new Error(data.error || "Failed to get diff");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get diff";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [],
  );

  // ...existing code...

  const value: FileManagerContextType = {
    currentFile,
    content,
    parsedData,
    hasUnsavedChanges,
    files,
    filteredFiles,
    fileType,
    searchQuery,
    selectedTags,
    loading,
    error,
    loadFile,
    saveFile,
    commitChanges,
    discardChanges,
    updateContent,
    createNewFile,
    duplicateFile,
    deleteFile,
    restoreVersion,
    getVersionHistory,
    getFileDiff,
    updateTags,
    updateDescription,
    setFileType,
    setSearchQuery,
    setSelectedTags,
    refreshFiles,
  };

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
}
