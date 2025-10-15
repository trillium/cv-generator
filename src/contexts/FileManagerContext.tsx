"use client";

import { useState, useCallback, ReactNode } from "react";
import { FileManagerContext } from "./FileManagerContext.constants";
import { FileMetadata, FileType, Version, Diff } from "@/types/fileManager";
import { CVData } from "@/types";
import { LinkedInData } from "@/types/linkedin";

function setNestedProperty<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce(
    (acc: Record<string, unknown>, key: string) => {
      const match = key.match(/^(.+)\[(\d+)\]$/);
      if (match) {
        const [, arrayKey, index] = match;
        (acc[arrayKey] as unknown[]) = (acc[arrayKey] as unknown[]) || [];
        (acc[arrayKey] as unknown[])[parseInt(index)] =
          (acc[arrayKey] as unknown[])[parseInt(index)] || {};
        return (acc[arrayKey] as unknown[])[parseInt(index)] as Record<
          string,
          unknown
        >;
      }
      acc[key] = acc[key] || {};
      return acc[key] as Record<string, unknown>;
    },
    obj as Record<string, unknown>,
  );

  const lastMatch = lastKey.match(/^(.+)\[(\d+)\]$/);
  if (lastMatch) {
    const [, arrayKey, index] = lastMatch;
    (target[arrayKey] as unknown[]) = (target[arrayKey] as unknown[]) || [];
    (target[arrayKey] as unknown[])[parseInt(index)] = value;
  } else {
    target[lastKey] = value;
  }

  return obj;
}

export interface DirectoryMetadata {
  directoryPath: string;
  loadedDirectories: string[];
  filesLoaded: string[];
  hasUnsavedChanges: boolean;
}

export interface DirectoryFileInfo {
  path: string;
  fullPath: string;
  sections: string[];
  format: "yaml" | "json";
  isFullData: boolean;
  metadata: FileMetadata;
}

export interface FileManagerContextType {
  currentDirectory: string | null;
  directoryMetadata: DirectoryMetadata | null;
  sources: Record<string, string>;
  currentFile: FileMetadata | null;
  content: string;
  parsedData: CVData | LinkedInData | null;
  hasUnsavedChanges: boolean;
  files: DirectoryFileInfo[];
  filteredFiles: DirectoryFileInfo[];
  fileType: "all" | FileType;
  searchQuery: string;
  selectedTags: string[];
  loading: boolean;
  error: string | null;
  loadDirectory: (dirPath: string) => Promise<void>;
  loadFile: (filePath: string) => Promise<void>;
  updateField: (yamlPath: string, value: unknown) => Promise<void>;
  saveChanges: (commit?: boolean) => Promise<void>;
  discardChanges: () => Promise<void>;
  updateContent: (newContent: string) => void;
  createNewFile: (
    dirPath: string,
    fileName: string,
    content: string,
  ) => Promise<void>;
  duplicateFile: (
    dirPath: string,
    fileName: string,
    newName: string,
  ) => Promise<string>;
  deleteFile: (dirPath: string, fileName: string) => Promise<void>;
  restoreVersion: (path: string, version: string) => Promise<void>;
  getVersionHistory: (path: string) => Promise<Version[]>;
  getFileDiff: (path: string, from: string, to: string) => Promise<Diff>;
  updateTags: (path: string, tags: string[]) => Promise<void>;
  updateDescription: (path: string, desc: string) => Promise<void>;
  setFileType: (type: "all" | FileType) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  refreshFiles: () => Promise<void>;
  createDirectory: (parentPath: string, directoryName: string) => Promise<void>;
  splitSectionToFile: (
    sourceFilePath: string,
    sectionKey: string,
    targetFileName: string,
  ) => Promise<void>;
  deleteFileToDeleted: (filePath: string) => Promise<void>;
}

interface FileManagerProviderProps {
  children: ReactNode;
}

