# Tasks: Vue Migration Completion

**Input**: Design documents from `/specs/009-vue-migration-completion/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Tests are included as per spec requirements - testing is part of User Story 4

**Testing Tools**: Vitest 2.1.9 for unit tests, Vue Test Utils 2.4.6 for component tests

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each user story can be implemented and tested independently for incremental delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- All paths relative to `/Users/magdoub/Documents/projects/sizeanalyzer/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verification that existing Vue components are ready

- [X] T001 Verify all Vue components from feature 006-vue-migration exist in src/components/ (breakdown/, insights/, shared/, upload/, xray/)
- [X] T002 Verify Pinia stores exist and are correctly structured in src/stores/ (appStore.js, analysisStore.js, uiStore.js)
- [X] T003 Verify Web Worker exists at src/workers/parser-worker.js with Comlink integration
- [X] T004 Verify test dependencies are installed (vitest@2.1.9, @vue/test-utils@2.4.6, jsdom@27.1.0)
- [X] T005 Verify sample files exist in sample-files/ directory for integration testing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create src/composables/ directory for Vue composition functions
- [X] T007 Implement useParserWorker composable in src/composables/useParserWorker.js (wraps Comlink Worker with reactive refs per research.md)
- [X] T008 Verify parser-worker.js exposes Comlink API per contracts/parser-worker-api.js (parseIOS, parseAndroid, cancel methods)
- [X] T009 Update appStore.js with parsing state management methods (updateParsingStatus, setParsingError, reset)
- [X] T010 Update analysisStore.js with result handling methods (setAnalysisResult, calculateSummary, setInsights, reset)
- [X] T011 Update uiStore.js with navigation and filter state management (setXRayPath, setSort, setInsightFilter)
- [X] T012 Verify lib/analysis/insight-engine.js exists and exports generateInsights function

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Complete Core Integration (Priority: P1) 🎯 MVP

**Goal**: Users can upload and analyze iOS/Android binary files using the Vue.js application. The file upload workflow is fully functional, parsing occurs in Web Workers, and analysis results display in all three views.

**Independent Test**: Upload a sample .ipa file, verify it parses successfully, and confirm that all three views (Breakdown, X-Ray, Insights) display accurate data.

### Implementation for User Story 1

- [X] T013 [US1] Update FileValidator.vue component in src/components/upload/FileValidator.vue to validate file types (.ipa, .apk, .xapk, .aab) and display error messages
- [X] T014 [US1] Wire UploadZone.vue in src/components/upload/UploadZone.vue to use useParserWorker composable for file upload handling
- [X] T015 [US1] Implement file upload event handler in UploadZone.vue that calls parseFile() from useParserWorker and updates appStore with current file
- [X] T016 [US1] Add progress tracking in UploadZone.vue using watch() on useParserWorker progress/status refs
- [X] T017 [US1] Wire UploadZone.vue to update analysisStore with parse results (setAnalysisResult, calculateSummary)
- [X] T018 [US1] Integrate insight engine in UploadZone.vue - call generateInsights() and update analysisStore.setInsights()
- [X] T019 [US1] Update LoadingSpinner.vue in src/components/shared/LoadingSpinner.vue to display parsing progress from appStore.parsingStatus
- [X] T020 [US1] Verify BreakdownView.vue in src/views/BreakdownView.vue displays breakdown data from analysisStore.breakdownRoot
- [X] T021 [US1] Verify XRayView.vue in src/views/XRayView.vue displays treemap data from analysisStore.treemapData
- [X] T022 [US1] Verify InsightsView.vue in src/views/InsightsView.vue displays insights from analysisStore.insights
- [ ] T023 [US1] Test complete workflow with sample .ipa file (sample-files/A Night Battle HD 1.2.ipa) - verify all views display data
- [ ] T024 [US1] Test complete workflow with sample .apk file (sample-files/com.grasshopper.dialer APK) - verify all views display data
- [ ] T025 [US1] Test error handling with invalid file type - verify FileValidator displays clear error message
- [ ] T026 [US1] Test large file parsing (sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa 47MB) - verify loading spinner shows progress and UI remains responsive

**Checkpoint**: At this point, User Story 1 should be fully functional - users can upload files, parse them, and view results in all three views.

---

