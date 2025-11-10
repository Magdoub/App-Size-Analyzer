# Data Model: Code Cleanup and Organization

**Feature**: 008-code-cleanup
**Date**: 2025-11-10
**Phase**: Phase 1 - Design

## Overview

This data model defines the entities and relationships for tracking file cleanup operations. Since this is a maintenance task (not a runtime feature), the data model focuses on documenting the cleanup process, validation results, and audit trail rather than runtime data structures.

---

## Entity Definitions

### CleanupCategory

Represents a logical grouping of files to be removed, corresponding to user stories.

**Attributes**:
- `id` (string): Unique identifier (e.g., "US1", "US2", "US3", "US4")
- `name` (string): Human-readable name (e.g., "Backup Files", "JS/TS Duplicates")
- `priority` (string): Priority level from spec (e.g., "P1", "P2", "P3", "P4")
- `description` (string): Brief explanation of what this category removes
- `filesTargeted` (integer): Number of files targeted for removal
- `estimatedSizeKB` (integer): Estimated disk space savings in kilobytes

**Relationships**:
- Has many `FileToRemove` (one-to-many)
- Has one `ValidationResult` (one-to-one, created after cleanup)

**Example**:
```javascript
{
  id: "US1",
  name: "Backup Files",
  priority: "P1",
  description: "Remove .bak files from Vue migration",
  filesTargeted: 2,
  estimatedSizeKB: 13
}
```

---

### FileToRemove

Represents a specific file targeted for deletion, with metadata for validation and audit.

**Attributes**:
- `path` (string): Absolute or repository-relative path to the file
- `category` (string): Foreign key to `CleanupCategory.id`
- `sizeBytes` (integer): File size in bytes
- `extension` (string): File extension (e.g., ".bak", ".ts", ".js")
- `reasonForRemoval` (string): Human-readable justification from research.md
- `hasImports` (boolean): Whether codebase search found any imports of this file
- `hasBackup` (boolean): Whether file exists in git history (always true for tracked files)
- `removalStatus` (enum): Current status ("pending", "removed", "kept", "error")

**Relationships**:
- Belongs to one `CleanupCategory` (many-to-one)
- May have one `ValidationResult` (one-to-one, optional)

**Example**:
```javascript
{
  path: "src/App.tsx.bak",
  category: "US1",
  sizeBytes: 8455,
  extension: ".bak",
  reasonForRemoval: "Backup from Vue migration, preserved in git history",
  hasImports: false,
  hasBackup: true,
  removalStatus: "pending"
}
```

---

### ValidationResult

Represents the outcome of validation checks after a cleanup operation (build, tests, import checks).

**Attributes**:
- `category` (string): Foreign key to `CleanupCategory.id` (which cleanup this validates)
- `buildSuccess` (boolean): Whether `npm run build` succeeded
- `testSuccess` (boolean): Whether `npm run test` passed
- `importErrors` (array of strings): List of import errors found (empty if none)
- `consoleErrors` (array of strings): Runtime errors from `npm run dev` console (empty if none)
- `timestamp` (ISO 8601 string): When validation was performed
- `overallStatus` (enum): "passed", "failed", "warning"

**Relationships**:
- Belongs to one `CleanupCategory` (one-to-one)

**Example**:
```javascript
{
  category: "US1",
  buildSuccess: true,
  testSuccess: true,
  importErrors: [],
  consoleErrors: [],
  timestamp: "2025-11-10T16:30:00Z",
  overallStatus: "passed"
}
```

---

### CleanupAuditLog

Represents a historical record of all cleanup operations for documentation and rollback purposes.

**Attributes**:
- `id` (string): Unique identifier (UUID or timestamp-based)
- `category` (string): Foreign key to `CleanupCategory.id`
- `filesRemoved` (array of strings): List of file paths that were deleted
- `commitHash` (string): Git commit SHA that recorded the cleanup
- `timestamp` (ISO 8601 string): When cleanup was performed
- `validationStatus` (enum): "passed", "failed", "skipped"
- `rollbackInstructions` (string): Git commands to revert this cleanup (e.g., "git revert <hash>")

**Relationships**:
- Belongs to one `CleanupCategory` (many-to-one)

**Example**:
```javascript
{
  id: "cleanup-us1-20251110-1630",
  category: "US1",
  filesRemoved: ["src/App.tsx.bak", "src/lib/parsers/android/apk-parser.ts.bak"],
  commitHash: "a1b2c3d4e5f6",
  timestamp: "2025-11-10T16:30:00Z",
  validationStatus: "passed",
  rollbackInstructions: "git revert a1b2c3d4e5f6"
}
```

