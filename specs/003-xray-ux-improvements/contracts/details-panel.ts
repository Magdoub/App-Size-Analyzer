/**
 * Details Panel Contract
 *
 * Defines the data structure and component interface for the details panel
 */

import type { ContentType } from '../../../src/types/analysis';
import type { ExtendedTreemapNode } from './treemap-extensions';

/**
 * Data structure for details panel content
 *
 * Derived from TreemapNode with additional computed metadata
 * for comprehensive file/folder information display
 */
export interface DetailsPanelData {
  // === IDENTITY ===
  /** Full file/folder path */
  nodePath: string;

  /** Display name (file/folder name only) */
  displayName: string;

  // === SIZE INFORMATION ===
  /** Uncompressed size in bytes */
  uncompressedSize: number;

  /** Compressed size in bytes (if applicable) */
  compressedSize?: number;

  /** Compression ratio 0-1 (compressed / uncompressed) */
  compressionRatio?: number;

  // === PERCENTAGES ===
  /** Percentage of total app size (0-100) */
  percentOfTotal: number;

  /** Percentage of parent container (0-100) */
  percentOfParent: number;

  // === METADATA ===
  /** Content type classification */
  contentType: ContentType;

  /** Number of direct children */
  childCount: number;

  /** Total nodes in subtree (recursive) */
  totalDescendants: number;

  /** Depth in hierarchy (0 = root) */
  depthLevel: number;

  // === NAVIGATION CONTEXT ===
  /** Parent folder path (null if root) */
  parentPath: string | null;

  /** Array of ancestor names for breadcrumb */
  breadcrumbPath: string[];

  // === COMPUTED FLAGS ===
  /** True if node has no children */
  isLeafNode: boolean;

  /** True if node has children (can zoom) */
  isZoomable: boolean;

  // === FORMATTED STRINGS ===
  /** Human-readable size (e.g., "2.5 MB") */
  formattedSize: string;

  /** Human-readable compressed size */
  formattedCompressedSize?: string;
}

/**
 * Details Panel Component Props
 */
export interface DetailsPanelProps {
  /** Data to display in panel */
  data: DetailsPanelData | null;

  /** Whether panel is open */
  isOpen: boolean;

  /** Callback when close button clicked */
  onClose: () => void;

  /** Optional: Callback when "Zoom to this item" clicked */
  onZoomToNode?: (path: string) => void;

  /** Optional: Total app size for context */
  totalAppSize?: number;
}

/**
 * Transform TreemapNode to DetailsPanelData
 *
 * @param node - Treemap node to transform
 * @param totalAppSize - Total app size in bytes
 * @param parentSize - Parent node size in bytes
 * @returns Details panel data structure
 *
 * @example
 * const panelData = toDetailsPanelData(node, 100_000_000, 50_000_000);
 * // Returns DetailsPanelData with all computed fields
 */
export function toDetailsPanelData(
  node: ExtendedTreemapNode,
  totalAppSize: number,
  parentSize: number
): DetailsPanelData;

/**
 * Count total descendants in tree
 *
 * @param node - Root node
 * @returns Total number of nodes in subtree (recursive)
 */
export function countDescendants(node: ExtendedTreemapNode): number;

/**
 * Extract parent path from full path
 *
 * @param path - Full file path
 * @returns Parent folder path or null if root
 *
 * @example
 * getParentPath("Frameworks/MyFramework.framework/Info.plist")
 * // Returns: "Frameworks/MyFramework.framework"
 *
 * getParentPath("TopLevel.bundle")
 * // Returns: null (no parent, root level)
 */
export function getParentPath(path: string): string | null;

/**
 * Info Icon Button Component Props
 *
 * Small icon button that triggers details panel
 * Visibility depends on node size
 */
export interface InfoIconButtonProps {
  /** Node path identifier */
  nodePath: string;

  /** Node display name */
  nodeName: string;

  /** Callback when clicked */
  onClick: (path: string) => void;

  /** Always visible (true for large nodes >= 100x40px) */
  alwaysVisible: boolean;

  /** Node dimensions for positioning */
  nodeWidth: number;
  nodeHeight: number;
}

/**
 * Determine if info icon should be always visible
 *
 * @param width - Node width in pixels
 * @param height - Node height in pixels
 * @returns True if node >= 100x40 pixels
 */
export function shouldShowInfoIconAlways(width: number, height: number): boolean;
