# Multi-File Data System with Hierarchical Directory Loading

## Status: PLANNING (January 2025)

This document outlines the new multi-file data loading system that supports hierarchical directory structures. The system loads data from directory paths (not individual files) and merges data from all ancestor directories, allowing for flexible resume variants and data organization.

---

## Overview

The multi-file data system loads data from **directory paths** rather than individual files. When you specify a directory to load (e.g., `base/google/python/`), the system automatically:

1. Loads all data files from the root directory (`base/`)
2. Loads and merges files from each subdirectory (`base/google/`)
3. Loads and merges files from the target directory (`base/google/python/`)

**Path Resolution:** All directory paths are relative to `PII_PATH` (without leading slashes). For example:

- `base/google/` resolves to `${PII_PATH}/base/google/` using `path.join(PII_PATH, 'base/google/')`
- Paths in examples show `base/...` (relative) or `/base/...` (visual clarity for hierarchy)
- **Best practice:** Store and use relative paths like `base/google/`, join with `PII_PATH` at runtime

This allows for:

- Company-specific resume variants that inherit from base data
- Job-specific customizations within company variants
- Arbitrary nesting depth for organization
- Complete section-level replacement (no deep merging)
- Mixed file formats (YAML and JSON)

## ⚠️ Key Rules

### 1. Complete Section Replacement (Deeper Always Wins)

**Files in deeper directories completely replace sections from parent directories.**

```
/base/data.yml           → workExperience: [A, B, C]
/base/google/work.yml    → workExperience: [D]

Loading /base/google/:
Result: workExperience: [D]  ← Parent's [A, B, C] completely ignored
```

### 2. Same-Directory Conflicts = Error

**Within the same directory, if multiple files define the same section, throw an error.**

```
❌ ERROR:
/base/google/data.yml    → defines workExperience
/base/google/work.yml    → defines workExperience

✅ OK:
/base/google/info.yml    → defines info
/base/google/work.yml    → defines workExperience
```

### 3. Format Conflicts = Error

**If the same basename exists in multiple formats in the same directory, throw an error.**

This includes `.yml` and `.yaml` being treated as different extensions for the same filename.

```
❌ ERROR:
/base/google/data.yml
/base/google/data.json   ← Same basename with different extensions

❌ ERROR:
/base/google/info.yml
/base/google/info.yaml   ← Same basename (.yml and .yaml = different extensions)

❌ ERROR:
/base/google/info.yml
/base/google/info.json   ← Same basename with different extensions
```

### 4. Section-Specific File Validation

**Section-specific files must ONLY contain their designated section (CVData keys). Extra CVData keys are errors.**

```
❌ ERROR:
/base/google/work.yml contains:
  workExperience: [...]
  education: [...]         ← Invalid! work.yml can only contain workExperience
  info: {...}              ← Invalid! info is a different CVData section

✅ OK:
/base/google/work.yml contains:
  workExperience: [...]    ← Only the designated CVData section
```

**Validation focuses on CVData sections only:**

- `work.yml` must contain ONLY the `workExperience` CVData section
- `education.yml` must contain ONLY the `education` CVData section
- Empty keys, whitespace, or non-CVData keys can be safely ignored during validation
- **Any extra CVData keys in section-specific files are errors**
- The validation ensures sections don't bleed across files (e.g., `work.yml` can't have `education` data)

**Valid section mappings:**

- `work.yml` or `experience.yml` → must contain ONLY `workExperience`
- `info.yml` → must contain ONLY `info`
- `education.yml` → must contain ONLY `education`
- etc. (see Convention-Based File Naming for full list)

---

## Core Principles

### 1. Directory-Based Loading

**The system loads directory paths, not file paths.**

```typescript
// OLD (file-based):
loadYaml("/path/to/data.yml");

// NEW (directory-based):
loadFromDirectory("base/google/python/");
// Automatically loads from: base/, base/google/, base/google/python/
// (All paths are relative to PII_PATH)
```

### 2. Convention-Based File Naming

**Supported file formats:**

- YAML: `.yml`, `.yaml` (supports comments with `#`)
- JSON: `.json`

**Full data files** (can contain all sections):

- `data.{yml,yaml,json}` - Complete resume data
- `resume.{yml,yaml,json}` - Complete resume data

**Section-specific files** (named after CVData keys):

