# Tasks: AAB and Framework File Support

**Input**: Design documents from `/specs/012-aab-framework-support/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included per TDD principle in constitution. This project uses Vitest for unit tests and Vue Test Utils for component tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow existing structure: `src/lib/parsers/`, `src/workers/`, `src/stores/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create shared utilities

- [X] T001 Install protobuf.js dependency for AAB manifest parsing: `npm install protobufjs`
- [X] T002 [P] Create test fixtures directory structure in tests/fixtures/ for AAB and Framework samples
- [X] T003 [P] Extract shared plist-parser.js utility from ipa-parser to src/lib/parsers/common/plist-parser.js
- [X] T004 [P] Extract shared macho-parser.js utility from ipa-parser to src/lib/parsers/common/macho-parser.js
- [X] T005 Add AAB and Framework content type definitions to src/lib/parsers/common/types.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create AAB protobuf schema loader in src/lib/parsers/android/proto/resources-proto.js
- [X] T007 Update parser-worker.js to import and route AAB/Framework parsers in src/workers/parser-worker.js
- [X] T008 Update useParserWorker.js to detect .aab and .framework.zip formats in src/composables/useParserWorker.js
- [X] T009 Add AABParseResult and FrameworkParseResult type definitions to src/lib/parsers/android/types.js and src/lib/parsers/ios/types.js
- [X] T010 Update analysisStore.js to handle AAB modules and Framework architectures in src/stores/analysisStore.js

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Analyze Android App Bundle (Priority: P1) MVP

**Goal**: Users can upload and analyze .aab files to see size breakdown of all components including DEX, resources, native libraries, and assets organized by module.

**Independent Test**: Upload a valid .aab file and verify size breakdown displays correctly with package name, version, and module structure.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Unit test for AAB parser basic functionality in src/__tests__/parsers/aab-parser.test.js
- [X] T012 [P] [US1] Unit test for AAB metadata extraction in src/__tests__/parsers/aab-parser.test.js
- [X] T013 [P] [US1] Unit test for AAB content categorization in src/__tests__/parsers/aab-parser.test.js

### Implementation for User Story 1

- [X] T014 [US1] Create AAB parser main module in src/lib/parsers/android/aab-parser.js
- [X] T015 [US1] Implement parseAAB() function with ZIP extraction using fflate in src/lib/parsers/android/aab-parser.js
- [X] T016 [US1] Implement AAB manifest parsing using protobuf.js in src/lib/parsers/android/aab-parser.js
- [X] T017 [US1] Implement extractAABMetadata() for package name, version code, version name in src/lib/parsers/android/aab-parser.js
- [X] T018 [US1] Implement module detection (base + feature modules) in src/lib/parsers/android/aab-parser.js
- [X] T019 [US1] Implement AAB content categorization (DEX, resources, assets, native, config) in src/lib/parsers/android/aab-parser.js
- [X] T020 [US1] Implement isValidAAB() validation function in src/lib/parsers/android/aab-parser.js
- [X] T021 [US1] Add progress reporting callbacks to AAB parser in src/lib/parsers/android/aab-parser.js
- [X] T022 [US1] Wire AAB parser to worker message handler in src/workers/parser-worker.js

**Checkpoint**: User Story 1 complete - .aab files can be analyzed with full module breakdown

---

## Phase 4: User Story 2 - Analyze iOS Framework Bundle (Priority: P2)

**Goal**: Users can upload a zipped .framework bundle to see size breakdown of binary, headers, modules, and resources with per-architecture sizes for universal binaries.

**Independent Test**: Upload a valid .framework.zip file and verify size breakdown displays correctly with bundle ID, version, and architecture slices.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T023 [P] [US2] Unit test for Framework parser basic functionality in src/__tests__/parsers/framework-parser.test.js
- [X] T024 [P] [US2] Unit test for Framework metadata extraction (Info.plist) in src/__tests__/parsers/framework-parser.test.js
- [X] T025 [P] [US2] Unit test for architecture detection (Mach-O parsing) in src/__tests__/parsers/framework-parser.test.js
- [X] T026 [P] [US2] Unit test for Framework content categorization in src/__tests__/parsers/framework-parser.test.js

### Implementation for User Story 2

