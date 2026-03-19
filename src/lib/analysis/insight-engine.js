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
    rules.forEach((rule) => { this.registerRule(rule); });
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
   * Prepare indexed context with imageFiles, fontFiles, and other preprocessed data
   * @param {AnalysisContext} context - Original analysis context
   * @returns {AnalysisContext} Enhanced context with indexes
   */
  #prepareContext(context) {
    // Create enhanced context with image and font file indexes
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.heic'];
    const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];

    // Filter image files
    const imageFiles = context.allFiles.filter((file) => {
      const ext = file.path.toLowerCase().split('.').pop();
      return imageExtensions.includes(`.${ext}`);
    });

    // Filter font files
    const fontFiles = context.allFiles.filter((file) => {
      const ext = file.path.toLowerCase().split('.').pop();
      return fontExtensions.includes(`.${ext}`);
    });

    // Initialize compression cache if not present
    const compressionCache = context.compressionCache || new Map();

    // Initialize duplicate groups if not present
    const duplicateGroups = context.duplicateGroups || new Map();

    console.log(`[InsightEngine] Indexed ${imageFiles.length} images, ${fontFiles.length} fonts`);

    return {
      ...context,
      imageFiles,
      fontFiles,
      compressionCache,
      duplicateGroups
    };
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

    // Prepare context with indexed data (imageFiles, fontFiles, etc.)
    const enhancedContext = this.#prepareContext(context);

    console.log(`[InsightEngine] Executing ${this.#rules.size} rules...`);
    const results = [];

    // Execute all rules in parallel
    const rulePromises = Array.from(this.#rules.values()).map(async (rule) => {
      try {
        console.log(`[InsightEngine] Executing rule ${rule.id}: ${rule.name}`);
        const ruleResults = await rule.execute(enhancedContext);
        return ruleResults;
      } catch (error) {
        console.error(`[InsightEngine] Rule ${rule.id} failed:`, error);
        return [];
      }
    });

    const ruleResultArrays = await Promise.all(rulePromises);

    // Flatten results (handle arrays, single objects, and null/undefined)
    ruleResultArrays.forEach((ruleResults) => {
      if (!ruleResults) return; // Skip null/undefined
      if (Array.isArray(ruleResults)) {
        results.push(...ruleResults);
      } else {
        // Single result object
        results.push(ruleResults);
      }
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
        if (!ruleResults) continue;
        if (Array.isArray(ruleResults)) {
          results.push(...ruleResults);
        } else {
          results.push(ruleResults);
        }
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
        if (!ruleResults) continue;
        if (Array.isArray(ruleResults)) {
          results.push(...ruleResults);
        } else {
          results.push(ruleResults);
        }
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
 * Get file-specific optimization recommendation and estimated savings
 * @param {string} path - File path
 * @param {number} size - File size in bytes
 * @param {string} type - File type
 * @returns {{recommendation: string, savingsPercent: number, estimatedSize: number}}
 */
function getFileOptimizationDetails(path, size, type) {
  const ext = path.toLowerCase().split('.').pop();
  const fileName = path.split('/').pop();

  // Image files - legacy formats
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'].includes(ext)) {
    const formatNote = ext === 'bmp' ? 'BMP is uncompressed - convert to PNG/WebP for major savings.' :
                       ext === 'gif' ? 'If animated, consider video format. If static, convert to PNG/WebP.' :
                       'Consider WebP format if not already optimized. Use "Run Compression Test" to verify actual savings.';
    return {
      recommendation: formatNote,
      savingsPercent: ext === 'bmp' ? 0.9 : 0.2, // Conservative unless BMP
      estimatedSize: Math.round(size * (ext === 'bmp' ? 0.1 : 0.8)),
    };
  }

  // Modern image formats - already optimized
  if (['webp', 'heic', 'heif', 'avif'].includes(ext)) {
    return {
      recommendation: 'Already using modern format. Check if resolution matches actual display size needed.',
      savingsPercent: 0.1,
      estimatedSize: Math.round(size * 0.9),
    };
  }

  // Video files
  if (['mp4', 'mov', 'avi', 'mkv', 'm4v', 'webm'].includes(ext)) {
    return {
      recommendation: 'Move to CDN streaming, use on-demand resources, or compress with H.265/VP9',
      savingsPercent: 0.95, // Can remove entirely via streaming
      estimatedSize: 0, // Stream instead of bundle
    };
  }

  // Audio files
  if (['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'].includes(ext)) {
    return {
      recommendation: ext === 'wav' || ext === 'flac'
        ? 'Convert to AAC/MP3 (128kbps usually sufficient), or stream from CDN'
        : 'Consider streaming from CDN, or reduce bitrate if quality allows',
      savingsPercent: ext === 'wav' ? 0.9 : ext === 'flac' ? 0.7 : 0.5,
      estimatedSize: Math.round(size * (ext === 'wav' ? 0.1 : ext === 'flac' ? 0.3 : 0.5)),
    };
  }

  // DEX files (Android code)
  if (ext === 'dex' || type === 'dex') {
    return {
      recommendation: 'Enable R8/ProGuard with aggressive shrinking, remove unused code paths',
      savingsPercent: 0.25,
      estimatedSize: Math.round(size * 0.75),
    };
  }

  // Native libraries (.so files)
  if (ext === 'so' || path.includes('/lib/')) {
    return {
      recommendation: 'Strip debug symbols, remove unused architectures (keep arm64 only for modern devices)',
      savingsPercent: 0.4,
      estimatedSize: Math.round(size * 0.6),
    };
  }

  // SPO files (Facebook specific optimized resources)
  if (ext === 'spo') {
    return {
      recommendation: 'Facebook-specific optimized format. Review if all contained assets are needed',
      savingsPercent: 0.15,
      estimatedSize: Math.round(size * 0.85),
    };
  }

  // Hermes bytecode (React Native)
  if (ext === 'hbc' || fileName.includes('hermes')) {
    return {
      recommendation: 'Enable tree-shaking, remove unused npm packages, split code with dynamic imports',
      savingsPercent: 0.2,
      estimatedSize: Math.round(size * 0.8),
    };
  }

  // JavaScript bundles
  if (['js', 'jsbundle'].includes(ext)) {
    return {
      recommendation: 'Enable tree-shaking, remove unused dependencies, use code splitting',
      savingsPercent: 0.3,
      estimatedSize: Math.round(size * 0.7),
    };
  }

  // Font files
  if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
    return {
      recommendation: 'Subset fonts to include only used characters, convert to WOFF2 format',
      savingsPercent: 0.5,
      estimatedSize: Math.round(size * 0.5),
    };
  }

  // JSON/data files
  if (['json', 'plist', 'xml'].includes(ext)) {
    return {
      recommendation: 'Large data payload. Consider: (1) load from server on-demand instead of bundling, (2) split into smaller chunks loaded as needed, (3) remove unused data fields.',
      savingsPercent: 0.5, // Can often be loaded on-demand
      estimatedSize: Math.round(size * 0.5),
    };
  }

  // Resource files (Android)
  if (ext === 'arsc' || path.includes('resources.arsc')) {
    return {
      recommendation: 'Use Android App Bundle to deliver only needed language/density resources. Can reduce by ~50% with proper configuration.',
      savingsPercent: 0.5,
      estimatedSize: Math.round(size * 0.5),
    };
  }

  // XZS compressed files (Facebook specific)
  if (ext === 'xzs' || ext === 'bin') {
    return {
      recommendation: 'Pre-compressed data file. If unused, remove entirely (100% savings). Otherwise, verify all data is needed at runtime.',
      savingsPercent: 0.15, // Conservative: assume needed but can be trimmed
      estimatedSize: Math.round(size * 0.85),
    };
  }

  // META-INF files (signature/manifest) - skip, not optimizable
  if (path.includes('META-INF/')) {
    return null; // Signal to exclude from insights
  }

  // Asset files (generic)
  if (type === 'asset' || path.includes('/assets/')) {
    return {
      recommendation: 'Check if asset is actually used in code. If unused: remove (100% savings). If used: consider lazy-loading from CDN.',
      savingsPercent: 0.3, // Conservative estimate assuming partial optimization
      estimatedSize: Math.round(size * 0.7),
    };
  }

  // Default/unknown
  return {
    recommendation: 'Unknown file type. Check if required - if unused, safe to remove (100% savings). If needed, no optimization available.',
    savingsPercent: 0.1, // Very conservative for unknown files
    estimatedSize: Math.round(size * 0.9),
  };
}

