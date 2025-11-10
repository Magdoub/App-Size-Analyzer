# Implementation Plan: Code Cleanup and Organization

**Branch**: `008-code-cleanup` | **Date**: 2025-11-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-code-cleanup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature performs repository cleanup by removing backup files (.bak), resolving duplicate JS/TS file pairs to use only JavaScript per the Vue 3 migration (spec 006), removing legacy React/Zustand state management files, and investigating potentially unused utilities. The cleanup ensures the codebase reflects the current Vue 3 + JavaScript architecture without TypeScript remnants or obsolete React code, while maintaining all functionality through incremental validation (build + tests) after each cleanup category.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Vue 3.5.24
**Primary Dependencies**: Vue 3.5.24 + Pinia 2.3+ (no TypeScript per project constitution)
**Storage**: N/A (client-side only, in-memory state with Pinia)
**Testing**: Vitest 2.1.9 + Vue Test Utils 2.4.6
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single web application (client-side only)
**Performance Goals**: N/A for cleanup (no new functionality)
**Constraints**: Zero functionality loss - all builds and tests must pass after cleanup
**Scale/Scope**: Repository-wide file cleanup (~30 files affected: 2 .bak, ~25 TS duplicates, 1 legacy store directory, potentially 2-3 unused utilities)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Client-Side Privacy ✅ COMPLIANT
**Status**: Not applicable - no data processing changes
**Rationale**: This is a file cleanup task that removes obsolete code without changing any runtime behavior or data handling

### Principle II: Performance-First Architecture ✅ COMPLIANT
**Status**: Not applicable - no performance-related changes
**Rationale**: Cleanup removes dead code but doesn't alter Web Worker architecture or runtime performance characteristics

### Principle III: Library-First Design ✅ COMPLIANT
**Status**: Not applicable - no library changes
**Rationale**: Cleanup focuses on removing duplicate/obsolete files, not restructuring libraries or contracts

### Principle IV: Test-Driven Development (TDD) ✅ COMPLIANT
**Status**: Tests validate cleanup safety
**Rationale**: Existing test suite will be run after each cleanup category to verify zero functionality loss. New tests not required as no new functionality is added

### Principle V: Code Quality & Modern JavaScript ✅ COMPLIANT
**Status**: **DIRECTLY SUPPORTS** this principle
**Rationale**: Removing TypeScript files aligns with constitution's requirement for JavaScript ES2020+. Cleanup eliminates confusion about which file version is authoritative (JS vs TS)

### Principle VI: Progressive Enhancement ✅ COMPLIANT
**Status**: Not applicable - no browser compatibility changes
**Rationale**: File removal doesn't affect browser feature detection or progressive enhancement strategy

### Principle VII: Specification-First Workflow ✅ COMPLIANT
**Status**: Following SpecKit workflow
**Rationale**: This cleanup has spec.md → plan.md → tasks.md → implementation, with prioritized user stories (P1-P4)

**GATE RESULT**: ✅ **PASSED** - All principles compliant, Principle V directly supported. No violations or exceptions needed.

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
├── components/           # Vue 3 components
├── lib/                  # Library-first design: parsers, analysis, visualization
│   ├── analysis/         # Has both .js and .ts versions (needs cleanup)
│   ├── parsers/          # Has both .js and .ts versions (needs cleanup)
│   └── visualization/    # Has both .js and .ts versions (needs cleanup)
├── stores/               # Pinia stores (Vue 3) - KEEP
├── store/                # Zustand store (React era) - REMOVE (US3)
├── types/                # Type definitions (has both .js and .ts - needs cleanup)
├── utils/                # Utilities (has both .js and .ts, plus potentially unused files)
├── workers/              # Web Workers (has both .js and .ts versions)
├── __tests__/            # Test files
├── App.vue               # Main Vue component
├── App.tsx.bak           # REMOVE (US1 - backup file)
└── main.js               # Entry point

sample-files/             # 131MB binary samples - KEEP (per spec)
```

**Structure Decision**: Single-project structure (client-side web app). This cleanup focuses on:
1. Removing 2 backup files with `.bak` extensions (US1)
2. Resolving ~25 duplicate JS/TS file pairs by keeping only `.js` versions (US2)
3. Removing legacy `store/` directory from React era (US3)
4. Investigating potentially unused utilities like `utils/proptypes.js` (US4)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - Constitution Check passed with all principles compliant.

---

## Phase 1 Complete: Post-Design Constitution Re-evaluation

*Re-checking constitution compliance after completing design artifacts (research.md, data-model.md, contracts/, quickstart.md)*

### Design Artifacts Summary

1. **research.md**: Documents decisions for removing backup files, resolving JS/TS duplicates (keep JS per constitution), removing legacy Zustand store, and investigating unused utilities
2. **data-model.md**: Defines entities for tracking cleanup operations (CleanupCategory, FileToRemove, ValidationResult, CleanupAuditLog)
3. **contracts/cleanup-operations.md**: Specifies contracts for 4 cleanup operations with validation steps
4. **quickstart.md**: Provides step-by-step manual cleanup instructions with validation commands

### Constitution Re-Check

**Principle I (Client-Side Privacy)**: ✅ Still compliant - Design confirms no data processing changes, only file deletion

**Principle II (Performance-First Architecture)**: ✅ Still compliant - Design confirms no Web Worker or performance architecture changes

**Principle III (Library-First Design)**: ✅ Still compliant - Cleanup operations don't modify library interfaces or contracts

**Principle IV (TDD)**: ✅ Still compliant - Design includes validation steps using existing test suite after each cleanup category

**Principle V (Code Quality & Modern JavaScript)**: ✅ **STRONGLY REINFORCED** - Design confirms removal of all TypeScript files (except test setup), keeping only JavaScript per constitution. Research.md explicitly justifies this decision based on constitution Principle V.

**Principle VI (Progressive Enhancement)**: ✅ Still compliant - No browser API or feature detection changes

**Principle VII (Specification-First Workflow)**: ✅ Still compliant - All Phase 0 and Phase 1 artifacts completed per SpecKit workflow

### Design Quality Assessment

- **Contracts clarity**: All 4 cleanup operations have well-defined input/output contracts with error codes
- **Validation gates**: Each operation includes build + test validation before commit
- **Rollback safety**: Git-based rollback procedures documented for all operations
- **Incremental execution**: Design enforces sequential execution (US1 → US2 → US3 → US4) with validation between steps

### Final Gate Result

**GATE STATUS**: ✅ **PASSED** - Post-design re-evaluation confirms all principles remain compliant. No new violations introduced by design decisions.

**Ready to proceed to**: Phase 2 - Task breakdown (`/speckit.tasks` command)
