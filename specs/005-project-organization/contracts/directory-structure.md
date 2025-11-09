# Contract: Directory Structure & File Organization

**Feature**: Project Organization & Documentation Improvements
**Version**: 1.0.0
**Date**: 2025-11-09
**Status**: Draft

## Purpose

This contract defines the rules and conventions for organizing files and directories in the App Size Analyzer repository. It serves as the source of truth for:
- Where files should be located
- Naming conventions for files and directories
- Root directory item limit enforcement
- Documentation hierarchy

## Scope

This contract applies to:
- All documentation files (.md)
- All configuration files (build, lint, test, style tools)
- Sample binary files (.ipa, .apk)
- Top-level directory structure

This contract does NOT apply to:
- Source code organization within `src/` (covered by existing architecture)
- Test file organization within `tests/` (TBD when tests directory created)
- Generated files (dist/, node_modules/)

---

## 1. Root Directory Rules

### 1.1 Maximum Item Limit

**Rule**: The repository root MUST contain no more than **15 visible items** (files + directories).

**Counting Rules**:
- ✅ Count: Regular files (README.md, package.json, index.html)
- ✅ Count: Config files (.eslintrc.cjs, .prettierrc, vite.config.ts, etc.)
- ✅ Count: Visible directories (src/, docs/, specs/, sample-files/)
- ❌ Don't count: Hidden dotdirs (.git/, .specify/, .claude/)
- ❌ Don't count: Generated/ignored directories (node_modules/, dist/ if in .gitignore)
- ❌ Don't count: OS artifacts if in .gitignore (.DS_Store)

**Current Status**: 17 items (before this feature)
**Target Status**: 15 items (after this feature)

