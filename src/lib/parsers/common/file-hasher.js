/**
 * File Hasher - SHA-256 hashing for duplicate detection
 *
 * Uses Web Crypto API for fast, browser-native hashing
 */

/**
 * Compute SHA-256 hash of file data
 * @param {Uint8Array} data - File data to hash
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function computeHash(data) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Compute hashes for multiple files
 * Returns a map of path -> hash
 * @param {Array<{path: string, data: Uint8Array}>} files - Files to hash
 * @param {(current: number, total: number) => void} [onProgress] - Progress callback
 * @returns {Promise<Map<string, string>>} Map of file path to hash
 */
export async function computeHashes(files, onProgress) {
  const hashes = new Map();

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
 * @param {Map<string, string>} fileHashes - Map of file path to hash
 * @returns {Map<string, string[]>} Map of hash to array of duplicate file paths
 */
export function findDuplicates(fileHashes) {
  const hashToFiles = new Map();

  for (const [path, hash] of fileHashes.entries()) {
    if (!hashToFiles.has(hash)) {
      hashToFiles.set(hash, []);
    }
    hashToFiles.get(hash).push(path);
  }

  // Filter to only duplicates (more than 1 file with same hash)
  const duplicates = new Map();
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
 * @param {Map<string, string[]>} duplicates - Map of hash to duplicate file paths
 * @param {Map<string, number>} fileSizes - Map of file path to size
 * @returns {number} Total bytes that could be saved
 */
export function calculateDuplicateSavings(duplicates, fileSizes) {
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
