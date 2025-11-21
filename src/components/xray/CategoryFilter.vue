<!--
  Category Filter Component
  Allows users to filter treemap by content type categories
-->
<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-gray-900">Filter by Content Type</h3>
      <button
        @click="handleToggleAll"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {{ allSelected ? 'Clear All' : 'Select All' }}
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="entry in availableCategories"
        :key="entry.type"
        @click="handleCategoryClick(entry.type)"
        :class="[
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          isActive(entry.type)
            ? 'bg-white border-2 border-gray-300 text-gray-900'
            : 'bg-gray-100 border-2 border-transparent text-gray-400 hover:bg-gray-200'
        ]"
      >
        <span
          class="w-3 h-3 rounded-sm flex-shrink-0"
          :style="{ backgroundColor: entry.color }"
        />
        <span>{{ entry.label }}</span>
        <span class="text-green-700 text-xs font-semibold">({{ entry.formattedSize }})</span>
      </button>
    </div>

    <div
      v-if="selectedCategories.size > 0 && selectedCategories.size < availableCategories.length"
      class="mt-3 text-sm text-gray-600"
    >
      Showing {{ selectedCategories.size }} of {{ availableCategories.length }} categories
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../stores/uiStore';
import { useAnalysisStore } from '../../stores/analysisStore';
import { getTypeLegend } from '../../lib/visualization/color-scheme';
import { formatBytes } from '../../utils/formatters';

export default {
  name: 'CategoryFilter',

  setup() {
    const uiStore = useUiStore();
    const analysisStore = useAnalysisStore();
    const { xray } = storeToRefs(uiStore);
    const { currentAnalysis } = storeToRefs(analysisStore);

    const typeLegend = getTypeLegend();
    const selectedCategories = computed(() => xray.value.categories || new Set());

    // Check which categories have data and calculate sizes
    const categoryData = computed(() => {
      const data = {};

      if (!currentAnalysis.value?.breakdownRoot) {
        // If no analysis, mark all as unavailable with zero size
        typeLegend.forEach(entry => {
          data[entry.type] = { available: false, size: 0 };
        });
        return data;
      }

      // Initialize all to unavailable with zero size
      typeLegend.forEach(entry => {
        data[entry.type] = { available: false, size: 0 };
      });

      // Traverse tree to find which types exist and calculate sizes
      function calculateSizes(node) {
        if (data[node.type] !== undefined) {
          data[node.type].available = true;
          // Only count leaf nodes (files) to avoid double-counting
          if (!node.children || node.children.length === 0) {
            data[node.type].size += node.size || 0;
          }
        }
        if (node.children) {
          node.children.forEach(calculateSizes);
        }
      }

      calculateSizes(currentAnalysis.value.breakdownRoot);
      return data;
    });

    // Get list of available categories with size info
    const availableCategories = computed(() => {
      return typeLegend
        .filter(entry => categoryData.value[entry.type]?.available)
        .map(entry => ({
          ...entry,
          size: categoryData.value[entry.type].size,
          formattedSize: formatBytes(categoryData.value[entry.type].size, 1)
        }));
    });

    const isActive = (type) => {
      return selectedCategories.value.size === 0 || selectedCategories.value.has(type);
    };

    const allSelected = computed(() => {
      return selectedCategories.value.size === 0 || selectedCategories.value.size === availableCategories.value.length;
    });

    const handleCategoryClick = (type) => {
      const newCategories = new Set(selectedCategories.value);
      if (newCategories.has(type)) {
        newCategories.delete(type);
      } else {
        newCategories.add(type);
      }
      uiStore.setXRayCategories(newCategories);
    };

    const handleToggleAll = () => {
      if (allSelected.value) {
        // Clear all
        uiStore.setXRayCategories(new Set());
      } else {
        // Select all available types only
        const allAvailableTypes = new Set(
          typeLegend
            .filter(entry => categoryData.value[entry.type]?.available)
            .map(entry => entry.type)
        );
        uiStore.setXRayCategories(allAvailableTypes);
      }
    };

    return {
      selectedCategories,
      allSelected,
      isActive,
      availableCategories,
      handleCategoryClick,
      handleToggleAll
    };
  }
};
</script>
