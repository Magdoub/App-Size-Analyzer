# Cleanup Operations Contract

**Feature**: 008-code-cleanup
**Version**: 1.0.0
**Date**: 2025-11-10

## Overview

This contract defines the interface for cleanup operations that remove obsolete files from the repository. Each operation follows a standard pattern: validate prerequisites → remove files → validate results → commit changes.

---

## Operation: removeBackupFiles()

### Description
Removes all backup files with `.bak` extensions from the repository.

### Prerequisites
- Git working directory must be clean (no uncommitted changes)
- Current branch must be `008-code-cleanup`

### Input
```javascript
{
  "dryRun": boolean,        // If true, only list files without removing
  "targetPattern": string   // Glob pattern (default: "**/*.bak")
}
```

### Output (Success)
```javascript
{
  "status": "success",
  "filesRemoved": [
    {
      "path": "src/App.tsx.bak",
      "sizeBytes": 8455
    },
    {
      "path": "src/lib/parsers/android/apk-parser.ts.bak",
      "sizeBytes": 4938
    }
  ],
  "totalSizeKB": 13.4,
  "validation": {
    "buildPassed": true,
    "testsPassed": true,
    "importErrors": []
  }
}
```

### Output (Error)
```javascript
{
  "status": "error",
  "errorCode": "VALIDATION_FAILED",
  "message": "Build failed after removing backup files",
  "details": {
    "buildOutput": "...",
    "filesRemoved": ["src/App.tsx.bak"],
    "rollbackCommand": "git checkout src/App.tsx.bak"
  }
}
```

### Validation Steps
1. Search for any imports of `.bak` files (should be zero)
2. Remove files using `rm` command
3. Run `npm run build` (must succeed)
4. Run `npm run test` (must pass)
5. Commit with message: "Remove backup files (US1)"

### Error Codes
- `NO_FILES_FOUND`: No `.bak` files exist in repository
- `GIT_DIRTY`: Working directory has uncommitted changes
- `VALIDATION_FAILED`: Build or tests failed after removal
- `WRONG_BRANCH`: Not on `008-code-cleanup` branch

---

## Operation: resolveDuplicateFiles()

### Description
Removes TypeScript (`.ts`) files that have corresponding JavaScript (`.js`) versions, keeping only JavaScript per project constitution.

### Prerequisites
- `removeBackupFiles()` must have completed successfully
- Git working directory must be clean

### Input
```javascript
{
  "dryRun": boolean,           // If true, only list duplicates without removing
  "excludePatterns": string[], // Patterns to exclude (e.g., ["**/*.test.ts", "**/setup.ts"])
  "keepExtension": ".js"       // Which extension to keep (default: ".js")
}
```

### Output (Success)
```javascript
{
  "status": "success",
  "duplicatesFound": 32,
  "filesRemoved": [
    "src/lib/analysis/breakdown-generator.ts",
    "src/lib/analysis/index.ts",
    "src/lib/analysis/insight-rules.ts",
    // ... (full list of 32 files)
  ],
  "filesKept": [
    "src/test/setup.ts"  // Excluded per excludePatterns
  ],
  "totalSizeKB": 150,
  "validation": {
    "buildPassed": true,
    "testsPassed": true,
    "importErrors": []
  }
}
```

### Output (Error)
```javascript
{
  "status": "error",
  "errorCode": "IMPORT_ERROR",
  "message": "Import errors found after removing TypeScript files",
  "details": {
    "importErrors": [
      "Cannot find module './types' (expected ./types.js)"
    ],
    "filesRemoved": ["src/types/ios.ts", "src/types/android.ts"],
    "rollbackCommand": "git checkout src/types/*.ts"
  }
}
```

