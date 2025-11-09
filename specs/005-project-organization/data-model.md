# Data Model: Documentation & File Organization

**Feature**: Project Organization & Documentation Improvements
**Date**: 2025-11-09
**Purpose**: Define the structure and relationships of documentation entities, configuration files, and directory groups to inform implementation.

## Overview

This data model describes the **organizational structure** of repository files and documentation, not runtime application data. It models how files are categorized, where they're located, and how they relate to each other in the repository hierarchy.

## Entities

### 1. Documentation File

**Purpose**: Markdown files that provide information to users, developers, or AI assistants.

**Attributes**:
- `filename` (string) - File name including extension (e.g., "README.md", "CONTRIBUTING.md")
- `purpose` (enum) - Document role: "primary_user_docs", "developer_guide", "ai_assistant_guide", "technical_deep_dive"
- `target_audience` (enum) - Intended readers: "end_users", "contributors", "maintainers", "ai_assistants"
- `location` (DirectoryGroup) - Where the file resides (root vs. docs/)
- `max_length_lines` (integer) - Recommended maximum length for scannability
- `required_sections` (string[]) - Mandatory content sections (e.g., ["Quick Start", "Features"])
- `visual_elements` (integer) - Count of badges, screenshots, diagrams
- `priority` (enum) - Display priority: "primary" (root), "secondary" (docs/)

**Examples**:
```yaml
- filename: "README.md"
  purpose: "primary_user_docs"
  target_audience: "end_users"
  location: root
  max_length_lines: 300
  required_sections: ["Overview", "Quick Start", "Features", "Installation"]
  visual_elements: 5  # 4 badges + 1 screenshot
  priority: "primary"

- filename: "CODEBASE_EXPLORATION.md"
  purpose: "technical_deep_dive"
  target_audience: "contributors"
  location: docs/
  max_length_lines: null  # no limit for deep dives
  required_sections: []
  visual_elements: 0
  priority: "secondary"

- filename: "CLAUDE.md"
  purpose: "ai_assistant_guide"
  target_audience: "ai_assistants"
  location: root  # SpecKit convention
  max_length_lines: null
  required_sections: []
  visual_elements: 0
  priority: "primary"  # must be discoverable at root

- filename: "CONTRIBUTING.md"
  purpose: "developer_guide"
  target_audience: "contributors"
  location: docs/
  max_length_lines: 200
  required_sections: ["SpecKit Workflow", "Code Standards", "Pull Request Process"]
  visual_elements: 0
  priority: "secondary"
```

**Validation Rules**:
- `filename` must end with `.md`
- `location` must be either root or docs/ directory
- If `purpose` = "primary_user_docs", then `location` must be root
- If `purpose` = "ai_assistant_guide", then `location` must be root
- If `target_audience` = "end_users", then `visual_elements` ≥ 2 (spec SC-006)

---

### 2. Configuration File

**Purpose**: Tool configuration files (build, lint, test, style) required by development tooling.

**Attributes**:
- `filename` (string) - File name including extension (e.g., "vite.config.ts", ".eslintrc.cjs")
- `tool` (string) - Tool name (e.g., "Vite", "ESLint", "TypeScript")
- `purpose` (enum) - Config role: "build", "code_quality", "testing", "styling", "git"
- `required_location` (string) - Tooling-mandated location (always "root" for JavaScript tools)
- `groupable` (boolean) - Can be moved to subdirectory without breaking tooling (always false)
- `file_size_kb` (integer) - Approximate file size for repository analysis

**Examples**:
```yaml
- filename: "vite.config.ts"
  tool: "Vite"
  purpose: "build"
  required_location: "root"
  groupable: false  # Vite searches for config at root
  file_size_kb: 1

- filename: "tsconfig.json"
  tool: "TypeScript"
  purpose: "build"
  required_location: "root"
  groupable: false  # VSCode, tsc require root location
  file_size_kb: 1

- filename: ".eslintrc.cjs"
  tool: "ESLint"
  purpose: "code_quality"
  required_location: "root"
  groupable: false  # ESLint searches from root upward
  file_size_kb: 1

- filename: "tailwind.config.js"
  tool: "Tailwind CSS"
  purpose: "styling"
  required_location: "root"
  groupable: false  # Tailwind requires root config
  file_size_kb: 2

- filename: ".prettierrc"
  tool: "Prettier"
  purpose: "code_quality"
  required_location: "root"
  groupable: false  # Prettier searches from root
  file_size_kb: 0.2
```

**Validation Rules**:
- All `groupable` values must be `false` for JavaScript/TypeScript tooling
- `required_location` must always be "root"
- Files starting with `.` (dotfiles) are hidden by default in most file browsers

**Design Note**: We cannot reduce config file clutter by grouping. This is an accepted constraint of JavaScript tooling ecosystem.

