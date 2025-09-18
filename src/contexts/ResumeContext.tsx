"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { CVData } from "../types";
import * as yaml from "js-yaml";
import {
  listAllResumeFiles,
  readResumeData,
  saveResumeChanges,
  saveYamlContent,
  deleteResumeWithBackup,
  duplicateResume,
  type FileListResponse,
} from "../../lib/utility";

interface ChangelogEntry {
  timestamp: string;
  action: "update" | "commit" | "discard" | "file-switch";
  hasUnsavedChanges: boolean;
  message?: string;
  filePath?: string;
}

interface ResumeContextType {
  // Current resume state
  currentResume: CVData | null;
  currentResumeFile: string | null;

  // YAML content (for components that need raw YAML)
  yamlContent: string;
  parsedData: CVData | null; // Alias for currentResume for backwards compatibility
  hasUnsavedChanges: boolean;
  changelog: ChangelogEntry[];

  // File management
  availableFiles: FileListResponse | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading for backwards compatibility
  error: string | null;

  // Actions
  setCurrentResume: (resume: CVData | null) => void;
  loadAvailableFiles: () => Promise<void>;
  loadResumeFile: (filePath: string) => Promise<void>;
  saveCurrentResume: (filePath?: string) => Promise<void>;
  createNewResume: (
    fileName: string,
    templateData?: Partial<CVData>,
  ) => Promise<void>;
  deleteResume: (filePath: string) => Promise<void>;
  duplicateResumeFile: (
    sourcePath: string,
    destinationPath: string,
  ) => Promise<void>;

