# Quickstart Guide: Xray Chart and Insights Enhancements

**Feature**: 007-xray-insights-enhancements
**Audience**: Developers integrating color modes and enhanced insights
**Date**: 2025-11-10

## Overview

This guide demonstrates how to use the new color visualization modes, chart labels, and enhanced insights in the app size analyzer. Follow these scenarios to integrate the features into your workflow.

---

## Scenario 1: Adding Color Mode Toggle to UI

**Goal**: Add a toggle button to switch between "Color by Size" and "Color by Type" modes.

**Files Modified**:
- `src/components/xray/XRayView.vue`

**Implementation**:

```vue
<!-- src/components/xray/XRayView.vue -->
<template>
  <div class="xray-container">
    <!-- Color Mode Toggle (NEW) -->
    <div class="color-mode-selector mb-4">
      <label class="font-semibold mr-2">Color By:</label>
      <div class="btn-group">
        <button
          @click="setColorMode('type')"
          :class="['btn', { 'btn-active': colorMode === 'type' }]"
        >
          Type
        </button>
        <button
          @click="setColorMode('size')"
          :class="['btn', { 'btn-active': colorMode === 'size' }]"
        >
          Size
        </button>
      </div>
    </div>

    <!-- Existing Treemap -->
    <Treemap
      :data="treemapData"
      :colorMode="colorMode"
      :sizePercentiles="sizePercentiles"
      :totalSize="totalSize"
      :searchMatches="searchMatches"
    />
  </div>
</template>

<script>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../stores/uiStore';
import { useAnalysisStore } from '../../stores/analysisStore';
import { calculateSizePercentiles } from '../../lib/visualization/color-scheme';
import Treemap from './Treemap.vue';

export default {
  components: { Treemap },
  setup() {
    const uiStore = useUiStore();
    const analysisStore = useAnalysisStore();

    const { xray } = storeToRefs(uiStore);
    const { currentAnalysis } = storeToRefs(analysisStore);

    // Computed properties
    const colorMode = computed(() => xray.value.colorMode);
    const sizePercentiles = computed(() => xray.value.sizePercentiles);

    // Actions
    const setColorMode = (mode) => {
      uiStore.setXRayColorMode(mode);
    };

    // Initialize percentiles on analysis load
    const initializePercentiles = () => {
      if (currentAnalysis.value?.breakdownRoot) {
        const percentiles = calculateSizePercentiles(currentAnalysis.value.breakdownRoot);
        uiStore.updateSizePercentiles(percentiles);
      }
    };

    // Call on mount and when analysis changes
    initializePercentiles();

    return {
      colorMode,
      sizePercentiles,
      setColorMode,
      // ... other properties
    };
  }
};
</script>

<style scoped>
.btn-group {
  display: inline-flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #f3f4f6;
}

.btn-active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
</style>
```

**Testing**:
1. Load an app file
2. Click "Color by Size" button
3. Verify treemap nodes change from type-based colors to blue gradient
4. Click "Color by Type" button
5. Verify treemap returns to categorical colors
6. Refresh page - mode should persist within session

---

## Scenario 2: Implementing Size Gradient Color Function

**Goal**: Add `getColorBySizeGradient()` function to color-scheme.js.

**Files Modified**:
- `src/lib/visualization/color-scheme.js`

**Implementation**:

