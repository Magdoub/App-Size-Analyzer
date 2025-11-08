# Feature Specification: X-Ray Visualization UX Improvements

**Feature Branch**: `003-xray-ux-improvements`
**Created**: 2025-11-08
**Status**: Draft
**Input**: User description: "I want to improve the x-ray product. It always say app content when I hover, the text gets written over each other, there is no ability to zoom when I click on an item, the name of the item is not written on it. here's how it looks [Image #1], even though other products shows it in a better way [Image #2][Image #3] and here after i clicked on WMF[Image #4][Image #5][Image #6]and here I clicked on localizable.strings. also that's the sentry design, which is a bit similar to what i showed in terms of functionality but the colors are different [Image #7]. also think of ways you can improve the x-ray, think as a great ux designer and a senior developer."

## Clarifications

### Session 2025-11-08

- Q: Should treemap boxes display item names (primary) with size in tooltip, or size on boxes with name in tooltip? → A: Display item name on boxes (primary), show size only in tooltip on hover - better for identification and scanning
- Q: What happens when user clicks an item - zoom into it or show details panel? → A: Single click zooms (for items with children); selection/details panel requires different trigger (e.g., right-click, info button, or Ctrl+Click)
- Q: What is the minimum box size threshold for displaying on-box labels? → A: 50x20 pixels minimum (width × height)
- Q: Which specific mechanism should trigger the details panel? → A: Info icon button on each item - appears on hover or always visible for large items; clearest affordance
- Q: Does search look through the entire hierarchy or only currently visible items at the current zoom level? → A: Search entire hierarchy regardless of zoom level - auto-expand/zoom to show matches in context

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Readable Item Labels and Tooltips (Priority: P1)

As a developer analyzing app size, I need to see clear, readable labels for each item in the treemap so that I can quickly identify what each box represents without text overlapping or showing generic "App Contents" labels.

**Why this priority**: This is the most critical issue - users cannot effectively use the visualization if they can't identify what items are. This directly impacts the core value proposition of the X-Ray view.

**Independent Test**: Can be fully tested by hovering over any treemap item and verifying the tooltip shows the specific item name (e.g., "WMF", "localizable.strings") without text overlap, and delivers immediate value by making the visualization readable.

**Acceptance Scenarios**:

1. **Given** the X-Ray view is displayed with multiple items, **When** I hover over any treemap box, **Then** a tooltip displays showing the specific item's name (not "App Contents")
2. **Given** a treemap box is large enough, **When** viewing the visualization, **Then** the item's name is displayed directly on the box itself with readable text
3. **Given** multiple items are displayed close together, **When** I hover over each item, **Then** tooltips appear without text overlapping other tooltips or labels
4. **Given** a treemap box contains very long file paths or names, **When** I hover over it, **Then** the tooltip displays the full name with proper text wrapping or truncation with ellipsis
5. **Given** items of varying sizes, **When** viewing the treemap, **Then** labels scale appropriately - larger items show more detail, smaller items show abbreviated names

---

### User Story 2 - Zoom and Focus Navigation (Priority: P1)

As a developer investigating specific components, I need to click on any item to zoom into it and see its contents in detail, so that I can drill down into the file structure and understand nested relationships.

**Why this priority**: This is equally critical as labeling - the ability to navigate hierarchically is essential for analyzing complex app structures. Without zoom, users are stuck at a single level of detail.

**Independent Test**: Can be fully tested by clicking any folder/bundle item and verifying it zooms to show child items with a breadcrumb path for navigation back to parent levels.

**Acceptance Scenarios**:

1. **Given** a treemap item represents a folder or bundle with contents, **When** I click on it, **Then** the view zooms to show only that item's children in the treemap
2. **Given** I have zoomed into a specific item, **When** viewing the zoomed view, **Then** a breadcrumb navigation shows my current location in the hierarchy (e.g., "Root > Frameworks > WMF")
3. **Given** I am viewing a zoomed-in level, **When** I click a breadcrumb segment, **Then** the view zooms out to that level
4. **Given** I have zoomed into an item, **When** I click on a child item that also has children, **Then** I can continue drilling down multiple levels
5. **Given** I am at any zoom level, **When** I click a "home" or "reset" control, **Then** the view returns to the root level showing all top-level items
6. **Given** an item has no children (is a leaf node), **When** I click it, **Then** the item is highlighted/selected with a visual indicator but does not zoom

