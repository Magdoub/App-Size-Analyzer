# Quickstart Guide: JSON Export for File Breakdown

**Feature**: 013-json-export
**Date**: 2025-01-23
**Audience**: Developers implementing or integrating the JSON export feature

## Overview

This guide provides practical examples for implementing and using the JSON export feature. It covers both library-level usage (for developers) and end-user workflows.

## Table of Contents

1. [User Workflows](#user-workflows)
2. [Library Usage](#library-usage)
3. [Vue Component Integration](#vue-component-integration)
4. [Pinia Store Integration](#pinia-store-integration)
5. [Testing Examples](#testing-examples)
6. [Common Issues & Solutions](#common-issues--solutions)

---

## User Workflows

### Workflow 1: View JSON Breakdown (P1)

**Goal**: User wants to see the JSON representation of their app's file breakdown.

**Steps**:
1. Upload app binary (IPA, APK, AAB) and wait for analysis to complete
2. Navigate to "Breakdown" tab
3. Click "Export JSON" button in header
4. Modal opens displaying formatted, syntax-highlighted JSON
5. Scroll through JSON to verify structure and data
6. Close modal when done

**Expected Result**: Modal displays complete JSON with proper formatting and syntax highlighting. JSON loads in <2 seconds for apps with up to 5,000 files.

---

### Workflow 2: Copy JSON to Clipboard (P2)

**Goal**: User wants to copy JSON for pasting into documentation, bug reports, or analysis tools.

**Steps**:
1. Follow steps 1-4 from Workflow 1 (open JSON modal)
2. Click "Copy to Clipboard" button
3. See success toast notification ("Copied!")
4. Paste into external application (text editor, IDE, etc.)

**Expected Result**:
- Toast shows "Copied!" message
- Pasted content is valid, formatted JSON matching the displayed version
- Copy works in Chrome, Firefox, Safari, Edge

**Fallback** (if clipboard access denied):
- Error message: "Clipboard access denied. Please grant permission or manually select and copy the JSON below."
- User can manually select JSON text in modal and use Cmd+C/Ctrl+C

---

### Workflow 3: Download JSON File (P3)

**Goal**: User wants to save JSON breakdown for long-term storage or processing with external tools.

**Steps**:
1. Follow steps 1-4 from Workflow 1 (open JSON modal)
2. Click "Download JSON" or "Save as File" button
3. Browser download begins
4. Check downloads folder for file

**Expected Result**:
- File downloads with descriptive name: `{appName}-breakdown-{YYYY-MM-DD-HHMMSS}.json`
- Example: `my-app-breakdown-2025-01-23-143022.json`
- File contains valid JSON identical to displayed version
- Works on desktop and mobile browsers

---

## Library Usage

### Basic: Generate JSON from Breakdown Tree

```javascript
import { generateExportJSON, buildExportMetadata } from '@/lib/export/json-generator';

// Example breakdown root (simplified)
const breakdownRoot = {
  name: 'MyApp.app',
  path: 'Payload/MyApp.app',
  size: 52428800,
  isDirectory: true,
  children: [
    {
      name: 'Info.plist',
      path: 'Payload/MyApp.app/Info.plist',
      size: 4096,
      compressedSize: 1024,
      type: 'plist',
      category: 'configuration',
      isDirectory: false
    },
    // ... more files
  ]
};

// Example metadata
const analysisMetadata = {
  appName: 'MyApp',
  version: '1.2.3',
  bundleId: 'com.example.myapp',
  platform: 'iOS',
  totalSize: 52428800
};

// Generate JSON export
const jsonString = generateExportJSON(breakdownRoot, analysisMetadata);

console.log(jsonString.length); // ~500KB typical
console.log(jsonString.slice(0, 100)); // Preview first 100 chars
```

---

### Advanced: Custom Formatting Options

```javascript
import { generateExportJSON } from '@/lib/export/json-generator';

// Generate with custom options
const jsonString = generateExportJSON(breakdownRoot, metadata, {
  indent: 4,           // 4 spaces instead of default 2
  sortBySize: true,    // Sort files by size (largest first)
  sortByPath: false    // Don't sort by path
});

// Result: JSON sorted by file size descending
```

---

### Clipboard Copy with Error Handling

```javascript
import { copyToClipboard } from '@/lib/export/json-generator';

async function handleCopyClick(jsonString) {
  const result = await copyToClipboard(jsonString);

  if (result.success) {
    console.log(`✅ Copied using ${result.method} method`);
    showToast('Copied!', 'success');
  } else {
    console.error(`❌ Copy failed: ${result.error}`);
    showToast(result.error, 'error');
  }
}

// Usage
await handleCopyClick(jsonString);
```

---

### File Download

```javascript
import { downloadJSONFile, generateExportFilename } from '@/lib/export/json-generator';

function handleDownloadClick(jsonString, appName) {
  const filename = generateExportFilename(appName);
  downloadJSONFile(jsonString, filename);

  console.log(`📥 Download started: ${filename}`);
}

// Usage
handleDownloadClick(jsonString, 'MyApp');
// Downloads: my-app-breakdown-2025-01-23-143022.json
```

---

## Vue Component Integration

### JsonExportButton Component

```vue
<template>
  <button
    @click="openExportModal"
    class="btn btn-primary"
    :disabled="!hasAnalysis"
  >
    <svg><!-- Export icon --></svg>
    Export JSON
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useUIStore } from '@/stores/uiStore';

const analysisStore = useAnalysisStore();
const uiStore = useUIStore();

const { currentAnalysis } = storeToRefs(analysisStore);
const hasAnalysis = computed(() => currentAnalysis.value !== null);

function openExportModal() {
  uiStore.showExportModal = true;
}
</script>
```

---

### JsonExportModal Component

```vue
<template>
  <div v-if="isOpen" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>JSON Export</h2>
        <button @click="close" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- Syntax-highlighted JSON display -->
        <pre
          class="json-display"
          v-html="highlightedJSON"
        ></pre>
      </div>

      <div class="modal-footer">
        <button @click="handleCopy" class="btn btn-primary">
          Copy to Clipboard
        </button>
        <button @click="handleDownload" class="btn btn-secondary">
          Download JSON
        </button>
      </div>

      <!-- Toast notification -->
      <div v-if="notification" :class="['toast', notification.type]">
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useUIStore } from '@/stores/uiStore';
import {
  generateExportJSON,
  copyToClipboard,
  downloadJSONFile,
  generateExportFilename,
  highlightJSON
} from '@/lib/export/json-generator';

const analysisStore = useAnalysisStore();
const uiStore = useUIStore();

const { currentAnalysis } = storeToRefs(analysisStore);
const { showExportModal } = storeToRefs(uiStore);

const isOpen = computed(() => showExportModal.value);
const notification = ref(null);

// Generate JSON when modal opens
const jsonString = ref('');
const highlightedJSON = computed(() => {
  return jsonString.value ? highlightJSON(jsonString.value) : '';
});

watch(isOpen, (newValue) => {
  if (newValue && currentAnalysis.value) {
    // Generate JSON on modal open
    jsonString.value = generateExportJSON(
      currentAnalysis.value.breakdownRoot,
      currentAnalysis.value.metadata
    );
  }
});

async function handleCopy() {
  const result = await copyToClipboard(jsonString.value);

  if (result.success) {
    showNotification('Copied!', 'success');
  } else {
    showNotification(result.error, 'error');
  }
}

function handleDownload() {
  const filename = generateExportFilename(currentAnalysis.value.metadata.appName);
  downloadJSONFile(jsonString.value, filename);
  showNotification('Download started', 'success');
}

function close() {
  uiStore.showExportModal = false;
  jsonString.value = '';
  notification.value = null;
}

function showNotification(message, type) {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
}
</script>

<style scoped>
/* Syntax highlighting classes */
.json-display :deep(.key) { color: #0451a5; }
.json-display :deep(.string) { color: #a31515; }
.json-display :deep(.number) { color: #098658; }
.json-display :deep(.keyword) { color: #0000ff; }
</style>
```

---

## Pinia Store Integration

### Add Export Actions to analysisStore

```javascript
// src/stores/analysisStore.js

import { defineStore } from 'pinia';
import { generateExportJSON } from '@/lib/export/json-generator';

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    currentAnalysis: null,
    // ... other state
  }),

  actions: {
    /**
     * Generate JSON export from current analysis
     * @returns {string} Formatted JSON string
     */
    generateJSONExport() {
      if (!this.currentAnalysis) {
        throw new Error('No analysis available for export');
      }

      return generateExportJSON(
        this.currentAnalysis.breakdownRoot,
        this.currentAnalysis.metadata
      );
    },

    /**
     * Get export metadata
     * @returns {ExportMetadata}
     */
    getExportMetadata() {
      if (!this.currentAnalysis) return null;

      return {
        appName: this.currentAnalysis.metadata.appName,
        version: this.currentAnalysis.metadata.version,
        bundleId: this.currentAnalysis.metadata.bundleId,
        platform: this.currentAnalysis.metadata.platform,
        totalSize: this.currentAnalysis.metadata.totalSize,
        fileCount: this.currentAnalysis.fileCount,
        exportedAt: new Date().toISOString(),
        analyzerVersion: '1.0.0' // From package.json or config
      };
    }
  }
});
```

---

## Testing Examples

### Unit Test: JSON Generator

```javascript
// src/lib/export/json-generator.test.js

import { describe, it, expect } from 'vitest';
import { generateExportJSON, flattenBreakdownTree } from './json-generator';

describe('generateExportJSON', () => {
  it('should generate valid JSON from breakdown tree', () => {
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
          isDirectory: false
        }
      ]
    };

    const metadata = {
      appName: 'MyApp',
      version: '1.0.0',
      bundleId: 'com.example.myapp',
      platform: 'iOS',
      totalSize: 10000
    };

    const result = generateExportJSON(breakdownRoot, metadata);

    // Verify valid JSON
    expect(() => JSON.parse(result)).not.toThrow();

    // Verify structure
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('metadata');
    expect(parsed).toHaveProperty('files');
    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0].path).toBe('Payload/MyApp.app/Info.plist');
  });
});

describe('flattenBreakdownTree', () => {
  it('should flatten nested tree to file array', () => {
    const tree = {
      name: 'root',
      path: 'root',
      size: 3000,
      isDirectory: true,
      children: [
        { name: 'file1.txt', path: 'root/file1.txt', size: 1000, isDirectory: false },
        {
          name: 'subdir',
          path: 'root/subdir',
          size: 2000,
          isDirectory: true,
          children: [
            { name: 'file2.txt', path: 'root/subdir/file2.txt', size: 2000, isDirectory: false }
          ]
        }
      ]
    };

    const files = flattenBreakdownTree(tree);

    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('root/file1.txt');
    expect(files[1].path).toBe('root/subdir/file2.txt');
  });
});
```

---

### Component Test: JsonExportModal

```javascript
// src/__tests__/components/JsonExportModal.test.js

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import JsonExportModal from '@/components/breakdown/JsonExportModal.vue';

describe('JsonExportModal', () => {
  it('should display JSON when modal is open', async () => {
    const pinia = createPinia();
    const wrapper = mount(JsonExportModal, {
      global: { plugins: [pinia] }
    });

    // Mock store state
    const analysisStore = useAnalysisStore();
    analysisStore.currentAnalysis = {
      metadata: { appName: 'TestApp', version: '1.0.0', /* ... */ },
      breakdownRoot: { /* ... */ }
    };

    const uiStore = useUIStore();
    uiStore.showExportModal = true;

    await wrapper.vm.$nextTick();

    // Verify JSON is displayed
    expect(wrapper.find('.json-display').exists()).toBe(true);
  });

  it('should copy JSON to clipboard when copy button clicked', async () => {
    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock }
    });

    const wrapper = mount(JsonExportModal, { /* ... */ });

    await wrapper.find('.btn-primary').trigger('click');

    expect(writeTextMock).toHaveBeenCalled();
    expect(wrapper.find('.toast.success').text()).toContain('Copied');
  });
});
```

---

## Common Issues & Solutions

### Issue 1: Clipboard Access Denied (Safari)

**Symptom**: Copy button shows error "Clipboard access denied" in Safari.

**Cause**: Safari requires explicit user permission for clipboard access.

**Solution**:
1. Ensure copy action is triggered by user click (not programmatic)
2. Fallback to execCommand is automatically used
3. Display helpful error message with manual copy instructions

---

### Issue 2: Large JSON Freezes UI

**Symptom**: Exporting very large apps (10,000+ files) causes browser to freeze for several seconds.

**Cause**: Synchronous JSON.stringify() blocks main thread.

**Solution**:
```javascript
// Wrap in requestIdleCallback for non-blocking generation
function generateJSONAsync(breakdownRoot, metadata) {
  return new Promise((resolve) => {
    requestIdleCallback(() => {
      const json = generateExportJSON(breakdownRoot, metadata);
      resolve(json);
    });
  });
}
```

---

### Issue 3: Special Characters in Filenames

**Symptom**: Downloaded filenames have garbled characters or fail to download.

**Cause**: App names with emojis, quotes, or special characters.

**Solution**: `generateExportFilename()` sanitizes filenames by replacing non-alphanumeric characters with hyphens.

---

### Issue 4: JSON Download Doesn't Work on Mobile

**Symptom**: Download button doesn't trigger download on iOS Safari or Android Chrome.

**Cause**: Some mobile browsers restrict programmatic downloads.

**Solution**:
- Ensure download is triggered by user click (not programmatic)
- Test with `<a download>` attribute (works in most mobile browsers)
- Provide fallback: show share sheet or "long press to save" instruction

---

## Next Steps

After reviewing this quickstart:

1. **Implement library functions** in `src/lib/export/json-generator.js` per contract
2. **Write unit tests** for each library function
3. **Create Vue components** (JsonExportButton, JsonExportModal)
4. **Integrate with Pinia store** (add export actions to analysisStore)
5. **Manual testing** across browsers (Chrome, Firefox, Safari, Edge)
6. **Performance testing** with large real-world app binaries

See `tasks.md` (generated by `/speckit.tasks`) for detailed implementation checklist.
