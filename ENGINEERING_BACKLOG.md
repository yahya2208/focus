# ENGINEERING BACKLOG — FOCUS v2.0

## Current Phase
Phase 3.5: Alpha Review (M1) ✅ IN PROGRESS

## Completed Phases
- [x] Phase -1: Engineering Governance (v2.0-phase-minus1)
- [x] Phase -0.5: Architecture Bible Lock (v2.0-phase-minus0.5)
- [x] Phase 0: Architecture Foundation (v2.0-phase-0)
- [x] Phase 1: Design System (v2.0-phase-1)
- [x] Phase 2: Scientific Core (v2.0-phase-2)
- [x] Phase 3: Plugin Architecture + Game01 (v2.0-phase-3)

## Blockers
- GitHub remote not configured for focus-v2 repo
- No GitHub token available for releases

## Known Issues (Alpha)
- No persistence layer beyond localStorage (repository exists but sessions not persisted automatically)
- Single game mode (Reaction Light Test only)
- No PWA/service worker
- No i18n implementation (settings exist, strings hardcoded English)
- No E2E tests
- GameScreen manages its own timing separately from plugin (plugin is synchronous state machine)
- ThemeProvider needs `window.matchMedia` mock in tests

## Technical Debt
- GameScreen duplicate timing logic (could delegate to plugin timer)
- SettingsScreen hardcoded language options ('tr', 'ar' not implemented)
- useSettings renamed to .tsx but original .ts deleted (git tracks cleanly)

## Next Phase
Phase 4: Data Persistence + Session Management

## Nice-to-Have
- AGENTS.md for AI-assisted development
- Performance budgets in CI
- Coverage thresholds in vitest

## Scientific Validation Tasks
- Phase 7.5: Compare Focus Score with real alpha/beta data
- Phase 7.5: Validate Fatigue Score
- Phase 7.5: Validate Consistency Score
- Classify each indicator: Scientific / Experimental / Informational

## Research Tasks
- Literature review on reaction time measurement validity
- Cross-device calibration validation study
- Fatigue detection accuracy benchmark

## Release Tasks
- Phase 12: Release Candidate testing
- v1.0: Final QA pass
- v1.0: Play Store submission assets
- v1.0: PWA manifest + service worker
