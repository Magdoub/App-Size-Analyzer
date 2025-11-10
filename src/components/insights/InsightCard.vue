<!--
  Insight Card Component
  Displays a single insight with details, affected items, and fix suggestions
-->
<template>
  <div
    :class="[
      getBorderClass(insight.severity),
      'rounded-lg p-4',
      getSeverityColor(insight.severity)
    ]"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-2">
      <div class="flex items-start gap-3 flex-1">
        <span class="text-2xl">{{ getCategoryIcon(insight.category) }}</span>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-lg font-semibold">{{ insight.title }}</h3>
            <span class="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
              {{ insight.category.replace(/-/g, ' ') }}
            </span>
          </div>
          <p class="text-sm mt-1 opacity-90">{{ insight.description }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span
          :class="[
            'px-3 py-1.5 rounded text-xs font-bold uppercase',
            getSeverityBadgeColor(insight.severity),
            (insight.severity === 'critical' || insight.severity === 'high') ? 'text-sm' : ''
          ]"
        >
          {{ insight.severity }}
        </span>
        <button
          @click="isExpanded = !isExpanded"
          class="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
        >
          <svg
            :class="['w-5 h-5 transition-transform', isExpanded ? 'rotate-180' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Expanded Content -->
    <div v-if="isExpanded" class="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
      <!-- Savings -->
      <div v-if="insight.potentialSavings && insight.potentialSavings > 0" class="flex items-center gap-2">
        <span class="text-sm font-medium">💰 Potential Savings:</span>
        <span class="text-sm font-bold">{{ formatBytes(insight.potentialSavings) }}</span>
      </div>

      <!-- Affected Files (Enhanced) -->
      <div v-if="insight.affectedFiles && insight.affectedFiles.length > 0">
        <span class="text-sm font-medium block mb-2">📍 Affected Files ({{ insight.affectedFiles.length }}):</span>
        <div class="max-h-48 overflow-y-auto bg-black bg-opacity-5 rounded p-2">
          <div class="text-xs space-y-2 font-mono">
            <div v-for="(file, idx) in insight.affectedFiles" :key="idx" class="flex flex-col gap-1 p-2 bg-white bg-opacity-50 rounded">
              <div class="flex items-center justify-between gap-2">
                <span class="truncate font-semibold">{{ file.path }}</span>
                <span class="whitespace-nowrap text-blue-700 font-bold">{{ formatBytes(file.size) }}</span>
              </div>
              <div class="flex items-center gap-4 text-xs opacity-75">
                <span v-if="file.type" class="px-1.5 py-0.5 bg-gray-200 rounded">{{ file.type }}</span>
                <span v-if="file.context" class="italic">{{ file.context }}</span>
                <span v-if="file.compressedSize" class="text-green-700">
                  Compressed: {{ formatBytes(file.compressedSize) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legacy Affected Items (fallback) -->
      <div v-else-if="insight.affectedItems && insight.affectedItems.length > 0">
        <span class="text-sm font-medium block mb-2">📍 Affected Items ({{ insight.affectedItems.length }}):</span>
        <div class="max-h-32 overflow-y-auto bg-black bg-opacity-5 rounded p-2">
          <ul class="text-xs space-y-1 font-mono">
            <li v-for="(item, idx) in insight.affectedItems" :key="idx" class="truncate">
              {{ item.path || item }} <span v-if="item.size">({{ formatBytes(item.size) }})</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="insight.recommendation" class="space-y-2">
        <span class="text-sm font-medium block">💡 Recommendation:</span>
        <div class="text-sm opacity-90 bg-black bg-opacity-5 rounded p-3">
          {{ insight.recommendation }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { formatBytes } from '../../utils/formatters';

export default {
  name: 'InsightCard',

  props: {
    /**
     * Insight object
     * @type {Object}
     */
    insight: {
      type: Object,
      required: true
    }
  },

  setup() {
    const isExpanded = ref(false);

    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'critical':
          return 'bg-red-50 border-red-200 text-red-900';
        case 'high':
          return 'bg-orange-50 border-orange-200 text-orange-900';
        case 'medium':
          return 'bg-yellow-50 border-yellow-200 text-yellow-900';
        case 'low':
          return 'bg-blue-50 border-blue-200 text-blue-900';
        default:
          return 'bg-gray-50 border-gray-200 text-gray-900';
      }
    };

    const getSeverityBadgeColor = (severity) => {
      switch (severity) {
        case 'critical':
          return 'bg-red-100 text-red-800';
        case 'high':
          return 'bg-orange-100 text-orange-800';
        case 'medium':
          return 'bg-yellow-100 text-yellow-800';
        case 'low':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getCategoryIcon = (category) => {
      switch (category) {
        case 'duplicates':
          return '📋';
        case 'optimization':
        case 'size-optimization':
          return '⚡';
        case 'unused':
          return '🗑️';
        case 'over-bundling':
          return '📦';
        case 'compression':
          return '🗜️';
        case 'architecture':
          return '🏗️';
        default:
          return '💡';
      }
    };

    const getBorderClass = (severity) => {
      switch (severity) {
        case 'critical':
          return 'border-2';
        case 'high':
          return 'border shadow-md';
        default:
          return 'border';
      }
    };

    return {
      isExpanded,
      getSeverityColor,
      getSeverityBadgeColor,
      getCategoryIcon,
      getBorderClass,
      formatBytes
    };
  }
};
</script>
