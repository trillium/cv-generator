# Frontend Utility Functions

## File Manager (`lib/utility/fileManager.ts`)

Core file management utilities for interacting with the CV generator backend API.

### Functions

#### `listAllResumeFiles()`

**Purpose**: Get complete directory structure with main files and resumes subdirectory

**Returns**: `ApiResponse<FileListResponse>`

- `allFiles`: Array of all file paths
- `mainDirFiles`: Count of files in main directory
- `resumeFiles`: Count of files in resumes subdirectory
- `totalFiles`: Total file count

**Example**:

```typescript
const result = await listAllResumeFiles();
if (result.success) {
  console.log(`Found ${result.data.totalFiles} files`);
}
```

#### `readResumeData(filePaths: string[])`

**Purpose**: Load YAML resume data for editing/viewing

**Parameters**:

- `filePaths`: Array of file paths to read

**Returns**: `ApiResponse<Record<string, CVData>>`

- Object with file paths as keys and parsed resume data as values

**Example**:

```typescript
const result = await readResumeData(["data.yml", "frontend.yml"]);
if (result.success) {
  const resumeData = result.data["data.yml"];
}
```

#### `saveResumeChanges(filePath, resumeData, options?)`

**Purpose**: Write updated resume data back to file with diff tracking

**Parameters**:

- `filePath`: Target file path
- `resumeData`: CVData object to save
- `options`: Optional configuration
  - `createDiff`: Whether to create diff file (default: true)
  - `baseDirectory`: Custom base directory

**Returns**: `ApiResponse` with file info and diff status

**Example**:

```typescript
const result = await saveResumeChanges("data.yml", updatedData, {
  createDiff: true,
});
```

#### `deleteResumeWithBackup(filePath, options?)`

**Purpose**: Remove resume file while creating backup for recovery

**Parameters**:

- `filePath`: File to delete
- `options`: Optional configuration
  - `createBackup`: Whether to create backup (default: true)
  - `baseDirectory`: Custom base directory

**Returns**: `ApiResponse` with deletion status and backup info

**Example**:

```typescript
const result = await deleteResumeWithBackup("old-resume.yml");
if (result.success && result.data.backupCreated) {
  console.log("Backup created successfully");
}
```

#### `duplicateResume(sourcePath, destinationPath, options?)`

**Purpose**: Copy existing resume to new file with confirmation for overwrites

**Parameters**:

- `sourcePath`: Source file to copy
- `destinationPath`: Destination file path
- `options`: Optional configuration
  - `overwrite`: Allow overwriting existing files (default: false)
  - `baseDirectory`: Custom base directory

**Returns**: `ApiResponse` with copy operation details

**Example**:

```typescript
const result = await duplicateResume("data.yml", "data-backup.yml", {
  overwrite: false,
});
```

### Error Handling

All functions return an `ApiResponse<T>` object with:

- `success`: boolean indicating operation success
- `data`: The result data (when successful)
- `error`: Error message (when failed)

### Usage Patterns

```typescript
import {
  listAllResumeFiles,
  readResumeData,
  saveResumeChanges,
} from "@/lib/utility";

// Common workflow
async function loadAndEditResume() {
  // 1. List available files
  const fileList = await listAllResumeFiles();

  // 2. Read specific resume
  const resumeData = await readResumeData(["data.yml"]);

  // 3. Modify data
  if (resumeData.success) {
    const data = resumeData.data["data.yml"];
    data.info.firstName = "Updated Name";

    // 4. Save changes
    await saveResumeChanges("data.yml", data);
  }
}
```

## Testing

Comprehensive test suite in `fileManager.test.ts` covers:

- ✅ Successful operations for all functions
- ✅ Error handling (network, HTTP, validation errors)
- ✅ Options and parameter variations
- ✅ Integration workflow scenarios
- ✅ Mock fetch API responses

Run tests with: `pnpm test lib/utility`
