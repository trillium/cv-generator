import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

/**
 * Parses a YAML or JSON file and writes its contents as JSON to the output path.
 * @param inputPath Path to the input .yml/.yaml/.json file
 * @param outputPath Path to write the output JSON file
 * @returns The parsed data object
 */
export function parseAndWriteDataFile(
  inputPath: string,
  outputPath: string,
): any {
  const ext = path.extname(inputPath).toLowerCase();
  let dataObj: any;
  const fileContent = readFileSync(inputPath, "utf-8");
  if (ext === ".yml" || ext === ".yaml") {
    dataObj = yaml.load(fileContent);
  } else if (ext === ".json") {
    dataObj = JSON.parse(fileContent);
  } else {
    throw new Error(
      "Unsupported file type. Please provide a .json or .yml/.yaml file.",
    );
  }
  writeFileSync(outputPath, JSON.stringify(dataObj, null, 2));
  return dataObj;
}
