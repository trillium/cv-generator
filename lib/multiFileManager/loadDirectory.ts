import {
  getAncestorDirectories,
  findDataFilesInDirectory,
  loadDataFile,
} from "../multiFileMapper";
import { getPiiDirectory } from "../getPiiPath";
import * as path from "path";
import * as fs from "fs/promises";
import fsSync from "fs";
import type { CVData } from "@/types";
import type {
  PdfMetadataFile,
  DirectoryLoadResult,
} from "@/types/multiFileManager.types";

export async function loadDirectory(
  dirPath: string,
): Promise<DirectoryLoadResult> {
  const ancestorDirs = getAncestorDirectories(dirPath);
  const filesLoaded: string[] = [];
  const sources: Record<string, string> = {};
  const mergedData: Record<string, unknown> = {};
  for (const dir of ancestorDirs) {
    const dataFiles = findDataFilesInDirectory(dir);
    for (const filePath of dataFiles) {
      filesLoaded.push(filePath);
      const fileData = loadDataFile(filePath);
      for (const [section, value] of Object.entries(fileData)) {
        mergedData[section] = value;
        sources[section] = filePath;
      }
    }
  }
  let pdfMetadata: PdfMetadataFile | undefined;
  try {
    const piiPath = getPiiDirectory();
    const metadataPath = path.join(piiPath, dirPath, "metadata.json");
    if (fsSync.existsSync(metadataPath)) {
      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      pdfMetadata = JSON.parse(metadataContent);
    }
  } catch (err) {
    console.warn(`Could not load PDF metadata: ${err}`);
  }
  return {
    data: mergedData as CVData,
    sources,
    metadata: {
      directoryPath: dirPath,
      loadedDirectories: ancestorDirs,
      filesLoaded,
      hasUnsavedChanges: false,
    },
    pdfMetadata,
  };
}
