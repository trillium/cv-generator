import { UnifiedFileManager } from "./unifiedFileManager";
import {
  findDataFilesInDirectory,
  loadDataFile,
  isFullDataFilename,
  validateSectionSpecificFile,
  validateNoConflicts,
  getFormat,
  type FileEntry,
} from "./multiFileMapper";
import * as path from "path";

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

interface DirectoryLoadResult {
  files: FileEntry[];
  merged: Record<string, unknown>;
  sources: Record<string, string>;
}

export function loadSingleDirectory(dirPath: string): DirectoryLoadResult {
  const files: FileEntry[] = [];
  const merged: Record<string, unknown> = {};
  const sources: Record<string, string> = {};

  const dataFiles = findDataFilesInDirectory(dirPath);

  for (const filePath of dataFiles) {
    const data = loadDataFile(filePath);
    const sections = Object.keys(data);
    const basename = path.basename(filePath);

    const isFullDataFile = isFullDataFilename(basename);
    if (!isFullDataFile) {
      validateSectionSpecificFile(basename, sections);
    }

    files.push({
      path: filePath,
      sections,
      format: getFormat(filePath),
    });

    for (const section of sections) {
      const existingSource = sources[section];
      const existingIsFullData = existingSource
        ? isFullDataFilename(path.basename(existingSource))
        : false;

      if (!existingSource || (existingIsFullData && !isFullDataFile)) {
        merged[section] = data[section];
        sources[section] = filePath;
      } else if (!existingIsFullData && isFullDataFile) {
        continue;
      }
    }
  }

  validateNoConflicts(files, dirPath);

  return { files, merged, sources };
}
