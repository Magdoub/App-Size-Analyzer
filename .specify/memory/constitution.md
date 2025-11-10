<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 1.0.0 → 1.1.0 (Technology Stack Migration)
  Date: 2025-11-10

  Changes:
  - ✅ Updated Principle III (Library-First Design) for Vue 3 architecture
  - ✅ Updated Principle IV (TDD) for Vue Test Utils and Vitest
  - ✅ Modified Principle V from "Type Safety & Strict Mode" to "Code Quality & Modern JavaScript"
  - ✅ Updated Development Standards for Vue 3, Vitest, and JavaScript tooling
  - ✅ Removed TypeScript-specific enforcement rules
  - ✅ Updated testing library references (React Testing Library → Vue Test Utils)
  - ✅ Updated build tool references (Vite with Vue plugin)

  Principles Modified:
  - Principle III (Library-First Design): Updated contract examples from React to Vue/Pinia patterns
  - Principle IV (TDD): Changed test framework from React Testing Library to Vue Test Utils
  - Principle V (Type Safety & Strict Mode → Code Quality & Modern JavaScript):
    * Removed TypeScript strict mode requirements
    * Added JSDoc type annotations and ESLint enforcement
    * Maintained modern JavaScript (ES2020+) requirements

  Development Standards Updates:
  - Linting: Updated to ESLint with vue plugin (not @typescript-eslint)
  - Testing: Vitest (already in place), Vue Test Utils for component tests
  - Code quality: JSDoc comments for type hints, explicit return documentation

  Template Updates:
  - ⚠️ plan-template.md: Should reference Vue 3, Pinia, JavaScript in Technical Context examples
  - ⚠️ spec-template.md: No changes needed (technology-agnostic by design)
  - ⚠️ tasks-template.md: Test task examples should reference Vue Test Utils
  - ⚠️ Command files: Constitution check logic should validate Vue/JS patterns, not TS strict mode

  Follow-up TODOs:
  - Review plan-template.md Technical Context section for Vue/JS example updates
  - Update tasks-template.md test task examples to use Vue Test Utils syntax
  - Validate command files reference correct linting/testing tools

  Rationale for MINOR bump (not MAJOR):
  - No principles removed or fundamentally redefined
  - Core governance (client-side privacy, performance-first, library-first, TDD) remains unchanged
  - Changes reflect technology stack evolution, not principle violations
  - All existing feature implementations remain valid under updated guidance
-->

# App Size Analyzer Constitution

## Core Principles

### I. Client-Side Privacy (NON-NEGOTIABLE)

All binary parsing, analysis, and processing MUST occur entirely client-side in the user's browser. No data may be transmitted to external servers, APIs, or third-party services. Files uploaded by users MUST remain on their local machine throughout the analysis lifecycle.

**Rationale**: App binaries contain proprietary code and intellectual property. Users must have absolute confidence that their sensitive app data never leaves their control. This principle enables adoption by security-conscious enterprises and individual developers alike.

**Enforcement**:
- No backend/API endpoints for file upload or processing
- All parsing logic runs in Web Workers within the browser
- Network requests limited to static asset loading only
- No analytics or telemetry that transmits binary data or file metadata

### II. Performance-First Architecture (NON-NEGOTIABLE)

All CPU-intensive operations (binary parsing, ZIP extraction, analysis) MUST run in Web Workers to prevent UI thread blocking. The application MUST remain interactive during all analysis operations, with progress indicators and cancellation support.

**Rationale**: App binaries can exceed 500MB. Blocking the main thread during parsing creates an unacceptable user experience. Web Workers enable true parallelism and prevent browser "page unresponsive" warnings.

**Enforcement**:
- All parsers (IPA, APK, DEX, Mach-O) implemented as Web Workers
- Streaming ZIP extraction using fflate (async chunk processing)
- Virtual scrolling for tables with 10,000+ rows (TanStack Virtual for Vue)
- Canvas-based treemap rendering for large hierarchies (ECharts with canvas renderer)
- Memory profiling for files >100MB to prevent OOM errors

### III. Library-First Design

Core functionality (parsers, analysis engine, visualization generators) MUST be architected as standalone libraries with well-defined contracts. Components MUST be independently testable, reusable, and extractable from the Vue UI layer.

**Rationale**: Library-first design enables code reuse across different contexts (CLI tools, browser extensions, CI/CD integrations), improves testability by decoupling business logic from UI, and facilitates maintenance through clear separation of concerns.

**Enforcement**:
- Contracts defined as JavaScript modules with JSDoc type annotations in `contracts/` directory
- Each library module exports factory functions with minimal dependencies
- Parsers accept File/Blob inputs and return structured data (no Vue dependencies)
- Analysis engine operates on plain JavaScript objects (no Pinia/Vue state)
- Visualization generators produce data structures (not Vue components)
- Pinia stores act as thin adapters between libraries and Vue components

### IV. Test-Driven Development (TDD)

All binary format parsers and analysis logic MUST have unit tests with real binary fixtures before implementation. Tests MUST be written first, approved by stakeholders, fail initially (red), then pass after implementation (green).

**Rationale**: Binary parsing is complex and error-prone. TDD with real-world binaries ensures correctness, prevents regressions, and serves as living documentation of supported formats. Fixtures provide confidence that parsers handle edge cases (malformed files, non-standard structures).

