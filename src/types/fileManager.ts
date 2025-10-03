import { ResumeMetadata } from "./index";

export type FileType = "resume" | "linkedin" | "other";

export interface FileManagerContextType {
  currentFile: FileMetadata | null;
  content: string;
  parsedData: unknown;
  hasUnsavedChanges: boolean;
  files: FileMetadata[];
  filteredFiles: FileMetadata[];
  fileType: "all" | FileType;
  searchQuery: string;
  selectedTags: string[];
  loading: boolean;
  error: string | null;
  loadFile: (path: string) => Promise<void>;
  saveFile: (commit?: boolean, message?: string) => Promise<void>;
  commitChanges: (message?: string) => Promise<void>;
  discardChanges: () => Promise<void>;
  updateContent: (newContent: string) => void;
  createNewFile: (
    path: string,
    content: string,
    commit?: boolean,
  ) => Promise<void>;
  duplicateFile: (
    path: string,
    name?: string,
    tags?: string[],
    description?: string,
  ) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  restoreVersion: (path: string, version: string) => Promise<void>;
  getVersionHistory: (path: string) => Promise<Version[]>;
  getFileDiff: (path: string, from: string, to: string) => Promise<Diff>;
  updateTags: (path: string, tags: string[]) => Promise<void>;
  updateDescription: (path: string, desc: string) => Promise<void>;
  setFileType: (type: "all" | FileType) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  refreshFiles: () => Promise<void>;
}

export interface FileMetadata {
  path: string;
  name: string;
  type: FileType;
  size: number;
  modified: Date;
  created: Date;
  hasUnsavedChanges: boolean;
  tags: string[];
  description?: string;
  versions: number;
  lastEditedBy: string;
  role?: string;
  resumeMetadata?: ResumeMetadata;
}

export interface Version {
  timestamp: Date;
  backupPath: string;
  changelogEntry: ChangelogEntry;
  diffAvailable: boolean;
  size: number;
}

export interface ChangelogEntry {
  timestamp: string;
  action: "save" | "commit" | "discard" | "delete" | "duplicate" | "restore";
  file: string;
  message?: string;
  stats?: {
    additions: number;
    deletions: number;
    changes: number;
  };
  backup?: string;
  diff?: string;
}

export interface FileContent {
  content: string;
  metadata: FileMetadata;
  versions: Version[];
  hasUnsavedChanges: boolean;
}

export interface SaveOptions {
  commit?: boolean;
  message?: string;
  tags?: string[];
  createBackup?: boolean;
}

export interface SaveResult {
  saved: boolean;
  backupCreated?: string;
  changelogEntry: ChangelogEntry;
}

export interface DuplicateOptions {
  name?: string;
  suffix?: string;
  autoIncrement?: boolean;
}

export interface DuplicateResult {
  newPath: string;
  suggestedName: string;
}

export interface Diff {
  diff: string;
  stats: {
    additions: number;
    deletions: number;
    changes: number;
  };
}

export interface FileFilters {
  type?: FileType;
  tags?: string[];
  search?: string;
}

export interface FileMetadataJson {
  tags: string[];
  description?: string;
  created: string;
  customFields?: Record<string, unknown>;
}
