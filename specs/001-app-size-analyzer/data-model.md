# Data Model: App Size Analysis Tool

**Feature**: 001-app-size-analyzer
**Date**: 2025-11-07
**Purpose**: Define core entities, relationships, and state management for binary analysis

---

## Overview

The data model centers around a single `AnalysisContext` entity that aggregates all parsed data from a binary file. The model is entirely in-memory (no persistence layer) and optimized for client-side processing.

**Key Principles:**
- Immutable data structures (functional updates only)
- Hierarchical tree structures for breakdown nodes
- Lazy computation for expensive operations (insights, hashing)
- Type-safe interfaces with strict TypeScript

---

## Core Entities

### 1. AnalysisContext

**Purpose**: Root entity containing all analysis data for a single binary file.

**Lifecycle**: Created during parsing, stored in Zustand state, cleared on new upload.

```typescript
interface AnalysisContext {
  // Identification
  fileId: string;                    // UUID v4
  timestamp: Date;                   // Analysis timestamp

  // Binary metadata
  platform: 'iOS' | 'Android';
  appName: string;
  bundleId: string;                  // iOS: bundleIdentifier, Android: packageName
  version: string;
  versionCode?: number;              // Android only

  // Size metrics
  totalInstallSize: number;          // Uncompressed size in bytes
  totalDownloadSize: number;         // Compressed size (actual file size)

  // Hierarchical structure
  breakdownRoot: BreakdownNode;      // Root of file tree

  // Categorized content
  frameworks: Framework[];            // iOS only
  assets: Asset[];
  localizations: Localization[];
  executables: ExecutableMetadata[];
  nativeLibraries: NativeLib[];      // Android only
  dexFiles: DEXMetadata[];           // Android only
  modules: APKModule[];              // Android AAB only

  // Analysis artifacts
  allFiles: FileEntry[];             // Flat list for search/filter
  fileHashes: Map<string, string>;   // path -> SHA-256 hash (lazy computed)

  // Insights (lazy computed)
  insights: InsightResult[];

  // Build metadata
  buildType?: 'debug' | 'release' | 'unknown';
  compilerOptimization?: 'none' | 'O0' | 'Os' | 'O2' | 'Oz';
}
```

**Relationships:**
- 1:1 with uploaded File object
- 1:1 with BreakdownNode (root)
- 1:Many with FileEntry, Asset, Framework, etc.
- 1:Many with InsightResult (computed on demand)

**Validation Rules:**
- `fileId` must be unique UUID
- `platform` must be either 'iOS' or 'Android'
- `totalInstallSize` >= `totalDownloadSize` (compressed is smaller)
- `breakdownRoot.size` must equal `totalInstallSize` (±1% tolerance)
- All child entity sizes must sum to parent size

---

### 2. BreakdownNode

**Purpose**: Hierarchical tree node representing a file, directory, framework, or module.

**Structure**: Recursive tree with parent-child relationships.

```typescript
interface BreakdownNode {
  id: string;                        // Unique ID (UUID or path-based)
  name: string;                      // Display name (filename or component name)
  path: string;                      // Full path in archive
  size: number;                      // Total size in bytes (sum of children if directory)
  compressedSize?: number;           // Compressed size (if applicable)
  type: ContentType;
  parent?: string;                   // Parent node ID (null for root)
  children: BreakdownNode[];         // Child nodes (empty for files)

  metadata?: {
    fileCount?: number;              // Number of descendant files
    duplicates?: string[];           // IDs of duplicate nodes
    encoding?: string;               // File encoding (UTF-8, binary, etc.)
    architecture?: string[];         // For executables: arm64, x86_64, etc.
  };
}

type ContentType =
  | 'framework'      // iOS framework (.framework)
  | 'bundle'         // iOS bundle (.bundle)
  | 'executable'     // iOS/Android executable binary
  | 'dex'            // Android DEX file
  | 'native_lib'     // Android native library (.so)
  | 'resource'       // Android resource
  | 'image'          // Image file
  | 'video'          // Video file
  | 'font'           // Font file
  | 'localization'   // Localization file (.lproj, strings.xml)
  | 'data'           // Data file (JSON, XML, etc.)
  | 'config'         // Configuration file
  | 'unknown';       // Unrecognized type
```

