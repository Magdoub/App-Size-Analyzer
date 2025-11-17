# Data Model: Sample File Quickstart

**Feature**: 009-sample-file-quickstart
**Date**: 2025-11-17
**Phase**: 1 - Design & Contracts

## Overview

This feature introduces minimal new data structures focused on representing sample file metadata for display in the gallery. No persistent storage or complex state management required - all data is ephemeral (generated at build time, consumed at runtime).

---

## Entity: SampleFileMetadata

Represents a single sample file available for quick-start analysis.

### Fields

| Field | Type | Required | Description | Source |
|-------|------|----------|-------------|--------|
| `url` | `string` | ✅ | Vite-resolved URL path to binary file (e.g., `/sample-files/app.ipa`) | `import.meta.glob` |
| `name` | `string` | ✅ | Original file name with extension (e.g., `Tools-for-Procreate.ipa`) | URL path parsing |
| `displayName` | `string` | ✅ | Human-readable name for display (e.g., `Tools for Procreate`) | File name cleaning algorithm |
| `platform` | `'iOS' \| 'Android'` | ✅ | Platform label based on extension (`.ipa` → iOS, `.apk` → Android) | Extension detection |
| `extension` | `string` | ✅ | File extension without dot (e.g., `ipa`, `apk`) | Extension extraction |
| `size` | `number \| null` | ❌ | File size in bytes (fetched asynchronously via HEAD request) | HTTP header `Content-Length` |
| `sizeFormatted` | `string \| null` | ❌ | Human-readable file size (e.g., `47.2 MB`) | Calculated from `size` |

### Validation Rules

- `url` MUST start with `/sample-files/` (enforced by glob pattern)
- `name` MUST match pattern `*.{ipa,apk}` (enforced by glob pattern)
- `platform` MUST be either `'iOS'` or `'Android'` (derived from extension)
- `size` MAY be `null` if HEAD request fails (graceful degradation)

### State Transitions

```
┌─────────────────┐
│   DISCOVERED    │ (Build time: import.meta.glob resolves URLs)
│                 │
│ - url: string   │
└────────┬────────┘
         │
         │ (Runtime: extractBasicMetadata)
         ▼
┌─────────────────┐
│  BASIC_METADATA │ (Immediate display)
│  EXTRACTED      │
│                 │
│ - name          │
│ - displayName   │
│ - platform      │
│ - extension     │
│ - size: null    │
└────────┬────────┘
         │
         │ (Async: fetchFileSize via HEAD request)
         ▼
┌─────────────────┐
│ SIZE_ENRICHED   │ (Progressive enhancement)
│                 │
│ - size: number  │
│ - sizeFormatted │
└────────┬────────┘
         │
         │ (User clicks card)
         ▼
┌─────────────────┐
│   LOADING       │ (Fetch full binary)
│                 │
│ AbortController │
│ active          │
└────────┬────────┘
         │
         │ (Fetch complete)
         ▼
┌─────────────────┐
│   CONVERTED     │ (File object created)
│                 │
│ File: Blob      │
└─────────────────┘
```

### Example Instance

```javascript
{
  url: '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa',
  name: 'Tools-for-Procreate-IPAOMTK.COM.ipa',
  displayName: 'Tools for Procreate',
  platform: 'iOS',
  extension: 'ipa',
  size: 49283072,                    // 47 MB (fetched asynchronously)
  sizeFormatted: '47.0 MB'
}
```

---

## Entity: LoadingState

Tracks the state of sample file loading (used in UI for feedback).

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `isLoading` | `boolean` | True when fetching sample file binary |
| `loadingFileName` | `string \| null` | Name of file currently being loaded |
| `abortController` | `AbortController \| null` | Controller for cancelling in-progress fetch |
| `error` | `Error \| null` | Error if fetch failed |

### State Transitions

```
     IDLE                LOADING              SUCCESS / ERROR
  (default)              (active)                 (terminal)
      │                     │                         │
      │ click card          │ fetch complete          │ user clicks
      ├────────────────────►│────────────────────────►│ another card
      │                     │                         │
      │                     │◄────────────────────────┘
      │                     │ abort()
      │                     │
      └─────────────────────┘
       user uploads file
       (cancels sample load)
```

---

## Relationships

```
┌──────────────────────────┐
│   SampleFileGallery      │ (Vue Component)
│   (Presentation Layer)   │
│                          │
│ - Renders cards          │
│ - Handles clicks         │
│ - Shows loading states   │
└────────────┬─────────────┘
             │ uses
             ▼
┌──────────────────────────┐
│   useSampleFiles()       │ (Composable)
│   (Business Logic)       │
│                          │
│ - Discovers files        │
│ - Extracts metadata      │
│ - Loads binaries         │
│ - Manages loading state  │
└────────────┬─────────────┘
             │ returns
             ▼
┌──────────────────────────┐
│ SampleFileMetadata[]     │ (Data)
│ LoadingState             │
│                          │
│ - Array of file metadata │
│ - Loading status         │
└────────────┬─────────────┘
             │ emit('file-selected')
             ▼
┌──────────────────────────┐
│   App.vue                │ (Parent)
│   handleFileSelect()     │
│                          │
│ - Receives File object   │
│ - Starts analysis        │
└──────────────────────────┘
```

---

## Data Flow

