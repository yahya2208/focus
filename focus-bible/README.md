# FOCUS — The Ultimate Brain Training Platform
# Engineering Bible v1.0

## The Single Source of Truth for the Entire FOCUS Product

**Document Status**: Complete  
**Total Words**: ~170,000  
**Chapters**: 28  
**Last Updated**: July 2026  

---

## Purpose

This document is the constitution of the FOCUS ecosystem. It is designed so that a team of senior engineers from Google, Apple, Valve, Sony, and OpenAI can build the platform without asking any further questions. Every architectural decision is explained. Every database table is defined. Every screen is documented. Every animation is described. Every API is specified. Every gameplay rule is mathematically defined. Every reward system is deterministic. Every security rule is included.

---

## Table of Contents

### Part I: Foundation

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [01](chapters/chapter-01-executive-summary.md) | Executive Summary & Vision | Product vision, market analysis, business model, KPIs, technology choices, risk assessment, development timeline | ~3,800 |
| [02](chapters/chapter-02-platform-architecture.md) | Platform Architecture | High-level architecture, monorepo strategy, layer architecture, state management, routing, offline-first principles, security, scalability | ~7,800 |
| [03](chapters/chapter-03-technology-stack.md) | Technology Stack & Infrastructure | Every technology choice with justification, alternatives considered, bundle sizes, performance implications | ~5,900 |
| [04](chapters/chapter-04-database-schema.md) | Database Schema & Data Architecture | 50+ PostgreSQL tables with complete column definitions, indexes, RLS policies, functions, triggers, materialized views | ~9,500 |

### Part II: Security & Game Engine

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [05](chapters/chapter-05-authentication-security.md) | Authentication & Security | Auth providers, OAuth, JWT, biometrics, 2FA, GDPR/COPPA compliance, zero-trust, RLS deep dive | ~9,700 |
| [06](chapters/chapter-06-game-engine.md) | Game Engine Architecture | Core engine, state machines, timing engine, score engine, calibration, adaptation, anti-cheat, event system, plugin architecture | ~5,800 |
| [07](chapters/chapter-07-reaction-light-test.md) | Game 01: Reaction Light Test | PVT-inspired game, exponential ISI algorithm, scoring formula, difficulty adaptation, calibration, fatigue detection, animations, sound, haptics | ~5,000 |
| [08](chapters/chapter-08-progression-rewards.md) | Progression & Reward Systems | XP system, level progression, achievements, streaks, daily missions, weekly challenges, unlockable content | ~5,400 |

### Part III: Social & Design

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [09](chapters/chapter-09-social-leaderboards.md) | Social & Leaderboard Systems | Friend system, 9 leaderboard types, seasonal system, groups, messaging, privacy, COPPA compliance | ~6,600 |
| [10](chapters/chapter-10-ui-design-system.md) | UI/UX Design System | Neurocentric design philosophy, color system, typography, spacing, grid, components, glass effects, depth, icons, themes, design tokens | ~6,400 |
| [11](chapters/chapter-11-motion-animation.md) | Motion & Animation System | Framer Motion, spring physics, easing, page transitions, component animations, game animations, reduced motion, performance rules | ~5,300 |
| [12](chapters/chapter-12-sound-haptic.md) | Sound & Haptic Design | Web Audio API engine, sound categories, ambient audio, haptic patterns (iOS/Android), battery-aware, accessibility | ~4,900 |

### Part IV: Infrastructure & Analytics

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [13](chapters/chapter-13-offline-sync-caching.md) | Offline Sync & Caching | IndexedDB schema, bidirectional sync, conflict resolution, Service Worker, caching strategies, bandwidth awareness | ~6,000 |
| [14](chapters/chapter-14-analytics-telemetry.md) | Analytics & Telemetry | Event taxonomy (8 categories), PostHog/Sentry integration, feature flags, A/B testing, performance monitoring, privacy | ~5,000 |
| [15](chapters/chapter-15-privacy-compliance.md) | Privacy & Compliance | GDPR, COPPA, CCPA, data classification, encryption, audit logging, data retention, international transfers | ~7,000 |
| [16](chapters/chapter-16-testing-strategy.md) | Testing Strategy | Test pyramid, Vitest unit tests, React Testing Library integration, Playwright E2E, visual regression, performance testing, security testing | ~4,200 |

### Part V: DevOps & Standards

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [17](chapters/chapter-17-cicd-deployment.md) | CI/CD & Deployment | GitHub Actions pipelines, deployment targets (Vercel/Capacitor/Tauri), versioning, auto-update, rollback, monitoring | ~5,600 |
| [18](chapters/chapter-18-performance-budgets.md) | Performance Budgets | Bundle size limits, Core Web Vitals targets, runtime performance, mobile/desktop budgets, optimization techniques | ~5,000 |
| [19](chapters/chapter-19-coding-standards.md) | Coding Standards | TypeScript config, naming conventions, code style, React rules, error handling, import order, git conventions, ESLint config | ~3,800 |
| [20](chapters/chapter-20-architecture-decision-records.md) | Architecture Decision Records | 10 ADRs: Supabase, Capacitor, Tauri, Dark Mode, Zustand, React Query, Exponential Distribution, Offline-First, Monorepo, Freemium | ~7,600 |

