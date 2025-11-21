# Research: AAB and Framework File Support

**Date**: 2025-11-19
**Branch**: `012-aab-framework-support`

## Executive Summary

This document captures technical research for implementing Android App Bundle (.aab) and iOS Framework Bundle (.framework) parsers. Both formats can be parsed client-side using existing infrastructure (fflate for ZIP, DataView for binary parsing), with some additional considerations for protobuf (AAB) and binary plist (Framework) parsing.

---

## AAB File Format Research

### Decision: Use protobuf.js for AAB Manifest Parsing

**Rationale**: AAB files use Protocol Buffers for AndroidManifest.xml (unlike APK's binary XML), requiring a protobuf decoder. protobuf.js is mature, widely used, and can load schema definitions at runtime.

**Alternatives Considered**:
- **pbf (Mapbox)**: Faster but requires pre-compiled schemas, less flexible
- **Schema-less decoding**: Unreliable for complex nested structures like XML nodes
- **WASM protobuf decoder**: Additional complexity for minimal performance gain on small manifests

### AAB Internal Structure

```
app.aab (ZIP)
├── BundleConfig.pb              # Bundle metadata (protobuf)
├── BUNDLE-METADATA/             # Tools/store metadata
├── META-INF/
│   └── MANIFEST.MF
├── base/                        # Required base module
│   ├── manifest/
│   │   └── AndroidManifest.xml  # PROTOBUF format (NOT binary XML)
│   ├── dex/
│   │   ├── classes.dex
│   │   └── classes2.dex
│   ├── res/
│   ├── lib/{abi}/
│   ├── assets/
│   ├── root/
│   └── resources.pb
└── feature_name/                # Optional dynamic feature modules
    └── [same structure as base/]
```

### Key Differences from APK

| Aspect | APK | AAB |
|--------|-----|-----|
| Manifest format | Binary XML (AXML) | Protobuf XML |
| Resource table | `resources.arsc` | `resources.pb` |
| DEX location | Root directory | `{module}/dex/` |
| Manifest location | Root | `{module}/manifest/` |
| Module support | None | base + feature modules |

### Metadata Extraction

Package name, version code, and version name are in `base/manifest/AndroidManifest.xml` (protobuf format).

**Required Proto Schema**: `Resources.proto` from aapt2
- Source: https://android.googlesource.com/platform/frameworks/base/+/master/tools/aapt2/Resources.proto

```javascript
// Simplified extraction approach
const XmlNode = root.lookupType('aapt.pb.XmlNode');
const manifestData = XmlNode.decode(manifestBuffer);
const attrs = manifestData.element.attribute;
// Find: package, android:versionCode (resourceId: 0x0101021b), android:versionName
```

### Content Categorization

| Category | Location Pattern | Description |
|----------|-----------------|-------------|
| Code | `{module}/dex/*.dex` | DEX bytecode files |
| Resources | `{module}/res/**` | Layouts, drawables, values |
| Assets | `{module}/assets/**` | Raw asset files |
| Native Libraries | `{module}/lib/{abi}/*.so` | Per-architecture .so files |
| Configuration | `*.pb`, `manifest/**` | Protobuf metadata |
| Other | Everything else | META-INF, root files |

### Implementation Approach

1. **Reuse**: `extractZIPStreaming()` from zip-parser.js
2. **New dependency**: protobuf.js (~19KB gzipped) for manifest parsing
3. **Fallback**: If protobuf parsing fails, extract basic info from file paths (module names, file counts)

---

## iOS Framework Bundle Research

### Decision: Support Zipped Framework Uploads

**Rationale**: .framework is a directory bundle, not a single file. Users must ZIP it before upload. The parser will extract and analyze the directory structure.

**Alternatives Considered**:
- **Directory upload API**: Limited browser support, complex UX
- **Drag folder**: Safari-only, not cross-browser
- **Auto-detection in IPA**: Already supported via ipa-parser

### Framework Directory Structure

#### iOS (Flat Structure)
```
MyFramework.framework/
├── MyFramework                    # Main executable binary
├── Info.plist                     # Bundle metadata
├── Headers/                       # Public headers
├── Modules/                       # Module maps & Swift interfaces
├── Resources/                     # Optional resources
├── PrivateHeaders/                # Private headers (optional)
├── Frameworks/                    # Embedded sub-frameworks
└── _CodeSignature/                # Code signing
```

#### macOS (Versioned Structure)
```
MyFramework.framework/
├── Versions/
│   ├── A/
│   │   ├── MyFramework
│   │   ├── Headers/
│   │   └── Resources/
│   │       └── Info.plist         # Note: in Resources for macOS
│   └── Current → A
└── [symlinks to Versions/Current/*]
```

### Binary Architecture Detection

Frameworks contain Mach-O binaries that may be universal (fat) with multiple architecture slices.

**Magic Numbers**:
- `0xCAFEBABE` - Fat/Universal binary (big-endian)
- `0xFEEDFACF` - 64-bit Mach-O (little-endian)
- `0xFEEDFACE` - 32-bit Mach-O (little-endian)

**CPU Type Constants**:
| Architecture | cputype (hex) | Description |
|-------------|---------------|-------------|
| arm64 | `0x0100000C` | Apple Silicon, iOS devices |
| arm64e | `0x0100000C` (subtype 2) | A12+ with PAC |
| x86_64 | `0x01000007` | Intel Mac, simulators |
| armv7 | `0x0000000C` | Legacy 32-bit iOS |

**Existing Code**: `parseMachOHeader()` in ipa-parser.js already handles this - can be extracted to shared utility.

### Metadata Extraction (Info.plist)

**Location**:
- iOS: `MyFramework.framework/Info.plist`
- macOS: `MyFramework.framework/Versions/Current/Resources/Info.plist`

**Format Detection**:
```javascript
// Binary plist starts with "bplist"
const isBinary = buffer[0] === 0x62 && buffer[1] === 0x70; // 'bp'
// XML plist starts with '<'
const isXML = buffer[0] === 0x3C;
```

**Key Fields**:
- `CFBundleIdentifier` - Bundle ID (e.g., "com.example.MyFramework")
- `CFBundleExecutable` - Binary name
- `CFBundleShortVersionString` - Marketing version (e.g., "1.0.0")
- `CFBundleVersion` - Build number
- `MinimumOSVersion` - Minimum iOS version
- `DTPlatformName` - Platform (iphoneos, macosx)

### Decision: Reuse Existing Plist Parser

**Rationale**: The existing ipa-parser already has plist parsing logic via app-info-parser. We can extract and share this utility.

**Implementation**: Create `parsePlist()` in `src/lib/parsers/common/plist-parser.js`

### Content Categorization

| Category | Patterns | Description |
|----------|----------|-------------|
| Binary | Main executable, `*.dylib` | Compiled code |
| Headers | `Headers/**`, `PrivateHeaders/**`, `*.h` | Public/private headers |
| Modules | `Modules/**`, `*.modulemap`, `*.swiftmodule` | Module interfaces |
| Resources | `Resources/**`, `*.car`, `*.nib`, `*.lproj` | Compiled assets |
| Metadata | `Info.plist`, `_CodeSignature/**` | Bundle info & signing |
| Frameworks | `Frameworks/**` | Embedded frameworks |

### Implementation Approach

1. **Reuse**: `extractZIPStreaming()`, `parseMachOHeader()`, plist parsing
2. **Structure detection**: Check for `Versions/` directory to handle macOS format
3. **Binary name**: Read from `CFBundleExecutable` in Info.plist

---

## Shared Utilities to Extract

Based on research, these utilities should be extracted to `src/lib/parsers/common/`:

1. **plist-parser.js**: Parse binary and XML plists (from ipa-parser)
2. **macho-parser.js**: Parse Mach-O headers for architecture info (from ipa-parser)
3. **content-classifier.js**: Shared file categorization logic

---

## Dependencies

### Existing (No Changes)
- **fflate**: ZIP extraction (already used)
- **app-info-parser**: IPA/APK metadata (already used)

### New Required
- **protobuf.js**: AAB manifest parsing (~19KB gzipped)
  - NPM: `protobufjs`
  - Only needed for AAB, not Framework

### Proto Schema Files
For AAB parsing, we need the Resources.proto schema. Options:
1. **Embed compiled descriptor**: Pre-compile proto to JSON, bundle with app
2. **Runtime fetch**: Load .proto file when AAB detected (adds latency)
3. **Minimal extraction**: Parse just enough protobuf to get package info without full schema

**Recommendation**: Option 1 (embed compiled descriptor) for best UX and offline support.

---

## Risk Assessment

### AAB Parsing Risks

| Risk | Mitigation |
|------|------------|
| Protobuf schema changes | Pin to specific aapt2 version, monitor Android releases |
| Large AAB files (500MB+) | Streaming extraction already handles this |
| Feature modules | Iterate all `*/manifest/` directories |

### Framework Parsing Risks

| Risk | Mitigation |
|------|------------|
| User uploads wrong file | Validate .framework directory structure exists in ZIP |
| macOS versioned structure | Detect and follow symlinks/version directories |
| Binary plist parsing | Reuse proven app-info-parser logic |

---

## Performance Considerations

### AAB
- Protobuf decoding is fast (~1ms for manifest)
- Main cost is ZIP extraction (same as APK)
- Consider lazy-loading protobuf.js only when AAB detected

### Framework
- Info.plist parsing is fast
- Mach-O header parsing is fast (only reads first few KB)
- Main cost is ZIP extraction

Both formats should meet the <5 second target for 200MB files based on existing APK/IPA performance.

---

## Next Steps

1. **Phase 1**: Create data-model.md with entity definitions
2. **Phase 1**: Create contracts for parser APIs
3. **Phase 1**: Create quickstart.md with integration examples
4. **Phase 2**: Generate tasks.md for implementation
