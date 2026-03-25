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



    window.resetWorldState = async function resetWorldState() {
        const ok = window.resetProgress ? window.resetProgress() : false;
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
        } catch (err) {
            console.warn('[Storage] cache reset failed:', err);
        }
        try {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }
        } catch (err) {
            console.warn('[Storage] service worker reset failed:', err);
        }
        return ok;
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
                    bonusUnlocked: { tier3: false, tier6: false, tier9: false },
                    assistsAvailable: 0,
                    shrineLevel: 0,
                    attemptMap: {}
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