## Phase 4: User Story 2 - Interactive Features (Priority: P2)

**Goal**: Users can interact with visualizations using sorting, filtering, drill-down navigation, breadcrumbs, and search. All interactive elements respond immediately and update the displayed data correctly.

**Independent Test**: Upload a file, then test each interaction: click treemap nodes to drill down, sort table columns, filter insights by severity, use breadcrumbs to navigate back, and search for specific files.

### Implementation for User Story 2

#### Breakdown Table Interactions

- [X] T027 [P] [US2] Implement column header sort in BreakdownTable.vue (src/components/breakdown/BreakdownTable.vue) - add click handlers that call uiStore.setSort()
- [X] T028 [P] [US2] Add computed property in BreakdownTable.vue for sorted data based on uiStore.sort.sortBy and uiStore.sort.sortOrder
- [X] T029 [US2] Implement sort direction indicators in BreakdownTable.vue column headers (ascending/descending arrows)
- [X] T030 [US2] Implement directory expand/collapse in BreakdownTable.vue - update uiStore.expanded.breakdownDirs on row click
- [X] T031 [US2] Add scroll position save/restore in BreakdownTable.vue using uiStore.scroll.breakdownScroll (save on unmount, restore on mount)
- [X] T032 [US2] Implement search input in BreakdownTable.vue that filters table rows based on uiStore.filters.searchQuery
- [X] T033 [US2] Add debouncing to search input in BreakdownTable.vue (300ms delay using useDebounceFn from @vueuse/core or manual implementation)

#### X-Ray Treemap Interactions

- [X] T034 [P] [US2] Update Treemap.vue in src/components/xray/Treemap.vue to use shallowRef() for ECharts instance per research.md recommendations
- [X] T035 [US2] Implement node click handler in Treemap.vue that emits 'node-click' event with node path
- [X] T036 [US2] Wire XRayView.vue to handle @node-click event and call uiStore.setXRayPath() with clicked node path
- [X] T037 [US2] Add computed property in XRayView.vue that filters treemapData based on uiStore.xray.currentPath
- [X] T038 [US2] Implement watch() in Treemap.vue that updates ECharts when props.data changes using chartInstance.setOption()
- [X] T039 [US2] Add hover tooltip in Treemap.vue showing file path, size, and percentage using ECharts tooltip configuration
- [X] T040 [US2] Implement Breadcrumb.vue in src/components/xray/Breadcrumb.vue that displays uiStore.xray.currentPath as clickable segments
- [X] T041 [US2] Wire Breadcrumb.vue to emit @navigate event when segment clicked, handled by XRayView calling uiStore.setXRayPath()
- [X] T042 [US2] Implement CategoryFilter.vue in src/components/xray/CategoryFilter.vue that updates uiStore.xray.selectedCategories
- [X] T043 [US2] Add computed property in XRayView.vue that applies category filter to treemap data based on uiStore.xray.selectedCategories

#### Insights Interactions

- [X] T044 [P] [US2] Implement InsightFilters.vue in src/components/insights/InsightFilters.vue with severity dropdown that updates uiStore.filters.insightSeverity
- [X] T045 [P] [US2] Add category multi-select to InsightFilters.vue that updates uiStore.filters.insightCategories
- [X] T046 [P] [US2] Add search input to InsightFilters.vue that updates uiStore.filters.searchQuery (debounced 300ms)
- [X] T047 [US2] Add computed property in InsightsView.vue that filters insights based on all active filters (severity, categories, search)
- [X] T048 [US2] Implement expand/collapse in InsightCard.vue (src/components/insights/InsightCard.vue) - toggle uiStore.expanded.insightCards on click
- [X] T049 [US2] Implement section collapse in SeveritySection.vue (src/components/insights/SeveritySection.vue) - toggle uiStore.expanded.insightSections
- [X] T050 [US2] Implement affected file click navigation in InsightCard.vue - emit @file-click event with file path
- [X] T051 [US2] Wire InsightsView.vue to handle @file-click by switching to X-Ray view and focusing on clicked file path (uiStore.setActiveView, setXRayPath, setFocusedFile)

#### Integration Testing

