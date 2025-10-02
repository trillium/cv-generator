import { ResumeMetadata } from "./index";

export type FileType = "resume" | "linkedin" | "other";

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
  customFields?: Record<string, any>;
}
