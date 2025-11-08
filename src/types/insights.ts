/**
 * Insight Types
 *
 * Types for the rule-based analysis engine and optimization recommendations
 */

import type { AnalysisContext, BreakdownNode } from './analysis';

export type InsightCategory =
  | 'duplicates'        // Duplicate files
  | 'optimization'      // Asset optimization opportunities
  | 'unused'            // Unused resources
  | 'over-bundling'     // Excessive bundling
  | 'compression'       // Compression opportunities
  | 'architecture';     // Multi-arch bloat

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * InsightRule - Defines a reusable analysis pattern
 */
export interface InsightRule {
  id: string;                        // e.g., "R001"
  category: InsightCategory;
  name: string;
  description: string;
  severity: InsightSeverity;

  // Execution function
  execute: (context: AnalysisContext) => Promise<InsightResult[]>;

  metadata?: {
    examples?: string[];
    documentation?: string;
    fixable?: boolean;               // Can be auto-fixed
  };
}

/**
 * InsightResult - Finding from a rule execution
 */
export interface InsightResult {
  ruleId: string;                    // Reference to InsightRule.id
  title: string;                     // Display title
  description: string;               // Detailed description
  severity: InsightSeverity;
  category: InsightCategory;

  affectedItems: AffectedItem[];
  potentialSavings: number;          // Estimated bytes saved
  percentOfTotal: number;            // Percentage of total app size

  actionable: boolean;               // Can user take action
  fixSuggestion?: string;            // How to fix
}

/**
 * AffectedItem - Specific file or component flagged by an insight
 */
export interface AffectedItem {
  path: string;                      // File path
  size: number;                      // File size
  reason: string;                    // Why it's flagged
  metadata?: Record<string, unknown>; // Additional context
}

/**
 * InsightEngineConfig - Configuration for insight engine
 */
export interface InsightEngineConfig {
  rules: InsightRule[];
  enabledCategories: Set<InsightCategory>;
  minimumSeverity: InsightSeverity;
  cacheResults: boolean;
}

/**
 * InsightExecutionContext - Context passed to rules during execution
 */
export interface InsightExecutionContext extends AnalysisContext {
  // Additional helpers for rule execution
  getNodeByPath: (path: string) => BreakdownNode | undefined;
  computeFileHash: (path: string) => Promise<string>;
  findDuplicatesByHash: () => Promise<Map<string, string[]>>;
}
