# Feature Specification: App Size Analysis Tool

**Feature Branch**: `001-app-size-analyzer`
**Created**: 2025-11-07
**Status**: Draft
**Input**: User description: "APP SIZE ANALYSIS TOOL - Client-Side Binary Analysis Platform for iOS & Android providing breakdown visualization, X-Ray treemap, and rule-based optimization insights"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Binary Upload and Size Breakdown (Priority: P1)

As a mobile developer, I need to upload my app binary and see a detailed breakdown of what's consuming space, so I can understand the composition of my app before deciding where to optimize.

**Why this priority**: This is the foundational capability - without it, no analysis is possible. It delivers immediate value by showing developers exactly what's in their app and where the bytes are going.

**Independent Test**: Can be fully tested by uploading an IPA or APK file and verifying that the breakdown view displays hierarchical size information organized by modules, frameworks, assets, and localizations. Delivers value by answering "what's in my app and how big is each part?"

**Acceptance Scenarios**:

1. **Given** a developer has an IPA file on their computer, **When** they drag and drop it onto the upload zone, **Then** the system displays app metadata (name, version, bundle ID) and a hierarchical breakdown showing frameworks, assets, bundles, and localizations with exact sizes
2. **Given** a developer uploads an Android APK, **When** the parsing completes, **Then** the system shows DEX files, native libraries, resources, and modules with install vs download sizes
3. **Given** a developer views the breakdown, **When** they expand a framework or module, **Then** they see all nested components and files with individual sizes and percentage of total
4. **Given** the breakdown is displayed, **When** the developer clicks on any asset or module, **Then** they see detailed metadata including path, type, encoding, and resolution (for images)
5. **Given** a large app with 1000+ files, **When** the developer searches or filters by name or type, **Then** results appear instantly and they can sort by size, name, or type

---

### User Story 2 - Visual Size Exploration (X-Ray Treemap) (Priority: P2)

As a developer optimizing app size, I need a visual treemap that shows me at a glance which components are consuming the most space, so I can quickly identify the biggest optimization opportunities without reviewing tables.

**Why this priority**: While breakdown tables provide detailed data, visual representation enables pattern recognition and quick identification of outliers. This is the second most valuable feature after basic analysis.

**Independent Test**: Can be tested by uploading a binary and switching to the X-Ray view, verifying that the treemap accurately represents file sizes with color intensity and supports drill-down navigation. Delivers value by making large files immediately visible.

**Acceptance Scenarios**:

1. **Given** a developer has uploaded and analyzed a binary, **When** they switch to X-Ray view, **Then** they see a treemap where each rectangle represents a file or component sized proportionally to its actual bytes
2. **Given** the treemap is displayed, **When** they hover over any rectangle, **Then** they see a tooltip showing the name, exact size in MB, and percentage of total app size
3. **Given** a treemap showing the app structure, **When** they click on a framework or module rectangle, **Then** the view zooms into that subtree showing all nested components
4. **Given** the X-Ray view, **When** they use category filters (Binaries, Localizations, Fonts, Videos), **Then** only components of that type are visible in the treemap
5. **Given** the treemap with many small files, **When** they identify a large outlier, **Then** the color intensity clearly indicates it's significantly larger than surrounding files

---

### User Story 3 - Automated Optimization Insights (Priority: P3)

As a developer with limited optimization experience, I need the tool to automatically identify common issues and suggest fixes, so I don't have to manually hunt for problems or understand complex optimization techniques.

**Why this priority**: This transforms the tool from a reporting utility into an actionable advisor. While developers can manually identify issues using P1 and P2 features, automated insights save time and catch issues they might miss.

**Independent Test**: Can be tested by uploading a binary known to have common issues (duplicates, unoptimized images, debug symbols) and verifying that the Insights view displays specific recommendations with estimated savings. Delivers value by providing a prioritized action list.

**Acceptance Scenarios**:

