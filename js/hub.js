/* ============================================
   HUB.JS — Hub sanctuaire extrait (Sprint 2)
   ============================================ */
(function () {
    let tooltipTimeout = null;
    let ritualTapCount = 0;
    let ritualLastTapAt = 0;
    let ritualOverlayEl = null;

    function updateHeartBeat() {
        hubTimer++;
        const heart = document.getElementById('shadow-heart');
        if (!heart) return;
        const beatSpeed = Math.max(0.2, 1 - (hubTimer / 60));
        const scale = 1 + (hubTimer / 100);
        heart.style.animation = `pulse-core ${beatSpeed}s infinite alternate`;
        heart.style.transform = `scale(${scale})`;

        document.documentElement.style.setProperty('--darkness', 0);
        if (hubTimer % Math.ceil(beatSpeed * 2) === 0) playGameSFX('heartbeat');
    }

    function enterHub() {
        const sealParam = urlParams.get('seal');
        if (sealParam) {
            const sealIdx = guardianData.findIndex(g => g.qr === sealParam);
            if (sealIdx !== -1 && !foundGuardians.has(sealIdx)) {
                currentFound = sealIdx;
                if (window.syncStateFromGlobals) syncStateFromGlobals();
                urlParams.delete('seal');
                window.history.replaceState({}, '', window.location.pathname);
                transitionScreen('screen-hub');
                setTimeout(() => {
                    clearInterval(heartInterval);
                    setupQuiz();
                }, 1200);
                return;
            } else if (sealIdx !== -1 && foundGuardians.has(sealIdx)) {
                urlParams.delete('seal');
                window.history.replaceState({}, '', window.location.pathname);
            }
        }

        transitionScreen('screen-hub');
        
        // TOUJOURS réafficher le bouton scanner (fix bug où il disparaît)
        const btnScan = document.getElementById('btn-scan');
        if (btnScan) {
            btnScan.removeAttribute('style');
            btnScan.style.cssText = 'display: block !important; visibility: visible !important; pointer-events: auto !important;';
        }

        bindHiddenRitualTrigger();
        const grid = document.getElementById('grid-nekos');
        if (!grid) return;
        grid.innerHTML = "";
        guardianData.forEach((g, i) => {
            const isUnlocked = foundGuardians.has(i);
            const svgIcon = getRelicSVG(i);
            grid.innerHTML += `<div id="slot-${i}" class="slot ${isUnlocked ? 'unlocked' : 'locked'}" onclick="handleSlotClick(${i})">${svgIcon}</div>`;
        });

        const foundCountEl = document.getElementById('found-count');
        const progressBarEl = document.getElementById('hub-progress-bar');
        if (foundCountEl) foundCountEl.innerText = foundGuardians.size;
        if (progressBarEl) progressBarEl.style.width = (foundGuardians.size / 9 * 100) + "%";

        updateMikoBelt();
        document.getElementById('miko-belt')?.classList.add('visible');

        // Musique hub MP3 — remplace la musique procédurale
        if (typeof playHubMusic === 'function') playHubMusic();
        document.documentElement.style.setProperty('--bg-lightness', (10 + (foundGuardians.size * 8)) + '%');
        if (window.RewardsModule?.applyShrineVisualState) window.RewardsModule.applyShrineVisualState();
        hubTimer = 0;
        document.documentElement.style.setProperty('--darkness', 0);
        document.getElementById('shadow-heart')?.style.setProperty('transform', 'scale(1)');
        if (heartInterval) clearInterval(heartInterval);
        heartInterval = setInterval(updateHeartBeat, 1000);
        if (!window.needleInterval) {
            window.needleInterval = setInterval(() => {
                if (!hasGyro) {
                    const needle = document.getElementById('needle-gold');
                    if (needle) needle.style.transform = `rotate(${Math.sin(Date.now() / 500) * 35}deg)`;
                }
            }, 50);
        }
        if (window.syncStateFromGlobals) syncStateFromGlobals();
    }

    function updateMikoBelt() {
        const belt = document.getElementById('miko-belt');
        if (!belt) return;
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
        if (!foundGuardians.has(idx)) {
            currentFound = idx;
            if (window.syncStateFromGlobals) syncStateFromGlobals();
            clearInterval(heartInterval);
            startScan();
        } else {
            showBeltTooltip(document.getElementById(`slot-${idx}`), idx);
        }
    }



    function getRitualTrigger() {
        return document.getElementById('compass-sakura-trigger');
    }

    function closeResetRitual() {
        if (ritualOverlayEl && ritualOverlayEl.parentNode) ritualOverlayEl.parentNode.removeChild(ritualOverlayEl);
        ritualOverlayEl = null;
    }

    async function handleRitualAction(action) {
        if (action === 'purify') {
            try { if (typeof playGameSFX === 'function') playGameSFX('correct'); } catch (_) {}
            if (typeof resetProgress === 'function') resetProgress();
            closeResetRitual();
            if (window.enterHub) window.enterHub();
            else enterHub();
            return;
        }
        if (action === 'refresh') {
            try { if (typeof playGameSFX === 'function') playGameSFX('correct'); } catch (_) {}
            if (typeof resetWorldState === 'function') await resetWorldState();
            window.location.href = window.location.pathname + '?v=' + Date.now();
            return;
        }
        closeResetRitual();
    }

    function openResetRitual() {
        closeResetRitual();
        const overlay = document.createElement('div');
        overlay.className = 'debug-ritual-overlay';
        overlay.innerHTML = `
            <div class="debug-ritual-panel" role="dialog" aria-modal="true" aria-labelledby="ritual-reset-title">
                <div class="debug-ritual-kanji">再生</div>
                <h3 id="ritual-reset-title" class="debug-ritual-title">Rituel de Réinitialisation</h3>
                <p class="debug-ritual-copy">Le sanctuaire peut être purifié pour recommencer l'aventure depuis le début.</p>
                <p class="debug-ritual-note">Purifier le sanctuaire efface la progression. Rafraîchir le monde efface aussi les anciens caches avant de relancer le jeu.</p>
                <div class="debug-ritual-actions">
                    <button class="debug-ritual-btn debug-ritual-btn--purify" data-ritual-action="purify">Purifier le sanctuaire</button>
                    <button class="debug-ritual-btn debug-ritual-btn--refresh" data-ritual-action="refresh">Rafraîchir le monde</button>
                    <button class="debug-ritual-btn debug-ritual-btn--close" data-ritual-action="close">Fermer</button>
                </div>
            </div>`;
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) closeResetRitual();
        });
        overlay.querySelectorAll('[data-ritual-action]').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const action = ev.currentTarget.getAttribute('data-ritual-action');
                handleRitualAction(action);
            });
        });
        document.body.appendChild(overlay);
        ritualOverlayEl = overlay;
    }

    function registerRitualTap() {
        const now = Date.now();
        ritualTapCount = (now - ritualLastTapAt <= 800) ? (ritualTapCount + 1) : 1;
        ritualLastTapAt = now;

        const trigger = getRitualTrigger();
        if (trigger) {
            trigger.classList.remove('ritual-armed');
            void trigger.offsetWidth;
            trigger.classList.add('ritual-armed');
        }

        if (ritualTapCount >= 10) {
            ritualTapCount = 0;
            ritualLastTapAt = 0;
            openResetRitual();
        }
    }

    function bindHiddenRitualTrigger() {
        const trigger = getRitualTrigger();
        if (!trigger || trigger.dataset.ritualBound === '1') return;
        trigger.dataset.ritualBound = '1';
        trigger.addEventListener('click', registerRitualTap);
        trigger.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                registerRitualTap();
            }
        });
    }

    window.HubModule = {
        updateHeartBeat,
        enterHub,
        updateMikoBelt,
        showBeltTooltip,
        handleSlotClick,
        openResetRitual,
        closeResetRitual,
    };

    window.openResetRitual = openResetRitual;
    window.closeResetRitual = closeResetRitual;
})();
