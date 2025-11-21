<template>
  <div class="image-comparison-preview">
    <div class="comparison-grid">
      <!-- Original Image -->
      <div class="image-panel">
        <div class="image-header">
          <h4>Original</h4>
          <span class="format-badge">{{ originalFormat }}</span>
        </div>
        <div class="image-container">
          <img
            v-if="previewUrls && previewUrls.original"
            :src="previewUrls.original"
            :alt="fileName + ' (original)'"
            class="preview-image"
          />
          <div v-else class="placeholder">
            <span>No preview available</span>
          </div>
        </div>
        <div class="image-footer">
          <span class="size-label">{{ formatBytes(originalSize) }}</span>
        </div>
      </div>

      <!-- Compressed Image -->
      <div class="image-panel">
        <div class="image-header">
          <h4>Optimized</h4>
          <span class="format-badge optimized">{{ compressedFormat }}</span>
        </div>
        <div class="image-container">
          <img
            v-if="previewUrls && previewUrls.compressed"
            :src="previewUrls.compressed"
            :alt="fileName + ' (optimized)'"
            class="preview-image"
          />
          <div v-else class="placeholder">
            <span>No preview available</span>
          </div>
        </div>
        <div class="image-footer">
          <span class="size-label">{{ formatBytes(compressedSize) }}</span>
          <span class="savings-badge">-{{ reductionPercent.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- Savings Summary -->
    <div class="savings-summary">
      <div class="savings-item">
        <span class="label">Size Reduction:</span>
        <span class="value">{{ formatBytes(savings) }} ({{ reductionPercent.toFixed(1) }}%)</span>
      </div>
      <div v-if="testDuration" class="savings-item">
        <span class="label">Test Duration:</span>
        <span class="value">{{ testDuration }}ms</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue';

/**
 * @typedef {Object} ImageComparisonPreviewProps
 * @property {string} fileName - Image file name
 * @property {string} originalFormat - Original image format (png, jpeg, webp)
 * @property {number} originalSize - Original file size in bytes
 * @property {string} compressedFormat - Compressed format
 * @property {number} compressedSize - Compressed file size in bytes
 * @property {number} savings - Bytes saved
 * @property {number} reductionPercent - Percentage reduction
 * @property {Object} [previewUrls] - Preview URLs
 * @property {string} [previewUrls.original] - Original image blob URL
 * @property {string} [previewUrls.compressed] - Compressed image blob URL
 * @property {number} [testDuration] - Test duration in milliseconds
 * @property {Function} [onCleanup] - Cleanup callback for revoking URLs
 */

const props = defineProps({
  fileName: {
    type: String,
    required: true
  },
  originalFormat: {
    type: String,
    required: true
  },
  originalSize: {
    type: Number,
    required: true
  },
  compressedFormat: {
    type: String,
    required: true
  },
  compressedSize: {
    type: Number,
    required: true
  },
  savings: {
    type: Number,
    required: true
  },
  reductionPercent: {
    type: Number,
    required: true
  },
  previewUrls: {
    type: Object,
    default: null
  },
  testDuration: {
    type: Number,
    default: null
  },
  onCleanup: {
    type: Function,
    default: null
  }
});

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// Clean up object URLs on component unmount to prevent memory leaks
onUnmounted(() => {
  if (props.previewUrls) {
    if (props.previewUrls.original) {
      URL.revokeObjectURL(props.previewUrls.original);
    }
    if (props.previewUrls.compressed) {
      URL.revokeObjectURL(props.previewUrls.compressed);
    }
  }

  // Call custom cleanup callback if provided
  if (props.onCleanup) {
    props.onCleanup();
  }
});
</script>

<style scoped>
.image-comparison-preview {
  background: var(--color-background-soft, #f5f5f5);
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.image-panel {
  background: white;
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 6px;
  overflow: hidden;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--color-background-mute, #fafafa);
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.image-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #333);
}

.format-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--color-background, #e0e0e0);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--color-text-muted, #666);
}

.format-badge.optimized {
  background: #e8f5e9;
  color: #2e7d32;
}

.image-container {
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-text-muted, #999);
  font-size: 0.875rem;
}

.image-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--color-background-mute, #fafafa);
  border-top: 1px solid var(--color-border, #e0e0e0);
}

.size-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #333);
}

.savings-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.savings-summary {
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 6px;
}

.savings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.savings-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border-soft, #f0f0f0);
}

.savings-item .label {
  font-size: 0.875rem;
  color: var(--color-text-muted, #666);
}

.savings-item .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #333);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .image-container {
    min-height: 150px;
  }

  .preview-image {
    max-height: 200px;
  }
}
</style>
