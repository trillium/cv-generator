# Bloat Review: app/two-column-multi

## Summary

- **use client**: Used in cover-letter and resume components.
- **File size**: Some files >150 lines.
- **Component structure**: Some monolithic components; could be split.
- **Type placement**: Types are inline.
- **Duplication**: Some repeated section rendering logic.
- **Boundary issues**: No major issues, but some data mapping could be server-side.

## Recommendations

- Split large components into smaller ones.
- Move types to a shared directory.
- Refactor repeated section rendering logic.
- Move data mapping to server components if possible.
