<!--
  Severity Section Component
  Renders a group of insights under a severity level header
-->
<template>
  <div v-if="insights.length > 0" class="mb-6">
    <!-- Sticky Section Header -->
    <div
      :class="[
        'sticky top-0 z-10 px-4 py-2 border-b-2 font-semibold text-sm flex items-center justify-between',
        getSeverityHeaderColor(severity)
      ]"
    >
      <span>{{ getSeverityLabel(severity) }}</span>
      <span class="text-xs opacity-75">({{ insights.length }} insights)</span>
    </div>

    <!-- Insights in this severity group -->
    <div class="space-y-4 mt-4">
      <InsightCard
        v-for="(insight, index) in insights"
        :key="`${insight.ruleId}-${index}`"
        :insight="insight"
      />
    </div>
  </div>
</template>

<script>
import InsightCard from './InsightCard.vue';

export default {
  name: 'SeveritySection',

  components: {
    InsightCard
  },

  props: {
    /**
     * Severity level
     * @type {String}
     */
    severity: {
      type: String,
      required: true,
      validator: (val) => ['critical', 'high', 'medium', 'low'].includes(val)
    },

    /**
     * Insights for this severity level
     * @type {Array}
     */
    insights: {
      type: Array,
      required: true
    }
  },

  setup() {
    const getSeverityLabel = (severity) => {
      switch (severity) {
        case 'critical':
          return '🔴 Critical Issues';
        case 'high':
          return '🟠 High Priority';
        case 'medium':
          return '🟡 Medium Priority';
        case 'low':
          return '🔵 Low Priority';
      }
    };

    const getSeverityHeaderColor = (severity) => {
      switch (severity) {
        case 'critical':
          return 'bg-red-100 border-red-300 text-red-900';
        case 'high':
          return 'bg-orange-100 border-orange-300 text-orange-900';
        case 'medium':
          return 'bg-yellow-100 border-yellow-300 text-yellow-900';
        case 'low':
          return 'bg-blue-100 border-blue-300 text-blue-900';
      }
    };

    return {
      getSeverityLabel,
      getSeverityHeaderColor
    };
  }
};
</script>
