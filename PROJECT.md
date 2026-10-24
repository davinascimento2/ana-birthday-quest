# Project: A Sinfonia de Ana Gleice (2D Storybook Top-Down RPG)

## Architecture
- **Rendering**: Pure HTML5 2D Canvas (`CanvasRenderingContext2D`) running at solid 60 FPS with fixed-timestep physics (1/60s) and HiDPI auto-scaling. Zero Three.js / WebGL / 3D model dependencies.
- **Camera & Transitions**: Lerp exponential follow with deadzone and boundaries. Zelda-style room sliding (0.85s easeInOutCubic) and papercraft iris wipe between stages.
- **Collision & Spatial Index**: Uniform grid spatial hashing with circle colliders (characters, trees) and AABB boxes (walls, altar, obstacles).
- **Art Direction**: Storybook paper cutout chibi vector rendering on Canvas 2D.
  * **Ana Gleice**: Peachy skin, brown bob/chanel hair with bangs, straw hat with ribbon, sailor-striped shirt, navy shorts, sneakers, golden sunflower in hand. **CRITICAL INVARIANT: Strictly WITHOUT glasses.**
  * **Toadbigode**: Mushroom cap with brown spots, iconic white mustache, monocle/glasses, cane, purple vest with gold trim.
  * **Davi**: Dark wavy hair, thin black glasses, cozy grey hoodie, cargo shorts, sneakers, wooden skateboard.
- **Audio Architecture**: 100% procedural acoustic Web Audio API synthesizer. Physical modeling and harmonic additive synthesis for plucked harp, soft flute, fairy windchimes, bells, and tactile SFX. Zero external media files, zero network fetches.
- **Narrative & UI**: Golden parchment dialogue box with filigree borders, typewriter effect with punctuation pauses, expressive chibi portraits, and Stage 3 climax hug animation + Davi's love letter ("Os 3 Motivos Pelos Quais Eu Te Amo").
- **Harness & Public API**: `window.__GAME_STATE__` and `window.gameApp` preserving complete backward compatibility with Playwright E2E tests.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 2D Canvas Renderer & Loop | 60 FPS fixed-timestep loop, HiDPI scaling, Y-sorted rendering pipeline | M1 | ORIGINAL_REQUEST R1 |
| 2 | Camera Follow & Boundaries | Smooth lerp camera with deadzone and stage bounding box clamping | M1 | ORIGINAL_REQUEST R1 |
| 3 | 2D Collision & Movement | Grid spatial hash, circle & AABB collision, WASD/arrows & touch D-pad | M1 | ORIGINAL_REQUEST R1 |
| 4 | Stage 1: Bosque das Melodias | Watercolor trees, stone paths, flowerbeds, Harp Altar, 4 notes, butterflies | M1 | ORIGINAL_REQUEST R1 |
| 5 | Stage 2: Desfiladeiro Cósmico | Flat obsidian plain, parallax starry sky, constellation circuits, harmonic puzzle | M1 | ORIGINAL_REQUEST R1 |
| 6 | Stage 3: Palácio das Cerejeiras | Serene shrine, torii gate, bridge, falling sakura petal shower, ceremonial carpet | M1 | ORIGINAL_REQUEST R1 |
| 7 | Zelda Screen Sliding Transitions | Smooth area sliding and circular papercraft iris wipe between stages | M1 | ORIGINAL_REQUEST R1 |
| 8 | Paper Cutout Chibi Ana Gleice | Straw hat, brown bob hair, striped shirt, navy shorts, sunflower. **STRICTLY WITHOUT GLASSES.** 4-dir bobbing walk | M2 | ORIGINAL_REQUEST R2 |
| 9 | Paper Cutout Chibi Toadbigode | Mushroom cap with brown spots, mustache, glasses/monocle, cane, purple vest | M2 | ORIGINAL_REQUEST R2 |
| 10 | Paper Cutout Chibi Davi | Dark wavy hair, thin glasses, grey hoodie, cargo shorts, sneakers, skateboard | M2 | ORIGINAL_REQUEST R2 |
| 11 | Character Animations & Emotes | Bobbing walk cycle, idle breathing, emote balloons (!, ?, hearts, musical notes) | M2 | ORIGINAL_REQUEST R2 |
| 12 | Procedural Web Audio Synth | Acoustic harp, soft flute, fairy windchimes, gentle bells via Web Audio API | M3 | ORIGINAL_REQUEST R4 |
| 13 | Tactile SFX & Fanfares | Grass/stone footsteps, note pickup chimes, harp arpeggio, victory fanfare | M3 | ORIGINAL_REQUEST R4 |
| 14 | 3-Stage Procedural BGM | Acolhedor Ghibli/Zelda soundtrack sequenced procedurally per stage | M3 | ORIGINAL_REQUEST R4 |
| 15 | Classical Golden Dialogue Box | Ornate golden parchment box, typewriter sound, punctuation pauses, chibi portraits | M3 | ORIGINAL_REQUEST R3 |
| 16 | Narrative Script & Toadbigode Hints | Original dialogue trees, music puzzle clues, the 3 reasons of love | M3 | ORIGINAL_REQUEST R3 |
| 17 | Stage 3 Climax: Grande Abraço | Approach Davi -> reveal -> warm hug pose with rising hearts and sakura vortex | M3 | ORIGINAL_REQUEST R3 |
| 18 | Davi's Birthday Love Letter | Full display of Davi's letter ("Os 3 Motivos Pelos Quais Eu Te Amo") in parchment modal | M3 | ORIGINAL_REQUEST R3 |
| 19 | Public Test Hooks & Invariants | Complete contracts for `window.__GAME_STATE__` and `window.gameApp` methods | M1, M4 | ORIGINAL_REQUEST R5 |
| 20 | E2E Playwright Test Suite Pass | 100% passing tests in `npm --prefix ana_birthday_quest test`, clean console, zero errors | M4 | ORIGINAL_REQUEST R5 |
| 21 | Zero 3D / Three.js Removal | Elimination of Three.js, GLTFLoader, and 3D assets for lightweight instant load | M1, M4 | ORIGINAL_REQUEST R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 2D Canvas Engine, Camera & 3 Stages | Canvas 2D renderer at 60 FPS, camera lerp, Zelda transitions, 2D collision, 3 storybook environments, initial state hooks | none | IN_PROGRESS (worker: 78bc0357-115c-4811-961a-6780a38be8bf) |
| M2 | Paper Cutout Chibi Characters & Animations | Procedural 2D chibi rendering for Ana (strictly without glasses), Toadbigode, Davi, walk cycles, emote balloons | M1 | PLANNED |
| M3 | Procedural Audio, Golden Dialogue & Climax | 100% procedural Web Audio acoustic synth, BGM/SFX, golden dialogue system with portraits, Stage 3 hug & love letter | M1, M2 | PLANNED |
| M4 | E2E Integration, Verification & Polish | Full integration, Playwright test suite 100% passing, adversarial tests, forensic audit clean | M1, M2, M3 | PLANNED |

