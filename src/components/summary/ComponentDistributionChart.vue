<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <div v-else-if="hasData" class="chart-container">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" role="group" aria-label="Component distribution charts">
      <figure role="img" aria-label="Bar chart showing component size distribution">
        <v-chart :option="sizeChartOptions" :autoresize="true" :style="{ height: chartHeight }" aria-label="Component size chart" />
      </figure>
      <figure role="img" aria-label="Bar chart showing component file count distribution">
        <v-chart :option="countChartOptions" :autoresize="true" :style="{ height: chartHeight }" aria-label="Component file count chart" />
      </figure>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useResponsiveChart } from '../../composables/useResponsiveChart';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useAppStore } from '../../stores/appStore';
import { aggregateByComponent } from '../../utils/calculations';
import { transformComponentsToBarChart, buildVerticalBarChartOptions } from '../../utils/chart-options';
import { formatBytes, formatNumber } from '../../utils/formatters';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

const analysisStore = useAnalysisStore();
const appStore = useAppStore();

const isLoading = computed(() => appStore.isLoading);

// Responsive chart sizing - slightly smaller for side-by-side display
const { chartHeight } = useResponsiveChart({ mobileHeight: 240, tabletHeight: 270, desktopHeight: 300 });

const componentData = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.breakdownRoot) return null;

  return aggregateByComponent(
    analysis.breakdownRoot,
    analysis.platform,
    analysis.totalInstallSize
  );
});

const hasData = computed(() => componentData.value !== null);

const sizeChartOptions = computed(() => {
  if (!hasData.value) return {};

  const chartData = transformComponentsToBarChart(componentData.value, 'size', false);
  return buildVerticalBarChartOptions(chartData, 'Component Size', formatBytes);
});

const countChartOptions = computed(() => {
  if (!hasData.value) return {};

  const chartData = transformComponentsToBarChart(componentData.value, 'count', false);
  return buildVerticalBarChartOptions(chartData, 'Component File Count', formatNumber);
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
