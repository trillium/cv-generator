# DIRECTORY_MANAGER_REFACTOR.md

## Goal

Refactor the large `DirectoryManagerContext.tsx` file by splitting its responsibilities into smaller, focused modules and moving them into a dedicated subdirectory within `src/contexts/DirectoryManager/`. This will improve maintainability, readability, and testability.

---

## High-Level Plan

1. **Create a new subdirectory:**

   - `src/contexts/DirectoryManager/`

2. **Split responsibilities:**

   - **Types:** Move all TypeScript types/interfaces to `types.ts`.
   - **State hooks:** Move each logical state group (directory, files, loading, error, etc.) to custom hooks in `useDirectoryManagerState.ts`.
   - **Actions:** Move each async action (load, update, save, etc.) to its own file or group similar actions in `actions/`.
   - **Provider:** Keep a slim `DirectoryManagerProvider.tsx` that composes state and actions, and provides the context.
   - **Context:** Keep `DirectoryManagerContext.tsx` for context creation only.
   - **Hook:** Keep `useDirectoryManager.ts` for the consumer hook.

3. **Directory structure:**

```
src/contexts/DirectoryManager/
  DirectoryManagerContext.tsx      # context creation only
  DirectoryManagerProvider.tsx     # provider, composes state/actions
  useDirectoryManager.ts           # consumer hook
  types.ts                        # all types/interfaces
  useDirectoryManagerState.ts      # state hooks
  actions/
    loadDirectory.ts
    updateDataPath.ts
    saveDirectory.ts
    discardChanges.ts
    getSourceFile.ts
    getHierarchy.ts
    listDirectoryFiles.ts
    refreshFiles.ts
    createDirectory.ts
    splitSectionToFile.ts
    deleteFileToDeleted.ts
    updateContent.ts
    saveFile.ts
```

4. **Migration steps:**

   - [ ] Create new subdirectory and files.
   - [ ] Move and refactor types.
   - [ ] Move and refactor state logic to custom hooks.
   - [ ] Move and refactor each action to its own file.
   - [ ] Refactor provider to use new hooks/actions.
   - [ ] Update context and hook imports/exports.
   - [ ] Update all imports in the codebase to use the new structure.
   - [ ] Test thoroughly.

5. **Benefits:**
   - Easier to maintain and extend.
   - Improved testability (actions/state can be tested in isolation).
   - Clear separation of concerns.
   - Smaller, focused files.

---

## Next Steps

- Begin by creating the new directory and moving types.
- Refactor state and actions incrementally, testing as you go.
- Update all usages in the codebase.
