# Data Model: X-Ray Visualization UX Improvements

**Feature**: 003-xray-ux-improvements
**Date**: 2025-11-08
**Status**: Phase 1 Design

## Overview

This document defines the data entities, state management, and relationships for the X-Ray UX improvements feature. All entities extend or integrate with existing types from `src/types/analysis.ts`.

---

## Core Entities

### 1. TreemapNode (Existing - Extended)

**Location**: `src/lib/visualization/treemap-generator.ts`

**Purpose**: Nivo treemap data format representation of a BreakdownNode

**Existing Properties**:
```typescript
interface TreemapNode {
  name: string;                    // Display name
  value: number;                   // Uncompressed size in bytes
  path: string;                    // Full file path
  type: ContentType;               // Content type (executables, frameworks, etc.)
  children?: TreemapNode[];        // Child nodes
  color?: string;                  // Computed color (optional)
  compressedSize: number | undefined; // Compressed size if applicable
}
```

**New Properties** (to be added):
```typescript
interface TreemapNode {
  // ... existing properties ...

  // NEW: Visual rendering metadata
  dimensions?: {
    width: number;                 // Computed box width in pixels (filled by Nivo)
    height: number;                // Computed box height in pixels (filled by Nivo)
    x: number;                     // X coordinate (filled by Nivo)
    y: number;                     // Y coordinate (filled by Nivo)
  };

  // NEW: Label rendering decision
  shouldShowLabel?: boolean;       // True if box >= 50x20px

  // NEW: Search/highlight state
  isSearchMatch?: boolean;         // True if matches current search
  isCurrentSearchMatch?: boolean;  // True if current focused search result
}
```

**Validation Rules**:
- `value` must be > 0
- `path` must be unique within the tree
- `children` array must not contain circular references
- If `children` exists and is non-empty, `shouldShowLabel` should consider child count for rendering

**Relationships**:
- Parent-child: `children` array (one-to-many)
- Derived from: `BreakdownNode` (via `toTreemapData()` transformation)

---

### 2. NodeLabelMetadata (New)

**Location**: `src/lib/visualization/node-label-calculator.ts`

**Purpose**: Metadata for label rendering decisions

**Properties**:
```typescript
interface NodeLabelMetadata {
  nodePath: string;                // Node identifier
  shouldShowLabel: boolean;        // True if box meets size threshold
  labelText: string;               // Computed label text (may be truncated)
  fontSize: number;                // Computed font size (12-16px)

  // Dimension checks
  boxWidth: number;                // Actual box width in pixels
  boxHeight: number;               // Actual box height in pixels
  meetsWidthThreshold: boolean;    // width >= 50px
  meetsHeightThreshold: boolean;   // height >= 20px

  // Text fitting
  estimatedTextWidth: number;      // Estimated width of label text
  requiresTruncation: boolean;     // True if text must be truncated to fit
}
```

**Derivation Logic**:
```typescript
shouldShowLabel = meetsWidthThreshold && meetsHeightThreshold && estimatedTextWidth <= boxWidth - 8 // 8px padding
```

**Validation Rules**:
- `boxWidth` and `boxHeight` must be > 0
- `fontSize` must be between 10-18 pixels
- `labelText` must not exceed box width (truncate with ellipsis if needed)

---

### 3. DetailsPanelData (New)

**Location**: `src/components/xray/DetailsPanel.tsx`

**Purpose**: Data structure for the details panel content

