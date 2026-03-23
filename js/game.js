/* --- THEME MANAGER — Le Sanctuaire des 9 Nekos --- */

const ThemeManager = {

  themes: {
    sanctuary: '#5d1a4a',  // Default magenta hub
    void:      '#1a051d',  // Dark cinematic (Act 4)
    spirit:    '#4a1a00',  // Amber spirit world
    ritual:    '#2e0a25',  // Deep violet (Boussole)
    voyage:    '#0d1f3c',  // Ocean night (Act 1)
    decouverte:'#1a2e1a',  // Forest green (Act 2)
    sacre:     '#1a0a2e',  // Deep indigo (Act 3)
    daruma:    '#2e0000',  // Blood red (Act 4)
    rupture:   '#0a0a0a',  // Near black (climax)
  },

  _current: 'sanctuary',

  /**
   * Apply a theme by name or direct hex value.
   * @param {string} nameOrHex - Key from this.themes or any valid CSS color
   * @param {number} durationMs - Transition duration in ms (default 1200)
   */
  apply(nameOrHex, durationMs = 1200) {
    const color = this.themes[nameOrHex] ?? nameOrHex;
    const root = document.documentElement;

    // Update CSS transition duration dynamically
    root.style.setProperty(
      '--transition-bg',
      `background-color ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`
    );

    // Set the CSS variable (drives all elements using var(--bg-current))
    root.style.setProperty('--bg-current', color);

    // Direct body assignment — safety net for Android WebView under memory pressure.
    // On mobile, the CSS gradient (driven by --bg-glow/--bg-edge) handles body bg.
    if (!window.isMobileDevice) {
      document.body.style.backgroundColor = color;
    }

    // On desktop, patch active screen inline for reliable transitions.
    // On mobile, CSS custom properties (--bg-glow/--bg-edge) + .is-mobile body rule
    // handle the radial gradient automatically — inline override would flatten it.
    if (!window.isMobileDevice) {
      const activeScreen = document.querySelector('.screen.active');
      if (activeScreen) {
        activeScreen.style.transition = `background-color ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        activeScreen.style.backgroundColor = color;
      }
    }

    this._current = nameOrHex;
    console.log(`[ThemeManager] → ${nameOrHex} (${color}) over ${durationMs}ms`);

    // ── Bridge to WebGL renderer + CSS gradient vars ──
    if (typeof window.setRendererBgHex === 'function') {
      window.setRendererBgHex(color);
    }
  },

  /**
   * Snap to a color instantly (no transition) — for hard cuts.
   * @param {string} nameOrHex
   */
  snap(nameOrHex) {
    this.apply(nameOrHex, 0);
  },

  /**
   * Return to default sanctuary magenta.
   * @param {number} durationMs
   */
  reset(durationMs = 800) {
    this.apply('sanctuary', durationMs);
  },

  /**
   * Get the current resolved hex color.
   * @returns {string}
   */
  getCurrent() {
    return this.themes[this._current] ?? this._current;
  }
};


/* --- GAME.JS — Règles, Hub, Quiz, Minijeux, Final --- */

/* --- ACTIVATION DU MIROIR (Permission caméra diégétique) --- */
let mirrorRequested = false;
async function activateMirrorAndNext() {
    if (mirrorRequested) { nextRule(); return; }
    mirrorRequested = true;
    
    const status = document.getElementById('mirror-status');
    console.log('[Miroir] Demande de permissions caméra/audio...');
    
    // Vérifier si l'API est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('[Miroir] API mediaDevices non disponible');
        window.cameraPermission = 'denied';
        if(status) {
            status.style.display = 'block';
            status.innerHTML = '<span style="color:rgba(255,150,150,0.7);">Le Miroir ne peut s\'éveiller sur cet appareil... Les sceaux devront être entrés manuellement.</span>';
        }
        await new Promise(r => setTimeout(r, 800));
        nextRule();
        return;
    }
    
    try {
        // Demander les permissions - IMPORTANT: doit être déclenché par une action utilisateur
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" },
            audio: true
        });
        
        console.log('[Miroir] Permissions accordées!', stream.getTracks().map(t => t.kind));
        window.cameraPermission = 'granted';
        
        // Stocker le stream pour usage ultérieur (optionnel)
        window.cameraStream = stream;
        
        // Arrêter les tracks pour libérer la caméra (sera relancée par html5-qrcode)
        stream.getTracks().forEach(t => {
            console.log('[Miroir] Arrêt track:', t.kind);
            t.stop();
        });
        
        if(status) {
            status.style.display = 'block';
            status.innerHTML = '<span style="color:#a8d5a2;">✦ Le Miroir s\'éveille... ✦</span>';
        }
        if (typeof playGameSFX === 'function') playGameSFX('pop');
        
    } catch(err) {
        console.log('[Miroir] Erreur permissions:', err.name, err.message);
        window.cameraPermission = 'denied';
        
        if(status) {
            status.style.display = 'block';
            status.innerHTML = '<span style="color:rgba(255,150,150,0.7);">Le Miroir reste voilé... Les sceaux devront être entrés manuellement.</span>';
        }
    }
    
    await new Promise(r => setTimeout(r, 800));
    nextRule();
}

/* --- RÈGLES --- */
function nextRule() {
    playGameSFX('woosh');
    document.getElementById(`rule-${currentRule}`).style.display = 'none';
    currentRule++;
    if(currentRule > 4) {
        initGummyPaws();
        transitionScreen('screen-oath', "✨");
        document.getElementById('oath-names').innerText = mikoNames.join(" • ");
    } else {
        document.getElementById(`rule-${currentRule}`).style.display = 'flex';
    }
}

/* --- CONSTELLATION / SERMENT : GUMMY PAWS ULTIMATE --- */

const PAW_COLORS = [
    '#ffb7c5', '#98e8d4', '#fde68a', '#c4b5fd',
    '#fca5a5', '#6ee7b7', '#a5b4fc', '#fdba74'
];
const PAW_COLORS_DARK = [
    '#ff1493', '#00b386', '#f59e0b', '#8b5cf6',
    '#ef4444', '#10b981', '#6366f1', '#f97316'
];

let lockedPaws = [];
let pawElements = [];

function initGummyPaws() {
    const cBox = document.getElementById('constellation-box');
    if (!cBox) return;
    cBox.innerHTML = '';
    lockedPaws = [];
    pawElements = [];

    const touchCountEl = document.getElementById('touch-count');
    if (touchCountEl) { touchCountEl.innerText = '0'; touchCountEl.style.color = 'var(--gold)'; touchCountEl.style.transform = 'scale(1)'; }

    const isMobile = window.innerWidth < window.innerHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Calcul positions 4-haut / 4-bas sur mobile, ellipse sur desktop
    const getPositions = () => {
        if (isMobile) {
            // Zone sous le bloc texte (frame-parchemin ~170px) jusqu'en bas
            const topY = vh * 0.27;   // rangée haute — sous le texte
            const botY = vh * 0.78;   // rangée basse — au-dessus du bas
            const margin = vw * 0.10; // marge gauche/droite
            const step = (vw - margin * 2) / 3; // 3 espaces pour 4 pattes
            return [
                // Rangée haute — 4 pattes
                { x: margin,            y: topY },
                { x: margin + step,     y: topY },
                { x: margin + step * 2, y: topY },
                { x: margin + step * 3, y: topY },
                // Rangée basse — 4 pattes
                { x: margin,            y: botY },
                { x: margin + step,     y: botY },
                { x: margin + step * 2, y: botY },
                { x: margin + step * 3, y: botY },
            ];
        } else {
            // Desktop — ellipse classique
            const radius = Math.min(vw, vh) * 0.36;
            const cx = vw / 2, cy = vh / 2;
            return Array.from({length: 8}, (_, i) => {
                const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
                return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
            });
        }
    };
    const positions = getPositions();

    // Flag pour masquer le parchemin au premier tap
    let parchemin = document.querySelector('#screen-oath .frame-parchemin');
    if (parchemin) { parchemin.style.opacity = '1'; parchemin.style.display = ''; }
    let firstTapDone = false;

    PAW_COLORS.forEach((color, index) => {
        const { x, y } = positions[index];

        const paw = document.createElement('div');
        paw.className = 'gummy-paw';
        paw.style.setProperty('--paw-color', color);
        paw.style.setProperty('--paw-dark', PAW_COLORS_DARK[index]);
        paw.style.animationDelay = `${index * 0.3}s`;
        paw.style.left = `${x}px`;
        paw.style.top = `${y}px`;
        paw.style.background = `radial-gradient(circle at 35% 35%, ${color} 0%, ${PAW_COLORS_DARK[index]} 100%)`;

        // SVG ombres patte
        paw.innerHTML = `
            <svg viewBox="0 0 100 100" width="100%" height="100%" style="position:absolute;top:0;left:0;z-index:2;opacity:0.25;pointer-events:none;">
                <circle cx="50" cy="65" r="22" fill="rgba(0,0,0,1)"/>
                <circle cx="25" cy="35" r="11" fill="rgba(0,0,0,1)"/>
                <circle cx="50" cy="18" r="12" fill="rgba(0,0,0,1)"/>
                <circle cx="75" cy="35" r="11" fill="rgba(0,0,0,1)"/>
            </svg>
            <div class="paw-charge-ring">
                <svg viewBox="0 0 80 80" width="80" height="80" style="position:absolute;top:-15px;left:-15px;">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="4"
                        stroke-dasharray="220" stroke-dashoffset="220" stroke-linecap="round"
                        class="charge-arc" style="transform:rotate(-90deg);transform-origin:40px 40px;transition:stroke-dashoffset 2s linear;"/>
                </svg>
            </div>
            <div class="paw-spark"></div>`;

        let holdTimer = null;
        let isLocked = false;
        let audioRamp = null;

        const startHold = (e) => {
            if (e.cancelable) e.preventDefault();
            if (isLocked) return;

            // TEST_MODE desktop : clic simple suffit
            if (TEST_MODE && e.pointerType === 'mouse') {
                // Masquer le parchemin au premier tap
                if (!firstTapDone && parchemin) {
                    firstTapDone = true;
                    parchemin.style.transition = 'opacity 0.5s ease';
                    parchemin.style.opacity = '0';
                    setTimeout(() => { parchemin.style.display = 'none'; }, 500);
                }
                isLocked = true;
                paw.classList.add('locked');
                try { playGameSFX('chime_portal'); } catch(e2) {}
                lockedPaws.push(paw);
                const touchCountEl = document.getElementById('touch-count');
                if (touchCountEl) {
                    touchCountEl.innerText = lockedPaws.length;
                    touchCountEl.style.color = color;
                    touchCountEl.style.transform = 'scale(1.4)';
                    setTimeout(() => { touchCountEl.style.transform = 'scale(1)'; }, 300);
                }
                if (lockedPaws.length > 1) drawLaser(lockedPaws[lockedPaws.length - 2], paw, lockedPaws.length - 2, index);
                if (lockedPaws.length >= 8 || lockedPaws.length >= 1) triggerSupernova();
                return;
            }

            // Masquer le parchemin au premier tap
            if (!firstTapDone && parchemin) {
                firstTapDone = true;
                parchemin.style.transition = 'opacity 0.5s ease';
                parchemin.style.opacity = '0';
                setTimeout(() => { parchemin.style.display = 'none'; }, 500);
            }
            paw.classList.add('holding');
            if (navigator.vibrate) navigator.vibrate(15);
            // Son qui monte
            try {
                if (audioCtx && audioCtx.state !== 'suspended') {
                    const o = audioCtx.createOscillator();
                    const g = audioCtx.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(300, audioCtx.currentTime);
                    o.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 2);
                    g.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    o.connect(g); g.connect(masterGain || audioCtx.destination);
                    o.start(); o.stop(audioCtx.currentTime + 2.1);
                    audioRamp = o;
                }
            } catch(e2) {}
            // Démarrer la progression SVG
            const arc = paw.querySelector('.charge-arc');
            if (arc) { arc.style.strokeDashoffset = '220'; void arc.offsetWidth; arc.style.strokeDashoffset = '0'; }

            playGameSFX('beep', 440 + (index * 55));
            holdTimer = setTimeout(() => {
                isLocked = true;
                paw.classList.remove('holding');
                paw.classList.add('locked');
                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                // Son cristal
                try {
                    if (audioCtx) {
                        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                        o.type = 'sine'; o.frequency.value = 1200 + index * 80;
                        g.gain.setValueAtTime(0.25, audioCtx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
                        o.connect(g); g.connect(masterGain || audioCtx.destination);
                        o.start(); o.stop(audioCtx.currentTime + 0.6);
                    }
                } catch(e2) {}
                // Flash couleur
                const flash = document.createElement('div');
                flash.style.cssText = `position:fixed;inset:0;background:radial-gradient(circle at ${x/window.innerWidth*100}% ${y/window.innerHeight*100}%,${color}88 0%,transparent 60%);z-index:8999;pointer-events:none;opacity:1;transition:opacity 0.4s ease;`;
                document.body.appendChild(flash);
                requestAnimationFrame(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 500); });

                lockedPaws.push(paw);
                if (touchCountEl) {
                    touchCountEl.innerText = lockedPaws.length;
                    touchCountEl.style.color = color;
                    touchCountEl.style.transform = 'scale(1.4)';
                    setTimeout(() => { touchCountEl.style.transform = 'scale(1)'; }, 300);
                }
                if (lockedPaws.length > 1) drawLaser(lockedPaws[lockedPaws.length - 2], paw, lockedPaws.length - 2, index);
                if (lockedPaws.length >= 8 || (TEST_MODE && lockedPaws.length >= 1)) triggerSupernova();
            }, 2000);
        };

        const cancelHold = (e) => {
            if (e.cancelable) e.preventDefault();
            if (isLocked) return;
            clearTimeout(holdTimer);
            if (audioRamp) { try { audioRamp.stop(); } catch(e2) {} audioRamp = null; }
            const arc = paw.querySelector('.charge-arc');
            if (arc) { arc.style.transition = 'none'; arc.style.strokeDashoffset = '220'; }
            paw.classList.remove('holding');
        };

        paw.addEventListener('pointerdown', startHold);
        paw.addEventListener('pointerup', cancelHold);
        paw.addEventListener('pointercancel', cancelHold);
        paw.addEventListener('pointerleave', cancelHold);

        cBox.appendChild(paw);
        // angle pour l'animation d'envol — calculé depuis le centre
        const flyAngle = Math.atan2(y - vh / 2, x - vw / 2);
        pawElements.push({ el: paw, angle: flyAngle, x, y, color });
    });
}

function drawLaser(pawA, pawB, idxA, idxB) {
    const cBox = document.getElementById('constellation-box');
    if (!cBox) return;
    const rectA = pawA.getBoundingClientRect();
    const rectB = pawB.getBoundingClientRect();
    const boxRect = cBox.getBoundingClientRect();
    const x1 = rectA.left - boxRect.left + rectA.width / 2;
    const y1 = rectA.top - boxRect.top + rectA.height / 2;
    const x2 = rectB.left - boxRect.left + rectB.width / 2;
    const y2 = rectB.top - boxRect.top + rectB.height / 2;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const colorA = PAW_COLORS[idxA % PAW_COLORS.length];
    const colorB = PAW_COLORS[idxB % PAW_COLORS.length];

    const laser = document.createElement('div');
    laser.className = 'laser-beam';
    laser.style.cssText = `left:${x1}px;top:${y1}px;transform:translateY(-50%) rotate(${angle}rad);background:linear-gradient(90deg,${colorA},#fff 40%,#fff 60%,${colorB});--length:${length}px;`;
    cBox.appendChild(laser);

    // Particules voyageant le long du laser
    for (let p = 0; p < 3; p++) {
        const particle = document.createElement('div');
        particle.className = 'laser-particle';
        particle.style.cssText = `left:${x1}px;top:${y1}px;transform:rotate(${angle}rad);animation-delay:${p * 0.4}s;--length:${length}px;--pcolor:${colorA};`;
        cBox.appendChild(particle);
    }
}

function triggerSupernova() {
    document.querySelectorAll('.gummy-paw').forEach(p => p.style.pointerEvents = 'none');

    // Temps 1 — super-blast lasers
    document.querySelectorAll('.laser-beam').forEach(l => l.classList.add('super-blast'));

    // Temps 2 — onde supernova
    setTimeout(() => {
        const cBox = document.getElementById('constellation-box');
        if (!cBox) return;
        const wave = document.createElement('div');
        wave.className = 'supernova-wave';
        wave.style.background = `conic-gradient(${PAW_COLORS.join(',')})`;
        cBox.appendChild(wave);

        playGameSFX('chime_portal');
        if (navigator.vibrate) navigator.vibrate([100, 50, 200, 100, 300]);
        confetti({ particleCount: 250, spread: 360, startVelocity: 45, colors: PAW_COLORS, origin: { x: 0.5, y: 0.5 } });
    }, 300);

    // Temps 3 — pattes s'envolent
    setTimeout(() => {
        pawElements.forEach(({ el, angle }) => {
            el.style.transition = 'transform 1s ease-in, opacity 0.8s ease';
            const dist = Math.min(window.innerWidth, window.innerHeight) * 0.6;
            el.style.transform = `translate(-50%,-50%) translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) rotate(720deg) scale(0)`;
            el.style.opacity = '0';
        });
    }, 500);

    setTimeout(() => {
        gameStartTime = Date.now();
        enterHub();
    }, 2200);
}

function validateOath() {
    playGameSFX('chime_portal'); confetti({ particleCount: 150, colors: ['#ffd700', '#ffb7c5', '#ffffff', '#c9fffe'] });
    setTimeout(() => { gameStartTime = Date.now(); enterHub(); }, 1500);
}

/* --- HUB --- */
function updateHeartBeat() {
    hubTimer++;
    const heart = document.getElementById('shadow-heart');
    const beatSpeed = Math.max(0.2, 1 - (hubTimer / 60)); 
    const scale = 1 + (hubTimer / 100);
    heart.style.animation = `pulse-core ${beatSpeed}s infinite alternate`;
    heart.style.transform = `scale(${scale})`;
    
    document.documentElement.style.setProperty('--darkness', 0); 
    if(hubTimer % Math.ceil(beatSpeed*2) === 0) playGameSFX('heartbeat');
}

function enterHub() {
    // Détection ?seal= dans l'URL — lancer directement le bon gardien
    const sealParam = urlParams.get('seal');
    if (sealParam) {
        const sealIdx = guardianData.findIndex(g => g.qr === sealParam);
        if (sealIdx !== -1 && !foundGuardians.has(sealIdx)) {
            // Gardien non encore trouvé — lancer son quiz directement
            currentFound = sealIdx;
            urlParams.delete('seal');
            window.history.replaceState({}, '', window.location.pathname);
            transitionScreen('screen-hub');
            setTimeout(() => {
                clearInterval(heartInterval);
                setupQuiz();
            }, 1200);
            return;
        } else if (sealIdx !== -1 && foundGuardians.has(sealIdx)) {
            // Gardien déjà trouvé — afficher le hub normalement
            urlParams.delete('seal');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }
    transitionScreen('screen-hub');
    
    const grid = document.getElementById('grid-nekos'); grid.innerHTML = "";
    guardianData.forEach((g, i) => { 
        let isUnlocked = foundGuardians.has(i);
        const svgIcon = getRelicSVG(i);
        grid.innerHTML += `<div id="slot-${i}" class="slot ${isUnlocked ? 'unlocked' : 'locked'}" onclick="handleSlotClick(${i})">${svgIcon}</div>`; 
    });
    document.getElementById('found-count').innerText = foundGuardians.size;
    document.getElementById('hub-progress-bar').style.width = (foundGuardians.size / 9 * 100) + "%";

    updateMikoBelt();
    document.getElementById('miko-belt').classList.add('visible');

    updateDynamicMusic(); document.documentElement.style.setProperty('--bg-lightness', (10 + (foundGuardians.size * 8)) + '%');
    hubTimer = 0; document.documentElement.style.setProperty('--darkness', 0); document.getElementById('shadow-heart').style.transform = `scale(1)`;
    if(heartInterval) clearInterval(heartInterval); heartInterval = setInterval(updateHeartBeat, 1000);
    if(!window.needleInterval) window.needleInterval = setInterval(() => { if(!hasGyro) document.getElementById('needle-gold').style.transform=`rotate(${Math.sin(Date.now()/500)*35}deg)`; }, 50);
}

function updateMikoBelt() {
    const belt = document.getElementById('miko-belt');
    belt.innerHTML = '';
    guardianData.forEach((g, i) => {
        const isFilled = foundGuardians.has(i);
        const slot = document.createElement('div');
        slot.className = `belt-slot ${isFilled ? 'belt-filled' : ''}`;
        slot.innerHTML = getRelicSVG(i);
        slot.onclick = () => showBeltTooltip(slot, i);
        belt.appendChild(slot);
    });
}

let tooltipTimeout = null;
function showBeltTooltip(slotEl, index) {
    document.querySelectorAll('.belt-tooltip').forEach(t => t.remove());
    clearTimeout(tooltipTimeout);
    
    const g = guardianData[index];
    const isFilled = foundGuardians.has(index);
    
    const tip = document.createElement('div');
    tip.className = 'belt-tooltip';
    tip.innerHTML = isFilled 
        ? `<div class="tooltip-name">${g.n}</div><div>${g.instr}</div>`
        : `<div style="color:rgba(255,255,255,0.5);">Sceau verrouillé</div>`;
    slotEl.appendChild(tip);
    
    requestAnimationFrame(() => tip.classList.add('show'));
    playGameSFX('pop');
    
    tooltipTimeout = setTimeout(() => {
        tip.classList.remove('show');
        setTimeout(() => tip.remove(), 300);
    }, 2500);
}

function handleSlotClick(idx) { 
    if(!foundGuardians.has(idx)) { currentFound = idx; clearInterval(heartInterval); startScan(); } 
    else if (foundGuardians.has(idx)) { showBeltTooltip(document.getElementById(`slot-${idx}`), idx); }
}

/* --- QR SCAN --- */
let scanTimeout = null;
let scanTimeout2 = null;
let torchTrack = null;

function startScan() {
    console.log('[Scan] Démarrage du scan...');
    
    if(TEST_MODE) {
        console.log('[Scan] Mode TEST activé - bypass caméra');
        document.getElementById('btn-scan').style.display = 'none';
        setTimeout(() => {
            playGameSFX('pop');
            const flash = document.getElementById('flash'); flash.style.background = 'white'; flash.style.opacity = 1;
            setTimeout(() => { flash.style.opacity = 0; clearInterval(heartInterval); setupQuiz(); }, 500);
        }, 1000);
        return; 
    }

    // Vérifier si la librairie QR est chargée
    if (typeof Html5Qrcode === 'undefined') {
        console.error('[Scan] Html5Qrcode non chargé! Fallback vers entrée manuelle.');
        showManualEntry();
        return;
    }

    if (window.cameraPermission === 'denied') {
        console.log('[Scan] Permission caméra refusée - mode manuel');
        showManualEntry();
        return;
    }

    console.log('[Scan] Activation mode AR...');
    document.body.classList.add('ar-mode');
    document.getElementById('btn-scan').style.display = 'none'; 
    document.getElementById('btn-cancel-scan').style.display = 'block';
    
    const overlay = document.getElementById('scan-overlay');
    const circle = overlay.querySelector('.scan-circle');
    circle.classList.remove('scan-success', 'scan-wrong');
    circle.classList.add('scan-active');
    document.getElementById('scan-status').textContent = 'Le miroir cherche les sceaux cachés...';
    document.getElementById('manual-entry').style.display = 'none';
    document.getElementById('scan-result').style.display = 'none';
    document.getElementById('btn-manual').style.display = 'none';

    try {
        if(!html5QrcodeScanner) {
            console.log('[Scan] Création du scanner Html5Qrcode...');
            html5QrcodeScanner = new Html5Qrcode("qr-reader");
        }
        
        console.log('[Scan] Démarrage de la caméra...');
        html5QrcodeScanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: 250, aspectRatio: 1 }, 
            async (decodedText) => {
                console.log('[Scan] QR détecté:', decodedText);
                clearTimeout(scanTimeout); clearTimeout(scanTimeout2);
                
                // Extraire le seal depuis une URL complète ou comparer directement
                const extractSeal = (text) => {
                    try {
                        const u = new URL(text);
                        return u.searchParams.get('seal') || text;
                    } catch(e) { return text; }
                };
                const scannedSeal = extractSeal(decodedText);
                // Chercher le gardien correspondant parmi ceux non encore trouvés
                const scannedIdx = guardianData.findIndex(g => g.qr === scannedSeal);
                if (scannedIdx !== -1 && !foundGuardians.has(scannedIdx)) {
                    currentFound = scannedIdx; // Setter le bon gardien
                }
                if(scannedSeal === guardianData[currentFound].qr && !foundGuardians.has(currentFound)) {
                    circle.classList.remove('scan-active');
                    circle.classList.add('scan-success');
                    
                    playGameSFX('pop'); playMikoChime(currentFound);
                    if(navigator.vibrate) navigator.vibrate([50, 30, 100]);
                    
                    document.getElementById('scan-status').textContent = '✦ Sceau déchiffré ! ✦';
                    showDiscoveryScreen(currentFound);
                    
                    const flash = document.getElementById('flash'); 
                    flash.style.background = 'rgba(255,215,0,0.6)'; flash.style.opacity = 1;
                    setTimeout(() => { flash.style.opacity = 0; flash.style.background = 'transparent'; }, 400);
                    
                    setTimeout(() => { stopScan(); clearInterval(heartInterval); setupQuiz(); }, 1500);
                    
                } else {
                    circle.classList.add('scan-wrong');
                    playWrong(); if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
                    document.getElementById('scan-status').textContent = 'Ce n\'est pas le bon sceau... Continuez de chercher !';
                    setTimeout(() => circle.classList.remove('scan-wrong'), 500);
                }
            }
        ).then(() => {
            console.log('[Scan] Caméra démarrée avec succès!');
        }).catch(err => { 
            console.error('[Scan] Erreur démarrage caméra:', err);
            document.getElementById('scan-status').textContent = 'Le miroir ne s\'ouvre pas...';
            showManualEntry();
        });
    } catch(e) {
        console.error('[Scan] Exception:', e);
        showManualEntry();
    }
    
    scanTimeout = setTimeout(() => {
        document.getElementById('scan-status').textContent = 'Le sceau résiste... Essayez de l\'éclairer.';
        document.getElementById('btn-torch').style.display = 'inline-block';
    }, 15000);
    
    scanTimeout2 = setTimeout(() => {
        document.getElementById('scan-status').textContent = 'Le miroir peine à lire ce sceau...';
        document.getElementById('btn-manual').style.display = 'inline-block';
    }, 30000);
}

function stopScan() {
    clearTimeout(scanTimeout); clearTimeout(scanTimeout2);
    document.body.classList.remove('ar-mode');
    document.getElementById('btn-scan').style.display = 'block'; 
    document.getElementById('btn-cancel-scan').style.display = 'none';
    if(torchTrack) { torchTrack.applyConstraints({ advanced: [{ torch: false }] }).catch(()=>{}); torchTrack = null; }
    if(html5QrcodeScanner) html5QrcodeScanner.stop().catch(e => console.log(e));
}

function toggleTorch() {
    if (!html5QrcodeScanner) return;
    try {
        const videoElement = document.querySelector('#qr-reader video');
        if (videoElement && videoElement.srcObject) {
            const track = videoElement.srcObject.getVideoTracks()[0];
            if (track) {
                const capabilities = track.getCapabilities();
                if (capabilities.torch) {
                    const isOn = torchTrack !== null;
                    track.applyConstraints({ advanced: [{ torch: !isOn }] });
                    torchTrack = isOn ? null : track;
                    document.getElementById('btn-torch').textContent = isOn ? '🔦 Éclairer' : '🔦 Éteindre';
                } else {
                    document.getElementById('btn-torch').textContent = '🔦 Non supporté';
                }
            }
        }
    } catch(e) { console.log('[Torch] Erreur:', e); }
}

function showManualEntry() {
    document.getElementById('manual-entry').style.display = 'block';
    document.getElementById('manual-code').value = '';
    document.getElementById('manual-code').focus();
    document.getElementById('scan-status').textContent = 'Entrez le code inscrit sous le sceau :';
}

function submitManualCode() {
    const code = document.getElementById('manual-code').value.trim().toUpperCase();
    if (!code) return;
    
    // Chercher le gardien correspondant parmi ceux non encore trouvés
    const manualIdx = guardianData.findIndex(g => g.qr === code || g.qr.toUpperCase() === code);
    if (manualIdx !== -1 && !foundGuardians.has(manualIdx)) currentFound = manualIdx;
    if (code === guardianData[currentFound].qr || code === guardianData[currentFound].qr.toUpperCase()) {
        playGameSFX('pop'); playMikoChime(currentFound);
        if(navigator.vibrate) navigator.vibrate([50, 30, 100]);
        
        const flash = document.getElementById('flash'); 
        flash.style.background = 'rgba(255,215,0,0.6)'; flash.style.opacity = 1;
        setTimeout(() => { flash.style.opacity = 0; flash.style.background = 'transparent'; }, 400);
        
        document.getElementById('manual-entry').style.display = 'none';
        document.getElementById('scan-status').textContent = '✦ Sceau déchiffré ! ✦';
        
        setTimeout(() => { stopScan(); clearInterval(heartInterval); setupQuiz(); }, 1000);
    } else {
        playWrong(); if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
        document.getElementById('manual-code').value = '';
        document.getElementById('manual-code').style.borderColor = '#ff4444';
        setTimeout(() => document.getElementById('manual-code').style.borderColor = 'var(--gold)', 500);
    }
}

/* --- QUIZ --- */
let quizFuseTime = 100;

function setupQuiz() {
    // FIX MURMURE EMPILÉ : On supprime les anciens indices
    document.querySelectorAll('.quiz-hint').forEach(e => e.remove());

    const g = guardianData[currentFound];
    document.getElementById('quiz-emoji').innerHTML = getRelicSVG(currentFound); 
    document.getElementById('quiz-title').innerText = "Garde " + g.n; 
    document.getElementById('quiz-question').innerText = g.q;
    let html = ""; g.a.forEach((opt, idx) => html += `<div id="opt-${idx}" class="btn-ema" onclick="verifyQuiz(${idx})">${opt}</div>`);
    document.getElementById('quiz-options').innerHTML = html;
    
    transitionScreen('screen-quiz');
    
    // Voix désactivée sur le quiz

    quizFuseTime = 100; 
    const fuseBar = document.getElementById('fuse-bar');
    const incenseTip = document.getElementById('incense-tip');
    fuseBar.setAttribute('width', '300');
    let hintGiven2 = false;

    if(quizInterval) clearInterval(quizInterval);
    
    function quizTick() {
        quizFuseTime -= 1; 
        const w = Math.max(quizFuseTime * 3, 0);
        fuseBar.setAttribute('width', w);
        if(incenseTip) incenseTip.setAttribute('cx', w);
        
        if(quizFuseTime <= 20 && !hintGiven2) {
            hintGiven2 = true;
            const correctIdx = guardianData[currentFound].r;
            const correctOpt = document.getElementById(`opt-${correctIdx}`);
            if(correctOpt) correctOpt.style.borderColor = 'rgba(255,215,0,0.4)';
        }
        
        if(quizFuseTime <= 0) { 
            playWrong();
            document.body.classList.add('shake-screen');
            setTimeout(() => document.body.classList.remove('shake-screen'), 500);
            quizFuseTime = 100;
            hintGiven2 = false;
        }
    }
    
    quizInterval = setInterval(quizTick, 100);
}

function verifyQuiz(idx) {
    if(idx === guardianData[currentFound].r) { 
        clearInterval(quizInterval); cancelVoice();
        // Flash vert sur la bonne réponse
        const correctEl = document.getElementById(`opt-${idx}`);
        if(correctEl) { correctEl.style.background = 'rgba(110,231,183,0.4)'; correctEl.style.borderColor = '#6ee7b7'; correctEl.style.transform = 'scale(1.04)'; }
        playCorrect(); confetti({ particleCount: 50, colors: ['#ffd700', '#ffb7c5', '#ffffff'] }); 
        setTimeout(() => playMinigame(), 700); 
    } 
    else { 
        // Flash rouge + perte vie
        const wrongEl = document.getElementById(`opt-${idx}`);
        if(wrongEl) { wrongEl.style.background = 'rgba(252,165,165,0.4)'; wrongEl.style.borderColor = '#ef4444'; setTimeout(() => { wrongEl.style.background = ''; wrongEl.style.borderColor = ''; }, 600); }
        wrongEl && wrongEl.classList.add('broken'); 
        playWrong(); 
        document.body.classList.add('shake-screen'); 
        setTimeout(() => document.body.classList.remove('shake-screen'), 500); 
        quizFuseTime -= 25;
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}

/* --- MINIJEUX --- */
function playMinigame() {
    // Nettoyer les intervalles résiduels du quiz
    if (typeof quizInterval !== 'undefined' && quizInterval) { clearInterval(quizInterval); quizInterval = null; }

    // Init audio si pas encore fait (mode debug saute Commencer l'aventure)
    try {
        if (!audioCtx && typeof initSfx === 'function') initSfx();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch(e2) {}
    cancelVoice();

    // Init audio si pas encore fait (mode debug saute "Commencer l'aventure")
    try {
        if (!audioCtx && typeof initSfx === 'function') initSfx();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch(e) {}

    const g = guardianData[currentFound];
    transitionScreen('screen-game');

    document.getElementById('target-name').innerText = g.n;
    document.getElementById('game-instr').innerText = g.instr;
    const arena = document.getElementById('game-arena');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');

    // Helper : cercle SVG de progression (remplace la barre)
    const makeCircleProgress = (color='#ffd700') => {
        const id = 'cp-arc';
        arena.insertAdjacentHTML('beforeend', `
            <svg id="circle-progress" viewBox="0 0 120 120" width="120" height="120"
                 style="position:absolute;top:8px;right:8px;pointer-events:none;opacity:0.9;">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
                <circle id="${id}" cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="8"
                    stroke-dasharray="326" stroke-dashoffset="326" stroke-linecap="round"
                    style="transform:rotate(-90deg);transform-origin:60px 60px;transition:stroke-dashoffset 0.15s ease;"/>
            </svg>`);
    };
    const updateCircleProgress = (pct) => {
        const arc = document.getElementById('cp-arc');
        if (arc) arc.style.strokeDashoffset = 326 - (326 * pct / 100);
    };

    // Helper : onde de choc
    const shockwave = (x, y, color='rgba(255,215,0,0.6)') => {
        const w = document.createElement('div');
        w.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0;border-radius:50%;
            border:3px solid ${color};transform:translate(-50%,-50%);pointer-events:none;
            animation:shockwaveAnim 0.5s ease-out forwards;z-index:10;`;
        arena.appendChild(w);
        setTimeout(() => w.remove(), 500);
    };

    // Helper : fissure écran
    const crackScreen = () => {
        const cr = document.createElement('div');
        cr.innerHTML = `<svg viewBox="0 0 400 200" style="width:100%;height:80px;position:fixed;top:50%;left:0;transform:translateY(-50%);pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.1s;">
            <path d="M200,0 L180,60 L210,70 L170,130 L200,140 L155,200" stroke="#ff4444" stroke-width="3" fill="none"/>
            <path d="M200,0 L220,50 L195,65 L230,120 L205,135 L245,200" stroke="#ff2222" stroke-width="2" fill="none"/>
        </svg>`;
        document.body.appendChild(cr);
        const svg = cr.querySelector('svg');
        requestAnimationFrame(() => { svg.style.opacity = '0.8'; });
        setTimeout(() => { svg.style.opacity = '0'; setTimeout(() => cr.remove(), 200); }, 600);
    };

    arena.innerHTML = ''; // Nettoyage — chaque jeu gère son propre contenu
    progressContainer.style.display = 'block';
    // target et cp définis par chaque jeu ci-dessous

    let score = 0; let timer; let isGameActive = true;
    const updateP = (s, goal) => {
        if (!isGameActive) return;
        const p = Math.min((s / goal) * 100, 100);
        progressBar.style.width = p + '%';
        updateCircleProgress(p);
        if (p >= 100) { isGameActive = false; clearInterval(timer); winGame(); }
    };

    // ══════════════════════════════════════════
    // 🍡 HOLD — La Pesée Sacrée
    // ══════════════════════════════════════════
    if (g.type === 'hold') {
        arena.innerHTML = `
            <div id="game-target" class="game-target-svg" style="position:relative;display:flex;align-items:center;justify-content:center;">
                ${getRelicSVG(currentFound)}
                <div id="hold-ring" style="position:absolute;inset:-20px;border-radius:50%;border:3px solid rgba(255,183,197,0.3);transition:all 0.05s;"></div>
            </div>`;
        const t2 = document.getElementById('game-target');
        makeCircleProgress('#ffb7c5');

        // Particules orbitales
        const particles = [];
        for (let i = 0; i < 6; i++) {
            const p = document.createElement('div');
            p.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:#ffb7c5;
                pointer-events:none;opacity:0;transition:opacity 0.3s;
                box-shadow:0 0 6px #ff69b4;`;
            arena.appendChild(p);
            particles.push(p);
        }

        let holding = false; let holdScore = 0;
        let holdOsc = null, holdGain = null;
        const startH = (e) => {
            if (e.cancelable) e.preventDefault();
            holding = true;
            particles.forEach(p => p.style.opacity = '1');
            t2.style.filter = 'drop-shadow(0 0 20px #ffb7c5)';
            // Oscillateur montant pendant le hold
            try {
                if (audioCtx && audioCtx.state !== 'suspended') {
                    holdOsc = audioCtx.createOscillator(); holdGain = audioCtx.createGain();
                    holdOsc.type = 'sine'; holdOsc.frequency.setValueAtTime(280, audioCtx.currentTime);
                    holdOsc.frequency.linearRampToValueAtTime(660, audioCtx.currentTime + 2.5);
                    holdGain.gain.setValueAtTime(0, audioCtx.currentTime);
                    holdGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.2);
                    holdOsc.connect(holdGain); holdGain.connect(masterGain || audioCtx.destination);
                    holdOsc.start();
                }
            } catch(e2) {}
            timer = setInterval(() => {
                if (!holding || !isGameActive) return;
                holdScore += 2;
                // Orbite des particules
                particles.forEach((p, i) => {
                    const a = (i/6)*Math.PI*2 + holdScore*0.08;
                    const r = 60 + Math.sin(holdScore*0.05)*10;
                    const rect = arena.getBoundingClientRect();
                    const cx = arena.offsetWidth/2;
                    const cy = arena.offsetHeight/2;
                    p.style.left = (cx + Math.cos(a)*r - 4) + 'px';
                    p.style.top = (cy + Math.sin(a)*r - 4) + 'px';
                });
                // Scale pulsant
                const sc = 1 + (holdScore/100)*0.3 + Math.sin(holdScore*0.3)*0.05;
                t2.style.transform = `scale(${sc})`;
                if (navigator.vibrate) navigator.vibrate(5);
                // Son continu rise (joué une seule fois au startH)
                updateP(holdScore, 100);
            }, 50);
        };
        const endH = () => {
            holding = false;
            clearInterval(timer);
            particles.forEach(p => p.style.opacity = '0');
            t2.style.filter = '';
            // Arrêter oscillateur
            try { if (holdOsc) { holdGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15); holdOsc.stop(audioCtx.currentTime + 0.15); holdOsc = null; } } catch(e2) {}
        };
        t2.onmousedown = startH; t2.onmouseup = endH;
        t2.ontouchstart = startH; t2.ontouchend = endH;
    }

    // ══════════════════════════════════════════
    // ⚔️ RHYTHM — Le Duel du Samouraï
    // ══════════════════════════════════════════
    else if (g.type === 'rhythm') {
        arena.innerHTML = `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;">
                <div id="game-target" class="game-target-svg" style="transition:transform 0.15s,filter 0.15s;">${getRelicSVG(currentFound)}</div>
                <div id="hit-window" style="width:200px;height:12px;background:rgba(255,255,255,0.1);border-radius:6px;overflow:hidden;">
                    <div id="hit-bar" style="width:0%;height:100%;background:#ffd700;border-radius:6px;transition:width 0.08s;"></div>
                </div>
                <div id="stars-row" style="font-size:22px;letter-spacing:4px;min-height:28px;"></div>
            </div>`;
        const tg = document.getElementById('game-target');
        const hitBar = document.getElementById('hit-bar');
        const starsRow = document.getElementById('stars-row');
        makeCircleProgress('#ffd700');

        let inWindow = false; let stars = 0;
        let phase = 0; // 0→1 = montée, 1→0 = descente
        let phaseVal = 0;
        timer = setInterval(() => {
            phaseVal += 0.06;
            const p = (Math.sin(phaseVal) + 1) / 2; // 0→1
            hitBar.style.width = (p * 100) + '%';
            // Fenêtre de hit : vert si > 70%, orange si 40-70%, rouge sinon
            const col = p > 0.7 ? '#98e8d4' : p > 0.4 ? '#fde68a' : '#fca5a5';
            hitBar.style.background = col;
            inWindow = p > 0.6;
            tg.style.transform = `scale(${1 + p * 0.25})`;
            tg.style.filter = inWindow ? `drop-shadow(0 0 ${p*20}px #ffd700)` : '';
        }, 50);

        tg.onclick = () => {
            if (inWindow) {
                stars++;
                starsRow.textContent = '⭐'.repeat(stars);
                playGameSFX('sword');
                if (navigator.vibrate) navigator.vibrate([20, 20]);
                // Étincelles
                for (let i = 0; i < 5; i++) {
                    shockwave(arena.offsetWidth/2 + (Math.random()-0.5)*60,
                              arena.offsetHeight/2 + (Math.random()-0.5)*60, '#ffd700');
                }
                updateP(stars, 5);
            } else {
                playWrong();
                tg.style.filter = 'drop-shadow(0 0 10px #ff4444)';
                setTimeout(() => { tg.style.filter = ''; }, 200);
            }
        };
    }

    // ══════════════════════════════════════════
    // 🥷 CATCH — L'Ombre Insaisissable
    // ══════════════════════════════════════════
    else if (g.type === 'catch') {
        arena.innerHTML = `<div style="position:relative;width:280px;height:280px;">
            <div id="ghost-target" class="game-target-svg" style="position:absolute;opacity:0.25;filter:blur(4px);transition:all 0.3s;pointer-events:none;"></div>
            <div id="game-target" class="game-target-svg catch-target" style="position:absolute;transition:all 0.25s cubic-bezier(0.17,0.89,0.32,1.49);cursor:pointer;">${getRelicSVG(currentFound)}</div>
        </div>`;
        const tg = document.getElementById('game-target');
        const ghost = document.getElementById('ghost-target');
        makeCircleProgress('#c4b5fd');

        const move = () => {
            const tx = Math.random() * 200 - 60, ty = Math.random() * 200 - 60;
            // Fantôme reste à l'ancienne position
            ghost.innerHTML = tg.innerHTML;
            ghost.style.left = tg.style.left; ghost.style.top = tg.style.top;
            ghost.style.opacity = '0.3';
            setTimeout(() => { ghost.style.opacity = '0'; }, 500);
            tg.style.left = tx + 'px'; tg.style.top = ty + 'px';
            playGameSFX('woosh');
        };
        move();
        timer = setInterval(move, 1200);
        tg.onclick = () => {
            score++;
            clearInterval(timer);
            playCorrect();
            tg.style.filter = 'drop-shadow(0 0 20px #c4b5fd)';
            if (navigator.vibrate) navigator.vibrate(50);
            shockwave(parseInt(tg.style.left||0)+40, parseInt(tg.style.top||0)+40, '#c4b5fd');
            setTimeout(() => {
                tg.style.filter = '';
                if (isGameActive) { timer = setInterval(move, 1200); move(); }
            }, 300);
            updateP(score, 5);
        };
    }

    // ══════════════════════════════════════════
    // 💖 SWIPE — La Danse des Cœurs
    // ══════════════════════════════════════════
    else if (g.type === 'swipe') {
        const dirs = ['→', '←', '↑', '↓'];
        const dirMap = { '→': 1, '←': -1, '↑': 0, '↓': 0 };
        let currentDir = '→'; let startX = 0, startY = 0;

        const setDir = () => { currentDir = dirs[Math.floor(Math.random()*4)]; arrow.textContent = currentDir; };
        arena.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:20px;">
                <div id="arrow-hint" style="font-size:60px;filter:drop-shadow(0 0 15px #ff69b4);animation:pulse 0.8s infinite alternate;"></div>
                <div id="game-target" class="game-target-svg" style="transition:filter 0.2s;">${getRelicSVG(currentFound)}</div>
                <div id="trail-canvas" style="height:4px;width:200px;background:rgba(255,105,180,0.2);border-radius:2px;">
                    <div id="trail-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#ffb7c5,#ff1493);border-radius:2px;transition:width 0.3s;"></div>
                </div>
            </div>`;
        const tg = document.getElementById('game-target');
        const arrow = document.getElementById('arrow-hint');
        const trail = document.getElementById('trail-fill');
        makeCircleProgress('#ff69b4');
        setDir();

        const doSwipe = (dx, dy) => {
            const isCorrect =
                (currentDir === '→' && dx > 50) ||
                (currentDir === '←' && dx < -50) ||
                (currentDir === '↑' && dy < -50) ||
                (currentDir === '↓' && dy > 50);
            if (isCorrect) {
                score++;
                playMikoChime(score % 8);
                tg.style.filter = 'drop-shadow(0 0 20px #ff69b4)';
                trail.style.width = '100%';
                setTimeout(() => { tg.style.filter = ''; trail.style.width = '0%'; }, 300);
                if (navigator.vibrate) navigator.vibrate(30);
                setDir();
                updateP(score, 5);
            } else {
                playWrong();
                arrow.style.animation = 'none';
                setTimeout(() => { arrow.style.animation = 'pulse 0.8s infinite alternate'; }, 300);
            }
        };

        tg.ontouchstart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
        tg.ontouchend = (e) => { doSwipe(e.changedTouches[0].clientX - startX, e.changedTouches[0].clientY - startY); };
        tg.onmousedown = (e) => { startX = e.clientX; startY = e.clientY; };
        tg.onmouseup = (e) => { doSwipe(e.clientX - startX, e.clientY - startY); };
    }

    // ══════════════════════════════════════════
    // 🦊 SCRATCH — Le Masque du Renard
    // ══════════════════════════════════════════
    else if (g.type === 'scratch') {
        arena.innerHTML = '<div id="game-target" class="game-target-svg" style="width:220px;height:220px;position:relative;cursor:crosshair;"></div>';
        const target = document.getElementById('game-target');
        target.innerHTML = `
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:1;">${getRelicSVG(currentFound)}</div>
            <canvas id="scratch-canvas" style="position:absolute;inset:0;z-index:2;border-radius:50%;cursor:crosshair;" width="220" height="220"></canvas>
            <div id="scratch-glow" style="position:absolute;inset:-10px;border-radius:50%;pointer-events:none;opacity:0;transition:opacity 0.3s;background:radial-gradient(circle,rgba(139,92,246,0.4),transparent 70%);"></div>`;

        const scratchCvs = document.getElementById('scratch-canvas');
        const sCtx = scratchCvs.getContext('2d');
        const glowEl = document.getElementById('scratch-glow');

        // Fond avec runes violettes
        sCtx.fillStyle = '#0a0510'; sCtx.fillRect(0, 0, 220, 220);
        // Runes décoratives
        sCtx.fillStyle = 'rgba(139,92,246,0.4)'; sCtx.font = '20px serif';
        ['封','魂','霊','光','闇','祓','縛','印','呪'].forEach((r, i) => {
            const a = (i/9)*Math.PI*2, rx = 110 + Math.cos(a)*75, ry = 110 + Math.sin(a)*75;
            sCtx.fillText(r, rx-8, ry+8);
        });
        sCtx.fillStyle = 'rgba(255,215,0,0.25)'; sCtx.font = "14px 'Fredoka One'";
        sCtx.textAlign = 'center'; sCtx.fillText('Grattez !', 110, 115);

        sCtx.globalCompositeOperation = 'destination-out';
        let scratching = false, scratchFinished = false;

        makeCircleProgress('#8b5cf6');

        const scratchAt = (x, y) => {
            if (scratchFinished) return;
            // Reflet doré du curseur
            sCtx.globalCompositeOperation = 'destination-out';
            sCtx.beginPath(); sCtx.arc(x, y, 28, 0, Math.PI*2); sCtx.fill();

            const imgData = sCtx.getImageData(0, 0, 220, 220).data;
            let transparent = 0;
            for (let i = 3; i < imgData.length; i += 16) { if (imgData[i] < 10) transparent++; }
            score = Math.floor((transparent / (imgData.length/16)) * 100);

            // Les yeux apparaissent dès 40%
            if (score > 40) glowEl.style.opacity = String((score-40)/60);
            updateCircleProgress(score);
            // Ne PAS passer par updateP — évite double winGame
            progressBar.style.width = Math.min((score/70)*100, 99) + '%';

            if (score >= 70) {
                scratchFinished = true;
                scratchCvs.style.pointerEvents = 'none';
                scratchCvs.style.transition = 'opacity 0.5s'; scratchCvs.style.opacity = '0';
                glowEl.style.opacity = '1';
                if (navigator.vibrate) navigator.vibrate(30);
                playGameSFX('chime_portal');
                setTimeout(() => winGame(), 700);
            } else {
                playMikoChime(Math.floor(score/12));
                if (navigator.vibrate) navigator.vibrate(8);
            }
        };
        const getPos = (e) => {
            const rect = scratchCvs.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            return { x: (touch.clientX-rect.left)*(220/rect.width), y: (touch.clientY-rect.top)*(220/rect.height) };
        };
        scratchCvs.onmousedown = scratchCvs.ontouchstart = (e) => { e.preventDefault(); scratching=true; const p=getPos(e); scratchAt(p.x,p.y); };
        scratchCvs.onmousemove = scratchCvs.ontouchmove = (e) => { if(!scratching) return; e.preventDefault(); const p=getPos(e); scratchAt(p.x,p.y); };
        scratchCvs.onmouseup = scratchCvs.ontouchend = () => { scratching=false; };
    }

    // ══════════════════════════════════════════
    // 🍙 MASH — Le Choc des Titans
    // ══════════════════════════════════════════
    else if (g.type === 'mash') {
        arena.innerHTML = `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;">
                <div id="game-target" class="game-target-svg" style="cursor:pointer;transition:transform 0.05s;"></div>
                <div id="mash-count" style="font-size:48px;font-weight:bold;color:var(--gold);text-shadow:0 0 15px var(--gold);">0</div>
            </div>`;
        arena.querySelector('#game-target').innerHTML = getRelicSVG(currentFound);
        const tg2 = document.getElementById('game-target');
        const mashCount = document.getElementById('mash-count');
        makeCircleProgress('#fdba74');

        tg2.onclick = () => {
            score++;
            mashCount.textContent = score;
            // Scale rebond
            tg2.style.transform = 'scale(0.85)';
            setTimeout(() => { tg2.style.transform = `scale(${1 + score*0.008})`; }, 60);
            // Onde de choc
            shockwave(arena.offsetWidth/2, arena.offsetHeight/2 - 20,
                `hsl(${score*6},100%,65%)`);
            if (score % 10 === 0) { playGameSFX('sword'); } else { playGameSFX('thud'); }
            if (navigator.vibrate) navigator.vibrate(Math.min(score*2, 40));
            // Fond change de teinte à mesure
            if (score % 10 === 0) {
                arena.style.background = `radial-gradient(circle,hsl(${score*8},60%,15%) 0%,transparent 70%)`;
            }
            updateP(score, 30);
        };
    }

    // ══════════════════════════════════════════
    // 🧘 STATUE — La Flamme de l'Éveil
    // ══════════════════════════════════════════
    else if (g.type === 'statue') {
        arena.innerHTML = `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;">
                <div id="game-target" class="game-target-svg" style="transition:filter 0.5s,transform 0.5s;"></div>
                <div id="petal-zone" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;"></div>
                <div id="zen-msg" style="font-size:16px;color:rgba(255,255,255,0.6);font-style:italic;"></div>
            </div>`;
        arena.querySelector('#game-target').innerHTML = getRelicSVG(currentFound);
        const tg = document.getElementById('game-target');
        const petalZone = document.getElementById('petal-zone');
        const zenMsg = document.getElementById('zen-msg');

        let petalInterval = null;
        let stillTimer = null;
        let isStill = false;

        const startPetals = () => {
            if (petalInterval) return;
            petalInterval = setInterval(() => {
                const p = document.createElement('div');
                const px = Math.random() * 100;
                p.style.cssText = `position:absolute;left:${px}%;top:-10px;width:${6+Math.random()*8}px;
                    height:${4+Math.random()*6}px;background:rgba(255,183,197,0.7);border-radius:40% 60% 55% 45%;
                    animation:petalFall ${2+Math.random()*2}s linear forwards;pointer-events:none;`;
                petalZone.appendChild(p);
                setTimeout(() => p.remove(), 4000);
            }, 200);
        };
        const stopPetals = () => { clearInterval(petalInterval); petalInterval = null; };

        const goStill = () => {
            if (isStill) return;
            isStill = true;
            tg.style.filter = 'drop-shadow(0 0 30px rgba(165,180,252,0.9))';
            tg.style.transform = 'scale(1.1)';
            zenMsg.textContent = '✨ Immobilité parfaite...';
            startPetals();
            playGameSFX('zen');
            stillTimer = setTimeout(() => {
                if (isGameActive) {
                    try {
                        if (audioCtx) {
                            const bowl = audioCtx.createOscillator(), bowlG = audioCtx.createGain();
                            bowl.type = 'sine'; bowl.frequency.value = 432;
                            bowlG.gain.setValueAtTime(0.3, audioCtx.currentTime);
                            bowlG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);
                            bowl.connect(bowlG); bowlG.connect(masterGain || audioCtx.destination);
                            bowl.start(); bowl.stop(audioCtx.currentTime + 3);
                        }
                    } catch(e2) {}
                    isGameActive = false; winGame();
                }
            }, 4000);
        };
        const breakStill = () => {
            if (!isStill) return;
            isStill = false;
            clearTimeout(stillTimer);
            stopPetals();
            tg.style.filter = 'drop-shadow(0 0 5px rgba(255,100,100,0.5))';
            tg.style.transform = 'scale(1) rotate(-3deg)';
            zenMsg.textContent = '💨 L\'esprit s\'est brisé...';
            document.body.classList.add('shake-screen');
            setTimeout(() => {
                document.body.classList.remove('shake-screen');
                tg.style.transform = 'scale(1)';
                tg.style.filter = '';
                zenMsg.textContent = 'Restez immobile...';
            }, 400);
            playWrong();
        };

        zenMsg.textContent = 'Posez votre doigt et ne bougez plus...';

        document.body.ontouchstart = (e) => { if (e.target.closest('#game-arena')) goStill(); };
        document.body.ontouchend = () => { breakStill(); };
        document.body.ontouchmove = () => { breakStill(); };
        tg.onmousedown = goStill;
        document.body.onmouseup = breakStill;
    }

    // ══════════════════════════════════════════
    // 🥁 DRUM — La Tempête du Tambour
    // ══════════════════════════════════════════
    else if (g.type === 'drum') {
        arena.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:20px;">
                <div id="collision-flash" style="width:60px;height:60px;border-radius:50%;background:transparent;transition:all 0.1s;margin:0 auto;"></div>
                <div style="display:flex;gap:30px;">
                    <div class="drum-btn" id="btn-G" style="background:radial-gradient(circle at 35% 35%,#ffb7c5,#ff1493);box-shadow:0 0 20px #ff1493;">G</div>
                    <div class="drum-btn" id="btn-D" style="background:radial-gradient(circle at 35% 35%,#98e8d4,#00b386);box-shadow:0 0 20px #00b386;">D</div>
                </div>
                <div id="drum-alt" style="font-size:13px;color:rgba(255,255,255,0.5);">Alternez G et D</div>
            </div>`;
        makeCircleProgress('#ffd700');

        let last = ''; let collisionCount = 0;
        const flash = document.getElementById('collision-flash');

        const hitDrum = (side) => {
            if (last !== side) {
                score++;
                last = side;
                collisionCount++;
                playGameSFX(side === 'G' ? 'drum_g' : 'drum_d');
                if (navigator.vibrate) navigator.vibrate(40);
                // Collision au centre
                const col = side === 'G' ? '#ffb7c5' : '#98e8d4';
                flash.style.background = `radial-gradient(circle,${col},transparent)`;
                flash.style.boxShadow = `0 0 30px ${col}`;
                flash.style.transform = 'scale(1.5)';
                setTimeout(() => { flash.style.transform = 'scale(1)'; flash.style.background = 'transparent'; flash.style.boxShadow = ''; }, 150);
                // Onde
                shockwave(arena.offsetWidth/2, 40, col);
                updateP(score, 10);
            }
        };

        document.getElementById('btn-G').onclick = () => hitDrum('G');
        document.getElementById('btn-D').onclick = () => hitDrum('D');
    }

    // ══════════════════════════════════════════
    // 🏯 MEMORY — Les Sceaux du Destin (8 reliques)
    // ══════════════════════════════════════════
    else if (g.type === 'memory') {
        // 8 reliques dans l'ordre — chaque enfant mémorise la sienne
        const seqIdx = [0, 1, 2, 3, 4, 5, 6, 7];
        // Notes fixes et mémorisables par relique
        const relicNotes = [523, 587, 659, 698, 784, 880, 988, 1047];
        let userSeq = [];
        let seqShown = false;
        makeCircleProgress('#c4b5fd');

        const playRelicNote = (relicIdx) => {
            try {
                if (audioCtx && audioCtx.state !== 'suspended') {
                    const o = audioCtx.createOscillator(), gn = audioCtx.createGain();
                    o.type = 'sine'; o.frequency.value = relicNotes[relicIdx];
                    gn.gain.setValueAtTime(0.18, audioCtx.currentTime);
                    gn.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
                    o.connect(gn); gn.connect(masterGain || audioCtx.destination);
                    o.start(); o.stop(audioCtx.currentTime + 0.7);
                }
            } catch(e2) {}
        };

        const showButtons = () => {
            userSeq = [];
            arena.innerHTML = `
                <div style="font-size:14px;color:var(--sakura);margin-bottom:10px;font-style:italic;text-align:center;">
                    Invoquez les Gardiens dans l'ordre révélé...
                </div>
                <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:320px;margin:0 auto;">
                    ${seqIdx.map(i => `<div class="mem-btn mem-btn-svg" data-relic="${i}" style="transition:transform 0.15s,filter 0.15s;">${getRelicSVG(i)}</div>`).join('')}
                </div>
                <div id="mem-feedback" style="font-size:20px;margin-top:10px;min-height:28px;text-align:center;"></div>
                <div id="mem-progress" style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;text-align:center;">0 / 8</div>
                <div style="margin-top:14px;display:flex;gap:12px;justify-content:center;">
                    <div id="btn-revoir" style="font-size:13px;color:#c4b5fd;cursor:pointer;padding:8px 14px;border:1px solid rgba(196,181,253,0.3);border-radius:20px;text-align:center;">
                        ✨ Les esprits murmurent à nouveau...
                    </div>
                </div>`;

            document.querySelectorAll('.mem-btn').forEach(btn => {
                btn.onclick = () => {
                    const relicIdx = parseInt(btn.dataset.relic);
                    const step = userSeq.length;
                    userSeq.push(relicIdx);

                    btn.style.transform = 'scale(1.3)';
                    btn.style.filter = 'drop-shadow(0 0 18px #ffd700)';
                    setTimeout(() => { btn.style.transform = ''; btn.style.filter = ''; }, 220);

                    playRelicNote(relicIdx);

                    if (userSeq[step] !== seqIdx[step]) {
                        playWrong();
                        crackScreen();
                        document.getElementById('mem-feedback').textContent = '💔 Le sceau s\'est brisé...';
                        document.body.classList.add('shake-screen');
                        setTimeout(() => {
                            document.body.classList.remove('shake-screen');
                            // Option rejouer
                            document.getElementById('mem-feedback').textContent = '';
                            const rejouer = document.createElement('div');
                            rejouer.style.cssText = 'font-size:13px;color:#fdba74;cursor:pointer;padding:8px 14px;border:1px solid rgba(253,186,116,0.3);border-radius:20px;text-align:center;margin-top:8px;';
                            rejouer.textContent = '🦊 Les Gardiens accordent une seconde chance...';
                            rejouer.onclick = () => showSeq();
                            document.getElementById('mem-feedback').after(rejouer);
                        }, 800);
                    } else {
                        playCorrect();
                        score++;
                        document.getElementById('mem-progress').textContent = `${userSeq.length} / 8`;
                        document.getElementById('mem-feedback').textContent = '✨'.repeat(userSeq.length);
                        updateP(score, 7);
                        if (userSeq.length >= seqIdx.length) {
                            isGameActive = false;
                            setTimeout(winGame, 600);
                        }
                    }
                };
            });

            document.getElementById('btn-revoir').onclick = () => showSeq();
        };

        const showSeq = () => {
            seqShown = true;
            arena.innerHTML = `<div style="text-align:center;">
                <div id="mem-relic-display" style="min-height:80px;display:flex;align-items:center;justify-content:center;"></div>
                <div id="mem-seq-label" style="font-size:15px;color:var(--sakura);font-style:italic;margin-top:8px;">
                    Les 8 Gardiens révèlent leur ordre sacré...
                </div>
                <div id="mem-seq-dots" style="font-size:20px;letter-spacing:4px;margin-top:6px;min-height:28px;"></div>
            </div>`;

            const display = document.getElementById('mem-relic-display');
            const dots = document.getElementById('mem-seq-dots');

            seqIdx.forEach((relicIdx, step) => {
                setTimeout(() => {
                    display.innerHTML = `<div style="transform:scale(1.35) translateY(-10px);filter:drop-shadow(0 0 28px #ffd700);transition:all 0.25s;">${getRelicSVG(relicIdx)}</div>`;
                    dots.textContent = '◆'.repeat(step + 1) + '◇'.repeat(7 - step);
                    playRelicNote(relicIdx);
                    setTimeout(() => {
                        display.innerHTML = `<div style="opacity:0.5;transition:opacity 0.3s;">${getRelicSVG(relicIdx)}</div>`;
                    }, 500);
                }, step * 900);
            });

            setTimeout(showButtons, seqIdx.length * 900 + 600);
        };

        showSeq();
    }

    // ══════════════════════════════════════════
    // 🎤 MIC
    // ══════════════════════════════════════════
    else if (g.type === 'mic') {
        arena.innerHTML = `<div id="game-target" class="game-target-svg">${getRelicSVG(currentFound)}</div>`;
        const target = document.getElementById('game-target');
        document.getElementById('mic-gauge').style.display = 'block';
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            micStream = stream; micContext = new (window.AudioContext || window.webkitAudioContext)();
            micAnalyser = micContext.createAnalyser(); micAnalyser.fftSize = 256;
            const source = micContext.createMediaStreamSource(stream); source.connect(micAnalyser);
            const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
            function checkAudio() {
                if (!isGameActive) return;
                micAnalyser.getByteFrequencyData(dataArray);
                let sum = 0; for (let i=0; i<dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                document.getElementById('mic-level').style.height = Math.min(avg, 100) + '%';
                if (avg > 50) { score++; updateP(score, 50); if (navigator.vibrate) navigator.vibrate(10); }
                micLoop = requestAnimationFrame(checkAudio);
            } checkAudio();
        }).catch(() => {
            document.getElementById('mic-gauge').style.display = 'none';
            document.getElementById('game-instr').innerText = 'Micro refusé ! Glissez le doigt à la place !';
            let startX = 0;
            target.ontouchstart = (e) => startX = e.touches[0].clientX;
            target.ontouchend = (e) => { if (Math.abs(e.changedTouches[0].clientX - startX) > 50) { score++; playGameSFX('woosh'); updateP(score, 5); } };
            target.onclick = () => { score++; playGameSFX('woosh'); updateP(score, 5); };
        });
    }
}

/* --- ÉCRAN DE DÉCOUVERTE --- */
function showDiscoveryScreen(idx) {
    const g = guardianData[idx];
    const color = g.color || '#ffb7c5';
    const dark = g.dark || '#ff1493';
    const kanji = g.kanji || '';
    const discoveryText = g.discovery || `L'âme de ${g.n} est libérée...`;

    // Overlay plein écran
    const overlay = document.createElement('div');
    overlay.id = 'discovery-overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0010;opacity:0;transition:opacity 0.4s ease;`;
    document.body.appendChild(overlay);

    // Temps 1 — flash radial couleur
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,${color} 0%,transparent 70%);opacity:0;pointer-events:none;transition:opacity 0.3s ease;`;
    overlay.appendChild(flash);

    // Kanji géant en filigrane
    const kanjiEl = document.createElement('div');
    kanjiEl.textContent = kanji;
    kanjiEl.style.cssText = `position:absolute;font-family:'Ma Shan Zheng',cursive;font-size:min(55vw,340px);color:${color};opacity:0.07;pointer-events:none;user-select:none;line-height:1;`;
    overlay.appendChild(kanjiEl);

    // Halo derrière relique
    const halo = document.createElement('div');
    halo.style.cssText = `position:relative;width:220px;height:220px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;`;
    const haloRing = document.createElement('div');
    haloRing.style.cssText = `position:absolute;inset:-20px;border-radius:50%;background:conic-gradient(${color},${dark},#fff,${color});opacity:0;animation:discoveryHaloSpin 3s linear infinite;filter:blur(8px);transition:opacity 0.8s ease;`;
    halo.appendChild(haloRing);

    // SVG relique
    const relicWrap = document.createElement('div');
    relicWrap.style.cssText = `position:relative;z-index:2;width:180px;height:180px;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform 0.6s cubic-bezier(0.17,0.89,0.32,1.49);filter:drop-shadow(0 0 30px ${color});`;
    relicWrap.innerHTML = getRelicSVG(idx);
    const svg = relicWrap.querySelector('svg');
    if (svg) { svg.style.width = '180px'; svg.style.height = '180px'; }
    halo.appendChild(relicWrap);
    overlay.appendChild(halo);

    // Nom du gardien
    const nameEl = document.createElement('div');
    nameEl.textContent = g.n;
    nameEl.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:54px;color:${color};text-shadow:0 0 30px ${color},0 0 60px ${dark};opacity:0;transform:translateY(20px);transition:opacity 0.6s ease,transform 0.6s ease;margin-bottom:8px;text-align:center;`;
    overlay.appendChild(nameEl);

    // Kanji sous le nom
    const kanjiSmall = document.createElement('div');
    kanjiSmall.textContent = kanji;
    kanjiSmall.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:24px;color:${dark};opacity:0;transition:opacity 0.6s ease 0.2s;margin-bottom:20px;`;
    overlay.appendChild(kanjiSmall);

    // Texte poétique
    const textEl = document.createElement('div');
    textEl.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:18px;color:rgba(255,255,255,0.85);text-align:center;max-width:320px;line-height:1.7;opacity:0;transition:opacity 0.6s ease 0.4s;margin-bottom:32px;padding:0 20px;`;
    overlay.appendChild(textEl);

    // Bouton
    const btn = document.createElement('button');
    btn.textContent = '✨ Que l\'épreuve commence...';
    btn.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:20px;color:#fff;background:linear-gradient(135deg,${dark},${color});border:none;border-radius:50px;padding:14px 32px;cursor:pointer;opacity:0;transform:scale(0.8);transition:opacity 0.5s ease 0.6s,transform 0.5s ease 0.6s;box-shadow:0 4px 20px ${dark}88;`;
    overlay.appendChild(btn);

    // Séquence d'animation
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    // T1 — flash
    setTimeout(() => { flash.style.opacity = '0.6'; }, 100);
    setTimeout(() => { flash.style.opacity = '0'; }, 500);

    // T2 — relique + halo
    setTimeout(() => {
        haloRing.style.opacity = '0.8';
        relicWrap.style.transform = 'scale(1)';
        try { playGameSFX('chime_portal'); } catch(e) {}
        // Particules
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            const a = (i/12)*Math.PI*2, d = 80+Math.random()*120;
            p.style.cssText = `position:absolute;left:50%;top:50%;width:${4+Math.random()*6}px;height:${4+Math.random()*6}px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};transform:translate(-50%,-50%);animation:discoveryParticle 1s ease-out forwards;--tx:${Math.cos(a)*d}px;--ty:${Math.sin(a)*d}px;animation-delay:${Math.random()*0.3}s;pointer-events:none;`;
            overlay.appendChild(p);
            setTimeout(() => p.remove(), 1400);
        }
    }, 600);

    // T3 — nom + texte poétique typewriter
    setTimeout(() => {
        nameEl.style.opacity = '1'; nameEl.style.transform = 'translateY(0)';
        kanjiSmall.style.opacity = '1';
    }, 1200);

    setTimeout(() => {
        textEl.style.opacity = '1';
        // Typewriter
        let i = 0;
        const chars = discoveryText.split('');
        const tw = setInterval(() => {
            textEl.textContent += chars[i];
            i++;
            if (i >= chars.length) clearInterval(tw);
        }, 40);
    }, 1600);

    setTimeout(() => {
        btn.style.opacity = '1'; btn.style.transform = 'scale(1)';
    }, 2400);

    // Clic bouton → fermer + lancer quiz
    btn.onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            stopScan();
            clearInterval(heartInterval);
            setupQuiz();
        }, 400);
    };
}


