import type {
  DirectoryLoadResult,
  UpdateResult,
  DirectoryFileInfo,
  DirectoryHierarchy,
} from "@/types/multiFileManager.types";
import { loadDirectory } from "./loadDirectory";
import { updatePath } from "./updatePath";
import {
  listDirectoryFiles,
  listDirectoryFilesRecursive,
} from "./listDirectoryFiles";
import { getHierarchy } from "./hierarchy";
import {
  createDirectory,
  splitSectionToFile,
  deleteFile,
} from "./directoryOps";

export class MultiFileManager {
  async loadDirectory(dirPath: string): Promise<DirectoryLoadResult> {
    return loadDirectory(dirPath);
  }

  async updatePath(
    dirPath: string,
    yamlPath: string,
    value: unknown,
  ): Promise<UpdateResult> {
    return updatePath(dirPath, yamlPath, value);
  }

  async listDirectoryFiles(dirPath: string): Promise<DirectoryFileInfo[]> {
    return listDirectoryFiles(dirPath);
  }

  async listDirectoryFilesRecursive(
    dirPath: string,
  ): Promise<DirectoryFileInfo[]> {
    return listDirectoryFilesRecursive(dirPath);
  }

  async getHierarchy(dirPath: string): Promise<DirectoryHierarchy> {
    return getHierarchy(dirPath);
  }

  async createDirectory(
    parentPath: string,
    directoryName: string,
  ): Promise<{ success: boolean; path: string; error?: string }> {
    return createDirectory(parentPath, directoryName);
  }

  async splitSectionToFile(
    sourceFilePath: string,
    sectionKeys: string[],
    targetFileName: string,
    mergedData?: Record<string, unknown>,
  ): Promise<{ success: boolean; targetPath?: string; error?: string }> {
    return splitSectionToFile(
      sourceFilePath,
      sectionKeys,
      targetFileName,
      mergedData,
    );
  }

  async deleteFile(
    filePath: string,
  ): Promise<{ success: boolean; deletedPath?: string; error?: string }> {
    return deleteFile(filePath);
  }
}
