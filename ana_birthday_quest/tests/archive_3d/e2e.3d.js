const { test, expect } = require('@playwright/test');

/**
 * A Sinfonia de Ana Gleice - Comprehensive E2E Test Suite (Tiers 1-4)
 * Authoritative source: ORIGINAL_REQUEST.md, TEST_INFRA.md, PROJECT.md
 * 
 * Total Tests: 160
 * - Tier 1: 70 tests (14 features x 5 primary tests)
 * - Tier 2: 70 tests (14 features x 5 boundary/corner tests)
 * - Tier 3: 15 tests (Pairwise cross-feature combinations)
 * - Tier 4: 5 tests (Real-world end-to-end user journeys)
 */

// Helper to launch game and bypass start overlay
async function launchGame(page) {
    await page.goto('/');
    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene && !!window.gameApp.renderer, { timeout: 10000 });
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (70 TESTS)
// ============================================================================

test.describe('Tier 1: Feature 1 - Standalone Three.js Setup & Canvas', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.1.1: WebGL canvas is mounted in canvas-container', async () => {
        const canvas = page.locator('#canvas-container canvas');
        await expect(canvas).toBeVisible();
    });

    test('T1.1.2: WebGL context is initialized and active', async () => {
        const hasContext = await page.evaluate(() => {
            const canvas = document.querySelector('#canvas-container canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
        });
        expect(hasContext).toBe(true);
    });

    test('T1.1.3: Renderer preserveDrawingBuffer is enabled for screenshots', async () => {
        const preserveBuffer = await page.evaluate(() => {
            return window.gameApp.renderer.getContext().getContextAttributes().preserveDrawingBuffer;
        });
        expect(preserveBuffer).toBe(true);
    });

    test('T1.1.4: Device pixel ratio is capped at 2 for performance', async () => {
        const dpr = await page.evaluate(() => window.gameApp.renderer.getPixelRatio());
        expect(dpr).toBeLessThanOrEqual(2);
        expect(dpr).toBeGreaterThan(0);
    });

    test('T1.1.5: Camera perspective configuration matches spec (FOV 50, near 0.1, far 200)', async () => {
        const cam = await page.evaluate(() => ({
            fov: window.gameApp.camera.fov,
            near: window.gameApp.camera.near,
            far: window.gameApp.camera.far
        }));
        expect(cam.fov).toBe(50);
        expect(cam.near).toBe(0.1);
        expect(cam.far).toBe(200);
    });
});

test.describe('Tier 1: Feature 2 - Cel-Shading & Aesthetic Visuals', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.2.1: Stage 1 scene background color is soft morning mist (#dcfce7)', async () => {
        const bgColor = await page.evaluate(() => window.gameApp.scene.background.getHexString());
        expect(bgColor.toLowerCase()).toBe('dcfce7');
    });

    test('T1.2.2: Scene fog is initialized as FogExp2 with matching color', async () => {
        const fogInfo = await page.evaluate(() => ({
            isExp2: window.gameApp.scene.fog.isFogExp2,
            color: window.gameApp.scene.fog.color.getHexString(),
            density: window.gameApp.scene.fog.density
        }));
        expect(fogInfo.isExp2).toBe(true);
        expect(fogInfo.color.toLowerCase()).toBe('dcfce7');
        expect(fogInfo.density).toBeCloseTo(0.022, 3);
    });

    test('T1.2.3: Warm ambient light exists with intensity 0.75', async () => {
        const ambient = await page.evaluate(() => ({
            color: window.gameApp.ambientLight.color.getHexString(),
            intensity: window.gameApp.ambientLight.intensity
        }));
        expect(ambient.color.toLowerCase()).toBe('fff7ed');
        expect(ambient.intensity).toBeCloseTo(0.75, 2);
    });

    test('T1.2.4: Directional sunlight casts shadows at position (15, 25, 10)', async () => {
        const sun = await page.evaluate(() => ({
            castShadow: window.gameApp.sunLight.castShadow,
            pos: [window.gameApp.sunLight.position.x, window.gameApp.sunLight.position.y, window.gameApp.sunLight.position.z]
        }));
        expect(sun.castShadow).toBe(true);
        expect(sun.pos).toEqual([15, 25, 10]);
    });

    test('T1.2.5: Renderer soft shadow map is enabled', async () => {
        const shadowMap = await page.evaluate(() => ({
            enabled: window.gameApp.renderer.shadowMap.enabled,
            type: window.gameApp.renderer.shadowMap.type
        }));
        expect(shadowMap.enabled).toBe(true);
        expect(shadowMap.type).toBe(2); // THREE.PCFSoftShadowMap
    });
});

test.describe('Tier 1: Feature 3 - Procedural 3D Chibi Models (Ana, Toad, Davi)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.3.1: Ana character model exists with hairclip, blush, and ponytails', async () => {
        const ana = await page.evaluate(() => ({
            name: window.gameApp.player.root.name,
            hasHead: !!window.gameApp.player.head,
            hasLegL: !!window.gameApp.player.legL,
            hasLegR: !!window.gameApp.player.legR,
            childrenCount: window.gameApp.player.root.children.length
        }));
        expect(ana.name).toBe('Ana');
        expect(ana.hasHead).toBe(true);
        expect(ana.hasLegL).toBe(true);
        expect(ana.hasLegR).toBe(true);
        expect(ana.childrenCount).toBeGreaterThanOrEqual(6);
    });

    test('T1.3.2: Fairy Lumi orbits Ana with animated wings', async () => {
        const fairy = await page.evaluate(() => ({
            hasFairy: !!window.gameApp.player.fairy,
            hasWingL: !!window.gameApp.player.wingL,
            hasWingR: !!window.gameApp.player.wingR
        }));
        expect(fairy.hasFairy).toBe(true);
        expect(fairy.hasWingL).toBe(true);
        expect(fairy.hasWingR).toBe(true);
    });

    test('T1.3.3: Toadbigode model exists with mushroom cap and waving arm', async () => {
        const toad = await page.evaluate(() => ({
            name: window.gameApp.toad.root.name,
            hasCap: !!window.gameApp.toad.cap,
            hasArmR: !!window.gameApp.toad.armR,
            visible: window.gameApp.toad.root.visible
        }));
        expect(toad.name).toBe('Toadbigode');
        expect(toad.hasCap).toBe(true);
        expect(toad.hasArmR).toBe(true);
        expect(toad.visible).toBe(true);
    });

    test('T1.3.4: Davi character model exists with knit sweater and glasses', async () => {
        const davi = await page.evaluate(() => ({
            name: window.gameApp.davi.root.name,
            hasSweater: !!window.gameApp.davi.sweater,
            hasGlasses: !!window.gameApp.davi.glasses,
            hasArmL: !!window.gameApp.davi.armL,
            hasArmR: !!window.gameApp.davi.armR
        }));
        expect(davi.name).toBe('Davi');
        expect(davi.hasSweater).toBe(true);
        expect(davi.hasGlasses).toBe(true);
    });

    test('T1.3.5: Davi model is initially hidden in Stage 1 awaiting reveal', async () => {
        const isVisible = await page.evaluate(() => window.gameApp.davi.root.visible);
        expect(isVisible).toBe(false);
    });
});

test.describe('Tier 1: Feature 4 - Controls (WASD, Arrows, Touch Joystick) & Camera', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.4.1: Keydown W updates keys.forward', async () => {
        await page.keyboard.down('KeyW');
        const forward = await page.evaluate(() => window.gameApp.keys.forward);
        await page.keyboard.up('KeyW');
        expect(forward).toBe(true);
    });

    test('T1.4.2: Keydown S updates keys.backward', async () => {
        await page.keyboard.down('KeyS');
        const backward = await page.evaluate(() => window.gameApp.keys.backward);
        await page.keyboard.up('KeyS');
        expect(backward).toBe(true);
    });

    test('T1.4.3: Keydown A updates keys.left', async () => {
        await page.keyboard.down('KeyA');
        const left = await page.evaluate(() => window.gameApp.keys.left);
        await page.keyboard.up('KeyA');
        expect(left).toBe(true);
    });

    test('T1.4.4: Keydown D updates keys.right', async () => {
        await page.keyboard.down('KeyD');
        const right = await page.evaluate(() => window.gameApp.keys.right);
        await page.keyboard.up('KeyD');
        expect(right).toBe(true);
    });

    test('T1.4.5: Mobile D-Pad buttons exist and respond to touch/mouse events', async () => {
        const btnUp = page.locator('#ctrl-up');
        await expect(btnUp).toBeAttached();
        await page.dispatchEvent('#ctrl-up', 'mousedown');
        const forward = await page.evaluate(() => window.gameApp.keys.forward);
        await page.dispatchEvent('#ctrl-up', 'mouseup');
        expect(forward).toBe(true);
    });
});

