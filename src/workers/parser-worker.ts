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
import type { IPAParseResult } from '../lib/parsers/ios/types';
import type { APKParseResult } from '../lib/parsers/android/types';
import type { FileEntry } from '../types/analysis';

// Worker result includes both parse result and file entries
export interface WorkerParseResult<T> {
  parseResult: T;
  fileEntries: FileEntry[];
}

export interface ParserWorkerAPI {
  parseIOS: (file: File) => Promise<WorkerParseResult<IPAParseResult>>;
  parseAndroid: (file: File) => Promise<WorkerParseResult<APKParseResult>>;
  cancel: () => void;
}

// Cancellation flag
let isCancelled = false;

// Actual implementation - runs off main thread
const api: ParserWorkerAPI = {
  async parseIOS(file: File): Promise<WorkerParseResult<IPAParseResult>> {
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
      const fileEntries: FileEntry[] = entries.map((entry) => ({
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

  async parseAndroid(file: File): Promise<WorkerParseResult<APKParseResult>> {
    isCancelled = false;
    console.log('[Worker] Parsing Android binary:', file.name);

    try {
      // Detect XAPK vs APK
      const isXAPK = file.name.toLowerCase().endsWith('.xapk');

      // Parse the file (extraction happens inside parsers)
      const parseResult = isXAPK
        ? await parseXAPK(file)
        : await parseAPK(file);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Extract ZIP for file entries (we need the full file list for UI)
      const entries = await extractZIP(file);

      if (isCancelled) {
        throw new Error('Parsing cancelled by user');
      }

      // Convert to FileEntry format
      const fileEntries: FileEntry[] = entries.map((entry) => ({
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

  cancel() {
    console.log('[Worker] Cancelling parsing operation');
    isCancelled = true;
  },
};

expose(api);
