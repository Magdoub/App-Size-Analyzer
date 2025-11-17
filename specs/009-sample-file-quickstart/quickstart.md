# Quickstart Guide: Sample File Quickstart

**Feature**: 009-sample-file-quickstart
**Audience**: Developers integrating or extending this feature
**Last Updated**: 2025-11-17

## Overview

This feature adds one-click sample file functionality to the homepage, allowing users to instantly try the app without uploading their own binaries. Sample files are dynamically discovered from `/sample-files/` directory and displayed as clickable cards.

### Key Components
- **SampleFileGallery.vue**: UI component displaying sample file cards
- **useSampleFiles.js**: Composable for file discovery and loading
- **App.vue** (modified): Integrates gallery into upload view

---

## Quick Integration

### 1. Add SampleFileGallery to Upload View

**File**: `src/App.vue`

```vue
<template>
  <div v-if="uiStore.activeView === 'upload'">
    <!-- Existing upload zone -->
    <UploadZone
      :on-file-select="handleFileSelect"
      @file-selected="handleFileSelect"
      @validation-error="handleValidationError"
      :accepted-formats="['.ipa', '.apk', '.aab', '.xapk']"
      :max-size="2 * 1024 * 1024 * 1024"
    />

    <!-- NEW: Sample file gallery -->
    <div class="mt-8">
      <h2 class="text-lg font-medium text-gray-900 mb-4">
        Or try a sample file
      </h2>
      <SampleFileGallery
        :disabled="appStore.isLoading"
        @file-selected="handleFileSelect"
        @loading-error="handleSampleLoadError"
        ref="sampleGalleryRef"
      />
    </div>

    <!-- Existing validation errors -->
    <FileValidator v-if="validationErrors.length > 0" ... />
  </div>
</template>

<script>
import { ref } from 'vue';
import SampleFileGallery from './components/upload/SampleFileGallery.vue';

export default {
  components: {
    UploadZone,
    FileValidator,
    SampleFileGallery, // ← Add to components
  },

  setup() {
    const sampleGalleryRef = ref(null);

    // Existing handleFileSelect (no changes needed!)
    const handleFileSelect = async (file) => {
      // Cancel any in-progress sample file load
      sampleGalleryRef.value?.cancelCurrentLoad();

      selectedFile.value = file;
      // ... rest of existing logic
    };

    // NEW: Handle sample file loading errors
    const handleSampleLoadError = (error) => {
      appStore.setError(`Failed to load sample file: ${error.message}`);
    };

    return {
      sampleGalleryRef,
      handleFileSelect,
      handleSampleLoadError,
    };
  },
};
</script>
```

**That's it!** The sample file gallery now appears below the upload zone.

---

## How It Works

### File Discovery (Build Time)

Vite's `import.meta.glob` discovers sample files during build:

```javascript
// In useSampleFiles.js
const sampleFileUrls = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url',
  eager: true
});

// Result: { '/sample-files/app.ipa': '/sample-files/app.ipa', ... }
```

### Metadata Extraction (Runtime - Immediate)

Basic metadata extracted synchronously for instant display:

```javascript
function extractBasicMetadata(filePath, url) {
  const fileName = filePath.split('/').pop();
  const extension = fileName.split('.').pop().toLowerCase();
  const platform = extension === 'ipa' ? 'iOS' : 'Android';
  const displayName = cleanFileName(fileName);

  return { url, name: fileName, displayName, platform, extension };
}
```

### Size Fetching (Runtime - Asynchronous)

File sizes fetched in parallel via HEAD requests:

```javascript
// In useSampleFiles.js composable
onMounted(async () => {
  const sizePromises = sampleFiles.value.map(async (file) => {
    const size = await fetchFileSize(file.url);
    file.size = size;
    file.sizeFormatted = size ? formatFileSize(size) : 'Unknown size';
  });

  await Promise.all(sizePromises);
});
```

### File Loading (On Click)

Sample file fetched as blob, converted to File object:

```javascript
async function loadSampleFile(url, fileName) {
  isLoading.value = true;
  loadingFileName.value = fileName;

  const controller = new AbortController();
  activeAbortController.value = controller;

  try {
    const response = await fetch(url, { signal: controller.signal });
    const blob = await response.blob();
    const file = new File([blob], fileName, {
      type: blob.type || 'application/octet-stream',
      lastModified: Date.now()
    });

    return file;
  } finally {
    isLoading.value = false;
    loadingFileName.value = null;
  }
}
```

---

## Adding New Sample Files

### Step 1: Add Binary to `/sample-files/` Directory

```bash
cp ~/Downloads/MyApp.ipa sample-files/
```

### Step 2: Rebuild Application

```bash
npm run build
```

**That's it!** Vite will automatically discover the new file at build time.

### File Naming Best Practices

- **Good**: `MyApp-iOS.ipa`, `MyApp-v2.1.ipa`
- **Okay**: `com.company.myapp.ipa`
- **Avoid**: `myapp_v2.1.0-release-final-FINAL.ipa` (too verbose)

Display names are automatically cleaned:
- `MyApp-iOS.ipa` → "MyApp iOS"
- `com.company.myapp.ipa` → "com.company.myapp"

---

## Configuration

### Accepted File Extensions

By default, `.ipa` and `.apk` files are discovered. To add `.aab` or `.xapk`:

```javascript
// In useSampleFiles.js
const sampleFileUrls = import.meta.glob('/sample-files/*.{ipa,apk,aab,xapk}', {
  as: 'url',
  eager: true
});
```

### Custom Platform Labels

Modify `extractBasicMetadata()` in `useSampleFiles.js`:

```javascript
function extractBasicMetadata(filePath, url) {
  const extension = fileName.split('.').pop().toLowerCase();

  let platform;
  if (extension === 'ipa') platform = 'iOS';
  else if (extension === 'apk') platform = 'Android';
  else if (extension === 'aab') platform = 'Android (AAB)';
  else if (extension === 'xapk') platform = 'Android (XAPK)';

  // ... rest of function
}
```

### Disable Sample File Gallery

Set `disabled` prop to `true`:

```vue
<SampleFileGallery
  :disabled="true"
  @file-selected="handleFileSelect"
/>
```

Or remove the component entirely from `App.vue`.

---

## Testing

### Unit Tests

```javascript
// tests/unit/components/upload/SampleFileGallery.test.js
import { mount } from '@vue/test-utils';
import SampleFileGallery from '@/components/upload/SampleFileGallery.vue';

describe('SampleFileGallery', () => {
  it('renders sample file cards', () => {
    const wrapper = mount(SampleFileGallery);
    const cards = wrapper.findAll('[data-testid="sample-file-card"]');

    expect(cards.length).toBeGreaterThan(0);
  });

  it('emits file-selected event when card clicked', async () => {
    const wrapper = mount(SampleFileGallery);
    const card = wrapper.find('[data-testid="sample-file-card"]');

    await card.trigger('click');

    // Wait for file to load
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('file-selected')).toBeTruthy();
    expect(wrapper.emitted('file-selected')[0][0]).toBeInstanceOf(File);
  });
});
```

### Integration Tests

```javascript
// tests/integration/sample-file-workflow.test.js
import { mount } from '@vue/test-utils';
import App from '@/App.vue';

describe('Sample File Workflow', () => {
  it('analyzes sample file when clicked', async () => {
    const wrapper = mount(App);

    // Click first sample file card
    const sampleCard = wrapper.find('[data-testid="sample-file-card"]');
    await sampleCard.trigger('click');

    // Verify loading state
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true);

    // Wait for analysis to complete (mock worker responses)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify navigation to breakdown view
    expect(wrapper.vm.uiStore.activeView).toBe('breakdown');
  });
});
```

---

## Troubleshooting

### Sample Files Not Appearing

**Symptom**: Gallery shows "No sample files available"

**Cause**: Files not discovered by Vite glob pattern

**Solution**:
1. Verify files exist in `/sample-files/` directory:
   ```bash
   ls sample-files/
   ```

2. Check file extensions match glob pattern (`.ipa` or `.apk`)

3. Rebuild application:
   ```bash
   npm run build
   ```

4. Check browser console for errors

### "Failed to fetch" Error

**Symptom**: Error when clicking sample file card

**Cause**: File URL not accessible