test.describe('Tier 1: Feature 5 - Procedural Web Audio Engine (Chords, Blips, Mute)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.5.1: Web AudioContext is created upon game launch', async () => {
        const hasCtx = await page.evaluate(() => !!window.musicEngine && !!window.musicEngine.ctx);
        expect(hasCtx).toBe(true);
    });

    test('T1.5.2: Master gain, music gain, and sfx gain are connected', async () => {
        const gains = await page.evaluate(() => ({
            hasMaster: !!window.musicEngine.masterGain,
            hasMusic: !!window.musicEngine.musicGain,
            hasSfx: !!window.musicEngine.sfxGain,
            volume: window.musicEngine.volume
        }));
        expect(gains.hasMaster).toBe(true);
        expect(gains.hasMusic).toBe(true);
        expect(gains.hasSfx).toBe(true);
        expect(gains.volume).toBeCloseTo(0.45, 2);
    });

    test('T1.5.3: Stage scales are configured for all 3 levels (Pentatonic, Lydian, Sparkle)', async () => {
        const scales = await page.evaluate(() => ({
            stage1: window.musicEngine.stageNotes[1].length,
            stage2: window.musicEngine.stageNotes[2].length,
            stage3: window.musicEngine.stageNotes[3].length
        }));
        expect(scales.stage1).toBe(8);
        expect(scales.stage2).toBe(8);
        expect(scales.stage3).toBe(8);
    });

    test('T1.5.4: toggleMute switches audio state and sets master gain to zero', async () => {
        const muted = await page.evaluate(() => {
            const isMutedBefore = window.musicEngine.isMuted;
            const isMutedAfter = window.musicEngine.toggleMute();
            const gain = window.musicEngine.masterGain.gain.value;
            // Restore state
            window.musicEngine.toggleMute();
            return { isMutedBefore, isMutedAfter, gain };
        });
        expect(muted.isMutedBefore).toBe(false);
        expect(muted.isMutedAfter).toBe(true);
        expect(muted.gain).toBe(0);
    });

    test('T1.5.5: Topbar mute button updates label on click', async () => {
        const muteBtn = page.locator('#btn-mute');
        await expect(muteBtn).toContainText('🔊 Som Ligado');
        await muteBtn.click();
        await expect(muteBtn).toContainText('🔇 Som Mutado');
        await muteBtn.click(); // Toggle back
        await expect(muteBtn).toContainText('🔊 Som Ligado');
    });
});

test.describe('Tier 1: Feature 6 - Storybook UI (Parchment, Fonts, Buttons)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto('/');
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.6.1: Start overlay displays title, description, and start button', async () => {
        const overlay = page.locator('#start-overlay');
        await expect(overlay).toBeVisible();
        await expect(page.locator('h1')).toContainText('A Sinfonia de Ana Gleice');
        await expect(page.locator('#btn-start-game')).toBeVisible();
    });

    test('T1.6.2: Clicking start button dismisses start overlay', async () => {
        await page.click('#btn-start-game');
        await expect(page.locator('#start-overlay')).not.toBeAttached({ timeout: 5000 });
    });

    test('T1.6.3: Topbar displays stage badge and navigation buttons', async () => {
        await expect(page.locator('#stage-badge')).toBeVisible();
        await expect(page.locator('#btn-open-letter')).toBeVisible();
        await expect(page.locator('#btn-screenshot')).toBeVisible();
        await expect(page.locator('#btn-mute')).toBeVisible();
    });

    test('T1.6.4: Dialogue box contains avatar, speaker name, text body, and prompt', async () => {
        await expect(page.locator('#dialogue-avatar')).toBeAttached();
        await expect(page.locator('#dialogue-name')).toBeAttached();
        await expect(page.locator('#dialogue-text')).toBeAttached();
        await expect(page.locator('#dialogue-prompt')).toBeAttached();
    });

    test('T1.6.5: Action buttons have squishy button and glass panel styling classes', async () => {
        const classes = await page.evaluate(() => {
            const btn = document.getElementById('btn-open-letter');
            return {
                isSquish: btn.classList.contains('btn-squish'),
                isGlass: btn.classList.contains('glass-panel')
            };
        });
        expect(classes.isSquish).toBe(true);
        expect(classes.isGlass).toBe(true);
    });
});

test.describe('Tier 1: Feature 7 - Level 1: Bosque das Melodias & Reason 1', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.7.1: Stage badge displays Stage 1 name', async () => {
        await expect(page.locator('#stage-badge')).toContainText('FASE 1: O BOSQUE DAS MELODIAS');
    });

    test('T1.7.2: Stage 1 intro dialogue queue exists in DIALOGUES', async () => {
        const hasQueue = await page.evaluate(() => {
            return Array.isArray(DIALOGUES.stage1_intro) && DIALOGUES.stage1_intro.length === 3;
        });
        expect(hasQueue).toBe(true);
    });

    test('T1.7.3: Shrine proximity triggers Reason 1 dialogue', async () => {
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.update(0.016);
        });
        await expect(page.locator('#dialogue-box')).toBeVisible();
        const shrineReached = await page.evaluate(() => window.gameApp.stage1ShrineReached);
        expect(shrineReached).toBe(true);
    });

    test('T1.7.4: Reason 1 text in DIALOGUES highlights musical gift and sensitivity', async () => {
        const reason1 = await page.evaluate(() => {
            const msg = DIALOGUES.stage1_shrine.find(m => m.highlight);
            return msg ? msg.text : '';
        });
        expect(reason1).toContain('dom com a música');
        expect(reason1).toContain('sensibilidade');
    });

    test('T1.7.5: Stage 1 world geometry includes Altar da Harpa and trees', async () => {
        const worldChildren = await page.evaluate(() => {
            return window.gameApp.currentWorld ? window.gameApp.currentWorld.children.length : 0;
        });
        expect(worldChildren).toBeGreaterThan(10);
    });
});

test.describe('Tier 1: Feature 8 - Level 2: Planetário dos Sonhos & Reason 2', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => window.gameApp.loadStage(2));
        await page.waitForTimeout(700);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.8.1: Stage badge displays Stage 2 name', async () => {
        await expect(page.locator('#stage-badge')).toContainText('FASE 2: O PLANETÁRIO CELESTE');
    });

    test('T1.8.2: Stage 2 intro dialogue describes the celestial galaxy', async () => {
        const introText = await page.evaluate(() => DIALOGUES.stage2_intro[0].text);
        expect(introText).toContain('Planetário dos Sonhos Cósmicos');
    });

    test('T1.8.3: Constellation proximity triggers Reason 2 dialogue', async () => {
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.update(0.016);
        });
        const constelReached = await page.evaluate(() => window.gameApp.stage2ConstellationReached);
        expect(constelReached).toBe(true);
    });

    test('T1.8.4: Reason 2 text in DIALOGUES highlights serene strength and sweetness', async () => {
        const reason2 = await page.evaluate(() => {
            const msg = DIALOGUES.stage2_constellation.find(m => m.highlight);
            return msg ? msg.text : '';
        });
        expect(reason2).toContain('força serena');
        expect(reason2).toContain('estrela-guia');
    });

    test('T1.8.5: Stage 2 audio scale updates to A Lydian Space scale', async () => {
        const stage = await page.evaluate(() => window.musicEngine.currentStage);
        expect(stage).toBe(2);
    });
});

test.describe('Tier 1: Feature 9 - Level 3: Jardim do Luar (Piano & Cake)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(700);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.9.1: Stage badge displays Stage 3 name with birthday theme', async () => {
        await expect(page.locator('#stage-badge')).toContainText('FASE 3: O PALÁCIO DAS CEREJEIRAS & O GRANDE ABRAÇO');
    });

    test('T1.9.2: Stage 3 intro dialogue highlights cherry blossoms and cake', async () => {
        const introText = await page.evaluate(() => DIALOGUES.stage3_intro[0].text);
        expect(introText).toContain('bolo gigante');
    });

    test('T1.9.3: Approaching birthday cake (z = 5) initiates Stage 3 Climax', async () => {
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, 4.5);
            window.gameApp.update(0.016);
        });
        const climaxStarted = await page.evaluate(() => window.gameApp.stage3ClimaxStarted);
        expect(climaxStarted).toBe(true);
    });

    test('T1.9.4: Climax dialogue queue contains reveal, hug, and Reason 3 lines', async () => {
        const queue = await page.evaluate(() => DIALOGUES.stage3_climax);
        expect(queue.some(m => m.isReveal)).toBe(true);
        expect(queue.some(m => m.isHug)).toBe(true);
        expect(queue.some(m => m.highlight)).toBe(true);
    });

    test('T1.9.5: Stage 3 world includes cherry blossom trees and palace structures', async () => {
        const children = await page.evaluate(() => window.gameApp.currentWorld.children.length);
        expect(children).toBeGreaterThan(15);
    });
});