/**
 * Rule: Identify top 10 largest files
 * @param {AnalysisContext} context - Analysis context
 * @returns {Promise<import('../../types/analysis.js').EnhancedInsightResult>} Enhanced insight result
 */
export async function ruleLargeFilesTop10(context) {
  // Flatten tree to leaf nodes only
  const flattenToLeaves = (node) => {
    if (!node.children || node.children.length === 0) {
      return [node];
    }
    return node.children.flatMap(flattenToLeaves);
  };

  const leaves = flattenToLeaves(context.breakdownRoot);

  // Filter out non-optimizable files (META-INF, etc.) before sorting
  const optimizableLeaves = leaves.filter((file) => {
    const details = getFileOptimizationDetails(file.path, file.size, file.type);
    return details !== null; // Exclude files that return null (not optimizable)
  });

  const sorted = optimizableLeaves.sort((a, b) => b.size - a.size).slice(0, 10);

  const totalAffectedSize = sorted.reduce((sum, f) => sum + f.size, 0);
  const percentageOfApp = (totalAffectedSize / context.totalInstallSize) * 100;

  // Calculate actual potential savings based on file-specific optimizations
  let totalEstimatedSavings = 0;
  const filesWithDetails = sorted.map((file, index) => {
    const details = getFileOptimizationDetails(file.path, file.size, file.type);
    const savings = file.size - details.estimatedSize;
    totalEstimatedSavings += savings;

    return {
      path: file.path,
      size: file.size,
      type: file.type,
      context: `#${index + 1} - ${((file.size / context.totalInstallSize) * 100).toFixed(1)}% of app install size`,
      recommendation: details.recommendation,
      estimatedSizeAfter: details.estimatedSize,
      potentialSavings: savings,
    };
  });

  return {
    ruleId: 'large-files-top-10',
    severity: 'medium',
    category: 'size-optimization',
    title: 'Top 10 Largest Files',
    description: `These ${sorted.length} files total ${(totalAffectedSize / 1024 / 1024).toFixed(1)}MB install size (${percentageOfApp.toFixed(1)}% of your app install size). Estimated savings: ${(totalEstimatedSavings / 1024 / 1024).toFixed(1)}MB install size if optimized.`,
    affectedFiles: filesWithDetails,
    recommendation:
      `Each file above has a specific recommendation. General strategies:\n
• Images: Convert PNG/JPG to WebP (25-35% smaller)\n
• Video/Audio: Stream from CDN instead of bundling (up to 95% savings)\n
• Code/DEX: Enable R8/ProGuard shrinking (20-30% reduction)\n
• Native libs: Strip debug symbols, use arm64 only (30-50% smaller)\n\n
Focus on the top 3-5 files first for maximum impact.`,
    potentialSavings: totalEstimatedSavings,
    metadata: {
      totalAffectedSize,
      percentageOfApp,
      estimatedSizeAfter: totalAffectedSize - totalEstimatedSavings,
    },
  };
}