1. **Given** a developer has uploaded a binary with duplicate files, **When** they view the Insights dashboard, **Then** they see a critical severity insight listing each duplicate with paths and potential savings
2. **Given** an iOS app with @2x/@3x images outside asset catalogs, **When** the analysis completes, **Then** the system suggests moving them to asset catalogs with estimated 15% savings
3. **Given** an app with unoptimized PNG images, **When** insights are generated, **Then** the system recommends converting to WebP with specific file paths and estimated savings per image
4. **Given** a production build containing debug symbols, **When** the developer reviews insights, **Then** they see a high-severity warning about symbol stripping with exact byte savings
5. **Given** insights from all categories (duplicates, optimization, unused, compression), **When** the developer filters by severity, **Then** they see critical issues first and can expand each insight to view affected files and fix suggestions

---

### User Story 4 - Export and Share Analysis (Priority: P3)

As a developer working in a team, I need to export my analysis results to share with colleagues or track changes over time, so optimization decisions can be collaborative and data-driven.

**Why this priority**: While not essential for individual analysis, export capabilities enable team workflows and historical comparison. This is lower priority than core analysis features.

**Independent Test**: Can be tested by performing an analysis and verifying that breakdown data exports to CSV/JSON with accurate data matching the UI display. Delivers value by enabling external processing and sharing.

**Acceptance Scenarios**:

1. **Given** a developer has analyzed a binary, **When** they click "Export Breakdown", **Then** they receive a CSV file with all components, paths, sizes, and types
2. **Given** the Insights view is showing recommendations, **When** they export insights, **Then** they receive a structured JSON with all rules, affected items, and savings estimates
3. **Given** the X-Ray treemap is displayed, **When** they click "Export Hierarchy", **Then** they receive a JSON representing the complete tree structure with sizes

---

### Edge Cases

- What happens when an uploaded file is corrupted or not a valid IPA/APK? System validates file format using magic bytes and shows user-friendly error message
- How does the system handle extremely large binaries (over 2GB)? System enforces configurable size limit and shows warning if file exceeds limit
- What if a binary contains non-standard or nested bundle structures? Parser uses recursive scanning and gracefully handles unexpected structures
- How does parsing perform with very large apps (10,000+ files)? System uses Web Workers for background parsing and shows progress indicator
- What if iOS Info.plist is corrupted or missing? System falls back to defaults and displays what metadata is available
- How does the system handle Android multi-DEX scenarios? Each DEX file is parsed separately and shown in breakdown
- What if a user uploads an xcarchive instead of an IPA? System detects format and navigates to the .app bundle within the archive
- How are universal binaries with multiple architectures handled? System shows architecture breakdown (arm64, x86_64) for each framework
- What happens if JavaScript is disabled in the browser? System shows message that JavaScript is required for client-side parsing
- How does the tool handle very deep directory nesting (50+ levels)? Parser recursively processes all levels and UI uses virtual scrolling for performance

## Requirements *(mandatory)*

### Functional Requirements

**Binary Upload & Validation**

- **FR-001**: System MUST accept iOS binary files in .ipa, .xcarchive (zipped), and .dSYM formats
- **FR-002**: System MUST accept Android binary files in .apk, .aab, and .apks (zipped with optional proguard mappings) formats
- **FR-003**: System MUST validate uploaded files using magic byte signatures to confirm they are ZIP-based archives
- **FR-004**: System MUST display file size and format validation status before parsing begins
- **FR-005**: System MUST show a progress indicator during binary parsing operations
- **FR-006**: System MUST enforce a configurable file size limit (default 2GB) and warn users if exceeded

**iOS Binary Parsing**

