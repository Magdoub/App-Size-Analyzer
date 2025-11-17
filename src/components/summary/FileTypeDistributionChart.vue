<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <figure v-else-if="hasData" class="chart-container" role="img" aria-label="Bar chart showing file type size distribution across different categories">
    <v-chart
      :option="chartOptions"
      :autoresize="true"
      :style="{ height: chartHeight, width: '100%' }"
      aria-label="File type size distribution chart"
    />
  </figure>
  <div v-else class="no-data" role="status" aria-live="polite">
    <p class="text-gray-500">No file type data available</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useAppStore } from '../../stores/appStore';
import { aggregateFilesByType } from '../../utils/calculations';
import {
  transformCategoriesToBarChart,
  buildVerticalBarChartOptions
} from '../../utils/chart-options';
import { formatBytes } from '../../utils/formatters';
import { useResponsiveChart } from '../../composables/useResponsiveChart';

// Register ECharts components
use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent]);

const analysisStore = useAnalysisStore();
const appStore = useAppStore();

const isLoading = computed(() => appStore.isLoading);

// Responsive chart sizing
const { chartHeight } = useResponsiveChart();

const categoryData = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.breakdownRoot) return [];

  return aggregateFilesByType(
    analysis.breakdownRoot,
    analysis.platform,
    analysis.totalInstallSize
  ).filter(cat => cat.size > 0);
});

const hasData = computed(() => categoryData.value.length > 0);

const chartOptions = computed(() => {
  if (!hasData.value) return {};

  // Always show only install size (single series) for all platforms
  const chartData = transformCategoriesToBarChart(categoryData.value, 'size', false);
  return buildVerticalBarChartOptions(chartData, 'File Type Size Distribution', formatBytes);
});
</script>

<style scoped>
.chart-container {
  margin-bottom: 2rem;
}

.loading-state {
  padding: 2rem;
  text-align: center;
}

.no-data {
  padding: 2rem;
  text-align: center;
}
</style>
