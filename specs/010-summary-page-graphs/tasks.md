# Tasks: Summary Page with Size Distribution Graphs

**Feature**: 010-summary-page-graphs | **Branch**: `010-summary-page-graphs`
**Input**: Design documents from `/specs/010-summary-page-graphs/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL in this project per the specification. Tests are NOT included in this task breakdown.

**Testing Tools**: Vitest 2.1.8 + Vue Test Utils for component tests (available if needed in future)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a single-page web application with source at repository root:
- `src/` - Source code (Vue components, utilities, stores)
- `src/components/summary/` - New directory for summary page components
- `src/utils/` - Utility functions (aggregation, chart builders)
- `src/stores/` - Pinia state management

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and utility files for the Summary page feature

- [X] T001 Create summary components directory at src/components/summary/
- [X] T002 [P] Create chart options builder utility file at src/utils/chart-options.js with imports and exports structure
- [X] T003 [P] Update App.vue to add "Summary" tab to navigation bar (alongside existing X-Ray and Insights tabs)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core aggregation functions and chart builders that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Aggregation Functions (src/utils/calculations.js)

- [X] T004 [P] Implement mapToDisplayCategory(contentType, platform) helper function in src/utils/calculations.js per contracts/aggregation.js
- [X] T005 [P] Implement getDisplayCategoryColor(displayCategory, context) helper function in src/utils/calculations.js per contracts/aggregation.js
- [X] T006 Implement aggregateFilesByType(breakdownRoot, platform, totalInstallSize) function in src/utils/calculations.js returning CategoryAggregation[] per contracts/aggregation.js
- [X] T007 Implement aggregateByComponent(breakdownRoot, platform, totalInstallSize) function in src/utils/calculations.js returning ComponentAggregation per contracts/aggregation.js
- [X] T008 Implement getTopFiles(breakdownRoot, count, totalInstallSize) function in src/utils/calculations.js returning FileEntry[] per contracts/aggregation.js
- [X] T009 [P] Implement analyzeCompressionByType(breakdownRoot, platform) function in src/utils/calculations.js returning CompressionAnalysis[] per contracts/aggregation.js
- [X] T010 [P] Implement analyzeLocalizations(breakdownRoot, platform, totalInstallSize) function in src/utils/calculations.js returning LocalizationEntry[] per contracts/aggregation.js
- [X] T011 [P] Implement analyzeArchitectures(breakdownRoot, totalInstallSize) function in src/utils/calculations.js returning ArchitectureEntry[] per contracts/aggregation.js
- [X] T012 [P] Implement categorizeAssetTypes(breakdownRoot, totalInstallSize) function in src/utils/calculations.js returning AssetTypeAggregation[] per contracts/aggregation.js

### Chart Builder Functions (src/utils/chart-options.js)

- [X] T013 [P] Implement buildTooltipConfig(valueFormatter, options) helper function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T014 [P] Implement buildGridConfig(options) helper function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T015 [P] Implement buildLegendConfig(options) helper function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T016 [P] Implement buildTitleConfig(text, options) helper function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T017 Implement buildVerticalBarChartOptions(data, title, valueFormatter, options) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T018 [P] Implement buildGroupedBarChartOptions(data, title, valueFormatter, options) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T019 [P] Implement buildHorizontalBarChartOptions(data, title, valueFormatter, options) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T020 [P] Implement buildStackedBarChartOptions(data, title, valueFormatter, options) function in src/utils/chart-options.js per contracts/chart-data.js

### Chart Data Transformers (src/utils/chart-options.js)

- [X] T021 [P] Implement transformCategoriesToBarChart(categories, metric, includeCompressed) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T022 [P] Implement transformComponentsToBarChart(components, metric, includeCompressed) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T023 [P] Implement transformFilesToHorizontalBarChart(files, valueFormatter) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T024 [P] Implement transformCompressionToStackedBarChart(compressionData) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T025 [P] Implement transformLocalizationsToBarChart(localizations, metric) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T026 [P] Implement transformArchitecturesToBarChart(architectures, metric) function in src/utils/chart-options.js per contracts/chart-data.js
- [X] T027 [P] Implement transformAssetsToBarChart(assets, metric, includeCompressed) function in src/utils/chart-options.js per contracts/chart-data.js

**Checkpoint**: Foundation ready - all aggregation and chart builder functions implemented. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - View File Type Size Distribution (Priority: P1) 🎯 MVP

**Goal**: Show how app size is distributed across different file types with both size and percentage breakdowns

**Independent Test**: Upload an iOS or Android binary, view Summary page, verify bar chart shows file type categories with sizes and percentages

### Implementation for User Story 1

- [X] T028 [US1] Create FileTypeDistributionChart.vue component in src/components/summary/ that displays file type size distribution using vertical bar chart
- [X] T029 [US1] Add FileTypeDistributionChart component to main SummaryView.vue container at src/components/summary/SummaryView.vue
- [X] T030 [US1] Implement platform detection computed property in FileTypeDistributionChart.vue to conditionally render iOS dual-series (install + download size) vs Android single-series (install size only)
- [X] T031 [US1] Implement categoryData computed property in FileTypeDistributionChart.vue that calls aggregateFilesByType() and filters out categories with zero size
- [X] T032 [US1] Implement chartOptions computed property in FileTypeDistributionChart.vue that transforms categoryData to ECharts options using buildVerticalBarChartOptions() or buildGroupedBarChartOptions() based on platform
- [X] T033 [US1] Add ECharts VChart component to FileTypeDistributionChart.vue template with autoresize and :option binding

**Checkpoint**: User Story 1 complete - File type size distribution chart functional for both iOS and Android apps

---

## Phase 4: User Story 2 - View File Count Distribution (Priority: P1)

**Goal**: Show how many files of each type exist to understand if size comes from many small files or few large files

**Independent Test**: Upload any app binary, view Summary page, verify bar chart shows file counts by category

### Implementation for User Story 2

- [X] T034 [US2] Create FileCountDistributionChart.vue component in src/components/summary/ that displays file type count distribution using vertical bar chart
- [X] T035 [US2] Add FileCountDistributionChart component to SummaryView.vue below FileTypeDistributionChart
- [X] T036 [US2] Implement categoryData computed property in FileCountDistributionChart.vue that calls aggregateFilesByType() and extracts count metric
- [X] T037 [US2] Implement chartOptions computed property in FileCountDistributionChart.vue that transforms count data to ECharts options using buildVerticalBarChartOptions() with formatNumber formatter
- [X] T038 [US2] Add ECharts VChart component to FileCountDistributionChart.vue template with proper styling for count-based display

**Checkpoint**: User Stories 1 AND 2 complete - Both file type size and count distributions functional independently

---

## Phase 5: User Story 3 - View Component Type Distribution (Priority: P2)

**Goal**: Show size distribution between internal (first-party) and external (third-party) components

**Independent Test**: Upload app with dependencies, view Summary page, verify charts show Internal vs External breakdown for both size and count

### Implementation for User Story 3

- [X] T039 [US3] Create ComponentDistributionChart.vue component in src/components/summary/ that displays component type distribution (internal vs external)
- [X] T040 [US3] Add ComponentDistributionChart component to SummaryView.vue below file type charts
- [X] T041 [US3] Implement componentData computed property in ComponentDistributionChart.vue that calls aggregateByComponent() to get internal and external aggregations
- [X] T042 [US3] Implement size chart options computed property in ComponentDistributionChart.vue using transformComponentsToBarChart() with 'size' metric
- [X] T043 [US3] Implement count chart options computed property in ComponentDistributionChart.vue using transformComponentsToBarChart() with 'count' metric
- [X] T044 [US3] Add dual ECharts VChart components to ComponentDistributionChart.vue template showing both size and count side-by-side

**Checkpoint**: User Stories 1, 2, AND 3 complete - All P1 and P2 distribution charts functional independently

---

## Phase 6: User Story 4 - View Additional Size Analytics (Priority: P3)

**Goal**: Provide deep-dive analytics including compression efficiency, top files, localization impact, architecture breakdown, and asset types

**Independent Test**: Upload apps with various characteristics and verify each chart provides specific, actionable data when applicable

### Compression Efficiency Chart (iOS Only)

- [X] T045 [P] [US4] Create CompressionEfficiencyChart.vue component in src/components/summary/ that displays compression efficiency using stacked bar chart
- [X] T046 [US4] Implement hasCompressionData computed property in CompressionEfficiencyChart.vue to check if platform is iOS and totalDownloadSize exists
- [X] T047 [US4] Implement compressionData computed property in CompressionEfficiencyChart.vue that calls analyzeCompressionByType() when data available
- [X] T048 [US4] Implement chartOptions computed property in CompressionEfficiencyChart.vue using transformCompressionToStackedBarChart() and buildStackedBarChartOptions()
- [X] T049 [US4] Add conditional rendering (v-if="hasCompressionData") to CompressionEfficiencyChart.vue template with VChart component

### Top 10 Largest Files Chart

- [X] T050 [P] [US4] Create TopFilesChart.vue component in src/components/summary/ that displays top 10 largest files using horizontal bar chart
- [X] T051 [US4] Implement topFilesData computed property in TopFilesChart.vue that calls getTopFiles() with count=10
- [X] T052 [US4] Implement chartOptions computed property in TopFilesChart.vue using transformFilesToHorizontalBarChart() and buildHorizontalBarChartOptions()
- [X] T053 [US4] Add VChart component to TopFilesChart.vue template with horizontal bar chart display and truncated file paths in labels

### Localization Impact Chart

- [X] T054 [P] [US4] Create LocalizationImpactChart.vue component in src/components/summary/ that displays size contribution per locale
- [X] T055 [US4] Implement hasLocalizations computed property in LocalizationImpactChart.vue to check if 2+ localizations exist and total size >2% threshold
- [X] T056 [US4] Implement localizationData computed property in LocalizationImpactChart.vue that calls analyzeLocalizations()
- [X] T057 [US4] Implement chartOptions computed property in LocalizationImpactChart.vue using transformLocalizationsToBarChart() with 'size' metric
- [X] T058 [US4] Add conditional rendering (v-if="hasLocalizations") to LocalizationImpactChart.vue template with VChart component

### Architecture Breakdown Chart (Android Only)

- [X] T059 [P] [US4] Create ArchitectureBreakdownChart.vue component in src/components/summary/ that displays size per CPU architecture
- [X] T060 [US4] Implement hasArchitectureData computed property in ArchitectureBreakdownChart.vue to check if platform is Android and native libraries exist
- [X] T061 [US4] Implement architectureData computed property in ArchitectureBreakdownChart.vue that calls analyzeArchitectures()
- [X] T062 [US4] Implement chartOptions computed property in ArchitectureBreakdownChart.vue using transformArchitecturesToBarChart() with 'size' metric
- [X] T063 [US4] Add conditional rendering (v-if="hasArchitectureData") to ArchitectureBreakdownChart.vue template with VChart component

### Asset Type Distribution Chart

- [X] T064 [P] [US4] Create AssetTypeDistributionChart.vue component in src/components/summary/ that displays breakdown of images, videos, audio, fonts
- [X] T065 [US4] Implement hasMediaAssets computed property in AssetTypeDistributionChart.vue to check if any media assets exist
- [X] T066 [US4] Implement assetData computed property in AssetTypeDistributionChart.vue that calls categorizeAssetTypes()
- [X] T067 [US4] Implement chartOptions computed property in AssetTypeDistributionChart.vue using transformAssetsToBarChart() with 'size' metric
- [X] T068 [US4] Add conditional rendering (v-if="hasMediaAssets") to AssetTypeDistributionChart.vue template with VChart component

### Integration into Main View

- [X] T069 [US4] Add all US4 chart components (Compression, TopFiles, Localization, Architecture, AssetType) to SummaryView.vue in logical order with section headers
- [X] T070 [US4] Implement responsive layout in SummaryView.vue using CSS Grid or Flexbox to display charts in 1-2 column layout based on viewport width
- [X] T071 [US4] Add summary statistics section at top of SummaryView.vue showing total install size, total download size (iOS), file count, and platform

**Checkpoint**: All user stories (1-4) complete - Full Summary page with all distribution charts and analytics functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

- [X] T072 [P] Add loading states to all chart components in src/components/summary/ for when analysisStore.currentAnalysis is not yet available
- [X] T073 [P] Add error handling for edge cases in aggregation functions (empty trees, missing fields, malformed data)
- [X] T074 Add "Other" category grouping in aggregateFilesByType() for categories representing <1% of total size per spec FR-019
- [X] T075 [P] Ensure all charts use consistent color scheme from src/lib/visualization/color-scheme.js across file type categories
- [X] T076 Add responsive chart sizing in all chart components to handle mobile (375px), tablet (768px), and desktop (1920px) viewports per spec assumptions
- [X] T077 [P] Add ARIA labels and semantic HTML to all chart components for accessibility per plan.md (basic accessibility, no advanced features)
- [ ] T078 Verify chart rendering performance with large apps (10,000+ files) to ensure <2 second load time per success criteria SC-012 (requires manual testing with real binary files)
- [X] T079 Update uiStore.js to add summary view state management (track active view, collapsed sections if needed)
- [ ] T080 Test Summary page with real iOS IPA file to verify dual-series charts (install + download size) render correctly (requires manual testing)
- [ ] T081 Test Summary page with real Android APK file to verify single-series charts and architecture breakdown render correctly (requires manual testing)
- [ ] T082 Validate quickstart.md scenarios by testing integration points described in specs/010-summary-page-graphs/quickstart.md (requires manual validation)
- [ ] T083 Run manual accessibility check on Summary page (keyboard navigation, screen reader compatibility, color contrast) (requires manual testing)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational (Phase 2) completion
  - User Story 1 (P1) can start immediately after Phase 2
  - User Story 2 (P1) can start immediately after Phase 2 (parallel with US1)
  - User Story 3 (P2) can start immediately after Phase 2 (parallel with US1/US2)
  - User Story 4 (P3) can start immediately after Phase 2 (parallel with US1/US2/US3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - Independently testable
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - Independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories - Independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories - Independently testable (each sub-chart independently testable)

### Within Each Phase

**Phase 1 (Setup)**:
- T001 must complete before chart components can be created
- T002, T003 can run in parallel (different files)

**Phase 2 (Foundational)**:
- Aggregation functions (T004-T012): Most can run in parallel [P] except T006 depends on T004, T005
- Chart builders (T013-T020): T017 depends on T013-T016, but T018-T020 are parallel [P]
- Transformers (T021-T027): All can run in parallel [P]

**Phase 3-6 (User Stories)**:
- Each user story is fully independent and can be implemented in parallel
- Within each story: Computed properties before template, component before integration

**Phase 7 (Polish)**:
- Most tasks can run in parallel [P] (different concerns)
- T078-T082 should run after main implementation
- T083 should run last (final validation)

### Parallel Opportunities

**Foundational Phase (maximum parallelization)**:
```bash
# Launch all helper functions together:
T004 [P], T005 [P], T009 [P], T010 [P], T011 [P], T012 [P], T013 [P], T014 [P], T015 [P], T016 [P]

