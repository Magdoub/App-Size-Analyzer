/**
 * JSON Export Library Tests
 *
 * Unit tests for JSON generation and export functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  serializeBreakdownTree,
  buildExportMetadata,
  validateExportData,
  generateExportJSON,
  highlightJSON,
  copyToClipboard,
  generateExportFilename,
  downloadJSONFile,
} from './json-generator';

describe('serializeBreakdownTree', () => {
  it('should preserve nested tree structure', () => {
    const tree = {
      name: 'root',
      path: 'root',
      size: 3000,
      isDirectory: true,
      children: [
        {
          name: 'file1.txt',
          path: 'root/file1.txt',
          size: 1000,
          isDirectory: false,
          type: 'txt',
          category: 'documents',
        },
        {
          name: 'subdir',
          path: 'root/subdir',
          size: 2000,
          isDirectory: true,
          children: [
            {
              name: 'file2.txt',
              path: 'root/subdir/file2.txt',
              size: 2000,
              isDirectory: false,
              type: 'txt',
              category: 'documents',
            },
          ],
        },
      ],
    };

    const serialized = serializeBreakdownTree(tree);

    expect(serialized.type).toBe('directory');
    expect(serialized.children).toHaveLength(2);
    expect(serialized.children[0].path).toBe('root/file1.txt');
    expect(serialized.children[0].type).toBe('file');
    expect(serialized.children[1].type).toBe('directory');
    expect(serialized.children[1].children).toHaveLength(1);
  });

  it('should handle null tree', () => {
    const serialized = serializeBreakdownTree(null);
    expect(serialized).toBeNull();
  });

  it('should include file metadata properties', () => {
    const tree = {
      name: 'Info.plist',
      path: 'app.ipa/Info.plist',
      size: 1000,
      compressedSize: 500,
      compressionRatio: 0.5,
      type: 'plist',
      category: 'configuration',
      isDirectory: false,
    };

    const serialized = serializeBreakdownTree(tree);

    expect(serialized).toEqual({
      path: 'app.ipa/Info.plist',
      type: 'file',
      size: 1000,
      compressedSize: 500,
      compressionRatio: 0.5,
      fileType: 'plist',
      category: 'configuration',
    });
  });

  it('should omit optional properties when missing', () => {
    const tree = {
      name: 'file.txt',
      path: 'file.txt',
      size: 100,
      isDirectory: false,
    };

    const serialized = serializeBreakdownTree(tree);

    expect(serialized).toEqual({
      path: 'file.txt',
      type: 'file',
      size: 100,
    });
    expect(serialized).not.toHaveProperty('compressedSize');
    expect(serialized).not.toHaveProperty('fileType');
  });
});

describe('buildExportMetadata', () => {
  it('should build metadata with all required fields', () => {
    const analysisMetadata = {
      appName: 'MyApp',
      version: '1.2.3',
      bundleId: 'com.example.myapp',
      platform: 'iOS',
      totalSize: 52428800,
    };

    const metadata = buildExportMetadata(analysisMetadata);

    expect(metadata.appName).toBe('MyApp');
    expect(metadata.version).toBe('1.2.3');
    expect(metadata.bundleId).toBe('com.example.myapp');
    expect(metadata.platform).toBe('iOS');
    expect(metadata.totalSize).toBe(52428800);
    expect(metadata.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601 format
    expect(metadata.analyzerVersion).toBe('1.0.0');
  });

  it('should handle missing optional fields with defaults', () => {
    const analysisMetadata = {
      platform: 'Android',
    };

    const metadata = buildExportMetadata(analysisMetadata);

    expect(metadata.appName).toBe('Unknown');
    expect(metadata.version).toBe('0.0.0');
    expect(metadata.bundleId).toBe('unknown');
    expect(metadata.platform).toBe('Android');
    expect(metadata.totalSize).toBe(0);
  });

  it('should use packageName as fallback for bundleId', () => {
    const analysisMetadata = {
      appName: 'AndroidApp',
      packageName: 'com.example.androidapp',
      platform: 'Android',
      totalSize: 10000000,
    };

    const metadata = buildExportMetadata(analysisMetadata);

    expect(metadata.bundleId).toBe('com.example.androidapp');
  });
});

describe('validateExportData', () => {
  it('should pass validation for valid data', () => {
    const breakdownRoot = {
      name: 'app',
      path: 'app',
      size: 1000,
      isDirectory: true,
    };

    const metadata = {
      appName: 'MyApp',
      platform: 'iOS',
      totalSize: 1000,
    };

    const result = validateExportData(breakdownRoot, metadata);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should fail if breakdownRoot is null', () => {
    const metadata = {
      appName: 'MyApp',
      platform: 'iOS',
      totalSize: 1000,
    };

    const result = validateExportData(null, metadata);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Breakdown root is null or undefined');
  });

  it('should fail if metadata is null', () => {
    const breakdownRoot = {
      name: 'app',
      path: 'app',
      size: 1000,
      isDirectory: true,
    };

    const result = validateExportData(breakdownRoot, null);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Metadata is null or undefined');
  });

  it('should fail if metadata is missing required fields', () => {
    const breakdownRoot = {
      name: 'app',
      path: 'app',
      size: 1000,
      isDirectory: true,
    };

    const metadata = {
      // Missing appName, platform, totalSize
    };

    const result = validateExportData(breakdownRoot, metadata);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Metadata missing appName');
    expect(result.errors).toContain('Metadata missing platform');
    expect(result.errors).toContain('Metadata totalSize must be a number');
  });
});

describe('generateExportJSON', () => {
  it('should generate valid JSON with nested breakdown structure', () => {
    const breakdownRoot = {
      name: 'MyApp.app',
      path: 'Payload/MyApp.app',
      size: 10000,
      isDirectory: true,
      children: [
        {
          name: 'Info.plist',
          path: 'Payload/MyApp.app/Info.plist',
          size: 1000,
          compressedSize: 500,
          type: 'plist',
          category: 'configuration',
          isDirectory: false,
        },
      ],
    };

    const metadata = {
      appName: 'MyApp',
      version: '1.0.0',
      bundleId: 'com.example.myapp',
      platform: 'iOS',
      totalSize: 10000,
    };

    const result = generateExportJSON(breakdownRoot, metadata);

    // Verify valid JSON
    expect(() => JSON.parse(result)).not.toThrow();

    // Verify structure
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('metadata');
    expect(parsed).toHaveProperty('breakdown');
    expect(parsed.breakdown.type).toBe('directory');
    expect(parsed.breakdown.children).toHaveLength(1);
    expect(parsed.breakdown.children[0].path).toBe('Payload/MyApp.app/Info.plist');
    expect(parsed.breakdown.children[0].type).toBe('file');
  });

  it('should throw error if validation fails', () => {
    expect(() => {
      generateExportJSON(null, null);
    }).toThrow('Export validation failed');
  });

  it('should preserve nested hierarchy in export', () => {
    const breakdownRoot = {
      name: 'app',
      path: 'app',
      size: 3000,
      isDirectory: true,
      children: [
        {
          name: 'folder',
          path: 'app/folder',
          size: 2000,
          isDirectory: true,
          children: [
            {
              name: 'nested.txt',
              path: 'app/folder/nested.txt',
              size: 2000,
              isDirectory: false,
            },
          ],
        },
        {
          name: 'file.txt',
          path: 'app/file.txt',
          size: 1000,
          isDirectory: false,
        },
      ],
    };

    const metadata = {
      appName: 'App',
      platform: 'iOS',
      totalSize: 3000,
    };

    const result = generateExportJSON(breakdownRoot, metadata);
    const parsed = JSON.parse(result);

    expect(parsed.breakdown.children).toHaveLength(2);
    expect(parsed.breakdown.children[0].type).toBe('directory');
    expect(parsed.breakdown.children[0].children).toHaveLength(1);
    expect(parsed.breakdown.children[0].children[0].type).toBe('file');
  });
});

describe('highlightJSON', () => {
  it('should highlight JSON keys', () => {
    const json = '{"appName": "MyApp"}';
    const highlighted = highlightJSON(json);

    expect(highlighted).toContain('<span class="json-key">"appName":</span>');
  });

  it('should highlight string values', () => {
    const json = '{"appName": "MyApp"}';
    const highlighted = highlightJSON(json);

    expect(highlighted).toContain('<span class="json-string">"MyApp"</span>');
  });

  it('should highlight numbers', () => {
    const json = '{"size": 1024}';
    const highlighted = highlightJSON(json);

    expect(highlighted).toContain('<span class="json-number">1024</span>');
  });

  it('should highlight booleans and null', () => {
    const json = '{"active": true, "inactive": false, "data": null}';
    const highlighted = highlightJSON(json);

    expect(highlighted).toContain('<span class="json-keyword">true</span>');
    expect(highlighted).toContain('<span class="json-keyword">false</span>');
    expect(highlighted).toContain('<span class="json-keyword">null</span>');
  });

  it('should return empty string for empty input', () => {
    expect(highlightJSON('')).toBe('');
    expect(highlightJSON(null)).toBe('');
  });
});

describe('copyToClipboard', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should use modern Clipboard API when available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const result = await copyToClipboard('test content');

    expect(writeTextMock).toHaveBeenCalledWith('test content');
    expect(result).toEqual({
      success: true,
      method: 'modern',
      error: null,
    });
  });

  it('should fall back to execCommand when Clipboard API fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    // Mock execCommand
    document.execCommand = vi.fn().mockReturnValue(true);

    const result = await copyToClipboard('test content');

    expect(result.success).toBe(true);
    expect(result.method).toBe('legacy');
  });

  it('should return error when both methods fail', async () => {
    // Clipboard API not available
    Object.assign(navigator, {
      clipboard: undefined,
    });

    // execCommand fails
    document.execCommand = vi.fn().mockReturnValue(false);

    const result = await copyToClipboard('test content');

    expect(result.success).toBe(false);
    expect(result.method).toBe(null);
    expect(result.error).toContain('Copy command failed');
  });
});

describe('generateExportFilename', () => {
  it('should generate filename with app name and timestamp', () => {
    const filename = generateExportFilename('MyApp');

    expect(filename).toMatch(/^my-app-breakdown-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
  });

  it('should sanitize special characters in app name', () => {
    const filename = generateExportFilename('My Cool App!');

    expect(filename).toMatch(/^my-cool-app-breakdown-/);
    expect(filename).not.toContain('!');
    expect(filename).not.toContain(' ');
  });

  it('should use custom suffix when provided', () => {
    const filename = generateExportFilename('MyApp', 'export');

    expect(filename).toMatch(/^my-app-export-/);
  });

  it('should handle emojis and unicode characters', () => {
    const filename = generateExportFilename('My App 🚀');

    expect(filename).toMatch(/^my-app-breakdown-/);
  });
});

describe('downloadJSONFile', () => {
  beforeEach(() => {
    // Mock DOM methods
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create blob and trigger download', () => {
    const jsonString = '{"test": "data"}';
    const filename = 'test-export.json';

    downloadJSONFile(jsonString, filename);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should set correct download filename', () => {
    const jsonString = '{"test": "data"}';
    const filename = 'my-app-breakdown.json';

    // Spy on createElement to capture the link element
    const createElementSpy = vi.spyOn(document, 'createElement');

    downloadJSONFile(jsonString, filename);

    const calls = createElementSpy.mock.calls;
    const linkCall = calls.find((call) => call[0] === 'a');
    expect(linkCall).toBeDefined();
  });
});
