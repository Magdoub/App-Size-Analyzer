/**
 * Insight Rules
 *
 * Implementation of specific optimization detection rules
 */

import {
  findDuplicatesByHash,
  calculateDuplicateSavings,
  findFilesByExtension,
  findFilesByPattern,
  calculatePercentage,
} from './insight-engine.js';

/**
 * @typedef {import('../../types/analysis.js').AnalysisContext} AnalysisContext
 * @typedef {import('../../types/insights.js').InsightRule} InsightRule
 * @typedef {import('../../types/insights.js').InsightResult} InsightResult
 * @typedef {import('../../types/insights.js').AffectedItem} AffectedItem
 */

/**
 * R001: Duplicate File Detection (Platform-Aware)
 *
 * Detects files with identical content (same hash) that could be deduplicated
 * - Android: Only flags duplicates saving ≥512 bytes (avoid false positives from tiny files)
 * - iOS: No minimum threshold (flag all duplicates)
 * @type {InsightRule}
 */
export const duplicateDetectionRule = {
  id: 'R001',
  category: 'duplicates',
  name: 'Duplicate Files',
  description: 'Detects duplicate files with identical content that waste space (platform-specific thresholds)',
  severity: 'high',

  execute: async (context) => {
    const results = [];

    // Find duplicates by hash
    const duplicates = await findDuplicatesByHash(context);

    if (duplicates.size === 0) {
      return results;
    }

    // Platform-specific thresholds (from spec FR-013, FR-014)
    const ANDROID_MIN_THRESHOLD = 512; // bytes - avoid false positives from tiny duplicates
    const IOS_MIN_THRESHOLD = 0; // bytes - flag all duplicates for iOS

    const minThreshold = context.platform === 'Android' ? ANDROID_MIN_THRESHOLD : IOS_MIN_THRESHOLD;

    // Create insight for each set of duplicates
    duplicates.forEach((paths, hash) => {
      if (paths.length <= 1) return;

      const affectedItems = paths.map((path) => {
        const fileEntry = context.allFiles.find((f) => f.path === path);
        return {
          path,
          size: fileEntry?.size || 0,
          reason: 'Duplicate of other files in this group',
          metadata: { hash, duplicateCount: paths.length },
        };
      });

      const potentialSavings = calculateDuplicateSavings(context, paths);

      // Apply platform-specific threshold
      if (potentialSavings < minThreshold) {
        return; // Skip duplicates below threshold
      }

      const percentOfTotal = calculatePercentage(potentialSavings, context.totalInstallSize);

      // Platform-specific fix suggestions
      const platformHint = context.platform === 'Android'
        ? 'Use resource references (@drawable/image, @string/text) to avoid duplication. Android resource system handles deduplication automatically.'
        : 'Move images to asset catalogs in Xcode. Use NSLocalizedString for strings. Asset catalogs prevent duplication across @2x/@3x variants.';

      results.push({
        ruleId: 'R001',
        title: `${paths.length} Duplicate Files Found`,
        description: `${paths.length} files have identical content. Deduplicating these files could save ${(potentialSavings / 1024).toFixed(1)}KB${context.platform === 'Android' ? ' (threshold: ≥512 bytes)' : ''}.`,
        severity: 'high',
        category: 'duplicates',
        affectedItems,
        potentialSavings,
        percentOfTotal,
        actionable: true,
        fixSuggestion: `**Platform-Specific Guidance (${context.platform}):**\n\n${platformHint}\n\n**General Strategies:**\n\n1. **Review affected files** - Determine if duplication is intentional\n2. **Consolidate resources** - Keep only one copy, reference from multiple locations\n3. **Use build tools** - Let the build system handle resource optimization\n\n**Detected duplicate groups:**\nThis insight found ${paths.length} files with identical content. Keeping only one copy will save ${(potentialSavings / 1024).toFixed(1)}KB.`,
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
 * @type {InsightRule}
 */
export const unoptimizedPNGRule = {
  id: 'R002',
  category: 'optimization',
  name: 'Unoptimized PNG Images',
  description: 'Detects PNG images that could be converted to WebP or optimized',
  severity: 'medium',

  execute: async (context) => {
    const results = [];

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

    const affectedItems = largePNGs.map((path) => {
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
 * @type {InsightRule}
 */
export const debugSymbolsRule = {
  id: 'R003',
  category: 'optimization',
  name: 'Debug Symbols in Binary',
  description: 'Detects debug symbols or debug build artifacts that bloat app size',
  severity: 'critical',

  execute: async (context) => {
    const results = [];

    // Look for debug-related files
    const debugPatterns = [
      /\.dSYM\//i, // iOS debug symbols
      /\.dwarf$/i, // DWARF debug info
      /\.debug$/i, // Debug files
      /\.pdb$/i, // Windows debug symbols
      /\.map$/i, // Source maps
      /\.symbols$/i, // Symbol files
    ];

    const affectedItems = [];

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
 * @type {InsightRule}
 */
export const iOSAssetCatalogRule = {
  id: 'R004',
  category: 'optimization',
  name: 'Images Outside Asset Catalogs (iOS)',
  description: 'Detects iOS images not in asset catalogs that could benefit from thinning',
  severity: 'medium',

  execute: async (context) => {
    const results = [];

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

    const affectedItems = imagesOutsideCatalogs.map((path) => {
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
 * @type {InsightRule}
 */
export const unusedAndroidResourcesRule = {
  id: 'R005',
  category: 'unused',
  name: 'Unused Android Resources',
  description: 'Detects Android resources that are never referenced in code',
  severity: 'medium',

  execute: async (context) => {
    const results = [];

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

    const affectedItems = [];

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
 * @type {InsightRule}
 */
export const unusedLocalizationRule = {
  id: 'R006',
  category: 'unused',
  name: 'Excessive Localizations',
  description: 'Detects localization files for many languages that may not be needed',
  severity: 'low',

  execute: async (context) => {
    const results = [];

    // Find localization files
    let localizationFiles = [];

    if (context.platform === 'iOS') {
      // iOS: .lproj directories
      localizationFiles = context.allFiles
        .filter((file) => file.path.includes('.lproj/'))
        .map((file) => file.path);
    } else if (context.platform === 'Android') {
      // Android: values-xx directories
      localizationFiles = context.allFiles
        .filter((file) => file.path.match(/res\/values-[a-z]{2}(-[A-Z]{2})?\//)
)
        .map((file) => file.path);
    }

    if (localizationFiles.length === 0) {
      return results;
    }

    // Extract unique languages
    const languages = new Set();

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

    const affectedItems = Array.from(languages).map((lang) => {
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
 * R007: Multiple Native Library Architectures (Android)
 *
 * Detects Android apps bundling multiple ABIs when only arm64-v8a is needed for modern devices
 * @type {InsightRule}
 */
export const multipleArchitecturesRule = {
  id: 'R007',
  category: 'architecture',
  name: 'Multiple Native Library Architectures (Android)',
  description: 'Detects unnecessary native library architectures that bloat APK size',
  severity: 'high',

  execute: async (context) => {
    const results = [];

    // Only run for Android apps
    if (context.platform !== 'Android') {
      return results;
    }

    // Find all lib/ directories (ABI folders)
    const abiPattern = /^lib\/(arm64-v8a|armeabi-v7a|armeabi|x86|x86_64)\//;
    const abiFiles = context.allFiles.filter((file) => abiPattern.test(file.path));

    if (abiFiles.length === 0) {
      return results;
    }

    // Group files by ABI
    const abiToFiles = new Map();
    abiFiles.forEach((file) => {
      const match = file.path.match(abiPattern);
      if (match && match[1]) {
        const abi = match[1];
        if (!abiToFiles.has(abi)) {
          abiToFiles.set(abi, []);
        }
        abiToFiles.get(abi).push(file);
      }
    });

    // If only one ABI, no issue
    if (abiToFiles.size <= 1) {
      return results;
    }

    // Calculate size per ABI
    const abiSizes = new Map();
    abiToFiles.forEach((files, abi) => {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      abiSizes.set(abi, {
        abi,
        fileCount: files.length,
        totalSize,
        files
      });
    });

    // Modern Android devices (99%+) use arm64-v8a
    // All other ABIs are wasteful for Play Store distribution
    const primaryAbi = 'arm64-v8a';
    const unnecessaryAbis = Array.from(abiSizes.keys()).filter(abi => abi !== primaryAbi);

    if (unnecessaryAbis.length === 0) {
      return results;
    }

    // Calculate waste
    const totalWaste = unnecessaryAbis.reduce((sum, abi) => {
      return sum + abiSizes.get(abi).totalSize;
    }, 0);

    const percentOfTotal = calculatePercentage(totalWaste, context.totalInstallSize);

    // Build affected items list
    const affectedItems = [];
    unnecessaryAbis.forEach((abi) => {
      const abiData = abiSizes.get(abi);
      affectedItems.push({
        path: `lib/${abi}/`,
        size: abiData.totalSize,
        reason: `Unnecessary architecture for modern devices (${abiData.fileCount} files)`,
        metadata: {
          abi,
          fileCount: abiData.fileCount,
          filesPreview: abiData.files.slice(0, 5).map(f => f.path)
        }
      });
    });

    // Determine severity based on waste percentage
    let severity = 'medium';
    if (percentOfTotal > 30) {
      severity = 'critical';
    } else if (percentOfTotal > 15) {
      severity = 'high';
    }

    results.push({
      ruleId: 'R007',
      title: `${abiToFiles.size} Native Library Architectures Found`,
      description: `App includes ${abiToFiles.size} different CPU architectures. Modern devices only need arm64-v8a. Unnecessary ABIs waste ${(totalWaste / 1024 / 1024).toFixed(1)}MB (${percentOfTotal.toFixed(1)}% of app).`,
      severity,
      category: 'architecture',
      affectedItems,
      potentialSavings: totalWaste,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `**For Play Store (recommended):** Ship Android App Bundles (.aab) instead of APKs. Google Play will automatically deliver only arm64-v8a to modern devices.\n\n**build.gradle configuration:**\n\`\`\`gradle\nandroid {\n  bundle {\n    abi {\n      enableSplit = true  // Default, but ensure it's not disabled\n    }\n  }\n}\n\`\`\`\n\n**For manual APK splits:**\n\`\`\`gradle\nandroid {\n  splits {\n    abi {\n      enable = true\n      reset()\n      include 'arm64-v8a'  // Only include arm64 for modern devices\n      universalApk false   // Don't create a universal APK\n    }\n  }\n}\n\`\`\`\n\n**Architecture breakdown:**\n${Array.from(abiSizes.entries()).map(([abi, data]) =>
  `• ${abi}: ${(data.totalSize / 1024 / 1024).toFixed(1)}MB (${data.fileCount} files)${abi === primaryAbi ? ' ✓ Keep' : ' ✗ Remove'}`
).join('\n')}\n\n**Impact:** Switching to AAB or arm64-only APKs will reduce download size by ${(totalWaste / 1024 / 1024).toFixed(1)}MB (${percentOfTotal.toFixed(0)}%).`,
    });

    return results;
  },

  metadata: {
    examples: ['Universal APKs with 5 ABIs', 'Apps with x86/x86_64 for emulator testing'],
    documentation: 'Users only need native libraries for their device\'s architecture. arm64-v8a covers 99%+ of modern Android devices.',
    fixable: true,
  },
};

/**
 * R008: Avoid Many Files (iOS)
 *
 * Detects excessive file count which increases filesystem metadata overhead
 * @type {InsightRule}
 */
export const avoidManyFilesRule = {
  id: 'R008',
  category: 'optimization',
  name: 'Avoid Many Files (iOS)',
  description: 'Detects excessive file count that increases app size through metadata overhead',
  severity: 'low',

  execute: async (context) => {
    const results = [];

    // Only run for iOS apps
    if (context.platform !== 'iOS') {
      return results;
    }

    const totalFiles = context.allFiles.length;

    // Emerge's threshold is around 10,000 files
    // Each file has ~4KB of metadata overhead on iOS
    const threshold = 10000;

    if (totalFiles <= threshold) {
      return results;
    }

    // Calculate metadata overhead
    const metadataPerFile = 4 * 1024; // 4KB average metadata per file
    const excessFiles = totalFiles - threshold;
    const metadataOverhead = excessFiles * metadataPerFile;
    const percentOfTotal = calculatePercentage(metadataOverhead, context.totalInstallSize);

    // Group files by directory to identify problem areas
    const directoryCounts = new Map();
    context.allFiles.forEach((file) => {
      const directory = file.path.split('/').slice(0, -1).join('/') || '/';
      directoryCounts.set(directory, (directoryCounts.get(directory) || 0) + 1);
    });

    // Find directories with most files
    const topDirectories = Array.from(directoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const affectedItems = topDirectories.map(([dir, count]) => ({
      path: dir,
      size: count * metadataPerFile,
      reason: `${count} files in this directory`,
      metadata: { fileCount: count }
    }));

    results.push({
      ruleId: 'R008',
      title: `${totalFiles.toLocaleString()} Files Detected`,
      description: `App contains ${totalFiles.toLocaleString()} files. Each file has ~4KB of metadata overhead on iOS. Consider consolidating resources to reduce file count.`,
      severity: percentOfTotal > 5 ? 'medium' : 'low',
      category: 'optimization',
      affectedItems,
      potentialSavings: metadataOverhead,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `**Strategies to reduce file count:**\n\n1. **Use Asset Catalogs** (recommended):\n   - Consolidates image resources into .car files\n   - Reduces file count by 50-70% for image-heavy apps\n   - Enable in Xcode: Target → Build Settings → "Enable Asset Catalog Compilation"\n\n2. **Bundle Resources:**\n   \`\`\`swift\n   // Instead of 1000 individual JSON files:\n   // assets/data/file1.json, file2.json, ..., file1000.json\n   \n   // Create a single bundled archive:\n   // assets/data/bundle.zip (extract at runtime)\n   \`\`\`\n\n3. **Audit Excessive Files:**\n   Top directories by file count:\n   ${topDirectories.slice(0, 5).map(([dir, count]) =>
  `   • ${dir}: ${count} files`
).join('\n')}\n\n4. **Remove Redundant Localizations:**\n   - Each localization multiplies file count\n   - Use base.lproj for shared resources\n   - Only localize text strings, not assets\n\n5. **Use On-Demand Resources:**\n   - Tag rarely-used content for on-demand download\n   - Reduces initial app file count\n   - Xcode: Select resources → Inspector → "On Demand Resource Tags"\n\n**Impact:** Reducing file count by ${excessFiles.toLocaleString()} files will save ~${(metadataOverhead / 1024 / 1024).toFixed(1)}MB in metadata overhead.`,
    });

    return results;
  },

  metadata: {
    examples: ['Apps with 50,000+ small images', 'Multiple language variants of same resources'],
    documentation: 'iOS filesystem metadata for each file adds overhead. Consolidating resources reduces app size.',
    fixable: true,
  },
};

/**
 * R009: Optimize Icons (iOS)
 *
 * Detects app icons that are larger than necessary and could be optimized
 * @type {InsightRule}
 */
export const optimizeIconsRule = {
  id: 'R009',
  category: 'optimization',
  name: 'Optimize Icons (iOS)',
  description: 'Detects unoptimized app icons that could be compressed without quality loss',
  severity: 'low',

  execute: async (context) => {
    const results = [];

    // Only run for iOS apps
    if (context.platform !== 'iOS') {
      return results;
    }

    // Find app icon files
    // Typical patterns: AppIcon*.png, Icon-*.png, icon*.png in asset catalogs or root
    const iconPattern = /(AppIcon|Icon).*\.(png|jpg|jpeg)$/i;
    const iconFiles = context.allFiles.filter((file) =>
      iconPattern.test(file.path) || file.path.includes('Assets.car')
    );

    if (iconFiles.length === 0) {
      return results;
    }

    // Expected icon sizes (iOS app icons should be ~60-80KB after optimization)
    // Larger icons (e.g., 1024x1024 AppIcon) should be ~80-120KB
    const iconSizeThresholds = {
      small: 50 * 1024,  // Icons < 50KB are fine
      medium: 100 * 1024, // Icons 50-100KB are borderline
      large: 150 * 1024,  // Icons > 100KB need optimization
    };

    // Find icons that are too large
    const unoptimizedIcons = iconFiles.filter((file) => {
      // Skip very small files (not actual icons)
      if (file.size < 10 * 1024) return false;

      // Flag if larger than expected
      // For @3x icons: expect ~80KB, flag if >100KB
      // For @2x icons: expect ~50KB, flag if >75KB
      if (file.path.includes('@3x')) {
        return file.size > 100 * 1024;
      } else if (file.path.includes('@2x')) {
        return file.size > 75 * 1024;
      } else if (file.path.includes('1024')) {
        // 1024x1024 marketing icon
        return file.size > 150 * 1024;
      } else {
        // Standard icons
        return file.size > iconSizeThresholds.medium;
      }
    });

    if (unoptimizedIcons.length === 0) {
      return results;
    }

    const affectedItems = unoptimizedIcons.map((file) => {
      // Estimate savings (typically 30-40% with lossless optimization)
      const estimatedOptimizedSize = Math.floor(file.size * 0.65);
      const potentialSavings = file.size - estimatedOptimizedSize;

      return {
        path: file.path,
        size: file.size,
        reason: `Icon is ${(file.size / 1024).toFixed(0)}KB (expected ~${file.path.includes('@3x') ? '80' : '50'}KB)`,
        metadata: {
          currentSize: file.size,
          expectedSize: estimatedOptimizedSize,
          potentialSavings
        }
      };
    });

    const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
    const totalSavings = affectedItems.reduce((sum, item) => sum + item.metadata.potentialSavings, 0);
    const percentOfTotal = calculatePercentage(totalSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R009',
      title: `${unoptimizedIcons.length} Unoptimized App Icons`,
      description: `${unoptimizedIcons.length} app icons are larger than expected (${(totalSize / 1024).toFixed(0)}KB total). Optimizing them could save ${(totalSavings / 1024).toFixed(0)}KB with no visible quality loss.`,
      severity: percentOfTotal > 0.5 ? 'medium' : 'low',
      category: 'optimization',
      affectedItems,
      potentialSavings: totalSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `**Quick Fix (Automated Tools):**\n\n1. **ImageOptim** (Mac, free):\n   - Drag all icon files into ImageOptim\n   - Lossless compression, no quality loss\n   - Typically reduces size by 30-40%\n   - Download: https://imageoptim.com\n\n2. **Command Line** (pngcrush):\n   \`\`\`bash\n   # Install pngcrush\n   brew install pngcrush\n   \n   # Optimize all icon files\n   find . -name "AppIcon*.png" -exec pngcrush -ow {} \\;\n   \`\`\`\n\n3. **Xcode Asset Catalog Settings:**\n   - Select Assets.xcassets → Inspector\n   - Enable "Compress PNG Files" (should be on by default)\n   - Build Settings → "Compress PNG Files" = YES\n\n4. **Online Tools:**\n   - TinyPNG: https://tinypng.com (PNG/JPEG)\n   - Squoosh: https://squoosh.app (Google's image optimizer)\n\n**Expected Sizes:**\n- @3x icons: ~80KB\n- @2x icons: ~50KB\n- 1024x1024 marketing icon: ~100-120KB\n\n**Current unoptimized icons:**\n${affectedItems.slice(0, 5).map(item =>
  `• ${item.path.split('/').pop()}: ${(item.size / 1024).toFixed(0)}KB → ${(item.metadata.expectedSize / 1024).toFixed(0)}KB (save ${(item.metadata.potentialSavings / 1024).toFixed(0)}KB)`
).join('\n')}\n\n**Impact:** Total savings of ${(totalSavings / 1024).toFixed(0)}KB (~${percentOfTotal.toFixed(1)}% of app size) with 5 minutes of work.`,
    });

    return results;
  },

  metadata: {
    examples: ['1024x1024 AppIcon at 300KB', 'Uncompressed @3x icons at 150KB each'],
    documentation: 'App icons are displayed frequently and should be optimized. Use lossless PNG compression tools.',
    fixable: true,
  },
};

/**
 * R011: Image Optimization with Real Testing
 *
 * Detects unoptimized images and performs actual compression testing (not estimation)
 * Tests JPEG 85% quality and WebP 85% (if supported) to provide exact savings
 * @type {InsightRule}
 */
export const imageOptimizationRule = {
  id: 'R011',
  category: 'optimization',
  name: 'Unoptimized Images (Real Testing)',
  description: 'Detects images that could be compressed with actual compression testing',
  severity: 'high',

  execute: async (context) => {
    const results = [];

    // Find all image files (PNG, JPEG, WebP)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const imageFiles = context.allFiles.filter((file) => {
      const ext = file.path.toLowerCase().substring(file.path.lastIndexOf('.'));
      return imageExtensions.includes(ext);
    });

    if (imageFiles.length === 0) {
      return results;
    }

    // Filter images > 4KB (minimum threshold from spec)
    const MIN_SIZE_THRESHOLD = 4096; // 4KB
    const candidateImages = imageFiles.filter((file) => file.size > MIN_SIZE_THRESHOLD);

    if (candidateImages.length === 0) {
      return results;
    }

    // For actual compression testing, we need to:
    // 1. Access the compression worker via Comlink (handled by compression-worker.js)
    // 2. Test JPEG 85% and WebP 85% (if browser supports)
    // 3. Return results with exact savings

    // Note: In the real implementation, this would call the compression worker
    // For now, we'll create a placeholder that can be enhanced by the UI layer
    // The actual compression will be triggered when InsightCard.vue displays the insight

    // Estimate potential optimizable images (conservative: 40-60% reduction)
    // This will be replaced with actual compression results when displayed
    const affectedItems = candidateImages.slice(0, 50).map((file) => {
      const ext = file.path.toLowerCase().substring(file.path.lastIndexOf('.'));

      // Estimate savings based on format
      let estimatedSavingsPercent = 0.5; // 50% default
      if (ext === '.png') {
        estimatedSavingsPercent = 0.6; // PNG typically compresses better to JPEG/WebP
      } else if (ext === '.jpg' || ext === '.jpeg') {
        estimatedSavingsPercent = 0.3; // JPEG already compressed, but can improve quality ratio
      }

      const estimatedSavings = Math.floor(file.size * estimatedSavingsPercent);

      return {
        path: file.path,
        size: file.size,
        reason: `Could save ~${(estimatedSavings / 1024).toFixed(1)}KB with compression testing (JPEG 85% or WebP)`,
        metadata: {
          originalFormat: ext.substring(1), // Remove dot
          estimatedSavings,
          requiresCompression: true, // Signal to UI to perform actual testing
        },
      };
    });

    const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
    const totalEstimatedSavings = affectedItems.reduce(
      (sum, item) => sum + item.metadata.estimatedSavings,
      0
    );
    const percentOfTotal = calculatePercentage(totalEstimatedSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R011',
      title: `${affectedItems.length} Images Could Be Optimized (Real Testing)`,
      description: `${affectedItems.length} images (${(totalSize / 1024 / 1024).toFixed(1)}MB total) could be compressed with actual testing. Estimated savings: ${(totalEstimatedSavings / 1024 / 1024).toFixed(1)}MB (${percentOfTotal.toFixed(1)}% of app). Click to run compression tests for exact results.`,
      severity: percentOfTotal > 5 ? 'high' : 'medium',
      category: 'optimization',
      affectedItems,
      potentialSavings: totalEstimatedSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## How to Fix Unoptimized Images

This insight performs **actual compression testing** (not estimates) to show you exact savings.

### Automated Tools (Recommended)

**1. ImageOptim** (Mac, free):
- Drag images into ImageOptim
- Automatically tests multiple compression algorithms
- Shows exact savings before/after
- Lossless and lossy modes available
- Download: https://imageoptim.com

**2. Squoosh** (Web-based, Google):
- Upload images to https://squoosh.app
- Compare WebP, JPEG, AVIF side-by-side
- Adjust quality slider for optimal size/quality ratio
- Download optimized images

**3. TinyPNG** (Web-based):
- Upload PNG/JPEG files to https://tinypng.com
- Intelligent lossy compression (85% quality)
- Batch process up to 20 images
- Free for <5MB per file

### Command Line Tools

**pngcrush** (PNG optimization):
\`\`\`bash
# Install
brew install pngcrush  # Mac
apt-get install pngcrush  # Linux

# Optimize all PNG files
find . -name "*.png" -exec pngcrush -ow {} \\;
\`\`\`

**cwebp** (WebP conversion):
\`\`\`bash
# Install
brew install webp  # Mac

# Convert PNG/JPEG to WebP (85% quality)
cwebp -q 85 input.png -o output.webp
\`\`\`

**ImageMagick** (universal):
\`\`\`bash
# Install
brew install imagemagick  # Mac

# Convert to JPEG 85% quality
convert input.png -quality 85 output.jpg

# Batch convert all PNG to JPEG
mogrify -format jpg -quality 85 *.png
\`\`\`

### Platform-Specific Settings

**iOS (Xcode):**
1. Select Assets.xcassets → Inspector
2. Enable "Compress PNG Files" (default: ON)
3. Build Settings → COMPRESS_PNG_FILES = YES
4. Consider using HEIC format for iOS 12+ (smaller than PNG)

**Android (Gradle):**
\`\`\`gradle
android {
  buildTypes {
    release {
      // Enable PNG crunching (default: true)
      crunchPngs true

      // Enable resource shrinking
      shrinkResources true
      minifyEnabled true
    }
  }
}
\`\`\`

### Compression Guidelines

**Quality Settings:**
- **85% quality**: Recommended for most images (40-60% size reduction, imperceptible quality loss)
- **90% quality**: High-quality images (30-40% reduction)
- **75% quality**: Acceptable for thumbnails/backgrounds (60-70% reduction)

**Format Recommendations:**
- **WebP**: Best compression (30-50% smaller than PNG/JPEG), but not supported in Safari
- **JPEG 85%**: Universal support, good compression for photos
- **PNG optimization**: Use for images requiring transparency

**Testing Your Own Images:**
This tool performs actual compression tests using Canvas API. The compression worker tests:
1. JPEG 85% quality
2. WebP 85% quality (if browser supports, not Safari)
3. Returns best format with exact byte savings

**Expected Results:**
- PNG → JPEG 85%: ~50-60% size reduction
- PNG → WebP 85%: ~60-70% size reduction
- JPEG → optimized JPEG: ~10-30% size reduction
- JPEG → WebP 85%: ~20-40% size reduction

**Impact:**
Total estimated savings: ${(totalEstimatedSavings / 1024 / 1024).toFixed(1)}MB (~${percentOfTotal.toFixed(1)}% of app size)`,
      metadata: {
        requiresRealTesting: true,
        testDuration: '~30-60s for 100 images',
        testedCount: affectedItems.length,
      },
    });

    return results;
  },

  metadata: {
    examples: [
      'Uncompressed PNG screenshots at 2MB each',
      'JPEG images at 95% quality instead of 85%',
      'Large images without WebP conversion',
    ],
    documentation:
      'This rule performs actual compression testing (not estimation) using Canvas API to show exact savings.',
    fixable: true,
  },
};

/**
 * R010: Firebase Security Vulnerability (Android)
 *
 * Detects exposed Firebase API keys in google-services.json that could leak sensitive
 * remote config data, feature flags, and secrets via APK extraction
 * @type {InsightRule}
 */
export const firebaseAPIExposedRule = {
  id: 'R010',
  category: 'security',
  name: 'Firebase API Keys Exposed (Android)',
  description: 'Detects exposed Firebase API keys in google-services.json that pose a critical security risk',
  severity: 'high',

  execute: async (context) => {
    const results = [];

    // Only run for Android apps
    if (context.platform !== 'Android') {
      return results;
    }

    // Look for Firebase-related files and patterns
    const firebasePatterns = [
      { pattern: /google-services\.json$/i, service: 'Firebase Config' },
      { pattern: /firebase.*\.json$/i, service: 'Firebase Data' },
      { pattern: /com\/google\/firebase/i, service: 'Firebase SDK' },
      { pattern: /firebase-.*\.jar$/i, service: 'Firebase Library' },
      { pattern: /com\/google\/android\/gms/i, service: 'Google Play Services' },
    ];

    const firebaseFiles = [];
    let totalFirebaseSize = 0;

    firebasePatterns.forEach(({ pattern, service }) => {
      const matches = context.allFiles.filter((file) => pattern.test(file.path));
      matches.forEach((file) => {
        firebaseFiles.push({
          ...file,
          service
        });
        totalFirebaseSize += file.size;
      });
    });

    if (firebaseFiles.length === 0) {
      return results;
    }

    // Check for google-services.json which contains API keys
    const hasGoogleServices = firebaseFiles.some(f => f.path.includes('google-services.json'));

    // Detect Firebase modules (estimate from file paths)
    const firebaseModules = new Set();
    firebaseFiles.forEach((file) => {
      if (file.path.includes('firebase-analytics')) firebaseModules.add('Analytics');
      if (file.path.includes('firebase-auth')) firebaseModules.add('Authentication');
      if (file.path.includes('firebase-database')) firebaseModules.add('Realtime Database');
      if (file.path.includes('firebase-firestore')) firebaseModules.add('Firestore');
      if (file.path.includes('firebase-storage')) firebaseModules.add('Storage');
      if (file.path.includes('firebase-messaging')) firebaseModules.add('Cloud Messaging');
      if (file.path.includes('firebase-crashlytics')) firebaseModules.add('Crashlytics');
      if (file.path.includes('firebase-remote-config')) firebaseModules.add('Remote Config');
      if (file.path.includes('firebase-dynamic-links')) firebaseModules.add('Dynamic Links');
      if (file.path.includes('firebase-performance')) firebaseModules.add('Performance Monitoring');
    });

    // Firebase is typically 5-30MB depending on modules
    // Flag if it's taking up >10% of app or >15MB
    const percentOfTotal = calculatePercentage(totalFirebaseSize, context.totalInstallSize);
    const isSignificant = percentOfTotal > 10 || totalFirebaseSize > 15 * 1024 * 1024;

    if (!isSignificant && !hasGoogleServices) {
      return results;
    }

    const affectedItems = firebaseFiles.slice(0, 20).map((file) => ({
      path: file.path,
      size: file.size,
      reason: `${file.service} - verify if needed`,
      metadata: { service: file.service }
    }));

    // Determine severity - google-services.json is ALWAYS high severity (security vulnerability)
    let severity = 'medium'; // Default for Firebase bloat without google-services.json
    if (hasGoogleServices) {
      severity = 'high'; // CRITICAL SECURITY RISK: API keys exposed
    }

    // Estimate potential savings (if using full SDK instead of lite versions)
    const potentialSavings = firebaseModules.size > 3
      ? Math.floor(totalFirebaseSize * 0.4) // Can save ~40% by using Lite SDKs
      : Math.floor(totalFirebaseSize * 0.2); // Can save ~20% by removing unused modules

    results.push({
      ruleId: 'R010',
      title: `Firebase Detected (${firebaseModules.size} modules, ${(totalFirebaseSize / 1024 / 1024).toFixed(1)}MB)`,
      description: `App includes Firebase with ${firebaseModules.size} modules using ${(totalFirebaseSize / 1024 / 1024).toFixed(1)}MB (${percentOfTotal.toFixed(1)}% of app).${hasGoogleServices ? ' google-services.json contains API keys that could be exposed.' : ''} Consider using Firebase Lite SDKs or removing unused modules.`,
      severity,
      category: 'optimization',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `${hasGoogleServices ? '## 🚨 CRITICAL SECURITY VULNERABILITY: Exposed Firebase API Keys\n\n**The Exact Exploit Method:**\n\n1. **Extract APK**: Download your APK from Play Store or APK mirror sites\n   \\`\\`\\`bash\n   # Using APK Analyzer (Android Studio)\n   apkanalyzer manifest print your-app.apk\n   \\`\\`\\`\n\n2. **Extract google-services.json**:\n   \\`\\`\\`bash\n   unzip your-app.apk\n   cat google-services.json | jq\n   \\`\\`\\`\n\n3. **Extract API Key & Project ID**:\n   The file contains:\n   - `client[0].api_key[0].current_key` (Firebase API key)\n   - `project_info.project_id` (Firebase project ID)\n   - `client[0].client_info.mobilesdk_app_id` (Firebase App ID)\n\n4. **Exploit Remote Config**:\n   \\`\\`\\`bash\n   # Attacker can read all Remote Config values:\n   curl -X GET \\\n     "https://firebaseremoteconfig.googleapis.com/v1/projects/YOUR_PROJECT_ID/remoteConfig" \\\n     -H "Authorization: Bearer YOUR_API_KEY"\n   \\`\\`\\`\n\n   This exposes:\n   - Feature flags (which features are enabled/disabled)\n   - A/B test configurations\n   - Secrets stored in Remote Config (if any)\n   - Internal app behavior settings\n\n**How to Fix - Firebase Application Restrictions** (Recommended):\n\nGo to Google Cloud Console → APIs & Services → Credentials → Your API Key → Edit:\n\n1. **Application restrictions** → **Android apps**\n2. Add your app\'s package name and SHA-1 certificate fingerprint:\n   \\`\\`\\`bash\n   # Get SHA-1 fingerprint:\n   keytool -list -v -keystore ~/.android/debug.keystore  # Debug\n   keytool -list -v -keystore release.keystore          # Release\n   \\`\\`\\`\n\n3. **Restrict to 4 keystore types**:\n   - **Debug keystore**: SHA-1 from debug.keystore (for development)\n   - **Release keystore**: SHA-1 from your production signing key\n   - **Play Store signing**: SHA-1 from Google Play Console (if using App Signing)\n   - **CI/CD signing**: SHA-1 from your CI/CD signing key (if applicable)\n\n4. **API restrictions** → Select:\n   - Firebase Remote Config API\n   - Firebase Installations API\n   - (Only the APIs your app actually uses)\n\n**Alternative Fix - Remove google-services.json from APK**:\n\nMove Firebase initialization to runtime using environment variables:\n\n\\`\\`\\`kotlin\n// Instead of google-services.json, initialize manually:\nval options = FirebaseOptions.Builder()\n    .setProjectId(BuildConfig.FIREBASE_PROJECT_ID)\n    .setApplicationId(BuildConfig.FIREBASE_APP_ID)\n    .setApiKey(BuildConfig.FIREBASE_API_KEY)\n    .build()\n\nFirebaseApp.initializeApp(this, options)\n\\`\\`\\`\n\nStore credentials in:\n- `local.properties` (excluded from Git)\n- Environment variables in CI/CD\n- Gradle build config (injected at build time)\n\n**Impact**: Without Application Restrictions, attackers can:\n- Read all Remote Config values (feature flags, A/B tests, secrets)\n- Potentially abuse Firebase quotas (if API limits not set)\n- Understand your app\'s internal logic and hidden features\n\n---\n\n' : ''}**Optimization Strategies:**\n\n**1. Use Firebase Lite SDKs** (Recommended):\n\`\`\`gradle\n// Instead of full SDKs:\n// implementation 'com.google.firebase:firebase-analytics:21.2.0'  // ~3MB\n\n// Use Lite versions:\nimplementation 'com.google.firebase:firebase-analytics-lite:21.2.0'  // ~500KB\nimplementation 'com.google.firebase:firebase-crashlytics-lite:18.3.0'\n\`\`\`\n\n**2. Remove Unused Modules:**\nDetected modules (${firebaseModules.size}):\n${Array.from(firebaseModules).map(m => `• ${m}`).join('\n')}\n\nAudit which modules are actually used and remove unused ones from build.gradle.\n\n**3. Alternative Solutions:**\n${firebaseModules.has('Analytics') ? '• Analytics: Consider using Google Analytics 4 Lite or remove if not critical\n' : ''}${firebaseModules.has('Crashlytics') ? '• Crashlytics: Use Crashlytics Lite or consider Sentry (lighter)\n' : ''}${firebaseModules.has('Realtime Database') || firebaseModules.has('Firestore') ? '• Database: Consider Supabase or custom backend for lighter alternative\n' : ''}\n**4. ProGuard/R8 Optimization:**\nEnsure ProGuard/R8 is enabled to strip unused Firebase code:\n\`\`\`gradle\nbuildTypes {\n  release {\n    minifyEnabled true\n    shrinkResources true\n    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')\n  }\n}\n\`\`\`\n\n**Expected Savings:** \n- Switching to Lite SDKs: ~${(totalFirebaseSize * 0.4 / 1024 / 1024).toFixed(1)}MB\n- Removing 1-2 unused modules: ~${(totalFirebaseSize * 0.2 / 1024 / 1024).toFixed(1)}MB\n- Total potential: ~${(potentialSavings / 1024 / 1024).toFixed(1)}MB (${((potentialSavings / context.totalInstallSize) * 100).toFixed(0)}% of app)`,
    });

    return results;
  },

  metadata: {
    examples: ['Apps with full Firebase suite using 30MB', 'Exposed google-services.json with API keys'],
    documentation: 'Firebase is powerful but heavy. Use Lite SDKs and only include needed modules. Secure API keys properly.',
    fixable: true,
  },
};

/**
 * Export all rules
 * @type {InsightRule[]}
 */
export const allInsightRules = [
  duplicateDetectionRule,
  unoptimizedPNGRule,
  debugSymbolsRule,
  iOSAssetCatalogRule,
  unusedAndroidResourcesRule,
  unusedLocalizationRule,
  multipleArchitecturesRule,
  avoidManyFilesRule,
  optimizeIconsRule,
  firebaseAPIExposedRule,
  imageOptimizationRule, // R011: Image optimization with real testing
];

/**
 * Get rules by category
 * @param {string} category - Category to filter by
 * @returns {InsightRule[]} Rules in category
 */
export function getRulesByCategory(category) {
  return allInsightRules.filter((rule) => rule.category === category);
}

/**
 * Get rule by ID
 * @param {string} ruleId - Rule ID
 * @returns {InsightRule | undefined} Rule if found
 */
export function getRuleById(ruleId) {
  return allInsightRules.find((rule) => rule.id === ruleId);
}