- [ ] T052 [US2] Test sorting all columns in Breakdown table (name, size, percentage) - verify ascending/descending toggle works
- [ ] T053 [US2] Test directory expand/collapse in Breakdown table - verify state persists when switching views
- [ ] T054 [US2] Test search functionality in Breakdown table - verify filtering works correctly
- [ ] T055 [US2] Test treemap drill-down by clicking multiple nodes - verify breadcrumbs update correctly
- [ ] T056 [US2] Test breadcrumb navigation by clicking previous segments - verify treemap navigates back correctly
- [ ] T057 [US2] Test category filter in X-Ray view - verify only matching files are shown
- [ ] T058 [US2] Test insight severity filter - verify only matching insights are shown
- [ ] T059 [US2] Test insight category filter with multiple selections - verify filtering works correctly
- [ ] T060 [US2] Test insight search - verify filtering by title and description works
- [ ] T061 [US2] Test insight card expand/collapse - verify full description and recommendations are shown/hidden
- [ ] T062 [US2] Test affected file click navigation - verify switches to X-Ray and focuses on correct file

**Checkpoint**: All interactive features should be fully functional - sorting, filtering, drill-down, breadcrumbs, and search all work correctly.

---

## Phase 5: User Story 3 - Performance & Privacy Verification (Priority: P1)

**Goal**: The application maintains 100% client-side processing with zero network requests, matches or exceeds the performance of the original React version, and properly manages memory for Web Workers.

**Independent Test**: Open browser DevTools network tab, upload multiple files of varying sizes, verify zero network requests occur. Run performance benchmarks comparing parse times to the original React version.

### Implementation for User Story 3

#### Privacy Verification

- [X] T063 [P] [US3] Create privacy verification test in tests/integration/privacy.test.js - verify zero network requests during file analysis using fetch mock
- [X] T064 [P] [US3] Add test in privacy.test.js to verify no localStorage usage after analysis
- [X] T065 [P] [US3] Add test in privacy.test.js to verify no sessionStorage usage after analysis
- [X] T066 [P] [US3] Add test in privacy.test.js to verify no IndexedDB usage after analysis

#### Performance Benchmarking

- [ ] T067 [US3] Create performance benchmark script in scripts/benchmark-parser.js per quickstart.md examples
- [ ] T068 [US3] Add benchmark test for 10MB file (sample-files/A Night Battle HD 1.2.ipa) - measure parse time
- [ ] T069 [US3] Add benchmark test for 50MB file (sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa) - measure parse time
- [ ] T070 [US3] Add benchmark test for 100MB file (sample-files/com.grasshopper.dialer APK) - measure parse time
- [ ] T071 [US3] Document React version baseline performance for comparison (if available, otherwise note as N/A)
- [ ] T072 [US3] Run Vue version benchmarks and verify parse times are within ±10% of React baseline (or document as new baseline)

#### Memory Management

- [X] T073 [P] [US3] Verify useParserWorker composable terminates worker in onUnmounted() hook - add unit test in tests/unit/composables/useParserWorker.test.js
- [X] T074 [US3] Create memory leak test in tests/integration/memory.test.js - parse multiple files sequentially and verify memory is released
- [X] T075 [US3] Add test to verify ECharts chartInstance.dispose() is called on component unmount in Treemap.vue (vue-echarts handles disposal automatically)
- [X] T076 [US3] Add test to verify Pinia stores can be reset between analyses (appStore.reset, analysisStore.reset, uiStore.reset)

#### Browser Compatibility

