/**
 * Resources.arsc Parser - Android
 *
 * Parses Android resource table (resources.arsc) to extract resource metadata
 */

/**
 * @typedef {Object} ResourceEntry
 * @property {number} id - Resource ID
 * @property {string} type - Resource type (drawable, string, layout, etc.)
 * @property {string} name - Resource name
 * @property {string} [value] - Resource value
 * @property {string} [config] - Configuration qualifier (e.g., hdpi, xhdpi, en, es)
 */

/**
 * @typedef {Object} LocaleConfig
 * @property {string} locale - Locale code (e.g., 'en', 'es', 'zh-rCN')
 * @property {number} stringCount - Number of strings in this locale
 */

/**
 * @typedef {Object} ResourceTableMetadata
 * @property {string} packageName - Package name
 * @property {ResourceEntry[]} entries - Resource entries
 * @property {number} totalEntries - Total number of entries
 * @property {Map<string, number>} resourcesByType - Resources grouped by type
 * @property {Map<string, number>} resourcesByConfig - Resources grouped by configuration
 * @property {LocaleConfig[]} locales - Available locale configurations
 */

// Chunk type constants
const RES_TABLE_TYPE = 0x0002;
const RES_STRING_POOL_TYPE = 0x0001;
const RES_TABLE_PACKAGE_TYPE = 0x0200;
const RES_TABLE_TYPE_SPEC_TYPE = 0x0202;
const RES_TABLE_TYPE_TYPE = 0x0201;

/**
 * Parse resources.arsc file
 *
 * Parses the Android resource table to extract locale configurations
 * and resource metadata.
 * @param {Uint8Array} data - Binary resource table data
 * @returns {ResourceTableMetadata} Resource table metadata
 */
