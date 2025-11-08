# Tasks: X-Ray Visualization UX Improvements

**Input**: Design documents from `/specs/003-xray-ux-improvements/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are included per user story requirements and TDD best practices

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a single-page application (SPA) with all source in `src/` and tests in `src/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure build tools

- [ ] T001 Install color2k dependency for WCAG contrast calculations in package.json
- [ ] T002 [P] Verify TypeScript 5.9 strict mode configuration in tsconfig.json
- [ ] T003 [P] Verify Vitest 4.0.7 and @testing-library/react 16.3.0 test setup in vitest.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Extend TreemapNode interface with new properties (dimensions, shouldShowLabel, isSearchMatch) in src/types/analysis.ts
- [ ] T005 [P] Create node-label-calculator.ts utility with calculateNodeLabel(), truncateLabel(), estimateTextWidth() in src/lib/visualization/node-label-calculator.ts
- [ ] T006 [P] Enhance color-scheme.ts with WCAG functions: calculateContrastRatio(), getLabelColor(), validateColorPalette() in src/lib/visualization/color-scheme.ts
- [ ] T007 Extend Zustand analysis-store.ts with new state: detailsPanelNodePath, isDetailsPanelOpen, searchMatches, currentSearchMatchIndex, keyboardFocusedNodePath, navigationHistory, hoveredNodePath in src/store/analysis-store.ts
- [ ] T008 Add Zustand actions to analysis-store.ts: setDetailsPanel(), closeDetailsPanel(), setSearchMatches(), navigateToNextMatch(), navigateToPreviousMatch(), setKeyboardFocus(), pushNavigationHistory(), popNavigationHistory(), setHoveredNode() in src/store/analysis-store.ts
- [ ] T009 [P] Create Breadcrumb.tsx shared component with clickable segments and current position indicator in src/components/shared/Breadcrumb.tsx
- [ ] T010 [P] Validate color palette for WCAG AA compliance on app initialization (add to color-scheme.ts exports)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Readable Item Labels and Tooltips (Priority: P1) 🎯 MVP

**Goal**: Display clear, readable labels for each treemap item with specific names (not "App Contents") and prevent text overlap

**Independent Test**: Hover over any treemap item and verify tooltip shows specific item name without text overlap

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Unit test for calculateNodeLabel with threshold checks in src/__tests__/lib/visualization/node-label-calculator.test.ts
- [ ] T012 [P] [US1] Unit test for truncateLabel with long text in src/__tests__/lib/visualization/node-label-calculator.test.ts
- [ ] T013 [P] [US1] Unit test for estimateTextWidth accuracy in src/__tests__/lib/visualization/node-label-calculator.test.ts
- [ ] T014 [P] [US1] Component test for enhanced Treemap tooltip display in src/__tests__/components/xray/Treemap.test.tsx

### Implementation for User Story 1

- [ ] T015 [US1] Update Treemap.tsx label prop to use calculateNodeLabel() and return node.name instead of formatted size in src/components/xray/Treemap.tsx
- [ ] T016 [US1] Update Treemap.tsx labelSkipSize to 1 and implement custom threshold logic via label function in src/components/xray/Treemap.tsx
- [ ] T017 [US1] Update Treemap.tsx labelTextColor prop to use getLabelColor() with WCAG AA compliance in src/components/xray/Treemap.tsx
- [ ] T018 [US1] Update Treemap.tsx tooltip theme to constrain maxWidth to 400px with word-break for long paths in src/components/xray/Treemap.tsx
- [ ] T019 [US1] Add hover state tracking via setHoveredNode() in Treemap.tsx hover handlers in src/components/xray/Treemap.tsx
- [ ] T020 [US1] Update Treemap.tsx colors prop to add subtle glow/border when node matches hoveredNodePath in src/components/xray/Treemap.tsx
- [ ] T021 [US1] Update tooltip component to display node.name as title, formatBytes(node.value), compressedSize, percentage, and type in src/components/xray/Treemap.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - labels display names on boxes >= 50x20px, tooltips show specific names, no text overlap

