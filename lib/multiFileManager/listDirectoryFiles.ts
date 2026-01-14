import { getPiiDirectory } from "../getPiiPath";
import {
  loadDataFile,
  isFullDataFilename,
  SUPPORTED_EXTENSIONS,
  parseNumberedArrayFile,
} from "../multiFileMapper";
import * as path from "path";
import * as fs from "fs/promises";
import fsSync from "fs";
import type { DirectoryFileInfo } from "@/types/multiFileManager.types";
import { isSectionSpecificFile, getMinimalFileStats } from "./fileUtils";

export async function listDirectoryFiles(
  dirPath: string,
): Promise<DirectoryFileInfo[]> {
  const piiPath = getPiiDirectory();
  const fullPath = path.join(piiPath, dirPath);
  if (!fsSync.existsSync(fullPath)) {
    return [];
  }
  const files = await fs.readdir(fullPath);
  const dataFiles: DirectoryFileInfo[] = [];
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const fullFilePath = path.join(fullPath, file);
    try {
      const stat = await fs.stat(fullFilePath);
      if (!stat.isFile()) continue;
      const ext = path.extname(file);
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

      const parsed = parseNumberedArrayFile(file);
      if (parsed) {
        const data = loadDataFile(fullFilePath);
        const sections = Object.keys(data);
        const fileMetadata = await getMinimalFileStats(filePath);
        dataFiles.push({
          path: filePath,
          fullPath: fullFilePath,
          sections,
          format: ext === ".json" ? "json" : "yaml",
          isFullData: false,
          isNumberedArray: true,
          numberedArrayInfo: {
            basename: parsed.basename,
            sectionKey: parsed.sectionKey,
            number: parsed.number,
          },
          metadata: fileMetadata,
        });
        continue;
      }

      const basename = path.basename(file, ext);
      const isFullData = isFullDataFilename(basename);
      const isSectionSpecific = isSectionSpecificFile(basename);
      if (isFullData || isSectionSpecific) {
        const data = loadDataFile(fullFilePath);
        const sections = Object.keys(data);
        const fileMetadata = await getMinimalFileStats(filePath);
        dataFiles.push({
          path: filePath,
          fullPath: fullFilePath,
          sections,
          format: ext === ".json" ? "json" : "yaml",
          isFullData,
          metadata: fileMetadata,
        });
      }
    } catch (error) {
      console.warn(`Skipping file ${file}:`, error);
      continue;
    }
  }
  return dataFiles;
}

export async function listDirectoryFilesRecursive(
  dirPath: string,
): Promise<DirectoryFileInfo[]> {
  const piiPath = getPiiDirectory();
  const fullPath = path.join(piiPath, dirPath);
  if (!fsSync.existsSync(fullPath)) {
    return [];
  }
  const allFiles: DirectoryFileInfo[] = [];
  let entries = await fs.readdir(fullPath, { withFileTypes: true });
  entries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return 1;
    if (!a.isDirectory() && b.isDirectory()) return -1;
    return a.name.localeCompare(b.name);
  });
  for (const entry of entries) {
    const relativePath = path.join(dirPath, entry.name);
    const absolutePath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      const stat = await fs.stat(absolutePath);
      allFiles.push({
        path: relativePath,
        fullPath: absolutePath,
        sections: [],
        format: "yaml",
        isFullData: false,
        metadata: {
          name: entry.name,
          path: relativePath,
          size: stat.size,
          modified: stat.mtime,
          created: stat.birthtime,
          type: "directory",
          versions: 0,
          hasUnsavedChanges: false,
          tags: [],
          lastEditedBy: "system",
        },
      });
      const subFiles = await listDirectoryFilesRecursive(relativePath);
      allFiles.push(...subFiles);
    } else if (entry.isFile()) {
      try {
        const ext = path.extname(entry.name);
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

        const parsed = parseNumberedArrayFile(entry.name);
        if (parsed) {
          const data = loadDataFile(absolutePath);
          const sections = Object.keys(data);
          const fileMetadata = await getMinimalFileStats(relativePath);
          allFiles.push({
            path: relativePath,
            fullPath: absolutePath,
            sections,
            format: ext === ".json" ? "json" : "yaml",
            isFullData: false,
            isNumberedArray: true,
            numberedArrayInfo: {
              basename: parsed.basename,
              sectionKey: parsed.sectionKey,
              number: parsed.number,
            },
            metadata: fileMetadata,
          });
          continue;
        }

        const basename = path.basename(entry.name, ext);
        const isFullData = isFullDataFilename(basename);
        const isSectionSpecific = isSectionSpecificFile(basename);
        if (isFullData || isSectionSpecific) {
          const data = loadDataFile(absolutePath);
          const sections = Object.keys(data);
          const fileMetadata = await getMinimalFileStats(relativePath);
          allFiles.push({
            path: relativePath,
            fullPath: absolutePath,
            sections,
            format: ext === ".json" ? "json" : "yaml",
            isFullData,
            metadata: fileMetadata,
          });
        }
      } catch (error) {
        console.warn(`Skipping file ${entry.name}:`, error);
        continue;
      }
    }
  }
  return allFiles;
}
