/**
 * Image Compression Library
 *
 * Provides client-side image compression testing using Canvas API.
 * No external dependencies - uses native browser capabilities only.
 *
 * @see specs/011-insights-improvement/contracts/ImageCompressor.contract.js
 */

/**
 * Check if browser supports WebP encoding
 * Safari does not support WebP encoding via Canvas API (toBlob)
 *
 * @returns {boolean} True if WebP encoding is supported
 *
 * @example
 * if (supportsWebP()) {
 *   console.log('Can test WebP compression');
 * } else {
 *   console.warn('WebP not supported, will test JPEG only (Safari)');
 * }
 */
export function supportsWebP() {
  // Check if canvas and toBlob are available
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  if (!canvas || !canvas.toBlob) return false;

  // Try to create a WebP data URL
  // Safari returns data:, (empty) instead of data:image/webp
  try {
    const webpDataURL = canvas.toDataURL('image/webp');
    return webpDataURL.indexOf('data:image/webp') === 0;
  } catch (err) {
    return false;
  }
}

/**
 * Compress a JPEG image with specified quality
 * Uses Canvas API toBlob() method for compression
 *
 * @param {Blob|File} imageBlob - Original image blob
 * @param {number} quality - Compression quality (0.0-1.0), default 0.85
 * @returns {Promise<{format: string, quality: number, size: number, blob: Blob}>}
 *
 * @example
 * const result = await compressJPEG(imageFile, 0.85);
 * console.log(`Compressed from ${imageFile.size} to ${result.size} bytes`);
 * console.log(`Savings: ${imageFile.size - result.size} bytes`);
 */
