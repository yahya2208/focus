# Naming Convention — FOCUS v2.0

*Frozen after Phase -0.5.*

## Components
- **PascalCase** for React components
- Files: `PascalCase.tsx`
- Examples: `GameScreen.tsx`, `CalibrationScreen.tsx`, `ProgressRing.tsx`

## Hooks
- **camelCase** with `use` prefix
- Files: `useSomething.ts`
- Examples: `useSettings.ts`, `useThemeSync.ts`

## Files (non-component)
- **kebab-case** for config files
- Examples: `vite.config.ts`, `eslint.config.js`, `commitlint.config.js`

## Interfaces
- **IInterface** prefix with PascalCase
- Examples: `ISessionRecord`, `ICalibrationProfile`, `IRepository`

## Types
- **PascalCase**, no prefix
- Examples: `ScreenState`, `FocusGrade`, `PlatformType`

## Constants
- **UPPER_SNAKE_CASE**
- Defined in `src/core/scientific/constants.ts`
- Examples: `FRAME_BUDGET_MS`, `CONFIDENCE_WEIGHTS`, `SCORING.WEIGHTS`

## Folders
- **lowercase**, no hyphens
- Examples: `screens/`, `core/`, `design-system/`

## Functions
- **camelCase**, verb-first
- Examples: `createLocalStorageRepository()`, `calculateFocusScore()`, `detectRefreshRate()`

## Events (Plugin System)
- **UPPER_SNAKE_CASE** with module prefix
- Examples: `GAME_STIMULUS_SHOWN`, `GAME_INPUT_RECEIVED`, `GAME_ROUND_COMPLETE`

## Boolean Variables
- **is/has/can** prefix
- Examples: `isCalibrating`, `hasFatigue`, `canProceed`

## Test Files
- Same name as source + `.test.ts` or `.test.tsx`
- Located in `__tests__/` directory
- Examples: `scoring.test.ts`, `consistency.test.ts`
