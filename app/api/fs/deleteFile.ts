import { unlink, readFile, mkdir, writeFile as fsWriteFile } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

interface DeleteFileOptions {
  filePath: string;
  baseDirectory?: string;
  createBackup?: boolean;
}

export async function deleteFile(options: DeleteFileOptions) {
  const {
    filePath,
    baseDirectory = process.env.PII_PATH || ".",
    createBackup = true,
  } = options;

  try {
    const fullPath = join(baseDirectory, filePath);

    if (!existsSync(fullPath)) {
      return {
        success: false,
        error: "File does not exist",
        filePath: fullPath,
      };
    }

    let backupCreated = false;

    // Create backup if requested
    if (createBackup) {
      try {
        const fileContent = await readFile(fullPath, "utf-8");
        backupCreated = await createBackupFile(fullPath, fileContent);
      } catch (error) {
        console.warn(`Could not create backup for ${fullPath}:`, error);
      }
    }

    // Delete the file
    await unlink(fullPath);

    return {
      success: true,
      filePath: fullPath,
      backupCreated,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      filePath: options.filePath,
    };
  }
}

async function createBackupFile(
  originalFilePath: string,
  content: string,
): Promise<boolean> {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "-")
      .replace(/\..+/, "")
      .replace(/-/g, "_");

    const backupFileName = `deleted_${timestamp}.backup`;
    const backupDir = join(dirname(originalFilePath), "diffs");
    const backupPath = join(backupDir, backupFileName);

    await mkdir(backupDir, { recursive: true });

    const backupContent = `# Deleted File Backup

**Original File:** \`${originalFilePath}\`  
**Deleted At:** ${new Date().toISOString()}

## File Content
\`\`\`
${content}
\`\`\`
`;

    await fsWriteFile(backupPath, backupContent, "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to create backup file:", error);
    return false;
  }
}
