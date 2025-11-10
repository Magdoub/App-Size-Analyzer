/**
 * iOS-Specific Types
 *
 * Type definitions for iOS binary parsing (IPA, xcarchive, dSYM)
 */

/**
 * Framework - iOS framework with architecture details
 *
 * @typedef {Object} Framework
 * @property {string} id - Unique identifier
 * @property {string} name - Framework name (e.g., "UIKit")
 * @property {string} path - Path in bundle
 * @property {number} size - Total framework size
 * @property {'dynamic'|'static'|'system'} type - Framework type
 * @property {string[]} arch - Architectures: arm64, x86_64, etc.
 * @property {Framework[]} [subFrameworks] - Nested frameworks
 * @property {Object} [metadata] - Additional metadata
 * @property {string} [metadata.version] - Framework version
 * @property {string} [metadata.minOSVersion] - Minimum OS version
 * @property {boolean} [metadata.hasDebugSymbols] - Contains debug symbols
 */

/**
 * Asset - Media files with encoding metadata
 *
 * @typedef {Object} Asset
 * @property {string} id - Unique identifier
 * @property {string} name - Asset name
 * @property {string} path - Full path in archive
 * @property {number} size - File size in bytes
 * @property {'image'|'video'|'font'|'data'|'localization'|'bundle'} type - Asset type
 * @property {'PNG'|'JPEG'|'HEIF'|'WEBP'|'GIF'|'SVG'} [encoding] - Image encoding
 * @property {'1x'|'2x'|'3x'|'@2x'|'@3x'} [resolution] - iOS retina scales
 * @property {Object} [dimensions] - Image dimensions
 * @property {number} [dimensions.width] - Width in pixels
 * @property {number} [dimensions.height] - Height in pixels
 * @property {string} [codec] - Video codec (H.264, H.265, VP9, etc.)
 * @property {number} [duration] - Video duration in seconds
 * @property {string} [fontFamily] - Font family name
 * @property {string} [fontWeight] - Font weight
 * @property {Object} [metadata] - Additional metadata
 * @property {boolean} [metadata.isOptimized] - Has been compressed
 * @property {number} [metadata.compressionRatio] - Actual / theoretical size
 * @property {boolean} [metadata.inAssetCatalog] - iOS: in .xcassets
 */

/**
 * IOSParseResult - Result from iOS binary parsing
 *
 * @typedef {Object} IOSParseResult
 * @property {string} appName - Application name
 * @property {string} bundleIdentifier - Bundle identifier
 * @property {string} version - Version string
 * @property {string} buildNumber - Build number
 * @property {string} minOSVersion - Minimum OS version
 * @property {string} executableName - Executable name
 * @property {string[]} architectures - arm64, armv7, x86_64, etc.
 * @property {boolean} hasDebugSymbols - Has debug symbols
 * @property {number} totalSize - Total size in bytes
 * @property {number} estimatedDownloadSize - Estimated download size
 * @property {Framework[]} frameworks - iOS frameworks
 * @property {Asset[]} assets - Assets
 * @property {string[]} bundlePaths - All .bundle paths
 * @property {'debug'|'release'|'unknown'} buildType - Build type
 */

/**
 * PlistData - Parsed Info.plist data
 *
 * @typedef {Object} PlistData
 * @property {string} [CFBundleName] - Bundle name
 * @property {string} [CFBundleIdentifier] - Bundle identifier
 * @property {string} [CFBundleShortVersionString] - Short version
 * @property {string} [CFBundleVersion] - Bundle version
 * @property {string} [MinimumOSVersion] - Minimum OS version
 * @property {string} [CFBundleExecutable] - Executable name
 */

/**
 * Architecture - CPU architecture info
 *
 * @typedef {Object} Architecture
 * @property {string} name - arm64, x86_64, etc.
 * @property {number} offset - Offset in file
 * @property {number} size - Size in bytes
 */

/**
 * MachOHeader - Mach-O executable header info
 *
 * @typedef {Object} MachOHeader
 * @property {number} magic - Magic number
 * @property {number} cputype - CPU type
 * @property {number} cpusubtype - CPU subtype
 * @property {number} filetype - File type
 * @property {number} ncmds - Number of load commands
 * @property {number} sizeofcmds - Size of load commands
 * @property {number} flags - Flags
 * @property {Architecture[]} architectures - Architectures
 * @property {boolean} hasSymbols - Has symbols
 * @property {boolean} hasDebugInfo - Has debug info
 */

/**
 * AssetCatalogItem - Single asset in catalog
 *
 * @typedef {Object} AssetCatalogItem
 * @property {string} name - Asset name
 * @property {'image'|'color'|'data'} type - Asset type
 * @property {number} size - Size in bytes
 * @property {number} scale - 1x, 2x, 3x
 * @property {'universal'|'iphone'|'ipad'|'mac'|'tv'|'watch'} [idiom] - Device idiom
 */

/**
 * AssetCatalog - Parsed .car file data
 *
 * @typedef {Object} AssetCatalog
 * @property {string} path - Path to .car file
 * @property {number} totalSize - Total catalog size
 * @property {AssetCatalogItem[]} assets - Assets in catalog
 */

// Export empty object to make this a module
export {};
