import { FileSystemManager } from "./fileSystemManager";
import { MultiResumeManager } from "./multiResumeManager";
import { ResumeContext } from "./types/multiResume";

// This function will be used server-side to read the YAML data
// It always returns the most current data from the file system
// Now supports multi-resume context
export function getYamlData(context?: ResumeContext): string {
  try {
    // Check if multi-resume is enabled
    const multiResumeEnabled = process.env.MULTI_RESUME_ENABLED === 'true';

    if (multiResumeEnabled && context) {
      const multiResumeManager = new MultiResumeManager();
      return multiResumeManager.getYamlData(context);
    }

    // Fallback to original behavior for backward compatibility
    const fileManager = new FileSystemManager();
    const state = fileManager.getCurrentState();
    return state.yamlContent;
  } catch (error) {
    console.error("Error reading YAML file:", error);
    return `# Error: Could not read data.yml file - ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
