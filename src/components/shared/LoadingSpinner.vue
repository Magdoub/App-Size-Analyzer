<!--
  LoadingSpinner - Loading indicator component with progress bar
  Displays a spinner, optional message, and progress percentage
-->
<template>
  <div class="flex flex-col items-center justify-center p-8">
    <!-- Spinner -->
    <div :class="sizeClasses" class="relative">
      <div class="absolute inset-0 border-4 border-[hsl(35,25%,88%)] rounded-full"></div>
      <div class="absolute inset-0 border-4 border-[#0a89fc] rounded-full border-t-transparent animate-spin"></div>
      <!-- Inner glow -->
      <div class="absolute inset-2 bg-gradient-to-br from-[#0a89fc]/10 to-[#0a89fc]/5 rounded-full"></div>
    </div>
    <p v-if="message" class="mt-5 text-sm font-medium text-[hsl(25,15%,45%)]">{{ message }}</p>
    <div v-if="progress !== null" class="mt-5 w-80">
      <div class="flex justify-between text-xs text-[hsl(25,15%,45%)] mb-2">
        <span class="font-medium flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-[#0a89fc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ statusText || 'Analyzing' }}
        </span>
        <span class="font-bold text-[hsl(25,20%,18%)]">{{ Math.round(displayProgress) }}%</span>
      </div>
      <div class="w-full bg-[hsl(35,25%,88%)] rounded-full h-3 overflow-hidden shadow-inner">
        <div
          class="h-3 rounded-full bg-gradient-to-r from-[#0a89fc] via-[#3da0fd] to-[#70b7fe]"
          :style="{ width: `${displayProgress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onUnmounted } from 'vue';

export default {
  name: 'LoadingSpinner',

  props: {
    /**
     * Loading message
     * @type {String}
     */
    message: {
      type: String,
      default: 'Loading...'
    },

    /**
     * Progress percentage (0-100)
     * @type {Number|null}
     */
    progress: {
      type: Number,
      default: null,
      validator: (p) => p === null || (p >= 0 && p <= 100)
    },

    /**
     * Status text shown next to progress (e.g., "Extracting archive...")
     * @type {String}
     */
    statusText: {
      type: String,
      default: ''
    },

    /**
     * Spinner size (small, medium, large)
     * @type {String}
     */
    size: {
      type: String,
      default: 'medium',
      validator: (s) => ['small', 'medium', 'large'].includes(s)
    }
  },

  setup(props) {
    const sizeClasses = computed(() => {
      const sizes = {
        small: 'w-6 h-6',
        medium: 'w-12 h-12',
        large: 'w-16 h-16'
      };
      return sizes[props.size];
    });

    // Animated progress value
    const displayProgress = ref(0);
    let animationFrame = null;

    // Animate progress smoothly towards target
    const animateProgress = (target) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      const animate = () => {
        const current = displayProgress.value;
        const diff = target - current;

        if (Math.abs(diff) < 0.5) {
          displayProgress.value = target;
          return;
        }

        // Ease out - faster at start, slower near target
        const speed = Math.max(0.5, Math.abs(diff) * 0.08);
        displayProgress.value = current + Math.sign(diff) * speed;

        animationFrame = requestAnimationFrame(animate);
      };

      animate();
    };

    // Watch for progress changes
    watch(() => props.progress, (newVal) => {
      if (newVal !== null) {
        animateProgress(newVal);
      }
    }, { immediate: true });

    onUnmounted(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    });

    return {
      sizeClasses,
      displayProgress
    };
  }
};
</script>
