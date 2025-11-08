import { describe, it, expect } from 'vitest';
import { sortTree } from '@/lib/analysis/breakdown-generator';
import type { BreakdownNode } from '@/types/analysis';

describe('sortTree', () => {
  // Helper to create a test node
  const createNode = (
    name: string,
    size: number,
    children: BreakdownNode[] = []
  ): BreakdownNode => ({
    id: name,
    name,
    path: `/${name}`,
    size,
    type: 'data',
    children,
  });

  describe('size sorting (descending)', () => {
    it('should sort children by size in descending order', () => {
      const tree = createNode('root', 1000, [
        createNode('small.txt', 100),
        createNode('large.bin', 900),
        createNode('medium.png', 500),
      ]);

      const sorted = sortTree(tree, 'size', 'desc');

      expect(sorted.children[0]?.name).toBe('large.bin'); // 900 bytes
      expect(sorted.children[1]?.name).toBe('medium.png'); // 500 bytes
      expect(sorted.children[2]?.name).toBe('small.txt'); // 100 bytes
    });

    it('should sort children by size in ascending order', () => {
      const tree = createNode('root', 1000, [
        createNode('small.txt', 100),
        createNode('large.bin', 900),
        createNode('medium.png', 500),
      ]);

      const sorted = sortTree(tree, 'size', 'asc');

      expect(sorted.children[0]?.name).toBe('small.txt'); // 100 bytes
      expect(sorted.children[1]?.name).toBe('medium.png'); // 500 bytes
      expect(sorted.children[2]?.name).toBe('large.bin'); // 900 bytes
    });

    it('should preserve stable sort for items with identical sizes', () => {
      const tree = createNode('root', 300, [
        createNode('a.txt', 100),
        createNode('b.txt', 100),
        createNode('c.txt', 100),
      ]);

      const sorted = sortTree(tree, 'size', 'desc');

      // Stable sort: original order preserved for equal values
      expect(sorted.children[0]?.name).toBe('a.txt');
      expect(sorted.children[1]?.name).toBe('b.txt');
      expect(sorted.children[2]?.name).toBe('c.txt');
    });

    it('should handle empty children array', () => {
      const tree = createNode('root', 100, []);

      const sorted = sortTree(tree, 'size', 'desc');

      expect(sorted.children).toEqual([]);
    });

    it('should handle single child', () => {
      const tree = createNode('root', 100, [createNode('only-child.txt', 100)]);

      const sorted = sortTree(tree, 'size', 'desc');

      expect(sorted.children).toHaveLength(1);
      expect(sorted.children[0]?.name).toBe('only-child.txt');
    });

    it('should not mutate original tree', () => {
      const tree = createNode('root', 1000, [
        createNode('small.txt', 100),
        createNode('large.bin', 900),
      ]);

      const originalOrder = tree.children.map((c) => c.name);

      sortTree(tree, 'size', 'desc');

      // Original tree unchanged
      expect(tree.children.map((c) => c.name)).toEqual(originalOrder);
    });
  });

  describe('recursive sorting', () => {
    it('should recursively sort all nested children by size descending', () => {
      const tree = createNode('root', 2000, [
        createNode('dir1', 600, [
          createNode('dir1-small.txt', 100),
          createNode('dir1-large.bin', 500),
        ]),
        createNode('dir2', 1400, [
          createNode('dir2-small.txt', 200),
          createNode('dir2-large.bin', 1200),
        ]),
      ]);

      const sorted = sortTree(tree, 'size', 'desc');

      // Root level sorted (largest first)
      expect(sorted.children[0]?.name).toBe('dir2'); // 1400 bytes
      expect(sorted.children[1]?.name).toBe('dir1'); // 600 bytes

      // dir2 children sorted
      expect(sorted.children[0]?.children[0]?.name).toBe('dir2-large.bin'); // 1200
      expect(sorted.children[0]?.children[1]?.name).toBe('dir2-small.txt'); // 200

      // dir1 children sorted
      expect(sorted.children[1]?.children[0]?.name).toBe('dir1-large.bin'); // 500
      expect(sorted.children[1]?.children[1]?.name).toBe('dir1-small.txt'); // 100
    });

    it('should handle deeply nested trees (5+ levels)', () => {
      const level5 = createNode('level5', 50, [createNode('file5.txt', 50)]);
      const level4 = createNode('level4', 100, [level5]);
      const level3 = createNode('level3', 200, [level4]);
      const level2 = createNode('level2', 300, [level3]);
      const level1 = createNode('level1', 400, [level2]);

      const sorted = sortTree(level1, 'size', 'desc');

      // Verify sorting reached all levels
      expect(sorted.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.name).toBe(
        'file5.txt'
      );
    });
  });

  describe('name sorting', () => {
    it('should sort children by name alphabetically (ascending)', () => {
      const tree = createNode('root', 300, [
        createNode('zebra.txt', 100),
        createNode('apple.txt', 100),
        createNode('banana.txt', 100),
      ]);

      const sorted = sortTree(tree, 'name', 'asc');

      expect(sorted.children[0]?.name).toBe('apple.txt');
      expect(sorted.children[1]?.name).toBe('banana.txt');
      expect(sorted.children[2]?.name).toBe('zebra.txt');
    });

    it('should sort children by name reverse alphabetically (descending)', () => {
      const tree = createNode('root', 300, [
        createNode('zebra.txt', 100),
        createNode('apple.txt', 100),
        createNode('banana.txt', 100),
      ]);

      const sorted = sortTree(tree, 'name', 'desc');

      expect(sorted.children[0]?.name).toBe('zebra.txt');
      expect(sorted.children[1]?.name).toBe('banana.txt');
      expect(sorted.children[2]?.name).toBe('apple.txt');
    });
  });

  describe('type sorting', () => {
    it('should sort children by type alphabetically', () => {
      const tree: BreakdownNode = {
        id: 'root',
        name: 'root',
        path: '/root',
        size: 300,
        type: 'bundle',
        children: [
          { id: '1', name: 'file1', path: '/file1', size: 100, type: 'image', children: [] },
          { id: '2', name: 'file2', path: '/file2', size: 100, type: 'data', children: [] },
          { id: '3', name: 'file3', path: '/file3', size: 100, type: 'executable', children: [] },
        ],
      };

      const sorted = sortTree(tree, 'type', 'asc');

      expect(sorted.children[0]?.type).toBe('data');
      expect(sorted.children[1]?.type).toBe('executable');
      expect(sorted.children[2]?.type).toBe('image');
    });
  });

  describe('edge cases', () => {
    it('should treat files with size 0 as smallest', () => {
      const tree = createNode('root', 200, [
        createNode('zero.txt', 0),
        createNode('small.txt', 100),
        createNode('large.txt', 100),
      ]);

      const sorted = sortTree(tree, 'size', 'desc');

      expect(sorted.children[2]?.name).toBe('zero.txt'); // 0 bytes at bottom
    });

    it('should handle negative sizes (edge case)', () => {
      const tree: BreakdownNode = {
        id: 'root',
        name: 'root',
        path: '/root',
        size: 0,
        type: 'bundle',
        children: [
          { id: '1', name: 'positive', path: '/pos', size: 100, type: 'data', children: [] },
          { id: '2', name: 'negative', path: '/neg', size: -50, type: 'data', children: [] },
        ],
      };

      const sorted = sortTree(tree, 'size', 'desc');

      expect(sorted.children[0]?.name).toBe('positive'); // 100
      expect(sorted.children[1]?.name).toBe('negative'); // -50
    });
  });
});
