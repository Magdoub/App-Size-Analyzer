/**
 * Content Type Detection
 *
 * Detects file types based on path, extension, and magic bytes
 */

/**
 * @typedef {'framework' | 'bundle' | 'localization' | 'dex' | 'native_lib' | 'resource' | 'asset' | 'executable' | 'image' | 'video' | 'audio' | 'font' | 'data' | 'config' | 'protobuf' | 'header' | 'module' | 'metadata' | 'other' | 'unknown'} ContentType
 */

/**
 * Detect content type from file path and extension
 * @param {string} path - File path
 * @returns {ContentType} Detected content type
 */
export function detectContentType(path) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const pathLower = path.toLowerCase();

  // Check file extension first (more specific than folder paths)

  // Images - check before folder paths
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heif', 'heic', 'svg', 'bmp', 'ico'];
  if (imageExts.includes(ext)) {
    return 'image';
  }

  // Videos
  const videoExts = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm', '3gp'];
  if (videoExts.includes(ext)) {
    return 'video';
  }

  // Audio
  const audioExts = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'];
  if (audioExts.includes(ext)) {
    return 'audio';
  }

  // Fonts
  const fontExts = ['ttf', 'otf', 'woff', 'woff2', 'eot'];
  if (fontExts.includes(ext)) {
    return 'font';
  }

  // Data files
  const dataExts = ['json', 'xml', 'plist', 'yaml', 'yml', 'csv', 'txt', 'md'];
  if (dataExts.includes(ext)) {
    return 'data';
  }

  // Config files
  const configExts = ['config', 'conf', 'ini', 'properties', 'toml'];
  if (configExts.includes(ext)) {
    return 'config';
  }

  // Protobuf files (AAB)
  if (ext === 'pb') {
    return 'protobuf';
  }

  // Header files (Framework)
  if (ext === 'h' || ext === 'hpp' || ext === 'hxx') {
    return 'header';
  }

  // Module files (Framework)
  if (ext === 'modulemap' || ext === 'swiftmodule' || ext === 'swiftinterface') {
    return 'module';
  }

  // Android DEX files
  if (ext === 'dex' || pathLower.includes('classes.dex')) {
    return 'dex';
  }

  // Native libraries
  if (ext === 'so') {
    return 'native_lib';
  }

  // Executables
  if (ext === 'dylib' || ext === 'a' || ext === 'o') {
    return 'executable';
  }
  if (pathLower.includes('/mach')) {
    return 'executable';
  }

  // Now check folder-based classifications (less specific)

  // iOS-specific folders
  if (pathLower.includes('.framework/')) {
    return 'framework';
  }
  if (pathLower.includes('.bundle/')) {
    return 'bundle';
  }
  if (pathLower.includes('.lproj/')) {
    return 'localization';
  }

  // Framework-specific folders
  if (pathLower.includes('/headers/') || pathLower.includes('/privateheaders/')) {
    return 'header';
  }
  if (pathLower.includes('/modules/')) {
    return 'module';
  }
  if (pathLower.includes('/_codesignature/')) {
    return 'metadata';
  }

  // Android res/ folder - only for non-extension files or unknown extensions
  if (pathLower.startsWith('res/') || pathLower.includes('/res/')) {
    return 'resource';
  }

  // Android assets/ folder
  if (pathLower.startsWith('assets/') || pathLower.includes('/assets/')) {
    return 'asset';
  }

  // AAB manifest folder
  if (pathLower.includes('/manifest/')) {
    return 'metadata';
  }

  return 'unknown';
}

/**
 * Detect if a file is an image based on path
 * @param {string} path - File path
 * @returns {boolean} True if file is an image
 */
export function isImage(path) {
  return detectContentType(path) === 'image';
}

/**
 * Detect if a file is a video based on path
 * @param {string} path - File path
 * @returns {boolean} True if file is a video
 */
export function isVideo(path) {
  return detectContentType(path) === 'video';
}

/**
 * Detect image resolution/scale from filename
 * Returns 1x, 2x, 3x, @2x, @3x, or undefined
 * @param {string} path - File path
 * @returns {string | undefined} Image scale factor
 */
export function detectImageScale(path) {
  const filename = path.split('/').pop() || '';

  // iOS retina scales
  if (filename.includes('@3x')) return '@3x';
  if (filename.includes('@2x')) return '@2x';

  // Android density suffixes
  if (path.includes('-xxxhdpi')) return '4x';
  if (path.includes('-xxhdpi')) return '3x';
  if (path.includes('-xhdpi')) return '2x';
  if (path.includes('-hdpi')) return '1.5x';
  if (path.includes('-mdpi')) return '1x';
  if (path.includes('-ldpi')) return '0.75x';

  return undefined;
}

/**
 * Detect architecture from path (Android native libs)
 * @param {string} path - File path
 * @returns {string | undefined} Architecture identifier
 */
export function detectArchitecture(path) {
  const pathLower = path.toLowerCase();

  if (pathLower.includes('arm64-v8a')) return 'arm64-v8a';
  if (pathLower.includes('armeabi-v7a')) return 'armeabi-v7a';
  if (pathLower.includes('armeabi')) return 'armeabi';
  if (pathLower.includes('x86_64')) return 'x86_64';
  if (pathLower.includes('x86')) return 'x86';
  if (pathLower.includes('mips64')) return 'mips64';
  if (pathLower.includes('mips')) return 'mips';

  // iOS architectures
  if (pathLower.includes('arm64')) return 'arm64';
  if (pathLower.includes('armv7')) return 'armv7';
  if (pathLower.includes('x86_64')) return 'x86_64';
  if (pathLower.includes('i386')) return 'i386';

  return undefined;
}

/**
 * Check if file path is in asset catalog
 * @param {string} path - File path
 * @returns {boolean} True if file is in asset catalog
 */
export function isInAssetCatalog(path) {
  return path.toLowerCase().includes('.car') || path.toLowerCase().includes('assets.car');
}

/**
 * Detect if file is a localization resource
 * @param {string} path - File path
 * @returns {boolean} True if file is a localization resource
 */
export function isLocalization(path) {
  const pathLower = path.toLowerCase();
  return (
    pathLower.includes('.lproj/') ||
    pathLower.includes('values-') ||
    pathLower.includes('/strings.xml') ||
    pathLower.endsWith('.strings')
  );
}

/**
 * Extract language code from localization path
 * @param {string} path - File path
 * @returns {string | undefined} Language code (e.g., 'en', 'en-US')
 */
export function extractLanguageCode(path) {
  // iOS .lproj format
  const lprojMatch = path.match(/([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)\.lproj/);
  if (lprojMatch) {
    return lprojMatch[1];
  }

  // Android values-XX format
  const valuesMatch = path.match(/values-([a-zA-Z]{2}(?:-r[a-zA-Z]{2})?)/);
  if (valuesMatch) {
    return valuesMatch[1];
  }

  // Base localization
  if (path.includes('Base.lproj') || path.includes('values/')) {
    return 'base';
  }

  return undefined;
}

/**
 * Get file extension
 * @param {string} path - File path
 * @returns {string} File extension (lowercase)
 */
export function getExtension(path) {
  return path.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get filename from path
 * @param {string} path - File path
 * @returns {string} Filename
 */
export function getFilename(path) {
  return path.split('/').pop() || '';
}

/**
 * Get directory path from file path
 * @param {string} path - File path
 * @returns {string} Directory path
 */
export function getDirectory(path) {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
}
