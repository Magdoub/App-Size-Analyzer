# Tasks: Xray Chart and Insights Enhancements

**Input**: Design documents from `/specs/007-xray-insights-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test tasks included per feature specification (tests not explicitly requested)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single project structure: `src/`, `src/__tests__/` at repository root
- Vue 3 components in `src/components/`
- Library code in `src/lib/`
- Stores in `src/stores/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions

- [X] T001 Add ColorMode typedef to src/types/analysis.js with JSDoc annotations
- [X] T002 Add EnhancedInsightResult, AffectedFile, and InsightMetadata typedefs to src/types/analysis.js
- [X] T003 Add ColorGradientConfig and LabelRenderConfig typedefs to src/types/analysis.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add colorMode state property (default 'type') to xray object in src/stores/uiStore.js
- [X] T005 Add sizePercentiles state property (default []) to xray object in src/stores/uiStore.js
- [X] T006 Implement setXRayColorMode(mode) action in src/stores/uiStore.js with sessionStorage persistence
- [X] T007 Implement updateSizePercentiles(percentiles) action in src/stores/uiStore.js
- [X] T008 Implement initializeColorMode() action in src/stores/uiStore.js to restore from sessionStorage
- [X] T009 Add calculateSizePercentiles(root) function to src/lib/visualization/color-scheme.js
- [X] T010 Add getColorBySizeGradient(size, totalSize, percentiles, config) function to src/lib/visualization/color-scheme.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Color Visualization Modes (Priority: P1) 🎯 MVP

**Goal**: Enable users to switch between "Color by Size" (blue gradient) and "Color by Type" (categorical colors) to gain different insights about app structure

**Independent Test**: Upload an app file, view Xray chart, toggle between "Color by Size" and "Color by Type" modes. Each mode renders distinct, meaningful color schemes.

### Implementation for User Story 1

- [X] T011 [P] [US1] Update getNodeColor() function in src/lib/visualization/color-scheme.js to accept colorMode and percentiles parameters
- [X] T012 [P] [US1] Add color mode toggle UI (button group) to src/components/xray/XRayView.vue template
- [X] T013 [US1] Import and use storeToRefs and useUiStore in src/components/xray/XRayView.vue script
- [X] T014 [US1] Add colorMode computed property in src/components/xray/XRayView.vue using storeToRefs
- [X] T015 [US1] Add sizePercentiles computed property in src/components/xray/XRayView.vue using storeToRefs
- [X] T016 [US1] Add setColorMode action handler in src/components/xray/XRayView.vue that calls uiStore.setXRayColorMode
- [X] T017 [US1] Add onMounted hook in src/components/xray/XRayView.vue to calculate and update size percentiles
- [X] T018 [US1] Pass colorMode prop to Treemap component in src/components/xray/XRayView.vue
- [X] T019 [US1] Pass sizePercentiles prop to Treemap component in src/components/xray/XRayView.vue
- [X] T020 [US1] Add colorMode prop definition in src/components/xray/Treemap.vue
- [X] T021 [US1] Add sizePercentiles prop definition in src/components/xray/Treemap.vue
- [X] T022 [US1] Update getNodeColorForChart function in src/components/xray/Treemap.vue to check colorMode and call appropriate color function
- [X] T023 [US1] Ensure chartOption computed property in src/components/xray/Treemap.vue is reactive to colorMode changes
- [X] T024 [US1] Add CSS styles for button group and btn-active class in src/components/xray/XRayView.vue
- [X] T025 [US1] Call initializeColorMode() in src/App.vue onMounted hook to restore session preference

**Checkpoint**: At this point, User Story 1 should be fully functional - users can toggle color modes and see distinct visualizations

---

## Phase 4: User Story 2 - Visible Chart Labels (Priority: P2)

**Goal**: Display text labels on Xray chart elements to quickly identify files without hovering, improving chart readability

**Independent Test**: Load an app file and verify that file names appear as text labels within chart rectangles where space permits, with appropriate text sizing and contrast

