# Data Model: Vue.js Migration

**Feature**: Vue.js Migration | **Date**: 2025-11-10 | **Phase**: 1

## Overview

This document defines the data entities and state management architecture for the Vue.js migration. Since this is a framework migration (not a new feature), the data model remains conceptually unchanged from the React version. The primary change is transitioning from Zustand stores to Pinia stores while preserving the same state shape and relationships.

---

## State Management Architecture

### Pinia Store Organization

The application uses three Pinia stores to separate concerns:

```
stores/
├── appStore.js       # File upload state and metadata
├── analysisStore.js  # Parsed binary data and analysis results
└── uiStore.js        # View state, filters, and navigation
```

**Design Rationale**:
- **Separation of concerns**: File lifecycle, data processing, and UI state are independent
- **Performance**: Splitting stores prevents unnecessary re-renders (Vue only reacts to changed stores)
- **Testability**: Each store can be tested in isolation
- **Matches existing architecture**: Mirrors the React version's Zustand store organization

---

## Entity Definitions

### 1. AppStore (File Lifecycle State)

**Purpose**: Manages uploaded file state and parsing status

**State Shape**:

```javascript
{
  // Currently uploaded file
  currentFile: {
    file: File | null,           // Browser File object
    name: string,                // File name (e.g., "MyApp.ipa")
    size: number,                // File size in bytes
    type: 'ipa' | 'apk' | 'aab' | 'xapk', // Detected file type
    uploadedAt: number           // Timestamp (Date.now())
  } | null,

  // Parsing progress
  parsingStatus: {
    state: 'idle' | 'parsing' | 'success' | 'error', // Parsing state machine
    progress: number,            // 0-100 percentage
    message: string,             // Status message (e.g., "Parsing IPA structure...")
    error: string | null         // Error message if state === 'error'
  },

  // Validation state
  validationErrors: string[]     // File validation errors (e.g., "File exceeds 2GB limit")
}
```

**Actions**:
- `setCurrentFile(file)` - Store uploaded file and metadata
- `clearCurrentFile()` - Reset file state (new upload)
- `updateParsingStatus(status)` - Update parsing progress
- `setParsingError(error)` - Handle parsing failures
- `addValidationError(error)` - Track validation issues

**Relationships**:
- **→ AnalysisStore**: When parsing completes, triggers analysis store update
- **→ UIStore**: Resets UI state when new file uploaded

---

### 2. AnalysisStore (Parsed Binary Data)

**Purpose**: Stores parsed binary structure, analysis results, and insights

**State Shape**:

```javascript
{
  // App metadata (from binary headers)
  metadata: {
    bundleId: string,            // iOS: CFBundleIdentifier, Android: package name
    version: string,             // iOS: CFBundleShortVersionString, Android: versionName
    buildNumber: string,         // iOS: CFBundleVersion, Android: versionCode
    minOS: string,               // iOS: MinimumOSVersion, Android: minSdkVersion
    targetOS: string,            // iOS: DTPlatformVersion, Android: targetSdkVersion
    platform: 'iOS' | 'Android', // Detected platform
    icon: string | null          // Base64-encoded app icon
  } | null,

  // File hierarchy tree
  breakdownTree: {
    name: string,                // Node name (file or directory)
    path: string,                // Full path (e.g., "Payload/MyApp.app/Frameworks/")
    size: number,                // Uncompressed size in bytes
    compressedSize: number,      // Compressed size in bytes (from ZIP)
    percentage: number,          // Percentage of total app size (0-100)
    type: 'file' | 'directory',  // Node type
    category: 'executable' | 'framework' | 'resource' | 'asset' | 'other', // File category
    children: BreakdownNode[]    // Recursive children (directories only)
  } | null,

  // Flattened treemap data (for visualization)
  treemapData: {
    name: string,                // Root name (app bundle ID)
    children: {
      name: string,              // Category name (e.g., "Frameworks")
      color: string,             // Hex color (e.g., "#4F46E5")
      children: {
        name: string,            // File name
        value: number,           // Size in bytes
        percentage: number,      // Percentage of parent category
        path: string             // Full path for tooltip
      }[]
    }[]
  } | null,

  // Generated insights
  insights: {
    id: string,                  // Unique insight ID (e.g., "large-framework-uikit")
    severity: 'critical' | 'warning' | 'info', // Severity level
    category: 'optimization' | 'structure' | 'compatibility', // Insight category
    title: string,               // Short title (e.g., "Large Framework Detected")
    description: string,         // Detailed explanation
    affectedFiles: string[],     // Paths to affected files
    recommendation: string,      // Actionable advice
    estimatedSavings: number | null // Bytes that could be saved (null if N/A)
  }[],

  // Size summary statistics
  summary: {
    totalSize: number,           // Total uncompressed size (bytes)
    compressedSize: number,      // Total compressed size (bytes)
    compressionRatio: number,    // Ratio (0-1, e.g., 0.65 = 65% compression)
    fileCount: number,           // Total number of files
    directoryCount: number,      // Total number of directories
    largestFile: string,         // Path to largest file
    largestFileSize: number      // Size of largest file (bytes)
  } | null
}
```

