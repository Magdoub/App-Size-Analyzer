# Feature Specification: AAB and Framework File Support

**Feature Branch**: `012-aab-framework-support`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "I want to support .aab and .framework"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Analyze Android App Bundle (Priority: P1)

A mobile developer wants to analyze the size composition of their Android App Bundle (.aab) file to understand which components contribute most to the final app size before publishing to Google Play.

**Why this priority**: Android App Bundles are Google's required format for new Play Store submissions since 2021. Supporting this format is essential for Android developers who need to analyze their app bundle composition.

**Independent Test**: Can be fully tested by uploading a .aab file and viewing the size breakdown, delivering value to Android developers analyzing their app bundle composition.

**Acceptance Scenarios**:

1. **Given** I have an Android App Bundle file, **When** I drop it into the analyzer, **Then** the system displays a size breakdown showing all components within the bundle
2. **Given** I have uploaded an AAB file, **When** I view the analysis results, **Then** I can see the DEX files, resources, native libraries, and assets with their individual sizes
3. **Given** I have an AAB file with multiple modules, **When** I analyze it, **Then** each module's contents are displayed in the breakdown

---

### User Story 2 - Analyze iOS Framework Bundle (Priority: P2)

An iOS developer wants to analyze the size of a framework bundle (.framework) to understand the size impact of including it in their app, helping them make decisions about dependencies and optimization.

**Why this priority**: Frameworks are common dependencies in iOS development. Understanding their size composition helps developers make informed decisions about third-party dependencies and their own framework modules.

**Independent Test**: Can be fully tested by uploading a .framework bundle and viewing the size breakdown, delivering value to iOS developers analyzing framework sizes.

**Acceptance Scenarios**:

1. **Given** I have an iOS framework bundle, **When** I drop it into the analyzer, **Then** the system displays a size breakdown of all components within the framework
2. **Given** I have uploaded a .framework file, **When** I view the analysis results, **Then** I can see the binary, headers, resources, and modules with their individual sizes
3. **Given** I have a universal framework with multiple architectures, **When** I analyze it, **Then** I can see the size breakdown per architecture (arm64, x86_64, etc.)

---

### User Story 3 - Consistent Experience Across Formats (Priority: P3)

A developer working on both iOS and Android platforms wants a consistent analysis experience regardless of the file format they upload, allowing them to easily compare and understand size compositions across platforms.

**Why this priority**: Users expect a unified experience when analyzing different file types. Consistency reduces the learning curve and allows meaningful comparisons.

**Independent Test**: Can be fully tested by uploading different file formats (.ipa, .apk, .aab, .framework) and verifying the UI presents consistent visualization and interaction patterns.

**Acceptance Scenarios**:

1. **Given** I have uploaded either an AAB or framework file, **When** I view the results, **Then** the visualization style matches the existing IPA/APK analysis views
2. **Given** I have analyzed multiple file formats in a session, **When** I switch between results, **Then** the navigation and interaction patterns are consistent

---

### Edge Cases

- What happens when a .aab file is corrupted or incomplete?
- How does the system handle .framework bundles that contain only headers (no binary)?
- What happens when a universal framework contains unsupported architectures?
- How does the system handle AAB files without a base module?
- What happens when a .framework is inside a .xcframework container?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST recognize and accept .aab files as valid input
- **FR-002**: System MUST recognize and accept .framework bundles as valid input
- **FR-003**: System MUST parse AAB internal structure and extract file size information for all contained files
- **FR-004**: System MUST parse framework bundle structure and extract file size information for all contained files
- **FR-005**: System MUST display the file type indicator showing "AAB" or "Framework" after successful upload
- **FR-006**: System MUST extract and display metadata from AAB files (package name, version code, version name)
- **FR-007**: System MUST extract and display metadata from frameworks (bundle identifier, version, supported architectures)
- **FR-008**: System MUST provide size breakdown visualization for AAB files matching existing IPA/APK visual patterns
- **FR-009**: System MUST provide size breakdown visualization for framework files matching existing visual patterns
- **FR-010**: System MUST categorize AAB contents into logical groups (DEX, resources, native libs, assets, config)
- **FR-011**: System MUST categorize framework contents into logical groups (binary, headers, resources, modules, info)
- **FR-012**: System MUST display user-friendly error messages when uploaded files are corrupted or invalid
- **FR-013**: System MUST handle frameworks with multiple architecture slices and show per-architecture sizes

### Key Entities

- **AAB File**: Android App Bundle container with base module and optional feature modules, containing DEX bytecode, resources, native libraries, and assets
- **Framework Bundle**: iOS/macOS framework directory structure containing compiled binary, public headers, resources, and module information
- **Architecture Slice**: A specific CPU architecture compilation within a universal binary (e.g., arm64, x86_64)
- **Module**: For AAB, a distinct feature module; for frameworks, the module map and interface information

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can analyze AAB files within the same time frame as existing APK analysis (under 5 seconds for files up to 200MB)
- **SC-002**: Users can analyze framework bundles within the same time frame as existing IPA analysis (under 5 seconds for bundles up to 100MB)
- **SC-003**: 100% of valid AAB files produce accurate size breakdowns matching manual inspection
- **SC-004**: 100% of valid framework bundles produce accurate size breakdowns matching manual inspection
- **SC-005**: The analyzer correctly identifies and categorizes all standard AAB component types (DEX, resources, assets, libs, config)
- **SC-006**: The analyzer correctly identifies and categorizes all standard framework component types (binary, headers, resources, modules)
- **SC-007**: Error rate for unsupported or corrupted files results in clear error messaging (not crashes) 100% of the time
- **SC-008**: Users report the new format support integrates seamlessly with existing analysis workflow (no UX complaints about inconsistency)

## Assumptions

- AAB files follow Google's Android App Bundle format specification
- Framework bundles follow Apple's standard .framework directory structure
- The existing parsing infrastructure (fflate for ZIP) can handle AAB files since they are ZIP-based
- Framework bundles will be uploaded as ZIP archives (since .framework is a directory)
- Performance targets are based on typical file sizes for these formats
- The existing visualization components (treemap, file list) can be reused for new formats
