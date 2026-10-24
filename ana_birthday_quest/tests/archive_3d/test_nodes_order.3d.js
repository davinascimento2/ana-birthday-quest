const { test } = require('@playwright/test');

test('inspect threejs nodes', async ({ page }) => {
    await page.goto('http://localhost:31425/');
    await page.waitForFunction(() => !!window.THREE);

    const info = await page.evaluate(async () => {
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((res, rej) => loader.load('assets/models/Ju_Ju_and_Duan_Duan.glb', res, undefined, rej));
        const root = gltf.scene.children[0];
        return root.children.map((c, i) => ({
            i,
            name: c.name,
            tx: c.matrix.elements[12],
            ty: c.matrix.elements[13],
            tz: c.matrix.elements[14],
            matName: c.material ? c.material.name : 'no_mat'
        }));
    });

    console.log('Total children:', info.length);
    info.forEach(item => {
        if (item.tx < 0) {
            console.log(`Child ${item.i}: name=${item.name} mat=${item.matName} tx=${item.tx.toFixed(2)}`);
        }
    });
});
