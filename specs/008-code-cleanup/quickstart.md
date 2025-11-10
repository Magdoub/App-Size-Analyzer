# Quickstart Guide: Code Cleanup and Organization

**Feature**: 008-code-cleanup
**Branch**: `008-code-cleanup`
**Status**: Ready for implementation

## Overview

This guide provides step-by-step instructions for safely removing obsolete files from the repository. The cleanup is organized into 4 user stories, executed sequentially with validation between each step.

---

## Prerequisites

Before starting cleanup operations:

1. **Checkout feature branch**:
   ```bash
   git checkout 008-code-cleanup
   ```

2. **Verify clean working directory**:
   ```bash
   git status
   # Should show: "nothing to commit, working tree clean"
   ```

3. **Ensure build and tests pass** (baseline):
   ```bash
   npm run build
   npm run test
   ```

   Both commands should succeed. If they fail, fix issues before proceeding.

4. **Verify dev server runs without errors**:
   ```bash
   npm run dev
   # Check console for errors in first 30 seconds
   # Press Ctrl+C to stop
   ```

---

## Cleanup Workflow

Execute user stories **sequentially** in priority order (P1 → P2 → P3 → P4). Each story follows this pattern:

1. **Investigate**: Confirm files are safe to remove
2. **Remove**: Delete files using git or file system commands
3. **Validate**: Run build + tests to verify no breakage
4. **Commit**: Create git commit with cleanup changes

### User Story 1: Remove Backup Files (Priority P1)

**Goal**: Remove all `.bak` files from the repository.

#### Step 1: Find backup files
```bash
find src -name "*.bak" -type f
```

**Expected output**:
```
src/App.tsx.bak
src/lib/parsers/android/apk-parser.ts.bak
```

#### Step 2: Verify no imports of backup files
```bash
grep -r "\.bak" src/ --include="*.js" --include="*.vue"
```

**Expected output**: (empty - no matches)

#### Step 3: Remove backup files
```bash
rm src/App.tsx.bak
rm src/lib/parsers/android/apk-parser.ts.bak
```

#### Step 4: Validate
```bash
npm run build && npm run test
```

**Expected**: Both commands succeed ✅

#### Step 5: Commit
```bash
git add -A
git commit -m "Remove backup files from Vue migration (US1)

Removed 2 backup files created during Vue 3 migration (spec 006):
- src/App.tsx.bak (8.5 KB)
- src/lib/parsers/android/apk-parser.ts.bak (4.9 KB)

Total size savings: ~13 KB

All backup content is preserved in git history. Build and tests pass after removal.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### User Story 2: Resolve JS/TS Duplicate Files (Priority P2)

**Goal**: Remove TypeScript (`.ts`) files that have corresponding JavaScript (`.js`) versions, keeping only JavaScript per project constitution.

#### Step 1: Find duplicate file pairs
```bash
# List all JS files (excluding tests)
find src -name "*.js" -type f ! -name "*.test.js" | sed 's/\.js$//' | sort > /tmp/js-files.txt

# List all TS files (excluding tests and setup.ts)
find src -name "*.ts" -type f ! -name "*.test.ts" ! -name "setup.ts" | sed 's/\.ts$//' | sort > /tmp/ts-files.txt

# Find common basenames (duplicates)
comm -12 /tmp/js-files.txt /tmp/ts-files.txt
```

**Expected**: ~30 duplicate basenames (files with both `.js` and `.ts` versions)

#### Step 2: Verify JavaScript versions are imported
```bash
# Sample check: Verify a JS file is imported
grep -r "from.*breakdown-generator" src/ --include="*.js" --include="*.vue"
```

**Expected**: Should find imports referencing `.js` version (not `.ts`)

#### Step 3: Remove TypeScript duplicates (keep JavaScript)
```bash
# IMPORTANT: Keep src/test/setup.ts (Vitest config, no JS equivalent)
# Remove all other TS files with JS equivalents

find src -name "*.ts" -type f ! -name "*.test.ts" ! -name "setup.ts" | while read -r ts_file; do
  js_file="${ts_file%.ts}.js"
  if [ -f "$js_file" ]; then
    echo "Removing duplicate: $ts_file (keeping $js_file)"
    rm "$ts_file"
  fi
