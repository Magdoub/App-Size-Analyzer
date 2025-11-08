/**
 * DEX File Parser - Android
 *
 * Parses Dalvik Executable (DEX) files to extract method counts and class information
 */

export interface DEXHeader {
  magic: string;
  version: number;
  checksum: number;
  fileSize: number;
  headerSize: number;
  stringIdsSize: number;
  typeIdsSize: number;
  protoIdsSize: number;
  fieldIdsSize: number;
  methodIdsSize: number;
  classDefsSize: number;
}

export interface DEXMetadata {
  header: DEXHeader;
  methodCount: number;
  classCount: number;
  stringCount: number;
  fieldCount: number;
  fileSize: number;
  classes: string[]; // Top-level class names
}

/**
 * Parse DEX file header and extract metadata
 */
export function parseDEXFile(data: Uint8Array): DEXMetadata {
  // DEX file format:
  // - Magic: "dex\n" + version + "\0"
  // - Checksum, signature
  // - File size, header size
  // - Various ID counts

  if (data.length < 112) {
    throw new Error('File too small to be a valid DEX file');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Read magic bytes
  const magic = new TextDecoder().decode(data.slice(0, 3));
  if (magic !== 'dex') {
    throw new Error('Invalid DEX magic bytes');
  }

  // Read version (bytes 4-6)
  const versionBytes = data.slice(4, 7);
  const version = parseInt(new TextDecoder().decode(versionBytes), 10);

  // Read checksum
  const checksum = view.getUint32(8, true); // Little endian

  // Skip signature (20 bytes at offset 12)

  // Read file size
  const fileSize = view.getUint32(32, true);

  // Read header size
  const headerSize = view.getUint32(36, true);

  // Skip endian tag (4 bytes at offset 40)

  // Skip link size/offset (8 bytes at offset 44)

  // Skip map offset (4 bytes at offset 52)

  // Read string IDs count
  const stringIdsSize = view.getUint32(56, true);

  // Skip string IDs offset (4 bytes at offset 60)

  // Read type IDs count
  const typeIdsSize = view.getUint32(64, true);

  // Skip type IDs offset (4 bytes at offset 68)

  // Read proto IDs count
  const protoIdsSize = view.getUint32(72, true);

  // Skip proto IDs offset (4 bytes at offset 76)

  // Read field IDs count
  const fieldIdsSize = view.getUint32(80, true);

  // Skip field IDs offset (4 bytes at offset 84)

  // Read method IDs count (CRITICAL for method count tracking)
  const methodIdsSize = view.getUint32(88, true);

  // Skip method IDs offset (4 bytes at offset 92)

  // Read class defs count
  const classDefsSize = view.getUint32(96, true);

  const header: DEXHeader = {
    magic,
    version,
    checksum,
    fileSize,
    headerSize,
    stringIdsSize,
    typeIdsSize,
    protoIdsSize,
    fieldIdsSize,
    methodIdsSize,
    classDefsSize,
  };

  // TODO: Parse class definitions to extract class names
  // This requires reading class_defs section starting at offset from header

  return {
    header,
    methodCount: methodIdsSize,
    classCount: classDefsSize,
    stringCount: stringIdsSize,
    fieldCount: fieldIdsSize,
    fileSize: data.length,
    classes: [], // TODO: Extract class names
  };
}

/**
 * Calculate total method count across multiple DEX files
 */
export function calculateTotalMethodCount(dexFiles: DEXMetadata[]): number {
  return dexFiles.reduce((total, dex) => total + dex.methodCount, 0);
}

/**
 * Check if method count exceeds the 64K limit (requires multidex)
 */
export function exceedsMethodLimit(methodCount: number): boolean {
  return methodCount > 65536;
}

/**
 * Estimate method count per package/library by analyzing class names
 */
export function estimateMethodCountByPackage(
  _dexFiles: DEXMetadata[]
): Map<string, number> {
  const methodsByPackage = new Map<string, number>();

  // TODO: Implement package-level method counting
  // This requires parsing class names and grouping by package prefix

  return methodsByPackage;
}
