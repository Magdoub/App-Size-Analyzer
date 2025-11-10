# Tasks: Code Cleanup and Organization

**Feature Branch**: `008-code-cleanup`
**Input**: Design documents from `/specs/008-code-cleanup/`
**Prerequisites**: spec.md (user stories), plan.md (tech stack), research.md (decisions), data-model.md, contracts/cleanup-operations.md, quickstart.md

**Tests**: Not required - using existing test suite for validation only (no new functionality)

**Testing Tools**: Vitest 2.1.9 + Vue Test Utils 2.4.6 (existing suite)

**Organization**: Tasks are grouped by user story (P1-P4 priorities) to enable sequential execution with validation between each cleanup category.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single project structure (Vue 3 web app):
- Source: `src/` at repository root
- Tests: `src/__tests__/`
- Build: Vite-based, outputs to `dist/`

---

## Phase 1: Setup (Prerequisites Validation)

**Purpose**: Verify project is ready for cleanup operations

- [X] T001 Verify git working directory is clean (no uncommitted changes)
- [X] T002 [P] Verify current branch is `008-code-cleanup`
- [X] T003 [P] Run baseline validation: `npm run build` and `npm run test` must pass
- [X] T004 Document baseline repository size: `du -sh src/` for comparison

**Checkpoint**: All prerequisites validated - cleanup can proceed safely

---

## Phase 2: User Story 1 - Remove Backup Files (Priority: P1) 🎯 Zero-Risk Cleanup

**Goal**: Remove all `.bak` files from Vue 3 migration, reducing repository size by ~13 KB with zero risk

**Independent Test**: Search for `.bak` files returns zero results, build and tests pass

### Investigation for User Story 1

- [X] T005 [US1] Find all backup files: `find src -name "*.bak" -type f` and document paths
- [X] T006 [US1] Verify no imports of backup files: `grep -r "\.bak" src/ --include="*.js" --include="*.vue"`

### Implementation for User Story 1

- [X] T007 [P] [US1] Remove `src/App.tsx.bak` (8,455 bytes)
- [X] T008 [P] [US1] Remove `src/lib/parsers/android/apk-parser.ts.bak` (4,938 bytes)

### Validation for User Story 1

- [X] T009 [US1] Run build validation: `npm run build` must succeed
- [X] T010 [US1] Run test validation: `npm run test` must pass
- [X] T011 [US1] Verify backup files removed: `find src -name "*.bak" -type f` returns zero results

### Commit for User Story 1

- [X] T012 [US1] Commit changes with message: "Remove backup files from Vue migration (US1)" per quickstart.md template

**Checkpoint**: Backup files removed, build and tests pass. ~13 KB saved.

---

## Phase 3: User Story 2 - Resolve JS/TS Duplicate Files (Priority: P2)

**Goal**: Remove TypeScript files with JavaScript equivalents (keep .js per constitution), reducing ~150 KB of duplicate code

**Independent Test**: Only JavaScript files remain (except `src/test/setup.ts`), all imports resolve, build and tests pass

### Investigation for User Story 2

- [ ] T013 [US2] Find all duplicate file pairs: compare `find src -name "*.js"` and `find src -name "*.ts"` outputs
- [ ] T014 [US2] Verify JavaScript versions are actively imported: sample check with `grep -r "from.*breakdown-generator" src/`
- [ ] T015 [US2] Identify special case: confirm `src/test/setup.ts` has no .js equivalent (must keep)

### Implementation for User Story 2

Remove TypeScript files with JavaScript equivalents (keep JavaScript per constitution Principle V):

**lib/analysis/ directory** (4 files):
- [ ] T016 [P] [US2] Remove `src/lib/analysis/breakdown-generator.ts` (keeping .js version)
- [ ] T017 [P] [US2] Remove `src/lib/analysis/index.ts` (keeping .js version)
- [ ] T018 [P] [US2] Remove `src/lib/analysis/insight-rules.ts` (keeping .js version)
- [ ] T019 [P] [US2] Remove `src/lib/analysis/size-thresholds.ts` (keeping .js version)

