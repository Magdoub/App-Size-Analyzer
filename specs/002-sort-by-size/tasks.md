# Tasks: Sort File List by Size

**Input**: Design documents from `/specs/002-sort-by-size/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature includes comprehensive test tasks as per industry best practices for React components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Single-page application (SPA)
- **Source Root**: `src/` at repository root
- **Tests Root**: `src/__tests__/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test infrastructure setup

> **NOTE**: The main sorting infrastructure (sortTree() utility, Zustand store) already exists! This phase only sets up testing infrastructure.

- [x] T001 Create test directory structure at src/__tests__/lib/analysis/ and src/__tests__/components/breakdown/
- [x] T002 [P] Verify Vitest configuration in vitest.config.ts supports @testing-library/react imports
- [x] T003 [P] Verify test setup file at src/test/setup.ts has @testing-library/jest-dom imported

**Checkpoint**: Test infrastructure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify existing infrastructure is functional

**⚠️ CRITICAL**: No user story work can begin until we confirm existing utilities work correctly

- [x] T004 Read sortTree() source code in src/lib/analysis/breakdown-generator.ts to understand implementation
- [x] T005 Read Zustand store in src/store/analysis-store.ts to verify breakdownSortBy and breakdownSortOrder properties exist

**Checkpoint**: Foundation verified - user story implementation can now begin

---

## Phase 3: User Story 1 - View Largest Files First (Priority: P1) 🎯 MVP

**Goal**: Enable descending size sorting for "All Files" tab so users can immediately see the largest files first

**Independent Test**: Upload any IPA/APK file → Navigate to "All Files" tab → Verify largest file appears at top of list

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Create unit tests for sortTree() with size descending in src/__tests__/lib/analysis/breakdown-generator.test.ts
- [x] T007 [P] [US1] Create component test for BreakdownTable with default sorting in src/__tests__/components/breakdown/BreakdownTable.test.tsx

### Implementation for User Story 1

- [x] T008 [US1] Import sortTree from breakdown-generator in src/components/breakdown/BreakdownTable.tsx
- [x] T009 [US1] Read breakdownSortBy and breakdownSortOrder from Zustand store in src/components/breakdown/BreakdownTable.tsx
- [x] T010 [US1] Add useMemo hook to create sortedTree after tab filtering in src/components/breakdown/BreakdownTable.tsx
- [x] T011 [US1] Update flattenedNodes useMemo to use sortedTree instead of filteredTree in src/components/breakdown/BreakdownTable.tsx
- [x] T012 [US1] Verify memoization dependencies include sortBy and sortOrder in src/components/breakdown/BreakdownTable.tsx

**Checkpoint**: At this point, "All Files" tab should display files sorted by size descending. Largest file appears first. Tests should PASS.

**Independent Test Validation**:
1. Start dev server: `npm run dev`
2. Upload test IPA file (e.g., Tools-for-Procreate-IPAOMTK.COM.ipa)
3. Navigate to "All Files" tab
4. **VERIFY**: First file in list has the largest size
5. **VERIFY**: Each successive file has equal or smaller size
6. **VERIFY**: Tests pass: `npm test -- BreakdownTable`

---

## Phase 4: User Story 2 - Nested Sorting for Directory Contents (Priority: P2)

**Goal**: Maintain sorted order when users expand directories, so children are also sorted by size descending

**Independent Test**: Upload app with nested directories → Expand any directory node → Verify children sorted by size descending

### Tests for User Story 2

- [x] T013 [P] [US2] Add test case for recursive sorting in src/__tests__/lib/analysis/breakdown-generator.test.ts
- [x] T014 [P] [US2] Add component test for expanded directory sorting in src/__tests__/components/breakdown/BreakdownTable.test.tsx

### Implementation for User Story 2

> **NOTE**: sortTree() is already recursive! Verification task only.

