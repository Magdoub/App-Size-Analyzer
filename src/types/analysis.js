/**
 * Core Analysis Types
 *
 * These type definitions define the structure of the analysis data model.
 * All entities are immutable - updates create new objects.
 */

/**
 * @typedef {'iOS'|'Android'} Platform
 */

/**
 * @typedef {'framework'|'bundle'|'executable'|'dex'|'native_lib'|'resource'|'asset'|'image'|'video'|'audio'|'font'|'localization'|'data'|'config'|'other'|'unknown'} ContentType
 *
 * Content types:
 * - framework: iOS framework (.framework)
 * - bundle: iOS bundle (.bundle)
 * - executable: iOS/Android executable binary
 * - dex: Android DEX file
 * - native_lib: Android native library (.so)
 * - resource: Android resource
 * - asset: Android asset
 * - image: Image file
 * - video: Video file
 * - audio: Audio file
 * - font: Font file
 * - localization: Localization file (.lproj, strings.xml)
 * - data: Data file (JSON, XML, etc.)
 * - config: Configuration file
 * - other: Other file types
 * - unknown: Unrecognized type
 */

/**
 * BreakdownNode - Hierarchical tree node representing a file, directory, framework, or module
 *
 * Platform-specific size handling:
 * - Android (APK/AAB): size = compressed (files stay compressed on-disk)
 * - iOS (IPA): size = uncompressed (files are extracted on-disk)
 *
 * @typedef {Object} BreakdownNode
 * @property {string} id - Unique ID (UUID or path-based)
 * @property {string} name - Display name (filename or component name)
 * @property {string} path - Full path in archive
 * @property {number} size - Install size in bytes (sum of children if directory, platform-specific)
 * @property {number} [compressedSize] - Compressed size (for reference, UI display only)
 * @property {ContentType} type - Content type
 * @property {string} [parent] - Parent node ID (undefined for root)
 * @property {BreakdownNode[]} children - Child nodes (empty for files)
 * @property {Object} [metadata] - Additional metadata
 * @property {number} [metadata.fileCount] - Number of descendant files
 * @property {string[]} [metadata.duplicates] - IDs of duplicate nodes
 * @property {string} [metadata.encoding] - File encoding (UTF-8, binary, etc.)
 * @property {string[]} [metadata.architecture] - For executables: arm64, x86_64, etc.
 */

/**
 * AnalysisContext - Root entity containing all analysis data for a single binary file
 *
 * @typedef {Object} AnalysisContext
 * @property {string} fileId - UUID v4
 * @property {Date} timestamp - Analysis timestamp
 * @property {Platform} platform - Platform (iOS or Android)
 * @property {string} appName - Application name
 * @property {string} bundleId - iOS: bundleIdentifier, Android: packageName
 * @property {string} version - Version string
 * @property {number} [versionCode] - Android only - version code
 * @property {number} totalInstallSize - Uncompressed size in bytes
 * @property {number} totalDownloadSize - Compressed size (actual file size)
 * @property {BreakdownNode} breakdownRoot - Root of file tree
 * @property {string[]} frameworks - iOS framework node IDs
 * @property {string[]} assets - Asset node IDs
 * @property {string[]} localizations - Localization node IDs
 * @property {string[]} executables - Executable node IDs
 * @property {string[]} nativeLibraries - Android native lib node IDs
 * @property {string[]} dexFiles - Android DEX file node IDs
 * @property {string[]} modules - Android AAB module node IDs (optional)
 * @property {FileEntry[]} allFiles - Flat list for search/filter
 * @property {Map<string, string>} [fileHashes] - path -> SHA-256 hash (lazy computed)
 * @property {'debug'|'release'|'unknown'} [buildType] - Build type
 * @property {'none'|'O0'|'Os'|'O2'|'Oz'} [compilerOptimization] - Compiler optimization level
 * @property {FileEntry[]} [imageFiles] - All image files (.png, .jpg, .webp, .heic) extracted
 * @property {FileEntry[]} [fontFiles] - All font files (.ttf, .otf, .woff, .woff2) extracted
 * @property {Object} [plistData] - Parsed Info.plist data (iOS only)
 * @property {Object} [manifestData] - Parsed AndroidManifest.xml data (Android only)
 * @property {Map<string, ImageCompressionResult>} [compressionCache] - Cache compression results by file hash
 * @property {Map<string, DuplicateGroup>} [duplicateGroups] - Duplicate groups by hash
 */

/**
 * ImageCompressionResult - Result of image compression testing
 *
 * @typedef {Object} ImageCompressionResult
 * @property {string} filePath - Original image path
 * @property {string} originalFormat - Original format (png, jpeg, webp, heic)
 * @property {number} originalSize - Original file size in bytes
 * @property {CompressedFormat[]} testedFormats - All tested compressions
 * @property {CompressedFormat} bestFormat - Best compression result
 * @property {number} savings - Bytes saved with best format
 * @property {number} reductionPercent - % reduction with best format
 * @property {number} testDuration - Time taken to test in milliseconds
 * @property {Object} [previewUrls] - Object URLs for preview
 * @property {string} [previewUrls.original] - Original image blob URL
 * @property {string} [previewUrls.compressed] - Compressed image blob URL
 */

