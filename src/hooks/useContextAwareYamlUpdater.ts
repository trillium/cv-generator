import { useCallback } from "react";
import { useFileManager } from "../contexts/FileManagerContext.hook";

export function useContextAwareYamlUpdater() {
  const { currentFile, updateContent, saveFile } = useFileManager();

  const updateYamlContent = useCallback(
    async (newContent: string) => {
      console.log("🔍 useContextAwareYamlUpdater called with:", {
        currentFilePath: currentFile?.path,
        hasCurrentFile: !!currentFile,
        newContentLength: newContent.length,
        newContentPreview: newContent.substring(0, 100) + "...",
      });

      if (currentFile) {
        console.log("🎯 Updating file:", {
          filePath: currentFile.path,
        });

        try {
          updateContent(newContent);
          await saveFile(true);
          console.log("✅ File update completed");

          return { success: true, filePath: currentFile.path };
        } catch (error) {
          console.error("❌ File update failed:", error);
          throw error;
        }
      } else {
        throw new Error("No file loaded");
      }
    },
    [currentFile, updateContent, saveFile],
  );

  return {
    updateYamlContent,
    currentContext: currentFile
      ? {
          filePath: currentFile.path,
          fileName:
            currentFile.path
              .split("/")
              .pop()
              ?.replace(/\.(yml|yaml)$/i, "") || "resume",
        }
      : null,
    isFileBasedMode: !!currentFile,
  };
}
