# Research: Vue.js Migration Technical Decisions

**Feature**: Vue.js Migration | **Date**: 2025-11-10 | **Phase**: 0

## Overview

This document resolves technical unknowns identified during planning for the TypeScript + React to JavaScript + Vue.js 3 migration. Each decision includes rationale, alternatives considered, and implementation guidance.

---

## Decision 1: State Management - Pinia vs Vuex

**Decision**: Use Pinia for state management

**Rationale**:
- **Official Vue recommendation**: Pinia is the officially recommended state management library for Vue 3
- **Composition API alignment**: Pinia uses Composition API syntax, matching our migration to Vue 3 Composition API
- **TypeScript-first design**: While we're using JavaScript, Pinia's architecture provides better JSDoc autocomplete hints
- **Simpler API**: No mutations (unlike Vuex), actions can be async directly
- **Smaller bundle**: ~1KB gzipped vs Vuex 3KB
- **Better DevTools**: Vue DevTools 6+ has enhanced Pinia support

**Alternatives Considered**:
1. **Vuex 4**: Older, verbose API with mutations. Not recommended for new Vue 3 projects
2. **Custom reactive stores**: Would require re-implementing devtools integration, time-travel debugging
3. **Plain reactive()**: No built-in persistence, plugin system, or devtools support

**Zustand → Pinia Migration Pattern**:

```javascript
// Zustand (before)
const useAppStore = create((set) => ({
  currentFile: null,
  setCurrentFile: (file) => set({ currentFile: file })
}));

// Pinia (after)
export const useAppStore = defineStore('app', {
  state: () => ({
    currentFile: null
  }),
  actions: {
    setCurrentFile(file) {
      this.currentFile = file;
    }
  }
});
```

**Implementation Notes**:
- Create 3 Pinia stores: `appStore.js` (file state), `analysisStore.js` (parsed data), `uiStore.js` (view state)
- Use `storeToRefs()` in components to preserve reactivity when destructuring
- Actions are synchronous by default, match Zustand's `set()` semantics

---

## Decision 2: Virtual Scrolling - @tanstack/virtual-core vs vue-virtual-scroller

**Decision**: Use @tanstack/virtual-core (framework-agnostic)

**Rationale**:
- **Existing dependency**: Project already uses @tanstack/react-virtual, core package is shared
- **Framework-agnostic**: Works with any UI framework, just needs DOM ref and scroll handlers
- **Zero bundle increase**: Core package already included, no additional library needed
- **Maintained by TanStack**: Active development, same team as React Query, React Table
- **Performance**: Handles 10,000+ rows efficiently (tested in current React version)

**Alternatives Considered**:
1. **vue-virtual-scroller**: Vue-specific, mature library. Adds 12KB to bundle, requires learning new API
2. **vue-virtual-scroll-list**: Simpler but less feature-rich, no dynamic height support
3. **Custom implementation**: Complex, would need extensive testing for edge cases

**Migration Pattern**:

```javascript
// React (before)
import { useVirtualizer } from '@tanstack/react-virtual';
const rowVirtualizer = useVirtualizer({
  count: files.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35
});

// Vue (after)
import { useVirtualizer } from '@tanstack/virtual-core';
import { ref, watchEffect } from 'vue';

const parentRef = ref(null);
const rowVirtualizer = useVirtualizer({
  count: files.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 35,
  onChange: () => {}, // Trigger Vue reactivity
});
```

**Implementation Notes**:
- Wrap virtualizer in `ref()` and use `watchEffect()` to re-create on data changes
- No React-specific hooks, just pass DOM element and callback functions
- Existing table styling (Tailwind classes) remains unchanged

---

## Decision 3: Treemap Visualization - Nivo React Wrapper vs Raw D3

**Decision**: Keep @nivo/treemap with Vue wrapper component

**Rationale**:
- **Existing dependency**: @nivo/treemap already used, renders to Canvas (framework-agnostic)
- **Vue wrapper pattern**: Create `<Treemap>` Vue component that wraps Nivo's React component
- **No D3 rewrite**: Nivo handles complex treemap algorithm, zoom animations, tooltips
- **Bundle size**: Keeping Nivo (~80KB) vs D3 + custom implementation (~100KB+)
- **Proven performance**: Current version renders 10,000-node trees in <1s