### Implementation for User Story 2

- [X] T026 [US2] Verify label.show is set to true in chartOption in src/components/xray/Treemap.vue
- [X] T027 [US2] Verify getNodeLabel formatter in src/components/xray/Treemap.vue enforces 50x20 pixel minimum
- [X] T028 [US2] Add getLabelTextColor function in src/components/xray/Treemap.vue that uses getLabelColor from color-scheme.js
- [X] T029 [US2] Update chartOption label.color in src/components/xray/Treemap.vue to use getLabelTextColor function
- [X] T030 [US2] Verify label.overflow is set to 'truncate' in chartOption in src/components/xray/Treemap.vue
- [X] T031 [US2] Test label contrast with size gradient colors (light and dark blue) and adjust if needed in src/lib/visualization/color-scheme.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - labels display with proper contrast in both color modes

---

## Phase 5: User Story 3 - Enhanced Insights Details (Priority: P3)

**Goal**: Provide detailed and actionable recommendations in Insights section with specific file names, size impacts, and optimization strategies

**Independent Test**: Load various app files and verify Insights section displays specific, actionable recommendations with concrete data (file paths, sizes, percentages) rather than generic advice

### Implementation for User Story 3

- [X] T032 [P] [US3] Add ruleLargeFilesTop10(analysis) function to src/lib/analysis/insight-engine.js
- [X] T033 [P] [US3] Add ruleUncompressedImages(analysis) function to src/lib/analysis/insight-engine.js
- [X] T034 [P] [US3] Add ruleDuplicateFileNames(analysis) function to src/lib/analysis/insight-engine.js
- [X] T035 [P] [US3] Add ruleFrameworkSizeAnalysis(analysis) function to src/lib/analysis/insight-engine.js
- [X] T036 [US3] Add registerEnhancedInsightRules(engine) export function to src/lib/analysis/insight-engine.js
- [X] T037 [US3] Import registerEnhancedInsightRules in src/components/insights/InsightsView.vue
- [X] T038 [US3] Call registerEnhancedInsightRules(engine) in onMounted hook in src/components/insights/InsightsView.vue
- [X] T039 [US3] Update InsightCard template in src/components/insights/InsightCard.vue to display affected files table
- [X] T040 [US3] Add table HTML structure (thead, tbody) in affected-files section in src/components/insights/InsightCard.vue
- [X] T041 [US3] Add v-for loop for insight.affectedFiles in src/components/insights/InsightCard.vue
- [X] T042 [US3] Display file path, size (formatted), and context columns in src/components/insights/InsightCard.vue
- [X] T043 [US3] Add formatBytes helper function in src/components/insights/InsightCard.vue
- [X] T044 [US3] Display potentialSavings (formatted) in recommendation section in src/components/insights/InsightCard.vue
- [X] T045 [US3] Add CSS styles for affected-files table in src/components/insights/InsightCard.vue
- [X] T046 [US3] Add migration compatibility logic to handle legacy string[] affectedFiles format in src/components/insights/InsightCard.vue

**Checkpoint**: All user stories should now be independently functional - enhanced insights show file-level details

---

## Phase 6: TSX File Cleanup

**Purpose**: Remove all remaining TypeScript React (.tsx) files from Vue migration

