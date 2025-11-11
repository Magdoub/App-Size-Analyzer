/**
 * Composables API Contract
 *
 * Defines the interface for Vue composables used in the migration.
 * These composables wrap Web Workers and provide reactive state to components.
 *
 * Feature: 009-vue-migration-completion
 * Date: 2025-11-11
 */

import { Ref, ComputedRef } from 'vue';

/**
 * @typedef {Object} ParserWorkerComposable
 * @property {Ref<number>} progress - Reactive progress percentage (0-100)
 * @property {Ref<string>} status - Reactive status message
 * @property {Ref<'idle'|'parsing'|'success'|'error'>} state - Parsing state
 * @property {Ref<Error|null>} error - Error object if parsing failed
 * @property {ComputedRef<boolean>} isParsing - True if currently parsing
 * @property {ComputedRef<boolean>} isComplete - True if parsing succeeded
 * @property {function(File): Promise<ParseResult>} parseFile - Parse file method
 * @property {function(): void} cancel - Cancel parsing operation
 * @property {function(): void} reset - Reset state to idle
 */

/**
 * useParserWorker Composable
 *
 * Wraps the parser Web Worker with reactive Vue state.
 * Manages worker lifecycle, progress tracking, and error handling.
 *
 * Location: src/composables/useParserWorker.js
 *
 * @returns {ParserWorkerComposable}
 *
 * @example
 * // In UploadZone.vue
 * import { useParserWorker } from '@/composables/useParserWorker';
 * import { useAppStore } from '@/stores/appStore';
 * import { useAnalysisStore } from '@/stores/analysisStore';
 *
 * const { progress, status, state, error, parseFile, cancel } = useParserWorker();
 * const appStore = useAppStore();
 * const analysisStore = useAnalysisStore();
 *
 * async function handleFileSelected(file) {
 *   try {
 *     // Update app store with file info
 *     appStore.setCurrentFile(file);
 *
 *     // Parse file (worker runs in background)
 *     const result = await parseFile(file);
 *
 *     // Update analysis store with results
 *     analysisStore.setAnalysisResult(result);
 *     analysisStore.calculateSummary();
 *
 *     // Run insight engine
 *     const insights = generateInsights(result);
 *     analysisStore.setInsights(insights);
 *
 *   } catch (err) {
 *     appStore.setParsingError(err.message);
 *   }
 * }
 *
 * // Watch progress for UI updates
 * watch(progress, (value) => {
 *   appStore.updateParsingStatus({ progress: value, message: status.value });
 * });
 *
 * // Cancel on component unmount or user action
 * function handleCancel() {
 *   cancel();
 *   appStore.updateParsingStatus({ state: 'idle', progress: 0 });
 * }
 */
export function useParserWorker() {
  // Implementation details in research.md
  return {
    progress: null, // ref<number>
    status: null, // ref<string>
    state: null, // ref<'idle'|'parsing'|'success'|'error'>
    error: null, // ref<Error|null>
    isParsing: null, // computed<boolean>
    isComplete: null, // computed<boolean>
    parseFile: async (file) => {}, // Promise<ParseResult>
    cancel: () => {},
    reset: () => {},
  };
}

/**
 * Implementation Requirements:
 *
 * 1. Worker Creation:
 *    - Create worker on first parseFile() call (lazy initialization)
 *    - Wrap with Comlink.wrap()
 *    - Store worker reference for cancellation and cleanup
 *
 * 2. Reactive State:
 *    - Use ref() for progress, status, state, error
 *    - Use computed() for isParsing, isComplete
 *    - All state lives on main thread (not in worker)
 *
 * 3. Progress Tracking:
 *    - Pass Comlink.proxy() callback to worker methods
 *    - Callback updates progress.value and status.value
 *    - Updates trigger Vue reactivity automatically
 *
 * 4. Error Handling:
 *    - Catch worker errors and set error.value
 *    - Set state.value = 'error'
 *    - Preserve error message for UI display
 *
 * 5. Lifecycle Management:
 *    - Terminate worker in onUnmounted() hook
 *    - Clear all refs on reset()
 *    - Allow multiple parseFile() calls (new worker each time)
 *
 * 6. Timeout Handling:
 *    - Calculate dynamic timeout based on file size
 *    - Use Promise.race() with timeout promise
 *    - Cancel worker and throw timeout error
 *
 * 7. Cancellation:
 *    - Call worker.cancel() to set internal flag
 *    - Worker throws error at next checkpoint
 *    - Catch error and update state accordingly
 */

/**
 * State Transition Diagram:
 *
 * idle
 *   ↓ (parseFile called)
 * parsing
 *   ↓ (worker completes)
 * success
 *   ↓ (reset called)
 * idle
 *
 * OR
 *
 * parsing
 *   ↓ (worker throws error or timeout)
 * error
 *   ↓ (reset called)
 * idle
 */

/**
 * Computed Properties:
 */
