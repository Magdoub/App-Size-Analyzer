/**
 * Android-Specific Types
 *
 * Types for Android binary parsing (APK, AAB, APKS)
 */

/**
 * DEXMetadata - Metadata for Android DEX files
 */
export interface DEXMetadata {
  id: string;
  name: string;                      // e.g., "classes.dex", "classes2.dex"
  path: string;
  size: number;

  // DEX structure
  methodCount: number;               // Total methods defined
  classCount: number;                // Total classes defined
  stringPoolSize: number;            // Size of string pool
  typeCount: number;                 // Number of types

  // Optional proguard mapping
  proguardMapping?: Map<string, string>;  // obfuscated -> original

  metadata?: {
    version?: string;                // DEX format version
    hasMultidex?: boolean;           // Part of multidex setup
  };
}

/**
 * NativeLib - Native compiled libraries (.so files)
 */
export interface NativeLib {
  id: string;
  name: string;                      // Library name (e.g., "libnative.so")
  path: string;                      // Path in APK (lib/arm64-v8a/libnative.so)
  size: number;
  architecture: 'armeabi-v7a' | 'arm64-v8a' | 'x86' | 'x86_64';

  metadata?: {
    symbols?: string[];              // Exported symbols
    hasDebugSymbols?: boolean;
    isStripped?: boolean;            // Symbols stripped
  };
}

/**
 * AndroidResource - Parsed resource entry
 */
export interface AndroidResource {
  id: number;                        // Resource ID
  name: string;
  type: string;                      // drawable, string, layout, etc.
  path?: string;
  size: number;
  config?: string;                   // density, locale, etc.
}

/**
 * APKModule - Module in AAB (App Bundle)
 */
export interface APKModule {
  name: string;                      // Module name
  type: 'base' | 'feature' | 'asset';
  size: number;
  installSize: number;
  downloadSize: number;
}

/**
 * AndroidParseResult - Result from Android binary parsing
 */
export interface AndroidParseResult {
  // App metadata from AndroidManifest.xml
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;

  // Binary structure
  dexFiles: DEXMetadata[];
  nativeLibs: NativeLib[];
  resources: AndroidResource[];
  modules?: APKModule[];             // AAB only

  // Size info
  totalSize: number;
  installSize: number;
  downloadSize: number;

  // Method counts
  totalMethodCount: number;
  maxMethodsPerDex: number;

  // Binary analysis
  buildType: 'debug' | 'release' | 'unknown';
  isMinified: boolean;               // Proguard/R8 applied
}

/**
 * AndroidManifest - Parsed AndroidManifest.xml data
 */
export interface AndroidManifest {
  package: string;
  versionCode: number;
  versionName: string;
  minSdkVersion: number;
  targetSdkVersion: number;
  application: {
    name?: string;
    label?: string;
    icon?: string;
    debuggable?: boolean;
  };
  permissions: string[];
  features: string[];
}

/**
 * ResourceTable - Parsed resources.arsc data
 */
export interface ResourceTable {
  packageName: string;
  entries: ResourceTableEntry[];
  totalSize: number;
}

export interface ResourceTableEntry {
  id: number;
  type: string;
  name: string;
  config: string;
  value: string | number;
}
