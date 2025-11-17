# Feature Specification: Summary Page with Size Distribution Graphs

**Feature Branch**: `010-summary-page-graphs`
**Created**: 2025-11-12
**Status**: Draft
**Input**: User description: "I want to create a new summary page with graphs that summarize the app size, including file type distribution (size and count), component type distribution (size and count), and additional analytics visualizations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View File Type Size Distribution (Priority: P1)

As an app developer, I want to see how my app's size is distributed across different file types (classes, resources, assets, native libraries) so I can identify which categories consume the most space and prioritize optimization efforts.

**Why this priority**: This is the most fundamental visualization needed. Developers immediately need to know "where is my app size coming from?" at a high level. Without this, the tool provides no actionable insights.

**Independent Test**: Can be fully tested by uploading a binary file and viewing the summary page. Delivers immediate value by showing which file categories (e.g., images, frameworks, DEX files) take up the most space, with both size (MB/KB) and percentage breakdowns.

**Acceptance Scenarios**:

1. **Given** an iOS app has been analyzed, **When** user views the summary page, **Then** they see a bar chart showing file type distribution with categories: Frameworks, Bundles, Executables, Resources, Assets, Localizations, Other
2. **Given** an Android app has been analyzed, **When** user views the summary page, **Then** they see a bar chart showing file type distribution with categories: DEX Files, Native Libraries, Resources, Assets, Localizations, Other
3. **Given** the file type distribution chart is displayed, **When** user reads the chart, **Then** each bar shows both the absolute size (in appropriate units: B, KB, MB) and percentage of total app size
4. **Given** an iOS app is analyzed, **When** viewing file type distribution, **Then** the chart displays both Download Size (compressed) and Install Size (uncompressed) as separate bars or series for comparison

---

### User Story 2 - View File Count Distribution (Priority: P1)

As an app developer, I want to see how many files of each type are in my app so I can understand whether size issues come from many small files or few large files.

**Why this priority**: File count is critical for understanding optimization strategy. 1000 small images require different solutions than 10 large frameworks. This complements size distribution and is equally important for actionable insights.

**Independent Test**: Can be tested independently by uploading any app binary and viewing file counts by category. Delivers value by revealing whether bloat comes from file proliferation (many files) or individual large files.

**Acceptance Scenarios**:

1. **Given** an app has been analyzed, **When** user views the summary page, **Then** they see a bar chart showing file count distribution across the same categories as file type size distribution
2. **Given** the file count chart is displayed, **When** user compares it to the size chart, **Then** they can identify categories where many small files contribute to size vs. few large files
3. **Given** file counts are displayed, **When** viewing the chart, **Then** counts are shown as whole numbers with appropriate labels (e.g., "125 files", "3 frameworks")

---

### User Story 3 - View Component Type Distribution (Priority: P2)

As an app developer, I want to see how my app's size is distributed between internal code/resources and external dependencies (libraries, frameworks) so I can evaluate third-party dependency costs.

**Why this priority**: Understanding internal vs. external component contributions is valuable for dependency management decisions, but it's a secondary analysis after understanding basic file type distribution.

**Independent Test**: Can be tested by uploading an app with both internal and external dependencies and viewing the component breakdown. Delivers value by showing whether app bloat comes from first-party code or third-party libraries.

**Acceptance Scenarios**:

1. **Given** an iOS app with frameworks has been analyzed, **When** user views component distribution, **Then** they see charts categorizing components as Internal (app code) vs. External (system and third-party frameworks)
2. **Given** an Android app with native libraries has been analyzed, **When** user views component distribution, **Then** they see charts showing Internal (app DEX files) vs. External (native .so libraries)
3. **Given** component distribution is displayed, **When** user views both size and count charts, **Then** they can compare the number of components to their total size contribution
4. **Given** component charts are shown, **When** user views the data, **Then** both download size and install size are displayed for each component category

---

### User Story 4 - View Additional Size Analytics (Priority: P3)

As an app developer, I want to see supplementary analytics (compression efficiency, top largest files, localization impact, architecture-specific breakdowns) so I can discover specific optimization opportunities beyond high-level distributions.

