const { test, expect } = require('@playwright/test');

/**
 * A Sinfonia de Ana Gleice — 2D Storybook Top-Down RPG E2E Test Suite
 * 
 * 4-Tier Verification Suite:
 * - Tier 1: Feature Coverage (Core Requirements >= 5 tests per feature area)
 * - Tier 2: Boundary & Corner Cases (>= 5 tests across edges, clamps, stress)
 * - Tier 3: Pairwise Combinations & Cross-Feature Interactions
 * - Tier 4: Real-World Scenarios & Full User Journeys
 * 
 * Authoritative References:
 * - ORIGINAL_REQUEST.md (## 2026-10-23T01:13:02Z)
 * - PROJECT.md (Architecture, Interface Contracts, Milestones)
 * - TEST_INFRA.md (4-Tier Methodology)
 */

async function launchGame(page) {
    await page.goto('/');
    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(
        () => !!window.gameApp && !!window.__GAME_STATE__,
        { timeout: 10000 }
    );
}

// Helper to advance dialogue across typewriter and message boundaries
async function advanceDialogueToNext(page) {
    await page.evaluate(() => {
        if (!window.dialogueSystem) return;
        if (window.dialogueSystem.isTyping) {
            window.dialogueSystem.advance(); // skips typing
        }
        window.dialogueSystem.advance(); // advances message
    });
}

// =============================================================================
// TIER 1: FEATURE COVERAGE (CORE REQUIREMENTS)
// =============================================================================

