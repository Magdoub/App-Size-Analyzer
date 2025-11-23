# Data Model: JSON Export for File Breakdown

**Feature**: 013-json-export
**Date**: 2025-01-23
**Purpose**: Define entities, data structures, and relationships for JSON export functionality

## Overview

This document defines the data structures used by the JSON export feature. All entities are plain JavaScript objects (no classes) following the library-first principle. Data flows from Pinia store → export library → formatted JSON string → user (clipboard/download).

## Core Entities

### 1. ExportMetadata

Represents the root-level metadata included in exported JSON to provide context about the analyzed app and export process.

**Properties**:
- `appName` (string): Display name of the analyzed application
- `version` (string): App version number (e.g., "1.2.3")
- `bundleId` (string): iOS bundle identifier or Android package name (e.g., "com.example.myapp")
- `platform` (string): Target platform - "iOS", "Android", or "Android (AAB)"
- `totalSize` (number): Total install size in bytes (uncompressed)
- `fileCount` (number): Total number of files in the breakdown
- `exportedAt` (string): ISO 8601 timestamp of export operation (e.g., "2025-01-23T14:30:22.123Z")
- `analyzerVersion` (string): Version of the analyzer app (for tracking export format changes)

**Validation Rules**:
- All properties are required (no optional fields)
- `totalSize` and `fileCount` must be non-negative integers
- `exportedAt` must be valid ISO 8601 format
- `platform` must be one of the allowed values

**Source**: Derived from `analysisStore.currentAnalysis.metadata` and runtime context

**Example**:
```javascript
{
  appName: "MyApp",
  version: "1.2.3",
  bundleId: "com.example.myapp",
  platform: "iOS",
  totalSize: 52428800,
  fileCount: 1247,
  exportedAt: "2025-01-23T14:30:22.123Z",
  analyzerVersion: "1.0.0"
}
```

---

### 2. FileEntry

Represents a single file in the breakdown with all available metadata. This is the flattened representation of tree nodes for easier querying/filtering in external tools.

**Properties**:
- `path` (string): Full file path relative to app root (e.g., "Payload/MyApp.app/Assets.car")
- `size` (number): Uncompressed file size in bytes
- `compressedSize` (number | null): Compressed size in ZIP archive (null if not compressed or unknown)
- `compressionRatio` (number | null): Compression efficiency 0.0-1.0 (null if not applicable)
- `type` (string | null): File type identifier (e.g., "plist", "png", "dylib", "dex")
- `category` (string | null): Logical category (e.g., "code", "resources", "assets", "configuration", "framework")

**Validation Rules**:
- `path` is required and must not be empty
- `size` must be non-negative integer
- `compressedSize` must be non-negative integer or null
- `compressionRatio` must be between 0.0 and 1.0 or null
- Special characters in `path` must be JSON-safe (escaped quotes, backslashes, Unicode)

**Source**: Derived from `analysisStore.currentAnalysis.breakdownRoot` tree (flattened)

**Example**:
```javascript
{
  path: "Payload/MyApp.app/MyApp",
  size: 15728640,
  compressedSize: 8388608,
  compressionRatio: 0.47,
  type: "binary",
  category: "code"
}
```

---

### 3. ExportResult

The complete export data structure combining metadata and file entries. This is the root object that gets serialized to JSON.

**Properties**:
- `metadata` (ExportMetadata): Export and app metadata
- `files` (FileEntry[]): Array of all files in the breakdown

**Validation Rules**:
- `metadata` must be a valid ExportMetadata object
- `files` must be a non-empty array of valid FileEntry objects
- Array order should be consistent (e.g., sorted by path or size)

**Serialization**:
- Formatted with 2-space indentation for readability
- Total JSON size typically 100KB - 5MB depending on file count

**Example**:
```javascript
{
  metadata: {
    appName: "MyApp",
    version: "1.2.3",
    bundleId: "com.example.myapp",
    platform: "iOS",
    totalSize: 52428800,
    fileCount: 1247,
    exportedAt: "2025-01-23T14:30:22.123Z",
    analyzerVersion: "1.0.0"
  },
  files: [
    {
      path: "Payload/MyApp.app/Info.plist",
      size: 4096,
      compressedSize: 1024,
      compressionRatio: 0.75,
      type: "plist",
      category: "configuration"
    },
    // ... more files
  ]
}
```

---

### 4. ClipboardResult

Result object returned by clipboard copy operation to communicate success/failure to UI.

**Properties**:
- `success` (boolean): Whether copy operation succeeded
- `method` (string): Which clipboard method was used - "modern" (Clipboard API) or "legacy" (execCommand)
- `error` (string | null): Error message if copy failed, null otherwise

