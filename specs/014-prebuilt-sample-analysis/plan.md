# Implementation Plan: One-Time Sample File Pre-Analysis

**Branch**: `014-prebuilt-sample-analysis` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)

## Summary

Create a one-time script that converts the existing 6 sample binary files to JSON, commit the JSON files to the repo, and update the sample file loader to use JSON files instead of binaries.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Vue 3.5.24
**Primary Dependencies**: Existing parsers (src/lib/parsers/), fflate, app-info-parser
**Storage**: Git repository (JSON files committed as static assets)
**Testing**: Manual testing (click samples, verify instant load)
**Target Platform**: Modern browsers
**Project Type**: Single-page web app (client-side only)
**Performance Goals**: <1 second sample load, JSON files <500 KB each
**Constraints**: One-time conversion, no build automation needed
**Scale**: 6 sample files total

## Implementation Approach

### Step 1: Create One-Time Conversion Script

**File**: `scripts/convert-samples-to-json.js`

```javascript
// Run once manually: node scripts/convert-samples-to-json.js
// - Discovers 6 sample files in sample-files/
// - Parses each using existing parsers (parseAPK, parseIPA, etc.)
// - Serializes ParseResult to JSON (with custom replacer for Uint8Array)
// - Writes JSON files to prebuilt-analyses/
```

### Step 2: Update Sample File Loader

**File**: `src/composables/useSampleFiles.js`

```javascript
// Change import.meta.glob from:
//   '/sample-files/*.{ipa,apk,aab}' (binaries)
// To:
//   '/prebuilt-analyses/*.json' (pre-generated JSON)

// Update loadSampleFile to:
// - fetch JSON file
// - deserialize (reverse Uint8Array base64 → Uint8Array)
// - return ParseResult object
```

### Step 3: Commit JSON Files

```bash
git add prebuilt-analyses/*.json
git commit -m "Add pre-analyzed JSON for 6 sample files"
```

## Project Structure

```
scripts/
└── convert-samples-to-json.js     # NEW: One-time conversion script

src/
├── lib/
│   └── parsers/                   # NO CHANGES (reused by script)
└── composables/
    └── useSampleFiles.js          # MODIFIED: Load JSON instead of binaries

sample-files/                      # NO CHANGES (keep binaries for reference)
├── A Night Battle HD 1.2.ipa
├── Facebook_539.0.0.54.69_APKPure.apk
└── ...

prebuilt-analyses/                 # NEW: Generated JSON files (committed to git)
├── a-night-battle-hd.json
├── facebook.json
├── instagram-lite.json
├── tools-for-procreate.json
├── grasshopper-dialer.json
└── careem-release.json
```

## Constitution Check

### Principle I: Client-Side Privacy ✅ PASS
- Script runs locally (not on user's machine)
- JSON files are static assets (no user data)

### Principle II: Performance-First ✅ PASS
- Bypasses Web Worker parsing entirely
- Instant JSON loading (<1s)

### Principle III: Library-First ✅ PASS
- Script reuses existing parsers
- No new dependencies

### Principle IV: TDD ⚠️ CONDITIONAL
- No tests needed (one-time script)
- Manual verification sufficient

### Principle V: Code Quality ✅ PASS
- ES2020+, JSDoc annotations

### Principle VI: Progressive Enhancement ✅ PASS
- Works in all modern browsers (JSON.parse)

### Principle VII: Specification-First ✅ PASS
- Following SpecKit workflow

**Overall**: ✅ **PASS** - Simple one-time conversion, no constitution violations

## Next Steps

Ready for `/speckit.tasks` to create implementation checklist:
1. Create conversion script
2. Run script to generate JSON files
3. Update useSampleFiles.js
4. Test all 6 samples load instantly
5. Commit JSON files
6. Deploy
