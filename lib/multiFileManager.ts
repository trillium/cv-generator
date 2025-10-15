import { UnifiedFileManager } from "./unifiedFileManager";
import {
  loadFromDirectory,
  loadSingleDirectory,
  findSourceFile,
} from "./getYamlData";
import {
  findDataFilesInDirectory,
  loadDataFile,
  getAncestorDirectories,
  isFullDataFilename,
  SUPPORTED_EXTENSIONS,
} from "./multiFileMapper";
import type { CVData } from "../src/types";
import type { SaveOptions, FileMetadata } from "../src/types/fileManager";
import * as path from "path";
import * as fs from "fs/promises";
import fsSync from "fs";
import { getPiiDirectory } from "./getPiiPath";
import * as yaml from "js-yaml";

export interface DirectoryLoadResult {
  data: CVData;
  sources: Record<string, string>;
  metadata: DirectoryMetadata;
}

export interface DirectoryMetadata {
  directoryPath: string;
  loadedDirectories: string[];
  filesLoaded: string[];
  hasUnsavedChanges: boolean;
}

export interface UpdateResult {
  success: boolean;
  updatedFile: string;
  section: string;
  backup?: {
    path: string;
    timestamp: string;
  };
  diff?: {
    path: string;
    content: string;
  };
  changelogEntry?: {
    timestamp: string;
    action: string;
    file: string;
    yamlPath: string;
    message?: string;
  };
}

export interface DirectoryFileInfo {
  path: string;
  fullPath: string;
  sections: string[];
  format: "yaml" | "json";
  isFullData: boolean;
  metadata: FileMetadata;
}

export interface DirectoryHierarchy {
  path: string;
  ancestors: string[];
  tree: Record<string, DirectoryTreeNode>;
  sections: Record<string, SectionSourceInfo>;
}

export interface DirectoryTreeNode {
  files: string[];
  children: Record<string, DirectoryTreeNode>;
}

export interface SectionSourceInfo {
  sourceFile: string;
  overriddenBy: string | null;
  inheritedFrom: string | null;
}

/**
 * MultiFileManager - Manages directory-based CV data with hierarchical file loading
 * Extends UnifiedFileManager to support multi-file directory structures
 */
export class MultiFileManager extends UnifiedFileManager {
  /**
   * Load data from a directory hierarchy
   * @param dirPath - Relative path from PII_PATH (e.g., 'base/google/python')
   * @returns Merged data, source tracking, and metadata
   */
  async loadDirectory(dirPath: string): Promise<DirectoryLoadResult> {
    const ancestorDirs = getAncestorDirectories(dirPath);
    const data = loadFromDirectory(dirPath);

    // Track sources for each section
    const sources: Record<string, string> = {};
    const filesLoaded: string[] = [];

    for (const dir of ancestorDirs) {
      const dirData = loadSingleDirectory(dir);
      filesLoaded.push(...dirData.files.map((f) => f.path));

      // Update sources with most specific file
      for (const [section, sourceFile] of Object.entries(dirData.sources)) {
        sources[section] = sourceFile;
      }
    }

    return {
      data,
      sources,
      metadata: {
        directoryPath: dirPath,
        loadedDirectories: ancestorDirs,
        filesLoaded,
        hasUnsavedChanges: false,
      },
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
    options?: SaveOptions,
  ): Promise<UpdateResult> {
    const section = this.extractTopLevelKey(yamlPath);
    const sourceFile = findSourceFile(dirPath, section);

    // Load the specific file
    const data = loadDataFile(sourceFile);

    // Update the nested value
    this.setNestedValue(data, yamlPath, value);

    // Serialize based on format
    const content = this.serializeData(data, sourceFile);

    // Get relative path for UnifiedFileManager
    const piiPath = getPiiDirectory();
    const relativePath = path.relative(piiPath, sourceFile);

    // Save using UnifiedFileManager with commit: true (immediate save in directory mode)
    // Directory mode doesn't use temp files - changes are applied immediately
    const result = await this.save(relativePath, content, {
      ...options,
      commit: true,
    });

    return {
      success: true,
      updatedFile: sourceFile,
      section,
      backup: result.backupCreated
        ? {
            path: result.backupCreated,
            timestamp: new Date().toISOString(),
          }
        : undefined,
      changelogEntry: {
        timestamp: result.changelogEntry.timestamp,
        action: result.changelogEntry.action,
        file: result.changelogEntry.file,
        yamlPath,
        message: result.changelogEntry.message,
      },
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
   * @returns Array of file info objects from all subdirectories
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
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(dirPath, entry.name);
      const absolutePath = path.join(fullPath, entry.name);

      if (entry.isDirectory()) {
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

    for (const dir of directories) {
      const files = findDataFilesInDirectory(dir);
      const parts = dir.split(path.sep).filter(Boolean);

      let current = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { files: [], children: {} };
        }

        if (i === parts.length - 1) {
          current[part].files = files.map((f) => path.basename(f));
        }

        current = current[part].children;
      }
    }

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
}
