# Feature Specification: Code Cleanup and Organization

**Feature Branch**: `008-code-cleanup`
**Created**: 2025-11-10
**Status**: Draft
**Input**: User description: "create a new branch. I want to do a code cleanup and organization. i.e delete any extra undeeded files. do you get me?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Backup and Obsolete Files (Priority: P1)

As a developer working on the codebase, I need all backup files and obsolete remnants from previous migrations removed so that the repository only contains active, necessary files and reduces confusion about which files are actually in use.

**Why this priority**: Backup files (`.bak`) and obsolete files create confusion, clutter version control history, and may lead developers to edit the wrong files. This is the highest priority because it has zero risk (no dependencies) and immediate clarity benefits.

**Independent Test**: Can be fully tested by verifying that all `.bak` files are deleted and no remaining files have obvious backup patterns (e.g., `.old`, `.backup`, `*-old.*`). Delivers immediate value by cleaning up 13+ KB of dead code and eliminating confusion.

**Acceptance Scenarios**:

1. **Given** the repository contains `App.tsx.bak` and `apk-parser.ts.bak`, **When** cleanup is performed, **Then** these backup files are permanently deleted
2. **Given** a developer searches for active code files, **When** they browse the source directory, **Then** they only see files that are actively used in the application
3. **Given** version control shows historical backup files, **When** cleanup is committed, **Then** future developers won't encounter backup file clutter

---

### User Story 2 - Resolve TypeScript/JavaScript Duplicate Files (Priority: P2)

As a developer, I need the codebase to use a consistent file type (either TypeScript `.ts` or JavaScript `.js`, not both for the same module) so that there's no confusion about which version is authoritative and maintenance is simplified.

**Why this priority**: The codebase has 24+ duplicate file pairs (both `.js` and `.ts` versions), representing ~6,600 lines of duplicated code. This creates significant maintenance burden and confusion. Priority P2 because it requires investigation to determine which versions are actively imported.

**Independent Test**: Can be fully tested by running the build process and verifying all imports resolve correctly after removing duplicate files. Grep the codebase for import statements to confirm only one version (JS or TS) is referenced. Delivers value by eliminating 50% of duplicate code files.

**Acceptance Scenarios**:

1. **Given** a module exists in both `.js` and `.ts` versions, **When** investigation reveals imports use `.js`, **Then** the `.ts` version is removed (or vice versa)
2. **Given** the codebase uses Vue 3 with JavaScript (per CLAUDE.md), **When** cleanup is performed, **Then** only `.js` files remain for duplicated modules
3. **Given** duplicate files are removed, **When** the application is built and run, **Then** all functionality works without import errors
4. **Given** 24 pairs of duplicate files exist, **When** cleanup completes, **Then** only one version of each module remains (24 files deleted)

---

### User Story 3 - Remove Unused State Management Files (Priority: P3)

As a developer, I need obsolete state management implementations (Zustand store from the React era) removed so that the codebase clearly reflects the current architecture (Vue 3 with Pinia) and doesn't confuse new contributors.

**Why this priority**: The project migrated from React to Vue 3 (spec 006), but the old Zustand-based store directory remains. Priority P3 because while it adds clutter, it doesn't actively interfere with development since the Pinia stores are clearly separate.

**Independent Test**: Can be fully tested by verifying no imports reference the `store/` directory (only `stores/` with Pinia), then deleting the old directory and confirming the build succeeds. Delivers value by removing architectural confusion and ~9 KB of dead code.

**Acceptance Scenarios**:

1. **Given** the codebase has both `store/` (Zustand, React) and `stores/` (Pinia, Vue) directories, **When** cleanup is performed, **Then** only the `stores/` directory remains
2. **Given** no active imports reference `store/analysis-store.ts`, **When** the file is deleted, **Then** the application builds and runs successfully
3. **Given** a new developer joins the project, **When** they explore state management, **Then** they only find the Pinia stores and aren't confused by legacy React stores

---

### User Story 4 - Investigate and Clean Potentially Unused Utilities (Priority: P4)

As a developer, I need potentially unused utility files investigated and removed if confirmed unused, so that the codebase doesn't accumulate speculative or deprecated utilities over time.

**Why this priority**: Files like `utils/proptypes.js` appear unused but require investigation to confirm. Priority P4 because false positives could break functionality, so this needs careful verification before deletion.

**Independent Test**: Can be fully tested by searching for imports of the file across the codebase, checking if it's used in any templates or dynamic imports, then deleting and running tests. Delivers value by confirming which utilities are truly dead code.

**Acceptance Scenarios**:

1. **Given** `utils/proptypes.js` has no import statements referencing it, **When** codebase search is performed, **Then** the file is confirmed as unused
2. **Given** a utility file is confirmed unused, **When** it's deleted, **Then** all tests pass and the application functions normally
3. **Given** a utility file is found to be used, **When** investigation completes, **Then** the file is retained and documented as active

---

### Edge Cases

