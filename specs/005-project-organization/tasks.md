# Tasks: Project Organization & Documentation Improvements

**Input**: Design documents from `/specs/005-project-organization/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/directory-structure.md ✅, quickstart.md ✅

**Tests**: Not applicable - documentation and file organization feature (manual validation only)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Repository root: `/Users/magdoub/Documents/projects/sizeanalyzer/`
- Documentation: `docs/` (new), `README.md`, `CLAUDE.md`
- Samples: `sample-files/`
- Configs: Root level (tooling requirement)

---

## Phase 1: Setup (Project Preparation)

**Purpose**: Verify current state and prepare for reorganization

- [ ] T001 Verify current root directory item count (expect 17+ items before changes)
- [ ] T002 [P] Backup current README.md for reference during restructuring
- [ ] T003 [P] Verify all build commands work in current state (npm run dev, build, lint, format)

---

## Phase 2: Foundational (No Blocking Prerequisites)

**Purpose**: No foundational infrastructure needed - this is a documentation-only feature

**Note**: This phase is empty because all user stories can begin immediately after Setup. The feature has no shared infrastructure that would block user story implementation.

**Checkpoint**: Setup complete - user story implementation can begin

---

## Phase 3: User Story 1 - First-Time Developer Onboarding (Priority: P1) 🎯 MVP

**Goal**: Clean, organized root directory with restructured README that enables new developers to understand the tool and run a sample analysis within 3 minutes.

**Independent Test**: Clone the repo, read README, run `npm install && npm run dev`, drag/drop `sample-files/A Night Battle HD 1.2.ipa`, see analysis. Time should be <3 minutes. Success = understanding tool purpose in 30 seconds, running sample in 3 minutes total.

### US1: Root Directory Organization

- [ ] T004 [P] [US1] Create docs/ directory at repository root
- [ ] T005 [P] [US1] Create docs/screenshots/ subdirectory for visual assets
- [ ] T006 [US1] Move CODEBASE_EXPLORATION.md to docs/CODEBASE_EXPLORATION.md using `git mv`
- [ ] T007 [US1] Verify CODEBASE_EXPLORATION.md still accessible at new location

### US1: Configuration Consolidation

- [ ] T008 [US1] Read current tsconfig.node.json and tsconfig.json to identify merge strategy
- [ ] T009 [US1] Merge tsconfig.node.json settings into tsconfig.json (see quickstart.md Phase 3.1)
- [ ] T010 [US1] Remove tsconfig.node.json using `git rm tsconfig.node.json`
- [ ] T011 [US1] Test TypeScript build: `npm run type-check` (verify no errors after merge)
- [ ] T012 [US1] Test Vite dev server: `npm run dev` (verify TypeScript config still works)

- [ ] T013 [US1] Read current .prettierrc configuration
- [ ] T014 [US1] Add "prettier" field to package.json with .prettierrc contents (see quickstart.md Phase 3.2)
- [ ] T015 [US1] Remove .prettierrc using `git rm .prettierrc`
- [ ] T016 [US1] Test Prettier formatting: `npm run format` (verify config in package.json works)

- [ ] T017 [US1] Read postcss.config.js to verify it only contains Tailwind + autoprefixer
- [ ] T018 [US1] Test removing postcss.config.js: `mv postcss.config.js postcss.config.js.bak && npm run dev`
- [ ] T019 [US1] If Tailwind styles apply without postcss.config.js: `git rm postcss.config.js`
- [ ] T020 [US1] If Tailwind fails without postcss.config.js: Restore file `mv postcss.config.js.bak postcss.config.js`

### US1: .gitignore Updates

- [ ] T021 [US1] Add dist/ to .gitignore if not already present (build output)
- [ ] T022 [US1] Add .DS_Store to .gitignore (macOS artifact)
- [ ] T023 [US1] Add *.log to .gitignore (log files)
- [ ] T024 [US1] If .DS_Store exists in git history: `git rm --cached .DS_Store`
- [ ] T025 [US1] Verify .gitignore excludes all generated files per contracts/directory-structure.md Section 5.1

### US1: README Restructuring (High-Level Overview & Quick Start)

- [ ] T026 [US1] Create new README.md structure with sections: Title, Badges (placeholder), Screenshot (placeholder), Overview, Quick Start, Features, How It Works, Tech Stack, Installation, Documentation, Browser Compatibility, Troubleshooting, License
- [ ] T027 [US1] Write Overview section (2-3 sentences: what tool does, who it's for, client-side privacy differentiator) per research.md Decision FR-001, FR-009
- [ ] T028 [US1] Write Quick Start section with 5 steps: clone, install, dev server, drag sample file, explore views per research.md Decision FR-002
- [ ] T029 [US1] Add sample file quick-reference in Quick Start: "Try with sample files (see sample-files/README.md): Quick test (5MB), Medium test (47MB), Large test (79MB)"
- [ ] T030 [US1] Update Features section to keep existing content (Breakdown, X-Ray, Insights descriptions)
- [ ] T031 [US1] Condense "How It Works" section to emphasize client-side privacy (100% client-side, Web Workers, zero backend) per research.md Decision
- [ ] T032 [US1] Keep existing Tech Stack, Installation, Browser Compatibility, Troubleshooting sections (minimal changes)
- [ ] T033 [US1] Update Documentation section with links: [Contributing Guide](docs/CONTRIBUTING.md), [Codebase Exploration](docs/CODEBASE_EXPLORATION.md), [Feature Specs](specs/), [Sample Files](sample-files/README.md)
- [ ] T034 [US1] Verify all internal links use correct relative paths (docs/, sample-files/)
- [ ] T035 [US1] Verify README.md length ≤300 lines: `wc -l README.md` (target ~250 lines)

### US1: Validation

- [ ] T036 [US1] Count root directory visible items: `ls -1 | grep -v '^\.' | wc -l` (expect ≤15 after config consolidation)
- [ ] T037 [US1] Verify docs/ directory exists with CODEBASE_EXPLORATION.md
- [ ] T038 [US1] Test all build commands still work: `npm run dev`, `npm run build`, `npm run lint`, `npm run format`, `npm run type-check`
- [ ] T039 [US1] Test fresh clone scenario per quickstart.md Phase 8.1 (clone → install → dev → sample file analysis in <3 minutes)

**Checkpoint**: User Story 1 complete - root directory organized (≤15 items), README restructured with Quick Start, new developers can onboard in <3 minutes

---

## Phase 4: User Story 2 - Contributing Developer Navigation (Priority: P2)

**Goal**: Organized documentation in docs/ directory with clear contribution guide, sample file metadata, enabling developers to locate resources within 30 seconds.

**Independent Test**: Ask developer to locate: (1) contribution workflow, (2) sample file metadata, (3) technical deep-dive. All should be findable within 30 seconds by scanning root → docs/ or sample-files/.

### US2: Contributing Documentation

- [ ] T040 [P] [US2] Create docs/CONTRIBUTING.md with content from quickstart.md template (SpecKit workflow, code standards, commands)
- [ ] T041 [P] [US2] Add sections to CONTRIBUTING.md: Development Workflow, Code Standards, Getting Started, Making Changes, Code Review Checklist, Project Structure, Common Commands, Resources
- [ ] T042 [US2] Link to SpecKit workflow in CONTRIBUTING.md: reference CLAUDE.md and .specify/memory/constitution.md
- [ ] T043 [US2] Document code quality standards in CONTRIBUTING.md: TypeScript strict mode, testing expectations, linting, formatting
- [ ] T044 [US2] Add common commands section in CONTRIBUTING.md: dev, build, lint, format, type-check
- [ ] T045 [US2] Verify CONTRIBUTING.md is accessible from README.md "Documentation" section link

### US2: Sample File Metadata

- [ ] T046 [P] [US2] Create sample-files/README.md with header and "Available Samples" section
- [ ] T047 [US2] Add metadata table to sample-files/README.md with columns: File, Platform, Size, Recommended Use Case, Parse Time, Notes (per data-model.md Section 3)
- [ ] T048 [US2] Add row for "A Night Battle HD 1.2.ipa": iOS, 5.1 MB, Quick test, ~5 sec, "Small app, good for verifying the tool works"
- [ ] T049 [US2] Add row for "Tools-for-Procreate-IPAOMTK.COM.ipa": iOS, 47 MB, Medium test, ~20 sec, "Realistic app size, shows framework analysis and asset breakdowns"
- [ ] T050 [US2] Add row for "com.grasshopper.dialer APK": Android, 79 MB, Large test, ~30 sec, "Multi-DEX, localization, native libs"
- [ ] T051 [US2] Add "Usage" section to sample-files/README.md: steps to run dev server, choose sample, analyze
- [ ] T052 [US2] Add "What to Look For" section with subsections for iOS (frameworks, assets, executables) and Android (DEX, native libs, resources)
- [ ] T053 [US2] Add "Adding New Sample Files" section with prerequisites, steps, file naming convention per contracts/directory-structure.md Section 3.4
- [ ] T054 [US2] Verify sample-files/README.md is accessible from README.md Quick Start section link

### US2: Validation

- [ ] T055 [US2] Verify docs/CONTRIBUTING.md exists and contains all required sections
- [ ] T056 [US2] Verify sample-files/README.md exists with complete metadata table for all 3 sample files
- [ ] T057 [US2] Test developer navigation: Time how long it takes to find CONTRIBUTING.md from root (target: <30 seconds)
- [ ] T058 [US2] Test sample file discovery: Ask user to identify "quick test" sample (target: <10 seconds per SC-007)
- [ ] T059 [US2] Verify all internal links work (README → docs/CONTRIBUTING.md, README → sample-files/README.md)

**Checkpoint**: User Story 2 complete - docs/ populated with CONTRIBUTING.md, sample-files/README.md created, developers can navigate documentation in <30 seconds

---

## Phase 5: User Story 3 - End-User Feature Discovery (Priority: P3)

**Goal**: Visual aids in README (badges, screenshot) that communicate tool capabilities without reading, enabling 90% comprehension from Overview section alone.

**Independent Test**: Show README to user unfamiliar with project, ask them to explain: (1) what tool does, (2) what platforms it supports, (3) three main features. Should achieve 90% accuracy from badges + screenshot + Overview section without reading full README.

### US3: Badges

- [ ] T060 [P] [US3] Add License badge to README.md after title: `![License](https://img.shields.io/badge/license-MIT-blue.svg)`
- [ ] T061 [P] [US3] Add TypeScript badge to README.md: `![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)`
- [ ] T062 [P] [US3] Add React badge to README.md: `![React](https://img.shields.io/badge/React-18.3-blue?logo=react)`
- [ ] T063 [P] [US3] Add Privacy-First custom badge to README.md: `![Privacy](https://img.shields.io/badge/privacy-100%25%20client--side-green)`
- [ ] T064 [US3] Verify badges render correctly (view in markdown preview or GitHub)

### US3: Screenshot

- [ ] T065 [US3] Run development server: `npm run dev`
- [ ] T066 [US3] Drag and drop `sample-files/Tools-for-Procreate-IPAOMTK.COM.ipa` (47MB, good visual)
- [ ] T067 [US3] Navigate to X-Ray tab after parsing completes
- [ ] T068 [US3] Take screenshot of X-Ray Treemap view (full treemap, colorful, clear UI)
- [ ] T069 [US3] Save screenshot as PNG to temporary location
- [ ] T070 [US3] Optimize screenshot with ImageOptim, TinyPNG, or pngquant (target: <300KB) per contracts/directory-structure.md Section 6.2
- [ ] T071 [US3] Save optimized screenshot as docs/screenshots/xray-treemap.png
- [ ] T072 [US3] Add screenshot to README.md after badges: `![X-Ray Treemap View](docs/screenshots/xray-treemap.png)`
- [ ] T073 [US3] Verify screenshot displays correctly in markdown preview
- [ ] T074 [US3] Verify screenshot file size: `ls -lh docs/screenshots/xray-treemap.png` (should be <500KB per contract)

### US3: Validation

- [ ] T075 [US3] Count visual elements in README.md: badges (4) + screenshot (1) = 5 total (meets SC-006: ≥2 visual elements)
- [ ] T076 [US3] Test comprehension: Show README to unfamiliar user, ask to explain tool purpose, platforms, features (target: 90% accuracy per SC-004)
- [ ] T077 [US3] Verify README loads quickly in GitHub markdown preview (<2 seconds per plan.md Performance Goals)
- [ ] T078 [US3] Verify screenshot is optimized (<500KB) and displays correctly in GitHub

**Checkpoint**: User Story 3 complete - README has 5 visual elements (4 badges + 1 screenshot), end-users can understand tool capabilities from visuals alone

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and commit

### Documentation & Cleanup

- [ ] T079 [P] Review all documentation files for consistency (README, CONTRIBUTING, sample-files/README.md, CODEBASE_EXPLORATION.md)
- [ ] T080 [P] Verify all markdown files use proper heading hierarchy (H1 → H2 → H3)
- [ ] T081 [P] Run markdown link checker if available: `markdown-link-check README.md` (or manual verification)
- [ ] T082 Remove backup files if created (e.g., README.md.bak, postcss.config.js.bak)

### Final Validation Checklist

- [ ] T083 ✅ Root directory has ≤15 visible items: `ls -1 | grep -v '^\.' | wc -l` (SC-003)
- [ ] T084 ✅ README.md length ≤300 lines: `wc -l README.md` (SC-002)
- [ ] T085 ✅ README.md has ≥2 visual elements: count badges + screenshot (SC-006)
- [ ] T086 ✅ docs/ directory exists with CODEBASE_EXPLORATION.md and CONTRIBUTING.md
- [ ] T087 ✅ docs/screenshots/ directory exists with xray-treemap.png
- [ ] T088 ✅ sample-files/README.md exists with metadata table for all 3 samples
- [ ] T089 ✅ .gitignore includes dist/, .DS_Store, *.log
- [ ] T090 ✅ All internal documentation links work (no broken relative paths)
- [ ] T091 ✅ All build commands pass: `npm run dev`, `npm run build`, `npm run lint`, `npm run format`, `npm run type-check`
- [ ] T092 ✅ Fresh clone test passes: clone → install → dev → sample file analysis in <3 minutes (SC-001)

### Git Commit

- [ ] T093 Review all changes: `git status` (should show: docs/ created, README updated, configs merged, .gitignore updated, CODEBASE_EXPLORATION moved)
- [ ] T094 Stage all changes: `git add .`
- [ ] T095 Commit with detailed message per quickstart.md Phase 7.2 (include: what, why, technical details, success criteria met)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Empty - no blocking infrastructure
- **Phase 3 (User Story 1 - P1)**: Depends on Setup (Phase 1)
  - Can start immediately after T003 (verify builds work)
- **Phase 4 (User Story 2 - P2)**: Depends on docs/ directory creation (T004)
  - Can start after T004-T005 complete
  - Otherwise independent from US1
- **Phase 5 (User Story 3 - P3)**: Depends on README restructure (T026-T035 from US1)
  - Badges can be added anytime to restructured README
  - Screenshot needs app running (T065)
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 Setup - No dependencies on other stories
- **User Story 2 (P2)**: Depends on T004 (docs/ directory created in US1) - Otherwise independent
- **User Story 3 (P3)**: Depends on T026-T035 (README restructure in US1) - Can run in parallel with US2 after README ready

### Within Each User Story

**User Story 1** (T004-T039):
- Root directory organization (T004-T007) can start first
- Config consolidation (T008-T020) can run in parallel with root org
- .gitignore updates (T021-T025) can run in parallel with configs
- README restructure (T026-T035) depends on docs/ created (T004)
- Validation (T036-T039) must run last in US1

**User Story 2** (T040-T059):
- CONTRIBUTING.md creation (T040-T045) can run in parallel with sample-files/README.md creation (T046-T054)
- Validation (T055-T059) must run last in US2

**User Story 3** (T060-T078):
- All badges (T060-T064) can run in parallel
- Screenshot tasks (T065-T074) must run sequentially (dev → drag file → navigate → capture → optimize → save → embed)
- Validation (T075-T078) must run last in US3

### Parallel Opportunities

**Within User Story 1**:
```bash
# Can run in parallel:
- T004 Create docs/ directory
- T005 Create docs/screenshots/
- T008 Read tsconfig.node.json
- T013 Read .prettierrc
- T017 Read postcss.config.js
- T021 Add dist/ to .gitignore
- T022 Add .DS_Store to .gitignore
- T023 Add *.log to .gitignore
```

**Within User Story 2**:
```bash
# Can run in parallel (different files):
- T040-T045 CONTRIBUTING.md creation
- T046-T054 sample-files/README.md creation
```

**Within User Story 3**:
```bash
# Can run in parallel (badges are independent):
- T060 License badge
- T061 TypeScript badge
- T062 React badge
- T063 Privacy badge
```

**Across User Stories** (after US1 dependencies met):
```bash
# After T004-T005 (docs/ created) and T026-T035 (README restructured):
- User Story 2 tasks (T040-T059)
- User Story 3 tasks (T060-T078)
# Can run in parallel by different developers
```

---

## Parallel Example: User Story 1 (Config Consolidation)

```bash
# Launch all config reading tasks together:
Task: "Read current tsconfig.node.json and tsconfig.json to identify merge strategy"
Task: "Read current .prettierrc configuration"
Task: "Read postcss.config.js to verify it only contains Tailwind + autoprefixer"

# Then process merges sequentially (each must test before next)
```

---

## Parallel Example: User Story 2 (Documentation Creation)

```bash
# Launch both documentation file creation tasks together:
Task: "Create docs/CONTRIBUTING.md with content from quickstart.md template"
Task: "Create sample-files/README.md with header and 'Available Samples' section"

# Then fill content in parallel (different files)
```

---

## Parallel Example: User Story 3 (Badges)

```bash
# Launch all badge addition tasks together:
Task: "Add License badge to README.md after title"
Task: "Add TypeScript badge to README.md"
Task: "Add React badge to README.md"
Task: "Add Privacy-First custom badge to README.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Complete Phase 1: Setup (T001-T003)
2. ✅ Complete Phase 3: User Story 1 (T004-T039)
   - Root directory organized (≤15 items)
   - README restructured with Quick Start
   - Config files consolidated
   - .gitignore updated
3. **STOP and VALIDATE**: Test fresh clone → install → dev → sample analysis (<3 minutes)
4. **Checkpoint**: MVP ready - new developers can onboard quickly

**MVP Scope**: Just User Story 1 delivers core value (clean root, quick start guide)

### Incremental Delivery

1. **Foundation**: Phase 1 Setup (T001-T003) → Verify current state
2. **Increment 1 (MVP)**: User Story 1 (T004-T039) → Clean root + Quick Start → Test independently → Commit
3. **Increment 2**: User Story 2 (T040-T059) → Contributing docs + Sample metadata → Test independently → Commit
4. **Increment 3**: User Story 3 (T060-T078) → Visual aids → Test independently → Commit
5. **Polish**: Phase 6 (T079-T095) → Final validation → Commit

Each increment adds value without breaking previous increments.

### Parallel Team Strategy

With 2 developers:

1. Both: Complete Phase 1 Setup (T001-T003)
2. Both: Complete User Story 1 together (foundational for US2 and US3)
3. After US1 complete:
   - **Developer A**: User Story 2 (T040-T059) - docs/ and sample-files/ documentation
   - **Developer B**: User Story 3 (T060-T078) - badges and screenshot
4. Both: Phase 6 Polish together (T079-T095)

Stories US2 and US3 can proceed in parallel after US1 completes.

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] labels**: Map each task to user story for traceability (US1, US2, US3)
- **Each user story is independently testable**: US1 can be validated alone, US2 adds on top, US3 adds visuals
- **File paths are absolute** in descriptions (docs/, sample-files/, root level files)
- **Git operations**: Use `git mv` for moves to preserve history, `git rm` for deletions
- **Validation at each checkpoint**: Stop and verify before moving to next story
- **Manual validation**: No automated tests, use success criteria from spec.md (SC-001 through SC-007)
- **Estimated time**: 2-3 hours total (per quickstart.md)
- **Commit strategy**: Can commit after each user story checkpoint or once at end (Phase 6)

---

## Success Criteria Mapping

- **SC-001** (3-minute onboarding): Validated in T039 (US1 validation)
- **SC-002** (README ≤300 lines): Validated in T035 (US1 README restructure) and T084 (final validation)
- **SC-003** (Root ≤15 items): Validated in T036 (US1 validation) and T083 (final validation)
- **SC-004** (90% comprehension): Validated in T076 (US3 validation)
- **SC-005** (30-second navigation): Validated in T057 (US2 validation)
- **SC-006** (≥2 visual elements): Validated in T075 (US3 validation)
- **SC-007** (10-second sample discovery): Validated in T058 (US2 validation)

All success criteria have corresponding validation tasks.
