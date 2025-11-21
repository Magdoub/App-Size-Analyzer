# Feature Specification: Comprehensive Insights Improvement

**Feature Branch**: `011-insights-improvement`
**Created**: 2025-11-20
**Status**: Draft
**Input**: User description: "Comprehensive Insights Improvement - Match and Exceed Emerge Tools Capabilities"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accurate Image Optimization with Real Testing (Priority: P1)

Developers upload IPA/APK files containing images and receive precise optimization recommendations based on actual compression testing, not estimates.

**Why this priority**: Images are typically the largest contributor to app size (30-50% of total). Accurate testing provides developers with confidence in the savings estimates and enables them to make data-driven decisions. This is the foundation of a credible insights tool.

**Independent Test**: Can be fully tested by uploading an app with PNG/JPEG images and verifying that the tool performs actual compression tests (85% lossy, HEIC for iOS, WebP for Android) and shows side-by-side comparisons with exact byte savings.

**Acceptance Scenarios**:

1. **Given** an iOS app with PNG images >4KB potential savings, **When** analysis completes, **Then** the tool shows actual 85% lossy compression results and HEIC conversion results, displaying the larger savings option
2. **Given** an Android app with PNG/JPEG images, **When** analysis completes, **Then** the tool shows lossless WebP conversion results with exact byte savings
3. **Given** an app with images <4KB potential savings, **When** analysis completes, **Then** no optimization insight is triggered (minimum threshold)
4. **Given** optimizable images are found, **When** viewing the insight, **Then** side-by-side before/after previews are displayed

---

### User Story 2 - Critical Security Vulnerability Detection (Priority: P1)

Developers uploading Android apps receive immediate HIGH severity warnings about exposed Firebase API keys that could leak sensitive remote config data, feature flags, and secrets.

**Why this priority**: Security vulnerabilities can lead to data breaches, compliance violations, and loss of user trust. Firebase API exposure is a common, easily exploitable vulnerability that many developers are unaware of.

**Independent Test**: Can be fully tested by uploading an Android APK containing google-services.json and verifying that a HIGH severity security warning is displayed with the exact exploit method and fix instructions.

**Acceptance Scenarios**:

1. **Given** an Android app with google-services.json, **When** analysis completes, **Then** a HIGH severity security insight explains the Firebase API exposure vulnerability
2. **Given** the Firebase security insight is displayed, **When** viewing fix instructions, **Then** the tool shows the exact exploit method (APK Analyzer → strings → curl command) and why it's dangerous
3. **Given** the Firebase security insight is displayed, **When** viewing fix instructions, **Then** the tool provides Application Restrictions configuration with all 4 keystore types (debug, upload, Google Play, Firebase App Distribution)

---

### User Story 3 - Precise Duplicate File Detection (Priority: P1)

Developers receive actionable insights about duplicate files with platform-specific thresholds, avoiding false positives from tiny duplicates.

**Why this priority**: Duplicates are low-hanging fruit for size reduction and easy to fix. However, flagging insignificant duplicates (<512 bytes) creates noise and reduces trust in the tool.

**Independent Test**: Can be fully tested by uploading an app with various duplicate files (some >512 bytes, some <512 bytes) and verifying that only Android duplicates saving >512 bytes are flagged.

**Acceptance Scenarios**:

1. **Given** an Android app with duplicate files saving >512 bytes, **When** analysis completes, **Then** the insight shows the duplicates with exact savings
2. **Given** an Android app with duplicate files saving <512 bytes, **When** analysis completes, **Then** no duplicate insight is triggered for those files
3. **Given** an iOS app with any duplicate files, **When** analysis completes, **Then** all duplicates are shown (no minimum threshold for iOS)
4. **Given** duplicate files are detected, **When** viewing the insight, **Then** the tool shows which files are duplicates and where they are located

---

### User Story 4 - iOS Alternate Icon Optimization (Priority: P1)

Developers uploading iOS apps with alternate icons receive specific guidance on reducing icon file sizes by downscaling to 180x180 resolution before upscaling to 1024x1024.

**Why this priority**: Alternate icons are often unnecessarily large (full resolution) when only 180x180 detail is needed for display. This is a unique insight not widely known.

**Independent Test**: Can be fully tested by uploading an iOS app with alternate icons and verifying that the tool detects icons with >180x180 resolution detail and provides the downscale → upscale workflow recommendation.

**Acceptance Scenarios**:

