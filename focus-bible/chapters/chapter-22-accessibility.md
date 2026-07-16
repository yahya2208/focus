# Chapter 22: Accessibility

## Overview

Accessibility is not a feature — it is a foundational requirement. FOCUS is a cognitive training tool that serves users with a wide range of abilities, including those with visual impairments, motor disabilities, cognitive disabilities, and situational impairments (bright sunlight, noisy environments, one-handed use). Every design decision, every component implementation, and every test must consider accessibility from the start, not as an afterthought bolted on before launch. This chapter defines the accessibility standards, practices, testing protocols, and specific implementations that make FOCUS compliant with WCAG 2.1 AA and targeting AAA where feasible.

---

## 22.1 WCAG 2.1 Compliance Strategy

### Target Level: AA (Mandatory), AAA (Aspirational)

FOCUS targets full compliance with **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** across all platforms (web, mobile, desktop). Where feasible without compromising usability, we target **Level AAA** compliance. The rationale for targeting AA as the mandatory baseline is that AA is the legal standard required by Section 508 (US), EN 301 549 (EU), and the Americans with Disabilities Act (ADA). AAA is aspirational because some AAA criteria (e.g., 9:1 contrast ratio for AAA text) are difficult to achieve with a dark theme without sacrificing aesthetic quality.

### WCAG 2.1 Principle Mapping

Every feature in FOCUS maps to the four WCAG principles (POUR):

| Principle | FOCUS Implementation |
|-----------|---------------------|
| **Perceivable** | All information and UI components are presentable to users in ways they can perceive. Text alternatives for game elements, sufficient contrast ratios, content adaptable to different presentations (responsive design), content distinguishable (no color-only information). |
| **Operable** | All UI components and navigation are operable via keyboard, touch, and assistive technology. No time limits that cannot be extended, no content that flashes more than 3 times per second, navigation mechanisms that can be bypassed, focus order that is logical and predictable. |
| **Understandable** | Information and the operation of the user interface are understandable. Text is readable, pages appear and operate in predictable ways, input assistance prevents and corrects errors, help and documentation are available. |
| **Robust** | Content is robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies. Valid HTML, ARIA used correctly, name/role/value exposed for all custom components, status messages announced via ARIA live regions. |

---

## 22.2 Keyboard Navigation

### Complete Keyboard Operability

Every interactive element in FOCUS must be operable via keyboard alone, with no exceptions. This includes:

- **All buttons and links** (including game controls, navigation, modals, dropdown menus)
- **All form inputs** (settings, profile editing, search)
- **All game elements** (game targets must be reachable and activatable via keyboard)
- **All custom widgets** (tabs, accordions, sliders, tooltips, toast notifications)
- **All modals and dialogs** (focus must be trapped within the modal and returned to the trigger element on close)

### Tab Order

The tab order follows the visual reading order (left-to-right, top-to-bottom in LTR layouts; right-to-left in RTL layouts). The tab order is defined by the DOM order, not by CSS positioning. If visual layout differs from DOM order (e.g., a sidebar that visually appears before the main content but is after it in the DOM), we use CSS `order` and `visual-reordering` rather than `tabindex` manipulation to maintain a logical tab sequence.

### Focus Indicators

Every focusable element has a visible focus indicator that meets the following requirements:

- **Minimum size:** 2px solid outline (WCAG 2.4.7)
- **Contrast:** Focus indicator has a minimum 3:1 contrast ratio against adjacent colors (WCAG 1.4.11)
- **Style:** Consistent across the application — a 2px solid `var(--color-focus-ring)` outline with 2px offset
- **Not suppressed:** `outline: none` is NEVER used without a replacement indicator
- **High contrast mode:** Focus indicators are enhanced in Windows High Contrast Mode using `forced-colors` media query

