"use client";

import { useState, useCallback, ReactNode, useMemo } from "react";
import { DirectoryManagerContext } from "./DirectoryManagerContext.context";
import type { CVData } from "@/types";
import type {
  DirectoryMetadata,
  DirectoryFileInfo,
  DirectoryLoadResult,
} from "../../lib/multiFileManager";

export interface DirectoryManagerContextType {
  // Resume cache
  allResumes: Record<string, DirectoryLoadResult>;
  currentResumeKey: string | null;

  // Current directory state (computed from cache)
  currentDirectory: string | null;
  data: CVData | null;
  sources: Record<string, string>;
  metadata: DirectoryMetadata | null;
  files: DirectoryFileInfo[];

  // Loading states
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Parsed data (for compatibility with EditableField)
  parsedData: CVData | null;
  content: string;

  // Cache management
  loadAllResumes: () => Promise<void>;
  setCurrentResume: (key: string) => void;
  ensureResumeLoaded: (key: string) => Promise<void>;

  // Actions (legacy, still needed for file-manager)
  loadDirectory: (path: string) => Promise<void>;
  updateDataPath: (yamlPath: string, value: unknown) => Promise<void>;
  saveDirectory: () => Promise<void>;
  discardChanges: () => Promise<void>;
  getSourceFile: (section: string) => string | null;

  // Hierarchy operations
  getHierarchy: (path: string) => Promise<void>;
  listDirectoryFiles: (path: string) => Promise<void>;
  refreshFiles: () => Promise<void>;

  // Directory operations
  createDirectory: (parentPath: string, directoryName: string) => Promise<void>;
  splitSectionToFile: (
    sourceFilePath: string,
    sectionKey: string,
    targetFileName: string,
  ) => Promise<void>;
  deleteFileToDeleted: (filePath: string) => Promise<void>;

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
  const [allResumes, setAllResumes] = useState<
    Record<string, DirectoryLoadResult>
  >({});
  const [currentResumeKey, setCurrentResumeKey] = useState<string | null>(null);
  const [files, setFiles] = useState<DirectoryFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentResume = useMemo(() => {
    return currentResumeKey ? allResumes[currentResumeKey] : null;
  }, [currentResumeKey, allResumes]);

  const currentDirectory = currentResume?.metadata.directoryPath || null;
  const data = currentResume?.data || null;
  const sources = currentResume?.sources || {};
  const metadata = currentResume?.metadata || null;

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const filesResponse = await fetch(
        `/api/directory/files?path=${encodeURIComponent("resumes")}&recursive=true`,
      );
      const filesResult = await filesResponse.json();

      if (!filesResult.success) {
        throw new Error("Failed to fetch available files");
      }

      const allFiles = filesResult.files.map((f: DirectoryFileInfo) => f.path);
      const allDirs = filesResult.files
        .filter((f: DirectoryFileInfo) => f.metadata.type === "directory")
        .map((f: DirectoryFileInfo) => f.path);

      let resolvedPath = path;
      const isRootDirectory = path === "resumes";
      const isDirectory = allDirs.includes(path);
      const isFile = allFiles.includes(path);

      if (!isRootDirectory && !isDirectory && !isFile) {
        if (!path.endsWith(".yml") && !path.endsWith(".yaml")) {
          const withExtension = `${path}.yml`;
          if (allFiles.includes(withExtension)) {
            resolvedPath = withExtension;
          } else {
            throw new Error(
              `Directory/file not found: ${path}. Available files: ${allFiles.slice(0, 5).join(", ")}...`,
            );
          }
        } else {
          const withoutExtension = path.replace(/\.(yml|yaml)$/i, "");
          if (
            allFiles.includes(withoutExtension) ||
            allDirs.includes(withoutExtension)
          ) {
            resolvedPath = withoutExtension;
          } else {
            throw new Error(
              `Directory/file not found: ${path}. Available files: ${allFiles.slice(0, 5).join(", ")}...`,
            );
          }
        }
      }

      const response = await fetch(
        `/api/directory/load?path=${encodeURIComponent(resolvedPath)}`,
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load directory");
      }

