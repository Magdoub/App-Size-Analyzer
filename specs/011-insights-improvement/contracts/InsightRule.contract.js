/**
 * InsightRule Contract
 *
 * Defines the interface for insight detection rules.
 * All insight rules MUST implement this contract.
 *
 * @contract InsightRule
 * @version 1.0.0
 * @feature 011-insights-improvement
 */

/**
 * @typedef {Object} InsightRule
 * @property {string} id - Unique rule identifier (format: R###, e.g., R011)
 * @property {string} category - Insight category
 * @property {string} name - Human-readable rule name (1-100 chars)
 * @property {string} description - What the rule detects (1-500 chars)
 * @property {'critical'|'high'|'medium'|'low'} severity - Severity level
 * @property {'iOS'|'Android'|'both'} [platform] - Platform filter (optional, defaults to 'both')
 * @property {'P1'|'P2'|'P3'} priority - Implementation priority
 * @property {ExecuteFunction} execute - Detection function (async)
 * @property {InsightRuleMetadata} [metadata] - Additional rule metadata (optional)
 */

/**
 * Rule execution function signature
 * @callback ExecuteFunction
 * @param {AnalysisContext} context - Analysis context with all app data
 * @returns {Promise<InsightResult[]>} Array of detected insights (empty if none found)
 */

/**
 * Analysis context passed to rules
 * @typedef {Object} AnalysisContext
 * @property {'iOS'|'Android'} platform - App platform
 * @property {FileEntry[]} allFiles - All files in bundle
 * @property {number} totalInstallSize - Total app size in bytes
 * @property {'debug'|'release'|'unknown'} buildType - Build configuration
 * @property {Object} metadata - App metadata from parser
 * @property {ImageFile[]} [imageFiles] - Filtered image files
 * @property {FontFile[]} [fontFiles] - Filtered font files
 * @property {Object} [plistData] - Parsed Info.plist (iOS only)
 * @property {Object} [manifestData] - Parsed AndroidManifest.xml (Android only)
 * @property {Map<string, ImageCompressionResult>} [compressionCache] - Compression result cache
 * @property {Map<string, DuplicateGroup>} [duplicateGroups] - Duplicate file groups
 */

/**
 * File entry in bundle
 * @typedef {Object} FileEntry
 * @property {string} path - File path in bundle
 * @property {number} size - File size in bytes
 * @property {string} [hash] - SHA-256 hash (computed on demand)
 */

/**
 * Insight detection result
 * @typedef {Object} InsightResult
 * @property {string} ruleId - Source rule ID (must match InsightRule.id)
 * @property {string} title - Concise insight title (1-200 chars)
 * @property {string} description - Detailed explanation with metrics (1-2000 chars)
 * @property {'critical'|'high'|'medium'|'low'} severity - Severity level
 * @property {string} category - Insight category (must match rule category)
 * @property {AffectedItem[]} affectedItems - List of affected files/resources
 * @property {number} potentialSavings - Estimated bytes saved (≥ 0)
 * @property {number} percentOfTotal - Percentage of total app size (0-100)
 * @property {boolean} actionable - Can user act on this insight?
 * @property {string} fixSuggestion - How to fix (markdown supported, 1-5000 chars)
 * @property {Object} [metadata] - Additional result metadata (optional)
 */

/**
 * Affected item in insight
 * @typedef {Object} AffectedItem
 * @property {string} path - File location in bundle
 * @property {number} size - File size in bytes
 * @property {string} reason - Why this item is flagged (1-500 chars)
 * @property {Object} [metadata] - Item-specific data (optional)
 */

/**
 * Rule metadata (optional)
 * @typedef {Object} InsightRuleMetadata
 * @property {string[]} [examples] - Example scenarios
 * @property {string} [documentation] - Additional documentation
 * @property {boolean} [fixable] - Is this automatically fixable?
 * @property {boolean} [requiresWorker] - Requires Web Worker execution?
 * @property {string} [estimatedTime] - Estimated detection time
 */

