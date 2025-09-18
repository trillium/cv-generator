import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { config } from "dotenv";

// Load environment variables
config();

export interface FileSystemState {
  yamlContent: string;
  hasChanges: boolean;
  lastModified: Date;
  changelogEntries: ChangelogEntry[];
}

export interface ChangelogEntry {
  timestamp: string;
  action: string;
  description?: string;
  originalFile?: string;
  backupFile?: string;
}

export class FileSystemManager {
  private piiPath: string;
  private originalDataPath: string;
  private tempDataPath: string;
  private changelogPath: string;

  constructor() {
    const piiPath = process.env.PII_PATH;
    if (!piiPath) {
      throw new Error(
        "PII_PATH environment variable is required. Please set PII_PATH to the directory containing your data.yml file.",
      );
    }
    this.piiPath = piiPath;
    this.originalDataPath = path.join(this.piiPath, "data.yml");
    this.tempDataPath = path.join(this.piiPath, "data.temp.yml");
    this.changelogPath = path.join(this.piiPath, "changelog.json");

    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.piiPath)) {
      throw new Error(
        `PII directory not found: ${this.piiPath}. Please check your PII_PATH environment variable.`,
      );
    }
  }

  /**
   * Get the current state by reading from the file system
   * Always returns the most up-to-date information
   */
  getCurrentState(): FileSystemState {
    const hasTempFile = fs.existsSync(this.tempDataPath);
    const hasOriginalFile = fs.existsSync(this.originalDataPath);

    let yamlContent = "";
    let lastModified = new Date(0);

    if (hasTempFile) {
      yamlContent = fs.readFileSync(this.tempDataPath, "utf8");
      const stats = fs.statSync(this.tempDataPath);
      lastModified = stats.mtime;
    } else if (hasOriginalFile) {
      yamlContent = fs.readFileSync(this.originalDataPath, "utf8");
      const stats = fs.statSync(this.originalDataPath);
      lastModified = stats.mtime;
    } else {
      throw new Error("No data.yml file found in PII directory");
    }

    const changelogEntries = this.readChangelog();

    return {
      yamlContent,
      hasChanges: hasTempFile,
      lastModified,
      changelogEntries,
    };
  }

  /**
   * Save new YAML content to temporary file
   * Immediately persists to disk
   */
  saveYamlContent(
    yamlContent: string,
    createBackup: boolean = true,
  ): ChangelogEntry {
    // Validate YAML before saving
    try {
      yaml.load(yamlContent);
    } catch (error) {
      throw new Error(
        `Invalid YAML: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Create backup if requested and original exists
    let backupFile: string | undefined;
    if (createBackup && fs.existsSync(this.originalDataPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      backupFile = path.join(this.piiPath, `data.backup.${timestamp}.yml`);
      fs.copyFileSync(this.originalDataPath, backupFile);
    }

    // Write to temporary file immediately
    fs.writeFileSync(this.tempDataPath, yamlContent, "utf8");

    // Create changelog entry
    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: "update",
      description: "Updated YAML content via editor",
      originalFile: "data.yml",
      backupFile,
    };

    this.appendToChangelog(changelogEntry);

    return changelogEntry;
  }

  /**
   * Commit temporary changes to the main file
   */
  commitChanges(): ChangelogEntry {
    if (!fs.existsSync(this.tempDataPath)) {
      throw new Error("No temporary changes to commit");
    }

    // Copy temp file to main file
    fs.copyFileSync(this.tempDataPath, this.originalDataPath);

    // Remove temp file
    fs.unlinkSync(this.tempDataPath);

    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: "commit",
      description: "Committed temporary changes to main file",
      originalFile: "data.yml",
    };

    this.appendToChangelog(changelogEntry);

    return changelogEntry;
  }

  /**
   * Discard temporary changes
   */
  discardChanges(): ChangelogEntry {
    if (!fs.existsSync(this.tempDataPath)) {
      throw new Error("No temporary changes to discard");
    }

    // Remove temp file
    fs.unlinkSync(this.tempDataPath);

    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: "discard",
      description: "Discarded temporary changes",
      originalFile: "data.yml",
    };

    this.appendToChangelog(changelogEntry);

    return changelogEntry;
  }

  /**
   * Get file statistics
   */
  getFileStats(): {
    originalExists: boolean;
    tempExists: boolean;
    originalSize?: number;
    tempSize?: number;
    originalModified?: Date;
    tempModified?: Date;
  } {
    const originalExists = fs.existsSync(this.originalDataPath);
    const tempExists = fs.existsSync(this.tempDataPath);

    let originalSize: number | undefined;
    let tempSize: number | undefined;
    let originalModified: Date | undefined;
    let tempModified: Date | undefined;

    if (originalExists) {
      const originalStats = fs.statSync(this.originalDataPath);
      originalSize = originalStats.size;
      originalModified = originalStats.mtime;
    }

    if (tempExists) {
      const tempStats = fs.statSync(this.tempDataPath);
      tempSize = tempStats.size;
      tempModified = tempStats.mtime;
    }

    return {
      originalExists,
      tempExists,
      originalSize,
      tempSize,
      originalModified,
      tempModified,
    };
  }

  /**
   * Read changelog from disk
   */
  private readChangelog(): ChangelogEntry[] {
    if (!fs.existsSync(this.changelogPath)) {
      return [];
    }

    try {
      const changelogContent = fs.readFileSync(this.changelogPath, "utf8");
      return JSON.parse(changelogContent) as ChangelogEntry[];
    } catch (error) {
      console.warn("Could not read changelog file:", error);
      return [];
    }
  }

  /**
   * Append entry to changelog and maintain size limits
   */
  private appendToChangelog(entry: ChangelogEntry): void {
    const changelog = this.readChangelog();
    changelog.push(entry);

    // Keep only the last 100 entries to prevent unbounded growth
    const trimmedChangelog = changelog.slice(-100);

    fs.writeFileSync(
      this.changelogPath,
      JSON.stringify(trimmedChangelog, null, 2),
      "utf8",
    );
  }

  /**
   * Clean up old backup files (keep only last 10)
   */
  cleanupBackups(): number {
    const backupPattern =
      /^data\.backup\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.yml$/;

    try {
      const files = fs.readdirSync(this.piiPath);
      const backupFiles = files
        .filter((file) => backupPattern.test(file))
        .map((file) => ({
          name: file,
          path: path.join(this.piiPath, file),
          mtime: fs.statSync(path.join(this.piiPath, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Newest first

      // Keep only the 10 newest backups
      const filesToDelete = backupFiles.slice(10);

      filesToDelete.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.warn(`Could not delete backup file ${file.name}:`, error);
        }
      });

      return filesToDelete.length;
    } catch (error) {
      console.warn("Could not clean up backup files:", error);
      return 0;
    }
  }

  /**
   * Get recent changelog entries
   */
  getRecentChangelog(limit: number = 10): ChangelogEntry[] {
    const changelog = this.readChangelog();
    return changelog.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Force refresh by reading from disk again
   * This method always returns fresh data
   */
  refresh(): FileSystemState {
    return this.getCurrentState();
  }
}
