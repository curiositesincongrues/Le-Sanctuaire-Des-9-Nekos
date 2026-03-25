/* ============================================
   REWARDS.JS — Paliers 3/6/9 + aides enfant (Sprint 3)
   ============================================ */
(function () {
    const rewardDefs = {
        tier3: {
            threshold: 3,
            title: 'Charme des Lueurs',
            subtitle: 'Le Sanctuaire répond à votre courage',
            body: 'Vous débloquez des lueurs d\'aide pour guider les prochaines épreuves. Le sanctuaire scintille davantage et un indice doux pourra apparaître quand un enfant bloque.',
            assists: 2,
            shrineLevel: 1,
            theme: 'rose'
        },
        tier6: {
            threshold: 6,
            title: 'Souffle des Esprits',
            subtitle: 'Les gardiens vous murmurent leurs secrets',
            body: 'Le sanctuaire devient plus vivant. Après plusieurs erreurs, une aide plus claire peut maintenant apparaître pour garder le plaisir de jouer.',
            assists: 3,
            shrineLevel: 2,
            theme: 'gold'
        },
        tier9: {
            threshold: 9,
            title: 'Estampe Vivante',
            subtitle: 'Les 9 gardiens sont éveillés',
            body: 'Le sanctuaire entier s\'ouvre à vous. Le chemin vers le final devient digne d\'une légende.',
            assists: 0,
            shrineLevel: 3,
            theme: 'violet'
        }
    };

    function getState() {
        return window.GameState || null;
    }

    function save() {
        try {
            if (typeof syncGlobalsFromState === 'function') syncGlobalsFromState();
            if (typeof saveProgress === 'function') saveProgress();
        } catch (err) {
            console.warn('[Rewards] save failed:', err);
        }
    }

    function showRewardOverlay(def) {
        const old = document.getElementById('milestone-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'milestone-overlay';
        overlay.className = `milestone-overlay theme-${def.theme}`;
        overlay.innerHTML = `
            <div class="milestone-backdrop"></div>
            <div class="milestone-panel">
                <div class="milestone-badge">BONUS DÉBLOQUÉ</div>
                <div class="milestone-title">${def.title}</div>
                <div class="milestone-subtitle">${def.subtitle}</div>
                <div class="milestone-body">${def.body}</div>
                <button class="ritual-cta milestone-cta">Continuer l'aventure</button>
            </div>
        `;
        document.body.appendChild(overlay);

        requestAnimationFrame(() => overlay.classList.add('show'));
        try { if (typeof playGameSFX === 'function') playGameSFX('chime_portal'); } catch (e) {}
        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);

        overlay.querySelector('.milestone-cta')?.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 280);
        });
    }

    function unlockTier(key) {
        const state = getState();
        const def = rewardDefs[key];
        if (!state || !def || state.bonusUnlocked[key]) return false;

        state.bonusUnlocked[key] = true;
        state.assistsAvailable = (state.assistsAvailable || 0) + def.assists;
        state.shrineLevel = Math.max(state.shrineLevel || 0, def.shrineLevel);
        applyShrineVisualState();
        save();
        showRewardOverlay(def);
        return true;
    }

    function checkMilestoneRewards() {
        const state = getState();
        if (!state) return false;
        const count = (state.foundGuardians || []).length;
        let unlocked = false;
        if (count >= 3) unlocked = unlockTier('tier3') || unlocked;
        if (count >= 6) unlocked = unlockTier('tier6') || unlocked;
        if (count >= 9) unlocked = unlockTier('tier9') || unlocked;
        return unlocked;
    }

    function applyShrineVisualState() {
        const state = getState();
        const level = state?.shrineLevel || 0;
        document.documentElement.dataset.shrineLevel = String(level);
        document.body?.classList.toggle('shrine-tier-1', level >= 1);
        document.body?.classList.toggle('shrine-tier-2', level >= 2);
        document.body?.classList.toggle('shrine-tier-3', level >= 3);
    }

    function markFailureForGuardian(guardianIndex) {
        const state = getState();
        if (!state) return 0;
        const key = String(guardianIndex);
        state.attemptMap[key] = Number(state.attemptMap[key] || 0) + 1;
        save();
        return state.attemptMap[key];
    }

    function clearFailuresForGuardian(guardianIndex) {
        const state = getState();
        if (!state) return;
        const key = String(guardianIndex);
        delete state.attemptMap[key];
        save();
    }

    function getFailureCount(guardianIndex) {
        const state = getState();
        if (!state) return 0;
        return Number(state.attemptMap[String(guardianIndex)] || 0);
    }

    function getAssistMessage(guardianIndex) {
        const state = getState();
        const failures = getFailureCount(guardianIndex);
        const guardian = window.guardianData?.[guardianIndex];
        if (!guardian) return '';

        if (failures >= 3) {
            const correct = guardian.a?.[guardian.r];
            if (correct) return `Indice du sanctuaire : la bonne réponse commence à briller... Cherche « ${correct} ». `;
            return `Indice du sanctuaire : relis calmement la question, la vraie réponse va bientôt se révéler.`;
        }
        if (failures >= 2 && (state?.bonusUnlocked?.tier3 || state?.bonusUnlocked?.tier6)) {
            return 'Les lueurs du sanctuaire t’aident : observe la réponse la plus lumineuse.';
        }
        if (failures >= 1 && state?.bonusUnlocked?.tier6) {
            return 'Souffle des Esprits : prends ton temps, une aide apparaîtra si besoin.';
        }
        return '';
    }

    function renderQuizAssist(guardianIndex) {
        const msg = getAssistMessage(guardianIndex);
        const host = document.getElementById('quiz-assist');
        if (!host) return;
        host.textContent = msg;
        host.classList.toggle('visible', !!msg);

        const failures = getFailureCount(guardianIndex);
        if (failures >= 2) {
            const correct = window.guardianData?.[guardianIndex]?.r;
            const el = document.getElementById(`opt-${correct}`);
            if (el) el.classList.add(failures >= 3 ? 'option-guided-strong' : 'option-guided');
        }
    }

    window.RewardsModule = {
        checkMilestoneRewards,
        applyShrineVisualState,
        markFailureForGuardian,
        clearFailuresForGuardian,
        getFailureCount,
        renderQuizAssist
    };
})();
