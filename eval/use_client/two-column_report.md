# Bloat Review: app/two-column

## Summary

- **use client**: Used in resume-path and other components.
- **File size**: Some files >200 lines.
- **Component structure**: Large components could be split.
- **Type placement**: Types are inline.
- **Duplication**: Section rendering logic is repeated.
- **Boundary issues**: No major issues, but some data mapping could be server-side.

## Recommendations

- Decompose large components.
- Move types to a shared directory.
- Refactor repeated logic.
- Move data mapping to server components if possible.
