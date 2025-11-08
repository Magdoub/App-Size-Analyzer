# Tasks: App Size Analysis Tool

**Input**: Design documents from `/specs/001-app-size-analyzer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec - focusing on implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- All tasks include exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize TypeScript project with Vite config in vite.config.ts
- [X] T002 Configure TypeScript strict mode in tsconfig.json targeting ES2020+
- [X] T003 [P] Install core dependencies: React 18, Zustand, TailwindCSS, Shadcn/UI
- [X] T004 [P] Install parsing libraries: fflate, @plist/plist, app-info-parser, kaitai-struct
- [X] T005 [P] Install visualization libraries: @nivo/treemap, @tanstack/react-table, @tanstack/react-virtual
- [X] T006 [P] Install worker communication: comlink
- [X] T007 [P] Configure Vitest and React Testing Library in vitest.config.ts
- [X] T008 [P] Setup TailwindCSS configuration in tailwind.config.js
- [X] T009 Create project structure: src/, src/components/, src/lib/, src/workers/, src/store/, src/types/
- [X] T010 [P] Setup ESLint and Prettier configurations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Define TypeScript types in src/types/analysis.ts for AnalysisContext, BreakdownNode, ContentType
- [X] T012 [P] Define iOS-specific types in src/types/ios.ts for Framework, Asset metadata
- [X] T013 [P] Define Android-specific types in src/types/android.ts for DEXMetadata, NativeLib
- [X] T014 [P] Define insight types in src/types/insights.ts for InsightRule, InsightResult, AffectedItem
- [X] T015 [P] Create Zustand store structure in src/store/analysis-store.ts with state management
- [X] T016 Implement ZIP extraction utilities in src/lib/parsers/common/zip-parser.ts using fflate
- [X] T017 [P] Implement file hashing utility in src/lib/parsers/common/file-hasher.ts using SHA-256
- [X] T018 [P] Implement content type detection in src/lib/parsers/common/types.ts based on file extensions
- [X] T019 [P] Create base Web Worker boilerplate with Comlink in src/workers/parser-worker.ts
- [X] T020 [P] Create error boundary component in src/components/shared/ErrorBoundary.tsx
- [X] T021 [P] Create loading spinner component in src/components/shared/LoadingSpinner.tsx
- [X] T022 Implement formatters in src/utils/formatters.ts for size display (MB, KB, percentage)
- [X] T023 [P] Implement calculations in src/utils/calculations.ts for compression ratios
- [X] T024 Create App.tsx root component with routing between views
- [X] T025 Create main.tsx entry point with React initialization

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Binary Upload and Size Breakdown (Priority: P1) 🎯 MVP

**Goal**: Enable developers to upload IPA/APK files and see detailed hierarchical breakdown of what's consuming space

**Independent Test**: Upload an IPA or APK file, verify that breakdown view displays hierarchical size information organized by modules, frameworks, assets, and localizations with exact sizes

### iOS Parsing for User Story 1

- [X] T026 [P] [US1] Implement binary plist parser in src/lib/parsers/ios/plist-parser.ts using @plist/plist
- [X] T027 [P] [US1] Implement Mach-O header parser in src/lib/parsers/ios/macho-parser.ts using Kaitai Struct
- [X] T028 [P] [US1] Implement asset catalog parser in src/lib/parsers/ios/asset-catalog-parser.ts for .car files
- [X] T029 [P] [US1] Create iOS types in src/lib/parsers/ios/types.ts for IPA-specific structures
- [X] T030 [US1] Integrate iOS parsers in src/lib/parsers/ios/ipa-parser.ts with Info.plist extraction and framework enumeration

### Android Parsing for User Story 1

- [X] T031 [P] [US1] Implement binary XML parser in src/lib/parsers/android/binary-xml-parser.ts using app-info-parser
- [X] T032 [P] [US1] Implement resources.arsc parser in src/lib/parsers/android/arsc-parser.ts for resource table
- [X] T033 [P] [US1] Implement DEX file parser in src/lib/parsers/android/dex-parser.ts using Kaitai Struct
- [X] T034 [P] [US1] Create Android types in src/lib/parsers/android/types.ts for APK-specific structures
- [X] T035 [US1] Integrate Android parsers in src/lib/parsers/android/apk-parser.ts with manifest and DEX handling

### Breakdown Generation for User Story 1

- [X] T036 [US1] Implement breakdown tree builder in src/lib/analysis/breakdown-generator.ts to convert flat file list to hierarchical BreakdownNode tree
- [X] T037 [US1] Implement size validation logic in src/lib/analysis/breakdown-generator.ts to ensure tree integrity (±1% tolerance)
- [X] T038 [US1] Implement tree flattening utility in src/lib/analysis/breakdown-generator.ts for table views

### UI Components for User Story 1

- [X] T039 [P] [US1] Create upload zone component in src/components/upload/UploadZone.tsx with drag-drop support
- [X] T040 [P] [US1] Create file validator component in src/components/upload/FileValidator.tsx for format validation
- [X] T041 [US1] Create breakdown view container in src/components/breakdown/BreakdownView.tsx
- [X] T042 [US1] Create breakdown table with virtual scrolling in src/components/breakdown/BreakdownTable.tsx using TanStack Table and Virtual
- [X] T043 [US1] Create breakdown tabs component in src/components/breakdown/BreakdownTabs.tsx for Modules/Frameworks, Assets, Localizations
- [X] T044 [US1] Integrate upload and breakdown views with Zustand store actions
- [X] T045 [US1] Add search and filter functionality to breakdown table with real-time updates
- [X] T046 [US1] Add sorting functionality (size, name, type) to breakdown table

**Checkpoint**: At this point, User Story 1 should be fully functional - upload binary, see complete breakdown

---

## Phase 4: User Story 2 - Visual Size Exploration (X-Ray Treemap) (Priority: P2)

**Goal**: Provide visual treemap that shows at a glance which components consume the most space for quick identification of optimization opportunities

**Independent Test**: Upload a binary, switch to X-Ray view, verify treemap accurately represents file sizes with color intensity and supports drill-down navigation

### Treemap Data Transformation for User Story 2

- [X] T047 [P] [US2] Implement treemap data generator in src/lib/visualization/treemap-generator.ts to transform BreakdownNode to Nivo format
- [X] T048 [P] [US2] Implement color scheme calculations in src/lib/visualization/color-scheme.ts for heatmap colors based on size

### UI Components for User Story 2

- [X] T049 [US2] Create X-Ray view container in src/components/xray/XRayView.tsx
- [X] T050 [US2] Create treemap component in src/components/xray/Treemap.tsx using ResponsiveTreeMapCanvas from @nivo/treemap
- [X] T051 [US2] Create category filter component in src/components/xray/CategoryFilter.tsx for Binaries, Localizations, Fonts, Videos
- [X] T052 [US2] Implement drill-down navigation in treemap component with zoom-in/zoom-out functionality
- [X] T053 [US2] Add hover tooltips showing name, size in MB, and percentage of total
- [X] T054 [US2] Add search functionality to highlight matching files in treemap
- [X] T055 [US2] Integrate X-Ray view with Zustand store for state management

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - breakdown tables and visual treemap

---

## Phase 5: User Story 3 - Automated Optimization Insights (Priority: P3)

**Goal**: Automatically identify common issues and suggest fixes so developers don't have to manually hunt for optimization opportunities

**Independent Test**: Upload a binary with common issues (duplicates, unoptimized images, debug symbols), verify Insights view displays specific recommendations with estimated savings

### Insight Engine for User Story 3

- [X] T056 [US3] Implement insight rule engine in src/lib/analysis/insight-engine.ts with rule execution framework
- [X] T057 [P] [US3] Implement duplicate detection rule R001 in src/lib/analysis/insight-rules.ts using file hashes
- [X] T058 [P] [US3] Implement unoptimized PNG images rule R002 in src/lib/analysis/insight-rules.ts detecting WebP candidates
- [X] T059 [P] [US3] Implement debug symbols rule R003 in src/lib/analysis/insight-rules.ts checking Mach-O headers
- [X] T060 [P] [US3] Implement iOS asset catalog rule R004 in src/lib/analysis/insight-rules.ts for @2x/@3x images outside catalogs
- [X] T061 [P] [US3] Implement unused Android resources rule R005 in src/lib/analysis/insight-rules.ts by scanning DEX references
- [X] T062 [P] [US3] Implement unused localization rule R006 in src/lib/analysis/insight-rules.ts detecting excessive string keys
- [X] T063 [US3] Register all rules in insight engine and implement on-demand execution with caching

### UI Components for User Story 3

- [X] T064 [US3] Create insights view container in src/components/insights/InsightsView.tsx
- [X] T065 [US3] Create insight card component in src/components/insights/InsightCard.tsx showing title, severity, affected items, savings
- [X] T066 [US3] Create insight filters component in src/components/insights/InsightFilters.tsx for severity and category filtering
- [X] T067 [US3] Implement expandable insight cards showing affected files with paths and fix suggestions
- [X] T068 [US3] Add total potential savings display across all insights in MB and percentage
- [X] T069 [US3] Integrate insights view with Zustand store for lazy computation

**Checkpoint**: All user stories 1, 2, and 3 should now be independently functional

---

## Phase 6: User Story 4 - Export and Share Analysis (Priority: P3)

**Goal**: Enable developers to export analysis results to share with colleagues or track changes over time for collaborative optimization decisions

**Independent Test**: Perform an analysis, verify breakdown data exports to CSV/JSON with accurate data matching the UI display

### Export Functionality for User Story 4

- [ ] T070 [P] [US4] Implement CSV export in src/utils/export.ts for breakdown data with columns: Path, Name, Size, Type, % of Total
- [ ] T071 [P] [US4] Implement JSON export in src/utils/export.ts for complete analysis context with all metadata
- [ ] T072 [P] [US4] Implement JSON export for insights in src/utils/export.ts with rules, affected items, savings
- [ ] T073 [P] [US4] Implement JSON export for treemap hierarchy in src/utils/export.ts with complete tree structure

### UI Components for User Story 4

- [ ] T074 [US4] Create export button component in src/components/shared/ExportButton.tsx with format selection
- [ ] T075 [US4] Add export buttons to breakdown view for CSV export
- [ ] T076 [US4] Add export buttons to insights view for JSON export
- [ ] T077 [US4] Add export buttons to X-Ray view for hierarchy JSON export
- [ ] T078 [US4] Add file download functionality with proper MIME types and filenames

**Checkpoint**: All user stories should now be independently functional with full export capabilities

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Bug Fixes (Unplanned)

- [X] BUG001 [US1] Implement XAPK parser in src/lib/parsers/android/xapk-parser.ts to handle multi-APK containers
- [X] BUG002 [US1] Add timeout protection (30s) to prevent app hanging on large files
- [X] BUG003 [US1] Add better error messages for corrupted/unsupported files

### Planned Polish Tasks

- [X] T079 [P] Add error handling for corrupted binaries with user-friendly messages
- [X] T080 [P] Add progress indicators during parsing with status updates
- [X] T081 [P] Add file size limit validation (2GB default) with warnings
- [ ] T082 [P] Implement cancel functionality for long-running parsing operations
- [ ] T083 [P] Add memory optimization: clear Blob references after parsing for garbage collection
- [ ] T084 [P] Add performance optimization: implement lazy parsing for current view only
- [ ] T085 [P] Add IndexedDB caching for recent analyses (opt-in)
- [ ] T086 [P] Add localStorage for user preferences (filters, sort order)
- [ ] T087 [P] Add responsive design optimizations for mobile/tablet views
- [ ] T088 [P] Create comprehensive README.md with project overview and setup instructions
- [ ] T089 [P] Add inline code documentation for complex parser logic
- [ ] T090 Validate quickstart.md by following all setup and development steps
- [ ] T091 Run production build and verify bundle size < 500KB (gzipped)
- [ ] T092 Test with sample binaries: small (50MB), medium (200MB), large (500MB)
- [ ] T093 Verify parsing performance: 100MB binary in <10 seconds on standard hardware
- [ ] T094 Verify size calculation accuracy: breakdown total matches file size within ±1%
- [ ] T095 Test browser compatibility: Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- [ ] T096 Create .gitignore with node_modules, dist, .env.local, coverage, fixtures
- [ ] T097 Create LICENSE file with appropriate open source license
- [ ] T098 Final code review and cleanup: remove console.logs, unused imports, commented code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses BreakdownNode from US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses AnalysisContext from US1 but independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Uses data from US1/US2/US3 but independently testable

### Within Each User Story

**User Story 1 (Binary Upload and Breakdown)**:
- Parsing tasks (T026-T035) can run in parallel [P] across iOS and Android
- Breakdown generation (T036-T038) depends on parsers
- UI components (T039-T046) depend on breakdown generator

**User Story 2 (X-Ray Treemap)**:
- Data transformation (T047-T048) can run in parallel [P]
- UI components (T049-T055) depend on treemap generator

**User Story 3 (Insights)**:
- Rule implementations (T057-T062) can run in parallel [P]
- Rule registration (T063) depends on all rules
- UI components (T064-T069) depend on insight engine

**User Story 4 (Export)**:
- Export utilities (T070-T073) can run in parallel [P]
- UI components (T074-T078) depend on export utilities

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T010)
- All Foundational type definitions marked [P] can run in parallel (T012-T014)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- iOS and Android parsing can run in parallel within US1
- All insight rules can be implemented in parallel within US3
- All export utilities can be implemented in parallel within US4
- All Polish tasks marked [P] can run in parallel (T079-T089)

---

## Parallel Example: User Story 1

```bash
# Launch all parser implementations together:
Task: "Implement binary plist parser in src/lib/parsers/ios/plist-parser.ts"
Task: "Implement Mach-O header parser in src/lib/parsers/ios/macho-parser.ts"
Task: "Implement asset catalog parser in src/lib/parsers/ios/asset-catalog-parser.ts"
Task: "Implement binary XML parser in src/lib/parsers/android/binary-xml-parser.ts"
Task: "Implement resources.arsc parser in src/lib/parsers/android/arsc-parser.ts"
Task: "Implement DEX file parser in src/lib/parsers/android/dex-parser.ts"

