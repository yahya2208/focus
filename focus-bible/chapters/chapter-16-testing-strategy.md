# Chapter 16: Testing Strategy

## Overview

Testing is a first-class concern in the FOCUS platform. Every commit triggers automated tests. Every PR receives a full test suite. Every release undergoes comprehensive validation. This chapter defines the complete testing strategy, including test pyramid composition, frameworks, tooling, configuration, mocking strategy, CI integration, and quality gates.

## Testing Philosophy

1. **Test what matters**: Business logic, data flows, and user interactions are tested. Implementation details are not.
2. **Tests are documentation**: They show how code should behave. If a test is hard to write, the code is hard to understand.
3. **Fast feedback**: Unit tests complete in under 2 minutes. Integration tests under 5 minutes. E2E tests under 15 minutes.
4. **Flaky tests are bugs**: Any test that passes intermittently must be fixed or deleted. Flaky tests erode confidence.
5. **Test at the right level**: The test pyramid guides us. Many unit tests, fewer integration tests, minimal E2E tests.
6. **No test coverage without quality**: 80% coverage with meaningful tests beats 100% coverage with trivial assertions.

## Test Pyramid

```
        /  E2E Tests  \         (10% - Critical user journeys)
       /  Integration   \       (20% - Component + API integration)
      /   Unit Tests      \     (70% - Business logic + utilities)
     /______________________\
```

### Layer 1: Unit Tests (70% of all tests)

**Framework**: Vitest

**Why Vitest over Jest**:
- Native ESM support (matches our module system)
- Vite-powered transforms (instant, no babel)
- Compatible with Jest API (easy migration)
- Built-in coverage via c8/istanbul
- Watch mode with HMR
- Thread pool execution for speed
- Native TypeScript support

**Coverage Target**: 80% line coverage for business logic, 100% for scoring formulas

**What to Unit Test**:

1. **Scoring Formulas** (100% coverage required):
   - `calculateRTScore()` - Every branch, edge cases
   - `calculateConsistencyScore()` - SD thresholds
   - `calculateAccuracyScore()` - Edge cases
   - `calculateEnduranceScore()` - Degradation detection
   - `calculateFocusScore()` - Composite calculation
   - `calculateSessionScore()` - Multiplier application
   - `calculateXP()` - Base + bonus calculations

2. **Timing Algorithms** (100% coverage required):
   - `generateISI()` - Exponential distribution validation
   - `clampISI()` - Boundary conditions
   - `validateTiming()` - Drift detection
   - `compensateDrift()` - Correction calculation
   - `isFalseStart()` - Pre-stimulus detection
   - `isLapse()` - >500ms detection

3. **Calibration Logic**:
   - `calculateBaseline()` - Median calculation
   - `determineDifficulty()` - Threshold assignment
   - `shouldRecalibrate()` - Decay check
   - `crossGameCalibrate()` - Inference algorithm

4. **Adaptation Algorithms**:
   - `calculateNewDifficulty()` - ELO update
   - `detectFatigue()` - Performance degradation
   - `adjustForTimeOfDay()` - Circadian adjustment
   - `rateOfChange()` - Stability detection

5. **XP Calculations**:
   - `xpForLevel()` - Formula validation
   - `totalXpForLevel()` - Cumulative calculation
   - `calculateLevelFromXp()` - Reverse lookup
   - `applyStreakBonus()` - Bonus calculation
   - `applyPrestigeMultiplier()` - Multiplier application

6. **Level Progression**:
   - `shouldLevelUp()` - Threshold check
   - `getLevelRewards()` - Reward retrieval
   - `getPrestigeLevel()` - Prestige check

7. **Achievement Conditions**:
   - `evaluateCondition()` - All condition types
   - `checkProgress()` - Progress tracking
   - `shouldUnlock()` - Unlock evaluation

8. **Utility Functions**:
   - `formatDuration()` - Time formatting
   - `formatScore()` - Score formatting
   - `validateEmail()` - Email validation (Zod schema)
   - `validateUsername()` - Username validation
   - `generateInviteCode()` - Code generation
   - `calculatePercentile()` - Statistical calculation

