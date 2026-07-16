# Chapter 06: Game Engine Architecture

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Game Engine Core Package](#game-engine-core-package)
4. [Game Interface and Type System](#game-interface-and-type-system)
5. [State Machines](#state-machines)
6. [Timing Engine](#timing-engine)
7. [Score Engine](#score-engine)
8. [Calibration Engine](#calibration-engine)
9. [Adaptation Engine](#adaptation-engine)
10. [Anti-Cheat Engine](#anti-cheat-engine)
11. [Offline Engine](#offline-engine)
12. [Event System](#event-system)
13. [Plugin Architecture](#plugin-architecture)
14. [Rendering and UI](#rendering-and-ui)
15. [Audio Engine](#audio-engine)
16. [Haptic Engine](#haptic-engine)
17. [Performance Optimization](#performance-optimization)
18. [Testing Strategy](#testing-strategy)

---

## Overview

The Game Engine is the central nervous system of the FOCUS platform. It is not a single monolithic component but a carefully designed set of packages, interfaces, and protocols that enable any number of cognitive training games to be built with shared infrastructure.

The architectural philosophy is that of a **game framework**: we provide the skeleton, the plumbing, and the shared services. Individual games provide the content, the rules, and the user experience. This separation means that adding a new game to the FOCUS platform should require only implementing a new game module — zero changes to the engine itself.

This chapter defines every component of the Game Engine in exhaustive detail. Every decision is documented with its rationale. Every interface is specified with TypeScript types. Every algorithm is described with pseudocode.

The Game Engine is implemented as a monorepo package at `packages/game-engine`. It has no UI dependencies and can be used in any JavaScript runtime (browser, Node.js, Deno, React Native).

---

## Core Concepts

### Terminology

The following terms are used consistently throughout the platform:

**Game**: A cognitive training module. Each game measures one or more cognitive capabilities (e.g., reaction time, working memory, spatial reasoning). Games are identified by a UUID and have a version number. Examples: Reaction Light Test, N-Back Task, Stroop Test.

**Session**: A single play session of a game. A session has a start time, an end time, and contains one or more trials. Sessions are the primary unit of data storage and analysis. Each session produces a score.

**Trial**: A single attempt or round within a session. A trial presents one or more stimuli, collects one or more responses, and produces a trial-level result. For example, in the Reaction Light Test, one trial equals one stimulus presentation plus one response.

**Event**: A timestamped occurrence within a trial. Events are the most granular data unit. Examples: `stimulus_shown`, `response_received`, `feedback_displayed`. Events are used for detailed analysis, anti-cheat verification, and research.

**Score**: A computed result from a session. Scores are derived from trial results using configurable scoring formulas. Scores are normalized, comparable across sessions, and used for progression.

**Calibration**: An initial skill assessment that establishes a baseline for a user's capabilities. Calibration data is used to set initial difficulty levels and provide meaningful feedback (e.g., "You're faster than 80% of users").

**Adaptation**: Dynamic difficulty adjustment during gameplay. The adaptation engine modifies game parameters in real-time based on the user's performance within and across sessions.

**Capability**: A measurable cognitive ability. Each game maps to one or more capabilities. Capabilities are tracked across games using an ELO-like rating system. Examples: `reaction_time`, `sustained_attention`, `working_memory`, `inhibitory_control`.

### Data Flow

```
User Input → Game Module → Game Engine Core → Event Collector
                              ↓                      ↓
                        Score Engine          Event Store (local)
                              ↓                      ↓
                        Score Object          Sync Engine → Server
                              ↓
                        Progression Engine → XP, Achievements
```

### Package Structure

```
packages/
├── game-engine/              # Core engine (no UI)
│   ├── src/
│   │   ├── registry/         # Game registration and discovery
│   │   ├── lifecycle/        # State machine management
│   │   ├── trial/            # Trial sequencing and management
│   │   ├── timing/           # High-precision timing
│   │   ├── scoring/          # Score computation
│   │   ├── calibration/      # Initial skill assessment
│   │   ├── adaptation/       # Dynamic difficulty adjustment
│   │   ├── events/           # Event collection and dispatch
│   │   ├── anticheat/        # Cheat detection
│   │   ├── offline/          # Offline gameplay and sync
│   │   └── types/            # TypeScript type definitions
│   └── package.json
├── game-ui/                  # Shared UI components
│   ├── src/
│   │   ├── components/       # Shared game components
│   │   ├── hooks/            # Shared React hooks
│   │   ├── animations/       # Shared animation utilities
│   │   └── themes/           # Game-specific themes
│   └── package.json
├── games/
│   ├── reaction-light/       # Game 01: Reaction Light Test
│   ├── n-back/               # Game 02: N-Back Task
│   ├── stroop/               # Game 03: Stroop Test
│   └── ...                   # Future games
└── shared/
    ├── audio-engine/         # Shared audio system
    └── haptic-engine/        # Shared haptic feedback system
```

---

## Game Engine Core Package

### Package Responsibilities

The `packages/game-engine` package provides:

1. **GameRegistry**: Registration, discovery, and metadata management for all games
2. **GameLifecycle**: State machine that controls the flow of game sessions
3. **TrialManager**: Manages the sequence of trials within a session
4. **TimingEngine**: High-precision timing for stimulus presentation and response measurement
5. **ScoreEngine**: Configurable score computation with multiple formula support
6. **CalibrationEngine**: Initial skill assessment and baseline establishment
7. **AdaptationEngine**: Dynamic difficulty adjustment based on performance
8. **EventCollector**: Captures, timestamps, and stores all game events
9. **AntiCheatEngine**: Detects suspicious patterns and prevents score manipulation
10. **OfflineEngine**: Manages offline gameplay, local storage, and server synchronization

### Dependencies

The Game Engine has minimal dependencies:

- `zod`: Schema validation for game configurations
- `uuid`: UUID generation for sessions, trials, events
- No UI framework dependency (React integration is in `game-ui`)

### Import Structure

```typescript
// External consumers import from the package root
import {
  GameRegistry,
  GameLifecycle,
  ScoreEngine,
} from '@focus/game-engine';

// Internal modules import directly
import { TimingEngine } from './timing/engine';
import { EventCollector } from './events/collector';
```

---

## Game Interface and Type System

### Game Category

```typescript
enum GameCategory {
  REACTION = 'reaction',
  MEMORY = 'memory',
  ATTENTION = 'attention',
  EXECUTIVE = 'executive',
  SPATIAL = 'spatial',
  LANGUAGE = 'language',
  MULTITASKING = 'multitasking',
}
```

### Capability

```typescript
enum Capability {
  REACTION_TIME = 'reaction_time',
  SUSTAINED_ATTENTION = 'sustained_attention',
  SELECTIVE_ATTENTION = 'selective_attention',
  WORKING_MEMORY = 'working_memory',
  LONG_TERM_MEMORY = 'long_term_memory',
  INHIBITORY_CONTROL = 'inhibitory_control',
  COGNITIVE_FLEXIBILITY = 'cognitive_flexibility',
  SPATIAL_REASONING = 'spatial_reasoning',
  PROCESSING_SPEED = 'processing_speed',
  ACCURACY = 'accuracy',
  CONSISTENCY = 'consistency',
  ENDURANCE = 'endurance',
}
```

### Game Configuration

```typescript
interface Game {
  id: string;
  version: string;
  name: string;
  description: string;
  category: GameCategory;
  capabilities: Capability[];
  calibration: CalibrationConfig;
  adaptation: AdaptationConfig;
  scoring: ScoringConfig;
  sessions: SessionConfig;
  render: React.ComponentType<GameProps>;
  icon: string;
  minLevel: number;
  isPremium: boolean;
  tags: string[];
}

interface CalibrationConfig {
  enabled: boolean;
  practiceTrials: number;
  calibrationTrials: number;
  recalibrateAfterDays: number;
  crossGameCalibration: boolean;
  calibrationThreshold: number;
}

interface AdaptationConfig {
  enabled: boolean;
  algorithm: 'elo' | 'adaptive_staircase' | 'custom';
  parameters: Record<string, number>;
  adaptationRate: number;
  floorEffect: number;
  ceilingEffect: number;
  fatigueAware: boolean;
  timeOfDayAware: boolean;
}

interface ScoringConfig {
  formula: string;
  weights: Record<string, number>;
  normalization: 'none' | 'population' | 'percentile';
  maxScore: number;
  minScore: number;
  penaltyRules: PenaltyRule[];
  bonusRules: BonusRule[];
}

interface SessionConfig {
  minTrials: number;
  maxTrials: number;
  defaultTrials: number;
  minDurationMs: number;
  maxDurationMs: number;
  defaultDurationMs: number;
  trialTimeoutMs: number;
  allowPause: boolean;
  allowEarlyEnd: boolean;
}
```

### Game Session

```typescript
interface GameSession {
  id: string;
  gameId: string;
  userId: string;
  startedAt: number;
  endedAt: number | null;
  state: SessionState;
  trials: Trial[];
  events: GameEvent[];
  score: GameScore | null;
  metadata: SessionMetadata;
  calibrationId: string | null;
  adaptationState: AdaptationState;
  deviceInfo: DeviceInfo;
  clientHash: string;
}

interface SessionMetadata {
  platform: 'web' | 'ios' | 'android' | 'desktop';
  appVersion: string;
  gameVersion: string;
  screenResolution: string;
  networkStatus: 'online' | 'offline';
  batteryLevel: number | null;
  performanceNowOffset: number;
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  userAgent: string;
  touchSupport: boolean;
  hapticSupport: boolean;
  audioSupport: boolean;
}
```

### Trial

```typescript
interface Trial {
  id: string;
  index: number;
  state: TrialState;
  stimuli: Stimulus[];
  responses: Response[];
  timing: TrialTiming;
  result: TrialResult;
  adaptationSnapshot: AdaptationState;
}

interface Stimulus {
  id: string;
  type: string;
  onsetTime: number;
  properties: Record<string, any>;
}

interface Response {
  id: string;
  stimulusId: string;
  inputType: 'tap' | 'key' | 'swipe' | 'voice' | 'none';
  inputValue: any;
  timestamp: number;
  latencyMs: number;
  isCorrect: boolean | null;
}

interface TrialTiming {
  scheduledOnset: number;
  actualOnset: number;
  responseWindow: number;
  interTrialInterval: number;
  totalTime: number;
  timingDrift: number;
}

interface TrialResult {
  score: number;
  isCorrect: boolean;
  reactionTimeMs: number | null;
  isMiss: boolean;
  isFalseStart: boolean;
  isLapse: boolean;
  metadata: Record<string, any>;
}
```

### Game Event

```typescript
interface GameEvent {
  id: string;
  sessionId: string;
  trialId: string | null;
  type: EventType;
  timestamp: number;
  serverTimestamp: number | null;
  data: Record<string, any>;
  integrity: string;
}

type EventType =
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'session_abandoned'
  | 'trial_started'
  | 'trial_completed'
  | 'trial_timeout'
  | 'stimulus_shown'
  | 'stimulus_hidden'
  | 'response_received'
  | 'response_evaluated'
  | 'feedback_shown'
  | 'calibration_started'
  | 'calibration_trial_completed'
  | 'calibration_completed'
  | 'adaptation_adjusted'
  | 'score_computed'
  | 'achievement_triggered'
  | 'level_up'
  | 'streak_maintained'
  | 'streak_broken'
  | 'error_occurred';
```

### Game Score

```typescript
interface GameScore {
  total: number;
  components: ScoreComponents;
  percentile: number | null;
  rating: number;
  ratingDelta: number;
  statistics: ScoreStatistics;
  computedAt: number;
}

interface ScoreComponents {
  reactionTime: number;
  consistency: number;
  accuracy: number;
  endurance: number;
  composite: number;
}

interface ScoreStatistics {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  fastest10Percent: number;
  slowest10Percent: number;
  lapses: number;
  falseStarts: number;
  misses: number;
  totalTrials: number;
  validTrials: number;
  sessionDurationMs: number;
}
```

---

## State Machines

### Game State Machine

The Game Lifecycle manages the overall state of a game session:

```
                    ┌─────────────┐
                    │    IDLE     │
                    └──────┬──────┘
                           │ start_game
                           ▼
                    ┌─────────────┐
                    │   LOADING   │
                    └──────┬──────┘
                           │ resources_loaded
                           ▼
                    ┌─────────────┐
               ┌───►│ CALIBRATING │───┐
               │    └──────┬──────┘   │
               │           │          │
               │  calibration_complete │
               │           ▼          │
               │    ┌─────────────┐   │
               │    │    READY    │◄──┘
               │    └──────┬──────┘
               │           │ start_session
               │           ▼
               │    ┌─────────────┐        ┌──────────┐
               │    │   PLAYING   │───────►│  PAUSED  │
               │    └──────┬──────┘◄───────└──────────┘
               │           │ resume
               │           │              pause
               │    ┌──────┴──────┐
               │    │             │
               │    ▼             ▼
               │ ┌───────┐  ┌─────────┐
               │ │END EARLY│  │ COMPLETED│
               │ └───────┘  └─────────┘
               │
               │ recalibrate
               └──────
```

**State definitions:**

| State | Description | Allowed Transitions |
|---|---|---|
| `IDLE` | No game session active | to `LOADING` |
| `LOADING` | Game resources being loaded | to `CALIBRATING`, `READY`, `ERROR` |
| `CALIBRATING` | Running calibration trials | to `READY`, `ERROR` |
| `READY` | Calibrated, ready to start | to `PLAYING` |
| `PLAYING` | Active gameplay | to `PAUSED`, `COMPLETED`, `ERROR` |
| `PAUSED` | Session paused by user | to `PLAYING`, `IDLE` |
| `COMPLETED` | Session finished normally | to `IDLE` |
| `ERROR` | Unrecoverable error | to `IDLE` |

### Session State Machine

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ CREATED  │────►│  ACTIVE  │────►│SYNCHRONIZING │────►│  SYNCED  │
└──────────┘     └──────────┘     └──────┬───────┘     └──────────┘
                        │                │
                        │                ▼
                        │         ┌──────────┐
                        │         │ CONFLICT │
                        │         └──────────┘
                        ▼
                  ┌──────────┐
                  │ ABANDONED│
                  └──────────┘
```

| State | Description |
|---|---|
| `CREATED` | Session record created, trials not yet started |
| `ACTIVE` | Session is in progress, data is being collected |
| `SYNCHRONIZING` | Session data is being synced to the server |
| `SYNCED` | All session data is confirmed stored on the server |
| `CONFLICT` | Sync conflict detected (offline mode) |
| `ABANDONED` | Session was ended prematurely |

### Trial State Machine

```
┌─────────┐     ┌──────────────────┐     ┌────────────────┐     ┌───────────┐
│ PENDING │────►│ STIMULUS_DISPLAYED│────►│ RESPONSE_WINDOW │────►│ EVALUATED │
└─────────┘     └──────────────────┘     └────────────────┘     └─────┬─────┘
       │                                                               │
       │              ┌──────────────┐                                  │
       └─────────────►│   TIMEOUT    │◄─────────────────────────────────┘
                      └──────────────┘
                      ┌──────────────┐
                      │  COMPLETED   │◄──────────────────────────────────┘
                      └──────────────┘
```

| State | Description |
|---|---|
| `PENDING` | Trial queued, not yet started |
| `STIMULUS_DISPLAYED` | Stimulus is visible, awaiting response |
| `RESPONSE_WINDOW` | Response window is open |
| `EVALUATED` | Response received and evaluated |
| `TIMEOUT` | No response within the allowed window |
| `COMPLETED` | Trial result recorded, ready for next trial |

### State Machine Implementation

```typescript
type GameStateTransition =
  | { from: 'IDLE'; to: 'LOADING'; trigger: 'start_game' }
  | { from: 'LOADING'; to: 'CALIBRATING'; trigger: 'resources_loaded' }
  | { from: 'LOADING'; to: 'READY'; trigger: 'skip_calibration' }
  | { from: 'LOADING'; to: 'ERROR'; trigger: 'error' }
  | { from: 'CALIBRATING'; to: 'READY'; trigger: 'calibration_complete' }
  | { from: 'CALIBRATING'; to: 'ERROR'; trigger: 'error' }
  | { from: 'READY'; to: 'PLAYING'; trigger: 'start_session' }
  | { from: 'PLAYING'; to: 'PAUSED'; trigger: 'pause' }
  | { from: 'PLAYING'; to: 'COMPLETED'; trigger: 'session_end' }
  | { from: 'PLAYING'; to: 'ERROR'; trigger: 'error' }
  | { from: 'PAUSED'; to: 'PLAYING'; trigger: 'resume' }
  | { from: 'PAUSED'; to: 'IDLE'; trigger: 'abandon' }
  | { from: 'COMPLETED'; to: 'IDLE'; trigger: 'dismiss' }
  | { from: 'ERROR'; to: 'IDLE'; trigger: 'reset' };

class StateMachine<S extends string, T extends string> {
  private state: S;
  private listeners: Map<S, Array<(state: S) => void>> = new Map();

  constructor(initialState: S) {
    this.state = initialState;
  }

  getState(): S {
    return this.state;
  }

  transition(trigger: T, from: S, to: S): void {
    if (this.state !== from) {
      throw new Error(
        `Invalid transition: cannot trigger "${trigger}" from state "${this.state}" (expected "${from}")`
      );
    }
    this.state = to;
    this.notifyListeners(to);
  }

  onEnter(state: S, callback: (state: S) => void): () => void {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, []);
    }
    this.listeners.get(state)!.push(callback);
    return () => {
      const callbacks = this.listeners.get(state)!;
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  private notifyListeners(state: S): void {
    const callbacks = this.listeners.get(state) || [];
    callbacks.forEach(cb => cb(state));
  }
}
```

---

## Timing Engine

### Requirements

The Timing Engine is the most critical component for scientific validity. It must:

1. Measure response times with millisecond precision
2. Schedule stimuli at precise intervals
3. Compensate for system clock drift
4. Handle frame-rate variations gracefully
5. Work consistently across devices and browsers
6. Detect and report timing anomalies

### Precision Timing

**`performance.now()`** is the primary timing source:
- Resolution: Sub-millisecond on modern hardware
- Monotonically increasing (not affected by system clock adjustments)
- Available in all modern browsers and React Native

**Why not `Date.now()`:** `Date.now()` has approximately 1ms resolution but is subject to system clock adjustments. NTP sync, daylight saving, and manual clock changes can cause jumps. `Date.now()` can go backward; `performance.now()` cannot.

**Why not `process.hrtime()` (Node.js):** Not available in browser environments. For server-side timing, `process.hrtime.bigint()` is used instead.

### Web Worker Timing

For timing-critical measurements, a dedicated Web Worker handles all timing operations. The main thread can be blocked by rendering, JavaScript execution, or garbage collection. A blocked main thread causes timing measurements to be inaccurate. The Web Worker runs on a separate thread, unaffected by main thread blocking. The Worker communicates timestamps via `postMessage`, which includes its own overhead that is compensated for during calibration.

**Worker implementation:**

```typescript
// timing-worker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, id, scheduledTime } = e.data;

  switch (type) {
    case 'schedule_stimulus': {
      const delay = scheduledTime - performance.now();
      if (delay <= 0) {
        self.postMessage({ type: 'stimulus_ready', id, actualTime: performance.now() });
      } else {
        const timerId = setTimeout(() => {
          self.postMessage({ type: 'stimulus_ready', id, actualTime: performance.now() });
        }, delay);
      }
      break;
    }
    case 'record_response': {
      self.postMessage({
        type: 'response_recorded',
        id,
        timestamp: performance.now()
      });
      break;
    }
  }
};
```

**Main thread communication:**

```typescript
class TimingEngine {
  private worker: Worker;
  private pendingMeasurements: Map<string, {
    resolve: (timestamp: number) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private measurementOverhead: number = 0;

  constructor() {
    this.worker = new Worker(
      new URL('./timing-worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.calibrateOverhead();
  }

  private async calibrateOverhead(): Promise<void> {
    const iterations = 100;
    const measurements: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const before = performance.now();
      await this.postToWorker({ type: 'ping' });
      const after = performance.now();
      measurements.push((after - before) / 2);
    }

    measurements.sort((a, b) => a - b);
    this.measurementOverhead = measurements[Math.floor(iterations / 2)];
  }

  getTimestamp(): number {
    return performance.now() - this.measurementOverhead;
  }

  scheduleStimulus(id: string, delayMs: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const scheduledTime = performance.now() + delayMs;
      this.pendingMeasurements.set(id, { resolve, reject });
      this.worker.postMessage({ type: 'schedule_stimulus', id, scheduledTime });
    });
  }
}
```

### Drift Compensation

System clocks can drift from real time. The Timing Engine compensates by recording drift samples (comparing `performance.now()` with a known reference time like an NTP-synced server timestamp) and using the median drift as the compensation value.

```typescript
class DriftCompensator {
  private driftSamples: number[] = [];
  private maxSamples: number = 100;
  private estimatedDrift: number = 0;

  addSample(performanceTime: number, referenceTime: number): void {
    this.driftSamples.push(referenceTime - performanceTime);
    if (this.driftSamples.length > this.maxSamples) {
      this.driftSamples.shift();
    }
    this.estimatedDrift = this.calculateMedianDrift();
  }

  compensate(timestamp: number): number {
    return timestamp + this.estimatedDrift;
  }

  private calculateMedianDrift(): number {
    const sorted = [...this.driftSamples].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
```

### Frame-Rate Independent Timing

Stimulus timing is independent of frame rate. For long waits (greater than 16ms), a hybrid approach uses `setTimeout` for the bulk of the wait and then `requestAnimationFrame` for the final precision frame. This avoids wasting GPU frames during long intervals while maintaining precision for the actual stimulus onset.

```typescript
class FrameIndependentTimer {
  private animationFrameId: number | null = null;

  scheduleAt(targetTime: number, callback: () => void): void {
    const tick = (currentTime: number) => {
      if (currentTime >= targetTime) {
        callback();
        return;
      }
      const remaining = targetTime - currentTime;
      if (remaining > 16) {
        setTimeout(() => {
          this.animationFrameId = requestAnimationFrame(tick);
        }, remaining - 16);
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  cancel(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
```

### Input Latency Compensation

Different input methods have different latencies. The Timing Engine uses the input event's `timeStamp` property (a `DOMHighResTimeStamp`) rather than creating a new timestamp when the event is processed:

| Input Method | Typical Latency | Compensation |
|---|---|---|
| Touch (mobile) | 30-80ms | Use `touchstart.timeStamp` |
| Mouse (desktop) | 5-15ms | Use `mousedown.timeStamp` |
| Keyboard | 5-10ms | Use `keydown.timeStamp` |
| Stylus | 20-50ms | Use `pointerdown.timeStamp` |

```typescript
function handleResponse(event: TouchEvent | MouseEvent | KeyboardEvent) {
  const responseTimestamp = event.timeStamp;
  const latencyMs = responseTimestamp - stimulusOnset;

  recordResponse({
    timestamp: responseTimestamp,
    latencyMs: latencyMs,
    inputType: getInputType(event),
    inputValue: getInputValue(event)
  });
}
```

---

## Score Engine

### Architecture

The Score Engine computes session scores using configurable formulas. Each game defines its own scoring formula, but the Score Engine provides the framework for applying those formulas, normalizing scores, and computing percentiles.

### Score Computation Pipeline

```
Trial Results → Component Scores → Weighted Composite → Normalization → Final Score
```

**Step 1: Component Scores.** Each game computes component scores on a 0-100 scale from raw trial data: Reaction Time Score, Consistency Score, Accuracy Score, Endurance Score.

**Step 2: Weighted Composite.** Components are combined using game-specific weights that must sum to 1.0:
```
composite = (rts * w_rts) + (cs * w_cs) + (as * w_as) + (es * w_es)
```

**Step 3: Normalization.** Scores are normalized against population data:
- `none`: Raw composite score (0-100)
- `population`: Z-score normalized against population mean and standard deviation
- `percentile`: Converted to population percentile rank

**Step 4: Final Score.** The normalized score is scaled to the platform's 0-1000 range:
```
final_score = round(normalized_composite * 10)
```

### Percentile Computation

```typescript
class PercentileCalculator {
  private distribution: number[] = [];

  constructor(distribution: number[]) {
    this.distribution = distribution.sort((a, b) => a - b);
  }

  getPercentile(score: number): number {
    if (this.distribution.length === 0) return 50;

    let below = 0;
    let equal = 0;

    for (const s of this.distribution) {
      if (s < score) below++;
      else if (s === score) equal++;
      else break;
    }

    return Math.round(((below + 0.5 * equal) / this.distribution.length) * 100);
  }

  addScore(score: number): void {
    const insertIndex = this.distribution.findIndex(s => s > score);
    if (insertIndex === -1) {
      this.distribution.push(score);
    } else {
      this.distribution.splice(insertIndex, 0, score);
    }
  }
}
```

### Penalty and Bonus Rules

```typescript
interface PenaltyRule {
  trigger: string;
  amount: number;
  maxApplication: number;
}

interface BonusRule {
  trigger: string;
  amount: number;
  maxApplication: number;
  conditions?: Record<string, any>;
}

// Example for Reaction Light Test
const penaltyRules: PenaltyRule[] = [
  { trigger: 'false_start', amount: 5, maxApplication: 3 },
  { trigger: 'miss', amount: 3, maxApplication: 10 },
  { trigger: 'lapse', amount: 2, maxApplication: 10 },
];

const bonusRules: BonusRule[] = [
  { trigger: 'streak_3', amount: 5, maxApplication: 1 },
  { trigger: 'streak_5', amount: 10, maxApplication: 1 },
  { trigger: 'all_valid', amount: 10, maxApplication: 1 },
  { trigger: 'improvement', amount: 5, maxApplication: 1, conditions: { minSessions: 5 } },
];
```

---

## Calibration Engine

### Purpose

Calibration establishes a baseline for a user's capabilities in a game. Without calibration, difficulty levels and feedback would be meaningless. A 300ms reaction time might be excellent for one user but poor for another. Calibration solves this by measuring each user's baseline before gameplay begins.

### Calibration Protocol

**Phase 1: Practice (Unscored).** Number of trials is configurable (default: 5). Purpose is to familiarize the user with controls and expectations. No score is recorded. Feedback is given after each trial so the user understands the task.

**Phase 2: Calibration (Scored).** Number of trials is configurable (default: 10). Purpose is to measure baseline performance. Scores are recorded but marked as "calibration" in metadata. No adaptation occurs during calibration to ensure the measurement is consistent.

**Phase 3: Calibration Result.** Compute statistics from calibration trials. Determine initial difficulty level. Set adaptation state. Store calibration data for future reference.

### Calibration Data

```typescript
interface CalibrationResult {
  userId: string;
  gameId: string;
  completedAt: number;
  trialResults: TrialResult[];
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    min: number;
    max: number;
  };
  initialDifficulty: number;
  capabilityRatings: Record<Capability, number>;
  confidence: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}
```

### Calibration Decay

User performance changes over time. Calibration data decays:

- After 7 days of inactivity: Calibration is marked as "stale"
- After 30 days: Full recalibration is recommended
- After 90 days: Calibration data is archived and recalibration is required

```typescript
function checkCalibrationFreshness(lastCalibration: CalibrationResult): {
  status: 'fresh' | 'stale' | 'expired';
  daysSinceCalibration: number;
  recommendation: 'none' | 'optional_recalibration' | 'required_recalibration';
} {
  const daysSince = Math.floor(
    (Date.now() - lastCalibration.completedAt) / (1000 * 60 * 60 * 24)
  );

  if (daysSince <= 7) {
    return { status: 'fresh', daysSinceCalibration: daysSince, recommendation: 'none' };
  } else if (daysSince <= 30) {
    return { status: 'stale', daysSinceCalibration: daysSince, recommendation: 'optional_recalibration' };
  } else {
    return { status: 'expired', daysSinceCalibration: daysSince, recommendation: 'required_recalibration' };
  }
}
```

### Cross-Game Calibration

When a new game is unlocked, the Calibration Engine can infer initial capabilities from related games. It finds the most recent calibration that measures the same capability, applies a confidence discount of 0.8x, and uses that as the inferred rating. If no related data exists, the default rating of 1500 (50th percentile) is used.

---

## Adaptation Engine

### Purpose

The Adaptation Engine adjusts game difficulty in real-time to maintain optimal challenge. The goal is to keep the user in the "flow zone" — not so easy that they are bored, not so hard that they are frustrated.

### ELO-Like Rating System

Each capability is tracked with an ELO-like rating:

```typescript
interface CapabilityRating {
  capability: Capability;
  rating: number;
  volatility: number;
  gamesPlayed: number;
  lastUpdated: number;
}

function updateRating(
  current: CapabilityRating,
  gameResult: 'win' | 'loss' | 'draw',
  opponentRating: number,
  kFactor: number = 32
): CapabilityRating {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - current.rating) / 400));
  const actualScore = gameResult === 'win' ? 1 : gameResult === 'loss' ? 0 : 0.5;
  const ratingDelta = kFactor * (actualScore - expectedScore);

  const volatilityDelta = actualScore === expectedScore ? -0.01 : 0.02;

  return {
    ...current,
    rating: Math.max(100, Math.min(3000, current.rating + ratingDelta)),
    volatility: Math.max(0.5, Math.min(2.0, current.volatility + volatilityDelta)),
    gamesPlayed: current.gamesPlayed + 1,
    lastUpdated: Date.now()
  };
}
```

### Difficulty as Continuous Spectrum

Difficulty is a continuous value from 0.0 to 1.0:

| Range | Level | Description |
|---|---|---|
| 0.0 - 0.2 | Very Easy | Learning/introductory |
| 0.2 - 0.4 | Easy | Warm-up/beginner |
| 0.4 - 0.6 | Medium | Standard/intermediate |
| 0.6 - 0.8 | Hard | Advanced/challenging |
| 0.8 - 1.0 | Very Hard | Expert/extreme |

Difficulty maps to game-specific parameters. For the Reaction Light Test: ISI distribution mean (shorter is harder), ISI distribution variance (narrower is harder), response window duration (shorter is harder), stimulus complexity (more complex is harder).

### Performance Trend Detection

```typescript
class TrendDetector {
  private window: number[] = [];
  private windowSize: number = 10;

  addDataPoint(value: number): 'improving' | 'declining' | 'stable' {
    this.window.push(value);
    if (this.window.length > this.windowSize) {
      this.window.shift();
    }

    if (this.window.length < 5) return 'stable';

    const n = this.window.length;
    const x = this.window.map((_, i) => i);
    const y = this.window;
    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += (x[i] - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;

    if (slope > 0.5) return 'improving';
    if (slope < -0.5) return 'declining';
    return 'stable';
  }
}
```

### Fatigue-Aware Adaptation

The Adaptation Engine detects fatigue within a session by splitting trials into first half and second half, computing the average reaction time for each half, and measuring the degradation percentage. If the second half is more than 15% slower than the first half, the session is flagged as fatigued.

```typescript
function detectFatigue(trials: Trial[]): {
  isFatigued: boolean;
  confidence: number;
  degradationPercent: number;
} {
  if (trials.length < 10) {
    return { isFatigued: false, confidence: 0, degradationPercent: 0 };
  }

  const midpoint = Math.floor(trials.length / 2);
  const firstHalf = trials.slice(0, midpoint);
  const secondHalf = trials.slice(midpoint);

  const firstAvg = average(
    firstHalf
      .filter(t => t.result.reactionTimeMs !== null)
      .map(t => t.result.reactionTimeMs!)
  );
  const secondAvg = average(
    secondHalf
      .filter(t => t.result.reactionTimeMs !== null)
      .map(t => t.result.reactionTimeMs!)
  );

  const degradation = ((secondAvg - firstAvg) / firstAvg) * 100;

  return {
    isFatigued: degradation > 15,
    confidence: Math.min(1, Math.abs(degradation) / 30),
    degradationPercent: degradation
  };
}

function average(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
```

### Adaptation Rate Limiting

To prevent rapid difficulty oscillation ("whiplash"), adaptation changes are rate-limited to a maximum of 5% adjustment per session:

```typescript
function limitAdaptationRate(
  currentDifficulty: number,
  targetDifficulty: number,
  maxRate: number = 0.05
): number {
  const delta = targetDifficulty - currentDifficulty;
  const clampedDelta = Math.max(-maxRate, Math.min(maxRate, delta));
  return currentDifficulty + clampedDelta;
}
```

### Time-of-Day Adjustment

User performance varies by time of day based on circadian rhythm research. Peak cognitive performance occurs around 10am-12pm and 4pm-6pm. Troughs occur at 2am-5am and a post-lunch dip at 1pm-3pm. The Adaptation Engine applies a factor from 0.35 (worst time) to 1.05 (best time) to adjust difficulty expectations.

---

## Anti-Cheat Engine

### Purpose

The Anti-Cheat Engine detects and prevents score manipulation. While FOCUS is not a competitive gaming platform, fair scoring is essential for meaningful progression, social features (leaderboards), and scientific validity.

### Detection Methods

**1. Statistical Outlier Detection.** Computes the z-score of a submitted score against the user's historical scores. If the z-score exceeds 3.0 (more than 3 standard deviations from the mean), the score is flagged for review.

**2. Impossible Timing Detection.** Checks for reaction times below 50ms (the physiological minimum for human visual reaction), negative latencies, and session durations that are impossibly short for the number of trials.

**3. Pattern Recognition.** Detects repeated exact values (bot behavior), suspiciously low variance across trials, and other statistical anomalies that indicate non-human play.

**4. Device Capability Validation.** Flags high scores from low-end devices for manual review. This is a heuristic, not a hard rejection, since genuinely talented users can achieve high scores on any device.

**5. Server-Side Score Verification.** For high-stakes features (competitive leaderboards, challenges), a simplified server-side simulation replays the trial timing from events to verify that the submitted score is consistent with the submitted data.

### Score Submission Protocol

The submission protocol runs through seven validation stages:

1. Validate session structure (correct number of trials, valid timestamps)
2. Verify client hash (integrity check against tampered data)
3. Run anti-cheat statistical outlier detection
4. Check timing violations
5. Check pattern violations
6. Server-side verification for high-stakes submissions
7. Store score if all checks pass

Outliers and pattern violations do not automatically reject scores — they flag for review to avoid penalizing genuinely improving users. Timing violations and integrity check failures result in automatic rejection.

---

## Offline Engine

### Purpose

The Offline Engine enables gameplay without an internet connection, syncing data when connectivity is restored. This is critical for mobile users and for users in areas with unreliable connectivity.

### Architecture

```
Game Session → Event Collector → Local SQLite Database
                                       ↓
                            Sync Engine (when online)
                                       ↓
                              Supabase Database
```

### Local Storage

Offline data is stored in SQLite: `expo-sqlite` on mobile, `better-sqlite3` on desktop, or `sql.js` in the browser. The schema includes `offline_sessions` and `offline_events` tables with sync status tracking.

### Sync Engine

The Sync Engine listens for online/offline events and automatically syncs pending sessions when connectivity is restored. Sessions are sorted by priority (oldest first, completed sessions first) and synced sequentially. Failed syncs are retried with exponential backoff.

### Conflict Resolution

When syncing offline data, conflicts may arise when the same session was modified on two devices. The resolution strategy is last-write-wins based on server timestamps. If timestamps are identical, non-conflicting fields are merged.

### Bandwidth-Aware Sync

The sync engine checks the Network Information API (`navigator.connection`) to determine sync strategy: full sync on fast connections (4G+), compressed sync on moderate connections (3G), and deferred sync on slow connections (2G) or when data saver is enabled. Compression strips non-essential event data while preserving score-critical information.

---

## Event System

### Architecture

The Event System is a typed event bus that decouples game components from each other and from the platform. Events are used for game events (internal state changes), platform events (progression, social), analytics events (usage tracking), and real-time events (live updates).

### Typed Event Bus

```typescript
interface EventMap {
  'game:session_started': { sessionId: string; gameId: string };
  'game:session_completed': { sessionId: string; score: GameScore };
  'game:trial_started': { sessionId: string; trialIndex: number };
  'game:trial_completed': { sessionId: string; trialResult: TrialResult };
  'game:stimulus_shown': { sessionId: string; trialId: string; stimulus: Stimulus };
  'game:response_received': { sessionId: string; trialId: string; response: Response };
  'platform:level_up': { newLevel: number; xpGained: number };
  'platform:achievement_unlocked': { achievementId: string; name: string };
  'platform:streak_maintained': { streakDays: number };
  'platform:streak_broken': { previousStreak: number };
  'social:friend_added': { friendId: string };
  'social:challenge_received': { challengeId: string; fromUserId: string };
  'social:leaderboard_updated': { gameId: string; rank: number };
  'analytics:screen_view': { screen: string; duration: number };
  'analytics:feature_used': { feature: string; metadata: Record<string, any> };
}

class TypedEventBus {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => { this.listeners.get(event)?.delete(callback); };
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}
```

### Event Persistence

All game events are persisted to the local database for sync and analysis. Events include an integrity hash (a simple non-cryptographic hash of the event data) for tamper detection. Events are batch-written to SQLite every 500ms or every 100 events, whichever comes first, to balance durability with performance.

---

## Plugin Architecture

### Game Registration

Games register themselves with the GameRegistry. The registry validates the game configuration, maintains a category index, and provides lookup methods. Registration throws an error if a game with the same ID is already registered, preventing duplicate registrations.

```typescript
class GameRegistry {
  private games: Map<string, Game> = new Map();
  private categories: Map<GameCategory, string[]> = new Map();

  register(game: Game): void {
    if (this.games.has(game.id)) {
      throw new Error(`Game "${game.id}" is already registered`);
    }
    this.validateGameConfig(game);
    this.games.set(game.id, game);
    if (!this.categories.has(game.category)) {
      this.categories.set(game.category, []);
    }
    this.categories.get(game.category)!.push(game.id);
  }

  getAvailableGames(userLevel: number, isPremium: boolean): Game[] {
    return Array.from(this.games.values()).filter(game => {
      if (game.minLevel > userLevel) return false;
      if (game.isPremium && !isPremium) return false;
      return true;
    });
  }
}
```

### Game Module Structure

Each game module provides: a `config` object (game metadata), a `CalibrationComponent` (React), a `GameplayComponent` (React), a `ResultComponent` (React), a `scoring` object (with `computeScore` and `computeTrialResult` functions), and an `adaptation` object (with `computeDifficulty` and `getInitialDifficulty` functions).

### Shared Components Available to Games

| Component | Description |
|---|---|
| `GameContainer` | Wrapper providing session, events, and score context |
| `ScoreDisplay` | Animated score counter |
| `TrialCounter` | "Trial X of Y" display |
| `ProgressBar` | Animated progress bar |
| `CountdownTimer` | Pre-session countdown |
| `PauseOverlay` | Pause screen |
| `ResultScreen` | Score breakdown with animations |
| `StreakIndicator` | Current streak display |
| `FeedbackOverlay` | Immediate correct/incorrect feedback |
| `SettingsPanel` | In-game settings |

---

## Performance Optimization

### Target Performance

| Metric | Target | Measurement |
|---|---|---|
| Frame rate | 60 FPS (mobile), 120 FPS (desktop) | requestAnimationFrame callback timing |
| Input latency | < 16ms (touch to visual response) | Event timestamp comparison |
| Timing accuracy | plus or minus 2ms | Web Worker timing verification |
| Memory usage | < 100MB during gameplay | Chrome DevTools / Xcode Instruments |
| Load time | < 2s (cached), < 5s (cold) | Performance API measurements |
| Battery impact | < 5% per hour of gameplay | Platform battery APIs |

### Optimization Strategies

**1. Stimulus rendering via CSS transforms (GPU-accelerated).** Use `transform` and `opacity` for animations since these properties are GPU-composited and do not trigger layout or paint.

**2. Event batching.** Events are batched and written to SQLite every 500ms rather than on every individual event, reducing I/O overhead.

**3. Pre-computed stimulus schedules.** ISI sequences are pre-computed at session start rather than generated per-trial, eliminating per-trial random number generation overhead.

**4. Memoization of expensive computations.** Score components that depend on all trial results are memoized with cache keys that include trial count and last trial ID, so they are only recomputed when new data arrives.

---

## Testing Strategy

### Unit Tests

Every engine component has unit tests covering:

- **TimingEngine**: Measures response latency within plus or minus 2ms accuracy
- **ScoreEngine**: Computes consistent scores for identical inputs, handles edge cases (all misses, all perfect)
- **AntiCheatEngine**: Detects impossible reaction times, detects repeated patterns, allows legitimate high scores
- **CalibrationEngine**: Produces valid calibration results, handles stale calibration correctly
- **AdaptationEngine**: Adjusts difficulty within rate limits, responds to fatigue signals
- **EventSystem**: Correctly dispatches typed events, handles unsubscribe cleanup

### Integration Tests

- Full session lifecycle: start to score computation
- Calibration to gameplay to score: verifies calibration data feeds into adaptation
- Offline to online sync: verifies data integrity across sync
- Score submission: verifies anti-cheat pipeline from submission to storage

### Performance Tests

- Timing accuracy under load (100+ concurrent sessions in test)
- Memory leak detection (1000+ session cycles)
- Event collection throughput (events per second)
- SQLite write performance (batch insert benchmarks)

### Visual Regression Tests

Game UI components are tested with screenshot comparison to ensure animations and layouts remain consistent across changes.
