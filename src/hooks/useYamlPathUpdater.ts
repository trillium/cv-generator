import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";

export function useYamlPathUpdater() {
  const { updateDataPath, currentDirectory } = useDirectoryManager();

  /**
   * Update a specific path in the YAML data
   * @param path - Dot-separated path to the field (e.g., 'workExperience.0.position')
   * @param newValue - New value to set
   */
  const updateYamlPath = async (path: string, newValue: unknown) => {
    try {
      console.log(`🎯 useYamlPathUpdater.updateYamlPath called with:`, {
        path,
        newValue,
        currentDirectory,
      });

      if (!currentDirectory) {
        throw new Error("No directory loaded");
      }

      // Update via directory manager
      console.log("🚀 Calling updateDataPath...");
      await updateDataPath(path, newValue);

      console.log(`✅ YAML path "${path}" updated successfully`);
    } catch (error) {
      console.error("❌ Error updating YAML path:", path, error);
      throw error;
    }
  };

  return {
    updateYamlPath,
    currentContext: currentDirectory
      ? {
          directoryPath: currentDirectory,
          mode: "directory" as const,
        }
      : null,
    isDirectoryMode: !!currentDirectory,
  };
}

/**
 * Get a nested value from an object using a dot-separated path
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split(/[.[\]]/).filter(Boolean);
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (!isNaN(Number(key)) && Array.isArray(current)) {
      current = current[Number(key)];
    } else if (
      typeof current === "object" &&
      current !== null &&
      !Array.isArray(current)
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}
