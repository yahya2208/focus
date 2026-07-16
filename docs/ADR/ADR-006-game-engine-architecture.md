# ADR-006: Game Engine Architecture (Plugin Model)

**Status:** Accepted  
**Date:** 2026-07-16

## Context

FOCUS will have multiple cognitive games over time. Each game has different mechanics but shares the same measurement pipeline. Games should not directly handle measurement logic.

## Decision

Games are **plugins** that emit events only:

```
Game Plugin
  → emits: STIMULUS_SHOWN, INPUT_RECEIVED, ROUND_COMPLETE
  → knows nothing about: calibration, correction, scoring

Measurement Pipeline
  → receives events
  → applies calibration correction
  → feeds engines (Reaction, Consistency, Fatigue)
  → produces Score
```

The game plugin is a React component that:
1. Receives calibration profile as props
2. Emits timing events to the pipeline
3. Renders its own UI
4. Reports completion

## Consequences

- ✅ New games can be added without touching measurement code
- ✅ Games are independently testable
- ✅ Measurement pipeline is game-agnostic
- ❌ Slightly more complex event wiring
