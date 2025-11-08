/**
 * Analysis Engine Contract
 *
 * Defines the interface for binary analysis, breakdown generation,
 * and insights rule execution.
 */

import type { IOSParseResult } from './ios-parser';
import type { AndroidParseResult } from './android-parser';

export interface AnalysisEngineContract {
  /**
   * Analyze a parsed binary and generate complete analysis context
   * @param parseResult - Result from iOS or Android parser
   * @param options - Analysis options
   * @returns Promise resolving to complete analysis context
   */
  analyze(
    parseResult: IOSParseResult | AndroidParseResult,
    options?: AnalysisOptions
  ): Promise<AnalysisContext>;

  /**
   * Generate hierarchical breakdown tree from flat file list
   * @param files - Flat list of files from parser
   * @returns Root breakdown node
   */
  generateBreakdown(files: FileEntry[]): BreakdownNode;

  /**
   * Execute insight rules against analysis context
   * @param context - Complete analysis context
   * @param rules - Optional subset of rules to execute
   * @returns Array of insight results
   */
  executeInsights(
    context: AnalysisContext,
    rules?: string[]
  ): Promise<InsightResult[]>;

  /**
   * Register custom insight rule
   * @param rule - Custom rule implementation
   */
  registerRule(rule: InsightRule): void;

  /**
   * Get all registered insight rules
   */
  getRules(): InsightRule[];
}

// Core types

export interface AnalysisContext {
  // Identification
  fileId: string;
  timestamp: Date;

  // Binary metadata
  platform: 'iOS' | 'Android';
  appName: string;
  bundleId: string;
  version: string;

  // Size metrics
  totalInstallSize: number;
  totalDownloadSize: number;

  // Hierarchical structure
  breakdownRoot: BreakdownNode;

  // Categorized content
  frameworks?: Framework[];
  assets: Asset[];
  localizations: Localization[];
  executables: ExecutableMetadata[];
  nativeLibraries?: NativeLib[];
  dexFiles?: DEXMetadata[];
  modules?: APKModule[];

  // Analysis artifacts
  allFiles: FileEntry[];
  fileHashes: Map<string, string>;

  // Insights (computed)
  insights: InsightResult[];

  // Build metadata
  buildType?: 'debug' | 'release' | 'unknown';
  compilerOptimization?: string;
}

export interface BreakdownNode {
  id: string;
  name: string;
  path: string;
  size: number;
  compressedSize?: number;
  type: ContentType;
  parent?: string;
  children: BreakdownNode[];
  metadata?: BreakdownMetadata;
}

export interface BreakdownMetadata {
  fileCount?: number;
  duplicates?: string[];
  encoding?: string;
  architecture?: string[];
}

export type ContentType =
  | 'framework'
  | 'bundle'
  | 'executable'
  | 'dex'
  | 'native_lib'
  | 'resource'
  | 'image'
  | 'video'
  | 'font'
  | 'localization'
  | 'data'
  | 'config'
  | 'unknown';

export interface FileEntry {
  path: string;
  size: number;
  compressedSize?: number;
  type: ContentType;
  encoding?: string;
  content?: Uint8Array;
  metadata?: Record<string, unknown>;
}

// Insight system

export interface InsightRule {
  id: string;
  category: InsightCategory;
  name: string;
  description: string;
  severity: InsightSeverity;
  execute: (context: AnalysisContext) => InsightResult[] | Promise<InsightResult[]>;
  examples?: string[];
  fixable?: boolean;
}

export type InsightCategory =
  | 'duplicates'
  | 'optimization'
  | 'unused'
  | 'over-bundling'
  | 'compression'
  | 'architecture';

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface InsightResult {
  ruleId: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  affectedItems: AffectedItem[];
  potentialSavings: number;
  percentOfTotal: number;
  actionable: boolean;
  fixSuggestion?: string;
}

export interface AffectedItem {
  path: string;
  size: number;
  reason: string;
}

// Additional types referenced

export interface Framework {
  name: string;
  path: string;
  size: number;
  type: 'dynamic' | 'static' | 'system';
  arch: string[];
}

export interface Asset {
  name: string;
  path: string;
  size: number;
  type: string;
  encoding?: string;
  resolution?: string;
}

export interface Localization {
  language: string;
  path: string;
  size: number;
  stringCount: number;
}

export interface ExecutableMetadata {
  name: string;
  path: string;
  size: number;
  arch: string[];
  hasDebugSymbols: boolean;
}

export interface NativeLib {
  name: string;
  path: string;
  size: number;
  architecture: string;
}

export interface DEXMetadata {
  name: string;
  size: number;
  methodCount: number;
}

export interface APKModule {
  name: string;
  size: number;
  type: string;
}

// Options

export interface AnalysisOptions {
  /**
   * Skip insight rule execution
   */
  skipInsights?: boolean;

  /**
   * Enable duplicate detection (requires hashing all files)
   */
  detectDuplicates?: boolean;