---

### User Story 3 - Visual Hierarchy and Contrast (Priority: P2)

As a developer analyzing the treemap, I need clear visual differentiation between item types and sizes so that I can quickly spot patterns and identify large resource consumers.

**Why this priority**: While not blocking basic functionality, improved visual design significantly enhances usability and pattern recognition, making the tool more effective for its primary purpose.

**Independent Test**: Can be fully tested by loading an app with mixed content types and verifying that different file types use distinct colors and that size differences are visually clear.

**Acceptance Scenarios**:

1. **Given** the treemap displays items of different types (executables, frameworks, resources, etc.), **When** viewing the visualization, **Then** each type uses a distinct, accessible color from the existing color scheme
2. **Given** the "Color by Type" mode is selected, **When** viewing the treemap, **Then** items are colored according to their content type with sufficient contrast for readability
3. **Given** the "Color by Size" mode is selected, **When** viewing the treemap, **Then** larger items use progressively darker or more saturated colors to emphasize their size
4. **Given** nested items at different depths, **When** viewing the treemap, **Then** visual cues (borders, shadows, or subtle shading) distinguish parent containers from leaf items
5. **Given** I hover over an item, **When** the tooltip appears, **Then** the item itself is highlighted with a subtle border or glow to show which item is selected

---

### User Story 4 - Interactive Details Panel (Priority: P3)

As a developer investigating specific files, I need to see detailed metadata about selected items (size breakdown, compression ratio, file type, path) so that I can make informed decisions about optimization opportunities.

**Why this priority**: This enhances the analysis experience but is not critical for basic navigation and identification. The existing tooltip system provides basic information. Single-click is reserved for zoom navigation, so this requires an alternative trigger (info icon button).

**Independent Test**: Can be fully tested by clicking the info icon button on any item and verifying the details panel shows comprehensive metadata including exact sizes, percentages, and file paths.

**Acceptance Scenarios**:

1. **Given** I hover over or view a treemap item, **When** an info icon button becomes visible (on hover for small items, always visible for large items), **Then** clicking the info icon opens a details panel (sidebar or overlay) showing full metadata
2. **Given** the details panel is open, **When** viewing it, **Then** it displays: item name, full file path, uncompressed size, compressed size (if applicable), percentage of total app size, and content type
3. **Given** I have selected an item with children, **When** viewing the details panel, **Then** it also shows child count and a breakdown of child sizes
4. **Given** I click the info icon on a different item, **When** the action completes, **Then** the details panel updates to show the new item's information without closing
5. **Given** the details panel is open, **When** I click a close button or press Escape, **Then** the panel dismisses

---

### User Story 5 - Search and Highlight (Priority: P3)

As a developer looking for specific files or patterns, I need to search for items by name across the entire hierarchy and have matching items highlighted in the treemap so that I can quickly locate files of interest in large visualizations, even when they're in branches I'm not currently viewing.

**Why this priority**: This is a "nice to have" enhancement that improves efficiency but isn't required for core functionality. Users can manually navigate to find items.

**Independent Test**: Can be fully tested by entering a search term in the search box, verifying matching items across the entire hierarchy are found (not just visible items), and that the view automatically navigates to show matches in context.

**Acceptance Scenarios**:

1. **Given** the X-Ray view is displayed, **When** I type a search term in the search box, **Then** all items matching the term are highlighted with a distinct visual indicator (e.g., pulsing border)
2. **Given** search results are displayed, **When** viewing the treemap, **Then** non-matching items are dimmed or desaturated to emphasize matches
3. **Given** multiple search results exist, **When** I press Enter or click a "next" button, **Then** the view cycles through matching items, centering each in view
4. **Given** a search is active, **When** I clear the search box, **Then** all highlighting is removed and the view returns to normal
5. **Given** I search for a deeply nested item that is not currently visible at my zoom level, **When** it is found and I navigate to it (Enter or next button), **Then** the view automatically zooms/expands to the appropriate level to show the item in context with highlighting

---

### Edge Cases

