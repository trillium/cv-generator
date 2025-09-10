"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import * as yaml from "js-yaml";

interface ChangelogEntry {
  timestamp: string;
  action: "update" | "commit" | "discard";
  hasUnsavedChanges: boolean;
  message?: string;
  tempFile?: string;
}

interface YamlDataContextType {
  yamlContent: string;
  parsedData: any;
  hasUnsavedChanges: boolean;
  changelog: ChangelogEntry[];
  isLoading: boolean;
  error: string | null;
  updateYamlContent: (newContent: string) => Promise<void>;
  commitChanges: () => Promise<void>;
  discardChanges: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const YamlDataContext = createContext<YamlDataContextType | undefined>(
  undefined,
);

interface YamlDataProviderProps {
  children: ReactNode;
  initialYamlContent: string;
}

export function YamlDataProvider({
  children,
  initialYamlContent,
}: YamlDataProviderProps) {
  const [yamlContent, setYamlContent] = useState(initialYamlContent);
  const [parsedData, setParsedData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent excessive API calls
  const lastFetchTime = useRef<number>(0);
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef<boolean>(false);

  // Minimum time between API calls (in ms)
  const MIN_FETCH_INTERVAL = 1000; // 1 second
  const UPDATE_DEBOUNCE_DELAY = 500; // 500ms

  // Parse YAML content whenever it changes
  useEffect(() => {
    try {
      const parsed = yaml.load(yamlContent);
      setParsedData(parsed);
      setError(null);
    } catch (err) {
      setError(
        `YAML parsing error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setParsedData(null);
    }
  }, [yamlContent]);

  // Load initial data and check for temp changes (only once)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      refreshData();
    }

    // Cleanup on unmount
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, []);

  const refreshData = useCallback(async (force: boolean = false) => {
    // Prevent excessive API calls
    const now = Date.now();
    if (!force && now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
      console.log("Skipping API call - too recent");
      return;
    }

    lastFetchTime.current = now;
    setIsLoading(true);
    try {
      const response = await fetch("/api/yaml-data", {
        method: "GET",
        cache: "no-store", // Always get fresh data from file system
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setYamlContent(data.yamlContent);
        setHasUnsavedChanges(data.hasChanges);
        setChangelog(data.changelog || []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load data");
      }
    } catch (err) {
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateYamlContent = useCallback(
    async (newContent: string) => {
      // Clear any existing timeout
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }

      // Debounce the update to prevent excessive API calls
      updateTimeout.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          // Save to server first (file system is source of truth)
          const response = await fetch("/api/yaml-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              yamlContent: newContent,
              createBackup: false, // Don't create backup for temp saves
            }),
          });

          if (response.ok) {
            const result = await response.json();

            // Update state with fresh data from file system
            setYamlContent(result.newState.yamlContent);
            setHasUnsavedChanges(result.newState.hasChanges);

            if (result.changelogEntry) {
              setChangelog((prev) => [
                ...prev.slice(-9),
                result.changelogEntry,
              ]);
            }
            setError(null);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save changes");
          }
        } catch (err) {
          setError(
            `Failed to save changes: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
          // Refresh from file system if save failed (but don't force if recent)
          await refreshData();
        } finally {
          setIsLoading(false);
        }
      }, UPDATE_DEBOUNCE_DELAY);

      // Update local state immediately for better UX
      setYamlContent(newContent);
    },
    [refreshData],
  );

  const commitChanges = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/yaml-data/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "commit" }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update state with fresh data from file system
        setYamlContent(result.newState.yamlContent);
        setHasUnsavedChanges(result.newState.hasChanges);

        setChangelog((prev) => [
          ...prev.slice(-9),
          {
            timestamp: new Date().toISOString(),
            action: "commit",
            hasUnsavedChanges: false,
            message: result.message,
          },
        ]);
        setError(null);

        // No page reload - real-time updates via file system
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to commit changes");
      }
    } catch (err) {
      setError(
        `Failed to commit changes: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const discardChanges = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/yaml-data/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "discard" }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update state with fresh data from file system
        setYamlContent(result.newState.yamlContent);
        setHasUnsavedChanges(result.newState.hasChanges);

        setChangelog((prev) => [
          ...prev.slice(-9),
          {
            timestamp: new Date().toISOString(),
            action: "discard",
            hasUnsavedChanges: false,
            message: result.message,
          },
        ]);
        setError(null);

        // No page reload - real-time updates via file system
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to discard changes");
      }
    } catch (err) {
      setError(
        `Failed to discard changes: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: YamlDataContextType = {
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

  return (
    <YamlDataContext.Provider value={value}>
      {children}
    </YamlDataContext.Provider>
  );
}

export function useYamlData() {
  const context = useContext(YamlDataContext);
  if (context === undefined) {
    throw new Error("useYamlData must be used within a YamlDataProvider");
  }
  return context;
}
