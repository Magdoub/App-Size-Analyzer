# Data Model: Xray Chart and Insights Enhancements

**Feature**: 007-xray-insights-enhancements
**Date**: 2025-11-10
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data structures and types for the Xray chart color modes, enhanced insights, and label rendering logic. All types use JSDoc notation (JavaScript + type annotations) per project conventions.

---

## Core Entities

### 1. ColorMode

**Purpose**: Enum representing the active treemap coloring strategy.

**Type Definition** (src/types/analysis.js):
```javascript
/**
 * Treemap color visualization mode
 * @typedef {'size' | 'type' | 'compression'} ColorMode
 *
 * - 'size': Blue gradient from light (small) to dark (large)
 * - 'type': Categorical colors by ContentType (existing behavior)
 * - 'compression': Green (well-compressed) to red (uncompressed) - FUTURE
 */
```

**Valid Values**:
- `'size'` - Size-based blue gradient (P1 feature)
- `'type'` - Type-based categorical colors (existing, P1 feature)
- `'compression'` - Compression ratio heat map (future enhancement, out of scope)

**Default**: `'type'` (maintains backward compatibility)

**State Location**: `uiStore.js` → `xray.colorMode`

**Persistence**: sessionStorage key `'xray-color-mode'`

**Validation**:
```javascript
/**
 * Validate color mode value
 * @param {string} mode - Mode to validate
 * @returns {boolean} True if valid
 */
function isValidColorMode(mode) {
  return ['size', 'type', 'compression'].includes(mode);
}
```

---

### 2. ColorGradientConfig

**Purpose**: Configuration for size-based gradient color calculation.

**Type Definition** (src/lib/visualization/color-scheme.js):
```javascript
/**
 * Configuration for size gradient color scheme
 * @typedef {Object} ColorGradientConfig
 * @property {number} hue - HSL hue value (0-360), default 210 (blue)
 * @property {number} minSaturation - Minimum saturation % for small files, default 70
 * @property {number} maxSaturation - Maximum saturation % for large files, default 90
 * @property {number} minLightness - Lightness % for largest files (darkest), default 20
 * @property {number} maxLightness - Lightness % for smallest files (lightest), default 90
 * @property {number[]} percentiles - Pre-calculated size percentiles [p10, p25, p50, p75, p90]
 */
```

**Default Configuration**:
```javascript
const DEFAULT_GRADIENT_CONFIG = {
  hue: 210,              // Blue
  minSaturation: 70,
  maxSaturation: 90,
  minLightness: 20,      // Darkest (large files)
  maxLightness: 90,      // Lightest (small files)
  percentiles: []        // Calculated at runtime from tree
};
```

**Percentile Calculation**:
```javascript
/**
 * Calculate size percentiles from breakdown tree
 * @param {BreakdownNode} root - Tree root
 * @returns {number[]} [p10, p25, p50, p75, p90] percentile values
 */
function calculateSizePercentiles(root) {
  // Flatten tree to all leaf nodes
  const sizes = flattenTree(root)
    .filter(node => !node.children || node.children.length === 0)
    .map(node => node.size)
    .sort((a, b) => a - b);

  return [
    sizes[Math.floor(sizes.length * 0.10)], // p10
    sizes[Math.floor(sizes.length * 0.25)], // p25
    sizes[Math.floor(sizes.length * 0.50)], // p50 (median)
    sizes[Math.floor(sizes.length * 0.75)], // p75
    sizes[Math.floor(sizes.length * 0.90)], // p90
  ];
}
```

---

### 3. EnhancedInsightResult

**Purpose**: Extended insight result with file-level details and estimated savings.

**Type Definition** (extends existing InsightResult in src/types/analysis.js):
```javascript
/**
 * Enhanced insight result with file-level details
 * @typedef {Object} EnhancedInsightResult
 * @property {string} ruleId - Unique rule identifier
 * @property {'critical' | 'high' | 'medium' | 'low'} severity - Impact severity
 * @property {string} category - Insight category (e.g., 'size-optimization', 'compression')
 * @property {string} title - Short title for display
 * @property {string} description - Detailed explanation
 * @property {AffectedFile[]} affectedFiles - Files with details (NEW - replaces string[])
 * @property {string} recommendation - Actionable advice
 * @property {number} potentialSavings - Estimated bytes saved if recommendation applied
 * @property {InsightMetadata} metadata - Additional context (NEW)
 */

/**
 * File affected by an insight with contextual details
 * @typedef {Object} AffectedFile
 * @property {string} path - Full file path in archive
 * @property {number} size - File size in bytes
 * @property {ContentType} type - File content type
 * @property {number} [compressedSize] - Compressed size if applicable
 * @property {number} [compressionRatio] - Ratio (compressedSize/size) if applicable
 * @property {string} [context] - Additional context (e.g., "3x duplicate")
 */

/**
 * Metadata for enhanced insights
 * @typedef {Object} InsightMetadata
 * @property {number} totalAffectedSize - Sum of all affected files sizes
 * @property {number} percentageOfApp - % of total app size affected
 * @property {string} [benchmark] - Comparison benchmark if applicable (e.g., "2.5x typical React Native size")
 */
```

