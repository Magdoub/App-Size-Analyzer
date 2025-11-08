/**
 * Insight Filters Component
 *
 * Allows filtering insights by severity and category
 */

import type { InsightCategory, InsightSeverity } from '../../types/insights';

interface InsightFiltersProps {
  selectedSeverities: Set<InsightSeverity>;
  selectedCategories: Set<InsightCategory>;
  onSeverityToggle: (severity: InsightSeverity) => void;
  onCategoryToggle: (category: InsightCategory) => void;
}

export function InsightFilters({
  selectedSeverities,
  selectedCategories,
  onSeverityToggle,
  onCategoryToggle,
}: InsightFiltersProps) {
  const severities: InsightSeverity[] = ['critical', 'high', 'medium', 'low'];
  const categories: InsightCategory[] = [
    'duplicates',
    'optimization',
    'unused',
    'over-bundling',
    'compression',
    'architecture',
  ];

  const getSeverityColor = (severity: InsightSeverity): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getCategoryIcon = (category: InsightCategory): string => {
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
    }
  };

  return (
    <div className="space-y-4">
      {/* Severity Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Filter by Severity</h3>
        <div className="flex flex-wrap gap-2">
          {severities.map((severity) => (
            <button
              key={severity}
              onClick={() => onSeverityToggle(severity)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-all ${
                selectedSeverities.has(severity)
                  ? getSeverityColor(severity)
                  : 'bg-gray-100 text-gray-400 border-transparent'
              }`}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryToggle(category)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-all ${
                selectedCategories.has(category)
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-100 text-gray-400 border-transparent'
              }`}
            >
              <span>{getCategoryIcon(category)}</span>
              <span className="capitalize">{category.replace(/-/g, ' ')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
