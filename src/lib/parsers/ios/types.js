/**
 * iOS-specific types for IPA parsing
 */

/**
 * @typedef {import('./macho-parser.js').MachOHeader} MachOHeader
 */

/**
 * @typedef {import('./plist-parser.js').InfoPlistMetadata} InfoPlistMetadata
 */

/**
 * @typedef {import('./asset-catalog-parser.js').AssetCatalogMetadata} AssetCatalogMetadata
 */

/**
 * iOS Framework representation
 * @typedef {Object} IOSFramework
 * @property {string} name - Framework name
 * @property {string} path - Framework path
 * @property {number} size - Total size
 * @property {boolean} isSystem - System frameworks vs embedded
 * @property {string[]} architectures - Supported architectures
 * @property {boolean} hasDebugSymbols - Whether debug symbols are present
 * @property {number} binarySize - Binary size
 * @property {number} resourcesSize - Resources size
 */

/**
 * iOS Asset representation
 * @typedef {Object} IOSAsset
 * @property {string} path - Asset path
 * @property {string} name - Asset name
 * @property {'image' | 'video' | 'audio' | 'font' | 'other'} type - Asset type
 * @property {number} size - Asset size
 * @property {number} [scale] - 1x, 2x, 3x
 * @property {string} [idiom] - phone, pad, universal
 * @property {boolean} inCatalog - Whether it's in an asset catalog
 */

/**
 * IPA parse result
 * @typedef {Object} IPAParseResult
 * @property {InfoPlistMetadata} metadata - App metadata from Info.plist
 * @property {MachOHeader} [mainExecutable] - Main executable header
 * @property {IOSFramework[]} frameworks - Embedded frameworks
 * @property {IOSAsset[]} assets - App assets
 * @property {AssetCatalogMetadata} [assetCatalog] - Asset catalog metadata
 * @property {string[]} localizations - List of supported languages
 * @property {string[]} architectures - arm64, armv7, x86_64
 * @property {number} totalSize - Total uncompressed size
 * @property {number} downloadSize - Compressed size
 * @property {number} installSize - Uncompressed size
 */

/**
 * iOS-specific metadata for breakdown nodes
 * @typedef {Object} IOSBreakdownMetadata
 * @property {string} [framework] - Framework name
 * @property {string} [architecture] - Architecture name
 * @property {boolean} [hasDebugSymbols] - Whether debug symbols are present
 * @property {number} [scale] - Asset scale (1x, 2x, 3x)
 * @property {string} [idiom] - Device idiom (phone, pad, universal)
 * @property {string} [localization] - Localization language
 */

/**
 * Architecture slice in a universal binary
 * @typedef {Object} ArchitectureSlice
 * @property {string} name - Architecture name (arm64, x86_64, etc.)
 * @property {number} cputype - Mach-O CPU type
 * @property {number} cpusubtype - Mach-O CPU subtype
 * @property {number} offset - Offset in binary
 * @property {number} size - Size of this slice
 */

/**
 * Framework Metadata from Info.plist
 * @typedef {Object} FrameworkMetadata
 * @property {string} bundleIdentifier - Bundle ID (e.g., "com.example.MyFramework")
 * @property {string} bundleName - Framework name
 * @property {string} bundleExecutable - Main binary name
 * @property {string} version - Marketing version (CFBundleShortVersionString)
 * @property {string} buildVersion - Build number (CFBundleVersion)
 * @property {string|null} minimumOSVersion - Minimum OS version
 * @property {string|null} platformName - Platform (iphoneos, macosx, etc.)
 * @property {boolean} isVersioned - True if macOS versioned structure
 */

/**
 * Framework parse result
 * @typedef {Object} FrameworkParseResult
 * @property {'framework'} format - File format identifier
 * @property {string} fileName - Original file name
 * @property {number} fileSize - Total file size in bytes
 * @property {FrameworkMetadata} metadata - Extracted bundle metadata
 * @property {ArchitectureSlice[]} architectures - Architecture slices in binary
 * @property {Array<{path: string, size: number, compressedSize: number, contentType: string}>} files - All files in the framework
 * @property {Object} breakdown - Categorized size breakdown
 * @property {number} totalSize - Total uncompressed size
 * @property {number} downloadSize - Compressed size
 * @property {number} installSize - Uncompressed size
 */

export {};

