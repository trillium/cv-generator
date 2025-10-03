import { readdir, stat } from "fs/promises";
import { join } from "path";

/**
 * Gets all files in a directory (non-recursive for top level)
 */
export async function getFilesInDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const items = await readdir(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stats = await stat(fullPath);

      if (stats.isFile() && (item.endsWith(".yml") || item.endsWith(".yaml"))) {
        files.push(item);
      }
    }
  } catch {
    // Silently handle directory read errors and return empty array
    // This is expected behavior when directory doesn't exist
  }

  return files;
}

/**
 * Recursively gets all files in all subdirectories
 */
export async function getAllFilesRecursively(
  dirPath: string,
  basePath: string = dirPath,
): Promise<string[]> {
  const allFiles: string[] = [];

  try {
    const items = await readdir(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Recursively get files from subdirectory
        const subFiles = await getAllFilesRecursively(fullPath, basePath);
        allFiles.push(...subFiles);
      } else if (item.endsWith(".yml") || item.endsWith(".yaml")) {
        // Add file with relative path from base directory (only yml/yaml files)
        const relativePath = fullPath.replace(basePath + "/", "");
        allFiles.push(relativePath);
      }
    }
  } catch {
    // Silently handle directory read errors and return empty array
    // This is expected behavior when directory doesn't exist
  }

  return allFiles;
}

/**
 * Gets all files from directory and resumes subdirectory
 */
export async function getAllFiles(directory: string) {
  // Get all files in the main directory (top-level only)
  const mainDirFiles = await getFilesInDirectory(directory);

  // Get all files recursively from the /resumes subdirectory
  const resumesPath = join(directory, "resumes");
  const resumeFiles = await getAllFilesRecursively(resumesPath, resumesPath);

  // Combine both sets of files
  const allFiles = [
    ...mainDirFiles.map((file) => `${file}`),
    ...resumeFiles.map((file) => `resumes/${file}`),
  ];

  return {
    allFiles,
    mainDirFiles: mainDirFiles.length,
    resumeFiles: resumeFiles.length,
    totalFiles: allFiles.length,
  };
}
