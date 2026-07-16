# Chapter 24: Folder Structure

## Overview

This chapter defines the complete monorepo folder structure for the FOCUS platform. Every directory and file is documented with its purpose. This structure is the single reference for where code lives and how the codebase is organized.

## Root Directory

```
focus/
├── .github/                          # GitHub configuration and CI/CD
│   ├── workflows/                    # GitHub Actions workflow definitions
│   │   ├── pr-validation.yml         # CI pipeline for pull requests (lint, test, build)
│   │   ├── staging-deploy.yml        # Deploy to staging on merge to develop
│   │   ├── production-deploy.yml     # Deploy to production on merge to main
│   │   ├── mobile-build.yml          # Build iOS and Android via Capacitor
│   │   ├── desktop-build.yml         # Build Windows, macOS, Linux via Tauri
│   │   ├── release.yml               # Create GitHub releases with changelogs
│   │   └── dependency-review.yml     # Automated dependency vulnerability review
│   ├── CODEOWNERS                    # Code ownership rules for PR review assignments
│   ├── pull_request_template.md      # Standardized PR description template
│   └── dependabot.yml                # Dependabot configuration for automated dependency updates
│
├── .vscode/                          # VS Code workspace settings
│   ├── settings.json                 # Editor settings (format on save, tab size, etc.)
│   ├── extensions.json               # Recommended extensions for the project
│   └── launch.json                   # Debug configurations for Node.js and browsers
│
├── turbo.json                        # Turborepo configuration (build pipeline, caching, tasks)
├── package.json                      # Root package.json (workspaces, scripts, devDependencies)
├── package-lock.json                 # Lockfile for deterministic installs
├── tsconfig.base.json                # Shared TypeScript configuration (extended by all packages)
├── .eslintrc.js                      # Root ESLint configuration (shared rules)
├── .prettierrc                       # Prettier configuration (code formatting)
├── .gitignore                        # Git ignore rules (node_modules, dist, .env, etc.)
├── .nvmrc                            # Node.js version pinning (20 LTS)
├── .env.example                      # Example environment variables (committed to repo)
├── .env.local                        # Local environment variables (git-ignored)
├── README.md                         # Project overview and getting started guide
├── LICENSE                           # License file (Proprietary or MIT based on decision)
├── CHANGELOG.md                      # Auto-generated changelog from conventional commits
└── lerna.json                        # (Optional) Lerna config if used alongside Turborepo
```

## Applications Directory

### apps/web/ — Web Application (Vite + React)

