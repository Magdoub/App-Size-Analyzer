/**
 * Breakdown View Container
 *
 * Main container for the hierarchical breakdown view
 */

import { useState } from 'react';
import { useAnalysisStore } from '../../store/analysis-store';
import { BreakdownTable } from './BreakdownTable';
import { BreakdownTabs } from './BreakdownTabs';
import { formatBytes } from '../../utils/formatters';

export function BreakdownView() {
  const { currentAnalysis } = useAnalysisStore();
  const [activeTab, setActiveTab] = useState<'all' | 'frameworks' | 'assets' | 'localizations'>(
    'all'
  );

  if (!currentAnalysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analysis available</p>
      </div>
    );
  }

  const { breakdownRoot, totalInstallSize, platform } = currentAnalysis;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Size Breakdown</h1>
        <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
          <div>
            <span className="font-medium">Platform:</span> {platform}
          </div>
          <div>
            <span className="font-medium">Total Size:</span> {formatBytes(totalInstallSize)}
          </div>
          <div>
            <span className="font-medium">App:</span> {currentAnalysis.appName}
          </div>
          <div>
            <span className="font-medium">Version:</span> {currentAnalysis.version}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <BreakdownTabs activeTab={activeTab} onTabChange={setActiveTab} platform={platform} />

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <BreakdownTable
          breakdownRoot={breakdownRoot}
          totalSize={totalInstallSize}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}
