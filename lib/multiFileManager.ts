import {
  findDataFilesInDirectory,
  loadDataFile,
  getAncestorDirectories,
  isFullDataFilename,
  SUPPORTED_EXTENSIONS,
} from "./multiFileMapper";
import type { CVData } from "@/types";
import type { FileMetadata } from "@/types/fileManager";
import * as path from "path";
import * as fs from "fs/promises";
import fsSync from "fs";
import { SECTION_KEY_TO_FILENAME } from "./multiFileMapper";
import { getPiiDirectory } from "./getPiiPath";
import * as yaml from "js-yaml";

// Types moved to ./multiFileManager.types
import type {
  PdfMetadataFile,
  DirectoryLoadResult,
  UpdateResult,
  DirectoryFileInfo,
  DirectoryHierarchy,
  DirectoryTreeNode,
  SectionSourceInfo,
} from "./multiFileManager.types";

/**
 * MultiFileManager - Manages directory-based CV data with hierarchical file loading
 * Extends UnifiedFileManager to support multi-file directory structures
 */
export class MultiFileManager {
  /**
   * Load data from a directory hierarchy
   * @param dirPath - Relative path from PII_PATH (e.g., 'base/google/python')
   * @returns Merged data, source tracking, and metadata
   */
  async loadDirectory(dirPath: string): Promise<DirectoryLoadResult> {
    // 1. Get all ancestor directories (from least to most specific)
    const ancestorDirs = getAncestorDirectories(dirPath);
    // 2. For each directory, find all data files
    const filesLoaded: string[] = [];
    const sources: Record<string, string> = {};
    const mergedData: Record<string, unknown> = {};
    for (const dir of ancestorDirs) {
      const dataFiles = findDataFilesInDirectory(dir);
      for (const filePath of dataFiles) {
        filesLoaded.push(filePath);
        const fileData = loadDataFile(filePath);
        // For each top-level key, track the source file and merge
        for (const [section, value] of Object.entries(fileData)) {
          mergedData[section] = value;
          sources[section] = filePath;
        }
      }
    }

    // 3. Load PDF metadata if it exists
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

  /**
   * Update a YAML path in the appropriate file within the directory hierarchy
   * @param dirPath - Relative path from PII_PATH
   * @param yamlPath - Dot-notation path (e.g., 'workExperience[0].position')
   * @param value - New value to set
   * @param options - Save options (commit, message, tags)
   * @returns Update result with file info, backup, diff
   */
  async updatePath(
    dirPath: string,
    yamlPath: string,
    value: unknown,
  ): Promise<UpdateResult> {
    // 1. Determine top-level section
    const section = this.extractTopLevelKey(yamlPath);
    const ancestorDirs = getAncestorDirectories(dirPath).reverse(); // most specific first
    let targetFile: string | null = null;
    // 2. Find the most specific file containing the section
    // Prioritize section-specific files over full data files
    for (const dir of ancestorDirs) {
      const dataFiles = findDataFilesInDirectory(dir);

      // Sort files: section-specific files first, then full data files
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
    // 3. If not found, create a new section-specific file in the most specific dir
    if (!targetFile) {
      const piiPath = getPiiDirectory();
      const dirAbs = path.join(piiPath, dirPath);
      const sectionFilenames = SECTION_KEY_TO_FILENAME[section] || [section];
      const filename = sectionFilenames[0] + ".yml";
      targetFile = path.join(dirAbs, filename);
      // If file doesn't exist, create it
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
    // 4. Update the value in the file
    const fileData = loadDataFile(targetFile);
    this.setNestedValue(fileData, yamlPath, value);
    // 5. Serialize and save
    const content = this.serializeData(fileData, targetFile);
    await fs.writeFile(targetFile, content, "utf-8");
    return {
      success: true,
      updatedFile: targetFile,
      section,
    };
  }

  /**
   * List all data files in a directory (non-recursive)
   * @param dirPath - Relative path from PII_PATH
   * @returns Array of file info objects
   */
  async listDirectoryFiles(dirPath: string): Promise<DirectoryFileInfo[]> {
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

        const basename = path.basename(file, ext);
        const isFullData = isFullDataFilename(basename);
        const isSectionSpecific = this.isSectionSpecificFile(basename);

        if (isFullData || isSectionSpecific) {
          const data = loadDataFile(fullFilePath);
          const sections = Object.keys(data);
          const fileMetadata = await this.getMinimalFileStats(filePath);

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

  /**
   * Recursively list all data files in a directory and subdirectories
   * @param dirPath - Relative path from PII_PATH
   * @returns Array of file info objects from all subdirectories, including empty directories
   */
  async listDirectoryFilesRecursive(
    dirPath: string,
  ): Promise<DirectoryFileInfo[]> {
    const piiPath = getPiiDirectory();
    const fullPath = path.join(piiPath, dirPath);

    if (!fsSync.existsSync(fullPath)) {
      return [];
    }

    const allFiles: DirectoryFileInfo[] = [];
    let entries = await fs.readdir(fullPath, { withFileTypes: true });

    // Sort entries: files first, then directories (both alphabetically within their group)
    entries = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return 1;
      if (!a.isDirectory() && b.isDirectory()) return -1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      const relativePath = path.join(dirPath, entry.name);
      const absolutePath = path.join(fullPath, entry.name);

      if (entry.isDirectory()) {
        // Add the directory itself as an entry (even if empty)
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

        // Recursively get files from subdirectory
        const subFiles = await this.listDirectoryFilesRecursive(relativePath);
        allFiles.push(...subFiles);
      } else if (entry.isFile()) {
        try {
          const ext = path.extname(entry.name);
          if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

          const basename = path.basename(entry.name, ext);
          const isFullData = isFullDataFilename(basename);
          const isSectionSpecific = this.isSectionSpecificFile(basename);

          if (isFullData || isSectionSpecific) {
            const data = loadDataFile(absolutePath);
            const sections = Object.keys(data);
            const fileMetadata = await this.getMinimalFileStats(relativePath);

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

  /**
   * Get directory hierarchy structure
   * @param dirPath - Relative path from PII_PATH
   * @returns Hierarchy information including tree and section sources
   */
  async getHierarchy(dirPath: string): Promise<DirectoryHierarchy> {
    const ancestors = getAncestorDirectories(dirPath);
    const tree = await this.buildDirectoryTree(ancestors);
    const sections = await this.analyzeSectionSources(dirPath);

    return {
      path: dirPath,
      ancestors,
      tree,
      sections,
    };
  }

  /**
   * Build directory tree structure
   */
  private async buildDirectoryTree(
    directories: string[],
  ): Promise<Record<string, DirectoryTreeNode>> {
    const tree: Record<string, DirectoryTreeNode> = {};
    const piiPath = getPiiDirectory();

    // Helper function to recursively build tree for a directory
    const buildTreeRecursive = (
      absolutePath: string,
      relativePath: string,
    ): DirectoryTreeNode => {
      const node: DirectoryTreeNode = { files: [], children: {} };

      if (!fsSync.existsSync(absolutePath)) {
        return node;
      }

      // Get all entries in the directory and sort: files first, then directories
      let entries = fsSync.readdirSync(absolutePath, { withFileTypes: true });
      entries = entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return 1;
        if (!a.isDirectory() && b.isDirectory()) return -1;
        return a.name.localeCompare(b.name);
      });

      // Process files - add data files to the node
      const dataFiles = findDataFilesInDirectory(absolutePath);
      node.files = dataFiles.map((f) => path.basename(f));

      // Process subdirectories recursively (now after files)
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subAbsPath = path.join(absolutePath, entry.name);
          const subRelPath = path.join(relativePath, entry.name);
          node.children[entry.name] = buildTreeRecursive(
            subAbsPath,
            subRelPath,
          );
        }
      }

      return node;
    };

    // Build tree starting from the root ancestor, including all siblings
    if (directories.length === 0) {
      return tree;
    }

    // Get the root ancestor (first directory in the path)
    const firstDir = directories[0];
    const parts = firstDir.replace(piiPath, "").split(path.sep).filter(Boolean);

    if (parts.length === 0) {
      return tree;
    }

    // Build complete tree from the root level, which will include all siblings
    const rootName = parts[0];
    const rootAbsPath = path.join(piiPath, rootName);
    tree[rootName] = buildTreeRecursive(rootAbsPath, rootName);

    return tree;
  }

  /**
   * Analyze section sources in hierarchy
   */
  private async analyzeSectionSources(
    dirPath: string,
  ): Promise<Record<string, SectionSourceInfo>> {
    const result = await this.loadDirectory(dirPath);
    const sections: Record<string, SectionSourceInfo> = {};

    for (const [section, sourceFile] of Object.entries(result.sources)) {
      sections[section] = {
        sourceFile,
        overriddenBy: null,
        inheritedFrom: null,
      };
    }

    return sections;
  }

  /**
   * Check if basename is a section-specific file
   */
  private isSectionSpecificFile(basename: string): boolean {
    const sectionFiles = [
      "info",
      "header",
      "career",
      "work",
      "experience",
      "projects",
      "profile",
      "technical",
      "languages",
      "education",
      "cover-letter",
      "metadata",
      "llm",
    ];
    return sectionFiles.includes(basename);
  }

  /**
   * Serialize data based on file format
   */
  private serializeData(
    data: Record<string, unknown>,
    filePath: string,
  ): string {
    const ext = path.extname(filePath);

    if (ext === ".json") {
      return JSON.stringify(data, null, 2);
    } else {
      return yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });
    }
  }

  /**
   * Extract top-level key from path
   */
  private extractTopLevelKey(dataPath: string): string {
    const parts = dataPath.split(/[.[\]]/);
    return parts[0];
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown,
  ): void {
    const keys = path.split(/[.[\]]/).filter(Boolean);
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Get minimal file stats for directory listing
   */
  private async getMinimalFileStats(filePath: string): Promise<FileMetadata> {
    // This method exists in UnifiedFileManager but is private
    // We need to make it accessible or reimplement
    // For now, create a minimal implementation
    const piiPath = getPiiDirectory();
    const fullPath = path.join(piiPath, filePath);
    const stat = await fs.stat(fullPath);

    return {
      name: path.basename(filePath),
      path: filePath,
      size: stat.size,
      modified: stat.mtime,
      created: stat.birthtime,
      type: "resume",
      versions: 0,
      hasUnsavedChanges: false,
      tags: [],
      lastEditedBy: "system",
    };
  }

  async createDirectory(
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

  async splitSectionToFile(
    sourceFilePath: string,
    sectionKey: string,
    targetFileName: string,
  ): Promise<{ success: boolean; targetPath?: string; error?: string }> {
    try {
      const piiPath = getPiiDirectory();
      const fullSourcePath = path.join(piiPath, sourceFilePath);
      const sourceDir = path.dirname(fullSourcePath);
      const targetPath = path.join(sourceDir, targetFileName);

      const sourceContent = await fs.readFile(fullSourcePath, "utf-8");
      const sourceData = yaml.load(sourceContent) as Record<string, unknown>;

      if (!(sectionKey in sourceData)) {
        return {
          success: false,
          error: `Section "${sectionKey}" not found in source file`,
        };
      }

      const sectionData = sourceData[sectionKey];
      delete sourceData[sectionKey];

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
        yaml.dump(
          { [sectionKey]: sectionData },
          {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
          },
        ),
      );

      const relativeTargetPath = path.relative(piiPath, targetPath);

      return {
        success: true,
        targetPath: relativeTargetPath,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to split section",
      };
    }
  }

  async deleteFile(
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
}