- **FR-007**: System MUST extract and parse Info.plist files (binary property list format) to retrieve app name, bundle identifier, and version
- **FR-008**: System MUST recursively scan the app bundle directory structure to catalog all files with paths and sizes
- **FR-009**: System MUST identify and categorize frameworks in the Frameworks folder, distinguishing between dynamic, static, and system frameworks
- **FR-010**: System MUST detect and parse asset catalog (.car files) to extract individual assets
- **FR-011**: System MUST identify localization folders (*.lproj) and extract language-specific resources
- **FR-012**: System MUST parse Mach-O executable headers to extract architecture information (arm64, x86_64, etc.) and detect debug symbols
- **FR-013**: System MUST calculate both uncompressed (install) and estimated compressed (download) sizes for the entire app
- **FR-014**: System MUST categorize files by type based on extension and path (images, videos, fonts, data, localizations, bundles, executables)

**Android Binary Parsing**

- **FR-015**: System MUST parse AndroidManifest.xml (binary XML format) to extract app name, package name, version code, and version name
- **FR-016**: System MUST parse resources.arsc (resource table) to extract resource entries with types and densities
- **FR-017**: System MUST parse classes.dex files to extract method count, string pool size, and total DEX size
- **FR-018**: System MUST identify and categorize native libraries in lib/ folders by architecture (armeabi-v7a, arm64-v8a, x86, x86_64)
- **FR-019**: System MUST parse optional proguard mapping.txt files to map obfuscated class and method names to originals
- **FR-020**: System MUST recursively catalog all APK files with sizes and compression information
- **FR-021**: System MUST distinguish between base modules, dynamic feature modules, and asset packs in AAB files

**Breakdown View**

- **FR-022**: System MUST display app metadata in a header section showing name, version, bundle/package ID, install size, and download size
- **FR-023**: System MUST provide tabbed interface for viewing Modules/Frameworks, Assets, and Localizations separately
- **FR-024**: System MUST display hierarchical data in expandable/collapsible tree tables showing parent-child relationships
- **FR-025**: System MUST show both absolute sizes (MB/KB) and relative percentages for each component
- **FR-026**: System MUST provide real-time search and filter capabilities by name, type, and size threshold
- **FR-027**: System MUST support sorting by size (ascending/descending), name, and type
- **FR-028**: System MUST use virtual scrolling for tables with more than 1000 rows to maintain performance
- **FR-029**: System MUST allow users to export breakdown data to CSV and JSON formats

**X-Ray Treemap Visualization**

- **FR-030**: System MUST generate treemap visualizations where each rectangle's size is proportional to the actual file or component size
- **FR-031**: System MUST use color intensity heatmaps to indicate size distribution (smallest to largest)
- **FR-032**: System MUST display tooltips on hover showing name, exact size in MB, and percentage of total
- **FR-033**: System MUST support drill-down navigation by clicking rectangles to zoom into subtrees
- **FR-034**: System MUST provide category filters to toggle visibility by content type (Binaries, Localizations, Fonts, Asset Catalogs, Videos, CoreML Models)
- **FR-035**: System MUST include a search bar in X-Ray view to highlight matching files in the treemap
- **FR-036**: System MUST provide an export option for treemap hierarchy as JSON

**Insights Engine**

- **FR-037**: System MUST implement a rule engine that executes analysis rules against parsed binary data
- **FR-038**: System MUST detect duplicate files by content hashing and report potential savings
- **FR-039**: System MUST identify unoptimized images (PNG candidates for WebP, uncompressed JPEGs) and estimate compression savings
- **FR-040**: System MUST detect unused localization files and excessive string keys with estimated savings
- **FR-041**: System MUST identify debug symbols in production builds and calculate removal savings
- **FR-042**: System MUST detect iOS scaled images (@2x/@3x) outside asset catalogs and recommend migration
- **FR-043**: System MUST identify unused Android resources by scanning DEX files for resource references
- **FR-044**: System MUST categorize insights by severity (critical, high, medium, low)
- **FR-045**: System MUST display total potential savings across all insights in MB and percentage
- **FR-046**: System MUST provide expandable insight cards showing affected files, reasons, and fix suggestions
- **FR-047**: System MUST allow filtering insights by severity level and category

