# Quickstart Guide

**Feature**: App Size Analyzer
**Version**: 1.0.0
**Last Updated**: 2025-11-07

This guide helps developers get started with the App Size Analyzer codebase, from initial setup through deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Workflow](#development-workflow)
4. [Architecture Overview](#architecture-overview)
5. [Key Integration Points](#key-integration-points)
6. [Testing](#testing)
7. [Building for Production](#building-for-production)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Git**: For version control
- **Memory**: 4GB RAM minimum (8GB recommended for large binary analysis)

### Browser Compatibility

The application requires modern browser features:

- **Web Workers** (Module Workers support)
- **File API** (for client-side file handling)
- **ArrayBuffer** and **TypedArrays** (for binary parsing)
- **LocalStorage** (for caching analysis results)
- **ES2020+** features (BigInt, optional chaining, nullish coalescing)

### Knowledge Prerequisites

- TypeScript 5.x
- React 18+ with Hooks
- Web Workers and multithreading concepts
- Binary file formats (basic understanding)
- Vite build system

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sizeanalyzer
```

### 2. Install Dependencies

```bash
npm install
```

This will install:

- **React 18+** - UI framework
- **Vite 5+** - Build tool and dev server
- **TypeScript 5.x** - Type system
- **fflate** - ZIP parsing (6-25x faster than JSZip)
- **@plist/plist** - iOS plist parsing
- **kaitai-struct-compiler** - Binary format parsing
- **app-info-parser** - Android manifest extraction
- **Nivo** - Treemap visualization
- **TanStack Table v8** - Virtual scrolling tables
- **TanStack Virtual** - Virtualization primitives
- **Comlink** - Web Worker communication
- **Zustand** - State management
- **TailwindCSS 3+** - Styling
- **Shadcn/UI** - Component library
- **Vitest** - Testing framework

### 3. Environment Setup

Create a `.env.local` file (optional):

```bash
# Performance tuning
VITE_MAX_UPLOAD_SIZE=2000000000  # 2GB max file size
VITE_WORKER_POOL_SIZE=4          # Number of parser workers

# Analytics (optional)
VITE_ANALYTICS_ENABLED=false
```

### 4. Verify Installation

```bash
npm run dev
```

Open http://localhost:5173 in your browser. You should see the upload interface.

---

## Development Workflow

### Starting the Dev Server

```bash
npm run dev
```

- **Hot Module Replacement (HMR)** enabled
- **TypeScript checking** in watch mode
- **Auto-reload** on file changes
- Available at: http://localhost:5173

### Project Structure

```
src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Root component
├── components/
│   ├── upload/
│   │   ├── UploadZone.tsx     # File drop/selection UI
│   │   └── UploadProgress.tsx # Progress indicator
│   ├── breakdown/
│   │   ├── BreakdownTree.tsx  # Hierarchical tree view
│   │   └── BreakdownTable.tsx # Virtual scrolling table
│   ├── treemap/
│   │   └── XRayTreemap.tsx    # Interactive treemap
│   └── insights/
│       ├── InsightsPanel.tsx  # Insight cards display
│       └── InsightCard.tsx    # Individual insight
├── workers/
│   ├── ios-parser.worker.ts   # iOS parsing worker
│   ├── android-parser.worker.ts # Android parsing worker
│   └── analysis.worker.ts     # Analysis engine worker
├── lib/
│   ├── parsers/
│   │   ├── ios/               # iOS parser implementations
│   │   └── android/           # Android parser implementations
│   ├── analysis/
│   │   ├── engine.ts          # Analysis orchestration
│   │   └── insights/          # Insight rule implementations
│   └── visualization/
│       ├── treemap.ts         # Treemap data transformation
│       └── export.ts          # CSV/JSON export
├── store/
│   └── analysis-store.ts      # Zustand global state
├── hooks/
│   ├── useAnalysis.ts         # Analysis orchestration hook
│   ├── useParser.ts           # Parser worker management
│   └── useInsights.ts         # Insights execution hook
└── types/
    └── analysis.ts            # TypeScript type definitions
```

### Common Tasks

#### Adding a New Insight Rule

1. Create rule definition in `src/lib/analysis/insights/`:

```typescript
// src/lib/analysis/insights/R007-large-videos.ts
import type { InsightRule } from '../../../types/analysis';

export const RULE_LARGE_VIDEOS: InsightRule = {
  id: 'R007',
  category: 'optimization',
  name: 'Compress large video files',
  description: 'Video files over 10MB should be compressed',
  severity: 'medium',
  fixable: false,
  execute: async (context) => {
    const largeVideos = context.assets.filter(
      (a) => a.type === 'video' && a.size > 10 * 1024 * 1024
    );

    if (largeVideos.length === 0) return [];

    return [{
      ruleId: 'R007',
      title: 'Large video files detected',
      description: `Found ${largeVideos.length} videos over 10MB`,
      severity: 'medium',
      category: 'optimization',
      affectedItems: largeVideos.map((v) => ({
        path: v.path,
        size: v.size,
        reason: 'Video exceeds 10MB threshold',
      })),
      potentialSavings: 0,
      percentOfTotal: 0,
      actionable: true,
      fixSuggestion: 'Consider using H.265/HEVC or reducing resolution',
    }];
  },
};
```

2. Register in `src/lib/analysis/engine.ts`:

```typescript
import { RULE_LARGE_VIDEOS } from './insights/R007-large-videos';

export const DEFAULT_RULES = [
  // ... existing rules
  RULE_LARGE_VIDEOS,
];
```

3. Add tests in `src/lib/analysis/insights/__tests__/R007-large-videos.test.ts`

#### Adding a New Content Type

1. Update type definition in `src/types/analysis.ts`:

```typescript
export type ContentType =
  | 'framework'
  | 'bundle'
  // ... existing types
  | 'shader'  // NEW
  | 'unknown';
```

2. Add detection logic in parser (`src/lib/parsers/ios/ipa-parser.ts`):

```typescript
function detectContentType(path: string): ContentType {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'metal':
    case 'glsl':
    case 'hlsl':
      return 'shader';
    // ... existing cases
  }
}
```

3. Update visualization colors in `src/lib/visualization/treemap.ts`

#### Running Tests

```bash
# Run all tests
npm test

# Watch mode (recommended during development)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test -- src/lib/parsers/ios/__tests__/ipa-parser.test.ts
```

#### Linting and Formatting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format
```

---

## Architecture Overview

### Data Flow

```
User Uploads File
    ↓
[Main Thread] Validation + Format Detection
    ↓
[Parser Worker] Binary Parsing (iOS or Android)
    ↓
[Analysis Worker] Generate Breakdown Tree + Execute Insights
    ↓
[Main Thread] Update Zustand Store
    ↓
React Components Re-render (Breakdown, Treemap, Insights)
```

### State Management

**Zustand Store** (`src/store/analysis-store.ts`):

```typescript
interface AnalysisStore {
  // Current analysis context
  context: AnalysisContext | null;

  // UI state
  selectedNode: BreakdownNode | null;
  expandedNodes: Set<string>;

  // Actions
  setContext: (context: AnalysisContext) => void;
  selectNode: (node: BreakdownNode | null) => void;
  toggleExpand: (nodeId: string) => void;
}
```

Access in components:

```typescript
import { useAnalysisStore } from '../store/analysis-store';

function MyComponent() {
  const { context, selectNode } = useAnalysisStore();
  // ...
}
```

### Web Worker Communication

**Using Comlink** for type-safe worker communication:

```typescript
// Main thread
import { wrap } from 'comlink';
import type { IOSParserContract } from '../types/parsers';

const worker = new Worker(
  new URL('../workers/ios-parser.worker.ts', import.meta.url),
  { type: 'module' }
);

const parser = wrap<IOSParserContract>(worker);

parser.onProgress((progress, status) => {
  console.log(`${progress}%: ${status}`);
});

const result = await parser.parse(file);
```

### Performance Considerations

- **Streaming ZIP parsing** with fflate (handles multi-GB files)
- **Module Workers** for better performance (no serialization overhead with Comlink)
- **Virtual scrolling** for tables (TanStack Virtual handles 100k+ rows)
- **Canvas rendering** for treemap (Nivo TreeMapCanvas handles 10k+ nodes)
- **Debounced search** for breakdown table filters
- **Lazy insight execution** (computed on-demand, not during parsing)

---

## Key Integration Points

### 1. Binary Parser Integration

**Contract**: `specs/001-app-size-analyzer/contracts/ios-parser.ts`

Implement parsers following the contract:

```typescript
import type { IOSParserContract, IOSParseResult } from '../types/parsers';

export function createIOSParser(): IOSParserContract {
  return {
    parse: async (file, options) => {
      // 1. Validate ZIP format
      // 2. Extract Info.plist
      // 3. Parse executable (Mach-O)
      // 4. Enumerate frameworks
      // 5. Catalog assets
      // 6. Return IOSParseResult
    },
    validateFormat: async (file) => {
      // Check ZIP signature and Payload/ structure
    },
    cancel: () => {
      // Abort ongoing operation
    },
    onProgress: (callback) => {
      // Register progress callback
    },
  };
}
```

### 2. Insight Rule Integration

**Contract**: `specs/001-app-size-analyzer/contracts/analysis-engine.ts`

Create custom rules:

```typescript
import type { InsightRule } from '../types/analysis';

export const RULE_CUSTOM: InsightRule = {
  id: 'R999',
  category: 'optimization',
  name: 'Custom rule name',
  description: 'Rule description',
  severity: 'medium',
  fixable: false,
  execute: async (context) => {
    // Analyze context.assets, context.frameworks, etc.
    // Return InsightResult[]
  },
};
```

Register with engine:

```typescript
import { createAnalysisEngine } from './lib/analysis/engine';

const engine = createAnalysisEngine();
engine.registerRule(RULE_CUSTOM);
```

### 3. Visualization Integration

**Contract**: `specs/001-app-size-analyzer/contracts/visualization.ts`

Transform data for UI components:

```typescript
import { createVisualization } from './lib/visualization/treemap';

const viz = createVisualization();

// For treemap
const treemapData = viz.toTreemapData(context.breakdownRoot, {
  maxDepth: 3,
  minSize: 100 * 1024, // 100 KB
  colorScheme: 'viridis',
});

// For table
const tableRows = viz.flattenForTable(context.breakdownRoot, {
  sortBy: 'size-desc',
  limit: 1000,
});
```

---

## Testing

### Unit Tests

**Location**: `src/lib/**/__tests__/*.test.ts`

**Example** (`src/lib/parsers/ios/__tests__/ipa-parser.test.ts`):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createIOSParser } from '../ipa-parser';

describe('IOSParser', () => {
  it('should parse valid IPA file', async () => {
    const parser = createIOSParser();
    const mockFile = new File([mockIPAData], 'test.ipa', {
      type: 'application/octet-stream',
    });

    const result = await parser.parse(mockFile);

    expect(result.appName).toBe('Test App');
    expect(result.bundleIdentifier).toBe('com.example.test');
    expect(result.platform).toBe('iOS');
  });

  it('should reject invalid format', async () => {
    const parser = createIOSParser();
    const mockFile = new File([new Uint8Array([1, 2, 3])], 'invalid.ipa');

    await expect(parser.parse(mockFile)).rejects.toThrow('INVALID_FORMAT');
  });
});
```

Run tests:

```bash
npm test -- src/lib/parsers/ios/__tests__/ipa-parser.test.ts
```

### Integration Tests

**Location**: `src/__tests__/integration/*.test.ts`

Test complete workflows:

```typescript
describe('Complete Analysis Workflow', () => {
  it('should analyze iOS IPA from upload to insights', async () => {
    // 1. Upload file
    const file = await loadFixture('sample.ipa');

    // 2. Parse
    const parser = createIOSParser();
    const parseResult = await parser.parse(file);

    // 3. Analyze
    const engine = createAnalysisEngine();
    const context = await engine.analyze(parseResult);

    // 4. Generate insights
    const insights = await engine.executeInsights(context);

    // 5. Verify
    expect(context.totalInstallSize).toBeGreaterThan(0);
    expect(insights.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Optional)

Use Playwright for browser testing:

```bash
npm run test:e2e
```

---

## Building for Production

### 1. Run Production Build

```bash
npm run build
```

Output: `dist/` directory with optimized assets

### 2. Preview Production Build Locally

```bash
npm run preview
```

Available at: http://localhost:4173

### 3. Build Optimizations

Vite automatically applies:

- **Code splitting** (chunk per route/worker)
- **Tree shaking** (removes unused code)
- **Minification** (Terser for JS, cssnano for CSS)
- **Asset hashing** (cache busting)
- **Compression** (gzip/brotli compatible)

### 4. Deployment

#### Static Hosting (Recommended)

Deploy `dist/` folder to:

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir=dist`
- **Cloudflare Pages**: Connect GitHub repo
- **AWS S3 + CloudFront**: Sync `dist/` to S3 bucket

#### Environment Variables

Set in hosting platform:

```bash
VITE_ANALYTICS_ENABLED=true
VITE_MAX_UPLOAD_SIZE=2000000000
```

#### CORS Configuration

Not required (client-side only, no backend API calls)

---

## Troubleshooting

### Common Issues

#### 1. Parser Worker Fails to Load

**Symptom**: `Failed to load module script` error

**Solution**: Ensure `type: 'module'` in Worker constructor:

```typescript
const worker = new Worker(
  new URL('../workers/ios-parser.worker.ts', import.meta.url),
  { type: 'module' }  // ← Required
);
```

#### 2. Out of Memory on Large Files

**Symptom**: Browser tab crashes or freezes

**Solution**:
- Use streaming APIs in fflate:
  ```typescript
  unzip(data, {
    filter: (file) => file.name.startsWith('Payload/'),
  }, (err, unzipped) => {
    // Process files incrementally
  });
  ```
- Increase `VITE_WORKER_POOL_SIZE` for parallel processing

#### 3. Treemap Not Rendering

**Symptom**: Blank treemap component

**Solution**:
- Verify `TreemapData` has `value` field populated
- Check browser console for errors
- Use `TreeMapCanvas` (not `TreeMap`) for large datasets:
  ```tsx
  import { ResponsiveTreeMapCanvas } from '@nivo/treemap';
  ```

#### 4. Slow Table Scrolling

**Symptom**: Laggy scrolling with large datasets

**Solution**:
- Ensure `@tanstack/react-virtual` is properly configured:
  ```typescript
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // Fixed row height
    overscan: 10,           // Buffer rows
  });
  ```

#### 5. TypeScript Errors on Worker Types

**Symptom**: `Cannot find module` for worker imports

**Solution**: Add type definitions in `src/types/workers.d.ts`:

```typescript
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

### Performance Profiling

Use React DevTools Profiler and Chrome DevTools:

```bash
# Build with profiling enabled
npm run build -- --mode profiling
```

Analyze:
- **React Profiler**: Component render times
- **Chrome Performance**: Web Worker overhead
- **Memory**: Heap snapshots for memory leaks

### Debug Mode

Enable debug logging:

```typescript
// src/lib/parsers/ios/ipa-parser.ts
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  console.log('[IOSParser] Parsing file:', file.name);
}
```

---

## Additional Resources

- **Data Model**: `specs/001-app-size-analyzer/data-model.md`
- **Contracts**: `specs/001-app-size-analyzer/contracts/`
- **Research**: `specs/001-app-size-analyzer/research.md`
- **Spec**: `specs/001-app-size-analyzer/spec.md`

### Library Documentation

- **fflate**: https://github.com/101arrowz/fflate
- **@plist/plist**: https://github.com/TooTallNate/plist.js
- **Kaitai Struct**: https://kaitai.io/
- **Nivo**: https://nivo.rocks/treemap/
- **TanStack Table**: https://tanstack.com/table/latest
- **TanStack Virtual**: https://tanstack.com/virtual/latest
- **Comlink**: https://github.com/GoogleChromeLabs/comlink
- **Zustand**: https://zustand-demo.pmnd.rs/

---

**Last Updated**: 2025-11-07
**Maintainers**: Development Team
**Questions**: Open an issue on GitHub
