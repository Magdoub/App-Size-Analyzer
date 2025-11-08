# Quickstart Guide: X-Ray UX Improvements Integration

**Feature**: 003-xray-ux-improvements
**Date**: 2025-11-08
**Audience**: Developers implementing this feature

## Overview

This guide provides practical examples for integrating the X-Ray UX improvements into the existing codebase. Follow these examples to implement readable labels, tooltips, zoom navigation, details panel, and search functionality.

---

## Table of Contents

1. [Setup](#setup)
2. [Enhanced Labels with Size Threshold](#enhanced-labels-with-size-threshold)
3. [WCAG-Compliant Colors](#wcag-compliant-colors)
4. [Details Panel Integration](#details-panel-integration)
5. [Search with Navigation](#search-with-navigation)
6. [Keyboard Navigation](#keyboard-navigation)
7. [Testing Examples](#testing-examples)

---

## Setup

### Install Dependencies

```bash
npm install color2k
```

### Update TypeScript Types

Add new store properties to `src/store/analysis-store.ts`:

```typescript
import { create } from 'zustand';

interface AnalysisStore {
  // ... existing properties ...

  // NEW: Details Panel
  detailsPanelNodePath: string | null;
  isDetailsPanelOpen: boolean;

  // NEW: Search Navigation
  searchMatches: string[];
  currentSearchMatchIndex: number;

  // NEW: Keyboard Navigation
  keyboardFocusedNodePath: string | null;
  navigationHistory: string[];

  // NEW: Hover State
  hoveredNodePath: string | null;

  // NEW: Actions
  setDetailsPanel: (path: string | null) => void;
  closeDetailsPanel: () => void;
  setSearchMatches: (matches: string[]) => void;
  navigateToNextMatch: () => void;
  navigateToPreviousMatch: () => void;
  setKeyboardFocus: (path: string | null) => void;
  pushNavigationHistory: (path: string) => void;
  popNavigationHistory: () => string | null;
  setHoveredNode: (path: string | null) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  // ... existing state ...

  // Details Panel
  detailsPanelNodePath: null,
  isDetailsPanelOpen: false,

  setDetailsPanel: (path) =>
    set({
      detailsPanelNodePath: path,
      isDetailsPanelOpen: path !== null,
    }),

  closeDetailsPanel: () =>
    set({
      detailsPanelNodePath: null,
      isDetailsPanelOpen: false,
    }),

  // Search Navigation
  searchMatches: [],
  currentSearchMatchIndex: 0,

  setSearchMatches: (matches) =>
    set({
      searchMatches: matches,
      currentSearchMatchIndex: matches.length > 0 ? 0 : -1,
    }),

  navigateToNextMatch: () => {
    const { searchMatches, currentSearchMatchIndex, setXRayZoom } = get();
    if (searchMatches.length === 0) return;

    const nextIndex = (currentSearchMatchIndex + 1) % searchMatches.length;
    const nextPath = searchMatches[nextIndex];
    const parentPath = nextPath.includes('/') ? nextPath.substring(0, nextPath.lastIndexOf('/')) : null;

    set({
      currentSearchMatchIndex: nextIndex,
      xrayZoomPath: parentPath,
    });
  },

  navigateToPreviousMatch: () => {
    const { searchMatches, currentSearchMatchIndex, setXRayZoom } = get();
    if (searchMatches.length === 0) return;

    const prevIndex = currentSearchMatchIndex === 0 ? searchMatches.length - 1 : currentSearchMatchIndex - 1;
    const prevPath = searchMatches[prevIndex];
    const parentPath = prevPath.includes('/') ? prevPath.substring(0, prevPath.lastIndexOf('/')) : null;

    set({
      currentSearchMatchIndex: prevIndex,
      xrayZoomPath: parentPath,
    });
  },

  // Keyboard Navigation
  keyboardFocusedNodePath: null,
  navigationHistory: [],

  setKeyboardFocus: (path) => set({ keyboardFocusedNodePath: path }),

  pushNavigationHistory: (path) =>
    set((state) => ({
      navigationHistory: [...state.navigationHistory, path],
    })),

  popNavigationHistory: () => {
    const { navigationHistory } = get();
    if (navigationHistory.length === 0) return null;

    const newHistory = [...navigationHistory];
    const popped = newHistory.pop();
    set({ navigationHistory: newHistory });
    return popped || null;
  },

  // Hover State
  hoveredNodePath: null,
  setHoveredNode: (path) => set({ hoveredNodePath: path }),
}));
```

---

## Enhanced Labels with Size Threshold

### Create Label Calculator Utility

**File**: `src/lib/visualization/node-label-calculator.ts`

```typescript
import type { TreemapNode } from './treemap-generator';

export interface NodeLabelMetadata {
  nodePath: string;
  shouldShowLabel: boolean;
  labelText: string;
  fontSize: number;
  boxWidth: number;
  boxHeight: number;
  meetsWidthThreshold: boolean;
  meetsHeightThreshold: boolean;
  estimatedTextWidth: number;
  requiresTruncation: boolean;
}

const LABEL_WIDTH_THRESHOLD = 50; // pixels
const LABEL_HEIGHT_THRESHOLD = 20; // pixels
const DEFAULT_FONT_SIZE = 12; // pixels
const HORIZONTAL_PADDING = 8; // pixels (4px each side)

/**
 * Estimate text width using average character width heuristic
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  // Average character width is ~0.6 * font size for most fonts
  return text.length * fontSize * 0.6;
}

/**
 * Truncate text with ellipsis to fit width
 */
export function truncateLabel(text: string, maxWidth: number, fontSize: number): string {
  const ellipsis = '...';
  const ellipsisWidth = estimateTextWidth(ellipsis, fontSize);

  if (estimateTextWidth(text, fontSize) <= maxWidth) {
    return text; // Fits without truncation
  }

  // Binary search for max length that fits
  let left = 0;
  let right = text.length;

  while (left < right) {
    const mid = Math.floor((left + right + 1) / 2);
    const candidate = text.substring(0, mid) + ellipsis;
    const width = estimateTextWidth(candidate, fontSize);

    if (width <= maxWidth) {
      left = mid;
    } else {
      right = mid - 1;
    }
  }

  return text.substring(0, left) + ellipsis;
}

/**
 * Calculate node label metadata
 */
export function calculateNodeLabel(
  node: TreemapNode & { width?: number; height?: number },
  fontSize: number = DEFAULT_FONT_SIZE
): NodeLabelMetadata {
  const boxWidth = node.width || 0;
  const boxHeight = node.height || 0;

  const meetsWidthThreshold = boxWidth >= LABEL_WIDTH_THRESHOLD;
  const meetsHeightThreshold = boxHeight >= LABEL_HEIGHT_THRESHOLD;

  const availableWidth = boxWidth - HORIZONTAL_PADDING;
  const estimatedTextWidth = estimateTextWidth(node.name, fontSize);
  const requiresTruncation = estimatedTextWidth > availableWidth;

  const labelText = requiresTruncation
    ? truncateLabel(node.name, availableWidth, fontSize)
    : node.name;

  const shouldShowLabel =
    meetsWidthThreshold && meetsHeightThreshold && availableWidth > 0;

  return {
    nodePath: node.path,
    shouldShowLabel,
    labelText,
    fontSize,
    boxWidth,
    boxHeight,
    meetsWidthThreshold,
    meetsHeightThreshold,
    estimatedTextWidth,
    requiresTruncation,
  };
}
```

### Update Treemap Component

**File**: `src/components/xray/Treemap.tsx`

```typescript
import { calculateNodeLabel } from '../../lib/visualization/node-label-calculator';

export function Treemap({ data, totalSize, colorScheme, searchMatches, onNodeClick }: TreemapProps) {
  return (
    <ResponsiveTreeMapCanvas
      data={data}
      identity="name"
      value="value"
      // NEW: Custom label function with size threshold
      label={(node: any) => {
        const actualNode = node.node || node;
        if (!actualNode.data) return '';

        // Check if node dimensions meet threshold
        const metadata = calculateNodeLabel({
          ...actualNode.data,
          width: actualNode.width,
          height: actualNode.height,
        });

        return metadata.shouldShowLabel ? metadata.labelText : '';
      }}
      labelSkipSize={1} // Let our custom logic handle visibility
      // ... rest of props
    />
  );
}
```

---

## WCAG-Compliant Colors

### Create Color Utilities

**File**: `src/lib/visualization/color-scheme.ts` (enhancements)

```typescript
import { readableColor, parseToRgba, rgba } from 'color2k';

/**
 * Calculate WCAG contrast ratio
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    const [r, g, b] = parseToRgba(color);
    const rgb = [r, g, b].map((val) => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get label color with WCAG AA guarantee (4.5:1 ratio)
 */
export function getLabelColor(backgroundColor: string, minContrastRatio: number = 4.5): string {
  const whiteContrast = calculateContrastRatio('#ffffff', backgroundColor);
  const blackContrast = calculateContrastRatio('#000000', backgroundColor);

  if (whiteContrast >= minContrastRatio) return '#ffffff';
  if (blackContrast >= minContrastRatio) return '#000000';

  // Fallback: return whichever has higher contrast
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Validate color palette for WCAG AA
 */
export function validateColorPalette(): void {
  const borderColor = '#ffffff';
  const minGraphicsRatio = 3.0; // WCAG AA for graphical elements

  Object.entries(TYPE_COLORS).forEach(([type, color]) => {
    const ratio = calculateContrastRatio(color, borderColor);
    if (ratio < minGraphicsRatio) {
      console.warn(
        `[Color Scheme] ${type} color ${color} has insufficient contrast (${ratio.toFixed(2)}:1). ` +
          `WCAG AA requires ${minGraphicsRatio}:1 for graphics.`
      );
      // TODO: Adjust color programmatically if needed
    }
  });
}

// Call on initialization
validateColorPalette();
```

### Update Color Usage in Treemap

```typescript
labelTextColor={(node: any) => {
  const actualNode = node.node || node;
  if (!actualNode.data) return '#000000';

  const bgColor = getNodeColor(
    actualNode.value,
    actualNode.data.type,
    totalSize,
    actualNode.data.compressedSize,
    colorScheme
  );

  // NEW: Use WCAG-compliant label color
  return getLabelColor(bgColor, 4.5);
}}
```

---

## Details Panel Integration

### Create Details Panel Component

**File**: `src/components/xray/DetailsPanel.tsx`

```typescript
import React from 'react';
import { formatBytes } from '../../utils/formatters';
import type { TreemapNode } from '../../lib/visualization/treemap-generator';

export interface DetailsPanelData {
  nodePath: string;
  displayName: string;
  uncompressedSize: number;
  compressedSize?: number;
  percentOfTotal: number;
  percentOfParent: number;
  contentType: string;
  childCount: number;
  isLeafNode: boolean;
  isZoomable: boolean;
}

export interface DetailsPanelProps {
  data: DetailsPanelData | null;
  isOpen: boolean;
  onClose: () => void;
  onZoomToNode?: (path: string) => void;
}

export function DetailsPanel({ data, isOpen, onClose, onZoomToNode }: DetailsPanelProps) {
  if (!isOpen || !data) return null;

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close details panel"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-full pb-20">
        {/* Name */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Name</div>
          <div className="text-base font-medium text-gray-900 break-words">{data.displayName}</div>
        </div>

        {/* Path */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Path</div>
          <div className="text-xs text-gray-700 break-all bg-gray-50 p-2 rounded font-mono">
            {data.nodePath}
          </div>
        </div>

        {/* Size */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Size</div>
          <div className="text-base font-semibold text-gray-900">
            {formatBytes(data.uncompressedSize)}
          </div>
          {data.compressedSize && (
            <div className="text-sm text-gray-600 mt-1">
              Compressed: {formatBytes(data.compressedSize)} (
              {((data.compressedSize / data.uncompressedSize) * 100).toFixed(1)}%)
            </div>
          )}
        </div>

        {/* Percentages */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Percentage of Total</div>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(data.percentOfTotal, 100)}%` }}
              />
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900">
              {data.percentOfTotal.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Type</div>
          <div className="text-sm text-gray-900 capitalize">
            {data.contentType.replace('_', ' ')}
          </div>
        </div>

        {!data.isLeafNode && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-1">Children</div>
            <div className="text-sm text-gray-900">{data.childCount} items</div>
          </div>
        )}

        {/* Actions */}
        {data.isZoomable && onZoomToNode && (
          <div className="mt-6">
            <button
              onClick={() => onZoomToNode(data.nodePath)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Zoom to this item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Transform TreemapNode to DetailsPanelData
 */
export function toDetailsPanelData(
  node: TreemapNode,
  totalSize: number,
  parentSize: number
): DetailsPanelData {
  return {
    nodePath: node.path,
    displayName: node.name,
    uncompressedSize: node.value,
    compressedSize: node.compressedSize,
    percentOfTotal: (node.value / totalSize) * 100,
    percentOfParent: (node.value / parentSize) * 100,
    contentType: node.type,
    childCount: node.children?.length || 0,
    isLeafNode: !node.children || node.children.length === 0,
    isZoomable: (node.children?.length || 0) > 0,
  };
}
```

### Integrate in XRayView

**File**: `src/components/xray/XRayView.tsx`

```typescript
import { DetailsPanel, toDetailsPanelData } from './DetailsPanel';

export function XRayView() {
  const {
    detailsPanelNodePath,
    isDetailsPanelOpen,
    setDetailsPanel,
    closeDetailsPanel,
  } = useAnalysisStore();

  // Find node for details panel
  const detailsPanelData = useMemo(() => {
    if (!detailsPanelNodePath || !treemapData || !currentAnalysis) return null;

    const findNode = (node: TreemapNode): TreemapNode | null => {
      if (node.path === detailsPanelNodePath) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(treemapData);
    if (!node) return null;

    return toDetailsPanelData(node, currentAnalysis.totalInstallSize, treemapData.value);
  }, [detailsPanelNodePath, treemapData, currentAnalysis]);

  return (
    <div className="flex flex-col bg-white relative">
      {/* ... existing content ... */}

      {/* Details Panel */}
      <DetailsPanel
        data={detailsPanelData}
        isOpen={isDetailsPanelOpen}
        onClose={closeDetailsPanel}
        onZoomToNode={(path) => {
          setXRayZoom(path);
          closeDetailsPanel();
        }}
      />
    </div>
  );
}
```

---

## Search with Navigation

### Enhance Search in XRayView

```typescript
export function XRayView() {
  const {
    xraySearchQuery,
    searchMatches,
    currentSearchMatchIndex,
    setXRaySearch,
    setSearchMatches,
    navigateToNextMatch,
    navigateToPreviousMatch,
  } = useAnalysisStore();

  // Update search matches when query changes
  useEffect(() => {
    if (!currentAnalysis) return;

    if (xraySearchQuery) {
      const matches = searchTree(currentAnalysis.breakdownRoot, xraySearchQuery);
      setSearchMatches(matches);
    } else {
      setSearchMatches([]);
    }
  }, [xraySearchQuery, currentAnalysis, setSearchMatches]);

  // Handle keyboard shortcuts for search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateToPreviousMatch();
      } else {
        navigateToNextMatch();
      }
    }
  };

  return (
    <div>
      {/* Enhanced Search Bar */}
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search files..."
            value={xraySearchQuery}
            onChange={(e) => setXRaySearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {searchMatches.length > 0 && (
            <>
              <button
                onClick={navigateToPreviousMatch}
                className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                aria-label="Previous match"
              >
                ↑
              </button>
              <button
                onClick={navigateToNextMatch}
                className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                aria-label="Next match"
              >
                ↓
              </button>
            </>
          )}
        </div>
        {searchMatches.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Match {currentSearchMatchIndex + 1} of {searchMatches.length}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Keyboard Navigation

### Add Keyboard Handler

**File**: `src/components/xray/XRayView.tsx`

```typescript
export function XRayView() {
  const treemapRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Focus search on '/'
      if (e.key === '/') {
        e.preventDefault();
        // Focus search input (add ref to search input)
        return;
      }

      // Home key - return to root
      if (e.key === 'Home') {
        e.preventDefault();
        setXRayZoom(null);
        return;
      }

      // Escape - zoom out or close panel
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isDetailsPanelOpen) {
          closeDetailsPanel();
        } else if (xrayZoomPath) {
          // Zoom out one level
          const parentPath = xrayZoomPath.includes('/')
            ? xrayZoomPath.substring(0, xrayZoomPath.lastIndexOf('/'))
            : null;
          setXRayZoom(parentPath);
        }
        return;
      }
    },
    [xrayZoomPath, isDetailsPanelOpen, setXRayZoom, closeDetailsPanel]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <div ref={treemapRef}>{/* content */}</div>;
}
```

---

## Testing Examples

### Unit Test: Label Calculator

**File**: `src/__tests__/lib/visualization/node-label-calculator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateNodeLabel, truncateLabel, estimateTextWidth } from '../../../lib/visualization/node-label-calculator';

describe('NodeLabelCalculator', () => {
  it('should show label when box meets threshold', () => {
    const node = {
      path: 'test.txt',
      name: 'test.txt',
      value: 1000,
      type: 'data' as const,
      compressedSize: undefined,
      width: 100, // >= 50
      height: 30, // >= 20
    };

    const metadata = calculateNodeLabel(node, 12);

    expect(metadata.shouldShowLabel).toBe(true);
    expect(metadata.meetsWidthThreshold).toBe(true);
    expect(metadata.meetsHeightThreshold).toBe(true);
  });

  it('should not show label when box too small', () => {
    const node = {
      path: 'test.txt',
      name: 'test.txt',
      value: 1000,
      type: 'data' as const,
      compressedSize: undefined,
      width: 40, // < 50
      height: 15, // < 20
    };

    const metadata = calculateNodeLabel(node, 12);

    expect(metadata.shouldShowLabel).toBe(false);
    expect(metadata.meetsWidthThreshold).toBe(false);
    expect(metadata.meetsHeightThreshold).toBe(false);
  });

  it('should truncate long text', () => {
    const longText = 'VeryLongFileNameThatWontFit.framework';
    const maxWidth = 50;
    const fontSize = 12;

    const truncated = truncateLabel(longText, maxWidth, fontSize);

    expect(truncated).toContain('...');
    expect(estimateTextWidth(truncated, fontSize)).toBeLessThanOrEqual(maxWidth);
  });
});
```

### Component Test: Details Panel

**File**: `src/__tests__/components/xray/DetailsPanel.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailsPanel } from '../../../components/xray/DetailsPanel';

describe('DetailsPanel', () => {
  const mockData = {
    nodePath: 'Frameworks/Test.framework',
    displayName: 'Test.framework',
    uncompressedSize: 1024000,
    percentOfTotal: 5.2,
    percentOfParent: 10.4,
    contentType: 'frameworks',
    childCount: 3,
    isLeafNode: false,
    isZoomable: true,
  };

  it('renders panel when open', () => {
    render(<DetailsPanel data={mockData} isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Test.framework')).toBeInTheDocument();
    expect(screen.getByText('Frameworks/Test.framework')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<DetailsPanel data={mockData} isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close details panel');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows zoom button for zoomable nodes', () => {
    const onZoomToNode = vi.fn();
    render(
      <DetailsPanel
        data={mockData}
        isOpen={true}
        onClose={() => {}}
        onZoomToNode={onZoomToNode}
      />
    );

    const zoomButton = screen.getByText('Zoom to this item');
    fireEvent.click(zoomButton);

    expect(onZoomToNode).toHaveBeenCalledWith('Frameworks/Test.framework');
  });
});
```

---

## Next Steps

1. **Implement Components**: Create new components (DetailsPanel, InfoIconButton, Breadcrumb)
2. **Update Existing Components**: Modify Treemap.tsx and XRayView.tsx per examples above
3. **Add Utilities**: Create node-label-calculator.ts and enhance color-scheme.ts
4. **Write Tests**: Follow testing examples for unit and component tests
5. **Run Tests**: `npm test` to verify all tests pass
6. **Test Manually**: Load app with IPA/APK and verify UX improvements
7. **Accessibility Check**: Test with keyboard navigation and screen reader

---

## Troubleshooting

### Labels not showing
- Check `labelSkipSize` is set to low value (1)
- Verify `calculateNodeLabel` is returning `shouldShowLabel: true`
- Inspect node dimensions in browser DevTools

### Colors not WCAG compliant
- Run `validateColorPalette()` and check console warnings
- Use browser extension like "WCAG Color Contrast Checker"
- Adjust `TYPE_COLORS` values if needed

### Search not navigating
- Verify `setSearchMatches` is called after `searchTree`
- Check `navigateToNextMatch` logs in console
- Ensure parent path extraction is correct

### Details panel not opening
- Check `setDetailsPanel` is called with correct path
- Verify `isDetailsPanelOpen` is true in store
- Inspect panel CSS transform (should be `translate-x-0` when open)

---

## Reference Links

- [Nivo Treemap Documentation](https://nivo.rocks/treemap/)
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [color2k Documentation](https://github.com/ricokahler/color2k)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

**Quickstart Complete**. All integration examples provided. Ready for implementation phase.