# Launch all chart builders after helpers complete:
T018 [P], T019 [P], T020 [P]

# Launch all transformers together:
T021 [P], T022 [P], T023 [P], T024 [P], T025 [P], T026 [P], T027 [P]
```

**User Story 4 Sub-Charts (maximum parallelization)**:
```bash
# Launch all 5 chart implementations in parallel:
T045-T049 [P] (Compression)
T050-T053 [P] (Top Files)
T054-T058 [P] (Localization)
T059-T063 [P] (Architecture)
T064-T068 [P] (Asset Types)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup → Directory structure ready
2. Complete Phase 2: Foundational → All aggregation and chart builder functions ready (CRITICAL)
3. Complete Phase 3: User Story 1 → File type size distribution working
4. Complete Phase 4: User Story 2 → File type count distribution working
5. **STOP and VALIDATE**: Test both US1 and US2 independently with real IPA/APK files
6. Deploy/demo if ready (MVP delivers core distribution insights)

### Incremental Delivery (Recommended)

1. Setup + Foundational → Foundation ready (all utilities implemented)
2. Add User Story 1 → Test independently → Core size insights available
3. Add User Story 2 → Test independently → File count insights added
4. **Deploy MVP** (P1 features complete - 80% of user value delivered)
5. Add User Story 3 → Test independently → Component analysis added (P2)
6. Add User Story 4 → Test independently → Advanced analytics added (P3)
7. Polish phase → Production-ready

