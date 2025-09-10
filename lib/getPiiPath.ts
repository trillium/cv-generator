import path from "path";
import fs from "fs";

/**
 * Gets the path to PII data files using the PII_PATH environment variable
 * @param filename - The filename to join with the PII path (defaults to 'data.yml')
 * @returns The full path to the PII data file
 */
export function getPiiPath(filename: string = "data.yml"): string {
  const piiPath = process.env.PII_PATH;

  if (!piiPath) {
    throw new Error(
      "PII_PATH environment variable is not set. " +
        "Please set it to the directory containing your data.yml file.",
    );
  }

  const fullPath = path.join(piiPath, filename);

  // Check if the file exists
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `File not found: ${fullPath}. ` +
        `Please ensure the file exists in your PII directory.`,
    );
  }

  return fullPath;
}

/**
 * Gets the PII directory path from the environment variable
 * @returns The PII directory path
 */
export function getPiiDirectory(): string {
  const piiPath = process.env.PII_PATH;

  if (!piiPath) {
    throw new Error(
      "PII_PATH environment variable is not set. " +
        "Please set it to the directory containing your PII files.",
    );
  }

  if (!fs.existsSync(piiPath)) {
    throw new Error(
      `PII directory not found: ${piiPath}. ` +
        `Please ensure the directory exists.`,
    );
  }

  return piiPath;
}
