/* ============================================
   SCAN.JS — Scanner QR avec Zoom & Ambiance Ghibli
   Version 2.1 — Style Kawaii
   ============================================ */
(function () {
    let scanTimeout = null;
    let scanTimeout2 = null;
    
    // === ZOOM STATE ===
    let currentZoom = 1;
    let minZoom = 1;
    let maxZoom = 3;
    let initialPinchDistance = null;
    let initialZoom = 1;
    let videoTrack = null;
    let supportsNativeZoom = false;
    let zoomCapabilities = null;

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

    // === ZOOM FUNCTIONS ===
    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function updateZoomIndicator(zoom) {
        const indicator = document.getElementById('zoom-indicator');
        const fill = document.getElementById('zoom-fill');
        if (!indicator || !fill) return;
        
        const percentage = ((zoom - minZoom) / (maxZoom - minZoom)) * 100;
        fill.style.width = `${percentage}%`;
        
        // Show indicator
        indicator.classList.add('visible');
        
        // Hide after delay
        clearTimeout(indicator._hideTimeout);
        indicator._hideTimeout = setTimeout(() => {
            indicator.classList.remove('visible');
        }, 1500);
    }

    async function applyZoom(zoom) {
        currentZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
        
        if (supportsNativeZoom && videoTrack && zoomCapabilities) {
            // Native camera zoom (best quality)
            try {
                const nativeZoom = zoomCapabilities.min + 
                    (currentZoom - 1) / (maxZoom - 1) * (zoomCapabilities.max - zoomCapabilities.min);
                await videoTrack.applyConstraints({
                    advanced: [{ zoom: Math.min(nativeZoom, zoomCapabilities.max) }]
                });
            } catch (e) {
                console.log('[Zoom] Native zoom failed, using CSS fallback');
                applyCSSZoom(currentZoom);
            }
        } else {
            // CSS transform fallback
            applyCSSZoom(currentZoom);
        }
        
        updateZoomIndicator(currentZoom);
    }

    function applyCSSZoom(zoom) {
        const video = document.querySelector('#qr-reader video');
        if (video) {
            video.style.transform = `scale(${zoom})`;
            video.style.transformOrigin = 'center center';
        }
    }

    function setupZoomGestures() {
        const container = document.getElementById('qr-reader-container');
        if (!container) return;

        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
                initialZoom = currentZoom;
            }
        }, { passive: false });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialPinchDistance) {
                e.preventDefault();
                const currentDistance = getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialPinchDistance;
                const newZoom = initialZoom * scale;
                applyZoom(newZoom);
            }
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialPinchDistance = null;
            }
        });

        // Double-tap to reset zoom
        let lastTap = 0;
        container.addEventListener('touchend', (e) => {
            if (e.touches.length === 0 && e.changedTouches.length === 1) {
                const now = Date.now();
                if (now - lastTap < 300) {
                    // Double tap detected
                    if (currentZoom > 1.1) {
                        applyZoom(1);
                    } else {
                        applyZoom(2);
                    }
                }
                lastTap = now;
            }
        });

        console.log('[Scan] Zoom gestures initialized');
    }

    async function initializeZoomCapabilities() {
        const video = document.querySelector('#qr-reader video');
        if (!video || !video.srcObject) return;

        videoTrack = video.srcObject.getVideoTracks()[0];
        if (!videoTrack) return;

        try {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.zoom) {
                supportsNativeZoom = true;
                zoomCapabilities = capabilities.zoom;
                console.log('[Zoom] Native zoom supported:', zoomCapabilities);
            } else {
                console.log('[Zoom] Native zoom not supported, using CSS fallback');
            }
        } catch (e) {
            console.log('[Zoom] Could not get capabilities:', e);
        }
    }

    // === KODAMA MESSAGES ===
    const kodamaMessages = {
        searching: [
            "Où es-tu, Gardien ? 🐱",
            "Je sens sa présence...",
            "Les esprits m'aident !",
            "Continue, on y est presque !"
        ],
        hint: [
            "Rapproche-toi doucement...",
            "Un peu de lumière ? ✨",
            "Il est timide celui-là !"
        ],
        found: "🌸 Trouvé ! Bravo ! 🌸",
        wrong: "Pas celui-ci... Continue !"
    };

    function updateKodamaMessage(type) {
        const bubble = document.getElementById('kodama-bubble');
        const text = document.getElementById('kodama-text');
        if (!bubble || !text) return;

        let message;
        if (type === 'found' || type === 'wrong') {
            message = kodamaMessages[type];
        } else {
            const messages = kodamaMessages[type] || kodamaMessages.searching;
            message = messages[Math.floor(Math.random() * messages.length)];
        }

        text.textContent = message;
        bubble.classList.add('visible');

        if (type !== 'found') {
            clearTimeout(bubble._hideTimeout);
            bubble._hideTimeout = setTimeout(() => {
                bubble.classList.remove('visible');
            }, 3000);
        }
    }

    function triggerKodamaReaction(success) {
        const kodama = document.querySelector('.scan-kodama');
        if (!kodama) return;

        if (success) {
            kodama.classList.add('kodama-happy');
            updateKodamaMessage('found');
        } else {
            kodama.classList.add('kodama-shake');
            updateKodamaMessage('wrong');
            setTimeout(() => kodama.classList.remove('kodama-shake'), 500);
        }
    }

    async function startScan() {
        console.log('[Scan] Démarrage du scan...');

        if (TEST_MODE) {
            console.log('[Scan] Mode TEST activé - bypass caméra');
            // NOTE: On ne cache PAS le bouton ici car le flux TEST ne passe pas par stopScan()
            // Le bouton sera naturellement là quand on revient au hub
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
        // Hub music continue pendant le scan — pas besoin de la couper
        document.body.classList.add('ar-mode');
        // Restaurer le container si stopScan l'avait masqué explicitement
        const qrContainer = document.getElementById('qr-reader-container');
        if (qrContainer) qrContainer.style.display = '';
        document.getElementById('btn-scan')?.style.setProperty('display', 'none');
        document.getElementById('btn-cancel-scan')?.style.setProperty('display', 'block');

        // Support both old (scan-circle) and new (scan-mirror) markup
        const overlay = document.getElementById('scan-overlay');
        const scanElement = overlay?.querySelector('.scan-mirror') || overlay?.querySelector('.scan-circle');
        scanElement?.classList.remove('scan-success', 'scan-wrong');
        scanElement?.classList.add('scan-active');
        
        // Reset kodama
        const kodama = document.querySelector('.scan-kodama');
        kodama?.classList.remove('kodama-happy', 'kodama-shake');
        
        const status = document.getElementById('scan-status');
        if (status) status.textContent = '✨ Révèle l\'aura du Gardien... ✨';
        document.getElementById('manual-entry')?.style.setProperty('display', 'none');
        document.getElementById('scan-result')?.style.setProperty('display', 'none');
        document.getElementById('btn-manual')?.style.setProperty('display', 'none');

        // Reset zoom
        currentZoom = 1;
        applyCSSZoom(1);

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
                        scanElement?.classList.remove('scan-active');
                        scanElement?.classList.add('scan-success');
                        
                        triggerKodamaReaction(true);

                        playGameSFX('pop');
                        playMikoChime(currentFound);
                        if (navigator.vibrate) navigator.vibrate([50, 30, 100]);

                        if (status) status.textContent = '🌸 Le Gardien t\'a reconnu ! 🌸';

                        const flash = document.getElementById('flash');
                        if (flash) {
                            flash.style.background = 'rgba(255,215,0,0.6)';
                            flash.style.opacity = 1;
                            setTimeout(() => {
                                flash.style.opacity = 0;
                                flash.style.background = 'transparent';
                            }, 400);
                        }

                        setTimeout(() => {
                            stopScan();
                            clearInterval(heartInterval);
                            setupQuiz();
                        }, 900);
                    } else {
                        scanElement?.classList.add('scan-wrong');
                        triggerKodamaReaction(false);
                        playWrong();
                        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                        if (status) status.textContent = 'Ce n\'est pas ce Gardien... Continue !';
                        setTimeout(() => scanElement?.classList.remove('scan-wrong'), 500);
                    }
                }
            ).then(() => {
                console.log('[Scan] Caméra démarrée avec succès!');
                // Initialize zoom after camera starts
                setTimeout(() => {
                    initializeZoomCapabilities();
                    setupZoomGestures();
                }, 500);
                
                // Start kodama animation (if present)
                setTimeout(() => updateKodamaMessage('searching'), 1000);
            }).catch(err => {
                console.error('[Scan] Erreur démarrage caméra:', err);
                if (status) status.textContent = '💫 Le miroir s\'endort... Réessaie !';
            });
        } catch (e) {
            console.error('[Scan] Exception:', e);
        }

        scanTimeout = setTimeout(() => {
            const status = document.getElementById('scan-status');
            if (status) status.textContent = '✨ Éclaire le Gardien avec ta lumière...';
            updateKodamaMessage('hint');
        }, 15000);

        scanTimeout2 = setTimeout(() => {
            const status = document.getElementById('scan-status');
            if (status) status.textContent = '🐱 Le Gardien est timide... Entre son code !';
        }, 30000);
    }

    function stopScan() {
        clearScanTimers();
        document.body.classList.remove('ar-mode');
        document.getElementById('btn-scan')?.style.setProperty('display', 'block');
        document.getElementById('btn-cancel-scan')?.style.setProperty('display', 'none');

        // Masquage explicite du container — évite le bleeding du kodama sur mobile
        // (le CSS ar-mode seul ne suffit pas, les enfants positionnés absolument peuvent rester visibles)
        const container = document.getElementById('qr-reader-container');
        if (container) container.style.display = 'none';

        // Nettoyage des états du kodama — empêche la bulle et le personnage de rester affichés
        const kodama = document.querySelector('.scan-kodama');
        if (kodama) kodama.classList.remove('kodama-happy', 'kodama-shake');
        const bubble = document.getElementById('kodama-bubble');
        if (bubble) {
            bubble.classList.remove('visible');
            clearTimeout(bubble._hideTimeout);
        }

        // Reset zoom
        currentZoom = 1;
        applyCSSZoom(1);
        videoTrack = null;
        supportsNativeZoom = false;

        if (html5QrcodeScanner) html5QrcodeScanner.stop().catch(e => console.log(e));
    }

    window.ScanModule = {
        startScan,
        stopScan,
    };
})();
