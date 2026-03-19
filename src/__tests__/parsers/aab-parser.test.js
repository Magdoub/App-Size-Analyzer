/**
 * AAB Parser Tests
 *
 * Tests for Android App Bundle (.aab) file parsing functionality.
 * Covers basic parsing, metadata extraction, and content categorization.
 */

import { describe, expect, it, } from 'vitest';

// Tests will import parser once implemented
// import { parseAAB, isValidAAB, categorizeAABContent } from '../../lib/parsers/android/aab-parser';

describe('AAB Parser', () => {
  describe('Basic Functionality (T011)', () => {
    it('should export parseAAB function', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');
      expect(parseAAB).toBeDefined();
      expect(typeof parseAAB).toBe('function');
    });

    it('should export isValidAAB function', async () => {
      const { isValidAAB } = await import('../../lib/parsers/android/aab-parser');
      expect(isValidAAB).toBeDefined();
      expect(typeof isValidAAB).toBe('function');
    });

    it('should return result with format "aab"', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      // Create minimal valid AAB-like file
      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.format).toBe('aab');
    });

    it('should include file metadata in result', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.fileName).toBe(mockFile.name);
      expect(result.fileSize).toBe(mockFile.size);
    });

    it('should reject invalid files', async () => {
      const { isValidAAB } = await import('../../lib/parsers/android/aab-parser');

      // Create non-AAB file
      const _invalidFile = new Blob(['not a zip'], { type: 'text/plain' });
      const entries = [];

      const isValid = isValidAAB(entries);
      expect(isValid).toBe(false);
    });
  });

  describe('Metadata Extraction (T012)', () => {
    it('should extract package name from manifest', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.packageName).toBeDefined();
      expect(typeof result.metadata.packageName).toBe('string');
    });

    it('should extract version code', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.metadata.versionCode).toBeDefined();
      expect(typeof result.metadata.versionCode).toBe('number');
    });

    it('should extract version name', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.metadata.versionName).toBeDefined();
      expect(typeof result.metadata.versionName).toBe('string');
    });

    it('should detect modules', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.modules).toBeDefined();
      expect(Array.isArray(result.modules)).toBe(true);
      expect(result.modules.length).toBeGreaterThan(0);

      // Should have at least base module
      const baseModule = result.modules.find((m) => m.isBase);
      expect(baseModule).toBeDefined();
    });
  });

  describe('Content Categorization (T013)', () => {
    it('should categorize DEX files', async () => {
      const { categorizeAABContent } = await import('../../lib/parsers/android/aab-parser');

      const path = 'base/dex/classes.dex';
      const category = categorizeAABContent(path);

      expect(category).toBe('dex');
    });

    it('should categorize resources', async () => {
      const { categorizeAABContent } = await import('../../lib/parsers/android/aab-parser');

      const path = 'base/res/drawable/icon.png';
      const category = categorizeAABContent(path);

      expect(category).toBe('resources');
    });

    it('should categorize assets', async () => {
      const { categorizeAABContent } = await import('../../lib/parsers/android/aab-parser');

      const path = 'base/assets/fonts/custom.ttf';
      const category = categorizeAABContent(path);

      expect(category).toBe('assets');
    });

    it('should categorize native libraries', async () => {
      const { categorizeAABContent } = await import('../../lib/parsers/android/aab-parser');

      const path = 'base/lib/arm64-v8a/libnative.so';
      const category = categorizeAABContent(path);

      expect(category).toBe('native');
    });

    it('should categorize protobuf config files', async () => {
      const { categorizeAABContent } = await import('../../lib/parsers/android/aab-parser');

      const configPaths = [
        'base/manifest/AndroidManifest.xml',
        'BundleConfig.pb',
        'base/resources.pb',
      ];

      for (const path of configPaths) {
        const category = categorizeAABContent(path);
        expect(category).toBe('config');
      }
    });

    it('should have breakdown with all categories', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.categories).toBeDefined();
      expect(Array.isArray(result.breakdown.categories)).toBe(true);

      // Check that we have size information
      expect(result.breakdown.totalSize).toBeDefined();
      expect(typeof result.breakdown.totalSize).toBe('number');
    });

    it('should detect architectures from native libs', async () => {
      const { parseAAB } = await import('../../lib/parsers/android/aab-parser');

      const mockFile = createMockAABFile();
      const result = await parseAAB(mockFile);

      expect(result.architectures).toBeDefined();
      expect(Array.isArray(result.architectures)).toBe(true);
    });
  });
});

/**
 * Create a mock AAB file for testing
 * This creates a minimal valid ZIP structure that resembles an AAB
 */
function createMockAABFile() {
  // This is a minimal ZIP file structure
  // In real tests, we would use actual AAB fixtures
  const zipData = new Uint8Array([
    // ZIP local file header (minimal)
    0x50, 0x4b, 0x03, 0x04, // Local file header signature
    0x14, 0x00, // Version needed
    0x00, 0x00, // General purpose flags
    0x00, 0x00, // Compression method (stored)
    0x00, 0x00, // Last mod time
    0x00, 0x00, // Last mod date
    0x00, 0x00, 0x00, 0x00, // CRC-32
    0x00, 0x00, 0x00, 0x00, // Compressed size
    0x00, 0x00, 0x00, 0x00, // Uncompressed size
    0x05, 0x00, // File name length
    0x00, 0x00, // Extra field length
    0x62, 0x61, 0x73, 0x65, 0x2f, // "base/"
    // Central directory header
    0x50, 0x4b, 0x01, 0x02, // Central directory header signature
    0x14, 0x00, // Version made by
    0x14, 0x00, // Version needed
    0x00, 0x00, // General purpose flags
    0x00, 0x00, // Compression method
    0x00, 0x00, // Last mod time
    0x00, 0x00, // Last mod date
    0x00, 0x00, 0x00, 0x00, // CRC-32
    0x00, 0x00, 0x00, 0x00, // Compressed size
    0x00, 0x00, 0x00, 0x00, // Uncompressed size
    0x05, 0x00, // File name length
    0x00, 0x00, // Extra field length
    0x00, 0x00, // File comment length
    0x00, 0x00, // Disk number start
    0x00, 0x00, // Internal file attributes
    0x00, 0x00, 0x00, 0x00, // External file attributes
    0x00, 0x00, 0x00, 0x00, // Relative offset of local header
    0x62, 0x61, 0x73, 0x65, 0x2f, // "base/"
    // End of central directory
    0x50, 0x4b, 0x05, 0x06, // EOCD signature
    0x00, 0x00, // Number of this disk
    0x00, 0x00, // Disk with central directory
    0x01, 0x00, // Number of entries on disk
    0x01, 0x00, // Total entries
    0x33, 0x00, 0x00, 0x00, // Size of central directory
    0x1e, 0x00, 0x00, 0x00, // Offset of central directory
    0x00, 0x00, // Comment length
  ]);

  const blob = new Blob([zipData], { type: 'application/octet-stream' });
  const file = new File([blob], 'test.aab', { type: 'application/octet-stream' });
  return file;
}