---

## Phase 4: User Story 2 - Zoom and Focus Navigation (Priority: P1) 🎯 MVP

**Goal**: Enable click-to-zoom drill-down navigation with breadcrumb trails for exploring file hierarchy

**Independent Test**: Click any folder/bundle item and verify it zooms to show children with breadcrumb for navigation back

### Tests for User Story 2

- [ ] T022 [P] [US2] Component test for XRayView zoom state management in src/__tests__/components/xray/XRayView.test.tsx
- [ ] T023 [P] [US2] Component test for Breadcrumb navigation and click handling in src/__tests__/components/shared/Breadcrumb.test.tsx
- [ ] T024 [P] [US2] Integration test for click-to-zoom → breadcrumb update → click breadcrumb → zoom out in src/__tests__/components/xray/XRayView.test.tsx

### Implementation for User Story 2

- [ ] T025 [US2] Enable Nivo animate prop and set motionConfig to "gentle" (300ms) in Treemap.tsx in src/components/xray/Treemap.tsx
- [ ] T026 [US2] Add onClick handler to Treemap.tsx that checks node.children.length > 0 and calls pushNavigationHistory() + setXRayZoom(node.path) in src/components/xray/Treemap.tsx
- [ ] T027 [US2] Add click handler for leaf nodes (no children) that highlights without zooming in src/components/xray/Treemap.tsx
- [ ] T028 [US2] Calculate breadcrumb path from xrayZoomPath in XRayView.tsx using path.split('/') in src/components/xray/XRayView.tsx
- [ ] T029 [US2] Render Breadcrumb component in XRayView.tsx with segments from breadcrumb path in src/components/xray/XRayView.tsx
- [ ] T030 [US2] Implement breadcrumb segment click handler that calls setXRayZoom(segmentPath) in src/components/xray/XRayView.tsx
- [ ] T031 [US2] Add "Home" button or root breadcrumb segment that calls setXRayZoom(null) to return to root in src/components/xray/XRayView.tsx
- [ ] T032 [US2] Add visual indicator (cursor change or icon) for clickable/zoomable items vs leaf nodes in src/components/xray/Treemap.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - full navigation with labels

---

## Phase 5: User Story 3 - Visual Hierarchy and Contrast (Priority: P2)

**Goal**: Provide clear visual differentiation between item types and sizes with WCAG AA compliant colors

**Independent Test**: Load app with mixed content types and verify distinct colors with sufficient contrast

### Tests for User Story 3

- [ ] T033 [P] [US3] Unit test for WCAG contrast ratio calculations in src/__tests__/lib/visualization/color-scheme.test.ts
- [ ] T034 [P] [US3] Unit test for validateColorPalette with TYPE_COLORS in src/__tests__/lib/visualization/color-scheme.test.ts
- [ ] T035 [P] [US3] Unit test for getLabelColor returns white or black based on background in src/__tests__/lib/visualization/color-scheme.test.ts

### Implementation for User Story 3

- [ ] T036 [P] [US3] Review and adjust TYPE_COLORS palette for WCAG AA compliance (3:1 graphics, 4.5:1 text) in src/lib/visualization/color-scheme.ts
- [ ] T037 [US3] Implement ensureWCAGContrast() utility that adjusts colors programmatically if needed in src/lib/visualization/color-scheme.ts
- [ ] T038 [US3] Add getHoverHighlightColor() that lightens/darkens base color by 10% in src/lib/visualization/color-scheme.ts
- [ ] T039 [US3] Add getSearchHighlightColor() that returns fixed yellow #fbbf24 in src/lib/visualization/color-scheme.ts
- [ ] T040 [US3] Update Treemap.tsx colors prop to apply hover highlight when hoveredNodePath matches in src/components/xray/Treemap.tsx
- [ ] T041 [US3] Ensure "Color by Type" mode uses WCAG-validated colors from WCAG_VALIDATED_COLORS in src/components/xray/Treemap.tsx
- [ ] T042 [US3] Ensure "Color by Size" mode gradient maintains 3:1 contrast with borders in src/lib/visualization/color-scheme.ts

