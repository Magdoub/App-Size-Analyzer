# Research: Summary Page with Size Distribution Graphs

**Feature**: 010-summary-page-graphs | **Date**: 2025-11-12 | **Phase**: 0

## Overview

This document captures technical research and decisions made during Phase 0 planning for the Summary page feature. All technical unknowns identified in the Technical Context section of plan.md have been resolved through codebase exploration and library evaluation.

---

## Research Question 1: Chart Library Selection

### Decision
**Use ECharts 5.5.0 with vue-echarts 7.0.3 wrapper (already installed)**

### Rationale
- **Already integrated**: Project uses ECharts for the Treemap component in XRayView
- **Proven performance**: Canvas rendering handles 10,000+ nodes without blocking UI
- **Rich chart types**: Supports bar charts, horizontal bar charts, stacked bars, line charts - all needed for Summary page
- **Vue 3 compatible**: vue-echarts 7.0.3 provides native Vue 3 Composition API support
- **Consistent patterns**: Reuse existing import patterns from `components/xray/Treemap.vue`

### Alternatives Considered

**Chart.js**
- ❌ Not currently in project dependencies (would add 200KB+ bundle size)
- ❌ Less performant for complex charts compared to ECharts canvas rendering
- ✓ Simpler API for basic charts

**D3.js**
- ❌ Not in dependencies (would add 300KB+ bundle size)
- ❌ Requires custom implementation of every chart type (high development time)
- ✓ Maximum flexibility for custom visualizations

**Native Canvas API**
- ❌ Would require implementing chart logic from scratch (very high complexity)
- ❌ No built-in tooltip, legend, or interaction patterns
- ✓ Zero dependencies

### Implementation Pattern
```javascript
// Import minimal ECharts modules for tree shaking
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([BarChart, CanvasRenderer, TooltipComponent, GridComponent, LegendComponent]);
```

This pattern is already proven in `components/xray/Treemap.vue`.

---

## Research Question 2: Data Aggregation Strategy

### Decision
**Traverse breakdown tree once per aggregation type, compute on-demand in computed properties**

### Rationale
- **Performance**: Single tree traversal per chart is O(n) where n = file count. For 10,000 files, this is ~10-50ms per aggregation.
- **Simplicity**: Pure functions in `utils/calculations.js` - no caching layer needed
- **Reactivity**: Vue computed properties automatically recalculate when `analysisStore.currentAnalysis` changes
- **Memory efficient**: No persistent aggregated data structures (charts recompute from source)

### Implementation Strategy

**Aggregation Functions** (add to `src/utils/calculations.js`):

1. `aggregateFilesByType(breakdownRoot)` → `Map<ContentType, {size, compressedSize, count}>`
   - Recursive tree traversal
   - For each leaf node (file), accumulate by `node.type`
   - Track both `size` (uncompressed) and `compressedSize` (iOS only)

2. `aggregateByComponent(breakdownRoot, platform)` → `{internal: {...}, external: {...}}`
   - Heuristic classification:
     - **iOS External**: Paths starting with `Frameworks/`, `System/Library/`
     - **iOS Internal**: All other paths
     - **Android External**: Paths in `lib/` directories (native .so files)
     - **Android Internal**: DEX files, app resources, assets

3. `getTopFiles(breakdownRoot, count)` → `Array<{path, size, compressedSize}>`
   - Flatten tree to array of files
   - Sort by size descending
   - Return top N

4. `analyzeCompressionByType(breakdownRoot)` → `Map<ContentType, {compressed, uncompressed, ratio}>`
   - Only applicable to iOS apps
   - Group by type, compute compression ratio per category

5. `analyzeLocalizations(breakdownRoot, platform)` → `Map<string, {size, count}>`
   - **iOS**: Detect `.lproj` directories (e.g., `en.lproj`, `es.lproj`)
   - **Android**: Detect `res/values-{locale}` directories
   - Aggregate size per locale

6. `analyzeArchitectures(breakdownRoot)` → `Map<string, size>`
   - Android only
   - Parse `lib/{arch}/` directories (arm64-v8a, armeabi-v7a, x86, x86_64)
   - Sum sizes per architecture

7. `categorizeAssetTypes(breakdownRoot)` → `{images, videos, audio, fonts}`
   - Filter nodes by `type` field:
     - images: `type === 'image'`
     - videos: `type === 'video'`
     - audio: `type === 'audio'`
     - fonts: `type === 'font'`
   - Aggregate sizes per category