- [ ] T077 [P] [US3] Add browser compatibility check in App.vue - detect Web Worker support and show error if unavailable
- [ ] T078 [US3] Add feature detection for module workers in useParserWorker composable per research.md recommendations
- [ ] T079 [US3] Document tested browser versions in README.md (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Checkpoint**: Privacy is verified (zero network requests, zero persistence), performance meets targets (within ±10% of baseline), and memory is properly managed (workers terminate cleanly).

---

## Phase 6: User Story 4 - Test Migration & Production Polish (Priority: P3)

**Goal**: The application has a complete test suite covering critical functionality, passes all linting and formatting checks, builds successfully for production, and includes updated documentation.

**Independent Test**: Run the full test suite and verify all tests pass. Execute `npm run build` and confirm the production bundle serves correctly.

### Test Migration

- [ ] T080 [P] [US4] Create test setup file in tests/setup.js with Vitest global configuration and Vue Test Utils setup
- [ ] T081 [P] [US4] Migrate parsing logic tests to tests/unit/lib/parsers/ - test iOS parser (parseIPA) with sample .ipa file
- [ ] T082 [P] [US4] Migrate parsing logic tests to tests/unit/lib/parsers/ - test Android parser (parseAPK) with sample .apk file
- [ ] T083 [P] [US4] Create Pinia store tests in tests/unit/stores/appStore.test.js - test state transitions (idle → parsing → success/error)
- [ ] T084 [P] [US4] Create Pinia store tests in tests/unit/stores/analysisStore.test.js - test setAnalysisResult, calculateSummary, setInsights
- [ ] T085 [P] [US4] Create Pinia store tests in tests/unit/stores/uiStore.test.js - test navigation state (setXRayPath, setSort, setInsightFilter)
- [ ] T086 [P] [US4] Create composable tests in tests/unit/composables/useParserWorker.test.js - test reactive state updates and worker lifecycle
- [ ] T087 [P] [US4] Create component test for BreakdownTable.vue in tests/component/BreakdownTable.test.js - test sorting and filtering
- [ ] T088 [P] [US4] Create component test for Treemap.vue in tests/component/Treemap.test.js - test node click and ECharts updates
- [ ] T089 [P] [US4] Create component test for InsightFilters.vue in tests/component/InsightFilters.test.js - test filter changes
- [ ] T090 [US4] Create integration test in tests/integration/upload-parse-analyze.test.js - test complete workflow from upload to analysis display
- [ ] T091 [US4] Run all tests with `npm test` and verify 70%+ code coverage for stores/composables

### Linting & Formatting

- [ ] T092 [P] [US4] Run ESLint with Vue plugin (`npm run lint`) and fix all errors in src/components/
- [ ] T093 [P] [US4] Run ESLint on src/stores/ and fix all errors
- [ ] T094 [P] [US4] Run ESLint on src/composables/ and fix all errors
- [ ] T095 [US4] Run Prettier formatting check on entire codebase (`npm run format:check`) and fix inconsistencies
- [ ] T096 [US4] Verify all Vue components use `<script setup>` syntax per constitution requirement
- [ ] T097 [US4] Verify all functions have JSDoc annotations with parameter and return types

### Production Build

- [ ] T098 [US4] Run production build (`npm run build`) and verify no errors
- [ ] T099 [US4] Test production build locally (`npm run preview`) and verify all features work
- [ ] T100 [US4] Run Lighthouse audit on production build and verify performance score 90+
- [ ] T101 [US4] Verify production bundle size is <500KB gzipped (check dist/ directory after build)
- [ ] T102 [US4] Test production build in all target browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Documentation

- [ ] T103 [P] [US4] Update README.md with Vue.js migration notes and project overview
- [ ] T104 [P] [US4] Add setup instructions to README.md (clone, install, run dev server)
- [ ] T105 [P] [US4] Add build instructions to README.md (production build and preview)
- [ ] T106 [P] [US4] Document testing approach in README.md (how to run tests, coverage targets)
- [ ] T107 [US4] Add architecture diagram to docs/ showing Vue components, Pinia stores, Web Workers, and libraries
- [ ] T108 [US4] Document API contracts in docs/ referencing contracts/parser-worker-api.js and contracts/composables-api.js
- [ ] T109 [US4] Add contribution guidelines to CONTRIBUTING.md (if applicable)

**Checkpoint**: All tests pass, linting is clean, production build succeeds, and documentation is complete. Application is production-ready.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T110 [P] Run quickstart.md validation - verify all code examples work correctly
- [ ] T111 [P] Code cleanup - remove console.log statements, unused imports, and commented code
- [ ] T112 [P] Review all TODOs and FIXMEs in codebase - resolve or document
- [ ] T113 Performance profiling - run Chrome DevTools Performance recording during file upload/analysis and identify any bottlenecks
- [ ] T114 Accessibility audit - verify keyboard navigation, ARIA labels, and screen reader support where applicable
- [ ] T115 Final integration test - upload all three sample files and verify complete workflows for each
- [ ] T116 Verify all success criteria from spec.md are met (SC-001 through SC-010)
- [ ] T117 Create release notes documenting Vue migration completion and new features

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - User Story 2 (Phase 4): Can start after Foundational - Requires components from US1 to be functional for integration testing
  - User Story 3 (Phase 5): Can start after Foundational - Can run in parallel with US1/US2 for privacy/performance tests
  - User Story 4 (Phase 6): Should start after US1/US2/US3 are functional to have code to test
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core integration - MUST complete first as it provides the foundation for all other stories
- **User Story 2 (P2)**: Interactive features - Depends on US1 components being wired and functional
- **User Story 3 (P1)**: Performance & privacy - Can run in parallel with US1/US2 development for verification tests
- **User Story 4 (P3)**: Testing & polish - Should come after US1/US2/US3 implementation to test completed features

### Within Each User Story

- **User Story 1**: Sequential implementation (upload → parsing → display in all views)
- **User Story 2**: Many parallel opportunities for different interactive features (breakdown, x-ray, insights can be done in parallel)
- **User Story 3**: Most tasks can run in parallel (privacy tests, performance tests, memory tests are independent)
- **User Story 4**: Test creation tasks are highly parallel, linting/docs can run in parallel

### Parallel Opportunities

- All Setup tasks (T001-T005) can run in parallel
- Many Foundational tasks can run in parallel: T007 (composable), T009-T011 (store updates) are independent
- User Story 2 has many parallel opportunities: T027-T029 (breakdown sorting), T034-T043 (x-ray interactions), T044-T051 (insights filters) are largely independent
- User Story 3: Most verification tasks (T063-T066, T073-T076, T077-T079) can run in parallel
- User Story 4: Test migration (T080-T091), linting (T092-T097), and docs (T103-T109) can all run in parallel

---

## Parallel Example: User Story 2 (Interactive Features)

```bash
# Launch breakdown table interactions in parallel:
Task: "Implement column header sort in BreakdownTable.vue"
Task: "Add computed property for sorted data"
Task: "Implement sort direction indicators"

# Launch x-ray treemap interactions in parallel:
Task: "Update Treemap.vue to use shallowRef() for ECharts instance"
Task: "Implement Breadcrumb.vue"
Task: "Implement CategoryFilter.vue"

# Launch insights interactions in parallel:
Task: "Implement InsightFilters.vue with severity dropdown"
Task: "Add category multi-select to InsightFilters.vue"
Task: "Add search input to InsightFilters.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T012) - CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T013-T026)
4. **STOP and VALIDATE**: Test with all three sample files
5. Demo basic upload → parse → view workflow

### Incremental Delivery

1. **Foundation** (Phases 1-2) → T001-T012 complete → Composable and stores ready
2. **MVP** (Phase 3) → T013-T026 complete → Upload and basic viewing works
3. **Interactive** (Phase 4) → T027-T062 complete → Full UX with sorting, filtering, drill-down
4. **Verified** (Phase 5) → T063-T079 complete → Performance and privacy validated
5. **Production** (Phases 6-7) → T080-T117 complete → Tests, docs, and polish done

### Recommended Sequence

1. **Week 1**: Setup + Foundational (T001-T012) - Get composable and stores working
2. **Week 2**: User Story 1 (T013-T026) - Wire up upload workflow and display
3. **Week 3**: User Story 2 part 1 (T027-T043) - Breakdown and X-Ray interactions
4. **Week 4**: User Story 2 part 2 (T044-T062) - Insights interactions and testing
5. **Week 5**: User Story 3 (T063-T079) - Performance and privacy verification
6. **Week 6**: User Story 4 (T080-T109) - Test migration and production polish
7. **Week 7**: Final polish (T110-T117) - Code cleanup and final validation

---

## Notes

- [P] tasks = different files, no dependencies within that group
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are included as part of User Story 4 per spec requirements
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All paths are relative to repository root: `/Users/magdoub/Documents/projects/sizeanalyzer/`
- Sample files for testing: `sample-files/A Night Battle HD 1.2.ipa` (5.1MB), `sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa` (47MB), `sample-files/com.grasshopper.dialer APK` (79MB)
- Constitution compliance: No TypeScript (JavaScript + JSDoc only), Vue 3.5+ with Composition API, Pinia for state, 100% client-side processing
