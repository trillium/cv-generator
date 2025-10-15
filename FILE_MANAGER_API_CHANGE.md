# Migrating File Manager to Directory-Based API

## Overview

The file manager previously interacted with individual YAML files using file-based API endpoints. With the new multi-file/directory-based API, all file operations should be performed via directory endpoints, enabling atomic updates, better consistency, and support for multi-file resumes.

---

## Motivation

- **Atomic updates:** Directory API allows updating multiple files/sections in a single operation.
- **Consistency:** All resume data is managed as a directory, not as isolated files.
- **Scalability:** Supports complex resume structures (multiple YAMLs, metadata, etc).
- **Future-proofing:** Enables features like versioning, bulk operations, and improved error handling.

---

## Old API (File-Based)

- **Read file:** `GET /api/files/[path]`
- **Write file:** `POST /api/files/[path]`
- **Delete file:** `DELETE /api/files/[path]`
- **List files:** `GET /api/files/list?dir=...`

### Example

```js
// Old: Load a file
fetch("/api/files/resume.yml");
```

---

## New API (Directory-Based)

- **List files in directory:** `GET /api/directory/files?path=DIR_PATH`
- **Load directory (aggregate data):** `GET /api/directory/load?path=DIR_PATH`
- **Update YAML path in directory:** `POST /api/directory/update`
  - Body: `{ directoryPath, yamlPath, value, commit, message, tags }`
- **Get directory hierarchy:** `GET /api/directory/hierarchy?path=DIR_PATH`

### Example

```js
// New: Load all data for a directory
fetch("/api/directory/load?path=base");

// New: Update a field in a directory
fetch("/api/directory/update", {
  method: "POST",
  body: JSON.stringify({
    directoryPath: "base",
    yamlPath: "workExperience.0.position",
    value: "Senior Developer",
    commit: true,
    message: "Update position",
    tags: ["work", "edit"],
  }),
});
```

---

## What Needs to Change in the File Manager

1. **Replace all file-based API calls** with directory-based endpoints.

   - Use `/api/directory/files` to list files.
   - Use `/api/directory/load` to load all data for a directory.
   - Use `/api/directory/update` to update any YAML path in the directory.

2. **Update state management:**

   - Instead of tracking a single file, track the current directory and its files/sections.
   - When editing, update the relevant YAML path via the directory API, not by writing the whole file.

3. **UI/UX:**

   - File browser should show files in the current directory (using `/api/directory/files`).
   - Editing a field should trigger a directory update, not a file save.

4. **Versioning, duplication, and restore:**
   - These may require new endpoints or adaptation to work at the directory level.

---

## Migration/Compatibility Notes

- **Legacy support:** If you need to support both APIs during migration, abstract API calls behind a manager that can switch based on mode.
- **Testing:** Ensure all file operations (read, write, delete, list) are tested against the new endpoints.
- **Error handling:** Directory API returns richer error objects; update UI to display these.

---

## Summary Table

| Operation | Old API (file) | New API (directory) |
| --- | --- | --- |
| List files | `/api/files/list?dir=...` | `/api/directory/files?path=...` |
| Read data | `/api/files/[path]` | `/api/directory/load?path=...` |
| Write/update | `/api/files/[path]` (POST) | `/api/directory/update` (POST) |
| Delete | `/api/files/[path]` (DELETE) | (TBD: likely directory-level op) |
| Hierarchy | N/A | `/api/directory/hierarchy?path=...` |

---

## Detailed Migration Steps

### Step 1: Update FileManagerContext Types

**File:** `src/contexts/FileManagerContext.tsx`

**Changes:**

- Add `currentDirectory: string | null` to track active directory
- Add `directoryMetadata: DirectoryMetadata | null` for directory info
- Add `sources: Record<string, string>` to track which file contains each section
- Change `currentFile` to track file within current directory context
- Update `FileMetadata` type to include directory context

**New interface additions:**

