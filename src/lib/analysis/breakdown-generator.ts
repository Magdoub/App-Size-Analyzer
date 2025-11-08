/**
 * Breakdown Generator
 *
 * Converts flat file lists from IPA/APK parsers into hierarchical BreakdownNode trees
 */

import type { BreakdownNode, FileEntry, ContentType } from '../../types/analysis';

/**
 * Build hierarchical breakdown tree from flat file list
 */
export function buildBreakdownTree(files: FileEntry[]): BreakdownNode {
  // Create root node
  const root: BreakdownNode = {
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
 */
function addFileToTree(root: BreakdownNode, file: FileEntry): void {
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

      const baseChild: BreakdownNode = {
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
 */
function detectFolderType(path: string, name: string): ContentType {
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

  // Generic
  if (name === 'fonts' || name === 'Fonts') return 'font';
  if (name === 'images' || name === 'Images') return 'image';
  if (name === 'videos' || name === 'Videos') return 'video';

  return 'other';
}

/**
 * Calculate aggregate sizes for all nodes (bottom-up traversal)
 */
function calculateTreeSizes(node: BreakdownNode): void {
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
 * @param tree The breakdown tree to validate
 * @param expectedSize The expected total size
 * @param tolerance Acceptable variance (default 1%)
 * @returns true if validation passes
 */
export function validateTreeSize(
  tree: BreakdownNode,
  expectedSize: number,
  tolerance: number = 0.01
): boolean {
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
 * Flatten tree into a list for table views
 *
 * @param tree The tree to flatten
 * @param maxDepth Maximum depth to include (default: no limit)
 * @returns Flat list of nodes with depth information
 */
export interface FlattenedNode {
  node: BreakdownNode;
  depth: number;
  hasChildren: boolean;
  parentPath: string;
}

export function flattenTree(tree: BreakdownNode, maxDepth: number = Infinity): FlattenedNode[] {
  const result: FlattenedNode[] = [];

  function traverse(node: BreakdownNode, depth: number, parentPath: string): void {
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
 */
export function filterTree(
  tree: BreakdownNode,
  predicate: (node: BreakdownNode) => boolean
): BreakdownNode | null {
  // Check if current node matches
  const matches = predicate(tree);

  // Filter children recursively
  const filteredChildren = tree.children
    .map((child) => filterTree(child, predicate))
    .filter((node): node is BreakdownNode => node !== null);

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
 * Sort tree children by specified criteria
 */
export type SortCriteria = 'size' | 'name' | 'type';
export type SortOrder = 'asc' | 'desc';

export function sortTree(
  tree: BreakdownNode,
  criteria: SortCriteria,
  order: SortOrder = 'desc'
): BreakdownNode {
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
 */
export function findNodeByPath(tree: BreakdownNode, path: string): BreakdownNode | undefined {
  if (tree.path === path) return tree;

  for (const child of tree.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return undefined;
}

/**
 * Get all nodes of a specific type
 */
export function getNodesByType(tree: BreakdownNode, type: ContentType): BreakdownNode[] {
  const results: BreakdownNode[] = [];

  function traverse(node: BreakdownNode): void {
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
 */
export function getTotalSizeByType(tree: BreakdownNode, type: ContentType): number {
  const nodes = getNodesByType(tree, type);
  return nodes.reduce((sum, node) => sum + node.size, 0);
}