/**
 * Rule: Identify images that could benefit from format optimization
 *
 * This rule detects images where ZIP compression provides minimal benefit,
 * indicating they may benefit from modern format conversion (WebP, HEIC).
 *
 * Note: High ZIP compression ratio (close to 1.0) means the image is already
 * in a compressed format (PNG, JPEG) but may still benefit from format conversion.
 *
 * @param {AnalysisContext} context - Analysis context
 * @returns {Promise<import('../../types/analysis.js').EnhancedInsightResult>} Enhanced insight result
 */
export async function ruleUncompressedImages(context) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
  // Exclude already-modern formats that are well optimized
  const modernFormats = ['.webp', '.heic', '.heif', '.avif'];

  const optimizableImages = context.allFiles
    .filter((file) => {
      const ext = `.${file.path.toLowerCase().split('.').pop()}`;
      // Include legacy formats, exclude modern formats
      return imageExtensions.includes(ext) && !modernFormats.includes(ext) && file.compressedSize;
    })
    .filter((file) => {
      // Focus on larger images (>10KB) that would benefit from optimization
      return file.installSize > 10240;
    })
    .sort((a, b) => b.installSize - a.installSize)
    .slice(0, 20); // Top 20 images by size

  if (optimizableImages.length === 0) {
    return null;
  }

  const totalAffectedSize = optimizableImages.reduce((sum, f) => sum + f.installSize, 0);
  const percentageOfApp = (totalAffectedSize / context.totalInstallSize) * 100;

  // Calculate file-specific savings
  let totalEstimatedSavings = 0;
  const filesWithDetails = optimizableImages.map((file) => {
    const ext = file.path.toLowerCase().split('.').pop();
    // Conservative estimates - actual savings depend on image content
    const savingsPercent = ext === 'bmp' ? 0.9 : ext === 'png' ? 0.2 : 0.15;
    const estimatedSizeAfter = Math.round(file.installSize * (1 - savingsPercent));
    const savings = file.installSize - estimatedSizeAfter;
    totalEstimatedSavings += savings;

    const recommendation = ext === 'bmp' ? 'BMP is uncompressed - convert to PNG/WebP for major savings.' :
                           ext === 'png' ? 'Try WebP lossless. Use "Run Compression Test" to verify actual savings.' :
                           ext === 'gif' ? 'If static, convert to PNG/WebP. If animated, consider video.' :
                           'Try WebP format. Use "Run Compression Test" to verify actual savings.';

    return {
      path: file.path,
      size: file.installSize,
      type: file.type,
      recommendation,
      estimatedSizeAfter,
      potentialSavings: savings,
    };
  });

  return {
    ruleId: 'uncompressed-images',
    severity: 'high',
    category: 'compression',
    title: 'Images Eligible for Format Optimization',
    description: `Found ${optimizableImages.length} images (${percentageOfApp.toFixed(1)}% of app install size). Use "Run Compression Test" to verify actual savings on your device.`,
    affectedFiles: filesWithDetails,
    recommendation:
      `Image optimization action plan:\n
1. **Quick wins (automated tools)**:\n
   • Run ImageOptim (Mac), TinyPNG, or Squoosh on all images\n
   • Expected reduction: 40-70% with no visible quality loss\n
   • Time investment: 5-10 minutes\n\n
2. **Format modernization**:\n
   • Convert PNG to WebP (70-90% smaller, lossless)\n
   • Convert JPG to WebP or HEIF (25-35% smaller)\n
   • iOS: Use HEIC format (native support iOS 11+)\n
   • Android: Use WebP (native support Android 4.0+)\n\n
3. **Resolution optimization**:\n
   • Audit @3x images - many devices only need @2x\n
   • Use vector formats (SVG, PDF) for icons and simple graphics\n
   • Remove unused image variants (landscape-only, tablet-specific)\n\n
4. **Advanced techniques**:\n
   • Enable asset catalog compression in Xcode (iOS)\n
   • Use Android App Bundle with density splits\n
   • Consider on-demand resources for rarely-used images\n\n
**Estimated savings**: Up to ${(totalEstimatedSavings / 1024 / 1024).toFixed(1)}MB install size (~${((totalEstimatedSavings / context.totalInstallSize) * 100).toFixed(0)}% of total app install size). Run compression test for accurate results.`,
    potentialSavings: totalEstimatedSavings,
    metadata: {
      totalAffectedSize,
      percentageOfApp,
    },
  };
}