**Actions**:
- `setAnalysisResult(result)` - Store parsed binary data (called by worker)
- `clearAnalysis()` - Reset analysis state (new file upload)
- `updateInsights(insights)` - Add/update generated insights
- `calculateSummary()` - Compute summary statistics from breakdown tree

**Relationships**:
- **← AppStore**: Receives parsing results when file analysis completes
- **→ UIStore**: Triggers UI update when analysis ready

---

### 3. UIStore (View State and Interactions)

**Purpose**: Manages UI state, filters, navigation, and user interactions

**State Shape**:

```javascript
{
  // Active view
  activeView: 'breakdown' | 'xray' | 'insights', // Current tab

  // Breakdown view state
  breakdown: {
    sortColumn: 'name' | 'size' | 'percentage', // Active sort column
    sortDirection: 'asc' | 'desc',   // Sort direction
    expandedPaths: Set<string>,      // Expanded directory paths (for tree view)
    scrollPosition: number           // Scroll position (restore when returning to view)
  },

  // X-Ray (treemap) view state
  xray: {
    currentPath: string[],           // Breadcrumb path (e.g., ["Payload", "MyApp.app", "Frameworks"])
    zoomLevel: number,               // Zoom level (1.0 = 100%)
    categoryFilter: string | null,   // Active category filter (e.g., "frameworks")
    hoveredNode: string | null,      // Path of hovered treemap node (for tooltip)
    scrollPosition: number           // Scroll position
  },

  // Insights view state
  insights: {
    severityFilter: 'all' | 'critical' | 'warning' | 'info', // Active severity filter
    categoryFilter: 'all' | 'optimization' | 'structure' | 'compatibility', // Active category filter
    searchQuery: string,             // Search query (filters insights by title/description)
    scrollPosition: number           // Scroll position
  },

  // Responsive UI state
  ui: {
    isSidebarOpen: boolean,          // Sidebar visibility (mobile)
    theme: 'light' | 'dark'          // Color theme (future feature, not in React version)
  }
}
```

**Actions**:
- `setActiveView(view)` - Switch between tabs
- `updateBreakdownSort(column, direction)` - Update table sort
- `toggleDirectoryExpanded(path)` - Expand/collapse directory
- `navigateToPath(path)` - Update X-Ray breadcrumb navigation
- `setInsightFilter(severity, category)` - Filter insights
- `updateSearchQuery(query)` - Search insights
- `saveScrollPosition(view, position)` - Persist scroll position per view

**Relationships**:
- **← AnalysisStore**: Reacts to analysis completion (e.g., reset filters when new file analyzed)
- **← AppStore**: Resets UI state when new file uploaded

