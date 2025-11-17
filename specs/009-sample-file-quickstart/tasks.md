# Tasks: Sample File Quickstart

**Feature Branch**: `009-sample-file-quickstart`
**Input**: Design documents from `/specs/009-sample-file-quickstart/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

**Tech Stack**: JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution), Vite 5.4.21, Pinia 2.3.1
**Testing**: Vitest 2.1.9 + Vue Test Utils 2.4.6

**Tests**: Optional - Not explicitly requested in specification, but recommended for critical user flow

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and utility functions

- [X] T001 Create useSampleFiles composable structure in src/composables/useSampleFiles.js
- [X] T002 [P] Create SampleFileGallery component structure in src/components/upload/SampleFileGallery.vue

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core file discovery and metadata extraction - MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Implement file discovery using import.meta.glob in src/composables/useSampleFiles.js
- [X] T004 [P] Implement extractBasicMetadata function in src/composables/useSampleFiles.js
- [X] T005 [P] Implement cleanFileName function in src/composables/useSampleFiles.js
- [X] T006 [P] Implement fetchFileSize function in src/composables/useSampleFiles.js
- [X] T007 Implement loadSampleFileAsFile function with AbortController support in src/composables/useSampleFiles.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Start with Sample Files (Priority: P1) 🎯 MVP

**Goal**: Display sample files as clickable cards that load and analyze files automatically

**Independent Test**: Load homepage, click any sample file card, verify analysis page loads with results

### Implementation for User Story 1

- [X] T008 [US1] Implement useSampleFiles composable initialization with reactive state (sampleFiles, isLoading, loadingFileName, error) in src/composables/useSampleFiles.js
- [X] T009 [US1] Implement loadSampleFile method with loading state management in src/composables/useSampleFiles.js
- [X] T010 [US1] Implement cancelCurrentLoad method using AbortController in src/composables/useSampleFiles.js
- [X] T011 [US1] Implement size enrichment logic (fetch sizes for all files on mount) in src/composables/useSampleFiles.js
- [X] T012 [US1] Create SampleFileGallery component template with grid layout in src/components/upload/SampleFileGallery.vue
- [X] T013 [US1] Implement sample file card rendering with metadata display (name, platform, size) in src/components/upload/SampleFileGallery.vue
- [X] T014 [US1] Implement platform badge styling (iOS blue, Android green) in src/components/upload/SampleFileGallery.vue
- [X] T015 [US1] Implement handleCardClick event handler in src/components/upload/SampleFileGallery.vue
- [X] T016 [US1] Implement loading state display (spinner on clicked card, disable all cards) in src/components/upload/SampleFileGallery.vue
- [X] T017 [US1] Implement error handling and loading-error event emission in src/components/upload/SampleFileGallery.vue
- [X] T018 [US1] Add size skeleton loader for pending sizes in src/components/upload/SampleFileGallery.vue
- [X] T019 [US1] Expose cancelCurrentLoad method via defineExpose in src/components/upload/SampleFileGallery.vue

**Checkpoint**: Sample file cards display correctly, load files when clicked, and emit file-selected events

---

## Phase 4: User Story 2 - Side-by-Side Upload Options (Priority: P2)

**Goal**: Integrate sample file gallery with existing upload functionality without conflicts

**Independent Test**: Verify both sample file cards and upload button coexist, switching between them works without errors

### Implementation for User Story 2

- [X] T020 [US2] Import SampleFileGallery component in src/App.vue
- [X] T021 [US2] Add SampleFileGallery to upload view template in src/App.vue below UploadZone
- [X] T022 [US2] Create sampleGalleryRef and pass to SampleFileGallery in src/App.vue
- [X] T023 [US2] Wire up @file-selected event from SampleFileGallery to handleFileSelect in src/App.vue
- [X] T024 [US2] Add @loading-error event handler for sample file errors in src/App.vue
- [X] T025 [US2] Modify handleFileSelect to call sampleGalleryRef.value?.cancelCurrentLoad() before processing upload in src/App.vue
- [X] T026 [US2] Pass appStore.isLoading as disabled prop to SampleFileGallery in src/App.vue
- [X] T027 [US2] Add section heading "Or try a sample file" with styling in src/App.vue

**Checkpoint**: Users can switch seamlessly between sample files and manual upload without state conflicts

---

## Phase 5: User Story 3 - Sample File Variety (Priority: P3)

**Goal**: Support multiple file types (iOS/Android) and sizes with proper labeling

**Independent Test**: Click each available sample file, verify correct platform detection and analysis for IPA and APK files

### Implementation for User Story 3

- [X] T028 [P] [US3] Add APK platform detection logic to extractBasicMetadata in src/composables/useSampleFiles.js
- [X] T029 [P] [US3] Verify platform badge colors for both iOS and Android in src/components/upload/SampleFileGallery.vue
- [X] T030 [US3] Test with small IPA file (A Night Battle HD 1.2.ipa) to verify fast loading
- [X] T031 [US3] Test with medium IPA file (Tools-for-Procreate.ipa) to verify loading state display
- [X] T032 [US3] Test with large APK file (com.grasshopper.dialer.apk) to verify progress handling
- [X] T033 [US3] Add empty directory handling - display message when no sample files found in src/components/upload/SampleFileGallery.vue

**Checkpoint**: All sample files (iOS and Android, various sizes) load correctly with proper platform labels

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T034 [P] Add hover states and accessibility attributes (role, aria-label) to sample file cards in src/components/upload/SampleFileGallery.vue
- [X] T035 [P] Add responsive styling for mobile devices (scrollable cards, touch-friendly) in src/components/upload/SampleFileGallery.vue
- [X] T036 [P] Add JSDoc comments to all functions in src/composables/useSampleFiles.js
- [X] T037 [P] Add JSDoc comments to component props and emits in src/components/upload/SampleFileGallery.vue
- [X] T038 Add error boundary for graceful failure handling in src/components/upload/SampleFileGallery.vue
- [X] T039 Test rapid click prevention (verify only one load active at a time)
- [X] T040 Test network failure scenarios (verify error messages display correctly)
- [X] T041 Validate quickstart.md scenarios manually
- [X] T042 Update README.md if needed to document sample file feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 is complete (integrates with App.vue)
- **User Story 3 (P3)**: Can start after US1 is complete (extends platform detection logic)

**Note**: US2 and US3 could be developed in parallel after US1, but sequential implementation is recommended for this small feature.

### Within Each User Story

- US1: Composable methods (T008-T011) → Component template (T012-T014) → Event handling (T015-T017) → UI refinements (T018-T019)
- US2: Component integration → Event wiring → Cancellation logic → Styling
- US3: Platform detection → Testing with actual files → Edge case handling

### Parallel Opportunities

- T001 and T002 (Setup) can run in parallel
- T004, T005, T006 (Foundational utility functions) can run in parallel
- T028 and T029 (US3 platform detection) can run in parallel
- T034, T035, T036, T037 (Polish tasks) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all utility functions together:
Task: "Implement extractBasicMetadata function in src/composables/useSampleFiles.js"
Task: "Implement cleanFileName function in src/composables/useSampleFiles.js"
Task: "Implement fetchFileSize function in src/composables/useSampleFiles.js"
```

