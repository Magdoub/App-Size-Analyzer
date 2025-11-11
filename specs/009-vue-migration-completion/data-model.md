# Data Model: Vue Migration Completion

**Feature**: 009-vue-migration-completion
**Date**: 2025-11-11
**Status**: Design Complete

## Overview

This document defines the data entities, state flows, and interaction patterns for the Vue migration completion. It describes how user actions propagate through Pinia stores to update Vue components via reactivity.

---

## Core Entities

### 1. ParserWorkerState

Represents the state of Web Worker parsing operations.

```javascript
/**
 * @typedef {Object} ParserWorkerState
 * @property {'idle'|'validating'|'parsing'|'analyzing'|'success'|'error'} state
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} message - Status message for UI display
 * @property {Error|null} error - Error object if state is 'error'
 * @property {number|null} startTime - Parse start timestamp (ms)
 * @property {number|null} endTime - Parse end timestamp (ms)
 * @property {boolean} isCancellable - Whether cancel() is available
 */
```

**State Transitions:**

```
idle → validating → parsing → analyzing → success
  ↓                    ↓
  error ← ← ← ← ← ← error
```

**Managed by:** `appStore` (Pinia)

### 2. AnalysisData

Represents the parsed binary analysis results.

```javascript
/**
 * @typedef {Object} AnalysisData
 * @property {AppMetadata} metadata - App metadata (platform, bundle ID, version)
 * @property {FileNode} breakdownRoot - Hierarchical file tree
 * @property {TreemapNode} treemapData - Flattened treemap data for visualization
 * @property {SummaryStats} summary - Aggregate statistics
 */

/**
 * @typedef {Object} AppMetadata
 * @property {'iOS'|'Android'} platform
 * @property {string} bundleId - com.example.app
 * @property {string} version - 1.0.0
 * @property {string|null} buildNumber - 42
 * @property {number} minOSVersion - Minimum OS version
 */

/**
 * @typedef {Object} FileNode
 * @property {string} name - File or directory name
 * @property {string} path - Full path from root
 * @property {'file'|'directory'} type
 * @property {number} size - Uncompressed size in bytes
 * @property {number} compressedSize - Compressed size in bytes
 * @property {string} contentType - Detected content type (image/png, code/swift, etc.)
 * @property {FileNode[]} children - Child nodes for directories
 * @property {Object} metadata - Additional metadata (architecture, etc.)
 */

/**
 * @typedef {Object} TreemapNode
 * @property {string} id - Unique node ID (full path)
 * @property {string} name - Display name
 * @property {number} value - Size in bytes (for treemap area calculation)
 * @property {string} color - Hex color based on content type
 * @property {TreemapNode[]} children - Child nodes
 * @property {Object} metadata - Additional data for tooltips
 */

/**
 * @typedef {Object} SummaryStats
 * @property {number} totalSize - Total uncompressed size
 * @property {number} compressedSize - Total compressed size
 * @property {number} compressionRatio - Compressed / uncompressed
 * @property {number} fileCount - Total file count
 * @property {number} directoryCount - Total directory count
 * @property {string} largestFile - Path to largest file
 * @property {number} largestFileSize - Size of largest file
 */
```

**Managed by:** `analysisStore` (Pinia)

### 3. InsightData

Represents actionable recommendations from analysis.

```javascript
/**
 * @typedef {Object} InsightData
 * @property {string} id - Unique insight ID
 * @property {'critical'|'high'|'medium'|'low'} severity
 * @property {string} category - 'size'|'duplicates'|'unused'|'optimization'
 * @property {string} title - Short title (40 chars)
 * @property {string} description - Detailed explanation (200 chars)
 * @property {string[]} affectedFiles - File paths
 * @property {string} recommendation - Actionable advice
 * @property {number|null} potentialSavings - Estimated size savings in bytes
 * @property {boolean} isExpanded - UI state (expanded/collapsed)
 */
```

**Managed by:** `analysisStore` (Pinia)

### 4. UIState

Represents UI interaction state (navigation, filters, sorting).

