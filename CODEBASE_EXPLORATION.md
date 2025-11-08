# App Size Analyzer - Codebase Structure Exploration

**Date**: November 8, 2025  
**Project**: sizeanalyzer  
**Current Branch**: 001-app-size-analyzer  
**Total TypeScript Files**: 44  

---

## 1. PROJECT OVERVIEW

### Tech Stack
- **Language**: TypeScript 5.x (strict mode, ES2020+ target)
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.21
- **Testing**: Vitest 4.0.7 + Testing Library 16.3.0
- **State Management**: Zustand 5.0.8
- **UI Styling**: Tailwind CSS 3.4.18
- **Virtual Scrolling**: @tanstack/react-virtual 3.13.12
- **Data Visualization**: @nivo/treemap 0.99.0
- **Data Processing**: fflate (ZIP compression), app-info-parser

### Key Dependencies for File Handling
- `fflate` - ZIP/compression handling
- `@tanstack/react-table` - Table utilities
- `@tanstack/react-virtual` - Virtual scrolling (critical for large file lists)
- `app-info-parser` - APK/IPA metadata parsing

---

## 2. UI COMPONENT STRUCTURE

### Breakdown View (File List Display)

#### **BreakdownView.tsx**
**Path**: `/src/components/breakdown/BreakdownView.tsx`

- **Purpose**: Main container for hierarchical breakdown view
- **Responsibilities**:
  - Manages `activeTab` state locally: `'all' | 'frameworks' | 'assets' | 'localizations'`
  - Displays app metadata (platform, total size, app name, version)
  - Orchestrates tab navigation and table rendering
  - Renders header, tabs, and table in flex layout

- **Data Flow**:
  1. Gets `currentAnalysis` from Zustand store
  2. Extracts `breakdownRoot` (root BreakdownNode) and `totalInstallSize`
  3. Passes to `<BreakdownTabs>` for tab selection
  4. Passes to `<BreakdownTable>` with `activeTab` filter

#### **BreakdownTabs.tsx**
**Path**: `/src/components/breakdown/BreakdownTabs.tsx`

- **Purpose**: Tab navigation component
- **Tabs Supported**:
  - `all` - All Files (📁)
  - `frameworks` - Frameworks/Libraries (📦) - platform-aware label
  - `assets` - Assets (🖼️)
  - `localizations` - Localizations (🌐)
  
- **Features**:
  - Platform-aware label rendering (iOS: "Frameworks", Android: "Libraries")
  - Active tab highlighting with blue border
  - Callback on tab change: `onTabChange(tab)`

#### **BreakdownTable.tsx** (CRITICAL FOR SORTING)
**Path**: `/src/components/breakdown/BreakdownTable.tsx`

- **Purpose**: Virtual scrolling table for hierarchical file lists
- **Rendering Approach**:
  - Uses `@tanstack/react-virtual` for virtual scrolling
  - Estimated row height: 40px
  - Overscan: 10 rows for smooth scrolling
  - Grid layout: 12 columns (Tailwind)
    - Col 1-6: Name (with indentation for depth)
    - Col 7-8: Size (uncompressed)
    - Col 9-10: Compressed Size
    - Col 11-12: Percentage bar + number

- **Columns**:
  1. **Name Column**: Hierarchical with expand/collapse chevron, indentation
  2. **Size Column**: Uncompressed size in bytes
  3. **Compressed Size Column**: Optional compressed size
  4. **Percentage Column**: Visual progress bar + percentage of total

- **Data Structure Used**:
  ```typescript
  interface FlattenedNode {
    node: BreakdownNode;      // The actual node data
    depth: number;            // Tree depth for indentation
    hasChildren: boolean;     // Whether node has child nodes
    parentPath: string;       // Parent node path
  }
  ```