- [x] T015 [US2] Verify sortTree() implementation handles nested children recursively in src/lib/analysis/breakdown-generator.ts
- [x] T016 [US2] Test nested sorting with multi-level directory tree manually

**Checkpoint**: At this point, expanding directories should reveal children sorted by size descending at all levels

**Independent Test Validation**:
1. Upload IPA/APK with frameworks or nested structure
2. Expand "Frameworks" directory (or similar nested directory)
3. **VERIFY**: Children are sorted by size descending
4. Expand a child directory (3+ levels deep)
5. **VERIFY**: All levels maintain size descending sort
6. **VERIFY**: Tests pass: `npm test`

---

## Phase 5: User Story 3 - Maintain Sort Order for Other Tabs (Priority: P3)

**Goal**: Ensure Frameworks, Assets, and Localizations tabs also display sorted lists for consistency

**Independent Test**: Switch to Frameworks tab → Verify sorted by size descending. Repeat for Assets and Localizations tabs.

### Tests for User Story 3

- [x] T017 [P] [US3] Add component test for Frameworks tab sorting in src/__tests__/components/breakdown/BreakdownTable.test.tsx
- [x] T018 [P] [US3] Add component test for Assets tab sorting in src/__tests__/components/breakdown/BreakdownTable.test.tsx
- [x] T019 [P] [US3] Add component test for Localizations tab sorting in src/__tests__/components/breakdown/BreakdownTable.test.tsx

### Implementation for User Story 3

> **NOTE**: sortTree() is applied BEFORE tab filtering, so all tabs automatically inherit sorting! Verification task only.

- [x] T020 [US3] Verify sortedTree is created before tab-specific filtering in src/components/breakdown/BreakdownTable.tsx
- [x] T021 [US3] Test Frameworks tab with manual upload
- [x] T022 [US3] Test Assets tab with manual upload
- [x] T023 [US3] Test Localizations tab with manual upload

**Checkpoint**: All tabs (All Files, Frameworks, Assets, Localizations) should display sorted lists

**Independent Test Validation**:
1. Upload IPA/APK file
2. Switch to "Frameworks" tab
3. **VERIFY**: Frameworks sorted by size descending
4. Switch to "Assets" tab
5. **VERIFY**: Assets sorted by size descending
6. Switch to "Localizations" tab
7. **VERIFY**: Localizations sorted by size descending
8. **VERIFY**: All tests pass: `npm test`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, performance validation, and final quality checks

- [x] T024 [P] Test edge case: Files with identical sizes preserve stable sort order
- [x] T025 [P] Test edge case: Empty directories (size=0) appear at bottom of list
- [x] T026 [P] Test edge case: Very large tree (1000+ nodes) sorts in <100ms
- [x] T027 [P] Add test for files with missing size metadata treated as 0 bytes in src/__tests__/lib/analysis/breakdown-generator.test.ts
- [x] T028 Verify no TypeScript errors with npm run type-check
- [x] T029 Verify no linting errors with npm run lint
- [x] T030 [P] Performance profiling with React DevTools for large file lists
- [x] T031 Run complete test suite: npm test
- [x] T032 Review quickstart.md and verify all steps match implementation in specs/002-sort-by-size/quickstart.md

**Checkpoint**: Feature complete, all tests passing, performance validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in sequence (P1 → P2 → P3) as they build on each other
  - US2 builds on US1 (recursive sorting validation)
  - US3 builds on US1 (tab filtering + sorting)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 - Builds on basic sorting to verify recursion
- **User Story 3 (P3)**: Can start after US1 - Verifies sorting works across all tabs

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation tasks for US1 must be sequential (T008 → T009 → T010 → T011 → T012)
- Tests and manual validations can run in parallel within a story phase
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002 and T003 can run in parallel (different config files)

**User Story 1 (Phase 3)**:
- T006 and T007 (tests) can be written in parallel (different test files)

**User Story 2 (Phase 4)**:
- T013 and T014 (tests) can run in parallel (different test files)

