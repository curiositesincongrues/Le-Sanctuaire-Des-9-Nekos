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
        // Grille améliorée avec plusieurs chemins possibles et vrais choix
        // 0=chemin, 1=mur, 2=départ (Kodama), 3=arrivée (Neko)
        grid: [
            [2, 0, 0, 1],
            [1, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 0, 3]
        ],
        lanternsLeft: 3,  // Réduit à 3 pour plus de challenge
        litCells: [],
        path: [],
        tracing: false,
        
        init() {
            this.lanternsLeft = 3;
            this.litCells = [];
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
                        <p><span class="step-num">1</span> Tout est caché ! Tape sur une case pour l'éclairer</p>
                        <p><span class="step-num">2</span> Tu as seulement <strong>3 lanternes</strong></p>
                        <p><span class="step-num">3</span> La lumière s'éteint après 4 secondes - mémorise !</p>
                        <p><span class="step-num">4</span> Clique "Tracer" et trace ton chemin</p>
                    </div>
                </div>
                
                <div class="enigme-game-area">
                    <div class="lantern-grid" id="lantern-grid"></div>
                    
                    <div class="lantern-counter">
                        <span class="lantern-counter-text">Lanternes :</span>
                        <div class="lantern-counter-dots" id="lantern-dots"></div>
                    </div>
                </div>
                
                <div class="enigme-actions">
                    <button class="enigme-btn enigme-btn-reset" onclick="Enigmes.enigme1.reset()">Recommencer</button>
                    <button class="enigme-btn enigme-btn-validate" id="btn-trace" onclick="Enigmes.enigme1.validate()">Tracer le chemin</button>
                </div>
                
                <div class="enigme-kodama">
                    <div class="kodama-new-head">
                        <div class="kodama-new-left-eye"></div>
                        <div class="kodama-new-right-eye"></div>
                    </div>
                    <div class="kodama-new-body"></div>
                </div>
                
                <div class="enigme-kodama-bubble">
                    <p class="enigme-kodama-text" id="kodama-hint">Tout est sombre... Éclaire les cases pour découvrir le chemin !</p>
                </div>
                
                <div class="enigme-particles">
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                </div>
            `;
            
            document.getElementById('enigme-screen').innerHTML = html;
            this.renderGrid();
            this.renderDots();
        },
        
        renderGrid() {
            const gridEl = document.getElementById('lantern-grid');
            let html = '';
            
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const cell = this.grid[y][x];
                    const isLit = this.litCells.some(c => c[0] === y && c[1] === x);
                    const inPath = this.path.some(c => c[0] === y && c[1] === x);
                    
                    let classes = 'lantern-cell';
                    let content = '';
                    
                    // Départ et arrivée toujours visibles
                    if (cell === 2) {
                        classes += ' start';
                        content = Enigmes.SVG.miniKodama;
                    } else if (cell === 3) {
                        classes += ' end';
                        content = Enigmes.SVG.miniNeko;
                    } 
                    // Si éclairé : montrer la vraie nature
                    else if (isLit) {
                        if (cell === 1) {
                            classes += ' wall lit';
                            content = Enigmes.SVG.wall;
                        } else {
                            classes += ' path lit';
                            content = Enigmes.SVG.lanternOn;
                        }
                    }
                    // Non éclairé : tout est mystère (même apparence)
                    else {
                        classes += ' mystery';
                        content = Enigmes.SVG.lanternOff;
                    }
                    
                    if (inPath) classes += ' selected';
                    
                    html += `<div class="${classes}" data-y="${y}" data-x="${x}" onclick="Enigmes.enigme1.tapCell(${y},${x})">${content}</div>`;
                }
            }
            
            gridEl.innerHTML = html;
        },
        
        renderDots() {
            const dotsEl = document.getElementById('lantern-dots');
            let html = '';
            for (let i = 0; i < 3; i++) {
                const used = i >= this.lanternsLeft;
                html += `<div class="lantern-dot ${used ? 'used' : ''}">${Enigmes.SVG.lanternOn}</div>`;
            }
            dotsEl.innerHTML = html;
        },
        
        tapCell(y, x) {
            const cell = this.grid[y][x];
            
            if (this.tracing) {
                this.addToPath(y, x);
                return;
            }
            
            if (cell === 0 && this.lanternsLeft > 0) {
                const toLight = [[y, x]];
                if (y > 0) toLight.push([y-1, x]);
                if (y < 3) toLight.push([y+1, x]);
                if (x > 0) toLight.push([y, x-1]);
                if (x < 3) toLight.push([y, x+1]);
                
                toLight.forEach(c => {
                    if (!this.litCells.some(l => l[0] === c[0] && l[1] === c[1])) {
                        this.litCells.push(c);
                    }
                });
                
                this.lanternsLeft--;
                this.renderGrid();
                this.renderDots();
                
                setTimeout(() => {
                    this.litCells = this.litCells.filter(c => {
                        return !toLight.some(t => t[0] === c[0] && t[1] === c[1]);
                    });
                    this.renderGrid();
                }, 4000);
            }
        },
        
        validate() {
            if (!this.tracing) {
                this.tracing = true;
                this.path = [[0, 0]];
                document.getElementById('btn-trace').textContent = 'Valider mon chemin';
                document.getElementById('kodama-hint').textContent = 'Tape sur les cases une par une pour tracer !';
                this.renderGrid();
            } else {
                this.checkPath();
            }
        },
        
        addToPath(y, x) {
            const last = this.path[this.path.length - 1];
            const cell = this.grid[y][x];
            
            if (cell === 1) {
                document.getElementById('kodama-hint').textContent = "Oups ! C'est un mur, tu ne peux pas passer !";
                return;
            }
            
            const isAdjacent = (Math.abs(last[0] - y) + Math.abs(last[1] - x)) === 1;
            if (!isAdjacent) {
                document.getElementById('kodama-hint').textContent = "Avance case par case, pas de saut !";
                return;
            }
            
            const idx = this.path.findIndex(c => c[0] === y && c[1] === x);
            if (idx >= 0) {
                this.path = this.path.slice(0, idx + 1);
            } else {
                this.path.push([y, x]);
            }
            
            this.renderGrid();
        },
        
        checkPath() {
            const last = this.path[this.path.length - 1];
            
            if (last[0] === 3 && last[1] === 3) {
                let valid = true;
                for (const p of this.path) {
                    if (this.grid[p[0]][p[1]] === 1) {
                        valid = false;
                        break;
                    }
                }
                
                if (valid) {
                    Enigmes.success(1);
                } else {
                    document.getElementById('kodama-hint').textContent = "Ton chemin passe par un mur !";
                    Enigmes.errors++;
                    this.giveHint();
                }
            } else {
                document.getElementById('kodama-hint').textContent = "Tu n'as pas atteint le Neko !";
                Enigmes.errors++;
                this.giveHint();
            }
        },
        
        giveHint() {
            if (Enigmes.errors >= 2) {
                document.getElementById('kodama-hint').textContent = "Indice : Le chemin passe par le centre de la grille !";
            }
        },
        
        reset() {
            this.tracing = false;
            this.path = [];
            this.lanternsLeft = 3;
            this.litCells = [];
            document.getElementById('btn-trace').textContent = 'Tracer le chemin';
            this.renderGrid();
            this.renderDots();
            document.getElementById('kodama-hint').textContent = 'Tout est sombre... Éclaire les cases pour découvrir le chemin !';
        }
    },
    
    // ═══════════════════════════════════════════════════
    // ÉNIGME 2 — LES OFFRANDES DU TEMPLE
    // ═══════════════════════════════════════════════════
    
    enigme2: {
        offerings: [
            { id: 'rice', name: 'Riz', weight: 1 },
            { id: 'sake', name: 'Saké', weight: 2 },
            { id: 'fish', name: 'Poisson', weight: 3 },
            { id: 'fruit', name: 'Fruit', weight: 2 },
            { id: 'incense', name: 'Encens', weight: 1 },
            { id: 'bell', name: 'Clochette', weight: 4 }
        ],
        targetWeight: 5,
        plateItems: [],
        
        init() {
            this.plateItems = [];
            Enigmes.errors = 0;
            this.render();
        },
        
        render() {
            const html = `
                <div class="enigme-header">
                    <h2 class="enigme-title">Les Offrandes du Temple</h2>
                </div>
                
                <div class="enigme-instructions">
                    <div class="instruction-box">
                        <div class="instruction-icon">${Enigmes.SVG.star}${Enigmes.SVG.star}${Enigmes.SVG.star}${Enigmes.SVG.star}${Enigmes.SVG.star}</div>
                        <div class="instruction-text">
                            <strong>But :</strong> Choisis des offrandes pour obtenir exactement <span class="highlight">5 étoiles</span> !
                        </div>
                    </div>
                    <div class="instruction-steps">
                        <p><span class="step-num">1</span> Chaque offrande a un poids en étoiles</p>
                        <p><span class="step-num">2</span> Tape sur une offrande pour l'ajouter</p>
                        <p><span class="step-num">3</span> Tape encore pour la retirer</p>
                        <p><span class="step-num">4</span> Le total doit faire exactement 5 !</p>
                    </div>
                </div>
                
                <div class="enigme-game-area">
                    <div class="balance-display">
                        <div class="balance-target">
                            <span class="balance-label">Objectif :</span>
                            <div class="balance-stars target-stars">
                                ${Array(5).fill('<div class="star-icon">' + Enigmes.SVG.star + '</div>').join('')}
                            </div>
                        </div>
                        
                        <div class="balance-current">
                            <span class="balance-label">Ton total :</span>
                            <div class="balance-stars current-stars" id="current-stars"></div>
                            <span class="balance-number" id="current-weight-num">0</span>
                        </div>
                    </div>
                    
                    <div class="offerings-tray" id="offerings-tray"></div>
                </div>
                
                <div class="enigme-actions">
                    <button class="enigme-btn enigme-btn-reset" onclick="Enigmes.enigme2.reset()">Recommencer</button>
                    <button class="enigme-btn enigme-btn-validate" onclick="Enigmes.enigme2.validate()">Valider</button>
                </div>
                
                <div class="enigme-kodama">
                    <div class="kodama-new-head">
                        <div class="kodama-new-left-eye"></div>
                        <div class="kodama-new-right-eye"></div>
                    </div>
                    <div class="kodama-new-body"></div>
                </div>
                
                <div class="enigme-kodama-bubble">
                    <p class="enigme-kodama-text" id="kodama-hint">Tape sur les offrandes pour les sélectionner !</p>
                </div>
                
                <div class="enigme-particles">
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                </div>
            `;
            
            document.getElementById('enigme-screen').innerHTML = html;
            this.renderOfferings();
            this.updateDisplay();
        },
        
        renderOfferings() {
            const tray = document.getElementById('offerings-tray');
            let html = '';
            
            this.offerings.forEach(o => {
                const inPlate = this.plateItems.includes(o.id);
                html += `
                    <div class="offering-card ${inPlate ? 'selected' : ''}" onclick="Enigmes.enigme2.toggleOffering('${o.id}')">
                        <div class="offering-image">${Enigmes.SVG[o.id]}</div>
                        <div class="offering-name">${o.name}</div>
                        <div class="offering-weight">
                            ${Array(o.weight).fill('<span class="mini-star">' + Enigmes.SVG.star + '</span>').join('')}
                        </div>
                    </div>
                `;
            });
            
            tray.innerHTML = html;
        },
        
        toggleOffering(id) {
            const idx = this.plateItems.indexOf(id);
            if (idx >= 0) {
                this.plateItems.splice(idx, 1);
            } else {
                this.plateItems.push(id);
            }
            this.renderOfferings();
            this.updateDisplay();
        },
        
        getCurrentWeight() {
            return this.plateItems.reduce((sum, id) => {
                const o = this.offerings.find(x => x.id === id);
                return sum + (o ? o.weight : 0);
            }, 0);
        },
        
        updateDisplay() {
            const weight = this.getCurrentWeight();
            
            // Mettre à jour les étoiles
            const starsEl = document.getElementById('current-stars');
            let starsHtml = '';
            for (let i = 0; i < weight; i++) {
                starsHtml += '<div class="star-icon filled">' + Enigmes.SVG.star + '</div>';
            }
            starsEl.innerHTML = starsHtml;
            
            // Mettre à jour le nombre
            document.getElementById('current-weight-num').textContent = weight;
            
            // Feedback visuel
            const currentEl = document.querySelector('.balance-current');
            currentEl.classList.remove('too-low', 'too-high', 'perfect');
            
            if (weight < this.targetWeight) {
                currentEl.classList.add('too-low');
            } else if (weight > this.targetWeight) {
                currentEl.classList.add('too-high');
            } else {
                currentEl.classList.add('perfect');
            }
        },
        
        validate() {
            const weight = this.getCurrentWeight();
            
            if (weight === this.targetWeight) {
                Enigmes.success(2);
            } else {
                Enigmes.errors++;
                
                if (weight < this.targetWeight) {
                    document.getElementById('kodama-hint').textContent = `Il te manque ${this.targetWeight - weight} étoile(s) ! Ajoute des offrandes.`;
                } else {
                    document.getElementById('kodama-hint').textContent = `Tu as ${weight - this.targetWeight} étoile(s) en trop ! Retire des offrandes.`;
                }
                
                this.giveHint();
            }
        },
        
        giveHint() {
            if (Enigmes.errors >= 3) {
                document.getElementById('kodama-hint').textContent = "Indice : Riz (1) + Clochette (4) = 5 étoiles !";
            }
            if (Enigmes.errors >= 5) {
                document.getElementById('kodama-hint').textContent = "Autre idée : Poisson (3) + Saké (2) = 5 étoiles !";
            }
        },
        
        reset() {
            this.plateItems = [];
            this.renderOfferings();
            this.updateDisplay();
            document.getElementById('kodama-hint').textContent = 'Tape sur les offrandes pour les sélectionner !';
        }
    },
    
    // ═══════════════════════════════════════════════════
    // ÉNIGME 3 — LE MESSAGE DES ANCÊTRES
    // ═══════════════════════════════════════════════════
    
    enigme3: {
        key: [
            { symbol: 'sun', syllable: 'NE' },
            { symbol: 'moon', syllable: 'KO' },
            { symbol: 'wave', syllable: 'SA' },
            { symbol: 'flower', syllable: 'RA' }
        ],
        codedMessage: ['sun', 'moon'],
        solution: ['NE', 'KO'],
        solutionWord: 'NEKO',
        playerAnswer: [],
        
        init() {
            this.playerAnswer = [];
            Enigmes.errors = 0;
            this.render();
        },
        
        render() {
            const html = `
                <div class="enigme-header">
                    <h2 class="enigme-title">Le Message des Ancêtres</h2>
                </div>
                
                <div class="enigme-instructions">
                    <div class="instruction-box">
                        <div class="instruction-icon">${Enigmes.SVG.sun}${Enigmes.SVG.moon}</div>
                        <div class="instruction-text">
                            <strong>But :</strong> Traduis les symboles en syllabes pour découvrir le mot secret !
                        </div>
                    </div>
                    <div class="instruction-steps">
                        <p><span class="step-num">1</span> Regarde le tableau de correspondance</p>
                        <p><span class="step-num">2</span> Chaque symbole = une syllabe</p>
                        <p><span class="step-num">3</span> Tape sur les syllabes dans l'ordre</p>
                        <p><span class="step-num">4</span> Trouve le mot caché !</p>
                    </div>
                </div>
                
                <div class="enigme-game-area">
                    <div class="rosetta-stone">
                        <div class="rosetta-title">Tableau de traduction</div>
                        <div class="rosetta-grid">
                            ${this.key.map(k => `
                                <div class="rosetta-item">
                                    <div class="rosetta-symbol">${Enigmes.SVG[k.symbol]}</div>
                                    <div class="rosetta-arrow">=</div>
                                    <div class="rosetta-text">${k.syllable}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="decode-section">
                        <div class="decode-label">Message à décoder :</div>
                        <div class="coded-message">
                            ${this.codedMessage.map(s => `
                                <div class="coded-symbol">${Enigmes.SVG[s]}</div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="answer-section">
                        <div class="answer-label">Ta réponse :</div>
                        <div class="answer-zone" id="answer-zone">
                            ${this.codedMessage.map((_, i) => `
                                <div class="answer-slot" id="slot-${i}">?</div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="syllables-section">
                        <div class="syllables-label">Choisis les syllabes :</div>
                        <div class="syllables-tray" id="syllables-tray"></div>
                    </div>
                </div>
                
                <div class="enigme-actions">
                    <button class="enigme-btn enigme-btn-reset" onclick="Enigmes.enigme3.reset()">Recommencer</button>
                    <button class="enigme-btn enigme-btn-validate" onclick="Enigmes.enigme3.validate()">Valider</button>
                </div>
                
                <div class="enigme-kodama">
                    <div class="kodama-new-head">
                        <div class="kodama-new-left-eye"></div>
                        <div class="kodama-new-right-eye"></div>
                    </div>
                    <div class="kodama-new-body"></div>
                </div>
                
                <div class="enigme-kodama-bubble">
                    <p class="enigme-kodama-text" id="kodama-hint">Utilise le tableau pour traduire chaque symbole !</p>
                </div>
                
                <div class="enigme-particles">
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                    <div class="enigme-particle"></div>
                </div>
            `;
            
            document.getElementById('enigme-screen').innerHTML = html;
            this.renderSyllables();
        },
        
        renderSyllables() {
            const tray = document.getElementById('syllables-tray');
            const syllables = ['NE', 'KO', 'SA', 'RA', 'MI', 'TA'];
            
            let html = '';
            syllables.forEach(s => {
                const timesUsed = this.playerAnswer.filter(a => a === s).length;
                const timesInSolution = this.solution.filter(a => a === s).length;
                const isDisabled = timesUsed >= Math.max(timesInSolution, 1) && !this.solution.includes(s);
                
                html += `<button class="syllable-btn ${isDisabled ? 'used' : ''}" onclick="Enigmes.enigme3.addSyllable('${s}')">${s}</button>`;
            });
            
            tray.innerHTML = html;
        },
        
        addSyllable(syllable) {
            if (this.playerAnswer.length < this.codedMessage.length) {
                this.playerAnswer.push(syllable);
                this.renderAnswer();
                this.renderSyllables();
            }
        },
        
        renderAnswer() {
            this.playerAnswer.forEach((s, i) => {
                const slot = document.getElementById(`slot-${i}`);
                if (slot) {
                    slot.textContent = s;
                    slot.classList.add('filled');
                }
            });
        },
        
        validate() {
            if (this.playerAnswer.length < this.solution.length) {
                document.getElementById('kodama-hint').textContent = "Complète toutes les cases d'abord !";
                return;
            }
            
            let correct = true;
            for (let i = 0; i < this.solution.length; i++) {
                const slot = document.getElementById(`slot-${i}`);
                if (this.playerAnswer[i] === this.solution[i]) {
                    slot.classList.add('correct');
                } else {
                    slot.classList.add('wrong');
                    correct = false;
                }
            }
            
            if (correct) {
                document.getElementById('kodama-hint').textContent = `Bravo ! Le mot était "${this.solutionWord}" !`;
                setTimeout(() => Enigmes.success(3), 1200);
            } else {
                Enigmes.errors++;
                document.getElementById('kodama-hint').textContent = "Ce n'est pas ça... Regarde bien le tableau !";
                
                setTimeout(() => {
                    this.playerAnswer = [];
                    for (let i = 0; i < this.solution.length; i++) {
                        const slot = document.getElementById(`slot-${i}`);
                        slot.textContent = '?';
                        slot.classList.remove('filled', 'correct', 'wrong');
                    }
                    this.renderSyllables();
                    this.giveHint();
                }, 1500);
            }
        },
        
        giveHint() {
            if (Enigmes.errors >= 2) {
                document.getElementById('kodama-hint').textContent = "Indice : Soleil = NE, Lune = KO...";
            }
            if (Enigmes.errors >= 4) {
                document.getElementById('kodama-hint').textContent = "Le mot est un animal très mignon qu'on adore ici !";
            }
        },
        
        reset() {
            this.playerAnswer = [];
            for (let i = 0; i < this.solution.length; i++) {
                const slot = document.getElementById(`slot-${i}`);
                if (slot) {
                    slot.textContent = '?';
                    slot.classList.remove('filled', 'correct', 'wrong');
                }
            }
            this.renderSyllables();
            document.getElementById('kodama-hint').textContent = "Utilise le tableau pour traduire chaque symbole !";
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
