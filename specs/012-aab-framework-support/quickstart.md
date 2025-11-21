# Quickstart: AAB and Framework File Support

**Date**: 2025-11-19
**Branch**: `012-aab-framework-support`

## Overview

This guide shows how to use the new AAB and Framework parsers once implemented. Both parsers follow the same patterns as existing IPA/APK parsers and integrate seamlessly with the app's visualization components.

---

## Usage Scenarios

### Scenario 1: Analyze an Android App Bundle

Users can analyze AAB files the same way they analyze APK files.

**User Flow**:
1. User drops `.aab` file onto upload zone
2. System detects AAB format and routes to AAB parser
3. Parser extracts metadata (package name, version) and categorizes files
4. Results displayed in treemap and file list views

**Code Integration**:

```javascript
// In useParserWorker.js - already routes .aab to parseAndroid()
const extension = file.name.split('.').pop().toLowerCase();
if (extension === 'aab') {
  // Route to AAB parser in worker
  worker.postMessage({ type: 'PARSE_AAB', file });
}
```

```javascript
// In parser-worker.js
import { parseAAB } from '@/lib/parsers/android/aab-parser';

self.onmessage = async (event) => {
  if (event.data.type === 'PARSE_AAB') {
    const result = await parseAAB(event.data.file, {
      onProgress: (p) => self.postMessage({ type: 'PROGRESS', ...p })
    });
    self.postMessage({ type: 'RESULT', result });
  }
};
```

### Scenario 2: Analyze an iOS Framework

Users upload a zipped framework bundle for analysis.

**User Flow**:
1. User zips their `.framework` directory
2. User drops ZIP onto upload zone
3. System detects framework structure inside ZIP
4. Parser extracts metadata and shows architecture breakdown

**Code Integration**:

```javascript
// In useParserWorker.js
async function detectFormat(file) {
  if (file.name.endsWith('.zip')) {
    // Check if ZIP contains .framework directory
    const isFramework = await checkForFramework(file);
    if (isFramework) return 'framework';
  }
  // ... existing detection
}
```

```javascript
// Framework metadata display
const { metadata, architectures } = result;

console.log(`Bundle: ${metadata.bundleIdentifier}`);
console.log(`Version: ${metadata.version} (${metadata.buildVersion})`);
console.log(`Min OS: ${metadata.minimumOSVersion}`);
console.log(`Architectures: ${architectures.map(a => a.name).join(', ')}`);
```

### Scenario 3: Compare Module Sizes in AAB

Users can see per-module breakdowns for AAB files with dynamic features.

**Display Example**:

```javascript
// result.modules contains module breakdown
result.modules.forEach(module => {
  console.log(`${module.name}: ${formatSize(module.size)}`);
  console.log(`  - DEX: ${formatSize(module.contents.dexSize)}`);
  console.log(`  - Resources: ${formatSize(module.contents.resourcesSize)}`);
  console.log(`  - Native: ${formatSize(module.contents.nativeSize)}`);
});

// Output:
// base: 45.2 MB
//   - DEX: 12.1 MB
//   - Resources: 28.4 MB
//   - Native: 4.7 MB
// feature_camera: 8.3 MB
//   - DEX: 1.2 MB
//   - Resources: 2.1 MB
//   - Native: 5.0 MB
```

### Scenario 4: Per-Architecture Size in Framework

Users can see how much each architecture contributes to framework size.

**Display Example**:

```javascript
// Universal framework with multiple architectures
const { architectures, metadata } = result;

console.log(`Framework: ${metadata.bundleName}`);
console.log('Architecture breakdown:');
architectures.forEach(arch => {
  const pct = ((arch.size / result.fileSize) * 100).toFixed(1);
  console.log(`  ${arch.name}: ${formatSize(arch.size)} (${pct}%)`);
});

// Output:
// Framework: MySDK
// Architecture breakdown:
//   arm64: 4.2 MB (52.3%)
//   x86_64: 3.8 MB (47.7%)
```

---

## Integration Examples

### Store Integration

The analysisStore handles all formats uniformly:

```javascript
// In analysisStore.js
export const useAnalysisStore = defineStore('analysis', () => {
  const result = ref(null);
  const format = computed(() => result.value?.format);

  // Format-specific computed properties
  const isAndroid = computed(() => ['apk', 'aab'].includes(format.value));
  const isIOS = computed(() => ['ipa', 'framework'].includes(format.value));

  // AAB-specific
  const modules = computed(() => {
    if (format.value === 'aab') {
      return result.value.modules;
    }
    return [];
  });

  // Framework-specific
  const architectures = computed(() => {
    if (format.value === 'framework') {
      return result.value.architectures;
    }
    return [];
  });

  return { result, format, isAndroid, isIOS, modules, architectures };
});
```

### Component Usage

