/**
 * Resources.arsc Parser - Android
 *
 * Parses Android resource table (resources.arsc) to extract resource metadata
 */

export interface ResourceEntry {
  id: number;
  type: string; // drawable, string, layout, etc.
  name: string;
  value?: string;
  config?: string; // Configuration qualifier (e.g., hdpi, xhdpi, en, es)
}

export interface ResourceTableMetadata {
  packageName: string;
  entries: ResourceEntry[];
  totalEntries: number;
  resourcesByType: Map<string, number>;
  resourcesByConfig: Map<string, number>;
}

/**
 * Parse resources.arsc file
 *
 * Note: resources.arsc uses a complex binary format.
 * This is a simplified parser that extracts basic structure.
 */
export function parseResourceTable(data: Uint8Array): ResourceTableMetadata {
  // resources.arsc format:
  // - Header with magic bytes
  // - String pool (resource names)
  // - Package chunks (one per package)
  // - Type chunks (drawable, string, etc.)
  // - Configuration entries (hdpi, xhdpi, etc.)

  const entries: ResourceEntry[] = [];
  const resourcesByType = new Map<string, number>();
  const resourcesByConfig = new Map<string, number>();

  // Basic validation
  if (data.length < 12) {
    throw new Error('File too small to be valid resources.arsc');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Check chunk type
  // Valid types:
  // - RES_TABLE_TYPE = 0x0001 (main resource table)
  // - RES_STRING_POOL_TYPE = 0x0001 or 0x0002 (string pool, can be first chunk)
  const type = view.getUint16(0, true); // Little endian
  // Skip headerSize and chunkSize for now (reserved for future full parsing)
  // const headerSize = view.getUint16(2, true);
  // const chunkSize = view.getUint32(4, true);

  // Accept multiple valid chunk types (0x0001 = RES_TABLE_TYPE, 0x0002 = RES_STRING_POOL_TYPE)
  if (type !== 0x0001 && type !== 0x0002) {
    console.warn(`Unknown resources.arsc chunk type: 0x${type.toString(16)} - skipping full parsing`);
    // Return minimal structure instead of throwing error
    return {
      packageName: 'unknown',
      entries: [],
      totalEntries: 0,
      resourcesByType: new Map(),
      resourcesByConfig: new Map(),
    };
  }

  // TODO: Implement full resource table parsing
  // This requires parsing:
  // - String pool chunks
  // - Package chunks
  // - Type spec chunks
  // - Type chunks with configurations

  // For now, return basic structure
  return {
    packageName: 'unknown',
    entries,
    totalEntries: 0,
    resourcesByType,
    resourcesByConfig,
  };
}

/**
 * Identify unused resources by comparing resource table with DEX references
 */
export function findUnusedResources(
  resourceTable: ResourceTableMetadata,
  referencedResources: Set<number>
): ResourceEntry[] {
  const unused: ResourceEntry[] = [];

  for (const entry of resourceTable.entries) {
    if (!referencedResources.has(entry.id)) {
      unused.push(entry);
    }
  }

  return unused;
}

/**
 * Estimate size of unused resources
 */
export function estimateUnusedResourcesSize(
  unusedResources: ResourceEntry[],
  resourceFiles: Map<string, number> // Map of resource paths to sizes
): number {
  let totalSize = 0;

  for (const resource of unusedResources) {
    // Try to find matching files
    for (const [path, size] of resourceFiles) {
      if (path.includes(resource.name)) {
        totalSize += size;
      }
    }
  }

  return totalSize;
}
