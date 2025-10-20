import { getAncestorDirectories } from "../multiFileMapper";
import type {
  DirectoryHierarchy,
  DirectoryTreeNode,
  SectionSourceInfo,
} from "@/types/multiFileManager.types";
import { loadDirectory } from "./loadDirectory";

export async function getHierarchy(
  dirPath: string,
): Promise<DirectoryHierarchy> {
  const ancestors = getAncestorDirectories(dirPath);
  const tree = await buildDirectoryTree(ancestors);
  const sections = await analyzeSectionSources(dirPath);
  return {
    path: dirPath,
    ancestors,
    tree,
    sections,
  };
}

export async function buildDirectoryTree(
  directories: string[],
): Promise<Record<string, DirectoryTreeNode>> {
  // directories: string[] is intentionally unused in this stub
  void directories;
  return {};
}

export async function analyzeSectionSources(
  dirPath: string,
): Promise<Record<string, SectionSourceInfo>> {
  const result = await loadDirectory(dirPath);
  const sections: Record<string, SectionSourceInfo> = {};
  for (const [section, sourceFile] of Object.entries(result.sources)) {
    sections[section] = {
      sourceFile,
      overriddenBy: null,
      inheritedFrom: null,
    };
  }
  return sections;
}
