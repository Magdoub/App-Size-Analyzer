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
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Size Breakdown</h1>
        <JsonExportButton />
      </div>
      <div class="mt-2 flex items-center gap-6 text-sm text-gray-600">
        <div>
          <span class="font-medium">Platform:</span> {{ currentAnalysis.platform }}
        </div>
        <div>
          <span class="font-medium">Total Install Size:</span> {{ formatBytes(currentAnalysis.totalInstallSize) }}
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

    <!-- Export Modal -->
    <JsonExportModal />
  </div>
</template>

<script>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useAnalysisStore } from '../../stores/analysisStore';
import { formatBytes } from '../../utils/formatters';
import BreakdownTable from './BreakdownTable.vue';
import BreakdownTabs from './BreakdownTabs.vue';
import JsonExportButton from './JsonExportButton.vue';
import JsonExportModal from './JsonExportModal.vue';

export default {
  name: 'BreakdownView',

  components: {
    BreakdownTabs,
    BreakdownTable,
    JsonExportButton,
    JsonExportModal
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
