# Data Model: AAB and Framework File Support

**Date**: 2025-11-19
**Branch**: `012-aab-framework-support`

## Overview

This document defines the data structures for AAB and Framework parsing results. These models extend the existing analysis types to maintain consistency with IPA and APK formats.

---

## Core Entities

### AABParseResult

Result returned by the AAB parser after analyzing an Android App Bundle.

```javascript
/**
 * @typedef {Object} AABParseResult
 * @property {'aab'} format - File format identifier
 * @property {string} fileName - Original file name
 * @property {number} fileSize - Total file size in bytes
 * @property {AABMetadata} metadata - Extracted bundle metadata
 * @property {AABModule[]} modules - List of modules in the bundle
 * @property {FileEntry[]} files - All files in the bundle
 * @property {ContentBreakdown} breakdown - Categorized size breakdown
 */

/**
 * @typedef {Object} AABMetadata
 * @property {string} packageName - Android package name (e.g., "com.example.app")
 * @property {number} versionCode - Integer version code
 * @property {string} versionName - Human-readable version (e.g., "1.0.0")
 * @property {string|null} minSdkVersion - Minimum SDK version (if available)
 * @property {string|null} targetSdkVersion - Target SDK version (if available)
 * @property {string[]} permissions - Declared permissions (if extracted)
 */

/**
 * @typedef {Object} AABModule
 * @property {string} name - Module name (e.g., "base", "feature_camera")
 * @property {boolean} isBase - True if this is the base module
 * @property {number} size - Total size of module contents
 * @property {ModuleContents} contents - Breakdown of module contents
 */

/**
 * @typedef {Object} ModuleContents
 * @property {number} dexSize - Size of DEX files
 * @property {number} dexCount - Number of DEX files
 * @property {number} resourcesSize - Size of res/ contents
 * @property {number} assetsSize - Size of assets/
 * @property {number} nativeSize - Size of native libraries
 * @property {string[]} architectures - Native architectures present
 */
```

### FrameworkParseResult

Result returned by the Framework parser after analyzing an iOS/macOS framework bundle.

```javascript
/**
 * @typedef {Object} FrameworkParseResult
 * @property {'framework'} format - File format identifier
 * @property {string} fileName - Original file name
 * @property {number} fileSize - Total file size in bytes
 * @property {FrameworkMetadata} metadata - Extracted bundle metadata
 * @property {ArchitectureSlice[]} architectures - Architecture slices in binary
 * @property {FileEntry[]} files - All files in the framework
 * @property {ContentBreakdown} breakdown - Categorized size breakdown
 */

/**
 * @typedef {Object} FrameworkMetadata
 * @property {string} bundleIdentifier - Bundle ID (e.g., "com.example.MyFramework")
 * @property {string} bundleName - Framework name
 * @property {string} bundleExecutable - Main binary name
 * @property {string} version - Marketing version (CFBundleShortVersionString)
 * @property {string} buildVersion - Build number (CFBundleVersion)
 * @property {string|null} minimumOSVersion - Minimum OS version
 * @property {string|null} platformName - Platform (iphoneos, macosx, etc.)
 * @property {boolean} isVersioned - True if macOS versioned structure
 */

/**
 * @typedef {Object} ArchitectureSlice
 * @property {string} name - Architecture name (arm64, x86_64, etc.)
 * @property {number} cputype - Mach-O CPU type
 * @property {number} cpusubtype - Mach-O CPU subtype
 * @property {number} offset - Offset in binary
 * @property {number} size - Size of this slice
 */
```

---

## Shared Entities

### FileEntry

Individual file within any parsed archive (shared across all formats).

```javascript
/**
 * @typedef {Object} FileEntry
 * @property {string} path - Full path within archive
 * @property {string} name - File name
 * @property {number} size - Uncompressed size in bytes
 * @property {number} compressedSize - Compressed size in bytes
 * @property {string} contentType - Detected content type
 * @property {string} category - Assigned category for breakdown
 */
```

### ContentBreakdown

Categorized size breakdown for visualization.

```javascript
/**
 * @typedef {Object} ContentBreakdown
 * @property {BreakdownCategory[]} categories - List of categories with sizes
 * @property {number} totalSize - Total size of all files
 */

/**
 * @typedef {Object} BreakdownCategory
 * @property {string} name - Category display name
 * @property {string} id - Category identifier
 * @property {number} size - Total size in bytes
 * @property {number} count - Number of files
 * @property {number} percentage - Percentage of total
 * @property {FileEntry[]} files - Files in this category
 */
```

---

## Category Definitions

### AAB Categories

