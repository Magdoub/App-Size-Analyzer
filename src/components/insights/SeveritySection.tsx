/**
 * Severity Section Component
 *
 * Renders a group of insights under a severity level header
 */

import type { InsightResult, InsightSeverity } from '../../types/insights';
import { InsightCard } from './InsightCard';

interface SeveritySectionProps {
  severity: InsightSeverity;
  insights: InsightResult[];
}

export function SeveritySection({ severity, insights }: SeveritySectionProps) {
  if (insights.length === 0) return null;

  const getSeverityLabel = (severity: InsightSeverity): string => {
    switch (severity) {
      case 'critical':
        return '🔴 Critical Issues';
      case 'high':
        return '🟠 High Priority';
      case 'medium':
        return '🟡 Medium Priority';
      case 'low':
        return '🔵 Low Priority';
    }
  };

  const getSeverityHeaderColor = (severity: InsightSeverity): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-900';
    }
  };

  return (
    <div className="mb-6">
      {/* Sticky Section Header */}
      <div
        className={`sticky top-0 z-10 px-4 py-2 border-b-2 font-semibold text-sm flex items-center justify-between ${getSeverityHeaderColor(
          severity
        )}`}
      >
        <span>{getSeverityLabel(severity)}</span>
        <span className="text-xs opacity-75">({insights.length} insights)</span>
      </div>

      {/* Insights in this severity group */}
      <div className="space-y-4 mt-4">
        {insights.map((insight, index) => (
          <InsightCard key={`${insight.ruleId}-${index}`} insight={insight} />
        ))}
      </div>
    </div>
  );
}
