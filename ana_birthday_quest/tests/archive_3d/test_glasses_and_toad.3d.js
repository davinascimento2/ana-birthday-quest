const { test } = require('@playwright/test');
const path = require('path');

test('test ana glasses removal and toadsworth model', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:31425/');

    const startBtn = page.locator('#btn-start-game');
    await startBtn.click();
    await page.waitForFunction(() => !!window.gameApp && !!window.gameApp.scene, { timeout: 10000 });

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

    // 1. Ana without any glasses
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.toad.root.visible = false;
        app.davi.root.visible = false;
        app.player.root.visible = true;

        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Ju_Ju_and_Duan_Duan.glb', res, undefined, rej));
        
        const anaWrapper = new THREE.Group();
        anaWrapper.name = "AnaJuJuReal";

        const model = gltf.scene;
        const rootNode = model.children[0];

        // Specific glasses names to hide:
        // Material022, Material021 (one side frame & glass)
        // Material016, Material013 (other side frame & glass)
        // wire_000000000 (bridge / frame)
        // wire_225198087, wire_225087143, wire_177027088, etc. if they are glasses parts
        const glassesMeshNames = new Set([
            'Material022', 'Material021', 'Material016', 'Material013',
            'wire_000000000', 'wire_177027088', 'wire_225198087', 'wire_225087143', 'wire_255255255'
        ]);

        rootNode.children.forEach((child) => {
            const tx = child.matrix.elements[12];
            if (tx > 0) {
                child.visible = false;
            } else {
                if (glassesMeshNames.has(child.name)) {
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

        // Remove old procedural
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
    await page.screenshot({ path: path.join(screenshotDir, 'ana_no_glasses_verified.png') });

    // 2. Toadsworth real GLTF model
    await page.evaluate(async () => {
        const app = window.gameApp;
        app.player.root.visible = false;
        app.toad.root.visible = true;

        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Toadsworth.glb', res, undefined, rej));

        const toadModel = gltf.scene;
        toadModel.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(toadModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 1.6 / (size.y || 1);

        toadModel.scale.setScalar(scale);
        toadModel.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

        // Remove old procedural meshes from toad.root
        while (app.toad.root.children.length > 0) {
            app.toad.root.remove(app.toad.root.children[0]);
        }
        app.toad.root.add(toadModel);

        app.toad.root.position.set(0, 0.4, -7);
        // Let's face Toadsworth towards camera: camera is at -3.5 (z), Toad at -7 (z), looking +Z towards -3.5
        app.toad.root.rotation.set(0, 0, 0);

        app.camera.position.set(0, 1.0, -4.5);
        app.camera.lookAt(0, 0.9, -7);
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'toadsworth_real_rot0.png') });

    // Toadsworth rot PI
    await page.evaluate(() => {
        window.gameApp.toad.root.rotation.set(0, Math.PI, 0);
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, 'toadsworth_real_rot180.png') });
});