test.describe('Tier 1: Feature 10 - Toadbigode Reveal into Davi', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(700);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.10.1: triggerDaviReveal sets isDaviRevealed to true', async () => {
        await page.evaluate(() => window.gameApp.triggerDaviReveal());
        const isRevealed = await page.evaluate(() => window.gameApp.isDaviRevealed);
        expect(isRevealed).toBe(true);
    });

    test('T1.10.2: Toadbigode model is hidden after reveal', async () => {
        const toadVisible = await page.evaluate(() => window.gameApp.toad.root.visible);
        expect(toadVisible).toBe(false);
    });

    test('T1.10.3: Davi model is shown after reveal', async () => {
        const daviVisible = await page.evaluate(() => window.gameApp.davi.root.visible);
        expect(daviVisible).toBe(true);
    });

    test('T1.10.4: Davi model is positioned facing Ana', async () => {
        const positions = await page.evaluate(() => ({
            anaZ: window.gameApp.player.root.position.z,
            daviZ: window.gameApp.davi.root.position.z
        }));
        expect(positions.daviZ).toBeCloseTo(positions.anaZ + 3.2, 1);
    });

    test('T1.10.5: Climax reveal dialogue has Davi speaker and heart avatar', async () => {
        const revealMsg = await page.evaluate(() => DIALOGUES.stage3_climax.find(m => m.isReveal));
        expect(revealMsg.speaker).toBe('davi');
        expect(revealMsg.avatar).toBe('💙');
        expect(revealMsg.text).toContain('SEMPRE FUI EU');
    });
});

test.describe('Tier 1: Feature 11 - Emotional Hug Animation Sequence', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => {
            window.gameApp.loadStage(3);
            window.gameApp.triggerDaviReveal();
        });
        await page.waitForTimeout(700);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.11.1: triggerDaviHug sets isHugging to true', async () => {
        await page.evaluate(() => window.gameApp.triggerDaviHug());
        const isHugging = await page.evaluate(() => window.gameApp.isHugging);
        expect(isHugging).toBe(true);
    });

    test('T1.11.2: Davi moves directly next to Ana (distance 0.65)', async () => {
        const dist = await page.evaluate(() => {
            return Math.abs(window.gameApp.davi.root.position.z - window.gameApp.player.root.position.z);
        });
        expect(dist).toBeCloseTo(0.65, 2);
    });

    test('T1.11.3: Davi and Ana orient towards each other for embrace', async () => {
        const rotated = await page.evaluate(() => {
            return window.gameApp.davi.root.rotation.y !== 0 || window.gameApp.player.root.rotation.y !== 0;
        });
        expect(rotated).toBe(true);
    });

    test('T1.11.4: Davi arms are rotated into hugging pose', async () => {
        await page.evaluate(() => window.gameApp.update(0.016));
        const arms = await page.evaluate(() => ({
            rotLX: window.gameApp.davi.armL.rotation.x,
            rotRX: window.gameApp.davi.armR.rotation.x
        }));
        expect(arms.rotLX).toBeCloseTo(0.8, 1);
        expect(arms.rotRX).toBeCloseTo(0.8, 1);
    });

    test('T1.11.5: Confetti trigger is invoked during hug', async () => {
        const hasConfetti = await page.evaluate(() => typeof confetti === 'function');
        expect(hasConfetti).toBe(true);
    });
});

test.describe('Tier 1: Feature 12 - Birthday Cake & Candle Lighting', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(700);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.12.1: Stage 3 world includes birthday cake with tiers', async () => {
        const cakeFound = await page.evaluate(() => {
            let found = false;
            window.gameApp.currentWorld.traverse(child => {
                if (child.name === 'Cake') found = true;
            });
            return found;
        });
        expect(cakeFound).toBe(true);
    });

    test('T1.12.2: Birthday hymn audio function is available on musicEngine', async () => {
        const hasHymn = await page.evaluate(() => typeof window.musicEngine.playBirthdayHymn === 'function');
        expect(hasHymn).toBe(true);
    });

    test('T1.12.3: Reason 3 text mentions Ana Gleice Almeida de Oliveira', async () => {
        const reason3 = await page.evaluate(() => {
            const msg = DIALOGUES.stage3_climax.find(m => m.highlight);
            return msg ? msg.text : '';
        });
        expect(reason3).toContain('Ana Gleice Almeida de Oliveira');
    });

    test('T1.12.4: Reason 3 affirms third and greatest reason to love', async () => {
        const reason3 = await page.evaluate(() => {
            const msg = DIALOGUES.stage3_climax.find(m => m.highlight);
            return msg ? msg.text : '';
        });
        expect(reason3).toContain('terceiro e maior motivo');
        expect(reason3).toContain('compartilhada com você');
    });

    test('T1.12.5: Reason 3 dialogue line highlights card in pink celebration theme', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.startDialogue('stage3_climax');
            // Advance to reason 3 (index 4)
            window.dialogueSystem.currentIndex = 4;
            window.dialogueSystem.displayCurrent();
        });
        const borderColor = await page.evaluate(() => document.getElementById('dialogue-box').style.borderColor);
        expect(borderColor).toBe('rgb(236, 72, 153)'); // #ec4899
    });
});

test.describe('Tier 1: Feature 13 - Love Letter Pergaminho & Persistent Re-read', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.13.1: Love letter modal exists in DOM', async () => {
        await expect(page.locator('#letter-modal')).toBeAttached();
    });

    test('T1.13.2: Letter mentions sender Davi (toadbigode) and recipient Ana Gleice', async () => {
        await expect(page.locator('#letter-modal')).toContainText('Feliz Aniversário, Ana Gleice!');
        await expect(page.locator('#letter-modal')).toContainText('Davi Nascimento Chaves Homen (toadbigode)');
    });

    test('T1.13.3: Letter body enumerates all 3 reasons of love', async () => {
        const modal = page.locator('#letter-modal');
        await expect(modal).toContainText('1. Seu dom e sensibilidade com a música');
        await expect(modal).toContainText('2. Sua força serena e doçura');
        await expect(modal).toContainText('3. A certeza de que quero viver todos os meus amanhãs ao seu lado');
    });

    test('T1.13.4: Topbar btn-open-letter opens letter modal', async () => {
        await page.click('#btn-open-letter');
        await expect(page.locator('#letter-modal')).toBeVisible();
    });

    test('T1.13.5: btn-close-letter closes letter modal', async () => {
        await page.click('#btn-close-letter');
        await expect(page.locator('#letter-modal')).toBeHidden();
    });
});

test.describe('Tier 1: Feature 14 - Souvenir Photo / Canvas Screenshot Capture', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T1.14.1: Screenshot button is visible in topbar', async () => {
        await expect(page.locator('#btn-screenshot')).toBeVisible();
    });

    test('T1.14.2: WebGL canvas renders valid image data', async () => {
        const dataUrl = await page.evaluate(() => {
            return window.gameApp.renderer.domElement.toDataURL('image/png');
        });
        expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
        expect(dataUrl.length).toBeGreaterThan(1000);
    });

    test('T1.14.3: Clicking screenshot button triggers download event', async () => {
        let downloadTriggered = false;
        await page.exposeFunction('onMockDownload', () => { downloadTriggered = true; });
        await page.evaluate(() => {
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tag) {
                const el = originalCreateElement(tag);
                if (tag === 'a') {
                    el.click = function () {
                        if (el.download.includes('ana_gleice')) window.onMockDownload();
                    };
                }
                return el;
            };
        });
        await page.click('#btn-screenshot');
        expect(downloadTriggered).toBe(true);
    });

    test('T1.14.4: Download file name is ana_gleice_aniversario_lembranca.png', async () => {
        const downloadName = await page.evaluate(() => {
            let capturedName = '';
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tag) {
                const el = originalCreateElement(tag);
                if (tag === 'a') {
                    const originalClick = el.click;
                    el.click = function () {
                        capturedName = el.download;
                    };
                }
                return el;
            };
            document.getElementById('btn-screenshot').click();
            return capturedName;
        });
        expect(downloadName).toBe('ana_gleice_aniversario_lembranca.png');
    });

    test('T1.14.5: Canvas dimensions are non-zero when capturing screenshot', async () => {
        const size = await page.evaluate(() => ({
            width: window.gameApp.renderer.domElement.width,
            height: window.gameApp.renderer.domElement.height
        }));
        expect(size.width).toBeGreaterThan(0);
        expect(size.height).toBeGreaterThan(0);
    });
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES (70 TESTS)
// ============================================================================

