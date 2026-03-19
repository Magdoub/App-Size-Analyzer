<template>
  <button
    @click="handleClick"
    :disabled="!hasAnalysis"
    class="json-export-btn"
    aria-label="Export file breakdown as JSON"
    title="Export JSON"
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
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M10 12h4"></path>
      <path d="M10 16h4"></path>
    </svg>
    <span>Export JSON</span>
  </button>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useUiStore } from '../../stores/uiStore';

const analysisStore = useAnalysisStore();
const uiStore = useUiStore();

const { currentAnalysis } = storeToRefs(analysisStore);
const hasAnalysis = computed(() => currentAnalysis.value !== null);

function handleClick() {
  if (hasAnalysis.value) {
    uiStore.openExportModal();
  }
}
</script>

<style scoped>
.json-export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.json-export-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.json-export-btn:active:not(:disabled) {
  background: #f3f4f6;
}

.json-export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.json-export-btn svg {
  flex-shrink: 0;
}
</style>