**Tree Operations:**
- **Find by Path**: O(log n) with path index
- **Calculate Subtree Size**: Recursive sum of children
- **Flatten Tree**: DFS traversal to flat array
- **Filter by Type**: Recursive filter preserving hierarchy

**Validation Rules:**
- Root node must have `parent = null`
- All non-root nodes must have valid `parent` ID
- `size` must equal sum of children sizes (for directories)
- No circular references (parent cannot be descendant)
- `children` array must be empty for file types

---

### 3. Framework (iOS)

**Purpose**: Represents an iOS framework with architecture details.

```typescript
interface Framework {
  id: string;
  name: string;                      // Framework name (e.g., "UIKit")
  path: string;                      // Path in bundle
  size: number;                      // Total framework size
  type: 'dynamic' | 'static' | 'system';
  arch: string[];                    // Architectures: arm64, x86_64, etc.
  subFrameworks?: Framework[];       // Nested frameworks

  metadata?: {
    version?: string;                // Framework version
    minOSVersion?: string;           // Minimum OS version
    hasDebugSymbols?: boolean;       // Contains debug symbols
  };
}
```

**Detection Logic:**
- Located in `Frameworks/` directory
- Contains executable binary with Mach-O header
- Type determined by link type in load commands

---

### 4. Asset

**Purpose**: Represents media files (images, videos, fonts) with encoding metadata.

```typescript
interface Asset {
  id: string;
  name: string;                      // Asset name
  path: string;                      // Full path in archive
  size: number;                      // File size in bytes
  type: 'image' | 'video' | 'font' | 'data' | 'localization' | 'bundle';

  // Image-specific
  encoding?: 'PNG' | 'JPEG' | 'HEIF' | 'WEBP' | 'GIF' | 'SVG';
  resolution?: '1x' | '2x' | '3x' | '@2x' | '@3x';  // iOS retina scales
  dimensions?: { width: number; height: number };

  // Video-specific
  codec?: string;                    // H.264, H.265, VP9, etc.
  duration?: number;                 // Duration in seconds

  // Font-specific
  fontFamily?: string;
  fontWeight?: string;

  metadata?: {
    isOptimized?: boolean;           // Has been compressed
    compressionRatio?: number;       // Actual / theoretical size
    inAssetCatalog?: boolean;        // iOS: in .xcassets
  };
}
```

**Detection Logic:**
- Images: `.png`, `.jpg`, `.jpeg`, `.heif`, `.webp`, `.gif`, `.svg`
- Videos: `.mp4`, `.mov`, `.m4v`, `.avi`
- Fonts: `.ttf`, `.otf`, `.woff`, `.woff2`

---

### 5. DEXMetadata (Android)

**Purpose**: Metadata for Android DEX files containing Java bytecode.

```typescript
interface DEXMetadata {
  id: string;
  name: string;                      // e.g., "classes.dex", "classes2.dex"
  path: string;
  size: number;

  // DEX structure
  methodCount: number;               // Total methods defined
  classCount: number;                // Total classes defined
  stringPoolSize: number;            // Size of string pool
  typeCount: number;                 // Number of types

  // Optional proguard mapping
  proguardMapping?: Map<string, string>;  // obfuscated -> original

  metadata?: {
    version?: string;                // DEX format version
    hasMultidex?: boolean;           // Part of multidex setup
  };
}
```

**Parsing Source**: Parsed from DEX file header using Kaitai Struct.

---

### 6. NativeLib (Android)

**Purpose**: Native compiled libraries (.so files) in Android APKs.

```typescript
interface NativeLib {
  id: string;
  name: string;                      // Library name (e.g., "libnative.so")
  path: string;                      // Path in APK (lib/arm64-v8a/libnative.so)
  size: number;
  architecture: 'armeabi-v7a' | 'arm64-v8a' | 'x86' | 'x86_64';

  metadata?: {
    symbols?: string[];              // Exported symbols
    hasDebugSymbols?: boolean;
    isStripped?: boolean;            // Symbols stripped
  };
}
```

