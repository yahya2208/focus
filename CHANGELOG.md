# Changelog

All notable changes to FOCUS will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [0.4.0-alpha] — 2026-07-16

### Milestone: Internal Alpha

First version ready for real-device testing.

#### Added
- Complete navigation flow: Home → Library → Intro → Calibration → Countdown → Game → Results
- Session History with localStorage persistence (survives page reload)
- Dark/Light theme toggle with persistence
- Settings persistence (theme, reduced motion, high contrast)
- Accessibility: ARIA labels, keyboard navigation, focus management, screen reader support
- Error boundary for crash protection
- Android build configuration (Capacitor)
- Performance measurement guide

#### Fixed
- Calibration profile now passed to game engine (was hardcoded)
- Repository uses localStorage instead of in-memory Map (data was lost on reload)
- Results screen saves session once via useEffect (was saving on every render)
- Calibration confidence calculated dynamically (was always 1.0)
- Input lag estimated by platform (was hardcoded 8ms)

#### Scientific
- Real calibration: refresh rate detection via requestAnimationFrame
- Display lag calculated from detected refresh rate
- Platform-aware input lag estimation (Android/iOS/Desktop)
- Dynamic confidence scoring based on measurement accuracy

---

## [0.3.5] — 2026-07-15

### Milestone: M1 — First Playable Application

Screen router, AppProvider integration, all screens connected.

#### Added
- App.tsx screen router with navigation state
- AppProvider wrapping the application
- Home screen with menu navigation
- Library screen with game selection
- Scientific introduction screen
- Calibration screen with visual feedback
- Countdown screen (3-2-1-GO)
- Game screen with 20-trial reaction time test
- Results screen with metrics and grade
- History screen (was in-memory only)
- Settings screen (placeholder)
- About screen with scientific references

---

## [0.3.0] — 2026-07-14

### Milestone: Plugin Architecture

Plugin framework, game events, service container.

#### Added
- Plugin framework with lifecycle management
- Game event system (stimulus, input, trial, score, session)
- Service container for dependency injection
- Configuration system (app config CRUD)
- Logger with levels (debug, info, warn, error)
- Session metadata tracking
- Feature flags system

---

## [0.2.0] — 2026-07-13

### Milestone: Scientific Engine

Core measurement, calibration, consistency, fatigue, scoring engines.

#### Added
- Measurement types: RawMeasurement, CorrectedMeasurement, MeasurementWithError
- Reaction Engine: stimulus timing → raw RT → corrected RT with uncertainty
- Calibration Engine: refresh rate detection, display lag, input lag estimation
- Consistency Engine: mean, median, SD, CV, IQR outlier detection
- Fatigue Engine: block averages, linear regression, fatigue index (0-1)
- Scoring Engine: weighted composite (40% RT + 30% Consistency + 30% Fatigue)
- Scientific constants: timing, refresh rate benchmarks, scoring thresholds
- Validation dataset with known-good test cases

---

## [0.1.0] — 2026-07-12

### Milestone: Architecture Foundation

Design system, component library, state management.

#### Added
- Design tokens (colors, typography, spacing, motion, shadows)
- Dark theme engine with CSS variables
- React hooks: useTheme, useReducedMotion, useFocusVisible
- Accessibility utilities: useKeyboardTrap, useAriaAnnounce, useFocusRestore
- Typography component with semantic presets
- Grid system (12-column, responsive)
- Component library: Button, Input, Badge, Toggle, StatusIndicator
- Molecules: Card, Modal, Progress, Toast, MetricCard
- Organisms: ThemeSwitcher
- State machine for platform lifecycle
- Event bus for decoupled communication
- Random number generator (seeded)
- Timing engine with mock support
- Repository pattern (memory + localStorage implementations)
- Validation engine with 18 rules

---

## [0.0.1] — 2026-07-11

### Project Initialization

- Vite + React + TypeScript setup
- ESLint, Prettier, Husky configuration
- Package.json with engine requirements
- Basic project structure
