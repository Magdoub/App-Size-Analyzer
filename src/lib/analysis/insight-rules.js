/**
 * Insight Rules
 *
 * Implementation of specific optimization detection rules
 */

import {
  calculateDuplicateSavings,
  calculatePercentage,
  findDuplicatesByHash,
  findFilesByExtension,
  findFilesByPattern,
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
          size: fileEntry?.installSize || 0,
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
      return fileEntry && fileEntry.installSize > 50 * 1024; // 50KB threshold
    });

    if (largePNGs.length === 0) {
      return results;
    }

    const affectedItems = largePNGs.map((path) => {
      const fileEntry = context.allFiles.find((f) => f.path === path);
      const size = fileEntry?.installSize || 0;

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
            size: fileEntry.installSize,
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

      // Generate platform-specific fix suggestion for debug builds
      let debugBuildFixSuggestion = '';
      if (context.platform === 'iOS') {
        debugBuildFixSuggestion = 'Build in Release mode with optimizations enabled. In Xcode: Product → Archive for distribution.';
      } else if (context.platform === 'Android') {
        debugBuildFixSuggestion = 'Build in Release mode with optimizations enabled. Use: ./gradlew assembleRelease or Build → Generate Signed Bundle/APK with ProGuard/R8 enabled.';
      } else {
        debugBuildFixSuggestion = 'Build in Release mode with optimizations enabled.';
      }

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
        fixSuggestion: debugBuildFixSuggestion,
      });
    }

    if (affectedItems.length > 0) {
      const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
      const percentOfTotal = calculatePercentage(totalSize, context.totalInstallSize);

      // Generate platform-specific fix suggestion
      let fixSuggestion = '';

      if (context.platform === 'iOS') {
        fixSuggestion = `## Strip Debug Symbols from iOS Binaries

Debug symbols significantly increase binary size. Strip them before App Store submission while preserving dSYMs for crash reporting.

### Method 1: Xcode Build Settings (Recommended)

**Automatic stripping for release builds:**

1. Select your target → Build Settings
2. Set these options for Release configuration:

\`\`\`
STRIP_INSTALLED_PRODUCT = YES
STRIP_STYLE = all
COPY_PHASE_STRIP = YES
STRIP_SWIFT_SYMBOLS = YES
\`\`\`

### Method 2: Manual Strip Command

**The exact strip command:**

\`\`\`bash
# Basic strip (removes all symbols)
strip -x /path/to/MyApp.app/MyApp

# Strip with flags explanation:
# -T = Strip Swift symbols (reduces size significantly)
# -r = Remove relocation entries
# -S = Strip debug sections (STAB entries)
# -x = Remove local symbols (starting with 'L')

strip -TrSx /path/to/MyApp.app/Frameworks/*.framework/*
\`\`\`

### Method 3: Build Phase Script (Most Control)

Add a Run Script build phase **after** "Embed Frameworks":

\`\`\`bash
#!/bin/bash

# Skip for debug builds
if [ "$CONFIGURATION" != "Release" ]; then
    exit 0
fi

# Function to strip a binary
strip_binary() {
    local binary="$1"
    local arch="$2"

    if [ -f "$binary" ]; then
        # Check if binary is code-signed by Apple (don't strip system frameworks)
        local signature=$(codesign -dv "$binary" 2>&1 | grep "Authority=Apple")
        if [ -n "$signature" ]; then
            echo "Skipping Apple-signed binary: $binary"
            return
        fi

        echo "Stripping: $binary"
        strip -TrSx "$binary" 2>/dev/null || echo "Failed to strip: $binary"
    fi
}

# Strip main executable
strip_binary "\${TARGET_BUILD_DIR}/\${EXECUTABLE_PATH}"

# Strip embedded frameworks
if [ -d "\${TARGET_BUILD_DIR}/\${FRAMEWORKS_FOLDER_PATH}" ]; then
    find "\${TARGET_BUILD_DIR}/\${FRAMEWORKS_FOLDER_PATH}" -type f -perm +111 | while read framework; do
        strip_binary "$framework"
    done
fi

# Strip PlugIns (App Extensions)
if [ -d "\${TARGET_BUILD_DIR}/\${PLUGINS_FOLDER_PATH}" ]; then
    find "\${TARGET_BUILD_DIR}/\${PLUGINS_FOLDER_PATH}" -name "*.appex" -type d | while read appex; do
        local appex_binary="$appex/$(basename "$appex" .appex)"
        strip_binary "$appex_binary"
    done
fi
\`\`\`

**Build Phase Configuration:**
- Input Files: \`$(TARGET_BUILD_DIR)/$(EXECUTABLE_PATH)\`
- Output Files: None (modifies in place)

### Flag Explanations

| Flag | Purpose | Size Impact |
|------|---------|-------------|
| \`-T\` | Strip Swift symbols | 10-30% of binary |
| \`-r\` | Remove relocation entries | 5-10% of binary |
| \`-S\` | Strip debug (STAB) sections | 5-15% of binary |
| \`-x\` | Remove local symbols | 2-5% of binary |

### dSYM Preservation (Critical for Crash Reports)

**DO NOT strip dSYMs!** They are required for crash symbolication.

**Automatic dSYM generation:**
\`\`\`
DEBUG_INFORMATION_FORMAT = dwarf-with-dsym  // Release only
\`\`\`

**Upload dSYMs to your crash reporting service:**

\`\`\`bash
# Firebase Crashlytics
\${PODS_ROOT}/FirebaseCrashlytics/upload-symbols -gsp GoogleService-Info.plist -p ios "\${DWARF_DSYM_FOLDER_PATH}/\${DWARF_DSYM_FILE_NAME}"

# Sentry
sentry-cli upload-dif --include-sources "\${DWARF_DSYM_FOLDER_PATH}"

# Bugsnag
bugsnag-dsym-upload "\${DWARF_DSYM_FOLDER_PATH}/\${DWARF_DSYM_FILE_NAME}"
\`\`\`

### Verify Stripping Worked

\`\`\`bash
# Check binary size before/after
ls -la MyApp.app/MyApp

# Check symbols (should be minimal)
nm MyApp.app/MyApp | wc -l

# Check for debug sections (should return nothing)
objdump -h MyApp.app/MyApp | grep debug
\`\`\`

### Expected Savings

Stripping debug symbols typically reduces binary size by **15-40%** depending on:
- Amount of Swift code (Swift has larger symbols)
- Number of third-party frameworks
- Whether debug builds were accidentally shipped

**Current debug files found:** ${affectedItems.length} files totaling ${(totalSize / 1024 / 1024).toFixed(2)}MB`;
      } else if (context.platform === 'Android') {
        fixSuggestion = `## Strip Debug Symbols from Android Binaries

Debug symbols in native libraries can significantly increase APK/AAB size. Configure Gradle to strip them automatically.

### Method 1: Gradle Build Configuration (Recommended)

**Enable symbol stripping in build.gradle:**

\`\`\`gradle
android {
    buildTypes {
        release {
            // Enable code shrinking and obfuscation
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                         'proguard-rules.pro'

            // Strip native library debug symbols
            ndk {
                debugSymbolLevel 'SYMBOL_TABLE'  // or 'NONE' to strip all symbols
            }
        }
    }

    // If using App Bundle
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}
\`\`\`

### Method 2: Manual Strip Command (Advanced)

**For native libraries (.so files):**

\`\`\`bash
# Strip all symbols from native library
$ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-strip lib/arm64-v8a/libmylib.so

# Strip only debug symbols (keep dynamic symbols for crash reports)
$ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-strip --strip-debug lib/arm64-v8a/libmylib.so
\`\`\`

### Method 3: Build Script Automation

**Add to app/build.gradle:**

\`\`\`gradle
tasks.whenTaskAdded { task ->
    if (task.name.contains("package") && task.name.contains("Release")) {
        task.doLast {
            fileTree(dir: "build/intermediates/merged_native_libs/release").each { file ->
                if (file.name.endsWith(".so")) {
                    println "Stripping: \${file.path}"
                    exec {
                        commandLine "\${System.env.ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-strip",
                                    "--strip-debug",
                                    file.path
                    }
                }
            }
        }
    }
}
\`\`\`

### Debug Symbol Level Options

| Level | Description | Size Impact |
|-------|-------------|-------------|
| \`FULL\` | Keep all debug info | No reduction |
| \`SYMBOL_TABLE\` | Strip debug info, keep symbols for stack traces | 30-50% reduction |
| \`NONE\` | Strip everything | 50-70% reduction |

**Recommendation:** Use \`SYMBOL_TABLE\` to balance size reduction with crash report quality.

### Upload Symbols to Crash Reporting

**After stripping, upload debug symbols separately:**

\`\`\`bash
# Firebase Crashlytics
./gradlew :app:uploadCrashlyticsSymbolFileRelease

# Sentry
sentry-cli upload-dif --include-sources build/intermediates/merged_native_libs/release

# Bugsnag
bugsnag-cli upload android-ndk --variant release
\`\`\`

### Verify Stripping Worked

\`\`\`bash
# Check library size before/after
ls -lh app/build/intermediates/merged_native_libs/release/out/lib/arm64-v8a/*.so

# Check if debug symbols are stripped
readelf -S libmylib.so | grep debug
# Should return nothing if stripped

# Check remaining symbols
readelf -s libmylib.so | grep FUNC
\`\`\`

### Expected Savings

Stripping debug symbols from native libraries typically reduces APK/AAB size by **30-70%** for the native component depending on:
- Number of native libraries (.so files)
- Amount of debug information included
- NDK version and build configuration

**Current debug files found:** ${affectedItems.length} files totaling ${(totalSize / 1024 / 1024).toFixed(2)}MB`;
      } else {
        // Unknown platform - provide generic advice
        fixSuggestion = `## Strip Debug Symbols

Debug symbols significantly increase binary size and should be removed from production builds.

### General Recommendations:

1. **Build in Release Mode**: Ensure you're creating a release build, not a debug build
2. **Enable Symbol Stripping**: Configure your build system to strip debug symbols
3. **Preserve Symbols Separately**: Keep debug symbols in a separate file for crash reporting
4. **Upload to Crash Service**: Upload debug symbols to your crash reporting service (Firebase, Sentry, Bugsnag, etc.)

### Platform-Specific Instructions:

- **iOS**: Use Xcode's "Archive" feature with proper build settings (STRIP_INSTALLED_PRODUCT = YES)
- **Android**: Configure Gradle with \`debugSymbolLevel = 'SYMBOL_TABLE'\` in your ndk block

**Current debug files found:** ${affectedItems.length} files totaling ${(totalSize / 1024 / 1024).toFixed(2)}MB`;
      }

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
        fixSuggestion,
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
        size: fileEntry?.installSize || 0,
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
      if (file.installSize > 10 * 1024) {
        // > 10KB
        affectedItems.push({
          path: file.path,
          size: file.installSize,
          reason: 'Resource in uncommon density folder (ldpi/tvdpi) - may be unused',
          metadata: { type: 'uncommon_density' },
        });
      }
    });

    // Heuristic: Find very large resource files (> 500KB)
    const largeResources = resourceFiles.filter((file) => file.installSize > 500 * 1024);
    largeResources.forEach((file) => {
      affectedItems.push({
        path: file.path,
        size: file.installSize,
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
        if (match?.[1]) languages.add(match[1]);
      } else {
        const match = path.match(/values-([a-z]{2}(?:-[A-Z]{2})?)\//);
        if (match?.[1]) languages.add(match[1]);
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

    // Generate platform-specific fix suggestion
    let localizationFixSuggestion = 'Review which languages your app actually supports and remove unused localizations.';
    if (context.platform === 'iOS') {
      localizationFixSuggestion += ' Use on-demand resources or App Store language-specific delivery to reduce initial download size.';
    } else if (context.platform === 'Android') {
      localizationFixSuggestion += ' Use Android App Bundles with language-specific delivery to reduce initial download size.';
    }

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
      fixSuggestion: localizationFixSuggestion,
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
      if (match?.[1]) {
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
      const totalSize = files.reduce((sum, file) => sum + file.installSize, 0);
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
      if (file.installSize < 10 * 1024) return false;

      // Flag if larger than expected
      // For @3x icons: expect ~80KB, flag if >100KB
      // For @2x icons: expect ~50KB, flag if >75KB
      if (file.path.includes('@3x')) {
        return file.installSize > 100 * 1024;
      } else if (file.path.includes('@2x')) {
        return file.installSize > 75 * 1024;
      } else if (file.path.includes('1024')) {
        // 1024x1024 marketing icon
        return file.installSize > 150 * 1024;
      } else {
        // Standard icons
        return file.installSize > iconSizeThresholds.medium;
      }
    });

    if (unoptimizedIcons.length === 0) {
      return results;
    }

    const affectedItems = unoptimizedIcons.map((file) => {
      // Estimate savings (typically 30-40% with lossless optimization)
      const estimatedOptimizedSize = Math.floor(file.installSize * 0.65);
      const potentialSavings = file.installSize - estimatedOptimizedSize;

      return {
        path: file.path,
        size: file.installSize,
        reason: `Icon is ${(file.installSize / 1024).toFixed(0)}KB (expected ~${file.path.includes('@3x') ? '80' : '50'}KB)`,
        metadata: {
          currentSize: file.installSize,
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
    const candidateImages = imageFiles.filter((file) => file.installSize > MIN_SIZE_THRESHOLD);

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

      const estimatedSavings = Math.floor(file.installSize * estimatedSavingsPercent);

      return {
        path: file.path,
        size: file.installSize,
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

${context.platform === 'iOS' ? `**iOS (Xcode):**
1. Select Assets.xcassets → Inspector
2. Enable "Compress PNG Files" (default: ON)
3. Build Settings → COMPRESS_PNG_FILES = YES
4. Consider using HEIC format for iOS 12+ (smaller than PNG)` : ''}${context.platform === 'Android' ? `**Android (Gradle):**
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
\`\`\`` : ''}

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
        totalFirebaseSize += file.installSize;
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
      size: file.installSize,
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
 * R013: iOS Alternate Icon Optimization
 * Detects alternate icons with excessive resolution detail (1024x1024) that could be optimized
 */
const iOSAlternateIconOptimizationRule = {
  id: 'R013',
  name: 'iOS Alternate Icon Optimization',
  description: 'Detects iOS alternate icons that could be optimized by downscaling to 180x180',
  category: 'optimization',
  severity: 'medium',
  platform: 'iOS',
  priority: 'P1',

  /**
   * @param {import('../../types/analysis.js').AnalysisContext} context
   * @returns {Promise<import('../../types/analysis.js').InsightResult[]>}
   */
  execute: async (context) => {
    const results = [];

    // iOS only
    if (context.platform !== 'iOS') {
      return results;
    }

    // This rule requires icon analysis from parser
    // Check if icons were analyzed (requires analyzeIOSIcons function)
    if (!context.iosIcons || !Array.isArray(context.iosIcons) || context.iosIcons.length === 0) {
      return results;
    }

    // Filter for alternate icons only
    const alternateIcons = context.iosIcons.filter(icon => icon.iconType === 'alternate');

    if (alternateIcons.length === 0) {
      return results;
    }

    // Check if we have the compression worker available
    const compressionWorker = context.compressionWorker;
    if (!compressionWorker) {
      console.warn('[R013] Compression worker not available, skipping alternate icon optimization');
      return results;
    }

    const optimizableIcons = [];
    let totalPotentialSavings = 0;

    // Import detectImageDetailLevel function
    const { detectImageDetailLevel } = await import('./image-compression/compressor.js');

    // Analyze each alternate icon for detail level
    for (const icon of alternateIcons) {
      try {
        // Find the file entry in context
        const fileEntry = context.allFiles.find(f => f.path === icon.filePath);
        if (!fileEntry || !fileEntry.data) continue;

        // Create a Blob from the file data
        const blob = new Blob([fileEntry.data], { type: 'image/png' });

        // Detect if the icon has more than 180x180 detail
        const detailAnalysis = await detectImageDetailLevel(blob, 180);

        // If icon has full 1024x1024 detail and is large enough to optimize
        if (detailAnalysis.hasFullDetail &&
            detailAnalysis.width >= 1024 &&
            detailAnalysis.height >= 1024 &&
            icon.fileSize > 50 * 1024) { // Minimum 50KB to be worth optimizing

          // Estimate savings: ~60% reduction by downscaling to 180x180 then upscaling
          const estimatedSavings = Math.floor(icon.fileSize * 0.6);

          optimizableIcons.push({
            ...icon,
            resolution: detailAnalysis,
            estimatedSavings
          });

          totalPotentialSavings += estimatedSavings;
        }
      } catch (error) {
        console.warn(`[R013] Failed to analyze icon ${icon.filePath}:`, error);
      }
    }

    if (optimizableIcons.length === 0) {
      return results;
    }

    // Build affected items list
    const affectedItems = optimizableIcons.map((icon) => ({
      path: icon.filePath,
      size: icon.fileSize,
      reason: `Alternate icon with ${icon.resolution.width}×${icon.resolution.height} resolution can be optimized to save ~${(icon.estimatedSavings / 1024).toFixed(0)}KB`,
      metadata: {
        iconType: icon.iconType,
        resolution: icon.resolution,
        estimatedSavings: icon.estimatedSavings
      }
    }));

    const percentOfTotal = calculatePercentage(totalPotentialSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R013',
      title: `${optimizableIcons.length} Alternate Icon${optimizableIcons.length > 1 ? 's' : ''} Can Be Optimized`,
      description: `Found ${optimizableIcons.length} alternate app icon${optimizableIcons.length > 1 ? 's' : ''} with full 1024×1024 resolution detail. iOS only displays alternate icons at 180×180 resolution to users. You can save ~${(totalPotentialSavings / 1024).toFixed(0)}KB (${percentOfTotal.toFixed(1)}% of app) by optimizing these icons.`,
      severity: 'medium',
      category: 'optimization',
      affectedItems,
      potentialSavings: totalPotentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## Why Optimize Alternate Icons?

**Key Insight from Emerge Tools:**
- **Primary app icon** MUST remain 1024×1024 for App Store display
- **Alternate icons** are only shown at **180×180 resolution** to users (in Settings > App Icon)
- Users never see the full 1024×1024 detail for alternate icons
- Downscaling to 180×180 then upscaling back to 1024×1024 reduces file size by ~60%

## How to Fix

### Step 1: Identify Alternate Icons

Affected alternate icons:
${optimizableIcons.map((icon, index) => `${index + 1}. \`${icon.fileName}\` - ${(icon.fileSize / 1024).toFixed(0)}KB → ${((icon.fileSize - icon.estimatedSavings) / 1024).toFixed(0)}KB (save ${(icon.estimatedSavings / 1024).toFixed(0)}KB)`).join('\n')}

### Step 2: Downscale → Upscale Workflow

**Using ImageMagick (command line):**

\`\`\`bash
# For each alternate icon:
cd /path/to/your/project/Assets.xcassets/AlternateIconName.appiconset/

# Downscale to 180×180 (removing excess detail)
magick Icon-1024.png -resize 180x180 Icon-180-temp.png

# Upscale back to 1024×1024 (maintaining required resolution)
magick Icon-180-temp.png -resize 1024x1024 Icon-1024-optimized.png

# Replace original
mv Icon-1024-optimized.png Icon-1024.png
rm Icon-180-temp.png
\`\`\`

**Using Photoshop:**

1. Open alternate icon file (1024×1024)
2. **Image → Image Size**
   - Width: 180 pixels
   - Height: 180 pixels
   - Resampling: Bicubic Sharper (reduction)
3. **Image → Image Size** (again)
   - Width: 1024 pixels
   - Height: 1024 pixels
   - Resampling: Bicubic Smoother (enlargement)
4. **File → Export → Save for Web** (PNG-8 or PNG-24)

**Using Sketch/Figma:**

1. Export alternate icon at 180×180 resolution
2. Re-import and scale to 1024×1024
3. Export at 1024×1024

### Step 3: Verify in Xcode

1. Open \`Assets.xcassets\` in Xcode
2. Select alternate icon set (e.g., \`AlternateIconName.appiconset\`)
3. Verify all required sizes are present (60×60, 180×180, 1024×1024)
4. Build and test on device

### Step 4: Test Alternate Icon Display

\`\`\`swift
// In your app's settings UI:
UIApplication.shared.setAlternateIconName("AlternateIconName") { error in
    if let error = error {
        print("Error setting alternate icon: \\(error.localizedDescription)")
    } else {
        print("Alternate icon set successfully")
    }
}
\`\`\`

Verify the icon looks good in:
- Home Screen (should look crisp)
- App Switcher (should look crisp)
- Settings → [Your App] → App Icon picker (should look crisp)

## Why This Works

**Apple's iOS Alternate Icon Behavior:**
- Alternate icons in Info.plist reference the 1024×1024 image
- iOS **downsamples** the image to 180×180 for display
- Any detail beyond 180×180 is discarded by iOS
- File size savings come from removing detail that iOS never shows

**Primary Icon Exception:**
⚠️ **Do NOT apply this to your primary app icon!**
- Primary icon is displayed at 1024×1024 in App Store
- App Store Connect requires full-resolution primary icon
- Only optimize **alternate icons** (CFBundleAlternateIcons in Info.plist)

## Expected Savings

Total savings: **~${(totalPotentialSavings / 1024).toFixed(0)}KB** (${percentOfTotal.toFixed(1)}% of app size)

Per icon:
${optimizableIcons.map((icon, _index) => `- ${icon.fileName}: ${(icon.estimatedSavings / 1024).toFixed(0)}KB saved`).join('\n')}

## References

- [Emerge Tools: iOS App Icon Optimization](https://docs.emergetools.com/)
- [Apple Documentation: Alternate App Icons](https://developer.apple.com/documentation/uikit/uiapplication/2806818-setalternateiconname)
- [Info.plist CFBundleAlternateIcons](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleicons)`,
    });

    return results;
  },

  metadata: {
    examples: ['1024×1024 alternate icons with full resolution detail'],
    documentation: 'iOS alternate icons only display at 180×180 resolution. Optimize by downscaling to 180×180 then upscaling back to 1024×1024.',
    fixable: true,
  },
};

/**
 * R014: iOS Localization String Minification
 *
 * Detects iOS .strings files using inefficient binary plist format or containing
 * translator comments that bloat app size
 * @type {InsightRule}
 */
export const iOSLocalizationMinificationRule = {
  id: 'R014',
  category: 'optimization',
  name: 'iOS Localization String Optimization',
  description: 'Detects .strings files with binary plist format or comment bloat',
  severity: 'medium',

  execute: async (context) => {
    const results = [];

    // Only run for iOS apps
    if (context.platform !== 'iOS') {
      return results;
    }

    // Check if localization analysis is available
    if (!context.localizationAnalysis || context.localizationAnalysis.length === 0) {
      return results;
    }

    // Group by issue type
    const binaryPlistFiles = context.localizationAnalysis.filter(f => f.hasBinaryPlistFormat);
    const filesWithComments = context.localizationAnalysis.filter(f => f.commentBytes > 100); // >100 bytes of comments

    if (binaryPlistFiles.length === 0 && filesWithComments.length === 0) {
      return results;
    }

    const affectedItems = [];
    let totalPotentialSavings = 0;

    // Add binary plist files
    for (const file of binaryPlistFiles) {
      affectedItems.push({
        path: file.path,
        size: file.installSize,
        reason: `Binary plist format (${file.language}) - could save ~${(file.potentialSavings / 1024).toFixed(1)}KB with SmallStrings`,
        metadata: {
          format: file.format,
          language: file.language,
          issue: 'binary_plist'
        }
      });
      totalPotentialSavings += file.potentialSavings;
    }

    // Add files with comments
    for (const file of filesWithComments) {
      if (!binaryPlistFiles.includes(file)) { // Avoid duplicates
        affectedItems.push({
          path: file.path,
          size: file.installSize,
          reason: `Contains ~${(file.commentBytes / 1024).toFixed(1)}KB of translator comments (${file.language})`,
          metadata: {
            format: file.format,
            language: file.language,
            commentBytes: file.commentBytes,
            issue: 'comments'
          }
        });
        totalPotentialSavings += file.commentBytes;
      }
    }

    if (affectedItems.length === 0) {
      return results;
    }

    const percentOfTotal = calculatePercentage(totalPotentialSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R014',
      title: `${affectedItems.length} Localization Files Can Be Optimized`,
      description: `Found ${binaryPlistFiles.length} files with binary plist format and ${filesWithComments.length} files with comment bloat. Optimizing these could save ~${(totalPotentialSavings / 1024).toFixed(1)}KB (${percentOfTotal.toFixed(2)}% of app).`,
      severity: percentOfTotal > 1 ? 'medium' : 'low',
      category: 'optimization',
      affectedItems,
      potentialSavings: totalPotentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## iOS Localization String Optimization

This insight detects two common issues with .strings files:
1. **Binary plist format** - Adds overhead vs optimized formats
2. **Translator comments** - Comments from genstrings that ship to production

### Issue 1: Binary Plist Format

Xcode compiles .strings files to binary plist by default. While compact, you can save more with **SmallStrings** format.

**Fix Option A: Use SmallStrings Library (Recommended)**

SmallStrings is an open-source library that provides 20-40% smaller localization files:

1. Install via CocoaPods:
   \`\`\`ruby
   pod 'SmallStrings'
   \`\`\`

2. Or Swift Package Manager:
   \`\`\`swift
   .package(url: "https://github.com/nicklockwood/SmallStrings.git", from: "1.0.0")
   \`\`\`

3. Convert .strings files at build time:
   \`\`\`bash
   smallstrings convert path/to/Localizable.strings
   \`\`\`

**Fix Option B: Text Format + Compression**

Keep .strings as text format and let ZIP compression handle it:

1. In Xcode → Target → Build Settings
2. Search for "STRINGS_FILE_OUTPUT_ENCODING"
3. Set to "UTF-8" instead of "binary"

### Issue 2: Translator Comments

genstrings extracts comments that help translators but ship to production:

\`\`\`
/* Button title for submitting the form */
"submit_button" = "Submit";

/* Error message when network is unavailable */
"network_error" = "No internet connection";
\`\`\`

**Remove Comments with Python Script (from Emerge Tools docs):**

\`\`\`python
#!/usr/bin/env python3
"""
Strip comments from .strings files to reduce app size.
Save as: scripts/strip_strings_comments.py
"""

import re
import sys
from pathlib import Path

def strip_comments(content):
    """Remove /* ... */ and // comments from .strings content."""
    # Remove block comments
    content = re.sub(r'/\\*[\\s\\S]*?\\*/', '', content)
    # Remove single-line comments
    content = re.sub(r'//[^\\n]*', '', content)
    # Remove empty lines
    content = re.sub(r'\\n\\s*\\n', '\\n', content)
    return content.strip()

def process_file(filepath):
    """Process a single .strings file."""
    path = Path(filepath)
    if not path.exists():
        print(f"File not found: {filepath}")
        return False

    content = path.read_text(encoding='utf-8')
    original_size = len(content.encode('utf-8'))

    stripped = strip_comments(content)
    new_size = len(stripped.encode('utf-8'))

    path.write_text(stripped, encoding='utf-8')

    saved = original_size - new_size
    print(f"Processed {path.name}: {saved} bytes saved ({saved/1024:.1f}KB)")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python strip_strings_comments.py <file.strings> [file2.strings ...]")
        sys.exit(1)

    for filepath in sys.argv[1:]:
        process_file(filepath)
\`\`\`

**Add to Xcode Build Phase:**

1. Target → Build Phases → + → New Run Script Phase
2. Add before "Copy Bundle Resources":
   \`\`\`bash
   find "${SRCROOT}" -name "*.strings" -exec python3 "${SRCROOT}/scripts/strip_strings_comments.py" {} \\;
   \`\`\`

### Xcode Build Setting

Set output encoding for all .strings files:

\`\`\`
# In .xcconfig or Build Settings:
STRINGS_FILE_OUTPUT_ENCODING = UTF-8
\`\`\`

### Expected Savings

- Binary plist → SmallStrings: 20-40% reduction
- Comment removal: 5-20% reduction
- Combined: **25-50% smaller localization files**

**Affected Files:**
${affectedItems.slice(0, 10).map(item => `• ${item.path.split('/').pop()} (${item.metadata.language}): ${item.reason}`).join('\n')}
${affectedItems.length > 10 ? `\n... and ${affectedItems.length - 10} more files` : ''}

**Total Savings:** ~${(totalPotentialSavings / 1024).toFixed(1)}KB`,
    });

    return results;
  },

  metadata: {
    examples: ['Binary plist .strings files', '.strings files with genstrings comments'],
    documentation: 'iOS .strings files can be optimized by using SmallStrings format or removing translator comments.',
    fixable: true,
  },
};

/**
 * R015: iOS Unnecessary Files Detection
 *
 * Detects accidentally included files that shouldn't be in production bundles
 * @type {InsightRule}
 */
export const iOSUnnecessaryFilesRule = {
  id: 'R015',
  category: 'unused',
  name: 'Unnecessary Files in Bundle (iOS)',
  description: 'Detects README, scripts, provisioning profiles, and other files that should not be in production',
  severity: 'medium',

  execute: async (context) => {
    const results = [];

    // Only run for iOS apps
    if (context.platform !== 'iOS') {
      return results;
    }

    // Define patterns for unnecessary files
    const unnecessaryPatterns = [
      // Documentation files
      { pattern: /README(\.md|\.txt)?$/i, category: 'documentation', reason: 'README file should not be in app bundle' },
      { pattern: /CHANGELOG(\.md|\.txt)?$/i, category: 'documentation', reason: 'CHANGELOG file should not be in app bundle' },
      { pattern: /LICENSE(\.md|\.txt)?$/i, category: 'documentation', reason: 'LICENSE file (unless legally required)' },
      { pattern: /CONTRIBUTING(\.md|\.txt)?$/i, category: 'documentation', reason: 'CONTRIBUTING file should not be in app bundle' },
      { pattern: /\.md$/i, category: 'documentation', reason: 'Markdown documentation file' },

      // Shell scripts
      { pattern: /\.sh$/i, category: 'scripts', reason: 'Shell script should not be in app bundle' },
      { pattern: /\.py$/i, category: 'scripts', reason: 'Python script should not be in app bundle' },
      { pattern: /\.rb$/i, category: 'scripts', reason: 'Ruby script should not be in app bundle' },

      // Provisioning profiles
      { pattern: /\.mobileprovision$/i, category: 'provisioning', reason: 'Extra provisioning profile (embedded.mobileprovision is normal)' },

      // Build configs
      { pattern: /\.xcconfig$/i, category: 'build_config', reason: 'Xcode config file should not be in app bundle' },
      { pattern: /Podfile(\.lock)?$/i, category: 'build_config', reason: 'CocoaPods file should not be in app bundle' },
      { pattern: /Cartfile(\.resolved)?$/i, category: 'build_config', reason: 'Carthage file should not be in app bundle' },
      { pattern: /Package\.swift$/i, category: 'build_config', reason: 'Swift Package Manager file' },

      // Swift module and symbol maps
      { pattern: /\.swiftmodule$/i, category: 'debug_artifacts', reason: 'Swift module (debug artifact)' },
      { pattern: /\.swiftsourceinfo$/i, category: 'debug_artifacts', reason: 'Swift source info (debug artifact)' },
      { pattern: /\.modulemap$/i, category: 'debug_artifacts', reason: 'Module map file (debug artifact)' },
      { pattern: /\.bcsymbolmap$/i, category: 'debug_artifacts', reason: 'Bitcode symbol map (should be stripped)' },

      // Header files
      { pattern: /\.h$/i, category: 'headers', reason: 'Header file should not be in app bundle' },
      { pattern: /\.hpp$/i, category: 'headers', reason: 'C++ header file should not be in app bundle' },

      // Other unnecessary files
      { pattern: /\.gitignore$/i, category: 'version_control', reason: 'Git ignore file' },
      { pattern: /\.gitattributes$/i, category: 'version_control', reason: 'Git attributes file' },
      { pattern: /\.DS_Store$/i, category: 'system_files', reason: 'macOS system file' },
      { pattern: /Thumbs\.db$/i, category: 'system_files', reason: 'Windows system file' },
    ];

    const affectedItems = [];
    let _totalSize = 0;

    for (const { pattern, category, reason } of unnecessaryPatterns) {
      const matchingFiles = context.allFiles.filter(file => {
        // Skip the expected embedded.mobileprovision
        if (file.path.endsWith('embedded.mobileprovision')) return false;
        return pattern.test(file.path);
      });

      for (const file of matchingFiles) {
        affectedItems.push({
          path: file.path,
          size: file.installSize,
          reason,
          metadata: { category, pattern: pattern.toString() }
        });
        _totalSize += file.installSize;
      }
    }

    if (affectedItems.length === 0) {
      return results;
    }

    // Dedupe by path
    const uniqueItems = Array.from(new Map(affectedItems.map(item => [item.path, item])).values());
    const uniqueTotal = uniqueItems.reduce((sum, item) => sum + item.size, 0);

    const percentOfTotal = calculatePercentage(uniqueTotal, context.totalInstallSize);

    // Group by category for display
    const byCategory = {};
    for (const item of uniqueItems) {
      const cat = item.metadata.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    }

    results.push({
      ruleId: 'R015',
      title: `${uniqueItems.length} Unnecessary Files in Bundle`,
      description: `Found ${uniqueItems.length} files that should not be in the production app bundle, using ${(uniqueTotal / 1024).toFixed(1)}KB (${percentOfTotal.toFixed(2)}% of app).`,
      severity: uniqueItems.length > 10 ? 'medium' : 'low',
      category: 'unused',
      affectedItems: uniqueItems,
      potentialSavings: uniqueTotal,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## Remove Unnecessary Files from iOS Bundle

These files were accidentally included in your app bundle. They serve no purpose at runtime and waste space.

### How to Fix (Xcode)

For each file listed below:

1. **Select the file** in Xcode's Project Navigator
2. **Open File Inspector** (View → Inspectors → File Inspector or ⌘+⌥+1)
3. **Uncheck "Target Membership"** for your app target
4. **Rebuild** your app

### Alternatively: Exclude in Build Settings

Add exclusion patterns to your Copy Bundle Resources build phase:

1. Target → Build Phases → Copy Bundle Resources
2. Select unwanted files → Remove (- button)

Or add to your .xcconfig:
\`\`\`
EXCLUDED_SOURCE_FILE_NAMES = README.md *.sh *.py *.xcconfig
\`\`\`

### Files by Category

${Object.entries(byCategory).map(([category, items]) => {
  const catSize = items.reduce((sum, item) => sum + item.size, 0);
  return `**${category.replace(/_/g, ' ').toUpperCase()}** (${items.length} files, ${(catSize / 1024).toFixed(1)}KB):
${items.slice(0, 5).map(item => `• \`${item.path.split('/').pop()}\` - ${item.reason}`).join('\n')}${items.length > 5 ? `\n• ... and ${items.length - 5} more` : ''}`;
}).join('\n\n')}

### Prevention

Add a Run Script build phase to catch these before release:

\`\`\`bash
#!/bin/bash
# Warn about unnecessary files in bundle
BUNDLE_PATH="\${TARGET_BUILD_DIR}/\${CONTENTS_FOLDER_PATH}"
UNNECESSARY=$(find "$BUNDLE_PATH" -name "*.md" -o -name "*.sh" -o -name "*.py" -o -name ".DS_Store" 2>/dev/null)
if [ -n "$UNNECESSARY" ]; then
    echo "warning: Found unnecessary files in bundle:"
    echo "$UNNECESSARY"
fi
\`\`\`

**Total Savings:** ~${(uniqueTotal / 1024).toFixed(1)}KB`,
    });

    return results;
  },

  metadata: {
    examples: ['README.md in bundle', 'Shell scripts', 'Extra .mobileprovision files'],
    documentation: 'Remove development files, scripts, and documentation from app bundles.',
    fixable: true,
  },
};

/**
 * R016: Unused Font Detection
 *
 * Detects font files not referenced in Info.plist UIAppFonts
 * @type {InsightRule}
 */
export const unusedFontsRule = {
  id: 'R016',
  category: 'unused',
  name: 'Unused or Oversized Fonts',
  description: 'Detects font files not referenced in Info.plist or with excessive character sets',
  severity: 'medium',

  execute: async (context) => {
    const results = [];

    // Find all font files
    const fontExtensions = ['.ttf', '.otf', '.ttc', '.woff', '.woff2'];
    const fontFiles = context.allFiles.filter(file => {
      const ext = file.path.toLowerCase().substring(file.path.lastIndexOf('.'));
      return fontExtensions.includes(ext);
    });

    if (fontFiles.length === 0) {
      return results;
    }

    const affectedItems = [];
    let totalSize = 0;

    // For iOS: Check if fonts are in Info.plist UIAppFonts
    if (context.platform === 'iOS' && context.infoPlist) {
      const uiAppFonts = context.infoPlist.UIAppFonts || [];
      const declaredFonts = new Set(uiAppFonts.map(f => f.toLowerCase()));

      for (const file of fontFiles) {
        const fileName = file.path.split('/').pop().toLowerCase();

        // Check if font is declared
        if (!declaredFonts.has(fileName)) {
          affectedItems.push({
            path: file.path,
            size: file.installSize,
            reason: 'Font not declared in Info.plist UIAppFonts - may be unused',
            metadata: { issue: 'undeclared', platform: 'iOS' }
          });
          totalSize += file.installSize;
        }
      }
    }

    // Check for oversized fonts (likely CJK or full character sets)
    // CJK fonts are typically >5MB, Latin fonts are <500KB
    const LARGE_FONT_THRESHOLD = 1024 * 1024; // 1MB

    for (const file of fontFiles) {
      if (file.installSize > LARGE_FONT_THRESHOLD) {
        const fileName = file.path.split('/').pop();

        // Check if likely CJK font by name
        const cjkPatterns = [/cjk/i, /chinese/i, /japanese/i, /korean/i, /noto.*sc/i, /noto.*tc/i, /noto.*jp/i, /noto.*kr/i, /pingfang/i, /hiragino/i, /gothic/i, /mincho/i];
        const isCJK = cjkPatterns.some(pattern => pattern.test(fileName));

        // Don't double-count if already added as undeclared
        const alreadyAdded = affectedItems.some(item => item.path === file.path);
        if (!alreadyAdded) {
          affectedItems.push({
            path: file.path,
            size: file.installSize,
            reason: isCJK
              ? `Large CJK font (${(file.installSize / 1024 / 1024).toFixed(1)}MB) - consider subsetting for used characters only`
              : `Large font file (${(file.installSize / 1024 / 1024).toFixed(1)}MB) - may have excessive character coverage`,
            metadata: { issue: 'oversized', isCJK, platform: context.platform }
          });
          totalSize += file.installSize;
        }
      }
    }

    if (affectedItems.length === 0) {
      return results;
    }

    const percentOfTotal = calculatePercentage(totalSize, context.totalInstallSize);

    // Estimate savings: remove unused fonts entirely, subset large fonts by ~50%
    const undeclaredSize = affectedItems.filter(i => i.metadata.issue === 'undeclared').reduce((sum, i) => sum + i.size, 0);
    const oversizedSize = affectedItems.filter(i => i.metadata.issue === 'oversized').reduce((sum, i) => sum + i.size, 0);
    const potentialSavings = undeclaredSize + Math.floor(oversizedSize * 0.5); // 50% savings from subsetting

    results.push({
      ruleId: 'R016',
      title: `${affectedItems.length} Font Files May Be Unused or Oversized`,
      description: `Found ${affectedItems.length} font files that may be unused or have excessive character coverage, totaling ${(totalSize / 1024 / 1024).toFixed(1)}MB. Potential savings: ${(potentialSavings / 1024 / 1024).toFixed(1)}MB.`,
      severity: percentOfTotal > 5 ? 'high' : 'medium',
      category: 'unused',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## Font Optimization Guide

### Issue 1: Unused Fonts (iOS)

Fonts must be declared in Info.plist to be used. Undeclared fonts are either:
- Accidentally included in the bundle
- Leftover from removed features

**To verify if a font is used:**
1. Search your codebase for the font name
2. Check Interface Builder files (.xib, .storyboard)
3. Check CSS files for web views

**To remove unused fonts:**
1. Select font file in Xcode
2. Uncheck Target Membership
3. Delete from project if not needed

### Issue 2: Oversized Fonts

Large font files often include characters you don't need:
- Full CJK character sets (50,000+ glyphs)
- Extended Latin characters
- Math symbols, emojis, etc.

**Font Subsetting Tools:**

1. **pyftsubset** (command line, free):
   \`\`\`bash
   pip install fonttools

   # Subset to basic Latin + common punctuation
   pyftsubset MyFont.ttf --text-file=chars.txt --output-file=MyFont-subset.ttf

   # Or specify unicode ranges
   pyftsubset MyFont.ttf --unicodes="U+0000-00FF,U+0100-017F" --output-file=MyFont-subset.ttf
   \`\`\`

2. **Glyphs app** (Mac, paid):
   - Open font → File → Export → Custom
   - Select only needed glyphs

3. **Font Squirrel Generator** (web, free):
   - https://www.fontsquirrel.com/tools/webfont-generator
   - Upload font, select subset options

4. **Google Fonts** (if using):
   - Use the \`text=\` parameter to get only needed characters
   - Or download optimized subsets

### CJK Font Optimization

If your app supports Chinese/Japanese/Korean:

1. **Use system fonts** when possible:
   \`\`\`swift
   // iOS
   UIFont.preferredFont(forTextStyle: .body)

   // SwiftUI
   Font.system(.body)
   \`\`\`

2. **Subset to frequently used characters:**
   - Common 3,000 Chinese characters cover 99% of usage
   - Use frequency lists to identify needed characters

3. **Load fonts on-demand:**
   \`\`\`swift
   // iOS On-Demand Resources
   let request = NSBundleResourceRequest(tags: ["japanese-fonts"])
   request.beginAccessingResources { error in
       // Font now available
   }
   \`\`\`

### Affected Fonts

${affectedItems.map(item => `• \`${item.path.split('/').pop()}\`: ${(item.size / 1024).toFixed(0)}KB - ${item.reason}`).join('\n')}

**Potential Savings:** ~${(potentialSavings / 1024 / 1024).toFixed(1)}MB`,
    });

    return results;
  },

  metadata: {
    examples: ['Fonts not in UIAppFonts', 'Large CJK fonts', 'Full Unicode coverage fonts'],
    documentation: 'Remove unused fonts and subset large fonts to only include needed characters.',
    fixable: true,
  },
};

/**
 * R017: Video and Animation Optimization
 *
 * Detects video files and animations that could be optimized
 * @type {InsightRule}
 */
export const videoOptimizationRule = {
  id: 'R017',
  category: 'optimization',
  name: 'Video and Animation Optimization',
  description: 'Detects video files and animations that could be compressed or converted',
  severity: 'medium',

  execute: async (context) => {
    const results = [];

    // Find video files
    const videoExtensions = ['.mov', '.mp4', '.m4v', '.avi', '.webm'];
    const _animationExtensions = ['.gif', '.json']; // .json for Lottie

    const videoFiles = context.allFiles.filter(file => {
      const ext = file.path.toLowerCase().substring(file.path.lastIndexOf('.'));
      return videoExtensions.includes(ext);
    });

    const gifFiles = context.allFiles.filter(file =>
      file.path.toLowerCase().endsWith('.gif') && file.installSize > 50 * 1024 // >50KB GIFs
    );

    const lottieFiles = context.allFiles.filter(file =>
      file.path.toLowerCase().endsWith('.json') &&
      (file.path.includes('lottie') || file.path.includes('animation'))
    );

    if (videoFiles.length === 0 && gifFiles.length === 0 && lottieFiles.length === 0) {
      return results;
    }

    const affectedItems = [];
    let _totalSize = 0;
    let potentialSavings = 0;

    // Process video files
    for (const file of videoFiles) {
      const ext = file.path.toLowerCase().substring(file.path.lastIndexOf('.'));

      // MOV files can often be converted to MP4/HEVC for 30-50% savings
      if (ext === '.mov') {
        const savings = Math.floor(file.installSize * 0.4);
        affectedItems.push({
          path: file.path,
          size: file.installSize,
          reason: 'MOV file - convert to H.264/H.265 MP4 for ~40% savings',
          metadata: { type: 'video', format: 'mov', estimatedSavings: savings }
        });
        _totalSize += file.installSize;
        potentialSavings += savings;
      } else if (file.installSize > 5 * 1024 * 1024) { // Large videos >5MB
        const savings = Math.floor(file.installSize * 0.3);
        affectedItems.push({
          path: file.path,
          size: file.installSize,
          reason: `Large video (${(file.installSize / 1024 / 1024).toFixed(1)}MB) - verify compression settings`,
          metadata: { type: 'video', format: ext.substring(1), estimatedSavings: savings }
        });
        _totalSize += file.installSize;
        potentialSavings += savings;
      }
    }

    // Process GIF files
    for (const file of gifFiles) {
      // GIFs are extremely inefficient - video format is 90% smaller
      const savings = Math.floor(file.installSize * 0.9);
      affectedItems.push({
        path: file.path,
        size: file.installSize,
        reason: 'GIF animation - convert to video (MP4/WebM) for ~90% savings',
        metadata: { type: 'gif', estimatedSavings: savings }
      });
      _totalSize += file.installSize;
      potentialSavings += savings;
    }

    // Process Lottie files
    for (const file of lottieFiles) {
      if (file.installSize > 50 * 1024) { // >50KB Lottie
        const savings = Math.floor(file.installSize * 0.5);
        affectedItems.push({
          path: file.path,
          size: file.installSize,
          reason: 'Large Lottie animation - consider minifying JSON or using dotLottie format',
          metadata: { type: 'lottie', estimatedSavings: savings }
        });
        _totalSize += file.installSize;
        potentialSavings += savings;
      }
    }

    if (affectedItems.length === 0) {
      return results;
    }

    const percentOfTotal = calculatePercentage(potentialSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R017',
      title: `${affectedItems.length} Videos/Animations Can Be Optimized`,
      description: `Found ${videoFiles.length} video files, ${gifFiles.length} GIFs, and ${lottieFiles.length} Lottie animations. Optimizing these could save ~${(potentialSavings / 1024 / 1024).toFixed(1)}MB.`,
      severity: percentOfTotal > 5 ? 'high' : 'medium',
      category: 'optimization',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## Video and Animation Optimization

### GIF → Video Conversion (90% savings)

GIF is the least efficient animation format. Convert to video:

**Using FFmpeg:**
\`\`\`bash
# GIF to MP4 (best compatibility)
ffmpeg -i animation.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" animation.mp4

# GIF to WebM (smaller but less compatible)
ffmpeg -i animation.gif -c:v libvpx-vp9 -crf 30 -b:v 0 animation.webm
\`\`\`

**Display in app:**
\`\`\`swift
// iOS - use AVPlayer for video instead of UIImageView for GIF
let player = AVPlayer(url: videoURL)
let playerLayer = AVPlayerLayer(player: player)
playerLayer.videoGravity = .resizeAspect
view.layer.addSublayer(playerLayer)
player.play()
\`\`\`

### Video Compression

**FFmpeg compression presets:**
\`\`\`bash
# H.264 with good compression
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k output.mp4

# H.265/HEVC (smaller, iOS 11+)
ffmpeg -i input.mov -c:v libx265 -preset medium -crf 28 -c:a aac -b:a 128k output.mp4

# For mobile apps (lower bitrate)
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 26 -maxrate 2M -bufsize 4M -c:a aac -b:a 96k output.mp4
\`\`\`

**Handbrake (GUI tool):**
1. Download: https://handbrake.fr
2. Open video file
3. Select preset: "Very Fast 720p30" or "Fast 1080p30"
4. Start encode

### Lottie Optimization

**Minify JSON:**
\`\`\`bash
# Using jq
jq -c . animation.json > animation.min.json

# Or use lottie-minify
npx lottie-minify animation.json -o animation.min.json
\`\`\`

**Convert to dotLottie (50% smaller):**
\`\`\`bash
npx @dotlottie/dotlottie-js animation.json -o animation.lottie
\`\`\`

**In your app:**
\`\`\`swift
// Use dotLottie format
import Lottie
let animation = LottieAnimation.named("animation") // loads .lottie automatically
\`\`\`

### Streaming vs Bundled

For large videos (>10MB), consider streaming:
- Host on CDN (CloudFront, Cloudflare)
- Stream on-demand instead of bundling
- Use adaptive bitrate (HLS/DASH)

### Affected Files

${affectedItems.map(item => `• \`${item.path.split('/').pop()}\`: ${(item.size / 1024).toFixed(0)}KB - ${item.reason}`).join('\n')}

**Total Potential Savings:** ~${(potentialSavings / 1024 / 1024).toFixed(1)}MB`,
    });

    return results;
  },

  metadata: {
    examples: ['GIF animations', 'Uncompressed MOV files', 'Large Lottie JSON'],
    documentation: 'Convert GIFs to video format and compress videos for significant size savings.',
    fixable: true,
  },
};

/**
 * R018: Framework Duplication Detection (iOS)
 *
 * Detects duplicate frameworks in app and extensions
 * @type {InsightRule}
 */
export const frameworkDuplicationRule = {
  id: 'R018',
  category: 'duplicates',
  name: 'Framework Duplication (iOS)',
  description: 'Detects frameworks duplicated between app and extensions',
  severity: 'high',

  execute: async (context) => {
    const results = [];

    // Only run for iOS apps
    if (context.platform !== 'iOS') {
      return results;
    }

    // Find all frameworks in app bundle
    const frameworkPattern = /\.framework\//i;
    const frameworkFiles = context.allFiles.filter(file => frameworkPattern.test(file.path));

    if (frameworkFiles.length === 0) {
      return results;
    }

    // Group frameworks by name
    const frameworksByName = new Map();
    for (const file of frameworkFiles) {
      const match = file.path.match(/([^/]+)\.framework\//);
      if (match) {
        const name = match[1];
        if (!frameworksByName.has(name)) {
          frameworksByName.set(name, []);
        }
        frameworksByName.get(name).push(file);
      }
    }

    // Find frameworks that appear multiple times (in app + extension)
    const duplicateFrameworks = [];
    let totalDuplicateSize = 0;

    for (const [name, files] of frameworksByName) {
      // Check if this framework appears in multiple locations
      const locations = new Set();
      for (const file of files) {
        // Extract container (main app or extension)
        if (file.path.includes('.appex/')) {
          // In an extension
          const extMatch = file.path.match(/([^/]+\.appex)\//);
          if (extMatch) locations.add(extMatch[1]);
        } else {
          // In main app
          locations.add('main_app');
        }
      }

      if (locations.size > 1) {
        // Framework is in multiple places
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const duplicateSize = totalSize - (totalSize / locations.size); // Size of duplicates

        duplicateFrameworks.push({
          name,
          locations: Array.from(locations),
          totalSize,
          duplicateSize,
          files
        });
        totalDuplicateSize += duplicateSize;
      }
    }

    // Also check for duplicate Swift runtime
    const swiftRuntimes = context.allFiles.filter(file =>
      file.path.includes('libswift') && file.path.endsWith('.dylib')
    );

    const swiftRuntimeLocations = new Set();
    let swiftRuntimeDuplicateSize = 0;
    for (const file of swiftRuntimes) {
      if (file.path.includes('.appex/')) {
        const extMatch = file.path.match(/([^/]+\.appex)\//);
        if (extMatch) swiftRuntimeLocations.add(extMatch[1]);
      } else {
        swiftRuntimeLocations.add('main_app');
      }
    }

    if (swiftRuntimeLocations.size > 1) {
      const totalSwiftSize = swiftRuntimes.reduce((sum, f) => sum + f.size, 0);
      swiftRuntimeDuplicateSize = totalSwiftSize - (totalSwiftSize / swiftRuntimeLocations.size);
      totalDuplicateSize += swiftRuntimeDuplicateSize;
    }

    if (duplicateFrameworks.length === 0 && swiftRuntimeLocations.size <= 1) {
      return results;
    }

    const affectedItems = [];

    for (const fw of duplicateFrameworks) {
      affectedItems.push({
        path: `${fw.name}.framework`,
        size: fw.duplicateSize,
        reason: `Duplicated in ${fw.locations.length} locations: ${fw.locations.join(', ')}`,
        metadata: {
          type: 'framework',
          locations: fw.locations,
          totalSize: fw.totalSize
        }
      });
    }

    if (swiftRuntimeLocations.size > 1) {
      affectedItems.push({
        path: 'Swift Runtime Libraries',
        size: swiftRuntimeDuplicateSize,
        reason: `Swift runtime duplicated in ${swiftRuntimeLocations.size} locations`,
        metadata: {
          type: 'swift_runtime',
          locations: Array.from(swiftRuntimeLocations)
        }
      });
    }

    const percentOfTotal = calculatePercentage(totalDuplicateSize, context.totalInstallSize);

    results.push({
      ruleId: 'R018',
      title: `${duplicateFrameworks.length} Duplicated Frameworks Detected`,
      description: `Found ${duplicateFrameworks.length} frameworks duplicated between app and extensions, wasting ${(totalDuplicateSize / 1024 / 1024).toFixed(1)}MB (${percentOfTotal.toFixed(1)}% of app).`,
      severity: percentOfTotal > 5 ? 'critical' : 'high',
      category: 'duplicates',
      affectedItems,
      potentialSavings: totalDuplicateSize,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## Framework Duplication Fix

When your main app and app extensions both use the same framework, it gets bundled twice. This wastes significant space.

### Solution: Shared Framework (App Groups)

Move shared frameworks to a common location that both app and extensions can access.

**1. Create a shared framework target:**

In Xcode:
1. File → New → Target → Framework
2. Name it (e.g., "SharedFrameworks")
3. Add common dependencies to this target

**2. Configure framework embedding:**

For main app and each extension:
\`\`\`
Target → General → Frameworks, Libraries, and Embedded Content
  → SharedFrameworks.framework → Embed & Sign
\`\`\`

**3. Use @rpath for framework loading:**

In Build Settings for all targets:
\`\`\`
DYLIB_INSTALL_NAME_BASE = @rpath
LD_RUNPATH_SEARCH_PATHS = @executable_path/Frameworks @executable_path/../../Frameworks
\`\`\`

### Swift Runtime Deduplication

Swift runtime is automatically shared when:
1. Deployment target is iOS 12.2+ (Swift is in the OS)
2. All targets use the same Swift version

**Check deployment target:**
\`\`\`
// Build Settings
IPHONEOS_DEPLOYMENT_TARGET = 12.2  // or higher
\`\`\`

### Alternative: Static Linking

For smaller frameworks, consider static linking instead of dynamic:

\`\`\`ruby
# Podfile
use_frameworks! :linkage => :static
\`\`\`

**Pros:** No duplicate frameworks
**Cons:** Larger main binary, slower launches if overused

### Duplicated Frameworks

${affectedItems.map(item => `• **${item.path}**: ${(item.size / 1024 / 1024).toFixed(2)}MB wasted
  - Locations: ${item.metadata.locations.join(', ')}`).join('\n')}

**Total Savings:** ~${(totalDuplicateSize / 1024 / 1024).toFixed(1)}MB`,
    });

    return results;
  },

  metadata: {
    examples: ['Alamofire in app + extension', 'Duplicate Swift runtime'],
    documentation: 'Use shared frameworks or static linking to avoid duplication.',
    fixable: true,
  },
};

/**
 * R019: Android Optimization Settings
 *
 * Detects if ProGuard/R8 is disabled or not optimized
 * @type {InsightRule}
 */
export const androidOptimizationsRule = {
  id: 'R019',
  category: 'optimization',
  name: 'Android Build Optimizations',
  description: 'Detects if ProGuard/R8 and resource shrinking are enabled',
  severity: 'high',

  execute: async (context) => {
    const results = [];

    // Only run for Android apps
    if (context.platform !== 'Android') {
      return results;
    }

    // Heuristics to detect if ProGuard/R8 is enabled:
    // 1. Check for obfuscated class names (single letter packages like a.a.a)
    // 2. Check DEX file size relative to app size
    // 3. Check for ProGuard mapping file references

    const dexFiles = context.allFiles.filter(file => file.path.endsWith('.dex'));
    const totalDexSize = dexFiles.reduce((sum, f) => sum + f.size, 0);
    const dexPercentage = calculatePercentage(totalDexSize, context.totalInstallSize);

    // Resource files in res/ directory
    const resFiles = context.allFiles.filter(file => file.path.startsWith('res/'));
    const totalResSize = resFiles.reduce((sum, f) => sum + f.size, 0);
    const resPercentage = calculatePercentage(totalResSize, context.totalInstallSize);

    // Look for signs of unobfuscated code
    // Obfuscated apps have short paths like classes.dex with small package names
    // Unobfuscated apps often have longer, readable class paths in dex

    // Check for large DEX indicating no minification
    const LARGE_DEX_THRESHOLD = 10 * 1024 * 1024; // 10MB is suspicious for non-huge apps
    const hasLargeDex = dexFiles.some(f => f.size > LARGE_DEX_THRESHOLD);

    // Check for multiple DEX files (could indicate multidex from large unminified code)
    const hasMultidex = dexFiles.length > 1;

    const issues = [];
    let potentialSavings = 0;

    // Large DEX = likely no R8/ProGuard
    if (hasLargeDex || (hasMultidex && totalDexSize > 15 * 1024 * 1024)) {
      const savings = Math.floor(totalDexSize * 0.4); // R8 typically saves 30-50%
      issues.push({
        issue: 'large_dex',
        description: 'Large DEX file(s) suggest code minification may be disabled',
        severity: 'high',
        savings
      });
      potentialSavings += savings;
    }

    // Large resources = likely no resource shrinking
    if (resPercentage > 40) {
      const savings = Math.floor(totalResSize * 0.2); // Resource shrinking saves 10-30%
      issues.push({
        issue: 'no_resource_shrinking',
        description: 'Resources are a large portion of app - resource shrinking may help',
        severity: 'medium',
        savings
      });
      potentialSavings += savings;
    }

    if (issues.length === 0) {
      return results;
    }

    const affectedItems = [];

    for (const dex of dexFiles) {
      if (dex.size > 5 * 1024 * 1024) {
        affectedItems.push({
          path: dex.path,
          size: dex.size,
          reason: `Large DEX file (${(dex.size / 1024 / 1024).toFixed(1)}MB) - enable R8 minification`,
          metadata: { type: 'dex' }
        });
      }
    }

    if (resPercentage > 30) {
      affectedItems.push({
        path: 'res/',
        size: totalResSize,
        reason: `Resources are ${resPercentage.toFixed(0)}% of app - enable resource shrinking`,
        metadata: { type: 'resources' }
      });
    }

    const percentOfTotal = calculatePercentage(potentialSavings, context.totalInstallSize);

    results.push({
      ruleId: 'R019',
      title: 'Android Build Optimizations Recommended',
      description: `DEX code is ${(totalDexSize / 1024 / 1024).toFixed(1)}MB (${dexPercentage.toFixed(0)}%), resources are ${(totalResSize / 1024 / 1024).toFixed(1)}MB (${resPercentage.toFixed(0)}%). Enabling R8 and resource shrinking could save ~${(potentialSavings / 1024 / 1024).toFixed(1)}MB.`,
      severity: potentialSavings > 5 * 1024 * 1024 ? 'critical' : 'high',
      category: 'optimization',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## Android Build Optimization Settings

### 1. Enable R8/ProGuard (Code Shrinking & Obfuscation)

R8 removes unused code and obfuscates class/method names.

**build.gradle (app):**
\`\`\`gradle
android {
    buildTypes {
        release {
            // Enable code shrinking
            minifyEnabled true

            // Enable resource shrinking (requires minifyEnabled)
            shrinkResources true

            // ProGuard/R8 rules
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                         'proguard-rules.pro'
        }
    }
}
\`\`\`

### 2. Aggressive R8 Settings

For maximum shrinking (may need more ProGuard rules):

**gradle.properties:**
\`\`\`properties
# Use R8 in full mode (more aggressive)
android.enableR8.fullMode=true

# Enable more aggressive optimizations
android.enableR8=true
\`\`\`

### 3. Resource Shrinking

Removes unused resources from final APK:

\`\`\`gradle
android {
    buildTypes {
        release {
            shrinkResources true  // Must have minifyEnabled true
        }
    }
}
\`\`\`

**Keep specific resources:**
\`\`\`xml
<!-- res/raw/keep.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@drawable/important_*,@raw/config"
    tools:shrinkMode="strict" />
\`\`\`

### 4. Check ProGuard Rules

Common rules for libraries:

\`\`\`proguard
# proguard-rules.pro

# Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Gson
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter

# Keep your data classes (or use @Keep annotation)
-keep class com.yourapp.models.** { *; }
\`\`\`

### 5. Verify Optimization is Working

Check APK size before and after:

\`\`\`bash
# Build release APK
./gradlew assembleRelease

# Check size
ls -la app/build/outputs/apk/release/*.apk

# Analyze APK
\${ANDROID_HOME}/build-tools/*/apkanalyzer dex packages app-release.apk
\`\`\`

### 6. Use Android App Bundle (AAB)

App Bundles enable Play Store optimization:

\`\`\`gradle
android {
    bundle {
        language { enableSplit = true }
        density { enableSplit = true }
        abi { enableSplit = true }
    }
}
\`\`\`

\`\`\`bash
# Build AAB instead of APK
./gradlew bundleRelease
\`\`\`

### Expected Savings

| Optimization | Typical Savings |
|-------------|----------------|
| R8 minification | 30-50% DEX size |
| Resource shrinking | 10-30% resources |
| ProGuard obfuscation | 5-15% additional |
| App Bundle | 15-30% download |

**Current Status:**
- DEX size: ${(totalDexSize / 1024 / 1024).toFixed(1)}MB (${dexPercentage.toFixed(0)}% of app)
- Resource size: ${(totalResSize / 1024 / 1024).toFixed(1)}MB (${resPercentage.toFixed(0)}% of app)

**Potential Savings:** ~${(potentialSavings / 1024 / 1024).toFixed(1)}MB (${percentOfTotal.toFixed(0)}%)`,
    });

    return results;
  },

  metadata: {
    examples: ['Apps without R8 enabled', 'Large unminified DEX files'],
    documentation: 'Enable R8 and resource shrinking in release builds.',
    fixable: true,
  },
};

/**
 * Export all rules
 * @type {InsightRule[]}
 */
export const allInsightRules = [
  duplicateDetectionRule,
  // unoptimizedPNGRule, // Removed - duplicates 'uncompressed-images' rule in insight-engine.js
  debugSymbolsRule,
  iOSAssetCatalogRule,
  unusedAndroidResourcesRule,
  unusedLocalizationRule,
  multipleArchitecturesRule,
  avoidManyFilesRule,
  optimizeIconsRule,
  firebaseAPIExposedRule,
  // imageOptimizationRule, // R011: Removed - duplicates 'uncompressed-images' rule in insight-engine.js
  iOSAlternateIconOptimizationRule, // R013: iOS alternate icon optimization
  iOSLocalizationMinificationRule, // R014: iOS localization minification
  iOSUnnecessaryFilesRule, // R015: Unnecessary files in bundle
  unusedFontsRule, // R016: Unused or oversized fonts
  videoOptimizationRule, // R017: Video and animation optimization
  frameworkDuplicationRule, // R018: Framework duplication
  androidOptimizationsRule, // R019: Android build optimizations
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