**States**:
- Success (modern): `{ success: true, method: "modern", error: null }`
- Success (legacy): `{ success: true, method: "legacy", error: null }`
- Failure: `{ success: false, method: null, error: "Permission denied" }`

**Example**:
```javascript
// Success case
{
  success: true,
  method: "modern",
  error: null
}

// Failure case
{
  success: false,
  method: null,
  error: "Clipboard access denied. Please grant permission or manually copy the JSON."
}
```

---

## Data Flow

```
┌─────────────────┐
│  Pinia Store    │
│ (analysisStore) │
└────────┬────────┘
         │
         │ currentAnalysis (breakdown tree + metadata)
         ▼
┌─────────────────┐
│  Export Library │
│  (json-generator)│
│                 │
│ 1. Flatten tree │
│ 2. Build Export │
│    Result       │
│ 3. Stringify    │
└────────┬────────┘
         │
         │ JSON string (formatted)
         ▼
┌─────────────────┐
│   UI Actions    │
│                 │
│ - View Modal    │
│ - Copy to       │
│   Clipboard     │
│ - Download File │
└─────────────────┘
```

## State Transitions

### Export Operation States

```
IDLE → GENERATING → SUCCESS | ERROR

- IDLE: No export in progress
- GENERATING: JSON.stringify() in progress (usually <100ms)
- SUCCESS: JSON ready, displayed in modal or copied/downloaded
- ERROR: Generation failed (e.g., circular reference, memory error)
```

### Clipboard Copy States

```
READY → COPYING → SUCCESS | ERROR → READY

- READY: Export JSON available, user can click "Copy"
- COPYING: Clipboard API call in progress
- SUCCESS: JSON copied, show toast notification
- ERROR: Copy failed, show error message with fallback options
```

## Validation & Sanitization

### Path Sanitization

File paths may contain special characters that need escaping for valid JSON:

- **Quotes**: `"` → `\"`
- **Backslashes**: `\` → `\\`
- **Unicode**: Preserve as-is (JSON.stringify handles UTF-8)
- **Newlines/Tabs**: Rare in paths, but handled by JSON.stringify

**Implementation**: Use native `JSON.stringify()` - handles all escaping automatically.

### Size Validation

Before generating JSON:
- Verify `totalSize` matches sum of all file sizes (sanity check)
- Verify `fileCount` matches array length
- Log warning if mismatches detected (data integrity issue)

### Metadata Sanitization

- **App name**: May contain special characters, emojis - preserve as-is in JSON
- **Bundle ID**: Should be alphanumeric + dots, but don't assume - sanitize for filename generation only
- **Version**: Can be any string format (semver, build numbers, etc.)

## Relationships

### Entity Relationships

```
ExportResult
├── metadata (ExportMetadata) [1:1]
└── files (FileEntry[]) [1:N]

Pinia Store
└── currentAnalysis
    ├── metadata → ExportMetadata (mapped)
    └── breakdownRoot (tree) → files[] (flattened)
```

### Component Dependencies

```
BreakdownView (container)
└── JsonExportButton (trigger)
    └── JsonExportModal (display)
        ├── reads: ExportResult from store
        ├── actions: copyToClipboard(), downloadFile()
        └── displays: formatted JSON with syntax highlighting
```

## Performance Considerations

### Memory Usage

- **Small app** (500 files): ~50KB JSON → ~100KB memory (parsed object + string)
- **Medium app** (2,000 files): ~200KB JSON → ~400KB memory
- **Large app** (10,000 files): ~1MB JSON → ~2MB memory

**Mitigation**: Generate JSON on-demand (user clicks export), discard after modal closes.

### Generation Time

- **JSON.stringify()**: ~10ms for 1,000 files, ~100ms for 10,000 files
- **Tree flattening**: O(n) traversal, ~5ms for 10,000 nodes
- **Total**: <150ms worst case (acceptable without Web Worker)

## Future Enhancements

Potential data model extensions (out of scope for v1):

1. **Filtering**: Add `ExportOptions` entity to allow user to filter by category, size threshold, or file type before export
2. **Diff mode**: Add `previousExport` field to metadata to enable size change tracking
3. **Compression stats**: Add aggregate compression statistics to metadata (total compressed size, average ratio)
4. **Custom fields**: Allow user to add custom metadata fields (notes, tags, project name)

---

## Summary

The data model uses simple, flat structures optimized for JSON serialization and external tool compatibility. All entities are plain objects (no classes), validation occurs at generation time, and the structure balances completeness (all available metadata) with usability (flat file array for easy querying).