/**
 * Rule: Analyze framework sizes against typical benchmarks
 * @param {AnalysisContext} context - Analysis context
 * @returns {Promise<import('../../types/analysis.js').EnhancedInsightResult | null>} Enhanced insight result or null
 */
export async function ruleFrameworkSizeAnalysis(context) {
  // Framework size benchmarks (in bytes) - typical sizes
  const frameworkBenchmarks = {
    react: 50 * 1024 * 1024, // 50MB typical for React Native
    firebase: 30 * 1024 * 1024, // 30MB
    flutter: 40 * 1024 * 1024, // 40MB
  };

  const largeFrameworks = [];

  // Find framework nodes
  context.frameworks.forEach((frameworkPath) => {
    const node = findNodeByPath(context.breakdownRoot, frameworkPath);
    if (!node) return;

    // Check against benchmarks
    const frameworkName = node.name.toLowerCase();
    let benchmark = null;
    let benchmarkName = null;

    Object.entries(frameworkBenchmarks).forEach(([name, size]) => {
      if (frameworkName.includes(name)) {
        benchmark = size;
        benchmarkName = name;
      }
    });

    if (benchmark && node.size > benchmark * 1.5) {
      // 50% larger than typical
      largeFrameworks.push({
        node,
        benchmark,
        benchmarkName,
        ratio: node.size / benchmark,
      });
    }
  });

  if (largeFrameworks.length === 0) {
    return null;
  }

  const totalAffectedSize = largeFrameworks.reduce((sum, fw) => sum + fw.node.size, 0);
  const percentageOfApp = (totalAffectedSize / context.totalInstallSize) * 100;
  const potentialSavings = largeFrameworks.reduce(
    (sum, fw) => sum + (fw.node.size - fw.benchmark),
    0
  );

  return {
    ruleId: 'framework-size-analysis',
    severity: 'high',
    category: 'size-optimization',
    title: 'Large Frameworks Detected',
    description: `Found ${largeFrameworks.length} frameworks that are ${largeFrameworks[0]?.ratio.toFixed(1)}x larger than typical implementations (${percentageOfApp.toFixed(1)}% of app install size). This often indicates included debug symbols, unused modules, or missing optimizations.`,
    affectedFiles: largeFrameworks.map((fw) => ({
      path: fw.node.path,
      size: fw.node.size,
      type: fw.node.type,
      context: `${fw.ratio.toFixed(1)}x typical ${fw.benchmarkName} size (expected: ${(fw.benchmark / 1024 / 1024).toFixed(1)}MB, actual: ${(fw.node.size / 1024 / 1024).toFixed(1)}MB)`,
    })),
    recommendation:
      `Framework optimization checklist:\n
1. **React Native specific**:\n
   • Enable Hermes engine (50% smaller, faster startup)\n
   • Remove unused native modules from Podfile/build.gradle\n
   • Use react-native-bundle-visualizer to find bloat\n
   • Strip development warnings in production builds\n\n
2. **Firebase specific**:\n
   • Only include needed services (e.g., Analytics + Crashlytics, not full suite)\n
   • Disable automatic screen tracking if unused\n
   • Use dynamic links carefully (adds 2-3MB)\n
   • Consider Firebase Lite SDKs for basic features\n\n
3. **Flutter specific**:\n
   • Build with --split-debug-info and --obfuscate\n
   • Remove unused widgets and plugins\n
   • Use deferred loading for large packages\n
   • Enable --tree-shake-icons flag\n\n
4. **General framework optimization**:\n
   • Verify you're using release builds, not debug\n
   • Enable ProGuard/R8 (Android) with aggressive rules\n
   • Strip debug symbols: arm64 apps should have minimal symbols\n
   • Check for duplicate dependencies (use dependency analyzer)\n\n
5. **Alternative approaches**:\n
   • Evaluate if full framework is needed (e.g., Firebase → Supabase for lighter weight)\n
   • Consider feature flags to lazy-load framework features\n
   • Use platform-specific implementations for critical features\n\n
**Expected savings**: ${(potentialSavings / 1024 / 1024).toFixed(1)}MB by applying these optimizations. Start with debug symbol stripping and unused module removal for quick wins.`,
    potentialSavings: Math.round(potentialSavings * 0.5), // Conservative 50% reduction estimate
    metadata: {
      totalAffectedSize,
      percentageOfApp,
    },
  };
}

