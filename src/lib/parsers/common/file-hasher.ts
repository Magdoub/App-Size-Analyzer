/**
 * File Hasher - SHA-256 hashing for duplicate detection
 *
 * Uses Web Crypto API for fast, browser-native hashing
 */

/**
 * Compute SHA-256 hash of file data
 */
export async function computeHash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Compute hashes for multiple files
 * Returns a map of path -> hash
 */
export async function computeHashes(
  files: Array<{ path: string; data: Uint8Array }>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    const hash = await computeHash(file.data);
    hashes.set(file.path, hash);

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return hashes;
}

/**
 * Find duplicate files by hash
 * Returns a map of hash -> array of file paths
 */
export function findDuplicates(fileHashes: Map<string, string>): Map<string, string[]> {
  const hashToFiles = new Map<string, string[]>();

  for (const [path, hash] of fileHashes.entries()) {
    if (!hashToFiles.has(hash)) {
      hashToFiles.set(hash, []);
    }
    hashToFiles.get(hash)!.push(path);
  }

  // Filter to only duplicates (more than 1 file with same hash)
  const duplicates = new Map<string, string[]>();
  for (const [hash, paths] of hashToFiles.entries()) {
    if (paths.length > 1) {
      duplicates.set(hash, paths);
    }
  }

  return duplicates;
}

/**
 * Calculate total size savings from removing duplicates
 * Keeps first occurrence, calculates savings from removing others
 */
export function calculateDuplicateSavings(
  duplicates: Map<string, string[]>,
  fileSizes: Map<string, number>
): number {
  let totalSavings = 0;

  for (const paths of duplicates.values()) {
    // Skip first file (we keep one copy), sum the rest
    for (let i = 1; i < paths.length; i++) {
      const path = paths[i];
      if (!path) continue;
      const size = fileSizes.get(path) || 0;
      totalSavings += size;
    }
  }

  return totalSavings;
}