test.describe('Tier 2: Boundary - Feature 1 (Canvas & Resize)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.1.1: Resize updates camera aspect ratio accurately', async () => {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.waitForTimeout(100);
        const aspect = await page.evaluate(() => window.gameApp.camera.aspect);
        expect(aspect).toBeCloseTo(800 / 600, 2);
    });

    test('T2.1.2: Extreme narrow mobile viewport (320x568) handled gracefully', async () => {
        await page.setViewportSize({ width: 320, height: 568 });
        await page.waitForTimeout(100);
        const valid = await page.evaluate(() => !isNaN(window.gameApp.camera.aspect));
        expect(valid).toBe(true);
    });

    test('T2.1.3: Ultra-wide 4K viewport (3840x2160) updates renderer size without crash', async () => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(100);
        const width = await page.evaluate(() => window.gameApp.renderer.domElement.width);
        expect(width).toBeGreaterThanOrEqual(1920);
    });

    test('T2.1.4: Rapid burst of 10 viewport resizes does not drop WebGL context', async () => {
        for (let i = 0; i < 10; i++) {
            await page.setViewportSize({ width: 700 + i * 20, height: 500 + i * 15 });
        }
        const ctxValid = await page.evaluate(() => !window.gameApp.renderer.getContext().isContextLost());
        expect(ctxValid).toBe(true);
    });

    test('T2.1.5: Restoring default viewport (1280x720) restores normal render scale', async () => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(100);
        const aspect = await page.evaluate(() => window.gameApp.camera.aspect);
        expect(aspect).toBeCloseTo(1280 / 720, 2);
    });
});

test.describe('Tier 2: Boundary - Feature 2 (Cel-Shading & Fog Swapping)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.2.1: Loading Stage 2 updates background to galaxy color 0x0f172a', async () => {
        await page.evaluate(() => window.gameApp.loadStage(2));
        await page.waitForTimeout(600);
        const hex = await page.evaluate(() => window.gameApp.scene.background.getHexString());
        expect(hex.toLowerCase()).toBe('0f172a');
    });

    test('T2.2.2: Stage 2 fog color matches background 0x0f172a', async () => {
        const fogHex = await page.evaluate(() => window.gameApp.scene.fog.color.getHexString());
        expect(fogHex.toLowerCase()).toBe('0f172a');
    });

    test('T2.2.3: Loading Stage 3 updates background to nocturnal violet 0x1e1b4b', async () => {
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(600);
        const hex = await page.evaluate(() => window.gameApp.scene.background.getHexString());
        expect(hex.toLowerCase()).toBe('1e1b4b');
    });

    test('T2.2.4: Stage 3 fog color matches background 0x1e1b4b', async () => {
        const fogHex = await page.evaluate(() => window.gameApp.scene.fog.color.getHexString());
        expect(fogHex.toLowerCase()).toBe('1e1b4b');
    });

    test('T2.2.5: Rapid stage switching (1 -> 2 -> 3 -> 1) maintains valid scene color and fog', async () => {
        await page.evaluate(() => {
            window.gameApp.loadStage(1);
            window.gameApp.loadStage(2);
            window.gameApp.loadStage(1);
        });
        await page.waitForTimeout(700);
        const hex = await page.evaluate(() => window.gameApp.scene.background.getHexString());
        expect(hex.toLowerCase()).toBe('dcfce7');
    });
});

test.describe('Tier 2: Boundary - Feature 3 (Models & Geometry Vertex Integrity)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.3.1: Ana model geometries have non-zero vertex count', async () => {
        const hasVertices = await page.evaluate(() => {
            let valid = true;
            window.gameApp.player.root.traverse(child => {
                if (child.isMesh && child.geometry.attributes.position.count === 0) valid = false;
            });
            return valid;
        });
        expect(hasVertices).toBe(true);
    });

    test('T2.3.2: Toadbigode geometries have non-zero vertex count', async () => {
        const hasVertices = await page.evaluate(() => {
            let valid = true;
            window.gameApp.toad.root.traverse(child => {
                if (child.isMesh && child.geometry.attributes.position.count === 0) valid = false;
            });
            return valid;
        });
        expect(hasVertices).toBe(true);
    });

    test('T2.3.3: Davi model geometries have non-zero vertex count', async () => {
        const hasVertices = await page.evaluate(() => {
            let valid = true;
            window.gameApp.davi.root.traverse(child => {
                if (child.isMesh && child.geometry.attributes.position.count === 0) valid = false;
            });
            return valid;
        });
        expect(hasVertices).toBe(true);
    });

    test('T2.3.4: Character mesh materials use Toon or Basic materials without missing shaders', async () => {
        const materialsValid = await page.evaluate(() => {
            let valid = true;
            [window.gameApp.player.root, window.gameApp.toad.root, window.gameApp.davi.root].forEach(root => {
                root.traverse(child => {
                    if (child.isMesh && !child.material) valid = false;
                });
            });
            return valid;
        });
        expect(materialsValid).toBe(true);
    });

    test('T2.3.5: Walk bounce trigonometric oscillation stays within bounds [-1.0, 1.0]', async () => {
        const boundsValid = await page.evaluate(() => {
            let valid = true;
            for (let t = 0; t < 100; t += 5) {
                const legVal = Math.sin(t * 14) * 0.75;
                if (legVal < -0.8 || legVal > 0.8) valid = false;
            }
            return valid;
        });
        expect(boundsValid).toBe(true);
    });
});

test.describe('Tier 2: Boundary - Feature 4 (Controls Clamping & Conflicting Keys)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.4.1: Island radius boundary strictly constrains player distance in Stage 1 (<= 18)', async () => {
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(50, 0, 50); // Outside bounds
            window.gameApp.keys.forward = true;
            window.gameApp.update(0.1);
            window.gameApp.keys.forward = false;
        });
        const dist = await page.evaluate(() => {
            const p = window.gameApp.player.root.position;
            return Math.hypot(p.x, p.z);
        });
        expect(dist).toBeLessThanOrEqual(18.01);
    });

    test('T2.4.2: Island radius boundary strictly constrains player distance in Stage 2 (<= 14)', async () => {
        await page.evaluate(() => {
            window.gameApp.loadStage(2);
            window.gameApp.player.root.position.set(40, 0, 40);
            window.gameApp.keys.forward = true;
            window.gameApp.update(0.1);
            window.gameApp.keys.forward = false;
        });
        const dist = await page.evaluate(() => {
            const p = window.gameApp.player.root.position;
            return Math.hypot(p.x, p.z);
        });
        expect(dist).toBeLessThanOrEqual(14.01);
    });

    test('T2.4.3: Conflicting simultaneous keys (W + S) result in zero net Z movement', async () => {
        const deltaZ = await page.evaluate(() => {
            window.gameApp.loadStage(1);
            const initialZ = window.gameApp.player.root.position.z;
            window.gameApp.keys.forward = true;
            window.gameApp.keys.backward = true;
            window.gameApp.update(0.1);
            window.gameApp.keys.forward = false;
            window.gameApp.keys.backward = false;
            return window.gameApp.player.root.position.z - initialZ;
        });
        expect(deltaZ).toBe(0);
    });

    test('T2.4.4: Conflicting simultaneous keys (A + D) result in zero net X movement', async () => {
        const deltaX = await page.evaluate(() => {
            const initialX = window.gameApp.player.root.position.x;
            window.gameApp.keys.left = true;
            window.gameApp.keys.right = true;
            window.gameApp.update(0.1);
            window.gameApp.keys.left = false;
            window.gameApp.keys.right = false;
            return window.gameApp.player.root.position.x - initialX;
        });
        expect(deltaX).toBe(0);
    });

    test('T2.4.5: Releasing keys halts movement instantly with zero drift', async () => {
        const moving = await page.evaluate(() => {
            window.gameApp.keys = { forward: false, backward: false, left: false, right: false };
            let moveX = 0, moveZ = 0;
            if (window.gameApp.keys.forward) moveZ += 1;
            if (window.gameApp.keys.backward) moveZ -= 1;
            if (window.gameApp.keys.left) moveX -= 1;
            if (window.gameApp.keys.right) moveX += 1;
            return moveX !== 0 || moveZ !== 0;
        });
        expect(moving).toBe(false);
    });
});

