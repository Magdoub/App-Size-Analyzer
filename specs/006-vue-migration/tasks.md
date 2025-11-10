# Tasks: Vue.js Migration

**Input**: Design documents from `/specs/006-vue-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT included in this migration. The strategy is to migrate component tests from React Testing Library to Vue Test Utils after component migration to verify equivalence (not TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. However, for a framework migration, US1 (Core File Analysis) must be complete before US2 (Interactive Features) can function, as the entire application structure changes together.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Remove TypeScript/React, install Vue/Pinia dependencies

- [X] T001 Remove TypeScript and React dependencies (react, react-dom, zustand, @types/react, @types/react-dom, @tanstack/react-virtual, @vitejs/plugin-react, @testing-library/react, typescript, @typescript-eslint/*) from package.json
- [X] T002 Install Vue and Pinia dependencies (vue@^3.5.0, pinia@^2.3.0) in package.json
- [X] T003 [P] Install Vue development dependencies (@vitejs/plugin-vue, @vue/test-utils@^2.4.0, eslint-plugin-vue@^9.30.0) in package.json
- [X] T004 Update vite.config.js to use @vitejs/plugin-vue instead of @vitejs/plugin-react
- [X] T005 [P] Update .eslintrc configuration to use eslint-plugin-vue rules
- [X] T006 [P] Update package.json scripts to include .vue extension in lint commands
- [X] T007 Create src/utils/proptypes.js for custom Vue prop validators
- [X] T008 Update .gitignore if needed for Vue-specific build artifacts

**Checkpoint**: Dependencies installed, build configuration updated, ready for file conversion

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story components can be implemented

**⚠️ CRITICAL**: No component migration can begin until this phase is complete

- [X] T009 Create src/stores/appStore.js (migrate from store/appStore.ts using Pinia defineStore, state for currentFile, parsingStatus, validationErrors)
- [X] T010 Create src/stores/analysisStore.js (migrate from store/analysisStore.ts, state for metadata, breakdownTree, treemapData, insights, summary)
- [X] T011 Create src/stores/uiStore.js (migrate from store/uiStore.ts, state for activeView, breakdown filters, xray navigation, insights filters)
- [X] T012 Convert src/workers/parser.worker.ts to src/workers/parser.worker.js (remove TypeScript types, add JSDoc annotations, keep Comlink API unchanged)
- [X] T013 [P] Convert src/types/ios.ts to src/types/ios.js with JSDoc type definitions
- [X] T014 [P] Convert src/types/android.ts to src/types/android.js with JSDoc type definitions
- [X] T015 [P] Convert src/types/analysis.ts to src/types/analysis.js with JSDoc type definitions
- [X] T016 Verify src/lib/parsers/ are pure JavaScript (no changes needed if already framework-agnostic)
- [X] T017 Verify src/lib/analysis/ are pure JavaScript (no changes needed if already framework-agnostic)
- [X] T018 Verify src/lib/utils/ are pure JavaScript (no changes needed if already framework-agnostic)
- [X] T019 Convert src/main.tsx to src/main.js (create Vue app, install Pinia, mount to #app)
- [X] T020 Create src/App.vue root component structure (template with view switching, script setup with Pinia stores, ErrorBoundary wrapper)

**Checkpoint**: Foundation ready - Pinia stores created, workers converted, main.js and App.vue ready, component migration can now begin in parallel

---

## Phase 3: User Story 1 - Core File Analysis with Vue (Priority: P1) 🎯 MVP

**Goal**: Users can upload and analyze iOS/Android binary files using the migrated Vue.js application with identical functionality to the current TypeScript/React version

**Independent Test**: Upload a sample .ipa or .apk file and verify that the file is parsed, analyzed, and results are displayed in the Breakdown, X-Ray, and Insights views. All three views must render correctly with accurate data.

### Shared Components (Required for All Views)

- [X] T021 [P] [US1] Convert src/components/shared/ErrorBoundary.tsx to src/components/shared/ErrorBoundary.vue (use onErrorCaptured hook, slot for children, props: fallbackMessage, showRetry)
- [X] T022 [P] [US1] Convert src/components/shared/LoadingSpinner.tsx to src/components/shared/LoadingSpinner.vue (props: message, progress, size)
- [X] T023 [P] [US1] Convert src/components/shared/Breadcrumb.tsx to src/components/shared/Breadcrumb.vue (props: path array, separator, emit navigate event)

### Upload Components

- [X] T024 [US1] Convert src/components/upload/UploadZone.tsx to src/components/upload/UploadZone.vue (props: onFileSelect, maxSize, acceptedFormats, disabled; emit file-selected, validation-error events; integrate with appStore)
- [X] T025 [US1] Convert src/components/upload/FileValidator.tsx to src/components/upload/FileValidator.vue (props: errors array, dismissible; emit dismiss event)

### Breakdown Components

- [X] T026 [US1] Convert src/components/breakdown/BreakdownTabs.tsx to src/components/breakdown/BreakdownTabs.vue (v-model:activeView prop, insightCount prop, emit update:modelValue)
- [X] T027 [US1] Convert src/components/breakdown/BreakdownView.tsx to src/components/breakdown/BreakdownView.vue (props: data object, connect to analysisStore, wrap BreakdownTable)
- [X] T028 [US1] Convert src/components/breakdown/BreakdownTable.tsx to src/components/breakdown/BreakdownTable.vue (props: items array, sortColumn, sortDirection, expandedPaths Set; use @tanstack/virtual-core for virtualization; emit sort-change, toggle-expand)

### X-Ray Components

- [X] T029 [US1] Convert src/components/xray/XRayView.tsx to src/components/xray/XRayView.vue (props: data object, connect to analysisStore, wrap Treemap and CategoryFilter)
- [X] T030 [US1] Convert src/components/xray/Treemap.tsx to src/components/xray/Treemap.vue (wrap @nivo/treemap using vanilla render function, props: data, width, height, currentPath, colorScheme; emit node-click, node-hover, node-leave)
- [X] T031 [US1] Convert src/components/xray/CategoryFilter.tsx to src/components/xray/CategoryFilter.vue (v-model:selectedCategory prop, categories object, emit update:modelValue)

### Insights Components

- [X] T032 [US1] Convert src/components/insights/InsightsView.tsx to src/components/insights/InsightsView.vue (props: insights array, connect to analysisStore, wrap InsightFilters and SeveritySections)
- [X] T033 [US1] Convert src/components/insights/InsightCard.tsx to src/components/insights/InsightCard.vue (props: insight object, expanded boolean; emit toggle-expand, file-click)
- [X] T034 [US1] Convert src/components/insights/InsightFilters.tsx to src/components/insights/InsightFilters.vue (props: severity, category, searchQuery, severityCounts; emit update:severity, update:category, update:searchQuery)
- [X] T035 [US1] Convert src/components/insights/SeveritySection.tsx to src/components/insights/SeveritySection.vue (props: severity string, insights array, collapsed boolean; emit toggle-collapse)

### Integration and Testing

- [X] T036 [US1] Wire up App.vue to render UploadZone (initial state), BreakdownTabs, and conditionally render BreakdownView, XRayView, or InsightsView based on activeView from uiStore
- [ ] T037 [US1] Create composable src/composables/useParserWorker.js to wrap Web Worker Comlink API (parseFile method, progress ref, terminate method, calculateTimeout helper)
- [ ] T038 [US1] Update UploadZone.vue to use useParserWorker composable and update appStore/analysisStore with parsing results
- [ ] T039 [US1] Test file upload workflow end-to-end: drag-drop .ipa file → parsing → Breakdown/X-Ray/Insights views populated with data
- [ ] T040 [US1] Test with all supported file formats (.ipa, .apk, .aab, .xapk) to verify parsing results match React version
- [ ] T041 [US1] Verify file validation works (size limits, file type checks, error messages displayed via FileValidator.vue)
- [ ] T042 [US1] Verify parsing progress updates correctly during file processing (LoadingSpinner.vue shows progress)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can upload files, see analysis results in all three views, and all data displays correctly

---

## Phase 4: User Story 2 - Interactive Visualization and Navigation (Priority: P2)

**Goal**: Users can interact with the visualizations (treemap, breakdown table) and navigate through the app structure using the same interactions as the current version

**Independent Test**: Upload a file and verify that clicking on treemap sections drills down, table sorting works, breadcrumb navigation functions, and filters apply correctly

### Breakdown Interactions

- [ ] T043 [US2] Implement table column sorting in BreakdownTable.vue (click header → emit sort-change → uiStore updates sortColumn/sortDirection → table re-renders sorted)
- [ ] T044 [US2] Implement directory expand/collapse in BreakdownTable.vue (click directory row → emit toggle-expand → uiStore updates expandedPaths Set → tree view updates)
- [ ] T045 [US2] Save and restore scroll position in BreakdownTable.vue when switching views (use uiStore.breakdown.scrollPosition)

### X-Ray Interactions

- [ ] T046 [US2] Implement treemap node click drill-down in Treemap.vue (click node → emit node-click → uiStore.xray.currentPath updates → treemap zooms into selected directory)
- [ ] T047 [US2] Implement breadcrumb navigation in XRayView.vue (click breadcrumb segment → navigate event → uiStore.xray.currentPath updates → treemap navigates to parent directory)
- [ ] T048 [US2] Implement treemap hover tooltips in Treemap.vue (mouse enter node → emit node-hover → show tooltip with file path, size, percentage)
- [ ] T049 [US2] Implement category filter in CategoryFilter.vue (select category → update:modelValue event → treemap filters to show only selected category files)
- [ ] T050 [US2] Save and restore scroll position in XRayView.vue when switching views (use uiStore.xray.scrollPosition)

### Insights Interactions

- [ ] T051 [US2] Implement severity filter in InsightFilters.vue (select severity → update:severity event → InsightsView filters insights by severity level)
- [ ] T052 [US2] Implement category filter in InsightFilters.vue (select category → update:category event → InsightsView filters insights by category)
- [ ] T053 [US2] Implement search functionality in InsightFilters.vue (type query → update:searchQuery event → InsightsView filters insights matching title/description)
- [ ] T054 [US2] Implement insight card expand/collapse in InsightCard.vue (click header → toggle-expand event → show/hide full description and recommendations)
- [ ] T055 [US2] Implement severity section collapse in SeveritySection.vue (click section header → toggle-collapse event → show/hide insights for that severity)
- [ ] T056 [US2] Implement affected file click navigation in InsightCard.vue (click file path → file-click event → navigate to file in Breakdown or X-Ray view)
- [ ] T057 [US2] Save and restore scroll position in InsightsView.vue when switching views (use uiStore.insights.scrollPosition)

### Integration and Testing

- [ ] T058 [US2] Test all sorting interactions in Breakdown view (name, size, percentage columns, ascending/descending)
- [ ] T059 [US2] Test treemap drill-down and breadcrumb navigation in X-Ray view (navigate deep into directory structure, navigate back to root)
- [ ] T060 [US2] Test all filter combinations in Insights view (severity + category + search query)
- [ ] T061 [US2] Verify view state persistence (switch between views, return to previous view with same scroll position, filters, expanded state)
- [ ] T062 [US2] Test rapid view switching and interactions to verify no state corruption or performance issues

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can analyze files AND interact with all visualizations/filters just like the React version

---

## Phase 5: User Story 3 - Performance and Privacy Preservation (Priority: P1)

**Goal**: The migrated application maintains 100% client-side processing with no network requests, matching or improving the performance characteristics of the current version

**Independent Test**: Open browser DevTools network tab, upload files, and verify zero network requests occur. Compare parse times between current and migrated versions for identical sample files (should be within ±10%).

### Performance Verification

- [ ] T063 [US3] Benchmark file parsing performance with sample files (10MB, 50MB, 100MB .ipa and .apk files) using both React and Vue versions
- [ ] T064 [US3] Verify Web Worker parsing keeps main thread responsive (UI interactions remain at 60 FPS during large file parsing)
- [ ] T065 [US3] Verify virtual scrolling performance in BreakdownTable.vue with 10,000+ file entries (smooth scrolling, instant response)
- [ ] T066 [US3] Verify treemap rendering performance in Treemap.vue with 10,000+ nodes (render in <1s, zoom/pan animations at 60 FPS)
- [ ] T067 [US3] Measure and verify bundle size is within 15% of React version (target: ~44KB smaller due to Vue vs React size difference)

### Privacy Verification

- [ ] T068 [US3] Verify zero network requests during file upload and analysis (open DevTools Network tab, upload files, confirm no requests except initial page load)
- [ ] T069 [US3] Verify all Pinia stores use in-memory state only (no localStorage, IndexedDB, or sessionStorage usage)
- [ ] T070 [US3] Verify file data is cleared when user closes browser tab (no persistence to disk or browser storage)
- [ ] T071 [US3] Verify Web Worker terminates cleanly on component unmount (no memory leaks, worker threads cleaned up)

### Progressive Enhancement Verification

- [ ] T072 [US3] Verify noscript tag displays error message if JavaScript is disabled in browser
- [ ] T073 [US3] Verify graceful degradation if Web Workers are not supported (show error message suggesting modern browser)
- [ ] T074 [US3] Test application in target browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) to verify compatibility

**Checkpoint**: All user stories should now be independently functional with verified performance and privacy guarantees

---

## Phase 6: Testing Migration

**Purpose**: Migrate existing tests from React Testing Library to Vue Test Utils to maintain test coverage

- [ ] T075 [P] Migrate src/lib/parsers/ unit tests to use Vue Test Utils setup (should require minimal changes, these are framework-agnostic)
- [ ] T076 [P] Migrate src/lib/analysis/ unit tests to use Vue Test Utils setup (should require minimal changes, these are framework-agnostic)
- [ ] T077 [P] Create tests/stores/appStore.test.js (test Pinia store actions: setCurrentFile, clearCurrentFile, updateParsingStatus, setParsingError)
- [ ] T078 [P] Create tests/stores/analysisStore.test.js (test Pinia store actions: setAnalysisResult, clearAnalysis, updateInsights, calculateSummary)
- [ ] T079 [P] Create tests/stores/uiStore.test.js (test Pinia store actions: setActiveView, updateBreakdownSort, navigateToPath, setInsightFilter)
- [ ] T080 [P] Create tests/components/upload/UploadZone.test.js (mount with Vue Test Utils, test file drop, validation, emit events)
- [ ] T081 [P] Create tests/components/breakdown/BreakdownTable.test.js (mount with props, test sorting, virtualization, emit events)
- [ ] T082 [P] Create tests/components/xray/Treemap.test.js (mount with data, test click interactions, hover tooltips, Nivo wrapper)
- [ ] T083 [P] Create tests/components/insights/InsightCard.test.js (mount with insight prop, test expand/collapse, PropTypes validation)
- [ ] T084 [P] Create tests/components/shared/ErrorBoundary.test.js (trigger error, verify error boundary catches and displays fallback)
- [ ] T085 Create tests/integration/full-workflow.test.js (end-to-end test: upload file → parse → display results → interact with views)
- [ ] T086 Run test suite and verify coverage meets or exceeds React version coverage (80% for parsers, 70% for components)

**Checkpoint**: Test suite migrated, all tests passing, coverage maintained

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T087 [P] Update README.md with Vue.js migration notes, updated setup instructions, and dependency list
- [ ] T088 [P] Update sample-files/ directory README if needed to reflect Vue migration
- [ ] T089 Review and remove any remaining TypeScript file references in import statements or configuration
- [ ] T090 Run ESLint on entire codebase and fix any Vue-specific linting issues
- [ ] T091 [P] Run Prettier on entire codebase to format all .vue and .js files
- [ ] T092 Build production bundle (npm run build) and verify output is static HTML + JS with no errors
- [ ] T093 Verify production bundle serves correctly via npm run preview
- [ ] T094 Run Lighthouse audit and verify performance scores match or exceed React version
- [ ] T095 Run quickstart.md validation workflow (follow migration checklist, verify all steps complete)
- [ ] T096 Create git commit summarizing Vue migration with detailed commit message per constitution guidelines

**Checkpoint**: Migration complete, application production-ready, all documentation updated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion - BLOCKS User Story 2
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (interactions require functional views)
- **User Story 3 (Phase 5)**: Depends on User Story 1 and 2 completion (performance/privacy tests require full functionality)
- **Testing (Phase 6)**: Depends on all user stories being complete (tests verify migrated components)
- **Polish (Phase 7)**: Depends on all previous phases

### Task Dependencies Within Phases

**Phase 2 (Foundational)**:
- T009-T011 (Pinia stores) can run in parallel
- T012 (worker conversion) independent
- T013-T015 (type conversions) can run in parallel
- T016-T018 (library verification) can run in parallel
- T019 (main.js) depends on T009-T011 (stores must exist)
- T020 (App.vue) depends on T019 (main.js must exist)

**Phase 3 (User Story 1)**:
- T021-T023 (shared components) can run in parallel
- T024-T025 (upload components) sequential (FileValidator used by UploadZone)
- T026-T028 (breakdown components) sequential (views compose tables)
- T029-T031 (xray components) sequential (views compose treemap)
- T032-T035 (insights components) sequential (views compose cards)
- T036-T038 (integration) sequential, depend on all components
- T039-T042 (testing) sequential, depend on integration

**Phase 4 (User Story 2)**:
- T043-T045 (breakdown interactions) can run in parallel
- T046-T050 (xray interactions) can run in parallel
- T051-T057 (insights interactions) can run in parallel
- T058-T062 (testing) sequential

**Phase 5 (User Story 3)**:
- T063-T067 (performance tests) can run in parallel
- T068-T071 (privacy tests) can run in parallel
- T072-T074 (browser tests) can run in parallel

**Phase 6 (Testing)**:
- T075-T084 (unit/component tests) can run in parallel
- T085-T086 (integration tests) sequential

**Phase 7 (Polish)**:
- T087-T088 (documentation) can run in parallel
- T089-T091 (cleanup) can run in parallel
- T092-T096 (final validation) sequential

### Parallel Opportunities

```bash
# Phase 2: Launch all Pinia stores together
Task: T009 "Create appStore.js"
Task: T010 "Create analysisStore.js"
Task: T011 "Create uiStore.js"

