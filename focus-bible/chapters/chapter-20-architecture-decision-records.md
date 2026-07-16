# Chapter 20: Architecture Decision Records

## Overview

Architecture Decision Records (ADRs) are the immutable chronicle of every significant technical choice made during the construction of the FOCUS platform. They serve three purposes: preserving institutional memory, preventing revisitation of settled debates, and giving every contributor a single source of truth for why the system is built the way it is. Each ADR is a standalone document with a fixed structure: Status, Context, Decision, Consequences, and Alternatives Considered. Once an ADR is accepted, it is never modified—only superseded by a new ADR that references its predecessor. This chapter contains the first ten ADRs that form the foundational technical identity of FOCUS.

---

## ADR-001: Supabase as Backend

### Status

**Accepted** — 2025-01-15

### Context

FOCUS requires a backend that handles authentication, persistent storage of user profiles and game session data, real-time subscriptions for live leaderboard updates, and server-side logic for anti-cheat validation and analytics aggregation. The team is small (3–5 engineers), the budget is constrained, and the platform must launch within four months. The backend must also support Row Level Security (RLS) so that each user can only access their own data, which is a hard requirement for HIPAA-adjacent cognitive health data. The team has experience with PostgreSQL but minimal experience managing bare-metal database servers. The product roadmap includes a future pivot to self-hosted infrastructure for enterprise clients, so vendor lock-in must be manageable.

### Decision

We will use **Supabase** as the primary backend. Supabase provides a hosted PostgreSQL database with auto-generated REST and Realtime APIs, built-in authentication with social OAuth providers, Edge Functions for custom serverless logic, Storage for file uploads (profile pictures, exported PDFs), and Row Level Security policies that are enforced at the database layer. The free tier covers the MVP launch, and the Pro tier at $25/month scales comfortably through the first 10,000 users.

Supabase was chosen because it gives us a production-grade PostgreSQL database without requiring us to manage infrastructure. The auto-generated APIs eliminate the need to write a custom REST or GraphQL layer for CRUD operations, which saves weeks of development time. The built-in auth system supports Google, Apple, GitHub, and email/password sign-in out of the box, which covers all of our target platforms. Realtime subscriptions allow us to push leaderboard updates to connected clients without polling, which is critical for the social competition features. Row Level Security policies are defined in SQL and enforced by PostgreSQL itself, meaning even if our application code has bugs, the database will not leak data across user boundaries.

### Consequences

**Positive:** The team ships a production backend in days rather than months. PostgreSQL's maturity means we get ACID transactions, complex queries, and indexing for free. RLS policies are enforced at the database level, providing a security guarantee that survives application-layer bugs. Supabase's open-source nature means we can self-host if the company outgrows their managed offering or if enterprise clients demand on-premise deployment. The TypeScript client library (`@supabase/supabase-js`) integrates cleanly with our React frontend and provides full type safety when paired with the Supabase CLI's type generation.

**Negative:** Supabase's Edge Functions run on Deno, not Node.js, which means our team must learn a new runtime for any serverless logic. The free tier has rate limits (500MB database, 1GB file storage, 50,000 monthly active users) that will eventually require a plan upgrade. Realtime subscriptions have a connection limit of 200 concurrent connections on the free tier, which may bottleneck during high-traffic events. We are dependent on Supabase's infrastructure availability, though the self-hosted escape valve mitigates this risk.

**Mitigation:** We will write Edge Functions sparingly, using them only for anti-cheat validation and analytics aggregation—tasks that cannot be done client-side. All other business logic lives in the React client or in PostgreSQL functions called via RPC. We will implement a connection pooling strategy for Realtime subscriptions, using channel multiplexing to reduce the number of active connections. We will also maintain a `supabase/` directory with Docker Compose files for self-hosted deployment, ensuring the migration path is always tested.

### Alternatives Considered

**Firebase (Firestore + Auth):** Firebase offers a similar all-in-one backend with authentication, a NoSQL database, and real-time listeners. However, Firestore's document model is a poor fit for relational data like user profiles linked to game sessions linked to leaderboard entries. Firestore's pricing is based on document reads, which makes leaderboard queries unpredictable in cost. Firebase's vendor lock-in is severe—migrating away from Firestore requires rewriting every database query. Supabase's PostgreSQL foundation means we can migrate to any PostgreSQL-compatible host with zero query changes.

**Custom Backend (Node.js + PostgreSQL + Prisma):** A fully custom backend gives maximum control but requires us to build authentication, session management, API routing, CORS configuration, rate limiting, database migrations, and deployment pipelines from scratch. For a team of 3–5 engineers with a four-month timeline, this is not feasible. The maintenance burden of operating a custom backend (patching dependencies, managing SSL certificates, monitoring uptime) would consume engineering bandwidth that should be spent on the product.

**PocketBase:** PocketBase is a lightweight, self-hosted backend with SQLite, auth, and real-time subscriptions. It is appealing for its simplicity but lacks the scalability of PostgreSQL, does not support horizontal scaling, and has a smaller ecosystem. For a platform that may need to handle thousands of concurrent users on leaderboards, SQLite's write锁 behavior is a risk.

---

## ADR-002: Capacitor for Mobile

### Status

**Accepted** — 2025-01-18

### Context

