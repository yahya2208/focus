# Chapter 07: Game 01 — Reaction Light Test

## Table of Contents

1. [Overview](#overview)
2. [Scientific Background](#scientific-background)
3. [Game Design](#game-design)
4. [Timing Algorithm](#timing-algorithm)
5. [Response Windows](#response-windows)
6. [Scoring Formula](#scoring-formula)
7. [Difficulty Adaptation](#difficulty-adaptation)
8. [Calibration Protocol](#calibration-protocol)
9. [Fatigue Detection](#fatigue-detection)
10. [Screen Layout](#screen-layout)
11. [Visual Design](#visual-design)
12. [Animations](#animations)
13. [Sound Design](#sound-design)
14. [Haptic Design](#haptic-design)
15. [Data Schema](#data-schema)
16. [Accessibility](#accessibility)
17. [Edge Cases](#edge-cases)
18. [Testing](#testing)

---

## Overview

The Reaction Light Test (RLT) is the first game module in the FOCUS platform. It is inspired by the Psychomotor Vigilance Task (PVT), the gold standard for measuring sustained attention and reaction time in sleep research. The RLT adapts the PVT for consumer use while preserving its scientific validity.

The game measures how quickly and consistently a user responds to a visual stimulus. A glowing orb appears on screen at unpredictable intervals, and the user must tap, click, or press as fast as possible. The measurement window is 30 to 120 seconds (10 to 60 trials), making it suitable for daily cognitive training without the fatigue of the original 10-minute PVT.

The RLT is the foundational game because reaction time is one of the most well-studied cognitive metrics. It correlates with general cognitive processing speed, attention, and alertness. Data from the RLT feeds into the user's `reaction_time` and `sustained_attention` capability ratings, which influence adaptation in other games.

---

## Scientific Background

### Origin of the PVT

The Psychomotor Vigilance Task was developed by Dr. David Dinges and Dr. John Powell at the University of Pennsylvania in 1985. It was designed as a simple, reliable measure of sustained attention and vigilance. The original test requires subjects to respond to a visual stimulus (a countdown timer) as quickly as possible, with stimuli appearing at random intervals.

### What the PVT Measures

The PVT measures several cognitive dimensions:

- **Sustained attention**: The ability to maintain focus over an extended period
- **Reaction time**: Speed of visual-motor response processing
- **Alertness**: General state of physiological readiness
- **Vigilance decrement**: The decline in performance over time (a well-documented phenomenon)

### Scientific Validity

The PVT is considered the gold standard for sleep deprivation research. Key findings from the literature:

- Reaction time on the PVT is the most sensitive behavioral measure of sleep loss (Dinges et al., 1997)
- Lapses (responses greater than 500ms) are the primary metric for fatigue detection (Van Dongen et al., 2003)
- The PVT has excellent test-retest reliability (r > 0.8) (Dorrian et al., 2005)
- Individual differences in PVT performance are stable over time (Basner et al., 2011)

### Typical Metrics from Literature

| Metric | Definition | Significance |
|---|---|---|
| Mean RT | Average reaction time across all trials | General alertness |
| Median RT | Median reaction time | Robust central tendency |
| Fastest 10% | Average of fastest 10% of responses | Peak capability |
| Slowest 10% | Average of slowest 10% of responses | Attention lapses |
| Lapses | Count of responses greater than 500ms | Fatigue indicator |
| False starts | Responses before stimulus onset | Impulsivity/anticipation |

### Our Adaptation

The FOCUS RLT adapts the PVT for consumer use with the following modifications:

| Aspect | Original PVT | FOCUS RLT |
|---|---|---|
| Duration | 10 minutes | 30-120 seconds |
| Trials | ~100 | 10-60 (default: 30) |
| ISI range | 2-10 seconds | 2-10 seconds (same) |
| ISI distribution | Exponential | Exponential (same) |
| Stimulus | Countdown timer | Glowing orb |
| Feedback | None during test | Immediate per-trial |
| Setting | Laboratory | Mobile/web |

The ISI distribution is preserved exactly from the original PVT to maintain scientific validity. The primary change is session length, which is shortened for consumer engagement while remaining long enough for meaningful measurement.

---

## Game Design

### Core Loop

1. The game enters a brief preparation phase (3-second countdown)
2. A stimulus (glowing orb) appears on screen after a random interval
3. The user taps/clicks/presses as fast as possible
4. Immediate feedback is provided (visual + haptic)
5. After a brief inter-trial interval, the next stimulus appears
6. After all trials, the session results are displayed

### Session Structure

```
[Preparation: 3s countdown]
  → [Trial 1: ISI + Stimulus + Response + Feedback]
  → [Trial 2: ISI + Stimulus + Response + Feedback]
  → [...]
  → [Trial N: ISI + Stimulus + Response + Feedback]
  → [Results Screen: Score breakdown + XP earned]
```

### Input Methods

The game supports multiple input methods depending on platform:

| Platform | Primary Input | Secondary Input |
|---|---|---|
| iOS | Tap anywhere on screen | — |
| Android | Tap anywhere on screen | — |
| Web (touch) | Tap anywhere on screen | — |
| Web (mouse) | Click anywhere on screen | — |
| Web (keyboard) | Spacebar | Enter, Z, / (configurable) |

The entire screen is the response area on touch devices to minimize the time between perceiving the stimulus and initiating a response. On desktop, both mouse click and keyboard press are accepted simultaneously.

### Game Configuration

```typescript
const ReactionLightConfig: Game = {
  id: 'reaction-light-test',
  version: '1.0.0',
  name: 'Reaction Light Test',
  description: 'Measure your reaction time and sustained attention',
  category: GameCategory.REACTION,
  capabilities: [Capability.REACTION_TIME, Capability.SUSTAINED_ATTENTION, Capability.CONSISTENCY],
  calibration: {
    enabled: true,
    practiceTrials: 5,
    calibrationTrials: 10,
    recalibrateAfterDays: 7,
    crossGameCalibration: false,
    calibrationThreshold: 0.2
  },
  adaptation: {
    enabled: true,
    algorithm: 'adaptive_staircase',
    parameters: {
      meanISI: 4000,
      minISI: 2000,
      maxISI: 10000,
      jitterRange: 200,
      responseWindow: 5000
    },
    adaptationRate: 0.05,
    floorEffect: 0.1,
    ceilingEffect: 0.9,
    fatigueAware: true,
    timeOfDayAware: true
  },
  scoring: {
    formula: 'reaction_light_v1',
    weights: {
      reactionTime: 0.35,
      consistency: 0.25,
      accuracy: 0.20,
      endurance: 0.20
    },
    normalization: 'population',
    maxScore: 1000,
    minScore: 0,
    penaltyRules: [
      { trigger: 'false_start', amount: 5, maxApplication: 3 },
      { trigger: 'miss', amount: 3, maxApplication: 10 },
      { trigger: 'lapse', amount: 2, maxApplication: 10 }
    ],
    bonusRules: [
      { trigger: 'streak_3', amount: 5, maxApplication: 1 },
      { trigger: 'streak_5', amount: 10, maxApplication: 1 },
      { trigger: 'all_valid', amount: 10, maxApplication: 1 }
    ]
  },
  sessions: {
    minTrials: 10,
    maxTrials: 60,
    defaultTrials: 30,
    minDurationMs: 30000,
    maxDurationMs: 120000,
    defaultDurationMs: 90000,
    trialTimeoutMs: 5000,
    allowPause: true,
    allowEarlyEnd: true
  },
  icon: 'reaction-light',
  minLevel: 1,
  isPremium: false,
  tags: ['reaction', 'attention', 'speed', 'pvt', 'focus']
};
```

---

## Timing Algorithm

### Inter-Stimulus Interval (ISI) Generation

The ISI is the time between the user's response (or timeout) and the next stimulus appearance. The ISI distribution is critical for preventing memorization and maintaining scientific validity.

**ISI Parameters:**
- Minimum: 2000ms (prevents anticipation)
- Maximum: 10000ms (prevents boredom)
- Mean: 4000ms
- Lambda: 1/4000

### Why Exponential Distribution

The ISI follows an exponential distribution for the following reasons:

1. **Human attention cannot predict the next stimulus.** An exponential distribution has no regularity — it is memoryless. The probability of a stimulus appearing in the next millisecond is constant regardless of how long the user has been waiting. This prevents the user from developing a rhythm.

2. **Short intervals occur naturally.** The exponential distribution produces some short intervals (2000-3000ms), which prevent the user from disengaging during long waits. These short intervals keep the user alert.

3. **Long intervals build anticipation without resolution.** Occasionally, the user waits 8000-10000ms. During this time, anticipation builds, which can lead to false starts when the user can no longer wait. This is a natural and desirable feature — it measures impulse control.

4. **Matches real-world distributions.** The exponential distribution models real-world event arrival times (e.g., time between customer arrivals, time between signal appearances in real environments). This makes the measurement more ecologically valid.

5. **Prevents rhythmic entrainment.** The human brain is excellent at detecting patterns. Even a uniform distribution allows approximate prediction (the user knows the stimulus will appear within the range). An exponential distribution has no such predictability.

### Why NOT Uniform Distribution

A uniform distribution over [2000, 10000] would:
- Allow the user to predict that the average wait is 6000ms
- Create an approximate rhythm (the user adapts to the "average" interval)
- Reduce sustained attention requirements (the user can time-box their attention)
- Produce a bimodal response pattern (responding at approximately 2000ms or 8000ms)

### Why NOT Fixed Interval

A fixed interval (e.g., exactly 4000ms) would:
- Allow complete memorization within 3-5 trials
- Eliminate sustained attention requirements entirely
- Invalidates the scientific measurement
- Produce near-perfect performance from all users (ceiling effect)

### Implementation

```typescript
function generateISI(config: AdaptationConfig): number {
  const { meanISI, minISI, maxISI, jitterRange } = config.parameters;
  const lambda = 1 / meanISI;

  let isi: number;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Inverse CDF method: isi = -ln(1 - u) / lambda
    const u = Math.random();
    isi = -Math.log(1 - u) / lambda;

    // Add jitter: ±jitterRange ms uniform random
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    isi = isi + jitter;

    // Clamp to [minISI, maxISI]
    isi = Math.max(minISI, Math.min(maxISI, isi));

    attempts++;
  } while (attempts < maxAttempts);

  return isi;
}
```

**Rejection sampling note:** The `do-while` loop with rejection sampling ensures that the final ISI always falls within [minISI, maxISI]. The clamping naturally introduces some probability mass at the boundaries, but this is acceptable for consumer use. For research-grade implementations, rejection sampling would discard out-of-range samples and resample.

---

## Response Windows

### Response Timing Rules

| Condition | Timing | Result |
|---|---|---|
| Valid response | ISI + 100ms to ISI + 5000ms after stimulus | Scored normally |
| False start | Response before stimulus onset | Penalty applied, trial marked |
| Lapse | Response time greater than 500ms | Scored with penalty (scientific threshold) |
| Miss | No response within 5000ms window | Maximum penalty |
| Multiple responses | Only first response counted | Extra responses logged but not scored |

### Response Window Logic

```typescript
function evaluateResponse(
  stimulusOnset: number,
  responseTimestamp: number,
  isi: number
): {
  type: 'valid' | 'false_start' | 'lapse' | 'miss' | 'multiple';
  latencyMs: number | null;
} {
  const timeSinceStimulus = responseTimestamp - stimulusOnset;

  // False start: responded before stimulus appeared
  if (timeSinceStimulus < 0) {
    return { type: 'false_start', latencyMs: null };
  }

  // No response (handled by timeout, but checking here for clarity)
  if (responseTimestamp === 0) {
    return { type: 'miss', latencyMs: null };
  }

  // Valid response within the window
  if (timeSinceStimulus >= 100 && timeSinceStimulus <= 5000) {
    const isLapse = timeSinceStimulus > 500;
    return {
      type: isLapse ? 'lapse' : 'valid',
      latencyMs: timeSinceStimulus
    };
  }

  // Response outside valid window (shouldn't happen with proper timeout)
  return { type: 'miss', latencyMs: null };
}
```

### False Start Handling

When a false start is detected:
1. The trial is marked as `isFalseStart: true`
2. The stimulus remains on screen (or reappears)
3. The user must respond again to the same stimulus
4. A false start penalty is applied to the score
5. The false start event is logged for anti-cheat analysis

### Miss Handling

When a miss occurs (no response within 5000ms):
1. The trial is marked as `isMiss: true`
2. A low "attention" tone plays to alert the user
3. The game moves to the next trial after the inter-trial interval
4. The miss penalty is applied to the score

---

## Scoring Formula

### Score Components

The RLT score is computed from four components, each on a 0-100 scale.

### 1. Reaction Time Score (RTS)

The reaction time score uses a piecewise linear function that rewards fast responses with diminishing returns:

```typescript
function computeReactionTimeScore(rt: number): number {
  if (rt <= 150) return 100;  // Physiological minimum, likely anticipation
  if (rt <= 200) return 95 + (200 - rt) / 10;      // 95-100
  if (rt <= 300) return 80 + (300 - rt) / 6.67;    // 80-95
  if (rt <= 400) return 60 + (400 - rt) / 5;       // 60-80
  if (rt <= 500) return 30 + (500 - rt) / 3.33;    // 30-60
  return Math.max(0, 30 - (rt - 500) / 10);        // 0-30
}
```

**Piecewise function rationale:**
- 150ms: Absolute physiological minimum for visual reaction time. Responses faster than this are likely anticipatory (the user started moving before seeing the stimulus). They are scored at 100 but flagged for analysis.
- 150-200ms: Exceptional performance. Very few humans can consistently achieve this range.
- 200-300ms: Excellent performance. This is the range of elite athletes and pilots.
- 300-400ms: Good performance. Average for alert, attentive adults.
- 400-500ms: Below average. May indicate mild fatigue or distraction.
- Greater than 500ms: Lapse territory. The scientific threshold for attention lapses.

The final score for a session is the **median** of all valid trial RTS values. Median is used instead of mean because it is robust to outliers (a single very slow response does not significantly affect the median).

### 2. Consistency Score (CS)

Consistency measures how stable the user's reaction times are across trials:

```typescript
function computeConsistencyScore(standardDeviation: number): number {
  if (standardDeviation <= 20) return 100;
  if (standardDeviation <= 50) return 100 - (standardDeviation - 20) * 1.11;
  if (standardDeviation <= 100) return 67 - (standardDeviation - 50) * 0.84;
  return Math.max(0, 25 - (standardDeviation - 100) * 0.25);
}
```

**Why consistency matters:** A user with a median RT of 280ms and SD of 15ms is more focused than a user with a median RT of 280ms and SD of 80ms. The second user likely has periods of inattention mixed with periods of sharp focus. Consistency is a strong indicator of sustained attention quality.

### 3. Accuracy Score (AS)

Accuracy measures the proportion of valid responses:

```typescript
function computeAccuracyScore(trials: Trial[]): number {
  const totalTrials = trials.length;
  const validTrials = trials.filter(t =>
    !t.result.isMiss && !t.result.isFalseStart
  ).length;

  return (validTrials / totalTrials) * 100;
}
```

### 4. Endurance Score (ES)

Endurance measures whether performance degrades over the session:

```typescript
function computeEnduranceScore(trials: Trial[]): number {
  const validTrials = trials.filter(t => t.result.reactionTimeMs !== null);

  if (validTrials.length < 10) return 100; // Not enough data

  const firstFive = validTrials.slice(0, 5).map(t => t.result.reactionTimeMs!);
  const lastFive = validTrials.slice(-5).map(t => t.result.reactionTimeMs!);

  const firstAvg = firstFive.reduce((a, b) => a + b) / firstFive.length;
  const lastAvg = lastFive.reduce((a, b) => a + b) / lastFive.length;

  return 100 * (1 - Math.max(0, (lastAvg - firstAvg) / firstAvg));
}
```

**Endurance interpretation:**
- 100: Performance did not decline (or improved)
- 80: Last 5 trials were 20% slower than first 5
- 50: Last 5 trials were 50% slower than first 5
- 0: Last 5 trials were 100%+ slower than first 5

### 5. Focus Score (Composite)

```typescript
function computeFocusScore(components: {
  rts: number;
  cs: number;
  as: number;
  es: number;
}): number {
  return (components.rts * 0.35) + (components.cs * 0.25) +
         (components.as * 0.20) + (components.es * 0.20);
}
```

**Weight rationale:**
- Reaction Time (35%): The primary metric of the game, but not the only important factor
- Consistency (25%): Second most important — sustained attention quality
- Accuracy (20%): Important but less variable across users
- Endurance (20%): Important for longer sessions, less relevant for short ones

### 6. Session Score

```typescript
function computeSessionScore(
  focusScore: number,
  trialCount: number
): number {
  let multiplier: number;
  if (trialCount <= 10) multiplier = 0.5;
  else if (trialCount <= 20) multiplier = 0.75;
  else if (trialCount <= 30) multiplier = 1.0;
  else multiplier = 1.5;

  return Math.round(focusScore * multiplier);
}
```

**Multiplier rationale:** Longer sessions should produce higher scores because they require more sustained effort. The multiplier ranges from 0.5x (10 trials) to 1.5x (60 trials), with 30 trials as the baseline (1.0x).

### 7. XP Calculation

```typescript
function computeXP(sessionScore: number, streakDays: number): number {
  const baseXP = Math.floor(sessionScore / 10);
  const streakBonus = Math.min(streakDays * 2, 20);
  return baseXP + streakBonus;
}
```

---

## Difficulty Adaptation

### Adaptation Strategy

The RLT uses an adaptive staircase algorithm that adjusts the ISI distribution based on the user's rolling average performance over the last 20 sessions.

### Adaptation Rules

| Condition | Action | Effect |
|---|---|---|
| Average RT less than 250ms | Increase mean ISI to 4500ms | Longer waits, harder to sustain |
| Average RT greater than 400ms | Decrease mean ISI to 3500ms | Shorter waits, easier |
| Consistency SD greater than 80ms | Narrow ISI range | More predictable intervals |
| Consistency SD less than 30ms | Widen ISI range | Less predictable intervals |
| Improvement trend detected | Increase mean ISI by 5% | Slightly harder |
| Decline trend detected | Decrease mean ISI by 5% | Slightly easier |

### Adaptation Rate Limiting

Maximum adjustment per session is 5% to prevent whiplash. The adaptation engine applies a smoothing function:

```typescript
function adaptDifficulty(
  currentParams: ISIParams,
  performance: PerformanceMetrics,
  config: AdaptationConfig
): ISIParams {
  let targetMeanISI = 4000; // Default

  if (performance.averageRT < 250) {
    targetMeanISI = 4500;
  } else if (performance.averageRT > 400) {
    targetMeanISI = 3500;
  }

  // Smooth transition
  const maxDelta = config.parameters.meanISI * config.adaptationRate;
  const delta = Math.max(-maxDelta, Math.min(maxDelta, targetMeanISI - currentParams.meanISI));

  return {
    ...currentParams,
    meanISI: currentParams.meanISI + delta
  };
}
```

---

## Calibration Protocol

### Calibration Phases

**Phase 1: Practice (5 trials, unscored)**
- The user sees a brief tutorial explaining the task
- 5 practice trials run with the default ISI
- After each trial, feedback shows the response time
- These trials are not included in any score or calibration
- Purpose: Ensure the user understands the task

**Phase 2: Calibration (10 trials, scored but marked)**
- 10 trials run with the default ISI (4000ms mean)
- Each trial is scored normally
- These scores are stored as calibration data
- No adaptation occurs during calibration

**Phase 3: Calibration Result**
- Compute median RT of the 10 calibration trials
- Compute standard deviation of the 10 calibration trials
- Determine initial difficulty level:

```typescript
function determineCalibrationLevel(medianRT: number): 'beginner' | 'intermediate' | 'advanced' {
  if (medianRT > 400) return 'beginner';
  if (medianRT < 250) return 'advanced';
  return 'intermediate';
}
```

### Recalibration Triggers

- After 7 days of inactivity: Optional recalibration prompt
- After 30 days: Recommended recalibration
- After 90 days: Required recalibration (calibration data archived)
- User-initiated recalibration from settings

---

## Fatigue Detection

### Within-Session Fatigue

The game monitors performance degradation within a session by comparing the first 5 valid trials to the last 5 valid trials:

```typescript
function detectWithinSessionFatigue(trials: Trial[]): {
  status: 'normal' | 'alert' | 'suggest_end';
  degradationPercent: number;
} {
  const validTrials = trials.filter(t => t.result.reactionTimeMs !== null);
  if (validTrials.length < 10) {
    return { status: 'normal', degradationPercent: 0 };
  }

  const first5 = validTrials.slice(0, 5).map(t => t.result.reactionTimeMs!);
  const last5 = validTrials.slice(-5).map(t => t.result.reactionTimeMs!);

  const firstAvg = first5.reduce((a, b) => a + b) / 5;
  const lastAvg = last5.reduce((a, b) => a + b) / 5;

  const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;

  if (degradation > 30) {
    return { status: 'suggest_end', degradationPercent: degradation };
  }
  if (degradation > 15) {
    return { status: 'alert', degradationPercent: degradation };
  }
  return { status: 'normal', degradationPercent: degradation };
}
```

### Cross-Session Fatigue

The game compares the current session's average RT to the user's historical average (last 20 sessions). If the current session is more than 15% slower, a fatigue indicator is shown. If more than 30% slower, the user is suggested to end the session.

### Fatigue Data Storage

Fatigue data is stored for longitudinal analysis:
- Within-session degradation percentage
- Time of day of the session
- Day of week
- Historical fatigue patterns

This data feeds into the Adaptation Engine's time-of-day adjustment feature.

---

## Screen Layout

### Mobile Layout (Portrait)

```
┌──────────────────────────┐
│ Score: 850    Trial: 15/30│  ← Top bar (score + trial counter)
│                          │
│                          │
│                          │
│                          │
│        ┌────────┐        │  ← Stimulus area (center)
│        │  ORB   │        │
│        └────────┘        │
│                          │
│                          │
│                          │
│                          │
│ 🔥 7-day streak          │  ← Bottom bar (streak + timer)
└──────────────────────────┘
```

### Mobile Layout (Landscape)

```
┌────────────────────────────────────────┐
│ Score: 850   │       ORB       │ 15/30│
│ 🔥 7-day    │                 │ Timer│
└────────────────────────────────────────┘
```

### Desktop Layout

```
┌──────────────────────────────────────────────┐
│  Reaction Light Test          Score: 850     │
│                                              │
│                    ┌────────┐                │
│                    │  ORB   │                │
│                    └────────┘                │
│                                              │
│  Trial 15/30          🔥 7-day streak        │
│  [Pause]                          [End]      │
└──────────────────────────────────────────────┘
```

### Component Specifications

| Component | Mobile Size | Desktop Size | Minimum Touch Target |
|---|---|---|---|
| Stimulus (resting) | 80dp diameter | 100dp diameter | 44dp |
| Stimulus (active) | 120dp diameter | 140dp diameter | 44dp |
| Score display | 16sp | 20sp | — |
| Trial counter | 14sp | 16sp | — |
| Streak indicator | 14sp | 16sp | — |
| Pause button | 44dp x 44dp | 44dp x 44dp | 44dp |
| End button | 44dp x 44dp | 44dp x 44dp | 44dp |

---

## Visual Design

### Stimulus States

The stimulus (glowing orb) has two visual states:

**Resting State:**
- Subtle pulse animation (breathing effect)
- Color: Cool blue (#4A90D9)
- Opacity: 0.6
- Scale: 80dp
- Animation: Slow sine wave pulse (2s period, scale 0.95 to 1.05)

**Active State (after stimulus appears):**
- Bright glow with particle burst
- Color: Warm amber (#F5A623)
- Opacity: 1.0
- Scale: 120dp (expanding from 80dp)
- Animation: 200ms expansion, particle burst (12 particles, random radial direction, 400ms lifetime)

**Response Feedback States:**

| Response Time | Color | Effect |
|---|---|---|
| Less than 250ms | Green (#7ED321) | Elastic shrink, particle burst |
| 250-400ms | Yellow (#F8E71C) | Smooth shrink |
| Greater than 400ms | Red (#D0021B) | Slow shrink, no particles |
| Miss | Gray (#9B9B9B) | Fade out, shake |
| False start | Orange (#FF6B35) | Shake, brief flash |

### Background

- Dark theme: #1A1A2E (deep navy)
- Gradient: Subtle radial gradient from center (#1A1A2E) to edges (#0F0F23)
- Purpose: High contrast with the stimulus, reduces eye strain

---

## Animations

### Stimulus Appearance

The stimulus appears with a spring physics animation:
- Scale: 0 to 1
- Spring stiffness: 300
- Spring damping: 20
- Duration: Approximately 200ms (spring-determined, not fixed)

### Response Feedback Ripple

When the user responds, a ripple effect emanates from the touch/click point:
- Color: Matches response quality (green/yellow/red)
- Radius: Expands from 0 to 200dp
- Opacity: Fades from 0.5 to 0
- Duration: 300ms

### Score Increment

The score counter animates using a number roll-up effect:
- Numbers count up from 0 to final score
- Duration: 500ms (eased)
- Font: Monospace for stable width

### Miss Shake

When a miss occurs:
- Horizontal shake: 3px amplitude
- Duration: 200ms
- Easing: Ease-out

### Level Up

When the user levels up after a session:
- Full-screen particle celebration (50 particles, 1s lifetime)
- Level number scales up with spring animation
- "Level Up!" text fades in from below

### Streak Maintained

When the daily streak is maintained:
- Flame animation on the streak counter
- 3 flame particles, rising, 500ms lifetime
- Streak number pulses (scale 1.0 to 1.2 and back)

---

## Sound Design

### Stimulus Sounds

| Event | Sound | Frequency | Duration | Envelope |
|---|---|---|---|---|
| Stimulus appear | Short "ping" | 440Hz sine | 50ms attack, 100ms decay | Fast attack, medium decay |
| Fast response (<250ms) | Bright "success" | Ascending major third | 150ms | Fast attack, slow decay |
| Medium response (250-400ms) | Neutral "acknowledged" | 330Hz sine | 100ms | Medium attack, medium decay |
| Slow response (>400ms) | Soft "notice" | Descending minor second | 200ms | Slow attack, fast decay |
| Miss | Low "attention" tone | 200Hz sine | 300ms | Fast attack, slow decay |
| Session complete | Achievement jingle | C-E-G arpeggio | 500ms | Sequential notes |
| Level up | Orchestral sting | Major chord swell | 800ms | Crescendo |

### Audio Implementation

```typescript
class GameAudio {
  private audioContext: AudioContext;

  playStimulusSound(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  playResponseSound(reactionTimeMs: number): void {
    if (reactionTimeMs < 250) {
      this.playTone(523.25, 0.3, 0.15); // C5, ascending major third
    } else if (reactionTimeMs < 400) {
      this.playTone(329.63, 0.3, 0.1);  // E4, neutral
    } else {
      this.playTone(277.18, 0.2, 0.2);  // C#4, descending
    }
  }

  private playTone(frequency: number, volume: number, duration: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}
```

---

## Haptic Design

### Haptic Events

| Event | iOS (UIImpactFeedbackGenerator) | Android (HapticFeedbackConstants) | Duration |
|---|---|---|---|
| Stimulus appear | `.light` | `VIRTUAL_KEY` | 10ms |
| Fast response | `.medium` | `CLOCK_TICK` | 20ms |
| Medium response | `.light` | `KEYBOARD_TAP` | 10ms |
| Slow response | None | None | — |
| Miss | `.error` (UINotificationFeedbackGenerator) | `REJECT` | 30ms |
| Level up | `.success` pattern (3 taps) | `CONFIRM` pattern | 50ms x3 |

### Haptic Implementation

```typescript
class GameHaptic {
  triggerStimulusHaptic(): void {
    if (Platform.OS === 'ios') {
      const generator = new UIImpactFeedbackGenerator('light');
      generator.impactOccurred();
    } else if (Platform.OS === 'android') {
      ReactNativeHapticFeedback.trigger('virtualKeyKey');
    }
  }

  triggerResponseHaptic(reactionTimeMs: number): void {
    if (reactionTimeMs > 400) return; // No haptic for slow responses

    if (Platform.OS === 'ios') {
      const style = reactionTimeMs < 250 ? 'medium' : 'light';
      const generator = new UIImpactFeedbackGenerator(style);
      generator.impactOccurred();
    } else {
      const type = reactionTimeMs < 250 ? 'clockTick' : 'keyboardTap';
      ReactNativeHapticFeedback.trigger(type);
    }
  }
}
```

---

## Data Schema

### Database Tables

```sql
-- Game sessions for Reaction Light Test
CREATE TABLE reaction_light_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_version TEXT NOT NULL DEFAULT '1.0.0',
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  trial_count INTEGER NOT NULL,
  score_total INTEGER,
  score_reaction_time NUMERIC,
  score_consistency NUMERIC,
  score_accuracy NUMERIC,
  score_endurance NUMERIC,
  score_composite NUMERIC,
  mean_rt NUMERIC,
  median_rt NUMERIC,
  sd_rt NUMERIC,
  fastest_10_percent NUMERIC,
  slowest_10_percent NUMERIC,
  lapses INTEGER DEFAULT 0,
  false_starts INTEGER DEFAULT 0,
  misses INTEGER DEFAULT 0,
  percentile INTEGER,
  rating INTEGER,
  rating_delta INTEGER,
  adaptation_state JSONB,
  calibration_id UUID,
  fatigue_degradation NUMERIC,
  time_of_day INTEGER,
  day_of_week INTEGER,
  device_info JSONB,
  client_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual trial data
CREATE TABLE reaction_light_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES reaction_light_sessions(id) ON DELETE CASCADE,
  trial_index INTEGER NOT NULL,
  isi_ms INTEGER NOT NULL,
  scheduled_onset REAL NOT NULL,
  actual_onset REAL NOT NULL,
  response_time_ms NUMERIC,
  is_correct BOOLEAN,
  is_miss BOOLEAN DEFAULT false,
  is_false_start BOOLEAN DEFAULT false,
  is_lapse BOOLEAN DEFAULT false,
  response_type TEXT,
  input_type TEXT,
  timing_drift REAL,
  adaptation_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rls_user ON reaction_light_sessions(user_id, created_at DESC);
CREATE INDEX idx_rls_score ON reaction_light_sessions(score_total DESC);
CREATE INDEX idx_rlt_session ON reaction_light_trials(session_id, trial_index);
```

---

## Accessibility

### Accessibility Features

| Feature | Implementation |
|---|---|
| Color blind mode | Stimulus uses shape + color (circle + glow); never color alone |
| Reduced motion | Disable spring animations; use simple fade transitions |
| Screen reader | Announce "Stimulus appeared" and "Response recorded" via aria-live |
| Keyboard navigation | Spacebar, Enter, Z, / keys configurable as response keys |
| High contrast | Stimulus uses white (#FFFFFF) on dark background |
| Haptic alternatives | All haptic feedback has visual + audio equivalents |
| Font scaling | All text respects system font size |
| Audio alternatives | All audio cues have visual equivalents |

### Accessibility Settings

All accessibility features are available from the first level and are never locked behind progression. They are toggled in the game settings panel:

```typescript
interface AccessibilitySettings {
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  screenReaderMode: boolean;
  highContrast: boolean;
  responseKeys: string[];
  fontScale: number;
}
```

---

## Edge Cases

### Handled Scenarios

1. **User closes tab during session**: Session is saved locally, synced on next visit
2. **User receives a phone call during session**: Session is paused automatically, resumes after call ends
3. **User rotates device mid-session**: Layout adapts, no timing disruption (stimulus is hidden during rotation)
4. **Low battery warning**: Session completes current trial, then prompts to save and exit
5. **Network loss during score submission**: Score is queued locally, synced when online
6. **User responds multiple times to one stimulus**: Only the first response is scored; extras are logged
7. **Very fast response (<50ms)**: Trial is flagged as suspicious, score is capped at 100 but flagged for review
8. **All trials are misses**: Score is 0, user receives encouraging message
9. **Session interrupted by crash**: Last completed trial is the final data point; partial session is recoverable
10. **Calibration data missing**: Full calibration runs before first session

---

## Testing

### Unit Tests

```typescript
describe('Reaction Light Test', () => {
  describe('ISI Generation', () => {
    it('generates ISIs within [2000, 10000] range', () => {
      for (let i = 0; i < 1000; i++) {
        const isi = generateISI(defaultConfig);
        expect(isi).toBeGreaterThanOrEqual(2000);
        expect(isi).toBeLessThanOrEqual(10000);
      }
    });

    it('produces approximately exponential distribution', () => {
      const isis = Array.from({ length: 10000 }, () => generateISI(defaultConfig));
      const mean = isis.reduce((a, b) => a + b) / isis.length;
      expect(Math.abs(mean - 4000)).toBeLessThan(200); // Within 5% of expected
    });
  });

  describe('Scoring', () => {
    it('returns 100 for RT <= 150ms', () => {
      expect(computeReactionTimeScore(100)).toBe(100);
      expect(computeReactionTimeScore(150)).toBe(100);
    });

    it('returns 0 for RT > 1200ms', () => {
      expect(computeReactionTimeScore(1200)).toBe(0);
    });

    it('decreases monotonically', () => {
      const scores = [200, 250, 300, 350, 400, 450, 500, 600, 700, 800]
        .map(computeReactionTimeScore);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1]);
      }
    });
  });

  describe('Fatigue Detection', () => {
    it('detects fatigue when second half is 20% slower', () => {
      const trials = createMockTrials([
        ...Array(15).fill(250),  // First half: fast
        ...Array(15).fill(325)   // Second half: 30% slower
      ]);
      const result = detectWithinSessionFatigue(trials);
      expect(result.status).toBe('alert');
    });

    it('does not flag normal sessions', () => {
      const trials = createMockTrials(Array(30).fill(280));
      const result = detectWithinSessionFatigue(trials);
      expect(result.status).toBe('normal');
    });
  });
});
```

### Integration Tests

- Full session lifecycle: start, 30 trials, score computation, result display
- Calibration flow: practice → calibration → result → difficulty adjustment
- Offline session: complete session offline, sync when online, verify data integrity
- Score submission: submit score, verify anti-cheat checks pass
