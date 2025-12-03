# Feature Specification: One-Time Sample File Pre-Analysis

**Feature Branch**: `014-prebuilt-sample-analysis`
**Created**: 2025-12-02
**Status**: Draft
**Input**: "Convert existing 6 sample files to JSON once, commit to repo, and load JSON files instead of binaries when users click sample cards"

## User Scenarios & Testing

### User Story 1 - Instant Sample File Loading (Priority: P1)

A first-time visitor clicks on a sample file card (e.g., "Facebook 69.64 MB") and the analysis appears instantly without downloading or parsing the 79MB binary file.

**Why this priority**: Only user-facing feature - eliminates 30+ second wait time.

**Independent Test**: Click any sample card, verify analysis loads in <1 second.

**Acceptance Scenarios**:

1. **Given** user on homepage, **When** clicks "Instagram Lite", **Then** analysis loads in <1 second with complete views
2. **Given** user clicks "Facebook (69.64 MB)", **When** page loads, **Then** no "Uploading..." or "Parsing..." indicators shown
3. **Given** slow network, **When** user clicks sample, **Then** only small JSON file downloaded (<500 KB), not full binary

## Requirements

### Functional Requirements

- **FR-001**: Developer runs one-time script to analyze 6 sample binaries and generate JSON files
- **FR-002**: JSON files committed to git in `prebuilt-analyses/` directory
- **FR-003**: Sample cards load JSON files instead of binaries when clicked
- **FR-004**: All analysis views (Breakdown, Summary, X-Ray, Insights) work with JSON data
- **FR-005**: Each JSON file is under 500 KB
- **FR-006**: JSON deserializes to ParseResult format compatible with existing components

## Success Criteria

- **SC-001**: Sample analysis loads in <1 second (click to render)
- **SC-002**: No binary file downloads when clicking samples (only JSON <500 KB)
- **SC-003**: All 6 JSON files combined are <3 MB total
- **SC-004**: Script generates all JSON files in <5 minutes

## Assumptions

- **Static Samples**: 6 sample files won't change (one-time conversion)
- **No New Samples**: No automation needed for adding samples
- **Stable Format**: ParseResult structure is stable
- **No Versioning**: JSON committed with code that uses it