- **Processing Pipeline**:
  1. **Step 1 - Filter by Tab**: `filterByType()` - narrows to content type
  2. **Step 2 - Flatten to Visible**: `traverse()` - respects expanded state, applies search
  3. **Step 3 - Virtual Scrolling**: Renders only visible rows via virtualizer

- **Key Behaviors**:
  - Expands nodes when clicked (toggles in store)
  - Only shows expanded nodes and their parents
  - Applies search filter (case-insensitive substring match)
  - Shows "Showing X items" footer

### Tabs Integration Pattern

Each tab filters the tree before flattening:
```typescript
// frameworks tab
shouldInclude = node.type === 'framework' || node.type === 'native_lib';

// assets tab
shouldInclude = ['image', 'video', 'audio', 'font', 'asset'].includes(node.type);

// localizations tab
shouldInclude = node.type === 'localization';
```

---

## 3. DATA STRUCTURES

### Core Data Types

#### **BreakdownNode** (Hierarchical Tree Node)
**Path**: `/src/types/analysis.ts` (lines 31-47)

```typescript
interface BreakdownNode {
  id: string;                          // Unique ID (UUID or path-based)
  name: string;                        // Display name (filename/component)
  path: string;                        // Full path in archive
  size: number;                        // Total size in bytes (sum of children if dir)
  compressedSize?: number;             // Optional compressed size
  type: ContentType;                   // File type classification
  parent?: string;                     // Parent node ID (undefined for root)
  children: BreakdownNode[];           // Child nodes (empty for files)
  
  metadata?: {
    fileCount?: number;                // # of descendant files
    duplicates?: string[];             // IDs of duplicate nodes
    encoding?: string;                 // File encoding (UTF-8, binary, etc.)
    architecture?: string[];           // Architectures: arm64, x86_64, etc.
  };
}
```

#### **FileEntry** (Flat List)
**Path**: `/src/types/analysis.ts` (lines 92-104)

```typescript
interface FileEntry {
  path: string;                        // Unique path in archive
  size: number;
  compressedSize?: number;
  type: ContentType;
  encoding?: string;
  
  metadata?: {
    lastModified?: Date;
    permissions?: string;
    owner?: string;
  };
}
```

#### **ContentType** (Enum)
**Path**: `/src/types/analysis.ts` (lines 10-26)

```typescript
type ContentType =
  | 'framework'      // iOS framework (.framework)
  | 'bundle'         // iOS bundle (.bundle)
  | 'executable'     // iOS/Android executable binary
  | 'dex'            // Android DEX file
  | 'native_lib'     // Android native library (.so)
  | 'resource'       // Android resource
  | 'asset'          // Android asset
  | 'image'          // Image file
  | 'video'          // Video file
  | 'audio'          // Audio file
  | 'font'           // Font file
  | 'localization'   // Localization file (.lproj, strings.xml)
  | 'data'           // Data file (JSON, XML, etc.)
  | 'config'         // Configuration file
  | 'other'          // Other file types
  | 'unknown';       // Unrecognized type
```

#### **AnalysisContext** (Complete Analysis)
**Path**: `/src/types/analysis.ts` (lines 52-87)

Contains:
- Platform metadata (iOS/Android, appName, bundleId, version)
- Size metrics (totalInstallSize, totalDownloadSize)
- **breakdownRoot**: Root BreakdownNode
- **allFiles**: Flat FileEntry[] for search/filter
- Categorized references (frameworks, assets, localizations, executables, etc.)
  - These are **arrays of node IDs** not full node objects

---

## 4. STATE MANAGEMENT (Zustand)

### **useAnalysisStore**
**Path**: `/src/store/analysis-store.ts` (159 lines)

#### State Properties (Relevant to Breakdown)

```typescript
// Breakdown view state
breakdownExpandedNodes: Set<string>;      // Node IDs that are expanded
breakdownSearchQuery: string;             // Search filter text
breakdownFilter: BreakdownFilter;         // Type/size filtering
breakdownSortBy: 'size' | 'name' | 'type'; // *** SORT KEY ***
breakdownSortOrder: 'asc' | 'desc';      // *** SORT ORDER ***

// Default values
breakdownSortBy: 'size' (default)
breakdownSortOrder: 'desc' (default)
```

