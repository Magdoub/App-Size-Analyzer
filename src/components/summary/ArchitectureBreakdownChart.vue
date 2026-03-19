<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <figure v-else-if="hasArchitectureData" class="chart-container" role="img" aria-label="Bar chart showing architecture breakdown for Android apps by CPU type">
    <v-chart :option="chartOptions" :autoresize="true" :style="{ height: chartHeight, width: '100%' }" aria-label="Architecture breakdown chart" />
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
import { analyzeArchitectures } from '../../utils/calculations';
import { buildVerticalBarChartOptions, transformArchitecturesToBarChart } from '../../utils/chart-options';
import { formatBytes } from '../../utils/formatters';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

const analysisStore = useAnalysisStore();
const appStore = useAppStore();

const isLoading = computed(() => appStore.isLoading);

// Responsive chart sizing
const { chartHeight } = useResponsiveChart();

const platform = computed(() => analysisStore.currentAnalysis?.platform);
const isAndroid = computed(() => platform.value === 'Android');

const architectureData = computed(() => {
  if (!isAndroid.value) return [];

  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.breakdownRoot) return [];

  return analyzeArchitectures(analysis.breakdownRoot, analysis.totalInstallSize);
});

const hasArchitectureData = computed(() => {
  return isAndroid.value && architectureData.value.length > 0;
});

const chartOptions = computed(() => {
  if (!hasArchitectureData.value) return {};

  const chartData = transformArchitecturesToBarChart(architectureData.value, 'size');
  return buildVerticalBarChartOptions(chartData, 'Architecture Breakdown (Android)', formatBytes);
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
