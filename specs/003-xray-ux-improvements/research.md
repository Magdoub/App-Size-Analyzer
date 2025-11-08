# Technical Research: X-Ray Visualization UX Improvements

**Feature**: 003-xray-ux-improvements
**Date**: 2025-11-08
**Status**: Phase 0 Complete

## Overview

This document captures technical research and decisions for implementing UX improvements to the X-Ray treemap visualization. Research focuses on: Nivo treemap customization capabilities, label rendering with size thresholds, WCAG AA color contrast compliance, zoom animation performance, details panel UI patterns, and cross-hierarchy search implementation.

---

## Research Areas

### 1. Nivo Treemap Customization for On-Box Labels

**Question**: Can we display item names (not sizes) directly on treemap boxes with a minimum size threshold of 50x20 pixels, while keeping tooltips for hover metadata?

**Research Findings**:

Nivo's `ResponsiveTreeMapCanvas` (currently used in `src/components/xray/Treemap.tsx`) uses Canvas rendering for performance with large datasets. Key properties:

- **`label` prop**: Accepts function `(node) => string` to customize what text appears on boxes
- **`labelSkipSize` prop**: Minimum pixel dimension (width or height) before label is rendered (currently set to `1`)
- **`labelTextColor` prop**: Function to determine text color based on background for readability
- **`orientLabel` prop**: Currently `false` - keeps labels horizontal
- **Canvas vs SVG**: Canvas version (ResponsiveTreeMapCanvas) performs better for 1000+ nodes but has limited hover/interaction customization compared to SVG version

**Decision**:
- Use the `label` prop to return `node.data.name` instead of formatted size
- Set `labelSkipSize` to calculate minimum area: We need a **custom approach** since `labelSkipSize` is a single dimension, but we need both width AND height ≥ threshold
- **Solution**: Use Nivo's `nodeComponent` prop (if available in Canvas version) OR calculate label visibility in the `label` function by checking `node.width` and `node.height` properties
- **Fallback**: If Canvas version doesn't expose node dimensions in `label` function, we may need to switch to `ResponsiveTreeMap` (SVG) for better control, with performance testing for 1000+ nodes

**Alternatives Considered**:
- Using `valueFormat` to show names - rejected because this formats the numeric value, not the label
- Custom Canvas overlay - rejected as too complex and breaks Nivo's built-in interactions
- Always showing labels regardless of size - rejected due to readability issues on tiny boxes

**Implementation Notes**:
- Create utility function `shouldShowLabel(node)` that checks `node.width >= 50 && node.height >= 20`
- Use this in `label` prop: `label={(node) => shouldShowLabel(node) ? node.data.name : ''}`
- Test with actual treemap data to verify node dimensions are accessible in Canvas version

---

### 2. WCAG AA Color Contrast Compliance

**Question**: How do we ensure the existing "Color by Type" and "Color by Size" modes meet WCAG AA standards (4.5:1 for text, 3:1 for graphical elements)?

**Research Findings**:

Current implementation in `src/lib/visualization/color-scheme.ts`:
- Uses hardcoded hex colors for content types (e.g., `'#3b82f6'` for executables)
- Uses color intensity scaling for "Color by Size" mode
- `getLabelColor()` returns black or white based on simple brightness check

WCAG AA Requirements:
- **Text contrast**: 4.5:1 minimum for normal text, 3:1 for large text (18pt+ or 14pt+ bold)
- **Graphical elements**: 3:1 minimum for UI components and graphics
- **Calculation**: Relative luminance formula from WCAG 2.1 spec

**Decision**:
- Install `polished` library (or lightweight alternative like `color2k`) for programmatic color contrast calculation
- Update `getNodeColor()` to validate all colors against WCAG AA thresholds
- For "Color by Type": Pre-validate color palette and adjust hues if needed (darker blues, lighter yellows)
- For "Color by Size": Ensure gradient steps maintain minimum 3:1 contrast with white borders
- Update `getLabelColor()` to use proper contrast ratio calculation instead of brightness heuristic

