/**
 * Color Scheme Contract (WCAG AA Compliant)
 *
 * Defines color mapping with accessibility compliance
 */

import type { ContentType } from '../../../src/types/analysis';

/**
 * WCAG color configuration
 *
 * Stores color with pre-calculated contrast ratios
 */
export interface WCAGColorConfig {
  /** Background color (hex) */
  backgroundColor: string;

  /** Computed text color for contrast (black or white) */
  textColor: string;

  /** Calculated contrast ratio against white background */
  contrastRatio: number;

  /** True if ratio >= 4.5:1 (WCAG AA text) */
  meetsWCAG_AA: boolean;

  /** True if ratio >= 3:1 (WCAG AA large text/graphics) */
  meetsWCAG_AA_Large: boolean;

  /** True if ratio >= 7:1 (WCAG AAA) */
  meetsWCAG_AAA: boolean;
}

/**
 * Type color palette (validated for WCAG AA)
 */
export const TYPE_COLORS: Record<ContentType, string>;

/**
 * WCAG-validated color palette
 *
 * Pre-computed at initialization with contrast ratios
 */
export const WCAG_VALIDATED_COLORS: Record<ContentType, WCAGColorConfig>;

/**
 * Get node color based on scheme
 *
 * @param size - Node size in bytes
 * @param type - Content type
 * @param totalSize - Total app size in bytes
 * @param compressedSize - Compressed size (if applicable)
 * @param scheme - Color scheme mode ('size' or 'type')
 * @returns Hex color string
 *
 * @remarks
 * - 'type' mode: Returns TYPE_COLORS[type]
 * - 'size' mode: Returns color from gradient based on size percentage
 *
 * @example
 * const color = getNodeColor(1024000, 'frameworks', 10240000, undefined, 'type');
 * // Returns: '#10b981' (frameworks color)
 */
export function getNodeColor(
  size: number,
  type: ContentType,
  totalSize: number,
  compressedSize: number | undefined,
  scheme: 'size' | 'type'
): string;

/**
 * Get label text color with WCAG AA contrast guarantee
 *
 * @param backgroundColor - Node background color (hex)
 * @param minContrastRatio - Minimum contrast ratio (default: 4.5:1)
 * @returns Text color (black or white hex)
 *
 * @remarks
 * Calculates contrast of white and black against background
 * Returns whichever meets minimum ratio
 * Fallback: returns color with higher contrast if neither meets minimum
 *
 * @example
 * const textColor = getLabelColor('#3b82f6', 4.5);
 * // Returns: '#ffffff' (white has 4.6:1 contrast with blue)
 */
export function getLabelColor(
  backgroundColor: string,
  minContrastRatio?: number
): string;

/**
 * Calculate contrast ratio between two colors
 *
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns Contrast ratio (1-21)
 *
 * @remarks
 * Uses WCAG 2.1 relative luminance formula
 * Returns value between 1:1 (same color) and 21:1 (black vs white)
 *
 * @example
 * const ratio = calculateContrastRatio('#ffffff', '#000000');
 * // Returns: 21 (maximum contrast)
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): number;

/**
 * Validate color palette for WCAG AA compliance
 *
 * @param palette - Color palette to validate
 * @param borderColor - Border color to test against (default: white)
 * @returns Validation results for each color
 *
 * @remarks
 * Checks all colors in palette against border color
 * Adjusts colors if needed to meet WCAG AA (3:1 for graphics)
 * Updates WCAG_VALIDATED_COLORS global
 *
 * @example
 * const validatedPalette = validateColorPalette(TYPE_COLORS, '#ffffff');
 * // Returns: Record<ContentType, WCAGColorConfig>
 */
export function validateColorPalette(
  palette: Record<ContentType, string>,
  borderColor?: string
): Record<ContentType, WCAGColorConfig>;

/**
 * Ensure color meets WCAG contrast requirement
 *
 * @param color - Color to validate (hex)
 * @param background - Background color (hex)
 * @param minRatio - Minimum contrast ratio required
 * @returns Adjusted color that meets minimum ratio
 *
 * @remarks
 * If color doesn't meet ratio, adjusts lightness until it does
 * Preserves hue and saturation when possible
 *
 * @example
 * const adjustedColor = ensureWCAGContrast('#3b82f6', '#ffffff', 3.0);
 * // Returns: '#2563eb' (darker blue if needed for 3:1 contrast)
 */
export function ensureWCAGContrast(
  color: string,
  background: string,
  minRatio: number
): string;

/**
 * Get hover highlight color
 *
 * @param baseColor - Base node color (hex)
 * @returns Highlight color (slightly lighter/darker)
 *
 * @remarks
 * Lightens dark colors by 10%
 * Darkens light colors by 10%
 * Maintains WCAG AA contrast with borders
 */
export function getHoverHighlightColor(baseColor: string): string;

/**
 * Get search match highlight color
 *
 * @returns Yellow highlight color (#fbbf24)
 *
 * @remarks
 * Fixed color for consistency
 * Meets WCAG AA contrast with white borders (3:1)
 */
export function getSearchHighlightColor(): string;

/**
 * Color scheme mode type
 */
export type ColorSchemeMode = 'size' | 'type';

/**
 * Size gradient configuration
 *
 * Defines color stops for 'size' mode gradient
 */
export interface SizeGradientConfig {
  /** Minimum size threshold (0% of total) */
  minColor: string;

  /** Medium size threshold (50% of total) */
  midColor: string;

  /** Maximum size threshold (100% of total) */
  maxColor: string;
}

/**
 * Default size gradient (blue scale)
 */
export const SIZE_GRADIENT: SizeGradientConfig;
