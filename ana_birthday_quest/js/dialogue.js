// Story Script and Typewriter Dialogue Controller for "A Sinfonia de Ana Gleice"
// Delivers the 3 Reasons for Love, Toadbigode's revelation, and the emotional climax.

const DIALOGUES = {
    // ==========================================
    // FASE 1: O BOSQUE DAS MELODIAS (ZELDA / GHIBLI VIBE)
    // ==========================================
    stage1_intro: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            text: "Olá, senhorita Ana Gleice! Seja muito bem-vinda ao Bosque das Melodias Encantadas, onde cada brisa sopra em perfeita afinação!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            text: "Como conselheiro oficial deste reino, recebi a missão mais nobre e doce de alguém cujo coração bate em compasso com o seu..."
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            text: "Hoje é o seu dia mais especial do ano! E ao longo desta caminhada, revelarei 3 segredos guardados a sete chaves."
        }
    ],
    stage1_shrine: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            text: "Veja este Altar da Harpa Ancestral... Suas cordas douradas vibram sozinhas sempre que uma alma verdadeiramente musical se aproxima!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "💌",
            text: "Sob as copas floridas deste bosque, revelo o PRIMEIRO MOTIVO pelo qual o Davi se apaixona por você a cada novo amanhecer:"
        },
        {
            speaker: "letter",
            name: "Carta do Coração • Motivo #1",
            avatar: "🎼",
            highlight: true,
            text: "«Ana, o seu dom com a música não é apenas talento: é a forma mais pura de poesia que já vi. Ver a paixão e a luz nos seus olhos quando você toca e ouve cada acorde me faz ter a certeza de que você transforma o mundo ao seu redor num lugar mais acolhedor, doce e vibrante. Eu me apaixono por essa sua sensibilidade todos os dias, e cada nota sua compõe a melodia mais preciosa da minha vida.»"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            text: "Que lindo e emocionante, senhorita Ana! Agora dê mais alguns passos em direção ao Portal de Estrelas para cruzarmos a galáxia!"
        }
    ],

    // ==============================================
    // FASE 2: O PLANETÁRIO DOS SONHOS CÓSMICOS (GALAXY)
    // ==============================================
    stage2_intro: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🪐",
            text: "Uau! Olhe só onde viemos parar! Estamos no Planetário dos Sonhos Cósmicos, onde as constelações dançam ao som dos nossos passos!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "✨",
            text: "Cada pequena estrela que brilha nesta nebulosa representa um sorriso que você já colocou no rosto do Davi e uma lembrança inesquecível de vocês."
        }
    ],
    stage2_constellation: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "💌",
            text: "Chegamos ao Anel de Poeira Estelar da Harpa Celeste! É hora de contemplar o SEGUNDO MOTIVO deste grande amor:"
        },
        {
            speaker: "letter",
            name: "Carta do Coração • Motivo #2",
            avatar: "⭐",
            highlight: true,
            text: "«O segundo motivo é a sua força serena e a sua doçura infinita. Mesmo nos dias mais difíceis e cansativos, a sua voz acolhedora e o calor do seu abraço têm o poder cósmico de acalmar qualquer tempestade dentro de mim. Você é a minha estrela-guia, meu refúgio seguro e a pessoa mais admirável que conheço. Seu sorriso tem o brilho suave que ilumina qualquer escuridão.»"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            text: "Prepare o coração, Ana... As estrelas estão se alinhando rumo ao Palácio de Cristal de Aniversário! O momento mais especial nos aguarda!"
        }
    ],

    // ======================================================
    // FASE 3: O PALÁCIO DAS CEREJEIRAS & O GRANDE ABRAÇO
    // ======================================================
    stage3_intro: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🎂",
            text: "Seja muito bem-vinda ao Palácio das Cerejeiras de Aniversário! Olhe aquele bolo gigante ali na frente, cercado por pétalas de sakura!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🎹",
            text: "O caminho até lá é feito de teclas de piano mágicas. Cada passo seu toca uma harmonia de parabéns afinada com todo o amor do mundo!"
        }
    ],
    stage3_climax: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            instant: true,
            text: "Ana... antes de você soprar as velinhas do seu bolo e fazer o seu pedido, eu preciso te contar o maior e mais lindo segredo deste reino..."
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "✨",
            text: "Eu nunca fui apenas um conselheiro... Eu estive ao seu lado em cada compasso desta sinfonia porque queria ver o brilho de felicidade nos seus olhos. E quem esteve cuidando de tudo com todo o carinho..."
        },
        {
            speaker: "davi",
            name: "Davi Nascimento (Toadbigode Revelado!)",
            avatar: "💙",
            isReveal: true,
            instant: true,
            text: "SEMPRE FUI EU, MEU AMOR! Eu planejei cada detalhe deste mundinho 3D para fazer você sorrir no seu aniversário!"
        },
        {
            speaker: "davi",
            name: "Davi Nascimento",
            avatar: "🫂",
            isHug: true,
            instant: true,
            text: "Davi aperta Ana num abraço quentinho! Vem cá, minha princesa, me dar um abraço bem apertado e quentinho! (Davi envolve Ana num abraço carinhoso com estrelas flutuantes e chuva de confetes!)"
        },
        {
            speaker: "letter",
            name: "Carta de Amor & Parabéns • Motivo #3",
            avatar: "💖",
            highlight: true,
            text: "«Meu amor, Ana Gleice Almeida de Oliveira: o terceiro e maior motivo é a certeza de que a minha vida só faz sentido completo quando compartilhada com você. Quero ouvir todas as suas músicas, vibrar com cada conquista sua, rir das nossas brincadeiras e segurar a sua mão em todos os aniversários que o tempo nos der. Feliz Aniversário, minha musicista favorita e meu grande amor! Eu te amo daqui até o infinito!»"
        }
    ],

    // ======================================================
    // DIÁLOGOS AMIGÁVEIS E DICAS DO TOADBIGODE AO INTERAGIR
    // ======================================================
    toad_chat_stage1: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🍄",
            text: "Olá de novo, senhorita Ana! Que dia radiante para passear pelo Bosque das Melodias!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🌸",
            text: "O Davi me contou que você tem um dom musical divino. Cada folha que cai nesta ilha dança no ritmo do seu talento!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "✨",
            text: "Dica de ouro: pule e abra seu Guarda-Chuva Celestial no ar para planar sobre o bosque! E caminhe até a Harpa Sagrada logo à frente."
        }
    ],
    toad_chat_stage2: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🪐",
            text: "Veja só este planetóide cósmico, senhorita Ana! Estamos flutuando entre as estrelas mais brilhantes do universo!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "💫",
            text: "O Davi sempre diz que o seu sorriso ilumina qualquer noite escura. Experimente planar pelas nebulosas lilases, a gravidade aqui é tão suave e mágica!"
        }
    ],
    toad_chat_stage3: [
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "🎂",
            text: "O Palácio das Cerejeiras está radiante para o seu aniversário, senhorita Ana!"
        },
        {
            speaker: "toadbigode",
            name: "Toadbigode (Conselheiro Real)",
            avatar: "💖",
            text: "Suba os degraus do piano musical até o bolo gigante... Tem uma revelação especial que vai tocar fundo no seu coração!"
        }
    ]
};