```
apps/web/
├── public/                           # Static assets served as-is (not processed by Vite)
│   ├── favicon.ico                   # Browser tab icon (16x16, 32x32, 48x48)
│   ├── favicon.svg                   # Scalable vector icon for modern browsers
│   ├── apple-touch-icon.png          # iOS home screen icon (180x180)
│   ├── manifest.json                 # PWA web app manifest (name, icons, theme, start URL)
│   ├── robots.txt                    # Search engine crawling rules
│   ├── sw.js                         # Service worker for offline support and caching
│   ├── og-image.png                  # Open Graph social sharing image (1200x630)
│   └── sounds/                       # Audio sprite files for game sounds
│       ├── ui-sprites.mp3            # UI interaction sounds (tap, success, error)
│       ├── ui-sprites.ogg            # Same in OGG format for Firefox
│       ├── game-sprites.mp3          # Game-specific sounds
│       └── game-sprites.ogg
│
├── src/                              # Application source code
│   ├── main.tsx                      # Application entry point (renders App into DOM)
│   ├── App.tsx                       # Root component (providers, router, error boundaries)
│   ├── vite-env.d.ts                 # Vite environment type declarations
│   │
│   ├── routes/                       # Route definitions (file-based convention)
│   │   ├── __root.tsx                # Root layout (wraps all routes)
│   │   ├── index.tsx                 # Root redirect to /home
│   │   ├── home.tsx                  # Home/dashboard page
│   │   │
│   │   ├── auth/                     # Authentication routes
│   │   │   ├── login.tsx             # Login page (email/password, social, magic link)
│   │   │   ├── signup.tsx            # Registration page
│   │   │   ├── callback.tsx          # OAuth callback handler (Google, Apple, GitHub)
│   │   │   ├── forgot-password.tsx   # Password reset request
│   │   │   ├── reset-password.tsx    # Password reset form (from email link)
│   │   │   └── verify-email.tsx      # Email verification handler
│   │   │
│   │   ├── games/                    # Game routes
│   │   │   ├── index.tsx             # Game library (all available games)
│   │   │   └── [gameId]/             # Dynamic game routes
│   │   │       ├── index.tsx         # Game detail page (description, stats, play button)
│   │   │       ├── play.tsx          # Game play session (renders game component)
│   │   │       ├── calibration.tsx   # Calibration session
│   │   │       ├── stats.tsx         # Game statistics and history
│   │   │       └── records.tsx       # Personal records for this game
│   │   │
│   │   ├── profile/                  # User profile routes
│   │   │   ├── index.tsx             # Profile page (overview, stats, recent activity)
│   │   │   ├── achievements.tsx      # Achievement gallery and progress
│   │   │   ├── history.tsx           # Session history with filtering
│   │   │   └── settings.tsx          # User settings page
│   │   │
│   │   ├── social/                   # Social features routes
│   │   │   ├── friends.tsx           # Friends list, requests, suggestions
│   │   │   ├── leaderboard.tsx       # Global, friends, and game leaderboards
│   │   │   └── groups.tsx            # Groups list and management
│   │   │
│   │   ├── missions.tsx              # Daily missions and weekly challenges
│   │   ├── not-found.tsx             # 404 page
│   │   └── error.tsx                 # Generic error page (for error boundaries)
│   │
│   ├── components/                   # App-specific React components
│   │   ├── Layout/                   # Layout components
│   │   │   ├── AppLayout.tsx         # Main app layout (sidebar + content area)
│   │   │   ├── AuthLayout.tsx        # Auth pages layout (centered card)
│   │   │   ├── GameLayout.tsx        # Game play layout (full screen, minimal chrome)
│   │   │   ├── Sidebar.tsx           # Desktop sidebar navigation
│   │   │   ├── BottomNav.tsx         # Mobile bottom tab bar navigation
│   │   │   ├── Header.tsx            # Top header bar (search, notifications, avatar)
│   │   │   └── MobileMenu.tsx        # Mobile hamburger menu overlay
│   │   │
│   │   ├── Home/                     # Home/dashboard widgets
│   │   │   ├── DailyMissions.tsx     # Today's mission cards
│   │   │   ├── RecentActivity.tsx    # Recent sessions and achievements feed
│   │   │   ├── QuickPlay.tsx         # Quick-play game selection grid
│   │   │   ├── StreakWidget.tsx      # Current streak display with fire animation
│   │   │   ├── LevelProgress.tsx     # XP and level progress bar
│   │   │   └── WeeklySummary.tsx     # Weekly performance summary chart
│   │   │
│   │   ├── Games/                    # Game-related components
│   │   │   ├── GameCard.tsx          # Game card for library grid
│   │   │   ├── GameBadge.tsx         # Difficulty/level/unlock badges
│   │   │   └── SessionHistory.tsx    # Past sessions list
│   │   │
│   │   ├── Social/                   # Social components
│   │   │   ├── FriendCard.tsx        # Friend list item
│   │   │   ├── LeaderboardRow.tsx    # Leaderboard entry row
│   │   │   └── GroupCard.tsx         # Group list item
│   │   │
│   │   └── Settings/                 # Settings page components
│   │       ├── SoundSettings.tsx     # Sound and haptic settings
│   │       ├── DisplaySettings.tsx   # Theme, font, accessibility settings
│   │       ├── PrivacySettings.tsx   # Privacy and data settings
│   │       ├── NotificationSettings.tsx # Notification preferences
│   │       └── AccountSettings.tsx   # Account management (email, password, delete)
│   │
│   ├── hooks/                        # App-specific React hooks
│   │   ├── useAuth.ts                # Authentication state and methods
│   │   ├── useNavigation.ts          # Navigation helpers (back, forward, current route)
│   │   └── useOnboarding.ts          # Onboarding state management
│   │
│   ├── stores/                       # Zustand state stores
│   │   ├── app-store.ts              # Global app state (sidebar, theme, modals)
│   │   └── game-store.ts             # Current game session state
│   │
│   ├── utils/                        # App-specific utility functions
│   │   ├── routing.ts                # Route helpers (redirect logic, guards)
│   │   └── formatters.ts             # UI-specific formatting helpers
│   │
│   ├── styles/                       # CSS styles
│   │   ├── globals.css               # Global styles (reset, base, Tailwind imports)
│   │   └── themes/                   # Theme overrides
│   │       ├── dark.css              # Dark theme CSS variables
│   │       ├── light.css             # Light theme CSS variables
│   │       └── high-contrast.css     # High contrast theme CSS variables
│   │
│   └── assets/                       # App-specific static assets (imported by components)
│       ├── images/                   # Images (logos, illustrations)
│       ├── icons/                    # Custom SVG icons (not from Lucide)
│       └── fonts/                    # Self-hosted font files
│
├── index.html                        # HTML entry point (Vite SPA root)
├── vite.config.ts                    # Vite configuration (plugins, aliases, proxy)
├── tsconfig.json                     # TypeScript config (extends tsconfig.base.json)
├── tailwind.config.ts                # Tailwind CSS configuration (theme extensions, plugins)
├── postcss.config.js                 # PostCSS configuration (Tailwind, autoprefixer)
├── eslint.config.js                  # ESLint config (app-specific overrides)
├── vitest.config.ts                  # Vitest configuration for unit/integration tests
├── playwright.config.ts              # (Optional) App-level Playwright config override
├── capacitor.config.ts               # Capacitor configuration (bridges web to mobile)
└── package.json                      # Dependencies, scripts (dev, build, test, preview)
```

### apps/mobile/ — Mobile Application (Capacitor)

