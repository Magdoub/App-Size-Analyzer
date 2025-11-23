# Implementation Plan: JSON Export for File Breakdown

**Branch**: `013-json-export` | **Date**: 2025-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-json-export/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add JSON export capability to the file breakdown view, allowing users to view, copy to clipboard, and download the complete file breakdown as formatted JSON. The feature provides three prioritized user stories: viewing JSON in-app (P1), copying to clipboard (P2), and downloading as a file (P3). All processing occurs client-side using browser APIs.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution)
**Primary Dependencies**: Vue 3.5.24, Pinia 2.3.1 (state management), native browser APIs (Clipboard API, File API)
**Storage**: N/A (100% client-side, in-memory state with Pinia - no persistence)
**Testing**: Vitest 2.1.9 + Vue Test Utils 2.4.6 for component tests, manual browser testing for clipboard/download APIs
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (Vue 3 SPA)
**Performance Goals**: JSON generation <2s for 5,000 files, copy/download operations non-blocking (<100ms UI response)
**Constraints**: Client-side only (no server processing), must handle large datasets (10,000+ files) without freezing UI
**Scale/Scope**: Single feature addition to existing breakdown view, 3 user stories (view, copy, download)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Client-Side Privacy
- ✅ **PASS** - All JSON generation and export operations occur client-side in browser
- ✅ **PASS** - No data transmission to servers (Clipboard API and File API are browser-native)
- ✅ **PASS** - Breakdown data never leaves user's machine

### Principle II: Performance-First Architecture
- ✅ **PASS** - JSON generation will use async operations to avoid blocking UI thread
- ✅ **PASS** - Large dataset handling (10,000+ files) planned with performance constraints
- ⚠️ **CONSIDERATION** - JSON serialization for very large datasets may need chunking or Web Worker
- **Decision**: Start with main thread JSON.stringify (fast enough for most cases), add Web Worker only if performance testing shows blocking >100ms

### Principle III: Library-First Design
- ✅ **PASS** - JSON export logic will be implemented as standalone library module in `src/lib/export/`
- ✅ **PASS** - Export generator accepts plain data (breakdown tree), returns formatted JSON string
- ✅ **PASS** - Vue components will use thin wrapper around export library via Pinia store action
- **Architecture**: `lib/export/json-generator.js` (pure function) → Pinia store action → Vue component

### Principle IV: Test-Driven Development (TDD)
- ✅ **PASS** - Unit tests for JSON generator library with real breakdown data fixtures
- ✅ **PASS** - Component tests for export button interactions using Vue Test Utils
- ⚠️ **LIMITATION** - Clipboard API and File download are browser-native, require manual testing
- **Testing approach**: Mock Clipboard/File APIs in component tests, manual cross-browser validation

### Principle V: Code Quality & Modern JavaScript
- ✅ **PASS** - JavaScript ES2020+ with JSDoc type annotations for export functions
- ✅ **PASS** - ESLint compliance with vue plugin
- ✅ **PASS** - Vue 3 Composition API for all new components

### Principle VI: Progressive Enhancement
- ✅ **PASS** - Feature detection for Clipboard API before attempting copy
- ✅ **PASS** - Fallback messaging if browser doesn't support clipboard access
- ✅ **PASS** - File download uses standard `<a download>` pattern (universal support)
- **Graceful degradation**: Display error message + suggest manual copy if Clipboard API unavailable

### Principle VII: Specification-First Workflow
- ✅ **PASS** - spec.md created and validated via requirements checklist
- ✅ **PASS** - User stories prioritized (P1, P2, P3) and independently testable
- ✅ **PASS** - Following SpecKit workflow: specify → plan → tasks → implement

### Summary
**Status**: ✅ **ALL GATES PASSED** - No constitution violations. Feature ready for Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/013-json-export/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── json-exporter.js # Export contract interface
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── export/
│       ├── json-generator.js     # NEW: Core JSON export logic (library-first)
│       └── json-generator.test.js # NEW: Unit tests for JSON generator
├── components/
│   └── breakdown/
│       ├── BreakdownView.vue      # MODIFY: Add export button
│       ├── JsonExportModal.vue    # NEW: Modal for viewing/copying JSON
│       └── JsonExportButton.vue   # NEW: Export button component
├── stores/
│   └── analysisStore.js           # MODIFY: Add export actions
└── __tests__/
    └── components/
        └── JsonExportModal.test.js # NEW: Component tests

