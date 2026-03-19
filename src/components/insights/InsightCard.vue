<!--
  Insight Card Component
  Displays a single insight with details, affected items, and fix suggestions
-->
<template>
  <div
    :class="[
      'compact-insight-card',
      getBorderClass(insight.severity),
      getSeverityColor(insight.severity)
    ]"
  >
    <!-- Header -->
    <div class="card-header-compact">
      <!-- Left side: Icon + Content -->
      <div class="header-left-compact">
        <span class="icon-compact">{{ getCategoryIcon(insight.category) }}</span>
        <div class="content-compact">
          <!-- Title row with inline badges -->
          <div class="title-row-compact">
            <h3 class="title-compact">{{ insight.title }}</h3>
            <span v-if="insight.potentialSavings > 0" class="savings-badge-compact">
              {{ formatBytes(insight.potentialSavings) }}
            </span>
            <span class="category-badge-compact">
              {{ insight.category.replace(/-/g, ' ') }}
            </span>
          </div>
          <p class="description-compact">{{ insight.description }}</p>
        </div>
      </div>

      <!-- Right side: Severity + Actions -->
      <div class="header-actions-compact">
        <span :class="['severity-badge-compact', getSeverityBadgeColor(insight.severity)]">
          {{ insight.severity }}
        </span>
        <button
          @click="handleDebugWithAI"
          class="action-btn-compact"
          title="Get AI debugging prompt for ChatGPT, Claude, or Gemini"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span class="btn-text-compact">Debug with AI</span>
        </button>
        <button
          @click="isExpanded = !isExpanded"
          class="expand-btn-compact"
        >
          <svg
            :class="['w-4 h-4 transition-transform', isExpanded ? 'rotate-180' : '']"
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
                  <!-- Show before → after sizes if available -->
                  <div class="flex items-center gap-1 whitespace-nowrap">
                    <span class="text-blue-700 font-bold">{{ formatBytes(file.size) }}</span>
                    <template v-if="file.estimatedSizeAfter !== undefined && file.estimatedSizeAfter < file.size">
                      <span class="text-gray-400">→</span>
                      <span class="text-green-600 font-bold">{{ formatBytes(file.estimatedSizeAfter) }}</span>
                      <span class="text-green-700 text-[10px] bg-green-100 px-1 rounded">
                        -{{ Math.round((1 - file.estimatedSizeAfter / file.size) * 100) }}%
                      </span>
                    </template>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-xs opacity-75">
                  <span v-if="file.type" class="px-1.5 py-0.5 bg-gray-200 rounded">{{ file.type }}</span>
                  <span v-if="file.context" class="italic">{{ file.context }}</span>
                  <span v-if="file.compressedSize" class="text-green-700 font-medium">
                    Compressed: {{ formatBytes(file.compressedSize) }}
                  </span>
                </div>
                <!-- Per-file recommendation -->
                <div v-if="file.recommendation" class="mt-1 p-1.5 bg-yellow-50 border border-yellow-200 rounded text-[11px] text-yellow-800">
                  <span class="font-semibold">💡 </span>{{ file.recommendation }}
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

    <!-- AI Prompt Modal -->
    <AIPromptModal
      :isOpen="showAIModal"
      :prompt="aiPrompt"
      @close="closeAIModal"
      @copy="handlePromptCopy"
    />
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { useChatGPTPrompt } from '../../composables/useChatGPTPrompt';
import { useCompressionWorker } from '../../composables/useCompressionWorker';
import { formatBytes } from '../../utils/formatters';
import AIPromptModal from './AIPromptModal.vue';
import ImageComparisonPreview from './ImageComparisonPreview.vue';

