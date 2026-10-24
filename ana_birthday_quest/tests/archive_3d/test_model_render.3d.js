const { test, expect } = require('@playwright/test');
const path = require('path');

test('render portraits into app scene', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:31425/');

    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene && !!window.gameApp.renderer, { timeout: 10000 });

    const screenshotDir = 'C:/Users/Davi/.gemini/antigravity/brain/8315d8eb-a3ca-464c-aaec-1543aea5d219';

    // Hide UI
    await page.evaluate(() => {
        const d = document.getElementById('dialogue-box');
        if (d) d.style.display = 'none';
        const p = document.getElementById('interaction-prompt');
        if (p) p.style.display = 'none';
        const h = document.querySelector('header');
        if (h) h.style.display = 'none';
        const foot = document.querySelectorAll('.fixed, .absolute.bottom-4');
        foot.forEach(el => el.style.display = 'none');
    });

    // 1. Render Toadsworth
    await page.evaluate(async () => {
        const app = window.gameApp;
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Toadsworth.glb', res, undefined, rej));

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2a303c);

        const amb = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xfff8ee, 1.5);
        dir.position.set(3, 8, 5);
        scene.add(dir);

        const model = gltf.scene;
        // Scale to 1.6 height
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 1.6 / (size.y || 1);
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        scene.add(model);

        app.scene = scene;
        app.camera.position.set(0, 1.1, 2.8);
        app.camera.lookAt(0, 0.9, 0);
    });

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, 'portrait_toadsworth.png') });

    // 2. Render Ana (Ju Ju)
    await page.evaluate(async () => {
        const app = window.gameApp;
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/ana_model.glb', res, undefined, rej));

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2c2638);

        const amb = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xfff8ee, 1.5);
        dir.position.set(3, 8, 5);
        scene.add(dir);

        const model = gltf.scene;
        model.position.set(0, 0, 0);
        scene.add(model);

        app.scene = scene;
        app.camera.position.set(0, 1.3, 3.4);
        app.camera.lookAt(0, 1.1, 0);
    });

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, 'portrait_ana.png') });

    // 3. Render Davi (Duan Duan)
    await page.evaluate(async () => {
        const app = window.gameApp;
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/davi_model.glb', res, undefined, rej));

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x22332c);

        const amb = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xfff8ee, 1.5);
        dir.position.set(3, 8, 5);
        scene.add(dir);

        const model = gltf.scene;
        model.position.set(0, 0, 0);
        scene.add(model);

        app.scene = scene;
        app.camera.position.set(0, 1.4, 3.5);
        app.camera.lookAt(0, 1.2, 0);
    });

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, 'portrait_davi.png') });
});