**How to achieve**:
1. Move CODEBASE_EXPLORATION.md to docs/ (-1 file)
2. Remove tsconfig.node.json, merge into tsconfig.json (-1 file)
3. Remove .prettierrc, merge into package.json "prettier" field (-1 file)
4. Remove postcss.config.js, merge into tailwind.config.js if possible (-1 file)
5. Add dist/ to .gitignore (if not already) (0 change, it's generated)
6. Create docs/ directory (+1 directory)

**Result**: 13 files + 4 directories = **15 items** ✅

### 1.2 Essential Files Only

**Rule**: Files at root MUST be essential for project functionality or required by tooling conventions.

**Allowed file types**:
1. **Project metadata**: package.json, package-lock.json, README.md
2. **Entry points**: index.html (Vite convention)
3. **AI assistant guidance**: CLAUDE.md (SpecKit convention)
4. **Configuration files**: Tool configs required at root by convention
5. **Git metadata**: .gitignore (version control requirement)

**Prohibited file types**:
- ❌ Build output (dist/, *.js bundles) - must be in .gitignore
- ❌ OS artifacts (.DS_Store, Thumbs.db) - must be in .gitignore
- ❌ Temporary files (*.tmp, *.log) - must be in .gitignore
- ❌ Secondary documentation - must be in docs/
- ❌ Editor configs (.vscode/, .idea/) - must be hidden dotdirs or gitignored

### 1.3 Configuration File Placement

**Rule**: All build/lint/test/style configuration files MUST remain at root (tooling requirement).

**Rationale**: JavaScript/TypeScript tooling (Vite, TypeScript, ESLint, Prettier, Tailwind, Vitest) searches for configs at repository root. Moving them to subdirectories breaks IDE support and CLI commands.

**Allowed config files at root**:
- tsconfig.json (TypeScript compiler + VSCode)
- vite.config.ts (Vite build tool)
- vitest.config.ts (Vitest test runner)
- tailwind.config.js (Tailwind CSS)
- .eslintrc.cjs (ESLint linter)
- .gitignore (Git)

**Config consolidation opportunities** (to reduce clutter):
- ✅ Merge tsconfig.node.json into tsconfig.json (Vite-specific config not needed for simple SPA)
- ✅ Merge .prettierrc into package.json "prettier" field
- ⚠️ Merge postcss.config.js into tailwind.config.js (verify Tailwind supports this)
- ❌ Cannot group in /config directory (breaks tooling)

---

## 2. Documentation Hierarchy

### 2.1 docs/ Directory Rules

**Purpose**: The `docs/` directory contains secondary documentation, visual assets, and developer guides.

**Location**: `/docs` (top-level directory)

**Contents**:
1. **Secondary documentation**: Technical deep-dives, contribution guides
2. **Visual assets**: Screenshots, diagrams, badges (in docs/screenshots/)
3. **Archive** (future): Deprecated docs (in docs/archive/)

**Allowed file types**:
- Markdown (.md) - documentation files
- Images (.png, .jpg, .svg) - visual aids
- Plain text (.txt) - if needed for specific documentation

**Prohibited content**:
- ❌ Source code (.ts, .tsx, .js) - belongs in src/
- ❌ Configuration files - required at root
- ❌ Sample binaries (.ipa, .apk) - belongs in sample-files/
- ❌ Build output - belongs in dist/ (gitignored)

**Directory structure**:
```
docs/
├── CODEBASE_EXPLORATION.md   # Technical deep dive (moved from root)
├── CONTRIBUTING.md            # Contribution guide (new)
├── screenshots/               # Visual assets
│   ├── xray-treemap.png       # Primary screenshot for README
│   └── insights-panel.png     # Optional secondary screenshot
└── (future) archive/          # Deprecated documentation
```

### 2.2 Primary Documentation (Root)

**Rule**: Primary user-facing documentation MUST remain at repository root.

**Files that MUST stay at root**:
1. **README.md** - Primary documentation (GitHub convention)
   - Purpose: First impression, quick start, feature overview
   - Target audience: End users, new developers
   - Max length: 300 lines (spec SC-002)
   - Required sections: Overview, Quick Start, Features, Installation
   - Visual elements: ≥2 (badges, screenshots)

2. **CLAUDE.md** - AI assistant guidance (SpecKit convention)
   - Purpose: Project-specific instructions for AI coding assistants
   - Target audience: Claude Code, GitHub Copilot, etc.
   - Location: Root (SpecKit workflow requirement)
   - No length limit

**Files that MUST move to docs/**:
1. **CODEBASE_EXPLORATION.md** → docs/CODEBASE_EXPLORATION.md
   - Rationale: Technical deep-dive, not needed for first impression
   - Still linked from README in "Documentation" section

### 2.3 Documentation Cross-References

**Rule**: Documentation files MUST use relative paths for internal links.

**Correct cross-reference formats**:
```markdown
<!-- From README.md to docs/ -->
[Contributing Guide](docs/CONTRIBUTING.md)
[Codebase Exploration](docs/CODEBASE_EXPLORATION.md)

<!-- From docs/CONTRIBUTING.md to root -->
[README](../README.md)
[Project Specs](../specs/)

<!-- From README.md to screenshots -->
![X-Ray Treemap](docs/screenshots/xray-treemap.png)
```

**Prohibited formats**:
- ❌ Absolute URLs (https://github.com/...) - breaks for forks/local clones
- ❌ Absolute file paths (/Users/..., C:\...) - not portable
- ❌ Anchor links without path ([#features]) from files in different directories

---

## 3. sample-files/ Directory Rules

### 3.1 Purpose & Location

**Purpose**: The `sample-files/` directory contains binary test files for users to test the analyzer.

**Location**: `/sample-files` (top-level directory)

**Allowed file types**:
- .ipa (iOS app packages)
- .apk (Android app packages)
- .xapk (Android XAPK containers)
- .aab (Android App Bundles - limited support)
- README.md (sample file metadata)

**Prohibited content**:
- ❌ Source code or text files
- ❌ Executables for other platforms (.exe, .dmg)
- ❌ Compressed archives (.zip, .tar.gz) unless they are .xapk

### 3.2 Sample File Metadata (README.md)

**Rule**: `sample-files/README.md` MUST document all sample files with the following metadata:

**Required columns** (markdown table):
1. **File** - Filename (clickable if large, or just text)
2. **Platform** - iOS or Android
3. **Size** - File size in MB (1 decimal place)
4. **Recommended Use Case** - "Quick test", "Medium test", or "Large test"
5. **Notes** - Brief description (app type, notable features for analysis)

**Optional columns**:
- Parse Time - Estimated parsing duration in seconds
- Source - Where the file was obtained (App Store, APKMirror, etc.)

**Example format**:
```markdown
# Sample Files

These sample binaries are provided for testing the App Size Analyzer...

## Available Samples

| File | Platform | Size | Recommended Use Case | Notes |
|------|----------|------|---------------------|-------|
| A Night Battle HD 1.2.ipa | iOS | 5.1 MB | **Quick test** | Small app, fast parsing (~5 sec) |
| Tools-for-Procreate-IPAOMTK.COM.ipa | iOS | 47 MB | **Medium test** | Realistic size, framework analysis (~20 sec) |
| com.grasshopper.dialer APK | Android | 79 MB | **Large test** | Multi-DEX, localization, native libs (~30 sec) |

## Usage
[Instructions for using sample files...]
```

### 3.3 Sample File Size Limit

**Rule**: Individual sample files MUST be under **100 MB** to avoid repository bloat.

**Rationale**:
- GitHub has 100MB file size warning threshold
- Large binaries increase clone time for all contributors
- 3 samples (5MB + 47MB + 79MB = 131MB total) is acceptable
- Adding more 100MB+ files would impact developer experience

**If larger samples needed**:
- Use Git LFS (Large File Storage)
- Or provide download links in sample-files/README.md instead of committing binaries

### 3.4 Sample File Naming Convention

**Rule**: Sample filenames SHOULD follow this pattern for clarity:

**Pattern**: `[app-name].[version].[platform].[extension]`

**Examples**:
- ✅ `A-Night-Battle-HD.1.2.ipa` (clear, version included)
- ✅ `Tools-for-Procreate.ipa` (clear app name)
- ⚠️ `com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a).apk` (verbose but accurate for Android)
- ❌ `app1.ipa` (unclear, no context)
- ❌ `test.apk` (too generic)

**Flexibility**: Android APK filenames from third-party sources (APKMirror) often include architecture and API level details. This is acceptable for accuracy, despite verbosity.

---

## 4. File Naming Conventions

### 4.1 Documentation Files

**Rule**: Documentation files MUST use `UPPERCASE.md` or `PascalCase.md` naming.

**Correct formats**:
- ✅ README.md (GitHub convention)
- ✅ CONTRIBUTING.md (GitHub convention)
- ✅ CHANGELOG.md (GitHub convention)
- ✅ CLAUDE.md (SpecKit convention)
- ✅ CODEBASE_EXPLORATION.md (project-specific, descriptive)

**Incorrect formats**:
- ❌ readme.md (lowercase not standard for root docs)
- ❌ contributing-guide.md (use CONTRIBUTING.md per GitHub convention)
- ❌ codebase-exploration.md (inconsistent with other UPPERCASE docs)

### 4.2 Configuration Files

**Rule**: Configuration files MUST follow tool-specific naming conventions (not customizable).

**Examples**:
- ✅ package.json (npm requirement)
- ✅ tsconfig.json (TypeScript convention)
- ✅ vite.config.ts (Vite convention)
- ✅ .eslintrc.cjs (ESLint searches for this name)
- ✅ .prettierrc (Prettier convention)
- ✅ tailwind.config.js (Tailwind convention)

**Note**: We cannot rename config files to match a consistent pattern. Tooling searches for these exact filenames.

### 4.3 Directory Names

**Rule**: Directory names SHOULD use lowercase with hyphens for multi-word names.

**Correct formats**:
- ✅ src/ (standard for source code)
- ✅ docs/ (standard for documentation)
- ✅ sample-files/ (hyphenated, descriptive)
- ✅ specs/ (SpecKit convention)
- ✅ node_modules/ (npm convention)

**Incorrect formats**:
- ❌ SampleFiles/ (PascalCase not standard for directories)
- ❌ sample_files/ (underscores less common than hyphens)
- ❌ samples/ (ambiguous - could be test fixtures or example code)

---

## 5. .gitignore Rules

### 5.1 Required Ignores

**Rule**: The `.gitignore` file MUST exclude generated files, build output, and OS artifacts.

**Mandatory entries**:
```gitignore
# Build output
dist/
*.tsbuildinfo

# Dependencies
node_modules/

# OS artifacts
.DS_Store
Thumbs.db
*.swp
*.swo

# Editor directories
.vscode/
.idea/

# Environment files (if created in future)
.env
.env.local

# Logs
*.log
npm-debug.log*
```

### 5.2 Sample Files Exception

**Rule**: Sample files in `sample-files/` MUST be committed to git (not ignored).

**Rationale**:
- Sample files are essential for testing the tool
- Users expect to clone and immediately try the app
- Total size (131MB) is acceptable for repository
- Not using Git LFS (adds complexity for contributors)

**Correct .gitignore** (does NOT ignore sample-files):
```gitignore
# Sample files are tracked (do not add sample-files/ here)
```

**If .gitignore previously ignored sample files**:
```bash
# Remove old ignore rule
git rm --cached sample-files/*.ipa sample-files/*.apk
# Commit sample files
git add sample-files/
git commit -m "Add sample files to repository"
```

---

## 6. Visual Assets (Screenshots, Badges)

### 6.1 Screenshot Storage

**Rule**: All screenshots for documentation MUST be stored in `docs/screenshots/`.

**Naming convention**:
- Lowercase with hyphens
- Descriptive of content
- Include feature name or view name

**Examples**:
- ✅ xray-treemap.png (primary screenshot for README)
- ✅ insights-panel.png (secondary screenshot)
- ✅ breakdown-table.png (optional)
- ❌ screenshot1.png (not descriptive)
- ❌ image.png (too generic)

### 6.2 Image Format & Size

**Rule**: Screenshots MUST be optimized for web viewing and GitHub rendering.

**Format**:
- ✅ PNG - for UI screenshots with text (lossless)
- ✅ JPG - for photos or complex images (acceptable if smaller)
- ❌ GIF - only for animations, not static screenshots
- ❌ BMP - uncompressed, too large

**Size limits**:
- Maximum file size: 500 KB per image (GitHub performance)
- Recommended: 200-300 KB (compress with ImageOptim, TinyPNG, etc.)
- Maximum width: 1200px (GitHub content area is ~800px, 1200px for retina)

**Optimization tools**:
- ImageOptim (macOS)
- TinyPNG (web, CLI)
- pngquant (CLI)

### 6.3 Badge URLs

**Rule**: Badges MUST use shields.io or similar badge generation services (external URLs, not local files).

**Recommended badges for README.md**:
```markdown
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Privacy](https://img.shields.io/badge/privacy-100%25%20client--side-green)
```

**Badge placement**: After title, before main content

---

## 7. Enforcement & Validation

### 7.1 Manual Validation Checklist

**When to validate**: Before committing file reorganization changes

**Checklist** (from quickstart.md):
1. ✅ Count visible root items: `ls -1 | grep -v '^\.' | wc -l` ≤ 15
2. ✅ Verify README.md length: `wc -l README.md` ≤ 300
3. ✅ Check visual elements in README: Count badges + screenshots ≥ 2
4. ✅ Verify docs/ directory exists with CODEBASE_EXPLORATION.md, CONTRIBUTING.md
5. ✅ Verify sample-files/README.md exists with metadata table
6. ✅ Verify .gitignore includes dist/, .DS_Store, *.log
7. ✅ Test all internal links in README.md (no broken relative paths)
8. ✅ Verify all config files remain at root and tools still work

### 7.2 Automated Validation (Future Enhancement)

**Potential CI/CD checks**:
- Lint job: Count root directory items, fail if > 15
- Lint job: Check README.md length, warn if > 300 lines
- Lint job: Validate sample-files/README.md has all required columns
- Pre-commit hook: Prevent committing files to root if limit exceeded

**Note**: Automated validation is out of scope for initial implementation (manual checklist sufficient).

---

## 8. Change Management

### 8.1 Adding New Documentation

**Process**:
1. Determine audience: End users (root) or developers (docs/)
2. Choose filename per Section 4.1 conventions
3. If adding to root, verify root item count ≤ 15
4. If adding to docs/, no item limit (reasonable files only)
5. Update README.md "Documentation" section with link
6. Commit with descriptive message

### 8.2 Adding New Sample Files

**Process**:
1. Verify file size < 100 MB
2. Verify file is valid IPA/APK (test parsing)
3. Add file to sample-files/
4. Update sample-files/README.md metadata table:
   - Filename, Platform, Size, Use Case, Notes
5. Update README.md Quick Start if file is recommended for first-time users
6. Commit with `git add sample-files/` (binary committed directly)

### 8.3 Adding New Configuration Files

**Process**:
1. Verify tool requires config at root (check tool docs)
2. If config can be merged into package.json or existing config, do that first
3. If new root file needed, verify root item count will stay ≤ 15
4. If root limit would be exceeded, identify file to consolidate/remove
5. Add config file to root
6. Update this contract document if new pattern introduced

### 8.4 Removing Files from Root

**Process** (to reduce root clutter):
1. Identify consolidation opportunity (e.g., .prettierrc → package.json)
2. Verify tooling supports consolidated config (test locally)
3. Update configuration in new location
4. Remove old config file: `git rm old-config-file`
5. Test all commands (npm run dev, lint, format, etc.)
6. Commit with explanation of consolidation

---

## 9. Exceptions & Overrides

### 9.1 When to Violate This Contract

**Allowed exceptions**:
1. **Tool requirement**: If a new tool absolutely requires root config file and no alternative exists
2. **GitHub convention**: If GitHub introduces new standard files (like FUNDING.yml, SECURITY.md)
3. **SpecKit update**: If SpecKit workflow adds new required root files

**Exception approval process**:
1. Document why exception is needed (tool requirement, convention change)
2. Verify no alternative exists (config merge, subdirectory, etc.)
3. Update this contract with new rule
4. If root limit would be exceeded, identify file to consolidate

### 9.2 Temporary Violations

**Acceptable temporary violations** (during development):
- Root item count exceeds 15 while refactoring (must be resolved before PR merge)
- Missing sample-files/README.md while creating samples (complete before commit)
- Incomplete docs/ migration (CODEBASE_EXPLORATION.md still at root temporarily)

**Not acceptable** (block PR):
- Committing build output (dist/) to git
- Committing OS artifacts (.DS_Store) to git
- Adding sample files > 100MB without Git LFS
- Breaking internal documentation links

---

## 10. Version History

**Version 1.0.0** (2025-11-09):
- Initial contract definition
- Root directory limit: ≤15 items
- Documentation hierarchy (root vs. docs/)
- Sample file organization rules
- Visual asset guidelines
- File naming conventions

**Future versions**:
- TBD: Update if automated validation added (CI/CD checks)
- TBD: Update if Git LFS adopted for sample files
- TBD: Update if new GitHub conventions emerge (FUNDING.yml, etc.)

---

## Compliance

This contract is enforced through:
1. ✅ Manual checklist in quickstart.md (immediate)
2. ⚠️ Code review (check root item count in PR reviews)
3. ⚠️ CI/CD checks (future enhancement)
4. ⚠️ Pre-commit hooks (future enhancement)

**Violations**: If this contract is violated, file organization changes must be reverted and re-implemented per contract rules before PR approval.

---

## References

- [Feature Spec](../spec.md)
- [Research Document](../research.md)
- [Data Model](../data-model.md)
- [Quickstart Guide](../quickstart.md)
