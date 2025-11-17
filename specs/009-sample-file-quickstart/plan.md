# Implementation Plan: Sample File Quickstart

**Branch**: `009-sample-file-quickstart` | **Date**: 2025-11-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-sample-file-quickstart/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add one-click sample file functionality to the homepage, enabling first-time visitors to immediately try the app without uploading their own binaries. Sample files (.ipa and .apk) are dynamically discovered from the `sample-files/` directory, displayed as clickable cards with metadata (name, platform, size), and loaded identically to user-uploaded files. This reduces time-to-value from minutes to seconds and increases user engagement by eliminating upload friction for new visitors.

**Technical Approach**: Leverage Vite's `import.meta.glob` to discover sample files at build time, generate file metadata cards in a new `SampleFileGallery.vue` component, and reuse the existing `handleFileSelect` workflow from `App.vue` to process sample files identically to uploads. Cancel in-progress sample loads if user uploads a file manually (AbortController pattern).

## Technical Context

**Language/Version**: JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution)
**Primary Dependencies**: Vue 3.5.24, Pinia 2.3.1, Vite 5.4.21
**Storage**: N/A (100% client-side, in-memory state with Pinia - no persistence)
**Testing**: Vitest 2.1.9 + Vue Test Utils 2.4.6
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (SPA) - client-side binary analysis
**Performance Goals**: Sample file cards render in <100ms; sample file loading starts within 500ms of click
**Constraints**: No server-side file listing (static build); files must be bundled or statically discoverable via Vite patterns
**Scale/Scope**: 3-5 sample files currently (A Night Battle HD 1.2.ipa, Tools-for-Procreate.ipa, com.grasshopper.dialer.apk); unlimited display capacity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Client-Side Privacy ✅ PASS
- **Requirement**: All file processing occurs client-side; no data transmitted to servers
- **Compliance**: Sample files are fetched from the `/sample-files/` directory (static assets bundled with the app). Once loaded, they are processed identically to user-uploaded files using existing client-side parsers (Web Workers). No network requests occur after initial page load except for fetching sample file binaries (same domain, static assets).
- **Evidence**: Reuses existing `handleFileSelect` → `analyzeFile` → `useParserWorker` pipeline from App.vue:205-336. No new network calls introduced beyond static asset loading.

### Principle II: Performance-First Architecture ✅ PASS
- **Requirement**: CPU-intensive operations run in Web Workers; UI remains responsive
- **Compliance**: Sample file loading triggers existing Web Worker-based parsing (`useParserWorker` composable). New component (`SampleFileGallery`) only adds lightweight UI (card rendering) with no blocking operations. Sample file fetch uses native `fetch()` API (non-blocking).
- **Evidence**: No new parser logic introduced. Existing Web Worker architecture handles all parsing (src/composables/useParserWorker.js, src/workers/parser-worker.js).

### Principle III: Library-First Design ✅ PASS
- **Requirement**: Core functionality architected as standalone libraries with well-defined contracts
- **Compliance**: No new library logic required. Feature is purely UI-layer enhancement (component + state management). Reuses existing parser libraries and analysis engine. New file discovery logic (Vite glob) is build-time utility, not runtime library.
- **Evidence**: `SampleFileGallery.vue` is a presentation component with no business logic. File loading logic remains in App.vue, calling existing library functions.

### Principle IV: Test-Driven Development (TDD) ✅ PASS
- **Requirement**: Unit tests with real fixtures before implementation
- **Compliance**: Will write Vitest unit tests for `SampleFileGallery.vue` component (rendering, click handling, disabled states) before implementation. Integration test will verify sample file click → analysis workflow using existing fixtures from `tests/fixtures/`.
- **Evidence**: Test files to be created: `src/components/upload/SampleFileGallery.test.js` (TDD workflow in tasks.md Phase 1). Real sample files already exist in `/sample-files/` directory.

### Principle V: Code Quality & Modern JavaScript ✅ PASS
- **Requirement**: ES2020+ features, JSDoc annotations for complex functions
- **Compliance**: Component uses Composition API (`<script setup>`, `ref`, `computed`). File discovery utility uses ES2020 features (async/await, optional chaining). JSDoc comments for sample file metadata extraction function.
- **Evidence**: Existing codebase uses Composition API (App.vue:166-356, UploadZone.vue:120-218). Will follow same patterns.

### Principle VI: Progressive Enhancement ✅ PASS
- **Requirement**: Core features work in modern browsers without polyfills; graceful degradation for missing features
- **Compliance**: Feature uses native fetch(), File API (already required for existing upload). Vite's `import.meta.glob` compiles to static imports (no runtime feature detection needed). Falls back to upload-only mode if sample file directory empty (edge case handled in spec).
- **Evidence**: No new browser APIs introduced. Feature enhances existing upload flow without replacing it.

### Principle VII: Specification-First Workflow ✅ PASS
- **Requirement**: Spec → clarification → planning → tasks → implementation workflow
- **Compliance**: Following SpecKit workflow: spec.md created (/speckit.specify), clarifications resolved (/speckit.clarify), now generating plan.md (/speckit.plan). Tasks.md will be created next (/speckit.tasks).
- **Evidence**: This plan.md document + spec.md + clarifications session completed 2025-11-17.

**Constitution Compliance**: ✅ ALL PRINCIPLES SATISFIED - No violations or exceptions required.

## Project Structure

### Documentation (this feature)

```text
specs/009-sample-file-quickstart/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (current)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (minimal - mostly UI)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── upload/
│   │   ├── UploadZone.vue           # Existing: drag-and-drop upload
│   │   ├── FileValidator.vue        # Existing: validation error display
│   │   └── SampleFileGallery.vue    # NEW: sample file cards grid
│   ├── shared/
│   │   ├── LoadingSpinner.vue       # Existing: reused for sample file loading
│   │   └── ErrorBoundary.vue        # Existing: error handling
│   └── [other views...]
├── composables/
│   ├── useParserWorker.js           # Existing: Web Worker composable
│   └── useSampleFiles.js            # NEW: sample file discovery & metadata
├── utils/
│   ├── formatters.js                # Existing: file size formatting
│   └── file-discovery.js            # NEW: Vite glob wrapper for sample files
├── App.vue                          # MODIFIED: integrate SampleFileGallery
└── main.js                          # Existing: Vue app initialization

tests/
├── unit/
│   └── components/
│       └── upload/
│           └── SampleFileGallery.test.js  # NEW: component unit tests
└── integration/
    └── sample-file-workflow.test.js       # NEW: end-to-end test

sample-files/                                # Existing directory
├── A Night Battle HD 1.2.ipa               # 5.1MB iOS app
├── Tools-for-Procreate-IPAOMTK.COM.ipa     # 47MB iOS app
├── com.grasshopper.dialer_[...].apk        # 79MB Android app
└── README.md                                # Documentation
```

**Structure Decision**: Single-page Vue application with component-based architecture. New feature adds one new component (`SampleFileGallery.vue`), one new composable (`useSampleFiles.js`), and minimal utility code (`file-discovery.js`). Integrates into existing `App.vue` upload view without modifying existing upload components (UploadZone, FileValidator). This maintains separation of concerns and allows feature to be toggled or removed independently.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*N/A - No constitution violations. All principles satisfied without exceptions.*

