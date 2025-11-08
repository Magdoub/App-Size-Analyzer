/**
 * Insight Rules
 *
 * Implementation of specific optimization detection rules
 */

import type { AnalysisContext } from '../../types/analysis';
import type { InsightRule, InsightResult, AffectedItem } from '../../types/insights';
import {
  findDuplicatesByHash,
  calculateDuplicateSavings,
  findFilesByExtension,
  findFilesByPattern,
  calculatePercentage,
} from './insight-engine';

/**
 * R001: Duplicate File Detection
 *
 * Detects files with identical content (same hash) that could be deduplicated
 */
export const duplicateDetectionRule: InsightRule = {
  id: 'R001',
  category: 'duplicates',
  name: 'Duplicate Files',
  description: 'Detects duplicate files with identical content that waste space',
  severity: 'high',

  execute: async (context: AnalysisContext): Promise<InsightResult[]> => {
    const results: InsightResult[] = [];

    // Find duplicates by hash
    const duplicates = await findDuplicatesByHash(context);

    if (duplicates.size === 0) {
      return results;
    }

    // Create insight for each set of duplicates
    duplicates.forEach((paths, hash) => {
      if (paths.length <= 1) return;

      const affectedItems: AffectedItem[] = paths.map((path) => {
        const fileEntry = context.allFiles.find((f) => f.path === path);
        return {
          path,
          size: fileEntry?.size || 0,
          reason: 'Duplicate of other files in this group',
          metadata: { hash, duplicateCount: paths.length },
        };
      });

      const potentialSavings = calculateDuplicateSavings(context, paths);
      const percentOfTotal = calculatePercentage(potentialSavings, context.totalInstallSize);

      results.push({
        ruleId: 'R001',
        title: `${paths.length} Duplicate Files Found`,
        description: `${paths.length} files have identical content. Deduplicating these files could save ${potentialSavings} bytes.`,
        severity: 'high',
        category: 'duplicates',
        affectedItems,
        potentialSavings,
        percentOfTotal,
        actionable: true,
        fixSuggestion: `Review these files and remove duplicates. Consider using asset catalogs (iOS) or resource references (Android) to avoid duplication.`,
      });
    });

    return results;
  },

  metadata: {
    examples: ['Same image included multiple times', 'Duplicate font files', 'Identical JSON configs'],
    documentation: 'Duplicate files waste space. Use references or symlinks instead of copying files.',
    fixable: true,
  },
};

/**
 * R002: Unoptimized PNG Images
 *
 * Detects PNG images that could be converted to WebP for better compression
 */
export const unoptimizedPNGRule: InsightRule = {
  id: 'R002',
  category: 'optimization',
  name: 'Unoptimized PNG Images',
  description: 'Detects PNG images that could be converted to WebP or optimized',
  severity: 'medium',

  execute: async (context: AnalysisContext): Promise<InsightResult[]> => {
    const results: InsightResult[] = [];

    // Find all PNG files
    const pngFiles = findFilesByExtension(context, '.png');

    if (pngFiles.length === 0) {
      return results;
    }

    // Filter for large PNGs (> 50KB) that are good candidates for optimization
    const largePNGs = pngFiles.filter((path) => {
      const fileEntry = context.allFiles.find((f) => f.path === path);
      return fileEntry && fileEntry.size > 50 * 1024; // 50KB threshold
    });

    if (largePNGs.length === 0) {
      return results;
    }

    const affectedItems: AffectedItem[] = largePNGs.map((path) => {
      const fileEntry = context.allFiles.find((f) => f.path === path);
      const size = fileEntry?.size || 0;

      return {
        path,
        size,
        reason: 'Large PNG file - consider WebP or optimization',
        metadata: {
          format: 'PNG',
          estimatedWebPSavings: Math.floor(size * 0.3), // WebP typically 30% smaller
        },
      };
    });

    const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
    // Estimate 30% savings from WebP conversion or PNG optimization
    const potentialSavings = Math.floor(totalSize * 0.3);
    const percentOfTotal = calculatePercentage(potentialSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R002',
      title: `${largePNGs.length} Unoptimized PNG Images`,
      description: `${largePNGs.length} large PNG images (> 50KB) could be optimized or converted to WebP format.`,
      severity: 'medium',
      category: 'optimization',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `Convert PNG images to WebP format (30% smaller on average) or run PNG optimization tools like pngcrush or ImageOptim.`,
    });

    return results;
  },

  metadata: {
    examples: ['Large screenshots', 'High-resolution UI assets', 'Marketing images'],
    documentation: 'WebP provides better compression than PNG while maintaining quality. iOS 14+ and Android support WebP.',
    fixable: true,
  },
};

