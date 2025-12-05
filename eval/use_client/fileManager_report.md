# Bloat Review: src/features/fileManager (all files with "use client")

## Summary

- **use client**: Used in all fileManager features.
- **File size**: Some files are large (>150 lines).
- **Component structure**: Some logic could be split into smaller modules.
- **Type placement**: Types are inline.
- **Duplication**: Some repeated file operation logic.
- **Boundary issues**: No major issues, but some logic could be server-side.

## Recommendations

- Split large modules into smaller ones.
- Move types to a shared directory.
- Refactor repeated logic into utilities.
- Move server-appropriate logic to server components.