- [X] T047 [P] Delete src/App.tsx
- [X] T048 [P] Delete src/main.tsx
- [X] T049 [P] Delete src/components/xray/Treemap.tsx
- [X] T050 [P] Delete src/components/xray/XRayView.tsx
- [X] T051 [P] Delete src/components/xray/CategoryFilter.tsx
- [X] T052 [P] Delete src/components/insights/InsightsView.tsx
- [X] T053 [P] Delete src/components/insights/InsightCard.tsx
- [X] T054 [P] Delete src/components/insights/InsightFilters.tsx
- [X] T055 [P] Delete src/components/insights/SeveritySection.tsx
- [X] T056 [P] Delete src/components/breakdown/BreakdownView.tsx
- [X] T057 [P] Delete src/components/breakdown/BreakdownTabs.tsx
- [X] T058 [P] Delete src/components/breakdown/BreakdownTable.tsx
- [X] T059 [P] Delete src/components/shared/Breadcrumb.tsx
- [X] T060 [P] Delete src/components/shared/LoadingSpinner.tsx
- [X] T061 [P] Delete src/components/shared/ErrorBoundary.tsx
- [X] T062 [P] Delete src/components/upload/UploadZone.tsx
- [X] T063 [P] Delete src/components/upload/FileValidator.tsx
- [X] T064 [P] Delete src/__tests__/components/xray/Treemap.test.tsx
- [X] T065 [P] Delete src/__tests__/components/xray/XRayView.test.tsx
- [X] T066 [P] Delete src/__tests__/components/breakdown/BreakdownTable.test.tsx
- [X] T067 [P] Delete src/__tests__/components/shared/Breadcrumb.test.tsx
- [X] T068 Verify no remaining .tsx imports exist by running: grep -r "from.*\.tsx" src/ or grep -r "import.*\.tsx" src/
- [X] T069 Test dev server runs without errors after TSX file removal

**Checkpoint**: Codebase is fully migrated to Vue - zero TypeScript React files remain

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and validation

- [X] T070 [P] Add JSDoc documentation for all new functions in src/lib/visualization/color-scheme.js
- [X] T071 [P] Add JSDoc documentation for all new functions in src/lib/analysis/insight-engine.js
- [X] T072 [P] Add JSDoc documentation for new actions in src/stores/uiStore.js
- [ ] T073 Test color mode persistence: set mode, navigate away, return to Xray, verify mode persists
- [ ] T074 Test with small app (<10MB): verify gradient works with limited file size range
- [ ] T075 Test with large app (>100MB): verify gradient handles outliers appropriately
- [ ] T076 Test label visibility with various zoom levels in Xray chart
- [ ] T077 Test WCAG AA contrast compliance: verify text color on all gradient shades
- [ ] T078 Verify all insights provide specific file recommendations (not generic advice)
- [ ] T079 Run quickstart.md validation: follow all 6 scenarios and verify functionality
- [ ] T080 Performance check: verify color mode switching completes in <100ms
- [ ] T081 Performance check: verify label rendering maintains 60 FPS (no frame drops)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **TSX Cleanup (Phase 6)**: Can run in parallel with user stories or after - independent
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Color Modes**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2) - Labels**: Can start after Foundational (Phase 2) - Works with US1 but independently testable
- **User Story 3 (P3) - Enhanced Insights**: Can start after Foundational (Phase 2) - Completely independent of US1/US2

### Within Each User Story

**User Story 1 (Color Modes)**:
- T011 (update getNodeColor) must complete before T022 (use in Treemap)
- T012-T017 (XRayView changes) can be done in parallel
- T020-T023 (Treemap changes) must follow XRayView props being passed

**User Story 2 (Labels)**:
- T026-T031 can be done sequentially or in 2 parallel groups:
  - Group A: T026-T030 (Treemap label config)
  - Group B: T031 (contrast testing/adjustment)

**User Story 3 (Enhanced Insights)**:
- T032-T035 (rule functions) can run in parallel
- T036 (register function) must follow rule functions
- T037-T038 (InsightsView) must follow T036
- T039-T046 (InsightCard) can be done in parallel with T037-T038

**Phase 6 (TSX Cleanup)**:
- All deletion tasks (T047-T067) can run in parallel
- T068-T069 (verification) must follow all deletions

### Parallel Opportunities

- **Phase 1**: All T001-T003 can run in parallel (different type definitions)
- **Phase 2**: T004-T005 in parallel, T006-T008 in parallel, T009-T010 in parallel
- **Phase 3 (US1)**: T011-T012 in parallel, T013-T019 in parallel
- **Phase 5 (US3)**: T032-T035 in parallel, T039-T046 in parallel
- **Phase 6**: T047-T067 (all deletions) in parallel
- **Phase 7**: T070-T072 (documentation) in parallel, T073-T081 (tests) can be grouped

