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

// Lazy load AAB and Framework parsers to avoid loading protobuf.js until needed
let parseAAB = null;
let parseFramework = null;

async function loadAABParser() {
  if (!parseAAB) {
    const module = await import('../lib/parsers/android/aab-parser');
    parseAAB = module.parseAAB;
  }
  return parseAAB;
}

async function loadFrameworkParser() {
  if (!parseFramework) {
    const module = await import('../lib/parsers/ios/framework-parser');
    parseFramework = module.parseFramework;
  }
  return parseFramework;
}

/**
 * @typedef {Object} FileEntry
 * @property {string} path - File path
 * @property {number} installSize - Actual bytes on device disk (platform-specific)
 * @property {number} uncompressedSize - Uncompressed size (for reference)
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
 * @property {function(File): Promise<WorkerParseResult>} parseFrameworkBundle - Parse iOS framework bundle
 * @property {function(): void} cancel - Cancel parsing operation
 */

// Cancellation flag
let isCancelled = false;

/**
 * Send progress update to main thread
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} message - Status message
 */
function reportProgress(progress, message) {
  self.postMessage({ type: 'progress', progress, message });
}

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
      reportProgress(5, 'Reading file...');

      // Extract ZIP (runs in worker - doesn't block UI)
      reportProgress(10, 'Extracting archive...');
      const entries = await extractZIP(file);
      reportProgress(40, `Extracted ${entries.length.toLocaleString()} files`);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Parse IPA
      reportProgress(50, 'Parsing app metadata...');
      const parseResult = await parseIPA(file);
      reportProgress(80, 'Building file tree...');

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Convert to FileEntry format
      reportProgress(85, 'Analyzing content types...');
      // iOS: Files are extracted on disk, so installSize = uncompressed
      const fileEntries = entries.map((entry) => ({
        path: entry.name,
        installSize: entry.size, // iOS files are uncompressed on disk
        uncompressedSize: entry.size, // Same as installSize for iOS
        type: detectContentType(entry.name),
        metadata: {},
      }));

      reportProgress(95, 'Finalizing analysis...');
      return { parseResult, fileEntries };
    } catch (error) {
      console.error('[Worker] iOS parsing error:', error);
      throw error;
    }
  },

  /**
   * Parse Android binary (APK/XAPK/AAB file)
   * @param {File} file - APK, XAPK, or AAB file to parse
   * @returns {Promise<WorkerParseResult>} Parse result with file entries
   */
  async parseAndroid(file) {
    isCancelled = false;
    console.log('[Worker] Parsing Android binary:', file.name);

    try {
      reportProgress(5, 'Reading file...');

      const fileName = file.name.toLowerCase();
      const isXAPK = fileName.endsWith('.xapk');
      const isAAB = fileName.endsWith('.aab');

      let parseResult;

      if (isAAB) {
        reportProgress(10, 'Loading AAB parser...');
        const aabParser = await loadAABParser();
        reportProgress(20, 'Parsing Android App Bundle...');
        parseResult = await aabParser(file);
      } else if (isXAPK) {
        reportProgress(15, 'Parsing XAPK package...');
        parseResult = await parseXAPK(file);
      } else {
        reportProgress(15, 'Parsing APK package...');
        parseResult = await parseAPK(file);
      }
      reportProgress(50, 'Parsed app metadata');

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Extract ZIP for file entries (we need the full file list for UI)
      reportProgress(55, 'Extracting archive...');
      const entries = await extractZIP(file);
      reportProgress(80, `Extracted ${entries.length.toLocaleString()} files`);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Convert to FileEntry format
      reportProgress(85, 'Analyzing content types...');
      // Android: Files stay compressed on-disk, so installSize = compressed
      const fileEntries = entries.map((entry) => ({
        path: entry.name,
        installSize: entry.compressedSize, // Android files stay compressed on disk
        uncompressedSize: entry.size,  // Store uncompressed size for reference
        type: detectContentType(entry.name),
        metadata: {},
      }));

      reportProgress(95, 'Finalizing analysis...');
      return { parseResult, fileEntries };
    } catch (error) {
      console.error('[Worker] Android parsing error:', error);
      throw error;
    }
  },

  /**
   * Parse iOS framework bundle (zipped .framework directory)
   * @param {File} file - Zipped framework to parse
   * @returns {Promise<WorkerParseResult>} Parse result with file entries
   */
  async parseFrameworkBundle(file) {
    isCancelled = false;
    console.log('[Worker] Parsing Framework bundle:', file.name);

    try {
      reportProgress(5, 'Reading file...');

      // Lazy load Framework parser
      reportProgress(10, 'Loading framework parser...');
      const frameworkParser = await loadFrameworkParser();
      reportProgress(20, 'Parsing framework bundle...');
      const parseResult = await frameworkParser(file);
      reportProgress(50, 'Parsed framework metadata');

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Extract ZIP for file entries
      reportProgress(55, 'Extracting archive...');
      const entries = await extractZIP(file);
      reportProgress(80, `Extracted ${entries.length.toLocaleString()} files`);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Convert to FileEntry format
      reportProgress(85, 'Analyzing content types...');
      // iOS Framework: Files are extracted on disk, so installSize = uncompressed
      const fileEntries = entries.map((entry) => ({
        path: entry.name,
        installSize: entry.size, // iOS framework files are uncompressed on disk
        uncompressedSize: entry.size, // Same as installSize for iOS
        type: detectContentType(entry.name),
        metadata: {},
      }));

      reportProgress(95, 'Finalizing analysis...');
      return { parseResult, fileEntries };
    } catch (error) {
      console.error('[Worker] Framework parsing error:', error);
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
