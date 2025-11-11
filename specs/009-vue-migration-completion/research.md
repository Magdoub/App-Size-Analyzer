# Technical Research: Vue 3 + Comlink Web Worker + ECharts Integration

**Feature**: 009-vue-migration-completion
**Research Date**: 2025-11-11
**Status**: Complete

## Overview

This document provides technical research and recommended patterns for integrating Comlink Web Workers with Vue 3 Composition API and ECharts reactivity for the Vue migration completion project.

---

## 1. Comlink Integration with Vue Composition API

### Decision

**Use a custom `useParserWorker` composable that wraps the Comlink Worker proxy with Vue `ref()` for reactive progress state and lifecycle hooks for cleanup.**

### Rationale

1. **Separation of Concerns**: Comlink handles async worker communication, Vue `ref()` handles reactivity on the main thread
2. **Reactivity Constraint**: State must always exist in the main thread - doing off-main-thread state breaks Vue reactivity
3. **Proven Pattern**: LogRocket, VueUse, and community examples all follow this pattern
4. **Clean API**: Worker methods become async functions, progress updates use `Comlink.proxy()` callbacks that update refs
5. **Lifecycle Management**: Vue's `onUnmounted` hook ensures workers terminate cleanly without memory leaks

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| VueUse `useWebWorkerFn` | Simple API, built-in reactivity | Limited to single function calls, no progress tracking | Doesn't support Comlink's multi-method API or complex progress callbacks |
| Direct `postMessage` | No library dependency | Requires manual message handling, error-prone | Comlink provides type safety and cleaner API |
| `watchEffect` for progress | Auto-tracks dependencies | Unnecessary - progress updates are explicit events | `ref()` with callback is simpler and more explicit |

### Code Pattern

```javascript
// composables/useParserWorker.js
import { ref, onUnmounted } from 'vue';
import { wrap } from 'comlink';

/**
 * Composable for parser Web Worker communication
 * @returns {Object} Worker API with reactive state
 */
export function useParserWorker() {
  // Reactive state (main thread only)
  const progress = ref(0);
  const status = ref('idle');
  const error = ref(null);

  // Worker instance (use shallowRef to avoid deep reactivity on worker proxy)
  const worker = new Worker(
    new URL('../workers/parser-worker.js', import.meta.url),
    { type: 'module' }
  );

  // Wrap worker with Comlink
  const workerAPI = wrap(worker);

  // Progress callback (wrapped with Comlink.proxy for transfer)
  const updateProgress = (value, message) => {
    progress.value = value;
    status.value = message;
  };

  /**
   * Parse iOS binary
   * @param {File} file - IPA file
   * @returns {Promise<Object>} Parse result
   */
  const parseIOS = async (file) => {
    try {
      status.value = 'parsing';
      error.value = null;

      // Call worker method (all methods are async with Comlink)
      const result = await workerAPI.parseIOS(file);

      status.value = 'success';
      progress.value = 100;
      return result;
    } catch (err) {
      error.value = err.message;
      status.value = 'error';
      throw err;
    }
  };

  /**
   * Parse Android binary
   * @param {File} file - APK/XAPK file
   * @returns {Promise<Object>} Parse result
   */
  const parseAndroid = async (file) => {
    try {
      status.value = 'parsing';
      error.value = null;

      const result = await workerAPI.parseAndroid(file);

      status.value = 'success';
      progress.value = 100;
      return result;
    } catch (err) {
      error.value = err.message;
      status.value = 'error';
      throw err;
    }
  };

  /**
   * Cancel current operation
   */
  const cancel = async () => {
    await workerAPI.cancel();
    status.value = 'cancelled';
  };

  // Cleanup on component unmount
  onUnmounted(() => {
    if (worker) {
      worker.terminate();
      console.log('[useParserWorker] Worker terminated');
    }
  });

  return {
    // Reactive state
    progress,
    status,
    error,

    // Worker methods
    parseIOS,
    parseAndroid,
    cancel,
  };
}
```

### Usage in Components

