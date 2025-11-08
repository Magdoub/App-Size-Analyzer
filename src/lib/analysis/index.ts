/**
 * Analysis Module
 *
 * Exports all analysis-related functionality
 */

// Re-export breakdown generator
export * from './breakdown-generator';

// Re-export insight engine
export * from './insight-engine';

// Re-export insight rules
export * from './insight-rules';

// Import for default engine setup
import { InsightEngine } from './insight-engine';
import { allInsightRules } from './insight-rules';

/**
 * Create a fully configured insight engine with all rules registered
 *
 * This is the main factory function for creating an insight engine in production.
 * It automatically registers all available insight rules.
 */
export function createConfiguredInsightEngine(): InsightEngine {
  const engine = new InsightEngine(true); // Enable caching
  engine.registerRules(allInsightRules);

  console.log(`[InsightEngine] Registered ${allInsightRules.length} rules:`, allInsightRules.map(r => r.id));

  return engine;
}

/**
 * Singleton instance of the default insight engine
 * Use this for consistent caching across the application
 */
let defaultEngineInstance: InsightEngine | null = null;

/**
 * Get the singleton instance of the default insight engine
 */
export function getDefaultInsightEngine(): InsightEngine {
  if (!defaultEngineInstance) {
    defaultEngineInstance = createConfiguredInsightEngine();
  }
  return defaultEngineInstance;
}

/**
 * Reset the default insight engine (useful for testing or cache clearing)
 */
export function resetDefaultInsightEngine(): void {
  if (defaultEngineInstance) {
    defaultEngineInstance.clearCache();
  }
  defaultEngineInstance = null;
}
