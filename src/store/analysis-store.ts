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

  // Insights view state
  insights: InsightResult[];
  insightsSeverityFilter: Set<InsightSeverity>;
  insightsCategoryFilter: Set<InsightCategory>;

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

  // Insights actions
  setInsights: (insights: InsightResult[]) => void;
  setInsightsSeverityFilter: (severities: Set<InsightSeverity>) => void;
  setInsightsCategoryFilter: (categories: Set<InsightCategory>) => void;

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
  insights: [],
  insightsSeverityFilter: new Set<InsightSeverity>(['critical', 'high', 'medium', 'low']),
  insightsCategoryFilter: new Set<InsightCategory>(),
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

  // Insights actions
  setInsights: (insights) => set({ insights }),

  setInsightsSeverityFilter: (severities) => set({ insightsSeverityFilter: severities }),

  setInsightsCategoryFilter: (categories) => set({ insightsCategoryFilter: categories }),

  // Reset
  reset: () => set(initialState),
}));
