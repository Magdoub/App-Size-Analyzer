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
 * Extract all files from a ZIP archive
 * Uses synchronous unzip for simplicity - can handle files up to 2GB
 * @param {File} file - ZIP file to extract
 * @param {ZIPParseOptions} [options] - Parsing options
 * @returns {Promise<ZIPEntry[]>} Array of extracted ZIP entries
 */
export async function extractZIP(file, options = {}) {
  const { filter, onProgress, maxFileSize } = options;

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

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

        entries.push({
          name,
          size: fileData.length,
          compressedSize: fileData.length, // fflate doesn't expose original compressed size
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
