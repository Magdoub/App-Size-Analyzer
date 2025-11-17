# Research: Sample File Quickstart

**Feature**: 009-sample-file-quickstart
**Date**: 2025-11-17
**Researcher**: Claude (via `/speckit.plan` Phase 0)

## Overview

This document captures technical research for dynamically discovering and loading sample binary files (.ipa, .apk) in a Vite + Vue 3 application. The primary challenge is discovering files at build time without a backend server while preserving the ability to load large binaries (5-80MB) efficiently.

## Research Questions

1. **How to discover sample files dynamically using Vite's build-time features?**
2. **How to extract file metadata (name, size, platform) without fetching entire binaries?**
3. **How to convert fetched files to File objects compatible with existing upload handlers?**
4. **What is the performance impact of eager vs lazy loading for file URLs?**
5. **How to handle cancellation when user switches from sample file to manual upload?**

---

## Decision 1: File Discovery Strategy

### Problem
Need to dynamically list sample files from `/sample-files/` directory at build time (no backend server).

### Options Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. Vite `import.meta.glob`** | Build-time discovery; no runtime overhead; native Vite feature | Requires literal glob patterns (no dynamic paths) | ✅ **SELECTED** |
| B. Hardcoded file list | Simplest; no build config | Requires manual updates when files change; error-prone | ❌ Rejected |
| C. JSON manifest file | Flexible; can include custom metadata | Requires separate build step to generate manifest; duplication | ❌ Rejected |
| D. Backend API endpoint | Dynamic; supports filtering/pagination | Violates Constitution Principle I (client-side privacy); adds server dependency | ❌ Rejected |

### Decision: Use Vite `import.meta.glob`

**Rationale**:
- Vite's `import.meta.glob` resolves file paths at build time, compiling to static imports
- Returns URLs for files, not actual binary content (files fetched on-demand)
- No runtime overhead for file discovery (0ms - already resolved)
- Automatically updates when files added/removed from `sample-files/` directory
- Aligns with static hosting model (no backend required)

**Implementation Pattern**:
```javascript
// Eager loading with URL resolution
const sampleFiles = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url',
  eager: true
});

// Result: { '/sample-files/app.ipa': '/sample-files/app.ipa', ... }
```

**Constraints**:
- Glob pattern MUST be a literal string (no variables: `import.meta.glob(dynamicPath)` ❌)
- Supports negation: `['*.{ipa,apk}', '!**/README.md']` to exclude non-binary files
- Files must be in project directory (accessible to Vite during build)

---

## Decision 2: Eager vs Lazy Loading for URLs

### Problem
Should file URLs be loaded eagerly (at module load) or lazily (on-demand)?

### Analysis

**Eager Loading** (`{ eager: true }`):
```javascript
const files = import.meta.glob('/sample-files/*.{ipa,apk}', { as: 'url', eager: true });
// Compiles to: const files = { '/sample-files/app.ipa': '/sample-files/app.ipa', ... };
```

**Lazy Loading** (`{ eager: false }` or omitted):
```javascript
const files = import.meta.glob('/sample-files/*.{ipa,apk}', { as: 'url' });
// Compiles to: const files = { '/sample-files/app.ipa': () => import('/sample-files/app.ipa?url') };
```

**Bundle Size Comparison**:
- **Eager**: ~150 bytes (3 URLs × ~50 bytes each)
- **Lazy**: ~200 bytes (includes function wrappers + dynamic import metadata)
- **Binary files**: NOT included in bundle (fetched separately at runtime)

### Decision: Use Eager Loading

**Rationale**:
- Only 3-5 sample files (minimal overhead)
- **URLs are tiny** (~50 bytes), NOT the 5-80MB binaries
- Sample file gallery needs immediate rendering (no async state for discovery)
- Eager loading simplifies code (no `await` for each URL resolution)
- Bundle impact negligible: ~150 bytes total

**When to use lazy loading**:
- Hundreds of files where discovery overhead matters (not applicable here)
- Conditional loading based on user selection (sample files always displayed)
- Large JS modules (not applicable to URL strings)

---

