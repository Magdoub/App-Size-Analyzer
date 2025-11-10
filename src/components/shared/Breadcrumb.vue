<!--
  Breadcrumb Component
  Displays hierarchical navigation path with clickable segments
  for navigating through the treemap hierarchy.
-->
<template>
  <nav
    v-if="path.length > 0"
    aria-label="Hierarchy navigation"
    class="flex items-center gap-2 text-sm"
  >
    <button
      v-for="(segment, index) in path"
      :key="index"
      @click="handleSegmentClick(index)"
      :disabled="index === path.length - 1"
      :class="[
        'px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
        index === path.length - 1
          ? 'text-gray-900 font-medium cursor-default'
          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
      ]"
      :aria-current="index === path.length - 1 ? 'page' : undefined"
    >
      {{ segment }}
      <span v-if="index < path.length - 1" class="ml-2 text-gray-400" aria-hidden="true">
        {{ separator }}
      </span>
    </button>
  </nav>
</template>

<script>
export default {
  name: 'Breadcrumb',

  props: {
    /**
     * Breadcrumb path segments
     * @type {String[]}
     * @required
     */
    path: {
      type: Array,
      required: true,
      validator: (path) => path.every(p => typeof p === 'string')
    },

    /**
     * Separator character
     * @type {String}
     */
    separator: {
      type: String,
      default: '/'
    }
  },

  emits: ['navigate'],

  setup(props, { emit }) {
    /**
     * Handle breadcrumb segment click
     * @param {number} index - Index of clicked segment
     */
    const handleSegmentClick = (index) => {
      // Don't emit if clicking the last segment (current page)
      if (index < props.path.length - 1) {
        const newPath = props.path.slice(0, index + 1);
        emit('navigate', { index, path: newPath });
      }
    };

    return {
      handleSegmentClick
    };
  }
};
</script>
