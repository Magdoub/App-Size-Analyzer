/**
 * Composable for discovering and loading sample files
 * Provides file metadata, loading state, and pre-analyzed JSON loading
 *
 * @module useSampleFiles
 */

import { onMounted, ref } from 'vue';
import { formatBytes } from '../utils/formatters';

/**
 * @typedef {Object} SampleFileMetadata
 * @property {string} url - Vite-resolved URL path (points to binary for metadata)
 * @property {string} jsonUrl - URL to prebuilt JSON analysis
 * @property {string} name - Original file name with extension
 * @property {string} displayName - Human-readable name for display
 * @property {'iOS'|'Android'} platform - Platform label
 * @property {string} extension - File extension without dot
 * @property {number|null} size - File size in bytes (fetched asynchronously)
 * @property {string|null} sizeFormatted - Human-readable size
 */

/**
 * Clean file name for display by removing technical metadata
 * @param {string} fileName - Raw file name with extension
 * @returns {string} Human-readable description
 */
function cleanFileName(fileName) {
  return fileName
    .replace(/\.(ipa|apk|aab|xapk)$/i, '')     // Remove extension
    .replace(/[-_]/g, ' ')                      // Replace separators with spaces
    .replace(/\s+\d+\.\d+.*$/, '')              // Remove version numbers (1.2, 6.8.0-2958)
    .replace(/\([^)]+\)/g, '')                  // Remove parenthetical metadata (arm64, minAPI29)
    .replace(/\s+/g, ' ')                       // Normalize multiple spaces
    .replace(/\.(com|org|io|app)$/i, '')        // Remove domain suffixes
    .trim();                                     // Remove leading/trailing whitespace
}

/**
 * Extract basic metadata from file path and JSON URL
 * @param {string} jsonPath - JSON file path from import.meta.glob
 * @param {string} jsonUrl - Resolved JSON URL
 * @param {string} binaryUrl - Resolved binary URL (for metadata)
 * @returns {SampleFileMetadata} Basic file metadata
 */
function extractBasicMetadata(jsonPath, jsonUrl, binaryUrl) {
  // Extract original file name from JSON path (e.g., "facebook-539-0-0-54-69-apkpure.json" → "facebook")
  const jsonFileName = jsonPath.split('/').pop();

  // Map JSON file names to original binary names (infer from slug)
  // The JSON files were created from the binaries, so we need to map back
  const jsonToOriginal = {
    'a-night-battle-hd-1-2.json': { name: 'A Night Battle HD 1.2.ipa', ext: 'ipa' },
    'facebook-539-0-0-54-69-apkpure.json': { name: 'Facebook_539.0.0.54.69_APKPure.apk', ext: 'apk' },
    'instagram-lite-486-0-0-13-109-apkpure.json': { name: 'Instagram Lite_486.0.0.13.109_APKPure.apk', ext: 'apk' },
    'tools-for-procreate-ipaomtk-com.json': { name: 'Tools-for-Procreate-IPAOMTK.COM.ipa', ext: 'ipa' },
    'com-grasshopper-dialer-6-8-0-2958-minapi29-arm64-v8a-armeabi-armeabi-v7a-x86-x86-64-nodpi-apkmirror-com.json': { name: 'com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk', ext: 'apk' },
    'sample-app-careem-release.json': { name: 'sample-app-careem-release.aab', ext: 'aab' }
  };

  const original = jsonToOriginal[jsonFileName];
  if (!original) {
    console.warn(`Unknown JSON file: ${jsonFileName}`);
    return null;
  }

  const fileName = original.name;
  const extension = original.ext;
  const platform = extension === 'ipa' ? 'iOS' : 'Android';
  const displayName = cleanFileName(fileName);
  const formatLabel = extension.toUpperCase();

  return {
    url: binaryUrl, // Binary URL for metadata (HEAD requests for size)
    jsonUrl,        // JSON URL for analysis data
    name: fileName,
    displayName,
    platform,
    extension,
    formatLabel,
    size: null,
    sizeFormatted: null,
  };
}

/**
 * Fetch file size via HEAD request
 * @param {string} url - File URL
 * @returns {Promise<number|null>} File size in bytes, or null if failed
 */
async function fetchFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = parseInt(response.headers.get('Content-Length'), 10);
    return size || null;
  } catch (error) {
    console.warn(`Failed to fetch size for ${url}:`, error);
    return null; // Graceful degradation
  }
}

/**
 * Load prebuilt JSON analysis from URL
 * @param {string} jsonUrl - JSON file URL
 * @param {string} fileName - Original file name (for error messages)
 * @param {AbortSignal} [signal] - Optional abort signal for cancellation
 * @returns {Promise<object>} ParseResult object
 */
async function loadPrebuiltJSON(jsonUrl, fileName, signal = null) {
  try {
    const response = await fetch(jsonUrl, { signal });

    if (!response.ok) {
      throw new Error(`Failed to fetch JSON for ${fileName}: HTTP ${response.status}`);
    }

    const jsonString = await response.text();
    return JSON.parse(jsonString, jsonReviver);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err; // Re-throw abort errors
    }
    console.error(`Error loading prebuilt JSON for ${fileName}:`, err);
    throw new Error(`Failed to load analysis for ${fileName}`);
  }
}

