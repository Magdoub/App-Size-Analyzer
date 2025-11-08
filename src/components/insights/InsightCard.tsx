/**
 * Insight Card Component
 *
 * Displays a single insight with details, affected items, and fix suggestions
 */

import { useState } from 'react';
import type { InsightResult } from '../../types/insights';
import { formatBytes } from '../../utils/formatters';

interface InsightCardProps {
  insight: InsightResult;
}

export function InsightCard({ insight }: InsightCardProps) {
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

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor(insight.severity)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{getCategoryIcon(insight.category)}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{insight.title}</h3>
            <p className="text-sm mt-1 opacity-90">{insight.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(
              insight.severity
            )}`}
          >
            {insight.severity.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Savings */}
      <div className="mt-3 flex items-center gap-4">
        <div>
          <div className="text-sm font-medium opacity-75">Potential Savings</div>
          <div className="text-xl font-bold">{formatBytes(insight.potentialSavings)}</div>
        </div>
        <div>
          <div className="text-sm font-medium opacity-75">Percentage of Total</div>
          <div className="text-xl font-bold">{insight.percentOfTotal.toFixed(2)}%</div>
        </div>
        {insight.affectedItems.length > 0 && (
          <div>
            <div className="text-sm font-medium opacity-75">Affected Files</div>
            <div className="text-xl font-bold">{insight.affectedItems.length}</div>
          </div>
        )}
      </div>

      {/* Fix Suggestion */}
      {insight.fixSuggestion && (
        <div className="mt-3 p-3 bg-white bg-opacity-60 rounded">
          <div className="text-sm font-medium mb-1">💡 Fix Suggestion</div>
          <p className="text-sm">{insight.fixSuggestion}</p>
        </div>
      )}

      {/* Affected Items (Expandable) */}
      {insight.affectedItems.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-75 transition-opacity"
          >
            <span>{isExpanded ? '▼' : '▶'}</span>
            <span>
              {isExpanded ? 'Hide' : 'Show'} Affected Files ({insight.affectedItems.length})
            </span>
          </button>

          {isExpanded && (
            <div className="mt-2 max-h-64 overflow-y-auto">
              <div className="space-y-2">
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
          )}
        </div>
      )}

      {/* Category Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs opacity-75">Category:</span>
        <span className="text-xs font-medium capitalize">
          {insight.category.replace(/-/g, ' ')}
        </span>
        <span className="text-xs opacity-75 ml-auto">Rule: {insight.ruleId}</span>
      </div>
    </div>
  );
}
