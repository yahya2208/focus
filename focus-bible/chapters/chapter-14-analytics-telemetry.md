# Chapter 14: Analytics & Telemetry

## 14.1 Analytics Philosophy

The FOCUS platform treats analytics as a product improvement tool, not a surveillance mechanism. Every analytics decision is guided by three principles: track what matters, respect user privacy, and use data to make the product better. The platform does not track everything — it tracks the right things. Each event in the analytics pipeline has a documented purpose, a defined owner, and a clear retention policy. Events without a clear use case are not implemented.

### 14.1.1 Core Principles

1. **Track what matters, not everything.** Every event must answer the question: "What decision will this data inform?" If the answer is "none," the event is not implemented. This prevents data bloat, reduces privacy risk, and keeps the analytics pipeline manageable.

2. **Privacy-first collection.** Personally Identifiable Information (PII) is never included in analytics events. User identifiers use UUIDs, not emails or names. IP addresses are anonymized. Device fingerprints are not collected. The analytics system cannot identify a specific individual from its data.

3. **User consent required.** Analytics collection only begins after the user explicitly consents. The consent flow is clear, specific, and easy to revoke. Users can opt out entirely or opt out of specific categories (e.g., allow product analytics but not performance monitoring).

4. **Data improves the product.** Analytics data is used exclusively to improve the FOCUS platform. It is never sold to third parties, never used for advertising, and never shared with data brokers. This is a hard commitment, not a policy that can be changed.

5. **Minimal retention.** Raw event data is retained for 2 years. Aggregated data is retained for 5 years. After retention periods, data is permanently deleted. This minimizes the blast radius of any potential data breach.

6. **Transparency.** The privacy policy clearly documents what data is collected, why it is collected, how long it is retained, and who has access. The policy is written in plain language, not legal jargon.

### 14.1.2 What We Track

The analytics system tracks four categories of data:

- **Product usage** — Which features are used, how often, and in what patterns. This informs product roadmap decisions.
- **Performance** — Application load times, frame rates, memory usage, error rates. This informs engineering priorities.
- **Progression** — How users advance through the platform (levels, achievements, streaks). This informs engagement design.
- **Business** — Conversion rates, retention curves, cohort analysis. This informs business decisions.

### 14.1.3 What We Do NOT Track

- Browsing history outside the application
- Social media profiles or connections
- Precise geolocation (city-level or finer)
- Biometric data (even if collected for game calibration, it is never sent to analytics)
- Content of user-generated data (messages, profile text)
- Financial data beyond subscription status
- Device identifiers that persist across app uninstalls

---

## 14.2 Event Taxonomy

The event taxonomy defines every analytics event the platform can emit. Each event has a name, a schema (the data fields it carries), a category, and a documentation reference. Events are organized into eight categories.

### 14.2.1 Category 1: Session Events

Session events track the lifecycle of game sessions — from start to completion or abandonment. These events are the foundation of product analytics, providing insight into which games are played, how long sessions last, and where users drop off.

**session_started**

Emitted when a user begins a new game session. This event marks the entry point into the core product experience.

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Identifier for the game being played |
| session_type | enum | 'standard' / 'challenge' / 'calibration' |
| timestamp | string | ISO 8601 timestamp of session start |
| device_type | enum | 'mobile' / 'tablet' / 'desktop' |
| screen_width | number | Device screen width in pixels |
| screen_height | number | Device screen height in pixels |
| connection_type | string | Network connection type at session start |

**session_completed**

Emitted when a user successfully completes a game session. This is the primary positive outcome event.

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| score | number | Final session score |
| duration_ms | number | Total session duration in milliseconds |
| trials_completed | number | Number of trials completed |
| trials_total | number | Total trials in session |
| calibration_used | boolean | Whether calibration data was used |
| is_personal_best | boolean | Whether this score is a new personal best |
| timestamp | string | ISO 8601 completion timestamp |

**session_abandoned**

