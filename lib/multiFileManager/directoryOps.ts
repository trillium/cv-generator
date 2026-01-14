import { getPiiDirectory } from "../getPiiPath";
import { loadDataFile, SECTION_KEY_TO_FILENAME } from "../multiFileMapper";
import * as path from "path";
import * as fs from "fs/promises";
import fsSync from "fs";
import * as yaml from "js-yaml";

export async function createDirectory(
  parentPath: string,
  directoryName: string,
): Promise<{ success: boolean; path: string; error?: string }> {
  try {
    const piiPath = getPiiDirectory();
    const newDirPath = path.join(piiPath, parentPath, directoryName);
    if (fsSync.existsSync(newDirPath)) {
      return {
        success: false,
        path: path.join(parentPath, directoryName),
        error: "Directory already exists",
      };
    }
    await fs.mkdir(newDirPath, { recursive: true });
    return {
      success: true,
      path: path.join(parentPath, directoryName),
    };
  } catch (error) {
    return {
      success: false,
      path: path.join(parentPath, directoryName),
      error:
        error instanceof Error ? error.message : "Failed to create directory",
    };
  }
}

export async function splitSectionToFile(
  sourceFilePath: string,
  sectionKeys: string[],
  targetFileName: string,
  mergedData?: Record<string, unknown>,
): Promise<{ success: boolean; targetPath?: string; error?: string }> {
  try {
    const piiPath = getPiiDirectory();
    const fullSourcePath = path.join(piiPath, sourceFilePath);
    const isDirectory = fsSync.existsSync(fullSourcePath)
      ? fsSync.statSync(fullSourcePath).isDirectory()
      : false;

    let sourceData: Record<string, unknown>;
    let targetDir: string;
    let shouldUpdateSource = false;

    if (mergedData && (isDirectory || !fsSync.existsSync(fullSourcePath))) {
      sourceData = mergedData;
      targetDir = isDirectory ? fullSourcePath : path.dirname(fullSourcePath);
      shouldUpdateSource = false;
    } else {
      const sourceContent = await fs.readFile(fullSourcePath, "utf-8");
      sourceData = yaml.load(sourceContent) as Record<string, unknown>;
      targetDir = path.dirname(fullSourcePath);
      shouldUpdateSource = true;
    }

    for (const sectionKey of sectionKeys) {
      if (!(sectionKey in sourceData)) {
        return {
          success: false,
          error: `Section "${sectionKey}" not found in ${mergedData ? "merged data" : "source file"}`,
        };
      }
    }

    const targetData: Record<string, unknown> = {};
    for (const sectionKey of sectionKeys) {
      targetData[sectionKey] = sourceData[sectionKey];
      if (shouldUpdateSource) {
        delete sourceData[sectionKey];
      }
    }

    const targetPath = path.join(targetDir, targetFileName);

    const allSectionsSelected =
      shouldUpdateSource &&
      Object.keys(sourceData).length === 0 &&
      Object.keys(targetData).length > 0;

    if (allSectionsSelected) {
      await fs.writeFile(
        targetPath,
        yaml.dump(targetData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        }),
      );
    } else if (shouldUpdateSource) {
      await fs.writeFile(
        fullSourcePath,
        yaml.dump(sourceData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        }),
      );
      await fs.writeFile(
        targetPath,
        yaml.dump(targetData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        }),
      );
    } else {
      await fs.writeFile(
        targetPath,
        yaml.dump(targetData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        }),
      );
    }

    const relativeTargetPath = path.relative(piiPath, targetPath);
    return {
      success: true,
      targetPath: relativeTargetPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to split section",
    };
  }
}

export async function deleteFile(
  filePath: string,
): Promise<{ success: boolean; deletedPath?: string; error?: string }> {
  try {
    const piiPath = getPiiDirectory();
    const fullSourcePath = path.join(piiPath, filePath);
    if (!fsSync.existsSync(fullSourcePath)) {
      return {
        success: false,
        error: "File does not exist",
      };
    }
    const deletedDirPath = path.join(
      piiPath,
      "deleted",
      path.dirname(filePath),
    );
    const deletedFilePath = path.join(piiPath, "deleted", filePath);
    await fs.mkdir(deletedDirPath, { recursive: true });
    await fs.rename(fullSourcePath, deletedFilePath);
    return {
      success: true,
      deletedPath: path.join("deleted", filePath),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

export async function splitArrayToNumberedFiles(
  sourceFile: string,
  sectionKey: string,
  itemsPerFile: number = 1,
  numberIncrement: number = 10,
): Promise<{
  success: boolean;
  createdFiles?: string[];
  backupPath?: string;
  error?: string;
}> {
  try {
    const piiPath = getPiiDirectory();
    const fullSourcePath = path.join(piiPath, sourceFile);

    if (!fsSync.existsSync(fullSourcePath)) {
      return {
        success: false,
        error: "Source file does not exist",
      };
    }

    const fileData = loadDataFile(fullSourcePath);
    const arrayData = fileData[sectionKey];

    if (!Array.isArray(arrayData)) {
      return {
        success: false,
        error: `Section '${sectionKey}' is not an array`,
      };
    }

    if (arrayData.length === 0) {
      return {
        success: false,
        error: "Array is empty, nothing to split",
      };
    }

    const backupDir = path.join(piiPath, "backups");
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${path.basename(sourceFile, path.extname(sourceFile))}.${timestamp}${path.extname(sourceFile)}`;
    const backupPath = path.join(backupDir, backupFileName);
    await fs.copyFile(fullSourcePath, backupPath);

    const sourceDir = path.dirname(fullSourcePath);
    const sourceExt = path.extname(sourceFile);

    const sectionFilenames = SECTION_KEY_TO_FILENAME[sectionKey];
    const baseFilename = sectionFilenames ? sectionFilenames[0] : sectionKey;

    const createdFiles: string[] = [];
    const numFiles = Math.ceil(arrayData.length / itemsPerFile);
    const maxNumber = (numFiles - 1) * numberIncrement + numberIncrement;
    const paddingLength = String(maxNumber).length;

    for (let i = 0; i < numFiles; i++) {
      const fileNumber = String((i + 1) * numberIncrement).padStart(
        paddingLength,
        "0",
      );
      const numberedFileName = `${baseFilename}.${sectionKey}${fileNumber}${sourceExt}`;
      const numberedFilePath = path.join(sourceDir, numberedFileName);

      const startIndex = i * itemsPerFile;
      const endIndex = Math.min(startIndex + itemsPerFile, arrayData.length);
      const fileItems = arrayData.slice(startIndex, endIndex);

      const fileContent = { [sectionKey]: fileItems };
      await fs.writeFile(
        numberedFilePath,
        yaml.dump(fileContent, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
        }),
      );

      createdFiles.push(path.relative(piiPath, numberedFilePath));
    }

    await fs.unlink(fullSourcePath);

    return {
      success: true,
      createdFiles,
      backupPath: path.relative(piiPath, backupPath),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to split array to numbered files",
    };
  }
}
