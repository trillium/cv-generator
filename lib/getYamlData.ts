import { UnifiedFileManager } from "./unifiedFileManager";

export async function getYamlData(): Promise<string> {
  try {
    const fileManager = new UnifiedFileManager();
    const fileContent = await fileManager.read("data.yml");
    return fileContent.content;
  } catch (error) {
    console.error("Error reading YAML file:", error);
    return `# Error: Could not read data.yml file - ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
