/**
 * Calculations - Size and compression calculations
 */

import { getColorByType } from '../lib/visualization/color-scheme.js';

/**
 * Calculate compression ratio
 * Returns ratio as a number (e.g., 0.8 = 80% of original size)
 */
export function calculateCompressionRatio(compressedSize, uncompressedSize) {
  if (uncompressedSize === 0) return 1;
  return compressedSize / uncompressedSize;
}

/**
 * Calculate compression percentage
 * Returns percentage saved (e.g., 20 = 20% compression)
 */
export function calculateCompressionPercentage(compressedSize, uncompressedSize) {
  if (uncompressedSize === 0) return 0;
  return ((uncompressedSize - compressedSize) / uncompressedSize) * 100;
}

/**
 * Estimate download size from install size
 * Uses typical compression ratios for mobile apps
 */
export function estimateDownloadSize(installSize, platform) {
  // iOS apps typically compress to ~65-70% of install size
  // Android apps typically compress to ~60-65% of install size
  const ratio = platform === 'iOS' ? 0.67 : 0.63;
  return Math.round(installSize * ratio);
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate total size of items
 */
export function calculateTotalSize(items) {
  return items.reduce((sum, item) => sum + item.size, 0);
}

/**
 * Calculate savings from optimization
 * Returns { byteSavings, percentSavings }
 */
export function calculateSavings(currentSize, optimizedSize) {
  const byteSavings = currentSize - optimizedSize;
  const percentSavings = calculatePercentage(byteSavings, currentSize);
  return { byteSavings, percentSavings };
}

/**
 * Estimate WebP savings from PNG
 * WebP is typically 25-35% smaller than PNG
 */
export function estimateWebPSavings(pngSize) {
  return Math.round(pngSize * 0.3); // 30% average savings
}

/**
 * Estimate HEIF savings from JPEG
 * HEIF is typically 40-50% smaller than JPEG
 */
export function estimateHEIFSavings(jpegSize) {
  return Math.round(jpegSize * 0.45); // 45% average savings
}

/**
 * Calculate size distribution across categories
 * Returns array of { category, size, percentage }
 */
export function calculateDistribution(items, categoryExtractor) {
  const categoryMap = new Map();
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
export function findOutliers(items, threshold = 3) {
  if (items.length === 0) return [];

  const totalSize = calculateTotalSize(items);
  const averageSize = totalSize / items.length;

  return items.filter((item) => item.size > averageSize * threshold);
}

/**
 * =============================================================================
 * SUMMARY PAGE AGGREGATION FUNCTIONS
 * =============================================================================
 * These functions support the Summary page feature (010-summary-page-graphs)
 * All functions are pure with no side effects.
 */

/**
 * Map ContentType to user-friendly display category
 * @param {string} contentType - One of 15 ContentTypes
 * @param {string} platform - 'iOS' or 'Android' (affects category mapping)
 * @returns {string} Display category name
 */
export function mapToDisplayCategory(contentType, platform) {
  const mapping = {
    framework: 'Frameworks',
    bundle: 'Frameworks',
    executable: 'Executables',
    dex: 'DEX Files',
    native_lib: 'Native Libraries',
    resource: 'Resources',
    config: 'Resources',
    image: 'Media Assets',
    video: 'Media Assets',
    audio: 'Media Assets',
    font: 'Media Assets',
    localization: 'Localizations',
    data: 'Data Files',
    asset: 'Other',
    other: 'Other',
    unknown: 'Other'
  };
  return mapping[contentType] || 'Other';
}

/**
 * Get color for a display category
 * @param {string} displayCategory - Display category name
 * @param {string} context - 'fileType' or 'component' (determines color scheme)
 * @returns {string} Hex color code
 */
export function getDisplayCategoryColor(displayCategory, context = 'fileType') {
  if (context === 'component') {
    // Use colors from color-scheme.js TYPE_COLORS
    return displayCategory === 'Internal' ? getColorByType('framework') : getColorByType('native_lib');
  }

  // For file type context, map display categories to their representative ContentType
  // and use getColorByType from color-scheme.js for consistency
  const contentTypeMap = {
    'Frameworks': 'framework',
    'Executables': 'executable',
    'Resources': 'resource',
    'Media Assets': 'image',
    'Localizations': 'localization',
    'Data Files': 'data',
    'DEX Files': 'dex',
    'Native Libraries': 'native_lib',
    'Other': 'other'
  };

  const contentType = contentTypeMap[displayCategory];
  return contentType ? getColorByType(contentType) : getColorByType('unknown');
}

/**
 * Aggregate files by display category (grouping of ContentTypes)
 * @param {Object} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - 'iOS' or 'Android'
 * @param {number} totalInstallSize - Total app install size (for percentage calculation)
 * @returns {Array} Array of aggregated categories
 */
export function aggregateFilesByType(breakdownRoot, platform, totalInstallSize) {
  // Guard: Handle empty/invalid input
  if (!breakdownRoot) {
    console.warn('[aggregateFilesByType] breakdownRoot is null or undefined');
    return [];
  }

  if (!platform) {
    console.warn('[aggregateFilesByType] platform is missing, defaulting to iOS');
    platform = 'iOS';
  }

  if (typeof totalInstallSize !== 'number' || totalInstallSize < 0) {
    console.warn('[aggregateFilesByType] totalInstallSize is invalid, using 0');
    totalInstallSize = 0;
  }

  const categoryMap = new Map();

  // Helper to traverse tree and accumulate data
  function traverse(node) {
    try {
      // Guard: Skip invalid nodes
      if (!node) return;

      // Process leaf nodes (files)
      if (!node.children || node.children.length === 0) {
        const nodeType = node.type || 'unknown';
        const displayCategory = mapToDisplayCategory(nodeType, platform);

        if (!categoryMap.has(displayCategory)) {
          categoryMap.set(displayCategory, {
            category: displayCategory,
            contentTypes: new Set(),
            size: 0,
            compressedSize: 0,
            count: 0
          });
        }

        const cat = categoryMap.get(displayCategory);
        cat.contentTypes.add(nodeType);
        cat.size += (typeof node.size === 'number' ? node.size : 0);
        cat.compressedSize += (typeof node.compressedSize === 'number' ? node.compressedSize : 0);
        cat.count += 1;
      }

      // Recurse through children
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    } catch (error) {
      console.error('[aggregateFilesByType] Error processing node:', node, error);
    }
  }

  traverse(breakdownRoot);

  // Convert Map to array with percentages and colors
  let result = Array.from(categoryMap.values()).map(cat => ({
    category: cat.category,
    contentTypes: Array.from(cat.contentTypes),
    size: cat.size,
    compressedSize: platform === 'iOS' ? cat.compressedSize : null,
    count: cat.count,
    percentage: totalInstallSize > 0 ? (cat.size / totalInstallSize) * 100 : 0,
    color: getDisplayCategoryColor(cat.category, 'fileType')
  }));

  // Filter out empty categories
  result = result.filter(cat => cat.size > 0);

  // Group categories <1% into "Other" (FR-019)
  // First separate categories >=1% from those <1%
  const significantCategories = result.filter(cat => cat.percentage >= 1);
  const smallCategories = result.filter(cat => cat.percentage < 1 && cat.category !== 'Other');

  // If there are small categories, aggregate them into "Other"
  if (smallCategories.length > 0) {
    // Check if "Other" category already exists
    const existingOther = result.find(cat => cat.category === 'Other');

    const otherSize = smallCategories.reduce((sum, cat) => sum + cat.size, 0);
    const otherCompressedSize = smallCategories.reduce((sum, cat) => sum + (cat.compressedSize || 0), 0);
    const otherCount = smallCategories.reduce((sum, cat) => sum + cat.count, 0);
    const otherContentTypes = new Set();
    smallCategories.forEach(cat => cat.contentTypes.forEach(type => otherContentTypes.add(type)));

    // Add existing "Other" category data if it exists
    if (existingOther && Array.isArray(existingOther.contentTypes)) {
      existingOther.contentTypes.forEach(type => otherContentTypes.add(type));
    }

    const otherCategory = {
      category: 'Other',
      contentTypes: Array.from(otherContentTypes),
      size: otherSize + (existingOther ? existingOther.size : 0),
      compressedSize: platform === 'iOS' ? (otherCompressedSize + (existingOther ? existingOther.compressedSize || 0 : 0)) : null,
      count: otherCount + (existingOther ? existingOther.count : 0),
      percentage: totalInstallSize > 0 ? ((otherSize + (existingOther ? existingOther.size : 0)) / totalInstallSize) * 100 : 0,
      color: getDisplayCategoryColor('Other', 'fileType')
    };

    // Only include "Other" if it has meaningful size (avoid tiny residuals)
    if (otherCategory.size > 0) {
      result = [...significantCategories, otherCategory];
    } else {
      result = significantCategories;
    }
  }

  // Sort by size descending
  return result.sort((a, b) => b.size - a.size);
}

/**
 * Aggregate files by component type (Internal vs External)
 * @param {Object} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - 'iOS' or 'Android'
 * @param {number} totalInstallSize - Total app install size
 * @returns {Object} Internal and external component breakdown
 */
export function aggregateByComponent(breakdownRoot, platform, totalInstallSize) {
  // Guard: Handle empty/invalid input
  if (!breakdownRoot) {
    console.warn('[aggregateByComponent] breakdownRoot is null or undefined');
    return {
      internal: { category: 'Internal', size: 0, compressedSize: null, count: 0, percentage: 0, color: '#3b82f6' },
      external: { category: 'External', size: 0, compressedSize: null, count: 0, percentage: 0, color: '#10b981' }
    };
  }

  if (!platform) {
    console.warn('[aggregateByComponent] platform is missing, defaulting to iOS');
    platform = 'iOS';
  }

  if (typeof totalInstallSize !== 'number' || totalInstallSize < 0) {
    console.warn('[aggregateByComponent] totalInstallSize is invalid, using 0');
    totalInstallSize = 0;
  }

  const internal = { size: 0, compressedSize: 0, count: 0 };
  const external = { size: 0, compressedSize: 0, count: 0 };

  function isExternal(node) {
    const path = (node.path || '').toLowerCase();

    if (platform === 'iOS') {
      // iOS: Frameworks directory and System/Library are external
      return path.includes('frameworks/') || path.includes('/system/library/');
    } else {
      // Android: lib/ directories (native libraries) are typically external
      return path.includes('lib/') && path.includes('.so');
    }
  }

  function traverse(node) {
    try {
      // Guard: Skip invalid nodes
      if (!node) return;

      // Process leaf nodes (files)
      if (!node.children || node.children.length === 0) {
        const target = isExternal(node) ? external : internal;
        target.size += (typeof node.size === 'number' ? node.size : 0);
        target.compressedSize += (typeof node.compressedSize === 'number' ? node.compressedSize : 0);
        target.count += 1;
      }

      // Recurse through children
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    } catch (error) {
      console.error('[aggregateByComponent] Error processing node:', node, error);
    }
  }

  traverse(breakdownRoot);

  return {
    internal: {
      category: 'Internal',
      size: internal.size,
      compressedSize: platform === 'iOS' ? internal.compressedSize : null,
      count: internal.count,
      percentage: totalInstallSize > 0 ? (internal.size / totalInstallSize) * 100 : 0,
      color: getDisplayCategoryColor('Internal', 'component')
    },
    external: {
      category: 'External',
      size: external.size,
      compressedSize: platform === 'iOS' ? external.compressedSize : null,
      count: external.count,
      percentage: totalInstallSize > 0 ? (external.size / totalInstallSize) * 100 : 0,
      color: getDisplayCategoryColor('External', 'component')
    }
  };
}

/**
 * Get top N largest files from breakdown tree
 * @param {Object} breakdownRoot - Root of the breakdown tree
 * @param {number} count - Number of top files to return
 * @param {number} totalInstallSize - Total app install size
 * @returns {Array} Array of top files sorted by size descending
 */
export function getTopFiles(breakdownRoot, count, totalInstallSize) {
  // Guard: Handle empty/invalid input
  if (!breakdownRoot) {
    console.warn('[getTopFiles] breakdownRoot is null or undefined');
    return [];
  }

  if (typeof count !== 'number' || count < 0) {
    console.warn('[getTopFiles] count is invalid, using 10');
    count = 10;
  }

  if (typeof totalInstallSize !== 'number' || totalInstallSize < 0) {
    console.warn('[getTopFiles] totalInstallSize is invalid, using 0');
    totalInstallSize = 0;
  }

  const files = [];

  function traverse(node) {
    try {
      // Guard: Skip invalid nodes
      if (!node) return;

      // Process leaf nodes (files)
      if (!node.children || node.children.length === 0) {
        const size = typeof node.size === 'number' ? node.size : 0;
        files.push({
          path: node.path || node.name || 'Unknown',
          name: node.name || 'Unknown',
          size,
          compressedSize: typeof node.compressedSize === 'number' ? node.compressedSize : null,
          type: node.type || 'unknown',
          percentage: totalInstallSize > 0 ? (size / totalInstallSize) * 100 : 0,
          color: getColorByType(node.type || 'unknown')
        });
      }

      // Recurse through children
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    } catch (error) {
      console.error('[getTopFiles] Error processing node:', node, error);
    }
  }

  traverse(breakdownRoot);

  // Sort by size descending and take top N
  return files
    .sort((a, b) => b.size - a.size)
    .slice(0, count);
}

/**
 * Analyze compression efficiency by file type category (iOS only)
 * @param {Object} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - Must be 'iOS' (Android not supported)
 * @returns {Array} Array of compression data per category
 */
export function analyzeCompressionByType(breakdownRoot, platform) {
  if (platform !== 'iOS') {
    return [];
  }

  const categoryMap = new Map();

  function traverse(node) {
    if (!node.children || node.children.length === 0) {
      const displayCategory = mapToDisplayCategory(node.type, platform);

      if (!categoryMap.has(displayCategory)) {
        categoryMap.set(displayCategory, {
          category: displayCategory,
          uncompressed: 0,
          compressed: 0
        });
      }

      const cat = categoryMap.get(displayCategory);
      cat.uncompressed += node.size || 0;
      cat.compressed += node.compressedSize || 0;
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(breakdownRoot);

  return Array.from(categoryMap.values())
    .filter(cat => cat.uncompressed > 0)
    .map(cat => ({
      category: cat.category,
      uncompressed: cat.uncompressed,
      compressed: cat.compressed,
      ratio: cat.uncompressed > 0 ? cat.compressed / cat.uncompressed : 1,
      percentage: cat.uncompressed > 0 ? ((cat.uncompressed - cat.compressed) / cat.uncompressed) * 100 : 0,
      color: getDisplayCategoryColor(cat.category, 'fileType')
    }))
    .sort((a, b) => b.uncompressed - a.uncompressed);
}

/**
 * Analyze localization impact (size per locale)
 * @param {Object} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - 'iOS' or 'Android'
 * @param {number} totalInstallSize - Total app install size
 * @param {Array} [resourceTableLocales] - Locales parsed from resources.arsc (Android only)
 * @returns {Array} Array of localization data per locale
 */
export function analyzeLocalizations(breakdownRoot, platform, totalInstallSize, resourceTableLocales = []) {
  const localeMap = new Map();

  // Locale display names
  const localeNames = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'ko': 'Korean',
    'ru': 'Russian',
    'ar': 'Arabic',
    'nl': 'Dutch',
    'pl': 'Polish',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'id': 'Indonesian',
    'ms': 'Malay',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'uk': 'Ukrainian',
    'cs': 'Czech',
    'el': 'Greek',
    'ro': 'Romanian',
    'hu': 'Hungarian',
    'sv': 'Swedish',
    'da': 'Danish',
    'fi': 'Finnish',
    'no': 'Norwegian',
    'he': 'Hebrew',
    'sk': 'Slovak',
    'hr': 'Croatian',
    'ca': 'Catalan',
    'fil': 'Filipino',
    'base': 'Base',
    'default': 'Default'
  };

  function extractLocale(path) {
    if (platform === 'iOS') {
      // iOS: en.lproj, Base.lproj
      const match = path.match(/([^/]+)\.lproj/);
      return match ? match[1].toLowerCase() : null;
    } else {
      // Android: res/values/ (default), res/values-es/, res/values-zh-rCN/
      // Match default values folder
      if (path.match(/res\/values(?:\/|$)/) && !path.includes('values-')) {
        return 'default';
      }
      // Match locale-specific values folders
      const match = path.match(/values-([a-z]{2}(?:-r[A-Z]{2})?)/);
      return match ? match[1].toLowerCase() : null;
    }
  }

  function traverse(node) {
    const locale = extractLocale(node.path || '');

    if (locale) {
      if (!localeMap.has(locale)) {
        localeMap.set(locale, {
          locale,
          size: 0,
          count: 0
        });
      }

      const loc = localeMap.get(locale);

      // Add size of node (file or directory)
      loc.size += node.size || 0;

      // Count files (leaf nodes)
      if (!node.children || node.children.length === 0) {
        loc.count += 1;
      }
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(breakdownRoot);

  // For Android apps with obfuscated resources (like Instagram Lite),
  // folder-based detection fails. Use parsed locale data from resources.arsc instead.
  if (platform === 'Android' && localeMap.size === 0 && resourceTableLocales && resourceTableLocales.length > 0) {
    // Get resources.arsc file size to estimate per-locale size
    let arscSize = 0;
    function findArscSize(node) {
      if (node.name === 'resources.arsc') {
        arscSize = node.size || 0;
        return;
      }
      if (node.children) {
        node.children.forEach(findArscSize);
      }
    }
    findArscSize(breakdownRoot);

    // Filter out 'default' entries and count unique locales
    const uniqueLocales = resourceTableLocales.filter(l => l.locale !== 'default');
    const totalStringCount = uniqueLocales.reduce((sum, l) => sum + l.stringCount, 0);

    // Distribute the resources.arsc size proportionally across locales
    for (const localeData of uniqueLocales) {
      const locale = localeData.locale.toLowerCase();
      const proportion = totalStringCount > 0 ? localeData.stringCount / totalStringCount : 1 / uniqueLocales.length;
      const estimatedSize = Math.round(arscSize * proportion);

      localeMap.set(locale, {
        locale,
        size: estimatedSize,
        count: localeData.stringCount
      });
    }
  }

  // Generate colors for locales
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1'];

  return Array.from(localeMap.values())
    .filter(loc => loc.size > 0)
    .map((loc, idx) => ({
      locale: loc.locale,
      displayName: localeNames[loc.locale] || loc.locale.toUpperCase(),
      size: loc.size,
      count: loc.count,
      percentage: totalInstallSize > 0 ? (loc.size / totalInstallSize) * 100 : 0,
      color: colors[idx % colors.length]
    }))
    .sort((a, b) => b.size - a.size);
}

/**
 * Analyze architecture breakdown (Android only)
 * @param {Object} breakdownRoot - Root of the breakdown tree
 * @param {number} totalInstallSize - Total app install size
 * @returns {Array} Array of architecture data
 */
export function analyzeArchitectures(breakdownRoot, totalInstallSize) {
  const archMap = new Map();

  const archNames = {
    'arm64-v8a': 'ARM64 (64-bit)',
    'armeabi-v7a': 'ARMv7 (32-bit)',
    'x86': 'x86 (32-bit)',
    'x86_64': 'x86-64 (64-bit)'
  };

  function extractArch(path) {
    // Parse paths: lib/{arch}/lib{name}.so
    const match = path.match(/lib\/([^/]+)\//);
    return match ? match[1] : null;
  }

  function traverse(node) {
    const arch = extractArch(node.path || '');

    if (arch && node.path && node.path.includes('.so')) {
      if (!archMap.has(arch)) {
        archMap.set(arch, {
          architecture: arch,
          size: 0,
          count: 0
        });
      }

      const a = archMap.get(arch);
      a.size += node.size || 0;
      if (!node.children || node.children.length === 0) {
        a.count += 1;
      }
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(breakdownRoot);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return Array.from(archMap.values())
    .filter(a => a.size > 0)
    .map((a, idx) => ({
      architecture: a.architecture,
      displayName: archNames[a.architecture] || a.architecture,
      size: a.size,
      count: a.count,
      percentage: totalInstallSize > 0 ? (a.size / totalInstallSize) * 100 : 0,
      color: colors[idx % colors.length]
    }))
    .sort((a, b) => b.size - a.size);
}

/**
 * Categorize asset types (images, videos, audio, fonts)
 * @param {Object} breakdownRoot - Root of the breakdown tree
 * @param {number} totalInstallSize - Total app install size
 * @returns {Array} Array of asset type data
 */
export function categorizeAssetTypes(breakdownRoot, totalInstallSize) {
  const assetTypes = {
    'image': { assetType: 'Images', size: 0, compressedSize: 0, count: 0, color: '#14b8a6' },
    'video': { assetType: 'Videos', size: 0, compressedSize: 0, count: 0, color: '#f97316' },
    'audio': { assetType: 'Audio', size: 0, compressedSize: 0, count: 0, color: '#a855f7' },
    'font': { assetType: 'Fonts', size: 0, compressedSize: 0, count: 0, color: '#84cc16' }
  };

  function traverse(node) {
    if ((!node.children || node.children.length === 0) && assetTypes[node.type]) {
      const asset = assetTypes[node.type];
      asset.size += node.size || 0;
      asset.compressedSize += node.compressedSize || 0;
      asset.count += 1;
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(breakdownRoot);

  return Object.entries(assetTypes)
    .filter(([_, asset]) => asset.size > 0)
    .map(([type, asset]) => ({
      assetType: asset.assetType,
      contentType: type,
      size: asset.size,
      compressedSize: asset.compressedSize > 0 ? asset.compressedSize : null,
      count: asset.count,
      percentage: totalInstallSize > 0 ? (asset.size / totalInstallSize) * 100 : 0,
      color: asset.color
    }))
    .sort((a, b) => b.size - a.size);
}
