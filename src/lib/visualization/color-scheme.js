/**
 * Color Scheme Calculations for Treemap Visualization
 *
 * Provides color mapping for treemap nodes based on size or content type
 * with WCAG AA accessibility compliance
 */

import { readableColor, parseToRgba } from 'color2k';

/**
 * @typedef {import('../../types/analysis.js').ContentType} ContentType
 */

/**
 * Color palette for content types
 * @type {Record<ContentType, string>}
 */
const TYPE_COLORS = {
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
 * @type {string[]}
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
 * @param {ContentType} type - Content type
 * @returns {string} Color hex code
 */
export function getColorByType(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.unknown;
}

/**
 * Get color for a node based on size relative to total
 * Uses a heat map from cold (small) to hot (large)
 * @param {number} size - Node size
 * @param {number} totalSize - Total size
 * @returns {string} Color hex code
 */
export function getColorBySize(size, totalSize) {
  if (totalSize === 0) return HEATMAP_COLORS[0] || '#dbeafe';

  // Calculate percentage of total
  const percentage = (size / totalSize) * 100;

  // Map percentage to color index
  // 0-5%: coldest colors
  // 5-50%: medium colors
  // 50%+: hottest colors
  let colorIndex;

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
 * @param {number} size - Uncompressed size
 * @param {number} [compressedSize] - Compressed size
 * @returns {string} Color hex code
 */
export function getColorByCompression(size, compressedSize) {
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
 * @param {number} size - Node size
 * @param {ContentType} type - Content type
 * @param {number} totalSize - Total size
 * @param {number} [compressedSize] - Compressed size
 * @param {import('../../types/analysis.js').ColorMode} [mode='type'] - Color mode
 * @param {number[]} [percentiles=[]] - Size percentiles for gradient mode
 * @returns {string} Color hex code or HSL string
 */
export function getNodeColor(
  size,
  type,
  totalSize,
  compressedSize,
  mode = 'type',
  percentiles = []
) {
  switch (mode) {
    case 'size':
      // Use gradient if percentiles are available, otherwise fall back to old heat map
      if (percentiles && percentiles.length > 0) {
        return getColorBySizeGradient(size, totalSize, percentiles);
      }
      return getColorBySize(size, totalSize);
    case 'compression':
      return getColorByCompression(size, compressedSize);
    case 'type':
    default:
      return getColorByType(type);
  }
}

/**
 * Get label color for node (contrasting text color)
 * Enhanced with WCAG AA compliance check
 * @param {string} backgroundColor - Background color hex code
 * @param {number} [_minContrastRatio=4.5] - Minimum contrast ratio (unused)
 * @returns {string} Label color (black or white)
 */
export function getLabelColor(backgroundColor, _minContrastRatio = 4.5) {
  try {
    // Use color2k's readableColor which ensures good contrast
    // It returns white or black based on the background
    return readableColor(backgroundColor);
  } catch (error) {
    // Fallback to simple brightness check if color parsing fails
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2) || '00', 16);
    const g = parseInt(hex.substring(2, 4) || '00', 16);
    const b = parseInt(hex.substring(4, 6) || '00', 16);

    // Calculate perceived brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? '#000000' : '#ffffff';
  }
}

/**
 * Calculate WCAG contrast ratio between two colors
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} Contrast ratio (1-21)
 */
export function calculateContrastRatio(foreground, background) {
  /**
   * @param {string} color
   * @returns {number}
   */
  const getLuminance = (color) => {
    try {
      const [r, g, b] = parseToRgba(color);
      const rgb = [r / 255, g / 255, b / 255].map((val) => {
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    } catch (error) {
      return 0;
    }
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate color palette for WCAG AA compliance
 * Logs warnings for colors that don't meet minimum contrast ratios
 * @returns {void}
 */
export function validateColorPalette() {
  const borderColor = '#ffffff';
  const minGraphicsRatio = 3.0; // WCAG AA for graphical elements

  Object.entries(TYPE_COLORS).forEach(([type, color]) => {
    const ratio = calculateContrastRatio(color, borderColor);
    if (ratio < minGraphicsRatio) {
      console.warn(
        `[Color Scheme] ${type} color ${color} has insufficient contrast (${ratio.toFixed(2)}:1). ` +
          `WCAG AA requires ${minGraphicsRatio}:1 for graphics.`
      );
    }
  });
}

/**
 * Get hover highlight color (lightens or darkens by 10%)
 * @param {string} baseColor - Base color to modify
 * @returns {string} Modified color for hover state
 */
export function getHoverHighlightColor(baseColor) {
  try {
    // Lighten by 10% for hover effect
    return lightenColor(baseColor, 0.1);
  } catch (error) {
    return baseColor;
  }
}

/**
 * Get search highlight color (fixed yellow for visibility)
 * @returns {string} Yellow highlight color
 */
export function getSearchHighlightColor() {
  return '#fbbf24'; // Tailwind yellow-400
}

/**
 * Darken a color for borders/hover states
 * @param {string} color - Color to darken
 * @param {number} [amount=0.2] - Amount to darken (0-1)
 * @returns {string} Darkened color
 */
export function darkenColor(color, amount = 0.2) {
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
 * @param {string} color - Color to lighten
 * @param {number} [amount=0.2] - Amount to lighten (0-1)
 * @returns {string} Lightened color
 */
export function lightenColor(color, amount = 0.2) {
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
 * @returns {Array<{type: ContentType, color: string, label: string}>} Legend entries
 */
export function getTypeLegend() {
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
 * @returns {Array<{label: string, color: string}>} Legend entries
 */
export function getSizeLegend() {
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

/**
 * Calculate size percentiles from breakdown tree for gradient coloring
 * @param {import('../../types/analysis.js').BreakdownNode} root - Tree root
 * @returns {number[]} [p10, p25, p50, p75, p90] percentile values
 */
export function calculateSizePercentiles(root) {
  /**
   * Flatten tree to leaf nodes
   * @param {import('../../types/analysis.js').BreakdownNode} node
   * @returns {import('../../types/analysis.js').BreakdownNode[]}
   */
  const flattenToLeaves = (node) => {
    if (!node.children || node.children.length === 0) {
      return [node];
    }
    return node.children.flatMap(flattenToLeaves);
  };

  const leaves = flattenToLeaves(root);
  const sizes = leaves.map((n) => n.size).sort((a, b) => a - b);

  if (sizes.length === 0) {
    return [0, 0, 0, 0, 0];
  }

  return [
    sizes[Math.floor(sizes.length * 0.1)] || 0, // p10
    sizes[Math.floor(sizes.length * 0.25)] || 0, // p25
    sizes[Math.floor(sizes.length * 0.5)] || 0, // p50 (median)
    sizes[Math.floor(sizes.length * 0.75)] || 0, // p75
    sizes[Math.floor(sizes.length * 0.9)] || 0, // p90
  ];
}

/**
 * Calculate size-based gradient color (blue scale) for treemap nodes
 * @param {number} size - File size in bytes
 * @param {number} totalSize - Total app size in bytes (unused, kept for API compatibility)
 * @param {number[]} percentiles - [p10, p25, p50, p75, p90] percentile values in bytes
 * @param {import('../../types/analysis.js').ColorGradientConfig} [config] - Optional gradient configuration
 * @returns {string} HSL color string
 */
export function getColorBySizeGradient(size, totalSize, percentiles, config = {}) {
  const {
    hue = 210, // Blue
    minSaturation = 70,
    maxSaturation = 90,
    minLightness = 20, // Darkest (large files)
    maxLightness = 90, // Lightest (small files)
  } = config;

  // Edge case: no percentiles or empty
  if (!percentiles || percentiles.length === 0) {
    return `hsl(${hue}, 80%, 55%)`; // Mid-tone blue
  }

  // Map size to percentile bucket and assign lightness
  // Percentiles represent absolute sizes (bytes), not percentages of total
  // e.g., if p10 = 1KB, it means "10% of files are smaller than 1KB"
  let lightness;
  if (size < percentiles[0]) {
    lightness = maxLightness; // Bottom 10%: lightest (90%)
  } else if (size < percentiles[1]) {
    lightness = 75; // 10th-25th percentile
  } else if (size < percentiles[2]) {
    lightness = 60; // 25th-50th percentile (median)
  } else if (size < percentiles[3]) {
    lightness = 45; // 50th-75th percentile
  } else if (size < percentiles[4]) {
    lightness = 30; // 75th-90th percentile
  } else {
    lightness = minLightness; // Top 10%: darkest (20%)
  }

  // Calculate saturation (more vibrant for larger files)
  const saturationRange = maxSaturation - minSaturation;
  const lightnessNormalized = (maxLightness - lightness) / (maxLightness - minLightness);
  const saturation = minSaturation + saturationRange * lightnessNormalized;

  return `hsl(${hue}, ${Math.round(saturation)}%, ${lightness}%)`;
}
