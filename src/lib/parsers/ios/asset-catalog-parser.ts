/**
 * Asset Catalog Parser - iOS
 *
 * Parses .car (compiled asset catalog) files to extract asset metadata
 */

export interface AssetCatalogEntry {
  name: string;
  type: 'image' | 'color' | 'data' | 'unknown';
  size: number;
  scale: number; // 1x, 2x, 3x
  idiom?: string; // phone, pad, universal
  appearances?: string[]; // light, dark
}

export interface AssetCatalogMetadata {
  entries: AssetCatalogEntry[];
  totalSize: number;
  imageCount: number;
  colorCount: number;
  dataCount: number;
}

/**
 * Parse asset catalog (.car file)
 *
 * Note: Full .car parsing requires reverse-engineered format knowledge.
 * This is a simplified parser that extracts basic metadata.
 * For production, consider using a dedicated library or more complete implementation.
 */
export function parseAssetCatalog(data: Uint8Array): AssetCatalogMetadata {
  // .car files use a custom binary format developed by Apple
  // Full parsing requires deep format knowledge
  // This implementation provides a basic structure for future enhancement

  const entries: AssetCatalogEntry[] = [];

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
 */
export function detectScaleFromFilename(filename: string): number {
  if (filename.includes('@3x')) return 3;
  if (filename.includes('@2x')) return 2;
  return 1;
}

/**
 * Detect idiom from path (iPhone, iPad, universal)
 */
export function detectIdiomFromPath(path: string): string | undefined {
  if (path.includes('~iphone')) return 'phone';
  if (path.includes('~ipad')) return 'pad';
  if (path.includes('~universal')) return 'universal';
  return undefined;
}

/**
 * Estimate savings from consolidating @1x/@2x/@3x images into asset catalogs
 */
export function estimateAssetCatalogSavings(
  standaloneImages: { path: string; size: number }[]
): number {
  let totalSize = 0;
  const imagesByBase = new Map<string, { path: string; size: number }[]>();

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
