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
        'relative border-2 border-dashed rounded-3xl px-8 py-6 text-center',
        'transition-all duration-500 ease-out',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isDragging
          ? 'border-[#0a89fc] bg-[#0a89fc]/5 scale-[1.02] shadow-xl shadow-[#0a89fc]/10'
          : 'border-[hsl(35,20%,85%)] bg-[hsl(35,35%,91%)]/30 hover:border-[#0a89fc]/50 hover:bg-[#0a89fc]/5 hover:shadow-lg'
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
        <div class="flex flex-col items-center gap-3">
          <!-- Upload Icon -->
          <div :class="[
            'w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500',
            isDragging
              ? 'bg-gradient-to-br from-[#0a89fc] to-[#0070d4] shadow-lg shadow-[#0a89fc]/30 rotate-6'
              : 'bg-gradient-to-br from-[#0a89fc]/10 to-[#0a89fc]/5 rotate-0'
          ]">
            <svg
              :class="[
                'w-7 h-7 transition-all duration-500',
                isDragging ? 'text-white scale-110' : 'text-[#0a89fc]'
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <!-- Text -->
          <div>
            <p class="text-lg font-semibold text-[hsl(25,20%,18%)]">
              {{ isDragging ? 'Release to plant your file' : 'Drop your app to analyze' }}
            </p>
            <p class="mt-1 text-sm text-[hsl(25,15%,45%)]">
              or <span class="text-[#0a89fc] font-semibold hover:text-[#0070d4] underline decoration-2 underline-offset-2 decoration-[#0a89fc]/30 hover:decoration-[#0a89fc]">browse your files</span>
            </p>
          </div>

          <!-- Accepted formats -->
          <div class="flex flex-wrap items-center justify-center gap-2">
            <span
              v-for="format in acceptedFormats"
              :key="format"
              class="px-3 py-1 bg-gradient-to-r from-[hsl(35,35%,91%)] to-[hsl(45,40%,93%)] rounded-full text-xs font-semibold text-[hsl(25,25%,25%)] border border-[hsl(35,20%,85%)]"
            >
              {{ format }}
            </span>
          </div>

          <!-- Size limit notice -->
          <p class="text-xs text-[hsl(25,15%,55%)] mt-1">
            Max file size: 300 MB
          </p>
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
      default: () => ['.ipa', '.apk', '.aab', '.xapk', '.zip'],
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
      const extension = `.${file.name.toLowerCase().split('.').pop()}`;
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

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    const formatSize = (bytes) => {
      if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    };

    return {
      isDragging,
      fileInputRef,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileInput,
      formatSize
    };
  }
};
</script>
