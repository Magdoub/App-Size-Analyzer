/**
 * Core Analysis Types
 *
 * These types define the structure of the analysis data model.
 * All entities are immutable - updates create new objects.
 */

export type Platform = 'iOS' | 'Android';

export type ContentType =
  | 'framework'      // iOS framework (.framework)
  | 'bundle'         // iOS bundle (.bundle)
  | 'executable'     // iOS/Android executable binary
  | 'dex'            // Android DEX file
  | 'native_lib'     // Android native library (.so)
  | 'resource'       // Android resource
  | 'asset'          // Android asset
  | 'image'          // Image file
  | 'video'          // Video file
  | 'audio'          // Audio file
  | 'font'           // Font file
  | 'localization'   // Localization file (.lproj, strings.xml)
  | 'data'           // Data file (JSON, XML, etc.)
  | 'config'         // Configuration file
  | 'other'          // Other file types
  | 'unknown';       // Unrecognized type

/**
 * BreakdownNode - Hierarchical tree node representing a file, directory, framework, or module
 */
export interface BreakdownNode {
  id: string;                        // Unique ID (UUID or path-based)
  name: string;                      // Display name (filename or component name)
  path: string;                      // Full path in archive
  size: number;                      // Total size in bytes (sum of children if directory)
  compressedSize?: number;           // Compressed size (if applicable)
  type: ContentType;
  parent?: string;                   // Parent node ID (undefined for root)
  children: BreakdownNode[];         // Child nodes (empty for files)

  metadata?: {
    fileCount?: number;              // Number of descendant files
    duplicates?: string[];           // IDs of duplicate nodes
    encoding?: string;               // File encoding (UTF-8, binary, etc.)
    architecture?: string[];         // For executables: arm64, x86_64, etc.
  };
}

/**
 * AnalysisContext - Root entity containing all analysis data for a single binary file
 */
export interface AnalysisContext {
  // Identification
  fileId: string;                    // UUID v4
  timestamp: Date;                   // Analysis timestamp

  // Binary metadata
  platform: Platform;
  appName: string;
  bundleId: string;                  // iOS: bundleIdentifier, Android: packageName
  version: string;
  versionCode?: number;              // Android only

  // Size metrics
  totalInstallSize: number;          // Uncompressed size in bytes
  totalDownloadSize: number;         // Compressed size (actual file size)

  // Hierarchical structure
  breakdownRoot: BreakdownNode;      // Root of file tree

  // Categorized content (references to breakdown nodes)
  frameworks: string[];               // iOS framework node IDs
  assets: string[];                   // Asset node IDs
  localizations: string[];            // Localization node IDs
  executables: string[];              // Executable node IDs
  nativeLibraries: string[];          // Android native lib node IDs
  dexFiles: string[];                 // Android DEX file node IDs
  modules: string[];                  // Android AAB module node IDs (optional)

  // Analysis artifacts
  allFiles: FileEntry[];             // Flat list for search/filter
  fileHashes?: Map<string, string>;   // path -> SHA-256 hash (lazy computed)

  // Build metadata
  buildType?: 'debug' | 'release' | 'unknown';
  compilerOptimization?: 'none' | 'O0' | 'Os' | 'O2' | 'Oz';
}

/**
 * FileEntry - Flat representation of all files for search/filter
 */
export interface FileEntry {
  path: string;                      // Unique path in archive
  size: number;
  compressedSize?: number;
  type: ContentType;
  encoding?: string;

  metadata?: {
    lastModified?: Date;
    permissions?: string;
    owner?: string;
  };
}

/**
 * ValidationResult - Result of validation checks
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
