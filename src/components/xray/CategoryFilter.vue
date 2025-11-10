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
        v-for="entry in typeLegend"
        :key="entry.type"
        @click="toggleCategory(entry.type)"
        :class="[
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          isActive(entry.type)
            ? 'bg-white border-2 border-gray-300 text-gray-900'
            : 'bg-gray-100 border-2 border-transparent text-gray-400'
        ]"
      >
        <span
          class="w-3 h-3 rounded-sm"
          :style="{ backgroundColor: entry.color }"
        />
        <span>{{ entry.label }}</span>
      </button>
    </div>

    <div
      v-if="selectedCategories.size > 0 && selectedCategories.size < typeLegend.length"
      class="mt-3 text-sm text-gray-600"
    >
      Showing {{ selectedCategories.size }} of {{ typeLegend.length }} categories
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../stores/uiStore';
import { getTypeLegend } from '../../lib/visualization/color-scheme';

export default {
  name: 'CategoryFilter',

  setup() {
    const uiStore = useUiStore();
    const { xray } = storeToRefs(uiStore);

    const typeLegend = getTypeLegend();
    const selectedCategories = computed(() => xray.value.categories || new Set());

    const isActive = (type) => {
      return selectedCategories.value.size === 0 || selectedCategories.value.has(type);
    };

    const allSelected = computed(() => {
      return selectedCategories.value.size === 0 || selectedCategories.value.size === typeLegend.length;
    });

    const toggleCategory = (type) => {
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
        // Select all
        const allTypes = new Set(typeLegend.map(entry => entry.type));
        uiStore.setXRayCategories(allTypes);
      }
    };

    return {
      typeLegend,
      selectedCategories,
      allSelected,
      isActive,
      toggleCategory,
      handleToggleAll
    };
  }
};
</script>