**Checkpoint**: All visual improvements complete with WCAG AA compliance verified

---

## Phase 6: User Story 4 - Interactive Details Panel (Priority: P3)

**Goal**: Provide detailed metadata panel triggered by info icon button with comprehensive file information

**Independent Test**: Click info icon on any item and verify details panel shows metadata including size, percentage, path

### Tests for User Story 4

- [ ] T043 [P] [US4] Component test for DetailsPanel rendering with mock data in src/__tests__/components/xray/DetailsPanel.test.tsx
- [ ] T044 [P] [US4] Component test for DetailsPanel close button and Escape key in src/__tests__/components/xray/DetailsPanel.test.tsx
- [ ] T045 [P] [US4] Component test for InfoIconButton visibility logic (hover vs always) in src/__tests__/components/xray/InfoIconButton.test.tsx
- [ ] T046 [P] [US4] Component test for toDetailsPanelData transformation in src/__tests__/components/xray/DetailsPanel.test.tsx

### Implementation for User Story 4

- [ ] T047 [P] [US4] Create DetailsPanel.tsx component with slide-out animation (300ms from right) in src/components/xray/DetailsPanel.tsx
- [ ] T048 [P] [US4] Create InfoIconButton.tsx component with conditional visibility based on node size in src/components/xray/InfoIconButton.tsx
- [ ] T049 [US4] Implement toDetailsPanelData() transformation function in DetailsPanel.tsx in src/components/xray/DetailsPanel.tsx
- [ ] T050 [US4] Add helper functions: countDescendants(), getParentPath() in DetailsPanel.tsx in src/components/xray/DetailsPanel.tsx
- [ ] T051 [US4] Render DetailsPanel sections: header, path, size details, metadata, children count in src/components/xray/DetailsPanel.tsx
- [ ] T052 [US4] Add close button and Escape key handler to DetailsPanel in src/components/xray/DetailsPanel.tsx
- [ ] T053 [US4] Add optional "Zoom to this item" action button for zoomable nodes in src/components/xray/DetailsPanel.tsx
- [ ] T054 [US4] Integrate DetailsPanel in XRayView.tsx with state management (detailsPanelNodePath, isDetailsPanelOpen) in src/components/xray/XRayView.tsx
- [ ] T055 [US4] Create useMemo to find node by detailsPanelNodePath and transform to DetailsPanelData in src/components/xray/XRayView.tsx
- [ ] T056 [US4] Add info icon overlay rendering logic in Treemap or custom TreemapNode component in src/components/xray/TreemapNode.tsx
- [ ] T057 [US4] Position info icon absolutely (top-right corner) with pointer-events handling to avoid blocking node clicks in src/components/xray/InfoIconButton.tsx
- [ ] T058 [US4] Implement shouldShowInfoIconAlways() logic (>= 100x40px) vs hover-only (<100x40px) in src/components/xray/InfoIconButton.tsx

**Checkpoint**: Details panel fully functional with info icon trigger and comprehensive metadata display

---

## Phase 7: User Story 5 - Search and Highlight (Priority: P3)

**Goal**: Enable cross-hierarchy search with auto-navigation to matches and visual highlighting

**Independent Test**: Enter search term and verify matches across entire hierarchy are found and navigable

### Tests for User Story 5

- [ ] T059 [P] [US5] Unit test for searchTree with various query patterns in src/__tests__/lib/visualization/treemap-generator.test.ts
- [ ] T060 [P] [US5] Unit test for extractParentForZoom with different path depths in src/__tests__/lib/visualization/treemap-generator.test.ts
- [ ] T061 [P] [US5] Component test for search navigation (next/previous) in src/__tests__/components/xray/XRayView.test.tsx

### Implementation for User Story 5

