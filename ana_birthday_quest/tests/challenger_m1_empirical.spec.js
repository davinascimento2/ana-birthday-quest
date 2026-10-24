const { test, expect } = require('@playwright/test');

/**
 * Challenger M1 Instance 1 — Empirical Verification & Stress Test Suite
 * 
 * Mandates:
 * 1. 60 FPS performance and requestAnimationFrame loop stability under stress
 * 2. Camera tracking under rapid direction changes, boost speed, deadzone, and boundary clamping
 * 3. Boundary collisions: outer perimeter penetration resistance in Stages 1-3, Altar da Harpa collision barrier, and wall sliding
 * 4. Stage warps and Zelda transitions: isLevelTransitioning accuracy, iris wipe states, rapid concurrent warps
 * 5. Zero 3D / WebGL contexts or Three.js objects audit
 */

test.describe('Challenger M1 Empirical Stress & Challenge Suite', () => {

    async function launchGame(page) {
        await page.goto('/');
        const startBtn = page.locator('#btn-start-game');
        await expect(startBtn).toBeVisible({ timeout: 10000 });
        await startBtn.click();
        await page.waitForFunction(
            () => !!window.gameApp && !!window.__GAME_STATE__ && window.__GAME_STATE__.isReady,
            { timeout: 10000 }
        );
    }

    // =========================================================================
    // 1. 60 FPS PERFORMANCE & FIXED-TIMESTEP RAF LOOP
    // =========================================================================
    test.describe('1. 60 FPS Performance & Loop Stability', () => {
        test('Measures frame rates under continuous movement and particle rendering', async ({ page }) => {
            await launchGame(page);

            const perfData = await page.evaluate(async () => {
                // Hold right arrow + shift for sprint
                window.gameApp.engine.keys.right = true;
                window.gameApp.engine.keys.shift = true;

                const frameTimes = [];
                let last = performance.now();

                return new Promise((resolve) => {
                    let count = 0;
                    function step(now) {
                        const delta = now - last;
                        last = now;
                        frameTimes.push(delta);
                        count++;
                        if (count < 120) {
                            requestAnimationFrame(step);
                        } else {
                            window.gameApp.engine.keys.right = false;
                            window.gameApp.engine.keys.shift = false;
                            resolve(frameTimes.slice(5)); // Discard first 5 warmup frames
                        }
                    }
                    requestAnimationFrame(step);
                });
            });

            // Calculate stats
            const avgDelta = perfData.reduce((a, b) => a + b, 0) / perfData.length;
            const avgFPS = 1000 / avgDelta;
            const maxDelta = Math.max(...perfData);
            const minDelta = Math.min(...perfData);

            console.log(`[PERF EMPIRICAL] Avg Delta: ${avgDelta.toFixed(2)}ms (~${avgFPS.toFixed(1)} FPS), Min: ${minDelta.toFixed(2)}ms, Max: ${maxDelta.toFixed(2)}ms`);

            // Headless Chromium under SwiftShader angle rendering in CI/Windows:
            // Frame delta should be centered around ~16.6ms. Average FPS should be >= 45 FPS and max delta < 150ms.
            expect(avgFPS).toBeGreaterThan(45);
            expect(maxDelta).toBeLessThan(150);
        });

        test('requestAnimationFrame fixed-timestep accumulator stability over sustained execution', async ({ page }) => {
            await launchGame(page);

            const accumulatorStats = await page.evaluate(async () => {
                const engine = window.gameApp.engine;
                const samples = [];
                for (let i = 0; i < 30; i++) {
                    samples.push({
                        accumulator: engine.accumulator,
                        fixedStep: engine.fixedStep,
                        running: engine.running
                    });
                    await new Promise(r => setTimeout(r, 16));
                }
                return samples;
            });

            expect(accumulatorStats.every(s => s.running === true)).toBe(true);
            expect(accumulatorStats.every(s => s.fixedStep === 1 / 60)).toBe(true);
            // Accumulator must remain bounded (< 0.1) and never blow up or spiral
            expect(accumulatorStats.every(s => s.accumulator >= 0 && s.accumulator < 0.1)).toBe(true);
        });
    });

    // =========================================================================
    // 2. CAMERA TRACKING UNDER RAPID MOVEMENT & BOUNDARIES
    // =========================================================================
    test.describe('2. Camera Tracking & Clamping Stress', () => {
        test('Stress-test camera follow under rapid 180-degree direction snapping at boost speed', async ({ page }) => {
            await launchGame(page);

            const cameraTracking = await page.evaluate(async () => {
                const engine = window.gameApp.engine;
                const cam = engine.camera;
                const trajectory = [];

                // Rapidly alternate directions
                const sequence = [
                    { right: true, shift: true, duration: 150 },
                    { left: true, shift: true, duration: 150 },
                    { down: true, shift: true, duration: 150 },
                    { up: true, shift: true, duration: 150 },
                    { right: true, down: true, duration: 200 },
                    { left: true, up: true, duration: 200 }
                ];

                for (const move of sequence) {
                    engine.keys.right = !!move.right;
                    engine.keys.left = !!move.left;
                    engine.keys.up = !!move.up;
                    engine.keys.down = !!move.down;
                    engine.keys.shift = !!move.shift;

                    const startTime = performance.now();
                    while (performance.now() - startTime < move.duration) {
                        trajectory.push({
                            px: engine.player.x,
                            py: engine.player.y,
                            cx: cam.x,
                            cy: cam.y,
                            vw: cam.viewportW,
                            vh: cam.viewportH,
                            minX: cam.bounds.minX,
                            maxX: cam.bounds.maxX,
                            minY: cam.bounds.minY,
                            maxY: cam.bounds.maxY
                        });
                        await new Promise(r => setTimeout(r, 16));
                    }
                }

                // Reset keys
                engine.keys.right = false;
                engine.keys.left = false;
                engine.keys.up = false;
                engine.keys.down = false;
                engine.keys.shift = false;

                return trajectory;
            });

            expect(cameraTracking.length).toBeGreaterThan(30);

            // Invariant: Camera must NEVER exceed stage bounds at any moment
            for (const sample of cameraTracking) {
                const maxAllowedX = Math.max(sample.minX, sample.maxX - sample.vw);
                const maxAllowedY = Math.max(sample.minY, sample.maxY - sample.vh);
                expect(sample.cx).toBeGreaterThanOrEqual(sample.minX - 0.5);
                expect(sample.cx).toBeLessThanOrEqual(maxAllowedX + 0.5);
                expect(sample.cy).toBeGreaterThanOrEqual(sample.minY - 0.5);
                expect(sample.cy).toBeLessThanOrEqual(maxAllowedY + 0.5);

                // Check that camera centers reasonably around player (within viewport dimensions)
                const camCenterX = sample.cx + sample.vw / 2;
                const camCenterY = sample.cy + sample.vh / 2;
                const distToCenter = Math.hypot(sample.px - camCenterX, sample.py - camCenterY);
                // Even at rapid speeds, player should never escape the viewport bounds
                expect(distToCenter).toBeLessThan(Math.hypot(sample.vw, sample.vh) / 2);
            }
        });

        test('Camera deadzone verification: micro movements within deadzone do not twitch camera', async ({ page }) => {
            await launchGame(page);

            const deadzoneCheck = await page.evaluate(async () => {
                const engine = window.gameApp.engine;
                const cam = engine.camera;

                // Move player to center of map where clamping is not active
                engine.player.x = 900;
                engine.player.y = 540;
                cam.follow(900, 540, 1.0, true); // Snap camera to center
                const initialCamX = cam.x;
                const initialCamY = cam.y;

                // Nudge player slightly within deadzone (< 32px X, < 24px Y)
                engine.player.x = 910; // +10px (deadzone is 32)
                engine.player.y = 545; // +5px (deadzone is 24)
                cam.follow(engine.player.x, engine.player.y, 0.016);

                const nudgedCamX = cam.x;
                const nudgedCamY = cam.y;

                return {
                    initialCamX,
                    initialCamY,
                    nudgedCamX,
                    nudgedCamY,
                    diffX: Math.abs(nudgedCamX - initialCamX),
                    diffY: Math.abs(nudgedCamY - initialCamY)
                };
            });

            // Camera should not have moved because displacement was within deadzone
            expect(deadzoneCheck.diffX).toBeLessThan(0.01);
            expect(deadzoneCheck.diffY).toBeLessThan(0.01);
        });
    });

    // =========================================================================
    // 3. BOUNDARY COLLISIONS & PENETRATION RESISTANCE
    // =========================================================================
    test.describe('3. Boundary Collisions & Penetration Resistance', () => {
        test('Penetration test: Player cannot penetrate outer walls in Stage 1, 2, or 3 under continuous force', async ({ page }) => {
            await launchGame(page);

            const stages = [1, 2, 3];
            for (const stageId of stages) {
                const testResult = await page.evaluate(async (sId) => {
                    window.gameApp.warpToStage(sId);
                    await new Promise(r => setTimeout(r, 600));

                    const engine = window.gameApp.engine;
                    const stageW = engine.currentStage.width;
                    const stageH = engine.currentStage.height;
                    const results = {};

                    // Test Left Wall: Drive left continuously for 300ms
                    engine.player.x = 60;
                    engine.player.y = stageH / 2;
                    engine.keys.left = true;
                    engine.keys.shift = true;
                    let t0 = performance.now();
                    while (performance.now() - t0 < 300) {
                        await new Promise(r => setTimeout(r, 16));
                    }
                    engine.keys.left = false;
                    results.leftX = engine.player.x;

                    // Test Right Wall: Drive right continuously for 300ms
                    engine.player.x = stageW - 60;
                    engine.player.y = stageH / 2;
                    engine.keys.right = true;
                    t0 = performance.now();
                    while (performance.now() - t0 < 300) {
                        await new Promise(r => setTimeout(r, 16));
                    }
                    engine.keys.right = false;
                    results.rightX = engine.player.x;

                    // Test Top Wall: Drive up continuously for 300ms
                    engine.player.x = stageW / 2;
                    engine.player.y = 60;
                    engine.keys.up = true;
                    t0 = performance.now();
                    while (performance.now() - t0 < 300) {
                        await new Promise(r => setTimeout(r, 16));
                    }
                    engine.keys.up = false;
                    results.topY = engine.player.y;

                    // Test Bottom Wall: Drive down continuously for 300ms
                    engine.player.x = stageW / 2;
                    engine.player.y = stageH - 60;
                    engine.keys.down = true;
                    t0 = performance.now();
                    while (performance.now() - t0 < 300) {
                        await new Promise(r => setTimeout(r, 16));
                    }
                    engine.keys.down = false;
                    results.bottomY = engine.player.y;

                    engine.keys.shift = false;
                    results.stageW = stageW;
                    results.stageH = stageH;
                    return results;
                }, stageId);

                console.log(`[COLLISION STAGE ${stageId}] Boundary results:`, testResult);
                // Radius is 16, perimeter wall collider thickness is 40. Player center should stay >= 30 and <= width - 30
                expect(testResult.leftX).toBeGreaterThanOrEqual(30);
                expect(testResult.rightX).toBeLessThanOrEqual(testResult.stageW - 30);
                expect(testResult.topY).toBeGreaterThanOrEqual(30);
                expect(testResult.bottomY).toBeLessThanOrEqual(testResult.stageH - 30);
            }
        });

        test('Altar da Harpa Ancestral collision barrier in Stage 1 cannot be penetrated', async ({ page }) => {
            await launchGame(page);

            const altarCollision = await page.evaluate(async () => {
                window.gameApp.warpToStage(1);
                await new Promise(r => setTimeout(r, 400));

                const engine = window.gameApp.engine;
                const altarX = 960;
                const altarY = 380;

                // Drive directly toward altar from 4 directions
                const approaches = [
                    { startX: altarX - 100, startY: altarY, key: 'right' },
                    { startX: altarX + 100, startY: altarY, key: 'left' },
                    { startX: altarX, startY: altarY - 100, key: 'down' },
                    { startX: altarX, startY: altarY + 100, key: 'up' }
                ];

                const distances = [];

                for (const app of approaches) {
                    engine.player.x = app.startX;
                    engine.player.y = app.startY;
                    engine.keys[app.key] = true;
                    engine.keys.shift = true;

                    const t0 = performance.now();
                    while (performance.now() - t0 < 350) {
                        await new Promise(r => setTimeout(r, 16));
                    }
                    engine.keys[app.key] = false;

                    const dist = Math.hypot(engine.player.x - altarX, engine.player.y - altarY);
                    distances.push({ direction: app.key, dist, px: engine.player.x, py: engine.player.y });
                }

                engine.keys.shift = false;
                return distances;
            });

            console.log('[ALTAR COLLISION DISTANCES]:', altarCollision);
            // Altar radius is 55, player radius is 16. Total min distance is 71.
            // Under any direction approach, dist must remain >= 65px (zero penetration)
            for (const d of altarCollision) {
                expect(d.dist).toBeGreaterThanOrEqual(65);
            }
        });

        test('Frictionless wall sliding: diagonal movement against a solid wall allows smooth tangential sliding', async ({ page }) => {
            await launchGame(page);

            const slidingResult = await page.evaluate(async () => {
                window.gameApp.warpToStage(1);
                await new Promise(r => setTimeout(r, 400));

                const engine = window.gameApp.engine;
                // Place player near top wall (y=56)
                engine.player.x = 500;
                engine.player.y = 56;

                // Press both UP and RIGHT simultaneously:
                // Y movement will be blocked by top boundary, but X movement should slide to the right smoothly!
                engine.keys.up = true;
                engine.keys.right = true;

                const startX = engine.player.x;
                const startY = engine.player.y;

                const t0 = performance.now();
                while (performance.now() - t0 < 300) {
                    await new Promise(r => setTimeout(r, 16));
                }

                engine.keys.up = false;
                engine.keys.right = false;

                return {
                    startX,
                    endX: engine.player.x,
                    startY,
                    endY: engine.player.y,
                    deltaX: engine.player.x - startX,
                    deltaY: engine.player.y - startY
                };
            });

            console.log('[WALL SLIDING RESULT]:', slidingResult);
            // Should have made significant progress along X (> 30px)
            expect(slidingResult.deltaX).toBeGreaterThan(30);
            // While Y stayed clamped at the boundary
            expect(Math.abs(slidingResult.deltaY)).toBeLessThan(5);
        });
    });

    // =========================================================================
    // 4. STAGE WARPS & ZELDA TRANSITIONS
    // =========================================================================
    test.describe('4. Stage Warps & Zelda Transitions', () => {
        test('Zelda circular iris wipe transitions accurately toggle isLevelTransitioning and update state', async ({ page }) => {
            await launchGame(page);

            const warpData = await page.evaluate(async () => {
                const snapshots = [];
                snapshots.push({
                    phase: 'initial',
                    level: window.__GAME_STATE__.currentLevel,
                    isTransitioning: window.__GAME_STATE__.isLevelTransitioning,
                    irisActive: window.gameApp.engine.iris.active
                });

                // Trigger transition
                window.gameApp.warpToStage(2);

                // Sample during transition (150ms in)
                await new Promise(r => setTimeout(r, 150));
                snapshots.push({
                    phase: 'during_transition',
                    level: window.__GAME_STATE__.currentLevel,
                    isTransitioning: window.__GAME_STATE__.isLevelTransitioning,
                    irisActive: window.gameApp.engine.iris.active,
                    irisMode: window.gameApp.engine.iris.mode,
                    irisRadius: window.gameApp.engine.iris.radiusRatio
                });

                // Wait for complete transition (~900ms)
                await new Promise(r => setTimeout(r, 850));
                snapshots.push({
                    phase: 'after_transition',
                    level: window.__GAME_STATE__.currentLevel,
                    isTransitioning: window.__GAME_STATE__.isLevelTransitioning,
                    irisActive: window.gameApp.engine.iris.active
                });

                return snapshots;
            });

            console.log('[ZELDA TRANSITION SNAPSHOTS]:', warpData);
            expect(warpData[0].phase).toBe('initial');
            expect(warpData[0].level).toBe(1);
            expect(warpData[0].isTransitioning).toBe(false);

            // During transition, isLevelTransitioning and irisActive should be true
            expect(warpData[1].phase).toBe('during_transition');
            expect(warpData[1].isTransitioning).toBe(true);
            expect(warpData[1].irisActive).toBe(true);

            // After transition, level is 2 and transitioning is false
            expect(warpData[2].phase).toBe('after_transition');
            expect(warpData[2].level).toBe(2);
            expect(warpData[2].isTransitioning).toBe(false);
            expect(warpData[2].irisActive).toBe(false);
        });

        test('Rapid concurrent warp invocations do not corrupt state or crash engine', async ({ page }) => {
            await launchGame(page);

            const stressWarp = await page.evaluate(async () => {
                const errors = [];
                try {
                    // Call warp multiple times rapidly in succession
                    window.gameApp.warpToStage(2);
                    window.gameApp.warpToStage(3);
                    window.gameApp.warpToStage(1);
                    window.gameApp.warpToStage(3);
                } catch (e) {
                    errors.push(e.message);
                }

                // Wait for any transition to settle
                await new Promise(r => setTimeout(r, 1200));

                return {
                    errors,
                    finalLevel: window.__GAME_STATE__.currentLevel,
                    isTransitioning: window.__GAME_STATE__.isLevelTransitioning,
                    irisActive: window.gameApp.engine.iris.active,
                    engineRunning: window.gameApp.engine.running
                };
            });

            console.log('[STRESS RAPID WARP]:', stressWarp);
            expect(stressWarp.errors).toHaveLength(0);
            expect(stressWarp.isTransitioning).toBe(false);
            expect(stressWarp.irisActive).toBe(false);
            expect(stressWarp.engineRunning).toBe(true);
        });
    });

    // =========================================================================
    // 5. ZERO 3D / WEBGL CONTEXTS OR THREE.JS OBJECTS AUDIT
    // =========================================================================
    test.describe('5. Zero 3D / WebGL Contexts & Three.js Removal Audit', () => {
        test('Verify DOM has zero 3D / WebGL contexts and canvas context is strictly 2D', async ({ page }) => {
            await launchGame(page);

            const contextAudit = await page.evaluate(() => {
                const canvas = document.getElementById('game-canvas');
                if (!canvas) return { error: 'canvas not found' };

                // Test if canvas is bound to 2d
                const ctx2d = canvas.getContext('2d');
                // Attempt to get webgl context on the same canvas (should fail or return null since it is 2D)
                let webglCtx = null;
                try {
                    webglCtx = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
                } catch (e) {
                    webglCtx = null;
                }

                // Check all canvas elements in document
                const allCanvases = Array.from(document.querySelectorAll('canvas'));
                const canvasDetails = allCanvases.map(c => ({
                    id: c.id,
                    className: c.className,
                    width: c.width,
                    height: c.height
                }));

                return {
                    has2d: !!ctx2d,
                    hasWebgl: !!webglCtx,
                    canvasCount: allCanvases.length,
                    canvasDetails
                };
            });

            console.log('[CONTEXT AUDIT]:', contextAudit);
            expect(contextAudit.has2d).toBe(true);
            expect(contextAudit.hasWebgl).toBe(false);
            expect(contextAudit.canvasCount).toBe(1);
        });

        test('Verify vendor 3D scripts (three.min.js, GLTFLoader.js) are completely removed from DOM scripts', async ({ page }) => {
            await launchGame(page);

            const scriptsAudit = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script'));
                const scriptSources = scripts.map(s => s.src || s.getAttribute('src') || '[inline]');
                const threeScript = scriptSources.find(src => src.includes('three.min.js') || src.includes('three.js'));
                const gltfScript = scriptSources.find(src => src.includes('GLTFLoader.js') || src.includes('OBJLoader.js'));

                return {
                    scriptSources,
                    hasThreeScript: !!threeScript,
                    hasGltfScript: !!gltfScript
                };
            });

            console.log('[SCRIPTS AUDIT]:', scriptsAudit);
            expect(scriptsAudit.hasThreeScript).toBe(false);
            expect(scriptsAudit.hasGltfScript).toBe(false);
        });

        test('Verify window.THREE is only a lightweight shim without WebGLRenderer, Mesh, or BufferGeometry', async ({ page }) => {
            await launchGame(page);

            const threeAudit = await page.evaluate(() => {
                const t = window.THREE;
                if (!t) return { isPresent: false };

                return {
                    isPresent: true,
                    hasRealWebGLRenderer: typeof t.WebGLRenderer === 'function' && t.WebGLRenderer.prototype && typeof t.WebGLRenderer.prototype.render === 'function',
                    hasMesh: typeof t.Mesh !== 'undefined',
                    hasBufferGeometry: typeof t.BufferGeometry !== 'undefined',
                    hasPerspectiveCamera: typeof t.PerspectiveCamera !== 'undefined'
                };
            });

            console.log('[THREE SHIM AUDIT]:', threeAudit);
            expect(threeAudit.hasRealWebGLRenderer).toBe(false);
            expect(threeAudit.hasMesh).toBe(false);
            expect(threeAudit.hasBufferGeometry).toBe(false);
            expect(threeAudit.hasPerspectiveCamera).toBe(false);
        });
    });
});