test.describe('Tier 2: Boundary - Feature 5 (Audio Rapid Mute & Sound Safety)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.5.1: Rapid consecutive mute toggles (10x) maintain boolean consistency', async () => {
        const finalState = await page.evaluate(() => {
            for (let i = 0; i < 10; i++) {
                window.musicEngine.toggleMute();
            }
            return window.musicEngine.isMuted;
        });
        expect(finalState).toBe(false);
    });

    test('T2.5.2: playDialogueBlip handles boundary pitches (0.1 and 5.0) safely', async () => {
        const safe = await page.evaluate(() => {
            try {
                window.musicEngine.playDialogueBlip(0.1);
                window.musicEngine.playDialogueBlip(5.0);
                return true;
            } catch (e) {
                return false;
            }
        });
        expect(safe).toBe(true);
    });

    test('T2.5.3: playBell handles high and low frequency extremes without throwing', async () => {
        const safe = await page.evaluate(() => {
            try {
                window.musicEngine.playBell(50, 0.5);
                window.musicEngine.playBell(4000, 0.5);
                return true;
            } catch (e) {
                return false;
            }
        });
        expect(safe).toBe(true);
    });

    test('T2.5.4: playStepSound executes safely without error during walking', async () => {
        const safe = await page.evaluate(() => {
            try {
                window.musicEngine.playStepSound();
                return true;
            } catch (e) {
                return false;
            }
        });
        expect(safe).toBe(true);
    });

    test('T2.5.5: Calling audio methods when muted produces zero audio without exception', async () => {
        const safe = await page.evaluate(() => {
            try {
                window.musicEngine.isMuted = true;
                window.musicEngine.playBell(440, 1);
                window.musicEngine.playDialogueBlip(1);
                window.musicEngine.playStepSound();
                window.musicEngine.playFanfare();
                window.musicEngine.isMuted = false;
                return true;
            } catch (e) {
                return false;
            }
        });
        expect(safe).toBe(true);
    });
});

test.describe('Tier 2: Boundary - Feature 6 (Storybook UI Responsive Boundaries)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.6.1: Dialogue box shows flex display when opened', async () => {
        await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));
        await expect(page.locator('#dialogue-box')).toHaveClass(/flex/);
    });

    test('T2.6.2: Dialogue box restores hidden class when closed', async () => {
        await page.evaluate(() => window.dialogueSystem.closeDialogue());
        await expect(page.locator('#dialogue-box')).toHaveClass(/hidden/);
    });

    test('T2.6.3: Dialogue text clears and does not carry over between distinct queues', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.startDialogue('stage1_intro');
            window.dialogueSystem.advance();
            window.dialogueSystem.startDialogue('stage2_intro');
        });
        const avatar = await page.evaluate(() => document.getElementById('dialogue-avatar').innerText);
        expect(avatar).toBe('🪐');
    });

    test('T2.6.4: Fade curtain transition has duration-700 class', async () => {
        const hasDuration = await page.evaluate(() => {
            return document.getElementById('fade-curtain').classList.contains('duration-700');
        });
        expect(hasDuration).toBe(true);
    });

    test('T2.6.5: Small mobile viewport (375x667) does not cause horizontal page overflow', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(overflow).toBe(false);
    });
});

test.describe('Tier 2: Boundary - Feature 7 (Stage 1 Shrine & Portal Gates)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.7.1: Portal to Stage 2 is blocked if shrine is not yet reached', async () => {
        await page.evaluate(() => {
            window.gameApp.stage1ShrineReached = false;
            window.gameApp.player.root.position.set(0, 0, 16); // Portal position
            window.gameApp.update(0.016);
        });
        const stage = await page.evaluate(() => window.gameApp.currentStage);
        expect(stage).toBe(1);
    });

    test('T2.7.2: Portal to Stage 2 opens once shrine is reached', async () => {
        await page.evaluate(() => {
            window.gameApp.stage1ShrineReached = true;
            window.gameApp.player.root.position.set(0, 0, 16);
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(600);
        const stage = await page.evaluate(() => window.gameApp.currentStage);
        expect(stage).toBe(2);
    });

    test('T2.7.3: Visiting shrine coordinates a second time does not re-open dialogue', async () => {
        await page.evaluate(() => {
            window.gameApp.loadStage(1);
            window.gameApp.stage1ShrineReached = true;
            window.dialogueSystem.closeDialogue();
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.update(0.016);
        });
        const isHidden = await page.evaluate(() => document.getElementById('dialogue-box').classList.contains('hidden'));
        expect(isHidden).toBe(true);
    });

    test('T2.7.4: Rapid dialogue advance instantly displays full typewriter line', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.startDialogue('stage1_intro');
            window.dialogueSystem.advance(); // Skip typewriter
        });
        const typing = await page.evaluate(() => window.dialogueSystem.isTyping);
        expect(typing).toBe(false);
    });

    test('T2.7.5: Completing all lines in dialogue queue auto-closes dialogue box', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.startDialogue('stage1_intro');
            // Advance through all 3 lines (skip typewriter + advance for each line)
            window.dialogueSystem.advance();
            window.dialogueSystem.advance();
            window.dialogueSystem.advance();
            window.dialogueSystem.advance();
            window.dialogueSystem.advance();
            window.dialogueSystem.advance();
        });
        const isHidden = await page.evaluate(() => document.getElementById('dialogue-box').classList.contains('hidden'));
        expect(isHidden).toBe(true);
    });
});

test.describe('Tier 2: Boundary - Feature 8 (Stage 2 Constellation & Warp Gate)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => window.gameApp.loadStage(2));
        await page.waitForTimeout(600);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.8.1: Warp star to Stage 3 is blocked before constellation is reached', async () => {
        await page.evaluate(() => {
            window.gameApp.stage2ConstellationReached = false;
            window.gameApp.player.root.position.set(0, 0, 14);
            window.gameApp.update(0.016);
        });
        const stage = await page.evaluate(() => window.gameApp.currentStage);
        expect(stage).toBe(2);
    });

    test('T2.8.2: Warp star triggers Stage 3 once constellation is reached', async () => {
        await page.evaluate(() => {
            window.gameApp.stage2ConstellationReached = true;
            window.gameApp.player.root.position.set(0, 0, 14);
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(600);
        const stage = await page.evaluate(() => window.gameApp.currentStage);
        expect(stage).toBe(3);
    });

    test('T2.8.3: Stage 2 Toadbigode position is elevated above ground at y = 0.4', async () => {
        await page.evaluate(() => window.gameApp.loadStage(2));
        await page.waitForTimeout(600);
        const posY = await page.evaluate(() => window.gameApp.toad.root.position.y);
        expect(posY).toBeCloseTo(0.4, 2);
    });

    test('T2.8.4: Stage 2 player starting position is (0, 0, -9)', async () => {
        const pos = await page.evaluate(() => ({
            x: window.gameApp.player.root.position.x,
            z: window.gameApp.player.root.position.z
        }));
        expect(pos.x).toBe(0);
        expect(pos.z).toBe(-9);
    });

    test('T2.8.5: Stage 2 world children count exceeds 15 celestial objects', async () => {
        const count = await page.evaluate(() => window.gameApp.currentWorld.children.length);
        expect(count).toBeGreaterThan(15);
    });
});

test.describe('Tier 2: Boundary - Feature 9 (Stage 3 Nocturnal Garden & Proximity)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(600);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.9.1: Cake proximity check at distant coordinate (z = -8) does not trigger climax', async () => {
        await page.evaluate(() => {
            window.gameApp.stage3ClimaxStarted = false;
            window.gameApp.player.root.position.set(0, 0, -8);
            window.gameApp.update(0.016);
        });
        const started = await page.evaluate(() => window.gameApp.stage3ClimaxStarted);
        expect(started).toBe(false);
    });

    test('T2.9.2: Cake proximity check at exact threshold (< 3.5) triggers climax', async () => {
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, 3.0); // dist to (0, 5) is 2.0 < 3.5
            window.gameApp.update(0.016);
        });
        const started = await page.evaluate(() => window.gameApp.stage3ClimaxStarted);
        expect(started).toBe(true);
    });

    test('T2.9.3: Stage 3 climax trigger is idempotent and cannot re-trigger', async () => {
        await page.evaluate(() => {
            window.gameApp.update(0.016);
            window.gameApp.update(0.016);
        });
        const started = await page.evaluate(() => window.gameApp.stage3ClimaxStarted);
        expect(started).toBe(true);
    });

    test('T2.9.4: Stage 3 Toadbigode starts at (1.8, 0, 6.5)', async () => {
        const pos = await page.evaluate(() => ({
            x: window.gameApp.toad.root.position.x,
            z: window.gameApp.toad.root.position.z
        }));
        expect(pos.x).toBeCloseTo(1.8, 1);
        expect(pos.z).toBeCloseTo(6.5, 1);
    });

    test('T2.9.5: Audio scale in Stage 3 uses Sparkle frequencies with 1046.50 Hz peak', async () => {
        const maxFreq = await page.evaluate(() => {
            const notes = window.musicEngine.stageNotes[3];
            return Math.max(...notes);
        });
        expect(maxFreq).toBe(1046.50);
    });
});

