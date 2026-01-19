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
  console.log(`🟢 [updatePath] Called with:`, {
    dirPath,
    yamlPath,
    valueType: typeof value,
    valuePreview: Array.isArray(value)
      ? `Array[${value.length}]`
      : typeof value === "string"
        ? value.substring(0, 50)
        : JSON.stringify(value).substring(0, 50),
  });

  const section = extractTopLevelKey(yamlPath);
  const arrayIndexMatch = yamlPath.match(ARRAY_INDEX_PATTERN);
  const arrayIndex = arrayIndexMatch ? parseInt(arrayIndexMatch[1], 10) : null;

  console.log(`🔍 [updatePath] Parsed:`, {
    section,
    arrayIndex,
    hasArrayIndex: arrayIndex !== null,
  });

  const ancestorDirs = getAncestorDirectories(dirPath).reverse();
  console.log(
    `📂 [updatePath] Searching directories (deepest first):`,
    ancestorDirs,
  );
  let targetFile: string | null = null;
  let adjustedPath = yamlPath;

  for (const dir of ancestorDirs) {
    const dataFiles = findDataFilesInDirectory(dir);
    console.log(`  📁 Checking directory: ${dir}`);
    console.log(
      `     Found ${dataFiles.length} data files:`,
      dataFiles.map((f) => path.basename(f)),
    );

    const numberedFiles = dataFiles.filter((f) =>
      parseNumberedArrayFile(path.basename(f)),
    );
    const regularFiles = dataFiles.filter(
      (f) => !parseNumberedArrayFile(path.basename(f)),
    );
    console.log(
      `     - Numbered files: ${numberedFiles.length}`,
      numberedFiles.map((f) => path.basename(f)),
    );
    console.log(
      `     - Regular files: ${regularFiles.length}`,
      regularFiles.map((f) => path.basename(f)),
    );

    if (numberedFiles.length > 0 && arrayIndex !== null) {
      console.log(
        `     🔢 Array index detected, searching numbered files for index ${arrayIndex}...`,
      );
      const result = findNumberedFileForArrayIndex(
        numberedFiles,
        section,
        arrayIndex,
      );
      if (result) {
        console.log(
          `     ✅ Found in numbered file: ${path.basename(result.file)} (adjusted index: ${result.adjustedIndex})`,
        );
        targetFile = result.file;
        const bracketPattern = new RegExp(`^${section}\\[(\\d+)\\]`);
        const dotPattern = new RegExp(`^${section}\\.(\\d+)\\.`);

        if (bracketPattern.test(yamlPath)) {
          adjustedPath = yamlPath.replace(
            bracketPattern,
            `${section}[${result.adjustedIndex}]`,
          );
        } else if (dotPattern.test(yamlPath)) {
          adjustedPath = yamlPath.replace(
            dotPattern,
            `${section}.${result.adjustedIndex}.`,
          );
        } else {
          adjustedPath = yamlPath;
        }

        console.log(`     📝 Adjusted path: ${yamlPath} → ${adjustedPath}`);
        break;
      } else {
        console.log(
          `     ❌ Array index ${arrayIndex} not found in numbered files`,
        );
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

    console.log(`     🔎 Searching regular files for section "${section}"...`);
    for (const filePath of sortedFiles) {
      const fileData = loadDataFile(filePath);
      const hasSection = Object.prototype.hasOwnProperty.call(
        fileData,
        section,
      );
      console.log(
        `       - ${path.basename(filePath)}: ${hasSection ? "✅ HAS section" : "❌ no section"}`,
      );
      if (hasSection) {
        targetFile = filePath;
        break;
      }
    }
    if (targetFile) {
      console.log(`     ✅ Target file found: ${targetFile}`);
      break;
    }
  }

  if (!targetFile) {
    console.log(
      `⚠️  [updatePath] No existing file found for section "${section}", creating new file...`,
    );
    const piiPath = getPiiDirectory();
    const dirAbs = path.join(piiPath, dirPath);
    const sectionFilenames = SECTION_KEY_TO_FILENAME[section] || [section];
    const filename = sectionFilenames[0] + ".yml";
    targetFile = path.join(dirAbs, filename);
    console.log(`   📝 Creating new file: ${targetFile}`);
    if (!fsSync.existsSync(dirAbs)) {
      console.log(`   📁 Directory doesn't exist, creating: ${dirAbs}`);
      await fs.mkdir(dirAbs, { recursive: true });
    }
    const fileData: Record<string, unknown> = {};
    setNestedValue(fileData, yamlPath, value);
    await fs.writeFile(targetFile, yaml.dump(fileData), "utf-8");
    console.log(`✅ [updatePath] New file created and written successfully`);
    return {
      success: true,
      updatedFile: targetFile,
      section,
    };
  }

  console.log(`📝 [updatePath] Updating existing file: ${targetFile}`);
  console.log(`   Path to update: ${adjustedPath}`);
  const fileData = loadDataFile(targetFile);
  setNestedValue(fileData, adjustedPath, value);
  const content = serializeData(fileData, targetFile);
  await fs.writeFile(targetFile, content, "utf-8");
  console.log(`✅ [updatePath] File updated successfully`);
  return {
    success: true,
    updatedFile: targetFile,
    section,
  };
}
