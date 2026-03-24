/* --- CINEMATICS.JS — Narration, Scènes, Skip --- */

let eyesTimeout = setTimeout(() => {
    const eyes = document.getElementById('intro-eyes');
    if(eyes && eyes.style.display !== 'none') eyes.style.opacity = 1;
}, 1500);

/* --- UTILITAIRES CINÉMATIQUES --- */

/* Ken-Burns dynamique — change la caméra par scène */
function setKenBurns(mode) {
    const anchor = document.getElementById('cinematic-anchor');
    if (!anchor) return;
    // Reset toutes les classes kb-*
    anchor.className = anchor.className.replace(/\bkb-\S+/g, '').trim();
    anchor.classList.remove('ken-burns');
    void anchor.offsetWidth; // force reflow pour relancer l'animation
    anchor.classList.add('ken-burns', `kb-${mode}`);
}

/* Effets cinéma — vignette, grain, glitch */
function setCinemaEffects(opts = {}) {
    const vignette = document.getElementById('cinema-vignette');
    const grain = document.getElementById('cinema-grain');
    if (vignette) vignette.style.opacity = opts.vignette || 0;
    if (grain) grain.style.opacity = opts.grain || 0;
    if (opts.glitch) document.body.classList.add('cinema-glitch');
    else document.body.classList.remove('cinema-glitch');
}

/* Ink wash — encre sumi-e qui coule du haut vers le bas */
function playInkWash() {
    return new Promise(resolve => {
        const ink = document.getElementById('ink-wash');
        if (!ink) { resolve(); return; }
        ink.style.opacity = 1;
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            ink.style.setProperty('--ink-progress', progress + '%');
            if (progress >= 110) {
                clearInterval(interval);
                setTimeout(resolve, 300);
            }
        }, 30); // ~1.5s total pour couvrir l'écran
    });
}

function clearInkWash() {
    const ink = document.getElementById('ink-wash');
    if (ink) { ink.style.opacity = 0; ink.style.setProperty('--ink-progress', '0%'); }
}

/* --- TYPEWRITER — Texte caractère par caractère --- */

async function showStoryText(htmlStr, spokenText, lang="ja-JP", rate=0.74) {
    if(introSkipped) return Promise.resolve();
    const st = document.getElementById('story-text');
    
    // Silence 150ms avant chaque nouvelle phrase — respiration naturelle
    await new Promise(r => setTimeout(r, 150));
    if(introSkipped) return;

    // Fade out ancien texte
    if(st.innerHTML !== "") { 
        st.classList.add('text-fade-out'); 
        await new Promise(r => setTimeout(r, 500)); 
    }
    if(introSkipped) return;
    
    st.classList.remove('text-fade-out');
    st.innerHTML = '';
    
    // Lancer la voix en parallèle du typewriter
    const voicePromise = spokenText ? talkSync(spokenText, lang, rate) : Promise.resolve();
    
    // Tokenizer : sépare le HTML en tokens
    const tokens = [];
    let inTag = false, currentTag = '';
    for (let i = 0; i < htmlStr.length; i++) {
        const ch = htmlStr[i];
        if (ch === '<') { inTag = true; currentTag = '<'; }
        else if (ch === '>' && inTag) { currentTag += '>'; tokens.push(currentTag); inTag = false; currentTag = ''; }
        else if (inTag) { currentTag += ch; }
        else { tokens.push(ch); }
    }
    
    // Typewriter synchronisé sur durée TTS estimée
    // Google JP ≈ 85ms/caractère à rate=1.0, ajusté par 1/rate
    const charCount = tokens.filter(t => !t.startsWith('<')).length;
    const estTTSDuration = spokenText
        ? Math.max(1500, spokenText.length * 85 * (1 / rate))
        : 3000;
    const speed = Math.max(28, Math.min(90, estTTSDuration / charCount));
    
    st.innerHTML = `<span class="tw-content"></span><span class="typewriter-cursor"></span>`;
    const twContent = st.querySelector('.tw-content');
    const cursor = st.querySelector('.typewriter-cursor');
    
    const typePromise = new Promise(resolve => {
        let i = 0;
        function typeNext() {
            if (introSkipped || i >= tokens.length) { 
                if (cursor) cursor.remove();
                twContent.innerHTML = htmlStr; // Assurer le HTML final complet
                resolve(); 
                return; 
            }
            const token = tokens[i];
            if (token.startsWith('<')) {
                // C'est un tag HTML → insérer d'un coup, pas de délai
                twContent.innerHTML += token;
                i++;
                typeNext(); // Enchaîner immédiatement
            } else {
                // C'est un caractère → taper avec délai
                twContent.innerHTML += token;
                i++;
                setTimeout(typeNext, speed);
            }
        }
        typeNext();
    });
    
    await Promise.all([voicePromise, typePromise]);
}