#### Actions Available

```typescript
// Breakdown actions
toggleBreakdownNode: (nodeId: string) => void;
setBreakdownSearch: (query: string) => void;
setBreakdownFilter: (filter: BreakdownFilter) => void;
setBreakdownSort: (sortBy: 'size' | 'name' | 'type', order: 'asc' | 'desc') => void;
clearBreakdownFilters: () => void;
```

**Important**: The store already has `breakdownSortBy` and `breakdownSortOrder` properties, but they are NOT currently used in the BreakdownTable component!

---

## 5. EXISTING SORTING LOGIC

### In breakdown-generator.ts
**Path**: `/src/lib/analysis/breakdown-generator.ts` (lines 232-265)

There's already a `sortTree()` function that can sort a tree:

```typescript
export type SortCriteria = 'size' | 'name' | 'type';
export type SortOrder = 'asc' | 'desc';

export function sortTree(
  tree: BreakdownNode,
  criteria: SortCriteria,
  order: SortOrder = 'desc'
): BreakdownNode {
  const sortedChildren = [...tree.children].sort((a, b) => {
    let comparison = 0;
    
    switch (criteria) {
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  // Recursively sort children
  const sortedWithChildren = sortedChildren.map((child) => 
    sortTree(child, criteria, order)
  );
  
  return {
    ...tree,
    children: sortedWithChildren,
  };
}
```

**Current Issue**: This function exists but is NOT being used anywhere in the codebase!

### Store Properties Already Defined
- `breakdownSortBy` and `breakdownSortOrder` are in the store
- `setBreakdownSort` action exists to update them
- But **BreakdownTable.tsx never uses these store values**!

---

## 6. TESTING SETUP

### Test Framework: Vitest
**Path**: `/vitest.config.ts`

Configuration:
- **Environment**: jsdom (browser environment)
- **Globals**: Enabled (test, describe, expect, etc.)
- **Setup Files**: `/src/test/setup.ts`
- **Coverage Provider**: v8
- **Reporters**: text, json, html

### Setup File
**Path**: `/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';

// Available global test setup
// Note: Vitest automatically mocks console methods
// Uncomment if you want to suppress console warnings in tests
```

### Testing Libraries Available
- **@testing-library/react**: v16.3.0
- **@testing-library/jest-dom**: v6.9.1
- **vitest**: v4.0.7

### Current Test Files
- **NO EXISTING TESTS FOUND** in the repository!
- Tests should be created as `.test.ts` or `.test.tsx` files

### Test Pattern Example (Not Currently in Repo)
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BreakdownTable } from './BreakdownTable';
```

---

## 7. DATA FLOW: Parser → State → UI

### Complete Data Pipeline

```
File Upload
    ↓
Parser Worker (worker thread)
    ↓
IPA/APK Parser (ios/android)
    ├→ Extracts files → FileEntry[]
    └→ Metadata extraction
    ↓
buildBreakdownTree(files: FileEntry[])
    ├→ Hierarchical BreakdownNode tree
    └→ Calculates aggregate sizes (bottom-up)
    ↓
AnalysisContext {
  breakdownRoot: BreakdownNode,
  allFiles: FileEntry[],
  ... (metadata, arrays of IDs for frameworks/assets/etc.)
}
    ↓
Zustand Store (currentAnalysis)
    ↓
BreakdownView
    ├→ Reads: currentAnalysis, currentTab
    └→ Passes to BreakdownTable & BreakdownTabs
    ↓
BreakdownTable
    ├→ Filters by tab type (filterByType)
    ├→ Flattens to visible nodes (traverse)
    ├→ Applies search filter
    ├→ ❌ MISSING: Apply sorting
    └→ Virtual scrolling render