**Example Usage**:
```javascript
const insight = {
  ruleId: 'large-files-top-10',
  severity: 'medium',
  category: 'size-optimization',
  title: 'Top 10 Largest Files',
  description: 'These files account for 45% of your app size',
  affectedFiles: [
    {
      path: 'Frameworks/firebase.framework/firebase',
      size: 47185920,  // 45MB
      type: 'framework',
      context: 'Largest single file'
    },
    {
      path: 'Assets.car/logo@3x.png',
      size: 8388608,  // 8MB
      type: 'image',
      compressedSize: 8000000,
      compressionRatio: 0.95,
      context: 'Poorly compressed'
    },
    // ... 8 more files
  ],
  recommendation: 'Consider lazy loading frameworks and optimizing image compression',
  potentialSavings: 15728640, // ~15MB estimated
  metadata: {
    totalAffectedSize: 120586240, // ~115MB
    percentageOfApp: 45.2,
    benchmark: null
  }
};
```

---

### 4. LabelRenderConfig

**Purpose**: Configuration for intelligent label rendering based on box dimensions.

**Type Definition** (src/lib/visualization/node-label-calculator.js):
```javascript
/**
 * Configuration for label rendering logic
 * @typedef {Object} LabelRenderConfig
 * @property {number} minWidth - Minimum box width (px) to show label, default 50
 * @property {number} minHeight - Minimum box height (px) to show label, default 20
 * @property {number} fontSize - Font size in pixels, default 12
 * @property {number} padding - Internal padding (px) to account for, default 4
 * @property {boolean} truncateWithEllipsis - Add '...' if text exceeds width, default true
 */
```

**Default Configuration**:
```javascript
const DEFAULT_LABEL_CONFIG = {
  minWidth: 50,
  minHeight: 20,
  fontSize: 12,
  padding: 4,
  truncateWithEllipsis: true
};
```

**Label Decision Logic**:
```javascript
/**
 * Determine if label should be shown and how to render it
 * @param {TreemapNode} node - Node to render
 * @param {LabelRenderConfig} config - Rendering configuration
 * @returns {{show: boolean, text: string}}
 */
function calculateLabel(node, config) {
  // Check minimum dimensions
  if (node.width < config.minWidth || node.height < config.minHeight) {
    return { show: false, text: '' };
  }

  // Calculate available width (accounting for padding)
  const availableWidth = node.width - (config.padding * 2);
  const avgCharWidth = config.fontSize * 0.6; // Rough estimate
  const maxChars = Math.floor(availableWidth / avgCharWidth);

  // Truncate if needed
  let text = node.name;
  if (text.length > maxChars && config.truncateWithEllipsis) {
    text = text.substring(0, maxChars - 3) + '...';
  }

  return { show: true, text };
}
```

---

## State Management Extensions

### UIStore (uiStore.js) - XRay State

**Existing State** (no changes):
```javascript
xray: {
  zoomPath: string | null,              // Current drill-down path
  categories: Set<string>,               // Selected file type filters
  searchQuery: string,                   // Search text
  hoveredNodePath: string | null,        // For hover highlighting
  detailsPanelNodePath: string | null,   // Details panel target
  searchMatches: string[],               // Matching paths from search
  currentSearchMatchIndex: number,       // Active search result index
  navigationHistory: string[]            // Breadcrumb history
}
```

**New State**:
```javascript
xray: {
  // ... existing properties above ...

  /**
   * Active treemap color mode
   * @type {ColorMode}
   */
  colorMode: 'type',  // Default to existing type-based colors

  /**
   * Cached percentiles for size gradient (recalculated on analysis change)
   * @type {number[]}
   */
  sizePercentiles: []
}
```

**New Actions**:
```javascript
/**
 * Set treemap color mode
 * @param {ColorMode} mode - New color mode
 */
setXRayColorMode(mode) {
  if (!isValidColorMode(mode)) {
    console.warn(`Invalid color mode: ${mode}, defaulting to 'type'`);
    mode = 'type';
  }
  this.xray.colorMode = mode;
  sessionStorage.setItem('xray-color-mode', mode);
}

/**
 * Update size percentiles (called when analysis changes)
 * @param {number[]} percentiles - Calculated percentiles [p10, p25, p50, p75, p90]
 */
updateSizePercentiles(percentiles) {
  this.xray.sizePercentiles = percentiles;
}

/**
 * Initialize color mode from session storage
 */
initializeColorMode() {
  const saved = sessionStorage.getItem('xray-color-mode');
  if (saved && isValidColorMode(saved)) {
    this.xray.colorMode = saved;
  }
}
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│   UIStore.xray  │
│                 │
│ + colorMode ────┼──→ ColorMode ('size' | 'type' | 'compression')
│ + sizePercentiles │
└────────┬────────┘
         │
         │ uses
         ↓
┌──────────────────────┐
│  color-scheme.js     │
│                      │
│ + getNodeColor()     │
│ + getColorBySize() ──┼──→ Uses ColorGradientConfig
│ + getColorByType()   │    + percentiles from UIStore
│ + getLabelColor()    │    + HSL calculation
└──────────────────────┘

┌───────────────────────┐
│  Treemap.vue          │
│                       │
│ + getNodeColorForChart() ───→ Reads colorMode from UIStore
│ + chartOption (computed) ───→ Reactive to colorMode changes
└───────────────────────┘

┌──────────────────────┐
│  InsightEngine       │
│                      │
│ + executeAll() ──────┼──→ Returns EnhancedInsightResult[]
│ + registerRule()     │
└──────────┬───────────┘
           │
           │ produces
           ↓
┌───────────────────────────┐
│ EnhancedInsightResult     │
│                           │
│ + affectedFiles: AffectedFile[] ───→ File-level details
│ + metadata: InsightMetadata     ───→ Aggregate stats
│ + potentialSavings: number
└───────────────────────────┘

┌─────────────────────────┐
│ node-label-calculator.js│
│                         │
│ + calculateLabel() ─────┼──→ Uses LabelRenderConfig
│ + shouldShowLabel()     │
└─────────────────────────┘
```

