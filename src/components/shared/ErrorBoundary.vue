<!--
  ErrorBoundary - Vue error boundary for graceful error handling
  Catches errors in child components and displays fallback UI
-->
<template>
  <div v-if="error" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
        <svg
          class="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div class="mt-4 text-center">
        <h3 class="text-lg font-medium text-gray-900">Something went wrong</h3>
        <p class="mt-2 text-sm text-gray-500">
          {{ error.message || fallbackMessage }}
        </p>
        <button
          v-if="showRetry"
          @click="handleRetry"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reload page
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script>
import { ref, onErrorCaptured } from 'vue';

export default {
  name: 'ErrorBoundary',

  props: {
    /**
     * Fallback message when error occurs
     * @type {String}
     */
    fallbackMessage: {
      type: String,
      default: 'Something went wrong. Please try again.'
    },

    /**
     * Whether to show retry button
     * @type {Boolean}
     */
    showRetry: {
      type: Boolean,
      default: true
    }
  },

  emits: ['error', 'retry'],

  setup(props, { emit }) {
    const error = ref(null);

    onErrorCaptured((err, instance, info) => {
      error.value = err;
      emit('error', { error: err, info });
      console.error('ErrorBoundary caught an error:', err, info);
      return false; // Stop error propagation
    });

    const handleRetry = () => {
      error.value = null;
      emit('retry');
      window.location.reload();
    };

    return {
      error,
      handleRetry
    };
  }
};
</script>
