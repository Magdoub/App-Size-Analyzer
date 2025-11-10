/**
 * Insight Engine
 *
 * Rule-based analysis engine for detecting optimization opportunities
 */

import { findNodeByPath } from './breakdown-generator.js';

/**
 * @typedef {import('../../types/analysis.js').AnalysisContext} AnalysisContext
 * @typedef {import('../../types/analysis.js').BreakdownNode} BreakdownNode
 * @typedef {import('../../types/insights.js').InsightRule} InsightRule
 * @typedef {import('../../types/insights.js').InsightResult} InsightResult
 * @typedef {import('../../types/insights.js').InsightCategory} InsightCategory
 * @typedef {import('../../types/insights.js').InsightSeverity} InsightSeverity
 * @typedef {import('../../types/insights.js').InsightEngineConfig} InsightEngineConfig
 */

/**
 * Insight Engine - Manages and executes insight rules
 */
export class InsightEngine {
  /** @type {Map<string, InsightRule>} */
  #rules = new Map();

  /** @type {Map<string, InsightResult[]>} */
  #cache = new Map();

  /** @type {boolean} */
  #cacheEnabled;

  /**
   * @param {boolean} [cacheEnabled=true] - Enable result caching
   */
  constructor(cacheEnabled = true) {
    this.#cacheEnabled = cacheEnabled;
  }

  /**
   * Register a new insight rule
   * @param {InsightRule} rule - Rule to register
   * @returns {void}
   */
  registerRule(rule) {
    this.#rules.set(rule.id, rule);
  }

  /**
   * Register multiple rules at once
   * @param {InsightRule[]} rules - Rules to register
   * @returns {void}
   */
  registerRules(rules) {
    rules.forEach((rule) => this.registerRule(rule));
  }