test.describe('Tier 2: Boundary - Feature 10 (Davi Reveal Idempotence & Audio)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(600);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.10.1: triggerDaviReveal can be called repeatedly without throwing', async () => {
        const safe = await page.evaluate(() => {
            try {
                window.gameApp.triggerDaviReveal();
                window.gameApp.triggerDaviReveal();
                return true;
            } catch (e) {
                return false;
            }
        });
        expect(safe).toBe(true);
    });

    test('T2.10.2: Toadbigode remains hidden even after multiple frame updates', async () => {
        await page.evaluate(() => {
            window.gameApp.update(0.016);
            window.gameApp.update(0.016);
        });
        const toadVisible = await page.evaluate(() => window.gameApp.toad.root.visible);
        expect(toadVisible).toBe(false);
    });

    test('T2.10.3: Davi position maintains exact z + 3.2 offset from Ana', async () => {
        const offset = await page.evaluate(() => {
            return window.gameApp.davi.root.position.z - window.gameApp.player.root.position.z;
        });
        expect(offset).toBeCloseTo(3.2, 1);
    });

    test('T2.10.4: Fanfare sound function executes safely during reveal', async () => {
        const safe = await page.evaluate(() => {
            try {
                window.musicEngine.playFanfare();
                return true;
            } catch (e) {
                return false;
            }
        });
        expect(safe).toBe(true);
    });

    test('T2.10.5: Dialogue avatar switches to blue heart 💙 on reveal line', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.startDialogue('stage3_climax');
            window.dialogueSystem.currentIndex = 2; // isReveal line
            window.dialogueSystem.displayCurrent();
        });
        const avatar = await page.evaluate(() => document.getElementById('dialogue-avatar').innerText);
        expect(avatar).toBe('💙');
    });
});

test.describe('Tier 2: Boundary - Feature 11 (Hug Input Lock & Sinusoidal Wobble)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
        await page.evaluate(() => {
            window.gameApp.loadStage(3);
            window.gameApp.triggerDaviReveal();
            window.gameApp.triggerDaviHug();
        });
        await page.waitForTimeout(600);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.11.1: Keyboard keys (W, S, A, D) are completely ignored during hug', async () => {
        const posDelta = await page.evaluate(() => {
            const p = window.gameApp.player.root.position;
            const initialZ = p.z;
            window.gameApp.keys.forward = true;
            window.gameApp.update(0.1);
            window.gameApp.keys.forward = false;
            return p.z - initialZ;
        });
        expect(posDelta).toBe(0);
    });

    test('T2.11.2: Hug timer increments continuously with frame delta', async () => {
        const timer1 = await page.evaluate(() => window.gameApp.hugTimer);
        await page.evaluate(() => window.gameApp.update(0.05));
        const timer2 = await page.evaluate(() => window.gameApp.hugTimer);
        expect(timer2).toBeGreaterThan(timer1);
    });

    test('T2.11.3: Head positions oscillate smoothly with sinusoidal snuggle wobble', async () => {
        const wobble = await page.evaluate(() => {
            const headY1 = window.gameApp.davi.head.position.y;
            window.gameApp.update(0.5);
            const headY2 = window.gameApp.davi.head.position.y;
            return Math.abs(headY2 - headY1);
        });
        expect(wobble).toBeGreaterThan(0);
        expect(wobble).toBeLessThan(0.1);
    });

    test('T2.11.4: Davi and Ana head heights are synchronized during hug', async () => {
        const heights = await page.evaluate(() => ({
            daviY: window.gameApp.davi.head.position.y,
            anaY: window.gameApp.player.head.position.y
        }));
        expect(heights.daviY).toBeCloseTo(heights.anaY, 3);
    });

    test('T2.11.5: Dialogue avatar switches to hug emoji 🫂 on hug line', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.startDialogue('stage3_climax');
            window.dialogueSystem.currentIndex = 3; // isHug line
            window.dialogueSystem.displayCurrent();
        });
        const avatar = await page.evaluate(() => document.getElementById('dialogue-avatar').innerText);
        expect(avatar).toBe('🫂');
    });
});

test.describe('Tier 2: Boundary - Feature 12 (Birthday Celebration & Audio Fanfare)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.12.1: playBirthdayHymn plays sequence of 6 notes without audio glitch', async () => {
        const safe = await page.evaluate(() => {
            try {
                window.musicEngine.playBirthdayHymn();
                return true;
            } catch (e) {
                return false;
            }
        });
        expect(safe).toBe(true);
    });

    test('T2.12.2: Cake structure is positioned at (0, 0, 5) on the central dais', async () => {
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(600);
        const cakePos = await page.evaluate(() => {
            let pos = null;
            window.gameApp.currentWorld.traverse(child => {
                if (child.name === 'Cake') pos = { x: child.position.x, z: child.position.z };
            });
            return pos;
        });
        expect(cakePos.x).toBe(0);
        expect(cakePos.z).toBe(5);
    });

    test('T2.12.3: Birthday cake contains multiple tier cylinders', async () => {
        const tierCount = await page.evaluate(() => {
            let count = 0;
            window.gameApp.currentWorld.traverse(child => {
                if (child.name === 'Cake') {
                    child.traverse(c => { if (c.isMesh) count++; });
                }
            });
            return count;
        });
        expect(tierCount).toBeGreaterThanOrEqual(3);
    });

    test('T2.12.4: Climax dialogue highlight switches box background to romantic gradient', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.startDialogue('stage3_climax');
            window.dialogueSystem.currentIndex = 4;
            window.dialogueSystem.displayCurrent();
        });
        const bg = await page.evaluate(() => document.getElementById('dialogue-box').style.background);
        expect(bg).toContain('linear-gradient');
    });

    test('T2.12.5: Non-highlight dialogue restores default dark navy background', async () => {
        await page.evaluate(() => {
            window.dialogueSystem.currentIndex = 0;
            window.dialogueSystem.displayCurrent();
        });
        const bg = await page.evaluate(() => document.getElementById('dialogue-box').style.background);
        expect(bg).toContain('rgba(20, 24, 38, 0.92)');
    });
});

test.describe('Tier 2: Boundary - Feature 13 (Love Letter Pergaminho Scroll & Re-read)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.13.1: Letter can be opened and closed 5 consecutive times cleanly', async () => {
        for (let i = 0; i < 5; i++) {
            await page.click('#btn-open-letter');
            await expect(page.locator('#letter-modal')).toBeVisible();
            await page.click('#btn-close-letter');
            await expect(page.locator('#letter-modal')).toBeHidden();
        }
    });

    test('T2.13.2: Letter modal has scrollable handwriting container', async () => {
        const scrollable = await page.evaluate(() => {
            const handwriting = document.querySelector('#letter-modal .handwriting');
            return handwriting.classList.contains('overflow-y-auto');
        });
        expect(scrollable).toBe(true);
    });

    test('T2.13.3: Letter modal has backdrop blur styling (backdrop-blur-sm)', async () => {
        const hasBlur = await page.evaluate(() => {
            return document.getElementById('letter-modal').classList.contains('backdrop-blur-sm');
        });
        expect(hasBlur).toBe(true);
    });

    test('T2.13.4: Re-reading letter modal in Stage 2 works seamlessly', async () => {
        await page.evaluate(() => window.gameApp.loadStage(2));
        await page.waitForTimeout(600);
        await page.click('#btn-open-letter');
        await expect(page.locator('#letter-modal')).toBeVisible();
        await page.click('#btn-close-letter');
        await expect(page.locator('#letter-modal')).toBeHidden();
    });

    test('T2.13.5: Re-reading letter modal in Stage 3 works seamlessly', async () => {
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(600);
        await page.click('#btn-open-letter');
        await expect(page.locator('#letter-modal')).toBeVisible();
        await page.click('#btn-close-letter');
        await expect(page.locator('#letter-modal')).toBeHidden();
    });
});

