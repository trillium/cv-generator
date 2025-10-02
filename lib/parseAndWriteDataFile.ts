import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { CVData } from "../src/types/cvdata.zod";

/**
 * Parses a YAML or JSON file and writes its contents as JSON to the output path.
 * @param inputPath Path to the input .yml/.yaml/.json file
 * @param outputPath Path to write the output JSON file
 * @returns The parsed data object
 */
export function parseAndWriteDataFile(
  inputPath: string,
  outputPath: string,
): CVData.infer {
  const ext = path.extname(inputPath).toLowerCase();
  const fileContent = readFileSync(inputPath, "utf-8");
  let parsed: unknown;
  if (ext === ".yml" || ext === ".yaml") {
    parsed = yaml.load(fileContent);
  } else if (ext === ".json") {
    parsed = JSON.parse(fileContent);
  } else {
    throw new Error(
      "Unsupported file type. Please provide a .json or .yml/.yaml file.",
    );
  }
  const result = CVData.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Input file does not match CVData schema: ${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }
  writeFileSync(outputPath, JSON.stringify(result.data, null, 2));
  return result.data;
}