done
```

#### Step 4: Validate
```bash
npm run build && npm run test
```

**Expected**: Both commands succeed ✅

If build fails with import errors, check for files that need manual conversion (e.g., `calculations.ts` with no `.js` equivalent).

#### Step 5: Check dev server for runtime errors
```bash
npm run dev
# Let it run for 30 seconds, check console for import errors
# Press Ctrl+C to stop
```

**Expected**: No import errors in console ✅

#### Step 6: Commit
```bash
git add -A
git commit -m "Remove TypeScript duplicates, keep JavaScript only (US2)

Removed ~30 TypeScript files that have JavaScript equivalents:
- lib/analysis/*.ts → kept .js versions
- lib/parsers/**/*.ts → kept .js versions
- lib/visualization/*.ts → kept .js versions
- types/*.ts → kept .js versions
- utils/*.ts → kept .js versions (except calculations.ts if converted)
- workers/*.ts → kept .js versions

Kept: src/test/setup.ts (Vitest config, no JS equivalent)

Per project constitution (Principle V: Code Quality & Modern JavaScript):
\"JavaScript MUST target ES2020+... no TypeScript per user requirement\"

Build and tests pass after removal. Dev server runs without import errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### User Story 3: Remove Legacy Store Directory (Priority P3)

**Goal**: Remove `src/store/` directory containing obsolete Zustand/React state management.

#### Step 1: Verify no active imports
```bash
grep -r "from.*['\"].*store/" src/ --include="*.js" --include="*.vue" | grep -v ".bak"
```

**Expected**: (empty - no matches, or only matches in `.bak` files)

#### Step 2: Review directory contents
```bash
ls -la src/store/
```

**Expected**:
```
total 24
drwxr-xr-x   3 user  staff    96 Nov  9 15:53 .
drwxr-xr-x  15 user  staff   480 Nov 10 16:08 ..
-rw-r--r--   1 user  staff  8899 Nov  9 15:53 analysis-store.ts
```

#### Step 3: Remove legacy store directory
```bash
rm -rf src/store/
```

#### Step 4: Validate
```bash
npm run build && npm run test
```

**Expected**: Both commands succeed ✅

#### Step 5: Commit
```bash
git add -A
git commit -m "Remove legacy Zustand store directory (US3)

Removed src/store/ directory containing React-era state management:
- src/store/analysis-store.ts (8.9 KB)

This directory is superseded by src/stores/ (Pinia, Vue 3) created in spec 006.
No active imports of src/store/ found in codebase.

Build and tests pass after removal.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### User Story 4: Investigate and Remove Unused Utilities (Priority P4)

**Goal**: Remove `src/utils/proptypes.js` (React PropTypes remnant, unused in Vue 3).

#### Step 1: Search for imports of proptypes
```bash
grep -r "proptypes" src/ --include="*.js" --include="*.vue"
```

**Expected**: (empty - no matches)

#### Step 2: Check for dynamic imports
```bash
grep -r "import(" src/ | grep "proptypes"
grep -r "require(" src/ | grep "proptypes"
```

**Expected**: (empty - no matches)

#### Step 3: Remove unused utility file
```bash
rm src/utils/proptypes.js
```

#### Step 4: Validate
```bash
npm run build && npm run test
```

**Expected**: Both commands succeed ✅

#### Step 5: Check dev server
```bash
npm run dev
# Let it run for 30 seconds, check console for errors
# Press Ctrl+C to stop
```

**Expected**: No runtime errors ✅

#### Step 6: Commit
```bash
git add -A
git commit -m "Remove unused proptypes utility (US4)

Removed src/utils/proptypes.js (~3 KB):
- React PropTypes remnant from pre-Vue migration
- No imports found in codebase (static or dynamic)
- Vue 3 uses defineProps() for prop validation, not PropTypes

Build, tests, and dev server all pass after removal.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Post-Cleanup Verification

After completing all 4 user stories:

### 1. Verify cleanup completeness
```bash
# Should find 0 backup files
find src -name "*.bak" -type f

# Should find 0 or 1 TS files (only setup.ts)
find src -name "*.ts" -type f ! -name "*.test.ts"

# Should not find legacy store directory
ls src/store 2>/dev/null || echo "Directory removed ✅"

# Should not find proptypes
ls src/utils/proptypes.js 2>/dev/null || echo "File removed ✅"
```

### 2. Final validation
```bash
npm run build && npm run test
```

**Expected**: Both succeed ✅

### 3. Check repository size reduction
```bash
git log --oneline --since="1 day ago"
# Should show 4 cleanup commits (US1, US2, US3, US4)

du -sh src/
# Compare to pre-cleanup size (should be ~125-180 KB smaller)
```

---

## Rollback Procedures

If any cleanup step fails validation, rollback using git:

### Rollback latest commit (e.g., US2 failed)
```bash
git revert HEAD
npm run build && npm run test
# Verify build and tests pass after rollback
```

### Rollback specific commit by hash
```bash
git log --oneline  # Find commit hash of the problematic cleanup
git revert <commit-hash>
npm run build && npm run test
```

### Rollback entire cleanup (all 4 user stories)
```bash
# Find commit hashes for all 4 cleanup commits
git log --oneline -10

# Revert in reverse order (US4 → US3 → US2 → US1)
git revert <us4-hash>
git revert <us3-hash>
git revert <us2-hash>
git revert <us1-hash>

npm run build && npm run test
```

---

## Troubleshooting

### Problem: Build fails with import errors after US2
**Symptom**: `Cannot find module './types'` or similar

**Solution**:
1. Identify which file is missing:
   ```bash
   npm run build 2>&1 | grep "Cannot find"
   ```
2. Check if a TypeScript file was removed that has no JavaScript equivalent:
   ```bash
   git log --all --full-history -- "src/path/to/missing-file.ts"
   ```
3. Restore the file temporarily:
   ```bash
   git checkout HEAD~1 -- src/path/to/missing-file.ts
   ```
4. Convert TypeScript to JavaScript:
   - Remove type annotations
   - Update imports to use `.js` extensions
   - Save as `.js` file
5. Re-run validation

### Problem: Tests fail after removing legacy store (US3)
**Symptom**: Test failures referencing `store/` imports

**Solution**:
1. Find test files still importing from `store/`:
   ```bash
   grep -r "store/" src/__tests__/ --include="*.test.js"
   ```
2. Update imports to use `stores/` (Pinia) instead
3. Re-run tests

### Problem: Dev server shows runtime errors after cleanup
**Symptom**: Console errors like "Failed to resolve module"

**Solution**:
1. Check which module is failing:
   - Open browser console
   - Look for "Failed to resolve" or 404 errors
2. Verify the module exists in `.js` form:
   ```bash
   find src -name "<module-name>.js"
   ```
3. If missing, restore from git history and convert to JavaScript

---

## Success Criteria Checklist

After completing all cleanup operations, verify these criteria:

- [ ] All backup files (`.bak`) removed (SC-001)
- [ ] Duplicate JS/TS files reduced to single implementations (SC-002)
- [ ] Legacy `store/` directory removed (SC-003)
- [ ] Build succeeds without errors (SC-004)
- [ ] All tests pass (SC-005)
- [ ] Repository size reduced by at least 20 KB (SC-006)
- [ ] No import errors in dev server console (SC-007)
- [ ] Zero backup patterns found in codebase search (SC-008)
- [ ] Single source of truth for each module (no duplicates) (SC-009)
- [ ] Commit messages document all removed files (SC-010)

---

## Next Steps

After completing this cleanup:

1. **Push to remote**:
   ```bash
   git push origin 008-code-cleanup
   ```

2. **Create pull request**:
   ```bash
   gh pr create --title "Code cleanup and organization (Spec 008)" --body "Removes backup files, TypeScript duplicates, legacy React/Zustand stores, and unused utilities. All builds and tests passing."
   ```

3. **Update .gitignore** (if needed):
   - Add `*.bak` to prevent future backup file commits
   - Add `*.old`, `*.backup` patterns

4. **Move spec to done**:
   ```bash
   # After PR is merged
   git checkout main
   git pull origin main
   # Spec directory remains in specs/008-code-cleanup/ for historical reference
   ```

---

**Status**: ✅ Complete - Ready for implementation via `/speckit.tasks` → `/speckit.implement`