---

## Parallel Example: User Story 1 (Color Modes)

```bash
# Launch foundational color functions together:
Task T011: "Update getNodeColor() in src/lib/visualization/color-scheme.js"
Task T012: "Add color mode toggle UI to src/components/xray/XRayView.vue"

# Launch XRayView changes together:
Task T013: "Import storeToRefs in XRayView.vue"
Task T014: "Add colorMode computed in XRayView.vue"
Task T015: "Add sizePercentiles computed in XRayView.vue"
Task T016: "Add setColorMode handler in XRayView.vue"
```

---

## Parallel Example: User Story 3 (Enhanced Insights)

```bash
# Launch all insight rule functions together:
Task T032: "Add ruleLargeFilesTop10() to insight-engine.js"
Task T033: "Add ruleUncompressedImages() to insight-engine.js"
Task T034: "Add ruleDuplicateFileNames() to insight-engine.js"
Task T035: "Add ruleFrameworkSizeAnalysis() to insight-engine.js"

# Launch InsightCard UI changes together:
Task T039: "Update InsightCard template for files table"
Task T041: "Add v-for loop for affectedFiles"
Task T043: "Add formatBytes helper"
Task T045: "Add CSS for files table"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003) - ~15 minutes
2. Complete Phase 2: Foundational (T004-T010) - ~45 minutes
3. Complete Phase 3: User Story 1 (T011-T025) - ~2 hours
4. **STOP and VALIDATE**: Test color mode switching independently
5. Deploy/demo if ready - users can now visualize by size or type

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~1 hour)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! Core feature)
3. Add User Story 2 → Test independently → Deploy/Demo (Labels enhancement)
4. Add User Story 3 → Test independently → Deploy/Demo (Insights enhancement)
5. Run Phase 6 (TSX Cleanup) → Deploy/Demo (Clean codebase)
6. Run Phase 7 (Polish) → Deploy/Demo (Production ready)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (~1 hour)
2. Once Foundational is done:
   - Developer A: User Story 1 (Color Modes) - ~2 hours
   - Developer B: User Story 2 (Labels) - ~1 hour
   - Developer C: User Story 3 (Insights) - ~2.5 hours
   - Developer D: Phase 6 (TSX Cleanup) - ~30 minutes
3. Stories complete and integrate independently
4. All developers: Phase 7 (Polish & Validation) - ~1 hour

**Total parallel time**: ~3.5 hours vs ~7 hours sequential

---

## Summary

**Total Tasks**: 81 tasks across 7 phases

**Task Breakdown by Phase**:
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 7 tasks
- Phase 3 (US1 - Color Modes): 15 tasks
- Phase 4 (US2 - Labels): 6 tasks
- Phase 5 (US3 - Insights): 15 tasks
- Phase 6 (TSX Cleanup): 23 tasks
- Phase 7 (Polish): 12 tasks

**Task Breakdown by User Story**:
- User Story 1 (P1): 15 implementation tasks
- User Story 2 (P2): 6 implementation tasks
- User Story 3 (P3): 15 implementation tasks
- Infrastructure: 10 tasks
- Cleanup: 23 tasks
- Validation: 12 tasks

**Parallel Opportunities Identified**: 45+ tasks can run in parallel (marked with [P])

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 25 tasks

**Estimated Time**:
- Sequential: ~7 hours (all 81 tasks)
- MVP Only: ~3 hours (Setup + Foundational + US1)
- Parallel (4 developers): ~3.5 hours (all 81 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each logical group of tasks (per user story or phase)
- Stop at any checkpoint to validate story independently
- TSX cleanup (Phase 6) can be done anytime but recommended before final polish
- Phase 7 validation ensures WCAG AA compliance, performance goals, and feature completeness
