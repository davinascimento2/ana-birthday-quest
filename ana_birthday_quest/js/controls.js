// Character Movement & Orbital 360 Camera Controller for "A Sinfonia de Ana Gleice"
// Camera-relative movement (ZERO inversion), 360° mouse/touch orbit, and cozy jump mechanics!

class CharacterCameraController {
    constructor() {
        this.camera = null;
        this.domElement = null;
        this.target = null;
        this.onMoveCallback = null;

        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shift: false,
            space: false
        };

        // Jump & Vertical Physics
        this.velocityY = 0;
        this.isGrounded = true;
        this.jumpForce = 11.2;
        this.gravity = 18.0;
        this.groundY = 0;

        // Gliding & Flight Mechanics ("Voo dos Sonhos")
        this.isGliding = false;
        this.glideGravity = 2.4;
        this.glideTerminalDescent = -1.2;
        this.glideSpeed = 10.5;
        this.glideBankAngle = 0;
        this.glideBankTarget = 0;
        this.targetFov = 50;
        this.currentFov = 50;
        this.isHoldingHands = false;
        this.benchPosition = null;
        this.lastMoveDir = new THREE.Vector3(0, 0, -1);

        // Mobile touch joystick state
        this.touchJoystick = {
            active: false,
            touchId: null,
            startX: 0,
            startY: 0,
            vector: new THREE.Vector2(0, 0),
            maxRadius: 45
        };

        // Camera Orbit 360 Dynamics
        this.cameraYaw = 0;      // Rotation around Y axis in radians
        this.cameraPitch = 0.32; // Elevation angle (clamped)
        this.cameraDistance = 9.5;
        this.targetYaw = 0;
        this.targetPitch = 0.32;
        this.targetDistance = 9.5;

        // Mouse Drag Orbiting
        this.isDraggingMouse = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Movement dynamics
        this.currentSpeed = 0;
        this.walkSpeed = 6.2;
        this.runSpeed = 9.2;
        this.movementVector = new THREE.Vector3(0, 0, 0);
        this.isInputLocked = false;

        // Camera modes: 'EXPLORATION' | 'DIALOGUE' | 'CINEMATIC_ORBIT' | 'PHOTO'
        this.cameraMode = 'EXPLORATION';
        this.currentCameraPos = new THREE.Vector3(0, 5, -12);
        this.currentLookAt = new THREE.Vector3(0, 1.8, 0);

        // Cinematic Orbit mode dynamics
        this.orbitAngle = 0;
        this.orbitRadius = 5.8;
        this.orbitSpeed = 0.45;
        this.orbitHeight = 2.2;