```vue
<script setup>
import { useParserWorker } from '@/composables/useParserWorker';
import { useAppStore } from '@/stores/appStore';
import { useAnalysisStore } from '@/stores/analysisStore';

const appStore = useAppStore();
const analysisStore = useAnalysisStore();
const { progress, status, error, parseIOS, parseAndroid } = useParserWorker();

const handleFileUpload = async (file) => {
  appStore.setCurrentFile(file);

  try {
    // Worker automatically runs in background, UI stays responsive
    const result = file.name.endsWith('.ipa')
      ? await parseIOS(file)
      : await parseAndroid(file);

    // Update Pinia stores with results
    analysisStore.setAnalysisData(result.parseResult);
    analysisStore.setFileEntries(result.fileEntries);
  } catch (err) {
    appStore.setParsingError(err.message);
  }
};
</script>

<template>
  <div>
    <p v-if="status === 'parsing'">Parsing: {{ progress }}%</p>
    <p v-if="error">Error: {{ error }}</p>
  </div>
</template>
```

### Key Implementation Notes

1. **All Worker Methods Are Async**: Every method exposed via Comlink returns a Promise - always `await` them
2. **Callbacks Use `Comlink.proxy()`**: If adding progress callbacks, wrap them with `Comlink.proxy()` for proper transfer
3. **No DOM Access in Worker**: Workers can't access DOM - keep all Vue reactivity on main thread
4. **Clean Termination**: Always terminate workers in `onUnmounted` to prevent memory leaks
5. **Error Handling**: Wrap worker calls in try/catch and update reactive state accordingly

---

## 2. ECharts Integration with Vue Reactivity

### Decision

**Use `shallowRef()` for ECharts instance, `watch()` for data updates with `setOption()`, and create chart instance once during `onMounted`.**

### Rationale

1. **Performance**: `shallowRef()` prevents Vue from proxying ECharts' internal state (thousands of nested objects), avoiding massive performance overhead
2. **Official Recommendation**: vue-echarts documentation explicitly recommends `shallowRef` / `markRaw` for chart instances
3. **Explicit Control**: `watch()` provides explicit dependency tracking - we know exactly when to update (when Pinia state changes)
4. **Chart Lifecycle**: Creating instance once and updating with `setOption()` is more efficient than recreating the entire chart
5. **Large Dataset Support**: ECharts incremental rendering + TypedArray + `shallowRef` handles 10,000+ nodes efficiently

### Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| `reactive()` for chart instance | Simpler API | Deep reactivity proxies ECharts internals, massive performance hit | Official docs warn against this - breaks ECharts |
| `watchEffect()` for updates | Auto-tracks dependencies | Less explicit, harder to debug when updates occur | `watch()` gives explicit control over what triggers updates |
| Recreate chart on data change | Simpler logic | Destroys/recreates entire chart, poor UX with flash/flicker | `setOption()` smoothly updates existing chart |
| vue-echarts component | Pre-built integration | Abstracts away control, harder to customize for our needs | We need fine control for 10k+ node performance |

### Code Pattern

```javascript
// Component using ECharts with Vue reactivity
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useUIStore } from '@/stores/uiStore';
import * as echarts from 'echarts';

export default {
  name: 'TreemapChart',
  setup() {
    const analysisStore = useAnalysisStore();
    const uiStore = useUIStore();

    // Chart DOM container reference
    const chartRef = ref(null);

    // Chart instance (shallowRef to prevent deep reactivity)
    const chartInstance = shallowRef(null);

    /**
     * Initialize chart instance (once)
     */
    onMounted(() => {
      if (!chartRef.value) return;

      // Create chart instance
      chartInstance.value = echarts.init(chartRef.value);

      // Set initial options
      updateChart();

      // Handle window resize
      window.addEventListener('resize', handleResize);
    });

    /**
     * Update chart with new data
     */
    const updateChart = () => {
      if (!chartInstance.value) return;

      const options = {
        series: [{
          type: 'treemap',
          data: analysisStore.treemapData,
          // ... other options
        }]
      };

      // Update chart (ECharts handles diffing internally)
      chartInstance.value.setOption(options, {
        // notMerge: false means ECharts merges new options with existing
        // This is more efficient for partial updates
        notMerge: false,
        // replaceMerge: ['series'] replaces series array completely
        // Use this for structural changes like drill-down
        replaceMerge: uiStore.xray.currentPath.length > 0 ? ['series'] : undefined,
      });
    };

    /**
     * Watch for data changes and update chart
     * Use watch() for explicit control over what triggers updates
     */
    watch(
      // Dependencies: track specific store state
      () => [
        analysisStore.treemapData,
        uiStore.xray.currentPath,
        uiStore.xray.selectedCategory,
      ],
      // Callback: update chart when dependencies change
      () => {
        updateChart();
      },
      // Options: deep watch for nested changes
      { deep: true }
    );

    /**
     * Handle window resize
     */
    const handleResize = () => {
      chartInstance.value?.resize();
    };

    /**
     * Cleanup on unmount
     */
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);

      if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
      }
    });

    return {
      chartRef,
    };
  },
};
```

