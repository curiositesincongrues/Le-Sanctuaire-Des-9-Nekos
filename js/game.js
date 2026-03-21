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
        // --- C'EST ICI QU'ON AJOUTE L'APPEL ---
        initGummyPaws(); 
        
        transitionScreen('screen-oath', "✨");
        document.getElementById('oath-names').innerText = mikoNames.join(" • ");
        resizeConstellationCanvas();
    } else {
        document.getElementById(`rule-${currentRule}`).style.display = 'flex';
    }
}

/* --- CONSTELLATION / SERMENT : GUMMY PAWS & LASERS --- */
let lockedPaws = []; 
const pawColors = [
    "#ff69b4", "#00ffff", "#ffff00", "#98fb98", 
    "#e6e6fa", "#ffdab9", "#ff4500", "#191970"
];

function initGummyPaws() {
    const cBox = document.getElementById('constellation-box');
    if (!cBox) return; // Sécurité anti-crash
    
    cBox.innerHTML = ''; // Nettoyage total de la zone
    lockedPaws = [];
    const touchCountEl = document.getElementById('touch-count');
    if(touchCountEl) touchCountEl.innerText = "0";

    pawColors.forEach((color, index) => {
        const paw = document.createElement('div');
        paw.className = 'gummy-paw';
        paw.style.backgroundColor = color;
        paw.style.setProperty('--paw-color', color);
        paw.style.animationDelay = `${Math.random() * 2}s`;
        
        // Les coussinets en SVG par-dessus la couleur
        paw.innerHTML = `
            <svg viewBox="0 0 100 100" width="100%" height="100%" style="position:absolute; top:0; left:0; z-index:2; opacity:0.8; pointer-events:none;">
                <circle cx="50" cy="65" r="20" fill="rgba(0,0,0,0.15)"/>
                <circle cx="25" cy="35" r="10" fill="rgba(0,0,0,0.15)"/>
                <circle cx="45" cy="20" r="10" fill="rgba(0,0,0,0.15)"/>
                <circle cx="75" cy="35" r="10" fill="rgba(0,0,0,0.15)"/>
            </svg>
            <div class="paw-charge-ring"></div>
        `;

        const angle = (index / 8) * Math.PI * 2;
        const radius = 250;
        paw.style.position = 'absolute';
        paw.style.left = `calc(50% + ${Math.cos(angle) * radius}px - 30px)`;
        paw.style.top = `calc(50% + ${Math.sin(angle) * radius}px - 30px)`;
        paw.style.zIndex = "200";
        let holdTimer = null;
        let isLocked = false;

        const startHold = (e) => {
            if (e.cancelable) e.preventDefault();
            if (isLocked) return;

            paw.classList.add('holding');
            if(navigator.vibrate) navigator.vibrate(15);
            playGameSFX('beep', 440 + (index * 50)); 

            holdTimer = setTimeout(() => {
                isLocked = true;
                paw.classList.remove('holding');
                paw.classList.add('locked');
                
                playGameSFX('chime_portal'); 
                if(navigator.vibrate) navigator.vibrate([50, 30, 50]);

                lockedPaws.push(paw);
                if (touchCountEl) touchCountEl.innerText = lockedPaws.length;
                
                if (lockedPaws.length > 1) {
                    drawLaser(lockedPaws[lockedPaws.length - 2], paw);
                }

                if (lockedPaws.length >= 8 || (TEST_MODE && lockedPaws.length >= 1)) {
                    triggerSupernova();
                }
            }, 2000);
        };

        const cancelHold = (e) => {
            if (e.cancelable) e.preventDefault();
            if (isLocked) return; 
            clearTimeout(holdTimer);
            paw.classList.remove('holding');
        };

        paw.addEventListener('pointerdown', startHold);
        paw.addEventListener('pointerup', cancelHold);
        paw.addEventListener('pointercancel', cancelHold);
        paw.addEventListener('pointerleave', cancelHold);

        cBox.appendChild(paw);
    });
}

function drawLaser(pawA, pawB) {
    const cBox = document.getElementById('constellation-box');
    const rectA = pawA.getBoundingClientRect();
    const rectB = pawB.getBoundingClientRect();
    const boxRect = cBox.getBoundingClientRect();

    const x1 = rectA.left - boxRect.left + rectA.width / 2;
    const y1 = rectA.top - boxRect.top + rectA.height / 2;
    const x2 = rectB.left - boxRect.left + rectB.width / 2;
    const y2 = rectB.top - boxRect.top + rectB.height / 2;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const laser = document.createElement('div');
    laser.className = 'laser-beam';
    laser.style.left = `${x1}px`;
    laser.style.top = `${y1}px`;
    laser.style.width = '0px'; 
    laser.style.transform = `translateY(-50%) rotate(${angle}rad)`;
    laser.style.setProperty('--length', `${length}px`);

    cBox.appendChild(laser);
}

function triggerSupernova() {
    document.querySelectorAll('.gummy-paw').forEach(p => p.style.pointerEvents = 'none');
    document.querySelectorAll('.laser-beam').forEach(l => l.classList.add('super-blast'));
    
    const wave = document.createElement('div');
    wave.className = 'supernova-wave';
    const cBox = document.getElementById('constellation-box');
    if (cBox) cBox.appendChild(wave);

    playGameSFX('sword'); 
    if(navigator.vibrate) navigator.vibrate([100, 50, 200, 100, 300]);

    confetti({ 
        particleCount: 200, spread: 360, startVelocity: 40,
        colors: pawColors, origin: { x: 0.5, y: 0.5 } 
    });

    setTimeout(() => { 
        gameStartTime = Date.now(); 
        enterHub(); 
    }, 2000);
}
/* --- HUB --- */
function updateHeartBeat() {
    hubTimer++;
    const heart = document.getElementById('shadow-heart');
    if (!heart) return;
    
    const beatSpeed = Math.max(0.2, 1 - (hubTimer / 60)); 
    const scale = 1 + (hubTimer / 100);
    heart.style.animation = `pulse-core ${beatSpeed}s infinite alternate`;
    heart.style.transform = `scale(${scale})`;
    
    document.documentElement.style.setProperty('--darkness', 0); 
    
    // On ne joue le son que si nécessaire, et on évite de saturer le vibreur
    if(hubTimer % Math.ceil(beatSpeed*2) === 0) {
        playGameSFX('heartbeat'); 
        // Note: Si ça vibre encore, c'est dans audio.js qu'il faut couper !
    }
}

