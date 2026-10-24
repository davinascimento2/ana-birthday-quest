const { test, expect } = require('@playwright/test');

/**
 * A Sinfonia de Ana Gleice - Mixtape Evolution Test Suite
 * Validates Flight & Gliding, Dynamic Companion AI, Walkman Mixtape Player, Emotes & Duet
 */

async function launchGame(page) {
    await page.goto('/');
    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene && !!window.gameApp.renderer, { timeout: 10000 });
}

test.describe('Mixtape Evolution: Voo & Planeio ("O Voo dos Sonhos")', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('M1: Player model has Celestial Parasol attached', async () => {
        const hasParasol = await page.evaluate(() => {
            return !!(window.gameApp.player && window.gameApp.player.parasol);
        });
        expect(hasParasol).toBe(true);
    });

    test('M2: Mid-air jump or boostUpdraft activates flight and reveals parasol', async () => {
        const flightState = await page.evaluate(() => {
            window.gameApp.controls.boostUpdraft(14.0);
            return {
                isGliding: window.gameApp.controls.isGliding,
                isGrounded: window.gameApp.controls.isGrounded,
                velocityY: window.gameApp.controls.velocityY,
                parasolVisible: window.gameApp.player.parasol.visible
            };
        });
        expect(flightState.isGliding).toBe(true);
        expect(flightState.isGrounded).toBe(false);
        expect(flightState.velocityY).toBeGreaterThan(0);
        expect(flightState.parasolVisible).toBe(true);
    });

    test('M3: Landing on the ground smoothly stops gliding and stows parasol', async () => {
        const groundState = await page.evaluate(() => {
            window.gameApp.controls.target.position.y = 0.05;
            window.gameApp.controls.velocityY = -5.0;
            window.gameApp.controls.update(0.05);
            window.gameApp.update(0.016);
            return {
                isGliding: window.gameApp.controls.isGliding,
                isGrounded: window.gameApp.controls.isGrounded,
                parasolVisible: window.gameApp.player.parasol.visible
            };
        });
        expect(groundState.isGliding).toBe(false);
        expect(groundState.isGrounded).toBe(true);
        expect(groundState.parasolVisible).toBe(false);
    });
});

test.describe('Mixtape Evolution: Toadbigode Companheiro Vivo', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('M4: Toadbigode possesses flying balloon accessory', async () => {
        const hasBalloon = await page.evaluate(() => {
            return !!(window.gameApp.toad && window.gameApp.toad.balloon);
        });
        expect(hasBalloon).toBe(true);
    });

    test('M5: Toadbigode deploys flying balloon while Ana is gliding', async () => {
        const balloonState = await page.evaluate(() => {
            window.gameApp.controls.startGliding();
            window.gameApp.update(0.05);
            return window.gameApp.toad.balloon.visible;
        });
        expect(balloonState).toBe(true);

        // Landing restores balloon to stowed
        const landedBalloonState = await page.evaluate(() => {
            window.gameApp.controls.stopGliding();
            window.gameApp.update(0.05);
            return window.gameApp.toad.balloon.visible;
        });
        expect(landedBalloonState).toBe(false);
    });
});

test.describe('Mixtape Evolution: Walkman de Fita Cassete', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('M6: Header contains Mixtape button and opens cassette modal', async () => {
        const btnMixtape = page.locator('#btn-mixtape');
        await expect(btnMixtape).toBeVisible();
        await btnMixtape.click();

        const modal = page.locator('#mixtape-modal');
        await expect(modal).toBeVisible();

        const title = page.locator('#mixtape-current-track-title');
        await expect(title).toContainText('Bosque do Primeiro Olhar');
    });

    test('M7: Track selection and tape player controls switch tracks accurately', async () => {
        await page.click('#btn-mixtape-next');
        const track2 = await page.evaluate(() => ({
            track: window.musicEngine.currentMixtapeTrack,
            active: window.musicEngine.isMixtapeActive
        }));
        expect(track2.track).toBe(2);
        expect(track2.active).toBe(true);

        const btnClose = page.locator('#btn-close-mixtape');
        await btnClose.click();
        const modal = page.locator('#mixtape-modal');
        await expect(modal).toBeHidden();
    });
});

test.describe('Mixtape Evolution: Emotes Musicais & Interatividade do Davi', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await launchGame(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('M8: Musical Pirouette emote 1 triggers rotation and audio', async () => {
        const startRot = await page.evaluate(() => window.gameApp.player.root.rotation.y);
        await page.evaluate(() => window.gameApp.triggerEmote(1));
        const endRot = await page.evaluate(() => window.gameApp.player.root.rotation.y);
        expect(endRot).toBeGreaterThan(startRot);
    });

    test('M9: In Stage 3, holding hands with Davi and releasing sky lanterns works', async () => {
        await page.evaluate(() => {
            window.gameApp.loadStage(3, true);
            window.gameApp.triggerDaviReveal();
        });

        const daviState = await page.evaluate(() => {
            window.gameApp.toggleHoldingHandsWithDavi();
            window.gameApp.releaseSkyLantern();
            return {
                isHoldingHands: window.gameApp.isHoldingHands,
                lanternCount: window.gameApp.activeSkyLanterns.length
            };
        });
        expect(daviState.isHoldingHands).toBe(true);
        expect(daviState.lanternCount).toBeGreaterThan(0);
    });
});
