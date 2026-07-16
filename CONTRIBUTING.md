# Contributing to FOCUS v2

Thank you for your interest in contributing to FOCUS.

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start dev server: `pnpm dev`

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run quality gates before committing:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
5. Push and create a Pull Request

## Commit Convention

```
feat: add new cognitive game
fix: correct calibration confidence calculation
docs: update ADR-004
test: add scoring engine tests
refactor: extract measurement pipeline
chore: update dependencies
```

## Quality Gates (Non-Negotiable)

Every phase MUST pass all 5 gates:
1. `pnpm lint` — Zero warnings
2. `pnpm typecheck` — Zero errors
3. `pnpm test` — All tests pass
4. `pnpm build` — Build succeeds
5. Engineering Report — Documented and approved

## Code Style

- TypeScript strict mode
- No `any` types
- No unused variables or imports
- Prettier formatting enforced
- ESLint rules enforced

## Scientific Integrity

- NEVER hardcode scientific constants — use `src/core/scientific/constants.ts`
- NEVER modify measurement logic without updating tests
- NEVER skip calibration in any measurement path
- All changes to scientific parameters require ADR documentation