function enterHub() {
    transitionScreen('screen-hub');
    
    const grid = document.getElementById('grid-nekos'); grid.innerHTML = "";
    guardianData.forEach((g, i) => { 
        let isUnlocked = i < currentFound;
        const svgIcon = getRelicSVG(i);
        grid.innerHTML += `<div id="slot-${i}" class="slot ${isUnlocked ? 'unlocked' : 'locked'}" onclick="handleSlotClick(${i})">${svgIcon}</div>`; 
    });
    document.getElementById('found-count').innerText = currentFound;
    document.getElementById('hub-progress-bar').style.width = (currentFound / 9 * 100) + "%";

    updateMikoBelt();
    document.getElementById('miko-belt').classList.add('visible');

    updateDynamicMusic(); document.documentElement.style.setProperty('--bg-lightness', (10 + (currentFound * 8)) + '%');
    hubTimer = 0; document.documentElement.style.setProperty('--darkness', 0); document.getElementById('shadow-heart').style.transform = `scale(1)`;
    if(heartInterval) clearInterval(heartInterval); heartInterval = setInterval(updateHeartBeat, 1000);
    if(!window.needleInterval) window.needleInterval = setInterval(() => { if(!hasGyro) document.getElementById('needle-gold').style.transform=`rotate(${Math.sin(Date.now()/500)*35}deg)`; }, 50);
}

