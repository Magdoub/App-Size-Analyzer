# Technical Research: Mobile App Binary Analysis Libraries

**Date:** 2024-11-07
**Purpose:** Evaluate JavaScript/TypeScript libraries for browser-based mobile app binary parsing and visualization

---

## 1. ZIP Archive Parsing

### Recommended: **fflate**

**Rationale:**
- **Performance:** 6x to 25x faster than JSZip, especially with Web Workers
- **Memory Efficiency:** Streaming API for multi-gigabyte files, `consume` option dramatically reduces memory usage
- **Modern Architecture:** True async with separate worker threads (JSZip blocks main thread even in async mode)
- **Size:** Only 8KB package size
- **TypeScript Support:** Full TypeScript support with type definitions
- **Browser Compatibility:** Works in all modern browsers

**Key Features:**
- Streaming decompression via `Unzip` class with `ondata` callbacks
- Parallel file decompression with `AsyncUnzipInflate`
- Can handle multi-gigabyte files without loading entire archive into memory
- Better compression ratios than even native Zlib C library

**Alternatives Considered:**

1. **JSZip** (Rejected)
   - Slower performance (5-25x slower than fflate)
   - Async API still blocks main thread during decompression
   - Requires entire file in memory
   - Must read entries sequentially
   - Simpler API but not worth the performance penalty

2. **unzipit** (Alternative)
   - Built on fflate, provides higher-level API
   - Good option if you want simpler interface
   - Slightly less control than raw fflate

**Implementation Notes:**
```typescript
import { unzip, Unzip } from 'fflate';

// For memory efficiency with large files, use streaming:
const unzipper = new Unzip((file) => {
  file.ondata = (err, data, final) => {
    if (!err) {
      // Process chunk
    }
  };
  file.start();
});

// Feed chunks to unzipper
unzipper.push(chunk, false);
unzipper.push(lastChunk, true); // final=true
```

**Gotchas:**
- Steeper learning curve than JSZip
- Need to understand streaming concepts for large files
- `consume` option makes original data unusable

---

## 2. Binary Plist Parsing (iOS)

### Recommended: **@plist/plist**

**Rationale:**
- **Universal Support:** Works in both browser and Node.js
- **Modern Implementation:** Uses ArrayBuffer instead of Buffer
- **No Node Dependencies:** No fs or other Node-only libraries
- **TypeScript Support:** Written in TypeScript
- **Comprehensive:** Supports binary, text (OpenStep/NEXTStep), and XML plists

**Browser Compatibility:**
- Requires BigInt support (browsers from 2019+)
- All modern browsers (Chrome, Firefox, Safari, Edge) fully supported

**Alternatives Considered:**

1. **bplist-parser** (Rejected)
   - Originally Node.js only
   - Requires browserify for browser use
   - Less maintained than @plist/plist

2. **@szydlovski/bplist-parser** (Alternative)
   - Isomorphic library (browser + Node)
   - Good option but less comprehensive than @plist/plist

3. **bplist-universal** (Alternative)
   - Works cross-browser
   - Less active maintenance

**Implementation Notes:**
```typescript
import { parse } from '@plist/plist';

// Parse binary plist
const plistBuffer = await file.arrayBuffer();
const parsed = parse(plistBuffer);

// Access Info.plist data
const bundleId = parsed.CFBundleIdentifier;
const version = parsed.CFBundleShortVersionString;
```

**Gotchas:**
- BigInt requirement may affect very old browsers
- Must use ArrayBuffer, not Node.js Buffer

---

## 3. Mach-O Header Parsing (iOS)

### Recommended: **Kaitai Struct (JavaScript Runtime)**

**Rationale:**
- **Comprehensive Format Support:** Complete Mach-O specification implementation
- **Code Generation:** Compiler generates optimized parsers (no runtime penalty)
- **Multi-Format:** Same tool can parse DEX, ELF, PE, and other binary formats
- **Browser Compatible:** JavaScript runtime works in browsers
- **Well Documented:** Formal specifications available

**Performance:**
- No runtime interpreter overhead
- Generated code is as fast as hand-written parsers
- Can parse headers without loading entire binary

**Alternatives Considered:**

