/**
 * IPA Parser - iOS
 *
 * Main parser that integrates all iOS-specific parsers to analyze IPA files
 */

import { extractZIP } from '../common/zip-parser.js';
import { parseBinaryPlist, extractInfoPlistMetadata } from './plist-parser.js';
import { parseMachOHeader } from './macho-parser.js';
import { parseAssetCatalog, detectScaleFromFilename, detectIdiomFromPath } from './asset-catalog-parser.js';

/**
 * @typedef {import('../common/zip-parser.js').ZIPEntry} ZIPEntry
 */

/**
 * @typedef {import('./types.js').IPAParseResult} IPAParseResult
 */

/**
 * @typedef {import('./types.js').IOSFramework} IOSFramework
 */

/**
 * @typedef {import('./types.js').IOSAsset} IOSAsset
 */

/**
 * Parse IPA file and extract all metadata
 * @param {File} file - IPA file to parse
 * @returns {Promise<IPAParseResult>} Parsed IPA metadata
 * @throws {Error} If the IPA is invalid or parsing fails
 */
export async function parseIPA(file) {
  // Extract ZIP contents
  const entries = await extractZIP(file);

  // Find the Payload directory
  const payloadEntries = entries.filter((e) => e.name.startsWith('Payload/'));

  if (payloadEntries.length === 0) {
    throw new Error('Invalid IPA: No Payload directory found');
  }

  // Find the .app bundle
  const appEntry = payloadEntries.find((e) => e.name.match(/Payload\/[^/]+\.app\//));

  if (!appEntry) {
    throw new Error('Invalid IPA: No .app bundle found in Payload');
  }

  // Extract app bundle path (e.g., "Payload/MyApp.app")
  const appBundlePath = appEntry.name.match(/Payload\/[^/]+\.app\//)?.[0] || '';

  // Parse Info.plist
  const infoPlistEntry = entries.find((e) => e.name === `${appBundlePath}Info.plist`);

  if (!infoPlistEntry?.data) {
    throw new Error('Invalid IPA: Info.plist not found');
  }

  const plistData = await parseBinaryPlist(infoPlistEntry.data);
  const metadata = extractInfoPlistMetadata(plistData);

  // Find main executable (usually same name as app bundle)
  const appName = appBundlePath.replace('Payload/', '').replace('.app/', '');
  const executableEntry = entries.find((e) => e.name === `${appBundlePath}${appName}`);

  let mainExecutable;
  if (executableEntry?.data) {
    try {
      mainExecutable = parseMachOHeader(executableEntry.data);
    } catch (error) {
      console.warn('Failed to parse main executable:', error);
    }
  }

  // Parse frameworks
  const frameworks = parseFrameworks(entries, appBundlePath);

  // Parse assets
  const assets = parseAssets(entries, appBundlePath);

  // Parse asset catalog if present
  let assetCatalog;
  const assetCatalogEntry = entries.find((e) => e.name.endsWith('.car'));
  if (assetCatalogEntry?.data) {
    try {
      assetCatalog = parseAssetCatalog(assetCatalogEntry.data);
    } catch (error) {
      console.warn('Failed to parse asset catalog:', error);
    }
  }

  // Extract localizations
  const localizations = extractLocalizations(entries, appBundlePath);

  // Extract architectures
  const architectures = extractArchitectures(mainExecutable, frameworks);

  // Calculate sizes
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  const downloadSize = entries.reduce((sum, e) => sum + e.compressedSize, 0);

  // Build result object with exactOptionalPropertyTypes compliance
  const result = {
    metadata,
    frameworks,
    assets,
    localizations,
    architectures,
    totalSize,
    downloadSize,
    installSize: totalSize,
  };

  // Only add optional properties if they exist
  if (mainExecutable !== undefined) {
    result.mainExecutable = mainExecutable;
  }
  if (assetCatalog !== undefined) {
    result.assetCatalog = assetCatalog;
  }

  return result;
}

/**
 * Parse frameworks from IPA entries
 * @param {ZIPEntry[]} entries - ZIP entries
 * @param {string} appBundlePath - App bundle path
 * @returns {IOSFramework[]} Parsed frameworks
 */
function parseFrameworks(entries, appBundlePath) {
  const frameworks = [];
  const frameworksPath = `${appBundlePath}Frameworks/`;

  // Find all framework bundles
  const frameworkEntries = entries.filter((e) => e.name.startsWith(frameworksPath));

  const frameworksByName = new Map();

  for (const entry of frameworkEntries) {
    const match = entry.name.match(/Frameworks\/([^/]+)\.framework\//);
    if (match && match[1]) {
      const name = match[1];
      const existing = frameworksByName.get(name) || [];
      if (existing) {
        existing.push(entry);
      }
      frameworksByName.set(name, existing);
    }
  }

  for (const [name, fwEntries] of frameworksByName) {
    const binaryEntry = fwEntries.find((e) => e.name.endsWith(`/${name}`));
    let architectures = [];
    let hasDebugSymbols = false;
    let binarySize = 0;

    if (binaryEntry?.data) {
      try {
        const header = parseMachOHeader(binaryEntry.data);
        architectures = [header.architecture];
        hasDebugSymbols = header.hasDebugSymbols;
        binarySize = header.fileSize;
      } catch (error) {
        console.warn(`Failed to parse framework binary: ${name}`, error);
      }
    }

    const totalSize = fwEntries.reduce((sum, e) => sum + e.size, 0);
    const resourcesSize = totalSize - binarySize;

    frameworks.push({
      name,
      path: `Frameworks/${name}.framework`,
      size: totalSize,
      isSystem: false, // Embedded frameworks are not system frameworks
      architectures,
      hasDebugSymbols,
      binarySize,
      resourcesSize,
    });
  }

  return frameworks;
}

/**
 * Parse assets from IPA entries
 * @param {ZIPEntry[]} entries - ZIP entries
 * @param {string} appBundlePath - App bundle path
 * @returns {IOSAsset[]} Parsed assets
 */
function parseAssets(entries, appBundlePath) {
  const assets = [];

  const assetExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'm4v', 'mp3', 'm4a', 'ttf', 'otf']);

  for (const entry of entries) {
    if (!entry.name.startsWith(appBundlePath)) continue;

    const ext = entry.name.split('.').pop()?.toLowerCase();
    if (!ext || !assetExtensions.has(ext)) continue;

    const filename = entry.name.split('/').pop() || '';
    const scale = detectScaleFromFilename(filename);
    const idiom = detectIdiomFromPath(entry.name);
    const inCatalog = entry.name.includes('.car');

    let type = 'other';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) type = 'image';
    else if (['mp4', 'mov', 'm4v'].includes(ext)) type = 'video';
    else if (['mp3', 'm4a'].includes(ext)) type = 'audio';
    else if (['ttf', 'otf'].includes(ext)) type = 'font';

    // Build asset object with exactOptionalPropertyTypes compliance
    const asset = {
      path: entry.name,
      name: filename,
      type,
      size: entry.size,
      scale,
      inCatalog,
    };

    // Only add idiom if it exists
    if (idiom !== undefined && idiom !== null) {
      asset.idiom = idiom;
    }

    assets.push(asset);
  }

  return assets;
}

/**
 * Extract supported localizations
 * @param {ZIPEntry[]} entries - ZIP entries
 * @param {string} appBundlePath - App bundle path
 * @returns {string[]} List of localization codes
 */
function extractLocalizations(entries, appBundlePath) {
  const localizations = new Set();

  for (const entry of entries) {
    if (!entry.name.startsWith(appBundlePath)) continue;

    // Look for .lproj directories
    const match = entry.name.match(/\/([^/]+)\.lproj\//);
    if (match) {
      localizations.add(match[1] || '');
    }
  }

  return Array.from(localizations);
}

/**
 * Extract all architectures from executable and frameworks
 * @param {import('./macho-parser.js').MachOHeader | undefined} mainExecutable - Main executable header
 * @param {IOSFramework[]} frameworks - Frameworks list
 * @returns {string[]} List of architectures
 */
function extractArchitectures(
  mainExecutable,
  frameworks
) {
  const architectures = new Set();

  if (mainExecutable) {
    architectures.add(mainExecutable.architecture);
  }

  for (const framework of frameworks) {
    for (const arch of framework.architectures) {
      architectures.add(arch);
    }
  }

  return Array.from(architectures);
}