```javascript
/**
 * @typedef {Object} UIState
 * @property {ViewState} view - Active view and navigation
 * @property {FilterState} filters - Active filters
 * @property {SortState} sort - Sorting configuration
 * @property {ExpandedState} expanded - Expanded/collapsed UI elements
 * @property {ScrollState} scroll - Scroll positions per view
 */

/**
 * @typedef {Object} ViewState
 * @property {'breakdown'|'xray'|'insights'} activeView - Current tab
 * @property {string[]} xrayPath - Current X-Ray navigation path ['/', 'Payload', 'App.app']
 * @property {string|null} focusedFile - Focused file path (from insights navigation)
 */

/**
 * @typedef {Object} FilterState
 * @property {string|null} platform - 'iOS'|'Android'|null (all)
 * @property {string[]} categories - Selected categories for X-Ray filter
 * @property {string|null} insightSeverity - 'critical'|'high'|'medium'|'low'|null (all)
 * @property {string[]} insightCategories - Selected insight categories
 * @property {string} searchQuery - Search text for table filtering
 */

/**
 * @typedef {Object} SortState
 * @property {'name'|'size'|'percentage'} sortBy - Sort column
 * @property {'asc'|'desc'} sortOrder - Sort direction
 */

/**
 * @typedef {Object} ExpandedState
 * @property {Set<string>} breakdownDirs - Expanded directory paths in Breakdown table
 * @property {Set<string>} insightCards - Expanded insight card IDs
 * @property {Set<string>} insightSections - Expanded severity sections
 */

/**
 * @typedef {Object} ScrollState
 * @property {number} breakdownScroll - Breakdown table scroll position (px)
 * @property {number} insightsScroll - Insights view scroll position (px)
 */
```

**Managed by:** `uiStore` (Pinia)

---

## State Flow Diagrams

### 1. File Upload → Parsing → Analysis Flow

```
User drops file
    ↓
UploadZone.vue emits 'file-selected' event
    ↓
UploadZone calls useParserWorker().parseFile(file)
    ↓
useParserWorker composable:
  1. Creates Worker instance
  2. Wraps with Comlink
  3. Calls worker.parseIOS() or worker.parseAndroid()
  4. Updates ref(progress), ref(status) via callback
    ↓
appStore.updateParsingStatus({ state: 'parsing', progress: 25 })
    ↓
LoadingSpinner.vue reacts to appStore.parsingStatus
    ↓
Worker completes → parseFile() resolves with result
    ↓
analysisStore.setAnalysisResult(result)
    ↓
analysisStore.calculateSummary()
    ↓
Insight engine runs (lib/analysis/insight-engine.js)
    ↓
analysisStore.setInsights(insights)
    ↓
appStore.updateParsingStatus({ state: 'success' })
    ↓
All views (Breakdown, X-Ray, Insights) react to analysisStore data
```

### 2. User Interaction → UI Update Flow

**Example: Treemap Node Click (Drill-Down)**

```
User clicks treemap node 'Payload/MyApp.app'
    ↓
Treemap.vue emits 'node-click' event with path
    ↓
XRayView.vue handles @node-click
    ↓
uiStore.setXRayPath(['/', 'Payload', 'MyApp.app'])
    ↓
XRayView.vue computed property reacts to uiStore.view.xrayPath
    ↓
Computed property filters treemapData to current path
    ↓
Treemap.vue receives filtered data via props
    ↓
ECharts updates via watch() on props.data
    ↓
Breadcrumb.vue reacts to uiStore.view.xrayPath
    ↓
Breadcrumb displays: Home > Payload > MyApp.app
```

**Example: Table Column Sort**

```
User clicks 'Size' column header in Breakdown table
    ↓
BreakdownTable.vue calls handleSort('size')
    ↓
If sortBy === 'size': toggle sortOrder (asc ↔ desc)
If sortBy !== 'size': set sortBy = 'size', sortOrder = 'desc'
    ↓
uiStore.setSort({ sortBy: 'size', sortOrder: 'desc' })
    ↓
BreakdownTable.vue computed property 'sortedFiles' reacts
    ↓
sortedFiles = [...files].sort((a, b) => compare by size desc)
    ↓
VirtualScroller re-renders with sorted data
```

**Example: Insight Filter**

```
User selects 'Critical' severity filter
    ↓
InsightFilters.vue emits 'filter-change' event
    ↓
InsightsView.vue handles @filter-change
    ↓
uiStore.setInsightFilter({ severity: 'critical' })
    ↓
InsightsView.vue computed property 'filteredInsights' reacts
    ↓
filteredInsights = analysisStore.insights.filter(i => i.severity === 'critical')
    ↓
SeveritySection.vue components receive filtered data
```

---

## Worker Message Protocol

### 1. Main Thread → Worker Messages

**Parse Request:**
```javascript
// Via Comlink - abstracted as async function call
await workerAPI.parseIOS(file);
await workerAPI.parseAndroid(file);
```

**Cancel Request:**
```javascript
// Via Comlink
workerAPI.cancel();
```

### 2. Worker → Main Thread Messages

**Progress Updates:**
```javascript
// Worker sends via Comlink callback proxy
onProgress({
  progress: 45,
  message: 'Extracting ZIP archive...'
});
```