  /**
   * Generate file hashes for all files
   */
  generateHashes?: boolean;

  /**
   * Rules to execute (if not provided, all rules run)
   */
  rules?: string[];

  /**
   * Progress callback
   */
  onProgress?: (progress: number, status: string) => void;
}

// Built-in insight rules

/**
 * Rule R001: Detect duplicate files
 */
export const RULE_DUPLICATE_FILES: InsightRule = {
  id: 'R001',
  category: 'duplicates',
  name: 'Remove duplicate files',
  description: 'Multiple identical files consume unnecessary space',
  severity: 'critical',
  fixable: true,
  execute: async (context) => {
    // Implementation in actual code
    return [];
  },
};

/**
 * Rule R002: Optimize images
 */
export const RULE_OPTIMIZE_IMAGES: InsightRule = {
  id: 'R002',
  category: 'optimization',
  name: 'Optimize images',
  description: 'Convert or compress unoptimized images',
  severity: 'high',
  fixable: false,
  execute: async (context) => {
    // Implementation in actual code
    return [];
  },
};

/**
 * Rule R003: Minify localized strings
 */
export const RULE_MINIFY_STRINGS: InsightRule = {
  id: 'R003',
  category: 'compression',
  name: 'Minify localized strings',
  description: 'Remove unused translations or excessive string keys',
  severity: 'medium',
  fixable: false,
  execute: async (context) => {
    // Implementation in actual code
    return [];
  },
};

/**
 * Rule R004: Remove debug symbols
 */
export const RULE_STRIP_SYMBOLS: InsightRule = {
  id: 'R004',
  category: 'optimization',
  name: 'Remove binary symbol metadata',
  description: 'Strip unnecessary debug symbols from production builds',
  severity: 'high',
  fixable: false,
  execute: async (context) => {
    // Implementation in actual code
    return [];
  },
};

/**
 * Rule R005: iOS asset catalog optimization
 */
export const RULE_ASSET_CATALOG: InsightRule = {
  id: 'R005',
  category: 'over-bundling',
  name: 'Place scaled images in asset catalogs',
  description: 'Move individual @2x/@3x images to asset catalogs for better optimization',
  severity: 'medium',
  fixable: false,
  execute: async (context) => {
    // Implementation in actual code
    return [];
  },
};

/**
 * Rule R006: Android unused resources
 */
export const RULE_UNUSED_RESOURCES: InsightRule = {
  id: 'R006',
  category: 'unused',
  name: 'Remove unused resources',
  description: 'Identify drawable/layout/string resources not referenced in code',
  severity: 'high',
  fixable: false,
  execute: async (context) => {
    // Implementation in actual code
    return [];
  },
};

export const DEFAULT_RULES: InsightRule[] = [
  RULE_DUPLICATE_FILES,
  RULE_OPTIMIZE_IMAGES,
  RULE_MINIFY_STRINGS,
  RULE_STRIP_SYMBOLS,
  RULE_ASSET_CATALOG,
  RULE_UNUSED_RESOURCES,
];

// Example implementation signature

/**
 * Example: Create an analysis engine instance
 *
 * @example
 * ```typescript
 * import { createAnalysisEngine } from './analysis/analysis-engine';
 * import { createIOSParser } from './parsers/ios/ipa-parser';
 *
 * const parser = createIOSParser();
 * const engine = createAnalysisEngine();
 *
 * // Register custom rule
 * engine.registerRule({
 *   id: 'R007',
 *   category: 'optimization',
 *   name: 'Custom rule',
 *   description: 'Find large video files',
 *   severity: 'medium',
 *   execute: async (context) => {
 *     const largeVideos = context.assets
 *       .filter(a => a.type === 'video' && a.size > 10 * 1024 * 1024);
 *     return [{
 *       ruleId: 'R007',
 *       title: 'Large video files detected',
 *       description: `Found ${largeVideos.length} videos over 10MB`,
 *       severity: 'medium',
 *       category: 'optimization',
 *       affectedItems: largeVideos.map(v => ({
 *         path: v.path,
 *         size: v.size,
 *         reason: 'Video exceeds 10MB'
 *       })),
 *       potentialSavings: 0,
 *       percentOfTotal: 0,
 *       actionable: true,
 *       fixSuggestion: 'Consider compressing or removing large videos'
 *     }];
 *   }
 * });
 *
 * // Parse and analyze
 * const parseResult = await parser.parse(file);
 * const analysis = await engine.analyze(parseResult, {
 *   detectDuplicates: true,
 *   onProgress: (progress, status) => {
 *     console.log(`${progress}%: ${status}`);
 *   }
 * });
 *
 * console.log(`Found ${analysis.insights.length} insights`);
 * console.log(`Total potential savings: ${
 *   analysis.insights.reduce((sum, i) => sum + i.potentialSavings, 0)
 * } bytes`);
 * ```
 */
export function createAnalysisEngine(): AnalysisEngineContract {
  throw new Error('Not implemented - this is a contract definition');
}