Emitted when a user leaves a session without completing it. This event is critical for identifying usability issues, difficulty spikes, and engagement drop-off points.

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| trials_completed | number | Trials completed before abandonment |
| last_trial_index | number | Index of the last trial attempted |
| duration_ms | number | Duration before abandonment |
| timestamp | string | ISO 8601 abandonment timestamp |
| exit_reason | enum | 'navigation' / 'timeout' / 'tab_switch' / 'unknown' |

**session_paused**

Emitted when a user pauses a session (mobile only — sessions pause when the app goes to background).

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| paused_at_trial | number | Trial index when paused |
| timestamp | string | ISO 8601 pause timestamp |

**session_resumed**

Emitted when a user resumes a paused session.

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| paused_duration_ms | number | How long the session was paused |
| timestamp | string | ISO 8601 resume timestamp |

### 14.2.2 Category 2: Game Events

Game events capture granular interactions within a session. These events enable detailed analysis of game mechanics, difficulty balance, and user behavior patterns.

**trial_started**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| trial_index | number | 0-indexed trial number |
| difficulty | number | Current difficulty level |
| timestamp | string | ISO 8601 |

**trial_completed**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| trial_index | number | Trial number |
| reaction_time_ms | number | User's reaction time in milliseconds |
| result | enum | 'correct' / 'incorrect' / 'miss' |
| is_lapse | boolean | Whether this was an attention lapse |
| stimulus_duration_ms | number | How long the stimulus was shown |
| inter_stimulus_interval_ms | number | Time between previous stimulus and this one |
| timestamp | string | ISO 8601 |

**stimulus_shown**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| trial_index | number | Trial number |
| stimulus_type | string | Type of stimulus shown |
| timestamp | string | ISO 8601 with millisecond precision |

**response_received**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| trial_index | number | Trial number |
| response_time_ms | number | Time from stimulus to response |
| input_method | enum | 'touch' / 'keyboard' / 'mouse' / 'voice' |
| timestamp | string | ISO 8601 |

**calibration_started**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| calibration_type | string | Type of calibration |

**calibration_completed**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| calibration_score | number | Calibration quality score |
| baseline_rt_ms | number | Computed baseline reaction time |
| sample_size | number | Number of calibration samples |

**difficulty_adjusted**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| old_level | number | Previous difficulty level |
| new_level | number | New difficulty level |
| reason | enum | 'adaptive' / 'manual' / 'session_start' |
| timestamp | string | ISO 8601 |

### 14.2.3 Category 3: Progression Events

Progression events track how users advance through the platform's meta-game systems. These events inform engagement design, achievement tuning, and reward balance.

**level_up**

| Field | Type | Description |
|-------|------|-------------|
| old_level | number | Previous level |
| new_level | number | New level |
| xp_total | number | Total XP at time of level up |
| timestamp | string | ISO 8601 |

**achievement_unlocked**

| Field | Type | Description |
|-------|------|-------------|
| achievement_id | string | Achievement identifier |
| achievement_name | string | Human-readable achievement name |
| rarity | enum | 'common' / 'uncommon' / 'rare' / 'epic' / 'legendary' |
| timestamp | string | ISO 8601 |

**xp_earned**

| Field | Type | Description |
|-------|------|-------------|
| amount | number | XP earned in this action |
| source | enum | 'session' / 'achievement' / 'mission' / 'challenge' / 'streak' |
| total_xp | number | Running total XP after this earn |

**streak_maintained**

| Field | Type | Description |
|-------|------|-------------|
| streak_days | number | Current streak length |
| streak_type | enum | 'daily_login' / 'daily_session' |

**streak_broken**

| Field | Type | Description |
|-------|------|-------------|
| streak_days | number | Final streak length |
| last_active | string | ISO 8601 of last active day |
| timestamp | string | ISO 8601 of break detection |

**mission_completed**

| Field | Type | Description |
|-------|------|-------------|
| mission_id | string | Mission identifier |
| mission_type | enum | 'daily' / 'weekly' / 'special' |
| reward_xp | number | XP rewarded |

**challenge_completed**

| Field | Type | Description |
|-------|------|-------------|
| challenge_id | string | Challenge identifier |
| challenge_type | enum | 'solo' / 'friend' / 'global' |
| reward_xp | number | XP rewarded |
| result | enum | 'won' / 'lost' / 'draw' |

