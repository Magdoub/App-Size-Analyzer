/**
 * Visualization Contract
 *
 * Defines interfaces for transforming analysis data into visualizable formats
 * for treemaps, breakdown tables, and charts.
 */

import type { BreakdownNode, ContentType } from './analysis-engine';

export interface VisualizationContract {
  /**
   * Transform breakdown tree into treemap data structure
   * @param root - Root breakdown node
   * @param options - Visualization options
   * @returns Treemap-compatible data structure
   */
  toTreemapData(root: BreakdownNode, options?: TreemapOptions): TreemapData;

  /**
   * Flatten tree for table display with virtual scrolling
   * @param root - Root breakdown node
   * @param options - Flattening options
   * @returns Flat array of table rows
   */
  flattenForTable(root: BreakdownNode, options?: FlattenOptions): TableRow[];

  /**
   * Generate size distribution chart data
   * @param nodes - Breakdown nodes to analyze
   * @returns Chart data grouped by type
   */
  getSizeDistribution(nodes: BreakdownNode[]): SizeDistribution;

  /**
   * Calculate heatmap color for node based on size
   * @param size - Node size in bytes
   * @param totalSize - Total app size in bytes
   * @param scheme - Color scheme to use
   * @returns RGB or hex color
   */
  calculateHeatmapColor(
    size: number,
    totalSize: number,
    scheme?: ColorScheme
  ): string;

  /**
   * Format byte size for display
   * @param bytes - Size in bytes
   * @param precision - Decimal places
   * @returns Formatted string (e.g., "15.3 MB")
   */
  formatSize(bytes: number, precision?: number): string;

  /**
   * Calculate percentage of total
   * @param partialSize - Size of component
   * @param totalSize - Total size
   * @param precision - Decimal places
   * @returns Formatted percentage (e.g., "12.5%")
   */
  formatPercentage(partialSize: number, totalSize: number, precision?: number): string;
}

// Treemap visualization

export interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
  color?: string;
  path?: string;
  type?: ContentType;
  metadata?: Record<string, unknown>;
}

export interface TreemapOptions {
  /**
   * Maximum depth to include in treemap
   * @default Infinity (all levels)
   */
  maxDepth?: number;

  /**
   * Minimum size threshold (bytes) to include node
   * @default 0 (include all)
   */
  minSize?: number;

  /**
   * Filter by content types
   */
  typeFilter?: ContentType[];

  /**
   * Color scheme for heatmap
   * @default 'viridis'
   */
  colorScheme?: ColorScheme;

  /**
   * Include metadata in output
   * @default false
   */
  includeMetadata?: boolean;
}

export type ColorScheme =
  | 'viridis'      // Purple to green
  | 'inferno'      // Black to orange to yellow
  | 'plasma'       // Purple to pink to yellow
  | 'turbo'        // Rainbow spectrum
  | 'cool'         // Blue to cyan
  | 'warm'         // Red to yellow
  | 'custom';      // User-defined gradient

// Table visualization

export interface TableRow {
  id: string;
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
  percentage: string;
  type: ContentType;
  level: number;               // Indentation level
  hasChildren: boolean;
  isExpanded?: boolean;
  parent?: string;
  metadata?: Record<string, unknown>;
}

export interface FlattenOptions {
  /**
   * Initially expanded node IDs
   */
  expandedNodes?: Set<string>;

  /**
   * Sort order
   * @default 'size-desc'
   */
  sortBy?: 'size-asc' | 'size-desc' | 'name-asc' | 'name-desc' | 'type';

  /**
   * Filter by content types
   */
  typeFilter?: ContentType[];

  /**
   * Search query (fuzzy match on name/path)
   */
  searchQuery?: string;

  /**
   * Size range filter
   */
  sizeRange?: {
    min?: number;
    max?: number;
  };

  /**
   * Maximum rows to return (for virtual scrolling)
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;
}

// Size distribution

export interface SizeDistribution {
  byType: TypeDistribution[];
  bySize: SizeBucket[];
  largest: BreakdownNode[];
  total: number;
}

export interface TypeDistribution {
  type: ContentType;
  count: number;
  totalSize: number;
  percentage: number;
  averageSize: number;
}

export interface SizeBucket {
  label: string;               // e.g., "0-1 MB", "1-10 MB"
  min: number;
  max: number;
  count: number;
  totalSize: number;
}

// Export formats

export interface ExportContract {
  /**
   * Export breakdown to CSV format
   * @param rows - Table rows to export
   * @returns CSV string
   */
  toCSV(rows: TableRow[]): string;

