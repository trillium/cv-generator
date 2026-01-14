import {
  getAncestorDirectories,
  findDataFilesInDirectory,
  loadDataFile,
  parseNumberedArrayFile,
  mergeNumberedArrayFiles,
  validateNumberedArrayFiles,
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
  const sources: Record<string, string | string[]> = {};
  const mergedData: Record<string, unknown> = {};

  for (const dir of ancestorDirs) {
    const dataFiles = findDataFilesInDirectory(dir);

    validateNumberedArrayFiles(dataFiles, dir);

    const numberedFiles: string[] = [];
    const regularFiles: string[] = [];

    for (const filePath of dataFiles) {
      const filename = path.basename(filePath);
      if (parseNumberedArrayFile(filename)) {
        numberedFiles.push(filePath);
      } else {
        regularFiles.push(filePath);
      }
    }

    for (const filePath of regularFiles) {
      filesLoaded.push(filePath);
      const fileData = loadDataFile(filePath);
      for (const [section, value] of Object.entries(fileData)) {
        mergedData[section] = value;
        sources[section] = filePath;
      }
    }

    if (numberedFiles.length > 0) {
      const mergedArrays = mergeNumberedArrayFiles(numberedFiles);
      for (const [
        sectionKey,
        { data, sources: fileSources },
      ] of mergedArrays.entries()) {
        filesLoaded.push(...fileSources);
        mergedData[sectionKey] = data;
        sources[sectionKey] = fileSources;
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
