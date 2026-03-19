<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container" role="dialog" aria-labelledby="modal-title" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <h2 id="modal-title">JSON Export</h2>
            <button
              @click="handleClose"
              class="close-btn"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <div v-if="isGenerating" class="loading-state">
              <div class="loading-spinner">
                <div class="spinner-ring"></div>
              </div>
              <p class="loading-message">Generating JSON export...</p>
            </div>

            <div v-else-if="generationError" class="error-state">
              <p class="error-message">{{ generationError }}</p>
              <button @click="handleRetry" class="retry-btn">Retry</button>
            </div>

            <pre v-else class="json-display" v-html="highlightedJSON"></pre>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button
              @click="handleCopy"
              :disabled="isGenerating || !!generationError"
              class="btn btn-primary"
              title="Copy to clipboard (Ctrl/Cmd + C)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy to Clipboard
            </button>

            <button
              @click="handleDownload"
              :disabled="isGenerating || !!generationError"
              class="btn btn-secondary"
              title="Download as file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download JSON
            </button>
          </div>

          <!-- Toast Notification -->
          <Transition name="toast">
            <div v-if="notification" :class="['toast', `toast-${notification.type}`]">
              {{ notification.message }}
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  copyToClipboard,
  downloadJSONFile,
  generateExportFilename,
  generateExportJSON,
  highlightJSON,
} from '../../lib/export/json-generator';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useUiStore } from '../../stores/uiStore';

const analysisStore = useAnalysisStore();
const uiStore = useUiStore();

const { currentAnalysis } = storeToRefs(analysisStore);
const { showExportModal } = storeToRefs(uiStore);

const isOpen = computed(() => showExportModal.value);
const jsonString = ref('');
const isGenerating = ref(false);
const generationError = ref(null);
const notification = ref(null);

const highlightedJSON = computed(() => {
  return jsonString.value ? highlightJSON(jsonString.value) : '';
});

// Generate JSON when modal opens
watch(isOpen, async (newValue) => {
  if (newValue && currentAnalysis.value) {
    // Set loading state immediately so modal renders with loading UI
    isGenerating.value = true;
    generationError.value = null;

    // Defer JSON generation to next tick to allow modal to render first
    await nextTick();

    // Add small delay to ensure smooth transition
    setTimeout(() => {
      generateJSON();
    }, 50);
  } else if (!newValue) {
    // Reset state when modal closes
    jsonString.value = '';
    isGenerating.value = false;
    generationError.value = null;
    notification.value = null;
  }
});

function generateJSON() {
  try {
    // Construct complete metadata object from currentAnalysis
    // The export function expects: {appName, platform, totalSize, bundleId, version}
    // But currentAnalysis has these fields at different levels
    const exportMetadata = {
      appName: currentAnalysis.value.appName,
      platform: currentAnalysis.value.platform || currentAnalysis.value.metadata?.platform,
      totalSize: currentAnalysis.value.totalInstallSize || currentAnalysis.value.totalDownloadSize || 0,
      bundleId: currentAnalysis.value.bundleId || currentAnalysis.value.metadata?.bundleId,
      version: currentAnalysis.value.version || currentAnalysis.value.metadata?.version,
    };

    // Use requestIdleCallback for non-blocking generation if available
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        try {
          jsonString.value = generateExportJSON(
            currentAnalysis.value.breakdownRoot,
            exportMetadata
          );
          isGenerating.value = false;
        } catch (err) {
          console.error('JSON generation failed:', err);
          generationError.value = `Failed to generate JSON: ${err.message}`;
          isGenerating.value = false;
        }
      });
    } else {
      // Fallback to immediate execution
      jsonString.value = generateExportJSON(
        currentAnalysis.value.breakdownRoot,
        exportMetadata
      );
      isGenerating.value = false;
    }
  } catch (err) {
    console.error('JSON generation failed:', err);
    generationError.value = `Failed to generate JSON: ${err.message}`;
    isGenerating.value = false;
  }
}

function handleRetry() {
  generateJSON();
}

async function handleCopy() {
  if (!jsonString.value) return;

  const result = await copyToClipboard(jsonString.value);

  if (result.success) {
    showNotification('Copied to clipboard!', 'success');
  } else {
    showNotification(result.error, 'error');
  }
}

function handleDownload() {
  if (!jsonString.value || !currentAnalysis.value) return;

  const filename = generateExportFilename(
    currentAnalysis.value.appName,
    currentAnalysis.value.platform
  );
  downloadJSONFile(jsonString.value, filename);
  showNotification('Download started', 'success');
}

function handleClose() {
  uiStore.closeExportModal();
}

function showNotification(message, type) {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
}

// Keyboard shortcuts
function handleKeydown(event) {
  if (!isOpen.value) return;

  // Escape key closes modal
  if (event.key === 'Escape') {
    handleClose();
  }

  // Ctrl/Cmd + C copies (when focused on modal)
  if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
    // Let default behavior work, but also show our notification
    if (jsonString.value) {
      setTimeout(() => {
        showNotification('Copied to clipboard!', 'success');
      }, 100);
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Modal Container */
.modal-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

/* Body */
.modal-body {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
  min-height: 300px;
  max-height: calc(90vh - 180px);
}

.json-display {
  margin: 0;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
  color: #111827;
}

/* Syntax Highlighting */
.json-display :deep(.json-key) {
  color: #0451a5;
  font-weight: 600;
}

.json-display :deep(.json-string) {
  color: #a31515;
}

.json-display :deep(.json-number) {
  color: #098658;
}

.json-display :deep(.json-keyword) {
  color: #0000ff;
  font-weight: 600;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  margin-bottom: 1.5rem;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Error State */
.error-state {
  padding: 2rem;
  text-align: center;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Toast Notification */
.toast {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.toast-success {
  background: #10b981;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}
</style>
