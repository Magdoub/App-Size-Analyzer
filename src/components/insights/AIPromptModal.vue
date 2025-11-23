<!--
  AI Prompt Modal Component
  Displays AI debugging prompt with copy functionality
-->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        @click="handleBackdropClick"
      >
        <div
          class="modal-container"
          @click.stop
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <!-- Close button -->
          <button
            class="close-btn"
            @click="close"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- Header -->
          <div class="modal-header">
            <div class="ai-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18h6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 22h4" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 2v4" stroke-linecap="round"/>
                <path d="M9 2v4" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2 id="modal-title" class="modal-title">Debug with AI</h2>
            <p class="modal-subtitle">
              Copy this prompt and paste it into your AI tool
            </p>
            <div class="ai-tools">
              <span class="ai-badge">ChatGPT</span>
              <span class="ai-badge">Claude</span>
              <span class="ai-badge">Gemini</span>
            </div>
          </div>

          <!-- Prompt Display -->
          <div class="prompt-container">
            <div class="prompt-header">
              <span class="prompt-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4 17 10 11 4 5" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="12" y1="19" x2="20" y2="19" stroke-linecap="round"/>
                </svg>
                Debugging Prompt
              </span>
              <span class="prompt-length">{{ promptLength }} characters</span>
            </div>
            <pre class="prompt-text" ref="promptRef">{{ prompt }}</pre>
          </div>

          <!-- Copy Button -->
          <button
            class="copy-btn"
            @click="handleCopy"
            :class="{ copied: isCopied }"
            :disabled="isCopied"
          >
            <span class="copy-particles" v-if="isCopied">
              <span v-for="i in 8" :key="i" class="particle"></span>
            </span>
            <svg v-if="!isCopied" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ isCopied ? 'Copied!' : 'Copy Prompt' }}</span>
          </button>

          <!-- Footer hint -->
          <div class="modal-footer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Paste this prompt in your preferred AI assistant to get optimization help</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'AIPromptModal',

  props: {
    /**
     * Controls modal visibility
     */
    isOpen: {
      type: Boolean,
      default: false
    },

    /**
     * The prompt text to display and copy
     */
    prompt: {
      type: String,
      default: ''
    }
  },

  emits: ['close', 'copy'],

  setup(props, { emit }) {
    const isCopied = ref(false);
    const promptRef = ref(null);

    const promptLength = computed(() => {
      return props.prompt.length.toLocaleString();
    });

    // Close modal
    const close = () => {
      emit('close');
    };

    // Handle backdrop click
    const handleBackdropClick = () => {
      close();
    };

    // Handle copy
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(props.prompt);
        isCopied.value = true;
        emit('copy');

        // Reset after animation
        setTimeout(() => {
          isCopied.value = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy prompt:', err);

        // Fallback: Select text
        if (promptRef.value) {
          const range = document.createRange();
          range.selectNodeContents(promptRef.value);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);

          alert('Failed to copy automatically. The text has been selected - please copy it manually (Cmd+C or Ctrl+C)');
        }
      }
    };

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && props.isOpen) {
        close();
      }
    };

    // Add/remove escape listener
    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      } else {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        isCopied.value = false;
      }
    });

    return {
      isCopied,
      promptRef,
      promptLength,
      close,
      handleBackdropClick,
      handleCopy
    };
  }
};
</script>

<style scoped>
/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 20, 18, 0.5);
  padding: 20px;
}

/* Modal Container */
.modal-container {
  position: relative;
  width: 100%;
  max-width: 750px;
  max-height: 92vh;
  background: hsl(45, 40%, 98%);
  border-radius: 20px;
  border: 2px solid hsl(35, 20%, 85%);
  box-shadow:
    0 24px 72px rgba(25, 20, 18, 0.18),
    0 0 0 1px hsl(35, 25%, 88%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Close Button */
.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  background: hsl(35, 25%, 88%);
  border: 1px solid hsl(35, 20%, 85%);
  border-radius: 8px;
  color: hsl(25, 15%, 45%);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-btn:hover {
  background: hsl(35, 35%, 91%);
  color: hsl(25, 20%, 18%);
  border-color: hsl(35, 25%, 75%);
  transform: rotate(90deg);
}

/* Header */
.modal-header {
  padding: 32px 48px 24px;
  text-align: center;
  position: relative;
  background: linear-gradient(180deg, hsl(200, 45%, 94%) 0%, hsl(45, 40%, 98%) 100%);
  border-bottom: 2px solid hsl(35, 20%, 85%);
}

.ai-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, hsl(207, 90%, 96%) 0%, hsl(207, 85%, 92%) 100%);
  border: 2px solid hsl(207, 60%, 85%);
  border-radius: 14px;
  color: hsl(207, 97%, 51%);
  margin: 0 auto 16px;
  position: relative;
  box-shadow: 0 4px 12px rgba(10, 137, 252, 0.15);
}

