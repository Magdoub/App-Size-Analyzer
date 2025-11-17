# Quickstart Guide: Summary Page with Size Distribution Graphs

**Feature**: 010-summary-page-graphs | **Date**: 2025-11-12

## Overview

This guide provides integration scenarios and usage examples for the Summary page feature. It demonstrates how developers can extend, customize, or integrate with the Summary page components.

---

## Integration Scenario 1: Adding a New Chart

**Goal**: Add a custom chart to the Summary page (e.g., "Duplicate Files Chart")

### Step 1: Create Aggregation Function

Add a new aggregation function to `src/utils/calculations.js`:

```javascript
/**
 * Analyze duplicate files across the app
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {number} totalInstallSize - Total app size
 * @returns {DuplicateAnalysis[]} Duplicate file groups
 */
export function analyzeDuplicateFiles(breakdownRoot, totalInstallSize) {
  const duplicateGroups = [];
  const seenHashes = new Map();

  // Traverse tree and find files with matching content (via metadata.duplicates)
  function traverse(node) {
    if (node.children.length === 0 && node.metadata?.duplicates) {
      // File with known duplicates
      const hash = node.id; // Simplified - use content hash in real implementation
      if (!seenHashes.has(hash)) {
        const duplicates = node.metadata.duplicates.map(id => {
          // Find duplicate nodes
          // ... logic to collect duplicate paths
        });

        duplicateGroups.push({
          name: node.name,
          size: node.size,
          count: duplicates.length + 1,
          paths: [node.path, ...duplicates],
          wastedSpace: node.size * duplicates.length,
          percentage: ((node.size * duplicates.length) / totalInstallSize) * 100
        });

        seenHashes.set(hash, true);
      }
    }

    node.children.forEach(traverse);
  }

  traverse(breakdownRoot);

  // Sort by wasted space descending
  return duplicateGroups
    .sort((a, b) => b.wastedSpace - a.wastedSpace)
    .slice(0, 10);  // Top 10 duplicate groups
}
```

### Step 2: Create Chart Component

Create `src/components/summary/DuplicateFilesChart.vue`:

```vue
<script setup>
import { computed } from 'vue';
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { useAnalysisStore } from '@/stores/analysisStore';
import { analyzeDuplicateFiles } from '@/utils/calculations';
import { buildHorizontalBarChartOptions } from '@/utils/chart-options';
import { formatBytes } from '@/utils/formatters';

use([BarChart, CanvasRenderer, TooltipComponent, GridComponent]);

const analysisStore = useAnalysisStore();

const duplicateData = computed(() => {
  if (!analysisStore.currentAnalysis) return [];

  return analyzeDuplicateFiles(
    analysisStore.currentAnalysis.breakdownRoot,
    analysisStore.currentAnalysis.totalInstallSize
  );
});

const chartOptions = computed(() => {
  if (duplicateData.value.length === 0) return null;

  const chartData = {
    items: duplicateData.value.map(item => ({
      name: `${item.name} (${item.count}x)`,
      value: item.wastedSpace,
      color: '#ef4444',  // Red for wasted space
      tooltip: `${item.name}\nDuplicates: ${item.count}\nWasted: ${formatBytes(item.wastedSpace)}`
    }))
  };

  return buildHorizontalBarChartOptions(
    chartData,
    'Top 10 Duplicate File Groups (Wasted Space)',
    formatBytes
  );
});
</script>

<template>
  <div v-if="chartOptions" class="duplicate-files-chart">
    <v-chart :option="chartOptions" class="chart" autoresize />
  </div>
  <div v-else class="no-data">
    No duplicate files detected
  </div>
</template>

<style scoped>
.duplicate-files-chart {
  width: 100%;
  height: 400px;
  margin: 20px 0;
}

.chart {
  width: 100%;
  height: 100%;
}

.no-data {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}
</style>
```

### Step 3: Add to SummaryView

Edit `src/components/summary/SummaryView.vue`:

```vue
<script setup>
// ... existing imports
import DuplicateFilesChart from './DuplicateFilesChart.vue';
</script>

<template>
  <div class="summary-view">
    <!-- Existing charts -->
    <FileTypeDistributionChart />
    <FileCountDistributionChart />

    <!-- New custom chart -->
    <DuplicateFilesChart />

    <!-- Other charts -->
    <TopFilesChart />
  </div>
</template>
```

