# Quickstart Guide: Vue.js Migration

**Feature**: Vue.js Migration | **Date**: 2025-11-10

## Overview

This guide provides integration scenarios, code examples, and common patterns for developers working with the Vue.js migrated codebase. It covers component usage, state management, Web Worker integration, and testing patterns.

---

## Setup and Installation

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+ or Yarn 1.22+
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Install Dependencies

```bash
# Remove React dependencies
npm uninstall react react-dom zustand @types/react @types/react-dom @tanstack/react-virtual @vitejs/plugin-react @testing-library/react typescript

# Install Vue dependencies
npm install vue@^3.5.0 pinia@^2.3.0
npm install -D @vitejs/plugin-vue @vue/test-utils@^2.4.0 eslint-plugin-vue@^9.30.0

# Keep existing dependencies (framework-agnostic)
# @nivo/treemap, fflate, app-info-parser, color2k, comlink, @tanstack/virtual-core, tailwindcss, vitest
```

### Update vite.config.js

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  worker: {
    format: 'es' // Enable ES module workers
  },
  build: {
    target: 'es2020', // Modern browsers only
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'nivo': ['@nivo/treemap'],
          'utils': ['fflate', 'app-info-parser']
        }
      }
    }
  }
});
```

### Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext js,vue --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext js,vue --fix",
    "format": "prettier --write \"src/**/*.{js,vue,css}\""
  }
}
```

---

## Project Structure

```
src/
├── components/           # Vue SFCs
│   ├── upload/
│   ├── breakdown/
│   ├── xray/
│   ├── insights/
│   └── shared/
├── stores/              # Pinia stores
│   ├── appStore.js
│   ├── analysisStore.js
│   └── uiStore.js
├── lib/                 # Framework-agnostic libraries
│   ├── parsers/
│   ├── analysis/
│   └── utils/
├── workers/             # Web Workers
│   └── parser.worker.js
├── types/               # JSDoc type definitions
├── utils/               # Vue-specific utilities
├── App.vue              # Root component
├── main.js              # Entry point
└── index.css            # Tailwind styles
```

---

## Common Integration Patterns

### 1. Creating a New Vue Component

```vue
<!-- src/components/example/ExampleComponent.vue -->
<template>
  <div class="example-container">
    <h2>{{ title }}</h2>
    <button @click="handleClick">{{ buttonText }}</button>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useAppStore } from '@/stores/appStore';

export default {
  name: 'ExampleComponent',

  props: {
    title: {
      type: String,
      required: true
    },
    initialCount: {
      type: Number,
      default: 0,
      validator: (val) => val >= 0
    }
  },

  emits: ['click', 'count-change'],

  setup(props, { emit }) {
    // Local state
    const count = ref(props.initialCount);

    // Store access
    const appStore = useAppStore();

    // Computed properties
    const buttonText = computed(() => `Clicked ${count.value} times`);

    // Methods
    const handleClick = () => {
      count.value++;
      emit('click', { count: count.value });
      emit('count-change', count.value);
    };

    return {
      count,
      buttonText,
      handleClick
    };
  }
};
</script>

<style scoped>
.example-container {
  @apply p-4 bg-white rounded-lg shadow;
}
</style>
```

**Key Patterns**:
- Use Composition API (`setup` function)
- PropTypes for validation (dev mode)
- Explicit `emits` declaration
- Scoped styles with Tailwind utilities
- JSDoc comments for complex logic

---

### 2. Using Pinia Stores

#### Creating a Store

```javascript
// src/stores/exampleStore.js
import { defineStore } from 'pinia';

export const useExampleStore = defineStore('example', {
  // State
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),

  // Getters (computed)
  getters: {
    itemCount: (state) => state.items.length,
    hasError: (state) => state.error !== null,
    sortedItems: (state) => [...state.items].sort((a, b) => a.name.localeCompare(b.name))
  },

  // Actions (methods)
  actions: {
    addItem(item) {
      this.items.push(item);
    },

    removeItem(id) {
      const index = this.items.findIndex(item => item.id === id);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    },

    async fetchItems() {
      this.loading = true;
      this.error = null;
      try {
        // Async operation (e.g., worker call)
        const items = await someAsyncFunction();
        this.items = items;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    }
  }
});
```

#### Using Store in Component

```vue
<script>
import { storeToRefs } from 'pinia';
import { useExampleStore } from '@/stores/exampleStore';

export default {
  setup() {
    const exampleStore = useExampleStore();

    // Reactive state (use storeToRefs for reactivity)
    const { items, loading, error, itemCount } = storeToRefs(exampleStore);

    // Actions (direct access, no storeToRefs needed)
    const { addItem, removeItem, fetchItems } = exampleStore;

    // Call action on mount
    onMounted(() => {
      fetchItems();
    });

    return {
      items,
      loading,
      error,
      itemCount,
      addItem,
      removeItem
    };
  }
};
</script>
```

