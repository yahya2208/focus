# PROJECT STATE — FOCUS v2.0

*Single Source of Truth. Read before any implementation.*

## Current Version
**v0.1.0-alpha** — Playable Alpha (M1)

## Progress
| Phase | Status | Tag |
|---|---|---|
| Phase -1: Engineering Governance | ✅ Complete | `v2.0-phase-minus1` |
| Phase -0.5: Architecture Bible Lock | ✅ Complete | `v2.0-phase-minus0.5` |
| Phase 0: Architecture Foundation | ✅ Complete | `v2.0-phase-0` |
| Phase 1: Design System | ✅ Complete | `v2.0-phase-1` |
| Phase 2: Scientific Core | ✅ Complete | `v2.0-phase-2` |
| Phase 3: Plugin Architecture + Game01 | ✅ Complete | `v2.0-phase-3` |
| Phase 3.5: Alpha Review (M1) | ✅ Complete | `v2.0-m1-alpha` |
| Phase 4: Data Persistence + Session Management | ⏳ Pending | — |
| Phase 5: Supabase + Offline Sync | ⏳ Pending | — |
| Phase 6: QR Experience | ⏳ Pending | — |
| Phase 7: Research Console (M2) | ⏳ Pending | — |
| Phase 7.5: Scientific Validation | ⏳ Pending | — |
| Phase 8: AI Coach | ⏳ Pending | — |
| Phase 9: Achievements | ⏳ Pending | — |
| Phase 10: Android (M3) | ⏳ Pending | — |
| Phase 11: PWA | ⏳ Pending | — |
| Phase 12: Release Candidate (M4) | ⏳ Pending | — |
| v1.0 (M5) | ⏳ Pending | — |

## Milestones
| Milestone | Phase | Status |
|---|---|---|
| M1 — Playable Alpha | Phase 3.5 | ✅ |
| M2 — Research Ready | Phase 7 | ⏳ |
| M3 — Mobile Ready | Phase 10 | ⏳ |
| M4 — Production Ready | Phase 12 | ⏳ |
| M5 — Release | v1.0 | ⏳ |

## Test Coverage
- **37 tests** across 9 test files
- Core engines: reaction (6), consistency (6), fatigue (4), scoring (4)
- Measurement pipeline: 3
- Repository: 4
- Plugin: 6
- App render: 2
- Infrastructure: 2

## Architecture Summary
- **10 screens**: Home, Library, Intro, Calibration, Countdown, Game, Results, History, Settings, About
- **1 plugin**: Reaction Light Test (synchronous state machine)
- **5 engines**: Reaction, Consistency, Fatigue, Scoring, Measurement Pipeline
- **3 stores**: Navigation (AppState), Settings (localStorage), Theme (context)
- **Shared components**: Button, Card, ProgressRing, ErrorBoundary

## Last Commit
- **Hash:** 2787958
- **Message:** `feat(phase-3): plugin architecture, all screens, app shell`
- **Date:** 2026-07-17

## Last Tag
- `v2.0-phase-3`

## Last Snapshot
- `focus-v2-phase-3-snapshot-2026-07-17.tar.gz` (215KB)

## Open Risks
- GitHub remote not configured
- No E2E tests
- localStorage-only persistence

## Next Decision
Proceed to Phase 4: Data Persistence + Session Management.