### Validation Steps
1. Find all file basenames with both `.js` and `.ts` versions
2. Exclude files matching `excludePatterns`
3. Verify `.js` versions are actively imported (grep imports)
4. Remove `.ts` versions
5. Run `npm run build` (must succeed)
6. Run `npm run test` (must pass)
7. Check `npm run dev` console for runtime import errors
8. Commit with message: "Remove TypeScript duplicates, keep JavaScript only (US2)"

### Error Codes
- `NO_DUPLICATES_FOUND`: No duplicate files exist
- `IMPORT_ERROR`: Import statements reference removed files
- `VALIDATION_FAILED`: Build or tests failed after removal
- `DIVERGENT_FILES`: `.js` and `.ts` versions have different logic (manual merge needed)

---

## Operation: removeLegacyStore()

### Description
Removes the legacy `src/store/` directory containing Zustand/React state management files superseded by Pinia stores.

### Prerequisites
- `resolveDuplicateFiles()` must have completed successfully
- Git working directory must be clean

### Input
```javascript
{
  "dryRun": boolean,        // If true, only list directory contents without removing
  "targetDirectory": string // Path to remove (default: "src/store")
}
```

### Output (Success)
```javascript
{
  "status": "success",
  "directoryRemoved": "src/store",
  "filesRemoved": [
    "src/store/analysis-store.ts"
  ],
  "totalSizeKB": 9,
  "validation": {
    "buildPassed": true,
    "testsPassed": true,
    "importErrors": []
  }
}
```

### Output (Error)
```javascript
{
  "status": "error",
  "errorCode": "ACTIVE_IMPORTS",
  "message": "Found active imports of src/store/ directory",
  "details": {
    "importLocations": [
      "src/components/SomeComponent.vue:5"
    ],
    "rollbackCommand": "git checkout src/store/"
  }
}
```

### Validation Steps
1. Grep entire codebase for imports of `store/` directory
2. If imports found, abort and report error
3. Remove directory using `rm -rf src/store`
4. Run `npm run build` (must succeed)
5. Run `npm run test` (must pass)
6. Commit with message: "Remove legacy Zustand store directory (US3)"

### Error Codes
- `DIRECTORY_NOT_FOUND`: `src/store/` doesn't exist
- `ACTIVE_IMPORTS`: Codebase still imports files from `src/store/`
- `VALIDATION_FAILED`: Build or tests failed after removal

---

## Operation: removeUnusedUtilities()

### Description
Investigates and removes utility files confirmed as unused (no imports, no dynamic requires).

### Prerequisites
- `removeLegacyStore()` must have completed successfully
- Git working directory must be clean

### Input
```javascript
{
  "dryRun": boolean,               // If true, only list candidates without removing
  "targetFiles": string[],         // Specific files to investigate (e.g., ["src/utils/proptypes.js"])
  "searchPatterns": string[]       // Import patterns to search (e.g., ["import.*proptypes", "require.*proptypes"])
}
```

### Output (Success)
```javascript
{
  "status": "success",
  "filesInvestigated": [
    "src/utils/proptypes.js"
  ],
  "filesRemoved": [
    "src/utils/proptypes.js"
  ],
  "filesKept": [],
  "totalSizeKB": 3,
  "validation": {
    "buildPassed": true,
    "testsPassed": true,
    "importErrors": []
  }
}
```

### Output (Warning)
```javascript
{
  "status": "warning",
  "message": "Some files have unclear usage status",
  "filesInvestigated": [
    "src/utils/proptypes.js",
    "src/utils/calculations.ts"
  ],
  "filesRemoved": [
    "src/utils/proptypes.js"
  ],
  "filesKept": [
    "src/utils/calculations.ts"  // Found in dynamic import
  ],
  "unclearUsage": [],
  "validation": {
    "buildPassed": true,
    "testsPassed": true,
    "importErrors": []
  }
}
```

### Validation Steps
1. For each target file, grep codebase for import patterns
2. Check for dynamic imports: `import(`, `require(`, webpack-style imports
3. If zero imports found, mark as safe to remove
4. Remove safe files
5. Run `npm run build` (must succeed)
6. Run `npm run test` (must pass)
7. Check `npm run dev` for runtime errors
8. Commit with message: "Remove unused utility files (US4)"