public/
└── (no changes - 100% client-side feature)
```

**Structure Decision**: Single-page web application (Vue 3 SPA) - Option 1 structure. This feature integrates into the existing breakdown view by adding a JSON export library in `src/lib/export/` (following library-first principle) and UI components in `src/components/breakdown/`. The Pinia store acts as a thin adapter between the library and Vue components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**N/A** - No constitution violations. All principles passed validation.

---

## Phase 0: Research & Decisions (COMPLETE)

**Output**: [`research.md`](./research.md)

**Key Decisions**:
1. **JSON Generation**: Synchronous `JSON.stringify()` on main thread (fast enough for typical datasets)
2. **Clipboard API**: Modern Clipboard API with `execCommand` fallback for compatibility
3. **Syntax Highlighting**: Custom regex-based highlighter (minimal bundle size <1KB)
4. **File Naming**: `{appName}-breakdown-{YYYY-MM-DD-HHMMSS}.json` format
5. **JSON Structure**: Hybrid metadata object + flattened file array

All technical unknowns resolved. No NEEDS CLARIFICATION markers remaining.

---

## Phase 1: Design & Contracts (COMPLETE)

**Outputs**:
- [`data-model.md`](./data-model.md) - Entities: ExportMetadata, FileEntry, ExportResult, ClipboardResult
- [`contracts/json-exporter.js`](./contracts/json-exporter.js) - Library interface with JSDoc contracts
- [`quickstart.md`](./quickstart.md) - Developer integration guide and usage examples

**Architecture**:
```
Library Layer (src/lib/export/json-generator.js)
↓ exports pure functions
Pinia Store (analysisStore.js)
↓ provides data + actions
Vue Components (JsonExportButton, JsonExportModal)
↓ user interactions
Browser APIs (Clipboard, File Download)
```

**Key Entities**:
- **ExportResult**: Root export object (metadata + files[])
- **FileEntry**: Single file with path, size, compression, type, category
- **ClipboardResult**: Copy operation result (success, method, error)

---

## Phase 2: Constitution Re-Check (COMPLETE)

Re-evaluating constitution compliance after design phase:

### Principle I: Client-Side Privacy
✅ **CONFIRMED** - All JSON generation occurs in browser, no network requests

### Principle II: Performance-First Architecture
✅ **CONFIRMED** - JSON generation <100ms for 5,000 files (tested in research)
✅ **CONFIRMED** - Optional `requestIdleCallback` wrapper for large datasets

### Principle III: Library-First Design
✅ **CONFIRMED** - Contract defined in `contracts/json-exporter.js`
✅ **CONFIRMED** - Pure functions in `lib/export/json-generator.js` (no Vue/Pinia deps)

### Principle IV: Test-Driven Development
✅ **CONFIRMED** - Unit test structure defined in quickstart.md
✅ **CONFIRMED** - Component test examples provided

### Principle V: Code Quality & Modern JavaScript
✅ **CONFIRMED** - ES2020+ features used (optional chaining, nullish coalescing)
✅ **CONFIRMED** - JSDoc annotations in contract file

### Principle VI: Progressive Enhancement
✅ **CONFIRMED** - Clipboard API fallback strategy defined
✅ **CONFIRMED** - Feature detection for Clipboard API

### Principle VII: Specification-First Workflow
✅ **CONFIRMED** - Following SpecKit workflow: spec → plan → tasks → implement

**Final Status**: ✅ **ALL PRINCIPLES CONFIRMED** - Design maintains constitutional compliance.

---

## Implementation Readiness

**Prerequisites Complete**:
- [x] Specification approved (spec.md + requirements checklist)
- [x] Constitution check passed (all gates)
- [x] Research completed (all NEEDS CLARIFICATION resolved)
- [x] Data model defined (entities and relationships)
- [x] Contracts written (library interface with JSDoc)
- [x] Quickstart guide created (integration examples)
- [x] Agent context updated (CLAUDE.md)

**Next Steps**:
1. Run `/speckit.tasks` to generate task breakdown (tasks.md)
2. Review and approve task list
3. Run `/speckit.implement` to execute implementation

**Estimated Complexity**:
- **Library functions**: ~200 LOC (json-generator.js + tests)
- **Vue components**: ~150 LOC (JsonExportButton + JsonExportModal)
- **Pinia integration**: ~30 LOC (analysisStore actions)
- **Total**: ~380 LOC + tests

**Estimated Timeline**: 2-3 days for P1+P2 (view + copy), +1 day for P3 (download)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Clipboard API permission denied (Safari) | Medium | Low | Fallback to execCommand, clear error messages |
| Large JSON freezes UI (10,000+ files) | Low | Medium | requestIdleCallback wrapper, performance monitoring |
| Special characters break JSON | Low | Low | JSON.stringify handles escaping automatically |
| Download fails on mobile browsers | Low | Low | Test across devices, provide share sheet fallback |

**Overall Risk**: **LOW** - Well-understood browser APIs, no external dependencies, clear fallback strategies.

---

## Success Metrics

Post-implementation validation criteria:

1. **Functional**: All 3 user stories (P1, P2, P3) pass acceptance scenarios
2. **Performance**: JSON generation <2s for 5,000 files (as per success criteria SC-001)
3. **Compatibility**: Copy succeeds in 95%+ attempts across Chrome/Firefox/Safari/Edge (SC-002)
4. **Quality**: Generated JSON is valid and parseable (SC-003)
5. **Testing**: 80% code coverage for library functions, 70% for components (per constitution)

---

## Appendix: Technology Stack Summary

**Core Technologies**:
- JavaScript ES2020+ (no TypeScript per project constitution)
- Vue 3.5.24 (Composition API)
- Pinia 2.3.1 (state management)

**Browser APIs** (no external dependencies):
- Clipboard API (`navigator.clipboard.writeText`)
- File API (Blob, URL.createObjectURL, `<a download>`)

**Testing**:
- Vitest 2.1.9 (unit tests)
- Vue Test Utils 2.4.6 (component tests)

**Build Tools**:
- Vite 5.4.21 (bundler)
- ESLint + vue plugin (linting)

**Bundle Impact**: <2KB (no new dependencies, native browser APIs only)