### Part VI: Localization & Accessibility

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [21](chapters/chapter-21-localization.md) | Localization | 20 languages, i18next architecture, RTL support, text expansion, translation workflow, quality standards | ~5,900 |
| [22](chapters/chapter-22-accessibility.md) | Accessibility | WCAG 2.1 AA/AAA, keyboard navigation, ARIA, screen readers, color contrast, motion, touch, cognitive, testing | ~4,700 |

### Part VII: Games & Structure

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [23](chapters/chapter-23-future-games.md) | Future Games Roadmap | 10 future games with scientific basis, scoring formulas, difficulty adaptation, calibration protocols, capability mapping | ~4,800 |
| [24](chapters/chapter-24-folder-structure.md) | Folder Structure | Complete monorepo directory tree with every file and directory documented | ~8,000 |

### Part VIII: API & Operations

| Chapter | Title | Description | Words |
|---------|-------|-------------|-------|
| [25](chapters/chapter-25-api-reference.md) | API Reference | 60+ REST API endpoints with TypeScript types, error codes, rate limits, RLS policies | ~8,100 |
| [26](chapters/chapter-26-error-handling.md) | Error Handling | 10 error categories, 80+ error codes, error boundaries, global handlers, retry strategy, offline error handling | ~9,600 |
| [27](chapters/chapter-27-versioning-strategy.md) | Versioning Strategy | SemVer, Changesets, release channels, database migration strategy, mobile/desktop versioning, API versioning, changelog | ~5,100 |
| [28](chapters/chapter-28-app-store-compliance.md) | App Store Compliance | Apple App Store, Google Play, desktop distribution, privacy policy, ToS, content ratings, marketing claims | ~10,000 |

---

## Architecture Decision Records

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](adr/ADR-001-supabase-backend.md) | Use Supabase as Backend Platform | Accepted |
| [ADR-002](adr/ADR-002-capacitor-mobile.md) | Use Capacitor for Mobile (not React Native) | Accepted |
| [ADR-003](adr/ADR-003-tauri-desktop.md) | Use Tauri for Desktop (not Electron) | Accepted |
| [ADR-004](adr/ADR-004-dark-mode-default.md) | Dark Mode as Default Theme | Accepted |
| [ADR-005](adr/ADR-005-zustand-state.md) | Zustand over Redux for State Management | Accepted |
| [ADR-006](adr/ADR-006-react-query.md) | React Query for Server State | Accepted |
| [ADR-007](adr/ADR-007-exponential-distribution.md) | Exponential Distribution for ISI Timing | Accepted |
| [ADR-008](adr/ADR-008-offline-first.md) | Offline-First Architecture | Accepted |
| [ADR-009](adr/ADR-009-monorepo-turborepo.md) | Monorepo with Turborepo | Accepted |
| [ADR-010](adr/ADR-010-freemium-model.md) | Freemium Business Model | Accepted |

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Total chapters | 28 |
| Total words | ~170,000 |
| Total files | 28 chapter files + index |
| Database tables defined | 50+ |
| API endpoints documented | 60+ |
| Error codes defined | 80+ |
| Game designs specified | 11 (1 implemented + 10 roadmap) |
| ADRs written | 10 |
| Languages supported | 20 |
| Platform targets | 6 (Web, iOS, Android, Windows, macOS, Linux) |

---

## How to Use This Document

### For New Engineers
Start with Chapter 01 (Executive Summary) to understand the product vision. Then read Chapter 02 (Platform Architecture) for the technical overview. Follow the table of contents to dive into your area of responsibility.

### For Product Managers
Read Chapters 01, 07, 08, 09, 23 for product decisions, gameplay mechanics, progression systems, social features, and game roadmap.

### For Designers
Read Chapters 10 (UI/UX Design System), 11 (Motion & Animation), 12 (Sound & Haptic), and 22 (Accessibility) for the complete design language.

### For Backend Engineers
Read Chapters 04 (Database Schema), 05 (Auth & Security), 13 (Offline Sync), 14 (Analytics), and 25 (API Reference) for the complete backend specification.

### For Frontend Engineers
Read Chapters 06 (Game Engine), 07 (Reaction Light Test), 18 (Performance Budgets), 19 (Coding Standards), and 24 (Folder Structure) for the frontend implementation guide.

### For QA Engineers
Read Chapter 16 (Testing Strategy) for the complete testing approach.

### For DevOps Engineers
Read Chapters 17 (CI/CD), 27 (Versioning), and 28 (App Store Compliance) for deployment and operations.

---

## Platform Summary

**FOCUS** is not a game. It is a cognitive performance ecosystem where games are modules inside a larger platform. Every game shares authentication, XP, levels, achievements, leaderboards, daily missions, weekly challenges, cloud saves, analytics, progression, statistics, player profiles, social features, accessibility, localization, performance rules, security rules, coding standards, and design system.

**Technology Stack**: React + TypeScript + Vite + Capacitor + Tauri + Supabase  
**Target Platforms**: Web, iOS, Android, Windows, macOS, Linux  
**First Game**: Reaction Light Test (inspired by the Psychomotor Vigilance Task)  
**Design Philosophy**: Neurocentric — intelligence, neuroscience, premium technology  

---

*This document is the constitution of the FOCUS ecosystem. It is complete. It is exhaustive. It is the single source of truth.*
