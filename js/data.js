/* ============================================
   DATA.JS — État global, constantes, config
   ============================================ */

// Astuce: Ajoute "?debug=true" à l'adresse de ta page pour tout tester sur PC sans caméra !
const urlParams = new URLSearchParams(window.location.search);
const TEST_MODE = urlParams.has('debug') || urlParams.get('mode') === 'debug';

const mikoNames = ["Ava", "Nelya", "Mariam", "Antinea", "Rosa-Louise", "Romane", "Bahia", "Fatima"];
const mikoEmojis = ["🌸", "🌙", "✨", "🦊", "🎀", "🔮", "💫", "🦋"];

/* --- 9 RELIQUES SVG (Style Bijou / Magical Girl) --- */
const relicSVG = {
    // 🍡 Mochi : 3 perles brillantes (Rose, Crème, Menthe)
    mochi: `<svg viewBox="0 0 40 40" class="relic-svg">
        <defs>
            <linearGradient id="m1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffe4e1"/><stop offset="100%" stop-color="#ffb7c5"/></linearGradient>
            <linearGradient id="m2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fffff0"/><stop offset="100%" stop-color="#ffe4b5"/></linearGradient>
            <linearGradient id="m3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e0ffff"/><stop offset="100%" stop-color="#98fb98"/></linearGradient>
        </defs>
        <line x1="20" y1="4" x2="20" y2="36" stroke="#d2b48c" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Boule 1 -->
        <circle cx="20" cy="10" r="6" fill="url(#m1)" stroke="#ff69b4" stroke-width="1"/>
        <path d="M16,7 A4,4 0 0,1 22,6 A5,5 0 0,0 16,7 Z" fill="#fff" opacity="0.8"/>
        <!-- Boule 2 -->
        <circle cx="20" cy="20" r="6" fill="url(#m2)" stroke="#f4a460" stroke-width="1"/>
        <path d="M16,17 A4,4 0 0,1 22,16 A5,5 0 0,0 16,17 Z" fill="#fff" opacity="0.8"/>
        <!-- Boule 3 -->
        <circle cx="20" cy="30" r="6" fill="url(#m3)" stroke="#3cb371" stroke-width="1"/>
        <path d="M16,27 A4,4 0 0,1 22,26 A5,5 0 0,0 16,27 Z" fill="#fff" opacity="0.8"/>
        <!-- Étincelle -->
        <path d="M12,18 Q14,18 14,16 Q14,18 16,18 Q14,18 14,20 Q14,18 12,18 Z" fill="#fff" filter="drop-shadow(0 0 2px #fff)"/>
    </svg>`,

    // ⚔️ Ken : Épée céleste avec lame de lumière
    ken: `<svg viewBox="0 0 40 40" class="relic-svg">
        <defs>
            <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#e0ffff"/><stop offset="50%" stop-color="#ffffff"/><stop offset="100%" stop-color="#00ced1"/></linearGradient>
        </defs>
        <path d="M18,4 L22,4 L21,26 L19,26 Z" fill="url(#blade)" filter="drop-shadow(0 0 3px #00ced1)"/>
        <!-- Reflet lame -->
        <path d="M19,4 L20,4 L20,26 L19,26 Z" fill="#fff" opacity="0.9"/>
        <line x1="14" y1="26" x2="26" y2="26" stroke="#ffd700" stroke-width="3" stroke-linecap="round"/>
        <line x1="20" y1="28" x2="20" y2="36" stroke="#8b4513" stroke-width="4" stroke-linecap="round"/>
        <!-- Étincelle -->
        <path d="M22,8 Q24,8 24,6 Q24,8 26,8 Q24,8 24,10 Q24,8 22,8 Z" fill="#fff" filter="drop-shadow(0 0 2px #fff)"/>
    </svg>`,

    // 🥷 Shinobi : Shuriken de cristal
    shinobi: `<svg viewBox="0 0 40 40" class="relic-svg">
        <defs>
            <linearGradient id="shuri" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dda0dd"/><stop offset="100%" stop-color="#9370db"/></linearGradient>
        </defs>
        <path d="M20,6 L23,16 L33,14 L25,21 L32,29 L22,25 L19,34 L16,24 L6,28 L14,21 L6,13 L17,16 Z" fill="url(#shuri)" stroke="#8a2be2" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Reflet biseauté -->
        <path d="M20,6 L23,16 L20,20 Z" fill="#fff" opacity="0.6"/>
        <path d="M33,14 L25,21 L20,20 Z" fill="#fff" opacity="0.4"/>
        <circle cx="20" cy="20" r="3" fill="#ffd700"/>
        <!-- Étincelle -->
        <path d="M8,12 Q10,12 10,10 Q10,12 12,12 Q10,12 10,14 Q10,12 8,12 Z" fill="#fff"/>
    </svg>`,

    // 💖 Aiko : Magatama validé (Gemme liquide)
    aiko: `<svg viewBox="0 0 40 40" class="relic-svg">
        <defs>
            <linearGradient id="aiko-gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b2ffff"/><stop offset="100%" stop-color="#20b2aa"/></linearGradient>
        </defs>
        <path d="M20,6 C30,6 34,14 34,22 C34,32 24,36 18,36 C10,36 8,28 14,22 C18,17 26,19 22,14 C20,11 16,10 20,6 Z" fill="url(#aiko-gem)" stroke="#48d1cc" stroke-width="1.5"/>
        <path d="M20,8 C26,8 30,12 32,18 C30,12 24,10 20,10 C16,10 14,13 14,13 C14,13 16,8 20,8 Z" fill="#fff" opacity="0.7"/>
        <circle cx="21" cy="15" r="3.5" fill="#fff" opacity="0.9"/>
        <circle cx="21" cy="15" r="1.5" fill="#ffd700"/>
        <path d="M10,8 Q12,8 12,6 Q12,8 14,8 Q12,8 12,10 Q12,8 10,8 Z" fill="#fff" filter="drop-shadow(0 0 2px #fff)"/>
    </svg>`,

    // 🦊 Kitsune : Masque laqué avec blush
    kitsune: `<svg viewBox="0 0 40 40" class="relic-svg">
        <defs>
            <linearGradient id="fox" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ffb7c5"/></linearGradient>
        </defs>
        <path d="M8,16 L14,6 L20,13 L26,6 L32,16 C32,28 25,34 20,34 C15,34 8,28 8,16 Z" fill="url(#fox)" stroke="#ff69b4" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Reflet front -->
        <path d="M14,12 C18,8 22,8 26,12 C24,10 16,10 14,12 Z" fill="#fff" opacity="0.8"/>
        <!-- Détails -->
        <path d="M13,20 Q15,18 17,20" fill="none" stroke="#8b5a65" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M23,20 Q25,18 27,20" fill="none" stroke="#8b5a65" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="12" cy="23" r="2.5" fill="#ff1493" opacity="0.4"/>
        <circle cx="28" cy="23" r="2.5" fill="#ff1493" opacity="0.4"/>
        <path d="M28,8 Q30,8 30,6 Q30,8 32,8 Q30,8 30,10 Q30,8 28,8 Z" fill="#fff"/>
    </svg>`,

    // 🍙 Sumo : Onigiri Kawaii
    sumo: `<svg viewBox="0 0 40 40" class="relic-svg">
        <defs>
            <linearGradient id="oni" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e6e6fa"/></linearGradient>
        </defs>
        <path d="M10,28 L20,8 L30,28 C30,33 10,33 10,28 Z" fill="url(#oni)" stroke="#d8bfd8" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Reflet sommet -->
        <path d="M17,13 L20,8 L23,13 C21,11 19,11 17,13 Z" fill="#fff" opacity="0.9"/>
        <rect x="15" y="22" width="10" height="8" rx="2" fill="#4a2e2a"/>
        <path d="M18,16 A2,2 0 0,1 20,18 A2,2 0 0,1 22,16 Q22,14 20,14 Q18,14 18,16 Z" fill="#ffb7c5"/>
        <path d="M30,12 Q32,12 32,10 Q32,12 34,12 Q32,12 32,14 Q32,12 30,12 Z" fill="#fff"/>
    </svg>`,

    // 🧘 Zennon : Orbe magique + Enso
    zennon: `<svg viewBox="0 0 40 40" class="relic-svg">
        <circle cx="20" cy="20" r="6" fill="#ffd700" filter="drop-shadow(0 0 8px #ffd700)"/>
        <circle cx="18" cy="18" r="2" fill="#fff" opacity="0.9"/>
        <path d="M30,20 C30,28 24,34 18,34 C10,34 6,26 8,18 C10,10 18,6 26,8 C28,10 29,14 28,18" fill="none" stroke="#ff69b4" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M10,8 Q12,8 12,6 Q12,8 14,8 Q12,8 12,10 Q12,8 10,8 Z" fill="#fff"/>
    </svg>`,

    // 🥁 Taiko : Tambour brillant
    taiko: `<svg viewBox="0 0 40 40" class="relic-svg">
        <defs>
            <linearGradient id="drum" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ff1493"/><stop offset="50%" stop-color="#ffb7c5"/><stop offset="100%" stop-color="#c71585"/></linearGradient>
        </defs>
        <ellipse cx="20" cy="12" rx="14" ry="5" fill="#fff" stroke="#ff69b4" stroke-width="1.5"/>
        <path d="M6,12 L6,26 C6,29 20,32 34,26 L34,12 Z" fill="url(#drum)" stroke="#c71585" stroke-width="1.5"/>
        <!-- Reflet cylindre -->
        <path d="M10,15 L14,16 L14,28 L10,26 Z" fill="#fff" opacity="0.4"/>
        <line x1="12" y1="32" x2="8" y2="38" stroke="#ffd700" stroke-width="3" stroke-linecap="round"/>
        <line x1="28" y1="32" x2="32" y2="38" stroke="#ffd700" stroke-width="3" stroke-linecap="round"/>
        <path d="M30,8 Q32,8 32,6 Q32,8 34,8 Q32,8 32,10 Q32,8 30,8 Z" fill="#fff"/>
    </svg>`,

    // 🏯 Shogun : Torii laqué avec lune
    shogun: `<svg viewBox="0 0 40 40" class="relic-svg">
        <circle cx="20" cy="18" r="10" fill="#fffacd" filter="drop-shadow(0 0 5px #ffd700)"/>
        <line x1="10" y1="8" x2="10" y2="34" stroke="#db7093" stroke-width="3" stroke-linecap="round"/>
        <line x1="30" y1="8" x2="30" y2="34" stroke="#db7093" stroke-width="3" stroke-linecap="round"/>
        <!-- Reflets piliers -->
        <line x1="9" y1="10" x2="9" y2="32" stroke="#fff" stroke-width="1" opacity="0.5"/>
        <line x1="29" y1="10" x2="29" y2="32" stroke="#fff" stroke-width="1" opacity="0.5"/>
        <line x1="6" y1="12" x2="34" y2="12" stroke="#ff69b4" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="8" y1="18" x2="32" y2="18" stroke="#c71585" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M6,22 Q8,22 8,20 Q8,22 10,22 Q8,22 8,24 Q8,22 6,22 Z" fill="#fff"/>
    </svg>`,

    // 🪞 Miroir des Esprits (règles)
    mirror: `<svg viewBox="0 0 50 60" class="relic-svg">
        <defs><linearGradient id="mir" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#ffb7c5"/></linearGradient></defs>
        <ellipse cx="25" cy="24" rx="16" ry="20" fill="url(#mir)" stroke="#ff69b4" stroke-width="2.5"/>
        <path d="M15,16 Q25,10 30,16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <circle cx="20" cy="15" r="3" fill="#fff"/>
        <line x1="25" y1="44" x2="25" y2="55" stroke="#d8b06a" stroke-width="4" stroke-linecap="round"/>
        <line x1="16" y1="55" x2="34" y2="55" stroke="#d8b06a" stroke-width="3" stroke-linecap="round"/>
        <path d="M8,12 Q10,12 10,10 Q10,12 12,12 Q10,12 10,14 Q10,12 8,12 Z" fill="#ffd700"/>
    </svg>`
};

