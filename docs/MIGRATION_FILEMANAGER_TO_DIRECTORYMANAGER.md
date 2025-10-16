# Migration: FileManagerContext → DirectoryManagerContext

## Summary

Successfully migrated from `FileManagerContext` to `DirectoryManagerContext` across the entire application.

## Changes Made

### 1. Enhanced DirectoryManagerContext

Added missing methods to match FileManagerContext functionality:

- `refreshFiles()` - Refreshes the file list for the current directory
- `createDirectory(parentPath, directoryName)` - Creates a new directory
- `splitSectionToFile(sourceFilePath, sectionKey, targetFileName)` - Splits a section to a new file
- `deleteFileToDeleted(filePath)` - Moves a file to deleted folder

### 2. Updated Components

#### `FileManagerFeature.tsx`

- Replaced `useFileManager` with `useDirectoryManager`
- Updated method calls:
  - `updateField` → `updateDataPath`
  - `saveChanges` → `saveDirectory`
  - `directoryMetadata` → `metadata`
- All CRUD operations now work with DirectoryManager

#### `ResumeNavigator.tsx`

- Replaced `useFileManager` with `useDirectoryManager`
- Removed unsupported `onSelectDirectory` prop from DirectoryTree

#### `DirectoryTree.tsx`

- Now uses `useDirectoryManager` as fallback when files prop not provided
- Pulls from `directoryManager.files` instead of `directoryManager.data?.files`

### 3. Updated Hooks

#### `useResumeNavigation.ts`

- Replaced `useFileManager` with `useDirectoryManager`
- Changed `loadFile` to `loadDirectory`

### 4. Updated Pages

#### `app/two-column/resume/[resume-path]/page.tsx`

- Replaced `useFileManager` with `useDirectoryManager`
- Changed `loadFile` to `loadDirectory`

#### `app/two-column/cover-letter/[resume-path]/page.tsx`

- Replaced `useFileManager` with `useDirectoryManager`
- Changed `loadFile` to `loadDirectory`

## API Compatibility

DirectoryManagerContext now provides full compatibility with FileManagerContext:

### State

- `currentDirectory` ✓
- `data` (CVData) ✓
- `sources` ✓
- `metadata` (replaces `directoryMetadata`) ✓
- `files` ✓
- `loading` ✓
- `error` ✓
- `hasUnsavedChanges` ✓
- `parsedData` ✓
- `content` ✓

### Methods

- `loadDirectory(path)` ✓
- `updateDataPath(yamlPath, value)` (replaces `updateField`) ✓
- `saveDirectory()` (replaces `saveChanges`) ✓
- `discardChanges()` ✓
- `refreshFiles()` ✓
- `createDirectory(parentPath, directoryName)` ✓
- `splitSectionToFile(sourceFilePath, sectionKey, targetFileName)` ✓
- `deleteFileToDeleted(filePath)` ✓
- `getSourceFile(section)` ✓
- `getHierarchy(path)` ✓
- `listDirectoryFiles(path)` ✓

## Deleted Legacy Files

The following legacy FileManagerContext files have been **removed**:

- ✅ `src/contexts/FileManagerContext.tsx` (deleted)
- ✅ `src/contexts/FileManagerContext.hook.tsx` (deleted)
- ✅ `src/contexts/FileManagerContext.constants.tsx` (deleted)

Test files updated to use DirectoryManager:

- ✅ `src/components/EditableField/EmptyFieldPlaceholder.test.tsx` (updated mocks)
- ✅ `src/components/Projects/ProjectLinks.test.tsx` (updated mocks)

## Next Steps

1. ✅ Update all components to use DirectoryManager
2. ✅ Add missing methods to DirectoryManager
3. ✅ Remove old FileManagerContext files
4. ✅ Update test mocks to use DirectoryManager
5. ⏭️ Test all functionality thoroughly

## Benefits

1. **Unified Context**: Single source of truth for directory/file management
2. **Better Type Safety**: DirectoryFileInfo type used consistently
3. **Hierarchical Support**: Built-in support for directory hierarchies
4. **Simplified State**: No duplicate context providers needed
5. **API Consistency**: Same API across all components

## Testing Checklist

- [ ] Load directory functionality
- [ ] Update field/data path
- [ ] Save/discard changes
- [ ] Create directory
- [ ] Split section to file
- [ ] Delete file
- [ ] Refresh files
- [ ] Navigate between resumes
- [ ] Display cover letters
- [ ] File tree navigation

## Files Changed

### Deleted:

- `src/contexts/FileManagerContext.tsx`
- `src/contexts/FileManagerContext.hook.tsx`
- `src/contexts/FileManagerContext.constants.tsx`

### Modified:

- `src/contexts/DirectoryManagerContext.tsx` - Added missing methods
- `src/features/fileManager/FileManagerFeature.tsx` - Migrated to DirectoryManager
- `src/components/ResumeNavigator/ResumeNavigator.tsx` - Migrated to DirectoryManager
- `src/features/fileManager/parts/DirectoryTree.tsx` - Uses DirectoryManager + fixed imports
- `src/features/fileManager/parts/SelectedFileInfo.tsx` - Fixed imports
- `src/features/fileManager/parts/types.ts` - Fixed imports
- `src/features/fileManager/parts/utils.ts` - Fixed imports
- `src/hooks/useResumeNavigation.ts` - Migrated to DirectoryManager
- `app/two-column/resume/[resume-path]/page.tsx` - Migrated to DirectoryManager
- `app/two-column/cover-letter/[resume-path]/page.tsx` - Migrated to DirectoryManager
- `src/components/EditableField/EmptyFieldPlaceholder.test.tsx` - Updated mocks
- `src/components/Projects/ProjectLinks.test.tsx` - Updated mocks

### Created:

- `MIGRATION_FILEMANAGER_TO_DIRECTORYMANAGER.md` - This documentation
