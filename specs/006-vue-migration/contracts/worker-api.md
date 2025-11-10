# Web Worker API Contract

**Feature**: Vue.js Migration | **Date**: 2025-11-10

## Overview

This document defines the API contract for the Web Worker that handles binary file parsing. The worker runs in a separate thread to prevent UI blocking during CPU-intensive operations (ZIP extraction, binary parsing, tree generation).

**Framework Independence**: The worker uses vanilla JavaScript (no Vue, React, or framework-specific code). It communicates with the main thread via Comlink (typed postMessage abstraction).

---

## Worker Location

```
src/workers/parser.worker.js
```

**Migration Note**: Convert from TypeScript (`parser.worker.ts`) to JavaScript. Remove type annotations, replace with JSDoc comments.

---

## Comlink API

### Exposed Methods

The worker exposes a single object with parsing methods via Comlink:

```javascript
/**
 * Web Worker API for parsing binary files
 * @namespace ParserWorker
 */
const api = {
  /**
   * Parse an iOS .ipa file
   * @param {File} file - The .ipa file to parse
   * @param {Object} options - Parsing options
   * @param {number} [options.timeout=30000] - Timeout in milliseconds (dynamic: 30s + 5s per MB)
   * @param {Function} [options.onProgress] - Progress callback (0-100)
   * @returns {Promise<ParseResult>} Parsed IPA metadata and file tree
   * @throws {Error} If file is invalid, parsing fails, or timeout reached
   */
  parseIPA: async (file, options = {}) => { /* implementation */ },

  /**
   * Parse an Android .apk file
   * @param {File} file - The .apk file to parse
   * @param {Object} options - Parsing options
   * @param {number} [options.timeout=30000] - Timeout in milliseconds (dynamic)
   * @param {Function} [options.onProgress] - Progress callback (0-100)
   * @returns {Promise<ParseResult>} Parsed APK metadata and file tree
   * @throws {Error} If file is invalid, parsing fails, or timeout reached
   */
  parseAPK: async (file, options = {}) => { /* implementation */ },

  /**
   * Parse an Android .aab file
   * @param {File} file - The .aab file to parse
   * @param {Object} options - Parsing options
   * @param {number} [options.timeout=30000] - Timeout in milliseconds (dynamic)
   * @param {Function} [options.onProgress] - Progress callback (0-100)
   * @returns {Promise<ParseResult>} Parsed AAB metadata and file tree
   * @throws {Error} If file is invalid, parsing fails, or timeout reached
   */
  parseAAB: async (file, options = {}) => { /* implementation */ },

  /**
   * Parse an Android .xapk file (ZIP containing multiple APKs)
   * @param {File} file - The .xapk file to parse
   * @param {Object} options - Parsing options
   * @param {number} [options.timeout=30000] - Timeout in milliseconds (dynamic)
   * @param {Function} [options.onProgress] - Progress callback (0-100)
   * @returns {Promise<ParseResult>} Parsed XAPK metadata and file tree
   * @throws {Error} If file is invalid, parsing fails, or timeout reached
   */
  parseXAPK: async (file, options = {}) => { /* implementation */ }
};

// Expose API via Comlink
Comlink.expose(api);
```

---

## Main Thread Usage (Vue Component)

```vue
<!-- UploadZone.vue -->
<script>
import * as Comlink from 'comlink';
import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';

export default {
  setup() {
    const appStore = useAppStore();
    const worker = new Worker(
      new URL('@/workers/parser.worker.js', import.meta.url),
      { type: 'module' }
    );
    const parser = Comlink.wrap(worker);

    const handleFileUpload = async (file) => {
      try {
        appStore.updateParsingStatus({ state: 'parsing', progress: 0 });

        // Determine file type
        const ext = file.name.substring(file.name.lastIndexOf('.'));
        let result;

        // Call appropriate parser method
        if (ext === '.ipa') {
          result = await parser.parseIPA(file, {
            timeout: calculateTimeout(file.size),
            onProgress: Comlink.proxy((progress) => {
              appStore.updateParsingStatus({ progress });
            })
          });
        } else if (ext === '.apk') {
          result = await parser.parseAPK(file, {
            timeout: calculateTimeout(file.size),
            onProgress: Comlink.proxy((progress) => {
              appStore.updateParsingStatus({ progress });
            })
          });
        }
        // ... other file types

        appStore.updateParsingStatus({ state: 'success' });
        return result;
      } catch (error) {
        appStore.setParsingError(error.message);
      }
    };

    const calculateTimeout = (size) => {
      const baseMsPerByte = 30000; // 30s base
      const extraMsPerMB = 5000; // +5s per MB
      return baseMsPerByte + (size / (1024 * 1024)) * extraMsPerMB;
    };

    return { handleFileUpload };
  }
};
</script>
```