1. **Custom Implementation** (Rejected)
   - Mach-O format is complex (FAT binaries, load commands, etc.)
   - Significant development time required
   - Hard to maintain and test
   - Reinventing the wheel

2. **jParser** (Rejected)
   - Generic binary parser library
   - No Mach-O-specific implementation
   - Would still need to write format definitions

**Implementation Notes:**
```typescript
// Install runtime and compiled parser
// npm install kaitai-struct
// Download mach_o.js from formats.kaitai.io

import { KaitaiStream } from 'kaitai-struct';
import { MachO } from './mach_o';

// Parse Mach-O header
const buffer = await fetch(url).then(r => r.arrayBuffer());
const stream = new KaitaiStream(buffer);
const machO = new MachO(stream);

// Extract architecture info
const cpuType = machO.header.cputype;
const cpuSubtype = machO.header.cpusubtype;

// Check for debug symbols
const hasDebugSymbols = machO.loadCommands.some(
  cmd => cmd.type === MachO.LoadCommandType.SYMTAB
);
```

**Gotchas:**
- Requires loading binary data via XMLHttpRequest with arraybuffer response type
- Need to include both KaitaiStream.js runtime and compiled parser
- Learning curve for Kaitai Struct tooling

---

## 4. Android Binary XML Parsing

### Recommended: **app-info-parser**

**Rationale:**
- **Dual Platform Support:** Handles both APK (Android) and IPA (iOS)
- **Browser Support:** Explicitly supports browser environments
- **Complete Extraction:** Returns JSON from AndroidManifest.xml and Info.plist
- **Active Maintenance:** Regular updates
- **TypeScript Support:** Type definitions available

**Browser Compatibility:**
- Latest Chrome, Firefox, Safari, Edge
- Works with modern build tools (though some Vite configuration needed)

**Alternatives Considered:**

1. **adbkit-apkreader** (Rejected)
   - Node.js focused
   - DOM API compatibility but heavier
   - More complex than needed

2. **node-apk-parser** (Rejected)
   - Node.js only
   - No browser support

3. **reiko-parser** (Alternative)
   - Supports browser and Node.js
   - Can extract icons
   - Good alternative if icon extraction needed

**Implementation Notes:**
```typescript
import AppInfoParser from 'app-info-parser';

// Parse APK file
const parser = new AppInfoParser(file); // File object from input
const result = await parser.parse();

// Access manifest data
const {
  package: packageName,
  versionName,
  versionCode,
  minSdkVersion,
  targetSdkVersion,
  application: {
    label,
    icon
  }
} = result;
```