/**
 * Rule: Detect large media files that could be streamed
 * @param {AnalysisContext} context - Analysis context
 * @returns {Promise<import('../../types/analysis.js').EnhancedInsightResult | null>} Enhanced insight result or null
 */
export async function ruleLargeMediaFiles(context) {
  const mediaExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.m4a', '.aac', '.flac'];
  const largeSizeThreshold = 5 * 1024 * 1024; // 5MB

  const largeMediaFiles = context.allFiles
    .filter((file) => {
      const ext = file.path.toLowerCase().split('.').pop();
      return mediaExtensions.includes(`.${ext}`) && file.installSize > largeSizeThreshold;
    })
    .sort((a, b) => b.installSize - a.installSize);

  if (largeMediaFiles.length === 0) {
    return null;
  }

  const totalAffectedSize = largeMediaFiles.reduce((sum, f) => sum + f.installSize, 0);
  const percentageOfApp = (totalAffectedSize / context.totalInstallSize) * 100;
  const potentialSavings = Math.round(totalAffectedSize * 0.95); // Nearly all can be removed via streaming

  return {
    ruleId: 'large-media-files',
    severity: 'critical',
    category: 'size-optimization',
    title: 'Large Media Files Bundled in App',
    description: `Found ${largeMediaFiles.length} large audio/video files (${percentageOfApp.toFixed(1)}% of app install size). Bundling media reduces available storage on users' devices and increases download time. Consider streaming or on-demand download instead.`,
    affectedFiles: largeMediaFiles.map((file) => ({
      path: file.path,
      size: file.installSize,
      type: file.type,
      context: `${(file.installSize / 1024 / 1024).toFixed(1)}MB install size - ${((file.installSize / context.totalInstallSize) * 100).toFixed(1)}% of app install size`,
    })),
    recommendation:
      `Media delivery best practices:\n
1. **Streaming approach** (recommended):\n
   • Host media on CDN (AWS CloudFront, Cloudflare, Akamai)\n
   • Implement progressive download with caching\n
   • Use adaptive bitrate streaming (HLS for video, multiple quality levels for audio)\n
   • Expected app install size reduction: ~${(totalAffectedSize / 1024 / 1024).toFixed(0)}MB\n\n
2. **On-demand resources** (iOS specific):\n
   • Tag media as on-demand in Xcode\n
   • Download only when feature is accessed\n
   • iOS automatically manages storage and cleanup\n
   • Reduces initial download by ${percentageOfApp.toFixed(0)}%\n\n
3. **App Bundle with dynamic delivery** (Android):\n
   • Move media to dynamic feature modules\n
   • Download on-demand via Play Core Library\n
   • User controls when to download (wifi-only option)\n\n
4. **Hybrid approach** (best user experience):\n
   • Bundle small preview/thumbnail clips (< 500KB)\n
   • Stream full-quality on user interaction\n
   • Cache streamed content locally for offline access\n
   • Implement background download for anticipated needs\n\n
5. **If bundling is required**:\n
   • Compress video with H.265/HEVC (50% smaller than H.264)\n
   • Reduce resolution/bitrate - most mobile screens don't need 4K\n
   • Convert audio to AAC with appropriate bitrate (128kbps often sufficient)\n
   • Remove audio tracks from video if not needed\n\n
**Impact**: Implementing streaming can reduce your app install size by ${(potentialSavings / 1024 / 1024).toFixed(1)}MB, making it ${((potentialSavings / context.totalInstallSize) * 100).toFixed(0)}% smaller and significantly improving download conversion rates.`,
    potentialSavings,
    metadata: {
      totalAffectedSize,
      percentageOfApp,
      fileCount: largeMediaFiles.length,
    },
  };
}