**lib/parsers/android/ directory** (6 files):
- [ ] T020 [P] [US2] Remove `src/lib/parsers/android/apk-parser.ts` (keeping .js version)
- [ ] T021 [P] [US2] Remove `src/lib/parsers/android/apk-worker.ts` (keeping .js version)
- [ ] T022 [P] [US2] Remove `src/lib/parsers/android/components.ts` (keeping .js version)
- [ ] T023 [P] [US2] Remove `src/lib/parsers/android/dex-parser.ts` (keeping .js version)
- [ ] T024 [P] [US2] Remove `src/lib/parsers/android/index.ts` (keeping .js version)
- [ ] T025 [P] [US2] Remove `src/lib/parsers/android/manifest-parser.ts` (keeping .js version)

**lib/parsers/ios/ directory** (5 files):
- [ ] T026 [P] [US2] Remove `src/lib/parsers/ios/components.ts` (keeping .js version)
- [ ] T027 [P] [US2] Remove `src/lib/parsers/ios/index.ts` (keeping .js version)
- [ ] T028 [P] [US2] Remove `src/lib/parsers/ios/ipa-parser.ts` (keeping .js version)
- [ ] T029 [P] [US2] Remove `src/lib/parsers/ios/ipa-worker.ts` (keeping .js version)
- [ ] T030 [P] [US2] Remove `src/lib/parsers/ios/plist-parser.ts` (keeping .js version)

**lib/parsers/common/ directory** (3 files):
- [ ] T031 [P] [US2] Remove `src/lib/parsers/common/index.ts` (keeping .js version)
- [ ] T032 [P] [US2] Remove `src/lib/parsers/common/shared-parsers.ts` (keeping .js version)
- [ ] T033 [P] [US2] Remove `src/lib/parsers/common/zip-utils.ts` (keeping .js version)

**lib/visualization/ directory** (3 files):
- [ ] T034 [P] [US2] Remove `src/lib/visualization/color-utils.ts` (keeping .js version)
- [ ] T035 [P] [US2] Remove `src/lib/visualization/index.ts` (keeping .js version)
- [ ] T036 [P] [US2] Remove `src/lib/visualization/nivo-tree-adapter.ts` (keeping .js version)

**types/ directory** (4 files):
- [ ] T037 [P] [US2] Remove `src/types/android.ts` (keeping .js version)
- [ ] T038 [P] [US2] Remove `src/types/common.ts` (keeping .js version)
- [ ] T039 [P] [US2] Remove `src/types/index.ts` (keeping .js version)
- [ ] T040 [P] [US2] Remove `src/types/ios.ts` (keeping .js version)

**utils/ directory** (2 files):
- [ ] T041 [P] [US2] Remove `src/utils/file-utils.ts` (keeping .js version)
- [ ] T042 [P] [US2] Remove `src/utils/formatters.ts` (keeping .js version)

**workers/ directory** (2 files):
- [ ] T043 [P] [US2] Remove `src/workers/analysis-worker.ts` (keeping .js version)
- [ ] T044 [P] [US2] Remove `src/workers/parser-worker.ts` (keeping .js version)

**Special case handling**:
- [ ] T045 [US2] Investigate `src/utils/calculations.ts` - check if it has .js equivalent or needs conversion/removal

### Validation for User Story 2

- [ ] T046 [US2] Run build validation: `npm run build` must succeed with no import errors
- [ ] T047 [US2] Run test validation: `npm run test` must pass
- [ ] T048 [US2] Check dev server console: `npm run dev` for 30 seconds, verify no import errors
- [ ] T049 [US2] Verify only JavaScript files remain: `find src -name "*.ts" ! -name "*.test.ts" ! -name "setup.ts"` returns empty (or only calculations.ts if converted)

### Commit for User Story 2

- [ ] T050 [US2] Commit changes with message: "Remove TypeScript duplicates, keep JavaScript only (US2)" per quickstart.md template

