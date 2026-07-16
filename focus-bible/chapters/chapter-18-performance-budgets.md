# Chapter 18: Performance Budgets

## 18.1 Performance Philosophy

Speed is not a luxury. Speed is a feature. Every millisecond that a user waits is a millisecond where their attention drifts, their frustration climbs, and their likelihood of returning drops. In the FOCUS platform, where cognitive load management is the entire product proposition, delivering a sluggish experience is not merely a technical failure — it is a fundamental betrayal of the product's promise. A tool that claims to help people focus cannot itself be a source of distraction, friction, or impatience.

Performance is not something we bolt on after shipping. It is not a line item in a backlog that gets prioritized "when things calm down." Performance is a first-class citizen in every design decision, every architecture review, every pull request, and every deployment. It is measured continuously, enforced automatically, and discussed explicitly in every sprint retrospective. When a feature conflicts with a performance budget, the feature loses. Always. Without exception.

This chapter establishes the concrete, measurable, enforceable performance budgets that govern the FOCUS platform across web, mobile, and desktop. These budgets are not aspirational guidelines or soft recommendations. They are hard limits enforced in CI. Code that violates these budgets does not ship. Period.

The philosophy rests on three pillars:

**Measure Everything.** You cannot improve what you do not measure. Every page load, every interaction, every API call, every animation frame is instrumented. We use synthetic monitoring (Lighthouse, WebPageTest) for controlled measurements and real-user monitoring (RUM) for production reality. The gap between synthetic and RUM data is where the most important insights live.

**Budget Everything.** Every resource, every pixel, every millisecond has a budget. Bundles have size budgets. Pages have load time budgets. Animations have frame budgets. APIs have latency budgets. Memory has allocation budgets. These budgets are derived from user experience targets, not from what "seems fast" or "what the framework allows." We start from the user's tolerance and work backward to the technical constraint.

**Enforce Automatically.** Budgets that exist only in documentation are suggestions. Budgets enforced in CI are engineering constraints. Every build measures every budget. Every pull request is evaluated against every budget. Violations block merges. No human override without explicit, documented, time-limited exception approval from the tech lead.

---

## 18.2 Web Performance Budgets

### 18.2.1 Bundle Size Budgets

Bundle size directly impacts load time, parse time, and execution time. A smaller bundle means the user sees content faster, interacts sooner, and consumes less battery. The following budgets apply to the FOCUS web application:

| Resource | Budget (Gzipped) | Rationale |
|---|---|---|
| **Total JavaScript** | < 200 KB | Ensures total parse + compile time under 200ms on mid-range mobile devices. At ~100KB/s gzip decompression on a 3G connection, this keeps initial JS transfer under 2 seconds on slow networks. |
| **Total CSS** | < 50 KB | CSS is render-blocking. 50KB gzipped ensures the browser can parse and apply styles before the first paint, keeping the critical rendering path short. |
| **Images (initial load)** | < 500 KB | The initial viewport images (hero, logos, above-the-fold content) must stay under 500KB total to prevent LCP delays on mobile. |
| **Fonts** | < 100 KB | Font files are large and can cause FOIT (Flash of Invisible Text). We limit to two weights of our primary typeface (Inter Regular, Inter Bold) at ~50KB each, subset to Latin characters only. |
| **Per-route chunk** | < 50 KB | Any single route's lazy-loaded chunk must not exceed 50KB gzipped. This ensures route transitions feel instant even on slow connections. |
| **Per-game module** | < 100 KB | Each focus game (Stroop, N-back, breath pacer, etc.) is a lazy-loaded module. At 100KB gzipped, games load in under 1 second on 3G. |

These budgets are enforced using `size-limit` in CI. The configuration lives in `.size-limit.json` at the repository root:

```json
[
  {
    "path": "dist/assets/js/*.js",
    "gzip": true,
    "limit": "200 KB",
    "name": "Total JS (gzipped)"
  },
  {
    "path": "dist/assets/css/*.css",
    "gzip": true,
    "limit": "50 KB",
    "name": "Total CSS (gzipped)"
  },
  {
    "path": "dist/assets/images/initial/**/*",
    "limit": "500 KB",
    "name": "Initial images"
  },
  {
    "path": "dist/assets/fonts/**/*",
    "limit": "100 KB",
    "name": "Fonts"
  }
]
```

