import { UnifiedFileManager } from "./unifiedFileManager";
import {
  findDataFilesInDirectory,
  loadDataFile,
  isFullDataFilename,
  validateSectionSpecificFile,
  validateNoConflicts,
  getFormat,
  getAncestorDirectories,
  type FileEntry,
} from "./multiFileMapper";
import * as path from "path";
import type { CVData } from "../src/types";

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

export function loadFromDirectory(dirPath: string): CVData {
  const ancestorDirs = getAncestorDirectories(dirPath);

  const mergedData: Record<string, unknown> = {};
  const sectionSources = new Map<string, string>();

  for (const dir of ancestorDirs) {
    const dirData = loadSingleDirectory(dir);

    for (const [section, value] of Object.entries(dirData.merged)) {
      mergedData[section] = value;
      sectionSources.set(section, dirData.sources[section]);
    }
  }

  return mergedData as CVData;
}

export function findSourceFile(dirPath: string, section: string): string {
  const ancestors = getAncestorDirectories(dirPath).reverse();

  for (const dir of ancestors) {
    const files = findDataFilesInDirectory(dir);

    for (const file of files) {
      const data = loadDataFile(file);
      if (section in data) {
        return file;
      }
    }
  }

  throw new Error(`No file found containing section '${section}'`);
}
