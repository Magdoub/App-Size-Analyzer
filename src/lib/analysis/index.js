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
import { InsightEngine, registerEnhancedInsightRules } from './insight-engine.js';
import { allInsightRules } from './insight-rules.js';

/**
 * Create a fully configured insight engine with all rules registered
 *
 * This is the main factory function for creating an insight engine in production.
 * It automatically registers all available insight rules (basic + enhanced).
 * @returns {InsightEngine} Configured insight engine
 */
export function createConfiguredInsightEngine() {
  const engine = new InsightEngine(true); // Enable caching

  // Register basic insight rules (R001-R006)
  engine.registerRules(allInsightRules);

  // Register enhanced insight rules (large files, media, frameworks, etc.)
  registerEnhancedInsightRules(engine);

  const totalRules = engine.getRules().length;
  console.log(`[InsightEngine] Registered ${totalRules} rules (${allInsightRules.length} basic + ${totalRules - allInsightRules.length} enhanced)`);

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
