<!--
  Breakdown Table Component
  Virtual scrolling table for displaying hierarchical breakdown data
-->
<template>
  <div class="flex flex-col h-full">
    <!-- Search Bar -->
    <div class="bg-white border-b border-gray-200 px-6 py-3">
      <input
        type="text"
        v-model="searchQuery"
        @input="handleSearchInput"
        placeholder="Search files..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Table Header -->
    <div class="bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div class="grid grid-cols-12 gap-4 text-xs font-medium text-gray-700 uppercase tracking-wider">
        <div class="col-span-6">
          <button
            @click="handleSort('name')"
            class="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
          >
            Name
            <svg v-if="uiStore.breakdown.sortBy === 'name'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path v-if="uiStore.breakdown.sortOrder === 'asc'" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              <path v-else d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
            </svg>
          </button>
        </div>
        <div class="col-span-2 text-right">
          <button
            @click="handleSort('size')"
            class="flex items-center justify-end gap-1 w-full hover:text-gray-900 focus:outline-none"
          >
            Install Size
            <svg v-if="uiStore.breakdown.sortBy === 'size'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path v-if="uiStore.breakdown.sortOrder === 'asc'" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              <path v-else d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
            </svg>
          </button>
        </div>
        <div class="col-span-2 text-right">Uncompressed</div>
        <div class="col-span-2 text-right">
          <button
            @click="handleSort('percentage')"
            class="flex items-center justify-end gap-1 w-full hover:text-gray-900 focus:outline-none"
          >
            % of Total
            <svg v-if="uiStore.breakdown.sortBy === 'percentage'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path v-if="uiStore.breakdown.sortOrder === 'asc'" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              <path v-else d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Virtual Scrolling Container -->
    <div v-if="!isFilteredEmpty || activeTab === 'all'" ref="parentRef" class="flex-1 overflow-auto bg-white">
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

              <!-- Install Size Column -->
              <div class="col-span-2 text-right text-gray-700">
                {{ formatBytes(visibleNodes[virtualRow.index].node.size) }}
              </div>

              <!-- Uncompressed Size Column (for reference) -->
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

    <!-- Empty State for Filtered Results -->
    <div v-if="isFilteredEmpty && activeTab !== 'all'" class="flex-1 flex items-center justify-center bg-white">
      <div class="text-center py-12">
        <div class="text-4xl mb-4">{{ emptyStateIcon }}</div>
        <p class="text-gray-500 text-lg">{{ emptyStateMessage }}</p>
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
import { useVirtualizer } from '@tanstack/vue-virtual';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useUiStore } from '../../stores/uiStore';
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
    const uiStore = useUiStore();
    const expandedNodes = ref(uiStore.breakdown.expandedNodes);
    const searchQuery = ref(uiStore.breakdown.searchQuery);
    let searchDebounceTimer = null;

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

      const filtered = filterByType(props.breakdownRoot);
      // Return empty root if no matches found (don't fall back to showing all files)
      if (!filtered) {
        return {
          ...props.breakdownRoot,
          children: []
        };
      }
      return filtered;
    });

    // Empty state messages for filtered tabs
    const emptyStateMessage = computed(() => {
      switch (props.activeTab) {
        case 'frameworks':
          return 'No frameworks or libraries detected';
        case 'assets':
          return 'No assets detected';
        case 'localizations':
          return 'No localizations detected';
        default:
          return 'No items found';
      }
    });

    const emptyStateIcon = computed(() => {
      switch (props.activeTab) {
        case 'frameworks':
          return '📦';
        case 'assets':
          return '🖼️';
        case 'localizations':
          return '🌐';
        default:
          return '📁';
      }
    });

    // Check if filtered results are empty (root has no children)
    const isFilteredEmpty = computed(() => {
      return filteredRoot.value.children.length === 0;
    });

    // Flatten tree to visible nodes with search filtering and sorting
    const visibleNodes = computed(() => {
      const flattened = [];
      const query = uiStore.breakdown.searchQuery.toLowerCase();

      const traverse = (node, depth, parentPath) => {
        // Search filtering
        const matchesSearch = !query || node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query);

        if (!matchesSearch) return; // Skip non-matching nodes

        flattened.push({
          node,
          depth,
          hasChildren: node.children && node.children.length > 0,
          parentPath
        });

        // Only traverse children if node is expanded or is root
        if ((expandedNodes.value.has(node.id) || depth === 0) && node.children) {
          // Sort children before traversing
          const sortedChildren = sortNodes([...node.children]);
          for (const child of sortedChildren) {
            traverse(child, depth + 1, node.path);
          }
        }
      };

      traverse(filteredRoot.value, 0, '');

      return flattened;
    });

    // Sort nodes based on current sort settings
    const sortNodes = (nodes) => {
      const { sortBy, sortOrder } = uiStore.breakdown;

      return nodes.sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'size') {
          comparison = a.size - b.size;
        } else if (sortBy === 'percentage') {
          const aPercent = (a.size / props.totalSize) * 100;
          const bPercent = (b.size / props.totalSize) * 100;
          comparison = aPercent - bPercent;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    };

    // Virtual scrolling setup
    const virtualizer = useVirtualizer(computed(() => ({
      count: visibleNodes.value.length,
      getScrollElement: () => parentRef.value,
      estimateSize: () => 40, // Estimated row height in pixels
      overscan: 10 // Render extra rows for smoother scrolling
    })));

    // Toggle node expansion
    const toggleNode = (nodeId) => {
      uiStore.toggleBreakdownNode(nodeId);
      expandedNodes.value = uiStore.breakdown.expandedNodes;
    };

    // Handle sort column click
    const handleSort = (column) => {
      const currentSort = uiStore.breakdown.sortBy;
      const currentOrder = uiStore.breakdown.sortOrder;

      if (currentSort === column) {
        // Toggle direction
        uiStore.updateBreakdownSort(column, currentOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // New column, default to descending for size/percentage, ascending for name
        uiStore.updateBreakdownSort(column, column === 'name' ? 'asc' : 'desc');
      }
    };

    // Handle search input with debouncing
    const handleSearchInput = (event) => {
      const value = event.target.value;

      // Clear previous timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      // Set new timer
      searchDebounceTimer = setTimeout(() => {
        uiStore.setBreakdownSearch(value);
      }, 300);
    };

    // Restore scroll position on mount
    onMounted(() => {
      if (parentRef.value && uiStore.breakdown.scrollPosition > 0) {
        parentRef.value.scrollTop = uiStore.breakdown.scrollPosition;
      }
    });

    // Save scroll position on unmount
    onUnmounted(() => {
      if (parentRef.value) {
        uiStore.saveBreakdownScrollPosition(parentRef.value.scrollTop);
      }

      // Clear debounce timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    });

    // Watch for scroll events to save position
    watch(parentRef, (newRef) => {
      if (newRef) {
        newRef.addEventListener('scroll', () => {
          uiStore.saveBreakdownScrollPosition(newRef.scrollTop);
        });
      }
    });

    return {
      parentRef,
      uiStore,
      expandedNodes,
      searchQuery,
      visibleNodes,
      virtualizer,
      toggleNode,
      handleSort,
      handleSearchInput,
      formatBytes,
      formatPercentage,
      emptyStateMessage,
      emptyStateIcon,
      isFilteredEmpty
    };
  }
};
</script>
