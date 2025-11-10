/**
 * Asset Catalog Parser - iOS
 *
 * Parses .car (compiled asset catalog) files to extract asset metadata
 */

/**
 * Asset catalog entry
 * @typedef {Object} AssetCatalogEntry
 * @property {string} name - Asset name
 * @property {'image' | 'color' | 'data' | 'unknown'} type - Asset type
 * @property {number} size - Asset size in bytes
 * @property {number} scale - 1x, 2x, 3x
 * @property {string} [idiom] - phone, pad, universal
 * @property {string[]} [appearances] - light, dark
 */

/**
 * Asset catalog metadata
 * @typedef {Object} AssetCatalogMetadata
 * @property {AssetCatalogEntry[]} entries - Catalog entries
 * @property {number} totalSize - Total catalog size
 * @property {number} imageCount - Number of images
 * @property {number} colorCount - Number of colors
 * @property {number} dataCount - Number of data assets
 */

/**
 * Parse asset catalog (.car file)
 *
 * Note: Full .car parsing requires reverse-engineered format knowledge.
 * This is a simplified parser that extracts basic metadata.
 * For production, consider using a dedicated library or more complete implementation.
 * @param {Uint8Array} data - Binary .car file data
 * @returns {AssetCatalogMetadata} Parsed asset catalog metadata
 * @throws {Error} If the file is invalid
 */
export function parseAssetCatalog(data) {
  // .car files use a custom binary format developed by Apple
  // Full parsing requires deep format knowledge
  // This implementation provides a basic structure for future enhancement

  const entries = [];

  // Basic validation
  if (data.length < 16) {
    throw new Error('File too small to be a valid .car file');
  }

  // Check for CARHEADER magic bytes (simplified check)
  const magic = new TextDecoder().decode(data.slice(0, 7));
  if (!magic.includes('CARHEADER') && !magic.includes('CAR')) {
    // .car files don't always have obvious magic bytes
    // Proceed with best-effort parsing
  }

  // For now, return basic metadata
  // TODO: Implement full .car format parsing
  // Reference: https://github.com/insidegui/AssetCatalogTinkerer

  return {
    entries,
    totalSize: data.length,
    imageCount: 0,
    colorCount: 0,
    dataCount: 0,
  };
}

/**
 * Detect scale from filename (fallback when .car parsing is incomplete)
 * @param {string} filename - Filename to analyze
 * @returns {number} Scale factor (1, 2, or 3)
 */
export function detectScaleFromFilename(filename) {
  if (filename.includes('@3x')) return 3;
  if (filename.includes('@2x')) return 2;
  return 1;
}

/**
 * Detect idiom from path (iPhone, iPad, universal)
 * @param {string} path - File path to analyze
 * @returns {string | undefined} Idiom (phone, pad, universal) or undefined
 */
export function detectIdiomFromPath(path) {
  if (path.includes('~iphone')) return 'phone';
  if (path.includes('~ipad')) return 'pad';
  if (path.includes('~universal')) return 'universal';
  return undefined;
}

/**
 * Estimate savings from consolidating @1x/@2x/@3x images into asset catalogs
 * @param {{ path: string; size: number }[]} standaloneImages - Array of standalone images
 * @returns {number} Estimated savings in bytes
 */
export function estimateAssetCatalogSavings(
  standaloneImages
) {
  let totalSize = 0;
  const imagesByBase = new Map();

  // Group images by base name (without @2x/@3x)
  for (const img of standaloneImages) {
    const baseName = img.path.replace(/@[23]x/, '');
    const existing = imagesByBase.get(baseName) || [];
    existing.push(img);
    imagesByBase.set(baseName, existing);
  }

  // Calculate potential savings from catalog optimization
  for (const [, images] of imagesByBase) {
    if (images.length > 1) {
      // Asset catalogs can save ~5-10% through better compression
      const groupSize = images.reduce((sum, img) => sum + img.size, 0);
      totalSize += groupSize * 0.075; // 7.5% average savings
    }
  }

  return Math.floor(totalSize);
}
