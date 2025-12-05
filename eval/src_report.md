# src Directory Bloat & Structure Report

## Bloat (200+ lines)

- **EditableField.tsx**: 250 lines. Bloat detected. Split modal logic, array ops, and subcomponents further.
- **FileBrowser.tsx**: 287 lines. Bloat detected. Split filter/search UI, view toggles, file grid/list into subcomponents.
- **FileCard.tsx**: 249 lines. Bloat detected. Split menu logic and metadata editing into subcomponents.
- **MetadataEditor.tsx**: 241 lines. Bloat detected. Split tailoredFor logic and error display into subcomponents.
- **VersionHistory.tsx**: 245 lines. Bloat detected. Split diff rendering and version list item into subcomponents.

## Type Placement

- Most types imported from /types. Good.
- Some interfaces defined locally (EditableFieldProps, FileCardProps, MetadataEditorProps). Move to /types if reused.

## Component Structure

- Large components should be split into smaller subcomponents within their folders.
- Subcomponents exist for EditableField, but more splitting possible for FileBrowser, FileCard, MetadataEditor, VersionHistory.

## Code Duplication

- FileCard.tsx and ResumeMetadataDisplay.tsx: Shared metadata formatting logic.
- FileBrowser.tsx and FileCard.tsx: Shared file actions.
- MetadataEditor.tsx and ResumeMetadataDisplay.tsx: Shared tailoredFor display.

## Other Observations

- Resume components (single/two column) are small and well-structured.
- Most hooks, context, utility, and type files are under 200 lines and well-placed.

## Recommendations

1. Split large components into smaller subcomponents within their folders.
2. Move type definitions to /types if reused or complex.
3. Extract shared logic for metadata display, file actions, and tailoredFor handling.
4. Review for further code duplication in utility functions and handlers.

---

Great job! src directory reviewed. Moving to next directory.
