# TASK3_SPLIT.md

## Goal

Refactor `lib/multiFileManager/multiFileManager.ts` into smaller, focused files. Each sub-file should encapsulate a distinct responsibility or logical grouping, improving maintainability and clarity.

---

## Recommended File Splits

### 1. **MultiFileManager Main Class**

- **File:** `MultiFileManager.ts`
- **Contents:** The main class definition, with only imports and method stubs. Each method’s implementation is imported from sub-files.
- **Why:** Keeps the class interface clear and readable.

### 2. **Directory Loading & Merging**

- **File:** `loadDirectory.ts`
- **Contents:** Implementation of `loadDirectory` and any helpers for merging data from directories.
- **Why:** Directory loading and merging logic is a core, isolated responsibility.

### 3. **Updating Data Paths**

- **File:** `updatePath.ts`
- **Contents:** Implementation of `updatePath`, including logic for finding/creating files and updating YAML paths.
- **Why:** Updating data is a distinct, complex operation.

### 4. **Directory Listing**

- **File:** `listDirectoryFiles.ts`
- **Contents:** Implementation of `listDirectoryFiles` and `listDirectoryFilesRecursive`.
- **Why:** File listing (flat and recursive) is a self-contained concern.

### 5. **Hierarchy & Tree Building**

- **File:** `hierarchy.ts`
- **Contents:** `getHierarchy`, `buildDirectoryTree`, and `analyzeSectionSources`.
- **Why:** Directory hierarchy and tree analysis are related and can be grouped.

### 6. **File Utilities**

- **File:** `fileUtils.ts`
- **Contents:** Utility methods:
  - `isSectionSpecificFile`
  - `serializeData`
  - `extractTopLevelKey`
  - `setNestedValue`
  - `getMinimalFileStats`
- **Why:** These are stateless helpers used by multiple methods.

### 7. **Directory and File Operations**

- **File:** `directoryOps.ts`
- **Contents:** Methods for:
  - `createDirectory`
  - `splitSectionToFile`
  - `deleteFile`
- **Why:** These are direct file/directory manipulations, separate from data logic.

---

## Example Structure

```
lib/multiFileManager/
  MultiFileManager.ts         # Main class, imports all method implementations
  loadDirectory.ts            # loadDirectory logic
  updatePath.ts               # updatePath logic
  listDirectoryFiles.ts       # listDirectoryFiles, listDirectoryFilesRecursive
  hierarchy.ts                # getHierarchy, buildDirectoryTree, analyzeSectionSources
  fileUtils.ts                # isSectionSpecificFile, serializeData, etc.
  directoryOps.ts             # createDirectory, splitSectionToFile, deleteFile
```

---

## Notes

- Types should remain in `multiFileManager.types.ts` (already separated).
- Each sub-file should export its function(s) for use in the main class.
- This split will make testing, maintenance, and onboarding easier.

---

Let me know if you want to proceed with the actual code split or need further details on any part!
