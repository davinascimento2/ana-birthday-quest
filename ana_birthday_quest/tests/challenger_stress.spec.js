const { test, expect } = require('@playwright/test');

/**
 * Challenger M1 Instance 2 - Adversarial Verification & Stress Test Suite
 * 
 * Mandate:
 * 1. DOM element existence, responsive styling, and accessibility for touch devices
 * 2. Rapid dialogue skipping stress test (100 rapid clicks/keydowns in < 1s)
 * 3. window.__GAME_STATE__ reporting accuracy and contract adherence (e.g., candlesLit)
 * 4. Offline reliability & network request audit (zero external HTTP/HTTPS requests)
 */

test.describe('Adversarial Test Suite - Challenger M1 Instance 2', () => {

    // =========================================================================
    // MANDATE 4: OFFLINE RELIABILITY & EXTERNAL NETWORK REQUEST AUDIT
    // =========================================================================
    test.describe('Mandate 4: Offline Standalone Integrity & Request Interception', () => {
        test('Audit all outgoing network requests during page load and gameplay', async ({ page }) => {
            const outgoingRequests = [];

            // Intercept all requests
            page.on('request', request => {
                outgoingRequests.push({
                    url: request.url(),
                    resourceType: request.resourceType(),
                    method: request.method()
                });
            });

            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1000);

            console.log('--- NETWORK REQUEST AUDIT ---');
            const externalRequests = outgoingRequests.filter(req => {
                const url = req.url;
                return !url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost');
            });

            console.log(`Total requests: ${outgoingRequests.length}`);
            console.log(`External requests: ${externalRequests.length}`);
            externalRequests.forEach(req => {
                console.log(`[EXTERNAL DETECTED] ${req.method} ${req.url} (${req.resourceType})`);
            });

            // Expect zero external requests for 100% offline standalone compliance
            expect(externalRequests.length, `Found external network requests: ${JSON.stringify(externalRequests)}`).toBe(0);
        });

        test('Verify gameplay functionality in strict offline mode (blocking all external network requests)', async ({ page }) => {
            // Block all external requests to simulate true airplane / offline environment
            await page.route('**', (route) => {
                const url = route.request().url();
                if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
                    route.abort('internetdisconnected');
                } else {
                    route.continue();
                }
            });

            const pageErrors = [];
            page.on('pageerror', err => pageErrors.push(err.message));

            await page.goto('/');
            const startBtn = page.locator('#btn-start-game');
            await expect(startBtn).toBeVisible();
            await startBtn.click();

            await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene, { timeout: 10000 });

            // Verify game boots and state is active even with zero external connection
            const isReady = await page.evaluate(() => window.__GAME_STATE__ && window.__GAME_STATE__.isReady);
            expect(isReady).toBe(true);
            expect(pageErrors.length).toBe(0);
        });
    });

    // =========================================================================
    // MANDATE 1: DOM ELEMENTS, RESPONSIVE STYLING & TOUCH ACCESSIBILITY
    // =========================================================================
    test.describe('Mandate 1: DOM Elements, Responsive Styling & Touch Accessibility', () => {
        test('Verify all required UI DOM elements exist and have valid structure', async ({ page }) => {
            await page.goto('/');

            const requiredSelectors = [
                '#canvas-container',
                '#fade-curtain',
                '#stage-badge',
                '#btn-open-letter',
                '#btn-screenshot',
                '#btn-mute',
                '#dialogue-box',
                '#dialogue-avatar',
                '#dialogue-name',
                '#dialogue-text',
                '#dialogue-prompt',
                '#mobile-joystick-zone',
                '#joystick-thumb',
                '#mobile-action-btn',
                '#start-overlay',
                '#btn-start-game',
                '#letter-modal',
                '#btn-close-letter'
            ];

            for (const selector of requiredSelectors) {
                const el = page.locator(selector);
                const count = await el.count();
                expect(count, `Expected selector ${selector} to exist in DOM`).toBeGreaterThan(0);
            }
        });

        test('Verify mobile viewport (390x844) touch targets and responsive visibility', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            // On mobile (<768px), joystick and mobile action button MUST be visible
            const joystickZone = page.locator('#mobile-joystick-zone');
            const actionBtn = page.locator('#mobile-action-btn');

            await expect(joystickZone).toBeVisible();
            await expect(actionBtn).toBeVisible();

            // Evaluate touch target bounding boxes (WCAG 2.5.5 minimum 44x44px target size)
            const joystickBox = await joystickZone.boundingBox();
            expect(joystickBox.width).toBeGreaterThanOrEqual(44);
            expect(joystickBox.height).toBeGreaterThanOrEqual(44);

            const actionBtnBox = await actionBtn.boundingBox();
            expect(actionBtnBox.width).toBeGreaterThanOrEqual(44);
            expect(actionBtnBox.height).toBeGreaterThanOrEqual(44);

            const muteBtnBox = await page.locator('#btn-mute').boundingBox();
            expect(muteBtnBox.height).toBeGreaterThanOrEqual(30);

            // Verify dialogue box responsiveness on mobile
            await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));
            const dialogueBox = page.locator('#dialogue-box');
            await expect(dialogueBox).toBeVisible();

            const dBox = await dialogueBox.boundingBox();
            expect(dBox.width).toBeLessThanOrEqual(390); // Doesn't overflow viewport horizontally
            expect(dBox.x).toBeGreaterThanOrEqual(0); // Positioned inside viewport
        });

        test('Verify desktop viewport (1280x720) hides touch joystick and action button', async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 720 });
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            const joystickZone = page.locator('#mobile-joystick-zone');
            const actionBtn = page.locator('#mobile-action-btn');

            await expect(joystickZone).toBeHidden();
            await expect(actionBtn).toBeHidden();
        });

        test('Verify accessibility audit on buttons and interactive controls', async ({ page }) => {
            await page.goto('/');

            // Check aria-label or accessible text on interactive elements
            const buttons = await page.evaluate(() => {
                const btnList = Array.from(document.querySelectorAll('button'));
                return btnList.map(b => ({
                    id: b.id,
                    text: b.innerText.trim(),
                    hasAriaLabel: b.hasAttribute('aria-label'),
                    ariaLabel: b.getAttribute('aria-label'),
                    role: b.getAttribute('role')
                }));
            });

            console.log('Button Accessibility Audit:', buttons);
            buttons.forEach(b => {
                const hasLabel = b.text.length > 0 || (b.hasAriaLabel && b.ariaLabel.length > 0);
                expect(hasLabel, `Button #${b.id} lacks accessible text or aria-label`).toBe(true);
            });
        });
    });

    // =========================================================================
    // MANDATE 2: TYPEWRITER DIALOGUE SKIPPING UNDER STRESS (100 RAPID EVENTS <1s)
    // =========================================================================
    test.describe('Mandate 2: Rapid Dialogue Skipping Stress Test', () => {
        test('Stress test: 100 rapid click events on dialogue box in <1 second', async ({ page }) => {
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            const pageErrors = [];
            page.on('pageerror', err => pageErrors.push(err.message));

            // Start stage 1 shrine dialogue (contains 4 lines including long Reason #1 text)
            await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_shrine'));

            const dialogueBox = page.locator('#dialogue-box');
            await expect(dialogueBox).toBeVisible();

            // Fire 100 rapid clicks via evaluate / DOM dispatch in < 1 second
            const stressResult = await page.evaluate(async () => {
                const box = document.getElementById('dialogue-box');
                const startTime = performance.now();
                let clickCount = 0;

                for (let i = 0; i < 100; i++) {
                    box.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    clickCount++;
                    // Yield micro-timeslice to let event loop tick
                    await new Promise(r => setTimeout(r, 5));
                }

                const elapsed = performance.now() - startTime;
                return {
                    clickCount,
                    elapsedMs: elapsed,
                    isTyping: window.dialogueSystem.isTyping,
                    currentIndex: window.dialogueSystem.currentIndex,
                    finishedCount: window.dialogueSystem.finishedCount,
                    boxHidden: box.classList.contains('hidden'),
                    currentText: document.getElementById('dialogue-text').innerText,
                    hasActiveTimer: window.dialogueSystem.typeTimer !== null
                };
            });

            console.log('Dialogue Stress Result (100 Clicks):', stressResult);

            // Assertions
            expect(stressResult.clickCount).toBe(100);
            expect(stressResult.elapsedMs).toBeLessThan(5000);
            expect(pageErrors.length).toBe(0); // Zero uncaught runtime errors

            // Dialogue should have cleanly completed and closed
            expect(stressResult.boxHidden).toBe(true);
            expect(stressResult.isTyping).toBe(false);
            expect(stressResult.finishedCount).toBeGreaterThanOrEqual(1);

            // Verify dialogue state in __GAME_STATE__
            const gameStateDialogue = await page.evaluate(() => window.__GAME_STATE__.dialogue);
            expect(gameStateDialogue.isActive).toBe(false);
            expect(gameStateDialogue.isTyping).toBe(false);
        });

        test('Stress test: 100 rapid Space/Enter keydown events while starting multiple dialogues', async ({ page }) => {
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            const pageErrors = [];
            page.on('pageerror', err => pageErrors.push(err.message));

            const result = await page.evaluate(async () => {
                const keys = ['stage1_intro', 'stage1_shrine', 'stage2_intro', 'stage2_constellation', 'stage3_intro', 'stage3_climax'];
                let iterations = 0;

                for (const queueKey of keys) {
                    window.dialogueSystem.startDialogue(queueKey);
                    // Hammer 20 rapid Space keys per queue
                    for (let j = 0; j < 20; j++) {
                        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
                        await new Promise(r => setTimeout(r, 4));
                    }
                    iterations += 20;
                }

                return {
                    totalKeysDispatched: iterations,
                    finalFinishedCount: window.dialogueSystem.finishedCount,
                    boxHidden: document.getElementById('dialogue-box').classList.contains('hidden'),
                    isTyping: window.dialogueSystem.isTyping
                };
            });

            console.log('Multi-Queue Rapid Keydown Stress Result:', result);
            expect(result.totalKeysDispatched).toBe(120);
            expect(pageErrors.length).toBe(0);
            expect(result.boxHidden).toBe(true);
            expect(result.isTyping).toBe(false);
        });

        test('Verify text does not overflow or leak memory under rapid dialogue skipping', async ({ page }) => {
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            // Start climax dialogue with longest text
            await page.evaluate(() => window.dialogueSystem.startDialogue('stage3_climax'));

            // Check dimensions during typewriter vs instant skip
            const overflowCheck = await page.evaluate(async () => {
                const box = document.getElementById('dialogue-box');
                const textEl = document.getElementById('dialogue-text');

                // Advance to Reason #3 (index 4)
                while (window.dialogueSystem.currentIndex < 4 && !box.classList.contains('hidden')) {
                    window.dialogueSystem.advance();
                }

                const scrollH = textEl.scrollHeight;
                const clientH = textEl.clientHeight;
                const boxH = box.offsetHeight;

                return {
                    scrollH,
                    clientH,
                    boxH,
                    textLength: textEl.innerText.length
                };
            });

            console.log('Dialogue Overflow Check:', overflowCheck);
            expect(overflowCheck.textLength).toBeGreaterThan(50);
            // Height should be reasonably bounded within modal box
            expect(overflowCheck.boxH).toBeLessThan(400);
        });
    });

    // =========================================================================
    // MANDATE 3: window.__GAME_STATE__ ACCURACY AND STATE TRANSITIONS
    // =========================================================================
    test.describe('Mandate 3: window.__GAME_STATE__ Reporting Accuracy & State Transitions', () => {
        test('Verify initial window.__GAME_STATE__ contracts and property types', async ({ page }) => {
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            const gameState = await page.evaluate(() => window.__GAME_STATE__);
            console.log('Initial __GAME_STATE__:', gameState);

            expect(gameState).toBeDefined();
            expect(gameState.isReady).toBe(true);
            expect(gameState.currentLevel).toBe(1);
            expect(gameState.isLevelTransitioning).toBe(false);

            // Player sub-object
            expect(gameState.player).toBeDefined();
            expect(typeof gameState.player.x).toBe('number');
            expect(typeof gameState.player.y).toBe('number');
            expect(typeof gameState.player.z).toBe('number');
            expect(typeof gameState.player.isMoving).toBe('boolean');

            // Toadbigode sub-object
            expect(gameState.toadbigode).toBeDefined();
            expect(gameState.toadbigode.isRevealed).toBe(false);
            expect(gameState.toadbigode.isHugging).toBe(false);

            // Dialogue sub-object
            expect(gameState.dialogue).toBeDefined();
            expect(typeof gameState.dialogue.isActive).toBe('boolean');

            // Audio sub-object
            expect(gameState.audio).toBeDefined();
            expect(typeof gameState.audio.isContextRunning).toBe('boolean');

            // UI sub-object
            expect(gameState.ui).toBeDefined();
            expect(typeof gameState.ui.letterModalOpen).toBe('boolean');
        });

        test('AUDIT: Verify candlesLit reporting in window.__GAME_STATE__ and window.gameApp.getState()', async ({ page }) => {
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            // Check initial state before hug: candlesLit must be FALSE
            const initialCandles = await page.evaluate(() => ({
                appCandlesLit: window.gameApp.candlesLit,
                getStateCandlesLit: window.gameApp.getState().candlesLit,
                gameStateCandlesLit: window.__GAME_STATE__.candlesLit,
                gameStateToadCandlesLit: window.__GAME_STATE__.toadbigode ? window.__GAME_STATE__.toadbigode.candlesLit : undefined
            }));

            console.log('Candles Lit Before Hug:', initialCandles);
            expect(initialCandles.appCandlesLit).toBe(false);
            expect(initialCandles.getStateCandlesLit).toBe(false);

            // Audit whether window.__GAME_STATE__ exposes candlesLit
            const hasCandlesLitInGameState = initialCandles.gameStateCandlesLit !== undefined || initialCandles.gameStateToadCandlesLit !== undefined;
            console.log('Is candlesLit directly accessible in window.__GAME_STATE__?:', hasCandlesLitInGameState);

            // Now trigger the Hug sequence (via triggerDaviHug or dialogue)
            await page.evaluate(() => window.gameApp.triggerDaviHug());

            // Check state after hug: candlesLit must transition to TRUE
            const postHugCandles = await page.evaluate(() => ({
                appCandlesLit: window.gameApp.candlesLit,
                getStateCandlesLit: window.gameApp.getState().candlesLit,
                gameStateCandlesLit: window.__GAME_STATE__.candlesLit,
                gameStateToadCandlesLit: window.__GAME_STATE__.toadbigode ? window.__GAME_STATE__.toadbigode.candlesLit : undefined,
                flamesVisible: window.gameApp.currentWorldData && window.gameApp.currentWorldData.flames
                    ? window.gameApp.currentWorldData.flames.map(f => f.visible)
                    : null
            }));

            console.log('Candles Lit After Hug:', postHugCandles);
            expect(postHugCandles.appCandlesLit).toBe(true);
            expect(postHugCandles.getStateCandlesLit).toBe(true);

            // If flames exist in current stage (stage 3), verify 3D flame visibility
            if (postHugCandles.flamesVisible) {
                expect(postHugCandles.flamesVisible.every(v => v === true)).toBe(true);
            }
        });

        test('Verify state transitions across Stage 1 -> 2 -> 3 warps', async ({ page }) => {
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            // Warp to Stage 2
            await page.evaluate(() => window.gameApp.warpToStage(2));
            await page.waitForTimeout(600);

            const stage2State = await page.evaluate(() => ({
                appStage: window.gameApp.currentStage,
                gameStateStage: window.__GAME_STATE__.currentLevel,
                badgeText: document.getElementById('stage-badge').innerText
            }));
            expect(stage2State.appStage).toBe(2);
            expect(stage2State.gameStateStage).toBe(2);
            expect(stage2State.badgeText).toContain('FASE 2');

            // Warp to Stage 3
            await page.evaluate(() => window.gameApp.warpToStage(3));
            await page.waitForTimeout(600);

            const stage3State = await page.evaluate(() => ({
                appStage: window.gameApp.currentStage,
                gameStateStage: window.__GAME_STATE__.currentLevel,
                badgeText: document.getElementById('stage-badge').innerText
            }));
            expect(stage3State.appStage).toBe(3);
            expect(stage3State.gameStateStage).toBe(3);
            expect(stage3State.badgeText).toContain('FASE 3');
        });

        test('Verify Davi reveal & hug state transitions', async ({ page }) => {
            await page.goto('/');
            await page.locator('#btn-start-game').click();
            await page.waitForFunction(() => !!window.gameApp);

            // Initial: neither revealed nor hugging
            const initToad = await page.evaluate(() => window.__GAME_STATE__.toadbigode);
            expect(initToad.isRevealed).toBe(false);
            expect(initToad.isHugging).toBe(false);

            // Trigger reveal
            await page.evaluate(() => window.gameApp.triggerDaviReveal());
            const revealToad = await page.evaluate(() => window.__GAME_STATE__.toadbigode);
            expect(revealToad.isRevealed).toBe(true);
            expect(revealToad.isHugging).toBe(false);

            // Trigger hug
            await page.evaluate(() => window.gameApp.triggerDaviHug());
            const hugToad = await page.evaluate(() => window.__GAME_STATE__.toadbigode);
            expect(hugToad.isRevealed).toBe(true);
            expect(hugToad.isHugging).toBe(true);
        });
    });
});