# Launch UI components together (after breakdown generator complete):
Task: "Create upload zone component in src/components/upload/UploadZone.tsx"
Task: "Create file validator component in src/components/upload/FileValidator.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - upload IPA/APK and verify breakdown
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: Basic breakdown!)
3. Add User Story 2 → Test independently → Deploy/Demo (Add visual treemap!)
4. Add User Story 3 → Test independently → Deploy/Demo (Add automated insights!)
5. Add User Story 4 → Test independently → Deploy/Demo (Add export capabilities!)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Binary Upload and Breakdown)
   - Developer B: User Story 2 (X-Ray Treemap)
   - Developer C: User Story 3 (Automated Insights)
   - Developer D: User Story 4 (Export)
3. Stories complete and integrate independently

---

## Summary Statistics

- **Total Tasks**: 98 tasks
- **Setup Phase**: 10 tasks
- **Foundational Phase**: 15 tasks
- **User Story 1 (P1)**: 21 tasks (MVP - most critical)
- **User Story 2 (P2)**: 9 tasks
- **User Story 3 (P3)**: 14 tasks
- **User Story 4 (P3)**: 9 tasks
- **Polish Phase**: 20 tasks

### Tasks per User Story

- **US1 (Binary Upload & Breakdown)**: 21 implementation tasks
- **US2 (X-Ray Treemap)**: 9 implementation tasks
- **US3 (Automated Insights)**: 14 implementation tasks
- **US4 (Export & Share)**: 9 implementation tasks

