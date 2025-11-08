/**
 * iOS-Specific Types
 *
 * Types for iOS binary parsing (IPA, xcarchive, dSYM)
 */

/**
 * Framework - iOS framework with architecture details
 */
export interface Framework {
  id: string;
  name: string;                      // Framework name (e.g., "UIKit")
  path: string;                      // Path in bundle
  size: number;                      // Total framework size
  type: 'dynamic' | 'static' | 'system';
  arch: string[];                    // Architectures: arm64, x86_64, etc.
  subFrameworks?: Framework[];       // Nested frameworks

  metadata?: {
    version?: string;                // Framework version
    minOSVersion?: string;           // Minimum OS version
    hasDebugSymbols?: boolean;       // Contains debug symbols
  };
}

/**
 * Asset - Media files with encoding metadata
 */
export interface Asset {
  id: string;
  name: string;                      // Asset name
  path: string;                      // Full path in archive
  size: number;                      // File size in bytes
  type: 'image' | 'video' | 'font' | 'data' | 'localization' | 'bundle';

  // Image-specific
  encoding?: 'PNG' | 'JPEG' | 'HEIF' | 'WEBP' | 'GIF' | 'SVG';
  resolution?: '1x' | '2x' | '3x' | '@2x' | '@3x';  // iOS retina scales
  dimensions?: { width: number; height: number };

  // Video-specific
  codec?: string;                    // H.264, H.265, VP9, etc.
  duration?: number;                 // Duration in seconds

  // Font-specific
  fontFamily?: string;
  fontWeight?: string;

  metadata?: {
    isOptimized?: boolean;           // Has been compressed
    compressionRatio?: number;       // Actual / theoretical size
    inAssetCatalog?: boolean;        // iOS: in .xcassets
  };
}

/**
 * IOSParseResult - Result from iOS binary parsing
 */
export interface IOSParseResult {
  // App metadata from Info.plist
  appName: string;
  bundleIdentifier: string;
  version: string;
  buildNumber: string;
  minOSVersion: string;

  // Executable info
  executableName: string;
  architectures: string[];           // arm64, armv7, x86_64, etc.
  hasDebugSymbols: boolean;

  // Size info
  totalSize: number;
  estimatedDownloadSize: number;

  // Structure
  frameworks: Framework[];
  assets: Asset[];
  bundlePaths: string[];             // All .bundle paths

  // Binary analysis
  buildType: 'debug' | 'release' | 'unknown';
}

/**
 * PlistData - Parsed Info.plist data
 */
export interface PlistData {
  CFBundleName?: string;
  CFBundleIdentifier?: string;
  CFBundleShortVersionString?: string;
  CFBundleVersion?: string;
  MinimumOSVersion?: string;
  CFBundleExecutable?: string;
  [key: string]: unknown;
}

/**
 * MachOHeader - Mach-O executable header info
 */
export interface MachOHeader {
  magic: number;
  cputype: number;
  cpusubtype: number;
  filetype: number;
  ncmds: number;
  sizeofcmds: number;
  flags: number;
  architectures: Architecture[];
  hasSymbols: boolean;
  hasDebugInfo: boolean;
}

export interface Architecture {
  name: string;                      // arm64, x86_64, etc.
  offset: number;
  size: number;
}

/**
 * AssetCatalog - Parsed .car file data
 */
export interface AssetCatalog {
  path: string;
  totalSize: number;
  assets: AssetCatalogItem[];
}

export interface AssetCatalogItem {
  name: string;
  type: 'image' | 'color' | 'data';
  size: number;
  scale: number;                     // 1x, 2x, 3x
  idiom?: 'universal' | 'iphone' | 'ipad' | 'mac' | 'tv' | 'watch';
}