---

## Data Flow

### Color Mode Switching Flow

1. **User Action**: Clicks "Color by Size" toggle in XRayView.vue
2. **State Update**: `uiStore.setXRayColorMode('size')` called
3. **Persistence**: Mode saved to sessionStorage
4. **Reactivity**: Treemap.vue's `chartOption` computed property re-evaluates
5. **Color Calculation**: `getNodeColorForChart()` reads new mode, calls appropriate color function
6. **Rendering**: ECharts re-renders treemap with new colors (all nodes update)
7. **Label Contrast**: `getLabelColor()` recalculates text color for WCAG AA compliance

### Enhanced Insights Generation Flow

1. **Trigger**: User navigates to Insights tab (InsightsView.vue mounted)
2. **Engine Execution**: `insightEngine.executeAll(currentAnalysis)` called
3. **Parallel Rules**: All registered rules execute in parallel (Promise.all)
4. **Tree Traversal**: Each rule traverses `BreakdownNode` tree to find matching files
5. **File Details**: Rules build `AffectedFile[]` arrays with size, type, compression data
6. **Savings Estimation**: Calculate `potentialSavings` based on compression ratios, duplicates
7. **Result Assembly**: Construct `EnhancedInsightResult` objects with metadata
8. **Filtering**: InsightsView filters by severity/category (existing logic)
9. **Display**: InsightCard renders file list, savings estimate, recommendations

---

## Validation Rules

### ColorMode Validation
- **Required**: Must be one of `['size', 'type', 'compression']`
- **Default**: Falls back to `'type'` if invalid
- **Type Check**: String validation before assignment

### ColorGradientConfig Validation
- **Hue**: 0-360 (HSL hue range)
- **Saturation**: 0-100 (percentage)
- **Lightness**: 0-100 (percentage)
- **Percentiles**: Array of 5 positive numbers in ascending order

### EnhancedInsightResult Validation
- **ruleId**: Non-empty string
- **severity**: One of `['critical', 'high', 'medium', 'low']`
- **affectedFiles**: Non-empty array for most rules
- **potentialSavings**: Non-negative number (0 if not calculable)
- **metadata.percentageOfApp**: 0-100 range

### LabelRenderConfig Validation
- **minWidth**: Positive integer (pixels)
- **minHeight**: Positive integer (pixels)
- **fontSize**: Positive integer (pixels)
- **padding**: Non-negative integer (pixels)

---

## Migration Notes

### Backward Compatibility

**ColorMode Default**:
- Existing users will see `'type'` mode by default (no visual change)
- sessionStorage check ensures preference persists within session
- If sessionStorage corrupted/invalid, falls back to `'type'`

**InsightResult Structure**:
- `affectedFiles` changes from `string[]` to `AffectedFile[]`
- Migration: Update InsightCard.vue to handle both formats during transition:
  ```javascript
  // Support legacy string[] and new AffectedFile[]
  const files = Array.isArray(insight.affectedFiles)
    ? insight.affectedFiles.map(f => typeof f === 'string' ? {path: f} : f)
    : [];
  ```

**Label Rendering**:
- No breaking changes - extends existing `node-label-calculator.js`
- Existing 50x20 threshold preserved

---

## Summary

| Entity | Purpose | Location | Status |
|--------|---------|----------|--------|
| **ColorMode** | Enum for color visualization strategy | types/analysis.js | NEW |
| **ColorGradientConfig** | Size gradient configuration | lib/visualization/color-scheme.js | NEW |
| **EnhancedInsightResult** | Insight with file details | types/analysis.js | MODIFIED |
| **AffectedFile** | File details in insights | types/analysis.js | NEW |
| **InsightMetadata** | Aggregate insight stats | types/analysis.js | NEW |
| **LabelRenderConfig** | Label rendering configuration | lib/visualization/node-label-calculator.js | EXISTING (document) |
| **UIStore.xray.colorMode** | Active color mode state | stores/uiStore.js | NEW |
| **UIStore.xray.sizePercentiles** | Cached percentiles | stores/uiStore.js | NEW |

All data structures are defined using JSDoc notation for IDE support and runtime type hints, consistent with project's JavaScript-first approach.

