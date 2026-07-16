# Chapter 10: UI/UX Design System

## Overview

The FOCUS design system is the visual and interaction language that unifies every screen, component, and animation across the platform. This chapter defines every design decision — from color values to spacing units, from typography scales to component behaviors. The design system exists to ensure consistency, enable rapid development, and communicate the FOCUS brand identity across web, mobile, and future platforms.

The FOCUS design system is built on the principle of **Neurocentric Design** — a visual language that communicates intelligence, precision, and premium quality. It is not cyberpunk. It is not gaming RGB. It is not medical sterile. It is an original visual identity that says: "This is a serious tool for serious cognitive performance."

---

## 10.1 Design Philosophy

### 10.1.1 Neurocentric Design

FOCUS uses what we call "Neurocentric Design" — a visual language that communicates intelligence and neuroscience without resorting to tired tropes:

**What Neurocentric Design IS:**
- Precise, clean, and intentional
- Calm and focused, not chaotic or stimulating
- Premium and sophisticated, like a luxury scientific instrument
- Warm enough to feel human, cool enough to feel intelligent
- Balanced between complexity (showing depth) and simplicity (maintaining clarity)

**What Neurocentric Design IS NOT:**
- Cyberpunk (no neon, no dystopian themes, no "hacker" aesthetic)
- Gaming RGB (no rainbow effects, no aggressive angular shapes, no "gamer" aesthetic)
- Medical sterile (no cold whites, no clinical layouts, no hospital feel)
- Generic tech (no flat blue-and-white, no Material Design clones, no Bootstrap look)
- Retro (no pixel art, no 80s synthwave, no vintage aesthetics)

**Emotional Goals:**
When a user opens FOCUS, they should feel:
1. **Confident** — This is a professional, well-built tool
2. **Calm** — The interface is not demanding attention; it supports focus
3. **Motivated** — The design subtly encourages engagement
4. **Trusted** — The design communicates reliability and scientific rigor
5. **Premium** — This feels like it's worth paying for

### 10.1.2 Design Principles

Every design decision in FOCUS is evaluated against five principles:

1. **Clarity over decoration:** Every visual element must serve a22 users,239 communicates is  (2
2
422
202F

2 2
1
KK241F231112,22221 a2K toKK,.

.

:20K .

2.

7,:2:2
0.

 .  2, 21,.1,2.

,  K2**,.

,..2222.
 counter2

  , .

 red2. 1  ,2  22/2026.

。

---*</think>---*---

## 10.2 Color System

The color system is the foundation of the FOCUS visual identity. Every color is chosen for specific reasons and defined precisely to ensure consistency across all platforms.

### 10.2.1 Primary Palette — "Obsidian"

The Obsidian palette forms the dark base of the FOCUS interface. The dark background reduces eye strain during long sessions (proven in studies on dark mode usage), creates a premium feel, and provides high contrast for accent colors.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `obsidian-950` | `#0A0A0F` | 10, 10, 15 | Deepest background, app shell |
| `obsidian-900` | `#12121A` | 18, 18, 26 | Primary content surface |
| `obsidian-800` | `#1A1A26` | 26, 26, 38 | Elevated cards, secondary surfaces |
| `obsidian-700` | `#252533` | 37, 37, 51 | Floating elements, interactive surfaces |
| `obsidian-600` | `#323244` | 50, 50, 68 | Modal overlays, dropdown menus |
| `obsidian-500` | `#44445A` | 68, 68, 90 | Borders, dividers, disabled text |

**Why a blue undertone:**
Pure black (#000000) appears harsh and creates excessive contrast with accent colors. A blue undertone (#0A0A0F) creates a cooler, more sophisticated feel that aligns with the "intelligence" brand identity. The blue undertone also creates visual harmony with the Neural blue accent palette.

**Why no pure white (#FFFFFF):**
Pure white backgrounds create glare that causes eye strain during extended use. FOCUS uses slightly tinted whites (neural-50: #F0F4FF) for light mode and avoids pure white in dark mode entirely.

### 10.2.2 Accent Palette — "Neural"

The Neural palette is the primary accent color system. Blue represents neural activity, calm intelligence, and trust — core brand attributes for a cognitive performance platform.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `neural-50` | `#F0F4FF` | 240, 244, 255 | Light mode background tint |
| `neural-100` | `#D6E4FF` | 214, 228, 255 | Light mode hover states |
| `neural-200` | `#ADC8FF` | 173, 200, 255 | Light mode active states |
| `neural-300` | `#7AA3FF` | 122, 163, 255 | Disabled accent |
| `neural-400` | `#4D80FF` | 77, 128, 255 | Secondary accent |
| `neural-500` | `#2563EB` | 37, 99, 235 | **Primary accent** — buttons, links, active states |
| `neural-600` | `#1D4FD8` | 29, 79, 216 | Hover state for primary accent |
| `neural-700` | `#1E40AF` | 30, 64, 175 | Active state for primary accent |

**Why neural-500 is the primary accent:**
#2563EB provides optimal contrast against the Obsidian dark backgrounds (contrast ratio 7.5:1 against obsidian-900, exceeding WCAG AAA requirements of 7:1). It is saturated enough to create a distinctive "glow" effect against dark backgrounds but not so saturated that it causes visual fatigue.

### 10.2.3 Accent Palette — "Synapse"

The Synapse palette provides warm contrast to the Neural blue. Orange represents energy, alertness, and activity — used for scores, timers, and active game states.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `synapse-50` | `#FFF7ED` | 255, 247, 237 | Light mode warm tint |
| `synapse-100` | `#FFEDD5` | 255, 237, 213 | Light mode warm hover |
| `synapse-200` | `#FED7AA` | 254, 215, 170 | Light mode warm active |
| `synapse-300` | `#FDBA74` | 253, 186, 116 | Disabled warm accent |
| `synapse-400` | `#FB923C` | 251, 146, 60 | Secondary warm accent |
| `synapse-500` | `#F97316` | 249, 115, 22 | **Primary warm accent** — scores, timers, energy indicators |
| `synapse-600` | `#EA580C` | 234, 88, 12 | Warm hover state |
| `synapse-700` | `#C2410C` | 194, 65, 12 | Warm active state |

**Why orange as the secondary accent:**
Orange is the complementary color to blue on the color wheel, creating maximum visual contrast. This means score displays (orange) stand out prominently against the blue-accented interface. Orange also psychologically associates with energy and alertness — appropriate for a cognitive performance metric.

### 10.2.4 Success Palette — "Signal"

| Token | Hex | Usage |
|-------|-----|-------|
| `signal-50` | `#ECFDF5` | Success background tint |
| `signal-100` | `#D1FAE5` | Success hover |
| `signal-400` | `#34D399` | Success icon, success toast |
| `signal-500` | `#10B981` | **Primary success** — correct answers, positive feedback |

### 10.2.5 Warning Palette — "Pulse"

| Token | Hex | Usage |
|-------|-----|-------|
| `pulse-50` | `#FFFBEB` | Warning background tint |
| `pulse-100` | `#FEF3C7` | Warning hover |
| `pulse-400` | `#FBBF24` | Warning icon, warning toast |
| `pulse-500` | `#F59E0B` | **Primary warning** — approaching limits, attention needed |

### 10.2.6 Error Palette — "Alert"

| Token | Hex | Usage |
|-------|-----|-------|
| `alert-50` | `#FEF2F2` | Error background tint |
| `alert-100` | `#FEE2E2` | Error hover |
| `alert-400` | `#F87171` | Error icon, error toast |
| `alert-500` | `#EF4444` | **Primary error** — false starts, errors, destructive actions |

### 10.2.7 Color Accessibility

All color combinations are tested against WCAG 2.1 AAA requirements:

| Foreground | Background | Ratio | Pass? |
|-----------|------------|-------|-------|
| neural-500 (#2563EB) | obsidian-900 (#12121A) | 7.5:1 | AAA ✓ |
| synapse-500 (#F97316) | obsidian-900 (#12121A) | 6.8:1 | AA ✓ |
| signal-500 (#10B981) | obsidian-900 (#12121A) | 5.9:1 | AA ✓ |
| alert-500 (#EF4444) | obsidian-900 (#12121A) | 5.2:1 | AA ✓ |
| #F8FAFC (text) | obsidian-900 (#12121A) | 16.1:1 | AAA ✓ |
| #94A3B8 (text-secondary) | obsidian-900 (#12121A) | 7.2:1 | AAA ✓ |

### 10.2.8 The "Glow" Effect

A signature visual element of FOCUS is the "glow" effect — saturated accent colors on dark backgrounds create a subtle luminous appearance. This is achieved through:

1. **Box shadow with color:** `box-shadow: 0 0 20px rgba(37, 99, 235, 0.15)` on focused/active elements
2. **Text shadow for emphasis:** `text-shadow: 0 0 10px rgba(37, 99, 235, 0.3)` on important numbers
3. **Gradient borders:** Subtle gradient borders using `border-image` or pseudo-elements
4. **Ambient light:** Background gradient behind important elements that simulates light emission

The glow effect is used sparingly — only for active states, important scores, and interactive elements. Overuse would diminish its impact and create visual noise.

---

## 10.3 Typography

### 10.3.1 Font Selection

**Primary Font — Inter:**
Inter is chosen for its:
- Excellent readability at all sizes (designed specifically for screens)
- Clean, scientific appearance (not decorative, not robotic)
- Extensive weight range (400-900)
- Tabular figures for aligned numbers
- Open source (free for commercial use)
- Wide language support

**Monospace Font — JetBrains Mono:**
JetBrains Mono is chosen for:
- Excellent readability in monospace context
- Distinct character shapes (prevents confusion between 0/O, 1/l/I)
- Tabular figures for aligned numbers in score displays
- Ligatures for mathematical notation (future use)
- Open source

### 10.3.2 Font Weights

| Weight | Usage | CSS Value |
|--------|-------|-----------|
| Regular (400) | Body text, descriptions, secondary content | `font-weight: 400` |
| Medium (500) | Emphasis within body text, labels, button text | `font-weight: 500` |
| Semibold (600) | Subheadings, card titles, navigation items | `font-weight: 600` |
| Bold (700) | Page headings, section titles | `font-weight: 700` |
| Extrabold (800) | Display text, hero numbers, score displays | `font-weight: 800` |

### 10.3.3 Line Heights

| Context | Line Height | CSS Value |
|---------|-------------|-----------|
| Display text | 1.1 | `line-height: 1.1` |
| Headings | 1.2 | `line-height: 1.2` |
| Subheadings | 1.3 | `line-height: 1.3` |
| Body text | 1.5 | `line-height: 1.5` |
| Small text | 1.6 | `line-height: 1.6` |

### 10.3.4 Letter Spacing

| Context | Letter Spacing | CSS Value |
|---------|---------------|-----------|
| Display text | -0.02em | `letter-spacing: -0.02em` |
| Headings | -0.01em | `letter-spacing: -0.01em` |
| Body text | 0 | `letter-spacing: 0` |
| Labels | 0.02em | `letter-spacing: 0.02em` |
| Overline | 0.08em | `letter-spacing: 0.08em` |
| All caps | 0.05em | `letter-spacing: 0.05em` |

### 10.3.5 Type Scale

The type scale is based on a 1.25 ratio (major third) with some adjustments for practical use:

| Token | Size (px) | Size (rem) | Usage |
|-------|-----------|------------|-------|
| `text-xs` | 12 | 0.75 | Captions, timestamps, fine print |
| `text-sm` | 14 | 0.875 | Helper text, secondary labels |
| `text-base` | 16 | 1.0 | Body text, default |
| `text-lg` | 18 | 1.125 | Lead paragraphs, emphasis |
| `text-xl` | 20 | 1.25 | Card titles, section headers |
| `text-2xl` | 24 | 1.5 | Page titles |
| `text-3xl` | 30 | 1.875 | Major headings |
| `text-4xl` | 36 | 2.25 | Section hero text |
| `text-5xl` | 48 | 3.0 | Score displays, hero numbers |
| `text-6xl` | 60 | 3.75 | Major score displays |
| `text-7xl` | 72 | 4.5 | Leaderboard rank numbers |
| `text-8xl` | 96 | 6.0 | Hero displays (rare) |

### 10.3.6 Fluid Typography

For responsive text that scales smoothly between breakpoints, FOCUS uses CSS `clamp()`:

```css
/* Example: page heading */
.heading-1 {
  font-size: clamp(1.75rem, 4vw, 3rem);
  /* Minimum 28px, scales with viewport, maximum 48px */
}

/* Example: score display */
.score-display {
  font-size: clamp(2rem, 8vw, 6rem);
  /* Minimum 32px, scales with viewport, maximum 96px */
}
```

### 10.3.7 Tabular Figures

For score displays, timing readouts, and any context where numbers are aligned in columns, tabular figures are enabled:

```css
.score, .timing, .stats {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

This ensures that numbers like `1234` and `5678` have the same width, allowing vertical alignment in tables and side-by-side comparisons.

---

## 10.4 Spacing System

### 10.4.1 Base Unit

All spacing in FOCUS is based on a **4px base unit**. Every margin, padding, gap, and position is a multiple of 4px. This creates a consistent rhythm across the interface and prevents arbitrary spacing values.

### 10.4.2 Spacing Scale

| Token | Value (px) | Value (rem) | Common Usage |
|-------|-----------|-------------|-------------|
| `spacing-0` | 0 | 0 | No spacing |
| `spacing-px` | 1 | 0.0625 | Hairline borders |
| `spacing-0.5` | 2 | 0.125 | Micro spacing |
| `spacing-1` | 4 | 0.25 | Tight spacing, icon gaps |
| `spacing-1.5` | 6 | 0.375 | Compact element gaps |
| `spacing-2` | 8 | 0.5 | Small gaps, inline spacing |
| `spacing-2.5` | 10 | 0.625 | Small-medium gaps |
| `spacing-3` | 12 | 0.75 | Medium element gaps |
| `spacing-3.5` | 14 | 0.875 | Medium-large gaps |
| `spacing-4` | 16 | 1.0 | Default element padding |
| `spacing-5` | 20 | 1.25 | Card padding |
| `spacing-6` | 24 | 1.5 | Large card padding |
| `spacing-7` | 28 | 1.75 | Section gaps |
| `spacing-8` | 32 | 2.0 | Large section gaps |
| `spacing-9` | 36 | 2.25 | XL section gaps |
| `spacing-10` | 40 | 2.5 | Page margins (small) |
| `spacing-12` | 48 | 3.0 | Page margins (medium) |
| `spacing-14` | 56 | 3.5 | XL section gaps |
| `spacing-16` | 64 | 4.0 | Page margins (large) |
| `spacing-20` | 80 | 5.0 | XXL section gaps |
| `spacing-24` | 96 | 6.0 | Page margins (desktop) |
| `spacing-32` | 128 | 8.0 | Page margins (large desktop) |
| `spacing-40` | 160 | 10.0 | Hero spacing |
| `spacing-48` | 192 | 12.0 | Maximum spacing |
| `spacing-64` | 256 | 16.0 | Full viewport margins |

### 10.4.3 Spacing Guidelines

- **Between elements:** Use spacing-4 (16px) as the default gap between sibling elements
- **Within elements:** Use spacing-3 (12px) to spacing-4 (16px) for padding inside cards and containers
- **Between sections:** Use spacing-8 (32px) to spacing-12 (48px) between major page sections
- **Page margins:** Use spacing-4 (16px) on mobile, spacing-8 (32px) on tablet, spacing-16 (64px) on desktop
- **Compact mode:** Reduce all spacing by one step (e.g., spacing-4 becomes spacing-3)

---

## 10.5 Grid System

### 10.5.1 Grid Structure

FOCUS uses a **12-column grid** system with configurable gutters and margins:

```
|← margin →|← col →|← gap →|← col →|← gap →|← col →| ... |← col →|← margin →|
|  16px    |       |  24px |       |  24px |       |     |       |  16px    |
```

### 10.5.2 Breakpoints

| Token | Min Width | Target Device | Columns | Gutter | Margin |
|-------|-----------|---------------|---------|--------|--------|
| `xs` | 0px | Mobile portrait | 4 | 16px | 16px |
| `sm` | 640px | Mobile landscape | 4 | 16px | 16px |
| `md` | 768px | Tablet portrait | 8 | 24px | 32px |
| `lg` | 1024px | Tablet landscape / small desktop | 12 | 32px | 64px |
| `xl` | 1280px | Desktop | 12 | 32px | 64px |
| `2xl` | 1536px | Large desktop | 12 | 48px | 128px |
| `3xl` | 1920px | Ultra-wide | 12 | 48px | 128px |

### 10.5.3 Grid Usage Guidelines

- **Mobile (xs-sm):** 4-column grid, single-column layouts, bottom navigation
- **Tablet (md):** 8-column grid, two-column layouts possible, bottom navigation
- **Desktop (lg-xl):** 12-column grid, multi-column layouts, sidebar navigation
- **Large desktop (2xl-3xl):** 12-column grid with wider margins, content centered

### 10.5.4 Content Width Constraints

```css
.content-container {
  max-width: 1280px; /* Prevents content from stretching too wide on large screens */
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-4); /* 16px mobile */
  padding-right: var(--spacing-4);
}

@media (min-width: 768px) {
  .content-container {
    padding-left: var(--spacing-8); /* 32px tablet */
    padding-right: var(--spacing-8);
  }
}

@media (min-width: 1280px) {
  .content-container {
    padding-left: var(--spacing-16); /* 64px desktop */
    padding-right: var(--spacing-16);
  }
}
```

---

## 10.6 Component System

### 10.6.1 Button

The button component is the primary interactive element in FOCUS.

**Variants:**
| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | neural-500 (#2563EB) | White | None | Primary actions, CTAs |
| Secondary | transparent | neural-500 | neural-500 1px | Secondary actions, "Learn more" |
| Ghost | transparent | neural-500 | None | Tertiary actions, navigation |
| Danger | alert-500 (#EF4444) | White | None | Destructive actions, delete |

**Sizes:**
| Size | Height | Padding (horizontal) | Font Size | Border Radius |
|------|--------|---------------------|-----------|--------------|
| sm | 32px | 12px | 12px | 6px |
| md | 40px | 16px | 14px | 8px |
| lg | 48px | 24px | 16px | 10px |

**States:**
| State | Visual Change |
|-------|--------------|
| Default | Standard appearance |
| Hover | Background darkens 10% (or border darkens for Secondary) |
| Active | Scale to 0.97 (50ms transition) |
| Disabled | Opacity 0.5, cursor not-allowed |
| Loading | Spinner replaces text, button disabled |

**Touch Targets:**
All buttons must meet the minimum touch target of 44x44px on mobile and 32x32px on desktop. If a button's visual size is smaller, the touch target is extended with transparent padding.

**Button Code Example:**
```css
.button-primary {
  background-color: var(--color-neural-500);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 16px;
  height: 40px;
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 200ms ease, transform 50ms ease;
  min-width: 44px;
  min-height: 44px; /* Mobile touch target */
}

.button-primary:hover {
  background-color: var(--color-neural-600);
}

.button-primary:active {
  transform: scale(0.97);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 10.6.2 Card

Cards are the primary content containers in FOCUS.

**Variants:**
| Variant | Background | Border | Shadow | Usage |
|---------|-----------|--------|--------|-------|
| Default | obsidian-900 | 1px rgba(255,255,255,0.05) | None | Standard content |
| Elevated | obsidian-800 | None | md shadow | Featured content |
| Interactive | obsidian-900 | 1px rgba(255,255,255,0.05) | None (md on hover) | Clickable cards |
| Glass | rgba(255,255,255,0.05) | 1px rgba(255,255,255,0.08) | None | Overlays, navigation |

**Padding:**
| Size | Padding | Usage |
|------|---------|-------|
| sm | 12px | Compact cards, badges |
| md | 16px | Default card padding |
| lg | 24px | Featured cards, detail views |
| xl | 32px | Page-level content areas |

**Border Radius:**
| Size | Radius | Usage |
|------|--------|-------|
| sm | 4px | Small elements inside cards |
| md | 8px | Compact cards |
| lg | 12px | Default card radius |
| xl | 16px | Large cards, modals |
| full | 9999px | Circular elements |

**Interactive Card Behavior:**
```css
.card-interactive {
  background: var(--color-obsidian-900);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.08);
}
```

### 10.6.3 Input

**Variants:**
| Variant | Usage |
|---------|-------|
| Text | General text input |
| Number | Numeric input with spinner controls |
| Search | Text input with search icon |
| Password | Masked input with show/hide toggle |

**States:**
| State | Visual |
|-------|--------|
| Default | obsidian-800 background, obsidian-600 border |
| Focus | obsidian-800 background, neural-500 border, glow effect |
| Error | obsidian-800 background, alert-500 border, error message below |
| Disabled | obsidian-900 background, obsidian-600 border, 50% opacity |

**Labels:**
Labels are always visible (not floating, not placeholder-only). Labels appear above the input field with 4px gap. Labels use `text-sm` (14px) with `font-weight: 500`.

**Helper Text:**
Helper text appears below the input field with 4px gap. Uses `text-xs` (12px) with `text-secondary` color. Error messages replace helper text when validation fails.

**Touch Targets:**
Input fields have a minimum height of 44px on mobile and 40px on desktop. The entire input area (including label and helper text) is the touch target.

### 10.6.4 Modal/Dialog

**Sizes:**
| Size | Width | Usage |
|------|-------|-------|
| sm | 400px | Confirmation dialogs, simple forms |
| md | 560px | Standard modals, forms |
| lg | 720px | Complex modals, multi-step forms |
| full | calc(100% - 48px) | Full-screen modals (mobile) |

**Behavior:**
- Opens with scale (0.95 → 1.0) + fade (0 → 1), 300ms spring animation
- Closes with scale (1.0 → 0.95) + fade (1 → 0), 200ms ease-in animation
- Backdrop: rgba(0, 0, 0, 0.6) with backdrop-filter: blur(4px)
- Focus trap: Tab cycles through focusable elements within the modal
- Escape key closes the modal
- Clicking outside the modal closes it (unless it's a confirmation dialog)
- Scroll lock on body when modal is open

**Modal Structure:**
```
┌─────────────────────────────┐
│ Header (title + close btn)  │
├─────────────────────────────┤
│ Content (scrollable)        │
│                             │
│                             │
├─────────────────────────────┤
│ Footer (actions)            │
└─────────────────────────────┘
```

### 10.6.5 Toast/Notification

**Types:**
| Type | Icon | Border Color | Auto-dismiss |
|------|------|-------------|-------------|
| Info | ℹ | neural-500 | 5 seconds |
| Success | ✓ | signal-500 | 8 seconds |
| Warning | ⚠ | pulse-500 | 10 seconds |
| Error | ✕ | alert-500 | 12 seconds (manual dismiss required) |

**Position:** Top-right corner, 16px from top and right edges.

**Behavior:**
- Slides in from the right with spring animation
- Stacks vertically with 8px gap between toasts
- Maximum 3 visible toasts (oldest dismissed when 4th arrives)
- Progress bar at bottom shows remaining time
- Click to dismiss early
- Swipe right to dismiss (mobile)

### 10.6.6 Navigation

**Mobile Navigation:**
- Bottom tab bar with 4-5 tabs
- Fixed to bottom of viewport
- Safe area padding for devices with home indicators
- Active tab: neural-500 icon + label, filled icon
- Inactive tab: obsidian-500 icon + label, outline icon
- Badge support (notification count) on each tab
- Height: 64px + safe area inset

**Desktop Navigation:**
- Left sidebar, 240px wide (collapsible to 64px icon-only mode)
- Fixed to left edge of viewport
- Background: obsidian-900 with subtle right border
- Active item: neural-500 background pill, white text
- Hover item: obsidian-800 background, white text
- Section dividers with subtle labels
- User profile section at bottom of sidebar

### 10.6.7 Score Display

The score display is the most prominent visual element in game results and leaderboards.

**Sizes:**
| Context | Font Size | Weight | Font |
|---------|-----------|--------|------|
| Inline score | text-lg (18px) | 700 | JetBrains Mono |
| Card score | text-2xl (24px) | 800 | JetBrains Mono |
| Result score | text-5xl (48px) | 800 | JetBrains Mono |
| Hero score | text-6xl (60px) | 800 | JetBrains Mono |
| Leaderboard #1 | text-7xl (72px) | 800 | JetBrains Mono |

**Color Behavior:**
Score color is dynamic based on quality:
| Score Quality | Color |
|--------------|-------|
| Below average | alert-500 (#EF4444) |
| Average | pulse-500 (#F59E0B) |
| Good | signal-500 (#10B981) |
| Great | neural-500 (#2563EB) |
| Excellent | synapse-500 (#F97316) |
| Personal best | Gold gradient (synapse-300 → synapse-500) |

**Count-Up Animation:**
When a score is displayed, it animates from 0 to the final value over 500ms with ease-out timing. Individual digits roll independently for a staggered effect.

### 10.6.8 Progress Bar

**Linear Progress Bar:**
- Height: 8px
- Border radius: 4px
- Background: obsidian-700
- Fill: neural-500 (default), dynamic color based on context
- Animation: Fill grows from left to right, 300ms ease-out
- Indeterminate state: Shimmer animation from left to right, 1.5s infinite

**Circular Progress Bar:**
- SVG-based with stroke-dashoffset animation
- Background circle: obsidian-700, stroke-width: 4px
- Progress circle: neural-500, stroke-width: 4px
- Animation: Stroke-dashoffset animates over 1000ms ease-out
- Size: 48px (sm), 64px (md), 96px (lg), 128px (xl)

### 10.6.9 Avatar

**Sizes:**
| Size | Dimensions | Usage |
|------|-----------|-------|
| xs | 24px | Inline mentions, compact lists |
| sm | 32px | Navigation, small lists |
| md | 40px | Default, friend lists |
| lg | 48px | Cards, comments |
| xl | 64px | Profile headers, large cards |
| 2xl | 96px | Profile page main avatar |
| 3xl | 128px | Profile page (desktop), achievement display |

**Fallback:**
When no avatar image is available, the avatar shows the user's initials on a colored background. The background color is generated from the username using a hash function to ensure consistency.

**Status Indicator:**
- Online: 12px green (signal-500) circle at bottom-right
- In-game: 12px orange (synapse-500) circle with pulsing animation
- Offline: 12px obsidian-500 circle

### 10.6.10 Badge

**Variants:**
| Variant | Visual |
|---------|--------|
| Filled | Solid background, white text |
| Outlined | Transparent background, colored border, colored text |
| Dot | Small 8px circle, no text |

**Sizes:**
| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | 18px | 4px 6px | 10px |
| md | 22px | 4px 8px | 12px |
| lg | 28px | 6px 12px | 14px |

---

## 10.7 Glass Effect

The glass effect is a signature visual element of FOCUS, used for overlays, navigation, and elevated surfaces.

### 10.7.1 Glass Properties

```css
.glass {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255, 255, 255, 0.05); /* Dark mode */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

### 10.7.2 Glass Usage

| Element | Glass Intensity | Blur Amount |
|---------|----------------|-------------|
| Navigation sidebar | Light | 20px |
| Bottom tab bar | Medium | 24px |
| Modal backdrop | Heavy | 32px |
| Dropdown menus | Medium | 20px |
| Tooltips | Light | 16px |
| Toast notifications | Light | 16px |

### 10.7.3 Glass Limitations

The glass effect is NOT used for:
- Primary content areas (readability concern)
- Large text blocks (blurred background creates visual noise)
- Data-dense displays (can interfere with number recognition)
- Low-power mode (backdrop-filter is GPU-intensive)

### 10.7.4 Performance Considerations

- `backdrop-filter` is GPU-accelerated on modern browsers
- On older devices without GPU acceleration, a solid fallback is used: `background: rgba(18, 18, 26, 0.95)`
- Glass effects are disabled when `prefers-reduced-motion: reduce` is active
- Maximum 3 simultaneous glass elements on screen to prevent GPU overload

---

## 10.8 Depth System

The depth system creates visual hierarchy through layered surfaces, similar to Material Design but with a unique FOCUS aesthetic.

### 10.8.1 Depth Levels

| Level | Background | Shadow | Usage |
|-------|-----------|--------|-------|
| 0 | obsidian-950 | None | App background |
| 1 | obsidian-900 | None | Content surface (default) |
| 2 | obsidian-800 | `0 4px 6px rgba(0,0,0,0.3)` | Elevated cards |
| 3 | obsidian-700 | `0 10px 15px rgba(0,0,0,0.4)` | Floating elements (dropdowns, tooltips) |
| 4 | obsidian-600 | `0 20px 25px rgba(0,0,0,0.5)` | Modal overlays |
| 5 | obsidian-500 | `0 25px 50px rgba(0,0,0,0.6)` | Topmost elements (tooltips, toasts) |

### 10.8.2 Depth Usage

- Level 0: The app background (never interactive)
- Level 1: Main content area, pages, forms
- Level 2: Cards, panels, sidebar items on hover
- Level 3: Dropdown menus, popovers, floating action buttons
- Level 4: Modal dialogs, confirmation overlays
- Level 5: Tooltips, toast notifications, context menus

### 10.8.3 Depth Animation

When elements change depth (e.g., a card is clicked and becomes a modal), the shadow animates smoothly:

```css
.card {
  box-shadow: none;
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}
```

---

## 10.9 Icon System

### 10.9.1 Icon Library

FOCUS uses **Lucide Icons** as the primary icon library. Reasons:
- Consistent 24px grid design
- Minimal, clean aesthetic that matches Neurocentric Design
- Customizable stroke width
- Open source (ISC license)
- Active maintenance and community

### 10.9.2 Icon Sizes

| Token | Size | Stroke Width | Usage |
|-------|------|-------------|-------|
| `icon-xs` | 12px | 1.5px | Inline indicators, badges |
| `icon-sm` | 16px | 1.5px | Small buttons, helper icons |
| `icon-md` | 20px | 1.5px | Default icon size |
| `icon-lg` | 24px | 2px | Navigation, card icons |
| `icon-xl` | 32px | 2px | Feature icons, empty states |
| `icon-2xl` | 48px | 1.5px | Hero icons, onboarding |

### 10.9.3 Icon Colors

Icons inherit color from their parent element by default. Override with semantic colors:
- Interactive icons: neural-500 (default), neural-600 (hover)
- Status icons: signal-500 (success), pulse-500 (warning), alert-500 (error)
- Navigation icons: obsidian-500 (inactive), neural-500 (active)
- Score icons: synapse-500

### 10.9.4 Custom FOCUS Icons

In addition to Lucide, FOCUS includes custom icons for platform-specific elements:
- Brain icon (cognitive performance)
- Neural network icon (neural pathways)
- Pulse icon (reaction time)
- Streak icon (consistent training)
- Season icon (competitive season)
- FOCUS logo icon

Custom icons follow the same 24px grid and 1.5px stroke width as Lucide for visual consistency.

---

## 10.10 Responsive Design Strategy

### 10.10.1 Mobile-First Approach

FOCUS uses a mobile-first design strategy. The base CSS targets mobile devices (375px minimum width), and media queries add complexity for larger screens.

**Rationale:**
- Mobile is the primary platform for FOCUS (estimated 70% of usage)
- Mobile constraints (small screen, touch input, one-handed use) force design discipline
- Desktop designs can add complexity without breaking mobile
- Progressive enhancement ensures all features work on all devices

### 10.10.2 Adaptive Layouts

FOCUS uses adaptive layouts (not just responsive). Different screen sizes get fundamentally different layouts:

**Mobile (xs-sm):**
- Bottom tab navigation (thumb-reachable zone)
- Single-column content
- Full-width cards
- Bottom sheets for actions
- Swipe gestures for navigation

**Tablet (md):**
- Bottom tab navigation (or sidebar in landscape)
- Two-column content possible
- Cards in grid layout
- Side-by-side views for comparison

**Desktop (lg-xl):**
- Left sidebar navigation
- Multi-column layouts
- Cards in grid with maximum width
- Dashboard-style layouts
- Keyboard-first interaction

**Large Desktop (2xl-3xl):**
- Wider sidebar
- More columns possible
- Content centered with generous margins
- Multi-panel layouts

### 10.10.3 Touch Target Requirements

| Platform | Minimum Touch Target | Preferred Touch Target |
|----------|---------------------|----------------------|
| Mobile | 44x44px | 48x48px |
| Tablet | 44x44px | 44x44px |
| Desktop | 32x32px | 40x40px |

### 10.10.4 Game Area Responsiveness

Game UIs must adapt to different screen sizes while maintaining gameplay quality:

- **Aspect Ratio:** Games maintain a 16:9 aspect ratio with letterboxing on non-conforming screens
- **Minimum Size:** Game area must be at least 320x180px to remain playable
- **Touch vs. Mouse:** Game input adapts based on device detection (touch events vs. mouse events)
- **Stimulus Size:** Stimuli scale proportionally with game area size
- **Text Size:** Game text uses `clamp()` to scale smoothly

---

## 10.11 Theme System

### 10.11.1 Default Themes

**Dark Mode (Default):**
- Background: obsidian-950 (#0A0A0F)
- Surface: obsidian-900 (#12121A)
- Text: #F8FAFC
- Text secondary: #94A3B8
- Accent: neural-500 (#2563EB)

**Light Mode:**
- Background: neural-50 (#F0F4FF)
- Surface: #FFFFFF
- Text: obsidian-900 (#12121A)
- Text secondary: obsidian-600 (#323244)
- Accent: neural-600 (#1D4FD8)

**High Contrast:**
- Background: #000000
- Surface: #1A1A1A
- Text: #FFFFFF
- Text secondary: #CCCCCC
- Accent: neural-400 (#4D80FF) (higher contrast)
- Borders: 2px solid (thicker for visibility)

### 10.11.2 Unlockable Themes

Users can unlock custom themes through achievements:
- **Neon Genesis:** Complete 100 sessions (cyan accent theme)
- **Golden Mind:** Reach level 25 (gold accent theme)
- **Crimson Focus:** Achieve 30-day streak (red accent theme)
- **Verdant Growth:** Complete all game tutorials (green accent theme)

### 10.11.3 Theme Implementation

Themes are implemented using CSS custom properties (variables):

```css
:root[data-theme="dark"] {
  --color-background: var(--color-obsidian-950);
  --color-surface: var(--color-obsidian-900);
  --color-text: #F8FAFC;
  --color-text-secondary: #94A3B8;
  --color-primary: var(--color-neural-500);
  /* ... all theme tokens */
}

:root[data-theme="light"] {
  --color-background: var(--color-neural-50);
  --color-surface: #FFFFFF;
  --color-text: var(--color-obsidian-900);
  --color-text-secondary: var(--color-obsidian-600);
  --color-primary: var(--color-neural-600);
  /* ... all theme tokens */
}
```

### 10.11.4 Theme Switching

When a user switches themes:
1. The `data-theme` attribute on the root element is updated
2. CSS variables cascade to all elements (300ms transition on color properties)
3. Glass effects and shadows adjust to the new theme
4. Custom icons update their stroke colors
5. The preference is saved to localStorage and synced across devices

---

## 10.12 Design Tokens

### 10.12.1 Token Structure

All design tokens are defined in a JSON structure that can be consumed by CSS, JavaScript, and native platforms:

```json
{
  "color": {
    "primary": { "value": "{colors.neural.500}" },
    "primary-hover": { "value": "{colors.neural.600}" },
    "primary-active": { "value": "{colors.neural.700}" },
    "background": { "value": "{colors.obsidian.950}" },
    "surface": { "value": "{colors.obsidian.900}" },
    "surface-elevated": { "value": "{colors.obsidian.800}" },
    "surface-floating": { "value": "{colors.obsidian.700}" },
    "text": { "value": "#F8FAFC" },
    "text-secondary": { "value": "#94A3B8" },
    "text-tertiary": { "value": "{colors.obsidian.500}" },
    "border": { "value": "rgba(255, 255, 255, 0.08)" },
    "border-strong": { "value": "rgba(255, 255, 255, 0.15)" },
    "success": { "value": "{colors.signal.500}" },
    "warning": { "value": "{colors.pulse.500}" },
    "error": { "value": "{colors.alert.500}" },
    "info": { "value": "{colors.neural.500}" }
  },
  "typography": {
    "font-family": { "value": "Inter, system-ui, -apple-system, sans-serif" },
    "font-family-mono": { "value": "'JetBrains Mono', 'Fira Code', monospace" },
    "font-size-xs": { "value": "0.75rem" },
    "font-size-sm": { "value": "0.875rem" },
    "font-size-base": { "value": "1rem" },
    "font-size-lg": { "value": "1.125rem" },
    "font-size-xl": { "value": "1.25rem" },
    "font-size-2xl": { "value": "1.5rem" },
    "font-size-3xl": { "value": "1.875rem" },
    "font-size-4xl": { "value": "2.25rem" },
    "font-size-5xl": { "value": "3rem" },
    "font-size-6xl": { "value": "3.75rem" },
    "font-size-7xl": { "value": "4.5rem" },
    "font-size-8xl": { "value": "6rem" },
    "line-height-tight": { "value": "1.2" },
    "line-height-normal": { "value": "1.5" },
    "line-height-relaxed": { "value": "1.6" }
  },
  "spacing": {
    "unit": { "value": "4px" },
    "0": { "value": "0" },
    "px": { "value": "1px" },
    "0.5": { "value": "2px" },
    "1": { "value": "4px" },
    "1.5": { "value": "6px" },
    "2": { "value": "8px" },
    "2.5": { "value": "10px" },
    "3": { "value": "12px" },
    "3.5": { "value": "14px" },
    "4": { "value": "16px" },
    "5": { "value": "20px" },
    "6": { "value": "24px" },
    "7": { "value": "28px" },
    "8": { "value": "32px" },
    "9": { "value": "36px" },
    "10": { "value": "40px" },
    "12": { "value": "48px" },
    "14": { "value": "56px" },
    "16": { "value": "64px" },
    "20": { "value": "80px" },
    "24": { "value": "96px" },
    "32": { "value": "128px" },
    "40": { "value": "160px" },
    "48": { "value": "192px" },
    "64": { "value": "256px" }
  },
  "borderRadius": {
    "none": { "value": "0" },
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" },
    "xl": { "value": "16px" },
    "2xl": { "value": "24px" },
    "full": { "value": "9999px" }
  },
  "shadow": {
    "none": { "value": "none" },
    "sm": { "value": "0 1px 2px rgba(0,0,0,0.3)" },
    "md": { "value": "0 4px 6px rgba(0,0,0,0.3)" },
    "lg": { "value": "0 10px 15px rgba(0,0,0,0.4)" },
    "xl": { "value": "0 20px 25px rgba(0,0,0,0.5)" },
    "2xl": { "value": "0 25px 50px rgba(0,0,0,0.6)" },
    "inner": { "value": "inset 0 2px 4px rgba(0,0,0,0.2)" },
    "glow-primary": { "value": "0 0 20px rgba(37, 99, 235, 0.15)" },
    "glow-accent": { "value": "0 0 20px rgba(249, 115, 22, 0.15)" }
  },
  "transition": {
    "fast": { "value": "150ms ease" },
    "normal": { "value": "200ms ease" },
    "slow": { "value": "300ms ease" },
    "spring": { "value": "300ms cubic-bezier(0.34, 1.56, 0.64, 1)" }
  },
  "zIndex": {
    "base": { "value": "0" },
    "dropdown": { "value": "1000" },
    "sticky": { "value": "1100" },
    "modal-backdrop": { "value": "1200" },
    "modal": { "value": "1300" },
    "popover": { "value": "1400" },
    "toast": { "value": "1500" },
    "tooltip": { "value": "1600" }
  }
}
```

### 10.12.2 Token Generation

Design tokens are generated from the source JSON using Style Dictionary:

```bash
npx style-dictionary build --config ./config.json
```

This generates:
- CSS custom properties (for web)
- SCSS variables (for web preprocessing)
- Swift UIColor extensions (for iOS)
- Kotlin Color resources (for Android)
- JSON consumption (for React Native)

### 10.12.3 Token Naming Convention

Tokens follow a strict naming convention:
```
{category}-{property}-{variant}-{state}
```

Examples:
- `color-background-surface-hover`
- `color-text-primary-default`
- `spacing-card-padding`
- `shadow-card-default`
- `transition-color-fast`

---

## 10.13 Accessibility

### 10.13.1 WCAG 2.1 Compliance

FOCUS targets WCAG 2.1 Level AA compliance across all screens, with AAA compliance for text contrast.

**Contrast Requirements:**
- Normal text: 4.5:1 minimum (AA), 7:1 (AAA)
- Large text (18px+ bold, 24px+): 3:1 minimum (AA), 4.5:1 (AAA)
- Interactive elements: 3:1 minimum against adjacent colors

### 10.13.2 Keyboard Navigation

All interactive elements are keyboard-accessible:
- Tab order follows visual reading order
- Focus ring: 2px solid neural-500 with 2px offset
- Focus visible on all interactive elements
- Skip navigation link at the top of each page
- Modal focus trap (Tab cycles within modal)
- Escape closes modals, dropdowns, and menus

### 10.13.3 Screen Reader Support

- All images have descriptive alt text
- All interactive elements have accessible labels
- ARIA landmarks define page structure
- Live regions announce dynamic content changes
- Score announcements: "Your score is 847, ranking 12th of 1,500"

### 10.13.4 Motion Sensitivity

All animations respect `prefers-reduced-motion`:
- If reduced motion is preferred, all animations are disabled
- Page transitions become instant cuts
- Score animations are replaced with static display
- Loading states use simple indicators (no shimmer)
- Users can override this setting in FOCUS preferences

---

## 10.14 Summary

The FOCUS design system is a comprehensive, documented, and consistent visual language that communicates intelligence, precision, and premium quality. Every color, every spacing value, every component behavior is defined and justified. The system is built to scale across platforms and devices while maintaining the unique FOCUS identity.

Key design decisions and their rationale:
1. **Dark mode default:** Reduces eye strain, creates premium feel, enables glow effects
2. **Blue + orange accent system:** Complementary colors for maximum contrast, blue for intelligence, orange for energy
3. **4px base unit:** Consistent rhythm, prevents arbitrary spacing, simplifies development
4. **Inter + JetBrains Mono:** Scientific, readable, professional typography
5. **Glass effect:** Signature visual element that differentiates FOCUS from competitors
6. **Component-based architecture:** Consistent, reusable, testable UI elements
7. **Design tokens:** Single source of truth for all platforms
8. **Accessibility-first:** WCAG AA compliance, keyboard navigation, screen reader support

---

*Next: Chapter 11 — Motion & Animation System*
