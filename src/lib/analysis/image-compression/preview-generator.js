/**
 * Image Preview Generator
 *
 * Creates preview URLs for side-by-side image comparison
 * Uses URL.createObjectURL() for efficient blob preview
 *
 * @see specs/011-insights-improvement/contracts/ImageCompressor.contract.js
 */

/**
 * Create preview URL pair for original and compressed images
 * Returns object URLs that can be used as img src attributes
 *
 * IMPORTANT: Caller is responsible for revoking URLs via cleanup() when done
 * to prevent memory leaks
 *
 * @param {Blob|File} originalBlob - Original image blob
 * @param {Blob} compressedBlob - Compressed image blob
 * @returns {{original: string, compressed: string, cleanup: () => void}}
 *
 * @example
 * const previews = createPreviewPair(originalFile, compressedBlob);
 *
 * // Use in Vue component
 * originalImg.value.src = previews.original;
 * compressedImg.value.src = previews.compressed;
 *
 * // Cleanup when component unmounts
 * onUnmounted(() => {
 *   previews.cleanup();
 * });
 *
 * @example
 * // With InsightCard.vue metadata
 * const metadata = {
 *   compressionResult: {
 *     original: { size: 523045 },
 *     compressed: { size: 210834 },
 *     savings: 312211,
 *     reductionPercent: 59.7
 *   },
 *   previewUrls: createPreviewPair(originalBlob, compressedBlob)
 * };
 */
export function createPreviewPair(originalBlob, compressedBlob) {
  if (!originalBlob || !(originalBlob instanceof Blob)) {
    throw new Error('Invalid original blob provided');
  }

  if (!compressedBlob || !(compressedBlob instanceof Blob)) {
    throw new Error('Invalid compressed blob provided');
  }

  // Create object URLs for both blobs
  const originalURL = URL.createObjectURL(originalBlob);
  const compressedURL = URL.createObjectURL(compressedBlob);

  return {
    original: originalURL,
    compressed: compressedURL,

    /**
     * Cleanup function to revoke object URLs
     * MUST be called when previews are no longer needed
     */
    cleanup: () => {
      URL.revokeObjectURL(originalURL);
      URL.revokeObjectURL(compressedURL);
    }
  };
}

/**
 * Create preview URL for a single blob
 * Simpler version for cases where only one preview is needed
 *
 * @param {Blob|File} blob - Image blob
 * @returns {{url: string, cleanup: () => void}}
 *
 * @example
 * const preview = createPreview(imageBlob);
 * img.src = preview.url;
 * onUnmounted(() => preview.cleanup());
 */
export function createPreview(blob) {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('Invalid blob provided');
  }

  const url = URL.createObjectURL(blob);

  return {
    url: url,
    cleanup: () => {
      URL.revokeObjectURL(url);
    }
  };
}

/**
 * Batch create preview URLs for multiple blobs
 * Useful for creating previews for all affected items in an insight
 *
 * @param {Array<{original: Blob, compressed: Blob}>} pairs - Array of blob pairs
 * @returns {Array<{original: string, compressed: string, cleanup: () => void}>}
 *
 * @example
 * const pairs = [
 *   { original: blob1, compressed: compressedBlob1 },
 *   { original: blob2, compressed: compressedBlob2 }
 * ];
 *
 * const previews = createBatchPreviews(pairs);
 *
 * // Use previews
 * previews.forEach((preview, i) => {
 *   images[i].original.src = preview.original;
 *   images[i].compressed.src = preview.compressed;
 * });
 *
 * // Cleanup all at once
 * const cleanupAll = () => {
 *   previews.forEach(p => p.cleanup());
 * };
 * onUnmounted(cleanupAll);
 */
export function createBatchPreviews(pairs) {
  if (!Array.isArray(pairs)) {
    throw new Error('Pairs must be an array');
  }

  return pairs.map(({ original, compressed }) => {
    return createPreviewPair(original, compressed);
  });
}

/**
 * Memory-safe preview manager for Vue components
 * Automatically tracks and cleans up all preview URLs
 *
 * @returns {{add: (original: Blob, compressed: Blob) => {original: string, compressed: string}, cleanup: () => void}}
 *
 * @example
 * // In Vue component setup()
 * const previewManager = createPreviewManager();
 *
 * // Add previews as needed
 * const preview1 = previewManager.add(blob1, compressedBlob1);
 * const preview2 = previewManager.add(blob2, compressedBlob2);
 *
 * // Cleanup all automatically on unmount
 * onUnmounted(() => {
 *   previewManager.cleanup();
 * });
 */
export function createPreviewManager() {
  const cleanupFunctions = [];

  return {
    /**
     * Add a new preview pair
     * @param {Blob} original - Original image blob
     * @param {Blob} compressed - Compressed image blob
     * @returns {{original: string, compressed: string}}
     */
    add(original, compressed) {
      const preview = createPreviewPair(original, compressed);
      cleanupFunctions.push(preview.cleanup);

      return {
        original: preview.original,
        compressed: preview.compressed
      };
    },

    /**
     * Cleanup all tracked previews
     */
    cleanup() {
      cleanupFunctions.forEach(fn => { fn(); });
      cleanupFunctions.length = 0; // Clear array
    }
  };
}