---

### 3. Sample File

**Purpose**: Binary test files (.ipa, .apk) provided for users to test the analyzer.

**Attributes**:
- `filename` (string) - Binary file name (e.g., "A Night Battle HD 1.2.ipa")
- `platform` (enum) - "iOS" or "Android"
- `format` (enum) - "ipa", "apk", "xapk", "aab"
- `size_mb` (float) - File size in megabytes
- `parse_time_estimate_sec` (integer) - Expected parsing duration (5s per MB rule of thumb)
- `recommended_use_case` (string) - When to use this sample (e.g., "Quick test", "Comprehensive analysis")
- `description` (string) - Brief notes about the file (app type, notable features)
- `source` (string) - Where the file was obtained (e.g., "App Store", "APKMirror")

**Examples**:
```yaml
- filename: "A Night Battle HD 1.2.ipa"
  platform: "iOS"
  format: "ipa"
  size_mb: 5.1
  parse_time_estimate_sec: 5
  recommended_use_case: "Quick test"
  description: "Small iOS app, good for verifying the tool works"
  source: "App Store"

- filename: "Tools-for-Procreate-IPAOMTK.COM.ipa"
  platform: "iOS"
  format: "ipa"
  size_mb: 47
  parse_time_estimate_sec: 20
  recommended_use_case: "Medium test"
  description: "Realistic app size, shows framework analysis and asset breakdowns"
  source: "Third-party source"

- filename: "com.grasshopper.dialer_6.8.0-2958_minAPI29(arm64-v8a,armeabi,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk"
  platform: "Android"
  format: "apk"
  size_mb: 79
  parse_time_estimate_sec: 30
  recommended_use_case: "Large test"
  description: "Multi-DEX, localization, native libs - comprehensive analysis"
  source: "APKMirror"
```

**Validation Rules**:
- `size_mb` must be < 100 (repository size constraint from research)
- `parse_time_estimate_sec` ≈ `size_mb` (rough heuristic: 1 second per MB)
- `recommended_use_case` must be one of: "Quick test", "Medium test", "Large test"
- All samples must be documented in `sample-files/README.md`

---

### 4. Directory Group

**Purpose**: Top-level directories that organize related files in the repository.

**Attributes**:
- `name` (string) - Directory name (e.g., "src", "docs", "specs")
- `purpose` (string) - What this directory contains
- `visibility` (enum) - "visible" (normal), "hidden" (dotdir like .git), "generated" (node_modules, dist)
- `required` (boolean) - Must exist for project to function
- `counts_toward_root_limit` (boolean) - Included in 15-item root directory limit
- `contents` (string[]) - List of file/subdirectory types contained

**Examples**:
```yaml
- name: "src"
  purpose: "Source code (TypeScript/React components)"
  visibility: "visible"
  required: true
  counts_toward_root_limit: true
  contents: ["components/", "lib/", "types/", "utils/", "workers/"]

- name: "docs"
  purpose: "Secondary documentation and visual assets"
  visibility: "visible"
  required: false  # new directory for this feature
  counts_toward_root_limit: true
  contents: ["CODEBASE_EXPLORATION.md", "CONTRIBUTING.md", "screenshots/"]

- name: "sample-files"
  purpose: "Sample binaries for testing the analyzer"
  visibility: "visible"
  required: false
  counts_toward_root_limit: true
  contents: ["*.ipa", "*.apk", "README.md"]

- name: "specs"
  purpose: "SpecKit feature specifications"
  visibility: "visible"
  required: true  # SpecKit workflow requirement
  counts_toward_root_limit: true
  contents: ["001-*/", "002-*/", "003-*/", "..."]

- name: ".git"
  purpose: "Git version control metadata"
  visibility: "hidden"
  required: true
  counts_toward_root_limit: false  # dotdirs don't count
  contents: ["refs/", "objects/", "config", "..."]

- name: "node_modules"
  purpose: "npm dependencies"
  visibility: "generated"
  required: true  # for development
  counts_toward_root_limit: false  # typically hidden in file browsers
  contents: ["package directories"]

- name: "dist"
  purpose: "Build output (Vite production bundle)"
  visibility: "generated"
  required: false  # created by build process
  counts_toward_root_limit: false  # added to .gitignore
  contents: ["index.html", "assets/", "..."]
```

**Validation Rules**:
- Sum of all `counts_toward_root_limit = true` items (directories + files) must be ≤ 15
- `visibility = "hidden"` directories must start with `.` (dotdir convention)
- `visibility = "generated"` directories should be in .gitignore

---

## Relationships

### Documentation File → Directory Group

**Relationship**: `DocumentationFile.location` → `DirectoryGroup.name`

