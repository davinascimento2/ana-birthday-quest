const { test, expect } = require('@playwright/test');

test('capture visuals for user review', async ({ page }) => {
    await page.goto('http://localhost:31425/');
    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene && !!window.gameApp.renderer, { timeout: 10000 });

    // Dismiss start dialogue
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    // Rotate camera to front using controls targetYaw
    await page.evaluate(() => {
        const app = window.gameApp;
        if (app.controls) {
            app.controls.cameraYaw = Math.PI;
            app.controls.targetYaw = Math.PI;
            app.controls.cameraDistance = 5.5;
            app.controls.targetDistance = 5.5;
            app.controls.cameraPitch = 0.22;
            app.controls.targetPitch = 0.22;
        }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'render_ana_toad_stage1.png' });

    // Frame Davi in Stage 3 facing the camera
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.loadStage(3);
        await new Promise(r => setTimeout(r, 600));
        app.triggerDaviReveal();
        await new Promise(r => setTimeout(r, 600));

        // Walk Davi in front of Ana
        if (app.controls) {
            app.controls.cameraYaw = 0;
            app.controls.targetYaw = 0;
            app.controls.cameraDistance = 4.5;
            app.controls.targetDistance = 4.5;
        }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'render_davi_stage3.png' });
});
