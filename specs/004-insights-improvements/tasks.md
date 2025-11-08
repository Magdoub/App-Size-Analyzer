# Tasks: Enhanced Insights Experience

**Feature Branch**: `004-insights-improvements`
**Input**: Design documents from `/specs/004-insights-improvements/`
**Prerequisites**: ✅ plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested in specification - NO test tasks included
**Organization**: Tasks grouped by user story to enable independent implementation

## Format: `- [ ] [TID] [P?] [StoryLabel?] Description with file path`

- **Checkbox**: `- [ ]` (markdown checkbox format)
- **[TID]**: Task ID (T001, T002, T003...)
- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[StoryLabel]**: User story label [US1], [US2], [US3], [US4] (only for user story tasks)
- **File paths**: Exact paths from project structure in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [X] T001 Verify TypeScript configuration and build setup
- [X] T002 [P] Verify Tailwind CSS 3.4.18 configuration is working
- [X] T003 [P] Verify Zustand 5.0.8 is available in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state management setup that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add insightsGroupBySeverity boolean field to AnalysisStore in src/store/analysis-store.ts (default: true)
- [X] T005 Add setInsightsGroupBySeverity action to AnalysisStore in src/store/analysis-store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Full-Page Insights Scrolling (Priority: P1) 🎯 MVP

**Goal**: Remove nested scrolling and enable natural full-page scroll behavior on the Insights page

**Independent Test**: Open Insights page with multiple insights, scroll with mouse wheel/trackpad, verify entire page scrolls together without internal scroll containers

**Why MVP**: This is the most critical usability issue affecting all users immediately

### Implementation for User Story 1

- [X] T006 [US1] Remove maxHeight style constraint from insights list container in src/components/insights/InsightsView.tsx
- [X] T007 [US1] Remove overflow-y-auto class from insights list container in src/components/insights/InsightsView.tsx
- [X] T008 [US1] Update parent container to use min-h-screen instead of fixed height in src/components/insights/InsightsView.tsx
- [X] T009 [US1] Add space-y-4 for consistent vertical spacing between insight cards in src/components/insights/InsightsView.tsx
- [X] T010 [US1] Verify natural document flow from header to footer without nested scroll areas in src/components/insights/InsightsView.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - entire Insights page scrolls naturally without nested scrollbars

---

## Phase 4: User Story 2 - Enhanced Insight Card Design (Priority: P2)

**Goal**: Improve insight card visual design with clear severity indicators, prominent savings display, and information-dense layout

**Independent Test**: View insights list and verify each card displays severity indicator, title, description, savings (MB + percentage), affected item count, and fix suggestion without expanding

**Why P2**: Improves decision-making efficiency but doesn't block basic usage (US1 already fixed scrolling)

### Implementation for User Story 2

- [X] T011 [P] [US2] Add visual weight differentiation for critical severity in src/components/insights/InsightCard.tsx (border-2 instead of border)
- [X] T012 [P] [US2] Add shadow-md to high severity cards in src/components/insights/InsightCard.tsx
- [X] T013 [US2] Enhance severity badge prominence with larger text and padding for critical/high in src/components/insights/InsightCard.tsx
- [X] T014 [US2] Promote savings display to hero position with larger font and bold styling in src/components/insights/InsightCard.tsx
- [X] T015 [US2] Add category tag to card header as chip/label in src/components/insights/InsightCard.tsx
- [X] T016 [US2] Improve fix suggestion visibility with colored left border or icon in src/components/insights/InsightCard.tsx
- [X] T017 [US2] Reduce visual weight of metadata (rule ID) making it subtle in bottom-right in src/components/insights/InsightCard.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - scrolling works naturally AND cards are visually enhanced

---

## Phase 5: User Story 3 - Improved Insights Hierarchy and Grouping (Priority: P3)

**Goal**: Organize insights by severity level with visible section headers and category information

**Independent Test**: Generate insights across different severity levels, verify they are grouped with section headers (Critical, High, Medium, Low) and category tags visible on each card

**Why P3**: Better organization for power users but not essential for core experience

### Implementation for User Story 3

