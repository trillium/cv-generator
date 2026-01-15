import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { getPiiDirectory } from "./getPiiPath";

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
  linkedIn: ["linkedIn", "linkedin"],
  notes: ["notes"],
  llm: ["llm"],
};

export const SUPPORTED_EXTENSIONS = [".yml", ".yaml", ".json"];

export interface FileEntry {
  path: string;
  sections: string[];
  format: "yaml" | "json";
}

export interface NumberedArrayFileInfo {
  basename: string;
  sectionKey: string;
  number: string;
  ext: string;
}

/**
 * Loads a data file (YAML or JSON) and returns its parsed content
 * @param filePath - Absolute path to the file
 * @returns Parsed file content as a record
 */
export function loadDataFile(filePath: string): Record<string, unknown> {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, "utf-8");

  if (ext === ".json") {
    return JSON.parse(content);
  }

  return yaml.load(content) as Record<string, unknown>;
}

/**
 * Checks if a filename is a full data file (data.yml, resume.json, etc.)
 * @param filename - The filename to check
 * @returns True if it's a full data file
 */
export function isFullDataFilename(filename: string): boolean {
  const basename = path.basename(filename, path.extname(filename));
  return FULL_DATA_FILENAMES.includes(basename);
}

/**
 * Determines the format of a file based on extension
 * @param filePath - Path to the file
 * @returns 'yaml' or 'json'
 */
export function getFormat(filePath: string): "yaml" | "json" {
  const ext = path.extname(filePath);
  return ext === ".json" ? "json" : "yaml";
}

/**
 * Resolves ancestor directories for a relative path
 * @param dirPath - Relative path from PII_PATH (e.g., 'base/google/python')
 * @returns Array of absolute paths to ancestor directories
 * @example
 * getAncestorDirectories('base/google/python')
 * // Returns: ['/pii/base', '/pii/base/google', '/pii/base/google/python']
 */
export function getAncestorDirectories(dirPath: string): string[] {
  const piiPath = getPiiDirectory();
  const parts = dirPath.split(path.sep).filter(Boolean);
  const ancestors: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const relativePath = parts.slice(0, i + 1).join(path.sep);
    ancestors.push(path.join(piiPath, relativePath));
  }

  return ancestors;
}

/**
 * Finds all data files in a directory (non-recursive)
 * @param dirPath - Absolute path to directory
 * @returns Array of absolute file paths
 */
export function findDataFilesInDirectory(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const dataFiles: string[] = [];
  const numberedFiles: Array<{ path: string; parsed: NumberedArrayFileInfo }> =
    [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) continue;

    const ext = path.extname(file);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

    const parsed = parseNumberedArrayFile(file);
    if (parsed) {
      numberedFiles.push({ path: filePath, parsed });
      continue;
    }

    const basename = path.basename(file, ext);

    const isFullData = FULL_DATA_FILENAMES.includes(basename);
    const isSectionSpecific = Object.values(SECTION_KEY_TO_FILENAME)
      .flat()
      .includes(basename);

    if (isFullData || isSectionSpecific) {
      dataFiles.push(filePath);
    }
  }

  numberedFiles.sort((a, b) => {
    if (a.parsed.sectionKey !== b.parsed.sectionKey) {
      return a.parsed.sectionKey.localeCompare(b.parsed.sectionKey);
    }
    return parseInt(a.parsed.number, 10) - parseInt(b.parsed.number, 10);
  });

  for (const { path: filePath } of numberedFiles) {
    dataFiles.push(filePath);
  }

  return dataFiles;
}

/**
 * Validates that section-specific files only contain their designated section
 * @param filename - Name of the file to validate
 * @param sections - Array of section keys found in the file
 * @throws Error if validation fails
 */
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

/**
 * Validates that there are no conflicting files in a directory
 * Checks for:
 * - Same section in multiple section-specific files
 * - Same basename with different extensions
 * @param files - Array of file entries to validate
 * @param dirPath - Directory path for error messages
 * @throws Error if conflicts are detected
 */
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

/**
 * Checks if a filename is a numbered array file
 * @param filename - The filename to check (e.g., 'experience.workExperience01.yml')
 * @returns True if it matches the numbered array file pattern
 */
export function isNumberedArrayFile(filename: string): boolean {
  const parsed = parseNumberedArrayFile(filename);
  return parsed !== null;
}

/**
 * Parses a numbered array filename into its components
 * Supports three formats:
 * 1. Legacy: basename.sectionKey{digits}.ext (e.g., 'work.workExperience01.yml')
 * 2. New: sectionKey.word.{digits}.ext (e.g., 'projects.talon.01.yml')
 * 3. New: sectionKey.{digits}.word.ext (e.g., 'projects.01.talon.yml')
 * @param filename - The filename to parse
 * @returns Parsed components or null if not a numbered array file
 * @example
 * parseNumberedArrayFile('work.workExperience01.yml')
 * // Returns: { basename: 'work', sectionKey: 'workExperience', number: '01', ext: '.yml' }
 * parseNumberedArrayFile('projects.talon.01.yml')
 * // Returns: { basename: 'talon', sectionKey: 'projects', number: '01', ext: '.yml' }
 * parseNumberedArrayFile('projects.01.talon.yml')
 * // Returns: { basename: 'talon', sectionKey: 'projects', number: '01', ext: '.yml' }
 */