**record_set**

| Field | Type | Description |
|-------|------|-------------|
| game_id | string | Game identifier |
| record_type | enum | 'session_best' / 'daily_best' / 'weekly_best' / 'all_time_best' |
| old_value | number | Previous record value (null if first) |
| new_value | number | New record value |
| timestamp | string | ISO 8601 |

### 14.2.4 Category 4: Social Events

Social events track interactions between users. These events inform the social feature roadmap and help identify viral growth patterns.

| Event | Key Fields | Description |
|-------|-----------|-------------|
| friend_added | friend_id | User added a friend |
| friend_challenge_sent | friend_id, game_id | User sent a challenge to a friend |
| friend_challenge_completed | challenge_id, score, result | User completed a friend challenge |
| leaderboard_viewed | leaderboard_type, game_id | User viewed a leaderboard |
| profile_viewed | viewed_user_id | User viewed another user's profile |
| achievement_shared | achievement_id, platform | User shared an achievement |
| group_joined | group_id | User joined a group |
| group_left | group_id | User left a group |

### 14.2.5 Category 5: Navigation Events

Navigation events track how users move through the application. These events inform UX design and identify navigation friction.

| Event | Key Fields | Description |
|-------|-----------|-------------|
| screen_viewed | screen_name, previous_screen, duration | User viewed a screen |
| tab_switched | from_tab, to_tab | User switched tabs |
| modal_opened | modal_name | User opened a modal |
| modal_closed | modal_name, duration | User closed a modal (with duration) |
| settings_changed | setting_key, old_value, new_value | User changed a setting |

### 14.2.6 Category 6: Feature Events

Feature events track feature discovery and onboarding. These events inform the onboarding flow design and help identify features that are under-discovered.

| Event | Key Fields | Description |
|-------|-----------|-------------|
| feature_discovered | feature_name, source | User discovered a feature |
| feature_used | feature_name, context | User used a feature |
| onboarding_started | step | User started onboarding |
| onboarding_completed | duration, steps_completed | User completed onboarding |
| tutorial_viewed | tutorial_id, step | User viewed a tutorial step |

### 14.2.7 Category 7: Error Events

Error events capture application errors for debugging and quality monitoring. These events are critical for maintaining application reliability.

**error_occurred**

| Field | Type | Description |
|-------|------|-------------|
| error_type | string | Error category |
| error_message | string | Error message |
| stack_trace | string | Stack trace (truncated to 2KB) |
| context | string | Where the error occurred |

**api_error**

| Field | Type | Description |
|-------|------|-------------|
| endpoint | string | API endpoint |
| status_code | number | HTTP status code |
| duration_ms | number | Request duration |
| error_message | string | Server error message |

**sync_conflict**

| Field | Type | Description |
|-------|------|-------------|
| entity_type | string | Entity type that conflicted |
| resolution_strategy | string | How the conflict was resolved |

**performance_warning**

| Field | Type | Description |
|-------|------|-------------|
| metric | string | Performance metric name |
| value | number | Measured value |
| threshold | number | Expected threshold |

### 14.2.8 Category 8: Performance Events

Performance events capture application performance metrics. These events inform engineering optimization priorities.

**app_loaded**

| Field | Type | Description |
|-------|------|-------------|
| load_time_ms | number | Total app load time |
| device_type | enum | 'mobile' / 'tablet' / 'desktop' |
| connection_type | string | Network connection type |
| cache_hit | boolean | Whether the app loaded from cache |

**frame_drop**

| Field | Type | Description |
|-------|------|-------------|
| screen | string | Screen where frame drops occurred |
| duration_ms | number | Duration of frame drops |
| fps | number | Measured frames per second |

**memory_warning**

| Field | Type | Description |
|-------|------|-------------|
| used_mb | number | Heap usage in megabytes |
| limit_mb | number | Heap limit in megabytes |

**battery_warning**

| Field | Type | Description |
|-------|------|-------------|
| level | number | Battery level (0-1) |
| charging | boolean | Whether device is charging |

---

## 14.3 Analytics Implementation

### 14.3.1 PostHog (Product Analytics)