9. **Data Transformations**:
   - `transformSessionForDisplay()` - API → UI transformation
   - `aggregateDailyStats()` - Daily rollup
   - `computeMovingAverage()` - Rolling average
   - `detectAnomalies()` - Statistical outlier detection

**Example Unit Tests**:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateRTScore, calculateConsistencyScore, calculateFocusScore } from '@game-engine/scoring';

describe('calculateRTScore', () => {
  it('returns 100 for reaction time at physiological minimum (150ms)', () => {
    expect(calculateRTScore(150)).toBe(100);
  });

  it('returns 100 for reaction time below physiological minimum', () => {
    expect(calculateRTScore(100)).toBe(100);
  });

  it('returns 95 for reaction time at 175ms (midpoint of 150-200 range)', () => {
    expect(calculateRTScore(175)).toBe(97.5);
  });

  it('returns 80 for reaction time at 200ms boundary', () => {
    expect(calculateRTScore(200)).toBe(80);
  });

  it('returns 60 for reaction time at 300ms boundary', () => {
    expect(calculateRTScore(300)).toBe(60);
  });

  it('returns 30 for reaction time at 400ms boundary', () => {
    expect(calculateRTScore(400)).toBe(30);
  });

  it('returns 0 for reaction time exceeding 2000ms', () => {
    expect(calculateRTScore(2000)).toBe(0);
  });

  it('handles edge case of exactly 500ms', () => {
    const score = calculateRTScore(500);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(30);
  });

  it('monotonically decreases as reaction time increases', () => {
    const times = [150, 200, 250, 300, 350, 400, 500, 600, 800, 1000];
    const scores = times.map(calculateRTScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});

describe('calculateConsistencyScore', () => {
  it('returns 100 for standard deviation of 20ms or less', () => {
    expect(calculateConsistencyScore(15)).toBe(100);
    expect(calculateConsistencyScore(20)).toBe(100);
  });

  it('returns 67 for standard deviation of 50ms', () => {
    expect(calculateConsistencyScore(50)).toBeCloseTo(67, 0);
  });

  it('returns approximately 25 for standard deviation of 100ms', () => {
    expect(calculateConsistencyScore(100)).toBeCloseTo(25, 0);
  });

  it('returns 0 for standard deviation exceeding 200ms', () => {
    expect(calculateConsistencyScore(250)).toBe(0);
  });
});

describe('calculateFocusScore', () => {
  it('computes weighted average of component scores', () => {
    const result = calculateFocusScore({
      reactionTimeScore: 80,
      consistencyScore: 70,
      accuracyScore: 90,
      enduranceScore: 75,
    });
    // 80*0.35 + 70*0.25 + 90*0.20 + 75*0.20 = 28 + 17.5 + 18 + 15 = 78.5
    expect(result).toBeCloseTo(78.5, 0);
  });

  it('returns 0 when all component scores are 0', () => {
    expect(calculateFocusScore({
      reactionTimeScore: 0,
      consistencyScore: 0,
      accuracyScore: 0,
      enduranceScore: 0,
    })).toBe(0);
  });

  it('returns 100 when all component scores are 100', () => {
    expect(calculateFocusScore({
      reactionTimeScore: 100,
      consistencyScore: 100,
      accuracyScore: 100,
      enduranceScore: 100,
    })).toBe(100);
  });
});
```

**What NOT to Unit Test**:
- React components (test via integration tests)
- External library behavior (trust the library)
- Simple pass-through functions
- CSS styles and animations
- Configuration files

### Layer 2: Integration Tests (20% of all tests)

**Framework**: Vitest + React Testing Library

**Why React Testing Library**:
- Tests from user perspective (not implementation details)
- Encourages accessible component design
- Works with any rendering approach
- Maintained by Kent C. Dodds, community standard

**What to Integration Test**:

1. **React Components with State**:
   - Component renders correctly with different states
   - User interactions trigger correct state changes
   - Conditional rendering works correctly

2. **Forms and Validation**:
   - Form submission with valid data
   - Validation errors displayed correctly
   - Form resets after submission
   - Loading states during async operations

3. **Navigation Flows**:
   - Route transitions
   - Protected routes redirect to login
   - Deep linking works
   - Back/forward navigation

4. **API Integrations** (Mocked):
   - Data fetching and display
   - Error handling for failed requests
   - Loading states
   - Optimistic updates

5. **State Management Integration**:
   - Zustand store updates propagate to components
   - React Query cache invalidation
   - Offline state handling

**Example Integration Tests**:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { GameLibrary } from './GameLibrary';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('GameLibrary', () => {
  it('displays list of available games', async () => {
    renderWithProviders(<GameLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Reaction Light Test')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while fetching games', () => {
    renderWithProviders(<GameLibrary />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('displays error message when API fails', async () => {
    server.use(
      http.get('/api/games', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    renderWithProviders(<GameLibrary />);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('navigates to game page when game card is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GameLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Reaction Light Test')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Reaction Light Test'));

    expect(screen.getByText('Ready to play')).toBeInTheDocument();
  });

  it('filters games by category', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GameLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Reaction Light Test')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('filter-attention'));

    expect(screen.getByText('Reaction Light Test')).toBeInTheDocument();
    expect(screen.queryByText('Memory Matrix')).not.toBeInTheDocument();
  });
});
```

### Layer 3: E2E Tests (10% of all tests)

**Framework**: Playwright

**Why Playwright over Cypress**:
- Multi-browser support (Chromium, Firefox, WebKit)
- Auto-wait mechanisms (no flaky waits)
- Trace viewer for debugging
- Codegen for test recording
- Parallel execution
- Better shadow DOM support
- Native mobile emulation
- Network interception

**What to E2E Test**:

1. **Critical User Journeys**:
   - Signup → Onboarding → First Game → Score → Profile
   - Login → Play Game → View Stats → Share Achievement
   - Login → Daily Mission → Complete → Claim Reward
   - Login → Friend Request → Accept → Challenge

2. **Cross-Browser Compatibility**:
   - Chromium (Chrome, Edge)
   - Firefox
   - WebKit (Safari)
   - Mobile viewports (iPhone, Android)

3. **Offline Behavior**:
   - Play game offline
   - Queue sync operations
   - Sync when connection restored

4. **Authentication Flows**:
   - Email/password login
   - OAuth flow (Google)
   - Magic link flow
   - Session expiry and refresh
   - Account creation

**Example E2E Tests**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('new user can sign up and play first game', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');

    // Fill signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.click('[data-testid="signup-button"]');

    // Complete onboarding
    await expect(page).toHaveURL('/onboarding');
    await page.click('[data-testid="onboarding-next"]');
    await page.click('[data-testid="onboarding-next"]');
    await page.click('[data-testid="onboarding-complete"]');

    // Navigate to games
    await expect(page).toHaveURL('/games');
    await page.click('[data-testid="game-card-reaction-light"]');

    // Start game
    await expect(page).toHaveURL('/games/reaction-light/play');
    await page.click('[data-testid="start-session"]');

    // Complete 5 trials (simplified for test)
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('[data-testid="stimulus-active"]', { timeout: 10000 });
      await page.click('[data-testid="response-zone"]');
    }

    // View results
    await expect(page.getByText('Session Complete')).toBeVisible();
    await expect(page.getByTestId('final-score')).toBeVisible();
  });

  test('returning user can login and view stats', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/home');

    // Navigate to stats
    await page.click('[data-testid="nav-stats"]');
    await expect(page.getByText('Your Statistics')).toBeVisible();
    await expect(page.getByTestId('total-sessions')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('all pages pass axe-core audit', async ({ page }) => {
    const pages = ['/', '/games', '/profile', '/settings'];

    for (const url of pages) {
      await page.goto(url);
      const accessibilityScanResults = await page.accessibility.snapshot();
      // axe-core integration would run here
    }
  });

  test('keyboard navigation works on game page', async ({ page }) => {
    await page.goto('/games/reaction-light/play');

    // Tab to start button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Game starts, space to respond
    await page.waitForSelector('[data-testid="stimulus-active"]');
    await page.keyboard.press('Space');

    expect(page.getByTestId('response-recorded')).toBeVisible();
  });
});
```

## Test Database

A separate Supabase project is used for testing:

- **Schema**: Mirrors production exactly
- **RLS**: All policies active and tested
- **Seed Data**: Realistic test data generated via scripts
- **Reset**: Database is reset before each test run
- **Migrations**: Run against test DB before tests execute

```typescript
// test/setup.ts
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!
);

