/**
 * Insight Types
 *
 * Type definitions for the rule-based analysis engine and optimization recommendations
 */

/**
 * @typedef {'duplicates'|'optimization'|'unused'|'over-bundling'|'compression'|'architecture'} InsightCategory
 *
 * Insight categories:
 * - duplicates: Duplicate files
 * - optimization: Asset optimization opportunities
 * - unused: Unused resources
 * - over-bundling: Excessive bundling
 * - compression: Compression opportunities
 * - architecture: Multi-arch bloat
 */

/**
 * @typedef {'critical'|'high'|'medium'|'low'} InsightSeverity
 */

/**
 * InsightRule - Defines a reusable analysis pattern
 *
 * @typedef {Object} InsightRule
 * @property {string} id - Rule ID (e.g., "R001")
 * @property {InsightCategory} category - Rule category
 * @property {string} name - Rule name
 * @property {string} description - Rule description
 * @property {InsightSeverity} severity - Severity level
 * @property {function(Object): Promise<InsightResult[]>} execute - Execution function
 * @property {Object} [metadata] - Additional metadata
 * @property {string[]} [metadata.examples] - Example cases
 * @property {string} [metadata.documentation] - Documentation URL
 * @property {boolean} [metadata.fixable] - Can be auto-fixed
 */

/**
 * InsightResult - Finding from a rule execution
 *
 * @typedef {Object} InsightResult
 * @property {string} ruleId - Reference to InsightRule.id
 * @property {string} title - Display title
 * @property {string} description - Detailed description
 * @property {InsightSeverity} severity - Severity level
 * @property {InsightCategory} category - Category
 * @property {AffectedItem[]} affectedItems - Affected files or components
 * @property {number} potentialSavings - Estimated bytes saved
 * @property {number} percentOfTotal - Percentage of total app size
 * @property {boolean} actionable - Can user take action
 * @property {string} [fixSuggestion] - How to fix
 */

/**
 * AffectedItem - Specific file or component flagged by an insight
 *
 * @typedef {Object} AffectedItem
 * @property {string} path - File path
 * @property {number} size - File size
 * @property {string} reason - Why it's flagged
 * @property {Record<string, unknown>} [metadata] - Additional context
 */

/**
 * InsightEngineConfig - Configuration for insight engine
 *
 * @typedef {Object} InsightEngineConfig
 * @property {InsightRule[]} rules - List of insight rules
 * @property {Set<InsightCategory>} enabledCategories - Enabled categories
 * @property {InsightSeverity} minimumSeverity - Minimum severity level
 * @property {boolean} cacheResults - Whether to cache results
 */

/**
 * InsightExecutionContext - Context passed to rules during execution
 *
 * @typedef {Object} InsightExecutionContext
 * @property {string} fileId - UUID v4
 * @property {Date} timestamp - Analysis timestamp
 * @property {string} platform - Platform (iOS or Android)
 * @property {string} appName - Application name
 * @property {string} bundleId - Bundle identifier or package name
 * @property {string} version - Version string
 * @property {number} [versionCode] - Android version code
 * @property {number} totalInstallSize - Uncompressed size
 * @property {number} totalDownloadSize - Compressed size
 * @property {Object} breakdownRoot - Root of file tree
 * @property {string[]} frameworks - Framework node IDs
 * @property {string[]} assets - Asset node IDs
 * @property {string[]} localizations - Localization node IDs
 * @property {string[]} executables - Executable node IDs
 * @property {string[]} nativeLibraries - Native library node IDs
 * @property {string[]} dexFiles - DEX file node IDs
 * @property {string[]} modules - Module node IDs
 * @property {Object[]} allFiles - Flat file list
 * @property {Map<string, string>} [fileHashes] - File hashes map
 * @property {string} [buildType] - Build type
 * @property {string} [compilerOptimization] - Compiler optimization
 * @property {function(string): Object|undefined} getNodeByPath - Get node by path
 * @property {function(string): Promise<string>} computeFileHash - Compute file hash
 * @property {function(): Promise<Map<string, string[]>>} findDuplicatesByHash - Find duplicates
 */

// Export empty object to make this a module
export {};
