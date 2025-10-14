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

export function validateSectionSpecificFile(
  filename: string,
  sections: string[],
): void {
  const basename = path.basename(filename, path.extname(filename));

  let expectedSection: string | null = null;
  for (const [sectionKey, filenames] of Object.entries(
    SECTION_KEY_TO_FILENAME,
  )) {
    if (filenames.includes(basename)) {
      expectedSection = sectionKey;
      break;
    }
  }

  if (!expectedSection) {
    return;
  }

  if (sections.length !== 1 || sections[0] !== expectedSection) {
    throw new Error(
      `Section-specific file '${filename}' must only contain '${expectedSection}' section.\n` +
        `Found sections: [${sections.join(", ")}]`,
    );
  }
}

export function validateNoConflicts(files: FileEntry[], dirPath: string): void {
  const sectionToFiles = new Map<string, string[]>();
  const basenameToFiles = new Map<string, string[]>();

  for (const file of files) {
    const basename = path.basename(file.path, path.extname(file.path));
    const fullBasename = path.basename(file.path);

    if (!basenameToFiles.has(basename)) {
      basenameToFiles.set(basename, []);
    }
    basenameToFiles.get(basename)!.push(fullBasename);

    for (const section of file.sections) {
      if (!sectionToFiles.has(section)) {
        sectionToFiles.set(section, []);
      }
      sectionToFiles.get(section)!.push(file.path);
    }
  }

  const conflicts: string[] = [];

  for (const [section, filePaths] of sectionToFiles.entries()) {
    const sectionSpecificFiles = filePaths.filter(
      (fp) => !isFullDataFilename(path.basename(fp)),
    );

    if (sectionSpecificFiles.length > 1) {
      conflicts.push(
        `Section '${section}' defined in multiple files:\n  ${sectionSpecificFiles.join("\n  ")}`,
      );
    }
  }

  for (const [basename, fullNames] of basenameToFiles.entries()) {
    if (fullNames.length > 1) {
      const uniqueExtensions = new Set(
        fullNames.map((name) => path.extname(name)),
      );
      if (uniqueExtensions.size > 1) {
        conflicts.push(
          `Files with same basename '${basename}' exist in multiple formats in '${dirPath}':\n  ${fullNames.join("\n  ")}`,
        );
      }
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Data conflicts detected in ${dirPath}:\n\n${conflicts.join("\n\n")}`,
    );
  }
}
