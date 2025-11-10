<!--
  Insight Filters Component
  Allows filtering insights by severity and category
-->
<template>
  <div class="space-y-4">
    <!-- View Options -->
    <div class="flex items-center justify-between pb-3 border-b border-gray-200">
      <h3 class="text-sm font-medium text-gray-900">View Options</h3>
      <button
        @click="$emit('toggle-group-by-severity')"
        :class="[
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-all',
          groupBySeverity
            ? 'bg-purple-100 text-purple-800 border-purple-300'
            : 'bg-gray-100 text-gray-600 border-transparent'
        ]"
      >
        <span>{{ groupBySeverity ? '✓' : '○' }}</span>
        <span>Group by Severity</span>
      </button>
    </div>

    <!-- Severity Filter -->
    <div>
      <h3 class="text-sm font-medium text-gray-900 mb-2">Filter by Severity</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="severity in severities"
          :key="severity"
          @click="$emit('severity-toggle', severity)"
          :class="[
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-all',
            selectedSeverities.has(severity) || selectedSeverities.size === 0
              ? getSeverityColor(severity)
              : 'bg-gray-100 text-gray-400 border-transparent'
          ]"
        >
          <span>{{ selectedSeverities.has(severity) || selectedSeverities.size === 0 ? '✓' : '○' }}</span>
          <span class="capitalize">{{ severity }}</span>
        </button>
      </div>
    </div>

    <!-- Category Filter -->
    <div>
      <h3 class="text-sm font-medium text-gray-900 mb-2">Filter by Category</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in categories"
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
          <span>{{ category.replace(/-/g, ' ') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InsightFilters',

  props: {
    /**
     * Selected severities set
     * @type {Set}
     */
    selectedSeverities: {
      type: Set,
      required: true
    },

    /**
     * Selected categories set
     * @type {Set}
     */
    selectedCategories: {
      type: Set,
      required: true
    },

    /**
     * Whether to group by severity
     * @type {Boolean}
     */
    groupBySeverity: {
      type: Boolean,
      default: true
    }
  },

  emits: ['severity-toggle', 'category-toggle', 'toggle-group-by-severity'],

  setup() {
    const severities = ['critical', 'high', 'medium', 'low'];
    const categories = [
      'duplicates',
      'optimization',
      'unused',
      'over-bundling',
      'compression',
      'architecture'
    ];

    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'critical':
          return 'bg-red-100 text-red-800 border-red-300';
        case 'high':
          return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'medium':
          return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'low':
          return 'bg-blue-100 text-blue-800 border-blue-300';
      }
    };

    const getCategoryIcon = (category) => {
      switch (category) {
        case 'duplicates':
          return '📋';
        case 'optimization':
          return '⚡';
        case 'unused':
          return '🗑️';
        case 'over-bundling':
          return '📦';
        case 'compression':
          return '🗜️';
        case 'architecture':
          return '🏗️';
      }
    };

    return {
      severities,
      categories,
      getSeverityColor,
      getCategoryIcon
    };
  }
};
</script>
