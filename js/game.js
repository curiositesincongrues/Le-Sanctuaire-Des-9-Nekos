/* ============================================
   GAME.JS — Règles, Hub, Quiz, Minijeux, Final
   ============================================ */

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
        transitionScreen('screen-oath', "✨");
        document.getElementById('oath-names').innerText = mikoNames.join(" • ");
        resizeConstellationCanvas();
    } else {
        document.getElementById(`rule-${currentRule}`).style.display = 'flex';
    }
}

/* --- CONSTELLATION / SERMENT --- */
const runes = document.querySelectorAll('.rune-node');
let activeRunes = new Set();
const canvasLines = document.getElementById('constellation-lines');
const ctxLines = canvasLines ? canvasLines.getContext('2d') : null;

function resizeConstellationCanvas() {
    if(canvasLines) { canvasLines.width = document.getElementById('constellation-box').offsetWidth; canvasLines.height = document.getElementById('constellation-box').offsetHeight; }
}
window.addEventListener('resize', resizeConstellationCanvas);

function drawConstellation() {
    if(!ctxLines) return;
    ctxLines.clearRect(0, 0, canvasLines.width, canvasLines.height);
    if(activeRunes.size < 2) return;
    
    ctxLines.beginPath(); ctxLines.strokeStyle = "rgba(255, 215, 0, 0.8)"; ctxLines.lineWidth = 4;
    let first = true;
    activeRunes.forEach(rune => {
        const boxRect = document.getElementById('constellation-box').getBoundingClientRect();
        const rect = rune.getBoundingClientRect();
        const x = rect.left - boxRect.left + rect.width / 2;
        const y = rect.top - boxRect.top + rect.height / 2;
        if(first) { ctxLines.moveTo(x, y); first = false; } else { ctxLines.lineTo(x, y); }
    });
    ctxLines.closePath(); ctxLines.stroke(); ctxLines.fillStyle = "rgba(255, 183, 197, 0.3)"; ctxLines.fill();
}

