import { useContext, useCallback } from "react";
import { useResumeContext } from "../contexts/ResumeContext";
import { useYamlData } from "../contexts/ResumeContext";
import { CVData } from "../types";

/**
 * Hook that provides context-aware YAML updating
 * Routes updates to the correct system (file-based or legacy)
 */
export function useContextAwareYamlUpdater() {
    const {
        currentResume,
        currentResumeFile,
        saveCurrentResume,
        loadResumeFile,
        updateYamlContent: contextUpdateYamlContent,
        commitChanges
    } = useResumeContext();
    const { updateYamlContent: legacyUpdateYamlContent } = useYamlData();

    const updateYamlContent = useCallback(
        async (newContent: string) => {
            console.log("🔍 useContextAwareYamlUpdater called with:", {
                currentResumeFile,
                hasCurrentResume: !!currentResume,
                newContentLength: newContent.length,
                newContentPreview: newContent.substring(0, 100) + "..."
            });

            if (currentResumeFile && currentResume) {
                // Use file-based system with ResumeContext's updateYamlContent
                console.log("🎯 Updating via file-based system:", {
                    filePath: currentResumeFile,
                });

                try {
                    // Use the context's updateYamlContent which now handles immediate saving
                    console.log("📝 Calling contextUpdateYamlContent (will save immediately)...");
                    await contextUpdateYamlContent(newContent);
                    console.log("✅ contextUpdateYamlContent completed with immediate save");

                    // No need to call commitChanges since saving happened immediately
                    console.log("✅ File-based update completed (saved immediately)");

                    return { success: true, filePath: currentResumeFile };
                } catch (error) {
                    console.error("❌ File-based update failed:", error);
                    throw error;
                }
            } else {
                // Use legacy system
                console.log("📝 Updating via legacy system (default data.yml):", {
                    reason: !currentResumeFile ? "No currentResumeFile" : "No currentResume"
                });
                return await legacyUpdateYamlContent(newContent);
            }
        },
        [currentResumeFile, currentResume, contextUpdateYamlContent, commitChanges, legacyUpdateYamlContent]
    );

    return {
        updateYamlContent,
        currentContext: currentResumeFile ? {
            filePath: currentResumeFile,
            fileName: currentResumeFile.split('/').pop()?.replace(/\.(yml|yaml)$/i, '') || 'resume',
        } : null,
        isFileBasedMode: !!(currentResumeFile && currentResume),
    };
}
