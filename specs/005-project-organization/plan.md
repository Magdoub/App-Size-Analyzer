# Implementation Plan: Project Organization & Documentation Improvements

**Branch**: `005-project-organization` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-project-organization/spec.md`

## Summary

This feature reorganizes the project's root directory structure and improves documentation to reduce onboarding friction. The primary requirement is to create a clean, scannable root directory with no more than 15 visible items, while restructuring the README to provide high-level tool overview, quick start instructions with sample files, and visual aids. This is purely a documentation and file organization task with no code implementation required.

## Technical Context

**Language/Version**: N/A (Documentation/Organization only - no code changes)
**Primary Dependencies**: N/A (Markdown files and directory structure only)
**Storage**: N/A (File system organization)
**Testing**: Manual validation (file count, README readability, sample file discovery)
**Target Platform**: GitHub repository (markdown rendering, directory browsing)
**Project Type**: Documentation and repository organization
**Performance Goals**:
- New developers onboard in <3 minutes
- README loads in <2 seconds on GitHub
- Root directory scannable in <10 seconds

**Constraints**:
- No more than 15 visible root-level items (files + directories, excluding dotfiles)
- README stays under 300 lines
- Maintain backward compatibility with existing SpecKit workflow
- No breaking changes to build or development commands

**Scale/Scope**:
- 3 documentation files to reorganize (README.md, CLAUDE.md, CODEBASE_EXPLORATION.md)
- 6 configuration files to assess for grouping (vite, tsconfig, vitest, postcss, tailwind, eslint)
- 3 sample files to document clearly
- Currently 20+ visible items in root, target: ≤15 items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Client-Side Privacy (NON-NEGOTIABLE)
✅ **PASS** - No changes to client-side architecture. Documentation clarifies privacy-first design.

### Principle II: Performance-First Architecture (NON-NEGOTIABLE)
✅ **PASS** - No performance-impacting changes. README will emphasize Web Worker architecture.

### Principle III: Library-First Design
✅ **PASS** - No library changes. Documentation may improve discoverability of library structure.

### Principle IV: Test-Driven Development (TDD)
⚠️ **N/A** - No code implementation, only documentation and file moves. Manual validation sufficient.

### Principle V: Type Safety & Strict Mode
✅ **PASS** - No TypeScript changes.

### Principle VI: Progressive Enhancement
✅ **PASS** - No functional changes.

### Principle VII: Specification-First Workflow
✅ **PASS** - Following SpecKit workflow: spec → plan → tasks → implementation.

**Constitution Gate Result**: ✅ **APPROVED** - All applicable principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-project-organization/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (organizational best practices)
├── data-model.md        # Phase 1 output (documentation structure model)
├── quickstart.md        # Phase 1 output (guide for applying org changes)
├── contracts/           # Phase 1 output (file naming/structure contracts)
│   └── directory-structure.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Current Repository Structure (Before)

```text
/ (root) - 20+ visible items
├── .claude/                    # AI assistant config (hidden)
├── .git/                       # Git repo (hidden)
├── .specify/                   # SpecKit workflow (hidden)
├── dist/                       # Build output
├── node_modules/               # Dependencies (hidden in typical views)
├── sample-files/               # Sample binaries
├── specs/                      # Feature specifications
├── src/                        # Source code
├── .DS_Store                   # macOS artifact
├── .eslintrc.cjs               # Linting config
├── .gitignore                  # Git ignore rules
├── .prettierrc                 # Code formatting config
├── CLAUDE.md                   # AI assistant guidance doc
├── CODEBASE_EXPLORATION.md     # Detailed codebase doc
├── README.md                   # Primary user-facing doc
├── index.html                  # Entry point
├── package-lock.json           # Lock file
├── package.json                # Package manifest
├── postcss.config.js           # PostCSS config
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── tsconfig.node.json          # TypeScript Node config
├── vite.config.ts              # Vite build config
└── vitest.config.ts            # Vitest test config
```

### Target Repository Structure (After)

```text
/ (root) - ≤15 visible items
├── docs/                       # [NEW] Documentation hub
│   ├── CODEBASE_EXPLORATION.md # Technical exploration (moved)
│   ├── CONTRIBUTING.md         # [NEW] Contribution guide
│   └── screenshots/            # [NEW] README visual aids
├── sample-files/               # Sample binaries (renamed for clarity)
│   └── README.md               # [NEW] Sample file guide
├── specs/                      # Feature specifications
├── src/                        # Source code
├── .eslintrc.cjs               # Linting config (root - standard)
├── .gitignore                  # Git ignore (root - standard)
├── .prettierrc                 # Formatting config (root - standard)
├── CLAUDE.md                   # AI assistant guidance (root - SpecKit convention)
├── README.md                   # Primary documentation
├── index.html                  # Entry point (root - Vite convention)
├── package.json                # Package manifest (root - npm convention)
├── package-lock.json           # Lock file (root - npm convention)
├── postcss.config.js           # PostCSS config (root - Tailwind requirement)
├── tailwind.config.js          # Tailwind config (root - Tailwind requirement)
├── tsconfig.json               # TypeScript config (root - TS convention)
├── vite.config.ts              # Vite config (root - Vite convention)
└── vitest.config.ts            # Vitest config (root - Vitest convention)
```

**Visible Root Items Count**: 15 (down from 20+)

**Structure Decisions**:
- **docs/ directory**: Consolidates secondary documentation (CODEBASE_EXPLORATION, CONTRIBUTING, screenshots). README stays in root per GitHub convention.
- **CLAUDE.md stays in root**: Required by SpecKit workflow, AI assistants expect it at root level.
- **Config files stay in root**: JavaScript/TypeScript tooling convention requires configs at root. Grouping in subdirs would break tooling.
- **tsconfig.node.json removal**: Merged into tsconfig.json (dual configs only needed for complex monorepos).
- **dist/ handling**: Added to .gitignore, documented as build output in README. Not tracked in git.
- **.DS_Store**: Added to .gitignore to prevent future clutter.
- **sample-files/README.md**: Provides sample file metadata (size, platform, use case) for discoverability.

## Complexity Tracking

> No constitution violations - section not applicable.

---

## Phase 0: Research & Technical Decisions

### Research Questions

1. **Repository organization best practices** for TypeScript/React projects
   - What is the standard location for documentation files?
   - How do popular projects (Vite, React, TypeScript) organize config files?
   - Should configuration files be grouped or remain at root?

2. **README structure best practices** for open-source tools
   - What sections are essential for developer onboarding?
   - How should quick start guides be structured?
   - What visual elements improve comprehension (badges, screenshots, diagrams)?
   - How do successful projects (create-react-app, Next.js) structure their READMEs?

3. **GitHub markdown rendering constraints**
   - Image size limits and recommendations
   - Load time impact of embedded images vs. linked images
   - Markdown table of contents best practices

4. **Sample file documentation patterns**
   - How should binary file metadata be documented?
   - Best practices for test fixture documentation (size, purpose, source)

### Deliverable

`research.md` with findings and decisions for:
- Final directory structure (confirming target above)
- README outline with recommended sections
- Documentation hierarchy (what goes in docs/, what stays in root)
- Sample file metadata format
- Visual aid strategy (badges, screenshots, diagrams)

---

## Phase 1: Design & Contracts

### Data Model

`data-model.md` will define the structure of documentation entities:

**Entities**:
1. **Documentation File** - Metadata (purpose, target audience, length, location)
2. **Configuration File** - Metadata (tool, purpose, required location, groupability)
3. **Sample File** - Metadata (size, platform, format, recommended use case, source)
4. **Directory Group** - Purpose, contents, visibility rules

**Relationships**:
- Documentation files → Directory groups (root vs. docs/)
- Configuration files → Root directory (required by tooling conventions)
- Sample files → sample-files/ directory (with metadata in README)

### Contracts

`contracts/directory-structure.md` will define:

1. **Root Directory Rules**:
   - Maximum 15 visible items
   - Essential files only (package.json, README, index.html, CLAUDE.md)
   - Configuration files follow tool conventions (root location required)
   - No build artifacts (dist/), OS artifacts (.DS_Store), or generated files

2. **docs/ Directory Rules**:
   - Secondary documentation (CODEBASE_EXPLORATION, CONTRIBUTING)
   - Screenshots and visual assets (docs/screenshots/)
   - Architecture diagrams (if created in future)
   - Not for API docs (those go in JSDoc comments)

3. **sample-files/ Directory Rules**:
   - Contains README.md with file metadata table
   - Binary files organized by platform (optional subdirs if files grow)
   - Clear naming convention: `[app-name].[version].[extension]`

4. **Documentation Naming Conventions**:
   - README.md - Primary user-facing documentation
   - CLAUDE.md - AI assistant project guidance
   - CONTRIBUTING.md - Contribution guidelines
   - CODEBASE_EXPLORATION.md - Technical deep dive

### Quickstart Guide

`quickstart.md` will provide step-by-step instructions for:
1. Creating docs/ directory and moving files
2. Creating sample-files/README.md with metadata table
3. Restructuring README.md sections (before/after outline)
4. Adding visual aids (badge examples, screenshot guidelines)
5. Updating .gitignore to exclude build artifacts and OS files
6. Removing tsconfig.node.json (merge into tsconfig.json)
7. Validating root directory item count (≤15 check)
8. Manual testing checklist (README readability, sample file discovery, config file functionality)

### Agent Context Update

After Phase 1, update agent context:
- Run `.specify/scripts/bash/update-agent-context.sh claude`
- No new technologies added (documentation changes only)
- Update will preserve existing tech stack entries

---

## Phase 2: Task Breakdown

*Created by `/speckit.tasks` command - not part of this plan document.*

Tasks will be organized by user story priority:
- **P1 tasks**: Root directory organization, README restructure, quick start section
- **P2 tasks**: docs/ directory creation, sample-files/README.md, config documentation
- **P3 tasks**: Visual aids (badges, screenshots), feature discovery enhancements

Each task will specify exact file paths and acceptance criteria from spec.md.

---

## Notes

- **No code changes**: This feature modifies only documentation and file structure
- **Backward compatibility**: All npm scripts, build commands, and development workflows remain unchanged
- **SpecKit compatibility**: Existing specs/ directory and .specify/ workflow unchanged
- **Git operations**: File moves should use `git mv` to preserve history
- **Testing approach**: Manual validation against success criteria (SC-001 through SC-007)
- **Deployment impact**: None - changes are repository structure only, not runtime behavior
