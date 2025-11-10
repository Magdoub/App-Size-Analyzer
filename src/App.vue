<template>
  <ErrorBoundary>
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">App Size Analyzer</h1>
              <p class="text-sm text-gray-500">
                Client-side binary analysis for iOS & Android
              </p>
            </div>

            <!-- Navigation - only show when analysis is available -->
            <nav v-if="uiStore.activeView !== 'upload'" class="flex gap-2">
              <button
                @click="uiStore.setActiveView('breakdown')"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  uiStore.activeView === 'breakdown'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ]"
              >
                Breakdown
              </button>
              <button
                @click="uiStore.setActiveView('xray')"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  uiStore.activeView === 'xray'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ]"
              >
                X-Ray
              </button>
              <button
                @click="uiStore.setActiveView('insights')"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  uiStore.activeView === 'insights'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ]"
              >
                Insights
              </button>
              <button
                @click="handleNewAnalysis"
                class="ml-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                New Analysis
              </button>
            </nav>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Error Display -->
        <div
          v-if="appStore.error"
          class="mb-4 bg-red-50 border border-red-200 rounded-md p-4"
        >
          <p class="text-sm text-red-800">{{ appStore.error }}</p>
        </div>

        <!-- Loading Spinner -->
        <LoadingSpinner
          v-if="appStore.isLoading"
          size="lg"
          :message="appStore.loadingStatus"
          :progress="appStore.loadingProgress"
        />

        <!-- Content Views -->
        <div v-else class="bg-white shadow rounded-lg p-8">
          <!-- Upload View -->
          <div v-if="uiStore.activeView === 'upload'">
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

          <!-- Breakdown View -->
          <BreakdownView v-if="uiStore.activeView === 'breakdown'" />

          <!-- X-Ray View -->
          <XRayView v-if="uiStore.activeView === 'xray'" />

          <!-- Insights View -->
          <InsightsView v-if="uiStore.activeView === 'insights'" />
        </div>
      </main>

      <!-- Footer -->
      <footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-8">
        <p class="text-center text-sm text-gray-500">
          Vue.js Migration - 35/96 tasks complete (36%) | All core components ready ✓ | Ready for testing
        </p>
      </footer>
    </div>
  </ErrorBoundary>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { wrap } from 'comlink';
import { useAppStore } from './stores/appStore';
import { useAnalysisStore } from './stores/analysisStore';
import { useUiStore } from './stores/uiStore';
import { buildBreakdownTree, validateTreeSize } from './lib/analysis/breakdown-generator';

// Import real components
import ErrorBoundary from './components/shared/ErrorBoundary.vue';
import LoadingSpinner from './components/shared/LoadingSpinner.vue';
import UploadZone from './components/upload/UploadZone.vue';
import FileValidator from './components/upload/FileValidator.vue';
import BreakdownView from './components/breakdown/BreakdownView.vue';
import XRayView from './components/xray/XRayView.vue';
import InsightsView from './components/insights/InsightsView.vue';

export default {
  name: 'App',

  components: {
    ErrorBoundary,
    LoadingSpinner,
    UploadZone,
    FileValidator,
    BreakdownView,
    XRayView,
    InsightsView,
  },

  setup() {
    // Pinia stores
    const appStore = useAppStore();
    const analysisStore = useAnalysisStore();
    const uiStore = useUiStore();

    // Local state
    const selectedFile = ref(null);
    const workerRef = ref(null);
    const validationErrors = ref([]);

    // Initialize Web Worker and restore UI state
    onMounted(() => {
      const worker = new Worker(
        new URL('./workers/parser-worker.js', import.meta.url),
        { type: 'module' }
      );
      workerRef.value = wrap(worker);

      // Restore saved color mode from sessionStorage
      uiStore.initializeColorMode();
    });

    // Cleanup worker
    onUnmounted(() => {
      if (workerRef.value) {
        workerRef.value[Symbol.for('comlink.releaseProxy')]();
      }
    });

    // Handle file selection
    const handleFileSelect = async (file) => {
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
      } else {
        appStore.setError(`Unsupported file format: ${extension}`);
        return;
      }

      // Start analysis
      await analyzeFile(file, platform);
    };

    // Handle validation errors
    const handleValidationError = (errors) => {
      validationErrors.value = errors;
    };

    // Analyze file
    const analyzeFile = async (file, platform) => {
      const fileSizeMB = file.size / (1024 * 1024);
      const timeoutMs = Math.max(30000, 30000 + fileSizeMB * 5000);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Analysis timeout: File took too long to process (${Math.round(
                timeoutMs / 1000
              )}s limit). Try a smaller file.`
            )
          );
        }, timeoutMs);
      });

      try {
        appStore.setLoading(true, 10, 'Starting analysis...');
        appStore.setError(null);

        if (!workerRef.value) {
          throw new Error('Parser worker not initialized');
        }

        if (platform === 'iOS') {
          appStore.setLoading(true, 20, 'Parsing iOS binary...');

          const { parseResult, fileEntries } = await Promise.race([
            workerRef.value.parseIOS(file),
            timeoutPromise,
          ]);

          appStore.setLoading(true, 60, 'Building breakdown tree...');

          const breakdownRoot = buildBreakdownTree(fileEntries);
          const isValid = validateTreeSize(breakdownRoot, parseResult.totalSize);

          if (!isValid) {
            console.warn('Tree size validation failed');
          }

          analysisStore.setAnalysisResult({
            fileId: `${file.name}-${Date.now()}`,
            timestamp: new Date(),
            platform,
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
          });
        } else {
          appStore.setLoading(true, 20, 'Parsing Android binary...');

          const { parseResult, fileEntries } = await Promise.race([
            workerRef.value.parseAndroid(file),
            timeoutPromise,
          ]);

          appStore.setLoading(true, 60, 'Building breakdown tree...');

          const breakdownRoot = buildBreakdownTree(fileEntries);
          const isValid = validateTreeSize(breakdownRoot, parseResult.totalSize);

          if (!isValid) {
            console.warn('Tree size validation failed');
          }

          analysisStore.setAnalysisResult({
            fileId: `${file.name}-${Date.now()}`,
            timestamp: new Date(),
            platform,
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
            localizations: [],
            executables: [],
            nativeLibraries: parseResult.nativeLibs.map((lib) => lib.path),
            dexFiles: parseResult.dexFiles.map((_, idx) => `classes${idx > 0 ? idx + 1 : ''}.dex`),
            modules: [],
          });
        }

        appStore.setLoading(true, 90, 'Finalizing analysis...');
        uiStore.setActiveView('breakdown');
        appStore.setLoading(false, 100, 'Complete');
      } catch (err) {
        let errorMessage = 'An unexpected error occurred during analysis';

        if (err instanceof Error) {
          errorMessage = err.message;

          if (errorMessage.includes('timeout')) {
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

    return {
      appStore,
      analysisStore,
      uiStore,
      selectedFile,
      validationErrors,
      handleFileSelect,
      handleValidationError,
      handleNewAnalysis,
    };
  },
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
