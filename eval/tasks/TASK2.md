# TASK2: UnifiedFileManager Deprecation Plan

## Context

UnifiedFileManager is being deprecated in favor of MultiFileManager, which supports hierarchical, multi-file directory structures. This document outlines the deprecation plan, marks UnifiedFileManager as deprecated, and lists important functions to migrate.

---

## Deprecation Notice

**UnifiedFileManager is deprecated.**

- Do not use for new features.
- All new file management logic should use MultiFileManager.
- Remove all imports/usages of UnifiedFileManager as migration progresses.

---

## Migration Plan: Moving Key Functions to MultiFileManager

### 1. Identify Functions Unique to UnifiedFileManager

The following functions/methods exist in UnifiedFileManager but are not fully implemented or exposed in MultiFileManager:

| Function/Method | Description | Status in MultiFileManager |
| --- | --- | --- |
| ensureDirectoryExists | Ensures PII directory exists | Not exposed |
| getMetadataPath | Metadata file path for a given file | Not exposed |
| getTempPath | Temp file path for a given file | Not exposed |
| getBackupPath | Backup file path for a given file | Not exposed |
| getDiffPath | Diff file path for a given file | Not exposed |
| detectFileType | Determines file type (resume/linkedin/other) | Not exposed |
| readMetadata | Reads metadata for a file | Not exposed |
| writeMetadata | Writes metadata for a file | Not exposed |
| getFileStats | Returns detailed file stats incl. metadata, role, versions | Not exposed |
| findYamlFilesRecursive | Recursively finds YAML files in a directory | Not exposed |
| list | Lists all YAML files with metadata, supports filters | Not exposed |
| read | Reads file content, metadata, versions | Inherited |
| save | Saves file content, creates backup, updates metadata/changelog | Inherited |
| commit | Commits temp changes to main file | Inherited |
| discard | Discards temp changes | Inherited |
| duplicate | Duplicates a file, copies metadata | Inherited |
| delete | Deletes a file, creates backup, removes metadata/temp | Inherited |
| getVersions | Returns backup/version history | Inherited |
| getDiff | Returns diff between two file versions | Inherited |
| restore | Restores file from backup | Inherited |
| setTags | Sets tags in metadata | Inherited |
| setDescription | Sets description in metadata | Inherited |
| search | Searches files by name/description/tags | Inherited |
| appendToChangelog | Appends entry to changelog | Inherited |
| cleanupBackups | Deletes old backups | Inherited |
| cleanupDiffs | Deletes old diffs | Inherited |

### 2. Migration Steps

1. **Audit all usages of UnifiedFileManager.**
   - Remove imports/usages from API routes and other files.
2. **Expose or reimplement any needed private methods in MultiFileManager.**
   - If MultiFileManager needs logic like `getMetadataPath`, `getTempPath`, etc., move or refactor these as protected or utility functions.
3. **Move or refactor unique logic.**
   - For directory-based operations, ensure MultiFileManager covers all use cases.
   - For single-file operations, confirm MultiFileManager can handle them or provide a utility.
4. **Update documentation and tests.**
   - Ensure all tests use MultiFileManager.
   - Update docs to reference MultiFileManager only.
5. **Remove UnifiedFileManager.**
   - Once all usages are migrated and no code depends on it, delete the file.

### 3. Checklist for Safe Removal

- [ ] All API routes migrated to MultiFileManager
- [ ] All frontend/backend usages migrated
- [ ] All needed private methods exposed or refactored
- [ ] All tests updated
- [ ] UnifiedFileManager deleted

---

## Notes

- MultiFileManager currently inherits all public methods from UnifiedFileManager, but some private methods may need to be exposed or refactored for full feature parity.
- If any legacy code requires single-file management, consider extracting shared logic into a utility module.

---

## Status

- UnifiedFileManager marked as deprecated.
- Migration in progress.
- See this document for checklist and progress tracking.
