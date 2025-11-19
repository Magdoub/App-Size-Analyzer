<template>
  <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
    <p class="text-gray-500">Loading chart data...</p>
  </div>
  <figure v-else-if="hasLocalizations" class="chart-container" role="img" aria-label="Bar chart showing localization impact by language">
    <v-chart :option="chartOptions" :autoresize="true" :style="{ height: chartHeight, width: '100%' }" aria-label="Localization impact chart" />
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
import { analyzeLocalizations } from '../../utils/calculations';
import { transformLocalizationsToBarChart, buildVerticalBarChartOptions } from '../../utils/chart-options';
import { formatBytes } from '../../utils/formatters';
import { useResponsiveChart } from '../../composables/useResponsiveChart';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

const analysisStore = useAnalysisStore();
const appStore = useAppStore();

const isLoading = computed(() => appStore.isLoading);

// Responsive chart sizing
const { chartHeight } = useResponsiveChart();

const localizationData = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.breakdownRoot) return [];

  return analyzeLocalizations(
    analysis.breakdownRoot,
    analysis.platform,
    analysis.totalInstallSize,
    analysis.resourceTableLocales
  );
});

const hasLocalizations = computed(() => {
  // Show if 2+ localizations exist and total size >2% of app
  if (localizationData.value.length < 2) return false;

  const totalLocalizationPercentage = localizationData.value.reduce(
    (sum, loc) => sum + loc.percentage,
    0
  );
  return totalLocalizationPercentage > 2;
});

const chartOptions = computed(() => {
  if (!hasLocalizations.value) return {};

  const chartData = transformLocalizationsToBarChart(localizationData.value, 'size');
  return buildVerticalBarChartOptions(chartData, 'Localization Impact by Language', formatBytes);
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
