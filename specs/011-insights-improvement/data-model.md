# Data Model: Comprehensive Insights Improvement

**Feature**: 011-insights-improvement
**Date**: 2025-11-20
**Status**: Draft

## Overview

This document defines the core entities, their properties, relationships, and validation rules for the comprehensive insights system. The data model extends the existing insight infrastructure (`src/lib/analysis/`) with new entities for image compression, font analysis, and enhanced insight metadata.

---

## Entity Definitions

### 1. InsightRule

**Purpose**: Represents the detection logic for a specific insight type

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | string | ✅ | `/^R\d{3}$/` (e.g., R001, R011) | Unique rule identifier |
| `category` | string | ✅ | enum: `duplicates`, `optimization`, `security`, `unused`, `architecture` | Insight category |
| `name` | string | ✅ | 1-100 chars | Human-readable rule name |
| `description` | string | ✅ | 1-500 chars | What the rule detects |
| `severity` | string | ✅ | enum: `critical`, `high`, `medium`, `low` | Severity level |
| `platform` | string | ❌ | enum: `iOS`, `Android`, `both` | Platform filter (omit for both) |
| `priority` | string | ✅ | enum: `P1`, `P2`, `P3` | Implementation priority |
| `execute` | function | ✅ | `async (context: AnalysisContext) => InsightResult[]` | Detection function |
| `metadata` | object | ❌ | See InsightRuleMetadata | Additional rule metadata |

**Relationships**:
- `execute()` receives **AnalysisContext** → returns array of **InsightResult**
- Multiple rules can be grouped by `category`
- Rules are filtered by `platform` during analysis

**Validation Rules**:
- `id` must be unique across all rules
- `execute` function must be async and return array
- `severity` determines UI display color/priority
- `category` must match existing categories or be registered

**Example**:
```javascript
const imageOptimizationRule = {
  id: 'R011',
  category: 'optimization',
  name: 'Unoptimized Images',
  description: 'Detects images that could be compressed with actual testing',
  severity: 'high',
  platform: 'both',
  priority: 'P1',
  execute: async (context) => {
    // Detection logic
    return insightResults;
  },
  metadata: {
    requiresWorker: true,
    estimatedTime: '30-60s for 100 images',
    fixable: true
  }
};
```

---

### 2. InsightResult

**Purpose**: Represents a detected optimization opportunity from a rule execution

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `ruleId` | string | ✅ | Must match existing InsightRule.id | Source rule identifier |
| `title` | string | ✅ | 1-200 chars | Concise insight title |
| `description` | string | ✅ | 1-2000 chars | Detailed explanation with numbers |
| `severity` | string | ✅ | enum: `critical`, `high`, `medium`, `low` | Severity level |
| `category` | string | ✅ | enum: `duplicates`, `optimization`, `security`, `unused`, `architecture` | Insight category |
| `affectedItems` | array | ✅ | AffectedItem[] | List of affected files/resources |
| `potentialSavings` | number | ✅ | ≥ 0 (bytes) | Estimated bytes saved |
| `percentOfTotal` | number | ✅ | 0-100 | % of total app size |
| `actionable` | boolean | ✅ | - | Can user act on this? |
| `fixSuggestion` | string | ✅ | 1-5000 chars, markdown supported | How to fix (with code snippets) |
| `metadata` | object | ❌ | See InsightResultMetadata | Additional result metadata |

**Relationships**:
- Belongs to one **InsightRule** (via `ruleId`)
- Contains multiple **AffectedItem** entries
- May link to **ImageCompressionResult** (for image insights)

**Validation Rules**:
- `potentialSavings` must be ≥ threshold defined in rule (e.g., 4KB for images)
- `percentOfTotal` calculated as: `(potentialSavings / context.totalInstallSize) * 100`
| `fixSuggestion` must include specific steps, not vague advice
- `affectedItems` must not be empty (at least one item must be affected)

**Example**:
```javascript
{
  ruleId: 'R011',
  title: '45 Images Could Be Optimized',
  description: '45 PNG/JPEG images could be compressed with JPEG 85% quality, saving 2.3 MB (12.5% of app).',
  severity: 'high',
  category: 'optimization',
  affectedItems: [
    {
      path: 'Assets.car/hero-image.png',
      size: 523045,
      reason: 'Could save 312KB with JPEG 85% compression',
      metadata: { compressionResults: {...} }
    },
    // ... more items
  ],
  potentialSavings: 2411520, // bytes
  percentOfTotal: 12.5,
  actionable: true,
  fixSuggestion: '## How to Fix\n\n1. **Use ImageOptim** (Mac):\n...',
  metadata: {
    testedFormats: ['jpeg-85', 'webp-85'],
    bestFormat: 'jpeg-85',
    testDuration: 42300 // ms
  }
}
```

