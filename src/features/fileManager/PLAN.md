# FileManager Refactor Plan

## Goal

Split all sub-components, types, and helpers from `FileManagerFeature.tsx` into separate files under `src/features/fileManager/parts/` and update all imports accordingly.

## Steps

1. **Audit and Identify**

   - List all sub-components, types, and helpers in `FileManagerFeature.tsx`.
   - Confirm which need to be split out.

2. **Create Parts Directory**

   - Ensure `src/features/fileManager/parts/` exists.

3. **Move/Extract Sub-Components**

   - For each sub-component (e.g., `PageHeader`, `ErrorDisplay`, `TreeNodeItem`, etc.), create a new file in `parts/` and move the code there.
   - Move helper types (e.g., `EditingFieldState`, `TreeNode`) to `parts/types.ts`.
   - Move utility functions (e.g., `buildTree`) to `parts/utils.ts`.

4. **Update Imports**

   - Update all imports in `FileManagerFeature.tsx` and in the new parts files to use the correct relative path to `src/features/fileManager/parts/`.

5. **Test and Verify**
   - Run the app and tests to ensure everything works with the new structure.
   - Debug and fix any import/type errors.

## Status

- [ ] Directory created and files moved
- [ ] All imports updated
- [ ] Tests and verification complete

---

**Notes:**

- Use relative imports from `app/file-manager/FileManagerFeature.tsx` to `src/features/fileManager/parts/`.
- Remove inlined sub-component code from `FileManagerFeature.tsx` after import is confirmed working.
- Keep this plan updated as progress is made.