export function parseResourceTable(data) {
  const entries = [];
  const resourcesByType = new Map();
  const resourcesByConfig = new Map();
  const localeSet = new Map(); // locale -> count

  // Basic validation
  if (data.length < 12) {
    throw new Error('File too small to be valid resources.arsc');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Check chunk type - should be RES_TABLE_TYPE (0x0002)
  const type = view.getUint16(0, true);
  const headerSize = view.getUint16(2, true);
  const chunkSize = view.getUint32(4, true);

  if (type !== RES_TABLE_TYPE) {
    console.warn(`Unexpected resources.arsc chunk type: 0x${type.toString(16)}`);
    return createEmptyResult();
  }

  // Parse the package count
  const packageCount = view.getUint32(8, true);

  let offset = headerSize;

  // Skip global string pool
  if (offset < data.length) {
    const stringPoolType = view.getUint16(offset, true);
    if (stringPoolType === RES_STRING_POOL_TYPE) {
      const stringPoolSize = view.getUint32(offset + 4, true);
      offset += stringPoolSize;
    }
  }

  // Parse package chunks
  while (offset < chunkSize && offset < data.length - 8) {
    const chunkType = view.getUint16(offset, true);
    const chunkHeaderSize = view.getUint16(offset + 2, true);
    const currentChunkSize = view.getUint32(offset + 4, true);

    if (currentChunkSize === 0 || offset + currentChunkSize > data.length) {
      break;
    }

    if (chunkType === RES_TABLE_PACKAGE_TYPE) {
      // Parse package chunk to find type chunks with locale configs
      parsePackageChunk(view, offset, currentChunkSize, localeSet, resourcesByConfig);
    }

    offset += currentChunkSize;
  }

  // Convert locale map to array
  const locales = Array.from(localeSet.entries())
    .map(([locale, count]) => ({ locale, stringCount: count }))
    .sort((a, b) => b.stringCount - a.stringCount);

  return {
    packageName: 'unknown',
    entries,
    totalEntries: entries.length,
    resourcesByType,
    resourcesByConfig,
    locales,
  };
}

/**
 * Create empty result structure
 * @returns {ResourceTableMetadata}
 */
function createEmptyResult() {
  return {
    packageName: 'unknown',
    entries: [],
    totalEntries: 0,
    resourcesByType: new Map(),
    resourcesByConfig: new Map(),
    locales: [],
  };
}

/**
 * Parse a package chunk to extract locale configurations
 * @param {DataView} view - Data view
 * @param {number} offset - Chunk start offset
 * @param {number} chunkSize - Chunk size
 * @param {Map<string, number>} localeSet - Map to store locale counts
 * @param {Map<string, number>} resourcesByConfig - Map to store config counts
 */
function parsePackageChunk(view, offset, chunkSize, localeSet, resourcesByConfig) {
  // Package chunk header is 288 bytes (0x120) for standard packages
  // It contains: id, name, typeStrings offset, lastPublicType, keyStrings offset, lastPublicKey, typeIdOffset
  const headerSize = view.getUint16(offset + 2, true);
  let pos = offset + headerSize;
  const endPos = offset + chunkSize;

  let typeChunkCount = 0;

  // Skip through all sub-chunks in the package
  while (pos < endPos && pos < view.byteLength - 8) {
    const chunkType = view.getUint16(pos, true);
    const currentChunkSize = view.getUint32(pos + 4, true);

    if (currentChunkSize === 0 || currentChunkSize < 8 || pos + currentChunkSize > view.byteLength) {
      break;
    }

    if (chunkType === RES_TABLE_TYPE_TYPE) {
      typeChunkCount++;
      // This is a type chunk - extract locale from config
      const locale = extractLocaleFromTypeChunk(view, pos);
      if (locale) {
        const count = localeSet.get(locale) || 0;
        localeSet.set(locale, count + 1);

        const configCount = resourcesByConfig.get(locale) || 0;
        resourcesByConfig.set(locale, configCount + 1);
      }
    } else if (chunkType === RES_STRING_POOL_TYPE) {
      // Skip string pools
    } else if (chunkType === RES_TABLE_TYPE_SPEC_TYPE) {
      // Skip type specs
    }

    pos += currentChunkSize;
  }
}

/**
 * Extract locale code from a type chunk's ResTable_config
 * @param {DataView} view - Data view
 * @param {number} offset - Type chunk start offset
 * @returns {string|null} Locale code or null
 */
function extractLocaleFromTypeChunk(view, offset) {
  // Type chunk header:
  // - uint16 type (0x0201)
  // - uint16 headerSize
  // - uint32 size
  // - uint8 id
  // - uint8 res0
  // - uint16 res1
  // - uint32 entryCount
  // - uint32 entriesStart
  // - ResTable_config config (variable size, but locale is at fixed offset)

  const headerSize = view.getUint16(offset + 2, true);

  // ResTable_config starts after the fixed header fields (20 bytes from chunk start)
  const configOffset = offset + 20;

  if (configOffset + 8 > view.byteLength) {
    return null;
  }

  // ResTable_config structure (first relevant bytes):
  // - uint32 size
  // - uint16 mcc (mobile country code)
  // - uint16 mnc (mobile network code)
  // - char[2] language
  // - char[2] country/region

  const configSize = view.getUint32(configOffset, true);
  if (configSize < 8) {
    return null;
  }

  // Language bytes (2 chars)
  const lang1 = view.getUint8(configOffset + 4);
  const lang2 = view.getUint8(configOffset + 5);

  // Country/region bytes (2 chars)
  const country1 = view.getUint8(configOffset + 6);
  const country2 = view.getUint8(configOffset + 7);

  // Check if language is set (non-zero)
  if (lang1 === 0 && lang2 === 0) {
    return 'default';
  }

  // Build locale string
  let locale = '';

  // Handle packed language format (BCP-47 style for API 21+)
  if ((lang1 & 0x80) !== 0) {
    // Packed format - extract 3-letter code
    const packed = (lang1 << 8) | lang2;
    const c1 = ((packed >> 10) & 0x1F) + 0x61;
    const c2 = ((packed >> 5) & 0x1F) + 0x61;
    const c3 = (packed & 0x1F) + 0x61;
    locale = String.fromCharCode(c1, c2, c3);
  } else if (lang1 >= 0x61 && lang1 <= 0x7A) {
    // Standard 2-letter ISO 639-1 code
    locale = String.fromCharCode(lang1, lang2);
  } else {
    return null;
  }

  // Add region if present
  if (country1 !== 0 || country2 !== 0) {
    if (country1 >= 0x41 && country1 <= 0x5A) {
      // Standard 2-letter ISO 3166-1 region
      locale += '-r' + String.fromCharCode(country1, country2);
    } else if (country1 >= 0x30 && country1 <= 0x39) {
      // Numeric region code (UN M.49)
      locale += '-' + String.fromCharCode(country1, country2);
    }
  }

  return locale;
}

/**
 * Identify unused resources by comparing resource table with DEX references
 * @param {ResourceTableMetadata} resourceTable - Resource table metadata
 * @param {Set<number>} referencedResources - Set of referenced resource IDs
 * @returns {ResourceEntry[]} Array of unused resources
 */
export function findUnusedResources(resourceTable, referencedResources) {
  const unused = [];

  for (const entry of resourceTable.entries) {
    if (!referencedResources.has(entry.id)) {
      unused.push(entry);
    }
  }

  return unused;
}

/**
 * Estimate size of unused resources
 * @param {ResourceEntry[]} unusedResources - Unused resources
 * @param {Map<string, number>} resourceFiles - Map of resource paths to sizes
 * @returns {number} Estimated size of unused resources
 */
export function estimateUnusedResourcesSize(unusedResources, resourceFiles) {
  let totalSize = 0;

  for (const resource of unusedResources) {
    // Try to find matching files
    for (const [path, size] of resourceFiles) {
      if (path.includes(resource.name)) {
        totalSize += size;
      }
    }
  }

  return totalSize;
}