**Rules**:
- Primary user docs (README.md) → root
- AI assistant docs (CLAUDE.md) → root (SpecKit convention)
- Developer guides (CONTRIBUTING.md) → docs/
- Technical deep dives (CODEBASE_EXPLORATION.md) → docs/
- Screenshots, diagrams → docs/screenshots/

**Cardinality**: Each DocumentationFile belongs to exactly 1 DirectoryGroup

---

### Configuration File → Root Directory

**Relationship**: All ConfigurationFile entities → root DirectoryGroup (required)

**Rules**:
- JavaScript/TypeScript tooling requires configs at root
- No grouping allowed (would break VSCode, Vite, ESLint, etc.)
- Accept 6-8 config files at root as industry standard

**Cardinality**: All ConfigurationFile entities located at root (N:1 relationship)

---

### Sample File → sample-files/ Directory

**Relationship**: All SampleFile entities → sample-files/ DirectoryGroup

**Rules**:
- All binaries reside in sample-files/
- Metadata documented in sample-files/README.md
- Optional future enhancement: Platform subdirectories (sample-files/ios/, sample-files/android/)

**Cardinality**: All SampleFile entities in sample-files/ directory (N:1 relationship)

---

### Visual Assets → docs/screenshots/ Directory

**Relationship**: Screenshot/badge images → docs/screenshots/ subdirectory

**Rules**:
- All PNG/JPG screenshots stored in docs/screenshots/
- Badges use shields.io URLs (external, no local files)
- Referenced from README.md using relative paths

**Cardinality**: Multiple visual assets in docs/screenshots/ (N:1 relationship)

---

## Constraints

### Root Directory Constraint

**Specification**: ≤ 15 visible items at root level

**Calculation**:
```
visible_root_items =
  (count of files where location = root AND visibility = visible) +
  (count of DirectoryGroup where visibility = visible AND counts_toward_root_limit = true)
```

**Current state** (before implementation):
- Files: 11 visible (README, CLAUDE.md, CODEBASE_EXPLORATION.md, package.json, package-lock.json, index.html, 5 config files)
- Directories: 4 visible (src/, specs/, sample-files/, dist/)
- **Total**: 15 items (at limit, need to remove 1+)

**Target state** (after implementation):
- Files: 10 visible (README, CLAUDE.md, package.json, package-lock.json, index.html, 6 config files - removed tsconfig.node.json)
- Directories: 5 visible (src/, docs/, specs/, sample-files/ - removed dist/ via .gitignore)
- **Total**: 15 items (meets ≤15 constraint)

---

### Documentation Length Constraint

**Specification**: README.md ≤ 300 lines (SC-002)

**Current**: 279 lines
**Target**: ~250 lines (reorganization, not reduction)
**Strategy**: Move detailed sections to docs/, keep essential quick-start content

---

### Visual Element Constraint

**Specification**: README must have ≥ 2 visual elements (SC-006)

**Implementation**:
- 4 badges (License, TypeScript, React, Privacy-First)
- 1 screenshot (X-Ray Treemap view)
- **Total**: 5 visual elements (exceeds minimum)

---

## State Transitions

### Documentation File Lifecycle

1. **Creation** → Draft status
2. **Review** → Approved for publication
3. **Publication** → Located at root or docs/
4. **Update** → Modified based on project changes
5. **Archive** (optional) → Moved to docs/archive/ if superseded

**For this feature**:
- CODEBASE_EXPLORATION.md: **Publication** → **Relocation** (root → docs/)
- CONTRIBUTING.md: **Creation** → **Publication** (new file in docs/)
- README.md: **Update** (restructure sections, add visual aids)

---

### Sample File Lifecycle

1. **Acquisition** → Obtain binary file (App Store, APKMirror, etc.)
2. **Validation** → Verify file is valid IPA/APK, size < 100MB
3. **Documentation** → Add metadata row to sample-files/README.md
4. **Commit** → Add to git (binary committed directly, no LFS)

**For this feature**:
- All 3 existing samples: **Documentation** phase (create README with metadata)

---

## Usage Scenarios

### Scenario 1: New Developer Onboarding

**Actor**: First-time contributor cloning the repository

**Flow**:
1. Clone repository → sees clean root directory (15 items)
2. Opens README.md → sees badges, screenshot, understands tool purpose in 30 seconds
3. Follows Quick Start → runs `npm install && npm run dev`
4. Drags sample file (A Night Battle HD 1.2.ipa - 5MB quick test) → sees analysis in 5 seconds
5. Wants to contribute → clicks "Contributing Guide" link → opens docs/CONTRIBUTING.md
6. Needs technical details → opens docs/CODEBASE_EXPLORATION.md

**Data Model Entities Used**:
- DocumentationFile (README.md, CONTRIBUTING.md, CODEBASE_EXPLORATION.md)
- DirectoryGroup (root, docs/)
- SampleFile (A Night Battle HD 1.2.ipa)

