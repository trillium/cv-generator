# Bloat Review: app/file-manager

## Summary

- **use client**: Used in page.tsx and supporting components.
- **File size**: page.tsx is moderately sized (~150 lines), but FileManager and helpers are large.
- **Component structure**: FileManager could be decomposed further; some logic is tightly coupled.
- **Type placement**: Some types are defined inline; consider moving to a types/ file.
- **Duplication**: Some repeated file operation logic.
- **Boundary issues**: No obvious server/client boundary violations, but some data-fetching logic could be moved server-side.

## Recommendations

- Decompose FileManager into smaller components.
- Move type definitions to a shared types/ directory.
- Refactor repeated file operation logic into utility functions.
- Audit data-fetching and move to server components where possible.
