# App Size Analyzer

**[Try it out here: appsizeanalyzer.com](https://appsizeanalyzer.com/)**

A client-side binary analysis platform for iOS and Android app size optimization.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Privacy](https://img.shields.io/badge/privacy-100%25%20client--side-green)

## Overview

App Size Analyzer helps developers understand and optimize mobile app binary sizes by providing detailed breakdowns, visual treemaps, and actionable insights. All analysis happens entirely in your browser—your binaries never leave your machine, ensuring complete privacy. No backend, no data transmission, no compromises.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sizeanalyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the app** at http://localhost:5173

5. **Try a sample file** (one-click quickstart):
   - Click any sample file card on the homepage
   - No upload required - instant analysis starts
   - Available sample files:
     - **A Night Battle HD** (5.1 MB iOS) - Quick test
     - **Tools for Procreate** (47 MB iOS) - Medium size
     - **Grasshopper Dialer** (79 MB Android) - Large app

   Or **drag and drop your own file** to analyze (`.ipa`, `.apk`, `.xapk`)

6. **Explore the analysis**:
   - **Breakdown** tab: File hierarchy, size breakdown, drill-down
   - **X-Ray** tab: Interactive treemap visualization
   - **Insights** tab: Optimization recommendations

## Features

### 🚀 One-Click Quickstart with Sample Files
Try the analyzer instantly without uploading your own files. Click any sample file card on the homepage to load and analyze pre-included iOS and Android apps (ranging from 5-80MB). Perfect for first-time users to see the tool in action within seconds.

### 📊 Breakdown View
Hierarchical file system tree with sortable columns (name, size, percentage). Drill down through directories and file structures to identify large files and optimization opportunities. Analyze both compressed and uncompressed sizes.

### 🔍 X-Ray Treemap
Interactive treemap visualization of your app's contents, color-coded by file category (executables, frameworks, assets, resources). Drill down into nested directories and quickly identify space-consuming components.

### 💡 Insights & Recommendations
Automated analysis engine with severity-based insights (critical, warning, info). Smart detection of uncompressed assets, duplicate files, large frameworks, DEX overhead, localization bloat, and more. Filter by severity, category, or keyword to prioritize optimizations.

## How It Works

**100% Client-Side** - Your data never leaves your machine:

1. **File Selection**: Choose from sample files or upload your own `.ipa`, `.apk`, or `.xapk` files
2. **Validation**: Client-side file type and size validation (up to 2GB)
3. **Web Worker Parsing**: Binary parsing runs off the main thread for smooth UI
   - ZIP extraction using `fflate` library
   - iOS: Parses Mach-O executables, Info.plist, asset catalogs
   - Android: Parses DEX files, AndroidManifest.xml, ARSC resources
4. **Analysis Engine**: Generates breakdown trees, treemap data, and insights
5. **Visualization**: React-based UI with interactive charts and tables

**Privacy & Performance**:
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

## Installation & Development

### Prerequisites

- **Node.js**: 16+ recommended
- **npm**: Comes with Node.js

### Running the Application

**Development Mode**:
```bash
npm run dev
```
The app will be available at **http://localhost:5173**

**Production Build**:
```bash
npm run build
```
Output will be in the `dist/` directory.

**Preview Production Build**:
```bash
npm run preview
```

### Other Commands

```bash
# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code
npm run type-check       # Type check without emitting
```

## Usage

### 1. Launch the Application

Run `npm run dev` and open http://localhost:5173 in your browser.

### 2. Analyze a Binary

**Option A: Try a sample file** (instant quickstart):
- Click any sample file card displayed on the homepage
- Sample files are pre-loaded and ready for one-click analysis
- No manual upload needed - perfect for first-time users

**Option B: Upload your own file**:
- Drag and drop an `.ipa`, `.apk`, or `.xapk` file
- Or click the upload zone to browse your files
- See [sample-files/README.md](sample-files/README.md) for test file details

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
| `.aab` | Android | Android App Bundles with module breakdown |
| `.zip` | iOS | Zipped .framework bundles with architecture analysis |

### Android App Bundle (AAB) Support

AAB files are fully supported with:
- Module detection (base + dynamic feature modules)
- Per-module size breakdown (DEX, resources, assets, native libraries)
- Protobuf manifest parsing for package name, version, SDK versions
- Architecture detection from native libraries

### iOS Framework Bundle Support

Framework bundles can be analyzed by zipping the `.framework` directory:
1. Locate your `MyFramework.framework` directory
2. Create a ZIP: `zip -r MyFramework.framework.zip MyFramework.framework`
3. Drop the ZIP file into the analyzer

Features include:
- Info.plist metadata extraction (bundle ID, version, platform)
- Mach-O binary parsing for architecture detection (arm64, x86_64, etc.)
- Universal binary slice breakdown with per-architecture sizes
- Content categorization (binary, headers, modules, resources)
- Support for both iOS flat and macOS versioned framework structures

## Documentation

- [Contributing Guide](docs/CONTRIBUTING.md) - SpecKit workflow, code standards, PR checklist
- [Codebase Exploration](docs/CODEBASE_EXPLORATION.md) - Technical deep dive into architecture
- [Feature Specs](specs/) - Completed and active features, implementation plans
- [Sample Files](sample-files/README.md) - Test file metadata, usage guide

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
│   │   ├── ios/         # IPA, Framework, Mach-O, plist, asset catalogs
│   │   └── android/     # APK, AAB, XAPK, DEX, ARSC, binary XML, protobuf
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

## License

MIT

## Acknowledgments

Built with TypeScript, React, and Vite. Powered by client-side binary parsing with zero backend dependencies.
