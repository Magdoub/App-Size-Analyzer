<!--
  Breakdown View Container
  Main container for the hierarchical breakdown view
-->
<template>
  <div v-if="!currentAnalysis" class="flex items-center justify-center h-64">
    <p class="text-gray-500">No analysis available</p>
  </div>

  <div v-else class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <h1 class="text-2xl font-bold text-gray-900">Size Breakdown</h1>
      <div class="mt-2 flex items-center gap-6 text-sm text-gray-600">
        <div>
          <span class="font-medium">Platform:</span> {{ currentAnalysis.platform }}
        </div>
        <div>
          <span class="font-medium">Total Size:</span> {{ formatBytes(currentAnalysis.totalInstallSize) }}
        </div>
        <div>
          <span class="font-medium">App:</span> {{ currentAnalysis.appName }}
        </div>
        <div>
          <span class="font-medium">Version:</span> {{ currentAnalysis.version }}
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <BreakdownTabs v-model="activeTab" :platform="currentAnalysis.platform" />

    <!-- Table -->
    <div class="flex-1 overflow-hidden">
      <BreakdownTable
        :breakdown-root="currentAnalysis.breakdownRoot"
        :total-size="currentAnalysis.totalInstallSize"
        :active-tab="activeTab"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore } from '../../stores/analysisStore';
import BreakdownTabs from './BreakdownTabs.vue';
import BreakdownTable from './BreakdownTable.vue';
import { formatBytes } from '../../utils/formatters';

export default {
  name: 'BreakdownView',

  components: {
    BreakdownTabs,
    BreakdownTable
  },

  setup() {
    const analysisStore = useAnalysisStore();
    const { currentAnalysis } = storeToRefs(analysisStore);

    const activeTab = ref('all');

    return {
      currentAnalysis,
      activeTab,
      formatBytes
    };
  }
};
</script>
