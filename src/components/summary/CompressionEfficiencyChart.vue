<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <figure v-else-if="hasCompressionData" class="chart-container" role="img" aria-label="Stacked bar chart showing compression efficiency by file type for iOS apps">
    <v-chart :option="chartOptions" :autoresize="true" :style="{ height: chartHeight, width: '100%' }" aria-label="Compression efficiency chart" />
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
import { analyzeCompressionByType } from '../../utils/calculations';
import { buildVerticalBarChartOptions } from '../../utils/chart-options';
import { formatBytes } from '../../utils/formatters';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

const analysisStore = useAnalysisStore();
const appStore = useAppStore();

const isLoading = computed(() => appStore.isLoading);

// Responsive chart sizing
const { chartHeight } = useResponsiveChart();

const platform = computed(() => analysisStore.currentAnalysis?.platform);
const isIOS = computed(() => platform.value === 'iOS');

const hasCompressionData = computed(() => {
  return isIOS.value && analysisStore.currentAnalysis?.totalDownloadSize > 0;
});

const compressionData = computed(() => {
  if (!hasCompressionData.value) return [];

  const analysis = analysisStore.currentAnalysis;
  return analyzeCompressionByType(analysis.breakdownRoot, analysis.platform);
});

const chartOptions = computed(() => {
  if (!hasCompressionData.value || compressionData.value.length === 0) return {};

  // Transform to simple bar chart showing only compressed size
  const validData = compressionData.value.filter(c => c.compressed > 0);
  const chartData = {
    categories: validData.map(c => c.category),
    series: [{
      name: 'Compressed Size',
      data: validData.map(c => c.compressed),
      colors: validData.map(c => c.color)
    }]
  };

  return buildVerticalBarChartOptions(chartData, 'Compression Efficiency by File Type (iOS)', formatBytes);
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