function updateMikoBelt() {
    const belt = document.getElementById('miko-belt');
    belt.innerHTML = '';
    guardianData.forEach((g, i) => {
        const isFilled = i < currentFound;
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
    const isFilled = index < currentFound;
    
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
    if(idx === currentFound) { clearInterval(heartInterval); startScan(); } 
    else if (idx < currentFound) { showBeltTooltip(document.getElementById(`slot-${idx}`), idx); }
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
    document.getElementById('scan-status').textContent = 'Approchez le miroir du sceau...';
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
                
                if(decodedText === guardianData[currentFound].qr) {
                    circle.classList.remove('scan-active');
                    circle.classList.add('scan-success');
                    
                    playGameSFX('pop'); playMikoChime(currentFound);
                    if(navigator.vibrate) navigator.vibrate([50, 30, 100]);
                    
                    const result = document.getElementById('scan-result');
                    document.getElementById('scan-result-icon').textContent = guardianData[currentFound].e;
                    document.getElementById('scan-result-text').textContent = `${guardianData[currentFound].n} trouvé !`;
                    result.style.display = 'block';
                    document.getElementById('scan-status').textContent = '✦ Sceau déchiffré ! ✦';
                    
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
    
    speakDuckedFire(g.q, { volume: 0.5 });

    quizFuseTime = 100; 
    const fuseBar = document.getElementById('fuse-bar');
    const incenseTip = document.getElementById('incense-tip');
    fuseBar.setAttribute('width', '300');
    let hintGiven1 = false, hintGiven2 = false;
    
    if(quizInterval) clearInterval(quizInterval);
    
    function quizTick() {
        quizFuseTime -= 1; 
        const w = Math.max(quizFuseTime * 3, 0);
        fuseBar.setAttribute('width', w);
        if(incenseTip) incenseTip.setAttribute('cx', w);
        
        if(quizFuseTime <= 50 && !hintGiven1) {
            hintGiven1 = true;
            const hint1 = document.createElement('div');
            hint1.className = 'quiz-hint';
            hint1.innerHTML = '🌿 <i>Un esprit murmure...</i>';
            document.getElementById('quiz-options').before(hint1);
        }
        if(quizFuseTime <= 20 && !hintGiven2) {
            hintGiven2 = true;
            const correctIdx = guardianData[currentFound].r;
            const correctOpt = document.getElementById(`opt-${correctIdx}`);
            if(correctOpt) correctOpt.style.borderColor = 'rgba(255,215,0,0.4)';
        }
        
        if(quizFuseTime <= 0) { 
            // Temps écoulé ! On secoue et on redonne une chance avec le temps réinitialisé
            playWrong();
            document.body.classList.add('shake-screen');
            setTimeout(() => document.body.classList.remove('shake-screen'), 500);
            quizFuseTime = 100; 
        }
    }
    
    quizInterval = setInterval(quizTick, 100);
}

function verifyQuiz(idx) {
    if(idx === guardianData[currentFound].r) { 
        clearInterval(quizInterval); window.speechSynthesis.cancel();
        playCorrect(); confetti({ particleCount: 50, colors: ['#ffd700', '#ffb7c5', '#ffffff'] }); 
        setTimeout(() => playMinigame(), 500); 
    } 
    else { 
        // FIX MAUVAISE RÉPONSE : Pénalité de temps au lieu de l'Oni
        document.getElementById(`opt-${idx}`).classList.add('broken'); 
        playWrong(); 
        document.body.classList.add('shake-screen'); 
        setTimeout(() => document.body.classList.remove('shake-screen'), 500); 
        quizFuseTime -= 25; // Perte de temps
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}

/* --- MINIJEUX --- */
function playMinigame() {
    const g = guardianData[currentFound];
    transitionScreen('screen-game');
    
    document.getElementById('target-name').innerText = g.n; document.getElementById('game-instr').innerText = g.instr;
    const arena = document.getElementById('game-arena'); arena.innerHTML=`<div id="game-target" class="game-target-svg">${getRelicSVG(currentFound)}</div>`;
    const target = document.getElementById('game-target');
    document.getElementById('progress-container').style.display='block'; document.getElementById('progress-bar').style.width="0%";
    
    let score=0; let timer; let isGameActive = true; 
    const updateP = (s, goal) => { if(!isGameActive) return; let p=Math.min((s/goal)*100, 100); document.getElementById('progress-bar').style.width=p+"%"; if(p>=100) { isGameActive = false; clearInterval(timer); winGame(); } };

    if(g.type === "hold") { const startH=(e)=>{if(e.cancelable) e.preventDefault(); timer=setInterval(()=>{score+=2; playGameSFX('pop'); if(navigator.vibrate) navigator.vibrate(10); updateP(score, 100);},50);}; const endH=()=>clearInterval(timer); target.onmousedown=startH; target.onmouseup=endH; target.ontouchstart=startH; target.ontouchend=endH; }
    else if(g.type === "rhythm") { timer=setInterval(()=>{target.style.transform="scale(1.5)"; target.dataset.r="1"; setTimeout(()=>{target.style.transform="scale(1)"; target.dataset.r="0";},400);},1000); target.onclick=()=>{if(target.dataset.r==="1"){score++; playGameSFX('sword'); if(navigator.vibrate) navigator.vibrate([20, 20]); updateP(score, 5);}}; }
    else if(g.type === "catch") { target.classList.add('catch-target'); timer=setInterval(()=>{const tx=(Math.random()*120-60); const ty=(Math.random()*120-60); target.style.transform=`translate(${tx}px, ${ty}px)`; playGameSFX('woosh');},350); target.onclick=()=>{score++; playCorrect(); if(navigator.vibrate) navigator.vibrate(50); updateP(score, 5);}; }
    else if(g.type === "swipe") { let startX=0; target.ontouchstart=(e)=>startX=e.touches[0].clientX; target.ontouchend=(e)=>{if(Math.abs(e.changedTouches[0].clientX-startX)>50){score++; playGameSFX('woosh'); updateP(score, 5);}}; target.onclick=()=>{score++; playGameSFX('woosh'); updateP(score, 5);}; }
    else if(g.type === "shake") { if (window.DeviceMotionEvent) window.ondevicemotion=(e)=>{if(Math.abs(e.acceleration.x)>15 || Math.abs(e.acceleration.y)>15){score++; playMikoChime(Math.floor(Math.random()*8)); if(navigator.vibrate) navigator.vibrate(10); updateP(score, 50);}}; target.onclick=()=>{score+=5; playMikoChime(Math.floor(Math.random()*8)); updateP(score, 50);}; }
    else if(g.type === "scratch") {
        // Encre maudite — frotter pour révéler le masque (FIX POUR PIXEL 9A)
        target.style.width = '160px'; target.style.height = '160px'; target.style.position = 'relative'; target.style.cursor = 'crosshair';
        target.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:1;">${getRelicSVG(currentFound)}</div><canvas id="scratch-canvas" style="position:absolute;inset:0;z-index:2;border-radius:12px;cursor:crosshair;" width="160" height="160"></canvas>`;
        const scratchCvs = document.getElementById('scratch-canvas');
        const sCtx = scratchCvs.getContext('2d');
        
        sCtx.fillStyle = '#0a0510'; sCtx.fillRect(0, 0, 160, 160);
        sCtx.fillStyle = 'rgba(255,215,0,0.3)'; sCtx.font = '16px "Fredoka One"'; sCtx.textAlign = 'center';
        sCtx.fillText('Frottez ici', 80, 85);
        
        sCtx.globalCompositeOperation = 'destination-out';
        let scratching = false;
        let scratchFinished = false; 
        
        const scratchAt = (x, y) => {
            if (scratchFinished) return;
            sCtx.beginPath(); sCtx.arc(x, y, 25, 0, Math.PI * 2); sCtx.fill(); 
            
            // Échantillonnage : 1 pixel sur 4 (Saut de 16 dans le tableau RGBA)
            const imgData = sCtx.getImageData(0, 0, 160, 160).data;
            let transparent = 0;
            for(let i = 3; i < imgData.length; i += 16) { 
                if(imgData[i] < 10) transparent++; 
            }
            
            const totalSamples = imgData.length / 16;
            score = Math.floor((transparent / totalSamples) * 100);
            updateP(score, 70); 
            
if(score >= 70) {
    scratchFinished = true;
    scratchCvs.style.pointerEvents = 'none'; 
    scratchCvs.style.transition = 'opacity 0.4s ease';
    scratchCvs.style.opacity = '0';
    if(navigator.vibrate) navigator.vibrate(30);
    playGameSFX('pop');
} else {
                if(navigator.vibrate) navigator.vibrate(10);
            }
        };
        const getPos = (e) => {
            const rect = scratchCvs.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            return { x: (touch.clientX - rect.left) * (160 / rect.width), y: (touch.clientY - rect.top) * (160 / rect.height) };
        };
        scratchCvs.onmousedown = scratchCvs.ontouchstart = (e) => { e.preventDefault(); scratching = true; const p = getPos(e); scratchAt(p.x, p.y); };
        scratchCvs.onmousemove = scratchCvs.ontouchmove = (e) => { if(!scratching) return; e.preventDefault(); const p = getPos(e); scratchAt(p.x, p.y); };
        scratchCvs.onmouseup = scratchCvs.ontouchend = () => { scratching = false; };
    }
    else if(g.type === "mash") { target.onclick=()=>{ score++; playGameSFX('thud'); document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 50); if(navigator.vibrate) navigator.vibrate([50]); updateP(score, 30);}; }
    else if(g.type === "statue") { target.style.opacity=0.5; playGameSFX('zen'); timer=setTimeout(()=>{ updateP(1,1); },4000); document.body.ontouchstart=()=>{clearTimeout(timer); playGameSFX('zen'); timer=setTimeout(()=>{updateP(1,1);},4000);}; }
    else if(g.type === "drum") { arena.innerHTML=`<div style="display:flex;"><div class="drum-btn" id="btn-G">G</div><div class="drum-btn" id="btn-D">D</div></div>`; let last=""; document.getElementById('btn-G').onclick=()=>{if(last!=="G"){score++; last="G"; playGameSFX('drum_g'); if(navigator.vibrate) navigator.vibrate(40); updateP(score, 10);}}; document.getElementById('btn-D').onclick=()=>{if(last!=="D"){score++; last="D"; playGameSFX('drum_d'); if(navigator.vibrate) navigator.vibrate(40); updateP(score, 10);}}; }
    else if(g.type === "memory") { 
        const seqIdx=[0,4,0,8]; let userSeq=[]; target.innerHTML='<span style="font-size:20px;color:var(--sakura);">Regarde...</span>'; 
        setTimeout(()=>{target.innerHTML=getRelicSVG(0); playGameSFX('beep', 440);},1000); 
        setTimeout(()=>{target.innerHTML=getRelicSVG(4); playGameSFX('beep', 554);},2000); 
        setTimeout(()=>{target.innerHTML=getRelicSVG(0); playGameSFX('beep', 440);},3000); 
        setTimeout(()=>{target.innerHTML=getRelicSVG(8); playGameSFX('beep', 659);},4000); 
        setTimeout(()=>{ 
            arena.innerHTML=`<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;">
                <div class="mem-btn mem-btn-svg" onclick="mem(0)">${getRelicSVG(0)}</div>
                <div class="mem-btn mem-btn-svg" onclick="mem(4)">${getRelicSVG(4)}</div>
                <div class="mem-btn mem-btn-svg" onclick="mem(8)">${getRelicSVG(8)}</div></div>`; 
            window.mem=(s)=>{userSeq.push(s); playGameSFX('beep', 880); 
                if(userSeq[userSeq.length-1]!==seqIdx[userSeq.length-1]){userSeq=[]; document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 500); playWrong(); userSeq=[]; target.innerHTML='<span style="font-size:20px;color:var(--oni);">Erreur !</span>'; setTimeout(() => { target.innerHTML='<span style="font-size:20px;color:var(--sakura);">Regarde...</span>'; playMinigame(); }, 1000); } 
                else {score++; updateP(score, 4); playCorrect();}}; 
        },5000); }
    
    else if(g.type === "mic") {
        document.getElementById('mic-gauge').style.display = 'block';
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            micStream = stream; micContext = new (window.AudioContext || window.webkitAudioContext)();
            micAnalyser = micContext.createAnalyser(); micAnalyser.fftSize = 256;
            const source = micContext.createMediaStreamSource(stream); source.connect(micAnalyser);
            const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
            function checkAudio() {
                if(!isGameActive) return;
                micAnalyser.getByteFrequencyData(dataArray);
                let sum = 0; for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
                let avg = sum / dataArray.length;
                document.getElementById('mic-level').style.height = Math.min(avg, 100) + '%';
                if(avg > 50) { score+=1; updateP(score, 50); if(navigator.vibrate) navigator.vibrate(10); }
                micLoop = requestAnimationFrame(checkAudio);
            } checkAudio();
        }).catch(err => {
            document.getElementById('mic-gauge').style.display = 'none';
            document.getElementById('game-instr').innerText = "Micro refusé ! Glissez le doigt à la place !";
            let startX=0; target.ontouchstart=(e)=>startX=e.touches[0].clientX; target.ontouchend=(e)=>{if(Math.abs(e.changedTouches[0].clientX-startX)>50){score++; playGameSFX('woosh'); updateP(score, 5);}}; target.onclick=()=>{score++; playGameSFX('woosh'); updateP(score, 5);};
        });
    }
}

