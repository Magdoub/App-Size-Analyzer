/**
 * UI Store - Pinia state management
 *
 * Manages UI state, filters, navigation, and user interactions
 */

import { defineStore } from 'pinia';

/**
 * @typedef {'upload'|'breakdown'|'xray'|'insights'} ViewType
 */

/**
 * @typedef {Object} BreakdownFilter
 * @property {string} [type] - Content type filter
 * @property {number} [minSize] - Minimum size filter
 * @property {number} [maxSize] - Maximum size filter
 */

export const useUiStore = defineStore('ui', {
  state: () => ({
    /** @type {ViewType} */
    activeView: 'upload',

    // Breakdown view state
    breakdown: {
      /** @type {Set<string>} */
      expandedNodes: new Set(),
      /** @type {string} */
      searchQuery: '',
      /** @type {BreakdownFilter} */
      filter: {},
      /** @type {'size'|'name'|'type'} */
      sortBy: 'size',
      /** @type {'asc'|'desc'} */
      sortOrder: 'desc',
      /** @type {number} */
      scrollPosition: 0,
    },

    // X-Ray (treemap) view state
    xray: {
      /** @type {string|null} */
      zoomPath: null,
      /** @type {Set<string>} */
      categories: new Set(),
      /** @type {string} */
      searchQuery: '',
      /** @type {number} */
      scrollPosition: 0,
      /** @type {string|null} */
      detailsPanelNodePath: null,
      /** @type {boolean} */
      isDetailsPanelOpen: false,
      /** @type {string[]} */
      searchMatches: [],
      /** @type {number} */
      currentSearchMatchIndex: 0,
      /** @type {string|null} */
      keyboardFocusedNodePath: null,
      /** @type {string[]} */
      navigationHistory: [],
      /** @type {string|null} */
      hoveredNodePath: null,
    },

    // Insights view state
    insights: {
      /** @type {Set<string>} */
      severityFilter: new Set(['critical', 'high', 'medium', 'low']),
      /** @type {Set<string>} */
      categoryFilter: new Set(),
      /** @type {string} */
      searchQuery: '',
      /** @type {boolean} */
      groupBySeverity: true,
      /** @type {number} */
      scrollPosition: 0,
    },
  }),

  getters: {
    /**
     * Check if a breakdown node is expanded
     * @returns {function(string): boolean}
     */
    isBreakdownNodeExpanded: (state) => (nodeId) => {
      return state.breakdown.expandedNodes.has(nodeId);
    },

    /**
     * Check if an X-Ray category is visible
     * @returns {function(string): boolean}
     */
    isXRayCategoryVisible: (state) => (category) => {
      return state.xray.categories.size === 0 || state.xray.categories.has(category);
    },

    /**
     * Check if an insight severity is filtered
     * @returns {function(string): boolean}
     */
    isInsightSeverityFiltered: (state) => (severity) => {
      return state.insights.severityFilter.has(severity);
    },

    /**
     * Check if an insight category is filtered
     * @returns {function(string): boolean}
     */
    isInsightCategoryFiltered: (state) => (category) => {
      return (
        state.insights.categoryFilter.size === 0 || state.insights.categoryFilter.has(category)
      );
    },

    /**
     * Get current search match
     * @returns {string|null}
     */
    currentSearchMatch: (state) => {
      if (state.xray.searchMatches.length === 0) return null;
      return state.xray.searchMatches[state.xray.currentSearchMatchIndex] || null;
    },
  },

  actions: {
    /**
     * Set active view
     * @param {ViewType} view - View to activate
     */
    setActiveView(view) {
      this.activeView = view;
    },

    // ========== Breakdown Actions ==========

    /**
     * Toggle breakdown node expansion
     * @param {string} nodeId - Node ID to toggle
     */
    toggleBreakdownNode(nodeId) {
      if (this.breakdown.expandedNodes.has(nodeId)) {
        this.breakdown.expandedNodes.delete(nodeId);
      } else {
        this.breakdown.expandedNodes.add(nodeId);
      }
    },

    /**
     * Set breakdown search query
     * @param {string} query - Search query
     */
    setBreakdownSearch(query) {
      this.breakdown.searchQuery = query;
    },

    /**
     * Set breakdown filter
     * @param {BreakdownFilter} filter - Filter settings
     */
    setBreakdownFilter(filter) {
      this.breakdown.filter = filter;
    },

    /**
     * Update breakdown sort
     * @param {'size'|'name'|'type'} column - Sort column
     * @param {'asc'|'desc'} direction - Sort direction
     */
    updateBreakdownSort(column, direction) {
      this.breakdown.sortBy = column;
      this.breakdown.sortOrder = direction;
    },

    /**
     * Clear breakdown filters
     */
    clearBreakdownFilters() {
      this.breakdown.searchQuery = '';
      this.breakdown.filter = {};
      this.breakdown.sortBy = 'size';
      this.breakdown.sortOrder = 'desc';
    },

    /**
     * Save breakdown scroll position
     * @param {number} position - Scroll position
     */
    saveBreakdownScrollPosition(position) {
      this.breakdown.scrollPosition = position;
    },

    // ========== X-Ray Actions ==========

    /**
     * Set X-Ray zoom path
     * @param {string|null} path - Path to zoom into
     */
    setXRayZoom(path) {
      this.xray.zoomPath = path;
    },

    /**
     * Navigate to path
     * @param {string[]} path - Path array
     */
    navigateToPath(path) {
      this.xray.zoomPath = path.join('/');
    },

    /**
     * Toggle X-Ray category filter
     * @param {string} category - Category to toggle
     */
    toggleXRayCategory(category) {
      if (this.xray.categories.has(category)) {
        this.xray.categories.delete(category);
      } else {
        this.xray.categories.add(category);
      }
    },

    /**
     * Set X-Ray categories
     * @param {Set<string>} categories - Set of categories to display
     */
    setXRayCategories(categories) {
      this.xray.categories = new Set(categories);
    },

    /**
     * Set X-Ray search query
     * @param {string} query - Search query
     */
    setXRaySearch(query) {
      this.xray.searchQuery = query;
    },

    /**
     * Set details panel node
     * @param {string|null} path - Node path to show in details panel
     */
    setDetailsPanel(path) {
      this.xray.detailsPanelNodePath = path;
      this.xray.isDetailsPanelOpen = path !== null;
    },

    /**
     * Close details panel
     */
    closeDetailsPanel() {
      this.xray.detailsPanelNodePath = null;
      this.xray.isDetailsPanelOpen = false;
    },

    /**
     * Set search matches
     * @param {string[]} matches - Array of matching paths
     */
    setSearchMatches(matches) {
      this.xray.searchMatches = matches;
      this.xray.currentSearchMatchIndex = matches.length > 0 ? 0 : -1;
    },

    /**
     * Navigate to next search match
     */
    navigateToNextMatch() {
      if (this.xray.searchMatches.length === 0) return;

      const nextIndex = (this.xray.currentSearchMatchIndex + 1) % this.xray.searchMatches.length;
      const nextPath = this.xray.searchMatches[nextIndex];
      if (!nextPath) return;

      // Extract parent path for zooming
      const parentPath = nextPath.includes('/')
        ? nextPath.substring(0, nextPath.lastIndexOf('/'))
        : null;

      this.xray.currentSearchMatchIndex = nextIndex;
      this.xray.zoomPath = parentPath;
    },

    /**
     * Navigate to previous search match
     */
    navigateToPreviousMatch() {
      if (this.xray.searchMatches.length === 0) return;

      const prevIndex =
        this.xray.currentSearchMatchIndex === 0
          ? this.xray.searchMatches.length - 1
          : this.xray.currentSearchMatchIndex - 1;
      const prevPath = this.xray.searchMatches[prevIndex];
      if (!prevPath) return;

      // Extract parent path for zooming
      const parentPath = prevPath.includes('/')
        ? prevPath.substring(0, prevPath.lastIndexOf('/'))
        : null;

      this.xray.currentSearchMatchIndex = prevIndex;
      this.xray.zoomPath = parentPath;
    },

    /**
     * Set keyboard focused node
     * @param {string|null} path - Node path
     */
    setKeyboardFocus(path) {
      this.xray.keyboardFocusedNodePath = path;
    },

    /**
     * Push to navigation history
     * @param {string} path - Path to add to history
     */
    pushNavigationHistory(path) {
      this.xray.navigationHistory.push(path);
    },

    /**
     * Pop from navigation history
     * @returns {string|null}
     */
    popNavigationHistory() {
      if (this.xray.navigationHistory.length === 0) return null;
      return this.xray.navigationHistory.pop() || null;
    },

    /**
     * Set hovered node
     * @param {string|null} path - Node path
     */
    setHoveredNode(path) {
      this.xray.hoveredNodePath = path;
    },

    /**
     * Save X-Ray scroll position
     * @param {number} position - Scroll position
     */
    saveXRayScrollPosition(position) {
      this.xray.scrollPosition = position;
    },

    // ========== Insights Actions ==========

    /**
     * Set insight filter
     * @param {string} severity - Severity level
     * @param {string} category - Category
     */
    setInsightFilter(severity, category) {
      if (severity) {
        this.insights.severityFilter.clear();
        this.insights.severityFilter.add(severity);
      }
      if (category) {
        this.insights.categoryFilter.clear();
        this.insights.categoryFilter.add(category);
      }
    },

    /**
     * Toggle insight severity filter
     * @param {string} severity - Severity level
     */
    toggleInsightSeverityFilter(severity) {
      if (this.insights.severityFilter.has(severity)) {
        this.insights.severityFilter.delete(severity);
      } else {
        this.insights.severityFilter.add(severity);
      }
    },

    /**
     * Toggle insight category filter
     * @param {string} category - Category
     */
    toggleInsightCategoryFilter(category) {
      if (this.insights.categoryFilter.has(category)) {
        this.insights.categoryFilter.delete(category);
      } else {
        this.insights.categoryFilter.add(category);
      }
    },

    /**
     * Set insights severity filter
     * @param {Set<string>} severities - Severity set
     */
    setInsightsSeverityFilter(severities) {
      this.insights.severityFilter = new Set(severities);
    },

    /**
     * Set insights category filter
     * @param {Set<string>} categories - Category set
     */
    setInsightsCategoryFilter(categories) {
      this.insights.categoryFilter = new Set(categories);
    },

    /**
     * Update search query
     * @param {string} query - Search query
     */
    updateSearchQuery(query) {
      this.insights.searchQuery = query;
    },

    /**
     * Set insights group by severity
     * @param {boolean} groupBySeverity - Group by severity flag
     */
    setInsightsGroupBySeverity(groupBySeverity) {
      this.insights.groupBySeverity = groupBySeverity;
    },

    /**
     * Save insights scroll position
     * @param {number} position - Scroll position
     */
    saveInsightsScrollPosition(position) {
      this.insights.scrollPosition = position;
    },

    // ========== Global Actions ==========

    /**
     * Save scroll position for current view
     * @param {ViewType} view - View name
     * @param {number} position - Scroll position
     */
    saveScrollPosition(view, position) {
      switch (view) {
        case 'breakdown':
          this.breakdown.scrollPosition = position;
          break;
        case 'xray':
          this.xray.scrollPosition = position;
          break;
        case 'insights':
          this.insights.scrollPosition = position;
          break;
      }
    },

    /**
     * Reset store to initial state
     */
    reset() {
      this.activeView = 'upload';
      this.breakdown = {
        expandedNodes: new Set(),
        searchQuery: '',
        filter: {},
        sortBy: 'size',
        sortOrder: 'desc',
        scrollPosition: 0,
      };
      this.xray = {
        zoomPath: null,
        categories: new Set(),
        searchQuery: '',
        scrollPosition: 0,
        detailsPanelNodePath: null,
        isDetailsPanelOpen: false,
        searchMatches: [],
        currentSearchMatchIndex: 0,
        keyboardFocusedNodePath: null,
        navigationHistory: [],
        hoveredNodePath: null,
      };
      this.insights = {
        severityFilter: new Set(['critical', 'high', 'medium', 'low']),
        categoryFilter: new Set(),
        searchQuery: '',
        groupBySeverity: true,
        scrollPosition: 0,
      };
    },
  },
});