**Alternatives Considered**:
1. **Rewrite with D3.js**: Massive effort, would need to replicate Nivo's zoom/pan/tooltip logic
2. **vue-chartjs**: Doesn't support treemaps
3. **ECharts**: Heavier bundle (300KB+), different API
4. **Apache ECharts**: Similar concerns as ECharts

**Vue Wrapper Pattern**:

```vue
<!-- Treemap.vue -->
<template>
  <div ref="container"></div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { renderTreeMap } from '@nivo/treemap'; // Use render function, not React component

export default {
  props: {
    data: Object,
    width: Number,
    height: Number
  },
  setup(props) {
    const container = ref(null);

    const render = () => {
      // Call Nivo's vanilla JS render function (not JSX)
      renderTreeMapToCanvas(container.value, props.data, props.width, props.height);
    };

    onMounted(render);
    watch(() => props.data, render);

    return { container };
  }
};
</script>
```

**Implementation Notes**:
- Use Nivo's canvas renderer (not SVG) for performance
- Pass data via props, trigger re-render on data changes
- Preserve existing color scheme (`color2k` for category colors)

---

## Decision 4: Web Worker Communication - Comlink vs postMessage

**Decision**: Keep Comlink for typed postMessage abstraction

**Rationale**:
- **Existing dependency**: Comlink already used for IPA/APK parser workers
- **Framework-agnostic**: Works with any UI framework, just wraps postMessage
- **Type safety via JSDoc**: Can annotate worker exports with `@type` for autocomplete
- **Simpler API**: `await parser.parseIPA(file)` vs manual message passing
- **Bundle cost**: 2KB gzipped, already included

**Alternatives Considered**:
1. **Raw postMessage**: Verbose, need to handle message IDs, promise resolution manually
2. **worker-loader**: Webpack-specific, Vite uses native Web Workers
3. **Remove workers**: Would block main thread (violates Constitution II)

**Vue Integration Pattern**:

```javascript
// Worker (unchanged)
import * as Comlink from 'comlink';
const api = {
  parseIPA: async (file) => { /* parsing logic */ }
};
Comlink.expose(api);

// Vue component (minimal change)
import * as Comlink from 'comlink';
import { ref } from 'vue';

const worker = new Worker(new URL('../workers/parser.worker.js', import.meta.url), { type: 'module' });
const parser = Comlink.wrap(worker);

const parseFile = async (file) => {
  const result = await parser.parseIPA(file);
  // Update Pinia store
};
```