/* --- WIN / SOUL ANIMATION --- */
function winGame() {
    const wonIndex = currentFound; foundGuardians.add(wonIndex); // currentFound reste inchangé jusqu'au prochain scan
    window.ondevicemotion = null; document.body.ontouchstart = null; document.body.onmouseup = null;
    window._memTap = null; window.mem = null;
    cancelVoice();
    
    if(micStream) { micStream.getTracks().forEach(t => t.stop()); cancelAnimationFrame(micLoop); document.getElementById('mic-gauge').style.display = 'none'; }
    
    const arena = document.getElementById('game-arena');
    arena.innerHTML = `<div class="win-relic-icon">${getRelicSVG(wonIndex)}</div>`; document.getElementById('game-instr').innerText = "RÉUSSI !";
    setTimeout(() => { if(foundGuardians.size >= 9) launchFinalCinematic(); else animateSoulToHub(wonIndex); }, 1500);
}

function animateSoulToHub(idx) {
    transitionScreen('screen-hub');
    document.getElementById('miko-belt').classList.add('visible');
    setTimeout(() => {
        const grid = document.getElementById('grid-nekos'); grid.innerHTML = "";
        guardianData.forEach((g, i) => { 
            let isUnlocked = foundGuardians.has(i) && i !== idx;
            const svgIcon = getRelicSVG(i); 
            grid.innerHTML += `<div id="slot-${i}" class="slot ${isUnlocked ? 'unlocked' : 'locked'}" onclick="handleSlotClick(${i})">${svgIcon}</div>`; 
        });

        let flyingSoul = document.createElement('div'); flyingSoul.className = 'captured-soul'; flyingSoul.innerHTML = getRelicSVG(idx); flyingSoul.style.color = 'var(--gold)'; document.body.appendChild(flyingSoul);
        setTimeout(() => {
            const targetSlot = document.getElementById(`slot-${idx}`); const rect = targetSlot.getBoundingClientRect();
            const x = rect.left + rect.width/2 - window.innerWidth/2; const y = rect.top + rect.height/2 - window.innerHeight*0.4;
            flyingSoul.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.5)`;
            
            setTimeout(() => {
                flyingSoul.remove(); targetSlot.classList.add('unlocked', 'just-unlocked'); targetSlot.innerHTML = getRelicSVG(idx);
                confetti({ particleCount: 80, colors: ['#ffd700', '#ffb7c5', '#ffffff'], origin: { x: rect.left/window.innerWidth, y: rect.top/window.innerHeight } }); playCorrect();
                document.getElementById('found-count').innerText = foundGuardians.size; document.getElementById('hub-progress-bar').style.width = (foundGuardians.size / 9 * 100) + "%";
                document.documentElement.style.setProperty('--bg-lightness', (10 + (foundGuardians.size * 8)) + '%'); updateDynamicMusic();
                hubTimer = 0; document.documentElement.style.setProperty('--darkness', 0);
                if(heartInterval) clearInterval(heartInterval); heartInterval = setInterval(updateHeartBeat, 1000);
                updateMikoBelt();
                setTimeout(() => targetSlot.classList.remove('just-unlocked'), 700);
            }, 1000);
        }, 100);
    }, 600);
}

function setOutroMood(mood) {
    if (window.setSakuraMood) window.setSakuraMood(mood);
}

/* --- CINÉMATIQUE FINALE — TEXTE + WEBGL + VOIX JP --- */
async function launchFinalCinematic() {
    transitionScreen('screen-final', "✨");

    // Init audio — résoudre le contexte suspendu (politique navigateur anti-autoplay)
    if (!audioCtx) { try { initSfx(); } catch(e) {} }
    if (audioCtx && audioCtx.state === 'suspended') { try { await audioCtx.resume(); } catch(e) {} }

    if (typeof loadTexts === 'function' && (typeof T === 'undefined' || !T)) {
        try { await loadTexts(); } catch(e) {}
    }

    const finale = (typeof T !== 'undefined' && T && T.finale) ? T.finale : {};
    const exorcism = Array.isArray(finale.exorcism) ? finale.exorcism : [
        { fr: 'Les 9 Gardiens sont réunis.', jp: '九つの守護者が、　揃いた。' },
        { fr: "L'Ombre se dresse une dernière fois.", jp: '影が…　最後に立つ。' },
        { fr: 'Mais la magie des 8 Mikos est plus forte !', jp: '八人の巫女の力が、勝る！' }
    ];
    const victory = Array.isArray(finale.victory) ? finale.victory : [
        { fr: 'La lumière brille à nouveau sur Neko-Jinja.', jp: '光が、　再び照らす。' },
        { fr: "Votre amitié a purifié l'Ombre.", jp: '友情が…影を清めた。' },
        { fr: 'Les Gardiens vous remercient pour votre courage.', jp: '守護者たちが、感謝する。' },
        { fr: 'Le parchemin a scellé votre victoire.', jp: '勝利は、封印された。' }
    ];
    const sealPrompt = finale.sealPrompt || { fr: 'Scellez cette légende dans le Miroir.', jp: '伝説を…　鏡に封印せよ。' };

    const stage = document.getElementById('final-circ-nekos');
    const sf = document.getElementById('final-story-box');
    const finalTitle = document.getElementById('final-title');
    const cert = document.getElementById('victory-cert');
    const btnMirror = document.getElementById('btn-download');
    const overlay = document.getElementById('mirror-overlay');
    const nekoHero = document.getElementById('final-neko-hero');
    const daruma = document.getElementById('final-daruma');
    const boatScene = document.getElementById('scene-boat-final');
    const mirrorCam = document.getElementById('mirror-cam');
    const selfieWrap = document.getElementById('selfie-container');
    const selfieCam = document.getElementById('selfie-cam');

    const stopMirrorStreams = () => {
        [mirrorCam, selfieCam].forEach(video => {
            if (video && video.srcObject) {
                try { video.srcObject.getTracks().forEach(track => track.stop()); } catch(e) {}
                video.srcObject = null;
            }
        });
        if (selfieWrap) selfieWrap.style.display = 'none';
    };

    stopMirrorStreams();
    if (overlay) overlay.classList.remove('active');
    // Sauver le daruma avant de vider le stage
    const screenFinalEl = document.getElementById('screen-final');
    if (daruma && daruma.parentNode === stage) {
        screenFinalEl && screenFinalEl.appendChild(daruma);
    }
    if (stage) {
        stage.innerHTML = '';
        stage.style.opacity = '0'; stage.style.visibility = 'hidden';
        
    }
    if (nekoHero) { nekoHero.style.display = 'none'; nekoHero.style.opacity = '0'; }
    if (daruma) { daruma.style.display = 'none'; daruma.style.opacity = '0'; }
    if (boatScene) { boatScene.style.display = 'none'; boatScene.style.opacity = '0'; }
    if (finalTitle) {
        finalTitle.textContent = '';
        finalTitle.style.display = 'none';
        finalTitle.style.opacity = '0';
    }
    if (cert) {
        cert.style.display = 'none';
        cert.style.opacity = '0';
        cert.style.transform = 'scale(0.96)';
    }
    if (btnMirror) {
        btnMirror.style.display = 'none';
        btnMirror.style.transform = 'scale(0)';
    }
    if (sf) {
        sf.innerHTML = '';
        sf.style.opacity = '1';
        sf.style.transform = "translateY(0)";
    }

    if (audioCtx && audioCtx.state === 'suspended') {
        try { await audioCtx.resume(); } catch(e) {}
    }

    currentMusicMood = null;
    try { setMusicMood('VICTOIRE'); } catch(e) {}

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    // setOutroMood défini globalement

    const typewriterText = async (el, htmlStr) => {
        if (!el) return;
        const tokens = [];
        let inTag = false, currentTag = '';
        for (let i = 0; i < htmlStr.length; i++) {
            const ch = htmlStr[i];
            if (ch === '<') { inTag = true; currentTag = '<'; }
            else if (ch === '>' && inTag) { currentTag += '>'; tokens.push(currentTag); inTag = false; currentTag = ''; }
            else if (inTag) { currentTag += ch; }
            else { tokens.push(ch); }
        }
        const charCount = tokens.filter(t => !t.startsWith('<')).length;
        const speed = Math.max(30, Math.min(80, 3000 / charCount));
        el.innerHTML = '<span class="tw-content"></span><span class="typewriter-cursor"></span>';
        const twContent = el.querySelector('.tw-content');
        const cursor = el.querySelector('.typewriter-cursor');
        await new Promise(resolve => {
            let i = 0;
            function typeNext() {
                if (i >= tokens.length) { if (cursor) cursor.remove(); twContent.innerHTML = htmlStr; resolve(); return; }
                const token = tokens[i];
                if (token.startsWith('<')) { twContent.innerHTML += token; i++; typeNext(); }
                else { twContent.innerHTML += token; i++; setTimeout(typeNext, speed); }
            }
            typeNext();
        });
    };

    const showFinalText = async (entry, pause = 1200) => {
        if (!sf || !entry) return;
        if (sf.innerHTML !== '') {
            sf.classList.add('text-fade-out');
            await sleep(400);
        }
        sf.classList.remove('text-fade-out');
        sf.style.opacity = '1';
        sf.style.transform = 'translateY(0)';
        await typewriterText(sf, entry.fr || '');
        if (entry.jp) {
            try { speakDucked(entry.jp, { rate: 0.80 }); } catch(e) {}
        }
        await sleep(pause);
    };

    const nekoCrystalMarkup = `
        <div class="neko-stage mystic-pop-neko pearl-neko happy">
            <div class="pearl-sparkles">
                <div class="pearl-spark ps-1"></div>
                <div class="pearl-spark ps-2"></div>
                <div class="pearl-spark ps-3"></div>
                <div class="pearl-spark ps-4"></div>
                <div class="pearl-spark ps-5"></div>
                <div class="pearl-spark ps-6"></div>
                <div class="pearl-halo"></div>
            </div>
            <div class="neko-scale-wrapper obsidian-mode pearl-mode">
                <div class="neko-art-container">
                    <div class="ears"><div class="ear-left-out"></div><div class="ear-right-out"></div></div>
                    <div class="head"><div class="eyes"><div class="eye-left"></div><div class="eye-right"></div></div><div class="face-center"><div class="mustache-left"></div><div class="mustache-left-bottom"></div><div class="mustache-right"></div><div class="mustache-right-bottom"></div><div class="nose"></div><div class="mouth"></div><div class="mouth-right"></div></div></div>
                    <div class="arm-top-left-wrapper"><div class="arm-top-left"></div><div class="arm-top-left-tip"></div><div class="gold"><span class="carving">幸<br>福</span></div></div>
                    <div class="arm-top-right"></div><div class="arm-top-right-tip"></div>
                    <div class="back-legs"><div class="back-leg-left"></div><div class="back-leg-right"></div></div>
                    <div class="paws"><div class="paw-left"></div><div class="paw-right"></div></div>
                </div>
            </div>
            <div class="mystic-pop-neko-core pearl-core"></div>
        </div>`;

    const spawnMysticPopMandala = async () => {
        if (!stage) return;
        stage.innerHTML = '';
        stage.style.opacity = '1'; stage.style.visibility = 'visible';
        stage.style.opacity = '1';
        const screenFinal = document.getElementById('screen-final');
        if (screenFinal) screenFinal.classList.add('mystic-pop-scene1');

        // Attendre un frame pour que le layout soit calculé avant de lire clientWidth/Height
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const scene = document.createElement('div');
        scene.className = 'mystic-pop-scene';
        scene.innerHTML = '<div class="mystic-pop-ring"></div><div class="mystic-pop-ripple-layer"></div><div class="mystic-pop-neko-layer"></div>';
        stage.appendChild(scene);

        const ring = scene.querySelector('.mystic-pop-ring');
        const rippleLayer = scene.querySelector('.mystic-pop-ripple-layer');
        const nekoLayer = scene.querySelector('.mystic-pop-neko-layer');

        const relicIndices = [0,1,2,3,4,5,6,7];
        const stageW = stage.clientWidth  || stage.offsetWidth  || Math.min(window.innerWidth  * 0.92, 560);
        const stageH = stage.clientHeight || stage.offsetHeight || Math.min(window.innerHeight * 0.64, 520);
        const radius = Math.min(stageW, stageH) * (window.isMobileDevice ? 0.36 : 0.44);
        console.log('[Mandala] stage:', stageW, stageH, '→ radius:', radius);

        const spawnRipple = (x, y) => {
            const ripple = document.createElement('div');
            ripple.className = 'mystic-pop-ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            rippleLayer.appendChild(ripple);
            setTimeout(() => ripple.remove(), 900);
        };

        relicIndices.forEach((idx, i) => {
            const angle = (-Math.PI / 2) + i * ((Math.PI * 2) / relicIndices.length);
            const slot = document.createElement('div');
            slot.className = 'mystic-pop-relic';
            slot.style.setProperty('--mx', `${Math.cos(angle) * radius}px`);
            slot.style.setProperty('--my', `${Math.sin(angle) * radius}px`);
            slot.style.setProperty('--ma', `${angle}rad`);
            const svgContent = getRelicSVG(idx);
            console.log(`[Mandala] relic ${idx}:`, svgContent ? 'OK' : 'EMPTY');
            slot.innerHTML = `<div class="mystic-pop-relic-art">${svgContent}</div>`;
            ring.appendChild(slot);
            setTimeout(() => {
                spawnRipple(stage.clientWidth/2 + Math.cos(angle) * radius, stage.clientHeight/2 + Math.sin(angle) * radius);
                slot.classList.add('is-visible');
                try { 
                    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                    playMikoChime(i);
                } catch(e) {}
            }, i * 350);
        });

        await sleep(relicIndices.length * 350 + 350);
        ring.classList.add('is-orbiting');
        try { playGameSFX('chime_portal'); } catch(e) {}

        const nekoWrap = document.createElement('div');
        nekoWrap.className = 'mystic-pop-neko-wrap';
        nekoWrap.innerHTML = nekoCrystalMarkup;
        nekoLayer.appendChild(nekoWrap);
        requestAnimationFrame(() => nekoWrap.classList.add('is-visible'));

        // Afficher le texte pendant que neko + SVG tournent
        await sleep(400);
        if (sf) {
            sf.style.opacity = '0';
            await sleep(200);
            const e0 = exorcism[0] || { fr: 'Les 9 Gardiens sont réunis.', jp: '九つの守護者が、　揃いた。' };
            sf.textContent = e0.fr;
            sf.style.opacity = '1';
            if (e0.jp) { try { await speakDucked('九つの守護者が、　揃いた。', { rate: 0.80 }); } catch(e) {} }
        }

        await sleep(4600);
        scene.classList.add('is-fading');
        await sleep(650);
        stage.innerHTML = '';
        stage.style.opacity = '0'; stage.style.visibility = 'hidden';
        
        if (screenFinal) screenFinal.classList.remove('mystic-pop-scene1');
    };

    setOutroMood('FINAL');
    await sleep(500);
    await spawnMysticPopMandala();

    // ═══════════════════════════════════════════
    // SÉQUENCE OMBRE — Agonie & Explosion
    // ═══════════════════════════════════════════
    setOutroMood('DARUMA');

    // Construire l'ombre dans final-daruma
    if (daruma) {
        daruma.innerHTML = `
            <div class="crimson-aura"></div>
            <div class="shadow-smoke">
                <div class="smoke-particle sp-bg"></div>
                <div class="smoke-particle sp-head-1"></div>
                <div class="smoke-particle sp-head-2"></div>
                <div class="smoke-particle sp-head-3"></div>
                <div class="smoke-particle sp-shoulder-l"></div>
                <div class="smoke-particle sp-shoulder-r"></div>
                <div class="smoke-particle sp-body-1"></div>
                <div class="smoke-particle sp-body-2"></div>
                <div class="smoke-particle sp-fade-1"></div>
                <div class="smoke-particle sp-fade-2"></div>
                <div class="smoke-particle sp-fade-3"></div>
            </div>
            <div class="eclipse-core">
                <div class="eclipse-ring"></div>
                <div class="eclipse-void"></div>
                <div class="eclipse-pulse"></div>
                <div class="eclipse-pulse-deep"></div>
                <div class="eclipse-kanji dying-kanji">封</div>
                <div class="ember em-1"></div>
                <div class="ember em-2"></div>
                <div class="ember em-3"></div>
                <div class="ember em-4"></div>
            </div>`;
        daruma.style.cssText = 'display:block;opacity:0;transform:translate(-50%,-50%) scale(0.2);transition:none;position:fixed;left:50%;top:45%;';
        daruma.classList.add('awake');
        // Forcer un reflow avant d'ajouter la transition
        void daruma.offsetHeight;
        daruma.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.17,0.89,0.32,1.3)';
    }

    // Faire gronder l'audio
    try {
        if (audioCtx) {
            const grnd = audioCtx.createOscillator();
            const grndG = audioCtx.createGain();
            grnd.type = 'sawtooth';
            grnd.frequency.setValueAtTime(40, audioCtx.currentTime);
            grnd.frequency.linearRampToValueAtTime(25, audioCtx.currentTime + 3);
            grndG.gain.setValueAtTime(0, audioCtx.currentTime);
            grndG.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.5);
            grndG.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 2.5);
            grndG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.5);
            grnd.connect(grndG); grndG.connect(audioCtx.destination);
            grnd.start(); grnd.stop(audioCtx.currentTime + 3.5);
        }
    } catch(e) {}

    await showFinalText(exorcism[1], 0);

    // Apparition de l'ombre
    await sleep(100);
    if (daruma) {
        daruma.style.opacity = '1';
        daruma.style.transform = "translate(-50%, -50%) scale(0.55)";
    }
    await sleep(1200);

    // Phase agonie — tremblement + fissures cyan
    if (daruma) daruma.classList.add('ombre-agonie');

    // Craquements audio
    try {
        if (audioCtx) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const crack = audioCtx.createOscillator();
                    const crackG = audioCtx.createGain();
                    crack.type = 'square';
                    crack.frequency.setValueAtTime(80 + Math.random() * 200, audioCtx.currentTime);
                    crack.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.15);
                    crackG.gain.setValueAtTime(0.4, audioCtx.currentTime);
                    crackG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                    crack.connect(crackG); crackG.connect(audioCtx.destination);
                    crack.start(); crack.stop(audioCtx.currentTime + 0.15);
                }, i * 220 + Math.random() * 80);
            }
        }
    } catch(e) {}

    await sleep(1400);

    // EXPLOSION — flash blanc + fragments d'encre
    const flashEl = document.createElement('div');
    flashEl.style.cssText = 'position:fixed;inset:0;background:#ffffff;z-index:9999;opacity:0;pointer-events:none;transition:opacity 0.08s ease;';
    document.body.appendChild(flashEl);
    requestAnimationFrame(() => { flashEl.style.opacity = '1'; });

    // Son explosion
    try {
        if (audioCtx) {
            const bang = audioCtx.createOscillator();
            const bangG = audioCtx.createGain();
            bang.type = 'sawtooth';
            bang.frequency.setValueAtTime(120, audioCtx.currentTime);
            bang.frequency.exponentialRampToValueAtTime(15, audioCtx.currentTime + 0.6);
            bangG.gain.setValueAtTime(0.9, audioCtx.currentTime);
            bangG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
            bang.connect(bangG); bangG.connect(audioCtx.destination);
            bang.start(); bang.stop(audioCtx.currentTime + 0.6);
            // Haute fréquence cristalline
            const crystal = audioCtx.createOscillator();
            const crystalG = audioCtx.createGain();
            crystal.type = 'sine';
            crystal.frequency.setValueAtTime(1800, audioCtx.currentTime);
            crystal.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 1.2);
            crystalG.gain.setValueAtTime(0.4, audioCtx.currentTime);
            crystalG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
            crystal.connect(crystalG); crystalG.connect(audioCtx.destination);
            crystal.start(); crystal.stop(audioCtx.currentTime + 1.2);
        }
    } catch(e) {}

    await sleep(80);
    // Disparition de l'ombre pendant le flash
    if (daruma) {
        daruma.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        daruma.style.opacity = '0';
        daruma.style.transform = 'translate(-50%, -50%) scale(2.5)';
    }

    // Fragments d'encre qui explosent
    const fragmentCount = 22;
    for (let i = 0; i < fragmentCount; i++) {
        const frag = document.createElement('div');
        const angle = (i / fragmentCount) * Math.PI * 2;
        const dist = 120 + Math.random() * 220;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const size = 6 + Math.random() * 18;
        const rot = Math.random() * 360;
        frag.style.cssText = `
            position: fixed;
            left: 50%; top: 50%;
            width: ${size}px; height: ${size * (0.4 + Math.random() * 0.8)}px;
            background: #0a0510;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            transform: translate(-50%,-50%) rotate(${rot}deg);
            z-index: 9998;
            pointer-events: none;
            filter: drop-shadow(0 0 ${3 + Math.random()*6}px rgba(160,240,255,${0.3 + Math.random()*0.5}));
            animation: inkFrag ${0.6 + Math.random() * 0.5}s cubic-bezier(0.1,0.8,0.2,1) forwards;
            --tx: ${tx}px; --ty: ${ty}px; --rot: ${rot + 180 + Math.random()*120}deg;
        `;
        document.body.appendChild(frag);
        setTimeout(() => frag.remove(), 1200);
    }

    // Fade out du flash
    await sleep(120);
    flashEl.style.transition = 'opacity 0.5s ease';
    flashEl.style.opacity = '0';
    setTimeout(() => flashEl.remove(), 600);

    await sleep(500);
    if (sf) { sf.textContent = ''; sf.style.opacity = '0'; }
    if (daruma) { daruma.innerHTML = ''; daruma.classList.remove('awake', 'ombre-agonie'); daruma.style.cssText = 'display:none;'; }
    // Restaurer le WebGL
    document.body.style.backgroundColor = '';
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) activeScreen.style.backgroundColor = '';

    // ═══════════════════════════════════════════
    // SÉQUENCE MIKOS — Les 8 Mikos révélées
    // ═══════════════════════════════════════════
    setOutroMood('REUNION');
    try { currentMusicMood = null; setMusicMood('SACRE'); } catch(e) {}
    // Vider et masquer le texte résiduel de l'ombre
    if (sf) { sf.classList.add('text-fade-out'); await sleep(400); sf.textContent = ''; sf.classList.remove('text-fade-out'); }
    await spawnMikosScene(sf, sleep);

    // ═══════════════════════════════════════════
    // ÉCRAN 4 — CHÂTEAU RENAÎT
    // ═══════════════════════════════════════════
    setOutroMood('AUBE');
    try { currentMusicMood = null; setMusicMood('VICTOIRE'); } catch(e) {}
    await spawnCastleVictory(sf, sleep);

    // ═══════════════════════════════════════════
    // ÉCRAN 5 — YOKAI
    // ═══════════════════════════════════════════
    setOutroMood('RITUEL');
    try {
        currentMusicMood = null; setMusicMood('EPILOGUE');
        // Gamme Yo basse mystérieuse pour les yokais
        if (typeof currentMelodyNotes !== 'undefined') {
            currentMelodyNotes = [196.00, 220.00, 261.63, 293.66, 392.00, 293.66, 261.63, 220.00];
            _lastMelodyNotes = [];
        }
    } catch(e) {}
    await spawnYokaiScene(sf, sleep);

    // ═══════════════════════════════════════════
    // ÉCRAN 6 — NEKO SUPRÊME
    // ═══════════════════════════════════════════
    setOutroMood('FINAL');
    try {
        // Neko Suprême : retour à VICTOIRE avec gamme lumineuse haute
        currentMusicMood = null;
        setMusicMood('VICTOIRE');
        // Override immédiat avec gamme très haute — effet d'élévation
        setTimeout(() => {
            if (typeof currentMelodyNotes !== 'undefined') {
                currentMelodyNotes = [1046.5, 1174.66, 1318.51, 1046.5, 880.00, 1046.5, 1318.51, 1760.00];
                _lastMelodyNotes = [];
            }
        }, 100);
    } catch(e) {}
    await spawnNekoSupreme(sf, sleep);

    await showFinalText(sealPrompt, 400);
    try { setMusicMood('MIROIR'); } catch(e) {}

    if (btnMirror) {
        // Cacher le btn-grad original — on crée une scène dédiée
        btnMirror.style.display = 'none';

        // Nettoyage de la scène finale pour laisser place au portail
        const screenFinalEl2 = document.getElementById('screen-final');
        const stage2 = document.getElementById('final-circ-nekos');
        if (stage2) { stage2.style.opacity = '0'; stage2.style.visibility = 'hidden'; }

        // === KANJI INTRO 鏡 ===
        const kanjiIntro = document.createElement('div');
        kanjiIntro.className = 'mirror-kanji-intro';
        kanjiIntro.textContent = '鏡';
        document.body.appendChild(kanjiIntro);
        await new Promise(r => setTimeout(r, 1800));
        kanjiIntro.remove();

        // === PORTAIL CERCLE ===
        const portal = document.createElement('div');
        portal.className = 'mirror-portal';
        document.body.appendChild(portal);

        const portalRing = document.createElement('div');
        portalRing.className = 'mirror-portal-ring';
        document.body.appendChild(portalRing);

        // 9 reliques en orbite autour du portail
        const portalSize = Math.min(420, window.innerWidth * 0.8);
        const orbitR = portalSize / 2 + 28;
        const relicKeys2 = ['mochi','ken','shinobi','aiko','kitsune','sumo','zennon','taiko','shogun'];
        const relicColors2 = guardianData.map(g => g.color);
        relicKeys2.forEach((key, i) => {
            const angle = (i / 9) * Math.PI * 2;
            const rx = window.innerWidth/2 + Math.cos(angle) * orbitR - 16;
            const ry = window.innerHeight/2 + Math.sin(angle) * orbitR - 16;
            const wrap = document.createElement('div');
            wrap.style.cssText = `position:fixed;left:${rx}px;top:${ry}px;width:32px;height:32px;z-index:9051;pointer-events:none;opacity:0;transition:opacity 0.4s ease;transform-origin:center;`;
            const svgStr = relicSVG[key];
            if (svgStr) {
                const clean = svgStr.replace(/class="[^"]*"/g,'').replace(/<svg/,`<svg xmlns="http://www.w3.org/2000/svg"`);
                wrap.innerHTML = clean;
                const svgEl = wrap.querySelector('svg');
                if (svgEl) { svgEl.setAttribute('width','32'); svgEl.setAttribute('height','32'); }
            }
            document.body.appendChild(wrap);
            setTimeout(() => { wrap.style.opacity = '0.8'; }, i * 100 + 200);
            // Animation orbite CSS
            wrap.style.animation = `none`;
            // Orbite JS simple
            let orbitAngle = angle;
            // Vitesses individuelles — 2 reliques à contre-sens (indices 2 et 7)
            const orbitSpeeds = [0.00022, 0.00038, -0.00026, 0.00042, 0.00031, 0.00018, 0.00045, -0.00029, 0.00035];
            const orbitSpeed = orbitSpeeds[i] || 0.0003;
            const orbitLoop = () => {
                orbitAngle += orbitSpeed;
                const nx = window.innerWidth/2 + Math.cos(orbitAngle) * orbitR - 16;
                const ny = window.innerHeight/2 + Math.sin(orbitAngle) * orbitR - 16;
                wrap.style.left = nx + 'px';
                wrap.style.top = ny + 'px';
                if (document.body.contains(wrap)) requestAnimationFrame(orbitLoop);
            };
            requestAnimationFrame(orbitLoop);
            portal._relicWraps = portal._relicWraps || [];
            portal._relicWraps.push(wrap);
        });

        // === PLUIE DE PRÉNOMS — vitesses et tailles variées ===
        const nameRainEls = [];
        const pawColors2 = ['#ffb7c5','#98e8d4','#fde68a','#c4b5fd','#fca5a5','#6ee7b7','#a5b4fc','#fdba74'];
        // Chaque prénom tombe plusieurs fois à des positions différentes
        mikoNames.forEach((name, i) => {
            const copies = 2; // 2 copies de chaque prénom en pluie
            for (let c = 0; c < copies; c++) {
                const el = document.createElement('div');
                el.className = 'mirror-name-rain';
                el.textContent = name;
                const leftPct = 5 + Math.random() * 88;
                const fontSize = 12 + Math.random() * 20;
                const rot = -20 + Math.random() * 40;
                // Vitesses très variées — certains lents, certains rapides
                const duration = 5 + Math.random() * 9;
                const delay = c * 4.5 + Math.random() * 3;
                const opacity = 0.25 + Math.random() * 0.5;
                const color = pawColors2[i];
                el.style.cssText = `left:${leftPct}%;top:-40px;font-size:${fontSize}px;color:${color};--nr:${rot}deg;--nd:${duration}s;--delay:${delay}s;--no:${opacity};--col:${color};--glow:${Math.round(fontSize*0.5)}px;`;
                document.body.appendChild(el);
                nameRainEls.push(el);
            }
        });

        // === TEXTE RITUEL — typewriter effect ===
        if (sf) {
            sf.innerHTML = '';
            sf.style.opacity = '1';
            sf.style.fontFamily = "'Fredoka One', cursive";
            sf.style.fontSize = '22px';
            // Kanji discret au-dessus
            const kanjiSub = document.createElement('div');
            kanjiSub.style.cssText = "font-family:'Ma Shan Zheng',cursive;font-size:14px;color:rgba(255,215,0,0.45);letter-spacing:3px;margin-bottom:12px;";
            kanjiSub.textContent = '伝説を鏡に封印せよ';
            sf.appendChild(kanjiSub);
            // Texte principal via typewriter
            const textSpan = document.createElement('span');
            textSpan.style.cssText = "display:block;font-family:'Fredoka One',cursive;font-size:22px;";
            sf.appendChild(textSpan);
            // Typewriter effect manuel
            const phrase = sealPrompt.fr || 'Scellez cette légende dans le Miroir.';
            let charIdx = 0;
            const typeInterval = setInterval(() => {
                if (charIdx < phrase.length) {
                    textSpan.textContent = phrase.substring(0, ++charIdx);
                } else {
                    clearInterval(typeInterval);
                }
            }, 45);
        }

        // === BOUTON SOBRE — style btn-grad avec flash photo ===
        const mirrorBtn = document.createElement('button');
        mirrorBtn.id = 'btn-download-mirror';
        mirrorBtn.textContent = '🪞 Scellez notre légende';
        mirrorBtn.onclick = () => {
            // Nettoyer SANS supprimer le portail — la caméra s'y injecte directement
            nameRainEls.forEach(el => el.remove());
            portalRing.remove();
            if (portal._relicWraps) portal._relicWraps.forEach(w => w.remove());
            mirrorBtn.remove();
            if (sf) { sf.style.fontFamily = ''; sf.style.fontSize = ''; sf.innerHTML = ''; }
            openMirrorAndCapture(); // injecte la caméra dans portal
        };
        document.body.appendChild(mirrorBtn);
        requestAnimationFrame(() => { mirrorBtn.style.opacity = '1'; });
    }
}

/* --- SCÈNE MIKOS --- */
async function spawnMikosScene(sf, sleep) {
    sf = document.getElementById('final-story-box');
    if (sf) { sf.style.opacity = ''; sf.style.transform = ''; sf.classList.remove('text-fade-out'); }
    const _sleep = ms => new Promise(r => setTimeout(r, ms));

    // Garder #final-circ-nekos visible avec son min-height pour maintenir
    // la position du texte sf identique aux autres écrans
    const mainStage = document.getElementById('final-circ-nekos');
    if (mainStage) {
        mainStage.style.visibility = 'visible';
        mainStage.style.opacity = '1';
        mainStage.innerHTML = '<div style="min-height:450px;width:100%;"></div>';
    }

    const mikoStyles = [
        { body: '#ffb7c5', band: '#5ec8f0', band2: '#ff69b4', spots: '#ff8fab', bow: true },
        { body: '#98e8d4', band: '#2dd4a0', band2: '#00b386', spots: '#5ef0c8', bow: false },
        { body: '#fde68a', band: '#fbbf24', band2: '#f59e0b', spots: '#fcd34d', bow: false },
        { body: '#c4b5fd', band: '#a78bfa', band2: '#8b5cf6', spots: '#ddd6fe', bow: false },
        { body: '#fca5a5', band: '#f87171', band2: '#ef4444', spots: '#fecaca', bow: true },
        { body: '#6ee7b7', band: '#34d399', band2: '#10b981', spots: '#a7f3d0', bow: false },
        { body: '#a5b4fc', band: '#818cf8', band2: '#6366f1', spots: '#c7d2fe', bow: false },
        { body: '#fdba74', band: '#fb923c', band2: '#f97316', spots: '#fed7aa', bow: true },
    ];

    // Ordre entrée : de la dernière vers Ava (index 0)
    const entryOrder = [7, 6, 5, 4, 3, 2, 1, 0];

    // Bouquet 2 rangées :
    // Rangée arrière (4 dolls) : indices miko 7,5,3,1 — légèrement plus petites, plus hautes
    // Rangée avant (4 dolls)  : indices miko 6,0,2,4 — Ava (0) au centre, plus grandes
    // disposition par position gauche→droite
    const layout = [
        // [mikoIndex, rangee, posX, posY, scale]
        // Rangée arrière (y=-70px depuis centre)
        { mi: 7, row: 'back',  x: -165, y: -75, scale: 0.82 }, // Fatima
        { mi: 5, row: 'back',  x:  -55, y: -80, scale: 0.85 }, // Romane
        { mi: 3, row: 'back',  x:   55, y: -80, scale: 0.85 }, // Antinea
        { mi: 1, row: 'back',  x:  165, y: -75, scale: 0.82 }, // Nelya
        // Rangée avant (y=+30px depuis centre)
        { mi: 6, row: 'front', x: -185, y:  30, scale: 0.90 }, // Bahia
        { mi: 0, row: 'front', x:  -55, y:  20, scale: 1.10 }, // Ava (centre gauche, légèrement plus basse)
        { mi: 2, row: 'front', x:   55, y:  20, scale: 1.00 }, // Mariam
        { mi: 4, row: 'front', x:  185, y:  30, scale: 0.90 }, // Rosa-Louise
    ];

    const container = document.createElement('div');
    container.id = 'mikos-scene';
    container.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(container);

    // Conteneur centré des dolls
    const stage = document.createElement('div');
    const mikoContainerW = Math.min(420, window.innerWidth * 0.95);
    const xScale = mikoContainerW / 420;
    stage.style.cssText = `position:relative;width:${mikoContainerW}px;height:260px;flex-shrink:0;`;
    container.appendChild(stage);

    // Phrase narrative
    // phrase gérée via sf

    // Créer les dolls, stockées par mikoIndex
    const slots = {};
    const nameEls = {};

    layout.forEach(({ mi, x, y, scale }) => {
        x = Math.round(x * xScale); // adaptatif si écran < 420px
        const isAva = mi === 0;
        const s = mikoStyles[mi];
        const dollSize = 80 * scale;

        const wrap = document.createElement('div');
        wrap.style.cssText = `
            position: absolute;
            left: calc(50% + ${x}px - ${dollSize/2}px);
            top: calc(50% + ${y}px - ${55*scale}px);
            opacity: 0;
            transform: scale(0.2) translateY(50px);
            transition: none;
        `;

        // Pas de prénoms
        const nameEl = document.createElement('div'); // placeholder vide
        nameEl.style.display = 'none';
        wrap.appendChild(nameEl);

        const dollDiv = document.createElement('div');
        dollDiv.innerHTML = buildKokeshi(s, isAva);
        // Appliquer le scale via transform sur la doll
        const inner = dollDiv.firstElementChild;
        if (inner) {
            inner.style.transform = `scale(${scale})`;
            inner.style.transformOrigin = 'bottom center';
        }
        wrap.appendChild(dollDiv);

        stage.appendChild(wrap);
        slots[mi] = wrap;
        nameEls[mi] = nameEl;
    });

    // Entrée en cascade ordre inverse (Fatima→Ava)
    for (let ei = 0; ei < entryOrder.length; ei++) {
        const idx = entryOrder[ei];
        const isAva = idx === 0;
        const slot = slots[idx];
        const nameEl = nameEls[idx];
        const layoutItem = layout.find(l => l.mi === idx);
        const sc = layoutItem ? layoutItem.scale : 1;

        void slot.offsetHeight;
        slot.style.transition = 'opacity 0.5s ease, transform 0.65s cubic-bezier(0.17,0.89,0.32,1.49)';
        slot.style.opacity = '1';
        slot.style.transform = 'scale(1) translateY(0)';
        // prénoms supprimés

        // Son
        try {
            if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
            if (isAva) {
                const notes = [523.25, 659.25, 783.99, 880, 1046.5];
                notes.forEach((f, ni) => setTimeout(() => {
                    try {
                        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                        o.type = 'sine'; o.frequency.value = f;
                        g.gain.setValueAtTime(0.22, audioCtx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
                        o.connect(g); g.connect(audioCtx.destination);
                        o.start(); o.stop(audioCtx.currentTime + 0.7);
                    } catch(e) {}
                }, ni * 110));
            } else {
                playMikoChime(idx);
            }
        } catch(e) {}

        if (isAva) {
            await _sleep(300);
            // Les autres s'inclinent
            Object.values(slots).forEach((s, si) => {
                if (si !== 0) s.classList.add('miko-bow-anim');
            });
            await _sleep(600);
            if (sf) { sf.classList.remove('text-fade-out'); await typewriterText(sf, 'Les 8 Mikos ont purifié le Sanctuaire.'); }
            try { speakDucked('八人の巫女が聖地を、清めた。', { rate: 0.82 }); } catch(e) {}
        }

        await _sleep(isAva ? 0 : 360);
    }

    await _sleep(4200);
    container.style.transition = 'opacity 0.8s ease';
    container.style.opacity = '0';
    await _sleep(850);
    container.remove();
}


/* ============================================================
   ÉCRAN 4 — CHÂTEAU RENAÎT
   ============================================================ */
async function spawnCastleVictory(sf, sleep) {
    sf = document.getElementById('final-story-box');
    // Vider sf EN PREMIER synchroniquement — empêche toute double phrase
    if (sf) { sf.innerHTML = ''; sf.style.opacity = '0'; sf.style.transform = ''; sf.classList.remove('text-fade-out'); }

    // Container fixed sur le body — bypass total des problèmes de layout
    const container = document.createElement('div');
    container.id = 'castle-victory-scene';
    container.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity 0.8s ease;';
    container.innerHTML = `
        <div style="position:relative;width:260px;height:320px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);width:300px;height:100px;background:radial-gradient(ellipse,rgba(255,120,50,0.45) 0%,rgba(255,200,80,0.2) 45%,transparent 72%);filter:blur(22px);z-index:0;"></div>
            <svg viewBox="0 0 240 300" width="240" height="300" style="position:relative;z-index:1;filter:drop-shadow(0 0 14px rgba(160,40,20,0.5));">
                <g>
                    <path d="M 20,280 L 220,280 L 190,200 L 50,200 Z" fill="#2d0505"/>
                    <path d="M 10,200 Q 120,168 230,200 Q 120,188 10,200" fill="#8b1a1a"/>
                    <rect x="100" y="230" width="12" height="20" fill="#ffd700" style="filter:drop-shadow(0 0 6px #ffd700)"/>
                    <rect x="128" y="230" width="12" height="20" fill="#ffd700" style="filter:drop-shadow(0 0 6px #ffd700)"/>
                </g>
                <g>
                    <path d="M 40,200 Q 120,215 200,200 L 170,140 L 70,140 Z" fill="#3d0808"/>
                    <path d="M 22,140 Q 120,112 218,140 Q 120,128 22,140" fill="#8b1a1a"/>
                    <rect x="108" y="165" width="10" height="15" fill="#ffd700" style="filter:drop-shadow(0 0 6px #ffd700)"/>
                    <rect x="122" y="165" width="10" height="15" fill="#ffd700" style="filter:drop-shadow(0 0 6px #ffd700)"/>
                </g>
                <g>
                    <path d="M 60,140 Q 120,153 180,140 L 150,80 L 90,80 Z" fill="#2d0505"/>
                    <path d="M 42,80 Q 120,55 198,80 Q 120,68 42,80" fill="#7a1515"/>
                    <rect x="115" y="105" width="10" height="15" fill="#ffd700" style="filter:drop-shadow(0 0 6px #ffd700)"/>
                </g>
                <g>
                    <path d="M 80,80 Q 120,92 160,80 L 130,30 L 110,30 Z" fill="#3d0808"/>
                    <path d="M 72,30 Q 120,8 168,30 Q 120,18 72,30" fill="#8b1a1a"/>
                    <rect x="116" y="55" width="8" height="12" fill="#ffd700" style="filter:drop-shadow(0 0 6px #ffd700)"/>
                </g>
            </svg>
        </div>`;document.body.appendChild(container);

    // Son + apparition
    try { if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume(); playGameSFX('zen'); } catch(e) {}
    await sleep(50);
    void container.offsetHeight;
    container.style.opacity = '1';

    // Texte dans sf
    await sleep(800);
    if (sf) { sf.style.opacity = '1'; await typewriterText(sf, 'La lumière brille à nouveau sur le Sanctuaire.'); }
    try { speakDucked('光が、　再び聖地を照らした。', { rate: 0.85 }); } catch(e) {}

    await sleep(3800);
    container.style.opacity = '0';
    await sleep(800);
    container.remove();
    if (sf) { sf.classList.add('text-fade-out'); await sleep(400); sf.classList.remove('text-fade-out'); sf.innerHTML = ''; }
}


async function spawnYokaiScene(sf, sleep) {
    sf = document.getElementById('final-story-box');
    if (sf) { sf.style.opacity = ''; sf.style.transform = ''; sf.innerHTML = ''; sf.classList.remove('text-fade-out'); }

    const container = document.createElement('div');
    container.id = 'yokai-scene';
    container.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;';

    // Zone avec overflow:visible — les kodamas dépassent sans être coupés
    const zone = document.createElement('div');
    const kdZoneW = Math.min(600, window.innerWidth * 0.88);
    const kdScale = kdZoneW / 320; // facteur d'échelle des positions ml
    zone.style.cssText = `position:relative;width:${kdZoneW}px;height:320px;overflow:visible;`;

    // Kodama HTML
    // Kodamas centrés : left:50% + margin-left pour offset depuis le centre
    // margin-left en px — contrôle précis sans débordement
    const kd = (rhythm, ml, bottom, scale, delay) => {
        const scaledMl = Math.round(ml * kdScale);
        return `<div class="kd-container ${rhythm}" style="position:absolute;left:50%;margin-left:${scaledMl}px;bottom:${bottom}%;transform:scale(${scale});transform-origin:bottom center;z-index:${Math.round(scale*10)};opacity:0;transition:opacity 0.6s ease;">` +
        `<div class="kodama-new-head" style="animation-delay:${delay}s;"><div class="kodama-new-left-eye"></div><div class="kodama-new-right-eye"></div><div class="kodama-new-mouth"></div></div>` +
        `<div class="kodama-new-body"><div class="kodama-new-left-arm"></div><div class="kodama-new-right-arm"></div></div></div>`;
    };

    // ml = offset depuis le centre de la zone (négatif=gauche, positif=droite)
    zone.innerHTML =
        kd('kd-rhythm-3',  -60, 38, 0.62, -1.0) +  // grand gauche
        kd('kd-rhythm-1',  -15, 42, 0.50, -2.5) +  // moyen centre-gauche
        kd('kd-rhythm-2',  +30, 35, 0.38, -4.0) +  // petit centre-droite
        kd('kd-rhythm-1',  -95, 25, 0.30,  0.0) +  // petit gauche loin
        kd('kd-rhythm-3',  +65, 22, 0.28, -3.0) +  // minuscule droite
        kd('kd-rhythm-2',  -35, 18, 0.45, -1.5);   // moyen bas-gauche

    // Pétale qui descend depuis le haut
    const petalEl = document.createElement('div');
    petalEl.className = 'yokai-petal';
    petalEl.style.cssText = 'position:absolute;left:50%;top:0;transform:translateX(-50%);z-index:20;';
    zone.appendChild(petalEl);

    container.appendChild(zone);
    document.body.appendChild(container);

    // Lueur de sol sous le groupe
    const groundGlow = document.createElement('div');
    groundGlow.className = 'kd-ground-glow';
    zone.appendChild(groundGlow);

    // Reflet au sol
    const groundReflect = document.createElement('div');
    groundReflect.className = 'kd-reflect';
    zone.appendChild(groundReflect);

    // Apparition cascade — surgissement depuis le sol
    const kds = zone.querySelectorAll('.kd-container');
    const sparkColors = ['#ffb7c5','#fff','#ffd700','#c4b5fd','#98e8d4'];
    for (let i = 0; i < kds.length; i++) {
        await sleep(i * 260);
        const kd = kds[i];
        // Lire le scale inline pour l'animation
        const inlineScale = kd.style.transform.match(/scale\(([\d.]+)\)/);
        const sc = inlineScale ? inlineScale[1] : '1';
        kd.style.setProperty('--kd-s', sc);
        kd.style.transform = ''; // retirer le scale inline — l'animation le gère
        kd.classList.add('kd-surging');

        // Étincelles radiales à l'apparition
        const rect = { left: 0, top: 0 }; // position relative dans zone
        const sparkCount = 7;
        for (let s = 0; s < sparkCount; s++) {
            const spark = document.createElement('div');
            spark.className = 'kd-spark';
            const angle = (s / sparkCount) * Math.PI * 2;
            const dist = 40 + Math.random() * 30;
            spark.style.setProperty('--sx', `${Math.cos(angle)*dist}px`);
            spark.style.setProperty('--sy', `${Math.sin(angle)*dist}px`);
            spark.style.background = sparkColors[Math.floor(Math.random()*sparkColors.length)];
            spark.style.left = '50%'; spark.style.top = '30%';
            spark.style.animationDelay = `${Math.random()*0.12}s`;
            kd.appendChild(spark);
            setTimeout(() => spark.remove(), 700);
        }

        // Remettre le scale après l'animation de surgissement
        setTimeout(() => {
            kd.classList.remove('kd-surging');
            kd.style.transform = `scale(${sc})`;
            kd.style.opacity = '0.9';
        }, 650);

        try {
            if (audioCtx && audioCtx.state !== 'suspended') {
                const freqs = [349.23, 392.00, 440.00, 493.88, 523.25, 587.33];
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.type = 'sine';
                o.frequency.setValueAtTime(freqs[i % freqs.length] * 0.8, audioCtx.currentTime);
                o.frequency.linearRampToValueAtTime(freqs[i % freqs.length], audioCtx.currentTime + 0.15);
                g.gain.setValueAtTime(0, audioCtx.currentTime);
                g.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.06);
                g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                o.connect(g); g.connect(masterGain || audioCtx.destination);
                o.start(); o.stop(audioCtx.currentTime + 0.55);
            }
        } catch(e) {}
    }

    // Texte dans sf
    await sleep(300);
    if (sf) { sf.classList.remove('text-fade-out'); sf.innerHTML = ''; sf.style.opacity = '1'; await typewriterText(sf, 'Les Yokai se souviennent... et un pétale suffit à tout dire.'); }
    try { speakDucked('妖怪は覚えている…　一枚の花びらで、十分だ。', { rate: 0.72 }); } catch(e) {}

    // Pétale tombe
    await sleep(1000);
    petalEl.classList.add('is-falling');

    // Regard coordonné vers le pétale + hochement
    await sleep(1200);
    const layout_ml = [-60, -15, +30, -95, +65, -35];
    kds.forEach((kd, idx) => {
        const head = kd.querySelector('.kodama-new-head');
        if (head) {
            const ml = layout_ml[idx] || 0;
            const tiltDir = ml < 0 ? 1 : -1; // regard vers le centre
            head.style.transition = 'transform 0.6s cubic-bezier(0.17,0.89,0.32,1.49)';
            head.style.transform = `translateY(-6px) rotate(${tiltDir * (4 + Math.abs(ml)*0.04)}deg)`;
        }
    });
    await sleep(1400);
    // Hochement de joie
    kds.forEach(kd => {
        const head = kd.querySelector('.kodama-new-head');
        if (head) {
            head.style.transition = 'transform 0.35s ease';
            head.style.transform = 'translateY(-12px) scale(1.08)';
            setTimeout(() => { head.style.transform = ''; head.style.transition = ''; }, 350);
        }
    });

    await sleep(2000);
    container.style.transition = 'opacity 0.7s ease';
    container.style.opacity = '0';
    await sleep(700);
    container.remove();
    if (sf) { sf.style.opacity = '0'; sf.innerHTML = ''; }
}


async function spawnNekoSupreme(sf, sleep) {
    sf = document.getElementById('final-story-box');
    if (sf) { sf.style.opacity = '1'; sf.style.transform = ''; sf.innerHTML = ''; sf.classList.remove('text-fade-out'); }
    const stage = document.getElementById('final-circ-nekos');
    if (!stage) return;

    const nekoArt = `<div class="neko-art-container"><div class="ears"><div class="ear-left-out"></div><div class="ear-left-inner"></div><div class="ear-right-out"></div><div class="ear-right-inner"></div></div><div class="head"><div class="eyes"><div class="eye-left"></div><div class="eye-right"></div></div><div class="face-center"><div class="mustache-left"></div><div class="mustache-left-bottom"></div><div class="mustache-right"></div><div class="mustache-right-bottom"></div><div class="nose"></div><div class="mouth"></div><div class="mouth-right"></div></div></div><div class="necklace"><div class="bell"><div class="reflect"></div></div></div><div class="arm-top-left-wrapper"><div class="arm-top-left"></div><div class="arm-top-left-tip"></div><div class="gold"><span class="carving">幸<br>福</span></div></div><div class="arm-top-right"></div><div class="arm-top-right-tip"></div><div class="back-legs"><div class="back-leg-left"></div><div class="back-leg-right"></div></div><div class="paws"><div class="paw-left"></div><div class="paw-right"></div></div></div>`;

    stage.style.visibility = 'visible';
    stage.style.opacity = '0';
    stage.style.transition = 'opacity 1s ease';
    stage.innerHTML = `
        <div class="neko-supreme-wrap">
            <div class="neko-supreme-rainbow"></div>
            <div class="neko-stage obsidian-mode happy neko-supreme-stage" style="opacity:0;transition:opacity 1s ease,transform 1s cubic-bezier(0.17,0.89,0.32,1.3);transform:scale(0.6) translateY(30px);">
                <div class="neko-scale-wrapper">
                    ${nekoArt}
                </div>
            </div>
        </div>`;

    await sleep(200);
    void stage.offsetHeight;
    stage.style.opacity = '1';

    const nekoEl = stage.querySelector('.neko-supreme-stage');
    await sleep(300);
    void nekoEl.offsetHeight;
    nekoEl.style.opacity = '1';
    nekoEl.style.transform = 'scale(1) translateY(0)';

    // Son d'apparition + musique VICTOIRE après le fade-in
    try { if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume(); playGameSFX('chime_portal'); } catch(e) {}
    setTimeout(() => { try { currentMusicMood = null; setMusicMood('VICTOIRE'); } catch(e) {} }, 1500);

    // Texte — forcer opacity 1 en style inline (yokai l'avait mis à 0)
    await sleep(800);
    if (sf) {
        sf.style.opacity = '1';
        sf.classList.remove('text-fade-out');
        sf.innerHTML = '';
        await typewriterText(sf, 'Les Gardiens veillent sur vous à jamais.');
    }
    try { speakDucked('守護者たちは…永遠に…あなたたちを守る。', { rate: 0.78 }); } catch(e) {}

    // Inclinaison + son
    await sleep(1500);
    if (nekoEl) {
        nekoEl.style.transition = 'transform 0.8s cubic-bezier(0.17,0.89,0.32,1.1)';
        nekoEl.style.transform = 'rotate(-10deg) translateY(8px)';
        try { playMikoChime(0); } catch(e) {}
        await sleep(800);
        nekoEl.style.transform = 'rotate(0deg) translateY(0)';
    }

    await sleep(2200);
    stage.style.opacity = '0';
    await sleep(800);
    stage.innerHTML = '';
    stage.style.visibility = 'hidden';
    stage.style.transition = '';
    if (sf) { sf.classList.add('text-fade-out'); await sleep(400); sf.classList.remove('text-fade-out'); sf.innerHTML = ''; }
}


/* Typewriter global — identique à showStoryText de l'intro */
async function typewriterText(el, htmlStr) {
    if (!el) return;
    const tokens = [];
    let inTag = false, currentTag = '';
    for (let i = 0; i < htmlStr.length; i++) {
        const ch = htmlStr[i];
        if (ch === '<') { inTag = true; currentTag = '<'; }
        else if (ch === '>' && inTag) { currentTag += '>'; tokens.push(currentTag); inTag = false; currentTag = ''; }
        else if (inTag) { currentTag += ch; }
        else { tokens.push(ch); }
    }
    const charCount = tokens.filter(t => !t.startsWith('<')).length;
    const speed = Math.max(25, Math.min(70, 2800 / charCount));
    el.innerHTML = '<span class="tw-content"></span><span class="typewriter-cursor"></span>';
    const twContent = el.querySelector('.tw-content');
    const cursor = el.querySelector('.typewriter-cursor');
    await new Promise(resolve => {
        let i = 0;
        function typeNext() {
            if (i >= tokens.length) { if (cursor) cursor.remove(); twContent.innerHTML = htmlStr; resolve(); return; }
            const token = tokens[i];
            if (token.startsWith('<')) { twContent.innerHTML += token; i++; typeNext(); }
            else { twContent.innerHTML += token; i++; setTimeout(typeNext, speed); }
        }
        typeNext();
    });
}

function buildKokeshi(s, isAva) {
    const bow = s.bow ? `
        <div style="position:absolute;top:2px;left:50%;transform:translateX(-50%);width:18px;height:10px;z-index:5;">
            <div style="position:absolute;left:0;top:1px;width:7px;height:7px;background:${s.band};border-radius:50% 0 0 50%;transform:rotate(-20deg);"></div>
            <div style="position:absolute;right:0;top:1px;width:7px;height:7px;background:${s.band};border-radius:0 50% 50% 0;transform:rotate(20deg);"></div>
            <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:5px;height:5px;background:${s.band2};border-radius:50%;"></div>
        </div>` : `
        <div style="position:absolute;top:0px;left:50%;transform:translateX(-50%);z-index:5;display:flex;gap:3px;">
            <div style="width:5px;height:5px;background:${s.band};border-radius:50%;box-shadow:0 0 4px ${s.band};"></div>
            <div style="width:5px;height:5px;background:${s.band2};border-radius:50%;box-shadow:0 0 4px ${s.band2};"></div>
        </div>`;

    const avaGlow = '';
    const avaCrown = isAva ? `
        <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:10px;filter:drop-shadow(0 0 4px gold);">👑</div>` : '';

    return `
    <div class="miko-doll" style="position:relative;width:80px;height:110px;${avaGlow}">
        ${avaCrown}
        <!-- Cheveux -->
        <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:44px;height:22px;background:#1a1a1a;border-radius:50% 50% 0 0;z-index:3;">
            <!-- Chignon -->
            <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:18px;height:18px;background:#1a1a1a;border-radius:50%;"></div>
            ${bow}
        </div>
        <!-- Visage -->
        <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);width:38px;height:36px;background:#ffecd6;border-radius:45% 45% 50% 50%;z-index:4;overflow:hidden;">
            <!-- Yeux -->
            <div style="position:absolute;top:13px;left:7px;width:6px;height:3px;background:#1a1a1a;border-radius:50%;"></div>
            <div style="position:absolute;top:13px;right:7px;width:6px;height:3px;background:#1a1a1a;border-radius:50%;"></div>
            <!-- Blush -->
            <div style="position:absolute;top:16px;left:3px;width:8px;height:5px;background:rgba(255,150,150,0.45);border-radius:50%;"></div>
            <div style="position:absolute;top:16px;right:3px;width:8px;height:5px;background:rgba(255,150,150,0.45);border-radius:50%;"></div>
            <!-- Bouche -->
            <div style="position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:8px;height:4px;background:#e57373;border-radius:0 0 50% 50%;"></div>
        </div>
        <!-- Cheveux côtés -->
        <div style="position:absolute;top:16px;left:10px;width:10px;height:22px;background:#1a1a1a;border-radius:50% 0 0 50%;z-index:2;"></div>
        <div style="position:absolute;top:16px;right:10px;width:10px;height:22px;background:#1a1a1a;border-radius:0 50% 50% 0;z-index:2;"></div>
        <!-- Corps / Kimono -->
        <div style="position:absolute;top:44px;left:50%;transform:translateX(-50%);width:60px;height:58px;background:${s.body};border-radius:40% 40% 20% 20%;z-index:1;overflow:hidden;box-shadow:inset 0 -8px 12px rgba(0,0,0,0.15);">
            <!-- Motifs floraux -->
            <div style="position:absolute;top:8px;left:6px;width:10px;height:10px;background:${s.spots};border-radius:50%;opacity:0.7;"></div>
            <div style="position:absolute;top:18px;left:14px;width:8px;height:8px;background:${s.spots};border-radius:50%;opacity:0.5;"></div>
            <div style="position:absolute;top:8px;right:6px;width:10px;height:10px;background:${s.spots};border-radius:50%;opacity:0.7;"></div>
            <div style="position:absolute;top:22px;right:10px;width:7px;height:7px;background:${s.spots};border-radius:50%;opacity:0.5;"></div>
            <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:9px;height:9px;background:${s.spots};border-radius:50%;opacity:0.6;"></div>
            <!-- Col kimono -->
            <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:16px;height:20px;background:#ffecd6;clip-path:polygon(20% 0,80% 0,100% 100%,0 100%);"></div>
            <!-- Ceinture obi -->
            <div style="position:absolute;top:16px;left:0;right:0;height:10px;background:${s.band};opacity:0.9;"></div>
            <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);width:14px;height:6px;background:${s.band2};border-radius:3px;"></div>
        </div>
        <!-- Bras -->
        <div style="position:absolute;top:54px;left:4px;width:12px;height:8px;background:${s.body};border-radius:50%;z-index:0;transform:rotate(20deg);"></div>
        <div style="position:absolute;top:54px;right:4px;width:12px;height:8px;background:${s.body};border-radius:50%;z-index:0;transform:rotate(-20deg);"></div>
    </div>`;
}

/* --- MIROIR DES ESPRITS --- */
function openMirror() {
    const overlay = document.getElementById('mirror-overlay');
    try {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(stream => {
            document.getElementById('mirror-cam').srcObject = stream;
            document.getElementById('selfie-container').style.display = 'block';
            document.getElementById('selfie-cam').srcObject = stream;
        }).catch(e => {});
    } catch(e) {}
    overlay.classList.add('active');
}

function openMirrorAndCapture() {
    const portal = document.querySelector('.mirror-portal');
    if (!portal) { openMirror(); return; }

    // Transition fondue nacré → caméra
    portal.style.transition = 'all 0.8s ease';
    portal.classList.add('mirror-portal-camera');

    // Pétales sakura dans le portail
    const petalColors = ['#ffb7c5','#ffd6e7','#ffe4f0','#ffb7c5','#ffd6e7','#fff0f5'];
    for (let p = 0; p < 6; p++) {
        const petal = document.createElement('div');
        const dur = 3 + Math.random() * 2;
        const left = 10 + Math.random() * 80;
        const delay = Math.random() * 3;
        petal.style.cssText = `position:absolute;width:7px;height:5px;background:${petalColors[p]};border-radius:40% 60% 55% 45%;opacity:0.7;left:${left}%;top:-10px;z-index:4;pointer-events:none;animation:portal-petal-fall ${dur}s ease-in ${delay}s infinite;filter:drop-shadow(0 0 3px ${petalColors[p]});`;
        portal.appendChild(petal);
    }

    // Vidéo dans le portail
    const video = document.createElement('video');
    video.autoplay = true; video.playsInline = true;
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1);border-radius:50%;filter:sepia(0.2) hue-rotate(190deg) brightness(0.92) saturate(1.15);opacity:0;transition:opacity 0.8s ease;z-index:1;';
    portal.appendChild(video);

    // Shader reflet
    const shader = document.createElement('div');
    shader.style.cssText = 'position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,rgba(255,255,255,0) 0%,rgba(161,196,253,0.1) 40%,rgba(255,255,255,0.18) 50%,rgba(255,255,255,0) 60%);background-size:200% 200%;animation:mirror-ripple 5s linear infinite;pointer-events:none;mix-blend-mode:overlay;z-index:2;';
    portal.appendChild(shader);

    // Compte à rebours kanji
    const kanjiNums = ['三','二','一','✨'];
    const cdColors = ['#ffb7c5','#ffb347','#ffffff','#ffd700'];
    const cd = document.createElement('div');
    cd.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:"Ma Shan Zheng",cursive;font-size:min(22vmin,110px);pointer-events:none;z-index:5;transition:transform 0.15s ease,opacity 0.15s ease;';
    portal.appendChild(cd);

    navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:{ideal:1280}, height:{ideal:1280} }, audio:false })
    .then(stream => {
        video.srcObject = stream;
        // Fondu progressif de la vidéo
        setTimeout(() => { video.style.opacity = '1'; }, 100);

        let count = 0; // index dans kanjiNums
        const showKanji = () => {
            const kanji = kanjiNums[count];
            const color = cdColors[count];
            cd.textContent = kanji;
            cd.style.color = color;
            cd.style.textShadow = `0 0 20px ${color}, 0 0 50px ${color}88`;
            // Couleur bordure portail
            portal.style.borderColor = color === '#ffffff' ? 'rgba(255,255,255,0.9)' : color;
            portal.style.boxShadow = `0 0 40px ${color}66, 0 0 80px ${color}33`;
            // Pulse du chiffre
            cd.style.transform = 'scale(1.3)';
            setTimeout(() => { cd.style.transform = 'scale(1)'; }, 200);
            // Son : miko chime au lieu de beep
            try {
                if (count < 3) playMikoChime(count * 2 + 4);
                else { playGameSFX('chime_portal'); if (navigator.vibrate) navigator.vibrate([80,30,120]); }
            } catch(e) {}
        };
        showKanji();

        const tick = setInterval(() => {
            count++;
            if (count < 3) {
                showKanji();
            } else if (count === 3) {
                showKanji(); // ✨
                clearInterval(tick);
                // Flash
                const flash = document.getElementById('flash');
                if (flash) { flash.style.background='white'; flash.style.opacity=1; setTimeout(()=>{ flash.style.opacity=0; flash.style.background='transparent'; },400); }

                // Snapshot
                const snapCanvas = document.createElement('canvas');
                snapCanvas.width = video.videoWidth || 1280;
                snapCanvas.height = video.videoHeight || 720;
                const snapCtx = snapCanvas.getContext('2d');
                snapCtx.translate(snapCanvas.width, 0);
                snapCtx.scale(-1, 1);
                snapCtx.drawImage(video, 0, 0);
                window._mirrorSnapshot = snapCanvas;
                window._mirrorStream = stream;

                setTimeout(() => {
                    stream.getTracks().forEach(t => t.stop());
                    if (portal && portal.parentNode) portal.remove();
                    captureEstampe();
                }, 700);
            }
        }, 1000);
    })
    .catch(() => { openMirror(); });
}