/* --- TRANSITIONS DE SCÈNES --- */

async function transitionScreen(targetId, shadowEmoji = null) {
    const doors = document.getElementById('shoji-doors');
    const shadow = document.getElementById('shoji-shadow');
    const target = document.getElementById(targetId); // On vérifie si l'écran existe

    if(!doors) { console.error("ID 'shoji-doors' manquant"); return; }

    if(shadow) {
        if(shadowEmoji) { shadow.innerText = shadowEmoji; } 
        else { const randomShadows = ["守", "魂", "光", "封"]; shadow.innerText = randomShadows[Math.floor(Math.random() * randomShadows.length)]; }
    }
    
    doors.classList.add('closed'); 
    if (typeof playGameSFX === 'function') playGameSFX('thud'); 
    
    await new Promise(r => setTimeout(r, 600)); 
    
    // SÉCURITÉ : Si l'écran cible n'existe pas, on ouvre les portes et on arrête
    if (!target) {
        console.error(`L'écran avec l'ID '${targetId}' est introuvable dans le HTML !`);
        doors.classList.remove('closed');
        return;
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    target.classList.add('active'); // Utilise la variable target vérifiée
    
    const belt = document.getElementById('miko-belt');
    if (belt) { if (targetId === 'screen-hub') belt.classList.add('visible'); else belt.classList.remove('visible'); }
    
    doors.classList.remove('closed');
    await new Promise(r => setTimeout(r, 500)); 
}

async function playScene(showIds, playAudio) {
    if(introSkipped) return Promise.resolve();
    const allLayers = ['layer-boat', 'layer-koi', 'layer-castle', 'layer-torii', 'layer-noface', 'layer-daruma']; 
    const targets = showIds ? (Array.isArray(showIds) ? showIds : [showIds]) : [];
    
    // CACHER : juste enlever la classe — CSS fait le reste (display:none, opacity:0)
    allLayers.forEach(id => { 
        const el = document.getElementById(id); 
        if(el) el.classList.remove('show-layer');
    });
    
    // Cacher neko-hero si pas demandé
    if (!targets.includes('neko-hero')) { 
        const n = document.getElementById('neko-hero'); 
        if(n) { n.style.opacity = '0'; n.style.display = 'none'; }
    } 
    
    // FORCER LE REFLOW — le browser doit VOIR que tout est caché avant de montrer la suite
    document.body.offsetHeight;
    
    await new Promise(r => setTimeout(r, 300)); 
    if(introSkipped) return;
    
    // Montrer neko-hero si demandé
    if(targets.includes('neko-hero')) { 
        const n = document.getElementById('neko-hero'); 
        if(n) { n.style.display = 'flex'; setTimeout(() => { n.style.opacity = '1'; }, 50); }
    }
    
    // MONTRER : juste ajouter la classe — CSS animations se trigger automatiquement
    targets.forEach(id => { 
        if(id !== 'neko-hero') { 
            const el = document.getElementById(id); 
            if(el) el.classList.add('show-layer'); 
        } 
    });
    
    if(playAudio) playAudio();
    await new Promise(r => setTimeout(r, 400)); 
}

/* --- GSAP ANIMATIONS (Kodamas, Lucioles) --- */

function startKodamaAnimations() {
    if(typeof gsap === 'undefined') return;
    gsap.to(".firefly", { x: "random(-150, 150)", y: "random(-100, 100)", opacity: "random(0.4, 1)", duration: "random(1.5, 4)", repeat: -1, yoyo: true, ease: "sine.inOut", stagger: { amount: 2, from: "random" } });
    document.querySelectorAll('.gsap-head').forEach(head => rattleHead(head));
}

function rattleHead(target) {
    if(typeof gsap === 'undefined') return;
    gsap.to(target, {
        rotation: "random(-15, 15)", duration: 0.08, repeat: 7, yoyo: true, ease: "power1.inOut",
        onComplete: () => {
            gsap.to(target, { rotation: "random(-40, 40)", duration: 1.5, ease: "back.out(1.5, 0.5)", onComplete: () => { setTimeout(() => rattleHead(target), Math.random() * 3000 + 2000); } });
        }
    });
}

/* --- ASSEMBLÉE DES GARDIENS (cercle dynamique) --- */

function spawnGhostGuardians() {
    const container = document.getElementById('ghost-guardians-container');
    if (!container) return;
    container.innerHTML = '';
    
    const count = 8;
    const radius = 210;
    
    const nekoMarkup = `<div class="neko-art-container"><div class="ears"><div class="ear-left-out"></div><div class="ear-left-inner"></div><div class="ear-right-out"></div><div class="ear-right-inner"></div></div><div class="head"><div class="eyes"><div class="eye-left"></div><div class="eye-right"></div></div><div class="face-center"><div class="mustache-left"></div><div class="mustache-left-bottom"></div><div class="mustache-right"></div><div class="mustache-right-bottom"></div><div class="nose"></div><div class="mouth"></div><div class="mouth-right"></div></div></div><div class="necklace"><div class="bell"><div class="reflect"></div></div></div><div class="arm-top-left-wrapper"><div class="arm-top-left"></div><div class="arm-top-left-tip"></div></div><div class="arm-top-right"></div><div class="arm-top-right-tip"></div><div class="back-legs"><div class="back-leg-left"></div><div class="back-leg-right"></div></div><div class="paws"><div class="paw-left"></div><div class="paw-right"></div></div></div>`;
    
    for (let i = 0; i < count; i++) {
        const angle = ((i / count) * Math.PI * 2) - Math.PI / 2;
        const ox = Math.round(Math.cos(angle) * radius);
        const oy = Math.round(Math.sin(angle) * radius);
        const depth = (Math.sin(angle) + 1) / 2;
        const scale = 0.12 + depth * 0.08;
        const zIdx = Math.round(depth * 10);
        const flip = (Math.cos(angle) > 0.1) ? ' scaleX(-1)' : '';
        
        const ghost = document.createElement('div');
        ghost.className = 'ghost-guardian';
        ghost.style.cssText = `left:50%;top:50%;--ox:${ox}px;--oy:${oy}px;transform:translate(-50%,-50%) translate(var(--ox),var(--oy)) scale(0);opacity:0;z-index:${zIdx};`;
        ghost.innerHTML = `<div class="neko-scale-wrapper obsidian-mode ghost-neko" style="transform:scale(${scale.toFixed(2)})${flip};">${nekoMarkup}</div>`;
        container.appendChild(ghost);
        
        const delay = 300 + i * 200;
        setTimeout(() => {
            ghost.style.transition = 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.17,0.89,0.32,1.49)';
            ghost.style.opacity = '0.6';
            ghost.style.transform = 'translate(-50%,-50%) translate(var(--ox),var(--oy)) scale(1)';
            playGameSFX('pop');
            setTimeout(() => {
                ghost.style.transition = '';
                ghost.classList.add('popped');
                // Dessiner la constellation quand tous sont pop
                if (i === count - 1) setTimeout(drawGuardianConstellation, 300);
            }, 700);
        }, delay);
    }
}