### Alternatives Considered

**Precompute all aggregations on analysis completion**
- ❌ Wastes computation for charts user may never view
- ❌ Increases memory footprint (storing redundant aggregated data)
- ✓ Slightly faster initial chart render

**Cache aggregations in Pinia store**
- ❌ Adds complexity (cache invalidation logic)
- ❌ User never modifies analysis data after initial parse, so cache provides no benefit
- ✓ Prevents redundant computation if user switches away and back to Summary view

**Current Decision Validation**: On-demand computation is sufficient because:
1. Aggregations are fast (<500ms for 10k files)
2. User typically views Summary page once per analysis
3. Simpler code with no cache invalidation bugs

---

## Research Question 3: File Type Categorization Mapping

### Decision
**Group 15 existing ContentTypes into 7-8 user-friendly categories for chart display**

### Rationale
The existing 15 ContentTypes are too granular for high-level distribution charts. Users need actionable categories that guide optimization decisions.

### Category Mapping

**iOS Apps:**
| User Category | ContentTypes Included | Color (from color-scheme.js) |
|---------------|----------------------|------------------------------|
| Frameworks | `framework`, `bundle` | #3b82f6 (blue), #8b5cf6 (purple) |
| Executables | `executable` | #ef4444 (red) |
| Resources | `resource`, `config` | #06b6d4 (cyan), #eab308 (yellow) |
| Media Assets | `image`, `video`, `audio`, `font` | #14b8a6 (teal), #f97316 (orange), #a855f7 (purple), #84cc16 (lime) |
| Localizations | `localization` | #6366f1 (indigo) |
| Data Files | `data` | #22c55e (green) |
| Other | `asset`, `other`, `unknown` | #ec4899 (pink), #94a3b8 (gray), #64748b (slate) |

**Android Apps:**
| User Category | ContentTypes Included | Color |
|---------------|----------------------|-------|
| DEX Files | `dex` | #f59e0b (amber) |
| Native Libraries | `native_lib` | #10b981 (green) |
| Resources | `resource`, `config` | #06b6d4 (cyan), #eab308 (yellow) |
| Media Assets | `image`, `video`, `audio`, `font` | (same colors as iOS) |
| Localizations | `localization` | #6366f1 (indigo) |
| Data Files | `data` | #22c55e (green) |
| Other | `asset`, `other`, `unknown` | (same colors as iOS) |

### Implementation
Create a helper function in `utils/calculations.js`:

```javascript
/**
 * Map ContentType to user-friendly display category
 * @param {string} contentType - One of 15 ContentTypes
 * @param {string} platform - 'iOS' or 'Android'
 * @returns {string} Display category name
 */
export function mapToDisplayCategory(contentType, platform) {
  const mapping = {
    framework: 'Frameworks',
    bundle: 'Frameworks',
    executable: 'Executables',
    dex: 'DEX Files',
    native_lib: 'Native Libraries',
    resource: 'Resources',
    config: 'Resources',
    image: 'Media Assets',
    video: 'Media Assets',
    audio: 'Media Assets',
    font: 'Media Assets',
    localization: 'Localizations',
    data: 'Data Files',
    asset: 'Other',
    other: 'Other',
    unknown: 'Other'
  };
  return mapping[contentType] || 'Other';
}
```

### Alternatives Considered

**Display all 15 ContentTypes individually**
- ❌ Too many bars in chart (reduced readability)
- ❌ Many categories would be <1% of total size (not actionable)
- ✓ More granular data

**Use only 3-4 top-level categories**
- ❌ Too coarse (e.g., "Code", "Resources", "Other" loses valuable distinctions)
- ✓ Simpler charts

**Current Decision Validation**: 7-8 categories balances granularity with readability. Users can drill into specific types via Breakdown/X-Ray views if needed.

---

## Research Question 4: Chart Color Consistency Strategy

### Decision
**Reuse existing TYPE_COLORS from color-scheme.js with strategic aggregation rules**

### Rationale
- **Consistency**: Summary charts should use same colors as X-Ray treemap (both show ContentTypes)
- **Visual coherence**: Users can mentally map "blue = frameworks" across all views
- **No new palette needed**: Existing 15 colors are well-differentiated

