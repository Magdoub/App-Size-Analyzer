# Feature Specification: JSON Export for File Breakdown

**Feature Branch**: `013-json-export`
**Created**: 2025-01-23
**Status**: Draft
**Input**: User description: "Add JSON export feature that allows users to view and copy the file breakdown in JSON format, showing each file with its size and metadata"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View JSON Breakdown (Priority: P1)

Users analyzing app sizes need to export the detailed file breakdown in a structured JSON format for further analysis, reporting, or integration with other tools. They want to see the JSON representation of the breakdown directly in the application to verify the data structure before copying or exporting.

**Why this priority**: This is the core feature that enables all other export capabilities. Without the ability to view the JSON, users cannot verify the data or understand what they're exporting. This provides immediate value as a standalone feature.

**Independent Test**: Can be fully tested by uploading a binary file (IPA, APK, AAB), navigating to the breakdown view, and clicking a "View as JSON" button. Success is measured by displaying a formatted JSON representation of all files with their sizes and metadata.

**Acceptance Scenarios**:

1. **Given** a user has uploaded an app binary and is viewing the file breakdown, **When** they click the "View as JSON" or "Export JSON" button, **Then** a modal or panel displays the complete file breakdown in formatted JSON
2. **Given** the JSON view is displayed, **When** the user inspects the JSON, **Then** each file entry includes path, size, and all available metadata (file type, compression ratio, etc.)
3. **Given** the user is viewing JSON for a large app with 1000+ files, **When** the JSON view loads, **Then** it renders within 2 seconds with proper formatting
4. **Given** the JSON view is open, **When** the user wants to close it, **Then** a clear close/dismiss action returns them to the normal breakdown view

---

### User Story 2 - Copy JSON to Clipboard (Priority: P2)

Users need a quick way to copy the entire JSON breakdown to their clipboard for pasting into documentation, bug reports, code editors, or data analysis tools. This should be a single-click action that provides immediate feedback.

**Why this priority**: Copying to clipboard is the most common export action and enables immediate sharing and integration workflows. It builds on P1 by adding the action layer, but P1 alone still provides value (viewing).

**Independent Test**: Can be tested by viewing the JSON breakdown and clicking a "Copy" button. Success is verified by pasting into any text editor and confirming valid JSON with correct data.

**Acceptance Scenarios**:

1. **Given** the JSON view is displayed, **When** the user clicks the "Copy to Clipboard" button, **Then** the entire JSON is copied and a success message appears ("Copied!")
2. **Given** JSON has been copied to clipboard, **When** the user pastes into any application (text editor, IDE, etc.), **Then** the pasted content is valid, formatted JSON
3. **Given** the clipboard copy fails (browser permission denied), **When** the operation completes, **Then** an error message explains the issue and suggests alternative actions (e.g., manual selection)
4. **Given** the user copies large JSON (5MB+), **When** the copy operation completes, **Then** it succeeds without freezing the UI or truncating data

---

### User Story 3 - Download JSON File (Priority: P3)

Users working with very large apps or needing to archive analysis results want to download the JSON breakdown as a file. This enables long-term storage, version control, and processing with external tools.

**Why this priority**: While useful, downloading is less common than copying for most users. It's valuable for power users and large datasets but not essential for basic export workflows. Can be added after copy functionality proves stable.

**Independent Test**: Can be tested by viewing JSON and clicking "Download JSON". Success is verified by opening the downloaded file and confirming it contains valid JSON with correct filename and timestamp.

**Acceptance Scenarios**:

1. **Given** the JSON view is displayed, **When** the user clicks "Download JSON" or "Save as File", **Then** a file download begins with a descriptive filename (e.g., `app-breakdown-2025-01-23.json`)
2. **Given** a JSON file has been downloaded, **When** the user opens it, **Then** it contains valid, formatted JSON identical to the displayed view
3. **Given** the user has analyzed multiple apps in the same session, **When** they download JSON for different apps, **Then** each filename uniquely identifies the source app (using app name or bundle ID)
4. **Given** the download is initiated on a mobile device, **When** the browser's download mechanism is triggered, **Then** the file saves to the device's download location with appropriate permissions

