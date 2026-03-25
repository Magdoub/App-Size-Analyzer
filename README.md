<p align="center">
  <img src="public/android-chrome-512x512.png" alt="App Size Analyzer" width="120">
</p>

<h1 align="center">App Size Analyzer</h1>

<p align="center">
  Find out what's making your app so big.
</p>

<p align="center">
  <a href="https://appsizeanalyzer.com/">appsizeanalyzer.com</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/privacy-100%25%20client--side-green" alt="Privacy">
  <img src="https://img.shields.io/badge/platforms-iOS%20%2B%20Android-orange" alt="Platforms">
</p>

---

> **Use it right now at [appsizeanalyzer.com](https://appsizeanalyzer.com/)** — no install, no signup, no upload to any server. Just open the site and drop in a file.

<p align="center">
  <video src="media/demo.mp4" width="100%" autoplay loop muted playsinline></video>
</p>

## About

App Size Analyzer breaks down iOS and Android app files so you can see exactly where the size is coming from. It runs entirely in your browser. Your files never get uploaded anywhere.

Drop in an `.ipa`, `.apk`, `.aab`, or `.xapk` file and you'll get:

- A file-by-file size breakdown you can sort and drill into
- A visual map of your app's contents, color-coded by category
- Automatic recommendations for reducing size (duplicate files, oversized images, debug leftovers, unused resources, and others)

Don't have a file handy? There are sample apps on the homepage you can analyze with one click.

## Supported formats

| Format | Platform | Notes |
|--------|----------|-------|
| `.ipa` | iOS | App packages |
| `.apk` | Android | App packages |
| `.aab` | Android | App Bundles with per-module breakdown |
| `.xapk` | Android | Split APK containers |
| `.zip` | iOS | Zipped `.framework` directories |

## Getting started

The fastest way is the hosted version at **[appsizeanalyzer.com](https://appsizeanalyzer.com/)**. Nothing to install.

If you want to run it locally:

```bash
git clone https://github.com/Magdoub/App-Size-Analyzer.git
cd App-Size-Analyzer
npm install
npm run dev
```

Then open http://localhost:5173.

## How it works

You pick a file (or a sample), the app parses it in the background, and you get three views:

1. **Breakdown** - a sortable file tree showing sizes, percentages, and how much each file compresses
2. **X-Ray** - a treemap that gives you a visual sense of where the space goes
3. **Insights** - 18 rules that scan for common size problems (big PNGs that should be WebP, duplicate files, debug symbols left in release builds, that kind of thing)

Everything runs locally. There is no server.

## Tech stack

| | |
|-------|-------|
| Framework | Vue 3.5, Pinia, Vite 5 |
| Charts | ECharts, TanStack Virtual |
| Parsing | fflate, app-info-parser, protobufjs, custom binary parsers |
| Concurrency | Web Workers via Comlink |
| Styling | Tailwind CSS |

## Project structure

```
src/
├── components/          # UI (breakdown, insights, upload, xray, shared)
├── composables/         # Vue composables
├── lib/
│   ├── analysis/        # Size breakdown + insight rules
│   ├── parsers/         # iOS and Android binary parsers
│   └── visualization/   # Treemap data + colors
├── stores/              # Pinia stores
├── utils/               # Formatters, helpers
└── workers/             # Background parsing
```

## Development

```bash
npm run dev              # Dev server
npm run build            # Production build
npm test                 # Tests
npm run lint:fix         # Lint
npm run format           # Format
```

## Browser support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for how we work.

## License

MIT
