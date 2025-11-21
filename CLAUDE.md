# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository uses **SpecKit**, a specification-first development workflow system that enforces a structured approach to feature development. The workflow progresses through clearly defined phases: specification → planning → task breakdown → implementation, with validation gates at each step.

## SpecKit Workflow Commands

The development workflow is driven by slash commands that guide feature development from concept to implementation:

### Core Commands (in sequence)

1. **`/speckit.specify [description]`** - Create feature specification
   - Generates user stories with priorities (P1, P2, P3)
   - Creates functional requirements and success criteria
   - Outputs: `specs/NNN-feature-name/spec.md`
   - Auto-creates feature branch: `NNN-feature-name`

2. **`/speckit.clarify`** - Resolve specification ambiguities
   - Interactive Q&A for unclear requirements
   - Maximum 3 critical clarifications per spec
   - Updates spec with user-provided answers

3. **`/speckit.plan`** - Generate implementation plan
   - Phase 0: Research and resolve technical unknowns
   - Phase 1: Design data models, contracts, quickstart guide
   - Outputs: `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
   - Validates against project constitution

4. **`/speckit.tasks`** - Generate task breakdown
   - Organizes tasks by user story priority
   - Creates dependency graph and parallel execution plan
   - Outputs: `tasks.md` with executable task list
   - Format: `- [ ] [TID] [P?] [Story?] Description with file path`

5. **`/speckit.implement`** - Execute implementation
   - Processes tasks.md in dependency order
   - Follows TDD if tests defined in tasks
   - Respects parallel execution markers `[P]`
   - Validates checklist completion before starting

### Supporting Commands

- **`/speckit.constitution`** - Create/update project constitution
- **`/speckit.analyze`** - Analyze codebase architecture
- **`/speckit.checklist`** - Generate phase-specific checklists

## Project Structure

```
specs/
  NNN-feature-name/           # Feature directory (NNN = sequential number)
    spec.md                   # What and why (user-facing)
    plan.md                   # Technical architecture
    research.md               # Technical decisions
    data-model.md             # Entities and relationships
    quickstart.md             # Integration scenarios
    tasks.md                  # Executable task breakdown
    contracts/                # API specifications
    checklists/               # Validation checklists

.specify/
  memory/
    constitution.md           # Project governance rules
  templates/                  # Document templates
  scripts/bash/               # Workflow automation scripts

.claude/
  commands/                   # Slash command definitions
```

## Key Scripts

All scripts are located in `.specify/scripts/bash/`:

- **`create-new-feature.sh --json --number N --short-name "name" "description"`**
  - Creates feature branch and directory structure
  - Returns JSON with BRANCH_NAME and SPEC_FILE paths

- **`setup-plan.sh --json`**
  - Initializes planning phase
  - Returns paths: FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH

- **`check-prerequisites.sh --json [--require-tasks] [--include-tasks]`**
  - Validates workflow prerequisites
  - Returns FEATURE_DIR and AVAILABLE_DOCS list

- **`update-agent-context.sh claude`**
  - Updates agent-specific context files
  - Preserves manual additions between markers

## Task Format Requirements

Every task in `tasks.md` MUST follow this exact format:

```
- [ ] [TID] [P?] [Story?] Description with file path
```

Components:
- Checkbox: `- [ ]` (markdown)
- Task ID: Sequential (T001, T002...)
- `[P]`: Parallel execution allowed (optional)
- `[Story]`: User story label `[US1]`, `[US2]` (for story phases only)
- Description: Clear action with exact file path

Examples:
- `- [ ] T001 Create project structure per implementation plan`
- `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`

## Development Principles

### Specification-First Approach
- **What before How**: Specs describe user value, not implementation
- **Technology-agnostic**: No frameworks, libraries, or code details in specs
- **Measurable outcomes**: Success criteria must be verifiable without implementation knowledge

### User Story Organization
- Stories are **prioritized** (P1, P2, P3) by importance
- Each story is **independently testable** - can be implemented alone as MVP
- Tasks are organized by story to enable incremental delivery

### Constitution Enforcement
- All features validated against `.specify/memory/constitution.md`
- Constitution defines non-negotiable principles (e.g., library-first, TDD, observability)
- Violations must be explicitly justified in plan.md

### Implementation Strategy
- **Phase-by-phase execution**: Setup → Foundational → User Stories (by priority) → Polish
- **TDD when specified**: Test tasks precede implementation tasks
- **Dependency respect**: Sequential tasks in order, parallel tasks `[P]` concurrently
- **Checklist validation**: All checklists must pass before `/speckit.implement`

## Common Workflow Patterns

### Starting a new feature
```bash
/speckit.specify Add user authentication with OAuth2
# → Creates branch 001-user-auth, generates spec.md
# → Reviews for clarifications

/speckit.clarify
# → Resolves any ambiguities interactively

/speckit.plan
# → Generates technical plan, research, contracts

