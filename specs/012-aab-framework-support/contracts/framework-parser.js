/**
 * Framework Parser Contract
 *
 * This module defines the API contract for the iOS/macOS Framework bundle parser.
 * The parser runs in a Web Worker and returns structured analysis results.
 *
 * @module contracts/framework-parser
 */

// =============================================================================
// Input Types
// =============================================================================

/**
 * Options for parsing a Framework bundle
 * @typedef {Object} FrameworkParseOptions
 * @property {boolean} [extractMetadata=true] - Extract bundle metadata from Info.plist
 * @property {boolean} [parseArchitectures=true] - Parse Mach-O binary for architectures
 * @property {boolean} [categorizeFiles=true] - Categorize files for breakdown
 * @property {(progress: ParseProgress) => void} [onProgress] - Progress callback
 */

// =============================================================================
// Output Types
// =============================================================================

/**
 * Complete parse result for a Framework bundle
 * @typedef {Object} FrameworkParseResult
 * @property {'framework'} format - File format identifier
 * @property {string} fileName - Original file name
 * @property {number} fileSize - Total file size in bytes
 * @property {FrameworkMetadata} metadata - Extracted bundle metadata
 * @property {ArchitectureSlice[]} architectures - Architecture slices in binary
 * @property {FileEntry[]} files - All files in the framework
 * @property {ContentBreakdown} breakdown - Categorized size breakdown
 */

/**
 * Metadata extracted from Info.plist
 * @typedef {Object} FrameworkMetadata
 * @property {string} bundleIdentifier - Bundle ID
 * @property {string} bundleName - Framework name
 * @property {string} bundleExecutable - Main binary name
 * @property {string} version - Marketing version
 * @property {string} buildVersion - Build number
 * @property {string|null} minimumOSVersion - Minimum OS version
 * @property {string|null} platformName - Platform name
 * @property {boolean} isVersioned - True if macOS versioned structure
 */

/**
 * Architecture slice in a universal binary
 * @typedef {Object} ArchitectureSlice
 * @property {string} name - Architecture name (arm64, x86_64, etc.)
 * @property {number} cputype - Mach-O CPU type
 * @property {number} cpusubtype - Mach-O CPU subtype
 * @property {number} offset - Offset in binary file
 * @property {number} size - Size of this slice in bytes
 */

// =============================================================================
// Main API
// =============================================================================

/**
 * Parse an iOS/macOS Framework bundle
 *
 * @param {File|Blob|ArrayBuffer} input - ZIP file containing the framework
 * @param {FrameworkParseOptions} [options] - Parse options
 * @returns {Promise<FrameworkParseResult>} Parsed framework data
 * @throws {ParseError} If parsing fails
 *
 * @example
 * ```javascript
 * import { parseFramework } from '@/lib/parsers/ios/framework-parser';
 *
 * // User uploads MyFramework.framework.zip
 * const result = await parseFramework(file, {
 *   onProgress: (p) => console.log(`${p.progress}%: ${p.message}`)
 * });
 *
 * console.log(`Bundle ID: ${result.metadata.bundleIdentifier}`);
 * console.log(`Architectures: ${result.architectures.map(a => a.name).join(', ')}`);
 * ```
 */
export async function parseFramework(input, options = {}) {
  // Implementation in src/lib/parsers/ios/framework-parser.js
}

/**
 * Check if a ZIP file contains a valid framework bundle
 *
 * @param {File|Blob} file - ZIP file to check
 * @returns {Promise<boolean>} True if contains valid framework
 *
 * @example
 * ```javascript
 * if (await isValidFramework(file)) {
 *   const result = await parseFramework(file);
 * }
 * ```
 */
export async function isValidFramework(file) {
  // Check for .framework directory and Info.plist
}

/**
 * Extract metadata only (faster than full parse)
 *
 * @param {File|Blob|ArrayBuffer} input - ZIP file containing framework
 * @returns {Promise<FrameworkMetadata>} Just the metadata
 *
 * @example
 * ```javascript
 * const meta = await extractFrameworkMetadata(file);
 * console.log(`${meta.bundleName} v${meta.version}`);
 * ```
 */
export async function extractFrameworkMetadata(input) {
  // Only extract and parse Info.plist
}

/**
 * Get architecture info from a Mach-O binary
 *
 * @param {ArrayBuffer} binaryData - The binary file contents
 * @returns {ArchitectureSlice[]} List of architecture slices
 *
 * @example
 * ```javascript
 * const archs = parseArchitectures(binaryBuffer);
 * const hasArm64 = archs.some(a => a.name === 'arm64');
 * ```
 */
export function parseArchitectures(binaryData) {
  // Parse Mach-O fat header or single architecture
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Content categories for Framework bundles
 */
export const FRAMEWORK_CATEGORIES = {
  BINARY: { id: 'binary', name: 'Binary', color: '#E91E63' },
  HEADERS: { id: 'headers', name: 'Headers', color: '#00BCD4' },
  MODULES: { id: 'modules', name: 'Modules', color: '#8BC34A' },
  RESOURCES: { id: 'resources', name: 'Resources', color: '#2196F3' },
  METADATA: { id: 'metadata', name: 'Metadata', color: '#607D8B' },
  FRAMEWORKS: { id: 'frameworks', name: 'Embedded Frameworks', color: '#FF5722' },
  OTHER: { id: 'other', name: 'Other', color: '#9E9E9E' }
};

/**
 * File patterns for categorization
 */
export const FRAMEWORK_PATTERNS = {
  headers: /^(Headers|PrivateHeaders)\//i,
  modules: /^Modules\/|\.modulemap$|\.swiftmodule$|\.swiftinterface$/,
  resources: /^Resources\/|\.car$|\.nib$|\.storyboardc$|\.lproj\//,
  metadata: /Info\.plist$|^_CodeSignature\//,
  frameworks: /^Frameworks\//,
  binary: /\.dylib$/
};

/**
 * Mach-O magic numbers
 */
export const MACHO_MAGIC = {
  FAT_MAGIC: 0xCAFEBABE,
  FAT_CIGAM: 0xBEBAFECA,
  MH_MAGIC_64: 0xFEEDFACF,
  MH_CIGAM_64: 0xCFFAEDFE,
  MH_MAGIC: 0xFEEDFACE,
  MH_CIGAM: 0xCEFAEDFE
};

/**
 * CPU type constants for architecture detection
 */
export const CPU_TYPES = {
  ARM64: 0x0100000C,
  X86_64: 0x01000007,
  ARM: 12,
  I386: 7
};

/**
 * Map CPU type to architecture name
 * @param {number} cputype - CPU type value
 * @param {number} cpusubtype - CPU subtype value
 * @returns {string} Architecture name
 */
export function getCpuName(cputype, cpusubtype) {
  switch (cputype) {
    case CPU_TYPES.X86_64: return 'x86_64';
    case CPU_TYPES.ARM64: return cpusubtype === 2 ? 'arm64e' : 'arm64';
    case CPU_TYPES.ARM: return 'armv7';
    case CPU_TYPES.I386: return 'i386';
    default: return `unknown(${cputype})`;
  }
}
