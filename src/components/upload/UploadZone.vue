<!--
  Upload Zone Component
  Drag-and-drop file upload zone for IPA/APK files
-->
<template>
  <div class="w-full max-w-2xl mx-auto">
    <div
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
      :class="[
        'relative border-2 border-dashed rounded-lg p-12 text-center',
        'transition-colors duration-200',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
      ]"
    >
      <input
        type="file"
        id="file-upload"
        ref="fileInputRef"
        :accept="acceptedFormats.join(',')"
        :disabled="disabled"
        @change="handleFileInput"
        class="hidden"
      />

      <label for="file-upload" :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'">
        <div class="flex flex-col items-center gap-4">
          <!-- Upload Icon -->
          <svg
            class="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <!-- Text -->
          <div>
            <p class="text-lg font-medium text-gray-900">
              {{ isDragging ? 'Drop your file here' : 'Drag and drop your app file' }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              or <span class="text-blue-600 hover:text-blue-700">browse</span> to choose
            </p>
          </div>

          <!-- Accepted formats -->
          <div class="mt-2 text-xs text-gray-500">
            <p>Supported formats: {{ acceptedFormats.join(', ') }}</p>
            <p class="mt-1">Maximum size: {{ (maxSize / (1024 * 1024)).toFixed(0) }}MB</p>
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'UploadZone',

  props: {
    /**
     * Callback fired when a valid file is selected
     * @type {Function}
     * @param {File} file - The selected file
     * @required
     */
    onFileSelect: {
      type: Function,
      required: true,
      validator: (fn) => typeof fn === 'function'
    },

    /**
     * Maximum file size in bytes (default: 2GB)
     * @type {Number}
     */
    maxSize: {
      type: Number,
      default: 2 * 1024 * 1024 * 1024,
      validator: (size) => size > 0
    },

    /**
     * Accepted file extensions
     * @type {String[]}
     */
    acceptedFormats: {
      type: Array,
      default: () => ['.ipa', '.apk', '.aab', '.xapk'],
      validator: (formats) => formats.every(f => typeof f === 'string' && f.startsWith('.'))
    },

    /**
     * Whether upload is disabled (e.g., during parsing)
     * @type {Boolean}
     */
    disabled: {
      type: Boolean,
      default: false
    }
  },

  emits: ['file-selected', 'validation-error'],

  setup(props, { emit }) {
    const isDragging = ref(false);
    const fileInputRef = ref(null);

    /**
     * Validate the selected file
     * @param {File} file - File to validate
     * @returns {string[]|null} Array of errors or null if valid
     */
    const validateFile = (file) => {
      const errors = [];

      // Check file size
      if (file.size > props.maxSize) {
        errors.push(
          `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum of ${(props.maxSize / (1024 * 1024)).toFixed(0)}MB`
        );
      }

      // Check file size > 0
      if (file.size === 0) {
        errors.push('File is empty');
      }

      // Check file extension
      const extension = '.' + file.name.toLowerCase().split('.').pop();
      if (!props.acceptedFormats.includes(extension)) {
        errors.push(
          `Unsupported file format: ${extension}. Expected: ${props.acceptedFormats.join(', ')}`
        );
      }

      return errors.length > 0 ? errors : null;
    };

    /**
     * Process a selected file
     * @param {File} file - File to process
     */
    const processFile = (file) => {
      const errors = validateFile(file);
      if (errors) {
        emit('validation-error', errors);
      } else {
        emit('file-selected', file);
        // Also call the callback prop for compatibility
        props.onFileSelect(file);
      }
    };

    const handleDragEnter = () => {
      if (!props.disabled) {
        isDragging.value = true;
      }
    };

    const handleDragLeave = () => {
      isDragging.value = false;
    };

    const handleDragOver = () => {
      // Prevent default to allow drop
    };

    const handleDrop = (e) => {
      isDragging.value = false;
      if (props.disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file) {
          processFile(file);
        }
      }
    };

    const handleFileInput = (e) => {
      if (props.disabled) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file) {
          processFile(file);
        }
      }
    };

    return {
      isDragging,
      fileInputRef,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileInput
    };
  }
};
</script>