**Comlink Proxy**: The `onProgress` callback must be wrapped in `Comlink.proxy()` to allow the worker to call it across threads.

---

## ParseResult Type Definition

```javascript
/**
 * Result of parsing a binary file
 * @typedef {Object} ParseResult
 * @property {Metadata} metadata - App metadata extracted from binary
 * @property {BreakdownNode} breakdownTree - Hierarchical file tree
 * @property {TreemapNode} treemapData - Flattened data for treemap visualization
 * @property {Insight[]} insights - Auto-generated insights
 * @property {Summary} summary - Size summary statistics
 */

/**
 * App metadata extracted from binary headers
 * @typedef {Object} Metadata
 * @property {string} bundleId - iOS: CFBundleIdentifier, Android: package name
 * @property {string} version - App version (e.g., "1.2.3")
 * @property {string} buildNumber - Build number (e.g., "42")
 * @property {string} minOS - Minimum OS version (iOS: "14.0", Android: "21")
 * @property {string} targetOS - Target OS version
 * @property {'iOS'|'Android'} platform - Detected platform
 * @property {string|null} icon - Base64-encoded app icon (PNG)
 * @property {string|null} displayName - App display name (from Info.plist or AndroidManifest.xml)
 */

/**
 * Hierarchical file tree node
 * @typedef {Object} BreakdownNode
 * @property {string} name - File or directory name
 * @property {string} path - Full path (e.g., "Payload/MyApp.app/Frameworks/UIKit.framework")
 * @property {number} size - Uncompressed size in bytes
 * @property {number} compressedSize - Compressed size in bytes (from ZIP entry)
 * @property {number} percentage - Percentage of total app size (0-100)
 * @property {'file'|'directory'} type - Node type
 * @property {string} category - File category ('executable', 'framework', 'resource', 'asset', 'other')
 * @property {BreakdownNode[]} [children] - Child nodes (directories only)
 */

/**
 * Flattened treemap data for visualization
 * @typedef {Object} TreemapNode
 * @property {string} name - Root name (usually bundle ID)
 * @property {TreemapCategory[]} children - Top-level categories
 */

/**
 * Treemap category (e.g., Frameworks, Resources)
 * @typedef {Object} TreemapCategory
 * @property {string} name - Category name
 * @property {string} color - Hex color (e.g., "#4F46E5")
 * @property {TreemapFile[]} children - Files in this category
 */

/**
 * Treemap file node
 * @typedef {Object} TreemapFile
 * @property {string} name - File name
 * @property {number} value - Size in bytes
 * @property {number} percentage - Percentage of parent category
 * @property {string} path - Full file path (for tooltip)
 */

/**
 * Auto-generated insight
 * @typedef {Object} Insight
 * @property {string} id - Unique ID (e.g., "large-framework-uikit")
 * @property {'critical'|'warning'|'info'} severity - Severity level
 * @property {'optimization'|'structure'|'compatibility'} category - Category
 * @property {string} title - Short title (e.g., "Large Framework Detected")
 * @property {string} description - Detailed explanation
 * @property {string[]} affectedFiles - Paths to affected files
 * @property {string} recommendation - Actionable advice
 * @property {number|null} estimatedSavings - Bytes that could be saved (null if N/A)
 */

/**
 * Size summary statistics
 * @typedef {Object} Summary
 * @property {number} totalSize - Total uncompressed size (bytes)
 * @property {number} compressedSize - Total compressed size (bytes)
 * @property {number} compressionRatio - Compression ratio (0-1)
 * @property {number} fileCount - Total number of files
 * @property {number} directoryCount - Total number of directories
 * @property {string} largestFile - Path to largest file
 * @property {number} largestFileSize - Size of largest file (bytes)
 */
```

