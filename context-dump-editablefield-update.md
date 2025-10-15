# Context Dump: EditableField Update File Selection Logic

## Overview

This project supports editing YAML-based CV data stored in a directory structure. Each directory can contain multiple YAML files (e.g., `data.yml`, `info.yml`), and data is merged from all files for use in the app. When a user edits a field via the UI (using `EditableField`), the system must determine which file to update.

## EditableField Update Flow

1. **EditableField** calls `updateYamlPath(yamlPath, value)` (from `useYamlPathUpdater`).
2. `updateYamlPath` calls `updateDataPath(yamlPath, value)` from the DirectoryManager context, which POSTs to `/api/directory/update` with the current directory, yamlPath, and value.
3. The API handler (`app/api/directory/update/route.ts`) calls `MultiFileManager.updatePath(directoryPath, yamlPath, value)`.
4. `updatePath`:
   - Extracts the top-level key from the yamlPath (e.g., for `workExperience.0.position`, it’s `workExperience`).
   - Calls `findSourceFile(dirPath, section)` to determine which file in the directory hierarchy contains that section.
   - `findSourceFile` checks all ancestor directories (from most specific to most general), and for each, loads all data files, returning the first file where the section exists.
   - The update is then applied to that file.

## File Selection Example

- If a section (e.g., `workExperience`) exists in `info.yml`, that file is updated.
- If it only exists in `data.yml`, then `data.yml` is updated.
- The system always updates the most specific file containing the section.

## Key Functions

- `EditableField` (UI component)
- `useYamlPathUpdater` (hook)
- `updateDataPath` (DirectoryManager context)
- `/api/directory/update` (API route)
- `MultiFileManager.updatePath` (core logic)
- `findSourceFile` (file selection)

## Test Suggestion

To confirm this behavior:

- Set up a directory with both a general file (e.g., `data.yml`) and a specific file (e.g., `info.yml`), each containing different sections.
- Call the update API (or the `MultiFileManager.updatePath` method) to update a section that exists in only one of the files.
- Verify that only the correct file is modified (i.e., the file containing the section).
- Optionally, check that if a section exists in both, the most specific file is chosen.

---

This dump summarizes the context and logic for how EditableField updates select which file to write to in a multi-file YAML directory structure.
