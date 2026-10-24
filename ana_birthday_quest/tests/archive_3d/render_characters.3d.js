const { test, expect } = require('@playwright/test');

test('capture detailed character portraits', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:31425/');
    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene && !!window.gameApp.renderer, { timeout: 10000 });

    // Dismiss dialogues and hide UI overlays
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
        const app = window.gameApp;
        app.controls.stopGliding();
        app.controls.isGliding = false;
        app.controls.isGrounded = true;
        app.controls.velocityY = 0;
        app.controls.getMovementVector = () => new THREE.Vector3(0, 0, 0);
        app.controls.updateCamera = () => {};

        // Hide UI dialogue box for clean portraits
        const box = document.getElementById('dialogue-box');
        if (box) box.style.display = 'none';
        const interactPrompt = document.getElementById('interaction-prompt');
        if (interactPrompt) interactPrompt.style.display = 'none';
    });

    // 1. Ana Gleice Full Portrait (Head to toe)
    await page.evaluate(() => {
        const app = window.gameApp;
        app.player.root.visible = true;
        app.toad.root.visible = false;
        app.davi.root.visible = false;

        app.player.root.position.set(0, 0, -10);
        app.player.root.rotation.set(0, 0.15, 0); // Gentle 3/4 front view

        app.camera.position.set(0, 1.8, -5.5);
        app.camera.lookAt(0, 1.6, -10);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test_ana_full.png' });

    // 2. Toadsworth Full Portrait (Head to toe)
    await page.evaluate(() => {
        const app = window.gameApp;
        app.player.root.visible = false;
        app.toad.root.visible = true;
        app.davi.root.visible = false;

        app.toad.root.position.set(0, 0, -10);
        app.toad.root.rotation.set(0, 0.2, 0); // Gentle 3/4 front view

        app.camera.position.set(0, 1.6, -5.5);
        app.camera.lookAt(0, 1.4, -10);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test_toad_full.png' });

    // 3. Davi Full Portrait (Head to toe)
    await page.evaluate(() => {
        const app = window.gameApp;
        app.player.root.visible = false;
        app.toad.root.visible = false;
        app.davi.root.visible = true;

        app.davi.root.position.set(0, 0, -10);
        app.davi.root.rotation.set(0, 0.2, 0); // Gentle 3/4 front view

        app.camera.position.set(0, 1.8, -5.5);
        app.camera.lookAt(0, 1.6, -10);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test_davi_full.png' });
});

