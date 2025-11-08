/**
 * X-Ray View Container
 *
 * Main container for the treemap visualization view
 */

import { useState, useMemo } from 'react';
import { useAnalysisStore } from '../../store/analysis-store';
import { Treemap } from './Treemap';
import { CategoryFilter } from './CategoryFilter';
import { Breadcrumb, generateBreadcrumbSegments } from '../shared/Breadcrumb';
import { generateSubtreeData, filterByCategories, searchTree } from '../../lib/visualization/treemap-generator';

export function XRayView() {
  const {
    currentAnalysis,
    xrayZoomPath,
    xrayCategories,
    xraySearchQuery,
    setXRayZoom,
    setXRaySearch,
    pushNavigationHistory,
  } = useAnalysisStore();

  const [colorScheme, setColorScheme] = useState<'size' | 'type'>('size');

  // Generate treemap data based on current filters
  const treemapData = useMemo(() => {
    if (!currentAnalysis) return null;

    // Apply category filter
    const filtered = filterByCategories(currentAnalysis.breakdownRoot, xrayCategories);

    // Debug logging
    console.log('[XRayView] Breakdown root:', currentAnalysis.breakdownRoot);
    console.log('[XRayView] Filtered data:', filtered);
    console.log('[XRayView] Categories:', Array.from(xrayCategories));
    console.log('[XRayView] Root children count:', filtered.children?.length);
    console.log('[XRayView] Root size:', filtered.size);

    // Generate treemap data (with optional zoom)
    const result = generateSubtreeData(filtered, xrayZoomPath, {
      maxDepth: 3,
      minSize: 100, // 100 bytes minimum (reduced from 1KB to show more detail)
    });

    console.log('[XRayView] Treemap data:', result);
    console.log('[XRayView] Children count:', result?.children?.length);

    return result;
  }, [currentAnalysis, xrayCategories, xrayZoomPath]);

  // Search matches (highlight these paths in treemap)
  const searchMatches = useMemo(() => {
    if (!currentAnalysis || !xraySearchQuery) return [];
    return searchTree(currentAnalysis.breakdownRoot, xraySearchQuery);
  }, [currentAnalysis, xraySearchQuery]);

  // Generate breadcrumb segments from current zoom path
  const breadcrumbSegments = useMemo(() => {
    return generateBreadcrumbSegments(xrayZoomPath, 'All');
  }, [xrayZoomPath]);

  // Handle drill-down (zoom into node)
  const handleNodeClick = (path: string) => {
    // Push current path to history before zooming
    if (xrayZoomPath) {
      pushNavigationHistory(xrayZoomPath);
    }

    // Zoom to new path
    setXRayZoom(path);
  };

  // Handle zoom out (breadcrumb navigation)
  const handleZoomOut = () => {
    if (!xrayZoomPath) return;

    // Find parent path
    const pathParts = xrayZoomPath.split('/');
    pathParts.pop();
    const parentPath = pathParts.join('/');

    setXRayZoom(parentPath || null);
  };

  if (!currentAnalysis) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No analysis data available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">X-Ray View</h2>
            <p className="text-sm text-gray-600">
              Interactive treemap visualization of app contents
            </p>
          </div>

          {/* Color scheme toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setColorScheme('size')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                colorScheme === 'size'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Color by Size
            </button>
            <button
              onClick={() => setColorScheme('type')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                colorScheme === 'type'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Color by Type
            </button>
          </div>
        </div>

        {/* Breadcrumb navigation */}
        {xrayZoomPath && (
          <div className="flex items-center gap-4">
            <Breadcrumb
              segments={breadcrumbSegments}
              onSegmentClick={setXRayZoom}
              currentPath={xrayZoomPath}
              className="flex-1"
            />
            <button
              onClick={handleZoomOut}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Search bar */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search files..."
            value={xraySearchQuery}
            onChange={(e) => setXRaySearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchMatches.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Found {searchMatches.length} matches
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <CategoryFilter />
      </div>

      {/* Treemap */}
      <div className="p-4 w-full" style={{ height: '700px' }}>
        {treemapData ? (
          <Treemap
            data={treemapData}
            totalSize={currentAnalysis.totalInstallSize}
            colorScheme={colorScheme}
            searchMatches={searchMatches}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">No data to display</div>
          </div>
        )}
      </div>
    </div>
  );
}