/* --- CAPTURE ESTAMPE KAWAII POP --- */
function captureEstampe() {
    document.getElementById('flash').style.background = 'white';
    document.getElementById('flash').style.opacity = 1;
    setTimeout(() => { document.getElementById('flash').style.opacity = 0; document.getElementById('flash').style.background = 'transparent'; }, 600);
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
    playGameSFX('thud');

    // Utiliser le snapshot figé au moment du flash (évite la frame à moitié vide)
    const snapshot = window._mirrorSnapshot || null;
    const video = window._mirrorInplaceVideo || document.getElementById('mirror-cam');
    const canvas = document.getElementById('polaroid-canvas');
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1920;
    canvas.width = W; canvas.height = H;

    // Helper : dessiner un SVG string sur le canvas
    const drawSVG = (svgStr, x, y, w, h, angle = 0) => new Promise(resolve => {
        const clean = svgStr
            .replace(/class="[^"]*"/g, '')
            .replace(/<svg/, `<svg xmlns="http://www.w3.org/2000/svg"`)
            .replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')
            .replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        const blob = new Blob([clean], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            ctx.save();
            ctx.translate(x + w/2, y + h/2);
            if (angle) ctx.rotate(angle);
            ctx.drawImage(img, -w/2, -h/2, w, h);
            ctx.restore();
            URL.revokeObjectURL(url);
            resolve();
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        img.src = url;
    });

    const render = async () => {
        const rng = (seed) => { let x = Math.sin(seed+1) * 10000; return x - Math.floor(x); };

        // ══════════════════════════════════════
        // FOND — nuit encre violette
        // ══════════════════════════════════════
        const bg = ctx.createRadialGradient(W/2, H*0.38, 60, W/2, H/2, H*0.75);
        bg.addColorStop(0, '#2d0a4e');
        bg.addColorStop(0.45, '#12011a');
        bg.addColorStop(1, '#050010');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // Texture washi — init si pas encore fait
        if (typeof precomputeWashi === 'function' && (typeof washiCanvas === 'undefined' || !washiCanvas)) { try { precomputeWashi(); } catch(e) {} }
        if (typeof washiCanvas !== 'undefined' && washiCanvas) {
            ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(washiCanvas, 0, 0, W, H);
            ctx.globalCompositeOperation = 'source-over'; ctx.restore();
        }

        // Étoiles procédurales
        for (let i = 0; i < 240; i++) {
            const sx = rng(i*3.1)*W, sy = rng(i*7.3)*H;
            const sr = rng(i*11.7)*2.5+0.5, sa = rng(i*5.9)*0.65+0.3;
            const colors = ['#fff','#ffb7c5','#c4b5fd','#98e8d4','#fde68a'];
            ctx.fillStyle = colors[Math.floor(rng(i*2.2)*5)];
            ctx.globalAlpha = sa;
            ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Étoiles 4 branches (style ukiyo-e) dans les zones vides
        for (let i = 0; i < 22; i++) {
            const sx = rng(i*13.7+1)*W, sy = rng(i*19.3+1)*H;
            const sr = rng(i*7.1+1)*4+2, sa = rng(i*3.7+1)*0.5+0.15;
            ctx.save(); ctx.globalAlpha = sa; ctx.fillStyle = '#fde68a';
            ctx.translate(sx, sy); ctx.rotate(rng(i*5.3)*Math.PI/4);
            for (let b = 0; b < 4; b++) {
                ctx.rotate(Math.PI/2);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(sr*0.3,sr*0.3); ctx.lineTo(0,sr*2.5); ctx.lineTo(-sr*0.3,sr*0.3);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        // Pétales sakura dispersés
        for (let i = 0; i < 50; i++) {
            const px = rng(i*4.1)*W, py = rng(i*6.3)*H;
            const pr = rng(i*8.7)*14+4, pa = rng(i*3.3)*Math.PI*2;
            ctx.save(); ctx.globalAlpha = rng(i*9.1)*0.45+0.1;
            ctx.translate(px, py); ctx.rotate(pa);
            ctx.fillStyle = ['#ffb7c5','#ff69b4','#ffd6e7','#fca5a5','#ffe4e1'][Math.floor(rng(i*2.7)*5)];
            ctx.beginPath(); ctx.ellipse(0, 0, pr, pr*0.55, 0, 0, Math.PI*2);
            ctx.fill(); ctx.restore();
        }

        // Nuages ukiyo-e coins
        const drawCloud = (cx, cy, scale, alpha) => {
            ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#c4b5fd';
            [[0,0,40],[45,-15,30],[80,5,35],[115,-10,25],[148,0,30]].forEach(([ox,oy,r]) => {
                ctx.beginPath(); ctx.arc(cx+ox*scale, cy+oy*scale, r*scale, 0, Math.PI*2); ctx.fill();
            }); ctx.restore();
        };
        drawCloud(-20, 90, 0.65, 0.14); drawCloud(W-170, 130, 0.55, 0.11);
        drawCloud(-20, H-210, 0.5, 0.10); drawCloud(W-175, H-160, 0.5, 0.09);

        // ══════════════════════════════════════
        // TITRE avec ornements katana
        // ══════════════════════════════════════
        // Lignes décoratives
        const drawTitleLine = (y) => {
            ctx.save(); ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 1.5;
            ctx.setLineDash([6,8]);
            ctx.beginPath(); ctx.moveTo(80,y); ctx.lineTo(W-80,y); ctx.stroke();
            // Losanges aux extrémités
            ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,215,0,0.5)';
            [[80,y],[W-80,y]].forEach(([x,yy]) => {
                ctx.save(); ctx.translate(x,yy); ctx.rotate(Math.PI/4);
                ctx.fillRect(-5,-5,10,10); ctx.restore();
            }); ctx.restore();
        };
        drawTitleLine(55);
        drawTitleLine(200);

        // Halo titre
        const titleGlow = ctx.createRadialGradient(W/2, 125, 10, W/2, 125, 300);
        titleGlow.addColorStop(0, 'rgba(255,20,147,0.22)');
        titleGlow.addColorStop(1, 'rgba(255,20,147,0)');
        ctx.fillStyle = titleGlow; ctx.fillRect(0, 0, W, 270);

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff1493'; ctx.shadowBlur = 35;
        ctx.fillStyle = '#ffd700'; ctx.font = "bold 90px 'Ma Shan Zheng', cursive";
        ctx.fillText('九猫の奇跡', W/2, 108);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,235,180,0.95)'; ctx.font = "34px 'Fredoka One', cursive";
        ctx.fillText('Joyeux anniversaire Ava · 9 ans de magie', W/2, 178);

        // Katana ornements de titre (relique ken)
        const kenSVG = relicSVG['ken'];
        if (kenSVG) {
            await drawSVG(kenSVG, 60, 68, 56, 56, -Math.PI/6);
            await drawSVG(kenSVG, W-116, 68, 56, 56, Math.PI/6 + Math.PI);
        }

        // ══════════════════════════════════════
        // RELIQUES EN ARC — couleurs gardiens
        // ══════════════════════════════════════
        const relicSize = 76;
        const relicPromises = [];
        for (let i = 0; i < 9; i++) {
            const svgStr = getRelicSVG(i);
            if (!svgStr) continue;
            const arcAngle = (i / 8) * Math.PI - Math.PI/2 + Math.PI/8;
            const rx = W/2 + Math.cos(arcAngle) * 370;
            // Alternance hauteur odd/even
            const ry = 310 + Math.sin(arcAngle) * 55 + (i%2 === 0 ? -18 : 18);
            const tilt = (i - 4) * 0.09;
            const gColor = guardianData[i] ? guardianData[i].color : '#ffd700';
            // Halo coloré par gardien
            ctx.save(); ctx.globalAlpha = 0.55;
            const rg = ctx.createRadialGradient(rx, ry, 4, rx, ry, 50);
            rg.addColorStop(0, gColor); rg.addColorStop(1, 'transparent');
            ctx.fillStyle = rg; ctx.fillRect(rx-50, ry-50, 100, 100);
            ctx.restore();
            relicPromises.push(drawSVG(svgStr, rx-relicSize/2, ry-relicSize/2, relicSize, relicSize, tilt));
        }
        await Promise.all(relicPromises);

        // ══════════════════════════════════════
        // PHOTO — cercle central
        // ══════════════════════════════════════
        const photoX = W/2, photoY = 870, photoR = 340;

        // 4 grandes fleurs de sakura aux coins du cercle
        const drawSakuraCorner = (cx, cy, size, angle) => {
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
            ctx.globalAlpha = 0.55;
            for (let p = 0; p < 5; p++) {
                ctx.save(); ctx.rotate((p/5)*Math.PI*2);
                const pg = ctx.createRadialGradient(0, -size*0.4, 2, 0, -size*0.4, size*0.55);
                pg.addColorStop(0, '#ffd6e7'); pg.addColorStop(1, '#ff69b4');
                ctx.fillStyle = pg;
                ctx.beginPath(); ctx.ellipse(0, -size*0.4, size*0.28, size*0.42, 0, 0, Math.PI*2);
                ctx.fill(); ctx.restore();
            }
            ctx.restore();
        };
        const sakuraOffset = photoR * 0.72;
        drawSakuraCorner(photoX - sakuraOffset, photoY - sakuraOffset, 48, -Math.PI/5);
        drawSakuraCorner(photoX + sakuraOffset, photoY - sakuraOffset, 48, Math.PI/5);
        drawSakuraCorner(photoX - sakuraOffset, photoY + sakuraOffset, 42, Math.PI/4);
        drawSakuraCorner(photoX + sakuraOffset, photoY + sakuraOffset, 42, -Math.PI/4);

        // Halo nacré doux
        ctx.save();
        const haloG = ctx.createRadialGradient(photoX, photoY, photoR*0.5, photoX, photoY, photoR+80);
        haloG.addColorStop(0, 'rgba(255,183,197,0)');
        haloG.addColorStop(0.6, 'rgba(196,181,253,0.15)');
        haloG.addColorStop(1, 'transparent');
        ctx.fillStyle = haloG; ctx.fillRect(photoX-photoR-90, photoY-photoR-90, (photoR+90)*2, (photoR+90)*2);
        ctx.restore();

        // Anneau shimenawa (corde sacrée — tirets obliques)
        ctx.save();
        ctx.beginPath(); ctx.arc(photoX, photoY, photoR+22, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,215,0,0.18)'; ctx.lineWidth = 14;
        ctx.setLineDash([4, 8]); ctx.lineDashOffset = 0; ctx.stroke();
        ctx.setLineDash([]);
        // Anneau blanc extérieur
        ctx.beginPath(); ctx.arc(photoX, photoY, photoR+30, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 5; ctx.stroke();
        // Anneau doré intérieur
        ctx.beginPath(); ctx.arc(photoX, photoY, photoR+10, 0, Math.PI*2);
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();

        // Photo dans le cercle — snapshot figé au moment du flash
        const photoSrc = snapshot || (video && video.videoWidth > 0 ? video : null);
        if (photoSrc) {
            ctx.save();
            ctx.beginPath(); ctx.arc(photoX, photoY, photoR, 0, Math.PI*2); ctx.clip();
            const srcW = photoSrc.videoWidth || photoSrc.width;
            const srcH = photoSrc.videoHeight || photoSrc.height;
            const s = Math.min(srcW, srcH);
            if (snapshot) {
                // Snapshot déjà mirrorisé — dessin direct sans flip
                ctx.drawImage(snapshot, (srcW-s)/2, (srcH-s)/2, s, s, photoX-photoR, photoY-photoR, photoR*2, photoR*2);
            } else {
                // Fallback : video live avec flip
                ctx.translate(photoX + photoR, photoY); ctx.scale(-1, 1); ctx.translate(-photoX, -photoY);
                ctx.drawImage(video, (srcW-s)/2, (srcH-s)/2, s, s, photoX-photoR, photoY-photoR, photoR*2, photoR*2);
            }
            ctx.restore();
        } else {
            ctx.save();
            ctx.beginPath(); ctx.arc(photoX, photoY, photoR, 0, Math.PI*2);
            const pg = ctx.createRadialGradient(photoX, photoY-60, 30, photoX, photoY, photoR);
            pg.addColorStop(0, '#3d1260'); pg.addColorStop(1, '#0a0018');
            ctx.fillStyle = pg; ctx.fill();
            // Placeholder neko SVG si pas de caméra
            const nekoP = relicSVG['kitsune'];
            if (nekoP) await drawSVG(nekoP, photoX-80, photoY-80, 160, 160, 0);
            ctx.restore();
        }

        // ══════════════════════════════════════
        // 8 MÉDAILLONS JOUEUSES en orbite
        // ══════════════════════════════════════
        const pawColors = ['#ffb7c5','#98e8d4','#fde68a','#c4b5fd','#fca5a5','#6ee7b7','#a5b4fc','#fdba74'];
        const pawDark   = ['#ff1493','#00b386','#f59e0b','#8b5cf6','#ef4444','#10b981','#6366f1','#f97316'];
        for (let i = 0; i < 8; i++) {
            const a = (i/8)*Math.PI*2 - Math.PI/2;
            const px = photoX + Math.cos(a)*(photoR+76);
            const py = photoY + Math.sin(a)*(photoR+76);
            const pr = 40;
            const pg2 = ctx.createRadialGradient(px-pr*0.2, py-pr*0.25, 2, px, py, pr);
            pg2.addColorStop(0, pawColors[i]); pg2.addColorStop(1, pawDark[i]);
            ctx.save(); ctx.shadowColor = pawColors[i]; ctx.shadowBlur = 18;
            ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI*2);
            ctx.fillStyle = pg2; ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2.5; ctx.stroke();
            // Reflet glossy
            ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(px-pr*0.15, py-pr*0.28, pr*0.36, pr*0.17, -0.3, 0, Math.PI*2);
            ctx.fill(); ctx.globalAlpha = 1;
            // Patte de chat — 1 coussinet central + 4 petits
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.32)';
            // Coussinet central
            ctx.beginPath(); ctx.ellipse(px, py + pr*0.08, pr*0.38, pr*0.32, 0, 0, Math.PI*2); ctx.fill();
            // 4 petits coussinets en arc au-dessus
            const padR = pr * 0.16;
            const padOffsets = [[-pr*0.35, -pr*0.28], [-pr*0.13, -pr*0.42], [pr*0.13, -pr*0.42], [pr*0.35, -pr*0.28]];
            padOffsets.forEach(([ox, oy]) => {
                ctx.beginPath(); ctx.ellipse(px+ox, py+oy, padR, padR*0.85, ox*0.03, 0, Math.PI*2); ctx.fill();
            });
            ctx.restore();
        }

        // ══════════════════════════════════════
        // KANJI GARDIENS — zone entre photo et nekos
        // ══════════════════════════════════════
        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,215,0,0.45)';
        // Taille adaptative : réduire si la ligne dépasse la largeur utile
        let kanjiFontSize = 24;
        ctx.font = `${kanjiFontSize}px 'Ma Shan Zheng', cursive`;
        const kanjiStr = guardianData.map(g => g.kanji).join(' · ');
        const kanjiMeasure = ctx.measureText(kanjiStr).width;
        if (kanjiMeasure > W - 120) {
            kanjiFontSize = Math.floor(kanjiFontSize * (W - 120) / kanjiMeasure);
            ctx.font = `${kanjiFontSize}px 'Ma Shan Zheng', cursive`;
        }
        ctx.fillText(kanjiStr, W/2, 1255);
        ctx.restore();

        // ══════════════════════════════════════
        // RELIQUES EN ARC BAS — 9 SVG gardiens
        // remplacent les kodamas
        // ══════════════════════════════════════
        const bottomRelicSize = 88;
        const bottomY = 1390; // décalé vers le haut pour gap bande prénoms
        const totalWidth = W - 160;
        const step = totalWidth / 8;
        const bottomPromises = [];

        for (let i = 0; i < 9; i++) {
            const svgStr = getRelicSVG(i);
            if (!svgStr) continue;
            const bx = 80 + i * step;
            // Arc doux vers le bas
            const by = bottomY + Math.sin((i/8)*Math.PI) * 30;
            const tilt = (i - 4) * 0.07;
            const gColor = guardianData[i] ? guardianData[i].color : '#ffd700';
            const scale = i === 4 ? 1.15 : (i === 3 || i === 5 ? 1.05 : 1.0);
            const finalSize = bottomRelicSize * scale;
            // Halo gardien
            ctx.save(); ctx.globalAlpha = 0.45;
            const bg2 = ctx.createRadialGradient(bx, by, 4, bx, by, 52);
            bg2.addColorStop(0, gColor); bg2.addColorStop(1, 'transparent');
            ctx.fillStyle = bg2; ctx.fillRect(bx-52, by-52, 104, 104);
            ctx.restore();
            bottomPromises.push(drawSVG(svgStr, bx-finalSize/2, by-finalSize/2, finalSize, finalSize, tilt));
        }
        await Promise.all(bottomPromises);

        // Kanji sous chaque relique — Y adaptatif à la taille de la relique
        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.font = "18px 'Ma Shan Zheng', cursive";
        for (let i = 0; i < 9; i++) {
            const bx = 80 + i * step;
            const arcY = bottomY + Math.sin((i/8)*Math.PI) * 30;
            const sc2 = i === 4 ? 1.15 : (i === 3 || i === 5 ? 1.05 : 1.0);
            const halfSize = (bottomRelicSize * sc2) / 2;
            const by = arcY + halfSize + 6; // juste sous le bord bas de la relique
            const gColor = guardianData[i] ? guardianData[i].color : '#ffd700';
            ctx.fillStyle = gColor; ctx.globalAlpha = 0.78;
            ctx.fillText(guardianData[i].kanji || '', bx, by);
        }
        ctx.globalAlpha = 1; ctx.restore();

        // ══════════════════════════════════════
        // BANDE PRÉNOMS — adaptive 1 ou 2 lignes
        // ══════════════════════════════════════
        ctx.save();
        const byBand = 1572;
        const bwBand = W - 120;
        // Mesure du texte
        ctx.font = "28px 'Fredoka One', cursive";
        const namesStr = mikoNames.join(' ✦ ');
        const textW = ctx.measureText(namesStr).width;
        let line1, line2 = null;
        if (textW > bwBand - 20) {
            // Split en 2 lignes de 4
            const half = Math.ceil(mikoNames.length / 2);
            line1 = mikoNames.slice(0, half).join(' ✦ ');
            line2 = mikoNames.slice(half).join(' ✦ ');
        } else {
            line1 = namesStr;
        }
        const bandH = line2 ? 140 : 100;

        // Fond bande
        ctx.fillStyle = 'rgba(255,183,197,0.1)';
        ctx.beginPath(); ctx.roundRect(60, byBand, bwBand, bandH, 22); ctx.fill();
        ctx.strokeStyle = 'rgba(255,183,197,0.4)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(60, byBand, bwBand, bandH, 22); ctx.stroke();

        // Losanges décoratifs
        ctx.fillStyle = 'rgba(255,215,0,0.5)';
        [[60, byBand+bandH/2],[W-60, byBand+bandH/2]].forEach(([x,y]) => {
            ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
            ctx.fillRect(-6,-6,12,12); ctx.restore();
        });
        // Lignes décoratives
        ctx.strokeStyle = 'rgba(255,215,0,0.2)'; ctx.lineWidth = 1;
        ctx.setLineDash([4,8]);
        ctx.beginPath(); ctx.moveTo(80, byBand+8); ctx.lineTo(W-80, byBand+8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(80, byBand+bandH-8); ctx.lineTo(W-80, byBand+bandH-8); ctx.stroke();
        ctx.setLineDash([]);

        // Prénoms — chaque nom dans la couleur de son gardien
        ctx.textBaseline = 'middle';
        ctx.font = "28px 'Fredoka One', cursive"; ctx.shadowBlur = 0;
        const nameColors = ['#ffb7c5','#98e8d4','#fde68a','#c4b5fd','#fca5a5','#6ee7b7','#a5b4fc','#fdba74'];
        const separator = ' ✦ ';
        const sepW = ctx.measureText(separator).width;
        const drawColoredNames = (names, startIdx, centerY) => {
            // Calculer largeur totale
            const widths = names.map(n => ctx.measureText(n).width);
            const totalW = widths.reduce((a,b)=>a+b,0) + sepW*(names.length-1);
            let cx = W/2 - totalW/2;
            names.forEach((name, j) => {
                const idx = startIdx + j;
                ctx.fillStyle = nameColors[idx % nameColors.length];
                ctx.textAlign = 'left';
                ctx.fillText(name, cx, centerY);
                cx += widths[j];
                if (j < names.length - 1) {
                    ctx.fillStyle = 'rgba(255,215,0,0.6)';
                    ctx.fillText(separator, cx, centerY);
                    cx += sepW;
                }
            });
        };
        if (line2) {
            const half = Math.ceil(mikoNames.length / 2);
            drawColoredNames(mikoNames.slice(0, half), 0, byBand + 38);
            drawColoredNames(mikoNames.slice(half), half, byBand + 76);
        } else {
            drawColoredNames(mikoNames, 0, byBand + bandH*0.38);
        }

        // Phrase poétique — pas de timer
        ctx.fillStyle = '#ffd700'; ctx.font = "22px 'Fredoka One', cursive";
        ctx.shadowColor = 'rgba(255,215,0,0.4)'; ctx.shadowBlur = 8;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✦ Ce jour-là, huit courageuses ont réveillé neuf Nekos ✦', W/2, byBand + bandH - 22);
        ctx.shadowBlur = 0; ctx.restore();

        // ══════════════════════════════════════
        // ORNEMENTS COINS — 4 reliques icônes
        // ══════════════════════════════════════
        const cornerRelics = [
            { key:'ken',    x: 24, y: 24, angle: -Math.PI/5 },
            { key:'kitsune',x: W-104, y: 24, angle: Math.PI/5 },
            { key:'mochi',  x: 24, y: H-104, angle: Math.PI/5 },
            { key:'shogun', x: W-104, y: H-104, angle: -Math.PI/5 },
        ];
        // Offscreen canvas pour appliquer globalAlpha sur drawImage
        const drawSVGAlpha = async (svgStr, x, y, w, h, angle, alpha) => {
            const off = document.createElement('canvas');
            off.width = w * 2; off.height = h * 2;
            const offCtx = off.getContext('2d');
            // Dessiner sur offscreen sans alpha
            await new Promise(resolve => {
                const clean = svgStr.replace(/class="[^"]*"/g,'').replace(/<svg/,`<svg xmlns="http://www.w3.org/2000/svg"`).replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g,'').replace(/<svg/,'<svg xmlns="http://www.w3.org/2000/svg"');
                const blob = new Blob([clean],{type:'image/svg+xml'});
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    offCtx.save();
                    offCtx.translate(w, h);
                    if (angle) offCtx.rotate(angle);
                    offCtx.drawImage(img, -w, -h, w*2, h*2);
                    offCtx.restore();
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
                img.src = url;
            });
            // Composer sur le canvas principal avec alpha
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.drawImage(off, x, y, w, h);
            ctx.restore();
        };
        const cornerPs = [];
        for (const c of cornerRelics) {
            const svgStr = relicSVG[c.key];
            if (!svgStr) continue;
            cornerPs.push(drawSVGAlpha(svgStr, c.x, c.y, 80, 80, c.angle, 0.68));
        }
        await Promise.all(cornerPs);

        // ══════════════════════════════════════
        // TAMPON 九猫 — bas droite
        // ══════════════════════════════════════
        ctx.save();
        ctx.translate(W - 138, H - 158);
        ctx.rotate(-12 * Math.PI/180);
        // Ombre encre rouge (effet hanko)
        ctx.shadowColor = '#cc0000'; ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ff1493';
        ctx.beginPath(); ctx.roundRect(-70,-70,140,140,18); ctx.fill();
        ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        // Double bordure
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(-70,-70,140,140,18); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.roundRect(-62,-62,124,124,14); ctx.stroke();
        // Kanji
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = "bold 60px 'Ma Shan Zheng', cursive";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        // Texture encre hanko — légère irrégularité
        ctx.shadowColor = '#ff1493'; ctx.shadowBlur = 3;
        ctx.fillText('九', 0, -22); ctx.fillText('猫', 0, 34);
        ctx.shadowBlur = 0;
        // Petites éclaboussures d'encre
        ctx.fillStyle = 'rgba(255,20,147,0.35)';
        [[-52,-52,3],[-48,50,2],[50,-55,2.5],[55,48,3],[-30,-60,1.5],[40,60,2]].forEach(([tx,ty,tr]) => {
            ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI*2); ctx.fill();
        });
        ctx.restore();

        // Colophon date japonaise bas-gauche
        ctx.save();
        ctx.translate(96, H - 140);
        ctx.rotate(12 * Math.PI/180);
        ctx.globalAlpha = 0.55;
        const now = new Date();
        const reiwa = now.getFullYear() - 2018;
        const jpDate = `令和${reiwa}年${now.getMonth()+1}月${now.getDate()}日`;
        ctx.fillStyle = '#ffd700'; ctx.font = "22px 'Ma Shan Zheng', cursive";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(jpDate, 0, 0);
        ctx.restore();

        // ══════════════════════════════════════
        // TÉLÉCHARGEMENT + ÉCRAN CONFIRMATION
        // ══════════════════════════════════════
        playGameSFX('thud');
        if (navigator.vibrate) navigator.vibrate([200, 50, 300]);

        // Hanko slam pendant génération
        const hankoEl = document.createElement('div');
        hankoEl.className = 'hanko-slam'; hankoEl.innerHTML = '九<br>猫';
        hankoEl.style.cssText = 'position:fixed;top:50%;left:50%;z-index:9999;pointer-events:none;';
        document.body.appendChild(hankoEl);

        const dataUrl = canvas.toDataURL('image/png');

        // Téléchargement auto
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = 'Sanctuaire-des-9-Nekos.png';
            link.href = dataUrl;
            link.click();
            playGameSFX('pop');
        }, 800);

        // Écran de confirmation
        setTimeout(() => {
            if (hankoEl.parentNode) hankoEl.remove();

            const confirmScreen = document.createElement('div');
            confirmScreen.id = 'estampe-confirm';
            confirmScreen.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,0,15,0.92);opacity:0;transition:opacity 0.5s ease;gap:20px;';

            // Titre
            const title = document.createElement('p');
            title.style.cssText = "font-family:'Ma Shan Zheng',cursive;font-size:28px;color:#ffd700;text-shadow:0 0 15px #ffd700;margin:0;letter-spacing:2px;";
            title.textContent = '鏡の記憶';
            confirmScreen.appendChild(title);
            const titleFr = document.createElement('p');
            titleFr.style.cssText = "font-family:'Fredoka One',cursive;font-size:16px;color:rgba(255,183,197,0.8);margin:-12px 0 0 0;";
            titleFr.textContent = 'Le souvenir est scellé';
            confirmScreen.appendChild(titleFr);

            // Aperçu miniature
            const preview = document.createElement('img');
            preview.src = dataUrl;
            preview.style.cssText = 'width:min(180px,40vw);border-radius:12px;border:3px solid rgba(255,215,0,0.6);box-shadow:0 0 30px rgba(255,215,0,0.3),0 0 60px rgba(255,183,197,0.2);';
            confirmScreen.appendChild(preview);

            // Bouton continuer
            const btnOk = document.createElement('button');
            btnOk.className = 'btn-grad pulse-btn';
            btnOk.style.cssText = 'margin-top:8px;width:auto;padding:14px 28px;';
            btnOk.textContent = '🌸 Notre légende est scellée !';
            btnOk.onclick = () => {
                confirmScreen.style.opacity = '0';
                setTimeout(() => {
                    confirmScreen.remove();
                    // Continuer vers l'épilogue
                    const btnEpilogue = document.getElementById('btn-download');
                    if (btnEpilogue) { btnEpilogue.style.display = 'none'; }
                    if (typeof launchEpilogue === 'function') launchEpilogue();
                }, 500);
            };
            confirmScreen.appendChild(btnOk);

            // Bouton reprendre
            const btnRetake = document.createElement('button');
            btnRetake.style.cssText = "font-family:'Fredoka One',cursive;font-size:14px;color:rgba(161,196,253,0.8);background:none;border:1px solid rgba(161,196,253,0.3);border-radius:20px;padding:8px 20px;cursor:pointer;margin-top:-8px;";
            btnRetake.textContent = '✨ Saisir un autre reflet';
            btnRetake.onclick = () => {
                confirmScreen.style.opacity = '0';
                setTimeout(() => {
                    confirmScreen.remove();
                    window._mirrorSnapshot = null;
                    // Recréer le portail et relancer
                    const newPortal = document.createElement('div');
                    newPortal.className = 'mirror-portal';
                    document.body.appendChild(newPortal);
                    openMirrorAndCapture();
                }, 400);
            };
            confirmScreen.appendChild(btnRetake);

            document.body.appendChild(confirmScreen);
            requestAnimationFrame(() => { confirmScreen.style.opacity = '1'; });
        }, 1200);
    };

    render().catch(e => console.error('[Estampe]', e)).finally(() => { window._mirrorSnapshot = null; });
}

