# ADR-003: Local-First Storage

**Status:** Accepted  
**Date:** 2026-07-16

## Context

FOCUS must work offline and protect user privacy. Session data should persist across page reloads without requiring authentication.

## Decision

Primary storage is `localStorage` via a `Repository` interface:
- `createLocalStorageRepository()` — persistent, browser-only
- `createMemoryRepository()` — ephemeral, for testing

All data access goes through the repository abstraction, never directly to `localStorage`.

## Consequences

- ✅ Works fully offline
- ✅ No server dependency for core functionality
- ✅ User privacy preserved (data never leaves device by default)
- ❌ Storage limit (~5MB per origin)
- ❌ No cross-device sync (addressed in Phase 5: Supabase)