/* Trace des lignes lumineuses entre les gardiens (octogone sacré) */
function drawGuardianConstellation() {
    const canvas = document.getElementById('guardian-constellation');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sync canvas bitmap size with its CSS rendered size (responsive fix)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssSize = Math.round(rect.width || 500);
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, cssSize, cssSize);

    const count = 8;
    const cx = cssSize / 2; const cy = cssSize / 2;
    // Radius scales proportionally from original 210/500
    const radius = Math.round(cx * 0.84);
    const points = [];
    for (let i = 0; i < count; i++) {
        const angle = ((i / count) * Math.PI * 2) - Math.PI / 2;
        points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    
    // Octogone doré
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 12;
    points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.stroke();
    
    // Lignes vers le centre
    ctx.strokeStyle = 'rgba(255, 183, 197, 0.25)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 183, 197, 0.3)';
    points.forEach(p => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke(); });
}

/* Compteur d'acte en kanji */
const ACT_KANJI = ['一幕 · 旅', '二幕 · 発見', '三幕 · 聖', '四幕 · 破', '五幕 · 落'];
function showActCounter(actIndex) {
    const el = document.getElementById('act-counter');
    if (!el) return;
    el.textContent = ACT_KANJI[actIndex] || '';
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 4000);
}

/* --- DEVICE ORIENTATION / MOTION --- */

