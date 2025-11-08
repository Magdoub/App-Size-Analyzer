# Quickstart Guide: Sort File List by Size

**Feature**: 002-sort-by-size
**Date**: 2025-11-08
**Audience**: Developers implementing this feature

## Overview

This quickstart guide provides step-by-step instructions for implementing descending size sorting in the file list breakdown view. The implementation leverages existing infrastructure and requires minimal code changes.

## Prerequisites

- ✅ TypeScript 5.9+ installed
- ✅ Node.js installed (for running tests)
- ✅ Familiarity with React hooks (`useMemo`, Zustand store)
- ✅ Understanding of tree data structures

## Implementation Steps

### Step 1: Import Required Dependencies

**File**: `/src/components/breakdown/BreakdownTable.tsx`

Add the `sortTree` import at the top of the file:

```typescript
import { sortTree } from '@/lib/analysis/breakdown-generator';
```

**Location**: After existing imports (around line 10)

**Verification**: TypeScript compiler should not show import errors

---

### Step 2: Read Sort State from Store

**File**: `/src/components/breakdown/BreakdownTable.tsx`

Update the store hook call to include sort properties:

```typescript
const BreakdownTable = ({ rootNode, activeTab, totalSize }) => {
  const {
    breakdownExpandedNodes,
    breakdownSearchQuery,
    breakdownSortBy,      // ADD THIS
    breakdownSortOrder,   // ADD THIS
    toggleBreakdownNode,
  } = useAnalysisStore();

  // ... rest of component
};
```

**Location**: Inside component function (around line 20-30)

**Verification**:
- No TypeScript errors
- Store properties are available in component scope

---

### Step 3: Apply Sorting After Tab Filtering

**File**: `/src/components/breakdown/BreakdownTable.tsx`

Add a new `useMemo` hook to apply sorting:

```typescript
// BEFORE (existing code - around line 40-50):
const filteredTree = useMemo(() =>
  filterByType(rootNode, activeTab),
  [rootNode, activeTab]
);

// ADD THIS (NEW - insert after filteredTree):
const sortedTree = useMemo(() =>
  sortTree(filteredTree, breakdownSortBy, breakdownSortOrder),
  [filteredTree, breakdownSortBy, breakdownSortOrder]
);

// UPDATE THIS (use sortedTree instead of filteredTree):
const flattenedNodes = useMemo(() =>
  traverse(sortedTree, expandedNodes, searchQuery),  // Change: filteredTree → sortedTree
  [sortedTree, expandedNodes, searchQuery]          // Change: filteredTree → sortedTree
);
```

**Location**: Inside component, before `flattenedNodes` calculation

**Verification**:
- Check `sortedTree` is defined before `flattenedNodes`
- Verify `flattenedNodes` uses `sortedTree` (not `filteredTree`)
- Memoization dependencies are correct

---

### Step 4: Test the Implementation

**A. Manual Testing**:

1. Run the dev server:
   ```bash
   npm run dev
   ```

2. Upload an IPA or APK file

3. Navigate to "All Files" tab

4. **Verify**: Largest file appears at the top of the list

5. Expand a directory (e.g., "Frameworks")

6. **Verify**: Children are also sorted by size descending

7. Switch to "Frameworks", "Assets", "Localizations" tabs

8. **Verify**: All tabs show sorted lists

**B. Automated Testing** (next step):

Create test file: `src/__tests__/components/breakdown/BreakdownTable.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BreakdownTable } from '@/components/breakdown/BreakdownTable';
import { BreakdownNode } from '@/types/analysis';

describe('BreakdownTable - Sorting', () => {
  it('should display largest file first by default', () => {
    const mockTree: BreakdownNode = {
      id: 'root',
      name: 'Root',
      path: '/',
      size: 1000,
      type: 'bundle',
      children: [
        { id: '1', name: 'small.txt', path: '/small.txt', size: 100, type: 'data', children: [] },
        { id: '2', name: 'large.bin', path: '/large.bin', size: 900, type: 'executable', children: [] },
        { id: '3', name: 'medium.png', path: '/medium.png', size: 500, type: 'image', children: [] },
      ],
    };

    render(<BreakdownTable rootNode={mockTree} activeTab="all" totalSize={1000} />);

    const rows = screen.getAllByRole('row');

    // First visible row should be largest file (900 bytes)
    expect(rows[0]).toHaveTextContent('large.bin');
  });
});
```

Run tests:
```bash
npm test
```

**Verification**: Test passes, no console errors

---

### Step 5: Edge Case Validation

Test the following scenarios:

| Scenario | Expected Behavior | How to Test |
|----------|-------------------|-------------|
| **Files with same size** | Maintain original order (stable sort) | Upload app with duplicate files |
| **Empty directories** | Appear at bottom (size = 0) | Expand directory with no contents |
| **Missing size metadata** | Treated as 0, sorted to bottom | Check parser output for null handling |
| **Very large trees (1000+ nodes)** | Sorting completes in <100ms | Upload large app, check performance tab |

**Verification**: All edge cases handled gracefully

---

## Code Snippets

### Complete BreakdownTable Component (with sorting)

