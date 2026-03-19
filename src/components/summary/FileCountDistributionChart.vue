<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <figure v-else-if="hasData" class="chart-container" role="img" aria-label="Bar chart showing file count distribution by type">
    <v-chart
      :option="chartOptions"
      :autoresize="true"
      :style="{ height: chartHeight, width: '100%' }"
      aria-label="File count distribution chart"
    />
  </figure>
</template>

<script setup>
import { BarChart } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { useResponsiveChart } from '../../composables/useResponsiveChart';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useAppStore } from '../../stores/appStore';
import { aggregateFilesByType } from '../../utils/calculations';
import { buildVerticalBarChartOptions, transformCategoriesToBarChart } from '../../utils/chart-options';
import { formatNumber } from '../../utils/formatters';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

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
  ).filter(cat => cat.count > 0);
});

const hasData = computed(() => categoryData.value.length > 0);

const chartOptions = computed(() => {
  if (!hasData.value) return {};

  const chartData = transformCategoriesToBarChart(categoryData.value, 'count', false);
  return buildVerticalBarChartOptions(chartData, 'File Type Count Distribution', formatNumber);
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
</style>