**Important**: Use `storeToRefs()` to preserve reactivity when destructuring state/getters. Actions don't need wrapping.

---

### 3. Integrating with Web Workers

#### Creating Worker Instance

```javascript
// src/composables/useParserWorker.js
import * as Comlink from 'comlink';
import { ref } from 'vue';

export function useParserWorker() {
  const worker = new Worker(
    new URL('@/workers/parser.worker.js', import.meta.url),
    { type: 'module' }
  );
  const parser = Comlink.wrap(worker);
  const progress = ref(0);

  const parseFile = async (file) => {
    progress.value = 0;

    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const timeout = calculateTimeout(file.size);

    let result;
    if (ext === '.ipa') {
      result = await parser.parseIPA(file, {
        timeout,
        onProgress: Comlink.proxy((p) => {
          progress.value = p;
        })
      });
    } else if (ext === '.apk') {
      result = await parser.parseAPK(file, {
        timeout,
        onProgress: Comlink.proxy((p) => {
          progress.value = p;
        })
      });
    }
    // ... other formats

    return result;
  };

  const calculateTimeout = (size) => {
    return 30000 + (size / (1024 * 1024)) * 5000;
  };

  const terminate = () => {
    worker.terminate();
  };

  return {
    parseFile,
    progress,
    terminate
  };
}
```

#### Using Composable in Component

```vue
<script>
import { useParserWorker } from '@/composables/useParserWorker';
import { useAppStore } from '@/stores/appStore';
import { useAnalysisStore } from '@/stores/analysisStore';

export default {
  setup() {
    const appStore = useAppStore();
    const analysisStore = useAnalysisStore();
    const { parseFile, progress } = useParserWorker();

    const handleFileUpload = async (file) => {
      try {
        appStore.setCurrentFile(file);
        appStore.updateParsingStatus({ state: 'parsing', progress: 0 });

        const result = await parseFile(file);

        analysisStore.setAnalysisResult(result);
        appStore.updateParsingStatus({ state: 'success' });
      } catch (error) {
        appStore.setParsingError(error.message);
      }
    };

    return {
      handleFileUpload,
      progress
    };
  }
};
</script>
```

---

### 4. Virtual Scrolling with TanStack Virtual

```vue
<!-- BreakdownTable.vue -->
<template>
  <div ref="parentRef" class="overflow-auto h-[600px]">
    <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
      <div
        v-for="virtualRow in virtualizer.getVirtualItems()"
        :key="virtualRow.index"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`
        }"
      >
        <div class="table-row">
          {{ items[virtualRow.index].name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useVirtualizer } from '@tanstack/virtual-core';

export default {
  props: {
    items: {
      type: Array,
      required: true
    }
  },

  setup(props) {
    const parentRef = ref(null);

    const virtualizer = useVirtualizer({
      count: computed(() => props.items.length),
      getScrollElement: () => parentRef.value,
      estimateSize: () => 35, // Row height in pixels
      overscan: 5 // Render 5 extra rows above/below viewport
    });

    // Re-create virtualizer when items change
    watch(() => props.items, () => {
      virtualizer.measure();
    });

    return {
      parentRef,
      virtualizer
    };
  }
};
</script>
```

---

### 5. Error Boundary Pattern

```vue
<!-- ErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-boundary">
    <h2 class="text-red-600 text-xl font-bold">Something went wrong</h2>
    <p class="text-gray-700">{{ error.message }}</p>
    <pre class="text-sm bg-gray-100 p-4 rounded">{{ error.stack }}</pre>
    <button @click="reset" class="btn btn-primary mt-4">Try again</button>
  </div>
  <slot v-else />
</template>

<script>
import { ref, onErrorCaptured } from 'vue';

export default {
  name: 'ErrorBoundary',

  props: {
    fallbackMessage: {
      type: String,
      default: 'An error occurred'
    }
  },

  emits: ['error', 'retry'],

  setup(props, { emit }) {
    const error = ref(null);

    onErrorCaptured((err, instance, info) => {
      error.value = err;
      emit('error', { error: err, info });
      console.error('Error captured:', err, info);
      return false; // Stop propagation
    });

    const reset = () => {
      error.value = null;
      emit('retry');
    };

    return {
      error,
      reset
    };
  }
};
</script>
```

**Usage**:

```vue
<template>
  <ErrorBoundary @error="logError">
    <UploadZone @file-selected="handleFile" />
  </ErrorBoundary>
</template>
```

---

### 6. Testing Patterns

#### Component Test

```javascript
// tests/components/UploadZone.test.js
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import UploadZone from '@/components/upload/UploadZone.vue';

describe('UploadZone', () => {
  it('renders upload text', () => {
    const wrapper = mount(UploadZone, {
      global: {
        plugins: [createPinia()]
      },
      props: {
        onFileSelect: vi.fn()
      }
    });

    expect(wrapper.text()).toContain('Drag and drop');
  });

  it('emits file-selected on file drop', async () => {
    const wrapper = mount(UploadZone, {
      global: {
        plugins: [createPinia()]
      },
      props: {
        onFileSelect: vi.fn()
      }
    });

    const file = new File(['content'], 'test.ipa', { type: 'application/octet-stream' });
    const dropzone = wrapper.find('.dropzone');

    // Simulate drag-drop
    await dropzone.trigger('drop', {
      dataTransfer: { files: [file] }
    });

    expect(wrapper.emitted('file-selected')).toHaveLength(1);
    expect(wrapper.emitted('file-selected')[0][0]).toBe(file);
  });
});
```

#### Store Test

```javascript
// tests/stores/appStore.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '@/stores/appStore';

describe('appStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('sets current file', () => {
    const store = useAppStore();
    const file = { name: 'test.ipa', size: 1024 };

    store.setCurrentFile(file);

    expect(store.currentFile.name).toBe('test.ipa');
    expect(store.currentFile.size).toBe(1024);
  });

  it('updates parsing status', () => {
    const store = useAppStore();

    store.updateParsingStatus({ state: 'parsing', progress: 50 });

    expect(store.parsingStatus.state).toBe('parsing');
    expect(store.parsingStatus.progress).toBe(50);
  });
});
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Install Vue, Pinia, and Vue Test Utils
- [ ] Uninstall React, Zustand, TypeScript
- [ ] Update `vite.config.js` to use `@vitejs/plugin-vue`
- [ ] Update ESLint config to use `eslint-plugin-vue`
- [ ] Update Prettier config to format `.vue` files

