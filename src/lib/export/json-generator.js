/**
 * JSON Export Library
 *
 * Pure functions for generating, formatting, and exporting JSON breakdowns.
 * This library is independent of Vue/Pinia and can be tested in isolation.
 *
 * @module lib/export/json-generator
 */

/**
 * Serialize a hierarchical breakdown tree to a clean nested structure.
 *
 * Recursively traverses the tree, preserving the hierarchy and extracting
 * only relevant properties for AI analysis (removes UI-specific fields).
 *
 * @param {Object} node - Node to serialize
 * @returns {Object|null} Serialized tree node with children
 */
export function serializeBreakdownTree(node) {
  if (!node) return null;

  // Build base node structure
  const serialized = {
    path: node.path,
    type: node.isDirectory ? 'directory' : 'file',
    size: node.size,
  };

  // Add optional fields only if they exist (keep JSON clean)
  if (node.compressedSize != null) {
    serialized.compressedSize = node.compressedSize;
  }
  if (node.compressionRatio != null) {
    serialized.compressionRatio = node.compressionRatio;
  }
  if (node.type) {
    serialized.fileType = node.type;
  }
  if (node.category) {
    serialized.category = node.category;
  }

  // Recursively serialize children
  if (node.children && Array.isArray(node.children) && node.children.length > 0) {
    serialized.children = node.children.map(serializeBreakdownTree).filter(Boolean);
  }

  return serialized;
}

/**
 * Build ExportMetadata object from analysis metadata and runtime context.
 *
 * Extracts relevant fields from the analysis metadata and adds export-specific
 * information like timestamp and analyzer version.
 *
 * @param {Object} analysisMetadata - Metadata from analysisStore.currentAnalysis
 * @returns {Object} Complete export metadata object
 */
export function buildExportMetadata(analysisMetadata) {
  return {
    appName: analysisMetadata.appName || 'Unknown',
    version: analysisMetadata.version || '0.0.0',
    bundleId: analysisMetadata.bundleId || analysisMetadata.packageName || 'unknown',
    platform: analysisMetadata.platform || 'Unknown',
    totalSize: analysisMetadata.totalSize || 0,
    exportedAt: new Date().toISOString(),
    analyzerVersion: '1.0.0', // Could be imported from package.json
  };
}

/**
 * Validate export data before JSON generation.
 *
 * Performs sanity checks on metadata and breakdown tree to catch data
 * integrity issues before serialization.
 *
 * @param {Object} breakdownRoot - Root node to validate
 * @param {Object} metadata - Metadata to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateExportData(breakdownRoot, metadata) {
  const errors = [];

  // Validate breakdown root
  if (!breakdownRoot) {
    errors.push('Breakdown root is null or undefined');
  }

  // Validate metadata required fields
  if (!metadata) {
    errors.push('Metadata is null or undefined');
  } else {
    if (!metadata.appName) errors.push('Metadata missing appName');
    if (!metadata.platform) errors.push('Metadata missing platform');
    if (typeof metadata.totalSize !== 'number') errors.push('Metadata totalSize must be a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate formatted JSON export from breakdown tree and metadata.
 *
 * This is the core export function that transforms the hierarchical breakdown
 * tree into a clean, nested JSON structure optimized for AI analysis.
 *
 * @param {Object} breakdownRoot - Root node of the breakdown tree
 * @param {Object} metadata - App metadata object from analysis
 * @param {Object} [options={}] - Optional formatting options
 * @param {number} [options.indent=2] - Number of spaces for JSON indentation
 * @returns {string} Formatted JSON string ready for display/export
 * @throws {Error} If validation fails
 */
export function generateExportJSON(breakdownRoot, metadata, options = {}) {
  // Validate input data
  const validation = validateExportData(breakdownRoot, metadata);
  if (!validation.valid) {
    throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
  }

  // Extract options with defaults
  const { indent = 2 } = options;

  // Serialize the tree into nested structure
  const breakdown = serializeBreakdownTree(breakdownRoot);

  // Build export metadata
  const exportMetadata = buildExportMetadata(metadata);

  // Build export result with nested structure
  const exportResult = {
    metadata: exportMetadata,
    breakdown,
  };

  // Stringify with formatting
  return JSON.stringify(exportResult, null, indent);
}