  /**
   * Export analysis to JSON format
   * @param data - Analysis data to export
   * @returns JSON string
   */
  toJSON(data: unknown): string;

  /**
   * Export treemap hierarchy to JSON
   * @param treemap - Treemap data structure
   * @returns JSON string
   */
  treemapToJSON(treemap: TreemapData): string;

  /**
   * Trigger browser download of content
   * @param content - File content
   * @param filename - Download filename
   * @param mimeType - MIME type
   */
  downloadFile(content: string, filename: string, mimeType: string): void;
}

// Utility functions

/**
 * Convert bytes to human-readable size
 *
 * @example
 * ```typescript
 * formatBytes(1536) // "1.5 KB"
 * formatBytes(1048576) // "1.0 MB"
 * formatBytes(1073741824) // "1.0 GB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculate percentage with formatting
 *
 * @example
 * ```typescript
 * formatPercentage(250, 1000) // "25.0%"
 * formatPercentage(333, 1000, 2) // "33.30%"
 * ```
 */
export function formatPercentage(
  partial: number,
  total: number,
  decimals: number = 1
): string {
  if (total === 0) return '0%';
  const pct = (partial / total) * 100;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Interpolate color between two points
 *
 * @example
 * ```typescript
 * interpolateColor(0, [0, 0, 255], [255, 0, 0]) // "rgb(0, 0, 255)" (blue)
 * interpolateColor(0.5, [0, 0, 255], [255, 0, 0]) // "rgb(127, 0, 127)"
 * interpolateColor(1, [0, 0, 255], [255, 0, 0]) // "rgb(255, 0, 0)" (red)
 * ```
 */
export function interpolateColor(
  t: number,
  color1: [number, number, number],
  color2: [number, number, number]
): string {
  const r = Math.round(color1[0] + t * (color2[0] - color1[0]));
  const g = Math.round(color1[1] + t * (color2[1] - color1[1]));
  const b = Math.round(color1[2] + t * (color2[2] - color1[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get color for size using Viridis color scheme
 *
 * @example
 * ```typescript
 * getViridisColor(0) // Small files: purple
 * getViridisColor(0.5) // Medium files: teal
 * getViridisColor(1) // Large files: yellow
 * ```
 */
export function getViridisColor(t: number): string {
  // Simplified Viridis approximation
  const viridis = [
    [68, 1, 84],       // 0.0 - dark purple
    [59, 82, 139],     // 0.25 - blue
    [33, 145, 140],    // 0.5 - teal
    [94, 201, 98],     // 0.75 - green
    [253, 231, 37],    // 1.0 - yellow
  ];

  const index = t * (viridis.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) {
    const [r, g, b] = viridis[lower];
    return `rgb(${r}, ${g}, ${b})`;
  }

  return interpolateColor(fraction, viridis[lower], viridis[upper]);
}

// Example implementation signature

/**
 * Example: Create visualization utilities
 *
 * @example
 * ```typescript
 * import { createVisualization, createExport } from './visualization';
 *
 * const viz = createVisualization();
 * const exp = createExport();
 *
 * // Generate treemap data
 * const treemap = viz.toTreemapData(analysisContext.breakdownRoot, {
 *   maxDepth: 3,
 *   minSize: 1024 * 100, // 100 KB minimum
 *   colorScheme: 'viridis'
 * });
 *
 * // Flatten for table
 * const rows = viz.flattenForTable(analysisContext.breakdownRoot, {
 *   sortBy: 'size-desc',
 *   limit: 1000
 * });
 *
 * // Export to CSV
 * const csv = exp.toCSV(rows);
 * exp.downloadFile(csv, 'breakdown.csv', 'text/csv');
 *
 * // Format sizes
 * console.log(viz.formatSize(1536000)); // "1.5 MB"
 * console.log(viz.formatPercentage(15000, 100000)); // "15.0%"
 * ```
 */
export function createVisualization(): VisualizationContract {
  throw new Error('Not implemented - this is a contract definition');
}

export function createExport(): ExportContract {
  throw new Error('Not implemented - this is a contract definition');
}