---

## Error Handling

### Error Types

The worker can throw the following error types:

```javascript
/**
 * Base class for worker errors
 * @class WorkerError
 * @extends Error
 */
class WorkerError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'WorkerError';
    this.code = code;
  }
}

/**
 * File validation error (e.g., invalid format, corrupted ZIP)
 * @class ValidationError
 * @extends WorkerError
 */
class ValidationError extends WorkerError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Parsing timeout error
 * @class TimeoutError
 * @extends WorkerError
 */
class TimeoutError extends WorkerError {
  constructor(timeout) {
    super(`Parsing exceeded timeout of ${timeout}ms`, 'TIMEOUT');
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

/**
 * Binary parsing error (e.g., invalid Mach-O header, corrupt DEX)
 * @class ParseError
 * @extends WorkerError
 */
class ParseError extends WorkerError {
  constructor(message) {
    super(message, 'PARSE_ERROR');
    this.name = 'ParseError';
  }
}
```

### Error Handling Pattern

```javascript
// In Vue component
try {
  const result = await parser.parseIPA(file);
  // Handle success
} catch (error) {
  if (error.name === 'ValidationError') {
    // Show user-friendly validation message
    appStore.addValidationError(error.message);
  } else if (error.name === 'TimeoutError') {
    // Show timeout warning, suggest smaller file
    appStore.setParsingError(`Parsing timed out after ${error.timeout / 1000}s. Try a smaller file.`);
  } else if (error.name === 'ParseError') {
    // Show parsing error, file may be corrupted
    appStore.setParsingError('Failed to parse file. It may be corrupted.');
  } else {
    // Unknown error
    appStore.setParsingError('An unexpected error occurred.');
    console.error(error);
  }
}
```

---

## Progress Reporting

### Progress Stages

The worker reports progress at these stages:

| Stage | Progress % | Description |
|-------|-----------|-------------|
| Initialization | 0 | Reading file, allocating buffers |
| ZIP Extraction | 5-40 | Decompressing ZIP entries (fflate) |
| Binary Parsing | 40-70 | Parsing Mach-O/DEX/ARSC files |
| Tree Generation | 70-85 | Building breakdown tree |
| Insight Generation | 85-95 | Analyzing files, generating insights |
| Finalization | 95-100 | Calculating summary, serializing result |

### Progress Callback Example

```javascript
const result = await parser.parseIPA(file, {
  onProgress: Comlink.proxy((progress) => {
    console.log(`Parsing: ${progress}%`);
    appStore.updateParsingStatus({ progress });
  })
});
```

**Note**: Progress callback must be wrapped in `Comlink.proxy()` because it's called from the worker thread.

---

## Performance Characteristics

### Time Complexity

- **ZIP Extraction**: O(n) where n = compressed size (fflate streaming decompression)
- **Binary Parsing**: O(m) where m = number of files (each file parsed once)
- **Tree Generation**: O(m) (single pass to build hierarchy)
- **Insight Generation**: O(m) (rule-based analysis)

### Memory Usage

- **Peak memory**: ~2.5x file size (1x compressed + 1x uncompressed + 0.5x data structures)
- **Streaming**: fflate streams ZIP entries to avoid loading entire file in memory
- **Garbage collection**: Large buffers released after processing

### Timeout Calculation

```javascript
/**
 * Calculate dynamic timeout based on file size
 * @param {number} fileSize - File size in bytes
 * @returns {number} Timeout in milliseconds
 */
function calculateTimeout(fileSize) {
  const BASE_TIMEOUT_MS = 30000; // 30s base
  const MS_PER_MB = 5000; // +5s per MB
  const fileSizeMB = fileSize / (1024 * 1024);
  return BASE_TIMEOUT_MS + (fileSizeMB * MS_PER_MB);
}

// Examples:
// 10MB file → 30s + (10 * 5s) = 80s timeout
// 100MB file → 30s + (100 * 5s) = 530s = 8.8min timeout
// 500MB file → 30s + (500 * 5s) = 2530s = 42min timeout
```