/* --- WIN / SOUL ANIMATION --- */
let isWinning = false; // Verrou de sécurité global

function winGame() {
    if (isWinning) return; // Si on est déjà en train de gagner, on ignore les autres appels
    isWinning = true;

    const wonIndex = currentFound; 
    currentFound++; 
    
    // Nettoyage des événements globaux
    window.ondevicemotion = null; 
    document.body.ontouchstart = null; 
    window.speechSynthesis.cancel();
    
    if(micStream) { 
        micStream.getTracks().forEach(t => t.stop()); 
        cancelAnimationFrame(micLoop); 
        document.getElementById('mic-gauge').style.display = 'none'; 
    }
    
    const arena = document.getElementById('game-arena');
    arena.innerHTML = `<div class="win-relic-icon">${getRelicSVG(wonIndex)}</div>`; 
    document.getElementById('game-instr').innerText = "RÉUSSI !";

    setTimeout(() => { 
        isWinning = false; // On libère le verrou pour le prochain jeu
        if(currentFound >= 9) launchFinalCinematic(); 
        else animateSoulToHub(wonIndex); 
    }, 1500);
}

function animateSoulToHub(idx) {
    transitionScreen('screen-hub');
    document.getElementById('miko-belt').classList.add('visible');
    setTimeout(() => {
        const grid = document.getElementById('grid-nekos'); grid.innerHTML = "";
        guardianData.forEach((g, i) => { 
            let isUnlocked = i < currentFound - 1;
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
                document.getElementById('found-count').innerText = currentFound; document.getElementById('hub-progress-bar').style.width = (currentFound / 9 * 100) + "%";
                document.documentElement.style.setProperty('--bg-lightness', (10 + (currentFound * 8)) + '%'); updateDynamicMusic();
                hubTimer = 0; document.documentElement.style.setProperty('--darkness', 0);
                if(heartInterval) clearInterval(heartInterval); heartInterval = setInterval(updateHeartBeat, 1000);
                updateMikoBelt();
                setTimeout(() => targetSlot.classList.remove('just-unlocked'), 700);
            }, 1000);
        }, 100);
    }, 600);
}

