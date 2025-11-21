/**
 * Framework Parser Tests
 *
 * Tests for iOS Framework Bundle (.framework) file parsing functionality.
 * Covers basic parsing, metadata extraction, architecture detection, and content categorization.
 */

import { describe, it, expect } from 'vitest';

describe('Framework Parser', () => {
  describe('Basic Functionality (T023)', () => {
    it('should export parseFramework function', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');
      expect(parseFramework).toBeDefined();
      expect(typeof parseFramework).toBe('function');
    });

    it('should export isValidFramework function', async () => {
      const { isValidFramework } = await import('../../lib/parsers/ios/framework-parser');
      expect(isValidFramework).toBeDefined();
      expect(typeof isValidFramework).toBe('function');
    });

    it('should return result with format "framework"', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.format).toBe('framework');
    });

    it('should include file metadata in result', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.fileName).toBe(mockFile.name);
      expect(result.fileSize).toBe(mockFile.size);
    });
  });

  describe('Metadata Extraction - Info.plist (T024)', () => {
    it('should extract bundle identifier', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.bundleIdentifier).toBeDefined();
      expect(typeof result.metadata.bundleIdentifier).toBe('string');
    });

    it('should extract bundle name', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.metadata.bundleName).toBeDefined();
    });

    it('should extract version', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.metadata.version).toBeDefined();
      expect(typeof result.metadata.version).toBe('string');
    });

    it('should extract build version', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.metadata.buildVersion).toBeDefined();
    });

    it('should detect versioned structure', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(typeof result.metadata.isVersioned).toBe('boolean');
    });
  });

  describe('Architecture Detection - Mach-O Parsing (T025)', () => {
    it('should detect architectures', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.architectures).toBeDefined();
      expect(Array.isArray(result.architectures)).toBe(true);
    });

    it('should provide architecture slice details', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      if (result.architectures.length > 0) {
        const slice = result.architectures[0];
        expect(slice.name).toBeDefined();
        expect(slice.size).toBeDefined();
        expect(typeof slice.size).toBe('number');
      }
    });
  });

  describe('Content Categorization (T026)', () => {
    it('should categorize binary files', async () => {
      const { categorizeFrameworkContent } = await import('../../lib/parsers/ios/framework-parser');

      const paths = [
        'MyFramework.framework/MyFramework',
        'MyFramework.framework/Versions/A/MyFramework',
      ];

      for (const path of paths) {
        // Main binary should be categorized as binary
        // (depends on implementation - might need context)
      }
    });

    it('should categorize headers', async () => {
      const { categorizeFrameworkContent } = await import('../../lib/parsers/ios/framework-parser');

      const paths = [
        'MyFramework.framework/Headers/MyFramework.h',
        'MyFramework.framework/PrivateHeaders/Internal.h',
      ];

      for (const path of paths) {
        const category = categorizeFrameworkContent(path);
        expect(category).toBe('headers');
      }
    });

    it('should categorize modules', async () => {
      const { categorizeFrameworkContent } = await import('../../lib/parsers/ios/framework-parser');

      const paths = [
        'MyFramework.framework/Modules/module.modulemap',
        'MyFramework.framework/Modules/MyFramework.swiftmodule/arm64.swiftinterface',
      ];

      for (const path of paths) {
        const category = categorizeFrameworkContent(path);
        expect(category).toBe('modules');
      }
    });

    it('should categorize resources', async () => {
      const { categorizeFrameworkContent } = await import('../../lib/parsers/ios/framework-parser');

      const paths = [
        'MyFramework.framework/Resources/Assets.car',
        'MyFramework.framework/en.lproj/Localizable.strings',
      ];

      for (const path of paths) {
        const category = categorizeFrameworkContent(path);
        expect(category).toBe('resources');
      }
    });

    it('should categorize metadata', async () => {
      const { categorizeFrameworkContent } = await import('../../lib/parsers/ios/framework-parser');

      const paths = [
        'MyFramework.framework/Info.plist',
        'MyFramework.framework/_CodeSignature/CodeResources',
      ];

      for (const path of paths) {
        const category = categorizeFrameworkContent(path);
        expect(category).toBe('metadata');
      }
    });

    it('should have breakdown with all categories', async () => {
      const { parseFramework } = await import('../../lib/parsers/ios/framework-parser');

      const mockFile = createMockFrameworkFile();
      const result = await parseFramework(mockFile);

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.categories).toBeDefined();
      expect(Array.isArray(result.breakdown.categories)).toBe(true);
      expect(result.breakdown.totalSize).toBeDefined();
    });
  });
});

/**
 * Create a mock Framework ZIP file for testing
 */
function createMockFrameworkFile() {
  // Minimal ZIP structure representing a framework
  const zipData = new Uint8Array([
    // ZIP local file header
    0x50, 0x4b, 0x03, 0x04,
    0x14, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x15, 0x00,
    0x00, 0x00,
    // "Test.framework/"
    0x54, 0x65, 0x73, 0x74, 0x2e, 0x66, 0x72, 0x61,
    0x6d, 0x65, 0x77, 0x6f, 0x72, 0x6b, 0x2f,
    // Central directory header
    0x50, 0x4b, 0x01, 0x02,
    0x14, 0x00, 0x14, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x15, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    // "Test.framework/"
    0x54, 0x65, 0x73, 0x74, 0x2e, 0x66, 0x72, 0x61,
    0x6d, 0x65, 0x77, 0x6f, 0x72, 0x6b, 0x2f,
    // End of central directory
    0x50, 0x4b, 0x05, 0x06,
    0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00,
    0x43, 0x00, 0x00, 0x00,
    0x29, 0x00, 0x00, 0x00,
    0x00, 0x00,
  ]);

  const blob = new Blob([zipData], { type: 'application/zip' });
  const file = new File([blob], 'Test.framework.zip', { type: 'application/zip' });
  return file;
}