**Enforcement**:
- Vitest unit tests for all parsers (`lib/parsers/**/*.test.js`)
- Real binary fixtures stored in `tests/fixtures/` (iOS .ipa, Android .apk)
- Vue Test Utils for component tests
- Coverage thresholds: 80% for parsers, 70% for UI components
- Integration tests for upload → parse → analyze workflows

### V. Code Quality & Modern JavaScript

JavaScript MUST target ES2020+ for modern browser features. All functions SHOULD have JSDoc type annotations for parameters and return types to improve IDE support and documentation. Complex business logic MUST include JSDoc comments explaining purpose and expected inputs/outputs.

**Rationale**: While the project uses JavaScript (not TypeScript per user requirement), maintaining code quality through JSDoc annotations provides IDE autocomplete, improves maintainability, and serves as inline documentation. ES2020+ features (optional chaining, nullish coalescing) reduce boilerplate and improve code clarity.

**Enforcement**:
- Vite build configured with `target: 'es2020'`
- ESLint rules: `eslint-plugin-vue`, enforce consistent code style
- JSDoc annotations for public APIs and complex functions
- Code review expectations: clear function purpose, parameter types documented
- Vue 3 Composition API for consistent, modern component patterns
- No use of legacy Vue Options API in new code

### VI. Progressive Enhancement

The application MUST function without JavaScript frameworks by serving a static HTML error page when JavaScript is disabled. Core analysis features MUST work in modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) without polyfills. Optional features (PWA offline mode, WebAssembly acceleration) MAY be added as enhancements but MUST NOT be required for basic functionality.

**Rationale**: While the app requires JavaScript for parsing, graceful degradation ensures users receive clear error messages rather than blank pages. Targeting modern browsers avoids polyfill bloat and leverages native Web Worker, File API, and ES2020+ features for better performance.

**Enforcement**:
- `<noscript>` tag with user-friendly error message in `index.html`
- Feature detection for Web Workers, File API before parsing starts
- Vite build target `es2020` (no legacy transpilation)
- Browser compatibility testing: Chrome 90, Firefox 88, Safari 14, Edge 90

### VII. Specification-First Workflow

All features MUST follow the SpecKit workflow: specification → clarification → planning → task breakdown → implementation. No implementation may begin before spec approval. User stories MUST be prioritized (P1, P2, P3) and independently testable. Each story MUST deliver standalone value as a potential MVP increment.

**Rationale**: Specification-first development prevents scope creep, ensures stakeholder alignment, and enables incremental delivery. Prioritized user stories allow early validation of core value propositions before investing in secondary features. Independent testability ensures each story can be demonstrated in isolation.

**Enforcement**:
- Required documents: `spec.md`, `plan.md`, `tasks.md` per feature
- Constitution check in `plan.md` before Phase 0 research
- User stories organized by priority with acceptance criteria
- Task breakdown grouped by user story in `tasks.md`
- Code review rejection for implementations without approved specs

## Development Standards

### Code Quality

- **Linting**: ESLint with Vue plugin, Prettier for formatting
- **Pre-commit hooks**: Lint, format, unit tests (fast tests only)
- **Code review**: Minimum one approval required, constitution compliance check
- **Documentation**: JSDoc comments for public APIs and complex business logic, README updates for new features
- **Vue conventions**: Composition API with `<script setup>`, single-file components (SFC)

### Performance Benchmarks

- **Parse time**: <10 seconds for 100MB binaries (Web Worker)
- **UI responsiveness**: <16ms frame time (60 FPS) during parsing
- **Treemap rendering**: <1 second for 10,000 nodes (ECharts canvas renderer)
- **Memory usage**: <500MB heap for 200MB binary (target: 2.5x file size)
- **Bundle size**: <500KB initial load (gzipped, excluding code-split chunks)

### Security Constraints

- **No eval()**: Forbidden except in dev tools or sandboxed contexts
- **CSP headers**: `default-src 'self'; worker-src 'self' blob:; script-src 'self'`
- **Dependency auditing**: `npm audit` must pass before production deployment
- **Input validation**: All binary headers validated before parsing (magic bytes, size checks)

## Governance

### Amendment Process

Constitution changes require:
1. Written proposal with rationale and impact analysis
2. Review by project maintainers (minimum 2 approvals)
3. 7-day comment period for stakeholder feedback
4. Update to all dependent templates (`plan-template.md`, `spec-template.md`, `tasks-template.md`)
5. Version increment per semantic versioning (see below)

### Versioning Policy

- **MAJOR**: Backward-incompatible principle removal/redefinition (e.g., removing Client-Side Privacy)
- **MINOR**: New principle added or materially expanded guidance (e.g., adding Security Principle VIII, technology stack changes)
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Compliance Review

All feature implementations must verify:
- [ ] Constitution check completed in `plan.md`
- [ ] No server-side processing or data transmission (Principle I)
- [ ] All parsers use Web Workers (Principle II)
- [ ] Contracts defined for new libraries (Principle III)
- [ ] Unit tests written before implementation (Principle IV)
- [ ] JSDoc annotations for complex functions (Principle V)
- [ ] Feature detection for required browser APIs (Principle VI)
- [ ] Approved spec and tasks before coding (Principle VII)

### Deviation Justification

Exceptions to principles require:
- Written justification in `plan.md` or `research.md`
- Technical rationale with alternatives considered
- Approval from two project maintainers
- Documentation in feature's `quickstart.md` or inline comments

**Version**: 1.1.0 | **Ratified**: 2025-11-09 | **Last Amended**: 2025-11-10