window.addEventListener('deviceorientation', (e) => {
    if(e.gamma !== null && e.beta !== null) {
        hasGyro = true;
        const compass = document.getElementById('needle-gold');
        if(compass) compass.style.transform = `rotate(${-e.alpha}deg)`;
    }
}, true);

window.addEventListener('devicemotion', (e) => {
    if(!document.getElementById('screen-hub').classList.contains('active')) return;
    if(Math.abs(e.acceleration.x) > 3 || Math.abs(e.acceleration.y) > 3 || Math.abs(e.acceleration.z) > 3) {
        if(navigator.vibrate) navigator.vibrate(10); 
    }
}, true);

/* --- SKIP INTRO --- */

let skipFillObj = null; let skipProgress = 0; let skipAnimFrame;
document.addEventListener('pointerdown', startSkip);
document.addEventListener('pointerup', endSkip);

function startSkip(e) {
    if(!document.getElementById('screen-narrative').classList.contains('active')) return;
    document.getElementById('skip-zone').style.display = 'flex'; skipFillObj = document.getElementById('skip-fill'); skipProgress = 0; growSkip();
}
function growSkip() {
    skipProgress += 5; if(skipFillObj) { skipFillObj.style.width = skipProgress + '%'; skipFillObj.style.height = skipProgress + '%'; }
    if(skipProgress >= 100) { forceSkipIntro(); return; } skipAnimFrame = requestAnimationFrame(growSkip);
}
function endSkip() { cancelAnimationFrame(skipAnimFrame); if(skipFillObj){ skipFillObj.style.width = '0%'; skipFillObj.style.height = '0%';} document.getElementById('skip-zone').style.display = 'none'; }

function forceSkipIntro() {
    introSkipped = true; if (typeof cancelVoice === 'function') cancelVoice(); else window.speechSynthesis.cancel();
    if (typeof stopIntroMusicTrack === 'function') stopIntroMusicTrack(700);
    document.getElementById('skip-zone').style.display = 'none';
    setCinemaEffects({ vignette: 0, grain: 0, glitch: false });
    clearInkWash();
    if(window.setSakuraMood) window.setSakuraMood('RITUEL');
    transitionScreen('screen-rules', "📜"); 
}

/* --- 🎬 CINÉMATIQUE PRINCIPALE — Arc narratif complet --- */