**Checkpoint**: TypeScript duplicates removed, only JavaScript remains (+ setup.ts for Vitest), build and tests pass. ~150 KB saved.

---

## Phase 4: User Story 3 - Remove Legacy Store Directory (Priority: P3)

**Goal**: Remove `src/store/` directory (Zustand/React era), superseded by `src/stores/` (Pinia/Vue 3)

**Independent Test**: `src/store/` directory does not exist, no imports reference it, build and tests pass

### Investigation for User Story 3

- [ ] T051 [US3] Verify no active imports of `store/` directory: `grep -r "from.*['\"].*store/" src/ --include="*.js" --include="*.vue" | grep -v ".bak"`
- [ ] T052 [US3] Review directory contents: `ls -la src/store/` to confirm only `analysis-store.ts` exists

### Implementation for User Story 3

- [ ] T053 [US3] Remove legacy store directory: `rm -rf src/store/` (contains `analysis-store.ts`, 8,899 bytes)

### Validation for User Story 3

- [ ] T054 [US3] Run build validation: `npm run build` must succeed
- [ ] T055 [US3] Run test validation: `npm run test` must pass
- [ ] T056 [US3] Verify directory removed: `ls src/store 2>/dev/null` returns "No such file or directory"

### Commit for User Story 3

- [ ] T057 [US3] Commit changes with message: "Remove legacy Zustand store directory (US3)" per quickstart.md template

**Checkpoint**: Legacy React/Zustand store removed, only Pinia stores remain, build and tests pass. ~9 KB saved.

---

## Phase 5: User Story 4 - Investigate and Remove Unused Utilities (Priority: P4)

**Goal**: Remove `src/utils/proptypes.js` (React PropTypes remnant), confirmed unused in Vue 3

**Independent Test**: `proptypes.js` does not exist, no imports reference it, build and tests pass

### Investigation for User Story 4

- [ ] T058 [US4] Search for static imports of proptypes: `grep -r "proptypes" src/ --include="*.js" --include="*.vue"`
- [ ] T059 [US4] Search for dynamic imports of proptypes: `grep -r "import(" src/ | grep "proptypes"` and `grep -r "require(" src/ | grep "proptypes"`
- [ ] T060 [US4] Confirm file exists and document size: `ls -lh src/utils/proptypes.js`

### Implementation for User Story 4

- [ ] T061 [US4] Remove unused proptypes utility: `rm src/utils/proptypes.js`

### Validation for User Story 4

- [ ] T062 [US4] Run build validation: `npm run build` must succeed
- [ ] T063 [US4] Run test validation: `npm run test` must pass
- [ ] T064 [US4] Check dev server console: `npm run dev` for 30 seconds, verify no runtime errors
- [ ] T065 [US4] Verify file removed: `ls src/utils/proptypes.js 2>/dev/null` returns "No such file or directory"

### Commit for User Story 4

- [ ] T066 [US4] Commit changes with message: "Remove unused proptypes utility (US4)" per quickstart.md template

**Checkpoint**: Unused React PropTypes utility removed, build and tests pass. ~3 KB saved.

---

## Phase 6: Final Validation & Documentation

**Purpose**: Verify all cleanup goals achieved and document results

### Post-Cleanup Verification

- [ ] T067 Verify no backup files remain: `find src -name "*.bak" -type f` returns zero results (SC-008)
- [ ] T068 Verify TypeScript duplicates resolved: `find src -name "*.ts" ! -name "*.test.ts" ! -name "setup.ts"` returns zero or only calculations.ts
- [ ] T069 Verify legacy store removed: `ls src/store 2>/dev/null` returns error (SC-003)
- [ ] T070 Verify proptypes removed: `ls src/utils/proptypes.js 2>/dev/null` returns error
- [ ] T071 Run final build validation: `npm run build` must succeed (SC-004)
- [ ] T072 Run final test validation: `npm run test` must pass (SC-005)
- [ ] T073 Measure repository size reduction: compare `du -sh src/` to baseline from T004 (SC-006: expect ~125-180 KB reduction)

