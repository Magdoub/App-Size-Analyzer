# Vite `import.meta.glob` Research: Binary File Discovery

**Date**: 2025-11-17
**Context**: Vue 3.5.24 + Vite 5.4.21 project
**Use Case**: Dynamically discover .ipa and .apk sample files (5-80MB) from `sample-files/` directory at build time

---

## Summary

Vite's `import.meta.glob` can discover binary files at build time using the `{ as: 'url', eager: true }` pattern. This returns an object mapping file paths to URLs. To get File objects with metadata, you must:

1. Use `import.meta.glob` with `as: 'url'` to get URLs
2. Fetch each URL as a blob using `fetch()`
3. Convert blob to File object with extracted metadata (name, size, platform)

**Recommendation**: Use **eager loading** (`eager: true`) for sample file discovery to avoid runtime complexity and ensure all files are available immediately.

---

## 1. Glob Pattern Syntax

### Basic Pattern for .ipa and .apk Files

```javascript
// Option 1: Single pattern with braces (recommended)
const sampleFiles = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url',
  eager: true
});

// Option 2: Array of patterns
const sampleFiles = import.meta.glob([
  '/sample-files/*.ipa',
  '/sample-files/*.apk'
], {
  as: 'url',
  eager: true
});

// Option 3: With negative patterns (exclusions)
const sampleFiles = import.meta.glob([
  '/sample-files/*.{ipa,apk}',
  '!**/README.md'  // Exclude README
], {
  as: 'url',
  eager: true
});
```

### Pattern Reference

| Pattern | Matches | Example |
|---------|---------|---------|
| `*.ipa` | All .ipa files in directory | `A Night Battle HD 1.2.ipa` |
| `*.{ipa,apk}` | All .ipa OR .apk files | Both iOS and Android |
| `**/*.ipa` | Recursive (all subdirectories) | `/sample-files/ios/*.ipa` |
| `!**/README.md` | Exclude files (negative pattern) | Skip documentation |

**Important**: All arguments must be **literal strings**. You cannot use variables or expressions.

```javascript
// ❌ INVALID - Cannot use variables
const ext = 'ipa';
const files = import.meta.glob(`/sample-files/*.${ext}`);

// ✅ VALID - Literal string only
const files = import.meta.glob('/sample-files/*.{ipa,apk}');
```

---

## 2. Accessing File Metadata from Glob Results

### Return Value Structure

With `{ as: 'url', eager: true }`, `import.meta.glob` returns:

```javascript
{
  '/sample-files/A Night Battle HD 1.2.ipa': '/sample-files/A Night Battle HD 1.2.ipa',
  '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa': '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa',
  '/sample-files/com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk': '/sample-files/com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk'
}
```

### Extracting Basic Metadata (No Fetch Required)

```javascript
/**
 * Extract metadata from file path (synchronous)
 * @param {string} filePath - File path from glob keys
 * @param {string} url - URL from glob values
 * @returns {object} File metadata
 */
function extractFileMetadata(filePath, url) {
  const fileName = filePath.split('/').pop();
  const extension = fileName.split('.').pop().toLowerCase();
  const platform = extension === 'ipa' ? 'iOS' : 'Android';

  return {
    path: filePath,
    url,
    name: fileName,
    platform,
    extension,
    // Note: Size is NOT available without fetching
  };
}

// Usage
const sampleFiles = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url',
  eager: true
});

const metadata = Object.entries(sampleFiles).map(([path, url]) =>
  extractFileMetadata(path, url)
);

console.log(metadata);
// [
//   { path: '/sample-files/A Night Battle HD 1.2.ipa', url: '/sample-files/...', name: 'A Night Battle HD 1.2.ipa', platform: 'iOS', extension: 'ipa' },
//   ...
// ]
```

### Getting Full Metadata with File Size (Fetch Required)

```javascript
/**
 * Fetch file metadata including size (asynchronous)
 * @param {string} url - File URL from glob
 * @param {string} fileName - File name for display
 * @returns {Promise<object>} Complete metadata
 */
