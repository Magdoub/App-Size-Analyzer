# Data Model: Sort File List by Size

**Feature**: 002-sort-by-size
**Date**: 2025-11-08
**Status**: Design

## Overview

This document defines the data structures and state management for the sorting feature. Since the feature leverages existing data structures (`BreakdownNode`, `FileEntry`) and extends existing Zustand store state, this document focuses on how sorting state is modeled and flows through the application.

## Entities

### 1. BreakdownNode (Existing - No Changes)

**Purpose**: Represents a hierarchical tree node for file/directory in app bundle

**Location**: `/src/types/analysis.ts` (lines 31-47)

**Structure**:
```typescript
interface BreakdownNode {
  id: string;                          // Unique identifier (path-based or UUID)
  name: string;                        // Display name (filename or directory name)
  path: string;                        // Full path in archive
  size: number;                        // Total size in bytes (aggregated for directories)
  compressedSize?: number;             // Optional compressed size
  type: ContentType;                   // File type classification (16 types)
  parent?: string;                     // Parent node ID (undefined for root)
  children: BreakdownNode[];           // Child nodes (empty array for files)

  metadata?: {
    fileCount?: number;                // Number of descendant files
    duplicates?: string[];             // IDs of duplicate nodes
    encoding?: string;                 // File encoding
    architecture?: string[];           // CPU architectures (arm64, x86_64, etc.)
  };
}
```

**Relationships**:
- Self-referential tree structure via `children` array
- Parent-child relationship via `parent` ID reference
- Sorting operates on `children` arrays recursively

**Sorting Key**: The `size` property is the primary sorting key for this feature

---

### 2. SortCriteria (Existing Type)

**Purpose**: Defines valid sorting criteria

**Location**: `/src/lib/analysis/breakdown-generator.ts`

**Structure**:
```typescript
export type SortCriteria = 'size' | 'name' | 'type';
```

**Usage**: Used by `sortTree()` function and Zustand store

---

### 3. SortOrder (Existing Type)

**Purpose**: Defines sort direction

**Location**: `/src/lib/analysis/breakdown-generator.ts`

**Structure**:
```typescript
export type SortOrder = 'asc' | 'desc';
```

**Usage**: Used by `sortTree()` function and Zustand store

---

### 4. Breakdown Store State (Existing - Partially Used)

**Purpose**: Zustand store managing breakdown view state

**Location**: `/src/store/analysis-store.ts`

**Relevant State Properties**:
```typescript
interface AnalysisStore {
  // Sorting state (EXISTS but UNUSED in UI)
  breakdownSortBy: SortCriteria;          // Default: 'size'
  breakdownSortOrder: SortOrder;          // Default: 'desc'

  // Related state (USED in UI)
  breakdownExpandedNodes: Set<string>;    // Node IDs that are expanded
  breakdownSearchQuery: string;           // Search filter text
  breakdownFilter: BreakdownFilter;       // Type/size filtering

  // Analysis data
  currentAnalysis: AnalysisContext | null; // Contains breakdownRoot
}
```

**Actions**:
```typescript
interface AnalysisStore {
  // Sorting actions (EXISTS but UNUSED in UI)
  setBreakdownSort: (sortBy: SortCriteria, order: SortOrder) => void;

  // Related actions (USED in UI)
  toggleBreakdownNode: (nodeId: string) => void;
  setBreakdownSearch: (query: string) => void;
  setBreakdownFilter: (filter: BreakdownFilter) => void;
  clearBreakdownFilters: () => void;
}
```

**State Transitions**:
1. **Initial State**: `breakdownSortBy = 'size'`, `breakdownSortOrder = 'desc'`
2. **User Action**: (Future) User clicks sort button/header
3. **State Update**: `setBreakdownSort('size', 'desc')` called
4. **Component Reaction**: BreakdownTable re-renders with new sort order
5. **Memoization**: `useMemo()` recalculates sorted tree only if dependencies changed

---

### 5. FlattenedNode (Internal Component State)

**Purpose**: Intermediate structure for rendering flat list with virtual scrolling

**Location**: `/src/components/breakdown/BreakdownTable.tsx` (internal type)

**Structure**:
```typescript
interface FlattenedNode {
  node: BreakdownNode;      // The actual node data
  depth: number;            // Tree depth for indentation (0 = root)
  hasChildren: boolean;     // Whether node has child nodes
  parentPath: string;       // Parent node path for hierarchy tracking
}
```

**Lifecycle**:
1. `BreakdownNode` tree (hierarchical)
2. → Filter by tab → Sorted tree (via `sortTree()`)
3. → Flatten to visible → `FlattenedNode[]` (respects expanded state)
4. → Apply search filter → Final `FlattenedNode[]`
5. → Virtual scrolling → Render visible rows

**Sorting Impact**: Flattening preserves sort order from tree. Largest children appear first in flattened list.

