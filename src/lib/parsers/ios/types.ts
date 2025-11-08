/**
 * iOS-specific types for IPA parsing
 */

import type { MachOHeader } from './macho-parser';
import type { InfoPlistMetadata } from './plist-parser';
import type { AssetCatalogMetadata } from './asset-catalog-parser';

/**
 * iOS Framework representation
 */
export interface IOSFramework {
  name: string;
  path: string;
  size: number;
  isSystem: boolean; // System frameworks vs embedded
  architectures: string[];
  hasDebugSymbols: boolean;
  binarySize: number;
  resourcesSize: number;
}

/**
 * iOS Asset representation
 */
export interface IOSAsset {
  path: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'font' | 'other';
  size: number;
  scale?: number; // 1x, 2x, 3x
  idiom?: string; // phone, pad, universal
  inCatalog: boolean; // Whether it's in an asset catalog
}

/**
 * IPA parse result
 */
export interface IPAParseResult {
  metadata: InfoPlistMetadata;
  mainExecutable?: MachOHeader;
  frameworks: IOSFramework[];
  assets: IOSAsset[];
  assetCatalog?: AssetCatalogMetadata;
  localizations: string[]; // List of supported languages
  architectures: string[]; // arm64, armv7, x86_64
  totalSize: number;
  downloadSize: number; // Compressed size
  installSize: number; // Uncompressed size
}

/**
 * iOS-specific metadata for breakdown nodes
 */
export interface IOSBreakdownMetadata {
  framework?: string;
  architecture?: string;
  hasDebugSymbols?: boolean;
  scale?: number;
  idiom?: string;
  localization?: string;
}
