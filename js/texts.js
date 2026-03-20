/* ============================================
   TEXTS.JS — Centralized Text Dictionary Loader
   ============================================ */

let T = null; // Global texts object

async function loadTexts(lang = 'fr') {
    try {
        const response = await fetch('texts.json');
        if (!response.ok) throw new Error('Failed to load texts.json');
        T = await response.json();
        console.log('[Texts] Loaded:', T.meta.lang, 'v' + T.meta.version);
        
        // Sync guardianData from texts if it exists
        if (T.guardians && typeof guardianData !== 'undefined') {
            T.guardians.forEach((g, i) => {
                guardianData[i].n = g.name;
                guardianData[i].q = g.question;
                guardianData[i].a = g.answers;
                guardianData[i].r = g.correct;
                guardianData[i].instr = g.instruction;
                guardianData[i].qr = g.qr;
                guardianData[i].e = g.emoji;
                guardianData[i].type = g.gameType;
            });
        }
        
        // Sync mikoNames
        if (T.mikos && typeof mikoNames !== 'undefined') {
            T.mikos.names.forEach((name, i) => { mikoNames[i] = name; });
        }
        
        // Apply static HTML texts
        applyStaticTexts();
        
        return T;
    } catch (err) {
        console.error('[Texts] Error loading:', err);
        return null;
    }
}

function applyStaticTexts() {
    if (!T) return;
    
    // App title
    const introTitle = document.getElementById('intro-title');
    if (introTitle) introTitle.innerHTML = T.app.title;
    
    // Start button
    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.innerHTML = T.app.startButton;
    
    // Background kanji
    const bgKanji = document.querySelector('.bg-kanji');
    if (bgKanji) bgKanji.textContent = T.app.bgKanji;
    
    // Rules
    ['r1', 'r2', 'r3', 'r4'].forEach((rKey, i) => {
        const rule = document.getElementById(`rule-${i + 1}`);
        if (rule && T.rules[rKey]) {
            const h2 = rule.querySelector('h2');
            const p = rule.querySelector('p:not(.rule-warning):not(#mirror-status)');
            const warning = rule.querySelector('.rule-warning');
            const btn = rule.querySelector('button');
            
            if (h2) h2.textContent = T.rules[rKey].title;
            if (p) p.textContent = T.rules[rKey].text;
            if (warning) warning.textContent = T.rules[rKey].warning;
            if (btn) btn.innerHTML = T.rules[rKey].button;
        }
    });
    
    // Oath screen
    const oathTitle = document.querySelector('#screen-oath h1');
    if (oathTitle) oathTitle.textContent = T.oath.title;
    
    const oathInstr = document.querySelector('#screen-oath p[style*="font-weight:bold"]');
    if (oathInstr) oathInstr.textContent = T.oath.instruction;
    
    // Hub screen
    const hubTitle = document.querySelector('#screen-hub h2');
    if (hubTitle) hubTitle.textContent = T.hub.title;
    
    const btnScan = document.getElementById('btn-scan');
    if (btnScan) btnScan.innerHTML = T.hub.scanButton;
    
    const btnCancelScan = document.getElementById('btn-cancel-scan');
    if (btnCancelScan) btnCancelScan.innerHTML = T.hub.cancelButton;
    
    // Final screen title
    const finalTitle = document.getElementById('final-title');
    if (finalTitle) finalTitle.textContent = T.finale.title;
    
    // Certificate
    const certTitle = document.querySelector('.certificate h3');
    if (certTitle) certTitle.textContent = T.certificate.title;
    
    // Mirror overlay
    const mirrorInstr = document.querySelector('.mirror-instruction');
    if (mirrorInstr) mirrorInstr.textContent = T.mirrorOverlay.instruction;
    
    const btnCapture = document.getElementById('btn-capture');
    if (btnCapture) btnCapture.innerHTML = T.mirrorOverlay.captureButton;
    
    const btnDownload = document.getElementById('btn-download');
    if (btnDownload) btnDownload.innerHTML = T.mirrorOverlay.openButton;
}

// Helper functions to get texts
function txt(path) {
    if (!T) return path;
    const keys = path.split('.');
    let val = T;
    for (const k of keys) {
        if (val[k] === undefined) return path;
        val = val[k];
    }
    return val;
}

function txtGuardian(index, field) {
    if (!T || !T.guardians[index]) return '';
    return T.guardians[index][field] || '';
}

function txtCinematic(act, index, lang = 'fr') {
    if (!T || !T.cinematics.intro[act] || !T.cinematics.intro[act][index]) return { fr: '', jp: '' };
    return T.cinematics.intro[act][index];
}

function txtFinale(section, index, lang = 'fr') {
    if (!T || !T.finale[section]) return { fr: '', jp: '' };
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