---

## Parallel Example: Polish Phase

```bash
# Launch all documentation and styling tasks together:
Task: "Add hover states and accessibility attributes to sample file cards"
Task: "Add responsive styling for mobile devices"
Task: "Add JSDoc comments to all functions in src/composables/useSampleFiles.js"
Task: "Add JSDoc comments to component props in src/components/upload/SampleFileGallery.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T007) - CRITICAL
3. Complete Phase 3: User Story 1 (T008-T019)
4. **STOP and VALIDATE**: Test clicking sample files, verify file loading and analysis
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **Deploy/Demo (MVP!)** ← Delivers immediate value
3. Add User Story 2 → Test independently → Deploy/Demo (Integration complete)
4. Add User Story 3 → Test independently → Deploy/Demo (Full variety support)
5. Add Polish → Final release

### Recommended Order

Given this is a small, focused feature:

1. Phase 1: Setup (both tasks in parallel) → ~30 min
2. Phase 2: Foundational (T003 sequential, then T004-T006 parallel, then T007) → ~2 hours
3. Phase 3: User Story 1 (T008-T011 sequential, T012-T014 sequential, T015-T017 sequential, T018-T019 sequential) → ~4 hours
4. **TEST MVP**: Verify sample file loading works end-to-end → ~30 min
5. Phase 4: User Story 2 (T020-T027 sequential) → ~2 hours
6. Phase 5: User Story 3 (T028-T033 sequential) → ~2 hours
7. Phase 6: Polish (all tasks in parallel) → ~2 hours

**Total estimated time**: ~13 hours for complete implementation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable (checkpoint after each phase)
- Tests are optional but highly recommended for sample file loading workflow
- Commit after each task or logical group (e.g., after completing a phase)
- Stop at any checkpoint to validate story independently before proceeding
- Sample files already exist in /sample-files/ directory (A Night Battle HD 1.2.ipa, Tools-for-Procreate.ipa, com.grasshopper.dialer.apk)

---

## Success Validation Checklist

After completing all phases, verify these acceptance criteria:

**User Story 1**:
- [ ] Sample file cards display with name, platform, and size
- [ ] Clicking a card loads the file and navigates to analysis view
- [ ] Loading spinner appears during file fetch
- [ ] All cards disabled during loading

**User Story 2**:
- [ ] Both sample files and upload button visible without scrolling (desktop)
- [ ] Can switch between sample file and manual upload without errors
- [ ] Upload cancels in-progress sample file load

**User Story 3**:
- [ ] iOS files (.ipa) labeled with "iOS" platform badge
- [ ] Android files (.apk) labeled with "Android" platform badge
- [ ] Different file sizes load correctly (5MB, 47MB, 79MB)
- [ ] Each file analyzes independently without caching issues

**Edge Cases**:
- [ ] Rapid clicks on multiple cards only load one at a time
- [ ] Network failures show error messages
- [ ] Empty directory displays "No sample files" message
- [ ] Size fetch failures gracefully degrade to "Unknown size"

---

## File Paths Summary

**New Files Created**:
- `src/composables/useSampleFiles.js` (composable - ~200 lines)
- `src/components/upload/SampleFileGallery.vue` (component - ~250 lines)

**Modified Files**:
- `src/App.vue` (integration - ~20 lines added)

**Sample Files** (already exist):
- `sample-files/A Night Battle HD 1.2.ipa` (5.1MB)
- `sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa` (47MB)
- `sample-files/com.grasshopper.dialer_[...].apk` (79MB)

**Total LOC Estimate**: ~470 lines of new code, 20 lines of modifications
