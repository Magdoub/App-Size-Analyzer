/**
 * useCompressionWorker Composable
 *
 * Vue composable for managing the compression Web Worker with Comlink.
 * Provides a reactive interface for image compression operations.
 */

import { wrap } from 'comlink';
import { onUnmounted, ref } from 'vue';

/**
 * Composable for image compression worker management
 *
 * @returns {Object} Worker management interface
 */
export function useCompressionWorker() {
  const worker = ref(null);
  const isProcessing = ref(false);
  const progress = ref(0);
  const error = ref(null);

  /**
   * Initialize the compression worker
   * Lazily creates worker on first use
   *
   * @returns {Object} Wrapped worker instance
   */
  const initWorker = () => {
    if (!worker.value) {
      try {
        const w = new Worker(
          new URL('../workers/compression-worker.js', import.meta.url),
          { type: 'module' }
        );
        worker.value = wrap(w);
      } catch (err) {
        error.value = `Failed to initialize compression worker: ${err.message}`;
        console.error('Compression worker initialization error:', err);
        return null;
      }
    }
    return worker.value;
  };

  /**
   * Compress a single image with specified format
   *
   * @param {File|Blob} imageFile - Image to compress
   * @param {string} format - Target format ('jpeg' or 'webp')
   * @param {number} quality - Compression quality (0.0-1.0)
   * @returns {Promise<Blob>} Compressed image blob
   */
  const compressImage = async (imageFile, format = 'jpeg', quality = 0.85) => {
    const workerInstance = initWorker();
    if (!workerInstance) {
      throw new Error('Worker not available');
    }

    isProcessing.value = true;
    error.value = null;

    try {
      let result;
      if (format === 'jpeg') {
        result = await workerInstance.compressJPEG(imageFile, quality);
      } else if (format === 'webp') {
        result = await workerInstance.convertToWebP(imageFile, quality);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      return result;
    } catch (err) {
      error.value = `Compression failed: ${err.message}`;
      console.error('Compression error:', err);
      throw err;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Test all compression formats and return best result
   *
   * @param {File|Blob} imageFile - Image to test
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Compression test results
   */
  const testAllFormats = async (imageFile, options = {}) => {
    const workerInstance = initWorker();
    if (!workerInstance) {
      throw new Error('Worker not available');
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await workerInstance.testAllFormats(imageFile, options);
      return result;
    } catch (err) {
      error.value = `Format testing failed: ${err.message}`;
      console.error('Format testing error:', err);
      throw err;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Detect image detail level (for icon optimization)
   *
   * @param {File|Blob} imageFile - Image to analyze
   * @returns {Promise<Object>} Detail analysis result
   */
  const detectDetailLevel = async (imageFile) => {
    const workerInstance = initWorker();
    if (!workerInstance) {
      throw new Error('Worker not available');
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await workerInstance.detectImageDetailLevel(imageFile);
      return result;
    } catch (err) {
      error.value = `Detail detection failed: ${err.message}`;
      console.error('Detail detection error:', err);
      throw err;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Check if browser supports WebP encoding
   *
   * @returns {Promise<boolean>} True if WebP encoding is supported
   */
  const checkWebPSupport = async () => {
    const workerInstance = initWorker();
    if (!workerInstance) {
      return false;
    }

    try {
      return await workerInstance.supportsWebP();
    } catch (err) {
      console.error('WebP support check error:', err);
      return false;
    }
  };

  /**
   * Batch process multiple images with progress tracking
   *
   * @param {Array<File|Blob>} images - Images to process
   * @param {Function} onProgress - Progress callback (index, total)
   * @returns {Promise<Array>} Array of compression results
   */
  const batchCompressImages = async (images, onProgress = null) => {
    const workerInstance = initWorker();
    if (!workerInstance) {
      throw new Error('Worker not available');
    }

    isProcessing.value = true;
    error.value = null;
    progress.value = 0;

    const results = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const result = await workerInstance.testAllFormats(images[i]);
        results.push(result);

        progress.value = ((i + 1) / images.length) * 100;

        if (onProgress) {
          onProgress(i + 1, images.length);
        }
      }

      return results;
    } catch (err) {
      error.value = `Batch compression failed: ${err.message}`;
      console.error('Batch compression error:', err);
      throw err;
    } finally {
      isProcessing.value = false;
      progress.value = 0;
    }
  };

  /**
   * Terminate the worker and clean up resources
   */
  const terminateWorker = () => {
    if (worker.value) {
      // Comlink wrap returns a proxy, need to access the underlying worker
      // For now, just set to null - worker will be garbage collected
      worker.value = null;
    }
    isProcessing.value = false;
    progress.value = 0;
    error.value = null;
  };

  // Clean up on component unmount
  onUnmounted(() => {
    terminateWorker();
  });

  return {
    isProcessing,
    progress,
    error,
    compressImage,
    testAllFormats,
    detectDetailLevel,
    checkWebPSupport,
    batchCompressImages,
    terminateWorker
  };
}
