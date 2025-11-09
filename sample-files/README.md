# Sample Files

These sample binaries are provided for testing the App Size Analyzer without needing to find your own IPA/APK files. All files are committed directly to the repository (no Git LFS required).

## Available Samples

| File | Platform | Size | Recommended Use Case | Parse Time | Notes |
|------|----------|------|---------------------|------------|-------|
| A Night Battle HD 1.2.ipa | iOS | 5.1 MB | **Quick test** - Fast verification | ~5 sec | Small app, good for verifying the tool works |
| Tools-for-Procreate-IPAOMTK.COM.ipa | iOS | 47 MB | **Medium test** - Realistic app size | ~20 sec | Shows framework analysis, asset breakdowns |
| com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk | Android | 79 MB | **Large test** - Comprehensive analysis | ~30 sec | Multi-DEX, localization, native libs |

**Total size**: 131 MB

## Usage

### Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the app**: Navigate to http://localhost:5173

3. **Choose a sample file**:
   - **First time?** Start with `A Night Battle HD 1.2.ipa` (5MB, fast)
   - **Realistic test?** Use `Tools-for-Procreate-IPAOMTK.COM.ipa` (47MB, medium)
   - **Full analysis?** Try `com.grasshopper.dialer APK` (79MB, comprehensive)

4. **Drag and drop** the file onto the upload area

5. **Wait for parsing** (see time estimates above)

6. **Explore the analysis**:
   - **Breakdown** tab: File hierarchy, size breakdown, drill-down
   - **X-Ray** tab: Interactive treemap visualization
   - **Insights** tab: Optimization recommendations

## What to Look For

### iOS Samples (.ipa)

- **Frameworks**: SwiftUI, UIKit, third-party SDKs
- **Asset catalogs**: App icons, images, launch screens
- **Executables**: Mach-O binary size
- **Embedded bundles**: Frameworks, plugins
- **Localization**: .lproj directories for languages

### Android Samples (.apk)

- **DEX files**: classes.dex (Dalvik bytecode)
- **Native libraries**: .so files for different architectures
- **Resources**: ARSC resource table, XML layouts
- **Assets**: Raw files (images, fonts, data)
- **Localization**: res/values-XX directories for languages

## Adding New Sample Files

Want to add more sample binaries for testing? Follow these guidelines:

### Prerequisites

1. **Verify you have rights to distribute the binary**:
   - ✅ Public domain apps
   - ✅ Your own apps
   - ✅ Open source apps with permissive licenses
   - ✅ Apps with explicit permission from developer
   - ❌ Pirated or cracked apps (illegal)
   - ❌ Enterprise apps without permission

2. **Check file size**: Individual files should be **under 100 MB** (GitHub limit)
   - If larger, provide a download link instead of committing to git
   - Or use Git LFS (requires setup)

### Steps to Add

1. **Add file to this directory**:
   ```bash
   cp /path/to/your-app.ipa sample-files/
   ```

2. **Update this README**:
   - Add row to the "Available Samples" table above
   - Include: filename, platform, size, use case, parse time estimate, notes

3. **Test the file**:
   ```bash
   npm run dev
   # Drag and drop the new file
   # Verify it parses without errors
   ```

4. **Commit the file**:
   ```bash
   git add sample-files/your-app.ipa
   git add sample-files/README.md
   git commit -m "Add your-app sample file"
   ```

### File Naming

**Recommended pattern**: `[app-name].[version].[extension]`

**Examples**:
- ✅ `Angry-Birds.2.0.ipa` (clear, version included)
- ✅ `Instagram.apk` (recognizable app name)
- ⚠️ `com.example.app_1.2.3_minAPI21.apk` (verbose but accurate for Android)
- ❌ `app1.ipa` (unclear, no context)
- ❌ `test.apk` (too generic)

## Troubleshooting

### File Too Large

**Error**: "File exceeds 100MB limit"

**Solutions**:
- Use a smaller app for testing
- Compress the file (if it's an uncompressed IPA/APK)
- Provide download link instead of committing to git

### Parsing Fails

**Error**: "Invalid APK/IPA file: Missing manifest/plist"

**Solutions**:
- Verify the file is not corrupted (try re-downloading)
- Check that it's a valid IPA/APK (not a renamed ZIP)
- Test with the existing sample files to verify the tool works

### Parse Timeout

**Error**: "Analysis timeout: File took too long to process"

**Solutions**:
- Larger files (100MB+) may exceed timeout
- Try a smaller file first to verify the tool works
- Check browser console for detailed errors

## License & Attribution

- **A Night Battle HD 1.2.ipa**: From App Store (for testing purposes only)
- **Tools-for-Procreate-IPAOMTK.COM.ipa**: Third-party source (testing purposes)
- **com.grasshopper.dialer APK**: From APKMirror (public distribution)

These files are provided solely for testing the App Size Analyzer tool. If you are the developer of any of these apps and wish for them to be removed, please open an issue.
