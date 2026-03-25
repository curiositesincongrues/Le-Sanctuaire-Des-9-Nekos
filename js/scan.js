/* ============================================
   SCAN.JS — Scanner QR extrait (Sprint 2)
   ============================================ */
(function () {
    let scanTimeout = null;
    let scanTimeout2 = null;
    let torchTrack = null;

    function clearScanTimers() {
        clearTimeout(scanTimeout);
        clearTimeout(scanTimeout2);
        scanTimeout = null;
        scanTimeout2 = null;
    }

    async function ensureQrLibLoaded() {
        if (typeof Html5Qrcode !== 'undefined') return true;
        try {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://unpkg.com/html5-qrcode';
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
            console.log('[Scan] html5-qrcode chargé à la demande');
            return true;
        } catch (e) {
            console.error('[Scan] Impossible de charger html5-qrcode');
            return false;
        }
    }

    async function startScan() {
        console.log('[Scan] Démarrage du scan...');

        if (TEST_MODE) {
            console.log('[Scan] Mode TEST activé - bypass caméra');
            const btn = document.getElementById('btn-scan');
            if (btn) btn.style.display = 'none';
            setTimeout(() => {
                playGameSFX('pop');
                const flash = document.getElementById('flash');
                if (flash) {
                    flash.style.background = 'white';
                    flash.style.opacity = 1;
                }
                setTimeout(() => {
                    if (flash) flash.style.opacity = 0;
                    clearInterval(heartInterval);
                    setupQuiz();
                }, 500);
            }, 1000);
            return;
        }

        const loaded = await ensureQrLibLoaded();
        if (!loaded) {
            showManualEntry();
            return;
        }

        if (window.cameraPermission === 'denied') {
            console.log('[Scan] Permission caméra refusée - mode manuel');
            showManualEntry();
            return;
        }

        console.log('[Scan] Activation mode AR...');
        document.body.classList.add('ar-mode');
        document.getElementById('btn-scan')?.style.setProperty('display', 'none');
        document.getElementById('btn-cancel-scan')?.style.setProperty('display', 'block');

        const overlay = document.getElementById('scan-overlay');
        const circle = overlay?.querySelector('.scan-circle');
        circle?.classList.remove('scan-success', 'scan-wrong');
        circle?.classList.add('scan-active');
        const status = document.getElementById('scan-status');
        if (status) status.textContent = 'Le miroir cherche les sceaux cachés...';
        document.getElementById('manual-entry')?.style.setProperty('display', 'none');
        document.getElementById('scan-result')?.style.setProperty('display', 'none');
        document.getElementById('btn-manual')?.style.setProperty('display', 'none');

        try {
            if (!html5QrcodeScanner) {
                console.log('[Scan] Création du scanner Html5Qrcode...');
                html5QrcodeScanner = new Html5Qrcode('qr-reader');
            }

            console.log('[Scan] Démarrage de la caméra...');
            html5QrcodeScanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: 250, aspectRatio: 1 },
                async (decodedText) => {
                    console.log('[Scan] QR détecté:', decodedText);
                    clearScanTimers();

                    const extractSeal = (text) => {
                        try {
                            const u = new URL(text);
                            return u.searchParams.get('seal') || text;
                        } catch (e) {
                            return text;
                        }
                    };

                    const scannedSeal = extractSeal(decodedText);
                    const scannedIdx = guardianData.findIndex(g => g.qr === scannedSeal);
                    if (scannedIdx !== -1 && !foundGuardians.has(scannedIdx)) {
                        currentFound = scannedIdx;
                        if (window.syncStateFromGlobals) syncStateFromGlobals();
                    }

                    if (scannedSeal === guardianData[currentFound].qr && !foundGuardians.has(currentFound)) {
                        circle?.classList.remove('scan-active');
                        circle?.classList.add('scan-success');

                        playGameSFX('pop');
                        playMikoChime(currentFound);
                        if (navigator.vibrate) navigator.vibrate([50, 30, 100]);

                        if (status) status.textContent = '✦ Sceau déchiffré ! ✦';
                        showDiscoveryScreen(currentFound);

                        const flash = document.getElementById('flash');
                        if (flash) {
                            flash.style.background = 'rgba(255,215,0,0.6)';
                            flash.style.opacity = 1;
                            setTimeout(() => {
                                flash.style.opacity = 0;
                                flash.style.background = 'transparent';
                            }, 400);
                        }

                        // Sprint 2: on laisse l’overlay de découverte piloter l’entrée dans l’épreuve.
                        stopScan();
                    } else {
                        circle?.classList.add('scan-wrong');
                        playWrong();
                        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                        if (status) status.textContent = 'Ce n\'est pas le bon sceau... Continuez de chercher !';
                        setTimeout(() => circle?.classList.remove('scan-wrong'), 500);
                    }
                }
            ).then(() => {
                console.log('[Scan] Caméra démarrée avec succès!');
            }).catch(err => {
                console.error('[Scan] Erreur démarrage caméra:', err);
                if (status) status.textContent = 'Le miroir ne s\'ouvre pas...';
                showManualEntry();
            });
        } catch (e) {
            console.error('[Scan] Exception:', e);
            showManualEntry();
        }

        scanTimeout = setTimeout(() => {
            const status = document.getElementById('scan-status');
            if (status) status.textContent = 'Le sceau résiste... Essayez de l\'éclairer.';
            document.getElementById('btn-torch')?.style.setProperty('display', 'inline-block');
        }, 15000);

        scanTimeout2 = setTimeout(() => {
            const status = document.getElementById('scan-status');
            if (status) status.textContent = 'Le miroir peine à lire ce sceau...';
            document.getElementById('btn-manual')?.style.setProperty('display', 'inline-block');
        }, 30000);
    }

    function stopScan() {
        clearScanTimers();
        document.body.classList.remove('ar-mode');
        document.getElementById('btn-scan')?.style.setProperty('display', 'block');
        document.getElementById('btn-cancel-scan')?.style.setProperty('display', 'none');
        if (torchTrack) {
            torchTrack.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
            torchTrack = null;
        }
        if (html5QrcodeScanner) html5QrcodeScanner.stop().catch(e => console.log(e));
    }

    function toggleTorch() {
        if (!html5QrcodeScanner) return;
        try {
            const videoElement = document.querySelector('#qr-reader video');
            if (videoElement && videoElement.srcObject) {
                const track = videoElement.srcObject.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities();
                    if (capabilities.torch) {
                        const isOn = torchTrack !== null;
                        track.applyConstraints({ advanced: [{ torch: !isOn }] });
                        torchTrack = isOn ? null : track;
                        const btnTorch = document.getElementById('btn-torch');
                        if (btnTorch) btnTorch.textContent = isOn ? '🔦 Éclairer' : '🔦 Éteindre';
                    } else {
                        const btnTorch = document.getElementById('btn-torch');
                        if (btnTorch) btnTorch.textContent = '🔦 Non supporté';
                    }
                }
            }
        } catch (e) {
            console.log('[Torch] Erreur:', e);
        }
    }

    function showManualEntry() {
        document.getElementById('manual-entry')?.style.setProperty('display', 'block');
        const input = document.getElementById('manual-code');
        if (input) {
            input.value = '';
            input.focus();
        }
        const status = document.getElementById('scan-status');
        if (status) status.textContent = 'Entrez le code inscrit sous le sceau :';
    }

    function submitManualCode() {
        const input = document.getElementById('manual-code');
        const code = input?.value.trim().toUpperCase();
        if (!code) return;

        const manualIdx = guardianData.findIndex(g => g.qr === code || g.qr.toUpperCase() === code);
        if (manualIdx !== -1 && !foundGuardians.has(manualIdx)) {
            currentFound = manualIdx;
            if (window.syncStateFromGlobals) syncStateFromGlobals();
        }

        if (code === guardianData[currentFound].qr || code === guardianData[currentFound].qr.toUpperCase()) {
            playGameSFX('pop');
            playMikoChime(currentFound);
            if (navigator.vibrate) navigator.vibrate([50, 30, 100]);

            const flash = document.getElementById('flash');
            if (flash) {
                flash.style.background = 'rgba(255,215,0,0.6)';
                flash.style.opacity = 1;
                setTimeout(() => {
                    flash.style.opacity = 0;
                    flash.style.background = 'transparent';
                }, 400);
            }

            document.getElementById('manual-entry')?.style.setProperty('display', 'none');
            const status = document.getElementById('scan-status');
            if (status) status.textContent = '✦ Sceau déchiffré ! ✦';

            setTimeout(() => {
                stopScan();
                clearInterval(heartInterval);
                setupQuiz();
            }, 1000);
        } else {
            playWrong();
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            if (input) {
                input.value = '';
                input.style.borderColor = '#ff4444';
                setTimeout(() => {
                    input.style.borderColor = 'var(--gold)';
                }, 500);
            }
        }
    }

    window.ScanModule = {
        startScan,
        stopScan,
        toggleTorch,
        showManualEntry,
        submitManualCode,
    };
})();
