<!--
  Insight Filters Component
  Allows filtering insights by severity and category
-->
<template>
  <div v-if="activeCategories.length > 0">
    <!-- Category Filter -->
    <div>
      <h3 class="text-sm font-medium text-gray-900 mb-2">Filter by Category</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in activeCategories"
          :key="category"
          @click="$emit('category-toggle', category)"
          :class="[
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-all',
            selectedCategories.has(category) || selectedCategories.size === 0
              ? 'bg-white border-gray-300 text-gray-900'
              : 'bg-gray-100 text-gray-400 border-transparent'
          ]"
        >
          <span>{{ getCategoryIcon(category) }}</span>
          <span class="capitalize">{{ category.replace(/-/g, ' ') }}</span>
          <span class="text-xs text-green-700 font-semibold">
            ({{ formatCategorySavings(categorySavings[category]) }})
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'InsightFilters',

  props: {
    /**
     * Selected categories set
     * @type {Set}
     */
    selectedCategories: {
      type: Set,
      required: true
    },

    /**
     * All insights for calculating savings per category
     * @type {Array}
     */
    insights: {
      type: Array,
      default: () => []
    }
  },

  emits: ['category-toggle'],

  setup(props) {
    // Calculate savings per category dynamically from insights
    const categorySavings = computed(() => {
      const savings = {};
      props.insights.forEach(insight => {
        const cat = insight.category;
        if (!savings[cat]) savings[cat] = 0;
        savings[cat] += insight.potentialSavings || 0;
      });
      return savings;
    });

    // Get active categories sorted by savings (descending)
    const activeCategories = computed(() => {
      return Object.keys(categorySavings.value)
        .filter(cat => categorySavings.value[cat] > 0)
        .sort((a, b) => categorySavings.value[b] - categorySavings.value[a]);
    });

    // Format savings as MB
    const formatCategorySavings = (bytes) => {
      if (bytes >= 1024 * 1024) {
        return (bytes / 1024 / 1024).toFixed(1) + 'MB';
      }
      return (bytes / 1024).toFixed(0) + 'KB';
    };

    const getCategoryIcon = (category) => {
      const icons = {
        'duplicates': '📋',
        'optimization': '⚡',
        'size-optimization': '⚡',
        'unused': '🗑️',
        'over-bundling': '📦',
        'compression': '🗜️',
        'architecture': '🏗️',
        'security': '🔒'
      };
      return icons[category] || '💡';
    };

    return {
      activeCategories,
      categorySavings,
      getCategoryIcon,
      formatCategorySavings
    };
  }
};
</script>
