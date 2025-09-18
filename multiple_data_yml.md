# Multiple Resume Versions Migration Plan - CANCELLED

## Status: CANCELLED (December 2024)

**IMPORTANT**: This migration plan has been cancelled. The multi-resume system was determined to be test-only functionality with no production usage and has been completely removed from the codebase.

## Original Plan (For Reference)

This plan outlined the migration from a single `data.yml` file system to a hierarchical multi-resume storage system that supports multiple versions targeting different job types and companies.

---

## Original Current System

The current system uses:

- **PII_PATH** environment variable pointing to a single directory
- Single `data.yml` file as the primary data source
- `data.temp.yml` for temporary changes
- `changelog.json` for tracking modifications
- `FileSystemManager` class handling file operations

## Proposed New Structure

### Directory Hierarchy

```
PII_PATH/
├── data.yml                    # Default/base resume (existing)
├── data.temp.yml              # Temporary changes (existing)
├── changelog.json             # Global changelog (existing)
│                              # Remove existing backup files
├── resumes/                   # NEW: Multi-resume structure
│   ├── software-engineer/     # Job position type
│   │   ├── default/           # Default version for this position
│   │   │   └── data.yml
│   │   ├── google/            # Company-specific versions
│   │   │   ├── 2025-01-15/    # Date-based versions
│   │   │   │   ├── data.yml
│   │   │   │   └── metadata.json
│   │   │   └── 2025-02-20/
│   │   │       ├── data.yml
│   │   │       └── metadata.json
│   │   └── microsoft/
│   │       └── 2025-01-20/
│   │           ├── data.yml
│   │           └── metadata.json
│   ├── frontend-developer/
│   │   ├── default/
│   │   │   └── data.yml
│   │   └── meta/
│   │       └── 2025-02-01/
│   │           ├── data.yml
│   │           └── metadata.json
│   └── backend-developer/
│       └── default/
│           └── data.yml
│   └── backend-developer-python/
│       └── default/
│           └── data.yml
└── resume-index.json          # NEW: Index of all resume versions
```

### Metadata Structure

Each versioned resume will have a `metadata.json` file:

```json
{
  "id": "software-engineer-google-2025-01-15",
  "position": "software-engineer",
  "company": "google",
  "dateCreated": "2025-01-15T10:30:00Z",
  "lastModified": "2025-01-16T14:22:00Z",
  "basedOn": "software-engineer-default",
  "status": "active",
  "description": "Tailored for Google SWE L4 position",
  "tags": ["backend", "distributed-systems", "golang"],
  "applicationDeadline": "2025-02-01",
  "jobUrl": "https://careers.google.com/jobs/...",
  "notes": "Emphasized distributed systems experience"
}
```

### Resume Index Structure

The `resume-index.json` will provide quick access to all versions:

```json
{
  "lastUpdated": "2025-01-16T14:22:00Z",
  "default": "data.yml",
  "positions": {
    "software-engineer": {
      "default": "resumes/software-engineer/default/data.yml",
      "companies": {
        "google": [
          {
            "date": "2025-01-15",
            "path": "resumes/software-engineer/google/2025-01-15/data.yml",
            "lastModified": "2025-01-16T14:22:00Z",
            "status": "active"
          }
        ],
        "microsoft": [
          {
            "date": "2025-01-20",
            "path": "resumes/software-engineer/microsoft/2025-01-20/data.yml",
            "lastModified": "2025-01-20T16:45:00Z",
            "status": "submitted"
          }
        ]
      }
    },
    "product-manager": {
      "default": "resumes/product-manager/default/data.yml",
      "companies": {}
    }
  }
}
```

## Migration Steps

### Phase 1: Core Infrastructure

1. **Create New Utility Functions**

   - `lib/multiResumeManager.ts` - Core manager for multi-resume operations
   - `lib/resumeIndexManager.ts` - Manages the resume index
   - `lib/resumeNavigator.ts` - Navigation and discovery utilities
   - `lib/resumeMetadata.ts` - Metadata handling utilities

2. **Extend Existing Classes**

   - Update `FileSystemManager` to handle multi-resume paths
   - Extend `getPiiPath` function to support resume selection
   - Add resume context to existing functions

3. **Create Type Definitions**

   ```typescript
   interface ResumeVersion {
     id: string;
     position: string;
     company?: string;
     date: string;
     path: string;
     metadata: ResumeMetadata;
   }

   interface ResumeMetadata {
     id: string;
     position: string;
     company?: string;
     dateCreated: string;
     lastModified: string;
     basedOn?: string;
     status: "draft" | "active" | "submitted" | "archived";
     description?: string;
     tags?: string[];
     applicationDeadline?: string;
     jobUrl?: string;
     notes?: string;
   }

   interface ResumeIndex {
     lastUpdated: string;
     default: string;
     positions: Record<string, PositionGroup>;
   }

   interface PositionGroup {
     default: string;
     companies: Record<string, CompanyVersion[]>;
   }

   interface CompanyVersion {
     date: string;
     path: string;
     lastModified: string;
     status: string;
   }
   ```

### Phase 2: Migration Tools

1. **SIPPED**

2. **Migration Process**
   - Create new directory structure
   - Copy existing `data.yml` to `resumes/default/default/data.yml`
   - Initialize `resume-index.json`
   - Preserve all existing backup files and changelog

### Phase 3: UI/UX Components

1. **Resume Navigator Component**

   - Browse positions, companies, and dates
   - Show last modified dates
   - Filter and search capabilities
   - Quick actions (copy, create new version)

2. **Resume Creator Component**

   - Start from existing resume (dropdown selection)
   - Specify position type, company, and description
   - Auto-generate folder structure and metadata

3. **Resume Selector Component**
   - Context switcher for current active resume
   - Show current resume info in header
   - Quick switch between recent resumes

## Implementation Priority

### High Priority (MVP)

- [ ] Core multi-resume manager infrastructure
- [ ] Resume index management
- [ ] Basic navigation API
- [ ] Simple resume selector in UI

## API Changes

### Current API Usage

```typescript
// Current usage
const yamlData = getYamlData(); // Always reads from data.yml
```

### New API Usage

```typescript
// New usage with context
const yamlData = getYamlData(); // No args returns everything
const yamlData = getYamlData({
  position: "software-engineer",
  company: "google",
  date: "2025-01-15",
});

// Navigation
const positions = listPositions();
const companies = listCompanies("software-engineer");
const versions = listVersions("software-engineer", "google");
const recent = getRecentlyModified(10);

// Management
const newVersion = createResumeVersion({
  basedOn: "software-engineer-default",
  position: "software-engineer",
  company: "google",
  description: "Senior SWE role",
});
```

## Backward Compatibility

- Existing `data.yml` remains functional as the default resume

## Configuration

### Environment Variables

- `MULTI_RESUME_ENABLED=true` - Enable multi-resume features
- `DEFAULT_RESUME_PATH` - Override default resume selection
- `RESUME_INDEX_FILE` - Custom index file location

## Testing Strategy

1. **Unit Tests**

   - Multi-resume manager functionality
   - Index management operations
   - Metadata handling
   - Path resolution

2. **Integration Tests**

   - File system operations
   - API compatibility
   - Error handling
