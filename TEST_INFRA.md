# E2E Test Infrastructure & Verification Architecture

> **Project**: *A Sinfonia de Ana Gleice* — 2D Storybook Top-Down RPG  
> **Target Framework**: Playwright (`@playwright/test ^1.50.0`)  
> **Author**: `test_writer_e2e`  
> **Date**: 2026-10-23  
> **Reference Documents**: `ORIGINAL_REQUEST.md` (Section `## 2026-10-23T01:13:02Z`), `PROJECT.md`

---

## 1. Executive Overview & Test Philosophy

This test infrastructure document formalizes the quality assurance framework for *A Sinfonia de Ana Gleice*, a 100% native 2D Canvas Top-Down Storybook RPG created as a birthday tribute for Ana Gleice by Davi (Toadbigode).

The testing architecture adheres to strict **opaque-box requirement verification**:
1. **Zero 3D / Zero Three.js Dependencies**: Verifies that the runtime is pure HTML5 2D Canvas (`CanvasRenderingContext2D`), free of WebGL Three.js overhead and external GLTF 3D models.
2. **Deterministic State Harness**: Inspects both DOM presentation layers and public test hooks (`window.__GAME_STATE__`, `window.gameApp`, `window.musicEngine`).
3. **Character Fidelity & Invariants**: Enforces strict visual paper-cutout invariants — notably that Ana Gleice is rendered **strictly WITHOUT glasses** across all frames and directions, wearing her straw hat, brown bob hair, and holding a golden sunflower.
4. **4-Tier Test Methodology**: Every feature is rigorously tested across four escalating tiers: Happy Path Feature Coverage, Boundary & Corner Conditions, Cross-Feature Pairwise Combinations, and End-to-End Real-World Scenarios.

---

## 2. The 4-Tier Testing Methodology

```
+--------------------------------------------------------------------------+
|                        TIER 4: REAL-WORLD SCENARIOS                      |
|      Full Golden Path Playthrough, Mobile Touch Journey, Offline Audit    |
+--------------------------------------------------------------------------+
|                   TIER 3: PAIRWISE & INTEGRATION MATRIX                  |
|    Input x Dialogue, Stage Warps x Audio Context, Emote x Hug Locks     |
+--------------------------------------------------------------------------+
|                     TIER 2: BOUNDARIES & STRESS TESTS                    |
|    Rapid Dialogue Skip, Map Collision Edges, Viewport Resize, Mute Burst |
+--------------------------------------------------------------------------+
|                     TIER 1: CORE FEATURE VERIFICATION                    |
|    Canvas Mount, 4-Dir Movement, 3 Stages, Altar & Puzzle, Love Letter   |
+--------------------------------------------------------------------------+
```

### Tier 1: Feature Coverage (Core Requirements)
*Minimum >= 5 test assertions per functional area.*
- **TC-T1-01 (Engine & Canvas)**: Canvas 2D element mounted in `#canvas-container`, `getContext('2d')` initialized, solid 60 FPS requestAnimationFrame loop, HiDPI devicePixelRatio handling, clean console with zero uncaught exceptions.
- **TC-T1-02 (Character Invariants)**: Ana Gleice rendered chibi paper-cutout, brown bob hair, straw hat with ribbon, sailor striped shirt, navy shorts, sunflower in hand. **Strict invariant**: Ana is rendered without glasses. Toadbigode rendered with mushroom cap, white mustache, monocle, cane, purple vest. Davi rendered with dark wavy hair, thin glasses, grey hoodie, cargo shorts, skateboard.
- **TC-T1-03 (4-Directional Movement & Camera)**: Keyboard WASD and Arrow key navigation smoothly updates coordinates across 4 cardinal directions (up, down, left, right). Camera follows player with smooth lerp and viewport clamping.
- **TC-T1-04 (Stage 1 - Bosque das Melodias)**: Grassy paths, watercolor trees, 4 collectible floating musical notes (arpeggio sequence), Altar da Harpa activation, gate unlocks to Stage 2, Toadbigode reveals Reason #1.
- **TC-T1-05 (Stage 2 - Desfiladeiro Cósmico)**: Mystical flat obsidian plane under starry nebula, floor constellation pads, harmonic music puzzle, gate/bridge unlocks to Stage 3, Toadbigode reveals Reason #2.
- **TC-T1-06 (Stage 3 - Palácio das Cerejeiras)**: Sakura temple, pink petal rain, ceremonial carpet, Birthday Cake dais, Toadbigode transforms into Davi, "O Grande Abraço" hug sequence with rising heart particles, cake candles light up (`candlesLit: true`).
- **TC-T1-07 (Love Letter & Dialogue System)**: Typewriter effect in classical golden parchment dialogue box (`#dialogue-box`), character avatars, love letter modal (`#letter-modal`) displays Davi's full heartfelt letter with all 3 reasons.
- **TC-T1-08 (Procedural Web Audio Engine)**: 100% procedural Web Audio API synthesizer, AudioContext running, stage-specific BGM themes, tactile footsteps, chime SFX, mute toggle functionality.