| ID | Display Name | Patterns |
|----|-------------|----------|
| `dex` | Code (DEX) | `*/dex/*.dex` |
| `resources` | Resources | `*/res/**` |
| `assets` | Assets | `*/assets/**` |
| `native` | Native Libraries | `*/lib/**/*.so` |
| `config` | Configuration | `*.pb`, `*/manifest/**`, `META-INF/**` |
| `other` | Other | Everything else |

### Framework Categories

| ID | Display Name | Patterns |
|----|-------------|----------|
| `binary` | Binary | Main executable, `*.dylib` |
| `headers` | Headers | `Headers/**`, `PrivateHeaders/**`, `*.h` |
| `modules` | Modules | `Modules/**`, `*.modulemap`, `*.swiftmodule` |
| `resources` | Resources | `Resources/**`, `*.car`, `*.nib`, `*.lproj` |
| `metadata` | Metadata | `Info.plist`, `_CodeSignature/**` |
| `frameworks` | Embedded Frameworks | `Frameworks/**` |
| `other` | Other | Everything else |

---

## State Transitions

### Parse States

```
IDLE → LOADING → EXTRACTING → PARSING → CATEGORIZING → COMPLETE
                     ↓            ↓           ↓
                   ERROR        ERROR       ERROR
```

| State | Description |
|-------|-------------|
| `IDLE` | No file loaded |
| `LOADING` | Reading file into memory |
| `EXTRACTING` | Extracting ZIP contents |
| `PARSING` | Parsing metadata (manifest/plist) |
| `CATEGORIZING` | Classifying files into categories |
| `COMPLETE` | Analysis complete, results available |
| `ERROR` | Parse failed, error message available |

### Progress Reporting

```javascript
/**
 * @typedef {Object} ParseProgress
 * @property {string} state - Current state
 * @property {number} progress - 0-100 percentage
 * @property {string} message - Human-readable status
 * @property {number} filesProcessed - Files processed so far
 * @property {number} totalFiles - Total files to process
 */
```

---

## Validation Rules

### AAB Validation

1. File must have `.aab` extension
2. Must be valid ZIP archive
3. Must contain `base/` directory
4. Must contain `base/manifest/AndroidManifest.xml`
5. AndroidManifest must be valid protobuf

### Framework Validation

1. File must have `.zip` extension containing `.framework` directory
2. Must contain exactly one `.framework` directory at root or one level deep
3. Must contain `Info.plist` (or `Versions/*/Resources/Info.plist`)
4. Must contain main executable binary (name from `CFBundleExecutable`)

### Error Types

```javascript
/**
 * @typedef {Object} ParseError
 * @property {string} code - Error code
 * @property {string} message - Human-readable message
 * @property {string|null} details - Additional details
 */

// Error codes
const ERROR_CODES = {
  INVALID_FORMAT: 'INVALID_FORMAT',        // Not a valid ZIP/AAB/Framework
  MISSING_MANIFEST: 'MISSING_MANIFEST',    // AndroidManifest.xml not found
  MISSING_PLIST: 'MISSING_PLIST',          // Info.plist not found
  MISSING_BINARY: 'MISSING_BINARY',        // Main executable not found
  MISSING_BASE_MODULE: 'MISSING_BASE_MODULE', // base/ directory not found
  CORRUPT_FILE: 'CORRUPT_FILE',            // ZIP extraction failed
  PARSE_FAILED: 'PARSE_FAILED',            // Metadata parsing failed
};
```

---

## Relationships

```
┌─────────────────┐
│  AnalysisStore  │
└────────┬────────┘
         │ stores
         ▼
┌─────────────────┐
│  ParseResult    │ (AABParseResult | FrameworkParseResult | IPAParseResult | APKParseResult)
├─────────────────┤
│ - format        │
│ - metadata      │
│ - files[]       │
│ - breakdown     │
└────────┬────────┘
         │ contains
         ▼
┌─────────────────┐      ┌─────────────────┐
│  FileEntry[]    │      │ ContentBreakdown│
├─────────────────┤      ├─────────────────┤
│ - path          │      │ - categories[]  │
│ - size          │      │ - totalSize     │
│ - contentType   │      └────────┬────────┘
│ - category      │               │
└─────────────────┘               ▼
                         ┌─────────────────┐
                         │BreakdownCategory│
                         ├─────────────────┤
                         │ - name          │
                         │ - size          │
                         │ - files[]       │
                         └─────────────────┘
```

---

## Integration with Existing Types

The new parse results extend the existing type system in `src/types/analysis.js`:

```javascript
// Existing union type updated
/**
 * @typedef {IPAParseResult | APKParseResult | AABParseResult | FrameworkParseResult} ParseResult
 */

// Format detection
/**
 * @typedef {'ipa' | 'apk' | 'aab' | 'framework'} FileFormat
 */
```

The `analysisStore` will handle all formats uniformly since they share the same `breakdown` structure for visualization.
