/**
 * Component Interface Contract: Sort File List by Size
 *
 * This file defines the contracts (TypeScript interfaces) for the sorting feature.
 * Since this is a UI-only feature with no API endpoints, contracts focus on:
 * 1. Component props
 * 2. Store actions
 * 3. Utility function signatures
 *
 * Feature: 002-sort-by-size
 * Date: 2025-11-08
 */

// ============================================================================
// EXISTING TYPES (from /src/types/analysis.ts)
// ============================================================================

/**
 * Hierarchical tree node representing a file or directory
 * Already defined in /src/types/analysis.ts
 */
export interface BreakdownNode {
  id: string;
  name: string;
  path: string;
  size: number;                  // PRIMARY SORTING KEY
  compressedSize?: number;
  type: ContentType;
  parent?: string;
  children: BreakdownNode[];     // Sorted recursively
  metadata?: {
    fileCount?: number;
    duplicates?: string[];
    encoding?: string;
    architecture?: string[];
  };
}

/**
 * Content type classification
 * Already defined in /src/types/analysis.ts
 */
export type ContentType =
  | 'framework'
  | 'bundle'
  | 'executable'
  | 'dex'
  | 'native_lib'
  | 'resource'
  | 'asset'
  | 'image'
  | 'video'
  | 'audio'
  | 'font'
  | 'localization'
  | 'data'
  | 'config'
  | 'other'
  | 'unknown';

// ============================================================================
// EXISTING SORTING TYPES (from /src/lib/analysis/breakdown-generator.ts)
// ============================================================================

/**
 * Sorting criteria
 * Already defined in breakdown-generator.ts
 */
export type SortCriteria = 'size' | 'name' | 'type';

/**
 * Sort direction
 * Already defined in breakdown-generator.ts
 */
export type SortOrder = 'asc' | 'desc';

// ============================================================================
// UTILITY FUNCTION CONTRACT
// ============================================================================

/**
 * Recursively sorts a tree by specified criteria
 *
 * LOCATION: /src/lib/analysis/breakdown-generator.ts (existing)
 *
 * BEHAVIOR:
 * - Immutable: Returns new tree, does not mutate original
 * - Recursive: Sorts all children at all levels
 * - Stable: Maintains order for items with equal sort keys
 *
 * PERFORMANCE:
 * - Time complexity: O(n log n) where n = total nodes
 * - Space complexity: O(n) for new tree
 *
 * @param tree - Root node of tree to sort
 * @param criteria - Property to sort by ('size' | 'name' | 'type')
 * @param order - Sort direction ('asc' | 'desc')
 * @returns New tree with sorted children at all levels
 *
 * @example
 * const sorted = sortTree(root, 'size', 'desc');
 * // Result: Children sorted largest to smallest
 */
export function sortTree(
  tree: BreakdownNode,
  criteria: SortCriteria,
  order: SortOrder = 'desc'
): BreakdownNode;

// ============================================================================
// ZUSTAND STORE CONTRACT
// ============================================================================

/**
 * Breakdown view state (subset of AnalysisStore)
 *
 * LOCATION: /src/store/analysis-store.ts (existing)
 *
 * These properties already exist but are NOT currently used by BreakdownTable.
 * This feature will connect these properties to the UI.
 */
export interface BreakdownState {
  // Sorting state (EXISTING but UNUSED)
  breakdownSortBy: SortCriteria;      // Default: 'size'
  breakdownSortOrder: SortOrder;      // Default: 'desc'

  // Related state (EXISTING and USED)
  breakdownExpandedNodes: Set<string>;
  breakdownSearchQuery: string;
}

/**
 * Breakdown view actions (subset of AnalysisStore)
 *
 * LOCATION: /src/store/analysis-store.ts (existing)
 */
export interface BreakdownActions {
  /**
   * Update sort criteria and order
   *
   * EXISTING: Already defined in store but never called from UI
   * THIS FEATURE: Will be used by BreakdownTable (future: sort header buttons)
   *
   * @param sortBy - Property to sort by
   * @param order - Sort direction
   *
   * @example
   * setBreakdownSort('size', 'desc');  // Sort by size, largest first
   * setBreakdownSort('name', 'asc');   // Sort alphabetically
   */
  setBreakdownSort: (sortBy: SortCriteria, order: SortOrder) => void;

  // Related actions (EXISTING)
  toggleBreakdownNode: (nodeId: string) => void;
  setBreakdownSearch: (query: string) => void;
}

// ============================================================================
// COMPONENT PROPS CONTRACTS
// ============================================================================

/**
 * BreakdownTable component props
 *
 * LOCATION: /src/components/breakdown/BreakdownTable.tsx (existing component)
 *
 * EXISTING PROPS (no changes):
 * - rootNode: BreakdownNode
 * - activeTab: 'all' | 'frameworks' | 'assets' | 'localizations'
 * - totalSize: number
 *
 * BEHAVIOR CHANGES (internal):
 * - Component will read breakdownSortBy and breakdownSortOrder from store
 * - Component will apply sortTree() before flattening
 */
export interface BreakdownTableProps {
  rootNode: BreakdownNode;                                      // Hierarchical tree root
  activeTab: 'all' | 'frameworks' | 'assets' | 'localizations'; // Filter by tab
  totalSize: number;                                            // For percentage calculation
}

/**
 * BreakdownTabs component props
 *
 * LOCATION: /src/components/breakdown/BreakdownTabs.tsx (existing, no changes)
 */
export interface BreakdownTabsProps {
  activeTab: 'all' | 'frameworks' | 'assets' | 'localizations';
  onTabChange: (tab: 'all' | 'frameworks' | 'assets' | 'localizations') => void;
  platform: 'ios' | 'android';
}

