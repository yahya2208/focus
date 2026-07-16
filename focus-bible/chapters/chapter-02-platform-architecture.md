# Chapter 02: Platform Architecture

## 2.1 Vision and Architectural Philosophy

FOCUS is not a single application. It is a platform — a living ecosystem of cognitive training games, each designed to measure and improve specific mental faculties. The architecture must serve three masters: the individual user who expects a seamless, responsive, and delightful experience; the organization that needs aggregate insights and compliance guarantees; and the engineering team that must iterate rapidly without compromising stability. Every architectural decision in this chapter exists to balance those forces.

The core philosophy is **composable modularity**. Every capability — authentication, analytics, synchronization, game logic — is a self-contained unit that can be developed, tested, deployed, and even replaced independently. Nothing is assumed. Everything is explicitly declared. Dependencies flow inward toward stable, well-tested packages, never outward toward volatile application code. The result is a system where a new game can be added in days, not weeks, and where a critical bug in one game cannot cascade into others.

---

## 2.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOCUS PLATFORM                                     │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │   Web App     │  │ Desktop App   │  │  Mobile App   │                    │
│  │   (React/Vite)│  │   (Tauri)     │  │  (Capacitor)  │                    │
│  │               │  │               │  │               │                    │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                    │
│          │                  │                   │                             │
│          └──────────────────┼───────────────────┘                             │
│                             │                                                 │
│                    ┌────────▼────────┐                                        │
│                    │  Shared Layer   │                                        │
│                    │  (packages/)    │                                        │
│                    │                 │                                        │
│                    │ ┌─────────────┐ │                                        │
│                    │ │ shared      │ │  ← Types, utils, constants, hooks     │
│                    │ ├─────────────┤ │                                        │
│                    │ │ ui          │ │  ← Design system, components          │
│                    │ ├─────────────┤ │                                        │
│                    │ │ game-engine │ │  ← Core engine, capability registry   │
│                    │ ├─────────────┤ │                                        │
│                    │ │ analytics   │ │  ← Tracking, reporting, insights      │
│                    │ ├─────────────┤ │                                        │
│                    │ │ sync        │ │  ← Offline-first, conflict resolution │
│                    │ └─────────────┘ │                                        │
│                    └────────┬────────┘                                        │
│                             │                                                 │
│          ┌──────────────────┼──────────────────┐                             │
│          │                  │                  │                              │
│   ┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐                      │
│   │  Supabase   │  │  Edge Funcs   │  │  Storage    │                      │
│   │  PostgreSQL │  │  (Deno)       │  │  (Buckets)  │                      │
│   │  Auth + RLS │  │  Business     │  │  Media,     │                      │
│   │  Realtime   │  │  Logic        │  │  Exports    │                      │
│   └──────┬──────┘  └───────┬───────┘  └──────┬──────┘                      │
│          │                  │                  │                              │
│          └──────────────────┼──────────────────┘                             │
│                             │                                                 │
│                    ┌────────▼────────┐                                        │
│                    │   Cloudflare    │                                        │
│                    │   CDN + Workers  │                                        │
│                    │   DDoS + WAF    │                                        │
│                    └─────────────────┘                                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     External Integrations                               │ │
│  │  PostHog (Analytics)  Sentry (Errors)  Loops (Email)  RevenueCat (Sub) │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

This diagram shows the full platform at a glance. The three client applications share a common layer of packages. That shared layer communicates with Supabase for data, auth, and realtime. Edge functions handle server-side business logic. Cloudflare provides the global edge network for caching, security, and performance. External integrations handle specialized concerns that do not belong in the core platform.

---

## 2.3 Monorepo Strategy with Turborepo

### Why Monorepo

FOCUS will have at minimum three client applications (web, desktop, mobile) and ten or more shared packages. Managing these as separate repositories would create immediate problems: version drift between packages, duplicated configuration, cross-repository dependency management overhead, and fragmented CI/CD pipelines. A monorepo eliminates all of these issues by placing everything in a single repository with shared tooling and configuration.

The monorepo also enables atomic commits. When a shared type changes, every application that depends on that type is updated in the same commit. There is no window where one repository has been updated but another has not. This eliminates an entire class of runtime errors that plague multi-repo architectures.

### Why Turborepo

Turborepo is chosen over Nx, Lerna, and plain npm/yarn workspaces for several specific reasons. First, Turborepo has a fundamentally simpler mental model. It is a task runner that understands dependency graphs and provides caching. Nx is an entire build system with its own plugin ecosystem, generators, and project graph tooling. For a team that wants to focus on building cognitive games, not build system infrastructure, Turborepo's simplicity is a significant advantage.

Second, Turborepo's remote caching is built-in and requires zero configuration beyond setting environment variables. When one developer builds `packages/game-engine`, the result is cached and shared with the entire team. This means that once a package has been built once by anyone on the team, no one else needs to rebuild it. Nx offers remote caching through Nx Cloud, but it is a separate paid service with additional configuration. Turborepo's caching is local by default and remote when you opt in.

Third, Turborepo has better incremental build performance for large monorepos. Its task scheduler is implemented in Rust and handles dependency graph resolution faster than JavaScript-based alternatives. For a monorepo that will grow to include many games and packages, this matters.