/**
 * R003: Debug Symbols Detection
 *
 * Detects debug symbols or debug builds that should not be in production
 */
export const debugSymbolsRule: InsightRule = {
  id: 'R003',
  category: 'optimization',
  name: 'Debug Symbols in Binary',
  description: 'Detects debug symbols or debug build artifacts that bloat app size',
  severity: 'critical',

  execute: async (context: AnalysisContext): Promise<InsightResult[]> => {
    const results: InsightResult[] = [];

    // Look for debug-related files
    const debugPatterns = [
      /\.dSYM\//i, // iOS debug symbols
      /\.dwarf$/i, // DWARF debug info
      /\.debug$/i, // Debug files
      /\.pdb$/i, // Windows debug symbols
      /\.map$/i, // Source maps
      /\.symbols$/i, // Symbol files
    ];

    const affectedItems: AffectedItem[] = [];

    for (const pattern of debugPatterns) {
      const matchingFiles = findFilesByPattern(context, pattern);

      matchingFiles.forEach((path) => {
        const fileEntry = context.allFiles.find((f) => f.path === path);
        if (fileEntry) {
          affectedItems.push({
            path,
            size: fileEntry.size,
            reason: 'Debug symbols or debug build artifact',
            metadata: { type: 'debug_symbols' },
          });
        }
      });
    }

    // Check build type if available
    if (context.buildType === 'debug') {
      // Add a warning about debug build
      const totalSize = context.totalInstallSize;

      results.push({
        ruleId: 'R003',
        title: 'Debug Build Detected',
        description: 'This appears to be a debug build. Release builds are typically 20-40% smaller.',
        severity: 'critical',
        category: 'optimization',
        affectedItems: [],
        potentialSavings: Math.floor(totalSize * 0.3), // Estimate 30% savings
        percentOfTotal: 30,
        actionable: true,
        fixSuggestion: 'Build in Release mode with optimizations enabled. For iOS: Archive for distribution. For Android: Build release APK with ProGuard/R8.',
      });
    }

    if (affectedItems.length > 0) {
      const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
      const percentOfTotal = calculatePercentage(totalSize, context.totalInstallSize);

      results.push({
        ruleId: 'R003',
        title: `${affectedItems.length} Debug Symbol Files Found`,
        description: `Debug symbols and debug artifacts are included in the binary, adding unnecessary size.`,
        severity: 'critical',
        category: 'optimization',
        affectedItems,
        potentialSavings: totalSize,
        percentOfTotal,
        actionable: true,
        fixSuggestion: 'Strip debug symbols before distribution. For iOS: Enable "Strip Debug Symbols During Copy". For Android: Use ProGuard/R8 with optimization.',
      });
    }

    return results;
  },

  metadata: {
    examples: ['.dSYM folders', 'DWARF debug info', 'Source maps in production'],
    documentation: 'Debug symbols dramatically increase app size and should only be kept for crash symbolication (stored separately).',
    fixable: true,
  },
};

/**
 * R004: iOS Asset Catalog Optimization
 *
 * Detects @2x/@3x images outside asset catalogs that should be cataloged
 */