**Result**: New "Duplicate Files" chart appears in Summary page between existing charts.

---

## Integration Scenario 2: Filtering Charts by Category

**Goal**: Add a filter dropdown to show only specific chart categories (P1 charts, P2 charts, All)

### Step 1: Extend UI Store

Edit `src/stores/uiStore.js`:

```javascript
export const useUiStore = defineStore('ui', {
  state: () => ({
    activeView: 'upload',
    // ... existing state

    // New summary state
    summary: {
      visibleChartGroups: ['p1', 'p2', 'p3']  // All visible by default
    }
  }),

  actions: {
    // ... existing actions

    setSummaryChartGroups(groups) {
      this.summary.visibleChartGroups = groups;
    }
  }
});
```

### Step 2: Add Filter UI to SummaryView

```vue
<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/uiStore';

const uiStore = useUiStore();

const chartGroups = computed(() => uiStore.summary.visibleChartGroups);

const showP1Charts = computed(() => chartGroups.value.includes('p1'));
const showP2Charts = computed(() => chartGroups.value.includes('p2'));
const showP3Charts = computed(() => chartGroups.value.includes('p3'));

function toggleChartGroup(group) {
  const current = chartGroups.value;
  if (current.includes(group)) {
    uiStore.setSummaryChartGroups(current.filter(g => g !== group));
  } else {
    uiStore.setSummaryChartGroups([...current, group]);
  }
}
</script>

<template>
  <div class="summary-view">
    <!-- Filter Controls -->
    <div class="chart-filters">
      <label>
        <input type="checkbox" :checked="showP1Charts" @change="toggleChartGroup('p1')" />
        Core Distribution (P1)
      </label>
      <label>
        <input type="checkbox" :checked="showP2Charts" @change="toggleChartGroup('p2')" />
        Component Analysis (P2)
      </label>
      <label>
        <input type="checkbox" :checked="showP3Charts" @change="toggleChartGroup('p3')" />
        Advanced Analytics (P3)
      </label>
    </div>

    <!-- P1 Charts -->
    <template v-if="showP1Charts">
      <FileTypeDistributionChart />
      <FileCountDistributionChart />
    </template>

    <!-- P2 Charts -->
    <template v-if="showP2Charts">
      <ComponentDistributionChart />
    </template>

    <!-- P3 Charts -->
    <template v-if="showP3Charts">
      <CompressionEfficiencyChart />
      <TopFilesChart />
      <LocalizationImpactChart />
      <ArchitectureBreakdownChart />
      <AssetTypeDistributionChart />
    </template>
  </div>
</template>

<style scoped>
.chart-filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.chart-filters label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>
```

**Result**: Users can toggle chart visibility by priority group.

---

## Integration Scenario 3: Exporting Summary Data as JSON

**Goal**: Add "Export Summary as JSON" button that downloads aggregated data

### Step 1: Create Export Function

Add to `src/utils/calculations.js`:

```javascript
/**
 * Generate complete summary export object
 * @param {AnalysisContext} analysisContext - Current analysis
 * @returns {Object} Exportable summary data
 */
export function generateSummaryExport(analysisContext) {
  const { breakdownRoot, platform, totalInstallSize } = analysisContext;

  return {
    metadata: {
      appName: analysisContext.appName,
      bundleId: analysisContext.bundleId,
      version: analysisContext.version,
      platform: platform,
      totalInstallSize: totalInstallSize,
      totalDownloadSize: analysisContext.totalDownloadSize,
      analyzedAt: analysisContext.timestamp
    },

    fileTypes: aggregateFilesByType(breakdownRoot, platform, totalInstallSize),
    components: aggregateByComponent(breakdownRoot, platform, totalInstallSize),
    topFiles: getTopFiles(breakdownRoot, 10, totalInstallSize),

    // Optional sections
    ...(platform === 'iOS' && {
      compression: analyzeCompressionByType(breakdownRoot, platform)
    }),

    ...(analysisContext.localizations.length > 0 && {
      localizations: analyzeLocalizations(breakdownRoot, platform, totalInstallSize)
    }),

    ...(platform === 'Android' && analysisContext.nativeLibraries.length > 0 && {
      architectures: analyzeArchitectures(breakdownRoot, totalInstallSize)
    }),

    assetTypes: categorizeAssetTypes(breakdownRoot, totalInstallSize)
  };
}
```