---

## Entity Relationships

```text
CleanupCategory (1) ──┬── (many) FileToRemove
                      │
                      └── (1) ValidationResult

CleanupCategory (1) ── (many) CleanupAuditLog
```

---

## State Transitions

### FileToRemove.removalStatus

```text
pending ──[file deleted]──> removed
pending ──[kept after investigation]──> kept
pending ──[deletion failed]──> error
removed ──[validation failed]──> error (manual intervention required)
```

### ValidationResult.overallStatus

```text
N/A ──[all checks passed]──> passed
N/A ──[any check failed]──> failed
N/A ──[non-critical issues]──> warning
```

---

## Data Persistence

**Storage**: This data model is **documentation-only** and does not require runtime persistence. All information is captured in:

1. **Git commits**: Provide audit trail of removed files
2. **Commit messages**: Document which files were removed and why
3. **This spec directory**: Contains research.md, plan.md, tasks.md, and this data-model.md as static documentation

**No database or runtime storage needed**: This is a one-time cleanup operation, not an ongoing feature with runtime state.

---

## Validation Rules

### FileToRemove Validation
- `path` MUST be a valid file path relative to repository root
- `sizeBytes` MUST be positive integer
- `removalStatus` MUST be one of: "pending", "removed", "kept", "error"
- If `hasImports` is `true`, `reasonForRemoval` MUST justify why removal is safe despite imports

### ValidationResult Validation
- `timestamp` MUST be ISO 8601 formatted
- `overallStatus` MUST be "passed" if both `buildSuccess` and `testSuccess` are true
- `overallStatus` MUST be "failed" if either `buildSuccess` or `testSuccess` is false
- `importErrors` and `consoleErrors` MUST be empty arrays if no errors found (not null)

### CleanupCategory Validation
- `filesTargeted` MUST equal the count of associated `FileToRemove` entities
- `priority` MUST be one of: "P1", "P2", "P3", "P4" (matching spec user story priorities)

---

## Usage Examples

### Example 1: Planning US1 Cleanup (Backup Files)

```javascript
// Define cleanup category
const us1Category = {
  id: "US1",
  name: "Backup Files",
  priority: "P1",
  description: "Remove .bak files from Vue migration",
  filesTargeted: 2,
  estimatedSizeKB: 13
};

// Define files to remove
const filesToRemove = [
  {
    path: "src/App.tsx.bak",
    category: "US1",
    sizeBytes: 8455,
    extension: ".bak",
    reasonForRemoval: "Backup from Vue migration, preserved in git history",
    hasImports: false,
    hasBackup: true,
    removalStatus: "pending"
  },
  {
    path: "src/lib/parsers/android/apk-parser.ts.bak",
    category: "US1",
    sizeBytes: 4938,
    extension: ".bak",
    reasonForRemoval: "Backup from APK parser refactoring, preserved in git history",
    hasImports: false,
    hasBackup: true,
    removalStatus: "pending"
  }
];
```

### Example 2: Recording Validation Results

```javascript
// After removing US1 files and running validation
const us1Validation = {
  category: "US1",
  buildSuccess: true,
  testSuccess: true,
  importErrors: [],
  consoleErrors: [],
  timestamp: "2025-11-10T16:30:00Z",
  overallStatus: "passed"
};

// If validation failed
const us2ValidationFailed = {
  category: "US2",
  buildSuccess: false,
  testSuccess: true,
  importErrors: ["Cannot find module './lib/parsers/ios/types'"],
  consoleErrors: [],
  timestamp: "2025-11-10T16:45:00Z",
  overallStatus: "failed"
};
```

### Example 3: Creating Audit Log

```javascript
const auditLog = {
  id: "cleanup-us1-20251110-1630",
  category: "US1",
  filesRemoved: ["src/App.tsx.bak", "src/lib/parsers/android/apk-parser.ts.bak"],
  commitHash: "a1b2c3d4e5f6",
  timestamp: "2025-11-10T16:30:00Z",
  validationStatus: "passed",
  rollbackInstructions: "git revert a1b2c3d4e5f6"
};
```

---

## Integration with SpecKit Workflow

This data model informs the task breakdown (`tasks.md`) by:

1. **CleanupCategory** → Maps to user story phases in tasks.md
2. **FileToRemove** → Each file becomes a specific task or subtask
3. **ValidationResult** → Defines validation tasks after each cleanup category
4. **CleanupAuditLog** → Informs git commit structure and documentation tasks

---

**Status**: ✅ Complete - Ready for contract definition (Phase 1) and task generation (Phase 2)