FOCUS must ship on iOS and Android. The core product is a React web application, and the team's expertise is overwhelmingly in web technologies (React, TypeScript, CSS, Vite). Native development in Swift/Kotlin is outside the team's skill set, and hiring native developers is not in the budget. The mobile app must feel native enough to be accepted in the App Store and Play Store, support push notifications, and integrate with platform-specific features like haptic feedback and biometric authentication. The app must also work offline, since users may play Focus Games during flights or in areas with poor connectivity.

### Decision

We will use **Capacitor** (by Ionic) to wrap the React web application in a native shell for iOS and Android. Capacitor provides a JavaScript bridge to native APIs (camera, filesystem, haptic engine, push notifications, biometric auth) while allowing the UI to remain a standard web application rendered in a WebView. The Capacitor CLI generates Xcode and Android Studio projects that can be submitted to the App Store and Play Store.

Capacitor was chosen because it lets us write the entire application once in React and ship it on web, iOS, and Android with minimal platform-specific code. The WebView performance on modern iOS and Android devices is more than sufficient for our UI, which consists of 2D canvas games, charts, and form-based screens—none of which require 60fps 3D rendering. Capacitor's plugin ecosystem covers every native API we need: `@capacitor/push-notifications` for FCM/APNs, `@capacitor/haptics` for vibration feedback, `@capacitor/biometric` for Face ID/fingerprint login, and `@capacitor/filesystem` for offline data caching. The Capacitor Live Updates plugin allows us to push JavaScript/CSS changes without going through the App Store review process, which is critical for rapid iteration during the MVP phase.

### Consequences

**Positive:** The entire engineering team works in a single codebase with familiar web tooling. There is no need to maintain separate Swift and Kotlin projects. New features ship simultaneously on web, iOS, and Android. The Capacitor native shell adds less than 5MB to the app bundle size. Live Updates bypass the App Store review cycle for non-native changes, enabling hotfix deployment in minutes. The open-source license means we are not locked into Ionic's paid services.

**Negative:** The app runs in a WebView, which means it will never achieve the buttery 60fps animations of a fully native UIKit or Jetpack Compose interface. The App Store review process may flag WebView-based apps if they feel too "web-like," so we must invest in native-feeling transitions, safe area handling, and platform-specific UI conventions (e.g., iOS bottom tab bar vs. Android navigation drawer). Some advanced native features (ARKit, Core ML, custom camera filters) may require writing native Swift/Kotlin plugins, which reintroduces the native development burden for edge cases. Push notification handling on iOS requires a paid Apple Developer account ($99/year) and careful configuration of APNs certificates.

**Mitigation:** We will invest in a native-feeling shell by implementing platform-aware navigation patterns, native-style transitions via `@capacitor/app`, and proper safe area insets. We will benchmark touch responsiveness and animation frame rates on target devices (iPhone 12+, Pixel 6+) to ensure the WebView performance meets our standards. For the rare cases where native capabilities are needed beyond WebView (e.g., background processing for cognitive session scheduling), we will write minimal Capacitor plugins in Swift and Kotlin. We will also use the Capacitor Community's maintained plugins rather than building bridges from scratch.

### Alternatives Considered

**React Native:** React Native renders native UI components, which gives better animation performance and a more "native feel." However, it requires learning React Native's component model, which is different from standard React DOM components. Many of our web-specific libraries (Konva.js for canvas games, D3.js for analytics charts, Tailwind CSS) do not have React Native equivalents, so we would need to rewrite the game rendering layer and styling system. React Native's bridge architecture adds complexity to the build pipeline, and debugging JavaScript-to-native communication is significantly harder than debugging a standard web app.

**Flutter:** Flutter compiles to native ARM code and offers excellent animation performance with its Skia rendering engine. However, Flutter uses Dart, which no one on the team knows. The entire UI would need to be rewritten in Flutter's widget system, and Flutter's web support is still maturing. The app bundle size is typically 15–20MB larger than Capacitor-based apps. For a team with deep web expertise and a four-month timeline, the learning curve is prohibitive.

**Progressive Web App (PWA) only:** A PWA avoids the App Store entirely and works on any device with a browser. However, PWAs cannot send push notifications on iOS (as of iOS 17), cannot be listed in the App Store for discoverability, and lack access to some native APIs. The App Store listing is important for user trust and organic acquisition, so a PWA-only strategy is insufficient.

---

## ADR-003: Tauri for Desktop

### Status

**Accepted** — 2025-01-20

### Context

FOCUS needs a desktop application for Windows and macOS. The desktop app serves two use cases: (1) users who prefer a dedicated desktop experience for their focus sessions, and (2) enterprise clients who want to deploy FOCUS on corporate workstations via MDM (Mobile Device Management). The desktop app must be lightweight (under 50MB installer), must not consume excessive RAM, must support auto-updates, and must integrate with the system tray for background operation. The team has experience with web technologies but not with native desktop frameworks.

### Decision

We will use **Tauri 2.x** to build the desktop application. Tauri wraps the existing React web application in a native webview (WebKit on macOS, WebView2 on Windows) and provides a Rust backend for system-level operations (file system access, system tray, auto-updates, notifications). The Rust backend is compiled into the final binary, eliminating the need for a bundled Node.js runtime.

Tauri was chosen because it produces dramatically smaller binaries than Electron (8–15MB vs. 150–200MB), uses 10x less RAM at idle (30–50MB vs. 300–500MB), and leverages the system's native webview rather than bundling Chromium. For enterprise clients who care about disk space and memory usage on corporate workstations, this difference is significant. Tauri's Rust backend provides type-safe, memory-safe system access without the security risks of Electron's Node.js integration. The Tauri plugin system covers auto-updates (`tauri-plugin-updater`), system tray (`tauri-plugin-tray-icon`), notifications (`tauri-plugin-notification`), and deep linking (`tauri-plugin-deep-link`).

