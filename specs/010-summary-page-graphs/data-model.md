# Data Model: Summary Page with Size Distribution Graphs

**Feature**: 010-summary-page-graphs | **Date**: 2025-11-12 | **Phase**: 1

## Overview

This document defines the data entities, transformations, and relationships for the Summary page feature. The Summary page aggregates data from the existing AnalysisContext breakdown tree to produce chart-ready data structures.

**Key Principle**: No new persistent entities. All data is derived transformations of existing AnalysisContext data, computed on-demand.

---

## Existing Entities (Read-Only)

### AnalysisContext
**Location**: `src/types/analysis.js` (type definition), `src/stores/analysisStore.js` (state)

**Purpose**: Root entity containing all parsed binary analysis data

**Structure**:
```javascript
{
  fileId: string,                     // UUID v4
  timestamp: Date,                    // Parse timestamp
  platform: 'iOS' | 'Android',        // Platform type
  appName: string,                    // App display name
  bundleId: string,                   // iOS: CFBundleIdentifier, Android: package name
  version: string,                    // Version string
  totalInstallSize: number,           // Total uncompressed size in bytes
  totalDownloadSize: number | null,   // Compressed size (iOS only, null for Android)
  breakdownRoot: BreakdownNode,       // Root of file tree
  frameworks: string[],               // Node IDs of iOS frameworks
  assets: string[],                   // Node IDs of asset files
  localizations: string[],            // Node IDs of localization directories
  executables: string[],              // Node IDs of executable files
  nativeLibraries: string[],          // Node IDs of Android .so files
  dexFiles: string[],                 // Node IDs of Android DEX files
  modules: string[],                  // Node IDs of Android AAB modules
  allFiles: FileEntry[],              // Flat list of all files (for search/filter)
  metadata: {                         // Additional metadata
    platform: string,
    bundleId: string,
    version: string,
    buildNumber?: string,
    minOSVersion?: string,
    architectures?: string[]
  }
}
```

**Relationships**:
- `breakdownRoot` → BreakdownNode (root of tree)
- `frameworks`, `assets`, etc. → BreakdownNode IDs (references into tree)

### BreakdownNode
**Location**: `src/types/analysis.js`

**Purpose**: Hierarchical tree node representing a file or directory in the analyzed binary

**Structure**:
```javascript
{
  id: string,                         // Unique node ID (UUID or path-based)
  name: string,                       // Display name (e.g., "AppDelegate.swift", "Payload")
  path: string,                       // Full path in archive (e.g., "Payload/MyApp.app/AppDelegate.o")
  size: number,                       // Uncompressed size in bytes
  compressedSize: number | null,      // Compressed size (iOS only, null for Android/directories)
  type: ContentType,                  // One of 15 content type enums
  parent: string | null,              // Parent node ID (null for root)
  children: BreakdownNode[],          // Child nodes (empty array for files)
  metadata: {                         // Optional metadata
    fileCount?: number,               // Number of files in subtree (directories only)
    duplicates?: string[],            // Node IDs of duplicate files
    encoding?: string,                // Text encoding (text files only)
    architecture?: string[]           // CPU architectures (native binaries only)
  }
}
```

**Relationships**:
- `parent` → BreakdownNode ID (references parent node)
- `children` → BreakdownNode[] (contains child nodes)
- `type` → ContentType enum

**Key Properties**:
- **Leaf nodes** (files): `children.length === 0`, `size > 0`
- **Directory nodes**: `children.length > 0`, `size === sum(children[].size)`
- **Root node**: `parent === null`

### ContentType (Enum)
**Location**: `src/types/analysis.js`

**Purpose**: Categorizes files into 15 types for analysis and visualization

**Values**:
```javascript
'framework'      // iOS frameworks, system libraries
'bundle'         // iOS .bundle resources
'executable'     // Mach-O executables, binaries
'dex'            // Android DEX files (classes.dex, classes2.dex, ...)
'native_lib'     // Android .so native libraries
'resource'       // iOS .nib, .storyboard, Android XML resources
'asset'          // Generic asset files
'image'          // PNG, JPG, JPEG, GIF, WebP, HEIC, SVG, ...
'video'          // MP4, MOV, AVI, ...
'audio'          // MP3, AAC, WAV, ...
'font'           // TTF, OTF, WOFF, ...
'localization'   // iOS .strings, .lproj; Android res/values-{locale}
'data'           // JSON, XML, SQLite, Realm, ...
'config'         // Plist, YAML, TOML, ...
'other'          // Recognized but uncategorized
'unknown'        // Unrecognized file types
```

