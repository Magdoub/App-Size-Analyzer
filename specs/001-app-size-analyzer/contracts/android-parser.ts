/**
 * Android Binary Parser Contract
 *
 * Defines the interface for parsing Android app binaries (APK, AAB, APKS).
 * Implementations must handle ZIP extraction, binary XML parsing, DEX analysis,
 * and resource table extraction.
 */

export interface AndroidParserContract {
  /**
   * Parse an Android binary file (APK, AAB, or APKS)
   * @param file - The binary file to parse
   * @param options - Optional parsing configuration
   * @returns Promise resolving to Android parse result
   * @throws {ParseError} If file is invalid or parsing fails
   */
  parse(file: File, options?: ParseOptions): Promise<AndroidParseResult>;

  /**
   * Validate if a file is a supported Android binary format
   * @param file - The file to validate
   * @returns Promise resolving to validation result
   */
  validateFormat(file: File): Promise<FormatValidationResult>;

  /**
   * Cancel an ongoing parse operation
   */
  cancel(): void;

  /**
   * Register progress callback for long-running operations
   * @param callback - Function called with progress updates (0-100)
   */
  onProgress(callback: ProgressCallback): void;
}

export interface AndroidParseResult {
  // App metadata
  appName: string;
  packageName: string;
  versionCode: number;
  versionName: string;
  minSdkVersion: number;
  targetSdkVersion: number;
  platform: 'Android';

  // Size metrics
  installSize: number;         // Uncompressed size
  downloadSize: number;         // APK file size (or estimated for AAB)

  // Binary structure
  modules: APKModule[];
  resources: ResourceEntry[];
  dex: DEXMetadata[];
  nativeLibraries: NativeLib[];
  assets: AssetEntry[];

  // Optional metadata
  proguardMapping?: ProguardMapping;
  permissions?: string[];
  features?: string[];
  signingInfo?: SigningInfo;
}

export interface APKModule {
  name: string;
  size: number;
  type: 'base' | 'dynamic-feature' | 'asset-pack';
  compression: CompressionInfo;
  files: FileEntry[];
}

export interface CompressionInfo {
  method: 'stored' | 'deflated';
  ratio: number;               // compressedSize / uncompressedSize
  originalSize: number;
  compressedSize: number;
}

export interface ResourceEntry {
  path: string;
  name: string;
  size: number;
  type: 'drawable' | 'layout' | 'values' | 'raw' | 'xml' | 'other';
  density?: 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi' | 'nodpi';
  qualifier?: string;          // e.g., "en-rUS", "land", "v21"
}

export interface DEXMetadata {
  name: string;                // e.g., "classes.dex", "classes2.dex"
  path: string;
  size: number;
  version: string;             // DEX format version
  methodCount: number;
  classCount: number;
  stringPoolSize: number;
  typeCount: number;
  fieldCount: number;
}

export interface NativeLib {
  name: string;
  path: string;
  size: number;
  architecture: 'armeabi-v7a' | 'arm64-v8a' | 'x86' | 'x86_64';
  hasDebugSymbols?: boolean;
  isStripped?: boolean;
  symbols?: string[];
}

export interface AssetEntry {
  path: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'font' | 'data' | 'other';
  mimeType?: string;
}

export interface ProguardMapping {
  classMap: Map<string, string>;    // obfuscated -> original
  methodMap: Map<string, string>;
  fieldMap: Map<string, string>;
}

export interface SigningInfo {
  scheme: 'v1' | 'v2' | 'v3' | 'v4';
  certificates: Certificate[];
}

export interface Certificate {
  issuer: string;
  subject: string;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  fingerprint: string;
}

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  compressedSize?: number;
  compressionMethod?: 'stored' | 'deflated';
  crc32?: number;
}

// Options and utilities

export interface ParseOptions {
  /**
   * Skip DEX file analysis (faster but no method counts)
   */
  skipDEXAnalysis?: boolean;

  /**
   * Skip resource table parsing
   */
  skipResources?: boolean;

  /**
   * Skip native library analysis
   */
  skipNativeLibs?: boolean;

  /**
   * Parse proguard mapping if available
   */
  parseProguardMapping?: boolean;

  /**
   * Maximum file size to process (bytes)
   * @default 2GB
   */
  maxFileSize?: number;

  /**
   * Timeout for parsing operation (ms)
   * @default 60000 (1 minute)
   */
  timeout?: number;
}

export interface FormatValidationResult {
  valid: boolean;
  format?: 'APK' | 'AAB' | 'APKS' | 'unknown';
  reason?: string;
  estimatedSize?: number;
}

export type ProgressCallback = (progress: number, status: string) => void;

// Errors

export class ParseError extends Error {
  constructor(
    message: string,
    public code: ParseErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export enum ParseErrorCode {
  INVALID_FORMAT = 'INVALID_FORMAT',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  MISSING_MANIFEST = 'MISSING_MANIFEST',
  INVALID_DEX = 'INVALID_DEX',
  INVALID_RESOURCES = 'INVALID_RESOURCES',
  PARSE_TIMEOUT = 'PARSE_TIMEOUT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  MEMORY_ERROR = 'MEMORY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Example implementation signature

/**
 * Example: Create an Android parser instance
 *
 * @example
 * ```typescript
 * import { createAndroidParser } from './parsers/android/apk-parser';
 *
 * const parser = createAndroidParser();
 *
 * parser.onProgress((progress, status) => {
 *   console.log(`${progress}%: ${status}`);
 * });
 *
 * try {
 *   const result = await parser.parse(file);
 *   console.log(`Parsed ${result.appName} v${result.versionName}`);
 *   console.log(`Methods: ${result.dex.reduce((sum, d) => sum + d.methodCount, 0)}`);
 * } catch (error) {
 *   if (error instanceof ParseError) {
 *     console.error(`Parse failed: ${error.code} - ${error.message}`);
 *   }
 * }
 * ```
 */
export function createAndroidParser(): AndroidParserContract {
  throw new Error('Not implemented - this is a contract definition');
}
