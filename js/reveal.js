/* ============================================
   REVEAL.JS — Révélation et retour hub (Sprint 2)
   ============================================ */
(function () {
    function buildGuardianOverlay(idx, options = {}) {
        const g = guardianData[idx];
        const color = g.color || '#ffb7c5';
        const dark = g.dark || '#ff1493';
        const kanji = g.kanji || '';
        const text = options.text || g.discovery || `L'âme de ${g.n} est libérée...`;
        const ctaLabel = options.ctaLabel || "✨ Continuer";

        const old = document.getElementById('discovery-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'discovery-overlay';
        overlay.className = 'discovery-overlay';
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
                <div class="discovery-text"></div>
                <button class="ritual-cta discovery-cta">${ctaLabel}</button>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        setTimeout(() => {
            try { playGameSFX('chime_portal'); } catch (e) {}
            if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
        }, 350);

        const textEl = overlay.querySelector('.discovery-text');
        setTimeout(() => {
            let i = 0;
            const chars = String(text).split('');
            const tw = setInterval(() => {
                if (!textEl) return clearInterval(tw);
                textEl.textContent += chars[i] || '';
                i++;
                if (i >= chars.length) clearInterval(tw);
            }, 26);
        }, 900);

        overlay.querySelector('.discovery-cta')?.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                if (typeof options.onContinue === 'function') options.onContinue();
            }, 320);
        });

        return overlay;
    }

    function showDiscoveryScreen(idx) {
        return buildGuardianOverlay(idx, {
            ctaLabel: "✨ Que l'épreuve commence...",
            onContinue: () => {
                stopScan();
                clearInterval(heartInterval);
                setupQuiz();
            }
        });
    }

    function showPostWinReveal(idx) {
        return buildGuardianOverlay(idx, {
            text: guardianData[idx].discovery || `L'âme de ${guardianData[idx].n} est libérée...`,
            ctaLabel: '✨ Retour au sanctuaire',
            onContinue: () => animateSoulToHub(idx)
        });
    }



    function winGame() {
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
            if (foundGuardians.size >= 9) launchFinalCinematic();
            else showPostWinReveal(wonIndex);
        }, 1100);
    }

    function animateSoulToHub(idx) {
        transitionScreen('screen-hub');
        document.getElementById('miko-belt')?.classList.add('visible');
        setTimeout(() => {
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
                    updateDynamicMusic();
                    hubTimer = 0;
                    document.documentElement.style.setProperty('--darkness', 0);
                    if (heartInterval) clearInterval(heartInterval);
                    heartInterval = setInterval(updateHeartBeat, 1000);
                    updateMikoBelt();
                    if (window.syncStateFromGlobals) syncStateFromGlobals();
                    if (typeof saveProgress === 'function') saveProgress();
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