/**
 * Validation Rules
 * ================
 *
 * 1. Rule ID Format:
 *    - MUST match pattern /^R\d{3}$/ (e.g., R001, R011, R020)
 *    - MUST be unique across all rules
 *
 * 2. Execute Function:
 *    - MUST be async (returns Promise)
 *    - MUST return InsightResult[] (array, can be empty)
 *    - MUST NOT throw errors (catch internally and return empty array)
 *    - MUST NOT mutate context parameter
 *
 * 3. Platform Filtering:
 *    - If platform is 'iOS', rule only runs for iOS apps
 *    - If platform is 'Android', rule only runs for Android apps
 *    - If platform is 'both' or undefined, rule runs for all platforms
 *
 * 4. Severity Mapping:
 *    - 'critical': Security issues, debug builds
 *    - 'high': Significant size savings (>10% of app), duplicate files
 *    - 'medium': Moderate savings (1-10% of app), unoptimized images
 *    - 'low': Minor savings (<1% of app), many files
 *
 * 5. Category Values:
 *    - 'duplicates': Duplicate file detection
 *    - 'optimization': Image/asset optimization, compression
 *    - 'security': Security vulnerabilities (Firebase, API keys)
 *    - 'unused': Unused resources, fonts, libraries
 *    - 'architecture': ABI/architecture issues, framework duplication
 *
 * 6. Priority Levels:
 *    - 'P1': Must-have, high ROI, core value proposition
 *    - 'P2': Should-have, good ROI, enhances offering
 *    - 'P3': Nice-to-have, lower ROI, advanced features
 */

/**
 * Example Implementation
 * ======================
 */

/**
 * @example
 * // Example insight rule for image optimization
 * const imageOptimizationRule = {
 *   id: 'R011',
 *   category: 'optimization',
 *   name: 'Unoptimized Images',
 *   description: 'Detects images that could be compressed using actual testing',
 *   severity: 'high',
 *   platform: 'both',
 *   priority: 'P1',
 *
 *   execute: async (context) => {
 *     const results = [];
 *
 *     // Filter for image files
 *     const images = context.imageFiles || context.allFiles.filter(f =>
 *       /\.(png|jpe?g)$/i.test(f.path)
 *     );
 *
 *     const affectedItems = [];
 *     let totalSavings = 0;
 *
 *     for (const image of images) {
 *       // Check compression cache first
 *       const cached = context.compressionCache?.get(image.hash);
 *
 *       if (cached && cached.savings >= 4096) {
 *         affectedItems.push({
 *           path: image.path,
 *           size: image.size,
 *           reason: `Could save ${formatBytes(cached.savings)} with ${cached.bestFormat.format} compression`,
 *           metadata: { compressionResult: cached }
 *         });
 *         totalSavings += cached.savings;
 *       }
 *     }
 *
 *     if (affectedItems.length > 0) {
 *       results.push({
 *         ruleId: 'R011',
 *         title: `${affectedItems.length} Images Could Be Optimized`,
 *         description: `${affectedItems.length} images could be compressed, saving ${formatBytes(totalSavings)}.`,
 *         severity: 'high',
 *         category: 'optimization',
 *         affectedItems,
 *         potentialSavings: totalSavings,
 *         percentOfTotal: (totalSavings / context.totalInstallSize) * 100,
 *         actionable: true,
 *         fixSuggestion: '## How to Fix\n\n1. Use ImageOptim (Mac) or TinyPNG...',
 *         metadata: {
 *           testedFormats: ['jpeg-85', 'webp-85'],
 *           testDuration: 42300
 *         }
 *       });
 *     }
 *
 *     return results;
 *   },
 *
 *   metadata: {
 *     examples: ['Large PNG screenshots', 'Uncompressed JPEG photos'],
 *     documentation: 'Uses actual compression testing, not estimation',
 *     fixable: false,
 *     requiresWorker: true,
 *     estimatedTime: '30-60s for 100 images'
 *   }
 * };
 */

/**
 * Contract Enforcement
 * ====================
 *
 * Rules are validated at registration time by the insight engine:
 *
 * 1. Type checking (JSDoc annotations)
 * 2. ID uniqueness validation
 * 3. Execute function signature validation
 * 4. Platform value validation
 * 5. Category value validation
 *
 * Invalid rules are rejected with descriptive error messages.
 */

export {};