- [X] T018 [P] [US3] Create SeveritySection component in src/components/insights/SeveritySection.tsx
- [X] T019 [P] [US3] Add grouping toggle button to InsightFilters component in src/components/insights/InsightFilters.tsx
- [X] T020 [US3] Implement groupedInsights useMemo in InsightsView to transform flat array to severity groups in src/components/insights/InsightsView.tsx
- [X] T021 [US3] Implement sorting within each severity group by potentialSavings descending in src/components/insights/InsightsView.tsx
- [X] T022 [US3] Add conditional rendering logic to switch between flat list and grouped sections in src/components/insights/InsightsView.tsx
- [X] T023 [US3] Implement severity section headers with sticky positioning and severity counts in src/components/insights/SeveritySection.tsx
- [X] T024 [US3] Wire grouping toggle button to setInsightsGroupBySeverity Zustand action in src/components/insights/InsightFilters.tsx

**Checkpoint**: All user stories 1, 2, AND 3 should now be independently functional - scrolling + enhanced cards + severity grouping

---

## Phase 6: User Story 4 - Expandable Insight Details (Priority: P3)

**Goal**: Enhance expand/collapse functionality with better layout and information presentation for affected files

**Independent Test**: Click insight card to expand, verify all affected files listed with paths and sizes, and layout remains stable

**Why P3**: Enhances existing functionality that already works, focuses on better presentation

### Implementation for User Story 4

- [X] T025 [US4] Add transition-all duration-300 ease-in-out classes to expandable section in src/components/insights/InsightCard.tsx
- [X] T026 [US4] Implement max-height animation (0 to 1000px) with opacity transition in src/components/insights/InsightCard.tsx
- [X] T027 [US4] Add aria-expanded and aria-label attributes to expand/collapse button in src/components/insights/InsightCard.tsx
- [X] T028 [US4] Improve affected items list layout with file paths and individual sizes in src/components/insights/InsightCard.tsx
- [X] T029 [US4] Add React.memo to InsightCard component to prevent unnecessary re-renders in src/components/insights/InsightCard.tsx

**Checkpoint**: All user stories should now be independently functional with smooth animations

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

