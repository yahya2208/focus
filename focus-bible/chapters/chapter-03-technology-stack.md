# Chapter 03: Technology Stack & Infrastructure

## Overview

The FOCUS platform is a cognitive training and gaming application built on the Supabase stack with a React frontend, deployed via Vercel and Cloudflare. Every technology in this stack was selected through a rigorous evaluation process that prioritized: (1) performance and bundle size, (2) developer experience and team velocity, (3) long-term maintainability, (4) cost efficiency at scale, and (5) alignment with Supabase as the backend. This chapter documents every decision, the alternatives considered, and the rationale behind each choice.

---

## 1. Frontend Core Framework

### 1.1 React 18+ with Concurrent Features

**Version Target:** React 18.3+ (latest stable)

**Why React over Vue, Svelte, Angular, or Solid:**

React was selected primarily because of its concurrent rendering model, which is unmatched in any other framework. React 18 introduced `startTransition`, `useDeferredValue`, and Suspense-based data fetching, which allow the UI to remain responsive during heavy renders. For FOCUS, where users interact with animated game boards, real-time timers, and live leaderboards simultaneously, concurrent features prevent frame drops during state transitions.

Vue 3's Composition API is elegant and its reactivity system is arguably more ergonomic than React hooks. However, Vue's ecosystem for complex state management (Pinia vs Vuex) is less mature for the patterns FOCUS requires: optimistic updates across multiple related stores, computed derivations that depend on real-time subscriptions, and undo/redo stacks for user settings. Vue also lacks a direct equivalent to React's concurrent mode; its reactivity batching is good but not as granular.

Svelte 5's runes are impressive and SvelteKit is a fantastic meta-framework. However, Svelte's compiler-first approach means that third-party library support is thinner. FOCUS depends on libraries like Recharts, React Hook Form, Framer Motion, and React Query, all of which have first-class React bindings but limited or no Svelte equivalents with the same feature parity. The migration risk of adopting Svelte for a project this size is also higher since fewer engineers have production Svelte experience.

Angular is a complete framework with excellent tooling, but its opinionated architecture (decorators, dependency injection, zone.js) adds conceptual overhead that slows prototyping. FOCUS is a product that needs to iterate quickly; Angular's ceremony is better suited to large enterprise applications with strict architectural governance.

Solid.js offers fine-grained reactivity that is faster than React in microbenchmarks, but its ecosystem is nascent. The lack of mature libraries for forms, charts, and animation means FOCUS would need to build or fork many dependencies.

**Bundle Size:** React 18 core is approximately 42 KB gzipped. With ReactDOM, the total is approximately 44 KB gzipped. Concurrent features add negligible overhead since they are opt-in via `createRoot`.

**Performance:** React 18's automatic batching means that multiple state updates in event handlers, promises, and timeouts are automatically batched into a single render. This is critical for FOCUS where a single user action (e.g., completing a game) triggers XP updates, streak updates, achievement checks, leaderboard recalculations, and notification dispatch—all of which should render once, not six times.

**Team Productivity:** React has the largest ecosystem of any UI library. Every FOCUS engineer can find answers to edge cases on Stack Overflow, in React documentation, or in the extensive blog posts from the React team. Hiring is also easier; React engineers are the most abundant frontend talent pool.

### 1.2 TypeScript 5+ Strict Mode

**Version Target:** TypeScript 5.4+ with `"strict": true`

**Why TypeScript over JavaScript:**

TypeScript is non-negotiable for FOCUS. The application has 50+ database tables, complex game state machines, real-time subscriptions, and financial transactions (subscriptions via RevenueCat). Writing this in untyped JavaScript would be irresponsible.

