# Engineering Report — Phase 4: Persistent Platform Core

**Date:** 2026-07-17
**Tag:** `v2.0-phase4`

## Summary
Transformed the M1 alpha into a persistent scientific platform with 6 new engineering modules, ready for Supabase, Research Console, AI Coach, and Realtime Dashboard.

## Quality Gates
| Gate | Status |
|---|---|
| `pnpm lint` | ✅ Pass |
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` (86 tests) | ✅ Pass |
| `pnpm build` | ✅ Pass (218KB gzipped: 67KB) |

## Implemented Modules

### Module A — Persistent Session Repository
- `SessionRepository` interface with dependency inversion
- `createMemorySessionRepository()` — test implementation
- `createLocalStorageSessionRepository()` — production implementation
- Filter, sort, pagination, count support
- **ADR-008** documents the abstraction pattern

### Module B — Session Lifecycle
- 7 states: draft → running → paused → completed → archived/synced/failed
- Validated state machine with `canTransition()`
- Full session data model: calibrationId, pluginId, deviceId, measurements, scientificResults, metadata, timestamps
- `createSession()`, `transitionSession()`, `updateSessionMeasurements()`

### Module C — Device Profile
- Collects: browser, OS, platform, screen, pixelRatio, touch, pointerType, CPU cores, memory, language, timezone, UA
- Cached per session, resettable
- Device ID derived from fingerprint (no PII)

### Module D — Calibration Persistence
- `CalibrationCache` with localStorage and in-memory implementations
- `isCalibrationValid()` with configurable policy:
  - 30-day expiration
  - Confidence threshold (0.7)
  - Recalibrate on device/browser/refresh-rate change

### Module E — Measurement History
- `HistoryService` with stats, trends, search, export
- Weekly/monthly/daily trend calculation
- Median, average, best/worst scores
- JSON export preparation

### Module F — Repository Events (Event Bus)
- `EventPublisher` with typed events: session_created, session_completed, calibration_updated, etc.
- Subscribe/unsubscribe, subscribeAll
- Event history with configurable limit
- Global publisher singleton
- Foundation for Supabase sync, Research Console, AI Coach

## Files Added
- `src/core/session/index.ts` — Session lifecycle
- `src/core/device/index.ts` — Device profile collection
- `src/core/events/index.ts` — Event bus
- `src/core/repository/types.ts` — Repository interface
- `src/core/repository/memory.ts` — Memory implementation
- `src/core/repository/local-storage.ts` — LocalStorage implementation
- `src/core/calibration-cache/index.ts` — Calibration cache
- `src/core/history/index.ts` — History service
- `docs/adr/ADR-008-REPOSITORY-ABSTRACTION.md` — ADR
- `docs/reports/phase-4-engineering-report.md` — This report
- 6 test files (39 new tests)

## Files Modified
- `src/core/index.ts` — Extended barrel exports
- `src/core/repository/index.ts` — Updated exports
- `package.json` — Fixed lint script for ESLint 9 flat config
- `vitest.config.ts` — Added pool: forks (memory optimization)

## Test Count
- **86 tests** across 15 test files (was 37)
- New: session (10), device (5), events (10), calibration-cache (8), session-repository (10), history (6)

## Scientific Rules
- No changes to any scientific engine
- All 29 existing core tests pass unchanged

## Known Limitations
- No E2E tests
- Supabase repository not yet implemented (Phase 5)
- i18n not implemented
- Session state still in-memory React state (needs Context integration)

## Migration Notes
- New localStorage key: `focus_sessions_v2` (separate from old `focus_sessions`)
- New localStorage key: `focus_calibration_cache`
- Old sessions from Phase 3 are not automatically migrated
