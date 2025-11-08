/**
 * App - Root component with view routing
 */

import { useState, useEffect, useRef } from 'react';
import { wrap, type Remote } from 'comlink';
import { useAnalysisStore } from './store/analysis-store';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { UploadZone } from './components/upload/UploadZone';
import { FileValidator, type ValidationResult } from './components/upload/FileValidator';
import { BreakdownView } from './components/breakdown/BreakdownView';
import { XRayView } from './components/xray/XRayView';
import { InsightsView } from './components/insights/InsightsView';
import { buildBreakdownTree, validateTreeSize } from './lib/analysis/breakdown-generator';
import type { ParserWorkerAPI } from './workers/parser-worker';

function App() {
  const {
    currentView,
    isLoading,
    loadingStatus,
    loadingProgress,
    error,
    setCurrentAnalysis,
    setLoading,
    setError,
    setCurrentView,
  } = useAnalysisStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Initialize Web Worker for parsing (runs off main thread)
  const workerRef = useRef<Remote<ParserWorkerAPI> | null>(null);

  useEffect(() => {
    // Create and wrap worker with Comlink
    const worker = new Worker(
      new URL('./workers/parser-worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = wrap<ParserWorkerAPI>(worker);

    // Cleanup on unmount
    return () => {
      worker.terminate();
    };
  }, []);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  // Handle validation result
  const handleValidated = async (result: ValidationResult) => {
    if (!result.valid || !selectedFile) {
      setError(result.error || 'Validation failed');
      return;
    }

    // Start analysis
    await analyzeFile(selectedFile, result.platform!);
  };

  // Analyze the file with timeout protection
  const analyzeFile = async (file: File, platform: 'iOS' | 'Android') => {
    // Create timeout promise - dynamic timeout based on file size
    // Base: 30s + 5s per MB (e.g., 27MB = 30s + 135s = 165s = 2.75 minutes)
    const fileSizeMB = file.size / (1024 * 1024);
    const timeoutMs = Math.max(30000, 30000 + (fileSizeMB * 5000));

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Analysis timeout: File took too long to process (${Math.round(timeoutMs / 1000)}s limit). Try a smaller file or contact support.`));
      }, timeoutMs);
    });

    try {
      setLoading(true, 10, 'Starting analysis...');
      setError(null);

      // Ensure worker is ready
      if (!workerRef.current) {
        throw new Error('Parser worker not initialized');
      }

      if (platform === 'iOS') {
        setLoading(true, 20, 'Parsing iOS binary...');

        // Parse IPA with timeout (runs in Web Worker - doesn't block UI)
        // Worker handles ZIP extraction, parsing, and file entry generation
        const { parseResult: ipaResult, fileEntries } = await Promise.race([
          workerRef.current.parseIOS(file),
          timeoutPromise
        ]);

        setLoading(true, 60, 'Building breakdown tree...');

        // Build breakdown tree
        const breakdownRoot = buildBreakdownTree(fileEntries);

        // Validate tree
        const isValid = validateTreeSize(breakdownRoot, ipaResult.totalSize);
        if (!isValid) {
          console.warn('Tree size validation failed - size mismatch detected');
        }

        const appName = ipaResult.metadata.displayName;

        setCurrentAnalysis({
          fileId: `${file.name}-${Date.now()}`,
          timestamp: new Date(),
          platform,
          appName: ipaResult.metadata.displayName,
          bundleId: ipaResult.metadata.bundleId,
          version: ipaResult.metadata.version,
          totalInstallSize: ipaResult.installSize,
          totalDownloadSize: ipaResult.downloadSize,
          breakdownRoot,
          allFiles: fileEntries,
          // iOS-specific data (paths/IDs)
          frameworks: ipaResult.frameworks.map((fw) => fw.path),
          assets: ipaResult.assets.map((asset) => asset.path),
          localizations: ipaResult.localizations,
          executables: ipaResult.mainExecutable ? [appName] : [],
          nativeLibraries: [],
          dexFiles: [],
          modules: [],
        });
      } else {
        setLoading(true, 20, 'Parsing Android binary...');

        // Parse APK or XAPK with timeout (runs in Web Worker - doesn't block UI)
        // Worker handles ZIP extraction, parsing, and file entry generation
        const { parseResult: apkResult, fileEntries } = await Promise.race([
          workerRef.current.parseAndroid(file),
          timeoutPromise
        ]);

        setLoading(true, 60, 'Building breakdown tree...');

        // Build breakdown tree
        const breakdownRoot = buildBreakdownTree(fileEntries);

        // Validate tree
        const isValid = validateTreeSize(breakdownRoot, apkResult.totalSize);
        if (!isValid) {
          console.warn('Tree size validation failed - size mismatch detected');
        }

        setCurrentAnalysis({
          fileId: `${file.name}-${Date.now()}`,
          timestamp: new Date(),
          platform,
          appName: apkResult.metadata.applicationLabel || apkResult.metadata.packageName,
          bundleId: apkResult.metadata.packageName,
          version: apkResult.metadata.versionName,
          versionCode: apkResult.metadata.versionCode,
          totalInstallSize: apkResult.installSize,
          totalDownloadSize: apkResult.downloadSize,
          breakdownRoot,
          allFiles: fileEntries,
          // Android-specific data (paths/IDs)
          frameworks: [],
          assets: apkResult.assets.map((asset) => asset.path),
          localizations: [],
          executables: [],
          nativeLibraries: apkResult.nativeLibs.map((lib) => lib.path),
          dexFiles: apkResult.dexFiles.map((_, idx) => `classes${idx > 0 ? idx + 1 : ''}.dex`),
          modules: [],
        });
      }

      setLoading(true, 90, 'Finalizing analysis...');

      // Navigate to breakdown view
      setCurrentView('breakdown');

      setLoading(false, 100, 'Complete');
    } catch (err) {
      // Provide helpful error messages
      let errorMessage = 'An unexpected error occurred during analysis';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Add helpful hints for common errors
        if (errorMessage.includes('timeout')) {
          errorMessage += '\n\nTip: Large files may take longer to process. The app currently has a 30-second timeout.';
        } else if (errorMessage.includes('AndroidManifest.xml not found')) {
          errorMessage = 'Invalid APK file: Missing AndroidManifest.xml. The file may be corrupted.';
        } else if (errorMessage.includes('Info.plist')) {
          errorMessage = 'Invalid IPA file: Missing Info.plist. The file may be corrupted.';
        } else if (errorMessage.includes('No APK files found')) {
          errorMessage = 'Invalid XAPK file: No APK files found inside the container.';
        }
      }

      setError(errorMessage);
      setLoading(false);
      console.error('Analysis error:', err);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">App Size Analyzer</h1>
                <p className="text-sm text-gray-500">
                  Client-side binary analysis for iOS & Android
                </p>
              </div>

              {/* Navigation - only show when analysis is available */}
              {currentView !== 'upload' && (
                <nav className="flex gap-2">
                  <button
                    onClick={() => setCurrentView('breakdown')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'breakdown'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Breakdown
                  </button>
                  <button
                    onClick={() => setCurrentView('xray')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'xray'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    X-Ray
                  </button>
                  <button
                    onClick={() => setCurrentView('insights')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'insights'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Insights
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('upload');
                      setCurrentAnalysis(null);
                      setSelectedFile(null);
                    }}
                    className="ml-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    New Analysis
                  </button>
                </nav>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner size="lg" message={loadingStatus} progress={loadingProgress} />
          ) : (
            <div className="bg-white shadow rounded-lg p-8">
              {currentView === 'upload' && (
                <div>
                  <UploadZone
                    onFileSelect={handleFileSelect}
                    acceptedFormats={['.ipa', '.apk', '.aab', '.xapk']}
                    maxSizeMB={2000}
                  />

                  {selectedFile && (
                    <FileValidator
                      file={selectedFile}
                      onValidated={handleValidated}
                      maxSizeMB={2000}
                    />
                  )}
                </div>
              )}

              {currentView === 'breakdown' && <BreakdownView />}

              {currentView === 'xray' && <XRayView />}

              {currentView === 'insights' && <InsightsView />}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-8">
          <p className="text-center text-sm text-gray-500">
            Phase 5: User Story 3 (Automated Insights) - Complete | Phase 4: User Story 2 (X-Ray Treemap) - Complete | Phase 3: User Story 1 (Binary Upload & Breakdown) - Complete
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