      setFiles(filesResult.files);
      setAllResumes((prev) => ({
        ...prev,
        [resolvedPath]: {
          data: result.data,
          sources: result.sources,
          metadata: result.metadata,
        },
      }));
      setCurrentResumeKey(resolvedPath);
      setHasUnsavedChanges(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load directory";
      setError(errorMsg);
      console.error("Error loading directory:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllResumes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filesResponse = await fetch(
        `/api/directory/files?path=${encodeURIComponent("resumes")}&recursive=true`,
      );
      const filesResult = await filesResponse.json();

      if (!filesResult.success) {
        throw new Error("Failed to fetch available files");
      }

      setFiles(filesResult.files);

      const directories = filesResult.files
        .filter((f: DirectoryFileInfo) => f.metadata.type === "directory")
        .map((f: DirectoryFileInfo) => f.path);

      directories.unshift("resumes");

      const loadPromises = directories.map(async (dir: string) => {
        try {
          const response = await fetch(
            `/api/directory/load?path=${encodeURIComponent(dir)}`,
          );
          const result = await response.json();

          if (result.success) {
            return {
              key: dir,
              data: {
                data: result.data,
                sources: result.sources,
                metadata: result.metadata,
              },
            };
          }
        } catch (err) {
          console.warn(`Failed to load resume ${dir}:`, err);
        }
        return null;
      });

      const results = await Promise.all(loadPromises);
      const resumeCache: Record<string, DirectoryLoadResult> = {};

      results.forEach((result) => {
        if (result) {
          resumeCache[result.key] = result.data;
        }
      });

      setAllResumes(resumeCache);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load all resumes";
      setError(errorMsg);
      console.error("Error loading all resumes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentResume = useCallback((key: string) => {
    setCurrentResumeKey(key);
  }, []);

  const ensureResumeLoaded = useCallback(
    async (key: string) => {
      if (allResumes[key]) {
        setCurrentResumeKey(key);
        return;
      }

      await loadDirectory(key);
    },
    [allResumes, loadDirectory],
  );

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

  const refreshFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch ALL files from 'resumes' directory recursively
      // This ensures users can see and navigate to all files regardless of selected directory
      const response = await fetch(
        `/api/directory/files?path=${encodeURIComponent("resumes")}&recursive=true`,
      );
      const result = await response.json();

      if (result.success) {
        setFiles(result.files);
      } else {
        setError(result.error || "Failed to refresh files");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh files");
    } finally {
      setLoading(false);
    }
  }, []);

  const createDirectory = useCallback(
    async (parentPath: string, directoryName: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/directory/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentPath, directoryName }),
        });

        const result = await response.json();

        if (result.success) {
          await refreshFiles();
        } else {
          setError(result.error || "Failed to create directory");
          throw new Error(result.error || "Failed to create directory");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to create directory";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshFiles],
  );

  const splitSectionToFile = useCallback(
    async (
      sourceFilePath: string,
      sectionKey: string,
      targetFileName: string,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/directory/split", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceFilePath, sectionKey, targetFileName }),
        });

        const result = await response.json();

        if (result.success) {
          if (currentDirectory) {
            await loadDirectory(currentDirectory);
          }
          await refreshFiles();
        } else {
          setError(result.error || "Failed to split section");
          throw new Error(result.error || "Failed to split section");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to split section";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentDirectory, loadDirectory, refreshFiles],
  );

  const deleteFileToDeleted = useCallback(
    async (filePath: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/directory/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath }),
        });

        const result = await response.json();

        if (result.success) {
          await refreshFiles();
        } else {
          setError(result.error || "Failed to delete file");
          throw new Error(result.error || "Failed to delete file");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to delete file";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshFiles],
  );

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
    allResumes,
    currentResumeKey,
    currentDirectory,
    data,
    sources,
    metadata,
    files,
    loading,
    error,
    hasUnsavedChanges,
    parsedData: data,
    content: data ? JSON.stringify(data, null, 2) : "",
    currentFile: currentDirectory ? { path: currentDirectory } : null,
    loadAllResumes,
    setCurrentResume,
    ensureResumeLoaded,
    loadDirectory,
    updateDataPath,
    saveDirectory,
    discardChanges,
    getSourceFile,
    getHierarchy,
    listDirectoryFiles,
    refreshFiles,
    createDirectory,
    splitSectionToFile,
    deleteFileToDeleted,
    updateContent,
    saveFile,
  };

  return (
    <DirectoryManagerContext.Provider value={value}>
      {children}
    </DirectoryManagerContext.Provider>
  );
}