**Parse Success:**
```javascript
// Worker returns via Promise resolution
return {
  parseResult: {
    metadata: { platform: 'iOS', bundleId: 'com.example.app' },
    breakdownRoot: { /* FileNode tree */ },
    treemapData: { /* TreemapNode tree */ },
    summary: { /* SummaryStats */ }
  },
  fileEntries: [
    { path: 'Payload/App.app', size: 1000, compressedSize: 500, type: 'directory' }
  ]
};
```

**Parse Error:**
```javascript
// Worker throws error via Promise rejection
throw new Error('Unsupported file format: .txt');
```

---

## Interaction Flow Examples

### Example 1: Upload and Analyze Flow

```
1. User drags 'MyApp.ipa' onto UploadZone
   → UploadZone validates file type (.ipa = valid)
   → UploadZone.vue calls useParserWorker().parseFile(file)

2. useParserWorker composable:
   → Creates Worker: new Worker('./parser-worker.js')
   → Wraps with Comlink: wrap(worker)
   → Calls worker.parseIOS(file, Comlink.proxy(onProgress))
   → onProgress callback updates: progress.value = 25

3. Worker (parser-worker.js):
   → Calls extractZIP(file) - sends progress updates
   → Calls parseIPA(file) - extracts metadata
   → Generates breakdown tree and treemap data
   → Returns { parseResult, fileEntries }

4. Main thread receives result:
   → appStore.updateParsingStatus({ state: 'analyzing', progress: 90 })
   → analysisStore.setAnalysisResult(result.parseResult)
   → analysisStore.calculateSummary()
   → Insight engine runs: generateInsights(result)
   → analysisStore.setInsights(insights)
   → appStore.updateParsingStatus({ state: 'success', progress: 100 })

5. Components react to store updates:
   → BreakdownView.vue displays breakdownRoot tree
   → XRayView.vue displays treemapData
   → InsightsView.vue displays insights
   → App.vue removes loading spinner
```

### Example 2: Treemap Drill-Down + Breadcrumb Navigation

```
1. User clicks treemap node 'Payload/MyApp.app/Frameworks'
   → Treemap.vue emits: @node-click with path = '/Payload/MyApp.app/Frameworks'

2. XRayView.vue handles event:
   → Calls: uiStore.setXRayPath(['/', 'Payload', 'MyApp.app', 'Frameworks'])

3. Reactivity cascade:
   → XRayView computed 'currentTreemapData' reacts to uiStore.view.xrayPath
   → Filters treemapData to show only children of 'Frameworks' directory
   → Passes filtered data to Treemap via props

4. Treemap.vue reacts:
   → watch() detects props.data change
   → Calls chartInstance.setOption({ series: [{ data: newData }] })
   → ECharts animates zoom into 'Frameworks' node

5. Breadcrumb.vue reacts:
   → Computed 'breadcrumbSegments' reacts to uiStore.view.xrayPath
   → Displays: Home > Payload > MyApp.app > Frameworks
   → Each segment is clickable

6. User clicks 'MyApp.app' breadcrumb:
   → Breadcrumb.vue emits @navigate with path = ['/', 'Payload', 'MyApp.app']
   → XRayView.vue calls uiStore.setXRayPath(['/', 'Payload', 'MyApp.app'])
   → Treemap zooms back out to MyApp.app level (steps 3-4 repeat)
```

### Example 3: Insight Card → File Navigation

```
1. User views Insights, sees critical insight: "Large PNG files not optimized"
   → Affected files: ['Assets.car/icon@2x.png', 'Assets.car/splash.png']

2. User clicks 'icon@2x.png' link in InsightCard:
   → InsightCard.vue emits @file-click with path = 'Assets.car/icon@2x.png'

3. InsightsView.vue handles event:
   → Calls: uiStore.setActiveView('xray')
   → Calls: uiStore.setXRayPath(['/', 'Payload', 'MyApp.app', 'Assets.car'])
   → Calls: uiStore.setFocusedFile('Assets.car/icon@2x.png')

4. View switches to X-Ray:
   → App.vue reacts to uiStore.view.activeView = 'xray'
   → Shows XRayView component

5. XRayView loads with focused file:
   → Treemap zooms to 'Assets.car' directory
   → Highlights 'icon@2x.png' node (via focused file state)
   → Tooltip shows: "icon@2x.png - 2.5 MB - 8% of total"
```

---

## Reactivity Chains

### Chain 1: Parsing Progress → UI Updates

```
Worker sends progress callback
    ↓
useParserWorker: progress.value = 45
    ↓
Vue reactivity triggers component re-render
    ↓
LoadingSpinner.vue: {{ progress }}% updates in DOM
```

### Chain 2: Store Mutation → Component Updates

```
uiStore.setSort({ sortBy: 'size', sortOrder: 'desc' })
    ↓
Pinia triggers reactivity
    ↓
BreakdownTable computed 'sortedFiles' recalculates
    ↓
VirtualScroller receives new sortedFiles array
    ↓
Virtual scrolling re-renders visible rows
```

