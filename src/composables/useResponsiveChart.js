import { computed, onMounted, onUnmounted, ref } from 'vue';

/**
 * Composable for responsive chart sizing
 * @param {Object} options - Configuration options
 * @param {number} options.mobileHeight - Height for mobile viewports (default: 250)
 * @param {number} options.tabletHeight - Height for tablet viewports (default: 280)
 * @param {number} options.desktopHeight - Height for desktop viewports (default: 320)
 * @returns {Object} - Chart height and window width refs
 */
export function useResponsiveChart(options = {}) {
  const {
    mobileHeight = 250,
    tabletHeight = 280,
    desktopHeight = 320
  } = options;

  const windowWidth = ref(window.innerWidth);

  const chartHeight = computed(() => {
    if (windowWidth.value < 768) {
      return `${mobileHeight}px`; // Mobile (375px)
    } else if (windowWidth.value < 1024) {
      return `${tabletHeight}px`; // Tablet (768px)
    } else {
      return `${desktopHeight}px`; // Desktop (1920px+)
    }
  });

  const updateWindowWidth = () => {
    windowWidth.value = window.innerWidth;
  };

  onMounted(() => {
    window.addEventListener('resize', updateWindowWidth);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateWindowWidth);
  });

  return {
    windowWidth,
    chartHeight
  };
}