1. **Given** an iOS app with alternate icons at full 1024x1024 resolution, **When** analysis completes, **Then** the tool identifies which icons are alternates vs primary
2. **Given** alternate icons are detected, **When** viewing the insight, **Then** the tool analyzes the actual image detail level (not just file size)
3. **Given** alternate icons have >180x180 detail, **When** viewing the insight, **Then** the tool recommends downscale to 180x180, then upscale to 1024x1024 workflow
4. **Given** the primary app icon is detected, **When** viewing results, **Then** the tool confirms it should remain at 1024x1024 for App Store display
5. **Given** optimizable alternate icons are found, **When** viewing the insight, **Then** the tool shows an automatic optimization preview

---

### User Story 5 - iOS Localization String Minification (Priority: P2)

Developers uploading iOS apps with localized strings receive insights about binary plist format inefficiencies and translator comment bloat, with automated scripts to fix.

**Why this priority**: Localization files can be 5-20% smaller with proper formatting. This is often overlooked because the problem is non-obvious.

**Independent Test**: Can be fully tested by uploading an iOS app with .strings files and verifying that the tool detects binary format and/or comments, calculates savings, and provides the Python script and Xcode setting.

**Acceptance Scenarios**:

1. **Given** an iOS app with binary plist .strings files, **When** analysis completes, **Then** the tool flags the format issue and recommends UTF-8 text format (STRINGS_FILE_OUTPUT_ENCODING)
2. **Given** an iOS app with .strings files containing translator comments, **When** analysis completes, **Then** the tool calculates bytes consumed by comments
3. **Given** localization minification opportunities exist, **When** viewing the insight, **Then** the tool provides the exact Python script from Emerge docs to auto-remove comments
4. **Given** localization minification opportunities exist, **When** viewing the insight, **Then** the tool mentions the SmallStrings library option for 90%+ reduction

---

### User Story 6 - iOS Unnecessary File Detection (Priority: P2)

Developers uploading iOS apps receive warnings about accidentally included files (README, scripts, provisioning profiles, build configs) that don't belong in the production bundle.

**Why this priority**: These files are easy to remove and represent "free" size savings. They also represent sloppy build configuration that could indicate other issues.

**Independent Test**: Can be fully tested by uploading an iOS app with unnecessary files and verifying that each type is detected with specific fix instructions (uncheck target membership).

**Acceptance Scenarios**:

1. **Given** an iOS app with documentation files (README, AUTHORS, CHANGELOG, LICENSE), **When** analysis completes, **Then** the tool flags these for removal
2. **Given** an iOS app with shell scripts (.sh, .bash, .py), **When** analysis completes, **Then** the tool flags these for removal
3. **Given** an iOS app with provisioning profiles (.mobileprovision), **When** analysis completes, **Then** the tool flags these for removal
4. **Given** an iOS app with build configs (xcconfig, bazel, BUILD files), **When** analysis completes, **Then** the tool flags these for removal
5. **Given** an iOS app with Swift modules (.swiftmodule) or symbol maps (.bcsymbolmap), **When** analysis completes, **Then** the tool flags these for removal
6. **Given** an iOS app with headers (.pch, Headers/ directories), **When** analysis completes, **Then** the tool flags these for removal
7. **Given** unnecessary files are detected, **When** viewing the insight, **Then** the tool recommends unchecking target membership in Xcode

---

### User Story 7 - Enhanced Binary Symbol Stripping Guidance (Priority: P2)

Developers uploading iOS apps with debug symbols receive comprehensive guidance including the exact strip command, complete build phase script, and dSYM upload warnings.

**Why this priority**: Symbol stripping can save significant space (10-30% in some cases) but is risky without proper guidance. Developers need exact, tested scripts to avoid breaking crash reporting.

**Independent Test**: Can be fully tested by uploading an iOS app with symbols and verifying that the insight provides the exact strip command, full build script, flag explanations, and crash reporting warnings.

**Acceptance Scenarios**:

1. **Given** an iOS app with debug symbols, **When** analysis completes, **Then** the tool provides the exact strip command: `strip -rSTx AppBinary -o AppBinaryStripped`
2. **Given** the strip symbols insight is displayed, **When** viewing fix instructions, **Then** the tool shows the complete 35+ line build phase script from Emerge docs
3. **Given** the strip symbols insight is displayed, **When** viewing fix instructions, **Then** the tool explains flag meanings (T=Swift symbols, rSx=debug/local)
4. **Given** the strip symbols insight is displayed, **When** viewing fix instructions, **Then** the tool includes Input File configuration for dSYM dependency
5. **Given** the strip symbols insight is displayed, **When** viewing fix instructions, **Then** the tool warns about crash reporting requirements (must upload dSYMs) and checks for Apple-signed frameworks

