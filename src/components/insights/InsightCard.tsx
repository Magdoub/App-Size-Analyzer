/**
 * Insight Card Component
 *
 * Displays a single insight with details, affected items, and fix suggestions
 */

import { useState, memo } from 'react';
import type { InsightResult } from '../../types/insights';
import { formatBytes } from '../../utils/formatters';

interface InsightCardProps {
  insight: InsightResult;
}

export const InsightCard = memo(function InsightCard({ insight }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Severity colors
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityBadgeColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'duplicates':
        return '📋';
      case 'optimization':
        return '⚡';
      case 'unused':
        return '🗑️';
      case 'over-bundling':
        return '📦';
      case 'compression':
        return '🗜️';
      case 'architecture':
        return '🏗️';
      default:
        return '💡';
    }
  };

  // Visual weight differentiation for critical/high severity
  const getBorderClass = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'border-2'; // Thicker border for critical
      case 'high':
        return 'border shadow-md'; // Shadow for high
      default:
        return 'border';
    }
  };

  return (
    <div className={`${getBorderClass(insight.severity)} rounded-lg p-4 ${getSeverityColor(insight.severity)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{getCategoryIcon(insight.category)}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{insight.title}</h3>
              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                {insight.category.replace(/-/g, ' ')}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-90">{insight.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase ${getSeverityBadgeColor(
              insight.severity
            )} ${insight.severity === 'critical' || insight.severity === 'high' ? 'text-sm' : ''}`}
          >
            {insight.severity}
          </span>
        </div>
      </div>

      {/* Savings - Enhanced hero position */}
      <div className="mt-4 bg-white bg-opacity-30 rounded-lg p-3 border border-current border-opacity-20">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="text-xs font-medium opacity-75 uppercase tracking-wide">Potential Savings</div>
            <div className="text-3xl font-bold mt-1">{formatBytes(insight.potentialSavings)}</div>
          </div>
          <div className="border-l border-current border-opacity-20 pl-6">
            <div className="text-xs font-medium opacity-75">Percentage</div>
            <div className="text-2xl font-bold">{insight.percentOfTotal.toFixed(1)}%</div>
          </div>
          {insight.affectedItems.length > 0 && (
            <div className="border-l border-current border-opacity-20 pl-6">
              <div className="text-xs font-medium opacity-75">Files</div>
              <div className="text-2xl font-bold">{insight.affectedItems.length}</div>
            </div>
          )}
        </div>
      </div>

      {/* Fix Suggestion - Enhanced with left border */}
      {insight.fixSuggestion && (
        <div className="mt-4 p-3 bg-white bg-opacity-60 rounded border-l-4 border-green-500">
          <div className="flex items-center gap-2 text-sm font-semibold mb-1 text-green-800">
            <span>💡</span>
            <span>Fix Suggestion</span>
          </div>
          <p className="text-sm leading-relaxed">{insight.fixSuggestion}</p>
        </div>
      )}

      {/* Affected Items (Expandable) - Enhanced with animations and accessibility */}
      {insight.affectedItems.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-75 transition-opacity"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} ${insight.affectedItems.length} affected files`}
          >
            <span className="transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
            <span>
              {isExpanded ? 'Hide' : 'Show'} Affected Files ({insight.affectedItems.length})
            </span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {insight.affectedItems.map((item, index) => (
                <div
                  key={index}
                  className="p-2 bg-white bg-opacity-40 rounded text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate" title={item.path}>
                        {item.path}
                      </div>
                      <div className="text-xs opacity-75 mt-1">{item.reason}</div>
                    </div>
                    <div className="text-xs font-medium whitespace-nowrap">
                      {formatBytes(item.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metadata - Subtle rule ID */}
      <div className="mt-3 flex justify-end">
        <span className="text-xs opacity-50 font-mono">Rule: {insight.ruleId}</span>
      </div>
    </div>
  );
});
