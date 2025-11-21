# Quickstart Guide: Comprehensive Insights

**Feature**: 011-insights-improvement
**Audience**: Developers adding new insights or extending existing ones
**Prerequisites**: Understanding of Vue 3 Composition API, Pinia, Web Workers

## Overview

This guide shows how to add new insights to the App Size Analyzer. The insights system is extensible, library-first, and follows TDD principles.

---

## Scenario 1: Add a Simple Insight Rule

**Goal**: Add detection for large video files (>5MB) that could be compressed

**Steps**:

### 1. Write the test first (TDD)

```javascript
// tests/unit/insight-rules/large-videos.test.js
import { describe, it, expect } from 'vitest';
import { largeVideoRule } from '../../../src/lib/analysis/insight-rules.js';

describe('R020: Large Video Files', () => {
  it('should detect videos >5MB', async () => {
    const context = {
      platform: 'iOS',
      allFiles: [
        { path: 'videos/intro.mp4', size: 8 * 1024 * 1024 }, // 8MB
        { path: 'videos/small.mp4', size: 2 * 1024 * 1024 },  // 2MB (skip)
      ],
      totalInstallSize: 50 * 1024 * 1024,
    };

    const results = await largeVideoRule.execute(context);

    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe('R020');
    expect(results[0].affectedItems).toHaveLength(1);
    expect(results[0].affectedItems[0].path).toBe('videos/intro.mp4');
  });
});
```

### 2. Implement the rule

```javascript
// src/lib/analysis/insight-rules.js

/**
 * R020: Large Video Files
 * Detects video files >5MB that could be compressed or replaced with lower bitrate versions
 */
export const largeVideoRule = {
  id: 'R020',
  category: 'optimization',
  name: 'Large Video Files',
  description: 'Detects large video files that could be compressed or optimized',
  severity: 'medium',
  platform: 'both',
  priority: 'P3',

  execute: async (context) => {
    const results = [];
    const videoPattern = /\.(mp4|mov|avi|webm)$/i;
    const sizeThreshold = 5 * 1024 * 1024; // 5MB

    const largeVideos = context.allFiles.filter(f =>
      videoPattern.test(f.path) && f.size > sizeThreshold
    );

    if (largeVideos.length === 0) return results;

    const affectedItems = largeVideos.map(file => ({
      path: file.path,
      size: file.size,
      reason: `Large video file (${formatBytes(file.size)}) - consider H.265 encoding or lower bitrate`,
      metadata: { type: 'video', format: path.extname(file.path).slice(1) }
    }));

    const totalSize = affectedItems.reduce((sum, item) => sum + item.size, 0);
    const potentialSavings = Math.floor(totalSize * 0.4); // Estimate 40% savings
    const percentOfTotal = (potentialSavings / context.totalInstallSize) * 100;

    results.push({
      ruleId: 'R020',
      title: `${largeVideos.length} Large Video Files Found`,
      description: `${largeVideos.length} video files are larger than 5MB. Total size: ${formatBytes(totalSize)}.`,
      severity: 'medium',
      category: 'optimization',
      affectedItems,
      potentialSavings,
      percentOfTotal,
      actionable: true,
      fixSuggestion: `## How to Fix\n\n1. **Use H.265/HEVC encoding**...`,
    });

    return results;
  },

  metadata: {
    examples: ['8MB intro video', 'High bitrate screen recordings'],
    documentation: 'H.265 can reduce video size by 40-50% vs H.264',
    fixable: false,
  }
};

// Add to allInsightRules array
export const allInsightRules = [
  duplicateDetectionRule,
  // ... existing rules
  largeVideoRule, // Add here
];
```

### 3. Run tests

```bash
npm run test -- large-videos.test.js
```

---

## Scenario 2: Add Insight with Web Worker

**Goal**: Add image compression testing that runs in Web Worker

**Steps**:

### 1. Create the worker service

```javascript
// src/workers/compression-worker.js
import { expose } from 'comlink';

const compressionService = {
  async compressImage(imageData, options = {}) {
    const { type = 'image/jpeg', quality = 0.85 } = options;

    const bitmap = await createImageBitmap(imageData);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);

    const blob = await canvas.convertToBlob({ type, quality });

    return {
      blob,
      originalSize: imageData.size,
      compressedSize: blob.size,
      savings: imageData.size - blob.size,
      reductionPercent: ((imageData.size - blob.size) / imageData.size) * 100,
    };
  }
};

expose(compressionService);
```

### 2. Create composable to use worker

```javascript
// src/composables/useCompressionWorker.js
import { ref } from 'vue';
import { wrap } from 'comlink';