```vue
<template>
  <div v-if="format === 'aab'">
    <h3>Modules ({{ modules.length }})</h3>
    <ul>
      <li v-for="mod in modules" :key="mod.name">
        {{ mod.name }}: {{ formatSize(mod.size) }}
      </li>
    </ul>
  </div>

  <div v-if="format === 'framework'">
    <h3>Architectures</h3>
    <ul>
      <li v-for="arch in architectures" :key="arch.name">
        {{ arch.name }}: {{ formatSize(arch.size) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useAnalysisStore } from '@/stores/analysisStore';
import { formatSize } from '@/lib/utils/format';

const store = useAnalysisStore();
const { format, modules, architectures } = storeToRefs(store);
</script>
```

---

## Error Handling

Both parsers throw `ParseError` for invalid files:

```javascript
import { parseAAB } from '@/lib/parsers/android/aab-parser';

try {
  const result = await parseAAB(file);
} catch (error) {
  if (error.code === 'MISSING_BASE_MODULE') {
    showError('Invalid AAB: Missing base module');
  } else if (error.code === 'CORRUPT_FILE') {
    showError('File appears to be corrupted');
  } else {
    showError(`Parse failed: ${error.message}`);
  }
}
```

```javascript
import { parseFramework } from '@/lib/parsers/ios/framework-parser';

try {
  const result = await parseFramework(file);
} catch (error) {
  if (error.code === 'MISSING_PLIST') {
    showError('Invalid framework: Info.plist not found');
  } else if (error.code === 'MISSING_BINARY') {
    showError('Invalid framework: Main binary not found');
  } else {
    showError(`Parse failed: ${error.message}`);
  }
}
```

---

## Testing

### Unit Test Example (AAB)

```javascript
import { describe, it, expect } from 'vitest';
import { parseAAB } from '@/lib/parsers/android/aab-parser';
import fs from 'fs';
import path from 'path';

describe('AAB Parser', () => {
  it('should parse valid AAB file', async () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, '../../fixtures/sample.aab')
    );
    const file = new Blob([fixture], { type: 'application/octet-stream' });

    const result = await parseAAB(file);

    expect(result.format).toBe('aab');
    expect(result.metadata.packageName).toBeDefined();
    expect(result.modules.length).toBeGreaterThan(0);
    expect(result.modules.some(m => m.isBase)).toBe(true);
  });

  it('should categorize DEX files correctly', async () => {
    const result = await parseAAB(fixture);

    const dexCategory = result.breakdown.categories.find(c => c.id === 'dex');
    expect(dexCategory).toBeDefined();
    expect(dexCategory.count).toBeGreaterThan(0);
  });
});
```

### Unit Test Example (Framework)

```javascript
import { describe, it, expect } from 'vitest';
import { parseFramework } from '@/lib/parsers/ios/framework-parser';

describe('Framework Parser', () => {
  it('should parse valid framework bundle', async () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, '../../fixtures/Sample.framework.zip')
    );
    const file = new Blob([fixture]);

    const result = await parseFramework(file);

    expect(result.format).toBe('framework');
    expect(result.metadata.bundleIdentifier).toBeDefined();
    expect(result.architectures.length).toBeGreaterThan(0);
  });

  it('should detect architectures in universal binary', async () => {
    const result = await parseFramework(universalFrameworkFixture);

    const archNames = result.architectures.map(a => a.name);
    expect(archNames).toContain('arm64');
    expect(archNames).toContain('x86_64');
  });

  it('should handle macOS versioned structure', async () => {
    const result = await parseFramework(macosFrameworkFixture);

    expect(result.metadata.isVersioned).toBe(true);
    expect(result.metadata.bundleIdentifier).toBeDefined();
  });
});
```

---

## Common Patterns

### Progress Reporting

Both parsers support progress callbacks:

```javascript
const result = await parseAAB(file, {
  onProgress: (progress) => {
    // progress.state: 'EXTRACTING' | 'PARSING' | 'CATEGORIZING'
    // progress.progress: 0-100
    // progress.message: Human-readable status
    updateProgressBar(progress.progress);
    updateStatusText(progress.message);
  }
});
```

### Lazy Loading Parsers

Since AAB parsing requires protobuf.js, consider lazy loading:

```javascript
// Only load AAB parser when needed
async function parseFile(file) {
  if (file.name.endsWith('.aab')) {
    const { parseAAB } = await import('@/lib/parsers/android/aab-parser');
    return parseAAB(file);
  }
  // ... other formats
}
```

---

## File Format Reference

### AAB Structure
```
app.aab/
├── base/
│   ├── manifest/AndroidManifest.xml  (protobuf)
│   ├── dex/classes*.dex
│   ├── res/
│   ├── lib/{abi}/
│   └── assets/
├── feature_*/
└── BundleConfig.pb
```

### Framework Structure
```
MyFramework.framework/
├── MyFramework           (binary)
├── Info.plist
├── Headers/
├── Modules/
├── Resources/
└── _CodeSignature/
```

---

## Next Steps

After implementation:

1. Run `npm run test` to verify parser tests pass
2. Build with `npm run build` to check bundle size impact
3. Test with real AAB/Framework files of various sizes
4. Verify treemap and file list display correctly