```javascript
// src/lib/visualization/color-scheme.js

/**
 * Calculate size-based gradient color (blue scale)
 * @param {number} size - File size in bytes
 * @param {number} totalSize - Total app size in bytes
 * @param {number[]} percentiles - [p10, p25, p50, p75, p90]
 * @param {Object} config - Optional gradient configuration
 * @returns {string} HSL color string
 */
export function getColorBySizeGradient(size, totalSize, percentiles, config = {}) {
  const {
    hue = 210,              // Blue
    minSaturation = 70,
    maxSaturation = 90,
    minLightness = 20,      // Darkest (large files)
    maxLightness = 90       // Lightest (small files)
  } = config;

  // Edge case: no percentiles or empty
  if (!percentiles || percentiles.length === 0) {
    return `hsl(${hue}, 80%, 55%)`; // Mid-tone blue
  }

  // Calculate percentage of total
  const percentage = (size / totalSize) * 100;

  // Map to percentile bucket and assign lightness
  let lightness;
  if (percentage < percentiles[0]) {
    lightness = maxLightness; // < p10: lightest (90%)
  } else if (percentage < percentiles[1]) {
    lightness = 75; // p10-p25
  } else if (percentage < percentiles[2]) {
    lightness = 60; // p25-p50
  } else if (percentage < percentiles[3]) {
    lightness = 45; // p50-p75
  } else if (percentage < percentiles[4]) {
    lightness = 30; // p75-p90
  } else {
    lightness = minLightness; // > p90: darkest (20%)
  }

  // Calculate saturation (more vibrant for larger files)
  const saturationRange = maxSaturation - minSaturation;
  const lightnessNormalized = (maxLightness - lightness) / (maxLightness - minLightness);
  const saturation = minSaturation + (saturationRange * lightnessNormalized);

  return `hsl(${hue}, ${Math.round(saturation)}%, ${lightness}%)`;
}

/**
 * Calculate size percentiles from breakdown tree
 * @param {BreakdownNode} root - Tree root
 * @returns {number[]} [p10, p25, p50, p75, p90]
 */
export function calculateSizePercentiles(root) {
  // Flatten tree to leaf nodes
  const flattenToLeaves = (node) => {
    if (!node.children || node.children.length === 0) {
      return [node];
    }
    return node.children.flatMap(flattenToLeaves);
  };

  const leaves = flattenToLeaves(root);
  const sizes = leaves.map(n => n.size).sort((a, b) => a - b);

  if (sizes.length === 0) {
    return [0, 0, 0, 0, 0];
  }

  return [
    sizes[Math.floor(sizes.length * 0.10)] || 0,
    sizes[Math.floor(sizes.length * 0.25)] || 0,
    sizes[Math.floor(sizes.length * 0.50)] || 0,
    sizes[Math.floor(sizes.length * 0.75)] || 0,
    sizes[Math.floor(sizes.length * 0.90)] || 0
  ];
}

/**
 * Updated getNodeColor() to support mode switching
 * @param {number} size - Node size
 * @param {ContentType} type - Content type
 * @param {number} totalSize - Total app size
 * @param {number} compressedSize - Compressed size (optional)
 * @param {ColorMode} colorMode - 'size' | 'type' | 'compression'
 * @param {number[]} percentiles - Size percentiles for gradient mode
 * @returns {string} CSS color
 */
export function getNodeColor(size, type, totalSize, compressedSize, colorMode = 'type', percentiles = []) {
  if (colorMode === 'size') {
    return getColorBySizeGradient(size, totalSize, percentiles);
  } else if (colorMode === 'compression' && compressedSize) {
    return getColorByCompression(size, compressedSize);
  } else {
    return getColorByType(type);
  }
}
```

**Testing**:
```javascript
// color-scheme.test.js
import { getColorBySizeGradient, calculateSizePercentiles } from './color-scheme.js';

describe('getColorBySizeGradient', () => {
  const percentiles = [100000, 500000, 1000000, 2000000, 5000000];
  const totalSize = 10000000; // 10MB

  test('small file (< p10) returns lightest blue', () => {
    const color = getColorBySizeGradient(50000, totalSize, percentiles);
    expect(color).toContain('90%'); // Lightness 90%
  });

  test('large file (> p90) returns darkest blue', () => {
    const color = getColorBySizeGradient(6000000, totalSize, percentiles);
    expect(color).toContain('20%'); // Lightness 20%
  });

  test('empty percentiles returns mid-tone', () => {
    const color = getColorBySizeGradient(1000000, totalSize, []);
    expect(color).toBe('hsl(210, 80%, 55%)');
  });
});
```