Specific compiler flags enforced:
- `strict: true` — enables all strict type-checking options
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`
- `noImplicitOverride` — forces explicit `override` keyword
- `exactOptionalPropertyTypes` — distinguishes between `undefined` and missing properties
- `noPropertyAccessFromIndexSignature` — forces bracket notation for dynamic keys

**Why TypeScript over Flow:** Flow is effectively abandoned by Meta. TypeScript has superior tooling (VS Code integration, error messages), a larger community, and constant improvements. There is no scenario where Flow is the better choice in 2026.

**Bundle Size:** TypeScript compiles away entirely. Zero bytes added to production bundles.

**Team Productivity:** TypeScript catches entire categories of bugs at compile time: null reference errors, incorrect prop types, mismatched function signatures, and incorrect enum usage. Studies consistently show that TypeScript reduces runtime bugs by 15-30%. For a team of 3-8 engineers, this is the difference between shipping features and firefighting regressions.

### 1.3 Vite 5+ as Build Tool

**Version Target:** Vite 5.4+

**Why Vite over Webpack, Parcel, Turbopack, or esbuild:**

Webpack is the incumbent but is fundamentally architecturally flawed for modern development. Webpack bundles everything before serving, meaning a cold start on a large project can take 30-60 seconds. Vite uses native ES modules in development, serving files on demand. Cold starts are typically under 500ms regardless of project size.

Webpack 5's Module Federation is powerful for micro-frontends, but FOCUS is a single application. The complexity of configuring Webpack loaders, plugins, and optimizers (Terser, CssMinimizer, BundleAnalyzer) far exceeds Vite's zero-config defaults.

Parcel is zero-config but slower than Vite in both development and production builds. Its caching mechanism is also less reliable.

Turbopack (from Vercel) is promising but still in development as of 2026 and not yet stable enough for production use. It also tightly couples to the Next.js ecosystem, and FOCUS does not use Next.js (Vite + React Router is preferred for the SPA architecture).

esbuild is fast but is a bundler, not a dev server. Vite uses esbuild under the hood for dev transforms and Rollup for production builds, getting the best of both worlds.

**Production Build:** Vite uses Rollup for production builds with tree-shaking, code splitting, and asset optimization. The output is highly optimized: gzipped JavaScript bundles typically total 150-200 KB for the core application, with route-based code splitting keeping initial loads under 80 KB.

**Development Experience:** Hot Module Replacement (HMR) in Vite is near-instantaneous (<50ms) because it uses native ESM and only replaces the changed module, not the entire bundle. This means engineers see changes in under a second regardless of where they edit in the codebase.

**Bundle Size:** Vite's dev server adds 0 bytes to production. The Rollup output is smaller than Webpack output for equivalent configurations due to superior tree-shaking.

### 1.4 Tailwind CSS 3+ (Utility-First CSS)

**Version Target:** Tailwind CSS 3.4+

**Why Tailwind over CSS-in-JS (styled-components, Emotion), CSS Modules, or Sass:**

CSS-in-JS libraries (styled-components, Emotion, Stitches) add runtime overhead. They parse template literals, generate class names dynamically, and inject styles at runtime. For a performance-sensitive application like FOCUS, where users are interacting with animations and timers, this runtime cost is unacceptable. styled-components alone adds approximately 12 KB gzipped to the bundle, plus the runtime cost of StyleSheetManager.

Tailwind CSS compiles to static CSS at build time. There is zero runtime overhead. The output CSS is purged of unused utilities, resulting in final CSS files that are typically 10-15 KB gzipped for an entire application.

CSS Modules are a reasonable alternative but require writing separate `.module.css` files, which fragments the codebase. With Tailwind, all styling lives in the JSX, making components self-contained and easier to reason about.

Sass/SCSS is powerful but verbose. Writing custom CSS for every component is slow and leads to inconsistent design systems. Tailwind's utility classes enforce design constraints (spacing scale, color palette, typography) that keep the UI consistent without a separate design system library.

**Design System Integration:** Tailwind's configuration file (`tailwind.config.js`) defines the FOCUS design system: custom colors (brand palette, semantic colors for success/warning/error), spacing scale (based on 4px grid), typography scale (using Inter font family), border radius tokens, and animation timings. This configuration is the single source of truth for all visual design decisions.

**Performance:** Tailwind's JIT (Just-In-Time) compiler generates only the CSS classes actually used in the codebase. A typical FOCUS page uses 200-400 utility classes, which compile to approximately 8-12 KB of CSS. The entire application's CSS, including component-specific styles, rarely exceeds 20 KB gzipped.

**Team Productivity:** Tailwind's utility classes are self-documenting. A new engineer can read `className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-md"` and immediately understand the layout, spacing, background, and elevation without cross-referencing a CSS file. This dramatically reduces onboarding time.

### 1.5 Framer Motion

**Version Target:** Framer Motion 11+

**Why Framer Motion over React Spring, React Transition Group, or CSS Animations:**

Framer Motion provides declarative animation APIs that integrate seamlessly with React's component model. Its `motion.div` component accepts `animate`, `initial`, `exit`, `transition`, and `variants` props that make complex animations composable and maintainable.

CSS animations are performant (GPU-accelerated) but cannot be driven by React state without JavaScript bridges. For FOCUS, where animations must respond to game state (a card flipping when selected, XP numbers counting up, achievement badges popping in), CSS animations alone are insufficient.

React Spring is a solid alternative but has a steeper learning curve due to its physics-based animation model. Framer Motion's spring animations are simpler to configure and its layout animations (animating between layout positions) are unmatched. The `layoutId` prop allows elements to animate between different components, which is essential for FOCUS's shared element transitions between game views.

**Bundle Size:** Framer Motion is approximately 32 KB gzipped. This is significant but justified by the richness of animations required for a gaming application. The alternative—writing custom animation utilities—would be more code and less maintainable.