- `info.{yml,yaml,json}` → `info` section only
- `work.{yml,yaml,json}` → `workExperience` section only
- `experience.{yml,yaml,json}` → `workExperience` section only
- `projects.{yml,yaml,json}` → `projects` section only
- `education.{yml,yaml,json}` → `education` section only
- `technical.{yml,yaml,json}` → `technical` section only
- `career.{yml,yaml,json}` → `careerSummary` section only
- `header.{yml,yaml,json}` → `header` section only
- `profile.{yml,yaml,json}` → `profile` section only
- `languages.{yml,yaml,json}` → `languages` section only
- `cover-letter.{yml,yaml,json}` → `coverLetter` section only
- `metadata.{yml,yaml,json}` → `metadata` section only

### 3. Hierarchical Directory Structure

```
/base/
├── data.yml                    # Base layer - contains everything
├── google/
│   ├── experience.yml          # Overwrites experience from /base/data.yml
│   └── python/
│       └── experience.yml      # Overwrites both above
└── meta/
    └── data.yml                # Overwrites all sections from /base/data.yml
```

**Loading `base/google/python/`:**

1. Load all `.yml`/`.yaml`/`.json` files from `base/`
2. Load all `.yml`/`.yaml`/`.json` files from `base/google/` (overwrites sections)
3. Load all `.yml`/`.yaml`/`.json` files from `base/google/python/` (overwrites sections)

### 4. Priority Rules

**Priority (from lowest to highest):**

1. **Root directory files** (`/base/data.yml`)
2. **First-level subdirectory** (`/base/google/experience.yml`)
3. **Deeper directories** (`/base/google/python/experience.yml`)

**Within same directory:**

- Section-specific files override full data files
- Example: If `/base/google/data.yml` contains `info` section AND `/base/google/info.yml` exists, `info.yml` wins

**Format precedence within directory:**

- If `info.yml` and `info.json` both exist → **ERROR** (user must resolve)
- If `data.yml` and `data.json` both exist → **ERROR** (user must resolve)

---

## File Resolution Examples

### Example 1: Simple Inheritance

```
/base/
├── data.yml              # info: {...}, workExperience: [...]
└── google/
    └── experience.yml    # workExperience: [...]
```

**Loading `base/google/`:**

```yaml
info: { ... } # From base/data.yml
workExperience: [...] # From base/google/experience.yml (replaced)
```

### Example 2: Deep Nesting

```
/base/
├── data.yml              # All sections
├── google/
│   ├── experience.yml   # workExperience
│   └── python/
│       └── info.yml     # info
```

**Loading `base/google/python/`:**

```yaml
info: { ... } # From base/google/python/info.yml
workExperience: [...] # From base/google/experience.yml
education: [...] # From base/data.yml (inherited)
```

### Example 3: Section-Specific Override Within Directory

```
/base/google/
├── data.yml              # Contains: info, workExperience, education
└── info.yml              # Contains: info
```

**Loading `base/google/`:**

```yaml
info: { ... } # From base/google/info.yml (overrides data.yml)
workExperience: [...] # From base/google/data.yml
education: [...] # From base/google/data.yml
```

### Example 4: Conflict Detection (ERROR)

```
/base/google/
├── experience.yml        # workExperience: [...]
└── work.yml              # workExperience: [...]

❌ ERROR: Multiple files in /base/google/ define 'workExperience'
   - /base/google/experience.yml
   - /base/google/work.yml
```

```
/base/google/
├── info.yml              # info: {...}
└── info.json             # info: {...}

❌ ERROR: Multiple formats in /base/google/ define 'info'
   - /base/google/info.yml
   - /base/google/info.json
```

---

## Directory Structure Examples

### Example A: Base + Company Variants

```
PII_PATH/
├── data.yml                    # Legacy single-file (still supported)
├── base/
│   └── data.yml               # Base resume (all sections)
├── base/google/
│   ├── experience.yml         # Google-tailored experience
│   └── metadata.yml           # Application tracking
├── base/meta/
│   └── data.yml               # Complete Meta-specific resume
└── base/startups/
    ├── info.yml               # Different contact email
    └── experience.yml         # Startup-focused experience
```

### Example B: Company + Role Variants

