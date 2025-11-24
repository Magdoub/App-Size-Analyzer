<!--
  Insights View Container
  Main container for the insights/recommendations view
-->
<template>
  <div v-if="!currentAnalysis" class="flex items-center justify-center h-full">
    <div class="text-gray-500">No analysis data available</div>
  </div>

  <div v-else-if="isAnalyzing" class="insight-loader">
    <div class="loader-content">
      <!-- App info -->
      <div class="loader-app-info">
        <div class="loader-app-name">{{ currentAnalysis.appName || 'App' }}</div>
        <div class="loader-app-meta">{{ (currentAnalysis.allFiles?.length || 0).toLocaleString() }} files · {{ formatBytes(currentAnalysis.totalInstallSize) }}</div>
      </div>

      <!-- Spinner -->
      <div class="loader-spinner-container">
        <div class="loader-spinner"></div>
      </div>

      <!-- Phase text -->
      <div class="loader-phase">{{ currentPhase }}</div>

      <!-- Progress bar -->
      <div class="loader-progress">
        <div class="loader-progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <!-- Stats that appear during loading -->
      <div class="loader-stats" :class="{ visible: showStats }">
        <div class="loader-stat" v-if="filesScanned > 0">
          <span class="loader-stat-value">{{ filesScanned.toLocaleString() }}</span>
          <span class="loader-stat-label">files analyzed</span>
        </div>
        <div class="loader-stat" v-if="patternsChecked > 0">
          <span class="loader-stat-value">{{ patternsChecked }}</span>
          <span class="loader-stat-label">rules checked</span>
        </div>
        <div class="loader-stat">
          <span class="loader-stat-value loader-stat-highlight">{{ potentialSavings > 0 ? formatBytes(potentialSavings) : '--' }}</span>
          <span class="loader-stat-label">potential savings (up to)</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="flex items-center justify-center h-full">
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
      <h3 class="text-lg font-semibold text-red-900 mb-2">Analysis Error</h3>
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>
  </div>

  <div v-else class="flex flex-col min-h-screen bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between mb-4 stagger-item stagger-1">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Optimization Insights</h2>
          <p class="text-sm text-gray-600">
            Automated recommendations to reduce app size
          </p>
        </div>

        <!-- Summary Stats -->
        <div
          v-if="filteredInsights.length > 0"
          class="flex gap-4"
        >
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="text-sm text-gray-600">Current Install Size</div>
            <div class="text-2xl font-bold text-gray-900">{{ formatBytes(currentAnalysis.totalInstallSize, 1) }}</div>
          </div>
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div class="text-sm text-gray-600">Estimated Savings</div>
            <div class="text-2xl font-bold text-blue-900">{{ formatBytes(Math.round(totalSavings * 0.6), 1) }} - {{ formatBytes(totalSavings, 1) }}</div>
            <div class="text-xs text-gray-500 mt-1">
              Range accounts for overlapping optimizations
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="stagger-item stagger-2">
        <InsightFilters
          :selected-categories="categoryFilter"
          :insights="insights"
          @category-toggle="handleCategoryToggle"
        />
      </div>
    </div>

    <!-- Insights List -->
    <div class="flex-1 p-4 overflow-auto">
      <div v-if="filteredInsights.length === 0" class="flex items-center justify-center py-12 stagger-item stagger-3">
        <div class="text-center">
          <div class="text-4xl mb-4">✨</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No insights to display</h3>
          <p class="text-sm text-gray-600">
            {{ insights.length === 0
              ? 'Great job! Your app is well optimized.'
              : 'Try adjusting the filters to see more insights.'
            }}
          </p>
        </div>
      </div>

      <!-- Insights List -->
      <div v-else class="space-y-4">
        <div
          v-for="(insight, index) in filteredInsights"
          :key="`${insight.ruleId}-${index}`"
          class="stagger-item"
          :style="{ animationDelay: `${300 + index * 80}ms` }"
        >
          <InsightCard :insight="insight" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore } from '../../stores/analysisStore';
import InsightCard from './InsightCard.vue';
import InsightFilters from './InsightFilters.vue';
import { getDefaultInsightEngine } from '../../lib/analysis';
import { formatBytes } from '../../utils/formatters';

