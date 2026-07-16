# Chapter 11: Motion & Animation System

## Overview

Motion is the invisible force that makes FOCUS feel alive. Without animation, the interface is a series of static snapshots. With animation, it becomes a living, breathing system that communicates state, provides feedback, guides attention, and delights users. This chapter defines every animation in FOCUS — from the spring physics that drive page transitions to the particle effects that celebrate level-ups.

The FOCUS motion system is built on three principles: **purpose**, **performance**, and **preference**. Every animation must have a clear purpose (feedback, navigation, or delight). Every animation must perform at 60fps without exception. Every animation must respect the user's motion preferences.

---

## 11.1 Motion Philosophy

### 11.1.1 Three Purposes of Motion

Every animation in FOCUS serves one of three purposes:

**1. Feedback:**
Motion that confirms an action or communicates system state.
- Button press animation (confirms click)
- Score count-up (communicates result)
- Error shake (communicates failure)
- Success checkmark (confirms completion)
- Loading spinner (communicates processing)

**2. Navigation:**
Motion that helps users understand spatial relationships and direction.
- Page transitions (communicates route change)
- Slide-in panels (communicates depth and origin)
- Tab switching (communicates content change)
- Back navigation (communicates return)
- Modal open/close (communicates overlay state)

**3. Delight:**
Motion that creates emotional moments and rewards engagement.
- Level-up celebration (rewards achievement)
- Achievement badge animation (rewards unlock)
- Streak fire particles (rewards consistency)
- Leaderboard rank change (rewards competition)
- Season transition (rewards participation)

### 11.1.2 Motion Rules

Every animation in FOCUS must follow these rules:

1. **Never block user interaction.** Animations can play while the user interacts with other elements. No animation should prevent the user from performing actions.
2. **Never delay content.** Animations should not hold content hostage. Content should be visible and accessible as quickly as possible, even if animations are still playing.
3. **Always be interruptible.** If a user triggers a new action while an animation is playing, the current animation should transition smoothly to the new state, not complete before starting the new one.
4. **Never be the only indicator.** Animations supplement visual and textual indicators, never replace them. A success animation should be accompanied by a success message and icon.
5. **Always respect reduced motion.** If the user has indicated a preference for reduced motion, all non-essential animations are disabled.
6. **Never exceed 60fps.** Animations that drop below 60fps are reworked or removed. Performance is non-negotiable.
7. **Use appropriate timing.** Short animations (50-150ms) for micro-interactions, medium (200-400ms) for page transitions, long (500-1500ms) for celebratory effects.

### 11.1.3 Emotional Design

Motion creates emotional moments in FOCUS:

- **Micro-moments (50-150ms):** Button presses, toggles, small feedback. These create a sense of responsiveness and precision.
- **Transition moments (200-400ms):** Page changes, panel slides, modal open/close. These create a sense of spatial awareness and direction.
- **Celebration moments (500-1500ms):** Level-ups, achievements, streaks. These create a sense of accomplishment and reward.
- **Ambient moments (continuous):** Breathing effects, subtle shimmer, background particles. These create a sense of life and atmosphere.

---

## 11.2 Animation Library: Framer Motion

### 11.2.1 Why Framer Motion

FOCUS uses **Framer Motion** as the primary animation library. The reasons for this choice:

**Layout Animations:**
Framer Motion provides built-in layout animations that automatically animate position and size changes when elements move in the DOM. This is critical for:
- Leaderboard rank changes (entries sliding up/down)
- Grid reflow animations (cards rearranging)
- Shared element transitions (page-to-page)

**Shared Layout Animations:**
The `layoutId` prop allows Framer Motion to animate elements between different components. This enables:
- Smooth transitions from list items to detail views
- Score animations from game to results screen
- Avatar transitions between pages

**Gesture Support:**
Framer Motion integrates gesture handling:
- `whileHover` for hover animations
- `whileTap` for press animations
- `drag` for draggable elements
- `pan` for scroll-based animations

**Physics-Based Animations:**
Framer Motion uses spring physics by default, creating natural-feeling animations that overshoot and settle. This eliminates the need to define custom easing curves for most animations.

**React Integration:**
Framer Motion is built for React and provides:
- Declarative animation definitions (props, not imperative code)
- `AnimatePresence` for mount/unmount animations
- `motion` components that replace HTML elements
- `useAnimation` hook for imperative control
- `useMotionValue` for performance-optimized value tracking

