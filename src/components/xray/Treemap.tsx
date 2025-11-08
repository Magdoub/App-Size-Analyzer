/**
 * Treemap Component
 *
 * Interactive treemap visualization using Nivo's ResponsiveTreeMap (SVG)
 */

import { ResponsiveTreeMap } from '@nivo/treemap';
import type { TreemapNode } from '../../lib/visualization/treemap-generator';
import { getNodeColor, getLabelColor, getHoverHighlightColor } from '../../lib/visualization/color-scheme';
import { formatBytes } from '../../utils/formatters';
import { calculateNodeLabel } from '../../lib/visualization/node-label-calculator';
import { useAnalysisStore } from '../../store/analysis-store';

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
  // Get hover state from store
  const { hoveredNodePath, setHoveredNode } = useAnalysisStore();

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
    <div
      className="w-full border border-gray-300 rounded-lg"
      style={{ height: '650px', backgroundColor: '#f9fafb', cursor: 'pointer' }}
    >
      <ResponsiveTreeMap
        data={data}
        identity="name"
        value="value"
        valueFormat={(value) => formatBytes(value as number)}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        enableLabel={true}
        labelSkipSize={1}
        // Enhanced label function using calculateNodeLabel for size threshold
        label={(node: any) => {
          const actualNode = node.node || node;
          if (!actualNode.data) return '';

          // Calculate if label should be shown based on box dimensions
          const metadata = calculateNodeLabel({
            ...actualNode.data,
            width: actualNode.width,
            height: actualNode.height,
          });

          // Return node name (not size) if box is large enough
          return metadata.shouldShowLabel ? metadata.labelText : '';
        }}
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
          // Enhanced getLabelColor with WCAG AA compliance
          return getLabelColor(color, 4.5);
        }}
        colors={(node: any) => {
          // Canvas treemap wraps node in { node: {...} } structure
          const actualNode = node.node || node;
          if (!actualNode.data) {
            return '#94a3b8'; // Default gray if no data
          }

          // Highlight search matches (highest priority)
          if (searchMatches.includes(actualNode.data.path)) {
            return '#fbbf24'; // Yellow highlight
          }

          const baseColor = getNodeColor(
            actualNode.value,
            actualNode.data.type,
            totalSize,
            actualNode.data.compressedSize,
            colorScheme
          );

          // Add subtle highlight when hovered
          if (hoveredNodePath === actualNode.data.path) {
            return getHoverHighlightColor(baseColor);
          }

          return baseColor;
        }}
        borderWidth={1}
        borderColor="#ffffff"
        orientLabel={false}
        onClick={(node: any) => {
          // Canvas treemap wraps node in { node: {...} } structure
          const actualNode = node.node || node;

          // DEBUG: Log click events
          console.log('[Treemap Click] Raw node:', node);
          console.log('[Treemap Click] Actual node:', actualNode);
          console.log('[Treemap Click] Node name:', actualNode.data?.name);
          console.log('[Treemap Click] Node path:', actualNode.data?.path);
          console.log('[Treemap Click] Has children:', actualNode.data?.children?.length);
          console.log('[Treemap Click] Node depth:', actualNode.depth);

          if (!actualNode.data) {
            console.warn('[Treemap Click] No data on node, ignoring click');
            return;
          }

          // Skip clicks on root wrapper node (typically at depth 0 with empty/root path)
          // This prevents clicking on the background wrapper that contains all content
          const isRootWrapper =
            actualNode.depth === 0 &&
            (!actualNode.data.path || actualNode.data.path === '' || actualNode.data.path === '/');

          if (isRootWrapper) {
            console.log('[Treemap Click] Ignoring click on root wrapper');
            return;
          }

          const hasChildren = actualNode.data.children && actualNode.data.children.length > 0;

          if (hasChildren) {
            // Zoomable node - trigger zoom via onNodeClick
            console.log('[Treemap Click] Zooming into:', actualNode.data.name);
            if (onNodeClick) {
              onNodeClick(actualNode.data.path);
            }
          } else {
            // Leaf node - highlight without zooming (could trigger details panel in future)
            console.log('[Treemap Click] Clicked leaf node:', actualNode.data.name);
            // Future: Could open details panel here
          }
        }}
        nodeOpacity={1}
        tooltip={(node: any) => {
          // Canvas treemap wraps node in { node: {...} } structure
          const actualNode = node.node || node;

          // DEBUG: Log what we're receiving from Nivo
          console.log('[Treemap Tooltip] Raw node:', node);
          console.log('[Treemap Tooltip] Actual node:', actualNode);
          console.log('[Treemap Tooltip] Node data:', actualNode.data);
          console.log('[Treemap Tooltip] Node ID:', actualNode.id);
          console.log('[Treemap Tooltip] Has children:', actualNode.data?.children?.length);
          console.log('[Treemap Tooltip] Node depth:', actualNode.depth);

          // Track hover state for highlighting
          if (actualNode.data) {
            setHoveredNode(actualNode.data.path);
          }

          if (!actualNode.data) {
            return (
              <div
                className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200"
                style={{ maxWidth: '400px' }}
              >
                <div className="font-medium text-gray-900">Unknown Node</div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>Size: {formatBytes(actualNode.value || 0)}</div>
                </div>
              </div>
            );
          }

          // Skip tooltip for root wrapper node (same logic as click handler)
          const isRootWrapper =
            actualNode.depth === 0 &&
            (!actualNode.data.path || actualNode.data.path === '' || actualNode.data.path === '/');

          if (isRootWrapper) {
            console.log('[Treemap Tooltip] Skipping root wrapper node');
            return null;
          }

          const hasChildren = actualNode.data.children && actualNode.data.children.length > 0;
          const percentage = ((actualNode.value / totalSize) * 100).toFixed(2);

          return (
            <div
              className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200"
              style={{ maxWidth: '400px' }}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Title: Show specific item name */}
              <div className="font-semibold text-gray-900 mb-2 break-words">
                {actualNode.data.name}
              </div>

              {/* Size information */}
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  <span className="font-medium">Size:</span> {formatBytes(actualNode.value)}
                </div>

                {/* Compressed size if available */}
                {actualNode.data.compressedSize && (
                  <div>
                    <span className="font-medium">Compressed:</span> {formatBytes(actualNode.data.compressedSize)}
                    <span className="text-gray-500 ml-1">
                      ({((actualNode.data.compressedSize / actualNode.value) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}

                {/* Percentage of total */}
                <div>
                  <span className="font-medium">Percentage:</span> {percentage}% of total
                </div>

                {/* Content type */}
                <div className="capitalize">
                  <span className="font-medium">Type:</span> {actualNode.data.type.replace('_', ' ')}
                </div>
              </div>

              {/* Full path */}
              <div
                className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200"
                style={{ wordBreak: 'break-all' }}
              >
                {actualNode.data.path}
              </div>

              {/* Hint for zoomable nodes */}
              {hasChildren && (
                <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-gray-200">
                  Click to zoom into this folder
                </div>
              )}
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
              maxWidth: 400,
              wordBreak: 'break-word' as const,
            },
          },
        }}
        animate={true}
        motionConfig="gentle"
        leavesOnly={false}
        innerPadding={1}
        outerPadding={1}
        tile="squarify"
      />
    </div>
  );
}