---

### 3. AffectedItem

**Purpose**: Represents a single file/resource flagged by an insight

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `path` | string | ✅ | Valid file path | File location in bundle |
| `size` | number | ✅ | ≥ 0 (bytes) | File size in bytes |
| `reason` | string | ✅ | 1-500 chars | Why this item is flagged |
| `metadata` | object | ❌ | Flexible | Item-specific data |

**Relationships**:
- Belongs to one **InsightResult**
- May reference **ImageCompressionResult** in metadata
- May reference **DuplicateGroup** in metadata

**Validation Rules**:
- `path` must exist in `context.allFiles`
- `size` must match actual file size from context
- `reason` must be specific to this item (not generic)

**Example**:
```javascript
{
  path: 'Assets.car/hero-image.png',
  size: 523045,
  reason: 'Could save 312KB (60%) with JPEG 85% compression',
  metadata: {
    compressionResult: {
      original: { format: 'png', size: 523045 },
      compressed: { format: 'jpeg', size: 210834, quality: 0.85 },
      savings: 312211,
      reductionPercent: 59.7
    },
    previewUrls: {
      original: 'blob:...',
      compressed: 'blob:...'
    }
  }
}
```

---

### 4. ImageCompressionResult

**Purpose**: Stores results of actual image compression testing

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `filePath` | string | ✅ | Valid image path | Original image path |
| `originalFormat` | string | ✅ | enum: `png`, `jpeg`, `webp`, `heic` | Original format |
| `originalSize` | number | ✅ | > 0 (bytes) | Original file size |
| `testedFormats` | array | ✅ | CompressedFormat[] | All tested compressions |
| `bestFormat` | object | ✅ | CompressedFormat | Best compression result |
| `savings` | number | ✅ | ≥ 0 (bytes) | Bytes saved with best format |
| `reductionPercent` | number | ✅ | 0-100 | % reduction with best format |
| `testDuration` | number | ✅ | > 0 (ms) | Time taken to test |
| `previewUrls` | object | ❌ | { original: string, compressed: string } | Object URLs for preview |

**Relationships**:
- Created by **ImageCompressor** service
- Referenced in **AffectedItem.metadata** for image insights
- May be stored in **AnalysisContext.imageCompressionCache** for reuse

**Validation Rules**:
- `savings` = `originalSize - bestFormat.size`
- `reductionPercent` = `(savings / originalSize) * 100`
- `bestFormat` must be the tested format with maximum savings
- `testedFormats` must include at least one format (JPEG 85%)
- `previewUrls` must be revoked when no longer needed

**Example**:
```javascript
{
  filePath: 'Assets.car/hero-image.png',
  originalFormat: 'png',
  originalSize: 523045,
  testedFormats: [
    { format: 'jpeg', quality: 0.85, size: 210834, blob: Blob {...} },
    { format: 'webp', quality: 0.85, size: 186723, blob: Blob {...} }
  ],
  bestFormat: { format: 'webp', quality: 0.85, size: 186723, blob: Blob {...} },
  savings: 336322,
  reductionPercent: 64.3,
  testDuration: 127, // ms
  previewUrls: {
    original: 'blob:http://localhost:5173/abc-123',
    compressed: 'blob:http://localhost:5173/def-456'
  }
}
```

---

### 5. CompressedFormat

**Purpose**: Represents a single compression test result

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `format` | string | ✅ | enum: `jpeg`, `webp`, `png` | Compression format |
| `quality` | number | ✅ | 0.0-1.0 | Compression quality |
| `size` | number | ✅ | > 0 (bytes) | Compressed file size |
| `blob` | Blob | ✅ | Valid Blob | Compressed image data |

**Validation Rules**:
- `quality` parameter only applies to lossy formats (JPEG, WebP)
- `size` should match `blob.size` property
- `format` must be supported by Canvas API (JPEG universal, WebP not in Safari)

---

### 6. DuplicateGroup