- [X] T030 [P] Wrap filteredInsights computation in useMemo with correct dependencies in src/components/insights/InsightsView.tsx
- [X] T031 [P] Add max-width container (max-w-4xl mx-auto) for readability on ultra-wide monitors in src/components/insights/InsightsView.tsx
- [X] T032 [P] Add responsive padding (px-4 md:px-6 lg:px-8) to insights container in src/components/insights/InsightsView.tsx
- [X] T033 Verify empty state displays when no insights available in src/components/insights/InsightsView.tsx
- [X] T034 Verify empty state displays when filters result in zero visible insights in src/components/insights/InsightsView.tsx
- [X] T035 Performance validation - verify 200 insights render within 500ms and filter updates within 100ms
- [X] T036 Accessibility validation - verify keyboard navigation and screen reader compatibility
- [X] T037 Visual QA across viewport widths (1024px, 1440px, 1920px, 2560px)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if desired)
  - Or sequentially in priority order (P1 → P2 → P3 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅

**Independence**: All user stories are independently testable and can be implemented in any order after Phase 2

### Within Each User Story

**User Story 1 (Sequential)**:
- T006 → T007 → T008 → T009 → T010 (modify same file, must be sequential)

**User Story 2 (Mostly Parallel)**:
- T011, T012 can run in parallel (different severity levels)
- Then T013 → T014 → T015 → T016 → T017 (sequential within same file)

**User Story 3 (Mixed)**:
- T018, T019 can run in parallel (different files)
- Then T020 → T021 → T022 (sequential - same file, logical dependencies)
- Then T023, T024 can run in parallel (different files)

**User Story 4 (Sequential)**:
- T025 → T026 → T027 → T028 → T029 (modify same file, must be sequential)

**Polish Phase (Mostly Parallel)**:
- T030, T031, T032 can run in parallel if careful with same file
- T033, T034 sequential after layout changes
- T035, T036, T037 can run in parallel (different validation activities)

---

## Parallel Examples by User Story

### User Story 1 (Full-Page Scrolling)
```bash
# All tasks in this story modify the same file sequentially
# No parallel opportunities within US1
```

### User Story 2 (Enhanced Cards)
```bash
# Launch visual weight tasks together:
Task T011: "Add visual weight differentiation for critical severity"
Task T012: "Add shadow-md to high severity cards"
```

### User Story 3 (Grouping)
```bash
# Launch new components together:
Task T018: "Create SeveritySection component in src/components/insights/SeveritySection.tsx"
Task T019: "Add grouping toggle button in src/components/insights/InsightFilters.tsx"

# Later, launch wiring tasks together:
Task T023: "Implement severity section headers in src/components/insights/SeveritySection.tsx"
Task T024: "Wire grouping toggle in src/components/insights/InsightFilters.tsx"
```

### User Story 4 (Expandable Details)
```bash
# All tasks in this story modify the same file sequentially
# No parallel opportunities within US4
```

### Polish Phase
```bash
# Launch performance optimizations together:
Task T030: "Wrap filteredInsights in useMemo"
Task T031: "Add max-width container"
Task T032: "Add responsive padding"

# Launch validation tasks together:
Task T035: "Performance validation"
Task T036: "Accessibility validation"
Task T037: "Visual QA"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - RECOMMENDED

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005) ⚠️ BLOCKS all stories
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Test full-page scrolling independently
5. Deploy/demo if ready ✅ MVP delivered!

**Deliverable**: Insights page with fixed scrolling behavior - immediate UX improvement

### Incremental Delivery (All Stories)

1. Complete Setup + Foundational (T001-T005) → Foundation ready
2. Add User Story 1 (T006-T010) → Test independently → **Deploy MVP** 🎯
3. Add User Story 2 (T011-T017) → Test independently → **Deploy enhanced cards**
4. Add User Story 3 (T018-T024) → Test independently → **Deploy severity grouping**
5. Add User Story 4 (T025-T029) → Test independently → **Deploy smooth animations**
6. Complete Polish (T030-T037) → Final QA → **Deploy production-ready**

**Benefit**: Each story adds value without breaking previous stories

### Parallel Team Strategy (If Multiple Developers)

With multiple developers:

1. Team completes Setup + Foundational together (T001-T005)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T006-T010) - Scrolling fix
   - **Developer B**: User Story 2 (T011-T017) - Card design
   - **Developer C**: User Story 3 (T018-T024) - Grouping
   - **Developer D**: User Story 4 (T025-T029) - Animations
3. Stories integrate and merge independently
4. Team completes Polish together (T030-T037)

**Benefit**: Fastest time to completion with multiple contributors

---

## Task Breakdown Summary

**Total Tasks**: 37

**Task Count by User Story**:
- Setup (Phase 1): 3 tasks
- Foundational (Phase 2): 2 tasks
- User Story 1 (P1): 5 tasks
- User Story 2 (P2): 7 tasks
- User Story 3 (P3): 7 tasks
- User Story 4 (P3): 5 tasks
- Polish (Phase 7): 8 tasks

**Parallel Opportunities**:
- Setup: 2 parallel tasks (T002, T003)
- Foundational: 0 parallel (sequential state setup)
- User Story 1: 0 parallel (same file modifications)
- User Story 2: 2 parallel tasks (T011, T012)
- User Story 3: 4 parallel tasks (T018+T019, then T023+T024)
- User Story 4: 0 parallel (same file modifications)
- Polish: 6 parallel tasks (T030+T031+T032, then T035+T036+T037)

**Independent Test Criteria**:
- **US1**: Scroll entire Insights page without nested scrollbars ✅
- **US2**: View insight cards with clear severity, savings, and categories ✅
- **US3**: See insights grouped by severity with section headers ✅
- **US4**: Expand/collapse insights with smooth animations ✅

**Suggested MVP Scope**: User Story 1 only (5 tasks after foundational) - delivers immediate UX improvement

---

## Validation Checklist (From quickstart.md)

After implementation, verify:

- [ ] Full-page scroll works without nested scrollbars (US1)
- [ ] Insights group by severity with section headers (US3)
- [ ] Insights within severity sorted by savings descending (US3)
- [ ] Severity and category filters work correctly (existing)
- [ ] "Group by Severity" toggle switches views (US3)
- [ ] Severity colors, badges, savings display are clear (US2)
- [ ] Expand/collapse animation under 300ms (US4)
- [ ] Empty states display correctly (Polish)
- [ ] Layout works at 1024px, 1440px, 1920px, 2560px (Polish)
- [ ] 200 insights render and filter within 100ms (Polish)
- [ ] Keyboard navigation and screen readers work (Polish)

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability (US1, US2, US3, US4)
- **Format validated**: All tasks follow `- [ ] [TID] [P?] [StoryLabel?] Description with file path`
- **No tests included**: Tests not explicitly requested in feature specification
- **Each user story is independently testable**: Can implement and validate incrementally
- **File paths are exact**: Based on project structure in plan.md
- **Commit strategy**: Commit after each task or logical task group within a story
- **Stop at checkpoints**: Validate each story independently before proceeding to next priority