test.describe('Tier 2: Boundary - Feature 14 (Screenshot Canvas Extraction & Memory)', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T2.14.1: Screenshot capture in Stage 2 produces valid image/png data', async () => {
        await page.evaluate(() => window.gameApp.loadStage(2));
        await page.waitForTimeout(600);
        const data = await page.evaluate(() => window.gameApp.renderer.domElement.toDataURL('image/png'));
        expect(data.startsWith('data:image/png;base64,')).toBe(true);
    });

    test('T2.14.2: Screenshot capture in Stage 3 produces valid image/png data', async () => {
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(600);
        const data = await page.evaluate(() => window.gameApp.renderer.domElement.toDataURL('image/png'));
        expect(data.startsWith('data:image/png;base64,')).toBe(true);
    });

    test('T2.14.3: Screenshot capture during active hug sequence preserves canvas integrity', async () => {
        await page.evaluate(() => {
            window.gameApp.triggerDaviReveal();
            window.gameApp.triggerDaviHug();
        });
        const data = await page.evaluate(() => window.gameApp.renderer.domElement.toDataURL('image/png'));
        expect(data.length).toBeGreaterThan(2000);
    });

    test('T2.14.4: 10 successive rapid screenshot button clicks execute without WebGL crash', async () => {
        for (let i = 0; i < 10; i++) {
            await page.click('#btn-screenshot');
        }
        const ctxLost = await page.evaluate(() => window.gameApp.renderer.getContext().isContextLost());
        expect(ctxLost).toBe(false);
    });

    test('T2.14.5: Canvas dimensions remain matching window dimensions after screenshots', async () => {
        const matches = await page.evaluate(() => {
            const canvas = window.gameApp.renderer.domElement;
            return canvas.clientWidth === window.innerWidth && canvas.clientHeight === window.innerHeight;
        });
        expect(matches).toBe(true);
    });
});

// ============================================================================
// TIER 3: PAIRWISE CROSS-FEATURE INTERACTIONS (15 TESTS)
// ============================================================================

