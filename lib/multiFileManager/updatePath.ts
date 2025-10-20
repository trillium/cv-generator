import {
  getAncestorDirectories,
  findDataFilesInDirectory,
  loadDataFile,
  isFullDataFilename,
  SECTION_KEY_TO_FILENAME,
} from "../multiFileMapper";
import { getPiiDirectory } from "../getPiiPath";
import * as path from "path";
import * as fs from "fs/promises";
import fsSync from "fs";
import * as yaml from "js-yaml";
import type { UpdateResult } from "@/types/multiFileManager.types";
import { serializeData, extractTopLevelKey, setNestedValue } from "./fileUtils";

export async function updatePath(
  dirPath: string,
  yamlPath: string,
  value: unknown,
): Promise<UpdateResult> {
  const section = extractTopLevelKey(yamlPath);
  const ancestorDirs = getAncestorDirectories(dirPath).reverse(); // most specific first
  let targetFile: string | null = null;
  for (const dir of ancestorDirs) {
    const dataFiles = findDataFilesInDirectory(dir);
    const sortedFiles = dataFiles.sort((a, b) => {
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
  setNestedValue(fileData, yamlPath, value);
  const content = serializeData(fileData, targetFile);
  await fs.writeFile(targetFile, content, "utf-8");
  return {
    success: true,
    updatedFile: targetFile,
    section,
  };
}