**Performance & Memory**

- **FR-048**: System MUST parse binaries using Web Workers to avoid blocking the main UI thread
- **FR-049**: System MUST process files in chunks rather than loading entire binaries into memory at once
- **FR-050**: System MUST implement lazy parsing, processing only data needed for the current view
- **FR-051**: System MUST memoize parsed data structures to avoid re-processing
- **FR-052**: System MUST clear Blob references after parsing to allow garbage collection
- **FR-053**: System MUST parse a 100MB binary in under 10 seconds on standard hardware

**Error Handling**

- **FR-054**: System MUST validate file format before parsing and display clear error messages for invalid files
- **FR-055**: System MUST handle corrupted property lists by falling back to defaults and logging the error
- **FR-056**: System MUST gracefully handle missing Info.plist by displaying available metadata
- **FR-057**: System MUST skip invalid DEX headers and continue parsing other components
- **FR-058**: System MUST provide a cancel option for long-running parsing operations
- **FR-059**: System MUST display user-friendly error states with retry options when parsing fails

### Key Entities

- **Binary File**: Represents uploaded iOS or Android app binary with metadata (name, version, platform, sizes) and references to parsed structure
- **Breakdown Node**: Hierarchical structure representing a file, directory, framework, or component with unique ID, name, path, size, type, and child nodes
- **Framework**: iOS-specific entity representing a dynamic/static/system framework with path, size, architecture list, and optional sub-frameworks
- **Asset**: Represents image, video, font, or data file with path, size, type, encoding, and optional resolution (1x/2x/3x)
- **DEX Metadata**: Android-specific entity containing method count, string pool size, and total size for each DEX file
- **Native Library**: Android-specific entity representing a compiled binary in lib/ with architecture (armeabi-v7a, arm64-v8a, x86, x86_64), path, and size
- **Localization**: Represents language-specific resource bundles with language code, size, string count, and duplication metrics
- **Insight Rule**: Defines a reusable analysis pattern with ID, category, severity, description, and execution logic
- **Insight Result**: Represents a finding from a rule execution with title, description, affected items, potential savings, and fix suggestions
- **Analysis Context**: Aggregates all parsed data for a binary including platform, size metrics, breakdown root, categorized content, file hashes, and insights

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can upload an app binary and view a complete size breakdown within 10 seconds for files up to 100MB
- **SC-002**: The breakdown view's total size calculation matches the actual binary file size within 1% accuracy
- **SC-003**: Developers can identify the top 3 largest components in their app within 2 minutes of uploading
- **SC-004**: The X-Ray treemap visually highlights components that consume more than 10% of total app size
- **SC-005**: Automated insights detect at least 6 common optimization issues across duplicate detection, image optimization, unused resources, and symbol stripping
- **SC-006**: Insights provide specific file paths and estimated byte savings for each recommendation
- **SC-007**: System successfully parses 99.9% of valid iOS IPA and Android APK files without errors
- **SC-008**: Exported CSV/JSON data matches the UI display with 100% accuracy
- **SC-009**: UI remains responsive with interactive feedback during parsing of binaries up to 2GB
- **SC-010**: Developers report saving at least 10% of app size after implementing P1 insights recommendations

## Assumptions

- Developers have modern browsers with JavaScript enabled (Chrome, Firefox, Safari, Edge)
- Uploaded binaries are built for standard iOS/Android platforms (not jailbroken or custom ROMs)
- Web Workers and File API are available in the target browser environment
- Developers have access to their app binaries as files on their local filesystem
- Asset optimization assumes lossless or near-lossless compression is acceptable
- Debug symbols detection assumes standard Apple/Google build toolchain conventions
- Duplicate file detection uses content hashing (no detection of similar-but-not-identical files)
- Unused resource detection for Android is heuristic-based and may have false positives
- Proguard mapping analysis assumes standard mapping.txt format
- Client-side parsing implies no server-side storage or user accounts (privacy-focused approach)