```
PII_PATH/
├── base/
│   ├── data.yml               # All base data
│   ├── google/
│   │   ├── experience.yml    # General Google experience
│   │   ├── senior/
│   │   │   └── info.yml      # Senior role specifics
│   │   └── staff/
│   │       └── info.yml      # Staff role specifics
│   └── meta/
│       └── data.yml           # Meta-specific
```

### Example C: Progressive Organization

```
PII_PATH/
├── data.yml                    # Original single file (fallback)
├── base/                       # NEW: Start migrating
│   ├── data.yml               # Copy of original
│   └── faang/
│       └── experience.yml     # Just the customizations
```

---

## Technical Implementation

### 1. File Mapping Registry

```typescript
// lib/multiFileMapper.ts

const FULL_DATA_FILENAMES = ["data", "resume"];
const SECTION_KEY_TO_FILENAME: Record<string, string[]> = {
  info: ["info"],
  header: ["header"],
  careerSummary: ["career"],
  workExperience: ["work", "experience"],
  projects: ["projects"],
  profile: ["profile"],
  technical: ["technical"],
  languages: ["languages"],
  education: ["education"],
  coverLetter: ["cover-letter"],
  metadata: ["metadata"],
};

const SUPPORTED_EXTENSIONS = [".yml", ".yaml", ".json"];

interface FileEntry {
  path: string;
  sections: string[];
  format: "yaml" | "json";
}

function loadDataFile(filePath: string): Record<string, unknown> {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, "utf-8");

  if (ext === ".json") {
    return JSON.parse(content);
  }

  // .yml or .yaml
  return yaml.load(content) as Record<string, unknown>;
}
```

### 2. Directory Loading Logic

```typescript
// lib/getYamlData.ts (updated)

interface LoadOptions {
  directoryPath: string;
}

async function loadFromDirectory(dirPath: string): Promise<CVData> {
  // Get all ancestor directories (relative to PII_PATH)
  const ancestorDirs = getAncestorDirectories(dirPath);
  // e.g., ['base', 'base/google', 'base/google/python']

  let mergedData: Record<string, unknown> = {};
  const sectionSources = new Map<string, string>(); // Track where each section came from

  // Load each directory in order (parent to child)
  for (const dir of ancestorDirs) {
    const dirData = await loadSingleDirectory(dir);

    // Validate files at load time - fail fast on conflicts or invalid sections
    validateNoConflicts(dirData.files, dir);

    // Merge data (complete section replacement)
    for (const [section, value] of Object.entries(dirData.merged)) {
      mergedData[section] = value;
      sectionSources.set(section, dirData.sources[section]);
    }
  }

  // Validate the merged result
  return mergedData as CVData;
}

async function loadSingleDirectory(dirPath: string): Promise<{
  files: FileEntry[];
  merged: Record<string, unknown>;
  sources: Record<string, string>; // section -> file path
}> {
  const files: FileEntry[] = [];
  const merged: Record<string, unknown> = {};
  const sources: Record<string, string> = {};

  // Find all data files in this directory (not recursive)
  const dataFiles = findDataFilesInDirectory(dirPath);

  for (const filePath of dataFiles) {
    const data = loadDataFile(filePath);
    const sections = Object.keys(data);
    const basename = path.basename(filePath);

    // VALIDATE: Section-specific files must only contain their designated section
    const isFullDataFile = isFullDataFilename(basename);
    if (!isFullDataFile) {
      validateSectionSpecificFile(basename, sections);
    }

    files.push({
      path: filePath,
      sections,
      format: getFormat(filePath),
    });

    // Merge sections (section-specific files override full data files)
    for (const section of sections) {
      const existingSource = sources[section];
      const existingIsFullData = existingSource
        ? isFullDataFilename(path.basename(existingSource))
        : false;

      // Section-specific file always wins over full data file
      if (!existingSource || (existingIsFullData && !isFullDataFile)) {
        merged[section] = data[section];
        sources[section] = filePath;
      } else if (!existingIsFullData && isFullDataFile) {
        // Keep existing section-specific file
        continue;
      } else {
        // Both are same type (both full data or both section-specific)
        // This will be caught by validateNoConflicts
      }
    }
  }

  return { files, merged, sources };
}

function validateSectionSpecificFile(
  filename: string,
  sections: string[],
): void {
  const basename = path.basename(filename, path.extname(filename));

  // Find which CVData key this filename maps to
  let expectedSection: string | null = null;
  for (const [sectionKey, filenames] of Object.entries(
    SECTION_KEY_TO_FILENAME,
  )) {
    if (filenames.includes(basename)) {
      expectedSection = sectionKey;
      break;
    }
  }

  if (!expectedSection) {
    return; // Not a section-specific file (shouldn't reach here)
  }

  // Validate that file only contains its designated section
  if (sections.length !== 1 || sections[0] !== expectedSection) {
    throw new Error(
      `Section-specific file '${filename}' must only contain '${expectedSection}' section.\n` +
        `Found sections: [${sections.join(", ")}]`,
    );
  }
}

function validateNoConflicts(files: FileEntry[], dirPath: string): void {
  const sectionToFiles = new Map<string, string[]>();
  const fullDataFiles: string[] = [];

  for (const file of files) {
    if (isFullDataFilename(path.basename(file.path))) {
      fullDataFiles.push(file.path);
    }

    for (const section of file.sections) {
      if (!sectionToFiles.has(section)) {
        sectionToFiles.set(section, []);
      }
      sectionToFiles.get(section)!.push(file.path);
    }
  }

  // Check for conflicts
  const conflicts: string[] = [];

  for (const [section, filePaths] of sectionToFiles.entries()) {
    // Filter to section-specific files only (exclude full data files for this check)
    const sectionSpecificFiles = filePaths.filter(
      (fp) => !isFullDataFilename(path.basename(fp)),
    );

    // If multiple section-specific files define the same section, ERROR
    if (sectionSpecificFiles.length > 1) {
      conflicts.push(
        `Section '${section}' defined in multiple files:\n  ${sectionSpecificFiles.join("\n  ")}`,
      );
    }

    // If files with same basename exist in multiple formats, ERROR
    // (e.g., info.yml + info.json, or data.yml + data.json)
    const basenames = filePaths.map((fp) =>
      path.basename(fp, path.extname(fp)),
    );
    const duplicateBasenames = basenames.filter(
      (name, i, arr) => arr.indexOf(name) !== i,
    );

    if (duplicateBasenames.length > 0) {
      conflicts.push(
        `Files with same basename exist in multiple formats in '${section}':\n  ${filePaths.join("\n  ")}`,
      );
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Data conflicts detected in ${dirPath}:\n\n${conflicts.join("\n\n")}`,
    );
  }
}

