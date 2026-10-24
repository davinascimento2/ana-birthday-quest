const { test, expect } = require('@playwright/test');
const path = require('path');

test('test toad angles and ana glasses removal', async ({ page }) => {
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

    // 1. Ana without glasses
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.toad.root.visible = false;
        app.davi.root.visible = false;
        app.player.root.visible = true;

        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Ju_Ju_and_Duan_Duan.glb', res, undefined, rej));
        
        const anaWrapper = new THREE.Group();
        anaWrapper.name = "AnaJuJuNoGlasses";

        const model = gltf.scene.clone();
        const rootNode = model.children[0];

        rootNode.children.forEach((child, idx) => {
            const tx = child.matrix.elements[12];
            if (tx > 0) {
                child.visible = false;
            } else {
                // Nodes 80, 81, 92, 93 are Ana's glasses frames and lenses
                // Also 76, 77
                if (idx === 80 || idx === 81 || idx === 92 || idx === 93 || idx === 76 || idx === 77) {
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
        
        const existingMesh = app.player.root.getObjectByName('AnaRealModelGroup');
        if (existingMesh) {
            existingMesh.clear();
            existingMesh.add(anaWrapper);
        } else {
            app.player.root.add(anaWrapper);
        }

        const proc = app.player.root.getObjectByName('AnaProcGroup');
        if (proc) proc.visible = false;

        app.player.root.position.set(0, 0.4, -7);
        app.player.root.rotation.set(0, 0, 0);

        app.camera.position.set(0, 1.4, -3.5);
        app.camera.lookAt(0, 1.2, -7);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'ana_no_glasses.png') });

    // 2. Toadsworth at 4 different rotation angles: 0, PI/2, PI, -PI/2
    const angles = [
        { name: 'toad_rot_0.png', rot: 0 },
        { name: 'toad_rot_90.png', rot: Math.PI / 2 },
        { name: 'toad_rot_180.png', rot: Math.PI },
        { name: 'toad_rot_270.png', rot: -Math.PI / 2 }
    ];

    for (const item of angles) {
        await page.evaluate((r) => {
            const app = window.gameApp;
            app.player.root.visible = false;
            app.davi.root.visible = false;
            app.toad.root.visible = true;

            app.toad.root.position.set(0, 0.4, -7);
            app.toad.root.rotation.set(0, r, 0);

            app.camera.position.set(0, 1.2, -3.5);
            app.camera.lookAt(0, 1.0, -7);
        }, item.rot);
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotDir, item.name) });
    }
});
