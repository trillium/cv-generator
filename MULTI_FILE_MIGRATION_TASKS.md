# Multi-File YAML Migration Tasks

## Status: PLANNING (January 2025)

This document breaks down the implementation of the multi-file data loading system described in [MULTI_FILE_YAML_MIGRATION.md](MULTI_FILE_YAML_MIGRATION.md).

## Commit Strategy

**Stage and commit work in small, logical blocks as you go:**

- Commit after each subsection (e.g., 1.1, 1.2, 1.3)
- Use terse semantic commit messages with clear descriptions
- Small commits are preferable to large ones
- Each commit should represent a complete, working unit of functionality

---

## Phase 1: Core Infrastructure

### 1.1 Create File Mapping Registry

**File:** [lib/multiFileMapper.ts](lib/multiFileMapper.ts)

- [ ] Define `FULL_DATA_FILENAMES` constant
- [ ] Define `SECTION_KEY_TO_FILENAME` mapping
- [ ] Define `SUPPORTED_EXTENSIONS` constant
- [ ] Create `FileEntry` interface
- [ ] Implement `loadDataFile()` function
- [ ] Implement `isFullDataFilename()` helper
- [ ] Add tests for file mapping logic

### 1.2 Implement Path Resolution

**File:** [lib/multiFileMapper.ts](lib/multiFileMapper.ts)

- [ ] Implement `getAncestorDirectories()` function
- [ ] Add tests for path resolution with various depths
- [ ] Test cross-platform compatibility (Windows/Unix paths)

### 1.3 Implement Directory File Discovery

**File:** [lib/multiFileMapper.ts](lib/multiFileMapper.ts)

- [ ] Implement `findDataFilesInDirectory()` function
- [ ] Handle missing directories gracefully
- [ ] Filter files by supported extensions
- [ ] Identify full data vs section-specific files
- [ ] Add tests for file discovery

---

## Phase 2: Validation

### 2.1 Section-Specific File Validation

**File:** [lib/multiFileMapper.ts](lib/multiFileMapper.ts)

- [ ] Implement `validateSectionSpecificFile()` function
- [ ] Check that section-specific files only contain their designated section
- [ ] Throw clear error messages for violations
- [ ] Add tests for all section-specific file types
- [ ] Test error cases (multiple CVData keys in section file)

### 2.2 Conflict Detection

**File:** [lib/multiFileMapper.ts](lib/multiFileMapper.ts)

- [ ] Implement `validateNoConflicts()` function
- [ ] Detect same section in multiple section-specific files
- [ ] Detect same basename with different extensions
- [ ] Handle `.yml` and `.yaml` as different extensions
- [ ] Generate clear conflict error messages
- [ ] Add tests for all conflict scenarios

---

## Phase 3: Directory Loading

### 3.1 Single Directory Loading

**File:** [lib/getYamlData.ts](lib/getYamlData.ts)

- [ ] Implement `loadSingleDirectory()` function
- [ ] Load all data files in directory
- [ ] Apply section-specific override priority
- [ ] Track source file for each section
- [ ] Call validation functions at load time
- [ ] Add tests for single directory loading

### 3.2 Hierarchical Directory Loading

**File:** [lib/getYamlData.ts](lib/getYamlData.ts)

- [ ] Implement `loadFromDirectory()` function
- [ ] Load ancestor directories in order
- [ ] Apply complete section replacement from deeper dirs
- [ ] Merge data across hierarchy
- [ ] Handle empty directories (inherit from parents)
- [ ] Add tests for hierarchical loading scenarios

---

## Phase 4: Data Modification

### 4.1 Source File Tracking

**File:** [lib/getYamlData.ts](lib/getYamlData.ts)

- [ ] Implement `findSourceFile()` function
- [ ] Search from deepest to shallowest directory
- [ ] Return most specific file containing section
- [ ] Add tests for source file resolution

### 4.2 Surgical Save Implementation

**File:** [lib/getYamlData.ts](lib/getYamlData.ts)