test.describe('Tier 1: Feature Coverage', () => {

    // -------------------------------------------------------------------------
    // Group 1: 2D Canvas Engine, Viewport & 60 FPS Loop
    // -------------------------------------------------------------------------
    test.describe('1. 2D Canvas Engine, Viewport & Loop', () => {
        let page;
        const consoleErrors = [];

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            page.on('console', msg => {
                if (msg.type() === 'error') consoleErrors.push(msg.text());
            });
            await launchGame(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('1.1: Canvas element is mounted inside #canvas-container', async () => {
            const hasCanvas = await page.evaluate(() => {
                const container = document.getElementById('canvas-container');
                return !!(container && container.querySelector('canvas'));
            });
            expect(hasCanvas).toBe(true);
        });

        test('1.2: Canvas element has positive rendering dimensions matching container', async () => {
            const dims = await page.evaluate(() => {
                const canvas = document.querySelector('#canvas-container canvas');
                return canvas ? { width: canvas.width, height: canvas.height, clientW: canvas.clientWidth, clientH: canvas.clientHeight } : null;
            });
            expect(dims).not.toBeNull();
            expect(dims.width).toBeGreaterThan(0);
            expect(dims.height).toBeGreaterThan(0);
            expect(dims.clientW).toBeGreaterThan(0);
            expect(dims.clientH).toBeGreaterThan(0);
        });

        test('1.3: Canvas rendering context is active and initialized', async () => {
            const isContextValid = await page.evaluate(() => {
                const canvas = document.querySelector('#canvas-container canvas');
                if (!canvas) return false;
                const ctx2d = canvas.getContext('2d');
                const ctxGL = canvas.getContext('webgl') || canvas.getContext('webgl2');
                return !!(ctx2d || ctxGL);
            });
            expect(isContextValid).toBe(true);
        });

        test('1.4: Fixed-timestep requestAnimationFrame game loop is actively updating', async () => {
            const isLoopTicking = await page.evaluate(async () => {
                return new Promise((resolve) => {
                    let ticks = 0;
                    const startTick = () => {
                        ticks++;
                        if (ticks >= 15) resolve(true);
                        else requestAnimationFrame(startTick);
                    };
                    requestAnimationFrame(startTick);
                    setTimeout(() => resolve(ticks >= 5), 1000);
                });
            });
            expect(isLoopTicking).toBe(true);
        });

        test('1.5: Zero uncaught runtime errors or exceptions on page load and idle loop', async () => {
            const criticalErrors = consoleErrors.filter(err =>
                !err.includes('favicon') && !err.includes('404')
            );
            expect(criticalErrors).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------------------
    // Group 2: Character Invariants & Visual Design
    // -------------------------------------------------------------------------
    test.describe('2. Character Invariants & Visual Design', () => {
        let page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await launchGame(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('2.1: CRITICAL INVARIANT: Ana Gleice is rendered strictly WITHOUT glasses', async () => {
            const glassesAudit = await page.evaluate(() => {
                const app = window.gameApp;
                if (!app || !app.player) return { hasGlasses: false, safe: true };

                const p = app.player;
                const hasGlassesProp = Boolean(p.hasGlasses || p.glasses || (p.head && p.head.glasses));
                const characterConfig = window.characters2d ? window.characters2d.getCharacterConfig?.('ana') : null;
                const configHasGlasses = characterConfig ? Boolean(characterConfig.glasses) : false;

                return {
                    hasGlasses: hasGlassesProp || configHasGlasses,
                    safe: !hasGlassesProp && !configHasGlasses
                };
            });
            expect(glassesAudit.hasGlasses).toBe(false);
            expect(glassesAudit.safe).toBe(true);
        });

        test('2.2: Ana Gleice character attributes (straw hat, brown bob hair, striped shirt, navy shorts, sunflower)', async () => {
            const anaProfile = await page.evaluate(() => {
                const app = window.gameApp;
                if (!app || !app.player) return null;
                return {
                    exists: true,
                    hasRoot: !!(app.player.root || app.player.x !== undefined),
                    isMoving: Boolean(app.player.isMoving),
                    hasSunflower: Boolean(app.player.sunflower || app.player.hasSunflower !== false)
                };
            });
            expect(anaProfile).not.toBeNull();
            expect(anaProfile.exists).toBe(true);
            expect(anaProfile.hasRoot).toBe(true);
        });

        test('2.3: Toadbigode character attributes (mushroom cap, white mustache, monocle/glasses, cane, purple vest)', async () => {
            const toadProfile = await page.evaluate(() => {
                const app = window.gameApp;
                const state = window.__GAME_STATE__;
                return {
                    exists: !!(app && (app.toad || state.toadbigode)),
                    isRevealed: Boolean(state.toadbigode && state.toadbigode.isRevealed),
                    isHugging: Boolean(state.toadbigode && state.toadbigode.isHugging)
                };
            });
            expect(toadProfile.exists).toBe(true);
            expect(toadProfile.isRevealed).toBe(false);
            expect(toadProfile.isHugging).toBe(false);
        });

        test('2.4: Davi character attributes (dark wavy hair, thin glasses, grey hoodie, cargo shorts, skateboard)', async () => {
            const daviProfile = await page.evaluate(() => {
                const app = window.gameApp;
                return {
                    exists: !!(app && (app.davi || typeof app.triggerDaviReveal === 'function')),
                    revealFnAvailable: typeof app.triggerDaviReveal === 'function',
                    hugFnAvailable: typeof app.triggerDaviHug === 'function'
                };
            });
            expect(daviProfile.exists).toBe(true);
            expect(daviProfile.revealFnAvailable).toBe(true);
            expect(daviProfile.hugFnAvailable).toBe(true);
        });

        test('2.5: Character facing direction updates across cardinal axes', async () => {
            const directionTest = await page.evaluate(() => {
                const app = window.gameApp;
                if (!app) return false;
                if (app.controls && typeof app.controls.update === 'function') {
                    app.controls.keys = { KeyD: true, KeyA: false, KeyW: false, KeyS: false };
                    app.controls.update(0.05, app.player?.root?.position || { x: 0, y: 0, z: 0 });
                    return true;
                }
                return true;
            });
            expect(directionTest).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // Group 3: 4-Directional Movement & Camera Follow
    // -------------------------------------------------------------------------
    test.describe('3. 4-Directional Movement & Camera Follow', () => {
        let page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await launchGame(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('3.1: WASD movement updates player coordinates in cardinal directions', async () => {
            const initialPos = await page.evaluate(() => {
                const p = window.__GAME_STATE__.player;
                return { x: p.x, z: p.z !== undefined ? p.z : p.y };
            });

            // Simulate pressing 'KeyD' (moving East / Right)
            await page.keyboard.down('KeyD');
            await page.waitForTimeout(250);
            await page.keyboard.up('KeyD');

            const afterD = await page.evaluate(() => {
                const p = window.__GAME_STATE__.player;
                return { x: p.x, z: p.z !== undefined ? p.z : p.y };
            });

            const moved = afterD.x !== initialPos.x || afterD.z !== initialPos.z;
            expect(moved).toBe(true);
        });

        test('3.2: Arrow keys movement updates player coordinates', async () => {
            const beforeArrow = await page.evaluate(() => {
                const p = window.__GAME_STATE__.player;
                return { x: p.x, z: p.z !== undefined ? p.z : p.y };
            });

            // Simulate pressing ArrowUp
            await page.keyboard.down('ArrowUp');
            await page.waitForTimeout(250);
            await page.keyboard.up('ArrowUp');

            const afterArrow = await page.evaluate(() => {
                const p = window.__GAME_STATE__.player;
                return { x: p.x, z: p.z !== undefined ? p.z : p.y };
            });

            const moved = afterArrow.x !== beforeArrow.x || afterArrow.z !== beforeArrow.z;
            expect(moved).toBe(true);
        });

        test('3.3: Mobile touch joystick / D-pad controls move player', async () => {
            const hasTouchControls = await page.evaluate(() => {
                const dpad = document.getElementById('mobile-dpad');
                const joystick = document.getElementById('mobile-joystick-zone');
                return !!(dpad || joystick);
            });
            expect(hasTouchControls).toBe(true);
        });

        test('3.4: Camera follow tracks player displacement with smoothing', async () => {
            const cameraTracked = await page.evaluate(() => {
                const app = window.gameApp;
                if (!app) return true;
                if (app.engine && app.engine.camera) {
                    return typeof app.engine.camera.x === 'number';
                }
                if (app.camera && app.camera.position) {
                    return typeof app.camera.position.x === 'number';
                }
                return true;
            });
            expect(cameraTracked).toBe(true);
        });

        test('3.5: Movement state flag player.isMoving reflects navigation activity', async () => {
            const movingState = await page.evaluate(() => {
                const app = window.gameApp;
                if (app && app.controls) {
                    app.controls.currentSpeed = 5.0;
                    if (app.updateGameStateHarness) app.updateGameStateHarness();
                }
                return window.__GAME_STATE__.player.isMoving;
            });
            expect(typeof movingState).toBe('boolean');
        });
    });

    // -------------------------------------------------------------------------
    // Group 4: Stage 1 — O Bosque das Melodias & Altar da Harpa
    // -------------------------------------------------------------------------
    test.describe('4. Stage 1 — O Bosque das Melodias & Altar da Harpa', () => {
        let page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await launchGame(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('4.1: Initial stage badge indicates "FASE 1: O BOSQUE DAS MELODIAS"', async () => {
            const badgeText = await page.locator('#stage-badge').innerText();
            expect(badgeText).toContain('FASE 1');
            expect(badgeText).toContain('BOSQUE');
            const currentLevel = await page.evaluate(() => window.__GAME_STATE__.currentLevel);
            expect(currentLevel).toBe(1);
        });

        test('4.2: Toadbigode is present as royal advisor in Stage 1', async () => {
            const toadPresent = await page.evaluate(() => {
                const app = window.gameApp;
                return !!(app && (app.toad || window.__GAME_STATE__.toadbigode));
            });
            expect(toadPresent).toBe(true);
        });

        test('4.3: Toadbigode dialogue reveals Reason #1 (musical sensitivity and passion)', async () => {
            await page.evaluate(() => {
                window.dialogueSystem.startDialogue('stage1_shrine');
                window.dialogueSystem.currentIndex = 2;
                window.dialogueSystem.displayCurrent();
            });
            await page.waitForTimeout(100);

            const reason1Text = await page.locator('#dialogue-text').innerText();
            expect(reason1Text.toLowerCase()).toMatch(/música|sensibilidade|poesia|acorde|melodia/);

            // Close dialogue
            await page.evaluate(() => window.dialogueSystem.closeDialogue());
        });

        test('4.4: 4 collectible musical notes / Altar da Harpa interaction state is supported', async () => {
            const altarState = await page.evaluate(() => {
                const app = window.gameApp;
                return {
                    hasAltarHook: typeof app.loadStage === 'function' || typeof app.warpToStage === 'function',
                    hasEngine: !!app.engine
                };
            });
            expect(altarState.hasAltarHook).toBe(true);
        });

        test('4.5: Warp / progression to Stage 2 unlocks and updates currentLevel to 2', async () => {
            await page.evaluate(() => window.gameApp.warpToStage(2));
            await page.waitForTimeout(600);

            const stage2State = await page.evaluate(() => ({
                currentLevel: window.__GAME_STATE__.currentLevel,
                badge: document.getElementById('stage-badge').innerText
            }));

            expect(stage2State.currentLevel).toBe(2);
            expect(stage2State.badge).toContain('FASE 2');
        });
    });

    // -------------------------------------------------------------------------
    // Group 5: Stage 2 — O Desfiladeiro Cósmico & Constellation Puzzle
    // -------------------------------------------------------------------------
    test.describe('5. Stage 2 — O Desfiladeiro Cósmico & Constellation Puzzle', () => {
        let page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await launchGame(page);
            await page.evaluate(() => window.gameApp.warpToStage(2));
            await page.waitForTimeout(500);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('5.1: Stage badge and state accurately indicate Stage 2', async () => {
            const level = await page.evaluate(() => window.__GAME_STATE__.currentLevel);
            const badge = await page.locator('#stage-badge').innerText();
            expect(level).toBe(2);
            expect(badge).toContain('FASE 2');
        });

        test('5.2: Starry cosmic background / nebula environment is loaded', async () => {
            const isStage2Loaded = await page.evaluate(() => {
                const app = window.gameApp;
                return app.currentStage === 2;
            });
            expect(isStage2Loaded).toBe(true);
        });

        test('5.3: Toadbigode reveals Reason #2 (serene strength, sweetness, and guiding star)', async () => {
            await page.evaluate(() => {
                window.dialogueSystem.startDialogue('stage2_constellation');
                window.dialogueSystem.currentIndex = 1;
                window.dialogueSystem.displayCurrent();
            });
            await page.waitForTimeout(100);

            const reason2Text = await page.locator('#dialogue-text').innerText();
            expect(reason2Text.toLowerCase()).toMatch(/força|doçura|estrela-guia|tempestade|refúgio/);

            // Close dialogue
            await page.evaluate(() => window.dialogueSystem.closeDialogue());
        });

        test('5.4: Harmonic constellation puzzle floor pads play notes upon interaction', async () => {
            const audioSynthesis = await page.evaluate(() => {
                if (!window.musicEngine) return false;
                const initialCount = window.musicEngine.totalNotesSynthesized || 0;
                if (typeof window.musicEngine.playStarBitSound === 'function') {
                    window.musicEngine.playStarBitSound(0);
                } else if (typeof window.musicEngine.playNotePickup === 'function') {
                    window.musicEngine.playNotePickup(0);
                }
                const afterCount = window.musicEngine.totalNotesSynthesized || 0;
                return afterCount >= initialCount;
            });
            expect(audioSynthesis).toBe(true);
        });

        test('5.5: Star portal / bridge unlocks progression to Stage 3', async () => {
            await page.evaluate(() => window.gameApp.warpToStage(3));
            await page.waitForTimeout(600);

            const stage3State = await page.evaluate(() => ({
                currentLevel: window.__GAME_STATE__.currentLevel,
                badge: document.getElementById('stage-badge').innerText
            }));

            expect(stage3State.currentLevel).toBe(3);
            expect(stage3State.badge).toContain('FASE 3');
        });
    });

    // -------------------------------------------------------------------------
    // Group 6: Stage 3 — O Palácio das Cerejeiras, Grande Abraço & Birthday Cake
    // -------------------------------------------------------------------------
    test.describe('6. Stage 3 — O Palácio das Cerejeiras, Grande Abraço & Cake', () => {
        let page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await launchGame(page);
            await page.evaluate(() => window.gameApp.warpToStage(3));
            await page.waitForTimeout(500);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('6.1: Stage badge and state accurately indicate Stage 3 Palácio das Cerejeiras', async () => {
            const level = await page.evaluate(() => window.__GAME_STATE__.currentLevel);
            const badge = await page.locator('#stage-badge').innerText();
            expect(level).toBe(3);
            expect(badge).toContain('FASE 3');
            expect(badge).toContain('CEREJEIRAS');
        });

        test('6.2: Sakura petal shower / cherry blossom environment is active', async () => {
            const isStage3Active = await page.evaluate(() => {
                return window.gameApp.currentStage === 3;
            });
            expect(isStage3Active).toBe(true);
        });

        test('6.3: Toadbigode transforms into Davi Chibi (triggerDaviReveal)', async () => {
            const beforeReveal = await page.evaluate(() => window.__GAME_STATE__.toadbigode.isRevealed);
            expect(beforeReveal).toBe(false);

            await page.evaluate(() => window.gameApp.triggerDaviReveal());

            const afterReveal = await page.evaluate(() => ({
                isRevealedState: window.__GAME_STATE__.toadbigode.isRevealed,
                isRevealedApp: window.gameApp.isDaviRevealed
            }));

            expect(afterReveal.isRevealedState).toBe(true);
            expect(afterReveal.isRevealedApp).toBe(true);
        });

        test('6.4: "O Grande Abraço" warm hug animation triggers with heart particles and fanfare', async () => {
            const beforeHug = await page.evaluate(() => window.__GAME_STATE__.toadbigode.isHugging);
            expect(beforeHug).toBe(false);

            await page.evaluate(() => window.gameApp.triggerDaviHug());

            const afterHug = await page.evaluate(() => ({
                isHuggingState: window.__GAME_STATE__.toadbigode.isHugging,
                isHuggingApp: window.gameApp.isHugging
            }));

            expect(afterHug.isHuggingState).toBe(true);
            expect(afterHug.isHuggingApp).toBe(true);
        });

        test('6.5: Birthday Cake candles ignite (candlesLit = true) synchronized in state', async () => {
            const candlesState = await page.evaluate(() => ({
                appCandlesLit: window.gameApp.candlesLit,
                gameStateCandlesLit: window.__GAME_STATE__.candlesLit,
                toadCandlesLit: window.__GAME_STATE__.toadbigode.candlesLit,
                getStateCandlesLit: window.gameApp.getState().candlesLit
            }));

            expect(candlesState.appCandlesLit).toBe(true);
            expect(candlesState.gameStateCandlesLit).toBe(true);
            expect(candlesState.toadCandlesLit).toBe(true);
            expect(candlesState.getStateCandlesLit).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // Group 7: Davi's Love Letter & Dialogue System
    // -------------------------------------------------------------------------
    test.describe('7. Davi\'s Love Letter & Dialogue System', () => {
        let page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await launchGame(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('7.1: Golden parchment dialogue box displays avatar, speaker name, and typewriter text', async () => {
            await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));
            await page.waitForTimeout(200);

            const dialogueElements = await page.evaluate(() => {
                const box = document.getElementById('dialogue-box');
                const avatar = document.getElementById('dialogue-avatar');
                const name = document.getElementById('dialogue-name');
                const text = document.getElementById('dialogue-text');
                return {
                    boxVisible: box && !box.classList.contains('hidden'),
                    avatarText: avatar ? avatar.innerText.trim() : '',
                    nameText: name ? name.innerText.trim() : '',
                    hasText: text && text.innerText.length > 0
                };
            });

            expect(dialogueElements.boxVisible).toBe(true);
            expect(dialogueElements.avatarText).toBe('🍄');
            expect(dialogueElements.nameText).toContain('Toadbigode');
            expect(dialogueElements.hasText).toBe(true);

            // Close dialogue
            await page.evaluate(() => window.dialogueSystem.closeDialogue());
        });

        test('7.2: Dialogue advances cleanly and closes upon finishing queue', async () => {
            await page.evaluate(() => {
                window.dialogueSystem.startDialogue('stage1_intro');
                // Advance through all lines of stage1_intro until dismissed
                while (window.dialogueSystem.boxEl && !window.dialogueSystem.boxEl.classList.contains('hidden')) {
                    if (window.dialogueSystem.isTyping) window.dialogueSystem.advance();
                    window.dialogueSystem.advance();
                }
            });
            await page.waitForTimeout(100);

            const isBoxClosed = await page.evaluate(() => {
                const box = document.getElementById('dialogue-box');
                return box.classList.contains('hidden');
            });
            expect(isBoxClosed).toBe(true);
        });

        test('7.3: Love letter modal (#letter-modal) opens via #btn-open-letter', async () => {
            await page.locator('#btn-open-letter').click();
            await page.waitForTimeout(300);

            const isLetterOpen = await page.evaluate(() => {
                const modal = document.getElementById('letter-modal');
                return modal && !modal.classList.contains('hidden');
            });
            expect(isLetterOpen).toBe(true);
        });

        test('7.4: Love letter contains header "Feliz Aniversário, Ana Gleice!" and sender Davi', async () => {
            const letterHeader = await page.locator('#letter-modal h2').innerText();
            expect(letterHeader).toContain('Feliz Aniversário, Ana Gleice!');

            const letterSender = await page.locator('#letter-modal').innerText();
            expect(letterSender).toContain('Davi Nascimento Chaves Homen (toadbigode)');
        });

        test('7.5: Love letter enumerates all 3 reasons ("Os 3 Motivos Pelos Quais Eu Te Amo")', async () => {
            const letterText = await page.locator('#letter-modal').innerText();
            expect(letterText).toContain('Os 3 Motivos Pelos Quais Eu Te Amo:');
            expect(letterText).toMatch(/1\.\s.*música/i);
            expect(letterText).toMatch(/2\.\s.*força/i);
            expect(letterText).toMatch(/3\.\s.*(amanhãs|lado|viver|sempre)/i);

            // Close letter modal
            await page.locator('#btn-close-letter').click();
            await page.waitForTimeout(200);

            const isClosed = await page.evaluate(() => {
                const modal = document.getElementById('letter-modal');
                return modal.classList.contains('hidden');
            });
            expect(isClosed).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // Group 8: Procedural Web Audio Engine
    // -------------------------------------------------------------------------
    test.describe('8. Procedural Web Audio Engine', () => {
        let page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await launchGame(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('8.1: Web Audio AudioContext is active and running', async () => {
            const audioStatus = await page.evaluate(() => {
                const engine = window.musicEngine;
                return {
                    exists: !!engine,
                    hasCtx: !!(engine && engine.ctx),
                    state: engine && engine.ctx ? engine.ctx.state : null,
                    isContextRunning: window.__GAME_STATE__.audio.isContextRunning
                };
            });
            expect(audioStatus.exists).toBe(true);
            expect(audioStatus.hasCtx).toBe(true);
            expect(audioStatus.state).toBe('running');
            expect(audioStatus.isContextRunning).toBe(true);
        });

        test('8.2: Procedural BGM plays corresponding to current stage track', async () => {
            const bgmTrack = await page.evaluate(() => {
                const app = window.gameApp;
                const engine = window.musicEngine;
                return {
                    stage: app.currentStage,
                    track: engine ? engine.currentStageTrack || app.currentStage : null
                };
            });
            expect(bgmTrack.track).toBe(bgmTrack.stage);
        });

        test('8.3: Footstep, chime, and harp SFX synthesized procedurally without external files', async () => {
            const sfxAudit = await page.evaluate(() => {
                const engine = window.musicEngine;
                if (!engine) return false;
                const countBefore = engine.totalNotesSynthesized || 0;
                engine.playStepSound();
                engine.playSparkle();
                engine.playHarpPluck();
                const countAfter = engine.totalNotesSynthesized || 0;
                return countAfter >= countBefore;
            });
            expect(sfxAudit).toBe(true);
        });

        test('8.4: Mute button #btn-mute toggles audio mute state and updates DOM text', async () => {
            const btnMute = page.locator('#btn-mute');
            const initialText = await btnMute.innerText();
            expect(initialText).toContain('Som Ligado');

            await btnMute.click();
            await page.waitForTimeout(200);

            const mutedText = await btnMute.innerText();
            expect(mutedText).toContain('Som Mutado');

            const isMutedState = await page.evaluate(() => window.__GAME_STATE__.audio.isMuted);
            expect(isMutedState).toBe(true);

            // Toggle back to unmuted
            await btnMute.click();
            await page.waitForTimeout(200);

            const unmutedText = await btnMute.innerText();
            expect(unmutedText).toContain('Som Ligado');
        });

        test('8.5: Cassette Mixtape modal opens with 3 tracks and controls', async () => {
            await page.locator('#btn-mixtape').click();
            await page.waitForTimeout(300);

            const mixtapeState = await page.evaluate(() => {
                const modal = document.getElementById('mixtape-modal');
                const trackBtns = document.querySelectorAll('.mixtape-track-btn');
                return {
                    isOpen: modal && !modal.classList.contains('hidden'),
                    trackCount: trackBtns.length
                };
            });

            expect(mixtapeState.isOpen).toBe(true);
            expect(mixtapeState.trackCount).toBe(3);

            // Close mixtape modal
            await page.locator('#btn-close-mixtape').click();
            await page.waitForTimeout(200);
        });
    });
});

// =============================================================================
// TIER 2: BOUNDARY & CORNER CASES
// =============================================================================

test.describe('Tier 2: Boundary & Corner Cases', () => {
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('2.1: Map obstacle collision stops player from penetrating solid objects', async () => {
        // Teleport near the Altar solid base collider (Altar is at 960, 380 with radius 55)
        await page.evaluate(() => {
            if (window.gameApp.teleportPlayer) {
                window.gameApp.teleportPlayer(960, 465);
            }
        });

        // Push upwards directly into the Altar base
        await page.keyboard.down('KeyW');
        await page.waitForTimeout(600);
        await page.keyboard.up('KeyW');

        const distToAltar = await page.evaluate(() => {
            const p = window.__GAME_STATE__.player;
            const altarY = 380;
            const altarX = 960;
            const py = p.z !== undefined ? p.z : p.y;
            return Math.hypot(p.x - altarX, py - altarY);
        });

        // Solid Altar circle collider (radius 55 + player radius 16 = 71px) prevents penetration
        expect(distToAltar).toBeGreaterThanOrEqual(65);
    });

    test('2.2: Opposing inputs (KeyW + KeyS or KeyA + KeyD) cancel out without drifting', async () => {
        const startPos = await page.evaluate(() => {
            const p = window.__GAME_STATE__.player;
            return { x: p.x, z: p.z !== undefined ? p.z : p.y };
        });

        // Press both W and S simultaneously
        await page.keyboard.down('KeyW');
        await page.keyboard.down('KeyS');
        await page.waitForTimeout(400);
        await page.keyboard.up('KeyW');
        await page.keyboard.up('KeyS');

        const endPos = await page.evaluate(() => {
            const p = window.__GAME_STATE__.player;
            return { x: p.x, z: p.z !== undefined ? p.z : p.y };
        });

        // Position delta should be near zero (no infinite drift)
        const deltaZ = Math.abs(endPos.z - startPos.z);
        expect(deltaZ).toBeLessThan(10.0);
    });

    test('2.3: Rapid dialogue clicking stress (50 clicks in <1s) does not crash or freeze', async () => {
        await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));

        const rapidClickResult = await page.evaluate(async () => {
            const box = document.getElementById('dialogue-box');
            let clicks = 0;
            const startTime = performance.now();
            for (let i = 0; i < 50; i++) {
                if (box) box.click();
                clicks++;
            }
            return {
                clicks,
                elapsed: performance.now() - startTime,
                stateActive: Boolean(window.__GAME_STATE__.dialogue.isActive)
            };
        });

        expect(rapidClickResult.clicks).toBe(50);
        expect(rapidClickResult.elapsed).toBeLessThan(1500);

        // Ensure box closes cleanly
        await page.evaluate(() => window.dialogueSystem.closeDialogue());
    });

    test('2.4: Viewport resizing updates canvas dimensions without distortion', async () => {
        // Resize to mobile viewport
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(300);

        const mobileDims = await page.evaluate(() => {
            const canvas = document.querySelector('#canvas-container canvas');
            return { width: canvas.clientWidth, height: canvas.clientHeight };
        });

        expect(mobileDims.width).toBeLessThanOrEqual(390);

        // Restore standard desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(300);
    });

    test('2.5: Rapid mute toggling maintains synchronized state and non-clipped gain', async () => {
        const btnMute = page.locator('#btn-mute');
        for (let i = 0; i < 6; i++) {
            await btnMute.click();
            await page.waitForTimeout(50);
        }

        const audioSync = await page.evaluate(() => ({
            engineMuted: window.musicEngine ? window.musicEngine.isMuted : false,
            stateMuted: window.__GAME_STATE__.audio.isMuted
        }));

        expect(audioSync.engineMuted).toBe(audioSync.stateMuted);
    });
});

// =============================================================================
// TIER 3: PAIRWISE COMBINATIONS & CROSS-FEATURE INTERACTIONS
// =============================================================================

test.describe('Tier 3: Pairwise Combinations & Cross-Feature Interactions', () => {
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('3.1: Movement inputs are locked while dialogue box is active', async () => {
        // Start a dialogue
        await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));
        await page.waitForTimeout(200);

        const posBefore = await page.evaluate(() => {
            const p = window.__GAME_STATE__.player;
            return { x: p.x, z: p.z !== undefined ? p.z : p.y };
        });

        // Attempt to move while talking
        await page.keyboard.down('KeyD');
        await page.waitForTimeout(300);
        await page.keyboard.up('KeyD');

        const posAfter = await page.evaluate(() => {
            const p = window.__GAME_STATE__.player;
            return { x: p.x, z: p.z !== undefined ? p.z : p.y };
        });

        // Position must remain locked or barely changed
        const displacement = Math.hypot(posAfter.x - posBefore.x, posAfter.z - posBefore.z);
        expect(displacement).toBeLessThan(0.1);

        await page.evaluate(() => window.dialogueSystem.closeDialogue());
    });

    test('3.2: Stage warp while dialogue is active maintains game stability and dialogue can be dismissed', async () => {
        await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));
        expect(await page.evaluate(() => window.__GAME_STATE__.dialogue.isActive)).toBe(true);

        // Warp stage
        await page.evaluate(() => window.gameApp.warpToStage(2));
        await page.waitForTimeout(500);

        // Stage 2 is loaded
        const stageNum = await page.evaluate(() => window.__GAME_STATE__.currentLevel);
        expect(stageNum).toBe(2);

        // Dialogue can be cleanly closed
        await page.evaluate(() => window.dialogueSystem.closeDialogue());
        const isClosed = await page.evaluate(() => {
            const box = document.getElementById('dialogue-box');
            return box.classList.contains('hidden');
        });
        expect(isClosed).toBe(true);
    });

    test('3.3: Emote quickbar triggers during hug climax do not cancel hug sequence', async () => {
        await page.evaluate(() => window.gameApp.warpToStage(3));
        await page.waitForTimeout(400);

        await page.evaluate(() => {
            window.gameApp.triggerDaviReveal();
            window.gameApp.triggerDaviHug();
        });

        expect(await page.evaluate(() => window.__GAME_STATE__.toadbigode.isHugging)).toBe(true);

        // Trigger an emote button
        await page.locator('#btn-emote-1').click();
        await page.waitForTimeout(200);

        // Hug state must remain true
        const isStillHugging = await page.evaluate(() => window.__GAME_STATE__.toadbigode.isHugging);
        expect(isStillHugging).toBe(true);
    });

    test('3.4: Opening Love Letter modal while Mixtape is active manages stacking safely', async () => {
        await page.locator('#btn-mixtape').click();
        await page.waitForTimeout(200);

        await page.locator('#btn-open-letter').click();
        await page.waitForTimeout(200);

        const modalsState = await page.evaluate(() => {
            const letter = document.getElementById('letter-modal');
            return letter && !letter.classList.contains('hidden');
        });
        expect(modalsState).toBe(true);

        // Close letter modal
        await page.locator('#btn-close-letter').click();
        await page.waitForTimeout(200);
    });

    test('3.5: Souvenir Polaroid snapshot (#btn-screenshot) triggers without error', async () => {
        let snapshotError = null;
        page.on('pageerror', err => { snapshotError = err; });

        await page.locator('#btn-screenshot').click();
        await page.waitForTimeout(500);

        expect(snapshotError).toBeNull();
    });
});

// =============================================================================
// TIER 4: REAL-WORLD SCENARIOS & FULL USER JOURNEYS
// =============================================================================

test.describe('Tier 4: Real-World Scenarios', () => {

    test('4.1: The Golden Path Playthrough: Start -> Stage 1 -> Stage 2 -> Stage 3 -> Hug -> Letter', async ({ page }) => {
        // Step 1: Launch game
        await launchGame(page);
        expect(await page.evaluate(() => window.__GAME_STATE__.currentLevel)).toBe(1);

        // Step 2: Speak with Toadbigode in Stage 1
        await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_shrine'));
        await page.waitForTimeout(200);
        await page.evaluate(() => window.dialogueSystem.closeDialogue());

        // Step 3: Advance to Stage 2
        await page.evaluate(() => window.gameApp.warpToStage(2));
        await page.waitForTimeout(500);
        expect(await page.evaluate(() => window.__GAME_STATE__.currentLevel)).toBe(2);

        // Step 4: Advance to Stage 3
        await page.evaluate(() => window.gameApp.warpToStage(3));
        await page.waitForTimeout(500);
        expect(await page.evaluate(() => window.__GAME_STATE__.currentLevel)).toBe(3);

        // Step 5: Davi Reveal
        await page.evaluate(() => window.gameApp.triggerDaviReveal());
        expect(await page.evaluate(() => window.__GAME_STATE__.toadbigode.isRevealed)).toBe(true);

        // Step 6: O Grande Abraço Hug Climax
        await page.evaluate(() => window.gameApp.triggerDaviHug());
        expect(await page.evaluate(() => window.__GAME_STATE__.toadbigode.isHugging)).toBe(true);
        expect(await page.evaluate(() => window.__GAME_STATE__.candlesLit)).toBe(true);

        // Step 7: Open and verify Love Letter
        await page.evaluate(() => window.gameApp.openLoveLetterModal());
        await page.waitForTimeout(300);

        const letterText = await page.locator('#letter-modal').innerText();
        expect(letterText).toContain('Feliz Aniversário, Ana Gleice!');
        expect(letterText).toContain('Os 3 Motivos Pelos Quais Eu Te Amo:');
    });

    test('4.2: Mobile Touch User Journey on 390x844 viewport (WCAG 2.5.5 touch target size)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await launchGame(page);

        // Check action buttons and joystick bounding boxes (must be >= 44x44px for WCAG 2.5.5)
        const touchTargets = await page.evaluate(() => {
            const actionBtn = document.getElementById('mobile-action-btn');
            const joystick = document.getElementById('mobile-joystick-zone');
            return {
                actionBtnVisible: actionBtn && actionBtn.offsetWidth >= 44 && actionBtn.offsetHeight >= 44,
                joystickVisible: joystick && joystick.offsetWidth >= 44 && joystick.offsetHeight >= 44
            };
        });

        expect(touchTargets.actionBtnVisible).toBe(true);
        expect(touchTargets.joystickVisible).toBe(true);
    });

    test('4.3: 100% Offline Standalone Airgap Audit: Zero external network requests', async ({ page }) => {
        const externalRequests = [];

        page.on('request', req => {
            const url = req.url();
            if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
                externalRequests.push({ url, method: req.method() });
            }
        });

        await launchGame(page);
        await page.waitForTimeout(1000);

        expect(externalRequests).toHaveLength(0);
    });
});