        // Bound event handlers
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onKeyUp = this.onKeyUp.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this._onTouchStart = this.onTouchStart.bind(this);
        this._onTouchMove = this.onTouchMove.bind(this);
        this._onTouchEnd = this.onTouchEnd.bind(this);
    }

    init(camera, domElement, onMoveCallback = null) {
        this.camera = camera;
        this.domElement = domElement || document.body;
        this.onMoveCallback = onMoveCallback;

        window.addEventListener('keydown', this._onKeyDown, false);
        window.addEventListener('keyup', this._onKeyUp, false);

        // Mouse drag orbiting
        this.domElement.addEventListener('mousedown', this._onMouseDown, false);
        window.addEventListener('mousemove', this._onMouseMove, false);
        window.addEventListener('mouseup', this._onMouseUp, false);

        // Wheel zoom
        this.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetDistance = THREE.MathUtils.clamp(this.targetDistance + e.deltaY * 0.005, 6.8, 16.0);
        }, { passive: false });

        this.initTouchJoystick();
    }

    setTarget(targetMesh) {
        this.target = targetMesh;
        if (this.target && this.camera) {
            this.currentLookAt.copy(this.target.position).add(new THREE.Vector3(0, 1.8, 0));
        }
    }

    setMode(mode) {
        this.cameraMode = mode;
        if (mode === 'CINEMATIC_ORBIT') {
            this.orbitAngle = this.cameraYaw;
        }
    }

    getMode() {
        return this.cameraMode;
    }

    lockInput(locked = true) {
        this.isInputLocked = locked;
        if (locked) {
            this.keys.forward = false;
            this.keys.backward = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.space = false;
            this.touchJoystick.vector.set(0, 0);
            this.movementVector.set(0, 0, 0);
        }
    }

    onKeyDown(e) {
        if (this.isInputLocked) return;
        const code = e.code;
        if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
        if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
        if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
        if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
        if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.shift = true;
        if (code === 'Space') {
            this.tryJump();
        }

        // Q key to rotate camera smoothly (E is dedicated for interaction)
        if (code === 'KeyQ') this.targetYaw += 0.28;
    }

    onKeyUp(e) {
        const code = e.code;
        if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
        if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
        if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
        if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
        if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.shift = false;
    }

    tryJump() {
        if (this.isGrounded && !this.isInputLocked) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            this.stopGliding();
            if (window.musicEngine) {
                window.musicEngine.playJumpSound();
            }
        } else if (!this.isGrounded && !this.isInputLocked) {
            // Mid-air spacebar activates or toggles celestial glider!
            if (this.isGliding) {
                this.stopGliding();
            } else {
                this.startGliding();
            }
        }
    }

    startGliding() {
        if (!this.isGliding) {
            this.isGliding = true;
            this.velocityY = Math.max(this.velocityY, -1.0);
            this.targetFov = 62;
            if (window.gameApp && window.gameApp.player && window.gameApp.player.parasol) {
                window.gameApp.player.parasol.visible = true;
            }
            if (window.musicEngine && typeof window.musicEngine.playGliderOpenSound === 'function') {
                window.musicEngine.playGliderOpenSound();
            }
            this.updateGlideIndicator(true);
        }
    }

    stopGliding() {
        if (this.isGliding) {
            this.isGliding = false;
            this.targetFov = 50;
            if (window.gameApp && window.gameApp.player && window.gameApp.player.parasol) {
                window.gameApp.player.parasol.visible = false;
            }
            this.updateGlideIndicator(false);
        }
    }

    boostUpdraft(liftForce = 14.5) {
        this.velocityY = liftForce;
        this.isGrounded = false;
        this.startGliding();
        if (window.musicEngine && typeof window.musicEngine.playUpdraftSound === 'function') {
            window.musicEngine.playUpdraftSound();
        }
    }

    updateGlideIndicator(visible) {
        const el = document.getElementById('glide-indicator');
        if (el) {
            if (visible) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    }

    bounceHigh(boostForce = 15.0) {
        this.velocityY = boostForce;
        this.isGrounded = false;
        if (window.musicEngine) {
            window.musicEngine.playBounceSound();
        }
    }

    onMouseDown(e) {
        // Left or right click drag
        if (e.button === 0 || e.button === 2) {
            this.isDraggingMouse = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }

    onMouseMove(e) {
        if (!this.isDraggingMouse) return;
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        // Smooth yaw and pitch
        this.targetYaw -= dx * 0.007;
        this.targetPitch = THREE.MathUtils.clamp(this.targetPitch + dy * 0.005, 0.08, 1.15);
    }

    onMouseUp() {
        this.isDraggingMouse = false;
    }

    initTouchJoystick() {
        const setupDpadButton = (id, keyName) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const press = () => {
                this.keys[keyName] = true;
            };
            const release = () => {
                this.keys[keyName] = false;
            };
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
            btn.addEventListener('touchstart', press, { passive: true });
            btn.addEventListener('touchend', release, { passive: true });
        };
        setupDpadButton('ctrl-up', 'forward');
        setupDpadButton('ctrl-down', 'backward');
        setupDpadButton('ctrl-left', 'left');
        setupDpadButton('ctrl-right', 'right');

        const zone = document.getElementById('mobile-joystick-zone') || document.getElementById('mobile-dpad');
        if (!zone) return;

        zone.addEventListener('touchstart', this._onTouchStart, { passive: false });
        window.addEventListener('touchmove', this._onTouchMove, { passive: false });
        window.addEventListener('touchend', this._onTouchEnd, { passive: false });
        window.addEventListener('touchcancel', this._onTouchEnd, { passive: false });

        // Touch swipe camera rotation on the main canvas
        if (this.domElement) {
            let touchCamStartX = 0;
            let touchCamStartY = 0;
            let isCamTouch = false;

            this.domElement.addEventListener('touchstart', (e) => {
                if (e.target.closest('#mobile-dpad') || e.target.closest('#dialogue-box') || e.target.closest('header')) return;
                isCamTouch = true;
                touchCamStartX = e.touches[0].clientX;
                touchCamStartY = e.touches[0].clientY;
            }, { passive: true });

            this.domElement.addEventListener('touchmove', (e) => {
                if (!isCamTouch) return;
                const dx = e.touches[0].clientX - touchCamStartX;
                const dy = e.touches[0].clientY - touchCamStartY;
                touchCamStartX = e.touches[0].clientX;
                touchCamStartY = e.touches[0].clientY;
                this.targetYaw -= dx * 0.008;
                this.targetPitch = THREE.MathUtils.clamp(this.targetPitch + dy * 0.006, 0.08, 1.15);
            }, { passive: true });

            this.domElement.addEventListener('touchend', () => { isCamTouch = false; }, { passive: true });
        }
    }

    onTouchStart(e) {
        if (this.isInputLocked) return;
        if (this.touchJoystick.active) return;
        const touch = e.changedTouches[0];
        this.touchJoystick.active = true;
        this.touchJoystick.touchId = touch.identifier;
        this.touchJoystick.startX = touch.clientX;
        this.touchJoystick.startY = touch.clientY;
        this.touchJoystick.vector.set(0, 0);
    }

    onTouchMove(e) {
        if (!this.touchJoystick.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === this.touchJoystick.touchId) {
                const dx = touch.clientX - this.touchJoystick.startX;
                const dy = touch.clientY - this.touchJoystick.startY;
                const dist = Math.hypot(dx, dy);
                const maxR = this.touchJoystick.maxRadius;
                const clampedDist = Math.min(dist, maxR);
                const angle = Math.atan2(dy, dx);

                this.touchJoystick.vector.x = (Math.cos(angle) * (clampedDist / maxR));
                this.touchJoystick.vector.y = (Math.sin(angle) * (clampedDist / maxR));
                break;
            }
        }
    }

    onTouchEnd(e) {
        if (!this.touchJoystick.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchJoystick.touchId) {
                this.touchJoystick.active = false;
                this.touchJoystick.touchId = null;
                this.touchJoystick.vector.set(0, 0);
                break;
            }
        }
    }

    getMovementVector() {
        return this.movementVector.clone();
    }

    update(deltaTime, playerPosition = null) {
        const dt = Math.min(deltaTime, 0.05);

        // Smooth camera damping
        this.cameraYaw = THREE.MathUtils.lerp(this.cameraYaw, this.targetYaw, 1.0 - Math.exp(-14.0 * dt));
        this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, this.targetPitch, 1.0 - Math.exp(-14.0 * dt));
        this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.targetDistance, 1.0 - Math.exp(-8.0 * dt));

        // Raw screen input
        const rawInput = new THREE.Vector2(0, 0);
        if (!this.isInputLocked) {
            if (this.keys.forward) rawInput.y += 1;
            if (this.keys.backward) rawInput.y -= 1;
            if (this.keys.left) rawInput.x -= 1;
            if (this.keys.right) rawInput.x += 1;

            if (this.touchJoystick.active) {
                rawInput.x += this.touchJoystick.vector.x;
                rawInput.y -= this.touchJoystick.vector.y;
            }
        }

        const inputLength = rawInput.length();
        if (inputLength > 1.0) {
            rawInput.normalize();
        }

        const isMoving = inputLength > 0.05;
        let targetSpeed = 0.0;
        if (this.isGliding) {
            // Gliding: W accelerates, S slows down / glides gently, idle drifts forward
            if (rawInput.y > 0.1) targetSpeed = this.glideSpeed * 1.15;
            else if (rawInput.y < -0.1) targetSpeed = this.glideSpeed * 0.55;
            else targetSpeed = this.glideSpeed * 0.85;
        } else if (isMoving) {
            targetSpeed = this.keys.shift ? this.runSpeed : this.walkSpeed;
        }

        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, dt * 11.0);

        // Direction vector math
        const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
        const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

        if (this.isGliding) {
            // Forward flight with gentle lateral banking
            const glideY = rawInput.y < -0.1 ? 0.35 : Math.max(0.65, rawInput.y);
            const dir = new THREE.Vector3()
                .addScaledVector(forward, glideY)
                .addScaledVector(right, rawInput.x * 0.85);
            if (dir.lengthSq() > 0.001) {
                dir.normalize();
                this.lastMoveDir.copy(dir);
                this.movementVector.copy(dir).multiplyScalar(this.currentSpeed);
            }
        } else if (isMoving) {
            const dir = new THREE.Vector3()
                .addScaledVector(forward, rawInput.y)
                .addScaledVector(right, rawInput.x);
            if (dir.lengthSq() > 0.001) {
                dir.normalize();
                this.lastMoveDir.copy(dir);
                this.movementVector.copy(dir).multiplyScalar(this.currentSpeed);
            }
        } else if (this.currentSpeed > 0.05) {
            // Smooth momentum deceleration
            this.movementVector.copy(this.lastMoveDir).multiplyScalar(this.currentSpeed);
        } else {
            this.currentSpeed = 0;
            this.movementVector.set(0, 0, 0);
        }

        // Apply Vertical Jump & Gliding Physics
        if (!this.isGrounded && this.target) {
            if (this.isGliding) {
                // Gentle floating descent; pulling back (S) gives extra aerodynamic cushion
                const terminal = rawInput.y < -0.1 ? -0.7 : this.glideTerminalDescent;
                this.velocityY = Math.max(this.velocityY - this.glideGravity * dt, terminal);
            } else {
                // Normal gravity
                this.velocityY -= this.gravity * dt;
            }
            this.target.position.y += this.velocityY * dt;

            // Banking roll tilt when turning in the air
            if (this.isGliding) {
                this.glideBankTarget = (rawInput.x !== 0) ? -rawInput.x * 0.32 : 0;
                this.glideBankAngle = THREE.MathUtils.lerp(this.glideBankAngle, this.glideBankTarget, dt * 8.0);
                this.target.rotation.z = this.glideBankAngle;

                // Subtle wind rush audio
                if (window.musicEngine && typeof window.musicEngine.playWindRush === 'function') {
                    window.musicEngine.playWindRush(Math.max(0.2, this.currentSpeed / 10.0));
                }
            } else if (this.target.rotation.z !== 0) {
                this.target.rotation.z = THREE.MathUtils.lerp(this.target.rotation.z, 0, dt * 10.0);
            }

            if (this.target.position.y <= this.groundY) {
                this.target.position.y = this.groundY;
                this.velocityY = 0;
                this.isGrounded = true;
                if (this.isGliding) {
                    this.stopGliding();
                }
            }
        } else if (this.target && this.target.rotation.z !== 0) {
            this.target.rotation.z = THREE.MathUtils.lerp(this.target.rotation.z, 0, dt * 10.0);
        }

        // Dynamic FOV Smoothing
        if (this.camera) {
            this.currentFov = THREE.MathUtils.lerp(this.currentFov, this.targetFov, dt * 5.0);
            if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
                this.camera.fov = this.currentFov;
                this.camera.updateProjectionMatrix();
            }
        }

        // Notify callback if player moved
        if (isMoving && typeof this.onMoveCallback === 'function') {
            this.onMoveCallback(this.movementVector, dt, isMoving);
        }

        // Update Camera
        this.updateCamera(dt, playerPosition);
    }

    updateCamera(dt, playerPosition) {
        if (!this.camera) return;

        const targetPos = playerPosition || (this.target ? this.target.position : new THREE.Vector3(0, 0, 0));

        if (this.cameraMode === 'EXPLORATION') {
            // Spherical orbit position relative to player
            const cy = Math.cos(this.cameraPitch) * this.cameraDistance;
            const desiredCamPos = new THREE.Vector3(
                targetPos.x + Math.sin(this.cameraYaw) * cy,
                targetPos.y + Math.sin(this.cameraPitch) * this.cameraDistance + 1.8,
                targetPos.z + Math.cos(this.cameraYaw) * cy
            );
            const desiredLookAt = targetPos.clone().add(new THREE.Vector3(0, 1.8, 0));

            const lerpFactor = 1.0 - Math.exp(-10.0 * dt);
            this.currentCameraPos.lerp(desiredCamPos, lerpFactor);
            this.currentLookAt.lerp(desiredLookAt, lerpFactor);

            this.camera.position.copy(this.currentCameraPos);
            this.camera.lookAt(this.currentLookAt);

        } else if (this.cameraMode === 'BENCH_CONTEMPLATION') {
            // Poetic widescreen contemplation view
            const center = targetPos.clone().add(new THREE.Vector3(0, 1.3, 0));
            const benchCamPos = center.clone().add(new THREE.Vector3(
                Math.sin(this.cameraYaw + 0.6) * 6.2,
                1.4,
                Math.cos(this.cameraYaw + 0.6) * 6.2
            ));
            const lerpFactor = 1.0 - Math.exp(-4.0 * dt);
            this.currentCameraPos.lerp(benchCamPos, lerpFactor);
            this.currentLookAt.lerp(center, lerpFactor);

            this.camera.position.copy(this.currentCameraPos);
            this.camera.lookAt(this.currentLookAt);

        } else if (this.cameraMode === 'CINEMATIC_ORBIT') {
            // 360-degree majestic slow sweep around Ana & Davi during the hug
            this.orbitAngle += this.orbitSpeed * dt;
            const center = targetPos.clone().add(new THREE.Vector3(0, 1.4, 0));

            this.camera.position.set(
                center.x + Math.sin(this.orbitAngle) * this.orbitRadius,
                center.y + this.orbitHeight + Math.sin(this.orbitAngle * 0.7) * 0.35,
                center.z + Math.cos(this.orbitAngle) * this.orbitRadius
            );
            this.camera.lookAt(center);

        } else if (this.cameraMode === 'DIALOGUE') {
            const center = targetPos.clone().add(new THREE.Vector3(0, 1.4, 0));
            const dialogueOffset = new THREE.Vector3(
                Math.sin(this.cameraYaw + 0.4) * 5.0,
                2.0,
                Math.cos(this.cameraYaw + 0.4) * 5.0
            );
            const dialoguePos = center.clone().add(dialogueOffset);

            const lerpFactor = 1.0 - Math.exp(-6.0 * dt);
            this.currentCameraPos.lerp(dialoguePos, lerpFactor);
            this.currentLookAt.lerp(center, lerpFactor);

            this.camera.position.copy(this.currentCameraPos);
            this.camera.lookAt(this.currentLookAt);

        } else if (this.cameraMode === 'PHOTO') {
            const center = targetPos.clone().add(new THREE.Vector3(0, 1.4, 0));
            const photoPos = center.clone().add(new THREE.Vector3(1.8, 1.4, 3.8));

            const lerpFactor = 1.0 - Math.exp(-8.0 * dt);
            this.currentCameraPos.lerp(photoPos, lerpFactor);
            this.currentLookAt.lerp(center, lerpFactor);

            this.camera.position.copy(this.currentCameraPos);
            this.camera.lookAt(this.currentLookAt);
        }
    }

    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        if (this.domElement) {
            this.domElement.removeEventListener('mousedown', this._onMouseDown);
        }
    }
}

window.CharacterCameraController = CharacterCameraController;
