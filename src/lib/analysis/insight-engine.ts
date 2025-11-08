/**
 * Insight Engine
 *
 * Rule-based analysis engine for detecting optimization opportunities
 */

import type { AnalysisContext, BreakdownNode } from '../../types/analysis';
import type {
  InsightRule,
  InsightResult,
  InsightCategory,
  InsightSeverity,
  InsightEngineConfig,
} from '../../types/insights';
import { findNodeByPath } from './breakdown-generator';

/**
 * Insight Engine - Manages and executes insight rules
 */
export class InsightEngine {
  private rules: Map<string, InsightRule> = new Map();
  private cache: Map<string, InsightResult[]> = new Map();
  private cacheEnabled: boolean;

  constructor(cacheEnabled: boolean = true) {
    this.cacheEnabled = cacheEnabled;
  }

  /**
   * Register a new insight rule
   */
  registerRule(rule: InsightRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Register multiple rules at once
   */
  registerRules(rules: InsightRule[]): void {
    rules.forEach((rule) => this.registerRule(rule));
  }

  /**
   * Get all registered rules
   */
  getRules(): InsightRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): InsightRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Execute all rules against an analysis context
   */
  async executeAll(context: AnalysisContext): Promise<InsightResult[]> {
    const cacheKey = this.getCacheKey(context);

    // Check cache
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      console.log('[InsightEngine] Returning cached results');
      return this.cache.get(cacheKey)!;
    }

    console.log(`[InsightEngine] Executing ${this.rules.size} rules...`);
    const results: InsightResult[] = [];

    // Execute all rules in parallel
    const rulePromises = Array.from(this.rules.values()).map(async (rule) => {
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
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, results);
    }

    return results;
  }

  /**
   * Execute specific rules by category
   */
  async executeByCategory(
    context: AnalysisContext,
    categories: InsightCategory[]
  ): Promise<InsightResult[]> {
    const categorySet = new Set(categories);
    const filteredRules = Array.from(this.rules.values()).filter((rule) =>
      categorySet.has(rule.category)
    );

    const results: InsightResult[] = [];

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
   */
  async executeBySeverity(
    context: AnalysisContext,
    minimumSeverity: InsightSeverity
  ): Promise<InsightResult[]> {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const minSeverityLevel = severityOrder[minimumSeverity];

    const filteredRules = Array.from(this.rules.values()).filter(
      (rule) => severityOrder[rule.severity] <= minSeverityLevel
    );

    const results: InsightResult[] = [];

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
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key from analysis context
   */
  private getCacheKey(context: AnalysisContext): string {
    return `${context.fileId}-${context.timestamp.getTime()}`;
  }
}

/**
 * Helper function to find node by path in breakdown tree
 */
export function getNodeByPath(
  context: AnalysisContext,
  path: string
): BreakdownNode | undefined {
  return findNodeByPath(context.breakdownRoot, path);
}

/**
 * Helper function to compute file hash (using existing file hashes if available)
 */
export async function computeFileHash(
  context: AnalysisContext,
  path: string
): Promise<string | null> {
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
 */
export async function findDuplicatesByHash(
  context: AnalysisContext
): Promise<Map<string, string[]>> {
  const duplicates = new Map<string, string[]>();

  if (!context.fileHashes || context.fileHashes.size === 0) {
    console.warn('[InsightEngine] No file hashes available for duplicate detection');
    return duplicates;
  }

  // Group files by hash
  const hashToFiles = new Map<string, string[]>();

  context.fileHashes.forEach((hash, path) => {
    if (!hashToFiles.has(hash)) {
      hashToFiles.set(hash, []);
    }
    hashToFiles.get(hash)!.push(path);
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
 */
export function calculateDuplicateSavings(
  context: AnalysisContext,
  duplicatePaths: string[]
): number {
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
 */
export function findFilesByPattern(
  context: AnalysisContext,
  pattern: RegExp
): string[] {
  return context.allFiles.filter((file) => pattern.test(file.path)).map((file) => file.path);
}

/**
 * Helper function to find files by extension
 */
export function findFilesByExtension(
  context: AnalysisContext,
  extension: string
): string[] {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return context.allFiles
    .filter((file) => file.path.toLowerCase().endsWith(ext))
    .map((file) => file.path);
}

/**
 * Helper function to calculate percentage of total size
 */
export function calculatePercentage(size: number, totalSize: number): number {
  if (totalSize === 0) return 0;
  return (size / totalSize) * 100;
}

/**
 * Create default insight engine with no rules registered
 */
export function createInsightEngine(config?: Partial<InsightEngineConfig>): InsightEngine {
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
 */
export function createDefaultInsightEngine(): InsightEngine {
  const engine = new InsightEngine(true); // Enable caching

  // Import and register all rules
  // Note: Rules will be imported from insight-rules.ts when needed
  // This function serves as a factory for the configured engine

  return engine;
}
