/**
 * Analysis Store - Zustand state management
 *
 * Manages global application state for binary analysis
 */

import { create } from 'zustand';
import type { AnalysisContext, ContentType } from '../types/analysis';
import type { InsightResult, InsightCategory, InsightSeverity } from '../types/insights';

export type ViewType = 'upload' | 'breakdown' | 'xray' | 'insights';

export interface BreakdownFilter {
  type?: ContentType;
  minSize?: number;
  maxSize?: number;
}

export interface AnalysisStore {
  // Current analysis
  currentAnalysis: AnalysisContext | null;

  // UI state
  isLoading: boolean;
  loadingProgress: number;           // 0-100
  loadingStatus: string;             // Current operation description
  error: string | null;
  currentView: ViewType;

  // Breakdown view state
  breakdownExpandedNodes: Set<string>;  // Node IDs
  breakdownSearchQuery: string;
  breakdownFilter: BreakdownFilter;
  breakdownSortBy: 'size' | 'name' | 'type';
  breakdownSortOrder: 'asc' | 'desc';

  // X-Ray view state
  xrayZoomPath: string | null;       // Current zoomed subtree path
  xrayCategories: Set<ContentType>;  // Visible categories
  xraySearchQuery: string;

  // X-Ray UX improvements - Details Panel
  detailsPanelNodePath: string | null;  // Path of node shown in details panel
  isDetailsPanelOpen: boolean;          // Panel visibility

  // X-Ray UX improvements - Search Navigation
  searchMatches: string[];              // Array of matching paths
  currentSearchMatchIndex: number;      // Current match index

  // X-Ray UX improvements - Keyboard Navigation
  keyboardFocusedNodePath: string | null; // Keyboard-focused node
  navigationHistory: string[];            // Zoom history stack

  // X-Ray UX improvements - Hover state
  hoveredNodePath: string | null;         // Currently hovered node

  // Insights view state
  insights: InsightResult[];
  insightsSeverityFilter: Set<InsightSeverity>;
  insightsCategoryFilter: Set<InsightCategory>;
  insightsGroupBySeverity: boolean;

  // Actions
  setCurrentAnalysis: (analysis: AnalysisContext | null) => void;
  setLoading: (isLoading: boolean, progress?: number, status?: string) => void;
  setError: (error: string | null) => void;
  setCurrentView: (view: ViewType) => void;

  // Breakdown actions
  toggleBreakdownNode: (nodeId: string) => void;
  setBreakdownSearch: (query: string) => void;
  setBreakdownFilter: (filter: BreakdownFilter) => void;
  setBreakdownSort: (sortBy: 'size' | 'name' | 'type', order: 'asc' | 'desc') => void;
  clearBreakdownFilters: () => void;

  // X-Ray actions
  setXRayZoom: (path: string | null) => void;
  toggleXRayCategory: (category: ContentType) => void;
  setXRaySearch: (query: string) => void;

  // X-Ray UX improvements - Details Panel actions
  setDetailsPanel: (path: string | null) => void;
  closeDetailsPanel: () => void;

  // X-Ray UX improvements - Search Navigation actions
  setSearchMatches: (matches: string[]) => void;
  navigateToNextMatch: () => void;
  navigateToPreviousMatch: () => void;

  // X-Ray UX improvements - Keyboard Navigation actions
  setKeyboardFocus: (path: string | null) => void;
  pushNavigationHistory: (path: string) => void;
  popNavigationHistory: () => string | null;

  // X-Ray UX improvements - Hover state actions
  setHoveredNode: (path: string | null) => void;

  // Insights actions
  setInsights: (insights: InsightResult[]) => void;
  setInsightsSeverityFilter: (severities: Set<InsightSeverity>) => void;
  setInsightsCategoryFilter: (categories: Set<InsightCategory>) => void;
  setInsightsGroupBySeverity: (groupBySeverity: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentAnalysis: null,
  isLoading: false,
  loadingProgress: 0,
  loadingStatus: '',
  error: null,
  currentView: 'upload' as ViewType,
  breakdownExpandedNodes: new Set<string>(),
  breakdownSearchQuery: '',
  breakdownFilter: {},
  breakdownSortBy: 'size' as const,
  breakdownSortOrder: 'desc' as const,
  xrayZoomPath: null,
  xrayCategories: new Set<ContentType>(),
  xraySearchQuery: '',
  detailsPanelNodePath: null,
  isDetailsPanelOpen: false,
  searchMatches: [],
  currentSearchMatchIndex: 0,
  keyboardFocusedNodePath: null,
  navigationHistory: [],
  hoveredNodePath: null,
  insights: [],
  insightsSeverityFilter: new Set<InsightSeverity>(['critical', 'high', 'medium', 'low']),
  insightsCategoryFilter: new Set<InsightCategory>(),
  insightsGroupBySeverity: true,
};

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  ...initialState,

  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