export default {
  name: 'InsightsView',

  components: {
    InsightCard,
    InsightFilters
  },

  setup() {
    const analysisStore = useAnalysisStore();
    const { currentAnalysis } = storeToRefs(analysisStore);

    const isAnalyzing = ref(false);
    const error = ref(null);
    const insights = ref([]);
    const categoryFilter = ref(new Set());

    // Loading animation state
    const progressPercent = ref(0);
    const currentPhase = ref('Preparing analysis...');
    const filesScanned = ref(0);
    const patternsChecked = ref(0);
    const showStats = ref(false);
    const potentialSavings = ref(0);

    const phases = [
      'Scanning file structure...',
      'Analyzing asset types...',
      'Checking optimization rules...',
      'Calculating potential savings...',
      'Generating recommendations...'
    ];

    // Animate the loading experience
    const animateLoading = (totalFiles, totalSavingsTarget) => {
      const duration = 8000;
      const startTime = Date.now();
      const totalRules = 24;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        progressPercent.value = Math.round(eased * 100);
        filesScanned.value = Math.round(eased * totalFiles);
        patternsChecked.value = Math.round(eased * totalRules);

        // Start savings counter at 50% progress, animate in discrete steps
        if (progress > 0.5) {
          const savingsProgress = (progress - 0.5) / 0.5; // 0 to 1 over second half
          // Use 20 discrete steps for gradual counting effect
          const step = Math.floor(savingsProgress * 20);
          const rawValue = (step / 20) * totalSavingsTarget;
          // Round to nearest 10KB for cleaner display
          potentialSavings.value = Math.ceil(rawValue / 10240) * 10240;
        }

        // Show stats after 20% progress
        if (progress > 0.2) {
          showStats.value = true;
        }

        const phaseIndex = Math.min(Math.floor(eased * phases.length), phases.length - 1);
        currentPhase.value = phases[phaseIndex];

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    // Run insights analysis when view loads
    const runAnalysis = async () => {
      if (!currentAnalysis.value || insights.value.length > 0) return;

      isAnalyzing.value = true;
      error.value = null;
      progressPercent.value = 0;
      filesScanned.value = 0;
      patternsChecked.value = 0;
      potentialSavings.value = 0;
      showStats.value = false;

      try {
        const engine = getDefaultInsightEngine();
        const totalFiles = currentAnalysis.value.allFiles?.length || 500;

        // Run analysis first to get actual savings
        const results = await engine.executeAll(currentAnalysis.value);
        const actualSavings = results.reduce((sum, insight) => sum + (insight.potentialSavings || 0), 0);

        // Start animation with real values
        animateLoading(totalFiles, actualSavings);

        // Wait for animation to complete + 0.5s pause at end
        await new Promise(resolve => setTimeout(resolve, 8500));

        insights.value = results;
      } catch (err) {
        console.error('[InsightsView] Analysis failed:', err);
        error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      } finally {
        isAnalyzing.value = false;
      }
    };

    onMounted(() => {
      runAnalysis();
    });

    watch(currentAnalysis, () => {
      if (currentAnalysis.value) {
        insights.value = [];
        runAnalysis();
      }
    });

    // Filter insights by category and sort by savings
    const filteredInsights = computed(() => {
      let filtered = insights.value;

      if (categoryFilter.value.size > 0) {
        filtered = filtered.filter((insight) =>
          categoryFilter.value.has(insight.category)
        );
      }

      // Sort by potentialSavings descending
      return [...filtered].sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0));
    });

    // Calculate total savings
    const totalSavings = computed(() => {
      const rawTotal = filteredInsights.value.reduce((sum, insight) => sum + (insight.potentialSavings || 0), 0);

      // Cap at app size - you can't save more than the entire app!
      // Insights may have overlapping files (e.g., same file flagged as "large" and "unused")
      if (!currentAnalysis.value) return rawTotal;
      return Math.min(rawTotal, currentAnalysis.value.totalInstallSize);
    });

    const totalSavingsPercent = computed(() => {
      if (!currentAnalysis.value) return 0;
      return (totalSavings.value / currentAnalysis.value.totalInstallSize) * 100;
    });

    // Handle category filter toggle
    const handleCategoryToggle = (category) => {
      const newFilter = new Set(categoryFilter.value);
      if (newFilter.has(category)) {
        newFilter.delete(category);
      } else {
        newFilter.add(category);
      }
      categoryFilter.value = newFilter;
    };

    return {
      currentAnalysis,
      isAnalyzing,
      error,
      insights,
      categoryFilter,
      filteredInsights,
      totalSavings,
      totalSavingsPercent,
      handleCategoryToggle,
      formatBytes,
      progressPercent,
      currentPhase,
      filesScanned,
      patternsChecked,
      showStats,
      potentialSavings
    };
  }
};
</script>

<style scoped>
/* Loader container */
.insight-loader {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background: #fff;
  padding: 6rem 2rem 4rem;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 320px;
}

/* App info */
.loader-app-info {
  text-align: center;
  margin-bottom: 0.5rem;
}

.loader-app-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.loader-app-meta {
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Spinner */
.loader-spinner-container {
  padding: 1rem 0;
}

.loader-spinner {
  width: 36px;
  height: 36px;
  border: 2.5px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Phase text */
.loader-phase {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

/* Progress bar */
.loader-progress {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.loader-progress-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.15s ease-out;
}

/* Stats */
.loader-stats {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.4s ease;
}

.loader-stats.visible {
  opacity: 1;
  transform: translateY(0);
}

.loader-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.loader-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
}

.loader-stat-highlight {
  color: #059669;
}

.loader-stat-label {
  font-size: 0.6875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Staggered animations for results */
.stagger-item {
  opacity: 0;
  transform: translateY(12px);
  animation: staggerIn 0.4s ease-out forwards;
}

.stagger-1 { animation-delay: 0ms; }
.stagger-2 { animation-delay: 100ms; }
.stagger-3 { animation-delay: 200ms; }

@keyframes staggerIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
