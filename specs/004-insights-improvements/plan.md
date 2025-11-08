# Implementation Plan: Enhanced Insights Experience

**Branch**: `004-insights-improvements` | **Date**: 2025-11-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-insights-improvements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Transform the Insights page from a fixed-height container with internal scrolling to a full-page scrollable layout. Enhance insight card visual design with clear severity indicators, prominent savings display, and improved information density. The primary focus is fixing the nested scroll usability issue (maxHeight: calc(100vh - 350px)) while improving the visual communication of optimization opportunities through better card design and severity-based grouping.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode), targeting ES2020+
**Primary Dependencies**: React 18.3.1, Zustand 5.0.8, Tailwind CSS 3.4.18, @tanstack/react-virtual 3.13.12
**Storage**: Client-side only - in-memory state management with Zustand (no backend/database)
**Testing**: Vitest 4.0.7, @testing-library/react 16.3.0
**Target Platform**: Modern web browsers (Chrome 90+, Safari 14+, Firefox 88+, Edge 90+)
**Project Type**: Single-page web application (client-side binary analysis tool)
**Performance Goals**: 60fps scrolling, <500ms initial render, <100ms filter updates, <300ms expand/collapse animations
**Constraints**: Client-side only, no backend API, handle up to 200 insights without performance degradation
**Scale/Scope**: Desktop/laptop viewports (1024px-2560px width), typical 10-50 insights per analysis, edge cases up to 200 insights

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution file exists yet - this is acceptable for early-stage projects)

**Analysis**: The project constitution template at `.specify/memory/constitution.md` is not yet populated. This feature does not introduce any architectural violations or complexity that would require constitutional governance. This is a UI/UX improvement to an existing feature within the established React/TypeScript architecture.

**Deferred Constitutional Concerns**: None. This feature is purely presentational and does not introduce new architectural patterns, libraries, or testing approaches that would require constitutional approval.

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
│   └── insights/
│       ├── InsightsView.tsx         # Main container - WILL MODIFY (remove maxHeight)
│       ├── InsightCard.tsx          # Individual insight card - WILL MODIFY (enhance visuals)
│       └── InsightFilters.tsx       # Filter controls - MAY MODIFY (styling updates)
├── types/
│   └── insights.ts                  # Type definitions - REFERENCE ONLY
├── lib/
│   └── analysis/
│       ├── insight-engine.ts        # Rule execution engine - REFERENCE ONLY
│       └── insight-rules.ts         # Analysis rules - REFERENCE ONLY
├── store/
│   └── analysis-store.ts            # Zustand state - REFERENCE ONLY
└── utils/
    └── formatters.ts                # Byte formatting - REFERENCE ONLY
```

**Structure Decision**: Single-page web application structure. All modifications will be contained within the `src/components/insights/` directory. The primary changes are:
1. **InsightsView.tsx**: Remove `maxHeight: calc(100vh - 350px)` from the insights list container to enable full-page scrolling
2. **InsightCard.tsx**: Enhance visual design with severity indicators, improved savings display, category tags
3. No new files or architectural changes required

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitutional violations. This is a straightforward UI enhancement within existing architecture.

---

## Phase 0: Research Summary

**Status**: ✅ Complete

**Artifacts Generated**:
- `research.md`: Technical decisions for scrolling approach, visual design, grouping, performance, and animations

**Key Decisions**:
1. **Full-page scrolling**: Remove maxHeight constraint, use natural document flow
2. **Severity indicators**: Keep existing color scheme (red/orange/yellow/blue), add visual weight differentiation
3. **Information hierarchy**: Promote savings to hero position, improve fix suggestion visibility
4. **Grouping**: Implement optional severity grouping with toggle (default: enabled)
5. **Performance**: React.memo + useMemo, no virtualization needed for <200 insights
6. **Responsive**: Single column always, max-width for readability on ultra-wide monitors
7. **Animations**: CSS transitions (300ms) for expand/collapse

**No new dependencies required** - all enhancements use existing stack.

---

## Phase 1: Design & Contracts Summary

**Status**: ✅ Complete

**Artifacts Generated**:
- `data-model.md`: State management extensions and data structures
- `contracts/README.md`: Component interfaces and API contracts (none for this feature)
- `quickstart.md`: Developer integration guide and testing scenarios

**Key Design Elements**:
1. **State extension**: Add `insightsGroupBySeverity: boolean` to Zustand store
2. **Grouped insights structure**: Transform flat array to severity-based groups
3. **New component**: `SeveritySection` for rendering severity group headers
4. **Performance**: O(n log n) complexity for filtering + grouping, acceptable for n ≤ 200

**Backward Compatibility**: ✅ All changes are additive and non-breaking

---

## Constitution Check (Re-evaluation)

**Status**: ✅ PASS (post-design)

**Re-evaluated Against**: Project constitution template (not yet populated)

**Analysis**:
- No new libraries or frameworks introduced ✅
- No architectural pattern changes ✅
- No testing approach changes ✅
- All modifications are within established React/TypeScript patterns ✅
- Performance targets align with existing requirements ✅

**Conclusion**: Feature remains fully compliant. Ready to proceed to task breakdown (Phase 2: `/speckit.tasks`).

---

## Next Steps

**Command**: `/speckit.tasks`

**Purpose**: Generate executable task breakdown (tasks.md) organized by user story priority with dependency graph.

**Prerequisites**: ✅ All planning artifacts complete
- [x] plan.md (this file)
- [x] research.md
- [x] data-model.md
- [x] contracts/
- [x] quickstart.md
- [x] Agent context updated

**Expected Output**: `tasks.md` with tasks formatted as:
```
- [ ] [T001] [P1] [US1] Task description with file path
```

Organized by user stories (US1: Full-page scrolling, US2: Enhanced cards, US3: Grouping, US4: Expandable details).