### Parallel Team Strategy

With multiple developers (after Foundational phase completes):

- **Developer A**: User Story 1 (File Type Size) - T028-T033
- **Developer B**: User Story 2 (File Count) - T034-T038
- **Developer C**: User Story 3 (Component Type) - T039-T044
- **Developer D**: User Story 4 (Advanced Analytics) - T045-T071

All stories integrate independently into SummaryView.vue without conflicts.

---

## Parallel Example: Foundational Phase

```bash
# After T001-T003 (Setup) complete, launch all aggregation helpers in parallel:
Task T004 [P]: "Implement mapToDisplayCategory helper in src/utils/calculations.js"
Task T005 [P]: "Implement getDisplayCategoryColor helper in src/utils/calculations.js"
Task T009 [P]: "Implement analyzeCompressionByType in src/utils/calculations.js"
Task T010 [P]: "Implement analyzeLocalizations in src/utils/calculations.js"
Task T011 [P]: "Implement analyzeArchitectures in src/utils/calculations.js"
Task T012 [P]: "Implement categorizeAssetTypes in src/utils/calculations.js"

# Launch chart builder helpers in parallel:
Task T013 [P]: "Implement buildTooltipConfig in src/utils/chart-options.js"
Task T014 [P]: "Implement buildGridConfig in src/utils/chart-options.js"
Task T015 [P]: "Implement buildLegendConfig in src/utils/chart-options.js"
Task T016 [P]: "Implement buildTitleConfig in src/utils/chart-options.js"

# After helpers complete, launch all transformers in parallel:
Task T021 [P]: "Implement transformCategoriesToBarChart in src/utils/chart-options.js"
Task T022 [P]: "Implement transformComponentsToBarChart in src/utils/chart-options.js"
Task T023 [P]: "Implement transformFilesToHorizontalBarChart in src/utils/chart-options.js"
Task T024 [P]: "Implement transformCompressionToStackedBarChart in src/utils/chart-options.js"
Task T025 [P]: "Implement transformLocalizationsToBarChart in src/utils/chart-options.js"
Task T026 [P]: "Implement transformArchitecturesToBarChart in src/utils/chart-options.js"
Task T027 [P]: "Implement transformAssetsToBarChart in src/utils/chart-options.js"
```