export const computedExamples = {
  /**
   * isParsing - True if parsing is in progress
   * @example
   * const isParsing = computed(() => state.value === 'parsing');
   */
  isParsing: `computed(() => state.value === 'parsing')`,

  /**
   * isComplete - True if parsing succeeded
   * @example
   * const isComplete = computed(() => state.value === 'success');
   */
  isComplete: `computed(() => state.value === 'success')`,

  /**
   * hasError - True if parsing failed
   * @example
   * const hasError = computed(() => state.value === 'error');
   */
  hasError: `computed(() => state.value === 'error')`,

  /**
   * progressPercentage - Formatted progress string
   * @example
   * const progressPercentage = computed(() => `${progress.value}%`);
   */
  progressPercentage: `computed(() => \`\${progress.value}%\`)`,
};

/**
 * Integration with Pinia Stores:
 *
 * The composable should NOT directly update Pinia stores.
 * Components using the composable are responsible for:
 * 1. Calling parseFile() and awaiting result
 * 2. Updating appStore with parsing status
 * 3. Updating analysisStore with results
 * 4. Handling errors and updating UI accordingly
 *
 * This separation ensures:
 * - Composable remains reusable (no store coupling)
 * - Clear data flow (component orchestrates stores)
 * - Easier testing (can test composable without stores)
 */

/**
 * Example Component Usage:
 */
export const componentUsageExample = `
<script setup>
import { ref, watch } from 'vue';
import { useParserWorker } from '@/composables/useParserWorker';
import { useAppStore } from '@/stores/appStore';
import { useAnalysisStore } from '@/stores/analysisStore';
import { generateInsights } from '@/lib/analysis/insight-engine';

const appStore = useAppStore();
const analysisStore = useAnalysisStore();
const { progress, status, state, error, parseFile, cancel } = useParserWorker();

// Watch progress for store updates
watch(progress, (value) => {
  appStore.updateParsingStatus({
    state: state.value,
    progress: value,
    message: status.value
  });
});

// Watch errors
watch(error, (err) => {
  if (err) {
    appStore.setParsingError(err.message);
  }
});

async function handleFileUpload(file) {
  try {
    // Validate file
    appStore.setCurrentFile(file);
    const errors = validateFile(file);
    if (errors.length > 0) {
      appStore.addValidationError(errors[0]);
      return;
    }

    // Parse file (composable handles worker)
    const result = await parseFile(file);

    // Update stores with results
    analysisStore.setAnalysisResult(result);
    analysisStore.calculateSummary();

    // Generate insights
    const insights = generateInsights(result);
    analysisStore.setInsights(insights);

    // Success!
    appStore.updateParsingStatus({ state: 'success', progress: 100 });

  } catch (err) {
    // Error handled by composable, just update UI
    console.error('Parsing failed:', err);
  }
}

function handleCancel() {
  cancel();
  appStore.updateParsingStatus({ state: 'idle', progress: 0 });
}
</script>

<template>
  <div>
    <input type="file" @change="handleFileUpload($event.target.files[0])" />

    <div v-if="state === 'parsing'" class="loading">
      <progress :value="progress" max="100"></progress>
      <p>{{ status }}</p>
      <button @click="handleCancel">Cancel</button>
    </div>

    <div v-if="error" class="error">
      <p>{{ error.message }}</p>
    </div>
  </div>
</template>
`;

/**
 * Testing Strategy:
 *
 * 1. Unit Tests (composable in isolation):
 *    - Mock Worker with vi.mock()
 *    - Test state transitions
 *    - Test progress updates
 *    - Test error handling
 *    - Test cancellation
 *
 * 2. Component Tests (with composable):
 *    - Mount component with mocked worker
 *    - Simulate file upload
 *    - Verify progress updates in UI
 *    - Verify error display
 *    - Verify cancellation
 *
 * 3. Integration Tests (full flow):
 *    - Use real worker (or worker simulator)
 *    - Test upload → parse → store update flow
 *    - Verify all stores updated correctly
 *    - Verify UI reflects final state
 */

/**
 * Performance Considerations:
 *
 * 1. Worker Reuse vs Recreation:
 *    - Current design: Create new worker per file
 *    - Alternative: Keep worker alive for multiple files
 *    - Decision: Recreate (simpler, no state leakage)
 *
 * 2. Progress Update Throttling:
 *    - Worker may send many progress updates
 *    - Consider throttling to max 10 updates/sec
 *    - Use lodash.throttle or custom throttle
 *
 * 3. Memory Management:
 *    - Worker terminates after parsing (memory freed)
 *    - Clear refs on reset() to prevent memory leaks
 *    - Use onUnmounted() for cleanup
 */

/**
 * Error Messages:
 */
export const errorMessages = {
  INVALID_FILE_TYPE: 'Unsupported file type. Please upload .ipa, .apk, .xapk, or .aab',
  PARSE_FAILED: 'Failed to parse file. The file may be corrupted.',
  TIMEOUT: 'File took too long to parse. The file may be too complex or corrupted.',
  CANCELLED: 'Parsing cancelled by user.',
  WORKER_ERROR: 'An unexpected error occurred during parsing.',
};