---

### Edge Cases

- What happens when the file breakdown contains special characters in paths (Unicode, quotes, backslashes)?
- How does the system handle very large breakdowns (10,000+ files) for display and copy performance?
- What if the user's browser blocks clipboard access - how do we provide fallback options?
- How are circular references or complex metadata structures serialized in JSON?
- What happens if JSON generation fails mid-process (memory limits, browser crash)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate valid JSON representation of the complete file breakdown including file paths, sizes, and all available metadata
- **FR-002**: System MUST display the JSON in a readable, formatted view (with proper indentation and syntax highlighting)
- **FR-003**: Users MUST be able to copy the entire JSON to clipboard with a single click
- **FR-004**: System MUST provide visual feedback when copy operation succeeds or fails (toast notification, button state change, or message)
- **FR-005**: System MUST handle special characters in file paths correctly (escape quotes, backslashes, Unicode characters per JSON spec)
- **FR-006**: System MUST generate JSON that includes at minimum: file path, file size in bytes, and any available metadata (file type, compression ratio, framework/resource category)
- **FR-007**: Users MUST be able to download the JSON as a file with a descriptive, timestamped filename
- **FR-008**: System MUST format JSON with consistent indentation (2 or 4 spaces) for readability
- **FR-009**: System MUST handle large datasets (1000+ files) without blocking the UI thread during generation
- **FR-010**: System MUST sanitize and validate all file metadata before JSON serialization to prevent injection or malformed output

### Key Entities *(include if feature involves data)*

- **File Entry**: Represents a single file in the breakdown with properties: path (string), size (number in bytes), metadata (object with type, category, compression details)
- **Breakdown Export**: The complete JSON structure containing an array of File Entry objects, plus optional root-level metadata (app name, total size, export timestamp, file count)
- **Export Action**: User-initiated action to view, copy, or download the JSON, with associated state (loading, success, error)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the JSON breakdown within 2 seconds of clicking the export button for apps with up to 5,000 files
- **SC-002**: Copy to clipboard operation completes successfully in 95% of attempts across modern browsers (Chrome, Firefox, Safari, Edge)
- **SC-003**: Generated JSON is valid and parseable by standard JSON parsers without errors
- **SC-004**: JSON file downloads include all file breakdown data without truncation or data loss
- **SC-005**: 90% of users can successfully copy and use the JSON in their workflows on first attempt (measured via user testing or analytics)
- **SC-006**: Export operations for large apps (10,000+ files) complete without crashing or freezing the browser

## Scope & Assumptions

### In Scope

- JSON view/display in a modal or dedicated panel
- Copy to clipboard functionality with user feedback
- Download JSON as file with timestamped filename
- Formatting and syntax highlighting for readability
- Error handling for clipboard access and download failures

### Out of Scope

- Export to formats other than JSON (CSV, XML, etc.) - future enhancement
- Advanced filtering or customization of exported fields - export complete breakdown as-is
- Server-side export generation - all processing happens client-side
- Authentication or access control for export - available to all users with breakdown access

### Assumptions

- Users have modern browsers with Clipboard API support (Chrome 66+, Firefox 63+, Safari 13.1+)
- File breakdown data is already available in memory from the analysis phase
- JSON size will typically be under 10MB for most apps
- Users understand JSON format or can use external tools to process it
- The export reflects the current state of the breakdown (filters, sorting, etc. are preserved in export)

## Dependencies

- Existing file breakdown analysis functionality must be working correctly
- Application state management (Pinia store) for accessing breakdown data
- Browser Clipboard API for copy functionality
- Browser File API for download functionality

## Open Questions

None - all requirements are specified with reasonable defaults based on standard web application patterns and industry best practices for data export features.
