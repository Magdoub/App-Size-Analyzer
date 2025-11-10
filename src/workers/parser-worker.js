/**
 * Parser Worker - Web Worker for binary parsing
 *
 * Uses Comlink for type-safe communication with main thread
 * Offloads CPU-intensive parsing operations from main thread
 */

import { expose } from 'comlink';
import { parseIPA } from '../lib/parsers/ios/ipa-parser';
import { parseAPK } from '../lib/parsers/android/apk-parser';
import { parseXAPK } from '../lib/parsers/android/xapk-parser';
import { extractZIP } from '../lib/parsers/common/zip-parser';
import { detectContentType } from '../lib/parsers/common/types';

/**
 * @typedef {Object} FileEntry
 * @property {string} path - File path
 * @property {number} size - Uncompressed size
 * @property {number} compressedSize - Compressed size
 * @property {string} type - Content type
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} WorkerParseResult
 * @property {Object} parseResult - Parsed binary result
 * @property {FileEntry[]} fileEntries - File entries list
 */

/**
 * @typedef {Object} ParserWorkerAPI
 * @property {function(File): Promise<WorkerParseResult>} parseIOS - Parse iOS binary
 * @property {function(File): Promise<WorkerParseResult>} parseAndroid - Parse Android binary
 * @property {function(): void} cancel - Cancel parsing operation
 */

// Cancellation flag
let isCancelled = false;

// Actual implementation - runs off main thread
const api = {
  /**
   * Parse iOS binary (IPA file)
   * @param {File} file - IPA file to parse
   * @returns {Promise<WorkerParseResult>} Parse result with file entries
   */
  async parseIOS(file) {
    isCancelled = false;
    console.log('[Worker] Parsing iOS binary:', file.name);

    try {
      // Extract ZIP (runs in worker - doesn't block UI)
      const entries = await extractZIP(file);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Parse IPA
      const parseResult = await parseIPA(file);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Convert to FileEntry format
      const fileEntries = entries.map((entry) => ({
        path: entry.name,
        size: entry.size,
        compressedSize: entry.compressedSize,
        type: detectContentType(entry.name),
        metadata: {},
      }));

      return { parseResult, fileEntries };
    } catch (error) {
      console.error('[Worker] iOS parsing error:', error);
      throw error;
    }
  },

  /**
   * Parse Android binary (APK/XAPK file)
   * @param {File} file - APK or XAPK file to parse
   * @returns {Promise<WorkerParseResult>} Parse result with file entries
   */
  async parseAndroid(file) {
    isCancelled = false;
    console.log('[Worker] Parsing Android binary:', file.name);

    try {
      // Detect XAPK vs APK
      const isXAPK = file.name.toLowerCase().endsWith('.xapk');

      // Parse the file (extraction happens inside parsers)
      const parseResult = isXAPK ? await parseXAPK(file) : await parseAPK(file);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Extract ZIP for file entries (we need the full file list for UI)
      const entries = await extractZIP(file);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Convert to FileEntry format
      const fileEntries = entries.map((entry) => ({
        path: entry.name,
        size: entry.size,
        compressedSize: entry.compressedSize,
        type: detectContentType(entry.name),
        metadata: {},
      }));

      return { parseResult, fileEntries };
    } catch (error) {
      console.error('[Worker] Android parsing error:', error);
      throw error;
    }
  },

  /**
   * Cancel the current parsing operation
   */
  cancel() {
    console.log('[Worker] Cancelling parsing operation');
    isCancelled = true;
  },
};

expose(api);
