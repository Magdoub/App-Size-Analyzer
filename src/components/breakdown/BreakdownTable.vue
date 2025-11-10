<!--
  Breakdown Table Component
  Virtual scrolling table for displaying hierarchical breakdown data
-->
<template>
  <div class="flex flex-col h-full">
    <!-- Table Header -->
    <div class="bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div class="grid grid-cols-12 gap-4 text-xs font-medium text-gray-700 uppercase tracking-wider">
        <div class="col-span-6">Name</div>
        <div class="col-span-2 text-right">Size</div>
        <div class="col-span-2 text-right">Compressed</div>
        <div class="col-span-2 text-right">% of Total</div>
      </div>
    </div>

    <!-- Virtual Scrolling Container -->
    <div ref="parentRef" class="flex-1 overflow-auto bg-white">
      <div
        :style="{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }"
      >
        <div
          v-for="virtualRow in virtualizer.getVirtualItems()"
          :key="virtualRow.key"
          :data-index="virtualRow.index"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`
          }"
          class="px-6 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div
            v-if="visibleNodes[virtualRow.index]"
            class="grid grid-cols-12 gap-4 items-center text-sm"
          >
            <template v-if="visibleNodes[virtualRow.index]">
              <!-- Name Column -->
              <div
                class="col-span-6 flex items-center"
                :style="{ paddingLeft: `${visibleNodes[virtualRow.index].depth * 20}px` }"
              >
                <button
                  v-if="visibleNodes[virtualRow.index].hasChildren"
                  @click="toggleNode(visibleNodes[virtualRow.index].node.id)"
                  class="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg
                    :class="[
                      'w-4 h-4 transition-transform',
                      expandedNodes.has(visibleNodes[virtualRow.index].node.id) ? 'rotate-90' : ''
                    ]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <span class="font-medium text-gray-900">{{ visibleNodes[virtualRow.index].node.name }}</span>
                <span class="ml-2 text-xs text-gray-500">({{ visibleNodes[virtualRow.index].node.type }})</span>
              </div>

              <!-- Size Column -->
              <div class="col-span-2 text-right text-gray-700">
                {{ formatBytes(visibleNodes[virtualRow.index].node.size) }}
              </div>

              <!-- Compressed Size Column -->
              <div class="col-span-2 text-right text-gray-600">
                {{ visibleNodes[virtualRow.index].node.compressedSize
                    ? formatBytes(visibleNodes[virtualRow.index].node.compressedSize)
                    : '-' }}
              </div>

              <!-- Percentage Column -->
              <div class="col-span-2 text-right">
                <div class="flex items-center justify-end gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                    <div
                      class="bg-blue-500 h-2 rounded-full"
                      :style="{
                        width: `${Math.min(
                          (visibleNodes[virtualRow.index].node.size / totalSize) * 100,
                          100
                        )}%`
                      }"
                    />
                  </div>
                  <span class="text-gray-700 w-12 text-right">
                    {{ formatPercentage(visibleNodes[virtualRow.index].node.size, totalSize) }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Stats -->
    <div class="bg-gray-50 border-t border-gray-200 px-6 py-3">
      <div class="text-sm text-gray-600">
        Showing {{ visibleNodes.length }} items
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { formatBytes, formatPercentage } from '../../utils/formatters';

export default {
  name: 'BreakdownTable',

  props: {
    /**
     * Root breakdown node
     * @type {Object}
     */
    breakdownRoot: {
      type: Object,
      required: true
    },

    /**
     * Total file size in bytes
     * @type {Number}
     */
    totalSize: {
      type: Number,
      required: true
    },

    /**
     * Active filter tab
     * @type {String}
     */
    activeTab: {
      type: String,
      default: 'all',
      validator: (val) => ['all', 'frameworks', 'assets', 'localizations'].includes(val)
    }
  },

  setup(props) {
    const parentRef = ref(null);
    const expandedNodes = ref(new Set());

    // Filter nodes based on active tab
    const filteredRoot = computed(() => {
      if (props.activeTab === 'all') return props.breakdownRoot;

      const filterByType = (node) => {
        let shouldInclude = false;

        if (props.activeTab === 'frameworks') {
          shouldInclude = node.type === 'framework' || node.type === 'native_lib';
        } else if (props.activeTab === 'assets') {
          shouldInclude = ['image', 'video', 'audio', 'font', 'asset'].includes(node.type);
        } else if (props.activeTab === 'localizations') {
          shouldInclude = node.type === 'localization';
        }

        const filteredChildren = node.children
          .map(filterByType)
          .filter((n) => n !== null);

        if (shouldInclude || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren
          };
        }

        return null;
      };

      return filterByType(props.breakdownRoot) || props.breakdownRoot;
    });

    // Flatten tree to visible nodes only (respecting expanded state)
    const visibleNodes = computed(() => {
      const flattened = [];

      const traverse = (node, depth, parentPath) => {
        flattened.push({
          node,
          depth,
          hasChildren: node.children && node.children.length > 0,
          parentPath
        });

        // Only traverse children if node is expanded or is root
        if ((expandedNodes.value.has(node.id) || depth === 0) && node.children) {
          for (const child of node.children) {
            traverse(child, depth + 1, node.path);
          }
        }
      };

      traverse(filteredRoot.value, 0, '');

      return flattened;
    });

    // Virtual scrolling setup
    const virtualizer = useVirtualizer(computed(() => ({
      count: visibleNodes.value.length,
      getScrollElement: () => parentRef.value,
      estimateSize: () => 40, // Estimated row height in pixels
      overscan: 10 // Render extra rows for smoother scrolling
    })));

    // Toggle node expansion
    const toggleNode = (nodeId) => {
      const newExpanded = new Set(expandedNodes.value);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      expandedNodes.value = newExpanded;
    };

    return {
      parentRef,
      expandedNodes,
      visibleNodes,
      virtualizer,
      toggleNode,
      formatBytes,
      formatPercentage
    };
  }
};
</script>