**Gotchas:**
- Some dependencies don't support browser environments
- May need build tool configuration (Vite doesn't support Node built-ins on client)
- Consider polyfills or alternative bundler configuration

**Known Limitations:**
- Dependencies have Node.js assumptions
- May require bundler configuration for full browser support

---

## 5. DEX File Parsing (Android)

### Recommended: **Kaitai Struct (JavaScript Runtime)**

**Rationale:**
- **Formal Specification:** Complete DEX format implementation
- **Method Count Access:** Direct access to methodIds array
- **Performance:** Compiled parser, no runtime overhead
- **Consistency:** Same tooling as Mach-O parsing
- **Browser Compatible:** JavaScript runtime works in browsers

**Key Features:**
- Parse DEX file structure
- Extract method count information
- Access all method identifiers
- Parse class definitions and string tables

**Alternatives Considered:**

1. **dex-method-counts** (Rejected)
   - Command-line tool, not library
   - Java-based, can't run in browser
   - Would need server-side processing

2. **Custom Implementation** (Rejected)
   - DEX format is complex
   - Method counting requires understanding string pools, type lists, proto IDs
   - Significant development effort

3. **Port dex-method-counts** (Rejected)
   - Would essentially recreate Kaitai Struct's work
   - More maintenance burden

**Implementation Notes:**
```typescript
import { KaitaiStream } from 'kaitai-struct';
import { Dex } from './dex'; // Download from formats.kaitai.io

// Parse DEX file
const buffer = await file.arrayBuffer();
const stream = new KaitaiStream(buffer);
const dex = new Dex(stream);

// Get method count
const methodCount = dex.methodIds.length;

// Extract method info by package
const methodsByPackage = new Map<string, number>();
dex.methodIds.forEach(methodId => {
  const className = dex.typeIds[methodId.classIdx].descriptor;
  const packageName = className.split('/').slice(0, -1).join('.');
  methodsByPackage.set(
    packageName,
    (methodsByPackage.get(packageName) || 0) + 1
  );
});
```

**Gotchas:**
- Need to understand DEX file structure (type IDs, method IDs, string pools)
- Large APKs may have multiple DEX files (classes.dex, classes2.dex, etc.)
- Must aggregate counts across all DEX files

---

## 6. Treemap Visualization

### Recommended: **Nivo (@nivo/treemap)**

**Rationale:**
- **Performance:** Canvas rendering option for large datasets (10k+ nodes)
- **Balance:** Extensive customization without D3.js complexity
- **React Integration:** Built for React with hooks support
- **Documentation:** Comprehensive docs with interactive playground
- **Customization:** Modify colors, labels, legends, tooltips, animations
- **Responsive:** Built-in responsive design support

**Key Advantages:**
- Three rendering modes: SVG (small datasets), HTML, Canvas (large datasets)
- Canvas mode essential for 10k+ nodes
- Exhaustive documentation with live examples
- Strong TypeScript support

**Alternatives Considered:**

1. **D3.js** (Rejected for primary use)
   - **Pros:** Maximum control, unlimited customization
   - **Cons:**
     - Steep learning curve
     - Time-consuming to add tooltips, responsiveness
     - Requires deep SVG/Canvas knowledge
     - Not React-friendly out of the box
   - **Use Case:** Consider only if you need highly custom interactions that Nivo can't provide

2. **Recharts** (Rejected)
   - **Pros:** Simple API, easy to use
   - **Cons:**
     - Limited customization options
     - Difficult to customize beyond predefined designs
     - Can be glitchy with multiple animated charts
     - Less performant with huge datasets
   - SVG-only, no canvas fallback

**Implementation Notes:**
```typescript
import { ResponsiveTreeMapCanvas } from '@nivo/treemap';

// For 10k+ nodes, use Canvas version
<ResponsiveTreeMapCanvas
  data={treeData}
  identity="name"
  value="size"
  valueFormat=".02s"
  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
  labelSkipSize={12}
  labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
  parentLabelPosition="left"
  parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
  borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
  onClick={(node) => handleNodeClick(node)}
/>
```

**Performance Guidelines:**
- Use `ResponsiveTreeMap` (SVG) for < 1,000 nodes
- Use `ResponsiveTreeMapCanvas` for 1,000+ nodes
- Canvas trades transitions/SSR for performance
- SVG/HTML don't perform well with thousands of nodes

**Gotchas:**
- Canvas version loses isomorphic rendering capability
- Canvas version has no transitions
- Need to handle hover states manually in canvas mode

---

## 7. Virtual Scrolling Tables

### Recommended: **TanStack Table v8 + TanStack Virtual**

**Rationale:**
- **Headless Architecture:** Complete control over rendering
- **Best Performance:** Optimized for 100k+ rows
- **Modern API:** Hooks-based, TypeScript-first
- **Feature Rich:** Sorting, filtering, grouping, column resizing
- **Active Development:** Part of TanStack ecosystem, well maintained
- **Flexible:** Works with any UI framework or vanilla JS

**Key Advantages:**
- Separation of concerns: table logic separate from virtualization
- Can render only visible rows (typically 20-50)
- Handles sticky headers/columns
- Column virtualization for wide tables
- Excellent TypeScript support

**Alternatives Considered:**

1. **react-virtuoso** (Alternative - Simpler Use Cases)
   - **Pros:**
     - Easier API for simple lists
     - Automatic row height measurement
     - Built-in infinite scroll
     - Good for variable height rows
   - **Cons:**
     - Less table-specific features
     - Not headless (more opinionated)
     - Less control over table functionality
   - **Use Case:** Good for simple lists without complex table features

2. **react-window** (Rejected)
   - **Pros:**
     - Very small and performant
     - Simple API
     - Brian Vaughn's work (React core team)
   - **Cons:**
     - Too simple for complex tables
     - No built-in table features
     - Requires fixed row heights (or manual height cache)
     - Less maintained than TanStack
   - **Note:** TanStack Virtual was created to address react-window's limitations

**Implementation Notes:**
```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

function DataTable({ data, columns }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // Row height
    overscan: 10, // Render extra rows for smooth scrolling
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Render row cells */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Performance Optimization Tips:**

1. **Memoize Complex Cells:**
   ```typescript
   const Cell = memo(({ value }) => <ComplexComponent value={value} />);
   ```

2. **Lazy Load Complex Components:**
   ```typescript
   // Render simple placeholder first, then upgrade
   useEffect(() => {
     const timeout = setTimeout(() => setFullyRendered(true), 0);
     return () => clearTimeout(timeout);
   }, []);
   ```

3. **Use CSS Transform (not just position):**
   - Both position and transform improve scroll performance

4. **Proper Key Management:**
   - Never use array index as key in virtualized lists
   - Use stable unique IDs from data

5. **Overscan Configuration:**
   ```typescript
   overscan: 10 // Render 10 extra rows above/below viewport
   ```

**Common Pitfalls:**
- Cell complexity adds major overhead (use memoization)
- Improper keys cause erratic behavior
- Not handling scroll position can cause jumps
- Variable heights require measurement (use `virtualizer.measureElement()`)

**Gotchas:**
- Requires manual positioning with absolute/relative CSS
- Need to calculate total container height
- Variable row heights require measuring elements
- Complex cells can block main thread even with virtualization

---

## 8. Web Worker Best Practices (TypeScript + Vite)

### Recommended: **Module Workers with Comlink**

**Rationale:**
- **Type Safety:** Full TypeScript support with automatic type inference
- **Simple API:** Removes message passing boilerplate
- **Modern:** Uses Proxy for transparent async calls
- **Vite Native:** Vite has built-in module worker support
- **Error Handling:** Better error propagation than raw postMessage

**Architecture:**

1. **Module Workers (Not Classic Workers)**
   - Use ES imports instead of `importScripts()`
   - Better tooling support (bundlers, TypeScript)
   - Vite default

2. **Comlink for Communication**
   - Makes workers feel like async functions
   - Automatic type inference from worker exports
   - Handles serialization/deserialization

**Implementation Pattern:**

**Worker File (`worker.ts`):**
```typescript
// worker.ts
import { expose } from 'comlink';

export interface WorkerAPI {
  parseAPK: (buffer: ArrayBuffer) => Promise<APKInfo>;
  parseDEX: (buffer: ArrayBuffer) => Promise<MethodCount>;
}

const api: WorkerAPI = {
  async parseAPK(buffer) {
    // Heavy parsing work
    const result = await heavyParsing(buffer);
    return result;
  },

  async parseDEX(buffer) {
    const methods = await extractMethods(buffer);
    return { count: methods.length, methods };
  }
};

expose(api);
```

**Main Thread (`main.ts`):**
```typescript
// main.ts
import { wrap, Remote } from 'comlink';
import type { WorkerAPI } from './worker';

let workerInstance: Worker | null = null;
let api: Remote<WorkerAPI> | null = null;

export function initWorker() {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );
    api = wrap<WorkerAPI>(workerInstance);
  }
  return api;
}