**Why this priority**: These are valuable deep-dive insights but not essential for initial assessment. Users should first understand basic distributions (P1-P2) before drilling into specifics like compression ratios or per-architecture breakdowns.

**Independent Test**: Can be tested by analyzing apps with various characteristics (multiple localizations, multi-architecture binaries, compressed resources) and verifying each additional graph provides specific, actionable data.

**Acceptance Scenarios**:

1. **Given** an app with compressed resources has been analyzed, **When** user views compression efficiency chart, **Then** they see a comparison of compressed vs. uncompressed sizes by file type
2. **Given** any app has been analyzed, **When** user views top files chart, **Then** they see the 10 largest individual files with their sizes and paths
3. **Given** an iOS app with multiple @2x/@3x assets or an Android app with multiple localization folders has been analyzed, **When** user views localization impact chart, **Then** they see size contribution per language/locale
4. **Given** an Android app with multi-architecture native libraries has been analyzed, **When** user views architecture breakdown chart, **Then** they see size per architecture (arm64-v8a, armeabi-v7a, x86, x86_64)
5. **Given** any app has been analyzed, **When** user views asset type distribution, **Then** they see a breakdown of multimedia assets: Images, Videos, Audio, Fonts with their respective sizes

---

### Edge Cases

- What happens when an app has no files in a particular category (e.g., no videos, no localizations)?
  - Charts should either omit empty categories or show them with zero values and clear labeling

- How does the system handle very small files that represent <0.1% of total size?
  - Small categories should be grouped into "Other" if they fall below a minimum threshold, or shown with actual percentage (e.g., "<0.1%")

- What happens when file counts are extremely large (10,000+ files)?
  - Charts should use appropriate number formatting (e.g., "10.2K files") and maintain readability

- How are platform-specific categories handled when they don't apply?
  - iOS-specific categories (Frameworks, Bundles) should not appear on Android charts and vice versa

- What happens when both compressed and uncompressed sizes are identical?
  - Charts should still show both values but may include a note that no compression was detected

- How are unknown or uncategorized files displayed?
  - They should appear in an "Other" or "Unknown" category with clear labeling

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a dedicated Summary page accessible after app analysis completes
- **FR-002**: System MUST generate a "File Type Distribution (Size)" bar chart showing accumulated app size for each file type category
- **FR-003**: System MUST generate a "File Type Distribution (Count)" bar chart showing the number of files in each file type category
- **FR-004**: System MUST generate a "Component Type Distribution (Size)" bar chart showing accumulated app size for internal vs. external components
- **FR-005**: System MUST generate a "Component Type Distribution (Count)" bar chart showing the number of components by type
- **FR-006**: System MUST display both Download Size (compressed) and Install Size (uncompressed) for iOS apps in distribution charts
- **FR-007**: System MUST aggregate the 15 existing content types into user-friendly categories for chart display (e.g., group image, video, audio, font into "Media Assets")
- **FR-008**: System MUST categorize components as Internal or External based on path analysis and platform conventions
- **FR-009**: System MUST format size values with appropriate units (B, KB, MB, GB) and decimal precision based on magnitude
- **FR-010**: System MUST display percentages alongside absolute values in distribution charts, calculated as (category size / total size) × 100
- **FR-011**: System MUST use consistent color schemes across all charts for the same categories (e.g., Frameworks always the same color)
- **FR-012**: System MUST generate a "Compression Efficiency" chart comparing compressed vs. uncompressed sizes by file type
- **FR-013**: System MUST generate a "Top 10 Largest Files" horizontal bar chart showing individual file paths and sizes
- **FR-014**: System MUST generate a "Localization Impact" chart showing size contribution per language/locale when localizations are detected
- **FR-015**: System MUST generate an "Architecture Breakdown" chart for Android apps showing size per CPU architecture (arm64-v8a, armeabi-v7a, x86, x86_64)
- **FR-016**: System MUST generate an "Asset Type Distribution" chart showing breakdown of Images, Videos, Audio, Fonts when media assets are present
- **FR-017**: System MUST omit or clearly label categories with zero files/size rather than showing empty or misleading data
- **FR-018**: System MUST handle platform-specific categories appropriately (show iOS-specific categories only for iOS apps, Android-specific only for Android apps)
- **FR-019**: System MUST group categories representing less than 1% of total size into an "Other" category to maintain chart readability
- **FR-020**: System MUST display all charts in a responsive container that adapts to different screen sizes

