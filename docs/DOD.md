# Definition of Done (DoD) — FOCUS v2.0

*A feature is complete ONLY when ALL of the following are true.*

## Mandatory Gates

### Code Quality
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm typecheck` passes with zero errors
- [ ] No `any` types introduced
- [ ] No `@ts-ignore` without ADR

### Testing
- [ ] `pnpm test` passes — all tests green
- [ ] New code has corresponding tests
- [ ] Edge cases covered (empty state, error state, loading state)
- [ ] No snapshot tests for scientific logic

### Build
- [ ] `pnpm build` succeeds
- [ ] Bundle size within budget (< 200KB gzip core)
- [ ] No new warnings in build output

### Documentation
- [ ] Engineering Report completed
- [ ] ADR created (if architectural decision)
- [ ] CHANGELOG.md updated
- [ ] Code comments on complex logic (no obvious comments)

### Accessibility
- [ ] Keyboard navigation works
- [ ] ARIA labels present on interactive elements
- [ ] Screen reader compatible
- [ ] Reduced motion respected

### Scientific Integrity (if applicable)
- [ ] No hardcoded constants — uses `scientific/constants.ts`
- [ ] Calibration integration verified
- [ ] Measurement pipeline unaffected (or ADR created)
- [ ] Confidence score properly propagated

### Git & Recovery
- [ ] Git commit with conventional message
- [ ] Git tag created (if phase completion)
- [ ] Compressed archive created (if phase completion)
- [ ] External backup noted (if phase completion)

### Review
- [ ] Self-review completed
- [ ] No dead code
- [ ] No commented-out code
- [ ] No TODO without issue reference
