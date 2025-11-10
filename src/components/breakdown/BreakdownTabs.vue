<!--
  Breakdown Tabs Component
  Tab navigation for filtering breakdown view
-->
<template>
  <div class="bg-white border-b border-gray-200">
    <div class="px-6">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="$emit('update:modelValue', tab.id)"
          :class="[
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
            modelValue === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <span class="mr-2">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'BreakdownTabs',

  props: {
    /**
     * Active tab ID (v-model)
     * @type {String}
     */
    modelValue: {
      type: String,
      required: true,
      validator: (val) => ['all', 'frameworks', 'assets', 'localizations'].includes(val)
    },

    /**
     * Platform type (affects labels)
     * @type {String}
     */
    platform: {
      type: String,
      required: true,
      validator: (val) => ['iOS', 'Android'].includes(val)
    }
  },

  emits: ['update:modelValue'],

  setup(props) {
    const tabs = computed(() => [
      { id: 'all', label: 'All Files', icon: '📁' },
      {
        id: 'frameworks',
        label: props.platform === 'iOS' ? 'Frameworks' : 'Libraries',
        icon: '📦'
      },
      { id: 'assets', label: 'Assets', icon: '🖼️' },
      { id: 'localizations', label: 'Localizations', icon: '🌐' }
    ]);

    return {
      tabs
    };
  }
};
</script>