/**
 * Rule: Detect unused resources (common patterns)
 * @param {AnalysisContext} context - Analysis context
 * @returns {Promise<import('../../types/analysis.js').EnhancedInsightResult | null>} Enhanced insight result or null
 */
export async function ruleUnusedResources(context) {
  // Look for common patterns of unused resources
  const suspiciousPatterns = [
    { pattern: /test[_-]?data/i, category: 'Test Data' },
    { pattern: /sample|example|demo/i, category: 'Demo/Sample Files' },
    { pattern: /\.DS_Store|Thumbs\.db|desktop\.ini/i, category: 'System Files' },
    { pattern: /_old|_backup|_copy|_unused/i, category: 'Backup/Old Files' },
    { pattern: /\.orig|\.bak|\.tmp/i, category: 'Temporary Files' },
  ];

  const suspiciousFiles = [];

  suspiciousPatterns.forEach(({ pattern, category }) => {
    const matches = context.allFiles.filter((file) => pattern.test(file.path));
    matches.forEach((file) => {
      suspiciousFiles.push({
        ...file,
        suspiciousCategory: category,
      });
    });
  });

  if (suspiciousFiles.length === 0) {
    return null;
  }

  const totalAffectedSize = suspiciousFiles.reduce((sum, f) => sum + f.installSize, 0);
  const percentageOfApp = (totalAffectedSize / context.totalInstallSize) * 100;

  // Only return insight if significant (> 0.5% of app)
  if (percentageOfApp < 0.5) {
    return null;
  }

  return {
    ruleId: 'unused-resources',
    severity: 'medium',
    category: 'size-optimization',
    title: 'Potentially Unused Resources Detected',
    description: `Found ${suspiciousFiles.length} files with naming patterns suggesting they may be unused (${percentageOfApp.toFixed(1)}% of app install size). These include test data, samples, backups, or system files that shouldn't be in production builds.`,
    affectedFiles: suspiciousFiles.slice(0, 30).map((file) => ({
      path: file.path,
      size: file.installSize,
      type: file.type,
      context: `${file.suspiciousCategory}`,
    })),
    recommendation:
      `Resource cleanup strategy:\n
1. **Audit and verify**:\n
   • Check if files are actually referenced in code (use "Find Usages" in IDE)\n
   • Review build configuration to ensure test/demo files are excluded\n
   • Verify .gitignore and build ignore patterns are working\n\n
2. **Common culprits**:\n
   • **Test data**: Move to separate test target/build variant\n
   • **Sample files**: Remove from production, keep in development only\n
   • **System files** (.DS_Store, Thumbs.db): Add to .gitignore and clean repo\n
   • **Backup files**: Delete from source control (history is in git)\n\n
3. **Build system fixes**:\n
   • Xcode: Verify "Copy Bundle Resources" only includes needed files\n
   • Android: Update build.gradle to exclude patterns (e.g., 'assets/test/**')\n
   • React Native: Configure Metro bundler to exclude test files\n\n
4. **Automated detection**:\n
   • Add pre-build validation script to detect suspicious patterns\n
   • Use tools like unused-webpack-plugin (React Native) or swift-outdated (iOS)\n
   • Enable warnings for unreferenced resources in IDE\n\n
**Expected savings**: ${(totalAffectedSize / 1024 / 1024).toFixed(1)}MB install size by removing genuinely unused resources. Start with obvious candidates like backup files and system cruft.`,
    potentialSavings: Math.round(totalAffectedSize * 0.9), // Assume 90% are truly unused
    metadata: {
      totalAffectedSize,
      percentageOfApp,
      fileCount: suspiciousFiles.length,
    },
  };
}

