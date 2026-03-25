/* ============================================
   STATE.JS — État global centralisé (Sprint 1)
   ============================================ */
(function () {
    const defaultState = {
        currentFound: 0,
        foundGuardians: [],
        hpOni: 0,
        currentGuardianId: null,
        hasBooted: false,
        isAudioReady: false,
        bonusUnlocked: {
            tier3: false,
            tier6: false,
            tier9: false
        },
        assistsAvailable: 0,
        shrineLevel: 0,
        attemptMap: {}
    };

    const state = window.GameState = Object.assign({}, defaultState, window.GameState || {});

    function normalizeState() {
        state.currentFound = Number.isFinite(Number(state.currentFound)) ? Number(state.currentFound) : 0;
        state.hpOni = Number.isFinite(Number(state.hpOni)) ? Number(state.hpOni) : 0;
        if (state.foundGuardians instanceof Set) {
            state.foundGuardians = Array.from(state.foundGuardians);
        }
        if (!Array.isArray(state.foundGuardians)) state.foundGuardians = [];
        state.foundGuardians = [...new Set(state.foundGuardians.map(v => Number(v)).filter(Number.isFinite))];
        if (!state.bonusUnlocked || typeof state.bonusUnlocked !== 'object') {
            state.bonusUnlocked = { tier3: false, tier6: false, tier9: false };
        }
        state.bonusUnlocked = {
            tier3: !!state.bonusUnlocked.tier3,
            tier6: !!state.bonusUnlocked.tier6,
            tier9: !!state.bonusUnlocked.tier9
        };
        state.assistsAvailable = Number.isFinite(Number(state.assistsAvailable)) ? Math.max(0, Number(state.assistsAvailable)) : 0;
        state.shrineLevel = Number.isFinite(Number(state.shrineLevel)) ? Math.max(0, Number(state.shrineLevel)) : 0;
        if (!state.attemptMap || typeof state.attemptMap !== 'object' || Array.isArray(state.attemptMap)) state.attemptMap = {};
    }

    normalizeState();

    window.getSerializableState = function getSerializableState() {
        normalizeState();
        return {
            currentFound: state.currentFound,
            foundGuardians: [...state.foundGuardians],
            hpOni: state.hpOni,
            currentGuardianId: state.currentGuardianId || null,
            bonusUnlocked: { ...state.bonusUnlocked },
            assistsAvailable: state.assistsAvailable,
            shrineLevel: state.shrineLevel,
            attemptMap: { ...state.attemptMap }
        };
    };

    window.hydrateState = function hydrateState(data) {
        if (!data || typeof data !== 'object') return;
        state.currentFound = data.currentFound;
        state.foundGuardians = data.foundGuardians;
        state.hpOni = data.hpOni;
        state.currentGuardianId = data.currentGuardianId || null;
        state.bonusUnlocked = data.bonusUnlocked || state.bonusUnlocked;
        state.assistsAvailable = data.assistsAvailable;
        state.shrineLevel = data.shrineLevel;
        state.attemptMap = data.attemptMap || state.attemptMap;
        normalizeState();
    };

    window.syncStateFromGlobals = function syncStateFromGlobals() {
        try {
            if (typeof currentFound !== 'undefined') state.currentFound = Number(currentFound) || 0;
            if (typeof foundGuardians !== 'undefined' && foundGuardians instanceof Set) {
                state.foundGuardians = Array.from(foundGuardians);
            }
            if (typeof hpOni !== 'undefined') state.hpOni = Number(hpOni) || 0;
        } catch (err) {
            console.warn('[State] syncStateFromGlobals failed:', err);
        }
        normalizeState();
    };

    window.syncGlobalsFromState = function syncGlobalsFromState() {
        try {
            if (typeof currentFound !== 'undefined') currentFound = Number(state.currentFound) || 0;
            if (typeof foundGuardians !== 'undefined') foundGuardians = new Set(state.foundGuardians || []);
            if (typeof hpOni !== 'undefined') hpOni = Number(state.hpOni) || 0;
        } catch (err) {
            console.warn('[State] syncGlobalsFromState failed:', err);
        }
    };
})();