### Documentation & Audit Trail

- [ ] T074 [P] Update `.gitignore` to prevent future backup files: add patterns `*.bak`, `*.old`, `*.backup` (FR-009)
- [ ] T075 [P] Document removed files in commit history: verify all 4 commits exist with proper messages (SC-010)
- [ ] T076 Review git log for cleanup commits: `git log --oneline --since="1 day ago"` shows all 4 user story commits

### Success Criteria Checklist Verification

- [ ] T077 Validate all 10 success criteria from spec.md are met (SC-001 through SC-010)

**Checkpoint**: All cleanup complete, all success criteria met, repository cleaned of obsolete code.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup validation - MUST complete before US2
- **User Story 2 (Phase 3)**: Depends on US1 completion and commit - MUST complete before US3
- **User Story 3 (Phase 4)**: Depends on US2 completion and commit - MUST complete before US4
- **User Story 4 (Phase 5)**: Depends on US3 completion and commit - MUST complete before final validation
- **Final Validation (Phase 6)**: Depends on all user stories (US1-US4) being complete

### User Story Dependencies

**CRITICAL: User stories MUST be executed sequentially (not parallel) due to validation gates between each category**

- **User Story 1 (P1)**: Can start after Setup - No dependencies on other cleanup stories
- **User Story 2 (P2)**: MUST wait for US1 commit - Validates that backup removal didn't affect build
- **User Story 3 (P3)**: MUST wait for US2 commit - Validates that TS removal didn't break imports before removing stores
- **User Story 4 (P4)**: MUST wait for US3 commit - Validates that store removal didn't affect utilities

**Rationale for sequential execution**: Each cleanup category requires build + test validation before proceeding to the next. This ensures that if validation fails, we know exactly which category caused the issue and can rollback that specific commit.

### Within Each User Story

#### User Story 1 (Backup Files):
- Investigation tasks (T005-T006) MUST complete first
- File removal tasks (T007-T008) marked [P] can run in parallel (different files)
- Validation tasks (T009-T011) MUST run sequentially after removal
- Commit (T012) MUST be last

#### User Story 2 (JS/TS Duplicates):
- Investigation tasks (T013-T015) MUST complete first
- File removal tasks (T016-T045) marked [P] can run in parallel (different files across different directories)
- Special case handling (T045) should complete before validation
- Validation tasks (T046-T049) MUST run sequentially after removal
- Commit (T050) MUST be last

#### User Story 3 (Legacy Store):
- Investigation tasks (T051-T052) MUST complete first
- Directory removal (T053) is single task
- Validation tasks (T054-T056) MUST run sequentially after removal
- Commit (T057) MUST be last

#### User Story 4 (Unused Utilities):
- Investigation tasks (T058-T060) MUST complete first
- File removal (T061) is single task
- Validation tasks (T062-T065) MUST run sequentially after removal
- Commit (T066) MUST be last

#### Final Validation:
- Verification tasks (T067-T073) MUST run after all user stories complete
- Documentation tasks (T074-T076) marked [P] can run in parallel (different files/concerns)
- Final checklist validation (T077) MUST be last

### Parallel Opportunities

**Within User Story 2 (largest parallel opportunity)**:
- Tasks T016-T044 (29 file removals) can ALL run in parallel since they target different files in different directories
- Example: Can remove all 4 files from `lib/analysis/` + all 6 from `lib/parsers/android/` + all 5 from `lib/parsers/ios/` simultaneously

**Within Final Validation**:
- Tasks T074-T076 (documentation updates) can run in parallel since they affect different concerns (.gitignore, git history review)

**NOT parallel**:
- User stories cannot run in parallel (must be sequential with validation gates)
- Investigation → Implementation → Validation → Commit must be sequential within each story

---

## Parallel Example: User Story 2 (TypeScript Duplicates Removal)

