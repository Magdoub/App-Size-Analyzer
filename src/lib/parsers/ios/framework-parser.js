/**
 * Framework Parser - iOS/macOS Framework Bundle Parser
 *
 * Parses zipped .framework bundles to extract metadata, architectures, and content breakdown.
 * Supports both iOS flat structure and macOS versioned structure.
 *
 * @module lib/parsers/ios/framework-parser
 */

import { extractZIP } from '../common/zip-parser';
import { detectContentType } from '../common/types';
import { parseBinaryPlist } from './plist-parser';
import { parseMachOHeader, parseFatHeader } from './macho-parser';

/**
 * @typedef {import('./types').FrameworkParseResult} FrameworkParseResult
 * @typedef {import('./types').FrameworkMetadata} FrameworkMetadata
 * @typedef {import('./types').ArchitectureSlice} ArchitectureSlice
 */

/**
 * Framework content category IDs
 */
const FRAMEWORK_CATEGORIES = {
  BINARY: 'binary',
  HEADERS: 'headers',
  MODULES: 'modules',
  RESOURCES: 'resources',
  METADATA: 'metadata',
  FRAMEWORKS: 'frameworks',
  OTHER: 'other',
};

/**
 * Parse a zipped iOS/macOS framework bundle
 * @param {File} file - Zipped framework to parse
 * @param {Object} [options] - Parsing options
 * @param {function} [options.onProgress] - Progress callback
 * @returns {Promise<FrameworkParseResult>} Parse result
 */
export async function parseFramework(file, options = {}) {
  const { onProgress } = options;

  // Report progress: extracting
  if (onProgress) {
    onProgress({
      state: 'EXTRACTING',
      progress: 0,
      message: 'Extracting framework contents...',
      filesProcessed: 0,
      totalFiles: 0,
    });
  }

  // Extract ZIP contents
  const entries = await extractZIP(file);

  // Validate framework structure
  const frameworkInfo = findFrameworkRoot(entries);
  if (!frameworkInfo) {
    throw new Error('Invalid framework: No .framework directory found in ZIP');
  }

  const { rootPath, isVersioned } = frameworkInfo;

  // Report progress: parsing
  if (onProgress) {
    onProgress({
      state: 'PARSING',
      progress: 30,
      message: 'Parsing Info.plist...',
      filesProcessed: 0,
      totalFiles: entries.length,
    });
  }

  // Extract metadata from Info.plist
  const metadata = await extractFrameworkMetadata(entries, rootPath, isVersioned);

  // Report progress: analyzing binary
  if (onProgress) {
    onProgress({
      state: 'PARSING',
      progress: 50,
      message: 'Analyzing binary architectures...',
      filesProcessed: 0,
      totalFiles: entries.length,
    });
  }

  // Parse main binary for architecture info
  const architectures = await parseArchitectures(entries, rootPath, metadata.bundleExecutable, isVersioned);

  // Report progress: categorizing
  if (onProgress) {
    onProgress({
      state: 'CATEGORIZING',
      progress: 70,
      message: 'Categorizing content...',
      filesProcessed: 0,
      totalFiles: entries.length,
    });
  }

  // Categorize all files
  const files = entries.map((entry) => ({
    path: entry.name,
    size: entry.size,
    compressedSize: entry.compressedSize,
    contentType: categorizeFrameworkContent(entry.name, rootPath, metadata.bundleExecutable),
  }));

  // Build breakdown
  const breakdown = buildBreakdown(files);

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
    format: 'framework',
    fileName: file.name,
    fileSize: file.size,
    metadata: {
      ...metadata,
      isVersioned,
    },
    architectures,
    files,
    breakdown,
    totalSize,
    downloadSize,
    installSize: totalSize,
  };
}

/**
 * Find the framework root path in ZIP entries
 * @param {Array} entries - ZIP entries
 * @returns {Object|null} Framework info or null if not found
 */