**Detection Logic:**
- Located in `lib/[architecture]/` directories
- File extension `.so`
- Architecture determined by parent directory

---

### 7. Localization

**Purpose**: Language-specific resource bundles.

```typescript
interface Localization {
  id: string;
  language: string;                  // Language code (en, es, zh-Hans, etc.)
  path: string;                      // Path to .lproj (iOS) or values-[lang] (Android)
  size: number;                      // Total size of all localized resources
  stringCount: number;               // Number of localized strings

  strings: LocalizedString[];

  metadata?: {
    duplicateRatio?: number;         // Percentage of duplicate strings
    unusedCount?: number;            // Estimated unused strings
    isBase?: boolean;                // Is base/fallback language
  };
}

interface LocalizedString {
  key: string;
  value: string;
  size: number;                      // Size in bytes
}
```

**Detection Logic:**
- iOS: `.lproj` directories
- Android: `res/values-[lang]` directories

---

### 8. InsightRule & InsightResult

**Purpose**: Rule-based analysis and recommendations.

```typescript
interface InsightRule {
  id: string;                        // e.g., "R001"
  category: InsightCategory;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Execution function
  execute: (context: AnalysisContext) => InsightResult[];

  metadata?: {
    examples?: string[];
    documentation?: string;
    fixable?: boolean;               // Can be auto-fixed
  };
}

type InsightCategory =
  | 'duplicates'        // Duplicate files
  | 'optimization'      // Asset optimization opportunities
  | 'unused'            // Unused resources
  | 'over-bundling'     // Excessive bundling
  | 'compression'       // Compression opportunities
  | 'architecture';     // Multi-arch bloat

interface InsightResult {
  ruleId: string;                    // Reference to InsightRule.id
  title: string;                     // Display title
  description: string;               // Detailed description
  severity: 'critical' | 'high' | 'medium' | 'low';

  affectedItems: AffectedItem[];
  potentialSavings: number;          // Estimated bytes saved
  percentOfTotal: number;            // Percentage of total app size

  actionable: boolean;               // Can user take action
  fixSuggestion?: string;            // How to fix
}

interface AffectedItem {
  path: string;                      // File path
  size: number;                      // File size
  reason: string;                    // Why it's flagged
}
```

**Rule Execution:**
- Rules executed on-demand (not during parsing)
- Cached after first execution
- Re-run if context changes

---

### 9. FileEntry

**Purpose**: Flat list representation of all files for search/filter.

```typescript
interface FileEntry {
  path: string;                      // Unique path in archive
  size: number;
  compressedSize?: number;
  type: ContentType;
  encoding?: string;
  content?: Uint8Array;              // Lazy-loaded for hashing

  metadata?: {
    lastModified?: Date;
    permissions?: string;
    owner?: string;
  };
}
```

**Index Structure:**
- Primary index: `Map<string, FileEntry>` (path -> entry)
- Secondary index: `Map<ContentType, FileEntry[]>` (type -> entries)

---

## State Management (Zustand)

### Store Structure

```typescript
interface AnalysisStore {
  // Current analysis
  currentAnalysis: AnalysisContext | null;

  // UI state
  isLoading: boolean;
  loadingProgress: number;           // 0-100
  loadingStatus: string;             // Current operation description
  error: string | null;
  currentView: 'upload' | 'breakdown' | 'xray' | 'insights';

  // Breakdown view state
  breakdownExpandedNodes: Set<string>;  // Node IDs
  breakdownSearchQuery: string;
  breakdownFilter: {
    type?: ContentType;
    minSize?: number;
    maxSize?: number;
  };
  breakdownSortBy: 'size' | 'name' | 'type';
  breakdownSortOrder: 'asc' | 'desc';

  // X-Ray view state
  xrayZoomPath: string | null;       // Current zoomed subtree path
  xrayCategories: Set<ContentType>;  // Visible categories
  xraySearchQuery: string;

  // Insights view state
  insightsSeverityFilter: Set<'critical' | 'high' | 'medium' | 'low'>;
  insightsCategoryFilter: Set<InsightCategory>;

  // Actions
  uploadBinary: (file: File) => Promise<void>;
  setCurrentView: (view: string) => void;
  clearAnalysis: () => void;
  toggleBreakdownNode: (nodeId: string) => void;
  setBreakdownSearch: (query: string) => void;
  setBreakdownFilter: (filter: BreakdownFilter) => void;
  setBreakdownSort: (sortBy: string, order: string) => void;
  setXRayZoom: (path: string | null) => void;
  toggleXRayCategory: (category: ContentType) => void;
  setInsightsSeverityFilter: (severities: Set<string>) => void;
  setInsightsCategoryFilter: (categories: Set<InsightCategory>) => void;
}
```

