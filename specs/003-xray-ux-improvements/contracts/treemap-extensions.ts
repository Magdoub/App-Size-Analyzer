/**
 * Treemap Extensions Contract
 *
 * Defines extensions to the existing TreemapNode interface for UX improvements
 */

import type { ContentType } from '../../../src/types/analysis';

/**
 * Extended TreemapNode with visual rendering metadata
 *
 * Extends the existing TreemapNode interface with properties for:
 * - Label rendering decisions based on box size
 * - Search match highlighting
 * - Coordinate tracking for keyboard navigation
 */
export interface ExtendedTreemapNode {
  // === EXISTING PROPERTIES (from src/lib/visualization/treemap-generator.ts) ===
  name: string;
  value: number;
  path: string;
  type: ContentType;
  children?: ExtendedTreemapNode[];
  color?: string;
  compressedSize: number | undefined;

  // === NEW PROPERTIES ===

  /**
   * Computed box dimensions (filled by Nivo during layout)
   * Used for label threshold calculations and keyboard navigation
   */
  dimensions?: {
    width: number;    // Box width in pixels
    height: number;   // Box height in pixels
    x: number;        // X coordinate (top-left corner)
    y: number;        // Y coordinate (top-left corner)
  };

  /**
   * Whether this node's label should be displayed on the box
   * True if box dimensions >= 50x20 pixels and text fits
   */
  shouldShowLabel?: boolean;

  /**
   * Search/highlight state flags
   */
  isSearchMatch?: boolean;        // True if node matches current search query
  isCurrentSearchMatch?: boolean; // True if this is the focused search result
}

/**
 * Node label metadata for rendering decisions
 *
 * Calculated by NodeLabelCalculator to determine:
 * - Whether label should be shown
 * - How label text should be formatted/truncated
 * - Font size and styling
 */
export interface NodeLabelMetadata {
  /** Node identifier (full path) */
  nodePath: string;

  /** Whether label should be rendered on box */
  shouldShowLabel: boolean;

  /** Computed label text (may be truncated with ellipsis) */
  labelText: string;

  /** Font size in pixels (12-16px range) */
  fontSize: number;

  // Dimension checks
  /** Actual box width in pixels */
  boxWidth: number;

  /** Actual box height in pixels */
  boxHeight: number;

  /** True if width >= 50px */
  meetsWidthThreshold: boolean;

  /** True if height >= 20px */
  meetsHeightThreshold: boolean;

  // Text fitting calculations
  /** Estimated width of label text in pixels */
  estimatedTextWidth: number;

  /** True if text must be truncated to fit box */
  requiresTruncation: boolean;
}

/**
 * Calculate node label metadata
 *
 * @param node - Treemap node with dimensions
 * @param fontSize - Font size in pixels (default: 12)
 * @returns Label metadata with rendering decisions
 *
 * @example
 * const metadata = calculateNodeLabel(node, 12);
 * if (metadata.shouldShowLabel) {
 *   renderLabel(metadata.labelText, metadata.fontSize);
 * }
 */
export function calculateNodeLabel(
  node: ExtendedTreemapNode,
  fontSize: number = 12
): NodeLabelMetadata;

/**
 * Truncate text with ellipsis to fit within max width
 *
 * @param text - Original text
 * @param maxWidth - Maximum width in pixels
 * @param fontSize - Font size in pixels
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * const truncated = truncateLabel("VeryLongFileName.framework", 100, 12);
 * // Returns: "VeryLongFileN..."
 */
export function truncateLabel(
  text: string,
  maxWidth: number,
  fontSize: number
): string;

/**
 * Estimate text width in pixels
 *
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @returns Estimated width in pixels
 *
 * @remarks
 * Uses average character width heuristic (fontSize * 0.6 per character)
 * For exact measurements, use Canvas measureText API
 */
export function estimateTextWidth(text: string, fontSize: number): number;