runes.forEach((rune) => {
    const handlePointerDown = (e) => {
        e.preventDefault();
        if(!activeRunes.has(rune)) {
            activeRunes.add(rune); 
            rune.style.transform = "translate(-50%, -50%) scale(1.5)"; 
            rune.style.filter = "drop-shadow(0 0 20px var(--gold))";
            if(navigator.vibrate) navigator.vibrate(15); 
            playGameSFX('beep', 880 + (activeRunes.size * 50));
            document.getElementById('touch-count').innerText = activeRunes.size; 
            drawConstellation();
            
            if(activeRunes.size >= 8 || (TEST_MODE && activeRunes.size >= 1)) {
                runes.forEach(r => r.style.pointerEvents = 'none'); setTimeout(() => validateOath(), 500);
            }
        }
    };
    
    const handlePointerUp = (e) => {
        e.preventDefault(); 
        if (e.pointerType === 'mouse') return;

        activeRunes.delete(rune); 
        rune.style.transform = "translate(-50%, -50%) scale(1)"; 
        rune.style.filter = "none";
        document.getElementById('touch-count').innerText = activeRunes.size; 
        drawConstellation();
    };

    rune.addEventListener('pointerdown', handlePointerDown); 
    rune.addEventListener('pointerup', handlePointerUp); 
    rune.addEventListener('pointercancel', handlePointerUp); 
    rune.addEventListener('pointerleave', handlePointerUp);
});

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
    
    const u = new SpeechSynthesisUtterance(g.q); u.lang = "ja-JP"; u.volume = 0.5; window.speechSynthesis.speak(u);

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
                scratchCvs.style.pointerEvents = 'none'; // LIBÉRATION DU CLIC
                scratchCvs.style.transition = 'opacity 0.4s ease';
                scratchCvs.style.opacity = '0';
                if(navigator.vibrate) navigator.vibrate(30);
                playGameSFX('pop');
                setTimeout(() => winGame(), 600); // LANCEMENT DE LA SUITE
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
function winGame() {
    const wonIndex = currentFound; currentFound++; 
    window.ondevicemotion = null; document.body.ontouchstart = null; window.speechSynthesis.cancel();
    
    if(micStream) { micStream.getTracks().forEach(t => t.stop()); cancelAnimationFrame(micLoop); document.getElementById('mic-gauge').style.display = 'none'; }
    
    const arena = document.getElementById('game-arena');
    arena.innerHTML = `<div class="win-relic-icon">${getRelicSVG(wonIndex)}</div>`; document.getElementById('game-instr').innerText = "RÉUSSI !";
    setTimeout(() => { if(currentFound >= 9) launchFinalCinematic(); else animateSoulToHub(wonIndex); }, 1500);
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
        // TTS direct — pas de enterTempleMode pour ne pas écraser le masterGain
        await new Promise(r => {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(spokenJP);
            u.lang = "ja-JP"; u.rate = 0.9; u.pitch = 0.5; u.volume = 0.9;
            const timeout = setTimeout(() => { window.speechSynthesis.cancel(); r(); }, 8000);
            u.onend = () => { clearTimeout(timeout); r(); };
            u.onerror = () => { clearTimeout(timeout); r(); };
            window.speechSynthesis.speak(u);
        });
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
    // Murmure direct (pas de talkSync/temple mode)
    window.speechSynthesis.cancel();
    const uHikari = new SpeechSynthesisUtterance("Hikari...");
    uHikari.lang = "ja-JP"; uHikari.rate = 0.5; uHikari.pitch = 0.4; uHikari.volume = 0.8;
    window.speechSynthesis.speak(uHikari);
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

/* --- CAPTURE ESTAMPE --- */
function captureEstampe() {
    document.getElementById('flash').style.background = 'white'; 
    document.getElementById('flash').style.opacity = 1;
    setTimeout(() => { document.getElementById('flash').style.opacity = 0; document.getElementById('flash').style.background = 'transparent'; }, 600);
    if(navigator.vibrate) navigator.vibrate([100, 50, 200]);
    playGameSFX('thud');
    
    const video = document.getElementById('mirror-cam');
    const canvas = document.getElementById('polaroid-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200; canvas.height = 1600;
    
    if(washiCanvas) { ctx.drawImage(washiCanvas, 0, 0); } 
    else { ctx.fillStyle = "#EAE4D3"; ctx.fillRect(0, 0, 1200, 1600); }
    
    if(video && video.videoWidth > 0) {
        const s = Math.min(video.videoWidth, video.videoHeight);
        ctx.save();
        ctx.beginPath(); ctx.arc(600, 620, 380, 0, Math.PI * 2); ctx.clip();
        ctx.filter = "sepia(0.7) hue-rotate(190deg) contrast(1.4) brightness(0.85) saturate(1.3)";
        ctx.translate(1200, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, (video.videoWidth - s) / 2, (video.videoHeight - s) / 2, s, s, 220, 240, 760, 760);
        ctx.restore();
    }
    
    ctx.save(); ctx.strokeStyle = "rgba(15,10,10,0.85)";
    for(let pass = 0; pass < 3; pass++) {
        ctx.lineWidth = 8 + pass * 5 + Math.random() * 4; ctx.globalAlpha = 0.5 + pass * 0.2;
        ctx.beginPath();
        for(let i = 0; i <= Math.PI * 2; i += 0.08) { let rad = 390 + Math.random() * 15 - pass * 3; let x = 600 + Math.cos(i) * rad; let y = 620 + Math.sin(i) * rad; if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.closePath(); ctx.stroke();
    }
    for(let i = 0; i < 40; i++) { ctx.fillStyle = "rgba(10,5,5,0.6)"; ctx.beginPath(); ctx.arc(600 + (Math.random()-0.5)*900, 620 + (Math.random()-0.5)*900, Math.random()*3+0.5, 0, Math.PI*2); ctx.fill(); }
    ctx.restore();
    
    for(let i = 0; i < 55; i++) { ctx.fillStyle = `rgba(212,175,55,${0.3+Math.random()*0.5})`; ctx.beginPath(); ctx.arc(Math.random()*1200, Math.random()*1600, Math.random()*6+1, 0, Math.PI*2); ctx.fill(); }
    
    const relicKanji = ["団","剣","忍","愛","狐","握","禅","鼓","城"];
    ctx.font = "36px 'Ma Shan Zheng', cursive"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(107,26,26,0.6)";
    relicKanji.forEach((r, i) => { let a = (i/9)*Math.PI*2 - Math.PI/2; ctx.fillText(r, 600+Math.cos(a)*470, 620+Math.sin(a)*470); });
    
    ctx.fillStyle = "#6B1A1A"; ctx.font = "bold 85px 'Ma Shan Zheng', cursive"; ctx.textAlign = "center";
    ctx.fillText("PACTE ACCOMPLI", 600, 1200);
    let elapsedMs = Date.now() - gameStartTime; let mins = Math.floor(elapsedMs/60000); let secs = Math.floor((elapsedMs%60000)/1000);
    ctx.fillStyle = "#3d2f2d"; ctx.font = "32px 'Fredoka One', cursive"; ctx.fillText(`Sanctuaire purifié en ${mins} min et ${secs} sec`, 600, 1290);
    ctx.fillStyle = "#5a4b48"; ctx.font = "26px sans-serif"; ctx.fillText(mikoNames.join(" • "), 600, 1370);
    
    ctx.save(); ctx.translate(950, 1420); ctx.rotate(-15*Math.PI/180);
    ctx.globalCompositeOperation = "multiply"; ctx.strokeStyle = "#b71c1c"; ctx.lineWidth = 8; ctx.filter = "blur(0.5px)";
    ctx.strokeRect(-60,-60,120,120); ctx.fillStyle = "#b71c1c"; ctx.font = "bold 55px 'Ma Shan Zheng'"; ctx.textAlign = "center";
    ctx.fillText("九", 0, -8); ctx.fillText("猫", 0, 48); ctx.restore();
    
    const stamp = document.createElement('div'); stamp.className = 'hanko-slam'; stamp.innerHTML = '九<br>猫';
    document.getElementById('mirror-overlay').appendChild(stamp);
    playGameSFX('thud'); if(navigator.vibrate) navigator.vibrate([200, 50, 300]);
    
    setTimeout(() => { const link = document.createElement('a'); link.download = 'Estampe-des-Kami.png'; link.href = canvas.toDataURL('image/png'); link.click(); playGameSFX('pop'); stamp.remove(); }, 800);
    setTimeout(() => { document.getElementById('mirror-overlay').classList.remove('active'); setTimeout(() => launchEpilogue(), 1500); }, 2500);
}

/* --- ACTE VI — ÉPILOGUE : LE BATEAU DES LANTERNES --- */
async function launchEpilogue() {
    if(audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    
    const sf = document.getElementById('final-story-box');
    const showFinalText = async (htmlStr, spokenJP, pause = 500) => { 
        sf.style.opacity = 0; sf.style.transform = 'translateY(20px)';
        await new Promise(r => setTimeout(r, 400)); 
        sf.innerHTML = htmlStr; sf.style.opacity = 1; sf.style.transform = 'translateY(0)';
        await new Promise(r => {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(spokenJP);
            u.lang = "ja-JP"; u.rate = 0.9; u.pitch = 0.5; u.volume = 0.9;
            const timeout = setTimeout(() => { window.speechSynthesis.cancel(); r(); }, 8000);
            u.onend = () => { clearTimeout(timeout); r(); };
            u.onerror = () => { clearTimeout(timeout); r(); };
            window.speechSynthesis.speak(u);
        });
        await new Promise(r => setTimeout(r, pause));
    };
    
    // Adieu du sage — voix seule
    sf.style.opacity = 0;
    await new Promise(r => setTimeout(r, 500));
    await new Promise(r => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Sayonara... chiisana shugosha-tachi.");
        u.lang = "ja-JP"; u.rate = 0.6; u.pitch = 0.4; u.volume = 0.9;
        const timeout = setTimeout(() => { window.speechSynthesis.cancel(); r(); }, 8000);
        u.onend = () => { clearTimeout(timeout); r(); };
        u.onerror = () => { clearTimeout(timeout); r(); };
        window.speechSynthesis.speak(u);
    });
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

function downloadPolaroid() { openMirror(); }
