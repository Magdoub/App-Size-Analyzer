# Feature Specification: Sort File List by Size

**Feature Branch**: `002-sort-by-size`
**Created**: 2025-11-08
**Status**: Draft
**Input**: User description: "when checking the size breakdown show me the list children as sorted desc by size example (highlighted in image)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Largest Files First (Priority: P1)

As a user analyzing app size, I want to see files sorted by size in descending order (largest first) so that I can immediately identify which files are consuming the most space without having to scan through the entire list.

**Why this priority**: This is the core feature that delivers immediate value. Users analyzing app size need to quickly identify size bottlenecks. Seeing the largest files first allows users to focus optimization efforts on the files with the greatest impact.

**Independent Test**: Can be fully tested by uploading any IPA or APK file, navigating to the "All Files" tab, and verifying that files are displayed in descending size order (largest at top, smallest at bottom). Delivers immediate value by helping users identify the largest files.

**Acceptance Scenarios**:

1. **Given** a user has uploaded an app binary, **When** they view the "All Files" tab in the Size Breakdown section, **Then** files are displayed sorted by size in descending order (largest file at the top)
2. **Given** files are displayed in the list, **When** viewing the SIZE column, **Then** each successive file has equal or smaller size than the file above it
3. **Given** a user expands a directory/folder node, **When** viewing the children of that node, **Then** the children are also sorted by size in descending order

---

### User Story 2 - Nested Sorting for Directory Contents (Priority: P2)

As a user exploring app structure, I want child files within expanded directories to also be sorted by size (descending) so that I can identify the largest files within any specific directory or framework without losing the sorted context.

**Why this priority**: Enhances the P1 story by maintaining consistent sorting behavior when drilling down into directories. This prevents confusion and maintains the "largest first" mental model throughout the navigation experience.

**Independent Test**: Can be tested by uploading an app with nested directories (e.g., Frameworks folder with multiple frameworks), expanding any directory node, and verifying children are sorted by size descending. Works independently as a sorting enhancement.

**Acceptance Scenarios**:

1. **Given** a user has expanded a directory node (e.g., "Payload" or "Frameworks"), **When** viewing the child items, **Then** children are sorted by size in descending order
2. **Given** multiple levels of nesting (e.g., Root > Payload > App.app > Frameworks), **When** expanding any level, **Then** that level's children maintain descending size sort order
3. **Given** a directory contains both subdirectories and files, **When** viewing the sorted children, **Then** all items (directories and files) are sorted together by their size value

---

### User Story 3 - Maintain Sort Order for Other Tabs (Priority: P3)

As a user switching between different views (Frameworks, Assets, Localizations tabs), I want each specialized tab to also display items sorted by size descending so that the sorting behavior is consistent across all views.

**Why this priority**: Provides consistency across the entire UI. While less critical than the main "All Files" view, maintaining consistent sorting in Frameworks, Assets, and Localizations tabs improves overall user experience and reduces cognitive load.

**Independent Test**: Can be tested by switching to each tab (Frameworks, Assets, Localizations) and verifying that items in each tab are sorted by size descending. Delivers value independently by making specialized views easier to analyze.

**Acceptance Scenarios**:

1. **Given** a user switches to the "Frameworks" tab, **When** viewing the list of frameworks, **Then** frameworks are sorted by size in descending order
2. **Given** a user switches to the "Assets" tab, **When** viewing the asset list, **Then** assets are sorted by size in descending order
3. **Given** a user switches to the "Localizations" tab, **When** viewing localizations, **Then** localizations are sorted by size in descending order

---

### Edge Cases

- What happens when multiple files have exactly the same size? (Assumption: maintain stable sort - preserve original ordering for same-size items)
- How does the system handle empty directories or directories with size of 0 bytes? (Assumption: still display them in sort order, they'll appear at the bottom)
- What if a file has no size metadata? (Assumption: treat as 0 bytes and sort to bottom)
- How should compressed vs uncompressed size be handled for sorting? (Assumption: sort by uncompressed size in the SIZE column, since that's what's displayed)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST sort all file entries by size in descending order (largest to smallest) by default
- **FR-002**: System MUST apply descending size sorting to the "All Files" tab file list
- **FR-003**: System MUST apply descending size sorting to child items when a directory/folder is expanded
- **FR-004**: System MUST maintain descending size sort order across all nested levels of the file tree
- **FR-005**: System MUST apply descending size sorting to the "Frameworks" tab list
- **FR-006**: System MUST apply descending size sorting to the "Assets" tab list
- **FR-007**: System MUST apply descending size sorting to the "Localizations" tab list
- **FR-008**: System MUST use the SIZE column value (uncompressed size) as the sorting key
- **FR-009**: System MUST preserve stable sort order for items with identical size values
- **FR-010**: System MUST handle files with missing or zero size metadata by treating them as 0 bytes

### Key Entities

- **File Entry**: Represents any file or directory in the app bundle, with attributes including name, path, size (uncompressed), compressed size, and type
- **Directory Node**: Represents a folder/directory that can contain child entries, with its own size calculated as sum of children or direct size value
- **Tab View**: Different categorized views (All Files, Frameworks, Assets, Localizations) that each display filtered subsets of file entries

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the largest file in any view within 2 seconds (first item in list)
- **SC-002**: 100% of file lists (All Files, Frameworks, Assets, Localizations tabs) display items in descending size order by default
- **SC-003**: Users can locate the top 5 largest files in under 10 seconds without scrolling or searching
- **SC-004**: Sorting behavior is consistent across all tabs - users never encounter unexpected sort orders
- **SC-005**: Users successfully identify size optimization targets 40% faster compared to unsorted file lists

## Assumptions

- Files are already parsed and have size metadata available before rendering
- The current display shows SIZE in bytes/KB/MB format which represents uncompressed size
- The UI uses a tree/hierarchical structure where directories can be expanded to show children
- There are multiple tabs (All Files, Frameworks, Assets, Localizations) as shown in the screenshot
- Users prefer descending (largest-first) sort order for size analysis use cases
- For items with identical sizes, the original order from the parser is acceptable (stable sort)

## Dependencies

- Parsed file metadata must include accurate size values for all files
- Tree/list rendering components must support pre-sorted data or sorting functionality
- Tab components must have access to the same sorting logic/behavior

## Out of Scope

- User-configurable sort options (ascending vs descending, sort by different columns)
- Persistent sort preferences across sessions
- Visual indicators showing that list is sorted (sort arrows, icons)
- Sorting by other attributes (name, type, compression ratio)
- Performance optimizations for sorting very large file lists (>10,000 files)