**Performance:**
Framer Motion uses the Web Animations API and GPU-accelerated transforms:
- Animations run off the main thread when possible
- Layout animations use `transform` and `opacity` only
- `will-change` is managed automatically
- Re-renders are minimized through motion values

### 11.2.2 Integration Architecture

```
React Component
  |
Framer Motion (motion.div, AnimatePresence, etc.)
  |
CSS Transforms (translateX, translateY, scale, opacity)
  |
GPU Compositor (hardware-accelerated)
  |
Screen (60fps)
```

### 11.2.3 Framer Motion Configuration

```typescript
// Global Framer Motion configuration
import { LazyMotion, domAnimation } from 'framer-motion';

function App() {
  return (
    <LazyMotion features={domAnimation}>
      {/* App content */}
    </LazyMotion>
  );
}
```

---

## 11.3 Spring Physics System

Springs are the foundation of natural-feeling animations in FOCUS. Unlike easing curves (which follow a fixed path), springs respond to the properties of the elements they animate, creating organic, physically-plausible motion.

### 11.3.1 Spring Presets

FOCUS defines five spring presets for consistent animation behavior:

**Default Spring:**
```typescript
const defaultSpring = {
  stiffness: 300,
  damping: 30,
  mass: 1,
};
```
- **Behavior:** Quick settle with minimal overshoot
- **Use case:** General purpose animations, page transitions, card animations
- **Duration:** ~250ms to settle within 1% of target

**Bouncy Spring:**
```typescript
const bouncySpring = {
  stiffness: 400,
  damping: 15,
  mass: 0.8,
};
```
- **Behavior:** Noticeable overshoot, playful bounce
- **Use case:** Achievement unlocks, celebration effects, fun micro-interactions
- **Duration:** ~400ms to settle (includes bounce)
- **Caution:** Use sparingly — too many bouncy animations create a childish feel

**Gentle Spring:**
```typescript
const gentleSpring = {
  stiffness: 200,
  damping: 30,
  mass: 1,
};
```
- **Behavior:** Slow, smooth settle with no overshoot
- **Use case:** Subtle transitions, background animations, ambient effects
- **Duration:** ~350ms to settle

**Snappy Spring:**
```typescript
const snappySpring = {
  stiffness: 500,
  damping: 40,
  mass: 0.5,
};
```
- **Behavior:** Very quick settle with minimal overshoot
- **Use case:** Micro-interactions (button press, toggle, checkbox)
- **Duration:** ~150ms to settle

**Stiff Spring:**
```typescript
const stiffSpring = {
  stiffness: 600,
  damping: 50,
  mass: 0.3,
};
```
- **Behavior:** Almost instant settle, very rigid
- **Use case:** Number counters, score roll-ups, precise position changes
- **Duration:** ~100ms to settle

### 11.3.2 Spring vs. Easing Decision Matrix

| Scenario | Use Spring | Use Easing |
|----------|-----------|------------|
| Natural, organic movement | Yes | |
| UI transitions with overshoot | Yes | |
| Precise, mechanical movement | | Yes |
| Continuous/looping animations | | Yes |
| Scroll-based animations | | Yes |
| Gesture-driven animations | Yes | |

### 11.3.3 Spring Configuration Guidelines

When configuring springs for specific animations:

1. **Match the visual weight.** Heavier elements (large cards, modals) should use lower stiffness and higher mass. Lighter elements (icons, text) should use higher stiffness and lower mass.
2. **Consider the distance.** Elements moving long distances need lower stiffness to prevent appearing too fast. Elements moving short distances need higher stiffness to feel responsive.
3. **Test on target devices.** Spring physics can behave differently on lower-powered devices. Test on minimum-spec devices to ensure animations feel right.

---

## 11.4 Easing Functions

While springs are preferred for most animations, cubic-bezier easing curves are used for specific contexts:

### 11.4.1 Standard Easing Curves

**easeOut:**
```css
cubic-bezier(0, 0, 0.2, 1)
```
- **Behavior:** Fast start, slow end
- **Use case:** Elements entering the screen, fade-ins, scale-ups
- **Duration:** 200-300ms

**easeIn:**
```css
cubic-bezier(0.4, 0, 1, 1)
```
- **Behavior:** Slow start, fast end
- **Use case:** Elements exiting the screen, fade-outs, scale-downs
- **Duration:** 150-200ms

**easeInOut:**
```css
cubic-bezier(0.4, 0, 0.2, 1)
```
- **Behavior:** Slow start, fast middle, slow end
- **Use case:** Elements that change direction, oscillating animations
- **Duration:** 200-400ms