Fourth, Turborepo integrates with existing tooling rather than replacing it. It does not have its own test runner, linter, or formatter. It orchestrates the tools you already use. This means the team does not need to learn a new testing framework or code generation system. They use Vitest for testing, ESLint for linting, and Prettier for formatting — all standard tools that any JavaScript developer already knows.

### Turborepo Configuration

The `turbo.json` file at the root of the monorepo defines the build pipeline. Each task declares its dependencies, inputs, outputs, and caching behavior. The key principle is that tasks are only re-run when their inputs change. If `packages/shared` has not changed, any task that depends on it will use the cached result.

```
turbo.json
├── build: depends on ^build (upstream packages must build first)
├── dev: persistent, no cache (always runs fresh in development)
├── lint: depends on ^build (needs built types for accurate linting)
├── test: depends on ^build
├── typecheck: depends on ^build
└── clean: no cache, no dependencies
```

Inputs are defined as the source files of each package plus any configuration files that affect the build. Outputs are the `dist/` directories. This means Turborepo can precisely determine when a rebuild is necessary.

### Package Structure

```
focus/
├── apps/
│   ├── web/                    # React SPA deployed to Vercel
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── desktop/                # Tauri app for Windows/macOS/Linux
│   │   ├── src-tauri/
│   │   ├── src/
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── mobile/                 # Capacitor app for iOS/Android
│       ├── android/
│       ├── ios/
│       ├── src/
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                 # Core types, utils, constants
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── constants/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ui/                     # Design system components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── tokens/
│   │   │   ├── themes/
│   │   │   └── index.ts
│   │   ├── .storybook/
│   │   └── package.json
│   │
│   ├── game-engine/            # Core game engine and capabilities
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   ├── capabilities/
│   │   │   ├── scoring/
│   │   │   ├── calibration/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── analytics/              # Analytics and reporting
│   │   ├── src/
│   │   │   ├── tracking/
│   │   │   ├── reports/
│   │   │   ├── insights/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── sync/                   # Offline-first synchronization
│       ├── src/
│       │   ├── queue/
│       │   ├── conflict/
│       │   ├── transport/
│       │   └── index.ts
│       └── package.json
│
├── turbo.json
├── package.json
├── tsconfig.json               # Base TypeScript config
├── .eslintrc.js
├── .prettierrc
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy-web.yml
        └── release.yml
```

Each `apps/` entry is a deployable application. Each `packages/` entry is a library that can be consumed by any application or other package. The dependency rules are strict: applications can depend on packages, but packages never depend on applications. Within packages, dependencies flow inward — `game-engine` can depend on `shared`, but `shared` never depends on `game-engine`.

---

## 2.4 Layer Architecture

FOCUS follows a four-layer architecture inspired by Clean Architecture and Domain-Driven Design. The layers are Presentation, Application, Domain, and Infrastructure. Each layer has a specific responsibility and specific rules about what it can and cannot depend on.

### Presentation Layer

The Presentation Layer is responsible for rendering the user interface and handling user interactions. It contains React components, pages, layouts, and the visual state management (Zustand stores for UI state like modals, sidebar visibility, theme preferences). This layer knows nothing about business rules or data persistence. It receives data from the Application Layer and dispatches actions to it.

Components in the Presentation Layer are organized by feature, not by type. A game feature contains its own components, hooks, and styles rather than having all components in one folder, all hooks in another, and all styles in a third. This co-location makes it easy to find everything related to a feature and to delete a feature cleanly when it is no longer needed.

The Presentation Layer uses the `packages/ui` design system for all visual elements. No application builds its own button, input, or card component. The design system provides these primitives, and applications compose them into pages and features. This ensures visual consistency across all three platforms (web, desktop, mobile) and across all games.

### Application Layer

The Application Layer contains the use cases and business workflows. When a user completes a game round, the Application Layer orchestrates the sequence: validate the score, update the user's progression, record the analytics event, and trigger any social notifications. Each use case is a single function or hook that coordinates the Domain Layer and Infrastructure Layer.

The Application Layer does not contain business rules — those live in the Domain Layer. It does not contain UI code — that lives in the Presentation Layer. It is the glue between the two. This separation means that the same use case can be triggered from a UI button, from a background sync process, or from a test, without any duplication.

Use cases are exported as functions, not as classes. Functional composition is simpler, more testable, and more composable than class-based patterns. A use case like `completeGameRound` is a function that takes typed parameters and returns a typed result. It can be called from a React hook, from an edge function, or from a test runner without any framework dependency.

### Domain Layer

The Domain Layer contains the pure business logic and type definitions. This is the heart of FOCUS. It defines what a "game" is, what a "capability" is, what a "score" means, how progression works, and how calibration adjusts difficulty. Nothing in the Domain Layer depends on React, Supabase, or any external system. It is pure TypeScript with zero side effects.

The Domain Layer is where the Capability System lives. Every cognitive game in FOCUS maps to one or more capabilities: reaction time, working memory, sustained attention, cognitive flexibility, spatial reasoning, processing speed. The Domain Layer defines these capabilities as types and provides the scoring algorithms that convert raw game performance into capability metrics.

