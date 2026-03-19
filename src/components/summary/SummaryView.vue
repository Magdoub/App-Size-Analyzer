<template>
  <main class="summary-view" role="main" aria-label="Application size summary">
    <!-- Header with Summary Statistics -->
    <header class="mb-8">
      <h2 class="text-2xl font-bold mb-4">Summary</h2>

      <div v-if="analysisStore.currentAnalysis" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" role="region" aria-label="Summary statistics">
        <div class="stat-card" role="group" aria-labelledby="stat-platform">
          <div id="stat-platform" class="stat-label">Platform</div>
          <div class="stat-value" aria-label="Platform type">{{ analysisStore.currentAnalysis.platform }}</div>
        </div>
        <div class="stat-card" role="group" aria-labelledby="stat-install-size">
          <div id="stat-install-size" class="stat-label">Total Install Size</div>
          <div class="stat-value" aria-label="Total install size">{{ formatBytes(analysisStore.currentAnalysis.totalInstallSize) }}</div>
        </div>
        <div v-if="analysisStore.currentAnalysis.totalDownloadSize" class="stat-card" role="group" aria-labelledby="stat-download-size">
          <div id="stat-download-size" class="stat-label">Total Download Size</div>
          <div class="stat-value" aria-label="Total download size">{{ formatBytes(analysisStore.currentAnalysis.totalDownloadSize) }}</div>
        </div>
        <div class="stat-card" role="group" aria-labelledby="stat-file-count">
          <div id="stat-file-count" class="stat-label">File Count</div>
          <div class="stat-value" aria-label="Total file count">{{ formatNumber(totalFileCount) }}</div>
        </div>
      </div>
    </header>

    <!-- Core Distribution Charts (P1) - 2 column grid -->
    <section class="mb-8" aria-labelledby="section-file-type">
      <h3 id="section-file-type" class="text-xl font-semibold mb-4">File Type Distribution</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileTypeDistributionChart />
        <FileCountDistributionChart />
      </div>
    </section>

    <!-- Top Files & Asset Type - 2 column grid -->
    <section class="mb-8" aria-labelledby="section-files-assets">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 id="section-top-files" class="text-xl font-semibold mb-4">Largest Files</h3>
          <TopFilesChart />
        </div>
        <div v-if="hasAssets">
          <h3 class="text-xl font-semibold mb-4">Asset Type Distribution</h3>
          <AssetTypeDistributionChart />
        </div>
      </div>
    </section>

    <!-- Advanced Analytics (P3) - Architecture Breakdown -->
    <section v-if="hasArchitectures" class="mb-8" aria-labelledby="section-advanced">
      <h3 id="section-advanced" class="text-xl font-semibold mb-4">Architecture Breakdown</h3>
      <ArchitectureBreakdownChart />
    </section>

    <!-- Localization Impact - full width -->
    <section v-if="hasLocalizations" class="mb-8" aria-labelledby="section-localization">
      <h3 id="section-localization" class="text-xl font-semibold mb-4">Localization Impact</h3>
      <LocalizationImpactChart />
    </section>

    <!-- Empty State -->
    <div v-if="!analysisStore.currentAnalysis" class="empty-state" role="status" aria-live="polite">
      <p class="text-gray-500 text-center py-8">
        No analysis data available. Please upload an app binary to view the summary.
      </p>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useAnalysisStore } from '../../stores/analysisStore';
import { analyzeLocalizations } from '../../utils/calculations';
import { formatBytes, formatNumber } from '../../utils/formatters';
import ArchitectureBreakdownChart from './ArchitectureBreakdownChart.vue';
import AssetTypeDistributionChart from './AssetTypeDistributionChart.vue';
import FileCountDistributionChart from './FileCountDistributionChart.vue';
// Import chart components
import FileTypeDistributionChart from './FileTypeDistributionChart.vue';
import LocalizationImpactChart from './LocalizationImpactChart.vue';
import TopFilesChart from './TopFilesChart.vue';

const analysisStore = useAnalysisStore();

const totalFileCount = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.allFiles) return 0;
  return analysis.allFiles.length;
});

const hasLocalizations = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis || !analysis.breakdownRoot) return false;

  const locData = analyzeLocalizations(
    analysis.breakdownRoot,
    analysis.platform,
    analysis.totalInstallSize,
    analysis.resourceTableLocales
  );

  // Require 2+ localizations AND >2% total size
  if (locData.length < 2) return false;
  const totalPct = locData.reduce((sum, loc) => sum + loc.percentage, 0);
  return totalPct > 2;
});

const hasAssets = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis) return false;
  return analysis.assets?.length > 0;
});

const hasArchitectures = computed(() => {
  const analysis = analysisStore.currentAnalysis;
  if (!analysis) return false;
  return analysis.platform === 'Android' && analysis.nativeLibraries?.length > 0;
});
</script>

<style scoped>
.summary-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.empty-state {
  background: white;
  border-radius: 8px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
</style>
