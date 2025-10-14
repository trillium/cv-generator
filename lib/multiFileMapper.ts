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

export function getAncestorDirectories(dirPath: string): string[] {
  const parts = dirPath.split(path.sep).filter(Boolean);
  const ancestors: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i + 1).join(path.sep));
  }

  return ancestors;
}

export function findDataFilesInDirectory(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const dataFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) continue;

    const ext = path.extname(file);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

    const basename = path.basename(file, ext);

    const isFullData = FULL_DATA_FILENAMES.includes(basename);
    const isSectionSpecific = Object.values(SECTION_KEY_TO_FILENAME)
      .flat()
      .includes(basename);

    if (isFullData || isSectionSpecific) {
      dataFiles.push(filePath);
    }
  }

  return dataFiles;
}
