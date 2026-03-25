/* ============================================
   APP.JS — Bootstrap stable (Sprint 1)
   ============================================ */
(function () {
    let audioUnlockInstalled = false;

    function updateAudioReadyFlag() {
        try {
            const ready = typeof audioCtx !== 'undefined' && !!audioCtx;
            if (window.GameState) GameState.isAudioReady = ready;
            return ready;
        } catch (_) {
            return false;
        }
    }

    function ensureAudioReady() {
        try {
            if (typeof initAudio === 'function') {
                initAudio();
            } else if (typeof initSfx === 'function') {
                initSfx();
            }
            if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
        } catch (err) {
            console.warn('[App] Audio init failed:', err);
        }
        updateAudioReadyFlag();
    }

    function installAudioUnlock() {
        if (audioUnlockInstalled) return;
        audioUnlockInstalled = true;

        const unlock = () => {
            ensureAudioReady();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('pointerdown', unlock, { once: true, passive: true });
        window.addEventListener('touchstart', unlock, { once: true, passive: true });
        window.addEventListener('keydown', unlock, { once: true });
    }

    function bindLifecycleEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (typeof saveProgress === 'function') saveProgress();
                return;
            }
            try {
                if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume().catch(() => {});
                }
            } catch (_) {}
        });

        window.addEventListener('pagehide', () => {
            if (typeof saveProgress === 'function') saveProgress();
        });

        window.addEventListener('beforeunload', () => {
            if (typeof saveProgress === 'function') saveProgress();
        });
    }

    function restoreProgressSafe() {
        try {
            const restored = typeof loadProgress === 'function' ? loadProgress() : false;
            if (restored) {
                console.log('[App] Progression restaurée');
            }
        } catch (err) {
            console.warn('[App] Restore failed:', err);
        }
    }

    window.bootApp = function bootApp() {
        if (window.GameState && GameState.hasBooted) return;
        if (window.GameState) GameState.hasBooted = true;

        restoreProgressSafe();
        bindLifecycleEvents();
        installAudioUnlock();
        updateAudioReadyFlag();

        console.log('[App] Sanctuaire boot OK');
    };
})();