PostHog is the primary product analytics platform. It provides event capture, session recording, feature flags, and A/B testing in a single tool.

**Integration:**

```typescript
// packages/web/src/lib/analytics.ts

import posthog from 'posthog-js';

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    persistence: 'localStorage+cookie',
    capture_pageview: false,       // Manual pageview capture
    capture_pageleave: true,
    autocapture: false,            // We capture events manually
    disable_session_recording: true, // Opt-in only
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.debug();
      }
    },
  });
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  posthog.capture(eventName, {
    ...properties,
    app_version: import.meta.env.VITE_APP_VERSION,
    platform: navigator.platform,
    timestamp: new Date().toISOString(),
  });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  posthog.identify(userId, traits);
}

export function resetIdentity() {
  posthog.reset();
}
```

**Session Recording:**

Session recording is disabled by default and requires explicit user opt-in. When enabled, it records DOM mutations, click events, and scroll events. Input fields (passwords, email) are automatically masked. Session recordings are stored in PostHog's EU cloud (GDPR compliant) and retained for 30 days.

**Feature Flags:**

PostHog feature flags are evaluated on the client side with local caching. The feature flag system is described in detail in Section 14.4.

**A/B Testing:**

PostHog experiments are used for A/B testing. The experiment system is described in detail in Section 14.5.

### 14.3.2 Sentry (Error Tracking and Performance Monitoring)

Sentry provides error tracking, performance monitoring, and release tracking. It is the primary tool for maintaining application reliability.

**Integration:**

```typescript
// packages/web/src/lib/error-tracking.ts

import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  release: import.meta.env.VITE_APP_VERSION,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,          // 10% of transactions
  replaysSessionSampleRate: 0,    // Disabled by default
  replaysOnErrorSampleRate: 1.0,  // 100% on errors
  beforeSend(event) {
    // Remove PII from error events
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});
```

**Error Boundaries:**

React Error Boundaries wrap major UI sections to prevent full-page crashes:

```typescript
// packages/web/src/components/ErrorBoundary.tsx

import { ErrorBoundary } from 'react-error-boundary';

function GameErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>The game encountered an error. Your progress has been saved.</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function GameErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={GameErrorFallback}
      onError={(error, info) => {
        Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**Performance Monitoring (APM):**

Sentry automatically captures:
- Page load time
- HTTP request duration
- JavaScript execution time
- Component render time
- Long tasks (>50ms)

Custom performance transactions are created for game-specific operations:

```typescript
const transaction = Sentry.startTransaction({ name: 'game-session' });
const span = transaction.startChild({ op: 'calibration' });
// ... calibration logic ...
span.finish();
transaction.finish();
```

**Release Tracking:**

Every deployment creates a Sentry release. Source maps are uploaded during the build process. This enables:
- Stack trace deobfuscation
- Release-over-release error comparison
- Automatic issue assignment to releases
- Deploy notifications

### 14.3.3 Custom Analytics Pipeline

In addition to PostHog and Sentry, the platform has a custom analytics pipeline for high-volume events that need processing before storage.

**Pipeline architecture:**

1. **Event batching.** Events are batched in an IndexedDB queue. The batch flushes when it reaches 100 events or every 30 seconds, whichever comes first. This reduces network requests and ensures no events are lost.

2. **Network flush.** The batch is sent to a Supabase Edge Function via a POST request. The Edge Function validates the events, enriches them with server-side data (user tier, experiment variants), and stores them in the analytics table.

3. **Server-side processing.** The Edge Function performs:
   - Schema validation (reject malformed events)
   - PII stripping (remove any accidentally included PII)
   - Enrichment (add server-side context: user tier, experiment variants, feature flags)
   - Deduplication (remove duplicate events within a 5-second window)
   - Storage (insert into the `analytics_events` table)

4. **Aggregation.** A pg_cron job runs every hour to aggregate raw events into summary tables. This pre-computes common queries (daily active users, session counts, feature usage) and reduces query time for dashboards.

**Event batching implementation:**

```typescript
class AnalyticsBatcher {
  private queue: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 30000;

