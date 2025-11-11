/**
 * Parser Worker API Contract
 *
 * Defines the Comlink-exposed API for the parser Web Worker.
 * This contract must be implemented by src/workers/parser-worker.js
 *
 * Feature: 009-vue-migration-completion
 * Date: 2025-11-11
 */

/**
 * @typedef {Object} FileEntry
 * @property {string} path - File path within binary
 * @property {number} size - Uncompressed size in bytes
 * @property {number} compressedSize - Compressed size in bytes
 * @property {string} type - Content type (image/png, code/swift, data, etc.)
 * @property {Object} metadata - Additional metadata (architecture, etc.)
 */

/**
 * @typedef {Object} ParseResult
 * @property {Object} metadata - App metadata (platform, bundleId, version, etc.)
 * @property {Object} breakdownRoot - Hierarchical FileNode tree
 * @property {Object} treemapData - Flattened TreemapNode data
 * @property {Object} summary - Summary statistics
 */

/**
 * @typedef {Object} WorkerParseResult
 * @property {ParseResult} parseResult - Parsed analysis data
 * @property {FileEntry[]} fileEntries - List of all file entries
 */

/**
 * @typedef {Object} ProgressUpdate
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} message - Status message for display
 */

/**
 * @typedef {function(ProgressUpdate): void} ProgressCallback
 * Callback function for progress updates (must be Comlink.proxy() wrapped)
 */

/**
 * Parser Worker API
 *
 * All methods are exposed via Comlink.expose() in parser-worker.js
 * All methods return Promises (async operations)
 */
export const ParserWorkerAPI = {
  /**
   * Parse iOS binary (IPA file)
   *
   * @param {File} file - Browser File object (IPA)
   * @param {ProgressCallback} [onProgress] - Optional progress callback (Comlink.proxy)
   * @returns {Promise<WorkerParseResult>} Parse result with file entries
   * @throws {Error} If file is invalid, parsing fails, or operation is cancelled
   *
   * @example
   * const worker = new Worker('./parser-worker.js');
   * const api = Comlink.wrap(worker);
   *
   * const result = await api.parseIOS(
   *   file,
   *   Comlink.proxy((progress) => {
   *     console.log(`${progress.progress}% - ${progress.message}`);
   *   })
   * );
   */
  parseIOS: async (file, onProgress) => {},

  /**
   * Parse Android binary (APK, XAPK, or AAB file)
   *
   * @param {File} file - Browser File object (APK/XAPK/AAB)
   * @param {ProgressCallback} [onProgress] - Optional progress callback (Comlink.proxy)
   * @returns {Promise<WorkerParseResult>} Parse result with file entries
   * @throws {Error} If file is invalid, parsing fails, or operation is cancelled
   *
   * @example
   * const result = await api.parseAndroid(
   *   file,
   *   Comlink.proxy((progress) => {
   *     progressBar.value = progress.progress;
   *     statusText.textContent = progress.message;
   *   })
   * );
   */
  parseAndroid: async (file, onProgress) => {},

  /**
   * Cancel current parsing operation
   *
   * Sets internal cancellation flag. Next checkpoint in parsing will throw error.
   * Safe to call even if no parsing is in progress.
   *
   * @returns {void}
   *
   * @example
   * api.cancel();
   * // Next await point in parseIOS/parseAndroid will throw:
   * // Error: 'Parsing cancelled by user'
   */
  cancel: () => {},
};

/**
 * Implementation Notes:
 *
 * 1. Progress Callbacks:
 *    - Must wrap callback with Comlink.proxy() on main thread
 *    - Worker calls callback with { progress, message }
 *    - Typical progress stages:
 *      - 0-20%: "Validating file..."
 *      - 20-40%: "Extracting ZIP archive..."
 *      - 40-70%: "Parsing binary metadata..."
 *      - 70-90%: "Building file tree..."
 *      - 90-100%: "Finalizing analysis..."
 *
 * 2. Cancellation:
 *    - Worker checks `isCancelled` flag at strategic points
 *    - Throws error immediately when cancelled
 *    - Main thread catches error and updates UI accordingly
 *
 * 3. Error Handling:
 *    - Invalid file type: "Unsupported file format: .txt"
 *    - Corrupted file: "Failed to extract ZIP: invalid format"
 *    - Timeout: "Parsing timed out after 120s"
 *    - Cancelled: "Parsing cancelled by user"
 *
 * 4. Performance:
 *    - All parsing happens in Worker (off main thread)
 *    - Use streaming for large files (fflate with chunks)
 *    - Transfer data via structured clone (automatic with Comlink)
 *    - Target: <10s for 100MB files
 *
 * 5. Memory:
 *    - Worker processes file in chunks where possible
 *    - Large binary data (images, compiled code) kept as references
 *    - Only metadata and file list transferred to main thread
 *    - Worker terminates after parsing (memory released)
 */

/**
 * Type Validation
 *
 * Worker should validate file types before parsing:
 */
export const supportedFileTypes = {
  iOS: ['.ipa'],
  Android: ['.apk', '.xapk', '.aab'],
};

/**
 * Timeout Calculation
 *
 * Dynamic timeout based on file size:
 * - Base: 30 seconds
 * - Additional: 5 seconds per MB
 *
 * @example
 * const timeoutMs = 30000 + (file.size / (1024 * 1024)) * 5000;
 * // 10MB file: 30 + 50 = 80 seconds
 * // 100MB file: 30 + 500 = 530 seconds (8.8 minutes)
 */
export function calculateTimeout(fileSizeBytes) {
  const sizeMB = fileSizeBytes / (1024 * 1024);
  return 30000 + sizeMB * 5000;
}

/**
 * Expected Progress Updates
 *
 * Workers should send progress updates at these checkpoints:
 */
export const progressCheckpoints = [
  { progress: 0, message: 'Starting validation...' },
  { progress: 10, message: 'Validating file format...' },
  { progress: 20, message: 'Extracting ZIP archive...' },
  { progress: 40, message: 'Reading binary metadata...' },
  { progress: 60, message: 'Parsing executable...' },
  { progress: 70, message: 'Building file hierarchy...' },
  { progress: 85, message: 'Generating treemap data...' },
  { progress: 95, message: 'Finalizing analysis...' },
  { progress: 100, message: 'Complete!' },
];
