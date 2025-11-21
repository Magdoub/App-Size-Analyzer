/**
 * App Store - Pinia state management
 *
 * Manages file upload state, parsing status, and validation
 */

import { defineStore } from 'pinia';

/**
 * @typedef {Object} AppFile
 * @property {File} file - Browser File object
 * @property {string} name - File name
 * @property {number} size - File size in bytes
 * @property {'ipa'|'apk'|'aab'|'xapk'} type - File type
 * @property {number} uploadedAt - Upload timestamp
 */

/**
 * @typedef {Object} ParsingStatus
 * @property {'idle'|'parsing'|'success'|'error'} state - Parsing state
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} message - Status message
 * @property {string|null} error - Error message if failed
 */

export const useAppStore = defineStore('app', {
  state: () => ({
    /** @type {AppFile|null} */
    currentFile: null,

    /** @type {ParsingStatus} */
    parsingStatus: {
      state: 'idle',
      progress: 0,
      message: '',
      error: null,
    },

    /** @type {string[]} */
    validationErrors: [],

    /** @type {boolean} */
    isLoading: false,

    /** @type {number} */
    loadingProgress: 0,

    /** @type {string} */
    loadingStatus: '',

    /** @type {string} */
    loadingStatusText: '',

    /** @type {string|null} */
    error: null,
  }),

  getters: {
    /**
     * Check if a file is currently loaded
     * @returns {boolean}
     */
    hasFile: (state) => state.currentFile !== null,

    /**
     * Check if parsing is in progress
     * @returns {boolean}
     */
    isParsing: (state) => state.parsingStatus.state === 'parsing',

    /**
     * Check if parsing completed successfully
     * @returns {boolean}
     */
    isParsingSuccess: (state) => state.parsingStatus.state === 'success',

    /**
     * Check if there are validation errors
     * @returns {boolean}
     */
    hasValidationErrors: (state) => state.validationErrors.length > 0,
  },

  actions: {
    /**
     * Set the current file
     * @param {File} file - Browser File object
     */
    setCurrentFile(file) {
      this.currentFile = {
        file,
        name: file.name,
        size: file.size,
        type: this.detectFileType(file.name),
        uploadedAt: Date.now(),
      };
      this.validationErrors = [];
    },

    /**
     * Clear the current file
     */
    clearCurrentFile() {
      this.currentFile = null;
      this.parsingStatus = {
        state: 'idle',
        progress: 0,
        message: '',
        error: null,
      };
      this.validationErrors = [];
    },

    /**
     * Update parsing status
     * @param {Partial<ParsingStatus>} status - Status update
     */
    updateParsingStatus(status) {
      this.parsingStatus = {
        ...this.parsingStatus,
        ...status,
      };
    },

    /**
     * Set parsing error
     * @param {string} error - Error message
     */
    setParsingError(error) {
      this.parsingStatus = {
        state: 'error',
        progress: 0,
        message: '',
        error,
      };
      this.error = error;
    },

    /**
     * Add validation error
     * @param {string} error - Validation error message
     */
    addValidationError(error) {
      if (!this.validationErrors.includes(error)) {
        this.validationErrors.push(error);
      }
    },

    /**
     * Clear validation errors
     */
    clearValidationErrors() {
      this.validationErrors = [];
    },

    /**
     * Set loading state
     * @param {boolean} isLoading - Loading state
     * @param {number} [progress=0] - Progress percentage
     * @param {string} [statusText=''] - Detailed status text (e.g., "Extracting archive...")
     */
    setLoading(isLoading, progress = 0, statusText = '') {
      this.isLoading = isLoading;
      this.loadingProgress = progress;
      this.loadingStatusText = statusText;
      // Set high-level status based on state
      this.loadingStatus = isLoading ? 'parsing' : '';
    },

    /**
     * Set error message
     * @param {string|null} error - Error message
     */
    setError(error) {
      this.error = error;
    },

    /**
     * Detect file type from filename
     * @param {string} filename - File name
     * @returns {'ipa'|'apk'|'aab'|'xapk'|'unknown'}
     * @private
     */
    detectFileType(filename) {
      const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
      switch (ext) {
        case '.ipa':
          return 'ipa';
        case '.apk':
          return 'apk';
        case '.aab':
          return 'aab';
        case '.xapk':
          return 'xapk';
        default:
          return 'unknown';
      }
    },

    /**
     * Reset store to initial state
     */
    reset() {
      this.currentFile = null;
      this.parsingStatus = {
        state: 'idle',
        progress: 0,
        message: '',
        error: null,
      };
      this.validationErrors = [];
      this.isLoading = false;
      this.loadingProgress = 0;
      this.loadingStatus = '';
      this.loadingStatusText = '';
      this.error = null;
    },
  },
});