```
apps/mobile/
├── capacitor.config.ts               # Capacitor configuration (appId, plugins, server)
├── android/                          # Android native project (generated by Capacitor)
│   ├── app/
│   │   ├── build.gradle              # App-level Gradle build (dependencies, signing, SDK)
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml  # Android manifest (permissions, activities)
│   │   │       ├── java/               # Native Java/Kotlin code (plugin bridges)
│   │   │       │   └── com/focus/app/
│   │   │       │       ├── MainActivity.java  # Main activity (extends BridgeActivity)
│   │   │       │       ├── HapticPlugin.java   # Custom haptic feedback plugin
│   │   │       │       └── NotificationPlugin.java # Push notification plugin
│   │   │       └── res/                # Android resources (icons, splash screens)
│   │   │           ├── drawable/       # App icon and splash images
│   │   │           ├── values/         # Strings, colors, styles
│   │   │           └── xml/            # Network security config, file paths
│   │   └── google-services.json       # Firebase configuration for Android (FCM)
│   ├── build.gradle                  # Project-level Gradle build
│   ├── gradle.properties             # Gradle properties (JVM args, Android settings)
│   └── settings.gradle               # Gradle module settings
│
├── ios/                              # iOS native project (generated by Capacitor)
│   ├── App/
│   │   ├── App/
│   │   │   ├── AppDelegate.swift     # iOS app delegate (lifecycle, push notifications)
│   │   │   ├── Info.plist            # iOS app configuration (permissions, URL schemes)
│   │   │   ├── capacitor.config.json # Capacitor config for iOS (generated)
│   │   │   ├── Plugins/              # Native iOS plugin implementations
│   │   │   │   ├── HapticPlugin.swift    # Custom haptic feedback plugin
│   │   │   │   └── NotificationPlugin.swift # Push notification plugin
│   │   │   └── Assets.xcassets       # App icons and splash images
│   │   │       ├── AppIcon.appiconset/   # App icon set
│   │   │       └── AccentColor.colorset/ # Accent color definition
│   │   ├── App.xcodeproj/            # Xcode project file
│   │   │   ├── project.pbxproj       # Xcode project settings
│   │   │   └── xcshareddata/         # Shared Xcode schemes
│   │   └── Podfile                   # CocoaPods dependencies (iOS native libraries)
│   └── App/
│       └── App.entitlements          # iOS entitlements (push notifications, keychain)
│
├── package.json                      # Mobile-specific dependencies and scripts
├── capacitor.plugins.json            # Capacitor plugin configuration
└── README.md                         # Mobile build and deployment instructions
```

### apps/desktop/ — Desktop Application (Tauri)

```
apps/desktop/
├── src-tauri/                        # Tauri/Rust backend source
│   ├── src/
│   │   ├── main.rs                   # Rust entry point (Tauri app builder, plugin setup)
│   │   ├── commands.rs               # Tauri commands exposed to frontend (file system, clipboard)
│   │   ├── menu.rs                   # Native menu bar definition (File, Edit, View, Help)
│   │   ├── tray.rs                   # System tray icon and menu
│   │   ├── updater.rs                # Auto-update logic (check, download, install)
│   │   ├── autostart.rs              # Launch at startup configuration
│   │   └── notifications.rs          # Native desktop notifications
│   │
│   ├── Cargo.toml                    # Rust dependencies (tauri, serde, reqwest, etc.)
│   ├── Cargo.lock                    # Rust dependency lockfile
│   ├── tauri.conf.json              # Tauri configuration (window, security, build, updater)
│   ├── capabilities/                 # Tauri security capability definitions
│   │   ├── default.json             # Default capabilities (window, event, clipboard)
│   │   └── fs.json                  # File system access capabilities
│   └── icons/                        # Application icons for all platforms
│       ├── icon.ico                  # Windows icon (256x256)
│       ├── icon.icns                 # macOS icon set
│       ├── icon.png                  # Linux icon (512x512)
│       ├── icon.svg                  # Vector source icon
│       ├── icon.ico                  # NSIS installer icon
│       ├── icons/                    # Multi-resolution icon set
│       │   ├── 32x32.png
│       │   ├── 128x128.png
│       │   ├── 128x128@2x.png
│       │   └── icon.icns
│       └── installer/                # Installer graphics
│           ├── banner.bmp            # NSIS installer banner
│           └── sidebar.bmp           # NSIS installer sidebar
│
├── src/                              # Frontend source (symlinked to web app via Vite)
│   └── (same structure as apps/web/src — shared via workspace)
│
├── package.json                      # Desktop-specific dependencies and build scripts
├── vite.config.ts                    # Vite config for Tauri (development server, build target)
└── tsconfig.json                     # TypeScript config for desktop app
```

## Packages Directory

### packages/shared/ — Shared Utilities and Types