async function launchExperience(event) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    if (typeof findBestVoice === 'function') { setTimeout(findBestVoice, 100); }
    if (typeof initKokoro === 'function') { setTimeout(initKokoro, 500); }
 
    
    if(event && event.clientX) {
        let paw = document.createElement('div'); paw.className = 'magic-paw'; paw.innerText = '🐾';
        paw.style.left = event.clientX + 'px'; paw.style.top = event.clientY + 'px';
        document.body.appendChild(paw); setTimeout(() => paw.remove(), 1000); playGameSFX('beep', 880);
    }
    document.getElementById('intro-title').style.opacity = 0; 
    document.querySelector('.bg-kanji').style.opacity = 0; 
    document.getElementById('btn-start').style.display = 'none';
    
    clearTimeout(eyesTimeout); const eyes = document.getElementById('intro-eyes');
    if(eyes) { eyes.style.transition = 'opacity 0.5s ease'; eyes.style.opacity = 0; setTimeout(() => { eyes.style.display = 'none'; }, 500); }
    
    initSfx();
    if (typeof playIntroMusicTrack === 'function') {
        try { await playIntroMusicTrack(); } catch (e) {}
    }
    await new Promise(r => setTimeout(r, 800));
    if(introSkipped) return;
    
    /* ═══════════════════════════════════════════
       ACTE 1 — LE VOYAGE (brume, mystère)
       ═══════════════════════════════════════════ */
    showActCounter(0);
    if(window.setSakuraMood) window.setSakuraMood('VOYAGE');
    setMusicMood('VOYAGE');
    setKenBurns('voyage');
    setCinemaEffects({ vignette: 0.45, grain: 0.05 });
    
    // Scène Bateau — entrée slide depuis la gauche
    await playScene('layer-boat', () => { playGameSFX('woosh'); playMikoChime(6); });
    await showStoryText("Au-delà des brumes du temps,<br>loin du monde des hommes...", "時の霧を越えて、　人の世界から遠く離れて…", "ja-JP", 0.68);
    if(introSkipped) return;
    await new Promise(r => setTimeout(r, 2000)); // Pause contemplative longue
    
    // Scène Koi — entrée scale up depuis le centre
    await playScene('layer-koi', () => { playGameSFX('pop'); playMikoChime(3); });
    await showStoryText("Se cache un lieu où les esprits de l'eau<br>murmurent des secrets...", "水の精霊が、秘密を囁く場所が隠されている…", "ja-JP", 0.68);
    if(introSkipped) return;
    await new Promise(r => setTimeout(r, 1800));

    /* ═══════════════════════════════════════════
       ACTE 2 — LA DÉCOUVERTE (émerveillement)
       ═══════════════════════════════════════════ */
    showActCounter(1);
    if(window.setSakuraMood) window.setSakuraMood('DECOUVERTE');
    setKenBurns('decouverte');
    setCinemaEffects({ vignette: 0.5, grain: 0.04 });
    
    // Scène Château — entrée qui monte depuis le bas
    await playScene('layer-castle', () => { playGameSFX('thud'); playMikoChime(0); setMusicMood('DECOUVERTE'); });
    // Phrase 3 — VOYAGE s'enrichit, pad apparaît
    if(window.audioLayers) { const now = audioCtx.currentTime; audioLayers.pad.gain.setTargetAtTime(0.08, now, 1.5); }
    await showStoryText("Le majestueux Sanctuaire de Neko-Jinja<br>s'élevait vers les cieux.", "荘厳な猫神社が、　天に聳え立っていた。", "ja-JP", 0.70);
    if(introSkipped) return;
    await new Promise(r => setTimeout(r, 1500));
    
    // Scène Torii — entrée blur qui se dissipe
    await playScene('layer-torii', () => playMikoChime(2));
    await showStoryText("Un domaine imprégné<br>de magie pure.", "純粋な魔法に満たされた、　領域。", "ja-JP", 0.65);
    if(introSkipped) return;
    await new Promise(r => setTimeout(r, 1500));

    /* ═══════════════════════════════════════════
       ACTE 3 — LE SACRÉ (sérénité, contemplation)
       ═══════════════════════════════════════════ */
    showActCounter(2);
    if(window.setSakuraMood) window.setSakuraMood('SACRE');
    setKenBurns('sacre');
    setCinemaEffects({ vignette: 0.65, grain: 0.03 });
    
    // Scène Kodamas — entrée fade lente
    await playScene('layer-noface', () => { 
        playMikoChime(4); playMikoChime(5); 
        startKodamaAnimations();
        setMusicMood('SACRE');
    });
    // Phrase 5 — Transition SACRE, clochettes et mélodie
    if(window.setMusicMood) setMusicMood('SACRE');
    await showStoryText("Où les anciens esprits<br>veillaient en silence.", "古代の精霊が、　静かに見守っていた。", "ja-JP", 0.65);
    if(introSkipped) return;
    await new Promise(r => setTimeout(r, 2200)); // Longue pause — moment sacré
    
    // Scène Neko + Gardiens + Kusanagi
    setKenBurns('neko');
    const n = document.getElementById('neko-hero'); n.classList.remove('sleeping'); n.classList.add('cinematic-mode');
    document.getElementById('kusanagi-sword').style.display = 'block'; 
    await playScene('neko-hero', () => { playMikoChime(1); spawnGhostGuardians(); });
    await showStoryText("Le Neko Suprême et ses huit Gardiens<br>protégeaient l'épée sacrée Kusanagi.", "守護者は、聖なる剣、草薙を守っていました。", "ja-JP", 0.65);
    if(introSkipped) return;
    await new Promise(r => setTimeout(r, 1200));

    /* ═══════════════════════════════════════════
       ACTE 4 — LA RUPTURE (terreur, chaos)
       ═══════════════════════════════════════════ */
    showActCounter(3);
    setKenBurns('rupture');
    setCinemaEffects({ vignette: 0.7, grain: 0.15, glitch: false });
    
    transitionToDarkAudio(); document.getElementById('kusanagi-sword').classList.add('kusanagi-break'); 
    await new Promise(r => setTimeout(r, 600)); // Plus court — la tension monte vite

    n.classList.add('sucked-in'); playGameSFX('woosh');
    await new Promise(r => setTimeout(r, 1000));

    const flash = document.getElementById('flash'); flash.style.background = 'white'; flash.style.opacity = 1;
    document.getElementById('main-body').classList.add('violent-shake'); 
    // Fissures d'écran
    const crack = document.getElementById('screen-crack'); if(crack) crack.classList.add('active');
    playThunder(); if(navigator.vibrate) navigator.vibrate([300, 100, 400]);
    setTimeout(() => { flash.style.opacity = 0; flash.style.background = 'transparent'; }, 200);
    setTimeout(() => { document.getElementById('main-body').classList.remove('violent-shake'); if(crack) crack.classList.remove('active'); }, 400);
    n.style.display = 'none';

    if(window.setSakuraMood) window.setSakuraMood('DARUMA');
    setCinemaEffects({ vignette: 0.8, grain: 0.2, glitch: true });

    // Scène Ombre — entrée depuis le flou/lumière
    await playScene('layer-daruma', () => { document.getElementById('cinematic-daruma').classList.add('awake'); playEvilLaugh(); });
    // Phrase 7 — RUPTURE : bascule au moment exact de la voix
    if(window.setMusicMood) setMusicMood('RUPTURE');
    await showStoryText("Mais l'Ombre Millénaire s'éveilla...<br><span class='line-break'>et le sceau vola en éclats.</span>", "しかし…　影の精霊が目覚め、　封印は砕け散った…", "ja-JP", 0.62);
    if(introSkipped) return;

    if(navigator.vibrate) navigator.vibrate([100, 50, 300, 100, 500]); 
    
    const relicsBox = document.getElementById('relics'); relicsBox.innerHTML = '';
    relicKeys.forEach((key, i) => {
        let angle = (i * 40) * (Math.PI / 180); 
        let tx = Math.cos(angle) * 300 + "px"; let ty = Math.sin(angle) * 300 + "px";
        let trailDeg = Math.round((angle * 180 / Math.PI) + 90);
        relicsBox.innerHTML += `<div class="fleeing-neko" style="--tx: ${tx}; --ty: ${ty}; --trail-angle: ${trailDeg}deg; animation: blast-out 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; width:40px; height:40px; color:var(--gold);">${getRelicSVG(i)}</div>`;
    });
    setTimeout(() => { relicsBox.innerHTML = ''; }, 1500);

    /* ═══════════════════════════════════════════
       ACTE 5 — LA CHUTE (désolation, silence)
       ═══════════════════════════════════════════ */
    showActCounter(4);
    playGameSFX('sword');
    setMusicMood('CHUTE');
    setCinemaEffects({ vignette: 0.9, grain: 0.1, glitch: false });
    
    await showStoryText("La lumière fut engloutie par la nuit.<br><span class='line-break'>Les 9 Gardiens dispersés aux quatre vents.</span>", "光は闇に飲まれ、　九つの守護者は四方に散った。", "ja-JP", 0.62);
    if(introSkipped) return;

    await new Promise(r => setTimeout(r, 2500));
    
    // Ink wash — encre sumi-e qui coule comme final
    await playInkWash();
    
    setCinemaEffects({ vignette: 0, grain: 0, glitch: false });
    clearInkWash();
    if(!introSkipped) { forceSkipIntro(); }
}

