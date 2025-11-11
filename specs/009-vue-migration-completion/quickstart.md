# Quickstart Guide: Vue Migration Integration

**Feature**: 009-vue-migration-completion
**Date**: 2025-11-11
**Audience**: Developers working on the Vue migration or adding new features

## Overview

This guide provides practical examples for common development tasks in the Vue migration project. Use this as a reference when adding new features, fixing bugs, or understanding the codebase architecture.

---

## Table of Contents

1. [Adding a New Interactive Feature](#adding-a-new-interactive-feature)
2. [Wiring Component Events to Pinia Actions](#wiring-component-events-to-pinia-actions)
3. [Testing Vue Components with Mocked Web Workers](#testing-vue-components-with-mocked-web-workers)
4. [Benchmarking Performance Changes](#benchmarking-performance-changes)
5. [Debugging Tips](#debugging-tips)
6. [Common Patterns](#common-patterns)

---

## Adding a New Interactive Feature

### Example: Adding a File Type Filter to X-Ray View

**Goal**: Add a dropdown filter to show only specific file types (images, code, data) in the treemap.

**Step 1: Add State to uiStore**

```javascript
// src/stores/uiStore.js

export const useUIStore = defineStore('ui', {
  state: () => ({
    // ... existing state ...
    xray: {
      currentPath: ['/'],
      selectedCategories: [], // ← EXISTING
      selectedFileTypes: [], // ← ADD THIS
    },
  }),

  getters: {
    // Add getter for file type filter
    hasFileTypeFilter: (state) => state.xray.selectedFileTypes.length > 0,
  },

  actions: {
    // Add action to update file types
    setFileTypeFilter(fileTypes) {
      this.xray.selectedFileTypes = fileTypes;
    },

    clearFileTypeFilter() {
      this.xray.selectedFileTypes = [];
    },
  },
});
```

**Step 2: Create Filter Component**

```vue
<!-- src/components/xray/FileTypeFilter.vue -->
<script setup>
import { ref, computed } from 'vue';
import { useUIStore } from '@/stores/uiStore';

const uiStore = useUIStore();

const fileTypes = [
  { value: 'image', label: 'Images', icon: '🖼️' },
  { value: 'code', label: 'Code', icon: '📄' },
  { value: 'data', label: 'Data', icon: '💾' },
  { value: 'font', label: 'Fonts', icon: '🔤' },
];

const selectedTypes = computed({
  get: () => uiStore.xray.selectedFileTypes,
  set: (value) => uiStore.setFileTypeFilter(value),
});

function handleClear() {
  uiStore.clearFileTypeFilter();
}
</script>

<template>
  <div class="file-type-filter">
    <label>Filter by Type:</label>
    <div class="filter-options">
      <label v-for="type in fileTypes" :key="type.value" class="checkbox">
        <input
          type="checkbox"
          :value="type.value"
          v-model="selectedTypes"
        />
        <span>{{ type.icon }} {{ type.label }}</span>
      </label>
    </div>
    <button v-if="selectedTypes.length > 0" @click="handleClear" class="clear-btn">
      Clear Filters
    </button>
  </div>
</template>
```

**Step 3: Integrate Filter into XRayView**

```vue
<!-- src/components/xray/XRayView.vue -->
<script setup>
import { computed } from 'vue';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useUIStore } from '@/stores/uiStore';
import Treemap from './Treemap.vue';
import FileTypeFilter from './FileTypeFilter.vue'; // ← ADD IMPORT
import CategoryFilter from './CategoryFilter.vue';
import Breadcrumb from '../shared/Breadcrumb.vue';

const analysisStore = useAnalysisStore();
const uiStore = useUIStore();

// Add file type filtering to computed property
const filteredTreemapData = computed(() => {
  let data = analysisStore.treemapData;

  // Filter by current path
  const path = uiStore.xray.currentPath;
  data = filterByPath(data, path);

  // Filter by categories (existing)
  if (uiStore.xray.selectedCategories.length > 0) {
    data = filterByCategories(data, uiStore.xray.selectedCategories);
  }

  // Filter by file types (NEW)
  if (uiStore.xray.selectedFileTypes.length > 0) {
    data = filterByFileTypes(data, uiStore.xray.selectedFileTypes);
  }

  return data;
});

// Helper function to filter by file types
function filterByFileTypes(node, types) {
  if (!node) return null;

  // If node is a file, check if its type matches
  if (node.type === 'file') {
    const fileType = detectFileType(node.name); // e.g., 'image', 'code', 'data'
    return types.includes(fileType) ? node : null;
  }

  // If directory, recursively filter children
  if (node.children) {
    const filteredChildren = node.children
      .map((child) => filterByFileTypes(child, types))
      .filter(Boolean); // Remove null entries

    if (filteredChildren.length === 0) return null;

    return {
      ...node,
      children: filteredChildren,
    };
  }

  return node;
}

function detectFileType(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) return 'image';
  if (['.js', '.ts', '.swift', '.m', '.h', '.java', '.kt'].includes(ext)) return 'code';
  if (['.json', '.xml', '.plist', '.db'].includes(ext)) return 'data';
  if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) return 'font';
  return 'other';
}
</script>

<template>
  <div class="xray-view">
    <Breadcrumb :path="uiStore.xray.currentPath" @navigate="handleNavigate" />

    <div class="filters">
      <CategoryFilter />
      <FileTypeFilter /> <!-- ← ADD COMPONENT -->
    </div>

    <Treemap
      :data="filteredTreemapData"
      @node-click="handleNodeClick"
    />
  </div>
</template>
```

**Step 4: Test the Feature**

```javascript
// src/__tests__/components/xray/FileTypeFilter.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import FileTypeFilter from '@/components/xray/FileTypeFilter.vue';
import { useUIStore } from '@/stores/uiStore';

describe('FileTypeFilter', () => {
  let wrapper;
  let uiStore;

  beforeEach(() => {
    wrapper = mount(FileTypeFilter, {
      global: {
        plugins: [createTestingPinia()],
      },
    });
    uiStore = useUIStore();
  });

  it('should render file type options', () => {
    expect(wrapper.text()).toContain('Images');
    expect(wrapper.text()).toContain('Code');
    expect(wrapper.text()).toContain('Data');
  });

  it('should update store when checkbox clicked', async () => {
    const checkbox = wrapper.find('input[value="image"]');
    await checkbox.setValue(true);

    expect(uiStore.setFileTypeFilter).toHaveBeenCalledWith(['image']);
  });

  it('should clear filters when clear button clicked', async () => {
    uiStore.xray.selectedFileTypes = ['image', 'code'];
    await wrapper.vm.$nextTick();

    const clearBtn = wrapper.find('.clear-btn');
    await clearBtn.trigger('click');

    expect(uiStore.clearFileTypeFilter).toHaveBeenCalled();
  });
});
```

---

## Wiring Component Events to Pinia Actions

### Example: Treemap Node Click → Update Navigation State

**Pattern**: Component emits event → Parent handles event → Parent updates Pinia store → Components react to store changes

**Child Component (Treemap.vue)**:

```vue
<script setup>
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['node-click']);

const chartRef = ref(null);
const chartInstance = shallowRef(null); // Use shallowRef for ECharts instance

onMounted(() => {
  // Initialize ECharts
  chartInstance.value = echarts.init(chartRef.value);

  // Listen for treemap node clicks
  chartInstance.value.on('click', (params) => {
    if (params.data) {
      // Emit event with node path
      emit('node-click', params.data.path);
    }
  });

  // Initial render
  updateChart();
});

watch(() => props.data, () => {
  updateChart();
});

function updateChart() {
  if (!chartInstance.value) return;

  const option = {
    series: [{
      type: 'treemap',
      data: [props.data],
      // ... other treemap options
    }]
  };

  chartInstance.value.setOption(option);
}

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
});
</script>

<template>
  <div ref="chartRef" class="treemap-container"></div>
</template>
```

**Parent Component (XRayView.vue)**:

```vue
<script setup>
import { computed } from 'vue';
import { useUIStore } from '@/stores/uiStore';
import Treemap from './Treemap.vue';

const uiStore = useUIStore();

function handleNodeClick(path) {
  // Parse path into segments
  const segments = path.split('/').filter(Boolean);
  const fullPath = ['/', ...segments];

  // Update store (triggers reactivity)
  uiStore.setXRayPath(fullPath);
}

// Computed property reacts to store changes
const currentTreemapData = computed(() => {
  const path = uiStore.xray.currentPath;
  return filterTreemapByPath(analysisStore.treemapData, path);
});
</script>

<template>
  <div class="xray-view">
    <!-- Treemap emits event → handler updates store → data reacts -->
    <Treemap
      :data="currentTreemapData"
      @node-click="handleNodeClick"
    />
  </div>
</template>
```

**Pinia Store (uiStore.js)**:

```javascript
export const useUIStore = defineStore('ui', {
  state: () => ({
    xray: {
      currentPath: ['/'], // ['/', 'Payload', 'MyApp.app']
    },
  }),

  actions: {
    setXRayPath(path) {
      // Validate path
      if (!Array.isArray(path) || path.length === 0) {
        console.error('Invalid path:', path);
        return;
      }

      // Update state (triggers reactivity)
      this.xray.currentPath = path;
    },

    navigateUp() {
      // Go up one level
      if (this.xray.currentPath.length > 1) {
        this.xray.currentPath = this.xray.currentPath.slice(0, -1);
      }
    },

    navigateToRoot() {
      this.xray.currentPath = ['/'];
    },
  },
});
```

---

## Testing Vue Components with Mocked Web Workers

### Example: Testing UploadZone with Mocked Parser Worker

**Test File**:

```javascript
// src/__tests__/components/upload/UploadZone.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import UploadZone from '@/components/upload/UploadZone.vue';
import { useAppStore } from '@/stores/appStore';

// Mock the composable
vi.mock('@/composables/useParserWorker', () => ({
  useParserWorker: () => ({
    progress: { value: 0 },
    status: { value: 'idle' },
    state: { value: 'idle' },
    error: { value: null },
    isParsing: { value: false },
    isComplete: { value: false },
    parseFile: vi.fn().mockResolvedValue({
      metadata: { platform: 'iOS', bundleId: 'com.test.app' },
      breakdownRoot: { name: 'root', children: [] },
      treemapData: { id: 'root', children: [] },
      summary: { totalSize: 1000 }
    }),
    cancel: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('UploadZone', () => {
  let wrapper;
  let appStore;

  beforeEach(() => {
    wrapper = mount(UploadZone, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });
    appStore = useAppStore();
  });

  it('should render upload area', () => {
    expect(wrapper.find('.upload-zone').exists()).toBe(true);
    expect(wrapper.text()).toContain('Drop file here');
  });

  it('should handle file drop', async () => {
    const file = new File(['content'], 'test.ipa', { type: 'application/octet-stream' });
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [file] },
    };

    await wrapper.find('.upload-zone').trigger('drop', dropEvent);
    await flushPromises();

    expect(appStore.setCurrentFile).toHaveBeenCalledWith(file);
  });

  it('should reject invalid file type', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [file] },
    };

    await wrapper.find('.upload-zone').trigger('drop', dropEvent);
    await flushPromises();

    expect(wrapper.text()).toContain('Unsupported file type');
  });
});
```

### Testing with Real Worker (Advanced)

```javascript
import { describe, it, expect } from 'vitest';
import '@vitest/web-worker'; // Enable worker support in Vitest

describe('Parser Worker Integration', () => {
  it('should parse real IPA file', async () => {
    // Create worker (runs in simulated environment)
    const worker = new Worker(
      new URL('../../../workers/parser-worker.js', import.meta.url)
    );

    const { wrap } = await import('comlink');
    const api = wrap(worker);

    // Use test fixture
    const response = await fetch('/fixtures/sample.ipa');
    const blob = await response.blob();
    const file = new File([blob], 'sample.ipa', { type: 'application/octet-stream' });

    // Parse file
    const result = await api.parseIOS(file);

    expect(result.parseResult.metadata.platform).toBe('iOS');
    expect(result.fileEntries.length).toBeGreaterThan(0);

    worker.terminate();
  });
});
```

---

## Benchmarking Performance Changes

### Example: Comparing Parse Times Before/After Optimization

**Benchmark Script**:

```javascript
// scripts/benchmark-parser.js
import { parseIPA } from './src/lib/parsers/ios/ipa-parser.js';
import fs from 'fs';

async function benchmark(filePath, iterations = 5) {
  const file = fs.readFileSync(filePath);
  const blob = new Blob([file]);
  const fileObj = new File([blob], 'test.ipa');

  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await parseIPA(fileObj);
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`File: ${filePath}`);
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`Min: ${min.toFixed(2)}ms`);
  console.log(`Max: ${max.toFixed(2)}ms`);
  console.log(`Iterations: ${iterations}`);

  return { avg, min, max };
}

// Run benchmarks
const files = [
  './sample-files/small.ipa',   // ~5MB
  './sample-files/medium.ipa',  // ~50MB
  './sample-files/large.ipa',   // ~100MB
];

for (const file of files) {
  await benchmark(file);
  console.log('---');
}
```

**Run Benchmark**:

```bash
node scripts/benchmark-parser.js
```

**Expected Output**:

```
File: ./sample-files/small.ipa
Average: 1850.32ms
Min: 1780.12ms
Max: 1920.45ms
Iterations: 5
---
File: ./sample-files/medium.ipa
Average: 9230.45ms
Min: 9100.23ms
Max: 9380.67ms
Iterations: 5
---
```

### Comparing Versions

```bash
# Benchmark baseline (React version)
git checkout main
npm run benchmark > baseline.txt

# Benchmark Vue version
git checkout 009-vue-migration-completion
npm run benchmark > vue-version.txt

# Compare
diff baseline.txt vue-version.txt
```

### In-Browser Performance Testing

```javascript
// In browser console or test
async function testParsePerformance(file) {
  const start = performance.now();

  // Measure parsing
  const result = await parseFile(file);

  const parseTime = performance.now() - start;

  // Measure memory (approximate)
  if (performance.memory) {
    console.log('Heap used:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
  }

  console.log('Parse time:', parseTime.toFixed(2), 'ms');
  console.log('File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('Parse speed:', ((file.size / 1024 / 1024) / (parseTime / 1000)).toFixed(2), 'MB/s');

  return { parseTime, fileSize: file.size };
}
```

---

## Debugging Tips

### 1. Debugging Web Workers

Workers run in separate threads, so `console.log` works but breakpoints require special setup.

**In Worker Code**:

```javascript
// parser-worker.js
console.log('[Worker] Starting iOS parse:', file.name);
console.log('[Worker] File size:', file.size);

try {
  const result = await parseIPA(file);
  console.log('[Worker] Parse successful:', result.metadata);
  return result;
} catch (error) {
  console.error('[Worker] Parse failed:', error);
  throw error;
}
```

**Chrome DevTools**:
1. Open DevTools → Sources tab
2. Look for "Workers" section in sidebar
3. Click worker script to set breakpoints
4. Refresh page to hit breakpoints

### 2. Debugging Pinia Store State

**Vue DevTools**:
1. Install Vue DevTools extension
2. Open DevTools → Vue tab
3. View Pinia stores in "Pinia" section
4. Inspect state, mutations, actions in real-time

**Programmatic Debugging**:

```javascript
// In component
import { useAnalysisStore } from '@/stores/analysisStore';

const store = useAnalysisStore();

// Watch store changes
watch(() => store.metadata, (newVal, oldVal) => {
  console.log('Metadata changed:', { newVal, oldVal });
}, { deep: true });

// Subscribe to all mutations
store.$subscribe((mutation, state) => {
  console.log('Store mutation:', mutation.type);
  console.log('New state:', state);
});
```

### 3. Debugging Reactivity Issues

**Check if value is reactive**:

```javascript
import { isRef, isReactive } from 'vue';

console.log('Is ref:', isRef(progress)); // Should be true
console.log('Is reactive:', isReactive(store)); // Should be true
```

**Force update (last resort)**:

```javascript
import { nextTick } from 'vue';

// After state change
store.updateData(newData);
await nextTick(); // Wait for DOM update
console.log('DOM updated');
```

### 4. Debugging ECharts Issues

**Check chart instance**:

```javascript
onMounted(() => {
  console.log('Chart container:', chartRef.value);
  console.log('Chart instance:', chartInstance.value);

  if (!chartInstance.value) {
    console.error('Chart failed to initialize!');
  }
});
```

**Log chart data**:

```javascript
watch(() => props.data, (newData) => {
  console.log('Treemap data updated:', newData);
  console.log('Node count:', countNodes(newData));
});

function countNodes(node) {
  if (!node) return 0;
  if (!node.children) return 1;
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
```

---

## Common Patterns

### Pattern 1: Computed Property for Filtered Data

```javascript
const filteredData = computed(() => {
  let data = store.rawData;

  // Apply filters sequentially
  if (filter1.value) {
    data = applyFilter1(data, filter1.value);
  }

  if (filter2.value) {
    data = applyFilter2(data, filter2.value);
  }

  return data;
});
```

### Pattern 2: Debounced Input

```javascript
import { useDebounceFn } from '@vueuse/core';

const searchQuery = ref('');
const debouncedSearch = useDebounceFn((query) => {
  store.setSearchQuery(query);
}, 300);

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery);
});
```

### Pattern 3: Loading State Management

```javascript
const isLoading = ref(false);
const error = ref(null);

async function loadData() {
  isLoading.value = true;
  error.value = null;

  try {
    const data = await fetchData();
    store.setData(data);
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}
```

### Pattern 4: Conditional Rendering with Loading/Error States

```vue
<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <spinner />
      <p>Loading...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="retry">Retry</button>
    </div>

    <!-- Success state -->
    <div v-else-if="data" class="content">
      <DataDisplay :data="data" />
    </div>

    <!-- Empty state -->
    <div v-else class="empty">
      <p>No data available</p>
    </div>
  </div>
</template>
```

---

## Additional Resources

- **Vue 3 Docs**: https://vuejs.org/guide/introduction.html
- **Pinia Docs**: https://pinia.vuejs.org/
- **ECharts Docs**: https://echarts.apache.org/en/index.html
- **Vitest Docs**: https://vitest.dev/
- **Comlink Docs**: https://github.com/GoogleChromeLabs/comlink

---

## Getting Help

If you encounter issues:

1. Check this quickstart guide
2. Review `research.md` for technical decisions
3. Review `data-model.md` for state flow
4. Check contract files in `contracts/` for API definitions
5. Look at existing components for patterns
6. Ask in team chat or create an issue

---

**Last Updated**: 2025-11-11