### Consequences

**Positive:** The desktop app installer is 8–15MB, compared to Electron's 150–200MB. RAM usage at idle is 30–50MB, compared to Electron's 300–500MB. Tauri's security model is stronger than Electron's because the Rust backend runs in a separate process with explicit IPC boundaries—the webview cannot directly access the file system or execute arbitrary commands. Auto-updates are built in via `tauri-plugin-updater`, which downloads delta patches rather than full binaries. The same React codebase used for the web app runs in the desktop webview, so no UI rewriting is needed.

**Negative:** Tauri's Rust backend requires the team to learn Rust, which has a steep learning curve (ownership, borrowing, lifetimes). For the initial MVP, the Rust code is minimal (file I/O, system tray, updater), so the learning curve is manageable, but complex features (local SQLite database, native notifications with actions) will require deeper Rust expertise. Tauri's webview is not identical across platforms—WebKit on macOS and WebView2 on Windows may render CSS differently, requiring platform-specific testing. Tauri's ecosystem is younger than Electron's, so some features may require building custom Rust plugins.

**Mitigation:** We will isolate all Rust code in a `src-tauri/` directory with clear TypeScript bindings generated by Tauri's IPC system. The initial Rust code will be limited to 3–4 commands (read/write config, show tray icon, check for updates), keeping the learning curve shallow. We will test on both macOS and Windows in CI via GitHub Actions matrix builds. For any feature that requires deep system integration (e.g., monitoring system-wide focus mode on macOS), we will evaluate whether it is worth the Rust complexity or whether it can be deferred.

### Alternatives Considered

**Electron:** Electron is the most mature desktop web wrapper, with a vast ecosystem and extensive documentation. However, Electron bundles Chromium, resulting in 150–200MB installers and 300–500MB RAM usage at idle. For a productivity tool that runs alongside other applications, this resource consumption is unacceptable. Electron's Node.js integration also introduces security risks if not properly sandboxed via `contextBridge` and `preload` scripts.

**Neutralinojs:** Neutralinojs is a lightweight alternative to Electron that uses the system's native webview. It is written in C++ and has a smaller footprint than Electron but lacks Tauri's Rust-based safety guarantees, auto-update infrastructure, and plugin ecosystem. The community is smaller, and long-term maintenance is uncertain.

**Native (Swift + Kotlin):** Building separate macOS and Windows apps in Swift and Kotlin gives maximum platform integration but requires maintaining two codebases in two languages. The team has no Swift or Kotlin expertise, and the development timeline does not permit learning two new languages simultaneously.

---

## ADR-004: Dark Mode Default

### Status

**Accepted** — 2025-01-22

### Context

FOCUS is a cognitive training tool designed to be used during focused work sessions, often in low-light environments (home offices at night, dimly lit co-working spaces, airplane cabins). Users may be staring at the screen for 5–60 minutes per session. Bright screens cause eye strain, disrupt circadian rhythms, and reduce melatonin production, all of which are counterproductive for a tool that promotes focus and cognitive health. The design team has conducted user research showing that 78% of beta testers prefer dark interfaces for productivity tools. The accessibility team has raised concerns about dark mode contrast ratios and the need to support users with light sensitivity.

### Decision

