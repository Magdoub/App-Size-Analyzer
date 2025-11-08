/**
 * Node Label Calculator
 *
 * Utilities for determining label visibility and text truncation
 * based on treemap box dimensions.
 */

import type { TreemapNode } from './treemap-generator';

export interface NodeLabelMetadata {
  nodePath: string;
  shouldShowLabel: boolean;
  labelText: string;
  fontSize: number;
  boxWidth: number;
  boxHeight: number;
  meetsWidthThreshold: boolean;
  meetsHeightThreshold: boolean;
  estimatedTextWidth: number;
  requiresTruncation: boolean;
}

const LABEL_WIDTH_THRESHOLD = 50; // pixels
const LABEL_HEIGHT_THRESHOLD = 20; // pixels
const DEFAULT_FONT_SIZE = 12; // pixels
const HORIZONTAL_PADDING = 8; // pixels (4px each side)

/**
 * Estimate text width using average character width heuristic
 * @param text - The text to estimate
 * @param fontSize - Font size in pixels
 * @returns Estimated width in pixels
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  // Average character width is ~0.6 * font size for most fonts
  return text.length * fontSize * 0.6;
}

/**
 * Truncate text with ellipsis to fit width
 * @param text - The text to truncate
 * @param maxWidth - Maximum width in pixels
 * @param fontSize - Font size in pixels
 * @returns Truncated text with ellipsis if needed
 */
export function truncateLabel(text: string, maxWidth: number, fontSize: number): string {
  const ellipsis = '...';

  if (estimateTextWidth(text, fontSize) <= maxWidth) {
    return text; // Fits without truncation
  }

  // Binary search for max length that fits
  let left = 0;
  let right = text.length;

  while (left < right) {
    const mid = Math.floor((left + right + 1) / 2);
    const candidate = text.substring(0, mid) + ellipsis;
    const width = estimateTextWidth(candidate, fontSize);

    if (width <= maxWidth) {
      left = mid;
    } else {
      right = mid - 1;
    }
  }

  return text.substring(0, left) + ellipsis;
}

/**
 * Calculate node label metadata
 * @param node - TreemapNode with optional width/height
 * @param fontSize - Font size in pixels (default: 12)
 * @returns Metadata about label rendering
 */
export function calculateNodeLabel(
  node: TreemapNode & { width?: number; height?: number },
  fontSize: number = DEFAULT_FONT_SIZE
): NodeLabelMetadata {
  const boxWidth = node.width || 0;
  const boxHeight = node.height || 0;

  const meetsWidthThreshold = boxWidth >= LABEL_WIDTH_THRESHOLD;
  const meetsHeightThreshold = boxHeight >= LABEL_HEIGHT_THRESHOLD;

  const availableWidth = boxWidth - HORIZONTAL_PADDING;
  const estimatedTextWidth = estimateTextWidth(node.name, fontSize);
  const requiresTruncation = estimatedTextWidth > availableWidth;

  const labelText = requiresTruncation
    ? truncateLabel(node.name, availableWidth, fontSize)
    : node.name;

  const shouldShowLabel =
    meetsWidthThreshold && meetsHeightThreshold && availableWidth > 0;

  return {
    nodePath: node.path,
    shouldShowLabel,
    labelText,
    fontSize,
    boxWidth,
    boxHeight,
    meetsWidthThreshold,
    meetsHeightThreshold,
    estimatedTextWidth,
    requiresTruncation,
  };
}
