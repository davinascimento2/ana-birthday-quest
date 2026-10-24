const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('export clean separated ana and davi models and capture portraits', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:31425/');

    await page.waitForFunction(() => !!window.THREE && !!window.THREE.GLTFLoader, { timeout: 10000 });

    // Inject GLTFExporter
    await page.addScriptTag({ path: path.join(__dirname, '../node_modules/three/examples/js/exporters/GLTFExporter.js') });

    const exportResult = await page.evaluate(async () => {
        const loader = new THREE.GLTFLoader();
        const exporter = new THREE.GLTFExporter();

        function loadModel(url) {
            return new Promise((res, rej) => loader.load(url, res, undefined, rej));
        }

        function exportBinary(input) {
            return new Promise((res, rej) => {
                exporter.parse(input, (glb) => res(glb), { binary: true });
            });
        }

        const gltf = await loadModel('assets/models/Ju_Ju_and_Duan_Duan.glb');
        const rawScene = gltf.scene;
        rawScene.updateMatrixWorld(true);

        // 1. Build Ana Scene
        const anaScene = new THREE.Group();
        anaScene.name = 'Ana_JuJu';

        // 2. Build Davi Scene
        const daviScene = new THREE.Group();
        daviScene.name = 'Davi_DuanDuan';

        // Clone each mesh to preserve original
        rawScene.traverse((child) => {
            if (child.isMesh) {
                const worldPos = new THREE.Vector3();
                child.getWorldPosition(worldPos);

                const clonedMesh = child.clone();
                // Apply world matrix so local positions match world positions
                clonedMesh.applyMatrix4(child.matrixWorld);

                if (worldPos.x < 0.0) {
                    // Ana side
                    // Check if mesh is glasses: Default OBJ.004 near the eyes (Z/Y head level)
                    // The user explicitly stated: "a ana nao usa oculos"
                    const isGlasses = (child.name && child.name.includes('OBJ.004')) || 
                                     (clonedMesh.material && clonedMesh.material.name && clonedMesh.material.name.includes('OBJ.004'));
                    if (!isGlasses) {
                        anaScene.add(clonedMesh);
                    }
                } else {
                    // Davi side
                    daviScene.add(clonedMesh);
                }
            }
        });

        // Center Ana at feet (Y=0, X=0, Z=0) and normalize scale to height 2.1
        const anaBox = new THREE.Box3().setFromObject(anaScene);
        const anaCenter = anaBox.getCenter(new THREE.Vector3());
        const anaSize = anaBox.getSize(new THREE.Vector3());
        const anaScale = 2.1 / (anaSize.y || 1);

        anaScene.position.x = -anaCenter.x * anaScale;
        anaScene.position.y = -anaBox.min.y * anaScale;
        anaScene.position.z = -anaCenter.z * anaScale;
        anaScene.scale.setScalar(anaScale);

        const anaRoot = new THREE.Group();
        anaRoot.add(anaScene);

        // Center Davi at feet (Y=0, X=0, Z=0) and normalize scale to height 2.2
        const daviBox = new THREE.Box3().setFromObject(daviScene);
        const daviCenter = daviBox.getCenter(new THREE.Vector3());
        const daviSize = daviBox.getSize(new THREE.Vector3());
        const daviScale = 2.2 / (daviSize.y || 1);

        daviScene.position.x = -daviCenter.x * daviScale;
        daviScene.position.y = -daviBox.min.y * daviScale;
        daviScene.position.z = -daviCenter.z * daviScale;
        daviScene.scale.setScalar(daviScale);

        const daviRoot = new THREE.Group();
        daviRoot.add(daviScene);

        // Export both
        const anaGlb = await exportBinary(anaRoot);
        const daviGlb = await exportBinary(daviRoot);

        // Convert ArrayBuffers to base64
        function ab2b64(buf) {
            let binary = '';
            const bytes = new Uint8Array(buf);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        return {
            anaBase64: ab2b64(anaGlb),
            daviBase64: ab2b64(daviGlb)
        };
    });

    const assetsDir = path.join(__dirname, '../assets/models');
    fs.writeFileSync(path.join(assetsDir, 'ana_model.glb'), Buffer.from(exportResult.anaBase64, 'base64'));
    fs.writeFileSync(path.join(assetsDir, 'davi_model.glb'), Buffer.from(exportResult.daviBase64, 'base64'));

    console.log('Successfully saved ana_model.glb and davi_model.glb!');
});