### Step 2: Add Export Button to SummaryView

```vue
<script setup>
import { useAnalysisStore } from '@/stores/analysisStore';
import { generateSummaryExport } from '@/utils/calculations';

const analysisStore = useAnalysisStore();

function exportSummary() {
  if (!analysisStore.currentAnalysis) return;

  const summaryData = generateSummaryExport(analysisStore.currentAnalysis);

  // Create blob and download
  const blob = new Blob(
    [JSON.stringify(summaryData, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${analysisStore.currentAnalysis.appName}-summary-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="summary-view">
    <div class="summary-header">
      <h1>Summary</h1>
      <button @click="exportSummary" class="export-button">
        Export Summary as JSON
      </button>
    </div>

    <!-- Charts -->
    <FileTypeDistributionChart />
    <!-- ... other charts -->
  </div>
</template>

<style scoped>
.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.export-button {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.export-button:hover {
  background: #2563eb;
}
</style>
```

**Result**: Clicking "Export Summary as JSON" downloads a file like `MyApp-summary-1699876543210.json` with all aggregated data.

---

## Integration Scenario 4: Adding Custom Formatters for Chart Tooltips

**Goal**: Display custom tooltip format (e.g., show both size and percentage in tooltips)

### Step 1: Create Custom Formatter

Add to `src/utils/formatters.js`:

```javascript
/**
 * Format size with percentage for tooltips
 * @param {number} size - Size in bytes
 * @param {number} totalSize - Total app size
 * @returns {string} Formatted string (e.g., "12.5 MB (42.3%)")
 */
export function formatSizeWithPercentage(size, totalSize) {
  const formatted = formatBytes(size);
  const percentage = ((size / totalSize) * 100).toFixed(1);
  return `${formatted} (${percentage}%)`;
}

/**
 * Format file count with emphasis
 * @param {number} count - File count
 * @returns {string} Formatted string (e.g., "1,234 files")
 */
export function formatFileCount(count) {
  const formatted = formatNumber(count);
  return `${formatted} ${count === 1 ? 'file' : 'files'}`;
}
```

### Step 2: Use in Chart Option Builder

Edit `src/utils/chart-options.js`:

```javascript
export function buildVerticalBarChartOptions(data, title, valueFormatter, options = {}) {
  const { showPercentage = false, totalSize = null } = options;

  return {
    // ... existing config

    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = params[0];
        const value = item.value;

        if (showPercentage && totalSize) {
          return `${item.name}: ${formatSizeWithPercentage(value, totalSize)}`;
        }

        return `${item.name}: ${valueFormatter(value)}`;
      }
    },

    // ... rest of config
  };
}
```

### Step 3: Use in Component

```vue
<script setup>
const chartOptions = computed(() => {
  // ... existing code to get data

  return buildVerticalBarChartOptions(
    chartData.value,
    'File Type Distribution (Size)',
    formatBytes,
    {
      showPercentage: true,
      totalSize: analysisStore.currentAnalysis.totalInstallSize
    }
  );
});
</script>
```

**Result**: Chart tooltips now display "45 MB (42.3%)" instead of just "45 MB".

---

## Integration Scenario 5: Conditionally Showing Charts Based on Data Availability

**Goal**: Only render charts when relevant data exists (e.g., hide Localization chart if no localizations)

### Pattern

```vue
<script setup>
import { computed } from 'vue';
import { useAnalysisStore } from '@/stores/analysisStore';
import { analyzeLocalizations } from '@/utils/calculations';

const analysisStore = useAnalysisStore();

const localizationData = computed(() => {
  if (!analysisStore.currentAnalysis) return [];

  return analyzeLocalizations(
    analysisStore.currentAnalysis.breakdownRoot,
    analysisStore.currentAnalysis.platform,
    analysisStore.currentAnalysis.totalInstallSize
  );
});

const hasLocalizations = computed(() => {
  // Show chart only if at least 2 localizations exist (excluding Base.lproj)
  return localizationData.value.length >= 2;
});

const localizationPercentageThreshold = computed(() => {
  // Show chart only if localizations represent >2% of total app size
  const totalLocalizationSize = localizationData.value.reduce(
    (sum, item) => sum + item.size,
    0
  );
  const percentage = (totalLocalizationSize / analysisStore.currentAnalysis.totalInstallSize) * 100;
  return percentage > 2;
});

const shouldShowChart = computed(() => {
  return hasLocalizations.value && localizationPercentageThreshold.value;
});
</script>

<template>
  <LocalizationImpactChart v-if="shouldShowChart" />

  <div v-else class="chart-placeholder">
    <p>Localizations represent less than 2% of app size or only one locale detected.</p>
  </div>
</template>
```