export function terminateWorker() {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    api = null;
  }
}

// Usage
async function processFile(file: File) {
  const worker = initWorker();
  const buffer = await file.arrayBuffer();

  try {
    const result = await worker.parseAPK(buffer);
    console.log('Parsed:', result);
  } catch (error) {
    console.error('Worker error:', error);
  } finally {
    // Optional: terminate if one-time use
    // terminateWorker();
  }
}
```

**React Integration:**
```typescript
import { useEffect, useRef } from 'react';
import { wrap, Remote } from 'comlink';
import type { WorkerAPI } from './worker';

export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<WorkerAPI> | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );
    apiRef.current = wrap<WorkerAPI>(workerRef.current);

    // Cleanup
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  return apiRef.current;
}

// Component usage
function FileProcessor() {
  const worker = useWorker();
  const [result, setResult] = useState(null);

  const handleFile = async (file: File) => {
    if (!worker) return;

    const buffer = await file.arrayBuffer();
    const parsed = await worker.parseAPK(buffer);
    setResult(parsed);
  };

  return (
    <input type="file" onChange={(e) => handleFile(e.target.files[0])} />
  );
}
```

**Vite Configuration:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  worker: {
    format: 'es', // Use ES modules in workers
  },
});
```

**Progress Reporting Pattern:**
```typescript
// worker.ts
import { expose } from 'comlink';

export type ProgressCallback = (progress: number, status: string) => void;

const api = {
  async parseWithProgress(
    buffer: ArrayBuffer,
    onProgress: ProgressCallback
  ) {
    onProgress(0, 'Starting...');

    // Parse ZIP
    const files = await parseZIP(buffer);
    onProgress(25, 'ZIP extracted');

    // Parse manifest
    const manifest = await parseManifest(files['AndroidManifest.xml']);
    onProgress(50, 'Manifest parsed');

    // Parse DEX files
    const methods = await parseDEX(files['classes.dex']);
    onProgress(75, 'DEX analyzed');

    // Generate report
    const report = generateReport(manifest, methods);
    onProgress(100, 'Complete');

    return report;
  }
};

expose(api);
```

