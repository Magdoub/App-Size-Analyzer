# Data Model: Enhanced Insights Experience

**Feature**: 004-insights-improvements
**Date**: 2025-11-08

## Overview

This document defines the data structures and state management for the enhanced Insights experience. The feature primarily uses existing data models with minor additions to support severity-based grouping.

## State Management

### Zustand Store Extensions

The `AnalysisStore` (src/store/analysis-store.ts) will be extended with one new field to support severity grouping:

```typescript
export interface AnalysisStore {
  // ... existing fields ...

  // Insights view state
  insights: InsightResult[];                          // Existing
  insightsSeverityFilter: Set<InsightSeverity>;       // Existing
  insightsCategoryFilter: Set<InsightCategory>;       // Existing
  insightsGroupBySeverity: boolean;                   // NEW - default: true

  // ... existing actions ...

  // Insights actions
  setInsights: (insights: InsightResult[]) => void;                   // Existing
  setInsightsSeverityFilter: (severities: Set<InsightSeverity>) => void;  // Existing
  setInsightsCategoryFilter: (categories: Set<InsightCategory>) => void;  // Existing
  setInsightsGroupBySeverity: (groupBySeverity: boolean) => void;    // NEW
}
```

**Rationale**: The grouping preference is UI state that should persist across filter changes and component re-renders. Zustand is already used for all Insights view state.

---

## Existing Data Models (Reference Only)

These models are defined in `src/types/insights.ts` and will NOT be modified:

### InsightResult

```typescript
export interface InsightResult {
  ruleId: string;                    // Reference to InsightRule.id
  title: string;                     // Display title
  description: string;               // Detailed description
  severity: InsightSeverity;         // 'critical' | 'high' | 'medium' | 'low'
  category: InsightCategory;         // 'duplicates' | 'optimization' | 'unused' | etc.

  affectedItems: AffectedItem[];     // Files flagged by this insight
  potentialSavings: number;          // Estimated bytes saved
  percentOfTotal: number;            // Percentage of total app size

  actionable: boolean;               // Can user take action
  fixSuggestion?: string;            // How to fix (optional)
}
```

**Usage**: Primary data structure for each insight card. All fields are already present and will be used as-is.

---

### AffectedItem

```typescript
export interface AffectedItem {
  path: string;                      // File path
  size: number;                      // File size in bytes
  reason: string;                    // Why it's flagged
  metadata?: Record<string, unknown>; // Additional context
}
```

**Usage**: Represents individual files within an expanded insight. Displayed in expandable section of InsightCard.

---

### InsightSeverity

```typescript
export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low';
```

**Usage**: Determines visual styling (colors, borders) and grouping order.

**Priority Order**: critical > high > medium > low (for sorting and grouping)

---

### InsightCategory

```typescript
export type InsightCategory =
  | 'duplicates'        // Duplicate files
  | 'optimization'      // Asset optimization opportunities
  | 'unused'            // Unused resources
  | 'over-bundling'     // Excessive bundling
  | 'compression'       // Compression opportunities
  | 'architecture';     // Multi-arch bloat
```

**Usage**: Displayed as a tag/chip on insight cards. Used for category filtering.

---

## Computed/Derived Data

### Grouped Insights Structure

When `insightsGroupBySeverity === true`, the component will transform the flat `insights` array into a grouped structure:

```typescript
interface GroupedInsights {
  critical: InsightResult[];
  high: InsightResult[];
  medium: InsightResult[];
  low: InsightResult[];
}

// Computation in InsightsView.tsx
const groupedInsights = useMemo(() => {
  if (!insightsGroupBySeverity) {
    return null; // Flat list mode
  }

  const groups: GroupedInsights = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  filteredInsights.forEach((insight) => {
    groups[insight.severity].push(insight);
  });

  // Sort within each group by potentialSavings (descending)
  Object.values(groups).forEach((group) => {
    group.sort((a, b) => b.potentialSavings - a.potentialSavings);
  });

  return groups;
}, [filteredInsights, insightsGroupBySeverity]);
```