- [X] T027 [US2] Create Framework parser main module in src/lib/parsers/ios/framework-parser.js
- [X] T028 [US2] Implement parseFramework() function with ZIP extraction in src/lib/parsers/ios/framework-parser.js
- [X] T029 [US2] Implement framework structure detection (iOS flat vs macOS versioned) in src/lib/parsers/ios/framework-parser.js
- [X] T030 [US2] Implement extractFrameworkMetadata() using plist-parser utility in src/lib/parsers/ios/framework-parser.js
- [X] T031 [US2] Implement parseArchitectures() using macho-parser utility in src/lib/parsers/ios/framework-parser.js
- [X] T032 [US2] Implement Framework content categorization (binary, headers, modules, resources) in src/lib/parsers/ios/framework-parser.js
- [X] T033 [US2] Implement isValidFramework() validation function in src/lib/parsers/ios/framework-parser.js
- [X] T034 [US2] Add progress reporting callbacks to Framework parser in src/lib/parsers/ios/framework-parser.js
- [X] T035 [US2] Wire Framework parser to worker message handler in src/workers/parser-worker.js

**Checkpoint**: User Story 2 complete - .framework bundles can be analyzed with architecture breakdown

---

## Phase 5: User Story 3 - Consistent Experience Across Formats (Priority: P3)

**Goal**: Users experience consistent visualization and interaction patterns when analyzing AAB and Framework files compared to existing IPA/APK analysis.

**Independent Test**: Upload AAB, Framework, IPA, and APK files sequentially and verify consistent UI patterns for treemap, file list, and metadata display.

### Implementation for User Story 3

- [X] T036 [US3] Update UploadZone.vue to show appropriate file type hints for .aab and .framework.zip in src/components/upload/UploadZone.vue
- [X] T037 [US3] Ensure metadata display component handles AAB modules in src/components/MetadataDisplay.vue (or equivalent)
- [X] T038 [US3] Ensure metadata display component handles Framework architectures in src/components/MetadataDisplay.vue
- [X] T039 [US3] Verify treemap colors are consistent with category color scheme defined in contracts
- [X] T040 [US3] Add format-specific icons or badges for AAB and Framework file types
- [X] T041 [US3] Test navigation patterns are consistent when switching between different file analysis results

**Checkpoint**: All formats provide consistent, unified user experience

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T042 [P] Add sample .aab file to tests/fixtures/sample.aab for testing
- [ ] T043 [P] Add sample .framework.zip file to tests/fixtures/Sample.framework.zip for testing
- [X] T044 [P] Update README.md with AAB and Framework support documentation
- [X] T045 Code review and cleanup of parser implementations
- [X] T046 Performance testing with large AAB files (200MB+) and large frameworks
- [X] T047 Error message review for user-friendly messaging on invalid files
- [X] T048 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different parsers, different files)
  - US3 depends on US1 and US2 being complete (tests consistency)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1
- **User Story 3 (P3)**: Depends on US1 and US2 completion - tests UI consistency across formats

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Parser core before metadata extraction
- Metadata extraction before categorization
- Categorization before worker integration
- Complete story before moving to next priority

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different files)
- T011, T012, T013 can run in parallel (test files)
- T023, T024, T025, T026 can run in parallel (test files)
- US1 and US2 implementation can proceed in parallel by different developers
- T042, T043, T044 can run in parallel (different files)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for AAB parser basic functionality in src/__tests__/parsers/aab-parser.test.js"
Task: "Unit test for AAB metadata extraction in src/__tests__/parsers/aab-parser.test.js"
Task: "Unit test for AAB content categorization in src/__tests__/parsers/aab-parser.test.js"
```

## Parallel Example: User Story 2 Tests

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for Framework parser basic functionality in src/__tests__/parsers/framework-parser.test.js"
Task: "Unit test for Framework metadata extraction (Info.plist) in src/__tests__/parsers/framework-parser.test.js"
Task: "Unit test for architecture detection (Mach-O parsing) in src/__tests__/parsers/framework-parser.test.js"
Task: "Unit test for Framework content categorization in src/__tests__/parsers/framework-parser.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T010)
3. Complete Phase 3: User Story 1 - AAB Support (T011-T022)
4. **STOP and VALIDATE**: Test AAB analysis independently
5. Deploy/demo AAB support as MVP

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (AAB) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Framework) → Test independently → Deploy/Demo
4. Add User Story 3 (Consistency) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (AAB Parser)
   - Developer B: User Story 2 (Framework Parser)
3. Both complete → Developer A or B: User Story 3 (Consistency)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Protobuf.js required only for AAB parsing - consider lazy loading
- Framework parser reuses existing Mach-O and plist parsing utilities