/**
 * JSON reviver to restore special types (Uint8Array, Map, Set)
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
function jsonReviver(_key, value) {
  // Restore Uint8Array from base64 string
  if (value && typeof value === 'object' && value.__type === 'Uint8Array') {
    const binaryString = atob(value.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Restore Map from entries
  if (value && typeof value === 'object' && value.__type === 'Map') {
    return new Map(value.entries);
  }

  // Restore Set from values
  if (value && typeof value === 'object' && value.__type === 'Set') {
    return new Set(value.values);
  }

  return value;
}

/**
 * Composable for sample file discovery and loading
 * @returns {Object} Sample file composable API
 */
export function useSampleFiles() {
  // Reactive state
  const sampleFiles = ref([]);
  const isLoading = ref(false);
  const loadingFileName = ref(null);
  const error = ref(null);
  const activeAbortController = ref(null);

  // Discover prebuilt JSON analysis files
  const jsonFileUrls = import.meta.glob('/prebuilt-analyses/*.json', {
    query: '?url',
    import: 'default',
    eager: true,
  });

  // Discover original binary files (for metadata display only)
  const binaryFileUrls = import.meta.glob('/sample-files/*.{ipa,apk,aab}', {
    query: '?url',
    import: 'default',
    eager: true,
  });

  // Initialize sample files with metadata
  sampleFiles.value = Object.entries(jsonFileUrls)
    .map(([jsonPath, jsonUrl]) => {
      const jsonFileName = jsonPath.split('/').pop();

      // Find corresponding binary file path
      const jsonToOriginal = {
        'a-night-battle-hd-1-2.json': 'A Night Battle HD 1.2.ipa',
        'facebook-539-0-0-54-69-apkpure.json': 'Facebook_539.0.0.54.69_APKPure.apk',
        'instagram-lite-486-0-0-13-109-apkpure.json': 'Instagram Lite_486.0.0.13.109_APKPure.apk',
        'tools-for-procreate-ipaomtk-com.json': 'Tools-for-Procreate-IPAOMTK.COM.ipa',
        'com-grasshopper-dialer-6-8-0-2958-minapi29-arm64-v8a-armeabi-armeabi-v7a-x86-x86-64-nodpi-apkmirror-com.json': 'com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk',
        'sample-app-careem-release.json': 'sample-app-careem-release.aab'
      };

      const originalFileName = jsonToOriginal[jsonFileName];
      if (!originalFileName) {
        console.warn(`No binary mapping for JSON file: ${jsonFileName}`);
        return null;
      }

      // Find binary URL by matching file name
      const binaryPath = Object.keys(binaryFileUrls).find(path =>
        path.endsWith(originalFileName)
      );
      const binaryUrl = binaryPath ? binaryFileUrls[binaryPath] : null;

      return extractBasicMetadata(jsonPath, jsonUrl, binaryUrl || '');
    })
    .filter(meta => meta !== null); // Remove any unknown files

  // Fetch binary file sizes asynchronously on mount (for display only)
  onMounted(async () => {
    const sizePromises = sampleFiles.value.map(async (file) => {
      const size = await fetchFileSize(file.url);
      file.size = size;
      file.sizeFormatted = size ? formatBytes(size) : 'Unknown size';
    });

    await Promise.all(sizePromises);
  });

  /**
   * Load prebuilt JSON analysis for a sample file
   * @param {string} jsonUrl - JSON file URL
   * @param {string} fileName - Original file name (for display)
   * @returns {Promise<object>} ParseResult object
   */
  const loadSampleFile = async (jsonUrl, fileName) => {
    // Cancel any in-progress load
    if (activeAbortController.value) {
      activeAbortController.value.abort();
    }

    // Create new abort controller for this load
    const controller = new AbortController();
    activeAbortController.value = controller;

    isLoading.value = true;
    loadingFileName.value = fileName;
    error.value = null;

    try {
      const parseResult = await loadPrebuiltJSON(jsonUrl, fileName, controller.signal);

      // Check if aborted before returning (race condition guard)
      if (!controller.signal.aborted) {
        return parseResult;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Sample file load cancelled');
        return null; // Not an error - user intentionally cancelled
      }
      error.value = err;
      throw err; // Re-throw other errors
    } finally {
      // Clean up if this controller is still active
      if (activeAbortController.value === controller) {
        activeAbortController.value = null;
        isLoading.value = false;
        loadingFileName.value = null;
      }
    }
  };

  /**
   * Cancel current sample file load
   */
  const cancelCurrentLoad = () => {
    if (activeAbortController.value) {
      activeAbortController.value.abort();
      activeAbortController.value = null;
      isLoading.value = false;
      loadingFileName.value = null;
    }
  };

  return {
    sampleFiles,
    isLoading,
    loadingFileName,
    error,
    loadSampleFile,
    cancelCurrentLoad,
  };
}