---

### User Story 8 - Unused Font Detection (Priority: P3)

Developers uploading apps with font files receive insights about fonts that aren't referenced in Info.plist or asset catalogs, and fonts with excessive character sets.

**Why this priority**: Fonts can be 2-10MB each, making them high-impact when unused. However, font usage detection requires deeper analysis, making it lower priority than obvious wins.

**Independent Test**: Can be fully tested by uploading an app with font files (.ttf, .otf) and verifying that the tool cross-references with Info.plist UIAppFonts and asset catalog references.

**Acceptance Scenarios**:

1. **Given** an app with font files in the bundle, **When** analysis completes, **Then** the tool cross-references fonts with Info.plist UIAppFonts entries
2. **Given** font files exist but aren't referenced, **When** analysis completes, **Then** the tool flags them as unused
3. **Given** font files with CJK character sets exist, **When** analysis completes and app only uses Latin characters, **Then** the tool flags excessive character sets
4. **Given** unused fonts are detected, **When** viewing the insight, **Then** the tool calculates exact savings from removing each font

---

### User Story 9 - Video and Animation Optimization (Priority: P3)

Developers uploading apps with video files or animations receive recommendations about compression, codec efficiency, and converting GIFs to video format.

**Why this priority**: Videos are often the largest single files but are less common than images. When present, they offer huge savings (GIF → video = 90% reduction).

**Independent Test**: Can be fully tested by uploading an app with video files (.mov, .mp4) or GIF animations and verifying that codec efficiency and conversion recommendations are provided.

**Acceptance Scenarios**:

1. **Given** an app with large video files, **When** analysis completes, **Then** the tool checks video codec efficiency (H.265 vs H.264)
2. **Given** an app with Lottie JSON files, **When** analysis completes, **Then** the tool checks if they could be minified
3. **Given** an app with GIF animations, **When** analysis completes, **Then** the tool recommends converting to video format with 90% size reduction estimate
4. **Given** video optimization opportunities exist, **When** viewing the insight, **Then** the tool provides specific compression settings and tools

---

### User Story 10 - Framework Duplication Detection (Priority: P3)

Developers uploading apps with extensions or modules receive insights about framework duplication across app and extensions, duplicate Swift runtime, and multiple library versions.

**Why this priority**: Framework duplication is common in complex apps with extensions (5-20% savings possible) but requires sophisticated analysis and more complex fixes.

**Independent Test**: Can be fully tested by uploading an app with extensions and verifying that the tool detects shared frameworks in both app and extension bundles.

**Acceptance Scenarios**:

1. **Given** an app with app extensions, **When** analysis completes, **Then** the tool checks for same framework included in app + extensions
2. **Given** multiple frameworks exist, **When** analysis completes, **Then** the tool checks for duplicate Swift runtime across frameworks
3. **Given** multiple versions of the same library exist, **When** analysis completes, **Then** the tool flags version duplication
4. **Given** framework duplication is detected, **When** viewing the insight, **Then** the tool calculates exact duplication bytes and recommends extracting to shared framework

---

### User Story 11 - Advanced Android Optimizations (Priority: P3)

Developers uploading Android apps receive insights about ProGuard/R8 configuration, resource shrinking opportunities, and build optimization settings.

**Why this priority**: ProGuard/R8 can reduce app size by 30-50% but requires knowledge of Gradle configuration. This is powerful but targets more advanced developers.

**Independent Test**: Can be fully tested by uploading an Android APK and verifying that the tool detects ProGuard/R8 status, optimization level, and provides specific Gradle configuration recommendations.

**Acceptance Scenarios**:

1. **Given** an Android app without ProGuard/R8 enabled, **When** analysis completes, **Then** the tool flags this as HIGH severity with 30-50% potential savings
2. **Given** an Android app with ProGuard/R8 enabled, **When** analysis completes, **Then** the tool checks the optimization level
3. **Given** suboptimal ProGuard/R8 settings, **When** viewing the insight, **Then** the tool recommends aggressive shrinking settings and resource shrinking
4. **Given** optimization opportunities exist, **When** viewing the insight, **Then** the tool provides specific Gradle build.gradle code snippets

---

### Edge Cases

