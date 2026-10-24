# Code and Architecture

## Actual Stack

The workspace comprises two complementary components:

1. **A Sinfonia de Ana Gleice (`ana_birthday_quest/`)**:
   - Engine: Three.js r128 (standalone vendor build, zero CDN dependency)
   - Runtime: HTML5 WebGL + Web Audio API synthesizer
   - Styling: CSS3 with custom parchment aesthetics, Tailwind utility classes
   - Testing & Quality: Playwright `^1.50.0`, Node.js `v24.21.0`
   - Zero external model/texture/audio assets: 100% procedural geometric primitives and synthetic harmonic audio.

2. **Roblox Luau Project (`DopamineCrush.rbxl`, `src/`)**:
   - Toolchain: Rokit `1.2.0`
   - Package Manager: Wally `0.3.2`
   - Linter: Selene `0.27.1`
   - Formatter: StyLua `0.20.0`
   - Sync: Rojo `7.4.4` (`default.project.json`)

## Code Map

```
zealous-hypatia/
├── AGENTS.md                   # Canonical AI agent instructions & working agreements
├── CLAUDE.md                   # Bridge importing AGENTS.md
├── PRODUCT.md                  # Canonical product definition & MVP scope
├── README.md                   # Repository overview & entrypoint navigation
├── docs/                       # Canonical documentation manifest
│   ├── architecture.md         # Architecture, stacks, boundaries & decisions
│   ├── design.md               # Visual design tokens, typography, HUD & storybook rules
│   ├── onboarding.md           # Local setup, runtimes & first-run guide
│   ├── quality.md              # Quality gates, linters, testing strategy & harness
│   ├── setup.md                # Vibe Coding Toolkit adoption record & matrix
│   └── task-handoff.md.template# Template for multi-session handoffs
├── ana_birthday_quest/         # 3D WebGL Storybook application
│   ├── index.html              # Web entrypoint with canvas & storybook HUD
│   ├── package.json            # Node scripts and dev dependencies
│   ├── css/style.css           # Storybook styles, parchment frames, Fredoka typography
│   ├── js/
│   │   ├── vendor/three.min.js # Standalone Three.js r128 build
│   │   ├── audio.js            # Procedural Web Audio API acoustic synthesizer
│   │   ├── dialogue.js         # Narrative dialogue controller & typewriter
│   │   ├── models.js           # Procedural 3D Chibi characters & stage props
│   │   ├── controls.js         # WASD, touch joystick & camera controller
│   │   ├── capture.js          # Polaroid souvenir photo capture system
│   │   └── main.js             # Engine loop, stage orchestration & test hooks
│   └── tests/                  # Playwright E2E & stress test suite
├── src/                        # Luau source code for Roblox game
├── Packages/                   # Wally managed Luau packages
├── default.project.json        # Rojo project configuration
├── rokit.toml                  # Rokit toolchain manifest
├── selene.toml                 # Selene lint configuration
├── stylua.toml                 # StyLua format configuration
└── wally.toml                  # Wally package manifest
```

## Boundaries and Flow

### WebGL Storybook Engine
- **Canvas / Loop (`main.js`)**: Orchestrates the Three.js scene, rendering loop, level loading, and global test hooks (`window.__GAME_STATE__`, `window.gameApp`).
- **Character Controller (`controls.js`)**: Consumes keyboard and mobile touch events, updates camera framing and Ana's coordinates.
- **Synthesizer Engine (`audio.js`)**: Generates real-time acoustic harmonic notes via Web Audio API without pre-recorded sound files.
- **Dialogue & State (`dialogue.js`)**: Advances typewriter text, triggers stage transitions, character reveals, and hugs.
- **Polaroid Exporter (`capture.js`)**: Composites canvas pixels with parchment border and dedication into a downloaded PNG.

### Luau / Roblox Boundaries
- Server and client scripts synced through `default.project.json` into `ReplicatedStorage`, `ServerScriptService`, and `StarterPlayerScripts`.
- Package dependencies isolated in `Packages/` via Wally.

## Data and Persistence

- **No Relational Database**: Both components run client-first with state managed in memory during session lifecycle. Persistence defaults (Drizzle/PostgreSQL) are intentionally omitted because the product requirements specify a standalone offline-first gift experience and client-side Roblox game.

## Decisions & Records

1. **Standalone Three.js vendor script**: Ensures complete offline reliability without network latency or external CDN outages.
2. **Procedural Web Audio**: Zero audio file downloads, infinite dynamic modulation, zero licensing risk.
3. **Dual Stack in Workspace**: Luau toolchain (Rokit) and WebGL (Node/Playwright) coexist without interference.

## Subagent Delegation Policy

- **Wave isolation**: Subagents write to disjoint file sets. Lockfiles (`package-lock.json`, `wally.lock`) and shared configuration (`AGENTS.md`, `.mcp.json`) belong exclusively to the coordinator.
- **Dynamic capability selection**: Lightweight models are preferred for localized tasks, inspections, and unit verifications. High-reasoning models are reserved for complex architecture, security review, or multithreaded regressions.
