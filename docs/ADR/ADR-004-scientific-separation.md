# ADR-004: Scientific Constants Centralization

**Status:** Accepted  
**Date:** 2026-07-16

## Context

In v1, scientific equations, weights, and thresholds were scattered across multiple engine files. This made it impossible to audit, validate, or update scientific parameters without hunting through codebase.

## Decision

ALL scientific constants, equations, thresholds, and weights live in a single file:

```
src/core/scientific/constants.ts
```

This file contains:
- Calibration parameters
- Input lag estimates per platform
- Reaction time bounds
- Consistency thresholds
- Fatigue detection parameters
- Scoring weights and grade boundaries
- Version and validation status

No engine may define its own constants. All references import from this file.

## Consequences

- ✅ Single source of truth for scientific parameters
- ✅ Easy to audit for research papers
- ✅ Simple to update thresholds based on data
- ✅ Versioned alongside code
- ❌ Requires discipline to never hardcode constants elsewhere
