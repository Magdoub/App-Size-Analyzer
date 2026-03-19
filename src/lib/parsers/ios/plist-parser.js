/**
 * Binary Plist Parser - iOS
 *
 * Parses binary plist files from IPA archives to extract metadata
 */

import { parse } from '@plist/plist';

/**
 * @typedef {Object.<string, unknown>} PlistData
 */

/**
 * Parse a binary plist file into a JavaScript object
 * @param {Uint8Array} data - Binary plist data
 * @returns {Promise<PlistData>} Parsed plist data
 * @throws {Error} If parsing fails
 */
export async function parseBinaryPlist(data) {
  try {
    // @plist/plist handles both binary and XML plists
    // Use slice() to ensure we have a clean buffer starting at offset 0
    // This works in all contexts (main thread, workers, any buffer type)
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    // Type assertion needed because buffer can be SharedArrayBuffer in some contexts
    const result = parse(buffer);

    if (typeof result !== 'object' || result === null) {
      throw new Error('Parsed plist is not an object');
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to parse binary plist: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Info.plist metadata structure
 * @typedef {Object} InfoPlistMetadata
 * @property {string} bundleId - Bundle identifier
 * @property {string} version - App version
 * @property {string} displayName - Display name
 * @property {string} [minimumOSVersion] - Minimum OS version
 * @property {string[]} [supportedPlatforms] - Supported platforms
 * @property {number[]} [deviceFamily] - Device family codes
 * @property {string[]} [architectures] - Required architectures
 */

/**
 * Extract Info.plist metadata from IPA
 * @param {PlistData} plist - Parsed plist data
 * @returns {InfoPlistMetadata} Extracted metadata
 */
export function extractInfoPlistMetadata(plist) {
  const bundleId = String(plist.CFBundleIdentifier || 'unknown');
  const version = String(plist.CFBundleShortVersionString || plist.CFBundleVersion || '0.0.0');
  const displayName = String(plist.CFBundleDisplayName || plist.CFBundleName || 'Unknown App');

  const metadata = {
    bundleId,
    version,
    displayName,
  };

  // Add optional properties only if they exist
  if (plist.MinimumOSVersion) {
    metadata.minimumOSVersion = String(plist.MinimumOSVersion);
  }

  if (Array.isArray(plist.CFBundleSupportedPlatforms)) {
    metadata.supportedPlatforms = plist.CFBundleSupportedPlatforms.map(String);
  }

  if (Array.isArray(plist.UIDeviceFamily)) {
    metadata.deviceFamily = plist.UIDeviceFamily;
  }

  if (Array.isArray(plist.UIRequiredDeviceCapabilities)) {
    metadata.architectures = plist.UIRequiredDeviceCapabilities.map(String);
  }

  return metadata;
}

/**
 * Localization file analysis result
 * @typedef {Object} LocalizationAnalysis
 * @property {string} path - Path to the .strings file
 * @property {number} size - File size in bytes
 * @property {string} format - 'binary' or 'text'
 * @property {string} language - Language code (e.g., 'en', 'fr')
 * @property {number} commentBytes - Estimated bytes used by comments (text format only)
 * @property {number} potentialSavings - Estimated savings from optimization
 * @property {boolean} hasBinaryPlistFormat - True if binary plist format
 */

/**
 * Analyze iOS localization files (.strings) for optimization opportunities
 * Detects binary plist format and comment bloat
 * @param {Array<{path: string, size: number, data?: Uint8Array}>} files - All files from IPA
 * @param {string} appBundlePath - Path to app bundle (e.g., "Payload/MyApp.app/")
 * @returns {LocalizationAnalysis[]} Analysis results for localization files
 */
export function analyzeLocalizationFiles(files, appBundlePath) {
  const results = [];

  // Find all .strings files in .lproj directories
  const stringsFiles = files.filter(file =>
    file.path.includes('.lproj/') &&
    file.path.endsWith('.strings') &&
    file.path.startsWith(appBundlePath)
  );

  for (const file of stringsFiles) {
    // Extract language code from path (e.g., "en.lproj" -> "en")
    const lprojMatch = file.path.match(/([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)\.lproj\//);
    const language = lprojMatch ? lprojMatch[1] : 'unknown';

    // Detect format (binary plist vs text)
    let format = 'text';
    let hasBinaryPlistFormat = false;

    if (file.data && file.data.length >= 6) {
      // Binary plist starts with "bplist"
      const header = String.fromCharCode(...file.data.slice(0, 6));
      if (header === 'bplist') {
        format = 'binary';
        hasBinaryPlistFormat = true;
      }
    }

    // Calculate comment bytes for text format
    let commentBytes = 0;
    if (format === 'text' && file.data) {
      commentBytes = countCommentBytes(file.data);
    }

    // Calculate potential savings
    // Binary plist is typically 30-50% smaller than text format
    // Comments add 5-20% overhead
    let potentialSavings = 0;
    if (format === 'text') {
      // Converting to binary saves ~40%
      potentialSavings = Math.floor(file.size * 0.4);
      // Add comment removal savings
      potentialSavings += commentBytes;
    } else if (hasBinaryPlistFormat) {
      // Already binary, but could potentially use SmallStrings
      // Estimate 10-20% additional savings
      potentialSavings = Math.floor(file.size * 0.15);
    }

    results.push({
      path: file.path,
      size: file.size,
      format,
      language,
      commentBytes,
      potentialSavings,
      hasBinaryPlistFormat
    });
  }

  return results;
}

/**
 * Count bytes used by comments in a text-format .strings file
 * @param {Uint8Array} data - File data
 * @returns {number} Estimated bytes used by comments
 */
export function countCommentBytes(data) {
  try {
    // Convert to string (handle UTF-8 and UTF-16)
    let text;

    // Check for UTF-16 BOM
    if (data.length >= 2 && data[0] === 0xFF && data[1] === 0xFE) {
      // UTF-16 LE
      const decoder = new TextDecoder('utf-16le');
      text = decoder.decode(data);
    } else if (data.length >= 2 && data[0] === 0xFE && data[1] === 0xFF) {
      // UTF-16 BE
      const decoder = new TextDecoder('utf-16be');
      text = decoder.decode(data);
    } else {
      // Assume UTF-8
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(data);
    }

    let commentBytes = 0;

    // Match C-style comments /* ... */
    const blockComments = text.match(/\/\*[\s\S]*?\*\//g) || [];
    for (const comment of blockComments) {
      commentBytes += new TextEncoder().encode(comment).length;
    }

    // Match // single-line comments
    const lineComments = text.match(/\/\/[^\n]*/g) || [];
    for (const comment of lineComments) {
      commentBytes += new TextEncoder().encode(comment).length;
    }

    return commentBytes;
  } catch (_error) {
    // If we can't parse, return 0
    return 0;
  }
}
