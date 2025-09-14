for all the situations in api/fs I now need frontend functions that will interact with the backend

These utiltiy functions will go in ./lib/utility/

These utility functions will cover the interactions of the frontend with the api/fs structure being able to create read update delete resume files

being able to clone resume files (clones into datestamped folder) being able to generate new resumes off existing ones (generates new folder eg for a role like `front-end`)

---

## Core File Operations

### File Management

- **List all resume files** - Get complete directory structure with main files and resumes subdirectory
- **Read resume data** - Load YAML resume data for editing/viewing
- **Save resume changes** - Write updated resume data back to file with diff tracking
- **Delete resume with backup** - Remove resume file while creating backup for recovery
- **Duplicate resume** - Copy existing resume to new file with confirmation for overwrites

### File Organization

- **Move/rename resume** - Change resume file location or name within the system
- **Create resume from template** - Generate new resume using existing one as base template
- **Bulk operations** - Select multiple resumes for batch copy/move/delete operations

## Resume Workflow Operations

### Version Management

- **Clone resume with timestamp** - Create timestamped copy for version tracking
- **Create role-specific variant** - Generate resume variant for specific job type (e.g., "frontend", "backend")
- **Restore from backup** - Recover deleted resume from backup files in diffs folder
- **Compare resume versions** - View differences between current and previous versions

### Career Progression

- **Generate experience level variants** - Create junior/mid/senior versions of same resume
- **Industry-specific adaptations** - Generate resume variants for different industries
- **Skill-focused versions** - Create variants emphasizing different skill sets
- **Company-tailored resumes** - Generate customized versions for specific companies

## Content Management

### Data Manipulation

- **Extract common sections** - Identify and reuse common resume sections across variants
- **Merge resume data** - Combine sections from multiple resumes into new version
- **Bulk update contact info** - Update personal details across all resume variants
- **Sync shared sections** - Keep common sections synchronized across related resumes

### Content Organization

- **Tag resume variants** - Add metadata tags for easy categorization and search
- **Archive old versions** - Move outdated resumes to archive without deletion
- **Search resume content** - Find resumes containing specific skills, companies, or keywords
- **Filter by criteria** - Display resumes matching specific tags, dates, or content

## Quality Assurance

### Validation & Preview

- **Validate resume data** - Check for required fields and data consistency
- **Preview resume formats** - Generate PDF/HTML previews before finalizing
- **Spell check content** - Validate text content for spelling and grammar
- **Format consistency check** - Ensure all variants follow same formatting standards

### Error Handling

- **Recover unsaved changes** - Auto-save and recovery for interrupted editing sessions
- **Handle file conflicts** - Resolve conflicts when multiple edits occur simultaneously
- **Validate file integrity** - Check YAML syntax and data structure validity
- **Backup verification** - Ensure backups are created successfully and recoverable