- What happens when an item name is extremely long (100+ characters)? The tooltip should wrap text or use horizontal scrolling, and labels on boxes should truncate with ellipsis.
- How does the system handle deeply nested structures (10+ levels)? Breadcrumbs should truncate middle segments with "..." if too many levels are shown.
- What happens when zooming into an item with hundreds of children? The system should maintain performance (render within 500ms) and potentially group very small items into an "Other" category.
- How does the visualization handle very small items (< 1% of total size)? Items below the minimum label display threshold (50x20px) will show no on-box text but remain visible in the treemap with tooltips on hover; extremely small items may be grouped or hidden with an option to "Show all items" that adjusts zoom.
- What happens if the user rapidly clicks multiple items while zoom animations are in progress? The system should queue navigation actions or cancel previous animations to prevent UI conflicts.
- How does the color scheme work for users with color vision deficiencies? The color palette should be colorblind-friendly (test with deuteranopia/protanopia simulators) and supplemented with patterns or labels.
- What happens when resizing the browser window while zoomed in? The treemap should re-layout responsively while maintaining the current zoom level and selection state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display specific item names (file names, folder names, bundle names) in tooltips when hovering over treemap boxes, not generic labels like "App Contents"
- **FR-002**: System MUST render item names (not sizes) directly on treemap boxes when the box dimensions are at least 50x20 pixels (width × height) to fit readable text (minimum 12px font size); boxes smaller than this threshold must show no label and rely on tooltip only
- **FR-003**: System MUST prevent text overlap in tooltips and labels by using intelligent positioning and wrapping
- **FR-004**: System MUST support single-click-to-zoom interaction allowing users to drill down into any item that contains children; clicking a leaf node (no children) must highlight it without zooming
- **FR-004a**: System MUST display an info icon button on treemap items (visible on hover for items below 100x40px, always visible for larger items) that opens the details panel when clicked, separate from the zoom interaction
- **FR-005**: System MUST display breadcrumb navigation showing the current hierarchical path when zoomed into any level
- **FR-006**: System MUST allow users to navigate back up the hierarchy by clicking breadcrumb segments
- **FR-007**: System MUST provide a mechanism to return to the root view from any zoom level (e.g., "home" button or root breadcrumb)
- **FR-008**: System MUST maintain the existing "Color by Size" and "Color by Type" modes with improved visual contrast
- **FR-009**: System MUST use distinct, accessible colors for different content types that meet WCAG AA contrast requirements
- **FR-010**: System MUST highlight or emphasize the currently hovered item to indicate which tooltip corresponds to which box
- **FR-011**: System MUST handle long item names gracefully in both tooltips (wrapping) and labels (ellipsis truncation)
- **FR-012**: System MUST display size information (both compressed and uncompressed when applicable) in tooltips using human-readable formats (KB, MB, GB) with appropriate precision, along with percentage of total app size
- **FR-013**: System MUST maintain visualization performance (< 500ms render time) for treemaps with hundreds of items
- **FR-014**: System MUST preserve the current filter selections (by content type) when zooming in and out
- **FR-015**: System MUST indicate visually (e.g., via cursor change or icon) when an item is clickable/zoomable vs. a leaf node
- **FR-016**: Tooltips MUST appear positioned near the cursor without obscuring the item being hovered
- **FR-017**: System MUST support keyboard navigation (Tab, Enter, Escape) for accessibility
- **FR-018**: Zoom transitions MUST be animated smoothly (200-300ms duration) to maintain spatial orientation
- **FR-019**: Search functionality MUST search across the entire item hierarchy regardless of current zoom level, and automatically navigate/zoom to show matching items in their hierarchical context when selected

### Key Entities *(include if feature involves data)*