// Mapping index gardien → clé SVG
const relicKeys = ['mochi', 'ken', 'shinobi', 'aiko', 'kitsune', 'sumo', 'zennon', 'taiko', 'shogun'];

// Fonction utilitaire pour obtenir le SVG d'un gardien
function getRelicSVG(index, size = 40) {
    const key = relicKeys[index];
    return relicSVG[key] || '';
}

const guardianData = [
    { qr: "qr_mochi", n: "", e: "🍡", q: "", a: [], r: 1, type: "hold", instr: "" },
    { qr: "qr_ken", n: "", e: "⚔️", q: "", a: [], r: 0, type: "rhythm", instr: "" },
    { qr: "qr_shinobi", n: "", e: "🥷", q: "", a: [], r: 2, type: "catch", instr: "" },
    { qr: "qr_aiko", n: "", e: "💖", q: "", a: [], r: 1, type: "swipe", instr: "" },
    { qr: "qr_kitsune", n: "", e: "🦊", q: "", a: [], r: 2, type: "scratch", instr: "" },
    { qr: "qr_sumo", n: "", e: "🍙", q: "", a: [], r: 1, type: "mash", instr: "" },
    { qr: "qr_zennon", n: "", e: "🧘", q: "", a: [], r: 1, type: "statue", instr: "" },
    { qr: "qr_taiko", n: "", e: "🥁", q: "", a: [], r: 1, type: "drum", instr: "" },
    { qr: "qr_shogun", n: "", e: "🏯", q: "", a: [], r: 0, type: "memory", instr: "" }
];