**Performance:** Framer Motion uses the `transform` and `opacity` properties by default, which are GPU-accelerated and do not trigger layout recalculations. Its `useMotionValue` and `useTransform` hooks allow animations to run outside of React's render cycle, preventing unnecessary re-renders during continuous animations.

### 1.6 Zustand (State Management)

**Version Target:** Zustand 4.5+

**Why Zustand over Redux Toolkit, MobX, Jotai, or Recoil:**

Zustand provides a minimal API (under 1 KB gzipped) that covers all of FOCUS's state management needs without the ceremony of Redux. A Zustand store is a simple function that returns state and actions:

```typescript
const useGameStore = create<GameStore>((set, get) => ({
  currentGame: null,
  score: 0,
  timeRemaining: 0,
  startGame: (gameId: string) => set({ currentGame: gameId, score: 0 }),
  incrementScore: (points: number) => set((state) => ({ score: state.score + points })),
}))
```

Redux Toolkit requires: a slice file, action creators, selectors, middleware configuration, provider wrapping, and the `useDispatch`/`useSelector` hook pattern. This is approximately 3-4x more code for equivalent functionality.

MobX uses proxies and decorators, which have worse TypeScript support and are harder to debug (the reactivity graph is implicit). Zustand's state is a plain JavaScript object; debugging is trivial because you can log the state directly.

Jotai is excellent for atomic state but struggles with complex derived state that depends on multiple atoms. FOCUS has game state that involves interdependent values (score, multiplier, streak bonus, time remaining) that are easier to model as a single store slice than as individual atoms.

Recoil is effectively abandoned by Meta.

**Bundle Size:** Zustand is approximately 1.2 KB gzipped. Redux Toolkit is approximately 11 KB gzipped. MobX is approximately 16 KB gzipped. Jotai is approximately 3 KB gzipped.

**Performance:** Zustand uses a subscription model with shallow equality checks by default. Components only re-render when their selected state actually changes. This is comparable to Redux's `useSelector` with `shallowEqual` but requires no configuration.

**Team Productivity:** Zustand's API surface is tiny. An engineer can learn the entire library in 30 minutes. There are no middleware patterns to memorize, no action/reducer mental model to internalize, and no provider components to set up.

### 1.7 React Query v5 (TanStack Query)

**Version Target:** TanStack Query 5.x

**Why React Query over SWR, Apollo Client, or manual fetch:**

React Query is the definitive server state management library. FOCUS uses Supabase as its backend, which means every data fetch is a PostgreSQL query via Supabase's REST API. React Query manages caching, background refetching, optimistic updates, and pagination for all of these queries.

SWR (from Vercel) is a simpler alternative but lacks React Query's mutation API, which is critical for FOCUS's optimistic updates. When a user completes a game, FOCUS immediately updates the local score, streak, and XP while the server-side mutation runs in the background. React Query's `onMutate`, `onError`, and `onSettled` callbacks make rollback logic straightforward.

Apollo Client is designed for GraphQL and adds significant bundle size (~33 KB gzipped) for features (cache normalization, fragment matching) that are unnecessary with Supabase's REST API.

Manual `fetch` calls would require reimplementing caching, deduplication, refetching, and error handling—work that React Query handles out of the box.

**Bundle Size:** React Query is approximately 13 KB gzipped. The value-to-size ratio is excellent given that it replaces approximately 500+ lines of custom data fetching logic.

### 1.8 React Router v6+

**Version Target:** React Router 6.20+

**Why React Router over TanStack Router, Wouter, or Next.js file-based routing:**

React Router is the de facto standard for React SPA routing. Its nested route layout system, data loaders, and action pattern (introduced in v6.4) provide all the routing features FOCUS needs.

TanStack Router is a newer alternative with type-safe routes and built-in search param validation. It is excellent but has a smaller community and less battle-tested at scale. FOCUS may consider migrating to TanStack Router in the future as it matures.

Wouter is minimal but lacks nested layouts, which FOCUS uses extensively (dashboard layout, game layout, settings layout).

Next.js provides file-based routing but couples routing to server-side rendering, API routes, and the Vercel deployment model. FOCUS is a client-side application deployed on Vercel as a static SPA; Next.js's SSR features are unnecessary overhead.

**Bundle Size:** React Router is approximately 8 KB gzipped. This is acceptable for the routing features provided.

### 1.9 i18next

**Version Target:** i18next 23+ with react-i18next

**Why i18next over FormatJS (react-intl), Lingui, or Paraglide:**

i18next is the most mature and feature-rich internationalization library for React. It supports nested translation keys, pluralization, interpolation, namespaces, lazy loading of translation bundles, and language detection.

FOCUS will launch in English initially but is architecturally designed to support 10+ languages within 12 months. i18next's namespace system allows splitting translations by feature (game translations, UI translations, error translations), which keeps translation files manageable as the vocabulary grows.

