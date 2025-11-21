/**
 * AAB Parser Contract
 *
 * This module defines the API contract for the Android App Bundle parser.
 * The parser runs in a Web Worker and returns structured analysis results.
 *
 * @module contracts/aab-parser
 */

// =============================================================================
// Input Types
// =============================================================================

/**
 * Options for parsing an AAB file
 * @typedef {Object} AABParseOptions
 * @property {boolean} [extractMetadata=true] - Extract package metadata from manifest
 * @property {boolean} [categorizeFiles=true] - Categorize files for breakdown
 * @property {(progress: ParseProgress) => void} [onProgress] - Progress callback
 */

// =============================================================================
// Output Types
// =============================================================================

/**
 * Complete parse result for an AAB file
 * @typedef {Object} AABParseResult
 * @property {'aab'} format - File format identifier
 * @property {string} fileName - Original file name
 * @property {number} fileSize - Total file size in bytes
 * @property {AABMetadata} metadata - Extracted bundle metadata
 * @property {AABModule[]} modules - List of modules in the bundle
 * @property {FileEntry[]} files - All files in the bundle
 * @property {ContentBreakdown} breakdown - Categorized size breakdown
 */

/**
 * Metadata extracted from AndroidManifest.xml
 * @typedef {Object} AABMetadata
 * @property {string} packageName - Android package name
 * @property {number} versionCode - Integer version code
 * @property {string} versionName - Human-readable version string
 * @property {string|null} minSdkVersion - Minimum SDK version
 * @property {string|null} targetSdkVersion - Target SDK version
 * @property {string[]} permissions - Declared permissions
 */

/**
 * Module within the AAB (base or feature)
 * @typedef {Object} AABModule
 * @property {string} name - Module name
 * @property {boolean} isBase - True if base module
 * @property {number} size - Total module size
 * @property {ModuleContents} contents - Breakdown of contents
 */

/**
 * Contents breakdown for a module
 * @typedef {Object} ModuleContents
 * @property {number} dexSize - DEX files size
 * @property {number} dexCount - Number of DEX files
 * @property {number} resourcesSize - Resources size
 * @property {number} assetsSize - Assets size
 * @property {number} nativeSize - Native libraries size
 * @property {string[]} architectures - Architectures present
 */

// =============================================================================
// Main API
// =============================================================================

/**
 * Parse an Android App Bundle file
 *
 * @param {File|Blob|ArrayBuffer} input - The AAB file to parse
 * @param {AABParseOptions} [options] - Parse options
 * @returns {Promise<AABParseResult>} Parsed AAB data
 * @throws {ParseError} If parsing fails
 *
 * @example
 * ```javascript
 * import { parseAAB } from '@/lib/parsers/android/aab-parser';
 *
 * const result = await parseAAB(file, {
 *   onProgress: (p) => console.log(`${p.progress}%: ${p.message}`)
 * });
 *
 * console.log(`Package: ${result.metadata.packageName}`);
 * console.log(`Modules: ${result.modules.length}`);
 * ```
 */
export async function parseAAB(input, options = {}) {
  // Implementation in src/lib/parsers/android/aab-parser.js
}

/**
 * Check if a file is a valid AAB
 *
 * @param {File|Blob} file - File to check
 * @returns {Promise<boolean>} True if valid AAB
 *
 * @example
 * ```javascript
 * if (await isValidAAB(file)) {
 *   const result = await parseAAB(file);
 * }
 * ```
 */
export async function isValidAAB(file) {
  // Check ZIP magic bytes and presence of base/ directory
}

/**
 * Extract metadata only (faster than full parse)
 *
 * @param {File|Blob|ArrayBuffer} input - The AAB file
 * @returns {Promise<AABMetadata>} Just the metadata
 *
 * @example
 * ```javascript
 * const meta = await extractAABMetadata(file);
 * console.log(`${meta.packageName} v${meta.versionName}`);
 * ```
 */
export async function extractAABMetadata(input) {
  // Only extract and parse AndroidManifest.xml
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Content categories for AAB files
 */
export const AAB_CATEGORIES = {
  DEX: { id: 'dex', name: 'Code (DEX)', color: '#4CAF50' },
  RESOURCES: { id: 'resources', name: 'Resources', color: '#2196F3' },
  ASSETS: { id: 'assets', name: 'Assets', color: '#9C27B0' },
  NATIVE: { id: 'native', name: 'Native Libraries', color: '#FF9800' },
  CONFIG: { id: 'config', name: 'Configuration', color: '#607D8B' },
  OTHER: { id: 'other', name: 'Other', color: '#9E9E9E' }
};

/**
 * File patterns for categorization
 */
export const AAB_PATTERNS = {
  dex: /\/dex\/.*\.dex$/,
  resources: /\/res\//,
  assets: /\/assets\//,
  native: /\/lib\/.*\.so$/,
  config: /\.(pb|xml)$|\/manifest\/|META-INF\//
};
