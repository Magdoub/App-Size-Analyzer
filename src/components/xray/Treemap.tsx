/**
 * Treemap Component
 *
 * Interactive treemap visualization using Nivo's ResponsiveTreeMapCanvas
 */

import { ResponsiveTreeMapCanvas } from '@nivo/treemap';
import type { TreemapNode } from '../../lib/visualization/treemap-generator';
import { getNodeColor, getLabelColor } from '../../lib/visualization/color-scheme';
import { formatBytes } from '../../utils/formatters';

interface TreemapProps {
  data: TreemapNode;
  totalSize: number;
  colorScheme: 'size' | 'type';
  searchMatches?: string[];
  onNodeClick?: (path: string) => void;
}

export function Treemap({
  data,
  totalSize,
  colorScheme,
  searchMatches = [],
  onNodeClick,
}: TreemapProps) {
  // Debug logging
  console.log('[Treemap] Received data:', data);
  console.log('[Treemap] Data has children:', data.children?.length);
  console.log('[Treemap] Data value:', data.value);
  console.log('[Treemap] Total size:', totalSize);

  // Validation
  if (!data || data.value === 0) {
    console.error('[Treemap] Invalid data - no value');
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Invalid treemap data (size is 0)</div>
      </div>
    );
  }

  if (!data.children || data.children.length === 0) {
    console.warn('[Treemap] Root has no children - showing single node');
  }

  return (
    <div className="w-full border border-gray-300 rounded-lg" style={{ height: '650px', backgroundColor: '#f9fafb' }}>
      <ResponsiveTreeMapCanvas
        data={data}
        identity="name"
        value="value"
        valueFormat={(value) => formatBytes(value as number)}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        labelSkipSize={1}
        labelTextColor={(node: any) => {
          // Canvas treemap wraps node in { node: {...} } structure
          const actualNode = node.node || node;
          if (!actualNode.data) {
            return '#000000'; // Default to black if no data
          }
          const color = getNodeColor(
            actualNode.value,
            actualNode.data.type,
            totalSize,
            actualNode.data.compressedSize,
            colorScheme
          );
          return getLabelColor(color);
        }}
        colors={(node: any) => {
          // Canvas treemap wraps node in { node: {...} } structure
          const actualNode = node.node || node;
          if (!actualNode.data) {
            return '#94a3b8'; // Default gray if no data
          }

          // Highlight search matches
          if (searchMatches.includes(actualNode.data.path)) {
            return '#fbbf24'; // Yellow highlight
          }

          const color = getNodeColor(
            actualNode.value,
            actualNode.data.type,
            totalSize,
            actualNode.data.compressedSize,
            colorScheme
          );
          return color;
        }}
        borderWidth={1}
        borderColor="#ffffff"
        orientLabel={false}
        onClick={(node: any) => {
          // Canvas treemap wraps node in { node: {...} } structure
          const actualNode = node.node || node;
          if (onNodeClick && actualNode.data) {
            onNodeClick(actualNode.data.path);
          }
        }}
        nodeOpacity={1}
        tooltip={(node: any) => {
          // Canvas treemap wraps node in { node: {...} } structure
          const actualNode = node.node || node;

          // DEBUG: Log the actual node structure
          console.log('[Treemap Tooltip] actualNode:', actualNode);
          console.log('[Treemap Tooltip] actualNode.data:', actualNode.data);
          console.log('[Treemap Tooltip] actualNode.id:', actualNode.id);
          console.log('[Treemap Tooltip] actualNode.value:', actualNode.value);
          if (actualNode.data) {
            console.log('[Treemap Tooltip] actualNode.data.name:', actualNode.data.name);
            console.log('[Treemap Tooltip] actualNode.data.type:', actualNode.data.type);
            console.log('[Treemap Tooltip] actualNode.data.path:', actualNode.data.path);
          }

          if (!actualNode.data) {
            return (
              <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                <div className="font-medium text-gray-900">Unknown Node</div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>Size: {formatBytes(actualNode.value || 0)}</div>
                </div>
              </div>
            );
          }

          const percentage = ((actualNode.value / totalSize) * 100).toFixed(2);
          const compressionInfo = actualNode.data.compressedSize
            ? ` (compressed: ${formatBytes(actualNode.data.compressedSize)})`
            : '';

          return (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
              <div className="font-medium text-gray-900">{actualNode.data.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                <div>Size: {formatBytes(actualNode.value)}{compressionInfo}</div>
                <div>{percentage}% of total</div>
                <div className="capitalize mt-1 text-gray-500">Type: {actualNode.data.type.replace('_', ' ')}</div>
              </div>
              <div className="text-xs text-gray-400 mt-2 break-all">{actualNode.data.path}</div>
            </div>
          );
        }}
        theme={{
          labels: {
            text: {
              fontSize: 12,
              fontWeight: 600,
            },
          },
          tooltip: {
            container: {
              background: '#ffffff',
              padding: 12,
              borderRadius: 8,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          },
        }}
        animate={false}
        leavesOnly={false}
        innerPadding={1}
        outerPadding={1}
        tile="squarify"
      />
    </div>
  );
}
