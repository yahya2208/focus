# PROJECT STATE — FOCUS v2.0

*Single Source of Truth. Read before any implementation.*

## Current Version
**v0.1.0-alpha** — AI Coach

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
| Phase 5: Supabase Platform | ✅ Complete | `v2.0-phase5` |
| Phase 6: QR Experience & Viral Acquisition | ✅ Complete | `v2.0-phase6` |
| Phase 7: Research Console (M2) | ✅ Complete | `v2.0-phase7` |
| Phase 7.5: Scientific Validation | ⏳ Pending | — |
| Phase 8: AI Coach & Cognitive Intelligence | ✅ Complete | `v2.0-phase8` |
| Phase 9: Achievements | ⏳ Pending | — |
| Phase 10: Android (M3) | ⏳ Pending | — |
| Phase 11: PWA | ⏳ Pending | — |
| Phase 12: Release Candidate (M4) | ⏳ Pending | — |
| v1.0 (M5) | ⏳ Pending | — |

## Milestones
| Milestone | Phase | Status |
|---|---|---|
| M1 — Playable Alpha | Phase 3.5 | ✅ |
| M2 — Research Ready | Phase 7 | ✅ |
| M3 — Mobile Ready | Phase 10 | ⏳ |
| M4 — Production Ready | Phase 12 | ⏳ |
| M5 — Release | v1.0 | ⏳ |

## Test Coverage
- **541 tests** across 43 test files
- Phase 2 Core: 29 (reaction, consistency, fatigue, scoring, measurement, repository, infrastructure)
- Phase 3: 8 (plugin 6 + app 2)
- Phase 4: 49 (session 10, device 5, events 10, calibration-cache 8, session-repository 10, history 6)
- Phase 5: 40 (auth 10, offline 19, telemetry 9, supabase-client 2)
- Phase 6: 89 (qr-generate 14, campaign 22, share 12, deeplink 12, referral 19, consent 11, device fix 1)
- Phase 7: 114 (permissions 17, filters 17, charts 17, cohort 32, export 14, api 17)
- Phase 8: 212 (confidence 19, explainability 16, analysis 23, goals 23, personality 28, passport 30, trends 17, recommendations 14, insights 11, comparative 17, learning 10, coach-screen 4)

## Architecture Summary (Phase 8)
- **15 screens**: Home, Library, Intro, Calibration, Countdown, Game, Results, History, Settings, About, Landing, Share, Register, Research Console, AI Coach
- **1 plugin**: Reaction Light Test
- **5 scientific engines**: Reaction, Consistency, Fatigue, Scoring, Measurement Pipeline
- **12 core modules**: Session, Device, Calibration Cache, Repository, History, Event Bus, Auth, Offline, Telemetry, QR/Campaign/Referral/Consent, Research (Permissions, Filters, Charts, Cohort, Export, API), AI Coach (16 modules)
- **27 telemetry event types** covering full user journey
- **6 share platforms**: WhatsApp, Telegram, X, Facebook, Email, Copy
- **9 campaign tracking dimensions**: campaign, location, school, company, event, version, language, source, referrer
- **Referral engine** with unique codes, scan tracking, conversion rates
- **Database schema**: 5 tables with RLS (users, sessions, devices, calibrations, surveys)
- **Research Console**: 9 dashboards (Overview, Scientific, Users, Sessions, Devices, Surveys, Campaigns, Live, System)
- **Role-based permissions**: 4 roles (super_admin, research_admin, analyst, viewer) with granular resource access
- **Cohort Builder**: 12 filter operators with AND/OR logic, save/load/filter
- **Export Engine**: CSV, JSON, scientific, aggregated, anonymous with consent-respecting redaction
- **Research API**: 9 data providers, live event feed, system health monitoring
- **AI Coach Engine**: 16 modules — confidence, explainability, analysis, trends, goals, recommendations, insights, research-tagging, reports, comparative, learning, personality, passport, engine
- **Cognitive Passport**: Longitudinal profile with reliability index, milestones, strengths/improvements
- **Coach Screen**: 5-tab UI (Overview, Trends, Goals, Insights, Passport) with report export
- **Self-comparison analytics**: Never cross-user (privacy-first)
- **Personality constraints**: Coach output validated against forbidden patterns
- **ADR-008**: Repository Abstraction

## Last Commit
- **Hash:** TBD (Phase 8 commit pending)
- **Message:** `feat(phase-8): ai coach cognitive intelligence layer`
- **Date:** 2026-07-17

## Last Tag
- `v2.0-phase8`

## Last Snapshot
- TBD (Phase 8 snapshot pending)

## Open Risks
- GitHub remote not configured
- No E2E tests
- System memory constraints affect build times

## Next Decision
Proceed to Phase 7.5 (Scientific Validation) or Phase 9 (Achievements).
