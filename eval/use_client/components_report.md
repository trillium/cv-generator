# Bloat Review: src/components (all files with "use client")

## Summary

- **use client**: Used in many components, sometimes unnecessarily (e.g., purely presentational components).
- **File size**: Several files >200 lines (e.g., Editor, FileManager, SectionEditor).
- **Component structure**: Some large components could be split.
- **Type placement**: Types are often inline.
- **Duplication**: Some repeated UI logic (button, modal, etc.).
- **Boundary issues**: Some components fetch data client-side that could be server-side.

## Recommendations

- Remove "use client" from presentational components.
- Decompose large components.
- Move types to a shared directory.
- Refactor repeated UI logic into shared components.
- Move data fetching to server components where possible.