### Discovery (Build Time)
```
  Vite Build Process
        │
        │ import.meta.glob('/sample-files/*.{ipa,apk}', { as: 'url', eager: true })
        ▼
  { '/sample-files/app1.ipa': '/sample-files/app1.ipa', ... }
        │
        │ (Embedded in JavaScript bundle)
        ▼
   Runtime: useSampleFiles composable
```

### Metadata Extraction (Runtime - Synchronous)
```
   URLs from import.meta.glob
        │
        │ extractBasicMetadata(filePath, url)
        ▼
   SampleFileMetadata (without size)
        │
        │ (Displayed immediately in gallery)
        ▼
   User sees cards with platform, name
```

### Size Enrichment (Runtime - Asynchronous)
```
   SampleFileMetadata[]
        │
        │ Promise.all(files.map(f => fetchFileSize(f.url)))
        ▼
   Update metadata with size values
        │
        │ (Reactive update - cards show sizes)
        ▼
   User sees complete metadata
```

### File Loading (Runtime - On Click)
```
   User clicks sample file card
        │
        │ handleSampleFileClick(url, fileName)
        ▼
   Create AbortController
        │
        │ fetch(url, { signal })
        ▼
   Response → Blob
        │
        │ new File([blob], fileName)
        ▼
   File object
        │
        │ emit('file-selected', file)
        ▼
   App.vue → analyzeFile()
```

---

## Storage & Persistence

**No persistence required**:
- Sample file metadata is generated on-demand (no caching beyond browser HTTP cache)
- Loading state is ephemeral (resets on page reload)
- No IndexedDB, localStorage, or sessionStorage used
- Browser's native fetch cache handles file caching (HTTP 304 responses)

**Rationale**: Sample files are static assets bundled with the app. No user-specific state to persist.

---

## Performance Characteristics

### Memory Footprint

| Data | Count | Size per Item | Total |
|------|-------|---------------|-------|
| File URLs | 3 | ~50 bytes | ~150 bytes |
| Basic metadata | 3 | ~200 bytes | ~600 bytes |
| Size metadata | 3 | ~8 bytes (number) | ~24 bytes |
| **Total static metadata** | | | **~800 bytes** |
| File binary (in-memory during load) | 1 | 5-80 MB | 5-80 MB |

**Peak memory usage**: ~80 MB (largest sample file loaded) + ~1 KB (metadata)

### Query Performance

- **File discovery**: 0ms (resolved at build time)
- **Basic metadata extraction**: <1ms per file (string operations)
- **Size fetching**: 50-200ms per file (parallel HEAD requests)
- **Full file loading**: 500ms-5s depending on file size and network

---

## Validation & Constraints

### At Build Time (Vite)
- ✅ All files in `/sample-files/*.{ipa,apk}` must be readable
- ✅ Glob pattern resolves to at least 0 files (empty directory is valid, handled in UI)

### At Runtime (Component)
- ✅ File URLs must be valid HTTP(S) paths
- ✅ Fetched files must have `Content-Length` header (or size = null)
- ✅ Fetched blobs must be convertible to File objects

### Edge Cases Handled
- **Empty directory**: Display message "No sample files available" with prominent upload button
- **HEAD request fails**: Display "Size unknown" in card (graceful degradation)
- **Fetch fails**: Display error message in gallery with retry button
- **Abort during fetch**: Clean up controller, no error shown (user-initiated)

---

## Contract with Existing System

### Input Contract (from useSampleFiles)
```javascript
/** @typedef {Object} SampleFileMetadata */
/** @property {string} url - Vite-resolved URL */
/** @property {string} name - Original file name */
/** @property {string} displayName - Cleaned name for display */
/** @property {'iOS'|'Android'} platform - Platform label */
/** @property {string} extension - File extension */
/** @property {number|null} [size] - File size in bytes */
/** @property {string|null} [sizeFormatted] - Human-readable size */
```

### Output Contract (to App.vue)
```javascript
/**
 * @event file-selected
 * @type {File} - Standard File object compatible with existing handleFileSelect
 * @property {string} name - Original file name (e.g., 'app.ipa')
 * @property {number} size - File size in bytes
 * @property {string} type - MIME type (e.g., 'application/octet-stream')
 * @property {number} lastModified - Timestamp
 */
```

**Compatibility**: Output File object is **identical** to drag-and-drop upload File objects. No changes required to `App.vue::handleFileSelect()` or downstream parsers.

---

## Testing Considerations

### Unit Test Coverage
- ✅ Basic metadata extraction (name, platform, displayName)
- ✅ Size fetching (mock fetch responses)
- ✅ File loading (blob → File conversion)
- ✅ Abort handling (AbortController integration)
- ✅ Error handling (network failures, invalid responses)

### Integration Test Coverage
- ✅ Sample file click → analysis workflow
- ✅ Cancel sample file load when uploading
- ✅ Multiple rapid clicks (ensure single load active)
- ✅ Empty directory handling

### Test Fixtures
- Use existing fixtures in `tests/fixtures/` directory
- Mock `import.meta.glob` responses for predictable test data
- Mock `fetch()` for controlled network simulation

---

## Future Extensibility

**Not in scope for 009, but data model supports**:
- Custom metadata (add `description`, `tags`, `category` fields)
- Dynamic filtering (already have `platform` field for iOS/Android filter)
- File size-based sorting (already have `size` field)
- Custom thumbnails/icons (add `thumbnailUrl` field)

**Data model is intentionally minimal** to reduce complexity and match current requirements exactly.