For example, a Stroop task (color-word interference) maps to cognitive flexibility and processing speed. A n-back task maps to working memory. A simple reaction time task maps to reaction time and processing speed. The Domain Layer defines the scoring formulas for each mapping. When a game reports its raw performance data, the Domain Layer translates that into capability scores that are comparable across games.

The Domain Layer also defines the Calibration System. Every user starts with a baseline calibration that establishes their current capability levels. As the user plays more games, the calibration is refined. The calibration algorithms live in the Domain Layer because they are pure mathematical functions that do not depend on any external system.

### Infrastructure Layer

The Infrastructure Layer contains all external integrations: Supabase client calls, Supabase Edge Functions, storage access, authentication flows, analytics tracking, push notifications, email sending. This layer implements the interfaces defined by the Domain and Application Layers but does not define them.

For example, the Domain Layer might define an interface `ScoreRepository` with a method `saveScore(score: Score): Promise<void>`. The Infrastructure Layer provides the implementation `SupabaseScoreRepository` that calls the Supabase client to insert the score into the database. This separation means that if FOCUS ever migrates from Supabase to another backend, only the Infrastructure Layer changes. The Domain and Application Layers remain untouched.

The Infrastructure Layer is also where cross-cutting concerns are implemented: logging, error tracking, retry logic, circuit breakers, and rate limiting. These concerns are applied uniformly across all external calls, ensuring consistent behavior regardless of which game or feature is making the call.

### Dependency Injection Patterns

Dependency injection in FOCUS is achieved through a combination of React Context and module-level configuration objects. Each major service (auth, analytics, sync, scoring) has a configuration object that is set once at application startup and accessed throughout the application.

For example, the Analytics service is configured with a PostHog client instance at startup. Game engines receive this configuration and use it to track events. The specific implementation (PostHog, a custom endpoint, or a mock for testing) is determined by the configuration, not by hardcoded imports.

React Context is used for services that need to be accessed from React components: the auth context provides the current user, the theme context provides the current theme, and the sync context provides the sync status. These contexts are thin wrappers around the actual service implementations, which live outside of React.

This approach avoids the overhead and boilerplate of a full dependency injection framework like InversifyJS or tsyringe. It is explicit, type-safe, and does not require decorators or reflection. The tradeoff is that it is less automated — you must wire things up manually — but for a team of FOCUS's size, the explicitness is an advantage. Every dependency is visible in the code, and there are no magic resolutions that surprise new team members.

---

## 2.5 Event-Driven Architecture

FOCUS uses an event-driven architecture for cross-cutting concerns that span multiple systems. When a user completes a game round, multiple things happen: the score is saved, analytics are recorded, progression is updated, social notifications are sent, and the sync queue is updated. These operations should not be tightly coupled to the game's completion logic. Instead, the game emits a `gameRoundCompleted` event, and each interested system subscribes to it.

The event system is implemented as a typed event emitter in `packages/shared`. Events are defined as a TypeScript interface where each event name maps to a payload type. This provides full type safety — if you emit a `gameRoundCompleted` event, TypeScript enforces that you provide the correct payload (userId, gameId, score, duration, capabilityScores).

Events are dispatched synchronously within a single process. For operations that should happen asynchronously (like sending an email or recording analytics), the event handler starts the async operation but does not await it. This ensures that event dispatch is always fast and never blocks the game's completion flow.

For cross-process communication (like notifying the server that a game was completed), FOCUS uses Supabase Realtime. The client saves the score to Supabase, which triggers a database webhook, which invokes an Edge Function that processes the score server-side. This is not part of the in-process event system — it is a separate concern that uses Supabase's built-in capabilities.

The event system also enables the Plugin Architecture. When a new game is registered, it declares which events it emits and which events it subscribes to. The game engine uses this information to wire up the event handlers automatically. This means adding a new game does not require modifying any existing code — you simply register the game, and the event system handles the rest.

---

## 2.6 Plugin System for Future Games

The Plugin System is the mechanism by which new cognitive games are added to FOCUS without modifying the core platform. Each game is a self-contained module that declares its metadata, capabilities, calibration requirements, and gameplay logic. The platform discovers and loads these modules at runtime.

### Game Registration

Every game must implement the `GameRegistration` interface, which contains:

- **id**: A unique string identifier (e.g., `stroop-classic`, `nback-2-back`)
- **name**: The display name of the game
- **description**: A brief description for the game catalog
- **version**: A semver version string
- **capabilities**: An array of `CapabilityType` values that this game trains
- **calibration**: The calibration configuration (baseline tests, difficulty ranges, adaptive parameters)
- **metadata**: Category, difficulty level, estimated duration, age appropriateness
- **component**: A lazy-loaded React component that renders the game
- **engine**: A factory function that creates the game engine instance

When FOCUS starts, it loads all registered games from the game registry. The registry is a simple array of `GameRegistration` objects. Games are loaded lazily — their code is not fetched until the user actually selects the game. This keeps the initial bundle small and ensures that loading 50 games does not slow down the application startup.

### Capability System