- [ ] T062 [US5] Enhance searchTree() function to return array of matching paths (if not already implemented) in src/lib/visualization/treemap-generator.ts
- [ ] T063 [US5] Create extractParentForZoom() utility that extracts parent path from match path in src/lib/visualization/treemap-generator.ts
- [ ] T064 [US5] Add useEffect in XRayView.tsx that calls searchTree when xraySearchQuery changes and updates searchMatches in src/components/xray/XRayView.tsx
- [ ] T065 [US5] Update search input UI to show match count and navigation buttons (Previous/Next) in src/components/xray/XRayView.tsx
- [ ] T066 [US5] Add keyboard shortcuts: Enter for next match, Shift+Enter for previous match in src/components/xray/XRayView.tsx
- [ ] T067 [US5] Implement navigateToNextMatch() that cycles through matches and zooms to parent path in src/store/analysis-store.ts
- [ ] T068 [US5] Implement navigateToPreviousMatch() that cycles backward through matches in src/store/analysis-store.ts
- [ ] T069 [US5] Update Treemap.tsx colors prop to apply yellow highlight (#fbbf24) when path in searchMatches in src/components/xray/Treemap.tsx
- [ ] T070 [US5] Add pulsing border animation for currentMatchPath (CSS or styled component) in src/components/xray/Treemap.tsx
- [ ] T071 [US5] Desaturate non-matching items by 40% when search is active for emphasis in src/components/xray/Treemap.tsx
- [ ] T072 [US5] Display "Match X of N" indicator in search UI in src/components/xray/XRayView.tsx

**Checkpoint**: Search fully functional across entire hierarchy with auto-navigation and highlighting

---

## Phase 8: Keyboard Navigation & Accessibility (Cross-Cutting)

**Purpose**: Add keyboard shortcuts and WCAG AA accessibility compliance

- [ ] T073 [P] Create handleKeyDown handler in XRayView.tsx for keyboard shortcuts (/, Home, Escape, Enter) in src/components/xray/XRayView.tsx
- [ ] T074 [P] Add keyboard shortcut: "/" to focus search input in src/components/xray/XRayView.tsx
- [ ] T075 [P] Add keyboard shortcut: "Home" to return to root view (setXRayZoom(null)) in src/components/xray/XRayView.tsx
- [ ] T076 [P] Add keyboard shortcut: "Escape" to zoom out one level or close details panel in src/components/xray/XRayView.tsx
- [ ] T077 [P] Add keyboard shortcut: "Enter" on focused node to zoom in (if has children) in src/components/xray/XRayView.tsx
- [ ] T078 [P] Add ARIA labels: role="img" and aria-label="Treemap visualization" to treemap container in src/components/xray/XRayView.tsx
- [ ] T079 [P] Add aria-live="polite" region that announces zoom actions for screen readers in src/components/xray/XRayView.tsx
- [ ] T080 [P] Add aria-label="Hierarchy navigation" to breadcrumb nav element in src/components/shared/Breadcrumb.tsx
- [ ] T081 [P] Ensure all interactive elements (buttons, breadcrumbs, search input) are keyboard accessible with Tab in src/components/xray/XRayView.tsx
- [ ] T082 [P] Add visual focus indicator (2px dashed outline) for keyboard navigation in Treemap or via CSS in src/components/xray/Treemap.tsx

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T083 [P] Add comprehensive JSDoc comments to all new utility functions (node-label-calculator.ts, color-scheme.ts) in src/lib/visualization/
- [ ] T084 [P] Review and optimize useMemo dependencies in XRayView.tsx for treemap data regeneration in src/components/xray/XRayView.tsx
- [ ] T085 [P] Test performance with large datasets (1000+ nodes) and ensure render <500ms, tooltip <200ms, zoom animation 60fps in browser DevTools
- [ ] T086 [P] Validate all unit and component tests pass with npm test
- [ ] T087 [P] Test responsive design at different viewport sizes (1280x720, 1920x1080, 2560x1440) in browser DevTools
- [ ] T088 [P] Run WCAG contrast checker browser extension on all color combinations to verify AA compliance
- [ ] T089 [P] Test with keyboard-only navigation to ensure all features accessible without mouse
- [ ] T090 [P] Review quickstart.md examples and verify all code snippets match implementation in specs/003-xray-ux-improvements/quickstart.md
- [ ] T091 Code cleanup: remove console.logs, ensure consistent formatting, fix linting warnings across all modified files
- [ ] T092 Performance optimization: memoize expensive calculations, optimize re-renders with React.memo if needed across components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 2 (P1) are MVP - highest priority
  - User Story 3 (P2) builds on US1/US2 visual improvements
  - User Story 4 (P3) and User Story 5 (P3) are enhancements
- **Keyboard Navigation (Phase 8)**: Can proceed in parallel with user stories or after
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent but integrates with US1 (labels visible during zoom)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances colors from US1/US2
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent details panel
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent search feature

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Utility functions before components
- Components before integration
- Core implementation before visual enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: All Setup tasks [P] can run in parallel (T001, T002, T003)
- **Phase 2**: Tasks T005, T006, T009, T010 can run in parallel (different files)
- **User Story Tests**: All tests within a story marked [P] can run in parallel
- **User Stories**: Once Foundational completes, US1, US2, US3, US4, US5 can all start in parallel (if team capacity allows)
- **Phase 8**: All keyboard/accessibility tasks marked [P] can run in parallel
- **Phase 9**: All polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for calculateNodeLabel with threshold checks" (T011)
Task: "Unit test for truncateLabel with long text" (T012)
Task: "Unit test for estimateTextWidth accuracy" (T013)
Task: "Component test for enhanced Treemap tooltip display" (T014)

# After tests fail, implement foundation:
Task: "Create node-label-calculator.ts utility" (T005 from Phase 2)
Task: "Enhance color-scheme.ts with WCAG functions" (T006 from Phase 2)

# Then implement User Story 1 features sequentially:
# (Sequential because all modify Treemap.tsx)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010) - CRITICAL
3. Complete Phase 3: User Story 1 (T011-T021) - Readable labels
4. Complete Phase 4: User Story 2 (T022-T032) - Zoom navigation
5. **STOP and VALIDATE**: Test combined US1+US2 independently
6. Deploy/demo MVP with labels and navigation

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Labels work
3. Add User Story 2 → Test independently → Navigation works → **Deploy MVP!**
4. Add User Story 3 → Test independently → Better colors → Deploy
5. Add User Story 4 → Test independently → Details panel → Deploy
6. Add User Story 5 → Test independently → Search → Deploy
7. Add Keyboard Navigation → Test → Deploy
8. Polish → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T010)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T011-T021) - Labels
   - **Developer B**: User Story 2 (T022-T032) - Zoom navigation
   - **Developer C**: User Story 3 (T033-T042) - Colors (can start early)