### Chain 3: Treemap Data Change → ECharts Update

```
analysisStore.setAnalysisResult(newData)
    ↓
Pinia store state updates
    ↓
XRayView computed 'currentTreemapData' recalculates
    ↓
Treemap.vue receives new props.data
    ↓
watch(props.data) fires
    ↓
chartInstance.setOption({ series: [{ data: newData }] })
    ↓
ECharts re-renders treemap with animation
```

---

## Memory Management

### 1. Worker Lifecycle

```javascript
// Creation
onMounted(() => {
  worker = new Worker('./parser-worker.js');
  workerAPI = wrap(worker);
});

// Cleanup
onUnmounted(() => {
  if (worker) {
    worker.terminate(); // Stops worker thread
    worker = null;
    workerAPI = null;
  }
});
```

### 2. Large Data Handling

- **Breakdown Tree**: Keep full tree in store, use virtual scrolling for display
- **Treemap Data**: Filter to current path only, not entire tree
- **File Entries**: Store compressed in worker, transfer only parsed results

### 3. Store Reset

```javascript
// Reset all stores when new file uploaded
appStore.reset();
analysisStore.reset();
uiStore.reset();
```

---

## Validation Rules

### File Validation (appStore)

```javascript
// In FileValidator.vue or appStore
function validateFile(file) {
  const errors = [];

  // Rule 1: File type
  if (!['ipa', 'apk', 'aab', 'xapk'].includes(fileType)) {
    errors.push('Unsupported file type. Please upload .ipa, .apk, .aab, or .xapk');
  }

  // Rule 2: File size (warn if > 500MB)
  if (file.size > 500 * 1024 * 1024) {
    errors.push('Warning: Large files (>500MB) may take longer to parse');
  }

  // Rule 3: File not empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return errors;
}
```

### State Transitions (appStore)

```javascript
// Only valid transitions allowed
const validTransitions = {
  'idle': ['validating', 'error'],
  'validating': ['parsing', 'error'],
  'parsing': ['analyzing', 'error'],
  'analyzing': ['success', 'error'],
  'success': ['idle'], // For new file upload
  'error': ['idle'] // Allow retry
};
```

---

## Performance Considerations

### 1. Computed Property Optimization

```javascript
// ✅ GOOD: Specific dependency
const sortedFiles = computed(() => {
  const { sortBy, sortOrder } = uiStore.sort;
  return [...files.value].sort((a, b) => compare(a, b, sortBy, sortOrder));
});

// ❌ BAD: Watches entire store
const sortedFiles = computed(() => {
  return [...files.value].sort((a, b) => compare(a, b, uiStore.sort.sortBy, uiStore.sort.sortOrder));
});
```

### 2. Virtual Scrolling

- Use `@tanstack/vue-virtual` for BreakdownTable (1,000+ rows)
- Only render visible rows + overscan buffer
- Target: 60 FPS scrolling

### 3. ECharts Performance

- Use `shallowRef()` for chart instance (prevents proxying internals)
- Canvas renderer for large datasets (10,000+ nodes)
- Lazy loading for drill-down (don't load all children upfront)

---

## Edge Cases

### 1. Parsing Timeout

```javascript
// Calculate dynamic timeout: 30s base + 5s per MB
const timeoutMs = 30000 + (file.size / (1024 * 1024)) * 5000;

// If timeout exceeded:
appStore.setParsingError('File took too long to parse. The file may be too complex or corrupted.');
```

### 2. View Switching During Parsing

```javascript
// Allow view switching - parsing continues in background
// Show progress indicator in inactive tabs
watch(() => appStore.parsingStatus.state, (state) => {
  if (state === 'parsing') {
    // Show badge on inactive tab: "Parsing... 45%"
  }
});
```

### 3. Rapid Interaction Debouncing

```javascript
// Debounce search input (300ms)
const debouncedSearch = useDebounceFn((query) => {
  uiStore.setSearchQuery(query);
}, 300);
```

---

## Summary

This data model defines:

1. **5 Core Entities**: ParserWorkerState, AnalysisData, InsightData, UIState, and their sub-types
2. **3 State Flow Diagrams**: File upload, user interaction, reactivity chains
3. **Worker Message Protocol**: Main ↔ Worker communication patterns
4. **3 Detailed Interaction Examples**: Upload flow, treemap navigation, insight navigation
5. **Validation Rules**: File validation, state transition rules
6. **Performance Optimizations**: Computed properties, virtual scrolling, ECharts tuning
7. **Edge Case Handling**: Timeouts, view switching, debouncing

All entities are managed by Pinia stores with Vue reactivity providing automatic UI updates. The architecture maintains separation between business logic (lib/), state management (stores/), and UI (components/).