**sharp:**
```css
cubic-bezier(0.4, 0, 0.6, 1)
```
- **Behavior:** Very fast start, very fast end, minimal middle
- **Use case:** Micro-interactions that need to feel instant
- **Duration:** 100-150ms

### 11.4.2 Custom Easing Curves

Some animations require custom easing curves:

**Anticipation (slight reverse before forward):**
```css
cubic-bezier(0.36, 0, 0.66, -0.56)
```
Used for: Elements that wind up before moving (e.g., throwing gesture)

**Overshoot (goes past target before settling):**
```css
cubic-bezier(0.34, 1.56, 0.64, 1)
```
Used for: Bouncy arrivals (e.g., card appearing from bottom)

---

## 11.5 Page Transitions

### 11.5.1 Route Change Transition

When the user navigates to a new page:

**Forward Navigation:**
- Outgoing page: Fade out (opacity 1 to 0) + slight slide left (translateX 0 to -20px), 200ms ease-in
- Incoming page: Fade in (opacity 0 to 1) + slight slide right (translateX 20px to 0), 200ms ease-out
- Overlap: 100ms (outgoing and incoming animate simultaneously)
- Total duration: ~300ms

**Back Navigation:**
- Outgoing page: Fade out (opacity 1 to 0) + slight slide right (translateX 0 to 20px), 200ms ease-in
- Incoming page: Fade in (opacity 0 to 1) + slight slide left (translateX -20px to 0), 200ms ease-out
- Overlap: 100ms
- Total duration: ~300ms

**Implementation:**
```typescript
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
};

// In page component:
<motion.div
  variants={pageTransition}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {/* Page content */}
</motion.div>
```

### 11.5.2 Modal Transition

**Modal Open:**
- Backdrop: Fade in (opacity 0 to 0.6), 300ms ease-out
- Modal: Scale from 0.95 + fade from 0, spring (stiffness: 300, damping: 30)
- Focus: First focusable element receives focus after animation completes

**Modal Close:**
- Backdrop: Fade out (opacity 0.6 to 0), 200ms ease-in
- Modal: Scale to 0.95 + fade to 0, 200ms ease-in
- Focus: Returns to the element that triggered the modal

**Implementation:**
```typescript
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};
```

### 11.5.3 Tab Switch Transition

When switching between tabs within a page:

**Cross-Fade:**
- Outgoing tab: Fade out (opacity 1 to 0), 150ms ease-in
- Incoming tab: Fade in (opacity 0 to 1) + slight Y translation (translateY 8px to 0), 150ms ease-out
- No slide — tabs are peers, not hierarchical

**Tab Indicator:**
- The active tab indicator (underline or pill) slides to the new position
- Animation: translateX with spring (stiffness: 500, damping: 40)
- Duration: ~200ms

### 11.5.4 Bottom Sheet Transition

**Bottom Sheet Open:**
- Sheet: Slide up from bottom (translateY 100% to 0), spring (stiffness: 300, damping: 30)
- Background: Fade to dimmed (opacity 0 to 0.6), 300ms ease-out
- Sheet settles at 80% of viewport height (or content height, whichever is smaller)

**Bottom Sheet Close:**
- Sheet: Slide down to bottom (translateY 0 to 100%), 200ms ease-in
- Background: Fade from dimmed (opacity 0.6 to 0), 200ms ease-in
- Swipe down gesture dismisses the sheet (with velocity threshold)

---

## 11.6 Component Animations

### 11.6.1 Button Press

When a button is pressed:
- Scale to 0.97 (50ms, ease-out)
- Background darkens 10% (immediate)
- On release: Scale back to 1.0 (100ms, spring)

```typescript
<motion.button
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.05, ease: 'easeOut' }}
>
  Button
</motion.button>
```

### 11.6.2 Card Hover

When a card is hovered:
- Shadow elevates (shadow-sm to shadow-md), 200ms ease
- Slight Y translate (0 to -2px), 200ms ease
- Border color brightens slightly, 200ms ease

When the card is pressed:
- Scale to 0.99 (50ms)
- Shadow returns to default

```typescript
<motion.div
  whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
  whileTap={{ scale: 0.99 }}
  transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
>
  {/* Card content */}
</motion.div>
```

### 11.6.3 Input Focus

When an input receives focus:
- Border color transitions to neural-500 (200ms ease)
- Subtle glow effect appears (box-shadow with neural-500 color), 200ms ease
- Label color transitions to neural-500, 200ms ease