**Usage**: Drives color mapping, aggregation, and filtering throughout the app

---

## Derived Entities (Computed On-Demand)

### CategoryAggregation
**Purpose**: Aggregated size, count, and compression data for a category

**Structure**:
```javascript
{
  category: string,                   // Display category name (e.g., "Frameworks", "Media Assets")
  contentTypes: string[],             // ContentTypes included in this category
  size: number,                       // Total uncompressed size in bytes
  compressedSize: number | null,      // Total compressed size (iOS only, null for Android)
  count: number,                      // Number of files in this category
  percentage: number,                 // Percentage of total app size (0-100)
  color: string                       // Hex color for chart display
}
```

**Computed By**: `aggregateFilesByType(breakdownRoot, platform)` in `src/utils/calculations.js`

**Example**:
```javascript
{
  category: "Frameworks",
  contentTypes: ["framework", "bundle"],
  size: 45000000,              // 45 MB
  compressedSize: 12000000,    // 12 MB (iOS only)
  count: 8,                    // 8 framework files
  percentage: 42.5,            // 42.5% of total app
  color: "#3b82f6"             // Blue
}
```

### ComponentAggregation
**Purpose**: Aggregated data for Internal vs External components

**Structure**:
```javascript
{
  internal: {
    category: "Internal",            // First-party code
    size: number,                    // Uncompressed size
    compressedSize: number | null,   // Compressed size (iOS only)
    count: number,                   // File count
    percentage: number,              // Percentage of total
    color: string                    // Chart color
  },
  external: {
    category: "External",            // Third-party dependencies
    size: number,
    compressedSize: number | null,
    count: number,
    percentage: number,
    color: string
  }
}
```

**Computed By**: `aggregateByComponent(breakdownRoot, platform)` in `src/utils/calculations.js`

**Classification Rules**:

**iOS Internal**:
- Paths NOT starting with `Frameworks/`
- Paths NOT containing `/System/Library/`
- Executables with app bundle ID

**iOS External**:
- Paths starting with `Frameworks/` (e.g., `Frameworks/ReactNative.framework`)
- System frameworks (detected via path analysis)

**Android Internal**:
- DEX files (app code): `classes.dex`, `classes2.dex`, etc.
- App resources: `res/`, `assets/` (excluding third-party assets)

**Android External**:
- Native libraries: `lib/*/` directories containing `.so` files
- Third-party assets (detected via path heuristics, e.g., `/firebase/`, `/google/`)

### FileEntry
**Purpose**: Flattened file representation for "Top N Files" chart

**Structure**:
```javascript
{
  path: string,                       // Full path in archive
  name: string,                       // Display name (filename only)
  size: number,                       // Uncompressed size
  compressedSize: number | null,      // Compressed size (iOS only)
  type: ContentType,                  // File type
  percentage: number,                 // Percentage of total app size
  color: string                       // Type-based color
}
```

**Computed By**: `getTopFiles(breakdownRoot, count)` in `src/utils/calculations.js`

**Example**:
```javascript
{
  path: "Payload/MyApp.app/Frameworks/ReactNative.framework/ReactNative",
  name: "ReactNative",
  size: 12000000,              // 12 MB
  compressedSize: 3000000,     // 3 MB
  type: "framework",
  percentage: 11.3,
  color: "#3b82f6"
}
```

### CompressionAnalysis
**Purpose**: Compression efficiency data per category (iOS only)

**Structure**:
```javascript
{
  category: string,                   // Category name
  uncompressed: number,               // Uncompressed size
  compressed: number,                 // Compressed size
  ratio: number,                      // Compression ratio (0-1, where 0.5 = 50% compression)
  percentage: number,                 // Compression percentage (0-100, where 50 = 50% reduction)
  color: string                       // Category color
}
```

**Computed By**: `analyzeCompressionByType(breakdownRoot)` in `src/utils/calculations.js`

**Formula**:
```javascript
ratio = compressed / uncompressed
percentage = (1 - ratio) * 100
```

