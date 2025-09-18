import { FileSystemManager } from "./fileSystemManager";

// This function will be used server-side to read the YAML data
// It always returns the most current data from the file system
export function getYamlData(): string {
  try {
    // Use FileSystemManager for YAML data access
    const fileManager = new FileSystemManager();
    const state = fileManager.getCurrentState();
    return state.yamlContent;
  } catch (error) {
    console.error("Error reading YAML file:", error);
    return `# Error: Could not read data.yml file - ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
