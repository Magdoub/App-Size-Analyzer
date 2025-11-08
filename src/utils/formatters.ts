/**
 * Formatters - Size display formatting utilities
 */

/**
 * Format bytes to human-readable size (MB, KB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format bytes to MB specifically
 */
export function formatMB(bytes: number, decimals: number = 2): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(decimals)} MB`;
}

/**
 * Format bytes to KB specifically
 */
export function formatKB(bytes: number, decimals: number = 1): string {
  const kb = bytes / 1024;
  return `${kb.toFixed(decimals)} KB`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs.toFixed(0)}s`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format file path for display (show filename and parent directory)
 */
export function formatPath(path: string): string {
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}
