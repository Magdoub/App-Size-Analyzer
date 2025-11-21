/**
 * ImageCompressor Contract
 *
 * Defines the interface for client-side image compression testing.
 * Uses Canvas API for WebP/JPEG compression (no external libraries).
 *
 * @contract ImageCompressor
 * @version 1.0.0
 * @feature 011-insights-improvement
 */

/**
 * Image compression service interface
 * @typedef {Object} ImageCompressor
 * @property {CompressImageFunction} compressImage - Compress single image
 * @property {CompressBatchFunction} compressBatch - Compress multiple images
 * @property {boolean} supportsWebP - WebP encoding support (false for Safari)
 */

/**
 * Compress a single image with multiple formats and return best result
 * @callback CompressImageFunction
 * @param {File|Blob} imageFile - Original image file
 * @param {CompressOptions} [options] - Compression options
 * @returns {Promise<ImageCompressionResult>} Compression test results
 */

/**
 * Compress multiple images in batch with progress tracking
 * @callback CompressBatchFunction
 * @param {(File|Blob)[]} imageFiles - Array of image files
 * @param {CompressOptions} [options] - Compression options
 * @param {ProgressCallback} [onProgress] - Progress callback
 * @returns {Promise<ImageCompressionResult[]>} Array of compression results
 */

/**
 * Progress callback for batch operations
 * @callback ProgressCallback
 * @param {number} processed - Number of images processed
 * @param {number} total - Total number of images
 * @param {number} percentComplete - Percentage complete (0-100)
 */

/**
 * Compression options
 * @typedef {Object} CompressOptions
 * @property {number} [quality=0.85] - Compression quality (0.0-1.0)
 * @property {string[]} [formats=['jpeg', 'webp']] - Formats to test
 * @property {boolean} [generatePreviews=true] - Generate preview URLs
 * @property {number} [minSavings=4096] - Minimum savings threshold (bytes)
 */

/**
 * Image compression result
 * @typedef {Object} ImageCompressionResult
 * @property {string} filePath - Original image path
 * @property {'png'|'jpeg'|'webp'|'heic'} originalFormat - Original format
 * @property {number} originalSize - Original size in bytes
 * @property {CompressedFormat[]} testedFormats - All tested compressions
 * @property {CompressedFormat} bestFormat - Best compression result
 * @property {number} savings - Bytes saved with best format
 * @property {number} reductionPercent - Percentage reduction (0-100)
 * @property {number} testDuration - Test duration in milliseconds
 * @property {PreviewUrls} [previewUrls] - Preview URLs (if generatePreviews=true)
 */

/**
 * Compressed format result
 * @typedef {Object} CompressedFormat
 * @property {'jpeg'|'webp'|'png'} format - Compression format
 * @property {number} quality - Compression quality (0.0-1.0)
 * @property {number} size - Compressed size in bytes
 * @property {Blob} blob - Compressed image data
 */

/**
 * Preview URLs for side-by-side comparison
 * @typedef {Object} PreviewUrls
 * @property {string} original - Object URL for original image
 * @property {string} compressed - Object URL for compressed image
 * @property {() => void} cleanup - Function to revoke URLs
 */

/**
 * Example Usage
 * =============
 */

/**
 * @example
 * // Initialize compressor
 * const compressor = createImageCompressor();
 *
 * // Check WebP support
 * if (!compressor.supportsWebP) {
 *   console.warn('WebP encoding not supported (Safari browser)');
 * }
 *
 * // Compress single image
 * const result = await compressor.compressImage(imageFile, {
 *   quality: 0.85,
 *   formats: ['jpeg', 'webp'],
 *   generatePreviews: true
 * });
 *
 * console.log(`Saved ${result.savings} bytes (${result.reductionPercent}%)`);
 * console.log(`Best format: ${result.bestFormat.format}`);
 *
 * // Display preview
 * imgOriginal.src = result.previewUrls.original;
 * imgCompressed.src = result.previewUrls.compressed;
 *
 * // Cleanup when done
 * onUnmounted(() => result.previewUrls.cleanup());
 *
 * // Compress batch with progress
 * const results = await compressor.compressBatch(imageFiles, {
 *   quality: 0.85
 * }, (processed, total, percent) => {
 *   console.log(`Progress: ${processed}/${total} (${percent}%)`);
 * });
 */

/**
 * Implementation Notes
 * ====================
 *
 * 1. Browser Compatibility:
 *    - JPEG: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (universal)
 *    - WebP: Chrome 90+, Firefox 96+, Edge 90+ (NO Safari support)
 *    - Fallback: Always test JPEG, skip WebP on Safari
 *
 * 2. Performance:
 *    - Single image: 30-100ms (JPEG), 50-200ms (WebP)
 *    - Batch processing: Run in Web Worker with OffscreenCanvas
 *    - Target: <60s for 100 images
 *
 * 3. Memory Management:
 *    - Always revoke preview URLs when done (prevents memory leaks)
 *    - Use compression cache to avoid re-testing same images
 *    - Limit concurrent operations (4-8 max) to prevent OOM
 *
 * 4. Quality Settings:
 *    - 0.85 (85%) recommended for lossy compression
 *    - Balances quality vs file size (40-60% reduction typical)
 *    - Lower quality = smaller file but visible artifacts
 *
 * 5. Minimum Savings Threshold:
 *    - Default: 4096 bytes (4KB)
 *    - Don't flag tiny images with small absolute savings
 *    - Aligns with Emerge Tools methodology
 */

export {};