  setLoading: (isLoading, progress = 0, status = '') =>
    set({ isLoading, loadingProgress: progress, loadingStatus: status }),

  setError: (error) => set({ error }),

  setCurrentView: (view) => set({ currentView: view }),

  // Breakdown actions
  toggleBreakdownNode: (nodeId) =>
    set((state) => {
      const newExpanded = new Set(state.breakdownExpandedNodes);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return { breakdownExpandedNodes: newExpanded };
    }),

  setBreakdownSearch: (query) => set({ breakdownSearchQuery: query }),

  setBreakdownFilter: (filter) => set({ breakdownFilter: filter }),

  setBreakdownSort: (sortBy, order) =>
    set({ breakdownSortBy: sortBy, breakdownSortOrder: order }),

  clearBreakdownFilters: () =>
    set({
      breakdownSearchQuery: '',
      breakdownFilter: {},
      breakdownSortBy: 'size',
      breakdownSortOrder: 'desc',
    }),

  // X-Ray actions
  setXRayZoom: (path) => set({ xrayZoomPath: path }),

  toggleXRayCategory: (category) =>
    set((state) => {
      const newCategories = new Set(state.xrayCategories);
      if (newCategories.has(category)) {
        newCategories.delete(category);
      } else {
        newCategories.add(category);
      }
      return { xrayCategories: newCategories };
    }),

  setXRaySearch: (query) => set({ xraySearchQuery: query }),

  // X-Ray UX improvements - Details Panel actions
  setDetailsPanel: (path) =>
    set({
      detailsPanelNodePath: path,
      isDetailsPanelOpen: path !== null,
    }),

  closeDetailsPanel: () =>
    set({
      detailsPanelNodePath: null,
      isDetailsPanelOpen: false,
    }),

  // X-Ray UX improvements - Search Navigation actions
  setSearchMatches: (matches) =>
    set({
      searchMatches: matches,
      currentSearchMatchIndex: matches.length > 0 ? 0 : -1,
    }),

  navigateToNextMatch: () =>
    set((state) => {
      if (state.searchMatches.length === 0) return {};

      const nextIndex = (state.currentSearchMatchIndex + 1) % state.searchMatches.length;
      const nextPath = state.searchMatches[nextIndex];
      if (!nextPath) return {};

      // Extract parent path for zooming
      const parentPath = nextPath.includes('/')
        ? nextPath.substring(0, nextPath.lastIndexOf('/'))
        : null;

      return {
        currentSearchMatchIndex: nextIndex,
        xrayZoomPath: parentPath,
      };
    }),

  navigateToPreviousMatch: () =>
    set((state) => {
      if (state.searchMatches.length === 0) return {};

      const prevIndex =
        state.currentSearchMatchIndex === 0
          ? state.searchMatches.length - 1
          : state.currentSearchMatchIndex - 1;
      const prevPath = state.searchMatches[prevIndex];
      if (!prevPath) return {};

      // Extract parent path for zooming
      const parentPath = prevPath.includes('/')
        ? prevPath.substring(0, prevPath.lastIndexOf('/'))
        : null;

      return {
        currentSearchMatchIndex: prevIndex,
        xrayZoomPath: parentPath,
      };
    }),

  // X-Ray UX improvements - Keyboard Navigation actions
  setKeyboardFocus: (path) => set({ keyboardFocusedNodePath: path }),

  pushNavigationHistory: (path) =>
    set((state) => ({
      navigationHistory: [...state.navigationHistory, path],
    })),

  popNavigationHistory: () => {
    let poppedPath: string | null = null;
    set((state) => {
      if (state.navigationHistory.length === 0) return {};

      const newHistory = [...state.navigationHistory];
      const popped = newHistory.pop();
      poppedPath = popped || null;

      return { navigationHistory: newHistory };
    });
    return poppedPath;
  },

  // X-Ray UX improvements - Hover state actions
  setHoveredNode: (path) => set({ hoveredNodePath: path }),

  // Insights actions
  setInsights: (insights) => set({ insights }),

  setInsightsSeverityFilter: (severities) => set({ insightsSeverityFilter: severities }),

  setInsightsCategoryFilter: (categories) => set({ insightsCategoryFilter: categories }),

  setInsightsGroupBySeverity: (groupBySeverity) => set({ insightsGroupBySeverity: groupBySeverity }),

  // Reset
  reset: () => set(initialState),
}));
