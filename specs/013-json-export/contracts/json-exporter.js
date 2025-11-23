/**
 * JSON Exporter Contract
 *
 * Defines the interface for the JSON export library that converts breakdown
 * tree data into formatted JSON strings. This contract ensures the library
 * remains independent of Vue/Pinia and can be tested in isolation.
 *
 * @module contracts/json-exporter
 */

/**
 * @typedef {Object} ExportMetadata
 * @property {string} appName - Display name of the analyzed application
 * @property {string} version - App version number (e.g., "1.2.3")
 * @property {string} bundleId - iOS bundle identifier or Android package name
 * @property {string} platform - Target platform ("iOS", "Android", "Android (AAB)")
 * @property {number} totalSize - Total install size in bytes (uncompressed)
 * @property {number} fileCount - Total number of files in the breakdown
 * @property {string} exportedAt - ISO 8601 timestamp of export operation
 * @property {string} analyzerVersion - Version of the analyzer app
 */

/**
 * @typedef {Object} FileEntry
 * @property {string} path - Full file path relative to app root
 * @property {number} size - Uncompressed file size in bytes
 * @property {number|null} compressedSize - Compressed size in ZIP (null if unknown)
 * @property {number|null} compressionRatio - Compression efficiency 0.0-1.0 (null if N/A)
 * @property {string|null} type - File type identifier (e.g., "plist", "png", "dylib")
 * @property {string|null} category - Logical category (e.g., "code", "resources", "assets")
 */

/**
 * @typedef {Object} ExportResult
 * @property {ExportMetadata} metadata - Export and app metadata
 * @property {FileEntry[]} files - Array of all files in the breakdown
 */

/**
 * @typedef {Object} BreakdownNode
 * @property {string} name - File or directory name
 * @property {string} path - Full path to this node
 * @property {number} size - Size in bytes (file: actual size, dir: sum of children)
 * @property {number} [compressedSize] - Compressed size (optional)
 * @property {string} [type] - File type (optional, only for files)
 * @property {string} [category] - Category (optional, only for files)
 * @property {boolean} isDirectory - Whether this is a directory
 * @property {BreakdownNode[]} [children] - Child nodes (only for directories)
 */

/**
 * @typedef {Object} ClipboardResult
 * @property {boolean} success - Whether copy operation succeeded
 * @property {string|null} method - Clipboard method used ("modern", "legacy", or null)
 * @property {string|null} error - Error message if copy failed
 */

/**
 * Generate formatted JSON export from breakdown tree and metadata.
 *
 * This is the core export function that transforms the hierarchical breakdown
 * tree into a flat, JSON-serializable export structure with metadata.
 *
 * @param {BreakdownNode} breakdownRoot - Root node of the breakdown tree
 * @param {Object} metadata - App metadata object from analysis
 * @param {string} metadata.appName - App display name
 * @param {string} metadata.version - App version
 * @param {string} metadata.bundleId - Bundle/package identifier
 * @param {string} metadata.platform - Platform string
 * @param {number} metadata.totalSize - Total app size in bytes
 * @param {Object} [options] - Optional formatting options
 * @param {number} [options.indent=2] - Number of spaces for JSON indentation
 * @param {boolean} [options.sortBySize=false] - Sort files by size (descending)
 * @param {boolean} [options.sortByPath=true] - Sort files by path (ascending)
 *
 * @returns {string} Formatted JSON string ready for display/export
 *
 * @throws {Error} If breakdownRoot is null/undefined
 * @throws {Error} If metadata is missing required fields
 * @throws {Error} If tree traversal encounters circular references
 *
 * @example
 * const jsonString = generateExportJSON(breakdownRoot, metadata, { indent: 2 });
 * console.log(jsonString.length); // ~500KB for typical app
 */