When an input loses focus:
- Border color returns to default (200ms ease)
- Glow effect fades (200ms ease)

### 11.6.4 Toggle Switch

When a toggle is switched:
- Knob slides to the new position, spring (stiffness: 500, damping: 40)
- Background color transitions (obsidian-700 to neural-500 for on, reverse for off), 200ms ease
- Subtle scale pulse on the knob at the end of the animation

### 11.6.5 Checkbox

When a checkbox is checked:
- The checkmark draws using SVG path animation
- `stroke-dashoffset` animates from full path length to 0, 300ms ease-out
- Background color fills with neural-500, 200ms ease
- Checkmark color transitions from transparent to white, 100ms ease

When unchecked:
- Checkmark fades out, 150ms ease-in
- Background color returns to transparent, 200ms ease

### 11.6.6 Dropdown Menu

**Open:**
- Menu scales from 0.95 + fades from 0, spring (stiffness: 300, damping: 30)
- Menu origin point is the button that triggered it
- Background dims slightly, 200ms ease

**Close:**
- Menu scales to 0.95 + fades to 0, 200ms ease-in
- Background dim fades, 200ms ease

**Item hover:**
- Background highlights with obsidian-800, 100ms ease
- Subtle left border appears (neural-500), 100ms ease

### 11.6.7 Toast Notification

**Enter:**
- Slide in from right (translateX 100% to 0) + fade (opacity 0 to 1), spring (stiffness: 300, damping: 30)
- Progress bar animates from full to zero over the auto-dismiss duration

**Exit:**
- Slide out to right (translateX 0 to 100%) + fade (opacity 1 to 0), 200ms ease-in

**Stack:**
- When a new toast arrives, existing toasts shift up with spring animation
- 8px gap maintained between toasts

### 11.6.8 Skeleton Loading

**Shimmer Animation:**
- Background gradient (obsidian-700 to obsidian-600 to obsidian-700) moves from left to right
- Duration: 1.5 seconds, infinite loop
- Easing: linear (continuous)
- The skeleton shape matches the content it replaces

**Implementation:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-obsidian-700) 0%,
    var(--color-obsidian-600) 50%,
    var(--color-obsidian-700) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 11.7 Game Animations

Game animations are the most complex and performance-critical animations in FOCUS. They must be smooth, responsive, and visually impactful while maintaining 60fps.

### 11.7.1 Stimulus Appear

When a game stimulus (e.g., colored light, shape) appears:

**Animation:**
- Scale: Spring from 0 to 1 (stiffness: 300, damping: 20)
- Opacity: Fade from 0 to 1 (100ms, ease-out)
- Glow: Box-shadow appears with stimulus color (200ms, ease-out)

**Performance:**
- Use `transform: scale()` only — never animate width/height
- Use `opacity` for fade — never animate background-color
- GPU-accelerated via `will-change: transform, opacity`

```typescript
const stimulusVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      scale: { type: 'spring', stiffness: 300, damping: 20 },
      opacity: { duration: 0.1, ease: 'easeOut' },
    },
  },
};
```

### 11.7.2 Stimulus Hit (Correct Response)

When the user correctly responds to a stimulus:

**Animation:**
- Scale pulse: 1 to 1.2 to 1 (200ms total)
  - 0-100ms: Scale to 1.2, ease-out
  - 100-200ms: Scale back to 1, ease-in
- Color flash: Background briefly flashes signal-500 (success green), 150ms
- Particle burst: 8-12 small circles burst outward from center, 400ms, fade out
- Glow: Green glow appears and fades, 300ms

**Performance:**
- Particles are CSS-only (no JS animation loop)
- Particles use `transform: translate()` and `opacity` only
- Maximum 12 particles per hit to maintain performance
- Particles are removed from DOM after animation completes

### 11.7.3 Stimulus Miss

When the user misses a stimulus:

**Animation:**
- Scale: Subtle shrink (1 to 0.95), 100ms ease-in
- Color: Background briefly flashes alert-500 (error red), 150ms
- Shake: Horizontal shake (translateX: 0 to -4px to 4px to -2px to 2px to 0), 300ms
- Fade: Opacity reduces slightly (1 to 0.7), 200ms

### 11.7.4 Score Increment

When the score increases:

**Animation:**
- Number counter rolls up digit by digit
- Each digit rolls from bottom (translateY: 100% to 0), 200ms per digit
- Digits roll with 50ms stagger (rightmost digit first)
- Final scale pulse: 1 to 1.05 to 1, 200ms spring
- Color flash: synapse-500 (orange) glow, 300ms

