/**
 * Formatters - Size display formatting utilities
 */

/**
 * Format bytes to human-readable size (MB, KB, GB)
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format bytes to MB specifically
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Size in MB
 */
export function formatMB(bytes, decimals = 2) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(decimals)} MB`;
}

/**
 * Format bytes to KB specifically
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Size in KB
 */
export function formatKB(bytes, decimals = 1) {
  const kb = bytes / 1024;
  return `${kb.toFixed(decimals)} KB`;
}

/**
 * Format percentage
 * @param {number} value - Numerator value
 * @param {number} total - Denominator value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, total, decimals = 1) {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs.toFixed(0)}s`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format file path for display (show filename and parent directory)
 * @param {string} path - Full file path
 * @returns {string} Formatted path
 */
export function formatPath(path) {
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}
