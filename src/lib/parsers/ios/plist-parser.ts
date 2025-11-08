/**
 * Binary Plist Parser - iOS
 *
 * Parses binary plist files from IPA archives to extract metadata
 */

import { parse } from '@plist/plist';

export interface PlistData {
  [key: string]: unknown;
}

/**
 * Parse a binary plist file into a JavaScript object
 */
export async function parseBinaryPlist(data: Uint8Array): Promise<PlistData> {
  try {
    // @plist/plist handles both binary and XML plists
    // Use slice() to ensure we have a clean buffer starting at offset 0
    // This works in all contexts (main thread, workers, any buffer type)
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    // Type assertion needed because buffer can be SharedArrayBuffer in some contexts
    const result = parse(buffer as ArrayBuffer);

    if (typeof result !== 'object' || result === null) {
      throw new Error('Parsed plist is not an object');
    }

    return result as PlistData;
  } catch (error) {
    throw new Error(
      `Failed to parse binary plist: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract Info.plist metadata from IPA
 */
export interface InfoPlistMetadata {
  bundleId: string;
  version: string;
  displayName: string;
  minimumOSVersion?: string;
  supportedPlatforms?: string[];
  deviceFamily?: number[];
  architectures?: string[];
}

export function extractInfoPlistMetadata(plist: PlistData): InfoPlistMetadata {
  const bundleId = String(plist['CFBundleIdentifier'] || 'unknown');
  const version = String(plist['CFBundleShortVersionString'] || plist['CFBundleVersion'] || '0.0.0');
  const displayName = String(plist['CFBundleDisplayName'] || plist['CFBundleName'] || 'Unknown App');

  const metadata: InfoPlistMetadata = {
    bundleId,
    version,
    displayName,
  };

  // Add optional properties only if they exist
  if (plist['MinimumOSVersion']) {
    metadata.minimumOSVersion = String(plist['MinimumOSVersion']);
  }

  if (Array.isArray(plist['CFBundleSupportedPlatforms'])) {
    metadata.supportedPlatforms = (plist['CFBundleSupportedPlatforms'] as unknown[]).map(String);
  }

  if (Array.isArray(plist['UIDeviceFamily'])) {
    metadata.deviceFamily = plist['UIDeviceFamily'] as number[];
  }

  if (Array.isArray(plist['UIRequiredDeviceCapabilities'])) {
    metadata.architectures = (plist['UIRequiredDeviceCapabilities'] as unknown[]).map(String);
  }

  return metadata;
}
