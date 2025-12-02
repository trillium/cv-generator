# Bun Migration Checklist

## Pre-Migration

- [ ] **Verify Bun installation**

  ```bash
  bun --version  # Should be 1.0+
  ```

  If not installed: `curl -fsSL https://bun.sh/install | bash`

- [ ] **Create backup branch**

  ```bash
  git checkout -b bun-migration
  ```

- [ ] **Commit all current changes**

  ```bash
  git add .
  git commit -m "chore: prepare for bun migration"
  ```

- [ ] **Document current performance baseline**
  ```bash
  time pnpm install
  time pnpm build
  time pnpm test
  time pnpm pdf
  ```
  Record times for comparison

## Phase 1: Package Manager Switch

- [ ] **Install dependencies with Bun**

  ```bash
  bun install
  ```

- [ ] **Verify lockfile creation**

  ```bash
  ls -la bun.lockb  # Should exist
  ```

- [ ] **Test basic commands still work**

  ```bash
  bun run dev      # Start dev server
  bun run build    # Build project
  bun run test     # Run tests
  ```

- [ ] **Update package.json packageManager field**

  ```json
  "packageManager": "bun@1.x"
  ```

- [ ] **Remove pnpm lockfile** (only after verification)

  ```bash
  rm pnpm-lock.yaml
  ```

- [ ] **Update .gitignore if needed**
  ```bash
  # Add to .gitignore if not present:
  # bun.lockb should be committed, but verify no bun temp files
  ```

## Phase 2: Script Migration

### Update package.json scripts

- [ ] **Replace tsx with bun for TypeScript scripts**

  ```json
  "postbuild": "bun scripts/generate-build-hash.ts",
  "cached-build-serve": "bun scripts/cached-build-serve.ts",
  "pdf": "bun scripts/pdf/pdf.ts --resumePath=resumes --resumeType=single-column --prod",
  "pdf:anon": "bun scripts/pdf/pdf.ts --resumePath=resumes --anon --resumeType=single-column --prod",
  "pdf:resume": "bun scripts/pdf/pdf.ts --resumePath=resumes --resumeType=single-column --print=resume --prod",
  "pdf:cover": "bun scripts/pdf/pdf.ts --resumePath=resumes --resumeType=single-column --print=cover --prod",
  "yml-to-json": "bun lib/ymlToJson.ts",
  "yml-to-json:watch": "nodemon --watch . --ext yml --exec 'bun lib/ymlToJson.ts'"
  ```

- [ ] **Update E2E test scripts**

  ```json
  "test:e2e": "bun test e2e/tests/**/*.test.ts",
  "test:e2e:watch": "bun test --watch e2e/tests/**/*.test.ts"
  ```

- [ ] **Consider using bun for Next.js dev server** (optional optimization)
  ```json
  "dev": "bun --bun next dev -p 10300"
  ```

### Update error messages in scripts

- [ ] **Update scripts/pdf/pdf.ts line 46** Change:

  ```typescript
  `Server not running at ${serverUrl}. Start it first with pnpm ${mode === "dev" ? "dev" : "start"}`;
  ```

  To:

  ```typescript
  `Server not running at ${serverUrl}. Start it first with bun ${mode === "dev" ? "dev" : "start"}`;
  ```

- [ ] **Search for other pnpm references**
  ```bash
  grep -r "pnpm" scripts/ --include="*.ts" --include="*.js"
  ```

## Phase 3: Testing & Verification

### Test all script commands

- [ ] **Test build process**

  ```bash
  bun run build
  ```

- [ ] **Test PDF generation**

  ```bash
  bun run pdf
  bun run pdf:resume
  bun run pdf:cover
  ```

- [ ] **Test development server**

  ```bash
  bun run dev
  # Visit http://localhost:10300
  ```

- [ ] **Test linting**

  ```bash
  bun run lint
  ```

- [ ] **Test formatting**

  ```bash
  bun run format
  ```

- [ ] **Test unit tests**

  ```bash
  bun run test
  bun run test:watch
  ```

- [ ] **Test E2E tests**

  ```bash
  bun run test:e2e
  ```

