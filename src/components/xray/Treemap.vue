<!--
  Treemap Component
  Interactive treemap visualization using Apache ECharts (Vue wrapper)
-->
<template>
  <div
    v-if="!data || data.value === 0"
    class="flex items-center justify-center h-full"
  >
    <div class="text-gray-500">Invalid treemap data (size is 0)</div>
  </div>

  <div
    v-else
    class="w-full border border-gray-300 rounded-lg"
    style="height: 650px; background-color: #f9fafb"
  >
    <v-chart
      class="w-full h-full"
      :option="chartOption"
      :autoresize="true"
      @click="handleChartClick"
      @mouseover="handleMouseOver"
      @mouseout="handleMouseOut"
    />
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { use } from 'echarts/core';
import { TreemapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../stores/uiStore';
import { getNodeColor, getLabelColor, getHoverHighlightColor } from '../../lib/visualization/color-scheme';
import { formatBytes } from '../../utils/formatters';
import { calculateNodeLabel } from '../../lib/visualization/node-label-calculator';

// Register ECharts components
use([TreemapChart, CanvasRenderer, TooltipComponent]);

export default {
  name: 'Treemap',

  components: {
    VChart
  },

  props: {
    /**
     * Treemap data structure
     * @type {Object}
     */
    data: {
      type: Object,
      required: true
    },

    /**
     * Total app size in bytes
     * @type {Number}
     */
    totalSize: {
      type: Number,
      required: true
    },

    /**
     * Color scheme mode
     * @type {String}
     */
    colorScheme: {
      type: String,
      default: 'size',
      validator: (val) => ['size', 'type'].includes(val)
    },

    /**
     * Array of paths that match search query
     * @type {Array}
     */
    searchMatches: {
      type: Array,
      default: () => []
    }
  },

  emits: ['node-click'],

  setup(props, { emit }) {
    const uiStore = useUiStore();
    const { xray } = storeToRefs(uiStore);

    /**
     * Get color for a treemap node
     * @param {Object} params - ECharts params object
     * @returns {string} - Hex color
     */
    const getNodeColorForChart = (params) => {
      if (!params.data) return '#94a3b8';

      // Highlight search matches
      if (props.searchMatches.includes(params.data.path)) {
        return '#fbbf24'; // Yellow for search matches
      }

      const baseColor = getNodeColor(
        params.value,
        params.data.type,
        props.totalSize,
        params.data.compressedSize,
        props.colorScheme
      );

      // Highlight hovered node
      if (xray.value.hoveredNodePath === params.data.path) {
        return getHoverHighlightColor(baseColor);
      }

      return baseColor;
    };

    /**
     * Get label text for a node
     * @param {Object} params - ECharts params object
     * @returns {string} - Label text or empty string
     */
    const getNodeLabel = (params) => {
      if (!params.data) return '';

      // Skip root wrapper
      const isRootWrapper =
        params.treePathInfo &&
        params.treePathInfo.length === 1 &&
        (!params.data.path || params.data.path === '' || params.data.path === '/');

      if (isRootWrapper) return '';

      // Calculate if label should be shown based on box dimensions
      const metadata = calculateNodeLabel({
        ...params.data,
        width: params.width || 0,
        height: params.height || 0
      });

      return metadata.shouldShowLabel ? metadata.labelText : '';
    };

    /**
     * Get label text color for contrast
     * @param {Object} params - ECharts params object
     * @returns {string} - Hex color
     */
    const getLabelTextColor = (params) => {
      if (!params.data) return '#000000';

      const bgColor = getNodeColor(
        params.value,
        params.data.type,
        props.totalSize,
        params.data.compressedSize,
        props.colorScheme
      );

      return getLabelColor(bgColor, 4.5);
    };

    /**
     * Format tooltip content
     * @param {Object} params - ECharts params object
     * @returns {string} - HTML string for tooltip
     */
    const formatTooltip = (params) => {
      if (!params.data) {
        return `
          <div style="font-weight: 500; color: #111827;">Unknown Node</div>
          <div style="font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem;">
            Size: ${formatBytes(params.value || 0)}
          </div>
        `;
      }

      // Skip root wrapper
      const isRootWrapper =
        params.treePathInfo &&
        params.treePathInfo.length === 1 &&
        (!params.data.path || params.data.path === '' || params.data.path === '/');

      if (isRootWrapper) return '';

      const percentage = ((params.value / props.totalSize) * 100).toFixed(2);
      const hasChildren = params.data.children && params.data.children.length > 0;

      let tooltip = `
        <div style="font-weight: 500; color: #111827; margin-bottom: 0.5rem;">
          ${params.name}
        </div>
        <div style="font-size: 0.875rem; color: #4b5563;">
          <div style="margin-bottom: 0.25rem;">
            <span style="font-weight: 500;">Size:</span> ${formatBytes(params.value)}
          </div>
          <div style="margin-bottom: 0.25rem;">
            <span style="font-weight: 500;">Percentage:</span> ${percentage}%
          </div>
      `;

      if (params.data.type) {
        tooltip += `
          <div style="margin-bottom: 0.25rem;">
            <span style="font-weight: 500;">Type:</span> ${params.data.type}
          </div>
        `;
      }

      if (params.data.compressedSize) {
        tooltip += `
          <div style="margin-bottom: 0.25rem;">
            <span style="font-weight: 500;">Compressed:</span> ${formatBytes(params.data.compressedSize)}
          </div>
        `;
      }

      if (hasChildren) {
        tooltip += `
          <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280; font-style: italic;">
            Click to drill down
          </div>
        `;
      }

      tooltip += '</div>';

      return tooltip;
    };

    /**
     * Handle chart click events
     * @param {Object} params - ECharts click event params
     */
    const handleChartClick = (params) => {
      if (!params.data) return;

      // Skip root wrapper
      const isRootWrapper =
        params.treePathInfo &&
        params.treePathInfo.length === 1 &&
        (!params.data.path || params.data.path === '' || params.data.path === '/');

      if (isRootWrapper) return;

      const hasChildren = params.data.children && params.data.children.length > 0;

      if (hasChildren) {
        emit('node-click', params.data.path);
      }
    };

    /**
     * Handle mouse over events
     * @param {Object} params - ECharts mouseover event params
     */
    const handleMouseOver = (params) => {
      if (params.data && params.data.path) {
        uiStore.setHoveredNode(params.data.path);
      }
    };

    /**
     * Handle mouse out events
     */
    const handleMouseOut = () => {
      uiStore.setHoveredNode(null);
    };

    // ECharts configuration
    const chartOption = computed(() => ({
      tooltip: {
        formatter: formatTooltip,
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        textStyle: {
          color: '#111827'
        },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; max-width: 400px; word-break: break-word;'
      },
      series: [
        {
          type: 'treemap',
          data: [props.data],
          breadcrumb: {
            show: false // We handle breadcrumbs in XRayView
          },
          roam: false,
          nodeClick: false, // We handle clicks manually
          squareRatio: 0.5 * (1 + Math.sqrt(5)), // Golden ratio for squarify algorithm
          label: {
            show: true,
            formatter: getNodeLabel,
            color: getLabelTextColor,
            fontSize: 12,
            fontWeight: 600,
            overflow: 'truncate',
            ellipsis: '...'
          },
          upperLabel: {
            show: false
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1,
            gapWidth: 1,
            color: getNodeColorForChart
          },
          emphasis: {
            itemStyle: {
              borderColor: '#ffffff',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            },
            label: {
              fontSize: 12,
              fontWeight: 600
            }
          },
          levels: [
            {
              itemStyle: {
                borderWidth: 0,
                gapWidth: 1
              }
            },
            {
              itemStyle: {
                borderWidth: 1,
                gapWidth: 1
              }
            }
          ],
          animation: true,
          animationDuration: 400,
          animationEasing: 'cubicOut'
        }
      ]
    }));

    return {
      chartOption,
      handleChartClick,
      handleMouseOver,
      handleMouseOut
    };
  }
};
</script>

<style scoped>
/* ECharts container styles */
.echarts {
  cursor: pointer;
}
</style>
