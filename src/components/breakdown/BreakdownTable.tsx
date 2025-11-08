/**
 * Breakdown Table Component
 *
 * Virtual scrolling table for displaying hierarchical breakdown data
 */

import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BreakdownNode } from '../../types/analysis';
import type { FlattenedNode } from '../../lib/analysis/breakdown-generator';
import { sortTree } from '../../lib/analysis/breakdown-generator';
import { formatBytes, formatPercentage } from '../../utils/formatters';
import { useAnalysisStore } from '../../store/analysis-store';

export interface BreakdownTableProps {
  breakdownRoot: BreakdownNode;
  totalSize: number;
  activeTab: 'all' | 'frameworks' | 'assets' | 'localizations';
}

export function BreakdownTable({ breakdownRoot, totalSize, activeTab }: BreakdownTableProps) {
  const {
    breakdownExpandedNodes,
    toggleBreakdownNode,
    breakdownSearchQuery,
    breakdownSortBy,
    breakdownSortOrder,
  } = useAnalysisStore();

  // Filter nodes based on active tab
  const filteredRoot = useMemo(() => {
    if (activeTab === 'all') return breakdownRoot;

    // Filter based on content type
    const filterByType = (node: BreakdownNode): BreakdownNode | null => {
      let shouldInclude = false;

      if (activeTab === 'frameworks') {
        shouldInclude = node.type === 'framework' || node.type === 'native_lib';
      } else if (activeTab === 'assets') {
        shouldInclude = ['image', 'video', 'audio', 'font', 'asset'].includes(node.type);
      } else if (activeTab === 'localizations') {
        shouldInclude = node.type === 'localization';
      }

      const filteredChildren = node.children
        .map(filterByType)
        .filter((n): n is BreakdownNode => n !== null);

      if (shouldInclude || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return filterByType(breakdownRoot) || breakdownRoot;
  }, [breakdownRoot, activeTab]);

  // Sort tree by size descending (applied after filtering, before flattening)
  const sortedRoot = useMemo(() => {
    return sortTree(filteredRoot, breakdownSortBy, breakdownSortOrder);
  }, [filteredRoot, breakdownSortBy, breakdownSortOrder]);

  // Flatten tree to visible nodes only (respecting expanded state)
  const visibleNodes = useMemo(() => {
    const flattened: FlattenedNode[] = [];

    const traverse = (node: BreakdownNode, depth: number, parentPath: string) => {
      // Apply search filter
      const matchesSearch =
        !breakdownSearchQuery ||
        node.name.toLowerCase().includes(breakdownSearchQuery.toLowerCase());

      if (!matchesSearch && depth > 0) return; // Skip non-matching nodes (except root)

      flattened.push({
        node,
        depth,
        hasChildren: node.children.length > 0,
        parentPath,
      });

      // Only traverse children if node is expanded
      if (breakdownExpandedNodes.has(node.id) || depth === 0) {
        for (const child of node.children) {
          traverse(child, depth + 1, node.path);
        }
      }
    };

    traverse(sortedRoot, 0, '');

    return flattened;
  }, [sortedRoot, breakdownExpandedNodes, breakdownSearchQuery]);

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated row height in pixels
    overscan: 10, // Render extra rows for smoother scrolling
  });

  return (
    <div className="flex flex-col h-full">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-700 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-2 text-right">Size</div>
          <div className="col-span-2 text-right">Compressed</div>
          <div className="col-span-2 text-right">% of Total</div>
        </div>
      </div>

      {/* Virtual Scrolling Container */}
      <div ref={parentRef} className="flex-1 overflow-auto bg-white">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const itemIdx = virtualRow.index;
            if (itemIdx === undefined) return null;

            const item = visibleNodes[itemIdx];
            if (!item) return null;

            const { node, depth, hasChildren } = item;
            const isExpanded = breakdownExpandedNodes.has(node.id);
            const percentage = (node.size / totalSize) * 100;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="px-6 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center text-sm">
                  {/* Name Column */}
                  <div className="col-span-6 flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                    {hasChildren && (
                      <button
                        onClick={() => toggleBreakdownNode(node.id)}
                        className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                    <span className="font-medium text-gray-900">{node.name}</span>
                    <span className="ml-2 text-xs text-gray-500">({node.type})</span>
                  </div>

                  {/* Size Column */}
                  <div className="col-span-2 text-right text-gray-700">{formatBytes(node.size)}</div>

                  {/* Compressed Size Column */}
                  <div className="col-span-2 text-right text-gray-600">
                    {node.compressedSize ? formatBytes(node.compressedSize) : '-'}
                  </div>

                  {/* Percentage Column */}
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-700 w-12 text-right">
                        {formatPercentage(node.size, totalSize)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="text-sm text-gray-600">
          Showing {visibleNodes.length} items
          {breakdownSearchQuery && ` (filtered by "${breakdownSearchQuery}")`}
        </div>
      </div>
    </div>
  );
}