- [ ] **Test YAML to JSON conversion**

  ```bash
  bun run yml-to-json
  ```

- [ ] **Test cached build serve**
  ```bash
  bun run cached-build-serve
  ```

### Test git hooks

- [ ] **Test pre-commit hook**

  ```bash
  # Make a small change and commit
  git add .
  git commit -m "test: verify pre-commit hook works with bun"
  ```

- [ ] **Test commit-msg hook**

  ```bash
  # Verify commitlint still works
  ```

- [ ] **Verify lint-staged works**
  ```bash
  # Check that ESLint and Prettier run on staged files
  ```

## Phase 4: Performance Benchmarking

- [ ] **Measure install time**

  ```bash
  rm -rf node_modules bun.lockb
  time bun install
  ```

- [ ] **Measure build time**

  ```bash
  time bun run build
  ```

- [ ] **Measure test execution**

  ```bash
  time bun run test
  ```

- [ ] **Measure PDF generation**

  ```bash
  time bun run pdf
  ```

- [ ] **Compare with baseline** (from Pre-Migration) Document improvements in performance

## Phase 5: Documentation Updates

- [ ] **Update CLAUDE.md**

  - Change package manager references from pnpm to bun
  - Update build/lint/test commands

- [ ] **Update README (if exists)**

  - Installation instructions
  - Setup steps
  - Development commands

- [ ] **Update any other docs**

  ```bash
  grep -r "pnpm" docs/ --include="*.md"
  ```

- [ ] **Add Bun migration notes**
  - Document any gotchas
  - Note performance improvements
  - Link to this checklist

## Phase 6: Optional Optimizations

### Consider using Bun APIs for better performance

- [ ] **Optimize file operations in scripts/pdf/** Replace Node.js fs with Bun.file() for:

  - file-utils.ts
  - metadata-writer.ts
  - data-loader.ts

- [ ] **Optimize lib/ymlToJson.ts** Use Bun.file() for faster YAML file reading

- [ ] **Consider Bun.write() for output files**

  - PDF metadata writing
  - Build hash generation

- [ ] **Evaluate bun test vs Vitest**
  - Bun's built-in test runner is compatible with Vitest syntax
  - May be faster for simple tests
  - Decision: Keep Vitest or migrate?

## Phase 7: CI/CD Updates (if applicable)

- [ ] **Update CI workflow** (GitHub Actions, etc.)

  ```yaml
  - uses: oven-sh/setup-bun@v1
    with:
      bun-version: latest
  - run: bun install
  - run: bun run build
  - run: bun run test
  ```

- [ ] **Update deployment scripts** Change pnpm commands to bun

- [ ] **Update Docker images** (if using Docker)
  ```dockerfile
  FROM oven/bun:latest
  ```

## Rollback Plan

If issues arise:

- [ ] **Keep pnpm-lock.yaml backup**

  ```bash
  cp pnpm-lock.yaml pnpm-lock.yaml.backup
  ```

- [ ] **Rollback steps**
  ```bash
  rm -rf node_modules bun.lockb
  mv pnpm-lock.yaml.backup pnpm-lock.yaml
  pnpm install
  git checkout package.json  # Restore original scripts
  ```

## Final Steps

- [ ] **Commit all changes**

  ```bash
  git add .
  git commit -m "chore: migrate from pnpm to bun"
  ```

- [ ] **Document performance gains** Create summary of before/after benchmarks

- [ ] **Update team** (if applicable)

  - Notify team members about migration
  - Share installation instructions
  - Document any workflow changes

- [ ] **Merge to main**
  ```bash
  git checkout main
  git merge bun-migration
  ```

## Success Criteria

- [x] All tests passing
- [x] All scripts working
- [x] Git hooks functioning
- [x] Build successful
- [x] Dev server running
- [x] PDF generation working
- [x] Performance improved or equivalent
- [x] Documentation updated
- [x] Team onboarded (if applicable)

## Notes

**Estimated Time:** 2-3 hours

**Risk Level:** Low - Easy rollback available

**Expected Improvements:**

- Install: 60-80% faster
- Script execution: 2-3x faster
- File operations: Potentially faster

**Blockers:** None identified
