/**
 * Category Filter Component
 *
 * Allows users to filter treemap by content type categories
 */

import { useAnalysisStore } from '../../store/analysis-store';
import { getTypeLegend } from '../../lib/visualization/color-scheme';

export function CategoryFilter() {
  const { xrayCategories, toggleXRayCategory } = useAnalysisStore();
  const typeLegend = getTypeLegend();

  // DEBUG: Log category state on every render
  console.log('[CategoryFilter] Current categories:', Array.from(xrayCategories), 'Size:', xrayCategories.size);

  const handleToggleAll = () => {
    // If all selected, clear all. Otherwise, select all.
    if (xrayCategories.size === typeLegend.length) {
      // Clear all
      typeLegend.forEach((entry) => {
        if (xrayCategories.has(entry.type)) {
          toggleXRayCategory(entry.type);
        }
      });
    } else {
      // Select all
      typeLegend.forEach((entry) => {
        if (!xrayCategories.has(entry.type)) {
          toggleXRayCategory(entry.type);
        }
      });
    }
  };

  const allSelected = xrayCategories.size === 0 || xrayCategories.size === typeLegend.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Filter by Content Type</h3>
        <button
          onClick={handleToggleAll}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {allSelected ? 'Clear All' : 'Select All'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {typeLegend.map((entry) => {
          const isActive = xrayCategories.size === 0 || xrayCategories.has(entry.type);

          return (
            <button
              key={entry.type}
              onClick={() => {
                console.log('[CategoryFilter] Before toggle:', entry.type, 'Categories:', Array.from(xrayCategories));
                toggleXRayCategory(entry.type);
                // Log after will happen in next render
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white border-2 border-gray-300 text-gray-900'
                  : 'bg-gray-100 border-2 border-transparent text-gray-400'
              }`}
            >
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.label}</span>
            </button>
          );
        })}
      </div>

      {xrayCategories.size > 0 && xrayCategories.size < typeLegend.length && (
        <div className="mt-3 text-sm text-gray-600">
          Showing {xrayCategories.size} of {typeLegend.length} categories
        </div>
      )}
    </div>
  );
}