class DialogueSystem {
    constructor() {
        this.boxEl = null;
        this.nameEl = null;
        this.avatarEl = null;
        this.textEl = null;
        this.promptEl = null;

        this.currentQueueKey = null;
        this.currentQueue = [];
        this.currentIndex = 0;
        this.isTyping = false;
        this.typeTimer = null;
        this.onFinishCallback = null;
        this.finishedCount = 0;
        this.justClosed = false;

        if (typeof document !== 'undefined') {
            this.initDOM();
            this.initEvents();
        }
    }

    initDOM() {
        this.boxEl = document.getElementById('dialogue-box');
        this.nameEl = document.getElementById('dialogue-name');
        this.avatarEl = document.getElementById('dialogue-avatar');
        this.textEl = document.getElementById('dialogue-text');
        this.promptEl = document.getElementById('dialogue-prompt');
        this.advanceBtn = document.getElementById('btn-dialogue-advance');
        this.closeBtn = document.getElementById('btn-dialogue-close');
    }

    initEvents() {
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
                    if (this.boxEl && !this.boxEl.classList.contains('hidden')) {
                        this.advance();
                    }
                }
            });
        }

        if (this.boxEl && typeof this.boxEl.addEventListener === 'function') {
            this.boxEl.addEventListener('click', (e) => {
                if (e.target && e.target.closest('#btn-dialogue-close')) return;
                this.advance();
            });
        }

        if (this.advanceBtn) {
            this.advanceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.advance();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeDialogue();
            });
        }
    }

    updateAdvanceButton() {
        if (!this.advanceBtn) return;
        if (this.isTyping) {
            this.advanceBtn.innerText = "Pular ⏭";
        } else if (this.currentQueue && this.currentIndex >= this.currentQueue.length - 1) {
            this.advanceBtn.innerText = "Concluir ✓";
        } else {
            this.advanceBtn.innerText = "Avançar ▶";
        }
    }

    startDialogue(queueKey, onFinish = null) {
        if (!this.boxEl) this.initDOM();

        const queue = DIALOGUES[queueKey];
        if (!queue || queue.length === 0) return;

        this.currentQueueKey = queueKey;
        this.currentQueue = queue;
        this.currentIndex = 0;
        this.onFinishCallback = onFinish;
        this._skipMode = false;

        if (this.boxEl) {
            this.boxEl.classList.remove('hidden');
            this.boxEl.classList.add('flex');
        }

        const promptHUD = document.getElementById('interaction-prompt');
        if (promptHUD) promptHUD.classList.add('hidden');

        // Lock movement while in dialogue
        if (window.gameApp && window.gameApp.controls) {
            window.gameApp.controls.setMode('DIALOGUE');
        }

        this.updateState();
        this.displayCurrent();
    }

    displayCurrent() {
        if (this.currentIndex >= this.currentQueue.length) {
            this.closeDialogue();
            return;
        }

        const msg = this.currentQueue[this.currentIndex];
        if (this.nameEl) this.nameEl.innerText = msg.name;
        if (this.avatarEl) this.avatarEl.innerText = msg.avatar;

        if (this.boxEl) {
            if (msg.highlight) {
                this.boxEl.style.borderColor = '#ec4899';
                this.boxEl.style.background = 'linear-gradient(135deg, rgba(30, 20, 45, 0.95), rgba(45, 20, 50, 0.95))';
            } else {
                this.boxEl.style.borderColor = '#fbbf24';
                this.boxEl.style.background = 'rgba(20, 24, 38, 0.92)';
            }
        }

        // Trigger special game events during dialogue
        if (msg.isReveal && window.gameApp) {
            window.gameApp.triggerDaviReveal();
        }
        if (msg.isHug && window.gameApp) {
            window.gameApp.triggerDaviHug();
        }

        // Typewriter effect (Highlights/Love Letters render instantly for readability & accessibility)
        if (msg.highlight || msg.instant || this._skipMode) {
            this.isTyping = false;
            if (this.textEl) this.textEl.innerHTML = msg.text;
            if (this.promptEl) this.promptEl.style.opacity = '1';
            this.updateAdvanceButton();
            this.updateState();
            return;
        }

        this.isTyping = true;
        if (this.textEl) this.textEl.innerHTML = '';
        if (this.promptEl) this.promptEl.style.opacity = '1';
        this.updateAdvanceButton();

        let charIndex = 0;
        const text = msg.text;

        if (this.typeTimer) {
            clearInterval(this.typeTimer);
            this.typeTimer = null;
        }

        this.typeTimer = setInterval(() => {
            if (charIndex < text.length) {
                if (this.textEl) this.textEl.innerHTML += text[charIndex];
                if (charIndex % 3 === 0 && window.musicEngine) {
                    const pitch = msg.speaker === 'toadbigode' ? 1.3 : (msg.speaker === 'davi' ? 0.9 : 1.1);
                    window.musicEngine.playDialogueBlip(pitch);
                }
                charIndex++;
            } else {
                clearInterval(this.typeTimer);
                this.typeTimer = null;
                this.isTyping = false;
                if (this.promptEl) this.promptEl.style.opacity = '1';
                this.updateAdvanceButton();
                this.updateState();
            }
        }, 22);

        this.updateState();
    }

    advance() {
        if (!this.boxEl) this.initDOM();
        if (!this.boxEl || this.boxEl.classList.contains('hidden')) return;

        if (this.isTyping) {
            // Instantly complete current line (skip typewriter)
            if (this.typeTimer) {
                clearInterval(this.typeTimer);
                this.typeTimer = null;
            }
            const msg = this.currentQueue && this.currentQueue[this.currentIndex];
            if (msg && this.textEl) this.textEl.innerHTML = msg.text;
            this.isTyping = false;
            this._skipMode = true;
            if (this.promptEl) this.promptEl.style.opacity = '1';
            this.updateAdvanceButton();
            this.updateState();
        } else {
            this._skipMode = false;
            this.currentIndex++;
            this.displayCurrent();
        }
    }

    closeDialogue() {
        if (this.typeTimer) {
            clearInterval(this.typeTimer);
            this.typeTimer = null;
        }
        this.isTyping = false;
        this._skipMode = false;
        this.justClosed = true;
        setTimeout(() => {
            this.justClosed = false;
        }, 600);

        if (this.boxEl) {
            this.boxEl.classList.add('hidden');
            this.boxEl.classList.remove('flex');
        }

        this.finishedCount++;

        // Restore camera mode if not hugging
        if (window.gameApp && window.gameApp.controls) {
            if (!window.gameApp.isHugging) {
                window.gameApp.controls.setMode('EXPLORATION');
            }
        }

        this.updateState();

        if (this.onFinishCallback) {
            const cb = this.onFinishCallback;
            this.onFinishCallback = null;
            cb();
        }
    }

    updateState() {
        if (window.__GAME_STATE__ && window.__GAME_STATE__.dialogue) {
            const currentMsg = this.currentQueue && this.currentQueue[this.currentIndex];
            window.__GAME_STATE__.dialogue.isActive = Boolean(this.boxEl && !this.boxEl.classList.contains('hidden'));
            window.__GAME_STATE__.dialogue.currentQueueKey = this.currentQueueKey;
            window.__GAME_STATE__.dialogue.currentIndex = this.currentIndex;
            window.__GAME_STATE__.dialogue.isTyping = this.isTyping;
            window.__GAME_STATE__.dialogue.speaker = currentMsg ? currentMsg.speaker : null;
            window.__GAME_STATE__.dialogue.finishedCount = this.finishedCount;
        }
    }
}

// Global exposure
window.dialogueSystem = new DialogueSystem();
window.DIALOGUES = DIALOGUES;