### Aggregation Rules

When multiple ContentTypes map to one display category, use the **dominant color** (color of most common ContentType in that category):

- **Frameworks** → Use `framework` color (#3b82f6 blue) since frameworks are more common than bundles
- **Resources** → Use `resource` color (#06b6d4 cyan) as primary
- **Media Assets** → Use `image` color (#14b8a6 teal) as primary (images typically largest media type)
- **Other** → Use `other` color (#94a3b8 gray)

### New Colors for Component Distribution

Internal vs. External components need 2 new strategic colors:

- **Internal (First-party code)** → #3b82f6 (blue - conveys "your code")
- **External (Third-party dependencies)** → #10b981 (green - conveys "external libraries")

These colors are already in the TYPE_COLORS palette, just repurposed for this context.

### Implementation
```javascript
// In utils/chart-options.js
export function getDisplayCategoryColor(displayCategory, context = 'fileType') {
  if (context === 'component') {
    return displayCategory === 'Internal' ? '#3b82f6' : '#10b981';
  }

  // For file type context, use dominant ContentType color
  const colorMap = {
    'Frameworks': '#3b82f6',      // framework color
    'Executables': '#ef4444',     // executable color
    'Resources': '#06b6d4',       // resource color
    'Media Assets': '#14b8a6',    // image color
    'Localizations': '#6366f1',   // localization color
    'Data Files': '#22c55e',      // data color
    'DEX Files': '#f59e0b',       // dex color
    'Native Libraries': '#10b981', // native_lib color
    'Other': '#94a3b8'            // other color
  };
  return colorMap[displayCategory] || '#64748b';
}
```

---

## Research Question 5: Platform-Specific Logic Handling

### Decision
**Use platform detection from analysisStore.currentAnalysis.platform to conditionally render charts**

### Rationale
- **Clean separation**: Each chart component checks platform in computed properties
- **Avoids errors**: iOS-specific charts (compression efficiency) don't break on Android data
- **Clear to user**: Charts only appear when relevant data exists

### Implementation Pattern

```javascript
// In SummaryView.vue
<script setup>
import { computed } from 'vue';
import { useAnalysisStore } from '@/stores/analysisStore';

const analysisStore = useAnalysisStore();

const platform = computed(() => analysisStore.currentAnalysis?.platform);
const isIOS = computed(() => platform.value === 'iOS');
const isAndroid = computed(() => platform.value === 'Android');

// Conditional data
const hasCompressionData = computed(() => {
  return isIOS.value && analysisStore.currentAnalysis?.totalDownloadSize > 0;
});

const hasArchitectureData = computed(() => {
  return isAndroid.value && analysisStore.currentAnalysis?.nativeLibraries?.length > 0;
});
</script>

<template>
  <div class="summary-view">
    <!-- Always show -->
    <FileTypeDistributionChart />
    <FileCountDistributionChart />

    <!-- iOS only -->
    <CompressionEfficiencyChart v-if="hasCompressionData" />

    <!-- Android only -->
    <ArchitectureBreakdownChart v-if="hasArchitectureData" />

    <!-- Show if data exists -->
    <LocalizationImpactChart v-if="hasLocalizations" />
    <AssetTypeDistributionChart v-if="hasMediaAssets" />
  </div>
</template>
```

### iOS-Specific Behavior
- **Download Size vs Install Size**: Show dual bars in distribution charts
  - Left bar: Install Size (uncompressed)
  - Right bar: Download Size (compressed)
- **Compression charts**: Only render if `totalDownloadSize` field exists and > 0

### Android-Specific Behavior
- **Single size metric**: Only show Install Size (APKs are already compressed)
- **Architecture breakdown**: Parse `lib/{arch}/` directories for per-architecture sizes

---

## Research Question 6: ECharts Configuration Best Practices

### Decision
**Create reusable option builder functions in utils/chart-options.js**

### Rationale
- **DRY principle**: Common patterns (tooltips, grid, colors) defined once
- **Maintainability**: ECharts options are complex; centralization reduces duplication
- **Testability**: Pure functions that take data → return config object
- **Type safety via JSDoc**: Document expected data structure for each builder

### Option Builder Pattern

```javascript
/**
 * Build ECharts options for horizontal bar chart
 * @param {{name: string, value: number, color?: string}[]} data - Chart data
 * @param {string} title - Chart title
 * @param {Function} valueFormatter - Format function for values (e.g., formatBytes)
 * @returns {Object} ECharts option object
 */
export function buildHorizontalBarChartOptions(data, title, valueFormatter) {
  return {
    title: { text: title, left: 'center' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = params[0];
        return `${item.name}: ${valueFormatter(item.value)}`;
      }
    },
    grid: { left: '20%', right: '10%', top: 60, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: valueFormatter }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      inverse: true  // Largest at top
    },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.value,
        itemStyle: { color: d.color }
      }))
    }]
  };
}
```

### Common Builders Needed
1. `buildVerticalBarChartOptions()` - For file type distribution (size & count)
2. `buildGroupedBarChartOptions()` - For iOS download vs install size comparison
3. `buildHorizontalBarChartOptions()` - For top 10 largest files
4. `buildStackedBarChartOptions()` - For compression efficiency (compressed + uncompressed stacked)

### Alternatives Considered

**Inline options in each component**
- ❌ High duplication (every chart repeats tooltip, grid, color logic)
- ✓ Easier to customize per-chart

**Single monolithic chart component with mode prop**
- ❌ Would create a mega-component with 8+ modes (hard to maintain)
- ✓ Less file count

**Current Decision Validation**: Reusable option builders balance DRY principle with per-chart customization flexibility.

---

## Research Question 7: Handling Edge Cases

### Decision
**Implement defensive checks and graceful fallbacks in aggregation functions**

### Edge Cases Identified

#### 1. Empty Categories (e.g., no videos, no localizations)
**Solution**: Filter out categories with 0 size/count before passing to chart
```javascript
const filteredData = aggregatedData.filter(item => item.size > 0);
```

#### 2. Very Small Categories (<1% of total)
**Solution**: Group into "Other" category as per spec FR-019
```javascript
const threshold = totalSize * 0.01;
const smallItems = data.filter(item => item.size < threshold);
const otherSize = smallItems.reduce((sum, item) => sum + item.size, 0);
```

#### 3. Missing compressedSize field (Android, malformed iOS data)
**Solution**: Check field existence before rendering compression charts
```javascript
const hasCompressionData = currentAnalysis?.totalDownloadSize > 0
  && currentAnalysis?.breakdownRoot?.compressedSize != null;
```

#### 4. Extremely large file counts (10,000+ files)
**Solution**: Use existing formatNumber() utility with K/M suffixes
```javascript
formatNumber(10234) // "10.2K"
```

#### 5. Platform-specific categories appearing on wrong platform
**Solution**: Platform-specific category mapping in aggregation functions
```javascript
if (platform === 'iOS' && contentType === 'dex') {
  // Skip - DEX files should not appear in iOS apps
  return null;
}
```

#### 6. Unknown or uncategorized files
**Solution**: Existing ContentType enum includes 'other' and 'unknown' - aggregate these into "Other" display category

---

## Summary of Technical Decisions

| Question | Decision | Key Benefit |
|----------|----------|-------------|
| Chart library | ECharts 5.5.0 (existing) | No new dependencies, proven performance |
| Aggregation strategy | On-demand computed properties | Simple, reactive, memory-efficient |
| Category mapping | 15 types → 7-8 display categories | Balances granularity with readability |
| Color consistency | Reuse TYPE_COLORS from color-scheme.js | Visual coherence across views |
| Platform handling | Conditional rendering via platform computed prop | Clean separation, no errors |
| Chart configuration | Reusable option builders in chart-options.js | DRY, maintainable, testable |
| Edge cases | Defensive checks + graceful fallbacks | Robust handling of malformed/edge data |

---

## Open Questions (None)

All technical unknowns have been resolved. Ready to proceed to Phase 1 (Design).

---

## References

- **Existing code**: `src/components/xray/Treemap.vue` (ECharts integration pattern)
- **Existing code**: `src/utils/calculations.js` (aggregation function patterns)
- **Existing code**: `src/lib/visualization/color-scheme.js` (color utilities)
- **Existing code**: `src/types/analysis.js` (data structure definitions)
- **ECharts docs**: https://echarts.apache.org/en/option.html (chart configuration reference)
- **Vue 3 docs**: https://vuejs.org/api/composition-api-setup.html (Composition API patterns)
