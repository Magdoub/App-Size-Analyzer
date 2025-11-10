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
  const bundleId = String(plist['CFBundleIdentifier'] || 'unknown');
  const version = String(plist['CFBundleShortVersionString'] || plist['CFBundleVersion'] || '0.0.0');
  const displayName = String(plist['CFBundleDisplayName'] || plist['CFBundleName'] || 'Unknown App');

  const metadata = {
    bundleId,
    version,
    displayName,
  };

  // Add optional properties only if they exist
  if (plist['MinimumOSVersion']) {
    metadata.minimumOSVersion = String(plist['MinimumOSVersion']);
  }

  if (Array.isArray(plist['CFBundleSupportedPlatforms'])) {
    metadata.supportedPlatforms = plist['CFBundleSupportedPlatforms'].map(String);
  }

  if (Array.isArray(plist['UIDeviceFamily'])) {
    metadata.deviceFamily = plist['UIDeviceFamily'];
  }

  if (Array.isArray(plist['UIRequiredDeviceCapabilities'])) {
    metadata.architectures = plist['UIRequiredDeviceCapabilities'].map(String);
  }

  return metadata;
}
