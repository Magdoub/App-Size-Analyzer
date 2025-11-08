/**
 * iOS Binary Parser Contract
 *
 * Defines the interface for parsing iOS app binaries (IPA, xcarchive, dSYM).
 * Implementations must handle ZIP extraction, plist parsing, Mach-O analysis,
 * and asset catalog enumeration.
 */

export interface IOSParserContract {
  /**
   * Parse an iOS binary file (IPA or xcarchive)
   * @param file - The binary file to parse
   * @param options - Optional parsing configuration
   * @returns Promise resolving to iOS parse result
   * @throws {ParseError} If file is invalid or parsing fails
   */
  parse(file: File, options?: ParseOptions): Promise<IOSParseResult>;

  /**
   * Validate if a file is a supported iOS binary format
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

export interface IOSParseResult {
  // App metadata
  appName: string;
  bundleIdentifier: string;
  version: string;
  buildNumber?: string;
  minOSVersion?: string;
  targetOSVersion?: string;
  platform: 'iOS';

  // Size metrics
  installSize: number;        // Uncompressed size in bytes
  downloadSize: number;        // Compressed size (estimate)

  // Binary structure
  frameworks: Framework[];
  assets: Asset[];
  bundles: Bundle[];
  localizations: Localization[];
  executable: ExecutableMetadata;

  // Additional metadata
  buildType?: 'debug' | 'release' | 'unknown';
  compilerOptimization?: 'none' | 'O0' | 'Os' | 'O2' | 'Oz';
  signingIdentity?: string;
  entitlements?: Record<string, unknown>;
}

export interface Framework {
  name: string;
  path: string;
  size: number;
  type: 'dynamic' | 'static' | 'system';
  arch: string[];              // arm64, arm64e, x86_64, etc.
  subFrameworks?: Framework[];
  version?: string;
  minOSVersion?: string;
  hasDebugSymbols?: boolean;
}

export interface Asset {
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'font' | 'data' | 'localization' | 'bundle';
  encoding?: 'PNG' | 'JPEG' | 'HEIF' | 'WEBP' | 'GIF' | 'SVG' | 'PDF';
  resolution?: '1x' | '2x' | '3x';
  dimensions?: { width: number; height: number };
  isOptimized?: boolean;
  inAssetCatalog?: boolean;
}

export interface Bundle {
  name: string;
  path: string;
  size: number;
  bundleIdentifier?: string;
  files: FileEntry[];
}

export interface Localization {
  language: string;            // e.g., "en", "es", "zh-Hans"
  path: string;                // Path to .lproj directory
  size: number;
  stringCount: number;
  strings: LocalizedString[];
}

export interface LocalizedString {
  key: string;
  value: string;
  size: number;
  comment?: string;
}

export interface ExecutableMetadata {
  name: string;
  path: string;
  size: number;
  arch: string[];
  hasDebugSymbols: boolean;
  symbolTableSize?: number;
  loadCommands: MachOLoadCommand[];
}

export interface MachOLoadCommand {
  cmd: string;
  cmdsize: number;
  data?: unknown;
}

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  compressedSize?: number;
  type: string;                // MIME type or extension
}

// Options and utilities

export interface ParseOptions {
  /**
   * Skip expensive operations (e.g., asset catalog parsing)
   */
  skipAssetCatalog?: boolean;

  /**
   * Skip localization parsing
   */
  skipLocalizations?: boolean;

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
  format?: 'IPA' | 'xcarchive' | 'dSYM' | 'unknown';
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
  PARSE_TIMEOUT = 'PARSE_TIMEOUT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  MEMORY_ERROR = 'MEMORY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Example implementation signature

/**
 * Example: Create an iOS parser instance
 *
 * @example
 * ```typescript
 * import { createIOSParser } from './parsers/ios/ipa-parser';
 *
 * const parser = createIOSParser();
 *
 * parser.onProgress((progress, status) => {
 *   console.log(`${progress}%: ${status}`);
 * });
 *
 * try {
 *   const result = await parser.parse(file);
 *   console.log(`Parsed ${result.appName} v${result.version}`);
 *   console.log(`Size: ${result.installSize} bytes`);
 * } catch (error) {
 *   if (error instanceof ParseError) {
 *     console.error(`Parse failed: ${error.code} - ${error.message}`);
 *   }
 * }
 * ```
 */
export function createIOSParser(): IOSParserContract {
  throw new Error('Not implemented - this is a contract definition');
}