function getAncestorDirectories(dirPath: string): string[] {
  // dirPath is relative to PII_PATH (e.g., 'base/google/python')
  // Returns: ['base', 'base/google', 'base/google/python']
  const parts = dirPath.split(path.sep).filter(Boolean);
  const ancestors: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i + 1).join(path.sep));
  }

  return ancestors;
}

function findDataFilesInDirectory(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const dataFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    // Only process files (not directories)
    if (!stat.isFile()) continue;

    const ext = path.extname(file);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

    const basename = path.basename(file, ext);

    // Check if it's a full data file or section-specific file
    const isFullData = FULL_DATA_FILENAMES.includes(basename);
    const isSectionSpecific = Object.values(SECTION_KEY_TO_FILENAME)
      .flat()
      .includes(basename);

    if (isFullData || isSectionSpecific) {
      dataFiles.push(filePath);
    }
  }

  return dataFiles;
}

function isFullDataFilename(filename: string): boolean {
  const basename = path.basename(filename, path.extname(filename));
  return FULL_DATA_FILENAMES.includes(basename);
}
```

### 3. Surgical Save Strategy

**Save changes to the most specific (farthest-out) file in the hierarchy that contains the section.**

```typescript
// Example directory structure:
// /base/data.yml           → contains: info, education
// /base/google/work.yml    → contains: workExperience

// When loading /base/google/ and making edits:
// - Editing workExperience → saves to /base/google/work.yml (most specific)
// - Editing info           → saves to /base/data.yml (base dir - only location)
// - Editing education      → saves to /base/data.yml (base dir - only location)
//
// NOTE: Currently, sections only found in /base/data.yml will remain there
// rather than being extracted to new section-specific files in subdirectories