```
packages/shared/
├── src/
│   ├── types/                        # TypeScript type definitions
│   │   ├── index.ts                  # Re-exports all types
│   │   ├── game.ts                   # Game types (Game, GameConfig, GameCategory)
│   │   ├── session.ts                # Session types (GameSession, Trial, TrialResult)
│   │   ├── score.ts                  # Score types (ScoreBreakdown, FocusScore)
│   │   ├── user.ts                   # User types (User, UserProfile, UserSettings)
│   │   ├── social.ts                 # Social types (Friend, Group, LeaderboardEntry)
│   │   ├── progression.ts            # Progression types (Level, Achievement, Streak)
│   │   ├── mission.ts                # Mission types (Mission, DailyMission, Challenge)
│   │   ├── subscription.ts           # Subscription types (Subscription, Tier)
│   │   ├── sync.ts                   # Sync types (SyncQueue, Conflict)
│   │   ├── analytics.ts              # Analytics event type definitions
│   │   ├── api.ts                    # API request/response types
│   │   └── supabase.ts              # Auto-generated Supabase database types
│   │
│   ├── utils/                        # Utility functions (pure, no side effects)
│   │   ├── formatting.ts             # Date, number, duration, score formatting
│   │   ├── validation.ts             # Zod schemas for all input validation
│   │   ├── calculation.ts            # Math utilities (percentiles, statistics, ELO)
│   │   ├── storage.ts                # Storage abstraction (IndexedDB, localStorage wrapper)
│   │   ├── logger.ts                 # Structured logging utility (console + Sentry)
│   │   ├── constants.ts              # Shared constants (MAX_TRIALS, API_URLS, etc.)
│   │   ├── retry.ts                  # Retry with exponential backoff
│   │   ├── debounce.ts               # Debounce and throttle utilities
│   │   ├── random.ts                 # Seeded random number generation (for reproducibility)
│   │   └── statistics.ts             # Statistical functions (mean, median, SD, z-score)
│   │
│   ├── hooks/                        # Shared React hooks
│   │   ├── use-online.ts             # Online status detection (navigator.onLine + events)
│   │   ├── use-media-query.ts        # Responsive breakpoint detection
│   │   ├── use-local-storage.ts      # Local storage with JSON serialization
│   │   ├── use-interval.ts           # Safe setInterval hook
│   │   ├── use-timeout.ts            # Safe setTimeout hook
│   │   ├── use-debounce.ts           # Debounced value hook
│   │   └── use-window-size.ts        # Window dimensions tracking
│   │
│   └── api/                          # Supabase API client functions
│       ├── client.ts                 # Supabase client initialization (browser + server)
│       ├── auth.ts                   # Auth API (signup, login, logout, session)
│       ├── games.ts                  # Games API (list, get, config)
│       ├── sessions.ts               # Sessions API (create, update, complete, list)
│       ├── scores.ts                 # Scores API (leaderboard, records, history)
│       ├── progression.ts            # Progression API (level, xp, achievements)
│       ├── missions.ts               # Missions API (daily, weekly, complete)
│       ├── social.ts                 # Social API (friends, groups, challenges)
│       ├── profile.ts                # Profile API (get, update, avatar)
│       ├── sync.ts                   # Sync API (push, pull, conflict resolve)
│       └── admin.ts                  # Admin API (users, analytics, health)
│
├── package.json                      # Package dependencies and build config
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Vitest configuration for unit tests
└── README.md                         # Package documentation
```

### packages/ui/ — Shared UI Component Library

```
packages/ui/
├── src/
│   ├── components/                   # Reusable UI components
│   │   ├── Button/                   # Button component (all variants)
│   │   │   ├── Button.tsx            # Component implementation
│   │   │   ├── Button.test.tsx       # Component tests
│   │   │   ├── Button.stories.tsx    # Storybook stories
│   │   │   ├── index.ts              # Public exports
│   │   │   └── types.ts              # Component type definitions
│   │   │
│   │   ├── Card/                     # Card container component
│   │   │   ├── Card.tsx
│   │   │   ├── Card.test.tsx
│   │   │   ├── Card.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Input/                    # Text input component
│   │   │   ├── Input.tsx
│   │   │   ├── Input.test.tsx
│   │   │   ├── Input.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Modal/                    # Modal dialog component (focus trap, ESC close)
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.test.tsx
│   │   │   ├── Modal.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Toast/                    # Toast notification component (stack, auto-dismiss)
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   ├── Toast.test.tsx
│   │   │   ├── Toast.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Avatar/                   # User avatar component (image, initials fallback)
│   │   │   ├── Avatar.tsx
│   │   │   ├── Avatar.test.tsx
│   │   │   ├── Avatar.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Badge/                    # Badge/label component (rarity, status, category)
│   │   │   ├── Badge.tsx
│   │   │   ├── Badge.test.tsx
│   │   │   ├── Badge.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Progress/                 # Progress bar and circular progress
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── CircularProgress.tsx
│   │   │   ├── Progress.test.tsx
│   │   │   ├── Progress.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── ScoreDisplay/             # Animated score number display
│   │   │   ├── ScoreDisplay.tsx
│   │   │   ├── ScoreBreakdown.tsx
│   │   │   ├── ScoreDisplay.test.tsx
│   │   │   ├── ScoreDisplay.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Timer/                    # Countdown/stopwatch timer display
│   │   │   ├── Timer.tsx
│   │   │   ├── Timer.test.tsx
│   │   │   ├── Timer.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Navigation/               # Navigation components
│   │   │   ├── TabBar.tsx            # Tab bar (horizontal, bottom)
│   │   │   ├── Breadcrumb.tsx        # Breadcrumb navigation
│   │   │   ├── Navigation.test.tsx
│   │   │   ├── Navigation.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Skeleton/                 # Loading skeleton components
│   │   │   ├── Skeleton.tsx
│   │   │   ├── SkeletonCard.tsx
│   │   │   ├── Skeleton.test.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Dropdown/                 # Dropdown menu component
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Dropdown.test.tsx
│   │   │   ├── Dropdown.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Tooltip/                  # Tooltip component (hover/focus triggered)
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Tooltip.test.tsx
│   │   │   ├── Tooltip.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Toggle/                   # Toggle switch component
│   │   │   ├── Toggle.tsx
│   │   │   ├── Toggle.test.tsx
│   │   │   ├── Toggle.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Slider/                   # Range slider component
│   │   │   ├── Slider.tsx
│   │   │   ├── Slider.test.tsx
│   │   │   ├── Slider.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── Tabs/                     # Tabbed interface component
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tabs.test.tsx
│   │   │   ├── Tabs.stories.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   └── ErrorBoundary/            # Error boundary component
│   │       ├── ErrorBoundary.tsx
│   │       ├── ErrorBoundary.test.tsx
│   │       ├── ErrorBoundary.stories.tsx
│   │       ├── index.ts
│   │       └── types.ts
│   │
│   ├── icons/                        # Custom FOCUS icons (SVG components)
│   │   ├── Brain.tsx                 # Brain icon (cognitive)
│   │   ├── Pulse.tsx                 # Pulse/heartbeat icon (activity)
│   │   ├── Neural.tsx                # Neural network icon (connections)
│   │   ├── Focus.tsx                 # Focus/target icon (concentration)
│   │   ├── Streak.tsx                # Flame/streak icon
│   │   ├── Trophy.tsx                # Trophy icon (achievements)
│   │   ├── Lightning.tsx             # Lightning bolt icon (speed)
│   │   ├── Shield.tsx                # Shield icon (security/protection)
│   │   ├── Chart.tsx                 # Chart/graph icon (statistics)
│   │   ├── Clock.tsx                 # Clock icon (time)
│   │   ├── Star.tsx                  # Star icon (rating/premium)
│   │   ├── Users.tsx                 # Users icon (social)
│   │   ├── Gamepad.tsx               # Gamepad icon (games)
│   │   ├── Sparkle.tsx               # Sparkle icon (new/premium)
│   │   └── index.ts                  # Re-exports all icons
│   │
│   ├── hooks/                        # UI-specific React hooks
│   │   ├── use-spring.ts             # Framer Motion spring animation hook
│   │   ├── use-haptic.ts             # Cross-platform haptic feedback hook
│   │   ├── use-sound.ts              # Sound playback hook (Web Audio API)
│   │   ├── use-reduced-motion.ts     # prefers-reduced-motion detection
│   │   ├── use-focus-trap.ts         # Focus trap for modals
│   │   ├── use-keyboard.ts           # Keyboard shortcut handler
│   │   ├── use-outside-click.ts      # Click outside detection (dropdowns, modals)
│   │   └── use-clipboard.ts          # Clipboard copy with feedback
│   │
│   ├── theme/                        # Design token definitions
│   │   ├── tokens.ts                 # All design tokens as TypeScript constants
│   │   ├── dark.ts                   # Dark theme color values
│   │   ├── light.ts                  # Light theme color values
│   │   ├── high-contrast.ts          # High contrast theme color values
│   │   ├── fonts.ts                  # Font family definitions
│   │   ├── spacing.ts                # Spacing scale definitions
│   │   ├── breakpoints.ts            # Responsive breakpoint definitions
│   │   ├── shadows.ts                # Box shadow definitions
│   │   ├── borders.ts                # Border radius definitions
│   │   ├── animations.ts             # Animation duration and easing definitions
│   │   └── index.ts                  # Re-exports all theme utilities
│   │
│   └── styles/                       # Global CSS
│       ├── globals.css               # CSS reset, base styles, Tailwind directives
│       ├── animations.css            # Keyframe animations (shimmer, pulse, breathe)
│       └── utilities.css             # Custom Tailwind utility classes
│
├── package.json                      # Package dependencies (framer-motion, lucide-react, etc.)
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind config (extends with FOCUS design tokens)
├── vitest.config.ts                  # Vitest configuration
└── README.md                         # Component library documentation
```