/**
 * Apply syntax highlighting to JSON string for display.
 *
 * Uses regex-based replacement to wrap JSON tokens (keys, strings, numbers,
 * keywords) in <span> elements with CSS classes for styling.
 *
 * @param {string} jsonString - Formatted JSON string
 * @returns {string} HTML string with syntax highlighting markup
 */
export function highlightJSON(jsonString) {
  if (!jsonString) return '';

  // Apply highlighting in specific order to avoid conflicts:
  // 1. Numbers and keywords first
  // 2. Then string values
  // 3. Finally keys
  let result = jsonString;

  // Highlight numbers (whole numbers and decimals)
  result = result.replace(/:\s*(-?\d+(?:\.\d+)?)\b/g, (match, number) => {
    return `: <span class="json-number">${number}</span>`;
  });

  // Highlight booleans and null
  result = result.replace(/:\s*\b(true|false|null)\b/g, (match, keyword) => {
    return `: <span class="json-keyword">${keyword}</span>`;
  });

  // Highlight string values
  result = result.replace(/:\s*"([^"]*)"/g, (match, value) => {
    return `: <span class="json-string">"${value}"</span>`;
  });

  // Highlight keys (property names) - last to avoid interfering with value highlighting
  result = result.replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>');

  return result;
}

/**
 * Copy text to clipboard using modern Clipboard API with fallback.
 *
 * Attempts to use navigator.clipboard.writeText() first, falls back to
 * legacy document.execCommand('copy') if modern API fails or is unavailable.
 *
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<Object>} Result of copy operation
 */
export async function copyToClipboard(text) {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        method: 'modern',
        error: null,
      };
    } catch (err) {
      // Permission denied or API failed - fall through to legacy method
      console.warn('Clipboard API failed:', err);
    }
  }

  // Fallback to legacy execCommand method
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (success) {
      return {
        success: true,
        method: 'legacy',
        error: null,
      };
    } else {
      return {
        success: false,
        method: null,
        error: 'Copy command failed. Please manually select and copy the JSON.',
      };
    }
  } catch (err) {
    return {
      success: false,
      method: null,
      error: 'Clipboard access denied. Please grant permission or manually copy the JSON.',
    };
  }
}

/**
 * Generate a sanitized filename for JSON export download.
 *
 * Creates a descriptive, unique filename based on app name, platform, and current date.
 * Sanitizes special characters to ensure cross-platform compatibility.
 *
 * @param {string} appName - Application display name
 * @param {string} [platform] - Platform (iOS/Android) - optional
 * @param {string} [suffix='breakdown'] - Optional filename suffix
 * @returns {string} Sanitized filename (e.g., "facebook-android-breakdown-2025-11-23.json")
 */
export function generateExportFilename(appName, platform = null, suffix = 'breakdown') {
  // Sanitize app name:
  // 1. Insert hyphen before capital letters (camelCase -> kebab-case)
  // 2. Replace non-alphanumeric with hyphens
  // 3. Collapse consecutive hyphens
  // 4. Remove leading/trailing hyphens
  // 5. Convert to lowercase
  const sanitized = appName
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Add hyphen before capitals
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .toLowerCase();

  // Generate timestamp in format: YYYY-MM-DD
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // "2025-11-23"

  // Build filename with platform if provided
  const platformPart = platform ? `-${platform.toLowerCase()}` : '';

  return `${sanitized}${platformPart}-${suffix}-${date}.json`;
}

/**
 * Trigger browser download of JSON export file.
 *
 * Creates a temporary blob URL and triggers download using an invisible
 * anchor element. Cleans up blob URL after download starts.
 *
 * @param {string} jsonString - JSON content to download
 * @param {string} filename - Filename for the downloaded file
 * @returns {void}
 */
export function downloadJSONFile(jsonString, filename) {
  // Create blob with JSON content
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create temporary URL
  const url = URL.createObjectURL(blob);

  // Create invisible anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