```typescript
import { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAnalysisStore } from '@/store/analysis-store';
import { sortTree } from '@/lib/analysis/breakdown-generator';
import { BreakdownNode } from '@/types/analysis';

interface BreakdownTableProps {
  rootNode: BreakdownNode;
  activeTab: 'all' | 'frameworks' | 'assets' | 'localizations';
  totalSize: number;
}

export const BreakdownTable = ({ rootNode, activeTab, totalSize }: BreakdownTableProps) => {
  const {
    breakdownExpandedNodes,
    breakdownSearchQuery,
    breakdownSortBy,          // NEW
    breakdownSortOrder,       // NEW
    toggleBreakdownNode,
  } = useAnalysisStore();

  // 1. Filter by tab type
  const filteredTree = useMemo(() =>
    filterByType(rootNode, activeTab),
    [rootNode, activeTab]
  );

  // 2. Sort tree (NEW STEP)
  const sortedTree = useMemo(() =>
    sortTree(filteredTree, breakdownSortBy, breakdownSortOrder),
    [filteredTree, breakdownSortBy, breakdownSortOrder]
  );

  // 3. Flatten to visible nodes
  const flattenedNodes = useMemo(() =>
    traverse(sortedTree, breakdownExpandedNodes, breakdownSearchQuery),
    [sortedTree, breakdownExpandedNodes, breakdownSearchQuery]
  );

  // 4. Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: flattenedNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  // ... rest of component (render logic)
};
```

---

## Testing Checklist

- [ ] Import `sortTree` from breakdown-generator
- [ ] Read `breakdownSortBy` and `breakdownSortOrder` from store
- [ ] Create `sortedTree` useMemo hook
- [ ] Update `flattenedNodes` to use `sortedTree`
- [ ] Verify largest file appears first in UI
- [ ] Verify children are sorted when directories expanded
- [ ] Verify all tabs use sorted data
- [ ] Create unit tests for `sortTree()` function
- [ ] Create component tests for BreakdownTable
- [ ] Test edge cases (same size, empty dirs, large trees)
- [ ] Run full test suite: `npm test`
- [ ] Run type check: `npm run type-check`
- [ ] Run linter: `npm run lint`

---

## Performance Optimization

### Memoization Best Practices

**DO**:
- ✅ Use `useMemo()` for all expensive transformations
- ✅ Include all dependencies in dependency array
- ✅ Keep dependencies minimal (only values that affect output)

**DON'T**:
- ❌ Forget dependencies (stale data bug)
- ❌ Include unnecessary dependencies (over-rendering)
- ❌ Perform sorting inside render function (performance hit)

### Profiling

If performance issues arise:

1. Open React DevTools Profiler
2. Record interaction (expand directory, switch tab)
3. Check "Ranked" view for slow components
4. Verify `sortTree` memoization is working (should only run when dependencies change)

**Expected Profile**:
- Initial sort: 5-10ms (acceptable)
- Re-render without changes: 0ms (memoized)
- Tab switch: 5-10ms (re-sort for new filtered tree)

---

## Troubleshooting

### Issue: Files not sorted

**Symptoms**: Files appear in random order

**Diagnosis**:
- Check `sortedTree` is being used in `flattenedNodes` (not `filteredTree`)
- Verify `sortTree` import is correct
- Check browser console for TypeScript errors

**Fix**: Ensure `traverse(sortedTree, ...)` uses `sortedTree`

---

### Issue: Sorting too slow (>100ms)

**Symptoms**: Lag when switching tabs or expanding directories

**Diagnosis**:
- Check tree size (>10,000 nodes?)
- Verify memoization dependencies are correct
- Use React DevTools Profiler to identify bottleneck

**Fix**:
- Ensure `useMemo` dependencies are minimal
- Check for accidental object recreation in dependencies

---

### Issue: Tests failing

**Symptoms**: `npm test` reports failures

**Diagnosis**:
- Check test setup (`@testing-library/react` installed?)
- Verify mock data has correct structure
- Check for missing Zustand store setup in tests

**Fix**: Wrap component in Zustand provider or mock store functions

---

## Next Steps

After completing this implementation:

1. **Run full test suite**: `npm test`
2. **Type check**: `npm run type-check`
3. **Lint**: `npm run lint`
4. **Manual QA**: Upload various app binaries and verify sorting
5. **Create PR**: Reference spec `/specs/002-sort-by-size/spec.md`

### Future Enhancements (Out of Scope)

- Add UI controls to toggle sort order (ascending/descending)
- Add visual indicators showing current sort state (arrows in header)
- Support multi-column sorting (primary + secondary criteria)
- Persist sort preferences in localStorage

---

## Resources

- **Spec**: `/specs/002-sort-by-size/spec.md`
- **Plan**: `/specs/002-sort-by-size/plan.md`
- **Research**: `/specs/002-sort-by-size/research.md`
- **Data Model**: `/specs/002-sort-by-size/data-model.md`
- **Contracts**: `/specs/002-sort-by-size/contracts/component-interface.ts`

- **sortTree() Source**: `/src/lib/analysis/breakdown-generator.ts` (lines 232-265)
- **Store Source**: `/src/store/analysis-store.ts`
- **Component Source**: `/src/components/breakdown/BreakdownTable.tsx`

---

## Support

For questions or issues during implementation:

1. Review research.md for technical decisions
2. Check data-model.md for data structure details
3. Reference component-interface.ts for type contracts
4. Review existing `sortTree()` implementation in breakdown-generator.ts

**Estimated Implementation Time**: 1-2 hours (excluding tests)
**Estimated Testing Time**: 2-3 hours (unit + component tests)
