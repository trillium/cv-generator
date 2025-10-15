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
import * as fs from "fs";
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

/**
 * Loads all data files from a single directory
 * @param dirPath - Absolute path to directory
 * @returns Object containing files, merged data, and source tracking
 * @throws Error if validation fails
 */
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

/**
 * Loads CV data from a directory hierarchy
 * @param dirPath - Relative path from PII_PATH (e.g., 'base/google/python')
 * @returns Merged CV data from all ancestor directories
 * @throws Error if validation fails or no data found
 * @example
 * loadFromDirectory('base/google')
 * // Loads from: base/, base/google/
 */
export function loadFromDirectory(dirPath: string): CVData {
  const ancestorDirs = getAncestorDirectories(dirPath);

  // Check if at least the target directory exists
  const targetDir = ancestorDirs[ancestorDirs.length - 1];
  if (!fs.existsSync(targetDir)) {
    throw new Error(
      `Directory not found: ${dirPath}\n` +
        `Expected path: ${targetDir}\n` +
        `Make sure the directory exists in the PII folder.`,
    );
  }

  const mergedData: Record<string, unknown> = {};
  const sectionSources = new Map<string, string>();
  let foundAnyData = false;

  for (const dir of ancestorDirs) {
    const dirData = loadSingleDirectory(dir);

    if (Object.keys(dirData.merged).length > 0) {
      foundAnyData = true;
    }

    for (const [section, value] of Object.entries(dirData.merged)) {
      mergedData[section] = value;
      sectionSources.set(section, dirData.sources[section]);
    }
  }

  if (!foundAnyData) {
    throw new Error(
      `No data files found in directory: ${dirPath}\n` +
        `Checked directories: ${ancestorDirs.join(", ")}\n` +
        `Make sure there are YAML or JSON data files in the directory.`,
    );
  }

  return mergedData as CVData;
}

/**
 * Finds the most specific file containing a section
 * @param dirPath - Relative path from PII_PATH
 * @param section - CVData section key to find
 * @returns Absolute path to the file containing the section
 * @throws Error if section not found in any file
 */
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

function extractTopLevelKey(dataPath: string): string {
  const parts = dataPath.split(/[.[\]]/);
  return parts[0];
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split(/[.[\]]/).filter(Boolean);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Updates a nested value in the appropriate source file
 * @param dirPath - Relative path from PII_PATH
 * @param dataPath - Dot-notation path to the value (e.g., 'workExperience[0].position')
 * @param value - New value to set
 * @throws Error if section not found
 */
export async function updateDataPath(
  dirPath: string,
  dataPath: string,
  value: unknown,
): Promise<void> {
  const section = extractTopLevelKey(dataPath);
  const sourceFile = findSourceFile(dirPath, section);

  const data = loadDataFile(sourceFile);
  setNestedValue(data, dataPath, value);

  const fileManager = new UnifiedFileManager();
  const ext = path.extname(sourceFile);

  if (ext === ".json") {
    await fileManager.save(sourceFile, JSON.stringify(data, null, 2));
  } else {
    const yamlModule = await import("js-yaml");
    await fileManager.save(sourceFile, yamlModule.dump(data));
  }
}
