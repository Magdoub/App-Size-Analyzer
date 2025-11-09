# API Contracts

**Feature**: 004-insights-improvements
**Date**: 2025-11-08

## Overview

This feature does NOT introduce any new API contracts. All changes are UI/presentation layer only.

## Existing Interfaces (Reference Only)

### Component Props

The feature modifies existing React components with the following prop interfaces:

#### InsightCard

```typescript
// src/components/insights/InsightCard.tsx
interface InsightCardProps {
  insight: InsightResult;  // Existing - no changes
}
```

**Usage**: Pass an `InsightResult` object to render an insight card.

**No breaking changes**: All existing props remain the same.

---

#### InsightsView

```typescript
// src/components/insights/InsightsView.tsx
// No props - this is a container component
export function InsightsView(): JSX.Element
```

**Usage**: Renders the entire insights view with filters, grouping, and insight cards.

**No breaking changes**: No props interface to break.

---

### Zustand Store Contract

The feature extends the Zustand store with one new field and action:

```typescript
// src/store/analysis-store.ts
export interface AnalysisStore {
  // ... existing fields ...

  // NEW: Grouping preference
  insightsGroupBySeverity: boolean;

  // NEW: Action to toggle grouping
  setInsightsGroupBySeverity: (groupBySeverity: boolean) => void;
}
```

**Backward Compatibility**: ✅ Fully backward compatible
- Existing consumers of the store are not affected
- New field has a default value (`true`)
- New action is opt-in

---

### Internal Component Contracts

#### SeveritySection (New Component)

```typescript
// src/components/insights/SeveritySection.tsx (NEW FILE)
interface SeveritySectionProps {
  severity: InsightSeverity;     // 'critical' | 'high' | 'medium' | 'low'
  insights: InsightResult[];     // Pre-filtered insights for this severity
}

export function SeveritySection({ severity, insights }: SeveritySectionProps): JSX.Element
```

**Purpose**: Renders a severity group header + list of insights for that severity level.

**Example Usage**:
```tsx
<SeveritySection severity="critical" insights={groupedInsights.critical} />
```

---

## Data Contracts (No Changes)

All existing data type contracts remain unchanged:

- `InsightResult` (src/types/insights.ts) - ✅ No changes
- `AffectedItem` (src/types/insights.ts) - ✅ No changes
- `InsightSeverity` (src/types/insights.ts) - ✅ No changes
- `InsightCategory` (src/types/insights.ts) - ✅ No changes

---

## Public API Surface

This feature has **no public API surface**. All changes are internal to the Insights view components.

**Consumers**: None - this is a standalone UI feature within the Size Analyzer application.

---

## Testing Contracts

### Component Testing Interface

```typescript
// Testing utilities for InsightsView
import { render, screen } from '@testing-library/react';
import { InsightsView } from './InsightsView';

// Test helper: Setup mock store with insights
function renderInsightsViewWithData(insights: InsightResult[]) {
  // Mock Zustand store
  // Render component
  // Return queries and helpers
}
```

**No breaking changes to test utilities** - existing test patterns remain valid.

---

## Migration Guide

**For existing code**: No migration needed. All changes are additive and backward compatible.

**For new code using grouping**:

```typescript
import { useAnalysisStore } from '@/store/analysis-store';

function MyComponent() {
  const { insightsGroupBySeverity, setInsightsGroupBySeverity } = useAnalysisStore();

  return (
    <button onClick={() => setInsightsGroupBySeverity(!insightsGroupBySeverity)}>
      {insightsGroupBySeverity ? 'Show Flat List' : 'Group by Severity'}
    </button>
  );
}
```

---

## Summary

**No external API contracts** - this is a purely internal UI enhancement.

**No breaking changes** - all modifications are additive and backward compatible.

**Type safety maintained** - all new code uses TypeScript strict mode with full type coverage.