```ts
interface DirectoryMetadata {
  directoryPath: string;
  loadedDirectories: string[];
  filesLoaded: string[];
  hasUnsavedChanges: boolean;
}

interface FileManagerContextType {
  // ... existing fields
  currentDirectory: string | null;
  directoryMetadata: DirectoryMetadata | null;
  sources: Record<string, string>;
  // ... rest
}
```

### Step 2: Replace `refreshFiles` Method

**Current:**

```ts
const response = await fetch(`/api/files/list?${params}`);
```

**New:**

```ts
// List all available directories first
const response = await fetch(
  `/api/directory/files?path=${currentDirectory || "base"}`,
);
// Response includes DirectoryFileInfo[] with sections, format, metadata
```

**Changes:**

- Replace `/api/files/list` with `/api/directory/files`
- Update response handling to work with `DirectoryFileInfo[]` structure
- Store directory context alongside file list

### Step 3: Replace `loadFile` Method with `loadDirectory`

**Current:**

```ts
const response = await fetch(`/api/files/${path}`);
// Returns: { metadata, content, hasUnsavedChanges }
```

**New:**

```ts
const response = await fetch(`/api/directory/load?path=${dirPath}`);
// Returns: { data, sources, metadata }
```

**Changes:**

- Rename to `loadDirectory(dirPath: string)`
- Update state to store `directoryMetadata`, `sources`, and aggregated `data`
- Parse `data` (CVData) instead of raw YAML content
- Set `currentDirectory` state

### Step 4: Replace `saveFile` Method with `updatePath`

**Current:**

```ts
const response = await fetch(`/api/files/${currentFile.path}`, {
  method: "POST",
  body: JSON.stringify({ content, commit, message }),
});
```

**New:**

```ts
const response = await fetch(`/api/directory/update`, {
  method: "POST",
  body: JSON.stringify({
    directoryPath: currentDirectory,
    yamlPath: "workExperience.0.position", // example path
    value: newValue,
    commit,
    message,
    tags,
  }),
});
// Returns: UpdateResult with { success, updatedFile, section, backup, diff, changelogEntry }
```

**Changes:**

- Replace whole-file saves with targeted YAML path updates
- Instead of passing entire content, pass specific `yamlPath` and `value`
- Response includes which file was updated (`updatedFile`) and affected section
- Update UI to trigger `updatePath` for individual field changes

### Step 5: Update `updateContent` Method

**Current:**

```ts
const updateContent = useCallback((newContent: string) => {
  setContent(newContent);
  setHasUnsavedChanges(true);
  // Parse YAML...
}, []);
```

**New:**

```ts
// Replace with updateField for granular updates
const updateField = useCallback(
  (yamlPath: string, value: any) => {
    // Optimistically update local data
    const newData = { ...parsedData };
    set(newData, yamlPath, value); // using lodash.set or similar
    setParsedData(newData);
    setHasUnsavedChanges(true);
  },
  [parsedData],
);
```

**Changes:**

- Move away from editing raw YAML content in textarea
- Implement field-level updates using YAML paths
- Optionally keep textarea for advanced users, but default to field editing

### Step 6: Refactor File Browser UI

**File:** `app/file-manager/FileManagerFeature.tsx`

**Changes:**

- Update FileBrowser to show directories first, then files within selected directory
- Display directory hierarchy using `/api/directory/hierarchy?path=${dirPath}`
- Show which sections each file provides (from `DirectoryFileInfo.sections`)
- Add breadcrumb navigation for directory traversal

**Example UI flow:**

1. User selects directory (e.g., `base/google`)
2. Load directory: `GET /api/directory/load?path=base/google`
3. Display aggregated data with source annotations
4. Show list of files in directory with their sections
5. User edits field → triggers `POST /api/directory/update` with yamlPath

### Step 7: Implement Directory-Aware File Operations

**File operations to update:**

