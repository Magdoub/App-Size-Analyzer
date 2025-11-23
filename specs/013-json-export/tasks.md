# Tasks: JSON Export for File Breakdown

**Feature**: 013-json-export
**Input**: Design documents from `/specs/013-json-export/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Testing Tools**: Vitest 2.1.9 for unit tests, Vue Test Utils 2.4.6 for component tests

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic library structure

- [X] T001 Create export library directory structure at src/lib/export/
- [X] T002 Create test directory for export library at src/lib/export/
- [X] T003 [P] Create UI store flag for export modal in src/stores/uiStore.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core export library functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement flattenBreakdownTree() function in src/lib/export/json-generator.js
- [X] T005 Implement buildExportMetadata() function in src/lib/export/json-generator.js
- [X] T006 Implement validateExportData() function in src/lib/export/json-generator.js
- [X] T007 Implement generateExportJSON() function in src/lib/export/json-generator.js
- [X] T008 [P] Write unit test for flattenBreakdownTree() in src/lib/export/json-generator.test.js
- [X] T009 [P] Write unit test for buildExportMetadata() in src/lib/export/json-generator.test.js
- [X] T010 [P] Write unit test for validateExportData() in src/lib/export/json-generator.test.js
- [X] T011 [P] Write unit test for generateExportJSON() in src/lib/export/json-generator.test.js

**Checkpoint**: Core export library ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View JSON Breakdown (Priority: P1) 🎯 MVP

**Goal**: Users can view the complete file breakdown in formatted JSON within the app

**Independent Test**: Upload an app binary (IPA/APK/AAB), click "Export JSON" button, verify modal displays formatted JSON with all files and metadata within 2 seconds

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement highlightJSON() function in src/lib/export/json-generator.js
- [X] T013 [P] [US1] Create JsonExportButton component in src/components/breakdown/JsonExportButton.vue
- [X] T014 [P] [US1] Create JsonExportModal component skeleton in src/components/breakdown/JsonExportModal.vue
- [X] T015 [US1] Implement JSON generation in JsonExportModal on modal open in src/components/breakdown/JsonExportModal.vue
- [X] T016 [US1] Add syntax highlighting display to JsonExportModal in src/components/breakdown/JsonExportModal.vue
- [X] T017 [US1] Add JsonExportButton to BreakdownView header in src/components/breakdown/BreakdownView.vue
- [X] T018 [US1] Add modal visibility toggle to uiStore in src/stores/uiStore.js
- [X] T019 [US1] Add CSS styles for JSON syntax highlighting in src/components/breakdown/JsonExportModal.vue
- [X] T020 [US1] Write unit test for highlightJSON() in src/lib/export/json-generator.test.js
- [ ] T021 [US1] Write component test for JsonExportModal display in src/__tests__/components/JsonExportModal.test.js

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view formatted JSON in a modal

---

## Phase 4: User Story 2 - Copy JSON to Clipboard (Priority: P2)

**Goal**: Users can copy the entire JSON breakdown to clipboard with a single click

**Independent Test**: Open JSON modal, click "Copy to Clipboard" button, verify success toast appears, paste into text editor and confirm valid JSON

### Implementation for User Story 2

- [X] T022 [P] [US2] Implement copyToClipboard() function with modern Clipboard API in src/lib/export/json-generator.js
- [X] T023 [P] [US2] Implement legacy execCommand fallback in copyToClipboard() in src/lib/export/json-generator.js
- [X] T024 [US2] Add "Copy to Clipboard" button to JsonExportModal footer in src/components/breakdown/JsonExportModal.vue
- [X] T025 [US2] Implement copy button click handler in JsonExportModal in src/components/breakdown/JsonExportModal.vue
- [X] T026 [US2] Add toast notification component to JsonExportModal in src/components/breakdown/JsonExportModal.vue
- [X] T027 [US2] Add success/error message display logic in src/components/breakdown/JsonExportModal.vue
- [X] T028 [US2] Write unit test for copyToClipboard() modern API path in src/lib/export/json-generator.test.js
- [X] T029 [US2] Write unit test for copyToClipboard() legacy fallback path in src/lib/export/json-generator.test.js
- [ ] T030 [US2] Write component test for copy button interaction in src/__tests__/components/JsonExportModal.test.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can view and copy JSON

---

## Phase 5: User Story 3 - Download JSON File (Priority: P3)

**Goal**: Users can download the JSON breakdown as a file for long-term storage and external processing

**Independent Test**: Open JSON modal, click "Download JSON" button, verify file downloads with descriptive filename format {appName}-breakdown-{timestamp}.json and contains valid JSON

### Implementation for User Story 3

- [X] T031 [P] [US3] Implement generateExportFilename() function in src/lib/export/json-generator.js
- [X] T032 [P] [US3] Implement downloadJSONFile() function in src/lib/export/json-generator.js
- [X] T033 [US3] Add "Download JSON" button to JsonExportModal footer in src/components/breakdown/JsonExportModal.vue
- [X] T034 [US3] Implement download button click handler in JsonExportModal in src/components/breakdown/JsonExportModal.vue
- [X] T035 [US3] Add download success notification in src/components/breakdown/JsonExportModal.vue
- [X] T036 [US3] Write unit test for generateExportFilename() with various app names in src/lib/export/json-generator.test.js
- [X] T037 [US3] Write unit test for downloadJSONFile() in src/lib/export/json-generator.test.js
- [ ] T038 [US3] Write component test for download button interaction in src/__tests__/components/JsonExportModal.test.js

**Checkpoint**: All user stories should now be independently functional - complete export workflow (view, copy, download)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production quality

- [X] T039 [P] Add error handling for JSON generation failures in JsonExportModal in src/components/breakdown/JsonExportModal.vue
- [X] T040 [P] Add loading state during JSON generation for large files in src/components/breakdown/JsonExportModal.vue
- [X] T041 [P] Add accessibility attributes (ARIA labels) to export buttons and modal in src/components/breakdown/JsonExportModal.vue
- [ ] T042 [P] Test export with large app (10,000+ files) and measure performance
- [ ] T043 [P] Test export across browsers (Chrome, Firefox, Safari, Edge)
- [ ] T044 [P] Verify export with special characters in file paths (Unicode, quotes, backslashes)
- [X] T045 [P] Add keyboard shortcuts for modal close (Escape key) in src/components/breakdown/JsonExportModal.vue
- [ ] T046 Run quickstart.md validation - verify all code examples work
- [X] T047 Update CLAUDE.md with export feature in Active Technologies section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 - Requires JsonExportModal component from US1
- **User Story 3 (P3)**: Depends on User Story 1 - Requires JsonExportModal component from US1
  - US2 and US3 can run in parallel after US1 is complete

### Within Each User Story

- Library functions (json-generator.js) before Vue components
- Component skeleton before feature implementation
- Core functionality before tests
- Tests can run in parallel if marked [P]

### Parallel Opportunities

- **Phase 1**: All setup tasks marked [P] can run in parallel
- **Phase 2**: Tests (T008-T011) can run in parallel after implementations (T004-T007)
- **User Story 1**: T012 (highlightJSON) and T013 (JsonExportButton) can run in parallel
- **User Story 2**: T022 (copyToClipboard modern) and T023 (legacy fallback) can run together
- **User Story 3**: T031 (generateExportFilename) and T032 (downloadJSONFile) can run in parallel
- **Phase 6**: All polish tasks marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# After core functions are implemented (T004-T007), launch all tests together:
Task T008: "Write unit test for flattenBreakdownTree() in src/lib/export/json-generator.test.js"
Task T009: "Write unit test for buildExportMetadata() in src/lib/export/json-generator.test.js"
Task T010: "Write unit test for validateExportData() in src/lib/export/json-generator.test.js"
Task T011: "Write unit test for generateExportJSON() in src/lib/export/json-generator.test.js"
```