**Alternatives Considered**:
- Manual color adjustment - rejected as error-prone and not maintainable
- Using only grayscale for "Color by Size" - rejected as less visually appealing
- Relying on Nivo's default colors - rejected as we need custom type-based coloring

**Implementation Notes**:
- Add `color2k` dependency (10KB, zero dependencies)
- Create `calculateContrastRatio(foreground, background)` utility
- Create `ensureWCAGContrast(color, background, minRatio)` that adjusts color if needed
- Add unit tests in `src/__tests__/lib/visualization/color-scheme.test.ts` with WCAG test cases

**Color Palette Updates** (if needed after testing):
```typescript
// Example adjustments for better contrast
executables: '#2563eb'    // Darker blue (was #3b82f6)
frameworks: '#059669'     // Darker green
resources: '#dc2626'      // Darker red
assets: '#ca8a04'         // Darker yellow/gold
```

---

### 3. Zoom Animation Performance and Transitions

**Question**: How do we implement smooth 200-300ms zoom animations at 60fps while maintaining spatial orientation during hierarchical navigation?

**Research Findings**:

Nivo Treemap Animation:
- `animate` prop (boolean): Currently set to `false` in `Treemap.tsx`
- `motionConfig` prop: Accepts spring config (e.g., `'gentle'`, `'wobbly'`, `'stiff'`) or custom config
- **Performance**: Canvas version handles animations efficiently via requestAnimationFrame
- **Trade-off**: Enabling `animate` adds ~50-100ms to initial render

Zoom State Management (current):
- XRayView maintains `xrayZoomPath` in Zustand store
- Clicking node sets new zoom path → triggers `useMemo` re-calculation → new treemap data
- **Issue**: Instant re-render loses spatial context (no animation)

**Decision**:
- Enable `animate={true}` in Treemap component
- Use `motionConfig="gentle"` for smooth, natural transitions (300ms spring)
- Add CSS transitions for breadcrumb appearance (fade-in 200ms)
- **Optimization**: Memoize `generateSubtreeData()` result with `useMemo([currentAnalysis, xrayZoomPath, xrayCategories])`
- **Performance Gate**: If 1000+ node animations cause lag, add `animate={data.children.length < 500}` conditional

**Alternatives Considered**:
- Custom D3.js zoom transition - rejected as too complex and duplicates Nivo functionality
- Instant zoom with fade overlay - rejected as less intuitive for spatial navigation
- Pre-render both levels and crossfade - rejected as memory-intensive

**Implementation Notes**:
- Test animation performance with large datasets (1000+ nodes) using Chrome DevTools Performance tab
- Target: 60fps (16.6ms per frame) during transitions
- Measure: Time to Interactive (TTI) should remain <500ms
- Fallback: Disable animations if frame budget is exceeded

---

### 4. Details Panel UI Pattern and Trigger Mechanism

**Question**: What's the best UI pattern for showing item metadata without conflicting with click-to-zoom? Should we use info icon button, right-click, Ctrl+Click, or always-visible panel?

**Research Findings**:

**Clarification from Spec**: Info icon button on each item - appears on hover for small items, always visible for large items

Common Patterns in Similar Tools:
1. **Sentry Treemap**: Hover tooltip + click for drill-down (no persistent details)
2. **Firefox Build Analyzer**: Sidebar panel with "pin" functionality
3. **WinDirStat**: Bottom status bar + right-click context menu
4. **macOS Disk Utility**: Inspector panel (always visible) + selection