The Capability System is the intellectual core of FOCUS. Every cognitive game trains one or more capabilities, and the platform tracks the user's capability levels over time. This enables cross-game comparisons (a user's memory score from an n-back task can be compared to their memory score from a sequence recall task) and longitudinal tracking (how has this user's memory changed over the past six months).

The base capabilities are:

- **ReactionTime**: The speed of responding to a stimulus. Measured in milliseconds. Trained by simple reaction time tasks, go/no-go tasks, and any game with time-pressured responses.
- **WorkingMemory**: The ability to hold and manipulate information in mind over short periods. Measured by capacity (how many items can be held) and accuracy. Trained by n-back tasks, digit span tasks, and sequence recall tasks.
- **SustainedAttention**: The ability to maintain focus over extended periods. Measured by vigilance (correct detections) and false alarms. Trained by continuous performance tasks and long-duration monitoring tasks.
- **CognitiveFlexibility**: The ability to switch between mental sets or rules. Measured by switch cost (time penalty when switching) and accuracy. Trained by Stroop tasks, task-switching paradigms, and trail-making tasks.
- **SpatialReasoning**: The ability to mentally manipulate spatial information. Measured by accuracy and response time. Trained by mental rotation tasks, spatial navigation tasks, and block design tasks.
- **ProcessingSpeed**: The speed of processing simple stimuli. Measured in items per second. Trained by symbol digit tasks, number comparison tasks, and simple arithmetic tasks.

Each game declares which capabilities it trains and how its performance metrics map to capability scores. The game engine provides raw performance data (reaction times, accuracy, etc.), and the scoring system in the Domain Layer converts these to normalized capability scores on a 0-100 scale.

The Capability System is extensible. New capabilities can be added by defining a new `CapabilityType`, providing scoring algorithms, and registering it in the capability registry. Existing games do not need to change when new capabilities are added — they simply do not declare the new capability.

### Calibration

Calibration is the process of establishing a user's baseline capability levels. Without calibration, a score of 80 on a memory task means nothing — is that good for this user? Calibration provides the context by measuring the user's initial performance and adjusting the difficulty of future games to keep them in the optimal challenge zone.

The calibration system works as follows:

1. **Baseline Assessment**: When a user first plays a game (or any game that trains a particular capability), they go through a brief calibration phase. This consists of 3-5 trials at a fixed difficulty level. The purpose is to establish a rough estimate of the user's ability.

2. **Adaptive Adjustment**: After the baseline, the game uses an adaptive algorithm (similar to Item Response Theory) to adjust the difficulty in real-time. If the user is performing well, difficulty increases. If they are struggling, difficulty decreases. The goal is to keep the user at approximately 75-85% accuracy, which research shows is the optimal zone for learning and improvement.

3. **Capability Mapping**: The user's performance at each difficulty level is used to estimate their capability level. A user who maintains 80% accuracy at a high difficulty level has a higher capability score than a user who maintains 80% at a low difficulty level.

4. **Cross-Game Calibration**: When a user plays a new game that trains the same capability as a game they have already calibrated on, the new game uses the existing calibration as a starting point. This means the user does not need to recalibrate every time they play a new game.

The calibration data is stored in the `calibration` table in Supabase and is synchronized across devices. This ensures that a user who calibrated on their phone gets the same difficulty level when they play on their desktop.

---

## 2.7 Shared Services

### Auth Service

The Auth Service handles user registration, login, session management, and authorization. It is built on Supabase Auth, which provides JWT-based authentication with support for email/password, Google, Apple, and GitHub social login.

The Auth Service exposes a simple interface: `signIn`, `signUp`, `signOut`, `getCurrentUser`, `onAuthStateChange`. All other authentication details are hidden behind this interface. If the team ever migrates away from Supabase Auth, only this service implementation changes.

The Auth Service also handles token refresh automatically. Supabase Auth tokens expire after one hour, and the client library refreshes them transparently. The Auth Service wraps this behavior and adds retry logic for failed refreshes, ensuring that users are never unexpectedly logged out.

### Profile Service

The Profile Service manages user profiles: display name, avatar, preferences, accessibility settings, and subscription status. It reads from and writes to the `profiles` table in Supabase. The profile is cached locally and synchronized via the Sync Service.

The Profile Service also manages user preferences that affect the entire platform: notification settings, theme (light/dark/system), language, and accessibility options (reduced motion, high contrast, larger text). These preferences are stored in the profile and applied at application startup.

### Progression Service

The Progression Service tracks the user's advancement through the FOCUS platform. It maintains a level system, experience points, achievement badges, and streak tracking. The progression is computed from the user's game history and is stored in the `progression` table.

The Progression Service also computes weekly and monthly summaries: total games played, total time spent, capability improvements, and streak status. These summaries are used by the dashboard and by the notification system to send encouraging messages.

### Analytics Service

The Analytics Service tracks user behavior for product analytics and cognitive science research. It records game events (start, pause, complete, score), UI events (button clicks, navigation), and system events (errors, performance metrics). The Analytics Service is implemented as a wrapper around PostHog, providing a typed interface that prevents incorrect event schemas.

The Analytics Service has two modes: development and production. In development, events are logged to the console for debugging. In production, events are sent to PostHog. This dual mode ensures that developers can verify analytics instrumentation without polluting production data.

### Sync Service

The Sync Service is responsible for offline-first data synchronization. When a user plays a game offline (for example, on a flight), the game results are stored locally in IndexedDB. When connectivity is restored, the Sync Service uploads the results to Supabase, resolving any conflicts that arise.

The Sync Service uses a queue-based architecture. Each write operation is added to a queue with a timestamp and a monotonically increasing sequence number. The queue is processed in order, and each operation is retried up to three times before being marked as failed. Failed operations are surfaced to the user with an option to retry or discard.

Conflict resolution follows a last-write-wins strategy for most data types. For data types where conflicts cannot be automatically resolved (like concurrent edits to a profile), the Sync Service presents the conflict to the user and asks them to choose.

### Notifications Service

The Notifications Service handles push notifications, in-app notifications, and email notifications. It is built on Supabase Edge Functions for server-side notification logic, Expo Push Notifications for mobile push, and the Web Push API for web push.

The Notifications Service sends several types of notifications: daily reminders to play, streak warnings (don't forget to play today to maintain your streak), achievement unlocked, weekly progress summary, and social notifications (a friend completed a challenge). Each notification type has a template and a set of rules that determine when it should be sent.

---

## 2.8 Game Lifecycle

Every game in FOCUS follows a standard lifecycle. This lifecycle is defined by the game engine and implemented by each individual game. The lifecycle ensures consistent behavior across all games and provides hooks for cross-cutting concerns like analytics, progression, and sync.

### Registration

Registration happens at application startup. The game's registration metadata is loaded and added to the game registry. This includes the game's ID, name, capabilities, and a reference to its React component and engine factory. Registration is fast — it is just adding an object to an array — and does not load any game code.

### Calibration

When a user plays a game for the first time, they enter the calibration phase. The calibration screen explains the game rules and guides the user through 3-5 practice trials. The difficulty is fixed during calibration to ensure a consistent baseline across users. Calibration data is saved and used as the starting point for future sessions.

### Gameplay

The gameplay phase is where the actual game runs. The game engine manages the game loop, handles input, updates state, and renders the game. The engine provides standard services: timing, input handling, scoring, difficulty adjustment, and pause/resume. The game developer implements the specific gameplay logic but relies on the engine for these standard services.

### Scoring

When a game round ends (either by completing all trials or by the user quitting), the engine computes the score. The score includes raw metrics (reaction times, accuracy, number of correct responses) and computed capability scores (normalized to a 0-100 scale). The scoring algorithm is specific to each game but follows the patterns defined in the Domain Layer.

### Persistence

After scoring, the game results are persisted. First, they are saved to local storage (IndexedDB) for immediate access. Then, they are added to the sync queue for eventual upload to Supabase. The persistence layer handles both online and offline scenarios seamlessly — the game does not need to know whether the device is online.

### Social

After persistence, social features are triggered. If the user's score qualifies for a leaderboard position, the leaderboard is updated. If the user completed a challenge, the challenge status is updated. If the user unlocked an achievement, the achievement notification is triggered. These social features are handled by event handlers that subscribe to the `gameRoundCompleted` event.

---

## 2.9 Cross-Cutting Concerns

### Error Handling

Every layer of FOCUS has a consistent error handling strategy. Domain errors are typed — each error is a specific class or union type that can be matched and handled precisely. Infrastructure errors (network failures, database errors) are wrapped in domain errors before they propagate to the Application Layer. Presentation errors (rendering failures) are caught by React error boundaries that display a user-friendly error screen and log the error to Sentry.

The error hierarchy is:

- **DomainError**: Business logic errors (invalid score, calibration failed, capability not found)
- **InfrastructureError**: External system errors (network timeout, auth failure, storage quota exceeded)
- **ValidationError**: Input validation errors (invalid email, password too short, name contains invalid characters)
- **ApplicationError**: Workflow errors (game not found, user not authenticated, subscription required)

Each error type has a `code`, a `message`, and optional `metadata`. The code is a machine-readable string (e.g., `CALIBRATION_FAILED_TOO_FEW_TRIALS`) that can be used for programmatic handling. The message is a human-readable string that can be displayed to the user.

### Logging

FOCUS uses a structured logging approach. All logs are JSON objects with a consistent schema: timestamp, level, message, context, and optional metadata. In development, logs are printed to the console with color formatting. In production, logs are sent to Sentry for error logs and to PostHog for analytics events.

Log levels are:

- **debug**: Detailed information for debugging. Only enabled in development.
- **info**: General information about application flow. Used in production for key milestones.
- **warn**: Potential issues that do not prevent operation. Used for degraded performance, missing data, and retry attempts.
- **error**: Errors that prevent an operation from completing. Always logged with full context.

### Performance Monitoring

FOCUS tracks performance metrics automatically. Core Web Vitals (LCP, FID, CLS) are measured on the web. App startup time, frame rate, and memory usage are measured on all platforms. Game-specific metrics (frame rate during gameplay, input latency, loading time) are measured by the game engine.

Performance data is sent to PostHog for aggregate analysis and to Sentry for individual performance traces. This enables the team to identify performance regressions quickly and to understand the performance characteristics of different games on different devices.

### Accessibility

Accessibility is not a feature — it is a requirement. Every component in the `packages/ui` design system is built with accessibility in mind. All interactive elements are keyboard-navigable, all images have alt text, all colors meet WCAG 2.1 AA contrast requirements, and all animations respect the `prefers-reduced-motion` media query.

The game engine provides accessibility services: audio descriptions of visual stimuli, haptic feedback as an alternative to visual cues, and adjustable timing for users who need more time to respond. These services are opt-in — games that support them declare their accessibility features in their registration metadata.

---

## 2.10 State Management

### Zustand for UI State

UI state is managed with Zustand. Zustand is chosen for its simplicity, minimal API surface, and excellent TypeScript support. Unlike Redux, Zustand does not require action types, reducers, middleware, or providers. A Zustand store is a plain function that returns a state object and a set of actions.

UI state includes: which modal is open, whether the sidebar is collapsed, the current theme, the selected game filter, and whether the user has completed the onboarding tutorial. This state is ephemeral — it does not persist to the server and is reset when the application reloads.

Zustand stores are organized by feature, not by type. There is a `useGameStore` for game-related UI state, a `useProfileStore` for profile-related UI state, and a `useNotificationStore` for notification-related UI state. Each store is small, focused, and independent.

### React Query for Server State

Server state is managed with React Query (TanStack Query). React Query handles fetching, caching, synchronization, and refetching of server data. It is not a state management library — it is a server state synchronization library. This distinction is important: React Query does not store application state, it stores the results of server queries.

React Query provides: automatic cache invalidation when data is mutated, background refetching to keep data fresh, optimistic updates for immediate UI feedback, retry logic for failed requests, and pagination/infinite scroll support.

Server state includes: user profile, game history, leaderboards, challenges, analytics reports, and capability scores. All of this data originates from Supabase and is managed by React Query.

The combination of Zustand and React Query provides a clean separation of concerns. UI state (what the user sees) is in Zustand. Server state (what the server knows) is in React Query. Neither library crosses into the other's domain.

---

## 2.11 Routing

FOCUS uses file-based routing with React Router v6+. File-based routing means that the file system structure determines the URL structure. A file at `apps/web/src/pages/games/[gameId].tsx` automatically becomes the route `/games/:gameId`.

File-based routing provides several benefits: the route structure is visible from the file system, there is no central routing configuration to maintain, and new routes can be added by creating a new file. React Router v6+ provides nested routes, layout routes, and route guards, all of which are used by FOCUS.

Route guards are implemented as wrapper components that check authentication and authorization before rendering the child route. An unauthenticated user who navigates to `/dashboard` is redirected to `/login`. A user on a free plan who navigates to `/analytics/advanced` is shown an upgrade prompt.

The routing structure follows a hierarchy:

```
/                           → Landing page (marketing)
/login                      → Login page
/signup                     → Signup page
/onboarding                 → Onboarding flow (multi-step)
/dashboard                  → Main dashboard
/games                      → Game catalog
/games/:gameId              → Game detail (play, history, capabilities)
/profile                    → User profile
/settings                   → User settings
/settings/notifications     → Notification preferences
/settings/accessibility     → Accessibility settings
/analytics                  → Analytics overview
/analytics/capabilities     → Capability tracking
/analytics/history         → Game history
/leaderboards               → Global leaderboards
/challenges                 → Social challenges
/enterprise                 → Enterprise dashboard (multi-tenant)
/enterprise/org/:orgId      → Organization management
```

---

## 2.12 Responsive Architecture

FOCUS must work beautifully on screens ranging from 320px (small phones) to 2560px (ultrawide monitors). The responsive architecture handles this range through a combination of fluid layouts, breakpoint-based adjustments, and platform-specific adaptations.

The design system defines five breakpoints:

- **sm**: 640px (large phones)
- **md**: 768px (tablets)
- **lg**: 1024px (small laptops)
- **xl**: 1280px (standard laptops)
- **2xl**: 1536px (desktop monitors)

Below 640px (the "mobile" range), the layout uses a single-column structure with full-width components. The game catalog is a vertical list, the dashboard is a stack of cards, and navigation is a bottom tab bar.

At 640px and above, the layout shifts to a two-column structure with a sidebar for navigation and a main content area. The game catalog becomes a grid, the dashboard uses a multi-column layout, and the sidebar provides quick access to all sections.

At 1024px and above, additional features become visible: the analytics page shows side-by-side comparison charts, the game detail page shows the game alongside its history and capability scores, and the enterprise dashboard shows all metrics simultaneously.

Platform-specific adaptations are handled by the `packages/shared` platform detection utilities. The web app uses hover states and mouse interactions. The mobile app uses touch interactions and swipe gestures. The desktop app supports both mouse and keyboard navigation with custom shortcuts.

---

## 2.13 Offline-First Principles

FOCUS is designed to work offline by default. Cognitive training should not be interrupted by a poor internet connection. The offline-first architecture ensures that users can play games, view their history, and track their progress without any network connectivity.

The offline-first approach uses the following strategies:

- **Service Workers**: The web app registers a service worker that caches the application shell (HTML, CSS, JavaScript) and static assets (images, fonts, game assets). This ensures that the application loads even without a network connection.

- **IndexedDB**: All game results, user preferences, and cached server data are stored in IndexedDB. This provides a persistent, structured data store that survives browser restarts. The `packages/sync` library provides a typed wrapper around IndexedDB that handles schema migrations and transactions.

- **Optimistic Updates**: When a user performs an action (completing a game, updating their profile), the UI updates immediately based on the local data. The server is updated in the background. If the server update fails, the local data is preserved and retried later.

- **Sync Queue**: All write operations are added to a queue. The queue is processed when connectivity is restored. Each operation in the queue includes the data, a timestamp, and a retry count. Operations are retried up to three times with exponential backoff.

- **Conflict Resolution**: When the same data is modified both locally and on the server, a conflict occurs. FOCUS uses a last-write-wins strategy for most data types, with the most recent modification (by timestamp) taking precedence. For critical data like game scores, conflicts are rare because scores are append-only (a new score does not conflict with an old score).

---

## 2.14 Security Architecture

### Zero-Trust Model

FOCUS operates on a zero-trust security model. Every request is authenticated and authorized, regardless of its origin. There is no concept of an "internal" network that is inherently trusted. This model is essential for a platform that handles sensitive cognitive and health data.

### Row Level Security (RLS)

All database access in Supabase is controlled by Row Level Security policies. Each table has RLS enabled, and each policy specifies exactly which rows a user can read, insert, update, or delete. The fundamental rule is: a user can only access their own data.

For example, the `game_scores` table has a policy that allows a user to read only rows where `user_id = auth.uid()`. This means that even if a developer writes a query that does not include a `WHERE` clause, the RLS policy ensures that only the current user's scores are returned. The security is enforced at the database level, not the application level, which eliminates an entire class of authorization bugs.

For enterprise accounts, RLS policies are more complex. An organization admin can read scores for all users in their organization. A researcher can read aggregated (non-individual) scores for their organization. These policies use Supabase's JWT claims to determine the user's role and organization.

### Encryption

All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Supabase handles encryption at rest automatically. For additional protection, FOCUS encrypts sensitive fields (like email addresses and cognitive scores) at the application level using the `pgcrypto` PostgreSQL extension before storing them in the database. This means that even a database administrator cannot read the raw data without the encryption key.

The encryption keys are managed through a key hierarchy. A master key is stored in a hardware security module (HSM) provided by the cloud platform. Data encryption keys are derived from the master key and rotated every 90 days. The key rotation is handled automatically by a Supabase Edge Function.

### API Security

All API requests to Supabase are authenticated with JWT tokens. The tokens are short-lived (one hour) and are refreshed automatically by the client library. The tokens contain the user's ID and role, which are used by RLS policies for authorization.

Supabase Edge Functions are protected by a service role key that is never exposed to the client. These functions run with elevated privileges and are the only way to perform operations that span multiple users (like computing organization-wide analytics).

Cloudflare provides DDoS protection, rate limiting, and a Web Application Firewall (WAF). The WAF blocks common attack patterns (SQL injection, XSS, CSRF) before they reach the Supabase API. Rate limiting ensures that no single user can overwhelm the system with requests.

---

## 2.15 Scalability Architecture

### Horizontal Scaling via Supabase

Supabase handles horizontal scaling automatically. PostgreSQL can be configured for read replicas, and Supabase manages the replication and load balancing. For FOCUS, this means that read-heavy operations (viewing game history, browsing leaderboards) can be served by replicas, while write-heavy operations (saving scores, updating profiles) go to the primary instance.

Supabase Edge Functions scale to zero when not in use and scale up automatically when traffic increases. This means FOCUS pays only for the compute it uses. During off-peak hours (late night in most time zones), the Edge Functions scale down to zero, saving cost. During peak hours (evening in the US and Europe), they scale up to handle the load.

### Edge Functions for Business Logic

Supabase Edge Functions run on Deno Deploy, which is a serverless platform that deploys functions to over 30 edge locations worldwide. This means that business logic executes close to the user, reducing latency. For FOCUS, this is important for game score submission (users expect immediate feedback) and for analytics aggregation (enterprise dashboards should load quickly regardless of the user's location).

Edge Functions are used for operations that require elevated privileges or that span multiple database tables: computing organization-wide analytics, sending email notifications, processing subscription webhooks, and generating export files. These operations are too complex or too privileged to run on the client.

### Multi-Tenant Architecture for Enterprise

FOCUS Enterprise provides organizations with aggregate insights into their members' cognitive performance. The multi-tenant architecture ensures that each organization's data is isolated and that no organization can access another organization's data.

Multi-tenancy is implemented at the database level using RLS policies. Each table includes an `organization_id` column. RLS policies ensure that a user can only read rows where the `organization_id` matches their organization. This provides strong isolation without requiring separate database instances for each organization.

Enterprise features include: organization dashboards with aggregate analytics, member management (invite, remove, assign roles), custom branding (organization logo and colors), and data export (CSV, PDF). These features are gated by the subscription tier and are only available to enterprise customers.

### API Versioning

The FOCUS API is versioned using URL path versioning (`/v1/`, `/v2/`). This is chosen over header-based versioning because it is explicit, cacheable, and easy to test in a browser. The current version is v1, and no breaking changes will be made to v1 endpoints.

When a breaking change is necessary, a new version is created alongside the old one. The old version continues to work for at least 12 months after the new version is released, giving clients time to migrate. The version is included in the URL, not in a header, which makes it easy to see which version is being used in logs, documentation, and debugging tools.

### Feature Flags

Feature flags are implemented using PostHog's feature flag system. Feature flags allow the team to deploy code to production without making it visible to users. New features are wrapped in a flag check: `if (isEnabled('new-game-engine')) { ... }`. The flag is toggled in PostHog's dashboard, which updates all clients within seconds.

Feature flags serve several purposes: gradual rollout (enable a feature for 10% of users first), A/B testing (show different versions to different users), kill switches (instantly disable a broken feature), and beta testing (enable features for specific users or organizations).

### A/B Testing

A/B testing is integrated with PostHog's experiment system. Each experiment defines a control and one or more variants. Users are randomly assigned to a variant and their behavior is tracked. The experiment dashboard shows the statistical significance of each variant's performance.

For FOCUS, A/B testing is used for: game UI changes (does a new layout improve completion rates?), scoring algorithm changes (does a new formula better predict capability improvements?), and onboarding flow changes (does a shorter onboarding improve activation?).

---

## 2.16 Deployment Architecture

### Web: Vercel

The web application is deployed to Vercel. Vercel provides automatic deployments from Git (every push to `main` triggers a production deployment), preview deployments for pull requests, edge rendering for fast initial loads, and automatic HTTPS. Vercel's integration with Turborepo means that only the changed packages are rebuilt and deployed, reducing deployment time.

### Mobile: Capacitor

The mobile application uses Capacitor to wrap the web application in a native container. Capacitor is chosen over React Native because it allows FOCUS to use a single codebase for all platforms. The web application runs in a WebView on iOS and Android, and Capacitor provides plugins for native features like push notifications, haptic feedback, and app lifecycle events.

Capacitor is chosen over Cordova because it is actively maintained, has better performance (it uses the latest WebView engines), and provides a simpler development workflow. The Capacitor CLI generates native Xcode and Android Studio projects that can be built and submitted to the App Store and Google Play.

### Desktop: Tauri

The desktop application uses Tauri to wrap the web application in a native container. Tauri is chosen over Electron because it produces much smaller binaries (Tauri apps are typically 5-10MB, while Electron apps are 100-200MB), uses less memory (Tauri uses the system WebView, while Electron bundles its own Chromium), and has better security (Tauri's Rust backend has a minimal attack surface).

Tauri supports Windows, macOS, and Linux from a single codebase. The desktop app is built using the same web code as the web application, with platform-specific adaptations handled by the `packages/shared` platform detection utilities.

### CDN and Edge: Cloudflare

Cloudflare provides the global edge network for FOCUS. Static assets (images, fonts, game resources) are served from Cloudflare's CDN, which caches them at edge locations worldwide. Cloudflare's DDoS protection and WAF protect the application from attacks. Cloudflare Workers can be used for edge computing tasks that need to run closer to the user than Supabase Edge Functions.

### Monitoring: Sentry and PostHog

Sentry provides error tracking and performance monitoring. Every error that occurs in any FOCUS application is captured by Sentry, which groups similar errors, provides stack traces, and alerts the team when a new error type appears. Sentry also tracks performance metrics like API response times and page load times.

PostHog provides product analytics, feature flags, and A/B testing. PostHog tracks user behavior (which games are played, how long sessions last, where users drop off) and provides dashboards for understanding user engagement. Feature flags and A/B tests are managed through PostHog's interface.

### Email: Loops

Loops provides transactional and marketing email. Transactional emails include welcome messages, password resets, and subscription confirmations. Marketing emails include weekly progress summaries, new feature announcements, and re-engagement campaigns for inactive users. Loops is chosen over SendGrid and Mailchimp because it provides a better developer experience, built-in user segmentation, and a visual email builder that the marketing team can use without developer support.

### Subscriptions: RevenueCat

RevenueCat manages in-app purchases and subscriptions across all platforms. It provides a unified API for purchasing on the App Store, Google Play, and Stripe (web). RevenueCat handles receipt validation, subscription status tracking, and churn prevention. It is chosen over managing IAP directly because it provides a single source of truth for subscription status across platforms, handles edge cases like failed renewals and family sharing, and provides analytics on subscription metrics (MRR, churn, LTV).

---

## 2.17 Summary

The FOCUS platform architecture is designed for three things: user experience, developer experience, and scalability. The composable modularity ensures that new games can be added without modifying existing code. The four-layer architecture ensures that business logic is isolated from UI and infrastructure concerns. The event-driven architecture ensures that cross-cutting concerns are handled uniformly. The offline-first design ensures that cognitive training is never interrupted. The security architecture ensures that sensitive data is protected at every layer. The scalability architecture ensures that FOCUS can grow from a single user to millions without architectural changes.

Every decision in this chapter was made with explicit tradeoffs documented. The architecture is not perfect — no architecture is — but it is intentional. Every component was chosen for a specific reason, and every alternative was considered. This intentionality is what makes the architecture maintainable: when a new team member joins, they can understand not just what the architecture is, but why it is that way.