let currentFound = 0; let hpOni = 0; let audioCtx, masterGain;
let mainOscillators = []; let html5QrcodeScanner = null;
let hasGyro = false;
let audioLayers = { wind: null, chime: null, pad: null, melody: null };
let wakeLock = null; 

let gameStartTime = 0; let hubTimer = 0; let heartInterval = null; let introSkipped = false; let quizInterval = null;
let currentRule = 1; let easterEggTimer = null;

let micContext = null; let micAnalyser = null; let micStream = null; let micLoop = null;

/* --- PRÉ-CALCUL TEXTURE WASHI (au chargement, pas au capture) --- */
let washiCanvas = null;
function precomputeWashi() {
    washiCanvas = document.createElement('canvas');
    washiCanvas.width = 1200; washiCanvas.height = 1600;
    const wCtx = washiCanvas.getContext('2d');
    
    wCtx.fillStyle = "#EAE4D3";
    wCtx.fillRect(0, 0, 1200, 1600);
    
    // Fibres diagonales
    wCtx.save(); wCtx.globalAlpha = 0.04;
    for(let i = 0; i < 3000; i++) {
        wCtx.strokeStyle = Math.random() > 0.5 ? "#000" : "#fff";
        wCtx.lineWidth = Math.random() * 1.5;
        const x = Math.random() * 1200, y = Math.random() * 1600;
        const len = Math.random() * 25 + 5;
        const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.5;
        wCtx.beginPath(); wCtx.moveTo(x, y);
        wCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        wCtx.stroke();
    }
    wCtx.restore();
    
    // Gradient vintage
    const grd = wCtx.createRadialGradient(600, 800, 300, 600, 800, 1200);
    grd.addColorStop(0, "transparent"); grd.addColorStop(1, "rgba(60,30,20,0.5)");
    wCtx.fillStyle = grd; wCtx.fillRect(0, 0, 1200, 1600);
    
    console.log('[Perf] Texture washi pré-calculée');
}
// Lancer au chargement
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', precomputeWashi);
else precomputeWashi();