**Purpose**: Represents a group of files with identical content (same hash)

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `hash` | string | ✅ | SHA-256 hex (64 chars) | File content hash |
| `paths` | array | ✅ | string[], length ≥ 2 | Paths of duplicate files |
| `fileSize` | number | ✅ | > 0 (bytes) | Size of each duplicate |
| `duplicateCount` | number | ✅ | ≥ 2 | Number of duplicates |
| `potentialSavings` | number | ✅ | ≥ 0 (bytes) | (n-1) × fileSize |
| `platform` | string | ✅ | enum: `iOS`, `Android` | Platform (for threshold logic) |

**Relationships**:
- Created by **findDuplicatesByHash()** engine function
- Referenced in **AffectedItem.metadata** for duplicate insights
- Stored in **AnalysisContext** during analysis

**Validation Rules**:
- `paths.length` must equal `duplicateCount`
- `potentialSavings` = `(duplicateCount - 1) × fileSize`
- **Android**: Only create if `potentialSavings ≥ 512 bytes` (FR-013)
- **iOS**: No minimum threshold (FR-014)
- All paths must have same hash (verified by file-hasher.js)

**Example**:
```javascript
{
  hash: 'a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
  paths: [
    'res/drawable-hdpi/icon.png',
    'res/drawable-xhdpi/icon.png',
    'res/drawable-xxhdpi/icon.png'
  ],
  fileSize: 8432,
  duplicateCount: 3,
  potentialSavings: 16864, // (3-1) × 8432
  platform: 'Android'
}
```

---

### 7. FontAnalysisResult

**Purpose**: Stores font file analysis using heuristics (no parsing library)

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `filePath` | string | ✅ | Valid font path | Font file path in bundle |
| `fileName` | string | ✅ | - | Font file name |
| `fileSize` | number | ✅ | > 0 (bytes) | Font file size |
| `sizeKB` | number | ✅ | fileSize / 1024 | Size in kilobytes |
| `format` | string | ✅ | enum: `ttf`, `otf`, `woff`, `woff2` | Font format (from extension) |
| `likelyCJK` | boolean | ✅ | - | Detected via name/size heuristic |
| `excessiveSize` | boolean | ✅ | - | >1MB and not obvious CJK |
| `referencedInPlist` | boolean | ❌ | iOS only | Found in Info.plist UIAppFonts? |
| `referencedInAssets` | boolean | ❌ | iOS only | Found in asset catalog? |

**Relationships**:
- Created by **analyzeFontFile()** utility function
- Referenced in **AffectedItem.metadata** for font insights
- May cross-reference with **Info.plist** data (iOS only)

**Validation Rules**:
- `likelyCJK` = `sizeKB > 1000 OR hasCJKNamePattern` (heuristic from research.md)
- `excessiveSize` = `sizeKB > 1000 AND NOT likelyCJK`
- `format` extracted from file extension: `.ttf` → `ttf`
- iOS font detection requires checking Info.plist `UIAppFonts` array

**CJK Name Patterns** (for heuristic):
```javascript
const cjkPatterns = /cjk|chinese|japanese|korean|hans|hant|pingfang|hiragino|noto.*sc|noto.*tc|noto.*jp|noto.*kr/i;
```

**Example**:
```javascript
{
  filePath: 'Fonts/NotoSansCJK-Regular.otf',
  fileName: 'NotoSansCJK-Regular.otf',
  fileSize: 8245632,
  sizeKB: 8052.4,
  format: 'otf',
  likelyCJK: true, // Name contains "CJK"
  excessiveSize: false, // CJK fonts are expected to be large
  referencedInPlist: true,
  referencedInAssets: false
}
```

---

### 8. IconMetadata (iOS-specific)

**Purpose**: Stores metadata about iOS app icons for optimization detection

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `filePath` | string | ✅ | Valid image path | Icon file path |
| `iconType` | string | ✅ | enum: `primary`, `alternate` | Icon classification |
| `resolution` | object | ✅ | { width: number, height: number } | Declared resolution |
| `detailLevel` | string | ❌ | enum: `180x180`, `1024x1024`, `unknown` | Actual content detail |
| `fileSize` | number | ✅ | > 0 (bytes) | Icon file size |
| `optimizable` | boolean | ✅ | - | Can be optimized? |
| `recommendation` | string | ❌ | - | What to do |

**Relationships**:
- Created by **analyzeIOSIcons()** parser enhancement
- Referenced in **AffectedItem.metadata** for icon insights
- Requires Info.plist parsing to distinguish primary vs alternate icons

