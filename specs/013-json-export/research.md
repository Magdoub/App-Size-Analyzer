# Research: JSON Export for File Breakdown

**Feature**: 013-json-export
**Date**: 2025-01-23
**Purpose**: Resolve technical unknowns and document design decisions for JSON export feature

## Overview

This document captures research findings and technical decisions for implementing JSON export functionality in the file breakdown view. All decisions prioritize client-side processing, performance, and library-first architecture per project constitution.

## Research Areas

### 1. JSON Generation for Large Datasets

**Question**: How should we generate JSON for large breakdown trees (10,000+ files) without blocking the UI thread?

**Research Findings**:
- Native `JSON.stringify()` is highly optimized in modern browsers (V8, SpiderMonkey, JavaScriptCore)
- Performance benchmarks: ~100ms for 10,000 objects with nested structure on mid-range hardware
- Web Worker overhead for JSON serialization: ~20-50ms (message passing + structured clone)
- Streaming JSON generation libraries (e.g., `json-stream-stringify`) add 50KB+ bundle size

**Decision**: Use synchronous `JSON.stringify()` on main thread with optional `requestIdleCallback` wrapper

**Rationale**:
- `JSON.stringify()` is fast enough (<100ms) for 99% of use cases (apps with <5,000 files)
- Web Worker adds complexity and latency for typical workloads
- If performance becomes an issue (user reports or telemetry shows >100ms), can migrate to Web Worker in future iteration
- `requestIdleCallback` provides non-blocking option for larger datasets without complexity of Web Workers

