# Implementation Plan: Vue.js Migration

**Branch**: `006-vue-migration` | **Date**: 2025-11-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-vue-migration/spec.md`

**Note**: This is a complete framework migration from TypeScript + React to JavaScript + Vue.js 3.

## Summary

This plan details the migration of the entire App Size Analyzer from TypeScript + React to JavaScript + Vue.js 3. The user explicitly requested removal of TypeScript and adoption of Vue.js exclusively. This is a technical migration that preserves all functionality while replacing the framework foundation. The application will maintain 100% client-side processing, Web Worker-based parsing, and all existing features (file analysis, treemap visualization, insights generation) using Vue 3 Composition API, Pinia for state management, and Single File Components (.vue).

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Vue 3.5+ (no TypeScript per user requirement)
**Primary Dependencies**: Vue 3.5+, Pinia 2.3+ (state management), @nivo/treemap 0.99+, fflate 0.8+ (ZIP parsing), app-info-parser 1.1+ (binary metadata)
**Storage**: N/A (100% client-side, no persistence, in-memory state only)
**Testing**: Vitest 4.0+ with Vue Test Utils 2.4+, jsdom 27.1+ (component testing)
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (SPA)
**Performance Goals**: Parse 100MB binaries in <10s (Web Workers), maintain 60 FPS during UI interactions, render 10,000-node treemaps in <1s
**Constraints**: 100% client-side processing (no server), <500KB initial bundle (gzipped), <500MB heap for 200MB binaries, zero network requests during analysis
**Scale/Scope**: Single-user desktop application, ~20 Vue components, ~5 Web Workers, supports 4 binary formats (.ipa, .apk, .xapk, .aab)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Client-Side Privacy (NON-NEGOTIABLE)
**Status**: ✅ PASS
**Rationale**: Migration preserves 100% client-side processing. Vue components will communicate with existing Web Workers (IPA/APK parsers) using the same postMessage API. No server-side components or network requests are introduced. Vue's reactivity system is purely client-side.

### II. Performance-First Architecture (NON-NEGOTIABLE)
**Status**: ✅ PASS
**Rationale**: Existing Web Workers remain unchanged (parser logic is framework-agnostic). Vue 3 Composition API with Pinia will replace React + Zustand for state management, maintaining the same async patterns. Virtual scrolling will migrate from @tanstack/react-virtual to vue-virtual-scroller or @tanstack/virtual-core (framework-agnostic). Nivo treemap will be wrapped in Vue components using the same Canvas rendering.

### III. Library-First Design
**Status**: ⚠️ DEVIATION - JUSTIFIED
**Rationale**: Migration does not extract additional libraries but preserves existing separation. Core parsers (lib/parsers/) and analysis engine (lib/analysis/) remain independent JavaScript modules, callable from any framework. Vue components will be presentation layer only, delegating to these libraries. Deviation: No new library extraction during migration (deferred to maintain scope).

### IV. Test-Driven Development (TDD)
**Status**: ⚠️ DEVIATION - JUSTIFIED
**Rationale**: This is a migration, not net-new feature development. Existing unit tests for parsers/analysis will remain unchanged (library tests are framework-agnostic). Component tests will be rewritten from React Testing Library to Vue Test Utils, matching equivalent scenarios. TDD not applicable since we're translating existing, tested functionality. Deviation: Tests written after component migration to verify equivalence, not before.

### V. Type Safety & Strict Mode
**Status**: ❌ VIOLATION - USER REQUIREMENT OVERRIDE
**Rationale**: User explicitly requested "no TypeScript, only Vue.js". TypeScript strict mode cannot be enforced. Mitigation: Vue PropTypes for component prop validation (runtime checks), JSDoc comments for editor autocomplete, ESLint strict mode for JavaScript. This is a deliberate tradeoff accepting reduced compile-time safety per user mandate.

**Justification**: User requirement takes precedence. Type safety will be maintained through Vue PropTypes (runtime validation), comprehensive testing, and ESLint rules. The existing library code type interfaces will be documented via JSDoc.

### VI. Progressive Enhancement
**Status**: ✅ PASS
**Rationale**: Migration preserves existing progressive enhancement. Vue app will have `<noscript>` tag with error message (same as current React version). Web Worker feature detection remains unchanged. Build target stays ES2020 (no legacy transpilation). Browser compatibility requirements unchanged.

### VII. Specification-First Workflow
**Status**: ✅ PASS
**Rationale**: This migration follows SpecKit workflow: spec.md created, plan.md in progress, tasks.md will be generated next. User stories prioritized (P1: Core Analysis, P1: Privacy/Performance, P2: Interactive Features). Constitution check completed before research phase.

### Summary
- **2 Justified Deviations**: Library extraction deferred (scope control), TDD not applicable to migration
- **1 User-Mandated Override**: TypeScript strict mode removed per explicit user requirement
- **All non-negotiable privacy/performance principles maintained**
- **Proceed to Phase 0**: ✅ APPROVED with documented deviations

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/           # Vue SFCs organized by feature
│   ├── upload/          # UploadZone.vue, FileValidator.vue
│   ├── breakdown/       # BreakdownView.vue, BreakdownTable.vue, BreakdownTabs.vue
│   ├── xray/            # XRayView.vue, Treemap.vue, CategoryFilter.vue
│   ├── insights/        # InsightsView.vue, InsightCard.vue, InsightFilters.vue, SeveritySection.vue
│   └── shared/          # Breadcrumb.vue, ErrorBoundary.vue, LoadingSpinner.vue
├── stores/              # Pinia stores (replaces Zustand)
│   ├── appStore.js      # Main application state
│   ├── analysisStore.js # Parsed binary data
│   └── uiStore.js       # View state, filters, navigation
├── lib/                 # Framework-agnostic libraries (unchanged)
│   ├── parsers/         # IPA, APK, DEX parsers (keep as-is)
│   ├── analysis/        # Insight generation (keep as-is)
│   └── utils/           # Binary utilities (keep as-is)
├── workers/             # Web Workers (unchanged)
│   └── parser.worker.js # File parsing (convert from .ts to .js)
├── types/               # JSDoc type definitions (replace .ts with .js + JSDoc)
│   ├── ios.js
│   ├── android.js
│   └── analysis.js
├── utils/               # Vue-specific utilities
│   └── proptypes.js     # PropTypes validators
├── App.vue              # Root component (replaces App.tsx)
├── main.js              # Entry point (replaces main.tsx)
└── index.css            # Tailwind styles (unchanged)

tests/
├── unit/
│   ├── lib/             # Parser/analysis tests (minimal changes)
│   └── stores/          # Pinia store tests
└── components/          # Vue Test Utils tests
    ├── upload/
    ├── breakdown/
    ├── xray/
    ├── insights/
    └── shared/

public/                  # Static assets (unchanged)
sample-files/            # Test binaries (unchanged)
```

