/**
 * Compression Worker
 *
 * Web Worker for image compression testing using Canvas API.
 * Runs compression tests in background thread to avoid blocking the UI.
 *
 * Technologies:
 * - OffscreenCanvas for image manipulation
 * - Canvas API toBlob() for format conversion and compression
 * - Comlink for Worker communication
 */

import { expose } from 'comlink';

/**
 * Check if browser supports WebP encoding
 * Safari does not support WebP encoding via Canvas API
 *
 * @returns {Promise<boolean>} True if WebP encoding is supported
 */
async function supportsWebP() {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.5 });
    return blob.type === 'image/webp';
  } catch {
    return false;
  }
}

/**
 * Compress image to JPEG format with specified quality
 *
 * @param {Blob|File} imageFile - Original image file
 * @param {number} quality - JPEG quality (0.0-1.0), default 0.85
 * @returns {Promise<Blob>} Compressed JPEG blob
 */
async function compressJPEG(imageFile, quality = 0.85) {
  const bitmap = await createImageBitmap(imageFile);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality
  });

  bitmap.close(); // Free memory
  return blob;
}

/**
 * Convert image to WebP format with specified quality
 * Falls back to JPEG for browsers without WebP encoding support (Safari)
 *
 * @param {Blob|File} imageFile - Original image file
 * @param {number} quality - WebP quality (0.0-1.0), default 0.85
 * @returns {Promise<Blob>} Compressed WebP blob (or JPEG fallback)
 */
async function convertToWebP(imageFile, quality = 0.85) {
  // Check WebP support and fall back to JPEG for Safari
  const hasWebPSupport = await supportsWebP();
  if (!hasWebPSupport) {
    return compressJPEG(imageFile, quality);
  }

  const bitmap = await createImageBitmap(imageFile);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality
  });

  bitmap.close(); // Free memory
  return blob;
}

/**
 * Test all compression formats and return results
 *
 * @param {Blob|File} imageFile - Original image file
 * @param {Object} options - Compression options
 * @param {number} options.jpegQuality - JPEG quality (default 0.85)
 * @param {number} options.webpQuality - WebP quality (default 0.85)
 * @returns {Promise<Object>} Compression test results
 */
async function testAllFormats(imageFile, options = {}) {
  const { jpegQuality = 0.85, webpQuality = 0.85 } = options;

  const startTime = performance.now();

  // Test JPEG compression (universal support)
  const jpegBlob = await compressJPEG(imageFile, jpegQuality);

  // Test WebP conversion (with Safari fallback)
  const webpBlob = await convertToWebP(imageFile, webpQuality);

  const testDuration = performance.now() - startTime;

  // Determine which format produced better results
  const testedFormats = [
    {
      format: 'jpeg',
      quality: jpegQuality,
      size: jpegBlob.size,
      blob: jpegBlob
    },
    {
      format: webpBlob.type === 'image/webp' ? 'webp' : 'jpeg-fallback',
      quality: webpQuality,
      size: webpBlob.size,
      blob: webpBlob
    }
  ];

  // Find best format (smallest size)
  const bestFormat = testedFormats.reduce((best, current) =>
    current.size < best.size ? current : best
  );

  const savings = imageFile.size - bestFormat.size;
  const reductionPercent = (savings / imageFile.size) * 100;

  return {
    originalFormat: imageFile.type || 'unknown',
    originalSize: imageFile.size,
    testedFormats,
    bestFormat,
    savings,
    reductionPercent,
    testDuration
  };
}

/**
 * Detect the detail level of an image (for iOS alternate icon detection)
 * Uses edge detection and frequency analysis to determine if image was
 * downscaled from higher resolution vs natively created at current size
 *
 * @param {Blob|File} imageFile - Image file to analyze
 * @returns {Promise<Object>} Detail analysis result
 */
async function detectImageDetailLevel(imageFile) {
  const bitmap = await createImageBitmap(imageFile);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const data = imageData.data;

  // Simple edge detection: count high-frequency changes
  let edgeCount = 0;
  const threshold = 30; // Color difference threshold

  for (let y = 0; y < bitmap.height - 1; y++) {
    for (let x = 0; x < bitmap.width - 1; x++) {
      const i = (y * bitmap.width + x) * 4;
      const iRight = (y * bitmap.width + (x + 1)) * 4;
      const iDown = ((y + 1) * bitmap.width + x) * 4;

      // Calculate color difference with right neighbor
      const diffRight = Math.abs(data[i] - data[iRight]) +
                       Math.abs(data[i + 1] - data[iRight + 1]) +
                       Math.abs(data[i + 2] - data[iRight + 2]);

      // Calculate color difference with bottom neighbor
      const diffDown = Math.abs(data[i] - data[iDown]) +
                      Math.abs(data[i + 1] - data[iDown + 1]) +
                      Math.abs(data[i + 2] - data[iDown + 2]);

      if (diffRight > threshold || diffDown > threshold) {
        edgeCount++;
      }
    }
  }

  const totalPixels = bitmap.width * bitmap.height;
  const edgeRatio = edgeCount / totalPixels;

  // High edge ratio (>5%) suggests detailed image (1024x1024 detail level)
  // Low edge ratio suggests simple/blurred image (180x180 detail level)
  const detailLevel = edgeRatio > 0.05 ? '1024x1024' : '180x180';

  bitmap.close(); // Free memory

  return {
    width: bitmap.width,
    height: bitmap.height,
    edgeRatio,
    detailLevel,
    canOptimize: detailLevel === '1024x1024' && bitmap.width === 1024 && bitmap.height === 1024
  };
}

// Expose worker API via Comlink
const compressionService = {
  supportsWebP,
  compressJPEG,
  convertToWebP,
  testAllFormats,
  detectImageDetailLevel
};

expose(compressionService);