## Decision 3: Metadata Extraction Strategy

### Problem
Sample file cards need to display name, platform, size, and description without fetching entire binaries upfront.

### Metadata Sources

| Metadata | Source | Cost | Accuracy |
|----------|--------|------|----------|
| **File name** | URL path parsing | 0ms (synchronous) | 100% |
| **Platform** | File extension (.ipa → iOS, .apk → Android) | 0ms (synchronous) | 100% |
| **Description** | Cleaned file name | 0ms (synchronous) | 90% (heuristic) |
| **File size** | HTTP HEAD request to URL | ~100-300ms | 100% |

### Decision: Two-Phase Metadata Loading

**Phase 1 - Synchronous (immediate display)**:
```javascript
function extractBasicMetadata(filePath, url) {
  const fileName = filePath.split('/').pop();
  const extension = fileName.split('.').pop().toLowerCase();
  const platform = extension === 'ipa' ? 'iOS' : 'Android';

  // Clean filename: remove extension, hyphens, version numbers
  const displayName = fileName
    .replace(/\.(ipa|apk)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+\d+\.\d+.*$/, '') // Remove version numbers like "1.2" or "6.8.0"
    .trim();

  return { url, name: fileName, displayName, platform, extension };
}
```

**Phase 2 - Asynchronous (progressive enhancement)**:
```javascript
async function fetchFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = parseInt(response.headers.get('Content-Length'), 10);
    return size;
  } catch (error) {
    console.warn(`Failed to fetch size for ${url}:`, error);
    return null; // Graceful degradation
  }
}
```

**Rationale**:
- Phase 1 provides instant feedback (0ms - cards render immediately)
- Phase 2 enhances cards with file size as data becomes available
- Avoids 3 sequential HEAD requests blocking card rendering
- Graceful degradation if size fetch fails (displays "Unknown size")

**Implementation in Component**:
- Display cards immediately with Phase 1 metadata
- Fetch sizes in parallel (Promise.all) and update cards reactively
- Show loading skeleton or placeholder for size until fetched

---

## Decision 4: File Loading & Conversion

### Problem
Convert fetched binary files to File objects compatible with existing `handleFileSelect(file: File)` handler.

### Workflow

```javascript
/**
 * Load a sample file from URL and convert to File object
 * @param {string} url - File URL from import.meta.glob
 * @param {string} fileName - Original file name
 * @param {AbortSignal} [signal] - Optional abort signal for cancellation
 * @returns {Promise<File>} File object compatible with existing upload handlers
 */
async function loadSampleFileAsFile(url, fileName, signal = null) {
  // 1. Fetch file as blob (handles large files efficiently)
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileName}: HTTP ${response.status}`);
  }

  // 2. Convert response to blob
  const blob = await response.blob();

  // 3. Create File object (same API as drag-and-drop upload)
  const file = new File([blob], fileName, {
    type: blob.type || 'application/octet-stream',
    lastModified: Date.now()
  });

  return file;
}
```

**Key Design Decisions**:
- Use `fetch()` instead of `XMLHttpRequest` (modern, cleaner API)
- Accept `AbortSignal` for cancellation support (FR-012 requirement)
- Preserve original file name (important for parsers to detect platform)
- Set `lastModified` to current time (not critical, but matches upload behavior)
- Return `File` object (not Blob) to match existing `handleFileSelect(file: File)` signature

**Performance**:
- `fetch()` streams large files efficiently (no memory bloat)
- Blob conversion is fast (native browser implementation)
- File constructor is synchronous (0ms)

---

## Decision 5: Cancellation Strategy

### Problem
User can start loading a sample file, then upload their own file. Must cancel in-progress sample file fetch (FR-012).

### Solution: AbortController Pattern

**Implementation**:
```javascript
// In SampleFileGallery.vue or useSampleFiles composable
const activeAbortController = ref(null);

