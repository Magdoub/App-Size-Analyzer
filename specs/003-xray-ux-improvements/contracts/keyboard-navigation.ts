/**
 * Keyboard Navigation Contract
 *
 * Defines keyboard interaction patterns for treemap accessibility
 */

/**
 * Keyboard navigation state
 *
 * Managed in Zustand store for keyboard focus tracking
 */
export interface KeyboardNavigationState {
  // === FOCUS STATE ===
  /** Currently focused node path (via keyboard) */
  keyboardFocusedPath: string | null;

  /** True if treemap canvas has keyboard focus */
  isTreemapFocused: boolean;

  // === NAVIGATION HISTORY ===
  /** Stack of zoom paths for back navigation */
  navigationStack: string[];

  // === COORDINATE INDEX (Phase 2 - Optional) ===
  /** Map of node paths to screen coordinates for arrow navigation */
  nodeCoordinateIndex?: Map<string, NodeCoordinates>;
}

/**
 * Node coordinates for spatial navigation
 *
 * Used by arrow key navigation to find adjacent nodes
 */
export interface NodeCoordinates {
  /** Center X coordinate */
  x: number;

  /** Center Y coordinate */
  y: number;

  /** Box width */
  width: number;

  /** Box height */
  height: number;

  /** Node path identifier */
  path: string;
}

/**
 * Keyboard navigation actions (Zustand store methods)
 */
export interface KeyboardNavigationActions {
  /**
   * Set keyboard focus to a specific node
   *
   * @param path - Node path to focus (null to unfocus)
   */
  setKeyboardFocus: (path: string | null) => void;

  /**
   * Set treemap focus state
   *
   * @param focused - True if treemap has focus
   */
  setTreemapFocused: (focused: boolean) => void;

  /**
   * Push zoom path to navigation history
   *
   * @param path - Path to add to stack
   */
  pushNavigationHistory: (path: string) => void;

  /**
   * Pop last zoom path from navigation history
   *
   * @returns Previous path or null if stack empty
   */
  popNavigationHistory: () => string | null;

  /**
   * Clear navigation history
   */
  clearNavigationHistory: () => void;

  /**
   * Update node coordinate index
   *
   * @param coordinates - Map of paths to coordinates
   */
  updateCoordinateIndex: (coordinates: Map<string, NodeCoordinates>) => void;
}

/**
 * Keyboard event handler result
 *
 * Indicates whether event was handled and what action to take
 */
export interface KeyboardHandlerResult {
  /** True if event was handled */
  handled: boolean;

  /** Action to perform */
  action:
    | 'zoom-in'
    | 'zoom-out'
    | 'go-home'
    | 'open-details'
    | 'close-panel'
    | 'focus-search'
    | 'navigate-arrow'
    | 'none';

  /** Target node path (for zoom/details actions) */
  targetPath?: string | null;

  /** Direction (for arrow navigation) */
  direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * Handle keyboard event on treemap
 *
 * @param event - Keyboard event
 * @param state - Current keyboard navigation state
 * @returns Handler result with action to perform
 *
 * @remarks
 * Supported keys:
 * - Enter: Zoom into focused node (if has children) or open details (if leaf)
 * - Escape: Zoom out one level or close details panel
 * - Home: Return to root view
 * - /: Focus search input
 * - Arrow keys (Phase 2): Navigate between sibling nodes
 *
 * @example
 * const result = handleTreemapKeyboard(event, navigationState);
 * if (result.action === 'zoom-in' && result.targetPath) {
 *   setXRayZoom(result.targetPath);
 * }
 */
export function handleTreemapKeyboard(
  event: KeyboardEvent,
  state: KeyboardNavigationState
): KeyboardHandlerResult;

/**
 * Find adjacent node in specified direction (Phase 2)
 *
 * @param currentPath - Current focused node path
 * @param direction - Direction to search
 * @param coordinateIndex - Map of node coordinates
 * @returns Adjacent node path or null if none found
 *
 * @remarks
 * Uses spatial algorithm to find nearest node in direction
 * based on box center coordinates
 *
 * @example
 * const adjacentPath = findAdjacentNode(
 *   'Frameworks/MyFramework.framework',
 *   'right',
 *   coordinateIndex
 * );
 */
export function findAdjacentNode(
  currentPath: string,
  direction: 'up' | 'down' | 'left' | 'right',
  coordinateIndex: Map<string, NodeCoordinates>
): string | null;

/**
 * Build coordinate index from treemap data
 *
 * @param nodes - Array of treemap nodes with dimensions
 * @returns Map of paths to coordinates
 *
 * @remarks
 * Extracts center coordinates from node dimensions
 * Used for arrow key spatial navigation
 *
 * @example
 * const index = buildCoordinateIndex(treemapNodes);
 * // Returns: Map { 'path1' => { x: 100, y: 50, ... }, ... }
 */
export function buildCoordinateIndex(
  nodes: any[] // TreemapNode[] with dimensions
): Map<string, NodeCoordinates>;

/**
 * Get visual focus indicator style
 *
 * @param isFocused - True if node is keyboard focused
 * @returns CSS style object for focus outline
 *
 * @remarks
 * Returns dashed outline for focused nodes
 * Meets WCAG 2.4.7 Focus Visible requirement
 *
 * @example
 * const style = getFocusIndicatorStyle(true);
 * // Returns: { outline: '2px dashed #3b82f6', outlineOffset: '2px' }
 */
export function getFocusIndicatorStyle(
  isFocused: boolean
): React.CSSProperties;

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcuts {
  /** Zoom into focused node */
  zoomIn: string; // 'Enter'

  /** Zoom out one level */
  zoomOut: string; // 'Escape'

  /** Return to root */
  goHome: string; // 'Home'

  /** Focus search input */
  focusSearch: string; // '/'

  /** Navigate up */
  navigateUp?: string; // 'ArrowUp' (Phase 2)

  /** Navigate down */
  navigateDown?: string; // 'ArrowDown' (Phase 2)

  /** Navigate left */
  navigateLeft?: string; // 'ArrowLeft' (Phase 2)

  /** Navigate right */
  navigateRight?: string; // 'ArrowRight' (Phase 2)
}

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts;

/**
 * ARIA labels for accessibility
 */
export interface ARIALabels {
  /** Treemap container label */
  treemapLabel: string;

  /** Breadcrumb navigation label */
  breadcrumbLabel: string;

  /** Search input label */
  searchLabel: string;

  /** Details panel label */
  detailsPanelLabel: string;

  /** Zoom status announcement (for screen readers) */
  zoomStatusFormat: (nodeName: string, childCount: number) => string;
}

/**
 * Default ARIA labels
 */
export const DEFAULT_ARIA_LABELS: ARIALabels;
