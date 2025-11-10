/**
 * Android-specific types for APK/AAB parsing
 */

/**
 * @typedef {import('./dex-parser.js').DEXMetadata} DEXMetadata
 * @typedef {import('./binary-xml-parser.js').AndroidManifestMetadata} AndroidManifestMetadata
 * @typedef {import('./arsc-parser.js').ResourceTableMetadata} ResourceTableMetadata
 */

/**
 * Android Native Library representation
 * @typedef {Object} AndroidNativeLib
 * @property {string} name - Library name
 * @property {string} path - Library path
 * @property {number} size - Library size
 * @property {string} architecture - Architecture (armeabi-v7a, arm64-v8a, x86, x86_64)
 * @property {boolean} isSystem - Is system library
 */

/**
 * Android Resource representation
 * @typedef {Object} AndroidResource
 * @property {string} path - Resource path
 * @property {string} name - Resource name
 * @property {'drawable' | 'layout' | 'raw' | 'xml' | 'values' | 'other'} type - Resource type
 * @property {number} size - Resource size
 * @property {string} [config] - Configuration qualifier (hdpi, xhdpi, xxhdpi, en, es, etc.)
 * @property {string} [density] - Density qualifier (ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
 */

/**
 * APK/AAB parse result
 * @typedef {Object} APKParseResult
 * @property {AndroidManifestMetadata} metadata - Manifest metadata
 * @property {DEXMetadata[]} dexFiles - DEX files
 * @property {AndroidNativeLib[]} nativeLibs - Native libraries
 * @property {AndroidResource[]} resources - Resources
 * @property {ResourceTableMetadata} [resourceTable] - Resource table metadata
 * @property {Array<{path: string, size: number}>} assets - Assets
 * @property {string[]} architectures - List of supported architectures
 * @property {number} totalMethodCount - Total method count across all DEX files
 * @property {number} totalSize - Total size
 * @property {number} downloadSize - Compressed size
 * @property {number} installSize - Uncompressed size
 */

/**
 * Android-specific metadata for breakdown nodes
 * @typedef {Object} AndroidBreakdownMetadata
 * @property {number} [dexIndex] - Which DEX file (classes.dex, classes2.dex, etc.)
 * @property {string} [architecture] - Architecture (arm64-v8a, armeabi-v7a, etc.)
 * @property {string} [density] - Density qualifier (hdpi, xhdpi, etc.)
 * @property {string} [config] - Configuration qualifier
 * @property {number} [methodCount] - Method count for DEX files
 * @property {string} [resourceType] - Resource type (drawable, layout, etc.)
 */

export {};
