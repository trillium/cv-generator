import * as fs from "fs";
import { parseDocument, Document } from "yaml";

export function loadYamlFile(filePath: string): Record<string, unknown> {
  const content = fs.readFileSync(filePath, "utf-8");
  const doc = parseDocument(content);
  return doc.toJS() as Record<string, unknown>;
}

export function parseYamlString(yamlString: string): Record<string, unknown> {
  const doc = parseDocument(yamlString);
  return doc.toJS() as Record<string, unknown>;
}

export function serializeYaml(
  data: Record<string, unknown>,
  originalContent?: string,
): string {
  const doc = originalContent
    ? parseDocument(originalContent)
    : parseDocument("");

  for (const [key, value] of Object.entries(data)) {
    doc.setIn([key], value);
  }

  return doc.toString();
}

export function updateYamlInMemory(
  originalContent: string,
  path: string,
  value: unknown,
): string {
  const doc = parseDocument(originalContent);
  const pathParts = path.split(/[.[\]]+/).filter(Boolean);
  doc.setIn(pathParts, value);
  return doc.toString();
}

export function createYamlDocument(
  data: Record<string, unknown>,
): Document.Parsed {
  const doc = parseDocument("");
  for (const [key, value] of Object.entries(data)) {
    doc.setIn([key], value);
  }
  return doc;
}

export function documentToString(doc: Document.Parsed): string {
  return doc.toString();
}

export const yaml = {
  load: parseYamlString,
  dump: (data: Record<string, unknown>) => {
    const doc = createYamlDocument(data);
    return documentToString(doc);
  },
};
