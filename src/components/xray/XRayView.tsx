/**
 * X-Ray View Container
 *
 * Main container for the treemap visualization view
 */

import { useState, useMemo } from 'react';
import { useAnalysisStore } from '../../store/analysis-store';
import { Treemap } from './Treemap';
import { CategoryFilter } from './CategoryFilter';
import { generateSubtreeData, filterByCategories, searchTree } from '../../lib/visualization/treemap-generator';

export function XRayView() {
  const {
    currentAnalysis,
    xrayZoomPath,
    xrayCategories,
    xraySearchQuery,
    setXRayZoom,
    setXRaySearch,
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
    let result = generateSubtreeData(filtered, xrayZoomPath, {
      maxDepth: 3,
      minSize: 100, // 100 bytes minimum (reduced from 1KB to show more detail)
    });

    console.log('[XRayView] Original treemap data:', result);
    console.log('[XRayView] Original data children:', result?.children?.length);

    // Skip root node if no zoom path (show direct children as top level)
    if (result && !xrayZoomPath && result.name === 'Root' && result.children && result.children.length > 0) {
      // Create new root from children
      result = {
        name: 'App Contents',
        value: result.value,
        path: '',
        type: 'bundle' as const,
        compressedSize: result.compressedSize,
        children: result.children,
      };
      console.log('[XRayView] Skipped root, showing direct children');
    }

    console.log('[XRayView] Final treemap data:', result);
    console.log('[XRayView] Final data children:', result?.children?.length);
    console.log('[XRayView] Children details:', result?.children?.map(c => ({ name: c.name, value: c.value, childrenCount: c.children?.length })));

    return result;
  }, [currentAnalysis, xrayCategories, xrayZoomPath]);

  // Search matches (highlight these paths in treemap)
  const searchMatches = useMemo(() => {
    if (!currentAnalysis || !xraySearchQuery) return [];
    return searchTree(currentAnalysis.breakdownRoot, xraySearchQuery);
  }, [currentAnalysis, xraySearchQuery]);

  // Handle drill-down (zoom into node)
  const handleNodeClick = (path: string) => {
    // Toggle zoom: if already zoomed to this path, zoom out
    if (xrayZoomPath === path) {
      setXRayZoom(null);
    } else {
      setXRayZoom(path);
    }
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
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setXRayZoom(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Root
            </button>
            {xrayZoomPath.split('/').map((segment, index, arr) => {
              const path = arr.slice(0, index + 1).join('/');
              const isLast = index === arr.length - 1;

              return (
                <div key={path} className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  {isLast ? (
                    <span className="text-gray-900 font-medium">{segment}</span>
                  ) : (
                    <button
                      onClick={() => setXRayZoom(path)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {segment}
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={handleZoomOut}
              className="ml-4 text-sm text-gray-600 hover:text-gray-900"
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
      <div className="p-4" style={{ height: '700px' }}>
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