```

---

## 8. KEY FILES SUMMARY

| Component | Path | Purpose |
|-----------|------|---------|
| **BreakdownView** | `/src/components/breakdown/BreakdownView.tsx` | Container for breakdown tabs and table |
| **BreakdownTabs** | `/src/components/breakdown/BreakdownTabs.tsx` | Tab navigation (All, Frameworks, Assets, Localizations) |
| **BreakdownTable** | `/src/components/breakdown/BreakdownTable.tsx` | Virtual scrolling table for file list |
| **Analysis Store** | `/src/store/analysis-store.ts` | Zustand state management (has sort props!) |
| **Analysis Types** | `/src/types/analysis.ts` | BreakdownNode, FileEntry, AnalysisContext |
| **Breakdown Generator** | `/src/lib/analysis/breakdown-generator.ts` | Tree building, sorting, filtering utils |
| **Formatters** | `/src/utils/formatters.ts` | formatBytes, formatPercentage |
| **iOS Parser** | `/src/lib/parsers/ios/ipa-parser.ts` | IPA file parsing |
| **Android Parser** | `/src/lib/parsers/android/apk-parser.ts` | APK file parsing |

---

## 9. SORTING FEATURE SPEC (ALREADY IN PROGRESS)

**Path**: `/specs/002-sort-by-size/spec.md`

### Feature Status: Draft
- **Feature Branch**: 002-sort-by-size
- **Created**: 2025-11-08

### Scope
- **P1**: View largest files first in "All Files" tab
- **P2**: Nested sorting for directory contents
- **P3**: Maintain sort order across all tabs

### Current Implementation Gaps
1. ✅ Store has `breakdownSortBy` and `breakdownSortOrder` properties
2. ✅ `sortTree()` utility function exists
3. ❌ BreakdownTable doesn't use store sort values
4. ❌ BreakdownTable doesn't call `sortTree()`
5. ❌ No sort UI controls (buttons/indicators)
6. ❌ No tests for sorting logic

---

## 10. ARCHITECTURE INSIGHTS

### Strengths
1. **Immutable Data Model**: BreakdownNode immutability pattern maintained throughout
2. **Virtual Scrolling**: Efficient for large file lists (TanStack Virtual)
3. **Separation of Concerns**: 
   - Parsing logic separate from UI
   - Store separate from components
   - Utilities separate from components
4. **TypeScript Strict Mode**: Strong type safety
5. **Tree Utilities Ready**: `sortTree`, `flattenTree`, `filterTree` already exist

### Implementation Approach for Sorting

The sorting feature should:
1. Use existing `sortTree()` function from breakdown-generator
2. Store sort preferences in Zustand (already there!)
3. Apply sorting in BreakdownTable before flattening
4. Add UI controls for sort toggling
5. Test with @testing-library/react

### Performance Considerations
- Virtual scrolling already handles large lists efficiently
- Tree sorting happens on filtered subtree (minimal performance impact)
- Sorting is done once per render cycle (memoized with useMemo)

---

## 11. NEXT STEPS FOR SORTING FEATURE

### Implementation Plan
1. **Update BreakdownTable** to use `breakdownSortBy` and `breakdownSortOrder` from store
2. **Apply sortTree()** after filtering but before flattening
3. **Add Sort UI Controls** (buttons to toggle sort criteria and order)
4. **Create Tests** for:
   - `sortTree()` with various criteria
   - Component rendering with different sort orders
   - Store sorting actions
5. **Validate** against all three user stories in spec

### File Locations to Modify
- **Primary**: `/src/components/breakdown/BreakdownTable.tsx` (implement sorting)
- **Secondary**: `/src/store/analysis-store.ts` (already ready, may need UI actions)
- **Tests**: Create `src/components/breakdown/__tests__/BreakdownTable.test.tsx`

