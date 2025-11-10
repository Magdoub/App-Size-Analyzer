<!--
  File Validator Component
  Displays validation errors to user
-->
<template>
  <div v-if="errors.length > 0" class="w-full max-w-2xl mx-auto mt-4">
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-red-800">Validation Error</h3>
          <div class="mt-2 text-sm text-red-700">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
            </ul>
          </div>
          <button
            v-if="dismissible"
            @click="handleDismiss"
            class="mt-3 text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none focus:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileValidator',

  props: {
    /**
     * Array of validation error messages
     * @type {String[]}
     * @required
     */
    errors: {
      type: Array,
      required: true,
      validator: (errors) => errors.every(e => typeof e === 'string')
    },

    /**
     * Whether to show dismiss button
     * @type {Boolean}
     */
    dismissible: {
      type: Boolean,
      default: true
    }
  },

  emits: ['dismiss'],

  setup(props, { emit }) {
    const handleDismiss = () => {
      emit('dismiss');
    };

    return {
      handleDismiss
    };
  }
};
</script>
