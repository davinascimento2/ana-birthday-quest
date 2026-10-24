const { test, expect } = require('@playwright/test');
const path = require('path');

test('test exact character nodes and camera portrait', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:31425/');

    const startBtn = page.locator('#btn-start-game');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene && !!window.gameApp.renderer, { timeout: 10000 });

    const screenshotDir = 'C:/Users/Davi/.gemini/antigravity/brain/8315d8eb-a3ca-464c-aaec-1543aea5d219';

    // 1. Toadsworth
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.controls.updateCamera = () => {};
        
        const d = document.getElementById('dialogue-box');
        if (d) d.style.display = 'none';
        const p = document.getElementById('interaction-prompt');
        if (p) p.style.display = 'none';

        app.player.root.visible = false;
        app.davi.root.visible = false;
        app.toad.root.visible = true;

        // Face forward towards camera
        app.toad.root.position.set(0, 0.4, -7);
        app.toad.root.rotation.set(0, 0, 0);

        app.camera.position.set(0, 1.2, -3.5);
        app.camera.lookAt(0, 1.0, -7);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'aligned_toad.png') });

    // 2. Ana (Ju Ju)
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.toad.root.visible = false;
        app.davi.root.visible = false;
        app.player.root.visible = true;

        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Ju_Ju_and_Duan_Duan.glb', res, undefined, rej));
        
        const anaWrapper = new THREE.Group();
        anaWrapper.name = "AnaJuJuDirect";

        const model = gltf.scene.clone();
        const rootNode = model.children[0]; // SketchfabRoot

        // Filter based on exact node translation
        rootNode.children.forEach((child, idx) => {
            const tx = child.matrix.elements[12];
            // Ana nodes have tx < 0
            if (tx > 0) {
                child.visible = false;
            } else {
                // Nodes 76 and 77 are Ana's glasses
                if (idx === 76 || idx === 77) {
                    child.visible = false; // No glasses for Ana
                } else {
                    child.visible = true;
                }
            }
        });

        // Compute bounds of visible Ana meshes
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
    await page.screenshot({ path: path.join(screenshotDir, 'aligned_ana.png') });

    // 3. Davi (Duan Duan)
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.player.root.visible = false;
        app.toad.root.visible = false;
        app.davi.root.visible = true;

        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Ju_Ju_and_Duan_Duan.glb', res, undefined, rej));

        const daviWrapper = new THREE.Group();
        daviWrapper.name = "DaviDuanDuanDirect";

        const model = gltf.scene.clone();
        const rootNode = model.children[0];

        rootNode.children.forEach((child) => {
            const tx = child.matrix.elements[12];
            // Davi nodes have tx > 0
            if (tx < 0) {
                child.visible = false;
            } else {
                child.visible = true;
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
        const scale = 2.25 / (size.y || 1);

        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

        daviWrapper.add(model);

        const existingMesh = app.davi.root.getObjectByName('DaviRealModelGroup');
        if (existingMesh) {
            existingMesh.clear();
            existingMesh.add(daviWrapper);
        } else {
            app.davi.root.add(daviWrapper);
        }

        const proc = app.davi.root.getObjectByName('DaviProcGroup');
        if (proc) proc.visible = false;

        app.davi.root.position.set(0, 0.4, -7);
        app.davi.root.rotation.set(0, 0, 0);

        app.camera.position.set(0, 1.4, -3.5);
        app.camera.lookAt(0, 1.2, -7);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'aligned_davi.png') });
});