**Properties**:
```typescript
interface DetailsPanelData {
  // Identity
  nodePath: string;                // Full file path
  displayName: string;             // File/folder name

  // Size information
  uncompressedSize: number;        // Size in bytes
  compressedSize?: number;         // Compressed size if applicable
  compressionRatio?: number;       // Ratio (0-1) if compressed

  // Percentages
  percentOfTotal: number;          // Percentage of total app size (0-100)
  percentOfParent: number;         // Percentage of parent container (0-100)

  // Metadata
  contentType: ContentType;        // Type (executables, frameworks, etc.)
  childCount: number;              // Number of direct children
  totalDescendants: number;        // Total nodes in subtree (recursive)
  depthLevel: number;              // Depth in hierarchy (0 = root)

  // Navigation context
  parentPath: string | null;       // Parent folder path (null if root)
  breadcrumbPath: string[];        // Array of ancestor names for breadcrumb

  // Computed metadata
  isLeafNode: boolean;             // True if no children
  isZoomable: boolean;             // True if has children (can zoom)
  formattedSize: string;           // Human-readable size (e.g., "2.5 MB")
  formattedCompressedSize?: string; // Human-readable compressed size
}
```

**Derivation** (from TreemapNode):
```typescript
function toDetailsPanelData(
  node: TreemapNode,
  totalAppSize: number,
  parentSize: number
): DetailsPanelData {
  return {
    nodePath: node.path,
    displayName: node.name,
    uncompressedSize: node.value,
    compressedSize: node.compressedSize,
    compressionRatio: node.compressedSize ? node.compressedSize / node.value : undefined,
    percentOfTotal: (node.value / totalAppSize) * 100,
    percentOfParent: (node.value / parentSize) * 100,
    contentType: node.type,
    childCount: node.children?.length || 0,
    totalDescendants: countDescendants(node),
    depthLevel: node.path.split('/').length - 1,
    parentPath: getParentPath(node.path),
    breadcrumbPath: node.path.split('/').filter(Boolean),
    isLeafNode: !node.children || node.children.length === 0,
    isZoomable: (node.children?.length || 0) > 0,
    formattedSize: formatBytes(node.value),
    formattedCompressedSize: node.compressedSize ? formatBytes(node.compressedSize) : undefined,
  };
}
```

**Validation Rules**:
- `uncompressedSize` must be > 0
- If `compressedSize` exists, must be <= `uncompressedSize`
- `percentOfTotal` and `percentOfParent` must be 0-100
- `depthLevel` must be >= 0

---

### 4. SearchNavigationState (New)

**Location**: `src/store/analysis-store.ts` (Zustand state extension)

**Purpose**: Manage search results and navigation through matches

**Properties**:
```typescript
interface SearchNavigationState {
  // Search input
  searchQuery: string;             // Current search query

  // Results
  matchingPaths: string[];         // Array of paths that match query
  matchCount: number;              // Total number of matches

  // Navigation
  currentMatchIndex: number;       // Index of currently focused match (0-based)
  currentMatchPath: string | null; // Path of current match

  // Display state
  isSearchActive: boolean;         // True if search query is non-empty
  hasMatches: boolean;             // True if matchCount > 0
}
```

**State Transitions**:
```typescript
// User types in search box
searchQuery: '' → 'framework'
  → searchTree(rootNode, 'framework') → matchingPaths: ['Payload/Frameworks/SomeFramework.framework', ...]
  → matchCount: 5, isSearchActive: true, hasMatches: true

// User presses Next (or Enter)
currentMatchIndex: 0 → 1
  → currentMatchPath: matchingPaths[1]
  → extractParentPath(currentMatchPath) → setXRayZoom(parentPath)

// User clears search
searchQuery: 'framework' → ''
  → matchingPaths: [], matchCount: 0, currentMatchIndex: 0, isSearchActive: false, hasMatches: false
```

**Validation Rules**:
- `currentMatchIndex` must be >= 0 and < `matchCount`
- `currentMatchPath` must exist in `matchingPaths` array
- `matchCount` must equal `matchingPaths.length`

---

### 5. ColorSchemeConfig (Existing - Enhanced)

**Location**: `src/lib/visualization/color-scheme.ts`

**Purpose**: Color mapping configuration with WCAG compliance