**Performance:**
- Only the changed digits animate
- Use `transform: translateY()` for the roll effect
- Number display uses monospace font for consistent width during animation

### 11.7.5 Streak Fire

When the user achieves a streak (consecutive correct responses):

**Animation:**
- Streak counter scales in with bouncy spring (stiffness: 400, damping: 15)
- Fire particles appear below the streak counter
  - 5-8 orange/red particles rise upward
  - Particles follow a sine wave path (horizontal oscillation while rising)
  - Particles fade from synapse-500 to transparent over 800ms
  - Particles are recycled (new particles spawn as old ones fade)
- Streak counter glows with synapse-500 color (continuous while streak is active)
- Background gets a subtle warm tint (synapse-50 at 5% opacity), 200ms

**Performance:**
- Fire particles are CSS animations (keyframes), not JS
- Maximum 8 particles simultaneously
- Particle recycling prevents DOM growth
- Animation pauses when tab is not visible (Page Visibility API)

### 11.7.6 Level Up

Level-up is the most dramatic animation in FOCUS:

**Animation Sequence (total: ~3 seconds):**
1. **0-500ms:** Screen dims slightly, all game UI fades to 50% opacity
2. **200-700ms:** Radial reveal from center — a circle expands from the level-up badge position, revealing the level-up content
3. **300-800ms:** Level number scales in with bouncy spring (stiffness: 400, damping: 15)
4. **500-1500ms:** Particle burst — 20-30 particles explode outward from center
   - Particles are circles of varying sizes (4-12px)
   - Colors: neural-500, synapse-500, signal-500, gold
   - Particles follow parabolic paths (gravity simulation)
   - Particles fade from full opacity to 0 over 1000ms
5. **800-1500ms:** Achievement badge scales in with spring
6. **1500-2000ms:** "Level X Complete!" text fades in
7. **2000-3000ms:** XP gain display animates (count-up from 0 to total XP)
8. **2500-3000ms:** Background returns to normal, UI fades back in
9. **3000ms:** "Continue" button appears with spring animation

**Performance:**
- Particle count is capped at 30
- Radial reveal uses `clip-path: circle()` with CSS animation
- Background dim uses `opacity` on an overlay element
- All animations are GPU-accelerated

### 11.7.7 Achievement Unlock

When an achievement is unlocked:

**Animation:**
1. **0-200ms:** Badge appears with bouncy spring (stiffness: 400, damping: 15)
2. **200-500ms:** Shine effect — a white gradient sweeps across the badge from left to right
3. **200-600ms:** Badge scales up slightly (1 to 1.1 to 1) with spring
4. **400-800ms:** Badge name fades in below
5. **600-1000ms:** Achievement description fades in
6. **800-1200ms:** Notification toast slides in from top-right

### 11.7.8 Leaderboard Rank Change

When the leaderboard refreshes and ranks change:

**Animation:**
- Entries moving up: Slide up with spring (stiffness: 300, damping: 30), 300ms
- Entries moving down: Slide down with spring, 300ms
- New entries: Fade in + scale from 0.95, 300ms spring
- Removed entries: Fade out + scale to 0.95, 200ms ease-in
- Rank number change: Old number fades out (100ms), new number fades in (100ms)
- Arrow indicator: Appears with spring animation, stays for 2 seconds, fades out

**Performance:**
- Only visible entries animate (virtual scrolling)
- Maximum 20 entries animate simultaneously
- Animation uses `transform` only — no layout animations

---

## 11.8 Score Visualization Animations

### 11.8.1 Circular Progress

The circular progress indicator animates the SVG stroke-dashoffset:

**Animation:**
- `stroke-dashoffset` animates from full circumference to the target offset
- Duration: 1000ms, ease-out
- The stroke appears to fill the circle clockwise
- Color transitions from obsidian-600 to the target color as it fills

**Implementation:**
```typescript
<motion.circle
  cx="50%"
  cy="50%"
  r={radius}
  stroke={color}
  strokeWidth={4}
  fill="none"
  strokeDasharray={circumference}
  initial={{ strokeDashoffset: circumference }}
  animate={{ strokeDashoffset: targetOffset }}
  transition={{ duration: 1, ease: [0, 0, 0.2, 1] }}
  strokeLinecap="round"
  transform="rotate(-90 50 50)"
/>
```

### 11.8.2 Bar Chart

Bar charts animate bars growing from the bottom:

**Animation:**
- Each bar grows from height 0 to target height
- Duration: 300ms per bar, staggered by 50ms (left to right)
- Easing: Spring (stiffness: 300, damping: 30)
- Bar color fades in simultaneously (opacity 0 to 1, 200ms)
- Value labels fade in after bar reaches full height (200ms delay)

### 11.8.3 Line Chart

Line charts animate the SVG path drawing:

**Animation:**
- SVG `stroke-dashoffset` animates from full path length to 0
- Duration: 1000ms, ease-out
- The line appears to draw from left to right
- Data points appear as the line reaches them (scale spring, 100ms delay each)
- Area under the line fades in after line is complete (300ms delay)

### 11.8.4 Radar Chart

Radar charts animate the polygon scaling from center:

**Animation:**
- Polygon scales from 0 (center) to 1 (full size), spring (stiffness: 200, damping: 25)
- Duration: 500ms
- Polygon opacity fades in (0 to 1), 300ms
- Axis labels fade in after polygon is complete (200ms delay)
- Data points on each axis appear with individual scale springs (100ms stagger)

### 11.8.5 Number Counter (Generic)

The number counter component is used throughout FOCUS for score displays, statistics, and metrics:

**Animation:**
- Digits roll from bottom (translateY: 100% to 0) one by one
- Rightmost digit rolls first, then leftward
- Each digit rolls with 50ms stagger
- Duration per digit: 200ms, ease-out
- Total duration: Depends on number of digits (e.g., 4 digits = 200ms + 3 x 50ms = 350ms)

**Implementation:**
```typescript
function AnimatedNumber({ value, duration = 500 }: Props) {
  const digits = value.toString().split('');

  return (
    <div className="number-counter">
      {digits.map((digit, index) => (
        <motion.span
          key={`${index}-${digit}`}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: (digits.length - 1 - index) * 0.05,
            duration: 0.2,
            ease: [0, 0, 0.2, 1],
          }}
        >
          {digit}
        </motion.span>
      ))}
    </div>
  );
}
```

---

## 11.9 Micro-Interactions

### 11.9.1 Pull-to-Refresh

When the user pulls down on a scrollable list:

**Animation:**
- Pull: Content translates down proportionally to pull distance (0.5x ratio)
- Overshoot: If pulled past threshold, content overshoots slightly (20px past threshold)
- Spring back: Content springs back to rest position (spring: stiffness 300, damping 30)
- Refresh indicator: Pulsing neural network animation appears during pull
  - 3 nodes connected by lines
  - Nodes pulse in sequence (opacity 0.3 to 1 to 0.3)
  - Lines glow during pulse
- On release: Refresh indicator spins, data loads, indicator fades out

### 11.9.2 Like Button

When the user likes/reacts to something:

**Animation:**
- Scale: 1 to 1.3 to 1 (300ms, bouncy spring)
- Color: Fill transitions to signal-500 (200ms)
- Particle burst: 6 small circles burst outward (400ms)
- Haptic: Light impact haptic (iOS) / short vibration (Android)

### 11.9.3 Share Button

When the user taps share:

**Animation:**
- Button icon morphs from share icon to share sheet icon (SVG path animation, 200ms)
- Share sheet slides up from bottom (spring, 300ms)
- Share options appear with staggered fade-in (50ms per option)

### 11.9.4 Navigation Active Indicator

The active indicator on the navigation bar slides between items:

**Animation:**
- Indicator translates from old position to new position
- Animation: Spring (stiffness: 500, damping: 40)
- Duration: ~200ms
- Width of indicator transitions to match new item width (if different)
- The indicator maintains its center point during the transition

### 11.9.5 Parallax Scroll

Background elements move at a different rate than foreground content:

**Animation:**
- Background elements translate Y at 0.5x scroll speed
- Mid-ground elements translate Y at 0.75x scroll speed
- Foreground elements move at 1x scroll speed (normal scroll)
- The parallax effect creates depth perception
- Performance: Use `transform: translateY()` on all parallax elements
- Limit: Maximum 3 parallax layers to prevent performance issues

---

## 11.10 Reduced Motion

### 11.10.1 Detection

FOCUS checks the user's motion preference using:

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

This is checked on app load and listened for changes:

```typescript
window.matchMedia('(prefers-reduced-motion: reduce)')
  .addEventListener('change', (e) => {
    setReducedMotion(e.matches);
  });
```

### 11.10.2 Reduced Motion Behavior

When reduced motion is preferred:

| Original Animation | Reduced Motion Replacement |
|-------------------|--------------------------|
| Spring transitions | Instant (duration: 0) |
| Slide transitions | Fade only (no movement) |
| Scale animations | Instant (no scale change) |
| Particle effects | Disabled entirely |
| Continuous animations (breathing, shimmer) | Disabled entirely |
| Score count-up | Static display (no animation) |
| Streak fire | Static indicator (no particles) |
| Level-up celebration | Simple fade-in (no particles, no radial reveal) |
| Achievement unlock | Simple fade-in (no shine, no bounce) |
| Page transitions | Cross-fade (no slide) |
| Modal open/close | Fade only (no scale) |
| Button press | Color change only (no scale) |
| Card hover | Border color change only (no shadow) |

### 11.10.3 User Override

Users can override the system preference in FOCUS settings:

- **System default** (default): Follows OS-level preference
- **Reduced motion on**: Forces all animations to minimal
- **Reduced motion off**: Forces all animations to play, even if OS prefers reduced

The user override is stored in localStorage and synced across devices via the user profile.

---

## 11.11 Performance

### 11.11.1 Performance Budget

Every animation in FOCUS must meet these performance requirements:

| Metric | Requirement |
|--------|-------------|
| Frame rate | 60fps minimum (16.67ms per frame) |
| Main thread work | Less than 8ms per frame |
| Layout thrashing | Zero forced reflows during animation |
| Memory allocation | Zero per-frame allocations |
| GPU memory | Less than 50MB for all animated elements |

### 11.11.2 GPU-Accelerated Properties

Only two CSS properties are GPU-accelerated for animations:

1. **transform:** translateX, translateY, translateZ, scale, rotate, skew
2. **opacity:** 0 to 1

All other CSS properties (width, height, padding, margin, top, left, background-color, border-color, box-shadow, etc.) trigger layout recalculations and are NOT GPU-accelerated.

**The Rule:** If it is not `transform` or `opacity`, do not animate it.

**Exceptions:**
- `clip-path` for radial reveals (used sparingly)
- `stroke-dashoffset` for SVG path animations (score visualizations)
- `filter: blur()` for glass effects (used with `will-change` and limited instances)

### 11.11.3 will-change Management

The `will-change` CSS property tells the browser to prepare an element for animation. FOCUS uses it strategically:

```css
/* Only add will-change to elements that WILL animate */
.animated-element {
  will-change: transform, opacity;
}

/* Remove will-change after animation completes */
.animated-element[data-animated="false"] {
  will-change: auto;
}
```

**Rules:**
- Never add `will-change` to more than 3 elements simultaneously
- Always remove `will-change` after animation completes
- Never use `will-change` on elements that are not animating
- Monitor GPU memory usage in Chrome DevTools

### 11.11.4 Batch State Updates

During animations, React state updates must be batched to prevent multiple re-renders:

```typescript
// BAD: Multiple state updates cause multiple re-renders
function handleScoreUpdate() {
  setScore(newScore);      // Re-render 1
  setStreak(newStreak);    // Re-render 2
  setRank(newRank);        // Re-render 3
}

// GOOD: Batched state update causes single re-render
function handleScoreUpdate() {
  startTransition(() => {
    setScore(newScore);
    setStreak(newStreak);
    setRank(newRank);
  });
}
```

### 11.11.5 Animation Performance Monitoring

FOCUS includes runtime performance monitoring for animations:

```typescript
// Track frame drops during animations
function measureAnimationPerformance(animationName: string) {
  let lastFrameTime = performance.now();
  let droppedFrames = 0;

  const measure = () => {
    const now = performance.now();
    const frameDuration = now - lastFrameTime;

    if (frameDuration > 18.67) { // More than 16.67ms + 2ms buffer
      droppedFrames++;
    }

    lastFrameTime = now;

    if (droppedFrames > 3) {
      console.warn(
        `Animation "${animationName}" dropped ${droppedFrames} frames`
      );
      // Report to analytics
      analytics.track('animation_performance_issue', {
        animationName,
        droppedFrames,
      });
    }
  };

  requestAnimationFrame(measure);
}
```

### 11.11.6 Performance Testing

Every animation is tested using:

1. **Chrome DevTools Performance Panel:** Record animation, check for layout thrashing, long frames, and memory leaks.
2. **Lighthouse Performance Audit:** Ensure animations do not impact Lighthouse scores.
3. **Low-End Device Testing:** Test on minimum-spec devices (e.g., iPhone SE, budget Android phones) to ensure animations remain smooth.
4. **Battery Impact Testing:** Measure battery consumption during extended sessions with animations enabled vs. disabled.