**Validation Rules**:
- `iconType = 'primary'` if icon is referenced in Info.plist `CFBundleIcons` → `CFBundlePrimaryIcon`
- `iconType = 'alternate'` if in `CFBundleAlternateIcons`
- `optimizable = true` if `iconType === 'alternate' AND detailLevel === '1024x1024'`
- `recommendation` = "Downscale to 180x180, then upscale to 1024x1024" if optimizable

**Example**:
```javascript
{
  filePath: 'AppIcon-Alternate.png',
  iconType: 'alternate',
  resolution: { width: 1024, height: 1024 },
  detailLevel: '1024x1024', // Detected via image analysis
  fileSize: 342015,
  optimizable: true,
  recommendation: 'Downscale to 180×180 (only detail level shown to users), then upscale back to 1024×1024 to reduce file size by ~60%'
}
```

---

### 9. LocalizationFileMetadata (iOS-specific)

**Purpose**: Stores .strings file metadata for localization minification insights

**Properties**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `filePath` | string | ✅ | *.lproj/*.strings | Localization file path |
| `language` | string | ✅ | ISO 639-1 code (e.g., 'en', 'fr') | Language code |
| `format` | string | ✅ | enum: `binary-plist`, `utf8-text` | File format detected |
| `fileSize` | number | ✅ | > 0 (bytes) | File size |
| `commentBytes` | number | ❌ | ≥ 0 (bytes), text format only | Bytes consumed by comments |
| `stringCount` | number | ❌ | ≥ 0, if parseable | Number of localized strings |
| `potentialSavings` | number | ✅ | ≥ 0 (bytes) | Estimated savings |

**Relationships**:
- Created by **analyzeLocalizationFiles()** parser enhancement
- Referenced in **AffectedItem.metadata** for localization insights
- Requires plist-parser.js enhancement to detect binary format

**Validation Rules**:
- `format = 'binary-plist'` if file starts with `bplist00` magic bytes
- `format = 'utf8-text'` if plaintext .strings file
- `commentBytes` only applicable for `utf8-text` format (count bytes of `/* ... */` comments)
- `potentialSavings`:
  - Binary format: Estimate 5-20% savings by converting to UTF-8
  - Text with comments: `commentBytes`
  - Combined: `max(binaryOverhead, commentBytes)`

**Example**:
```javascript
{
  filePath: 'en.lproj/Localizable.strings',
  language: 'en',
  format: 'binary-plist',
  fileSize: 45231,
  commentBytes: null, // Not applicable for binary
  stringCount: 342,
  potentialSavings: 9046 // Estimate 20% by converting to UTF-8
}
```

---

### 10. AnalysisContext (Enhanced)

**Purpose**: Extended context object passed to insight rules

**Existing Properties** (from current codebase):
- `platform`: string (iOS, Android)
- `allFiles`: FileEntry[] (all files in bundle)
- `totalInstallSize`: number (total app size in bytes)
- `buildType`: string (debug, release, unknown)
- `metadata`: object (app metadata from parser)

**New Properties** (for insights feature):
| Field | Type | Description |
|-------|------|-------------|
| `imageFiles` | ImageFile[] | All image files (.png, .jpg, .webp) extracted |
| `fontFiles` | FontFile[] | All font files (.ttf, .otf, .woff) extracted |
| `plistData` | object | Parsed Info.plist data (iOS only) |
| `manifestData` | object | Parsed AndroidManifest.xml data (Android only) |
| `compressionCache` | Map<string, ImageCompressionResult> | Cache compression results by file hash |
| `duplicateGroups` | Map<string, DuplicateGroup> | Duplicate groups by hash |

**Validation Rules**:
- `imageFiles` populated by filtering `allFiles` for image extensions
- `fontFiles` populated by filtering `allFiles` for font extensions
- `compressionCache` persists across insight executions (avoid re-testing same image)
- `duplicateGroups` computed once by insight engine before rule execution

---

## Data Flow

### 1. Analysis Workflow

```
1. User uploads IPA/APK/AAB
   ↓
2. Parser extracts files → creates AnalysisContext
   ↓
3. Insight engine runs all applicable InsightRule.execute(context)
   ↓
4. Each rule returns InsightResult[] with AffectedItem[]
   ↓
5. Results aggregated, sorted by severity, displayed in UI
   ↓
6. User clicks insight → views details, fix suggestions, previews
```

### 2. Image Compression Testing Flow

```
1. Image optimization rule identifies PNG/JPEG files >4KB
   ↓
