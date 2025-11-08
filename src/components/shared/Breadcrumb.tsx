/**
 * Breadcrumb Component
 *
 * Displays hierarchical navigation path with clickable segments
 * for navigating through the treemap hierarchy.
 */

import React from 'react';

export interface BreadcrumbSegment {
  label: string;
  path: string | null; // null for root
}

export interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  onSegmentClick: (path: string | null) => void;
  currentPath?: string | null;
  className?: string;
}

export function Breadcrumb({
  segments,
  onSegmentClick,
  currentPath,
  className = '',
}: BreadcrumbProps) {
  if (segments.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Hierarchy navigation"
      className={`flex items-center gap-2 text-sm ${className}`}
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const isActive = segment.path === currentPath;

        return (
          <React.Fragment key={segment.path || 'root'}>
            <button
              onClick={() => onSegmentClick(segment.path)}
              disabled={isLast}
              className={`
                px-2 py-1 rounded transition-colors
                ${
                  isLast
                    ? 'text-gray-900 font-medium cursor-default'
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }
                ${isActive ? 'font-semibold' : ''}
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
              aria-current={isLast ? 'page' : undefined}
            >
              {segment.label}
            </button>
            {!isLast && (
              <span className="text-gray-400" aria-hidden="true">
                /
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Helper function to generate breadcrumb segments from a path
 * @param path - Current path (e.g., "Frameworks/MyFramework.framework/Resources")
 * @param rootLabel - Label for the root segment (default: "All")
 * @returns Array of breadcrumb segments
 */
export function generateBreadcrumbSegments(
  path: string | null,
  rootLabel: string = 'All'
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [
    { label: rootLabel, path: null }, // Root
  ];

  if (!path) {
    return segments;
  }

  const parts = path.split('/').filter(Boolean);
  let accumulatedPath = '';

  parts.forEach((part, index) => {
    accumulatedPath += (index > 0 ? '/' : '') + part;
    segments.push({
      label: part,
      path: accumulatedPath,
    });
  });

  return segments;
}