FormatJS is solid but uses ICU message syntax, which is less intuitive than i18next's key-based system. Lingui uses a compile-time approach that is faster but requires more build tooling. Paraglide (from Inlang) is newer and uses a compiler to eliminate unused translations, but its ecosystem is less mature.

**Bundle Size:** i18next core is approximately 7 KB gzipped. react-i18next adds approximately 3 KB. Total: approximately 10 KB gzipped.

### 1.10 React Hook Form + Zod

**Version Target:** React Hook Form 7.50+ with Zod 3.22+

**Why React Hook Form over Formik, or native form handling:**

React Hook Form uses uncontrolled components and refs to minimize re-renders. Each keystroke in a form field does not trigger a React render, which is critical for performance in forms with many fields (e.g., user profile settings with 15+ fields).

Formik uses controlled components, meaning every keystroke triggers a state update and re-render. For simple forms this is negligible, but for complex forms it causes noticeable input lag.

Zod is used as the validation schema layer. React Hook Form's resolver integration with Zod allows sharing validation schemas between the frontend and backend (Supabase Edge Functions can validate the same Zod schema). This eliminates the common problem of frontend/backend validation mismatches.

**Bundle Size:** React Hook Form is approximately 9 KB gzipped. Zod is approximately 12 KB gzipped (though tree-shaking removes unused validators). Total: approximately 15 KB gzipped.

### 1.11 Recharts

**Version Target:** Recharts 2.12+

**Why Recharts over Chart.js (react-chartjs-2), D3 (direct), Visx, or Nivo:**

Recharts is built on D3 but provides React-native declarative components. A bar chart is simply `<BarChart data={data}><Bar dataKey="score" /><XAxis dataKey="date" /></BarChart>`. This is dramatically simpler than raw D3, which requires imperative DOM manipulation.

Chart.js with react-chartjs-2 is a reasonable alternative but uses a canvas-based rendering model that is harder to style with Tailwind CSS. Recharts renders SVG, which can be styled with CSS and integrates with the rest of the UI.

Visx (from Airbnb) provides low-level D3 primitives as React components. It is more flexible than Recharts but requires significantly more code to build charts. FOCUS's charts are standard (bar, line, pie, radar) and do not need Visx's flexibility.

Nivo is declarative like Recharts but has a larger bundle size and fewer community resources.

**Bundle Size:** Recharts is approximately 35 KB gzipped. This is the heaviest chart library under consideration, but the developer experience and SVG output justify the cost. Recharts is lazy-loaded; it only loads when the user navigates to a statistics page.

### 1.12 Capacitor (Mobile Deployment)

**Version Target:** Capacitor 5+

**Why Capacitor over React Native, Expo, or Cordova:**

Capacitor wraps the existing web application in a native shell (WKWebView on iOS, WebView on Android). This means FOCUS ships the same React codebase to web, iOS, and Android without maintaining separate native projects.

React Native requires writing platform-specific code (Objective-C/Swift for iOS, Kotlin/Java for Android) for any native functionality. The FOCUS codebase is entirely TypeScript; requiring native code for mobile would effectively double the engineering effort.

Expo simplifies React Native development but still requires native builds, native dependencies, and React Native's bridge architecture. Expo's EAS Build service is convenient but adds a recurring cost.

Cordova is deprecated and has security vulnerabilities in its plugin ecosystem.

**Key Advantage:** Capacitor allows FOCUS to use every web technology (CSS animations, Canvas, WebGL for game rendering) without native bridging. Game performance on mobile is critical, and Capacitor's WebView performance is sufficient for 2D canvas-based games.

**Bundle Size:** Capacitor's runtime is approximately 50 KB native code (not in the JS bundle). The web bundle remains identical.

**Performance:** Capacitor's performance is limited by the WebView. For 2D canvas games, this is typically 60fps on modern devices. For 3D or physics-heavy games, React Native with native modules would be faster, but FOCUS's games are 2D cognitive tasks that do not require native rendering.

### 1.13 Tauri (Desktop Deployment)

**Version Target:** Tauri 2.0+

**Why Tauri over Electron:**

Tauri uses the operating system's native WebView (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux) instead of bundling Chromium. This results in dramatically smaller application sizes:

- Electron app: 150-200 MB (includes Chromium)
- Tauri app: 5-10 MB (uses system WebView)

For a cognitive training application that users download and install, a 10 MB installer versus a 200 MB installer is a significant difference in adoption rates.

Tauri's Rust backend is more secure than Electron's Node.js backend. Tauri uses a capability-based permission system that restricts what the frontend can access, reducing the attack surface.

Electron has better Windows WebView2 support historically, but Tauri 2.0 has stable Windows support via WebView2.