.ai-icon::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: linear-gradient(135deg, hsl(207, 97%, 51%), hsl(207, 97%, 40%));
  border-radius: 18px;
  opacity: 0.08;
  filter: blur(8px);
  z-index: -1;
}

.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: hsl(25, 20%, 18%);
  margin: 0 0 8px;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.modal-subtitle {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  color: hsl(25, 15%, 45%);
  margin: 0 0 16px;
  font-weight: 400;
  line-height: 1.4;
}

.ai-tools {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.ai-badge {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  background: hsl(207, 90%, 96%);
  border: 1.5px solid hsl(207, 70%, 85%);
  border-radius: 8px;
  color: hsl(207, 97%, 45%);
  letter-spacing: 0.01em;
}

/* Prompt Container */
.prompt-container {
  margin: 24px 48px 28px;
  background: hsl(35, 35%, 94%);
  border: 2px solid hsl(35, 20%, 85%);
  border-radius: 14px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: inset 0 2px 6px rgba(25, 20, 18, 0.06);
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: hsl(35, 25%, 88%);
  border-bottom: 1.5px solid hsl(35, 20%, 85%);
}

.prompt-label {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: hsl(25, 15%, 45%);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.prompt-label svg {
  opacity: 0.6;
}

.prompt-length {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: hsl(207, 80%, 50%);
  font-weight: 500;
}

.prompt-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13.5px;
  line-height: 1.65;
  color: hsl(25, 20%, 25%);
  padding: 24px;
  margin: 0;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  flex: 1;
  background: hsl(45, 40%, 98%);
}

.prompt-text::-webkit-scrollbar {
  width: 10px;
}

.prompt-text::-webkit-scrollbar-track {
  background: hsl(35, 25%, 88%);
  border-radius: 8px;
}

.prompt-text::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, hsl(207, 90%, 60%), hsl(207, 97%, 51%));
  border-radius: 8px;
  border: 2px solid hsl(35, 25%, 88%);
}

.prompt-text::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, hsl(207, 97%, 51%), hsl(207, 97%, 40%));
}

/* Copy Button */
.copy-btn {
  margin: 0 48px 28px;
  padding: 16px 28px;
  background: linear-gradient(135deg, hsl(207, 97%, 51%) 0%, hsl(207, 97%, 45%) 100%);
  border: 2px solid hsl(207, 90%, 60%);
  border-radius: 14px;
  color: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(10, 137, 252, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.copy-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.copy-btn:hover::before {
  opacity: 1;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 24px rgba(10, 137, 252, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.copy-btn:active {
  transform: translateY(0);
}

.copy-btn.copied {
  background: linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 71%, 45%) 100%);
  border-color: hsl(142, 76%, 50%);
  box-shadow:
    0 4px 16px rgba(22, 163, 74, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.copy-btn:disabled {
  cursor: default;
}

/* Copy Particles Animation */
.copy-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  opacity: 0;
  animation: particle-burst 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.particle:nth-child(1) { animation-delay: 0s; --angle: 0deg; }
.particle:nth-child(2) { animation-delay: 0.05s; --angle: 45deg; }
.particle:nth-child(3) { animation-delay: 0.1s; --angle: 90deg; }
.particle:nth-child(4) { animation-delay: 0.15s; --angle: 135deg; }
.particle:nth-child(5) { animation-delay: 0.2s; --angle: 180deg; }
.particle:nth-child(6) { animation-delay: 0.25s; --angle: 225deg; }
.particle:nth-child(7) { animation-delay: 0.3s; --angle: 270deg; }
.particle:nth-child(8) { animation-delay: 0.35s; --angle: 315deg; }

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(40px) scale(0);
  }
}

/* Footer */
.modal-footer {
  padding: 0 48px 36px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  color: hsl(25, 15%, 50%);
  line-height: 1.5;
}

.modal-footer svg {
  flex-shrink: 0;
  opacity: 0.5;
  color: hsl(207, 80%, 55%);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .modal-container {
    max-height: 95vh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .modal-header,
  .prompt-container,
  .copy-btn,
  .modal-footer {
    margin-left: 24px;
    margin-right: 24px;
  }

  .modal-header {
    padding: 32px 24px 20px;
  }

  .modal-title {
    font-size: 24px;
  }

  .modal-footer {
    padding: 0 24px 24px;
  }
}
</style>
