<template>
  <div class="sample-file-gallery">
    <!-- Empty state - no sample files found -->
    <div
      v-if="sampleFiles.length === 0"
      class="text-center py-8 text-gray-500"
    >
      <p class="text-sm">No sample files available</p>
      <p class="text-xs mt-2">Add .ipa, .apk or .aab files to the sample-files/ directory</p>
    </div>

    <!-- Sample file cards grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <button
        v-for="file in sampleFiles"
        :key="file.url"
        :data-testid="`sample-file-card-${file.name}`"
        class="sample-file-card group"
        :class="{
          'sample-file-card--loading': isLoading && loadingFileName === file.name,
          'sample-file-card--disabled': disabled || (isLoading && loadingFileName !== file.name),
        }"
        :disabled="disabled || isLoading"
        :aria-label="`Load ${file.displayName} sample file`"
        @click="handleCardClick(file)"
      >
        <!-- Platform + Format badge -->
        <div
          class="platform-badge"
          :class="{
            'platform-badge--ios': file.platform === 'iOS',
            'platform-badge--android': file.platform === 'Android',
          }"
        >
          {{ file.platform }} · {{ file.formatLabel }}
        </div>

        <!-- File info -->
        <div class="file-info">
          <h3 class="file-name">{{ file.displayName }}</h3>
          <p class="file-size">
            <!-- Show spinner if size is being fetched -->
            <span v-if="file.size === null" class="size-skeleton">Loading size...</span>
            <span v-else>{{ file.sizeFormatted }}</span>
          </p>
        </div>

        <!-- Loading spinner overlay -->
        <div
          v-if="isLoading && loadingFileName === file.name"
          class="loading-overlay"
        >
          <div class="loading-spinner" />
          <span class="loading-text">Uploading...</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script>
import { useSampleFiles } from '../../composables/useSampleFiles';

export default {
  name: 'SampleFileGallery',

  props: {
    /**
     * Whether the gallery is disabled (e.g., during file upload)
     */
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  emits: [
    /**
     * Emitted when a sample file is selected and loaded
     * @param {File} file - The loaded File object
     */
    'file-selected',

    /**
     * Emitted when an error occurs during sample file loading
     * @param {Error} error - The error that occurred
     */
    'loading-error',
  ],

  setup(props, { emit, expose }) {
    // Use sample files composable
    const {
      sampleFiles,
      isLoading,
      loadingFileName,
      error,
      loadSampleFile,
      cancelCurrentLoad,
    } = useSampleFiles();

    /**
     * Handle sample file card click
     * @param {SampleFileMetadata} file - The file metadata
     */
    const handleCardClick = async (file) => {
      if (props.disabled || isLoading.value) {
        return; // Don't process click if disabled or already loading
      }

      try {
        const loadedFile = await loadSampleFile(file.url, file.name);

        // Emit file-selected event if load was successful and not aborted
        if (loadedFile) {
          emit('file-selected', loadedFile);
        }
      } catch (err) {
        // Emit loading-error event
        emit('loading-error', err);
      }
    };

    // Expose cancelCurrentLoad method for parent component
    expose({
      cancelCurrentLoad,
    });

    return {
      sampleFiles,
      isLoading,
      loadingFileName,
      error,
      handleCardClick,
    };
  },
};
</script>

<style scoped>
.sample-file-gallery {
  width: 100%;
}

/* Sample file card styles */
.sample-file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sample-file-card:hover:not(.sample-file-card--disabled) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.sample-file-card:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.sample-file-card--loading {
  border-color: #3b82f6;
  cursor: wait;
}

.sample-file-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sample-file-card--disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Platform badge */
.platform-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.platform-badge--ios {
  background-color: #dbeafe;
  color: #1e40af;
}

.platform-badge--android {
  background-color: #d1fae5;
  color: #065f46;
}

/* File info */
.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.5;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.size-skeleton {
  display: inline-block;
  color: #9ca3af;
  font-style: italic;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 0.5rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #3b82f6;
}

/* Responsive styles for mobile */
@media (max-width: 640px) {
  .sample-file-gallery {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .sample-file-card {
    min-width: 280px;
    padding: 1.25rem;
  }

  .file-name {
    font-size: 0.9375rem;
  }

  .file-size {
    font-size: 0.8125rem;
  }
}

/* Touch-friendly tap targets on mobile */
@media (hover: none) and (pointer: coarse) {
  .sample-file-card {
    min-height: 120px;
    padding: 1.5rem;
  }
}
</style>
