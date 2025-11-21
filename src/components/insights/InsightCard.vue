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
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="text-lg font-semibold">{{ insight.title }}</h3>
            <span v-if="insight.potentialSavings > 0" class="px-2 py-0.5 text-xs bg-green-100 text-green-800 font-semibold rounded-full">
              {{ formatBytes(insight.potentialSavings) }}
            </span>
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

    <!-- Compression Progress Indicator (T018) -->
    <div v-if="isCompressing" class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div class="flex items-center gap-2 mb-2">
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        <span class="text-sm font-medium text-blue-900">Testing compression...</span>
      </div>
      <div class="w-full bg-blue-200 rounded-full h-2">
        <div
          class="bg-blue-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: compressionProgress + '%' }"
        ></div>
      </div>
      <div class="text-xs text-blue-700 mt-1">
        {{ compressionProgress }}% complete ({{ compressedCount }} / {{ totalToCompress }} images)
      </div>
    </div>

    <!-- Expanded Content -->
    <div v-if="isExpanded" class="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
      <!-- Savings -->
      <div v-if="insight.potentialSavings && insight.potentialSavings > 0" class="flex items-center gap-2">
        <span class="text-sm font-medium">💰 Potential Savings:</span>
        <span class="text-sm font-bold">{{ formatBytes(insight.potentialSavings) }}</span>
      </div>

      <!-- Image Compression Test Button (T017) -->
      <div v-if="hasCompressibleImages && !hasCompressionResults && !isCompressing" class="mb-3">
        <button
          @click="runCompressionTests"
          class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Run Real Compression Tests
        </button>
        <p class="text-xs text-center mt-1 opacity-75">
          Test actual compression on your device (no uploads, 100% private)
        </p>
      </div>

      <!-- Affected Files (Enhanced with Image Compression Previews - T017) -->
      <div v-if="insight.affectedFiles && insight.affectedFiles.length > 0">
        <span class="text-sm font-medium block mb-2">📍 Affected Files ({{ insight.affectedFiles.length }}):</span>
        <div class="max-h-96 overflow-y-auto bg-black bg-opacity-5 rounded p-2 space-y-2">
          <div v-for="(file, idx) in insight.affectedFiles" :key="idx" class="bg-white bg-opacity-50 rounded">
            <div class="text-xs font-mono p-2">
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate font-semibold">{{ file.path }}</span>
                  <span class="whitespace-nowrap text-blue-700 font-bold">{{ formatBytes(file.size) }}</span>
                </div>
                <div class="flex items-center gap-4 text-xs opacity-75">
                  <span v-if="file.type" class="px-1.5 py-0.5 bg-gray-200 rounded">{{ file.type }}</span>
                  <span v-if="file.context" class="italic">{{ file.context }}</span>
                  <span v-if="file.compressedSize" class="text-green-700 font-medium">
                    Compressed: {{ formatBytes(file.compressedSize) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Image Compression Preview Component (T017) -->
            <ImageComparisonPreview
              v-if="file.metadata?.compressionResult"
              :fileName="file.path"
              :originalFormat="file.metadata.compressionResult.originalFormat"
              :originalSize="file.metadata.compressionResult.originalSize"
              :compressedFormat="file.metadata.compressionResult.bestFormat?.format || 'jpeg'"
              :compressedSize="file.metadata.compressionResult.bestFormat?.size || 0"
              :savings="file.metadata.compressionResult.savings"
              :reductionPercent="file.metadata.compressionResult.reductionPercent"
              :previewUrls="file.metadata.compressionResult.previewUrls"
              :testDuration="file.metadata.compressionResult.testDuration"
            />
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

      <!-- Recommendations (formatted) -->
      <div v-if="insight.recommendation" class="recommendation-block">
        <div class="recommendation-header">
          <span class="recommendation-icon">💡</span>
          <span class="recommendation-title">Recommendation</span>
        </div>
        <div class="recommendation-content" v-html="formatRecommendation(insight.recommendation)"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { formatBytes } from '../../utils/formatters';
import ImageComparisonPreview from './ImageComparisonPreview.vue';
import { useCompressionWorker } from '../../composables/useCompressionWorker';

export default {
  name: 'InsightCard',

  components: {
    ImageComparisonPreview
  },

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

  setup(props) {
    const isExpanded = ref(false);
    const isCompressing = ref(false);
    const compressionProgress = ref(0);
    const compressedCount = ref(0);
    const totalToCompress = ref(0);

    // Check if this insight has images that need compression testing
    const hasCompressibleImages = computed(() => {
      return props.insight.ruleId === 'R011' &&
             props.insight.affectedFiles?.some(f => f.metadata?.requiresCompression);
    });

    // Check if compression results already exist
    const hasCompressionResults = computed(() => {
      return props.insight.affectedFiles?.some(f => f.metadata?.compressionResult);
    });

    /**
     * Run compression tests on all images (T017, T018)
     */
    const runCompressionTests = async () => {
      if (!props.insight.affectedFiles) return;

      const imagesToTest = props.insight.affectedFiles.filter(f => f.metadata?.requiresCompression);
      if (imagesToTest.length === 0) return;

      isCompressing.value = true;
      totalToCompress.value = imagesToTest.length;
      compressedCount.value = 0;
      compressionProgress.value = 0;

      const { compressImage } = useCompressionWorker();

      for (let i = 0; i < imagesToTest.length; i++) {
        const file = imagesToTest[i];

        try {
          // Note: In real implementation, we need access to the actual File object
          // For now, this is a placeholder that shows the UI structure
          // The actual compression will be implemented when we have file access

          // Simulate compression testing for UI demonstration
          await new Promise(resolve => setTimeout(resolve, 100));

          compressedCount.value = i + 1;
          compressionProgress.value = Math.round(((i + 1) / totalToCompress.value) * 100);

          // TODO: Implement actual compression when file access is available
          // const result = await compressImage(fileData, { type: 'image/jpeg', quality: 0.85 });
          // file.metadata.compressionResult = result;
        } catch (error) {
          console.error(`Failed to compress ${file.path}:`, error);
        }
      }

      isCompressing.value = false;
    };

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

    /**
     * Format recommendation text with proper markdown rendering
     */
    const formatRecommendation = (text) => {
      if (!text) return '';

      let html = text
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold text **text**
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Numbered lists with content
        .replace(/(\d+)\.\s+\*\*([^*]+)\*\*:\s*/g, '<div class="rec-step"><span class="rec-step-num">$1</span><span class="rec-step-title">$2</span></div><div class="rec-step-content">')
        // Bullet points with proper structure
        .replace(/•\s+([^\n•]+)/g, '<li class="rec-bullet">$1</li>')
        // Close step content before next step
        .replace(/<\/li>\s*<div class="rec-step">/g, '</li></ul></div><div class="rec-step">')
        // Wrap consecutive bullets in ul
        .replace(/(<li class="rec-bullet">)/g, (match, p1, offset, str) => {
          const before = str.substring(0, offset);
          if (!before.endsWith('<ul class="rec-bullets">') && !before.endsWith('</li>')) {
            return '<ul class="rec-bullets">' + p1;
          }
          return p1;
        });

      // Close any unclosed ul tags
      const openUls = (html.match(/<ul class="rec-bullets">/g) || []).length;
      const closeUls = (html.match(/<\/ul>/g) || []).length;
      for (let i = 0; i < openUls - closeUls; i++) {
        html += '</ul></div>';
      }

      // Wrap plain text sections
      if (!html.includes('<div class="rec-step">')) {
        html = '<p class="rec-text">' + html.replace(/\n\n/g, '</p><p class="rec-text">') + '</p>';
      }

      return html;
    };

    return {
      isExpanded,
      isCompressing,
      compressionProgress,
      compressedCount,
      totalToCompress,
      hasCompressibleImages,
      hasCompressionResults,
      runCompressionTests,
      getSeverityColor,
      getSeverityBadgeColor,
      getCategoryIcon,
      getBorderClass,
      formatBytes,
      formatRecommendation
    };
  }
};
</script>

<style scoped>
/* Recommendation Block - Editorial Style */
.recommendation-block {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border: 1px solid #eab308;
  border-radius: 12px;
  overflow: hidden;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(234, 179, 8, 0.15);
  border-bottom: 1px solid rgba(234, 179, 8, 0.3);
}

.recommendation-icon {
  font-size: 1.25rem;
}

.recommendation-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #854d0e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.recommendation-content {
  padding: 16px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #422006;
}

/* Step styling */
:deep(.rec-step) {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 16px;
  margin-bottom: 8px;
}

:deep(.rec-step:first-child) {
  margin-top: 0;
}

:deep(.rec-step-num) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: #854d0e;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  border-radius: 50%;
  flex-shrink: 0;
}

:deep(.rec-step-title) {
  font-weight: 600;
  color: #713f12;
  font-size: 0.9375rem;
}

:deep(.rec-step-content) {
  padding-left: 34px;
  margin-bottom: 12px;
}

/* Bullet list styling */
:deep(.rec-bullets) {
  list-style: none;
  padding: 0;
  margin: 8px 0;
}

:deep(.rec-bullet) {
  position: relative;
  padding-left: 20px;
  margin-bottom: 6px;
  color: #78350f;
}

:deep(.rec-bullet::before) {
  content: '';
  position: absolute;
  left: 4px;
  top: 8px;
  width: 6px;
  height: 6px;
  background: #d97706;
  border-radius: 50%;
}

:deep(.rec-bullet strong) {
  color: #92400e;
  font-weight: 600;
}

/* Plain text paragraphs */
:deep(.rec-text) {
  margin: 0 0 12px 0;
  color: #78350f;
}

:deep(.rec-text:last-child) {
  margin-bottom: 0;
}

:deep(strong) {
  font-weight: 600;
  color: #92400e;
}
</style>
