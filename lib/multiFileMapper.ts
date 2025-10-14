import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export const FULL_DATA_FILENAMES = ["data", "resume"];

export const SECTION_KEY_TO_FILENAME: Record<string, string[]> = {
  info: ["info"],
  header: ["header"],
  careerSummary: ["career"],
  workExperience: ["work", "experience"],
  projects: ["projects"],
  profile: ["profile"],
  technical: ["technical"],
  languages: ["languages"],
  education: ["education"],
  coverLetter: ["cover-letter"],
  metadata: ["metadata"],
};

export const SUPPORTED_EXTENSIONS = [".yml", ".yaml", ".json"];

export interface FileEntry {
  path: string;
  sections: string[];
  format: "yaml" | "json";
}

export function loadDataFile(filePath: string): Record<string, unknown> {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, "utf-8");

  if (ext === ".json") {
    return JSON.parse(content);
  }

  return yaml.load(content) as Record<string, unknown>;
}

export function isFullDataFilename(filename: string): boolean {
  const basename = path.basename(filename, path.extname(filename));
  return FULL_DATA_FILENAMES.includes(basename);
}

export function getFormat(filePath: string): "yaml" | "json" {
  const ext = path.extname(filePath);
  return ext === ".json" ? "json" : "yaml";
}
