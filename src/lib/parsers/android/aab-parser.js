/**
 * AAB Parser - Android App Bundle Parser
 *
 * Parses .aab files to extract metadata, modules, and content breakdown.
 * Uses protobuf.js for manifest parsing (AAB uses Protocol Buffers for AndroidManifest.xml).
 *
 * @module lib/parsers/android/aab-parser
 */

import { extractZIP } from '../common/zip-parser';
import { detectContentType, detectArchitecture } from '../common/types';
import { parseManifestProto, extractManifestMetadata } from './proto/resources-proto';

/**
 * @typedef {import('./types').AABParseResult} AABParseResult
 * @typedef {import('./types').AABMetadata} AABMetadata
 * @typedef {import('./types').AABModule} AABModule
 */

/**
 * AAB content category IDs
 */
const AAB_CATEGORIES = {
  DEX: 'dex',
  RESOURCES: 'resources',
  ASSETS: 'assets',
  NATIVE: 'native',
  CONFIG: 'config',
  OTHER: 'other',
};

/**
 * Parse an Android App Bundle file
 * @param {File} file - AAB file to parse
 * @param {Object} [options] - Parsing options
 * @param {function} [options.onProgress] - Progress callback
 * @returns {Promise<AABParseResult>} Parse result
 */
export async function parseAAB(file, options = {}) {
  const { onProgress } = options;

  // Report progress: extracting
  if (onProgress) {
    onProgress({
      state: 'EXTRACTING',
      progress: 0,
      message: 'Extracting AAB contents...',
      filesProcessed: 0,
      totalFiles: 0,
    });
  }

  // Extract ZIP contents
  const entries = await extractZIP(file);

  // Validate AAB structure
  if (!isValidAAB(entries)) {
    throw new Error('Invalid AAB: Missing base module or manifest');
  }

  // Report progress: parsing
  if (onProgress) {
    onProgress({
      state: 'PARSING',
      progress: 30,
      message: 'Parsing manifest...',
      filesProcessed: 0,
      totalFiles: entries.length,
    });
  }

  // Extract metadata from manifest
  const metadata = await extractAABMetadata(entries);

  // Report progress: categorizing
  if (onProgress) {
    onProgress({
      state: 'CATEGORIZING',
      progress: 50,
      message: 'Analyzing modules and content...',
      filesProcessed: 0,
      totalFiles: entries.length,
    });
  }

  // Detect modules
  const modules = detectModules(entries);

  // Categorize all files
  const files = entries.map((entry) => ({
    path: entry.name,
    size: entry.size,
    compressedSize: entry.compressedSize,
    contentType: categorizeAABContent(entry.name),
  }));

  // Build breakdown
  const breakdown = buildBreakdown(files);

  // Extract architectures from native libraries
  const architectures = extractArchitectures(entries);

  // Calculate sizes
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  const downloadSize = entries.reduce((sum, e) => sum + e.compressedSize, 0);

  // Report progress: complete
  if (onProgress) {
    onProgress({
      state: 'COMPLETE',
      progress: 100,
      message: 'Analysis complete',
      filesProcessed: entries.length,
      totalFiles: entries.length,
    });
  }

  return {
    format: 'aab',
    fileName: file.name,
    fileSize: file.size,
    metadata,
    modules,
    files,
    breakdown,
    architectures,
    totalSize,
    downloadSize,
    installSize: totalSize,
  };
}

/**
 * Validate that entries represent a valid AAB file
 * @param {Array} entries - ZIP entries
 * @returns {boolean} True if valid AAB
 */
export function isValidAAB(entries) {
  // Must have base module directory
  const hasBaseModule = entries.some(
    (e) => e.name.startsWith('base/') || e.name === 'base'
  );

  if (!hasBaseModule) {
    return false;
  }

  // Must have manifest (though it may fail to parse)
  const hasManifest = entries.some(
    (e) =>
      e.name === 'base/manifest/AndroidManifest.xml' ||
      e.name.includes('/manifest/AndroidManifest.xml')
  );

  return hasManifest;
}

/**
 * Extract metadata from AAB manifest
 * @param {Array} entries - ZIP entries
 * @returns {Promise<AABMetadata>} Extracted metadata
 */
async function extractAABMetadata(entries) {
  // Find manifest in base module
  const manifestEntry = entries.find(
    (e) => e.name === 'base/manifest/AndroidManifest.xml'
  );

  if (!manifestEntry || !manifestEntry.data) {
    // Return default metadata if manifest not found
    return {
      packageName: 'unknown',
      versionCode: 0,
      versionName: '0.0.0',
      minSdkVersion: null,
      targetSdkVersion: null,
      permissions: [],
    };
  }

  try {
    // Parse protobuf manifest
    const manifestNode = parseManifestProto(manifestEntry.data);
    const metadata = extractManifestMetadata(manifestNode);

    return {
      packageName: metadata.packageName || 'unknown',
      versionCode: metadata.versionCode || 0,
      versionName: metadata.versionName || '0.0.0',
      minSdkVersion: metadata.minSdkVersion,
      targetSdkVersion: metadata.targetSdkVersion,
      permissions: metadata.permissions || [],
    };
  } catch (error) {
    console.warn('Failed to parse AAB manifest:', error);

    // Return default metadata on parse failure
    return {
      packageName: 'unknown',
      versionCode: 0,
      versionName: '0.0.0',
      minSdkVersion: null,
      targetSdkVersion: null,
      permissions: [],
    };
  }
}

/**
 * Detect modules in AAB
 * @param {Array} entries - ZIP entries
 * @returns {AABModule[]} List of modules
 */
