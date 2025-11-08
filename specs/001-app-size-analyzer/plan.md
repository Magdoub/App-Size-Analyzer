# Implementation Plan: App Size Analysis Tool

**Branch**: `001-app-size-analyzer` | **Date**: 2025-11-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-app-size-analyzer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A client-side web application that analyzes iOS (IPA/XCArchive) and Android (APK/AAB) binaries to visualize app size composition, identify optimization opportunities, and provide actionable insights. The tool parses binary structures client-side using Web Workers, extracts asset metadata, and presents hierarchical breakdowns via table views and interactive treemap visualizations. A rule-based insights engine detects common optimization issues (duplicates, unoptimized assets, debug symbols) and provides specific recommendations with estimated byte savings.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), targeting ES2020+
**Primary Dependencies**:
- React 18+ (UI framework)
- Vite 5+ (build tool and dev server)
- JSZip (ZIP archive parsing)
- Recharts or Nivo (treemap visualization)
- TanStack Table v8 (virtual scrolling tables)
- Zustand (state management)
- TailwindCSS 3+ with Shadcn/UI (styling and components)

**Storage**:
- In-memory only during session (privacy-first, no persistence)
- Optional: IndexedDB for caching recent analyses (user opt-in)
- LocalStorage for user preferences only

**Testing**:
- Vitest (unit tests for parsers and analysis logic)
- React Testing Library (component tests)
- Playwright (E2E tests for upload → analysis → export flows)

**Target Platform**: Modern web browsers (Chrome 100+, Firefox 100+, Safari 15+, Edge 100+) with Web Workers and File API support

**Project Type**: Single-page web application (frontend only, no backend)

**Performance Goals**:
- Parse 100MB binary in <10 seconds (using Web Workers)
- UI remains interactive during parsing (no main thread blocking)
- Treemap rendering <1 second for 10,000 nodes
- Virtual scrolling handles 100,000+ table rows smoothly

**Constraints**:
- Must run entirely client-side (no server uploads - privacy requirement)
- File size limit: 2GB (configurable)
- Binary parsing accuracy: ±1% of actual file size
- Memory: Must handle large files without browser OOM
- Offline-capable after initial page load (PWA optional for Phase 2+)

**Scale/Scope**:
- Parse binaries with 10,000+ files
- Support iOS (IPA, xcarchive, dSYM) and Android (APK, AAB, APKS) formats
- 6+ rule-based insights across 6 categories
- Export to CSV/JSON formats

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No constitution file exists yet. This project will establish initial architectural principles.

**Proposed Principles for Constitution** (to be ratified):

1. **Client-Side Privacy**: All binary parsing must occur client-side. No data uploads to servers.
2. **Library-First Architecture**: Core parsers (iOS, Android) and analysis engine should be extractable as standalone libraries.
3. **Performance-First**: All parsing operations must use Web Workers to avoid UI blocking.
4. **Test-Driven Binary Parsing**: All binary format parsers must have unit tests with real binary fixtures.
5. **Format Compatibility**: Must gracefully handle malformed or non-standard binaries with fallback behavior.

**Gates**: N/A (no existing constitution)

---

### Post-Design Re-Evaluation *(Phase 1 Complete)*

**Date**: 2025-11-07
**Status**: ✅ All proposed principles adhered to in technical design

**Compliance Review**:

1. **Client-Side Privacy**: ✅ **PASS**
   - Architecture uses File API with client-side processing only
   - No backend/API endpoints defined in plan.md
   - All parsing occurs in browser Web Workers
   - No data transmission to servers

2. **Library-First Architecture**: ✅ **PASS**
   - Contracts defined as standalone TypeScript interfaces (`contracts/*.ts`)
   - Clear separation: Parsers (`IOSParserContract`, `AndroidParserContract`), Analysis (`AnalysisEngineContract`), Visualization (`VisualizationContract`, `ExportContract`)
   - Each contract can be implemented independently
   - Example factory functions provided for library consumers

3. **Performance-First**: ✅ **PASS**
   - Web Workers for all parsing operations (`workers/*.worker.ts`)
   - Streaming ZIP parsing with fflate (6-25x faster than alternatives)
   - Virtual scrolling for large tables (TanStack Virtual)
   - Canvas-based treemap rendering (Nivo TreeMapCanvas)
   - Module Workers with Comlink for type-safe, efficient communication

4. **Test-Driven Binary Parsing**: ✅ **PASS**
   - Testing infrastructure defined: Vitest + fixtures
   - Unit test locations specified: `src/lib/**/__tests__/*.test.ts`
   - Integration test workflow documented in quickstart.md
   - Example tests provided in quickstart.md for parser validation

5. **Format Compatibility**: ✅ **PASS**
   - Error handling defined in contracts (`ParseError`, `ParseErrorCode` enum)
   - Format validation methods in all parser contracts (`validateFormat()`)
   - Graceful degradation: `skipDEXAnalysis`, `skipResources`, `skipNativeLibs` options
   - Timeout and file size limits configurable

**Additional Architectural Strengths**:

