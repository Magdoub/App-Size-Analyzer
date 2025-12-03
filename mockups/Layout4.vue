<template>
  <div class="w-full max-w-2xl mx-auto">
    <div class="bg-gradient-to-br from-white to-[hsl(45,40%,98%)] shadow-lg shadow-[hsl(25,40%,35%)]/5 rounded-3xl border border-[hsl(35,20%,85%)] animate-grow p-3">
      <!-- Tab Navigation - Sliding Indicator Style -->
      <div class="relative flex bg-white/50 p-2 rounded-2xl">
        <!-- Sliding Background Indicator -->
        <div
          class="absolute top-2 bottom-2 bg-gradient-to-br from-[#0a89fc]/10 to-[#0a89fc]/5 rounded-xl transition-all duration-300 ease-out"
          :style="{
            left: activeTab === 'url' ? '0.5rem' : '50%',
            width: 'calc(50% - 0.5rem)'
          }"
        ></div>

        <!-- Tabs -->
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'relative z-10 flex-1 px-8 py-4 text-base font-bold transition-all duration-300 rounded-xl',
            activeTab === tab.id
              ? 'text-[#0a89fc]'
              : 'text-[hsl(25,15%,45%)] hover:text-[hsl(25,20%,18%)]'
          ]"
        >
          <span class="flex items-center justify-center gap-2.5">
            <!-- SVG Icon -->
            <svg v-if="tab.id === 'url'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            {{ tab.label }}
          </span>
        </button>

        <!-- Active Tab Underline -->
        <div
          class="absolute bottom-0 h-1 bg-gradient-to-r from-[#0a89fc] to-[#0070d4] transition-all duration-300 ease-out rounded-full"
          :style="{
            left: activeTab === 'url' ? '0.5rem' : '50%',
            width: 'calc(50% - 1rem)'
          }"
        ></div>
      </div>

      <!-- Tab Content -->
      <div class="px-16 py-14 bg-white rounded-2xl mt-3">
        <!-- URL Tab -->
        <div v-show="activeTab === 'url'" class="space-y-8">
          <div class="flex items-start gap-4 mb-8">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a89fc]/10 to-[#0a89fc]/5 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#0a89fc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[hsl(25,20%,18%)]">Paste App Store or Play Store URL</h3>
              <p class="text-sm text-[hsl(25,15%,45%)] mt-1">We'll download and analyze the app for you</p>
            </div>
          </div>

          <!-- Side-by-Side URL Input with Button -->
          <div class="flex gap-3 w-full">
            <!-- Input Field (75% width) -->
            <div class="flex-1 rounded-xl border-2 border-[hsl(35,20%,85%)] focus-within:border-[#0a89fc] focus-within:ring-4 focus-within:ring-[#0a89fc]/10 transition-all bg-white">
              <input
                v-model="urlInput"
                type="text"
                placeholder="https://apps.apple.com/... or play.google.com/..."
                class="w-full px-6 py-4 text-[hsl(25,20%,18%)] placeholder:text-[hsl(25,15%,55%)] text-base outline-none border-0 rounded-xl"
                @keyup.enter="analyzeUrl"
              >
            </div>

            <!-- Analyze Button (25% width) -->
            <button
              @click="analyzeUrl"
              class="group flex-shrink-0 px-6 py-4 rounded-xl text-base font-bold text-white transition-all duration-200 bg-gradient-to-br from-[#0a89fc] to-[#0070d4] hover:from-[#0070d4] hover:to-[#0060c4] hover:shadow-lg hover:shadow-[#0a89fc]/25 active:scale-95 cursor-pointer"
            >
              <span class="relative flex items-center justify-center gap-2 whitespace-nowrap">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Analyze</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Upload Tab -->
        <div v-show="activeTab === 'upload'">
          <slot name="upload"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'Layout4',

  emits: ['url-submit'],

  setup(props, { emit }) {
    const activeTab = ref('url');
    const urlInput = ref('');

    const tabs = [
      { id: 'url', label: 'From URL' },
      { id: 'upload', label: 'Upload' }
    ];

    const analyzeUrl = () => {
      const url = urlInput.value.trim();
      if (url) {
        emit('url-submit', url);
        console.log('Analyzing URL:', url);
      }
    };

    return {
      activeTab,
      urlInput,
      tabs,
      analyzeUrl
    };
  }
};
</script>
