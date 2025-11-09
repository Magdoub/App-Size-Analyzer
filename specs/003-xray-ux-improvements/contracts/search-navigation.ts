/**
 * Search Navigation Contract
 *
 * Defines interfaces for cross-hierarchy search with auto-navigation
 */

import type { BreakdownNode } from '../../../src/types/analysis';

/**
 * Search navigation state
 *
 * Managed in Zustand store for search functionality
 */
export interface SearchNavigationState {
  // === SEARCH INPUT ===
  /** Current search query string */
  searchQuery: string;

  // === RESULTS ===
  /** Array of paths that match query */
  matchingPaths: string[];

  /** Total number of matches */
  matchCount: number;

  // === NAVIGATION ===
  /** Index of currently focused match (0-based) */
  currentMatchIndex: number;

  /** Path of current match (matchingPaths[currentMatchIndex]) */
  currentMatchPath: string | null;

  // === DISPLAY STATE ===
  /** True if search query is non-empty */
  isSearchActive: boolean;

  /** True if matchCount > 0 */
  hasMatches: boolean;
}

/**
 * Search navigation actions (Zustand store methods)
 */
export interface SearchNavigationActions {
  /**
   * Update search query and recalculate matches
   *
   * @param query - Search query string
   */
  setSearchQuery: (query: string) => void;

  /**
   * Set search results
   *
   * @param matches - Array of matching node paths
   */
  setSearchMatches: (matches: string[]) => void;

  /**
   * Navigate to next search match
   * Cycles back to first match when at end
   */
  navigateToNextMatch: () => void;

  /**
   * Navigate to previous search match
   * Cycles to last match when at beginning
   */
  navigateToPreviousMatch: () => void;

  /**
   * Navigate to specific match index
   *
   * @param index - Match index (0-based)
   */
  navigateToMatch: (index: number) => void;

  /**
   * Clear search and reset state
   */
  clearSearch: () => void;
}

/**
 * Search match result
 *
 * Single search result with context information
 */
export interface SearchMatchResult {
  /** Matched node path */
  path: string;

  /** Node display name */
  name: string;

  /** Parent folder path */
  parentPath: string | null;

  /** Full breadcrumb path */
  breadcrumbs: string[];

  /** Node size in bytes */
  size: number;

  /** Match reason (name match, path match, etc.) */
  matchReason: 'name' | 'path';

  /** Depth in hierarchy */
  depth: number;
}

/**
 * Search the tree for matching nodes
 *
 * @param root - Root node to search from
 * @param query - Search query string (case-insensitive)
 * @returns Array of matching node paths
 *
 * @remarks
 * Searches entire hierarchy regardless of current zoom level
 * Matches against both node name and full path
 *
 * @example
 * const matches = searchTree(rootNode, "framework");
 * // Returns: ["Frameworks/MyFramework.framework", "Payload/SomeFramework.bundle", ...]
 */
export function searchTree(root: BreakdownNode, query: string): string[];

/**
 * Search tree and return detailed match results
 *
 * @param root - Root node to search from
 * @param query - Search query string (case-insensitive)
 * @returns Array of detailed match results
 *
 * @example
 * const results = searchTreeDetailed(rootNode, "framework");
 * // Returns array of SearchMatchResult with context
 */
export function searchTreeDetailed(
  root: BreakdownNode,
  query: string
): SearchMatchResult[];

/**
 * Extract parent path to zoom to when navigating to match
 *
 * @param matchPath - Full path of matched node
 * @returns Parent path to set as zoom target, or null if root
 *
 * @remarks
 * Strategy: Zoom to parent folder so match is visible in treemap
 * If match is at root level, don't zoom (null)
 *
 * @example
 * extractParentForZoom("Frameworks/MyFramework.framework/Info.plist")
 * // Returns: "Frameworks/MyFramework.framework"
 *
 * extractParentForZoom("TopLevel.bundle")
 * // Returns: null (root level, no zoom needed)
 */
export function extractParentForZoom(matchPath: string): string | null;

/**
 * Highlight search matches in treemap data
 *
 * @param node - Treemap node to update
 * @param matchPaths - Array of matching paths
 * @param currentMatchPath - Currently focused match path
 * @returns Updated node with search flags set
 *
 * @remarks
 * Sets isSearchMatch=true for all matches
 * Sets isCurrentSearchMatch=true for current match only
 */
export function highlightSearchMatches(
  node: any, // TreemapNode
  matchPaths: string[],
  currentMatchPath: string | null
): any; // TreemapNode with search flags

/**
 * Search input component props
 */
export interface SearchInputProps {
  /** Current search query */
  query: string;

  /** Callback when query changes */
  onChange: (query: string) => void;

  /** Number of matches found */
  matchCount: number;

  /** Current match index (1-based for display) */
  currentMatch: number;

  /** Callback for next match */
  onNext: () => void;

  /** Callback for previous match */
  onPrevious: () => void;

  /** Callback for clear */
  onClear: () => void;

  /** Placeholder text */
  placeholder?: string;
}
