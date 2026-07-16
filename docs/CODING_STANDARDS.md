# Coding Standards — FOCUS v2.0

*Frozen after Phase -0.5.*

## TypeScript
- **Strict mode** always. No exceptions.
- No `any` types. Use `unknown` if type is truly unknown.
- No `@ts-ignore` or `@ts-expect-error` without ADR justification.
- All functions must have explicit return types on exported functions.

## Functions
- **Pure functions** preferred. Side effects isolated to IO boundaries.
- Single Responsibility: one function, one purpose.
- Maximum function body: 50 lines. Extract if longer.
- No nested callbacks. Use async/await or composable patterns.

## Scientific Code
- **No duplicated equations.** All constants from `src/core/scientific/constants.ts`.
- Every measurement function must document its mathematical basis.
- Every threshold must explain why that value was chosen.
- No magic numbers. Use named constants.

## Architecture
- **Dependency inversion**: high-level modules never import low-level modules directly.
- **Engine isolation**: engines never import from each other.
- **Plugin isolation**: games emit events, never call measurement functions.
- **Composition over inheritance**: prefer function composition and hooks.

## React
- Functional components only. No class components.
- Hooks for state and side effects.
- Components under 150 lines. Split if larger.
- Props interface declared above component, named `ComponentProps`.

## Accessibility
- Every interactive element must have `aria-label` or visible text.
- Keyboard navigation required for all flows.
- `role` attributes on non-semantic elements.
- `aria-live` for dynamic content updates.
- `prefers-reduced-motion` respected in all animations.

## Testing
- Test behavior, not implementation.
- One assertion concept per test.
- Test file mirrors source file structure.
- Use `describe` blocks to group related tests.
- No snapshot tests for scientific logic.

## Error Handling
- Use `Result<T, E>` pattern for fallible operations.
- Never swallow errors silently.
- ErrorBoundary catches rendering crashes.
- Calibrated errors: distinguish user errors from system errors.

## Performance
- No unnecessary re-renders. Use `useMemo`/`useCallback` where measurably beneficial.
- Lazy-load screens that aren't immediately visible.
- Bundle size budget: < 200KB gzip for core.
- No synchronous localStorage access in render paths.
