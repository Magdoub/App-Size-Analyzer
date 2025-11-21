# Implementation Plan: Comprehensive Insights Improvement

**Branch**: `011-insights-improvement` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-insights-improvement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements comprehensive insights that match and exceed Emerge Tools capabilities by adding 10+ advanced insights with real testing (not estimation), precise detection rules, platform-specific thresholds, and actionable fix instructions. The primary focus is on P1 insights (image optimization with actual compression testing, Firebase security detection, duplicate file detection, iOS alternate icon optimization) that provide the highest value to developers. All processing remains 100% client-side using Web Workers for heavy operations like image compression testing.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution)
**Primary Dependencies**: Vue 3.5.24, Pinia 2.3.1, fflate 0.8.2 (ZIP parsing), app-info-parser 1.1.6 (metadata extraction), Canvas API (image compression), Comlink 4.4.2 (Web Worker communication), color2k 2.0.3 (color utilities)
**Storage**: N/A (100% client-side, in-memory state with Pinia - no persistence)
**Testing**: Vitest 2.1.9 + Vue Test Utils 2.4.6, jsdom 27.1.0 for browser API simulation
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (client-side only)
**Performance Goals**: <10s parsing for 100MB binaries, <60s for image compression testing (per 100 images), maintain 60 FPS during analysis, <1s treemap rendering for 10k+ nodes
**Constraints**: All processing client-side (no server uploads), <500MB heap usage for 200MB binary (2.5x file size target), works offline, no external API dependencies for analysis
**Scale/Scope**: Support for IPA/APK/AAB files up to 1GB, detect 20+ insight types, process apps with 50,000+ files, handle 10,000+ images for compression testing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (all principles satisfied)

### Principle I: Client-Side Privacy (NON-NEGOTIABLE)
✅ **COMPLIANT** - All image compression testing, binary parsing, and insight generation occurs entirely client-side using Canvas API and Web Workers. No server uploads required.

**Evidence**:
- Image compression testing will use Canvas API's `toBlob()` method for WebP/JPEG compression
- HEIC conversion may require WASM library (still client-side, no external API)
- Firebase security detection parses google-services.json locally from APK structure
- All file hashing and duplicate detection uses existing client-side file-hasher.js

### Principle II: Performance-First Architecture (NON-NEGOTIABLE)
✅ **COMPLIANT** - Heavy operations (image compression testing, font parsing) will run in Web Workers to prevent main thread blocking.

**Evidence**:
- Image compression testing will be delegated to dedicated compression worker
- Font file parsing (for unused font detection) will use Web Worker
- Existing parser infrastructure already uses Web Workers (parser-worker.js)
- Progress indicators for long-running operations (<60s for 100 images)

### Principle III: Library-First Design
✅ **COMPLIANT** - Insight rules are already structured as standalone modules with well-defined contracts (insight-rules.js exports rule objects with execute() functions).

**Evidence**:
- New insights will extend existing InsightRule interface in src/lib/analysis/insight-rules.js
- Image compression logic will be extractable library (accepts File/Blob, returns compression results)
- No Vue/Pinia dependencies in core detection logic (rules receive AnalysisContext, return InsightResult[])

### Principle IV: Test-Driven Development (TDD)
⚠️ **PARTIAL COMPLIANCE** - Existing insight rules have no unit tests. New insights will require tests with real binary fixtures.

**Justification**: This feature will establish TDD patterns for future insights by adding:
- Unit tests for each new insight rule with real IPA/APK fixtures
- Test fixtures for image compression accuracy validation
- Integration tests for Firebase detection (requires APK with google-services.json)

**Action**: Phase 0 research must identify test fixture sources and establish testing patterns before implementation.

### Principle V: Code Quality & Modern JavaScript
✅ **COMPLIANT** - Will use ES2020+ features and JSDoc annotations for complex functions.

**Evidence**:
- Async/await for image compression operations
- Optional chaining for safe property access in insight detection
- JSDoc type annotations for insight rule parameters and return values
- Existing codebase already uses JSDoc types (see insight-rules.js)

### Principle VI: Progressive Enhancement
✅ **COMPLIANT** - Feature detection for Canvas API HEIC support, graceful degradation if WASM libraries unavailable.

**Evidence**:
- Check for Canvas.toBlob() WebP support before recommending WebP conversion
- Detect HEIC support (iOS 12+ per FR-002), skip if unavailable
- Font parsing libraries are optional enhancements (fallback to basic file size detection)

### Principle VII: Specification-First Workflow
✅ **COMPLIANT** - Following SpecKit workflow: specification (done) → clarification (if needed) → planning (current) → task breakdown → implementation.

**Evidence**: This plan.md is being generated per workflow requirements.