### packages/game-engine/ — Core Game Engine

```
packages/game-engine/
├── src/
│   ├── core/                         # Core engine components
│   │   ├── GameRegistry.ts           # Central registry for game registration and lookup
│   │   ├── GameLifecycle.ts          # Game state machine (IDLE→LOADING→READY→PLAYING→COMPLETED)
│   │   ├── SessionManager.ts         # Session creation, update, completion, persistence
│   │   ├── TrialManager.ts           # Trial sequencing, state transitions, event collection
│   │   ├── PluginManager.ts          # Plugin discovery, registration, lifecycle
│   │   └── InputManager.ts           # Unified input handling (touch, mouse, keyboard, gamepad)
│   │
│   ├── timing/                       # High-precision timing system
│   │   ├── TimingEngine.ts           # Core timing (performance.now, drift compensation)
│   │   ├── TimingWorker.ts           # Web Worker for timing-critical measurements
│   │   ├── DriftCompensation.ts      # Clock drift detection and correction
│   │   ├── FrameSync.ts              # requestAnimationFrame synchronization
│   │   └── InputLatencyCompensator.ts # Input device latency compensation
│   │
│   ├── scoring/                      # Scoring system
│   │   ├── ScoreEngine.ts            # Core score calculation orchestrator
│   │   ├── Formulas.ts               # All scoring formulas (RT, consistency, accuracy, etc.)
│   │   ├── Normalization.ts          # Population normalization and percentile ranking
│   │   ├── BonusCalculator.ts        # Streak, consistency, speed bonus calculations
│   │   └── PenaltyCalculator.ts      # False start, lapse, miss penalty calculations
│   │
│   ├── calibration/                  # Skill calibration system
│   │   ├── CalibrationEngine.ts      # Calibration orchestrator (start, evaluate, complete)
│   │   ├── CalibrationProtocols/     # Calibration protocol implementations
│   │   │   ├── Standard.ts           # Standard calibration (10-20 trials)
│   │   │   ├── Quick.ts              # Quick calibration (5-10 trials)
│   │   │   └── Recalibration.ts      # Recalibration after inactivity
│   │   └── SkillEstimator.ts         # Skill level estimation from calibration data
│   │
│   ├── adaptation/                   # Difficulty adaptation system
│   │   ├── AdaptationEngine.ts       # Core adaptation logic
│   │   ├── EloRating.ts              # ELO-like skill rating system
│   │   ├── PerformanceAnalyzer.ts    # Recent performance trend analysis
│   │   ├── FatigueDetector.ts        # Fatigue detection algorithms
│   │   └── TimeOfDayAdjuster.ts      # Circadian rhythm-based adjustment
│   │
│   ├── anticheat/                    # Anti-cheat system
│   │   ├── AntiCheatEngine.ts        # Anti-cheat orchestrator
│   │   ├── StatisticalValidator.ts   # Statistical outlier detection (z-score > 3)
│   │   ├── PatternDetector.ts        # Repeated value pattern detection
│   │   ├── TimingValidator.ts        # Impossible timing detection (< 50ms)
│   │   └── DeviceValidator.ts        # Device capability validation
│   │
│   ├── events/                       # Event system
│   │   ├── EventBus.ts               # Typed event bus (pub/sub)
│   │   ├── EventCollector.ts         # Event collection and batching
│   │   ├── EventSerializer.ts        # Event serialization for sync
│   │   └── types.ts                  # Event type definitions
│   │
│   ├── hooks/                        # Game engine React hooks
│   │   ├── use-game-session.ts       # Game session lifecycle hook
│   │   ├── use-trial.ts              # Trial state and transitions hook
│   │   ├── use-score.ts              # Score calculation and display hook
│   │   ├── use-timer.ts              # Game timer hook
│   │   ├── use-input-method.ts       # Input method detection hook
│   │   ├── use-anticheat.ts          # Anti-cheat monitoring hook
│   │   └── use-calibration.ts        # Calibration flow hook
│   │
│   └── types/                        # Engine type definitions
│       ├── Game.ts                   # Game interface definition
│       ├── Session.ts                # Session type definitions
│       ├── Trial.ts                  # Trial type definitions
│       ├── Score.ts                  # Score type definitions
│       ├── Event.ts                  # Event type definitions
│       ├── Calibration.ts            # Calibration type definitions
│       ├── Adaptation.ts             # Adaptation type definitions
│       └── Input.ts                  # Input type definitions
│
├── package.json                      # Package dependencies
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Vitest configuration
└── README.md                         # Engine documentation
```