**Example**:
```javascript
{
  category: "Frameworks",
  uncompressed: 45000000,      // 45 MB
  compressed: 12000000,        // 12 MB
  ratio: 0.267,                // 26.7% of original size
  percentage: 73.3,            // 73.3% compression achieved
  color: "#3b82f6"
}
```

### LocalizationEntry
**Purpose**: Size contribution per language/locale

**Structure**:
```javascript
{
  locale: string,                     // Locale code (e.g., "en", "es", "zh-Hans")
  displayName: string,                // Display name (e.g., "English", "Spanish")
  size: number,                       // Total size of localization files
  count: number,                      // Number of localized files
  percentage: number,                 // Percentage of total app size
  color: string                       // Auto-generated color
}
```

**Computed By**: `analyzeLocalizations(breakdownRoot, platform)` in `src/utils/calculations.js`

**Detection Rules**:
- **iOS**: Directories ending with `.lproj` (e.g., `en.lproj`, `Base.lproj`)
- **Android**: Directories matching `res/values-{locale}` (e.g., `res/values-es`, `res/values-zh-rCN`)

**Example**:
```javascript
{
  locale: "en",
  displayName: "English",
  size: 2500000,               // 2.5 MB
  count: 45,                   // 45 localized strings/resources
  percentage: 2.4,
  color: "#3b82f6"
}
```

### ArchitectureEntry
**Purpose**: Size breakdown per CPU architecture (Android only)

**Structure**:
```javascript
{
  architecture: string,               // Architecture name (e.g., "arm64-v8a", "armeabi-v7a")
  displayName: string,                // Display name (e.g., "ARM64", "ARMv7")
  size: number,                       // Total size of libraries for this arch
  count: number,                      // Number of .so files
  percentage: number,                 // Percentage of total app size
  color: string                       // Auto-generated color
}
```

**Computed By**: `analyzeArchitectures(breakdownRoot)` in `src/utils/calculations.js`

**Detection Rules**:
- Parse paths: `lib/{arch}/lib{name}.so`
- Supported architectures:
  - `arm64-v8a` → "ARM64 (64-bit)"
  - `armeabi-v7a` → "ARMv7 (32-bit)"
  - `x86` → "x86 (32-bit)"
  - `x86_64` → "x86-64 (64-bit)"

**Example**:
```javascript
{
  architecture: "arm64-v8a",
  displayName: "ARM64 (64-bit)",
  size: 8500000,               // 8.5 MB
  count: 12,                   // 12 .so files
  percentage: 8.0,
  color: "#3b82f6"
}
```

### AssetTypeAggregation
**Purpose**: Media asset breakdown (images, videos, audio, fonts)

**Structure**:
```javascript
{
  assetType: string,                  // "Images", "Videos", "Audio", "Fonts"
  contentType: ContentType,           // Underlying ContentType enum value
  size: number,                       // Total size
  compressedSize: number | null,      // Compressed size (iOS only)
  count: number,                      // File count
  percentage: number,                 // Percentage of total app size
  color: string                       // Type-based color
}
```

**Computed By**: `categorizeAssetTypes(breakdownRoot)` in `src/utils/calculations.js`

**Mapping**:
- Images → `type === 'image'` → #14b8a6 (teal)
- Videos → `type === 'video'` → #f97316 (orange)
- Audio → `type === 'audio'` → #a855f7 (purple)
- Fonts → `type === 'font'` → #84cc16 (lime)

**Example**:
```javascript
{
  assetType: "Images",
  contentType: "image",
  size: 15000000,              // 15 MB
  compressedSize: 12000000,    // 12 MB (iOS only)
  count: 342,                  // 342 image files
  percentage: 14.2,
  color: "#14b8a6"
}
```

---

## Chart Data Structures

### BarChartData
**Purpose**: Generic structure for ECharts bar/column charts

**Structure**:
```javascript
{
  categories: string[],               // X-axis labels (e.g., ["Frameworks", "Executables", ...])
  series: [
    {
      name: string,                   // Series name (e.g., "Install Size", "Download Size")
      data: number[],                 // Y-axis values (aligned with categories)
      colors: string[]                // Bar colors (aligned with categories)
    }
  ]
}
```

**Used By**: FileTypeDistributionChart, FileCountDistributionChart, ComponentDistributionChart

