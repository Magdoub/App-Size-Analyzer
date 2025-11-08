/**
 * Android-specific types for APK/AAB parsing
 */

import type { DEXMetadata } from './dex-parser';
import type { AndroidManifestMetadata } from './binary-xml-parser';
import type { ResourceTableMetadata } from './arsc-parser';

/**
 * Android Native Library representation
 */
export interface AndroidNativeLib {
  name: string;
  path: string;
  size: number;
  architecture: string; // armeabi-v7a, arm64-v8a, x86, x86_64
  isSystem: boolean;
}

/**
 * Android Resource representation
 */
export interface AndroidResource {
  path: string;
  name: string;
  type: 'drawable' | 'layout' | 'raw' | 'xml' | 'values' | 'other';
  size: number;
  config?: string; // hdpi, xhdpi, xxhdpi, en, es, etc.
  density?: string; // ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
}

/**
 * APK/AAB parse result
 */
export interface APKParseResult {
  metadata: AndroidManifestMetadata;
  dexFiles: DEXMetadata[];
  nativeLibs: AndroidNativeLib[];
  resources: AndroidResource[];
  resourceTable?: ResourceTableMetadata;
  assets: { path: string; size: number }[];
  architectures: string[]; // List of supported architectures
  totalMethodCount: number;
  totalSize: number;
  downloadSize: number; // Compressed size
  installSize: number; // Uncompressed size
}

/**
 * Android-specific metadata for breakdown nodes
 */
export interface AndroidBreakdownMetadata {
  dexIndex?: number; // Which DEX file (classes.dex, classes2.dex, etc.)
  architecture?: string; // arm64-v8a, armeabi-v7a, etc.
  density?: string; // hdpi, xhdpi, etc.
  config?: string; // Configuration qualifier
  methodCount?: number; // For DEX files
  resourceType?: string; // drawable, layout, etc.
}
