import { readFile, writeFile as fsWriteFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

interface CopyFileOptions {
  sourcePath: string;
  destinationPath: string;
  baseDirectory?: string;
  overwrite?: boolean;
}

export async function copyFile(options: CopyFileOptions) {
  const {
    sourcePath,
    destinationPath,
    baseDirectory = process.env.PII_PATH || ".",
    overwrite = false,
  } = options;

  try {
    const fullSourcePath = join(baseDirectory, sourcePath);
    const fullDestinationPath = join(baseDirectory, destinationPath);

    // Check if source exists
    if (!existsSync(fullSourcePath)) {
      return {
        success: false,
        error: "Source file does not exist",
        sourcePath: fullSourcePath,
      };
    }

    // Check if destination exists and overwrite is false
    if (existsSync(fullDestinationPath) && !overwrite) {
      return {
        success: false,
        error: "Destination file already exists and overwrite is false",
        destinationPath: fullDestinationPath,
      };
    }

    // Ensure destination directory exists
    const destDir = dirname(fullDestinationPath);
    await mkdir(destDir, { recursive: true });

    // Read source file and write to destination
    const content = await readFile(fullSourcePath, "utf-8");
    await fsWriteFile(fullDestinationPath, content, "utf-8");

    return {
      success: true,
      sourcePath: fullSourcePath,
      destinationPath: fullDestinationPath,
      overwritten: existsSync(fullDestinationPath),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      sourcePath: options.sourcePath,
      destinationPath: options.destinationPath,
    };
  }
}
