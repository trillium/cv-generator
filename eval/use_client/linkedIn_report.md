# Bloat Review: app/linkedIn

## Summary

- **use client**: Used in LinkedIn-specific components.
- **File size**: No single file is extremely large, but some helpers are over 100 lines.
- **Component structure**: Acceptable, but some logic could be extracted.
- **Type placement**: Types are mostly inline; could be centralized.
- **Duplication**: Some repeated LinkedIn parsing logic.
- **Boundary issues**: No major issues, but some data transformation could be server-side.

## Recommendations

- Extract LinkedIn parsing logic to utilities.
- Centralize type definitions.
- Consider moving heavy data transformation to server components.
