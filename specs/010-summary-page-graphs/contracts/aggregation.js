/**
 * Contract: Aggregation Functions for Summary Page
 *
 * This contract defines the function signatures and data structures for
 * aggregating breakdown tree data into chart-ready summaries.
 *
 * All functions are pure (no side effects) and accept BreakdownNode trees
 * as input, returning aggregated data structures.
 *
 * Location: src/utils/calculations.js
 */

/**
 * Aggregate files by display category (grouping of ContentTypes)
 *
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - 'iOS' or 'Android'
 * @param {number} totalInstallSize - Total app install size (for percentage calculation)
 * @returns {CategoryAggregation[]} Array of aggregated categories
 *
 * @example
 * const categories = aggregateFilesByType(analysisContext.breakdownRoot, 'iOS', 100000000);
 * // Returns:
 * // [
 * //   {
 * //     category: "Frameworks",
 * //     contentTypes: ["framework", "bundle"],
 * //     size: 45000000,
 * //     compressedSize: 12000000,
 * //     count: 8,
 * //     percentage: 45.0,
 * //     color: "#3b82f6"
 * //   },
 * //   ...
 * // ]
 */
export function aggregateFilesByType(breakdownRoot, platform, totalInstallSize) {}

/**
 * CategoryAggregation structure
 * @typedef {Object} CategoryAggregation
 * @property {string} category - Display category name (e.g., "Frameworks", "Media Assets")
 * @property {string[]} contentTypes - ContentTypes included in this category
 * @property {number} size - Total uncompressed size in bytes
 * @property {number|null} compressedSize - Total compressed size (iOS only, null for Android)
 * @property {number} count - Number of files in this category
 * @property {number} percentage - Percentage of total app size (0-100)
 * @property {string} color - Hex color for chart display (e.g., "#3b82f6")
 */

/**
 * Aggregate files by component type (Internal vs External)
 *
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - 'iOS' or 'Android'
 * @param {number} totalInstallSize - Total app install size (for percentage calculation)
 * @returns {ComponentAggregation} Internal and external component breakdown
 *
 * @example
 * const components = aggregateByComponent(analysisContext.breakdownRoot, 'iOS', 100000000);
 * // Returns:
 * // {
 * //   internal: {
 * //     category: "Internal",
 * //     size: 55000000,
 * //     compressedSize: 40000000,
 * //     count: 245,
 * //     percentage: 55.0,
 * //     color: "#3b82f6"
 * //   },
 * //   external: {
 * //     category: "External",
 * //     size: 45000000,
 * //     compressedSize: 10000000,
 * //     count: 12,
 * //     percentage: 45.0,
 * //     color: "#10b981"
 * //   }
 * // }
 */
export function aggregateByComponent(breakdownRoot, platform, totalInstallSize) {}

/**
 * ComponentAggregation structure
 * @typedef {Object} ComponentAggregation
 * @property {ComponentCategory} internal - Internal (first-party) component data
 * @property {ComponentCategory} external - External (third-party) component data
 */

/**
 * ComponentCategory structure
 * @typedef {Object} ComponentCategory
 * @property {string} category - "Internal" or "External"
 * @property {number} size - Total uncompressed size in bytes
 * @property {number|null} compressedSize - Total compressed size (iOS only)
 * @property {number} count - Number of files
 * @property {number} percentage - Percentage of total app size (0-100)
 * @property {string} color - Hex color for chart display
 */

/**
 * Get top N largest files from breakdown tree
 *
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {number} count - Number of top files to return (e.g., 10 for "Top 10")
 * @param {number} totalInstallSize - Total app install size (for percentage calculation)
 * @returns {FileEntry[]} Array of top files sorted by size descending
 *
 * @example
 * const topFiles = getTopFiles(analysisContext.breakdownRoot, 10, 100000000);
 * // Returns:
 * // [
 * //   {
 * //     path: "Payload/MyApp.app/Frameworks/ReactNative.framework/ReactNative",
 * //     name: "ReactNative",
 * //     size: 12000000,
 * //     compressedSize: 3000000,
 * //     type: "framework",
 * //     percentage: 12.0,
 * //     color: "#3b82f6"
 * //   },
 * //   ...
 * // ]
 */
export function getTopFiles(breakdownRoot, count, totalInstallSize) {}

/**
 * FileEntry structure
 * @typedef {Object} FileEntry
 * @property {string} path - Full path in archive
 * @property {string} name - Display name (filename only)
 * @property {number} size - Uncompressed size in bytes
 * @property {number|null} compressedSize - Compressed size (iOS only)
 * @property {string} type - ContentType enum value
 * @property {number} percentage - Percentage of total app size (0-100)
 * @property {string} color - Type-based hex color
 */

/**
 * Analyze compression efficiency by file type category (iOS only)
 *
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - Must be 'iOS' (Android not supported)
 * @returns {CompressionAnalysis[]} Array of compression data per category
 *
 * @example
 * const compression = analyzeCompressionByType(analysisContext.breakdownRoot, 'iOS');
 * // Returns:
 * // [
 * //   {
 * //     category: "Frameworks",
 * //     uncompressed: 45000000,
 * //     compressed: 12000000,
 * //     ratio: 0.267,
 * //     percentage: 73.3,
 * //     color: "#3b82f6"
 * //   },
 * //   ...
 * // ]
 */
export function analyzeCompressionByType(breakdownRoot, platform) {}

