/**
 * Contract: useSampleFiles Composable
 *
 * Purpose: Discover sample files from /sample-files/ directory and provide
 * loading functionality for Vue components.
 *
 * Dependencies: None (standalone composable)
 *
 * @module composables/useSampleFiles
 */

/**
 * Sample file metadata object
 * @typedef {Object} SampleFileMetadata
 * @property {string} url - Vite-resolved URL path (e.g., '/sample-files/app.ipa')
 * @property {string} name - Original file name with extension (e.g., 'app.ipa')
 * @property {string} displayName - Human-readable name (e.g., 'App Name')
 * @property {'iOS'|'Android'} platform - Platform label
 * @property {string} extension - File extension without dot (e.g., 'ipa')
 * @property {number|null} size - File size in bytes (null until fetched)
 * @property {string|null} sizeFormatted - Human-readable size (e.g., '47.0 MB')
 */

/**
 * Composable return value
 * @typedef {Object} UseSampleFilesReturn
 * @property {import('vue').Ref<SampleFileMetadata[]>} sampleFiles - Reactive array of sample files
 * @property {import('vue').Ref<boolean>} isLoading - True when loading a file
 * @property {import('vue').Ref<string|null>} loadingFileName - Name of file being loaded
 * @property {import('vue').Ref<Error|null>} error - Error if loading failed
 * @property {(url: string, fileName: string) => Promise<File>} loadSampleFile - Load file as File object
 * @property {() => void} cancelCurrentLoad - Cancel in-progress load
 */

/**
 * useSampleFiles composable
 *
 * Discovers sample files at module load time and provides reactive state
 * for loading files as File objects.
 *
 * @returns {UseSampleFilesReturn} Composable interface
 *
 * @example
 * // In SampleFileGallery.vue
 * import { useSampleFiles } from '@/composables/useSampleFiles';
 *
 * const {
 *   sampleFiles,
 *   isLoading,
 *   loadingFileName,
 *   error,
 *   loadSampleFile,
 *   cancelCurrentLoad
 * } = useSampleFiles();
 *
 * // Display files immediately (basic metadata)
 * console.log(sampleFiles.value); // [{ name: 'app.ipa', platform: 'iOS', ... }]
 *
 * // Load a file when clicked
 * async function handleClick(file) {
 *   const fileObj = await loadSampleFile(file.url, file.name);
 *   emit('file-selected', fileObj);
 * }
 */
export function useSampleFiles() {}

/**
 * Internal: Extract basic metadata from file path
 *
 * @param {string} filePath - File path from import.meta.glob (e.g., '/sample-files/app.ipa')
 * @param {string} url - Resolved URL
 * @returns {Omit<SampleFileMetadata, 'size'|'sizeFormatted'>} Basic metadata
 *
 * @example
 * extractBasicMetadata('/sample-files/Tools-for-Procreate.ipa', '/sample-files/Tools-for-Procreate.ipa')
 * // Returns: {
 * //   url: '/sample-files/Tools-for-Procreate.ipa',
 * //   name: 'Tools-for-Procreate.ipa',
 * //   displayName: 'Tools for Procreate',
 * //   platform: 'iOS',
 * //   extension: 'ipa',
 * //   size: null,
 * //   sizeFormatted: null
 * // }
 */
function extractBasicMetadata(filePath, url) {}

/**
 * Internal: Fetch file size via HTTP HEAD request
 *
 * @param {string} url - File URL
 * @returns {Promise<number|null>} File size in bytes, or null if fetch fails
 *
 * @example
 * await fetchFileSize('/sample-files/app.ipa'); // Returns: 49283072
 */
async function fetchFileSize(url) {}

/**
 * Internal: Clean file name for display
 *
 * @param {string} fileName - Raw file name with extension
 * @returns {string} Cleaned display name
 *
 * @example
 * cleanFileName('com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64).apk')
 * // Returns: 'com.grasshopper.dialer'
 *
 * cleanFileName('A Night Battle HD 1.2.ipa')
 * // Returns: 'A Night Battle HD'
 */
function cleanFileName(fileName) {}

/**
 * Internal: Load sample file as File object
 *
 * @param {string} url - File URL
 * @param {string} fileName - Original file name
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<File>} File object compatible with existing upload handlers
 * @throws {Error} If fetch fails (excluding AbortError)
 *
 * @example
 * const controller = new AbortController();
 * const file = await loadSampleFileAsFile('/sample-files/app.ipa', 'app.ipa', controller.signal);
 * console.log(file instanceof File); // true
 * console.log(file.name); // 'app.ipa'
 */
async function loadSampleFileAsFile(url, fileName, signal) {}
