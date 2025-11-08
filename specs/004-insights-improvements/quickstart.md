# Quickstart Guide: Enhanced Insights Experience

**Feature**: 004-insights-improvements
**Date**: 2025-11-08
**Audience**: Developers working on the Size Analyzer codebase

## Overview

This guide helps developers understand, test, and extend the enhanced Insights experience. The feature transforms the Insights page from a fixed-height container with nested scrolling to a full-page scrollable layout with improved visual design and severity-based grouping.

---

## Quick Start (TL;DR)

```bash
# 1. Checkout the feature branch
git checkout 004-insights-improvements

# 2. Install dependencies (if needed)
npm install

# 3. Start dev server
npm run dev

# 4. Navigate to Insights view
# - Upload an .ipa or .apk file
# - Click "Insights" tab
# - Verify full-page scrolling works
# - Toggle "Group by Severity" button

# 5. Run tests
npm run test
```

---

## Architecture Overview

### Key Files Modified

```
src/
├── components/
│   └── insights/
│       ├── InsightsView.tsx          # MODIFIED - removed maxHeight, added grouping
│       ├── InsightCard.tsx           # MODIFIED - enhanced visual design
│       ├── SeveritySection.tsx       # NEW - severity group header
│       └── InsightFilters.tsx        # MODIFIED - added grouping toggle
├── store/
│   └── analysis-store.ts             # MODIFIED - added insightsGroupBySeverity
└── types/
    └── insights.ts                   # NO CHANGES - reference only
```

### Data Flow

```
[User uploads app] → [Analysis runs] → [Insight Engine executes rules]
                                              ↓
                              [InsightResult[] stored in Zustand]
                                              ↓
                      [InsightsView filters + groups insights]
                                              ↓
                    [Renders SeveritySection × severity levels]
                                              ↓
                          [InsightCard × N insights per section]
```

---

## Development Scenarios

### Scenario 1: Testing the Full-Page Scrolling Fix

**What Changed**: Removed `style={{ maxHeight: 'calc(100vh - 350px)' }}` from the insights list container.

**How to Test**:
1. Start dev server: `npm run dev`
2. Upload a sample .ipa or .apk file (use test fixtures if available)
3. Navigate to Insights tab
4. **Expected Behavior**:
   - The entire page scrolls from top to bottom
   - No nested scrollbar inside the insights list
   - Header, insights, and footer all flow naturally
5. **Test with Multiple Insights**: Generate at least 10+ insights to ensure scrolling behavior
6. **Test on Different Viewports**: Resize browser to 1024px, 1440px, 1920px, 2560px widths

**Code Reference**: `src/components/insights/InsightsView.tsx:177`

---

### Scenario 2: Testing Severity-Based Grouping

**What Changed**: Added `insightsGroupBySeverity` toggle and grouping logic.

**How to Test**:
1. Ensure you have insights across multiple severity levels (critical, high, medium, low)
2. Look for "Group by Severity" toggle button in the filters area
3. **When Grouped (default)**:
   - Insights appear under section headers: "🔴 Critical Issues (N)", "🟠 High Priority (N)", etc.
   - Insights within each severity are sorted by potential savings (highest first)
4. **When Flat (toggle off)**:
   - All insights appear in a single list, sorted by severity then savings
5. **Filter + Group Interaction**:
   - Apply severity filter (e.g., show only critical)
   - Verify grouping still works (only "Critical" section shows)

**Code Reference**: `src/components/insights/InsightsView.tsx` (grouping logic in useMemo)

---

### Scenario 3: Testing Enhanced Visual Design

**What Changed**: Improved severity indicators, savings display, category tags, fix suggestions.

**How to Test**:
1. Open an insight card
2. **Visual Checks**:
   - Severity badge is clearly visible (CRITICAL, HIGH, MEDIUM, LOW)
   - Background colors are distinct (red-50, orange-50, yellow-50, blue-50)
   - Critical/high insights have more visual weight (thicker border or shadow)
   - Savings display is prominent (large font, bold)
   - Category tag appears near the title
   - Fix suggestion has clear visual styling (icon, border, or background)
3. **Expand/Collapse Animation**:
   - Click "Show Affected Files" button
   - Verify smooth animation (<300ms)
   - Verify list of files displays correctly

**Code Reference**: `src/components/insights/InsightCard.tsx`

---

### Scenario 4: Adding a New Insight Rule (Integration)

**Use Case**: You want to add a new analysis rule and see it displayed in the enhanced UI.

**Steps**:

1. **Create the rule** in `src/lib/analysis/insight-rules.ts`:

```typescript
export const newRule: InsightRule = {
  id: 'R999',
  category: 'optimization',
  name: 'Example Rule',
  description: 'Detects some optimization opportunity',
  severity: 'medium',

  execute: async (context: AnalysisContext): Promise<InsightResult[]> => {
    // Your rule logic here
    return [
      {
        ruleId: 'R999',
        title: 'Example Optimization Found',
        description: 'This is an example insight',
        severity: 'medium',
        category: 'optimization',
        affectedItems: [
          {
            path: 'assets/example.png',
            size: 100000,
            reason: 'Could be optimized',
          },
        ],
        potentialSavings: 40000,
        percentOfTotal: 2.0,
        actionable: true,
        fixSuggestion: 'Compress the example.png file',
      },
    ];
  },
};
```