  enqueue(event: AnalyticsEvent) {
    this.queue.push(event);
    
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL_MS);
    }
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.BATCH_SIZE);
    if (batch.length === 0) return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
    } catch {
      // Re-queue failed events (up to 3 retries)
      batch.forEach(event => {
        event.retry_count = (event.retry_count || 0) + 1;
        if (event.retry_count < 3) {
          this.queue.unshift(event);
        }
      });
    }
  }
}
```

---

## 14.4 Feature Flags

Feature flags allow the team to enable or disable features without deploying new code. This is critical for gradual rollouts, A/B testing, and emergency kill switches.

### 14.4.1 PostHog Feature Flags

Feature flags are defined in PostHog's dashboard and evaluated on the client side. The PostHog SDK fetches flag definitions on initialization and caches them locally.

**Flag evaluation flow:**

1. On app load, PostHog SDK fetches flag definitions from the PostHog API.
2. Flag definitions are cached in localStorage with a 5-minute TTL.
3. Flag values are evaluated locally using the cached definitions.
4. If the cache is expired, flag values are evaluated using stale definitions while fresh definitions are fetched in the background.
5. If PostHog is unreachable (offline), flag values are evaluated using the cached definitions.
6. If no cache exists (first load), default values are used.

**Default values for offline mode:**

Every feature flag has a hardcoded default value that is used when PostHog is unreachable. This ensures the application works fully offline:

```typescript
const FEATURE_FLAGS = {
  NEW_GAME_MODE: { default: false, posthog_key: 'new-game-mode' },
  SOCIAL_LEADERBOARDS: { default: true, posthog_key: 'social-leaderboards' },
  DARK_MODE_V2: { default: false, posthog_key: 'dark-mode-v2' },
} as const;

function isEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  const config = FEATURE_FLAGS[flag];
  return posthog.getFeatureFlag(config.posthog_key) === 'true' || config.default;
}
```

**Percentage-based rollouts:**

Flags can be configured to enable for a percentage of users. PostHog ensures consistent assignment — a user who is in the rollout will always see the enabled state, and a user who is out will always see the disabled state.

**User segment targeting:**

Flags can target specific user segments:
- By user level (e.g., level 10+)
- By subscription tier (free, pro, enterprise)
- By device type (mobile only)
- By geography (specific countries)
- By cohort (users who signed up in the last 30 days)

**Kill switch capability:**

Any feature flag can be toggled off instantly in PostHog's dashboard. This serves as an emergency kill switch for features that cause issues in production. The change takes effect within 5 minutes (the cache TTL).

### 14.4.2 Feature Flag Cache

Feature flag values are cached in localStorage to ensure offline functionality:

```typescript
interface FlagCache {
  flags: Record<string, string>;
  timestamp: number;
}

const FLAG_CACHE_KEY = 'focus_feature_flags';
const FLAG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedFlags(): Record<string, string> {
  const raw = localStorage.getItem(FLAG_CACHE_KEY);
  if (!raw) return {};
  
  const cache: FlagCache = JSON.parse(raw);
  if (Date.now() - cache.timestamp > FLAG_CACHE_TTL) {
    return {}; // Cache expired
  }
  return cache.flags;
}