**Solution**:
1. Verify file was included in build output:
   ```bash
   ls dist/sample-files/
   ```

2. Check Vite config allows `/sample-files/` as public directory

3. Ensure dev server is serving static assets correctly

### File Size Shows "Unknown size"

**Symptom**: Sample file cards display "Unknown size"

**Cause**: HEAD request failed or `Content-Length` header missing

**Solution**:
1. Check browser network tab for failed HEAD requests

2. Verify server sends `Content-Length` header:
   ```bash
   curl -I http://localhost:5173/sample-files/app.ipa
   ```

3. Graceful degradation - feature still works without size

### Sample File Load Not Cancelling

**Symptom**: Upload triggers analysis while sample file still loading

**Cause**: `cancelCurrentLoad()` not called in `handleFileSelect`

**Solution**:
```javascript
const handleFileSelect = async (file) => {
  // Add this line
  sampleGalleryRef.value?.cancelCurrentLoad();

  // ... rest of logic
};
```

---

## Performance Tips

### Optimize Sample File Sizes

- **Small files (< 10MB)**: Load instantly, ideal for quick demos
- **Medium files (10-50MB)**: 1-3 second load, good balance
- **Large files (> 50MB)**: 3-10 second load, show capabilities

**Recommendation**: Include 1 small, 1 medium, 1 large file for variety.

### Reduce Initial Bundle Size

Sample file URLs add ~50 bytes per file to bundle. With 3-5 files, impact is negligible (~200 bytes total).

To lazy-load URLs (saves ~50 bytes, adds complexity):

```javascript
// Not recommended unless 100+ sample files
const sampleFileUrls = import.meta.glob('/sample-files/*.{ipa,apk}', {
  as: 'url'
  // eager: false (default)
});
```

---

## API Reference

### useSampleFiles()

Composable for sample file discovery and loading.

```javascript
const {
  sampleFiles,        // Ref<SampleFileMetadata[]>
  isLoading,          // Ref<boolean>
  loadingFileName,    // Ref<string|null>
  error,              // Ref<Error|null>
  loadSampleFile,     // (url: string, name: string) => Promise<File>
  cancelCurrentLoad   // () => void
} = useSampleFiles();
```

### SampleFileGallery

Vue component displaying sample file cards.

```vue
<SampleFileGallery
  :disabled="boolean"
  @file-selected="(file: File) => void"
  @loading-error="(error: Error) => void"
  ref="galleryRef"
/>
```

**Methods** (via ref):
- `cancelCurrentLoad(): void` - Cancel in-progress sample file load

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.vue                              │
│                      (Upload View)                           │
│                                                              │
│  ┌─────────────────┐         ┌──────────────────────────┐  │
│  │   UploadZone    │         │  SampleFileGallery.vue   │  │
│  │  (Drag & Drop)  │         │                          │  │
│  └─────────────────┘         │  useSampleFiles()        │  │
│           │                  │   ↓                       │  │
│           │                  │  Sample File Cards        │  │
│           │                  │   ↓                       │  │
│           │                  │  Click → Load File        │  │
│           │                  └──────────┬───────────────┘  │
│           │                             │                   │
│           └──────────┬──────────────────┘                   │
│                      ↓ emit('file-selected', File)          │
│             handleFileSelect(file)                          │
│                      ↓                                       │
│             analyzeFile(file, platform)                     │
│                      ↓                                       │
│         ┌────────────────────────┐                          │
│         │   useParserWorker()    │                          │
│         │   (Web Worker)         │                          │
│         └────────────────────────┘                          │
│                      ↓                                       │
│         Analysis Complete → Breakdown View                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

- ✅ Read [research.md](./research.md) for technical decisions
- ✅ Read [data-model.md](./data-model.md) for data structures
- ✅ Review [contracts/](./contracts/) for API specifications
- ⏭️ Run `/speckit.tasks` to generate implementation task breakdown
- ⏭️ Run `/speckit.implement` to execute implementation

---

## Support

For questions or issues:
1. Check [Troubleshooting](#troubleshooting) section above
2. Review [research.md](./research.md) for technical details
3. Consult project constitution (`.specify/memory/constitution.md`)
