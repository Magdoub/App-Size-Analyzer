/**
 * Breakdown Generator
 *
 * Converts flat file lists from IPA/APK parsers into hierarchical BreakdownNode trees
 */

/**
 * @typedef {import('../../types/analysis.js').BreakdownNode} BreakdownNode
 * @typedef {import('../../types/analysis.js').FileEntry} FileEntry
 * @typedef {import('../../types/analysis.js').ContentType} ContentType
 */

/**
 * Build hierarchical breakdown tree from flat file list
 * @param {FileEntry[]} files - Flat list of files
 * @returns {BreakdownNode} Hierarchical tree
 */
export function buildBreakdownTree(files) {
  // Create root node
  const root = {
    id: 'root',
    name: 'Root',
    path: '',
    size: 0,
    compressedSize: 0,
    type: 'bundle',
    children: [],
    metadata: {},
  };

  // Build tree structure by processing each file
  for (const file of files) {
    addFileToTree(root, file);
  }

  // Calculate aggregate sizes (bottom-up)
  calculateTreeSizes(root);

  return root;
}

/**
 * Add a file to the tree structure
 * @param {BreakdownNode} root - Root node
 * @param {FileEntry} file - File to add
 * @returns {void}
 */
function addFileToTree(root, file) {
  const pathParts = file.path.split('/').filter((part) => part.length > 0);

  if (pathParts.length === 0) return;

  let current = root;

  // Navigate/create tree structure
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    if (!part) continue;

    const isLastPart = i === pathParts.length - 1;
    const currentPath = pathParts.slice(0, i + 1).join('/');

    // Look for existing child node
    let child = current.children.find((c) => c.name === part);

    if (!child) {
      // Create new node
      const nodeType = isLastPart ? file.type : detectFolderType(currentPath, part);

      const baseChild = {
        id: currentPath,
        name: part,
        path: currentPath,
        size: isLastPart ? file.size : 0,
        type: nodeType,
        parent: current.id,
        children: [],
        metadata: {},
      };

      // Only add compressedSize if it exists (exactOptionalPropertyTypes requirement)
      if (isLastPart && file.compressedSize !== undefined) {
        baseChild.compressedSize = file.compressedSize;
      }

      child = baseChild;

      current.children.push(child);
    } else if (isLastPart && child) {
      // Update existing leaf node with file data
      child.size = file.size;
      if (file.compressedSize !== undefined) {
        child.compressedSize = file.compressedSize;
      }
      child.type = file.type;
    }

    if (child) {
      current = child;
    }
  }
}

/**
 * Detect content type for folder nodes
 * @param {string} path - Full path
 * @param {string} name - Folder name
 * @returns {ContentType} Content type
 */
function detectFolderType(path, name) {
  // iOS-specific folders
  if (name.endsWith('.framework')) return 'framework';
  if (name.endsWith('.bundle')) return 'bundle';
  if (name.endsWith('.app')) return 'bundle';
  if (name.endsWith('.lproj')) return 'localization';
  if (path.includes('Frameworks')) return 'framework';

  // Android-specific folders
  if (name === 'lib') return 'native_lib';
  if (name === 'res') return 'resource';
  if (name === 'assets') return 'asset';
  if (path.startsWith('lib/')) return 'native_lib';
  // Android localization: values, values-es, values-zh-rCN, etc.
  if (name === 'values' || name.startsWith('values-')) return 'localization';

  // Generic
  if (name === 'fonts' || name === 'Fonts') return 'font';
  if (name === 'images' || name === 'Images') return 'image';
  if (name === 'videos' || name === 'Videos') return 'video';

  return 'other';
}

/**
 * Calculate aggregate sizes for all nodes (bottom-up traversal)
 * @param {BreakdownNode} node - Node to calculate
 * @returns {void}
 */
function calculateTreeSizes(node) {
  if (node.children.length === 0) {
    // Leaf node - size already set from file
    return;
  }

  // Recursively calculate children first
  for (const child of node.children) {
    calculateTreeSizes(child);
  }

  // Aggregate children sizes
  node.size = node.children.reduce((sum, child) => sum + child.size, 0);
  node.compressedSize = node.children.reduce((sum, child) => sum + (child.compressedSize || 0), 0);
}

