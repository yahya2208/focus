# ADR-008 — Repository Abstraction

## Status
Accepted

## Date
2026-07-17

## Context
FOCUS v2.0 needs to persist sessions, calibration data, and device profiles. The application currently uses in-memory storage and localStorage. Future phases will add Supabase (Phase 5) and potentially other storage backends. Screens and scientific engines must not know which storage backend is active.

## Decision
All data sources (Memory, LocalStorage, Supabase, or any future backend) must implement the same repository interface. No screen, engine, or UI component may depend on a concrete storage implementation.

### Architecture

```
Screen / Engine
     ↓ (depends on interface only)
Repository Interface (types.ts)
     ↓
┌─────────────┬──────────────────┬─────────────────┐
│ Memory Repo │ LocalStorage Repo│ Supabase Repo    │
│ (tests)     │ (default)        │ (Phase 5)        │
└─────────────┴──────────────────┴─────────────────┘
```

### Rules
1. **Dependency Inversion**: High-level modules depend on abstractions, not concretions
2. **Interface Segregation**: Each repository has a focused interface (Session, Calibration, Device)
3. **UI Agnosticism**: Screens receive repository via constructor/context, never import concrete implementations
4. **Testability**: All repositories have memory-based implementations for testing
5. **Event Integration**: Repository operations publish events via EventPublisher without changing caller code

## Consequences
- Adding Supabase (Phase 5) requires only: implementing the interface + registering the provider
- No screen changes needed for storage migration
- All storage logic is testable without localStorage or network
- Event bus enables reactive features (Research Console, AI Coach) without modifying storage code

## Related
- ADR-001: Architecture Decisions
- Phase 4: Persistent Platform Core
- Phase 5: Supabase + Offline Sync