**Rendering Logic**:
```typescript
// Flat list mode
if (!groupedInsights) {
  return filteredInsights.map(insight => <InsightCard insight={insight} />);
}

// Grouped mode
return (
  <>
    {groupedInsights.critical.length > 0 && (
      <SeveritySection severity="critical" insights={groupedInsights.critical} />
    )}
    {groupedInsights.high.length > 0 && (
      <SeveritySection severity="high" insights={groupedInsights.high} />
    )}
    {groupedInsights.medium.length > 0 && (
      <SeveritySection severity="medium" insights={groupedInsights.medium} />
    )}
    {groupedInsights.low.length > 0 && (
      <SeveritySection severity="low" insights={groupedInsights.low} />
    )}
  </>
);
```

---

## Component State (Local)

### InsightCard Component

```typescript
// src/components/insights/InsightCard.tsx
interface InsightCardState {
  isExpanded: boolean;  // Existing - controls affected items visibility
}

// Uses useState locally - does NOT need global state
const [isExpanded, setIsExpanded] = useState(false);
```

**Rationale**: Expansion state is purely local to each card and does not need to be shared or persisted.

---

### InsightsView Component

```typescript
// src/components/insights/InsightsView.tsx
interface InsightsViewLocalState {
  isAnalyzing: boolean;  // Existing - loading state
  error: string | null;  // Existing - error state
}

// Uses useState locally
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Rationale**: Analysis loading/error state is temporary and specific to this view.

---

## Data Flow

```
[Insight Engine] → [Zustand Store: insights[]]
                    ↓
       [InsightsView: filters + groups]
                    ↓
         [filteredInsights + groupedInsights]
                    ↓
              [InsightCard × N]
```

**Steps**:
1. **Analysis**: `insight-engine.ts` executes rules, produces `InsightResult[]`
2. **Storage**: Results stored in Zustand via `setInsights(results)`
3. **Filtering**: `InsightsView` applies severity/category filters → `filteredInsights`
4. **Grouping**: If enabled, `filteredInsights` transformed to `groupedInsights`
5. **Rendering**: Each `InsightCard` receives an `InsightResult` and renders independently

---

## Performance Considerations

### Memoization Strategy

```typescript
// Filter insights (O(n) where n = insights.length)
const filteredInsights = useMemo(() => {
  let filtered = insights;

  if (insightsSeverityFilter.size > 0) {
    filtered = filtered.filter((insight) =>
      insightsSeverityFilter.has(insight.severity)
    );
  }

  if (insightsCategoryFilter.size > 0) {
    filtered = filtered.filter((insight) =>
      insightsCategoryFilter.has(insight.category)
    );
  }

  return filtered;
}, [insights, insightsSeverityFilter, insightsCategoryFilter]);

// Group insights (O(n) + O(n log n) for sorting within groups)
const groupedInsights = useMemo(() => {
  // ... grouping logic ...
}, [filteredInsights, insightsGroupBySeverity]);
```

**Complexity Analysis**:
- **Filtering**: O(n) where n = number of insights
- **Grouping**: O(n) for distribution + O(k * m log m) for sorting, where k = 4 severity levels, m = insights per level
- **Total**: O(n log n) in worst case (all insights in one severity level)

**Performance at Scale**:
- n = 50 (typical): ~0.5ms
- n = 200 (edge case): ~2ms
- Both well within 100ms requirement ✅

---

## Entity Relationships

```
AnalysisContext (1) ──────< InsightResult (N)
                               │
                               │
                               └───────< AffectedItem (N)

Filters (UI State)
  ↓
insightsSeverityFilter (Set<InsightSeverity>)
insightsCategoryFilter (Set<InsightCategory>)
insightsGroupBySeverity (boolean)
```

**Cardinality**:
- One `AnalysisContext` has many `InsightResult`s
- One `InsightResult` has many `AffectedItem`s
- Filters are independent UI state that transforms the insight list

---

## Validation Rules

### InsightResult
- `potentialSavings` must be >= 0
- `percentOfTotal` must be 0-100
- `affectedItems` length must match actual items found
- `severity` must be one of: 'critical' | 'high' | 'medium' | 'low'
- `category` must be one of the 6 defined categories

**Validation Location**: `insight-engine.ts` (already implemented, no changes needed)

---

## State Transitions

### Grouping Toggle

```
[User clicks "Group by Severity" toggle]
  ↓
setInsightsGroupBySeverity(!insightsGroupBySeverity)
  ↓
Zustand updates state
  ↓
InsightsView re-renders
  ↓
useMemo recomputes groupedInsights
  ↓