- [ ] Implement `updateDataPath()` function
- [ ] Extract top-level section from data path
- [ ] Find appropriate source file
- [ ] Load, modify, and save only that file
- [ ] Preserve formatting in YAML files
- [ ] Add tests for saving to correct files

---

## Phase 5: Integration

### 5.1 Update Existing APIs

**Files:** [lib/getYamlData.ts](lib/getYamlData.ts), [lib/unifiedFileManager.ts](lib/unifiedFileManager.ts)

- [ ] Add `directoryPath` option to existing functions
- [ ] Auto-detect directory vs file mode
- [ ] Update temp/backup handling for multi-file
- [ ] Maintain atomic write operations
- [ ] Update error handling and logging

### 5.2 Update Type Definitions

**File:** [src/types/index.ts](src/types/index.ts)

- [ ] Add directory path types
- [ ] Add file source tracking types
- [ ] Update LoadOptions interface
- [ ] Add validation error types

---

## Phase 6: Testing

### 6.1 Unit Tests

- [ ] Test file mapping and discovery
- [ ] Test path resolution
- [ ] Test validation functions
- [ ] Test single directory loading
- [ ] Test hierarchical loading
- [ ] Test conflict detection
- [ ] Test save operations

### 6.2 Integration Tests

- [ ] Test complete load-modify-save cycles
- [ ] Test various directory structures
- [ ] Test mixed YAML/JSON scenarios
- [ ] Test error recovery
- [ ] Test empty directory handling

### 6.3 Edge Cases

- [ ] Test deeply nested directories (5+ levels)
- [ ] Test directories with no data files
- [ ] Test invalid file formats
- [ ] Test concurrent modifications
- [ ] Test large data files

---

## Phase 7: Documentation

### 7.1 Code Documentation

- [ ] Add JSDoc comments to all public functions
- [ ] Document validation rules in code
- [ ] Add inline examples for complex logic

### 7.2 User Documentation

- [ ] Update README with directory-based loading
- [ ] Add migration guide examples
- [ ] Document file naming conventions
- [ ] Document conflict resolution strategies
- [ ] Add troubleshooting section

---

## Phase 8: Cleanup and Polish

### 8.1 Error Messages

- [ ] Review all error messages for clarity
- [ ] Add suggestions for fixing errors
- [ ] Include file paths in error messages
- [ ] Add validation error codes

### 8.2 Performance

- [ ] Profile directory loading performance
- [ ] Optimize file system operations
- [ ] Add caching if needed
- [ ] Test with large directory structures

### 8.3 Code Quality

- [ ] Run linter and fix issues
- [ ] Run formatter
- [ ] Check test coverage
- [ ] Remove debug logging
- [ ] Remove commented code

---

## Open Questions to Resolve

1. **Empty directory behavior**: ✅ Confirmed - inherit from parents
2. **Symlink support**: ✅ Confirmed - not supported
3. **Validation timing**: ✅ Confirmed - load-time validation
4. **Creating new sections**: ⏭️ Out of scope for this migration
5. **Backward compatibility**: ⏭️ Not needed (early prototype)

---

## Success Criteria

- [ ] All tests passing
- [ ] No linter errors
- [ ] Documentation complete
- [ ] Can load from nested directories
- [ ] Validates conflicts correctly
- [ ] Saves to correct files
- [ ] Maintains data integrity
- [ ] Performance acceptable (< 100ms for typical directory)

---

## Related Files

- [MULTI_FILE_YAML_MIGRATION.md](MULTI_FILE_YAML_MIGRATION.md) - Detailed specification
- [src/types/index.ts](src/types/index.ts) - Type definitions
- [lib/getYamlData.ts](lib/getYamlData.ts) - Current loader (to be updated)
- [lib/unifiedFileManager.ts](lib/unifiedFileManager.ts) - File operations
- [MIGRATION_UNIFIEDFILEMANAGER.md](MIGRATION_UNIFIEDFILEMANAGER.md) - Related migration docs
