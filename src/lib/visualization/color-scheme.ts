/**
 * Color Scheme Calculations for Treemap Visualization
 *
 * Provides color mapping for treemap nodes based on size or content type
 */

import type { ContentType } from '../../types/analysis';

/**
 * Color palette for content types
 */
const TYPE_COLORS: Record<ContentType, string> = {
  framework: '#3b82f6',      // Blue
  bundle: '#8b5cf6',         // Purple
  executable: '#ef4444',     // Red
  dex: '#f59e0b',            // Amber
  native_lib: '#10b981',     // Green
  resource: '#06b6d4',       // Cyan
  asset: '#ec4899',          // Pink
  image: '#14b8a6',          // Teal
  video: '#f97316',          // Orange
  audio: '#a855f7',          // Purple
  font: '#84cc16',           // Lime
  localization: '#6366f1',   // Indigo
  data: '#22c55e',           // Green
  config: '#eab308',         // Yellow
  other: '#94a3b8',          // Gray
  unknown: '#64748b',        // Slate
};

/**
 * Size-based heat map colors (from cold to hot)
 */
const HEATMAP_COLORS = [
  '#dbeafe', // Very light blue (smallest)
  '#93c5fd', // Light blue
  '#60a5fa', // Blue
  '#3b82f6', // Medium blue
  '#2563eb', // Dark blue
  '#1d4ed8', // Very dark blue
  '#f97316', // Orange (medium)
  '#ea580c', // Dark orange
  '#dc2626', // Red
  '#991b1b', // Dark red (largest)
];

/**
 * Get color for a node based on content type
 */
export function getColorByType(type: ContentType): string {
  return TYPE_COLORS[type] || TYPE_COLORS.unknown;
}

/**
 * Get color for a node based on size relative to total
 * Uses a heat map from cold (small) to hot (large)
 */
export function getColorBySize(size: number, totalSize: number): string {
  if (totalSize === 0) return HEATMAP_COLORS[0] || '#dbeafe';

  // Calculate percentage of total
  const percentage = (size / totalSize) * 100;

  // Map percentage to color index
  // 0-5%: coldest colors
  // 5-50%: medium colors
  // 50%+: hottest colors
  let colorIndex: number;

  if (percentage < 1) {
    colorIndex = 0;
  } else if (percentage < 5) {
    colorIndex = 1;
  } else if (percentage < 10) {
    colorIndex = 2;
  } else if (percentage < 15) {
    colorIndex = 3;
  } else if (percentage < 20) {
    colorIndex = 4;
  } else if (percentage < 30) {
    colorIndex = 5;
  } else if (percentage < 40) {
    colorIndex = 6;
  } else if (percentage < 50) {
    colorIndex = 7;
  } else if (percentage < 70) {
    colorIndex = 8;
  } else {
    colorIndex = 9;
  }

  return HEATMAP_COLORS[colorIndex] || '#64748b';
}

/**
 * Get color for a node based on compression ratio
 * Well-compressed files are green, poorly compressed are red
 */
export function getColorByCompression(
  size: number,
  compressedSize: number | undefined
): string {
  if (!compressedSize || compressedSize === 0) {
    return '#94a3b8'; // Gray for unknown
  }

  const compressionRatio = compressedSize / size;

  // 0-30%: Excellent compression (green)
  // 30-50%: Good compression (blue-green)
  // 50-70%: Medium compression (yellow)
  // 70-90%: Poor compression (orange)
  // 90-100%: Almost no compression (red)

  if (compressionRatio < 0.3) return '#10b981'; // Green
  if (compressionRatio < 0.5) return '#14b8a6'; // Teal
  if (compressionRatio < 0.7) return '#eab308'; // Yellow
  if (compressionRatio < 0.9) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Generate color for node with support for different schemes
 */
export function getNodeColor(
  size: number,
  type: ContentType,
  totalSize: number,
  compressedSize?: number,
  scheme: 'size' | 'type' | 'compression' = 'size'
): string {
  switch (scheme) {
    case 'type':
      return getColorByType(type);
    case 'compression':
      return getColorByCompression(size, compressedSize);
    case 'size':
    default:
      return getColorBySize(size, totalSize);
  }
}

/**
 * Get label color for node (contrasting text color)
 */
export function getLabelColor(backgroundColor: string): string {
  // Simple brightness check - if background is dark, use white text
  // if background is light, use black text
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '00', 16);
  const g = parseInt(hex.substring(2, 4) || '00', 16);
  const b = parseInt(hex.substring(4, 6) || '00', 16);

  // Calculate perceived brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? '#000000' : '#ffffff';
}