Every pull request triggers a size-limit check. If any budget is exceeded by more than 5%, the check fails and the PR cannot be merged. If the budget is exceeded by more than 10%, the CI pipeline fails hard and the tech lead is notified via Slack. The 10% threshold represents a catastrophic regression that demands immediate attention.

### 18.2.2 Core Web Vitals Budgets

Core Web Vitals are Google's standardized metrics for measuring real-user experience quality. They are not arbitrary — they represent thresholds below which user engagement drops measurably. Our budgets are more aggressive than Google's "good" thresholds because we believe "good enough" is not good enough.

| Metric | Target | Maximum | Google "Good" | Rationale |
|---|---|---|---|---|
| **Largest Contentful Paint (LCP)** | < 1.5s | 2.5s | < 2.5s | LCP measures when the largest visible element renders. Our target of 1.5s ensures the user sees meaningful content almost immediately, even on 4G connections. The 2.5s maximum is the hard ceiling — anything beyond this is a failed deployment. |
| **First Input Delay (FID)** | < 50ms | 100ms | < 100ms | FID measures responsiveness to the user's first interaction. At < 50ms, interactions feel instantaneous. We target 50ms to leave headroom for the JavaScript execution that follows. |
| **Cumulative Layout Shift (CLS)** | < 0.05 | 0.1 | < 0.1 | CLS measures visual stability. A score of 0.05 means the page is virtually motionless after initial load. This is critical for a focus tool — layout shifts are distractions. |
| **Interaction to Next Paint (INP)** | < 100ms | 200ms | < 200ms | INP measures overall responsiveness across all interactions, not just the first. At < 100ms, every tap, click, and keystroke feels immediate. This replaces FID as the primary responsiveness metric. |
| **Time to First Byte (TTFB)** | < 200ms | 500ms | < 800ms | TTFB measures server response time. At < 200ms, the browser receives data almost immediately. We achieve this through edge caching, CDN distribution, and optimized Supabase queries. |

