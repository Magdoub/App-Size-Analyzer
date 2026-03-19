/**
 * useParserWorker Composable
 *
 * Wraps the parser Web Worker with Vue reactivity and lifecycle management.
 * Uses Comlink for type-safe communication with the worker.
 *
 * @module composables/useParserWorker
 */

import { wrap } from 'comlink';
import { computed, onUnmounted, ref, } from 'vue';

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

  // Status message for current phase
  const statusMessage = ref('');

  // Initialize worker lazily (only when needed)
  const initializeWorker = () => {
    if (worker) return; // Already initialized

    try {
      // Create worker with type: 'module' for ES module support
      worker = new Worker(
        new URL('../workers/parser-worker.js', import.meta.url),
        { type: 'module' }
      );

      // Listen for progress messages from worker
      worker.addEventListener('message', (event) => {
        if (event.data?.type === 'progress') {
          progress.value = event.data.progress;
          if (event.data.message) {
            statusMessage.value = event.data.message;
          }
        }
      });

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
   * Check if a ZIP file contains a .framework directory
   * @param {File} file - ZIP file to check
   * @returns {Promise<boolean>} True if contains .framework
   */
  const checkForFramework = async (file) => {
    try {
      // Read first portion of file to check ZIP contents
      const buffer = await file.slice(0, Math.min(file.size, 65536)).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Simple check: look for ".framework/" in the ZIP central directory
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(bytes);
      return text.includes('.framework/');
    } catch {
      return false;
    }
  };

  /**
   * Parse a file (auto-detects platform based on file extension)
   * @param {File} file - The binary file to parse (.ipa, .apk, .aab, .xapk, or .zip with .framework)
   * @returns {Promise<Object>} Parse result with metadata, breakdown, treemap, and summary
   * @throws {Error} If parsing fails or file type is unsupported
   */
  const parseFile = async (file) => {
    // Detect platform from file extension
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const _fileName = file.name.toLowerCase();

    if (ext === '.ipa') {
      return parseIOS(file);
    } else if (['.apk', '.aab', '.xapk'].includes(ext)) {
      return parseAndroid(file);
    } else if (ext === '.zip') {
      // Check if it's a framework bundle
      const isFramework = await checkForFramework(file);
      if (isFramework) {
        return parseFrameworkBundle(file);
      }
      // Fall through to error
    }

    const err = new Error(`Unsupported file type: ${ext}. Please upload .ipa, .apk, .aab, .xapk files, or a zipped .framework bundle.`);
    error.value = err;
    status.value = 'error';
    state.value = 'error';
    throw err;
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
   * Parse iOS framework bundle (zipped .framework)
   * @param {File} file - Zipped framework to parse
   * @returns {Promise<Object>} Parse result
   */
  const parseFrameworkBundle = async (file) => {
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

      console.log('[useParserWorker] Starting Framework parse:', file.name);

      // Call worker method
      const result = await workerAPI.parseFrameworkBundle(file);

      // Success
      status.value = 'success';
      state.value = 'success';
      progress.value = 100;

      console.log('[useParserWorker] Framework parse successful');

      return result;
    } catch (err) {
      console.error('[useParserWorker] Framework parse failed:', err);
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
    statusMessage,

    // Computed properties
    isParsing,
    isComplete,

    // Worker methods
    parseFile,
    parseIOS,
    parseAndroid,
    parseFrameworkBundle,
    cancel,
    reset,
  };
}