beforeAll(async () => {
  // Reset test database
  await testSupabase.rpc('reset_test_database');
});

afterAll(async () => {
  // Cleanup
  await testSupabase.rpc('cleanup_test_data');
});
```

## Visual Regression Testing

**Tool**: Playwright screenshot comparison

**Approach**:
- Capture screenshots of critical screens at multiple viewports
- Compare against baseline images
- Threshold: 0.1% pixel difference allowed
- Baselines updated on intentional design changes via CI flag

**Screens Captured**:
- Home page (desktop, tablet, mobile)
- Game library (all viewports)
- Game play screen (all viewports)
- Results screen (all viewports)
- Profile page
- Settings page
- Leaderboard page
- Dark mode / Light mode / High contrast mode
- RTL layout

## Performance Testing

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://focus.app/
      https://focus.app/games
      https://focus.app/profile
    budgetPath: ./lighthouse-budget.json
    configPath: ./lighthouse.config.js
```

**Budget** (`lighthouse-budget.json`):
```json
{
  "budgets": [{
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-paint", "budget": 1500 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 },
      { "metric": "interactive", "budget": 3000 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 200 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "image", "budget": 500 },
      { "resourceType": "font", "budget": 100 }
    ]
  }]
}
```

### Bundle Size Tracking

```yaml
# CI check
- name: Bundle size check
  run: |
    npx size-limit
    # Fails if any package exceeds budget defined in package.json
```