### State Flow

```
User Action (Upload File)
  ↓
uploadBinary() action
  ↓
Set isLoading = true
  ↓
Web Worker parses binary
  ↓
Progress updates via callbacks
  ↓
Parse result → create AnalysisContext
  ↓
Set currentAnalysis, isLoading = false
  ↓
Switch to 'breakdown' view
  ↓
UI re-renders with analysis data
```

---

## Data Transformations

### 1. ZIP Archive → FileEntry[]

```typescript
async function extractArchive(file: File): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const unzipper = new Unzip((file) => {
    entries.push({
      path: file.name,
      size: file.originalSize,
      compressedSize: file.compressedSize,
      type: detectType(file.name),
      content: new Uint8Array(file.buffer)
    });
  });

  // Stream file through unzipper
  const reader = file.stream().getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    unzipper.push(value, false);
  }
  unzipper.push(new Uint8Array(), true);

  return entries;
}
```

### 2. FileEntry[] → BreakdownNode Tree

```typescript
function buildTree(entries: FileEntry[]): BreakdownNode {
  const root: BreakdownNode = {
    id: 'root',
    name: 'Root',
    path: '',
    size: 0,
    type: 'bundle',
    children: []
  };

  entries.forEach(entry => {
    const parts = entry.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      let child = current.children.find(c => c.name === part);
      if (!child) {
        child = {
          id: generateId(),
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          size: isFile ? entry.size : 0,
          type: isFile ? entry.type : 'bundle',
          parent: current.id,
          children: []
        };
        current.children.push(child);
      }

      if (!isFile) {
        child.size += entry.size;  // Accumulate size for directories
      }

      current = child;
    }
  });

  root.size = entries.reduce((sum, e) => sum + e.size, 0);
  return root;
}
```

### 3. BreakdownNode → Treemap Data

```typescript
function toTreemapData(node: BreakdownNode): TreemapData {
  return {
    name: node.name,
    value: node.size,
    children: node.children.map(toTreemapData),
    color: calculateHeatmapColor(node.size, totalSize),
    path: node.path
  };
}
```

---

## Validation & Integrity

### Size Validation

```typescript
function validateSizes(context: AnalysisContext): ValidationResult {
  const errors: string[] = [];

  // Check: breakdown total equals install size
  const breakdownTotal = context.breakdownRoot.size;
  const tolerance = context.totalInstallSize * 0.01;  // 1% tolerance
  if (Math.abs(breakdownTotal - context.totalInstallSize) > tolerance) {
    errors.push(
      `Breakdown total (${breakdownTotal}) doesn't match install size (${context.totalInstallSize})`
    );
  }

  // Check: sum of categorized content <= total
  const categorizedTotal =
    context.frameworks.reduce((sum, f) => sum + f.size, 0) +
    context.assets.reduce((sum, a) => sum + a.size, 0) +
    context.dexFiles.reduce((sum, d) => sum + d.size, 0);

  if (categorizedTotal > context.totalInstallSize) {
    errors.push(`Categorized content exceeds total size`);
  }

  return { valid: errors.length === 0, errors };
}
```

### Tree Integrity

```typescript
function validateTree(node: BreakdownNode): ValidationResult {
  const errors: string[] = [];
  const visited = new Set<string>();

  function traverse(n: BreakdownNode, ancestors: Set<string>) {
    // Check for cycles
    if (ancestors.has(n.id)) {
      errors.push(`Cycle detected at node ${n.id}`);
      return;
    }

    // Check for duplicates
    if (visited.has(n.id)) {
      errors.push(`Duplicate node ID ${n.id}`);
      return;
    }

    visited.add(n.id);
    ancestors.add(n.id);

    // Check: children size sum equals node size (for directories)
    if (n.children.length > 0) {
      const childrenSum = n.children.reduce((sum, c) => sum + c.size, 0);
      if (Math.abs(childrenSum - n.size) > 1) {  // Allow 1 byte rounding
        errors.push(`Node ${n.id}: children sum doesn't match node size`);
      }
    }

    // Recurse
    n.children.forEach(child => traverse(child, new Set(ancestors)));
    ancestors.delete(n.id);
  }

  traverse(node, new Set());
  return { valid: errors.length === 0, errors };
}
```

---

## Performance Optimizations

### 1. Lazy Hash Computation

```typescript
// Only compute hashes when insights are requested
class LazyHashMap {
  private hashes = new Map<string, string>();
  private computed = new Set<string>();