---

## State Relationships and Data Flow

```
┌─────────────┐
│  User       │
│  Actions    │
└──────┬──────┘
       │
       ├─── File Upload ────────────────────────────┐
       │                                            │
       │                                            ▼
       │                                    ┌────────────────┐
       │                                    │   AppStore     │
       │                                    │  currentFile   │
       │                                    │  parsingStatus │
       │                                    └───────┬────────┘
       │                                            │
       │                                            │ Web Worker
       │                                            │ (parser.worker.js)
       │                                            │
       │                                            ▼
       │                                    ┌────────────────┐
       │                                    │ AnalysisStore  │
       │                                    │  metadata      │
       │                                    │  breakdownTree │
       │                                    │  insights      │
       │                                    └───────┬────────┘
       │                                            │
       ├─── UI Interactions ─────────┐             │
       │    (sort, filter, navigate) │             │
       │                             │             │
       ▼                             ▼             ▼
┌──────────────┐            ┌─────────────────────────┐
│   UIStore    │            │   Vue Components        │
│  activeView  │◀───────────│   - UploadZone          │
│  filters     │            │   - BreakdownTable      │
│  navigation  │            │   - Treemap             │
└──────────────┘            │   - InsightsView        │
                            └─────────────────────────┘
```

**Data Flow**:

1. **File Upload**:
   - User drops file → `UploadZone` → `AppStore.setCurrentFile(file)`
   - `AppStore` validates file → updates `parsingStatus` to "parsing"
   - Web Worker parses file → `AnalysisStore.setAnalysisResult(result)`
   - `UIStore.activeView` set to "breakdown" (default view)

2. **View Switching**:
   - User clicks tab → `BreakdownTabs` → `UIStore.setActiveView(view)`
   - Vue `v-if` conditionally renders view component

3. **Sorting/Filtering**:
   - User clicks sort header → `BreakdownTable` → `UIStore.updateBreakdownSort(column)`
   - Table re-renders with sorted data (Vue computed property)

4. **Treemap Navigation**:
   - User clicks treemap node → `Treemap` → `UIStore.navigateToPath(path)`
   - Breadcrumb updates → `Breadcrumb` component re-renders

5. **Insight Filtering**:
   - User selects severity → `InsightFilters` → `UIStore.setInsightFilter(severity)`
   - Insights list filtered (Vue computed property)

---

## Data Validation Rules

### File Validation (AppStore)

```javascript
const FILE_SIZE_LIMIT = 2 * 1024 * 1024 * 1024; // 2GB
const SUPPORTED_EXTENSIONS = ['.ipa', '.apk', '.aab', '.xapk'];

function validateFile(file) {
  const errors = [];

  // Size check
  if (file.size > FILE_SIZE_LIMIT) {
    errors.push(`File size ${formatBytes(file.size)} exceeds 2GB limit`);
  }

  // Extension check
  const ext = file.name.substring(file.name.lastIndexOf('.'));
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    errors.push(`Unsupported file type "${ext}". Expected ${SUPPORTED_EXTENSIONS.join(', ')}`);
  }

  // Empty file check
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return errors;
}
```

### Analysis Data Validation (AnalysisStore)

```javascript
function validateAnalysisResult(result) {
  // Required fields
  if (!result.metadata || !result.breakdownTree) {
    throw new Error('Invalid analysis result: missing metadata or breakdown tree');
  }

  // Metadata validation
  if (!result.metadata.bundleId || !result.metadata.version) {
    throw new Error('Invalid metadata: missing bundleId or version');
  }

  // Tree validation (recursive)
  function validateNode(node) {
    if (typeof node.size !== 'number' || node.size < 0) {
      throw new Error(`Invalid node size: ${node.size}`);
    }
    if (node.type === 'directory' && !Array.isArray(node.children)) {
      throw new Error(`Directory node missing children: ${node.path}`);
    }
    if (node.children) {
      node.children.forEach(validateNode);
    }
  }

  validateNode(result.breakdownTree);
}
```

