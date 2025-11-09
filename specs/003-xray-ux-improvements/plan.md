# Implementation Plan: X-Ray Visualization UX Improvements

**Branch**: `003-xray-ux-improvements` | **Date**: 2025-11-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-xray-ux-improvements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature enhances the X-Ray treemap visualization with critical UX improvements including: readable item labels and tooltips (replacing generic "App Contents"), click-to-zoom navigation with breadcrumb trails, improved visual hierarchy with WCAG-compliant colors, optional details panel for metadata, and search functionality across the hierarchy. These improvements address the core usability issues preventing users from effectively analyzing app structure and identifying optimization opportunities.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode), targeting ES2020+
**Primary Dependencies**: React 18.3.1, @nivo/treemap 0.99.0, Zustand 5.0.8, Tailwind CSS 3.4.18, color2k 2.0.3
**Storage**: Client-side only - in-memory state management with Zustand (no backend/database)
**Testing**: Vitest 4.0.7 with React Testing Library 16.3.0, @testing-library/jest-dom 6.9.1
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) on desktop/laptop (minimum 1280x720)
**Project Type**: Single-page web application (client-side only)
**Performance Goals**: < 500ms render time for treemaps with 1000+ items; 60fps smooth animations for zoom transitions; < 200ms tooltip response time
**Constraints**: Client-side only (no server), accessibility (WCAG AA compliance for contrast), keyboard navigation support
**Scale/Scope**: Visualizing apps with up to 1000+ files/resources; supporting 10+ content types with distinct colors; handling deeply nested hierarchies (10+ levels)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (with notes)

This feature is an enhancement to existing components rather than a new library/service, so standard constitution gates apply:

- **Component Architecture**: ✅ Enhancements to existing React components (`Treemap.tsx`, `XRayView.tsx`) with new shared components (`Breadcrumb.tsx`, `DetailsPanel.tsx`)
- **State Management**: ✅ Uses existing Zustand store pattern; new state fields added to `analysis-store.ts` for UX features
- **Testing Strategy**: ✅ Will follow existing Vitest + React Testing Library pattern; unit tests for utility functions, component tests for UI
- **Accessibility**: ✅ Explicit WCAG AA compliance requirement; keyboard navigation support required per spec
- **Performance**: ✅ Clear performance budget defined (< 500ms render, 60fps animations)
- **Technology Choices**: ✅ Uses existing stack (React, Nivo, Zustand, Tailwind); no new dependencies required except potentially for accessibility testing

**No violations or complexity exceptions required.**

**Post-Phase 1 Re-check**: Will verify that the designed components maintain the existing patterns and don't introduce unnecessary complexity.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── xray/
│   │   ├── Treemap.tsx                    # Enhanced: tooltip/label logic, click-to-zoom
│   │   ├── XRayView.tsx                   # Enhanced: search, breadcrumb integration
│   │   ├── CategoryFilter.tsx             # Existing (unchanged)
│   │   └── DetailsPanel.tsx               # NEW: Metadata details sidebar
│   └── shared/
│       ├── Breadcrumb.tsx                 # NEW: Hierarchical navigation
│       └── SearchBox.tsx                  # NEW: Search with navigation controls
├── lib/
│   └── visualization/
│       ├── treemap-generator.ts           # Enhanced: search match tracking
│       ├── color-scheme.ts                # Enhanced: WCAG validation
│       ├── node-label-calculator.ts       # NEW: Label visibility thresholds
│       └── accessibility-helpers.ts       # NEW: Keyboard navigation utilities
├── store/
│   └── analysis-store.ts                  # Enhanced: UX state (zoom, search, details)
└── types/
    └── analysis.ts                        # Enhanced: Add UX-related types

src/__tests__/
├── components/
│   ├── xray/
│   │   ├── Treemap.test.tsx               # NEW: Component tests
│   │   ├── XRayView.test.tsx              # NEW: Integration tests
│   │   └── DetailsPanel.test.tsx          # NEW: Component tests
│   └── shared/
│       ├── Breadcrumb.test.tsx            # NEW: Component tests
│       └── SearchBox.test.tsx             # NEW: Component tests
└── lib/
    └── visualization/
        ├── node-label-calculator.test.ts  # NEW: Unit tests
        └── accessibility-helpers.test.ts  # NEW: Unit tests
```

**Structure Decision**: Single-page web application using existing React component structure. All new components follow the established pattern of component-specific directories under `src/components/` with shared utilities in `src/lib/`. Tests mirror source structure using `__tests__` directories co-located with source files.

## Complexity Tracking

**No violations to track** - this feature follows established patterns and requires no exceptions.