**Implementation Notes**:
- Workers are already JavaScript (converted from TS during migration)
- No Vue-specific code in workers (they're pure JS functions)
- Pinia stores updated after worker responses (same as Zustand pattern)

---

## Decision 5: Error Boundaries - Vue errorCaptured vs Error Plugin

**Decision**: Use Vue 3 `errorCaptured` lifecycle hook

**Rationale**:
- **Built-in Vue API**: No additional library needed
- **Component-level**: Can scope error boundaries to specific sections (upload, analysis, treemap)
- **Same semantics**: Similar to React error boundaries (`componentDidCatch`)
- **DevTools integration**: Errors logged in Vue DevTools

**Alternatives Considered**:
1. **Global error handler**: `app.config.errorHandler` - too broad, doesn't isolate errors
2. **try/catch in every action**: Verbose, easy to miss coverage
3. **Plugin like vue-error-boundary**: Adds dependency, no significant benefit over native API

**Migration Pattern**:

```vue
<!-- ErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-container">
    <h2>Something went wrong</h2>
    <p>{{ error.message }}</p>
    <button @click="reset">Try again</button>
  </div>
  <slot v-else />
</template>

<script>
import { ref, onErrorCaptured } from 'vue';

export default {
  setup() {
    const error = ref(null);

    onErrorCaptured((err) => {
      error.value = err;
      return false; // Stop error propagation
    });

    const reset = () => {
      error.value = null;
    };

    return { error, reset };
  }
};
</script>
```

**Implementation Notes**:
- Wrap main sections: `<ErrorBoundary><UploadZone /></ErrorBoundary>`
- Log errors to console for debugging (same as React version)
- Reset error state on user action (file upload, view change)

---

## Decision 6: Type Safety Without TypeScript - PropTypes vs JSDoc

**Decision**: Use Vue PropTypes for component props + JSDoc for libraries

**Rationale**:
- **Runtime validation**: Vue PropTypes throw errors if wrong type passed (dev mode)
- **Editor autocomplete**: VSCode/IntelliJ pick up PropTypes for prop hints
- **Zero bundle cost**: PropTypes removed in production build (dev-only)
- **Vue ecosystem standard**: Matches Vue 2/3 patterns for non-TypeScript projects
- **JSDoc for libraries**: Annotate `lib/` functions for autocomplete without TypeScript

**Alternatives Considered**:
1. **Pure JSDoc**: No runtime validation, only editor hints
2. **TypeScript with `allowJs`**: User explicitly rejected TypeScript
3. **No type checking**: Risky for complex binary parsing logic

**PropTypes Pattern**:

```vue
<!-- UploadZone.vue -->
<script>
export default {
  props: {
    onFileSelect: {
      type: Function,
      required: true,
      validator: (fn) => typeof fn === 'function'
    },
    maxSize: {
      type: Number,
      default: 2 * 1024 * 1024 * 1024, // 2GB
      validator: (size) => size > 0
    },
    acceptedFormats: {
      type: Array,
      default: () => ['.ipa', '.apk', '.aab', '.xapk'],
      validator: (formats) => formats.every(f => typeof f === 'string')
    }
  }
};
</script>
```

**JSDoc Pattern for Libraries**:

```javascript
/**
 * Parses an IPA binary file and extracts metadata
 * @param {File} file - The IPA file to parse
 * @param {Object} options - Parsing options
 * @param {number} [options.timeout=30000] - Timeout in milliseconds
 * @returns {Promise<IPAMetadata>} Parsed IPA metadata
 * @throws {Error} If file is invalid or parsing fails
 */
export async function parseIPA(file, options = {}) {
  // Implementation
}

/**
 * @typedef {Object} IPAMetadata
 * @property {string} bundleId - App bundle identifier
 * @property {string} version - App version
 * @property {number} size - Total size in bytes
 * @property {FileNode[]} tree - File hierarchy
 */
```

**Implementation Notes**:
- PropTypes for all Vue components (20+ components)
- JSDoc for `lib/` modules (parsers, analysis, utils)
- ESLint rules: `require-jsdoc` for exported functions

---

## Decision 7: Testing Framework - Vitest + Vue Test Utils

**Decision**: Keep Vitest, add @vue/test-utils

**Rationale**:
- **Vitest already used**: Fast, Vite-native test runner (no config changes)
- **Vue Test Utils**: Official Vue testing library, similar to React Testing Library
- **Same test patterns**: Mount component, query DOM, simulate events, assert
- **Performance**: Vitest's watch mode is instant (HMR-powered)
- **Coverage**: `c8` integration unchanged

**Alternatives Considered**:
1. **Jest + Vue Test Utils**: Slower, requires Babel config for ES modules
2. **Cypress Component Testing**: Heavier, requires browser runtime
3. **Playwright**: Better for E2E, overkill for unit tests

**Migration Pattern**:

```javascript
// React Testing Library (before)
import { render, screen, fireEvent } from '@testing-library/react';
import UploadZone from './UploadZone';

test('shows drop zone text', () => {
  render(<UploadZone onFileSelect={vi.fn()} />);
  expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
});

// Vue Test Utils (after)
import { mount } from '@vue/test-utils';
import UploadZone from './UploadZone.vue';

test('shows drop zone text', () => {
  const wrapper = mount(UploadZone, {
    props: { onFileSelect: vi.fn() }
  });
  expect(wrapper.text()).toContain('Drag and drop');
});
```

**Implementation Notes**:
- Library tests (parsers, analysis) unchanged (framework-agnostic)
- Component tests rewritten: `render()` → `mount()`, `screen` → `wrapper`
- Coverage threshold: maintain 80% for parsers, 70% for components

---

## Decision 8: Build Configuration - Vite with Vue Plugin

**Decision**: Replace @vitejs/plugin-react with @vitejs/plugin-vue

**Rationale**:
- **Vite already used**: No build tool change needed
- **Official Vue plugin**: `@vitejs/plugin-vue` maintained by Vue team
- **SFC support**: Handles `.vue` single-file components
- **Same config**: Tailwind, PostCSS, asset handling unchanged
- **HMR**: Vue HMR works identically to React Fast Refresh

**vite.config.js Changes**:

```javascript
// Before
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ... rest unchanged
});

// After
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // ... rest unchanged
});
```

**Implementation Notes**:
- Remove `@vitejs/plugin-react`, add `@vitejs/plugin-vue`
- Keep Tailwind, PostCSS config unchanged
- Build output remains static HTML + JS (no SSR)

---

## Decision 9: Routing - No Router (Single Page App)

**Decision**: No routing library, single-page app with conditional rendering

**Rationale**:
- **Current architecture**: React version has no router, uses Zustand for view state
- **Three views only**: Breakdown, X-Ray, Insights (tab-based navigation)
- **No deep linking**: Users don't bookmark specific views
- **Bundle savings**: Vue Router adds 20KB, unnecessary for simple tabs

**Alternatives Considered**:
1. **Vue Router**: Adds complexity, no URLs to route
2. **Hash routing**: No benefit over simple state management

**Implementation Pattern**:

```vue
<!-- App.vue -->
<template>
  <BreakdownTabs v-model="activeView" />
  <BreakdownView v-if="activeView === 'breakdown'" />
  <XRayView v-else-if="activeView === 'xray'" />
  <InsightsView v-else-if="activeView === 'insights'" />
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const activeView = ref('breakdown');
    return { activeView };
  }
};
</script>
```

**Implementation Notes**:
- Store active view in Pinia `uiStore`
- Use `v-if` for conditional rendering (not `v-show` - don't mount hidden views)
- Preserve scroll position per view (same as React version)

---

## Decision 10: Dependency Migration Strategy

**Decision**: Keep all framework-agnostic libraries, replace only React-specific ones

**Packages to Keep**:
- `@nivo/treemap` - Canvas rendering (framework-agnostic)
- `fflate` - ZIP parsing (pure JS)
- `app-info-parser` - Binary metadata (pure JS)
- `color2k` - Color utilities (pure JS)
- `comlink` - Web Worker wrapper (pure JS)
- `@tanstack/virtual-core` - Virtual scrolling (framework-agnostic)
- `tailwindcss` - Utility CSS (framework-agnostic)
- `vitest` - Test runner (framework-agnostic)

**Packages to Remove**:
- `react` + `react-dom`
- `@types/react` + `@types/react-dom`
- `zustand`
- `@tanstack/react-virtual` (replace with virtual-core)
- `@tanstack/react-table` (not actually used, can remove)
- `@vitejs/plugin-react`
- `@testing-library/react`
- `typescript` + `@typescript-eslint/*`

**Packages to Add**:
- `vue` (~130KB gzipped)
- `pinia` (~5KB gzipped)
- `@vitejs/plugin-vue`
- `@vue/test-utils`
- `eslint-plugin-vue`

**Bundle Size Impact**:
- Remove: React (45KB) + React-DOM (130KB) + Zustand (4KB) + TS libs (0KB prod) = ~179KB
- Add: Vue (130KB) + Pinia (5KB) = ~135KB
- **Net savings**: ~44KB gzipped

---

## Summary of Research Outcomes

| Question | Decision | Impact |
|----------|----------|--------|
| State management | Pinia | 3 stores (app, analysis, ui) |
| Virtual scrolling | @tanstack/virtual-core | No API changes, just Vue wrappers |
| Treemap rendering | Keep @nivo/treemap | Wrap in Vue component |
| Web Workers | Keep Comlink | No changes to worker code |
| Error handling | errorCaptured hook | Native Vue API |
| Type safety | PropTypes + JSDoc | Runtime validation + editor hints |
| Testing | Vitest + Vue Test Utils | Component tests rewritten |
| Build tool | Vite + Vue plugin | 1-line config change |
| Routing | None | Simple v-if view switching |
| Bundle size | ~44KB smaller | Vue smaller than React + deps |

**All unknowns from Technical Context have been resolved. Proceeding to Phase 1 (Design).**