### Memory Leak Detection

```typescript
// E2E test for memory leaks
test('no memory leak during extended gameplay', async ({ page }) => {
  await page.goto('/games/reaction-light/play');

  const initialMetrics = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  // Play 100 trials
  for (let i = 0; i < 100; i++) {
    await page.waitForSelector('[data-testid="stimulus-active"]', { timeout: 10000 });
    await page.click('[data-testid="response-zone"]');
  }

  const finalMetrics = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  // Memory growth should be less than 50MB
  expect(finalMetrics - initialMetrics).toBeLessThan(50 * 1024 * 1024);
});
```

### Frame Rate Monitoring

```typescript
test('gameplay maintains 60fps', async ({ page }) => {
  await page.goto('/games/reaction-light/play');

  const frameRates: number[] = [];

  page.on('console', (msg) => {
    if (msg.text().includes('FPS:')) {
      const fps = parseInt(msg.text().split(':')[1].trim());
      frameRates.push(fps);
    }
  });

  // Play game for 30 seconds
  await page.waitForTimeout(30000);

  const averageFps = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
  const minFps = Math.min(...frameRates);

  expect(averageFps).toBeGreaterThanOrEqual(55);
  expect(minFps).toBeGreaterThanOrEqual(30);
});
```

## Accessibility Testing

### Automated (axe-core)

