import type { CVData } from "@/types";
import type { FileMetadata } from "@/types/fileManager";

export interface PdfMetadata {
  pages: number;
  lastPageText?: string;
  lastPageLines?: string[];
  lineBreaks?: number;
  generatedAt: string;
}

export interface PdfMetadataFile {
  pdf?: {
    resume?: PdfMetadata;
    coverLetter?: PdfMetadata;
  };
}

export interface DirectoryLoadResult {
  data: CVData;
  sources: Record<string, string | string[]>;
  metadata: DirectoryMetadata;
  pdfMetadata?: PdfMetadataFile;
}

export interface DirectoryMetadata {
  directoryPath: string;
  loadedDirectories: string[];
  filesLoaded: string[];
  hasUnsavedChanges: boolean;
}

export interface UpdateResult {
  success: boolean;
  updatedFile: string;
  section: string;
  backup?: {
    path: string;
    timestamp: string;
  };
  diff?: {
    path: string;
    content: string;
  };
  changelogEntry?: {
    timestamp: string;
    action: string;
    file: string;
    yamlPath: string;
    message?: string;
  };
}

export interface DirectoryFileInfo {
  path: string;
  fullPath: string;
  sections: string[];
  format: "yaml" | "json";
  isFullData: boolean;
  isNumberedArray?: boolean;
  numberedArrayInfo?: {
    basename: string;
    sectionKey: string;
    number: string;
  };
  metadata: FileMetadata;
}

export interface DirectoryHierarchy {
  path: string;
  ancestors: string[];
  tree: Record<string, DirectoryTreeNode>;
  sections: Record<string, SectionSourceInfo>;
}

export interface DirectoryTreeNode {
  files: string[];
  children: Record<string, DirectoryTreeNode>;
}

export interface SectionSourceInfo {
  sourceFile: string | string[];
  overriddenBy: string | null;
  inheritedFrom: string | null;
}