**Existing Structure**:
```typescript
const TYPE_COLORS: Record<ContentType, string> = {
  executables: '#3b82f6',
  frameworks: '#10b981',
  // ... other types
};

function getNodeColor(
  size: number,
  type: ContentType,
  totalSize: number,
  compressedSize: number | undefined,
  scheme: 'size' | 'type'
): string;

function getLabelColor(backgroundColor: string): string;
```

**Enhancements**:
```typescript
// NEW: WCAG validation
interface WCAGColorConfig {
  backgroundColor: string;         // Node background color
  textColor: string;               // Computed text color for contrast
  contrastRatio: number;           // Calculated contrast ratio
  meetsWCAG_AA: boolean;           // True if ratio >= 4.5:1 for text
  meetsWCAG_AA_Large: boolean;     // True if ratio >= 3:1 for large text
  meetsWCAG_AAA: boolean;          // True if ratio >= 7:1 (stricter)
}

// NEW: Pre-validated color palette
const WCAG_VALIDATED_COLORS: Record<ContentType, WCAGColorConfig> = {
  // Generated on app initialization by validateColorPalette()
};

// NEW: Validation function
function validateColorPalette(): void {
  // Check all TYPE_COLORS against white background (#ffffff)
  // Adjust colors if needed to meet WCAG AA (4.5:1)
  // Update WCAG_VALIDATED_COLORS
}

// ENHANCED: Get label color with contrast guarantee
function getLabelColor(backgroundColor: string, minContrastRatio: number = 4.5): string {
  const whiteContrast = calculateContrastRatio('#ffffff', backgroundColor);
  const blackContrast = calculateContrastRatio('#000000', backgroundColor);

  if (whiteContrast >= minContrastRatio) return '#ffffff';
  if (blackContrast >= minContrastRatio) return '#000000';

  // Fallback: return whichever has higher contrast
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}
```

