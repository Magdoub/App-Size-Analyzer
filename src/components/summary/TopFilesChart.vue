<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <figure v-else-if="hasData" class="chart-container" role="img" aria-label="Horizontal bar chart showing the top 10 largest files in the application">
    <v-chart :option="chartOptions" :autoresize="true" :style="{ height: topFilesChartHeight, width: '100%' }" aria-label="Top 10 largest files chart" />
  </figure>
</template>

<script setup>
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useAppStore } from '../../stores/appStore';
import { getTopFiles } from '../../utils/calculations';
import { transformFilesToHorizontalBarChart, buildHorizontalBarChartOptions } from '../../utils/chart-options';
import { formatBytes, formatBytesCompact } from '../../utils/formatters';
import { useResponsiveChart } from '../../composables/useResponsiveChart';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

const analysisStore = useAnalysisStore();
const appStore = useAppStore();

const isLoading = computed(() => appStore.isLoading);

// Responsive chart sizing - horizontal bar needs more height for 10 items
const { chartHeight: topFilesChartHeight } = useResponsiveChart({ mobileHeight: 300, tabletHeight: 330, desktopHeight: 360 });

const topFilesData = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.breakdownRoot) return [];

  return getTopFiles(analysis.breakdownRoot, 10, analysis.totalInstallSize);
});

const hasData = computed(() => topFilesData.value.length > 0);

const chartOptions = computed(() => {
  if (!hasData.value) return {};

  const chartData = transformFilesToHorizontalBarChart(topFilesData.value, formatBytes);
  return buildHorizontalBarChartOptions(chartData, 'Top 10 Largest Files', formatBytes);
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
