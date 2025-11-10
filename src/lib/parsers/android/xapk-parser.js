/**
 * XAPK Parser - Android
 *
 * Parses XAPK files (ZIP containers with multiple APKs)
 * XAPK format: manifest.json + base.apk + split APKs
 */

import { extractZIP, extractZIPStreaming } from '../common/zip-parser.js';
import { parseAPKFromEntries } from './apk-parser.js';

/**
 * @typedef {import('./types.js').APKParseResult} APKParseResult
 * @typedef {import('../common/zip-parser.js').ZIPEntry} ZIPEntry
 */

/**
 * XAPK manifest structure
 * @typedef {Object} XAPKManifest
 * @property {number} xapk_version - XAPK version
 * @property {string} package_name - Package name
 * @property {string} name - App name
 * @property {string} version_code - Version code
 * @property {string} version_name - Version name
 * @property {Array<{file: string, id: string}>} [split_apks] - Split APKs
 */

/**
 * Parse XAPK file (ZIP container with multiple APKs)
 *
 * XAPK files contain:
 * - manifest.json (metadata)
 * - base.apk (main APK)
 * - split_config.*.apk (feature splits, optional)
 *
 * Uses streaming extraction to reduce memory usage for large files
 * @param {File} file - XAPK file to parse
 * @returns {Promise<APKParseResult>} Parsed APK result
 */
export async function parseXAPK(file) {
  try {
    // Extract XAPK container using streaming to save memory
    // Only extract files we actually need (manifest.json and .apk files)
    const containerEntries = [];

    await extractZIPStreaming(
      file,
      (entry) => {
        // Collect only necessary files
        containerEntries.push(entry);
      },
      {
        // Filter: only extract manifest and APK files
        filter: (name) => name === 'manifest.json' || name.endsWith('.apk'),
      }
    );

    // Find manifest.json
    const manifestEntry = containerEntries.find(
      (e) => e.name === 'manifest.json'
    );

    let manifest = null;
    if (manifestEntry?.data) {
      try {
        const manifestText = new TextDecoder().decode(manifestEntry.data);
        manifest = JSON.parse(manifestText);
      } catch (error) {
        console.warn('Failed to parse XAPK manifest:', error);
      }
    }

    // Find base APK (could be named base.apk, or the first .apk file)
    let baseApkEntry = containerEntries.find(
      (e) => e.name === 'base.apk' || e.name.endsWith('/base.apk')
    );

    // If no base.apk, find first .apk file
    if (!baseApkEntry) {
      baseApkEntry = containerEntries.find((e) => e.name.endsWith('.apk'));
    }

    if (!baseApkEntry) {
      throw new Error('No APK files found in XAPK container');
    }

    // Extract the base APK's contents (it's a ZIP file)
    // Use streaming to avoid loading the entire APK into memory twice
    const baseApkEntries = [];

    // Create a File from the APK data for streaming extraction
    // Note: File constructor requires ArrayBuffer, not SharedArrayBuffer
    // Use slice() to copy data and ensure we have a regular ArrayBuffer
    const baseApkFile = new File([baseApkEntry.data.slice()], baseApkEntry.name, {
      type: 'application/vnd.android.package-archive',
    });

    // Extract base APK using streaming
    await extractZIPStreaming(
      baseApkFile,
      (entry) => {
        baseApkEntries.push(entry);
      }
    );

    // Parse the base APK from already-extracted entries (no double extraction)
    const baseApkResult = await parseAPKFromEntries(baseApkEntries, baseApkEntry.size);

    // Aggregate sizes from all APKs in the container
    const allApkEntries = containerEntries.filter((e) => e.name.endsWith('.apk'));

    // Calculate total install size from all APKs
    const totalInstallSize = allApkEntries.reduce((sum, entry) => sum + entry.size, 0);
    const totalDownloadSize = file.size; // XAPK file size

    // Collect all DEX files across splits
    const allDexFiles = baseApkResult.dexFiles;

    // Collect all native libs across splits
    const allNativeLibs = baseApkResult.nativeLibs;

    // Collect all resources across splits
    const allResources = baseApkResult.resources;

    // Return aggregated result
    return {
      ...baseApkResult,
      totalSize: totalInstallSize,
      installSize: totalInstallSize,
      downloadSize: totalDownloadSize,
      dexFiles: allDexFiles,
      nativeLibs: allNativeLibs,
      resources: allResources,
      // Add XAPK-specific metadata if manifest was found
      metadata: manifest
        ? (() => {
            const updatedMetadata = {
              ...baseApkResult.metadata,
              packageName: manifest.package_name,
              versionName: manifest.version_name,
              versionCode: parseInt(manifest.version_code, 10),
            };
            // Only add applicationLabel if it exists (exactOptionalPropertyTypes compliance)
            const label = manifest.name || baseApkResult.metadata.applicationLabel;
            if (label) {
              updatedMetadata.applicationLabel = label;
            }
            return updatedMetadata;
          })()
        : baseApkResult.metadata,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse XAPK: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a file is an XAPK based on its contents
 * @param {File} file - File to check
 * @returns {Promise<boolean>} True if file is an XAPK
 */
export async function isXAPK(file) {
  try {
    // Check file extension first
    if (!file.name.toLowerCase().endsWith('.xapk')) {
      return false;
    }

    // Try to extract and check for manifest.json
    const entries = await extractZIP(file);
    const hasManifest = entries.some((e) => e.name === 'manifest.json');
    const hasApk = entries.some((e) => e.name.endsWith('.apk'));

    return hasManifest && hasApk;
  } catch {
    return false;
  }
}
