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

export {};
