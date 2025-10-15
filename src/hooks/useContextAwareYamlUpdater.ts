import { useCallback } from "react";
import { useDirectoryManager } from "../contexts/DirectoryManagerContext";

export function useContextAwareYamlUpdater() {
  const { currentDirectory, saveDirectory } = useDirectoryManager();

  const updateYamlContent = useCallback(
    async (newContent: string) => {
      console.log("🔍 useContextAwareYamlUpdater called with:", {
        currentDirectoryPath: currentDirectory,
        hasCurrentDirectory: !!currentDirectory,
        newContentLength: newContent.length,
        newContentPreview: newContent.substring(0, 100) + "...",
      });

      if (currentDirectory) {
        console.log("🎯 Using directory mode:", {
          directoryPath: currentDirectory,
        });

        // In directory mode, we don't update content directly
        // Updates should go through updateDataPath
        console.warn(
          "updateYamlContent called in directory mode - updates should use updateDataPath instead",
        );

        // Save any pending changes
        await saveDirectory();

        return { success: true, directoryPath: currentDirectory };
      } else {
        throw new Error("No directory loaded");
      }
    },
    [currentDirectory, saveDirectory],
  );

  return {
    updateYamlContent,
    currentContext: currentDirectory
      ? {
          directoryPath: currentDirectory,
          mode: "directory" as const,
        }
      : null,
    isDirectoryMode: !!currentDirectory,
  };
}
