import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { createTwoFilesPatch } from "diff";
import {
  FileMetadata,
  FileContent,
  Version,
  ChangelogEntry,
  SaveOptions,
  SaveResult,
  DuplicateOptions,
  DuplicateResult,
  Diff,
  FileFilters,
  FileType,
  FileMetadataJson,
} from "../src/types/fileManager";

export class UnifiedFileManager {
  private piiPath: string;
  private changelogPath: string;

  constructor(piiPath?: string) {
    this.piiPath = piiPath || process.env.PII_PATH || "";
    if (!this.piiPath) {
      throw new Error("PII_PATH must be provided or set in environment");
    }
    this.changelogPath = path.join(this.piiPath, "changelog.json");
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fsSync.existsSync(this.piiPath)) {
      throw new Error(`PII directory not found: ${this.piiPath}`);
    }
  }

  private getMetadataPath(filePath: string): string {
    return `${path.join(this.piiPath, filePath)}.meta.json`;
  }

  private getTempPath(filePath: string): string {
    const parsed = path.parse(filePath);
    return path.join(parsed.dir, `${parsed.name}.temp${parsed.ext}`);
  }

  private getBackupPath(filePath: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const parsed = path.parse(filePath);
    return path.join("backups", `${parsed.name}.${timestamp}${parsed.ext}`);
  }

  private getDiffPath(filePath: string, timestamp: string): string {
    const parsed = path.parse(filePath);
    return path.join("diffs", `${parsed.name}.${timestamp}.diff`);
  }

  private detectFileType(filePath: string): FileType {
    const name = path.basename(filePath).toLowerCase();
    if (name.includes("linkedin")) return "linkedin";
    if (name.includes("resume") || name.includes("data") || name.includes("cv"))
      return "resume";
    return "other";
  }

  private async readMetadata(
    filePath: string,
  ): Promise<FileMetadataJson | null> {
    const metaPath = this.getMetadataPath(filePath);
    try {
      const content = await fs.readFile(metaPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async writeMetadata(
    filePath: string,
    metadata: FileMetadataJson,
  ): Promise<void> {
    const metaPath = this.getMetadataPath(filePath);
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  }

  private async getFileStats(filePath: string): Promise<FileMetadata> {
    const fullPath = path.join(this.piiPath, filePath);
    const stats = await fs.stat(fullPath);
    const metadata = await this.readMetadata(filePath);
    const tempPath = this.getTempPath(filePath);
    const tempExists = fsSync.existsSync(path.join(this.piiPath, tempPath));

    // Count versions
    const backupsDir = path.join(this.piiPath, "backups");
    const parsed = path.parse(filePath);
    let versions = 0;

    if (fsSync.existsSync(backupsDir)) {
      const backupFiles = await fs.readdir(backupsDir);
      versions = backupFiles.filter((f) => f.startsWith(parsed.name)).length;
    }

    // Extract role and metadata from YAML
    let role: string | undefined;
    let resumeMetadata: Record<string, unknown> | undefined;
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const data = yaml.load(content) as Record<string, unknown>;

      // Try different paths for role based on file type
      if ((data?.info as Record<string, unknown>)?.role) {
        role = (data.info as Record<string, unknown>).role as string; // Resume format
      } else if (data?.role) {
        role = data.role as string; // LinkedIn format
      }

      // Extract resume metadata if it exists
      if (data?.metadata) {
        resumeMetadata = data.metadata as Record<string, unknown>;
      }
    } catch {
      // If we can't read the role/metadata, that's ok
    }

    return {
      path: filePath,
      name: path.basename(filePath),
      type: this.detectFileType(filePath),
      size: stats.size,
      modified: stats.mtime,
      created: metadata?.created ? new Date(metadata.created) : stats.birthtime,
      hasUnsavedChanges: tempExists,
      tags: metadata?.tags || [],
      description: metadata?.description,
      versions,
      lastEditedBy: "user",
      role,
      resumeMetadata,
    };
  }

  private async findYamlFilesRecursive(
    dir: string,
    relativePath = "",
  ): Promise<string[]> {
    const entries = await fs.readdir(path.join(this.piiPath, dir), {
      withFileTypes: true,
    });
    const files: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(relativePath, entry.name);

      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "backups" &&
        entry.name !== "diffs"
      ) {
        const subFiles = await this.findYamlFilesRecursive(
          path.join(dir, entry.name),
          entryPath,
        );
        files.push(...subFiles);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) &&
        !entry.name.includes(".temp") &&
        !entry.name.includes(".backup") &&
        !entry.name.includes(".meta")
      ) {
        files.push(entryPath);
      }
    }

    return files;
  }

  async list(filters?: FileFilters): Promise<FileMetadata[]> {
    const yamlFiles = await this.findYamlFilesRecursive("");

    let fileMetadata = await Promise.all(
      yamlFiles.map((file) => this.getFileStats(file)),
    );

    // Apply filters
    if (filters?.type) {
      fileMetadata = fileMetadata.filter((f) => f.type === filters.type);
    }

    if (filters?.tags && filters.tags.length > 0) {
      fileMetadata = fileMetadata.filter((f) =>
        filters.tags!.some((tag) => f.tags.includes(tag)),
      );
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      fileMetadata = fileMetadata.filter(
        (f) =>
          f.name.toLowerCase().includes(search) ||
          f.description?.toLowerCase().includes(search) ||
          f.tags.some((tag) => tag.toLowerCase().includes(search)),
      );
    }

    return fileMetadata;
  }

  async read(filePath: string): Promise<FileContent> {
    const tempPath = this.getTempPath(filePath);
    const tempFullPath = path.join(this.piiPath, tempPath);
    const mainFullPath = path.join(this.piiPath, filePath);

    // Read from temp if exists, otherwise main file
    const contentPath = fsSync.existsSync(tempFullPath)
      ? tempFullPath
      : mainFullPath;
    const content = await fs.readFile(contentPath, "utf-8");

    const metadata = await this.getFileStats(filePath);
    const versions = await this.getVersions(filePath);

    return {
      content,
      metadata,
      versions,
      hasUnsavedChanges: metadata.hasUnsavedChanges,
    };
  }

  async save(
    filePath: string,
    content: string,
    options?: SaveOptions,
  ): Promise<SaveResult> {
    const mainFullPath = path.join(this.piiPath, filePath);
    const commit = options?.commit ?? false;

    // Validate YAML
    try {
      yaml.load(content);
    } catch (error) {
      throw new Error(
        `Invalid YAML: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    let backupCreated: string | undefined;

    // Create backup if main file exists and we're committing or creating backup
    if (
      (commit || options?.createBackup !== false) &&
      fsSync.existsSync(mainFullPath)
    ) {
      const backupPath = this.getBackupPath(filePath);
      const backupFullPath = path.join(this.piiPath, backupPath);

      // Ensure backups directory exists
      await fs.mkdir(path.dirname(backupFullPath), { recursive: true });
      await fs.copyFile(mainFullPath, backupFullPath);
      backupCreated = backupPath;
    }

    // Save to temp or main depending on commit flag
    if (commit) {
      await fs.writeFile(mainFullPath, content, "utf-8");
      // Remove temp file if exists
      const tempPath = this.getTempPath(filePath);
      const tempFullPath = path.join(this.piiPath, tempPath);
      if (fsSync.existsSync(tempFullPath)) {
        await fs.unlink(tempFullPath);
      }
    } else {
      const tempPath = this.getTempPath(filePath);
      const tempFullPath = path.join(this.piiPath, tempPath);
      await fs.writeFile(tempFullPath, content, "utf-8");
    }

    // Update metadata tags if provided
    if (options?.tags) {
      const metadata = (await this.readMetadata(filePath)) || {
        tags: [],
        created: new Date().toISOString(),
      };
      metadata.tags = options.tags;
      await this.writeMetadata(filePath, metadata);
    }

    // Create changelog entry
    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: commit ? "commit" : "save",
      file: filePath,
      message: options?.message,
      backup: backupCreated,
    };

    await this.appendToChangelog(changelogEntry);

    return {
      saved: true,
      backupCreated,
      changelogEntry,
    };
  }

  async commit(filePath: string, message?: string): Promise<SaveResult> {
    const tempPath = this.getTempPath(filePath);
    const tempFullPath = path.join(this.piiPath, tempPath);

    if (!fsSync.existsSync(tempFullPath)) {
      throw new Error("No temporary changes to commit");
    }

    const content = await fs.readFile(tempFullPath, "utf-8");
    return this.save(filePath, content, { commit: true, message });
  }

  async discard(filePath: string): Promise<void> {
    const tempPath = this.getTempPath(filePath);
    const tempFullPath = path.join(this.piiPath, tempPath);

    if (!fsSync.existsSync(tempFullPath)) {
      throw new Error("No temporary changes to discard");
    }

    await fs.unlink(tempFullPath);

    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: "discard",
      file: filePath,
    };

    await this.appendToChangelog(changelogEntry);
  }

  async duplicate(
    filePath: string,
    options?: DuplicateOptions,
  ): Promise<DuplicateResult> {
    const parsed = path.parse(filePath);
    const suffix = options?.suffix || "_copy";
    const autoIncrement = options?.autoIncrement ?? true;

    let newName: string;
    if (options?.name) {
      newName = options.name;
    } else {
      newName = `${parsed.name}${suffix}${parsed.ext}`;

      // Auto-increment if file exists
      if (autoIncrement) {
        let counter = 2;
        while (
          fsSync.existsSync(path.join(this.piiPath, parsed.dir, newName))
        ) {
          newName = `${parsed.name}${suffix}_${counter}${parsed.ext}`;
          counter++;
        }
      }
    }

    const newPath = path.join(parsed.dir, newName);
    const sourceFullPath = path.join(this.piiPath, filePath);
    const destFullPath = path.join(this.piiPath, newPath);

    await fs.copyFile(sourceFullPath, destFullPath);

    // Copy metadata if exists
    const metadata = await this.readMetadata(filePath);
    if (metadata) {
      await this.writeMetadata(newPath, {
        ...metadata,
        created: new Date().toISOString(),
      });
    }

    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: "duplicate",
      file: newPath,
      message: `Duplicated from ${filePath}`,
    };

    await this.appendToChangelog(changelogEntry);

    return {
      newPath,
      suggestedName: newName,
    };
  }

  async delete(filePath: string, createBackup = true): Promise<void> {
    const fullPath = path.join(this.piiPath, filePath);

    if (!fsSync.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    let backup: string | undefined;
    if (createBackup) {
      const backupPath = this.getBackupPath(filePath);
      const backupFullPath = path.join(this.piiPath, backupPath);
      await fs.mkdir(path.dirname(backupFullPath), { recursive: true });
      await fs.copyFile(fullPath, backupFullPath);
      backup = backupPath;
    }

    await fs.unlink(fullPath);

    // Delete metadata if exists
    const metaPath = this.getMetadataPath(filePath);
    if (fsSync.existsSync(metaPath)) {
      await fs.unlink(metaPath);
    }

    // Delete temp file if exists
    const tempPath = this.getTempPath(filePath);
    const tempFullPath = path.join(this.piiPath, tempPath);
    if (fsSync.existsSync(tempFullPath)) {
      await fs.unlink(tempFullPath);
    }

    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: "delete",
      file: filePath,
      backup,
    };

    await this.appendToChangelog(changelogEntry);
  }

  async getVersions(filePath: string): Promise<Version[]> {
    const backupsDir = path.join(this.piiPath, "backups");
    if (!fsSync.existsSync(backupsDir)) {
      return [];
    }

    const parsed = path.parse(filePath);
    const backupFiles = await fs.readdir(backupsDir);
    const relevantBackups = backupFiles.filter((f) =>
      f.startsWith(parsed.name),
    );

    const versions: Version[] = [];
    for (const backup of relevantBackups) {
      const backupPath = path.join(backupsDir, backup);
      const stats = await fs.stat(backupPath);

      // Extract timestamp from filename
      const timestampMatch = backup.match(
        /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/,
      );
      const timestamp = timestampMatch
        ? new Date(
            timestampMatch[0]
              .replace(/-/g, ":")
              .replace(/T(\d{2}):(\d{2}):(\d{2})/, "T$1:$2:$3"),
          )
        : stats.mtime;

      const diffPath = this.getDiffPath(filePath, timestampMatch?.[0] || "");
      const diffExists = fsSync.existsSync(path.join(this.piiPath, diffPath));

      versions.push({
        timestamp,
        backupPath: path.join("backups", backup),
        changelogEntry: {
          timestamp: timestamp.toISOString(),
          action: "save",
          file: filePath,
        },
        diffAvailable: diffExists,
        size: stats.size,
      });
    }

    return versions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  async getDiff(filePath: string, from: string, to: string): Promise<Diff> {
    const fromContent =
      from === "current"
        ? await fs.readFile(path.join(this.piiPath, filePath), "utf-8")
        : await fs.readFile(path.join(this.piiPath, from), "utf-8");

    const toContent =
      to === "current"
        ? await fs.readFile(path.join(this.piiPath, filePath), "utf-8")
        : await fs.readFile(path.join(this.piiPath, to), "utf-8");

    const diff = createTwoFilesPatch(
      from === "current" ? filePath : from,
      to === "current" ? filePath : to,
      fromContent,
      toContent,
    );

    // Calculate stats
    const lines = diff.split("\n");
    const additions = lines.filter((l) => l.startsWith("+")).length;
    const deletions = lines.filter((l) => l.startsWith("-")).length;

    return {
      diff,
      stats: {
        additions,
        deletions,
        changes: additions + deletions,
      },
    };
  }

  async restore(filePath: string, version: string): Promise<void> {
    const backupFullPath = path.join(this.piiPath, version);
    const mainFullPath = path.join(this.piiPath, filePath);

    // Create backup of current state before restore
    const currentBackupPath = this.getBackupPath(filePath);
    const currentBackupFullPath = path.join(this.piiPath, currentBackupPath);
    await fs.mkdir(path.dirname(currentBackupFullPath), { recursive: true });
    await fs.copyFile(mainFullPath, currentBackupFullPath);

    // Restore from backup
    await fs.copyFile(backupFullPath, mainFullPath);

    const changelogEntry: ChangelogEntry = {
      timestamp: new Date().toISOString(),
      action: "restore",
      file: filePath,
      message: `Restored from ${version}`,
      backup: currentBackupPath,
    };

    await this.appendToChangelog(changelogEntry);
  }

  async setTags(filePath: string, tags: string[]): Promise<void> {
    const metadata = (await this.readMetadata(filePath)) || {
      tags: [],
      created: new Date().toISOString(),
    };
    metadata.tags = tags;
    await this.writeMetadata(filePath, metadata);
  }

  async setDescription(filePath: string, description: string): Promise<void> {
    const metadata = (await this.readMetadata(filePath)) || {
      tags: [],
      created: new Date().toISOString(),
    };
    metadata.description = description;
    await this.writeMetadata(filePath, metadata);
  }

  async search(query: string): Promise<FileMetadata[]> {
    return this.list({ search: query });
  }

  private async appendToChangelog(entry: ChangelogEntry): Promise<void> {
    let changelog: ChangelogEntry[] = [];

    if (fsSync.existsSync(this.changelogPath)) {
      const content = await fs.readFile(this.changelogPath, "utf-8");
      changelog = JSON.parse(content);
    }

    changelog.push(entry);

    // Keep only last 100 entries
    const trimmed = changelog.slice(-100);

    await fs.writeFile(
      this.changelogPath,
      JSON.stringify(trimmed, null, 2),
      "utf-8",
    );
  }

  async cleanupBackups(keepLast = 10): Promise<number> {
    const backupsDir = path.join(this.piiPath, "backups");
    if (!fsSync.existsSync(backupsDir)) {
      return 0;
    }

    const backups = await fs.readdir(backupsDir);
    const backupStats = await Promise.all(
      backups.map(async (file) => ({
        name: file,
        path: path.join(backupsDir, file),
        mtime: (await fs.stat(path.join(backupsDir, file))).mtime,
      })),
    );

    backupStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const toDelete = backupStats.slice(keepLast);
    for (const backup of toDelete) {
      await fs.unlink(backup.path);
    }

    return toDelete.length;
  }

  async cleanupDiffs(keepLast = 10): Promise<number> {
    const diffsDir = path.join(this.piiPath, "diffs");
    if (!fsSync.existsSync(diffsDir)) {
      return 0;
    }

    const diffs = await fs.readdir(diffsDir);
    const diffStats = await Promise.all(
      diffs.map(async (file) => ({
        name: file,
        path: path.join(diffsDir, file),
        mtime: (await fs.stat(path.join(diffsDir, file))).mtime,
      })),
    );

    diffStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const toDelete = diffStats.slice(keepLast);
    for (const diff of toDelete) {
      await fs.unlink(diff.path);
    }

    return toDelete.length;
  }
}