### Template

```vue
<template>
  <div ref="chartRef" class="w-full h-full min-h-[400px]"></div>
</template>
```

### Performance Considerations for Large Datasets (10,000+ nodes)

1. **Use TypedArray for Data**: ECharts v4+ supports TypedArray which uses less memory and has better GC performance
2. **Canvas Renderer**: Use canvas (default) for large datasets - SVG is better for <1000 items but slower for large datasets
3. **Incremental Rendering**: ECharts v4+ has built-in incremental rendering for millions of data points
4. **Progressive Parsing**: If parsing generates data incrementally, update chart in batches with `appendData` instead of replacing entire dataset
5. **Lazy Loading**: For drill-down, only load visible nodes - don't render entire tree upfront

```javascript
// Example: Efficient data structure for large treemaps
const prepareTreemapData = (fileEntries) => {
  // Use TypedArray for large datasets
  const sizes = new Float64Array(fileEntries.length);

  fileEntries.forEach((entry, index) => {
    sizes[index] = entry.size;
  });

  return fileEntries.map((entry, index) => ({
    name: entry.path,
    value: sizes[index], // Reference TypedArray value
    // Only include necessary properties to reduce memory
  }));
};
```

### Update Strategies

| Scenario | `setOption` Options | Explanation |
|----------|-------------------|-------------|
| Initial render | `{ notMerge: false }` | Normal merge |
| Filter change | `{ notMerge: false }` | Merge new filtered data |
| Drill-down (path change) | `{ notMerge: false, replaceMerge: ['series'] }` | Replace series to avoid leftover data |
| Theme change | `{ notMerge: true }` | Complete replacement |
| Resize | Call `chartInstance.resize()` | No setOption needed |

### Key Implementation Notes

1. **Always use `shallowRef()` for chart instance** - prevents Vue from proxying ECharts internals
2. **Create chart once in `onMounted`** - don't recreate on every update
3. **Use `watch()` not `watchEffect()`** - explicit dependencies make debugging easier
4. **Deep watch with caution** - only watch specific nested properties, not entire store
5. **Dispose on unmount** - call `chartInstance.dispose()` to clean up ECharts internals
6. **Handle resize** - add window resize listener and call `chartInstance.resize()`

---

## 3. Integration Architecture

### Component Interaction Flow

```
User uploads file
    ↓
UploadZone.vue
    ↓
useParserWorker() composable
    ↓
parser-worker.js (Comlink exposed API)
    ↓ (postMessage with Comlink)
Main Thread: useParserWorker receives result
    ↓
Update Pinia stores (appStore, analysisStore)
    ↓
watch() detects store changes
    ↓
chartInstance.setOption() updates ECharts
    ↓
UI reflects new data
```

### State Management Pattern

```javascript
// Pinia stores remain the source of truth
// Workers only perform computation, never store state

// CORRECT: Worker computes, main thread stores
const result = await workerAPI.parseIOS(file);
analysisStore.setAnalysisData(result); // Store on main thread

// INCORRECT: Don't try to access Vue state in worker
// Workers have no access to Pinia stores or Vue reactivity
```

### Recommended File Structure

```
src/
├── composables/
│   └── useParserWorker.js      # Comlink wrapper composable
├── workers/
│   └── parser-worker.js        # Comlink exposed API
├── stores/
│   ├── appStore.js             # File upload state
│   ├── analysisStore.js        # Parse results (source of truth)
│   └── uiStore.js              # View state, filters
└── components/
    ├── UploadZone.vue          # Uses useParserWorker
    ├── Treemap.vue             # ECharts with shallowRef + watch
    └── BreakdownTable.vue      # Reactive table from store
```

---

## 4. Testing Considerations

### Unit Testing Composables