/**
 * CompressionAnalysis structure
 * @typedef {Object} CompressionAnalysis
 * @property {string} category - Category name
 * @property {number} uncompressed - Uncompressed size in bytes
 * @property {number} compressed - Compressed size in bytes
 * @property {number} ratio - Compression ratio (compressed / uncompressed, 0-1)
 * @property {number} percentage - Compression percentage ((1 - ratio) * 100, 0-100)
 * @property {string} color - Category hex color
 */

/**
 * Analyze localization impact (size per locale)
 *
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {string} platform - 'iOS' or 'Android' (determines detection strategy)
 * @param {number} totalInstallSize - Total app install size (for percentage calculation)
 * @returns {LocalizationEntry[]} Array of localization data per locale
 *
 * @example
 * const localizations = analyzeLocalizations(analysisContext.breakdownRoot, 'iOS', 100000000);
 * // Returns:
 * // [
 * //   {
 * //     locale: "en",
 * //     displayName: "English",
 * //     size: 2500000,
 * //     count: 45,
 * //     percentage: 2.5,
 * //     color: "#3b82f6"
 * //   },
 * //   ...
 * // ]
 */
export function analyzeLocalizations(breakdownRoot, platform, totalInstallSize) {}

/**
 * LocalizationEntry structure
 * @typedef {Object} LocalizationEntry
 * @property {string} locale - Locale code (e.g., "en", "es", "zh-Hans")
 * @property {string} displayName - Human-readable locale name (e.g., "English", "Spanish")
 * @property {number} size - Total size of localization files in bytes
 * @property {number} count - Number of localized files
 * @property {number} percentage - Percentage of total app size (0-100)
 * @property {string} color - Auto-generated hex color
 */

/**
 * Analyze architecture breakdown (Android only)
 *
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {number} totalInstallSize - Total app install size (for percentage calculation)
 * @returns {ArchitectureEntry[]} Array of architecture data
 *
 * @example
 * const architectures = analyzeArchitectures(analysisContext.breakdownRoot, 100000000);
 * // Returns:
 * // [
 * //   {
 * //     architecture: "arm64-v8a",
 * //     displayName: "ARM64 (64-bit)",
 * //     size: 8500000,
 * //     count: 12,
 * //     percentage: 8.5,
 * //     color: "#3b82f6"
 * //   },
 * //   ...
 * // ]
 */
export function analyzeArchitectures(breakdownRoot, totalInstallSize) {}

/**
 * ArchitectureEntry structure
 * @typedef {Object} ArchitectureEntry
 * @property {string} architecture - Architecture name (e.g., "arm64-v8a", "armeabi-v7a")
 * @property {string} displayName - Human-readable name (e.g., "ARM64 (64-bit)")
 * @property {number} size - Total size of libraries for this architecture in bytes
 * @property {number} count - Number of .so files
 * @property {number} percentage - Percentage of total app size (0-100)
 * @property {string} color - Auto-generated hex color
 */

/**
 * Categorize asset types (images, videos, audio, fonts)
 *
 * @param {BreakdownNode} breakdownRoot - Root of the breakdown tree
 * @param {number} totalInstallSize - Total app install size (for percentage calculation)
 * @returns {AssetTypeAggregation[]} Array of asset type data
 *
 * @example
 * const assets = categorizeAssetTypes(analysisContext.breakdownRoot, 100000000);
 * // Returns:
 * // [
 * //   {
 * //     assetType: "Images",
 * //     contentType: "image",
 * //     size: 15000000,
 * //     compressedSize: 12000000,
 * //     count: 342,
 * //     percentage: 15.0,
 * //     color: "#14b8a6"
 * //   },
 * //   ...
 * // ]
 */
export function categorizeAssetTypes(breakdownRoot, totalInstallSize) {}

/**
 * AssetTypeAggregation structure
 * @typedef {Object} AssetTypeAggregation
 * @property {string} assetType - Asset type display name ("Images", "Videos", "Audio", "Fonts")
 * @property {string} contentType - Underlying ContentType enum value
 * @property {number} size - Total uncompressed size in bytes
 * @property {number|null} compressedSize - Total compressed size (iOS only, null for Android)
 * @property {number} count - Number of files
 * @property {number} percentage - Percentage of total app size (0-100)
 * @property {string} color - Type-based hex color
 */

/**
 * Map ContentType to user-friendly display category
 *
 * @param {string} contentType - One of 15 ContentTypes
 * @param {string} platform - 'iOS' or 'Android' (affects category mapping)
 * @returns {string} Display category name
 *
 * @example
 * mapToDisplayCategory('framework', 'iOS'); // Returns: "Frameworks"
 * mapToDisplayCategory('image', 'iOS');     // Returns: "Media Assets"
 * mapToDisplayCategory('dex', 'Android');   // Returns: "DEX Files"
 */
export function mapToDisplayCategory(contentType, platform) {}

/**
 * Get color for a display category
 *
 * @param {string} displayCategory - Display category name
 * @param {string} context - 'fileType' or 'component' (determines color scheme)
 * @returns {string} Hex color code
 *
 * @example
 * getDisplayCategoryColor('Frameworks', 'fileType');  // Returns: "#3b82f6"
 * getDisplayCategoryColor('Internal', 'component');   // Returns: "#3b82f6"
 */
export function getDisplayCategoryColor(displayCategory, context) {}
