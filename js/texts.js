window.textsReady = false;

async function loadTexts(lang = 'fr') {
    try {
        window.textsReady = false;

        const textsUrl = new URL('./texts.json', window.location.href).href;
        console.log('[Texts] Fetch URL:', textsUrl);

        const response = await fetch(textsUrl, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to load texts.json (${response.status})`);
        }

        T = await response.json();
        console.log('[Texts] Loaded:', T?.meta?.lang || lang, 'v' + (T?.meta?.version || '?'));

        if (Array.isArray(T?.guardians) && typeof guardianData !== 'undefined' && Array.isArray(guardianData)) {
            T.guardians.forEach((g, i) => {
                if (!guardianData[i] || !g) return;
                guardianData[i].n = g.name || '';
                guardianData[i].q = g.question || '';
                guardianData[i].a = Array.isArray(g.answers) ? g.answers : [];
                guardianData[i].r = typeof g.correct === 'number' ? g.correct : 0;
                guardianData[i].instr = g.instruction || '';
                guardianData[i].qr = g.qr || '';
                guardianData[i].e = g.emoji || '✨';
                guardianData[i].type = g.gameType || '';
            });
        }

        if (Array.isArray(T?.mikos?.names) && typeof mikoNames !== 'undefined' && Array.isArray(mikoNames)) {
            T.mikos.names.forEach((name, i) => {
                if (i < mikoNames.length) mikoNames[i] = name;
            });
        }

        applyStaticTexts();
        window.textsReady = true;
        resyncDebugGuardians();

        window.dispatchEvent(new CustomEvent('texts:ready', {
            detail: {
                guardians: Array.isArray(T?.guardians) ? T.guardians.length : 0,
                version: T?.meta?.version || null
            }
        }));

        return T;
    } catch (err) {
        window.textsReady = false;
        console.error('[Texts] Error loading:', err);
        return null;
    }
}

function applyStaticTexts() {
    if (!T) return;

    // App title
    const introTitle = document.getElementById('intro-title');
    if (introTitle && T?.app?.title) introTitle.innerHTML = T.app.title;

    // Start button
    const btnStart = document.getElementById('btn-start');
    if (btnStart && T?.app?.startButton) btnStart.innerHTML = T.app.startButton;

    // Background kanji
    const bgKanji = document.querySelector('.bg-kanji');
    if (bgKanji && T?.app?.bgKanji) bgKanji.textContent = T.app.bgKanji;

    // Rules
    ['r1', 'r2', 'r3', 'r4'].forEach((rKey, i) => {
        const rule = document.getElementById(`rule-${i + 1}`);
        const ruleText = T?.rules?.[rKey];
        if (!rule || !ruleText) return;

        const h2 = rule.querySelector('h2');
        const p = rule.querySelector('p:not(.rule-warning):not(#mirror-status)');
        const warning = rule.querySelector('.rule-warning');
        const btn = rule.querySelector('button');

        if (h2 && ruleText.title) h2.textContent = ruleText.title;
        if (p && ruleText.text) p.textContent = ruleText.text;
        if (warning && ruleText.warning) warning.textContent = ruleText.warning;
        if (btn && ruleText.button) btn.innerHTML = ruleText.button;
    });

    // Oath screen
    const oathTitle = document.querySelector('#screen-oath h1');
    if (oathTitle && T?.oath?.title) oathTitle.textContent = T.oath.title;

    const oathInstr = document.querySelector('#screen-oath p[style*="font-weight:bold"]');
    if (oathInstr && T?.oath?.instruction) oathInstr.textContent = T.oath.instruction;

    // Hub screen
    const hubTitle = document.querySelector('#screen-hub h2');
    if (hubTitle && T?.hub?.title) hubTitle.textContent = T.hub.title;

    const btnScan = document.getElementById('btn-scan');
    if (btnScan && T?.hub?.scanButton) btnScan.innerHTML = T.hub.scanButton;

    const btnCancelScan = document.getElementById('btn-cancel-scan');
    if (btnCancelScan && T?.hub?.cancelButton) btnCancelScan.innerHTML = T.hub.cancelButton;

    // Final screen title
    const finalTitle = document.getElementById('final-title');
    if (finalTitle && T?.finale?.title) finalTitle.textContent = T.finale.title;

    // Certificate
    const certTitle = document.querySelector('.certificate h3');
    if (certTitle && T?.certificate?.title) certTitle.textContent = T.certificate.title;

    // Mirror overlay / legacy mirror texts
    const mirrorTexts = T?.mirrorOverlay || T?.mirror || {};

    const mirrorInstr = document.querySelector('.mirror-instruction');
    if (mirrorInstr) {
        mirrorInstr.textContent =
            mirrorTexts.instruction ||
            mirrorTexts.waking ||
            mirrorInstr.textContent;
    }

    const btnCapture = document.getElementById('btn-capture');
    if (btnCapture && mirrorTexts.captureButton) btnCapture.innerHTML = mirrorTexts.captureButton;

    const btnDownload = document.getElementById('btn-download');
    if (btnDownload && mirrorTexts.openButton) btnDownload.innerHTML = mirrorTexts.openButton;
}

function resyncDebugGuardians() {
    const debugGuardians = document.getElementById('debug-guardians');
    if (!debugGuardians) return;
    if (typeof guardianData === 'undefined' || !Array.isArray(guardianData)) return;

    debugGuardians.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const g = guardianData[i];
        const b = document.createElement('button');
        b.className = 'debug-link';
        b.dataset.action = 'game';
        b.dataset.index = i;
        b.textContent = g
            ? `${i + 1}. ${g.e || '✨'} ${g.n || `Guardian ${i + 1}`}`
            : `${i + 1}. Guardian ${i + 1}`;
        debugGuardians.appendChild(b);
    }
}

// Helper functions to get texts
function txt(path) {
    if (!T) return path;
    const keys = path.split('.');
    let val = T;
    for (const k of keys) {
        if (val == null || val[k] === undefined) return path;
        val = val[k];
    }
    return val;
}

function txtGuardian(index, field) {
    if (!T || !Array.isArray(T.guardians) || !T.guardians[index]) return '';
    return T.guardians[index][field] || '';
}

function txtCinematic(act, index, lang = 'fr') {
    if (!T?.cinematics?.intro?.[act] || !T.cinematics.intro[act][index]) return { fr: '', jp: '' };
    return T.cinematics.intro[act][index];
}

function txtFinale(section, index, lang = 'fr') {
    if (!T?.finale?.[section]) return { fr: '', jp: '' };
    if (Array.isArray(T.finale[section])) {
        return T.finale[section][index] || { fr: '', jp: '' };
    }
    return T.finale[section];
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadTexts());
} else {
    loadTexts();
}