### Key Entities

- **Summary Dashboard**: The container page that holds all distribution charts and analytics visualizations
- **File Type Category**: Aggregated groupings of content types (e.g., "Resources" includes all resource files, "Media Assets" includes images, videos, audio, fonts)
- **Component Category**: Classification of app components as Internal (first-party code) or External (third-party dependencies, system libraries)
- **Distribution Chart**: A visual representation showing size or count breakdown across categories with bars, percentages, and labels
- **Size Metric**: Can be either Download Size (compressed) or Install Size (uncompressed), with both tracked for iOS apps
- **Analytics Chart**: Supplementary visualizations like compression efficiency, top files, localization impact, architecture breakdown

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view file type size distribution within 1 second of analysis completion
- **SC-002**: Users can identify the top 3 size-consuming file categories within 5 seconds of viewing the summary page
- **SC-003**: Charts accurately reflect the analyzed app's composition with 100% data accuracy (all bytes accounted for, no missing categories)
- **SC-004**: Users can distinguish between compressed and uncompressed sizes for iOS apps through clear visual differentiation in charts
- **SC-005**: Users can compare size contribution vs. file count contribution for any category by viewing both distribution charts side-by-side
- **SC-006**: Charts remain readable and performant even when displaying apps with 10,000+ files
- **SC-007**: Users can identify whether app bloat comes from first-party code or third-party dependencies by viewing component distribution charts
- **SC-008**: Users can discover the single largest file in their app within 3 seconds by viewing the "Top 10 Largest Files" chart
- **SC-009**: Users can determine if localizations contribute significantly to app size (threshold: >5% of total size) by viewing the localization impact chart
- **SC-010**: Users can assess multi-architecture overhead for Android apps by comparing architecture-specific sizes in the architecture breakdown chart
- **SC-011**: 95% of users successfully interpret chart data without external help or documentation
- **SC-012**: Summary page loads and renders all charts within 2 seconds on devices with 4GB RAM and modern browsers (Chrome 100+, Safari 15+, Firefox 100+)

## Assumptions

- Users have already uploaded and analyzed a binary file before accessing the summary page
- The existing data structure (AnalysisContext, BreakdownNode, 15 ContentTypes) provides all necessary data for generating charts
- Chart rendering will use an existing visualization library compatible with Vue 3.5+ (per project constitution)
- Users prefer visual charts over tabular data for understanding size distributions
- The summary page will coexist with existing X-Ray (treemap) and Insights views, not replace them
- Color schemes will follow the existing color palette defined in the visualization module
- Charts will be static visualizations initially (no interactive filtering or drilling down - that can be a future enhancement)
- Responsive design will target desktop (1920x1080), tablet (768x1024), and mobile (375x667) viewports
- The summary page will be the default landing page after analysis completes, with navigation to other views (X-Ray, Insights) available

## Dependencies

- Existing AnalysisContext data structure with metadata, breakdownRoot, treemapData, and summary
- Existing ContentType enum with 15 file type categories
- Existing calculation utilities: calculateDistribution(), getTotalSizeByType(), getNodesByType()
- Existing color scheme module with type-based and size-based color mapping
- Vue 3.5+ component framework for rendering charts
- Chart visualization library (to be determined in planning phase based on requirements: bar charts, horizontal bar charts, stacked bars)
- Pinia state management for accessing analysis data

## Out of Scope

- Interactive chart features (click to filter, drill-down, zoom)
- Exporting charts as images or PDFs
- Comparing multiple app versions side-by-side
- Historical tracking of size changes over time
- Custom chart configuration (user-selectable colors, thresholds, groupings)
- Real-time chart updates during analysis (charts render only after analysis completes)
- Accessibility features beyond basic semantic HTML and color contrast
- Animated chart transitions
- Chart legends with interactive toggling of categories