| Operation | Old Implementation | New Implementation |
| --- | --- | --- |
| **Duplicate** | `POST /api/files/${path}/duplicate` | Create new directory or copy file within directory context |
| **Delete** | `DELETE /api/files/${path}` | Delete file from directory, update directory metadata |
| **Create** | `POST /api/files/${path}` | Create file in directory context with section specification |
| **Restore** | `POST /api/files/${path}/restore` | Restore from backup within directory |

**New method signatures:**

```ts
duplicateFile: (dirPath: string, fileName: string, newName: string) =>
  Promise<string>;
deleteFile: (dirPath: string, fileName: string) => Promise<void>;
createFile: (
  dirPath: string,
  fileName: string,
  sections: string[],
  content: string,
) => Promise<void>;
```

### Step 8: Update Version History

**Current:**

```ts
const response = await fetch(`/api/files/${path}/versions`);
```

**New approach:**

- Version history is now per-directory, tracked via changelog
- Use `directoryMetadata.filesLoaded` to show which files have versions
- Each update creates backup with `UpdateResult.backup` info
- Display changelog entries from `UpdateResult.changelogEntry`

**Implementation:**

```ts
// May need new endpoint: /api/directory/changelog?path=dirPath
// Or extend /api/directory/load to include recent changes
```

### Step 9: Refactor Content Editor

**Current:**

```tsx
<textarea value={content} onChange={(e) => updateContent(e.target.value)} />
```

**New:**

```tsx
// Option A: Keep textarea but make it per-file within directory
<textarea
  value={yaml.dump(parsedData)}
  onChange={(e) => {
    // Parse and update via directory API
    const parsed = yaml.load(e.target.value);
    updateDirectory(currentDirectory, parsed);
  }}
/>

// Option B: Replace with field-based editor (recommended)
<FieldEditor
  data={parsedData}
  sources={sources}
  onFieldChange={(yamlPath, value) => {
    updateField(yamlPath, value);
  }}
/>
```

### Step 10: Add Directory Selection UI

**New UI component needed:**

```tsx
<DirectorySelector
  currentDirectory={currentDirectory}
  onSelectDirectory={(dirPath) => loadDirectory(dirPath)}
  hierarchy={directoryHierarchy}
/>
```

**Features:**

- Show directory tree structure
- Display inherited sections from parent directories
- Indicate which files override parent data
- Allow creating new directories

### Step 11: Update Error Handling

**New error structure from directory API:**

```ts
{
  success: false,
  error: string,
  details?: {
    file?: string,
    section?: string,
    yamlPath?: string,
    validationErrors?: string[]
  }
}
```

**Update error display to show:**

- Which file caused the error
- Which section/path failed
- Validation errors for invalid data

### Step 12: Testing Checklist

- [ ] Load directory and verify data merging
- [ ] Update a field and verify correct file is modified
- [ ] Verify parent directory data is inherited
- [ ] Test commit/save workflow
- [ ] Verify backups are created on updates
- [ ] Test file listing in directory
- [ ] Test directory hierarchy display
- [ ] Verify error messages are helpful
- [ ] Test undo/discard changes at directory level
- [ ] Verify multi-file updates work atomically

## Implementation Order

1. ✅ Create directory API endpoints (`/api/directory/*`)
2. ⬜ Update FileManagerContext types and state
3. ⬜ Replace `refreshFiles` → use `/api/directory/files`
4. ⬜ Replace `loadFile` → use `/api/directory/load`
5. ⬜ Replace `saveFile` → use `/api/directory/update`
6. ⬜ Update FileManagerFeature UI for directory context
7. ⬜ Add directory selector/browser
8. ⬜ Implement field-level editing
9. ⬜ Update file operations (duplicate, delete, create)
10. ⬜ Add version history for directory
11. ⬜ Test and validate migration
12. ⬜ Remove old `/api/files/*` endpoints

## See Also

- `lib/multiFileManager.ts` for directory logic
- `app/api/directory/*` for endpoint implementations
- `app/file-manager/page.tsx` for the current file manager UI
- `src/contexts/FileManagerContext.tsx` for context that needs updating