**Example** (File Type Size - iOS with dual series):
```javascript
{
  categories: ["Frameworks", "Executables", "Resources", "Media Assets"],
  series: [
    {
      name: "Install Size",
      data: [45000000, 8000000, 12000000, 15000000],
      colors: ["#3b82f6", "#ef4444", "#06b6d4", "#14b8a6"]
    },
    {
      name: "Download Size",
      data: [12000000, 6000000, 10000000, 12000000],
      colors: ["#3b82f6", "#ef4444", "#06b6d4", "#14b8a6"]
    }
  ]
}
```

### HorizontalBarChartData
**Purpose**: Structure for horizontal bar charts (e.g., Top 10 Files)

**Structure**:
```javascript
{
  items: [
    {
      name: string,                   // Item label (e.g., file name)
      value: number,                  // Size in bytes
      color: string,                  // Bar color
      tooltip?: string                // Optional custom tooltip
    }
  ]
}
```

**Used By**: TopFilesChart

**Example**:
```javascript
{
  items: [
    {
      name: "ReactNative.framework/ReactNative",
      value: 12000000,
      color: "#3b82f6",
      tooltip: "Frameworks/ReactNative.framework/ReactNative (11.3%)"
    },
    {
      name: "background_video.mp4",
      value: 8500000,
      color: "#f97316",
      tooltip: "assets/videos/background_video.mp4 (8.0%)"
    }
    // ... 8 more items
  ]
}
```

### StackedBarChartData
**Purpose**: Structure for stacked bar charts (e.g., Compression Efficiency)

**Structure**:
```javascript
{
  categories: string[],               // Category labels
  series: [
    {
      name: string,                   // Stack segment name (e.g., "Compressed", "Removed")
      data: number[],                 // Values per category
      stack: string,                  // Stack group ID (same value = stacked together)
      color: string                   // Segment color
    }
  ]
}
```

**Used By**: CompressionEfficiencyChart

