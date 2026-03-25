/* ============================================
   STORAGE.JS — Sauvegarde robuste (Sprint 1)
   ============================================ */
(function () {
    const SAVE_KEY = 'sanctuaire-save-v1';

    window.saveProgress = function saveProgress() {
        try {
            if (typeof syncStateFromGlobals === 'function') syncStateFromGlobals();
            const payload = typeof getSerializableState === 'function' ? getSerializableState() : null;
            if (!payload) return false;
            localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
            return true;
        } catch (err) {
            console.warn('[Storage] saveProgress failed:', err);
            return false;
        }
    };

    window.loadProgress = function loadProgress() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            if (typeof hydrateState === 'function') hydrateState(parsed);
            if (typeof syncGlobalsFromState === 'function') syncGlobalsFromState();
            return true;
        } catch (err) {
            console.warn('[Storage] loadProgress failed:', err);
            return false;
        }
    };

    window.resetProgress = function resetProgress() {
        try {
            localStorage.removeItem(SAVE_KEY);
            if (typeof hydrateState === 'function') {
                hydrateState({
                    currentFound: 0,
                    foundGuardians: [],
                    hpOni: 0,
                    currentGuardianId: null,
                    bonusUnlocked: { tier3: false, tier6: false, tier9: false }
                });
            }
            if (typeof syncGlobalsFromState === 'function') syncGlobalsFromState();
            return true;
        } catch (err) {
            console.warn('[Storage] resetProgress failed:', err);
            return false;
        }
    };
})();
