import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BreakdownTable } from '@/components/breakdown/BreakdownTable';
import type { BreakdownNode } from '@/types/analysis';
import { useAnalysisStore } from '@/store/analysis-store';

// Mock the Zustand store
vi.mock('@/store/analysis-store', () => ({
  useAnalysisStore: vi.fn(),
}));

describe('BreakdownTable - Sorting', () => {
  const mockStore = {
    breakdownExpandedNodes: new Set<string>(),
    toggleBreakdownNode: vi.fn(),
    breakdownSearchQuery: '',
    breakdownSortBy: 'size' as const,
    breakdownSortOrder: 'desc' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAnalysisStore as any).mockReturnValue(mockStore);
  });

  const createMockTree = (): BreakdownNode => ({
    id: 'root',
    name: 'Root',
    path: '/',
    size: 1500,
    type: 'bundle',
    children: [
      {
        id: 'small',
        name: 'small.txt',
        path: '/small.txt',
        size: 100,
        type: 'data',
        children: [],
      },
      {
        id: 'large',
        name: 'large.bin',
        path: '/large.bin',
        size: 900,
        type: 'executable',
        children: [],
      },
      {
        id: 'medium',
        name: 'medium.png',
        path: '/medium.png',
        size: 500,
        type: 'image',
        children: [],
      },
    ],
  });

  describe('default sorting (size descending)', () => {
    it('should display largest file first when sorted by size descending', () => {
      const mockTree = createMockTree();

      render(<BreakdownTable breakdownRoot={mockTree} totalSize={1500} activeTab="all" />);

      // Get all rows (virtual scrolling renders visible rows)
      const rows = screen.getAllByText(/\.(txt|bin|png)/);

      // When implemented correctly, largest file (large.bin - 900 bytes) should appear first
      // NOTE: This test will FAIL until T008-T012 are implemented
      expect(rows[0]).toHaveTextContent('large.bin');
    });

    it('should display files in descending size order', () => {
      const mockTree = createMockTree();

      render(<BreakdownTable breakdownRoot={mockTree} totalSize={1500} activeTab="all" />);

      const rows = screen.getAllByText(/\.(txt|bin|png)/);

      // Expected order: large.bin (900) → medium.png (500) → small.txt (100)
      expect(rows[0]).toHaveTextContent('large.bin');
      expect(rows[1]).toHaveTextContent('medium.png');
      expect(rows[2]).toHaveTextContent('small.txt');
    });
  });

  describe('nested directory sorting', () => {
    it('should sort children when directory is expanded', () => {
      const treeWithNestedChildren: BreakdownNode = {
        id: 'root',
        name: 'Root',
        path: '/',
        size: 2000,
        type: 'bundle',
        children: [
          {
            id: 'frameworks',
            name: 'Frameworks',
            path: '/Frameworks',
            size: 2000,
            type: 'framework',
            children: [
              {
                id: 'fw1',
                name: 'SmallFramework.framework',
                path: '/Frameworks/SmallFramework.framework',
                size: 300,
                type: 'framework',
                children: [],
              },
              {
                id: 'fw2',
                name: 'LargeFramework.framework',
                path: '/Frameworks/LargeFramework.framework',
                size: 1700,
                type: 'framework',
                children: [],
              },
            ],
          },
        ],
      };

      // Expand the Frameworks directory
      const storeWithExpanded = {
        ...mockStore,
        breakdownExpandedNodes: new Set(['frameworks']),
      };
      (useAnalysisStore as any).mockReturnValue(storeWithExpanded);

      render(
        <BreakdownTable breakdownRoot={treeWithNestedChildren} totalSize={2000} activeTab="all" />
      );

      const rows = screen.getAllByText(/Framework/);

      // Parent directory should appear first, then its children sorted by size
      expect(rows[0]).toHaveTextContent('Frameworks'); // Parent
      expect(rows[1]).toHaveTextContent('LargeFramework.framework'); // 1700 bytes
      expect(rows[2]).toHaveTextContent('SmallFramework.framework'); // 300 bytes
    });
  });

  describe('tab filtering with sorting', () => {
    it('should maintain sort order when filtering by frameworks tab', () => {
      const mockTree: BreakdownNode = {
        id: 'root',
        name: 'Root',
        path: '/',
        size: 2000,
        type: 'bundle',
        children: [
          {
            id: 'image1',
            name: 'image.png',
            path: '/image.png',
            size: 500,
            type: 'image',
            children: [],
          },
          {
            id: 'fw1',
            name: 'SmallFramework.framework',
            path: '/SmallFramework.framework',
            size: 300,
            type: 'framework',
            children: [],
          },
          {
            id: 'fw2',
            name: 'LargeFramework.framework',
            path: '/LargeFramework.framework',
            size: 1200,
            type: 'framework',
            children: [],
          },
        ],
      };

      render(<BreakdownTable breakdownRoot={mockTree} totalSize={2000} activeTab="frameworks" />);

      // Only frameworks should appear, sorted by size descending
      const frameworks = screen.getAllByText(/Framework/);

      expect(frameworks).toHaveLength(2);
      expect(frameworks[0]).toHaveTextContent('LargeFramework.framework'); // 1200 bytes
      expect(frameworks[1]).toHaveTextContent('SmallFramework.framework'); // 300 bytes
    });

    it('should maintain sort order when filtering by assets tab', () => {
      const mockTree: BreakdownNode = {
        id: 'root',
        name: 'Root',
        path: '/',
        size: 1500,
        type: 'bundle',
        children: [
          {
            id: 'fw',
            name: 'Framework.framework',
            path: '/Framework.framework',
            size: 500,
            type: 'framework',
            children: [],
          },
          {
            id: 'img1',
            name: 'small.png',
            path: '/small.png',
            size: 200,
            type: 'image',
            children: [],
          },
          {
            id: 'img2',
            name: 'large.png',
            path: '/large.png',
            size: 800,
            type: 'image',
            children: [],
          },
        ],
      };

      render(<BreakdownTable breakdownRoot={mockTree} totalSize={1500} activeTab="assets" />);

      // Only images should appear, sorted by size descending
      const images = screen.getAllByText(/\.png/);

      expect(images).toHaveLength(2);
      expect(images[0]).toHaveTextContent('large.png'); // 800 bytes
      expect(images[1]).toHaveTextContent('small.png'); // 200 bytes
    });

    it('should maintain sort order when filtering by localizations tab', () => {
      const mockTree: BreakdownNode = {
        id: 'root',
        name: 'Root',
        path: '/',
        size: 600,
        type: 'bundle',
        children: [
          {
            id: 'l1',
            name: 'en.lproj',
            path: '/en.lproj',
            size: 100,
            type: 'localization',
            children: [],
          },
          {
            id: 'l2',
            name: 'fr.lproj',
            path: '/fr.lproj',
            size: 300,
            type: 'localization',
            children: [],
          },
          {
            id: 'l3',
            name: 'de.lproj',
            path: '/de.lproj',
            size: 200,
            type: 'localization',
            children: [],
          },
        ],
      };

      render(
        <BreakdownTable breakdownRoot={mockTree} totalSize={600} activeTab="localizations" />
      );

      // Only localizations should appear, sorted by size descending
      const localizations = screen.getAllByText(/\.lproj/);

      expect(localizations).toHaveLength(3);
      expect(localizations[0]).toHaveTextContent('fr.lproj'); // 300 bytes
      expect(localizations[1]).toHaveTextContent('de.lproj'); // 200 bytes
      expect(localizations[2]).toHaveTextContent('en.lproj'); // 100 bytes
    });
  });

  describe('edge cases', () => {
    it('should handle files with identical sizes (stable sort)', () => {
      const mockTree: BreakdownNode = {
        id: 'root',
        name: 'Root',
        path: '/',
        size: 300,
        type: 'bundle',
        children: [
          {
            id: 'a',
            name: 'a.txt',
            path: '/a.txt',
            size: 100,
            type: 'data',
            children: [],
          },
          {
            id: 'b',
            name: 'b.txt',
            path: '/b.txt',
            size: 100,
            type: 'data',
            children: [],
          },
          {
            id: 'c',
            name: 'c.txt',
            path: '/c.txt',
            size: 100,
            type: 'data',
            children: [],
          },
        ],
      };

      render(<BreakdownTable breakdownRoot={mockTree} totalSize={300} activeTab="all" />);

      const rows = screen.getAllByText(/\.txt/);

      // Stable sort should preserve original order
      expect(rows[0]).toHaveTextContent('a.txt');
      expect(rows[1]).toHaveTextContent('b.txt');
      expect(rows[2]).toHaveTextContent('c.txt');
    });

    it('should display empty directories at bottom (size=0)', () => {
      const mockTree: BreakdownNode = {
        id: 'root',
        name: 'Root',
        path: '/',
        size: 500,
        type: 'bundle',
        children: [
          {
            id: 'empty',
            name: 'EmptyDir',
            path: '/EmptyDir',
            size: 0,
            type: 'bundle',
            children: [],
          },
          {
            id: 'file',
            name: 'file.txt',
            path: '/file.txt',
            size: 500,
            type: 'data',
            children: [],
          },
        ],
      };

      render(<BreakdownTable breakdownRoot={mockTree} totalSize={500} activeTab="all" />);

      const items = screen.getAllByText(/(EmptyDir|file\.txt)/);

      // File with size should appear before empty directory
      expect(items[0]).toHaveTextContent('file.txt'); // 500 bytes
      expect(items[1]).toHaveTextContent('EmptyDir'); // 0 bytes
    });
  });
});