### Parallel Opportunities Identified

- **Setup phase**: 7 parallel tasks (T003-T010)
- **Foundational phase**: 9 parallel tasks (T012-T014, T016-T018, T020-T023)
- **User Story 1**: 12 parallel tasks (T026-T040)
- **User Story 2**: 2 parallel tasks (T047-T048)
- **User Story 3**: 7 parallel tasks (T057-T062)
- **User Story 4**: 4 parallel tasks (T070-T073)
- **Polish phase**: 11 parallel tasks (T079-T089)

### Independent Test Criteria

- **US1**: Upload IPA/APK → Verify hierarchical breakdown with exact sizes
- **US2**: Switch to X-Ray view → Verify treemap with proportional sizes and drill-down
- **US3**: Upload binary with issues → Verify insights with specific recommendations and savings
- **US4**: Perform analysis → Verify CSV/JSON exports match UI data

### Suggested MVP Scope

**Minimum Viable Product = User Story 1 only**
- Upload binary (IPA or APK)
- Parse and extract metadata
- Display hierarchical breakdown with sizes
- Search and filter functionality
- Sort by size/name/type

This delivers immediate value: developers can understand what's in their app and where the bytes are going.

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs are sequential (T001-T098)
✅ [P] markers only on parallelizable tasks (different files, no dependencies)
✅ [Story] labels (US1, US2, US3, US4) on all user story phase tasks
✅ File paths included in all implementation task descriptions
✅ Tasks organized by user story for independent implementation

---

## Notes

- All tasks include exact file paths for implementation
- [P] tasks work on different files with no dependencies
- [Story] labels enable tracking tasks to specific user stories
- Each user story independently completable and testable
- Setup and Foundational phases must complete before any user story work
- User stories can proceed in parallel after foundation is ready
- MVP = User Story 1 only (upload and breakdown)
- Each additional story adds value incrementally
- Export functionality (US4) works across all previous stories
- Polish phase addresses cross-cutting concerns and production readiness
