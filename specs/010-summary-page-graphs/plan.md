# Implementation Plan: Summary Page with Size Distribution Graphs

**Branch**: `010-summary-page-graphs` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-summary-page-graphs/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a new Summary view with distribution graphs showing app size breakdown by file type, component type, and additional analytics. Uses ECharts bar/horizontal bar charts to visualize aggregated data from the existing AnalysisContext breakdown tree. All visualization occurs client-side with no server communication, leveraging existing calculation utilities and color schemes.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution)
**Primary Dependencies**: Vue 3.5.24, Pinia 2.3.1, ECharts 5.5.0, vue-echarts 7.0.3
**Storage**: N/A (100% client-side, in-memory state with Pinia - no persistence)
**Testing**: Vitest 2.1.8 + Vue Test Utils (component tests for chart rendering)
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (client-side only)
**Performance Goals**:
  - Chart rendering: <1 second for aggregated data (max ~20 categories)
  - Data aggregation: <500ms for 10,000+ file tree nodes
  - UI remains responsive at 60 FPS during chart interactions
**Constraints**:
  - All processing client-side (Constitution Principle I)
  - Data aggregation must use existing breakdown tree without modification
  - Charts use existing color scheme for consistency
  - Component must work with both iOS (compressed + uncompressed) and Android (uncompressed only) data
**Scale/Scope**:
  - Single new view component (SummaryView.vue)
  - 6-8 chart subcomponents (FileTypeSize, FileTypeCount, ComponentSize, etc.)
  - ~10 new aggregation utility functions
  - Handles apps with 10,000+ files, 500MB+ binaries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Client-Side Privacy ✅ PASS

- **Requirement**: All processing must occur client-side, no server communication
- **Compliance**: Summary page aggregates data from existing in-memory AnalysisContext. No data leaves browser. Charts render client-side using ECharts canvas renderer.
- **Evidence**: No API endpoints, no network requests, all computation in Vue components

### Principle II: Performance-First Architecture ✅ PASS

- **Requirement**: CPU-intensive operations in Web Workers, UI remains responsive
- **Compliance**: Data aggregation is lightweight (<500ms for 10k nodes). ECharts uses canvas rendering for performant chart drawing. No blocking operations during chart generation.
- **Evidence**:
  - Aggregation functions iterate breakdown tree once per chart type
  - ECharts canvas renderer (non-blocking)
  - No need for Web Workers (aggregation is fast, not parsing-level intensive)

### Principle III: Library-First Design ✅ PASS

- **Requirement**: Core functionality as standalone libraries with contracts
- **Compliance**: New aggregation functions will be added to existing `src/utils/calculations.js` library module. Chart data formatters will be pure functions with no Vue dependencies. Summary view components consume these libraries.
- **Evidence**:
  - New functions: `aggregateFilesByType()`, `aggregateByComponent()`, etc. in calculations.js
  - Pure data transformation → ECharts option objects
  - Pinia store acts as thin adapter (fetch data → call library → pass to components)

### Principle IV: Test-Driven Development (TDD) ✅ PASS

- **Requirement**: Unit tests before implementation, real fixtures
- **Compliance**: Will write Vitest tests for aggregation functions using existing binary analysis fixtures (stored in analysisStore during tests). Vue Test Utils for chart component rendering tests.
- **Evidence**:
  - Test files: `src/utils/calculations.test.js` (aggregation logic)
  - Test files: `src/components/summary/SummaryView.test.js` (component rendering)
  - Fixtures: Existing IPA/APK analysis results in test data

### Principle V: Code Quality & Modern JavaScript ✅ PASS

- **Requirement**: ES2020+, JSDoc annotations, ESLint compliance
- **Compliance**: All new functions will use ES2020+ features (optional chaining, nullish coalescing). JSDoc annotations for aggregation functions. Vue 3 Composition API with `<script setup>`.
- **Evidence**:
  - Target: ES2020 (already configured in Vite)
  - JSDoc example: `@param {BreakdownNode} root @returns {{category: string, size: number, count: number}[]}`
  - Vue Composition API for all new components

