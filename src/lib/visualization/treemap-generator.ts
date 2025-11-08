/**
 * Treemap Data Generator
 *
 * Transforms BreakdownNode tree structure into Nivo treemap format
 */

import type { BreakdownNode, ContentType } from '../../types/analysis';

/**
 * Nivo treemap data format
 */
export interface TreemapNode {
  name: string;
  value: number;
  path: string;
  type: ContentType;
  children?: TreemapNode[];
  color?: string;
  compressedSize: number | undefined;

  // Visual rendering metadata (filled by Nivo during render)
  dimensions?: {
    width: number;                 // Computed box width in pixels
    height: number;                // Computed box height in pixels
    x: number;                     // X coordinate
    y: number;                     // Y coordinate
  };

  // Label rendering decision
  shouldShowLabel?: boolean;       // True if box >= 50x20px

  // Search/highlight state
  isSearchMatch?: boolean;         // True if matches current search
  isCurrentSearchMatch?: boolean;  // True if current focused search result
}

export interface TreemapGeneratorOptions {
  maxDepth?: number;           // Maximum tree depth to render (default: 3)
  minSize?: number;            // Minimum node size in bytes (default: 1KB)
  includeTypes?: ContentType[]; // Only include these types (default: all)
  excludeTypes?: ContentType[]; // Exclude these types (default: none)
  colorScheme?: 'size' | 'type'; // Color by size or type (default: 'size')
}

/**
 * Transforms BreakdownNode tree to Nivo treemap format
 */
export function toTreemapData(
  node: BreakdownNode,
  options: TreemapGeneratorOptions = {}
): TreemapNode {
  const {
    maxDepth = 3,
    minSize = 1024, // 1KB
    includeTypes,
    excludeTypes,
  } = options;

  return transformNode(node, 0, maxDepth, minSize, includeTypes, excludeTypes);
}

/**
 * Recursively transform node and its children
 */
function transformNode(
  node: BreakdownNode,
  currentDepth: number,
  maxDepth: number,
  minSize: number,
  includeTypes?: ContentType[],
  excludeTypes?: ContentType[]
): TreemapNode {
  // Filter children based on size and type
  const filteredChildren = node.children.filter((child) => {
    if (child.size < minSize) return false;
    if (includeTypes && !includeTypes.includes(child.type)) return false;
    if (excludeTypes && excludeTypes.includes(child.type)) return false;
    return true;
  });

  // If at max depth or no children, create leaf node
  if (currentDepth >= maxDepth || filteredChildren.length === 0) {
    return {
      name: node.name,
      value: node.size,
      path: node.path,
      type: node.type,
      compressedSize: node.compressedSize,
    };
  }

  // Recursively transform children
  const transformedChildren = filteredChildren.map((child) =>
    transformNode(child, currentDepth + 1, maxDepth, minSize, includeTypes, excludeTypes)
  );

  return {
    name: node.name,
    value: node.size,
    path: node.path,
    type: node.type,
    compressedSize: node.compressedSize,
    children: transformedChildren,
  };
}

/**
 * Find a specific node in the tree by path
 */
export function findNodeByPath(
  root: BreakdownNode,
  path: string
): BreakdownNode | null {
  if (root.path === path) return root;

  for (const child of root.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return null;
}

/**
 * Generate treemap data for a specific subtree (for drill-down)
 */
export function generateSubtreeData(
  root: BreakdownNode,
  zoomPath: string | null,
  options: TreemapGeneratorOptions = {}
): TreemapNode | null {
  if (!zoomPath) {
    // No zoom, return full tree
    return toTreemapData(root, options);
  }

  // Find the zoomed node
  const zoomedNode = findNodeByPath(root, zoomPath);
  if (!zoomedNode) return null;

  // Generate treemap for subtree
  return toTreemapData(zoomedNode, options);
}

/**
 * Filter tree by content type categories
 */
export function filterByCategories(
  node: BreakdownNode,
  categories: Set<ContentType>
): BreakdownNode {
  // If no categories selected, return all
  if (categories.size === 0) return node;

  // Filter children
  const filteredChildren = node.children
    .filter((child) => categories.has(child.type) || child.children.length > 0)
    .map((child) => filterByCategories(child, categories));

  return {
    ...node,
    children: filteredChildren,
  };
}

/**
 * Search tree for nodes matching query
 * Returns array of paths that match
 */
export function searchTree(
  node: BreakdownNode,
  query: string
): string[] {
  const matches: string[] = [];
  const lowerQuery = query.toLowerCase();

  function traverse(n: BreakdownNode) {
    // Check if node matches
    if (
      n.name.toLowerCase().includes(lowerQuery) ||
      n.path.toLowerCase().includes(lowerQuery)
    ) {
      matches.push(n.path);
    }

    // Recurse through children
    n.children.forEach(traverse);
  }

  traverse(node);
  return matches;
}

/**
 * Calculate total size of filtered nodes
 */
export function calculateFilteredSize(
  node: BreakdownNode,
  categories: Set<ContentType>
): number {
  if (categories.size === 0) return node.size;

  if (categories.has(node.type)) {
    return node.size;
  }

  return node.children.reduce(
    (total, child) => total + calculateFilteredSize(child, categories),
    0
  );
}

/**
 * Get top N largest nodes in tree
 */
export function getTopNodes(
  node: BreakdownNode,
  count: number = 10
): BreakdownNode[] {
  const allNodes: BreakdownNode[] = [];

  function traverse(n: BreakdownNode) {
    allNodes.push(n);
    n.children.forEach(traverse);
  }

  traverse(node);

  // Sort by size descending and take top N
  return allNodes.sort((a, b) => b.size - a.size).slice(0, count);
}