```bash
# Launch all TypeScript duplicate removals together (Tasks T016-T044):
# lib/analysis/ (4 files in parallel)
Task: "Remove src/lib/analysis/breakdown-generator.ts"
Task: "Remove src/lib/analysis/index.ts"
Task: "Remove src/lib/analysis/insight-rules.ts"
Task: "Remove src/lib/analysis/size-thresholds.ts"

# lib/parsers/android/ (6 files in parallel)
Task: "Remove src/lib/parsers/android/apk-parser.ts"
Task: "Remove src/lib/parsers/android/apk-worker.ts"
Task: "Remove src/lib/parsers/android/components.ts"
Task: "Remove src/lib/parsers/android/dex-parser.ts"
Task: "Remove src/lib/parsers/android/index.ts"
Task: "Remove src/lib/parsers/android/manifest-parser.ts"

# ... (continue for all 29 files marked [P])
# Total: 29 file removal tasks can execute simultaneously
```

---

## Implementation Strategy

### Sequential Cleanup with Validation Gates (REQUIRED)

This is NOT a typical MVP-first workflow. All 4 user stories must be completed sequentially with validation between each:

1. **Complete Phase 1**: Setup and baseline validation
2. **Complete Phase 2**: User Story 1 (Backup Files) → Validate → Commit
3. **GATE**: If validation fails, stop and rollback US1 before proceeding
4. **Complete Phase 3**: User Story 2 (JS/TS Duplicates) → Validate → Commit
5. **GATE**: If validation fails, stop and rollback US2 before proceeding
6. **Complete Phase 4**: User Story 3 (Legacy Store) → Validate → Commit
7. **GATE**: If validation fails, stop and rollback US3 before proceeding
8. **Complete Phase 5**: User Story 4 (Unused Utilities) → Validate → Commit
9. **GATE**: If validation fails, stop and rollback US4 before proceeding
10. **Complete Phase 6**: Final validation and documentation

### Incremental Commits (CRITICAL)

Each user story gets its own commit:
1. Commit after US1 → "Remove backup files from Vue migration (US1)"
2. Commit after US2 → "Remove TypeScript duplicates, keep JavaScript only (US2)"
3. Commit after US3 → "Remove legacy Zustand store directory (US3)"
4. Commit after US4 → "Remove unused proptypes utility (US4)"

This enables **precise rollback** if any category breaks the build:
```bash
# If US2 breaks something, rollback just that commit:
git revert <us2-commit-hash>

# If US3 and US4 break something, rollback those two:
git revert <us4-commit-hash>
git revert <us3-commit-hash>
```

### Rollback Procedures

See `quickstart.md` section "Rollback Procedures" for detailed git revert commands.

---

## Notes

- **[P] tasks**: Different files, no dependencies, can execute in parallel
- **[Story] labels**: Map tasks to user stories for traceability (US1, US2, US3, US4)
- **Sequential user stories**: CANNOT parallelize cleanup categories due to validation gates
- **Commit after each story**: Required for precise rollback if validation fails
- **Validation is mandatory**: Build + tests MUST pass after each story before proceeding
- **Success criteria**: All 10 criteria from spec.md (SC-001 through SC-010) must be verified in Phase 6
- **Zero functionality loss**: FR-007 mandates no active code is removed, only dead code
- **Constitution alignment**: US2 directly implements constitution Principle V (JavaScript-only)

---

## Task Count Summary

- **Total tasks**: 77
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (US1 - Backup Files)**: 8 tasks
- **Phase 3 (US2 - JS/TS Duplicates)**: 38 tasks (29 parallelizable file removals)
- **Phase 4 (US3 - Legacy Store)**: 7 tasks
- **Phase 5 (US4 - Unused Utilities)**: 9 tasks
- **Phase 6 (Final Validation)**: 11 tasks

**Parallel opportunities**: 29 file removal tasks in US2 can execute simultaneously (T016-T044)

**MVP scope**: Not applicable - all 4 user stories must complete in sequence for comprehensive cleanup

**Format validation**: ✅ All tasks follow required format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

---

**Status**: ✅ Ready for implementation via `/speckit.implement`
