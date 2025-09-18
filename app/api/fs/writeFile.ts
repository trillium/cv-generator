import { writeFile as fsWriteFile, readFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import yaml from "js-yaml";
import { existsSync } from "fs";

/**
 * function that writes a file to the file system
 * takes JSON returns yml
 * saves file as yml to the file system
 * overwrites existing file if it is there
 *
 * creates a diff blob that shows the previous state and the new state in the directory that is timestamped at YYYY-MM-DD_HH_SS_MMMM (year month day hour second milisecond)
 * this diff blog will show the changes that have been made to the file
 */

interface WriteFileOptions {
  filePath: string;
  baseDirectory?: string;
  createDiff?: boolean;
}

export async function writeFile(json: Object, options: WriteFileOptions) {
  const {
    filePath,
    baseDirectory = process.env.PII_PATH || ".",
    createDiff = true,
  } = options;

  try {
    const fullPath = join(baseDirectory, filePath);
    const dirPath = dirname(fullPath);

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });

    // Convert JSON to YAML
    const yamlContent = yaml.dump(json, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });

    let previousContent = "";
    let fileExisted = false;

    // Read existing file if it exists (for diff creation)
    if (existsSync(fullPath)) {
      try {
        previousContent = await readFile(fullPath, "utf-8");
        fileExisted = true;
      } catch (error) {
        console.warn(`Could not read existing file ${fullPath}:`, error);
      }
    }

    // Write the new file
    await fsWriteFile(fullPath, yamlContent, "utf-8");

    // Create diff if requested and content changed
    if (createDiff && previousContent !== yamlContent) {
      await createDiffFile(fullPath, previousContent, yamlContent, fileExisted);
    }

    return {
      success: true,
      filePath: fullPath,
      yamlContent,
      fileExisted,
      diffCreated: createDiff && previousContent !== yamlContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      filePath: options.filePath,
    };
  }
}

/**
 * Write YAML content directly to file without JSON conversion
 * This preserves the exact YAML formatting that was generated
 */
export async function writeYamlFile(
  yamlContent: string,
  options: WriteFileOptions,
) {
  const {
    filePath,
    baseDirectory = process.env.PII_PATH || ".",
    createDiff = true,
  } = options;

  try {
    const fullPath = join(baseDirectory, filePath);
    const dirPath = dirname(fullPath);

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });

    let previousContent = "";
    let fileExisted = false;

    // Read existing file if it exists (for diff creation)
    if (existsSync(fullPath)) {
      try {
        previousContent = await readFile(fullPath, "utf-8");
        fileExisted = true;
      } catch (error) {
        console.warn(`Could not read existing file ${fullPath}:`, error);
      }
    }

    console.log("🔍 writeYamlFile comparison:", {
      previousLength: previousContent.length,
      newLength: yamlContent.length,
      areEqual: previousContent === yamlContent,
      previousPreview: previousContent.substring(0, 100) + "...",
      newPreview: yamlContent.substring(0, 100) + "...",
    });

    // Write the new file
    await fsWriteFile(fullPath, yamlContent, "utf-8");

    // Create diff if requested and content changed
    const contentChanged = previousContent !== yamlContent;
    if (createDiff && contentChanged) {
      await createDiffFile(fullPath, previousContent, yamlContent, fileExisted);
    }

    return {
      success: true,
      filePath: fullPath,
      yamlContent,
      fileExisted,
      diffCreated: createDiff && contentChanged,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      filePath: options.filePath,
    };
  }
}

async function createDiffFile(
  originalFilePath: string,
  previousContent: string,
  newContent: string,
  fileExisted: boolean,
) {
  try {
    const timestamp = new Date();
    const formattedTimestamp = timestamp
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "-")
      .replace(/\..+/, "")
      .replace(/-/g, "_");

    const diffFileName = `diff_${formattedTimestamp}.md`;
    const diffDir = join(dirname(originalFilePath), "diffs");
    const diffPath = join(diffDir, diffFileName);

    // Ensure diff directory exists
    await mkdir(diffDir, { recursive: true });

    const diffContent = createDiffMarkdown(
      originalFilePath,
      previousContent,
      newContent,
      fileExisted,
      timestamp,
    );

    await fsWriteFile(diffPath, diffContent, "utf-8");

    return diffPath;
  } catch (error) {
    console.error("Failed to create diff file:", error);
    return null;
  }
}

function createDiffMarkdown(
  filePath: string,
  previousContent: string,
  newContent: string,
  fileExisted: boolean,
  timestamp: Date,
): string {
  const operation = fileExisted ? "MODIFIED" : "CREATED";

  return `# File Diff: ${operation}

**File:** \`${filePath}\`  
**Timestamp:** ${timestamp.toISOString()}  
**Operation:** ${operation}

## Previous State
${fileExisted ? `\`\`\`yaml\n${previousContent}\n\`\`\`` : "_File did not exist_"}

## New State
\`\`\`yaml
${newContent}
\`\`\`

## Summary
- **Lines before:** ${fileExisted ? previousContent.split("\n").length : 0}
- **Lines after:** ${newContent.split("\n").length}
- **Size before:** ${fileExisted ? previousContent.length : 0} characters
- **Size after:** ${newContent.length} characters
`;
}
