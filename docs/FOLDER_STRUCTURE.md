# Folder Structure — FOCUS v2.0

*Frozen after Phase -0.5. Changes require ADR-008+.*

```
focus-v2/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── scientific_accuracy.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── ADR/
│   │   ├── ADR-001-engine-isolation.md
│   │   ├── ADR-002-calibration-first.md
│   │   ├── ADR-003-local-first-storage.md
│   │   ├── ADR-004-scientific-separation.md
│   │   ├── ADR-005-design-system-foundation.md
│   │   ├── ADR-006-game-engine-architecture.md
│   │   └── ADR-007-engineering-recovery.md
│   ├── CONSTITUTION.md
│   ├── COGNITIVE_BIBLE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── TERMINOLOGY.md
│   ├── NAMING_CONVENTION.md
│   ├── CODING_STANDARDS.md
│   ├── DOD.md
│   ├── RELEASE_POLICY.md
│   ├── ERR-001.md
│   └── RR-002.md
├── focus-app/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   ├── .prettierrc
│   ├── commitlint.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── vite-env.d.ts
│       ├── components/
│       │   └── shared/
│       │       ├── ErrorBoundary.tsx
│       │       ├── Button.tsx
│       │       ├── Card.tsx
│       │       └── ProgressRing.tsx
│       ├── hooks/
│       │   ├── useSettings.ts
│       │   └── useThemeSync.ts
│       ├── store/
│       │   └── navigation.tsx
│       ├── screens/
│       │   ├── home/HomeScreen.tsx
│       │   ├── library/LibraryScreen.tsx
│       │   ├── intro/IntroScreen.tsx
│       │   ├── calibration/CalibrationScreen.tsx
│       │   ├── countdown/CountdownScreen.tsx
│       │   ├── game/GameScreen.tsx
│       │   ├── results/ResultsScreen.tsx
│       │   ├── history/HistoryScreen.tsx
│       │   ├── settings/SettingsScreen.tsx
│       │   └── about/AboutScreen.tsx
│       ├── core/
│       │   ├── calibration/
│       │   │   └── index.ts
│       │   ├── measurement/
│       │   │   └── index.ts
│       │   ├── engine/
│       │   │   ├── reaction.ts
│       │   │   ├── consistency.ts
│       │   │   ├── fatigue.ts
│       │   │   └── scoring.ts
│       │   ├── scientific/
│       │   │   └── constants.ts
│       │   ├── storage/
│       │   │   └── repository/
│       │   │       └── index.ts
│       │   ├── config/
│       │   │   └── settings.ts
│       │   └── index.ts
│       ├── design-system/
│       │   └── use-theme.ts
│       └── __tests__/
│           └── infrastructure.test.ts
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── .gitignore
├── CONTRIBUTING.md
├── CODEOWNERS
├── PROJECT_STATE.md
├── ENGINEERING_BACKLOG.md
├── CHANGELOG.md
├── ALPHA_TESTING.md
├── PERFORMANCE.md
└── README.md
```

## Directory Responsibilities

| Directory | Owner | Purpose |
|---|---|---|
| `src/core/` | Scientific Team | All measurement and engine logic |
| `src/core/scientific/` | Scientific Team | Centralized constants ONLY |
| `src/screens/` | UI Team | Screen components |
| `src/components/` | UI Team | Shared reusable components |
| `src/hooks/` | Core Team | React hooks |
| `src/store/` | Core Team | Navigation state management |
| `src/design-system/` | Design Team | Theme, typography, colors |
| `docs/` | All | Architecture documentation |
| `.github/` | DevOps | CI/CD, templates |
