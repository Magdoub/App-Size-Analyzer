/**
 * Calculations - Size and compression calculations
 */

/**
 * Calculate compression ratio
 * Returns ratio as a number (e.g., 0.8 = 80% of original size)
 */
export function calculateCompressionRatio(
  compressedSize: number,
  uncompressedSize: number
): number {
  if (uncompressedSize === 0) return 1;
  return compressedSize / uncompressedSize;
}

/**
 * Calculate compression percentage
 * Returns percentage saved (e.g., 20 = 20% compression)
 */
export function calculateCompressionPercentage(
  compressedSize: number,
  uncompressedSize: number
): number {
  if (uncompressedSize === 0) return 0;
  return ((uncompressedSize - compressedSize) / uncompressedSize) * 100;
}

/**
 * Estimate download size from install size
 * Uses typical compression ratios for mobile apps
 */
export function estimateDownloadSize(installSize: number, platform: 'iOS' | 'Android'): number {
  // iOS apps typically compress to ~65-70% of install size
  // Android apps typically compress to ~60-65% of install size
  const ratio = platform === 'iOS' ? 0.67 : 0.63;
  return Math.round(installSize * ratio);
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate total size of items
 */
export function calculateTotalSize(items: Array<{ size: number }>): number {
  return items.reduce((sum, item) => sum + item.size, 0);
}

/**
 * Calculate savings from optimization
 * Returns { byteSavings, percentSavings }
 */
export function calculateSavings(
  currentSize: number,
  optimizedSize: number
): { byteSavings: number; percentSavings: number } {
  const byteSavings = currentSize - optimizedSize;
  const percentSavings = calculatePercentage(byteSavings, currentSize);
  return { byteSavings, percentSavings };
}

/**
 * Estimate WebP savings from PNG
 * WebP is typically 25-35% smaller than PNG
 */
export function estimateWebPSavings(pngSize: number): number {
  return Math.round(pngSize * 0.3); // 30% average savings
}

/**
 * Estimate HEIF savings from JPEG
 * HEIF is typically 40-50% smaller than JPEG
 */
export function estimateHEIFSavings(jpegSize: number): number {
  return Math.round(jpegSize * 0.45); // 45% average savings
}

/**
 * Calculate size distribution across categories
 * Returns array of { category, size, percentage }
 */
export function calculateDistribution<T extends { size: number }>(
  items: T[],
  categoryExtractor: (item: T) => string
): Array<{ category: string; size: number; percentage: number }> {
  const categoryMap = new Map<string, number>();
  const totalSize = calculateTotalSize(items);

  for (const item of items) {
    const category = categoryExtractor(item);
    const currentSize = categoryMap.get(category) || 0;
    categoryMap.set(category, currentSize + item.size);
  }

  return Array.from(categoryMap.entries())
    .map(([category, size]) => ({
      category,
      size,
      percentage: calculatePercentage(size, totalSize),
    }))
    .sort((a, b) => b.size - a.size); // Sort by size descending
}

/**
 * Find outliers (items significantly larger than average)
 * Returns items that are more than `threshold` times the average
 */
export function findOutliers<T extends { size: number }>(
  items: T[],
  threshold: number = 3
): T[] {
  if (items.length === 0) return [];

  const totalSize = calculateTotalSize(items);
  const averageSize = totalSize / items.length;

  return items.filter((item) => item.size > averageSize * threshold);
}
