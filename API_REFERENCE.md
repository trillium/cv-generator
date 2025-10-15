# API Routes Reference

## Overview

Complete API structure for CV Generator using UnifiedFileManager.

## Base URL

All routes are prefixed with `/api`

---

## File Management Routes

### List Files

**GET** `/api/files/list`

List all YAML files in the PII directory with optional filtering.

**Query Parameters:**

- `type` (optional): Filter by file type (`resume`, `linkedin`, `other`)
- `tags` (optional): Comma-separated list of tags
- `search` (optional): Search in filename, description, or tags

**Response:**

```json
{
  "success": true,
  "files": [
    {
      "path": "data.yml",
      "name": "data.yml",
      "type": "resume",
      "size": 12345,
      "modified": "2025-10-06T...",
      "created": "2025-01-01T...",
      "hasUnsavedChanges": false,
      "tags": ["senior", "fullstack"],
      "description": "Main resume",
      "versions": 5,
      "lastEditedBy": "user",
      "role": "Senior Software Engineer"
    }
  ]
}
```

---

### Read File

**GET** `/api/files/{path}`

Read file content and metadata.

**Response:**

```json
{
  "success": true,
  "content": "# YAML content here...",
  "metadata": {
    /* FileMetadata object */
  },
  "versions": [
    /* Version[] */
  ],
  "hasUnsavedChanges": false
}
```

---

### Save File

**POST** `/api/files/{path}`

Save or create a file.

**Body:**

```json
{
  "content": "# YAML content",
  "commit": false,
  "message": "Optional commit message",
  "tags": ["optional", "tags"]
}
```

**Response:**

```json
{
  "success": true,
  "saved": true,
  "backupCreated": "backups/data.2025-10-06T12-00-00-000Z.yml",
  "changelogEntry": {
    /* ChangelogEntry */
  }
}
```

---

### Delete File

**DELETE** `/api/files/{path}`

Delete a file (creates backup automatically).

**Response:**

```json
{
  "success": true
}
```

---

### Commit Changes

**PUT** `/api/files/{path}/commit`

Commit temporary changes to main file.

**Body:**

```json
{
  "message": "Optional commit message"
}
```

**Response:**

```json
{
  "success": true,
  "saved": true,
  "backupCreated": "backups/data.2025-10-06T12-00-00-000Z.yml",
  "changelogEntry": {
    /* ChangelogEntry */
  }
}
```

---

### Discard Changes

**DELETE** `/api/files/{path}/discard`

Discard temporary changes.

**Response:**

```json
{
  "success": true
}
```

---

### Duplicate File

**POST** `/api/files/{path}/duplicate`

Create a copy of a file.

**Body:**

```json
{
  "name": "new-name.yml",
  "suffix": "_copy",
  "autoIncrement": true
}
```

**Response:**

```json
{
  "success": true,
  "newPath": "data_copy.yml",
  "suggestedName": "data_copy.yml"
}
```

---

### Restore Version

**POST** `/api/files/{path}/restore`

Restore file from a backup version.

**Body:**

```json
{
  "version": "backups/data.2025-10-06T12-00-00-000Z.yml"
}
```

**Response:**

```json
{
  "success": true
}
```

---

### Get Version History

**GET** `/api/files/{path}/versions`

Get list of all backup versions for a file.

**Response:**

```json
{
  "success": true,
  "versions": [
    {
      "timestamp": "2025-10-06T12:00:00.000Z",
      "backupPath": "backups/data.2025-10-06T12-00-00-000Z.yml",
      "changelogEntry": {
        /* ChangelogEntry */
      },
      "diffAvailable": true,
      "size": 12345
    }
  ]
}
```

---

### Get Diff

**GET** `/api/files/{path}/diff?from={from}&to={to}`

Get diff between two versions.

**Query Parameters:**

- `from`: Version path or "current"
- `to`: Version path or "current"

**Response:**

```json
{
  "success": true,
  "diff": "--- a/data.yml\n+++ b/data.yml\n...",
  "stats": {
    "additions": 5,
    "deletions": 3,
    "changes": 8
  }
}
```

---

## PDF Generation Route

### Trigger PDF Build

**POST** `/api/pdf`

Trigger PDF generation in background.

**Response:**

```json
{
  "message": "PDF build triggered via pnpm pdf"
}
```

**Status:** 202 Accepted (async operation)

---

## Type Definitions

### FileMetadata

```typescript
interface FileMetadata {
  path: string;
  name: string;
  type: "resume" | "linkedin" | "other";
  size: number;
  modified: Date;
  created: Date;
  hasUnsavedChanges: boolean;
  tags: string[];
  description?: string;
  versions: number;
  lastEditedBy: string;
  role?: string;
  resumeMetadata?: Record<string, unknown>;
}
```

### Version

```typescript
interface Version {
  timestamp: Date;
  backupPath: string;
  changelogEntry: ChangelogEntry;
  diffAvailable: boolean;
  size: number;
}
```

### ChangelogEntry

```typescript
interface ChangelogEntry {
  timestamp: string;
  action: string;
  file: string;
  message?: string;
  backup?: string;
}
```

### Diff

```typescript
interface Diff {
  diff: string;
  stats: {
    additions: number;
    deletions: number;
    changes: number;
  };
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:

- `400` - Bad Request (missing required parameters)
- `500` - Internal Server Error (file system errors, YAML parsing errors, etc.)
- `202` - Accepted (for async operations like PDF generation)

---

## File Workflow

### Editing Flow

1. **List files**: `GET /api/files/list`
2. **Load file**: `GET /api/files/data.yml`
3. **Save draft**: `POST /api/files/data.yml` with `commit: false`
4. **Commit**: `PUT /api/files/data.yml/commit`

### Or discard:

3. **Discard**: `DELETE /api/files/data.yml/discard`

### Version Control

1. **View history**: `GET /api/files/data.yml/versions`
2. **Compare versions**: `GET /api/files/data.yml/diff?from=backups/old.yml&to=current`
3. **Restore**: `POST /api/files/data.yml/restore` with version path

---

## Notes

- All file paths are relative to `PII_PATH` environment variable
- Backups are stored in `PII_PATH/backups/`
- Metadata is stored as `.meta.json` files alongside YAML files
- Changelog is stored in `PII_PATH/changelog.json`
- Temporary files use `.temp` suffix (e.g., `data.temp.yml`)