/**
 * Validate tree integrity - ensure total size matches expected
 *
 * @param {BreakdownNode} tree - The breakdown tree to validate
 * @param {number} expectedSize - The expected total size
 * @param {number} [tolerance=0.01] - Acceptable variance (default 1%)
 * @returns {boolean} true if validation passes
 */
export function validateTreeSize(tree, expectedSize, tolerance = 0.01) {
  const actualSize = tree.size;
  const variance = Math.abs(actualSize - expectedSize) / expectedSize;

  if (variance > tolerance) {
    console.warn(
      `Tree size validation failed: expected ${expectedSize}, got ${actualSize} (${(variance * 100).toFixed(2)}% variance)`
    );
    return false;
  }

  return true;
}

/**
 * Flattened node representation
 * @typedef {Object} FlattenedNode
 * @property {BreakdownNode} node - The breakdown node
 * @property {number} depth - Depth in tree
 * @property {boolean} hasChildren - Whether node has children
 * @property {string} parentPath - Parent node path
 */

/**
 * Flatten tree into a list for table views
 *
 * @param {BreakdownNode} tree - The tree to flatten
 * @param {number} [maxDepth=Infinity] - Maximum depth to include
 * @returns {FlattenedNode[]} Flat list of nodes with depth information
 */
export function flattenTree(tree, maxDepth = Infinity) {
  const result = [];

  /**
   * @param {BreakdownNode} node
   * @param {number} depth
   * @param {string} parentPath
   */
  function traverse(node, depth, parentPath) {
    if (depth > maxDepth) return;

    result.push({
      node,
      depth,
      hasChildren: node.children.length > 0,
      parentPath,
    });

    // Traverse children
    for (const child of node.children) {
      traverse(child, depth + 1, node.path);
    }
  }

  traverse(tree, 0, '');

  return result;
}

/**
 * Filter tree nodes by predicate
 * @param {BreakdownNode} tree - Tree to filter
 * @param {(node: BreakdownNode) => boolean} predicate - Filter predicate
 * @returns {BreakdownNode | null} Filtered tree
 */
export function filterTree(tree, predicate) {
  // Check if current node matches
  const matches = predicate(tree);

  // Filter children recursively
  const filteredChildren = tree.children
    .map((child) => filterTree(child, predicate))
    .filter((node) => node !== null);

  // Include node if it matches OR has matching children
  if (matches || filteredChildren.length > 0) {
    return {
      ...tree,
      children: filteredChildren,
    };
  }

  return null;
}

/**
 * @typedef {'size' | 'name' | 'type'} SortCriteria
 * @typedef {'asc' | 'desc'} SortOrder
 */

/**
 * Sort tree children by specified criteria
 * @param {BreakdownNode} tree - Tree to sort
 * @param {SortCriteria} criteria - Sort criteria
 * @param {SortOrder} [order='desc'] - Sort order
 * @returns {BreakdownNode} Sorted tree
 */
export function sortTree(tree, criteria, order = 'desc') {
  const sortedChildren = [...tree.children].sort((a, b) => {
    let comparison = 0;

    switch (criteria) {
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  // Recursively sort children
  const sortedWithChildren = sortedChildren.map((child) => sortTree(child, criteria, order));

  return {
    ...tree,
    children: sortedWithChildren,
  };
}

/**
 * Find node by path
 * @param {BreakdownNode} tree - Tree to search
 * @param {string} path - Path to find
 * @returns {BreakdownNode | undefined} Found node
 */
export function findNodeByPath(tree, path) {
  if (tree.path === path) return tree;

  for (const child of tree.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return undefined;
}

/**
 * Get all nodes of a specific type
 * @param {BreakdownNode} tree - Tree to search
 * @param {ContentType} type - Content type to find
 * @returns {BreakdownNode[]} Nodes of specified type
 */
export function getNodesByType(tree, type) {
  const results = [];

  /**
   * @param {BreakdownNode} node
   */
  function traverse(node) {
    if (node.type === type) {
      results.push(node);
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree);

  return results;
}

/**
 * Calculate total size for nodes of a specific type
 * @param {BreakdownNode} tree - Tree to analyze
 * @param {ContentType} type - Content type
 * @returns {number} Total size
 */
export function getTotalSizeByType(tree, type) {
  const nodes = getNodesByType(tree, type);
  return nodes.reduce((sum, node) => sum + node.size, 0);
}