  async get(path: string, content: Uint8Array): Promise<string> {
    if (!this.computed.has(path)) {
      const hash = await sha256(content);
      this.hashes.set(path, hash);
      this.computed.add(path);
    }
    return this.hashes.get(path)!;
  }
}
```

### 2. Virtual Scrolling Data

```typescript
// Only materialize visible rows
function getVisibleRows(
  rows: BreakdownNode[],
  startIndex: number,
  endIndex: number
): BreakdownNode[] {
  return rows.slice(startIndex, endIndex);
}
```

### 3. Indexed Search

```typescript
// Pre-build search index
interface SearchIndex {
  byName: Map<string, BreakdownNode[]>;
  byType: Map<ContentType, BreakdownNode[]>;
  bySize: BreakdownNode[];  // Sorted by size descending
}

function buildSearchIndex(root: BreakdownNode): SearchIndex {
  const byName = new Map<string, BreakdownNode[]>();
  const byType = new Map<ContentType, BreakdownNode[]>();
  const bySize: BreakdownNode[] = [];

  function traverse(node: BreakdownNode) {
    // Index by name
    const key = node.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(node);

    // Index by type
    if (!byType.has(node.type)) byType.set(node.type, []);
    byType.get(node.type)!.push(node);

    // Add to size list
    bySize.push(node);

    // Recurse
    node.children.forEach(traverse);
  }

  traverse(root);
  bySize.sort((a, b) => b.size - a.size);  // Descending

  return { byName, byType, bySize };
}
```

---

## Export Formats

### CSV Export (Breakdown)

```csv
Path,Name,Size (Bytes),Size (MB),Type,% of Total
/Frameworks/UIKit.framework,UIKit.framework,15728640,15.0,framework,5.2%
/Assets.car,Assets.car,8388608,8.0,bundle,2.8%
```

### JSON Export (Complete Analysis)

```json
{
  "fileId": "uuid",
  "platform": "iOS",
  "appName": "MyApp",
  "version": "1.0.0",
  "totalInstallSize": 302457856,
  "totalDownloadSize": 285736960,
  "breakdown": { /* tree structure */ },
  "insights": [
    {
      "ruleId": "R001",
      "title": "Remove duplicate files",
      "severity": "critical",
      "potentialSavings": 5242880,
      "percentOfTotal": 1.73,
      "affectedItems": [ /* ... */ ]
    }
  ]
}
```

---

## Summary

**Data Flow:**
```
Binary File
  → ZIP Extraction (fflate)
  → FileEntry[] (flat list)
  → Platform Detection
  → iOS Parser OR Android Parser
  → AnalysisContext (with BreakdownNode tree)
  → Zustand Store
  → UI Components
```

**Key Design Decisions:**
1. **Immutable State**: All updates create new objects (Redux-style)
2. **Lazy Computation**: Insights and hashes computed on-demand
3. **Indexed Structures**: Pre-built indexes for fast search/filter
4. **Type Safety**: Strict TypeScript throughout
5. **Memory Efficiency**: Stream processing, lazy loading, garbage collection

**Entity Count Estimates:**
- Small app (50MB): ~1,000 FileEntries, ~500 BreakdownNodes
- Medium app (200MB): ~5,000 FileEntries, ~2,000 BreakdownNodes
- Large app (500MB): ~15,000 FileEntries, ~7,000 BreakdownNodes