# Phase 2: Launch all type conversions together
Task: T013 "Convert ios.ts to ios.js"
Task: T014 "Convert android.ts to android.js"
Task: T015 "Convert analysis.ts to analysis.js"

# Phase 3: Launch all shared components together
Task: T021 "Convert ErrorBoundary.vue"
Task: T022 "Convert LoadingSpinner.vue"
Task: T023 "Convert Breadcrumb.vue"

# Phase 6: Launch all store tests together
Task: T077 "Test appStore.js"
Task: T078 "Test analysisStore.js"
Task: T079 "Test uiStore.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (remove React, install Vue)
2. Complete Phase 2: Foundational (Pinia stores, workers, main.js, App.vue) - CRITICAL
3. Complete Phase 3: User Story 1 (all components, integration, testing)
4. **STOP and VALIDATE**: Upload sample files, verify all three views work
5. Consider deploying/demoing basic functionality before adding interactions

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - basic file analysis works)
3. Add User Story 2 → Test independently → Deploy/Demo (full interactivity)
4. Add User Story 3 → Verify performance/privacy → Deploy/Demo (production-ready)
5. Add Testing + Polish → Final release

### Full Migration Strategy

Since this is a framework migration (not modular feature development), the recommended approach is:

1. **Phase 1-2**: Setup and foundation (1-2 days)
2. **Phase 3**: All components migrated (3-5 days)
3. **Phase 4**: All interactions implemented (2-3 days)
4. **Phase 5**: Performance and privacy verified (1 day)
5. **Phase 6**: Tests migrated (2-3 days)
6. **Phase 7**: Polish and release (1 day)

**Total estimated effort**: 10-15 days for complete migration

---

## Notes

- **Framework migration**: Unlike new feature development, components must all migrate together since the entire framework changes
- **No TypeScript**: User requirement - all type safety via Vue PropTypes (runtime) and JSDoc (editor hints)
- **Tests after migration**: Not TDD - tests verify equivalence with React version
- **Pinia stores**: Direct mapping from Zustand stores (state shape unchanged)
- **Web Workers**: Framework-agnostic, minimal changes (just TypeScript → JavaScript conversion)
- **Library code**: src/lib/ should be pure JavaScript, no framework dependencies
- **Bundle size**: Target ~44KB smaller than React version (Vue 135KB vs React 179KB)
- **Performance**: Parse times should be within ±10% of React version
- **Privacy**: Zero network requests, zero persistence to storage
- [P] tasks can run in parallel (different files, no dependencies)
- [Story] label maps task to specific user story for traceability
- Commit after each phase or logical group of tasks
- Stop at any checkpoint to validate progress independently
