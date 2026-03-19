<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <figure v-else-if="hasMediaAssets" class="chart-container" role="img" aria-label="Bar chart showing asset type distribution including images, videos, audio, and fonts">
    <v-chart :option="chartOptions" :autoresize="true" :style="{ height: chartHeight, width: '100%' }" aria-label="Asset type distribution chart" />
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
import { categorizeAssetTypes } from '../../utils/calculations';
import { buildVerticalBarChartOptions, transformAssetsToBarChart } from '../../utils/chart-options';
import { formatBytes } from '../../utils/formatters';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

const analysisStore = useAnalysisStore();
const appStore = useAppStore();

const isLoading = computed(() => appStore.isLoading);

// Responsive chart sizing
const { chartHeight } = useResponsiveChart();

const assetData = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.breakdownRoot) return [];

  return categorizeAssetTypes(analysis.breakdownRoot, analysis.totalInstallSize);
});

const hasMediaAssets = computed(() => assetData.value.length > 0);

const chartOptions = computed(() => {
  if (!hasMediaAssets.value) return {};

  const chartData = transformAssetsToBarChart(assetData.value, 'size', false);
  return buildVerticalBarChartOptions(chartData, 'Asset Type Distribution', formatBytes);
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