---

## Worker Lifecycle

### Initialization

```javascript
// Main thread (once per app lifecycle)
const worker = new Worker(
  new URL('@/workers/parser.worker.js', import.meta.url),
  { type: 'module' }
);
const parser = Comlink.wrap(worker);
```

### Reuse

The worker is reused for multiple parsing operations. No need to create a new worker per file.

### Termination

```javascript
// When component unmounts or app closes
worker.terminate();
```

**Note**: In the current architecture, the worker is created once in the main App.vue and reused. It's not terminated during normal app lifecycle.

---

## Testing Strategy

### Unit Tests (Vitest)

```javascript
import { describe, it, expect } from 'vitest';
import * as Comlink from 'comlink';

describe('parser.worker', () => {
  let worker;
  let parser;

  beforeEach(() => {
    worker = new Worker(new URL('../workers/parser.worker.js', import.meta.url), { type: 'module' });
    parser = Comlink.wrap(worker);
  });

  afterEach(() => {
    worker.terminate();
  });

  it('parses IPA file successfully', async () => {
    const file = await fetch('/tests/fixtures/sample.ipa').then(r => r.blob());
    const result = await parser.parseIPA(file);

    expect(result.metadata.platform).toBe('iOS');
    expect(result.metadata.bundleId).toMatch(/^[a-z0-9.]+$/i);
    expect(result.breakdownTree.children.length).toBeGreaterThan(0);
  });

  it('throws ValidationError for invalid file', async () => {
    const file = new Blob(['not a valid IPA'], { type: 'application/octet-stream' });
    await expect(parser.parseIPA(file)).rejects.toThrow('ValidationError');
  });

  it('reports progress during parsing', async () => {
    const file = await fetch('/tests/fixtures/large.ipa').then(r => r.blob());
    const progressUpdates = [];

    await parser.parseIPA(file, {
      onProgress: Comlink.proxy((progress) => {
        progressUpdates.push(progress);
      })
    });

    expect(progressUpdates.length).toBeGreaterThan(5); // Multiple updates
    expect(progressUpdates[0]).toBe(0); // Starts at 0
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100); // Ends at 100
  });
});
```

### Integration Tests

```javascript
it('full workflow: upload → parse → display', async () => {
  const { wrapper } = renderApp();
  const file = await loadFixture('sample.ipa');

  // Upload file
  await wrapper.find('input[type="file"]').setValue(file);

  // Wait for parsing
  await waitFor(() => {
    expect(wrapper.find('.breakdown-table').exists()).toBe(true);
  });

  // Verify results displayed
  expect(wrapper.text()).toContain('Payload');
  expect(wrapper.text()).toContain('Frameworks');
});
```

---

## Migration Checklist

- [ ] Convert `parser.worker.ts` to `parser.worker.js`
- [ ] Remove TypeScript type annotations, add JSDoc comments
- [ ] Update import paths (remove `.ts` extensions)
- [ ] Test Comlink communication with Vue components
- [ ] Verify progress callbacks work via `Comlink.proxy()`
- [ ] Test error handling (validation, timeout, parse errors)
- [ ] Measure parsing performance (should match React version ±10%)
- [ ] Update worker tests to use Vue Test Utils (main thread tests)
- [ ] Verify worker terminates cleanly on unmount

---

## Summary

- **Single worker file**: `parser.worker.js` with 4 methods (parseIPA, parseAPK, parseAAB, parseXAPK)
- **Comlink abstraction**: Typed postMessage, promise-based API
- **Framework-agnostic**: No Vue/React code in worker
- **Progress reporting**: 0-100% updates via callback (proxied)
- **Error types**: ValidationError, TimeoutError, ParseError
- **Dynamic timeout**: 30s base + 5s per MB
- **Testing**: Unit tests with fixtures, integration tests with full workflow
