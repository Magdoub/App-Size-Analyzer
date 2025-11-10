# Research: Code Cleanup and Organization

**Feature**: 008-code-cleanup
**Date**: 2025-11-10
**Phase**: Phase 0 - Research & Decision Documentation

## Overview

This document consolidates research findings for safely removing backup files, duplicate JS/TS files, legacy state management directories, and unused utilities from the codebase. All decisions are informed by codebase analysis, import statement searches, and alignment with the Vue 3 migration (spec 006).

---

## Research Area 1: Backup File Removal Strategy

### Decision
Remove all `.bak` files without preservation or git history cleanup.

### Rationale
1. **Git history provides backup**: All previous versions are preserved in git history (accessible via `git log` and `git checkout`)
2. **Backup files are temporary artifacts**: Created during Vue 3 migration (spec 006) as safety copies, no longer needed post-migration
3. **Zero risk**: Backup files are not imported or referenced by any active code

### Alternatives Considered
- **Alternative 1: Archive backup files in a separate branch**
  - **Rejected because**: Git history already serves this purpose; creating an archive branch adds unnecessary complexity
- **Alternative 2: Move backups to a `.archive/` directory**
  - **Rejected because**: Still pollutes the repository with dead code; git history is the proper archive mechanism

### Implementation Notes
- Files to remove:
  1. `src/App.tsx.bak` (8,455 bytes)
  2. `src/lib/parsers/android/apk-parser.ts.bak` (4,938 bytes)
- Total size savings: ~13.4 KB
- Validation: Run `git status` after deletion to ensure files are staged for removal

---

## Research Area 2: JavaScript vs TypeScript Duplicate Resolution

### Decision
**Keep JavaScript (.js) files, remove TypeScript (.ts) files** for all duplicate pairs.

### Rationale
1. **Project constitution mandates JavaScript**: Constitution v1.1.0 Principle V requires "JavaScript ES2020+" with no TypeScript
2. **Vue 3 migration specification**: Spec 006 explicitly states "no TypeScript per user requirement"
3. **Active imports use .js extensions**: Analysis of import statements confirms `.js` files are actively imported in Vue components and main.js
4. **Consistent build configuration**: `vite.config.js` and `package.json` are configured for JavaScript-only builds

### Alternatives Considered
- **Alternative 1: Keep TypeScript files, remove JavaScript**
  - **Rejected because**: Violates project constitution (Principle V) and spec 006 user requirement
- **Alternative 2: Keep both and configure dual build**
  - **Rejected because**: Adds maintenance burden with no benefit; constitution explicitly requires JavaScript-only
- **Alternative 3: Convert JavaScript to TypeScript**
  - **Rejected because**: User explicitly requested JavaScript-only architecture (per CLAUDE.md and spec 006)

### Implementation Notes
- **Total duplicates**: 32 TypeScript files with corresponding JavaScript versions
- **Affected directories**:
  - `lib/analysis/` (4 files)
  - `lib/parsers/android/` (6 files)
  - `lib/parsers/ios/` (5 files)
  - `lib/parsers/common/` (3 files)
  - `lib/visualization/` (3 files)
  - `types/` (4 files)
  - `utils/` (2 files)
  - `workers/` (2 files)
  - `store/` (1 file - will be removed separately in US3)
  - `__tests__/` (2 test files)

- **Validation strategy**:
  1. Remove all `.ts` files except `src/test/setup.ts` (Vitest configuration, no `.js` equivalent)
  2. Run `npm run build` to verify all imports resolve
  3. Run `npm run test` to ensure test suite passes
  4. Check console for import errors when running `npm run dev`

- **Special case: `src/test/setup.ts`**
  - **Decision**: Keep this file even though it's TypeScript
  - **Rationale**: Vitest configuration file with no JavaScript equivalent; not part of application code, only test harness setup
  - **Risk**: Low - this is infrastructure, not application logic

---

## Research Area 3: Legacy State Management Cleanup

### Decision
Remove entire `src/store/` directory (Zustand/React era state management).

### Rationale
1. **Vue 3 migration complete**: Spec 006 completed full migration from React to Vue 3
2. **No active imports**: Grep search for `import.*from.*store/` found only one reference in `App.tsx.bak` (which is being deleted in US1)
3. **Superseded by Pinia stores**: All state management now uses `src/stores/` with Pinia (Vue 3 standard)
4. **Zero functional impact**: Directory contains only 1 file (`analysis-store.ts`, 8,899 bytes) with no dependents

### Alternatives Considered
- **Alternative 1: Rename to `store.old/` for reference**
  - **Rejected because**: Git history provides reference; keeping obsolete directories violates DRY principle