export function useCompressionWorker() {
  const worker = ref(null);
  const isProcessing = ref(false);

  const initWorker = () => {
    if (!worker.value) {
      const w = new Worker(
        new URL('../workers/compression-worker.js', import.meta.url),
        { type: 'module' }
      );
      worker.value = wrap(w);
    }
    return worker.value;
  };

  const compressImage = async (file, options) => {
    isProcessing.value = true;
    try {
      const workerInstance = initWorker();
      const result = await workerInstance.compressImage(file, options);
      return result;
    } finally {
      isProcessing.value = false;
    }
  };

  const cleanup = () => {
    if (worker.value) {
      worker.value[Symbol.dispose]?.();
      worker.value = null;
    }
  };

  return { compressImage, isProcessing, cleanup };
}
```

### 3. Use in insight rule

```javascript
// src/lib/analysis/insight-rules.js
import { wrap } from 'comlink';

export const imageOptimizationRule = {
  id: 'R011',
  // ... other properties

  execute: async (context) => {
    // Initialize worker
    const worker = new Worker(
      new URL('../workers/compression-worker.js', import.meta.url),
      { type: 'module' }
    );
    const compressionService = wrap(worker);

    const imageFiles = context.allFiles.filter(f => /\.(png|jpe?g)$/i.test(f.path));
    const affectedItems = [];

    for (const file of imageFiles) {
      const result = await compressionService.compressImage(file, {
        type: 'image/jpeg',
        quality: 0.85
      });

      if (result.savings >= 4096) { // 4KB minimum
        affectedItems.push({
          path: file.path,
          size: file.size,
          reason: `Could save ${formatBytes(result.savings)} (${result.reductionPercent.toFixed(1)}%)`,
          metadata: { compressionResult: result }
        });
      }
    }

    worker.terminate();

    // Create InsightResult...
    return results;
  }
};
```

---

## Scenario 3: Add Platform-Specific Insight

**Goal**: Add iOS-specific localization minification detection

**Steps**:

### 1. Implement rule with platform filter

```javascript
export const localizationMinificationRule = {
  id: 'R014',
  category: 'optimization',
  name: 'iOS Localization Minification',
  description: 'Detects binary plist .strings files that could be converted to UTF-8',
  severity: 'low',
  platform: 'iOS', // Only run for iOS apps
  priority: 'P2',

  execute: async (context) => {
    // Early return if not iOS (redundant check, but safe)
    if (context.platform !== 'iOS') return [];

    const stringsFiles = context.allFiles.filter(f => f.path.match(/\.lproj\/.*\.strings$/));

    // Detect binary plist format (file starts with 'bplist')
    const binaryPlistFiles = [];

    for (const file of stringsFiles) {
      // Check first 6 bytes for 'bplist' magic
      const header = await readFileHeader(file, 6);
      if (header.startsWith('bplist')) {
        binaryPlistFiles.push(file);
      }
    }

    if (binaryPlistFiles.length === 0) return [];

    // Create insight...
    const totalSize = binaryPlistFiles.reduce((sum, f) => sum + f.size, 0);
    const estimatedSavings = Math.floor(totalSize * 0.15); // 15% savings estimate

    return [{
      ruleId: 'R014',
      title: `${binaryPlistFiles.length} Binary Plist Localization Files`,
      description: `${binaryPlistFiles.length} .strings files use binary plist format. Converting to UTF-8 text could save ~15%.`,
      severity: 'low',
      category: 'optimization',
      affectedItems: binaryPlistFiles.map(f => ({
        path: f.path,
        size: f.size,
        reason: 'Binary plist format - convert to UTF-8 text',
        metadata: { format: 'binary-plist' }
      })),
      potentialSavings: estimatedSavings,
      percentOfTotal: (estimatedSavings / context.totalInstallSize) * 100,
      actionable: true,
      fixSuggestion: `## How to Fix\n\nIn Xcode:\n1. Build Settings → "Strings File Output Encoding" → UTF-8\n...`
    }];
  },

  metadata: {
    examples: ['Localizable.strings in binary plist format'],
    documentation: 'Binary plist format is 5-20% larger than UTF-8 text for .strings files',
    fixable: false
  }
};
```

---

## Scenario 4: Extend Analysis Context

**Goal**: Add font file indexing to AnalysisContext for faster font insights

**Steps**:

### 1. Enhance context preparation

```javascript
// src/lib/analysis/index.js (or insight-engine.js)

/**
 * Prepare analysis context with indexed data
 */
