# Lib Directory Bloat & Duplication Report

## 1. File Size (200+ lines)

- **multiFileManager.ts**: ~700 lines. **TOO LARGE.**
  - Large class with many methods, interfaces, and logic for directory-based CV data management.
  - **Recommendation:** Split into submodules:
    - Types/interfaces should move to `/types` (e.g., DirectoryLoadResult, DirectoryMetadata, etc.).
    - Helper functions (e.g., setNestedValue, extractTopLevelKey, serializeData) could be moved to utility files.
    - Consider breaking out PDF metadata logic, file listing, and directory tree logic into separate files.
- **unifiedFileManager.ts**: ~630 lines. **TOO LARGE.**
  - Large class for file management, backup, diff, and changelog logic.
  - **Recommendation:** Split:
    - Types (FileMetadata, ChangelogEntry, etc.) should move to `/types`.
    - Backup/diff/changelog logic could be a separate module.
    - File stat and metadata helpers could be utility functions.
- All other files are well under 200 lines.

## 2. Type Information

- Many files (multiFileManager.ts, unifiedFileManager.ts, getDefaultResume.ts, etc.) define interfaces and types inline.
- **Recommendation:** Move all type/interface definitions to `/types` (e.g., `/types/fileManager.ts`, `/types/cvdata.ts`).
- This will improve maintainability and reduce duplication.

## 3. Component/Subcomponent Structure

- Not applicable in this directory (no React components).

## 4. Code Duplication

- **Duplication between multiFileManager.ts and unifiedFileManager.ts:**
  - Both have similar logic for file stats, metadata, and directory traversal.
  - `getMinimalFileStats` in multiFileManager is a partial reimplementation of a private method in unifiedFileManager.
  - **Recommendation:** Extract shared file stat/metadata logic into a utility or base class.
- **Helper Functions:**
  - Functions like `extractTopLevelKey`, `setNestedValue`, and `serializeData` in multiFileManager could be generic utilities.
  - Similar YAML/JSON parsing logic appears in multiple files (parseAndWriteDataFile.ts, multiFileMapper.ts, etc.).
  - **Recommendation:** Centralize YAML/JSON parsing and path utilities.

## 5. Test Files

- All test files are under 200 lines and focused.
- No major duplication or bloat detected in tests.

## 6. Utility Directory

- Only two files: `index.ts` (utility function for extracting copy data) and `README.md`.
- No bloat or duplication.

## 7. Miscellaneous

- Some files have similar logic for loading/parsing YAML/JSON (parseAndWriteDataFile.ts, multiFileMapper.ts, ymlToJson.ts).
- **Recommendation:** Consider a single utility for YAML/JSON file operations.

## Summary Table

| File | Lines | Bloat | Types Inline | Duplication | Recommendation |
| --- | --- | --- | --- | --- | --- |
| multiFileManager.ts | 700 | YES | YES | YES | Split, move types, dedupe |
| unifiedFileManager.ts | 630 | YES | YES | YES | Split, move types, dedupe |
| All other files | <200 | NO | Some | Some | Move types/utilities as above |

## Actionable Recommendations

1. **Split large files**: Break up multiFileManager.ts and unifiedFileManager.ts.
2. **Move types**: Relocate all interface/type definitions to `/types`.
3. **Deduplicate logic**: Extract shared file stat, metadata, and YAML/JSON parsing logic.
4. **Centralize utilities**: Create a single utility for YAML/JSON file operations.
5. **Review for further bloat**: As the codebase grows, keep files under 200 lines unless absolutely necessary.

---

Great job!