function detectModules(entries) {
  // Find all module directories (base + feature modules)
  const moduleNames = new Set();

  for (const entry of entries) {
    // Extract module name from path
    const parts = entry.name.split('/');
    if (parts.length > 0 && parts[0]) {
      // Filter out non-module directories
      if (
        parts[0] !== 'META-INF' &&
        parts[0] !== 'BUNDLE-METADATA' &&
        !parts[0].endsWith('.pb')
      ) {
        moduleNames.add(parts[0]);
      }
    }
  }

  // Build module objects
  const modules = [];

  for (const moduleName of moduleNames) {
    const moduleEntries = entries.filter((e) =>
      e.name.startsWith(moduleName + '/')
    );

    // Calculate module contents
    const contents = {
      dexSize: 0,
      dexCount: 0,
      resourcesSize: 0,
      assetsSize: 0,
      nativeSize: 0,
      architectures: new Set(),
    };

    let totalSize = 0;

    for (const entry of moduleEntries) {
      totalSize += entry.size;
      const category = categorizeAABContent(entry.name);

      switch (category) {
        case AAB_CATEGORIES.DEX:
          contents.dexSize += entry.size;
          contents.dexCount++;
          break;
        case AAB_CATEGORIES.RESOURCES:
          contents.resourcesSize += entry.size;
          break;
        case AAB_CATEGORIES.ASSETS:
          contents.assetsSize += entry.size;
          break;
        case AAB_CATEGORIES.NATIVE:
          contents.nativeSize += entry.size;
          // Detect architecture
          const arch = detectArchitecture(entry.name);
          if (arch) {
            contents.architectures.add(arch);
          }
          break;
      }
    }

    modules.push({
      name: moduleName,
      isBase: moduleName === 'base',
      size: totalSize,
      contents: {
        dexSize: contents.dexSize,
        dexCount: contents.dexCount,
        resourcesSize: contents.resourcesSize,
        assetsSize: contents.assetsSize,
        nativeSize: contents.nativeSize,
        architectures: Array.from(contents.architectures),
      },
    });
  }

  // Sort with base module first
  modules.sort((a, b) => {
    if (a.isBase) return -1;
    if (b.isBase) return 1;
    return a.name.localeCompare(b.name);
  });

  return modules;
}

/**
 * Categorize AAB content by file path
 * @param {string} path - File path within AAB
 * @returns {string} Category ID
 */
export function categorizeAABContent(path) {
  const pathLower = path.toLowerCase();

  // DEX files
  if (pathLower.includes('/dex/') && pathLower.endsWith('.dex')) {
    return AAB_CATEGORIES.DEX;
  }

  // Resources
  if (pathLower.includes('/res/')) {
    return AAB_CATEGORIES.RESOURCES;
  }

  // Assets
  if (pathLower.includes('/assets/')) {
    return AAB_CATEGORIES.ASSETS;
  }

  // Native libraries
  if (pathLower.includes('/lib/') && pathLower.endsWith('.so')) {
    return AAB_CATEGORIES.NATIVE;
  }

  // Config/metadata files
  if (
    pathLower.endsWith('.pb') ||
    pathLower.includes('/manifest/') ||
    pathLower.startsWith('meta-inf/')
  ) {
    return AAB_CATEGORIES.CONFIG;
  }

  return AAB_CATEGORIES.OTHER;
}

/**
 * Build size breakdown from categorized files
 * @param {Array} files - Categorized file entries
 * @returns {Object} Breakdown with categories
 */
function buildBreakdown(files) {
  const categoryMap = new Map();

  // Initialize categories
  const categoryInfo = {
    [AAB_CATEGORIES.DEX]: { name: 'Code (DEX)', color: '#4CAF50' },
    [AAB_CATEGORIES.RESOURCES]: { name: 'Resources', color: '#2196F3' },
    [AAB_CATEGORIES.ASSETS]: { name: 'Assets', color: '#FF9800' },
    [AAB_CATEGORIES.NATIVE]: { name: 'Native Libraries', color: '#9C27B0' },
    [AAB_CATEGORIES.CONFIG]: { name: 'Configuration', color: '#607D8B' },
    [AAB_CATEGORIES.OTHER]: { name: 'Other', color: '#9E9E9E' },
  };

  for (const id of Object.values(AAB_CATEGORIES)) {
    categoryMap.set(id, {
      id,
      name: categoryInfo[id].name,
      color: categoryInfo[id].color,
      size: 0,
      count: 0,
      files: [],
    });
  }

  // Categorize files
  let totalSize = 0;

  for (const file of files) {
    const category = categoryMap.get(file.contentType) || categoryMap.get(AAB_CATEGORIES.OTHER);
    category.size += file.size;
    category.count++;
    category.files.push(file);
    totalSize += file.size;
  }

  // Calculate percentages and convert to array
  const categories = [];

  for (const [id, category] of categoryMap) {
    if (category.count > 0) {
      categories.push({
        ...category,
        percentage: totalSize > 0 ? (category.size / totalSize) * 100 : 0,
      });
    }
  }

  // Sort by size descending
  categories.sort((a, b) => b.size - a.size);

  return {
    categories,
    totalSize,
  };
}

/**
 * Extract unique architectures from native libraries
 * @param {Array} entries - ZIP entries
 * @returns {string[]} List of architectures
 */
function extractArchitectures(entries) {
  const architectures = new Set();

  for (const entry of entries) {
    if (entry.name.includes('/lib/') && entry.name.endsWith('.so')) {
      const arch = detectArchitecture(entry.name);
      if (arch) {
        architectures.add(arch);
      }
    }
  }

  return Array.from(architectures).sort();
}

// Export for testing
export { AAB_CATEGORIES };