```javascript
// tests/composables/useParserWorker.spec.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParserWorker } from '@/composables/useParserWorker';

// Mock Worker and Comlink
vi.mock('comlink', () => ({
  wrap: (worker) => ({
    parseIOS: vi.fn().mockResolvedValue({ success: true }),
    parseAndroid: vi.fn().mockResolvedValue({ success: true }),
    cancel: vi.fn(),
  }),
}));

describe('useParserWorker', () => {
  it('should initialize with idle status', () => {
    const { status, progress } = useParserWorker();
    expect(status.value).toBe('idle');
    expect(progress.value).toBe(0);
  });

  it('should update status when parsing', async () => {
    const { parseIOS, status } = useParserWorker();
    const mockFile = new File([''], 'test.ipa');

    await parseIOS(mockFile);

    expect(status.value).toBe('success');
  });
});
```

### Integration Testing with Pinia

```javascript
// tests/integration/file-upload.spec.js
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '@/stores/appStore';
import { useAnalysisStore } from '@/stores/analysisStore';

describe('File Upload Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should update stores after parsing', async () => {
    const appStore = useAppStore();
    const analysisStore = useAnalysisStore();

    // Simulate file upload and parsing
    const mockFile = new File([''], 'test.ipa');
    appStore.setCurrentFile(mockFile);

    // Mock parse result
    const mockResult = {
      parseResult: { /* ... */ },
      fileEntries: [/* ... */],
    };

    analysisStore.setAnalysisData(mockResult.parseResult);

    expect(analysisStore.fileEntries).toBeDefined();
  });
});
```

---

## 5. Common Pitfalls and Solutions

### Pitfall 1: Using `reactive()` on ECharts Instance

**Problem**: Vue proxies all nested objects, causing massive performance degradation.

**Solution**: Always use `shallowRef()` or `markRaw()` for chart instances.

```javascript
// ❌ WRONG
const chartInstance = reactive(echarts.init(container));

// ✅ CORRECT
const chartInstance = shallowRef(echarts.init(container));
```

### Pitfall 2: Forgetting to Terminate Workers

**Problem**: Workers continue running in background, causing memory leaks.

**Solution**: Always terminate in `onUnmounted`.

```javascript
// ✅ CORRECT
onUnmounted(() => {
  if (worker) {
    worker.terminate();
  }
});
```

### Pitfall 3: Trying to Access Vue State in Worker

**Problem**: Workers run in separate context, no access to Vue or Pinia.

**Solution**: Workers compute, main thread stores. Pass data explicitly.

```javascript
// ❌ WRONG - Worker cannot access Pinia
// worker.js
import { useAnalysisStore } from '@/stores/analysisStore'; // ERROR!

// ✅ CORRECT - Worker only computes, returns data
// worker.js
export const api = {
  async parseIOS(file) {
    const result = await parse(file);
    return result; // Main thread will store this
  }
};
```

### Pitfall 4: Recreating Chart on Every Update

**Problem**: Causes flash/flicker, poor UX, destroys internal state.

**Solution**: Create once, update with `setOption()`.

```javascript
// ❌ WRONG
watch(() => data.value, () => {
  chartInstance.value?.dispose();
  chartInstance.value = echarts.init(container); // Recreates every time
});

// ✅ CORRECT
watch(() => data.value, () => {
  chartInstance.value?.setOption(newOptions); // Updates existing chart
});
```

### Pitfall 5: Deep Watching Entire Store

**Problem**: Triggers on every store change, even unrelated properties.

**Solution**: Watch only specific properties needed.

```javascript
// ❌ WRONG - Triggers on ANY store change
watch(() => analysisStore, () => updateChart(), { deep: true });

// ✅ CORRECT - Only triggers on treemapData change
watch(() => analysisStore.treemapData, () => updateChart());
```

---

## 6. Browser Compatibility Notes

### Web Worker Support

- **Chrome 90+**: Full support including module workers
- **Firefox 88+**: Full support
- **Safari 14+**: Full support
- **Edge 90+**: Full support (Chromium-based)

### Comlink Support

Comlink uses ES6 Proxies and Structured Clone - supported in all target browsers.

### ECharts Performance

- **Canvas Renderer**: Use for large datasets (10,000+ nodes) - best performance
- **SVG Renderer**: Better for small datasets (<1000 nodes) and accessibility
- **Progressive Rendering**: Automatically enabled in ECharts v4+ for large datasets

### Feature Detection

```javascript
// Detect Web Worker support
if (typeof Worker === 'undefined') {
  console.error('Web Workers not supported');
  // Show fallback UI or error message
}

// Detect module worker support
try {
  new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
} catch (e) {
  console.error('Module workers not supported');
}
```

---

## 7. Performance Benchmarks

### Expected Performance Targets