function setCachedFlags(flags: Record<string, string>) {
  const cache: FlagCache = { flags, timestamp: Date.now() };
  localStorage.setItem(FLAG_CACHE_KEY, JSON.stringify(cache));
}
```

---

## 14.5 A/B Testing

### 14.5.1 PostHog Experiments

A/B tests are implemented as PostHog experiments. Each experiment has a control variant and one or more treatment variants.

**Variant assignment:**

PostHog assigns users to variants using a deterministic hash of the user's distinct ID. This ensures:
- Consistent assignment across sessions
- Consistent assignment across devices (if the user is identified)
- No bias in assignment (random hash distribution)
- No interaction between experiments (each experiment has independent assignment)

Variant assignment is persisted in localStorage and PostHog's server. When offline, the locally persisted assignment is used.

**Statistical significance:**

PostHog calculates statistical significance using Bayesian inference. An experiment is considered significant when the probability of the treatment being better than control exceeds 95%. The experiment dashboard shows:
- Current significance level
- Sample size per variant
- Effect size (absolute and relative)
- Confidence interval

**Maximum concurrent experiments:**

The platform limits concurrent experiments to 3. This prevents interaction effects between experiments and reduces the cognitive load on the development team. When more than 3 experiments are active, new experiments queue until one completes.

### 14.5.2 Experiment Lifecycle

1. **Hypothesis:** Define what the experiment tests, what metric it optimizes, and what the expected impact is.
2. **Design:** Define variants, sample size, duration, and success criteria.
3. **Implementation:** Implement the feature behind a feature flag. Add experiment tracking events.
4. **Launch:** Start the experiment in PostHog. Monitor for data quality issues.
5. **Analyze:** After the planned duration, analyze results. Check for statistical significance.
6. **Decide:** Ship the winning variant, iterate, or kill the experiment.
7. **Document:** Record the experiment results, learnings, and decision in the experiment log.

### 14.5.3 Experiment Tracking

Every experiment event includes:

```typescript
trackEvent('experiment_viewed', {
  experiment_id: 'onboarding-flow-v2',
  variant: 'treatment',
  user_cohort: 'new_users',
});

trackEvent('experiment_converted', {
  experiment_id: 'onboarding-flow-v2',
  variant: 'treatment',
  conversion_event: 'session_completed',
});
```

---

## 14.6 Performance Monitoring

### 14.6.1 Core Web Vitals

The platform monitors Core Web Vitals to ensure a high-quality user experience:

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Time until largest content element renders |
| FID (First Input Delay) | < 100ms | Time from first user interaction to response |
| CLS (Cumulative Layout Shift) | < 0.1 | Layout shift score across page lifetime |
| TTFB (Time to First Byte) | < 800ms | Time until first byte of response received |
| INP (Interaction to Next Paint) | < 200ms | Time from interaction to next visual update |

Core Web Vitals are measured using the `web-vitals` library and reported to both Sentry and PostHog:

```typescript
import { onLCP, onFID, onCLS, onTTFB, onINP } from 'web-vitals';

function reportWebVitals(metric: Metric) {
  Sentry.setMeasurement(metric.name, metric.value, metric.rating === 'good' ? 'ms' : 'ms');
  trackEvent('web_vital', {
    metric_name: metric.name,
    value: metric.value,
    rating: metric.rating,  // 'good', 'needs-improvement', 'poor'
    delta: metric.delta,
    id: metric.id,
  });
}

onLCP(reportWebVitals);
onFID(reportWebVitals);
onCLS(reportWebVitals);
onTTFB(reportWebVitals);
onINP(reportWebVitals);
```

### 14.6.2 Custom Performance Metrics

Beyond Core Web Vitals, the platform tracks application-specific performance metrics:

| Metric | Description | Target |
|--------|-------------|--------|
| game_load_time | Time from game selection to first playable frame | < 3 seconds |
| session_start_time | Time from session start to first trial | < 2 seconds |
| sync_duration | Time to complete a full sync cycle | < 5 seconds |
| db_query_time | Time for IndexedDB queries | < 100ms |
| api_response_time | Time for API responses | < 500ms p95 |
| frame_rate | Frames per second during gameplay | > 55 fps (target 60) |
| memory_usage | Heap usage during gameplay | < 200MB |

### 14.6.3 Memory Monitoring

Memory usage is monitored during gameplay to detect memory leaks:

```typescript
class MemoryMonitor {
  private interval: ReturnType<typeof setInterval> | null = null;
  private baseline: number = 0;