**Bundle Size:** Tauri's Rust binary is approximately 3-5 MB. The web assets add approximately 200-400 KB. Total: approximately 5 MB compressed, compared to Electron's 150+ MB.

**Team Productivity:** Tauri requires Rust for any native plugins, but FOCUS's desktop needs are minimal (system tray integration, auto-updates, file system access for export). These are well-covered by Tauri's built-in APIs and community plugins, requiring minimal Rust code.

---

## 2. Backend & Infrastructure

### 2.1 Supabase (Backend-as-a-Service)

**Why Supabase over Firebase, custom Node.js backend, or AWS Amplify:**

Supabase provides a complete backend built on PostgreSQL. This is the single most important architectural decision in the FOCUS stack. Every other backend alternative was evaluated:

**Firebase:** Firebase uses Firestore, a NoSQL document database. For FOCUS, which has complex relational data (users → games → sessions → events → scores, with foreign keys and joins across 50+ tables), NoSQL is a poor fit. Firestore's data modeling requires denormalization and manual consistency management. A single "complete game" operation would require writing to 5+ Firestore documents atomically, with no join support for queries like "get all friends' scores for this game." Firebase's pricing is also unpredictable at scale; reads are billed per document, and a single leaderboard query can cost dollars.

Supabase's PostgreSQL allows normalized data modeling with foreign keys, joins, CTEs, window functions, and materialized views. A leaderboard query is a single SQL statement. Pricing is based on compute resources, not per-query, which is predictable.

**Custom Node.js/Express Backend:** Building a custom backend gives maximum control but requires implementing: authentication, authorization, row-level security, real-time subscriptions, file storage, API rate limiting, CORS configuration, and deployment pipelines. This is 3-6 months of infrastructure work before a single feature is built. Supabase provides all of this out of the box.

**AWS Amplify:** Amplify is a wrapper around AWS services (AppSync, DynamoDB, Cognito). It has poor documentation, inconsistent API design, and tight coupling to AWS. Debugging Amplify issues requires understanding the underlying AWS services, defeating the purpose of a BaaS.

**Supabase Advantages for FOCUS:**

1. **PostgreSQL Extensions:** FOCUS uses `pg_trgm` for fuzzy search, `pg_cron` for scheduled tasks (daily streak resets, weekly leaderboards), `postgis` potentially for location-based features, and `pgcrypto` for encryption.

2. **Row-Level Security (RLS):** Every table in FOCUS has RLS policies that enforce access control at the database level. This means even if the application code has a bug, the database prevents unauthorized data access. This is critical for a platform handling user data, game scores, and financial information.

3. **Realtime:** Supabase Realtime broadcasts changes to PostgreSQL rows in real-time via WebSocket. FOCUS uses this for live leaderboards, real-time multiplayer game state, and notification delivery.

4. **Edge Functions:** Supabase Edge Functions run Deno in Cloudflare Workers, providing serverless compute for operations that cannot run in the browser (webhook processing, email sending, complex game logic validation).

5. **Storage:** Supabase Storage handles user avatars, game assets, and exported data files. Storage buckets have RLS policies that mirror database access patterns.

**Cost Estimate:** Supabase Pro plan ($25/month) provides 8 GB database, 100 GB bandwidth, 1 GB file storage, 500K Edge Function invocations. This is sufficient for the first 50K users. Growth beyond that requires the Team plan ($599/month) or Enterprise pricing.

### 2.2 PostgreSQL 15+

**Version Target:** PostgreSQL 15.4+ (latest stable)

**Why PostgreSQL over MySQL, SQLite, MongoDB, or CockroachDB:**

PostgreSQL is the most feature-complete open-source relational database. FOCUS leverages these specific features:

- **JSONB columns:** For flexible game configuration data that varies by game type
- **Array columns:** For storing user preferences as PostgreSQL arrays
- **Window functions:** For leaderboard rankings (`RANK()`, `ROW_NUMBER()`, `NTILE()`)
- **CTEs (Common Table Expressions):** For complex queries involving multiple subqueries
- **Materialized views:** For pre-computed statistics that would be expensive to calculate on every request
- **pg_cron:** For scheduled tasks (daily XP calculations, weekly leaderboard resets)
- **Full-text search:** For searching games, users, and articles
- **Row-Level Security:** For authorization at the database level
- **Extensions:** `pg_trgm` (trigram similarity), `pgcrypto` (encryption), `uuid-ossp` (UUID generation)

MySQL lacks window functions (limited in MySQL 8+), CTEs, and RLS. SQLite is not suitable for concurrent access. MongoDB lacks the relational features FOCUS requires. CockroachDB is PostgreSQL-compatible but adds operational complexity for a project that doesn't need distributed SQL.