### Tier 2: Boundary & Corner Cases
*Minimum >= 5 test assertions per edge condition.*
- **TC-T2-01 (Map Boundaries & Collision Clamping)**: Player cannot walk beyond stage perimeter boundaries or through impassable obstacles (trees, altar walls, temple shrines). Player velocity clamps cleanly against colliders.
- **TC-T2-02 (Input Clashing & Simultaneous Keys)**: Opposing inputs (W + S or A + D pressed simultaneously) cleanly cancel out to zero displacement without jitter, NaN, or character drifting.
- **TC-T2-03 (Rapid Dialogue Skipping Stress)**: 50+ rapid click/Space key events during typewriter animation do not freeze the UI, leak timers, cause text overflow, or bypass narrative state machine completion.
- **TC-T2-04 (Dynamic Viewport Resize & Orientation)**: Resizing from Desktop (1280x720) to Mobile (390x844) to Ultrawide (1920x1080) dynamically scales canvas dimensions and camera viewports without clipping characters or stretching aspect ratios.
- **TC-T2-05 (Audio Context State Transitions)**: Autoplay policy suspension gracefully handles user unlock via `#btn-start-game`. Rapid mute toggling (`#btn-mute`) reliably flips gain nodes between 0 and 1 without click/pop audio artifacts or desyncing state.

### Tier 3: Pairwise Combinations & Cross-Feature Interactions
- **TC-T3-01 (Movement Locked During Active Dialogue)**: When dialogue modal is active (`window.__GAME_STATE__.dialogue.isActive === true`), player movement input (WASD / touch) is blocked, preventing Ana from walking away from Toadbigode or Davi mid-conversation.
- **TC-T3-02 (Stage Transition During Active Audio / Emote)**: Triggering a stage transition while an emote animation or note pickup SFX is playing cleanly transitions scenes without orphan audio nodes or broken animation timers.
- **TC-T3-03 (Emote Quickbar Interaction During Climax Hug)**: Emote buttons (`#btn-emote-1` to `#btn-emote-4`) are gracefully ignored or disabled while "O Grande Abraço" is active, preserving emotional climax staging.
- **TC-T3-04 (Love Letter Modal x Mixtape Modal Coexistence)**: Opening the Love Letter modal (`#btn-open-letter`) while the Mixtape modal (`#btn-mixtape`) is open cleanly stacks or manages focus without DOM occlusion or stuck pointer events.
- **TC-T3-05 (Mobile Touch D-Pad / Action Button Under Stage Warps)**: Virtual touch controls correctly interact with NPCs and props across all 3 stages without coordinate misalignment.

### Tier 4: Real-World Scenarios & Full User Journeys
- **TC-T4-01 (The Golden Path Playthrough)**:
  1. Splash screen start -> Web Audio unlocked -> Stage 1 Bosque.
  2. Dialogue with Toadbigode -> Reason 1 revealed.
  3. Collect 4 musical notes -> Activate Harp Altar -> Walk through portal.
  4. Enter Stage 2 Desfiladeiro Cósmico -> Reason 2 revealed -> Solve harmonic constellation puzzle.
  5. Enter Stage 3 Palácio das Cerejeiras -> Walk down ceremonial carpet -> Approach Davi.
  6. Toadbigode transforms into Davi -> "O Grande Abraço" hug triggered -> Confetti & hearts burst -> Candles ignited.
  7. Davi's love letter opened -> Full text verified -> Polaroid photo snapshot taken.
- **TC-T4-02 (Mobile User Journey)**: Full touch journey on viewport 390x844. Virtual controls visible, touch targets compliant with WCAG 2.5.5 (>= 44x44px), dialogue advanceable via tap, letter modal scrollable on mobile.
- **TC-T4-03 (100% Offline Standalone Airgap Audit)**: Zero external network requests (HTTP/HTTPS/WebSocket). Zero external CDNs. All assets (fonts, audio, scripts) served strictly from local origin.

---

## 3. Test Suites & File Organization

| Test File | Status | Role & Content |
|---|---|---|
| `ana_birthday_quest/tests/storybook_e2e.spec.js` | **ACTIVE** | Primary 4-tier requirement-driven Playwright E2E test suite for the 2D Canvas Top-Down Storybook RPG. |
| `ana_birthday_quest/tests/challenger_stress.spec.js` | **ACTIVE** | Adversarial stress testing (rapid skipping, DOM accessibility, offline network audit, state contract fidelity). |
| `ana_birthday_quest/tests/archive_3d/` | **ARCHIVED** | Isolated legacy Three.js 3D test scripts (`e2e.3d.js`, `mixtape_evolution.3d.js`, etc.) preserving historical code without interfering with 2D test execution. |

---

## 4. Execution Commands & Quality Gates

### Running the Test Suites
```powershell
# Run the complete active test suite
npm --prefix ana_birthday_quest test

# Run specifically the comprehensive 2D Storybook E2E suite
npx --prefix ana_birthday_quest playwright test tests/storybook_e2e.spec.js

# Run the adversarial stress suite
npx --prefix ana_birthday_quest playwright test tests/challenger_stress.spec.js

# Run in headed browser mode for visual review
npm --prefix ana_birthday_quest run test:headed
```

### Quality Gate Pass Criteria
- **Pass Rate**: 100% of active tests passing.
- **Console Errors**: 0 uncaught errors, warnings, or unhandled promise rejections.
- **External Requests**: 0 external network requests during page load or gameplay.
- **Frame Rate**: Stable 60 FPS requestAnimationFrame tick loop.
- **State Contracts**: `window.__GAME_STATE__` and `window.gameApp` adhering 100% to interface specifications.