/* --- CINÉMATIQUE FINALE — L'AUBE DE NACRE --- */
async function launchFinalCinematic() {
    transitionScreen('screen-final', "✨");
    const fs = document.getElementById('final-circ-nekos');
    
    document.getElementById('sky-background').style.opacity = 1; 
    document.getElementById('flash').style.opacity = 1; if(window.setSakuraMood) window.setSakuraMood('FINAL');
    if(navigator.vibrate) navigator.vibrate([200, 50, 200, 50, 200]);
    setTimeout(() => { document.getElementById('flash').style.opacity = 0; document.getElementById('flash').style.background = 'transparent'; }, 200);
    setTimeout(() => { document.getElementById('final-title').style.opacity = 1; document.getElementById('final-title').style.transform = "translateY(0)"; }, 1000);

    await new Promise(r => setTimeout(r, 1500));
    if(audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    
    const sf = document.getElementById('final-story-box');
    const showFinalText = async (htmlStr, spokenJP, pause = 500) => { 
        sf.style.opacity = 0; sf.style.transform = 'translateY(20px)';
        await new Promise(r => setTimeout(r, 400)); 
        sf.innerHTML = htmlStr; sf.style.opacity = 1; sf.style.transform = 'translateY(0)';
        await speakDucked(spokenJP, { rate: 0.9, volume: 0.9 });
        await new Promise(r => setTimeout(r, pause));
    };
    sf.style.transition = "opacity 0.5s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)";
    
    /* ═══ ACTE I — L'EXORCISME ═══ */
    await showFinalText("Les 9 Gardiens sont réunis.", "Kokonotsu no shugosha ga soroita.");
    await showFinalText("L'Ombre se dresse une dernière fois.", "Kage ga saigo ni tatsu.");
    await showFinalText("Mais la magie des héroïnes est plus forte !", "Hiroin no chikara ga masaru!");

    for(let i=0; i<mikoNames.length; i++) {
        const el = document.createElement('div'); el.className='final-node falling-star'; el.innerText = mikoNames[i];
        const rad = (i/mikoNames.length)*Math.PI*2;
        el.style.left = (150 + Math.cos(rad)*140 - 30) + "px"; el.style.top = (150 + Math.sin(rad)*140 - 45) + "px";
        el.style.animationDelay = (i * 0.3) + 's';
        fs.appendChild(el);
        setTimeout(() => { playMikoChime(i); }, i*300);
    }
    await new Promise(r => setTimeout(r, mikoNames.length*300 + 1500));
    
    const nodes = document.querySelectorAll('.final-node');
    nodes.forEach((node, i) => {
        setTimeout(() => {
            node.style.color = "var(--gold)"; node.style.textShadow = "0 0 20px var(--gold)";
            const rad = (i/mikoNames.length)*Math.PI*2;
            let laser = document.createElement('div'); laser.className = 'laser-beam';
            laser.style.left = (150 + Math.cos(rad)*140) + "px"; laser.style.top = (150 + Math.sin(rad)*140) + "px";
            laser.style.transform = `rotate(${rad + Math.PI}rad)`; laser.style.setProperty('--length', '140px');
            fs.appendChild(laser); playGameSFX('sword'); if(navigator.vibrate) navigator.vibrate(50);
        }, i * 200);
    });
    await new Promise(r => setTimeout(r, nodes.length*200 + 500));

    // COUPE MUSICALE
    if(masterGain) { masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime); masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3); }
    await new Promise(r => setTimeout(r, 800));
    
    // Countdown kanji
    playGameSFX('heartbeat');
    const countdown = document.createElement('div');
    countdown.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:Ma Shan Zheng,cursive;font-size:120px;color:rgba(193,240,193,0.8);text-shadow:0 0 40px #c1f0c1;z-index:500;opacity:0;transition:all 0.8s ease;pointer-events:none;';
    fs.appendChild(countdown);
    
    for(const kanji of ['三', '二', '一']) {
        countdown.textContent = kanji; countdown.style.opacity = 1; countdown.style.transform = 'translate(-50%,-50%) scale(1)';
        await new Promise(r => setTimeout(r, 300));
        countdown.style.opacity = 0; countdown.style.transform = 'translate(-50%,-50%) scale(2)';
        await new Promise(r => setTimeout(r, 700));
        playGameSFX('heartbeat');
    }
    countdown.remove();

    // DISSOLUTION
    const daruma = document.getElementById('final-daruma');
    daruma.classList.add('dissolving');
    playThunder(); if(navigator.vibrate) navigator.vibrate([300, 100, 400]);
    await new Promise(r => setTimeout(r, 3000));
    
    // Flash blanc + EXPLOSION DE SAKURA
    document.getElementById('flash').style.background = 'white'; document.getElementById('flash').style.opacity = 1;
    daruma.style.display = 'none';
    nodes.forEach(n => n.style.opacity = 0);
    confetti({ particleCount: 150, spread: 360, startVelocity: 45, gravity: 0.6, colors: ['#ffb7c5', '#ffd700', '#ffffff', '#ff69b4'], origin: {x: 0.5, y: 0.5}, ticks: 100 });
    
    /* ═══ ACTE II — SILENCE SACRÉ + KANJI 光 ═══ */
    if(window.setSakuraMood) window.setSakuraMood('AUBE');
    
    const hikari = document.createElement('div');
    hikari.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:Ma Shan Zheng,cursive;font-size:180px;color:rgba(255,215,0,0.8);text-shadow:0 0 60px rgba(255,215,0,0.4),0 0 120px rgba(255,200,0,0.2);z-index:500;opacity:0;transition:opacity 1.5s ease;pointer-events:none;';
    hikari.textContent = '光';
    fs.appendChild(hikari);
    
    setTimeout(() => { document.getElementById('flash').style.opacity = 0; document.getElementById('flash').style.background = 'transparent'; }, 800);
    await new Promise(r => setTimeout(r, 1000));
    speakDuckedFire("Hikari...", { rate: 0.5, pitch: 0.4, volume: 0.8 });
    hikari.style.opacity = 1;
    await new Promise(r => setTimeout(r, 3000));
    hikari.style.opacity = 0;
    await new Promise(r => setTimeout(r, 1500));
    hikari.remove();
    
    /* ═══ ACTE III — LE NEKO SUPRÊME ═══ */
    // FIX AUDIO : forcer la reprise
    if(audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    currentMusicMood = null; // Reset le guard pour forcer setMusicMood
    if(masterGain) { 
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 2);
    }
    setMusicMood('VICTOIRE');
    if(window.setSakuraMood) window.setSakuraMood('VICTOIRE');
    
    // 2. CASCADE DE CHIMES (carillon magique qui s'éveille)
    const chimeNotes = [261.63, 293.66, 349.23, 392, 440, 523.25, 587.33, 698.46];
    chimeNotes.forEach((freq, i) => {
        setTimeout(() => { playMikoChime(i); }, i * 180);
    });
    
    // 7. VIBRATION VICTOIRE (petite fanfare tactile)
    if(navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50, 100, 150]);
    
    const nekoHero = document.getElementById('final-neko-hero');
    nekoHero.classList.add('divine-rise');
    await new Promise(r => setTimeout(r, 2500));
    
    // 3. PLUIE D'ÉTOILES DORÉES (pendant les textes de victoire)
    let starRainInterval = setInterval(() => {
        const star = document.createElement('div');
        star.className = 'golden-star';
        star.textContent = '✦';
        star.style.left = (Math.random() * 90 + 5) + 'vw';
        star.style.top = '-20px';
        star.style.animationDuration = (2.5 + Math.random() * 2) + 's';
        star.style.fontSize = (10 + Math.random() * 10) + 'px';
        document.body.appendChild(star);
        setTimeout(() => star.remove(), 5000);
    }, 300);
    
    await showFinalText("<span style='color:white;'>La lumière brille à nouveau sur Neko-Jinja.</span>", "Hikari ga futatabi terasu.");
    
    // Cœurs flottants quand on parle d'amitié
    await showFinalText("Votre amitié a purifié l'Ombre.", "Yūjō ga kage o kiyometa.");
    for(let i = 0; i < 12; i++) {
        const heart = document.createElement('div');
        heart.className = 'golden-star';
        heart.textContent = '♥';
        heart.style.left = (30 + Math.random() * 40) + 'vw';
        heart.style.top = '60vh';
        heart.style.color = '#ffb7c5';
        heart.style.textShadow = '0 0 8px rgba(255,183,197,0.6)';
        heart.style.fontSize = (14 + Math.random() * 12) + 'px';
        heart.style.animation = `star-rain ${2 + Math.random() * 2}s ease-out forwards reverse`;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 4000);
    }
    
    await showFinalText("Les Gardiens vous remercient pour votre courage.", "Shugosha-tachi ga kansha suru.");
    await showFinalText("Le parchemin a scellé votre victoire.", "Shōri wa fūin sareta.");
    
    clearInterval(starRainInterval);

    /* ═══ ACTE IV — LE PARCHEMIN SACRÉ ═══ */
    let elapsedMs = Date.now() - gameStartTime; let mins = Math.floor(elapsedMs / 60000); let secs = Math.floor((elapsedMs % 60000) / 1000);
    document.getElementById('cert-time').innerText = `${mins} min et ${secs} sec`;
    
    // Burst de confettis sakura à l'apparition du certificat
    confetti({ particleCount: 100, spread: 70, colors: ['#ffd700', '#ffb7c5', '#ffffff'], origin: {y: 0.6} });
    
    const cert = document.getElementById('victory-cert'); cert.style.display = 'block';
    cert.style.transform = 'translateY(-100%) scale(0.9)';
    cert.style.transition = '1.5s cubic-bezier(0.17, 0.89, 0.32, 1.28)';
    setTimeout(() => { cert.style.transform = 'translateY(0) scale(1)'; }, 100);

    const ivConf = setInterval(() => confetti({ particleCount: 30, colors: ['#ffd700', '#ffb7c5', '#ffffff'], origin: { y: 0.8 } }), 1500);
    confetti({ particleCount: 200, colors: ['#ffd700', '#ffb7c5', '#ffffff'], origin: {y: 0.8} }); 
    if(navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
    
    /* ═══ ACTE V — LE MIROIR DES ESPRITS ═══ */
    await showFinalText("<span style='font-size:24px;'>Scellez cette légende dans le Miroir.</span>", "Densetsu o kagami ni fūin seyo.");
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        document.getElementById('mirror-cam').srcObject = stream;
        document.getElementById('selfie-container').style.display = 'block';
        document.getElementById('selfie-cam').srcObject = stream;
    } catch(e) {}

    document.getElementById('btn-download').style.display = "block"; 
    setTimeout(() => document.getElementById('btn-download').style.transform = "scale(1)", 100);
    
    await new Promise(r => setTimeout(r, 2000));
    await showFinalText("<span style='font-size:22px;'>Que cette estampe témoigne de votre bravoure.</span>", "Kono e ga yūki no akashi to nare.");
    setTimeout(() => clearInterval(ivConf), 8000);
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

