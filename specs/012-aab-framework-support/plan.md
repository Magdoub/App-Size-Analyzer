# Implementation Plan: AAB and Framework File Support

**Branch**: `012-aab-framework-support` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-aab-framework-support/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add support for analyzing Android App Bundle (.aab) and iOS Framework Bundle (.framework) files. This extends the existing parser architecture with two new parsers that follow established patterns: AAB parser extends the APK parser approach (both ZIP-based), while Framework parser parallels the IPA parser structure. Both parsers will run in Web Workers and integrate with the existing Pinia store and visualization components.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution)
**Primary Dependencies**: Vue 3.5.24, Pinia 2.3.1, fflate 0.8.2 (ZIP parsing), app-info-parser 1.1.6 (metadata extraction), ECharts 5.5.0 (visualization)
**Storage**: N/A (100% client-side, in-memory state with Pinia - no persistence)
**Testing**: Vitest + Vue Test Utils
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single web application (client-side only)
**Performance Goals**: Parse time <5 seconds for 200MB AAB files, <5 seconds for 100MB frameworks; 60 FPS UI responsiveness during parsing
**Constraints**: <500MB heap for 200MB files (2.5x file size), all parsing in Web Workers, no server communication
**Scale/Scope**: Support files up to 500MB, handle 10,000+ file entries in treemap visualization

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Client-Side Privacy | ✅ PASS | All parsing occurs in browser Web Workers. No server uploads or external API calls. Binary files never leave user's machine. |
| II. Performance-First | ✅ PASS | AAB and Framework parsers will run in existing Web Worker infrastructure. Streaming ZIP extraction via fflate. Virtual scrolling for large file lists already in place. |
| III. Library-First Design | ✅ PASS | New parsers will be standalone modules in `src/lib/parsers/` with JSDoc contracts. Pinia store acts as thin adapter. No Vue dependencies in parser logic. |
| IV. TDD | ✅ PASS | Unit tests with real binary fixtures required before parser implementation. Test files in `src/__tests__/` following existing patterns. |
| V. Code Quality & Modern JS | ✅ PASS | ES2020+ features, JSDoc annotations for all public APIs, ESLint with vue plugin. |
| VI. Progressive Enhancement | ✅ PASS | Feature detection for Web Workers and File API already implemented. Modern browser targets (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). |
| VII. Specification-First | ✅ PASS | This plan follows SpecKit workflow: spec.md → plan.md → tasks.md → implementation. |

**Gate Status**: ✅ ALL PRINCIPLES SATISFIED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/012-aab-framework-support/
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
├── lib/
│   └── parsers/
│       ├── android/
│       │   ├── aab-parser.js          # NEW: AAB parser (extends APK patterns)
│       │   ├── apk-parser.js          # Existing: reference for AAB
│       │   └── types.js               # Update: add AAB result types
│       ├── ios/
│       │   ├── framework-parser.js    # NEW: Framework parser
│       │   ├── ipa-parser.js          # Existing: reference for Framework
│       │   └── types.js               # Update: add Framework result types
│       └── common/
│           ├── zip-parser.js          # Reuse: ZIP extraction
│           └── types.js               # Update: add content types
├── workers/
│   └── parser-worker.js               # Update: route AAB/Framework to parsers
├── composables/
│   └── useParserWorker.js             # Update: file type detection (if needed)
├── stores/
│   └── analysisStore.js               # Update: handle new format metadata
├── components/
│   └── upload/
│       └── UploadZone.vue             # Update: accept .framework ZIP uploads
└── __tests__/
    └── parsers/
        ├── aab-parser.test.js         # NEW: AAB parser tests
        └── framework-parser.test.js   # NEW: Framework parser tests

tests/
└── fixtures/
    ├── sample.aab                     # NEW: Test AAB file
    └── Sample.framework.zip           # NEW: Test framework bundle
```

**Structure Decision**: Single client-side web application. New parsers follow existing patterns in `src/lib/parsers/` with platform-specific subdirectories (android/, ios/). Tests use Vitest in `src/__tests__/` with real binary fixtures.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All principles satisfied.