**Example**:
```javascript
{
  categories: ["Frameworks", "Executables", "Resources"],
  series: [
    {
      name: "Compressed Size",
      data: [12000000, 6000000, 10000000],
      stack: "total",
      color: "#10b981"    // Green (good - small)
    },
    {
      name: "Removed by Compression",
      data: [33000000, 2000000, 2000000],
      stack: "total",
      color: "#94a3b8"    // Gray (removed bytes)
    }
  ]
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│ AnalysisContext (Pinia Store)           │
│  - platform: 'iOS' | 'Android'          │
│  - totalInstallSize, totalDownloadSize  │
│  - breakdownRoot: BreakdownNode         │
└───────────────┬─────────────────────────┘
                │
                │ (read from computed properties)
                ↓
┌────────────────────────────────────────────────────────┐
│ Aggregation Functions (utils/calculations.js)         │
│  - aggregateFilesByType()                              │
│  - aggregateByComponent()                              │
│  - getTopFiles()                                       │
│  - analyzeCompressionByType()                          │
│  - analyzeLocalizations()                              │
│  - analyzeArchitectures()                              │
│  - categorizeAssetTypes()                              │
└───────────────┬────────────────────────────────────────┘
                │
                │ (returns derived entities)
                ↓
┌────────────────────────────────────────────────────────┐
│ Derived Entities (computed on-demand)                 │
│  - CategoryAggregation[]                               │
│  - ComponentAggregation                                │
│  - FileEntry[]                                         │
│  - CompressionAnalysis[]                               │
│  - LocalizationEntry[]                                 │
│  - ArchitectureEntry[]                                 │
│  - AssetTypeAggregation[]                              │
└───────────────┬────────────────────────────────────────┘
                │
                │ (transformed by chart option builders)
                ↓
┌────────────────────────────────────────────────────────┐
│ Chart Data Structures (utils/chart-options.js)        │
│  - BarChartData                                        │
│  - HorizontalBarChartData                              │
│  - StackedBarChartData                                 │
└───────────────┬────────────────────────────────────────┘
                │
                │ (passed to ECharts components)
                ↓
┌────────────────────────────────────────────────────────┐
│ Vue Chart Components (components/summary/)             │
│  - FileTypeDistributionChart.vue                       │
│  - FileCountDistributionChart.vue                      │
│  - ComponentDistributionChart.vue                      │
│  - CompressionEfficiencyChart.vue                      │
│  - TopFilesChart.vue                                   │
│  - LocalizationImpactChart.vue                         │
│  - ArchitectureBreakdownChart.vue                      │
│  - AssetTypeDistributionChart.vue                      │
└────────────────────────────────────────────────────────┘
                │
                │ (renders via vue-echarts)
                ↓
┌────────────────────────────────────────────────────────┐
│ ECharts Canvas Rendering                               │
│  - Interactive bar charts                              │
│  - Tooltips, legends, responsive layout                │
└────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### CategoryAggregation
- `category`: Non-empty string
- `size`: Non-negative number
- `compressedSize`: Non-negative number or null (null for Android)
- `count`: Non-negative integer
- `percentage`: 0 ≤ percentage ≤ 100
- `color`: Valid hex color (e.g., "#3b82f6")

**Invariants**:
- Sum of all `percentage` values ≈ 100% (allow ±0.1% for rounding)
- Sum of all `size` values === `totalInstallSize` (from AnalysisContext)
- If platform is iOS and compressedSize exists: sum of `compressedSize` ≈ `totalDownloadSize`

### ComponentAggregation
- `internal.size + external.size === totalInstallSize`
- `internal.count + external.count === total file count`
- Both `internal.percentage` and `external.percentage` sum to 100%

### FileEntry (Top Files)
- Array length ≤ requested count (e.g., 10 for "Top 10")
- Sorted by `size` descending (largest first)
- All `size` values > 0

### CompressionAnalysis (iOS only)
- `compressed < uncompressed` (compression must reduce size)
- `0 < ratio < 1` (ratio of 1 = no compression, 0 = perfect compression)
- `0 < percentage < 100` (percentage removed)

### LocalizationEntry
- `locale`: Valid locale code (ISO 639-1 or IETF BCP 47)
- `size > 0` (empty localizations filtered out)
- `count > 0`

### ArchitectureEntry (Android only)
- `architecture`: One of ["arm64-v8a", "armeabi-v7a", "x86", "x86_64"]
- `size > 0`
- `count > 0` (at least one .so file)

### AssetTypeAggregation
- `assetType`: One of ["Images", "Videos", "Audio", "Fonts"]
- `contentType`: Matching ContentType enum value
- `size > 0` (empty categories filtered out)

---

## State Transitions

**Summary page data has NO state transitions**. All data is computed on-demand from immutable AnalysisContext.

### Lifecycle:
1. **User uploads binary** → Parser creates AnalysisContext → Stored in analysisStore
2. **User navigates to Summary view** → Computed properties trigger aggregation functions → Derive entities computed
3. **Charts render** → Chart option builders transform derived entities → ECharts renders
4. **User navigates away** → No state persisted (data recomputed on return)
5. **User uploads new binary** → Old AnalysisContext replaced → All derived entities invalidated and recomputed

**Key Property**: Derived entities are **always fresh** because Vue computed properties reactively depend on `analysisStore.currentAnalysis`.

---

## Performance Considerations

### Aggregation Complexity
- **Tree traversal**: O(n) where n = number of nodes in breakdown tree
- **Typical app**: 1,000 - 10,000 nodes
- **Expected time**: 10-50ms per aggregation on modern hardware

### Memory Footprint
- **AnalysisContext**: Already in memory (200KB - 5MB depending on app complexity)
- **Derived entities**: Lightweight (1-10KB per aggregation)
- **Chart data structures**: Minimal (a few KB per chart)
- **Total additional memory**: <100KB for all Summary page data

### Optimization Strategies
1. **Lazy computation**: Only compute aggregations for visible charts
2. **Vue computed caching**: Computed properties cache results until dependencies change
3. **No persistent cache needed**: User rarely views Summary page multiple times per analysis
4. **ECharts canvas rendering**: Non-blocking, 60 FPS even with large datasets

---

## Summary

**Entities Added**: 0 persistent entities (all derived)
**Aggregation Functions**: 7 new functions in `utils/calculations.js`
**Chart Data Transformers**: 4 new builder functions in `utils/chart-options.js`
**Data Flow**: AnalysisContext → Aggregation → Derived Entities → Chart Data → ECharts Components
**Performance**: <500ms total aggregation time for 10,000 file tree, <1s chart rendering