export function generateExportJSON(breakdownRoot, metadata, options = {}) {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

/**
 * Flatten a hierarchical breakdown tree into an array of file entries.
 *
 * Recursively traverses the tree, collecting only file nodes (not directories)
 * and extracting relevant properties for the flat export format.
 *
 * @param {BreakdownNode} node - Root node to start traversal
 * @param {FileEntry[]} [accumulator=[]] - Accumulator for recursive traversal
 *
 * @returns {FileEntry[]} Flat array of file entries
 *
 * @example
 * const files = flattenBreakdownTree(breakdownRoot);
 * console.log(files.length); // 1247 files
 * console.log(files[0].path); // "Payload/MyApp.app/Info.plist"
 */
export function flattenBreakdownTree(node, accumulator = []) {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

/**
 * Build ExportMetadata object from analysis metadata and runtime context.
 *
 * Extracts relevant fields from the analysis metadata and adds export-specific
 * information like timestamp and analyzer version.
 *
 * @param {Object} analysisMetadata - Metadata from analysisStore.currentAnalysis
 * @param {number} fileCount - Total number of files in breakdown
 *
 * @returns {ExportMetadata} Complete export metadata object
 *
 * @example
 * const metadata = buildExportMetadata(currentAnalysis.metadata, 1247);
 * console.log(metadata.exportedAt); // "2025-01-23T14:30:22.123Z"
 */
export function buildExportMetadata(analysisMetadata, fileCount) {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

/**
 * Copy text to clipboard using modern Clipboard API with fallback.
 *
 * Attempts to use navigator.clipboard.writeText() first, falls back to
 * legacy document.execCommand('copy') if modern API fails or is unavailable.
 *
 * @param {string} text - Text to copy to clipboard
 *
 * @returns {Promise<ClipboardResult>} Result of copy operation
 *
 * @example
 * const result = await copyToClipboard(jsonString);
 * if (result.success) {
 *   console.log(`Copied using ${result.method} method`);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function copyToClipboard(text) {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

/**
 * Generate a sanitized filename for JSON export download.
 *
 * Creates a descriptive, unique filename based on app name and current timestamp.
 * Sanitizes special characters to ensure cross-platform compatibility.
 *
 * @param {string} appName - Application display name
 * @param {string} [suffix='breakdown'] - Optional filename suffix
 *
 * @returns {string} Sanitized filename (e.g., "my-app-breakdown-2025-01-23-143022.json")
 *
 * @example
 * const filename = generateExportFilename("My Cool App");
 * // Returns: "my-cool-app-breakdown-2025-01-23-143022.json"
 */
export function generateExportFilename(appName, suffix = 'breakdown') {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

/**
 * Trigger browser download of JSON export file.
 *
 * Creates a temporary blob URL and triggers download using an invisible
 * anchor element. Cleans up blob URL after download starts.
 *
 * @param {string} jsonString - JSON content to download
 * @param {string} filename - Filename for the downloaded file
 *
 * @returns {void}
 *
 * @example
 * downloadJSONFile(jsonString, "my-app-breakdown-2025-01-23-143022.json");
 */
export function downloadJSONFile(jsonString, filename) {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

/**
 * Apply syntax highlighting to JSON string for display.
 *
 * Uses regex-based replacement to wrap JSON tokens (keys, strings, numbers,
 * keywords) in <span> elements with CSS classes for styling.
 *
 * @param {string} jsonString - Formatted JSON string
 *
 * @returns {string} HTML string with syntax highlighting markup
 *
 * @example
 * const highlighted = highlightJSON(jsonString);
 * // Returns: '<span class="key">"appName"</span>: <span class="string">"MyApp"</span>'
 */
export function highlightJSON(jsonString) {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

/**
 * Validate export data before JSON generation.
 *
 * Performs sanity checks on metadata and breakdown tree to catch data
 * integrity issues before serialization.
 *
 * @param {BreakdownNode} breakdownRoot - Root node to validate
 * @param {Object} metadata - Metadata to validate
 *
 * @returns {{valid: boolean, errors: string[]}} Validation result
 *
 * @example
 * const result = validateExportData(breakdownRoot, metadata);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export function validateExportData(breakdownRoot, metadata) {
  // Implementation will be in src/lib/export/json-generator.js
  throw new Error('Contract: Implementation required');
}

// ============================================================================
// USAGE NOTES
// ============================================================================

/**
 * Library-First Design Pattern:
 *
 * This contract defines pure functions that operate on plain data structures.
 * None of these functions should import or depend on Vue, Pinia, or UI components.
 *
 * Data Flow:
 * 1. Pinia store provides: breakdownRoot, metadata
 * 2. Library generates: ExportResult → JSON string
 * 3. UI components handle: display, copy, download actions
 *
 * Testing Strategy:
 * - Unit tests for each function with real breakdown fixtures
 * - Test edge cases: empty trees, large datasets, special characters
 * - Mock clipboard/download APIs in component tests
 * - Manual browser testing for clipboard permissions
 *
 * Performance:
 * - JSON generation should complete in <100ms for 5,000 files
 * - Use requestIdleCallback for larger datasets if needed
 * - Measure performance with console.time() during development
 */
