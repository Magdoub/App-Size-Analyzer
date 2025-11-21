/**
 * Composable for discovering and loading sample files
 * Provides file metadata, loading state, and file loading functionality
 *
 * @module useSampleFiles
 */

import { ref, onMounted } from 'vue';
import { formatBytes } from '../utils/formatters';

/**
 * @typedef {Object} SampleFileMetadata
 * @property {string} url - Vite-resolved URL path
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
 * Extract basic metadata from file path and URL
 * @param {string} filePath - File path from import.meta.glob
 * @param {string} url - Resolved URL
 * @returns {SampleFileMetadata} Basic file metadata
 */
function extractBasicMetadata(filePath, url) {
  const fileName = filePath.split('/').pop();
  const extension = fileName.split('.').pop().toLowerCase();
  const platform = extension === 'ipa' ? 'iOS' : 'Android';
  const displayName = cleanFileName(fileName);

  // Format label for display (IPA, APK, AAB)
  const formatLabel = extension.toUpperCase();

  return {
    url,
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
 * Load sample file from URL and convert to File object
 * @param {string} url - File URL from import.meta.glob
 * @param {string} fileName - Original file name
 * @param {AbortSignal} [signal] - Optional abort signal for cancellation
 * @returns {Promise<File>} File object compatible with existing upload handlers
 */
async function loadSampleFileAsFile(url, fileName, signal = null) {
  // 1. Fetch file as blob (handles large files efficiently)
  // Retry once on failure (handles cold-start issues)
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (err) {
    if (err.name !== 'AbortError') {
      // Retry once
      response = await fetch(url, { signal });
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileName}: HTTP ${response.status}`);
  }

  // 2. Convert response to blob
  const blob = await response.blob();

  // 3. Create File object (same API as drag-and-drop upload)
  const file = new File([blob], fileName, {
    type: blob.type || 'application/octet-stream',
    lastModified: Date.now(),
  });

  return file;
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

  // T003: Discover sample files using Vite's import.meta.glob (build-time)
  const sampleFileUrls = import.meta.glob('/sample-files/*.{ipa,apk,aab}', {
    query: '?url',
    import: 'default',
    eager: true,
  });

  // Initialize sample files with basic metadata
  sampleFiles.value = Object.entries(sampleFileUrls).map(([filePath, url]) =>
    extractBasicMetadata(filePath, url)
  );

  // T006: Fetch file sizes asynchronously on mount (progressive enhancement)
  onMounted(async () => {
    const sizePromises = sampleFiles.value.map(async (file) => {
      const size = await fetchFileSize(file.url);
      file.size = size;
      file.sizeFormatted = size ? formatBytes(size) : 'Unknown size';
    });

    await Promise.all(sizePromises);
  });

  /**
   * T007: Load a sample file and emit file-selected event
   * @param {string} url - File URL
   * @param {string} fileName - File name
   * @returns {Promise<File>} Loaded File object
   */
  const loadSampleFile = async (url, fileName) => {
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
      const file = await loadSampleFileAsFile(url, fileName, controller.signal);

      // Check if aborted before returning (race condition guard)
      if (!controller.signal.aborted) {
        return file;
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
