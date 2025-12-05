# Bloat Review: src/hooks (all files with "use client")

## Summary

- **use client**: Used in all hooks.
- **File size**: Some hooks are large (>100 lines).
- **Component structure**: Some hooks could be split into smaller functions.
- **Type placement**: Types are inline.
- **Duplication**: Some repeated logic (e.g., file operations, state management).
- **Boundary issues**: No major issues.

## Recommendations

- Split large hooks into smaller functions.
- Move types to a shared directory.
- Refactor repeated logic into utilities.