/* --- ACTE VI — ÉPILOGUE : LE BATEAU DES LANTERNES --- */
async function launchEpilogue() {
    if(audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    
    const sf = document.getElementById('final-story-box');
    const showFinalText = async (htmlStr, spokenJP, pause = 500) => { 
        sf.style.opacity = 0; sf.style.transform = 'translateY(20px)';
        await new Promise(r => setTimeout(r, 400)); 
        sf.innerHTML = htmlStr; sf.style.opacity = 1; sf.style.transform = "translateY(0)";
        await speakDucked(spokenJP, { rate: 0.78 });
        await new Promise(r => setTimeout(r, pause));
    };
    
    // Adieu du sage — voix seule
    sf.style.opacity = 0;
    await new Promise(r => setTimeout(r, 500));
    await speakDucked("さようなら…　小さな守護者たち。", { rate: 0.62 });
    await new Promise(r => setTimeout(r, 3000));
    
    document.getElementById('victory-cert').style.opacity = 0;
    document.getElementById('final-title').style.opacity = 0;
    document.getElementById('final-neko-hero').style.opacity = 0;
    document.getElementById('final-circ-nekos').style.opacity = 0;
    document.getElementById('btn-download').style.display = 'none';
    await new Promise(r => setTimeout(r, 1500));
    
    // Mood EPILOGUE — bleu nuit, pétales nacrés, koto solo
    currentMusicMood = null; // Reset guard
    if(window.setSakuraMood) window.setSakuraMood('EPILOGUE');
    setMusicMood('EPILOGUE');
    
    const boatScene = document.getElementById('scene-boat-final');
    boatScene.classList.add('active');
    
    const boat = document.getElementById('final-boat');
    boat.classList.add('sail-final');
    
    const mikoInitials = mikoNames.map(n => n.charAt(0));
    for(let i = 0; i < 8; i++) {
        const l = document.createElement('div'); l.className = 'final-lantern'; l.innerText = mikoInitials[i];
        l.style.left = (-35 - i * 30) + 'px'; l.style.bottom = '8px';
        l.style.animation = `bob ${2.5 + Math.random()}s infinite alternate ease-in-out`;
        l.style.animationDelay = (Math.random() * 2) + 's';
        boat.appendChild(l);
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await showFinalText("La nuit tombe sur le Sanctuaire... il est temps de quitter ce rivage.", "この岸を、　離れる時だ。", 1000);
    await showFinalText("Suivez les lanternes par-delà les brumes du temps.", "灯籠を、追いかけて。", 1000);
    
    // Dernier pétale
    const lastPetal = document.createElement('div');
    lastPetal.style.cssText = 'position:fixed;left:50%;top:-20px;width:12px;height:12px;background:#ffb7c5;border-radius:40% 60% 55% 45%;filter:drop-shadow(0 0 8px #ffb7c5);z-index:300;pointer-events:none;opacity:0.9;animation:last-petal-fall 8s ease-in forwards;';
    document.body.appendChild(lastPetal);
    
    await showFinalText("<span style='color:#D4AF37;'>Laissez la magie s'endormir... un festin vous attend sous le toit d'Ava.</span>", "アヴァの屋根の下で、　ご馳走が待つ。", 2000);
    
    // Fade to black
    await new Promise(r => setTimeout(r, 3000));
    sf.style.opacity = 0; boatScene.style.opacity = 0;
    if(window.setSakuraMood) window.setSakuraMood('FINAL');
    if(masterGain) { masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 4); }
    
    await new Promise(r => setTimeout(r, 4000));
    
    // Kanji 終 (Fin)
    const owari = document.createElement('div');
    owari.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);font-family:Ma Shan Zheng,cursive;font-size:100px;color:rgba(255,215,0,0.6);text-shadow:0 0 30px rgba(255,215,0,0.2);z-index:600;opacity:0;transition:opacity 2s ease;pointer-events:none;';
    owari.textContent = '終';
    document.body.appendChild(owari);
    setTimeout(() => { owari.style.opacity = 1; }, 100);
    await new Promise(r => setTimeout(r, 4000));
    owari.style.opacity = 0;
    await new Promise(r => setTimeout(r, 2000));
    owari.remove(); lastPetal.remove();
}