/**
 * Register enhanced insight rules
 * @param {InsightEngine} engine - Insight engine
 * @returns {void}
 */
export function registerEnhancedInsightRules(engine) {
  engine.registerRule({
    id: 'large-files-top-10',
    name: 'Large Files Detection',
    category: 'size-optimization',
    severity: 'medium',
    execute: ruleLargeFilesTop10,
  });

  engine.registerRule({
    id: 'uncompressed-images',
    name: 'Uncompressed Images',
    category: 'compression',
    severity: 'high',
    execute: ruleUncompressedImages,
  });

  engine.registerRule({
    id: 'framework-size-analysis',
    name: 'Framework Size Analysis',
    category: 'size-optimization',
    severity: 'high',
    execute: ruleFrameworkSizeAnalysis,
  });

  engine.registerRule({
    id: 'large-media-files',
    name: 'Large Media Files',
    category: 'size-optimization',
    severity: 'critical',
    execute: ruleLargeMediaFiles,
  });

  engine.registerRule({
    id: 'unused-resources',
    name: 'Unused Resources',
    category: 'size-optimization',
    severity: 'medium',
    execute: ruleUnusedResources,
  });
}

/**
 * Create fully configured insight engine with all rules registered
 * This is the recommended way to create an insight engine for production use
 * @returns {InsightEngine} Insight engine
 */
export function createDefaultInsightEngine() {
  const engine = new InsightEngine(true); // Enable caching

  // Register enhanced insight rules
  registerEnhancedInsightRules(engine);

  return engine;
}
