# Research: Xray Chart and Insights Enhancements

**Feature**: 007-xray-insights-enhancements
**Date**: 2025-11-10
**Phase**: 0 - Research & Technical Decisions

## Overview

This document captures technical research and design decisions for implementing dual color modes (size gradient and type-based), visible chart labels, and enhanced insights in the Vue 3-based app size analyzer.

---

## Research Areas

### 1. Blue Gradient Color Scheme for Size Visualization

#### Decision
Implement a **percentile-based blue gradient** using HSL color space, ranging from light blue (#E0F2FE - 90th percentile lightness) for small files to dark blue (#1E3A8A - 20th percentile lightness) for large files.

#### Rationale
- **Percentile-based distribution** handles outliers effectively (e.g., one 200MB file shouldn't make all other files appear identical)
- **Blue gradient** provides intuitive "cold = small, hot = large" metaphor while maintaining distinction from the existing red heat map
- **HSL color space** allows smooth interpolation with controlled hue (blue = 210°), variable saturation (70-90%), and lightness (20-90%)
- **color2k library** (already in dependencies) supports HSL manipulation and WCAG contrast calculations

#### Alternatives Considered
1. **Linear gradient** - Rejected: Single large outlier file makes all others indistinguishable
2. **Logarithmic scale** - Rejected: Less intuitive for non-technical users, harder to implement accessibly
3. **Fixed size buckets** (like current heat map) - Rejected: Less granular, percentile approach provides smoother visual progression
4. **Green-to-red gradient** - Rejected: Conflicts with existing heat map, less accessible for colorblind users

#### Implementation Approach
```javascript
/**
 * Calculate blue gradient color based on file size percentile
 * @param {number} size - File size in bytes
 * @param {number} totalSize - Total app size in bytes
 * @param {number[]} percentiles - Pre-calculated percentile array [p10, p25, p50, p75, p90]
 * @returns {string} HSL color string
 */
function getColorBySizeGradient(size, totalSize, percentiles) {
  const percentage = (size / totalSize) * 100;

  // Map to percentile bucket
  let lightness;
  if (percentage < percentiles[0]) lightness = 90;      // < p10: lightest
  else if (percentage < percentiles[1]) lightness = 75; // p10-p25
  else if (percentage < percentiles[2]) lightness = 60; // p25-p50
  else if (percentage < percentiles[3]) lightness = 45; // p50-p75
  else if (percentage < percentiles[4]) lightness = 30; // p75-p90
  else lightness = 20;                                   // > p90: darkest

  const hue = 210; // Blue
  const saturation = 70 + (90 - lightness) / 70 * 20; // More vibrant for larger files

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
```

#### Technical References
- ECharts itemStyle.color supports HSL: https://echarts.apache.org/en/option.html#series-treemap.itemStyle.color
- color2k HSL parsing: https://www.npmjs.com/package/color2k
- WCAG contrast calculation: Already implemented in `color-scheme.js` lines 298-332

---

### 2. Label Visibility and Contrast

#### Decision
Extend existing `node-label-calculator.js` logic to enforce **minimum 50x20 pixel threshold** for label display, with automatic text color selection using WCAG AA 4.5:1 contrast ratio against background (whether size gradient or type color).

#### Rationale
- **50x20 pixel minimum** already proven effective in current implementation (node-label-calculator.js line 28)
- **color2k readableColor()** function automatically selects black/white text based on background luminance
- **Consistent with current architecture** - no breaking changes, just ensure compatibility with new gradient colors
- **Performance** - Label calculation is synchronous and fast (<1ms per node per existing metrics)

#### Alternatives Considered
1. **Fixed text color (e.g., always white)** - Rejected: Fails WCAG AA on light blue gradient colors
2. **Adaptive font sizing** - Rejected: Complexity increase, current 12px font works well
3. **Label positioning outside boxes** - Rejected: Increases layout complexity, ECharts doesn't natively support this pattern

#### Implementation Verification
No changes needed to `node-label-calculator.js` core logic. Verification required:
- Ensure `getNodeLabel()` in Treemap.vue (line 142) continues to work with new gradient colors
- Test contrast calculations with HSL colors (color2k already handles HSL)

---

### 3. Enhanced Insights with File-Level Details

#### Decision
Extend `insight-engine.js` with **new rule types** that identify specific files (top 10 largest, uncompressed images, duplicate names) and provide actionable recommendations with estimated size impact.

#### Rationale
- **Existing rule architecture** already supports parallel execution, caching, and category filtering
- **File-level granularity** requires traversing `BreakdownNode` tree and collecting paths - existing `treemap-generator.js` has traversal functions
- **Estimated savings calculations** can reuse compression ratio logic from existing heat map (color-scheme.js line 174)
- **Non-breaking addition** - New rules extend existing engine, old insights continue to work

#### Alternatives Considered
1. **ML-based recommendations** - Rejected: Requires training data, adds dependency weight, overkill for deterministic rules
2. **External API for optimization suggestions** - Rejected: Violates Constitution Principle I (Client-Side Privacy)
3. **Interactive file-by-file wizard** - Rejected: Out of scope per spec.md, deferred to future feature

#### New Insight Rule Categories

**Category 1: Large File Identification**
- Rule: `large-files-top-10`
- Logic: Identify 10 largest individual files (not directories)
- Output: List of files with paths, sizes, types
- Example: "firebase.framework (45MB) - Consider lazy loading or feature flagging"

**Category 2: Compression Opportunities**
- Rule: `uncompressed-images`
- Logic: Find image files with compression ratio > 90%
- Output: List of image paths with current/potential sizes
- Example: "screenshot@3x.png (8MB uncompressed) - Potential 75% reduction with PNG optimization"

**Category 3: Duplicate Detection**
- Rule: `duplicate-file-names`
- Logic: Find files with identical names in different paths (potential accidental includes)
- Output: Grouped duplicates with paths
- Example: "logo.png appears 3 times (2MB each, 4MB total waste) - Consolidate to single asset"

**Category 4: Framework Bloat**
- Rule: `framework-size-analysis`
- Logic: Compare framework sizes against known benchmarks (e.g., typical SwiftUI app vs. current)
- Output: Frameworks exceeding 2x typical size
- Example: "React Native framework (35MB) - 2.5x typical size, review unused modules"

#### Implementation Pattern
```javascript
// insight-engine.js - New rule registration
engine.registerRule({
  id: 'large-files-top-10',
  category: 'size-optimization',
  severity: 'medium',
  execute: async (analysisContext) => {
    // Flatten tree, filter files (not dirs), sort by size desc, take 10
    const largeFiles = flattenTree(analysisContext.breakdownRoot)
      .filter(node => !node.children || node.children.length === 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      ruleId: 'large-files-top-10',
      title: 'Top 10 Largest Files',
      description: `These 10 files account for ${calculatePercentage(largeFiles)}% of your app size`,
      affectedFiles: largeFiles.map(f => f.path),
      recommendation: 'Consider lazy loading, code splitting, or asset optimization for these files',
      potentialSavings: estimateSavings(largeFiles), // e.g., 30% compression estimate
      severity: 'medium',
      category: 'size-optimization'
    };
  }
});
```

#### Technical References
- Existing insight-engine.js architecture: Lines 1-200+ (rule registry, parallel execution, caching)
- Tree traversal utilities: treemap-generator.js `searchTree()` function (line 180)
- Compression calculations: color-scheme.js `getColorByCompression()` (line 174)

---

### 4. Color Mode State Management

#### Decision
Add `colorMode: 'size' | 'type'` to `uiStore.js` xray state object, default to `'type'` (existing behavior), persist in sessionStorage for current session.

#### Rationale
- **Pinia reactive state** already manages xray UI concerns (zoom, search, categories)
- **sessionStorage persistence** meets FR-012 (persist during session) without localStorage bloat
- **Default to 'type'** maintains backward compatibility - users see familiar colors initially
- **Simple toggle logic** - single boolean or enum property, no complex state machine

#### Alternatives Considered
1. **LocalStorage persistence** - Rejected: Unnecessarily persistent, session-scoped preference is sufficient
2. **URL query parameter** - Rejected: Adds complexity, not needed for this feature
3. **Separate colorModeStore** - Rejected: Overkill, xray state already exists in uiStore

#### Implementation
```javascript
// uiStore.js - Extend xray state
xray: {
  // Existing state...
  zoomPath: null,
  categories: new Set(),
  searchQuery: '',
  // NEW: Color mode
  colorMode: 'type', // 'size' | 'type' | 'compression' (future)
}

// Actions
setXRayColorMode(mode) {
  this.xray.colorMode = mode;
  sessionStorage.setItem('xray-color-mode', mode);
},

// Initialization (in store constructor or setup)
initializeXRayColorMode() {
  const saved = sessionStorage.getItem('xray-color-mode');
  if (saved && ['size', 'type'].includes(saved)) {
    this.xray.colorMode = saved;
  }
}
```

---

### 5. ECharts Integration for Labels and Colors

#### Decision
Leverage **ECharts' native label formatter** (already in use in Treemap.vue line 324) and **itemStyle.color function** (line 337) to dynamically apply colors based on colorMode state.

#### Rationale
- **No library changes needed** - ECharts 5.5+ supports dynamic label/color functions
- **Reactive updates** - Vue 3 computed properties re-trigger ECharts option update when colorMode changes
- **Performance** - ECharts handles 10k+ nodes efficiently with canvas rendering (Constitution Principle II)
- **Label overflow** - ECharts automatically clips text outside box boundaries

#### Implementation Verification
Current implementation in Treemap.vue:
```javascript
// Line 102-124: getNodeColorForChart() - MODIFY to check colorMode
const getNodeColorForChart = (params) => {
  // Search highlighting (priority 1)
  if (props.searchMatches.includes(params.data.path)) {
    return '#fbbf24';
  }

  // NEW: Check colorMode from uiStore
  const { colorMode } = xray.value;

  let baseColor;
  if (colorMode === 'size') {
    // Call new gradient function
    baseColor = getColorBySizeGradient(params.value, props.totalSize, props.percentiles);
  } else {
    // Existing type-based color
    baseColor = getNodeColor(params.value, params.data.type, props.totalSize);
  }

  // Hover highlighting (priority 2)
  if (xray.value.hoveredNodePath === params.data.path) {
    return getHoverHighlightColor(baseColor);
  }

  return baseColor;
};
```

#### Technical References
- ECharts label formatter: https://echarts.apache.org/en/option.html#series-treemap.label.formatter
- ECharts itemStyle.color function: https://echarts.apache.org/en/option.html#series-treemap.itemStyle.color
- Vue 3 computed reactivity: Treemap.vue line 279 (`chartOption = computed(...)`)

---

### 6. File Cleanup Strategy (TSX Removal)

#### Decision
**Delete all 21 .tsx files** (17 component files + 4 test files) after verifying corresponding .vue equivalents exist and are functionally complete. Use git to preserve history.

#### Rationale
- **Migration complete** - All Vue components already implemented and functional (verified by running dev server)
- **No TypeScript compilation** - Project uses JavaScript + JSDoc per CLAUDE.md guidelines
- **Test files** - TSX test files use React Testing Library; Vue tests use @vue/test-utils (different API)
- **Git history preservation** - Deletions are tracked, old implementations can be referenced if needed

#### Deletion Checklist
1. Verify Vue equivalent exists for each TSX component
2. Confirm Vue component has same props/events/functionality
3. Check for any TSX-specific imports in .vue files (should be none)
4. Delete TSX file
5. Run dev server and test affected views
6. Run test suite (Vitest) to ensure no broken imports

#### Files to Delete (21 total)
```
src/App.tsx                                    → src/App.vue exists
src/main.tsx                                   → src/main.js exists
src/components/xray/Treemap.tsx                → Treemap.vue exists
src/components/xray/XRayView.tsx               → XRayView.vue exists
src/components/xray/CategoryFilter.tsx         → CategoryFilter.vue exists
src/components/insights/InsightsView.tsx       → InsightsView.vue exists
src/components/insights/InsightCard.tsx        → InsightCard.vue exists
src/components/insights/InsightFilters.tsx     → InsightFilters.vue exists
src/components/insights/SeveritySection.tsx    → SeveritySection.vue exists
src/components/breakdown/BreakdownView.tsx     → BreakdownView.vue exists
src/components/breakdown/BreakdownTabs.tsx     → BreakdownTabs.vue exists
src/components/breakdown/BreakdownTable.tsx    → BreakdownTable.vue exists
src/components/shared/Breadcrumb.tsx           → Breadcrumb.vue exists
src/components/shared/LoadingSpinner.tsx       → LoadingSpinner.vue exists
src/components/shared/ErrorBoundary.tsx        → ErrorBoundary.vue exists
src/components/upload/UploadZone.tsx           → UploadZone.vue exists
src/components/upload/FileValidator.tsx        → FileValidator.vue exists
src/__tests__/components/xray/Treemap.test.tsx
src/__tests__/components/xray/XRayView.test.tsx
src/__tests__/components/breakdown/BreakdownTable.test.tsx
src/__tests__/components/shared/Breadcrumb.test.tsx
```

#### Verification Command
```bash
# Check for any remaining imports of .tsx files
grep -r "from.*\.tsx" src/
grep -r "import.*\.tsx" src/

# Should return empty if migration is clean
```

---

## Summary of Technical Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| **Size Gradient** | Percentile-based HSL blue gradient (light → dark) | Handles outliers, smooth interpolation, accessible |
| **Label Visibility** | Keep 50x20px threshold, WCAG AA contrast with color2k | Proven effective, no changes needed |
| **Enhanced Insights** | 4 new rule categories (large files, compression, duplicates, frameworks) | Non-breaking extension, actionable recommendations |
| **Color Mode State** | Add `colorMode` to uiStore.xray, sessionStorage persistence | Minimal state change, session-scoped |
| **ECharts Integration** | Extend existing label/color functions with mode switching | Reactive, performant, native ECharts features |
| **TSX Cleanup** | Delete all 21 .tsx files after Vue verification | Migration complete, reduce codebase confusion |

---

## Open Questions

**None** - All technical decisions are finalized and ready for Phase 1 (data model and contracts).

---

## Next Steps

Proceed to **Phase 1: Design & Contracts**:
1. Generate `data-model.md` - Define ColorMode enum, extend InsightResult type
2. Generate `contracts/ColorModeAPI.js` - Document color scheme function signatures
3. Generate `quickstart.md` - Integration guide for using new color modes and enhanced insights
4. Update agent context with new dependencies/patterns