---

## Scenario 3: Enabling Chart Labels in Treemap

**Goal**: Ensure labels are visible on treemap nodes where space permits.

**Files Modified**:
- `src/components/xray/Treemap.vue` (verify existing logic)

**Verification** (no code changes needed if label logic already exists):

```vue
<!-- src/components/xray/Treemap.vue -->
<script>
const chartOption = computed(() => ({
  series: [{
    type: 'treemap',
    data: [props.data],
    label: {
      show: true,  // Ensure labels are enabled
      formatter: getNodeLabel,
      color: getLabelTextColor,
      fontSize: 12,
      overflow: 'truncate'  // Truncate long labels
    },
    itemStyle: {
      color: getNodeColorForChart
    }
  }]
}));

const getNodeLabel = (params) => {
  // Existing logic from node-label-calculator.js
  const width = params.rect?.width || 0;
  const height = params.rect?.height || 0;

  // Minimum dimensions for label display
  if (width < 50 || height < 20) {
    return '';  // Hide label if too small
  }

  // Return node name (ECharts handles truncation via overflow: 'truncate')
  return params.data.name;
};

const getLabelTextColor = (params) => {
  const bgColor = getNodeColorForChart(params);
  return getLabelColor(bgColor);  // From color-scheme.js
};
</script>
```

**Testing**:
1. Load app with various file sizes
2. Zoom into large directories
3. Verify labels appear on boxes ≥ 50x20 pixels
4. Verify labels are hidden on small boxes
5. Check text contrast (should be black on light blue, white on dark blue)

---

## Scenario 4: Registering Enhanced Insight Rules

**Goal**: Add new insight rules for large files, compression, duplicates, and framework analysis.

**Files Modified**:
- `src/lib/analysis/insight-engine.js` (add rule implementations)
- `src/components/insights/InsightsView.vue` (register rules)

**Implementation**:

```javascript
// src/lib/analysis/insight-engine.js (add at end of file)

/**
 * Rule: Identify top 10 largest files
 */
async function ruleLargeFilesTop10(analysis) {
  // Flatten tree to leaves
  const flattenToLeaves = (node) => {
    if (!node.children || node.children.length === 0) {
      return [node];
    }
    return node.children.flatMap(flattenToLeaves);
  };

  const leaves = flattenToLeaves(analysis.breakdownRoot);
  const sorted = leaves.sort((a, b) => b.size - a.size).slice(0, 10);

  const totalAffectedSize = sorted.reduce((sum, f) => sum + f.size, 0);
  const percentageOfApp = (totalAffectedSize / analysis.summary.totalSize) * 100;

  return {
    ruleId: 'large-files-top-10',
    severity: 'medium',
    category: 'size-optimization',
    title: 'Top 10 Largest Files',
    description: `These ${sorted.length} files account for ${percentageOfApp.toFixed(1)}% of your app size.`,
    affectedFiles: sorted.map((file, index) => ({
      path: file.path,
      size: file.size,
      type: file.type,
      context: `#${index + 1} - ${((file.size / analysis.summary.totalSize) * 100).toFixed(1)}% of app`
    })),
    recommendation: 'Consider lazy loading, code splitting, or asset optimization for these files.',
    potentialSavings: Math.round(totalAffectedSize * 0.30), // Assume 30% reduction possible
    metadata: {
      totalAffectedSize,
      percentageOfApp
    }
  };
}

/**
 * Register enhanced rules (call from InsightsView.vue)
 */
export function registerEnhancedInsightRules(engine) {
  engine.registerRule({
    id: 'large-files-top-10',
    execute: ruleLargeFilesTop10
  });

  // TODO: Add other rules (uncompressed-images, duplicate-file-names, framework-size-analysis)
}
```

```vue
<!-- src/components/insights/InsightsView.vue -->
<script>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore } from '../../stores/analysisStore';
import { getDefaultInsightEngine, registerEnhancedInsightRules } from '../../lib/analysis/insight-engine';