---

## JSDoc Type Definitions

Since TypeScript is removed, JSDoc annotations provide type hints for editors:

```javascript
/**
 * @typedef {Object} AppFile
 * @property {File} file - Browser File object
 * @property {string} name - File name
 * @property {number} size - File size in bytes
 * @property {'ipa'|'apk'|'aab'|'xapk'} type - File type
 * @property {number} uploadedAt - Upload timestamp
 */

/**
 * @typedef {Object} BreakdownNode
 * @property {string} name - Node name
 * @property {string} path - Full path
 * @property {number} size - Uncompressed size
 * @property {number} compressedSize - Compressed size
 * @property {number} percentage - Percentage of total
 * @property {'file'|'directory'} type - Node type
 * @property {string} category - File category
 * @property {BreakdownNode[]} [children] - Child nodes (directories only)
 */

/**
 * @typedef {Object} Insight
 * @property {string} id - Unique ID
 * @property {'critical'|'warning'|'info'} severity - Severity level
 * @property {'optimization'|'structure'|'compatibility'} category - Category
 * @property {string} title - Short title
 * @property {string} description - Detailed explanation
 * @property {string[]} affectedFiles - Affected file paths
 * @property {string} recommendation - Actionable advice
 * @property {number|null} estimatedSavings - Potential savings in bytes
 */
```

---

## State Persistence

**No persistence**: All state is in-memory only (per Constitution Principle I: Client-Side Privacy). When the user closes the browser tab, all data is discarded.

**Rationale**: App binaries contain sensitive intellectual property. Persisting to localStorage or IndexedDB would violate the privacy guarantee.

---

## Migration from Zustand to Pinia

### Key Differences

| Aspect | Zustand (React) | Pinia (Vue) |
|--------|-----------------|-------------|
| Store definition | `create((set) => ({...}))` | `defineStore('id', {state, actions})` |
| State access | `const file = useStore(s => s.currentFile)` | `const store = useStore(); const file = store.currentFile` |
| Reactivity | React hooks (`useState`, `useEffect`) | Vue reactivity (`ref`, `computed`, `watch`) |
| Derived state | Custom selector functions | Pinia `getters` |
| DevTools | Redux DevTools | Vue DevTools (built-in) |
| Testing | Mock Zustand store | Pinia `setActivePinia(createPinia())` |

### Migration Pattern Example

**Before (Zustand)**:

```javascript
// store/appStore.ts
import create from 'zustand';

const useAppStore = create((set) => ({
  currentFile: null,
  setCurrentFile: (file) => set({ currentFile: file }),
  clearCurrentFile: () => set({ currentFile: null })
}));

// Component usage
const currentFile = useAppStore(state => state.currentFile);
const setCurrentFile = useAppStore(state => state.setCurrentFile);
```

**After (Pinia)**:

```javascript
// stores/appStore.js
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    currentFile: null
  }),
  actions: {
    setCurrentFile(file) {
      this.currentFile = file;
    },
    clearCurrentFile() {
      this.currentFile = null;
    }
  }
});

// Component usage (with storeToRefs for reactivity)
import { storeToRefs } from 'pinia';
const appStore = useAppStore();
const { currentFile } = storeToRefs(appStore);
const { setCurrentFile } = appStore;
```

---

## Summary

- **No schema changes**: Data model remains identical to React version
- **3 Pinia stores**: `appStore`, `analysisStore`, `uiStore` (maps 1:1 with existing Zustand stores)
- **No persistence**: All state in-memory (privacy requirement)
- **JSDoc types**: Type hints for editors without TypeScript
- **Validation**: Client-side validation for file uploads and parsed data

**Next Phase**: Generate contracts/ for component prop interfaces and Web Worker APIs.
