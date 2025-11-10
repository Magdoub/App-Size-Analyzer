/**
 * Analysis Module
 *
 * Exports all analysis-related functionality
 */

// Re-export breakdown generator
export * from './breakdown-generator.js';

// Re-export insight engine
export * from './insight-engine.js';

// Re-export insight rules
export * from './insight-rules.js';

// Import for default engine setup
import { InsightEngine } from './insight-engine.js';
import { allInsightRules } from './insight-rules.js';

/**
 * Create a fully configured insight engine with all rules registered
 *
 * This is the main factory function for creating an insight engine in production.
 * It automatically registers all available insight rules.
 * @returns {InsightEngine} Configured insight engine
 */
export function createConfiguredInsightEngine() {
  const engine = new InsightEngine(true); // Enable caching
  engine.registerRules(allInsightRules);

  console.log(`[InsightEngine] Registered ${allInsightRules.length} rules:`, allInsightRules.map(r => r.id));

  return engine;
}

/**
 * Singleton instance of the default insight engine
 * Use this for consistent caching across the application
 * @type {InsightEngine | null}
 */
let defaultEngineInstance = null;

/**
 * Get the singleton instance of the default insight engine
 * @returns {InsightEngine} Default insight engine
 */
export function getDefaultInsightEngine() {
  if (!defaultEngineInstance) {
    defaultEngineInstance = createConfiguredInsightEngine();
  }
  return defaultEngineInstance;
}

/**
 * Reset the default insight engine (useful for testing or cache clearing)
 * @returns {void}
 */
export function resetDefaultInsightEngine() {
  if (defaultEngineInstance) {
    defaultEngineInstance.clearCache();
  }
  defaultEngineInstance = null;
}