**Extensions Enabled:**
- `uuid-ossp`: UUID v4 generation for primary keys
- `pgcrypto`: Encryption for sensitive data
- `pg_trgm`: Fuzzy text search for game/user discovery
- `pg_cron`: Scheduled jobs for streak resets, leaderboard computation
- `pg_stat_statements`: Query performance monitoring

### 2.3 Supabase Auth

**Why Supabase Auth over Auth0, Clerk, NextAuth, or Firebase Auth:**

Supabase Auth integrates natively with PostgreSQL RLS. When a user authenticates, their `auth.uid()` is available in every RLS policy, allowing row-level access control without application-level middleware. This is a fundamental architectural advantage.

Auth0 costs $23/month for the first 10,000 active users and increases steeply. Clerk costs $25/month for the first 10,000 users. Both are SaaS products with vendor lock-in. Supabase Auth is open-source and runs on the same infrastructure as the rest of the backend.

NextAuth is designed for Next.js and does not integrate with PostgreSQL RLS.

Firebase Auth works with Firestore but lacks RLS-style row-level permissions.

**Features Used:** Email/password, magic links, OAuth (Google, Apple, GitHub), MFA (TOTP), session management, JWT tokens with custom claims.

### 2.4 Supabase Edge Functions

**Why Edge Functions over Cloud Functions, AWS Lambda, or traditional servers:**

Edge Functions run at the network edge (Cloudflare Workers) with cold start times under 10ms. AWS Lambda cold starts are 100-500ms. This matters for FOCUS because Edge Functions handle webhook processing (RevenueCat subscription events) and game logic validation that must respond quickly.

Edge Functions use Deno, which has native TypeScript support, built-in formatting, and a secure sandbox model. No build step is required; functions are deployed directly as TypeScript files.

**Functions in FOCUS:**
- `stripe-webhook`: Processes payment events
- `revenuecat-webhook`: Processes subscription lifecycle events
- `validate-game`: Server-side game result validation
- `calculate-xp`: XP calculation with anti-cheat verification
- `send-notification`: Push notification dispatch via FCM/APNs
- `generate-stats`: On-demand statistics generation

### 2.5 Supabase Storage

Storage buckets:
- `avatars`: User profile images (max 2 MB, auto-resized to 256px, 512px, 1024px)
- `game-assets`: Static game images, icons, backgrounds
- `exports`: User data exports (GDPR compliance)

RLS policies ensure users can only read/write their own avatars, and game assets are public-read.

### 2.6 Supabase Realtime

Realtime channels:
- `leaderboard:{gameId}`: Live leaderboard updates
- `game-session:{sessionId}`: Real-time game state for multiplayer
- `notifications:{userId}`: User notification delivery
- `streak:{userId}`: Streak update broadcasts

---

## 3. Infrastructure & Deployment

### 3.1 Vercel (Frontend Deployment)

**Why Vercel over Netlify, AWS Amplify Hosting, Cloudflare Pages, or self-hosted:**

Vercel is built by the Next.js team and provides first-class React deployment. Even though FOCUS uses Vite (not Next.js), Vercel's static site hosting, edge functions, and preview deployments are excellent.

Vercel's preview deployments give every pull request a unique URL with environment variables configured. This allows QA to test changes in isolated environments before merging.

Netlify is comparable but has slower build times and less reliable edge functions. Cloudflare Pages is faster but has less mature CI/CD integration. AWS Amplify Hosting is complex to configure.

**Features Used:** Static site hosting, Edge Functions (for A/B testing and redirects), Analytics (Core Web Vitals), Speed Insights, Preview Deployments.

### 3.2 Cloudflare (CDN, DNS, DDoS Protection)

**Why Cloudflare over AWS CloudFront, Fastly, or Akamai:**

Cloudflare provides CDN, DNS, DDoS protection, and WAF (Web Application Firewall) on its free tier. AWS CloudFront requires separate AWS WAF configuration and is more expensive for equivalent features.

Cloudflare's global network (300+ cities) ensures low-latency access for FOCUS users worldwide. The free tier includes unlimited bandwidth, which is critical for a gaming application with potentially large static assets.

**Features Used:** DNS management, CDN caching, DDoS protection, SSL/TLS termination, Page Rules (cache control), Workers (for edge compute if needed beyond Vercel).

### 3.3 GitHub Actions (CI/CD)

**Why GitHub Actions over GitLab CI, CircleCI, Jenkins, or Travis CI:**

GitHub Actions is tightly integrated with the GitHub repository. The CI/CD pipeline runs on every push and pull request:

1. **Lint:** ESLint + Prettier check
2. **Type Check:** TypeScript compiler
3. **Unit Tests:** Vitest
4. **E2E Tests:** Playwright
5. **Build:** Vite production build
6. **Deploy:** Vercel deployment (production on `main`, preview on branches)
7. **Storybook:** Deploy to Chromatic for visual review
8. **Changesets:** Version bump and changelog generation