/**
 * Darken a color for borders/hover states
 */
export function darkenColor(color: string, amount: number = 0.2): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '00', 16);
  const g = parseInt(hex.substring(2, 4) || '00', 16);
  const b = parseInt(hex.substring(4, 6) || '00', 16);

  const darkenedR = Math.max(0, Math.floor(r * (1 - amount)));
  const darkenedG = Math.max(0, Math.floor(g * (1 - amount)));
  const darkenedB = Math.max(0, Math.floor(b * (1 - amount)));

  return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a color for hover states
 */
export function lightenColor(color: string, amount: number = 0.2): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '00', 16);
  const g = parseInt(hex.substring(2, 4) || '00', 16);
  const b = parseInt(hex.substring(4, 6) || '00', 16);

  const lightenedR = Math.min(255, Math.floor(r + (255 - r) * amount));
  const lightenedG = Math.min(255, Math.floor(g + (255 - g) * amount));
  const lightenedB = Math.min(255, Math.floor(b + (255 - b) * amount));

  return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
}

/**
 * Get legend entries for content type colors
 */
export function getTypeLegend(): Array<{ type: ContentType; color: string; label: string }> {
  return [
    { type: 'executable', color: TYPE_COLORS.executable, label: 'Executables' },
    { type: 'framework', color: TYPE_COLORS.framework, label: 'Frameworks' },
    { type: 'dex', color: TYPE_COLORS.dex, label: 'DEX Files' },
    { type: 'native_lib', color: TYPE_COLORS.native_lib, label: 'Native Libraries' },
    { type: 'resource', color: TYPE_COLORS.resource, label: 'Resources' },
    { type: 'asset', color: TYPE_COLORS.asset, label: 'Assets' },
    { type: 'image', color: TYPE_COLORS.image, label: 'Images' },
    { type: 'video', color: TYPE_COLORS.video, label: 'Videos' },
    { type: 'audio', color: TYPE_COLORS.audio, label: 'Audio' },
    { type: 'font', color: TYPE_COLORS.font, label: 'Fonts' },
    { type: 'localization', color: TYPE_COLORS.localization, label: 'Localizations' },
    { type: 'data', color: TYPE_COLORS.data, label: 'Data Files' },
    { type: 'config', color: TYPE_COLORS.config, label: 'Config Files' },
    { type: 'other', color: TYPE_COLORS.other, label: 'Other' },
  ];
}

/**
 * Get legend entries for size-based heat map
 */
export function getSizeLegend(): Array<{ label: string; color: string }> {
  return [
    { label: '< 1%', color: HEATMAP_COLORS[0] || '#dbeafe' },
    { label: '1-5%', color: HEATMAP_COLORS[1] || '#93c5fd' },
    { label: '5-10%', color: HEATMAP_COLORS[2] || '#60a5fa' },
    { label: '10-15%', color: HEATMAP_COLORS[3] || '#3b82f6' },
    { label: '15-20%', color: HEATMAP_COLORS[4] || '#2563eb' },
    { label: '20-30%', color: HEATMAP_COLORS[5] || '#1d4ed8' },
    { label: '30-40%', color: HEATMAP_COLORS[6] || '#f97316' },
    { label: '40-50%', color: HEATMAP_COLORS[7] || '#ea580c' },
    { label: '50-70%', color: HEATMAP_COLORS[8] || '#dc2626' },
    { label: '> 70%', color: HEATMAP_COLORS[9] || '#991b1b' },
  ];
}