2. **Register the rule** in `src/lib/analysis/index.ts`:

```typescript
import { newRule } from './insight-rules';

export function getDefaultInsightEngine(): InsightEngine {
  return new InsightEngine({
    rules: [
      // ... existing rules ...
      newRule,
    ],
    enabledCategories: new Set(['duplicates', 'optimization', 'unused', 'over-bundling', 'compression', 'architecture']),
    minimumSeverity: 'low',
    cacheResults: true,
  });
}
```

3. **Test the rule**:
   - Upload an app that matches your rule's criteria
   - Navigate to Insights tab
   - Verify your new insight appears with:
     - Correct severity color
     - Category tag
     - Savings display
     - Fix suggestion
     - Expandable affected items list

4. **Verify grouping**:
   - If severity is "medium", it should appear in the "Medium Priority" section when grouped
   - It should be sorted by savings within its severity group

---

### Scenario 5: Customizing Severity Colors

**Use Case**: You want to change the color scheme for severity levels.

**Steps**:

1. **Locate color definitions** in `src/components/insights/InsightCard.tsx`:

```typescript
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-900'; // ← Modify here
    case 'high':
      return 'bg-orange-50 border-orange-200 text-orange-900';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    case 'low':
      return 'bg-blue-50 border-blue-200 text-blue-900';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-900';
  }
};
```

2. **Update Tailwind classes** to new colors (ensure they exist in your Tailwind config)

3. **Verify contrast ratios** meet WCAG AAA (7:1):
   - Use a contrast checker: https://webaim.org/resources/contrastchecker/
   - Background (light color) vs. Text (dark color)

4. **Update section headers** in `src/components/insights/SeveritySection.tsx` (if applicable)

---

## Testing Guide

### Unit Tests

**Test the grouping logic**:

```typescript
// src/components/insights/__tests__/InsightsView.test.tsx
import { render, screen } from '@testing-library/react';
import { InsightsView } from '../InsightsView';
import { useAnalysisStore } from '@/store/analysis-store';

describe('InsightsView - Grouping', () => {
  it('should group insights by severity when enabled', () => {
    // Setup mock store with sample insights
    useAnalysisStore.setState({
      insights: [
        { severity: 'critical', title: 'Critical Issue', /* ... */ },
        { severity: 'high', title: 'High Issue', /* ... */ },
        { severity: 'medium', title: 'Medium Issue', /* ... */ },
      ],
      insightsGroupBySeverity: true,
    });

    render(<InsightsView />);

    // Verify section headers appear
    expect(screen.getByText(/Critical Issues/i)).toBeInTheDocument();
    expect(screen.getByText(/High Priority/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium Priority/i)).toBeInTheDocument();
  });

  it('should show flat list when grouping is disabled', () => {
    useAnalysisStore.setState({
      insights: [/* ... */],
      insightsGroupBySeverity: false,
    });

    render(<InsightsView />);

    // Verify no section headers
    expect(screen.queryByText(/Critical Issues/i)).not.toBeInTheDocument();
  });
});
```

### Integration Tests

**Test the full workflow**:

```typescript
// src/components/insights/__tests__/InsightsView.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsightsView } from '../InsightsView';

describe('InsightsView - Full Workflow', () => {
  it('should analyze app, group insights, and allow filtering', async () => {
    // 1. Setup: Load analysis data
    // 2. Wait for insights to be computed
    await waitFor(() => {
      expect(screen.getByText(/Optimization Insights/i)).toBeInTheDocument();
    });

    // 3. Verify grouping is active
    expect(screen.getByText(/Critical Issues/i)).toBeInTheDocument();

    // 4. Apply severity filter
    const criticalFilter = screen.getByRole('button', { name: /Critical/i });
    await userEvent.click(criticalFilter);

    // 5. Verify only critical insights are visible
    expect(screen.queryByText(/High Priority/i)).not.toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

- [ ] **Scrolling**: Full-page scroll works without nested scrollbars
- [ ] **Grouping**: Insights group by severity with section headers
- [ ] **Sorting**: Within each severity group, insights sorted by savings (highest first)
- [ ] **Filtering**: Severity and category filters work correctly
- [ ] **Toggle**: "Group by Severity" button toggles between grouped and flat view
- [ ] **Visual Design**: Severity colors, badges, savings display are clear and prominent
- [ ] **Expand/Collapse**: Smooth animation (<300ms) when showing/hiding affected files
- [ ] **Empty States**: "No insights" and "No matching filters" display correctly
- [ ] **Responsive**: Layout works at 1024px, 1440px, 1920px, 2560px widths
- [ ] **Performance**: 200 insights render and filter within 100ms
- [ ] **Accessibility**: Keyboard navigation, screen reader compatibility

---

## Performance Profiling

### Measuring Render Performance

```typescript
// Use React DevTools Profiler
import { Profiler } from 'react';

