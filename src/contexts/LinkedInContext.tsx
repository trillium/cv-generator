"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { LinkedInData } from "../types/linkedin";
import * as yaml from "js-yaml";

interface LinkedInContextType {
  currentLinkedInData: LinkedInData | null;
  currentLinkedInFile: string | null;
  yamlContent: string;
  parsedData: LinkedInData | null;
  hasUnsavedChanges: boolean;
  loading: boolean;
  error: string | null;

  setCurrentLinkedInData: (data: LinkedInData | null) => void;
  loadLinkedInFile: (filePath: string) => Promise<void>;
  saveLinkedInData: (filePath?: string) => Promise<void>;
  updateYamlContent: (newContent: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const LinkedInContext = createContext<LinkedInContextType | undefined>(
  undefined,
);

interface LinkedInProviderProps {
  children: ReactNode;
}

export function LinkedInProvider({ children }: LinkedInProviderProps) {
  const [currentLinkedInData, setCurrentLinkedInData] =
    useState<LinkedInData | null>(null);
  const [currentLinkedInFile, setCurrentLinkedInFile] = useState<string | null>(
    null,
  );
  const [yamlContent, setYamlContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpdatingYamlContent = useRef<boolean>(false);

  const loadLinkedInFile = useCallback(async (filePath: string) => {
    console.log("🔄 loadLinkedInFile called with:", filePath);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/linkedin/load?path=${encodeURIComponent(filePath)}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to load file");
      }

      const yamlText = result.content;
      const parsed = yaml.load(yamlText) as LinkedInData;

      setYamlContent(yamlText);
      setCurrentLinkedInData(parsed);
      setCurrentLinkedInFile(filePath);
      setHasUnsavedChanges(false);

      console.log("✅ Successfully loaded LinkedIn file:", filePath);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load LinkedIn file";
      console.error("❌ LoadLinkedInFile error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLinkedInData = useCallback(
    async (filePath?: string) => {
      if (!currentLinkedInData) {
        const errorMsg = "No LinkedIn data to save";
        console.error("❌", errorMsg);
        setError(errorMsg);
        return;
      }

      const targetPath = filePath || currentLinkedInFile;
      if (!targetPath) {
        const errorMsg = "No file path specified for saving";
        console.error("❌", errorMsg);
        setError(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const yamlToSave =
          yamlContent ||
          yaml.dump(currentLinkedInData, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
          });

        const response = await fetch("/api/linkedin/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: targetPath,
            content: yamlToSave,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save LinkedIn data");
        }

        setHasUnsavedChanges(false);
        console.log("✅ LinkedIn data saved successfully");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save LinkedIn data";
        console.error("❌ Save failed:", err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentLinkedInData, currentLinkedInFile, yamlContent],
  );

  const updateYamlContent = useCallback(
    async (newContent: string) => {
      try {
        isUpdatingYamlContent.current = true;

        const parsed = yaml.load(newContent) as LinkedInData;

        setYamlContent(newContent);
        setCurrentLinkedInData(parsed);
        setHasUnsavedChanges(true);

        if (currentLinkedInFile) {
          try {
            const response = await fetch("/api/linkedin/save", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                filePath: currentLinkedInFile,
                content: newContent,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to save YAML content");
            }

            setHasUnsavedChanges(false);
            console.log("✅ YAML content saved successfully");
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to save YAML content";
            console.error("❌ Immediate YAML save failed:", err);
            setError(errorMessage);
            throw err;
          }
        }
      } catch (err) {
        console.error("❌ Error updating YAML content:", err);
        throw err;
      } finally {
        isUpdatingYamlContent.current = false;
      }
    },
    [currentLinkedInFile],
  );

  const refreshData = useCallback(async () => {
    if (currentLinkedInFile) {
      await loadLinkedInFile(currentLinkedInFile);
    }
  }, [currentLinkedInFile, loadLinkedInFile]);

  const value: LinkedInContextType = {
    currentLinkedInData,
    currentLinkedInFile,
    yamlContent,
    parsedData: currentLinkedInData,
    hasUnsavedChanges,
    loading,
    error,
    setCurrentLinkedInData,
    loadLinkedInFile,
    saveLinkedInData,
    updateYamlContent,
    refreshData,
  };

  return (
    <LinkedInContext.Provider value={value}>
      {children}
    </LinkedInContext.Provider>
  );
}

export function useLinkedInContext() {
  const context = useContext(LinkedInContext);
  if (context === undefined) {
    throw new Error(
      "useLinkedInContext must be used within a LinkedInProvider",
    );
  }
  return context;
}

export function useLinkedInData() {
  return useLinkedInContext();
}
