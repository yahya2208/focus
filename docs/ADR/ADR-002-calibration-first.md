# ADR-002: Calibration-First Measurement

**Status:** Accepted  
**Date:** 2026-07-16

## Context

Reaction time measurements are meaningless without accounting for hardware variability (display lag, input lag, refresh rate). Different devices produce wildly different raw RT values.

## Decision

Every measurement session MUST begin with a calibration phase:
1. Detect display refresh rate via `requestAnimationFrame`
2. Calculate display lag from refresh rate
3. Estimate platform-aware input lag (Android/iOS/Desktop)
4. Compute a dynamic confidence score

The calibration profile is passed to ALL subsequent engines.

## Consequences

- ✅ Cross-device comparable measurements
- ✅ Scientific validity of results
- ❌ Extra ~10 seconds before gameplay
- ❌ Users must complete calibration (cannot skip)