2. Check compressionCache for existing results (by file hash)
   ↓
3. If not cached:
   a. Send image to compression-worker.js via Comlink
   b. Worker tests JPEG 85% + WebP 85% (if supported)
   c. Worker returns ImageCompressionResult
   d. Cache result in context.compressionCache
   ↓
4. Rule creates AffectedItem with compression metadata
   ↓
5. UI displays side-by-side preview using previewUrls
```

### 3. Duplicate Detection Flow

```
1. Insight engine calls findDuplicatesByHash(context)
   ↓
2. file-hasher.js computes SHA-256 for all files
   ↓
3. Group files by hash → identify duplicates
   ↓
4. For each duplicate group:
   a. Calculate potentialSavings = (n-1) × fileSize
   b. Apply platform threshold (Android: 512 bytes minimum)
   c. Create DuplicateGroup if passes threshold
   ↓
5. Duplicate detection rule creates InsightResult for each group
```

---

## State Transitions

### InsightResult Lifecycle

```
PENDING → PROCESSING → READY → DISPLAYED → DISMISSED
```

- **PENDING**: Rule identified potential insight, waiting for heavy operation (compression testing)
- **PROCESSING**: Web Worker actively testing compression/parsing (show progress)
- **READY**: All data collected, insight ready to display
- **DISPLAYED**: Insight shown to user in UI
- **DISMISSED**: User dismissed insight (hidden but not deleted)

### ImageCompressionResult Caching

```
NOT_CACHED → TESTING → CACHED → EVICTED
```

- **NOT_CACHED**: Image not yet tested
- **TESTING**: Compression worker actively testing
- **CACHED**: Result stored in context.compressionCache
- **EVICTED**: Cache cleared (on new file upload or memory pressure)

---

## Validation Rules Summary

### Cross-Entity Validation

1. **InsightResult.potentialSavings consistency**:
   - Must equal sum of all AffectedItem savings
   - Must exceed rule-defined minimum threshold

2. **AffectedItem.path integrity**:
   - Must exist in AnalysisContext.allFiles
   - File size must match context data

3. **DuplicateGroup hash verification**:
   - All files in `paths` must have identical hash
   - Hash must be SHA-256 (64 hex characters)

4. **Platform-specific thresholds**:
   - Android duplicates: potentialSavings ≥ 512 bytes
   - iOS duplicates: No minimum
   - Image optimization: savings ≥ 4096 bytes (4KB)

5. **Compression cache coherence**:
   - Cache key = file hash (not path, to handle duplicates)
   - Evict cache on context.totalInstallSize change (new file uploaded)

---

## Indexing Strategy

### Performance Optimizations

1. **File hash index** (for duplicate detection):
   ```javascript
   Map<hash: string, paths: string[]>
   ```

2. **Compression cache** (for image re-testing):
   ```javascript
   Map<fileHash: string, ImageCompressionResult>
   ```

3. **Image file index** (for quick filtering):
   ```javascript
   const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.heic'];
   context.imageFiles = allFiles.filter(f => imageExtensions.includes(path.extname(f.path).toLowerCase()));
   ```

4. **Font file index** (for font insights):
   ```javascript
   const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
   context.fontFiles = allFiles.filter(f => fontExtensions.includes(path.extname(f.path).toLowerCase()));
   ```

---

## Future Extensibility

### Planned Entities (Not in Scope for 011)

1. **ProGuardConfig** (Android optimization detection):
   - Parse build artifacts to detect ProGuard/R8 status
   - Requires build.gradle parsing (not in APK)

2. **FrameworkDuplication** (iOS framework analysis):
   - Detect same framework in app + extensions
   - Requires Mach-O binary parsing enhancement

3. **VideoMetadata** (video optimization):
   - Codec detection, resolution, bitrate analysis
   - Requires video file header parsing

These entities are defined in spec.md (P3 insights) but not implemented in initial release.

---

## Summary

**Core Entities**: 10 defined (InsightRule, InsightResult, AffectedItem, ImageCompressionResult, CompressedFormat, DuplicateGroup, FontAnalysisResult, IconMetadata, LocalizationFileMetadata, AnalysisContext)

**Validation Rules**: Platform-specific thresholds, hash integrity, cache coherence, minimum savings thresholds

**Performance**: Indexed by hash, cached compression results, lazy loading of heavy operations

**Extensibility**: Designed for future P3 insights (framework duplication, video optimization, ProGuard detection)
