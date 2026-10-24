const { test, expect } = require('@playwright/test');
const path = require('path');

test('test low camera toad and clean ana', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:31425/');

    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene && !!window.gameApp.renderer, { timeout: 10000 });

    const screenshotDir = 'C:/Users/Davi/.gemini/antigravity/brain/8315d8eb-a3ca-464c-aaec-1543aea5d219';

    // Dismiss UI
    await page.evaluate(() => {
        const app = window.gameApp;
        app.controls.updateCamera = () => {};
        const d = document.getElementById('dialogue-box');
        if (d) d.style.display = 'none';
        const p = document.getElementById('interaction-prompt');
        if (p) p.style.display = 'none';
    });

    // 1. Toadsworth rot=0 eye-level camera
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.player.root.visible = false;
        app.davi.root.visible = false;
        app.toad.root.visible = true;

        app.toad.root.position.set(0, 0.5, -7);
        app.toad.root.rotation.set(0, 0, 0);

        app.camera.position.set(0, 0.75, -4.0);
        app.camera.lookAt(0, 0.75, -7);
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, 'toad_eye_rot0.png') });

    // 2. Toadsworth rot=PI eye-level camera
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.toad.root.rotation.set(0, Math.PI, 0);
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, 'toad_eye_rot180.png') });

    // 3. Ana without any glasses wires
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.toad.root.visible = false;
        app.davi.root.visible = false;
        app.player.root.visible = true;

        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Ju_Ju_and_Duan_Duan.glb', res, undefined, rej));
        
        const anaWrapper = new THREE.Group();
        anaWrapper.name = "AnaJuJuFinal";

        const model = gltf.scene.clone();
        const rootNode = model.children[0];

        // All glasses nodes: 0, 2, 3, 9, 10, 76, 77, 80, 81, 92, 93
        const glassesIndices = new Set([0, 2, 3, 9, 10, 76, 77, 80, 81, 92, 93]);

        rootNode.children.forEach((child, idx) => {
            const tx = child.matrix.elements[12];
            if (tx > 0) {
                child.visible = false;
            } else {
                if (glassesIndices.has(idx)) {
                    child.visible = false;
                } else {
                    child.visible = true;
                }
            }
        });

        model.updateMatrixWorld(true);
        const box = new THREE.Box3();
        model.traverse((c) => {
            if (c.isMesh && c.visible) {
                c.geometry.computeBoundingBox();
                const b = c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld);
                box.union(b);
            }
        });

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.15 / (size.y || 1);

        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        
        anaWrapper.add(model);
        
        // Remove previous custom meshes from player root
        const toRemove = [];
        app.player.root.children.forEach(c => {
            if (c.name && c.name.includes('Ana')) toRemove.push(c);
        });
        toRemove.forEach(c => app.player.root.remove(c));

        app.player.root.add(anaWrapper);

        app.player.root.position.set(0, 0.4, -7);
        app.player.root.rotation.set(0, 0, 0);

        app.camera.position.set(0, 1.4, -3.5);
        app.camera.lookAt(0, 1.2, -7);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'ana_perfect.png') });
});
