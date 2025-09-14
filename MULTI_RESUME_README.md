# Multi-Resume System

The Multi-Resume System allows you to create and manage multiple versions of your resume tailored for different positions and companies. This system maintains backward compatibility with your existing single `data.yml` file while providing powerful new organizational features.

## Features

- **Position-Based Organization**: Create resumes for different job positions (e.g., "software-engineer", "frontend-developer")
- **Company-Specific Versions**: Tailor resumes for specific companies within each position
- **Version History**: Automatic date-based versioning with metadata tracking
- **Status Management**: Track application status (draft, active, submitted, archived)
- **Deadline Tracking**: Set and monitor application deadlines
- **Rich Metadata**: Add descriptions, tags, job URLs, and notes to each version
- **Easy Navigation**: Browse and switch between resume versions with a modern UI
- **Seamless Integration**: Works with existing CV generator features

## Quick Start

1. **Initialize the system**:

   ```bash
   npm run init:multi-resume
   ```

2. **Enable multi-resume features** by adding to your `.env` file:

   ```env
   MULTI_RESUME_ENABLED=true
   NEXT_PUBLIC_MULTI_RESUME_ENABLED=true
   ```

3. **Start your development server**:

   ```bash
   npm run dev
   ```

4. **Look for the Resume Selector** in the navigation bar to create your first targeted resume.

## Directory Structure

The system creates this structure in your PII directory:

```
PII_PATH/
├── data.yml                    # Your original resume (unchanged)
├── data.temp.yml              # Temporary changes (unchanged)
├── changelog.json             # Change history (unchanged)
├── resume-index.json          # NEW: Index of all resume versions
└── resumes/                   # NEW: Multi-resume structure
    ├── software-engineer/
    │   ├── default/
    │   │   └── data.yml
    │   ├── google/
    │   │   └── 2025-09-10/
    │   │       ├── data.yml
    │   │       └── metadata.json
    │   └── microsoft/
    │       └── 2025-09-15/
    │           ├── data.yml
    │           └── metadata.json
    └── product-manager/
        └── default/
            └── data.yml
```

## Creating Resume Versions

### Using the UI

1. Click the **Resume Selector** button in the navigation
2. Click the **"+"** button to create a new resume
3. Fill in the details:
   - **Position**: Job position type (e.g., "software-engineer")
   - **Company**: Target company name (optional)
   - **Description**: Brief description of this version
   - **Based On**: Choose an existing resume to copy from
   - **Tags**: Add relevant tags for easy searching
   - **Job URL**: Link to the job posting
   - **Application Deadline**: Set reminder dates

### Using the API

Create a new resume version programmatically:

```javascript
const response = await fetch("/api/multi-resume", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "create",
    position: "software-engineer",
    company: "Google",
    description: "Senior SWE position focusing on distributed systems",
    tags: ["backend", "golang", "distributed-systems"],
    jobUrl: "https://careers.google.com/jobs/...",
    applicationDeadline: "2025-10-15",
  }),
});
```

## Navigation and Management

### Resume Navigator

- **Browse**: View all your resume versions organized by position and company
- **Filter**: Search by position, company, or keywords
- **Status Tracking**: See the current status of each application
- **Quick Actions**: Switch between versions with a single click

### Resume Selector

- **Current Context**: Always shows which resume version you're currently editing
- **Status Indicator**: Color-coded status badges (draft, active, submitted, archived)
- **Quick Switch**: Dropdown to quickly change between recent versions

## API Reference

### GET `/api/multi-resume`

**List all resume versions**:

```
GET /api/multi-resume?action=list&position=software-engineer&status=active
```

**Get specific resume version**:

```
GET /api/multi-resume?action=get&position=software-engineer&company=google&date=2025-09-10
```

**Get navigation data**:

```
GET /api/multi-resume?action=navigation
```

**Get YAML data for a context**:

```
GET /api/multi-resume?action=data&position=software-engineer&company=google
```

### POST `/api/multi-resume`

**Create new version**:

```json
{
  "action": "create",
  "position": "software-engineer",
  "company": "Google",
  "basedOn": "software-engineer-default",
  "description": "Senior SWE role",
  "tags": ["backend", "distributed-systems"],
  "applicationDeadline": "2025-10-15"
}
```

**Copy existing version**:

```json
{
  "action": "copy",
  "sourcePosition": "software-engineer",
  "sourceCompany": "google",
  "targetOptions": {
    "position": "software-engineer",
    "company": "microsoft",
    "description": "Similar role at Microsoft"
  }
}
```

**Update content**:

```json
{
  "action": "update-content",
  "position": "software-engineer",
  "company": "google",
  "content": "yaml content here..."
}
```

**Update metadata**:

```json
{
  "action": "update-metadata",
  "position": "software-engineer",
  "company": "google",
  "updates": {
    "status": "submitted",
    "notes": "Application submitted via referral"
  }
}
```

### DELETE `/api/multi-resume`

**Delete resume version**:

```
DELETE /api/multi-resume?position=software-engineer&company=google&date=2025-09-10
```

## Metadata Schema

Each resume version includes rich metadata:

```typescript
interface ResumeMetadata {
  id: string; // Unique identifier
  position: string; // Job position type
  company?: string; // Target company
  dateCreated: string; // Creation timestamp
  lastModified: string; // Last modification timestamp
  basedOn?: string; // Source resume version
  status: "draft" | "active" | "submitted" | "archived";
  description?: string; // Brief description
  tags?: string[]; // Searchable tags
  applicationDeadline?: string; // Application deadline
  jobUrl?: string; // Job posting URL
  notes?: string; // Additional notes
}
```

## Environment Variables

```env
# Enable multi-resume features
MULTI_RESUME_ENABLED=true
NEXT_PUBLIC_MULTI_RESUME_ENABLED=true

# Required: Path to your data directory
PII_PATH=/path/to/your/pii/directory

# Optional: Override default resume
DEFAULT_RESUME_PATH=data.yml

# Optional: Custom index file location
RESUME_INDEX_FILE=resume-index.json
```

## Backward Compatibility

The system is fully backward compatible:

- Your existing `data.yml` continues to work unchanged
- All existing features and workflows remain functional
- The multi-resume system is opt-in via environment variables
- Original file structure is preserved

## Migration

No migration is required! The system works alongside your existing setup:

1. Run the initialization script: `npm run init:multi-resume`
2. Enable the features in your environment
3. Start creating targeted resume versions
4. Your original `data.yml` remains as the default version

## Tips for Success

### Position Naming

Use consistent, descriptive position names:

- `software-engineer` (not `swe` or `Software Engineer`)
- `frontend-developer`
- `product-manager`
- `data-scientist`

### Company Organization

- Use official company names for consistency
- Create company-specific versions only when you need significant customization
- Use the default position version for general applications

### Status Management

- **Draft**: Work in progress
- **Active**: Ready to send, actively applying
- **Submitted**: Application has been sent
- **Archived**: Old versions or closed positions

### Tagging Strategy

Use consistent tags for easy searching:

- Technologies: `react`, `python`, `aws`
- Role types: `senior`, `lead`, `junior`
- Focus areas: `backend`, `frontend`, `fullstack`
- Industries: `fintech`, `healthcare`, `gaming`

This system transforms your resume management workflow while preserving everything that already works. Start with one targeted resume and gradually build your collection as you apply to different positions!
