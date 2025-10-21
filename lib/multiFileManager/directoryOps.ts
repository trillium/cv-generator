import { getPiiDirectory } from "../getPiiPath";
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