GitHub Actions provides 2,000 free minutes/month for public repositories and 3,000 for private repositories on the Pro plan. This is sufficient for FOCUS's CI/CD needs.

### 3.4 Sentry (Error Tracking)

**Why Sentry over LogRocket, Bugsnag, Datadog, or custom error handling:**

Sentry provides automatic error capture with source maps, breadcrumbs (user actions before the error), environment context, and performance monitoring. When a user encounters a bug in production, Sentry captures the full stack trace, the user's actions leading to the error, and the device/environment information.

LogRocket provides session replay, which is useful but expensive ($99/month). Sentry now includes session replay in its performance monitoring tier.

**Configuration:** Sentry DSN is injected at build time. Source maps are uploaded to Sentry from the Vite build. User identifiers are hashed for privacy. Performance traces are sampled at 10% in production to manage costs.

### 3.5 PostHog (Product Analytics)

**Why PostHog over Mixpanel, Amplitude, Google Analytics, or custom analytics:**

PostHog is open-source and can be self-hosted, though FOCUS uses the cloud version for simplicity. It provides event tracking, session replay, feature flags, A/B testing, and cohort analysis—all in one platform.

Mixpanel costs $20/month for 10M events. Amplitude costs $61/month for 10M events. PostHog's free tier includes 1M events/month, which is sufficient for early-stage FOCUS.

**Events Tracked:** Page views, game starts, game completions, feature usage (e.g., streak freeze used), subscription events, onboarding funnel, retention cohorts.

**Feature Flags:** PostHog feature flags control gradual rollout of new features. FOCUS uses this to enable new games to 10% of users, then 50%, then 100% based on engagement metrics.

### 3.6 RevenueCat (Subscription Management)

**Why RevenueCat over Stripe Billing, Apple In-App Purchases directly, or Google Play Billing directly:**

RevenueCat is a cross-platform subscription management SDK that handles in-app purchases on iOS, Android, Stripe (web), and Paddle. Without RevenueCat, FOCUS would need to implement separate purchase flows for each platform, handle receipt validation for Apple and Google, manage subscription state across platforms, and implement server-to-server webhooks for each store.

RevenueCat provides a unified API: `Purchases.purchasePackage(package)` works identically on iOS, Android, and web. It handles receipt validation, subscription state tracking, and cross-platform entitlement synchronization.

**Pricing:** RevenueCat is free up to $2,500/month in tracked revenue. FOCUS's subscription revenue will not exceed this threshold until significant scale.

---

## 4. Developer Tools

### 4.1 Turborepo (Monorepo Management)

**Why Turborepo over Nx, Lerna, or plain npm workspaces:**

Turborepo provides incremental builds, parallel task execution, and remote caching. The FOCUS monorepo structure:

```
focus/
├── apps/
│   ├── web/          # React + Vite SPA
│   ├── mobile/       # Capacitor iOS/Android
│   └── desktop/      # Tauri macOS/Windows
├── packages/
│   ├── ui/           # Shared React components
│   ├── game-engine/  # Game logic and rendering
│   ├── supabase/     # Supabase client, types, migrations
│   ├── config/       # Shared TypeScript/ESLint configs
│   └── types/        # Shared TypeScript types
```

Turborepo's caching means that if only `packages/ui` changes, only the apps that depend on it are rebuilt. The `game-engine` and `types` packages are cached.

**Bundle Size:** Turborepo is a dev dependency only; zero bytes added to production.

### 4.2 ESLint + Prettier

**ESLint Configuration:**
- `@typescript-eslint/recommended-strict` (mirrors TypeScript strict mode)
- `eslint-plugin-react-hooks` (enforces Rules of Hooks)
- `eslint-plugin-react-refresh` (ensures Fast Refresh compatibility)
- `eslint-plugin-import` (enforces import ordering)
- `eslint-plugin-tailwindcss` (enforces Tailwind class ordering)

**Prettier Configuration:**
- Single quotes, no semicolons, 100 char line width
- Tailwind CSS class sorting via `prettier-plugin-tailwindcss`

### 4.3 Vitest (Unit Testing)

**Why Vitest over Jest:**

Vitest uses Vite's transform pipeline, meaning it understands the same configuration (aliases, environment, plugins) as the production build. Jest uses its own transform pipeline, which often requires duplicating Vite configuration.

Vitest is faster than Jest for large test suites due to parallel execution and native ESM support. FOCUS targets 80% code coverage for business logic (game mechanics, XP calculations, statistics) and 60% overall.

### 4.4 Playwright (E2E Testing)

**Why Playwright over Cypress, Selenium, or Puppeteer:**

Playwright supports Chromium, Firefox, and WebKit from a single API. Cypress only supports Chromium-based browsers. This is important for FOCUS because Capacitor uses WKWebView (WebKit) on iOS; Playwright can test WebKit compatibility.