**Error Handling Pattern:**
```typescript
// worker.ts
export class WorkerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}

const api = {
  async parseAPK(buffer: ArrayBuffer) {
    try {
      if (buffer.byteLength === 0) {
        throw new WorkerError(
          'Empty file',
          'EMPTY_FILE'
        );
      }

      const result = await parse(buffer);
      return result;

    } catch (error) {
      if (error instanceof WorkerError) {
        throw error;
      }
      throw new WorkerError(
        'Parsing failed',
        'PARSE_ERROR',
        error
      );
    }
  }
};

// Main thread
try {
  const result = await worker.parseAPK(buffer);
} catch (error) {
  if (error.code === 'EMPTY_FILE') {
    showError('Please select a valid file');
  } else {
    showError('Failed to parse file');
    console.error(error.details);
  }
}
```

**Type Safety with Comlink:**
```typescript
// Types are automatically inferred!
const worker = wrap<WorkerAPI>(workerInstance);

// This is type-safe:
const result: APKInfo = await worker.parseAPK(buffer);

// TypeScript knows Remote<T> wraps all methods in Promises:
// WorkerAPI.parseAPK returns Promise<APKInfo>
// Remote<WorkerAPI>.parseAPK also returns Promise<APKInfo>
```

**Best Practices:**

1. **Always Terminate in Cleanup:**
   ```typescript
   useEffect(() => {
     const worker = new Worker(url, { type: 'module' });
     return () => worker.terminate(); // Critical!
   }, []);
   ```

2. **Use Module Workers:**
   ```typescript
   new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
   ```

3. **Transfer Ownership for Large Buffers:**
   ```typescript
   import { transfer } from 'comlink';

   // Transfer ArrayBuffer ownership to avoid copying
   return transfer(largeBuffer, [largeBuffer]);
   ```

4. **Handle Worker Unavailability:**
   ```typescript
   if (!window.Worker) {
     // Fallback: run parsing in main thread
     return parseInMainThread(buffer);
   }
   ```

5. **Pool Workers for Parallel Processing:**
   ```typescript
   const workerPool = Array.from({ length: 4 }, () =>
     new Worker(url, { type: 'module' })
   );

   // Distribute work across workers
   ```

**Common Gotchas:**

1. **Structured Clone Limitation:**
   - Workers use structured clone algorithm
   - Cannot send functions, symbols, DOM nodes
   - Can send: primitives, ArrayBuffers, TypedArrays, Maps, Sets

2. **Module Loading:**
   - Workers don't share main thread's module cache
   - Imports in workers are separate network requests
   - Consider bundling worker code

3. **Debugging:**
   - Use Chrome DevTools > Sources > Threads
   - Set breakpoints in worker files
   - Console.log from workers appears in main console

4. **Comlink Type Limitations:**
   - `Remote<T>` wraps everything in Promise
   - Complex generic types may need manual annotation
   - Callbacks work but are async

**Performance Considerations:**

- Transferring ArrayBuffers is fast (ownership transfer, not copy)
- Copying large objects has overhead
- Creating/terminating workers has cost (reuse when possible)
- Workers don't share memory with main thread