  /**
   * Get all registered rules
   * @returns {InsightRule[]} All rules
   */
  getRules() {
    return Array.from(this.#rules.values());
  }

  /**
   * Get rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {InsightRule | undefined} Rule if found
   */
  getRule(ruleId) {
    return this.#rules.get(ruleId);
  }

  /**
   * Execute all rules against an analysis context
   * @param {AnalysisContext} context - Analysis context
   * @returns {Promise<InsightResult[]>} Insight results
   */
  async executeAll(context) {
    const cacheKey = this.#getCacheKey(context);

    // Check cache
    if (this.#cacheEnabled && this.#cache.has(cacheKey)) {
      console.log('[InsightEngine] Returning cached results');
      return this.#cache.get(cacheKey);
    }

    console.log(`[InsightEngine] Executing ${this.#rules.size} rules...`);
    const results = [];

    // Execute all rules in parallel
    const rulePromises = Array.from(this.#rules.values()).map(async (rule) => {
      try {
        console.log(`[InsightEngine] Executing rule ${rule.id}: ${rule.name}`);
        const ruleResults = await rule.execute(context);
        return ruleResults;
      } catch (error) {
        console.error(`[InsightEngine] Rule ${rule.id} failed:`, error);
        return [];
      }
    });

    const ruleResultArrays = await Promise.all(rulePromises);

    // Flatten results
    ruleResultArrays.forEach((ruleResults) => {
      results.push(...ruleResults);
    });

    // Sort by severity and potential savings
    results.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.potentialSavings - a.potentialSavings;
    });

    console.log(`[InsightEngine] Found ${results.length} insights`);

    // Cache results
    if (this.#cacheEnabled) {
      this.#cache.set(cacheKey, results);
    }

    return results;
  }

  /**
   * Execute specific rules by category
   * @param {AnalysisContext} context - Analysis context
   * @param {InsightCategory[]} categories - Categories to filter by
   * @returns {Promise<InsightResult[]>} Insight results
   */
  async executeByCategory(context, categories) {
    const categorySet = new Set(categories);
    const filteredRules = Array.from(this.#rules.values()).filter((rule) =>
      categorySet.has(rule.category)
    );

    const results = [];

    for (const rule of filteredRules) {
      try {
        const ruleResults = await rule.execute(context);
        results.push(...ruleResults);
      } catch (error) {
        console.error(`[InsightEngine] Rule ${rule.id} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Execute specific rules by severity
   * @param {AnalysisContext} context - Analysis context
   * @param {InsightSeverity} minimumSeverity - Minimum severity level
   * @returns {Promise<InsightResult[]>} Insight results
   */
  async executeBySeverity(context, minimumSeverity) {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const minSeverityLevel = severityOrder[minimumSeverity];

    const filteredRules = Array.from(this.#rules.values()).filter(
      (rule) => severityOrder[rule.severity] <= minSeverityLevel
    );

    const results = [];

    for (const rule of filteredRules) {
      try {
        const ruleResults = await rule.execute(context);
        results.push(...ruleResults);
      } catch (error) {
        console.error(`[InsightEngine] Rule ${rule.id} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Clear the cache
   * @returns {void}
   */
  clearCache() {
    this.#cache.clear();
  }

  /**
   * Generate cache key from analysis context
   * @param {AnalysisContext} context - Analysis context
   * @returns {string} Cache key
   */
  #getCacheKey(context) {
    return `${context.fileId}-${context.timestamp.getTime()}`;
  }
}

/**
 * Helper function to find node by path in breakdown tree
 * @param {AnalysisContext} context - Analysis context
 * @param {string} path - Path to find
 * @returns {BreakdownNode | undefined} Found node
 */
export function getNodeByPath(context, path) {
  return findNodeByPath(context.breakdownRoot, path);
}

/**
 * Helper function to compute file hash (using existing file hashes if available)
 * @param {AnalysisContext} context - Analysis context
 * @param {string} path - File path
 * @returns {Promise<string | null>} File hash or null
 */
export async function computeFileHash(context, path) {
  // Check if hash is already computed
  if (context.fileHashes) {
    const hash = context.fileHashes.get(path);
    if (hash) return hash;
  }

  // Hash not available - would need to implement SHA-256 hashing
  // For now, return null (hashes should be pre-computed during parsing)
  console.warn(`[InsightEngine] Hash not available for ${path}`);
  return null;
}

/**
 * Helper function to find duplicates by comparing file hashes
 * @param {AnalysisContext} context - Analysis context
 * @returns {Promise<Map<string, string[]>>} Map of hash to duplicate file paths
 */
export async function findDuplicatesByHash(context) {
  const duplicates = new Map();

  if (!context.fileHashes || context.fileHashes.size === 0) {
    console.warn('[InsightEngine] No file hashes available for duplicate detection');
    return duplicates;
  }

  // Group files by hash
  const hashToFiles = new Map();

  context.fileHashes.forEach((hash, path) => {
    if (!hashToFiles.has(hash)) {
      hashToFiles.set(hash, []);
    }
    hashToFiles.get(hash).push(path);
  });

  // Find hashes with multiple files (duplicates)
  hashToFiles.forEach((files, hash) => {
    if (files.length > 1) {
      duplicates.set(hash, files);
    }
  });

  return duplicates;
}

/**
 * Helper function to calculate potential savings from duplicates
 * @param {AnalysisContext} context - Analysis context
 * @param {string[]} duplicatePaths - Duplicate file paths
 * @returns {number} Potential savings in bytes
 */
export function calculateDuplicateSavings(context, duplicatePaths) {
  if (duplicatePaths.length <= 1) return 0;

  // Calculate savings: (n-1) * size
  // Keep one copy, remove the rest
  const firstPath = duplicatePaths[0];
  const fileEntry = context.allFiles.find((f) => f.path === firstPath);

  if (!fileEntry) return 0;

  return fileEntry.size * (duplicatePaths.length - 1);
}

/**
 * Helper function to find all files matching a pattern
 * @param {AnalysisContext} context - Analysis context
 * @param {RegExp} pattern - Pattern to match
 * @returns {string[]} Matching file paths
 */
export function findFilesByPattern(context, pattern) {
  return context.allFiles.filter((file) => pattern.test(file.path)).map((file) => file.path);
}

/**
 * Helper function to find files by extension
 * @param {AnalysisContext} context - Analysis context
 * @param {string} extension - File extension
 * @returns {string[]} Matching file paths
 */
export function findFilesByExtension(context, extension) {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return context.allFiles
    .filter((file) => file.path.toLowerCase().endsWith(ext))
    .map((file) => file.path);
}

/**
 * Helper function to calculate percentage of total size
 * @param {number} size - Size
 * @param {number} totalSize - Total size
 * @returns {number} Percentage
 */
export function calculatePercentage(size, totalSize) {
  if (totalSize === 0) return 0;
  return (size / totalSize) * 100;
}

/**
 * Create default insight engine with no rules registered
 * @param {Partial<InsightEngineConfig>} [config] - Engine configuration
 * @returns {InsightEngine} Insight engine
 */
export function createInsightEngine(config) {
  const engine = new InsightEngine(config?.cacheResults ?? true);

  // Register rules if provided
  if (config?.rules) {
    engine.registerRules(config.rules);
  }

  return engine;
}

/**
 * Create fully configured insight engine with all rules registered
 * This is the recommended way to create an insight engine for production use
 * @returns {InsightEngine} Insight engine
 */
export function createDefaultInsightEngine() {
  const engine = new InsightEngine(true); // Enable caching

  // Import and register all rules
  // Note: Rules will be imported from insight-rules.ts when needed
  // This function serves as a factory for the configured engine

  return engine;
}