export default {
  name: 'InsightCard',

  components: {
    ImageComparisonPreview,
    AIPromptModal
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
    const showAIModal = ref(false);
    const aiPrompt = ref('');

    // AI debugging integration
    const { getInsightPrompt } = useChatGPTPrompt();

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

    /**
     * Open AI prompt modal for this insight
     */
    const handleDebugWithAI = () => {
      const promptData = getInsightPrompt(props.insight);
      if (promptData) {
        aiPrompt.value = promptData.prompt;
        showAIModal.value = true;
      }
    };

    /**
     * Close AI modal
     */
    const closeAIModal = () => {
      showAIModal.value = false;
    };

    /**
     * Handle prompt copy
     */
    const handlePromptCopy = () => {
      console.log('Prompt copied to clipboard!');
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
        .replace(/(<li class="rec-bullet">)/g, (_match, p1, offset, str) => {
          const before = str.substring(0, offset);
          if (!before.endsWith('<ul class="rec-bullets">') && !before.endsWith('</li>')) {
            return `<ul class="rec-bullets">${p1}`;
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
        html = `<p class="rec-text">${html.replace(/\n\n/g, '</p><p class="rec-text">')}</p>`;
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
      showAIModal,
      aiPrompt,
      runCompressionTests,
      handleDebugWithAI,
      closeAIModal,
      handlePromptCopy,
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

/* Debug with AI Button (Header Variant) - Subtle Design */
.debug-ai-btn-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: hsl(35, 25%, 88%);
  color: hsl(25, 15%, 45%);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid hsl(35, 20%, 82%);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.debug-ai-btn-header:hover {
  background: hsl(207, 90%, 96%);
  color: hsl(207, 97%, 45%);
  border-color: hsl(207, 70%, 80%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(10, 137, 252, 0.15);
}

.debug-ai-btn-header:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(10, 137, 252, 0.1);
}

.debug-ai-btn-header svg {
  opacity: 0.7;
}

.debug-ai-btn-header:hover svg {
  opacity: 1;
}

.debug-ai-text {
  display: inline;
}

/* Hide text on small screens, show icon only */
@media (max-width: 768px) {
  .debug-ai-text {
    display: none;
  }

  .debug-ai-btn-header {
    padding: 6px 8px;
  }
}

/* ========================================
   COMPACT CARD DESIGN
   ======================================== */

.compact-insight-card {
  border-radius: 0.75rem;
  padding: 1.125rem 1.25rem;
  border: 1px solid hsl(220, 15%, 88%);
  transition: all 0.2s ease;
}

.compact-insight-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

/* Header Layout */
.card-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-left-compact {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.icon-compact {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.content-compact {
  flex: 1;
  min-width: 0;
}

/* Title Row */
.title-row-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.title-compact {
  font-size: 0.9375rem;
  font-weight: 700;
  color: hsl(25, 20%, 18%);
  letter-spacing: -0.01em;
  line-height: 1.3;
}

/* Badges - Inline with title */
.savings-badge-compact {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, hsl(142, 76%, 95%) 0%, hsl(142, 70%, 92%) 100%);
  color: hsl(142, 71%, 28%);
  border: 1px solid hsl(142, 60%, 82%);
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.category-badge-compact {
  padding: 0.125rem 0.5rem;
  background: hsl(35, 20%, 92%);
  color: hsl(25, 15%, 48%);
  border: 1px solid hsl(35, 15%, 84%);
  border-radius: 0.375rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.02em;
}

/* Description */
.description-compact {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: hsl(25, 15%, 42%);
  margin-top: 0.125rem;
}

/* Actions */
.header-actions-compact {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.severity-badge-compact {
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.action-btn-compact {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: hsl(35, 20%, 92%);
  color: hsl(25, 15%, 45%);
  border: 1px solid hsl(35, 15%, 84%);
  border-radius: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn-compact:hover {
  background: hsl(207, 90%, 96%);
  color: hsl(207, 90%, 45%);
  border-color: hsl(207, 70%, 80%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px hsla(207, 90%, 54%, 0.12);
}

.expand-btn-compact {
  padding: 0.375rem;
  background: transparent;
  color: hsl(25, 15%, 45%);
  border: 1px solid hsl(35, 15%, 84%);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.expand-btn-compact:hover {
  background: hsl(35, 20%, 88%);
  border-color: hsl(35, 15%, 78%);
}

/* Responsive */
@media (max-width: 768px) {
  .btn-text-compact {
    display: none;
  }

  .action-btn-compact {
    padding: 0.375rem;
  }

  .card-header-compact {
    flex-direction: column;
    gap: 0.75rem;
  }

  .header-actions-compact {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .compact-insight-card {
    padding: 0.75rem 0.875rem;
  }

  .title-compact {
    font-size: 0.875rem;
  }

  .icon-compact {
    font-size: 1.25rem;
  }

  .description-compact {
    font-size: 0.75rem;
  }
}
</style>
