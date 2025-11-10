# Feature Specification: Xray Chart and Insights Enhancements

**Feature Branch**: `007-xray-insights-enhancements`
**Created**: 2025-11-10
**Status**: Draft
**Input**: User description: "For the Xray chart, I want you to show the label on it. Also they are the same colors, add color by size and color by type. By size make it like a blue gradient from dark = big, light = small. For type, it will be the same color as the types labels. Also remove any remaining tsx files, clean up after the migration. For Insights add more details about things that can improved."

## User Scenarios & Testing

### User Story 1 - Color Visualization Modes (Priority: P1)

Users can switch between two coloring modes in the Xray chart to gain different insights about their app structure: color by size shows relative file sizes through a gradient, while color by type shows file categories through type-specific colors.

**Why this priority**: This is the core enhancement requested and provides immediate visual value. Users analyzing app size need different perspectives - size-based coloring reveals bloat, while type-based coloring reveals composition patterns.

**Independent Test**: Can be fully tested by uploading an app file, viewing the Xray chart, and toggling between "Color by Size" and "Color by Type" modes. Each mode should render distinct, meaningful color schemes that aid analysis.

**Acceptance Scenarios**:

1. **Given** user has loaded an app file and is viewing the Xray chart, **When** user selects "Color by Size" mode, **Then** chart elements display a blue gradient where darker blues represent larger files and lighter blues represent smaller files
2. **Given** user has "Color by Size" mode active, **When** user switches to "Color by Type" mode, **Then** chart elements change to display colors matching their file type labels (matching the colors shown in the type legend)
3. **Given** user is viewing the chart in either color mode, **When** user hovers over any element, **Then** the color remains consistent with the selected mode and provides clear visual differentiation

---

### User Story 2 - Visible Chart Labels (Priority: P2)

Users see text labels on Xray chart elements to quickly identify files without hovering, improving chart readability and reducing cognitive load when analyzing large apps.

**Why this priority**: Labels enhance usability but are secondary to the core coloring functionality. They're valuable for quick scanning but not essential for basic chart comprehension.

**Independent Test**: Can be fully tested by loading an app file and verifying that file names appear as text labels within or near their corresponding chart rectangles, with appropriate text sizing and contrast.

**Acceptance Scenarios**:

1. **Given** user is viewing the Xray chart with any color mode, **When** chart renders, **Then** file names appear as visible text labels on chart elements where space permits
2. **Given** a chart element is too small to display its full label, **When** label doesn't fit, **Then** label is truncated with ellipsis or not shown (tooltip still available on hover)
3. **Given** user has selected a color mode, **When** labels render, **Then** text color contrasts appropriately with the background color for readability

---

### User Story 3 - Enhanced Insights Details (Priority: P3)

Users receive more detailed and actionable recommendations in the Insights section, including specific file names, size impacts, and optimization strategies beyond generic suggestions.

**Why this priority**: While valuable for optimization guidance, enhanced insights are a nice-to-have improvement over existing basic insights. Users can still analyze and optimize without detailed recommendations.

**Independent Test**: Can be fully tested by loading various app files and verifying that the Insights section displays specific, actionable recommendations with concrete data (file paths, sizes, percentages) rather than generic advice.

**Acceptance Scenarios**:

1. **Given** user has loaded an app file, **When** viewing the Insights section, **Then** system displays specific file names and sizes for top optimization opportunities (e.g., "largest-asset.png - 2.3MB - Consider compression")
2. **Given** app contains common optimization opportunities, **When** Insights renders, **Then** system provides category-specific recommendations (e.g., image compression, code splitting, duplicate detection, unused asset removal)
3. **Given** user is viewing insights, **When** a recommendation is shown, **Then** it includes estimated size reduction impact (e.g., "Potential savings: ~15% reduction")

---

### Edge Cases

