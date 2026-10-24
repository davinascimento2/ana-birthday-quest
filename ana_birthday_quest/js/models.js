// 3D Procedural Models & World Builder for "A Sinfonia de Ana Gleice"
// 100% Procedural Three.js Geometries & Stepped Cel-Shading Materials (Zero external .gltf files)

const Models = {
    _rampCache: {},
    _gltfCache: {},

    loadGLTF(url) {
        if (this._gltfCache[url]) {
            return Promise.resolve(this._gltfCache[url]);
        }
        return new Promise((resolve) => {
            if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
                console.warn('[Models] THREE.GLTFLoader not available');
                resolve(null);
                return;
            }
            const loader = new THREE.GLTFLoader();
            loader.load(
                url,
                (gltf) => {
                    this._gltfCache[url] = gltf;
                    resolve(gltf);
                },
                undefined,
                (err) => {
                    console.warn(`[Models] Could not load ${url}:`, err);
                    resolve(null);
                }
            );
        });
    },

    fitToSize(object, targetHeight, centerOrigin = true) {
        if (!object) return;
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        if (size.y > 0) {
            const scale = targetHeight / size.y;
            object.scale.setScalar(scale);
        }
        if (centerOrigin) {
            box.setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.x -= center.x;
            object.position.y -= box.min.y;
            object.position.z -= center.z;
        }
    },

    // =========================================================================
    // 0. PROCEDURAL TOON RAMP TEXTURES & SHADER PIPELINE (ANIMAL CROSSING VELVET SHADING)
    // =========================================================================
    createToonRampTexture(steps = 3) {
        if (this._rampCache[steps]) return this._rampCache[steps];
        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const grad = ctx.createLinearGradient(0, 0, 64, 0);
        // Soft velvety Ghibli / Animal Crossing gradient transitions (prevents jagged polygonal facets)
        if (steps === 2) {
            grad.addColorStop(0.0, '#757575');
            grad.addColorStop(0.45, '#888888');
            grad.addColorStop(0.55, '#f0f0f0');
            grad.addColorStop(1.0, '#ffffff');
        } else if (steps === 3) {
            grad.addColorStop(0.0, '#707085');
            grad.addColorStop(0.32, '#888899');
            grad.addColorStop(0.38, '#b8b8cc');
            grad.addColorStop(0.68, '#c8c8dc');
            grad.addColorStop(0.74, '#f8f8fc');
            grad.addColorStop(1.0, '#ffffff');
        } else {
            // 4-step velvety toon (Chibi skin & characters)
            grad.addColorStop(0.0, '#757388');
            grad.addColorStop(0.25, '#9a98b0');
            grad.addColorStop(0.55, '#c0bed2');
            grad.addColorStop(0.82, '#e8e6f4');
            grad.addColorStop(1.0, '#ffffff');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 1);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        this._rampCache[steps] = texture;
        return texture;
    },

    createToonMaterial(color, steps = 3, options = {}) {
        const ramp = this.createToonRampTexture(steps);
        const matConfig = Object.assign({
            color: color,
            gradientMap: ramp
        }, options);
        return new THREE.MeshToonMaterial(matConfig);
    },

    // Animal Crossing Authentic Face Canvas Texture (Image 2 - Big Eyes, Sparkles, Rosy Blush & Joyful Smile)
    createACFaceTexture() {
        if (this._acFaceTexture) return this._acFaceTexture;
        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Clear transparent canvas (Zero opaque background disc: blends seamlessly onto head skin)
        ctx.clearRect(0, 0, 512, 512);

        // Animal Crossing Big Expressive Eyes (Image 2 style)
        const eyeCenters = [156, 356];
        eyeCenters.forEach((ex, idx) => {
            const isLeft = idx === 0;
            const dir = isLeft ? -1 : 1;

            // Sclera (White eye base)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(ex, 210, 46, 54, 0, 0, Math.PI * 2);
            ctx.fill();

            // Sclera soft border
            ctx.strokeStyle = '#d6d3d1';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Iris outer (Deep forest espresso)
            ctx.fillStyle = '#222718';
            ctx.beginPath();
            ctx.ellipse(ex + dir * 4, 210, 38, 52, 0, 0, Math.PI * 2);
            ctx.fill();

            // Iris warm amber gradient glow (Image 2)
            const irisGrad = ctx.createLinearGradient(ex, 210, ex, 255);
            irisGrad.addColorStop(0, 'rgba(45, 30, 15, 0)');
            irisGrad.addColorStop(0.5, 'rgba(110, 75, 30, 0.75)');
            irisGrad.addColorStop(1, 'rgba(190, 135, 50, 0.95)');
            ctx.fillStyle = irisGrad;
            ctx.beginPath();
            ctx.ellipse(ex + dir * 4, 222, 30, 32, 0, 0, Math.PI);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#0a0908';
            ctx.beginPath();
            ctx.ellipse(ex + dir * 4, 212, 22, 32, 0, 0, Math.PI * 2);
            ctx.fill();

            // Primary large specular catchlight (top-right of pupil)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex + dir * 4 + 11, 198, 12, 0, Math.PI * 2);
            ctx.fill();

            // Secondary cute specular catchlight (bottom-left)
            ctx.beginPath();
            ctx.arc(ex + dir * 4 - 8, 228, 6, 0, Math.PI * 2);
            ctx.fill();

            // Upper curved eyelash line (Thick dark brown / black)
            ctx.strokeStyle = '#18110e';
            ctx.lineWidth = 8.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(ex, 184, 46, Math.PI * 0.16, Math.PI * 0.84, true);
            ctx.stroke();

            // Double outer-corner lash flicks (Image 2 villager girl signature)
            ctx.beginPath();
            ctx.moveTo(ex + dir * 40, 195);
            ctx.quadraticCurveTo(ex + dir * 52, 186, ex + dir * 58, 178);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(ex + dir * 34, 184);
            ctx.quadraticCurveTo(ex + dir * 44, 174, ex + dir * 48, 166);
            ctx.stroke();

            // Delicate curved chestnut eyebrows
            ctx.strokeStyle = '#6b2d18';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(ex, 138, 38, Math.PI * 1.18, Math.PI * 1.82);
            ctx.stroke();
        });

        // Soft Airbrushed Rosy Blush on Cheeks (Image 2 style)
        [96, 416].forEach(bx => {
            const radGrad = ctx.createRadialGradient(bx, 276, 4, bx, 276, 54);
            radGrad.addColorStop(0, 'rgba(255, 110, 145, 0.65)');
            radGrad.addColorStop(0.65, 'rgba(255, 140, 165, 0.35)');
            radGrad.addColorStop(1, 'rgba(255, 140, 165, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(bx, 276, 54, 0, Math.PI * 2);
            ctx.fill();
        });

        // Cute Little Peachy Nose
        ctx.fillStyle = '#d97757';
        ctx.beginPath();
        ctx.moveTo(256, 252);
        ctx.lineTo(248, 264);
        ctx.lineTo(264, 264);
        ctx.closePath();
        ctx.fill();

        // Cheerful Open Mouth Laugh / Smile (Image 2 style)
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(212, 292);
        ctx.quadraticCurveTo(256, 286, 300, 292);
        ctx.quadraticCurveTo(256, 346, 212, 292);
        ctx.closePath();
        ctx.fill();

        // Upper pearly white teeth edge
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(226, 292);
        ctx.quadraticCurveTo(256, 288, 286, 292);
        ctx.quadraticCurveTo(256, 306, 226, 292);
        ctx.closePath();
        ctx.fill();

        // Cute tongue curve at bottom of mouth
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(256, 332, 22, Math.PI * 1.15, Math.PI * 1.85);
        ctx.fill();

        // Outer lip stroke
        ctx.strokeStyle = '#58111a';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(212, 292);
        ctx.quadraticCurveTo(256, 286, 300, 292);
        ctx.quadraticCurveTo(256, 346, 212, 292);
        ctx.closePath();
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this._acFaceTexture = texture;
        return texture;
    },

    // Animal Crossing Davi Villager Face Canvas Texture (Sketchfab Duan Duan)
    createDaviFaceTexture() {
        if (this._daviFaceTexture) return this._daviFaceTexture;
        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Clear transparent canvas
        ctx.clearRect(0, 0, 512, 512);

        // Big Expressive Friendly Eyes (Duan Duan)
        [162, 350].forEach((ex, idx) => {
            const dir = idx === 0 ? -1 : 1;

            // White sclera base
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(ex, 212, 42, 50, 0, 0, Math.PI * 2);
            ctx.fill();

            // Iris outer (Deep charcoal/espresso)
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.ellipse(ex + dir * 2, 212, 38, 48, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#0a0908';
            ctx.beginPath();
            ctx.ellipse(ex + dir * 2, 212, 24, 32, 0, 0, Math.PI * 2);
            ctx.fill();

            // Primary large specular catchlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex + dir * 2 + 10, 200, 11, 0, Math.PI * 2);
            ctx.fill();

            // Secondary cute specular catchlight
            ctx.beginPath();
            ctx.arc(ex + dir * 2 - 7, 226, 5.5, 0, Math.PI * 2);
            ctx.fill();

            // Upper curved eyelash / eyelid
            ctx.strokeStyle = '#18110e';
            ctx.lineWidth = 7.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(ex, 186, 42, Math.PI * 0.18, Math.PI * 0.82, true);
            ctx.stroke();

            // Gentle curved eyebrows (closer to eye)
            ctx.strokeStyle = '#3a2218';
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(ex, 162, 34, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
        });

        // Soft rosy cheek blush
        [105, 407].forEach(bx => {
            const radGrad = ctx.createRadialGradient(bx, 276, 4, bx, 276, 48);
            radGrad.addColorStop(0, 'rgba(255, 110, 135, 0.60)');
            radGrad.addColorStop(0.65, 'rgba(255, 130, 150, 0.30)');
            radGrad.addColorStop(1, 'rgba(255, 130, 150, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(bx, 276, 48, 0, Math.PI * 2);
            ctx.fill();
        });

        // Cute Nose Dot
        ctx.fillStyle = '#d97757';
        ctx.beginPath();
        ctx.arc(256, 256, 5, 0, Math.PI * 2);
        ctx.fill();

        // Warm Loving Smile
        ctx.strokeStyle = '#8b263e';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(256, 312, 22, 0.15, Math.PI - 0.15);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this._daviFaceTexture = texture;
        return texture;
    },

    // Toadsworth Mushroom Cap Canvas Texture (Image 1 - Ivory with Smooth Chocolate Brown Dots)
    createToadsworthCapTexture() {
        if (this._toadsworthCapTexture) return this._toadsworthCapTexture;
        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Warm Cream / Ivory Base
        ctx.fillStyle = '#fdf7e7';
        ctx.fillRect(0, 0, 512, 512);

        // Smooth Chocolate Brown Spots (Image 1)
        ctx.fillStyle = '#5c3317';
        const spots = [
            [256, 170, 78],  // Top front spot
            [120, 256, 72],  // Left spot
            [392, 256, 72],  // Right spot
            [256, 370, 75],  // Back spot
            [256, 40, 55],   // Crown top
            [70, 140, 52],   // Front-left
            [442, 140, 52],  // Front-right
        ];

        spots.forEach(([x, y, r]) => {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this._toadsworthCapTexture = texture;
        return texture;
    },

    // Animal Crossing Grass Texture (Vibrant Green with Cute Triangle Pattern)
    createACGrassTexture() {
        if (this._acGrassTexture) return this._acGrassTexture;
        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Lush Animal Crossing Green Base
        ctx.fillStyle = '#5bb843';
        ctx.fillRect(0, 0, 256, 256);

        // Iconic Triangle Pattern (Animal Crossing signature)
        ctx.fillStyle = '#72ce58';
        const triSize = 8;
        const spacing = 32;

        for (let row = 0; row < 256 / spacing + 1; row++) {
            const offsetX = (row % 2) * (spacing / 2);
            for (let col = -1; col < 256 / spacing + 1; col++) {
                const cx = col * spacing + offsetX;
                const cy = row * spacing;

                ctx.beginPath();
                ctx.moveTo(cx, cy - triSize);
                ctx.lineTo(cx - triSize * 0.8, cy + triSize * 0.6);
                ctx.lineTo(cx + triSize * 0.8, cy + triSize * 0.6);
                ctx.closePath();
                ctx.fill();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(12, 12);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this._acGrassTexture = texture;
        return texture;
    },

    // Inverted hull stylized silhouette outline
    createOutlineMesh(mesh, thickness = 0.04, color = 0x2b232a) {
        if (!mesh || !mesh.geometry) return null;
        const outlineMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.BackSide
        });
        const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
        outlineMesh.scale.multiplyScalar(1 + thickness);
        return outlineMesh;
    },

    // Horizontal Sailor / Ju Ju Striped Shirt Canvas Texture (Sketchfab Ju Ju)
    createStripedShirtTexture() {
        if (this._stripedShirtTexture) return this._stripedShirtTexture;
        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Clean white base
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 256, 256);

        // Classic nautical navy/black horizontal stripes
        ctx.fillStyle = '#1e293b';
        const numStripes = 6;
        const stripeH = 256 / (numStripes * 2);
        for (let i = 0; i < numStripes; i++) {
            ctx.fillRect(0, i * stripeH * 2 + stripeH * 0.35, 256, stripeH * 0.9);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this._stripedShirtTexture = texture;
        return texture;
    },

    // Ju Ju Iconic Sunflower Prop (Sketchfab Ju Ju and Duan Duan)
    createJuJuSunflower() {
        const group = new THREE.Group();
        group.name = "JuJuSunflower";

        const stemMat = this.createToonMaterial(0x4ade80, 3);
        const leafMat = this.createToonMaterial(0x22c55e, 3);
        const petalMat = this.createToonMaterial(0xfacc15, 3); // Radiant sunflower yellow
        const centerMat = this.createToonMaterial(0x713f12, 3); // Warm chocolate brown seeds

        // Slender green stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.25, 10), stemMat);
        stem.position.y = 0.55;
        group.add(stem);

        // 2 broad green leaves
        [-0.14, 0.14].forEach((lx, idx) => {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), leafMat);
            leaf.scale.set(1.5, 0.15, 0.8);
            leaf.position.set(lx, 0.42 + idx * 0.20, 0);
            leaf.rotation.z = idx === 0 ? -0.45 : 0.45;
            leaf.rotation.y = idx === 0 ? 0.2 : -0.2;
            group.add(leaf);
        });

        // Sunflower Blossom Head
        const flowerHead = new THREE.Group();
        flowerHead.position.set(0, 1.18, 0);
        flowerHead.rotation.x = 0.25;

        // Big Chocolate Brown Seed Disk
        const center = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 18), centerMat);
        center.rotation.x = Math.PI / 2;
        flowerHead.add(center);

        // Ring of 14 Golden Yellow Petals
        const petalCount = 14;
        for (let p = 0; p < petalCount; p++) {
            const ang = (p / petalCount) * Math.PI * 2;
            const petal = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.26, 8), petalMat);
            petal.position.set(Math.cos(ang) * 0.30, Math.sin(ang) * 0.30, 0);
            petal.rotation.z = ang - Math.PI / 2;
            flowerHead.add(petal);
        }

        group.add(flowerHead);
        return group;
    },

    // =========================================================================
    // 1. ANA GLEICE CHIBI AVATAR (ANIMAL CROSSING / SKETCHFAB JU JU)
    // =========================================================================
    createAnaCharacter() {
        const group = new THREE.Group();
        group.name = "Ana";

        const realModelGroup = new THREE.Group();
        realModelGroup.name = "AnaRealModelGroup";
        group.add(realModelGroup);

        const procGroup = new THREE.Group();
        procGroup.name = "AnaProcGroup";
        group.add(procGroup);

        const skinMat = this.createToonMaterial(0xffebd9, 4); // Warm glowing Animal Crossing peach skin
        const hairMat = this.createToonMaterial(0x452317, 3); // Rich chestnut brown bob hair (Ju Ju)
        const whiteMat = this.createToonMaterial(0xffffff, 3);
        const shortMat = this.createToonMaterial(0x1e3a8a, 3); // Navy blue athletic shorts (Ju Ju)
        const sneakerMat = this.createToonMaterial(0x64748b, 3); // Grey/slate sneakers (Ju Ju)
        const bootMat = sneakerMat;
        const goldMat = this.createToonMaterial(0xfbbf24, 3);
        const strapMat = this.createToonMaterial(0x78350f, 3); // Leather backpack straps

        // --- Body / T-Shirt (Ju Ju Nautical Striped Sailor Top) ---
        const bodyGroup = new THREE.Group();
        bodyGroup.position.set(0, 0, 0);

        const stripedTex = this.createStripedShirtTexture();
        const shirtMat = stripedTex ? new THREE.MeshToonMaterial({
            map: stripedTex,
            gradientMap: this.createToonRampTexture(3)
        }) : this.createToonMaterial(0xf8fafc, 3);

        const shirtGeo = new THREE.CylinderGeometry(0.38, 0.72, 1.18, 32);
        const shirt = new THREE.Mesh(shirtGeo, shirtMat);
        shirt.position.y = 1.35;
        bodyGroup.add(shirt);

        // Crisp White Peter Pan Collar
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 24), whiteMat);
        collar.position.y = 1.95;
        collar.rotation.x = Math.PI / 2;
        bodyGroup.add(collar);

        // Ju Ju Leather Adventure Backpack & Shoulder Straps
        [-0.24, 0.24].forEach(sx => {
            const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.04), strapMat);
            strap.position.set(sx, 1.45, 0.46);
            bodyGroup.add(strap);
        });
        const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.58, 0.28), strapMat);
        backpack.position.set(0, 1.40, -0.44);
        bodyGroup.add(backpack);

        // Navy blue sport shorts with double white athletic side stripes peeking under shirt (Ju Ju)
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        [-0.22, 0.22].forEach(dx => {
            const shortLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.32, 16), shortMat);
            shortLeg.position.set(dx, 0.68, 0);

            // White athletic side stripe
            const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.06), stripeMat);
            sideStripe.position.set(dx > 0 ? dx + 0.18 : dx - 0.18, 0.68, 0);

            bodyGroup.add(shortLeg, sideStripe);
        });

        // --- Ana's Golden Violin & Bow (Musician Signature) ---
        const violinGroup = new THREE.Group();
        violinGroup.name = "AnaViolin";
        violinGroup.position.set(-0.55, 1.35, -0.38);
        violinGroup.rotation.set(0.18, 0.35, 0.55);

        const woodVarnishMat = this.createToonMaterial(0xb45309, 3);
        const ebonyMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
        const vStringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

        const vLower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.1, 14), woodVarnishMat);
        vLower.scale.set(1, 0.6, 1.2);
        const vUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.1, 14), woodVarnishMat);
        vUpper.scale.set(1, 0.6, 1.1);
        vUpper.position.y = 0.32;
        const vWaist = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.15), woodVarnishMat);
        vWaist.position.y = 0.16;

        const vNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.42, 8), ebonyMat);
        vNeck.position.y = 0.58;
        const vScroll = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.018, 6, 10), woodVarnishMat);
        vScroll.position.set(0, 0.8, 0.02);
        const vBridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.025), goldMat);
        vBridge.position.set(0, 0.14, 0.07);
        const vStrings = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 4), vStringMat);
        vStrings.position.set(0, 0.4, 0.08);

        const bowStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 4), goldMat);
        bowStick.position.set(0.1, 0.32, 0.05);
        bowStick.rotation.z = -0.15;

        violinGroup.add(vLower, vUpper, vWaist, vNeck, vScroll, vBridge, vStrings, bowStick);
        bodyGroup.add(violinGroup);
        procGroup.add(bodyGroup);

        // --- Head & Face (Animal Crossing Ju Ju) ---
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 2.4, 0);

        // Base Head Sphere
        const headGeo = new THREE.SphereGeometry(0.85, 32, 28);
        headGeo.scale(1.02, 1.0, 0.98);
        const head = new THREE.Mesh(headGeo, skinMat);
        headGroup.add(head);

        // Seamless Spherical Face Decal Shell
        const faceTex = this.createACFaceTexture();
        if (faceTex) {
            const faceShellGeo = new THREE.SphereGeometry(
                0.854, 32, 20,
                Math.PI * 0.18, Math.PI * 0.64,
                Math.PI * 0.26, Math.PI * 0.44
            );
            const faceDecal = new THREE.Mesh(
                faceShellGeo,
                new THREE.MeshBasicMaterial({
                    map: faceTex,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide
                })
            );
            headGroup.add(faceDecal);
        }

        // Cute Chibi Ears on sides of head
        [-0.84, 0.84].forEach(ex => {
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
            ear.scale.set(0.5, 0.8, 0.7);
            ear.position.set(ex, 0, 0.05);
            headGroup.add(ear);
        });

        // NOTE: Ju Ju does NOT wear glasses (Clean face per user explicit instruction)

        // --- Ju Ju Chestnut Brown Bob Haircut (Sketchfab Ju Ju Reference) ---
        // Back and Side Hair Cap
        const hairBackGeo = new THREE.SphereGeometry(
            0.895, 32, 18,
            Math.PI * 0.82, Math.PI * 1.36,
            0, Math.PI * 0.76
        );
        const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
        headGroup.add(hairBack);

        // Crown Dome covering top
        const hairCrownGeo = new THREE.SphereGeometry(
            0.895, 32, 12,
            0, Math.PI * 2,
            0, Math.PI * 0.38
        );
        const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
        headGroup.add(hairCrown);

        // Ju Ju Straight-Cut Bangs — smooth spherical fringe conforming to forehead
        const bangsGroup = new THREE.Group();
        bangsGroup.name = "JuJuBangs";

        const fringeGeo = new THREE.SphereGeometry(
            0.885, 32, 16,
            Math.PI * 0.24, Math.PI * 0.52,
            Math.PI * 0.22, Math.PI * 0.26
        );
        const fringeMesh = new THREE.Mesh(fringeGeo, hairMat);
        bangsGroup.add(fringeMesh);

        // Soft tapered fringe accents
        const fringeTips = [
            { x: -0.28, y: 0.25, z: 0.81, rz: 0.18 },
            { x: -0.10, y: 0.27, z: 0.83, rz: 0.05 },
            { x:  0.08, y: 0.27, z: 0.83, rz: -0.05 },
            { x:  0.26, y: 0.25, z: 0.81, rz: -0.18 }
        ];
        fringeTips.forEach(ft => {
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 8), hairMat);
            tip.position.set(ft.x, ft.y, ft.z);
            tip.rotation.set(0.18, 0, Math.PI + ft.rz);
            tip.scale.set(1.0, 0.85, 0.45);
            bangsGroup.add(tip);
        });
        headGroup.add(bangsGroup);

        // Long Bob Side Curtains framing cheeks
        [-0.72, 0.72].forEach(side => {
            const lockGroup = new THREE.Group();
            lockGroup.position.set(side, -0.08, 0.14);
            lockGroup.rotation.z = side > 0 ? -0.14 : 0.14;

            const lockMain = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.78, 16), hairMat);
            lockMain.scale.set(0.65, 1.0, 1.10);

            const lockBottom = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), hairMat);
            lockBottom.position.y = -0.40;
            lockBottom.scale.set(0.64, 0.75, 1.10);

            lockGroup.add(lockMain, lockBottom);
            headGroup.add(lockGroup);
        });

        // --- Ju Ju Woven Straw Hat with Terracotta Band (Sketchfab) ---
        const strawHatGroup = new THREE.Group();
        strawHatGroup.name = "StrawHat";
        strawHatGroup.position.set(0.24, 0.68, 0.06);
        strawHatGroup.rotation.set(0.14, 0.08, -0.26);

        const strawMat = this.createToonMaterial(0xdf9b4b, 3); // Warm golden straw
        const ribbonMat = this.createToonMaterial(0xbf360c, 3); // Terracotta ribbon band

        const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 0.36, 24), strawMat);
        hatCrown.position.y = 0.20;

        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.78, 0.04, 28), strawMat);
        hatBrim.position.y = 0.02;

        const hatRibbon = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.47, 0.08, 24), ribbonMat);
        hatRibbon.position.y = 0.06;

        strawHatGroup.add(hatCrown, hatBrim, hatRibbon);
        headGroup.add(strawHatGroup);

        // Keep HeartBoppers attached to headGroup for test suite & festival compatibility
        const bopperGroup = new THREE.Group();
        bopperGroup.name = "HeartBoppers";
        const bandMat = new THREE.MeshToonMaterial({ color: 0x1e293b });
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.90, 0.035, 10, 32, Math.PI), bandMat);
        band.position.set(0, 0.28, 0.04);
        band.rotation.x = -0.22;
        bopperGroup.add(band);

        const springMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
        const heartMat = new THREE.MeshStandardMaterial({
            color: 0xff2a85,
            emissive: 0xff1493,
            emissiveIntensity: 0.85,
            roughness: 0.2
        });

        [-0.32, 0.32].forEach((sx, sIdx) => {
            const stem = new THREE.Group();
            stem.position.set(sx, 1.04, 0.12);
            stem.rotation.z = sIdx === 0 ? 0.24 : -0.24;

            for (let c = 0; c < 6; c++) {
                const coil = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 16), springMat);
                coil.position.y = c * 0.075;
                coil.rotation.x = Math.PI / 2 + 0.1;
                stem.add(coil);
            }

            const heart = new THREE.Group();
            heart.position.set(0, 0.54, 0);

            const lobeGeo = new THREE.SphereGeometry(0.12, 16, 16);
            lobeGeo.scale(1, 1.2, 0.75);

            const lobeL = new THREE.Mesh(lobeGeo, heartMat);
            lobeL.position.set(-0.068, 0.06, 0);
            lobeL.rotation.z = -0.28;

            const lobeR = new THREE.Mesh(lobeGeo, heartMat);
            lobeR.position.set(0.068, 0.06, 0);
            lobeR.rotation.z = 0.28;

            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.24, 16), heartMat);
            tip.rotation.z = Math.PI;
            tip.position.y = -0.06;
            tip.scale.set(1, 1, 0.75);

            heart.add(lobeL, lobeR, tip);
            stem.add(heart);
            bopperGroup.add(stem);
        });
        bopperGroup.visible = false;
        headGroup.add(bopperGroup);
        procGroup.add(headGroup);

        // --- Arms (Ju Ju striped sleeves with Animal Crossing spherical hands) ---
        const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.65, 12);
        const armMat = shirtMat;
        const handMat = skinMat;

        const armLGroup = new THREE.Group();
        armLGroup.position.set(-0.62, 1.85, 0);
        const armL = new THREE.Mesh(armGeo, armMat);
        armL.position.y = -0.28;
        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), handMat);
        handL.position.y = -0.62;
        armLGroup.add(armL, handL);
        armLGroup.rotation.z = 0.2;
        procGroup.add(armLGroup);

        const armRGroup = new THREE.Group();
        armRGroup.position.set(0.62, 1.85, 0);
        const armR = new THREE.Mesh(armGeo, armMat);
        armR.position.y = -0.28;
        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), handMat);
        handR.position.y = -0.62;
        armRGroup.add(armR, handR);
        armRGroup.rotation.z = -0.2;

        // Ju Ju's Iconic Tall Sunflower in Right Hand (Sketchfab)
        const sunflower = this.createJuJuSunflower();
        sunflower.position.set(0.1, -0.62, 0.15);
        armRGroup.add(sunflower);

        // Cotton Candy preserved as optional accessory
        const cottonCandyGroup = new THREE.Group();
        cottonCandyGroup.name = "CottonCandy";
        cottonCandyGroup.position.set(0.1, -0.65, 0.22);
        cottonCandyGroup.rotation.x = 0.35;
        cottonCandyGroup.visible = false;

        const stickMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.55, 10), stickMat);
        stick.position.y = 0.15;
        cottonCandyGroup.add(stick);

        const candyMat = this.createToonMaterial(0xf472b6, 3);
        const candyPuff1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), candyMat);
        candyPuff1.position.y = 0.38;
        candyPuff1.scale.set(1.15, 1.35, 1.15);
        cottonCandyGroup.add(candyPuff1);
        armRGroup.add(cottonCandyGroup);
        procGroup.add(armRGroup);

        // --- Legs & Shoes (Ju Ju sneakers & socks) ---
        const legMat = skinMat;
        const sockMat = whiteMat;

        const legLGroup = new THREE.Group();
        legLGroup.position.set(-0.25, 0.7, 0);
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12), legMat);
        legL.position.y = -0.25;
        const sockL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 12), sockMat);
        sockL.position.y = -0.45;
        const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.32), sneakerMat);
        shoeL.position.set(0, -0.6, 0.06);
        const toeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), whiteMat);
        toeL.scale.set(0.9, 0.6, 1.0);
        toeL.position.set(0, -0.6, 0.18);
        legLGroup.add(legL, sockL, shoeL, toeL);
        procGroup.add(legLGroup);

        const legRGroup = new THREE.Group();
        legRGroup.position.set(0.25, 0.7, 0);
        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12), legMat);
        legR.position.y = -0.25;
        const sockR = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 12), sockMat);
        sockR.position.y = -0.45;
        const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.32), sneakerMat);
        shoeR.position.set(0, -0.6, 0.06);
        const toeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), whiteMat);
        toeR.scale.set(0.9, 0.6, 1.0);
        toeR.position.set(0, -0.6, 0.18);
        legRGroup.add(legR, sockR, shoeR, toeR);
        procGroup.add(legRGroup);

        // --- Musical Aura ("Lumi" Fairy Companion) ---
        const fairyGroup = new THREE.Group();
        const fairyCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        const wingMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.75 });
        const wingL = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), wingMat);
        wingL.position.set(-0.16, 0.1, 0);
        const wingR = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), wingMat);
        wingR.position.set(0.16, 0.1, 0);
        fairyGroup.add(fairyCore, wingL, wingR);
        fairyGroup.position.set(0.9, 3.2, 0.4);
        group.add(fairyGroup);

        // --- Celestial Glider Parasol ("Guarda-Chuva de Luz") ---
        const parasol = this.createGliderParasol();
        armRGroup.add(parasol);

        this.loadGLTF('assets/models/ana_model.glb').then(gltf => {
            if (gltf && gltf.scene) {
                const m = gltf.scene.clone();
                m.name = "AnaJuJuRealMesh";
                const box = new THREE.Box3().setFromObject(m);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const scale = 2.15 / (size.y || 1);
                m.scale.setScalar(scale);
                m.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

                procGroup.visible = false;
                realModelGroup.add(m);
            }
        });

        return {
            root: group,
            head: headGroup,
            body: bodyGroup,
            armL: armLGroup,
            armR: armRGroup,
            legL: legLGroup,
            legR: legRGroup,
            fairy: fairyGroup,
            wingL: wingL,
            wingR: wingR,
            parasol: parasol,
            sunflower: sunflower
        };
    },


    // =========================================================================
    // 2. TOADBIGODE (ROYAL TOADSWORTH WITH CANE, SPECTACLES & WHITE MUSTACHE - SKETCHFAB)
    // =========================================================================
    createToadbigode() {
        const group = new THREE.Group();
        group.name = "Toadbigode";
        group.scale.set(0.78, 0.78, 0.78);

        const realModelGroup = new THREE.Group();
        realModelGroup.name = "ToadRealModelGroup";
        group.add(realModelGroup);

        const procGroup = new THREE.Group();
        procGroup.name = "ToadProcGroup";
        group.add(procGroup);

        const skinMat = this.createToonMaterial(0xf4a261, 4);  // Warm orange-peach Toadsworth skin
        const capMat = this.createToonMaterial(0xf3e5be, 3);   // Warm golden-tan / cream mushroom cap (Sketchfab)
        const spotMat = this.createToonMaterial(0x502810, 3);  // Rich chocolate brown spots
        const vestMat = this.createToonMaterial(0x6d28d9, 3);  // Royal purple vest
        const goldMat = this.createToonMaterial(0xf59e0b, 3);  // Golden trim & buttons
        const stacheMat = this.createToonMaterial(0xffffff, 3);// Pure white handlebar mustache
        const shoeMat = this.createToonMaterial(0x7c2d12, 3);  // Dark reddish-brown stubby shoes
        const glassFrameMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const pantMat = this.createToonMaterial(0xfefefe, 3);  // White belly / pants

        // ============================================================
        // MUSHROOM CAP — Classic Mario Toadsworth dome with flat circular spots
        // ============================================================
        const capGroup = new THREE.Group();
        capGroup.name = "ToadCap";
        capGroup.position.set(0, 1.48, 0);
        capGroup.rotation.x = -0.06;

        // Main spherical cap — wide rounded mushroom dome
        const capGeo = new THREE.SphereGeometry(1.05, 32, 24);
        capGeo.scale(1.15, 0.86, 1.15);
        const cap = new THREE.Mesh(capGeo, capMat);
        capGroup.add(cap);

        // Underside brim rim (cream gill edge)
        const brimMat = this.createToonMaterial(0xf5e6c0, 3);
        const brim = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.08, 16, 32), brimMat);
        brim.position.y = -0.42;
        brim.rotation.x = Math.PI / 2;
        capGroup.add(brim);

        // Spots: Clean flat circles conforming directly to the cap dome surface (no bulging lumps!)
        // Front-center spot (prominent circular chocolate spot)
        const frontSpotGeo = new THREE.CircleGeometry(0.48, 24);
        const frontSpot = new THREE.Mesh(frontSpotGeo, spotMat);
        frontSpot.position.set(0.15, 0.12, 1.04);
        frontSpot.rotation.set(-0.10, 0.15, 0);
        capGroup.add(frontSpot);

        // Upper-center crown spot
        const topSpotGeo = new THREE.CircleGeometry(0.38, 24);
        const topSpot = new THREE.Mesh(topSpotGeo, spotMat);
        topSpot.position.set(0, 0.86, 0.26);
        topSpot.rotation.x = -Math.PI / 2.7;
        capGroup.add(topSpot);

        // Left side spot
        const leftSpotGeo = new THREE.CircleGeometry(0.36, 24);
        const leftSpot = new THREE.Mesh(leftSpotGeo, spotMat);
        leftSpot.position.set(-1.02, 0.10, 0.35);
        leftSpot.rotation.set(0, -Math.PI / 2.4, 0);
        capGroup.add(leftSpot);

        // Right side spot
        const rightSpotGeo = new THREE.CircleGeometry(0.36, 24);
        const rightSpot = new THREE.Mesh(rightSpotGeo, spotMat);
        rightSpot.position.set(1.02, 0.10, 0.35);
        rightSpot.rotation.set(0, Math.PI / 2.4, 0);
        capGroup.add(rightSpot);

        procGroup.add(capGroup);

        // ============================================================
        // HEAD (small warm peach sphere below cap)
        // ============================================================
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.56, 28, 24), skinMat);
        head.position.y = 1.05;
        head.scale.set(1.05, 1.0, 1.0);
        procGroup.add(head);

        // Beady dark eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        [-0.18, 0.18].forEach(ex => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), eyeMat);
            eye.scale.set(0.9, 1.4, 0.55);
            eye.position.set(ex, 1.10, 0.52);
            const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            catchlight.position.set(ex + 0.02, 1.13, 0.56);
            procGroup.add(eye, catchlight);
        });

        // Pince-Nez Spectacles
        const spectaclesGroup = new THREE.Group();
        spectaclesGroup.name = "ToadSpectacles";
        [-0.18, 0.18].forEach(gx => {
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 10, 24), glassFrameMat);
            rim.position.set(gx, 1.09, 0.54);
            spectaclesGroup.add(rim);

            const lens = new THREE.Mesh(new THREE.CircleGeometry(0.10, 16), new THREE.MeshBasicMaterial({
                color: 0xbfdbfe,
                transparent: true,
                opacity: 0.30,
                depthWrite: false
            }));
            lens.position.set(gx, 1.09, 0.54);
            spectaclesGroup.add(lens);
        });
        const specBridge = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.022, 0.02), glassFrameMat);
        specBridge.position.set(0, 1.09, 0.54);
        spectaclesGroup.add(specBridge);
        procGroup.add(spectaclesGroup);

        // ============================================================
        // BUSHY WHITE HANDLEBAR MUSTACHE (Signature Toadsworth)
        // ============================================================
        const stacheGroup = new THREE.Group();
        stacheGroup.name = "ToadStache";
        stacheGroup.position.set(0, 0.90, 0.58);

        // Subtle dark backing shadow so white mustache pops against white/light backgrounds
        const stacheShadow = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 12), new THREE.MeshBasicMaterial({ color: 0x71717a }));
        stacheShadow.scale.set(2.7, 1.15, 0.50);
        stacheShadow.position.set(0, 0, -0.05);
        stacheGroup.add(stacheShadow);

        // Central bushy mustache knot
        const stacheCenter = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), stacheMat);
        stacheCenter.scale.set(2.4, 1.0, 0.75);
        stacheGroup.add(stacheCenter);

        // Left droop and curl
        const droopL = new THREE.Group();
        droopL.position.set(-0.30, -0.04, 0);
        const bodyL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.36, 12), stacheMat);
        bodyL.rotation.z = Math.PI / 2 - 0.32;
        bodyL.position.set(-0.10, -0.01, 0);
        const curlL = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.055, 10, 18, Math.PI * 0.70), stacheMat);
        curlL.position.set(-0.28, 0.05, 0);
        curlL.rotation.z = 0.90;
        droopL.add(bodyL, curlL);
        stacheGroup.add(droopL);

        // Right droop and curl
        const droopR = new THREE.Group();
        droopR.position.set(0.30, -0.04, 0);
        const bodyR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.36, 12), stacheMat);
        bodyR.rotation.z = -Math.PI / 2 + 0.32;
        bodyR.position.set(0.10, -0.01, 0);
        const curlR = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.055, 10, 18, Math.PI * 0.70), stacheMat);
        curlR.position.set(0.28, 0.05, 0);
        curlR.rotation.z = -0.90;
        droopR.add(bodyR, curlR);
        stacheGroup.add(droopR);

        procGroup.add(stacheGroup);

        // ============================================================
        // BODY — Royal purple vest, golden buttons, white belly
        // ============================================================
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 20), pantMat);
        belly.position.y = 0.68;
        procGroup.add(belly);

        const vestBody = new THREE.Mesh(new THREE.SphereGeometry(0.60, 24, 20), vestMat);
        vestBody.position.y = 0.68;
        procGroup.add(vestBody);

        const frontBelly = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), pantMat);
        frontBelly.position.set(0, 0.74, 0.58);
        frontBelly.rotation.x = -0.08;
        procGroup.add(frontBelly);

        // Golden trim piping on vest lapels
        [-0.22, 0.22].forEach(px => {
            const piping = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.58, 8), goldMat);
            piping.position.set(px, 0.70, 0.56);
            procGroup.add(piping);
        });

        // 3 Gold Buttons down center of waistcoat
        [0.85, 0.70, 0.54].forEach(by => {
            const button = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), goldMat);
            button.rotation.x = Math.PI / 2;
            button.position.set(0, by, 0.60);
            procGroup.add(button);
        });

        // White puffy pants
        const pants = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), pantMat);
        pants.position.y = 0.36;
        procGroup.add(pants);

        // Stubby dark reddish-brown shoes
        [-0.28, 0.28].forEach(fx => {
            const foot = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), shoeMat);
            foot.scale.set(0.85, 0.52, 1.40);
            foot.position.set(fx, 0.14, 0.12);
            procGroup.add(foot);
        });

        // ============================================================
        // ARMS & CANE
        // ============================================================
        const armLGroup = new THREE.Group();
        armLGroup.position.set(-0.50, 0.82, 0.18);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.38, 10), skinMat);
        armL.position.y = -0.14;
        armLGroup.add(armL);
        armLGroup.rotation.set(0.15, 0, 0.25);

        // Walking Cane with mushroom cap head
        const caneGroup = new THREE.Group();
        caneGroup.name = "ToadCane";
        caneGroup.position.set(0, -0.28, 0.10);

        const woodMat = this.createToonMaterial(0x92400e, 3);
        const caneShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.035, 0.82, 10), woodMat);
        caneShaft.position.y = 0.41;
        caneGroup.add(caneShaft);

        const caneCap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), spotMat);
        caneCap.scale.set(1.10, 0.68, 1.10);
        caneCap.position.y = 0.84;
        caneGroup.add(caneCap);

        const caneCapSpot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), brimMat);
        caneCapSpot.position.set(0, 0.92, 0.08);
        caneGroup.add(caneCapSpot);

        armLGroup.add(caneGroup);
        procGroup.add(armLGroup);

        // Waving Right Arm
        const armRGroup = new THREE.Group();
        armRGroup.position.set(0.50, 0.82, 0);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.40, 10), skinMat);
        armR.position.y = 0.18;
        armRGroup.add(armR);
        armRGroup.rotation.set(0.2, 0, -1.0);
        procGroup.add(armRGroup);

        // Flying Companion Balloon
        const balloon = this.createToadBalloon();
        group.add(balloon);

        this.loadGLTF('assets/models/Toadsworth.glb').then(gltf => {
            if (gltf && gltf.scene) {
                const m = gltf.scene.clone();
                m.name = "ToadsworthRealMesh";
                const box = new THREE.Box3().setFromObject(m);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const scale = 1.95 / (size.y || 1);
                m.scale.setScalar(scale);
                m.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

                procGroup.visible = false;
                realModelGroup.add(m);
            }
        });

        return {
            root: group,
            cap: capGroup,
            stache: stacheGroup,
            stacheL: droopL,
            stacheR: droopR,
            armR: armRGroup,
            balloon: balloon
        };
    },


    // =========================================================================
    // 3. DAVI CHIBI AVATAR (ANIMAL CROSSING VILLAGER - SKETCHFAB DUAN DUAN)
    // =========================================================================
    createDaviCharacter() {
        const group = new THREE.Group();
        group.name = "Davi";

        const realModelGroup = new THREE.Group();
        realModelGroup.name = "DaviRealModelGroup";
        group.add(realModelGroup);

        const procGroup = new THREE.Group();
        procGroup.name = "DaviProcGroup";
        group.add(procGroup);

        const skinMat = this.createToonMaterial(0xffebd9, 4); // Warm Animal Crossing peach skin
        const hairMat = this.createToonMaterial(0x201c1a, 3); // Charcoal dark brown / black wavy hair (Duan Duan)
        const hoodieMat = this.createToonMaterial(0x71717a, 3); // Cozy heather-grey hoodie (Duan Duan)
        const pantMat = this.createToonMaterial(0x365314, 3); // Olive / dark green cargo shorts (Duan Duan)
        const backpackMat = this.createToonMaterial(0x78350f, 3); // Leather adventure backpack
        const bedrollMat = this.createToonMaterial(0xd97706, 3); // Rolled sleeping bag
        const strapMat = new THREE.MeshBasicMaterial({ color: 0x3e1f07 });
        const buckleMat = new THREE.MeshBasicMaterial({ color: 0xd4d4d8 });
        const sneakerMat = this.createToonMaterial(0x52525b, 3);
        const whiteMat = this.createToonMaterial(0xffffff, 3);

        // Head Group
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 2.4, 0);

        const headGeo = new THREE.SphereGeometry(0.85, 32, 28);
        headGeo.scale(1.02, 1.0, 0.98);
        const head = new THREE.Mesh(headGeo, skinMat);
        headGroup.add(head);

        // Animal Crossing Davi Seamless Face Shell
        const daviFaceTex = this.createDaviFaceTexture();
        if (daviFaceTex) {
            const faceShellGeo = new THREE.SphereGeometry(
                0.854, 32, 20,
                Math.PI * 0.18, Math.PI * 0.64,
                Math.PI * 0.26, Math.PI * 0.44
            );
            const faceDecal = new THREE.Mesh(
                faceShellGeo,
                new THREE.MeshBasicMaterial({
                    map: daviFaceTex,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide
                })
            );
            headGroup.add(faceDecal);
        }

        // Cute Chibi Ears
        [-0.84, 0.84].forEach(ex => {
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
            ear.scale.set(0.5, 0.8, 0.7);
            ear.position.set(ex, 0, 0.05);
            headGroup.add(ear);
        });

        // Animal Crossing Wavy Hair (Duan Duan - Sketchfab reference)
        const hairCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.895, 32, 18, Math.PI * 0.82, Math.PI * 1.36, 0, Math.PI * 0.74),
            hairMat
        );
        headGroup.add(hairCap);

        // Crown dome
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(0.895, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.38),
            hairMat
        );
        headGroup.add(crown);

        // Duan Duan Middle-Parted Curtain Locks — smooth, flowing, cohesive
        [-1, 1].forEach(side => {
            // Main front curtain panel
            const curtain = new THREE.Mesh(
                new THREE.CylinderGeometry(0.20, 0.26, 0.46, 16),
                hairMat
            );
            curtain.scale.set(0.55, 1.0, 0.70);
            curtain.position.set(side * 0.22, 0.26, 0.73);
            curtain.rotation.set(0.16, 0, -side * 0.28);
            headGroup.add(curtain);

            // Outer lock flowing toward temple
            const wisp = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.18, 0.38, 12),
                hairMat
            );
            wisp.scale.set(0.60, 1.0, 0.65);
            wisp.position.set(side * 0.46, 0.14, 0.64);
            wisp.rotation.set(0.12, 0, -side * 0.50);
            headGroup.add(wisp);

            // Side hair framing ears
            const sidePanel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.18, 0.50, 14),
                hairMat
            );
            sidePanel.scale.set(0.78, 1.0, 0.82);
            sidePanel.position.set(side * 0.72, 0.02, 0.32);
            sidePanel.rotation.set(0, side * 0.25, 0);
            headGroup.add(sidePanel);
        });

        // Stylish Round Wireframe Glasses (Duan Duan - Sketchfab)
        const glassesGroup = new THREE.Group();
        glassesGroup.name = "DaviGlasses";
        const daviGlassMat = new THREE.MeshBasicMaterial({ color: 0x1e293b }); // Slate dark wireframe
        [-0.28, 0.28].forEach(gx => {
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.016, 12, 28), daviGlassMat);
            rim.position.set(gx, 0.04, 0.85);
            glassesGroup.add(rim);

            const lens = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({
                color: 0x93c5fd,
                transparent: true,
                opacity: 0.18,
                depthWrite: false
            }));
            lens.position.set(gx, 0.04, 0.85);
            glassesGroup.add(lens);
        });
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.020, 0.02), daviGlassMat);
        bridge.position.set(0, 0.04, 0.85);
        glassesGroup.add(bridge);
        headGroup.add(glassesGroup);

        // Neat Mustache & Loving Smile
        const stacheMat = this.createToonMaterial(0x1c1917, 3);
        const stache = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.055, 0.035), stacheMat);
        stache.position.set(0, -0.12, 0.84);
        headGroup.add(stache);

        const smileMat = new THREE.MeshBasicMaterial({ color: 0xb91c1c });
        const smile = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 12, Math.PI), smileMat);
        smile.position.set(0, -0.22, 0.84);
        smile.rotation.x = Math.PI;
        headGroup.add(smile);
        procGroup.add(headGroup);

        // Cozy Grey Hoodie Body (sweater hook for test suite compatibility)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.60, 1.18, 24), hoodieMat);
        body.position.y = 1.35;
        procGroup.add(body);

        // Hoodie Hood Rim & Drawstrings (Duan Duan)
        const hoodRim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.09, 10, 24, Math.PI * 1.25), hoodieMat);
        hoodRim.position.set(0, 1.95, -0.12);
        hoodRim.rotation.x = -Math.PI / 2 + 0.3;
        hoodRim.rotation.z = Math.PI * 0.88;
        procGroup.add(hoodRim);

        // Drawstrings
        [-0.08, 0.08].forEach(dx => {
            const string = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 6), whiteMat);
            string.position.set(dx, 1.68, 0.54);
            procGroup.add(string);
        });

        // Hoodie Kangaroo Front Pocket
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.12), hoodieMat);
        pocket.position.set(0, 1.15, 0.52);
        procGroup.add(pocket);

        // --- Adventure Backpack with Bedroll ---
        const backpackGroup = new THREE.Group();
        backpackGroup.name = "DaviBackpack";
        backpackGroup.position.set(0, 1.42, -0.46);

        const bagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.72, 0.34), backpackMat);
        bagMesh.castShadow = true;

        const pocketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.14), backpackMat);
        pocketMesh.position.set(0, -0.12, -0.20);

        const bedrollMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.74, 16), bedrollMat);
        bedrollMesh.rotation.z = Math.PI / 2;
        bedrollMesh.position.set(0, 0.44, -0.04);

        [-0.20, 0.20].forEach(bx => {
            const strap = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 16), strapMat);
            strap.position.set(bx, 0.44, -0.04);
            strap.rotation.y = Math.PI / 2;

            const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.06), buckleMat);
            buckle.position.set(bx, 0.44, -0.20);
            backpackGroup.add(strap, buckle);
        });

        backpackGroup.add(bagMesh, pocketMesh, bedrollMesh);
        procGroup.add(backpackGroup);

        // Olive Cargo Shorts (Duan Duan - Sketchfab)
        [-0.25, 0.25].forEach((lx) => {
            const shortLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.50, 14), pantMat);
            shortLeg.position.set(lx, 0.65, 0);

            const cargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.20, 0.22), pantMat);
            cargoPocket.position.set(lx > 0 ? lx + 0.18 : lx - 0.18, 0.65, 0);

            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 10), skinMat);
            leg.position.set(lx, 0.35, 0);

            const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 10), whiteMat);
            sock.position.set(lx, 0.20, 0);

            const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.36), sneakerMat);
            sneaker.position.set(lx, 0.08, 0.08);

            const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), whiteMat);
            toeCap.scale.set(0.9, 0.6, 1.0);
            toeCap.position.set(lx, 0.06, 0.22);

            procGroup.add(shortLeg, cargoPocket, leg, sock, sneaker, toeCap);
        });

        // Articulated arms with Animal Crossing spherical hands (Duan Duan)
        const armLGroup = new THREE.Group();
        armLGroup.position.set(-0.65, 1.85, 0.05);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.68, 12), hoodieMat);
        armL.position.y = -0.30;
        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), skinMat);
        handL.position.y = -0.68;
        armLGroup.add(armL, handL);
        armLGroup.rotation.set(0.3, 0, 0.3);
        procGroup.add(armLGroup);

        const armRGroup = new THREE.Group();
        armRGroup.position.set(0.65, 1.85, 0.05);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.68, 12), hoodieMat);
        armR.position.y = -0.30;
        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), skinMat);
        handR.position.y = -0.68;
        armRGroup.add(armR, handR);
        armRGroup.rotation.set(0.3, 0, -0.3);

        // Skateboard prop at Davi's side (Sketchfab Duan Duan)
        const skateboardGroup = new THREE.Group();
        skateboardGroup.name = "DaviSkateboard";
        skateboardGroup.position.set(0.15, -0.45, 0.22);
        skateboardGroup.rotation.set(0.2, 0.1, -0.15);

        const boardMat = this.createToonMaterial(0x38bdf8, 3); // Sky blue deck
        const gripMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const wheelMat = this.createToonMaterial(0xfef08a, 3); // Yellow wheels

        const deck = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.04), boardMat);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.01), gripMat);
        grip.position.z = 0.025;
        skateboardGroup.add(deck, grip);

        [-0.30, 0.30].forEach(wy => {
            [-0.12, 0.12].forEach(wx => {
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(wx, wy, -0.04);
                skateboardGroup.add(wheel);
            });
        });
        armRGroup.add(skateboardGroup);
        procGroup.add(armRGroup);

        this.loadGLTF('assets/models/davi_model.glb').then(gltf => {
            if (gltf && gltf.scene) {
                const m = gltf.scene.clone();
                m.name = "DaviDuanDuanRealMesh";
                const box = new THREE.Box3().setFromObject(m);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const scale = 2.25 / (size.y || 1);
                m.scale.setScalar(scale);
                m.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

                procGroup.visible = false;
                realModelGroup.add(m);
            }
        });

        return {
            root: group,
            head: headGroup,
            armL: armLGroup,
            armR: armRGroup,
            sweater: body,
            glasses: glassesGroup
        };
    },


    // =========================================================================
    // 4. STAGE 1: BOSQUE DAS MELODIAS (ZELDA / GHIBLI VIBE)
    // =========================================================================
    buildStage1(scene) {
        const root = new THREE.Group();
        root.name = "Stage1_Forest";

        // Lush green island ground with Animal Crossing triangular grass pattern
        const grassTex = this.createACGrassTexture();
        const groundMat = grassTex ? new THREE.MeshToonMaterial({
            color: 0x86efac,
            map: grassTex,
            gradientMap: this.createToonRampTexture(3)
        }) : this.createToonMaterial(0x86efac, 3);
        const ground = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 4, 32), groundMat);
        ground.position.y = -2;
        ground.receiveShadow = true;
        root.add(ground);

        // Cobblestone winding path
        const pathMat = this.createToonMaterial(0xfef08a, 3);
        for (let i = 0; i < 18; i++) {
            const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.2 + (i % 3) * 0.2, 1.2, 0.15, 8), pathMat);
            const z = -12 + (i * 1.55);
            const x = Math.sin(i * 0.4) * 2.5;
            stone.position.set(x, 0.05, z);
            stone.rotation.y = (i * 0.5) % Math.PI;
            root.add(stone);
        }

        // Animal Crossing Orange Trees
        const acOrangeTree1 = this.createAnimalCrossingOrangeTree(-5, -12, 1.0);
        const acOrangeTree2 = this.createAnimalCrossingOrangeTree(11, -11, 1.05);
        root.add(acOrangeTree1, acOrangeTree2);

        // Stone Fairy Lanterns lining the cobblestone path
        const lanternPositions = [
            [-3.0, -10], [3.2, -7], [-3.4, -1], [3.5, 3], [-3.2, 8], [3.2, 12]
        ];
        lanternPositions.forEach(([lx, lz]) => {
            const lantern = this.createStoneLantern(lx, lz);
            root.add(lantern);
        });

        // Ancient Greco-Roman Harp Shrine Sanctuary (Interactive Motivo #1 trigger)
        const shrine = new THREE.Group();
        shrine.name = "HarpShrine";
        shrine.position.set(0, 0, -4);

        const marbleMat = this.createToonMaterial(0xf8fafc, 3);
        const stoneMat = this.createToonMaterial(0x94a3b8, 3);
        const goldMat = this.createToonMaterial(0xf59e0b, 3);

        // Circular Stepped Marble Dais
        const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.4, 24), stoneMat);
        baseLower.position.y = 0.2;
        baseLower.receiveShadow = true;

        const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.9, 0.5, 24), marbleMat);
        base.position.y = 0.65;
        base.receiveShadow = true;

        // 4 Fluted Classical Columns
        const colPositions = [
            [-2.2, -1.8], [2.2, -1.8],
            [-2.2, 1.8],  [2.2, 1.8]
        ];
        colPositions.forEach(([cx, cz]) => {
            const col = new THREE.Group();
            col.position.set(cx, 0.9, cz);

            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.4, 12), marbleMat);
            shaft.position.y = 2.2;
            shaft.castShadow = true;

            const capital = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.68), marbleMat);
            capital.position.y = 4.45;

            const basePillar = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.25, 12), marbleMat);
            basePillar.position.y = 0.12;

            col.add(shaft, capital, basePillar);
            shrine.add(col);
        });

        // Entablature Architrave Ring
        const entablature = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.22, 8, 24), marbleMat);
        entablature.rotation.x = Math.PI / 2;
        entablature.position.y = 5.45;
        shrine.add(entablature);

        // Classical Concert Harp with golden frame
        const harpArm = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.18, 12, 24, Math.PI), goldMat);
        harpArm.position.set(0, 2.7, 0);
        harpArm.rotation.z = Math.PI / 4;

        // Luminous Harp Strings
        const stringMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        for (let s = -3; s <= 3; s++) {
            const str = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4), stringMat);
            str.position.set(s * 0.35, 2.3, 0);
            harpArm.add(str);
        }

        shrine.add(baseLower, base, harpArm);
        root.add(shrine);

        // Star Portal to Galaxy at back of forest
        const portal = new THREE.Group();
        portal.name = "ForestPortal";
        portal.position.set(0, 0, 16);

        const archMat = this.createToonMaterial(0x64748b, 3);
        const archL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 8), archMat);
        archL.position.set(-2.5, 2.5, 0);
        const archR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 8), archMat);
        archR.position.set(2.5, 2.5, 0);
        const archTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.7, 1.2), archMat);
        archTop.position.set(0, 5.2, 0);

        const vortexMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.65 });
        const vortex = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5.0), vortexMat);
        vortex.position.set(0, 2.5, 0);

        portal.add(archL, archR, archTop, vortex);
        root.add(portal);

        // Firefly particles
        const firefliesGroup = new THREE.Group();
        const fireflyGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        for (let f = 0; f < 30; f++) {
            const ff = new THREE.Mesh(fireflyGeo, fireflyMat);
            ff.position.set((Math.random() - 0.5) * 36, 1.0 + Math.random() * 4, (Math.random() - 0.5) * 36);
            firefliesGroup.add(ff);
        }
        root.add(firefliesGroup);

        // 5 Golden Collectible Musical Notes
        const notes = [];
        const noteCoords = [
            [-6, 3.2, -2],   // High above bouncy mushroom
            [8, 1.2, -8],    // Near birch trunk
            [0, 1.0, 4],     // Near cobblestone path
            [-10, 1.0, 8],   // In sakura grove
            [4, 1.0, -12]    // Near entrance
        ];
        noteCoords.forEach((pos, idx) => {
            const noteObj = this.createCollectibleNote(idx);
            noteObj.root.position.set(pos[0], pos[1], pos[2]);
            root.add(noteObj.root);
            notes.push(noteObj);
        });

        // 2 Bouncy Mushrooms
        const mushrooms = [
            this.createBouncyMushroom(-6, -2),
            this.createBouncyMushroom(6, 6)
        ];
        mushrooms.forEach(m => root.add(m.root));

        // Mario Galaxy Launch Star at the portal
        const launchStarMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const launchStar = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4), launchStarMat);
        launchStar.position.set(0, 3.2, 16);
        root.add(launchStar);

        // Gentle Crystal Brook / Stream
        const streamMat = new THREE.MeshToonMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.75
        });
        const stream = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 26), streamMat);
        stream.rotation.x = -Math.PI / 2;
        stream.position.set(-6, 0.04, 0);
        root.add(stream);

        // Wooden Footbridge over Brook
        const bridgeGroup = new THREE.Group();
        bridgeGroup.position.set(-6, 0.12, 0);
        const woodMat = this.createToonMaterial(0x92400e, 3);
        for (let p = -4; p <= 4; p++) {
            const plank = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 0.62), woodMat);
            plank.position.set(0, 0, p * 0.72);
            plank.receiveShadow = true;
            bridgeGroup.add(plank);
        }
        root.add(bridgeGroup);

        // Organic Pines around the perimeter
        const pineCoords = [[-14, -8], [15, -6], [-16, 6], [16, 8]];
        pineCoords.forEach(([px, pz]) => {
            const p = this.createProceduralPineTree(5.5);
            p.position.set(px, 0, pz);
            root.add(p);
        });

        // Billowy Ghibli Broadleaf Trees (Clean, scenic framing)
        const broadleafCoords = [
            [-8, 12, 0x4ade80],
            [10, 14, 0xf472b6],
            [-14, -14, 0x34d399],
            [12, -12, 0xfbcfe8]
        ];
        broadleafCoords.forEach(([tx, tz, col]) => {
            const t = this.createProceduralGhibliTree(4.6, col);
            t.position.set(tx, 0, tz);
            root.add(t);
        });

        // Blooming Musical Chime Flowers alongside the path
        const flowerCoords = [
            [-2, -3, 0xf472b6], [2, -3, 0xfef08a], [-1.5, -5, 0xa78bfa], [1.5, -5, 0xf472b6],
            [-3, 4, 0x38bdf8], [3, 4, 0xf472b6], [0, 8, 0xfef08a]
        ];
        flowerCoords.forEach(([fx, fz, col]) => {
            const fl = this.createProceduralMusicalFlower(col);
            fl.position.set(fx, 0, fz);
            root.add(fl);
        });

        // Curated Wildflower Meadow Patches (Clean Animal Crossing path borders)
        const clusterSpots = [
            [-3.5, 0], [3.5, 0], [-3.2, 5], [3.2, 5]
        ];
        clusterSpots.forEach(([cx, cz]) => {
            const wf = this.createWildflowerMeadowCluster(cx, cz, 5);
            root.add(wf);
        });

        // Little Yellow Duckling floating on Crystal Brook
        const duck = this.createLittleDuck();
        duck.position.set(-6, 0.08, 4.5);
        duck.rotation.y = Math.PI / 4;
        root.add(duck);
        root.userData.duck = duck;

        // Updraft Thermal Geysers (Sakura wind spirals)
        const updrafts = this.createUpdraftGeysers(root, [
            [-10, 0, -6],
            [10, 0, 4]
        ], 'petals');

        // Aerial Melody Rings
        const melodyRings = this.createMelodyRings(root, [
            [0, 5.5, -7],
            [-6, 6.0, 0],
            [6, 6.5, 6]
        ]);

        // Scenic Overlook Bench under flowering tree
        const benches = this.createScenicBenches(root, [
            [9, 0, -10, -Math.PI / 4]
        ]);

        scene.add(root);
        return {
            root: root,
            fireflies: firefliesGroup,
            notes: notes,
            mushrooms: mushrooms,
            shrine: shrine,
            portal: portal,
            launchStar: launchStar,
            updrafts: updrafts,
            melodyRings: melodyRings,
            benches: benches
        };
    },


    // =========================================================================
    // 5. STAGE 2: O PLANETÃƒÂRIO DOS SONHOS CÃƒâ€œSMICOS (SUPER MARIO GALAXY VIBE)
    // =========================================================================
    buildStage2(scene) {
        const root = new THREE.Group();
        root.name = "Stage2_Galaxy";

        // ============================================================
        // FLAT CELESTIAL OBSERVATORY DECK (Top surface at y = 0)
        // Resolves all floating/sinking collision issues!
        // ============================================================
        const planetMat = this.createToonMaterial(0x1e1b4b, 3); // Deep midnight cosmic indigo
        const planetGeo = new THREE.CylinderGeometry(26, 28, 2, 40);
        const planet = new THREE.Mesh(planetGeo, planetMat);
        planet.position.set(0, -1, 0); // Flat top surface is exactly at y = 0!
        planet.receiveShadow = true;
        root.add(planet);

        // Golden Celestial Compass & Inlay Rings in the floor
        const goldTrimMat = this.createToonMaterial(0xfbbf24, 3);
        const innerRing = new THREE.Mesh(new THREE.RingGeometry(7.8, 8.2, 36), goldTrimMat);
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = 0.02;

        const outerRing = new THREE.Mesh(new THREE.RingGeometry(22, 22.4, 48), goldTrimMat);
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.y = 0.02;
        root.add(innerRing, outerRing);

        // Golden Saturn Rings floating gracefully around the platform perimeter
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(28, 34, 48), ringMat);
        ring.position.set(0, -0.5, 0);
        ring.rotation.x = Math.PI / 2.2;
        root.add(ring);

        // Elegant Starlight Balustrade Pillars around perimeter
        const pillarMat = this.createToonMaterial(0x93c5fd, 3);
        const glowPostMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        for (let p = 0; p < 12; p++) {
            const pAngle = (p / 12) * Math.PI * 2;
            const px = Math.cos(pAngle) * 25;
            const pz = Math.sin(pAngle) * 25;
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.0, 8), pillarMat);
            post.position.set(px, 0.5, pz);
            const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.20, 0), glowPostMat);
            gem.position.set(px, 1.15, pz);
            root.add(post, gem);
        }

        // ============================================================
        // DISTANT SUPER MARIO GALAXY PLANETS (Clean, beautiful cosmic horizon)
        // ============================================================
        const distantPlanets = this.createDistantGalaxyPlanets();
        root.add(distantPlanets);

        // Star Bits (Konpeito Candy Crystals hovering cleanly above flat floor)
        const starColors = [0xfef08a, 0xf472b6, 0x38bdf8, 0xa78bfa, 0x4ade80];
        const starBits = [];
        for (let i = 0; i < 24; i++) {
            const sMat = new THREE.MeshBasicMaterial({ color: starColors[i % starColors.length] });
            const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), sMat);
            const angle = (i / 24) * Math.PI * 2;
            const dist = 6 + (Math.sin(i * 3) * 4);
            star.position.set(Math.cos(angle) * dist, 0.75 + Math.sin(i) * 0.25, Math.sin(angle) * dist);
            root.add(star);
            starBits.push(star);
        }

        // Starlight Constellation Monument (Motivo #2 Trigger at (0, 0, -4))
        const constel = new THREE.Group();
        constel.name = "ConstellationMonument";
        constel.position.set(0, 0, -4);

        const starBaseMat = this.createToonMaterial(0x1e1b4b, 3);
        const sBase = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.5, 0.6, 12), starBaseMat);
        sBase.position.y = 0.3;

        const giantStarMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        const giantStar = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), giantStarMat);
        giantStar.position.y = 2.1;
        constel.add(sBase, giantStar);
        root.add(constel);

        // Floating Crystal Star Stepping Platforms
        const starPlatformCoords = [
            [-3.5, 1.5, -2], [3.5, 1.8, -2],
            [-4.8, 2.4, -6], [4.8, 2.7, -6],
            [0, 3.0, -8]
        ];
        starPlatformCoords.forEach(([px, py, pz]) => {
            const starPlat = this.createCrystalStarPlatform(px, py, pz, 1.3);
            root.add(starPlat);
        });

        // Celestial Warp Star Portal to Stage 3
        const warpStar = new THREE.Group();
        warpStar.name = "WarpStarPortal";
        warpStar.position.set(0, 1.8, 14);

        const warpRingMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, wireframe: true });
        const warpRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.15, 8, 24), warpRingMat);
        warpStar.add(warpRing);
        root.add(warpStar);

        // Cosmic Updraft Geysers (Stardust wind spirals)
        const updrafts = this.createUpdraftGeysers(root, [
            [-7, 0, -6],
            [7, 0, 5]
        ], 'stars');

        // Celestial Orbit Melody Rings
        const melodyRings = this.createMelodyRings(root, [
            [0, 5.5, -5],
            [8, 6.5, 2],
            [-8, 6.5, 2],
            [0, 7.0, 9]
        ]);

        // Scenic Stargazing Bench
        const benches = this.createScenicBenches(root, [
            [0, 0, -12, Math.PI]
        ]);

        scene.add(root);
        return {
            root: root,
            giantStar: giantStar,
            warpRing: warpRing,
            starBits: starBits,
            updrafts: updrafts,
            melodyRings: melodyRings,
            benches: benches,
            distantPlanets: distantPlanets
        };
    },


    // =========================================================================
    // 6. STAGE 3: O JARDIM DO LUAR, PIANO DE LUZ & BOLO REAL (CLÃƒÂMAX)
    // =========================================================================
    buildStage3(scene) {
        const root = new THREE.Group();
        root.name = "Stage3_Palace";

        // Crystalline Moonlit Pavilion Floor
        const palaceFloorMat = this.createToonMaterial(0xf5d0fe, 3);
        const floor = new THREE.Mesh(new THREE.CylinderGeometry(26, 28, 2, 32), palaceFloorMat);
        floor.position.y = -1;
        floor.receiveShadow = true;
        root.add(floor);

        // Giant Musical Piano Keyboard Path (12-key illuminated piano walkway)
        const whiteKeyMat = this.createToonMaterial(0xffffff, 3);
        const blackKeyMat = this.createToonMaterial(0x18181b, 3);
        const pianoPath = new THREE.Group();
        pianoPath.name = "PianoPath";
        const keys = [];

        for (let k = 0; k < 12; k++) {
            const wKey = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 1.4), whiteKeyMat.clone());
            wKey.position.set(0, 0.09, -8 + (k * 1.55));
            wKey.receiveShadow = true;
            pianoPath.add(wKey);
            keys.push(wKey);

            if ([0, 1, 3, 4, 5, 7, 8, 10].includes(k)) {
                const bKey = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.8), blackKeyMat);
                bKey.position.set(0.8, 0.22, -7.2 + (k * 1.55));
                pianoPath.add(bKey);
            }
        }
        root.add(pianoPath);

        // 3-Tier Birthday Cake (Majestic Centerpiece on Central Dais)
        const cake = new THREE.Group();
        cake.name = "Cake";
        cake.position.set(0, 0, 5); // Aligned with central dais & tests
        cake.visible = true;

        // Ornate Silver Pedestal Stand
        const silverMat = this.createToonMaterial(0xe2e8f0, 3);
        const cakeStand = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.0, 0.35, 24), silverMat);
        cakeStand.position.y = 0.18;
        const standFoot = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 0.45, 16), silverMat);
        standFoot.position.y = -0.15;
        cake.add(cakeStand, standFoot);

        // Mini Cupcake for Kirby to inhale
        const cupcake = this.createMiniCupcake();
        cupcake.position.set(0, 0, 5);
        root.add(cupcake);

        // Kirby Character Cameo
        const kirby = this.createKirbyCharacter();
        kirby.root.position.set(-5, 0, 5);
        kirby.root.rotation.y = Math.PI / 2; // Facing the cupcake
        root.add(kirby.root);

        // Crystal Music Box for the Love Letter
        const musicBox = this.createCrystalMusicBox();
        musicBox.root.position.set(2.8, 0, 5);
        musicBox.root.visible = false;
        root.add(musicBox.root);

        // Tier 1 (Vanilla & Strawberry with lilac ribbon border)
        const cakeMat1 = this.createToonMaterial(0xffedd5, 3);
        const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 2.2, 24), cakeMat1);
        tier1.position.y = 1.25;

        // Royal Icing pearl border on Tier 1
        const pearlMat = this.createToonMaterial(0xffffff, 3);
        const pearlBorder1 = new THREE.Mesh(new THREE.TorusGeometry(4.7, 0.14, 8, 28), pearlMat);
        pearlBorder1.position.y = 0.25;
        pearlBorder1.rotation.x = Math.PI / 2;
        cake.add(pearlBorder1);

        // Tier 2 (Pastel Pink Frosting)
        const cakeMat2 = this.createToonMaterial(0xf472b6, 3);
        const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 1.8, 24), cakeMat2);
        tier2.position.y = 3.25;

        const pearlBorder2 = new THREE.Mesh(new THREE.TorusGeometry(3.35, 0.12, 8, 24), pearlMat);
        pearlBorder2.position.y = 2.35;
        pearlBorder2.rotation.x = Math.PI / 2;
        cake.add(pearlBorder2);

        // Tier 3 (Pure White Fondant)
        const cakeMat3 = this.createToonMaterial(0xffffff, 3);
        const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 1.5, 24), cakeMat3);
        tier3.position.y = 4.9;

        const pearlBorder3 = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.1, 8, 20), pearlMat);
        pearlBorder3.position.y = 4.15;
        pearlBorder3.rotation.x = Math.PI / 2;
        cake.add(pearlBorder3);

        // 3 Golden Birthday Candles with Glowing Flames
        const candleMat = this.createToonMaterial(0xfef08a, 3);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

        const flames = [];
        [-0.8, 0, 0.8].forEach(cx => {
            const cGroup = new THREE.Group();
            const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), candleMat);
            stick.position.set(cx, 6.25, 0);

            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), flameMat);
            flame.scale.set(1, 1.6, 1);
            flame.position.set(cx, 7.05, 0);
            flame.visible = false;

            cGroup.add(stick, flame);
            flames.push(flame);
            cake.add(cGroup);
        });

        // Sculpted Strawberries around cake tiers
        const berryMat = this.createToonMaterial(0xef4444, 3);
        const leafMat = this.createToonMaterial(0x22c55e, 3);
        for (let b = 0; b < 10; b++) {
            const angle = (b / 10) * Math.PI * 2;
            const berry = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), berryMat);
            berry.position.set(Math.cos(angle) * 3.3, 2.4, Math.sin(angle) * 3.3);
            const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 5), leafMat);
            calyx.position.set(Math.cos(angle) * 3.3, 2.7, Math.sin(angle) * 3.3);
            calyx.rotation.x = Math.PI;
            cake.add(berry, calyx);
        }

        cake.add(tier1, tier2, tier3);
        root.add(cake);

        // Sakura Blossom Trees around the perimeter with glowing hanging lanterns
        const sakuraMat = this.createToonMaterial(0xfbcfe8, 3);
        const trunkMat = this.createToonMaterial(0x78350f, 3);
        const sakuraPos = [
            [-12, 6], [12, 6], [-10, 16], [10, 16], [-12, -4], [12, -4]
        ];
        sakuraPos.forEach(([sx, sz]) => {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 4, 8), trunkMat);
            trunk.position.y = 2;
            const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5, 1), sakuraMat);
            leaves.position.y = 4.8;
            tree.add(trunk, leaves);
            tree.position.set(sx, 0, sz);

            const lantern = this.createHangingLantern(sx > 0 ? -1.4 : 1.4, 3.8, 0.2);
            tree.add(lantern);

            root.add(tree);
        });

        // 100% Procedural Concert Grand Piano for the Birthday Recital
        const grandPiano = this.createProceduralGrandPiano();
        grandPiano.position.set(6.8, 0, 7.5);
        grandPiano.rotation.y = -Math.PI / 2.6;
        root.add(grandPiano);
        root.userData.grandPiano = grandPiano;

        // Updraft Geysers in Garden
        const updrafts = this.createUpdraftGeysers(root, [
            [-8, 0, -2],
            [8, 0, -2]
        ], 'petals');

        // Moonlit Melody Rings around Birthday Cake
        const melodyRings = this.createMelodyRings(root, [
            [0, 6.5, 2],
            [-5, 7.5, 7],
            [5, 7.5, 7]
        ]);

        // Romantic Cherry Blossom Bench
        const benches = this.createScenicBenches(root, [
            [-10, 0, 4, Math.PI / 3]
        ]);

        // Wish Lanterns Station
        const lanternStation = this.createLanternStation(root, [4.5, 0, 7.5]);

        scene.add(root);
        return {
            root: root,
            cake: cake,
            flames: flames,
            pianoKeys: keys,
            kirby: kirby,
            cupcake: cupcake,
            musicBox: musicBox,
            updrafts: updrafts,
            melodyRings: melodyRings,
            benches: benches,
            lanternStation: lanternStation
        };
    },

    createDistantGalaxyPlanets() {
        const group = new THREE.Group();
        group.name = "DistantPlanets";

        // 1. Distant Ringed Lavender Planet (Mario Galaxy Saturn)
        const p1Group = new THREE.Group();
        p1Group.position.set(-65, 26, -70);
        const p1Mat = this.createToonMaterial(0xa78bfa, 3);
        const p1Body = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 20), p1Mat);
        const p1RingMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide
        });
        const p1Ring = new THREE.Mesh(new THREE.RingGeometry(12, 18, 36), p1RingMat);
        p1Ring.rotation.x = Math.PI / 3;
        p1Group.add(p1Body, p1Ring);

        // 2. Distant Mint Moon Planetoid
        const p2Group = new THREE.Group();
        p2Group.position.set(70, 20, -50);
        const p2Mat = this.createToonMaterial(0x6ee7b7, 3);
        const p2Body = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 16), p2Mat);
        p2Group.add(p2Body);

        // 3. Distant Warm Star Asteroid with tiny moonlet
        const p3Group = new THREE.Group();
        p3Group.position.set(-50, -12, 55);
        const p3Mat = this.createToonMaterial(0xfbbf24, 3);
        const p3Body = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5, 1), p3Mat);
        const p3MoonMat = this.createToonMaterial(0xf472b6, 3);
        const p3Moon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 10), p3MoonMat);
        p3Moon.position.set(9.5, 2.0, 0);
        p3Group.add(p3Body, p3Moon);

        // 4. Distant Ice-Crystal World
        const p4Group = new THREE.Group();
        p4Group.position.set(55, 30, 48);
        const p4Mat = this.createToonMaterial(0x38bdf8, 3);
        const p4Body = new THREE.Mesh(new THREE.OctahedronGeometry(6.0, 1), p4Mat);
        p4Group.add(p4Body);

        group.add(p1Group, p2Group, p3Group, p4Group);
        return group;
    },


    // =========================================================================
    // 7. SPECIAL CHARACTERS & INTERACTIVES: KIRBY, NOTES, MUSHROOMS & CROWN
    // =========================================================================
    createKirbyCharacter() {
        const root = new THREE.Group();
        root.name = "Kirby";

        const proceduralGroup = new THREE.Group();
        proceduralGroup.name = "Kirby_Procedural";
        root.add(proceduralGroup);

        const kirbyMat = this.createToonMaterial(0xf472b6, 3);
        const bodyGeo = new THREE.SphereGeometry(0.75, 24, 24);
        const body = new THREE.Mesh(bodyGeo, kirbyMat);
        body.position.y = 0.75;
        proceduralGroup.add(body);

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        [-0.22, 0.22].forEach(ex => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), eyeMat);
            eye.scale.set(0.85, 1.6, 0.3);
            eye.position.set(ex, 0.85, 0.7);

            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pupilMat);
            pupil.scale.set(0.8, 1.1, 0.3);
            pupil.position.set(ex, 0.78, 0.73);

            const shine = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), shineMat);
            shine.position.set(ex, 0.94, 0.74);

            proceduralGroup.add(eye, pupil, shine);
        });

        const blushMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
        [-0.42, 0.42].forEach(bx => {
            const blush = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), blushMat);
            blush.position.set(bx, 0.68, 0.68);
            blush.rotation.y = bx > 0 ? 0.35 : -0.35;
            proceduralGroup.add(blush);
        });

        const shoeMat = this.createToonMaterial(0xef4444, 3);
        const footL = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), shoeMat);
        footL.scale.set(1.1, 0.6, 1.4);
        footL.position.set(-0.45, 0.22, 0.15);
        footL.rotation.y = 0.25;

        const footR = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), shoeMat);
        footR.scale.set(1.1, 0.6, 1.4);
        footR.position.set(0.45, 0.22, 0.15);
        footR.rotation.y = -0.25;
        proceduralGroup.add(footL, footR);

        const armL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), kirbyMat);
        armL.scale.set(1.2, 0.75, 0.75);
        armL.position.set(-0.75, 0.78, 0.1);

        const armR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), kirbyMat);
        armR.scale.set(1.2, 0.75, 0.75);
        armR.position.set(0.75, 0.78, 0.1);
        proceduralGroup.add(armL, armR);

        // GLTF Group for real 3D model
        const gltfGroup = new THREE.Group();
        gltfGroup.name = "Kirby_GLTF";
        gltfGroup.visible = false;
        root.add(gltfGroup);

        const kirbyObj = {
            root: root,
            proceduralGroup: proceduralGroup,
            gltfGroup: gltfGroup,
            body: body,
            armL: armL,
            armR: armR,
            footL: footL,
            footR: footR,
            gltfScene: null,
            isGLTFLoaded: false
        };

        this.loadGLTF('assets/models/kirby.glb').then(gltf => {
            if (gltf && gltf.scene) {
                const mesh = gltf.scene.clone();
                this.fitToSize(mesh, 1.5, true);
                mesh.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                gltfGroup.add(mesh);
                gltfGroup.visible = true;
                proceduralGroup.visible = false;
                kirbyObj.gltfScene = mesh;
                kirbyObj.isGLTFLoaded = true;
            }
        });

        return kirbyObj;
    },

    // =========================================================================
    // 7.1 PROCEDURAL MASTERPIECES (GRAND PIANO, GHIBLI FLORA, DUCK)
    // =========================================================================
    createProceduralGrandPiano() {
        const group = new THREE.Group();
        group.name = "GrandPiano";

        const blackLacquerMat = this.createToonMaterial(0x18181b, 3);
        const goldMat = this.createToonMaterial(0xf59e0b, 3);
        const whiteKeyMat = this.createToonMaterial(0xffffff, 3);
        const blackKeyMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        const stringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const velvetMat = this.createToonMaterial(0x831843, 3); // Royal burgundy velvet
        const woodSpruceMat = this.createToonMaterial(0xfef3c7, 3);

        // Main Piano Rim (Curved Grand Body)
        const bodyGeo = new THREE.BoxGeometry(2.8, 0.9, 3.6);
        const body = new THREE.Mesh(bodyGeo, blackLacquerMat);
        body.position.set(0, 1.85, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // S-Curve Tail Extension (Grand Piano classic contour)
        const tailCurve = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.9, 16, 1, false, 0, Math.PI), blackLacquerMat);
        tailCurve.rotation.y = -Math.PI / 2;
        tailCurve.position.set(0.0, 1.85, 1.8);
        tailCurve.castShadow = true;
        group.add(tailCurve);

        // Soundboard & Cast-Iron Harp Frame inside
        const soundboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 3.0), woodSpruceMat);
        soundboard.position.set(0, 2.15, 0.2);
        group.add(soundboard);

        // Golden Cast-Iron Harp Plate
        const harpPlate = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 16, Math.PI * 1.1), goldMat);
        harpPlate.rotation.x = Math.PI / 2;
        harpPlate.position.set(0.2, 2.22, 0.4);
        group.add(harpPlate);

        // Golden Strings
        for (let s = -5; s <= 5; s++) {
            const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 2.2, 4), stringMat);
            wire.rotation.x = Math.PI / 2;
            wire.position.set(s * 0.18, 2.24, 0.3);
            group.add(wire);
        }

        // Open Grand Lid (Angled up 32 degrees!)
        const lidGroup = new THREE.Group();
        lidGroup.position.set(-1.4, 2.32, -1.8);

        const lid = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 3.4), blackLacquerMat);
        lid.position.set(1.35, 0, 1.7);
        lidGroup.add(lid);

        // Golden Prop Stick holding lid open
        const propStick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), goldMat);
        propStick.position.set(2.4, 0.65, 0.4);
        propStick.rotation.z = -0.35;
        group.add(propStick);

        lidGroup.rotation.z = -0.55; // Winged open!
        group.add(lidGroup);

        // Fallboard & Sheet Music Stand
        const musicRack = new THREE.Group();
        musicRack.position.set(0, 2.45, -1.2);
        const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.08), blackLacquerMat);
        desk.rotation.x = -0.3;
        const sheetMusic = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.38), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
        sheetMusic.position.set(0, 0.02, 0.05);
        sheetMusic.rotation.x = -0.3;
        musicRack.add(desk, sheetMusic);
        group.add(musicRack);

        // Keybed & 88-Key Keyboard
        const keybed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 0.7), blackLacquerMat);
        keybed.position.set(0, 1.8, -1.75);
        group.add(keybed);

        // Ivory White Keys
        for (let k = 0; k < 18; k++) {
            const wk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.55), whiteKeyMat);
            wk.position.set(-1.08 + k * 0.128, 1.94, -1.75);
            group.add(wk);
        }

        // Ebony Black Sharps/Flats Keys
        [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15].forEach(bkIdx => {
            const bk = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.09, 0.34), blackKeyMat);
            bk.position.set(-1.02 + bkIdx * 0.128, 1.98, -1.82);
            group.add(bk);
        });

        // 3 Fluted Legs with Brass Casters
        const legPositions = [
            [-1.15, -1.4], // Front Left
            [1.15, -1.4],  // Front Right
            [0.0, 1.6]     // Tail Leg
        ];

        legPositions.forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 1.4, 8), blackLacquerMat);
            leg.position.set(lx, 0.7, lz);
            leg.castShadow = true;

            const caster = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldMat);
            caster.position.set(lx, 0.08, lz);

            group.add(leg, caster);
        });

        // Lyre Pedal Assembly
        const lyreGroup = new THREE.Group();
        lyreGroup.position.set(0, 0, -0.6);
        const lyrePillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), goldMat);
        lyrePillarL.position.set(-0.16, 0.75, 0);
        const lyrePillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), goldMat);
        lyrePillarR.position.set(0.16, 0.75, 0);

        // 3 Golden Foot Pedals
        [-0.12, 0, 0.12].forEach(px => {
            const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.22), goldMat);
            pedal.position.set(px, 0.18, -0.06);
            lyreGroup.add(pedal);
        });

        lyreGroup.add(lyrePillarL, lyrePillarR);
        group.add(lyreGroup);

        // Velvet Musician's Piano Bench
        const benchGroup = new THREE.Group();
        benchGroup.name = "PianoBench";
        benchGroup.position.set(0, 0, -2.55);

        const benchFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.7), blackLacquerMat);
        benchFrame.position.y = 0.95;
        const benchCushion = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.16, 0.65), velvetMat);
        benchCushion.position.y = 1.06;

        [-0.65, 0.65].forEach(bx => {
            [-0.22, 0.22].forEach(bz => {
                const bLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.95, 8), blackLacquerMat);
                bLeg.position.set(bx, 0.48, bz);
                bLeg.castShadow = true;
                benchGroup.add(bLeg);
            });
        });

        benchGroup.add(benchFrame, benchCushion);
        group.add(benchGroup);

        return group;
    },

    createLittleDuck() {
        const duck = new THREE.Group();
        duck.name = "LittleDuck";

        const yellowMat = this.createToonMaterial(0xfacc15, 3);
        const orangeMat = this.createToonMaterial(0xf97316, 3);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
        const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const rippleMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 });

        // Plump Body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), yellowMat);
        body.scale.set(1.0, 0.75, 1.25);
        body.position.y = 0.28;
        body.castShadow = true;
        duck.add(body);

        // Upturned tail
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 8), yellowMat);
        tail.position.set(0, 0.38, -0.42);
        tail.rotation.x = -Math.PI / 3;
        tail.castShadow = true;
        duck.add(tail);

        // Curved neck & Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), yellowMat);
        head.position.set(0, 0.52, 0.28);
        head.castShadow = true;
        duck.add(head);

        // Cute flat orange beak
        const beak = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8), orangeMat);
        beak.scale.set(1.2, 0.45, 1.0);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.48, 0.52);
        duck.add(beak);

        // Dark beady eyes with sparkle
        [-0.14, 0.14].forEach(ex => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
            eye.position.set(ex, 0.56, 0.42);
            const shine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), shineMat);
            shine.position.set(ex + (ex > 0 ? 0.015 : -0.015), 0.58, 0.45);
            duck.add(eye, shine);
        });

        // Cute tiny wings
        [-0.34, 0.34].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), yellowMat);
            wing.scale.set(0.35, 0.65, 1.1);
            wing.position.set(wx, 0.3, 0.05);
            wing.rotation.z = wx > 0 ? -0.2 : 0.2;
            wing.castShadow = true;
            duck.add(wing);
        });

        // Water ripple ring around duck
        const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 6, 20), rippleMat);
        ripple.rotation.x = Math.PI / 2;
        ripple.position.y = 0.1;
        duck.add(ripple);

        return duck;
    },

    createProceduralMusicalFlower(color = 0xf472b6) {
        const flower = new THREE.Group();
        flower.name = "MusicalFlower";

        const stemMat = this.createToonMaterial(0x22c55e, 3);
        const petalMat = this.createToonMaterial(color, 3);
        const centerMat = this.createToonMaterial(0xfef08a, 3);
        const goldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

        // Curved green stem
        const stemCurve = new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8);
        const stem = new THREE.Mesh(stemCurve, stemMat);
        stem.position.y = 0.35;
        stem.rotation.z = 0.08;
        stem.castShadow = true;
        flower.add(stem);

        // 2 little leaves
        [-0.14, 0.12].forEach((lx, idx) => {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), stemMat);
            leaf.scale.set(1.4, 0.2, 0.7);
            leaf.position.set(lx, 0.22 + idx * 0.12, 0);
            leaf.rotation.z = (idx === 0 ? -0.5 : 0.5);
            flower.add(leaf);
        });

        // Blossom Head
        const flowerHead = new THREE.Group();
        flowerHead.position.set(0.04, 0.7, 0);

        // 5 Rounded Petals
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const petal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), petalMat);
            petal.scale.set(0.9, 0.35, 1.3);
            petal.position.set(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0);
            petal.rotation.z = angle;
            petal.castShadow = true;
            flowerHead.add(petal);
        }

        // Center golden stamen bulb
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), centerMat);
        center.position.z = 0.04;
        flowerHead.add(center);

        // Tiny floating musical note icon
        const notePip = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), goldMat);
        notePip.position.set(0, 0, 0.14);
        flowerHead.add(notePip);

        flower.add(flowerHead);
        return flower;
    },

    // Field of Flowers / Flower Pack Clusters (Animal Crossing / Ghibli Floral Meadow)
    createWildflowerMeadowCluster(centerX, centerZ, count = 8) {
        const cluster = new THREE.Group();
        cluster.name = "WildflowerCluster";
        cluster.position.set(centerX, 0, centerZ);

        const flowerPalette = [
            0xffffff, // White cosmos / chamomile daisies (Image: field of flowers)
            0xfef08a, // Buttercup yellow
            0xf472b6, // Cherry blossom pink
            0xa78bfa, // Lilac / violet bells
            0x38bdf8, // Sky blue hydrangeas
            0xfb923c  // Orange poppies
        ];

        const stemMat = this.createToonMaterial(0x16a34a, 3);
        const centerYellow = this.createToonMaterial(0xfacc15, 3);

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.sin(i * 1.5) * 0.3);
            const dist = 0.4 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 1.2;
            const fx = Math.cos(angle) * dist;
            const fz = Math.sin(angle) * dist;
            const scale = 0.70 + ((i % 3) * 0.15);
            const col = flowerPalette[i % flowerPalette.length];
            const petalMat = this.createToonMaterial(col, 3);

            const fl = new THREE.Group();
            fl.position.set(fx, 0, fz);
            fl.scale.setScalar(scale);

            // Stem
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.45, 6), stemMat);
            stem.position.y = 0.22;
            stem.rotation.z = Math.sin(i * 1.2) * 0.12;
            fl.add(stem);

            // Blossom
            const blossom = new THREE.Group();
            blossom.position.set(0, 0.44, 0);
            blossom.rotation.x = 0.25 + Math.cos(i) * 0.1;
            blossom.rotation.y = (i * 0.7) % Math.PI;

            // Disk center
            const disk = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), centerYellow);
            disk.scale.set(1, 0.5, 1);
            blossom.add(disk);

            // 6-8 Petals
            const numPetals = 6 + (i % 3);
            for (let p = 0; p < numPetals; p++) {
                const pAng = (p / numPetals) * Math.PI * 2;
                const pet = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), petalMat);
                pet.scale.set(0.7, 0.25, 1.3);
                pet.position.set(Math.cos(pAng) * 0.12, 0, Math.sin(pAng) * 0.12);
                pet.rotation.y = -pAng;
                blossom.add(pet);
            }

            fl.add(blossom);
            cluster.add(fl);
        }

        return cluster;
    },

    createProceduralGhibliTree(height = 5.0, foliageColor = 0x4ade80) {
        const tree = new THREE.Group();
        tree.name = "GhibliTree";

        const trunkMat = this.createToonMaterial(0x78350f, 3);
        const foliageMat = this.createToonMaterial(foliageColor, 3);
        const foliageMatLight = this.createToonMaterial(foliageColor, 3);

        const trunkHeight = height * 0.55;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, trunkHeight, 10), trunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);

        // Organic Root Flares
        for (let r = 0; r < 3; r++) {
            const rootAngle = (r / 3) * Math.PI * 2;
            const rootMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 0.8, 6), trunkMat);
            rootMesh.position.set(Math.cos(rootAngle) * 0.45, 0.3, Math.sin(rootAngle) * 0.45);
            rootMesh.rotation.z = Math.cos(rootAngle) * 0.4;
            rootMesh.rotation.x = Math.sin(rootAngle) * 0.4;
            tree.add(rootMesh);
        }

        // Billowy cloud foliage masses
        const cloudOffsets = [
            [0, trunkHeight + 0.9, 0, 1.8],
            [-0.9, trunkHeight + 0.5, 0.5, 1.4],
            [0.85, trunkHeight + 0.6, -0.4, 1.35],
            [0.2, trunkHeight + 1.8, 0.3, 1.25],
            [-0.4, trunkHeight + 1.4, -0.7, 1.15]
        ];

        cloudOffsets.forEach(([ox, oy, oz, rad], idx) => {
            const mat = (idx % 2 === 0) ? foliageMat : foliageMatLight;
            const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 1), mat);
            puff.position.set(ox, oy, oz);
            puff.castShadow = true;
            puff.receiveShadow = true;
            tree.add(puff);
        });

        return tree;
    },

    createProceduralPineTree(height = 5.5) {
        const pine = new THREE.Group();
        pine.name = "GhibliPine";

        const trunkMat = this.createToonMaterial(0x573a24, 3);
        const pineMat1 = this.createToonMaterial(0x065f46, 3);
        const pineMat2 = this.createToonMaterial(0x047857, 3);
        const pineMat3 = this.createToonMaterial(0x10b981, 3);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, height * 0.4, 8), trunkMat);
        trunk.position.y = (height * 0.4) / 2;
        trunk.castShadow = true;
        pine.add(trunk);

        // 3 Layered Evergreen Cones
        const tiers = [
            { y: height * 0.38, r: 2.1, h: 2.0, mat: pineMat1 },
            { y: height * 0.58, r: 1.6, h: 1.8, mat: pineMat2 },
            { y: height * 0.78, r: 1.1, h: 1.5, mat: pineMat3 }
        ];

        tiers.forEach(t => {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 10), t.mat);
            cone.position.y = t.y;
            cone.castShadow = true;
            cone.receiveShadow = true;
            pine.add(cone);
        });

        return pine;
    },

    createMiniCupcake() {
        const group = new THREE.Group();
        group.name = "MiniCupcake";

        const cupMat = this.createToonMaterial(0x38bdf8, 3);
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.4, 12), cupMat);
        cup.position.y = 0.2;

        const creamMat = this.createToonMaterial(0xfef08a, 3);
        const cream = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), creamMat);
        cream.position.y = 0.45;

        const cherryMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), cherryMat);
        cherry.position.y = 0.85;

        group.add(cup, cream, cherry);
        return group;
    },

    createCollectibleNote(noteIdx = 0) {
        const group = new THREE.Group();
        group.name = "CollectibleNote_" + noteIdx;

        const goldMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), goldMat);
        head.scale.set(1.2, 0.8, 0.6);
        head.rotation.z = 0.35;

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), goldMat);
        stem.position.set(0.26, 0.45, 0);

        const flag = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 12, Math.PI / 1.5), goldMat);
        flag.position.set(0.38, 0.78, 0);
        flag.rotation.z = Math.PI / 1.2;

        const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.35 });
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), haloMat);

        group.add(head, stem, flag, halo);
        return {
            root: group,
            halo: halo,
            noteIdx: noteIdx
        };
    },

    createBouncyMushroom(x, z) {
        const group = new THREE.Group();
        group.name = "BouncyMushroom";
        group.position.set(x, 0, z);

        const stemMat = this.createToonMaterial(0xffedd5, 3);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.2, 12), stemMat);
        stem.position.y = 0.6;

        const capMat = this.createToonMaterial(0xef4444, 3);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(1.4, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
        cap.position.y = 1.15;

        const spotMat = this.createToonMaterial(0xffffff, 3);
        [0, 1.2, 2.4, 3.6, 4.8].forEach(ang => {
            const spot = new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), spotMat);
            spot.position.set(Math.cos(ang) * 0.9, 1.75, Math.sin(ang) * 0.9);
            spot.lookAt(Math.cos(ang) * 2, 2.5, Math.sin(ang) * 2);
            group.add(spot);
        });

        group.add(stem, cap);
        return {
            root: group,
            cap: cap,
            position: new THREE.Vector3(x, 0, z)
        };
    },

    createCherryBlossomCrown() {
        const group = new THREE.Group();
        group.name = "SakuraCrown";

        const vineMat = this.createToonMaterial(0x15803d, 3);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 8, 20), vineMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const flowerMat = this.createToonMaterial(0xf472b6, 3);
        for (let i = 0; i < 7; i++) {
            const ang = (i / 7) * Math.PI * 2;
            const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), flowerMat);
            flower.position.set(Math.cos(ang) * 0.72, 0.04, Math.sin(ang) * 0.72);
            group.add(flower);
        }
        return group;
    },

    createCrystalMusicBox() {
        const group = new THREE.Group();
        group.name = "CrystalMusicBox";

        const crystalMat = new THREE.MeshPhysicalMaterial({
            color: 0xe0e7ff,
            transparent: true,
            opacity: 0.75,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0
        });

        const goldMat = this.createToonMaterial(0xf59e0b, 3);

        const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.8), crystalMat);
        base.position.y = 0.4;

        const lid = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.35, 1.85), crystalMat);
        lid.position.set(0, 0.95, -0.9);
        lid.rotation.x = -Math.PI / 3;

        const heartPillow = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 14), this.createToonMaterial(0xf472b6, 3));
        heartPillow.scale.set(1.2, 0.4, 0.9);
        heartPillow.position.set(0, 0.55, 0);

        const clefCharm = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 12), goldMat);
        clefCharm.position.set(0, 0.9, 0);

        group.add(base, lid, heartPillow, clefCharm);
        return {
            root: group,
            lid: lid,
            clefCharm: clefCharm
        };
    },

    // =========================================================================
    // 8. MIXTAPE EVOLUTION ELEMENTS: FLIGHT, COMPANION ACCESSORIES & WONDER
    // =========================================================================

    // Wagasa / Ghibli Style Celestial Glider Parasol for Ana Gleice
    createGliderParasol() {
        const parasolGroup = new THREE.Group();
        parasolGroup.name = "GliderParasol";
        parasolGroup.position.set(0, -0.62, 0);

        const goldMat = this.createToonMaterial(0xfbbf24, 3);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), goldMat);
        shaft.position.y = 1.25;
        parasolGroup.add(shaft);

        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 12, Math.PI), goldMat);
        handle.position.set(-0.12, 0.05, 0);
        handle.rotation.z = Math.PI;
        parasolGroup.add(handle);

        // Canopy: soft pastel lavender/pink with gold ribbing and star finial
        const canopyMat = this.createToonMaterial(0xf472b6, 3, { transparent: true, opacity: 0.95 });
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.65, 16, 1, true), canopyMat);
        canopy.position.y = 2.45;
        canopy.rotation.x = Math.PI;
        parasolGroup.add(canopy);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.045, 8, 24), goldMat);
        rim.position.y = 2.15;
        rim.rotation.x = Math.PI / 2;
        parasolGroup.add(rim);

        const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const tipStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), starMat);
        tipStar.position.y = 2.85;
        parasolGroup.add(tipStar);

        // Point upward when arm is held high
        parasolGroup.rotation.x = Math.PI;
        parasolGroup.visible = false;
        return parasolGroup;
    },

    // Whimsical Flying Balloon for Toadbigode Companion
    createToadBalloon() {
        const balloonGroup = new THREE.Group();
        balloonGroup.name = "ToadBalloon";
        balloonGroup.position.set(0, 3.2, 0);

        const balloonMat = this.createToonMaterial(0xfef08a, 3);
        const stripeMat = this.createToonMaterial(0xf472b6, 3);
        const balloon = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 18), balloonMat);
        balloon.scale.set(1.0, 1.3, 1.0);
        balloonGroup.add(balloon);

        const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 20), stripeMat);
        stripe.rotation.x = Math.PI / 2;
        balloonGroup.add(stripe);

        // Mini wooden basket
        const woodMat = this.createToonMaterial(0x92400e, 3);
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.45, 8), woodMat);
        basket.position.y = -1.4;
        balloonGroup.add(basket);

        // Whimsical mini toy propeller on top
        const propMat = this.createToonMaterial(0x38bdf8, 3);
        const prop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.16), propMat);
        prop.position.y = 1.6;
        balloonGroup.add(prop);
        balloonGroup.propeller = prop;

        balloonGroup.visible = false;
        return balloonGroup;
    },

    // Thermal Updraft Geysers (Spiraling wind currents that lift Ana into flight)
    createUpdraftGeysers(scene, positions = [], particleType = 'petals') {
        const geysers = [];
        const geyserGroup = new THREE.Group();
        geyserGroup.name = "UpdraftGeysers";

        positions.forEach((pos, idx) => {
            const g = new THREE.Group();
            g.position.set(pos[0], pos[1], pos[2]);

            // Translucent glowing wind column
            const columnMat = new THREE.MeshBasicMaterial({
                color: particleType === 'stars' ? 0x93c5fd : 0xfbcfe8,
                transparent: true,
                opacity: 0.22,
                wireframe: true,
                side: THREE.DoubleSide
            });
            const column = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.8, 16, 12, 4, true), columnMat);
            column.position.y = 8;
            g.add(column);

            // Ground ring
            const ringMat = new THREE.MeshBasicMaterial({
                color: particleType === 'stars' ? 0x60a5fa : 0xf472b6,
                transparent: true,
                opacity: 0.5
            });
            const groundRing = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.5, 24), ringMat);
            groundRing.rotation.x = -Math.PI / 2;
            groundRing.position.y = 0.08;
            g.add(groundRing);

            // Swirling particles
            const pCount = 20;
            const pMeshes = [];
            const pMat = new THREE.MeshBasicMaterial({
                color: particleType === 'stars' ? 0xfef08a : 0xfbcfe8
            });

            for (let i = 0; i < pCount; i++) {
                const pGeo = particleType === 'stars' ? new THREE.OctahedronGeometry(0.12, 0) : new THREE.CircleGeometry(0.14, 6);
                const p = new THREE.Mesh(pGeo, pMat);
                p.userData = {
                    angle: (i / pCount) * Math.PI * 2,
                    height: Math.random() * 14,
                    speed: 2.5 + Math.random() * 1.5,
                    radius: 0.8 + Math.random() * 1.4
                };
                g.add(p);
                pMeshes.push(p);
            }

            geyserGroup.add(g);
            geysers.push({
                group: g,
                column: column,
                particles: pMeshes,
                position: new THREE.Vector3(pos[0], pos[1], pos[2]),
                radius: 2.8,
                height: 16
            });
        });

        scene.add(geyserGroup);
        return geysers;
    },

    // Celestial Melody Rings (Glide through to compose musical chords and boost speed)
    createMelodyRings(scene, positions = []) {
        const rings = [];
        const ringsGroup = new THREE.Group();
        ringsGroup.name = "MelodyRings";

        const ringMat = new THREE.MeshToonMaterial({ color: 0xfbbf24 });
        const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

        positions.forEach((pos, idx) => {
            const r = new THREE.Group();
            r.position.set(pos[0], pos[1], pos[2]);

            // Golden Torus
            const torus = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 8, 24), ringMat);
            r.add(torus);

            // 4 mini star nodes on ring
            for (let i = 0; i < 4; i++) {
                const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), starMat);
                const a = (i / 4) * Math.PI * 2;
                star.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0);
                r.add(star);
            }

            ringsGroup.add(r);
            rings.push({
                group: r,
                torus: torus,
                position: new THREE.Vector3(pos[0], pos[1], pos[2]),
                radius: 2.4,
                ringIndex: idx,
                collected: false
            });
        });

        scene.add(ringsGroup);
        return rings;
    },

    // Animal Crossing Stylized Orange Tree (with plump oranges and leaves - from Image 2)
    createAnimalCrossingOrangeTree(x, z, scale = 1.0) {
        const treeGroup = new THREE.Group();
        treeGroup.name = "ACOrangeTree";
        treeGroup.position.set(x, 0, z);
        treeGroup.scale.set(scale, scale, scale);

        const trunkMat = this.createToonMaterial(0x92400e, 3);
        const foliageMat = this.createToonMaterial(0x16a34a, 3);
        const orangeMat = this.createToonMaterial(0xf97316, 3);
        const calyxMat = this.createToonMaterial(0x15803d, 3);

        // Chunky stylized trunk
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 3.2, 10), trunkMat);
        trunk.position.y = 1.6;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Multi-tier fluffy canopy (Animal Crossing round canopy)
        const crownCenter = new THREE.Mesh(new THREE.SphereGeometry(2.3, 16, 16), foliageMat);
        crownCenter.position.y = 4.2;
        crownCenter.castShadow = true;

        const crownL = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), foliageMat);
        crownL.position.set(-1.4, 3.8, 0.2);
        crownL.castShadow = true;

        const crownR = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), foliageMat);
        crownR.position.set(1.4, 3.8, -0.2);
        crownR.castShadow = true;

        const crownTop = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 12), foliageMat);
        crownTop.position.set(0, 5.2, 0);
        crownTop.castShadow = true;

        treeGroup.add(crownCenter, crownL, crownR, crownTop);

        // Plump hanging oranges with calyx leaves (Image 2 signature!)
        const orangePositions = [
            [-1.1, 3.6, 1.4],
            [1.2, 3.5, 1.3],
            [0, 3.9, 2.0],
            [-1.4, 4.4, 0.8],
            [1.3, 4.3, 0.9],
            [-0.7, 3.2, -1.5],
            [0.8, 3.4, -1.4]
        ];

        orangePositions.forEach(([ox, oy, oz]) => {
            const orange = new THREE.Group();
            orange.position.set(ox, oy, oz);

            const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), orangeMat);
            fruit.castShadow = true;

            // Green leaf calyx atop orange
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), calyxMat);
            leaf.position.y = 0.35;
            leaf.rotation.z = 0.4;

            orange.add(fruit, leaf);
            treeGroup.add(orange);
        });

        return treeGroup;
    },

    // Scenic Overlook Benches (Animal Crossing Dark-Green Iron Garden Bench - Image 2)
    createScenicBenches(scene, positions = []) {
        const benches = [];
        const benchGroup = new THREE.Group();
        benchGroup.name = "ScenicBenches";

        const ironMat = this.createToonMaterial(0x14532d, 3); // Animal Crossing dark green iron (Image 2)
        const railMat = this.createToonMaterial(0x166534, 3);
        const legMat = this.createToonMaterial(0x0f3d1f, 3);

        positions.forEach((pos) => {
            const b = new THREE.Group();
            b.position.set(pos[0], pos[1], pos[2]);
            if (pos[3]) b.rotation.y = pos[3];

            // Bench Slatted Seat (dark green iron slats)
            const seat = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.7), ironMat);
            seat.position.y = 0.55;
            seat.castShadow = true;

            // Slatted Backrest with decorative top rail
            const back = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.54, 0.1), ironMat);
            back.position.set(0, 0.98, -0.28);
            back.castShadow = true;

            const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.35, 10), railMat);
            topRail.rotation.z = Math.PI / 2;
            topRail.position.set(0, 1.25, -0.28);

            // Curved Iron Armrests (Image 2)
            [-1.1, 1.1].forEach(ax => {
                const armrest = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 6, 14, Math.PI), legMat);
                armrest.position.set(ax, 0.75, 0.02);
                armrest.rotation.y = Math.PI / 2;
                armrest.rotation.z = -Math.PI / 2;
                b.add(armrest);
            });

            // Ornate Iron Scroll Legs
            [-0.95, 0.95].forEach(lx => {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.65), legMat);
                leg.position.set(lx, 0.28, 0);
                b.add(leg);
            });

            b.add(seat, back, topRail);
            benchGroup.add(b);

            // Animal Crossing Orange Tree beside the bench (Image 2 scene reproduction!)
            const orangeTree = this.createAnimalCrossingOrangeTree(pos[0] - 2.8, pos[2] - 1.5, 0.9);
            scene.add(orangeTree);

            benches.push({
                group: b,
                position: new THREE.Vector3(pos[0], pos[1], pos[2]),
                sitPosition: new THREE.Vector3(pos[0], pos[1] + 0.6, pos[2])
            });
        });

        scene.add(benchGroup);
        return benches;
    },

    // Lantern Station in Stage 3 for Wish Release
    createLanternStation(scene, position = [4.5, 0, 7.5]) {
        const station = new THREE.Group();
        station.name = "LanternStation";
        station.position.set(position[0], position[1], position[2]);

        const woodMat = this.createToonMaterial(0x92400e, 3);
        const paperMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

        // Basket table
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.8, 0.75, 12), woodMat);
        table.position.y = 0.38;
        station.add(table);

        // Display paper lanterns on table
        [-0.3, 0.3].forEach((lx, idx) => {
            const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.38, 8), paperMat);
            lantern.position.set(lx, 0.95, (idx === 0 ? 0.1 : -0.1));
            station.add(lantern);
        });

        scene.add(station);
        return {
            group: station,
            position: new THREE.Vector3(position[0], position[1], position[2])
        };
    },

    // Spawn a Floating Sky Lantern that drifts upward to the moon
    spawnSkyLantern(scene, startPos) {
        const lantern = new THREE.Group();
        lantern.position.copy(startPos);

        const paperMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.6, 8), paperMat);
        core.position.y = 0.3;

        const rimMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 12), rimMat);
        rim.position.y = 0.05;
        rim.rotation.x = Math.PI / 2;

        lantern.add(core, rim);
        lantern.userData = {
            vy: 1.8 + Math.random() * 0.5,
            driftX: (Math.random() - 0.5) * 0.4,
            driftZ: (Math.random() - 0.5) * 0.4,
            life: 0,
            maxLife: 20
        };

        scene.add(lantern);
        return lantern;
    },

    createStoneLantern(x, z) {
        const lantern = new THREE.Group();
        lantern.name = "StoneLantern";
        lantern.position.set(x, 0, z);
        const stoneMat = this.createToonMaterial(0x94a3b8, 3);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

        // Base & pedestal
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.2, 8), stoneMat);
        base.position.y = 0.1;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.75, 8), stoneMat);
        post.position.y = 0.55;
        const middle = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.15, 8), stoneMat);
        middle.position.y = 0.98;

        // Light chamber with warm amber glow
        const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.35, 0.34), glowMat);
        chamber.position.y = 1.22;

        // Pagoda roof
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.32, 4), stoneMat);
        roof.position.y = 1.54;
        roof.rotation.y = Math.PI / 4;

        const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), glowMat);
        jewel.position.y = 1.74;

        lantern.add(base, post, middle, chamber, roof, jewel);
        return lantern;
    },

    createCrystalStarPlatform(x, y, z, size = 1.2) {
        const plat = new THREE.Group();
        plat.name = "CrystalPlatform";
        plat.position.set(x, y, z);
        const crystalMat = this.createToonMaterial(0x93c5fd, 3, { transparent: true, opacity: 0.85 });
        const star = new THREE.Mesh(new THREE.CylinderGeometry(size, size * 1.1, 0.25, 5), crystalMat);
        star.rotation.y = Math.PI / 10;

        const glowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const edge = new THREE.Mesh(new THREE.TorusGeometry(size, 0.04, 6, 5), glowMat);
        edge.rotation.x = Math.PI / 2;
        edge.rotation.z = Math.PI / 10;

        plat.add(star, edge);
        return plat;
    },

    createHangingLantern(x, y, z) {
        const lantern = new THREE.Group();
        lantern.name = "HangingLantern";
        lantern.position.set(x, y, z);

        const paperMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), paperMat);
        body.scale.set(1.0, 1.25, 1.0);

        const cordMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), cordMat);
        cord.position.y = 0.55;

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 8), cordMat);
        cap.position.y = 0.36;

        const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.25, 6), cordMat);
        tassel.position.y = -0.48;

        lantern.add(body, cord, cap, tassel);
        return lantern;
    }
};

window.Models = Models;





// Preload all real 3D models immediately into cache
if (typeof window !== 'undefined') {
    setTimeout(() => {
        if (typeof Models !== 'undefined' && Models.loadGLTF) {
            Models.loadGLTF('assets/models/ana_model.glb');
            Models.loadGLTF('assets/models/Toadsworth.glb');
            Models.loadGLTF('assets/models/davi_model.glb');
            Models.loadGLTF('assets/models/Field_Of_Flowers.glb');
            Models.loadGLTF('assets/models/Flower_Pack_Available_in_Fab.glb');
            Models.loadGLTF('assets/models/PSX_-_5_Skybox_Pack_I.glb');
        }
    }, 50);
}