export const iOSAssetCatalogRule: InsightRule = {
  id: 'R004',
  category: 'optimization',
  name: 'Images Outside Asset Catalogs (iOS)',
  description: 'Detects iOS images not in asset catalogs that could benefit from thinning',
  severity: 'medium',

  execute: async (context: AnalysisContext): Promise<InsightResult[]> => {
    const results: InsightResult[] = [];

    // Only run for iOS apps
    if (context.platform !== 'iOS') {
      return results;
    }

    // Find @2x and @3x images outside of .car files (asset catalogs)
    const imagePattern = /@[23]x\.(png|jpg|jpeg)$/i;
    const assetCatalogPattern = /\.car$/i;

    const allImages = findFilesByPattern(context, imagePattern);

    // Filter out images that are in asset catalogs
    const imagesOutsideCatalogs = allImages.filter((path) => {
      // Check if this image path suggests it's in a catalog
      // Asset catalog images are typically inside .car files or Assets.car
      return !assetCatalogPattern.test(path) && !path.includes('Assets.car');
    });

    if (imagesOutsideCatalogs.length === 0) {
      return results;
    }

    const affectedItems: AffectedItem[] = imagesOutsideCatalogs.map((path) => {
      const fileEntry = context.allFiles.find((f) => f.path === path);
      return {
        path,
        size: fileEntry?.size || 0,
        reason: '@2x/@3x image outside asset catalog - missing app thinning benefits',
        metadata: { recommendation: 'Move to asset catalog' },
      };
    });

    const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
    // App thinning delivers only needed resolutions, saving ~40% on average
    const potentialSavings = Math.floor(totalSize * 0.4);
    const percentOfTotal = calculatePercentage(potentialSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R004',
      title: `${imagesOutsideCatalogs.length} Images Outside Asset Catalogs`,
      description: `${imagesOutsideCatalogs.length} @2x/@3x images are not in asset catalogs. Moving them enables app thinning.`,
      severity: 'medium',
      category: 'optimization',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: 'Move @2x and @3x images to an asset catalog in Xcode. This enables app thinning so users only download images for their device resolution.',
    });

    return results;
  },

  metadata: {
    examples: ['icon@2x.png in Resources/', 'background@3x.jpg not in Assets.xcassets'],
    documentation: 'Asset catalogs enable app thinning, delivering only the assets needed for each device.',
    fixable: true,
  },
};

/**
 * R005: Unused Android Resources
 *
 * Detects Android resources that are never referenced in DEX code
 */
export const unusedAndroidResourcesRule: InsightRule = {
  id: 'R005',
  category: 'unused',
  name: 'Unused Android Resources',
  description: 'Detects Android resources that are never referenced in code',
  severity: 'medium',

  execute: async (context: AnalysisContext): Promise<InsightResult[]> => {
    const results: InsightResult[] = [];

    // Only run for Android apps
    if (context.platform !== 'Android') {
      return results;
    }

    // Find all resource files in res/ directory
    const resourceFiles = context.allFiles.filter(
      (file) => file.path.startsWith('res/') && !file.path.includes('values')
    );

    if (resourceFiles.length === 0) {
      return results;
    }

    // TODO: To properly detect unused resources, we would need to:
    // 1. Parse resources.arsc to get resource IDs
    // 2. Parse DEX files to find all referenced resource IDs
    // 3. Compare to find unused ones
    //
    // For now, we'll use heuristics:
    // - Large resource files in less common density folders (tvdpi, ldpi)
    // - Resource files in unused configuration folders

    const affectedItems: AffectedItem[] = [];

    // Heuristic: Find resources in uncommon densities (tvdpi, ldpi)
    const uncommonDensityPattern = /res\/(drawable|mipmap)-(tv|l)dpi\//i;
    const uncommonDensityFiles = resourceFiles.filter((file) =>
      uncommonDensityPattern.test(file.path)
    );

    uncommonDensityFiles.forEach((file) => {
      if (file.size > 10 * 1024) {
        // > 10KB
        affectedItems.push({
          path: file.path,
          size: file.size,
          reason: 'Resource in uncommon density folder (ldpi/tvdpi) - may be unused',
          metadata: { type: 'uncommon_density' },
        });
      }
    });

    // Heuristic: Find very large resource files (> 500KB)
    const largeResources = resourceFiles.filter((file) => file.size > 500 * 1024);
    largeResources.forEach((file) => {
      affectedItems.push({
        path: file.path,
        size: file.size,
        reason: 'Very large resource file - verify if used',
        metadata: { type: 'large_resource' },
      });
    });

    if (affectedItems.length === 0) {
      return results;
    }

    const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
    const percentOfTotal = calculatePercentage(totalSize, context.totalInstallSize);

    results.push({
      ruleId: 'R005',
      title: `${affectedItems.length} Potentially Unused Android Resources`,
      description: `${affectedItems.length} resource files may be unused or in uncommon configurations.`,
      severity: 'medium',
      category: 'unused',
      affectedItems,
      potentialSavings: totalSize,
      percentOfTotal,
      actionable: true,
      fixSuggestion: 'Run Android Lint to detect unused resources, then enable resource shrinking with "shrinkResources true" in build.gradle.',
    });

    return results;
  },

  metadata: {
    examples: ['drawable-ldpi files', 'Large unused images', 'Unused XML layouts'],
    documentation: 'Android resource shrinking automatically removes unused resources at build time.',
    fixable: true,
  },
};

