# LinkedIn Migration Tasks

Migration of the LinkedIn page from legacy single-file API to multi-file directory-based system.

**Note:** No backwards compatibility is required. Breaking the previous API is acceptable.

## Phase 1: Data Layer

### Task 1.1: Read existing structure of linkedin yml file from PII path in .env var

### Task 1.2: Update Types

- [ ] Ensure `LinkedInData` type supports multi-file loading
- [ ] Add/update types for nested `linkedIn` object structure
- [ ] Update any type imports in linkedin-related files
- **Commit**: `feat(linkedin): update types for multi-file structure`

## Phase 2: API Layer

### Task 2.1: Switch API Endpoint

- [ ] Update `/linkedin` page to use `/api/directory/load?directory=linkedin`
- [ ] Remove dependency on `/api/linkedin/load`
- [ ] Test that data loads correctly through new endpoint
- **Commit**: `refactor(linkedin): migrate to directory-based API endpoint`

### Task 2.2: Remove Legacy API

- [ ] Delete `/api/linkedin/load` route
- [ ] Remove any unused helper functions specific to old API
- [ ] Clean up imports
- **Commit**: `refactor(linkedin): remove legacy single-file API endpoint`

## Phase 3: Component Updates

### Task 3.1: Update Component Data Access

- [ ] Update LinkedIn page components to access `data.linkedIn.*` instead of top-level
- [ ] Update all field references (e.g., `firstName` → `linkedIn.firstName`)
- [ ] Update section references (e.g., `experience`, `skills`, etc.)
- **Commit**: `refactor(linkedin): update components for nested data structure`

### Task 3.2: Test All Sections

- [ ] Test personal info rendering
- [ ] Test experience section
- [ ] Test education section
- [ ] Test skills section
- [ ] Test certifications section
- [ ] Test volunteer section
- [ ] Test awards section
- [ ] Test projects section
- [ ] Test languages section
- **Commit**: `test(linkedin): verify all sections render correctly`

## Phase 4: Integration & Polish

### Task 4.1: Directory Structure Consistency

- [ ] Verify directory structure matches other multi-file sections
- [ ] Check for any hardcoded paths or references
- [ ] Ensure file naming conventions are consistent
- **Commit**: `chore(linkedin): ensure directory structure consistency`

### Task 4.2: Error Handling

- [ ] Add proper error handling for missing linkedin directory
- [ ] Add error handling for missing required fields
- [ ] Test error states
- **Commit**: `feat(linkedin): add error handling for data loading`

### Task 4.3: Documentation

- [ ] Update README or relevant docs about linkedin data structure
- [ ] Add example YAML files or templates
- [ ] Document the nested `linkedIn` key requirement
- **Commit**: `docs(linkedin): update documentation for multi-file structure`

## Phase 5: Testing & Cleanup

### Task 5.1: End-to-End Testing

- [ ] Test full page load with real data
- [ ] Test with minimal data
- [ ] Test with missing optional sections
- [ ] Verify no console errors
- **Commit**: `test(linkedin): complete end-to-end testing`

### Task 5.2: Final Cleanup

- [ ] Remove any commented-out code
- [ ] Remove debug logs
- [ ] Run linter and fix any issues
- [ ] Run tests and ensure all pass
- **Commit**: `chore(linkedin): final cleanup and linting`

## Migration Complete

Once all tasks are complete, the LinkedIn page will be fully integrated with the multi-file directory-based system, enabling modular data management and better consistency with the rest of the CV generator.