**Decision**: Info Icon Button (as specified in spec FR-004a)
- **Small items (<100x40px)**: Info icon appears on hover (positioned top-right corner of box)
- **Large items (≥100x40px)**: Info icon always visible (positioned top-right corner)
- **Panel Type**: Slide-out from right side (300px width), overlays treemap
- **Trigger**: Click info icon → open/update panel with node details
- **Dismiss**: Close button (X) in panel header + Escape key
- **Behavior**: Clicking different info icon updates panel content (doesn't close/reopen)

**Alternatives Considered**:
- Right-click context menu - rejected as less discoverable and varies by OS
- Ctrl+Click modifier - rejected as not obvious to users (no visual affordance)
- Always-visible panel - rejected as consumes screen space unnecessarily
- Modal dialog - rejected as blocks treemap interaction

**Implementation Notes**:
- Create `<InfoIconButton />` component with conditional visibility logic
- Create `<DetailsPanel />` component with slide-in animation (300ms ease-out)
- Position icon absolutely within each treemap node container
- Use `pointer-events: none` on icon container, `pointer-events: auto` on icon itself to avoid blocking node clicks
- Add ARIA labels: `aria-label="Show details for {itemName}"`

**Panel Content Sections**:
1. Header: Item name + close button
2. Path: Full file path (scrollable, word-break)
3. Size Details: Uncompressed, compressed (if applicable), percentage of total/parent
4. Metadata: Content type, child count, depth level
5. (Future): Actions like "Zoom to this item", "Find similar files"

---

### 5. Cross-Hierarchy Search with Auto-Navigation

**Question**: How do we search the entire hierarchy (not just visible items) and automatically navigate/zoom to show matches in context?

**Research Findings**:

Current Implementation (`src/lib/visualization/treemap-generator.ts`):
- `searchTree(node, query)` function already exists
- Returns array of matching paths
- **Gap**: Only highlights matches, doesn't navigate to them

Search Requirements (from FR-019):
- Search entire hierarchy regardless of zoom level
- Automatically navigate/zoom to show matches in context
- Highlight matching items with distinct visual indicator

**Decision**: Enhance Existing Search with Navigation
1. **Search Phase**: Use existing `searchTree()` - searches full hierarchy
2. **Match Display**:
   - Show match count in UI (already implemented in XRayView.tsx:189-193)
   - Store matches in state: `searchMatches: string[]`
   - Add `currentMatchIndex: number` to state
3. **Navigation**:
   - Add "Previous/Next" buttons (or Enter/Shift+Enter keyboard shortcuts)
   - On Next: Increment `currentMatchIndex`, zoom to parent folder of `searchMatches[currentMatchIndex]`
   - **Zoom Logic**: Extract parent path, set `xrayZoomPath` to parent (so match is visible in children)
   - **Highlight**: Already implemented via `colors` prop checking `searchMatches.includes(path)` (Treemap.tsx:79)
4. **Visual Enhancement**:
   - Current match: Pulsing border animation (yellow)
   - Other matches: Static yellow highlight (existing)
   - Non-matches: Desaturate by 40% when search is active

**Alternatives Considered**:
- Auto-zoom to first match immediately - rejected as disorienting if not expected
- Open all matching paths in breadcrumb - rejected as too complex for deeply nested results
- Floating result list overlay - rejected as adds UI complexity

**Implementation Notes**:
- Add to Zustand store: `currentMatchIndex: number`, `setCurrentMatchIndex: (index: number) => void`
- Create utility `getParentPath(path: string): string` to extract parent from `"folder/subfolder/file"`
- Add keyboard handler in XRayView: `Enter` = next match, `Shift+Enter` = previous match
- Add navigation buttons in search bar (disabled when no matches)
- **Edge Case**: If match is at root level, don't zoom (highlight only)
- **Edge Case**: If multiple matches in same folder, zoom once and highlight all

**Search Performance**:
- Current `searchTree()` uses recursive traversal - O(n) where n = total nodes
- For 10,000 nodes: ~10ms on modern hardware (acceptable for <100ms goal)
- **Optimization** (if needed): Debounce search input by 300ms to avoid search on every keystroke

---

### 6. Tooltip Positioning and Overlap Prevention

**Question**: How do we ensure tooltips don't overlap with treemap boxes or other tooltips, and position them near cursor without obscuring the hovered item?

**Research Findings**:

Nivo Tooltip System:
- `tooltip` prop: Custom React component rendered in a portal
- **Positioning**: Nivo handles positioning automatically based on cursor
- **Default Behavior**: Tooltip follows cursor with offset (10px right, 10px down)
- **Overlap Prevention**: Not built-in - tooltip can obscure other items

**Current Implementation** (`Treemap.tsx:103-145`):
- Custom tooltip component with item details
- **Issue**: Long paths can create very wide tooltips that cover adjacent boxes

**Decision**: Enhance Tooltip with Smart Positioning
1. **Max Width**: Constrain tooltip to `max-width: 400px` with text wrapping
2. **Long Paths**: Use `word-break: break-all` for paths, truncate with ellipsis in middle (e.g., `Frameworks/.../ VeryLongFileName.bundle`)
3. **Nivo Theme Override**: Use `theme.tooltip.container` to add `maxWidth`, `overflow: hidden`
4. **Prevent Obscuring Hovered Item**:
   - Nivo's default offset (10px) usually sufficient
   - For items near viewport edges, Nivo automatically repositions
   - **Enhancement**: Add semi-transparent background to hovered item (via `colors` prop) when tooltip is active

**Alternatives Considered**:
- Manual tooltip positioning with Popper.js - rejected as duplicates Nivo's built-in system
- Fixed tooltip position (e.g., always top-right corner) - rejected as less intuitive
- Truncating all labels to 50 characters - rejected as users need to see full names

**Implementation Notes**:
- Update `theme.tooltip.container` in Treemap.tsx:
  ```typescript
  tooltip: {
    container: {
      background: '#ffffff',
      padding: 12,
      borderRadius: 8,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      maxWidth: 400,
      overflow: 'hidden',
      wordBreak: 'break-word',
    },
  }
  ```
- Create utility `truncateMiddle(str: string, maxLength: number): string` for paths
- Add hover state to Zustand: `hoveredNodePath: string | null`
- Modify `colors` prop to add subtle glow/border when `node.data.path === hoveredNodePath`

---

### 7. Keyboard Navigation and Accessibility

**Question**: What keyboard interactions are needed to meet WCAG AA accessibility standards for treemap navigation?

**Research Findings**:

WCAG 2.1 Requirements:
- **2.1.1 Keyboard** (Level A): All functionality available via keyboard
- **2.1.2 No Keyboard Trap** (Level A): Keyboard focus can move away from any component
- **2.4.3 Focus Order** (Level A): Sequential navigation order is logical
- **2.4.7 Focus Visible** (Level AA): Keyboard focus indicator is visible

Treemap Keyboard Challenges:
- Canvas-based treemap (ResponsiveTreeMapCanvas) doesn't have native keyboard navigation
- Hundreds of nodes make Tab navigation impractical
- Need alternative keyboard interaction pattern

**Decision**: Hybrid Keyboard Navigation
1. **Tab Navigation**:
   - Search input (focusable)
   - Color scheme toggle buttons (focusable)
   - Breadcrumb segments (focusable)
   - Details panel close button (focusable when open)
   - Treemap canvas itself (focusable via `tabIndex={0}`)
2. **Treemap Keyboard Shortcuts** (when treemap focused):
   - **Arrow Keys**: Navigate between sibling nodes (left/right/up/down)
   - **Enter**: Zoom into selected node (if has children) OR open details panel (if leaf)
   - **Escape**: Zoom out one level (go to parent)
   - **Home**: Return to root view
   - **`/` (slash)**: Focus search input
3. **Screen Reader Support**:
   - Add `role="img"` and `aria-label="Treemap visualization of app contents"` to treemap container
   - Add `aria-live="polite"` region that announces: "Zoomed into [node name], showing [X] items"
   - Breadcrumbs use `nav` role with `aria-label="Hierarchy navigation"`

**Alternatives Considered**:
- Making every node tabbable - rejected as impractical for 100+ nodes
- Using only search for keyboard navigation - rejected as incomplete (what if you don't know the name?)
- No keyboard navigation (mouse-only) - rejected as violates WCAG Level A

**Implementation Notes**:
- Add `onKeyDown` handler to treemap container
- Maintain `keyboardSelectedNodePath: string | null` in state
- Visual focus indicator: 2px dashed outline on selected node
- Create `getAdjacentNode(currentPath, direction)` utility for arrow key navigation
- Use spatial algorithm: Find node in direction based on box center coordinates
- Add unit tests for keyboard navigation logic

**Complexity Note**: Spatial navigation in canvas treemap is complex - may require building a coordinate index. Consider phased approach:
- **Phase 1** (P1 stories): Tab, Enter, Escape, Home keys only
- **Phase 2** (P3 enhancement): Arrow key spatial navigation

---

## Technology Stack Updates

Based on research, the following additions to `package.json` are recommended:

```json
{
  "dependencies": {
    "color2k": "^2.0.3"  // WCAG contrast calculations (10KB, zero deps)
  }
}
```

No other dependencies needed - all features can be built with existing React, Nivo, Zustand, and Tailwind CSS.

---

## Performance Benchmarks

Expected performance based on research and existing codebase patterns:

| Operation | Target | Implementation Strategy |
|-----------|--------|------------------------|
| Treemap initial render (1000 nodes) | <500ms | Use ResponsiveTreeMapCanvas (existing), memoize data transformation |
| Tooltip display on hover | <200ms | Nivo built-in (already performant) |
| Zoom animation (300ms @ 60fps) | 16.6ms/frame | Enable Nivo `animate` with `motionConfig="gentle"` |
| Search entire hierarchy (10k nodes) | <100ms | Existing `searchTree()` is O(n) recursive - fast enough |
| Details panel slide-in | 300ms | CSS transform transition (GPU-accelerated) |
| Color contrast calculation | <10ms | color2k is fast, precompute palette on mount |

---

## Open Questions for Implementation Phase

1. **Nivo Canvas Label Dimensions**: Verify if `node.width` and `node.height` are accessible in `label` function for 50x20px threshold check. If not, may need to switch to SVG version for this specific feature.

2. **Arrow Key Spatial Navigation**: Building coordinate index for arrow key navigation adds complexity. Propose deferring to Phase 2 (P3 story) and implementing basic keyboard shortcuts first.

3. **Search Match Highlighting Persistence**: Should highlighted matches persist after zooming, or clear when zoom level changes? Recommend clearing to avoid confusion.

4. **Info Icon Rendering**: How to overlay info icon on canvas-rendered nodes? May need hybrid approach: Canvas for boxes, SVG overlay for interactive elements.

5. **Mobile/Touch Support**: Spec says "Out of Scope" but should we add basic touch gestures (tap = zoom, long-press = details) for future-proofing? Recommend adding in separate feature.

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Canvas treemap doesn't expose node dimensions for label threshold | Medium | High | Fallback to SVG version (ResponsiveTreeMap) for label control, test performance with 1000+ nodes |
| Zoom animations cause lag on large datasets | Medium | Medium | Add conditional `animate={nodes < 500}`, disable animations for large trees |
| WCAG color adjustments make palette less visually distinct | Low | Medium | Use color2k to find closest accessible color, validate with colorblind simulators |
| Info icon overlay doesn't work with Canvas rendering | High | High | Use SVG overlay layer positioned absolutely over Canvas, sync coordinates |
| Arrow key spatial navigation too complex for Phase 1 | High | Low | Defer to Phase 2, ship with basic keyboard shortcuts first |

---

## Research Complete

All technical unknowns have been researched and documented with concrete decisions. Ready to proceed to **Phase 1: Design & Contracts**.

**Next Steps**:
1. Generate `data-model.md` with entity definitions
2. Create TypeScript contracts in `contracts/` directory
3. Generate `quickstart.md` with integration examples
4. Update agent context with new technologies
