import * as path from "path";
import { createYamlDocument, documentToString } from "../yamlService";
import * as fs from "fs/promises";
import { getPiiDirectory } from "../getPiiPath";
import type { FileMetadata } from "@/types/fileManager";
import { ARRAY_INDEX_PATTERN } from "./constants";

export { ARRAY_INDEX_PATTERN };
export { extractTopLevelKey, deriveDirectoryFromSources } from "./pathUtils";

export function isSectionSpecificFile(basename: string): boolean {
  const sectionFiles = [
    "info",
    "header",
    "career",
    "work",
    "experience",
    "projects",
    "profile",
    "technical",
    "languages",
    "education",
    "cover-letter",
    "metadata",
    "llm",
  ];
  return sectionFiles.includes(basename);
}

export function serializeData(
  data: Record<string, unknown>,
  filePath: string,
): string {
  const ext = path.extname(filePath);
  if (ext === ".json") {
    return JSON.stringify(data, null, 2);
  } else {
    const doc = createYamlDocument(data);
    return documentToString(doc);
  }
}

export function setNestedValue(
  obj: Record<string, unknown>,
  pathStr: string,
  value: unknown,
): void {
  const keys = pathStr.split(/[.[\]]+/g).filter(Boolean);
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (!(key in current)) {
      const isNextKeyNumeric = /^\d+$/.test(nextKey);
      current[key] = isNextKeyNumeric ? [] : {};
    }

    const isCurrentKeyNumeric = /^\d+$/.test(key);
    if (isCurrentKeyNumeric && Array.isArray(current)) {
      const index = parseInt(key, 10);
      if (index >= current.length) {
        while (current.length <= index) {
          current.push({});
        }
      }
    }

    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

export async function getMinimalFileStats(
  filePath: string,
): Promise<FileMetadata> {
  const piiPath = getPiiDirectory();
  const fullPath = path.join(piiPath, filePath);
  const stat = await fs.stat(fullPath);
  return {
    name: path.basename(filePath),
    path: filePath,
    size: stat.size,
    modified: stat.mtime,
    created: stat.birthtime,
    type: "resume",
    versions: 0,
    hasUnsavedChanges: false,
    tags: [],
    lastEditedBy: "system",
  };
}
