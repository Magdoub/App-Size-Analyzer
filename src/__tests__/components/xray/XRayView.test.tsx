/**
 * Component and Integration Tests for XRayView
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { XRayView } from '../../../components/xray/XRayView';
import { useAnalysisStore } from '../../../store/analysis-store';
import type { AnalysisContext, BreakdownNode } from '../../../types/analysis';

// Mock the store
vi.mock('../../../store/analysis-store');

describe('XRayView Component', () => {
  const mockBreakdownRoot: BreakdownNode = {
    id: 'root',
    name: 'Root',
    path: 'root',
    size: 10000,
    type: 'bundle',
    children: [
      {
        id: 'frameworks',
        name: 'Frameworks',
        path: 'root/Frameworks',
        size: 6000,
        type: 'framework',
        children: [
          {
            id: 'framework1',
            name: 'MyFramework.framework',
            path: 'root/Frameworks/MyFramework.framework',
            size: 4000,
            type: 'framework',
            children: [],
          },
        ],
      },
      {
        id: 'resources',
        name: 'Resources',
        path: 'root/Resources',
        size: 4000,
        type: 'resource',
        children: [],
      },
    ],
  };

  const mockAnalysis: AnalysisContext = {
    fileId: 'test-file-id',
    timestamp: new Date(),
    platform: 'iOS',
    appName: 'TestApp',
    bundleId: 'com.test.app',
    version: '1.0.0',
    totalInstallSize: 10000,
    totalDownloadSize: 8000,
    breakdownRoot: mockBreakdownRoot,
    frameworks: ['frameworks'],
    assets: [],
    localizations: [],
    executables: [],
    nativeLibraries: [],
    dexFiles: [],
    modules: [],
    allFiles: [],
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Zoom State Management', () => {
    it('should display root view when no zoom path is set', () => {
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: null,
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom: vi.fn(),
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      expect(screen.getByText('X-Ray View')).toBeInTheDocument();
      // Root breadcrumb should not be visible when at root
      expect(screen.queryByText('Root')).not.toBeInTheDocument();
    });

    it('should display breadcrumb when zoomed into a path', () => {
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: 'root/Frameworks',
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom: vi.fn(),
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      expect(screen.getByText('Root')).toBeInTheDocument();
      expect(screen.getByText('Frameworks')).toBeInTheDocument();
    });

    it('should call setXRayZoom when breadcrumb segment is clicked', () => {
      const setXRayZoom = vi.fn();
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: 'root/Frameworks/MyFramework.framework',
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom,
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      const rootButton = screen.getByText('Root');
      fireEvent.click(rootButton);

      expect(setXRayZoom).toHaveBeenCalledWith(null);
    });

    it('should zoom out one level when Back button is clicked', () => {
      const setXRayZoom = vi.fn();
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: 'root/Frameworks/MyFramework.framework',
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom,
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      const backButton = screen.getByText('← Back');
      fireEvent.click(backButton);

      expect(setXRayZoom).toHaveBeenCalledWith('root/Frameworks');
    });
  });

  describe('Search Functionality', () => {
    it('should display search input', () => {
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: null,
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom: vi.fn(),
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      const searchInput = screen.getByPlaceholderText('Search files...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should call setXRaySearch when search input changes', () => {
      const setXRaySearch = vi.fn();
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: null,
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom: vi.fn(),
        setXRaySearch,
      });

      render(<XRayView />);

      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'framework' } });

      expect(setXRaySearch).toHaveBeenCalledWith('framework');
    });

    it('should display match count when search has results', () => {
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: null,
        xrayCategories: new Set(),
        xraySearchQuery: 'framework',
        setXRayZoom: vi.fn(),
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      // searchTree will find matches in mockBreakdownRoot
      // The exact count depends on the mock data
      expect(screen.getByText(/Found \d+ matches/)).toBeInTheDocument();
    });
  });

  describe('Color Scheme Toggle', () => {
    it('should render color scheme toggle buttons', () => {
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: null,
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom: vi.fn(),
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      expect(screen.getByText('Color by Size')).toBeInTheDocument();
      expect(screen.getByText('Color by Type')).toBeInTheDocument();
    });

    it('should toggle color scheme when buttons are clicked', () => {
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: mockAnalysis,
        xrayZoomPath: null,
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom: vi.fn(),
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      const typeModeButton = screen.getByText('Color by Type');
      fireEvent.click(typeModeButton);

      // Verify button gets active state (bg-blue-600)
      expect(typeModeButton.className).toContain('bg-blue-600');
    });
  });

  describe('No Analysis State', () => {
    it('should display message when no analysis data is available', () => {
      (useAnalysisStore as any).mockReturnValue({
        currentAnalysis: null,
        xrayZoomPath: null,
        xrayCategories: new Set(),
        xraySearchQuery: '',
        setXRayZoom: vi.fn(),
        setXRaySearch: vi.fn(),
      });

      render(<XRayView />);

      expect(screen.getByText('No analysis data available')).toBeInTheDocument();
    });
  });
});
