/**
 * Unit Tests for Node Label Calculator
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNodeLabel,
  truncateLabel,
  estimateTextWidth,
} from '../../../lib/visualization/node-label-calculator';
import type { TreemapNode } from '../../../lib/visualization/treemap-generator';

describe('NodeLabelCalculator', () => {
  describe('calculateNodeLabel', () => {
    it('should show label when box meets threshold (>= 50x20px)', () => {
      const node: TreemapNode & { width?: number; height?: number } = {
        path: 'test.txt',
        name: 'test.txt',
        value: 1000,
        type: 'data',
        compressedSize: undefined,
        width: 100, // >= 50
        height: 30, // >= 20
      };

      const metadata = calculateNodeLabel(node, 12);

      expect(metadata.shouldShowLabel).toBe(true);
      expect(metadata.meetsWidthThreshold).toBe(true);
      expect(metadata.meetsHeightThreshold).toBe(true);
      expect(metadata.boxWidth).toBe(100);
      expect(metadata.boxHeight).toBe(30);
    });

    it('should NOT show label when box width is too small (< 50px)', () => {
      const node: TreemapNode & { width?: number; height?: number } = {
        path: 'test.txt',
        name: 'test.txt',
        value: 1000,
        type: 'data',
        compressedSize: undefined,
        width: 40, // < 50
        height: 30, // >= 20
      };

      const metadata = calculateNodeLabel(node, 12);

      expect(metadata.shouldShowLabel).toBe(false);
      expect(metadata.meetsWidthThreshold).toBe(false);
      expect(metadata.meetsHeightThreshold).toBe(true);
    });

    it('should NOT show label when box height is too small (< 20px)', () => {
      const node: TreemapNode & { width?: number; height?: number } = {
        path: 'test.txt',
        name: 'test.txt',
        value: 1000,
        type: 'data',
        compressedSize: undefined,
        width: 100, // >= 50
        height: 15, // < 20
      };

      const metadata = calculateNodeLabel(node, 12);

      expect(metadata.shouldShowLabel).toBe(false);
      expect(metadata.meetsWidthThreshold).toBe(true);
      expect(metadata.meetsHeightThreshold).toBe(false);
    });

    it('should NOT show label when both dimensions are too small', () => {
      const node: TreemapNode & { width?: number; height?: number } = {
        path: 'test.txt',
        name: 'test.txt',
        value: 1000,
        type: 'data',
        compressedSize: undefined,
        width: 40, // < 50
        height: 15, // < 20
      };

      const metadata = calculateNodeLabel(node, 12);

      expect(metadata.shouldShowLabel).toBe(false);
      expect(metadata.meetsWidthThreshold).toBe(false);
      expect(metadata.meetsHeightThreshold).toBe(false);
    });

    it('should return correct label text without truncation for short names', () => {
      const node: TreemapNode & { width?: number; height?: number } = {
        path: 'short.txt',
        name: 'short.txt',
        value: 1000,
        type: 'data',
        compressedSize: undefined,
        width: 200,
        height: 50,
      };

      const metadata = calculateNodeLabel(node, 12);

      expect(metadata.labelText).toBe('short.txt');
      expect(metadata.requiresTruncation).toBe(false);
    });

    it('should truncate label text for long names that do not fit', () => {
      const node: TreemapNode & { width?: number; height?: number } = {
        path: 'VeryLongFileNameThatWillNotFitInTheBox.framework',
        name: 'VeryLongFileNameThatWillNotFitInTheBox.framework',
        value: 1000,
        type: 'framework',
        compressedSize: undefined,
        width: 80, // Small width
        height: 30,
      };

      const metadata = calculateNodeLabel(node, 12);

      expect(metadata.requiresTruncation).toBe(true);
      expect(metadata.labelText).toContain('...');
      expect(metadata.labelText.length).toBeLessThan(node.name.length);
    });
  });

  describe('truncateLabel', () => {
    it('should return original text when it fits within maxWidth', () => {
      const text = 'Short';
      const maxWidth = 100;
      const fontSize = 12;

      const result = truncateLabel(text, maxWidth, fontSize);

      expect(result).toBe(text);
    });

    it('should truncate long text with ellipsis', () => {
      const text = 'VeryLongTextThatNeedsToBeShortened';
      const maxWidth = 50;
      const fontSize = 12;

      const result = truncateLabel(text, maxWidth, fontSize);

      expect(result).toContain('...');
      expect(result.length).toBeLessThan(text.length);
      expect(estimateTextWidth(result, fontSize)).toBeLessThanOrEqual(maxWidth);
    });

    it('should handle very small maxWidth gracefully', () => {
      const text = 'Text';
      const maxWidth = 10;
      const fontSize = 12;

      const result = truncateLabel(text, maxWidth, fontSize);

      expect(result).toContain('...');
      expect(estimateTextWidth(result, fontSize)).toBeLessThanOrEqual(maxWidth);
    });
  });

  describe('estimateTextWidth', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTextWidth('', 12)).toBe(0);
    });

    it('should estimate width proportional to text length', () => {
      const fontSize = 12;
      const shortText = 'ABC';
      const longText = 'ABCDEFGHIJ';

      const shortWidth = estimateTextWidth(shortText, fontSize);
      const longWidth = estimateTextWidth(longText, fontSize);

      expect(longWidth).toBeGreaterThan(shortWidth);
      expect(longWidth / shortWidth).toBeCloseTo(longText.length / shortText.length, 1);
    });

    it('should estimate width proportional to font size', () => {
      const text = 'Sample';
      const smallFont = 10;
      const largeFont = 20;

      const smallWidth = estimateTextWidth(text, smallFont);
      const largeWidth = estimateTextWidth(text, largeFont);

      expect(largeWidth).toBeGreaterThan(smallWidth);
      expect(largeWidth / smallWidth).toBe(largeFont / smallFont);
    });

    it('should use average character width of ~0.6 * fontSize', () => {
      const text = 'A'; // Single character
      const fontSize = 12;

      const width = estimateTextWidth(text, fontSize);

      // For single character: width = 1 * 12 * 0.6 = 7.2
      expect(width).toBe(7.2);
    });
  });
});