export function FileManagerProvider({ children }: FileManagerProviderProps) {
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(
    "base",
  );
  const [directoryMetadata, setDirectoryMetadata] =
    useState<DirectoryMetadata | null>(null);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [content, setContent] = useState("");
  const [parsedData, setParsedData] = useState<CVData | LinkedInData | null>(
    null,
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [files, setFiles] = useState<DirectoryFileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<DirectoryFileInfo[]>([]);

  const [fileType, setFileType] = useState<"all" | FileType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    if (!currentDirectory) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/directory/files?path=${encodeURIComponent(currentDirectory)}&recursive=true`,
      );
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);

        let filtered = data.files;
        if (fileType !== "all") {
          filtered = filtered.filter(
            (f: DirectoryFileInfo) => f.metadata.type === fileType,
          );
        }
        if (searchQuery) {
          filtered = filtered.filter((f: DirectoryFileInfo) =>
            f.path.toLowerCase().includes(searchQuery.toLowerCase()),
          );
        }
        if (selectedTags.length > 0) {
          filtered = filtered.filter((f: DirectoryFileInfo) =>
            selectedTags.some((tag) => f.metadata.tags.includes(tag)),
          );
        }

        setFilteredFiles(filtered);
      } else {
        setError(data.error || "Failed to load files");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [currentDirectory, fileType, searchQuery, selectedTags]);

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

        const data = await response.json();

        if (data.success) {
          await refreshFiles();
        } else {
          setError(data.error || "Failed to create directory");
          throw new Error(data.error || "Failed to create directory");
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

        const data = await response.json();

        if (data.success) {
          if (currentDirectory) {
            await loadDirectory(currentDirectory);
          }
          await refreshFiles();
        } else {
          setError(data.error || "Failed to split section");
          throw new Error(data.error || "Failed to split section");
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
    [currentDirectory, refreshFiles],
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

        const data = await response.json();

        if (data.success) {
          await refreshFiles();
        } else {
          setError(data.error || "Failed to delete file");
          throw new Error(data.error || "Failed to delete file");
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

  const loadDirectory = useCallback(
    async (dirPath: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/directory/load?path=${encodeURIComponent(dirPath)}`,
        );
        const data = await response.json();

        if (data.success) {
          setCurrentDirectory(dirPath);
          setParsedData(data.data as CVData | LinkedInData);
          setSources(data.sources);
          setDirectoryMetadata(data.metadata);
          setHasUnsavedChanges(data.metadata.hasUnsavedChanges);
          setContent("");

          await refreshFiles();
        } else {
          setError(data.error || "Failed to load directory");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load directory",
        );
      } finally {
        setLoading(false);
      }
    },
    [refreshFiles],
  );

  const loadFile = useCallback(
    async (filePath: string) => {
      const dirPath = filePath.split("/").slice(0, -1).join("/") || "base";
      await loadDirectory(dirPath);
    },
    [loadDirectory],
  );

  const updateField = useCallback(
    async (yamlPath: string, value: unknown) => {
      if (!currentDirectory) {
        setError("No directory loaded");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const newData = { ...(parsedData || {}) };
        setNestedProperty(newData, yamlPath, value);
        setParsedData(newData as CVData | LinkedInData);
        setHasUnsavedChanges(true);

        const response = await fetch("/api/directory/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directoryPath: currentDirectory,
            yamlPath,
            value,
            commit: false,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to update field");
          await loadDirectory(currentDirectory);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update field");
        if (currentDirectory) {
          await loadDirectory(currentDirectory);
        }
      } finally {
        setLoading(false);
      }
    },
    [currentDirectory, parsedData, loadDirectory],
  );

  const saveChanges = useCallback(
    async (commit = false) => {
      if (!currentDirectory) {
        setError("No directory loaded");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (commit && currentDirectory) {
          await loadDirectory(currentDirectory);
        }

        setHasUnsavedChanges(!commit);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save changes");
      } finally {
        setLoading(false);
      }
    },
    [currentDirectory, loadDirectory],
  );

  const discardChanges = useCallback(async () => {
    if (!currentDirectory) {
      setError("No directory loaded");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await loadDirectory(currentDirectory);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to discard changes",
      );
    } finally {
      setLoading(false);
    }
  }, [currentDirectory, loadDirectory]);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  const createNewFile = useCallback(
    async (
      dirPath: string,
      fileName: string,
      content: string,
    ): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        console.log("Create file in directory:", dirPath, fileName, content);
        setError("File creation not yet implemented for directory API");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to create file";
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const duplicateFile = useCallback(
    async (
      dirPath: string,
      fileName: string,
      newName: string,
    ): Promise<string> => {
      try {
        setLoading(true);
        setError(null);

        console.log("Duplicate file:", dirPath, fileName, newName);
        setError("File duplication not yet implemented for directory API");
        return "";
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to duplicate file";
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteFile = useCallback(async (dirPath: string, fileName: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Delete file:", dirPath, fileName);
      setError("File deletion not yet implemented for directory API");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreVersion = useCallback(async (path: string, version: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Restore version:", path, version);
      setError("Version restore not yet implemented for directory API");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore version",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const getVersionHistory = useCallback(
    async (path: string): Promise<Version[]> => {
      try {
        console.log("Get version history:", path);
        setError("Version history not yet implemented for directory API");
        return [];
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
        console.log("Get file diff:", path, from, to);
        setError("File diff not yet implemented for directory API");
        return { diff: "", stats: { additions: 0, deletions: 0, changes: 0 } };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get diff";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [],
  );

  const updateTags = useCallback(async (path: string, tags: string[]) => {
    try {
      console.log("Update tags:", path, tags);
      setError("Tag updates not yet implemented for directory API");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tags");
    }
  }, []);

  const updateDescription = useCallback(async (path: string, desc: string) => {
    try {
      console.log("Update description:", path, desc);
      setError("Description updates not yet implemented for directory API");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update description",
      );
    }
  }, []);

  const value: FileManagerContextType = {
    currentDirectory,
    directoryMetadata,
    sources,
    currentFile: null,
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
    loadDirectory,
    loadFile,
    updateField,
    saveChanges,
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
    createDirectory,
    splitSectionToFile,
    deleteFileToDeleted,
  };

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
}