---

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Analysis Store                                               │
│    currentAnalysis.breakdownRoot: BreakdownNode                 │
│    breakdownSortBy: 'size'                                      │
│    breakdownSortOrder: 'desc'                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BreakdownTable Component                                     │
│    const { breakdownSortBy, breakdownSortOrder } = store        │
│    const { breakdownRoot } = currentAnalysis                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Tab Filtering (useMemo)                                      │
│    filteredTree = filterByType(root, activeTab)                 │
│    → Filters by ContentType (e.g., only 'framework' types)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Sorting (useMemo) - NEW STEP                                 │
│    sortedTree = sortTree(filteredTree, sortBy, sortOrder)       │
│    → Recursively sorts all children by size descending          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Flattening (useMemo)                                         │
│    flattenedNodes = traverse(sortedTree, expandedNodes)         │
│    → Converts tree to FlattenedNode[] (visible nodes only)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Search Filtering (useMemo)                                   │
│    searchedNodes = flattenedNodes.filter(searchQuery)           │
│    → Case-insensitive substring match on name/path              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Virtual Scrolling Render                                     │
│    virtualizer.getVirtualItems() → visible row indices          │
│    → Renders only visible rows (40px height, 10 row overscan)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Validation Rules

### BreakdownNode Invariants

1. **Size Consistency**: Parent `size` = sum of children `size` (enforced by parser)
2. **Tree Structure**: No circular references (ID-based parent relationship)
3. **Immutability**: `sortTree()` never mutates original tree (returns new tree)
4. **Children Order**: After sorting, children are ordered by specified criteria

### Sort State Invariants

1. **Valid Criteria**: `breakdownSortBy` must be one of: `'size' | 'name' | 'type'`
2. **Valid Order**: `breakdownSortOrder` must be one of: `'asc' | 'desc'`
3. **Persistence**: Sort state persists across tab switches (same sort applies to all tabs)
4. **Default State**: On app load, defaults to `sortBy='size', order='desc'` (largest first)

### Memoization Dependencies

Each transformation step memoizes based on specific dependencies:

| Step | Memoization Dependencies |
|------|-------------------------|
| **Tab Filtering** | `[rootNode, activeTab]` |
| **Sorting** | `[filteredTree, sortBy, sortOrder]` |
| **Flattening** | `[sortedTree, expandedNodes]` |
| **Search Filtering** | `[flattenedNodes, searchQuery]` |

**Important**: Dependencies must be exhaustive to prevent stale data and minimal to prevent unnecessary recalculations.

---

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `sortTree(node)` | O(n log n) | Recursive sort, n = total nodes in tree |
| Tab Filtering | O(n) | Single tree traversal |
| Flattening | O(v) | v = visible nodes (respects expanded state) |
| Search Filtering | O(v) | Linear scan of visible nodes |
| Virtual Scrolling | O(1) | Renders fixed number of rows |

**Typical Performance**:
- Sorting 1,000 nodes: ~5-10ms
- Sorting 10,000 nodes: ~50-100ms (acceptable, memoized)

### Space Complexity

| Structure | Space | Notes |
|-----------|-------|-------|
| `BreakdownNode` tree | O(n) | n = total files in app bundle |
| Sorted tree | O(n) | New tree created (immutable) |
| Flattened array | O(v) | v = visible nodes << n |
| Virtual rows | O(k) | k = ~20-30 visible rows |

**Memory Optimization**: Virtual scrolling ensures only visible rows consume DOM memory, regardless of tree size.

---

## Data Integrity

### Source of Truth

- **Single Source**: Zustand `AnalysisStore.currentAnalysis.breakdownRoot`
- **Derived State**: All transformations (filter, sort, flatten, search) are derived from root
- **No Duplication**: No redundant copies of tree data (memoization caches results, not data)

### Immutability Guarantee

All transformations return new structures:
```typescript
// sortTree implementation
const sortedChildren = [...tree.children].sort(...);  // New array
return {
  ...tree,                  // New object
  children: sortedChildren  // New children array
};
```

**Benefits**:
- React can detect changes efficiently (reference equality)
- No side effects or bugs from mutation
- Time-travel debugging possible

---

## Future Extensions

### Planned (Out of Scope for This Feature)

1. **User-Configurable Sorting**: UI controls to change sort criteria/order
   - Requires: Sort header buttons, visual indicators (arrows)
   - Store already supports this

2. **Multi-Column Sorting**: Sort by primary and secondary criteria
   - Example: Sort by size, then by name for ties
   - Requires: Extended `SortCriteria` type, modified `sortTree()`

3. **Persistent Sort Preferences**: Remember user's sort choice across sessions
   - Requires: localStorage integration with Zustand persist middleware

### Not Planned

- Server-side sorting (client-side only app)
- Sort by custom metrics (compression ratio, file age, etc.)
- Lazy sorting (on-demand, per-node)

---

## Summary

| Entity | Source | Modification | Purpose |
|--------|--------|--------------|---------|
| `BreakdownNode` | Existing | None | Hierarchical tree structure |
| `SortCriteria` | Existing | None | Type for sort criteria |
| `SortOrder` | Existing | None | Type for sort direction |
| `breakdownSortBy` | Existing (store) | Usage only | Controls sort criteria |
| `breakdownSortOrder` | Existing (store) | Usage only | Controls sort direction |
| `FlattenedNode` | Existing (internal) | None | Virtual scrolling structure |

**Key Insight**: All necessary data structures already exist. This feature is primarily about **connecting existing infrastructure** (store state + `sortTree()` utility + BreakdownTable component).