### Phase 2: Core Structure
- [ ] Convert `main.tsx` → `main.js` (create Vue app, mount Pinia)
- [ ] Convert `App.tsx` → `App.vue` (root component)
- [ ] Create Pinia stores: `appStore.js`, `analysisStore.js`, `uiStore.js`
- [ ] Migrate Zustand state to Pinia state/actions

### Phase 3: Components
- [ ] Convert upload components (UploadZone, FileValidator)
- [ ] Convert breakdown components (BreakdownView, BreakdownTable, BreakdownTabs)
- [ ] Convert X-Ray components (XRayView, Treemap, CategoryFilter)
- [ ] Convert insights components (InsightsView, InsightCard, InsightFilters, SeveritySection)
- [ ] Convert shared components (Breadcrumb, ErrorBoundary, LoadingSpinner)

### Phase 4: Libraries (minimal changes)
- [ ] Convert `types/*.ts` → `types/*.js` with JSDoc
- [ ] Convert `workers/parser.worker.ts` → `workers/parser.worker.js`
- [ ] Update imports (remove `.ts` extensions)
- [ ] Verify `lib/` parsers and analysis work unchanged

### Phase 5: Testing
- [ ] Migrate component tests from React Testing Library to Vue Test Utils
- [ ] Update store tests to use Pinia testing utilities
- [ ] Verify library tests pass (should be unchanged)
- [ ] Test Web Worker integration end-to-end

### Phase 6: Verification
- [ ] Test with sample files (`.ipa`, `.apk`, `.aab`, `.xapk`)
- [ ] Verify all three views (Breakdown, X-Ray, Insights) work
- [ ] Test sorting, filtering, breadcrumb navigation
- [ ] Verify no network requests (DevTools check)
- [ ] Compare bundle size (should be ≤ React version)
- [ ] Run performance benchmarks (parse time within ±10%)

---

## Debugging Tips

### Vue DevTools

Install Vue DevTools browser extension:
- [Chrome](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

Features:
- Inspect component tree and props
- View Pinia store state and actions
- Track component events
- Time-travel debugging (Pinia)

### Common Issues

**Issue**: Component not reactive after destructuring store
```javascript
// ❌ Wrong
const { currentFile } = useAppStore();

// ✅ Correct
const { currentFile } = storeToRefs(useAppStore());
```

**Issue**: Worker callback not firing
```javascript
// ❌ Wrong
onProgress: (p) => { progress.value = p; }

// ✅ Correct (must proxy for cross-thread callback)
onProgress: Comlink.proxy((p) => { progress.value = p; })
```

**Issue**: PropTypes not validating
```javascript
// PropTypes only validate in development mode
// Run `npm run dev` to see validation warnings
```

---

## Resources

- [Vue 3 Documentation](https://vuejs.org/guide/introduction.html)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [TanStack Virtual Core](https://tanstack.com/virtual/latest)
- [Comlink](https://github.com/GoogleChromeLabs/comlink)

---

## Support

For questions or issues:
1. Check existing tests for usage examples
2. Review contracts in `specs/006-vue-migration/contracts/`
3. Consult research decisions in `specs/006-vue-migration/research.md`