export default {
  setup() {
    const analysisStore = useAnalysisStore();
    const { currentAnalysis } = storeToRefs(analysisStore);
    const insights = ref([]);

    onMounted(async () => {
      const engine = getDefaultInsightEngine();
      registerEnhancedInsightRules(engine);  // NEW: Register enhanced rules

      insights.value = await engine.executeAll(currentAnalysis.value);
    });

    return { insights };
  }
};
</script>
```

**Testing**:
1. Load app file
2. Navigate to Insights tab
3. Verify "Top 10 Largest Files" insight appears
4. Check that file paths, sizes, and percentages are displayed
5. Verify potential savings estimate is shown

---

## Scenario 5: Displaying File Details in Insight Cards

**Goal**: Update InsightCard to show file-level details from `AffectedFile[]`.

**Files Modified**:
- `src/components/insights/InsightCard.vue`

**Implementation**:

```vue
<!-- src/components/insights/InsightCard.vue -->
<template>
  <div class="insight-card">
    <div class="insight-header">
      <h3>{{ insight.title }}</h3>
      <span :class="['severity-badge', insight.severity]">
        {{ insight.severity }}
      </span>
    </div>

    <p class="description">{{ insight.description }}</p>

    <!-- NEW: File Details Table -->
    <div v-if="insight.affectedFiles.length > 0" class="affected-files">
      <h4>Affected Files:</h4>
      <table>
        <thead>
          <tr>
            <th>File Path</th>
            <th>Size</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in insight.affectedFiles" :key="file.path">
            <td class="path">{{ file.path }}</td>
            <td class="size">{{ formatBytes(file.size) }}</td>
            <td class="context">{{ file.context || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Existing recommendation and savings -->
    <div class="recommendation">
      <strong>Recommendation:</strong> {{ insight.recommendation }}
    </div>

    <div v-if="insight.potentialSavings > 0" class="savings">
      <strong>Potential Savings:</strong> {{ formatBytes(insight.potentialSavings) }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    insight: {
      type: Object,
      required: true
    }
  },
  setup() {
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return { formatBytes };
  }
};
</script>

<style scoped>
.affected-files table {
  width: 100%;
  margin-top: 1rem;
  border-collapse: collapse;
}

.affected-files th,
.affected-files td {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.affected-files th {
  background: #f9fafb;
  font-weight: 600;
}

.path {
  font-family: monospace;
  font-size: 0.9em;
  color: #4b5563;
}

.size {
  white-space: nowrap;
}

.context {
  font-style: italic;
  color: #6b7280;
}
</style>
```

**Testing**:
1. View insight with affected files
2. Verify table displays file paths, sizes, context
3. Check file path formatting (monospace font)
4. Verify size formatting (KB, MB units)
5. Test with insights that have >10 files (scrolling)

---

## Scenario 6: State Persistence in UIStore

**Goal**: Ensure color mode persists across page navigations within session.

**Files Modified**:
- `src/stores/uiStore.js`

**Implementation**:

```javascript
// src/stores/uiStore.js
import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    xray: {
      zoomPath: null,
      categories: new Set(),
      searchQuery: '',
      hoveredNodePath: null,
      detailsPanelNodePath: null,
      searchMatches: [],
      currentSearchMatchIndex: 0,
      navigationHistory: [],
      // NEW: Color mode and percentiles
      colorMode: 'type',
      sizePercentiles: []
    }
  }),

  actions: {
    /**
     * Set treemap color mode
     * @param {ColorMode} mode - 'size' | 'type' | 'compression'
     */
    setXRayColorMode(mode) {
      const validModes = ['size', 'type', 'compression'];
      if (!validModes.includes(mode)) {
        console.warn(`Invalid color mode: ${mode}, defaulting to 'type'`);
        mode = 'type';
      }
      this.xray.colorMode = mode;
      sessionStorage.setItem('xray-color-mode', mode);
    },

    /**
     * Update size percentiles (called when analysis changes)
     * @param {number[]} percentiles - [p10, p25, p50, p75, p90]
     */
    updateSizePercentiles(percentiles) {
      this.xray.sizePercentiles = percentiles;
    },

    /**
     * Initialize color mode from session storage (call on app mount)
     */
    initializeColorMode() {
      const saved = sessionStorage.getItem('xray-color-mode');
      if (saved && ['size', 'type', 'compression'].includes(saved)) {
        this.xray.colorMode = saved;
      }
    }
  }
});
```

**Usage in App.vue**:

```vue
<!-- src/App.vue -->
<script>
import { onMounted } from 'vue';
import { useUiStore } from './stores/uiStore';