---

### Scenario 2: AI Assistant Configuration

**Actor**: Claude Code reading project documentation

**Flow**:
1. Searches for CLAUDE.md at repository root
2. Finds CLAUDE.md (location = root per SpecKit convention)
3. Reads project-specific instructions
4. Locates constitution at .specify/memory/constitution.md
5. Follows SpecKit workflow for feature implementation

**Data Model Entities Used**:
- DocumentationFile (CLAUDE.md - purpose = "ai_assistant_guide")
- DirectoryGroup (root, .specify/)

---

### Scenario 3: Sample File Selection

**Actor**: End user wanting to test the tool

**Flow**:
1. Opens README.md → Quick Start section lists sample files
2. Clicks link to sample-files/README.md
3. Sees metadata table with platform, size, use case, time estimates
4. Chooses "Quick test" (5MB IPA) for initial verification
5. After success, tries "Large test" (79MB APK) for comprehensive analysis

**Data Model Entities Used**:
- SampleFile (all 3 samples with metadata)
- DocumentationFile (sample-files/README.md)
- DirectoryGroup (sample-files/)

---

## Implementation Notes

### No Database Required

This is a **file system structure model**, not a runtime database schema. All "entities" are files and directories in the repository. No SQL/NoSQL database needed.

### Validation Approach

Validation rules will be implemented as:
1. **Manual checklist** in quickstart.md (count root items, verify README length)
2. **Git hooks** (future enhancement - pre-commit check for root item count)
3. **CI/CD check** (future enhancement - lint job validates documentation structure)

### Technology Stack

**Tools**: None (file system operations only)
**Languages**: Markdown, YAML (for examples above - not implemented in code)
**Dependencies**: None (pure file organization)

---

## Appendix: Full Root Directory Inventory

### Target State (After Implementation)

**Files** (10 total):
1. README.md - Primary documentation
2. CLAUDE.md - AI assistant guide
3. package.json - npm manifest
4. package-lock.json - dependency lock
5. index.html - Vite entry point
6. .eslintrc.cjs - ESLint config
7. .gitignore - Git ignore rules
8. .prettierrc - Prettier config
9. postcss.config.js - PostCSS config
10. tailwind.config.js - Tailwind config
11. tsconfig.json - TypeScript config (merged tsconfig.node.json)
12. vite.config.ts - Vite build config
13. vitest.config.ts - Vitest test config

**Wait, that's 13 files, not 10!** Let me recount:

Actually, **11 visible files** (after removing tsconfig.node.json):
- README.md
- CLAUDE.md
- package.json
- package-lock.json
- index.html
- .eslintrc.cjs (hidden dotfile - doesn't count? No, .eslintrc.cjs is visible)
- .gitignore (hidden dotfile - doesn't count? No, .gitignore is visible)
- .prettierrc (hidden dotfile - doesn't count? No, .prettierrc is visible)
- postcss.config.js
- tailwind.config.js
- tsconfig.json
- vite.config.ts
- vitest.config.ts

**Correction**: Dotfiles with extensions like `.eslintrc.cjs` are visible in `ls` output, they're just hidden in GUI file browsers on some systems. For our constraint, we count **all non-dotdir files**.

Let me recalculate properly:

**Files at root** (visible in `ls -la`, excluding dotdirs):
1. README.md
2. CLAUDE.md
3. package.json
4. package-lock.json
5. index.html
6. .eslintrc.cjs
7. .gitignore
8. .prettierrc
9. postcss.config.js
10. tailwind.config.js
11. tsconfig.json (after merging tsconfig.node.json)
12. vite.config.ts
13. vitest.config.ts

**= 13 files**

**Directories at root** (visible, non-dotdirs):
1. src/
2. docs/ (new)
3. specs/
4. sample-files/

**= 4 directories**

**Total visible root items: 13 + 4 = 17 items** ❌ Exceeds 15 limit!

**Problem**: We need to remove 2 more items.

**Solution options**:
1. Remove .prettierrc (merge into package.json "prettier" field) - saves 1 item
2. Remove postcss.config.js (merge into tailwind.config.js if possible) - saves 1 item
3. Create config/ directory despite tooling issues (not recommended)
4. Accept 17 items and update spec to ≤17 (compromise)

**Decision for plan**: Note this discrepancy, propose removing .prettierrc and postcss.config.js in tasks phase. Update target to **15 items** by merging configs where possible.

**Updated file count**:
- Remove .prettierrc (merge to package.json) → 12 files
- Remove postcss.config.js (Tailwind can use tailwind.config.js) → 11 files
- **Total: 11 files + 4 directories = 15 items** ✅

This will be documented in contracts/ and quickstart.md.