/**
 * BreakdownView component props
 *
 * LOCATION: /src/components/breakdown/BreakdownView.tsx (existing, no changes)
 */
export interface BreakdownViewProps {
  // No props - reads from Zustand store
}

// ============================================================================
// INTERNAL COMPONENT TYPES
// ============================================================================

/**
 * Flattened node structure for virtual scrolling
 *
 * LOCATION: /src/components/breakdown/BreakdownTable.tsx (internal)
 *
 * Used after tree is sorted and flattened for rendering.
 * Maintains sort order from tree.
 */
export interface FlattenedNode {
  node: BreakdownNode;      // The actual node data
  depth: number;            // Indentation level (0 = root)
  hasChildren: boolean;     // Whether node has children
  parentPath: string;       // Parent node path
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Applying sortTree() in BreakdownTable
 *
 * BEFORE (current implementation - no sorting):
 * ```typescript
 * const BreakdownTable = ({ rootNode, activeTab, totalSize }) => {
 *   const filteredTree = useMemo(() =>
 *     filterByType(rootNode, activeTab),
 *     [rootNode, activeTab]
 *   );
 *
 *   const flattenedNodes = useMemo(() =>
 *     traverse(filteredTree, expandedNodes),
 *     [filteredTree, expandedNodes]
 *   );
 *   // ...render
 * };
 * ```
 *
 * AFTER (with sorting - this feature):
 * ```typescript
 * const BreakdownTable = ({ rootNode, activeTab, totalSize }) => {
 *   const { breakdownSortBy, breakdownSortOrder } = useAnalysisStore();
 *
 *   const filteredTree = useMemo(() =>
 *     filterByType(rootNode, activeTab),
 *     [rootNode, activeTab]
 *   );
 *
 *   // NEW: Apply sorting after filtering
 *   const sortedTree = useMemo(() =>
 *     sortTree(filteredTree, breakdownSortBy, breakdownSortOrder),
 *     [filteredTree, breakdownSortBy, breakdownSortOrder]
 *   );
 *
 *   const flattenedNodes = useMemo(() =>
 *     traverse(sortedTree, expandedNodes),  // Use sortedTree instead of filteredTree
 *     [sortedTree, expandedNodes]
 *   );
 *   // ...render
 * };
 * ```
 */

/**
 * Example 2: Future UI control for changing sort order
 *
 * NOT IMPLEMENTED IN THIS FEATURE (out of scope)
 *
 * ```typescript
 * const SortButton = () => {
 *   const { breakdownSortOrder, setBreakdownSort } = useAnalysisStore();
 *
 *   const toggleSort = () => {
 *     const newOrder = breakdownSortOrder === 'desc' ? 'asc' : 'desc';
 *     setBreakdownSort('size', newOrder);
 *   };
 *
 *   return (
 *     <button onClick={toggleSort}>
 *       {breakdownSortOrder === 'desc' ? '↓' : '↑'}
 *     </button>
 *   );
 * };
 * ```
 */

// ============================================================================
// TEST CONTRACTS
// ============================================================================

/**
 * Test cases for sortTree() utility
 *
 * LOCATION: src/__tests__/lib/analysis/breakdown-generator.test.ts
 */
export interface SortTreeTestSuite {
  'should sort by size descending': () => void;
  'should sort by size ascending': () => void;
  'should sort by name alphabetically': () => void;
  'should sort by type': () => void;
  'should recursively sort all children': () => void;
  'should maintain stable sort for equal values': () => void;
  'should not mutate original tree': () => void;
  'should handle empty children array': () => void;
  'should handle single child': () => void;
  'should handle deeply nested trees': () => void;
}

/**
 * Test cases for BreakdownTable component
 *
 * LOCATION: src/__tests__/components/breakdown/BreakdownTable.test.tsx
 */
export interface BreakdownTableTestSuite {
  'should display largest file first by default': () => void;
  'should sort children when directory is expanded': () => void;
  'should maintain sort order across tabs': () => void;
  'should update when sort criteria changes': () => void;
  'should preserve search filtering with sorting': () => void;
  'should not re-sort unnecessarily (memoization)': () => void;
}

// ============================================================================
// ACCEPTANCE CRITERIA MAPPING
// ============================================================================

/**
 * Functional Requirements → Implementation Mapping
 *
 * FR-001: Sort all entries descending → sortTree(root, 'size', 'desc')
 * FR-002: Apply to "All Files" tab → activeTab='all' uses sortedTree
 * FR-003: Apply to expanded children → sortTree() is recursive
 * FR-004: Maintain across nested levels → sortTree() handles all depths
 * FR-005: Apply to "Frameworks" tab → activeTab='frameworks' uses sortedTree
 * FR-006: Apply to "Assets" tab → activeTab='assets' uses sortedTree
 * FR-007: Apply to "Localizations" tab → activeTab='localizations' uses sortedTree
 * FR-008: Use SIZE column value → sortTree() uses node.size
 * FR-009: Preserve stable sort → JavaScript .sort() is stable
 * FR-010: Handle missing/zero size → Treat as 0 (parser guarantees number)
 */

/**
 * Success Criteria → Verification Method
 *
 * SC-001: Identify largest in 2 seconds → First item in list = largest
 * SC-002: 100% of lists sorted → Test all tabs show descending order
 * SC-003: Locate top 5 in 10 seconds → Top 5 items are 5 largest
 * SC-004: Consistent across tabs → All tabs use same sortTree() call
 * SC-005: 40% faster target identification → Benchmark test (manual)
 */
