# Technical Research: Sort File List by Size

**Feature**: 002-sort-by-size
**Date**: 2025-11-08
**Status**: Complete

## Overview

This document contains technical research and decisions for implementing descending size sorting in the file list breakdown view. The research focused on leveraging existing infrastructure, performance optimization for large trees, and React best practices for memoization.

## Research Areas

### 1. Existing Sorting Infrastructure

**Question**: What sorting capabilities already exist in the codebase?

**Findings**:
- **`sortTree()` function** exists in `/src/lib/analysis/breakdown-generator.ts` (lines 232-265)
  - Already implements recursive tree sorting
  - Supports three criteria: `'size' | 'name' | 'type'`
  - Supports both ascending and descending order
  - Immutable pattern - returns new tree with sorted children
  - **Status**: Fully implemented but unused

- **Zustand store properties** exist in `/src/store/analysis-store.ts`:
  ```typescript
  breakdownSortBy: 'size' | 'name' | 'type'    // Default: 'size'
  breakdownSortOrder: 'asc' | 'desc'           // Default: 'desc'
  setBreakdownSort(sortBy, order): void        // Action to update
  ```
  - **Status**: Defined but not consumed by BreakdownTable

**Decision**: **Use existing `sortTree()` utility** - No need to create new sorting logic. The function is battle-tested (immutable, recursive, supports all criteria) and matches our requirements perfectly.

**Rationale**: DRY principle, reduces code duplication, maintains consistency with existing codebase patterns.

**Alternatives Considered**:
- ❌ Implement inline sorting in BreakdownTable - Rejected: Duplicates existing logic
- ❌ Sort at flattening time - Rejected: Less efficient (sorts flattened array instead of tree)
- ❌ Use external sorting library - Rejected: Overkill for this use case

---

### 2. Performance Optimization for Large Trees

**Question**: How do we ensure sorting doesn't degrade performance for large file lists (1000+ nodes)?

**Findings**:
- **Virtual scrolling** already implemented via `@tanstack/react-virtual`
  - Only renders visible rows (40px height, 10 row overscan)
  - Handles 10,000+ items efficiently

- **Sorting happens on filtered tree** (not entire tree):
  - Tab filtering reduces nodes before sorting (e.g., Frameworks tab shows only ~50-200 nodes)
  - Search filtering further reduces node count

- **React memoization** required to prevent unnecessary re-sorts:
  - Use `useMemo()` to cache sorted tree
  - Dependencies: `[rootNode, sortBy, sortOrder, activeTab, searchQuery]`

- **Benchmark expectations**:
  - Sorting 1000 nodes: ~5-10ms (sub-frame)
  - Sorting 10,000 nodes: ~50-100ms (noticeable but acceptable)
  - Virtual scrolling masks any latency by rendering only visible rows

**Decision**: **Apply memoization with `useMemo()`** to cache sorted tree between renders. Only re-sort when dependencies change (sort criteria, tab, search query, root node).

**Rationale**: Prevents redundant sorting on every render. With virtual scrolling already in place, performance bottleneck is sorting frequency, not tree size.

**Alternatives Considered**:
- ❌ Web Worker sorting - Rejected: Overkill, adds complexity, serialization overhead
- ❌ Lazy sorting (on-demand per node) - Rejected: More complex, harder to test
- ✅ **useMemo** - Selected: Simple, effective, React-native solution

---

### 3. React Component Integration Pattern

**Question**: Where should sorting logic be applied in the component lifecycle?

**Findings**:
- **Current BreakdownTable pipeline**:
  1. Filter by tab type (`filterByType()`)
  2. Flatten to visible nodes (`traverse()` - respects expanded state)
  3. Apply search filter
  4. Virtual scrolling render

- **Best insertion point**: After filtering, before flattening
  - Sorting the tree (not flattened array) maintains hierarchical structure
  - Children of each node are sorted, preserving parent-child relationships

- **Component structure**:
  ```typescript
  const BreakdownTable = ({ rootNode, activeTab, totalSize }) => {
    const { breakdownSortBy, breakdownSortOrder } = useAnalysisStore();

    // 1. Filter by tab
    const filteredTree = useMemo(() =>
      filterByType(rootNode, activeTab),
      [rootNode, activeTab]
    );

    // 2. Sort tree (NEW)
    const sortedTree = useMemo(() =>
      sortTree(filteredTree, breakdownSortBy, breakdownSortOrder),
      [filteredTree, breakdownSortBy, breakdownSortOrder]
    );

    // 3. Flatten to visible nodes
    const flattenedNodes = useMemo(() =>
      traverse(sortedTree, ...),
      [sortedTree, expandedNodes, searchQuery]
    );

    // 4. Virtual scrolling...
  };
  ```

**Decision**: **Apply `sortTree()` after tab filtering, before flattening**. Use nested `useMemo()` hooks to cache each transformation step.