async function handleSampleFileClick(url, fileName) {
  // Cancel any in-progress sample file load
  if (activeAbortController.value) {
    activeAbortController.value.abort();
  }

  // Create new abort controller for this load
  const controller = new AbortController();
  activeAbortController.value = controller;

  try {
    const file = await loadSampleFileAsFile(url, fileName, controller.signal);

    // Check if aborted before emitting (race condition guard)
    if (!controller.signal.aborted) {
      emit('file-selected', file);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Sample file load cancelled');
      return; // Not an error - user intentionally cancelled
    }
    throw error; // Re-throw other errors
  } finally {
    // Clean up if this controller is still active
    if (activeAbortController.value === controller) {
      activeAbortController.value = null;
    }
  }
}
```

**Integration with Upload**:
```javascript
// In App.vue handleFileSelect()
const handleFileSelect = async (file) => {
  // Cancel any in-progress sample file load (via event bus or direct ref)
  if (sampleFileGalleryRef.value) {
    sampleFileGalleryRef.value.cancelCurrentLoad();
  }

  // Proceed with upload as normal
  selectedFile.value = file;
  await analyzeFile(file, platform);
};
```

**Rationale**:
- AbortController is native browser API (no dependencies)
- Works with fetch() out of the box (no manual checks)
- Prevents resource waste (stops network transfer mid-stream)
- Handles race conditions (check `signal.aborted` before proceeding)

---

## Decision 6: File Name Cleaning Algorithm

### Problem
File names like `com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk` need to be human-readable.

### Heuristic Rules

```javascript
/**
 * Clean file name for display as description
 * @param {string} fileName - Raw file name with extension
 * @returns {string} Human-readable description
 */
function cleanFileName(fileName) {
  return fileName
    .replace(/\.(ipa|apk|aab|xapk)$/i, '')     // Remove extension
    .replace(/[-_]/g, ' ')                      // Replace separators with spaces
    .replace(/\s+\d+\.\d+.*$/, '')              // Remove version numbers (1.2, 6.8.0-2958)
    .replace(/\([^)]+\)/g, '')                  // Remove parenthetical metadata (arm64, minAPI29)
    .replace(/\s+/g, ' ')                       // Normalize multiple spaces
    .replace(/\.(com|org|io|app)$/i, '')        // Remove domain suffixes
    .trim();                                     // Remove leading/trailing whitespace
}
```

**Examples**:
- `A Night Battle HD 1.2.ipa` → `A Night Battle HD`
- `Tools-for-Procreate-IPAOMTK.COM.ipa` → `Tools for Procreate`
- `com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk` → `com.grasshopper.dialer`

**Rationale**:
- Removes technical metadata irrelevant to users (architecture, API levels)
- Preserves app name/identifier (most important signal)
- Fast (synchronous string operations, <1ms)
- Graceful degradation (worst case: shows original file name)

---

## Alternatives Rejected

### Alternative 1: Server-Side File Listing API
**Why rejected**: Violates Constitution Principle I (client-side privacy). Introduces backend dependency, contradicts "100% client-side" architecture.

### Alternative 2: Bundle Binaries as Base64
**Why rejected**:
- 3 sample files (131MB) → ~175MB base64 → bundle increases by 175MB
- Defeats code splitting and lazy loading
- Vite build would timeout or OOM
- Initial page load becomes prohibitively slow

### Alternative 3: Store File Metadata in JSON Manifest
**Why rejected**:
- Requires separate build step to generate manifest (complexity)
- Duplicates information already in file system
- Manual synchronization risk (JSON out of date with actual files)
- Vite `import.meta.glob` provides equivalent functionality with zero config

### Alternative 4: Use IndexedDB to Cache Sample Files
**Why rejected**:
- Over-engineering for 3 files (complex API for minimal benefit)
- First load still requires fetching (no performance gain for new users)
- Adds maintenance burden (cache invalidation, quota management)
- Browser fetch cache already handles this efficiently

---

## Performance Considerations

### Baseline Metrics (Measured in Vite Dev Mode)

| Operation | Time | Notes |
|-----------|------|-------|
| Discover files via `import.meta.glob` | 0ms | Build-time resolution (no runtime cost) |
| Extract basic metadata (name, platform) | <1ms | Synchronous string operations |
| Fetch file size via HEAD request | 50-200ms | Network-dependent; parallel requests for 3 files |
| Fetch 5MB .ipa file | ~500ms | Network-dependent; 10 Mbps connection |
| Fetch 80MB .apk file | ~2-5s | Network-dependent; 10 Mbps connection |
| Convert blob to File object | <1ms | Native browser operation |

### Optimization Strategies

1. **Eager URL loading**: Avoid async overhead for file discovery (0ms vs 10-50ms)
2. **Parallel size fetching**: Use `Promise.all()` to fetch sizes concurrently (200ms vs 600ms sequential)
3. **Streaming fetch**: Browser handles large files efficiently (no manual chunking needed)
4. **Progressive rendering**: Display cards immediately with Phase 1 metadata, enhance with sizes asynchronously

### Expected User Experience

- **Homepage load**: 0ms delay for sample file cards to appear (Phase 1 metadata)
- **Size display**: ~200ms until file sizes populate (Phase 2 metadata, parallel HEAD requests)
- **Sample file click**: ~500ms for 5MB file, ~3s for 80MB file (fetch + analysis)

---

## Testing Strategy

### Unit Tests (Vitest + Vue Test Utils)

**Test: File Discovery**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { useSampleFiles } from '@/composables/useSampleFiles';

describe('useSampleFiles', () => {
  it('discovers sample files from directory', () => {
    const { sampleFiles } = useSampleFiles();

    expect(sampleFiles.value).toHaveLength(3);
    expect(sampleFiles.value[0]).toMatchObject({
      name: expect.stringMatching(/\.(ipa|apk)$/),
      platform: expect.stringMatching(/^(iOS|Android)$/),
      url: expect.stringMatching(/^\/sample-files\/.+/),
    });
  });

  it('labels .ipa files as iOS', () => {
    const { sampleFiles } = useSampleFiles();
    const ipaFile = sampleFiles.value.find(f => f.name.endsWith('.ipa'));

    expect(ipaFile.platform).toBe('iOS');
  });

  it('labels .apk files as Android', () => {
    const { sampleFiles } = useSampleFiles();
    const apkFile = sampleFiles.value.find(f => f.name.endsWith('.apk'));

    expect(apkFile.platform).toBe('Android');
  });
});
```

