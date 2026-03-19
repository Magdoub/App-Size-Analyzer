/**
 * Treemap Data Generator
 *
 * Transforms BreakdownNode tree structure into Nivo treemap format
 */

/**
 * @typedef {import('../../types/analysis.js').BreakdownNode} BreakdownNode
 * @typedef {import('../../types/analysis.js').ContentType} ContentType
 */

/**
 * Nivo treemap data format
 * @typedef {Object} TreemapNode
 * @property {string} name - Node name
 * @property {number} value - Node value (size)
 * @property {string} path - Node path
 * @property {ContentType} type - Content type
 * @property {TreemapNode[]} [children] - Child nodes
 * @property {string} [color] - Node color
 * @property {number | undefined} compressedSize - Compressed size
 * @property {Object} [dimensions] - Visual rendering metadata (filled by Nivo during render)
 * @property {number} [dimensions.width] - Computed box width in pixels
 * @property {number} [dimensions.height] - Computed box height in pixels
 * @property {number} [dimensions.x] - X coordinate
 * @property {number} [dimensions.y] - Y coordinate
 * @property {boolean} [shouldShowLabel] - True if box >= 50x20px
 * @property {boolean} [isSearchMatch] - True if matches current search
 * @property {boolean} [isCurrentSearchMatch] - True if current focused search result
 */

/**
 * Treemap generator options
 * @typedef {Object} TreemapGeneratorOptions
 * @property {number} [maxDepth] - Maximum tree depth to render (default: 3)
 * @property {number} [minSize] - Minimum node size in bytes (default: 1KB)
 * @property {ContentType[]} [includeTypes] - Only include these types (default: all)
 * @property {ContentType[]} [excludeTypes] - Exclude these types (default: none)
 * @property {'size' | 'type'} [colorScheme] - Color by size or type (default: 'size')
 */

/**
 * Transforms BreakdownNode tree to Nivo treemap format
 * @param {BreakdownNode} node - Root node
 * @param {TreemapGeneratorOptions} [options] - Generator options
 * @returns {TreemapNode} Treemap data
 */
export function toTreemapData(node, options = {}) {
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
 * @param {BreakdownNode} node - Node to transform
 * @param {number} currentDepth - Current depth
 * @param {number} maxDepth - Maximum depth
 * @param {number} minSize - Minimum size
 * @param {ContentType[]} [includeTypes] - Include types
 * @param {ContentType[]} [excludeTypes] - Exclude types
 * @returns {TreemapNode} Transformed node
 */
function transformNode(node, currentDepth, maxDepth, minSize, includeTypes, excludeTypes) {
  // Filter children based on size and type
  const filteredChildren = node.children.filter((child) => {
    if (child.size < minSize) return false;
    if (includeTypes && !includeTypes.includes(child.type)) return false;
    if (excludeTypes?.includes(child.type)) return false;
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
 * @param {BreakdownNode} root - Root node
 * @param {string} path - Path to find
 * @returns {BreakdownNode | null} Found node or null
 */
export function findNodeByPath(root, path) {
  if (root.path === path) return root;

  for (const child of root.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return null;
}

/**
 * Generate treemap data for a specific subtree (for drill-down)
 * @param {BreakdownNode} root - Root node
 * @param {string | null} zoomPath - Path to zoom to
 * @param {TreemapGeneratorOptions} [options] - Generator options
 * @returns {TreemapNode | null} Subtree data or null
 */
export function generateSubtreeData(root, zoomPath, options = {}) {
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
 * @param {BreakdownNode} node - Node to filter
 * @param {Set<ContentType>} categories - Categories to include
 * @returns {BreakdownNode} Filtered node
 */
export function filterByCategories(node, categories) {
  // If no categories selected, return all
  if (categories.size === 0) return node;

  // First recursively filter all children
  const filteredChildren = node.children
    .map((child) => filterByCategories(child, categories))
    .filter((child) => {
      // Keep child if it matches the category OR has filtered children
      return categories.has(child.type) || child.children.length > 0;
    });

  return {
    ...node,
    children: filteredChildren,
  };
}

/**
 * Search tree for nodes matching query
 * Returns array of paths that match
 * @param {BreakdownNode} node - Root node
 * @param {string} query - Search query
 * @returns {string[]} Matching paths
 */
export function searchTree(node, query) {
  const matches = [];
  const lowerQuery = query.toLowerCase();

  /**
   * @param {BreakdownNode} n
   */
  function traverse(n) {
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
 * @param {BreakdownNode} node - Node to calculate
 * @param {Set<ContentType>} categories - Categories to include
 * @returns {number} Total size
 */
export function calculateFilteredSize(node, categories) {
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
 * @param {BreakdownNode} node - Root node
 * @param {number} [count=10] - Number of nodes to return
 * @returns {BreakdownNode[]} Top nodes by size
 */
export function getTopNodes(node, count = 10) {
  const allNodes = [];

  /**
   * @param {BreakdownNode} n
   */
  function traverse(n) {
    allNodes.push(n);
    n.children.forEach(traverse);
  }

  traverse(node);

  // Sort by size descending and take top N
  return allNodes.sort((a, b) => b.size - a.size).slice(0, count);
}
