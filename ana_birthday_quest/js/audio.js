// =========================================================================
// Audio Engine using 100% Procedural Web Audio API
// Nintendo Atmosphere Edition: Super Mario, The Legend of Zelda, Galaxy & Animal Crossing
// Zero external audio files (.mp3/.wav/.ogg) - Instant loading, zero CORS, zero latency.
// Tailored specifically for musician Ana Gleice: acoustic piano, nylon guitar,
// celesta, woodland flute, warm lofi tape flutter, and authentic Nintendo chiptune synthesis.
// =========================================================================

class MusicEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.volume = 0.45;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.currentStage = 1;
        this.stepCounter = 0;
        this.bgmTimer = null;
        this.totalNotesSynthesized = 0;

        // Vinyl crackle / tape warmth node
        this.vinylNode = null;
        this.vinylGain = null;

        // Mixtape Cassette Player Engine State
        this.isMixtapeActive = false;
        this.currentMixtapeTrack = 1;
        this.isTapePlaying = true;

        // Custom periodic waves cache (NES 12.5% and 25% duty cycle pulse waves)
        this.pulseWaves = {};

        // Pentatonic, Lydian and Sparkle scales for Nintendo / Zelda / Galaxy feel
        // Both stageNotes and stageScales must be defined to satisfy test contracts
        this.stageNotes = {
            1: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25], // C Major Pentatonic (Forest - Kokiri)
            2: [220.00, 277.18, 329.63, 440.00, 493.88, 554.37, 659.25, 880.00], // A Lydian Space (Galaxy - Rosalina)
            3: [261.63, 329.63, 392.00, 523.25, 587.33, 659.25, 783.99, 1046.50] // C Sparkle & Birthday Celebration
        };
        this.stageScales = this.stageNotes;

        // Bind visibility handler for tab focus/blur
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this.ctx && this.ctx.state === 'running') {
                    this.ctx.suspend().catch(() => {});
                } else if (!document.hidden && this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
                    this.ctx.resume().catch(() => {});
                }
            });
        }

        // Global user gesture unlock for autoplay browser policies
        if (typeof window !== 'undefined') {
            const unlockAudio = () => {
                if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
                    this.ctx.resume().catch(() => {});
                }
            };
            window.addEventListener('click', unlockAudio, { passive: true });
            window.addEventListener('keydown', unlockAudio, { passive: true });
            window.addEventListener('touchstart', unlockAudio, { passive: true });
        }
    }

    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return;
        }

        const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
        if (!AudioContextClass) {
            console.warn('[Audio] Web Audio API is not supported in this environment.');
            return;
        }

        this.ctx = new AudioContextClass();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);

        // Music Sub-bus
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.36, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        // SFX Sub-bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // Initialize custom Nintendo NES pulse periodic waves (12.5% & 25% duty cycles)
        this.initPulseWaves();

        // Initialize gentle vinyl warmth bed
        this.initVinylWarmth();

        // Start dynamic stage background music loop
        this.startBgmLoop();

        // Update state tracking
        if (typeof window !== 'undefined' && window.__GAME_STATE__ && window.__GAME_STATE__.audio) {
            window.__GAME_STATE__.audio.isContextRunning = true;
            window.__GAME_STATE__.audio.volume = this.volume;
            window.__GAME_STATE__.audio.isMuted = this.isMuted;
        }
    }

    initPulseWaves() {
        if (!this.ctx) return;
        try {
            // Authentic NES pulse waves using Fourier series
            [0.125, 0.25, 0.5].forEach(duty => {
                const n = 64;
                const real = new Float32Array(n);
                const imag = new Float32Array(n);
                for (let i = 1; i < n; i++) {
                    imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
                }
                this.pulseWaves[duty] = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
            });
        } catch (e) {
            // PeriodicWave fallback handled gracefully
        }
    }

    initVinylWarmth() {
        if (!this.ctx) return;
        try {
            // 2-second looped pink-noise buffer with lowpass filtering for lofi atmosphere
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                data[i] = (b0 + b1 + b2) * 0.05;
            }

            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1400;
            filter.Q.value = 1.2;

            this.vinylGain = this.ctx.createGain();
            this.vinylGain.gain.setValueAtTime(0.0035, this.ctx.currentTime); // Subtle cozy fireplace hiss

            noiseSource.connect(filter);
            filter.connect(this.vinylGain);
            this.vinylGain.connect(this.musicGain);

            noiseSource.start(0);
            this.vinylNode = noiseSource;
        } catch (e) {
            // Non-critical background ambience fallback
        }
    }

    setStage(stageNum) {
        this.currentStage = stageNum;
        if (typeof window !== 'undefined' && window.__GAME_STATE__ && window.__GAME_STATE__.audio) {
            window.__GAME_STATE__.audio.currentStageTrack = stageNum;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            const targetGain = this.isMuted ? 0 : this.volume;
            // Set synchronously so that evaluate() gets immediate value
            this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
            this.masterGain.gain.value = targetGain;
        }
        if (typeof window !== 'undefined' && window.__GAME_STATE__ && window.__GAME_STATE__.audio) {
            window.__GAME_STATE__.audio.isMuted = this.isMuted;
        }
        return this.isMuted;
    }

    // =========================================================================
    // 1. ADDITIVE HARMONIC ACOUSTIC PIANO SENSITIVE TO MUSICIAN EXPRESSION
    // =========================================================================
    playAcousticPiano(freq, duration = 2.4, velocity = 0.8, timeOffset = 0) {
        if (!this.ctx || this.isMuted) return;
        if (!isFinite(freq) || freq <= 0) return;
        const t = this.ctx.currentTime + Math.max(0, timeOffset);
        this.totalNotesSynthesized++;

        try {
            // Acoustic piano soundboard filter
            const soundboardFilter = this.ctx.createBiquadFilter();
            soundboardFilter.type = 'lowpass';
            soundboardFilter.frequency.setValueAtTime(Math.min(3200, Math.max(200, freq * 4)), t);
            soundboardFilter.frequency.exponentialRampToValueAtTime(Math.min(1200, Math.max(100, freq * 1.5)), t + duration);
            soundboardFilter.Q.setValueAtTime(1.1, t);

            const noteGain = this.ctx.createGain();
            noteGain.gain.setValueAtTime(0.0001, t);
            noteGain.gain.linearRampToValueAtTime(Math.min(1.0, velocity * 0.32), t + 0.012);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            // Additive harmonics: f0, 2f0, 3f0, 4f0, 5f0 with natural decay
            const partials = [
                { mult: 1.0, gainRatio: 1.0, decay: duration },
                { mult: 2.0, gainRatio: 0.45, decay: duration * 0.75 },
                { mult: 3.0, gainRatio: 0.22, decay: duration * 0.55 },
                { mult: 4.0, gainRatio: 0.12, decay: duration * 0.40 },
                { mult: 5.0, gainRatio: 0.05, decay: duration * 0.25 }
            ];

            partials.forEach(p => {
                const targetFreq = freq * p.mult;
                if (targetFreq > 18000) return;
                const osc = this.ctx.createOscillator();
                const pGain = this.ctx.createGain();

                osc.type = p.mult === 1 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(targetFreq, t);

                if (p.mult === 1) {
                    osc.detune.setValueAtTime((Math.random() - 0.5) * 3.0, t);
                }

                pGain.gain.setValueAtTime(p.gainRatio, t);
                pGain.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);

                osc.connect(pGain);
                pGain.connect(soundboardFilter);
                osc.start(t);
                osc.stop(t + p.decay);
            });

            // Transient hammer impact pulse
            const hammerOsc = this.ctx.createOscillator();
            const hammerGain = this.ctx.createGain();
            hammerOsc.type = 'triangle';
            hammerOsc.frequency.setValueAtTime(1600, t);
            hammerGain.gain.setValueAtTime(velocity * 0.08, t);
            hammerGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
            hammerOsc.connect(hammerGain);
            hammerGain.connect(soundboardFilter);
            hammerOsc.start(t);
            hammerOsc.stop(t + 0.025);

            soundboardFilter.connect(noteGain);
            noteGain.connect(this.musicGain);
        } catch (e) {}
    }

    // =========================================================================
    // 2. NYLON GUITAR ARPEGGIO PLUCKS (PASTORAL ZELDA BOSQUE VIBE)
    // =========================================================================
    playNylonPluck(freq, duration = 1.6, velocity = 0.7, timeOffset = 0) {
        if (!this.ctx || this.isMuted) return;
        if (!isFinite(freq) || freq <= 0) return;
        const t = this.ctx.currentTime + Math.max(0, timeOffset);
        this.totalNotesSynthesized++;

        try {
            const pluckFilter = this.ctx.createBiquadFilter();
            pluckFilter.type = 'lowpass';
            pluckFilter.frequency.setValueAtTime(Math.min(3600, freq * 5), t);
            pluckFilter.frequency.exponentialRampToValueAtTime(Math.min(500, freq * 1.8), t + 0.15);
            pluckFilter.Q.setValueAtTime(2.0, t);

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq * 1.007, t);
            osc.frequency.exponentialRampToValueAtTime(freq, t + 0.035);

            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(velocity * 0.28, t + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            osc.connect(pluckFilter);
            pluckFilter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(t);
            osc.stop(t + duration);
        } catch (e) {}
    }

    // =========================================================================
    // 3. WOODLAND FLUTE / OCARINA (THE LEGEND OF ZELDA - KOKIRI FOREST VIBE)
    // =========================================================================
    playWoodlandFlute(freq, duration = 2.0, velocity = 0.65, timeOffset = 0) {
        if (!this.ctx || this.isMuted) return;
        if (!isFinite(freq) || freq <= 0) return;
        const t = this.ctx.currentTime + Math.max(0, timeOffset);
        this.totalNotesSynthesized++;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            // Expressive gentle vibrato (5.2Hz LFO) with delayed onset (breath simulation)
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(5.2, t);
            lfoGain.gain.setValueAtTime(0.001, t);
            lfoGain.gain.setValueAtTime(0.001, t + 0.12);
            lfoGain.gain.linearRampToValueAtTime(4.5, t + 0.35); // 4.5Hz vibrato depth
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2800, t);
            filter.Q.setValueAtTime(1.2, t);

            // Flute breath envelope: soft attack, sustained body, gentle release
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(velocity * 0.24, t + 0.06);
            gain.gain.setValueAtTime(velocity * 0.22, t + duration * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(t);
            lfo.start(t);
            osc.stop(t + duration);
            lfo.stop(t + duration);
        } catch (e) {}
    }

    // =========================================================================
    // 4. CELESTA / STARLIGHT MUSIC BOX (SUPER MARIO GALAXY - ROSALINA VIBE)
    // =========================================================================
    playCelesta(freq, duration = 1.8, velocity = 0.6, timeOffset = 0) {
        if (!this.ctx || this.isMuted) return;
        if (!isFinite(freq) || freq <= 0) return;
        const t = this.ctx.currentTime + Math.max(0, timeOffset);
        this.totalNotesSynthesized++;

        try {
            // Dual crystal sine tones with metallic overtone
            const freqs = [
                { f: freq, gain: 1.0 },
                { f: freq * 2.76, gain: 0.18 }, // metallic bell chime partial
                { f: freq * 4.0, gain: 0.08 }
            ];

            const noteGain = this.ctx.createGain();
            noteGain.gain.setValueAtTime(0.0001, t);
            noteGain.gain.linearRampToValueAtTime(velocity * 0.22, t + 0.006);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            freqs.forEach(item => {
                if (item.f > 18000) return;
                const osc = this.ctx.createOscillator();
                const partGain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(item.f, t);
                partGain.gain.setValueAtTime(item.gain, t);

                osc.connect(partGain);
                partGain.connect(noteGain);
                osc.start(t);
                osc.stop(t + duration);
            });

            noteGain.connect(this.musicGain);
        } catch (e) {}
    }

    // =========================================================================
    // 5. LOFI SYNTH PAD WITH WARM TAPE WOW & FLUTTER LFO
    // =========================================================================
    playLofiPad(freq, duration = 3.5, timeOffset = 0, gainLevel = 0.12) {
        if (!this.ctx || this.isMuted) return;
        if (!isFinite(freq) || freq <= 0) return;
        const t = this.ctx.currentTime + Math.max(0, timeOffset);
        this.totalNotesSynthesized++;

        try {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(540, t);
            filter.Q.setValueAtTime(0.9, t);

            const padGain = this.ctx.createGain();
            padGain.gain.setValueAtTime(0.0001, t);
            padGain.gain.linearRampToValueAtTime(gainLevel, t + 0.6); // Soft warm swell
            padGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            // Wow & Flutter LFO (Tape K7 modulation at 0.45 Hz)
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.45, t);
            lfoGain.gain.setValueAtTime(3.5, t); // +/- 3.5 cents
            lfo.connect(lfoGain);

            // 2 Detuned Sawtooth Oscillators
            [-7.5, 7.5].forEach(detune => {
                const osc = this.ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);
                osc.detune.setValueAtTime(detune, t);
                lfoGain.connect(osc.detune);

                osc.connect(filter);
                osc.start(t);
                osc.stop(t + duration);
            });

            lfo.start(t);
            lfo.stop(t + duration);

            filter.connect(padGain);
            padGain.connect(this.musicGain);
        } catch (e) {}
    }

    // =========================================================================
    // 6. ROUND NINTENDO WALKING BASS (KOJI KONDO STYLE TRIANGLE BASS)
    // =========================================================================
    playPulseBass(freq, duration = 0.8, velocity = 0.65, timeOffset = 0) {
        if (!this.ctx || this.isMuted) return;
        if (!isFinite(freq) || freq <= 0) return;
        const t = this.ctx.currentTime + Math.max(0, timeOffset);
        this.totalNotesSynthesized++;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, t);
            filter.Q.setValueAtTime(1.4, t);

            // Punchy bass envelope with warm sustain
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(velocity * 0.35, t + 0.006);
            gain.gain.setValueAtTime(velocity * 0.26, t + duration * 0.5);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(t);
            osc.stop(t + duration);
        } catch (e) {}
    }

    // =========================================================================
    // 7. BELL & GENERAL PURPOSE CHIME (SAFE FOR HIGH/LOW FREQUENCY EXTREMES)
    // =========================================================================
    playBell(freq, duration = 1.8, timeOffset = 0, gainLevel = 0.25) {
        if (!this.ctx || this.isMuted) return;
        // Clamp frequency safely between 20Hz and 16000Hz to prevent Web Audio exceptions
        const safeFreq = Math.min(16000, Math.max(20, Number(freq) || 440));
        this.playAcousticPiano(safeFreq, duration, gainLevel * 3.0, timeOffset);
    }

    // =========================================================================
    // 8. ANIMAL CROSSING / ZELDA PENTATONIC SPEECH BLIPS ("ANIMALESE")
    // =========================================================================
    playDialogueBlip(pitch = 1.0) {
        if (!this.ctx || this.isMuted) return;
        // Safe clamp for pitch input
        const safePitch = Math.min(6.0, Math.max(0.1, Number(pitch) || 1.0));
        const t = this.ctx.currentTime;
        this.totalNotesSynthesized++;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            // Pentatonic mapped pitch based on speaker character
            const baseFreq = Math.min(2200, Math.max(120, 380 * safePitch + (Math.random() * 40 - 20)));

            if (this.pulseWaves[0.25]) {
                osc.setPeriodicWave(this.pulseWaves[0.25]); // Authentic vintage Nintendo voice
            } else {
                osc.type = safePitch > 1.1 ? 'triangle' : 'sine';
            }

            osc.frequency.setValueAtTime(baseFreq, t);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.22, t + 0.05);

            // Vocal formant filter (mimicking Animal Crossing speech)
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(safePitch > 1.1 ? 1400 : 850, t);
            filter.Q.setValueAtTime(3.2, t);

            gain.gain.setValueAtTime(0.09, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.06);
        } catch (e) {}
    }

    // =========================================================================
    // 9. ICONIC NINTENDO SOUND EFFECTS SUITE
    // =========================================================================

    // A. Mario Jump (Upward Frequency Sweep)
    playJumpSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        this.totalNotesSynthesized++;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            if (this.pulseWaves[0.5]) {
                osc.setPeriodicWave(this.pulseWaves[0.5]);
            } else {
                osc.type = 'square';
            }

            // Classic Mario jump pitch sweep from 145Hz to 580Hz
            osc.frequency.setValueAtTime(145, t);
            osc.frequency.exponentialRampToValueAtTime(580, t + 0.16);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2200, t);

            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.18);
        } catch (e) {}
    }

    // B. Spring Bounce Sound
    playBounceSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        this.totalNotesSynthesized++;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, t);
            osc.frequency.exponentialRampToValueAtTime(820, t + 0.28);
            gain.gain.setValueAtTime(0.24, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.29);
        } catch (e) {}
    }

    // C. Mario Coin Sound (Staccato 2-Note Arpeggio: B5 -> E6)
    playCoinSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const coinNotes = [
            { freq: 987.77, start: 0, dur: 0.08 },     // B5
            { freq: 1318.51, start: 0.075, dur: 0.38 }  // E6
        ];

        coinNotes.forEach(n => {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                if (this.pulseWaves[0.5]) {
                    osc.setPeriodicWave(this.pulseWaves[0.5]);
                } else {
                    osc.type = 'sine';
                }
                osc.frequency.setValueAtTime(n.freq, t + n.start);

                gain.gain.setValueAtTime(0.18, t + n.start);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + n.start + n.dur);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(t + n.start);
                osc.stop(t + n.start + n.dur);
                this.totalNotesSynthesized++;
            } catch (e) {}
        });
    }

    // D. The Legend of Zelda Secret Discovery Chime (8-note magical chime)
    playZeldaSecret() {
        if (!this.ctx || this.isMuted) return;
        const chimeNotes = [783.99, 739.99, 622.25, 440.00, 415.30, 659.25, 830.61, 1046.50];
        const t = this.ctx.currentTime;
        const step = 0.09;

        chimeNotes.forEach((freq, i) => {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = t + (i * step);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.22, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.45);
                this.totalNotesSynthesized++;
            } catch (e) {}
        });
    }

    // E. Note Collect Sound (Zelda / Galaxy Melodic chime)
    playNoteCollectSound(idx = 0) {
        if (!this.ctx || this.isMuted) return;
        const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        const freq = scale[idx % scale.length];
        this.playCelesta(freq, 1.8, 0.6);
        this.playSparkle();
    }

    // F. Star Bit Sound (Super Mario Galaxy)
    playStarBitSound(idx = 0) {
        if (!this.ctx || this.isMuted) return;
        const scale = [659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
        const freq = scale[idx % scale.length];
        this.playCelesta(freq, 1.6, 0.55);
        this.playCoinSound();
    }

    // G. Kirby Inhale Sound
    playKirbyInhaleSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(420, t);
            osc.frequency.linearRampToValueAtTime(170, t + 0.45);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.46);
            this.totalNotesSynthesized++;
        } catch (e) {}
    }

    // H. Kirby Spit Sound
    playKirbySpitSound() {
        if (!this.ctx || this.isMuted) return;
        this.playFanfare();
    }

    // I. Yoshi / Mario Cute Footsteps (Gentle Soft Sound)
    playStepSound() {
        if (!this.ctx || this.isMuted) return;
        const notes = [329.63, 392.00, 440.00, 523.25]; // E4, G4, A4, C5
        const freq = notes[this.stepCounter % notes.length];
        this.stepCounter++;

        const t = this.ctx.currentTime;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * 0.75, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.08);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(420, t);

            gain.gain.setValueAtTime(0.045, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.09);
            this.totalNotesSynthesized++;
        } catch (e) {}
    }

    // J. Starlight Sparkle Arpeggio
    playSparkle() {
        if (!this.ctx || this.isMuted) return;
        const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        arpeggio.forEach((f, idx) => {
            this.playCelesta(f, 1.4, 0.4, idx * 0.07);
        });
    }

    // K. Davi / Toadbigode Reveal Sound (Magical Transformation Poof + Zelda Discovery)
    playRevealSound() {
        this.playMagicPoof();
        this.playPowerUp();
    }

    playMagicPoof() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;

        try {
            // White noise magical poof whoosh
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2600, t);
            filter.frequency.exponentialRampToValueAtTime(180, t + 0.35);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            noise.start(t);

            // Warm confirmation bell chord
            this.playAcousticPiano(261.63, 2.2, 0.45, 0.05);
            this.playAcousticPiano(392.00, 2.2, 0.40, 0.09);
            this.playAcousticPiano(523.25, 2.5, 0.50, 0.14);
        } catch (e) {}
    }

    // L. Nintendo Power-Up / Super Star Sparkling Arpeggio
    playPowerUp() {
        if (!this.ctx || this.isMuted) return;
        const freqs = [329.63, 392.00, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66, 1318.51];
        const t = this.ctx.currentTime;
        const noteStep = 0.045;

        freqs.forEach((freq, idx) => {
            try {
                [-5, 5].forEach(detune => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const noteTime = t + (idx * noteStep);

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, noteTime);
                    osc.detune.setValueAtTime(detune, noteTime);

                    gain.gain.setValueAtTime(0.14, noteTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.22);

                    osc.connect(gain);
                    gain.connect(this.sfxGain);

                    osc.start(noteTime);
                    osc.stop(noteTime + 0.23);
                    this.totalNotesSynthesized++;
                });
            } catch (e) {}
        });
    }

    // M. Candle Lighting Whoosh
    playCandleLightSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.exponentialRampToValueAtTime(920, t + 0.2);

            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.26);

            // Shimmering fairy dust bell
            this.playCelesta(1046.50, 1.2, 0.45, 0.08);
            this.playCelesta(1318.51, 1.4, 0.40, 0.16);
            this.totalNotesSynthesized++;
        } catch (e) {}
    }

    // N. Nintendo Triumphant Fanfare (Mario Stage Clear & Zelda Cadence)
    playFanfare() {
        if (!this.ctx || this.isMuted) return;
        // Iconic Nintendo triumphant cadence: bVI -> bVII -> I (Ab -> Bb -> C)
        const chords = [
            { bass: 207.65, notes: [415.30, 523.25, 622.25], time: 0.0, dur: 0.28 },   // Ab Maj
            { bass: 233.08, notes: [466.16, 587.33, 698.46], time: 0.32, dur: 0.28 },  // Bb Maj
            { bass: 261.63, notes: [523.25, 659.25, 783.99, 1046.50], time: 0.65, dur: 1.8 } // C Maj7 (Triumph!)
        ];

        chords.forEach(c => {
            this.playPulseBass(c.bass, c.dur, 0.7, c.time);
            c.notes.forEach((n, idx) => {
                this.playAcousticPiano(n, c.dur, 0.55, c.time + idx * 0.02);
                this.playCelesta(n, c.dur, 0.4, c.time + idx * 0.02);
            });
        });
    }

    // =========================================================================
    // 10. BIRTHDAY CELEBRATION HYMN ("Parabéns pra Você" in Nintendo Jazz Waltz)
    // =========================================================================
    playBirthdayHymn() {
        if (!this.ctx || this.isMuted) return;
        const melody = [
            { f: 392.00, d: 0.32, pause: 0.38 }, // Sol
            { f: 392.00, d: 0.22, pause: 0.28 }, // Sol
            { f: 440.00, d: 0.52, pause: 0.58 }, // La
            { f: 392.00, d: 0.52, pause: 0.58 }, // Sol
            { f: 523.25, d: 0.62, pause: 0.68 }, // Do
            { f: 493.88, d: 0.95, pause: 1.05 }, // Si

            { f: 392.00, d: 0.32, pause: 0.38 }, // Sol
            { f: 392.00, d: 0.22, pause: 0.28 }, // Sol
            { f: 440.00, d: 0.52, pause: 0.58 }, // La
            { f: 392.00, d: 0.52, pause: 0.58 }, // Sol
            { f: 587.33, d: 0.62, pause: 0.68 }, // Re
            { f: 523.25, d: 0.95, pause: 1.05 }, // Do

            { f: 392.00, d: 0.32, pause: 0.38 }, // Sol
            { f: 392.00, d: 0.22, pause: 0.28 }, // Sol
            { f: 783.99, d: 0.55, pause: 0.60 }, // Sol alto
            { f: 659.25, d: 0.55, pause: 0.60 }, // Mi
            { f: 523.25, d: 0.55, pause: 0.60 }, // Do
            { f: 493.88, d: 0.55, pause: 0.60 }, // Si
            { f: 440.00, d: 0.85, pause: 0.95 }, // La

            { f: 698.46, d: 0.35, pause: 0.40 }, // Fa
            { f: 698.46, d: 0.25, pause: 0.30 }, // Fa
            { f: 659.25, d: 0.55, pause: 0.60 }, // Mi
            { f: 523.25, d: 0.55, pause: 0.60 }, // Do
            { f: 587.33, d: 0.65, pause: 0.70 }, // Re
            { f: 523.25, d: 1.50, pause: 1.60 }, // Do final
        ];

        let offset = 0;
        melody.forEach(n => {
            // Main lyrical acoustic piano
            this.playAcousticPiano(n.f, n.d * 2.2, 0.58, offset);
            // Celesta sparkle doubling
            this.playCelesta(n.f, n.d * 1.8, 0.32, offset);
            // Accompaniment bass note
            this.playPulseBass(n.f / 2, n.d * 2.4, 0.42, offset);
            offset += n.pause;
        });

        // Ending flourish with Zelda Discovery chime
        setTimeout(() => {
            if (!this.isMuted) {
                this.playZeldaSecret();
            }
        }, offset * 1000 + 400);
    }

    // =========================================================================
    // 11. DYNAMIC PROCEDURAL BGM ENGINE (NINTENDO 3-STAGE ADAPTIVE SOUNDTRACK)
    // =========================================================================
    startBgmLoop() {
        const progressions = {
            1: [
                // Level 1: Bosque das Melodias (The Legend of Zelda - Kokiri Forest / Lost Woods pastoral vibe)
                // Progression: C Maj7 -> F Maj7 -> Dm7 -> G7
                { bass: 130.81, chords: [261.63, 329.63, 392.00, 493.88], lead: 523.25, type: 'forest' },
                { bass: 174.61, chords: [261.63, 349.23, 440.00, 523.25], lead: 587.33, type: 'forest' },
                { bass: 146.83, chords: [293.66, 349.23, 440.00, 523.25], lead: 659.25, type: 'forest' },
                { bass: 196.00, chords: [293.66, 392.00, 493.88, 587.33], lead: 493.88, type: 'forest' },
            ],
            2: [
                // Level 2: O Planetário dos Sonhos Cósmicos (Super Mario Galaxy - Rosalina's Comet Observatory)
                // Lydian Space 3/4 Waltz: A Maj -> B/A -> C#m -> D Maj7(#11)
                { bass: 220.00, chords: [329.63, 440.00, 554.37], lead: 659.25, type: 'galaxy' },
                { bass: 246.94, chords: [369.99, 493.88, 622.25], lead: 739.99, type: 'galaxy' },
                { bass: 277.18, chords: [415.30, 554.37, 659.25], lead: 830.61, type: 'galaxy' },
                { bass: 146.83, chords: [293.66, 369.99, 440.00, 587.33], lead: 880.00, type: 'galaxy' },
            ],
            3: [
                // Level 3: O Jardim do Luar (Animal Crossing peaceful night + Mario RPG love theme)
                // Romantic Progression: C Maj7 -> F Maj7 -> Am7 -> G sus
                { bass: 130.81, chords: [261.63, 329.63, 392.00, 523.25], lead: 659.25, type: 'moonlit' },
                { bass: 174.61, chords: [261.63, 349.23, 440.00, 523.25], lead: 783.99, type: 'moonlit' },
                { bass: 220.00, chords: [261.63, 329.63, 392.00, 440.00], lead: 659.25, type: 'moonlit' },
                { bass: 196.00, chords: [293.66, 392.00, 523.25, 587.33], lead: 523.25, type: 'moonlit' },
            ]
        };

        let stepIndex = 0;
        const tick = () => {
            if (this.ctx && !this.isMuted) {
                // If mixtape player is paused, skip synthesis
                if (this.isMixtapeActive && !this.isTapePlaying) {
                    this.bgmTimer = setTimeout(tick, 1000);
                    return;
                }

                const trackToPlay = this.isMixtapeActive ? this.currentMixtapeTrack : this.currentStage;
                const stageList = progressions[trackToPlay] || progressions[1];
                const item = stageList[stepIndex % stageList.length];
                stepIndex++;

                if (item.type === 'forest') {
                    // Zelda Forest: Round walking bass + nylon guitar arpeggios + wood flute lead
                    this.playPulseBass(item.bass, 2.6, 0.48, 0);
                    item.chords.forEach((note, idx) => {
                        this.playNylonPluck(note, 2.2, 0.34, 0.32 + idx * 0.32);
                    });
                    // Ocarina / Woodland flute gentle melodic phrase
                    this.playWoodlandFlute(item.lead, 2.4, 0.42, 1.3);

                } else if (item.type === 'galaxy') {
                    // Mario Galaxy: Floating Lofi pad + starlight celesta bells in 3/4 waltz rhythm
                    this.playLofiPad(item.bass, 3.8, 0, 0.15);
                    this.playPulseBass(item.bass, 1.8, 0.42, 0);
                    item.chords.forEach((note, idx) => {
                        this.playCelesta(note, 2.6, 0.38, idx * 0.38);
                        this.playAcousticPiano(note, 2.8, 0.28, 0.4 + idx * 0.38);
                    });
                    // High starlight celesta bell note
                    this.playCelesta(item.lead, 2.2, 0.35, 1.8);

                } else {
                    // Jardim do Luar: Romantic piano waltz + gentle celesta sparkles
                    this.playAcousticPiano(item.bass, 3.4, 0.52, 0);
                    this.playPulseBass(item.bass / 2, 2.5, 0.35, 0);
                    item.chords.forEach((note, idx) => {
                        this.playAcousticPiano(note, 2.8, 0.32, 0.28 + idx * 0.28);
                    });
                    // Melodic shimmer
                    this.playCelesta(item.lead, 2.4, 0.35, 1.6);
                }
            }

            this.bgmTimer = setTimeout(tick, 3200);
        };

        tick();
    }

    // =========================================================================
    // 7. MIXTAPE & FLIGHT INTERACTIVE SOUND FX
    // =========================================================================

    // Subtle rushing wind for flight & gliding
    playWindRush(intensity = 0.5) {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(70 + intensity * 60, t);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320 + intensity * 380, t);

            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(Math.min(0.08, 0.025 * intensity), t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.4);
        } catch (e) {}
    }

    // Soft fabric pop and harp ping when opening celestial parasol
    playGliderOpenSound() {
        if (!this.ctx || this.isMuted) return;
        this.playWindRush(1.2);
        this.playCelesta(880.0, 1.2, 0.4, 0.05);
    }

    // Updraft thermal wind and ascending harp surge
    playUpdraftSound() {
        if (!this.ctx || this.isMuted) return;
        this.playWindRush(1.8);
        const notes = [329.63, 392.00, 523.25, 659.25, 783.99]; // E4, G4, C5, E5, G5
        notes.forEach((freq, idx) => {
            this.playAcousticPiano(freq, 1.8, 0.42, idx * 0.08);
            this.playCelesta(freq * 1.5, 1.4, 0.32, idx * 0.08);
        });
    }

    // Celestial crystal chime when passing through melody rings
    playRingChime(ringIndex = 0) {
        if (!this.ctx || this.isMuted) return;
        const scale = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
        const freq = scale[ringIndex % scale.length];
        this.playCelesta(freq, 2.4, 0.55, 0);
        this.playAcousticPiano(freq, 2.0, 0.4, 0);
        this.playCelesta(freq * 1.5, 1.6, 0.3, 0.1);
    }

    // Harp strum for musical emote
    playHarpPluck() {
        if (!this.ctx || this.isMuted) return;
        const chord = [261.63, 329.63, 392.00, 523.25, 659.25]; // C Maj
        chord.forEach((freq, idx) => {
            this.playNylonPluck(freq, 2.4, 0.45, idx * 0.08);
        });
    }

    // Joyful sparkling chime for pirouette emote
    playPirouetteChime() {
        if (!this.ctx || this.isMuted) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((n, idx) => {
            this.playCelesta(n, 1.4, 0.38, idx * 0.06);
        });
    }

    // 4-hand piano duet chord when walking hand-in-hand with Davi
    playDuetChord(keyIndex = 0) {
        if (!this.ctx || this.isMuted) return;
        const roots = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63];
        const root = roots[keyIndex % roots.length];
        this.playAcousticPiano(root, 3.2, 0.55, 0);
        this.playAcousticPiano(root * 2, 2.8, 0.42, 0.04);
        this.playAcousticPiano(root * 2.5, 2.8, 0.42, 0.08);
        this.playAcousticPiano(root * 3, 2.8, 0.48, 0.12);
    }

    // Resonant singing bowl chime when releasing sky lantern
    playLanternSound() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(432, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.28, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 4.3);
        } catch (e) {}
    }

    // Mechanical cassette tape button click
    playTapeClick() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1100, t);
            osc.frequency.exponentialRampToValueAtTime(160, t + 0.04);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.05);
        } catch (e) {}
    }

    // Mixtape Player Track Selection
    setMixtapeTrack(trackNum) {
        this.isMixtapeActive = true;
        this.currentMixtapeTrack = trackNum;
        this.playTapeClick();
    }

    toggleMixtapePlay() {
        this.isTapePlaying = !this.isTapePlaying;
        this.playTapeClick();
        return this.isTapePlaying;
    }
}

// Global exposure adhering to PROJECT.md interface contracts
if (typeof window !== 'undefined') {
    window.musicEngine = new MusicEngine();
}
