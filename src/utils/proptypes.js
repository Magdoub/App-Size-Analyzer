/**
 * Custom Vue prop validators for type safety without TypeScript
 * These validators provide runtime validation and better error messages
 * in development mode. They are stripped in production builds.
 */

/**
 * Validates that a prop is a valid file type string
 * @param {string} value - The file type to validate
 * @returns {boolean} True if valid file type
 */
export function validateFileType(value) {
  const validTypes = ['ipa', 'apk', 'aab', 'xapk'];
  return validTypes.includes(value);
}

/**
 * Validates that a prop is a valid parsing status
 * @param {string} value - The status to validate
 * @returns {boolean} True if valid status
 */
export function validateParsingStatus(value) {
  const validStatuses = ['idle', 'parsing', 'success', 'error'];
  return validStatuses.includes(value);
}

/**
 * Validates that a prop is a valid view name
 * @param {string} value - The view name to validate
 * @returns {boolean} True if valid view
 */
export function validateViewName(value) {
  const validViews = ['breakdown', 'xray', 'insights'];
  return validViews.includes(value);
}

/**
 * Validates that a prop is a valid severity level
 * @param {string} value - The severity to validate
 * @returns {boolean} True if valid severity
 */
export function validateSeverity(value) {
  const validSeverities = ['critical', 'warning', 'info', 'all'];
  return validSeverities.includes(value);
}

/**
 * Validates that a prop is a valid insight category
 * @param {string} value - The category to validate
 * @returns {boolean} True if valid category
 */
export function validateInsightCategory(value) {
  const validCategories = ['optimization', 'structure', 'compatibility', 'all'];
  return validCategories.includes(value);
}

/**
 * Validates that a prop is a valid sort direction
 * @param {string} value - The sort direction to validate
 * @returns {boolean} True if valid direction
 */
export function validateSortDirection(value) {
  const validDirections = ['asc', 'desc'];
  return validDirections.includes(value);
}

/**
 * Validates that a prop is a valid sort column
 * @param {string} value - The column name to validate
 * @returns {boolean} True if valid column
 */
export function validateSortColumn(value) {
  const validColumns = ['name', 'size', 'percentage'];
  return validColumns.includes(value);
}

/**
 * Validates that a prop is a valid file category
 * @param {string} value - The category to validate
 * @returns {boolean} True if valid category
 */
export function validateFileCategory(value) {
  const validCategories = ['executable', 'framework', 'resource', 'asset', 'other'];
  return validCategories.includes(value);
}

/**
 * Validates that a prop is a valid node type
 * @param {string} value - The node type to validate
 * @returns {boolean} True if valid type
 */
export function validateNodeType(value) {
  const validTypes = ['file', 'directory'];
  return validTypes.includes(value);
}

/**
 * Validates that a prop is a valid platform
 * @param {string} value - The platform to validate
 * @returns {boolean} True if valid platform
 */
export function validatePlatform(value) {
  const validPlatforms = ['iOS', 'Android'];
  return validPlatforms.includes(value);
}

/**
 * Validates that a prop is a non-negative number
 * @param {number} value - The number to validate
 * @returns {boolean} True if non-negative
 */
export function validateNonNegativeNumber(value) {
  return typeof value === 'number' && value >= 0;
}

/**
 * Validates that a prop is a percentage (0-100)
 * @param {number} value - The percentage to validate
 * @returns {boolean} True if valid percentage
 */
export function validatePercentage(value) {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Validates that a prop is a valid array of file paths
 * @param {Array} value - The array to validate
 * @returns {boolean} True if valid array of strings
 */
export function validateFilePaths(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Validates that a prop is a valid insight object
 * @param {Object} value - The insight to validate
 * @returns {boolean} True if valid insight
 */
export function validateInsight(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    validateSeverity(value.severity) &&
    validateInsightCategory(value.category) &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    Array.isArray(value.affectedFiles) &&
    typeof value.recommendation === 'string'
  );
}

/**
 * Validates that a prop is a valid breakdown node
 * @param {Object} value - The node to validate
 * @returns {boolean} True if valid node
 */
export function validateBreakdownNode(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    typeof value.path === 'string' &&
    validateNonNegativeNumber(value.size) &&
    validateNonNegativeNumber(value.compressedSize) &&
    validatePercentage(value.percentage) &&
    validateNodeType(value.type) &&
    validateFileCategory(value.category)
  );
}
