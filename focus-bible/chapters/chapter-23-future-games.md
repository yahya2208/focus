# Chapter 23: Future Games Roadmap

## Overview

The FOCUS platform is designed as a cognitive performance ecosystem where games are modular components. Each game follows the same architecture, shares the same infrastructure, and integrates with the same progression, social, and analytics systems. This chapter documents the roadmap for 10 future games beyond the initial Reaction Light Test, including the scientific basis, gameplay mechanics, scoring formulas, difficulty adaptation, calibration protocols, and measurements for each.

## Game Development Framework

Every new game must:

1. **Register** with the `GameRegistry` providing a unique ID, metadata, and configuration
2. **Implement** the `Game` TypeScript interface defined in Chapter 06
3. **Use** the shared game engine components (TimingEngine, ScoreEngine, CalibrationEngine, AdaptationEngine, AntiCheatEngine)
4. **Follow** the FOCUS design system (colors, typography, spacing, motion, sound, haptics)
5. **Support** all input methods (touch, mouse, keyboard, gamepad, stylus)
6. **Include** a calibration protocol that establishes a baseline
7. **Include** a difficulty adaptation algorithm that adjusts to user performance
8. **Include** comprehensive scoring with breakdown
9. **Pass** accessibility testing (WCAG 2.1 AA)
10. **Pass** scientific review for measurement validity
11. **Include** localization for all Phase 1 languages
12. **Include** offline support

### Cross-Game Capability Mapping

Each game exercises different cognitive capabilities. The capability system allows the platform to track and report on specific cognitive dimensions:

| Capability | Description | Games |
|-----------|-------------|-------|
| `reaction_time` | Speed of response to stimuli | Reaction Light Test, Go/No-Go |
| `sustained_attention` | Maintaining focus over time | Reaction Light Test, Peripheral Awareness |
| `working_memory` | Holding and manipulating information | Memory Matrix, N-Back, Pattern Recall |
| `visual_search` | Finding targets among distractors | Visual Search, Peripheral Awareness |
| `response_inhibition` | Suppressing inappropriate responses | Go/No-Go, Stroop, Flanker |
| `divided_attention` | Processing multiple inputs simultaneously | Dual Task |
| `task_switching` | Flexibly switching between tasks | Attention Switching, Wisconsin Card Sorting |
| `spatial_tracking` | Tracking objects in space | Target Tracking, Memory Matrix |
| `executive_function` | Higher-order cognitive control | Stroop, Flanker, Executive Function Tests |
| `pattern_recognition` | Identifying and reproducing patterns | Pattern Recall, Memory Matrix |
| `consistency` | Maintaining stable performance | All games |
| `endurance` | Resisting fatigue over time | All games |
| `accuracy` | Precision of responses | All games |

### Game Unlock Progression

| Level | Games Unlocked |
|-------|---------------|
| 1 | Reaction Light Test |
| 3 | Go/No-Go Test |
| 5 | Memory Matrix |
| 7 | Visual Search |
| 10 | Target Tracking |
| 12 | Working Memory (N-Back) |
| 15 | Dual Task |
| 18 | Peripheral Awareness |
| 20 | Attention Switching |
| 25 | Pattern Recall |
| 30 | Executive Function Tests |

---

## Game 02: Go/No-Go Test

### Scientific Basis

The Go/No-Go task is a classic neuropsychological paradigm measuring **response inhibition** and **impulse control**. Originally developed for studying attention deficit hyperactivity disorder (ADHD), it has been extensively validated as a measure of the ability to suppress prepotent responses.

**Key references**:
- Logan, G.D. (1994). On the ability to inhibit thought and action: A user's guide to the stop signal paradigm.
- Rubia, K. et al. (2001). Effects of age and gender on inhibitory control.
- Lijffijt, M. et al. (2005). A meta-analysis of stopping performance in ADHD.

**What it measures**: Response inhibition, impulse control, sustained attention, the balance between action and restraint.

### Gameplay Mechanics

- **Stimuli**: Colored circles appear sequentially in the center of the screen
- **Go signal**: Green circle (70-80% of trials) - User must tap/click/press as fast as possible
- **No-Go signal**: Red circle (20-30% of trials) - User must NOT respond
- **Stimulus duration**: 1500ms (display time)
- **Inter-stimulus interval**: 1000-2500ms (exponential distribution, same anti-memorization as Reaction Light)
- **Session length**: 50-100 trials (configurable)
- **Feedback**: Immediate visual feedback for correct and incorrect responses