/* roundRect polyfill for older mobile browsers */
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        const [tl, tr, br, bl] = r;
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y); this.arcTo(x + w, y, x + w, y + tr, tr);
        this.lineTo(x + w, y + h - br); this.arcTo(x + w, y + h, x + w - br, y + h, br);
        this.lineTo(x + bl, y + h); this.arcTo(x, y + h, x, y + h - bl, bl);
        this.lineTo(x, y + tl); this.arcTo(x, y, x + tl, y, tl);
        this.closePath(); return this;
    };
}

/* --- CAPTURE ESTAMPE — Purikura Souvenir PNG --- */
function captureEstampe() {
    document.getElementById('flash').style.background = 'white'; 
    document.getElementById('flash').style.opacity = 1;
    setTimeout(() => { document.getElementById('flash').style.opacity = 0; document.getElementById('flash').style.background = 'transparent'; }, 600);
    if(navigator.vibrate) navigator.vibrate([100, 50, 200]);
    playGameSFX('thud');
    
    const video = document.getElementById('mirror-cam');
    const canvas = document.getElementById('polaroid-canvas');
    const ctx = canvas.getContext('2d');
    const W = 1200, H = 1600;
    canvas.width = W; canvas.height = H;
    
    /* --- Layer 0: Purikura gradient background + polka dots --- */
    const bgGrad = ctx.createRadialGradient(W/2, H*0.38, 100, W/2, H*0.38, W);
    bgGrad.addColorStop(0, '#ffe0f0');
    bgGrad.addColorStop(0.5, '#ffc0e0');
    bgGrad.addColorStop(1, '#d060a0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Polka dots
    ctx.globalAlpha = 0.08;
    for(let y = 0; y < H; y += 40) {
        for(let x = (y % 80 === 0 ? 0 : 20); x < W; x += 40) {
            ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
    // Scatter sparkles
    for(let i = 0; i < 80; i++) {
        const sx = Math.random() * W, sy = Math.random() * H;
        const sr = Math.random() * 4 + 1;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    
    /* --- Layer 1: GIANT SQUARE photo — 75% canvas width --- */
    const photoSize = Math.round(W * 0.75); // 900px
    const photoX = (W - photoSize) / 2;     // 150px
    const photoY = 100;
    const borderW = 10;
    
    // Outer neon pink glow
    ctx.save();
    ctx.shadowColor = '#ff69b4'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(photoX - borderW, photoY - borderW, photoSize + borderW*2, photoSize + borderW*2, 16);
    ctx.fill();
    ctx.restore();
    
    // White border (drawn as background behind clipped photo)
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(photoX - borderW, photoY - borderW, photoSize + borderW*2, photoSize + borderW*2, 16);
    ctx.fill();
    
    // Clip to photo area and draw mirrored video
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoSize, photoSize, 10);
    ctx.clip();
    
    if(video && video.videoWidth > 0) {
        const s = Math.min(video.videoWidth, video.videoHeight);
        ctx.filter = "brightness(1.12) contrast(1.05) saturate(1.25)";
        ctx.translate(photoX + photoSize, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 
            (video.videoWidth - s) / 2, (video.videoHeight - s) / 2, s, s, 
            0, photoY, photoSize, photoSize);
    } else {
        // Fallback if no camera: gradient placeholder
        const fallGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoSize, photoY + photoSize);
        fallGrad.addColorStop(0, '#8c3873'); fallGrad.addColorStop(1, '#5d1a4a');
        ctx.fillStyle = fallGrad;
        ctx.fillRect(photoX, photoY, photoSize, photoSize);
    }
    ctx.restore();
    
    /* --- Layer 2: 9 SVG relics around the photo edges --- */
    const relicSize = 70;
    const relicPositions = [];
    for(let i = 0; i < 9; i++) {
        // Distribute: 3 top, 3 bottom, 1 left-mid, 1 right-mid, 1 top-center offset
        let rx, ry;
        if(i < 3) { // Top row
            rx = photoX + (i + 0.5) * (photoSize / 3) - relicSize/2;
            ry = photoY - relicSize - 15;
        } else if(i < 6) { // Bottom row
            rx = photoX + ((i - 3) + 0.5) * (photoSize / 3) - relicSize/2;
            ry = photoY + photoSize + 15;
        } else if(i === 6) { // Left
            rx = photoX - relicSize - 15;
            ry = photoY + photoSize * 0.3;
        } else if(i === 7) { // Right
            rx = photoX + photoSize + 15;
            ry = photoY + photoSize * 0.5;
        } else { // Right-lower
            rx = photoX + photoSize + 15;
            ry = photoY + photoSize * 0.15;
        }
        relicPositions.push({ x: rx, y: ry });
    }
    
    // Render SVGs to canvas via Image + data URL
    let relicsDrawn = 0;
    const totalRelics = 9;
    
    function drawRelicAt(index, rx, ry) {
        const svgStr = getRelicSVG(index, relicSize);
        if(!svgStr) { relicsDrawn++; return; }
        // Fix SVG: inject width/height and xmlns
        const sized = svgStr.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${relicSize}" height="${relicSize}" `);
        const img = new Image();
        img.onload = function() {
            // Gummy drop shadow
            ctx.save();
            ctx.shadowColor = 'rgba(255,105,180,0.6)'; ctx.shadowBlur = 12;
            ctx.drawImage(img, rx, ry, relicSize, relicSize);
            ctx.restore();
            relicsDrawn++;
            if(relicsDrawn >= totalRelics) finishEstampe();
        };
        img.onerror = function() { relicsDrawn++; if(relicsDrawn >= totalRelics) finishEstampe(); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
    }
    
    relicPositions.forEach((pos, i) => drawRelicAt(i, pos.x, pos.y));
    
    // Safety timeout — if SVGs fail to load, finish anyway
    setTimeout(() => { if(relicsDrawn < totalRelics) { relicsDrawn = totalRelics; finishEstampe(); } }, 2000);
    
    function finishEstampe() {
        /* --- Layer 3: Title + Names --- */
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        
        // Title: "PACTE ACCOMPLI" with gummy shadow
        ctx.save();
        ctx.font = "bold 72px 'Fredoka One', cursive";
        ctx.shadowColor = 'rgba(255,105,180,0.7)'; ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
        ctx.fillText("PACTE ACCOMPLI", W/2, photoY + photoSize + relicSize + 70);
        ctx.restore();
        
        // Time — read from DOM to avoid desync
        const timeEl = document.getElementById('cert-time');
        const timeStr = timeEl ? timeEl.innerText : '';
        if(timeStr && timeStr !== '--') {
            ctx.font = "28px 'Fredoka One', cursive";
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(`Sanctuaire purifié en ${timeStr}`, W/2, photoY + photoSize + relicSize + 120);
        }
        
        // Player names with golden star separators
        ctx.save();
        ctx.font = "bold 26px 'Fredoka One', cursive";
        ctx.shadowColor = 'rgba(255,215,0,0.5)'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffd700';
        const nameStr = mikoNames.join(' ✨ ');
        ctx.fillText(nameStr, W/2, photoY + photoSize + relicSize + 175);
        ctx.restore();
        
        /* --- Layer 4: Neko Hanko (tilted red rounded square + cat silhouette) --- */
        ctx.save();
        ctx.translate(W - 140, H - 160);
        ctx.rotate(-12 * Math.PI / 180);
        
        // Red stamp background with gummy shadow
        ctx.shadowColor = 'rgba(183,28,28,0.5)'; ctx.shadowBlur = 15;
        ctx.fillStyle = '#c62828';
        ctx.beginPath(); ctx.roundRect(-55, -55, 110, 110, 12); ctx.fill();
        ctx.shadowBlur = 0;
        
        // Inner border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-48, -48, 96, 96, 8); ctx.stroke();
        
        // Cat silhouette (simplified maneki-neko shape — white on red)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        // Head
        ctx.ellipse(0, -12, 22, 20, 0, 0, Math.PI * 2); ctx.fill();
        // Left ear
        ctx.beginPath(); ctx.moveTo(-18, -26); ctx.lineTo(-26, -44); ctx.lineTo(-8, -30); ctx.fill();
        // Right ear
        ctx.beginPath(); ctx.moveTo(18, -26); ctx.lineTo(26, -44); ctx.lineTo(8, -30); ctx.fill();
        // Body
        ctx.beginPath(); ctx.ellipse(0, 18, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
        // Eyes (red on white)
        ctx.fillStyle = '#c62828';
        ctx.beginPath(); ctx.ellipse(-8, -14, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8, -14, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
        // Nose
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-3, -5); ctx.lineTo(3, -5); ctx.closePath(); ctx.fill();
        
        ctx.restore();
        
        // Hanko slam animation on screen
        const stamp = document.createElement('div'); stamp.className = 'hanko-slam'; stamp.innerHTML = '🐱';
        document.getElementById('mirror-overlay').appendChild(stamp);
        playGameSFX('thud'); if(navigator.vibrate) navigator.vibrate([200, 50, 300]);
        
        // Download
        setTimeout(() => { 
            const link = document.createElement('a'); 
            link.download = 'Estampe-des-Kami.png'; 
            link.href = canvas.toDataURL('image/png'); 
            link.click(); 
            playGameSFX('pop'); 
            stamp.remove(); 
        }, 800);
        setTimeout(() => { 
            document.getElementById('mirror-overlay').classList.remove('active'); 
            setTimeout(() => launchEpilogue(), 1500); 
        }, 2500);
    }
}

/* --- ACTE VI — ÉPILOGUE : LE BATEAU DES LANTERNES --- */
async function launchEpilogue() {
    if(audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    
    const sf = document.getElementById('final-story-box');
    const showFinalText = async (htmlStr, spokenJP, pause = 500) => { 
        sf.style.opacity = 0; sf.style.transform = 'translateY(20px)';
        await new Promise(r => setTimeout(r, 400)); 
        sf.innerHTML = htmlStr; sf.style.opacity = 1; sf.style.transform = 'translateY(0)';
        await speakDucked(spokenJP, { rate: 0.9, volume: 0.9 });
        await new Promise(r => setTimeout(r, pause));
    };
    
    // Adieu du sage — voix seule
    sf.style.opacity = 0;
    await new Promise(r => setTimeout(r, 500));
    await speakDucked("Sayonara... chiisana shugosha-tachi.", { rate: 0.6, pitch: 0.4, volume: 0.9 });
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
    await showFinalText("La nuit tombe sur le Sanctuaire... il est temps de quitter ce rivage.", "Kono kishi o hanareru toki da.", 1000);
    await showFinalText("Suivez les lanternes par-delà les brumes du temps.", "Tōrō o oikakete.", 1000);
    
    // Dernier pétale
    const lastPetal = document.createElement('div');
    lastPetal.style.cssText = 'position:fixed;left:50%;top:-20px;width:12px;height:12px;background:#ffb7c5;border-radius:40% 60% 55% 45%;filter:drop-shadow(0 0 8px #ffb7c5);z-index:300;pointer-events:none;opacity:0.9;animation:last-petal-fall 8s ease-in forwards;';
    document.body.appendChild(lastPetal);
    
    await showFinalText("<span style='color:#D4AF37;'>Laissez la magie s'endormir... un festin vous attend sous le toit d'Ava.</span>", "Ava no yane no shita de gochisō ga matsu.", 2000);
    
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