- **TreemapNode**: Represents any item in the hierarchy (file, folder, bundle, framework, etc.) with properties: name, path, size (compressed and uncompressed), type/category, children (array of child nodes), depth level in hierarchy
- **TooltipData**: Information displayed when hovering, includes: display name, full path, formatted size, percentage of parent, percentage of total, content type, child count (if applicable)
- **ZoomState**: Current navigation context including: current node being displayed, breadcrumb path (array of ancestor nodes), zoom level/scale, previous states for back navigation
- **VisualSettings**: User preferences for visualization including: color mode (size vs. type), filter selections (which content types to show), minimum item size threshold for display
- **HierarchyPath**: Breadcrumb navigation representation with segments (node name and navigation target), current position indicator, clickable segments for navigation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify any visible treemap item by name within 2 seconds by hovering or reading on-box labels
- **SC-002**: Users can navigate from root to a specific deeply-nested file (4+ levels) in under 15 seconds using click-to-zoom
- **SC-003**: Zero instances of overlapping text in tooltips or labels during normal usage across different viewport sizes (tested on 1920x1080, 1366x768, 2560x1440)
- **SC-004**: 100% of treemap items that contain children are clickable and successfully zoom to show child contents
- **SC-005**: Breadcrumb navigation appears within 100ms of zooming into any level and accurately reflects the hierarchy path
- **SC-006**: Tooltip appears within 200ms of hovering over any item and displays specific item name (not generic label)
- **SC-007**: Users can return to root view from any zoom level in 2 clicks or less (via breadcrumb or home button)
- **SC-008**: Color contrast between different content types meets WCAG AA standards (4.5:1 ratio minimum) for text and 3:1 for graphical elements
- **SC-009**: Visualization renders and responds to interactions in under 500ms for apps with up to 1000+ files
- **SC-010**: 90% of user testing participants successfully complete the task "Find and zoom into a specific framework, then return to root view" on first attempt without instruction
- **SC-011**: Item highlighting on hover is visually distinct and identifiable within 1 second by 95% of users (including users with color vision deficiencies)
- **SC-012**: Zoom animations complete smoothly (60fps) without perceptible lag or stuttering on standard hardware

### Qualitative Outcomes

- Users report improved confidence in understanding app structure and identifying large files
- Visual design aligns with modern data visualization best practices (as exemplified by tools like Sentry, Firefox build analyzer)
- The interface feels responsive and predictable during navigation
- Accessibility standards are met for keyboard navigation and screen reader compatibility

## Assumptions

- The existing treemap data structure already contains hierarchical parent-child relationships needed for zoom functionality
- File paths and names are available in the existing data model
- The current filtering system (by content type) will remain functional and compatible with zoom navigation
- Performance target of < 500ms assumes modern browser (Chrome/Edge/Safari/Firefox latest versions) on hardware with at least 8GB RAM
- The visualization will primarily be used on desktop/laptop screens (minimum 1280x720 resolution) though responsive design is desirable
- Users are familiar with standard treemap interactions (hover for tooltips, click for selection)
- The existing color palette for "Color by Type" mode has 11+ distinct colors for content categories (Executables, Frameworks, DEX Files, Native Libraries, Resources, Assets, Images, Videos, Audio, Fonts, Localizations, Data Files, Config Files, Other)

## Out of Scope

The following are explicitly not included in this feature:

- Comparing multiple app versions in a side-by-side treemap view
- Exporting treemap visualizations as images or PDFs
- Animated transitions when filter selections change (filters apply instantly)
- Touch gesture support for mobile/tablet devices (desktop-focused)
- Custom color palette configuration by users
- Saving/loading specific zoom states or bookmarks
- Integration with external tools or exporting detailed reports
- Real-time updates if the analyzed app file changes
- Multi-selection of items (Ctrl+Click to select multiple)
- Advanced analytics like "find all files of type X over size Y"

## Dependencies

- Existing X-Ray visualization component and treemap rendering library
- Current data parsing logic that generates the hierarchical structure
- Existing filter system for content types
- Browser support for modern CSS (flexbox, grid, transitions) and JavaScript (ES6+)

## Risks and Considerations

- **Performance**: Zooming and re-rendering large treemaps (1000+ items) could cause UI lag if not optimized (mitigation: use virtualization or progressive rendering)
- **UX Complexity**: Adding too many interactive features could overwhelm users (mitigation: keep interactions intuitive and follow established patterns)
- **Accessibility**: Complex visual interactions may not work well for screen reader users (mitigation: ensure keyboard navigation and ARIA labels are implemented)
- **Browser Compatibility**: Advanced CSS/SVG features may not work in older browsers (mitigation: target modern browsers only, document minimum requirements)
- **Data Edge Cases**: Some apps may have unusual structures (circular references, symlinks) that break zoom assumptions (mitigation: detect and handle edge cases gracefully)