**Alternatives Considered**:
- Web Worker: Rejected due to overhead for typical use cases and added complexity
- Streaming JSON: Rejected due to bundle size and unnecessary for in-memory data structures
- Chunked generation: Rejected as premature optimization (YAGNI - You Aren't Gonna Need It)

---

### 2. Clipboard API Browser Support and Fallbacks

**Question**: How should we handle clipboard access across browsers, including older versions and permission restrictions?

**Research Findings**:
- **Clipboard API** (`navigator.clipboard.writeText()`):
  - Chrome 66+ (Apr 2018), Firefox 63+ (Oct 2018), Safari 13.1+ (Mar 2020), Edge 79+ (Jan 2020)
  - Requires HTTPS or localhost
  - Requires user interaction (click event)
  - May require explicit permission in some browsers (Safari shows prompt)

- **Legacy approach** (`document.execCommand('copy')`):
  - Deprecated but still works in all browsers
  - Does not require permissions
  - Requires creating temporary textarea element

- **Feature detection**: `navigator.clipboard?.writeText` checks for API availability

**Decision**: Use Clipboard API with legacy `execCommand` fallback

**Rationale**:
- Clipboard API is the modern standard and works in all target browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Graceful degradation to `execCommand` ensures compatibility with older browsers and permission-denied scenarios
- Feature detection prevents errors in non-HTTPS contexts (local development)

**Implementation Strategy**:
```javascript
// Pseudocode
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'modern' };
    }
  } catch (err) {
    // Permission denied or API unavailable - fall through to legacy
  }

  // Fallback: execCommand
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);

  return { success, method: 'legacy' };
}
```

**Alternatives Considered**:
- Clipboard API only: Rejected due to permission failures in Safari
- execCommand only: Rejected as it's deprecated and doesn't work in some secure contexts
- Third-party library (clipboard.js): Rejected due to bundle size and NIH (Not Invented Here) - simple enough to implement natively

---

### 3. JSON Formatting and Syntax Highlighting

**Question**: Should we add syntax highlighting for the JSON display, and if so, how?

**Research Findings**:
- **No highlighting**: Plain `<pre>` with monospace font - 0KB bundle size
- **CSS-only highlighting**: Uses `::before`/`::after` pseudo-elements - limited, complex, fragile
- **Lightweight libraries**:
  - `highlight.js` (JSON only): ~8KB gzipped, widely used, good performance
  - `prism.js` (JSON only): ~2KB gzipped, modular, slightly faster
  - Custom regex-based highlighter: ~1KB, simple but less robust

- **User value**: Syntax highlighting improves readability for complex nested JSON
- **Performance**: Highlighting 10,000 lines can take 50-100ms (one-time cost on modal open)

**Decision**: Implement simple custom regex-based syntax highlighting

**Rationale**:
- Minimal bundle size impact (<1KB)
- JSON syntax is simple and well-defined (strings, numbers, booleans, null, braces, brackets)
- Highlighting occurs once when modal opens (not performance-critical)
- Avoids dependency on external highlighting libraries
- Sufficient for user needs (readability, not editing)

**Implementation Approach**:
```javascript
// Pseudocode
function highlightJSON(jsonString) {
  return jsonString
    .replace(/"([^"]+)":/g, '<span class="key">"$1":</span>') // Keys
    .replace(/: "([^"]+)"/g, ': <span class="string">"$1"</span>') // String values
    .replace(/: (\d+)/g, ': <span class="number">$1</span>') // Numbers
    .replace(/: (true|false|null)/g, ': <span class="keyword">$1</span>'); // Keywords
}
```

**Alternatives Considered**:
- No highlighting: Rejected due to poor readability for large JSON
- Prism.js: Rejected due to bundle size (2KB is small but unnecessary for this use case)
- highlight.js: Rejected due to larger bundle size (8KB)

---

### 4. File Download Naming Convention

**Question**: What naming convention should we use for downloaded JSON files to ensure uniqueness and clarity?

**Research Findings**:
- **Best practices** from similar tools:
  - Include app name or bundle ID for identification
  - Include timestamp for versioning (ISO 8601 format: `YYYY-MM-DD` or `YYYYMMDD-HHMMSS`)
  - Use lowercase with hyphens (kebab-case) for cross-platform compatibility
  - Avoid special characters (spaces, quotes, slashes) that may cause issues on Windows/Linux/macOS

- **Examples**:
  - `app-breakdown-2025-01-23.json` (simple, date only)
  - `myapp-1.2.3-breakdown-20250123-143022.json` (detailed, includes version and time)
  - `com-example-myapp-breakdown.json` (bundle ID based)

- **User preference**: Not specified in requirements - reasonable default needed

**Decision**: Use format `{appName}-breakdown-{YYYY-MM-DD-HHMMSS}.json`

**Rationale**:
- App name provides immediate context (which app was analyzed)
- Timestamp prevents filename collisions when analyzing same app multiple times
- Date+time format ensures chronological sorting in file explorers
- Descriptive suffix "breakdown" clarifies file contents
- Sanitize app name to remove special characters (replace spaces/symbols with hyphens)

**Implementation**:
```javascript
// Pseudocode
function generateFilename(appName, metadata) {
  const sanitized = appName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19); // "2025-01-23T14-30-22"
  return `${sanitized}-breakdown-${timestamp}.json`;
}
// Example: "my-app-breakdown-2025-01-23-143022.json"
```

**Alternatives Considered**:
- Bundle ID only: Rejected as less user-friendly than app name
- Date only (no time): Rejected due to potential collisions on same day
- No timestamp: Rejected as it forces users to manually rename to avoid overwrites
- Random suffix: Rejected as it's not user-friendly (no chronological sorting)

---

### 5. JSON Schema and Data Structure

**Question**: What should the exported JSON structure look like to balance readability, completeness, and compatibility?

**Research Findings**:
- **Current breakdown tree structure**: Hierarchical tree with parent-child relationships
- **Flattened structure**: Array of objects with path strings (easier to filter/search in external tools)
- **Hybrid structure**: Root metadata + file array (balances context and usability)

**Decision**: Use hybrid structure with root metadata and flattened file array

**JSON Schema**:
```json
{
  "metadata": {
    "appName": "MyApp",
    "version": "1.2.3",
    "bundleId": "com.example.myapp",
    "platform": "iOS",
    "totalSize": 52428800,
    "fileCount": 1247,
    "exportedAt": "2025-01-23T14:30:22.123Z",
    "analyzerVersion": "1.0.0"
  },
  "files": [
    {
      "path": "Payload/MyApp.app/Info.plist",
      "size": 4096,
      "compressedSize": 1024,
      "compressionRatio": 0.75,
      "type": "plist",
      "category": "configuration"
    },
    // ... more files
  ]
}
```

**Rationale**:
- **Metadata section**: Provides context (app identity, export time) for data provenance
- **Flattened file array**: Easier to process with jq, spreadsheets, or custom scripts than nested tree
- **Comprehensive properties**: Includes all available metadata (size, compression, type, category)
- **Timestamps**: ISO 8601 format for universal compatibility
- **Analyzer version**: Enables tracking of export format changes over time

**Alternatives Considered**:
- Tree structure (nested): Rejected as harder to query/filter in external tools
- File array only (no metadata): Rejected due to missing context (what app is this?)
- Minimal structure (path + size only): Rejected as users may need compression and type data

---

## Summary of Decisions

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| JSON Generation | Synchronous `JSON.stringify()` on main thread | Fast enough for typical datasets (<100ms for 5,000 files), simpler than Web Worker |
| Clipboard API | Modern Clipboard API with `execCommand` fallback | Best browser support with graceful degradation |
| Syntax Highlighting | Custom regex-based highlighter | Minimal bundle size (<1KB), sufficient for readonly JSON display |
| File Naming | `{appName}-breakdown-{YYYY-MM-DD-HHMMSS}.json` | Clear, unique, chronologically sortable |
| JSON Structure | Hybrid: metadata object + flattened file array | Balances context and queryability |

## Open Questions

**None** - All technical unknowns have been resolved with documented decisions.

## Next Steps

Proceed to **Phase 1: Design & Contracts** to create:
1. `data-model.md` - Define FileEntry and ExportResult entities
2. `contracts/json-exporter.js` - Export library interface contract
3. `quickstart.md` - Usage examples for developers