- What happens when an app has no optimizable images (all already compressed)?
- How does the system handle extremely large apps (>1GB) that may timeout during compression testing?
- What happens when image format conversion fails (corrupted files, unsupported formats)?
- How does the system handle apps with encrypted or obfuscated contents?
- What happens when Firebase is detected but the API is already properly restricted?
- How does the system handle apps with custom icon sizes not matching standard resolutions?
- What happens when localization files are malformed or use non-standard formats?
- How does the system handle apps with mixed file formats (ZIP, IPA, APK, AAB)?
- What happens when font files are referenced dynamically at runtime (not in Info.plist)?
- How does the system handle progressive web apps or hybrid apps with non-standard structures?

## Requirements *(mandatory)*

### Functional Requirements

#### Image Optimization (P1)

- **FR-001**: System MUST perform actual 85% lossy compression testing on images, not estimation
- **FR-002**: System MUST test HEIC conversion for iOS apps targeting iOS 12 or later
- **FR-003**: System MUST test lossless WebP conversion for Android apps
- **FR-004**: System MUST compare all compression methods and display the larger savings
- **FR-005**: System MUST only flag images where optimization saves >4KB (4096 bytes)
- **FR-006**: System MUST display side-by-side before/after image previews
- **FR-007**: System MUST calculate compression in the browser without server uploads

#### Firebase Security (P1)

- **FR-008**: System MUST flag Firebase API exposure as HIGH severity security issue
- **FR-009**: System MUST detect google-services.json in Android APK/AAB files
- **FR-010**: System MUST explain the exact exploit method (APK Analyzer → extract strings → curl command)
- **FR-011**: System MUST explain dangers (exposed remote config, feature flags, secrets)
- **FR-012**: System MUST provide Application Restrictions fix with all 4 keystore types (debug, upload, Google Play, Firebase App Distribution)

#### Duplicate Detection (P1)

- **FR-013**: System MUST apply 512-byte minimum threshold for Android duplicate detection
- **FR-014**: System MUST flag all duplicates for iOS (no minimum threshold)
- **FR-015**: System MUST use hash-based duplicate detection
- **FR-016**: System MUST calculate savings as (n-1) × file size for n duplicates

#### Icon Optimization (P1)

- **FR-017**: System MUST distinguish between primary app icon and alternate icons for iOS
- **FR-018**: System MUST analyze actual image resolution detail, not just file size
- **FR-019**: System MUST detect alternate icons with >180x180 detail level
- **FR-020**: System MUST recommend downscale to 180x180 then upscale to 1024x1024 workflow
- **FR-021**: System MUST confirm primary icon should remain 1024x1024 for App Store
- **FR-022**: System MUST provide automatic optimization preview for alternate icons

#### Localization Minification (P2)

- **FR-023**: System MUST detect binary plist format in .strings files (file starts with `bplist`)
- **FR-024**: System MUST detect and count comment bytes in text format .strings files
- **FR-025**: System MUST calculate savings from removing translator comments
- **FR-026**: System MUST provide the exact Python script from Emerge docs
- **FR-027**: System MUST recommend STRINGS_FILE_OUTPUT_ENCODING = UTF-8 Xcode setting
- **FR-028**: System MUST mention SmallStrings library option for 90%+ reduction

#### Unnecessary Files (P2)

- **FR-029**: System MUST detect documentation files (README, AUTHORS, CHANGELOG, LICENSE)
- **FR-030**: System MUST detect shell scripts (.sh, .bash, .py build scripts)
- **FR-031**: System MUST detect provisioning profiles (.mobileprovision)
- **FR-032**: System MUST detect build configs (xcconfig, bazel, BUILD files)
- **FR-033**: System MUST detect Swift modules (.swiftmodule) and symbol maps (.bcsymbolmap)
- **FR-034**: System MUST detect headers (.pch, Headers/ directories, .h in bundle)
- **FR-035**: System MUST recommend unchecking target membership in Xcode for each file type

#### Symbol Stripping Enhancement (P2)

- **FR-036**: System MUST provide exact strip command: `strip -rSTx AppBinary -o AppBinaryStripped`
- **FR-037**: System MUST provide complete 35+ line build phase script from Emerge docs
- **FR-038**: System MUST explain flag meanings (T=Swift symbols, rSx=debug/local symbols)
- **FR-039**: System MUST include Input File configuration for dSYM dependency
- **FR-040**: System MUST warn about dSYM upload requirement for crash reporting
- **FR-041**: System MUST include Apple-signed framework check logic

#### Unused Fonts (P3)