### packages/games/ — Individual Game Implementations

```
packages/games/
├── reaction-light/                   # Game 01: Reaction Light Test
│   ├── src/
│   │   ├── index.ts                  # Game registration and exports
│   │   ├── config.ts                 # Game configuration (timing, scoring, adaptation params)
│   │   ├── ReactionLight.tsx         # Main game component (renders game UI)
│   │   ├── Stimulus.tsx              # Stimulus component (glowing orb animation)
│   │   ├── ResponseZone.tsx          # Response area (touch/click/keyboard handler)
│   │   ├── ResultScreen.tsx          # Session results display (score breakdown)
│   │   ├── CalibrationScreen.tsx     # Calibration UI
│   │   ├── scoring.ts                # Game-specific scoring formulas
│   │   ├── calibration.ts            # Calibration protocol implementation
│   │   ├── adaptation.ts             # Difficulty adaptation logic
│   │   ├── timing.ts                 # ISI generation (exponential distribution)
│   │   ├── fatigue.ts                # Fatigue detection logic
│   │   ├── sounds.ts                 # Sound definitions for this game
│   │   ├── hooks/
│   │   │   ├── use-game-state.ts     # Game state management hook
│   │   │   ├── use-timing.ts         # ISI timing hook
│   │   │   ├── use-response.ts       # Response recording hook
│   │   │   └── use-feedback.ts       # Visual/audio/haptic feedback hook
│   │   ├── components/
│   │   │   ├── ScoreAnimation.tsx    # Score reveal animation
│   │   │   ├── StreakIndicator.tsx   # Streak counter display
│   │   │   └── FatigueWarning.tsx    # Fatigue indicator
│   │   └── types.ts                  # Game-specific type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── go-no-go/                         # Game 02: Go/No-Go Test (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── GoNoGo.tsx                # Main game component
│   │   ├── Stimulus.tsx              # Colored circle stimulus
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── memory-matrix/                    # Game 03: Memory Matrix (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── MemoryMatrix.tsx          # Main game component
│   │   ├── Grid.tsx                  # Interactive grid component
│   │   ├── SequencePlayer.tsx        # Sequence playback animation
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── visual-search/                     # Game 04: Visual Search (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── VisualSearch.tsx          # Main game component
│   │   ├── SearchField.tsx           # Target and distractor grid
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── target-tracking/                   # Game 05: Target Tracking (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── TargetTracking.tsx        # Main game component
│   │   ├── MovingObject.tsx          # Animated tracking object
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── dual-task/                         # Game 06: Dual Task (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── DualTask.tsx              # Main game component
│   │   ├── VisualTask.tsx            # Visual subtask
│   │   ├── AuditoryTask.tsx          # Auditory subtask
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── peripheral-awareness/              # Game 07: Peripheral Awareness (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── PeripheralAwareness.tsx   # Main game component
│   │   ├── PeripheralField.tsx       # Peripheral stimulus display
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── attention-switching/               # Game 08: Attention Switching (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── AttentionSwitching.tsx    # Main game component
│   │   ├── TaskA.tsx                 # First task component
│   │   ├── TaskB.tsx                 # Second task component
│   │   ├── CueIndicator.tsx          # Task cue display
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── working-memory/                    # Game 09: N-Back Working Memory (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── WorkingMemory.tsx         # Main game component
│   │   ├── StimulusDisplay.tsx       # Sequential stimulus display
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── pattern-recall/                    # Game 10: Pattern Recall (future)
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── PatternRecall.tsx         # Main game component
│   │   ├── PatternGrid.tsx           # Interactive grid for pattern display/input
│   │   ├── scoring.ts
│   │   ├── calibration.ts
│   │   ├── adaptation.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
└── executive-function/                # Game 11: Executive Function Tests (future)
    ├── src/
    │   ├── index.ts
    │   ├── config.ts
    │   ├── ExecutiveFunction.tsx     # Main game component (subtest selector)
    │   ├── StroopTask.tsx            # Stroop subtest
    │   ├── FlankerTask.tsx           # Flanker subtest
    │   ├── WCSTask.tsx               # Wisconsin Card Sorting subtest
    │   ├── scoring.ts
    │   ├── calibration.ts
    │   ├── adaptation.ts
    │   └── types.ts
    ├── package.json
    └── tsconfig.json
```

