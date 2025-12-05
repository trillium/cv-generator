# Bloat Review: src/contexts (all files with "use client")

## Summary

- **use client**: Used in all context providers.
- **File size**: Some context files are large (>150 lines).
- **Component structure**: Some context logic could be split into hooks/utilities.
- **Type placement**: Types are inline.
- **Duplication**: Some repeated context setup logic.
- **Boundary issues**: No major issues, but some context could be simplified.

## Recommendations

- Split context logic into hooks/utilities.
- Move types to a shared directory.
- Refactor repeated context setup logic.