/speckit.tasks
# → Breaks down into executable tasks

/speckit.implement
# → Executes implementation
```

### Working with existing features
```bash
# Find current feature branch
git branch --list '[0-9]*-*'

# Check available documentation
.specify/scripts/bash/check-prerequisites.sh --json

# Analyze existing implementation
/speckit.analyze
```

## Important Notes

- **All paths must be absolute** when calling bash scripts
- **Single quotes in args**: Use escape syntax `'I'\''m Groot'` or double-quotes `"I'm Groot"`
- **Scripts return JSON**: Parse output for file paths and metadata
- **Checklist gating**: `/speckit.implement` blocks on incomplete checklists unless user explicitly approves
- **Spec quality limits**: Maximum 3 `[NEEDS CLARIFICATION]` markers - make informed guesses for the rest
- **Git integration**: Feature branches auto-created with format `NNN-feature-name`

## File Ignore Patterns

Project setup verification (`/speckit.implement` step 4) auto-detects technology stack and creates/verifies appropriate ignore files (.gitignore, .dockerignore, etc.) based on detected tools and languages in `plan.md`.

## Active Technologies
- TypeScript 5.x (strict mode), targeting ES2020+ (001-app-size-analyzer)
- TypeScript 5.9 (strict mode, ES2020+ target) + React 18.3.1, Zustand 5.0.8, @tanstack/react-virtual 3.13.12 (002-sort-by-size)
- N/A (client-side only, in-memory state with Zustand) (002-sort-by-size)
- TypeScript 5.9 (strict mode, ES2020+ target) + React 18.3.1, @nivo/treemap 0.99.0, Zustand 5.0.8, Tailwind CSS 3.4.18 (003-xray-ux-improvements)
- TypeScript 5.9 (strict mode), targeting ES2020+ + React 18.3.1, @nivo/treemap 0.99.0, Zustand 5.0.8, Tailwind CSS 3.4.18, color2k 2.0.3 (003-xray-ux-improvements)
- Client-side only - in-memory state management with Zustand (no backend/database) (003-xray-ux-improvements)
- TypeScript 5.9 (strict mode), targeting ES2020+ + React 18.3.1, Zustand 5.0.8, Tailwind CSS 3.4.18, @tanstack/react-virtual 3.13.12 (004-insights-improvements)
- N/A (Documentation/Organization only - no code changes) + N/A (Markdown files and directory structure only) (005-project-organization)
- N/A (File system organization) (005-project-organization)
- JavaScript (ES2020+) with Vue 3.5+ (no TypeScript per user requirement) + Vue 3.5+, Pinia 2.3+ (state management), @nivo/treemap 0.99+, fflate 0.8+ (ZIP parsing), app-info-parser 1.1+ (binary metadata) (006-vue-migration)
- N/A (100% client-side, no persistence, in-memory state only) (006-vue-migration)
- JavaScript (ES2020+) with Vue 3.5.24 (no TypeScript per project requirement) + Vue 3.5+, Pinia 2.3+, ECharts 5.5+, vue-echarts 7.0+, color2k 2.0+ (007-xray-insights-enhancements)
- N/A (100% client-side, in-memory state with Pinia) (007-xray-insights-enhancements)
- JavaScript ES2020+ with Vue 3.5.24 + Vue 3.5.24 + Pinia 2.3+ (no TypeScript per project constitution) (008-code-cleanup)
- N/A (client-side only, in-memory state with Pinia) (008-code-cleanup)
- JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per constitution requirement) + Vue 3.5.24, Pinia 2.3.1, Comlink 4.4.2, ECharts 5.5.0, fflate 0.8.2, app-info-parser 1.1.6, @tanstack/vue-virtual 3.13.12 (009-vue-migration-completion)
- JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution) + Vue 3.5.24, Pinia 2.3.1, ECharts 5.5.0, vue-echarts 7.0.3 (010-summary-page-graphs)
- N/A (100% client-side, in-memory state with Pinia - no persistence) (010-summary-page-graphs)
- JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution) + Vue 3.5.24, Pinia 2.3.1, Vite 5.4.21 (009-sample-file-quickstart)
- JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution) + Vue 3.5.24, Pinia 2.3.1, fflate 0.8.2 (ZIP parsing), app-info-parser 1.1.6 (metadata extraction), ECharts 5.5.0 (visualization) (012-aab-framework-support)
- JavaScript ES2020+ with Vue 3.5.24 (no TypeScript per project constitution) + Vue 3.5.24, Pinia 2.3.1, fflate 0.8.2 (ZIP parsing), app-info-parser 1.1.6 (metadata extraction), Canvas API (image compression), Comlink 4.4.2 (Web Worker communication), color2k 2.0.3 (color utilities) (011-insights-improvement)

## Recent Changes
- 001-app-size-analyzer: Added TypeScript 5.x (strict mode), targeting ES2020+