## Parallel Example: User Story 2

```bash
# Implement both clipboard methods together (different code sections):
Task T022: "Implement copyToClipboard() with modern Clipboard API in src/lib/export/json-generator.js"
Task T023: "Implement legacy execCommand fallback in copyToClipboard() in src/lib/export/json-generator.js"

# Run all tests together:
Task T028: "Write unit test for copyToClipboard() modern API path"
Task T029: "Write unit test for copyToClipboard() legacy fallback path"
Task T030: "Write component test for copy button interaction"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently with real app files
5. Deploy/demo JSON viewing feature

### Incremental Delivery

1. Complete Setup + Foundational → Export library ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - view JSON!)
3. Add User Story 2 → Test independently → Deploy/Demo (copy feature!)
4. Add User Story 3 → Test independently → Deploy/Demo (download feature!)
5. Add Polish → Final testing → Production release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (view JSON)
   - Then Developer A moves to Polish tasks
3. After User Story 1 is complete:
   - Developer B: User Story 2 (copy to clipboard)
   - Developer C: User Story 3 (download file)
4. Stories complete and integrate independently

---

## Task Summary

- **Total Tasks**: 47
- **Setup Phase**: 3 tasks
- **Foundational Phase**: 8 tasks (4 implementations + 4 tests)
- **User Story 1**: 10 tasks (view JSON - P1 MVP)
- **User Story 2**: 9 tasks (copy to clipboard - P2)
- **User Story 3**: 8 tasks (download file - P3)
- **Polish Phase**: 9 tasks (cross-cutting improvements)

**Parallel Opportunities**: 22 tasks marked [P] can run concurrently

**Suggested MVP Scope**: Setup + Foundational + User Story 1 = 21 tasks (~60% of work, delivers core value)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- Library-first approach: Core functions (json-generator.js) are independent of Vue/Pinia
- All JSON generation happens client-side using native browser APIs (no external dependencies)
- Performance target: <2s for apps with 5,000 files, <100ms UI response for copy/download

---

## Validation Checklist

Before marking this feature complete, verify:

- [ ] All 47 tasks completed and checked off
- [ ] JSON displays in modal with syntax highlighting (US1)
- [ ] Copy to clipboard works across Chrome, Firefox, Safari, Edge (US2)
- [ ] Download saves file with correct filename format (US3)
- [ ] Export works with large apps (10,000+ files) without freezing UI
- [ ] Special characters in file paths are handled correctly
- [ ] All unit tests pass (80%+ code coverage for library functions)
- [ ] All component tests pass (70%+ code coverage)
- [ ] Manual testing completed across browsers
- [ ] Quickstart.md examples validated
- [ ] CLAUDE.md updated with feature documentation