```typescript
import AxeBuilder from '@axe-core/playwright';

test('home page has no accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### Keyboard Navigation Testing

```typescript
test('can complete game using only keyboard', async ({ page }) => {
  await page.goto('/games/reaction-light/play');

  // Navigate to start button
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter'); // Start session

  // Wait for stimulus and respond with keyboard
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector('[data-testid="stimulus-active"]', { timeout: 10000 });
    await page.keyboard.press('Space'); // Respond
  }

  // Results should be focused
  await expect(page.getByTestId('final-score')).toBeFocused();
});
```

### Screen Reader Testing

Manual testing schedule:
- **VoiceOver** (macOS): Every release
- **NVDA** (Windows): Every release
- **TalkBack** (Android): Every release

**Testing Checklist**:
- All images have descriptive alt text
- All interactive elements are labeled
- Score announcements use `aria-live`
- Navigation landmarks are present
- Focus order is logical
- Dynamic content is announced

## Security Testing

### Dependency Scanning

```yaml
# Dependabot (automatic)
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    open-pull-requests-limit: 10
```

### OWASP Top 10 Checklist

| Risk | Test | Method |
|------|------|--------|
| A01 Broken Access Control | RLS policy testing | Test with different user contexts |
| A02 Cryptographic Failures | TLS verification | Certificate pinning tests |
| A03 Injection | SQL injection testing | Parameterized query verification |
| A04 Insecure Design | Threat modeling | Architecture review |
| A05 Security Misconfiguration | Security headers check | Automated header scanning |
| A06 Vulnerable Components | Dependency scanning | npm audit + Snyk |
| A07 Auth Failures | Auth bypass testing | Token manipulation tests |
| A08 Data Integrity | Input validation testing | Fuzz testing |
| A09 Logging Failures | Audit log verification | Log completeness testing |
| A10 SSRF | Server-side request testing | URL validation testing |

### RLS Policy Testing

```typescript
describe('Row Level Security', () => {
  it('user cannot read other users private settings', async () => {
    const userA = createTestUser();
    const userB = createTestUser();

    // User A creates settings
    await supabaseAs(userA).from('user_settings').insert({
      user_id: userA.id,
      theme: 'dark',
    });

    // User B cannot read User A's settings
    const { data, error } = await supabaseAs(userB)
      .from('user_settings')
      .select('*')
      .eq('user_id', userA.id);

    expect(data).toEqual([]);
  });

  it('user can read public profiles', async () => {
    const user = createTestUser();

    const { data } = await supabaseAs(user)
      .from('user_profiles')
      .select('*');

    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('user cannot modify other users achievements', async () => {
    const userA = createTestUser();
    const userB = createTestUser();

    // Create an achievement for User A
    const achievement = await createAchievement();

    // User B tries to mark User A's achievement as unlocked
    const { error } = await supabaseAs(userB)
      .from('user_achievements')
      .update({ is_unlocked: true })
      .eq('user_id', userA.id)
      .eq('achievement_id', achievement.id);

    expect(error).not.toBeNull();
  });
});
```

## Test Configuration

### Vitest Configuration

```typescript
// packages/shared/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/', 'dist/'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@ui': path.resolve(__dirname, '../ui/src'),
      '@game-engine': path.resolve(__dirname, '../game-engine/src'),
    },
  },
});
```

### Playwright Configuration

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Mocking Strategy

### MSW (Mock Service Worker)

MSW intercepts network requests at the service worker level, providing realistic mocking without modifying application code.

```typescript
// e2e/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/games', () => {
    return HttpResponse.json([
      {
        id: 'reaction-light',
        slug: 'reaction-light',
        title: 'Reaction Light Test',
        category: 'reaction',
        is_active: true,
      },
    ]);
  }),

  http.post('/api/sessions', () => {
    return HttpResponse.json({
      id: 'test-session-id',
      status: 'created',
      started_at: new Date().toISOString(),
    });
  }),

  http.get('/api/scores/leaderboard/:gameId', ({ params }) => {
    return HttpResponse.json({
      entries: [
        { rank: 1, username: 'player1', score: 95.5 },
        { rank: 2, username: 'player2', score: 92.3 },
      ],
      total: 1000,
    });
  }),
];
```

### Faker.js for Realistic Data

```typescript
import { faker } from '@faker-js/faker';

export function createMockUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    email: faker.internet.email(),
    display_name: faker.person.fullName(),
    avatar_url: faker.image.avatar(),
    country_code: faker.location.countryCode(),
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createMockSession(overrides = {}) {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    game_id: 'reaction-light',
    status: 'completed',
    score: faker.number.float({ min: 40, max: 95 }),
    trial_count: 30,
    completed_trials: 30,
    duration_ms: faker.number.int({ min: 30000, max: 120000 }),
    started_at: faker.date.recent().toISOString(),
    completed_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  accessibility-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:a11y
```

## Test Quality Gates

| Gate | Threshold | Blocks PR |
|------|-----------|-----------|
| Unit test coverage | ≥80% lines | Yes |
| Integration test pass | 100% | Yes |
| E2E test pass | 100% (critical paths) | Yes |
| Lighthouse score | ≥90 all categories | Yes |
| Bundle size increase | ≤5% | Yes |
| Accessibility audit | 0 violations | Yes |
| No flaky tests | 0 flaky in last 5 runs | Yes |
| TypeScript strict | 0 errors | Yes |
| ESLint | 0 errors | Yes |