Based on research and project requirements (±10% of React version):

| File Size | Expected Parse Time | Max Acceptable |
|-----------|-------------------|----------------|
| 10MB | 2-3 seconds | 3.5 seconds |
| 50MB | 8-12 seconds | 15 seconds |
| 100MB | 20-30 seconds | 35 seconds |

### Optimization Strategies

1. **Web Worker**: Parsing already runs off main thread - ✅ implemented
2. **Incremental Progress**: Show progress updates every 100ms
3. **TypedArray**: Use for large file lists (10,000+ files)
4. **Lazy Rendering**: Only render visible treemap nodes (drill-down approach)
5. **Virtual Scrolling**: For Breakdown table with thousands of rows (already implemented with `@tanstack/react-virtual` pattern)

---

## 8. Privacy & Security Verification

### Zero Network Requests

```javascript
// Test: Monitor network activity
// Expected: Only initial page load assets, zero during file analysis

// Implementation:
// 1. File reading uses FileReader API (client-side)
// 2. Parsing uses fflate library (client-side)
// 3. No analytics, no telemetry, no external API calls
```

### No Data Persistence

```javascript
// Test: Check browser storage after analysis
// Expected: Zero data in localStorage, sessionStorage, IndexedDB

// Verify:
console.log(Object.keys(localStorage)); // Should be empty
console.log(Object.keys(sessionStorage)); // Should be empty
// Check IndexedDB: Should have no databases created
```

### Memory Cleanup

```javascript
// Test: Analyze multiple files, check memory usage
// Expected: Memory released after each analysis

// Implementation:
onUnmounted(() => {
  worker.terminate(); // Releases worker memory
  chartInstance.dispose(); // Releases ECharts memory
  analysisStore.reset(); // Clears Pinia state
});
```

---

## 9. References

### Official Documentation

- [Vue 3 Composition API - Composables](https://vuejs.org/guide/reusability/composables)
- [Vue 3 Reactivity - shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref)
- [ECharts - Vue Integration](https://echarts.apache.org/handbook/en/how-to/cross-platform/vue/)
- [vue-echarts - Official Component](https://github.com/ecomfe/vue-echarts)
- [Comlink - GitHub](https://github.com/GoogleChromeLabs/comlink)
- [Pinia - State Management](https://pinia.vuejs.org/)

### Community Resources

- [LogRocket: Comlink and Web Workers](https://blog.logrocket.com/comlink-web-workers-match-made-in-heaven/)
- [LogRocket: Vue.js with Web Workers](https://blog.logrocket.com/optimizing-vue-js-apps-web-workers/)
- [DEV: Vue Web Worker Integration](https://dev.to/jcalixte/easy-web-worker-integration-in-vuejs-3ej8)
- [VueUse: useWebWorkerFn](https://vueuse.org/core/usewebworkerfn/)

### Code Examples

- [vue-comlink-worker-example](https://github.com/belvederef/vue-comlink-worker-example) - TypeScript + Comlink + Vue
- [ECharts Performance Guide](https://apache.github.io/echarts-handbook/en/best-practices/canvas-vs-svg/)

---

## 10. Next Steps

### Immediate Actions

1. **Create `useParserWorker` composable** following the pattern above
2. **Integrate composable into `UploadZone.vue`** to handle file uploads
3. **Update ECharts components** to use `shallowRef()` and `watch()`
4. **Test with sample files** to verify parsing and rendering work correctly
5. **Benchmark performance** against React version with identical files

### Success Validation

- ✅ Web Worker terminates cleanly on unmount (check DevTools memory profiler)
- ✅ ECharts updates smoothly without flash/flicker
- ✅ Progress updates display correctly during parsing
- ✅ Zero network requests during file analysis (check DevTools network tab)
- ✅ Performance within ±10% of React version
- ✅ All interactive features work (drill-down, filters, sort)

---

## Conclusion

The recommended architecture uses:

1. **`useParserWorker` composable** - Wraps Comlink with Vue reactivity
2. **`ref()` for reactive state** - Progress, status, errors on main thread
3. **`shallowRef()` for ECharts instance** - Prevents deep reactivity overhead
4. **`watch()` for chart updates** - Explicit control over update triggers
5. **`onUnmounted` for cleanup** - Terminates workers and disposes charts

This approach balances performance, maintainability, and Vue reactivity best practices while maintaining compatibility with existing Pinia stores and component architecture.
