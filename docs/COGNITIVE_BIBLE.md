# Cognitive Bible — FOCUS v2.0

*The scientific philosophy of FOCUS.*

## What FOCUS Is
FOCUS is a scientific cognitive measurement platform. It measures human cognitive performance through reaction time testing with hardware-aware calibration.

## What FOCUS Is NOT
- NOT a game (games are measurement tools)
- NOT a medical diagnostic tool
- NOT a competitive leaderboard (leaderboards are optional social features)
- NOT entertainment (validity > engagement)

## Core Scientific Principles

### 1. Measurement Integrity
Every measurement must account for hardware variability. Raw reaction time without calibration correction is scientifically meaningless.

### 2. Calibration-First
The calibration phase detects:
- Display refresh rate (via requestAnimationFrame)
- Display lag (derived from refresh rate)
- Input lag (platform-aware: Android/iOS/Desktop)
- Dynamic confidence score

Without calibration, no measurement is valid.

### 3. Corrected Reaction Time
```
Corrected RT = Raw RT - Display Lag - Input Lag
```
With an uncertainty envelope based on calibration confidence.

### 4. Consistency Over Speed
A fast but inconsistent user may have lower cognitive performance than a slightly slower but highly consistent user. Consistency is measured by:
- Standard Deviation
- Coefficient of Variation
- IQR-based outlier detection

### 5. Fatigue Detection
Cognitive performance degrades over time. FOCUS detects fatigue by:
- Dividing sessions into blocks
- Computing block averages
- Running linear regression on block averages
- Calculating a fatigue index (0 = no fatigue, 1 = severe fatigue)

### 6. Focus Score
A weighted composite that balances:
- 40% Reaction Time (corrected)
- 30% Consistency
- 30% Fatigue resistance

Grades: A (90+), B (80+), C (70+), D (60+), F (<60)

### 7. No Gamification Contamination
XP, levels, badges, and achievements MUST NOT influence:
- Calibration parameters
- Measurement algorithms
- Scientific constants
- Focus Score calculation

Gamification is a separate layer that reads results, never writes to measurement.

### 8. Offline-First Privacy
All measurement data stays on the user's device. Cloud sync is opt-in and requires explicit consent. Research datasets are anonymized.

### 9. Cross-Device Comparability
The goal is that a measurement on a budget Android phone is comparable to a measurement on a high-end desktop. Calibration is the mechanism that enables this.

### 10. Scientific Humility
Not all indicators are equally validated. FOCUS classifies each indicator:
- **Scientific**: Strong evidence, cross-device validated
- **Experimental**: Promising but needs more data
- **Informational**: Interesting but not validated

This classification is documented in Phase 7.5 (Scientific Validation).

## Research Foundation
FOCUS measurements are inspired by:
- Hick-Hyman Law (choice reaction time)
- Sternberg's memory scanning paradigm
- Psychomotor vigilance task (PVT)
- NASA Task Load Index (subjective workload)

## Ethical Commitments
- No dark patterns to increase engagement
- No selling user data
- No addictive mechanics in measurement flow
- Transparent about limitations
- Clear disclaimer: "Not a medical diagnostic tool"
