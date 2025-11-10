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
 * @typedef {Object} BreakdownNode
 * @property {string} id - Unique ID (UUID or path-based)
 * @property {string} name - Display name (filename or component name)
 * @property {string} path - Full path in archive
 * @property {number} size - Total size in bytes (sum of children if directory)
 * @property {number} [compressedSize] - Compressed size (if applicable)
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
 */

/**
 * FileEntry - Flat representation of all files for search/filter
 *
 * @typedef {Object} FileEntry
 * @property {string} path - Unique path in archive
 * @property {number} size - Uncompressed size in bytes
 * @property {number} [compressedSize] - Compressed size
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

// Export empty object to make this a module
export {};