- What happens when chart labels overlap in dense areas? (Labels should be hidden for very small elements, tooltips remain available)
- How does color by size gradient handle extreme outliers? (Gradient should use percentile-based distribution to avoid single large files skewing the entire scale)
- What if an app has only one file type? (Color by type mode still works, all elements use the same type color)
- How do labels render on very small chart elements? (Text is hidden if insufficient space, relying on hover tooltips)
- What if no optimization opportunities are found? (Insights section shows "No major optimization opportunities detected" with general best practices)

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a toggle or selector to switch between "Color by Size" and "Color by Type" visualization modes in the Xray chart
- **FR-002**: In "Color by Size" mode, system MUST apply a blue gradient where darker shades indicate larger file sizes and lighter shades indicate smaller file sizes
- **FR-003**: In "Color by Type" mode, system MUST apply colors that match the existing file type legend colors
- **FR-004**: System MUST display file name labels directly on Xray chart elements where space permits (minimum readable size threshold)
- **FR-005**: System MUST ensure label text color provides sufficient contrast against background colors in all color modes
- **FR-006**: System MUST hide labels for chart elements below a minimum size threshold while maintaining tooltip functionality
- **FR-007**: Insights section MUST identify and display specific files contributing most to app size
- **FR-008**: Insights section MUST provide category-specific optimization recommendations (images, code, assets, etc.)
- **FR-009**: Insights section MUST include estimated size reduction impacts for recommendations where calculable
- **FR-010**: System MUST remove all remaining TypeScript React (.tsx) files from the codebase as part of Vue migration cleanup
- **FR-011**: Blue gradient in "Color by Size" mode MUST use percentile-based distribution to handle outliers effectively
- **FR-012**: Color mode selection MUST persist during the current session (user doesn't need to re-select when navigating away and back)

### Key Entities

- **Chart Coloring Mode**: Represents the active visualization strategy (size-based gradient vs. type-based categorical colors)
- **Chart Element**: Individual file representation in the treemap with associated label, size, type, and computed color
- **Insight Recommendation**: Specific optimization suggestion with target file(s), category, estimated impact, and actionable guidance

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can identify the largest files in their app within 5 seconds using "Color by Size" mode (darker areas stand out immediately)
- **SC-002**: Users can identify file type distribution at a glance using "Color by Type" mode without referencing the legend
- **SC-003**: At least 70% of chart elements display visible text labels in typical app structures (those with mixed file sizes)
- **SC-004**: Insights section provides at least 3 specific, actionable recommendations for apps over 50MB
- **SC-005**: Zero TypeScript React (.tsx) files remain in the codebase after cleanup
- **SC-006**: All text labels maintain minimum WCAG AA contrast ratio (4.5:1) against their background colors
- **SC-007**: Users report improved ability to identify optimization opportunities (measurable through user feedback or usability testing)

## Assumptions

- Users are familiar with the existing Xray chart treemap visualization
- The current type legend colors are visually distinct and suitable for the "Color by Type" mode
- Minimum readable label size is approximately 40-50 pixels in width
- Insights generation logic can access file metadata (type, size, path) for recommendation analysis
- TypeScript React files (.tsx) are no longer referenced or imported anywhere in the Vue-based codebase
- Blue gradient range (dark to light) provides sufficient visual distinction for size differences
- Users primarily analyze apps in the 10MB-500MB range (informs gradient percentile distribution)

## Dependencies

- Existing Xray chart implementation and data structure
- Current file type categorization and legend system
- Nivo treemap library (currently used for visualization)
- Zustand store for managing UI state (color mode selection)

## Out of Scope

- Custom color palette selection (only size gradient and type colors supported)
- Exporting chart with labels as image
- Filtering chart by color mode (coloring is visual only, doesn't affect data shown)
- Animated transitions between color modes (instant switch acceptable)
- Detailed insight explanations beyond brief recommendations (no tutorial content)
- Automated optimization (applying recommendations programmatically)
- Historical insight tracking (comparing apps over time)