**Why Go ratio is 70-80%**: A higher Go ratio creates a prepotent response tendency (the user gets into a rhythm of tapping). This makes No-Go trials harder to inhibit, which is the scientific validity of the task. If Go/No-Go were 50/50, there would be no prepotent response, defeating the purpose.

### Timing Algorithm

```typescript
function generateGoNoGoSequence(
  trialCount: number,
  goRatio: number = 0.75
): 'go' | 'nogo'[] {
  const goCount = Math.floor(trialCount * goRatio);
  const nogoCount = trialCount - goCount;
  
  // Create array of Go and No-Go trials
  const sequence: ('go' | 'nogo')[] = [
    ...Array(goCount).fill('go'),
    ...Array(nogoCount).fill('nogo'),
  ];
  
  // Fisher-Yates shuffle for uniform randomness
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  
  // Validation: No more than 3 consecutive No-Go (unrealistic)
  // No more than 6 consecutive Go (prevents auto-pilot detection)
  return validateSequence(sequence);
}

function generateISI(): number {
  // Same exponential distribution as Reaction Light
  const lambda = 1 / 1750; // Mean ISI of 1750ms
  const minISI = 1000;
  const maxISI = 2500;
  
  let isi: number;
  do {
    const u = Math.random();
    isi = -Math.log(1 - u) / lambda;
  } while (isi < minISI || isi > maxISI);
  
  return Math.round(isi);
}
```

### Scoring Formula

```
1. Accuracy Score (AS):
   correct_go = number of Go trials with response
   correct_nogo = number of No-Go trials without response
   total_go = total Go trials
   total_nogo = total No-Go trials
   
   go_accuracy = correct_go / total_go
   nogo_accuracy = correct_nogo / total_nogo
   
   as = ((go_accuracy * 0.4) + (nogo_accuracy * 0.6)) * 100
   
   // Weighted toward No-Go accuracy because that's the harder task

2. Commission Error Score (CES):
   commission_errors = total_nogo - correct_nogo
   commission_rate = commission_errors / total_nogo
   
   If commission_rate <= 0.05: ces = 100
   If commission_rate <= 0.10: ces = 100 - (commission_rate - 0.05) * 800
   If commission_rate <= 0.20: ces = 60 - (commission_rate - 0.10) * 400
   If commission_rate > 0.20: ces = max(0, 20 - (commission_rate - 0.20) * 100)

3. Omission Error Score (OS):
   omission_errors = total_go - correct_go
   omission_rate = omission_errors / total_go
   
   os = (1 - omission_rate) * 100

4. Go Reaction Time Score (GRTS):
   go_rts = reaction times for all correct Go trials
   mean_go_rt = average(go_rts)
   
   If mean_go_rt <= 200ms: grts = 100
   If mean_go_rt <= 350ms: grts = 100 - (mean_go_rt - 200) * 0.4
   If mean_go_rt <= 500ms: grts = 40 - (mean_go_rt - 350) * 0.2
   If mean_go_rt > 500ms: grts = max(0, 10 - (mean_go_rt - 500) * 0.05)

5. Inhibition Score (IS):
   // Measures how well user stops specifically on No-Go after recent Go trials
   // (This is the most scientific measure of inhibitory control)
   nogo_after_go = No-Go trials immediately following a Go trial
   correct_inhibition = correct responses on nogo_after_go
   is = (correct_inhibition / nogo_after_go) * 100

6. Focus Score (Composite):
   focus_score = (as * 0.30) + (ces * 0.25) + (os * 0.15) + (grts * 0.15) + (is * 0.15)

7. Session Score:
   session_score = focus_score * trial_count_multiplier
   // 50 trials = 0.75, 75 trials = 0.9, 100 trials = 1.0

8. XP Calculation:
   base_xp = floor(session_score / 10)
   streak_bonus = min(streak_days * 2, 20)
   total_xp = base_xp + streak_bonus
```

### Difficulty Adaptation

```typescript
function adaptGoNoGoDifficulty(performance: PerformanceData): AdaptationResult {
  const { commissionRate, omissionRate, meanRT, recentTrend } = performance;
  
  let newGoRatio = 0.75; // Default
  let newISIMean = 1750; // Default
  let reason: AdaptationReason;
  
  // Adjust Go ratio based on commission errors
  if (commissionRate > 0.25) {
    // Too many commission errors - increase Go ratio (easier)
    newGoRatio = Math.min(0.85, performance.currentGoRatio + 0.05);
    reason = 'performance_declining';
  } else if (commissionRate < 0.05 && omissionRate < 0.05) {
    // Very accurate - decrease Go ratio (harder)
    newGoRatio = Math.max(0.60, performance.currentGoRatio - 0.05);
    reason = 'performance_improving';
  }
  
  // Adjust ISI based on mean RT
  if (meanRT < 250) {
    newISIMean = Math.max(1200, performance.currentISIMean - 100);
    reason = 'performance_improving';
  } else if (meanRT > 450) {
    newISIMean = Math.min(2200, performance.currentISIMean + 150);
    reason = 'performance_declining';
  }
  
  return { newGoRatio, newISIMean, reason };
}
```

