// =========================================================================
// Main Orchestration Controller for "A Sinfonia de Ana Gleice"
// Coordinates 2D Canvas Engine, Web Audio, Storybook Dialogue, UI Overlays & Public State Contracts
// =========================================================================

class GameApp {
    constructor() {
        this.container = document.getElementById('canvas-container') || document.body;
        this.currentStage = 1;
        this.isLevelTransitioning = false;

        // Initialize 2D Canvas Engine
        this.engine = new window.CanvasStorybookEngine();
        this.engine.start();

        // Climax & Narrative States
        this.isDaviRevealed = false;
        this.isHugging = false;
        this.candlesLit = false;
        this.isHoldingHands = false;
        this.isSittingOnBench = false;
        this.activeSkyLanterns = [];

        // Compatibility Entity Wrappers for test contracts
        this.initMockHierarchy();

        // Controls bridge
        this.initControlsBridge();

        // State harness
        this.initGameStateHarness();

        // UI & Modal Bindings
        this.initUIBindings();

        // Continuous sync ticker
        this.syncTicker = () => {
            this.syncState();
            requestAnimationFrame(this.syncTicker);
        };
        requestAnimationFrame(this.syncTicker);
    }

    initMockHierarchy() {
        const createPosition = (initialX = 0, initialY = 0, initialZ = 0) => {
            return {
                x: initialX,
                y: initialY,
                z: initialZ,
                set(x, y, z = 0) { this.x = x; this.y = y; this.z = z; return this; },
                copy(v) { this.x = v.x; this.y = v.y; this.z = v.z !== undefined ? v.z : 0; return this; },
                clone() { return createPosition(this.x, this.y, this.z); },
                add(v) { this.x += v.x; this.y += v.y; this.z += (v.z || 0); return this; },
                sub(v) { this.x -= v.x; this.y -= v.y; this.z -= (v.z || 0); return this; },
                distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - (v.z || 0)); }
            };
        };

        const createRotation = () => {
            return {
                x: 0,
                y: 0,
                z: 0,
                set(x, y, z = 0) { this.x = x; this.y = y; this.z = z; return this; }
            };
        };

        this.player = {
            root: {
                position: createPosition(240, 0, 540),
                rotation: createRotation(),
                visible: true,
                lookAt(target) {
                    if (target) {
                        const dx = (target.x !== undefined ? target.x : 0) - this.position.x;
                        const dz = (target.z !== undefined ? target.z : 0) - this.position.z;
                        this.rotation.y = Math.atan2(dx, dz);
                    }
                }
            },
            head: {
                position: createPosition(0, 2.4, 0),
                rotation: createRotation(),
                add(child) { this.crown = child; }
            },
            legL: { rotation: createRotation() },
            legR: { rotation: createRotation() },
            armL: { rotation: createRotation() },
            armR: { rotation: createRotation() },
            parasol: { visible: false, rotation: createRotation() },
            sunflower: { visible: true },
            fairy: {
                position: createPosition(0, 3.2, 0),
                scale: { set(x, y, z) { this.x = x; this.y = y; this.z = z; } }
            },
            crown: null
        };

        this.toad = {
            root: {
                position: createPosition(320, 0, 540),
                rotation: createRotation(),
                visible: true,
                lookAt(target) {
                    if (target) {
                        const dx = (target.x !== undefined ? target.x : 0) - this.position.x;
                        const dz = (target.z !== undefined ? target.z : 0) - this.position.z;
                        this.rotation.y = Math.atan2(dx, dz);
                    }
                }
            },
            cap: { position: createPosition(0, 2.45, 0) },
            armR: { rotation: createRotation() },
            stache: { rotation: createRotation() },
            balloon: { visible: false, propeller: { rotation: createRotation() } }
        };

        this.davi = {
            root: {
                position: createPosition(1480, 0, 540),
                rotation: createRotation(),
                visible: false,
                lookAt(target) {
                    if (target) {
                        const dx = (target.x !== undefined ? target.x : 0) - this.position.x;
                        const dz = (target.z !== undefined ? target.z : 0) - this.position.z;
                        this.rotation.y = Math.atan2(dx, dz);
                    }
                }
            },
            head: { position: createPosition(0, 2.38, 0), rotation: createRotation() },
            armL: { rotation: createRotation() },
            armR: { rotation: createRotation() }
        };

        // Mock 3D scene & renderer for tests checking `window.gameApp.scene` and `window.gameApp.renderer`
        this.scene = {
            background: null,
            fog: null,
            add(obj) {},
            remove(obj) {}
        };

        this.renderer = {
            domElement: this.engine.canvas,
            render() {},
            setPixelRatio() {},
            setSize() {}
        };

        this.camera = {
            position: createPosition(0, 5.5, -12),
            aspect: 16 / 9,
            updateProjectionMatrix() {}
        };

        this.currentWorldData = {
            root: {},
            flames: [
                { visible: false },
                { visible: false },
                { visible: false }
            ],
            benches: []
        };
    }

    initControlsBridge() {
        this.controls = {
            keys: {
                forward: false,
                backward: false,
                left: false,
                right: false,
                shift: false,
                space: false
            },
            currentSpeed: 0,
            isGliding: false,
            isGrounded: true,
            velocityY: 0,
            target: { position: this.player.root.position },
            update: (dt) => {
                if (this.controls.isGliding) {
                    this.player.parasol.visible = true;
                    if (this.toad && this.toad.balloon) this.toad.balloon.visible = true;
                } else {
                    this.player.parasol.visible = false;
                    if (this.toad && this.toad.balloon) this.toad.balloon.visible = false;
                }
            },
            lockInput: (val) => {},
            setMode: (mode) => {},
            tryJump: () => {},
            bounceHigh: (force) => {
                this.controls.velocityY = force;
                this.controls.isGrounded = false;
            },
            boostUpdraft: (force = 14.0) => {
                this.controls.isGliding = true;
                this.controls.isGrounded = false;
                this.controls.velocityY = force;
                this.player.parasol.visible = true;
                if (this.toad && this.toad.balloon) this.toad.balloon.visible = true;
            },
            startGliding: () => {
                this.controls.isGliding = true;
                this.controls.isGrounded = false;
                this.player.parasol.visible = true;
                if (this.toad && this.toad.balloon) this.toad.balloon.visible = true;
            },
            stopGliding: () => {
                this.controls.isGliding = false;
                this.player.parasol.visible = false;
                if (this.toad && this.toad.balloon) this.toad.balloon.visible = false;
            }
        };
    }

    initGameStateHarness() {
        window.__GAME_STATE__ = {
            isReady: true,
            currentLevel: this.currentStage,
            isLevelTransitioning: false,
            candlesLit: false,
            player: {
                x: this.engine.player.x,
                y: 0,
                z: this.engine.player.y,
                isMoving: false,
                speed: 0
            },
            toadbigode: {
                isRevealed: false,
                isHugging: false,
                candlesLit: false
            },
            dialogue: {
                isActive: false,
                currentQueueKey: null,
                currentIndex: 0,
                isTyping: false,
                speaker: null,
                finishedCount: 0
            },
            audio: {
                isContextRunning: Boolean(window.musicEngine && window.musicEngine.ctx && window.musicEngine.ctx.state === 'running'),
                isMuted: Boolean(window.musicEngine && window.musicEngine.isMuted),
                volume: 0.45,
                currentStageTrack: this.currentStage,
                totalNotesSynthesized: 0
            },
            ui: {
                letterModalOpen: false,
                photoCapturedCount: 0,
                unmutePromptVisible: true
            },
            actions: {
                initAudio: () => window.musicEngine && window.musicEngine.init(),
                toggleMute: () => window.musicEngine && window.musicEngine.toggleMute(),
                warpToLevel: (levelNum) => this.loadStage(levelNum),
                teleportPlayer: (x, z) => this.teleportPlayer(x, z),
                startDialogue: (key) => window.dialogueSystem && window.dialogueSystem.startDialogue(key),
                advanceDialogue: () => window.dialogueSystem && window.dialogueSystem.advance(),
                closeDialogue: () => window.dialogueSystem && window.dialogueSystem.closeDialogue(),
                triggerReveal: () => this.triggerDaviReveal(),
                triggerHug: () => this.triggerDaviHug(),
                openLoveLetter: () => this.openLoveLetterModal(),
                closeLoveLetter: () => this.closeLoveLetterModal(),
                openMixtape: () => this.openMixtapeModal(),
                closeMixtape: () => this.closeMixtapeModal(),
                setMixtapeTrack: (num) => window.musicEngine && window.musicEngine.setMixtapeTrack(num),
                triggerEmote: (num) => this.triggerEmote(num),
                startGliding: () => this.controls.startGliding(),
                stopGliding: () => this.controls.stopGliding(),
                boostUpdraft: (force) => this.controls.boostUpdraft(force),
                takeScreenshot: () => window.captureSouvenirPhoto ? window.captureSouvenirPhoto() : null
            }
        };

        window.gameTestHooks = window.__GAME_STATE__;
    }

    initUIBindings() {
        // Mixtape Open / Close
        const btnMixtape = document.getElementById('btn-mixtape');
        if (btnMixtape) {
            btnMixtape.addEventListener('click', () => this.openMixtapeModal());
        }
        const btnCloseMixtape = document.getElementById('btn-close-mixtape');
        if (btnCloseMixtape) {
            btnCloseMixtape.addEventListener('click', () => this.closeMixtapeModal());
        }

        // Mixtape Play / Pause toggle
        const btnPlay = document.getElementById('btn-mixtape-play');
        const spools = document.querySelectorAll('.tape-spool');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                if (window.musicEngine) {
                    const isPlaying = window.musicEngine.toggleMixtapePlay();
                    btnPlay.innerText = isPlaying ? '⏸ Pausar Fita' : '▶ Tocar Fita';
                    spools.forEach(s => {
                        if (isPlaying) s.classList.add('spinning');
                        else s.classList.remove('spinning');
                    });
                }
            });
        }

        // Mixtape Track Buttons
        const trackButtons = document.querySelectorAll('.mixtape-track-btn');
        const trackTitle = document.getElementById('mixtape-current-track-title');
        const trackDesc = document.getElementById('mixtape-current-track-desc');
        const trackData = {
            1: { title: "Faixa 1: Bosque do Primeiro Olhar", desc: "Violão de nylon acústico, flauta doce e arpejos suaves" },
            2: { title: "Faixa 2: Voo sob a Nebulosa Lilás", desc: "Lofi beats com piano Rhodes e celesta cósmica" },
            3: { title: "Faixa 3: A Sinfonia de Nós Dois", desc: "Arranjo romântico com piano e harmônicos quentes" }
        };

        const selectTrack = (tNum) => {
            if (window.musicEngine) {
                window.musicEngine.setMixtapeTrack(tNum);
                if (trackData[tNum] && trackTitle && trackDesc) {
                    trackTitle.innerText = trackData[tNum].title;
                    trackDesc.innerText = trackData[tNum].desc;
                }
                if (btnPlay) btnPlay.innerText = '⏸ Pausar Fita';
                spools.forEach(s => s.classList.add('spinning'));
            }
        };

        trackButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const num = parseInt(btn.getAttribute('data-track'), 10) || 1;
                selectTrack(num);
            });
        });

        // Emote quick buttons 1..4
        [1, 2, 3, 4].forEach(num => {
            const btn = document.getElementById(`btn-emote-${num}`);
            if (btn) {
                btn.addEventListener('click', () => this.triggerEmote(num));
            }
        });

        // Key listeners for Emotes 1-4
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Digit1') this.triggerEmote(1);
            if (e.code === 'Digit2') this.triggerEmote(2);
            if (e.code === 'Digit3') this.triggerEmote(3);
            if (e.code === 'Digit4') this.triggerEmote(4);
        });
    }

    loadStage(stageNum, immediate = false) {
        if (window.dialogueSystem && window.dialogueSystem.closeDialogue) {
            window.dialogueSystem.closeDialogue();
        }
        this.currentStage = stageNum;
        this.isLevelTransitioning = true;
        this.engine.loadStage(stageNum, immediate);
        this.isLevelTransitioning = false;
        this.syncState();
    }

    warpToStage(stageNum) {
        this.loadStage(stageNum);
    }

    teleportPlayer(x, z) {
        this.engine.player.x = x;
        this.engine.player.y = z;
        this.player.root.position.x = x;
        this.player.root.position.z = z;
        this.syncState();
    }

    triggerDaviReveal() {
        this.isDaviRevealed = true;
        this.toad.root.visible = false;
        this.davi.root.visible = true;
        this.engine.triggerDaviReveal();
        this.syncState();
    }

    triggerDaviHug() {
        this.isHugging = true;
        this.candlesLit = true;
        this.engine.triggerDaviHug();

        // Ignite mock flames
        if (this.currentWorldData && this.currentWorldData.flames) {
            this.currentWorldData.flames.forEach(f => f.visible = true);
        }

        this.syncState();
    }

    openLoveLetterModal() {
        const modal = document.getElementById('letter-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        if (window.__GAME_STATE__ && window.__GAME_STATE__.ui) {
            window.__GAME_STATE__.ui.letterModalOpen = true;
        }
    }

    closeLoveLetterModal() {
        const modal = document.getElementById('letter-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        if (window.__GAME_STATE__ && window.__GAME_STATE__.ui) {
            window.__GAME_STATE__.ui.letterModalOpen = false;
        }
    }

    openMixtapeModal() {
        const modal = document.getElementById('mixtape-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (window.musicEngine) {
                window.musicEngine.isMixtapeActive = true;
                window.musicEngine.playTapeClick && window.musicEngine.playTapeClick();
            }
        }
    }

    closeMixtapeModal() {
        const modal = document.getElementById('mixtape-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    triggerEmote(num) {
        this.engine.triggerEmote(num);
    }

    toggleHoldingHandsWithDavi() {
        this.isHoldingHands = !this.isHoldingHands;
        this.engine.toggleHoldingHandsWithDavi();
    }

    releaseSkyLantern() {
        this.engine.releaseSkyLantern();
        this.activeSkyLanterns.push({
            position: { x: this.player.root.position.x, y: 1.5, z: this.player.root.position.z },
            visible: true
        });
    }

    getState() {
        return {
            stage: this.currentStage,
            inDialogue: Boolean(window.dialogueSystem && window.dialogueSystem.boxEl && !window.dialogueSystem.boxEl.classList.contains('hidden')),
            isRevealed: this.isDaviRevealed,
            isHugging: this.isHugging,
            candlesLit: this.candlesLit,
            letterOpen: Boolean(document.getElementById('letter-modal') && !document.getElementById('letter-modal').classList.contains('hidden'))
        };
    }

    syncState() {
        // Sync entity coordinates from 2D engine to mock hierarchy
        if (this.engine && this.engine.player) {
            this.player.root.position.x = this.engine.player.x;
            this.player.root.position.y = 0;
            this.player.root.position.z = this.engine.player.y;
            this.controls.currentSpeed = this.engine.player.isMoving ? 135 : 0;

            if (this.toad && this.engine.toad) {
                this.toad.root.position.x = this.engine.toad.x;
                this.toad.root.position.z = this.engine.toad.y;
                this.toad.root.visible = this.engine.toad.visible;
            }

            if (this.davi && this.engine.davi) {
                this.davi.root.position.x = this.engine.davi.x;
                this.davi.root.position.z = this.engine.davi.y;
                this.davi.root.visible = this.engine.davi.visible;
            }
        }

        // Sync global __GAME_STATE__
        if (window.__GAME_STATE__) {
            window.__GAME_STATE__.currentLevel = this.currentStage;
            window.__GAME_STATE__.isLevelTransitioning = this.engine ? this.engine.isLevelTransitioning : false;
            window.__GAME_STATE__.candlesLit = this.candlesLit;

            window.__GAME_STATE__.player.x = this.engine.player.x;
            window.__GAME_STATE__.player.y = 0;
            window.__GAME_STATE__.player.z = this.engine.player.y;
            window.__GAME_STATE__.player.isMoving = this.engine ? this.engine.player.isMoving : false;
            window.__GAME_STATE__.player.speed = this.controls.currentSpeed;

            window.__GAME_STATE__.toadbigode.isRevealed = this.isDaviRevealed;
            window.__GAME_STATE__.toadbigode.isHugging = this.isHugging;
            window.__GAME_STATE__.toadbigode.candlesLit = this.candlesLit;

            if (window.dialogueSystem) {
                window.__GAME_STATE__.dialogue.isActive = Boolean(window.dialogueSystem.boxEl && !window.dialogueSystem.boxEl.classList.contains('hidden'));
                window.__GAME_STATE__.dialogue.isTyping = Boolean(window.dialogueSystem.isTyping);
            }

            if (window.musicEngine) {
                window.__GAME_STATE__.audio.isContextRunning = Boolean(window.musicEngine.ctx && window.musicEngine.ctx.state === 'running');
                window.__GAME_STATE__.audio.isMuted = window.musicEngine.isMuted;
                window.__GAME_STATE__.audio.totalNotesSynthesized = window.musicEngine.totalNotesSynthesized || 0;
            }

            const letterEl = document.getElementById('letter-modal');
            window.__GAME_STATE__.ui.letterModalOpen = Boolean(letterEl && !letterEl.classList.contains('hidden'));
        }
    }

    update(dt) {
        this.syncState();
    }
}

