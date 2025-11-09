# App Size Analyzer

A client-side binary analysis platform for iOS and Android app size optimization. Analyze `.ipa`, `.apk`, and `.xapk` files entirely in your browser with zero backend requirements.

## Features

### 📊 Breakdown View
- Hierarchical file system tree with sortable columns (name, size, percentage)
- Drill-down navigation through directories and file structures
- Compressed vs uncompressed size analysis
- Identify large files and optimization opportunities

### 🔍 X-Ray Treemap
- Interactive treemap visualization of app contents
- Color-coded by file category (executables, frameworks, assets, resources, etc.)
- Drill-down capability to explore nested directories
- Quick identification of space-consuming components

### 💡 Insights & Recommendations
- Automated analysis engine with severity-based insights (critical, warning, info)
- Smart detection of:
  - Uncompressed assets that should be optimized
  - Duplicate files and redundant resources
  - Large frameworks and native libraries
  - Multiple DEX files (Android multidex overhead)
  - Localization bloat
  - Asset catalog inefficiencies
- Filterable by severity, category, and keyword search
- Actionable recommendations with affected files and potential savings

## How It Works

### Architecture

This is a **100% client-side application** with no backend infrastructure:

1. **File Upload**: Drag & drop or select `.ipa`, `.apk`, or `.xapk` files
2. **Validation**: Client-side file type and size validation (up to 2GB)
3. **Web Worker Parsing**:
   - Binary parsing runs off the main thread for smooth UI
   - ZIP extraction using `fflate` library
   - iOS: Parses Mach-O executables, Info.plist, asset catalogs
   - Android: Parses DEX files, AndroidManifest.xml, ARSC resources
4. **Analysis Engine**: Generates breakdown trees, treemap data, and insights
5. **Visualization**: React-based UI with interactive charts and tables

### Privacy & Performance

- **Zero network requests**: All analysis happens in your browser
- **Your data stays local**: Files never leave your machine
- **Fast parsing**: Web Workers prevent UI blocking
- **Efficient memory**: Streaming ZIP extraction for large files

## Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.9 (strict mode)
- **Build**: Vite 5.4 with ES2020 target
- **State**: Zustand 5.0.8 (lightweight state management)
- **Visualization**: @nivo/treemap, @tanstack/react-table, @tanstack/react-virtual
- **Parsing**: fflate (ZIP), app-info-parser, custom Mach-O & DEX parsers
- **Workers**: Comlink for typed Web Worker communication
- **Styling**: Tailwind CSS 3.4.18

## Installation

### Prerequisites

- **Node.js**: 16+ recommended (for development)
- **npm**: Comes with Node.js

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd sizeanalyzer

# Install dependencies
npm install
```

## Running the Application

### Development Mode

Start the Vite development server with hot module replacement:

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

### Production Build

Build the optimized production bundle:

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

Test the production build locally:

```bash
npm run preview
```

### Other Commands

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check without emitting
npm run type-check
```

## Usage

### 1. Launch the Application

Run `npm run dev` and open http://localhost:5173 in your browser.

### 2. Upload a Binary

Drag and drop an `.ipa`, `.apk`, or `.xapk` file, or click to browse.

**Try these sample files** (located in `sample-files/`):
- `Tools-for-Procreate-IPAOMTK.COM.ipa` - 47MB iOS app
- `com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk` - 79MB Android app
- `A Night Battle HD 1.2.ipa` - 5.1MB iOS app (smaller, faster to test)

### 3. Explore the Analysis

Once parsing completes, navigate between views:

- **Breakdown**: Explore the file hierarchy and identify large files
- **X-Ray**: Visualize the app structure with an interactive treemap
- **Insights**: Review automated recommendations for size optimization

### 4. Analyze Results

- Sort by size to find the largest files
- Drill down into directories in both Breakdown and X-Ray views
- Filter insights by severity to prioritize critical optimizations
- Use breadcrumb navigation to move back up the hierarchy

## Supported File Formats

| Format | Platform | Notes |
|--------|----------|-------|
| `.ipa` | iOS | Standard iOS app packages |
| `.apk` | Android | Android application packages |
| `.xapk` | Android | XAPK containers (splits extraction) |
| `.aab` | Android | Android App Bundles (UI accepts, limited parsing) |

## Project Structure

```
src/
├── components/          # React UI components
│   ├── breakdown/       # File breakdown table & tabs
│   ├── insights/        # Insights cards & filters
│   ├── upload/          # File upload & validation
│   ├── xray/            # Treemap visualization
│   └── shared/          # Reusable components
├── lib/
│   ├── analysis/        # Breakdown generator & insight engine
│   ├── parsers/         # Binary parsers (iOS/Android)
│   │   ├── ios/         # IPA, Mach-O, plist, asset catalogs
│   │   └── android/     # APK, XAPK, DEX, ARSC, binary XML
│   └── visualization/   # Treemap generation & color schemes
├── store/               # Zustand state management
├── types/               # TypeScript type definitions
├── utils/               # Formatters & calculations
└── workers/             # Web Worker for off-thread parsing
```

## Browser Compatibility

This app requires modern browser features:
- **Web Workers**: For background parsing
- **File API**: For reading uploaded files
- **ES2020+**: Modern JavaScript features

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- **Large files**: Files over 100MB may take 1-2 minutes to parse
- **Timeout**: Dynamic timeout based on file size (30s base + 5s per MB)
- **Memory**: Large apps (500MB+) may require sufficient RAM
- **Recommended**: Use Chrome or Edge for best performance

## Development

### Architecture Patterns

- **Web Workers**: CPU-intensive parsing runs off the main thread
- **Lazy rendering**: Virtual scrolling for large file lists
- **Memoization**: React hooks prevent unnecessary re-renders
- **Code splitting**: Vendor chunks for optimal caching

### Key Libraries

- **fflate**: Fast ZIP decompression with streaming support
- **@plist/plist**: iOS property list parsing
- **app-info-parser**: Metadata extraction helper
- **Comlink**: Type-safe Web Worker communication
- **color2k**: Color manipulation for treemap gradients

## Troubleshooting

### Analysis Timeout

**Error**: "Analysis timeout: File took too long to process"

**Solution**:
- Try a smaller file first to verify the app works
- Larger files (100MB+) need more time - timeout increases automatically
- Check browser console for detailed errors

### Invalid File

**Error**: "Invalid APK/IPA file: Missing manifest/plist"

**Solution**:
- Ensure the file is not corrupted
- Verify it's a valid `.ipa` or `.apk` file (not renamed ZIP)
- Try re-downloading the file

### Out of Memory

**Error**: Browser tab crashes or freezes

**Solution**:
- Close other tabs to free up RAM
- Try a smaller file
- Use a desktop browser (more memory available)

## Contributing

This project follows a specification-first development workflow using SpecKit:

1. Features are documented in `specs/NNN-feature-name/`
2. Implementation follows `spec.md` → `plan.md` → `tasks.md`
3. See `CLAUDE.md` for development workflow details

## License

MIT

## Acknowledgments

Built with TypeScript, React, and Vite. Powered by client-side binary parsing with zero backend dependencies.