async function updateDataPath(dirPath: string, dataPath: string, value: any) {
  // 1. Determine which section is being modified
  const section = extractTopLevelKey(dataPath); // "workExperience"

  // 2. Find which file in the hierarchy contains this section
  //    (searches from deepest to shallowest, returns first match)
  const sourceFile = findSourceFile(dirPath, section);

  // 3. Load, modify, and save only that file
  const data = loadDataFile(sourceFile);
  setNestedValue(data, dataPath, value);
  saveDataFile(sourceFile, data);
}

function findSourceFile(dirPath: string, section: string): string {
  const ancestors = getAncestorDirectories(dirPath).reverse();

  // Search from deepest to shallowest (most specific to least specific)
  for (const dir of ancestors) {
    const files = findDataFilesInDirectory(dir);

    for (const file of files) {
      const data = loadDataFile(file);
      if (section in data) {
        return file; // Return the most specific file containing this section
      }
    }
  }

  throw new Error(`No file found containing section '${section}'`);
}
```

### 4. Temp & Backup Handling

Each file maintains its own temp/backup in its directory:

```
/base/data.yml                 → /base/data.temp.yml
/base/google/experience.yml    → /base/google/experience.temp.yml
/base/google/python/info.yml   → /base/google/python/info.temp.yml

backups/base/data.2025-01-14T10-00-00-000Z.yml
backups/base/google/experience.2025-01-14T11-00-00-000Z.yml
```

**Note:** The migration implementation itself creates **no temp files** during the migration process. Normal file operations (atomic writes) will continue to use temp files as they do currently.

---

## API Changes

### Current API (File-Based)

```typescript
// Load single file
const data = await getYamlData(); // Loads data.yml

// Save to single file
await updateYaml(path, value); // Saves to data.yml
```

### New API (Directory-Based)

```typescript
// Load from directory (with hierarchical merging)
const data = await loadFromDirectory("base/google/python/");

// Save to appropriate file in hierarchy
await updateInDirectory(
  "base/google/python/",
  "workExperience[0].position",
  value,
);

// Backward compatibility: if no directory exists, fall back to data.yml
const data = await loadResumeData(); // Auto-detects directory or file mode
```

**Note:** Backward compatibility is not a concern for this early prototype. We do not need to maintain support for old implementations.

---

## Migration Strategy

### Phase 1: No Migration Needed

The `data.yml` file can stay at the root level unchanged. The system will continue to work exactly as before.

### Phase 2: Progressive Directory Organization

Users can progressively move to directory-based organization:

```bash
# Step 1: Create base directory, copy data.yml
mkdir base
cp data.yml base/data.yml

# Step 2: Create variant, add only the differences
mkdir base/google
echo "workExperience: [...]" > base/google/experience.yml

# Step 3: Load from directory
loadFromDirectory('base/google/')  # Inherits from base/data.yml
```

### Phase 3: Cleanup Tool (Future)

A web-based UI route that:

- Detects conflicts within directories
- Shows which sections come from which files
- Allows users to consolidate or split files
- Validates the entire hierarchy

---

## Conflict Detection Examples

### Conflict 1: Same Section, Multiple Files

```
/base/google/
├── work.yml          # workExperience: [...]
└── experience.yml    # workExperience: [...]

❌ ERROR:
Section 'workExperience' defined in multiple files:
  /base/google/work.yml
  /base/google/experience.yml

Resolution: Remove one file or move one to a subdirectory
```

### Conflict 2: Same Section, Multiple Formats

```
/base/google/
├── info.yml          # info: {...}
└── info.json         # info: {...}

❌ ERROR:
Section 'info' exists in multiple formats:
  /base/google/info.yml
  /base/google/info.json

Resolution: Delete one format or move to different directory
```

### Conflict 3: Full Data File + Section File (OK)

```
/base/google/
├── data.yml          # Contains: info, workExperience, education
└── info.yml          # info: {...}