- **Type Safety**: TypeScript 5.x strict mode throughout
- **Observability**: Progress callbacks in all contracts (`onProgress`)
- **Cancellation**: Cancel methods for long-running operations
- **Error Classification**: Specific error codes for debugging (`INVALID_FORMAT`, `CORRUPTED_FILE`, `PARSE_TIMEOUT`, etc.)

**Recommended Constitution Ratification**:

Based on this implementation plan, the proposed principles are sound and should be ratified as the project constitution. No conflicts or violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-size-analyzer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Technology research & decisions
├── data-model.md        # Phase 1 output - Core entities and state
├── quickstart.md        # Phase 1 output - Developer onboarding
├── contracts/           # Phase 1 output - Binary parser interfaces
│   ├── ios-parser.ts    # iOS IPA/xcarchive parser contract
│   ├── android-parser.ts # Android APK/AAB parser contract
│   ├── analysis-engine.ts # Analysis and insights contract
│   └── visualization.ts  # Treemap and breakdown view contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── parsers/              # Binary format parsers
│   ├── common/
│   │   ├── zip-parser.ts       # ZIP archive extraction
│   │   ├── file-hasher.ts      # Content hashing for duplicates
│   │   └── types.ts            # Shared types
│   ├── ios/
│   │   ├── ipa-parser.ts       # Main IPA parser
│   │   ├── plist-parser.ts     # Binary plist reader
│   │   ├── macho-parser.ts     # Mach-O header parser
│   │   ├── asset-catalog-parser.ts  # .car file parser
│   │   └── types.ts            # iOS-specific types
│   └── android/
│       ├── apk-parser.ts       # Main APK/AAB parser
│       ├── binary-xml-parser.ts # Binary XML manifest parser
│       ├── arsc-parser.ts      # resources.arsc parser
│       ├── dex-parser.ts       # DEX file parser
│       └── types.ts            # Android-specific types
├── analysis/
│   ├── breakdown-generator.ts  # Hierarchical tree builder
│   ├── insight-engine.ts       # Rule execution framework
│   ├── insight-rules.ts        # Rule implementations
│   └── types.ts                # Analysis types
├── visualization/
│   ├── treemap-generator.ts    # Treemap data transformation
│   └── color-scheme.ts         # Heatmap color calculations
├── components/
│   ├── upload/
│   │   ├── UploadZone.tsx      # Drag-drop upload
│   │   └── FileValidator.tsx   # Format validation UI
│   ├── breakdown/
│   │   ├── BreakdownView.tsx   # Main breakdown view
│   │   ├── BreakdownTable.tsx  # Virtual scrolling table
│   │   └── BreakdownTabs.tsx   # Tabbed navigation
│   ├── xray/
│   │   ├── XRayView.tsx        # Treemap view
│   │   ├── Treemap.tsx         # Treemap visualization
│   │   └── CategoryFilter.tsx  # Content type filters
│   ├── insights/
│   │   ├── InsightsView.tsx    # Insights dashboard
│   │   ├── InsightCard.tsx     # Individual insight
│   │   └── InsightFilters.tsx  # Severity filters
│   └── shared/
│       ├── ErrorBoundary.tsx   # Error handling
│       ├── LoadingSpinner.tsx  # Progress indicator
│       └── ExportButton.tsx    # CSV/JSON export
├── store/
│   └── analysis-store.ts       # Zustand state management
├── utils/
│   ├── formatters.ts           # Size formatting (MB, KB)
│   ├── calculations.ts         # Percentage, compression estimates
│   └── export.ts               # CSV/JSON export utilities
├── workers/
│   └── parser-worker.ts        # Web Worker for binary parsing
├── types/
│   ├── analysis.types.ts       # Core analysis types
│   ├── ios.types.ts            # iOS entities
│   └── android.types.ts        # Android entities
├── App.tsx                     # Root component
└── main.tsx                    # Entry point

tests/
├── unit/
│   ├── parsers/
│   │   ├── plist-parser.test.ts
│   │   ├── macho-parser.test.ts
│   │   ├── dex-parser.test.ts
│   │   └── binary-xml-parser.test.ts
│   ├── analysis/
│   │   ├── breakdown-generator.test.ts
│   │   ├── insight-rules.test.ts
│   │   └── insight-engine.test.ts
│   └── utils/
│       ├── formatters.test.ts
│       └── calculations.test.ts
├── integration/
│   ├── ios-parsing-pipeline.test.ts
│   ├── android-parsing-pipeline.test.ts
│   └── insights-generation.test.ts
└── e2e/
    ├── upload-analyze-export.spec.ts
    └── treemap-navigation.spec.ts

fixtures/
├── ios/
│   ├── sample.ipa                # Test IPA files
│   ├── sample.xcarchive.zip      # Test xcarchive
│   └── malformed-plist.ipa       # Edge case tests
└── android/
    ├── sample.apk                # Test APK files
    ├── sample.aab                # Test AAB files
    └── malformed-manifest.apk    # Edge case tests

public/
└── index.html                    # HTML entry point
```

**Structure Decision**: Single-page web application (Option 1 adapted for frontend). All logic runs client-side in the browser. No backend required. Parsers are organized by platform (iOS/Android) with shared common utilities. Web Workers handle parsing in background threads to maintain UI responsiveness.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations (no constitution exists yet)
