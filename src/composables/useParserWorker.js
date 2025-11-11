/**
 * useParserWorker Composable
 *
 * Wraps the parser Web Worker with Vue reactivity and lifecycle management.
 * Uses Comlink for type-safe communication with the worker.
 *
 * @module composables/useParserWorker
 */

import { ref, shallowRef, onUnmounted, computed } from 'vue';
import { wrap } from 'comlink';

/**
 * Composable for parser Web Worker communication
 * Provides reactive state and async methods for file parsing
 *
 * @returns {Object} Worker API with reactive state
 * @property {Ref<number>} progress - Progress percentage (0-100)
 * @property {Ref<string>} status - Status message ('idle', 'parsing', 'success', 'error')
 * @property {Ref<string>} state - Current parsing state
 * @property {Ref<Error|null>} error - Error object if parsing failed
 * @property {ComputedRef<boolean>} isParsing - Whether parsing is in progress
 * @property {ComputedRef<boolean>} isComplete - Whether parsing completed successfully
 * @property {Function} parseFile - Parse a file (auto-detects iOS vs Android)
 * @property {Function} parseIOS - Parse iOS binary (IPA)
 * @property {Function} parseAndroid - Parse Android binary (APK/XAPK)
 * @property {Function} cancel - Cancel current parsing operation
 * @property {Function} reset - Reset state to idle
 */
export function useParserWorker() {
  // Reactive state (main thread only - not in worker)
  const progress = ref(0);
  const status = ref('idle'); // idle, parsing, success, error, cancelled
  const state = ref('idle'); // Alias for status (for compatibility)
  const error = ref(null);

  // Worker instance (use shallowRef to avoid deep reactivity on worker proxy)
  // The worker proxy from Comlink should not be made reactive
  let worker = null;
  let workerAPI = null;

  // Initialize worker lazily (only when needed)
  const initializeWorker = () => {
    if (worker) return; // Already initialized

    try {
      // Create worker with type: 'module' for ES module support
      worker = new Worker(
        new URL('../workers/parser-worker.js', import.meta.url),
        { type: 'module' }
      );

      // Wrap worker with Comlink for type-safe communication
      workerAPI = wrap(worker);

      console.log('[useParserWorker] Worker initialized');
    } catch (err) {
      console.error('[useParserWorker] Failed to initialize worker:', err);
      error.value = new Error('Failed to initialize parser worker');
      status.value = 'error';
      state.value = 'error';
    }
  };

  // Computed properties
  const isParsing = computed(() => {
    return status.value === 'parsing';
  });

  const isComplete = computed(() => {
    return status.value === 'success';
  });

  /**
   * Parse a file (auto-detects platform based on file extension)
   * @param {File} file - The binary file to parse (.ipa, .apk, .aab, .xapk)
   * @returns {Promise<Object>} Parse result with metadata, breakdown, treemap, and summary
   * @throws {Error} If parsing fails or file type is unsupported
   */
  const parseFile = async (file) => {
    // Detect platform from file extension
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (ext === '.ipa') {
      return parseIOS(file);
    } else if (['.apk', '.aab', '.xapk'].includes(ext)) {
      return parseAndroid(file);
    } else {
      const err = new Error(`Unsupported file type: ${ext}. Please upload .ipa, .apk, .aab, or .xapk files.`);
      error.value = err;
      status.value = 'error';
      state.value = 'error';
      throw err;
    }
  };

  /**
   * Parse iOS binary (IPA file)
   * @param {File} file - IPA file to parse
   * @returns {Promise<Object>} Parse result
   */
  const parseIOS = async (file) => {
    try {
      // Initialize worker if not already done
      initializeWorker();

      if (!workerAPI) {
        throw new Error('Worker not initialized');
      }

      // Reset state
      status.value = 'parsing';
      state.value = 'parsing';
      error.value = null;
      progress.value = 0;

      console.log('[useParserWorker] Starting iOS parse:', file.name);

      // Call worker method (Comlink makes this async automatically)
      const result = await workerAPI.parseIOS(file);

      // Success
      status.value = 'success';
      state.value = 'success';
      progress.value = 100;

      console.log('[useParserWorker] iOS parse successful');

      return result;
    } catch (err) {
      console.error('[useParserWorker] iOS parse failed:', err);
      error.value = err;
      status.value = 'error';
      state.value = 'error';
      throw err;
    }
  };

  /**
   * Parse Android binary (APK, XAPK, or AAB file)
   * @param {File} file - APK, XAPK, or AAB file to parse
   * @returns {Promise<Object>} Parse result
   */
  const parseAndroid = async (file) => {
    try {
      // Initialize worker if not already done
      initializeWorker();

      if (!workerAPI) {
        throw new Error('Worker not initialized');
      }

      // Reset state
      status.value = 'parsing';
      state.value = 'parsing';
      error.value = null;
      progress.value = 0;

      console.log('[useParserWorker] Starting Android parse:', file.name);

      // Call worker method (Comlink makes this async automatically)
      const result = await workerAPI.parseAndroid(file);

      // Success
      status.value = 'success';
      state.value = 'success';
      progress.value = 100;

      console.log('[useParserWorker] Android parse successful');

      return result;
    } catch (err) {
      console.error('[useParserWorker] Android parse failed:', err);
      error.value = err;
      status.value = 'error';
      state.value = 'error';
      throw err;
    }
  };

  /**
   * Cancel the current parsing operation
   * @returns {Promise<void>}
   */
  const cancel = async () => {
    try {
      if (workerAPI && status.value === 'parsing') {
        await workerAPI.cancel();
        status.value = 'cancelled';
        state.value = 'cancelled';
        console.log('[useParserWorker] Parsing cancelled');
      }
    } catch (err) {
      console.error('[useParserWorker] Cancel failed:', err);
    }
  };

  /**
   * Reset state to idle
   */
  const reset = () => {
    progress.value = 0;
    status.value = 'idle';
    state.value = 'idle';
    error.value = null;
  };

  /**
   * Cleanup on component unmount
   * Terminates the worker to free resources
   */
  onUnmounted(() => {
    if (worker) {
      worker.terminate();
      worker = null;
      workerAPI = null;
      console.log('[useParserWorker] Worker terminated');
    }
  });

  return {
    // Reactive state
    progress,
    status,
    state, // Alias for status
    error,

    // Computed properties
    isParsing,
    isComplete,

    // Worker methods
    parseFile,
    parseIOS,
    parseAndroid,
    cancel,
    reset,
  };
}
