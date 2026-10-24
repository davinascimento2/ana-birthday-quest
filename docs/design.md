# Design and Interface

---
name: A Sinfonia de Ana Gleice
description: Storybook Ghibli/Zelda cel-shaded interactive birthday experience with acoustic warmth
colors:
  primary: "#f59e0b"
  primary-glow: "rgba(245, 158, 11, 0.15)"
  surface-dark: "rgba(15, 23, 42, 0.78)"
  surface-border: "rgba(255, 255, 255, 0.12)"
  surface-border-focus: "rgba(251, 191, 36, 0.4)"
  text-primary: "#f8fafc"
  text-muted: "#94a3b8"
  parchment-bg: "#fffdf5"
  parchment-border: "#d97706"
  parchment-text: "#451a03"
typography:
  display:
    fontFamily: "Fredoka, Quicksand, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "Quicksand, Nunito, sans-serif"
    fontWeight: 500
  handwriting:
    fontFamily: "Caveat, cursive"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
  full: "9999px"
---

## Overview

A peaceful, warm, cel-shaded romantic storybook realm. The surface mode is **Experience**: the 3D scene, music, and emotional storytelling take full prominence. The UI must never fight with the 3D viewport.

For the Luau/Roblox side of the workspace (`DopamineCrush.rbxl`), visual criteria apply to Roblox Studio UI instances within screen space boundaries, maintaining clean contrast and responsive scaling.

## Colors & Atmosphere

- **Atmospheric Glass**: Deep midnight slate (`rgba(15, 23, 42, 0.78)`) with backdrop blur (`16px`).
- **Unified Accent**: Soft warm gold (`#f59e0b`, `#fbbf24`) reflecting candlelight and musical warmth.
- **Parchment**: Antique cream (`#fffdf5`) with natural sepia text for the handwritten love letter.
- **Rule**: No rainbow neon outlines. Buttons share a unified, understated glass border with warm gold focus states.

## Typography

- **Headings & Titles**: `Fredoka` for gentle storybook titles with rounded terminals.
- **Body & Dialogue**: `Quicksand` for effortless readability and calm letterforms.
- **Letter Parchment**: `Caveat` for Davi's heartfelt handwritten notes.

## Layout & Hierarchy

- **HUD (Top)**: Minimal floating bar. Stage indicator anchored top-left; action controls grouped top-right with balanced spacing.
- **Dialogue (Bottom)**: Centered narrative card elevated above the ground plane, with ample breathing room.
- **Zero Nested Cards**: Content sits directly in its container without boxed sub-containers.

## Elevation & Depth

- Subtle multi-layered soft shadows with directional offset (`rgba(0, 0, 0, 0.35)`).
- No zero-blur neon halos or aggressive colored glows.

## Do's and Don'ts

- **DO**: Keep HUD controls quiet and cohesive so the 3D world shines.
- **DO**: Use clean, authentic icons or concise text labels with explicit `aria-label` tags for screen readers.
- **DON'T**: Scatter decorative emojis (`🌸`, `🍃`, `✨`, `🍄`) into every heading and button.
- **DON'T**: Use loud multi-stop gradient buttons (`pink-to-amber`) or neon borders (`cyan` next to `pink` next to `amber`).
- **DON'T**: Add bouncing or pulsing animation loops that distract the eye while reading.
- **DON'T**: Nest cards inside cards in modals or overlays.
