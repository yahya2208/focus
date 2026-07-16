# Chapter 19: Coding Standards

## Overview

This chapter defines the complete coding standards for the FOCUS platform. Every engineer on the team must follow these standards. Consistency is not optional. The standards are enforced by automated tooling (ESLint, Prettier, TypeScript compiler) and reviewed in code review.

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "paths": {
      "@shared/*": ["./packages/shared/src/*"],
      "@ui/*": ["./packages/ui/src/*"],
      "@game-engine/*": ["./packages/game-engine/src/*"],
      "@analytics/*": ["./packages/analytics/src/*"],
      "@sync/*": ["./packages/sync/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

**Why `strict: true`**: Catches null/undefined errors, enforces consistent type checking, prevents implicit any. Teams at Google and Microsoft have shown strict TypeScript reduces production bugs by 15-38%.

**Why `noUncheckedIndexedAccess`**: Array and object index access returns `T | undefined` by default, forcing explicit null checks. Prevents the common bug of accessing an array element without checking bounds.

**Why `noImplicitReturns`**: Every function must explicitly return on all code paths. Prevents accidental `undefined` returns.

**Why `isolatedModules`**: Required for compatibility with Babel, esbuild, and SWC which process files in isolation. Ensures type-only imports are explicitly marked.

## Naming Conventions

### Files and Directories

| Context | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `GameSession.tsx`, `ScoreDisplay.tsx` |
| Utility files | kebab-case | `formatting.ts`, `validation.ts` |
| Hook files | kebab-case with `use` prefix | `use-game-session.ts`, `use-timer.ts` |
| Type definition files | kebab-case | `game.ts`, `session.ts` |
| Test files | Same as source + `.test` suffix | `GameSession.test.tsx` |
| Storybook files | Same as source + `.stories` suffix | `GameSession.stories.tsx` |
| CSS files | kebab-case | `globals.css`, `animations.css` |
| Config files | Platform convention | `vite.config.ts`, `tailwind.config.ts` |
| Database migrations | `YYYYMMDDHHMMSS_name.sql` | `20260115120000_add_achievements.sql` |

### Code Identifiers

| Context | Convention | Example |
|---------|-----------|---------|
| Component names | PascalCase | `GameSession`, `ScoreDisplay` |
| Function names | camelCase | `calculateScore`, `formatDuration` |
| Variable names | camelCase | `reactionTime`, `sessionScore` |
| Boolean variables | `is`/`has`/`can`/`should` prefix | `isLoading`, `hasError`, `canRetry` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_TRIALS`, `DEFAULT_ISI`, `API_TIMEOUT` |
| Type names | PascalCase | `GameSession`, `TrialResult` |
| Interface names | PascalCase (no `I` prefix) | `Game`, `Session`, `Trial` |
| Enum type names | PascalCase | `SessionStatus` |
| Enum values | SCREAMING_SNAKE_CASE | `SessionStatus.COMPLETED` |
| React event handlers | `handle` prefix | `handleClick`, `handleSubmit` |
| React callback props | `on` prefix | `onComplete`, `onError` |
| CSS classes (BEM) | kebab-case | `game-session__score--fast` |
| Database tables | snake_case | `game_sessions`, `user_achievements` |
| Database columns | snake_case | `created_at`, `user_id` |
| API endpoints | kebab-case | `/game-sessions`, `/user-achievements` |
| Environment variables | SCREAMING_SNAKE_CASE | `SUPABASE_URL`, `API_KEY` |
| CSS custom properties | kebab-case with prefix | `--focus-color-primary` |
| React context names | PascalCase + `Context` | `AuthContext`, `ThemeContext` |

### File Structure for Components

Each component follows a consistent internal structure:

```
GameSession/
├── GameSession.tsx           # Main component implementation
├── GameSession.test.tsx      # Unit and integration tests
├── GameSession.stories.tsx   # Storybook stories
├── index.ts                  # Public exports
├── types.ts                  # Component-specific types
├── constants.ts              # Component-specific constants
├── hooks/                    # Component-specific hooks
│   ├── use-game-session.ts
│   ├── use-trial-manager.ts
│   └── use-score-calculator.ts
├── utils/                    # Component-specific utilities
│   ├── scoring.ts
│   └── timing.ts
├── components/               # Sub-components
│   ├── Stimulus.tsx
│   ├── ResponseZone.tsx
│   └── ResultScreen.tsx
└── __fixtures__/             # Test fixtures
    └── mock-sessions.ts
```

## Code Style Rules

1. **Single quotes** for strings (not double quotes)
   ```typescript
   const name = 'FOCUS'; // correct
   const name = "FOCUS"; // wrong
   ```

2. **Semicolons required** at the end of every statement
   ```typescript
   const x = 10; // correct
   const y = 20  // wrong
   ```

3. **Trailing commas required** (ES5 style) for arrays and objects
   ```typescript
   const items = [
     'first',
     'second',
     'third',  // trailing comma
   ];
   
   const config = {
     width: 100,
     height: 200,
   };
   ```

4. **2-space indentation** (no tabs)
   ```typescript
   function calculate() {
     const result = 1 + 2;
     return result;
   }
   ```

5. **Max line length**: 100 characters. Break long lines at logical points.

6. **No unused imports**. Remove imports that are not referenced in the file.

7. **No `console.log` in production code**. Use the logger utility:
   ```typescript
   import { logger } from '@shared/utils/logger';
   
   logger.info('Session completed', { sessionId, score });
   logger.error('Failed to save session', { error });
   ```

8. **Prefer `const` over `let`**. Never use `var`.
   ```typescript
   const score = 85; // correct
   let temp = 10;    // only if reassignment is needed
   var old = 5;      // never
   ```

9. **Early returns** over nested if/else:
   ```typescript
   // correct
   function processSession(session: GameSession) {
     if (!session) return null;
     if (session.status !== 'completed') return null;
     
     return calculateScore(session);
   }
   
   // wrong
   function processSession(session: GameSession) {
     if (session) {
       if (session.status === 'completed') {
         return calculateScore(session);
       }
     }
     return null;
   }
   ```

10. **Destructure** when accessing multiple properties from the same object:
    ```typescript
    const { score, reactionTime, consistency } = session;
    
    // Don't destructure if only accessing one property
    const score = session.score;
    ```

11. **Prefer template literals** over string concatenation:
    ```typescript
    const message = `Score: ${score} (${percentile}th percentile)`; // correct
    const message = 'Score: ' + score + ' (' + percentile + 'th percentile)'; // wrong
    ```

12. **Use optional chaining** (`?.`) and nullish coalescing** (`??`):
    ```typescript
    const avatar = user?.profile?.avatar ?? defaultAvatar;
    
    // Don't use || for numbers (0 is falsy)
    const count = items?.length ?? 0; // correct
    const count = items?.length || 0; // wrong (0 would become 0, but confusing)
    ```

13. **Async/await** over `.then()` chains:
    ```typescript
    // correct
    async function loadSession(id: string) {
      const session = await fetchSession(id);
      const score = await calculateScore(session);
      return score;
    }
    
    // wrong
    function loadSession(id: string) {
      return fetchSession(id)
        .then(session => calculateScore(session));
    }
    ```

14. **No async in useEffect body**. Use an async function inside:
    ```typescript
    // correct
    useEffect(() => {
      async function loadData() {
        const data = await fetchData();
        setData(data);
      }
      loadData();
    }, []);
    
    // wrong
    useEffect(async () => {
      const data = await fetchData(); // This is a bug
      setData(data);
    }, []);
    ```

15. **Error boundaries** for all route-level components and game components:
    ```typescript
    <ErrorBoundary fallback={<ErrorScreen />}>
      <GameSession />
    </ErrorBoundary>
    ```

## React Rules

1. **Functional components only**. No class components. Ever.

2. **Custom hooks** for shared logic. If you use `useState` + `useEffect` together more than once, extract a hook.

3. **React.memo only when profiling shows re-render issues**. Default to no memoization. Premature optimization is worse than no optimization.

4. **useMemo/useCallback only when profiling shows issues**. The React team advises against blanket memoization. It has its own cost.

5. **ForwardRef only for reusable primitives** (inputs, buttons used in forms). Not for page-level components.

6. **Props destructuring in function signature**:
   ```typescript
   // correct
   function GameCard({ title, score, onClick }: GameCardProps) {
     return <div onClick={onClick}>{title}: {score}</div>;
   }
   
   // wrong
   function GameCard(props: GameCardProps) {
     return <div onClick={props.onClick}>{props.title}: {props.score}</div>;
   }
   ```

7. **Default values in destructuring**:
   ```typescript
   function GameCard({ title, score = 0, variant = 'default' }: GameCardProps) {
     // ...
   }
   ```

8. **Children typed as `React.ReactNode`**:
   ```typescript
   interface CardProps {
     title: string;
     children: React.ReactNode;
   }
   ```

9. **Event handlers prefixed with `handle`**:
   ```typescript
   function GameSession() {
     const handleClick = () => { /* ... */ };
     const handleSubmit = (data: FormData) => { /* ... */ };
     
     return <button onClick={handleClick}>Start</button>;
   }
   ```

10. **No inline function definitions in JSX for performance-critical paths**:
    ```typescript
    // OK for static lists
    {items.map(item => <Item key={item.id} {...item} />)}
    
    // For game components where re-renders are frequent, use useCallback
    const handleResponse = useCallback((rt: number) => {
      recordResponse(rt);
    }, [recordResponse]);
    ```

## Error Handling Rules

1. **All async functions must handle errors**:
   ```typescript
   async function loadSession(id: string): Promise<GameSession | null> {
     try {
       return await fetchSession(id);
     } catch (error) {
       logger.error('Failed to load session', { id, error });
       return null;
     }
   }
   ```

2. **Use typed errors** (custom error classes):
   ```typescript
   class SessionNotFoundError extends Error {
     constructor(sessionId: string) {
       super(`Session not found: ${sessionId}`);
       this.name = 'SessionNotFoundError';
     }
   }
   
   class ScoringError extends Error {
     constructor(message: string, public readonly data: unknown) {
       super(message);
       this.name = 'ScoringError';
     }
   }
   ```

3. **Never swallow errors silently**. Always log them:
   ```typescript
   // wrong
   try {
     await riskyOperation();
   } catch {
     // silently ignored - bug factory
   }
   
   // correct
   try {
     await riskyOperation();
   } catch (error) {
     logger.warn('Risky operation failed, continuing', { error });
   }
   ```

4. **Log errors to Sentry** at the error boundary level:
   ```typescript
   class ErrorBoundary extends React.Component {
     componentDidCatch(error: Error, info: React.ErrorInfo) {
       Sentry.captureException(error, { extra: info });
     }
   }
   ```

5. **Show user-friendly error messages**. Never show stack traces or technical errors to users.

6. **Validate all external data with Zod**:
   ```typescript
   const SessionSchema = z.object({
     id: z.string().uuid(),
     status: z.enum(['created', 'active', 'completed']),
     score: z.number().min(0).max(100),
   });
   
   function validateSession(data: unknown) {
     return SessionSchema.parse(data);
   }
   ```

7. **Handle network errors gracefully** with retry UI.

8. **Provide retry mechanisms** where appropriate (manual retry button for failed operations).

9. **Distinguish between recoverable and unrecoverable errors**:
   ```typescript
   if (error instanceof NetworkError) {
     showRetryDialog(error);
   } else if (error instanceof AuthError) {
     redirectToLogin();
   } else {
     showGenericError();
     reportToSentry(error);
   }
   ```

10. **No `throw` in rendering code** unless inside an error boundary:
    ```typescript
    // wrong - will crash the app
    function Score({ value }: { value: number }) {
      if (value < 0) throw new Error('Invalid score');
      return <span>{value}</span>;
    }
    
    // correct - validate in parent or use error boundary
    function Score({ value }: { value: number }) {
      const display = value >= 0 ? value : 0;
      return <span>{display}</span>;
    }
    ```

## Import Order

Imports follow a strict order, separated by blank lines:

```typescript
// 1. React and React ecosystem
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Shared packages (absolute imports)
import { calculateScore } from '@shared/utils/calculation';
import { Button } from '@ui/components/Button';
import { useGameSession } from '@game-engine/hooks/useGameSession';

// 4. Internal modules (relative imports)
import { GameSession } from './GameSession';
import { useGameState } from './hooks/useGameState';
import { formatDuration } from './utils/formatting';

// 5. Types (can be combined with imports above)
import type { TrialResult } from './types';
import type { GameConfig } from '@shared/types/game';
```

**Why this order**: React first (most common import), then external libraries (clear dependency on third-party), then shared packages (internal dependencies), then local files. This makes dependencies immediately clear from the imports section.

## Git Conventions

### Branch Naming

```
feature/TICKET-123-description    # New features
fix/TICKET-456-description        # Bug fixes
hotfix/TICKET-789-description     # Critical production fixes
chore/description                 # Build/dependency updates
docs/description                  # Documentation changes
refactor/description              # Code refactoring
test/description                  # Test additions/changes
```

### Commit Messages (Conventional Commits)

```
feat(reaction-light): add fatigue detection algorithm
fix(sync): resolve conflict resolution for concurrent edits
docs(api): update session endpoint documentation
style(ui): format button component with prettier
refactor(engine): extract timing logic to Web Worker
test(scoring): add edge case tests for RT score calculation
chore(deps): upgrade vitest to v1.0
perf(engine): optimize score calculation with memoization
```

Format: `type(scope): description`
- `type`: feat, fix, docs, style, refactor, test, chore, perf
- `scope`: Optional module/package affected
- `description`: Imperative mood, lowercase, no period

### PR Title

Same format as commit messages. Example: `feat(reaction-light): add fatigue detection algorithm`

### PR Description Template

```markdown
## What
Brief description of the change.

## Why
Link to issue or explanation of motivation.

## How
Technical approach taken.

## Testing
How was this tested?

## Screenshots
If UI changed, include before/after screenshots.

## Checklist
- [ ] Tests pass
- [ ] TypeScript strict mode
- [ ] ESLint clean
- [ ] Accessibility tested
- [ ] Responsive design verified
```

## ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y',
    'testing-library',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  rules: {
    // Custom rules
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@shared/*', '@ui/*'],
        message: 'Use path aliases, not relative imports across packages',
      }],
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: { typeImports: 'type-imports' },
    }],
    
    // React rules
    'react/prop-types': 'off',
    'react/self-closing-comp': 'error',
    'react/jsx-no-useless-fragment': 'error',
    
    // Import rules
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
      ],
      'newlines-between': 'always',
      alphabetize: { order: 'asc' },
    }],
    'import/no-duplicates': 'error',
    
    // Accessibility rules
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/anchor-is-valid': 'error',
  },
  settings: {
    react: { version: 'detect' },
  },
};
```

### Custom ESLint Rules for FOCUS

1. **No relative imports across packages**: Prevents fragile cross-package imports.
2. **No direct DOM manipulation**: Must use React refs or state.
3. **No localStorage directly**: Must use the storage abstraction (`@shared/utils/storage`).
4. **No Math.random() outside timing engine**: Ensures reproducibility in tests.
5. **No hardcoded colors**: Must use design tokens.
6. **No hardcoded strings in UI**: Must use i18next translation keys.
7. **No synchronous storage access in components**: All storage operations are async.
8. **No direct Supabase client access in components**: Must use API layer hooks.

## Code Review Checklist

Every PR must be reviewed against this checklist:

- [ ] TypeScript strict mode compliance
- [ ] No `any` types without justification
- [ ] All functions have explicit return types (public API)
- [ ] Error handling for all async operations
- [ ] No hardcoded strings (use i18n keys)
- [ ] No hardcoded colors (use design tokens)
- [ ] Accessibility: Focus management, ARIA attributes, contrast
- [ ] Responsive design at all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader announcements for dynamic content
- [ ] Tests included for new functionality
- [ ] No performance regressions (profiled)
- [ ] Database migrations are backward compatible
- [ ] RLS policies cover new tables/columns
- [ ] Error messages are user-friendly
- [ ] Logging includes sufficient context for debugging