function findFrameworkRoot(entries) {
  for (const entry of entries) {
    // Look for .framework directory
    const match = entry.name.match(/^([^/]*\.framework)\//);
    if (match) {
      const rootPath = match[1];

      // Check if it's versioned (macOS style)
      const isVersioned = entries.some((e) =>
        e.name.startsWith(`${rootPath}/Versions/`)
      );

      return { rootPath, isVersioned };
    }

    // Also check one level deep
    const deepMatch = entry.name.match(/^[^/]+\/([^/]*\.framework)\//);
    if (deepMatch) {
      const rootPath = `${entry.name.split('/')[0]}/${deepMatch[1]}`;

      const isVersioned = entries.some((e) =>
        e.name.startsWith(`${rootPath}/Versions/`)
      );

      return { rootPath, isVersioned };
    }
  }

  return null;
}

/**
 * Validate that entries represent a valid framework
 * @param {Array} entries - ZIP entries
 * @returns {boolean} True if valid framework
 */
export function isValidFramework(entries) {
  const frameworkInfo = findFrameworkRoot(entries);
  if (!frameworkInfo) {
    return false;
  }

  const { rootPath, isVersioned } = frameworkInfo;

  // Must have Info.plist
  let hasInfoPlist = false;

  if (isVersioned) {
    // macOS: Info.plist in Versions/X/Resources/
    hasInfoPlist = entries.some((e) =>
      e.name.match(new RegExp(`^${rootPath}/Versions/[^/]+/Resources/Info\\.plist$`))
    );
  } else {
    // iOS: Info.plist at root
    hasInfoPlist = entries.some((e) => e.name === `${rootPath}/Info.plist`);
  }

  return hasInfoPlist;
}

/**
 * Extract metadata from Info.plist
 * @param {Array} entries - ZIP entries
 * @param {string} rootPath - Framework root path
 * @param {boolean} isVersioned - Whether macOS versioned structure
 * @returns {Promise<FrameworkMetadata>} Extracted metadata
 */
async function extractFrameworkMetadata(entries, rootPath, isVersioned) {
  // Find Info.plist
  let plistEntry;

  if (isVersioned) {
    // macOS: find in Versions/X/Resources/
    plistEntry = entries.find((e) =>
      e.name.match(new RegExp(`^${rootPath}/Versions/[^/]+/Resources/Info\\.plist$`))
    );
  } else {
    // iOS: at framework root
    plistEntry = entries.find((e) => e.name === `${rootPath}/Info.plist`);
  }

  const defaultMetadata = {
    bundleIdentifier: 'unknown',
    bundleName: rootPath.replace('.framework', '').split('/').pop() || 'Unknown',
    bundleExecutable: rootPath.replace('.framework', '').split('/').pop() || 'Unknown',
    version: '0.0.0',
    buildVersion: '1',
    minimumOSVersion: null,
    platformName: null,
    isVersioned,
  };

  if (!plistEntry || !plistEntry.data) {
    return defaultMetadata;
  }

  try {
    const plist = await parseBinaryPlist(plistEntry.data);

    return {
      bundleIdentifier: String(plist['CFBundleIdentifier'] || 'unknown'),
      bundleName: String(plist['CFBundleName'] || defaultMetadata.bundleName),
      bundleExecutable: String(plist['CFBundleExecutable'] || defaultMetadata.bundleExecutable),
      version: String(plist['CFBundleShortVersionString'] || plist['CFBundleVersion'] || '0.0.0'),
      buildVersion: String(plist['CFBundleVersion'] || '1'),
      minimumOSVersion: plist['MinimumOSVersion'] ? String(plist['MinimumOSVersion']) : null,
      platformName: plist['DTPlatformName'] ? String(plist['DTPlatformName']) : null,
      isVersioned,
    };
  } catch (error) {
    console.warn('Failed to parse framework Info.plist:', error);
    return defaultMetadata;
  }
}

/**
 * Parse architectures from main binary
 * @param {Array} entries - ZIP entries
 * @param {string} rootPath - Framework root path
 * @param {string} executableName - Main executable name
 * @param {boolean} isVersioned - Whether macOS versioned structure
 * @returns {Promise<ArchitectureSlice[]>} Architecture slices
 */
async function parseArchitectures(entries, rootPath, executableName, isVersioned) {
  // Find main binary
  let binaryEntry;

  if (isVersioned) {
    // macOS: binary in Versions/X/
    binaryEntry = entries.find((e) =>
      e.name.match(new RegExp(`^${rootPath}/Versions/[^/]+/${executableName}$`))
    );
  } else {
    // iOS: binary at framework root
    binaryEntry = entries.find((e) => e.name === `${rootPath}/${executableName}`);
  }

  if (!binaryEntry || !binaryEntry.data) {
    return [];
  }

  try {
    const data = binaryEntry.data;

    // Check for fat/universal binary
    if (data.length >= 8) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const magic = view.getUint32(0, false);

      // Fat binary magic
      if (magic === 0xcafebabe || magic === 0xbebafeca) {
        return parseFatBinary(data);
      }
    }

    // Single architecture
    const header = parseMachOHeader(data);
    return [
      {
        name: header.architecture,
        cputype: header.cputype,
        cpusubtype: header.cpusubtype,
        offset: 0,
        size: data.length,
      },
    ];
  } catch (error) {
    console.warn('Failed to parse framework binary:', error);
    return [];
  }
}

/**
 * Parse a fat/universal binary for architecture slices
 * @param {Uint8Array} data - Binary data
 * @returns {ArchitectureSlice[]} Architecture slices
 */
function parseFatBinary(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const magic = view.getUint32(0, false);

  // Determine endianness
  const bigEndian = magic === 0xcafebabe;

  // Number of architectures
  const nfat = bigEndian ? view.getUint32(4, false) : view.getUint32(4, true);

  const slices = [];

  for (let i = 0; i < nfat; i++) {
    const offset = 8 + i * 20;

    const cputype = bigEndian ? view.getInt32(offset, false) : view.getInt32(offset, true);
    const cpusubtype = bigEndian
      ? view.getInt32(offset + 4, false)
      : view.getInt32(offset + 4, true);
    const sliceOffset = bigEndian
      ? view.getUint32(offset + 8, false)
      : view.getUint32(offset + 8, true);
    const sliceSize = bigEndian
      ? view.getUint32(offset + 12, false)
      : view.getUint32(offset + 12, true);

    slices.push({
      name: getArchitectureName(cputype, cpusubtype),
      cputype,
      cpusubtype,
      offset: sliceOffset,
      size: sliceSize,
    });
  }

  return slices;
}

/**
 * Get architecture name from CPU type and subtype
 * @param {number} cputype - CPU type
 * @param {number} cpusubtype - CPU subtype
 * @returns {string} Architecture name
 */
function getArchitectureName(cputype, cpusubtype) {
  // CPU_TYPE_ARM64 = 0x0100000C
  if (cputype === 0x0100000c) {
    if (cpusubtype === 2) return 'arm64e';
    return 'arm64';
  }

  // CPU_TYPE_X86_64 = 0x01000007
  if (cputype === 0x01000007) {
    return 'x86_64';
  }

  // CPU_TYPE_ARM = 12
  if (cputype === 12) {
    return 'armv7';
  }

  // CPU_TYPE_I386 = 7
  if (cputype === 7) {
    return 'i386';
  }

  return `unknown_${cputype}`;
}

/**
 * Categorize framework content by file path
 * @param {string} path - File path within ZIP
 * @param {string} [rootPath] - Framework root path
 * @param {string} [executableName] - Main executable name
 * @returns {string} Category ID
 */
export function categorizeFrameworkContent(path, rootPath = '', executableName = '') {
  const pathLower = path.toLowerCase();

  // Main binary or dylibs
  if (executableName && path.endsWith(`/${executableName}`)) {
    return FRAMEWORK_CATEGORIES.BINARY;
  }
  if (pathLower.endsWith('.dylib')) {
    return FRAMEWORK_CATEGORIES.BINARY;
  }

  // Headers
  if (pathLower.includes('/headers/') || pathLower.includes('/privateheaders/')) {
    return FRAMEWORK_CATEGORIES.HEADERS;
  }
  if (pathLower.endsWith('.h') || pathLower.endsWith('.hpp')) {
    return FRAMEWORK_CATEGORIES.HEADERS;
  }

  // Modules
  if (pathLower.includes('/modules/')) {
    return FRAMEWORK_CATEGORIES.MODULES;
  }
  if (
    pathLower.endsWith('.modulemap') ||
    pathLower.endsWith('.swiftmodule') ||
    pathLower.endsWith('.swiftinterface') ||
    pathLower.endsWith('.swiftdoc')
  ) {
    return FRAMEWORK_CATEGORIES.MODULES;
  }

  // Resources
  if (pathLower.includes('/resources/')) {
    return FRAMEWORK_CATEGORIES.RESOURCES;
  }
  if (pathLower.includes('.lproj/')) {
    return FRAMEWORK_CATEGORIES.RESOURCES;
  }
  if (pathLower.endsWith('.car') || pathLower.endsWith('.nib') || pathLower.endsWith('.storyboardc')) {
    return FRAMEWORK_CATEGORIES.RESOURCES;
  }

  // Metadata
  if (pathLower.endsWith('info.plist')) {
    return FRAMEWORK_CATEGORIES.METADATA;
  }
  if (pathLower.includes('/_codesignature/')) {
    return FRAMEWORK_CATEGORIES.METADATA;
  }

  // Embedded frameworks
  if (pathLower.includes('/frameworks/')) {
    return FRAMEWORK_CATEGORIES.FRAMEWORKS;
  }

  return FRAMEWORK_CATEGORIES.OTHER;
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
    [FRAMEWORK_CATEGORIES.BINARY]: { name: 'Binary', color: '#4CAF50' },
    [FRAMEWORK_CATEGORIES.HEADERS]: { name: 'Headers', color: '#2196F3' },
    [FRAMEWORK_CATEGORIES.MODULES]: { name: 'Modules', color: '#FF9800' },
    [FRAMEWORK_CATEGORIES.RESOURCES]: { name: 'Resources', color: '#9C27B0' },
    [FRAMEWORK_CATEGORIES.METADATA]: { name: 'Metadata', color: '#607D8B' },
    [FRAMEWORK_CATEGORIES.FRAMEWORKS]: { name: 'Embedded Frameworks', color: '#00BCD4' },
    [FRAMEWORK_CATEGORIES.OTHER]: { name: 'Other', color: '#9E9E9E' },
  };

  for (const id of Object.values(FRAMEWORK_CATEGORIES)) {
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
    const category = categoryMap.get(file.contentType) || categoryMap.get(FRAMEWORK_CATEGORIES.OTHER);
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

// Export for testing
export { FRAMEWORK_CATEGORIES };
