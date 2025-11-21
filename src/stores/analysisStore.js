/**
 * Analysis Store - Pinia state management
 *
 * Manages parsed binary data, analysis results, and insights
 */

import { defineStore } from 'pinia';

/**
 * @typedef {Object} AnalysisContext
 * @property {Object} metadata - App metadata
 * @property {Object} breakdownTree - File hierarchy tree
 * @property {Object} treemapData - Flattened treemap data
 * @property {Object} summary - Size summary statistics
 */

/**
 * @typedef {Object} InsightResult
 * @property {string} id - Unique insight ID
 * @property {'critical'|'high'|'medium'|'low'} severity - Severity level
 * @property {string} category - Insight category
 * @property {string} title - Short title
 * @property {string} description - Detailed explanation
 * @property {string[]} affectedFiles - Affected file paths
 * @property {string} recommendation - Actionable advice
 * @property {number|null} potentialSavings - Potential savings in bytes
 */

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    /** @type {AnalysisContext|null} */
    currentAnalysis: null,

    /** @type {InsightResult[]} */
    insights: [],

    /** @type {Object|null} */
    metadata: null,

    /** @type {Object|null} */
    breakdownRoot: null,

    /** @type {Object|null} */
    treemapData: null,

    /** @type {Object|null} */
    summary: null,
  }),

  getters: {
    /**
     * Check if analysis data is available
     * @returns {boolean}
     */
    hasAnalysis: (state) => state.currentAnalysis !== null,

    /**
     * Get insights by severity
     * @returns {function(string): InsightResult[]}
     */
    insightsBySeverity: (state) => (severity) => {
      return state.insights.filter((insight) => insight.severity === severity);
    },

    /**
     * Get insights by category
     * @returns {function(string): InsightResult[]}
     */
    insightsByCategory: (state) => (category) => {
      return state.insights.filter((insight) => insight.category === category);
    },

    /**
     * Get critical insights count
     * @returns {number}
     */
    criticalInsightsCount: (state) => {
      return state.insights.filter((insight) => insight.severity === 'critical').length;
    },

    /**
     * Get total estimated savings from insights
     * @returns {number}
     */
    totalEstimatedSavings: (state) => {
      return state.insights.reduce((total, insight) => {
        return total + (insight.potentialSavings || 0);
      }, 0);
    },

    /**
     * Check if metadata is available
     * @returns {boolean}
     */
    hasMetadata: (state) => state.metadata !== null,

    /**
     * Get platform from metadata
     * @returns {string|null}
     */
    platform: (state) => state.metadata?.platform || null,

    /**
     * Get app bundle ID
     * @returns {string|null}
     */
    bundleId: (state) => state.metadata?.bundleId || null,

    /**
     * Get app version
     * @returns {string|null}
     */
    version: (state) => state.metadata?.version || null,

    /**
     * Get file format (ipa, apk, aab, framework)
     * @returns {string|null}
     */
    format: (state) => state.currentAnalysis?.parseResult?.format || null,

    /**
     * Check if current analysis is AAB format
     * @returns {boolean}
     */
    isAAB: (state) => state.currentAnalysis?.parseResult?.format === 'aab',

    /**
     * Check if current analysis is Framework format
     * @returns {boolean}
     */
    isFramework: (state) => state.currentAnalysis?.parseResult?.format === 'framework',

    /**
     * Get AAB modules (only for AAB format)
     * @returns {Array}
     */
    modules: (state) => {
      if (state.currentAnalysis?.parseResult?.format === 'aab') {
        return state.currentAnalysis.parseResult.modules || [];
      }
      return [];
    },

    /**
     * Get architecture slices (for Framework format)
     * @returns {Array}
     */
    architectureSlices: (state) => {
      if (state.currentAnalysis?.parseResult?.format === 'framework') {
        return state.currentAnalysis.parseResult.architectures || [];
      }
      return [];
    },

    /**
     * Get supported architectures (for all formats)
     * @returns {Array}
     */
    architectures: (state) => {
      const parseResult = state.currentAnalysis?.parseResult;
      if (!parseResult) return [];

      // Framework has detailed architecture slices
      if (parseResult.format === 'framework' && parseResult.architectures) {
        return parseResult.architectures.map((a) => a.name);
      }

      // Other formats have simple architecture list
      return parseResult.architectures || [];
    },
  },

  actions: {
    /**
     * Set analysis result
     * @param {AnalysisContext} analysis - Parsed analysis data
     */
    setAnalysisResult(analysis) {
      this.currentAnalysis = analysis;
      this.metadata = analysis.metadata || null;
      this.breakdownRoot = analysis.breakdownRoot || null;
      this.treemapData = analysis.treemapData || null;
      this.summary = analysis.summary || null;
    },

    /**
     * Clear analysis data
     */
    clearAnalysis() {
      this.currentAnalysis = null;
      this.metadata = null;
      this.breakdownRoot = null;
      this.treemapData = null;
      this.summary = null;
      this.insights = [];
    },

    /**
     * Set insights
     * @param {InsightResult[]} insights - Generated insights
     */
    setInsights(insights) {
      this.insights = insights;
    },

    /**
     * Add insight
     * @param {InsightResult} insight - Single insight
     */
    addInsight(insight) {
      this.insights.push(insight);
    },

    /**
     * Update insight
     * @param {string} id - Insight ID
     * @param {Partial<InsightResult>} updates - Updates to apply
     */
    updateInsight(id, updates) {
      const index = this.insights.findIndex((insight) => insight.id === id);
      if (index !== -1) {
        this.insights[index] = {
          ...this.insights[index],
          ...updates,
        };
      }
    },

    /**
     * Remove insight
     * @param {string} id - Insight ID
     */
    removeInsight(id) {
      const index = this.insights.findIndex((insight) => insight.id === id);
      if (index !== -1) {
        this.insights.splice(index, 1);
      }
    },

    /**
     * Calculate summary statistics from breakdown tree
     */
    calculateSummary() {
      if (!this.breakdownRoot) {
        this.summary = null;
        return;
      }

      let totalSize = 0;
      let compressedSize = 0;
      let fileCount = 0;
      let directoryCount = 0;
      let largestFile = null;
      let largestFileSize = 0;

      const traverse = (node) => {
        if (node.type === 'file') {
          fileCount++;
          totalSize += node.size || 0;
          compressedSize += node.compressedSize || 0;
          if (node.size > largestFileSize) {
            largestFileSize = node.size;
            largestFile = node.path;
          }
        } else if (node.type === 'directory') {
          directoryCount++;
        }

        if (node.children) {
          node.children.forEach(traverse);
        }
      };

      traverse(this.breakdownRoot);

      this.summary = {
        totalSize,
        compressedSize,
        compressionRatio: totalSize > 0 ? compressedSize / totalSize : 0,
        fileCount,
        directoryCount,
        largestFile,
        largestFileSize,
      };
    },

    /**
     * Reset store to initial state
     */
    reset() {
      this.currentAnalysis = null;
      this.insights = [];
      this.metadata = null;
      this.breakdownRoot = null;
      this.treemapData = null;
      this.summary = null;
    },
  },
});
