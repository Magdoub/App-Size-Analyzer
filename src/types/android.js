/**
 * Android-Specific Types
 *
 * Type definitions for Android binary parsing (APK, AAB, APKS)
 */

/**
 * DEXMetadata - Metadata for Android DEX files
 *
 * @typedef {Object} DEXMetadata
 * @property {string} id - Unique identifier
 * @property {string} name - e.g., "classes.dex", "classes2.dex"
 * @property {string} path - Path in APK
 * @property {number} size - Size in bytes
 * @property {number} methodCount - Total methods defined
 * @property {number} classCount - Total classes defined
 * @property {number} stringPoolSize - Size of string pool
 * @property {number} typeCount - Number of types
 * @property {Map<string, string>} [proguardMapping] - obfuscated -> original
 * @property {Object} [metadata] - Additional metadata
 * @property {string} [metadata.version] - DEX format version
 * @property {boolean} [metadata.hasMultidex] - Part of multidex setup
 */

/**
 * NativeLib - Native compiled libraries (.so files)
 *
 * @typedef {Object} NativeLib
 * @property {string} id - Unique identifier
 * @property {string} name - Library name (e.g., "libnative.so")
 * @property {string} path - Path in APK (lib/arm64-v8a/libnative.so)
 * @property {number} size - Size in bytes
 * @property {'armeabi-v7a'|'arm64-v8a'|'x86'|'x86_64'} architecture - CPU architecture
 * @property {Object} [metadata] - Additional metadata
 * @property {string[]} [metadata.symbols] - Exported symbols
 * @property {boolean} [metadata.hasDebugSymbols] - Has debug symbols
 * @property {boolean} [metadata.isStripped] - Symbols stripped
 */

/**
 * AndroidResource - Parsed resource entry
 *
 * @typedef {Object} AndroidResource
 * @property {number} id - Resource ID
 * @property {string} name - Resource name
 * @property {string} type - drawable, string, layout, etc.
 * @property {string} [path] - Resource path
 * @property {number} size - Size in bytes
 * @property {string} [config] - density, locale, etc.
 */

/**
 * APKModule - Module in AAB (App Bundle)
 *
 * @typedef {Object} APKModule
 * @property {string} name - Module name
 * @property {'base'|'feature'|'asset'} type - Module type
 * @property {number} size - Module size
 * @property {number} installSize - Install size
 * @property {number} downloadSize - Download size
 */

/**
 * AndroidParseResult - Result from Android binary parsing
 *
 * @typedef {Object} AndroidParseResult
 * @property {string} packageName - Package name
 * @property {string} appName - Application name
 * @property {string} versionName - Version name
 * @property {number} versionCode - Version code
 * @property {number} minSdkVersion - Minimum SDK version
 * @property {number} targetSdkVersion - Target SDK version
 * @property {DEXMetadata[]} dexFiles - DEX files
 * @property {NativeLib[]} nativeLibs - Native libraries
 * @property {AndroidResource[]} resources - Resources
 * @property {APKModule[]} [modules] - AAB modules (AAB only)
 * @property {number} totalSize - Total size
 * @property {number} installSize - Install size
 * @property {number} downloadSize - Download size
 * @property {number} totalMethodCount - Total method count
 * @property {number} maxMethodsPerDex - Max methods per DEX
 * @property {'debug'|'release'|'unknown'} buildType - Build type
 * @property {boolean} isMinified - Proguard/R8 applied
 */

/**
 * AndroidManifest - Parsed AndroidManifest.xml data
 *
 * @typedef {Object} AndroidManifest
 * @property {string} package - Package name
 * @property {number} versionCode - Version code
 * @property {string} versionName - Version name
 * @property {number} minSdkVersion - Minimum SDK version
 * @property {number} targetSdkVersion - Target SDK version
 * @property {Object} application - Application metadata
 * @property {string} [application.name] - Application name
 * @property {string} [application.label] - Application label
 * @property {string} [application.icon] - Application icon
 * @property {boolean} [application.debuggable] - Is debuggable
 * @property {string[]} permissions - Permissions
 * @property {string[]} features - Features
 */

/**
 * ResourceTableEntry - Single resource table entry
 *
 * @typedef {Object} ResourceTableEntry
 * @property {number} id - Resource ID
 * @property {string} type - Resource type
 * @property {string} name - Resource name
 * @property {string} config - Configuration
 * @property {string|number} value - Resource value
 */

/**
 * ResourceTable - Parsed resources.arsc data
 *
 * @typedef {Object} ResourceTable
 * @property {string} packageName - Package name
 * @property {ResourceTableEntry[]} entries - Resource entries
 * @property {number} totalSize - Total size
 */

// Export empty object to make this a module
export {};