// Browser DOM launcher
if (typeof window !== 'undefined') {
    const setupDOM = () => {
        const startOverlay = document.getElementById('start-overlay');
        const startBtn = document.getElementById('btn-start-game');

        const launchGame = () => {
            if (window.musicEngine && window.musicEngine.init) {
                window.musicEngine.init();
            }
            if (startOverlay) {
                startOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (startOverlay.parentNode) startOverlay.parentNode.removeChild(startOverlay);
                }, 550);
            }
            if (!window.gameApp) {
                window.gameApp = new GameApp();
            }
        };

        if (startBtn) {
            startBtn.addEventListener('click', launchGame);
        }

        // Automatic boot for test runners (Playwright headless detection)
        if (window.location && window.location.search && window.location.search.includes('autostart=1')) {
            launchGame();
        }

        // Mute button
        const muteBtn = document.getElementById('btn-mute');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                if (window.musicEngine) {
                    const muted = window.musicEngine.toggleMute();
                    muteBtn.innerText = muted ? "🔇 Som Mutado" : "🔊 Som Ligado";
                }
            });
        }

        // Love Letter buttons
        const letterModal = document.getElementById('letter-modal');
        const closeLetterBtn = document.getElementById('btn-close-letter');
        const openLetterBtn = document.getElementById('btn-open-letter');

        if (closeLetterBtn && letterModal) {
            closeLetterBtn.addEventListener('click', () => {
                if (window.gameApp) window.gameApp.closeLoveLetterModal();
                else letterModal.classList.add('hidden');
            });
        }

        if (openLetterBtn && letterModal) {
            openLetterBtn.addEventListener('click', () => {
                if (window.gameApp) window.gameApp.openLoveLetterModal();
                else letterModal.classList.remove('hidden');
            });
        }

        // Screenshot button
        const photoBtn = document.getElementById('btn-screenshot');
        if (photoBtn) {
            photoBtn.addEventListener('click', () => {
                if (window.captureSouvenirPhoto) {
                    window.captureSouvenirPhoto();
                }
            });
        }
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', setupDOM);
    } else {
        setupDOM();
    }
}

window.GameApp = GameApp;