<Profiler id="InsightsView" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <InsightsView />
</Profiler>
```

**Benchmarks** (target):
- Initial render (50 insights): < 250ms
- Initial render (200 insights): < 500ms
- Filter update: < 100ms
- Grouping toggle: < 100ms
- Expand/collapse: < 300ms

### Measuring Scroll Performance

1. Open Chrome DevTools → Performance tab
2. Start recording
3. Scroll the Insights page
4. Stop recording
5. Check frame rate (should be consistently 60fps)

**Red Flags**:
- Frame rate drops below 30fps
- Long tasks (>50ms) during scrolling
- Excessive re-renders

---

## Debugging Tips

### Issue: Grouping Not Working

**Symptoms**: All insights appear in flat list even when `insightsGroupBySeverity: true`

**Debug Steps**:
1. Check Zustand state: `useAnalysisStore.getState().insightsGroupBySeverity`
2. Verify grouping logic in `useMemo` is executing
3. Check console for errors in grouping function
4. Ensure insights have valid `severity` values

---

### Issue: Nested Scrollbar Still Appears

**Symptoms**: Scrollbar inside insights list container instead of full-page scroll

**Debug Steps**:
1. Inspect element: Verify `overflow-y-auto` is NOT present on insights list
2. Check for `maxHeight` or `height` CSS that constrains the container
3. Verify parent container uses `flex-col` and doesn't have fixed height
4. Check browser zoom level (sometimes causes unexpected scroll behavior)

---

### Issue: Poor Performance with Many Insights

**Symptoms**: Lag when filtering, scrolling, or expanding cards

**Debug Steps**:
1. Use React DevTools Profiler to identify slow components
2. Check `useMemo` dependencies are correct (avoiding unnecessary recalculations)
3. Verify `InsightCard` is wrapped in `React.memo`
4. Check for expensive operations inside render functions
5. Consider reducing number of insights for testing (ensure real-world data doesn't exceed 200)

---

## Common Customization Patterns

### Adding a New Severity Level

**Scenario**: You want to add a "warning" severity level between "medium" and "low".

**Steps**:

1. Update type definition:
```typescript
// src/types/insights.ts
export type InsightSeverity = 'critical' | 'high' | 'medium' | 'warning' | 'low';
```

2. Add color scheme:
```typescript
// src/components/insights/InsightCard.tsx
case 'warning':
  return 'bg-purple-50 border-purple-200 text-purple-900';
```

3. Update grouping order:
```typescript
// src/components/insights/InsightsView.tsx
interface GroupedInsights {
  critical: InsightResult[];
  high: InsightResult[];
  medium: InsightResult[];
  warning: InsightResult[];  // NEW
  low: InsightResult[];
}
```

4. Update rendering logic to include new section

---

### Adding a Category Filter Badge

**Scenario**: You want to add quick-filter badges for each category (similar to severity filters).

**Steps**:

1. Update `InsightFilters.tsx` to add category badges:
```tsx
<div className="flex gap-2">
  {(['duplicates', 'optimization', 'unused'] as InsightCategory[]).map((category) => (
    <button
      key={category}
      onClick={() => onCategoryToggle(category)}
      className={selectedCategories.has(category) ? 'active' : 'inactive'}
    >
      {category}
    </button>
  ))}
</div>
```

2. Wire up to existing `handleCategoryToggle` in `InsightsView.tsx`

---

## Troubleshooting

### Problem: Changes Not Reflecting in Browser

**Solution**:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart dev server: `npm run dev`

---

### Problem: TypeScript Errors After Modifying Store

**Solution**:
1. Ensure you updated both the interface AND the implementation
2. Run type check: `npm run type-check`
3. Check that Zustand store initialization includes new fields with default values

---

### Problem: Tests Failing After Changes

**Solution**:
1. Update test snapshots: `npm run test -- -u`
2. Check that mocked store includes new fields
3. Verify test fixtures have valid data for new requirements

---

## Next Steps

After completing development:

1. **Run full test suite**: `npm run test`
2. **Type check**: `npm run type-check`
3. **Lint code**: `npm run lint`
4. **Format code**: `npm run format`
5. **Build for production**: `npm run build`
6. **Create pull request** with reference to this spec

---

## Resources

- **Spec Document**: `specs/004-insights-improvements/spec.md`
- **Research**: `specs/004-insights-improvements/research.md`
- **Data Model**: `specs/004-insights-improvements/data-model.md`
- **Implementation Plan**: `specs/004-insights-improvements/plan.md`
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **Zustand Docs**: https://docs.pmnd.rs/zustand/getting-started/introduction

---

## Support

**Questions or Issues?**
- Check the spec documents in `specs/004-insights-improvements/`
- Review the research document for design decisions and rationale
- Consult the data model for state management details
- Reference existing X-Ray UX improvements (003) as a similar enhancement pattern