### Complexity Assessment
No violations detected. This feature builds on existing architecture without introducing new complexity:
- Reuses existing insight engine (insight-rules.js, insight-engine.js)
- Extends existing parser infrastructure (no new file format support needed)
- Uses existing Web Worker patterns for heavy operations

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 (Design) completion*

**Status**: ✅ PASS (all principles remain satisfied)

### Changes from Initial Check:
- Research.md confirmed HEIC encoding not viable → removed from requirements
- Research.md confirmed font parsing library not needed → using heuristics instead
- Both decisions reduce complexity and maintain zero-bundle-size impact

### Updated Compliance:

**Principle I (Client-Side Privacy)**: ✅ COMPLIANT
- Confirmed: All compression testing uses Canvas API (client-side)
- Confirmed: No external compression services or APIs
- Confirmed: Font detection uses heuristics (no library, no parsing)

**Principle IV (TDD)**: ✅ COMPLIANT (previously partial)
- Action completed: Research identified test fixture sources (Archive.org, APKPure, GitHub releases)
- Commitment: All new insights will have unit tests with real binary fixtures
- Pattern established: tests/fixtures/ structure defined in data-model.md

**Principle V (Code Quality)**: ✅ COMPLIANT
- Confirmed: JSDoc contracts defined in contracts/ directory
- Confirmed: Complex functions (compression, font detection) fully documented

**All other principles**: No changes from initial assessment

### Final Assessment:
Feature design complete. Ready for Phase 2 (Task Breakdown) via `/speckit.tasks` command.

## Project Structure

### Documentation (this feature)

```text
specs/011-insights-improvement/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── InsightRule.contract.js
│   ├── ImageCompressor.contract.js
│   └── InsightResult.contract.js
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── analysis/
│   │   ├── insight-engine.js         # Existing - orchestrates rule execution
│   │   ├── insight-rules.js          # EXTEND - add new rules R011-R020
│   │   └── image-compression/        # NEW - image compression library
│   │       ├── compressor.js         # Core compression logic
│   │       ├── heic-converter.js     # HEIC conversion (WASM)
│   │       └── preview-generator.js  # Side-by-side previews
│   ├── parsers/
│   │   ├── ios/
│   │   │   ├── ipa-parser.js         # Existing - may need icon metadata
│   │   │   ├── plist-parser.js       # Existing - for Info.plist font refs
│   │   │   └── framework-parser.js   # Existing - for duplicate frameworks
│   │   └── android/
│   │       ├── apk-parser.js         # Existing - may need Firebase detection
│   │       └── aab-parser.js         # Existing - AAB support
│   └── utils/
│       └── font-parser.js            # NEW - font glyph table analysis
├── workers/
│   ├── parser-worker.js              # Existing - binary parsing
│   └── compression-worker.js         # NEW - image compression testing
└── components/
    └── insights/
        ├── InsightCard.vue           # Existing - may need enhancement
        └── ImageComparisonPreview.vue # NEW - side-by-side image preview

tests/
├── unit/
│   ├── insight-rules/
│   │   ├── image-optimization.test.js     # NEW - R011 tests
│   │   ├── firebase-security.test.js      # NEW - R012 tests
│   │   ├── duplicate-detection.test.js    # ENHANCE - R001 Android threshold
│   │   ├── icon-optimization.test.js      # NEW - R013 tests
│   │   ├── localization-minify.test.js    # NEW - R014 tests
│   │   ├── unnecessary-files.test.js      # NEW - R015 tests
│   │   ├── symbol-stripping.test.js       # ENHANCE - R003 enhanced
│   │   ├── unused-fonts.test.js           # NEW - R016 tests
│   │   ├── video-optimization.test.js     # NEW - R017 tests
│   │   ├── framework-duplication.test.js  # NEW - R018 tests
│   │   └── android-optimizations.test.js  # NEW - R019 tests
│   └── image-compression/
│       ├── compressor.test.js             # NEW - compression accuracy
│       └── heic-converter.test.js         # NEW - HEIC conversion
├── integration/
│   └── insights-workflow.test.js          # NEW - upload → parse → insights
└── fixtures/
    ├── ios/
    │   ├── sample-with-images.ipa         # For image optimization tests
    │   ├── sample-with-icons.ipa          # For icon optimization tests
    │   └── sample-with-frameworks.ipa     # For framework duplication tests
    └── android/
        ├── sample-with-firebase.apk       # For Firebase detection tests
        └── sample-with-duplicates.apk     # For duplicate detection tests
```

**Structure Decision**: Single project (Option 1) - This is a client-side web application with all code in `src/`. New insights extend existing `src/lib/analysis/insight-rules.js` module. Image compression logic is isolated in `src/lib/analysis/image-compression/` as a reusable library. Tests follow existing Vitest structure in `tests/`.
