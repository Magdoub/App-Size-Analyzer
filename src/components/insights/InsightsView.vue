<!--
  Insights View Container
  Main container for the insights/recommendations view
-->
<template>
  <div v-if="!currentAnalysis" class="flex items-center justify-center h-full">
    <div class="text-gray-500">No analysis data available</div>
  </div>

  <div v-else-if="isAnalyzing" class="flex flex-col items-center justify-center h-full gap-4">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    <div class="text-gray-700 font-medium">Analyzing for optimization opportunities...</div>
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
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Optimization Insights</h2>
          <p class="text-sm text-gray-600">
            Automated recommendations to reduce app size
          </p>
        </div>

        <!-- Summary Stats -->
        <div
          v-if="filteredInsights.length > 0"
          class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
        >
          <div class="text-sm text-gray-600">Total Potential Savings</div>
          <div class="text-3xl font-bold text-blue-900">{{ formatBytes(totalSavings) }}</div>
          <div class="text-sm text-gray-600 mt-1">
            {{ totalSavingsPercent.toFixed(2) }}% of total size
          </div>
        </div>
      </div>

      <!-- Filters -->
      <InsightFilters
        :selected-severities="severityFilter"
        :selected-categories="categoryFilter"
        :group-by-severity="groupBySeverity"
        @severity-toggle="handleSeverityToggle"
        @category-toggle="handleCategoryToggle"
        @toggle-group-by-severity="groupBySeverity = !groupBySeverity"
      />
    </div>

    <!-- Insights List -->
    <div class="flex-1 p-4 overflow-auto">
      <div v-if="filteredInsights.length === 0" class="flex items-center justify-center py-12">
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

      <!-- Grouped by Severity -->
      <div v-else-if="groupBySeverity">
        <SeveritySection
          v-for="severity in ['critical', 'high', 'medium', 'low']"
          :key="severity"
          :severity="severity"
          :insights="groupedInsights[severity] || []"
        />
      </div>

      <!-- Flat List -->
      <div v-else class="space-y-4">
        <InsightCard
          v-for="(insight, index) in filteredInsights"
          :key="`${insight.ruleId}-${index}`"
          :insight="insight"
        />
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
import SeveritySection from './SeveritySection.vue';
import { getDefaultInsightEngine } from '../../lib/analysis';
import { formatBytes } from '../../utils/formatters';

export default {
  name: 'InsightsView',

  components: {
    InsightCard,
    InsightFilters,
    SeveritySection
  },

  setup() {
    const analysisStore = useAnalysisStore();
    const { currentAnalysis } = storeToRefs(analysisStore);

    const isAnalyzing = ref(false);
    const error = ref(null);
    const insights = ref([]);
    const severityFilter = ref(new Set());
    const categoryFilter = ref(new Set());
    const groupBySeverity = ref(true);

    // Run insights analysis when view loads
    const runAnalysis = async () => {
      if (!currentAnalysis.value || insights.value.length > 0) return;

      isAnalyzing.value = true;
      error.value = null;

      try {
        const engine = getDefaultInsightEngine();
        const results = await engine.executeAll(currentAnalysis.value);
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

    // Filter insights
    const filteredInsights = computed(() => {
      let filtered = insights.value;

      if (severityFilter.value.size > 0) {
        filtered = filtered.filter((insight) =>
          severityFilter.value.has(insight.severity)
        );
      }

      if (categoryFilter.value.size > 0) {
        filtered = filtered.filter((insight) =>
          categoryFilter.value.has(insight.category)
        );
      }

      return filtered;
    });

    // Group insights by severity
    const groupedInsights = computed(() => {
      if (!groupBySeverity.value) return null;

      const groups = {
        critical: [],
        high: [],
        medium: [],
        low: []
      };

      filteredInsights.value.forEach((insight) => {
        groups[insight.severity].push(insight);
      });

      // Sort within each group by potentialSavings
      Object.values(groups).forEach((group) => {
        group.sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0));
      });

      return groups;
    });

    // Calculate total savings
    const totalSavings = computed(() => {
      return filteredInsights.value.reduce((sum, insight) => sum + (insight.potentialSavings || 0), 0);
    });

    const totalSavingsPercent = computed(() => {
      if (!currentAnalysis.value) return 0;
      return (totalSavings.value / currentAnalysis.value.totalInstallSize) * 100;
    });

    // Handle filter toggles
    const handleSeverityToggle = (severity) => {
      const newFilter = new Set(severityFilter.value);
      if (newFilter.has(severity)) {
        newFilter.delete(severity);
      } else {
        newFilter.add(severity);
      }
      severityFilter.value = newFilter;
    };

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
      severityFilter,
      categoryFilter,
      groupBySeverity,
      filteredInsights,
      groupedInsights,
      totalSavings,
      totalSavingsPercent,
      handleSeverityToggle,
      handleCategoryToggle,
      formatBytes
    };
  }
};
</script>