**Result**: Localization chart only appears when meaningful data exists.

---

## Testing Integration

### Unit Test: Aggregation Function

Create `src/utils/calculations.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { aggregateFilesByType } from './calculations';

describe('aggregateFilesByType', () => {
  it('should aggregate files by type with correct totals', () => {
    const mockBreakdownRoot = {
      id: 'root',
      name: 'root',
      path: '',
      size: 100000000,
      compressedSize: 50000000,
      type: 'other',
      children: [
        {
          id: '1',
          name: 'Framework.framework',
          path: 'Frameworks/Framework.framework',
          size: 45000000,
          compressedSize: 12000000,
          type: 'framework',
          children: []
        },
        {
          id: '2',
          name: 'image.png',
          path: 'Assets.car/image.png',
          size: 15000000,
          compressedSize: 12000000,
          type: 'image',
          children: []
        }
      ]
    };

    const result = aggregateFilesByType(mockBreakdownRoot, 'iOS', 100000000);

    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('Frameworks');
    expect(result[0].size).toBe(45000000);
    expect(result[0].count).toBe(1);
    expect(result[0].percentage).toBe(45.0);
  });
});
```

### Component Test: Chart Rendering

Create `src/components/summary/FileTypeDistributionChart.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FileTypeDistributionChart from './FileTypeDistributionChart.vue';

describe('FileTypeDistributionChart', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render chart when data is available', async () => {
    const wrapper = mount(FileTypeDistributionChart);

    // Mock analysis store with data
    const analysisStore = useAnalysisStore();
    analysisStore.currentAnalysis = {
      platform: 'iOS',
      totalInstallSize: 100000000,
      breakdownRoot: { /* mock tree */ }
    };

    await wrapper.vm.$nextTick();

    expect(wrapper.find('.chart').exists()).toBe(true);
  });

  it('should show no-data message when no analysis', () => {
    const wrapper = mount(FileTypeDistributionChart);

    expect(wrapper.find('.no-data').exists()).toBe(true);
  });
});
```

---

## Performance Optimization Tips

### Tip 1: Memoize Expensive Computations

If aggregation functions become slow with very large trees (20,000+ nodes), memoize results:

```javascript
import { computed, ref } from 'vue';

const memoizedCategories = ref(null);
const lastAnalysisId = ref(null);

const categoryData = computed(() => {
  if (!analysisStore.currentAnalysis) return [];

  // Check if we can reuse memoized result
  if (
    memoizedCategories.value &&
    lastAnalysisId.value === analysisStore.currentAnalysis.fileId
  ) {
    return memoizedCategories.value;
  }

  // Compute fresh
  const result = aggregateFilesByType(
    analysisStore.currentAnalysis.breakdownRoot,
    analysisStore.currentAnalysis.platform,
    analysisStore.currentAnalysis.totalInstallSize
  );

  // Memoize
  memoizedCategories.value = result;
  lastAnalysisId.value = analysisStore.currentAnalysis.fileId;

  return result;
});
```

### Tip 2: Lazy Load Charts

Use Vue's `defineAsyncComponent` to lazy load chart components:

```javascript
import { defineAsyncComponent } from 'vue';

const TopFilesChart = defineAsyncComponent(() =>
  import('./TopFilesChart.vue')
);
```

**Result**: Chart components only load when Summary view is active.

---

## Summary

This quickstart guide demonstrates:
1. **Adding custom charts** by creating aggregation functions and chart components
2. **Filtering charts** by extending UI store state
3. **Exporting data** by serializing aggregated data to JSON
4. **Custom tooltips** via formatter functions
5. **Conditional rendering** based on data availability thresholds
6. **Testing patterns** for aggregation functions and chart components
7. **Performance optimization** via memoization and lazy loading

All patterns follow the library-first design principle: pure functions for data transformation, thin Vue components for presentation.