  start() {
    if (!('memory' in performance)) return;
    
    this.baseline = (performance as any).memory.usedJSHeapSize;
    
    this.interval = setInterval(() => {
      const current = (performance as any).memory.usedJSHeapSize;
      const usedMB = current / (1024 * 1024);
      const limitMB = (performance as any).memory.jsHeapSizeLimit / (1024 * 1024);
      
      // Report if heap usage exceeds 80% of limit
      if (usedMB / limitMB > 0.8) {
        trackEvent('memory_warning', { used_mb: usedMB, limit_mb: limitMB });
      }
      
      // Report if heap grew by more than 50MB since baseline (potential leak)
      if (current - this.baseline > 50 * 1024 * 1024) {
        trackEvent('memory_leak_suspected', {
          growth_mb: (current - this.baseline) / (1024 * 1024),
          baseline_mb: this.baseline / (1024 * 1024),
        });
      }
    }, 10000); // Check every 10 seconds
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}
```

### 14.6.4 Battery and Network Monitoring

Battery status is monitored using the Battery API (when available) to warn users when playing games on low battery:

```typescript
if ('getBattery' in navigator) {
  const battery = await (navigator as any).getBattery();
  
  battery.addEventListener('levelchange', () => {
    if (battery.level < 0.15 && !battery.charging) {
      trackEvent('battery_warning', {
        level: battery.level,
        charging: battery.charging,
      });
    }
  });
}
```

Network conditions are monitored using the Network Information API:

```typescript
if ('connection' in navigator) {
  const connection = (navigator as any).connection;
  
  connection.addEventListener('change', () => {
    trackEvent('network_changed', {
      effective_type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      save_data: connection.saveData,
    });
  });
}
```

---

## 14.7 Data Warehouse (Future)

### 14.7.1 Architecture

The data warehouse pipeline is planned for when the platform reaches sufficient scale to justify the infrastructure investment:

```
Client Events → Supabase Edge Function → analytics_events table
    → pg_cron (hourly aggregation) → analytics_aggregates table
    → dbt (transformation) → BigQuery (data warehouse)
    → Looker/Metabase (business intelligence)
```

### 14.7.2 ETL Pipeline

- **Extract:** Events flow from the client to Supabase in near-real-time via the custom analytics pipeline.
- **Transform:** dbt models transform raw events into analytical tables: user sessions, daily active users, retention cohorts, feature usage, and revenue metrics.
- **Load:** Transformed data is loaded into BigQuery for complex analytical queries that would be slow in PostgreSQL.

### 14.7.3 Data Retention

| Data Type | Retention | Storage |
|-----------|-----------|---------|
| Raw events | 2 years | BigQuery |
| Aggregated data | 5 years | BigQuery |
| Session recordings | 30 days | PostHog |
| Error events | 90 days | Sentry |
| Audit logs | 1 year | Supabase |

---

## 14.8 Privacy in Analytics

### 14.8.1 PII Prevention

No PII is included in analytics events. The `user_id` field is always a UUID, never an email, name, or other identifying information. If PII is accidentally included in an event, the Sentry `beforeSend` hook and the Edge Function's PII stripping step remove it before storage.

### 14.8.2 IP Anonymization

IP addresses are anonymized at the analytics ingestion layer. PostHog is configured to anonymize IPs by setting `property_blacklist: ['$ip']`. The custom analytics pipeline strips IP addresses before storage.

### 14.8.3 Opt-Out Mechanism

Users can opt out of analytics in the Settings screen. The opt-out is stored in localStorage and respected by all analytics code:

```typescript
function isAnalyticsEnabled(): boolean {
  const consent = localStorage.getItem('focus_analytics_consent');
  return consent === 'true';
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(eventName, properties);
}
```

Users can opt out of specific categories:
- Product analytics (PostHog events)
- Performance monitoring (Core Web Vitals, custom metrics)
- Error tracking (Sentry)
- Session recording (PostHog session replay)

### 14.8.4 Data Deletion on Account Deletion

When a user deletes their account, all associated analytics data is deleted within 30 days:
- PostHog person record is deleted
- Custom analytics events are purged (events matching the user's UUID)
- Sentry user context is cleared
- Session recordings are deleted

### 14.8.5 Cookie Consent

For the web platform, a cookie consent banner is shown on first visit. The banner allows users to:
- Accept all cookies
- Accept essential cookies only
- Customize cookie preferences

Only essential cookies (authentication, session management) are set without consent. Analytics cookies (PostHog, Sentry) are only set after explicit consent.

### 14.8.6 GDPR-Compliant Data Processing

Analytics data processing is covered by the platform's Data Processing Agreement (DPA) with Supabase and PostHog. Both providers are GDPR-compliant and process data in the EU. The platform maintains records of processing activities as required by GDPR Article 30.
