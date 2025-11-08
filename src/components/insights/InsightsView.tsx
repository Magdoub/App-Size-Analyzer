/**
 * Insights View Container
 *
 * Main container for the insights/recommendations view
 */

import { useState, useEffect, useMemo } from 'react';
import { useAnalysisStore } from '../../store/analysis-store';
import { InsightCard } from './InsightCard';
import { InsightFilters } from './InsightFilters';
import { getDefaultInsightEngine } from '../../lib/analysis';
import { formatBytes } from '../../utils/formatters';
import type { InsightCategory, InsightSeverity } from '../../types/insights';

export function InsightsView() {
  const {
    currentAnalysis,
    insights,
    insightsSeverityFilter,
    insightsCategoryFilter,
    setInsights,
    setInsightsSeverityFilter,
    setInsightsCategoryFilter,
  } = useAnalysisStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run insights analysis when view loads
  useEffect(() => {
    if (!currentAnalysis) return;

    // Check if insights are already computed
    if (insights.length > 0) {
      console.log('[InsightsView] Using cached insights');
      return;
    }

    // Run insights analysis
    const runAnalysis = async () => {
      setIsAnalyzing(true);
      setError(null);

      try {
        console.log('[InsightsView] Running insights analysis...');
        const engine = getDefaultInsightEngine();
        const results = await engine.executeAll(currentAnalysis);

        console.log(`[InsightsView] Found ${results.length} insights`);
        setInsights(results);
      } catch (err) {
        console.error('[InsightsView] Analysis failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, [currentAnalysis, insights.length, setInsights]);

  // Filter insights based on selected filters
  const filteredInsights = useMemo(() => {
    let filtered = insights;

    // Filter by severity
    if (insightsSeverityFilter.size > 0) {
      filtered = filtered.filter((insight) =>
        insightsSeverityFilter.has(insight.severity)
      );
    }

    // Filter by category
    if (insightsCategoryFilter.size > 0) {
      filtered = filtered.filter((insight) =>
        insightsCategoryFilter.has(insight.category)
      );
    }

    return filtered;
  }, [insights, insightsSeverityFilter, insightsCategoryFilter]);

  // Calculate total potential savings
  const totalSavings = useMemo(() => {
    return filteredInsights.reduce((sum, insight) => sum + insight.potentialSavings, 0);
  }, [filteredInsights]);

  const totalSavingsPercent = useMemo(() => {
    if (!currentAnalysis) return 0;
    return (totalSavings / currentAnalysis.totalInstallSize) * 100;
  }, [totalSavings, currentAnalysis]);

  // Handle filter toggles
  const handleSeverityToggle = (severity: InsightSeverity) => {
    const newFilter = new Set(insightsSeverityFilter);
    if (newFilter.has(severity)) {
      newFilter.delete(severity);
    } else {
      newFilter.add(severity);
    }
    setInsightsSeverityFilter(newFilter);
  };

  const handleCategoryToggle = (category: InsightCategory) => {
    const newFilter = new Set(insightsCategoryFilter);
    if (newFilter.has(category)) {
      newFilter.delete(category);
    } else {
      newFilter.add(category);
    }
    setInsightsCategoryFilter(newFilter);
  };

  // Loading state
  if (!currentAnalysis) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No analysis data available</div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <div className="text-gray-700 font-medium">Analyzing for optimization opportunities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Optimization Insights</h2>
            <p className="text-sm text-gray-600">
              Automated recommendations to reduce app size
            </p>
          </div>

          {/* Summary Stats */}
          {filteredInsights.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Potential Savings</div>
              <div className="text-3xl font-bold text-blue-900">{formatBytes(totalSavings)}</div>
              <div className="text-sm text-gray-600 mt-1">
                {totalSavingsPercent.toFixed(2)}% of total size
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <InsightFilters
          selectedSeverities={insightsSeverityFilter}
          selectedCategories={insightsCategoryFilter}
          onSeverityToggle={handleSeverityToggle}
          onCategoryToggle={handleCategoryToggle}
        />
      </div>

      {/* Insights List */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {insights.length === 0 ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Optimization Opportunities Found
                </h3>
                <p className="text-sm text-gray-600 max-w-md">
                  Your app is already well-optimized! No major issues detected by our analysis rules.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Insights Match Your Filters
                </h3>
                <p className="text-sm text-gray-600 max-w-md">
                  Try adjusting your severity or category filters to see more insights.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight, index) => (
              <InsightCard key={`${insight.ruleId}-${index}`} insight={insight} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredInsights.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Showing {filteredInsights.length} of {insights.length} insights
            </div>
            <div className="text-gray-600">
              {filteredInsights.filter((i) => i.severity === 'critical').length} critical ·{' '}
              {filteredInsights.filter((i) => i.severity === 'high').length} high ·{' '}
              {filteredInsights.filter((i) => i.severity === 'medium').length} medium ·{' '}
              {filteredInsights.filter((i) => i.severity === 'low').length} low
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