**Testing:**
```typescript
// Mock worker for tests
vi.mock('./worker', () => ({
  parseAPK: vi.fn().mockResolvedValue({ /* mock data */ })
}));
```

---

## Summary Table

| Category | Recommended | Key Reason | Alternatives |
|----------|-------------|------------|--------------|
| **ZIP Parsing** | fflate | 6-25x faster, streaming support | JSZip, unzipit |
| **Binary Plist** | @plist/plist | Universal support, TypeScript | bplist-parser |
| **Mach-O Headers** | Kaitai Struct | Complete spec, no runtime penalty | Custom implementation |
| **Android Binary XML** | app-info-parser | Browser + Node, handles IPA too | adbkit-apkreader, reiko-parser |
| **DEX Parsing** | Kaitai Struct | Formal spec, consistent tooling | Custom implementation |
| **Treemap Viz** | Nivo | Canvas mode + customization balance | D3.js (complex), Recharts (simple) |
| **Virtual Tables** | TanStack Table + Virtual | Headless, 100k+ rows, feature-rich | react-virtuoso, react-window |
| **Web Workers** | Module Workers + Comlink | Type safety, simple API, Vite native | Raw postMessage |

---

## Recommended Stack

For the complete mobile app size analyzer:

```
Core Parsing:
- fflate (ZIP extraction)
- @plist/plist (iOS Info.plist)
- app-info-parser (Android manifest + iOS support)
- Kaitai Struct (Mach-O headers + DEX files)

Visualization:
- Nivo TreeMapCanvas (file size breakdown)
- TanStack Table + Virtual (file list)

Infrastructure:
- Web Workers (Comlink) (parsing in background)
- TypeScript (type safety)
- Vite (build tool)
```

**Total Bundle Size Estimate:**
- fflate: 8KB
- @plist/plist: ~15KB
- app-info-parser: ~50KB
- Kaitai Struct runtime: ~20KB
- Kaitai compiled parsers: ~40KB (Mach-O + DEX)
- Nivo core + treemap: ~120KB
- TanStack Table + Virtual: ~50KB
- Comlink: ~6KB

**Estimated Total:** ~310KB (minified, gzipped ~100KB)

---

## Next Steps

1. **Proof of Concept:**
   - Test fflate with sample IPA/APK files (1MB, 100MB, 500MB)
   - Verify Kaitai Struct parsers work in browser
   - Benchmark parsing performance

2. **Integration Testing:**
   - Verify all libraries work together
   - Test memory usage with large files
   - Validate TypeScript types

3. **Performance Validation:**
   - Benchmark parsing in Web Workers vs main thread
   - Test treemap rendering with 10k+ nodes
   - Measure virtual scrolling with 100k+ rows

4. **Browser Compatibility:**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify mobile browser support
   - Check for polyfill requirements

---

## References

### Documentation
- [fflate GitHub](https://github.com/101arrowz/fflate)
- [@plist/plist GitHub](https://github.com/mat-sz/plist)
- [Kaitai Struct Docs](https://doc.kaitai.io/)
- [app-info-parser GitHub](https://github.com/chenquincy/app-info-parser)
- [Nivo Documentation](https://nivo.rocks/)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [TanStack Virtual Docs](https://tanstack.com/virtual/latest)
- [Comlink GitHub](https://github.com/GoogleChromeLabs/comlink)

### Format Specifications
- [Mach-O Format (Apple)](https://developer.apple.com/documentation/bundleresources/information_property_list)
- [DEX Format (Android)](https://source.android.com/docs/core/dalvik/dex-format)
- [Binary Plist Format](https://opensource.apple.com/source/CF/CF-550/CFBinaryPList.c)
- [APK File Format](https://en.wikipedia.org/wiki/Apk_(file_format))

### Performance Resources
- [Optimizing Large Datasets with Virtualized Lists](https://medium.com/@eva.matova6/optimizing-large-datasets-with-virtualized-lists-70920e10da54)
- [Web Workers Best Practices](https://web.dev/workers-basics/)
- [Canvas vs SVG Performance](https://css-tricks.com/when-to-use-svg-vs-when-to-use-canvas/)