async function fetchFileMetadata(url, fileName) {
  const response = await fetch(url, { method: 'HEAD' });

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('Content-Length');
  const size = contentLength ? parseInt(contentLength, 10) : null;

  return {
    url,
    name: fileName,
    size,
    sizeFormatted: size ? `${(size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'
  };
}

// Usage
const sampleFiles = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url',
  eager: true
});

const metadataPromises = Object.entries(sampleFiles).map(([path, url]) => {
  const fileName = path.split('/').pop();
  return fetchFileMetadata(url, fileName);
});

const allMetadata = await Promise.all(metadataPromises);
console.log(allMetadata);
// [
//   { url: '...', name: 'A Night Battle HD 1.2.ipa', size: 5348659, sizeFormatted: '5.10 MB' },
//   ...
// ]
```

---

## 3. Eager vs Lazy Loading for 5-80MB Files

### Comparison

| Aspect | Eager Loading | Lazy Loading |
|--------|---------------|--------------|
| **Syntax** | `{ eager: true }` | Default (no option) |
| **Load Time** | Build time | Runtime (on-demand) |
| **Initial Bundle** | Larger (all files bundled) | Smaller (files loaded on click) |
| **Runtime Performance** | Instant access to URLs | Async load per file |
| **Complexity** | Simple (synchronous) | Complex (promises) |
| **Best For** | Small file count, instant discovery | Large file counts, conditional loading |

### Eager Loading (Recommended)

**Why eager for this use case**:
- Only 3 sample files (minimal bundle impact for URLs, not actual binaries)
- URLs are tiny (~50 bytes each), NOT the actual 5-80MB files
- Sample file gallery needs immediate display on page load
- Simplifies code (no async state management for discovery)

**Actual bundle impact**: Negligible. Only the file **URLs** are bundled, not the binaries.

```javascript
// ✅ RECOMMENDED: Eager loading
const sampleFiles = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url',
  eager: true
});

// Result: Synchronous object immediately available
console.log(Object.keys(sampleFiles)); // Array of file paths
```

**Generated code** (example):
```javascript
// Vite transforms this at build time to:
const sampleFiles = {
  '/sample-files/A Night Battle HD 1.2.ipa': '/sample-files/A Night Battle HD 1.2.ipa',
  '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa': '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa',
  '/sample-files/com.grasshopper.dialer_[...].apk': '/sample-files/com.grasshopper.dialer_[...].apk'
};
```

### Lazy Loading (Not Recommended for This Use Case)

**When to use lazy**:
- Hundreds of files where discovery overhead matters
- Files loaded conditionally (user selects category first)
- Files are large JS modules (not just URLs)

```javascript
// ❌ NOT RECOMMENDED: Lazy loading (unnecessary complexity)
const sampleFiles = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url'
  // eager: false is default
});

// Result: Object of functions that return promises
console.log(typeof sampleFiles['/sample-files/A Night Battle HD 1.2.ipa']); // 'function'

// Must call function to get URL
const url = await sampleFiles['/sample-files/A Night Battle HD 1.2.ipa']();
console.log(url); // '/sample-files/A Night Battle HD 1.2.ipa'
```

**Why avoid lazy here**:
- Adds unnecessary async complexity (`await` for every file URL)
- No performance benefit (URLs are tiny, binaries are fetched separately anyway)
- Complicates Vue component reactivity (need `onMounted` + async state)

---

## 4. Converting URLs to File Objects

### Step-by-Step Process

```javascript
/**
 * Load sample file as File object
 * @param {string} url - File URL from import.meta.glob
 * @param {string} fileName - File name for File object
 * @param {AbortSignal} [signal] - Optional abort signal for cancellation
 * @returns {Promise<File>} File object ready for analysis
 */
async function loadSampleFileAsFile(url, fileName, signal = null) {
  try {
    // 1. Fetch file as blob
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 2. Get blob data
    const blob = await response.blob();

    // 3. Convert to File object (same API as drag-and-drop uploads)
    const file = new File([blob], fileName, {
      type: blob.type || 'application/octet-stream',
      lastModified: Date.now()
    });

    return file;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`Sample file load cancelled: ${fileName}`);
    } else {
      console.error(`Failed to load sample file ${fileName}:`, error);
    }
    throw error;
  }
}

// Usage in Vue component
async function handleSampleFileClick(url, fileName) {
  const abortController = new AbortController();

  try {
    const file = await loadSampleFileAsFile(url, fileName, abortController.signal);

    // Now use the File object identically to user-uploaded files
    await analyzeFile(file);
  } catch (error) {
    // Handle error
  }
}
```

### Integration with Existing Upload Handler

```javascript
// In SampleFileGallery.vue
import { useFileStore } from '@/stores/fileStore';

const fileStore = useFileStore();

async function handleSampleFileClick(url, fileName) {
  try {
    // Show loading state
    fileStore.setLoading(true);

    // Load as File object
    const file = await loadSampleFileAsFile(url, fileName);

    // Pass to existing upload handler (same as drag-and-drop)
    emit('file-selected', file);
  } catch (error) {
    fileStore.setError(`Failed to load sample file: ${error.message}`);
  } finally {
    fileStore.setLoading(false);
  }
}
```

---

## 5. Complete Working Example

### Composable: `useSampleFiles.js`

```javascript
import { ref, computed } from 'vue';

/**
 * Composable for sample file discovery and loading
 * @returns {object} Sample file utilities
 */
export function useSampleFiles() {
  // 1. Discover sample files at build time (eager)
  const sampleFileUrls = import.meta.glob('/sample-files/*.{ipa,apk}', {
    as: 'url',
    eager: true
  });

  // 2. Extract metadata from paths
  const sampleFiles = computed(() => {
    return Object.entries(sampleFileUrls).map(([path, url]) => {
      const fileName = path.split('/').pop();
      const extension = fileName.split('.').pop().toLowerCase();
      const platform = extension === 'ipa' ? 'iOS' : 'Android';

      return {
        id: path,
        url,
        name: fileName,
        platform,
        extension,
        // Size will be fetched on-demand or displayed as "Unknown"
      };
    });
  });

  // 3. Load file as File object
  const loadingFile = ref(null);
  const loadError = ref(null);

  async function loadSampleFile(url, fileName, signal = null) {
    loadingFile.value = fileName;
    loadError.value = null;

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], fileName, {
        type: blob.type || 'application/octet-stream',
        lastModified: Date.now()
      });

      loadingFile.value = null;
      return file;
    } catch (error) {
      loadingFile.value = null;
      if (error.name !== 'AbortError') {
        loadError.value = error.message;
      }
      throw error;
    }
  }

  return {
    sampleFiles,
    loadSampleFile,
    loadingFile,
    loadError
  };
}
```

### Component: `SampleFileGallery.vue`

```vue
<template>
  <div class="sample-file-gallery">
    <h2>Try a Sample App</h2>
    <div class="file-grid">
      <button
        v-for="file in sampleFiles"
        :key="file.id"
        class="file-card"
        :disabled="loadingFile === file.name"
        @click="handleFileClick(file)"
      >
        <div class="platform-badge" :class="file.platform.toLowerCase()">
          {{ file.platform }}
        </div>
        <div class="file-name">{{ file.name }}</div>
        <div v-if="loadingFile === file.name" class="loading">
          Loading...
        </div>
      </button>
    </div>
    <div v-if="loadError" class="error">
      {{ loadError }}
    </div>
  </div>
</template>

<script setup>
import { useSampleFiles } from '@/composables/useSampleFiles';

const emit = defineEmits(['file-selected']);

const { sampleFiles, loadSampleFile, loadingFile, loadError } = useSampleFiles();

async function handleFileClick(fileInfo) {
  try {
    const file = await loadSampleFile(fileInfo.url, fileInfo.name);
    emit('file-selected', file);
  } catch (error) {
    console.error('Failed to load sample file:', error);
  }
}
</script>

<style scoped>
.sample-file-gallery {
  padding: 2rem;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.file-card {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.file-card:hover:not(:disabled) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.file-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.platform-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.platform-badge.ios {
  background: #007aff;
  color: white;
}

.platform-badge.android {
  background: #3ddc84;
  color: white;
}

.file-name {
  font-size: 0.875rem;
  word-break: break-word;
}

.loading {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
}
</style>
```

---

## 6. Best Practices

### ✅ DO

1. **Use eager loading** for small file counts (<10 files)
   ```javascript
   const files = import.meta.glob('/sample-files/*.{ipa,apk}', { as: 'url', eager: true });
   ```

2. **Fetch as blob, convert to File** for consistent API
   ```javascript
   const blob = await response.blob();
   const file = new File([blob], fileName, { type: blob.type });
   ```

3. **Use AbortController** for cancellable fetches
   ```javascript
   const controller = new AbortController();
   fetch(url, { signal: controller.signal });
   // Later: controller.abort();
   ```

4. **Extract metadata from paths** (synchronous, no fetch)
   ```javascript
   const fileName = path.split('/').pop();
   const platform = fileName.endsWith('.ipa') ? 'iOS' : 'Android';
   ```

5. **Handle fetch errors gracefully**
   ```javascript
   try {
     const blob = await response.blob();
   } catch (error) {
     if (error.name === 'AbortError') {
       console.log('Cancelled');
     } else {
       console.error('Failed:', error);
     }
   }
   ```

### ❌ DON'T

1. **Don't use lazy loading** for URLs only (no benefit)
   ```javascript
   // ❌ Adds async complexity for no gain
   const files = import.meta.glob('/sample-files/*.ipa', { as: 'url' });
   ```

2. **Don't try to get file size** from URLs without fetching
   ```javascript
   // ❌ Size is NOT in the URL or glob metadata
   const size = sampleFiles[path].size; // undefined!
   ```

3. **Don't use variables** in glob patterns
   ```javascript
   // ❌ WILL NOT WORK - Must be literal string
   const pattern = '*.ipa';
   const files = import.meta.glob(`/sample-files/${pattern}`);
   ```

4. **Don't bundle binary files** as raw/base64
   ```javascript
   // ❌ Will embed 80MB as base64 in bundle!
   const files = import.meta.glob('/sample-files/*.apk', { as: 'raw', eager: true });
   ```

5. **Don't use `?raw` for binary files** (corrupts data)
   ```javascript
   // ❌ Converts binary to string, adds replacement characters (�)
   const files = import.meta.glob('/sample-files/*.ipa?raw');
   ```

---

## 7. Performance Considerations

### Bundle Size Impact

- **Eager URLs**: ~150 bytes total (3 files × ~50 bytes per URL)
- **Lazy URLs**: ~200 bytes total (function wrappers)
- **Binary files**: **NOT bundled** (fetched separately at runtime)

**Verdict**: Use eager loading. Bundle impact is negligible.

### Runtime Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Discover files (eager) | 0ms | Build-time resolution |
| Extract metadata | <1ms | Simple string operations |
| Fetch 5MB file | ~500ms | Network-dependent |
| Fetch 80MB file | ~2-5s | Network-dependent |

**Optimization**: Show loading spinner during fetch, allow cancellation.

### Memory Considerations

- **File objects**: Held in memory after fetch (5-80MB each)
- **Recommendation**: Load only one sample file at a time
- **Cancellation**: Use AbortController to cancel in-progress fetches if user uploads a file

---

## 8. Testing Strategy

### Unit Tests (Vitest)

```javascript
// tests/unit/composables/useSampleFiles.test.js
import { describe, it, expect, vi } from 'vitest';
import { useSampleFiles } from '@/composables/useSampleFiles';

describe('useSampleFiles', () => {
  it('should discover sample files', () => {
    const { sampleFiles } = useSampleFiles();

    expect(sampleFiles.value).toHaveLength(3);
    expect(sampleFiles.value[0]).toHaveProperty('name');
    expect(sampleFiles.value[0]).toHaveProperty('platform');
    expect(sampleFiles.value[0]).toHaveProperty('url');
  });

  it('should detect platform from extension', () => {
    const { sampleFiles } = useSampleFiles();

    const ipaFile = sampleFiles.value.find(f => f.extension === 'ipa');
    const apkFile = sampleFiles.value.find(f => f.extension === 'apk');

    expect(ipaFile.platform).toBe('iOS');
    expect(apkFile.platform).toBe('Android');
  });

  it('should load file as File object', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['test'], { type: 'application/zip' })
    });

    const { loadSampleFile } = useSampleFiles();
    const file = await loadSampleFile('/sample-files/test.ipa', 'test.ipa');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.ipa');
  });
});
```

---

## 9. Troubleshooting

### Issue: "Cannot find module '/sample-files/*.ipa'"

**Cause**: Vite cannot resolve glob pattern.

**Solution**: Ensure pattern starts with `/` (absolute from project root) or `./` (relative to current file).

```javascript
// ✅ CORRECT
const files = import.meta.glob('/sample-files/*.ipa', { as: 'url', eager: true });

// ❌ WRONG
const files = import.meta.glob('sample-files/*.ipa', { as: 'url', eager: true });
```

### Issue: "Fetch failed: 404 Not Found"

**Cause**: URL not matching actual file location.

**Solution**: Check Vite public directory configuration. Sample files should be in `public/sample-files/` or served as static assets.

### Issue: "File object has size 0"

**Cause**: Blob not fully downloaded before conversion.

**Solution**: Ensure `await response.blob()` completes before creating File.

```javascript
// ✅ CORRECT
const blob = await response.blob();
const file = new File([blob], fileName);

// ❌ WRONG
const file = new File([response.blob()], fileName); // Promise, not Blob!
```

### Issue: Binary data corrupted (replacement characters)

**Cause**: Using `as: 'raw'` for binary files.

**Solution**: Use `as: 'url'` and fetch as blob.

```javascript
// ✅ CORRECT
const urls = import.meta.glob('/sample-files/*.apk', { as: 'url', eager: true });
const blob = await fetch(urls[path]).then(r => r.blob());

// ❌ WRONG
const raw = import.meta.glob('/sample-files/*.apk', { as: 'raw' }); // Corrupts binary!
```

---

## 10. References

- [Vite Features: Glob Import](https://vite.dev/guide/features#glob-import)
- [MDN: File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [tinyglobby (Vite's glob matcher)](https://github.com/SuperchupuDev/tinyglobby)

---

## Appendix: Generated Code Examples

### What Vite Generates (Eager)

**Input**:
```javascript
const files = import.meta.glob('/sample-files/*.ipa', { as: 'url', eager: true });
```

**Output** (simplified):
```javascript
const files = {
  '/sample-files/A Night Battle HD 1.2.ipa': '/sample-files/A Night Battle HD 1.2.ipa',
  '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa': '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa'
};
```

### What Vite Generates (Lazy)

**Input**:
```javascript
const files = import.meta.glob('/sample-files/*.ipa', { as: 'url' });
```

**Output** (simplified):
```javascript
const files = {
  '/sample-files/A Night Battle HD 1.2.ipa': () => import('/sample-files/A Night Battle HD 1.2.ipa?url'),
  '/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa': () => import('/sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa?url')
};
```

---

**End of Research Document**
