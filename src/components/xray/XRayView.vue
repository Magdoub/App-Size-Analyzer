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
      <!-- Empty state when filter returns no results -->
      <div v-if="isFilteredEmpty" class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="text-4xl mb-4">{{ emptyStateIcon }}</div>
          <div class="text-gray-500 text-lg">{{ emptyStateMessage }}</div>
        </div>
      </div>
      <div v-else-if="treemapData" class="relative h-full">
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
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { calculateSizePercentiles } from '../../lib/visualization/color-scheme';
import { filterByCategories, generateSubtreeData, searchTree } from '../../lib/visualization/treemap-generator';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useUiStore } from '../../stores/uiStore';
import Breadcrumb from '../shared/Breadcrumb.vue';
import CategoryFilter from './CategoryFilter.vue';
import Treemap from './Treemap.vue';

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

    // Check if filtered results are empty
    const isFilteredEmpty = computed(() => {
      if (!treemapData.value) return false;
      const categories = xray.value.categories || new Set();
      // If categories are selected and result has no children, it's empty
      // Note: children may be undefined (not just empty array) when no matches
      return categories.size > 0 && (!treemapData.value.children || treemapData.value.children.length === 0);
    });

    // Get the single selected category (for message display)
    const selectedCategory = computed(() => {
      const categories = xray.value.categories || new Set();
      if (categories.size === 1) {
        return Array.from(categories)[0];
      }
      return null;
    });

    // Empty state message based on selected category
    const emptyStateMessage = computed(() => {
      const category = selectedCategory.value;
      const categoryLabels = {
        'localization': 'No localizations detected',
        'framework': 'No frameworks detected',
        'native_lib': 'No native libraries detected',
        'asset': 'No assets detected',
        'image': 'No images detected',
        'video': 'No videos detected',
        'audio': 'No audio files detected',
        'font': 'No fonts detected',
        'dex': 'No DEX files detected',
        'executable': 'No executables detected',
        'resource': 'No resources detected',
        'data': 'No data files detected',
        'config': 'No config files detected',
      };
      return category ? categoryLabels[category] || 'No items found' : 'No items match the selected filters';
    });

    // Empty state icon based on selected category
    const emptyStateIcon = computed(() => {
      const category = selectedCategory.value;
      const categoryIcons = {
        'localization': '🌐',
        'framework': '📦',
        'native_lib': '📦',
        'asset': '🖼️',
        'image': '🖼️',
        'video': '🎬',
        'audio': '🎵',
        'font': '🔤',
        'dex': '📱',
        'executable': '⚙️',
        'resource': '📋',
        'data': '📄',
        'config': '⚙️',
      };
      return category ? categoryIcons[category] || '📁' : '🔍';
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
      isFilteredEmpty,
      emptyStateMessage,
      emptyStateIcon,
      handleNodeClick,
      handleZoomOut,
      handleResetZoom,
      handleBreadcrumbNavigate
    };
  }
};
</script>
