# Scientific Terminology — FOCUS v2.0

*Frozen after Phase -0.5.*

## Measurement Terms

| Term | Definition |
|---|---|
| **Stimulus** | The visual/auditory cue presented to the user to trigger a response |
| **Raw Measurement (Raw RT)** | The uncorrected time between stimulus presentation and user input |
| **Corrected Measurement (Corrected RT)** | Raw RT after subtracting display lag and input lag |
| **Display Lag** | Time between GPU frame presentation and photons reaching the user's eyes. Derived from refresh rate. |
| **Input Lag** | Time between physical input (tap/click) and the browser receiving the event. Platform-dependent. |
| **Calibration Profile** | Object containing refresh rate, display lag, input lag, and confidence score |
| **Confidence Score** | 0.0–1.0 score indicating calibration accuracy. Based on frame accuracy and refresh rate validity. |
| **False Start** | A response faster than the minimum human reaction time (~100ms). Discarded from analysis. |
| **Reaction Time (RT)** | Time from stimulus to valid response, after calibration correction |

## Statistical Terms

| Term | Definition |
|---|---|
| **Mean** | Arithmetic average of all RTs in a session |
| **Median** | Middle value of sorted RTs. More robust to outliers than mean. |
| **Standard Deviation (SD)** | Measure of RT spread. Higher = less consistent. |
| **Coefficient of Variation (CV)** | SD / Mean. Normalized measure of consistency. |
| **Interquartile Range (IQR)** | Q3 - Q1. Used for outlier detection. |
| **Outlier** | Data point outside Q1 - 1.5×IQR or Q3 + 1.5×IQR |
| **Linear Regression** | Statistical method to detect trends in block averages (fatigue detection) |

## Engine Terms

| Term | Definition |
|---|---|
| **Reaction Engine** | Processes individual RTs with calibration correction |
| **Consistency Engine** | Computes statistical measures of RT variability |
| **Fatigue Engine** | Detects cognitive fatigue via block analysis and regression |
| **Scoring Engine** | Produces Focus Score from weighted composite |
| **Measurement Pipeline** | Orchestrates all engines in sequence: Calibration → Reaction → Consistency → Fatigue → Scoring |

## Session Terms

| Term | Definition |
|---|---|
| **Session** | A complete measurement cycle: Calibration → Countdown → Game → Results |
| **Round** | A single stimulus-response cycle within a game |
| **Block** | A group of rounds used for fatigue analysis (default: 3 blocks) |
| **Focus Score** | Final weighted composite: 40% RT + 30% Consistency + 30% Fatigue |
| **Grade** | Letter grade derived from Focus Score: A (90+), B (80+), C (70+), D (60+), F (<60) |

## Platform Terms

| Term | Definition |
|---|---|
| **Plugin** | A game component that emits timing events without knowing about measurement |
| **Repository** | Data access layer abstraction (localStorage or memory) |
| **Calibration** | The hardware detection phase before measurement begins |
| **Platform** | The device type: Android, iOS, or Desktop |

## Research Terms

| Term | Definition |
|---|---|
| **Research Dataset** | Anonymized collection of sessions for scientific analysis |
| **Survey** | Optional questionnaire about user context (sleep, coffee, etc.) |
| **Research Console** | Dashboard for viewing aggregated research data |