Render switches between flat list / grouped sections
```

**Performance**: State update + re-render < 100ms for 200 insights ✅

---

### Filter Change

```
[User clicks severity filter badge]
  ↓
handleSeverityToggle(severity)
  ↓
setInsightsSeverityFilter(newFilterSet)
  ↓
Zustand updates state
  ↓
InsightsView re-renders
  ↓
useMemo recomputes filteredInsights
  ↓
useMemo recomputes groupedInsights (if enabled)
  ↓
Render updates visible insights
```

**Performance**: State update + re-render + filtering < 100ms for 200 insights ✅

---

## Storage and Persistence

**Current**: All state is **in-memory only** (Zustand store, no localStorage)

**For this feature**: Maintain in-memory only approach. No persistence needed.

**Rationale**:
- Insights are recalculated each time an app is analyzed
- Filter/grouping preferences don't need to persist across sessions
- Keeps implementation simple and stateless

---

## Type Safety

All data structures use **TypeScript strict mode** with:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

**Example**:
```typescript
// Type-safe filter operations
const filteredInsights = useMemo(() => {
  let filtered = insights; // InsightResult[]

  if (insightsSeverityFilter.size > 0) {
    // TypeScript knows insight.severity is InsightSeverity
    filtered = filtered.filter((insight) =>
      insightsSeverityFilter.has(insight.severity)
    );
  }

  return filtered;
}, [insights, insightsSeverityFilter, insightsCategoryFilter]);
```

---

## Migration Notes

**No data migration needed** - this is a purely additive change:
- Adding one new field: `insightsGroupBySeverity: boolean`
- Default value: `true` (enables grouping by default)
- All existing data structures remain unchanged

---

## Testing Data

### Fixture: Sample Insights for Testing

```typescript
// specs/004-insights-improvements/fixtures/sample-insights.ts
export const sampleInsights: InsightResult[] = [
  {
    ruleId: 'R001',
    title: 'Duplicate Images Found',
    description: 'Multiple identical image files detected',
    severity: 'high',
    category: 'duplicates',
    affectedItems: [
      { path: 'assets/icon.png', size: 50000, reason: 'Duplicate of assets/images/icon.png' },
      { path: 'assets/images/icon.png', size: 50000, reason: 'Original' },
    ],
    potentialSavings: 50000,
    percentOfTotal: 2.5,
    actionable: true,
    fixSuggestion: 'Keep only one copy and update references',
  },
  {
    ruleId: 'R002',
    title: 'Unoptimized PNG Images',
    description: 'PNG files can be compressed further',
    severity: 'medium',
    category: 'optimization',
    affectedItems: [
      { path: 'assets/splash.png', size: 200000, reason: 'Can be reduced by ~40%' },
    ],
    potentialSavings: 80000,
    percentOfTotal: 4.0,
    actionable: true,
    fixSuggestion: 'Use ImageOptim or similar tool',
  },
  {
    ruleId: 'R003',
    title: 'Unused Asset Files',
    description: 'Asset files not referenced in code',
    severity: 'critical',
    category: 'unused',
    affectedItems: [
      { path: 'assets/legacy/old-logo.png', size: 150000, reason: 'Not referenced anywhere' },
      { path: 'assets/unused/banner.jpg', size: 300000, reason: 'Not referenced anywhere' },
    ],
    potentialSavings: 450000,
    percentOfTotal: 22.5,
    actionable: true,
    fixSuggestion: 'Remove unused files from assets directory',
  },
];
```

**Test Scenarios**:
- **Grouping**: Should group into critical (1), high (1), medium (1)
- **Filtering**: Filter by severity should show subset
- **Sorting**: Within severity groups, should sort by savings (critical: 450KB, high: 50KB, medium: 80KB)

---

## Summary

**Changes Required**:
1. Add `insightsGroupBySeverity: boolean` to `AnalysisStore` (default: true)
2. Add `setInsightsGroupBySeverity` action to Zustand store
3. Add grouping logic in `InsightsView.tsx` using `useMemo`
4. Create `SeveritySection` component for grouped rendering

**No Changes Needed**:
- Existing `InsightResult`, `AffectedItem` types ✅
- Existing insight engine and rules ✅
- Existing filter logic ✅

**Performance Impact**: Minimal (< 2ms for 200 insights) ✅

**Type Safety**: Full TypeScript coverage maintained ✅