function prepareAnalysisContext(parsedData) {
  const context = {
    platform: parsedData.platform,
    allFiles: parsedData.files,
    totalInstallSize: parsedData.totalSize,
    buildType: parsedData.buildType || 'unknown',
    metadata: parsedData.metadata || {},

    // NEW: Index image files
    imageFiles: parsedData.files.filter(f =>
      /\.(png|jpe?g|webp|heic|gif)$/i.test(f.path)
    ),

    // NEW: Index font files
    fontFiles: parsedData.files.filter(f =>
      /\.(ttf|otf|woff2?)$/i.test(f.path)
    ),

    // NEW: Initialize compression cache
    compressionCache: new Map(),

    // NEW: Compute duplicate groups once
    duplicateGroups: await findDuplicatesByHash(parsedData.files),
  };

  // iOS-specific
  if (context.platform === 'iOS' && parsedData.plist) {
    context.plistData = parsedData.plist;
  }

  // Android-specific
  if (context.platform === 'Android' && parsedData.manifest) {
    context.manifestData = parsedData.manifest;
  }

  return context;
}
```

### 2. Use indexed data in rules

```javascript
export const unusedFontsRule = {
  id: 'R016',
  // ... other properties

  execute: async (context) => {
    // Use pre-indexed fontFiles (faster than filtering all files)
    const fontFiles = context.fontFiles || [];

    // For iOS, check against Info.plist
    const referencedFonts = new Set();
    if (context.plistData?.UIAppFonts) {
      context.plistData.UIAppFonts.forEach(name => referencedFonts.add(name));
    }

    const unusedFonts = fontFiles.filter(font => {
      const fontName = path.basename(font.path);
      return !referencedFonts.has(fontName);
    });

    // Create insight...
  }
};
```

---

## Best Practices

### 1. Always Write Tests First (TDD)
- Create test fixture (real IPA/APK or synthetic structure)
- Write failing test with expected behavior
- Implement rule to make test pass

### 2. Use Existing Utilities
```javascript
// From insight-engine.js
import {
  findDuplicatesByHash,
  calculateDuplicateSavings,
  findFilesByExtension,
  findFilesByPattern,
  calculatePercentage,
  formatBytes
} from './insight-engine.js';
```

### 3. Follow Naming Conventions
- Rule ID: `R###` (sequential, e.g., R011, R012, R013)
- Rule name: Descriptive, 3-10 words
- Category: Use existing categories or register new one
- Severity: Match guidelines (critical/high/medium/low)

### 4. Provide Actionable Fix Suggestions
- Include specific steps, not vague advice
- Provide code snippets where applicable
- Reference tools and documentation
- Estimate time to implement

### 5. Respect Performance Constraints
- Use Web Workers for heavy operations (>100ms)
- Show progress indicators for long-running tasks
- Cache expensive computations (compression results, hashes)
- Limit batch sizes to prevent memory exhaustion

### 6. Handle Platform Differences
- Set `platform` property for platform-specific rules
- Check `context.platform` in execute function
- Use platform-specific properties (plistData, manifestData)

### 7. Validate Thresholds
- Android duplicates: ≥512 bytes savings minimum
- iOS duplicates: No minimum
- Image optimization: ≥4KB savings minimum
- Apply thresholds before creating InsightResult

---

## Common Patterns

### Pattern 1: File Extension Filtering
```javascript
const videoFiles = findFilesByExtension(context, '.mp4');
// or
const videos = context.allFiles.filter(f => /\.(mp4|mov|avi)$/i.test(f.path));
```

### Pattern 2: Hash-Based Duplicate Detection
```javascript
const duplicates = context.duplicateGroups || await findDuplicatesByHash(context);
duplicates.forEach((paths, hash) => {
  if (paths.length > 1) {
    // Create insight for this duplicate group
  }
});
```

### Pattern 3: Compression Testing
```javascript
// Check cache first
let compressionResult = context.compressionCache?.get(file.hash);

if (!compressionResult) {
  // Test compression (in worker)
  compressionResult = await compressImage(file);
  context.compressionCache?.set(file.hash, compressionResult);
}

if (compressionResult.savings >= 4096) {
  // Create affected item
}
```

### Pattern 4: Platform-Specific Detection
```javascript
execute: async (context) => {
  if (context.platform !== 'iOS') return [];

  // iOS-specific logic using context.plistData
}
```

---

## Debugging Tips

### 1. Test with Real Fixtures
```bash
# Download real IPA/APK for testing
# Place in tests/fixtures/ios/ or tests/fixtures/android/
# Reference in test:
const fixture = await loadFixture('tests/fixtures/ios/sample-app.ipa');
```

### 2. Enable Verbose Logging
```javascript
execute: async (context) => {
  console.log('[R020] Analyzing context:', {
    fileCount: context.allFiles.length,
    totalSize: formatBytes(context.totalInstallSize),
    platform: context.platform
  });

  // ... detection logic

  console.log('[R020] Found affected items:', affectedItems.length);
}
```

### 3. Use Browser DevTools
- Set breakpoints in insight rule execute() functions
- Inspect AnalysisContext structure
- Monitor Web Worker messages (compression testing)
- Check memory usage during batch operations

---

## Summary

**Key Takeaways**:
1. Insights are defined as rule objects implementing InsightRule contract
2. Rules receive AnalysisContext, return InsightResult[]
3. Use TDD: test first, implement second
4. Heavy operations (compression, parsing) run in Web Workers
5. Platform-specific rules filter by context.platform
6. Apply minimum thresholds before creating insights
7. Provide actionable fix suggestions with code snippets

**Next Steps**:
- Review existing rules in `src/lib/analysis/insight-rules.js`
- Read contracts in `contracts/` directory
- Write tests in `tests/unit/insight-rules/`
- Follow TDD workflow for new insights