The focus ring style is defined in a single CSS rule in the global stylesheet:

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: 2px;
}
```

### Skip Navigation

Every page includes a "Skip to main content" link that is the first focusable element in the DOM. It is visually hidden until focused, at which point it becomes visible as a full-width banner at the top of the page. This allows keyboard users to bypass the navigation menu and jump directly to the page content.

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

### Keyboard Shortcuts

FOCUS implements the following global keyboard shortcuts:

| Shortcut | Action | Platform |
|----------|--------|----------|
| `Ctrl/Cmd + K` | Open command palette | All |
| `Ctrl/Cmd + /` | Toggle keyboard shortcuts help | All |
| `Escape` | Close modal/dialog/tooltip | All |
| `Tab` | Move focus forward | All |
| `Shift + Tab` | Move focus backward | All |
| `Enter` / `Space` | Activate button/link | All |
| `Arrow keys` | Navigate within composite widgets | All |
| `Ctrl/Cmd + Shift + M` | Mute/unmute game audio | All |

Game-specific keyboard shortcuts are defined per-game in the game engine configuration. For example, in the Rotate game, arrow keys rotate the element, and Enter confirms the rotation. In the Memory Matrix game, arrow keys navigate the grid, and Space reveals a cell.

### Focus Management

When a route change occurs, focus is moved to the new page's `<h1>` element (or the first heading if no `<h1>` exists). When a modal opens, focus is moved to the first focusable element inside the modal. When the modal closes, focus is returned to the element that triggered the modal. This focus management is implemented via a `useFocusManagement` hook that uses `requestAnimationFrame` to defer focus changes until the DOM has updated.

---

## 22.3 ARIA (Accessible Rich Internet Applications)

### ARIA Roles, States, and Properties

Every custom component in FOCUS is assigned an appropriate ARIA role that conveys its purpose to assistive technologies. The following table maps FOCUS components to their ARIA roles:

| FOCUS Component | ARIA Role | Key ARIA Attributes |
|----------------|-----------|-------------------|
| Navigation sidebar | `role="navigation"` | `aria-label="Main navigation"` |
| Game canvas area | `role="application"` | `aria-label="[Game name] game area"`, `aria-roledescription="interactive game"` |
| Score display | `role="status"` | `aria-live="polite"`, `aria-atomic="true"` |
| Timer | `role="timer"` | `aria-live="off"` (updated silently, announced at milestones) |
| Settings modal | `role="dialog"` | `aria-modal="true"`, `aria-labelledby="settings-title"` |
| Tab group | `role="tablist"` | `aria-label="Settings tabs"` |
| Individual tab | `role="tab"` | `aria-selected="true/false"`, `aria-controls="panel-id"` |
| Tab panel | `role="tabpanel"` | `aria-labelledby="tab-id"` |
| Progress ring | `role="progressbar"` | `aria-valuenow="0-100"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Session progress"` |
| Toast notification | `role="alert"` | `aria-live="assertive"` |
| Toggle switch | `role="switch"` | `aria-checked="true/false"` |
| Slider (difficulty) | `role="slider"` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="Difficulty level"` |
| Tooltip | `role="tooltip"` | `aria-describedby="trigger-id"` |

### Live Regions

FOCUS uses ARIA live regions strategically to announce dynamic content changes without overwhelming screen reader users:

- **`aria-live="polite"`:** Used for score updates, timer milestones (every 30 seconds), and session completion. Announcements are queued and spoken when the user pauses.
- **`aria-live="assertive"`:** Used for error messages, game over notifications, and critical alerts. Announcements interrupt the current speech.
- **`aria-live="off"`:** Used for real-time timer updates and continuous score counters. These values are updated in the DOM but not announced — the user can check them at any time via `Ctrl/Cmd + I` (a custom screen reader shortcut that reads the current timer and score).

### Game Element Accessibility

Game elements (the dots, shapes, and targets in cognitive games) present a unique accessibility challenge because they are typically rendered on a `<canvas>` element, which is opaque to screen readers. FOCUS implements dual rendering:

1. **Visual layer:** The game is rendered on a `<canvas>` element for optimal performance (60fps, GPU-accelerated).
2. **Accessibility layer:** A parallel DOM overlay mirrors the canvas state using positioned `<div>` elements with appropriate ARIA attributes. This overlay is visually hidden (via `aria-hidden="true"` on the visual layer and `sr-only` CSS class on the accessibility layer) but exposed to assistive technologies.

When a game event occurs (e.g., a target appears, a target is hit, a target is missed), the accessibility layer updates its ARIA attributes, which triggers a live region announcement. For example, when a target appears in the Visual Search game, the screen reader announces: "Target appeared at position 3 of 9, color red, size large."

The accessibility layer is generated by the game engine's `renderAccessibilityTree()` function, which is called after every frame render. This function maps canvas coordinates to grid positions (row 1–3, column 1–3 for a 3×3 grid) and emits accessibility events that the overlay consumes.

### Name, Role, Value (WCAG 4.1.2)

Every custom component exposes its name, role, and current state to assistive technologies. The name is provided via `aria-label` or `aria-labelledby`. The role is provided via the `role` attribute or the HTML element's implicit role (e.g., `<button>` has an implicit `button` role). The state is provided via ARIA state attributes (e.g., `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`). This ensures that screen reader users can understand what each component is, what it does, and what state it is in.

---

## 22.4 Screen Reader Support

### Target Screen Readers

FOCUS is tested with the following screen readers:

| Screen Reader | Platform | Browser | Priority |
|--------------|----------|---------|----------|
| VoiceOver | macOS 14+ | Safari | P0 |
| VoiceOver | iOS 17+ | Safari | P0 |
| NVDA | Windows 11 | Chrome | P0 |
| TalkBack | Android 14+ | Chrome | P0 |
| JAWS | Windows 11 | Chrome | P1 |

### Screen Reader Testing Protocol

Every release is tested with all P0 screen readers by following a scripted test suite that covers:

1. **First-run experience:** Onboarding flow, account creation, first game launch
2. **Navigation:** Sidebar navigation, page transitions, back/forward browser buttons
3. **Gameplay:** Starting a game, playing through a session (with accessibility layer), reviewing results
4. **Settings:** Changing settings, verifying persistence, toggling themes
5. **Leaderboard:** Viewing leaderboard, navigating tabs, filtering by time range
6. **Error states:** Submitting invalid input, network error handling, session timeout
7. **Modal dialogs:** Opening/closing modals, focus trapping, returning focus

The test suite is documented in `e2e/accessibility/screen-reader-test-suite.md` and is executed manually before each release. Automated tools (axe-core) catch many issues but cannot verify the screen reader experience end-to-end.

### Announcements Strategy

FOCUS implements a "minimal announcement" strategy to avoid overwhelming screen reader users:

- **Essential announcements:** Game start, game end, score result, level completion, error messages
- **Suppressed announcements:** Timer ticks (updated silently), score increments (updated silently), intermediate game state changes
- **User-controlled:** All announcements can be disabled via the accessibility settings toggle "Reduce announcements"

The announcement queue is managed by an `AnnouncementManager` class that:
1. Deduplicates identical announcements within a 2-second window
2. Prioritizes error messages over informational messages
3. Queues polite announcements and delivers them during natural pauses
4. Cancels queued announcements if the user navigates away from the relevant context

---

## 22.5 Color and Contrast

### Contrast Ratios

FOCUS enforces the following minimum contrast ratios:

| Element | Minimum Ratio | WCAG Criterion | Implementation |
|---------|--------------|----------------|----------------|
| Normal text (<18px) | 4.5:1 | 1.4.3 (AA) | Automated via `axe-core` in CI |
| Large text (≥18px bold or ≥24px) | 3:1 | 1.4.3 (AA) | Automated via `axe-core` in CI |
| UI components & graphics | 3:1 | 1.4.11 (AA) | Automated via `axe-core` in CI |
| Focus indicators | 3:1 | 2.4.7 (AA) | Manual + automated |
| AAA normal text (aspirational) | 7:1 | 1.4.6 (AAA) | Design review |
| AAA large text (aspirational) | 4.5:1 | 1.4.6 (AAA) | Design review |

### Color Palette Contrast Values

The FOCUS dark mode palette is designed with contrast compliance as a first-class constraint:

| Token | Hex | On Background (#0F1117) | On Card (#1A1D27) | Passes AA? | Passes AAA? |
|-------|-----|------------------------|-------------------|------------|-------------|
| `--text-primary` | #E8E9ED | 14.8:1 | 11.2:1 | ✅ | ✅ |
| `--text-secondary` | #9CA0B0 | 7.2:1 | 5.4:1 | ✅ | ✅ (text only) |
| `--text-tertiary` | #6B7084 | 4.1:1 | 3.1:1 | ✅ (AA large) | ❌ |
| `--color-success` | #4ADE80 | 10.3:1 | 7.8:1 | ✅ | ✅ |
| `--color-error` | #F87171 | 5.7:1 | 4.3:1 | ✅ | ❌ |
| `--color-warning` | #FBBF24 | 11.4:1 | 8.6:1 | ✅ | ✅ |
| `--color-info` | #60A5FA | 6.8:1 | 5.1:1 | ✅ | ❌ |
| `--color-focus-ring` | #818CF8 | 5.9:1 | 4.5:1 | ✅ | ✅ (AA large) |

### Color-Only Information

No information in FOCUS is conveyed by color alone. This is enforced by:

1. **Game elements:** Every target has a shape or label in addition to its color. In the Visual Search game, targets are distinguished by both color AND shape (circle, square, triangle). In the Memory Matrix game, cells are distinguished by color AND position (row/column labels available on hover/focus).

2. **Error/success states:** Error messages include an icon (⚠️ or ✅) and descriptive text, not just a color change. Form validation errors appear as text below the input, not just a red border.

3. **Charts and graphs:** All data visualizations use patterns (hatching, dots, stripes) in addition to color. The analytics dashboard includes a data table alternative for every chart, accessible via a "View as table" toggle.

4. **Status indicators:** Online/offline status, sync status, and connection status use both color and text labels (e.g., "Connected ✓" instead of just a green dot).

### Color Vision Deficiency

FOCUS is tested with simulated color vision deficiencies using the `axe-core` plugin `@axe-core/puppeteer` with color blindness simulation. The following deficiencies are tested:

- **Protanopia** (red-blind): 1.3% of males
- **Deuteranopia** (green-blind): 1.2% of males
- **Tritanopia** (blue-blind): 0.01% of population
- **Achromatopsia** (total color blindness): 0.003% of population

The dark mode palette was specifically designed to be distinguishable under deuteranopia simulation, which is the most common color vision deficiency. The `--color-success` (#4ADE80 green) and `--color-error` (#F87171 red) are differentiated by luminance (success is darker, error is lighter), not just hue.

---

## 22.6 Motion and Animation

### prefers-reduced-motion

FOCUS respects the `prefers-reduced-motion: reduce` media query. When this preference is detected:

1. **All CSS animations are disabled.** Transitions that normally take 200–500ms are instant (duration set to 0ms). This includes modal open/close animations, page transitions, tooltip fade-ins, and score counter animations.

2. **Game animations are simplified.** The particle effects, confetti explosions, and screen shake effects in games are disabled. Game elements appear and disappear instantly rather than animating in/out.

3. **Progress rings animate via value change only.** The SVG stroke-dashoffset transition is replaced with an instant update. The progress percentage is still visible via the text label.

4. **The carousel auto-rotation is paused.** The game selection carousel does not auto-scroll. Users advance manually via buttons or swipe gestures.

5. **Parallax and scroll effects are disabled.** Any parallax scrolling effects on the landing page or dashboard are flattened to static positioning.

The `prefers-reduced-motion` preference is detected via the `useReducedMotion` hook, which wraps `window.matchMedia('(prefers-reduced-motion: reduce)')` and returns a boolean. This hook is used by components to conditionally disable animations.

### Animation Inventory

Every animation in FOCUS is cataloged in the `packages/ui/src/animations/registry.ts` file, which exports an `AnimationRegistry` object. Each animation entry includes:

```typescript
{
  id: 'modal-open',
  duration: 200,
  easing: 'ease-out',
  respectsReducedMotion: true, // set to 0ms when reduced motion
  fallbackDescription: 'Modal appears instantly',
  wcagCriterion: '2.3.3', // Animation from Interactions
}
```

The `AnimationRegistry` is audited quarterly to ensure no new animations have been added that bypass the reduced motion system.

### WCAG 2.3.3 Compliance

WCAG 2.3.3 (Animation from Interactions) requires that animation can be disabled. FOCUS implements this via the `prefers-reduced-motion` media query AND via an explicit "Reduce animations" toggle in the Accessibility Settings page. The toggle sets a CSS class (`reduce-motion`) on the `<html>` element that has the same effect as the media query, allowing users who do not have the OS-level preference set to still reduce animations in FOCUS.

---

## 22.7 Touch Target Size

### Minimum Touch Target Size

All interactive elements in FOCUS have a minimum touch target size of **44×44 CSS pixels** (WCAG 2.5.8, Target Size (Minimum)). This is the iOS Human Interface Guidelines minimum and the Android Material Design minimum. The implementation ensures that:

- **Buttons** have a minimum height of 44px and width of 44px (or 44px × 44px for icon-only buttons)
- **Links** have a minimum height of 44px (even if the text is smaller, the clickable area is padded)
- **Form inputs** have a minimum height of 44px
- **Game targets** have a minimum touch target of 44×44px, even if the visual representation is smaller (the invisible padding extends the touchable area)
- **Navigation items** have a minimum height of 44px
- **Tab bar items** have a minimum height of 48px (per Material Design guidelines)

### Spacing Between Touch Targets

Adjacent touch targets have a minimum spacing of **8 CSS pixels** to prevent accidental activation. This is enforced via CSS `gap` properties on flex and grid containers, and via `margin` on individual interactive elements. In game UI, where targets may be close together, the spacing is increased to 12px to account for the cognitive load of rapid target selection.

### Mobile-Specific Considerations

On mobile platforms (iOS and Android via Capacitor), touch targets are further enhanced:

- **Bottom navigation items** are 48×48px minimum, with 16px spacing
- **Action sheet items** are 56px height minimum
- **Swipe gestures** have a minimum travel distance of 50px to prevent accidental activation
- **Long-press actions** have a minimum duration of 500ms with haptic feedback to confirm activation

---

## 22.8 Cognitive Accessibility

### Readability

All text in FOCUS is written at an **8th-grade reading level** (Flesch-Kincaid grade level 8.0 or below). This is verified via automated readability analysis in the CI pipeline using the `textstat` npm package. Technical jargon is avoided in user-facing text. When technical terms are necessary (e.g., "Inter-Stimulus Interval" in the analytics explanation), a plain-language tooltip is provided.

### Plain Language Guidelines

- **Sentences:** Average sentence length under 20 words
- **Paragraphs:** Maximum 3 sentences per paragraph
- **Lists:** Use bullet points for 3+ items instead of inline lists
- **Active voice:** All instructions use active voice ("Press Enter to start" not "The Enter key should be pressed")
- **Consistent terminology:** The same action is called the same thing everywhere (e.g., "Start Session" not "Begin Workout" or "Launch Game")
- **Progressive disclosure:** Complex information is revealed in layers. The main screen shows a summary; details are available on demand via expandable sections

### Predictable Navigation

- The navigation menu is in the same position on every page (left sidebar on desktop, bottom tab bar on mobile)
- Page transitions use consistent animations (slide left for forward navigation, slide right for back navigation)
- The "Back" button always returns to the previous page in the navigation stack
- Modal dialogs can always be closed via the X button, Escape key, or clicking outside the modal
- Form submissions always provide feedback within 2 seconds (success toast or error message)

### Error Prevention and Recovery

- **Input validation** happens in real-time (on blur or on keystroke), not on submit
- **Destructive actions** (delete account, reset progress) require confirmation via a modal dialog with explicit "Are you sure?" messaging
- **Undo** is available for the last action in settings changes (a "Revert" button appears for 5 seconds after a change)
- **Error messages** are specific and actionable: "Display name must be 3–20 characters" instead of "Invalid input"
- **Auto-save** is used for settings, so users never lose changes due to accidental navigation

### Session Complexity

FOCUS games are designed with a **complexity budget** that limits the number of simultaneous information sources:

- **Easy mode:** Maximum 2 simultaneous information sources (e.g., target color + position)
- **Medium mode:** Maximum 3 simultaneous information sources (e.g., target color + position + size)
- **Hard mode:** Maximum 4 simultaneous information sources (e.g., target color + position + size + orientation)

This prevents cognitive overload and ensures that users with attention disorders (ADHD, working memory deficits) can engage with the games at a difficulty level that challenges them without overwhelming them.

### Focus Sessions and Cognitive Load

The focus session UI is designed to minimize cognitive load:

- **Minimal chrome:** During a game session, all non-essential UI is hidden (sidebar, header, footer)
- **Single-task focus:** Only one game is active at a time. Multitasking is discouraged by the UI.
- **Progress feedback:** A single progress ring shows completion percentage, reducing uncertainty about how much longer the session will last
- **Rest reminders:** After 20 minutes of continuous play, a gentle reminder suggests taking a break. The reminder is dismissible and does not interrupt gameplay.

---

## 22.9 Audio Accessibility

### Audio Information

FOCUS uses audio cues in some games (e.g., a "ding" when a target is hit, a "buzz" when a target is missed). All audio information is also available through visual and/or haptic channels:

- **Visual cues:** Every audio event has a corresponding visual indicator (color flash, icon appearance, screen vibration). Users who are deaf or hard of hearing do not miss any game information by having audio disabled.
- **Haptic cues:** On mobile devices, audio events trigger haptic feedback patterns (short tap for hit, double tap for miss). Haptic feedback can be toggled independently of audio.
- **Captions/subtitles:** If FOCUS ever adds spoken narration (e.g., for guided meditation sessions), captions will be provided. Currently, no games include spoken content.

### Audio Controls

The audio settings page provides:

- **Master volume slider** (0–100%)
- **Game audio toggle** (on/off)
- **Sound effects toggle** (on/off)
- **Background music toggle** (on/off)
- **Haptic feedback toggle** (on/off, mobile only)
- **Audio ducking** (automatically reduces background music volume when sound effects play)

### Autoplay Prevention

No audio plays automatically when the page loads. Audio begins only after the user explicitly starts a game session. This prevents unexpected audio for users who are in a quiet environment or who are using screen readers (which would conflict with audio output).

---

## 22.10 Assistive Technology-Specific Considerations

### Windows High Contrast Mode

FOCUS supports Windows High Contrast Mode (forced-colors media query) by:

- Replacing custom borders and shadows with `CanvasText` and `Canvas` forced colors
- Ensuring focus indicators use `Highlight` color
- Ensuring disabled states use `GrayText` color
- Replacing custom SVG icons with high-contrast-compatible alternatives

```css
@media (forced-colors: active) {
  :focus-visible {
    outline: 2px solid Highlight;
  }
  .game-target {
    border: 2px solid CanvasText;
    forced-color-adjust: none; /* preserve game colors */
  }
}
```

### Zoom and Text Scaling

FOCUS supports up to **200% text scaling** without horizontal scrolling or content loss (WCAG 1.4.4). The layout uses CSS Grid and Flexbox with relative units (rem, em, %) rather than fixed pixel values. At 200% zoom:

- The sidebar collapses to icons only (or a hamburger menu on mobile)
- The game canvas scales proportionally (maintaining aspect ratio)
- Text wraps gracefully (no overflow or truncation)
- Touch targets maintain minimum size

### Voice Control

FOCUS supports voice control via standard HTML semantics. All interactive elements have visible text labels (not icon-only) that can be spoken as voice commands. The `aria-label` attribute provides an accessible name that voice control systems can use as a command target.

### Switch Access

FOCUS supports switch access (single-switch and dual-switch scanning) by ensuring that all interactive elements are focusable and activatable via keyboard events (which switch access systems emulate). The scanning order follows the tab order, and the scan highlight is visible (uses the focus indicator style).

---

## 22.11 Testing Schedule

### Automated Testing (Every CI Run)

- **axe-core** scans every page and component in the E2E test suite. axe-core is integrated via `@axe-core/playwright` and runs against every route in the application. Violations fail the CI build.
- **Lighthouse accessibility audit** scores every page. The minimum passing score is 90/100. Scores below 90 fail the CI build.
- **Contrast ratio checks** via the `axe-core` color contrast rules and custom PostCSS plugins that validate design tokens against minimum ratios.

### Manual Testing (Every Release)

- **Keyboard-only navigation** test: Every feature is used via keyboard only (no mouse) for the entire release test cycle. This takes approximately 2 hours.
- **Screen reader test** with VoiceOver (macOS + iOS), NVDA (Windows), and TalkBack (Android). The test follows the scripted test suite in `e2e/accessibility/screen-reader-test-suite.md`. This takes approximately 4 hours per screen reader.
- **Zoom test** at 200% browser zoom on desktop and 200% text scaling on mobile. This takes approximately 1 hour.
- **High contrast mode test** on Windows with High Contrast Black and High Contrast White themes. This takes approximately 30 minutes.

### Quarterly Audits

- **Full WCAG 2.1 AA audit** conducted by an external accessibility consultant. The audit covers all pages, all interactive elements, all game interfaces, and all platforms. The audit report includes specific remediation recommendations with severity ratings.
- **User testing** with 3–5 users who have disabilities (visual impairment, motor disability, cognitive disability). The testing sessions are recorded (with consent) and analyzed for usability issues that automated tools cannot detect.

### Accessibility Regression Prevention

- **New components** must include an accessibility checklist (defined in `packages/ui/src/checklists/accessibility-checklist.md`) before being merged. The checklist includes: ARIA role, keyboard operability, focus management, contrast ratio, and screen reader announcement.
- **New games** must include accessibility layer documentation (defined in `packages/game-engine/src/accessibility/README.md`) before being merged. The documentation includes: target announcements, score announcements, and keyboard controls.
- **PR reviews** include an accessibility review step. The PR template includes a checkbox: "This change has been tested with a screen reader and keyboard navigation."

---

## 22.12 Accessibility Settings

The FOCUS accessibility settings page (accessible from the main settings menu) provides the following user-configurable options:

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| **Reduce motion** | On / Off / System | System | Disables animations and transitions |
| **Reduce announcements** | On / Off / System | System | Minimizes screen reader announcements |
| **High contrast mode** | On / Off / System | System | Increases contrast beyond WCAG AA |
| **Large text** | On / Off / System | System | Increases text size by 20% |
| **Game audio** | On / Off | On | Toggles all game audio |
| **Haptic feedback** | On / Off / System | System | Toggles haptic feedback (mobile only) |
| **Keyboard shortcuts** | On / Off | On | Enables/disables keyboard shortcuts |
| **Focus indicator** | Standard / Enhanced / Off | Standard | Adjusts focus ring visibility |
| **Screen reader mode** | Auto / On / Off | Auto | Optimizes UI for screen reader usage |

All settings are persisted in the user profile (synced across devices) and are available in the first-run onboarding flow.

---

## 22.13 Documentation and Training

### Developer Documentation

- **Accessibility coding standards** are documented in `docs/accessibility/coding-standards.md` and cover ARIA usage, focus management, keyboard navigation, color contrast, and screen reader testing.
- **Component accessibility specifications** are documented in Storybook stories using the `@storybook/addon-a11y` addon, which displays axe-core results inline for each component variant.
- **Game accessibility specifications** are documented in `packages/game-engine/src/accessibility/README.md` and cover the accessibility layer architecture, screen reader announcements, and keyboard controls for each game.

### Design Documentation

- **Color palette** with contrast ratios is maintained in Figma and synced to CSS custom properties. The Figma plugin "Stark" is used to check contrast ratios during design.
- **Component specifications** include keyboard interaction patterns, ARIA roles, and focus behavior. The Figma plugin "A11y - Design Accessibility Plugin" is used during design review.
- **Touch target audit** is performed in Figma using the "Touch Target" plugin, which highlights elements below the 44px minimum.

### Team Training

- **Onboarding:** Every new team member completes a 2-hour accessibility training session that covers WCAG principles, screen reader usage, keyboard navigation testing, and FOCUS-specific accessibility patterns.
- **Quarterly refresher:** The team conducts a quarterly "accessibility day" where everyone uses the product with a screen reader for 30 minutes and reports issues.
- **Conference budget:** The team budget includes attendance at at least one accessibility conference per year (e.g., CSUN Assistive Technology Conference, Axe-Con).
