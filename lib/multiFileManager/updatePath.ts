import {
  getAncestorDirectories,
  findDataFilesInDirectory,
  loadDataFile,
  isFullDataFilename,
  SECTION_KEY_TO_FILENAME,
  parseNumberedArrayFile,
} from "../multiFileMapper";
import { getPiiDirectory } from "../getPiiPath";
import * as path from "path";
import * as fs from "fs/promises";
import fsSync from "fs";
import * as yaml from "js-yaml";
import type { UpdateResult } from "@/types/multiFileManager.types";
import { serializeData, extractTopLevelKey, setNestedValue } from "./fileUtils";
import { ARRAY_INDEX_PATTERN } from "./constants";

function findNumberedFileForArrayIndex(
  numberedFiles: string[],
  section: string,
  arrayIndex: number,
): { file: string; adjustedIndex: number } | null {
  const sortedFiles = numberedFiles
    .map((filePath) => {
      const parsed = parseNumberedArrayFile(path.basename(filePath));
      return {
        filePath,
        parsed,
        number: parsed ? parseInt(parsed.number, 10) : 0,
      };
    })
    .filter((f) => f.parsed && f.parsed.sectionKey === section)
    .sort((a, b) => a.number - b.number);

  let currentIndex = 0;
  for (const { filePath } of sortedFiles) {
    const fileData = loadDataFile(filePath);
    const arrayData = fileData[section];
    if (!Array.isArray(arrayData)) continue;

    const arrayLength = arrayData.length;
    if (arrayIndex < currentIndex + arrayLength) {
      return {
        file: filePath,
        adjustedIndex: arrayIndex - currentIndex,
      };
    }
    currentIndex += arrayLength;
  }

  return null;
}

export async function updatePath(
  dirPath: string,
  yamlPath: string,
  value: unknown,
): Promise<UpdateResult> {
  const section = extractTopLevelKey(yamlPath);
  const arrayIndexMatch = yamlPath.match(ARRAY_INDEX_PATTERN);
  const arrayIndex = arrayIndexMatch ? parseInt(arrayIndexMatch[1], 10) : null;

  const ancestorDirs = getAncestorDirectories(dirPath).reverse();
  let targetFile: string | null = null;
  let adjustedPath = yamlPath;

  for (const dir of ancestorDirs) {
    const dataFiles = findDataFilesInDirectory(dir);

    const numberedFiles = dataFiles.filter((f) =>
      parseNumberedArrayFile(path.basename(f)),
    );
    const regularFiles = dataFiles.filter(
      (f) => !parseNumberedArrayFile(path.basename(f)),
    );

    if (numberedFiles.length > 0 && arrayIndex !== null) {
      const result = findNumberedFileForArrayIndex(
        numberedFiles,
        section,
        arrayIndex,
      );
      if (result) {
        targetFile = result.file;
        adjustedPath = yamlPath.replace(
          /\[(\d+)\]/,
          `[${result.adjustedIndex}]`,
        );
        break;
      }
    }

    const sortedFiles = regularFiles.sort((a, b) => {
      const aBasename = path.basename(a, path.extname(a));
      const bBasename = path.basename(b, path.extname(b));
      const aIsFullData = isFullDataFilename(aBasename);
      const bIsFullData = isFullDataFilename(bBasename);
      if (aIsFullData && !bIsFullData) return 1;
      if (!aIsFullData && bIsFullData) return -1;
      return 0;
    });

    for (const filePath of sortedFiles) {
      const fileData = loadDataFile(filePath);
      if (Object.prototype.hasOwnProperty.call(fileData, section)) {
        targetFile = filePath;
        break;
      }
    }
    if (targetFile) break;
  }

  if (!targetFile) {
    const piiPath = getPiiDirectory();
    const dirAbs = path.join(piiPath, dirPath);
    const sectionFilenames = SECTION_KEY_TO_FILENAME[section] || [section];
    const filename = sectionFilenames[0] + ".yml";
    targetFile = path.join(dirAbs, filename);
    if (!fsSync.existsSync(dirAbs)) {
      await fs.mkdir(dirAbs, { recursive: true });
    }
    await fs.writeFile(targetFile, yaml.dump({ [section]: value }), "utf-8");
    return {
      success: true,
      updatedFile: targetFile,
      section,
    };
  }

  const fileData = loadDataFile(targetFile);
  setNestedValue(fileData, adjustedPath, value);
  const content = serializeData(fileData, targetFile);
  await fs.writeFile(targetFile, content, "utf-8");
  return {
    success: true,
    updatedFile: targetFile,
    section,
  };
}
