/* ============================================
   DEBUG.JS — Hard Debug Mode
   Trigger: ?debug=hard in URL
   ============================================ */

(function() {
    if (!location.search.includes('debug=hard')) return;
    console.log('[DEBUG] Hard mode activé');

    /* ============================================
       CACHE BUSTING — Force le rechargement des
       fichiers CSS à chaque lancement debug
       + nettoyage SW/cache sans réinjecter les JS
       ============================================ */
    (function bustCache() {
        const ts = Date.now();

        // Fichiers CSS à recharger dynamiquement
        const cssFiles = ['css/game.css', 'css/cinematics.css', 'css/base.css'];

        // Rechargement CSS — remplacer les <link> existants
        cssFiles.forEach(href => {
            const fileName = href.split('/').pop().split('?')[0];
            const existing = document.querySelector(`link[href*="${fileName}"]`);
            if (existing) {
                const fresh = document.createElement('link');
                fresh.rel = 'stylesheet';
                fresh.href = `${href}?v=dbg${ts}`;
                existing.parentNode.insertBefore(fresh, existing.nextSibling);
                setTimeout(() => existing.remove(), 500);
            }
        });

        // IMPORTANT :
        // On ne réinjecte PAS les JS ici.
        // Ils sont déjà chargés par index.html.
        // Les réinjecter provoque :
        // "Identifier ... has already been declared"
        console.log('[DEBUG] JS cache-bust désactivé pour éviter le double chargement');

        // Invalider / mettre à jour le Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(reg => {
                    reg.update();
                    console.log('[DEBUG] SW update forcé');
                });
            });

            // Vider les caches SW
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                        console.log(`[DEBUG] Cache SW supprimé: ${name}`);
                    });
                });
            }
        }

        console.log(`[DEBUG] Cache bust lancé — timestamp: ${ts}`);
    })();

    const debugCSS = document.createElement('style');
    debugCSS.id = 'debug-css';
    debugCSS.textContent = `
        #debug-btn {
            position: fixed; top: 10px; right: 10px; z-index: 9999;
            width: 44px; height: 44px; border-radius: 50%;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #e94560; color: #fff; font-size: 22px;
            cursor: pointer; box-shadow: 0 4px 15px rgba(233,69,96,0.4);
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        #debug-btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(233,69,96,0.6); }
        #debug-btn.active { background: #e94560; }
        
        #debug-overlay {
            position: fixed; top: 60px; right: 10px; z-index: 9998;
            background: rgba(10,10,20,0.95); border: 1px solid #e94560;
            border-radius: 12px; padding: 15px; min-width: 200px;
            display: none; flex-direction: column; gap: 8px;
            font-family: 'Courier New', monospace; font-size: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
            max-height: 80vh; overflow-y: auto;
        }
        #debug-overlay.show { display: flex; }
        
        #debug-overlay h3 { margin: 0 0 5px; color: #e94560; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 5px; }
        
        .debug-section { display: flex; flex-direction: column; gap: 4px; }
        
        .debug-link {
            background: rgba(255,255,255,0.05); border: 1px solid #333;
            border-radius: 6px; padding: 8px 12px; color: #fff;
            cursor: pointer; transition: all 0.15s; text-align: left;
            font-size: 11px;
        }
        .debug-link:hover { background: rgba(233,69,96,0.2); border-color: #e94560; }
        
        #debug-pause-btn {
            background: linear-gradient(135deg, #00b894, #00cec9);
            border: none; border-radius: 8px; padding: 12px;
            color: #fff; font-weight: bold; font-size: 13px;
            cursor: pointer; margin-top: 10px; text-transform: uppercase;
            letter-spacing: 1px; transition: all 0.2s;
        }
        #debug-pause-btn:hover { transform: scale(1.02); filter: brightness(1.1); }
        #debug-pause-btn.paused { background: linear-gradient(135deg, #e94560, #ff6b6b); }
        
        #debug-freeze-style * {
            animation-play-state: paused !important;
            transition: none !important;
        }
    `;
    document.head.appendChild(debugCSS);

    /* ============================================
       INJECTION HTML (Bouton et Overlay)
       ============================================ */
    const btn = document.createElement('button');
    btn.id = 'debug-btn';
    btn.innerHTML = '🛠️';
    btn.title = 'Debug Menu';
    document.body.appendChild(btn);

    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.innerHTML = `
        <h3>🎬 Cinematic Scenes</h3>
        <div class="debug-section">
            <button class="debug-link" data-action="scene" data-index="1">1. Bateau (Voyage)</button>
            <button class="debug-link" data-action="scene" data-index="2">2. Koi (Voyage)</button>
            <button class="debug-link" data-action="scene" data-index="3">3. Château (Découverte)</button>
            <button class="debug-link" data-action="scene" data-index="4">4. Torii (Découverte)</button>
            <button class="debug-link" data-action="scene" data-index="5">5. Kodamas (Sacré)</button>
            <button class="debug-link" data-action="scene" data-index="6">6. Neko & Épée (Sacré)</button>
            <button class="debug-link" data-action="scene" data-index="7">7. Ombre Millénaire</button>
        </div>
        
        <h3>🌙 Screens</h3>
        <div class="debug-section">
            <button class="debug-link" data-action="rules">Règles</button>
            <button class="debug-link" data-action="oath">Serment (Oath)</button>
            <button class="debug-link" data-action="hub">Hub</button>
        </div>
        
        <h3>🎮 Guardians (1-9)</h3>
        <div class="debug-section" id="debug-guardians"></div>
        
        <h3>🌸 Outro</h3>
        <div class="debug-section">
            <button class="debug-link" data-action="outro" data-type="final">1. Cinématique Finale</button>
            <button class="debug-link" data-action="outro" data-type="cert">2. Certificat & Sceau</button>
            <button class="debug-link" data-action="outro" data-type="epilogue">3. Épilogue (Bateau)</button>
        </div>

        
        <button id="debug-pause-btn">⏸️ SUPER PAUSE</button>
        <div style="font-size:10px; color:#666; margin-top:8px; text-align:center;">
            RAF: <span id="debug-raf-status">●</span> |
            Audio: <span id="debug-audio-status">●</span> |
            GSAP: <span id="debug-gsap-status">●</span>
        </div>
    `;
    document.body.appendChild(overlay);

    /* Populate guardians list */
    const guardianBox = document.getElementById('debug-guardians');
    for (let i = 0; i < 9; i++) {
        const b = document.createElement('button');
        b.className = 'debug-link';
        b.dataset.action = 'game';
        b.dataset.index = i;
        const g = typeof guardianData !== 'undefined' ? guardianData[i] : null;
        b.textContent = g ? `${i+1}. ${g.e} ${g.n}` : `${i+1}. Guardian ${i+1}`;
        guardianBox.appendChild(b);
    }

    /* Toggle overlay visibility */
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        overlay.classList.toggle('show');
    });

    /* ============================================
       LOGIQUE MÉTIER DES BOUTONS DE DEBUG (BYPASS)
       ============================================ */

    function forceScene(sceneIndex) {
        introSkipped = true;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (typeof heartInterval !== 'undefined') clearInterval(heartInterval);
        if (typeof quizInterval !== 'undefined') clearInterval(quizInterval);

        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        const narrative = document.getElementById('screen-narrative');
        if (narrative) narrative.classList.add('active');

        const storyText = document.getElementById('story-text');
        if (storyText) {
            storyText.innerHTML = `[DEBUG] Scène ${sceneIndex} forcée...`;
            storyText.classList.remove('text-fade-out');
        }
        
        ['btn-start', 'intro-title'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        document.querySelectorAll('.bg-kanji, #intro-eyes').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.cinematic-layer').forEach(el => el.classList.remove('show-layer'));

        const nekoHero = document.getElementById('neko-hero');
        if (nekoHero) {
            nekoHero.style.display = 'none';
            nekoHero.style.opacity = '0';
        }

        const daruma = document.getElementById('cinematic-daruma');
        if (daruma) daruma.classList.remove('awake');

        const sword = document.getElementById('kusanagi-sword');
        if (sword) {
            sword.classList.remove('kusanagi-break');
            sword.style.display = 'none';
        }
        
        const belt = document.getElementById('miko-belt');
        if (belt) belt.classList.remove('visible');

        sceneIndex = parseInt(sceneIndex, 10);

        switch (sceneIndex) {
            case 1:
                {
                    const layer1 = document.getElementById('layer-boat');
                    if (layer1) layer1.classList.add('show-layer');
                    if (typeof setSakuraMood === 'function') setSakuraMood('VOYAGE');
                    if (typeof setMusicMood === 'function') setMusicMood('VOYAGE');
                    if (typeof setKenBurns === 'function') setKenBurns('voyage');
                    if (typeof setCinemaEffects === 'function') setCinemaEffects({ vignette: 0.45, grain: 0.05 });
                }
                break;
            case 2:
                {
                    const layer2 = document.getElementById('layer-koi');
                    if (layer2) layer2.classList.add('show-layer');
                    if (typeof setSakuraMood === 'function') setSakuraMood('VOYAGE');
                    if (typeof setMusicMood === 'function') setMusicMood('VOYAGE');
                    if (typeof setKenBurns === 'function') setKenBurns('voyage');
                }
                break;
            case 3:
                {
                    const layer3 = document.getElementById('layer-castle');
                    if (layer3) layer3.classList.add('show-layer');
                    if (typeof setSakuraMood === 'function') setSakuraMood('DECOUVERTE');
                    if (typeof setMusicMood === 'function') setMusicMood('DECOUVERTE');
                    if (typeof setKenBurns === 'function') setKenBurns('decouverte');
                }
                break;
            case 4:
                {
                    const layer4 = document.getElementById('layer-torii');
                    if (layer4) layer4.classList.add('show-layer');
                    if (typeof setSakuraMood === 'function') setSakuraMood('DECOUVERTE');
                    if (typeof setMusicMood === 'function') setMusicMood('DECOUVERTE');
                    if (typeof setKenBurns === 'function') setKenBurns('decouverte');
                }
                break;
            case 5:
                {
                    const layer5 = document.getElementById('layer-noface');
                    if (layer5) layer5.classList.add('show-layer');
                    if (typeof setSakuraMood === 'function') setSakuraMood('SACRE');
                    if (typeof setMusicMood === 'function') setMusicMood('SACRE');
                    if (typeof setKenBurns === 'function') setKenBurns('sacre');
                }
                break;
            case 6:
                if (nekoHero) {
                    nekoHero.style.display = 'flex';
                    nekoHero.style.opacity = '1';
                }
                if (sword) sword.style.display = 'block';
                if (typeof setSakuraMood === 'function') setSakuraMood('SACRE');
                if (typeof setMusicMood === 'function') setMusicMood('SACRE');
                if (typeof setKenBurns === 'function') setKenBurns('neko');
                break;
            case 7:
                {
                    const layer7 = document.getElementById('layer-daruma');
                    if (layer7) layer7.classList.add('show-layer');
                    if (daruma) daruma.classList.add('awake');
                    if (typeof setSakuraMood === 'function') setSakuraMood('DARUMA');
                    if (typeof setMusicMood === 'function') setMusicMood('RUPTURE');
                    if (typeof setKenBurns === 'function') setKenBurns('rupture');
                    if (typeof setCinemaEffects === 'function') setCinemaEffects({ vignette: 0.8, grain: 0.2, glitch: true });
                }
                break;
        }
    }

    function forceQuiz(index) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (typeof heartInterval !== 'undefined') clearInterval(heartInterval);
        if (typeof quizInterval !== 'undefined') clearInterval(quizInterval);
        currentFound = parseInt(index, 10);
        if (typeof setupQuiz === 'function') setupQuiz();
    }

    function forceOutro(type) {
        introSkipped = true;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (typeof heartInterval !== 'undefined') clearInterval(heartInterval);
        if (typeof quizInterval !== 'undefined') clearInterval(quizInterval);

        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.cinematic-layer').forEach(el => el.classList.remove('show-layer'));
        
        const belt = document.getElementById('miko-belt');
        if (belt) belt.classList.remove('visible');

        currentFound = 9;
        for (let _i = 0; _i < 9; _i++) foundGuardians.add(_i);

        if (typeof resetFinalScreenState === 'function') resetFinalScreenState();

        if (type === 'final') {
            const finalScreen = document.getElementById('screen-final');
            if (finalScreen) finalScreen.classList.add('active');

            const launchWithAudio = () => {
                if (typeof initSfx === 'function' && !audioCtx) {
                    try { initSfx(); } catch (e) {}
                }
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume().catch(() => {});
                }
                if (typeof setMusicMood === 'function') {
                    try { setMusicMood('VOYAGE'); } catch (e) {}
                }
                if (typeof launchFinalCinematic === 'function') launchFinalCinematic();
            };
            launchWithAudio();
        } else if (type === 'cert') {
            if (typeof allowFinalPostUI === 'function') allowFinalPostUI();

            const finalScreen = document.getElementById('screen-final');
            if (finalScreen) finalScreen.classList.add('active');
            
            const cert = document.getElementById('victory-cert');
            if (cert) {
                cert.style.display = 'block';
                cert.style.transform = 'scale(1)';
                cert.style.opacity = '1';
            }
            
            const btnDl = document.getElementById('btn-download');
            if (btnDl) {
                btnDl.style.display = 'block';
                btnDl.style.transform = 'scale(1)';
            }
            
            if (typeof setSakuraMood === 'function') setSakuraMood('AUBE');
        } else if (type === 'epilogue') {
            const finalScreen = document.getElementById('screen-final');
            if (finalScreen) finalScreen.classList.add('active');
            if (typeof launchEpilogue === 'function') launchEpilogue();
        }
    }

    /* ============================================
       FORCE OUTRO SCENE — Jump direct à une scène
       ============================================ */
    function forceOutroScene(type) {
        introSkipped = true;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        currentFound = 9;
        for (let _i = 0; _i < 9; _i++) foundGuardians.add(_i);

        const finalScreen = document.getElementById('screen-final');
        if (finalScreen) finalScreen.classList.add('active');

        if (typeof initSfx === 'function' && !audioCtx) {
            try { initSfx(); } catch (e) {}
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (typeof setMusicMood === 'function') {
            try { setMusicMood('VOYAGE'); } catch (e) {}
        }

        const sf = document.getElementById('final-story-box');
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        const stage = document.getElementById('final-circ-nekos');
        if (stage) {
            stage.innerHTML = '';
            stage.style.opacity = '1';
            stage.style.visibility = 'visible';
        }

        const existing = document.getElementById('mikos-scene');
        if (existing) existing.remove();

        switch (type) {
            case 'neko':
                if (typeof setSakuraMood === 'function') setSakuraMood('FINAL');
                if (typeof launchFinalCinematic === 'function') launchFinalCinematic();
                break;

            case 'ombre':
                if (typeof setSakuraMood === 'function') setSakuraMood('DARUMA');
                if (typeof ThemeManager !== 'undefined') ThemeManager.apply('daruma', 600);
                (async () => {
                    const daruma = document.getElementById('final-daruma');
                    if (daruma && daruma.parentNode !== finalScreen) finalScreen.appendChild(daruma);
                    if (typeof spawnOmbreScene === 'function') {
                        await spawnOmbreScene();
                    } else {
                        console.warn('[DEBUG] spawnOmbreScene not available — launching full cinematic');
                        if (typeof launchFinalCinematic === 'function') launchFinalCinematic();
                    }
                })();
                break;

            case 'mikos':
                if (typeof setSakuraMood === 'function') setSakuraMood('REUNION');
                (async () => {
                    if (typeof spawnMikosScene === 'function') await spawnMikosScene(sf, sleep);
                })();
                break;

            case 'castle':
                if (typeof setSakuraMood === 'function') setSakuraMood('AUBE');
                (async () => {
                    if (typeof spawnCastleVictory === 'function') await spawnCastleVictory(sf, sleep);
                })();
                break;

            case 'yokai':
                if (typeof setSakuraMood === 'function') setSakuraMood('REUNION');
                (async () => {
                    if (typeof spawnYokaiScene === 'function') await spawnYokaiScene(sf, sleep);
                })();
                break;

            case 'nekosupreme':
                if (typeof setSakuraMood === 'function') setSakuraMood('VICTOIRE');
                (async () => {
                    if (typeof spawnNekoSupreme === 'function') await spawnNekoSupreme(sf, sleep);
                })();
                break;

            case 'miroir':
                if (typeof allowFinalPostUI === 'function') allowFinalPostUI();
                {
                    const btnMiroir = document.getElementById('btn-download');
                    if (btnMiroir) {
                        btnMiroir.style.display = 'block';
                        btnMiroir.style.transform = 'scale(1)';
                    }
                }
                if (sf) sf.textContent = 'Scellez cette légende.';
                break;
        }

        console.log(`[DEBUG] Outro scene: ${type}`);
    }

    overlay.addEventListener('click', (e) => {
        const link = e.target.closest('.debug-link');
        if (!link) return;
        
        const action = link.dataset.action;
        const index = link.dataset.index;
        const type = link.dataset.type;
        console.log('[DEBUG] Action fired:', action, index || type);
        
        if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        switch (action) {
            case 'scene':
                forceScene(index);
                break;

            case 'rules':
                if (typeof transitionScreen === 'function') {
                    if (typeof currentRule !== 'undefined') currentRule = 1;
                    for (let r = 1; r <= 4; r++) {
                        const el = document.getElementById(`rule-${r}`);
                        if (el) el.style.display = r === 1 ? 'flex' : 'none';
                    }
                    transitionScreen('screen-rules', '📜');
                }
                break;

            case 'oath':
                if (typeof transitionScreen === 'function') {
                    transitionScreen('screen-oath', '✨');
                    setTimeout(() => {
                        if (typeof initGummyPaws === 'function') initGummyPaws();
                    }, 1200);
                }
                break;

            case 'hub':
                currentFound = index !== undefined ? parseInt(index, 10) : (typeof currentFound !== 'undefined' ? currentFound : 0);
                if (typeof enterHub === 'function') enterHub();
                break;

            case 'game':
                forceQuiz(index);
                break;

            case 'outro':
                forceOutro(type);
                break;
        }
    });

    /* ============================================
       SUPER PAUSE / RESUME LOGIC (WebGL/Audio/GSAP)
       ============================================ */
    
    let isPaused = false;
    let freezeStyle = null;
    const originalRAF = window.requestAnimationFrame;
    let rafRunning = true;
    const pendingFrames = new Set();

    window.requestAnimationFrame = function(cb) {
        if (!rafRunning) {
            const id = Math.random();
            pendingFrames.add({ id, cb });
            return id;
        }
        return originalRAF.call(window, cb);
    };

    function pauseRAF() {
        rafRunning = false;
        const s = document.getElementById('debug-raf-status');
        if (s) s.style.color = '#e94560';
    }

    function resumeRAF() {
        rafRunning = true;
        const s = document.getElementById('debug-raf-status');
        if (s) s.style.color = '#00b894';
        pendingFrames.forEach(({ cb }) => originalRAF.call(window, cb));
        pendingFrames.clear();
    }

    const pauseBtn = document.getElementById('debug-pause-btn');
    
    function superPause() {
        isPaused = true;
        pauseBtn.classList.add('paused');
        pauseBtn.innerHTML = '▶️ RESUME ALL';

        freezeStyle = document.createElement('style');
        freezeStyle.id = 'debug-freeze-style';
        freezeStyle.textContent = '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }';
        document.head.appendChild(freezeStyle);

        if (typeof gsap !== 'undefined' && gsap.globalTimeline) {
            gsap.globalTimeline.pause();
            const s = document.getElementById('debug-gsap-status');
            if (s) s.style.color = '#e94560';
        }

        pauseRAF();

        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
            const s = document.getElementById('debug-audio-status');
            if (s) s.style.color = '#e94560';
        }

        if (window.speechSynthesis) window.speechSynthesis.pause();
        document.querySelectorAll('video').forEach(v => v.pause());
    }

    function superResume() {
        isPaused = false;
        pauseBtn.classList.remove('paused');
        pauseBtn.innerHTML = '⏸️ SUPER PAUSE';

        if (freezeStyle) {
            freezeStyle.remove();
            freezeStyle = null;
        }

        if (typeof gsap !== 'undefined' && gsap.globalTimeline) {
            gsap.globalTimeline.resume();
            const s = document.getElementById('debug-gsap-status');
            if (s) s.style.color = '#00b894';
        }

        resumeRAF();

        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
            const s = document.getElementById('debug-audio-status');
            if (s) s.style.color = '#00b894';
        }

        if (window.speechSynthesis) window.speechSynthesis.resume();
        document.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
    }

    pauseBtn.addEventListener('click', () => {
        if (isPaused) superResume();
        else superPause();
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            if (isPaused) superResume();
            else superPause();
        }
    });

    setTimeout(() => {
        const sr = document.getElementById('debug-raf-status');
        const sa = document.getElementById('debug-audio-status');
        const sg = document.getElementById('debug-gsap-status');
        
        if (sr) sr.style.color = '#00b894';
        if (sa) sa.style.color = typeof audioCtx !== 'undefined' ? '#00b894' : '#666';
        if (sg) sg.style.color = typeof gsap !== 'undefined' ? '#00b894' : '#666';
    }, 1000);

    console.log('[DEBUG] Module chargé. Ctrl+Shift+P pour pause/resume global.');
})();