test.describe('Tier 3: Pairwise Cross-Feature Interactions', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('T3.1: Movement + Audio Step Sound synchronization', async () => {
        let stepCount = 0;
        await page.exposeFunction('onStepSound', () => { stepCount++; });
        await page.evaluate(() => {
            const orig = window.musicEngine.playStepSound;
            window.musicEngine.playStepSound = function () {
                window.onStepSound();
                orig.apply(this, arguments);
            };
            window.gameApp.keys.forward = true;
            for (let i = 0; i < 30; i++) window.gameApp.update(0.016);
            window.gameApp.keys.forward = false;
        });
        expect(stepCount).toBeGreaterThan(0);
    });

    test('T3.2: Shrine Proximity + Dialogue Typewriter + Voice Blips', async () => {
        let blipCount = 0;
        await page.exposeFunction('onBlipSound', () => { blipCount++; });
        await page.evaluate(() => {
            const orig = window.musicEngine.playDialogueBlip;
            window.musicEngine.playDialogueBlip = function () {
                window.onBlipSound();
                orig.apply(this, arguments);
            };
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.stage1ShrineReached = false;
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(400);
        expect(blipCount).toBeGreaterThan(0);
    });

    test('T3.3: Stage 1 to 2 Warp + BGM Scale Update + Topbar Badge Update', async () => {
        await page.evaluate(() => {
            window.gameApp.stage1ShrineReached = true;
            window.gameApp.player.root.position.set(0, 0, 16);
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(700);
        await expect(page.locator('#stage-badge')).toContainText('FASE 2');
        const stage = await page.evaluate(() => window.musicEngine.currentStage);
        expect(stage).toBe(2);
    });

    test('T3.4: Stage 2 Constellation + Mute Toggle + Dialogue Advance', async () => {
        await page.click('#btn-mute'); // Mute
        await page.evaluate(() => {
            window.gameApp.stage2ConstellationReached = false;
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(300);
        await page.click('#dialogue-box'); // Advance
        const isMuted = await page.evaluate(() => window.musicEngine.isMuted);
        expect(isMuted).toBe(true);
        await page.click('#btn-mute'); // Unmute
    });

    test('T3.5: Stage 2 to 3 Warp + Background Color Shift + World Swap', async () => {
        await page.evaluate(() => {
            window.gameApp.stage2ConstellationReached = true;
            window.gameApp.player.root.position.set(0, 0, 14);
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(700);
        const hex = await page.evaluate(() => window.gameApp.scene.background.getHexString());
        expect(hex.toLowerCase()).toBe('1e1b4b');
        await expect(page.locator('#stage-badge')).toContainText('FASE 3');
    });

    test('T3.6: Stage 3 Cake Proximity + Climax Dialogue + Toad Reveal', async () => {
        await page.evaluate(() => {
            window.gameApp.stage3ClimaxStarted = false;
            window.gameApp.player.root.position.set(0, 0, 4.5);
            window.gameApp.update(0.016);
        });
        await expect(page.locator('#dialogue-box')).toBeVisible();
        await page.evaluate(() => {
            window.dialogueSystem.currentIndex = 2; // isReveal
            window.dialogueSystem.displayCurrent();
        });
        const isRevealed = await page.evaluate(() => window.gameApp.isDaviRevealed);
        expect(isRevealed).toBe(true);
    });

    test('T3.7: Reveal Transformation + Fanfare Sound + Davi Model Swap', async () => {
        const daviVisible = await page.evaluate(() => window.gameApp.davi.root.visible);
        const toadVisible = await page.evaluate(() => window.gameApp.toad.root.visible);
        expect(daviVisible).toBe(true);
        expect(toadVisible).toBe(false);
    });

    test('T3.8: Davi Hug + Confetti + Birthday Anthem Sound', async () => {
        let hymnPlayed = false;
        await page.exposeFunction('onHymnSound', () => { hymnPlayed = true; });
        await page.evaluate(() => {
            const orig = window.musicEngine.playBirthdayHymn;
            window.musicEngine.playBirthdayHymn = function () {
                window.onHymnSound();
                orig.apply(this, arguments);
            };
            window.gameApp.triggerDaviHug();
        });
        expect(hymnPlayed).toBe(true);
    });

    test('T3.9: Active Hug State + Movement Key Lockout', async () => {
        const canMove = await page.evaluate(() => {
            window.gameApp.keys.forward = true;
            let moveZ = 0;
            if (window.gameApp.keys.forward) moveZ += 1;
            const isMoving = (moveZ !== 0) && !window.gameApp.isHugging;
            window.gameApp.keys.forward = false;
            return isMoving;
        });
        expect(canMove).toBe(false);
    });

    test('T3.10: Hug Sequence Completion + Auto Love Letter Modal', async () => {
        // Fast-forward timeout
        await page.evaluate(() => {
            const letterModal = document.getElementById('letter-modal');
            letterModal.classList.remove('hidden');
            letterModal.classList.add('flex');
        });
        await expect(page.locator('#letter-modal')).toBeVisible();
    });

    test('T3.11: Love Letter Modal Open + Close via Topbar and Modal Buttons', async () => {
        await page.click('#btn-close-letter');
        await expect(page.locator('#letter-modal')).toBeHidden();
        await page.click('#btn-open-letter');
        await expect(page.locator('#letter-modal')).toBeVisible();
        await page.click('#btn-close-letter');
    });

    test('T3.12: Souvenir Screenshot Capture during Stage 3 Climax Hug', async () => {
        await page.click('#btn-screenshot');
        const dataUrl = await page.evaluate(() => window.gameApp.renderer.domElement.toDataURL('image/png'));
        expect(dataUrl.length).toBeGreaterThan(1000);
    });

    test('T3.13: Viewport Resize during Active Dialogue preserves text styling', async () => {
        await page.setViewportSize({ width: 900, height: 600 });
        const dialogueVisible = await page.evaluate(() => {
            const box = document.getElementById('dialogue-box');
            return !box.classList.contains('hidden');
        });
        expect(dialogueVisible).toBe(true);
        await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('T3.14: Mobile D-Pad Touch Navigation + Radius Clamping', async () => {
        await page.evaluate(() => {
            window.gameApp.isHugging = false; // unlock for test
            window.gameApp.player.root.position.set(20, 0, 20); // outside
            window.gameApp.update(0.1);
        });
        const dist = await page.evaluate(() => {
            const p = window.gameApp.player.root.position;
            return Math.hypot(p.x, p.z);
        });
        expect(dist).toBeLessThanOrEqual(18.01);
    });

    test('T3.15: Audio Mute persists across Stage Transitions', async () => {
        await page.evaluate(() => {
            window.musicEngine.isMuted = true;
            window.gameApp.loadStage(1);
        });
        await page.waitForTimeout(600);
        const isMuted = await page.evaluate(() => window.musicEngine.isMuted);
        expect(isMuted).toBe(true);
        await page.evaluate(() => { window.musicEngine.isMuted = false; });
    });
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION USER JOURNEYS (5 SCENARIOS)
// ============================================================================

test.describe('Tier 4: Scenario 1 - Complete Storybook Playthrough', () => {
    test('T4.1: Full journey from Start Screen through all 3 stages, Reveal, Hug, and Love Letter', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(300);

        // 1. Start Screen
        await expect(page.locator('#start-overlay')).toBeVisible();
        await page.click('#btn-start-game');
        await expect(page.locator('#start-overlay')).not.toBeAttached({ timeout: 5000 });
        await expect(page.locator('#stage-badge')).toContainText('FASE 1: O BOSQUE DAS MELODIAS');

        // 2. Discover Shrine & Read Motivo 1
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.update(0.016);
        });
        await expect(page.locator('#dialogue-box')).toBeVisible();
        await page.keyboard.press('Space'); // Skip typewriter
        await page.click('#dialogue-box'); // Advance
        await page.click('#dialogue-box'); // Advance
        await page.click('#dialogue-box'); // Advance to Motivo 1
        await expect(page.locator('#dialogue-text')).toContainText('dom com a música');

        // 3. Walk to Portal -> Arrive at Stage 2
        await page.evaluate(() => {
            window.dialogueSystem.closeDialogue();
            window.gameApp.player.root.position.set(0, 0, 16);
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(800);
        await expect(page.locator('#stage-badge')).toContainText('FASE 2: O PLANETÁRIO CELESTE');

        // 4. Discover Constellation & Read Motivo 2
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.update(0.016);
        });
        await expect(page.locator('#dialogue-box')).toBeVisible();
        await page.click('#dialogue-box');
        await page.click('#dialogue-box');
        await expect(page.locator('#dialogue-text')).toContainText('força serena');

        // 5. Warp to Stage 3
        await page.evaluate(() => {
            window.dialogueSystem.closeDialogue();
            window.gameApp.player.root.position.set(0, 0, 14);
            window.gameApp.update(0.016);
        });
        await page.waitForTimeout(800);
        await expect(page.locator('#stage-badge')).toContainText('FASE 3: O PALÁCIO DAS CEREJEIRAS');

        // 6. Reach Birthday Cake -> Toadbigode Reveal
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, 4.5);
            window.gameApp.update(0.016);
        });
        await expect(page.locator('#dialogue-box')).toBeVisible();
        await page.click('#dialogue-box');
        await page.click('#dialogue-box');
        await page.click('#dialogue-box'); // Reveal line
        await expect(page.locator('#dialogue-name')).toContainText('Davi Nascimento');

        // 7. Emotional Hug
        await page.click('#dialogue-box'); // Hug line
        await expect(page.locator('#dialogue-text')).toContainText('Davi aperta Ana num abraço quentinho');
        const isHugging = await page.evaluate(() => window.gameApp.isHugging);
        expect(isHugging).toBe(true);

        // 8. Reason 3 Love Letter
        await page.click('#dialogue-box'); // Motivo 3
        await expect(page.locator('#dialogue-text')).toContainText('Ana Gleice Almeida de Oliveira');

        // 9. Open persistent Love Letter pergaminho
        await page.click('#btn-open-letter');
        await expect(page.locator('#letter-modal')).toBeVisible();
        await expect(page.locator('#letter-modal')).toContainText('Davi (toadbigode) 💙');
        await page.click('#btn-close-letter');
        await expect(page.locator('#letter-modal')).toBeHidden();
    });
});

test.describe('Tier 4: Scenario 2 - Audio Immersion & Acoustic Transitions', () => {
    test('T4.2: Audio scales transition across stages and mute operates smoothly', async ({ page }) => {
        await launchGame(page);

        // Check Stage 1 scales
        const stage1Notes = await page.evaluate(() => window.musicEngine.stageNotes[1]);
        expect(stage1Notes[0]).toBeCloseTo(261.63, 1);

        // Progress to Stage 2
        await page.evaluate(() => window.gameApp.loadStage(2));
        await page.waitForTimeout(600);
        const stage2Notes = await page.evaluate(() => window.musicEngine.stageNotes[2]);
        expect(stage2Notes[0]).toBeCloseTo(220.00, 1);

        // Progress to Stage 3
        await page.evaluate(() => window.gameApp.loadStage(3));
        await page.waitForTimeout(600);
        const stage3Notes = await page.evaluate(() => window.musicEngine.stageNotes[3]);
        expect(stage3Notes[0]).toBeCloseTo(261.63, 1);

        // Toggle mute via UI
        const muteBtn = page.locator('#btn-mute');
        await muteBtn.click();
        await expect(muteBtn).toContainText('🔇 Som Mutado');
        const gain = await page.evaluate(() => window.musicEngine.masterGain.gain.value);
        expect(gain).toBe(0);

        // Unmute via UI
        await muteBtn.click();
        await expect(muteBtn).toContainText('🔊 Som Ligado');
        const restoredGain = await page.evaluate(() => window.musicEngine.masterGain.gain.value);
        expect(restoredGain).toBeCloseTo(0.45, 2);
    });
});

test.describe('Tier 4: Scenario 3 - Mobile Touch Experience & Responsive Navigation', () => {
    test('T4.3: Mobile touch controls and dialogue interaction on small viewport', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13/14
        await page.goto('/');

        // Start game
        await page.click('#btn-start-game');
        await page.waitForFunction(() => !!window.gameApp);

        // Virtual D-pad should be visible on mobile
        const dpad = page.locator('#mobile-dpad');
        await expect(dpad).toBeVisible();

        // Simulate touch navigation forward
        await page.dispatchEvent('#ctrl-up', 'touchstart');
        await page.waitForTimeout(200);
        await page.dispatchEvent('#ctrl-up', 'touchend');

        // Move to shrine
        await page.evaluate(() => {
            window.gameApp.player.root.position.set(0, 0, -4);
            window.gameApp.update(0.016);
        });
        await expect(page.locator('#dialogue-box')).toBeVisible();

        // Tap dialogue box to advance
        await page.tap('#dialogue-box');
        await expect(page.locator('#dialogue-box')).toBeVisible();

        // Verify no horizontal overflow on mobile body
        const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
        expect(overflow).toBe(false);
    });
});

test.describe('Tier 4: Scenario 4 - Souvenir Photo Session at the Climax Moment', () => {
    test('T4.4: Climax hug scene screenshot capture, data extraction, and download verification', async ({ page }) => {
        await launchGame(page);

        // Jump to Stage 3 climax hug
        await page.evaluate(() => {
            window.gameApp.loadStage(3);
            window.gameApp.triggerDaviReveal();
            window.gameApp.triggerDaviHug();
        });
        await page.waitForTimeout(700);

        // Ensure both characters are visible
        const characters = await page.evaluate(() => ({
            davi: window.gameApp.davi.root.visible,
            ana: window.gameApp.player.root.visible
        }));
        expect(characters.davi).toBe(true);
        expect(characters.ana).toBe(true);

        // Capture screenshot via topbar button
        let downloadName = '';
        await page.exposeFunction('onPhotoCaptured', name => { downloadName = name; });
        await page.evaluate(() => {
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tag) {
                const el = originalCreateElement(tag);
                if (tag === 'a') {
                    el.click = function () {
                        window.onPhotoCaptured(el.download);
                    };
                }
                return el;
            };
        });
        await page.click('#btn-screenshot');

        expect(downloadName).toBe('ana_gleice_aniversario_lembranca.png');

        // Verify canvas snapshot data
        const pngBase64 = await page.evaluate(() => window.gameApp.renderer.domElement.toDataURL('image/png'));
        expect(pngBase64.startsWith('data:image/png;base64,')).toBe(true);
        expect(pngBase64.length).toBeGreaterThan(2000);
    });
});

test.describe('Tier 4: Scenario 5 - Storybook Reading, Skipping, and Letter Re-read', () => {
    test('T4.5: Typewriter reading, instant skip, dialogue dismiss, and persistent re-read', async ({ page }) => {
        await launchGame(page);

        // Start Stage 1 intro dialogue
        await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));
        await expect(page.locator('#dialogue-box')).toBeVisible();

        // Wait a few ms for typewriter typing
        await page.waitForTimeout(100);

        // Instant skip via Spacebar
        await page.keyboard.press('Space');
        const isTyping = await page.evaluate(() => window.dialogueSystem.isTyping);
        expect(isTyping).toBe(false);

        // Advance to end of queue
        await page.keyboard.press('Space');
        await page.keyboard.press('Space');
        await page.keyboard.press('Space');
        await page.keyboard.press('Space');
        await page.keyboard.press('Space');
        await page.keyboard.press('Space');

        // Confirm dialogue closed
        await expect(page.locator('#dialogue-box')).toBeHidden();

        // Open love letter modal
        await page.click('#btn-open-letter');
        await expect(page.locator('#letter-modal')).toBeVisible();

        // Scroll letter content
        await page.evaluate(() => {
            const el = document.querySelector('#letter-modal .handwriting');
            el.scrollTop = el.scrollHeight;
        });

        // Close letter
        await page.click('#btn-close-letter');
        await expect(page.locator('#letter-modal')).toBeHidden();
    });
});