/**
 * CompressedFormat - Single compression test result
 *
 * @typedef {Object} CompressedFormat
 * @property {string} format - Compression format (jpeg, webp, png)
 * @property {number} quality - Compression quality (0.0-1.0)
 * @property {number} size - Compressed file size in bytes
 * @property {Blob} blob - Compressed image data
 */

/**
 * DuplicateGroup - Group of files with identical content
 *
 * @typedef {Object} DuplicateGroup
 * @property {string} hash - SHA-256 hex (64 chars)
 * @property {string[]} paths - Paths of duplicate files
 * @property {number} fileSize - Size of each duplicate
 * @property {number} duplicateCount - Number of duplicates
 * @property {number} potentialSavings - (n-1) × fileSize
 * @property {Platform} platform - Platform (for threshold logic)
 */

/**
 * FileEntry - Flat representation of all files for search/filter
 *
 * Platform-specific size handling:
 * - Android (APK/AAB): installSize = compressed (files stay compressed on-disk)
 * - iOS (IPA): installSize = uncompressed (files are extracted on-disk)
 *
 * @typedef {Object} FileEntry
 * @property {string} path - Unique path in archive
 * @property {number} installSize - Actual bytes on device disk (platform-specific)
 * @property {number} [uncompressedSize] - Uncompressed size (for reference)
 * @property {ContentType} type - Content type
 * @property {string} [encoding] - File encoding
 * @property {Object} [metadata] - Additional metadata
 * @property {Date} [metadata.lastModified] - Last modified date
 * @property {string} [metadata.permissions] - File permissions
 * @property {string} [metadata.owner] - File owner
 */

/**
 * ValidationResult - Result of validation checks
 *
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string[]} errors - List of validation errors
 */

/**
 * ColorMode - Treemap color visualization mode
 *
 * @typedef {'size'|'type'|'compression'} ColorMode
 *
 * Modes:
 * - 'size': Blue gradient from light (small) to dark (large)
 * - 'type': Categorical colors by ContentType (existing behavior)
 * - 'compression': Green (well-compressed) to red (uncompressed) - FUTURE
 */

/**
 * ColorGradientConfig - Configuration for size-based gradient color calculation
 *
 * @typedef {Object} ColorGradientConfig
 * @property {number} hue - HSL hue value (0-360), default 210 (blue)
 * @property {number} minSaturation - Minimum saturation % for small files, default 70
 * @property {number} maxSaturation - Maximum saturation % for large files, default 90
 * @property {number} minLightness - Lightness % for largest files (darkest), default 20
 * @property {number} maxLightness - Lightness % for smallest files (lightest), default 90
 * @property {number[]} percentiles - Pre-calculated size percentiles [p10, p25, p50, p75, p90]
 */

/**
 * LabelRenderConfig - Configuration for intelligent label rendering
 *
 * @typedef {Object} LabelRenderConfig
 * @property {number} minWidth - Minimum box width (px) to show label, default 50
 * @property {number} minHeight - Minimum box height (px) to show label, default 20
 * @property {number} fontSize - Font size in pixels, default 12
 * @property {number} padding - Internal padding (px) to account for, default 4
 * @property {boolean} truncateWithEllipsis - Add '...' if text exceeds width, default true
 */

/**
 * AffectedFile - File affected by an insight with contextual details
 *
 * @typedef {Object} AffectedFile
 * @property {string} path - Full file path in archive
 * @property {number} size - File size in bytes
 * @property {ContentType} type - File content type
 * @property {number} [compressedSize] - Compressed size if applicable
 * @property {number} [compressionRatio] - Ratio (compressedSize/size) if applicable
 * @property {string} [context] - Additional context (e.g., "3x duplicate")
 */

/**
 * InsightMetadata - Metadata for enhanced insights
 *
 * @typedef {Object} InsightMetadata
 * @property {number} totalAffectedSize - Sum of all affected files sizes
 * @property {number} percentageOfApp - % of total app size affected
 * @property {string} [benchmark] - Comparison benchmark if applicable
 */

/**
 * EnhancedInsightResult - Extended insight result with file-level details
 *
 * @typedef {Object} EnhancedInsightResult
 * @property {string} ruleId - Unique rule identifier
 * @property {'critical'|'high'|'medium'|'low'} severity - Impact severity
 * @property {string} category - Insight category (e.g., 'size-optimization', 'compression')
 * @property {string} title - Short title for display
 * @property {string} description - Detailed explanation
 * @property {AffectedFile[]} affectedFiles - Files with details (replaces string[])
 * @property {string} recommendation - Actionable advice
 * @property {number} potentialSavings - Estimated bytes saved if recommendation applied
 * @property {InsightMetadata} metadata - Additional context
 */

// Export empty object to make this a module
export {};
