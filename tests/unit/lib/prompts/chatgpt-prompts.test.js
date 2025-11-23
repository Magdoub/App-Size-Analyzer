/**
 * Unit tests for ChatGPT Prompt Generator
 */

import { describe, it, expect } from 'vitest';
import {
  generateIndividualPrompt,
  generateSectionPrompt,
  generateChatGPTUrl,
} from '../../../../src/lib/prompts/chatgpt-prompts.js';

describe('ChatGPT Prompt Generator', () => {
  describe('generateIndividualPrompt', () => {
    it('generates prompt with iOS persona for IPA', () => {
      const params = {
        platform: 'iOS',
        format: 'ipa',
        appName: 'MyApp',
        bundleId: 'com.example.myapp',
        version: '1.0.0',
        totalSize: 50 * 1024 * 1024, // 50 MB
        totalDownloadSize: 45 * 1024 * 1024, // 45 MB
        affectedFiles: [
          {
            path: 'Frameworks/FacebookSDK.framework/FacebookSDK',
            size: 15 * 1024 * 1024, // 15 MB
          },
        ],
        totalAffectedSize: 15 * 1024 * 1024,
        percentOfTotal: 30,
        category: 'over-bundling',
        insightTitle: 'Large Framework Detected',
        insightDescription: 'Large framework detected',
        insightRecommendation: 'Consider dynamic linking or removing unused SDK features',
      };

      const result = generateIndividualPrompt(params);

      expect(result.prompt).toContain('iOS Architect');
      expect(result.prompt).toContain('50 MB'); // Total size
      expect(result.prompt).toContain('IPA');
      expect(result.prompt).toContain('Frameworks/FacebookSDK.framework/FacebookSDK');
      expect(result.prompt).toContain('15 MB'); // File size
      expect(result.prompt).toContain('30.0%');
      expect(result.prompt).toContain('Bundle ID: com.example.myapp');
      expect(result.prompt).toContain('Xcode settings');
      expect(result.prompt).toContain('EXACT steps');
      expect(result.prompt).toContain('I don\'t know how to optimize this');
      expect(result.prompt).toContain('THINK HARD.');
      expect(result.metadata.platform).toBe('iOS');
      expect(result.metadata.format).toBe('ipa');
    });

    it('generates prompt with Android persona for APK', () => {
      const params = {
        platform: 'Android',
        format: 'apk',
        bundleId: 'com.example.app',
        version: '2.0.0',
        versionCode: 20,
        totalSize: 100 * 1024 * 1024, // 100 MB
        affectedFiles: [
          {
            path: 'res/drawable-xxhdpi/splash.png',
            size: 5 * 1024 * 1024, // 5 MB
          },
        ],
        totalAffectedSize: 5 * 1024 * 1024,
        percentOfTotal: 5,
        category: 'compression',
        insightTitle: 'Large Uncompressed Image',
        insightDescription: 'Large uncompressed image',
        insightRecommendation: 'Convert to WebP format',
      };

      const result = generateIndividualPrompt(params);

      expect(result.prompt).toContain('Android Engineer');
      expect(result.prompt).toContain('100 MB');
      expect(result.prompt).toContain('APK');
      expect(result.prompt).toContain('splash.png');
      expect(result.prompt).toContain('5 MB');
      expect(result.prompt).toContain('5.00%');
      expect(result.prompt).toContain('Package Name: com.example.app');
      expect(result.prompt).toContain('code: 20');
      expect(result.prompt).toContain('ProGuard/R8');
      expect(result.prompt).toContain('EXACT steps');
      expect(result.prompt).toContain('THINK HARD.');
      expect(result.metadata.platform).toBe('Android');
      expect(result.metadata.format).toBe('apk');
    });

    it('generates prompt with AAB-specific guidance for Android', () => {
      const params = {
        platform: 'Android',
        format: 'aab',
        bundleId: 'com.example.app',
        version: '3.0.0',
        versionCode: 30,
        totalSize: 80 * 1024 * 1024, // 80 MB
        affectedFiles: [
          {
            path: 'base/lib/arm64-v8a/libnative.so',
            size: 25 * 1024 * 1024, // 25 MB
          },
        ],
        totalAffectedSize: 25 * 1024 * 1024,
        percentOfTotal: 31.25,
        category: 'architecture',
        insightTitle: 'Large Native Library',
        insightDescription: 'Large native library',
        insightRecommendation: 'Split by architecture using dynamic features',
      };

      const result = generateIndividualPrompt(params);

      expect(result.prompt).toContain('App Bundle Optimization');
      expect(result.prompt).toContain('AAB');
      expect(result.prompt).toContain('dynamic feature module');
      expect(result.prompt).toContain('Play Console');
      expect(result.prompt).toContain('EXACT steps');
      expect(result.prompt).toContain('THINK HARD.');
      expect(result.metadata.format).toBe('aab');
    });

    it('handles missing optional fields gracefully', () => {
      const params = {
        platform: 'iOS',
        format: 'ipa',
        totalSize: 30 * 1024 * 1024,
        affectedFiles: [
          {
            path: 'test.bin',
            size: 5 * 1024 * 1024,
          },
        ],
        totalAffectedSize: 5 * 1024 * 1024,
        category: 'optimization',
        insightTitle: 'Test Insight',
        insightDescription: 'Test description',
        insightRecommendation: 'Test recommendation',
      };

      const result = generateIndividualPrompt(params);

      expect(result.prompt).toBeTruthy();
      expect(result.prompt).toContain('iOS');
      expect(result.prompt).toContain('30 MB');
      expect(result.prompt).toContain('test.bin');
      // Should not crash with missing optional fields
      expect(result.prompt).not.toContain('undefined');
      expect(result.prompt).not.toContain('null');
    });

    it('formats file sizes correctly', () => {
      const params = {
        platform: 'iOS',
        format: 'ipa',
        totalSize: 1024 * 1024 * 1024, // 1 GB
        affectedFiles: [
          {
            path: 'large.bin',
            size: 512 * 1024 * 1024, // 512 MB
          },
        ],
        totalAffectedSize: 512 * 1024 * 1024,
        percentOfTotal: 50,
        category: 'optimization',
        insightTitle: 'Large File',
        insightDescription: 'Test',
        insightRecommendation: 'Test',
      };

      const result = generateIndividualPrompt(params);

      expect(result.prompt).toContain('GB'); // Should show in GB
      expect(result.prompt).toContain('512 MB'); // File size in MB
    });
  });

  describe('generateSectionPrompt', () => {
    it('generates section prompt with multiple insights', () => {
      const insights = [
        {
          category: 'over-bundling',
          potentialSavings: 10 * 1024 * 1024,
          affectedFiles: [
            { path: 'lib/native.so', size: 15 * 1024 * 1024 },
          ],
        },
        {
          category: 'compression',
          potentialSavings: 5 * 1024 * 1024,
          affectedFiles: [
            { path: 'res/image.png', size: 8 * 1024 * 1024 },
          ],
        },
        {
          category: 'duplicates',
          potentialSavings: 3 * 1024 * 1024,
          affectedFiles: [
            { path: 'strings.xml', size: 5 * 1024 * 1024 },
          ],
        },
      ];

      const params = {
        platform: 'Android',
        format: 'apk',
        bundleId: 'com.example.app',
        version: '1.0.0',
        versionCode: 10,
        totalSize: 100 * 1024 * 1024,
        insights,
      };

      const result = generateSectionPrompt(params);

      expect(result.prompt).toContain('Android Engineer');
      expect(result.prompt).toContain('APK');
      expect(result.prompt).toContain('3 optimization opportunities');
      expect(result.prompt).toContain('over-bundling');
      expect(result.prompt).toContain('compression');
      expect(result.prompt).toContain('duplicates');
      expect(result.prompt).toContain('Total Potential Savings');
      expect(result.prompt).toContain('18 MB'); // Total savings
      expect(result.prompt).toContain('Prioritized'); // Asks for prioritized roadmap
      expect(result.prompt).toContain('THINK HARD.');
      expect(result.metadata.insightCount).toBe(3);
      expect(result.metadata.totalSavings).toBe(18 * 1024 * 1024);
    });

    it('includes category icons and summaries', () => {
      const insights = [
        {
          category: 'compression',
          potentialSavings: 5 * 1024 * 1024,
          affectedFiles: [{ path: 'test.png', size: 8 * 1024 * 1024 }],
        },
      ];

      const params = {
        platform: 'iOS',
        format: 'ipa',
        totalSize: 50 * 1024 * 1024,
        insights,
      };

      const result = generateSectionPrompt(params);

      expect(result.prompt).toContain('🗜️'); // Compression icon
      expect(result.prompt).toContain('compression');
      expect(result.prompt).toContain('Largest:');
      expect(result.prompt).toContain('test.png');
    });

    it('calculates savings percentage correctly', () => {
      const insights = [
        {
          category: 'optimization',
          potentialSavings: 10 * 1024 * 1024, // 10 MB
          affectedFiles: [],
        },
      ];

      const params = {
        platform: 'iOS',
        format: 'ipa',
        totalSize: 100 * 1024 * 1024, // 100 MB
        insights,
      };

      const result = generateSectionPrompt(params);

      expect(result.prompt).toContain('10% size reduction');
    });
  });

  describe('generateChatGPTUrl', () => {
    it('generates valid ChatGPT URL with encoded prompt', () => {
      const prompt = 'This is a test prompt with spaces & special chars!';
      const url = generateChatGPTUrl(prompt);

      expect(url).toContain('https://chatgpt.com/?q=');
      expect(url).toContain('test%20prompt');
      expect(url).toContain('%26'); // Encoded &
      // Note: encodeURIComponent doesn't encode ! as %21, it's a valid URI character
    });

    it('handles long prompts', () => {
      const longPrompt = 'A'.repeat(5000);
      const url = generateChatGPTUrl(longPrompt);

      expect(url).toContain('https://chatgpt.com/?q=');
      expect(url.length).toBeGreaterThan(5000);
    });

    it('encodes newlines correctly', () => {
      const prompt = 'Line 1\nLine 2\nLine 3';
      const url = generateChatGPTUrl(prompt);

      expect(url).toContain('%0A'); // Encoded newline
    });
  });

  describe('Prompt Content Validation', () => {
    it('includes all required sections in individual prompt', () => {
      const params = {
        platform: 'iOS',
        format: 'ipa',
        totalSize: 50 * 1024 * 1024,
        affectedFiles: [
          {
            path: 'test.bin',
            size: 10 * 1024 * 1024,
          },
        ],
        totalAffectedSize: 10 * 1024 * 1024,
        category: 'optimization',
        insightTitle: 'Test Insight',
        insightDescription: 'Test description',
        insightRecommendation: 'Test recommendation',
      };

      const result = generateIndividualPrompt(params);

      // Check for required sections
      expect(result.prompt).toContain('App Context:');
      expect(result.prompt).toContain('Issue Detected:');
      expect(result.prompt).toContain('Current Analysis:');
      expect(result.prompt).toContain('Our Suggestion:');
      expect(result.prompt).toContain('What are the EXACT steps');
      expect(result.prompt).toContain('Detailed File Breakdown:');
    });

    it('asks for honest feedback when unknown', () => {
      const params = {
        platform: 'iOS',
        format: 'ipa',
        totalSize: 50 * 1024 * 1024,
        affectedFiles: [
          {
            path: 'test.bin',
            size: 10 * 1024 * 1024,
          },
        ],
        totalAffectedSize: 10 * 1024 * 1024,
        category: 'optimization',
        insightTitle: 'Test',
        insightDescription: 'Test',
        insightRecommendation: 'Test',
      };

      const result = generateIndividualPrompt(params);

      expect(result.prompt).toContain('I don\'t know how to optimize this');
      expect(result.prompt).toContain('explain why');
    });

    it('emphasizes concrete steps over analysis', () => {
      const params = {
        platform: 'Android',
        format: 'apk',
        totalSize: 100 * 1024 * 1024,
        affectedFiles: [
          {
            path: 'test.so',
            size: 20 * 1024 * 1024,
          },
        ],
        totalAffectedSize: 20 * 1024 * 1024,
        category: 'architecture',
        insightTitle: 'Test',
        insightDescription: 'Test',
        insightRecommendation: 'Test',
      };

      const result = generateIndividualPrompt(params);

      expect(result.prompt).toContain('EXACT steps');
      expect(result.prompt).toContain('concrete implementation steps');
      expect(result.prompt).toContain('Be brief');
    });
  });
});
