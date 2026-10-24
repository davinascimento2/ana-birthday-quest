# Product Truth: A Sinfonia de Ana Gleice

## Purpose & Positioning
An interactive 3D WebGL storybook experience and birthday gift created by Davi (toadbigode) for Ana Gleice, a talented musician. The application blends gentle cel-shaded aesthetics (reminiscent of Zelda: The Wind Waker and Studio Ghibli) with a 100% procedural Web Audio acoustic synthesizer to deliver a personal romantic narrative organized in 3 distinct realms.

## Primary User & Situation
- **Primary User**: Ana Gleice (musicista, birthday celebrant).
- **Situation**: Walking through an interactive, poetic 3D world on mobile or desktop, listening to procedural acoustic piano/plucks, interacting with Toadbigode, and discovering the 3 reasons for love leading to the emotional birthday climax.
- **Mode**: Experience. The 3D world and narrative journey are the central artifact; all HUD elements and interface controls must recede and remain quiet, refined, and non-distracting.

## Core Mechanics & Constraints
- **Zero Asset Dependencies**: 100% procedural 3D primitives (Three.js r128) and real-time procedural Web Audio API synthesis.
- **Story Structure**:
  - Level 1: Bosque das Melodias (Reason 1: Her musical sensitivity)
  - Level 2: Planetário dos Sonhos Cósmicos (Reason 2: Her serene strength and guidance)
  - Level 3: Jardim do Luar (Reason 3: Life together, Toadbigode reveal into Davi, 5-phase hug, candle lighting, birthday cake)
- **Essential Features**:
  - Top storybook HUD (Stage indicator, Love letter reader, Souvenir photo capture, Audio mute toggle).
  - Typewriter dialogue box with character avatars and clean typography.
  - Polaroid screenshot souvenir downloader.
- **Design Standard**: Impeccable (no AI slop, no visual noise, no mismatched neon borders, no distracting emoji clutter, elegant quiet typography).

## MVP & Flow Acceptance Criteria
1. **Prologue & Stage 1**: Ana spawns in Bosque das Melodias with Toadbigode. Approaching the Altar da Harpa triggers Reason 1 dialogue; entering the portal transitions smoothly to Stage 2.
2. **Stage 2**: Planetário dos Sonhos features celestial platforms, lilac nebula, and star dust. Proximity trigger unlocks Reason 2 dialogue and portal to Stage 3.
3. **Stage 3 & Climax**: Nocturnal fairy-tale garden with cherry blossoms. Approaching the birthday cake triggers:
   - Magical reveal transforming Toadbigode into Davi.
   - 5-phase procedural romantic embrace animation.
   - Birthday candles lit with melodic acoustic hymn fanfare.
   - Animated love letter scroll modal unfolding with Reason 3.
   - Polaroid souvenir snapshot tool capturing canvas + dedication into PNG download.

## Workspace Context
The repository also maintains a Roblox Luau project (`DopamineCrush.rbxl`) with its own source tree in `src/`, managed via Rokit, Wally, Selene, and StyLua. Both environments coexist with distinct canonical commands and quality gates.

## Maintenance
Update this document when the objective, scope, constraints, or acceptance criteria change. Technical architecture belongs in `docs/architecture.md` and verification records in `docs/setup.md`.