The default theme for all FOCUS interfaces (web, mobile, desktop) is **dark mode** with a carefully designed color palette that meets WCAG 2.1 AA contrast requirements. The dark palette uses a near-black background (#0F1117), a muted card surface (#1A1D27), and text colors that maintain a minimum 4.5:1 contrast ratio against the background (primary text: #E8E9ED at 14.8:1, secondary text: #9CA0B0 at 7.2:1). A light mode is available as a user preference, and the app respects the operating system's `prefers-color-scheme` setting. The theme is implemented via CSS custom properties (design tokens) that are swapped at the root level, enabling instant theme switching without re-rendering components.

Dark mode was chosen as the default rather than light mode because: (1) dark screens emit less light, reducing eye strain during extended sessions; (2) dark interfaces are associated with professional-grade tools (VS Code, Figma, Linear) that our target users already prefer; (3) AMOLED screens on modern smartphones consume less power when displaying dark pixels, extending battery life during mobile sessions; (4) the dark palette provides a high-contrast canvas that makes game elements (colored dots, progress rings, score numbers) visually pop.

### Consequences

**Positive:** Eye strain is reduced during extended sessions, which aligns with the product's mission of promoting cognitive health. The dark palette makes game elements (colored targets, progress indicators, score numbers) more visually prominent, improving the gaming experience. AMOLED battery savings extend mobile session length. The design token system (CSS custom properties) enables instant theme switching, and the same tokens are shared across web, mobile, and desktop platforms. The dark palette serves as a neutral canvas that does not compete with the colorful game elements.

**Negative:** Dark mode introduces accessibility challenges. Some users with astigmatism find dark text on light backgrounds easier to read, and forcing dark mode on them degrades their experience. Certain color combinations that work well on dark backgrounds (e.g., green on black) may fail contrast checks. The light mode alternative must be maintained as a first-class option, which doubles the design QA burden. Some third-party libraries (chart libraries, calendar widgets) ship with light-mode-only defaults that must be overridden.

**Mitigation:** The light mode is not an afterthought—it is a fully designed, fully tested alternative that is accessible from the first-run experience. Users are asked during onboarding whether they prefer dark or light mode, and the OS preference is respected as a fallback. All color combinations are tested against both dark and light palettes using automated contrast checking in CI. Chart libraries are configured with theme-aware color palettes. The CSS custom property system ensures that theme switching is a single DOM operation with no layout shift.

### Alternatives Considered

**Light mode default:** Light mode is the traditional default for web applications and is preferred by some users with visual impairments. However, our user research and the product's positioning as a focus/wellness tool make dark mode the more appropriate default. Light mode is available as an opt-in preference.

**System-only theming:** Some apps defer entirely to the OS theme setting and do not offer an in-app toggle. This is simpler but removes user agency. Our onboarding flow includes an explicit theme selection step, and the settings page allows changing the theme at any time.

**Auto-switching based on time of day:** Some apps switch to dark mode at sunset and light mode at sunrise. This is a nice-to-have feature but adds complexity for marginal benefit. We may add this as a future enhancement, but it is not in the MVP scope.

---

## ADR-005: Zustand over Redux

### Status

**Accepted** — 2025-01-24

### Context

FOCUS requires client-side state management for UI state (current screen, sidebar open/closed, active game, settings panel visibility), game state (current score, streak, timer, combo multiplier), and user preferences (theme, notification settings, difficulty level). The state management solution must be lightweight (bundle size matters on mobile), easy to understand for new contributors, support middleware (for persistence and devtools), and not require boilerplate code (actions, reducers, action creators). The team has experience with Redux Toolkit but finds it verbose for the scale of state we need to manage.

### Decision

We will use **Zustand** as the primary client-side state management library. Zustand is a 1.1KB (gzipped) state management library for React that uses a flux-like architecture with a minimal API. Stores are created with a single function call, actions are defined inline, and there is no boilerplate (no action types, no action creators, no switch statements). Zustand supports middleware for persistence (localStorage/AsyncStorage), devtools (Redux DevTools integration), and immutability checks.

Zustand was chosen because it eliminates the boilerplate overhead of Redux while providing the same capabilities. A typical Zustand store is 10–20 lines of code, compared to 50–80 lines for an equivalent Redux Toolkit slice. The `persist` middleware handles localStorage serialization automatically, which is critical for offline state persistence. Zustand's `subscribeWithSelector` middleware enables fine-grained subscriptions, so components only re-render when the specific piece of state they depend on changes. The Redux DevTools integration means we still get time-travel debugging and state inspection during development.

### Consequences

**Positive:** Bundle size is reduced by 10–15KB gzipped compared to Redux + React-Redux. Developer velocity increases because stores can be created in minutes without boilerplate. The learning curve for new contributors is minimal—Zustand's API is a single hook (`useStore`) with a selector function. The `persist` middleware handles offline state hydration automatically. The Redux DevTools integration preserves the debugging experience that the team is accustomed to.

**Negative:** Zustand's ecosystem is smaller than Redux's. There are fewer official middleware options, and community-contributed libraries are less mature. Zustand does not have a built-in equivalent to Redux Toolkit's `createAsyncThunk`, so async operations (API calls, data fetching) must be handled with raw `async/await` inside store actions, which can lead to inconsistent error handling patterns if not standardized. Zustand stores are global singletons, which can make testing harder if tests need isolated state.

**Mitigation:** We will establish a store pattern convention in the engineering bible: each store is a single file in `src/stores/`, actions are defined as methods on the store object, and async actions use a standard `try/catch` pattern with error state. For data fetching (server state), we will use React Query (see ADR-006), which handles caching, refetching, and optimistic updates—capabilities that neither Zustand nor Redux provide natively. Zustand stores will be scoped to client-only state (UI toggles, game session state, user preferences), while React Query will handle all server-derived state (user profile, game history, leaderboard). This separation prevents the common anti-pattern of duplicating server state in client stores.

### Alternatives Considered

**Redux Toolkit:** Redux Toolkit is the industry standard for complex React state management. It provides `createSlice`, `createAsyncThunk`, RTK Query (data fetching), and excellent DevTools. However, the boilerplate is significant for small stores, and the bundle size is larger. For a team that frequently creates and destroys stores during rapid prototyping, Redux's ceremony is a friction point.

**Jotai:** Jotai is an atomic state management library that is even lighter than Zustand. It excels at fine-grained reactivity where individual atoms update independently. However, our state is mostly coarse-grained (entire game session, entire user profile), and Jotai's atom model would require splitting related state into many tiny atoms, which adds cognitive overhead without benefit.

**Recoil:** Recoil is Facebook's atomic state management library. It has a similar model to Jotai but is less actively maintained and has a larger bundle size. Recoil's API is more complex than Zustand's, and its TypeScript support is less mature.

**No state management library:** Some React applications manage state entirely with `useState` and `useContext`. For a small application, this is sufficient. For FOCUS, which has multiple interconnected stores (game state, user preferences, UI state, analytics state), the prop drilling and re-render issues of raw Context would become a maintenance burden.

---

## ADR-006: React Query for Server State

### Status

**Accepted** — 2025-01-26

### Context

FOCUS fetches server-derived data in multiple places: user profile, game session history, leaderboard rankings, analytics summaries, and settings. This data changes infrequently (profile, settings) to moderately (leaderboard, analytics) and must be available offline with a stale-while-revalidate strategy. The team needs a data fetching solution that handles caching, background refetching, optimistic updates (e.g., when a user updates their display name), pagination (for game history and leaderboards), and error/loading states without requiring manual `useEffect` + `useState` boilerplate for every API call.

### Decision

We will use **TanStack React Query v5** (formerly React Query) for all server state management. React Query is a framework-agnostic data fetching and caching library that manages the lifecycle of server-derived data. It provides `useQuery` for fetching data, `useMutation` for writing data, `useInfiniteQuery` for paginated data, and `useQueryClient` for cache management. The Supabase integration is achieved via a custom `queryFn` that calls the Supabase client library.

React Query was chosen because it solves the exact problem we have: managing server state with caching, background synchronization, and optimistic updates. Zustand (see ADR-005) manages client-only state, while React Query manages server-derived state. This separation is clean and prevents the common mistake of caching server data in Zustand stores, which leads to stale data and manual cache invalidation. React Query's `staleTime` and `cacheTime` settings allow us to tune the freshness/durability tradeoff per query. For example, user profiles have a `staleTime` of 5 minutes (infrequently updated), while leaderboard data has a `staleTime` of 30 seconds (frequently updated). The `placeholderData` option enables skeleton loading states without flash-of-content.

### Consequences

**Positive:** Every API call automatically gets caching, background refetching, and deduplication. Multiple components requesting the same data (e.g., user profile on both the dashboard and settings page) share a single cache entry. Optimistic updates for mutations (e.g., updating a user setting) provide instant UI feedback with automatic rollback on failure. The `useInfiniteQuery` hook simplifies paginated leaderboard loading. React Query DevTools (browser extension) provide cache inspection and manual refetch triggers during development. The `persistQueryClient` middleware can persist the cache to localStorage for offline support.

**Negative:** React Query adds approximately 13KB gzipped to the bundle. The cache can become stale if `staleTime` is set too high, leading to users seeing outdated data. The `useMutation` API requires manual cache invalidation via `queryClient.invalidateQueries`, which is easy to forget and can lead to stale data bugs. React Query's mental model (stale vs. fresh, gc vs. active, placeholder vs. previous data) has a learning curve that the team must invest in.

**Mitigation:** We will configure React Query's `QueryClient` in a central provider with conservative default settings: `staleTime: 60_000` (1 minute), `gcTime: 5 * 60_000` (5 minutes), `refetchOnWindowFocus: true`, `retry: 2`. Each Supabase query will have a per-query override where the default is inappropriate (e.g., leaderboard `staleTime: 30_000`). Mutations will always call `queryClient.invalidateQueries` in the `onSuccess` callback, and this pattern will be enforced via a custom `useMutation` wrapper that includes the invalidation logic. The team will complete the React Query official tutorial (tkdodo.eu/blog) as part of onboarding.

### Alternatives Considered

**SWR:** SWR (by Vercel) is a lighter alternative to React Query with a simpler API. It provides `useSWR` for fetching and `useSWRMutation` for writing. However, SWR lacks React Query's `useInfiniteQuery` (critical for paginated leaderboards), has fewer configuration options for cache behavior, and does not support the `persistQueryClient` middleware for offline caching. The API surface is smaller, which is simpler but limits us as the product grows.

**RTK Query (Redux Toolkit Query):** RTK Query is Redux Toolkit's data fetching solution. It generates API slices from endpoint definitions and handles caching, polling, and invalidation. However, it requires Redux as a dependency, which we have chosen not to use (see ADR-005). The coupling between data fetching and state management is tighter than we want.

**Fetch + useEffect:** Writing raw `useEffect` + `fetch` + `useState` for each API call is the most basic approach. It requires no libraries but produces repetitive boilerplate, lacks caching, lacks background refetching, and makes optimistic updates extremely tedious. For a data-intensive application like FOCUS, this approach would result in poor UX (loading spinners on every navigation) and poor performance (duplicate API calls).

---

## ADR-007: Exponential Distribution for ISI

### Status

**Accepted** — 2025-01-28

### Context

FOCUS implements Inter-Stimulus Intervals (ISIs) — the time gaps between consecutive stimuli in cognitive training games. The ISI distribution affects the cognitive load and the training effect. A fixed ISI (e.g., exactly 2 seconds between every stimulus) allows the user to predict the next stimulus, which reduces the attentional demand and makes the game trivially easy. A random ISI from a uniform distribution (e.g., 1–5 seconds uniformly) introduces unpredictability but can produce very short intervals (0.1 seconds apart) that are unplayably fast or very long intervals (4.9 seconds apart) that cause the user to lose focus. The cognitive science literature (Wagenmakers et al., 2004; Balota & Spieler, 1999) shows that ISI distributions used in experimental psychology tasks typically follow an exponential or ex-Gaussian distribution, which produces a natural mix of short, medium, and long intervals with a predictable mean.

### Decision

We will use an **exponential distribution** for ISI generation, parameterized by a mean ISI that varies by difficulty level. The formula is `isi = -mean * ln(1 - Math.random())`, which generates a random variable drawn from an exponential distribution with the specified mean. The mean ISI ranges from 800ms (Easy) to 1500ms (Hard) and is adjusted by the adaptive difficulty algorithm. A minimum ISI floor of 400ms is enforced to prevent unplayably fast sequences, and a maximum ISI cap of 5000ms is enforced to prevent disengagement. The exponential distribution produces approximately 63% of intervals shorter than the mean, 26% between mean and 2×mean, and 11% between 2×mean and 3×mean, creating a natural cadence that keeps the user alert without overwhelming them.

The exponential distribution was chosen because it models the natural arrival process of events in time (a Poisson process), which is the same statistical model used in experimental psychology for stimulus timing. The distribution is memoryless, meaning the probability of the next stimulus arriving in the next 500ms is the same regardless of how long the user has already waited — this prevents the user from predicting the next stimulus based on elapsed time. The exponential distribution also has a long right tail, which occasionally produces longer intervals that give the user a brief cognitive rest, reducing fatigue during extended sessions.

### Consequences

**Positive:** The ISI distribution is scientifically grounded and validated by decades of cognitive psychology research. The exponential distribution is trivial to implement (one line of code) and has no external dependencies. The memoryless property prevents users from predicting stimulus timing, which maintains the attentional demand throughout the session. The long right tail provides natural micro-rests that reduce fatigue. The mean ISI is a single parameter that can be adjusted by the adaptive difficulty algorithm, making the difficulty curve smooth and predictable.

**Negative:** The exponential distribution occasionally produces very short ISIs (e.g., 100ms) when the random draw is close to 0. These rapid-fire stimuli can be disorienting for users with slower reaction times. The distribution also occasionally produces very long ISIs (e.g., 4000ms) that can cause the user to lose attention. The minimum floor (400ms) and maximum cap (5000ms) mitigate these extremes but create truncation artifacts — a small spike of values at the floor and cap boundaries. The distribution is not perfectly symmetrical, which may feel "unfair" to users who expect uniform randomness.

**Mitigation:** The 400ms floor prevents unplayably fast sequences. The 5000ms cap prevents disengagement. We will add a `shuffle buffer` of 3 pre-generated ISIs that are drawn from a reservoir, so the next ISI is selected from a pool rather than generated on-the-fly — this smooths out the extremes while preserving the exponential shape. The adaptive difficulty algorithm will also monitor the user's average reaction time and adjust the mean ISI to ensure that the fastest 10% of ISIs are at least 200ms shorter than the user's average reaction time, preventing the "impossible stimulus" problem.

### Alternatives Considered

**Uniform distribution:** A uniform distribution (e.g., 500ms to 3000ms) is simple and fair, but it does not model natural event timing and allows very short intervals that are cognitively impossible to respond to. Users also learn the bounds quickly ("the next one will be somewhere between 500ms and 3000ms") which reduces the attentional demand.

**Fixed ISI with jitter:** Some implementations use a fixed base ISI (e.g., 2000ms) with random jitter (±500ms). This produces a narrower range of ISIs (1500–2500ms) that is predictable and easy but does not provide the natural event timing of an exponential distribution.

**Log-normal distribution:** A log-normal distribution is another common choice for reaction time modeling. It produces a right-skewed distribution similar to the exponential but with a non-zero mode (most likely value). However, the log-normal has two parameters (mu, sigma) that must be tuned, while the exponential has one parameter (mean), making it simpler to integrate with the adaptive difficulty algorithm.

**Ex-Gaussian distribution:** The ex-Gaussian is the gold standard for modeling reaction times in cognitive psychology. It is a convolution of an exponential and a Gaussian distribution, producing a right-skewed distribution with a Gaussian peak. However, it has three parameters (mu, sigma, tau) that are computationally expensive to fit in real-time and offer marginal benefit over the simpler exponential for our use case.

---

## ADR-008: Offline-First Architecture

### Status

**Accepted** — 2025-02-01

### Context

FOCUS users play cognitive training games in environments with unreliable connectivity: airplanes, subway commutes, rural areas, and buildings with poor cellular coverage. The core value proposition — "5 minutes of focused cognitive training" — must be deliverable without any network connection. Game sessions must be playable offline, scores must be stored locally, and data must sync to the server when connectivity is restored. The offline experience must be seamless: the user should not see error messages, empty states, or degraded functionality when offline. The only feature that explicitly requires connectivity is the live leaderboard (which shows other users' scores in real-time).

### Decision

FOCUS implements an **offline-first architecture** with local data persistence and background synchronization. The local data layer uses Zustand with the `persist` middleware (backed by localStorage on web, AsyncStorage on mobile) for client state and React Query's `persistQueryClient` middleware for server-state caching. Game session data (scores, accuracy, reaction times, completion status) is written to IndexedDB via the `idb` library immediately upon session completion, regardless of connectivity status. A sync engine in `packages/sync` monitors network status via the browser's `navigator.onLine` API and the `online`/`offline` events, and attempts to push unsynced sessions to Supabase when connectivity is restored. The sync engine uses exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s) to avoid hammering the server during intermittent connectivity.

### Consequences

**Positive:** Users can play any game offline without any degradation in gameplay quality. Sessions are persisted locally within 100ms of completion, so even a sudden battery death does not lose data. The background sync engine is invisible to the user — sessions appear in the history and leaderboard as soon as the sync completes. The offline-first approach also improves performance on slow networks, because the app renders from local cache rather than waiting for server responses. The `persistQueryClient` middleware means that React Query's cache survives page reloads, so the app loads instantly from cache and then refetches in the background.

**Negative:** Offline-first adds significant complexity to the data layer. We must handle conflict resolution when the same record is modified offline and online (e.g., a user updates their display name on two devices). The local data store (IndexedDB + localStorage) can grow large if the user plays many sessions without syncing, and must be pruned periodically. The sync engine must be idempotent (replaying the same sync operation must not create duplicate records). Testing the offline-sync cycle requires mocking network conditions, which is harder to do in automated tests.

**Mitigation:** Conflict resolution follows a "last-write-wins" strategy, which is acceptable for our data model (scores, settings, profiles — none of which have conflicting concurrent edits in practice). The local data store is pruned after successful sync — only the most recent 50 sessions are kept locally, and older sessions are fetched from the server on demand. The sync engine generates a unique `syncId` (UUID v4) for each session, and the server rejects duplicates via an `ON CONFLICT` clause. Offline testing is automated in the E2E suite using Playwright's network interception API (`page.route('**', route => route.abort())`) to simulate offline conditions.

### Alternatives Considered

**Online-only with graceful degradation:** The simplest approach is to show a "You're offline" screen when the network is unavailable and queue sessions for later. This is much simpler to implement but provides a terrible user experience — the user cannot use the product in the exact scenario where they most need it (travel, commute).

**PWA with Service Workers:** Service Workers can cache all app assets and API responses for offline use. However, Service Workers have complex lifecycle management (install, activate, update), require careful cache invalidation logic, and do not work reliably on all browsers (especially Safari). We will use Service Workers for asset caching (app shell, JavaScript, CSS, images) but not for data caching — the Zustand persist + IndexedDB approach is more reliable for structured data.

**CRDTs (Conflict-free Replicated Data Types):** CRDTs provide automatic conflict resolution for concurrent edits without requiring a server协调. Libraries like Yjs and Automerge implement CRDTs for collaborative editing. However, CRDTs are overkill for our data model — user profiles and game scores do not have concurrent edits from multiple authors. The complexity of integrating CRDTs is not justified by the marginal benefit.

---

## ADR-009: Monorepo with Turborepo

### Status

**Accepted** — 2025-02-03

### Context

FOCUS consists of multiple applications (web, mobile, desktop) and multiple shared packages (UI components, game engine, individual game modules, analytics, sync). Without a monorepo, each application would have its own `node_modules/` directory, its own build configuration, and its own copy of shared code. This leads to dependency duplication (a 100MB `node_modules/` directory copied 3 times), version drift (app A uses `@focus/ui@1.2.0` while app B uses `@focus/ui@1.3.0`), and coordination overhead (every change to a shared package requires publishing a new version and updating all consumers). The team wants a single repository that contains all code, with fast builds, dependency caching, and clear package boundaries.

### Decision

We will use **Turborepo** as the monorepo build system and task runner. The monorepo root contains a `turbo.json` configuration that defines the task pipeline (`build`, `test`, `lint`, `typecheck`) with dependency ordering (e.g., `build` of `@focus/ui` must complete before `build` of `@focus/web`). Turborepo provides incremental builds (only rebuilds packages that changed), remote caching (via Vercel Remote Cache or self-hosted), and parallel task execution. The workspace structure uses npm workspaces (defined in the root `package.json`) for dependency hoisting and linking.

Turborepo was chosen because it is the fastest JavaScript monorepo tool available (benchmarked against Nx, Lerna, and Rush). It requires minimal configuration — the `turbo.json` pipeline is 15 lines. It does not require a custom monorepo plugin for each tool (unlike Nx, which requires `@nrwl/webpack`, `@nrwl/vite`, etc.). The remote caching feature means that CI builds are fast even for large monorepos, because unchanged packages are restored from cache. Turborepo is maintained by Vercel and has a strong open-source community.

### Consequences

**Positive:** A single `npm install` at the root installs all dependencies for all apps and packages. A single `turbo build` builds everything in the correct order. Dependency hoisting reduces `node_modules/` size by 40–60% compared to independent repositories. Version drift is impossible — all apps consume the same version of `@focus/ui` because it is linked via the workspace. Remote caching reduces CI build times from 15 minutes to 3 minutes for incremental changes. The `turbo run lint` and `turbo run typecheck` commands run across the entire monorepo in parallel.

**Negative:** The initial setup of Turborepo requires understanding the task pipeline, package structure, and workspace linking. New contributors must learn the monorepo conventions (where to put new packages, how to reference local packages, how the build order works). A broken build in one package (e.g., a type error in `@focus/ui`) blocks the build of all downstream apps. The `node_modules/` hoisting can cause phantom dependency issues (a package accidentally resolves a dependency that was hoisted from another package, rather than declaring it explicitly).

**Mitigation:** The monorepo structure is documented in the README and in this chapter (see Chapter 24). Each package has its own `package.json` with explicitly declared dependencies (no reliance on phantom dependencies). The CI pipeline runs `turbo run typecheck lint test build` on every PR, and the Turborepo task graph ensures that type errors in shared packages are caught before they reach application builds. The `--filter` flag in Turborepo allows developers to build only the package they are working on during development (e.g., `turbo run build --filter=@focus/web`).

### Alternatives Considered

**Nx:** Nx is a more feature-rich monorepo tool with code generators, affected analysis, and dependency graph visualization. However, it requires Nx-specific plugins for each build tool (Vite, Jest, etc.), has a steeper learning curve, and generates more configuration files. For a team that values simplicity and speed over generative scaffolding, Turborepo is the better fit.

**Lerna:** Lerna was the original JavaScript monorepo tool but is now in maintenance mode. It does not provide task parallelization, remote caching, or incremental builds. Nx has taken over Lerna's role.

**Independent repositories (polyrepo):** Each app and package in its own Git repository with published npm packages. This avoids the complexity of monorepo tooling but introduces version management overhead, makes cross-package refactoring difficult (requires coordinated PRs across repos), and slows down CI (each repo must install its own dependencies from scratch).

**pnpm workspaces:** pnpm's workspace feature is an alternative to npm workspaces with stricter dependency hoisting (using symlinks). We evaluated pnpm but chose npm for broader ecosystem compatibility and simpler CI configuration. pnpm may be adopted later if dependency hoisting issues become problematic.

---

## ADR-010: Freemium Business Model

### Status

**Accepted** — 2025-02-05

### Context

FOCUS is a cognitive training tool that must balance accessibility (reaching the widest possible audience) with sustainability (generating revenue to fund ongoing development). The target audience includes students (budget-constrained), professionals (willing to pay for productivity tools), and enterprise clients (willing to pay per-seat for team wellness). The competitive landscape includes free apps (Lumosity's free tier, Peak's free tier) and premium apps (Lumosity Premium at $11.99/month, BrainHQ at $14/month). The team needs a business model that allows free users to experience enough value to become advocates, while providing compelling reasons for power users and organizations to pay.

### Decision

FOCUS uses a **freemium business model** with three tiers: **Free**, **Pro**, and **Enterprise**.

**Free tier** includes: access to 3 of the 10 core games (Rotate, Reverse, and one rotating "game of the week"), basic progress tracking (last 7 days), a single daily focus session, and no leaderboards. The free tier is designed to be genuinely useful — not crippled or annoying. A user who plays the 3 free games daily will see real cognitive improvement, which builds trust and word-of-mouth. The free tier has no ads, no data selling, and no dark patterns. The cap of 3 games creates natural curiosity about the other 7 games, which is the primary conversion lever.

**Pro tier** at $7.99/month or $59.99/year includes: all 10 games, unlimited daily sessions, detailed analytics (reaction time trends, accuracy heatmaps, cognitive profile), full leaderboard access, custom session lengths, offline mode with sync, priority support, and early access to new games. The annual plan represents a 37% discount, incentivizing yearly commitment. The Pro tier is positioned as a premium productivity tool, not a luxury add-on — the analytics alone justify the price for users who are serious about cognitive training.

**Enterprise tier** at $12/user/month (minimum 10 seats) includes: everything in Pro, admin dashboard with team analytics, SSO integration (SAML/OIDC), SCIM user provisioning, compliance reports (SOC 2, GDPR), dedicated account manager, and custom branding. The Enterprise tier is positioned as a corporate wellness benefit, comparable to gym membership subsidies or meditation app subscriptions (Headspace for Work, Calm for Business).

### Consequences

**Positive:** The free tier provides a risk-free entry point that drives organic acquisition. The 3-game cap creates a natural upgrade funnel without being punitive. The Pro price point ($7.99/month) is competitive with other productivity tools (Notion at $10/month, Todoist at $5/month) and below the "impulse purchase" threshold for most professionals. The Enterprise tier provides a high-margin revenue stream with lower churn (annual contracts, SSO lock-in, team adoption). The no-ads, no-data-selling stance differentiates FOCUS from "free" apps that monetize user data, which aligns with the brand's trustworthiness.

**Negative:** The free tier costs us money to serve (Supabase free tier limits, CDN bandwidth, support). If the free-to-paid conversion rate is below 3%, the free tier becomes a net financial loss. The 3-game cap may be too restrictive for some users to experience enough value to convert. The Enterprise sales cycle is long (3–6 months) and requires sales staff that the team cannot hire until revenue justifies it. The annual plan discount (37%) reduces effective monthly revenue from committed users.

**Mitigation:** The Supabase free tier supports up to 50,000 monthly active users, which is sufficient for the first year. CDN costs are minimal for static assets (the app is a SPA with no server-rendered pages). The 3-game selection rotates weekly, ensuring free users always have something new to try. We will A/B test the game cap (3 vs. 5 games) to find the optimal conversion point. The Enterprise tier will initially be sold via self-serve (Stripe billing portal) rather than requiring a sales team, with human sales support added once the pipeline justifies it. The annual plan discount will be reviewed quarterly based on churn data.

### Alternatives Considered

**Subscription-only (no free tier):** A subscription-only model (e.g., $7.99/month, no free option) maximizes per-user revenue but eliminates the organic acquisition funnel. For a new product with no brand recognition, requiring payment before the first use creates a high barrier to entry. The conversion rate from "landing page visit" to "paid subscriber" would be 1–2%, compared to 5–8% with a free tier.

**One-time purchase:** A one-time purchase model (e.g., $29.99 for lifetime access) is appealing to users but does not provide recurring revenue. Cognitive training requires ongoing content updates (new games, new difficulty levels), and a one-time purchase model does not fund ongoing development. The lifetime value of a one-time purchaser is $29.99, compared to $95.88/year for an annual subscriber.

**Ad-supported free tier:** Displaying ads in the free tier would offset serving costs but would damage the brand. FOCUS is a focus and wellness tool — showing interruptive ads during a focus session is antithetical to the product's purpose. Ad-supported "free" apps also have perverse incentives to degrade the free experience to drive ad impressions, which we want to avoid.

**Donation/tip jar:** Some open-source projects use a donation model (e.g., "if you find this useful, buy me a coffee"). This works for individual developers but does not scale to a team. The conversion rate for donation models is typically 0.1–1%, which is insufficient to fund a 3–5 person engineering team.
