<template>
  <ErrorBoundary>
    <div class="min-h-screen flex flex-col relative">
      <!-- Decorative background elements -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-[#0a89fc] opacity-[0.04] rounded-full blur-3xl"></div>
        <div class="absolute top-1/3 -left-20 w-72 h-72 bg-[hsl(45,90%,55%)] opacity-[0.05] rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-[#0a89fc] opacity-[0.03] rounded-full blur-3xl"></div>
      </div>

      <!-- Header - only show when not on upload page -->
      <header v-if="uiStore.activeView !== 'upload'" class="relative bg-gradient-to-b from-white/90 to-white/70 border-b border-[hsl(35,20%,85%)] sticky top-0 z-50 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <button @click="handleNewAnalysis" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <!-- Logo mark -->
              <div class="logo-interactive w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0a89fc] to-[#0070d4] flex items-center justify-center shadow-lg shadow-[#0a89fc]/25 rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="text-left">
                <h1 class="text-xl font-bold text-[hsl(25,20%,18%)] tracking-tight">App Size Analyzer</h1>
                <p class="text-xs text-[hsl(25,15%,45%)] font-medium">
                  Optimize your app size
                </p>
              </div>
            </button>

            <!-- New Analysis button -->
            <button
              @click="handleNewAnalysis"
              class="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[hsl(45,90%,55%)] text-[hsl(25,20%,18%)] hover:bg-[hsl(45,90%,50%)] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <!-- App Context Bar - Shows which app is being analyzed -->
      <div v-if="uiStore.activeView !== 'upload' && analysisStore.currentAnalysis" class="relative bg-gradient-to-r from-[hsl(220,20%,96%)] to-[hsl(220,15%,98%)] border-b border-[hsl(220,20%,88%)]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <!-- App Info -->
            <div class="flex items-center gap-4">
              <!-- Platform Icon -->
              <div :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center shadow-md',
                analysisStore.currentAnalysis.platform === 'iOS'
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-slate-900/20'
                  : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-green-600/20'
              ]">
                <!-- iOS icon -->
                <svg v-if="analysisStore.currentAnalysis.platform === 'iOS'" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <!-- Android icon -->
                <svg v-else class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                </svg>
              </div>

              <!-- App Details -->
              <div>
                <h2 class="text-lg font-bold text-[hsl(220,20%,20%)] tracking-tight leading-tight">
                  {{ analysisStore.currentAnalysis.appName || analysisStore.currentAnalysis.bundleId || 'Unknown App' }}
                </h2>
                <div class="flex items-center gap-3 mt-0.5">
                  <span class="text-xs font-medium text-[hsl(220,10%,50%)]">
                    {{ analysisStore.currentAnalysis.bundleId }}
                  </span>
                  <span class="text-[hsl(220,10%,75%)]">·</span>
                  <span class="text-xs font-semibold text-[hsl(220,15%,40%)]">
                    v{{ analysisStore.currentAnalysis.version || '?' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Navigation Tabs + Size Badge -->
            <div class="flex items-center gap-6">
              <nav class="flex items-center gap-1">
                <button
                  @click="handleNavClick('breakdown')"
                  :class="[
                    'nav-btn nav-btn-underline px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                    uiStore.activeView === 'breakdown'
                      ? 'nav-btn-active bg-gradient-to-br from-[#0a89fc] to-[#0070d4] text-white shadow-md shadow-[#0a89fc]/25 active'
                      : 'nav-btn-glow bg-white text-[hsl(220,15%,35%)] hover:bg-[hsl(220,20%,92%)] hover:shadow-sm',
                  ]"
                >
                  Breakdown
                </button>
                <button
                  @click="handleNavClick('summary')"
                  :class="[
                    'nav-btn nav-btn-underline px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                    uiStore.activeView === 'summary'
                      ? 'nav-btn-active bg-gradient-to-br from-[#0a89fc] to-[#0070d4] text-white shadow-md shadow-[#0a89fc]/25 active'
                      : 'nav-btn-glow bg-white text-[hsl(220,15%,35%)] hover:bg-[hsl(220,20%,92%)] hover:shadow-sm',
                  ]"
                >
                  Summary
                </button>
                <button
                  @click="handleNavClick('xray')"
                  :class="[
                    'nav-btn nav-btn-underline px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                    uiStore.activeView === 'xray'
                      ? 'nav-btn-active bg-gradient-to-br from-[#0a89fc] to-[#0070d4] text-white shadow-md shadow-[#0a89fc]/25 active'
                      : 'nav-btn-glow bg-white text-[hsl(220,15%,35%)] hover:bg-[hsl(220,20%,92%)] hover:shadow-sm',
                  ]"
                >
                  X-Ray
                </button>
                <button
                  @click="handleNavClick('insights')"
                  :class="[
                    'nav-btn nav-btn-underline px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                    uiStore.activeView === 'insights'
                      ? 'nav-btn-active bg-gradient-to-br from-[#0a89fc] to-[#0070d4] text-white shadow-md shadow-[#0a89fc]/25 active'
                      : 'nav-btn-glow bg-white text-[hsl(220,15%,35%)] hover:bg-[hsl(220,20%,92%)] hover:shadow-sm',
                  ]"
                >
                  Insights
                </button>
              </nav>

              <!-- Size Badge -->
              <div class="text-right pl-6 border-l border-[hsl(220,20%,88%)]">
                <div class="text-xs font-medium text-[hsl(220,10%,50%)] uppercase tracking-wider">Total Install Size</div>
                <div class="text-xl font-bold text-[hsl(220,20%,20%)] tabular-nums">
                  {{ formatSize(analysisStore.currentAnalysis.totalInstallSize || analysisStore.currentAnalysis.parseResult?.totalSize || 0) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main :class="[
        'relative flex-1 w-full pb-20',
        uiStore.activeView === 'upload'
          ? 'flex flex-col items-center justify-center px-4 py-12'
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
      ]">
        <!-- Error Display -->
        <div
          v-if="appStore.error"
          class="mb-4 bg-[hsl(0,65%,50%)]/10 border border-[hsl(0,65%,50%)]/20 rounded-2xl p-4 max-w-2xl mx-auto"
        >
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-[hsl(0,65%,50%)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-sm text-[hsl(0,65%,40%)] font-medium">{{ appStore.error }}</p>
          </div>
        </div>

        <!-- Loading Spinner -->
        <LoadingSpinner
          v-if="appStore.isLoading"
          size="large"
          :message="appStore.loadingStatus"
          :progress="appStore.loadingProgress"
          :statusText="appStore.loadingStatusText"
        />

        <!-- Upload View - Clean centered layout -->
        <template v-else-if="uiStore.activeView === 'upload'">
          <div class="text-center mb-10 animate-grow">
            <!-- Logo mark -->
            <div class="logo-interactive w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0a89fc] to-[#0070d4] flex items-center justify-center shadow-lg shadow-[#0a89fc]/25 mx-auto mb-6 cursor-pointer hover:shadow-xl hover:shadow-[#0a89fc]/30 transition-shadow duration-300">
              <svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 class="text-4xl sm:text-5xl font-bold text-[hsl(25,20%,18%)] tracking-tight mb-4">
              App Size Analyzer
            </h1>
            <p class="text-lg text-[hsl(25,15%,45%)] max-w-xl mx-auto">
              App Size analysis for iOS/Android apps
            </p>
          </div>

          <!-- Upload Zone -->
          <div class="w-full animate-grow" style="animation-delay: 0.1s">
            <UploadZone
              :on-file-select="handleFileSelect"
              @file-selected="handleFileSelect"
              @validation-error="handleValidationError"
              :accepted-formats="['.ipa', '.apk', '.aab', '.xapk']"
              :max-size="2 * 1024 * 1024 * 1024"
            />

            <FileValidator
              v-if="validationErrors.length > 0"
              :errors="validationErrors"
              @dismiss="validationErrors = []"
            />
          </div>

          <!-- Sample File Gallery -->
          <div class="mt-12 w-full max-w-3xl animate-grow" style="animation-delay: 0.3s">
            <h2 class="text-center text-sm font-medium text-[hsl(25,15%,45%)] mb-4">
              Or try with a sample file
            </h2>
            <SampleFileGallery
              ref="sampleGalleryRef"
              :disabled="appStore.isLoading"
              @file-selected="handleSampleFileLoaded"
              @loading-error="handleSampleLoadError"
            />
          </div>
        </template>

        <!-- Other Views - With container -->
        <div v-else class="bg-gradient-to-br from-white to-[hsl(45,40%,98%)] shadow-lg shadow-[hsl(25,40%,35%)]/5 rounded-3xl p-8 border border-[hsl(35,20%,85%)] animate-grow">
          <!-- Breakdown View -->
          <BreakdownView v-if="uiStore.activeView === 'breakdown'" />

          <!-- Summary View -->
          <SummaryView v-if="uiStore.activeView === 'summary'" />

          <!-- X-Ray View -->
          <XRayView v-if="uiStore.activeView === 'xray'" />

          <!-- Insights View -->
          <InsightsView v-if="uiStore.activeView === 'insights'" />
        </div>
      </main>

      <!-- Footer -->
      <footer class="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(35,20%,85%)] bg-gradient-to-b from-white/60 to-[hsl(35,35%,94%)]/60 backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-[hsl(25,20%,18%)]">App Size Analyzer by</span>
              <a href="https://luciq.ai/?ref=appsizeanalyzer.com" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition-opacity">
                <img
                  src="https://cdn.prod.website-files.com/6898c7bad2e3e342ea1c43bd/68a09b6734e6f04641e9adae_luciq-logo.svg"
                  alt="Luciq"
                  class="h-5"
                />
              </a>
            </div>
            <p class="text-xs text-[hsl(25,15%,45%)]">
              &copy; 2025 App Size Analyzer.
            </p>
          </div>
        </div>
      </footer>
    </div>
  </ErrorBoundary>
</template>

<script>
import { ref, watch } from 'vue';
import { useAppStore } from './stores/appStore';
import { useAnalysisStore } from './stores/analysisStore';
import { useUiStore } from './stores/uiStore';
import { useParserWorker } from './composables/useParserWorker';
import { buildBreakdownTree, validateTreeSize } from './lib/analysis/breakdown-generator';
import { getDefaultInsightEngine } from './lib/analysis';

// Import real components
import ErrorBoundary from './components/shared/ErrorBoundary.vue';
import LoadingSpinner from './components/shared/LoadingSpinner.vue';
import UploadZone from './components/upload/UploadZone.vue';
import FileValidator from './components/upload/FileValidator.vue';
import SampleFileGallery from './components/upload/SampleFileGallery.vue';
import BreakdownView from './components/breakdown/BreakdownView.vue';
import SummaryView from './components/summary/SummaryView.vue';
import XRayView from './components/xray/XRayView.vue';
import InsightsView from './components/insights/InsightsView.vue';

export default {
  name: 'App',

  components: {
    ErrorBoundary,
    LoadingSpinner,
    UploadZone,
    FileValidator,
    SampleFileGallery,
    BreakdownView,
    SummaryView,
    XRayView,
    InsightsView,
  },

  setup() {
    // Pinia stores
    const appStore = useAppStore();
    const analysisStore = useAnalysisStore();
    const uiStore = useUiStore();

    // Parser worker composable
    const { progress, status, state, error, statusMessage, parseFile } = useParserWorker();

    // Local state
    const selectedFile = ref(null);
    const validationErrors = ref([]);
    const sampleGalleryRef = ref(null);
    const currentStatusMessage = ref('');

    // Tab definitions with icons
    const tabs = [
      { id: 'breakdown', label: 'Breakdown', icon: 'IconBreakdown' },
      { id: 'summary', label: 'Summary', icon: 'IconSummary' },
      { id: 'xray', label: 'X-Ray', icon: 'IconXray' },
      { id: 'insights', label: 'Insights', icon: 'IconInsights' },
    ];

    // Format file size
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Watch parser progress and update app store
    watch(progress, (value) => {
      appStore.updateParsingStatus({
        state: state.value,
        progress: value,
        message: status.value,
      });
      // Also update the loading progress in app store
      if (state.value === 'parsing') {
        appStore.setLoading(true, value, statusMessage.value || 'Analyzing...');
      }
    });

    // Watch status message changes
    watch(statusMessage, (value) => {
      currentStatusMessage.value = value;
      if (state.value === 'parsing') {
        appStore.setLoading(true, progress.value, value);
      }
    });

    // Watch parser state for loading indicator
    watch(state, (value) => {
      if (value === 'parsing') {
        appStore.setLoading(true, progress.value, statusMessage.value || 'Starting...');
      } else if (value === 'success' || value === 'error') {
        appStore.setLoading(false);
      }
    });

    // Watch parser errors
    watch(error, (err) => {
      if (err) {
        appStore.setParsingError(err.message);
      }
    });

    // Handle file selection (for regular file uploads)
    const handleFileSelect = async (file) => {
      // Cancel any in-progress sample file load
      if (sampleGalleryRef.value) {
        sampleGalleryRef.value.cancelCurrentLoad();
      }

      selectedFile.value = file;
      validationErrors.value = [];
      appStore.setCurrentFile(file);
      appStore.setError(null);

      // Determine platform from file extension
      const extension = '.' + file.name.toLowerCase().split('.').pop();
      let platform;
      if (extension === '.ipa') {
        platform = 'iOS';
      } else if (['.apk', '.aab', '.xapk'].includes(extension)) {
        platform = 'Android';
      } else if (extension === '.zip') {
        // ZIP files are assumed to be framework bundles (validated by parser)
        platform = 'iOS';
      } else {
        appStore.setError(`Unsupported file format: ${extension}`);
        return;
      }

      // Start analysis
      await analyzeFile(file, platform);
    };

    // Handle sample file loaded (for prebuilt JSON files)
    const handleSampleFileLoaded = async (parseResult) => {
      try {
        appStore.setLoading(true, 50, 'Processing sample file...');
        appStore.setError(null);

        // Determine platform from parseResult.format
        let platform;
        if (parseResult.format === 'ipa') {
          platform = 'iOS';
        } else if (['apk', 'aab', 'xapk'].includes(parseResult.format)) {
          platform = 'Android';
        } else {
          appStore.setError(`Unsupported format: ${parseResult.format}`);
          return;
        }

        // Reconstruct file entries from parseResult
        appStore.setLoading(true, 60, 'Building breakdown tree...');
        const fileEntries = [];

        // Helper function to detect content type from path
        const detectContentType = (path) => {
          const ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
          if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
          if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'font';
          if (['json', 'xml', 'plist'].includes(ext)) return 'config';
          if (['js', 'css', 'html'].includes(ext)) return 'web';
          if (['dex', 'so', 'dylib', 'a'].includes(ext)) return 'code';
          return 'other';
        };

        // Android formats
        if (['apk', 'aab', 'xapk'].includes(parseResult.format)) {
          // AAB format has a direct files array
          if (parseResult.format === 'aab' && parseResult.files && parseResult.files.length > 0) {
            parseResult.files.forEach(file => {
              fileEntries.push({
                path: file.path,
                installSize: file.compressedSize || file.size,
                uncompressedSize: file.size,
                type: file.contentType || detectContentType(file.path),
                metadata: {},
              });
            });
          } else {
            // APK/XAPK format uses separate arrays
            // Add assets
            if (parseResult.assets) {
              parseResult.assets.forEach(asset => {
                fileEntries.push({
                  path: asset.path,
                  installSize: asset.size,
                  uncompressedSize: asset.size,
                  type: detectContentType(asset.path),
                  metadata: {},
                });
              });
            }

            // Add resources
            if (parseResult.resources) {
              parseResult.resources.forEach(resource => {
                fileEntries.push({
                  path: resource.path,
                  installSize: resource.size,
                  uncompressedSize: resource.size,
                  type: 'resource',
                  metadata: {},
                });
              });
            }

            // Add DEX files
            if (parseResult.dexFiles) {
              parseResult.dexFiles.forEach((dex, index) => {
                fileEntries.push({
                  path: `classes${index > 0 ? index + 1 : ''}.dex`,
                  installSize: dex.fileSize,
                  uncompressedSize: dex.fileSize,
                  type: 'code',
                  metadata: { methodCount: dex.methodCount, classCount: dex.classCount },
                });
              });
            }

            // Add native libraries
            if (parseResult.nativeLibs) {
              parseResult.nativeLibs.forEach(lib => {
                fileEntries.push({
                  path: lib.path,
                  installSize: lib.size,
                  uncompressedSize: lib.size,
                  type: 'code',
                  metadata: { architecture: lib.architecture },
                });
              });
            }
          }
        }
        // iOS formats
        else if (parseResult.format === 'ipa') {
          // Add assets from the IPA
          if (parseResult.assets) {
            parseResult.assets.forEach(asset => {
              fileEntries.push({
                path: asset.path,
                installSize: asset.size,
                uncompressedSize: asset.size,
                type: asset.type || detectContentType(asset.path),
                metadata: {
                  inCatalog: asset.inCatalog,
                  scale: asset.scale,
                },
              });
            });
          }

          // Add frameworks if they exist
          if (parseResult.frameworks && Array.isArray(parseResult.frameworks)) {
            parseResult.frameworks.forEach(fw => {
              if (fw.files) {
                fw.files.forEach(file => {
                  fileEntries.push({
                    path: file.path,
                    installSize: file.size,
                    uncompressedSize: file.size,
                    type: detectContentType(file.path),
                    metadata: { framework: fw.name },
                  });
                });
              }
            });
          }
        }

        const breakdownRoot = buildBreakdownTree(fileEntries);
        const isValid = validateTreeSize(breakdownRoot, parseResult.totalSize);

        if (!isValid) {
          console.warn('Tree size validation failed');
        }

        // Determine metadata based on platform and format
        let analysisData;

        if (parseResult.format === 'aab') {
          // AAB format
          analysisData = {
            fileId: `sample-${parseResult.metadata.packageName}-${Date.now()}`,
            timestamp: new Date(),
            platform: 'Android',
            parseResult,
            metadata: {
              platform: 'Android',
              bundleId: parseResult.metadata.packageName,
              version: parseResult.metadata.versionName,
            },
            appName: parseResult.metadata.packageName,
            bundleId: parseResult.metadata.packageName,
            version: parseResult.metadata.versionName,
            versionCode: parseResult.metadata.versionCode,
            totalInstallSize: parseResult.installSize,
            totalDownloadSize: parseResult.downloadSize,
            breakdownRoot,
            allFiles: fileEntries,
            frameworks: [],
            assets: parseResult.assets || [],
            localizations: [],
            executables: [],
            nativeLibraries: parseResult.nativeLibs || [],
            dexFiles: parseResult.dexFiles || [],
            modules: parseResult.modules || [],
            architectures: parseResult.architectures || [],
          };
        } else if (parseResult.format === 'ipa') {
          // IPA format
          analysisData = {
            fileId: `sample-${parseResult.metadata.bundleId}-${Date.now()}`,
            timestamp: new Date(),
            platform: 'iOS',
            parseResult,
            metadata: {
              platform: 'iOS',
              bundleId: parseResult.metadata.bundleId,
              version: parseResult.metadata.version,
            },
            appName: parseResult.metadata.displayName || parseResult.metadata.bundleId,
            bundleId: parseResult.metadata.bundleId,
            version: parseResult.metadata.version,
            totalInstallSize: parseResult.installSize,
            totalDownloadSize: parseResult.downloadSize,
            breakdownRoot,
            allFiles: fileEntries,
            frameworks: (parseResult.frameworks || []).map((fw) => fw.name || fw.path),
            assets: parseResult.assets || [],
            localizations: Array.isArray(parseResult.localizations) ? parseResult.localizations : [],
            executables: parseResult.mainExecutable ? [parseResult.mainExecutable] : [],
            nativeLibraries: [],
            dexFiles: [],
            modules: [],
            architectures: parseResult.architectures || [],
          };
        } else if (parseResult.format === 'apk') {
          // APK format
          analysisData = {
            fileId: `sample-${parseResult.metadata.packageName}-${Date.now()}`,
            timestamp: new Date(),
            platform: 'Android',
            parseResult,
            metadata: {
              platform: 'Android',
              bundleId: parseResult.metadata.packageName,
              version: parseResult.metadata.versionName,
            },
            appName: parseResult.metadata.packageName,
            bundleId: parseResult.metadata.packageName,
            version: parseResult.metadata.versionName,
            versionCode: parseResult.metadata.versionCode,
            totalInstallSize: parseResult.installSize,
            totalDownloadSize: parseResult.downloadSize,
            breakdownRoot,
            allFiles: fileEntries,
            frameworks: [],
            assets: parseResult.assets || [],
            localizations: [],
            executables: [],
            nativeLibraries: parseResult.nativeLibs || [],
            dexFiles: parseResult.dexFiles || [],
            modules: [],
            architectures: parseResult.architectures || [],
          };
        }

        appStore.setLoading(true, 90, 'Finalizing analysis...');

        // Store analysis
        analysisStore.setAnalysisResult(analysisData);

        // Switch to breakdown view (same as regular file upload)
        uiStore.setActiveView('breakdown');

        appStore.setLoading(false);
      } catch (error) {
        console.error('Error processing sample file:', error);
        appStore.setError(`Failed to process sample file: ${error.message}`);
        appStore.setLoading(false);
      }
    };

    // Handle validation errors
    const handleValidationError = (errors) => {
      validationErrors.value = errors;
    };

    // Handle sample file loading errors
    const handleSampleLoadError = (error) => {
      appStore.setError(`Failed to load sample file: ${error.message}`);
    };

    // Analyze file using composable
    const analyzeFile = async (file, platform) => {
      try {
        appStore.setLoading(true, 10, 'Starting analysis...');
        appStore.setError(null);

        // Parse file using useParserWorker composable
        const { parseResult, fileEntries } = await parseFile(file);

        appStore.setLoading(true, 60, 'Building breakdown tree...');

        const breakdownRoot = buildBreakdownTree(fileEntries);
        const isValid = validateTreeSize(breakdownRoot, parseResult.totalSize);

        if (!isValid) {
          console.warn('Tree size validation failed');
        }

        // Determine metadata based on platform and format
        let analysisData;

        // Check for new formats first
        if (parseResult.format === 'aab') {
          // AAB format
          analysisData = {
            fileId: `${file.name}-${Date.now()}`,
            timestamp: new Date(),
            platform: 'Android',
            parseResult,
            metadata: {
              platform: 'Android',
              bundleId: parseResult.metadata.packageName,
              version: parseResult.metadata.versionName,
            },
            appName: parseResult.metadata.packageName,
            bundleId: parseResult.metadata.packageName,
            version: parseResult.metadata.versionName,
            versionCode: parseResult.metadata.versionCode,
            totalInstallSize: parseResult.installSize,
            totalDownloadSize: parseResult.downloadSize,
            breakdownRoot,
            allFiles: fileEntries,
            frameworks: [],
            assets: [],
            localizations: [],
            executables: [],
            nativeLibraries: [],
            dexFiles: [],
            modules: parseResult.modules || [],
            architectures: parseResult.architectures || [],
          };
        } else if (parseResult.format === 'framework') {
          // Framework format
          analysisData = {
            fileId: `${file.name}-${Date.now()}`,
            timestamp: new Date(),
            platform: 'iOS',
            parseResult,
            metadata: {
              platform: 'iOS',
              bundleId: parseResult.metadata.bundleIdentifier,
              version: parseResult.metadata.version,
            },
            appName: parseResult.metadata.bundleName,
            bundleId: parseResult.metadata.bundleIdentifier,
            version: parseResult.metadata.version,
            buildVersion: parseResult.metadata.buildVersion,
            totalInstallSize: parseResult.installSize,
            totalDownloadSize: parseResult.downloadSize,
            breakdownRoot,
            allFiles: fileEntries,
            frameworks: [],
            assets: [],
            localizations: [],
            executables: [parseResult.metadata.bundleExecutable],
            nativeLibraries: [],
            dexFiles: [],
            modules: [],
            architectures: parseResult.architectures || [],
          };
        } else if (platform === 'iOS') {
          // IPA format
          analysisData = {
            fileId: `${file.name}-${Date.now()}`,
            timestamp: new Date(),
            platform,
            parseResult,
            metadata: {
              platform: 'iOS',
              bundleId: parseResult.metadata.bundleId,
              version: parseResult.metadata.version,
            },
            appName: parseResult.metadata.displayName,
            bundleId: parseResult.metadata.bundleId,
            version: parseResult.metadata.version,
            totalInstallSize: parseResult.installSize,
            totalDownloadSize: parseResult.downloadSize,
            breakdownRoot,
            allFiles: fileEntries,
            frameworks: parseResult.frameworks.map((fw) => fw.path),
            assets: parseResult.assets.map((asset) => asset.path),
            localizations: parseResult.localizations,
            executables: parseResult.mainExecutable ? [parseResult.metadata.displayName] : [],
            nativeLibraries: [],
            dexFiles: [],
            modules: [],
          };
        } else {
          // APK/XAPK format
          analysisData = {
            fileId: `${file.name}-${Date.now()}`,
            timestamp: new Date(),
            platform,
            parseResult,
            metadata: {
              platform: 'Android',
              bundleId: parseResult.metadata.packageName,
              version: parseResult.metadata.versionName,
            },
            appName: parseResult.metadata.applicationLabel || parseResult.metadata.packageName,
            bundleId: parseResult.metadata.packageName,
            version: parseResult.metadata.versionName,
            versionCode: parseResult.metadata.versionCode,
            totalInstallSize: parseResult.installSize,
            totalDownloadSize: parseResult.downloadSize,
            breakdownRoot,
            allFiles: fileEntries,
            frameworks: [],
            assets: parseResult.assets.map((asset) => asset.path),
            localizations: parseResult.resourceTable?.locales || [],
            executables: [],
            nativeLibraries: parseResult.nativeLibs.map((lib) => lib.path),
            dexFiles: parseResult.dexFiles.map((_, idx) => `classes${idx > 0 ? idx + 1 : ''}.dex`),
            modules: [],
            resourceTableLocales: parseResult.resourceTable?.locales || [],
          };
        }

        // Set analysis result in store
        analysisStore.setAnalysisResult(analysisData);
        analysisStore.calculateSummary();

        appStore.setLoading(true, 80, 'Generating insights...');

        // Generate insights
        const insightEngine = getDefaultInsightEngine();
        const insights = await insightEngine.executeAll(analysisData);
        analysisStore.setInsights(insights);

        appStore.setLoading(true, 100, 'Complete');
        uiStore.setActiveView('breakdown');
        appStore.setLoading(false);
      } catch (err) {
        let errorMessage = 'An unexpected error occurred during analysis';

        if (err instanceof Error) {
          errorMessage = err.message;

          if (errorMessage.includes('timeout') || errorMessage.includes('took too long')) {
            errorMessage += '\n\nTip: Large files may take longer to process.';
          } else if (errorMessage.includes('AndroidManifest.xml not found')) {
            errorMessage = 'Invalid APK file: Missing AndroidManifest.xml.';
          } else if (errorMessage.includes('Info.plist')) {
            errorMessage = 'Invalid IPA file: Missing Info.plist.';
          }
        }

        appStore.setError(errorMessage);
        appStore.setLoading(false);
        console.error('Analysis error:', err);
      }
    };

    // Handle new analysis
    const handleNewAnalysis = () => {
      uiStore.setActiveView('upload');
      analysisStore.clearAnalysis();
      appStore.clearCurrentFile();
      selectedFile.value = null;
    };

    // Handle navigation click with animation
    const handleNavClick = (view) => {
      // Only animate if switching to a different view
      if (uiStore.activeView !== view) {
        uiStore.setActiveView(view);
      }
    };

    return {
      appStore,
      analysisStore,
      uiStore,
      selectedFile,
      validationErrors,
      sampleGalleryRef,
      tabs,
      formatSize,
      handleFileSelect,
      handleSampleFileLoaded,
      handleValidationError,
      handleSampleLoadError,
      handleNewAnalysis,
      handleNavClick,
    };
  },
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