### Error Codes
- `FILES_NOT_FOUND`: Target files don't exist
- `VALIDATION_FAILED`: Build or tests failed after removal
- `UNCLEAR_USAGE`: Cannot definitively determine if file is used (manual investigation needed)

---

## Common Validation Contract

All cleanup operations share this validation contract.

### Validation Input
```javascript
{
  "category": string,  // e.g., "US1", "US2", "US3", "US4"
  "filesRemoved": string[]
}
```

### Validation Output
```javascript
{
  "buildSuccess": boolean,
  "buildOutput": string,      // stdout/stderr from `npm run build`
  "testSuccess": boolean,
  "testOutput": string,       // stdout/stderr from `npm run test`
  "importErrors": string[],   // Errors related to missing imports
  "consoleErrors": string[],  // Runtime errors from `npm run dev`
  "overallStatus": "passed" | "failed" | "warning"
}
```

### Validation Steps (All Operations)
1. Run `npm run build` and capture output
2. Run `npm run test` and capture output
3. Start `npm run dev` and check console for errors (first 30 seconds)
4. Determine `overallStatus`:
   - "passed" if build + tests succeed and no import/console errors
   - "failed" if build or tests fail
   - "warning" if build + tests pass but non-critical console warnings exist

---

## Rollback Contract

All operations support rollback via git.

### Rollback Input
```javascript
{
  "commitHash": string,  // Hash of the cleanup commit to revert
  "category": string     // e.g., "US1", "US2", "US3", "US4"
}
```

### Rollback Output
```javascript
{
  "status": "success" | "error",
  "message": string,
  "filesRestored": string[],
  "newCommitHash": string  // Hash of the revert commit
}
```

### Rollback Steps
1. Verify commit hash exists: `git rev-parse <hash>`
2. Create revert commit: `git revert <hash>`
3. Verify files are restored: `git diff HEAD~1 HEAD`
4. Run validation to ensure rollback didn't break anything

---

## Usage Example: Complete Cleanup Workflow

```javascript
// Step 1: Remove backup files (US1)
const us1Result = await removeBackupFiles({ dryRun: false, targetPattern: "**/*.bak" });
if (us1Result.status !== "success") {
  console.error("US1 failed:", us1Result.message);
  process.exit(1);
}

// Step 2: Resolve duplicate files (US2)
const us2Result = await resolveDuplicateFiles({
  dryRun: false,
  excludePatterns: ["**/*.test.ts", "**/setup.ts"],
  keepExtension: ".js"
});
if (us2Result.status !== "success") {
  console.error("US2 failed:", us2Result.message);
  // Rollback US1 if needed
  await rollback({ commitHash: us1Result.commitHash, category: "US1" });
  process.exit(1);
}

// Step 3: Remove legacy store (US3)
const us3Result = await removeLegacyStore({ dryRun: false, targetDirectory: "src/store" });
if (us3Result.status !== "success") {
  console.error("US3 failed:", us3Result.message);
  process.exit(1);
}

// Step 4: Remove unused utilities (US4)
const us4Result = await removeUnusedUtilities({
  dryRun: false,
  targetFiles: ["src/utils/proptypes.js"],
  searchPatterns: ["import.*proptypes", "require.*proptypes"]
});
if (us4Result.status === "warning") {
  console.warn("US4 completed with warnings:", us4Result.message);
} else if (us4Result.status === "error") {
  console.error("US4 failed:", us4Result.message);
  process.exit(1);
}

console.log("✅ All cleanup operations completed successfully!");
```

---

## Contract Status

**Version**: 1.0.0
**Status**: ✅ Complete - Ready for task generation (`/speckit.tasks`)
**Dependencies**: None (this is a maintenance feature, not a runtime API)
