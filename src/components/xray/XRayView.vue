<!--
  X-Ray View Container
  Main container for the treemap visualization view
-->
<template>
  <div v-if="!currentAnalysis" class="flex items-center justify-center h-full">
    <div class="text-gray-500">No analysis data available</div>
  </div>

  <div v-else class="flex flex-col bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="mb-4">
        <h2 class="text-2xl font-bold text-gray-900">X-Ray View</h2>
        <p class="text-sm text-gray-600">
          Interactive treemap visualization of app contents
        </p>
      </div>

      <!-- Breadcrumb navigation -->
      <div class="flex items-center gap-4">
        <Breadcrumb
          v-if="xray.zoomPath"
          :path="breadcrumbSegments"
          @navigate="handleBreadcrumbNavigate"
          class="flex-1"
        />
        <div v-else class="flex-1 text-sm text-gray-600">
          Viewing entire app
        </div>
        <button
          v-if="xray.zoomPath"
          @click="handleZoomOut"
          class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          ← Back
        </button>
      </div>

      <!-- Search bar -->
      <div class="mt-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search files..."
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div v-if="searchMatches.length > 0" class="mt-2 text-sm text-gray-600">
          Found {{ searchMatches.length }} matches
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="p-4 border-b border-gray-200">
      <CategoryFilter />
    </div>

    <!-- Treemap -->
    <div class="p-4 w-full" style="height: 700px">
      <div v-if="treemapData" class="relative h-full">
        <Treemap
          :data="treemapData"
          :total-size="currentAnalysis.totalInstallSize"
          :size-percentiles="sizePercentiles"
          :search-matches="searchMatches"
          @node-click="handleNodeClick"
        />
        <!-- Reset Zoom button (floating on top) -->
        <button
          v-if="xray.zoomPath"
          @click="handleResetZoom"
          class="absolute top-2 right-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white/95 hover:bg-white border border-gray-300 rounded-md shadow-sm hover:shadow-md transition-all"
        >
          🔄 Reset Zoom
        </button>
        <!-- Zoom hint -->
        <div class="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded shadow">
          💡 Use mouse wheel or trackpad to zoom in/out
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-gray-500">No data to display</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useUiStore } from '../../stores/uiStore';
import Treemap from './Treemap.vue';
import CategoryFilter from './CategoryFilter.vue';
import Breadcrumb from '../shared/Breadcrumb.vue';
import { generateSubtreeData, filterByCategories, searchTree } from '../../lib/visualization/treemap-generator';
import { calculateSizePercentiles } from '../../lib/visualization/color-scheme';

export default {
  name: 'XRayView',

  components: {
    Treemap,
    CategoryFilter,
    Breadcrumb
  },

  setup() {
    const analysisStore = useAnalysisStore();
    const uiStore = useUiStore();
    const { currentAnalysis } = storeToRefs(analysisStore);
    const { xray } = storeToRefs(uiStore);

    const searchQuery = ref('');

    // Computed properties from store
    const sizePercentiles = computed(() => xray.value.sizePercentiles);

    // Generate treemap data based on current filters
    const treemapData = computed(() => {
      if (!currentAnalysis.value) return null;

      // Apply category filter
      const categories = xray.value.categories || new Set();
      const filtered = filterByCategories(currentAnalysis.value.breakdownRoot, categories);

      // Generate treemap data with optional zoom
      const result = generateSubtreeData(filtered, xray.value.zoomPath || null, {
        maxDepth: 3,
        minSize: 100
      });

      return result;
    });

    // Search matches
    const searchMatches = computed(() => {
      if (!currentAnalysis.value || !searchQuery.value) return [];
      return searchTree(currentAnalysis.value.breakdownRoot, searchQuery.value);
    });

    // Generate breadcrumb segments from current zoom path
    const breadcrumbSegments = computed(() => {
      if (!xray.value.zoomPath) return ['All'];
      return ['All', ...xray.value.zoomPath.split('/').filter(Boolean)];
    });

    // Handle drill-down (zoom into node)
    const handleNodeClick = (path) => {
      uiStore.setXRayZoom(path);
    };

    // Handle zoom out (breadcrumb navigation)
    const handleZoomOut = () => {
      if (!xray.value.zoomPath) return;

      const pathParts = xray.value.zoomPath.split('/');
      pathParts.pop();
      const parentPath = pathParts.join('/');

      uiStore.setXRayZoom(parentPath || null);
    };

    // Handle reset zoom (go to root)
    const handleResetZoom = () => {
      uiStore.setXRayZoom(null);
    };

    // Handle breadcrumb navigation
    const handleBreadcrumbNavigate = ({ index, path }) => {
      if (index === 0) {
        // Navigate to root
        uiStore.setXRayZoom(null);
      } else {
        // Navigate to specific path
        const targetPath = path.slice(1).join('/'); // Remove 'All' and join
        uiStore.setXRayZoom(targetPath);
      }
    };

    // Calculate and update size percentiles when analysis changes
    onMounted(() => {
      if (currentAnalysis.value?.breakdownRoot) {
        const percentiles = calculateSizePercentiles(currentAnalysis.value.breakdownRoot);
        uiStore.updateSizePercentiles(percentiles);
      }
    });

    // Watch for analysis changes and recalculate percentiles
    watch(
      () => currentAnalysis.value,
      (newAnalysis) => {
        if (newAnalysis?.breakdownRoot) {
          const percentiles = calculateSizePercentiles(newAnalysis.breakdownRoot);
          uiStore.updateSizePercentiles(percentiles);
        }
      }
    );

    return {
      currentAnalysis,
      xray,
      sizePercentiles,
      searchQuery,
      treemapData,
      searchMatches,
      breadcrumbSegments,
      handleNodeClick,
      handleZoomOut,
      handleResetZoom,
      handleBreadcrumbNavigate
    };
  }
};
</script>
