/* ============================================
   ENIGMES.JS — Les 3 Épreuves du Sanctuaire
   Version claire pour enfants de 9 ans
   100% SVG, pas d'emojis
   ============================================ */

const Enigmes = {
    current: null,
    errors: 0,
    
    // ═══════════════════════════════════════════════════
    // SVG KAWAII POP ACIDULÉ
    // ═══════════════════════════════════════════════════
    
    SVG: {
        // Lanterne allumée (style toro nagashi - lanterne flottante japonaise)
        lanternOn: `<svg viewBox="0 0 50 65" fill="none">
            <!-- Base flottante -->
            <ellipse cx="25" cy="60" rx="14" ry="4" fill="#5d4037"/>
            <rect x="12" y="55" width="26" height="6" rx="2" fill="#6d4c41"/>
            <!-- Corps de la lanterne -->
            <rect x="14" y="18" width="22" height="38" rx="4" fill="#ffebee"/>
            <rect x="14" y="18" width="22" height="38" rx="4" fill="url(#lanternGlow)" opacity="0.8"/>
            <!-- Cadre bois -->
            <rect x="12" y="16" width="26" height="4" rx="1" fill="#8d6e63"/>
            <rect x="12" y="52" width="26" height="4" rx="1" fill="#8d6e63"/>
            <line x1="14" y1="20" x2="14" y2="52" stroke="#a1887f" stroke-width="2"/>
            <line x1="36" y1="20" x2="36" y2="52" stroke="#a1887f" stroke-width="2"/>
            <!-- Flamme intérieure -->
            <ellipse cx="25" cy="38" rx="6" ry="10" fill="#ffd54f" opacity="0.9"/>
            <ellipse cx="25" cy="36" rx="4" ry="7" fill="#ffeb3b" opacity="0.9"/>
            <ellipse cx="25" cy="34" rx="2" ry="4" fill="#fff9c4"/>
            <!-- Toit -->
            <path d="M10,16 L25,4 L40,16 Z" fill="#d32f2f"/>
            <path d="M12,16 L25,6 L38,16 Z" fill="#e53935"/>
            <circle cx="25" cy="4" r="3" fill="#ffd700"/>
            <defs>
                <radialGradient id="lanternGlow" cx="50%" cy="50%">
                    <stop offset="0%" stop-color="#fff9c4"/>
                    <stop offset="100%" stop-color="#ffcc80"/>
                </radialGradient>
            </defs>
        </svg>`,
        
        // Lanterne éteinte
        lanternOff: `<svg viewBox="0 0 50 65" fill="none">
            <!-- Base flottante -->
            <ellipse cx="25" cy="60" rx="14" ry="4" fill="#3d3d3d"/>
            <rect x="12" y="55" width="26" height="6" rx="2" fill="#4a4a4a"/>
            <!-- Corps de la lanterne (sombre) -->
            <rect x="14" y="18" width="22" height="38" rx="4" fill="#4a4a5a"/>
            <!-- Cadre bois sombre -->
            <rect x="12" y="16" width="26" height="4" rx="1" fill="#5d5d5d"/>
            <rect x="12" y="52" width="26" height="4" rx="1" fill="#5d5d5d"/>
            <line x1="14" y1="20" x2="14" y2="52" stroke="#6d6d6d" stroke-width="2"/>
            <line x1="36" y1="20" x2="36" y2="52" stroke="#6d6d6d" stroke-width="2"/>
            <!-- Toit sombre -->
            <path d="M10,16 L25,4 L40,16 Z" fill="#5d4e6d"/>
            <path d="M12,16 L25,6 L38,16 Z" fill="#6d5e7d"/>
            <circle cx="25" cy="4" r="3" fill="#7d7d8d"/>
        </svg>`,
        
        // Mur (pierre)
        wall: `<svg viewBox="0 0 50 50" fill="none">
            <rect x="5" y="5" width="40" height="40" rx="8" fill="#5d4037"/>
            <rect x="8" y="8" width="15" height="12" rx="3" fill="#6d4c41"/>
            <rect x="27" y="8" width="15" height="12" rx="3" fill="#6d4c41"/>
            <rect x="8" y="24" width="12" height="10" rx="3" fill="#6d4c41"/>
            <rect x="24" y="24" width="18" height="10" rx="3" fill="#6d4c41"/>
        </svg>`,
        
        // Mini Kodama
        miniKodama: `<svg viewBox="0 0 40 50" fill="none">
            <ellipse cx="20" cy="18" rx="14" ry="14" fill="white"/>
            <ellipse cx="20" cy="40" rx="10" ry="10" fill="#e8e8e8"/>
            <circle cx="14" cy="16" r="3" fill="#4a3728"/>
            <circle cx="26" cy="16" r="3" fill="#4a3728"/>
            <circle cx="15" cy="15" r="1" fill="white"/>
            <circle cx="27" cy="15" r="1" fill="white"/>
            <ellipse cx="10" cy="22" rx="3" ry="2" fill="#ffcdd2" opacity="0.6"/>
            <ellipse cx="30" cy="22" rx="3" ry="2" fill="#ffcdd2" opacity="0.6"/>
        </svg>`,
        
        // Mini Neko (prisonnier)
        miniNeko: `<svg viewBox="0 0 45 50" fill="none">
            <path d="M8,22 L15,8 L22,20 Z" fill="#ffb7c5"/>
            <path d="M23,20 L30,8 L37,22 Z" fill="#ffb7c5"/>
            <ellipse cx="22" cy="30" rx="16" ry="14" fill="#ffb7c5"/>
            <ellipse cx="16" cy="28" rx="3" ry="4" fill="#1a051d"/>
            <ellipse cx="28" cy="28" rx="3" ry="4" fill="#1a051d"/>
            <circle cx="17" cy="27" r="1.2" fill="white"/>
            <circle cx="29" cy="27" r="1.2" fill="white"/>
            <ellipse cx="22" cy="33" rx="2" ry="1.5" fill="#ff9eb5"/>
            <path d="M18,36 Q22,40 26,36" fill="none" stroke="#1a051d" stroke-width="1.5" stroke-linecap="round"/>
            <ellipse cx="10" cy="32" rx="3" ry="2" fill="#ff6b9d" opacity="0.5"/>
            <ellipse cx="34" cy="32" rx="3" ry="2" fill="#ff6b9d" opacity="0.5"/>
        </svg>`,
        
        // Étoile (pour poids)
        star: `<svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" fill="#ffd700" stroke="#ffaa00" stroke-width="1"/>
        </svg>`,
        
        // Check (succès)
        check: `<svg viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" fill="#90EE90" stroke="#66cc66" stroke-width="3"/>
            <path d="M18 30L26 38L42 22" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        
        // Offrandes
        rice: `<svg viewBox="0 0 50 50" fill="none">
            <ellipse cx="25" cy="38" rx="16" ry="8" fill="#8d6e63"/>
            <ellipse cx="25" cy="32" rx="13" ry="16" fill="white"/>
            <ellipse cx="25" cy="26" rx="10" ry="6" fill="#fff9c4"/>
            <circle cx="20" cy="24" r="2" fill="white"/>
            <circle cx="28" cy="26" r="2" fill="white"/>
        </svg>`,
        
        sake: `<svg viewBox="0 0 50 50" fill="none">
            <rect x="18" y="15" width="14" height="28" rx="3" fill="#e0e0e0"/>
            <rect x="16" y="12" width="18" height="6" rx="2" fill="#ff6b9d"/>
            <rect x="20" y="20" width="10" height="18" rx="2" fill="white" opacity="0.5"/>
            <circle cx="25" cy="30" r="4" fill="#ff6b9d" opacity="0.3"/>
        </svg>`,
        
        fish: `<svg viewBox="0 0 50 50" fill="none">
            <ellipse cx="28" cy="25" rx="16" ry="10" fill="#64b5f6"/>
            <path d="M10,25 L2,18 L2,32 Z" fill="#64b5f6"/>
            <circle cx="38" cy="23" r="3" fill="white"/>
            <circle cx="39" cy="23" r="1.5" fill="#1a051d"/>
            <ellipse cx="28" cy="25" rx="14" ry="8" fill="#90caf9" opacity="0.5"/>
        </svg>`,
        
        fruit: `<svg viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="28" r="15" fill="#ff8a65"/>
            <ellipse cx="25" cy="28" rx="12" ry="13" fill="#ffab91"/>
            <path d="M25,13 Q28,8 32,10" fill="none" stroke="#4caf50" stroke-width="3" stroke-linecap="round"/>
            <ellipse cx="28" cy="10" rx="4" ry="3" fill="#66bb6a"/>
            <circle cx="20" cy="24" r="2" fill="white" opacity="0.6"/>
        </svg>`,
        
        incense: `<svg viewBox="0 0 50 50" fill="none">
            <rect x="23" y="22" width="4" height="22" rx="2" fill="#8d6e63"/>
            <ellipse cx="25" cy="44" rx="10" ry="4" fill="#5d4037"/>
            <path d="M25,22 Q30,14 25,6 Q20,14 25,22" fill="#e0e0e0" opacity="0.6"/>
            <circle cx="25" cy="20" r="2" fill="#ff6b9d"/>
        </svg>`,
        
        bell: `<svg viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="10" r="4" fill="#ffd700"/>
            <path d="M15,15 Q25,12 35,15 L32,35 Q25,38 18,35 Z" fill="#ffd700"/>
            <ellipse cx="25" cy="36" rx="10" ry="4" fill="#ffb300"/>
            <circle cx="25" cy="40" r="4" fill="#ff6b9d"/>
            <ellipse cx="22" cy="25" rx="4" ry="6" fill="#fff9c4" opacity="0.5"/>
        </svg>`,
        
        // Symboles pour décodage
        sun: `<svg viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="10" fill="#ffd700"/>
            <circle cx="25" cy="25" r="6" fill="#ffeb3b"/>
            <g stroke="#ffd700" stroke-width="3" stroke-linecap="round">
                <line x1="25" y1="6" x2="25" y2="12"/>
                <line x1="25" y1="38" x2="25" y2="44"/>
                <line x1="6" y1="25" x2="12" y2="25"/>
                <line x1="38" y1="25" x2="44" y2="25"/>
                <line x1="12" y1="12" x2="16" y2="16"/>
                <line x1="34" y1="34" x2="38" y2="38"/>
                <line x1="12" y1="38" x2="16" y2="34"/>
                <line x1="34" y1="16" x2="38" y2="12"/>
            </g>
        </svg>`,
        
        moon: `<svg viewBox="0 0 50 50" fill="none">
            <path d="M30,8 A18,18 0 1,1 30,42 A14,14 0 1,0 30,8" fill="#e1bee7"/>
            <circle cx="18" cy="20" r="2" fill="#ce93d8" opacity="0.5"/>
            <circle cx="22" cy="32" r="1.5" fill="#ce93d8" opacity="0.5"/>
        </svg>`,
        
        wave: `<svg viewBox="0 0 50 50" fill="none">
            <path d="M5,30 Q12,20 20,30 Q28,40 35,30 Q42,20 50,30" fill="none" stroke="#4fc3f7" stroke-width="4" stroke-linecap="round"/>
            <path d="M5,38 Q12,28 20,38 Q28,48 35,38 Q42,28 50,38" fill="none" stroke="#81d4fa" stroke-width="3" stroke-linecap="round"/>
        </svg>`,
        
        flower: `<svg viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="6" fill="#ffd700"/>
            <ellipse cx="25" cy="12" rx="6" ry="8" fill="#ffb7c5"/>
            <ellipse cx="25" cy="38" rx="6" ry="8" fill="#ffb7c5"/>
            <ellipse cx="12" cy="25" rx="8" ry="6" fill="#ffb7c5"/>
            <ellipse cx="38" cy="25" rx="8" ry="6" fill="#ffb7c5"/>
        </svg>`
    },
    
    // ═══════════════════════════════════════════════════
    // ÉNIGME 1 — LE CHEMIN DES LANTERNES
    // ═══════════════════════════════════════════════════
    
    enigme1: {
        // 0=chemin, 1=mur, 2=départ(Kodama), 3=arrivée(Neko)
        // Grille 3×3 — un seul chemin valide : (0,0)→(0,1)→(0,2)→(1,2)→(2,2)
        grid: [
            [2, 0, 0],
            [1, 1, 0],
            [0, 0, 3]
        ],
        ROWS: 3,
        COLS: 3,
        lanternsLeft: 3,
        litCells: [],
        litTimers: [],
        path: [],
        tracing: false,

        init() {
            this.lanternsLeft = 3;
            this.litCells = [];
            this.litTimers.forEach(t => clearTimeout(t));
            this.litTimers = [];
            this.path = [];
            this.tracing = false;
            Enigmes.errors = 0;
            this.render();
        },

        render() {
            const html = `
                <div class="enigme-header">
                    <h2 class="enigme-title">Le Chemin des Lanternes</h2>
                </div>
                <div class="enigme-instructions">
                    <div class="instruction-box">
                        <div class="instruction-icon">${Enigmes.SVG.lanternOn}</div>
                        <div class="instruction-text">
                            <strong>But :</strong> Guide le Kodama jusqu'au Neko
                        </div>
                    </div>
                    <div class="instruction-steps">
                        <p><span class="step-num">1</span> Tape pour éclairer — 4 secondes seulement !</p>
                        <p><span class="step-num">2</span> Tu as <strong>3 lanternes</strong> — mémorise !</p>
                        <p><span class="step-num">3</span> Clique "Tracer" puis trace ton chemin case par case</p>
                    </div>
                </div>
                <div class="enigme-game-area">
                    <div class="lantern-grid-wrap">
                        <div class="lantern-grid-3" id="lantern-grid"></div>
                        <svg class="path-svg" id="path-svg" viewBox="0 0 3 3" preserveAspectRatio="none"></svg>
                    </div>
                    <div class="lantern-counter">
                        <span class="lantern-counter-text">Lanternes :</span>
                        <div class="lantern-counter-dots" id="lantern-dots"></div>
                    </div>
                </div>
                <div class="enigme-actions">
                    <button class="enigme-btn enigme-btn-reset" onclick="Enigmes.enigme1.reset()">Recommencer</button>
                    <button class="enigme-btn enigme-btn-validate" id="btn-trace" onclick="Enigmes.enigme1.validate()">Tracer le chemin</button>
                </div>
                <div class="enigme-particles">
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                </div>`;
            document.getElementById('enigme-screen').innerHTML = html;
            this.renderGrid();
            this.renderDots();
        },

        renderGrid() {
            const gridEl = document.getElementById('lantern-grid');
            if (!gridEl) return;
            let html = '';
            for (let y = 0; y < this.ROWS; y++) {
                for (let x = 0; x < this.COLS; x++) {
                    const cell = this.grid[y][x];
                    const isLit = this.litCells.some(c => c[0] === y && c[1] === x);
                    const inPath = this.path.some(c => c[0] === y && c[1] === x);
                    let classes = 'lantern-cell lc3';
                    let content = '';
                    if (cell === 2) {
                        classes += ' start';
                        content = Enigmes.SVG.miniKodama;
                    } else if (cell === 3) {
                        classes += ' end';
                        content = Enigmes.SVG.miniNeko;
                    } else if (isLit) {
                        if (cell === 1) {
                            classes += ' wall lit';
                            content = Enigmes.SVG.wall;
                        } else {
                            classes += ' path lit';
                            content = Enigmes.SVG.lanternOn;
                        }
                    } else {
                        classes += ' mystery';
                        content = Enigmes.SVG.lanternOff;
                    }
                    if (inPath) classes += ' selected';
                    html += `<div class="${classes}" data-y="${y}" data-x="${x}" onclick="Enigmes.enigme1.tapCell(${y},${x})">${content}</div>`;
                }
            }
            gridEl.innerHTML = html;
            this.drawPathLine();
        },

        drawPathLine() {
            const svg = document.getElementById('path-svg');
            if (!svg || this.path.length < 2) { if (svg) svg.innerHTML = ''; return; }
            const pts = this.path.map(([y, x]) => `${x + 0.5},${y + 0.5}`).join(' ');
            svg.innerHTML = `
                <polyline points="${pts}" fill="none"
                    stroke="rgba(255,215,0,0.85)" stroke-width="0.18"
                    stroke-linecap="round" stroke-linejoin="round"
                    filter="url(#glow-path)"/>
                <defs>
                    <filter id="glow-path">
                        <feGaussianBlur stdDeviation="0.08" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>`;
        },

        renderDots() {
            const dotsEl = document.getElementById('lantern-dots');
            if (!dotsEl) return;
            let html = '';
            for (let i = 0; i < 3; i++) {
                html += `<div class="lantern-dot ${i >= this.lanternsLeft ? 'used' : ''}">${Enigmes.SVG.lanternOn}</div>`;
            }
            dotsEl.innerHTML = html;
        },

        tapCell(y, x) {
            const cell = this.grid[y][x];
            if (this.tracing) { this.addToPath(y, x); return; }
            if (cell === 0 && this.lanternsLeft > 0) {
                // Onde radiale depuis la case tapée
                const toLight = [[y, x]];
                if (y > 0) toLight.push([y-1, x]);
                if (y < this.ROWS-1) toLight.push([y+1, x]);
                if (x > 0) toLight.push([y, x-1]);
                if (x < this.COLS-1) toLight.push([y, x+1]);
                // Allumer avec délai progressif (effet onde)
                toLight.forEach((c, i) => {
                    setTimeout(() => {
                        if (!this.litCells.some(l => l[0]===c[0] && l[1]===c[1])) {
                            this.litCells.push(c);
                        }
                        this.renderGrid();
                    }, i * 80);
                });
                this.lanternsLeft--;
                this.renderDots();
                try { if (typeof playGameSFX === 'function') playGameSFX('pop'); } catch(e) {}
                const t = setTimeout(() => {
                    this.litCells = this.litCells.filter(c => !toLight.some(t => t[0]===c[0] && t[1]===c[1]));
                    this.renderGrid();
                }, 4000);
                this.litTimers.push(t);
            } else if (cell === 1) {
                // Mur tapé en dehors du tracé — juste feedback visuel sur la case
                const el = document.querySelector(`[data-y="${y}"][data-x="${x}"]`);
                if (el) {
                    el.classList.add('wall-tap');
                    setTimeout(() => el.classList.remove('wall-tap'), 400);
                }
                try { if (typeof playWrong === 'function') playWrong(); } catch(e) {}
            }
        },

        validate() {
            if (!this.tracing) {
                this.tracing = true;
                this.path = [[0, 0]];
                const btn = document.getElementById('btn-trace');
                if (btn) btn.textContent = 'Valider mon chemin';
                this.renderGrid();
            } else {
                this.checkPath();
            }
        },

        addToPath(y, x) {
            const last = this.path[this.path.length - 1];
            const cell = this.grid[y][x];
            if (cell === 1) {
                // Mur : feedback shake sur la case uniquement
                const el = document.querySelector(`[data-y="${y}"][data-x="${x}"]`);
                if (el) { el.classList.add('wall-tap'); setTimeout(() => el.classList.remove('wall-tap'), 400); }
                try { if (typeof playWrong === 'function') playWrong(); } catch(e) {}
                return;
            }
            const isAdjacent = (Math.abs(last[0]-y) + Math.abs(last[1]-x)) === 1;
            if (!isAdjacent) return;
            const idx = this.path.findIndex(c => c[0]===y && c[1]===x);
            if (idx >= 0) {
                this.path = this.path.slice(0, idx + 1);
            } else {
                this.path.push([y, x]);
            }
            try { if (typeof playGameSFX === 'function') playGameSFX('pop'); } catch(e) {}
            this.renderGrid();
        },

        checkPath() {
            const last = this.path[this.path.length - 1];
            const nekoY = this.ROWS - 1, nekoX = this.COLS - 1;
            if (last[0] === nekoY && last[1] === nekoX) {
                let valid = true;
                for (const p of this.path) {
                    if (this.grid[p[0]][p[1]] === 1) { valid = false; break; }
                }
                if (valid) {
                    Enigmes.success(1);
                } else {
                    Enigmes.errors++;
                    this.shakeWrongPath();
                }
            } else {
                Enigmes.errors++;
                this.shakeWrongPath();
            }
        },

        shakeWrongPath() {
            const grid = document.getElementById('lantern-grid');
            if (grid) {
                grid.classList.add('grid-wrong-shake');
                setTimeout(() => grid.classList.remove('grid-wrong-shake'), 500);
            }
            try { if (typeof playWrong === 'function') playWrong(); } catch(e) {}
        },

        giveHint() {},

        reset() {
            this.tracing = false;
            this.path = [];
            this.lanternsLeft = 3;
            this.litCells = [];
            this.litTimers.forEach(t => clearTimeout(t));
            this.litTimers = [];
            const btn = document.getElementById('btn-trace');
            if (btn) btn.textContent = 'Tracer le chemin';
            this.renderGrid();
            this.renderDots();
        }
    },

    // ═══════════════════════════════════════════════════
    // ÉNIGME 2 — LA BALANCE DU TEMPLE
    // ═══════════════════════════════════════════════════

    enigme2: {
        offerings: [
            { id: 'rice',     name: 'Riz',       weight: 1, size: 'sm' },
            { id: 'sake',     name: 'Saké',      weight: 2, size: 'md' },
            { id: 'fish',     name: 'Poisson',   weight: 3, size: 'lg' },
            { id: 'fruit',    name: 'Fruit',     weight: 2, size: 'md' },
            { id: 'incense',  name: 'Encens',    weight: 1, size: 'sm' },
            { id: 'bell',     name: 'Clochette', weight: 4, size: 'xl' }
        ],
        targetWeight: 5,
        plateItems: [],
        successTriggered: false,

        init() {
            this.plateItems = [];
            this.successTriggered = false;
            Enigmes.errors = 0;
            this.render();
        },

        render() {
            const html = `
                <div class="enigme-header">
                    <h2 class="enigme-title">La Balance du Temple</h2>
                </div>
                <div class="enigme-instructions">
                    <div class="instruction-box">
                        <div class="instruction-icon" style="font-size:32px;">⚖️</div>
                        <div class="instruction-text">
                            <strong>But :</strong> Équilibre la balance sacrée !
                        </div>
                    </div>
                    <div class="instruction-steps">
                        <p><span class="step-num">1</span> Le plateau de droite porte le poids sacré</p>
                        <p><span class="step-num">2</span> Tape des offrandes pour les poser à gauche</p>
                        <p><span class="step-num">3</span> Quand les deux côtés s'équilibrent — victoire !</p>
                    </div>
                </div>
                <div class="enigme-game-area">
                    <div class="balance-wrap" id="balance-wrap">
                        <svg class="balance-svg" id="balance-svg" viewBox="-60 -20 120 90">
                            <!-- Pivot central -->
                            <rect x="-2" y="0" width="4" height="28" rx="2" fill="#8d6e63"/>
                            <polygon points="0,-8 -6,0 6,0" fill="#5d4037"/>
                            <!-- Bras de balance -->
                            <g id="balance-beam" style="transform-origin:0px 0px;transform:rotate(0deg);transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1)">
                                <rect x="-52" y="-3" width="104" height="5" rx="2.5" fill="#6d4c41"/>
                                <!-- Fils gauche -->
                                <line x1="-45" y1="2" x2="-45" y2="22" stroke="#a1887f" stroke-width="1.5"/>
                                <line x1="-38" y1="2" x2="-38" y2="22" stroke="#a1887f" stroke-width="1.5"/>
                                <!-- Plateau gauche -->
                                <ellipse cx="-41.5" cy="24" rx="12" ry="4" fill="#5d4037"/>
                                <g id="left-offerings"></g>
                                <!-- Fils droite -->
                                <line x1="38" y1="2" x2="38" y2="22" stroke="#a1887f" stroke-width="1.5"/>
                                <line x1="45" y1="2" x2="45" y2="22" stroke="#a1887f" stroke-width="1.5"/>
                                <!-- Plateau droit -->
                                <ellipse cx="41.5" cy="24" rx="12" ry="4" fill="#5d4037"/>
                                <!-- Flamme sacrée (poids cible) -->
                                <ellipse cx="41.5" cy="16" rx="6" ry="9" fill="#ffd54f" opacity="0.7"/>
                                <ellipse cx="41.5" cy="14" rx="4" ry="7" fill="#ffeb3b" opacity="0.8"/>
                                <ellipse cx="41.5" cy="12" rx="2" ry="4" fill="#fff9c4"/>
                            </g>
                        </svg>
                    </div>
                    <div class="offerings-grid-2" id="offerings-tray"></div>
                </div>
                <div class="enigme-actions">
                    <button class="enigme-btn enigme-btn-reset" onclick="Enigmes.enigme2.reset()">Recommencer</button>
                </div>
                <div class="enigme-particles">
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                </div>`;
            document.getElementById('enigme-screen').innerHTML = html;
            this.renderOfferings();
            this.updateBalance();
        },

        renderOfferings() {
            const tray = document.getElementById('offerings-tray');
            if (!tray) return;
            let html = '';
            this.offerings.forEach(o => {
                const inPlate = this.plateItems.includes(o.id);
                html += `<div class="offering-card-2 size-${o.size} ${inPlate ? 'selected' : ''}"
                    onclick="Enigmes.enigme2.toggleOffering('${o.id}')">
                    <div class="offering-image-2">${Enigmes.SVG[o.id]}</div>
                    <div class="offering-name-2">${o.name}</div>
                </div>`;
            });
            tray.innerHTML = html;
        },

        toggleOffering(id) {
            if (this.successTriggered) return;
            const idx = this.plateItems.indexOf(id);
            if (idx >= 0) { this.plateItems.splice(idx, 1); }
            else { this.plateItems.push(id); }
            try { if (typeof playGameSFX === 'function') playGameSFX('pop'); } catch(e) {}
            this.renderOfferings();
            this.updateBalance();
        },

        getCurrentWeight() {
            return this.plateItems.reduce((sum, id) => {
                const o = this.offerings.find(x => x.id === id);
                return sum + (o ? o.weight : 0);
            }, 0);
        },

        updateBalance() {
            const w = this.getCurrentWeight();
            const diff = w - this.targetWeight;
            // Angle : penche à gauche si trop lourd, droite si trop léger
            const angle = Math.max(-32, Math.min(32, diff * 9));
            const beam = document.getElementById('balance-beam');
            if (!beam) return;
            beam.style.transform = `rotate(${angle}deg)`;

            // Mettre à jour les offrandes sur le plateau gauche (icônes empilées)
            const leftOfferings = document.getElementById('left-offerings');
            if (leftOfferings) {
                let svgItems = '';
                this.plateItems.forEach((id, i) => {
                    const o = this.offerings.find(x => x.id === id);
                    if (!o) return;
                    // Stack les icônes sur le plateau gauche
                    svgItems += `<g transform="translate(${-48 + (i % 3) * 7}, ${18 - Math.floor(i/3) * 6}) scale(0.12)">
                        ${Enigmes.SVG[id]}
                    </g>`;
                });
                leftOfferings.innerHTML = svgItems;
            }

            const wrap = document.getElementById('balance-wrap');
            if (!wrap) return;
            wrap.classList.remove('balance-heavy', 'balance-light', 'balance-perfect');

            if (diff === 0 && w > 0) {
                wrap.classList.add('balance-perfect');
                if (!this.successTriggered) {
                    this.successTriggered = true;
                    try { if (typeof playGameSFX === 'function') playGameSFX('chime_portal'); } catch(e) {}
                    if (navigator.vibrate) navigator.vibrate([60, 30, 90]);
                    setTimeout(() => Enigmes.success(2), 900);
                }
            } else if (diff > 0) {
                wrap.classList.add('balance-heavy');
                if (typeof playWrong === 'function') try { playWrong(); } catch(e) {}
                if (navigator.vibrate) navigator.vibrate(80);
            } else if (diff < 0 && w > 0) {
                wrap.classList.add('balance-light');
            }
        },

        giveHint() {},

        reset() {
            this.plateItems = [];
            this.successTriggered = false;
            this.renderOfferings();
            this.updateBalance();
        }
    },

    // ═══════════════════════════════════════════════════
    // ÉNIGME 3 — LE MIROIR DE L'OMBRE
    // ═══════════════════════════════════════════════════

    enigme3: {
        // 4 reliques utilisées — visuellement très distinctes
        relics: [
            { idx: 0, color: '#ffb7c5', dark: '#ff1493', kanji: '花' }, // mochi rose
            { idx: 1, color: '#98e8d4', dark: '#00b386', kanji: '剣' }, // épée cyan
            { idx: 3, color: '#fde68a', dark: '#f59e0b', kanji: '照' }, // gemme dorée
            { idx: 4, color: '#fdba74', dark: '#f97316', kanji: '藻' }  // masque orange
        ],
        sequence: [],    // ordre aléatoire de 0..3 (indices dans relics[])
        tapped: [],
        phase: 'show',   // 'show' | 'play'
        showTimer: null,

        init() {
            this.tapped = [];
            this.phase = 'show';
            if (this.showTimer) clearTimeout(this.showTimer);
            // Séquence aléatoire
            this.sequence = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
            Enigmes.errors = 0;
            this.render();
            setTimeout(() => this.startShowPhase(), 600);
        },

        render() {
            const relicsHtml = this.relics.map((r, i) => `
                <div class="ombre-relic-slot" id="relic-slot-${i}"
                    style="--relic-color:${r.color};--relic-dark:${r.dark}"
                    onclick="Enigmes.enigme3.tapRelic(${i})">
                    <div class="ombre-relic-inner">
                        <div class="ombre-relic-svg">${typeof getRelicSVG === 'function' ? getRelicSVG(r.idx) : ''}</div>
                        <div class="ombre-relic-kanji">${r.kanji}</div>
                    </div>
                    <div class="ombre-chain" id="chain-${i}"></div>
                </div>`).join('');

            const html = `
                <div class="enigme-header">
                    <h2 class="enigme-title">Le Miroir de l'Ombre</h2>
                </div>
                <div class="enigme-instructions">
                    <div class="instruction-box">
                        <div class="instruction-icon" style="font-size:28px;">🌑</div>
                        <div class="instruction-text">
                            <strong>But :</strong> Scelle l'Ombre en touchant les reliques dans le bon ordre !
                        </div>
                    </div>
                    <div class="instruction-steps">
                        <p><span class="step-num">1</span> L'Ombre révèle 4 reliques dans l'ordre</p>
                        <p><span class="step-num">2</span> Mémorise bien l'ordre !</p>
                        <p><span class="step-num">3</span> Touche-les dans le même ordre pour la sceller</p>
                    </div>
                </div>
                <div class="enigme-game-area ombre-arena">
                    <!-- L'Ombre -->
                    <div class="ombre-figure" id="ombre-figure">
                        <div class="ombre-smoke"></div>
                        <div class="ombre-eyes">
                            <div class="ombre-eye"></div>
                            <div class="ombre-eye"></div>
                        </div>
                        <div class="ombre-kanji" id="ombre-kanji">封</div>
                    </div>
                    <!-- Indicateur de phase -->
                    <div class="ombre-phase-label" id="ombre-phase-label">L'Ombre s'éveille...</div>
                    <!-- Les 4 reliques en 2×2 -->
                    <div class="ombre-relics-grid" id="ombre-relics-grid">
                        ${relicsHtml}
                    </div>
                    <!-- Progression : chaînes -->
                    <div class="ombre-chains-progress" id="ombre-chains-progress">
                        ${[0,1,2,3].map(i => `<div class="ombre-chain-dot" id="cdot-${i}"></div>`).join('')}
                    </div>
                </div>
                <div class="enigme-actions">
                    <button class="enigme-btn enigme-btn-reset" onclick="Enigmes.enigme3.init()">Recommencer</button>
                </div>
                <div class="enigme-particles">
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                </div>`;
            document.getElementById('enigme-screen').innerHTML = html;
            // Désactiver les reliques pendant le show
            this.setRelicsInteractive(false);
        },

        startShowPhase() {
            this.phase = 'show';
            const label = document.getElementById('ombre-phase-label');
            if (label) label.textContent = "Mémorise l'ordre des reliques...";
            this.setRelicsInteractive(false);

            let step = 0;
            const showNext = () => {
                // Éteindre la précédente
                if (step > 0) {
                    const prevRelicIdx = this.sequence[step - 1];
                    const prevSlot = document.getElementById(`relic-slot-${prevRelicIdx}`);
                    if (prevSlot) prevSlot.classList.remove('relic-lit', 'relic-active');
                }
                if (step < 4) {
                    const relicIdx = this.sequence[step];
                    const slot = document.getElementById(`relic-slot-${relicIdx}`);
                    if (slot) {
                        slot.classList.add('relic-lit', 'relic-active');
                        // Son distinct par position
                        try {
                            if (typeof playMikoChime === 'function') playMikoChime(step * 2);
                        } catch(e) {}
                    }
                    step++;
                    this.showTimer = setTimeout(showNext, 900);
                } else {
                    // Fin du show
                    this.showTimer = setTimeout(() => this.startPlayPhase(), 800);
                }
            };
            showNext();
        },

        startPlayPhase() {
            this.phase = 'play';
            this.tapped = [];
            const label = document.getElementById('ombre-phase-label');
            if (label) label.textContent = "Scelle l'Ombre — touche dans l'ordre !";
            const figure = document.getElementById('ombre-figure');
            if (figure) figure.classList.add('ombre-menace');
            this.setRelicsInteractive(true);
            // Remettre toutes les reliques en état neutre (grisé)
            this.relics.forEach((r, i) => {
                const slot = document.getElementById(`relic-slot-${i}`);
                if (slot) slot.classList.remove('relic-lit', 'relic-active', 'relic-sealed', 'relic-wrong');
                slot.classList.add('relic-play');
            });
        },

        tapRelic(relicIdx) {
            if (this.phase !== 'play') return;
            const slot = document.getElementById(`relic-slot-${relicIdx}`);
            if (!slot || slot.classList.contains('relic-sealed')) return;

            const expectedRelicIdx = this.sequence[this.tapped.length];

            if (relicIdx === expectedRelicIdx) {
                // ✓ Bonne relique
                slot.classList.add('relic-sealed');
                slot.classList.remove('relic-play');
                this.tapped.push(relicIdx);
                try { if (typeof playMikoChime === 'function') playMikoChime(this.tapped.length * 2); } catch(e) {}
                if (navigator.vibrate) navigator.vibrate(40);

                // Allumer le dot de progression + chaîne
                const dot = document.getElementById(`cdot-${this.tapped.length - 1}`);
                if (dot) dot.classList.add('cdot-active');

                // L'Ombre s'affaiblit
                const figure = document.getElementById('ombre-figure');
                if (figure) figure.style.opacity = String(1 - this.tapped.length * 0.2);

                const label = document.getElementById('ombre-phase-label');
                if (label) {
                    const msgs = ['1 chaîne posée...', '2 chaînes ! Elle vacille...', '3 chaînes ! Encore une !', 'SCELLÉE !'];
                    label.textContent = msgs[this.tapped.length - 1] || '';
                }

                if (this.tapped.length === 4) {
                    setTimeout(() => {
                        if (figure) { figure.style.opacity = '0'; figure.style.transform = 'scale(0)'; }
                        setTimeout(() => Enigmes.success(3), 600);
                    }, 500);
                }
            } else {
                // ✗ Mauvaise relique
                slot.classList.add('relic-wrong');
                Enigmes.errors++;
                try { if (typeof playWrong === 'function') playWrong(); } catch(e) {}
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

                // L'Ombre rugit
                const figure = document.getElementById('ombre-figure');
                if (figure) { figure.classList.add('ombre-roar'); setTimeout(() => figure.classList.remove('ombre-roar'), 600); }

                // Réinitialiser après 700ms
                setTimeout(() => {
                    this.tapped = [];
                    this.relics.forEach((r, i) => {
                        const s = document.getElementById(`relic-slot-${i}`);
                        if (s) s.classList.remove('relic-sealed', 'relic-wrong');
                        s.classList.add('relic-play');
                    });
                    document.querySelectorAll('.ombre-chain-dot').forEach(d => d.classList.remove('cdot-active'));
                    if (figure) figure.style.opacity = '1';
                    const label = document.getElementById('ombre-phase-label');
                    if (label) label.textContent = "Recommence depuis le début !";
                }, 700);
            }
        },

        setRelicsInteractive(active) {
            this.relics.forEach((r, i) => {
                const slot = document.getElementById(`relic-slot-${i}`);
                if (slot) slot.style.pointerEvents = active ? 'auto' : 'none';
            });
        },

        giveHint() {},

        reset() {
            this.tapped = [];
            this.phase = 'show';
            if (this.showTimer) clearTimeout(this.showTimer);
            this.sequence = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
            this.render();
            setTimeout(() => this.startShowPhase(), 600);
        }
    },

        // ═══════════════════════════════════════════════════
    // GESTION GLOBALE
    // ═══════════════════════════════════════════════════
    
    show(enigmeNumber) {
        this.current = enigmeNumber;
        const screen = document.getElementById('enigme-screen');
        // Activer les interactions
        screen.style.pointerEvents = 'auto';
        screen.style.visibility = 'visible';
        screen.style.display = 'flex';
        screen.classList.add('active');
        
        switch(enigmeNumber) {
            case 1: this.enigme1.init(); break;
            case 2: this.enigme2.init(); break;
            case 3: this.enigme3.init(); break;
        }
    },
    
    hide() {
        const screen = document.getElementById('enigme-screen');
        screen.classList.remove('active');
        // Désactiver complètement pour ne pas bloquer les clics
        screen.style.pointerEvents = 'none';
        screen.style.visibility = 'hidden';
        screen.style.display = 'none';
        this.current = null;
    },
    
    success(enigmeNumber) {
        const screen = document.getElementById('enigme-screen');
        
        const overlay = document.createElement('div');
        overlay.className = 'enigme-success-overlay';
        overlay.innerHTML = `
            <div class="success-icon">${this.SVG.check}</div>
            <div class="success-text">Bravo !</div>
            <div class="success-subtext">Épreuve réussie !</div>
        `;
        screen.appendChild(overlay);
        
        try { if (typeof playGameSFX === 'function') playGameSFX('chime_success'); } catch(e) {}
        
        setTimeout(() => {
            this.hide();
            if (typeof onEnigmeSuccess === 'function') {
                onEnigmeSuccess(enigmeNumber);
            }
        }, 2500);
    }
};

function onEnigmeSuccess(enigmeNumber) {
    console.log(`Énigme ${enigmeNumber} réussie !`);
    // Réafficher le bouton scanner après l'énigme
    const btnScan = document.getElementById('btn-scan');
    if (btnScan) {
        btnScan.removeAttribute('style');
        btnScan.style.cssText = 'display: block !important; visibility: visible !important; pointer-events: auto !important;';
        console.log('[ENIGME] Bouton scan réaffiché après énigme');
    }
    // Énigme 3 = dernier verrou avant la cinématique finale (9 gardiens débloqués)
    if (enigmeNumber === 3 && typeof foundGuardians !== 'undefined' && foundGuardians.size >= 9) {
        console.log('[ENIGME] Énigme 3 réussie — lancement cinématique finale');
        setTimeout(() => {
            if (typeof launchFinalCinematic === 'function') launchFinalCinematic();
        }, 500);
    }
}