### Calibration Protocol

- 10 practice trials (5 Go, 5 No-Go, not scored)
- 20 calibration trials (scored but marked as calibration)
- Calibration establishes:
  - Baseline Go RT
  - Baseline commission error rate
  - Baseline omission error rate
  - Inhibition capability rating

### Measurements

| Metric | Unit | Description |
|--------|------|-------------|
| Go Accuracy | % | Correct responses to Go stimuli |
| No-Go Accuracy | % | Correct withholding on No-Go stimuli |
| Commission Error Rate | % | Incorrect responses to No-Go stimuli |
| Omission Error Rate | % | Missed responses to Go stimuli |
| Go Mean RT | ms | Average reaction time on Go trials |
| Go RT SD | ms | Consistency of Go reaction times |
| Inhibition Score | % | Correct inhibition on No-Go-after-Go trials |
| Response Bias (c) | d' | Signal detection bias measure |
| Sensitivity (d') | d' | Signal detection sensitivity |

---

## Game 03: Memory Matrix

### Scientific Basis

The Memory Matrix is based on the **Corsi block-tapping task** (Corsi, 1972), a classic test of visuospatial working memory. The user must observe a sequence of tile highlights and reproduce the sequence from memory.

**Key references**:
- Corsi, P.M. (1972). Human memory and the medial temporal region of the brain.
- Kessels, R.P. et al. (2000). The Corsi Block-Tapping Task: Standardization and normative data.
- Piccardi, L. et al. (2008). Reference frames in spatial working memory.

**What it measures**: Visuospatial working memory span, spatial sequential memory, visual attention.

### Gameplay Mechanics

- **Grid**: 3x3 grid of tiles (default), expanding to 4x4 and 5x5
- **Sequence**: Tiles light up one at a time in a random pattern
- **User task**: Tap the tiles in the same order they were shown
- **Sequence length**: Starts at 3, increases by 1 after 2 consecutive correct, decreases by 1 after 1 wrong
- **Stimulus duration**: 800ms per tile highlight
- **Inter-stimulus interval**: 400ms between highlights
- **Response window**: 5000ms per tile to respond
- **Feedback**: Correct tile shows green flash, wrong tile shows red flash and vibration

### Timing Algorithm

```typescript
function generateMemorySequence(
  length: number,
  gridSize: number // 3, 4, or 5
): number[] {
  const totalCells = gridSize * gridSize;
  const sequence: number[] = [];
  
  for (let i = 0; i < length; i++) {
    let cell: number;
    do {
      cell = Math.floor(Math.random() * totalCells);
    } while (sequence.length > 0 && cell === sequence[sequence.length - 1]);
    // No consecutive same cell (redundant but prevents confusion)
    
    sequence.push(cell);
  }
  
  return sequence;
}

const STIMULUS_DURATION = 800; // ms per tile highlight
const INTER_STIMULUS_INTERVAL = 400; // ms between highlights
const RESPONSE_WINDOW = 5000; // ms to tap each tile
const MAX_SEQUENCE_LENGTH_GRID_3 = 9; // 3x3 = 9 cells
const MAX_SEQUENCE_LENGTH_GRID_4 = 12; // 4x4 = 16 cells, max sequence is 12
const MAX_SEQUENCE_LENGTH_GRID_5 = 15; // 5x5 = 25 cells, max sequence is 15
```

### Scoring Formula

```
1. Maximum Span (MS):
   ms = highest sequence length completed correctly

2. Span Accuracy Score (SAS):
   // For each attempted sequence length
   For each length L from 3 to ms:
     sas_L = (correct_trials_at_L / total_trials_at_L) * 100
   sas = average of all sas_L values

3. Precision Score (PS):
   // Measures how accurately user taps (not just order, but timing)
   average_tap_accuracy = mean of |expected_position - actual_position| for correct sequences
   ps = max(0, 100 - (average_tap_accuracy * 10))

4. Speed Score (SS):
   // Faster responses with accuracy earn more points
   average_response_time = mean of time to complete each sequence
   If average_response_time <= 3000ms: ss = 100
   If average_response_time <= 5000ms: ss = 100 - (average_response_time - 3000) * 0.025
   If average_response_time <= 8000ms: ss = 50 - (average_response_time - 5000) * 0.01
   If average_response_time > 8000ms: ss = max(0, 20 - (average_response_time - 8000) * 0.005)

5. Improvement Score (IS):
   // Did the user improve within the session?
   first_half_avg = average span in first half of attempts
   second_half_avg = average span in second half of attempts
   is = min(100, 50 + ((second_half_avg - first_half_avg) / first_half_avg) * 200)

6. Focus Score (Composite):
   focus_score = (ms/max_possible * 30) + (sas * 0.25) + (ps * 0.20) + (ss * 0.15) + (is * 0.10)

7. Session Score:
   session_score = focus_score * difficulty_multiplier
   // Grid 3x3 = 1.0, Grid 4x4 = 1.3, Grid 5x5 = 1.6
```

### Difficulty Adaptation

```typescript
function adaptMemoryDifficulty(performance: PerformanceData): AdaptationResult {
  let newGridSize = performance.currentGridSize;
  let newBaseSequence = performance.currentBaseSequence;
  
  // Grid size progression
  if (performance.maxSpan >= 7 && performance.currentGridSize === 3) {
    newGridSize = 4;
  } else if (performance.maxSpan >= 10 && performance.currentGridSize === 4) {
    newGridSize = 5;
  }
  
  // Sequence length adaptation
  if (performance.consecutiveCorrect >= 2) {
    newBaseSequence = Math.min(performance.currentBaseSequence + 1, newGridSize * 2);
  } else if (performance.consecutiveWrong >= 1) {
    newBaseSequence = Math.max(performance.currentBaseSequence - 1, 3);
  }
  
  return { newGridSize, newBaseSequence };
}
```

### Calibration Protocol

- 3 practice sequences (length 3, 4, 5) with guidance
- 5 calibration sequences (length 3-5, scored but marked as calibration)
- Calibration establishes:
  - Baseline working memory span
  - Spatial accuracy baseline
  - Response speed baseline

### Measurements

| Metric | Unit | Description |
|--------|------|-------------|
| Maximum Span | integer | Highest sequence length completed |
| Average Span | float | Mean span across all attempts |
| Span Accuracy | % | Accuracy at each sequence length |
| Spatial Precision | pixels | Average deviation from target center |
| Response Time per Tile | ms | Speed of tile tapping |
| Improvement Rate | % | Performance gain within session |
| Grid Size | 3/4/5 | Current grid complexity |

---

## Game 04: Visual Search

### Scientific Basis

Based on Anne Treisman's **Feature Integration Theory** (Treisman & Gelade, 1980), which distinguishes between pre-attentive feature search (finding a unique color among distractors) and attentive conjunction search (finding a target defined by multiple features).

**Key references**:
- Treisman, A.M. & Gelade, G. (1980). A feature-integration theory of attention.
- Wolfe, J.M. (1994). Guided Search 2.0: A revised model of visual search.
- Palmer, J. et al. (2000). Linking attention to perception.

**What it measures**: Visual search efficiency, attention to detail, selective attention, processing speed.

### Gameplay Mechanics

- **Display**: Grid of items with one target among distractors
- **Feature search**: Target has a unique color (e.g., blue circle among green circles)
- **Conjunction search**: Target has a unique combination (e.g., blue circle among blue squares and green circles)
- **User task**: Find and tap the target as fast as possible
- **Feedback**: Correct = green flash, Wrong = red flash, Time shown

### Scoring Formula

```
1. Search Efficiency Score (SES):
   // Reaction time decreases with practice, measures improvement
   feature_mean_rt = average RT for feature search trials
   conjunction_mean_rt = average RT for conjunction search trials
   
   // Normalize against difficulty
   feature_normalized = feature_mean_rt / expected_feature_rt
   conjunction_normalized = conjunction_mean_rt / expected_conjunction_rt
   
   ses = ((1 - feature_normalized) * 0.4 + (1 - conjunction_normalized) * 0.6) * 100
   ses = clamp(ses, 0, 100)

2. Accuracy Score (AS):
   correct_responses / total_trials * 100

3. Distractor Resistance Score (DRS):
   // How well user ignores increasing distractor counts
   // Measured by RT slope across distractor counts
   rt_slope = linear_regression_slope(distractor_count, rt_per_count)
   drs = max(0, 100 - abs(rt_slope) * 10)

4. Focus Score:
   focus_score = (ses * 0.40) + (as * 0.30) + (drs * 0.30)
```

### Difficulty Adaptation

```typescript
function adaptVisualSearchDifficulty(performance: PerformanceData): AdaptationResult {
  let newDistractorCount = performance.currentDistractorCount;
  let newSearchType = performance.currentSearchType;
  let newTargetSize = performance.currentTargetSize;
  
  if (performance.accuracy > 0.95 && performance.meanRT < 2000) {
    // Increase difficulty
    newDistractorCount = Math.min(newDistractorCount + 2, 24);
    if (newDistractorCount >= 16) newSearchType = 'conjunction';
  } else if (performance.accuracy < 0.70 || performance.meanRT > 5000) {
    // Decrease difficulty
    newDistractorCount = Math.max(newDistractorCount - 2, 4);
    if (newDistractorCount <= 8) newSearchType = 'feature';
  }
  
  return { newDistractorCount, newSearchType, newTargetSize };
}
```

---

## Game 05: Target Tracking

### Scientific Basis

Based on **Multiple Object Tracking** (MOT) paradigm (Pylyshyn & Storm, 1988). The user must track a subset of identical moving objects among distractors.

**Key references**:
- Pylyshyn, Z.W. & Storm, R.W. (1988). Tracking multiple independent targets.
- Cavanagh, P. & Alvarez, G.A. (2005). Tracking multiple targets.
- Holcombe, A.O. (2009). Seeing slow and seeing fast.

**What it measures**: Visual tracking capacity, attention splitting, spatial working memory, dynamic attention.

### Gameplay Mechanics

- **Display**: Multiple identical circles move around the screen
- **Targets**: 2-4 circles are briefly highlighted (yellow glow), then all become identical
- **Movement**: Smooth random movement with occasional direction changes
- **User task**: After movement stops, tap the circles that were originally highlighted
- **Feedback**: Correct targets glow green, missed targets glow red, false selections glow orange

### Scoring Formula

```
1. Tracking Accuracy (TA):
   correct_targets = number of correctly identified targets
   total_targets = number of targets to track
   ta = (correct_targets / total_targets) * 100

2. False Positive Rate (FPR):
   false_positives = number of distractor items incorrectly selected
   fpr = max(0, 100 - (false_positives * 15))

3. Tracking Capacity (TC):
   // Estimated tracking capacity from signal detection theory
   hits = correct_targets
   misses = total_targets - correct_targets
   false_alarms = false_positives
   correct_rejections = distractor_count - false_positives
   
   hit_rate = hits / (hits + misses + 0.01)
   fa_rate = (false_alarms + 0.01) / (false_alarms + correct_rejections + 0.01)
   
   d_prime = z(hit_rate) - z(fa_rate) // Signal detection sensitivity
   tc = clamp(d_prime * 20 + 50, 0, 100) // Normalized to 0-100

4. Speed Score:
   response_time = time from movement stop to final selection
   expected_time = target_count * 1000 // 1 second per target expected
   ss = max(0, 100 * (1 - response_time / expected_time))

5. Focus Score:
   focus_score = (ta * 0.40) + (fpr * 0.20) + (tc * 0.25) + (ss * 0.15)
```

### Difficulty Adaptation

```typescript
function adaptTrackingDifficulty(performance: PerformanceData): AdaptationResult {
  let newTargetCount = performance.currentTargetCount;
  let newDistractorCount = performance.currentDistractorCount;
  let newSpeed = performance.currentSpeed;
  let newDuration = performance.currentDuration;
  
  if (performance.trackingAccuracy >= 0.90 && performance.falsePositiveRate >= 90) {
    newTargetCount = Math.min(newTargetCount + 1, 4);
    if (newTargetCount >= 4) newSpeed = Math.min(newSpeed * 1.1, 3.0);
  } else if (performance.trackingAccuracy < 0.60) {
    newTargetCount = Math.max(newTargetCount - 1, 2);
    if (newTargetCount <= 2) newSpeed = Math.max(newSpeed * 0.9, 0.5);
  }
  
  return { newTargetCount, newDistractorCount, newSpeed, newDuration };
}
```

---

## Game 06: Dual Task

### Scientific Basis

The **dual-task paradigm** measures divided attention by requiring simultaneous performance on two tasks. The dual-task cost (performance decrement when doing both tasks vs. one) reveals attentional capacity limitations.

**Key references**:
- Pashler, H. (1994). Dual-task interference in simple tasks.
- Monsell, S. (2003). Task switching. Trends in Cognitive Sciences.
- Kahneman, D. (1973). Attention and effort.

**What it measures**: Divided attention capacity, attention allocation efficiency, dual-task cost.

### Gameplay Mechanics

- **Task 1 (Visual)**: Tap green circles as they appear (same as Go/No-Go)
- **Task 2 (Auditory)**: Listen for high/low tones, tap left/right side of screen
- **Combined mode**: Both tasks happen simultaneously
- **Trial types**: Single-task blocks (baseline) and dual-task blocks
- **User task**: Perform both tasks as accurately as possible

### Scoring Formula

```
1. Dual-Task Cost (DTC):
   single_task_accuracy = accuracy on single-task trials
   dual_task_accuracy = accuracy on dual-task trials
   dtc = ((single_task_accuracy - dual_task_accuracy) / single_task_accuracy) * 100
   dtc_score = max(0, 100 - dtc) // Lower cost = higher score

2. Task 1 Accuracy:
   task1_dual_accuracy = accuracy on Task 1 during dual-task
   task1_score = task1_dual_accuracy * 100

3. Task 2 Accuracy:
   task2_dual_accuracy = accuracy on Task 2 during dual-task
   task2_score = task2_dual_accuracy * 100

4. Balance Score:
   // How evenly distributed performance is across tasks
   imbalance = abs(task1_dual_accuracy - task2_dual_accuracy)
   balance_score = (1 - imbalance) * 100

5. Focus Score:
   focus_score = (dtc_score * 0.35) + (task1_score * 0.20) + (task2_score * 0.20) + (balance_score * 0.25)
```

---

## Game 07: Peripheral Awareness

### Scientific Basis

Based on the **Useful Field of View** (UFOV) test (Ball & Rebok, 1990), which measures the visual area from which a person can extract information in a single fixation. This is critical for driving safety and has been shown to decline with age.

**Key references**:
- Ball, K. & Rebok, G.W. (1990). Evaluating the driving skills of older adults.
- Owsley, C. et al. (1991). The useful field of view test.
- Edwards, J.D. et al. (2005). UFOV and driving safety.

**What it measures**: Peripheral visual awareness, attentional window width, selective attention.

### Gameplay Mechanics

- **Center**: A fixation cross in the center of the screen
- **Peripheral stimulus**: A shape appears at varying distances (eccentricity) from center
- **User task**: Identify the shape while keeping eyes on center
- **Subtasks**:
  1. Center identification (fixation check)
  2. Peripheral identification (what shape appeared?)
  3. Divided attention (both simultaneously)
- **Eccentricity levels**: 100px, 200px, 300px, 400px from center

### Scoring Formula

```
1. Peripheral Accuracy (PA):
   correct_peripheral / total_peripheral * 100
   Weighted by eccentricity (farther = harder = more weight)

2. Maximum Eccentricity (ME):
   farthest eccentricity at which accuracy >= 75%
   me_score = (me / max_possible_eccentricity) * 100

3. Fixation Maintenance (FM):
   // Was user looking at center during peripheral stimulus?
   center_accuracy / total_center_checks * 100

4. Focus Score:
   focus_score = (pa * 0.35) + (me_score * 0.30) + (fm * 0.35)
```

---

## Game 08: Attention Switching

### Scientific Basis

Based on the **task-switching paradigm** (Monsell, 2003), which measures the cognitive cost of switching between different task rules.

**Key references**:
- Monsell, S. (2003). Task switching. Trends in Cognitive Sciences.
- Rogers, R.D. & Monsell, S. (1995). Costs of a predictable switch.
- Kiesel, A. et al. (2010). Control and interference in task switching.

**What it measures**: Cognitive flexibility, switch cost, task-set reconfiguration, inhibitory control.

### Gameplay Mechanics

- **Task A**: If circle appears, tap for number of dots inside
- **Task B**: If square appears, tap for color (red/blue)
- **Cue**: Shape of the stimulus indicates which task to perform
- **Switch trials**: Task changes from previous trial
- **Repeat trials**: Same task as previous trial
- **Switch probability**: 50% (predictable) or 30% (unpredictable)

### Scoring Formula

```
1. Switch Cost (SC):
   // Difference between switch trial RT and repeat trial RT
   switch_rt = mean RT on switch trials
   repeat_rt = mean RT on repeat trials
   sc = switch_rt - repeat_rt // Lower is better
   sc_score = max(0, 100 - sc / 5) // Normalize: 0ms = 100, 2000ms = 0

2. Switch Accuracy (SA):
   switch_accuracy = accuracy on switch trials
   repeat_accuracy = accuracy on repeat trials
   sa = ((switch_accuracy + repeat_accuracy) / 2) * 100

3. Mixing Cost (MC):
   // Difference between all trials in mixed block vs single-task block
   single_rt = mean RT in single-task block
   mixed_rt = mean RT in mixed block
   mc = mixed_rt - single_rt
   mc_score = max(0, 100 - mc / 10)

4. Focus Score:
   focus_score = (sc_score * 0.40) + (sa * 0.35) + (mc_score * 0.25)
```

---

## Game 09: Working Memory (N-Back)

### Scientific Basis

The **N-back task** (Kirchner, 1958) is the most widely used working memory task in cognitive neuroscience. It requires continuous monitoring and updating of working memory contents.

**Key references**:
- Kirchner, W.K. (1958). Age differences in short-term retention.
- Jaeggi, S.M. et al. (2008). Improving fluid intelligence with training on working memory.
- Minear, M. et al. (2008). A parametric study of working memory.

**What it measures**: Working memory capacity, continuous updating, response inhibition (no-go trials), sustained attention.

### Gameplay Mechanics

- **Stimuli**: Sequential presentation of shapes, numbers, or positions
- **Rule**: Respond when current stimulus matches the stimulus from N trials ago
- **N levels**: 1-back (easiest), 2-back, 3-back, 4-back (hardest)
- **Stimulus type**: Visual (shapes in grid positions)
- **Stimulus duration**: 500ms
- **Inter-stimulus interval**: 2500ms
- **Response**: Tap when match, do nothing when no match
- **Target probability**: ~33% match trials

### Scoring Formula

```
1. d' Sensitivity (dprime):
   hits = correct identifications of matches
   misses = missed matches
   false_alarms = incorrect identifications of non-matches as matches
   correct_rejections = correct rejections of non-matches
   
   hit_rate = hits / (hits + misses + 0.5)
   fa_rate = (false_alarms + 0.5) / (false_alarms + correct_rejections + 0.5)
   
   dprime = z(hit_rate) - z(fa_rate)
   dprime_score = clamp(dprime * 20 + 50, 0, 100)

2. Response Bias (c):
   // Did user respond too much or too little?
   c = -0.5 * (z(hit_rate) + z(fa_rate))
   // c > 0 = conservative (miss more), c < 0 = liberal (false alarm more)
   bias_score = max(0, 100 - abs(c) * 30)

3. Maximum N:
   max_n = highest N level with d' >= 1.5 (good discrimination)
   max_n_score = (max_n / max_possible_n) * 100

4. Consistency:
   // SD of accuracy across N levels
   accuracy_sd = standard deviation of accuracy at each N level
   consistency_score = max(0, 100 - accuracy_sd * 2)

5. Focus Score:
   focus_score = (dprime_score * 0.40) + (bias_score * 0.15) + (max_n_score * 0.30) + (consistency_score * 0.15)
```

### Difficulty Adaptation

```typescript
function adaptNBackDifficulty(performance: PerformanceData): AdaptationResult {
  let newN = performance.currentN;
  
  // Increase N if performance is good
  if (performance.dprime >= 2.0 && performance.accuracy >= 0.85) {
    newN = Math.min(newN + 1, 4);
  }
  // Decrease N if performance is poor
  else if (performance.dprime < 1.0 || performance.accuracy < 0.55) {
    newN = Math.max(newN - 1, 1);
  }
  
  return { newN };
}
```

---

## Game 10: Pattern Recall

### Scientific Basis

Based on the **visual-spatial sketchpad** component of Baddeley's working memory model (Baddeley, 1986). The user must reproduce a spatial pattern from memory.

**Key references**:
- Baddeley, A.D. (1986). Working memory. Oxford University Press.
- Baddeley, A.D. (2012). Working memory: theories, models, and controversies.
- Logie, R.H. (2011). The functional organization of working memory.

**What it measures**: Spatial working memory, pattern recognition, visual imagery.

### Gameplay Mechanics

- **Grid**: 5x5 grid of cells
- **Pattern**: A subset of cells are highlighted forming a pattern (4-12 cells)
- **Display**: Pattern shown for 3000ms, then hidden
- **User task**: Recreate the pattern by tapping the correct cells
- **Feedback**: Correct cells glow green after submission, incorrect cells glow red

### Scoring Formula

```
1. Pattern Accuracy (PA):
   correct_cells = cells correctly identified (true positives)
   total_pattern_cells = cells in the original pattern
   false_positives = cells incorrectly selected
   pa = ((correct_cells / total_pattern_cells) * 100) - (false_positives * 5)
   pa = clamp(pa, 0, 100)

2. Pattern Complexity Score (PCS):
   // More complex patterns (irregular shapes, dispersed cells) are harder
   complexity = calculatePatternComplexity(pattern) // 0-1 scale
   pcs = complexity * 100

3. Speed Score:
   time_to_complete = time from pattern hide to submission
   expected_time = pattern_cell_count * 500
   ss = max(0, 100 * (1 - time_to_complete / expected_time))

4. Improvement Score:
   // Compare early patterns vs late patterns
   first_half_accuracy = average accuracy on first half
   second_half_accuracy = average accuracy on second half
   is = min(100, 50 + ((second_half_accuracy - first_half_accuracy) * 2))

5. Focus Score:
   focus_score = (pa * 0.45) + (pcs * 0.15) + (ss * 0.20) + (is * 0.20)
```

---

## Game 11: Executive Function Tests

### Scientific Basis

A composite game containing three subtests of executive function:

1. **Stroop Task** (Stroop, 1935): Color-word interference
2. **Flanker Task** (Eriksen & Eriksen, 1974): Response competition
3. **Wisconsin Card Sorting Test** (Berg, 1948): Cognitive flexibility

**Key references**:
- Stroop, J.R. (1935). Studies of interference in serial verbal reactions.
- Eriksen, B.A. & Eriksen, C.W. (1974). Effects of noise letters on identification.
- Berg, E.A. (1948). A simple objective technique for studying flexibility.

### Subtest A: Stroop Task

**Gameplay**: Color words appear in different ink colors. User must identify the INK COLOR, not the word.

**Scoring**:
```
stroop_interference = incongruent_rt - congruent_rt
// Lower interference = better executive control
stroop_score = max(0, 100 - stroop_interference / 10)

stroop_accuracy = correct_incongruent / total_incongruent * 100

stroop_composite = (stroop_score * 0.50) + (stroop_accuracy * 0.50)
```

### Subtest B: Flanker Task

**Gameplay**: A row of 5 arrows appears. User responds to the CENTER arrow. Flanking arrows may be congruent (>>>>>) or incongruent (>><>>).

**Scoring**:
```
flanker_interference = incongruent_rt - congruent_rt
flanker_score = max(0, 100 - flanker_interference / 8)

flanker_accuracy = correct_incongruent / total_incongruent * 100

flanker_composite = (flanker_score * 0.50) + (flanker_accuracy * 0.50)
```

### Subtest C: Wisconsin Card Sorting (Simplified)

**Gameplay**: Cards differ in color, shape, number. Rule changes after 10 correct. User must discover the rule by trial and error.

**Scoring**:
```
categories_completed = number of rule changes correctly identified
perseverative_errors = continuing to sort by old rule after change
total_errors = all errors

wcs_score = (categories_completed / 6) * 100
perseveration_score = max(0, 100 - perseverative_errors * 10)
error_score = max(0, 100 - total_errors * 5)

wcs_composite = (wcs_score * 0.40) + (perseveration_score * 0.35) + (error_score * 0.25)
```

### Overall Executive Function Score

```
executive_composite = (stroop_composite * 0.35) + (flanker_composite * 0.35) + (wcs_composite * 0.30)
```

---

## Scientific Validation Process

Before any game launches, it must pass scientific validation:

1. **Literature Review**: Establish that the task has been validated in peer-reviewed research
2. **Construct Validity**: Does the game measure what it claims to measure?
3. **Convergent Validity**: Do scores correlate with established measures of the same construct?
4. **Discriminant Validity**: Do scores NOT correlate with unrelated constructs?
5. **Test-Retest Reliability**: Are scores consistent across sessions? (Target: r > 0.80)
6. **Internal Consistency**: Are trial-level scores consistent? (Target: Cronbach's alpha > 0.85)
7. **Sensitivity to Change**: Can the measure detect improvement with practice?
8. **Normative Data**: Population norms established from beta testing (n > 1000)

### Development Timeline

| Game | Prototype | Scientific Review | Beta Test | Launch |
|------|-----------|-------------------|-----------|--------|
| Game 02: Go/No-Go | 2 weeks | 1 week | 4 weeks | Month 3 |
| Game 03: Memory Matrix | 2 weeks | 1 week | 4 weeks | Month 4 |
| Game 04: Visual Search | 2 weeks | 1 week | 4 weeks | Month 5 |
| Game 05: Target Tracking | 3 weeks | 1 week | 4 weeks | Month 6 |
| Game 06: Dual Task | 3 weeks | 2 weeks | 4 weeks | Month 8 |
| Game 07: Peripheral Awareness | 2 weeks | 1 week | 4 weeks | Month 9 |
| Game 08: Attention Switching | 3 weeks | 2 weeks | 4 weeks | Month 10 |
| Game 09: N-Back | 2 weeks | 1 week | 4 weeks | Month 11 |
| Game 10: Pattern Recall | 2 weeks | 1 week | 4 weeks | Month 12 |
| Game 11: Executive Function | 4 weeks | 2 weeks | 4 weeks | Month 14 |
