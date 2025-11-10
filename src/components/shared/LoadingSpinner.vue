<!--
  LoadingSpinner - Loading indicator component with progress bar
  Displays a spinner, optional message, and progress percentage
-->
<template>
  <div class="flex flex-col items-center justify-center p-8">
    <div :class="sizeClasses" class="relative">
      <div class="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
      <div class="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p v-if="message" class="mt-4 text-sm text-gray-600">{{ message }}</p>
    <div v-if="progress !== null" class="mt-4 w-64">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
        <span>{{ progress.toFixed(0) }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'LoadingSpinner',

  props: {
    /**
     * Loading message
     * @type {String}
     */
    message: {
      type: String,
      default: 'Loading...'
    },

    /**
     * Progress percentage (0-100)
     * @type {Number|null}
     */
    progress: {
      type: Number,
      default: null,
      validator: (p) => p === null || (p >= 0 && p <= 100)
    },

    /**
     * Spinner size (small, medium, large)
     * @type {String}
     */
    size: {
      type: String,
      default: 'medium',
      validator: (s) => ['small', 'medium', 'large'].includes(s)
    }
  },

  setup(props) {
    const sizeClasses = computed(() => {
      const sizes = {
        small: 'w-6 h-6',
        medium: 'w-12 h-12',
        large: 'w-16 h-16'
      };
      return sizes[props.size];
    });

    return {
      sizeClasses
    };
  }
};
</script>