### packages/analytics/ — Analytics Package

```
packages/analytics/
├── src/
│   ├── provider.tsx                  # Analytics React provider (wraps app)
│   ├── events.ts                     # Event name constants and type definitions
│   ├── posthog.ts                    # PostHog integration (event capture, identify)
│   ├── sentry.ts                     # Sentry integration (error tracking, performance)
│   ├── feature-flags.ts              # Feature flag system (PostHog flags + offline cache)
│   ├── performance.ts                # Performance monitoring (Web Vitals, custom metrics)
│   ├── session-recording.ts          # Session recording (opt-in only, privacy-safe)
│   ├── hooks/
│   │   ├── use-analytics.ts          # Analytics hook (track, identify, page)
│   │   └── use-feature-flag.ts       # Feature flag hook
│   └── types.ts                      # Analytics type definitions
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### packages/sync/ — Offline Synchronization Package

```
packages/sync/
├── src/
│   ├── SyncEngine.ts                 # Core sync orchestrator (pull, push, resolve)
│   ├── ConflictResolver.ts           # Conflict resolution strategies
│   ├── LocalDatabase.ts              # IndexedDB wrapper (Dexie.js based)
│   ├── SyncQueue.ts                  # Priority queue for pending sync operations
│   ├── OfflineDetector.ts            # Network status monitoring
│   ├── BandwidthAware.ts             # Connection quality detection and adaptation
│   ├── SyncScheduler.ts             # Automatic sync scheduling (periodic, on-reconnect)
│   ├── migrations/                   # Local database migrations
│   │   ├── v1.ts                     # Initial schema (tables, indexes)
│   │   ├── v2.ts                     # Add analytics_events table
│   │   └── v3.ts                     # Add conflict tracking table
│   ├── hooks/
│   │   ├── use-sync.ts              # Sync status hook (online, syncing, conflicts)
│   │   └── use-offline-queue.ts     # Offline queue status hook
│   └── types.ts                      # Sync type definitions
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Documentation Directory

```
focus-bible/                          # FOCUS Platform Engineering Bible
├── README.md                         # Bible overview and table of contents
├── chapters/                         # Chapter files
│   ├── chapter-01-executive-summary.md
│   ├── chapter-02-platform-architecture.md
│   ├── chapter-03-technology-stack.md
│   ├── chapter-04-database-schema.md
│   ├── chapter-05-authentication-security.md
│   ├── chapter-06-game-engine.md
│   ├── chapter-07-reaction-light-test.md
│   ├── chapter-08-progression-rewards.md
│   ├── chapter-09-social-leaderboards.md
│   ├── chapter-10-ui-design-system.md
│   ├── chapter-11-motion-animation.md
│   ├── chapter-12-sound-haptic.md
│   ├── chapter-13-offline-sync-caching.md
│   ├── chapter-14-analytics-telemetry.md
│   ├── chapter-15-privacy-compliance.md
│   ├── chapter-16-testing-strategy.md
│   ├── chapter-17-cicd-deployment.md
│   ├── chapter-18-performance-budgets.md
│   ├── chapter-19-coding-standards.md
│   ├── chapter-20-architecture-decision-records.md
│   ├── chapter-21-localization.md
│   ├── chapter-22-accessibility.md
│   ├── chapter-23-future-games.md
│   ├── chapter-24-folder-structure.md
│   ├── chapter-25-api-reference.md
│   ├── chapter-26-error-handling.md
│   ├── chapter-27-versioning-strategy.md
│   └── chapter-28-app-store-compliance.md
├── adr/                              # Architecture Decision Records
│   ├── ADR-001-supabase-backend.md
│   ├── ADR-002-capacitor-mobile.md
│   ├── ADR-003-tauri-desktop.md
│   ├── ADR-004-dark-mode-default.md
│   ├── ADR-005-zustand-state.md
│   ├── ADR-006-react-query.md
│   ├── ADR-007-exponential-distribution.md
│   ├── ADR-008-offline-first.md
│   ├── ADR-009-monorepo-turborepo.md
│   └── ADR-010-freemium-model.md
├── schema/                           # Database schema documentation
│   ├── tables.md                     # Complete table reference
│   ├── functions.md                  # Database function reference
│   ├── rls-policies.md              # RLS policy documentation
│   └── migrations.md                 # Migration history
└── api/                              # API documentation
    ├── endpoints.md                  # REST API endpoint reference
    ├── realtime.md                   # Realtime subscription documentation
    └── edge-functions.md            # Edge function documentation
```

## Testing Directory