/**
 * R006: Unused Localization Detection
 *
 * Detects excessive localization files that may not be needed
 */
export const unusedLocalizationRule: InsightRule = {
  id: 'R006',
  category: 'unused',
  name: 'Excessive Localizations',
  description: 'Detects localization files for many languages that may not be needed',
  severity: 'low',

  execute: async (context: AnalysisContext): Promise<InsightResult[]> => {
    const results: InsightResult[] = [];

    // Find localization files
    let localizationFiles: string[] = [];

    if (context.platform === 'iOS') {
      // iOS: .lproj directories
      localizationFiles = context.allFiles
        .filter((file) => file.path.includes('.lproj/'))
        .map((file) => file.path);
    } else if (context.platform === 'Android') {
      // Android: values-xx directories
      localizationFiles = context.allFiles
        .filter((file) => file.path.match(/res\/values-[a-z]{2}(-[A-Z]{2})?\//))
        .map((file) => file.path);
    }

    if (localizationFiles.length === 0) {
      return results;
    }

    // Extract unique languages
    const languages = new Set<string>();

    localizationFiles.forEach((path) => {
      if (context.platform === 'iOS') {
        const match = path.match(/([a-z]{2}(?:-[A-Z]{2})?)\.lproj/);
        if (match && match[1]) languages.add(match[1]);
      } else {
        const match = path.match(/values-([a-z]{2}(?:-[A-Z]{2})?)\//);
        if (match && match[1]) languages.add(match[1]);
      }
    });

    // If app has more than 10 localizations, flag as potentially excessive
    if (languages.size <= 10) {
      return results;
    }

    const affectedItems: AffectedItem[] = Array.from(languages).map((lang) => {
      // Calculate size for this language
      const langFiles = localizationFiles.filter((path) => path.includes(lang));
      const totalSize = langFiles.reduce((sum, path) => {
        const file = context.allFiles.find((f) => f.path === path);
        return sum + (file?.size || 0);
      }, 0);

      return {
        path: lang,
        size: totalSize,
        reason: `Localization for ${lang}`,
        metadata: { language: lang, fileCount: langFiles.length },
      };
    });

    const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
    // Estimate removing half of the localizations
    const potentialSavings = Math.floor(totalSize * 0.5);
    const percentOfTotal = calculatePercentage(potentialSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R006',
      title: `${languages.size} Localizations Found`,
      description: `App includes ${languages.size} language localizations. Consider limiting to supported markets.`,
      severity: 'low',
      category: 'unused',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: 'Review which languages your app actually supports and remove unused localizations. Use on-demand resources (iOS) or Android App Bundles for language-specific delivery.',
    });

    return results;
  },

  metadata: {
    examples: ['50+ .lproj folders', 'Localizations for unsupported markets'],
    documentation: 'Only include localizations for languages your app actually supports. Use dynamic delivery for less common languages.',
    fixable: true,
  },
};

/**
 * Export all rules
 */
export const allInsightRules: InsightRule[] = [
  duplicateDetectionRule,
  unoptimizedPNGRule,
  debugSymbolsRule,
  iOSAssetCatalogRule,
  unusedAndroidResourcesRule,
  unusedLocalizationRule,
];

/**
 * Get rules by category
 */
export function getRulesByCategory(category: string): InsightRule[] {
  return allInsightRules.filter((rule) => rule.category === category);
}

/**
 * Get rule by ID
 */
export function getRuleById(ruleId: string): InsightRule | undefined {
  return allInsightRules.find((rule) => rule.id === ruleId);
}