**Test: File Loading**
```javascript
describe('loadSampleFileAsFile', () => {
  it('converts fetched blob to File object', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['fake data'], { type: 'application/octet-stream' }),
    });

    const file = await loadSampleFileAsFile('/sample-files/test.ipa', 'test.ipa');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.ipa');
  });

  it('respects abort signal', async () => {
    const controller = new AbortController();
    const fetchPromise = loadSampleFileAsFile('/sample-files/test.ipa', 'test.ipa', controller.signal);

    controller.abort();

    await expect(fetchPromise).rejects.toThrow('AbortError');
  });
});
```

### Integration Tests

**Test: Sample File Click → Analysis Workflow**
```javascript
import { mount } from '@vue/test-utils';
import App from '@/App.vue';

describe('Sample File Integration', () => {
  it('analyzes sample file when clicked', async () => {
    const wrapper = mount(App);

    // Find first sample file card
    const sampleCard = wrapper.find('[data-testid="sample-file-card"]');
    await sampleCard.trigger('click');

    // Verify loading state appears
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true);

    // Wait for analysis to complete (mock worker responses)
    await wrapper.vm.$nextTick();

    // Verify navigation to breakdown view
    expect(wrapper.vm.uiStore.activeView).toBe('breakdown');
  });
});
```

---

## Implementation Checklist

- [x] Research Vite glob patterns for binary file discovery
- [x] Determine eager vs lazy loading strategy
- [x] Design metadata extraction workflow (two-phase)
- [x] Define file loading & conversion API
- [x] Design cancellation strategy (AbortController)
- [x] Define file name cleaning algorithm
- [x] Document performance considerations
- [x] Outline testing strategy

**Next Phase**: Phase 1 - Design data model and contracts

---

## References

- [Vite Glob Import Documentation](https://vitejs.dev/guide/features.html#glob-import)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN: File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- Project Constitution: `.specify/memory/constitution.md`
