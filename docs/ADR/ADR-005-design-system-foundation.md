# ADR-005: Design System Foundation

**Status:** Accepted  
**Date:** 2026-07-16

## Context

FOCUS needs a consistent, accessible, themeable UI that works across web, mobile (Capacitor), and potentially desktop (Tauri). UI decisions should not be ad-hoc.

## Decision

Use a minimal design system based on:
- **CSS Variables** for theming (dark/light/system)
- **React Context** for theme state (`useTheme` hook)
- **Atomic component hierarchy**: Atoms → Molecules → Organisms
- **Accessibility-first**: ARIA labels, keyboard navigation, focus management, `prefers-reduced-motion`

No external UI library (MUI, Chakra, etc.). Custom components only.

## Consequences

- ✅ Full control over design and performance
- ✅ No bundle bloat from UI libraries
- ✅ Accessible by default
- ❌ More initial work to build components
- ❌ Must maintain our own component library
