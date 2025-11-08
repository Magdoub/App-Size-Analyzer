/**
 * APK Parser - Android
 *
 * Main parser that integrates all Android-specific parsers to analyze APK/AAB files
 */

import { extractZIP, type ZIPEntry } from '../common/zip-parser';
import { parseBinaryXML, extractManifestMetadata } from './binary-xml-parser';
import { parseDEXFile, calculateTotalMethodCount } from './dex-parser';
import { parseResourceTable } from './arsc-parser';
import type { APKParseResult, AndroidNativeLib, AndroidResource } from './types';

/**
 * Parse APK file and extract all metadata
 */
export async function parseAPK(file: File): Promise<APKParseResult> {
  // Extract ZIP contents
  const entries = await extractZIP(file);

  return parseAPKFromEntries(entries, file.size);
}

/**
 * Parse APK from already-extracted ZIP entries
 * Used by XAPK parser to avoid double extraction
 */
export async function parseAPKFromEntries(
  entries: ZIPEntry[],
  originalFileSize: number
): Promise<APKParseResult> {
  // Parse AndroidManifest.xml
  const manifestEntry = entries.find((e) => e.name === 'AndroidManifest.xml');

  if (!manifestEntry?.data) {
    throw new Error('Invalid APK: AndroidManifest.xml not found');
  }

  let manifestData;
  try {
    manifestData = await parseBinaryXML(manifestEntry.data);
  } catch (error) {
    throw new Error(`Failed to parse AndroidManifest.xml: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const metadata = extractManifestMetadata(manifestData);

  // Parse DEX files
  const dexFiles = parseDEXFiles(entries);
  const totalMethodCount = calculateTotalMethodCount(dexFiles);

  // Parse native libraries
  const nativeLibs = parseNativeLibs(entries);

  // Parse resources
  const resources = parseResources(entries);

  // Parse resource table
  let resourceTable;
  const resourceTableEntry = entries.find((e) => e.name === 'resources.arsc');
  if (resourceTableEntry?.data) {
    try {
      resourceTable = parseResourceTable(resourceTableEntry.data);
    } catch (error) {
      console.warn('Failed to parse resources.arsc:', error);
    }
  }

  // Extract assets
  const assets = extractAssets(entries);

  // Extract architectures
  const architectures = extractArchitectures(nativeLibs);

  // Calculate sizes
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  const downloadSize = originalFileSize; // Use original file size for download size

  // Build result object with exactOptionalPropertyTypes compliance
  const result: APKParseResult = {
    metadata,
    dexFiles,
    nativeLibs,
    resources,
    assets,
    architectures,
    totalMethodCount,
    totalSize,
    downloadSize,
    installSize: totalSize,
  };

  // Only add resourceTable if it exists
  if (resourceTable !== undefined) {
    result.resourceTable = resourceTable;
  }

  return result;
}

/**
 * Parse all DEX files in APK
 */
function parseDEXFiles(entries: ZIPEntry[]) {
  const dexFiles = [];

  // Find all .dex files (classes.dex, classes2.dex, etc.)
  const dexEntries = entries.filter((e) => e.name.match(/^classes\d*\.dex$/));

  for (const entry of dexEntries) {
    if (!entry.data) continue;

    try {
      const dexMetadata = parseDEXFile(entry.data);
      dexFiles.push(dexMetadata);
    } catch (error) {
      console.warn(`Failed to parse ${entry.name}:`, error);
    }
  }

  return dexFiles;
}

/**
 * Parse native libraries from lib/ directory
 */
function parseNativeLibs(entries: ZIPEntry[]): AndroidNativeLib[] {
  const libs: AndroidNativeLib[] = [];

  // Native libs are in lib/<arch>/*.so
  const libEntries = entries.filter((e) => e.name.startsWith('lib/') && e.name.endsWith('.so'));

  for (const entry of libEntries) {
    const match = entry.name.match(/lib\/([^/]+)\/(.+\.so)$/);
    if (!match) continue;

    const architecture = match[1] || '';
    const name = match[2] || '';

    libs.push({
      name,
      path: entry.name,
      size: entry.size,
      architecture,
      isSystem: false,
    });
  }

  return libs;
}

/**
 * Parse resources from res/ directory
 */
function parseResources(entries: ZIPEntry[]): AndroidResource[] {
  const resources: AndroidResource[] = [];

  const resourceEntries = entries.filter((e) => e.name.startsWith('res/'));

  for (const entry of resourceEntries) {
    // res/<type>[-<config>]/<filename>
    const match = entry.name.match(/res\/([^/-]+)(?:-([^/]+))?\/(.+)$/);
    if (!match) continue;

    const typeStr = match[1] || '';
    const config = match[2];
    const name = match[3] || '';

    let type: AndroidResource['type'] = 'other';
    if (typeStr.startsWith('drawable')) type = 'drawable';
    else if (typeStr === 'layout') type = 'layout';
    else if (typeStr === 'raw') type = 'raw';
    else if (typeStr === 'xml') type = 'xml';
    else if (typeStr.startsWith('values')) type = 'values';

    // Extract density from config (e.g., hdpi, xhdpi, xxhdpi)
    const density = config?.match(/(l|m|h|xh|xxh|xxxh)dpi/)?.[0];

    // Build resource object with exactOptionalPropertyTypes compliance
    const resource: AndroidResource = {
      path: entry.name,
      name,
      type,
      size: entry.size,
    };

    // Only add optional properties if they exist
    if (config !== undefined) {
      resource.config = config;
    }
    if (density !== undefined) {
      resource.density = density;
    }

    resources.push(resource);
  }

  return resources;
}

/**
 * Extract assets from assets/ directory
 */
function extractAssets(entries: ZIPEntry[]): { path: string; size: number }[] {
  return entries
    .filter((e) => e.name.startsWith('assets/'))
    .map((e) => ({
      path: e.name,
      size: e.size,
    }));
}

/**
 * Extract all architectures from native libraries
 */
function extractArchitectures(nativeLibs: AndroidNativeLib[]): string[] {
  const architectures = new Set<string>();

  for (const lib of nativeLibs) {
    architectures.add(lib.architecture);
  }

  return Array.from(architectures);
}
