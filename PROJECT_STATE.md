# PROJECT STATE — FOCUS v2.0

*Single Source of Truth. Read before any implementation.*

## Current Version
**v0.1.0-alpha** — Persistent Platform Core

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
| Phase 4: Persistent Platform Core | ✅ Complete | `v2.0-phase4` |
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
- **86 tests** across 15 test files
- Phase 2 Core: 29 (reaction, consistency, fatigue, scoring, measurement, repository, infrastructure)
- Phase 3: 8 (plugin 6 + app 2)
- Phase 4: 49 (session 10, device 5, events 10, calibration-cache 8, session-repository 10, history 6)

## Architecture Summary (Phase 4)
- **10 screens**: Home, Library, Intro, Calibration, Countdown, Game, Results, History, Settings, About
- **1 plugin**: Reaction Light Test
- **5 scientific engines**: Reaction, Consistency, Fatigue, Scoring, Measurement Pipeline
- **3 stores**: Navigation, Settings, Theme
- **6 new modules**: Session Lifecycle, Device Profile, Calibration Cache, Repository, History Service, Event Bus
- **2 repository implementations**: Memory (tests), LocalStorage (production)
- **ADR-008**: Repository Abstraction (dependency inversion for all storage)

## Last Commit
- **Hash:** pending
- **Message:** `feat(phase-4): persistent platform core`
- **Date:** 2026-07-17

## Last Tag
- `v2.0-phase4`

## Last Snapshot
- `focus-v2-phase4-snapshot-2026-07-17.tar.gz`

## Open Risks
- GitHub remote not configured
- No E2E tests
- System memory constraints affect build times

## Next Decision
Proceed to Phase 5: Supabase + Offline Sync.