- **FR-042**: System MUST detect font files in bundle (.ttf, .otf, .woff)
- **FR-043**: System MUST cross-reference with Info.plist UIAppFonts entries
- **FR-044**: System MUST cross-reference with asset catalog font references
- **FR-045**: System MUST flag fonts not referenced anywhere
- **FR-046**: System MUST detect font files with extensive character sets (CJK) when app uses only Latin
- **FR-047**: System MUST calculate exact savings from removing each unused font

#### Video/Animation Optimization (P3)

- **FR-048**: System MUST detect video files (.mov, .mp4, .avi)
- **FR-049**: System MUST detect Lottie JSON files and check if they can be minified
- **FR-050**: System MUST detect GIF animations
- **FR-051**: System MUST check video codec efficiency (H.265 vs H.264)
- **FR-052**: System MUST recommend converting GIF → video with 90% savings estimate
- **FR-053**: System MUST provide specific compression settings and tool recommendations

#### Framework Duplication (P3)

- **FR-054**: System MUST detect same framework in app + extensions
- **FR-055**: System MUST detect duplicate Swift runtime across frameworks
- **FR-056**: System MUST detect multiple versions of same library
- **FR-057**: System MUST calculate exact duplication bytes
- **FR-058**: System MUST recommend extracting to shared framework

#### Android Optimizations (P3)

- **FR-059**: System MUST detect whether ProGuard/R8 is enabled in Android apps
- **FR-060**: System MUST detect ProGuard/R8 optimization level
- **FR-061**: System MUST recommend aggressive shrinking settings with code snippets
- **FR-062**: System MUST recommend resource shrinking with code snippets
- **FR-063**: System MUST flag disabled ProGuard/R8 as HIGH severity (30-50% potential savings)

#### General Requirements

- **FR-064**: System MUST process all files client-side in the browser (no server uploads)
- **FR-065**: System MUST show progress bars for heavy operations (compression testing, parsing)
- **FR-066**: System MUST cache results per file hash to avoid reprocessing
- **FR-067**: System MUST provide working code snippets and scripts for every fix
- **FR-068**: System MUST separate iOS-specific and Android-specific insights
- **FR-069**: System MUST display insights ordered by severity (HIGH, MEDIUM, LOW)
- **FR-070**: System MUST support IPA, APK, and AAB file formats

### Key Entities

- **Insight**: Represents a single optimization opportunity detected in an app bundle
  - Has severity (HIGH, MEDIUM, LOW)
  - Has category (security, optimization, unused, compression)
  - Has platform (iOS, Android, both)
  - Has estimated savings (bytes)
  - Has fix instructions (steps, code snippets, scripts)
  - Has detection rules (what triggers it)

- **Rule**: Represents the detection logic for an insight type
  - Has unique ID (R001-R020)
  - Has priority (P1, P2, P3)
  - Has detection function (analyzes parsed app data)
  - Has thresholds (minimum savings, file size limits)
  - Has test scenarios (given/when/then)

- **Image**: Represents an image file in the app bundle
  - Has original size
  - Has compressed size (for each tested format)
  - Has format (PNG, JPEG, WebP, HEIC)
  - Has resolution (width × height)
  - Has platform (iOS, Android)
  - Has location (path in bundle)

- **DuplicateGroup**: Represents a set of duplicate files
  - Has file count (n duplicates)
  - Has file size (bytes)
  - Has file hash (SHA-256)
  - Has locations (paths of all copies)
  - Has potential savings ((n-1) × size)

- **Icon**: Represents an app icon file in iOS bundle
  - Has type (primary, alternate)
  - Has resolution (1024x1024, 180x180, etc.)
  - Has detail level (actual content resolution)
  - Has file size
  - Has location (path in bundle)

- **LocalizationFile**: Represents a .strings file in iOS bundle
  - Has format (binary plist, text)
  - Has language code (en, fr, es, etc.)
  - Has comment bytes (byte count)
  - Has string count
  - Has file size
  - Has location (path in .lproj)

- **Font**: Represents a font file in app bundle
  - Has file name
  - Has file size
  - Has format (.ttf, .otf, .woff)
  - Has character set (Latin, CJK, etc.)
  - Has reference status (referenced in Info.plist, asset catalog, or unused)
  - Has location (path in bundle)

- **Framework**: Represents a framework in app bundle
  - Has name
  - Has size
  - Has location (app, extension, shared)
  - Has dependencies (other frameworks it uses)
  - Has duplicate status (appears in multiple locations)

