// =========================================================================
// A Sinfonia de Ana Gleice — Pure 2D Canvas Storybook RPG Engine
// 60 FPS Fixed-Timestep Loop • HiDPI Auto-Scaling • Lerp Camera • Zelda Transitions
// Uniform Grid Spatial Hashing • Y-Sorted Depth Pipeline • Paper Cutout Chibi Aesthetics
// =========================================================================

(function(window) {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. Lightweight Math & Compatibility Shims
    // -------------------------------------------------------------------------
    class Vec2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        set(x, y) { this.x = x; this.y = y; return this; }
        copy(v) { this.x = v.x; this.y = v.y; return this; }
        clone() { return new Vec2(this.x, this.y); }
        add(v) { this.x += v.x; this.y += v.y; return this; }
        sub(v) { this.x -= v.x; this.y -= v.y; return this; }
        multiplyScalar(s) { this.x *= s; this.y *= s; return this; }
        length() { return Math.hypot(this.x, this.y); }
        lengthSq() { return this.x * this.x + this.y * this.y; }
        distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
        normalize() {
            const len = this.length();
            if (len > 0.00001) { this.x /= len; this.y /= len; }
            return this;
        }
    }

    class MockVector3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        set(x, y, z = 0) { this.x = x; this.y = y; this.z = z; return this; }
        copy(v) { this.x = v.x; this.y = v.y; this.z = v.z !== undefined ? v.z : 0; return this; }
        clone() { return new MockVector3(this.x, this.y, this.z); }
        add(v) { this.x += v.x; this.y += v.y; this.z += (v.z || 0); return this; }
        sub(v) { this.x -= v.x; this.y -= v.y; this.z -= (v.z || 0); return this; }
        multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
        length() { return Math.hypot(this.x, this.y, this.z); }
        lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
        distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - (v.z || 0)); }
        normalize() {
            const l = this.length();
            if (l > 0.00001) { this.x /= l; this.y /= l; this.z /= l; }
            return this;
        }
        lerp(target, alpha) {
            this.x += (target.x - this.x) * alpha;
            this.y += (target.y - this.y) * alpha;
            this.z += ((target.z || 0) - this.z) * alpha;
            return this;
        }
    }

    // Safety shim for THREE in case legacy test assertions or hooks inspect it
    if (typeof window.THREE === 'undefined') {
        window.THREE = {
            Vector2: Vec2,
            Vector3: MockVector3,
            Color: class { constructor(hex = 0) { this.hex = hex; } setHex(h) { this.hex = h; } },
            Box3: class {
                setFromObject() { return this; }
                getSize(v) { return v ? v.set(1, 1, 1) : new MockVector3(1, 1, 1); }
            },
            MathUtils: {
                lerp: (a, b, t) => a + (b - a) * t,
                clamp: (v, min, max) => Math.max(min, Math.min(max, v))
            }
        };
    }

    // -------------------------------------------------------------------------
    // 2. Camera2D System with Exponential Lerp, Deadzone & Zelda Transitions
    // -------------------------------------------------------------------------
    class Camera2D {
        constructor(viewportW = 1280, viewportH = 720) {
            this.viewportW = viewportW;
            this.viewportH = viewportH;
            this.x = 0;
            this.y = 0;
            this.targetX = 0;
            this.targetY = 0;
            this.smoothSpeed = 5.5;
            this.deadzone = { x: 32, y: 24 };
            this.bounds = { minX: 0, minY: 0, maxX: 1920, maxY: 1080 };
            this.shakeTimer = 0;
            this.shakeIntensity = 0;
            this.zoom = 1.0;

            // Room sliding offset
            this.slideOffset = { x: 0, y: 0 };
        }

        setBounds(minX, minY, maxX, maxY) {
            this.bounds = { minX, minY, maxX, maxY };
        }

        setViewport(w, h) {
            this.viewportW = w;
            this.viewportH = h;
        }

        follow(targetX, targetY, dt, immediate = false) {
            const centerX = this.x + this.viewportW / 2;
            const centerY = this.y + this.viewportH / 2;
            const dx = targetX - centerX;
            const dy = targetY - centerY;

            let desiredX = this.x;
            let desiredY = this.y;

            if (Math.abs(dx) > this.deadzone.x) {
                desiredX = targetX - this.viewportW / 2 - Math.sign(dx) * this.deadzone.x;
            }
            if (Math.abs(dy) > this.deadzone.y) {
                desiredY = targetY - this.viewportH / 2 - Math.sign(dy) * this.deadzone.y;
            }

            if (immediate) {
                this.x = desiredX;
                this.y = desiredY;
            } else {
                const factor = 1 - Math.exp(-this.smoothSpeed * dt);
                this.x += (desiredX - this.x) * factor;
                this.y += (desiredY - this.y) * factor;
            }

            // World clamping
            const maxClampX = Math.max(this.bounds.minX, this.bounds.maxX - this.viewportW);
            const maxClampY = Math.max(this.bounds.minY, this.bounds.maxY - this.viewportH);
            this.x = Math.max(this.bounds.minX, Math.min(maxClampX, this.x));
            this.y = Math.max(this.bounds.minY, Math.min(maxClampY, this.y));

            // Screen shake
            if (this.shakeTimer > 0) {
                this.shakeTimer -= dt;
                const ratio = Math.max(0, this.shakeTimer / 0.35);
                const currentAmp = this.shakeIntensity * ratio;
                this.x += (Math.random() - 0.5) * currentAmp * 2;
                this.y += (Math.random() - 0.5) * currentAmp * 2;
            }
        }

        triggerShake(intensity = 6, duration = 0.35) {
            this.shakeIntensity = intensity;
            this.shakeTimer = duration;
        }

        worldToScreen(wx, wy) {
            return {
                x: wx - this.x + this.slideOffset.x,
                y: wy - this.y + this.slideOffset.y
            };
        }

        screenToWorld(sx, sy) {
            return {
                x: sx + this.x - this.slideOffset.x,
                y: sy + this.y - this.slideOffset.y
            };
        }
    }

    // -------------------------------------------------------------------------
    // 3. Spatial Hash 2D Collision System
    // -------------------------------------------------------------------------
    class SpatialHashCollision2D {
        constructor(cellSize = 128) {
            this.cellSize = cellSize;
            this.cells = new Map();
            this.solids = [];
            this.triggers = [];
        }

        clear() {
            this.cells.clear();
            this.solids = [];
            this.triggers = [];
        }

        _hash(cx, cy) {
            return `${cx},${cy}`;
        }

        _getBounds(item) {
            if (item.type === 'circle') {
                return {
                    minX: item.x - item.radius,
                    minY: item.y - item.radius,
                    maxX: item.x + item.radius,
                    maxY: item.y + item.radius
                };
            } else if (item.type === 'aabb') {
                return {
                    minX: item.x,
                    minY: item.y,
                    maxX: item.x + item.w,
                    maxY: item.y + item.h
                };
            }
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }

        insert(item) {
            if (item.isTrigger) {
                this.triggers.push(item);
                return;
            }
            this.solids.push(item);
            const b = this._getBounds(item);
            const minCX = Math.floor(b.minX / this.cellSize);
            const maxCX = Math.floor(b.maxX / this.cellSize);
            const minCY = Math.floor(b.minY / this.cellSize);
            const maxCY = Math.floor(b.maxY / this.cellSize);

            for (let cx = minCX; cx <= maxCX; cx++) {
                for (let cy = minCY; cy <= maxCY; cy++) {
                    const key = this._hash(cx, cy);
                    let bucket = this.cells.get(key);
                    if (!bucket) {
                        bucket = [];
                        this.cells.set(key, bucket);
                    }
                    bucket.push(item);
                }
            }
        }

        queryPotentialSolids(circle) {
            const minCX = Math.floor((circle.x - circle.radius) / this.cellSize);
            const maxCX = Math.floor((circle.x + circle.radius) / this.cellSize);
            const minCY = Math.floor((circle.y - circle.radius) / this.cellSize);
            const maxCY = Math.floor((circle.y + circle.radius) / this.cellSize);

            const result = new Set();
            for (let cx = minCX; cx <= maxCX; cx++) {
                for (let cy = minCY; cy <= maxCY; cy++) {
                    const bucket = this.cells.get(this._hash(cx, cy));
                    if (bucket) {
                        for (let item of bucket) result.add(item);
                    }
                }
            }
            return result;
        }

        resolveCircleVsCircle(c1, c2) {
            const dx = c1.x - c2.x;
            const dy = c1.y - c2.y;
            const minDist = c1.radius + c2.radius;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDist * minDist && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                return { nx: dx / dist, ny: dy / dist, overlap };
            }
            return null;
        }

        resolveCircleVsAABB(circle, box) {
            const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.w));
            const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.h));

            const dx = circle.x - closestX;
            const dy = circle.y - closestY;
            const distSq = dx * dx + dy * dy;

            if (distSq < circle.radius * circle.radius && distSq > 0.00001) {
                const dist = Math.sqrt(distSq);
                const overlap = circle.radius - dist;
                return { nx: dx / dist, ny: dy / dist, overlap };
            }
            return null;
        }

        // Resolves entity movement on separated X and Y axes for smooth sliding
        moveAndSlide(entity, vx, vy, dt) {
            // 1. Move X axis
            entity.x += vx * dt;
            const circle = { x: entity.x, y: entity.y + (entity.footOffsetY || 0), radius: entity.radius || 16 };
            let candidates = this.queryPotentialSolids(circle);
            for (const solid of candidates) {
                if (solid === entity) continue;
                let col = null;
                if (solid.type === 'circle') {
                    col = this.resolveCircleVsCircle(circle, solid);
                } else if (solid.type === 'aabb') {
                    col = this.resolveCircleVsAABB(circle, solid);
                }
                if (col) {
                    entity.x += col.nx * col.overlap;
                    circle.x = entity.x;
                }
            }

            // 2. Move Y axis
            entity.y += vy * dt;
            circle.y = entity.y + (entity.footOffsetY || 0);
            candidates = this.queryPotentialSolids(circle);
            for (const solid of candidates) {
                if (solid === entity) continue;
                let col = null;
                if (solid.type === 'circle') {
                    col = this.resolveCircleVsCircle(circle, solid);
                } else if (solid.type === 'aabb') {
                    col = this.resolveCircleVsAABB(circle, solid);
                }
                if (col) {
                    entity.y += col.ny * col.overlap;
                    circle.y = entity.y + (entity.footOffsetY || 0);
                }
            }

            // Check triggers
            for (let trg of this.triggers) {
                if (trg.active === false) continue;
                const dist = Math.hypot(entity.x - trg.x, entity.y - trg.y);
                if (dist < (entity.radius || 16) + trg.radius) {
                    if (trg.onEnter) trg.onEnter(entity, trg);
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // 4. Particle Systems (Sakura, Butterflies, Stardust, Hearts)
    // -------------------------------------------------------------------------
    class ParticleManager {
        constructor() {
            this.sakuraPetals = [];
            this.butterflies = [];
            this.stardust = [];
            this.hearts = [];
            this.skyLanterns = [];
            this.initSakuraShower(150);
            this.initButterflies(12);
            this.initStardust(45);
        }

        initSakuraShower(count = 150) {
            this.sakuraPetals = [];
            for (let i = 0; i < count; i++) {
                this.sakuraPetals.push({
                    x: Math.random() * 2200,
                    y: Math.random() * 1200 - 200,
                    size: 4.5 + Math.random() * 4.5,
                    speedY: 45 + Math.random() * 40,
                    swaySpeed: 1.5 + Math.random() * 2.0,
                    swayAmp: 25 + Math.random() * 35,
                    angle: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 2.5,
                    color: i % 3 === 0 ? '#fbcfe8' : (i % 3 === 1 ? '#f472b6' : '#fff1f2'),
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        initButterflies(count = 12) {
            this.butterflies = [];
            const colors = ['#fde047', '#38bdf8', '#f472b6', '#a78bfa'];
            for (let i = 0; i < count; i++) {
                this.butterflies.push({
                    baseX: 300 + Math.random() * 1300,
                    baseY: 250 + Math.random() * 600,
                    x: 0,
                    y: 0,
                    flapPhase: Math.random() * 10,
                    flapSpeed: 14 + Math.random() * 8,
                    flightRadius: 35 + Math.random() * 55,
                    flightSpeed: 0.8 + Math.random() * 0.7,
                    color: colors[i % colors.length]
                });
            }
        }

        initStardust(count = 45) {
            this.stardust = [];
            for (let i = 0; i < count; i++) {
                this.stardust.push({
                    x: Math.random() * 2100,
                    y: Math.random() * 1100,
                    radius: 1.2 + Math.random() * 2.4,
                    alpha: 0.2 + Math.random() * 0.8,
                    speedAlpha: 1.5 + Math.random() * 2.5,
                    driftX: (Math.random() - 0.5) * 8,
                    driftY: -6 - Math.random() * 10
                });
            }
        }

        spawnHeartBurst(x, y, count = 10) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 40 + Math.random() * 80;
                this.hearts.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 35,
                    life: 1.0,
                    scale: 0.8 + Math.random() * 0.6,
                    color: Math.random() > 0.3 ? '#f43f5e' : '#ec4899'
                });
            }
        }

        spawnSkyLantern(x, y) {
            const lantern = {
                x, y,
                vy: -32 - Math.random() * 15,
                driftX: (Math.random() - 0.5) * 12,
                wobbleSpeed: 2.0 + Math.random() * 1.5,
                life: 0,
                maxLife: 14.0,
                scale: 1.0
            };
            this.skyLanterns.push(lantern);
            return lantern;
        }

        update(dt, stageId) {
            // Sakura Petals
            if (stageId === 3) {
                for (let p of this.sakuraPetals) {
                    p.phase += dt * p.swaySpeed;
                    p.y += p.speedY * dt;
                    p.x += Math.sin(p.phase) * (p.swayAmp * dt);
                    p.angle += p.rotSpeed * dt;
                    if (p.y > 1150) {
                        p.y = -20;
                        p.x = Math.random() * 2000;
                    }
                }
            }

            // Butterflies
            if (stageId === 1) {
                for (let b of this.butterflies) {
                    b.flapPhase += dt * b.flapSpeed;
                    const t = performance.now() * 0.001 * b.flightSpeed;
                    b.x = b.baseX + Math.cos(t) * b.flightRadius;
                    b.y = b.baseY + Math.sin(t * 1.3) * (b.flightRadius * 0.6);
                }
            }

            // Stardust
            if (stageId === 2) {
                for (let s of this.stardust) {
                    s.x += s.driftX * dt;
                    s.y += s.driftY * dt;
                    s.alpha += Math.sin(performance.now() * 0.003 * s.speedAlpha) * 0.02;
                    s.alpha = Math.max(0.1, Math.min(1.0, s.alpha));
                    if (s.y < 0) s.y = 1080;
                    if (s.x < 0) s.x = 2048;
                    if (s.x > 2048) s.x = 0;
                }
            }

            // Hearts
            for (let i = this.hearts.length - 1; i >= 0; i--) {
                const h = this.hearts[i];
                h.x += h.vx * dt;
                h.y += h.vy * dt;
                h.life -= dt * 1.2;
                if (h.life <= 0) this.hearts.splice(i, 1);
            }

            // Sky lanterns
            for (let i = this.skyLanterns.length - 1; i >= 0; i--) {
                const sl = this.skyLanterns[i];
                sl.life += dt;
                sl.y += sl.vy * dt;
                sl.x += sl.driftX * dt + Math.sin(sl.life * sl.wobbleSpeed) * 0.5;
                if (sl.life > sl.maxLife || sl.y < -100) {
                    this.skyLanterns.splice(i, 1);
                }
            }
        }

        render(ctx, camera, stageId) {
            // Render Butterflies (Stage 1)
            if (stageId === 1) {
                for (let b of this.butterflies) {
                    const sp = camera.worldToScreen(b.x, b.y);
                    if (sp.x < -40 || sp.x > camera.viewportW + 40 || sp.y < -40 || sp.y > camera.viewportH + 40) continue;
                    ctx.save();
                    ctx.translate(sp.x, sp.y);
                    const flap = Math.sin(b.flapPhase);
                    ctx.fillStyle = b.color;
                    ctx.beginPath();
                    ctx.ellipse(-3, 0, Math.abs(flap) * 5 + 1, 4, 0.2, 0, Math.PI * 2);
                    ctx.ellipse(3, 0, Math.abs(flap) * 5 + 1, 4, -0.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Render Stardust (Stage 2)
            if (stageId === 2) {
                for (let s of this.stardust) {
                    const sp = camera.worldToScreen(s.x, s.y);
                    if (sp.x < -10 || sp.x > camera.viewportW + 10 || sp.y < -10 || sp.y > camera.viewportH + 10) continue;
                    ctx.save();
                    ctx.globalAlpha = s.alpha;
                    ctx.fillStyle = '#fef08a';
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(sp.x, sp.y, s.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Render Sakura Petals (Stage 3)
            if (stageId === 3) {
                for (let p of this.sakuraPetals) {
                    const sp = camera.worldToScreen(p.x, p.y);
                    if (sp.x < -20 || sp.x > camera.viewportW + 20 || sp.y < -20 || sp.y > camera.viewportH + 20) continue;
                    ctx.save();
                    ctx.translate(sp.x, sp.y);
                    ctx.rotate(p.angle);
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Render Hearts
            for (let h of this.hearts) {
                const sp = camera.worldToScreen(h.x, h.y);
                ctx.save();
                ctx.globalAlpha = Math.max(0, h.life);
                ctx.translate(sp.x, sp.y);
                ctx.scale(h.scale, h.scale);
                ctx.fillStyle = h.color;
                ctx.font = '16px sans-serif';
                ctx.fillText('❤️', -8, 8);
                ctx.restore();
            }

            // Render Sky Lanterns
            for (let sl of this.skyLanterns) {
                const sp = camera.worldToScreen(sl.x, sl.y);
                ctx.save();
                ctx.translate(sp.x, sp.y);
                ctx.fillStyle = '#fed7aa';
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.roundRect(-12, -18, 24, 30, [4, 4, 8, 8]);
                ctx.fill();
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(-10, 10, 20, 3);
                ctx.restore();
            }
        }
    }

    // -------------------------------------------------------------------------
    // 5. Paper Cutout Chibi Character Renderer (M1 Builtin / M2 Compatible)
    // -------------------------------------------------------------------------
    const CharacterRenderer2D = {
        render(ctx, type, state, x, y, direction = 'down', scale = 1.0) {
            // If external specialized characters2d module is loaded (e.g. from M2), prefer it
            if (window.characters2d && typeof window.characters2d.renderCharacter === 'function') {
                window.characters2d.renderCharacter(ctx, type, state, x, y, direction, 0, scale);
                return;
            }

            ctx.save();
            ctx.translate(Math.round(x), Math.round(y));

            const isFlipped = direction === 'left';
            if (isFlipped) ctx.scale(-1, 1);
            ctx.scale(scale, scale);

            const isMoving = state && state.isMoving;
            const walkTime = (state && state.walkTime) || 0;
            const bobY = isMoving ? Math.abs(Math.sin(walkTime * 14)) * 3.5 : Math.sin(performance.now() * 0.003) * 1.2;
            const tiltAngle = isMoving ? Math.sin(walkTime * 12) * 0.05 : 0;

            // Ground Cardstock Drop Shadow
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
            ctx.beginPath();
            ctx.ellipse(0, 4, 18, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.translate(0, -bobY);
            ctx.rotate(tiltAngle);

            // Cardstock Sticker Paper Cutout Glow / Border
            ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetY = 3;

            if (type === 'ana') {
                this.renderAna(ctx, state, direction);
            } else if (type === 'toadbigode') {
                this.renderToadbigode(ctx, state, direction);
            } else if (type === 'davi') {
                this.renderDavi(ctx, state, direction);
            }

            ctx.restore();

            // Emote balloon if active
            if (state && state.isEmoting && state.emoteType) {
                this.renderEmoteBalloon(ctx, x, y - 65 - bobY, state.emoteType);
            }
        },

        renderAna(ctx, state, direction) {
            // Legs / Shoes
            ctx.fillStyle = '#ffffff'; // White sneakers
            ctx.beginPath();
            ctx.roundRect(-10, -5, 8, 9, 3);
            ctx.roundRect(2, -5, 8, 9, 3);
            ctx.fill();
            ctx.fillStyle = '#d6d3d1'; // Soles
            ctx.fillRect(-10, 2, 8, 2);
            ctx.fillRect(2, 2, 8, 2);

            // Navy Shorts
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(-11, -15, 22, 12, 3);
            ctx.fill();

            // Sailor-Striped Shirt
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-12, -32, 24, 18, [4, 4, 2, 2]);
            ctx.fill();
            ctx.fillStyle = '#1e3a8a'; // Navy horizontal stripes
            ctx.fillRect(-12, -28, 24, 3);
            ctx.fillRect(-12, -22, 24, 3);
            ctx.fillRect(-12, -17, 24, 3);

            // Chibi Head (Peachy Cute)
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(0, -42, 17, 0, Math.PI * 2);
            ctx.fill();

            // Brown Bob / Chanel Hair Back & Sides
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(-14, -40, 7, 0, Math.PI * 2);
            ctx.arc(14, -40, 7, 0, Math.PI * 2);
            ctx.fill();

            // Rosy Blush Cheeks
            ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
            ctx.beginPath();
            ctx.arc(-9, -38, 3.5, 0, Math.PI * 2);
            ctx.arc(9, -38, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Eyes: Large anime dark brown with dual star reflection
            // MANDATORY INVARIANT: STRICTLY WITHOUT GLASSES! ZERO GLASSES!
            ctx.fillStyle = '#3f1f0a';
            ctx.beginPath();
            ctx.ellipse(-7, -43, 2.8, 4.2, 0, 0, Math.PI * 2);
            ctx.ellipse(7, -43, 2.8, 4.2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eye Highlights
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-6.2, -45, 1.2, 0, Math.PI * 2);
            ctx.arc(7.8, -45, 1.2, 0, Math.PI * 2);
            ctx.arc(-7.8, -41.5, 0.7, 0, Math.PI * 2);
            ctx.arc(6.2, -41.5, 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Sweet gentle smile
            ctx.strokeStyle = '#9a3412';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, -37, 3, 0.1, Math.PI - 0.1);
            ctx.stroke();

            // Brown Bob Hair Bangs over forehead
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(0, -48, 16, Math.PI * 0.15, Math.PI * 0.85, true);
            ctx.fill();

            // Straw Hat with Navy Ribbon
            // Brim
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.ellipse(0, -53, 25, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Crown
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(0, -57, 13, Math.PI, 0);
            ctx.fill();

            // Navy Ribbon
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-13, -56, 26, 4.5);
            // Ribbon Bow
            ctx.beginPath();
            ctx.ellipse(11, -54, 4, 3, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Hand holding Radiant Golden Sunflower
            ctx.save();
            ctx.translate(14, -22);
            // Green stem
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.quadraticCurveTo(3, 4, 0, -4);
            ctx.stroke();
            // Golden sunflower petals
            ctx.fillStyle = '#eab308';
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.ellipse(Math.cos(a) * 6, -4 + Math.sin(a) * 6, 4, 2, a, 0, Math.PI * 2);
                ctx.fill();
            }
            // Brown core
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(0, -4, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },

        renderToadbigode(ctx, state, direction) {
            // Brown polished shoes
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(-9, -2, 6, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(9, -2, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // White baggy Toad pants
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.roundRect(-12, -14, 24, 13, 5);
            ctx.fill();

            // Regal Purple Vest with Gold Embroidery
            ctx.fillStyle = '#6b21a8';
            ctx.beginPath();
            ctx.roundRect(-13, -30, 26, 17, [4, 4, 2, 2]);
            ctx.fill();
            // White inner tunic
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-4, -30, 8, 17);
            // Gold trim
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(-13, -30, 26, 17);

            // Chubby Peach Head
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(0, -38, 16, 0, Math.PI * 2);
            ctx.fill();

            // Eyes & Golden Monocle
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(-6, -41, 1.8, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(6, -41, 1.8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Monocle rim on left eye
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(-6, -41, 4.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-2, -40);
            ctx.lineTo(2, -32);
            ctx.stroke();

            // Iconic Bushy White Handlebar Mustache!
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -34);
            ctx.quadraticCurveTo(-8, -38, -16, -32);
            ctx.quadraticCurveTo(-14, -30, -7, -32);
            ctx.quadraticCurveTo(0, -31, 7, -32);
            ctx.quadraticCurveTo(14, -30, 16, -32);
            ctx.quadraticCurveTo(8, -38, 0, -34);
            ctx.fill();
            ctx.stroke();

            // Classic Mushroom Cap (Cream with 5 Brown Spots)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(0, -48, 24, Math.PI * 0.95, Math.PI * 2.05);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Brown mushroom spots
            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.arc(0, -62, 7, 0, Math.PI * 2); // Center top
            ctx.arc(-17, -50, 5.5, 0, Math.PI * 2); // Left
            ctx.arc(17, -50, 5.5, 0, Math.PI * 2); // Right
            ctx.arc(-9, -58, 4.5, 0, Math.PI * 2);
            ctx.arc(9, -58, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Mahogany Walking Cane
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(14, -26);
            ctx.lineTo(17, 2);
            ctx.stroke();
            // Brass Pommel Sphere
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(14, -28, 4, 0, Math.PI * 2);
            ctx.fill();
        },

        renderDavi(ctx, state, direction) {
            // Skate Shoes (Vans style)
            ctx.fillStyle = '#18181b';
            ctx.beginPath();
            ctx.roundRect(-10, -5, 8, 9, 3);
            ctx.roundRect(2, -5, 8, 9, 3);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-10, 2, 8, 2);
            ctx.fillRect(2, 2, 8, 2);

            // Olive Cargo Shorts
            ctx.fillStyle = '#365314';
            ctx.beginPath();
            ctx.roundRect(-12, -17, 24, 13, 3);
            ctx.fill();

            // Cozy Heather Grey Hoodie
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.roundRect(-13, -34, 26, 18, [5, 5, 2, 2]);
            ctx.fill();
            // Kangaroo pocket
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.roundRect(-8, -23, 16, 7, 2);
            ctx.fill();
            // White drawstrings
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-3, -31); ctx.lineTo(-3, -24);
            ctx.moveTo(3, -31); ctx.lineTo(3, -24);
            ctx.stroke();

            // Cute Face
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(0, -43, 16, 0, Math.PI * 2);
            ctx.fill();

            // Rosy cheeks
            ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
            ctx.beginPath();
            ctx.arc(-8, -39, 3, 0, Math.PI * 2);
            ctx.arc(8, -39, 3, 0, Math.PI * 2);
            ctx.fill();

            // Friendly smile
            ctx.strokeStyle = '#9a3412';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(0, -38, 3.5, 0.1, Math.PI - 0.1);
            ctx.stroke();

            // Modern Black Glasses over caring eyes
            ctx.strokeStyle = '#09090b';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(-11, -47, 8, 7);
            ctx.strokeRect(3, -47, 8, 7);
            ctx.beginPath();
            ctx.moveTo(-3, -44); ctx.lineTo(3, -44);
            ctx.stroke();
            // Friendly dark eyes
            ctx.fillStyle = '#18181b';
            ctx.beginPath();
            ctx.arc(-7, -44, 1.8, 0, Math.PI * 2);
            ctx.arc(7, -44, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Dark Wavy Hair Volume
            ctx.fillStyle = '#18181b';
            ctx.beginPath();
            ctx.arc(0, -51, 16, Math.PI * 0.8, Math.PI * 2.2);
            ctx.arc(-13, -47, 6, 0, Math.PI * 2);
            ctx.arc(13, -47, 6, 0, Math.PI * 2);
            ctx.arc(-7, -54, 7, 0, Math.PI * 2);
            ctx.arc(6, -54, 7, 0, Math.PI * 2);
            ctx.fill();

            // Skateboard resting at his side
            ctx.save();
            ctx.translate(16, -10);
            ctx.rotate(0.2);
            // Maple deck
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(-4, -18, 8, 32, 4);
            ctx.fill();
            // Black grip tape
            ctx.fillStyle = '#27272a';
            ctx.roundRect(-3, -16, 6, 28, 3);
            ctx.fill();
            // Turquoise wheels
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(-5, -12, 2.5, 0, Math.PI * 2);
            ctx.arc(-5, 8, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },

        renderEmoteBalloon(ctx, x, y, type) {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.roundRect(-16, -16, 32, 24, 8);
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(-4, 8);
            ctx.lineTo(0, 14);
            ctx.lineTo(4, 8);
            ctx.fill();

            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let icon = '🌸';
            if (type === 1) icon = '🌸';
            else if (type === 2) icon = '🎼';
            else if (type === 3) icon = '🪑';
            else if (type === 4) icon = '✨';
            else if (type === 'heart') icon = '❤️';
            ctx.fillText(icon, 0, -4);
            ctx.restore();
        }
    };

    // -------------------------------------------------------------------------
    // 6. Storybook Stages Implementation (Bosque, Desfiladeiro, Palácio)
    // -------------------------------------------------------------------------
    class StageBosque {
        constructor(engine) {
            this.engine = engine;
            this.id = 1;
            this.width = 1920;
            this.height = 1080;
            this.altar = { x: 960, y: 380, radius: 55, active: false };
            this.notes = [
                { id: 0, name: 'Dó', freq: 261.63, x: 320, y: 480, collected: false },
                { id: 1, name: 'Mi', freq: 329.63, x: 1600, y: 520, collected: false },
                { id: 2, name: 'Sol', freq: 392.00, x: 640, y: 840, collected: false },
                { id: 3, name: 'Si', freq: 493.88, x: 1420, y: 820, collected: false }
            ];
            this.trees = [];
            this.flowerbeds = [];
            this.initDecorations();
        }

        initDecorations() {
            // Distinct watercolor trees
            const treePositions = [
                { x: 140, y: 180, r: 38 }, { x: 380, y: 160, r: 35 }, { x: 620, y: 140, r: 36 },
                { x: 1300, y: 150, r: 38 }, { x: 1560, y: 170, r: 35 }, { x: 1780, y: 190, r: 40 },
                { x: 160, y: 920, r: 36 }, { x: 380, y: 940, r: 38 }, { x: 960, y: 960, r: 36 },
                { x: 1620, y: 940, r: 38 }, { x: 1800, y: 920, r: 40 }
            ];
            for (let t of treePositions) {
                this.trees.push(t);
                this.engine.collision.insert({ type: 'circle', x: t.x, y: t.y + 15, radius: t.r * 0.65, isStatic: true });
            }

            // Outer perimeter walls
            this.engine.collision.insert({ type: 'aabb', x: 0, y: 0, w: this.width, h: 40, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: 0, y: this.height - 40, w: this.width, h: 40, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: 0, y: 0, w: 40, h: this.height, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: this.width - 40, y: 0, w: 40, h: this.height, isStatic: true });

            // Altar solid base collider
            this.engine.collision.insert({ type: 'circle', x: this.altar.x, y: this.altar.y, radius: this.altar.radius, isStatic: true, tag: 'altar' });
        }

        update(dt) {
            const player = this.engine.player;
            const time = performance.now() * 0.001;

            // Collect Notes
            for (let note of this.notes) {
                if (!note.collected) {
                    const dist = Math.hypot(player.x - note.x, player.y - note.y);
                    if (dist < 42) {
                        note.collected = true;
                        this.engine.collectedNotesCount++;
                        if (window.musicEngine) {
                            window.musicEngine.playNotePickup ? window.musicEngine.playNotePickup(note.id) : window.musicEngine.playAcousticPiano(note.freq, 1.8, 0.7);
                        }
                        this.engine.particles.spawnHeartBurst(note.x, note.y, 8);
                    }
                }
            }

            // Check Harp Altar activation
            const distAltar = Math.hypot(player.x - this.altar.x, player.y - this.altar.y);
            if (distAltar < 85 && !this.altar.active) {
                const allNotes = this.notes.every(n => n.collected);
                if (allNotes) {
                    this.altar.active = true;
                    if (window.musicEngine) {
                        window.musicEngine.playHarpArpeggio ? window.musicEngine.playHarpArpeggio() : window.musicEngine.playZeldaSecret();
                    }
                    if (window.dialogueSystem) {
                        window.dialogueSystem.startDialogue('stage1_shrine');
                    }
                    this.engine.camera.triggerShake(5, 0.3);
                }
            }

            // Portal to Stage 2 at Eastern clearing
            if (this.altar.active && player.x > 1820) {
                this.engine.transitionToStage(2);
            }
        }

        render(ctx, camera) {
            // Ground Grass (Mint green watercolor)
            ctx.fillStyle = '#ecfdf5';
            ctx.fillRect(0, 0, camera.viewportW, camera.viewportH);

            // Cobblestone Stone Path (curving to Altar)
            const pStart = camera.worldToScreen(100, 540);
            const pAltar = camera.worldToScreen(this.altar.x, this.altar.y);
            const pEnd = camera.worldToScreen(1850, 540);

            ctx.save();
            ctx.strokeStyle = '#d6d3d1';
            ctx.lineWidth = 44;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pStart.x, pStart.y);
            ctx.quadraticCurveTo(pAltar.x - 120, pStart.y, pAltar.x, pAltar.y + 40);
            ctx.quadraticCurveTo(pAltar.x + 160, pStart.y, pEnd.x, pEnd.y);
            ctx.stroke();

            // Inner path highlight
            ctx.strokeStyle = '#e7e5e4';
            ctx.lineWidth = 32;
            ctx.stroke();
            ctx.restore();

            // Altar da Harpa Ancestral
            const altarScr = camera.worldToScreen(this.altar.x, this.altar.y);
            ctx.save();
            ctx.translate(altarScr.x, altarScr.y);

            // Stone Dais
            ctx.fillStyle = this.altar.active ? '#fef08a' : '#e2e8f0';
            ctx.shadowColor = this.altar.active ? '#f59e0b' : 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = this.altar.active ? 18 : 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.altar.radius, 0, Math.PI * 2);
            ctx.fill();

            // Golden Harp Sculpture
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-16, 22);
            ctx.quadraticCurveTo(-26, -26, 0, -32);
            ctx.quadraticCurveTo(18, -26, 12, 22);
            ctx.stroke();
            // Harp strings
            ctx.strokeStyle = this.altar.active ? '#fde047' : '#94a3b8';
            ctx.lineWidth = 1.2;
            for (let i = -10; i <= 8; i += 4) {
                ctx.beginPath();
                ctx.moveTo(i, 20);
                ctx.lineTo(i * 0.6, -28);
                ctx.stroke();
            }
            ctx.restore();

            // Render Notes
            const time = performance.now() * 0.003;
            for (let note of this.notes) {
                if (!note.collected) {
                    const scr = camera.worldToScreen(note.x, note.y + Math.sin(time + note.id) * 7);
                    ctx.save();
                    ctx.translate(scr.x, scr.y);
                    ctx.fillStyle = '#fef08a';
                    ctx.shadowColor = '#eab308';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(0, 0, 16, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#854d0e';
                    ctx.font = 'bold 15px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('♪', 0, 1);
                    ctx.restore();
                }
            }

            // Render Trees (Layered Watercolor Crowns)
            for (let t of this.trees) {
                const scr = camera.worldToScreen(t.x, t.y);
                ctx.save();
                ctx.translate(scr.x, scr.y);

                // Trunk
                ctx.fillStyle = '#78350f';
                ctx.fillRect(-7, 0, 14, 28);

                // Leaves
                ctx.fillStyle = '#16a34a';
                ctx.beginPath();
                ctx.arc(-14, -12, t.r * 0.55, 0, Math.PI * 2);
                ctx.arc(14, -12, t.r * 0.55, 0, Math.PI * 2);
                ctx.arc(0, -26, t.r * 0.65, 0, Math.PI * 2);
                ctx.fill();

                // Highlight cloud
                ctx.fillStyle = '#86efac';
                ctx.beginPath();
                ctx.arc(-4, -28, t.r * 0.45, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }
    }

    class StageDesfiladeiro {
        constructor(engine) {
            this.engine = engine;
            this.id = 2;
            this.width = 2048;
            this.height = 1080;
            this.pads = [
                { id: 0, x: 600, y: 450, lit: false, note: 220.00 },
                { id: 1, x: 900, y: 650, lit: false, note: 277.18 },
                { id: 2, x: 1200, y: 420, lit: false, note: 329.63 },
                { id: 3, x: 1550, y: 600, lit: false, note: 440.00 }
            ];
            this.bridgeUnlocked = false;
            this.initColliders();
        }

        initColliders() {
            // Perimeters
            this.engine.collision.insert({ type: 'aabb', x: 0, y: 0, w: this.width, h: 40, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: 0, y: this.height - 40, w: this.width, h: 40, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: 0, y: 0, w: 40, h: this.height, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: this.width - 40, y: 0, w: 40, h: this.height, isStatic: true });
        }

        update(dt) {
            const player = this.engine.player;

            // Check constellation pads
            for (let pad of this.pads) {
                if (!pad.lit) {
                    const dist = Math.hypot(player.x - pad.x, player.y - pad.y);
                    if (dist < 46) {
                        pad.lit = true;
                        if (window.musicEngine) {
                            window.musicEngine.playStarBitSound ? window.musicEngine.playStarBitSound(pad.id) : window.musicEngine.playAcousticPiano(pad.note, 1.8, 0.7);
                        }
                        this.engine.particles.spawnHeartBurst(pad.x, pad.y, 8);
                    }
                }
            }

            // Bridge unlock check
            if (!this.bridgeUnlocked && this.pads.every(p => p.lit)) {
                this.bridgeUnlocked = true;
                if (window.dialogueSystem) {
                    window.dialogueSystem.startDialogue('stage2_constellation');
                }
                this.engine.camera.triggerShake(4, 0.3);
            }

            // Traverse to Stage 3 via celestial bridge
            if (this.bridgeUnlocked && player.x > 1920) {
                this.engine.transitionToStage(3);
            }
        }

        render(ctx, camera) {
            // Cosmic Deep Night Sky Background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, camera.viewportW, camera.viewportH);

            // Procedural Nebula Glow
            const nebScr = camera.worldToScreen(1000, 500);
            const grad = ctx.createRadialGradient(nebScr.x, nebScr.y, 40, nebScr.x, nebScr.y, 650);
            grad.addColorStop(0, 'rgba(124, 58, 237, 0.32)');
            grad.addColorStop(0.5, 'rgba(30, 27, 75, 0.25)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, camera.viewportW, camera.viewportH);

            // Parallax Stars
            ctx.save();
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 70; i++) {
                const sx = ((i * 137.5) % this.width) - camera.x * 0.2;
                const sy = ((i * 223.7) % this.height) - camera.y * 0.2;
                const wrapX = (sx % camera.viewportW + camera.viewportW) % camera.viewportW;
                const wrapY = (sy % camera.viewportH + camera.viewportH) % camera.viewportH;
                ctx.beginPath();
                ctx.arc(wrapX, wrapY, (i % 3 === 0 ? 2 : 1.2), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // Constellation Floor Circuits connecting lit pads
            ctx.save();
            ctx.lineWidth = 3.5;
            for (let i = 0; i < this.pads.length - 1; i++) {
                const p1 = this.pads[i];
                const p2 = this.pads[i + 1];
                if (p1.lit && p2.lit) {
                    const s1 = camera.worldToScreen(p1.x, p1.y);
                    const s2 = camera.worldToScreen(p2.x, p2.y);
                    ctx.strokeStyle = '#38bdf8';
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(s1.x, s1.y);
                    ctx.lineTo(s2.x, s2.y);
                    ctx.stroke();
                }
            }
            ctx.restore();

            // Constellation Glyphs / Pedestals
            for (let pad of this.pads) {
                const scr = camera.worldToScreen(pad.x, pad.y);
                ctx.save();
                ctx.translate(scr.x, scr.y);
                ctx.fillStyle = pad.lit ? '#38bdf8' : '#334155';
                ctx.shadowColor = pad.lit ? '#38bdf8' : 'transparent';
                ctx.shadowBlur = pad.lit ? 16 : 0;
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fef08a';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }

            // Celestial Bridge to Stage 3
            if (this.bridgeUnlocked) {
                const bStart = camera.worldToScreen(1600, 540);
                const bEnd = camera.worldToScreen(2000, 540);
                ctx.save();
                ctx.strokeStyle = '#fef08a';
                ctx.lineWidth = 36;
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.moveTo(bStart.x, bStart.y);
                ctx.lineTo(bEnd.x, bEnd.y);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    class StagePalacio {
        constructor(engine) {
            this.engine = engine;
            this.id = 3;
            this.width = 1920;
            this.height = 1080;
            this.cakePos = { x: 1620, y: 540 };
            this.daviPos = { x: 1480, y: 540 };
            this.toriiPos = { x: 260, y: 540 };
            this.climaxTriggered = false;
            this.initColliders();
        }

        initColliders() {
            // Perimeters
            this.engine.collision.insert({ type: 'aabb', x: 0, y: 0, w: this.width, h: 40, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: 0, y: this.height - 40, w: this.width, h: 40, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: 0, y: 0, w: 40, h: this.height, isStatic: true });
            this.engine.collision.insert({ type: 'aabb', x: this.width - 40, y: 0, w: 40, h: this.height, isStatic: true });

            // Grand Cake Dais Solid Collider
            this.engine.collision.insert({ type: 'circle', x: this.cakePos.x, y: this.cakePos.y, radius: 48, isStatic: true, tag: 'cake' });
        }

        update(dt) {
            const player = this.engine.player;

            // Proximity to Davi -> Trigger Grand Hug Climax
            const distDavi = Math.hypot(player.x - this.daviPos.x, player.y - this.daviPos.y);
            if (distDavi < 62 && !this.climaxTriggered) {
                this.climaxTriggered = true;
                this.engine.triggerDaviReveal();
                this.engine.triggerDaviHug();
            }
        }

        render(ctx, camera) {
            // Romantic Peach / Golden Sunset Sky
            const grad = ctx.createLinearGradient(0, 0, 0, camera.viewportH);
            grad.addColorStop(0, '#fed7aa');
            grad.addColorStop(1, '#fbcfe8');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, camera.viewportW, camera.viewportH);

            // Ceremonial Red Carpet with Gold Borders
            const cStart = camera.worldToScreen(260, 540);
            const cEnd = camera.worldToScreen(1580, 540);
            ctx.save();
            // Red carpet body
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 56;
            ctx.beginPath();
            ctx.moveTo(cStart.x, cStart.y);
            ctx.lineTo(cEnd.x, cEnd.y);
            ctx.stroke();

            // Gold filigree borders
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cStart.x, cStart.y - 28);
            ctx.lineTo(cEnd.x, cEnd.y - 28);
            ctx.moveTo(cStart.x, cStart.y + 28);
            ctx.lineTo(cEnd.x, cEnd.y + 28);
            ctx.stroke();
            ctx.restore();

            // Torii Gate at entrance
            const toriiScr = camera.worldToScreen(this.toriiPos.x, this.toriiPos.y);
            ctx.save();
            ctx.translate(toriiScr.x, toriiScr.y);
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(-22, -60, 8, 60); // Left pillar
            ctx.fillRect(14, -60, 8, 60);  // Right pillar
            ctx.fillRect(-30, -68, 60, 10); // Crossbar
            ctx.fillStyle = '#18181b';
            ctx.fillRect(-34, -74, 68, 7);  // Top curved bar
            ctx.restore();

            // Stone Lanterns (Tōrō) along the carpet
            const lanternPositions = [
                { x: 420, y: 480 }, { x: 420, y: 600 },
                { x: 740, y: 480 }, { x: 740, y: 600 },
                { x: 1060, y: 480 }, { x: 1060, y: 600 },
                { x: 1380, y: 480 }, { x: 1380, y: 600 }
            ];
            const time = performance.now() * 0.005;
            for (let l of lanternPositions) {
                const lScr = camera.worldToScreen(l.x, l.y);
                ctx.save();
                ctx.translate(lScr.x, lScr.y);
                ctx.fillStyle = '#64748b';
                ctx.fillRect(-6, -14, 12, 14);
                // Warm flickering firelight
                ctx.fillStyle = '#fef08a';
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 10 + Math.sin(time + l.x) * 4;
                ctx.beginPath();
                ctx.arc(0, -7, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Grand Birthday Cake at Dais
            const cakeScr = camera.worldToScreen(this.cakePos.x, this.cakePos.y);
            ctx.save();
            ctx.translate(cakeScr.x, cakeScr.y);

            // Tier 1 Base
            ctx.fillStyle = '#fff1f2';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-34, -14, 68, 22, 6);
            ctx.fill();
            ctx.stroke();

            // Tier 2 Top
            ctx.fillStyle = '#fce7f3';
            ctx.beginPath();
            ctx.roundRect(-22, -32, 44, 20, 5);
            ctx.fill();
            ctx.stroke();

            // Cake Candles (Lit if hug triggered or candlesLit)
            const isLit = this.engine.candlesLit;
            for (let cx = -12; cx <= 12; cx += 12) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx - 1.5, -42, 3, 10);
                if (isLit) {
                    ctx.fillStyle = '#fef08a';
                    ctx.shadowColor = '#f97316';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.ellipse(cx, -46, 2.5, 4.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    }

    // -------------------------------------------------------------------------
    // 7. Full 2D Game Engine (Loop, Input, Camera, Transitions, Y-Sorting)
    // -------------------------------------------------------------------------
    class CanvasStorybookEngine {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                const container = document.getElementById('canvas-container') || document.body;
                this.canvas = document.createElement('canvas');
                this.canvas.id = 'game-canvas';
                this.canvas.className = 'block w-full h-full';
                container.appendChild(this.canvas);
            }
            this.ctx = this.canvas.getContext('2d', { alpha: false });
            this.dpr = Math.min(window.devicePixelRatio || 1, 2.0);

            // Time & Loop
            this.lastTime = performance.now();
            this.accumulator = 0;
            this.fixedStep = 1 / 60;
            this.running = false;

            // Subsystems
            this.camera = new Camera2D(1280, 720);
            this.collision = new SpatialHashCollision2D(128);
            this.particles = new ParticleManager();

            // Characters & Player state
            this.player = {
                x: 240,
                y: 540,
                radius: 16,
                footOffsetY: 0,
                direction: 'down',
                isMoving: false,
                walkTime: 0,
                isEmoting: false,
                emoteType: null,
                isHugging: false
            };

            this.toad = {
                x: 320,
                y: 540,
                radius: 16,
                footOffsetY: 0,
                direction: 'left',
                visible: true,
                isMoving: false,
                walkTime: 0
            };

            this.davi = {
                x: 1480,
                y: 540,
                radius: 16,
                footOffsetY: 0,
                direction: 'left',
                visible: false,
                isMoving: false,
                walkTime: 0
            };

            // Stage State
            this.currentStageId = 1;
            this.currentStage = null;
            this.collectedNotesCount = 0;
            this.isLevelTransitioning = false;
            this.candlesLit = false;
            this.isDaviRevealed = false;
            this.isHugging = false;
            this.isHoldingHands = false;

            // Zelda Papercraft Iris Transition
            this.iris = {
                active: false,
                mode: 'in', // 'in' or 'out'
                radiusRatio: 1.0,
                duration: 0.85,
                elapsed: 0,
                onComplete: null
            };

            // Input
            this.keys = {
                up: false,
                down: false,
                left: false,
                right: false,
                shift: false,
                action: false
            };

            this.initCanvasSize();
            this.initInputs();
            this.loadStage(1, true);
        }

        initCanvasSize() {
            const updateSize = () => {
                const rect = this.canvas.parentElement
                    ? this.canvas.parentElement.getBoundingClientRect()
                    : { width: window.innerWidth || 1280, height: window.innerHeight || 720 };
                const w = Math.round(rect.width * this.dpr);
                const h = Math.round(rect.height * this.dpr);
                if (this.canvas.width !== w || this.canvas.height !== h) {
                    this.canvas.width = w;
                    this.canvas.height = h;
                    this.camera.setViewport(rect.width, rect.height);
                }
            };
            updateSize();
            window.addEventListener('resize', updateSize);
        }

        initInputs() {
            window.addEventListener('keydown', (e) => {
                if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = true;
                if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
                if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
                if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = true;
                if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
                    this.handleAction();
                }
            });

            window.addEventListener('keyup', (e) => {
                if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = false;
                if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
                if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
                if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = false;
            });

            // Touch D-Pad setup
            const bindBtn = (id, dir) => {
                const el = document.getElementById(id);
                if (!el) return;
                const down = (e) => { e.preventDefault(); this.keys[dir] = true; };
                const up = (e) => { e.preventDefault(); this.keys[dir] = false; };
                el.addEventListener('pointerdown', down);
                el.addEventListener('pointerup', up);
                el.addEventListener('pointercancel', up);
            };
            bindBtn('ctrl-up', 'up');
            bindBtn('ctrl-down', 'down');
            bindBtn('ctrl-left', 'left');
            bindBtn('ctrl-right', 'right');

            const actionBtn = document.getElementById('mobile-action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', () => this.handleAction());
            }
        }

        handleAction() {
            // Dialogue advance if box is active
            if (window.dialogueSystem && window.dialogueSystem.boxEl && !window.dialogueSystem.boxEl.classList.contains('hidden')) {
                window.dialogueSystem.advance();
                return;
            }

            // Toad interaction check
            if (this.toad.visible && !this.isDaviRevealed) {
                const distToad = Math.hypot(this.player.x - this.toad.x, this.player.y - this.toad.y);
                if (distToad < 60 && window.dialogueSystem) {
                    window.dialogueSystem.startDialogue(`toad_chat_stage${this.currentStageId}`);
                    return;
                }
            }

            // Hand holding toggle with Davi in Stage 3
            if (this.currentStageId === 3 && this.isDaviRevealed) {
                const distDavi = Math.hypot(this.player.x - this.davi.x, this.player.y - this.davi.y);
                if (distDavi < 65) {
                    this.toggleHoldingHandsWithDavi();
                    return;
                }
            }
        }

        loadStage(stageId, immediate = false) {
            this.currentStageId = stageId;
            this.collision.clear();

            if (stageId === 1) {
                this.currentStage = new StageBosque(this);
                this.player.x = 240;
                this.player.y = 540;
                this.toad.x = 320;
                this.toad.y = 540;
                this.toad.visible = true;
                this.davi.visible = false;
            } else if (stageId === 2) {
                this.currentStage = new StageDesfiladeiro(this);
                this.player.x = 220;
                this.player.y = 540;
                this.toad.x = 300;
                this.toad.y = 540;
                this.toad.visible = true;
                this.davi.visible = false;
            } else if (stageId === 3) {
                this.currentStage = new StagePalacio(this);
                this.player.x = 240;
                this.player.y = 540;
                this.toad.x = 320;
                this.toad.y = 540;
                this.toad.visible = !this.isDaviRevealed;
                this.davi.x = 1480;
                this.davi.y = 540;
                this.davi.visible = this.isDaviRevealed;
            }

            this.camera.setBounds(0, 0, this.currentStage.width, this.currentStage.height);
            this.camera.follow(this.player.x, this.player.y, 0.016, true);

            // Update UI badge
            const badge = document.getElementById('stage-badge');
            if (badge) {
                if (stageId === 1) badge.innerText = "🍃 FASE 1: O BOSQUE DAS MELODIAS";
                else if (stageId === 2) badge.innerText = "🪐 FASE 2: O DESFILADEIRO CÓSMICO";
                else if (stageId === 3) badge.innerText = "🎂 FASE 3: O PALÁCIO DAS CEREJEIRAS & O GRANDE ABRAÇO";
            }

            // Sync music
            if (window.musicEngine && window.musicEngine.setStage) {
                window.musicEngine.setStage(stageId);
            }
        }

        transitionToStage(nextStageId) {
            if (this.isLevelTransitioning) return;
            this.isLevelTransitioning = true;

            // Start Papercraft Circular Iris Wipe
            this.iris.active = true;
            this.iris.mode = 'in';
            this.iris.radiusRatio = 1.0;
            this.iris.elapsed = 0;
            this.iris.onComplete = () => {
                this.loadStage(nextStageId);
                // Iris open
                this.iris.mode = 'out';
                this.iris.radiusRatio = 0.0;
                this.iris.elapsed = 0;
                this.iris.onComplete = () => {
                    this.iris.active = false;
                    this.isLevelTransitioning = false;
                };
            };
        }

        triggerDaviReveal() {
            this.isDaviRevealed = true;
            this.toad.visible = false;
            this.davi.visible = true;
            this.davi.x = this.player.x + 50;
            this.davi.y = this.player.y;

            if (window.musicEngine) {
                window.musicEngine.playRevealSound && window.musicEngine.playRevealSound();
                window.musicEngine.playFanfare && window.musicEngine.playFanfare();
            }
            if (typeof confetti === 'function') {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 } });
            }
        }

        triggerDaviHug() {
            this.isHugging = true;
            this.player.isHugging = true;
            this.candlesLit = true;

            // Position Davi and Ana together in warm embrace
            this.davi.x = this.player.x + 24;
            this.davi.y = this.player.y;
            this.player.direction = 'right';
            this.davi.direction = 'left';

            this.particles.spawnHeartBurst(this.player.x + 12, this.player.y - 20, 20);

            if (window.musicEngine) {
                window.musicEngine.playCandleLightSound && window.musicEngine.playCandleLightSound();
                window.musicEngine.playBirthdayHymn && window.musicEngine.playBirthdayHymn();
            }

            if (typeof confetti === 'function') {
                confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
            }

            setTimeout(() => {
                const letterModal = document.getElementById('letter-modal');
                if (letterModal) {
                    letterModal.classList.remove('hidden');
                    letterModal.classList.add('flex');
                }
            }, 3200);
        }

        toggleHoldingHandsWithDavi() {
            this.isHoldingHands = !this.isHoldingHands;
            if (this.isHoldingHands) {
                if (window.musicEngine && window.musicEngine.playFanfare) {
                    window.musicEngine.playFanfare();
                }
                this.particles.spawnHeartBurst(this.player.x + 20, this.player.y - 30, 8);
            }
        }

        releaseSkyLantern() {
            this.particles.spawnSkyLantern(this.player.x, this.player.y - 20);
            if (window.musicEngine && window.musicEngine.playLanternSound) {
                window.musicEngine.playLanternSound();
            }
        }

        triggerEmote(num) {
            this.player.isEmoting = true;
            this.player.emoteType = num;
            if (num === 1) {
                if (window.musicEngine && window.musicEngine.playPirouetteChime) window.musicEngine.playPirouetteChime();
                if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
            } else if (num === 2) {
                if (window.musicEngine && window.musicEngine.playHarpPluck) window.musicEngine.playHarpPluck();
            } else if (num === 4) {
                if (window.musicEngine && window.musicEngine.playDialogueBlip) window.musicEngine.playDialogueBlip(587.33);
            }
            setTimeout(() => {
                this.player.isEmoting = false;
                this.player.emoteType = null;
            }, 1200);
        }

        updatePhysics(dt) {
            // Movement vector
            let dx = 0;
            let dy = 0;
            const inputLocked = this.isHugging || (window.dialogueSystem && window.dialogueSystem.boxEl && !window.dialogueSystem.boxEl.classList.contains('hidden'));

            if (!inputLocked) {
                if (this.keys.up) dy -= 1;
                if (this.keys.down) dy += 1;
                if (this.keys.left) dx -= 1;
                if (this.keys.right) dx += 1;
            }

            // Normalization
            const isMoving = dx !== 0 || dy !== 0;
            this.player.isMoving = isMoving;
            if (isMoving) {
                const invLen = 1 / Math.hypot(dx, dy);
                dx *= invLen;
                dy *= invLen;

                // Direction facing
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.player.direction = dx > 0 ? 'right' : 'left';
                } else {
                    this.player.direction = dy > 0 ? 'down' : 'up';
                }

                this.player.walkTime += dt;
                const speed = this.keys.shift ? 190 : 135;
                this.collision.moveAndSlide(this.player, dx * speed, dy * speed, dt);

                // Footstep sounds
                if (Math.sin(this.player.walkTime * 14) > 0.8 && window.musicEngine) {
                    if (!this._stepSoundPlayed) {
                        this._stepSoundPlayed = true;
                        window.musicEngine.playStepSound && window.musicEngine.playStepSound();
                    }
                } else if (Math.sin(this.player.walkTime * 14) < 0) {
                    this._stepSoundPlayed = false;
                }
            }

            // Toad Companion Follow AI
            if (this.toad.visible && !this.isDaviRevealed) {
                const distToPlayer = Math.hypot(this.player.x - this.toad.x, this.player.y - this.toad.y);
                if (distToPlayer > 65) {
                    const tdx = (this.player.x - this.toad.x) / distToPlayer;
                    const tdy = (this.player.y - this.toad.y) / distToPlayer;
                    this.toad.x += tdx * 110 * dt;
                    this.toad.y += tdy * 110 * dt;
                    this.toad.isMoving = true;
                    this.toad.walkTime += dt;
                    this.toad.direction = tdx > 0 ? 'right' : 'left';
                } else {
                    this.toad.isMoving = false;
                }
            }

            // Davi hand-holding follow in Stage 3
            if (this.isHoldingHands && this.davi.visible) {
                this.davi.x = this.player.x + 26;
                this.davi.y = this.player.y;
                this.davi.direction = this.player.direction;
                this.davi.isMoving = this.player.isMoving;
                this.davi.walkTime = this.player.walkTime;
            }

            // Current Stage update
            if (this.currentStage) {
                this.currentStage.update(dt);
            }

            // Particles update
            this.particles.update(dt, this.currentStageId);

            // Camera follow with deadzone
            this.camera.follow(this.player.x, this.player.y, dt);

            // Zelda Iris Transition Update
            if (this.iris.active) {
                this.iris.elapsed += dt;
                const t = Math.min(1.0, this.iris.elapsed / this.iris.duration);
                // easeInOutCubic
                const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                if (this.iris.mode === 'in') {
                    this.iris.radiusRatio = 1.0 - ease;
                } else {
                    this.iris.radiusRatio = ease;
                }
                if (t >= 1.0 && this.iris.onComplete) {
                    const cb = this.iris.onComplete;
                    this.iris.onComplete = null;
                    cb();
                }
            }
        }

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width / this.dpr;
            const h = this.canvas.height / this.dpr;

            ctx.save();
            ctx.scale(this.dpr, this.dpr);

            // 1. Render Current Stage Environment
            if (this.currentStage) {
                this.currentStage.render(ctx, this.camera);
            }

            // 2. Y-Sorted Entities Pipeline
            const renderEntities = [];

            renderEntities.push({
                y: this.player.y,
                render: () => CharacterRenderer2D.render(ctx, 'ana', this.player, this.camera.worldToScreen(this.player.x, this.player.y).x, this.camera.worldToScreen(this.player.x, this.player.y).y, this.player.direction)
            });

            if (this.toad.visible) {
                renderEntities.push({
                    y: this.toad.y,
                    render: () => CharacterRenderer2D.render(ctx, 'toadbigode', this.toad, this.camera.worldToScreen(this.toad.x, this.toad.y).x, this.camera.worldToScreen(this.toad.x, this.toad.y).y, this.toad.direction)
                });
            }

            if (this.davi.visible) {
                renderEntities.push({
                    y: this.davi.y,
                    render: () => CharacterRenderer2D.render(ctx, 'davi', this.davi, this.camera.worldToScreen(this.davi.x, this.davi.y).x, this.camera.worldToScreen(this.davi.x, this.davi.y).y, this.davi.direction)
                });
            }

            // Sort by Y ascending so entities further down overlap those higher up
            renderEntities.sort((a, b) => a.y - b.y);
            for (let ent of renderEntities) {
                ent.render();
            }

            // 3. Particles
            this.particles.render(ctx, this.camera, this.currentStageId);

            // 4. Zelda Circular Papercraft Iris Wipe
            if (this.iris.active) {
                const maxRadius = Math.hypot(w, h);
                const currentRadius = Math.max(0, this.iris.radiusRatio * maxRadius);
                const center = this.camera.worldToScreen(this.player.x, this.player.y);

                ctx.save();
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.rect(0, 0, w, h);
                ctx.arc(center.x, center.y, currentRadius, 0, Math.PI * 2, true);
                ctx.fill();

                // Paper deckle edge outline
                if (currentRadius > 5) {
                    ctx.strokeStyle = '#fffdfa';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, currentRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.restore();
        }

        start() {
            if (this.running) return;
            this.running = true;
            this.lastTime = performance.now();
            const loop = (currentTime) => {
                if (!this.running) return;
                requestAnimationFrame(loop);

                let dt = (currentTime - this.lastTime) * 0.001;
                this.lastTime = currentTime;
                dt = Math.min(dt, 0.05); // Delta clamping

                this.accumulator += dt;
                while (this.accumulator >= this.fixedStep) {
                    this.updatePhysics(this.fixedStep);
                    this.accumulator -= this.fixedStep;
                }

                this.render();
            };
            requestAnimationFrame(loop);
        }

        stop() {
            this.running = false;
        }
    }

    // Export to window
    window.CanvasStorybookEngine = CanvasStorybookEngine;
    window.CharacterRenderer2D = CharacterRenderer2D;
    window.Camera2D = Camera2D;

})(typeof window !== 'undefined' ? window : this);