**Structure Decision**: Single-page web application (Option 1 adapted). The Vue migration maintains the same directory organization as the React version, with these changes:
- `.tsx` files → `.vue` Single File Components
- `store/` (Zustand) → `stores/` (Pinia)
- `types/*.ts` → `types/*.js` with JSDoc annotations
- `lib/` and `workers/` remain framework-agnostic (minimal changes)
- Test organization unchanged, only switching from React Testing Library to Vue Test Utils

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| TypeScript removal | User explicit requirement: "no TypeScript, only Vue.js" | User mandate - no alternative considered. Mitigation: Vue PropTypes + JSDoc + comprehensive tests |
| TDD deviation | Migrating existing tested functionality (not net-new features) | Writing tests before migration would duplicate existing React component tests that verify same behavior |
| Library extraction deferred | Maintain migration scope | Extracting additional libraries during migration would expand scope. Existing lib/ separation is sufficient |

---

## Post-Design Constitution Re-evaluation

*Re-evaluated after Phase 1 design completion (research.md, data-model.md, contracts/, quickstart.md)*

### I. Client-Side Privacy (NON-NEGOTIABLE)
**Status**: ✅ PASS - NO CHANGES
- Vue components communicate with existing Web Workers via Comlink (postMessage)
- No network requests introduced
- Pinia stores are in-memory only (no localStorage/IndexedDB)
- All design decisions preserve 100% client-side processing

### II. Performance-First Architecture (NON-NEGOTIABLE)
**Status**: ✅ PASS - NO CHANGES
- Web Workers remain unchanged (framework-agnostic JavaScript)
- Virtual scrolling migrated to @tanstack/virtual-core (same performance)
- Nivo treemap wrapped in Vue component (Canvas renderer preserved)
- Bundle size reduced by ~44KB (Vue 135KB vs React 179KB)

### III. Library-First Design
**Status**: ✅ PASS - IMPROVED
- Design confirms `lib/` parsers and analysis remain pure JavaScript
- Vue components are thin presentation layer over library functions
- Contracts define clear boundaries between UI and business logic
- No additional library coupling introduced

### IV. Test-Driven Development (TDD)
**Status**: ⚠️ DEVIATION REMAINS - JUSTIFIED
- Test migration pattern defined: React Testing Library → Vue Test Utils
- Library tests (parsers, analysis) remain unchanged (framework-agnostic)
- Component tests written after migration to verify equivalence (not TDD)
- Justification: Migration preserves tested functionality, TDD not applicable

### V. Type Safety & Strict Mode
**Status**: ❌ VIOLATION REMAINS - USER REQUIREMENT OVERRIDE
- PropTypes contracts defined for all 20 components (runtime validation)
- JSDoc annotations added for `lib/` functions and worker APIs
- ESLint configured for JavaScript strict mode
- Mitigation: Runtime validation + comprehensive tests replace compile-time checks

### VI. Progressive Enhancement
**Status**: ✅ PASS - NO CHANGES
- `<noscript>` tag in index.html (unchanged)
- Web Worker feature detection (unchanged)
- Build target ES2020 (unchanged)
- Browser compatibility requirements unchanged

### VII. Specification-First Workflow
**Status**: ✅ PASS - FOLLOWED
- spec.md, research.md, data-model.md, contracts/, quickstart.md all generated
- Constitution check performed before and after design
- Tasks.md will be generated next via `/speckit.tasks`
- Workflow followed per requirements

### Final Evaluation
- **All non-negotiable principles maintained**: Privacy and Performance preserved
- **2 Justified Deviations**: Library extraction deferred, TDD not applicable
- **1 User-Mandated Override**: TypeScript removal (mitigated with PropTypes + JSDoc)
- **Verdict**: ✅ APPROVED for Phase 2 (Task Breakdown)

---

## Phase Completion Summary

**Phase 0 (Research)**: ✅ COMPLETE
- `research.md` generated with 10 technical decisions
- All NEEDS CLARIFICATION items resolved
- Alternatives evaluated for state management, virtual scrolling, treemap, workers, error boundaries, type safety, testing, build config, routing, dependencies

**Phase 1 (Design)**: ✅ COMPLETE
- `data-model.md` generated with Pinia store architecture
- `contracts/component-props.md` generated with 20 component prop interfaces
- `contracts/worker-api.md` generated with Web Worker API specification
- `quickstart.md` generated with integration patterns and migration checklist
- Agent context updated in `CLAUDE.md`

**Constitution Check**: ✅ PASSED (pre-design and post-design)

**Ready for**: Phase 2 - Task Breakdown (`/speckit.tasks` command)