- **BuildConfig**: Represents build configuration evidence in Android app
  - Has ProGuard/R8 enabled status
  - Has optimization level (none, basic, aggressive)
  - Has resource shrinking status
  - Has estimated savings potential

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95%+ of Emerge Tools documented insights are implemented with verified methodologies
- **SC-002**: Size savings estimates are within ±5% of actual savings when fixes are applied
- **SC-003**: Image optimization uses actual compression testing, not estimation, for 100% of flagged images
- **SC-004**: Firebase security warnings are displayed with HIGH severity for 100% of affected Android apps
- **SC-005**: Android duplicate detection has 0% false positives for files <512 bytes
- **SC-006**: Developers can implement any suggested fix in under 30 minutes using provided guidance
- **SC-007**: Tool provides 20+ total insights (exceeding Emerge's ~11)
- **SC-008**: All code snippets and scripts provided are copy-paste ready and work without modification
- **SC-009**: 90%+ precision (no false positives) across all insights
- **SC-010**: Sample test files trigger expected insights with 100% accuracy
- **SC-011**: All heavy operations show progress indicators and complete within 60 seconds for typical apps (<500MB)
- **SC-012**: Platform-specific insights are correctly separated (iOS vs Android) with 100% accuracy
- **SC-013**: Security issues are flagged as HIGH severity and include exploit explanation in 100% of cases
- **SC-014**: Users can understand why each insight matters (business value) without technical knowledge

### Quality Metrics

- **SC-015**: Each insight includes specific fix instructions (not generic advice)
- **SC-016**: Fix instructions include platform-specific code snippets (Xcode settings, Gradle configs, shell scripts)
- **SC-017**: Every insight shows estimated time to implement (<30 min, 30-60 min, 1-2 hours)
- **SC-018**: Side-by-side comparisons are displayed for all visual optimizations (images, icons)
- **SC-019**: Processing remains 100% client-side (no file uploads to servers)
- **SC-020**: Results are cached by file hash to avoid reprocessing (100% cache hit on re-upload)

## Dependencies *(optional)*

### External Dependencies

- **Browser APIs**: Canvas API for image compression testing, FileReader API for file parsing, Web Workers for parallel processing
- **Compression Libraries**: Browser-native canvas.toBlob() for WebP, may need WASM library for HEIC conversion
- **Parsing Libraries**: Existing app-info-parser for metadata, fflate for ZIP parsing
- **Font Libraries**: Need library to parse font files for glyph tables and character sets (e.g., opentype.js or fontkit)

### Internal Dependencies

- Existing parser infrastructure (src/lib/parsers/)
- Existing insight engine (src/lib/analysis/)
- Existing UI components for displaying insights

## Assumptions *(optional)*

1. **Browser Support**: Modern browsers (Chrome 90+, Safari 14+, Firefox 88+) with Canvas API and Web Workers
2. **File Size Limits**: Apps up to 1GB can be processed (larger apps may timeout on compression testing)
3. **Format Support**: Standard IPA, APK, AAB formats (no encrypted or custom-packed bundles)
4. **Compression Libraries**: Browser-native compression is sufficient (may upgrade to WASM for better quality)
5. **Font Analysis Depth**: Character set detection based on glyph table parsing (not runtime usage analysis)
6. **Framework Detection**: Name-based matching for duplicate frameworks (version numbers in filenames)
7. **ProGuard/R8 Detection**: Based on file structure heuristics (obfuscated class names, shrunk resources)
8. **Client-Side Processing**: All analysis must remain browser-based per project requirements (no server uploads)
9. **Progressive Enhancement**: Insights load incrementally (quick insights first, heavy compression testing later)
10. **Result Caching**: File hash-based caching assumes SHA-256 uniquely identifies app version

## Out of Scope *(optional)*

- **Unused Protocols (iOS)**: Requires Mach-O binary parser, low ROI, too complex
- **Compile Unit Attribution**: Build-time analysis only, not runtime IPA/APK analysis
- **Server-Side Processing**: Must remain 100% client-side per project requirements
- **Real-Time Monitoring**: This is a one-time analysis tool, not continuous monitoring
- **Automatic Fixing**: Tool provides instructions but doesn't modify uploaded files
- **Multi-App Comparison**: Analyzes one app at a time (no cross-app analytics)
- **Historical Tracking**: No persistence of previous uploads (cache is session-only)
- **Team Collaboration**: Single-user tool (no sharing or commenting features)
