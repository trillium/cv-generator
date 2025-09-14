# /api/fs - File System API Plan

## Goal

Minimal file system operations for updating files in the PII directory structure.

## Existing Routes (Reuse)

### `/api/fs` (Main Route)

- **GET** - List all files in directory + resumes/ subdirectory ✅
- **POST** - Write JSON as YAML file with diff tracking ✅

### `/api/fs/get-files`

- **POST** - Read multiple files, parse YAML→JSON ✅

## Needed Routes (Minimal)

### `/api/fs/delete`

- **DELETE** - Remove a file (with backup to diffs/)
- Reuse: writeFile diff logic for backup

### `/api/fs/copy`

- **POST** - Copy file from source to destination
- Reuse: get-files/readFiles + writeFile

### `/api/fs/move`

- **POST** - Move/rename file
- Reuse: copy + delete logic

## Core Operations Covered

1. **List** files → `/api/fs` GET
2. **Read** files → `/api/fs/get-files` POST
3. **Write** files → `/api/fs` POST
4. **Delete** files → `/api/fs/delete` DELETE
5. **Copy** files → `/api/fs/copy` POST
6. **Move** files → `/api/fs/move` POST

## Implementation Strategy

- Keep routes thin (HTTP handling only)
- Extract utilities for delete, copy, move operations
- Reuse existing getFiles.ts, writeFile.ts, readFiles.ts
- All operations work within PII_PATH by default
- Maintain diff/backup functionality across operations

## File Structure

```
/api/fs/
├── route.ts           # GET/POST (list/write)
├── get-files/route.ts # POST (read multiple)
├── delete/route.ts    # DELETE (remove with backup)
├── copy/route.ts      # POST (copy file)
├── move/route.ts      # POST (move/rename)
├── getFiles.ts        # ✅ existing
├── writeFile.ts       # ✅ existing
├── deleteFile.ts      # new utility
├── copyFile.ts        # new utility
└── moveFile.ts        # new utility
```

This covers all essential file operations while staying minimal and reusing existing code.