These budgets are measured using Lighthouse CI in the deployment pipeline and Vercel Analytics in production. The Lighthouse CI configuration enforces scores at the page level:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }]
      }
    }
  }
}
```

In production, Vercel Analytics continuously monitors these metrics. An alert fires if any metric's p75 exceeds the maximum threshold for more than 15 minutes. An alert fires immediately if any metric's p95 exceeds the maximum. The on-call engineer is paged for p95 violations.

### 18.2.3 Custom Performance Metrics

Beyond Core Web Vitals, FOCUS tracks custom metrics that are specific to our product's unique interaction patterns:

| Metric | Budget | Description |
|---|---|---|
| **Time to Interactive (TTI)** | < 2.0s | Time from navigation start to when the main thread is quiet and the page is fully interactive. This includes all JavaScript execution, not just rendering. |
| **First Contentful Paint (FCP)** | < 1.2s | Time to first pixel painted on screen. This is the user's first visual feedback that something is happening. |
| **Game Load Time** | < 1.0s | Time from when the user taps "Start Game" to when the game's first frame renders. This is measured from the game module's dynamic import resolution to the first `requestAnimationFrame` callback. |
| **Session Start Time** | < 1.5s | Time from app launch (or tab open) to when the user sees their personalized dashboard with their current streak, next session time, and daily focus score. This includes authentication check, data fetch, and render. |
| **Score Calculation Time** | < 100ms | Time to compute the user's daily focus score from raw session data. This runs on the client and must complete within a single frame to avoid jank. |
| **Sync Duration** | < 500ms | Time to complete a full offline-to-online data sync after reconnection. This includes conflict resolution, database writes, and confirmation. The user should never perceive a sync delay. |
| **Route Transition Time** | < 200ms | Time between the user initiating a navigation and the new route's content being visible and interactive. All routes are lazy-loaded; this budget ensures transitions feel instantaneous. |
| **API Response Time (p95)** | < 300ms | 95th percentile API response time measured at the client. This includes network latency, server processing, and response transfer. We achieve this through Supabase edge functions, query optimization, and aggressive caching. |

These custom metrics are collected using the Performance API (`performance.mark()`, `performance.measure()`) and sent to our metrics pipeline. The pipeline aggregates data and feeds dashboards in Grafana. Engineers can see these metrics broken down by device class, network type, geographic region, and app version.

---

## 18.3 Runtime Performance Budgets

Load time is only the beginning. Runtime performance determines whether the user's experience remains smooth throughout their session. A focus session might last 25 minutes — if the app stutters, janks, or drains battery during that window, the session is ruined.

### 18.3.1 Frame Rate and Animation Budgets

| Metric | Budget | Enforcement |
|---|---|---|
| **Frame rate during gameplay** | 60 fps (minimum 55 fps) | Every game module must maintain 60fps on the reference device (iPhone 12 / Pixel 6 / equivalent). During gameplay, frames dropping below 55fps for more than 3 consecutive frames triggers a performance warning in development mode. In CI, game modules are tested using automated frame rate measurement with Puppeteer's `Performance` tracing. |
| **Main thread blocking** | < 50ms per task | No single JavaScript task may block the main thread for more than 50ms. Long tasks (> 50ms) are detected using the `PerformanceObserver` API with the `longtask` entry type. In development, long tasks log warnings with stack traces. In CI, the performance test suite fails if any task exceeds 50ms during the automated user journey. |
| **Animation jank** | 0 janky frames per second | CSS animations and transitions must not cause layout thrashing. All animations use `transform` and `opacity` exclusively — properties that can be composited on the GPU without triggering layout or paint. `will-change` hints are applied to animated elements. |
| **Scroll performance** | 60fps continuous | Scroll handlers must not cause frame drops. No `scroll` event listeners are attached to `window` or `document`. Scroll-linked animations use `IntersectionObserver` or CSS scroll-driven animations. |

### 18.3.2 Memory Budgets

Memory leaks are silent killers. A session that starts fast can degrade over time if memory is not managed carefully. These budgets prevent memory-related degradation:

| Context | Budget | Rationale |
|---|---|---|
| **Mobile memory** | < 150 MB heap | Mobile browsers have aggressive tab-killing thresholds. Keeping heap under 150MB ensures our tab survives in the background during a focus session when the user briefly switches to another app. |
| **Desktop memory** | < 300 MB heap | Desktop has more headroom but memory leaks are still problematic. 300MB keeps the app lightweight compared to Electron-based competitors which routinely consume 500MB+. |
| **DOM nodes** | < 1,500 nodes | Large DOM trees slow down style recalculation, layout, and paint. We keep the DOM lean by virtualizing lists, detaching off-screen elements, and avoiding deep nesting. |
| **Event listeners** | < 100 active listeners | Event listeners that are not cleaned up cause memory leaks and phantom event handling. Components must remove all listeners they attach in their `useEffect` cleanup. |
| **WebSocket connections** | < 3 concurrent | Each WebSocket connection maintains a TCP socket and associated buffers. We use a single multiplexed connection for real-time features and a separate connection for presence/status. |

Memory budgets are enforced through:
1. **Automated memory profiling** in CI using Puppeteer's `Performance` and `HeapProfiler` APIs. The test suite launches the app, runs through critical user journeys, forces garbage collection, and asserts heap size.
2. **Development mode warnings** using a custom React hook (`useMemoryMonitor`) that logs heap size changes and warns when approaching budget limits.
3. **Production monitoring** using Sentry's memory tracking, which reports heap usage trends per session.

### 18.3.3 Mobile-Specific Budgets

Mobile devices impose constraints that desktop does not. Battery life, thermal throttling, limited memory, and slow networks are daily realities for our users:

| Constraint | Budget | Details |
|---|---|---|
| **App download size (iOS)** | < 50 MB | Apple's App Store cellular download limit is 200MB, but we target 50MB to minimize download friction. This includes the Capacitor shell, all assets, and the web bundle. |
| **App download size (Android)** | < 30 MB | Google Play's auto-install threshold is 150MB. We target 30MB to ensure quick installation on limited data plans. APK size directly correlates with install conversion rate. |
| **Cold start time** | < 2.0s | Time from app icon tap to interactive first screen on a mid-range device (2GB RAM, eMMC storage). This includes native shell initialization, web view creation, JavaScript boot, and initial data fetch. |
| **Memory usage** | < 200 MB | Mobile memory budget is tighter than desktop. 200MB keeps us well below Android's low-memory killer thresholds. |
| **Battery consumption** | < 5% per hour | A 25-minute focus session should consume less than 2% battery. We achieve this by minimizing GPS usage, batching network requests, reducing wake locks, and using efficient timers. |
| **Network requests** | < 5 per minute (idle) | Background network activity drains battery. When the app is in the background or idle, we batch non-critical requests and use exponential backoff for retries. |

### 18.3.4 Desktop-Specific Budgets

Desktop users expect snappy, native-feeling performance. Tauri gives us native performance advantages, but we still enforce budgets:

| Constraint | Budget | Details |
|---|---|---|
| **App download size** | < 100 MB | Desktop users have more bandwidth, but large downloads still deter adoption. 100MB includes the Tauri binary, web assets, and bundled dependencies. |
| **Cold start time** | < 1.0s (SSD) | Desktop apps should feel instant. On an SSD-equipped machine, the app must be interactive within 1 second of launch. |
| **Memory usage** | < 300 MB | Desktop has more RAM, but we compete with dozens of open tabs and applications. 300MB keeps us lightweight. |
| **Disk I/O** | < 10ms per read/write | Local database operations (SQLite via Tauri) must complete within 10ms to avoid perceptible delays during interactions. |
| **CPU usage (idle)** | < 1% | When the app is idle (no active focus session, no timers running), CPU usage must be negligible. No polling loops, no unnecessary animations, no background processing. |

---

## 18.4 Performance Monitoring Stack

Performance budgets are meaningless without measurement. The FOCUS monitoring stack provides three layers of visibility:

### 18.4.1 Synthetic Monitoring

**Lighthouse CI** runs on every deployment. It tests the five critical pages (dashboard, focus session, stats, settings, game selection) on simulated mobile (Moto G Power, 4G) and desktop (Chrome, cable) connections. Lighthouse scores below 90 block deployment. Lighthouse scores below 75 trigger an immediate rollback.

**WebPageTest** runs nightly against the production URL. It provides waterfall analysis, speed index, and comparison against competitor benchmarks. Results are posted to a Grafana dashboard with 90-day historical trend lines.

### 18.4.2 Real User Monitoring (RUM)

**Vercel Analytics** provides Core Web Vitals data from real users. It automatically segments by:
- Device class (low-end, mid-range, high-end)
- Network type (slow 2G, 3G, 4G, WiFi)
- Geographic region (NA, EU, APAC, LATAM)
- Browser (Chrome, Safari, Firefox, Edge)
- App version (current, N-1, N-2)

**Sentry Performance** captures individual transactions with full trace context. When a slow transaction is detected (LCP > 2.5s, or any custom metric exceeding budget), Sentry automatically captures:
- Full DOM snapshot
- Network waterfall
- JavaScript execution timeline
- Memory allocation timeline
- User interaction timeline

This data is available within seconds of the event occurring, enabling rapid diagnosis without reproducing the issue locally.

### 18.4.3 Custom Metrics Pipeline

For metrics that neither Lighthouse nor Vercel Analytics capture (game load time, score calculation time, sync duration), we use a custom pipeline:

1. **Collection**: The app uses `performance.mark()` and `performance.measure()` to instrument critical paths. A background worker (`PerformanceObserver` with `measure` type) collects these measurements.
2. **Aggregation**: Measurements are batched (10 at a time or every 30 seconds, whichever comes first) and sent to a Supabase edge function.
3. **Storage**: The edge function writes to a TimescaleDB time-series table, partitioned by metric name, device class, and app version.
4. **Visualization**: Grafana dashboards display real-time and historical metric trends. Alerting rules fire Slack notifications when budgets are breached.
5. **Analysis**: Weekly automated reports compare the current week's metrics against the previous week's, flagging regressions and improvements for each metric by device class and region.

---

## 18.5 CI Enforcement

Performance budgets are enforced through a multi-stage CI pipeline. No code reaches production without passing every performance gate.

### 18.5.1 Pull Request Checks

When a pull request is opened, the CI pipeline runs:

1. **Bundle Analysis**: `size-limit` measures the total bundle size and per-chunk sizes. The PR is annotated with a size change report showing the delta from the base branch.

2. **Lighthouse CI**: Lighthouse runs against the preview deployment (Vercel automatically deploys preview builds for PRs). Scores are compared against the base branch. A score regression of more than 5 points fails the check.

3. **Performance Test Suite**: Playwright runs a set of automated user journeys that exercise critical paths (start focus session, complete a game, view stats, toggle settings). Each journey is measured for:
   - Total duration
   - Frame rate (using `PerformanceObserver` for `longtask` entries)
   - Memory delta (heap before vs. after)
   - Network requests (count and total size)

4. **Bundle Composition Check**: The CI verifies that:
   - No duplicate dependencies exist (using `webpack-bundle-analyzer` output)
   - No new large dependencies were introduced without explicit approval
   - Tree-shaking is effective (no dead code exceeding 1KB per module)

### 18.5.2 Deployment Checks

Before a production deployment proceeds, the pipeline runs additional checks:

1. **Full Lighthouse Audit**: Lighthouse runs against the production-like environment with all optimizations enabled (Brotli compression, HTTP/2 push, CDN caching). The performance score must be ≥ 90.

2. **Load Test**: k6 runs a 5-minute load test simulating 500 concurrent users performing focus sessions. API response times must remain under 500ms at p95. Error rate must remain below 0.1%.

3. **Mobile Device Test**: The preview build is installed and tested on two physical devices (one iOS, one Android) connected to a CI device farm. Cold start time, memory usage, and battery drain are measured and compared against budgets.

### 18.5.3 Post-Deployment Monitoring

After deployment, the pipeline enters a monitoring phase:

1. **Smoke Test**: Automated tests run against the production URL within 5 minutes of deployment, verifying that critical paths work and performance metrics are within budgets.

2. **Canary Release**: The first 10% of traffic is routed to the new version for 30 minutes. Vercel Analytics monitors Core Web Vitals for the canary group. If any metric regresses by more than 10% compared to the stable version, automatic rollback triggers.

3. **Full Rollout**: After the canary period, traffic gradually increases to 100% over 2 hours. Continuous monitoring persists for 24 hours post-deployment.

### 18.5.4 Exception Handling

Performance budget violations block shipping. However, there are legitimate cases where a temporary exception is warranted:

1. **Exception Request**: The engineer opens a Performance Exception Request (PER) documenting:
   - Which budget is violated
   - By how much
   - Why the violation is necessary (e.g., new feature with unique requirements)
   - Mitigation plan (how and when the violation will be resolved)
   - Expiration date (maximum 2 weeks)

2. **Approval**: The tech lead must approve the PER. The approval is recorded in the PR description and linked to a tracking issue.

3. **Tracking**: PERs are tracked in a dedicated GitHub issue label (`performance-exception`). A weekly report lists all open PERs and their status. Expired PERs that have not been resolved trigger a P1 incident.

---

## 18.6 Device Testing Matrix

Performance varies dramatically across devices. A feature that runs at 60fps on an iPhone 15 may stutter on a 3-year-old Android phone. The FOCUS device testing matrix ensures we deliver acceptable performance across the device landscape our users actually use:

### 18.6.1 Reference Devices

| Tier | iOS | Android | Desktop |
|---|---|---|---|
| **High-end** | iPhone 15 Pro | Pixel 8 Pro | MacBook Pro M3 / MacBook Air M2 |
| **Mid-range** | iPhone 12 | Samsung Galaxy A54 | ThinkPad X1 Carbon (i5, 16GB, SSD) |
| **Low-end** | iPhone SE 3rd Gen | Samsung Galaxy A14 | Chromebook (Celeron, 4GB, eMMC) |
| **Budget** | iPad 10th Gen | Xiaomi Redmi 12 | Dell Inspiron 15 (i3, 8GB, HDD) |

### 18.6.2 Testing Protocol

- **Every PR**: Automated tests run on the mid-range Android emulator and mid-range iOS simulator.
- **Weekly**: Manual testing on high-end and low-end physical devices. Testers follow a checklist that exercises every major feature and records frame rates, load times, and memory usage.
- **Monthly**: Battery drain test. The app runs a 25-minute focus session, followed by 30 minutes of background idle. Total battery consumption is measured and compared against the 5%/hour budget.
- **Per Release**: Full regression testing on all four tiers. Results are documented in a Performance Regression Report attached to the release.

### 18.6.3 Performance by Network Condition

Network conditions vary widely. The FOCUS app must perform gracefully across:

| Network | Bandwidth | Latency | Budget Adjustments |
|---|---|---|---|
| **WiFi** | 50+ Mbps | < 20ms | Full experience, all features enabled |
| **4G** | 10-50 Mbps | 20-50ms | Full experience, images use modern formats |
| **3G** | 1-5 Mbps | 100-300ms | Aggressive caching, reduced image quality, preloaded critical resources |
| **Slow 2G** | 50-200 Kbps | 300-1000ms | Text-only mode, minimal assets, offline-first with background sync |
| **Offline** | 0 | 0 | Full offline experience via service worker cache and local database |

Network throttling is applied during testing using Chrome DevTools Protocol (via Playwright) and Charles Proxy (for manual testing). The app detects network conditions using `navigator.connection` and adjusts its behavior accordingly.

---

## 18.7 Performance Optimization Techniques

The following techniques are employed throughout the FOCUS codebase to meet the budgets defined in this chapter. They are not optional — they are the expected baseline for all development.

### 18.7.1 Code Splitting and Lazy Loading

The application is split at the route level. Each route is a separate chunk loaded on demand. Within routes, additional splitting occurs at the component level for components that are not needed immediately:

- **Route splitting**: React Router's `lazy()` wraps every route component. The initial bundle contains only the shell, authentication, and dashboard. All other routes load on demand.
- **Component splitting**: Heavy components (charts, game canvases, data tables) are wrapped in `React.lazy()` with a `Suspense` boundary that shows a skeleton loader.
- **Library splitting**: Large libraries (date formatting, charting, PDF generation) are dynamically imported only when needed. A date picker does not load `date-fns` until the user opens it.

### 18.7.2 Tree Shaking

All dependencies are ES module-compatible. CommonJS dependencies are avoided or wrapped. The build configuration (Vite) enables aggressive tree shaking:

- Only imported functions are included in the bundle
- Side effects are annotated in `package.json` of each dependency
- Dead code elimination runs after tree shaking to remove unreachable code paths

### 18.7.3 Dynamic Imports

Dynamic imports are used not only for code splitting but also for conditional loading:

- **Feature detection**: Game modules are loaded only if the device meets minimum performance requirements (detected via a `navigator.hardwareConcurrency` check and a frame rate benchmark that runs on first visit).
- **User preference**: Accessibility features (high contrast mode, reduced motion, screen reader optimizations) load their additional CSS/JS only when the user enables them.
- **A/B experiments**: Experiment variants are loaded dynamically, ensuring that users in the control group never download experiment code.

### 18.7.4 Image Optimization

Images are the most common cause of performance budget violations. The FOCUS image pipeline ensures every image is optimized:

- **Format**: All images are served as WebP with AVIF fallback. The `<picture>` element selects the best format supported by the browser.
- **Responsive sizing**: Every image has `srcset` with 1x, 2x, and 3x variants. The browser downloads only the resolution it needs.
- **Lazy loading**: All images below the fold use `loading="lazy"`. Above-the-fold images use `fetchpriority="high"`.
- **Placeholder**: Every image has a tiny (20-byte) blurred placeholder encoded as a data URI. The placeholder is visible while the full image loads, preventing layout shifts.
- **Compression**: Images are compressed to quality level 80 (visually lossless) using Sharp in the build pipeline. The build pipeline also strips EXIF data and metadata.
- **CDN**: Images are served from a CDN (Vercel Image Optimization) with aggressive caching headers (`Cache-Control: public, max-age=31536000, immutable` for static assets, `stale-while-revalidate` for dynamic).

### 18.7.5 Font Optimization

Web fonts are a common cause of layout shifts and render-blocking:

- **Subsetting**: Inter is subset to include only Latin characters (and common punctuation), reducing the font file from 300KB to ~50KB per weight.
- **Preloading**: The two critical font files are preloaded with `<link rel="preload" as="font" crossorigin>`.
- **Display swap**: `font-display: swap` ensures text is visible immediately using a fallback font, then swaps to Inter once loaded.
- **System font fallback**: The CSS font stack includes system fonts as fallbacks. If fonts fail to load, the experience degrades gracefully.
- **Font loading strategy**: Fonts are loaded using the `Font Loading API` (`document.fonts.ready`) to prevent FOIT. A loading class on `<body>` controls visibility.

### 18.7.6 Service Worker and Caching

The service worker (Workbox-based) implements a multi-layer caching strategy:

- **Cache-first for static assets**: JS, CSS, images, and fonts are cached on first load and served from cache on subsequent loads. Cache entries are versioned and stale entries are cleaned up on activation.
- **Network-first for API data**: API responses are fetched from the network first. If the network fails, cached data is served with a staleness indicator. This enables the offline-first experience.
- **Stale-while-revalidate for semi-static data**: User profile, preferences, and settings are served from cache immediately while a background network request updates the cache.
- **Precaching for critical routes**: The service worker precaches the shells of the three most-used routes (dashboard, focus session, stats) during the idle period after initial load.

### 18.7.7 Compression and Delivery

- **Brotli compression**: All text-based assets (JS, CSS, HTML, SVG, JSON) are pre-compressed with Brotli at quality level 11 during the build. Brotli achieves 15-25% better compression than gzip for JavaScript.
- **HTTP/2 server push**: Critical CSS and the main JS chunk are pushed with the HTML response, eliminating additional round trips.
- **CDN distribution**: All static assets are served from Vercel's global CDN with edge caching. Assets are replicated to 30+ edge locations worldwide. Cache hit ratios target > 95% for static assets.
- **Cache headers**: Static assets use `immutable` cache headers with long max-age. HTML documents use `no-cache` to ensure users always get the latest version.

### 18.7.8 Rendering Optimization

- **Virtualization**: Lists with more than 20 items use `@tanstack/react-virtual` for virtual scrolling. Only visible items (plus a small overscan buffer) are rendered in the DOM.
- **Memoization**: Components that receive expensive computations memoize results using `useMemo`. Components that receive stable callbacks use `useCallback`. Components that render expensive subtrees use `React.memo` with custom comparison functions.
- **Concurrent features**: React 18's concurrent features (`useTransition`, `useDeferredValue`) are used to keep the UI responsive during non-urgent updates. Score calculations and data processing are wrapped in `useTransition` to avoid blocking user interactions.
- **Web Workers**: Heavy computations (data aggregation, chart data preparation, game AI calculations) are offloaded to Web Workers to keep the main thread clear for rendering and user input handling.

### 18.7.9 Network Optimization

- **Request batching**: Multiple small API requests are batched into a single request using Supabase's RPC functions. This reduces the number of HTTP round trips and associated overhead.
- **Prefetching**: Routes the user is likely to visit next (based on usage patterns) are prefetched during idle time. The dashboard prefetches the stats route; the stats route prefetches the settings route.
- **Connection pooling**: Supabase connections are reused across requests within a session, avoiding the overhead of establishing new connections.
- **Retry with backoff**: Failed network requests retry with exponential backoff (1s, 2s, 4s, 8s, max 3 retries) to avoid overwhelming the server during outages.

---

## 18.8 Performance Culture

Budgets and tools are necessary but not sufficient. A genuine performance culture requires:

1. **Performance reviews**: Every PR review includes a performance checklist. Reviewers check for unnecessary re-renders, missing memoization, large dependency additions, and potential memory leaks.

2. **Performance budget in sprint planning**: When estimating stories, engineers include a performance impact assessment. Stories that may impact performance budgets include a performance acceptance criterion.

3. **Monthly performance reports**: A monthly report is generated showing trends for all metrics. The report is reviewed in the engineering all-hands. Regressions are discussed and improvement opportunities are identified.

4. **Performance bounties**: Engineers who identify and fix significant performance issues (improving a metric by > 15% or resolving a long-standing budget violation) receive recognition in the team channel.

5. **Performance budgets as code**: All budgets are defined in code, not in documentation. They are version-controlled, peer-reviewed, and change only through the standard PR process. This ensures budgets evolve intentionally, not accidentally.

---

## 18.9 Summary

Performance budgets are the engineering constraints that ensure the FOCUS platform delivers on its promise of being a fast, reliable, distraction-free tool. Every budget in this chapter is derived from a user experience target, enforced automatically in CI, and monitored continuously in production. Code that violates these budgets does not ship. This is not a suggestion — it is an engineering invariant.
