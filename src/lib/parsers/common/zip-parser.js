/**
 * ZIP Parser - Streaming ZIP extraction using fflate
 *
 * Uses fflate for high-performance ZIP extraction with streaming support
 * for large files (multi-GB binaries).
 */

import { unzip, Unzip } from 'fflate';

/**
 * @typedef {Object} ZIPEntry
 * @property {string} name - File name
 * @property {number} size - Uncompressed size
 * @property {number} compressedSize - Compressed size
 * @property {Uint8Array} data - File data
 * @property {boolean} isDirectory - Whether this is a directory
 */

/**
 * @typedef {Object} ZIPParseOptions
 * @property {(name: string) => boolean} [filter] - Filter which files to extract
 * @property {(processed: number, total: number) => void} [onProgress] - Progress callback
 * @property {number} [maxFileSize] - Skip files larger than this
 */

/**
 * Maximum file size for in-memory processing (300MB)
 * Larger files need streaming or will cause OOM errors
 */
const MAX_MEMORY_FILE_SIZE = 300 * 1024 * 1024;

/**
 * Parse ZIP central directory to extract compressed sizes
 * @param {Uint8Array} data - ZIP file data
 * @returns {Map<string, number>} Map of filename to compressed size
 */
function parseZIPCompressedSizes(data) {
  const compressedSizes = new Map();

  // Find End of Central Directory Record (EOCD)
  // Signature: 0x06054b50
  // EOCD is at the end of the file, work backwards to find it
  let eocdOffset = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (
      data[i] === 0x50 &&
      data[i + 1] === 0x4b &&
      data[i + 2] === 0x05 &&
      data[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    console.warn('[parseZIPCompressedSizes] Could not find EOCD, using uncompressed sizes');
    return compressedSizes;
  }

  // Read central directory offset from EOCD (offset 16, 4 bytes, little-endian)
  const centralDirOffset =
    data[eocdOffset + 16] |
    (data[eocdOffset + 17] << 8) |
    (data[eocdOffset + 18] << 16) |
    (data[eocdOffset + 19] << 24);

  // Read number of entries from EOCD (offset 10, 2 bytes, little-endian)
  const totalEntries = data[eocdOffset + 10] | (data[eocdOffset + 11] << 8);

  // Parse central directory headers
  let offset = centralDirOffset;
  for (let i = 0; i < totalEntries && offset < data.length - 46; i++) {
    // Check for Central Directory Header signature (0x02014b50)
    if (
      data[offset] !== 0x50 ||
      data[offset + 1] !== 0x4b ||
      data[offset + 2] !== 0x01 ||
      data[offset + 3] !== 0x02
    ) {
      console.warn('[parseZIPCompressedSizes] Invalid central directory header signature');
      break;
    }

    // Read compressed size (offset 20, 4 bytes, little-endian)
    const compressedSize =
      data[offset + 20] |
      (data[offset + 21] << 8) |
      (data[offset + 22] << 16) |
      (data[offset + 23] << 24);

    // Read filename length (offset 28, 2 bytes, little-endian)
    const filenameLength = data[offset + 28] | (data[offset + 29] << 8);

    // Read extra field length (offset 30, 2 bytes, little-endian)
    const extraFieldLength = data[offset + 30] | (data[offset + 31] << 8);

    // Read file comment length (offset 32, 2 bytes, little-endian)
    const fileCommentLength = data[offset + 32] | (data[offset + 33] << 8);

    // Read filename (starts at offset 46)
    const filenameBytes = data.slice(offset + 46, offset + 46 + filenameLength);
    const filename = new TextDecoder('utf-8').decode(filenameBytes);

    // Store compressed size
    compressedSizes.set(filename, compressedSize);

    // Move to next central directory header
    offset += 46 + filenameLength + extraFieldLength + fileCommentLength;
  }

  return compressedSizes;
}

/**
 * Extract all files from a ZIP archive
 * Uses synchronous unzip for simplicity - can handle files up to ~300MB
 * For larger files, use extractZIPStreaming or extractZIPMetadataOnly
 * @param {File} file - ZIP file to extract
 * @param {ZIPParseOptions} [options] - Parsing options
 * @returns {Promise<ZIPEntry[]>} Array of extracted ZIP entries
 */
export async function extractZIP(file, options = {}) {
  const { filter, onProgress, maxFileSize } = options;

  // Check file size to prevent OOM
  if (file.size > MAX_MEMORY_FILE_SIZE) {
    throw new Error(
      `File too large for browser processing (${(file.size / 1024 / 1024).toFixed(0)}MB). ` +
      `Maximum supported size is ${MAX_MEMORY_FILE_SIZE / 1024 / 1024}MB. ` +
      `For larger apps, consider using command-line tools like 'unzip -l' or Android Studio's APK Analyzer.`
    );
  }

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Parse ZIP central directory to get compressed sizes
  const compressedSizes = parseZIPCompressedSizes(data);

  return new Promise((resolve, reject) => {
    const entries = [];

    unzip(data, (err, unzipped) => {
      if (err) {
        reject(new Error(`ZIP extraction failed: ${err.message}`));
        return;
      }

      const filenames = Object.keys(unzipped);
      let processed = 0;

      for (const name of filenames) {
        // Skip filtered files
        if (filter && !filter(name)) {
          continue;
        }

        const fileData = unzipped[name];
        if (!fileData) {
          continue;
        }

        const isDirectory = name.endsWith('/');

        // Skip directories
        if (isDirectory) {
          continue;
        }

        // Skip files that are too large
        if (maxFileSize && fileData.length > maxFileSize) {
          console.warn(`Skipping large file: ${name} (${fileData.length} bytes)`);
          continue;
        }

        // Get compressed size from central directory, fallback to uncompressed size
        const compressedSize = compressedSizes.get(name) ?? fileData.length;

        entries.push({
          name,
          size: fileData.length,
          compressedSize,
          data: fileData,
          isDirectory: false,
        });

        processed++;
        if (onProgress) {
          onProgress(processed, filenames.length);
        }
      }

      resolve(entries);
    });
  });
}

/**
 * Extract ZIP using streaming API for very large files
 * This is more memory-efficient but more complex
 * @param {File} file - ZIP file to extract
 * @param {(entry: ZIPEntry) => void} onFile - Callback for each extracted file
 * @param {ZIPParseOptions} [options] - Parsing options
 * @returns {Promise<void>}
 */
export async function extractZIPStreaming(file, onFile, options = {}) {
  const { filter, onProgress } = options;

  return new Promise((resolve, reject) => {
    let processedFiles = 0;
    let totalFiles = 0;
    const unzipper = new Unzip((file) => {
      totalFiles++;

      const name = file.name;
      const isDirectory = name.endsWith('/');

      // Skip filtered files
      if (filter && !filter(name)) {
        return;
      }

      // Skip directories
      if (isDirectory) {
        return;
      }

      const chunks = [];
      let totalSize = 0;

      file.ondata = (err, data, final) => {
        if (err) {
          reject(new Error(`Error extracting ${name}: ${err.message}`));
          return;
        }

        chunks.push(data);
        totalSize += data.length;

        if (final) {
          // Concatenate all chunks
          const combined = new Uint8Array(totalSize);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }

          onFile({
            name,
            size: totalSize,
            compressedSize: totalSize,
            data: combined,
            isDirectory: false,
          });

          processedFiles++;
          if (onProgress) {
            onProgress(processedFiles, totalFiles);
          }
        }
      };

      file.start();
    });

    // Feed file data to unzipper
    const reader = file.stream().getReader();

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            unzipper.push(new Uint8Array(), true); // Signal end
            resolve();
            break;
          }

          unzipper.push(value, false);
        }
      } catch (error) {
        reject(error);
      }
    };

    processStream().catch(reject);
  });
}

/**
 * Validate that a file is a valid ZIP archive
 * @param {Uint8Array} data - File data
 * @returns {boolean} True if data is a valid ZIP archive
 */
export function isValidZIP(data) {
  // Check for ZIP magic bytes (PK\x03\x04 or PK\x05\x06 for empty archives)
  if (data.length < 4) {
    return false;
  }

  return (
    (data[0] === 0x50 && data[1] === 0x4b && data[2] === 0x03 && data[3] === 0x04) ||
    (data[0] === 0x50 && data[1] === 0x4b && data[2] === 0x05 && data[3] === 0x06)
  );
}

/**
 * Convert ZIP entries to FileEntry format
 * @param {ZIPEntry[]} entries - ZIP entries
 * @returns {import('../../../types/analysis.js').FileEntry[]} File entries
 */
export function zipEntriesToFileEntries(entries) {
  return entries.map((entry) => ({
    path: entry.name,
    size: entry.size,
    compressedSize: entry.compressedSize,
    type: 'unknown',
  }));
}