export async function compressJPEG(imageBlob, quality = 0.85) {
  if (!imageBlob || !(imageBlob instanceof Blob)) {
    throw new Error('Invalid image blob provided');
  }

  if (quality < 0 || quality > 1) {
    throw new Error('Quality must be between 0.0 and 1.0');
  }

  return new Promise((resolve, reject) => {
    // Create image element to load the blob
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        // Create canvas with same dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Convert to JPEG blob with specified quality
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);

            if (!blob) {
              reject(new Error('Failed to compress JPEG'));
              return;
            }

            resolve({
              format: 'jpeg',
              quality: quality,
              size: blob.size,
              blob: blob
            });
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert image to WebP format with specified quality
 * Falls back gracefully if WebP encoding is not supported (Safari)
 *
 * @param {Blob|File} imageBlob - Original image blob
 * @param {number} quality - Compression quality (0.0-1.0), default 0.85
 * @returns {Promise<{format: string, quality: number, size: number, blob: Blob}|null>}
 *          Returns null if WebP encoding is not supported
 *
 * @example
 * const result = await convertToWebP(imageFile, 0.85);
 * if (result) {
 *   console.log(`WebP size: ${result.size} bytes`);
 * } else {
 *   console.warn('WebP not supported on this browser (Safari)');
 * }
 */
export async function convertToWebP(imageBlob, quality = 0.85) {
  // Check WebP support first
  if (!supportsWebP()) {
    return null; // Safari fallback
  }

  if (!imageBlob || !(imageBlob instanceof Blob)) {
    throw new Error('Invalid image blob provided');
  }

  if (quality < 0 || quality > 1) {
    throw new Error('Quality must be between 0.0 and 1.0');
  }

  return new Promise((resolve, reject) => {
    // Create image element to load the blob
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        // Create canvas with same dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Convert to WebP blob with specified quality
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);

            if (!blob) {
              reject(new Error('Failed to convert to WebP'));
              return;
            }

            // Verify WebP encoding succeeded (Safari workaround)
            if (blob.type !== 'image/webp') {
              resolve(null); // WebP encoding not actually supported
              return;
            }

            resolve({
              format: 'webp',
              quality: quality,
              size: blob.size,
              blob: blob
            });
          },
          'image/webp',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Detect the actual detail level of an image
 * Compares downscaled and full resolution images to determine effective detail
 *
 * @param {Blob|File} imageBlob - Image to analyze
 * @param {number} testResolution - Resolution to test (e.g., 180 for 180x180)
 * @returns {Promise<{width: number, height: number, detailLevel: string, hasFullDetail: boolean}>}
 *
 * @example
 * const result = await detectImageDetailLevel(iconFile, 180);
 * if (!result.hasFullDetail) {
 *   console.log('Icon only has 180x180 detail, can be optimized');
 * }
 */
export async function detectImageDetailLevel(imageBlob, testResolution = 180) {
  if (!imageBlob || !(imageBlob instanceof Blob)) {
    throw new Error('Invalid image blob provided');
  }

  if (testResolution <= 0) {
    throw new Error('Test resolution must be positive');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // If image is already at or below test resolution, it has that detail level
        if (originalWidth <= testResolution || originalHeight <= testResolution) {
          URL.revokeObjectURL(url);
          resolve({
            width: originalWidth,
            height: originalHeight,
            detailLevel: `${Math.max(originalWidth, originalHeight)}x${Math.max(originalWidth, originalHeight)}`,
            hasFullDetail: true // At this size, it has full detail for its resolution
          });
          return;
        }

        // Create two canvases: one downscaled, one full resolution
        const downscaleCanvas = document.createElement('canvas');
        const downscaleCtx = downscaleCanvas.getContext('2d');

        const fullCanvas = document.createElement('canvas');
        const fullCtx = fullCanvas.getContext('2d');

        if (!downscaleCtx || !fullCtx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Downscale to test resolution
        downscaleCanvas.width = testResolution;
        downscaleCanvas.height = testResolution;
        downscaleCtx.drawImage(img, 0, 0, testResolution, testResolution);

        // Draw full resolution
        fullCanvas.width = originalWidth;
        fullCanvas.height = originalHeight;
        fullCtx.drawImage(img, 0, 0);

        // Upscale the downscaled version back to full resolution
        const upscaleCanvas = document.createElement('canvas');
        upscaleCanvas.width = originalWidth;
        upscaleCanvas.height = originalHeight;
        const upscaleCtx = upscaleCanvas.getContext('2d');

        if (!upscaleCtx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get upscale canvas context'));
          return;
        }

        upscaleCtx.drawImage(downscaleCanvas, 0, 0, originalWidth, originalHeight);

        // Compare pixels to detect if there's meaningful detail beyond test resolution
        const fullData = fullCtx.getImageData(0, 0, originalWidth, originalHeight);
        const upscaleData = upscaleCtx.getImageData(0, 0, originalWidth, originalHeight);

        // Sample pixels (every 10th pixel to speed up comparison)
        let differentPixels = 0;
        let totalSamples = 0;
        const sampleInterval = 10;

        for (let i = 0; i < fullData.data.length; i += 4 * sampleInterval) {
          totalSamples++;

          // Compare RGB values (ignore alpha)
          const rDiff = Math.abs(fullData.data[i] - upscaleData.data[i]);
          const gDiff = Math.abs(fullData.data[i + 1] - upscaleData.data[i + 1]);
          const bDiff = Math.abs(fullData.data[i + 2] - upscaleData.data[i + 2]);

          // If any channel differs by more than 10 (threshold for visible difference)
          if (rDiff > 10 || gDiff > 10 || bDiff > 10) {
            differentPixels++;
          }
        }

        URL.revokeObjectURL(url);

        // If less than 5% of sampled pixels differ significantly,
        // the image doesn't have meaningful detail beyond the test resolution
        const differenceRatio = differentPixels / totalSamples;
        const hasFullDetail = differenceRatio > 0.05;

        resolve({
          width: originalWidth,
          height: originalHeight,
          detailLevel: hasFullDetail ?
            `${originalWidth}x${originalHeight}` :
            `${testResolution}x${testResolution}`,
          hasFullDetail
        });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for detail detection'));
    };

    img.src = url;
  });
}