---

## Notes

- [P] tasks = different files or independent concerns, no dependencies
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4)
- Each user story is independently completable and testable
- Tests are OPTIONAL and NOT included per project specification
- Commit after each task or logical group of parallel tasks
- Stop at any checkpoint to validate story independently
- All functions documented with JSDoc annotations per contracts/
- Use existing formatBytes() and formatNumber() utilities from src/utils/formatters.js
- Reuse existing color scheme from src/lib/visualization/color-scheme.js
- Platform detection via analysisStore.currentAnalysis.platform
- Chart rendering performance target: <1 second per chart, <2 seconds total page load

---

## Summary

**Total Tasks**: 83 tasks
**MVP Scope**: Phases 1-4 (T001-T038) = 38 tasks → Delivers P1 features (file type size + count distribution)
**Full Feature**: All phases (T001-T083) = 83 tasks → Delivers all P1, P2, P3 features + polish

**Task Breakdown by User Story**:
- Setup: 3 tasks
- Foundational: 24 tasks (blocks all stories)
- User Story 1 (P1): 6 tasks
- User Story 2 (P1): 5 tasks
- User Story 3 (P2): 6 tasks
- User Story 4 (P3): 27 tasks (5 sub-charts + integration)
- Polish: 12 tasks

**Parallel Opportunities**:
- Foundational phase: 20 tasks can run in parallel
- User stories: All 4 stories can run in parallel after foundational
- User Story 4: 5 sub-charts can run in parallel
- Polish: 8 tasks can run in parallel

**Independent Test Criteria**:
- US1: Upload binary → View Summary → See file type size chart with categories and percentages
- US2: Upload binary → View Summary → See file type count chart showing file distribution
- US3: Upload binary → View Summary → See internal vs external component breakdown (size + count)
- US4: Upload binary → View Summary → See 1-5 additional charts based on app characteristics (compression, top files, localizations, architectures, assets)

**Suggested MVP**: Complete Phases 1-4 (T001-T038) to deliver core distribution insights (P1 features only), then iterate with P2 and P3 features based on user feedback.