✅ NO ERROR: Section-specific file (info.yml) overrides section in data.yml
Result: info.yml wins for 'info' section
```

---

## Backward Compatibility

**Not a concern for this early prototype.** We do not need to maintain support for old implementations. The system will work with the new directory-based structure only.

---

## Benefits

1. **No Migration Required**: `data.yml` continues to work as-is
2. **Arbitrary Nesting**: No depth limits, organize as needed
3. **Clear Override Rules**: Deeper always wins, conflicts caught early
4. **Format Flexibility**: Mix YAML and JSON files as needed
5. **Comment Support**: YAML files support inline comments for documentation
6. **DRY Principle**: Base data inherited, only differences in variants
7. **Version Control**: Granular git diffs per section
8. **Progressive Adoption**: Add directories/variants when needed

---

## Open Questions

1. **Cleanup tool UX**: Should it auto-fix conflicts or just report them?
2. **Nesting depth limit**: Any practical limit or truly unlimited?
3. **File watching**: Should the system watch for file changes in development?
4. **Empty directory behavior**: When loading a directory with no data files, inherit everything from parents
5. **Symlink support**: Symlinks will NOT be supported in directory traversal

## Clarifications (2025-01-14)

### Path Resolution

- ✅ **All paths are relative to `PII_PATH` without leading slashes**: Directory paths like `base/google/` resolve to `${PII_PATH}/base/google/`
- ✅ **Use `path.join(PII_PATH, relativePath)` at runtime**: Store paths as `base/google/`, join when needed
- ✅ **Ancestor directories build from PII_PATH**: For `base/google/`, ancestors are `['base', 'base/google']` (relative to PII_PATH)
- ✅ **Cross-platform compatibility**: Using relative paths with `path.join` works on Windows, macOS, Linux

### Section Validation

- ✅ **Section-specific files validate CVData keys only**: `work.yml` can only contain `workExperience` CVData section
- ✅ **Non-CVData keys can be ignored**: Empty keys, whitespace, or other non-CVData keys are safe to ignore
- ✅ **Focus is preventing section bleed**: Validation ensures `work.yml` doesn't contain `education` data, etc.

### Supported File Formats

- ✅ **YAML only**: `.yml`, `.yaml` (with comment support via `#`)
- ✅ **JSON only**: `.json`
- ❌ **No TypeScript/JavaScript**: `.ts`, `.js` files are NOT supported
  - Simplifies implementation (no compilation/runtime loading)
  - Keeps data files safe (no code execution)
  - YAML comment support covers the main use case for wanting TypeScript

### Validation Timing

- ✅ **Load-time validation**: Validate files when loading, fail fast on errors
- ✅ **Flag errors immediately**: Detect file conflicts, invalid sections, and format issues during load
- ✅ **Early error detection**: Catch file corruption and configuration problems before they cause issues

### Conflict Rules

- ✅ **Same basename + different extensions** (e.g., `data.yml` + `data.json`) = ERROR
- ✅ **`.yml` and `.yaml` are treated as different extensions**: Having both `info.yml` and `info.yaml` in the same directory = ERROR
- ✅ **Section-specific files must only contain their designated section** - any extra CVData keys = ERROR
- ✅ All validation errors should be thrown at load time

### Directory Behavior

- ✅ **Empty directories inherit from parents**: If a directory exists but has no data files, inherit all sections from parent directories
- ✅ **Symlinks not supported**: Directory traversal will NOT follow symlinks

### Save Behavior

- ✅ **Edits to existing sections save to the most specific file** in the directory hierarchy containing that section
- ✅ **Sections only in base files stay in base files**: If a section only exists in `/base/data.yml`, edits save there (not extracted to subdirectories)
- ❌ **Creating new section-specific files automatically**: The system won't automatically create new section-specific files in subdirectories for sections that only exist in parent directories

### Temp Files (Clarified 2025-01-14)

- ✅ **Migration process creates no temp files**: The migration itself doesn't create temporary files
- ✅ **Normal file operations still use temp files**: Atomic writes continue to use temp files as they currently do

### Out of Scope

- ⏭️ Backward compatibility (early prototype, no need to maintain old implementations)
- ⏭️ **Creating new top-level sections**: Adding entirely new CVData section types (like a brand new `hobbies` section when none exists in any file) is out of scope. The system only updates existing section types found in the directory hierarchy.

---

## Related Files

- [src/types/index.ts](src/types/index.ts) - CVData type definition
- [lib/getYamlData.ts](lib/getYamlData.ts) - Current single-file loader (to be updated)
- [lib/unifiedFileManager.ts](lib/unifiedFileManager.ts) - File operations
- [MIGRATION_UNIFIEDFILEMANAGER.md](MIGRATION_UNIFIEDFILEMANAGER.md) - UnifiedFileManager migration docs