**Validation Rules**:
- All colors in `TYPE_COLORS` must meet WCAG AA contrast ratio with border color (#ffffff)
- Label text color must meet 4.5:1 contrast with node background
- Hover/highlight colors must maintain 3:1 contrast with base colors

---

### 6. KeyboardNavigationState (New)

**Location**: `src/store/analysis-store.ts` (Zustand state extension)

**Purpose**: Track keyboard focus and navigation state

**Properties**:
```typescript
interface KeyboardNavigationState {
  // Focus state
  keyboardFocusedPath: string | null;     // Currently focused node path
  isTreemapFocused: boolean;              // True if treemap canvas has focus

  // Navigation history (for Escape key)
  navigationStack: string[];              // Stack of zoom paths (for back navigation)

  // Coordinate index (for arrow key navigation - Phase 2)
  nodeCoordinateIndex?: Map<string, { x: number; y: number; width: number; height: number }>;
}
```

**State Transitions**:
```typescript
// User focuses treemap and presses Enter on a node
keyboardFocusedPath: 'Frameworks/MyFramework.framework'
  → hasChildren(node) = true
  → push to navigationStack: ['', 'Frameworks', 'Frameworks/MyFramework.framework']
  → setXRayZoom('Frameworks/MyFramework.framework')

// User presses Escape
navigationStack: ['', 'Frameworks', 'Frameworks/MyFramework.framework']
  → pop() → 'Frameworks/MyFramework.framework'
  → setXRayZoom(navigationStack[navigationStack.length - 1]) // 'Frameworks'

// User presses Home
navigationStack: [...] → []
  → setXRayZoom(null)
  → keyboardFocusedPath: null
```

**Validation Rules**:
- `keyboardFocusedPath` must exist in current treemap data
- `navigationStack` must contain valid paths that form a hierarchical chain
- When zoomed in, `navigationStack.length` should equal depth level

---

## State Management (Zustand Store Extensions)

### Existing Store (`src/store/analysis-store.ts`)

**Current Relevant State**:
```typescript
interface AnalysisStore {
  // ... other state ...

  // X-Ray state (existing)
  xrayZoomPath: string | null;
  xrayCategories: Set<ContentType>;
  xraySearchQuery: string;

  // Actions (existing)
  setXRayZoom: (path: string | null) => void;
  setXRaySearch: (query: string) => void;
}
```

**New State to Add**:
```typescript
interface AnalysisStore {
  // ... existing state ...

  // Details Panel
  detailsPanelNodePath: string | null;           // Path of node shown in details panel
  isDetailsPanelOpen: boolean;                   // Panel visibility

  // Search Navigation
  searchMatches: string[];                       // Array of matching paths
  currentSearchMatchIndex: number;               // Current match index

  // Keyboard Navigation
  keyboardFocusedNodePath: string | null;        // Keyboard-focused node
  navigationHistory: string[];                   // Zoom history stack

  // Hover state (for tooltip coordination)
  hoveredNodePath: string | null;                // Currently hovered node

  // NEW ACTIONS
  setDetailsPanel: (path: string | null) => void;
  closeDetailsPanel: () => void;
  setSearchMatches: (matches: string[]) => void;
  navigateToNextMatch: () => void;
  navigateToPreviousMatch: () => void;
  setKeyboardFocus: (path: string | null) => void;
  pushNavigationHistory: (path: string) => void;
  popNavigationHistory: () => void;
  setHoveredNode: (path: string | null) => void;
}
```

**Implementation Example**:
```typescript
export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  // ... existing state ...

  // NEW: Details panel state
  detailsPanelNodePath: null,
  isDetailsPanelOpen: false,

  setDetailsPanel: (path) => set({
    detailsPanelNodePath: path,
    isDetailsPanelOpen: path !== null
  }),

  closeDetailsPanel: () => set({
    detailsPanelNodePath: null,
    isDetailsPanelOpen: false
  }),

  // NEW: Search navigation
  searchMatches: [],
  currentSearchMatchIndex: 0,

  setSearchMatches: (matches) => set({
    searchMatches: matches,
    currentSearchMatchIndex: matches.length > 0 ? 0 : -1,
  }),

  navigateToNextMatch: () => {
    const { searchMatches, currentSearchMatchIndex } = get();
    if (searchMatches.length === 0) return;

    const nextIndex = (currentSearchMatchIndex + 1) % searchMatches.length;
    const nextPath = searchMatches[nextIndex];
    const parentPath = getParentPath(nextPath);

    set({
      currentSearchMatchIndex: nextIndex,
      xrayZoomPath: parentPath,
    });
  },

  // ... other actions ...
}));
```

---

## Entity Relationships

```
BreakdownNode (existing)
    ↓ (transformation)
TreemapNode (extended)
    ↓ (rendering)
Nivo Treemap Component
    ↓ (user interaction)
┌───────────────────────────────────────┐
│  XRayView Container                    │
│  - manages all state                   │
│  - coordinates components              │
└───────────────────────────────────────┘
    ↓ (user clicks info icon)
DetailsPanelData (derived)
    ↓ (displayed in)
DetailsPanel Component

    ↓ (user types search)
SearchNavigationState (in store)
    ↓ (highlights)
TreemapNode.isSearchMatch (updated)
    ↓ (user navigates matches)
setXRayZoom (updates zoom path)
```

---

## Data Flow Diagrams

### 1. Tooltip Display Flow

```
User hovers over treemap box
    ↓
Nivo fires hover event with node data
    ↓
setHoveredNode(node.path) → Zustand store
    ↓
Tooltip component renders with:
    - node.name (title)
    - formatBytes(node.value)
    - node.compressedSize (if exists)
    - percentage calculation
    - node.type
    ↓
colors prop checks hoveredNodePath
    ↓ (match)
Add subtle border/glow to hovered box
```

### 2. Info Icon Click → Details Panel Flow

```
User clicks info icon on treemap node
    ↓
onClick(node.path) → setDetailsPanel(node.path)
    ↓
Zustand store updates:
    - detailsPanelNodePath: node.path
    - isDetailsPanelOpen: true
    ↓
DetailsPanel re-renders:
    - finds node by path in treemap data
    - calls toDetailsPanelData(node, totalSize, parentSize)
    - displays DetailsPanelData in slide-out panel
    ↓
User clicks different info icon
    ↓
setDetailsPanel(newPath) → panel updates content (no close/reopen)
    ↓
User clicks close button or presses Escape
    ↓
closeDetailsPanel() → panel slides out
```

### 3. Search → Navigate Flow

```
User types "framework" in search input
    ↓
setXRaySearch('framework') → Zustand store
    ↓
useMemo re-calculates:
    searchTree(breakdownRoot, 'framework') → ['path1', 'path2', ...]
    ↓
setSearchMatches(['path1', 'path2', ...])
    ↓
UI shows: "Found 5 matches"
    ↓
User presses Enter or clicks "Next"
    ↓
navigateToNextMatch()
    ↓
    - increment currentSearchMatchIndex (0 → 1)
    - get matchingPaths[1]
    - extract parent path
    - setXRayZoom(parentPath)
    ↓
TreemapData regenerated for new zoom level
    ↓
Nivo treemap re-renders with highlighted matches
    ↓
colors prop checks: path in searchMatches
    ↓ (match)
Apply yellow highlight (#fbbf24)
    ↓ (current match)
Apply pulsing border animation (CSS)
```

### 4. Zoom Navigation Flow

```
User clicks treemap node (not info icon)
    ↓
onClick(node.path)
    ↓
Check: node.children.length > 0?
    ↓ YES
pushNavigationHistory(currentZoomPath)
setXRayZoom(node.path)
    ↓
useMemo re-calculates treemap data:
    findNodeByPath(root, node.path)
    toTreemapData(foundNode, options)
    ↓
Nivo animates transition (if enabled)
    ↓
Breadcrumb updates:
    node.path.split('/') → ['Frameworks', 'MyFramework.framework']
    render clickable breadcrumb segments
    ↓
User clicks breadcrumb segment
    ↓
setXRayZoom(segmentPath)
    ↓
(Repeat treemap data regeneration)
```

---

## Validation & Constraints

### Size Constraints
- **Treemap node count**: Tested up to 10,000 nodes
- **Search results**: No limit (but UI shows "1 of N" navigation)
- **Navigation history depth**: No artificial limit (matches tree depth)
- **Details panel path length**: Max 500 characters displayed (scrollable)

### Performance Constraints
- **Treemap render time**: <500ms for 1000 nodes
- **Search execution**: <100ms for 10,000 nodes
- **Details panel open**: <300ms animation
- **Tooltip display**: <200ms from hover

### Data Integrity Rules
- Treemap data must be regenerated when:
  - `xrayZoomPath` changes
  - `xrayCategories` changes
  - `currentAnalysis` changes
- Search matches must be recalculated when:
  - `xraySearchQuery` changes
  - `currentAnalysis` changes
- Details panel data must be updated when:
  - `detailsPanelNodePath` changes
  - Treemap data changes (zoom/filter)

### Type Safety
- All entities use strict TypeScript types
- No `any` types allowed in new code
- Zustand store strictly typed with interface
- All props explicitly typed (no implicit types)

---

## Migration Notes

**Existing Data Compatibility**:
- All existing `BreakdownNode` structures work without changes
- `TreemapNode` extensions are optional (backward compatible)
- Existing `xrayZoomPath`, `xraySearchQuery` state preserved
- No database migrations needed (client-side only)

**Deprecations**: None - purely additive changes

---

## Data Model Complete

All entities, relationships, state management, and data flows are defined. Ready to proceed to **contract generation**.

**Next Steps**:
1. Generate TypeScript interface contracts in `contracts/` directory
2. Create quickstart guide with integration examples
3. Update agent context with new entities and patterns