- What happens when a file appears unused but is dynamically imported (e.g., via `import()` or string concatenation)?
- How does the system handle files that are unused in the main app but referenced in test files?
- What if duplicate files (JS/TS) have diverged and contain different logic?
- How do we handle sample files (`sample-files/` with 131 MB) - are they needed for CI/CD or documentation?
- What if backup files were created intentionally for reference during migration?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify and remove all backup files with patterns like `.bak`, `.old`, `.backup`, and similar suffixes
- **FR-002**: System MUST analyze import statements to determine which version (JS or TS) of duplicate files is actively used
- **FR-003**: System MUST remove the unused version of each duplicate file pair after confirming the kept version is imported correctly
- **FR-004**: System MUST verify no imports reference the obsolete `store/` directory (Zustand) before deletion
- **FR-005**: System MUST remove the `store/` directory and its contents after confirming it's unused
- **FR-006**: System MUST search the entire codebase for imports of `utils/proptypes.js` to determine usage status
- **FR-007**: System MUST preserve all actively used files during cleanup (no functional code loss)
- **FR-008**: System MUST validate the build succeeds after each category of cleanup (backup removal, duplicate resolution, store cleanup)
- **FR-009**: System MUST update `.gitignore` if any patterns are discovered that should prevent future backup file commits
- **FR-010**: Cleanup process MUST document which files were removed and why (for audit trail)

### Key Entities

- **Backup File**: A file with a backup-pattern extension (`.bak`, `.old`, `.backup`) that duplicates functionality of an active file
- **Duplicate File Pair**: Two files with identical names but different extensions (`.js` and `.ts`) representing the same module
- **Legacy State Store**: State management implementation from a previous framework (React/Zustand) that has been replaced by a new implementation (Vue/Pinia)
- **Unused Utility**: Helper function or module that is no longer imported or referenced anywhere in the codebase
- **Import Statement**: Code reference that indicates a file is actively used (e.g., `import { foo } from './bar.js'`)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All backup files (`.bak` extensions) are removed from the repository (target: 2 files, 13.4 KB)
- **SC-002**: Duplicate JS/TS file pairs are reduced to single implementations (target: remove 24 duplicate files, ~50% reduction in affected modules)
- **SC-003**: Obsolete state management directory (`store/`) is removed (target: 1 directory, ~9 KB)
- **SC-004**: Application builds successfully without errors after all cleanup operations
- **SC-005**: All existing tests pass after cleanup operations (100% test pass rate maintained)
- **SC-006**: Repository size is reduced by at least 20 KB (excluding sample files)
- **SC-007**: No import errors appear in the console when running the development server after cleanup
- **SC-008**: Code search for backup patterns (`.bak`, `.old`, `.backup`) returns zero results after cleanup
- **SC-009**: Developers can identify the single source of truth for each module without confusion (no duplicate implementations)
- **SC-010**: Documentation or commit message clearly lists all removed files for audit purposes

## Assumptions

1. **Project framework**: The codebase has fully migrated from React to Vue 3 (per spec 006), so React-specific files (Zustand stores) are safe to remove
2. **Import convention**: The codebase uses explicit file extensions in imports (e.g., `.js`), making it possible to determine which version of duplicate files is active
3. **Build system**: The Vite build system will catch any missing imports or broken references during the build process
4. **Test coverage**: Existing tests adequately cover functionality, so test failures will reveal if a "unused" file was actually needed
5. **Sample files**: The `sample-files/` directory (131 MB) is intentionally tracked for manual testing and should not be removed without explicit user confirmation
6. **Backup file intent**: `.bak` files were temporary artifacts from development (e.g., migration work) and are not required for reference
7. **No dynamic imports**: Files are imported using static import statements, not dynamically constructed paths that might hide usage

## Out of Scope

- **Sample file optimization**: The 131 MB `sample-files/` directory is not addressed in this cleanup unless the user explicitly requests it
- **Code refactoring**: Cleanup focuses on file removal, not restructuring or improving existing code logic
- **Performance optimization**: No performance tuning or optimization of existing code (separate concern)
- **Documentation updates**: Existing documentation (README.md, CLAUDE.md) is not updated unless file paths change
- **Dependency cleanup**: Unused npm packages in `package.json` are not addressed (separate dependency audit task)
- **Git history cleanup**: Removed files remain in git history; no git history rewriting or force-push operations
- **Build artifact cleanup**: The `dist/` directory and other build outputs are already in `.gitignore` and not addressed

## Dependencies

- **Spec 006 (Vue Migration)**: This cleanup depends on the Vue migration being complete, as it removes React-era state management files
- **Build system**: Requires Vite to be functional for validation builds after cleanup
- **Test suite**: Depends on existing tests to validate no functionality is broken during cleanup

## Risks

- **False positive unused files**: A file might appear unused but be referenced through dynamic imports or build-time generation
- **Divergent duplicate files**: JS and TS versions of the same module might have diverged during migration, requiring manual merge
- **Breaking imports**: Removing the wrong version of a duplicate file could break imports if the import analysis is incorrect
- **Test gaps**: If test coverage is incomplete, removing "unused" files might break functionality that isn't tested

## Mitigation Strategies

- **Incremental validation**: Run build and tests after each category of cleanup (backup removal, duplicate resolution, store cleanup)
- **Comprehensive search**: Use multiple search methods (grep, IDE find-references, build output analysis) to confirm files are unused
- **Git safety**: All changes are committed in logical groups, making it easy to revert specific cleanup categories if issues arise
- **Manual review**: Present list of files to be removed to user before deletion for final confirmation on ambiguous cases