export default {
  setup() {
    const uiStore = useUiStore();

    onMounted(() => {
      uiStore.initializeColorMode();  // Restore saved mode
    });
  }
};
</script>
```

**Testing**:
1. Set color mode to "Size"
2. Navigate to different tabs (Breakdown, Insights)
3. Return to Xray tab
4. Verify mode is still "Size" (not reset to "Type")
5. Refresh page
6. Verify mode is still "Size" within same browser session

---

## Common Pitfalls & Troubleshooting

### Issue 1: Color mode doesn't update when toggled

**Symptom**: Clicking color mode button doesn't change treemap colors.

**Cause**: `chartOption` computed property not reactive to `colorMode` changes.

**Solution**: Ensure `colorMode` is from `storeToRefs()`:

```javascript
const { xray } = storeToRefs(uiStore);
const colorMode = computed(() => xray.value.colorMode); // ✅ Reactive

// NOT:
const colorMode = uiStore.xray.colorMode; // ❌ Not reactive
```

---

### Issue 2: Labels not appearing on treemap

**Symptom**: Treemap renders but no text labels visible.

**Cause**: ECharts label.show = false or formatter returns empty string.

**Solution**: Verify label configuration:

```javascript
label: {
  show: true,  // Must be true
  formatter: (params) => {
    // Must return non-empty string for visible boxes
    if (params.rect.width < 50) return '';
    return params.data.name;
  }
}
```

---

### Issue 3: Size gradient all same color

**Symptom**: All nodes appear same shade of blue in "Size" mode.

**Cause**: Percentiles not calculated or all zero.

**Solution**: Ensure percentiles are calculated on analysis load:

```javascript
onMounted(() => {
  if (currentAnalysis.value) {
    const percentiles = calculateSizePercentiles(currentAnalysis.value.breakdownRoot);
    uiStore.updateSizePercentiles(percentiles);
    console.log('Percentiles:', percentiles); // Debug output
  }
});
```

---

### Issue 4: Insights not showing file details

**Symptom**: Insight card displays but "Affected Files" table is empty.

**Cause**: Rule returning legacy `string[]` instead of `AffectedFile[]`.

**Solution**: Ensure rule returns correct structure:

```javascript
// ❌ Wrong
affectedFiles: ['file1.png', 'file2.png']

// ✅ Correct
affectedFiles: [
  { path: 'file1.png', size: 1024, type: 'image', context: '#1' },
  { path: 'file2.png', size: 2048, type: 'image', context: '#2' }
]
```

---

## Next Steps

After completing these scenarios, you should have:

1. ✅ Working color mode toggle (Size/Type)
2. ✅ Blue gradient rendering for size mode
3. ✅ Labels displaying on treemap nodes
4. ✅ Enhanced insights with file-level details
5. ✅ State persistence across navigation

Proceed to **Task Breakdown** (`/speckit.tasks`) to generate the full implementation task list.