- **Alternative 2: Extract reusable logic before deletion**
  - **Rejected because**: All Zustand store logic has already been migrated to Pinia stores in spec 006

### Implementation Notes
- **Directory to remove**: `src/store/` (contains 1 file: `analysis-store.ts`)
- **Size savings**: ~9 KB
- **Validation**:
  1. Grep entire codebase for any imports: `grep -r "from.*['\"].*store/" src/`
  2. Run `npm run build` to verify no import errors
  3. Run `npm run test` to verify all tests pass

---

## Research Area 4: Unused Utility File Investigation

### Decision
Remove `src/utils/proptypes.js` (React PropTypes remnant, unused in Vue 3).

### Rationale
1. **No active imports**: Grep search found zero import statements referencing `proptypes`
2. **React-specific utility**: PropTypes are a React pattern for component prop validation, not applicable to Vue 3
3. **Vue 3 uses different prop validation**: Vue 3 uses `defineProps()` with runtime type checking, not PropTypes
4. **Superseded by Vue patterns**: Prop validation now handled in `<script setup>` blocks with Composition API

### Alternatives Considered
- **Alternative 1: Keep for potential future use**
  - **Rejected because**: React PropTypes don't apply to Vue 3 architecture; keeping it creates confusion
- **Alternative 2: Convert to Vue prop validators**
  - **Rejected because**: Not needed; Vue 3 prop validation is handled inline in components, not via utility modules

### Implementation Notes
- **File to remove**: `src/utils/proptypes.js`
- **Size savings**: ~2-3 KB (estimated)
- **Validation**:
  1. Search for any dynamic imports: `grep -r "proptypes" src/`
  2. Check for string-based imports (webpack-style): `grep -r "require.*proptypes" src/`
  3. Run `npm run build` and `npm run test` to verify no runtime errors

### Additional Files Investigated

**Files confirmed as USED (keeping)**:
- `src/utils/formatters.js` - Used by Vue components for number/byte formatting (active imports found)
- `src/utils/calculations.ts` - Wait, this has no `.js` equivalent; needs investigation

**Action required**: Investigate `src/utils/calculations.ts` - it may be the only TS file that needs conversion to JS (not deletion) if it's actively used.

---

## Research Area 5: Edge Case - calculations.ts

### Decision
**Convert `src/utils/calculations.ts` to JavaScript** if actively used, or remove if unused.

### Rationale
1. **No .js equivalent**: Unlike other duplicates, this file has no JavaScript version
2. **Potential active usage**: May contain calculation utilities used by Vue components
3. **Constitution compliance**: Must be JavaScript per Principle V

### Implementation Notes
- **Investigation needed**: Check imports of `calculations.ts` across codebase
- **If used**: Convert TypeScript to JavaScript (remove type annotations)
- **If unused**: Delete file
- **Validation**: Grep for imports: `grep -r "calculations" src/ --include="*.vue" --include="*.js"`

---

## Summary of Decisions

| Research Area | Decision | Rationale | Size Savings |
|---------------|----------|-----------|--------------|
| Backup Files | Remove 2 `.bak` files | Git history provides backup, zero active references | ~13 KB |
| JS/TS Duplicates | Keep `.js`, remove `.ts` (32 files) | Constitution mandates JavaScript-only, Vue 3 spec requirement | TBD (estimate ~100-150 KB) |
| Legacy Store | Remove `store/` directory | Superseded by Pinia stores, zero imports | ~9 KB |
| Unused Utils | Remove `proptypes.js` | React-specific, zero imports, Vue 3 uses different pattern | ~3 KB |
| calculations.ts | Convert to `.js` or remove | No duplicate, must be JS per constitution | ~2-5 KB |

**Total estimated repository size reduction**: ~125-180 KB (excluding large TS files)

---

## Risk Mitigation

1. **Incremental validation**: Run build + tests after each cleanup category (US1 → US2 → US3 → US4)
2. **Git safety**: Each cleanup category gets its own commit for easy reversion
3. **Import analysis**: Use multiple grep patterns to catch dynamic imports, require statements, and string-based imports
4. **Console monitoring**: Check browser console for runtime errors after each cleanup category

---

## Next Steps (Phase 1)

1. **Data Model**: Define entities for "File to Remove", "Validation Result", "Cleanup Category"
2. **Contracts**: Define cleanup operation contracts (input: file list, output: validation result)
3. **Quickstart**: Document how to safely run cleanup operations with validation

---

**Research Status**: ✅ Complete - All NEEDS CLARIFICATION items resolved
**Gate Status**: ✅ Ready to proceed to Phase 1 (Design)