Playwright's auto-waiting, network interception, and parallel execution across browsers make E2E tests reliable and fast. FOCUS maintains E2E tests for: onboarding flow, game play, subscription purchase, and settings management.

### 4.5 Storybook (Component Documentation)

**Version Target:** Storybook 8+

Storybook provides isolated development and visual testing for React components. FOCUS maintains stories for all shared UI components (buttons, cards, modals, forms, charts) with visual regression testing via Chromatic.

### 4.6 Changesets (Version Management)

Changesets manages version bumps and changelog generation. When a PR includes a changeset file (`.changeset/xxx.md`), the CI pipeline automatically bumps the version and generates a changelog entry on merge to `main`.

### 4.7 Husky + lint-staged (Git Hooks)

**Pre-commit hooks:**
- `prettier --check` on staged `.ts`, `.tsx`, `.css` files
- `eslint --fix` on staged `.ts`, `.tsx` files
- `tsc --noEmit` on all TypeScript files

These hooks prevent code with formatting or type errors from being committed.

---

## 5. Bundle Size Summary

| Library | Gzipped Size | Category |
|---------|-------------|----------|
| React + ReactDOM | 44 KB | Core |
| TypeScript (compile-time) | 0 KB | Core |
| Vite (compile-time) | 0 KB | Build |
| Tailwind CSS (output) | 12 KB | Styling |
| Framer Motion | 32 KB | Animation |
| Zustand | 1.2 KB | State |
| React Query | 13 KB | Data |
| React Router | 8 KB | Routing |
| i18next | 10 KB | i18n |
| React Hook Form | 9 KB | Forms |
| Zod | 12 KB | Validation |
| Recharts | 35 KB | Charts (lazy) |
| Supabase JS | 45 KB | Backend |
| Sentry | 15 KB | Monitoring |
| PostHog | 25 KB | Analytics |
| **Total Core** | **~170 KB** | **Initial Load** |
| **Total Lazy** | **~70 KB** | **On Demand** |

---

## 6. Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.2s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.0s | Lighthouse |
| Total Blocking Time | < 200ms | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| JavaScript Bundle (gzipped) | < 200 KB | Vite build output |
| CSS Bundle (gzipped) | < 15 KB | Tailwind output |
| Initial HTTP Requests | < 15 | Network tab |

---

## 7. Development Environment Setup

**Prerequisites:**
- Node.js 20 LTS
- pnpm 9+ (package manager, faster than npm/yarn)
- Docker Desktop (for local Supabase via `supabase cli`)
- VS Code with extensions: ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript, GitLens

**Local Development:**
```bash
pnpm install              # Install dependencies
supabase start            # Start local Supabase (PostgreSQL, Auth, Storage)
pnpm dev                  # Start Vite dev server
pnpm storybook            # Start Storybook
```

**Environment Variables:**
- `VITE_SUPABASE_URL` — Local or production Supabase URL
- `VITE_SUPABASE_ANON_KEY` — Public anon key (RLS enforced)
- `VITE_POSTHOG_KEY` — PostHog API key
- `VITE_SENTRY_DSN` — Sentry DSN
- `VITE_REVENUECAT_API_KEY` — RevenueCat public SDK key

---

## 8. Deployment Pipeline

```
Push to main
  → GitHub Actions CI
    → Lint + Type Check
    → Unit Tests (Vitest)
    → E2E Tests (Playwright)
    → Build (Vite)
    → Deploy to Vercel (production)
    → Upload source maps to Sentry
    → Deploy Storybook to Chromatic
    → Run Changesets (version + changelog)
  → Cloudflare CDN caches static assets
  → Sentry monitors for errors
  → PostHog tracks deployment events
```

---

## 9. Cost Summary (Monthly Estimates at Scale)

| Service | Free Tier | 10K Users | 100K Users |
|---------|-----------|-----------|------------|
| Supabase | $0 (500MB) | $25 (Pro) | $599 (Team) |
| Vercel | $0 (100GB) | $20 (Pro) | $150 (Team) |
| Cloudflare | $0 (unlimited) | $0 | $0 |
| Sentry | $0 (5K errors) | $26 (Team) | $80 (Team) |
| PostHog | $0 (1M events) | $0 | $450 (Scale) |
| RevenueCat | $0 (<$2.5K rev) | $0 | $99 (Growth) |
| GitHub Actions | $0 (2K min) | $4 (Pro) | $4 (Pro) |
| **Total** | **$0** | **$75/mo** | **$1,382/mo** |

This stack is designed to be free during development and early beta, affordable during early growth, and predictable at scale. The total infrastructure cost for 100K users is under $1,400/month—less than a single senior engineer's salary—which maximizes the runway for product development.