### Principle VI: Progressive Enhancement ✅ PASS

- **Requirement**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), feature detection
- **Compliance**: ECharts 5.5 and Vue 3.5 target modern browsers. No additional polyfills needed. Feature detection already exists for Web Workers (not needed for this feature).
- **Evidence**: No browser API changes, builds on existing Vite/Vue configuration

### Principle VII: Specification-First Workflow ✅ PASS

- **Requirement**: spec.md → clarification → plan.md → tasks.md → implementation
- **Compliance**: Currently executing `/speckit.plan` after spec.md approval. Tasks will be generated via `/speckit.tasks`. Implementation via `/speckit.implement`.
- **Evidence**: This plan.md file, prior spec.md with prioritized user stories

---

**GATE STATUS**: ✅ **PASS** - All seven constitution principles satisfied. No violations to justify. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/010-summary-page-graphs/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── aggregation.js   # Aggregation function contracts
│   └── chart-data.js    # Chart data structure contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── summary/
│   │   ├── SummaryView.vue                   # Main summary page container (NEW)
│   │   ├── FileTypeDistributionChart.vue     # File type size chart (NEW)
│   │   ├── FileCountDistributionChart.vue    # File type count chart (NEW)
│   │   ├── ComponentDistributionChart.vue    # Component type chart (NEW)
│   │   ├── CompressionEfficiencyChart.vue    # Compression chart (NEW)
│   │   ├── TopFilesChart.vue                 # Top 10 files chart (NEW)
│   │   ├── LocalizationImpactChart.vue       # Localization chart (NEW)
│   │   ├── ArchitectureBreakdownChart.vue    # Architecture chart (NEW)
│   │   └── AssetTypeDistributionChart.vue    # Asset breakdown chart (NEW)
│   ├── xray/
│   │   └── Treemap.vue                       # Existing treemap component (reference)
│   ├── breakdown/
│   └── insights/
├── utils/
│   ├── calculations.js                       # Existing + new aggregation functions (EXTEND)
│   ├── formatters.js                         # Existing formatters (reuse)
│   └── chart-options.js                      # ECharts option builders (NEW)
├── lib/
│   └── visualization/
│       ├── color-scheme.js                   # Existing color utilities (reuse)
│       └── treemap-generator.js              # Existing (reference only)
├── stores/
│   ├── analysisStore.js                      # Existing (read data from here)
│   └── uiStore.js                            # Existing (add 'summary' view state)
├── types/
│   └── analysis.js                           # Existing types (reference)
└── App.vue                                    # Main app - add "Summary" tab (MODIFY)

tests/
└── unit/
    ├── calculations.test.js                  # Tests for new aggregation functions (NEW)
    └── components/
        └── summary/
            └── SummaryView.test.js           # Tests for summary components (NEW)
