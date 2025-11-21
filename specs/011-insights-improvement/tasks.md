# Tasks: Comprehensive Insights Improvement

**Input**: Design documents from `/specs/011-insights-improvement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: OPTIONAL - This feature does not explicitly request TDD, so test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for new insights feature

- [X] T001 Create image compression worker directory structure in src/lib/analysis/image-compression/
- [X] T002 [P] Create contracts directory structure in specs/011-insights-improvement/contracts/
- [X] T003 [P] Update .gitignore to exclude large test fixtures in tests/fixtures/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create compression-worker.js with Canvas API integration in src/workers/compression-worker.js
- [X] T005 Create useCompressionWorker composable with Comlink integration in src/composables/useCompressionWorker.js
- [X] T006 Enhance AnalysisContext type definition with imageFiles, fontFiles, compressionCache properties in src/types/analysis.js
- [X] T007 Enhance insight-engine.js to prepare indexed context (imageFiles, fontFiles) in src/lib/analysis/insight-engine.js
- [X] T008 Create font analysis utility with heuristic-based detection in src/lib/utils/font-parser.js
- [X] T009 Create ImageComparisonPreview.vue component for side-by-side previews in src/components/insights/ImageComparisonPreview.vue

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Accurate Image Optimization with Real Testing (Priority: P1) 🎯 MVP

**Goal**: Developers upload IPA/APK files containing images and receive precise optimization recommendations based on actual compression testing, not estimates.

**Independent Test**: Upload an app with PNG/JPEG images and verify that the tool performs actual compression tests (85% lossy, WebP for non-Safari) and shows side-by-side comparisons with exact byte savings.

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement compressJPEG function with 85% quality in src/lib/analysis/image-compression/compressor.js
- [X] T011 [P] [US1] Implement convertToWebP function with Safari fallback in src/lib/analysis/image-compression/compressor.js
- [X] T012 [P] [US1] Implement supportsWebP browser detection utility in src/lib/analysis/image-compression/compressor.js
- [X] T013 [US1] Implement createPreviewPair function for URL.createObjectURL previews in src/lib/analysis/image-compression/preview-generator.js
- [X] T014 [US1] Implement R011 image optimization rule with 4KB minimum threshold in src/lib/analysis/insight-rules.js
- [X] T015 [US1] Integrate R011 with compression worker using Comlink in src/lib/analysis/insight-rules.js
- [X] T016 [US1] Add R011 to allInsightRules export array in src/lib/analysis/insight-rules.js
- [X] T017 [US1] Update InsightCard.vue to display image compression metadata and previews in src/components/insights/InsightCard.vue
- [X] T018 [US1] Add progress indicators for compression testing in InsightCard.vue in src/components/insights/InsightCard.vue

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Critical Security Vulnerability Detection (Priority: P1)

**Goal**: Developers uploading Android apps receive immediate HIGH severity warnings about exposed Firebase API keys that could leak sensitive remote config data, feature flags, and secrets.

**Independent Test**: Upload an Android APK containing google-services.json and verify that a HIGH severity security warning is displayed with the exact exploit method and fix instructions.

### Implementation for User Story 2

- [X] T019 [US2] Enhance R010 Firebase rule to detect google-services.json in src/lib/analysis/insight-rules.js
- [X] T020 [US2] Update R010 severity to HIGH when google-services.json detected in src/lib/analysis/insight-rules.js
- [X] T021 [US2] Add exact exploit method explanation to R010 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T022 [US2] Add Application Restrictions configuration with 4 keystore types to R010 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T023 [US2] Update R010 category from 'optimization' to 'security' in src/lib/analysis/insight-rules.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Precise Duplicate File Detection (Priority: P1)

**Goal**: Developers receive actionable insights about duplicate files with platform-specific thresholds, avoiding false positives from tiny duplicates.

**Independent Test**: Upload an app with various duplicate files (some >512 bytes, some <512 bytes) and verify that only Android duplicates saving >512 bytes are flagged.

### Implementation for User Story 3

- [X] T024 [US3] Update R001 duplicate rule to apply 512-byte minimum threshold for Android in src/lib/analysis/insight-rules.js
- [X] T025 [US3] Ensure R001 has no minimum threshold for iOS duplicates in src/lib/analysis/insight-rules.js
- [X] T026 [US3] Update R001 fix suggestion to be platform-specific in src/lib/analysis/insight-rules.js
- [X] T027 [US3] Add platform detection logic to DuplicateGroup creation in src/lib/analysis/insight-engine.js

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 6: User Story 4 - iOS Alternate Icon Optimization (Priority: P1)

**Goal**: Developers uploading iOS apps with alternate icons receive specific guidance on reducing icon file sizes by downscaling to 180x180 resolution before upscaling to 1024x1024.

**Independent Test**: Upload an iOS app with alternate icons and verify that the tool detects icons with >180x180 resolution detail and provides the downscale → upscale workflow recommendation.

### Implementation for User Story 4

- [X] T028 [P] [US4] Create analyzeIOSIcons function to parse Info.plist for primary vs alternate icons in src/lib/parsers/ios/ipa-parser.js
- [X] T029 [P] [US4] Create detectImageDetailLevel function using Canvas API in src/lib/analysis/image-compression/compressor.js
- [X] T030 [US4] Implement R013 iOS alternate icon optimization rule in src/lib/analysis/insight-rules.js
- [X] T031 [US4] Add R013 to allInsightRules export array in src/lib/analysis/insight-rules.js
- [X] T032 [US4] Add automatic optimization preview generation for alternate icons in R013 in src/lib/analysis/insight-rules.js

**Checkpoint**: All P1 user stories complete - MVP ready for deployment

---

## Phase 7: User Story 5 - iOS Localization String Minification (Priority: P2)

**Goal**: Developers uploading iOS apps with localized strings receive insights about binary plist format inefficiencies and translator comment bloat, with automated scripts to fix.

**Independent Test**: Upload an iOS app with .strings files and verify that the tool detects binary format and/or comments, calculates savings, and provides the Python script and Xcode setting.

### Implementation for User Story 5

- [X] T033 [P] [US5] Create analyzeLocalizationFiles function to detect binary plist format in src/lib/parsers/ios/plist-parser.js
- [X] T034 [P] [US5] Create countCommentBytes function for text format .strings files in src/lib/parsers/ios/plist-parser.js
- [X] T035 [US5] Implement R014 iOS localization minification rule in src/lib/analysis/insight-rules.js
- [X] T036 [US5] Add Python script from Emerge docs to R014 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T037 [US5] Add STRINGS_FILE_OUTPUT_ENCODING recommendation to R014 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T038 [US5] Add SmallStrings library option to R014 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T039 [US5] Add R014 to allInsightRules export array in src/lib/analysis/insight-rules.js

**Checkpoint**: User Story 5 independently functional

---

## Phase 8: User Story 6 - iOS Unnecessary File Detection (Priority: P2)

**Goal**: Developers uploading iOS apps receive warnings about accidentally included files (README, scripts, provisioning profiles, build configs) that don't belong in the production bundle.

**Independent Test**: Upload an iOS app with unnecessary files and verify that each type is detected with specific fix instructions (uncheck target membership).

### Implementation for User Story 6

- [X] T040 [US6] Implement R015 unnecessary files rule with documentation pattern detection in src/lib/analysis/insight-rules.js
- [X] T041 [US6] Add shell script pattern detection to R015 in src/lib/analysis/insight-rules.js
- [X] T042 [US6] Add provisioning profile pattern detection to R015 in src/lib/analysis/insight-rules.js
- [X] T043 [US6] Add build config pattern detection to R015 in src/lib/analysis/insight-rules.js
- [X] T044 [US6] Add Swift module and symbol map pattern detection to R015 in src/lib/analysis/insight-rules.js
- [X] T045 [US6] Add header file pattern detection to R015 in src/lib/analysis/insight-rules.js
- [X] T046 [US6] Add target membership fix instructions to R015 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T047 [US6] Add R015 to allInsightRules export array in src/lib/analysis/insight-rules.js

**Checkpoint**: User Story 6 independently functional

---

## Phase 9: User Story 7 - Enhanced Binary Symbol Stripping Guidance (Priority: P2)

**Goal**: Developers uploading iOS apps with debug symbols receive comprehensive guidance including the exact strip command, complete build phase script, and dSYM upload warnings.

**Independent Test**: Upload an iOS app with symbols and verify that the insight provides the exact strip command, full build script, flag explanations, and crash reporting warnings.

### Implementation for User Story 7

- [X] T048 [US7] Enhance R003 debug symbols rule with exact strip command in src/lib/analysis/insight-rules.js
- [X] T049 [US7] Add complete 35+ line build phase script from Emerge docs to R003 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T050 [US7] Add flag explanations (T=Swift symbols, rSx=debug/local) to R003 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T051 [US7] Add Input File configuration for dSYM dependency to R003 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T052 [US7] Add dSYM upload warning for crash reporting to R003 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T053 [US7] Add Apple-signed framework check logic to R003 fix suggestion in src/lib/analysis/insight-rules.js

**Checkpoint**: All P2 user stories complete

---

## Phase 10: User Story 8 - Unused Font Detection (Priority: P3)

**Goal**: Developers uploading apps with font files receive insights about fonts that aren't referenced in Info.plist or asset catalogs, and fonts with excessive character sets.

**Independent Test**: Upload an app with font files (.ttf, .otf) and verify that the tool cross-references with Info.plist UIAppFonts and asset catalog references.

### Implementation for User Story 8

- [X] T054 [P] [US8] Implement analyzeFontFile function with CJK heuristics in src/lib/utils/font-parser.js
- [X] T055 [P] [US8] Create CJK name pattern regex in src/lib/utils/font-parser.js
- [X] T056 [US8] Implement R016 unused fonts rule with Info.plist cross-reference in src/lib/analysis/insight-rules.js
- [X] T057 [US8] Add excessive character set detection to R016 in src/lib/analysis/insight-rules.js
- [X] T058 [US8] Add font subsetting tool recommendations to R016 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T059 [US8] Add R016 to allInsightRules export array in src/lib/analysis/insight-rules.js

**Checkpoint**: User Story 8 independently functional

---

## Phase 11: User Story 9 - Video and Animation Optimization (Priority: P3)

**Goal**: Developers uploading apps with video files or animations receive recommendations about compression, codec efficiency, and converting GIFs to video format.

**Independent Test**: Upload an app with video files (.mov, .mp4) or GIF animations and verify that codec efficiency and conversion recommendations are provided.

### Implementation for User Story 9

- [X] T060 [US9] Implement R017 video optimization rule with codec detection in src/lib/analysis/insight-rules.js
- [X] T061 [US9] Add Lottie JSON minification detection to R017 in src/lib/analysis/insight-rules.js
- [X] T062 [US9] Add GIF to video conversion recommendation with 90% savings estimate to R017 in src/lib/analysis/insight-rules.js
- [X] T063 [US9] Add specific compression settings and tools to R017 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T064 [US9] Add R017 to allInsightRules export array in src/lib/analysis/insight-rules.js

**Checkpoint**: User Story 9 independently functional

---

## Phase 12: User Story 10 - Framework Duplication Detection (Priority: P3)

**Goal**: Developers uploading apps with extensions or modules receive insights about framework duplication across app and extensions, duplicate Swift runtime, and multiple library versions.

**Independent Test**: Upload an app with extensions and verify that the tool detects shared frameworks in both app and extension bundles.

### Implementation for User Story 10

- [X] T065 [P] [US10] Create detectAppExtensions function in src/lib/parsers/ios/framework-parser.js
- [X] T066 [P] [US10] Create findDuplicateFrameworks function in src/lib/parsers/ios/framework-parser.js
- [X] T067 [US10] Implement R018 framework duplication rule in src/lib/analysis/insight-rules.js
- [X] T068 [US10] Add duplicate Swift runtime detection to R018 in src/lib/analysis/insight-rules.js
- [X] T069 [US10] Add multiple library version detection to R018 in src/lib/analysis/insight-rules.js
- [X] T070 [US10] Add shared framework extraction recommendation to R018 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T071 [US10] Add R018 to allInsightRules export array in src/lib/analysis/insight-rules.js

**Checkpoint**: User Story 10 independently functional

---

## Phase 13: User Story 11 - Advanced Android Optimizations (Priority: P3)

**Goal**: Developers uploading Android apps receive insights about ProGuard/R8 configuration, resource shrinking opportunities, and build optimization settings.

**Independent Test**: Upload an Android APK and verify that the tool detects ProGuard/R8 status, optimization level, and provides specific Gradle configuration recommendations.

### Implementation for User Story 11

- [X] T072 [P] [US11] Create detectProGuardR8Status function with obfuscation heuristics in src/lib/parsers/android/apk-parser.js
- [X] T073 [P] [US11] Create detectOptimizationLevel function in src/lib/parsers/android/apk-parser.js
- [X] T074 [US11] Implement R019 Android optimizations rule in src/lib/analysis/insight-rules.js
- [X] T075 [US11] Add ProGuard/R8 disabled detection as HIGH severity to R019 in src/lib/analysis/insight-rules.js
- [X] T076 [US11] Add aggressive shrinking settings with Gradle snippets to R019 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T077 [US11] Add resource shrinking recommendation with Gradle snippets to R019 fix suggestion in src/lib/analysis/insight-rules.js
- [X] T078 [US11] Add R019 to allInsightRules export array in src/lib/analysis/insight-rules.js

**Checkpoint**: All user stories complete

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T079 [P] Add memory cleanup for URL.revokeObjectURL on component unmount in src/components/insights/ImageComparisonPreview.vue
- [X] T080 [P] Add error handling for compression worker failures in src/composables/useCompressionWorker.js
- [X] T081 [P] Add progress tracking for batch image compression in src/lib/analysis/insight-rules.js
- [X] T082 Update CLAUDE.md active technologies list with new libraries in /Users/magdoub/Documents/projects/sizeanalyzer/CLAUDE.md
- [X] T083 Update README.md with new insights capabilities in /Users/magdoub/Documents/projects/sizeanalyzer/README.md
- [X] T084 Add JSDoc type annotations for complex functions in src/lib/analysis/image-compression/compressor.js
- [X] T085 Optimize insight-rules.js for readability and maintainability in src/lib/analysis/insight-rules.js
- [X] T086 Add browser compatibility detection and warnings for WebP in src/lib/analysis/image-compression/compressor.js

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-13)**: All depend on Foundational phase completion
  - P1 stories (US1-US4): Can proceed in parallel after Foundational
  - P2 stories (US5-US7): Can proceed in parallel after Foundational
  - P3 stories (US8-US11): Can proceed in parallel after Foundational
- **Polish (Phase 14)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Extends existing R010 rule
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Extends existing R001 rule
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 7 (P2)**: Can start after Foundational (Phase 2) - Extends existing R003 rule
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 9 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 10 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 11 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Models/utilities before rules
- Rules before integration
- Core implementation before fix suggestions
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks NOT marked [P] run sequentially (worker depends on types)
- Once Foundational phase completes, ALL user stories can start in parallel (if team capacity allows)
- Within each story, tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all parallelizable tasks for User Story 1 together:
Task T010: "Implement compressJPEG function with 85% quality in src/lib/analysis/image-compression/compressor.js"
Task T011: "Implement convertToWebP function with Safari fallback in src/lib/analysis/image-compression/compressor.js"
Task T012: "Implement supportsWebP browser detection utility in src/lib/analysis/image-compression/compressor.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1-4 Only - All P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Image Optimization)
4. Complete Phase 4: User Story 2 (Firebase Security)
5. Complete Phase 5: User Story 3 (Duplicate Detection)
6. Complete Phase 6: User Story 4 (Icon Optimization)
7. **STOP and VALIDATE**: Test all P1 stories independently
8. Deploy/demo MVP with 4 major insights

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo (MVP!)
6. Add P2 stories (US5-US7) → Test independently → Deploy/Demo
7. Add P3 stories (US8-US11) → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 5 + User Story 8
   - Developer B: User Story 2 + User Story 6 + User Story 9
   - Developer C: User Story 3 + User Story 7 + User Story 10
   - Developer D: User Story 4 + User Story 11
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Research.md confirms: HEIC encoding NOT viable (browser limitation), using WebP + JPEG instead
- Research.md confirms: Font parsing uses heuristics (no library needed), 90% accuracy, zero bundle overhead
- Total of 86 tasks across 11 user stories (4 P1, 3 P2, 4 P3)
- Estimated MVP scope: 32 tasks (Setup + Foundational + US1-US4)
- Estimated total completion: All 86 tasks for full feature set

---

## Summary

**Total Tasks**: 86
**P1 Tasks** (US1-US4): 32 tasks (MVP)
**P2 Tasks** (US5-US7): 20 tasks
**P3 Tasks** (US8-US11): 28 tasks
**Polish Tasks**: 6 tasks

**Parallel Opportunities**:
- Setup: 2 tasks in parallel
- Foundational: Limited (sequential dependencies)
- User Stories: All 11 stories can run in parallel (66 tasks total)
- Polish: 4 tasks in parallel

**Suggested MVP Scope**: Complete Phase 1-6 (32 tasks total)
- Delivers 4 high-impact P1 insights
- Foundation for all other insights
- Can be deployed and validated independently
- Estimated effort: 40-60 hours for MVP

**Format Validation**: ✅ All tasks follow checklist format with checkbox, ID, story labels (where applicable), and exact file paths