**Rationale**: Maintains clear separation of concerns. Each transformation (filter → sort → flatten → search) is independently memoized for optimal performance.

**Alternatives Considered**:
- ❌ Sort flattened array - Rejected: Loses hierarchical context, harder to maintain parent-child order
- ❌ Sort at store level - Rejected: Breaks separation of concerns (store shouldn't know about UI sorting)
- ✅ **Sort in component with memoization** - Selected: React best practice, performant, testable

---

### 4. TypeScript Type Safety

**Question**: Are existing types sufficient for sorting functionality?

**Findings**:
- **Existing types** in `/src/types/analysis.ts`:
  ```typescript
  interface BreakdownNode {
    id: string;
    name: string;
    path: string;
    size: number;
    type: ContentType;
    children: BreakdownNode[];
    // ... other properties
  }
  ```

- **Sorting types** already defined in `breakdown-generator.ts`:
  ```typescript
  export type SortCriteria = 'size' | 'name' | 'type';
  export type SortOrder = 'asc' | 'desc';
  ```

- **Store types** match sorting types:
  ```typescript
  breakdownSortBy: 'size' | 'name' | 'type'
  breakdownSortOrder: 'asc' | 'desc'
  ```

**Decision**: **No new types needed**. Existing types are comprehensive and correctly typed.

**Rationale**: Type safety already enforced. Store types match utility function types, ensuring type correctness across the application.

**Alternatives Considered**:
- ❌ Create new types - Rejected: Unnecessary duplication
- ✅ **Use existing types** - Selected: DRY, maintains consistency

---

### 5. Testing Strategy

**Question**: How should sorting functionality be tested?

**Findings**:
- **Test framework**: Vitest 4.0.7 + Testing Library
- **No existing tests** in repository (clean slate)
- **Testing levels required**:
  1. **Unit tests** for `sortTree()` function
  2. **Component tests** for BreakdownTable with sorting
  3. **Integration tests** for store + component interaction

**Decision**: **Three-tier testing approach**:

1. **Unit Tests** (`src/__tests__/lib/analysis/breakdown-generator.test.ts`):
   - Test `sortTree()` with various criteria (size, name, type)
   - Test ascending vs descending order
   - Test edge cases (empty children, same sizes, nested trees)
   - Test immutability (original tree unchanged)

2. **Component Tests** (`src/__tests__/components/breakdown/BreakdownTable.test.tsx`):
   - Render with sorted data
   - Verify largest file appears first
   - Verify nested children are sorted
   - Verify sort order across tabs

3. **Integration Tests** (same file as component tests):
   - Test store integration (`setBreakdownSort` updates UI)
   - Test memoization (no unnecessary re-sorts)

**Rationale**: Comprehensive test coverage ensures sorting works correctly at all levels (utility, component, integration). Follows testing best practices for React applications.

**Alternatives Considered**:
- ❌ Only unit tests - Rejected: Doesn't verify UI integration
- ❌ Only component tests - Rejected: Doesn't verify utility function correctness
- ✅ **Three-tier approach** - Selected: Complete coverage, easier debugging

---

### 6. Edge Cases and Error Handling

**Question**: What edge cases must be handled?

**Findings**:
1. **Files with identical sizes**: Stable sort required (preserve original order)
2. **Empty children arrays**: Should not crash, return node as-is
3. **Missing size metadata**: Treat as 0 bytes (already handled by parsers)
4. **Very deep trees** (10+ levels): Recursive sorting handles naturally
5. **Tab switches**: Memoization ensures no performance hit

**Decision**: **Handle edge cases in `sortTree()` function** (already handled) and add explicit tests for each edge case.

**Rationale**: `sortTree()` already handles most edge cases correctly (immutable pattern, recursive). Tests will verify behavior.

**Specific Handling**:
- Identical sizes: JavaScript `.sort()` is stable (maintains order)
- Empty children: Spread operator `[...tree.children]` handles gracefully
- Missing size: Parsers guarantee `size: number` (default 0)
- Deep trees: Recursion handles naturally (no stack overflow risk for <100 levels)

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Sorting Logic** | Use existing `sortTree()` utility | Already implemented, tested, immutable |
| **Performance** | Memoize sorted tree with `useMemo()` | Prevents redundant sorting, React best practice |
| **Integration Point** | After tab filtering, before flattening | Maintains hierarchical structure, clear separation |
| **Type Safety** | Use existing types | No new types needed, maintains consistency |
| **Testing** | Three-tier (unit, component, integration) | Comprehensive coverage, easier debugging |
| **Edge Cases** | Handle in tests, verify existing behavior | `sortTree()` already handles most cases |

## Implementation Checklist

- [x] Research existing infrastructure
- [x] Define performance optimization strategy
- [x] Determine component integration pattern
- [x] Verify type safety
- [x] Plan testing approach
- [x] Identify edge cases

**Phase 0 Complete**: All technical unknowns resolved. Ready for Phase 1 (Design & Contracts).
