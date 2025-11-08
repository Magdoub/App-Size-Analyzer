# Implementation Plan: Sort File List by Size

**Branch**: `002-sort-by-size` | **Date**: 2025-11-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-sort-by-size/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable descending size sorting for all file lists in the Size Breakdown view. The feature will leverage the existing `sortTree()` utility and Zustand store properties (`breakdownSortBy`, `breakdownSortOrder`) that are already implemented but unused. The BreakdownTable component will be updated to apply sorting before flattening the tree, ensuring all tabs (All Files, Frameworks, Assets, Localizations) display files sorted by size in descending order.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2020+ target)
**Primary Dependencies**: React 18.3.1, Zustand 5.0.8, @tanstack/react-virtual 3.13.12
**Storage**: N/A (client-side only, in-memory state with Zustand)
**Testing**: Vitest 4.0.7 + @testing-library/react 16.3.0 + @testing-library/jest-dom 6.9.1
**Target Platform**: Web browsers (modern ES2020+ support)
**Project Type**: Single-page application (SPA) - client-side React app
**Performance Goals**: Sort trees with 1000+ nodes in <16ms (single frame), virtual scrolling for 10k+ rows
**Constraints**: Client-side only (no backend), must work with virtual scrolling, maintain 60fps during expand/collapse
**Scale/Scope**: File lists with 1000-10,000 entries typical, nested trees 5-10 levels deep

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: N/A - No project constitution defined yet

The constitution file (`.specify/memory/constitution.md`) contains only placeholder template content. Since this is an early-stage project without established governance rules, we proceed with industry best practices:

- **Test Coverage**: Unit tests required for sorting logic, component tests for UI behavior
- **Type Safety**: Maintain strict TypeScript mode compliance
- **Performance**: Memoize sorted trees, leverage virtual scrolling
- **Code Reuse**: Use existing `sortTree()` utility, extend existing Zustand actions

**Pre-Phase 0 Gate**: ✅ PASS - No violations, using existing infrastructure

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
│   └── breakdown/
│       ├── BreakdownView.tsx          # Container (no changes needed)
│       ├── BreakdownTabs.tsx           # Tab navigation (no changes needed)
│       └── BreakdownTable.tsx          # PRIMARY FILE - apply sorting here
├── lib/
│   └── analysis/
│       └── breakdown-generator.ts      # Contains sortTree() utility
├── store/
│   └── analysis-store.ts               # Has breakdownSortBy/Order props
├── types/
│   └── analysis.ts                     # BreakdownNode, FileEntry types
└── utils/
    └── formatters.ts                   # formatBytes, formatPercentage

src/__tests__/                          # NEW - Create test directory
├── components/
│   └── breakdown/
│       └── BreakdownTable.test.tsx     # Component tests
└── lib/
    └── analysis/
        └── breakdown-generator.test.ts # Unit tests for sortTree()
```

**Structure Decision**: Single-page application (SPA) structure. This feature modifies existing components in the `src/components/breakdown/` directory and adds tests in a new `src/__tests__/` directory following Vitest conventions. No new components needed - we enhance BreakdownTable.tsx to use existing sorting infrastructure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No complexity violations. This feature uses existing infrastructure (sortTree utility, Zustand store) and adds minimal code to BreakdownTable component.
