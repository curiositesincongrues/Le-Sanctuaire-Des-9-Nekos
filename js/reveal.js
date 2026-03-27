/* ============================================
   REVEAL.JS — Révélation et retour hub (Sprint 3.3)
   ============================================ */
(function () {
    const REVEAL_LINES = {
        Hanako: [
            "Le souffle de Hanako revient.",
            "Le sanctuaire retrouve sa douceur."
        ],
        Raijin: [
            "L'éclair de Raijin fend le silence.",
            "Le sanctuaire s'illumine à nouveau."
        ],
        Kagerou: [
            "Ce qui était invisible se révèle enfin.",
            "L'ombre de Kagerou s'efface."
        ],
        Amaterasu: [
            "La lumière d'Amaterasu se lève.",
            "Le sanctuaire renaît dans l'éclat."
        ],
        Tamamo: [
            "Une flamme ancienne renaît.",
            "Le sanctuaire s'embrase de vie."
        ],
        Goemon: [
            "La terre s'éveille en silence.",
            "Le sanctuaire devient plus fort."
        ],
        Mugen: [
            "Le voile des rêves se dissipe.",
            "Le chemin devient plus clair."
        ],
        Hibiki: [
            "Une onde traverse le sanctuaire.",
            "Les esprits répondent à l'appel."
        ],
        Yamato: [
            "La lame sacrée se relève.",
            "L'équilibre revient dans le sanctuaire."
        ]
    };

    function getRevealLines(guardian) {
        if (!guardian) return ["Le sanctuaire s'éveille.", "Une présence oubliée revient."];
        const mapped = REVEAL_LINES[guardian.n];
        if (mapped) return mapped;

        const fallback = String(guardian.discovery || '').trim();
        if (!fallback) return ["Le sanctuaire s'éveille.", `La présence de ${guardian.n} revient.`];

        const parts = fallback.split(/\.\.\.|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
        return [parts[0] || fallback, parts[1] || `La présence de ${guardian.n} revient.`];
    }

    function buildDiscoveryText(lines) {
        const [line1, line2] = Array.isArray(lines) ? lines : [String(lines || ''), ''];
        return `
            <p class="discovery-line discovery-line-1">${line1 || ''}</p>
            <p class="discovery-line discovery-line-2">${line2 || ''}</p>
        `;
    }

    function buildGuardianOverlay(idx, options = {}) {
        const g = guardianData[idx];
        const color = g.color || '#ffb7c5';
        const dark = g.dark || '#ff1493';
        const kanji = g.kanji || '';
        const lines = options.lines || getRevealLines(g);
        const ctaLabel = options.ctaLabel || "Retour au sanctuaire";
        const mode = options.mode || 'postwin';

        const old = document.getElementById('discovery-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'discovery-overlay';
        overlay.className = `discovery-overlay discovery-overlay-${mode}`;
        overlay.style.setProperty('--reveal-color', color);
        overlay.style.setProperty('--reveal-dark', dark);
        overlay.innerHTML = `
            <div class="discovery-bg"></div>
            <div class="discovery-kanji-bg">${kanji}</div>
            <div class="discovery-card">
                <div class="discovery-halo">
                    <div class="discovery-halo-ring"></div>
                    <div class="discovery-relic">${getRelicSVG(idx)}</div>
                </div>
                <div class="discovery-name">${g.n}</div>
                <div class="discovery-kanji-small">${kanji}</div>
                <div class="discovery-text">${buildDiscoveryText(lines)}</div>
                <button class="ritual-cta discovery-cta">${ctaLabel}</button>
            </div>
        `;
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('show');
            requestAnimationFrame(() => overlay.classList.add('staged'));
        });

        if (!(window.__silenceGameAudioUntilNextGame || window.__hubMusicActive)) {
            setTimeout(() => {
                try { playGameSFX('chime_portal'); } catch (e) {}
                if (navigator.vibrate) navigator.vibrate([60, 30, 90]);
            }, 180);
        }

        overlay.querySelector('.discovery-cta')?.addEventListener('click', () => {
            try { if (typeof stopAllGameAudioForHub === 'function') stopAllGameAudioForHub(); } catch (e) {}
            try { if (typeof playHubMusic === 'function') playHubMusic(); } catch (e) {}
            overlay.classList.remove('show', 'staged');
            setTimeout(() => {
                overlay.remove();
                if (typeof options.onContinue === 'function') options.onContinue();
            }, 320);
        });

        return overlay;
    }

    function showDiscoveryScreen(idx) {
        const guardian = guardianData[idx];
        const instruction = String(guardian?.instr || '').trim();
        const lines = instruction
            ? [instruction, "Relève l'épreuve pour réveiller le gardien."]
            : ["Le sanctuaire retient son souffle.", "Relève l'épreuve pour réveiller le gardien."];

        return buildGuardianOverlay(idx, {
            mode: 'challenge',
            lines,
            ctaLabel: "Que l'épreuve commence",
            onContinue: () => {
                stopScan();
                clearInterval(heartInterval);
                setupQuiz();
            }
        });
    }

    function showPostWinReveal(idx) {
        try { if (typeof stopAllGameAudioForHub === 'function') stopAllGameAudioForHub(); } catch (e) {}
        try { if (typeof playHubMusic === 'function') playHubMusic(); } catch (e) {}
        return buildGuardianOverlay(idx, {
            mode: 'postwin',
            lines: getRevealLines(guardianData[idx]),
            ctaLabel: 'Retour au sanctuaire',
            onContinue: () => animateSoulToHub(idx)
        });
    }

    function winGame() {
        console.log('[REVEAL] winGame appelé');
        const wonIndex = currentFound;
        foundGuardians.add(wonIndex);
        if (window.syncStateFromGlobals) syncStateFromGlobals();
        if (typeof saveProgress === 'function') saveProgress();
        window.ondevicemotion = null;
        document.body.ontouchstart = null;
        document.body.onmouseup = null;
        window._memTap = null;
        window.mem = null;
        cancelVoice();

        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            cancelAnimationFrame(micLoop);
            document.getElementById('mic-gauge')?.style.setProperty('display', 'none');
        }

        const arena = document.getElementById('game-arena');
        if (arena) arena.innerHTML = `<div class="win-relic-icon">${getRelicSVG(wonIndex)}</div>`;
        const instr = document.getElementById('game-instr');
        if (instr) instr.innerText = 'RÉUSSI !';
        setTimeout(() => {
            console.log('[REVEAL] foundGuardians.size =', foundGuardians.size);
            if (foundGuardians.size >= 9) {
                console.log('[REVEAL] → tier9 : forcer reset + checkMilestoneRewards');
                // IMPORTANT : tier9 peut être true dans le localStorage depuis une session précédente.
                // Si on ne le remet pas à false, unlockTier retourne false → enigme 3 sautée.
                if (window.GameState && window.GameState.bonusUnlocked) {
                    window.GameState.bonusUnlocked.tier9 = false;
                }
                const milestoneShown = window.RewardsModule && window.RewardsModule.checkMilestoneRewards
                    ? window.RewardsModule.checkMilestoneRewards()
                    : false;
                if (!milestoneShown) {
                    // enigmes.js non chargé ou autre souci → fallback cinématique directe
                    console.warn('[REVEAL] → launchFinalCinematic (fallback : milestone non affiché)');
                    launchFinalCinematic();
                }
            } else {
                console.log('[REVEAL] → showPostWinReveal');
                showPostWinReveal(wonIndex);
            }
        }, 1100);
    }

    function animateSoulToHub(idx) {
        transitionScreen('screen-hub');
        document.getElementById('miko-belt')?.classList.add('visible');
        
        setTimeout(() => {
            // TOUJOURS réafficher le bouton scanner (fix critique - DOIT être après transitionScreen)
            const btnScan = document.getElementById('btn-scan');
            if (btnScan) {
                btnScan.removeAttribute('style');
                btnScan.style.cssText = 'display: block !important; visibility: visible !important; pointer-events: auto !important;';
                console.log('[FIX] Bouton scan réaffiché');
            }
            
            const grid = document.getElementById('grid-nekos');
            if (!grid) return;
            grid.innerHTML = '';
            guardianData.forEach((g, i) => {
                const isUnlocked = foundGuardians.has(i) && i !== idx;
                const svgIcon = getRelicSVG(i);
                grid.innerHTML += `<div id="slot-${i}" class="slot ${isUnlocked ? 'unlocked' : 'locked'}" onclick="handleSlotClick(${i})">${svgIcon}</div>`;
            });

            const flyingSoul = document.createElement('div');
            flyingSoul.className = 'captured-soul';
            flyingSoul.innerHTML = getRelicSVG(idx);
            flyingSoul.style.color = 'var(--gold)';
            document.body.appendChild(flyingSoul);

            setTimeout(() => {
                const targetSlot = document.getElementById(`slot-${idx}`);
                if (!targetSlot) {
                    if (window.HubModule?.enterHub) window.HubModule.enterHub();
                    return;
                }
                const rect = targetSlot.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - window.innerWidth / 2;
                const y = rect.top + rect.height / 2 - window.innerHeight * 0.4;
                flyingSoul.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.5)`;

                setTimeout(() => {
                    flyingSoul.remove();
                    targetSlot.classList.add('unlocked', 'just-unlocked');
                    targetSlot.innerHTML = getRelicSVG(idx);
                    confetti({ particleCount: 80, colors: ['#ffd700', '#ffb7c5', '#ffffff'], origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight } });
                    playCorrect();
                    const foundCountEl = document.getElementById('found-count');
                    const progressBarEl = document.getElementById('hub-progress-bar');
                    if (foundCountEl) foundCountEl.innerText = foundGuardians.size;
                    if (progressBarEl) progressBarEl.style.width = (foundGuardians.size / 9 * 100) + '%';
                    document.documentElement.style.setProperty('--bg-lightness', (10 + (foundGuardians.size * 8)) + '%');
                    if (typeof playHubMusic === 'function') playHubMusic();
                    hubTimer = 0;
                    document.documentElement.style.setProperty('--darkness', 0);
                    if (heartInterval) clearInterval(heartInterval);
                    heartInterval = setInterval(updateHeartBeat, 1000);
                    updateMikoBelt();
                    if (window.syncStateFromGlobals) syncStateFromGlobals();
                    if (typeof saveProgress === 'function') saveProgress();
                    
                    // FIX FINAL : Réafficher le bouton après TOUTES les animations
                    const btnScanFinal = document.getElementById('btn-scan');
                    if (btnScanFinal) {
                        btnScanFinal.removeAttribute('style');
                        btnScanFinal.style.cssText = 'display: block !important; visibility: visible !important; pointer-events: auto !important;';
                        console.log('[FIX FINAL] Bouton scan réaffiché après animation');
                    }
                    
                    if (window.RewardsModule?.checkMilestoneRewards) {
                        setTimeout(() => window.RewardsModule.checkMilestoneRewards(), 450);
                    }
                    setTimeout(() => targetSlot.classList.remove('just-unlocked'), 700);
                }, 1000);
            }, 100);
        }, 600);
    }

    function setOutroMood(mood) {
        if (window.setSakuraMood) window.setSakuraMood(mood);
    }

    window.RevealModule = {
        showDiscoveryScreen,
        showPostWinReveal,
        winGame,
        animateSoulToHub,
        setOutroMood,
    };
})();
