/**
 * Node Label Calculator
 *
 * Utilities for determining label visibility and text truncation
 * based on treemap box dimensions.
 */

/**
 * @typedef {import('./treemap-generator.js').TreemapNode} TreemapNode
 */

/**
 * @typedef {Object} NodeLabelMetadata
 * @property {string} nodePath - Node path
 * @property {boolean} shouldShowLabel - Whether to show label
 * @property {string} labelText - Label text (truncated if needed)
 * @property {number} fontSize - Font size in pixels
 * @property {number} boxWidth - Box width in pixels
 * @property {number} boxHeight - Box height in pixels
 * @property {boolean} meetsWidthThreshold - Meets width threshold
 * @property {boolean} meetsHeightThreshold - Meets height threshold
 * @property {number} estimatedTextWidth - Estimated text width
 * @property {boolean} requiresTruncation - Whether truncation is required
 */

const LABEL_WIDTH_THRESHOLD = 50; // pixels
const LABEL_HEIGHT_THRESHOLD = 20; // pixels
const DEFAULT_FONT_SIZE = 12; // pixels
const HORIZONTAL_PADDING = 8; // pixels (4px each side)

/**
 * Estimate text width using average character width heuristic
 * @param {string} text - The text to estimate
 * @param {number} fontSize - Font size in pixels
 * @returns {number} Estimated width in pixels
 */
export function estimateTextWidth(text, fontSize) {
  // Average character width is ~0.6 * font size for most fonts
  return text.length * fontSize * 0.6;
}

/**
 * Truncate text with ellipsis to fit width
 * @param {string} text - The text to truncate
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} fontSize - Font size in pixels
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateLabel(text, maxWidth, fontSize) {
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
 * @param {TreemapNode & { width?: number, height?: number }} node - TreemapNode with optional width/height
 * @param {number} [fontSize=DEFAULT_FONT_SIZE] - Font size in pixels
 * @returns {NodeLabelMetadata} Metadata about label rendering
 */
export function calculateNodeLabel(node, fontSize = DEFAULT_FONT_SIZE) {
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

  // Show label if width is sufficient (>= 50px), regardless of height
  // Height is tracked for metadata but not required for label display
  const shouldShowLabel =
    meetsWidthThreshold && availableWidth > 0;

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
