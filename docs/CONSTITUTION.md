# Engineering Constitution — FOCUS v2.0

*This document is immutable. Changes require ADR-008+.*

## Article 1: Phased Execution
No phase begins until the previous phase is fully closed with all 5 quality gates passed, git tag created, and snapshot archived.

## Article 2: Test-First Development
Every phase starts with writing and ends with testing. No code ships without tests.

## Article 3: Quality Gates are Non-Negotiable
Every phase MUST pass:
1. `pnpm lint` — zero warnings
2. `pnpm typecheck` — zero errors
3. `pnpm test` — all tests pass
4. `pnpm build` — build succeeds
5. Engineering Report — documented and approved

## Article 4: Recovery Integrity
ERR-001 and RR-002 are enforced at all times. Four independent backup copies exist after every significant commit.

## Article 5: Scientific Integrity
Scientific validity always overrides entertainment. FOCUS is a measurement platform, not a game.

## Article 6: Centralized Science
All scientific constants, equations, thresholds, and weights live in ONE file: `src/core/scientific/constants.ts`. Duplicated equations are engineering defects.

## Article 7: Calibration-First
Every measurement session begins with calibration. No exceptions. No skipping.

## Article 8: Plugin Isolation
Games are plugins that emit events only. They know nothing about measurement, correction, or scoring.

## Article 9: Engine Isolation
No engine imports from another engine. The MeasurementPipeline orchestrates them in sequence.

## Article 10: Accessibility First
Every UI component must support keyboard navigation, ARIA labels, and screen readers. Reduced motion is respected.

## Article 11: Privacy by Default
All data stays on-device by default. Server sync is opt-in only (Phase 5+).

## Article 12: Documentation Before Code
Architecture decisions are frozen in ADRs before implementation begins. No silent modifications.

## Article 13: Continuous Recovery
After every phase: Push → Tag → Archive → External Backup. No exceptions.