---

## 11.12 Animation Timing Reference

Complete reference of all animation timings in FOCUS:

### 11.12.1 Micro-Interactions (50-200ms)

| Animation | Duration | Easing |
|-----------|----------|--------|
| Button press | 50ms | ease-out |
| Button release | 100ms | spring (snappy) |
| Toggle switch | 200ms | spring (snappy) |
| Checkbox check | 300ms | ease-out |
| Input focus glow | 200ms | ease |
| Card hover | 200ms | ease |
| Dropdown item hover | 100ms | ease |
| Like button | 300ms | bouncy spring |

### 11.12.2 Transitions (200-400ms)

| Animation | Duration | Easing |
|-----------|----------|--------|
| Page forward | 200ms | ease-in/ease-out |
| Page back | 200ms | ease-in/ease-out |
| Modal open | 300ms | spring (default) |
| Modal close | 200ms | ease-in |
| Tab switch | 150ms | ease-in/ease-out |
| Tab indicator slide | 200ms | spring (snappy) |
| Bottom sheet open | 300ms | spring (default) |
| Bottom sheet close | 200ms | ease-in |
| Toast enter | 300ms | spring (default) |
| Toast exit | 200ms | ease-in |
| Dropdown open | 200ms | spring (default) |
| Dropdown close | 200ms | ease-in |

### 11.12.3 Game Animations (100-500ms)

| Animation | Duration | Easing |
|-----------|----------|--------|
| Stimulus appear | 200ms | spring (stiff) |
| Stimulus hit pulse | 200ms | ease-out/ease-in |
| Stimulus miss shake | 300ms | spring |
| Score increment | 500ms | ease-out |
| Streak counter | 300ms | bouncy spring |
| False start shake | 300ms | spring |

### 11.12.4 Celebrations (500-3000ms)

| Animation | Duration | Easing |
|-----------|----------|--------|
| Achievement badge in | 200ms | bouncy spring |
| Achievement shine | 300ms | ease-in-out |
| Level-up sequence | 3000ms | mixed |
| Level-up particles | 1000ms | ease-out |
| Leaderboard rank slide | 300ms | spring (default) |
| Season transition | 2000ms | mixed |

### 11.12.5 Continuous (looping)

| Animation | Duration | Easing |
|-----------|----------|--------|
| Skeleton shimmer | 1500ms | linear |
| Breathing glow | 3000ms | ease-in-out |
| Loading spinner | 1000ms | linear |
| Streak fire particles | 800ms | ease-out (per particle) |
| Pulse ripple | 1500ms | ease-out |

---

## 11.13 Animation Testing Checklist

Every new animation must pass this checklist before being merged:

- [ ] **Purpose defined:** What does this animation communicate?
- [ ] **Duration documented:** Is the duration appropriate for the context?
- [ ] **60fps verified:** Does the animation maintain 60fps in Chrome DevTools?
- [ ] **GPU-only properties:** Does the animation use only `transform` and `opacity`?
- [ ] **No layout thrashing:** Does the animation avoid forced reflows?
- [ ] **Reduced motion:** Does the animation respect `prefers-reduced-motion`?
- [ ] **Interruption handling:** What happens if the user triggers a new action mid-animation?
- [ ] **Low-end device tested:** Does the animation perform on minimum-spec devices?
- [ ] **Battery impact:** Does the animation have acceptable battery impact?
- [ ] **Accessibility:** Is the animation supplementing, not replacing, visual/textual indicators?
- [ ] **Code review:** Has the animation code been reviewed by a performance-aware developer?
- [ ] **Analytics:** Is the animation tracked for performance issues?

---

## 11.14 Summary

The FOCUS motion system creates a living, breathing interface that communicates state, provides feedback, and delights users. Every animation is purposeful, performant, and respectful of user preferences.

Key principles enforced throughout:
1. **Purpose over decoration:** Every animation serves feedback, navigation, or delight
2. **Performance is non-negotiable:** 60fps minimum, GPU-accelerated properties only
3. **Springs over easings:** Physics-based animations create natural, organic motion
4. **Reduced motion always supported:** System preference and user override respected
5. **Measurable quality:** Performance budgets, monitoring, and testing checklists
6. **Emotional design:** Micro-moments, transition moments, celebration moments, ambient moments
7. **Interruptibility:** All animations can be interrupted and transition smoothly to new states

---

*Next: Chapter 12 — Sound & Haptic Design*
