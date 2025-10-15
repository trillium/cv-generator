"use client";

import { useState, useCallback, ReactNode } from "react";
import { DirectoryManagerContext } from "./DirectoryManagerContext.context";
import type { CVData } from "@/types";
import type { DirectoryMetadata } from "../../lib/multiFileManager";

export interface DirectoryManagerContextType {
  // Current directory state
  currentDirectory: string | null;
  data: CVData | null;
  sources: Record<string, string>;
  metadata: DirectoryMetadata | null;

  // Loading states
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Parsed data (for compatibility with EditableField)
  parsedData: CVData | null;
  content: string;

  // Actions
  loadDirectory: (path: string) => Promise<void>;
  updateDataPath: (yamlPath: string, value: unknown) => Promise<void>;
  saveDirectory: () => Promise<void>;
  discardChanges: () => Promise<void>;
  getSourceFile: (section: string) => string | null;

  // Hierarchy operations
  getHierarchy: (path: string) => Promise<void>;
  listDirectoryFiles: (path: string) => Promise<void>;

  // File operations
  currentFile: { path: string } | null;
  updateContent: (newContent: string) => void;
  saveFile: (commit?: boolean, message?: string) => Promise<void>;
}

interface DirectoryManagerProviderProps {
  children: ReactNode;
}

export function DirectoryManagerProvider({
  children,
}: DirectoryManagerProviderProps) {
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [data, setData] = useState<CVData | null>(null);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState<DirectoryMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/directory/load?path=${encodeURIComponent(path)}`,
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load directory");
      }

      setCurrentDirectory(path);
      setData(result.data);
      setSources(result.sources);
      setMetadata(result.metadata);
      setHasUnsavedChanges(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load directory";
      setError(errorMsg);
      console.error("Error loading directory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDataPath = useCallback(
    async (yamlPath: string, value: unknown) => {
      if (!currentDirectory) {
        throw new Error("No directory loaded");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/directory/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directoryPath: currentDirectory,
            yamlPath,
            value,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to update data");
        }

        // Reload directory to get fresh merged data
        await loadDirectory(currentDirectory);
        setHasUnsavedChanges(false);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update data";
        setError(errorMsg);
        console.error("Error updating data path:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentDirectory, loadDirectory],
  );

  const saveDirectory = useCallback(async () => {
    // In directory mode, saves are immediate (no temp files)
    // This is a no-op for compatibility
    setHasUnsavedChanges(false);
  }, []);

  const discardChanges = useCallback(async () => {
    if (currentDirectory) {
      // Reload directory to discard any unsaved changes
      await loadDirectory(currentDirectory);
      setHasUnsavedChanges(false);
    }
  }, [currentDirectory, loadDirectory]);

  const getSourceFile = useCallback(
    (section: string): string | null => {
      return sources[section] || null;
    },
    [sources],
  );

  const getHierarchy = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/directory/hierarchy?path=${encodeURIComponent(path)}`,
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to get hierarchy");
      }

      // Store hierarchy info if needed
      console.log("Hierarchy:", result.hierarchy);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to get hierarchy";
      setError(errorMsg);
      console.error("Error getting hierarchy:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const listDirectoryFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/directory/files?path=${encodeURIComponent(path)}`,
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to list files");
      }

      console.log("Directory files:", result.files);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to list files";
      setError(errorMsg);
      console.error("Error listing directory files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compatibility methods for EditableField
  const updateContent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_newContent: string) => {
      // This is called by EditableField but we handle updates differently in directory mode
      // We'll parse the content and trigger a full update
      console.warn(
        "updateContent called in directory mode - this should use updateDataPath instead",
      );
      setHasUnsavedChanges(true);
    },
    [],
  );

  const saveFile = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_commit?: boolean, _message?: string) => {
      // Compatibility method - in directory mode, saves are immediate
      await saveDirectory();
    },
    [saveDirectory],
  );

  const value: DirectoryManagerContextType = {
    currentDirectory,
    data,
    sources,
    metadata,
    loading,
    error,
    hasUnsavedChanges,
    parsedData: data,
    content: data ? JSON.stringify(data, null, 2) : "",
    currentFile: currentDirectory ? { path: currentDirectory } : null,
    loadDirectory,
    updateDataPath,
    saveDirectory,
    discardChanges,
    getSourceFile,
    getHierarchy,
    listDirectoryFiles,
    updateContent,
    saveFile,
  };

  return (
    <DirectoryManagerContext.Provider value={value}>
      {children}
    </DirectoryManagerContext.Provider>
  );
}
