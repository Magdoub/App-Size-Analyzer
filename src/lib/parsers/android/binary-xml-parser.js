/**
 * Binary XML Parser - Android
 *
 * Parses binary XML files (AndroidManifest.xml) from APK/AAB archives
 */

/**
 * Android Manifest metadata
 * @typedef {Object} AndroidManifestMetadata
 * @property {string} packageName - Package name
 * @property {string} versionName - Version name
 * @property {number} versionCode - Version code
 * @property {number} minSdkVersion - Minimum SDK version
 * @property {number} targetSdkVersion - Target SDK version
 * @property {string} [applicationLabel] - Application label
 * @property {string[]} permissions - Permissions
 * @property {string[]} activities - Activities
 * @property {string[]} services - Services
 * @property {string[]} usesFeatures - Used features
 */

/**
 * Parse binary XML manifest
 *
 * Note: Full binary XML parsing requires handling Android's specific binary format.
 * This implementation provides a foundation for app-info-parser integration.
 * @param {Uint8Array} data - Binary XML data
 * @returns {Promise<Record<string, unknown>>} Parsed manifest data
 */
export async function parseBinaryXML(data) {
  // Binary XML format uses:
  // - String pool for deduplication
  // - Resource IDs for system attributes
  // - Compressed structure

  // For now, we'll rely on app-info-parser for the heavy lifting
  // This is a placeholder for the structure

  try {
    // TODO: Integrate app-info-parser's manifest parser
    // Reference: https://github.com/chenquincy/app-info-parser

    // Basic validation
    if (data.length < 8) {
      throw new Error('File too small to be valid binary XML');
    }

    // Check magic bytes (binary XML starts with 0x03000800)
    const view = new DataView(data.buffer, data.byteOffset, Math.min(data.byteLength, 4));
    const magic = view.getUint32(0, true); // Little endian

    if (magic !== 0x00080003) {
      throw new Error('Invalid binary XML magic bytes');
    }

    // Return empty object for now - will be populated by app-info-parser
    return {};
  } catch (error) {
    throw new Error(
      `Failed to parse binary XML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract manifest metadata from parsed XML
 * @param {Record<string, unknown>} manifestData - Parsed manifest data
 * @returns {AndroidManifestMetadata} Manifest metadata
 */
export function extractManifestMetadata(manifestData) {
  // This will extract metadata from app-info-parser output
  // For now, return defaults

  // Build base metadata object
  const metadata = {
    packageName: String(manifestData['package'] || 'unknown'),
    versionName: String(manifestData['versionName'] || '0.0.0'),
    versionCode: Number(manifestData['versionCode'] || 0),
    minSdkVersion: Number(manifestData['minSdkVersion'] || 0),
    targetSdkVersion: Number(manifestData['targetSdkVersion'] || 0),
    permissions: Array.isArray(manifestData['permissions'])
      ? manifestData['permissions'].map(String)
      : [],
    activities: [],
    services: [],
    usesFeatures: [],
  };

  // Only add applicationLabel if it exists (exactOptionalPropertyTypes requirement)
  if (manifestData['applicationLabel']) {
    metadata.applicationLabel = String(manifestData['applicationLabel']);
  }

  return metadata;
}
