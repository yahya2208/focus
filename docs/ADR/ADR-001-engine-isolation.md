# ADR-001: Engine Isolation

**Status:** Accepted  
**Date:** 2026-07-16

## Context

FOCUS uses a layered engine architecture (Reaction, Consistency, Fatigue, Scoring). Without enforced isolation, engines could develop circular dependencies, making testing and maintenance difficult.

## Decision

Each engine is an independent module with:
- Its own `interfaces.ts` (input/output types)
- Its own `index.ts` (factory function)
- No direct imports from other engines

Engines communicate only through the `MeasurementPipeline` which orchestrates them in sequence.

## Consequences

- ✅ Each engine testable in isolation
- ✅ Engines can be replaced or upgraded independently
- ✅ Clear data flow: Calibration → Reaction → Consistency → Fatigue → Scoring
- ❌ Slightly more boilerplate for pipeline orchestration