```

**Structure Decision**: Single-page web application (client-side only). New feature adds:
1. New `components/summary/` directory with main view and 8 chart subcomponents
2. Extensions to `utils/calculations.js` for aggregation logic
3. New `utils/chart-options.js` for ECharts configuration builders
4. Modification to `App.vue` to add "Summary" navigation tab
5. Extension to `uiStore.js` to track summary view state (filters, collapsed sections)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. This section is not applicable.

---

## Phase 0: Research Completed ✅

**Output**: `research.md` generated with all technical unknowns resolved.

### Key Decisions:
1. **Chart Library**: Use existing ECharts 5.5.0 with vue-echarts 7.0.3 wrapper
2. **Aggregation Strategy**: On-demand computation via Vue computed properties
3. **File Type Mapping**: 15 ContentTypes → 7-8 user-friendly display categories
4. **Color Consistency**: Reuse existing TYPE_COLORS from color-scheme.js
5. **Platform Handling**: Conditional rendering via platform computed properties
6. **Chart Configuration**: Reusable option builders in chart-options.js
7. **Edge Cases**: Defensive checks and graceful fallbacks in aggregation functions

---

## Phase 1: Design Completed ✅

**Outputs**:
- `data-model.md` - Entity definitions and data flow
- `contracts/aggregation.js` - Aggregation function contracts
- `contracts/chart-data.js` - Chart data transformation contracts
- `quickstart.md` - Integration scenarios and examples

### Key Design Artifacts:

**Entities**:
- 7 derived entity types (CategoryAggregation, ComponentAggregation, FileEntry, CompressionAnalysis, LocalizationEntry, ArchitectureEntry, AssetTypeAggregation)
- All computed on-demand from existing AnalysisContext breakdown tree
- No persistent storage required

**Contracts**:
- 7 aggregation functions in `calculations.js`
- 15 chart data transformation/builder functions in `chart-options.js`
- All pure functions with JSDoc type annotations

**Architecture**:
- Single main view component (SummaryView.vue)
- 8 chart subcomponents (one per chart type)
- Data flow: AnalysisContext → Aggregation → Chart Data → ECharts

---

## Post-Design Constitution Re-Check ✅

All seven constitution principles remain satisfied after Phase 1 design:

### ✅ Principle I: Client-Side Privacy
- Confirmed: All aggregations occur client-side in Vue computed properties
- Confirmed: ECharts renders client-side using canvas renderer
- Confirmed: No network requests for data processing

### ✅ Principle II: Performance-First Architecture
- Confirmed: Aggregation functions are O(n) with n = file count, <500ms for 10k nodes
- Confirmed: ECharts canvas rendering is non-blocking (60 FPS)
- Confirmed: No Web Workers needed (aggregation is lightweight, not parser-level intensive)

### ✅ Principle III: Library-First Design
- Confirmed: 7 aggregation functions in `calculations.js` (pure, no Vue dependencies)
- Confirmed: 15 chart option builders in `chart-options.js` (pure, no Vue dependencies)
- Confirmed: Contracts defined in `contracts/` directory with JSDoc annotations
- Confirmed: Vue components are thin wrappers around library functions

### ✅ Principle IV: Test-Driven Development (TDD)
- Confirmed: Unit tests planned for all aggregation functions (calculations.test.js)
- Confirmed: Component tests planned for chart rendering (SummaryView.test.js)
- Confirmed: Test fixtures will use existing binary analysis results

### ✅ Principle V: Code Quality & Modern JavaScript
- Confirmed: All code will use ES2020+ features (optional chaining, nullish coalescing)
- Confirmed: JSDoc annotations for all aggregation and builder functions
- Confirmed: Vue 3 Composition API with `<script setup>` for all components

### ✅ Principle VI: Progressive Enhancement
- Confirmed: No new browser APIs required beyond existing ECharts/Vue dependencies
- Confirmed: Targets modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### ✅ Principle VII: Specification-First Workflow
- Confirmed: Following SpecKit workflow (spec.md → plan.md → tasks.md → implementation)
- Confirmed: This plan.md document with complete design artifacts

**Final Gate Status**: ✅ **PASS** - All principles satisfied post-design. Ready for `/speckit.tasks`.

---

## Next Steps

1. **Run `/speckit.tasks`** to generate task breakdown (tasks.md)
2. **Run `/speckit.implement`** to execute implementation
3. **Test manually** with iOS and Android binaries
4. **Commit** to branch `010-summary-page-graphs`

---

## Summary

**Branch**: `010-summary-page-graphs`
**Plan Status**: ✅ Complete (Phase 0 + Phase 1)
**Constitution Status**: ✅ All principles satisfied
**Generated Artifacts**:
- plan.md (this file)
- research.md (technical decisions)
- data-model.md (entity definitions)
- contracts/aggregation.js (function contracts)
- contracts/chart-data.js (chart transformation contracts)
- quickstart.md (integration guide)

**Implementation Scope**:
- 1 main view component (SummaryView.vue)
- 8 chart subcomponents
- ~10 aggregation functions in calculations.js
- ~15 chart option builders in chart-options.js
- Navigation tab in App.vue
- Test files for aggregation and components

**Estimated Complexity**: Medium (well-defined architecture, proven patterns, reusable libraries)

Ready to proceed to task breakdown phase.