3. After US1+US2 merge:
   - **Developer A**: User Story 4 (T043-T058) - Details panel
   - **Developer B**: User Story 5 (T059-T072) - Search
   - **Developer C**: Phase 8 Keyboard (T073-T082)
4. Final: All developers collaborate on Phase 9 Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **MVP**: User Stories 1 + 2 deliver core value (readable labels + navigation)
- **Enhanced**: Add User Stories 3-5 for complete UX overhaul
- Run `npm test` frequently to catch regressions early
- Use browser DevTools Performance tab to validate render times <500ms

---

## Task Count Summary

- **Total Tasks**: 92
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 7 tasks
- **Phase 3 (US1 - Labels)**: 11 tasks (4 tests + 7 implementation)
- **Phase 4 (US2 - Zoom)**: 11 tasks (3 tests + 8 implementation)
- **Phase 5 (US3 - Colors)**: 10 tasks (3 tests + 7 implementation)
- **Phase 6 (US4 - Details Panel)**: 16 tasks (4 tests + 12 implementation)
- **Phase 7 (US5 - Search)**: 14 tasks (3 tests + 11 implementation)
- **Phase 8 (Keyboard/A11y)**: 10 tasks
- **Phase 9 (Polish)**: 10 tasks

**Parallel Opportunities Identified**: 45 tasks marked [P] (can run concurrently within phase constraints)

**Suggested MVP Scope**: Phases 1-4 (User Stories 1 + 2) = 32 tasks for core functionality