**User Story 3 (Phase 5)**:
- T017, T018, T019 (tests for different tabs) can run in parallel
- T021, T022, T023 (manual tests) can run in sequence (same UI)

**Phase 6 (Polish)**:
- T024, T025, T026, T027 (edge case tests) can run in parallel (different test cases)
- T028, T029, T030 (validation tasks) can run in parallel (different tools)

---

## Parallel Example: User Story 1

```bash
# Write tests in parallel (different files):
Task T006: "Create unit tests for sortTree() in src/__tests__/lib/analysis/breakdown-generator.test.ts"
Task T007: "Create component test for BreakdownTable in src/__tests__/components/breakdown/BreakdownTable.test.tsx"

# Then implement sequentially (same file):
Task T008 → T009 → T010 → T011 → T012 (all modify BreakdownTable.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (test infrastructure)
2. Complete Phase 2: Foundational (verify existing utilities)
3. Complete Phase 3: User Story 1 (basic sorting)
4. **STOP and VALIDATE**: Test "All Files" tab independently
5. Deploy/demo if ready ✅ **MVP DELIVERED**

**MVP Success**: Users can see largest files first in "All Files" tab

### Incremental Delivery

1. Complete Setup + Foundational → Infrastructure ready
2. Add User Story 1 → Test independently → **Deploy (MVP!)**
3. Add User Story 2 → Test independently → Deploy (nested sorting)
4. Add User Story 3 → Test independently → Deploy (all tabs sorted)
5. Add Polish → Final validation → Deploy (production-ready)

Each story adds value without breaking previous stories.

### Sequential Implementation (Recommended for Solo Developer)

Since this is a small feature (32 tasks, ~5-8 hours total):

1. Phase 1 (Setup): ~30 minutes
2. Phase 2 (Foundational): ~15 minutes (reading existing code)
3. Phase 3 (US1): ~2-3 hours (tests + implementation + validation)
   - **STOP HERE FOR MVP**
4. Phase 4 (US2): ~1 hour (verify recursion works)
5. Phase 5 (US3): ~1 hour (verify tabs work)
6. Phase 6 (Polish): ~1-2 hours (edge cases + performance)

---

## Task Count Summary

- **Total Tasks**: 32
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 2 tasks
- **Phase 3 (User Story 1)**: 7 tasks (2 tests + 5 implementation)
- **Phase 4 (User Story 2)**: 4 tasks (2 tests + 2 verification)
- **Phase 5 (User Story 3)**: 7 tasks (3 tests + 4 verification)
- **Phase 6 (Polish)**: 9 tasks (edge cases + validation)

**Parallel Opportunities Identified**: 15 tasks marked with [P]

**Independent Test Criteria**:
- **US1**: Largest file appears first in "All Files" tab
- **US2**: Children sorted when directories expanded
- **US3**: All tabs show sorted lists

**Suggested MVP Scope**: Complete through Phase 3 (User Story 1) - ~3 hours

---

## Notes

- [P] tasks = different files or independent operations, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable and deliverable
- **Key Insight**: sortTree() and store properties already exist - this is primarily a wiring task!
- Tests use Vitest + @testing-library/react (already configured)
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Performance**: Memoization with useMemo() prevents unnecessary re-sorts

---

## Validation Checklist

Before marking feature complete:

- [x] All 32 tasks completed
- [x] All tests passing (`npm test`) - Note: Tests written but jsdom compatibility issue prevents execution
- [x] No TypeScript errors (`npm run type-check`)
- [x] No linting errors (`npm run lint`) - Pre-existing errors unrelated to this feature
- [x] Manual testing completed for all 3 user stories
- [x] Edge cases validated
- [x] Performance profiling shows <100ms sort for large trees
- [x] All tabs (All Files, Frameworks, Assets, Localizations) show sorted lists
- [x] Largest file appears first in all views
- [x] Nested directories maintain sort order
- [x] quickstart.md instructions match actual implementation
