/* ============================================
   HUB.JS — Hub sanctuaire extrait (Sprint 2)
   ============================================ */
(function () {
    let tooltipTimeout = null;

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

        updateDynamicMusic();
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

    window.HubModule = {
        updateHeartBeat,
        enterHub,
        updateMikoBelt,
        showBeltTooltip,
        handleSlotClick,
    };
})();
