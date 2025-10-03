# ESLint Fix Tasks

## LinkedInContext.tsx - React Refresh Warnings

**Issue**: File exports both component (LinkedInProvider) and hooks (useLinkedInContext, useLinkedInData), causing `react-refresh/only-export-components` warnings.

**Impact**: Blocks commits due to `--max-warnings 0` in precommit hook.

**Solution Options**:

1. **Move hooks to separate file**: Create `src/hooks/useLinkedIn.ts` and export hooks from there. Update all imports across codebase.
2. **Disable warnings**: Add `// eslint-disable-next-line react-refresh/only-export-components` to exported hooks (temporary).
3. **Accept warnings**: Change lint config to allow these warnings temporarily.

**Recommended**: Option 1 for clean architecture, but Option 2 for quick unblock if needed.

**Files to update if moving hooks**:

- All files importing `useLinkedInContext` or `useLinkedInData`
- Update imports to `import { useLinkedInContext } from '../hooks/useLinkedIn'`

## yaml-update.test.tsx - Unused Variables

**Issue**: Test file has unused imports (`render`, `screen`, `fireEvent`, `waitFor`, `TestResumePage`, `TestWrapper`, `initialYamlContent`) causing ESLint errors.

**Impact**: Blocks commits due to precommit linting.

**Solution**: Remove unused imports and variables, or implement the test properly if needed.

**Status**: Skipped for now - needs review of test purpose and implementation.

## react/no-unescaped-entities - Not Auto-fixable

**Issue**: ESLint's `react/no-unescaped-entities` rule (e.g., double quotes in JSX text) is not auto-fixable, even with `--fix` or config tweaks.

**Impact**: Manual fix or codemod required for lines like: `<span>This is a "quoted" word.</span>`

**Solution**:

- Manually replace `"` with `&quot;` in JSX text nodes
- Or use a codemod/script to batch-fix across codebase
- No config change will make ESLint auto-fix this until plugin authors add a fixer

**Status**: Research if there's an auto fix somewhere out there

---

# General ESLint Fixes Progress

- Phase 1: Remove unused imports/vars (~80% of errors)
- Phase 2: Replace `any` with proper types
- Phase 3: Fix React-specific issues (hooks, entities)
- Phase 4: Edge cases

**Current Status**: ~10 files fixed, many more to go. Precommit hooks enforce linting on commits.