```
e2e/                                  # End-to-end tests
├── tests/                            # Test files
│   ├── auth/
│   │   ├── login.spec.ts            # Login flow tests
│   │   ├── signup.spec.ts           # Registration flow tests
│   │   ├── oauth.spec.ts            # OAuth flow tests
│   │   └── password-reset.spec.ts   # Password reset tests
│   ├── games/
│   │   ├── game-library.spec.ts     # Game library browsing
│   │   ├── reaction-light.spec.ts   # Reaction Light Test gameplay
│   │   └── session-complete.spec.ts # Session completion flow
│   ├── social/
│   │   ├── friends.spec.ts          # Friend system tests
│   │   ├── leaderboard.spec.ts      # Leaderboard tests
│   │   └── groups.spec.ts           # Group tests
│   ├── profile/
│   │   ├── profile-view.spec.ts     # Profile page tests
│   │   └── settings.spec.ts         # Settings page tests
│   ├── accessibility/
│   │   ├── keyboard-nav.spec.ts     # Keyboard navigation tests
│   │   └── screen-reader.spec.ts    # Screen reader tests
│   ├── offline/
│   │   ├── offline-play.spec.ts     # Offline gameplay tests
│   │   └── sync-recovery.spec.ts    # Sync recovery tests
│   └── visual/
│       ├── screenshots.spec.ts      # Visual regression screenshots
│       └── responsive.spec.ts       # Responsive layout screenshots
│
├── fixtures/                         # Test fixtures and mock data
│   ├── users.json                    # Test user accounts
│   ├── sessions.json                 # Test session data
│   ├── games.json                    # Test game configurations
│   └── mock-api.ts                   # Mock API handlers
│
├── utils/                            # Test utility functions
│   ├── test-helpers.ts               # Common test setup functions
│   └── auth-helpers.ts               # Authentication test helpers
│
├── playwright.config.ts              # Playwright configuration
├── package.json                      # Test dependencies
└── README.md                         # E2E test documentation
```

## Scripts Directory

```
scripts/                              # Build and utility scripts
├── build/                            # Build scripts
│   ├── build-web.sh                  # Build web application
│   ├── build-mobile.sh               # Build mobile applications
│   ├── build-desktop.sh              # Build desktop applications
│   └── build-all.sh                  # Build all platforms
│
├── deploy/                           # Deployment scripts
│   ├── deploy-staging.sh             # Deploy to staging environment
│   ├── deploy-production.sh          # Deploy to production
│   ├── deploy-mobile.sh              # Submit to App Store / Play Store
│   └── deploy-desktop.sh             # Upload desktop builds to update server
│
├── release/                          # Release management
│   ├── create-release.sh             # Create a new release (version bump, changelog, tag)
│   ├── generate-changelog.sh         # Generate changelog from conventional commits
│   └── notify-release.sh             # Notify team of new release
│
├── database/                         # Database management
│   ├── generate-types.sh             # Generate Supabase TypeScript types
│   ├── seed-dev.sh                   # Seed development database with test data
│   ├── reset-staging.sh              # Reset staging database
│   └── backup.sh                     # Create database backup
│
├── development/                      # Developer tools
│   ├── setup.sh                      # Initial project setup (install, configure)
│   ├── clean.sh                      # Clean build artifacts and node_modules
│   └── lint-all.sh                   # Run linting across all packages
│
└── analytics/                        # Analytics scripts
    ├── generate-report.sh            # Generate analytics report
    └── export-data.sh                # Export analytics data
```

## Supabase Directory

```
supabase/                             # Supabase project configuration
├── config.toml                       # Supabase CLI configuration
├── seed.sql                          # Seed data for development (games, achievements, etc.)
│
├── migrations/                       # Database migrations (versioned, ordered)
│   ├── 20260101000000_initial_schema.sql        # All base tables, enums, indexes
│   ├── 20260101000001_rls_policies.sql          # All Row Level Security policies
│   ├── 20260101000002_database_functions.sql     # All stored procedures
│   ├── 20260101000003_triggers.sql               # All trigger functions
│   ├── 20260101000004_materialized_views.sql     # Leaderboard materialized views
│   ├── 20260115120000_add_achievements.sql       # Achievement definitions
│   ├── 20260115120001_add_mission_templates.sql  # Mission and challenge templates
│   ├── 20260201000000_add_seasonal_tables.sql    # Season and leaderboard tables
│   ├── 20260215000000_add_groups.sql             # Groups and group members
│   ├── 20260301000000_add_analytics.sql          # Analytics event tables
│   └── README.md                                 # Migration documentation
│
├── functions/                        # Supabase Edge Functions (Deno)
│   ├── calculate-score/              # Server-side score calculation
│   │   └── index.ts
│   ├── generate-missions/            # Daily mission generation
│   │   └── index.ts
│   ├── sync-data/                    # Bidirectional data synchronization
│   │   └── index.ts
│   ├── validate-session/             # Session validation and anti-cheat
│   │   └── index.ts
│   ├── update-leaderboard/           # Leaderboard recalculation
│   │   └── index.ts
│   ├── process-payment/              # Payment processing webhooks
│   │   └── index.ts
│   ├── send-notification/            # Push notification dispatch
│   │   └── index.ts
│   ├── analytics-ingest/             # Analytics event ingestion
│   │   └── index.ts
│   └── _shared/                      # Shared Edge Function utilities
│       ├── supabase-admin.ts         # Service role Supabase client
│       ├── cors.ts                   # CORS headers helper
│       └── validation.ts             # Input validation helpers
│
└── types.ts                          # Auto-generated Supabase database types
```