## Interface Contracts
### Engine ↔ Characters (`js/engine2d.js` ↔ `js/characters2d.js`)
- `characters2d.renderCharacter(ctx, characterType, state, x, y, direction, frame, scale)`: renders the chibi character on Canvas 2D.
- `characters2d.getCharacterBounds(characterType)`: returns `{ width, height, radius }` for collision calculations.
- `state`: `{ isWalking, walkTime, isEmoting, emoteType, isHugging, direction: 'down'|'up'|'left'|'right' }`.
- `characterType`: `'ana'`, `'toadbigode'`, `'davi'`. Ana is NEVER rendered with glasses.

### Engine ↔ Dialogue (`js/engine2d.js` ↔ `js/dialogue.js`)
- `dialogueSystem.startDialogue(dialogueKey, onCompleteCallback)`: triggers dialogue flow.
- `dialogueSystem.isActive()`: returns boolean for pausing player movement.
- `dialogueSystem.setPortrait(characterType, mood)`: displays speaker chibi portrait in the dialogue box.

### Engine ↔ Audio (`js/engine2d.js` ↔ `js/audio.js`)
- `musicEngine.playBGM(stageId)`: starts procedural music loop for the current stage.
- `musicEngine.playStepSound(surfaceType)`: plays grass or stone footstep SFX.
- `musicEngine.playNotePickup(noteIndex)`: plays ascending acoustic chime.
- `musicEngine.playHarpArpeggio()`: plays harp flourish for altar activation.
- `musicEngine.playFanfare()`: plays victory fanfare.
- `musicEngine.playDialogueBlip()`: plays typewriter tick sound.
- `musicEngine.playBirthdayHymn()`: plays romantic Ghibli waltz during Stage 3 hug.

### Engine ↔ Game State Harness (`js/engine2d.js` ↔ `window.__GAME_STATE__` & `window.gameApp`)
- `window.__GAME_STATE__`: `{ isReady: true, currentLevel: 1|2|3, isLevelTransitioning: boolean, player: { x, y, z, isMoving }, toadbigode: { isRevealed, isHugging }, dialogue: { isActive, currentText }, audio: { isMuted, currentTrack }, candlesLit: boolean }`.
- `window.gameApp`: `{ warpToStage(stageNum), triggerDaviReveal(), triggerDaviHug(), getState(), openLoveLetterModal(), openMixtapeModal(), triggerEmote(type), toggleHoldingHandsWithDavi(), releaseSkyLantern() }`.

## Code Layout
- `ana_birthday_quest/index.html`: Main HTML entry point, UI overlay elements, CSS imports, and script tags.
- `ana_birthday_quest/css/styles.css`: Styles for golden parchment dialogue, mobile controls, polaroid modal, love letter parchment.
- `ana_birthday_quest/js/engine2d.js`: Pure 2D Canvas engine, game loop, camera, map renderer, collision manager, and state harness.
- `ana_birthday_quest/js/characters2d.js`: Paper cutout chibi vector rendering for Ana (strictly without glasses), Toadbigode, and Davi.
- `ana_birthday_quest/js/audio.js`: 100% procedural acoustic Web Audio synthesizer and SFX manager.
- `ana_birthday_quest/js/dialogue.js`: Classical golden parchment dialogue system, typewriter effect, script trees, and speaker portraits.
- `ana_birthday_quest/js/main.js`: Game initialization, lifecycle orchestration, and input event bindings.
- `ana_birthday_quest/tests/`: Playwright test suites (`tests/storybook_e2e.spec.js`, `tests/challenger_stress.spec.js`).