export function parseNumberedArrayFile(
  filename: string,
): NumberedArrayFileInfo | null {
  const ext = path.extname(filename);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return null;
  }

  const nameWithoutExt = path.basename(filename, ext);
  const parts = nameWithoutExt.split(".");

  if (parts.length === 3) {
    const [firstPart, middlePart, lastPart] = parts;
    const validSectionKeys = Object.keys(SECTION_KEY_TO_FILENAME);

    if (validSectionKeys.includes(firstPart)) {
      if (/^\d+$/.test(lastPart)) {
        return {
          basename: middlePart,
          sectionKey: firstPart,
          number: lastPart,
          ext,
        };
      }

      if (/^\d+$/.test(middlePart)) {
        return {
          basename: lastPart,
          sectionKey: firstPart,
          number: middlePart,
          ext,
        };
      }
    }
  }

  if (parts.length === 2) {
    const [basename, sectionAndNumber] = parts;

    for (const sectionKey of Object.keys(SECTION_KEY_TO_FILENAME)) {
      if (sectionAndNumber.startsWith(sectionKey)) {
        const numberPart = sectionAndNumber.substring(sectionKey.length);
        if (/^\d+$/.test(numberPart)) {
          return {
            basename,
            sectionKey,
            number: numberPart,
            ext,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Groups numbered array files by section and merges their arrays
 * @param filePaths - Array of file paths
 * @returns Map of section key to merged array data and source files
 */
export function mergeNumberedArrayFiles(
  filePaths: string[],
): Map<string, { data: unknown[]; sources: string[] }> {
  const grouped = new Map<
    string,
    Array<{ path: string; number: number; data: unknown[] }>
  >();

  for (const filePath of filePaths) {
    const filename = path.basename(filePath);
    const parsed = parseNumberedArrayFile(filename);
    if (!parsed) continue;

    const fileData = loadDataFile(filePath);
    const sectionData = fileData[parsed.sectionKey];

    if (!Array.isArray(sectionData)) {
      throw new Error(
        `Numbered array file '${filePath}' must contain an array for section '${parsed.sectionKey}'`,
      );
    }

    if (!grouped.has(parsed.sectionKey)) {
      grouped.set(parsed.sectionKey, []);
    }

    grouped.get(parsed.sectionKey)!.push({
      path: filePath,
      number: parseInt(parsed.number, 10),
      data: sectionData,
    });
  }

  const result = new Map<string, { data: unknown[]; sources: string[] }>();

  for (const [sectionKey, files] of grouped.entries()) {
    files.sort((a, b) => a.number - b.number);

    const mergedData: unknown[] = [];
    const sources: string[] = [];

    for (const file of files) {
      mergedData.push(...file.data);
      sources.push(file.path);
    }

    result.set(sectionKey, { data: mergedData, sources });
  }

  return result;
}

/**
 * Validates numbered array files in a directory
 * @param filePaths - Array of all file paths in directory
 * @param dirPath - Directory path for error messages
 * @throws Error if validation fails
 */
export function validateNumberedArrayFiles(
  filePaths: string[],
  dirPath: string,
): void {
  const numberedFiles: Array<{ path: string; parsed: NumberedArrayFileInfo }> =
    [];
  const regularSectionFiles = new Map<string, string>();

  for (const filePath of filePaths) {
    const filename = path.basename(filePath);
    const parsed = parseNumberedArrayFile(filename);

    if (parsed) {
      numberedFiles.push({ path: filePath, parsed });

      const fileData = loadDataFile(filePath);
      const sections = Object.keys(fileData);

      if (sections.length !== 1 || sections[0] !== parsed.sectionKey) {
        throw new Error(
          `Numbered array file '${filename}' must only contain '${parsed.sectionKey}' section.\n` +
            `Found sections: [${sections.join(", ")}]`,
        );
      }

      if (!Array.isArray(fileData[parsed.sectionKey])) {
        throw new Error(
          `Numbered array file '${filename}' must contain an array for section '${parsed.sectionKey}'`,
        );
      }
    } else {
      const ext = path.extname(filename);
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

      const basename = path.basename(filename, ext);
      const isSectionSpecific = Object.values(SECTION_KEY_TO_FILENAME)
        .flat()
        .includes(basename);

      if (isSectionSpecific) {
        for (const [sectionKey, filenames] of Object.entries(
          SECTION_KEY_TO_FILENAME,
        )) {
          if (filenames.includes(basename)) {
            regularSectionFiles.set(sectionKey, filePath);
            break;
          }
        }
      }
    }
  }

  const groupedBySection = new Map<
    string,
    Array<{ path: string; number: number }>
  >();
  for (const { path: filePath, parsed } of numberedFiles) {
    if (!groupedBySection.has(parsed.sectionKey)) {
      groupedBySection.set(parsed.sectionKey, []);
    }
    groupedBySection.get(parsed.sectionKey)!.push({
      path: filePath,
      number: parseInt(parsed.number, 10),
    });
  }

  const errors: string[] = [];

  for (const [sectionKey, files] of groupedBySection.entries()) {
    if (regularSectionFiles.has(sectionKey)) {
      errors.push(
        `Section '${sectionKey}' has both numbered files and a regular section file:\n` +
          `  Regular: ${regularSectionFiles.get(sectionKey)}\n` +
          `  Numbered: ${files.map((f) => f.path).join(", ")}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Numbered array file validation failed in ${dirPath}:\n\n${errors.join("\n\n")}`,
    );
  }
}