  // YAML content management
  updateYamlContent: (newContent: string) => Promise<void>;
  commitChanges: () => Promise<void>;
  discardChanges: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

interface ResumeProviderProps {
  children: ReactNode;
}

export function ResumeProvider({ children }: ResumeProviderProps) {
  const pathname = usePathname();
  const [currentResume, setCurrentResume] = useState<CVData | null>(null);
  const [currentResumeFile, setCurrentResumeFile] = useState<string | null>(
    null,
  );

  // Debug pathname changes
  useEffect(() => {
    console.log("🌐 ResumeContext: Pathname changed to:", pathname);
  }, [pathname]);
  const [availableFiles, setAvailableFiles] = useState<FileListResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YAML content state for backwards compatibility
  const [yamlContent, setYamlContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);

  // Refs for debouncing and throttling
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef<boolean>(false);
  const isUpdatingYamlContent = useRef<boolean>(false);

  // Update YAML content whenever currentResume changes
  useEffect(() => {
    console.log("🔄 currentResume changed:");
    console.log("📊 Current resume file:", currentResumeFile);
    console.log("📝 Has resume data:", !!currentResume);
    if (currentResume) {
      console.log("📋 Resume data keys:", Object.keys(currentResume));
    }

    if (currentResume && !isUpdatingYamlContent.current) {
      try {
        const newYamlContent = yaml.dump(currentResume, {
          indent: 2,
          lineWidth: -1, // Disable line wrapping
          noRefs: true,
          sortKeys: false,
        });
        setYamlContent(newYamlContent);
        console.log("✅ YAML content updated from resume data");
      } catch (err) {
        console.error("❌ Failed to convert resume to YAML:", err);
        setError(
          `Failed to convert resume to YAML: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    } else if (!currentResume) {
      console.log("🗑️ Clearing YAML content (no resume data)");
      setYamlContent("");
    }
  }, [currentResume, currentResumeFile]);

  // Load default resume on initialization (only if not on a dynamic route)
  useEffect(() => {
    console.log("🔍 ResumeContext Initialization Effect Triggered");
    console.log("📍 Current pathname:", pathname);
    console.log("🔄 isInitialized.current:", isInitialized.current);

    if (!isInitialized.current) {
      isInitialized.current = true;

      // Check if we're on a dynamic route that handles its own data loading
      const isDynamicRoute = pathname && pathname.split("/").length > 3; // e.g., /single-column/resume/[resume-path]
      console.log("🔀 Is dynamic route?", isDynamicRoute);
      console.log("📊 Path segments:", pathname ? pathname.split("/") : []);

      console.log("📂 Loading available files...");
      loadAvailableFiles()
        .then(() => {
          console.log("✅ Available files loaded");
          // Only load default file if we're not on a dynamic route
          if (!isDynamicRoute) {
            console.log(
              "📄 Loading default file: data.yml (not on dynamic route)",
            );
            loadResumeFile("data.yml").catch((error) => {
              console.log("❌ Failed to load default file:", error);
            });
          } else {
            console.log("⏩ Skipping default file load (on dynamic route)");
          }
        })
        .catch((error) => {
          console.log("❌ Failed to load available files:", error);
        });
    }

    // Cleanup on unmount
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, [pathname]); // Add pathname as dependency

  const loadAvailableFiles = useCallback(async () => {
    console.log("📂 loadAvailableFiles called");
    setLoading(true);
    setError(null);

    try {
      const result = await listAllResumeFiles();
      if (result.success && result.data) {
        console.log(
          "✅ Available files loaded:",
          result.data.allFiles.length,
          "files",
        );
        console.log("📋 File list:", result.data.allFiles);
        setAvailableFiles(result.data);
      } else {
        throw new Error(result.error || "Failed to load available files");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load available files";
      console.error("❌ loadAvailableFiles error:", err);
      setError(errorMessage);
      console.error("Failed to load available files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResumeFile = useCallback(
    async (filePath: string) => {
      console.log("🔄 loadResumeFile called with:", filePath);
      console.log("📍 Current pathname when loading:", pathname);
      setLoading(true);
      setError(null);

      try {
        console.log("📥 Attempting to read resume data for:", filePath);
        const result = await readResumeData([filePath]);

        if (result.success && result.data && result.data[filePath]) {
          console.log("✅ Successfully loaded resume file:", filePath);
          console.log(
            "📊 Resume data keys:",
            Object.keys(result.data[filePath]),
          );

          // Initialize missing optional fields
          const loadedData = result.data[filePath];
          const initializedData: CVData = {
            ...loadedData,
            technical: loadedData.technical || [],
            languages: loadedData.languages || [],
            education: loadedData.education || [],
            projects: loadedData.projects || [],
            coverLetter: loadedData.coverLetter || [],
            careerSummary: loadedData.careerSummary || [],
          };

          // Clear previous YAML content and unsaved changes when loading a new file
          setYamlContent("");
          setHasUnsavedChanges(false);
          setError(null);

          setCurrentResume(initializedData);
          setCurrentResumeFile(filePath);
        } else {
          const errorMsg = result.error || `File not found: ${filePath}`;
          console.error("❌ Failed to load resume:", errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load resume file";
        console.error("❌ LoadResumeFile error:", err);
        setError(errorMessage);
        console.error("Failed to load resume file:", err);
      } finally {
        setLoading(false);
      }
    },
    [pathname],
  );

  const saveCurrentResume = useCallback(
    async (filePath?: string) => {
      if (!currentResume) {
        const errorMsg = "No resume data to save";
        console.error("❌", errorMsg);
        setError(errorMsg);
        return;
      }

      const targetPath = filePath || currentResumeFile;
      if (!targetPath) {
        const errorMsg = "No file path specified for saving";
        console.error("❌", errorMsg);
        setError(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await saveResumeChanges(targetPath, currentResume);
        if (result.success) {
          setCurrentResumeFile(targetPath);
          // Refresh file list
          await loadAvailableFiles();
        } else {
          throw new Error(result.error || "Failed to save resume");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save resume";
        console.error("❌ Save failed:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentResume, currentResumeFile, loadAvailableFiles],
  );

  const createNewResume = useCallback(
    async (fileName: string, templateData?: Partial<CVData>): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        // Create a basic resume template
        const defaultTemplate: CVData = {
          info: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            role: "",
          },
          careerSummary: [],
          header: {
            name: "",
            title: [],
            resume: [],
          },
          workExperience: [],
          profile: {
            shouldDisplayProfileImage: false,
            lines: [],
            links: [],
          },
          technical: [],
          languages: [],
          education: [],
          projects: [],
          coverLetter: [],
          ...templateData,
        };

        const result = await saveResumeChanges(fileName, defaultTemplate);
        if (result.success) {
          setCurrentResume(defaultTemplate);
          setCurrentResumeFile(fileName);
          // Refresh file list
          await loadAvailableFiles();
        } else {
          throw new Error(result.error || "Failed to create new resume");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create new resume";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadAvailableFiles],
  );

  const deleteResume = useCallback(
    async (filePath: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await deleteResumeWithBackup(filePath);
        if (result.success) {
          // If we deleted the current file, clear current resume
          if (filePath === currentResumeFile) {
            setCurrentResume(null);
            setCurrentResumeFile(null);
          }
          // Refresh file list
          await loadAvailableFiles();
        } else {
          throw new Error(result.error || "Failed to delete resume");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete resume";
        setError(errorMessage);
        console.error("Failed to delete resume:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentResumeFile, loadAvailableFiles],
  );

  const duplicateResumeFile = useCallback(
    async (sourcePath: string, destinationPath: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await duplicateResume(sourcePath, destinationPath);
        if (result.success) {
          // Refresh file list
          await loadAvailableFiles();
        } else {
          throw new Error(result.error || "Failed to duplicate resume");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to duplicate resume";
        setError(errorMessage);
        console.error("Failed to duplicate resume:", err);
      } finally {
        setLoading(false);
      }
    },
    [loadAvailableFiles],
  );

  const refreshData = useCallback(async () => {
    await loadAvailableFiles();
    if (currentResumeFile) {
      await loadResumeFile(currentResumeFile);
    } else {
      // If no current file is set, try to load the default data.yml
      console.log("🔄 No current file set, loading default data.yml");
      await loadResumeFile("data.yml").catch((error) => {
        console.log("❌ Failed to load default file in refreshData:", error);
      });
    }
  }, [loadAvailableFiles, loadResumeFile, currentResumeFile]);

  // YAML content management functions for backwards compatibility
  const updateYamlContent = useCallback(
    async (newContent: string) => {
      try {
        // Set flag to prevent useEffect from overriding our manual YAML content
        isUpdatingYamlContent.current = true;

        // Parse YAML to CVData
        const parsed = yaml.load(newContent) as CVData;

        // Initialize missing optional fields
        const initializedData: CVData = {
          ...parsed,
          technical: parsed.technical || [],
          languages: parsed.languages || [],
          education: parsed.education || [],
          projects: parsed.projects || [],
          coverLetter: parsed.coverLetter || [],
          careerSummary: parsed.careerSummary || [],
        };

        // Update both states
        setYamlContent(newContent);
        setCurrentResume(initializedData);
        setHasUnsavedChanges(true);

        // IMMEDIATELY save the new content to avoid state race conditions
        if (currentResumeFile) {
          try {
            const result = await saveYamlContent(currentResumeFile, newContent);
            if (result.success) {
              await loadAvailableFiles();
              setHasUnsavedChanges(false);
            } else {
              throw new Error(result.error || "Failed to save YAML content");
            }
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to save YAML content";
            console.error("❌ Immediate YAML save failed:", err);
            setError(errorMessage);
          }
        }

        // Add changelog entry
        setChangelog((prev) => [
          ...prev.slice(-9),
          {
            timestamp: new Date().toISOString(),
            action: "update",
            hasUnsavedChanges: false, // Already saved immediately
            message: "YAML content updated and saved",
            filePath: currentResumeFile || undefined,
          },
        ]);

        // Reset flag after a brief delay to allow React to process the state updates
        setTimeout(() => {
          isUpdatingYamlContent.current = false;
        }, 100);
      } catch (err) {
        isUpdatingYamlContent.current = false;
        const errorMsg = `Invalid YAML: ${err instanceof Error ? err.message : "Unknown error"}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [currentResumeFile, yamlContent, saveYamlContent, loadAvailableFiles],
  );

  const commitChanges = useCallback(async () => {
    if (currentResume && currentResumeFile && yamlContent) {
      try {
        const result = await saveYamlContent(currentResumeFile, yamlContent);
        if (result.success) {
          await loadAvailableFiles();
        } else {
          throw new Error(result.error || "Failed to save YAML content");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save YAML content";
        console.error("❌ YAML save failed:", err);
        setError(errorMessage);
        return; // Don't update unsaved changes flag if save failed
      }

      setHasUnsavedChanges(false);

      setChangelog((prev) => [
        ...prev.slice(-9),
        {
          timestamp: new Date().toISOString(),
          action: "commit",
          hasUnsavedChanges: false,
          message: "Changes committed to file (direct YAML)",
          filePath: currentResumeFile,
        },
      ]);
    } else {
    }
  }, [
    currentResume,
    currentResumeFile,
    hasUnsavedChanges,
    yamlContent,
    loadAvailableFiles,
  ]);

  const discardChanges = useCallback(async () => {
    if (currentResumeFile) {
      await loadResumeFile(currentResumeFile);
      setHasUnsavedChanges(false);

      setChangelog((prev) => [
        ...prev.slice(-9),
        {
          timestamp: new Date().toISOString(),
          action: "discard",
          hasUnsavedChanges: false,
          message: "Changes discarded, reverted to file",
          filePath: currentResumeFile,
        },
      ]);
    }
  }, [currentResumeFile, loadResumeFile]);

  const contextValue: ResumeContextType = {
    currentResume,
    currentResumeFile,
    yamlContent,
    parsedData: currentResume, // Alias for backwards compatibility
    hasUnsavedChanges,
    changelog,
    availableFiles,
    loading,
    isLoading: loading, // Alias for backwards compatibility
    error,
    setCurrentResume,
    loadAvailableFiles,
    loadResumeFile,
    saveCurrentResume,
    createNewResume,
    deleteResume,
    duplicateResumeFile,
    updateYamlContent,
    commitChanges,
    discardChanges,
    refreshData,
  };

  return (
    <ResumeContext.Provider value={contextValue}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResumeContext() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResumeContext must be used within a ResumeProvider");
  }
  return context;
}

// Hook for accessing available files
export function useAvailableFiles() {
  const { availableFiles, loadAvailableFiles, loading, error } =
    useResumeContext();
  return { availableFiles, loadAvailableFiles, loading, error };
}

// Hook for accessing current resume
export function useCurrentResume() {
  const {
    currentResume,
    currentResumeFile,
    loadResumeFile,
    saveCurrentResume,
  } = useResumeContext();
  return {
    currentResume,
    currentResumeFile,
    loadResumeFile,
    saveCurrentResume,
  };
}

// Main hook for YAML data management
export function useYamlData() {
  const {
    yamlContent,
    parsedData,
    hasUnsavedChanges,
    changelog,
    isLoading,
    error,
    updateYamlContent,
    commitChanges,
    discardChanges,
    refreshData,
  } = useResumeContext();

  return {
    yamlContent,
    parsedData,
    hasUnsavedChanges,
    changelog,
    isLoading,
    error,
    updateYamlContent,
    commitChanges,
    discardChanges,
    refreshData,
  };
}
