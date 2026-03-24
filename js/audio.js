/* --- AUDIO.JS — Musique Cinématique + SFX + Voix --- */

async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }
    catch (err) { console.log("WakeLock non supporté", err); }
}
document.addEventListener('click', requestWakeLock, {once:true});

/* === TEMPLE AUDIO NODES === */
let templeFilter = null, templeReverb = null, templeDelay = null, templeDelayGain = null;
let dryGain = null, wetGain = null;
let duckGain = null;   // ← nœud dédié ducking voix — séparé de masterGain
let sfxBus  = null;    // ← bus SFX → masterGain (inclus dans fade final)

/* === MUSIC LAYERS === */
let windNode = null, windFilter = null, windLFO = null, windLFOGain = null;
let padOscs = [], padGain = null;
let chimeInterval = null, chimeGain = null;
let melodyGain = null, melodyInterval = null;
let taikoInterval = null, taikoGain = null;
let subDrone = null, subDroneGain = null;

/* Gammes pentatoniques japonaises */
const YO_SCALE = [261.63, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99, 880.00];
const IN_SCALE = [164.81, 174.61, 220.00, 246.94, 261.63, 329.63, 349.23, 440.00];

let currentChimeScale = YO_SCALE;
let currentMelodyNotes = [];
let melodyIndex = 0;

/* Flags de génération — stoppent les timers zombies */
let _chimeGen = 0, _melodyGen = 0;

/* Chrome 15s workaround */
let _synthKeepAlive = null;

function createTempleImpulse(ctx, duration, decay) {
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/len, decay);
    }
    return buf;
}

function initSfx() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    /* --- Chaîne : audioLayers/sfxBus → masterGain → duckGain → templeFilter → dry/wet → destination --- */
    masterGain = audioCtx.createGain(); masterGain.gain.value = 0.55; // headroom mobile
    duckGain   = audioCtx.createGain(); duckGain.gain.value   = 1.0;
    dryGain    = audioCtx.createGain(); dryGain.gain.value    = 1.0;
    wetGain    = audioCtx.createGain(); wetGain.gain.value    = 0.0;
    sfxBus     = audioCtx.createGain(); sfxBus.gain.value     = 1.0;

    templeFilter = audioCtx.createBiquadFilter();
    templeFilter.type = 'lowpass'; templeFilter.frequency.value = 20000; templeFilter.Q.value = 0.5;

    templeReverb = audioCtx.createConvolver();
    templeReverb.buffer = createTempleImpulse(audioCtx, 3.0, 2.5);

    templeDelay = audioCtx.createDelay(1.0); templeDelay.delayTime.value = 0.08;
    templeDelayGain = audioCtx.createGain(); templeDelayGain.gain.value = 0.15;

    /* Chaîne principale */
    masterGain.connect(duckGain);
    sfxBus.connect(duckGain);
    duckGain.connect(templeFilter);
    templeFilter.connect(dryGain); templeFilter.connect(wetGain);
    dryGain.connect(audioCtx.destination);
    wetGain.connect(templeReverb); templeReverb.connect(audioCtx.destination);
    wetGain.connect(templeDelay); templeDelay.connect(templeDelayGain); templeDelayGain.connect(wetGain);

    /* === LAYER 1 : VENT === */
    audioLayers.wind = audioCtx.createGain(); audioLayers.wind.gain.value = 0; audioLayers.wind.connect(masterGain);
    const bufSize = audioCtx.sampleRate * 2;
    const noiseBuf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const noiseOut = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) noiseOut[i] = Math.random()*2-1;
    windNode = audioCtx.createBufferSource(); windNode.buffer = noiseBuf; windNode.loop = true;
    windFilter = audioCtx.createBiquadFilter(); windFilter.type = 'lowpass'; windFilter.frequency.value = 300; windFilter.Q.value = 1.0;
    windLFO = audioCtx.createOscillator(); windLFO.type = 'sine'; windLFO.frequency.value = 0.15;
    windLFOGain = audioCtx.createGain(); windLFOGain.gain.value = 200;
    windLFO.connect(windLFOGain); windLFOGain.connect(windFilter.frequency);
    windNode.connect(windFilter); windFilter.connect(audioLayers.wind);
    windNode.start(); windLFO.start();

    /* === LAYER 2 : PAD === */
    audioLayers.pad = audioCtx.createGain(); audioLayers.pad.gain.value = 0; audioLayers.pad.connect(masterGain);
    padGain = audioCtx.createGain(); padGain.gain.value = 0.12; padGain.connect(audioLayers.pad);
    const padLFO = audioCtx.createOscillator();
    const padLFOGain = audioCtx.createGain();
    padLFO.type = 'sine'; padLFO.frequency.value = 0.025;
    padLFOGain.gain.value = 0.05;
    padLFO.connect(padLFOGain); padLFOGain.connect(padGain.gain);
    padLFO.start();
    createPadChord([130.81, 196.00, 174.61]);

    /* === LAYER 3 : CHIMES === */
    audioLayers.chime = audioCtx.createGain(); audioLayers.chime.gain.value = 0; audioLayers.chime.connect(masterGain);
    chimeGain = audioCtx.createGain(); chimeGain.gain.value = 0.08; chimeGain.connect(audioLayers.chime);

    /* === LAYER 4 : MÉLODIE === */
    audioLayers.melody = audioCtx.createGain(); audioLayers.melody.gain.value = 0; audioLayers.melody.connect(masterGain);
    melodyGain = audioCtx.createGain(); melodyGain.gain.value = 0.1; melodyGain.connect(audioLayers.melody);

    /* === LAYER 5 : TAIKO === */
    taikoGain = audioCtx.createGain(); taikoGain.gain.value = 0; taikoGain.connect(masterGain);

    /* === LAYER 6 : SUB DRONE === */
    subDroneGain = audioCtx.createGain(); subDroneGain.gain.value = 0; subDroneGain.connect(masterGain);
    subDrone = audioCtx.createOscillator(); subDrone.type = 'sine'; subDrone.frequency.value = 40;
    const subFilter = audioCtx.createBiquadFilter(); subFilter.type = 'lowpass'; subFilter.frequency.value = 80;
    subDrone.connect(subFilter); subFilter.connect(subDroneGain); subDrone.start();

    /* === DRONE HARMONIQUE === */
    [73.42, 87.31, 110.00].forEach(f => {
        const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
        const gain = audioCtx.createGain(); gain.gain.value = 0;
        osc.connect(gain); gain.connect(masterGain); osc.start(); mainOscillators.push({osc, gain});
    });

    /* Warm-up TTS déjà fait dans cinematics.js */
}

function createPadChord(freqs) {
    padOscs.forEach(o => { try { o.stop(); } catch(e){} });
    padOscs = [];
    if (!audioCtx || !padGain) return;
    freqs.forEach(f => {
        [-1.5, 1.5].forEach(detune => {
            const osc = audioCtx.createOscillator(); osc.type = 'triangle';
            osc.frequency.value = f; osc.detune.value = detune;
            osc.connect(padGain); osc.start();
            padOscs.push(osc);
        });
    });
}

/* ─── TIMERS RÉCURSIFS ANTI-ZOMBIES ─── */
function scheduleChime(baseMs, varianceMs) {
    const myGen = ++_chimeGen;
    const loop = () => {
        if (_chimeGen !== myGen) return;
        playChimeNote();
        setTimeout(loop, baseMs + Math.random() * varianceMs);
    };
    setTimeout(loop, baseMs + Math.random() * varianceMs);
}

function scheduleMelody(baseMs, varianceMs) {
    const myGen = ++_melodyGen;
    const loop = () => {
        if (_melodyGen !== myGen) return;
        playMelodyNote();
        setTimeout(loop, baseMs + Math.random() * varianceMs);
    };
    setTimeout(loop, baseMs + Math.random() * varianceMs);
}

let chimePatternIdx = 0;
function playChimeNote() {
    if (!audioCtx || !chimeGain) return;
    const pattern = [0, 2, 4, 3, 1, 4, 2, 0];
    const idx = pattern[chimePatternIdx % pattern.length];
    const freq = currentChimeScale[idx % currentChimeScale.length];
    chimePatternIdx++;
    const osc = audioCtx.createOscillator(); osc.type = 'sine';
    osc.frequency.value = freq;
    const g = audioCtx.createGain(); const now = audioCtx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 4);
    osc.connect(g); g.connect(chimeGain); osc.start(now); osc.stop(now + 4);
}

let _lastMelodyNotes = [];
function playMelodyNote() {
    if (!audioCtx || !melodyGain || currentMelodyNotes.length === 0) return;
    const available = currentMelodyNotes.filter(n => !_lastMelodyNotes.slice(-3).includes(n));
    const pool = available.length > 0 ? available : currentMelodyNotes;
    const freq = pool[Math.floor(Math.random() * pool.length)];
    _lastMelodyNotes.push(freq);
    if (_lastMelodyNotes.length > 5) _lastMelodyNotes.shift();
    melodyIndex++;
    const osc = audioCtx.createOscillator(); osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(freq * 0.97, now);
    osc.frequency.linearRampToValueAtTime(freq, now + 0.3);
    osc.frequency.linearRampToValueAtTime(freq * 0.99, now + 2.5);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.8);
    g.gain.setValueAtTime(0.15, now + 1.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    const vib = audioCtx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 5;
    const vibG = audioCtx.createGain(); vibG.gain.value = 3;
    vib.connect(vibG); vibG.connect(osc.frequency);
    osc.connect(g); g.connect(melodyGain); osc.start(now); osc.stop(now + 3.5);
    vib.start(now); vib.stop(now + 3.5);
}

function playTaikoHit() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    const nBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const nData = nBuf.getChannelData(0); for(let i=0; i<nData.length; i++) nData[i] = Math.random()*2-1;
    const noise = audioCtx.createBufferSource(); noise.buffer = nBuf;
    const nGain = audioCtx.createGain();
    nGain.gain.setValueAtTime(0.15, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    const nFilter = audioCtx.createBiquadFilter(); nFilter.type = 'lowpass'; nFilter.frequency.value = 200;
    osc.connect(g); g.connect(taikoGain);
    noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(taikoGain);
    osc.start(now); osc.stop(now + 0.5); noise.start(now);
    const nekoStage = document.querySelector('#neko-hero .neko-scale-wrapper:not(.ghost-neko)');
    if (nekoStage) { nekoStage.classList.add('bell-pulse'); setTimeout(() => nekoStage.classList.remove('bell-pulse'), 350); }
}

let currentMusicMood = null;

function setMusicMood(scene) {
    if (!audioCtx) return;
    currentMusicMood = scene;
    const now = audioCtx.currentTime;
    const t = 2;
    /* Stopper les timers récursifs via incrémentation de génération */
    _chimeGen++; _melodyGen++;
    if (taikoInterval) { clearInterval(taikoInterval); taikoInterval = null; }

    function ramp(param, val, dur) {
        param.cancelScheduledValues(now);
        param.linearRampToValueAtTime(val, now + (dur || t));
    }

    if (scene === 'VOYAGE') {
        ramp(audioLayers.wind.gain, 0.25); ramp(audioLayers.pad.gain, 0.03);
        ramp(audioLayers.chime.gain, 0); ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0); ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.1; windFilter.frequency.value = 250;
        createPadChord([130.81, 196.00]);
        chimePatternIdx = 0; currentChimeScale = YO_SCALE;
        scheduleChime(5000, 2000);

    } else if (scene === 'DECOUVERTE') {
        ramp(audioLayers.wind.gain, 0.18); ramp(audioLayers.pad.gain, 0.08);
        ramp(audioLayers.chime.gain, 0.06); ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0); ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.12; windFilter.frequency.value = 350;
        createPadChord([130.81, 196.00, 174.61]);
        currentChimeScale = YO_SCALE;
        scheduleChime(3000, 1200);

    } else if (scene === 'SACRE') {
        ramp(audioLayers.wind.gain, 0.12); ramp(audioLayers.pad.gain, 0.12);
        ramp(audioLayers.chime.gain, 0.08); ramp(audioLayers.melody.gain, 0.10);
        ramp(taikoGain.gain, 0.08); ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.08; windFilter.frequency.value = 400;
        createPadChord([130.81, 196.00, 174.61, 220.00]);
        currentChimeScale = YO_SCALE;
        if (melodyGain) melodyGain.gain.value = 0.12;
        if (chimeGain) chimeGain.gain.value = 0.09;
        currentMelodyNotes = [523.25, 654.06, 784.00, 1046.5, 1308.13, 1046.5, 784.00, 654.06];
        melodyIndex = 0; _lastMelodyNotes = [];
        scheduleChime(1800, 600);
        scheduleMelody(1800, 600);
        taikoInterval = setInterval(playTaikoHit, 3500);

    } else if (scene === 'RUPTURE') {
        ramp(audioLayers.wind.gain, 0.26); ramp(audioLayers.pad.gain, 0);
        ramp(audioLayers.chime.gain, 0.04); ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0.15); ramp(subDroneGain.gain, 0.10);
        windLFO.frequency.value = 0.4; windFilter.frequency.value = 800;
        currentChimeScale = IN_SCALE; chimePatternIdx = 0;
        scheduleChime(1600, 700);
        taikoInterval = setInterval(playTaikoHit, 1500);
        subDrone.frequency.linearRampToValueAtTime(55, now + 6);

    } else if (scene === 'CHUTE') {
        ramp(audioLayers.wind.gain, 0.08, 4); ramp(audioLayers.pad.gain, 0, 3);
        ramp(audioLayers.chime.gain, 0, 3); ramp(audioLayers.melody.gain, 0, 3);
        ramp(taikoGain.gain, 0, 3); ramp(subDroneGain.gain, 0.05, 4);
        windLFO.frequency.value = 0.05; windFilter.frequency.value = 150;
        subDrone.frequency.linearRampToValueAtTime(30, now + 5);

    } else if (scene === 'VICTOIRE') {
        ramp(audioLayers.wind.gain, 0.05); ramp(audioLayers.pad.gain, 0.15);
        ramp(audioLayers.chime.gain, 0.12); ramp(audioLayers.melody.gain, 0.14);
        ramp(taikoGain.gain, 0); ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.06; windFilter.frequency.value = 500;
        createPadChord([261.63, 329.63, 392.00, 523.25]);
        currentChimeScale = YO_SCALE;
        if (melodyGain) melodyGain.gain.value = 0.22;
        if (chimeGain) chimeGain.gain.value = 0.15;
        currentMelodyNotes = [880.00, 1046.5, 1174.66, 1318.51, 1046.5, 880.00, 784.00, 880.00];
        melodyIndex = 0; _lastMelodyNotes = [];
        scheduleChime(1200, 500);
        scheduleMelody(1500, 600);

    } else if (scene === 'MIROIR') {
        ramp(audioLayers.wind.gain, 0.02, 3); ramp(audioLayers.pad.gain, 0, 3);
        ramp(audioLayers.chime.gain, 0.02, 3); ramp(audioLayers.melody.gain, 0, 3);
        ramp(taikoGain.gain, 0, 3); ramp(subDroneGain.gain, 0, 3);
        windLFO.frequency.value = 0.03; windFilter.frequency.value = 150;
        currentChimeScale = YO_SCALE;
        scheduleChime(10000, 4000);

    } else if (scene === 'EPILOGUE') {
        ramp(audioLayers.wind.gain, 0.12); ramp(audioLayers.pad.gain, 0.06);
        ramp(audioLayers.chime.gain, 0.07); ramp(audioLayers.melody.gain, 0.09);
        ramp(taikoGain.gain, 0); ramp(subDroneGain.gain, 0.03);
        windLFO.frequency.value = 0.04; windFilter.frequency.value = 200;
        createPadChord([130.81, 174.61, 196.00]);
        currentChimeScale = YO_SCALE;
        if (melodyGain) melodyGain.gain.value = 0.1;
        if (chimeGain) chimeGain.gain.value = 0.08;
        currentMelodyNotes = [261.63, 220.00, 196.00, 174.61, 146.83, 174.61, 196.00, 220.00];
        melodyIndex = 0; _lastMelodyNotes = [];
        scheduleChime(4000, 2000);
        scheduleMelody(3500, 1500);
        subDrone.frequency.linearRampToValueAtTime(38, now + 3);
    }
    console.log('[Music Mood]', scene);
}

/* ─── TEMPLE MODE — ducking sur duckGain uniquement ─── */
function enterTempleMode() {
    if (!audioCtx || !duckGain) return;
    const now = audioCtx.currentTime;
    duckGain.gain.cancelScheduledValues(now);
    duckGain.gain.setTargetAtTime(0.28, now, 0.15); // descente douce
}

function exitTempleMode() {
    if (!audioCtx || !duckGain) return;
    const now = audioCtx.currentTime;
    duckGain.gain.cancelScheduledValues(now);
    duckGain.gain.setTargetAtTime(1.0, now, 0.25); // remontée douce — setTargetAtTime ne cancelle rien
}

/* Annuler la voix proprement — toujours appeler exitTempleMode */
function cancelVoice() {
    try { window.speechSynthesis.cancel(); } catch(e) {}
    exitTempleMode();
    if (_synthKeepAlive) { clearInterval(_synthKeepAlive); _synthKeepAlive = null; }
}

/* ─── SÉLECTION DE VOIX — Google JP en priorité ─── */
let _bestVoice = null, _voiceSearched = false;

function findBestVoice() {
    if (_voiceSearched && _bestVoice) return _bestVoice;
    _voiceSearched = true;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const jpVoices = voices.filter(v => v.lang.startsWith('ja'));
    if (!jpVoices.length) { _bestVoice = voices[0]; return _bestVoice; }

    // Priorité 1 : Google 日本語 / Google Japanese (même moteur Chrome desktop + Android)
    const googleJp = jpVoices.find(v => /google/i.test(v.name));
    if (googleJp) { _bestVoice = googleJp; console.log('[Voice] Google JP:', googleJp.name); return _bestVoice; }

    // Priorité 2 : moteur neural embarqué localService
    const localJp = jpVoices.find(v => v.localService);
    if (localJp) { _bestVoice = localJp; console.log('[Voice] Local JP:', localJp.name); return _bestVoice; }

    // Priorité 3 : n'importe quelle voix ja-JP
    _bestVoice = jpVoices[0];
    console.log('[Voice] Fallback JP:', _bestVoice.name);
    return _bestVoice;
}

// Recharger quand les voix sont disponibles
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => { _voiceSearched = false; findBestVoice(); };
}
// Pré-charger immédiatement si les voix sont déjà disponibles
if (window.speechSynthesis.getVoices().length > 0) { findBestVoice(); }

/* Pitch optimal selon la voix détectée */
function getOptimalPitch() {
    const v = findBestVoice();
    if (!v) return 1.0;
    // Google JP féminine → pitch 0.95-1.05 (son meilleur registre)
    if (/google/i.test(v.name)) return 1.0;
    // Moteur neural → pitch légèrement plus bas pour profondeur
    if (v.localService) return 0.95;
    return 0.95;
}

/* ─── SSML avec fallback ─── */
function buildSSML(text) {
    // Tenter SSML sur Chrome — fallback silencieux si non supporté
    return `<speak>${text}</speak>`;
}

/* ─── speakDucked — voix principale ─── */
function speakDucked(text, opts = {}) {
    const rate   = opts.rate   ?? 0.82;
    const pitch  = opts.pitch  ?? getOptimalPitch();
    const maxMs  = opts.maxMs  ?? 10000;

    if (typeof _kokoroReady !== 'undefined' && _kokoroReady && _kokoroCache.has(text)) return _kokoroPlay(text, opts);
    return new Promise(resolve => {
        try { window.speechSynthesis.cancel(); } catch(e) {}
        enterTempleMode();

        // Workaround Chrome 15s : pause/resume toutes les 10s
        if (_synthKeepAlive) clearInterval(_synthKeepAlive);
        _synthKeepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            } else {
                clearInterval(_synthKeepAlive); _synthKeepAlive = null;
            }
        }, 10000);

        const u = new SpeechSynthesisUtterance(text);
        u.lang   = 'ja-JP';
        u.rate   = rate;
        u.pitch  = pitch;
        u.volume = 1.0; // toujours max — qualité moteur neural optimale

        const voice = findBestVoice();
        if (voice) u.voice = voice;

        let done = false;
        const finish = () => {
            if (done) return; done = true;
            clearTimeout(timeout);
            if (_synthKeepAlive) { clearInterval(_synthKeepAlive); _synthKeepAlive = null; }
            exitTempleMode();
            resolve();
        };
        const timeout = setTimeout(() => {
            try { window.speechSynthesis.cancel(); } catch(e) {}
            finish();
        }, maxMs);

        u.onend = finish;
        u.onerror = finish;
        window.speechSynthesis.speak(u);
    });
}

function speakDuckedFire(text, opts = {}) { speakDucked(text, opts); }

/* ─── talkSync — voix intro ─── */
function talkSync(txt, lang, rate=0.72) {
    if(introSkipped) return Promise.resolve();
    if (typeof _kokoroReady !== 'undefined' && _kokoroReady && _kokoroCache.has(txt)) return _kokoroPlay(txt, { rate });
    return new Promise(r => {
        try { window.speechSynthesis.cancel(); } catch(e) {} // état propre — même comportement que speakDucked
        enterTempleMode();

        if (_synthKeepAlive) clearInterval(_synthKeepAlive);
        _synthKeepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            } else {
                clearInterval(_synthKeepAlive); _synthKeepAlive = null;
            }
        }, 10000);

        const u = new SpeechSynthesisUtterance(txt);
        u.lang   = lang;
        u.rate   = rate;
        u.pitch  = getOptimalPitch();
        u.volume = 1.0;
        const voice = findBestVoice();
        if (voice) u.voice = voice;

        const finish = () => {
            if (_synthKeepAlive) { clearInterval(_synthKeepAlive); _synthKeepAlive = null; }
            exitTempleMode(); r();
        };
        const timeout = setTimeout(() => {
            try { window.speechSynthesis.cancel(); } catch(e) {}
            finish();
        }, 14000);
        u.onend = () => { clearTimeout(timeout); finish(); };
        u.onerror = () => { clearTimeout(timeout); finish(); };
        window.speechSynthesis.speak(u);
    });
}

/* Alias conservé pour compatibilité */
function findSageVoice() { return findBestVoice(); }

/* ─── SFX — via sfxBus → masterGain (inclus dans fade final) ─── */
function playGameSFX(type, freq=440) {
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(sfxBus);
    const now = audioCtx.currentTime;

    if(type === 'heartbeat') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(60, now); osc.frequency.exponentialRampToValueAtTime(30, now+0.3);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.3);
        osc.start(now); osc.stop(now+0.3);
    } else if(type === 'drum_g') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now+0.2);
        gain.gain.setValueAtTime(0.42, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2);
        osc.start(now); osc.stop(now+0.2);
    } else if(type === 'sword') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1);
        osc.start(now); osc.stop(now+0.1);
    } else if(type === 'thud') {
        osc.type = 'square'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(20, now+0.2);
        gain.gain.setValueAtTime(0.40, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2);
        osc.start(now); osc.stop(now+0.2);
    } else if(type === 'woosh') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now+0.15);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.15);
        osc.start(now); osc.stop(now+0.15);
    } else if(type === 'zen') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(329.63, now);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.4, now+1);
        gain.gain.exponentialRampToValueAtTime(0.01, now+4); osc.start(now); osc.stop(now+4);
    } else if(type === 'pop') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now+0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1);
        osc.start(now); osc.stop(now+0.1);
    } else if(type === 'beep') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2);
        osc.start(now); osc.stop(now+0.2);
    } else if(type === 'kawaii_pop') {
        const baseFreqs = [523.25, 659.25, 783.99];
        baseFreqs.forEach((f, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(f*0.5, now); o.frequency.exponentialRampToValueAtTime(f*2, now+0.06); o.frequency.exponentialRampToValueAtTime(f, now+0.18);
            g.gain.setValueAtTime(0, now+i*0.02); g.gain.linearRampToValueAtTime(0.18, now+i*0.02+0.04); g.gain.exponentialRampToValueAtTime(0.01, now+i*0.02+0.5);
            o.connect(g); g.connect(sfxBus); o.start(now+i*0.02); o.stop(now+i*0.02+0.5);
        });
        const spark = audioCtx.createOscillator(); const sparkG = audioCtx.createGain();
        spark.type = 'triangle'; spark.frequency.setValueAtTime(2400, now); spark.frequency.exponentialRampToValueAtTime(1200, now+0.12);
        sparkG.gain.setValueAtTime(0.08, now); sparkG.gain.exponentialRampToValueAtTime(0.001, now+0.15);
        spark.connect(sparkG); sparkG.connect(sfxBus); spark.start(now); spark.stop(now+0.15);
        return;
    } else if(type === 'chime_portal') {
        [880, 1108.73, 1318.51, 1760].forEach((f, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0, now+i*0.1); g.gain.linearRampToValueAtTime(0.3, now+i*0.1+0.1); g.gain.exponentialRampToValueAtTime(0.01, now+i*0.1+1.5);
            o.connect(g); g.connect(sfxBus); o.start(now+i*0.1); o.stop(now+i*0.1+1.5);
        });
        return;
    }
}

function playThunder() {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime+1.5);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+1.5);
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0); for(let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
    const rumble = audioCtx.createBufferSource(); rumble.buffer = noiseBuffer;
    const rFilter = audioCtx.createBiquadFilter(); rFilter.type = 'lowpass';
    rFilter.frequency.setValueAtTime(1000, audioCtx.currentTime); rFilter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime+1.5);
    const rGain = audioCtx.createGain(); rGain.gain.setValueAtTime(0.42, audioCtx.currentTime); rGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+1.5);
    osc.connect(gain); gain.connect(sfxBus || masterGain);
    rumble.connect(rFilter); rFilter.connect(rGain); rGain.connect(sfxBus || masterGain);
    osc.start(); osc.stop(audioCtx.currentTime+1.5); rumble.start();
}

function playMikoChime(index) {
    if(!audioCtx || !sfxBus) return;
    const scale = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73];
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = scale[index % scale.length];
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+1.5);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+1.5);
}

function playCorrect() {
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime+0.1);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.5);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+0.5);
}

function playWrong() {
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime+0.3);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.3);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+0.3);
}

function playEvilLaugh() {
    // Pas de voix — oscillateurs sawtooth uniquement pour l'ambiance
    if(!audioCtx || !sfxBus) return;
    [100, 115, 130].forEach(f => {
        const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f;
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+2);
        osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+2);
    });
}

function enterTempleMode_legacy() { enterTempleMode(); }
function exitTempleMode_legacy() { exitTempleMode(); }

function updateDynamicMusic() {
    if(!audioCtx) return;
    setMusicMood('SACRE');
    const now = audioCtx.currentTime;
    if(currentFound < 3) audioLayers.chime.gain.linearRampToValueAtTime(0.03, now+1);
    if(currentFound < 6) audioLayers.melody.gain.linearRampToValueAtTime(0, now+1);
}

function transitionToDarkAudio() {
    if(!audioCtx) return;
    setMusicMood('RUPTURE');
}



/* Alias conservé pour compatibilité */
function findSageVoice() { return findBestVoice(); }

/* ─── SFX — via sfxBus → masterGain (inclus dans fade final) ─── */
function playGameSFX(type, freq=440) {
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(sfxBus);
    const now = audioCtx.currentTime;

    if(type === 'heartbeat') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(60, now); osc.frequency.exponentialRampToValueAtTime(30, now+0.3);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.3);
        osc.start(now); osc.stop(now+0.3);
    } else if(type === 'drum_g') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now+0.2);
        gain.gain.setValueAtTime(0.42, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2);
        osc.start(now); osc.stop(now+0.2);
    } else if(type === 'sword') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1);
        osc.start(now); osc.stop(now+0.1);
    } else if(type === 'thud') {
        osc.type = 'square'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(20, now+0.2);
        gain.gain.setValueAtTime(0.40, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2);
        osc.start(now); osc.stop(now+0.2);
    } else if(type === 'woosh') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now+0.15);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.15);
        osc.start(now); osc.stop(now+0.15);
    } else if(type === 'zen') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(329.63, now);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.4, now+1);
        gain.gain.exponentialRampToValueAtTime(0.01, now+4); osc.start(now); osc.stop(now+4);
    } else if(type === 'pop') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now+0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1);
        osc.start(now); osc.stop(now+0.1);
    } else if(type === 'beep') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2);
        osc.start(now); osc.stop(now+0.2);
    } else if(type === 'kawaii_pop') {
        const baseFreqs = [523.25, 659.25, 783.99];
        baseFreqs.forEach((f, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(f*0.5, now); o.frequency.exponentialRampToValueAtTime(f*2, now+0.06); o.frequency.exponentialRampToValueAtTime(f, now+0.18);
            g.gain.setValueAtTime(0, now+i*0.02); g.gain.linearRampToValueAtTime(0.18, now+i*0.02+0.04); g.gain.exponentialRampToValueAtTime(0.01, now+i*0.02+0.5);
            o.connect(g); g.connect(sfxBus); o.start(now+i*0.02); o.stop(now+i*0.02+0.5);
        });
        const spark = audioCtx.createOscillator(); const sparkG = audioCtx.createGain();
        spark.type = 'triangle'; spark.frequency.setValueAtTime(2400, now); spark.frequency.exponentialRampToValueAtTime(1200, now+0.12);
        sparkG.gain.setValueAtTime(0.08, now); sparkG.gain.exponentialRampToValueAtTime(0.001, now+0.15);
        spark.connect(sparkG); sparkG.connect(sfxBus); spark.start(now); spark.stop(now+0.15);
        return;
    } else if(type === 'chime_portal') {
        [880, 1108.73, 1318.51, 1760].forEach((f, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0, now+i*0.1); g.gain.linearRampToValueAtTime(0.3, now+i*0.1+0.1); g.gain.exponentialRampToValueAtTime(0.01, now+i*0.1+1.5);
            o.connect(g); g.connect(sfxBus); o.start(now+i*0.1); o.stop(now+i*0.1+1.5);
        });
        return;
    }
}

function playThunder() {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime+1.5);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+1.5);
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0); for(let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
    const rumble = audioCtx.createBufferSource(); rumble.buffer = noiseBuffer;
    const rFilter = audioCtx.createBiquadFilter(); rFilter.type = 'lowpass';
    rFilter.frequency.setValueAtTime(1000, audioCtx.currentTime); rFilter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime+1.5);
    const rGain = audioCtx.createGain(); rGain.gain.setValueAtTime(0.42, audioCtx.currentTime); rGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+1.5);
    osc.connect(gain); gain.connect(sfxBus || masterGain);
    rumble.connect(rFilter); rFilter.connect(rGain); rGain.connect(sfxBus || masterGain);
    osc.start(); osc.stop(audioCtx.currentTime+1.5); rumble.start();
}

function playMikoChime(index) {
    if(!audioCtx || !sfxBus) return;
    const scale = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73];
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = scale[index % scale.length];
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+1.5);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+1.5);
}

function playCorrect() {
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime+0.1);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.5);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+0.5);
}

function playWrong() {
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime+0.3);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.3);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+0.3);
}

function playEvilLaugh() {
    // Pas de voix — oscillateurs sawtooth uniquement pour l'ambiance
    if(!audioCtx || !sfxBus) return;
    [100, 115, 130].forEach(f => {
        const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f;
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+2);
        osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+2);
    });
}

function enterTempleMode_legacy() { enterTempleMode(); }
function exitTempleMode_legacy() { exitTempleMode(); }

function updateDynamicMusic() {
    if(!audioCtx) return;
    setMusicMood('SACRE');
    const now = audioCtx.currentTime;
    if(currentFound < 3) audioLayers.chime.gain.linearRampToValueAtTime(0.03, now+1);
    if(currentFound < 6) audioLayers.melody.gain.linearRampToValueAtTime(0, now+1);
}

function transitionToDarkAudio() {
    if(!audioCtx) return;
    setMusicMood('RUPTURE');
}

const KOKORO_PHRASES = [
    // Intro — phonétique anglaise qui sonne mystique/japonais pour Kokoro
    { text: "時の霧を越えて、　人の世界から遠く離れて…",            speed: 0.68, voice: "af_river",  tts: "Toki no kiri wo koete... hito no sekai kara tooku hanarete..." },
    { text: "水の精霊が、秘密を囁く場所が隠されている…",            speed: 0.68, voice: "af_river",  tts: "Mizu no seirei ga... himitsu wo sasayaku basho ga kakusarete iru..." },
    { text: "荘厳な猫神社が、　天に聳え立っていた。",               speed: 0.70, voice: "af_heart",  tts: "Sougen na neko jinja ga... ten ni sobie tatte ita." },
    { text: "純粋な魔法に満たされた、　領域。",                     speed: 0.65, voice: "af_heart",  tts: "Junsui na mahou ni mitasareta... ryouiki." },
    { text: "古代の精霊が、　静かに見守っていた。",                  speed: 0.65, voice: "bf_emma",   tts: "Kodai no seirei ga... shizuka ni mimamotte ita." },
    { text: "守護者は、聖なる剣、草薙を守っていました。",            speed: 0.65, voice: "bf_emma",   tts: "Shugosha wa... seinaru tsurugi... Kusanagi wo mamotte imashita." },
    { text: "しかし…　影の精霊が目覚め、　封印は砕け散った…",       speed: 0.62, voice: "af_bella",  tts: "Shikashi... kage no seirei ga mezame... fuuin wa kudake chitta..." },
    { text: "光は闇に飲まれ、　九つの守護者は四方に散った。",        speed: 0.62, voice: "af_bella",  tts: "Hikari wa yami ni nomare... kokonotsu no shugosha wa yomo ni chitta." },
    // Outro
    { text: "九つの守護者が、　揃いた。",                           speed: 0.80, voice: "af_kore",   tts: "Kokonotsu no shugosha ga... soroita." },
    { text: "影が…　最後に立つ。",                                  speed: 0.75, voice: "am_onyx",   tts: "Kage ga... saigo ni tatsu." },
    { text: "八人の巫女が聖地を、清めた。",                         speed: 0.82, voice: "bf_lily",   tts: "Hachinin no miko ga seichi wo... kiyometa." },
    { text: "光が、　再び聖地を照らした。",                         speed: 0.85, voice: "af_nicole", tts: "Hikari ga... futatabi seichi wo terashita." },
    { text: "妖怪は覚えている…　一枚の花びらで、十分だ。",          speed: 0.72, voice: "bm_fable",  tts: "Youkai wa oboete iru... hitomai no hanabira de... juubun da." },
    { text: "守護者たちは…永遠に…あなたたちを守る。",               speed: 0.78, voice: "af_heart",  tts: "Shugosha tachi wa... eien ni... anata tachi wo mamoru." },
    { text: "さようなら…　小さな守護者たち。",                      speed: 0.62, voice: "af_sky",    tts: "Sayounara... chiisana shugosha tachi." },
    { text: "この岸を、　離れる時だ。",                              speed: 0.70, voice: "af_sky",    tts: "Kono kishi wo... hanareru toki da." },
    { text: "灯籠を、追いかけて。",                                  speed: 0.68, voice: "af_sky",    tts: "Tourou wo... oikakete." },
    { text: "アヴァの屋根の下で、　ご馳走が待つ。",                  speed: 0.75, voice: "af_heart",  tts: "Ava no yane no shita de... gochisou ga matsu." },
    { text: "伝説を…　鏡に封印せよ。",                              speed: 0.72, voice: "af_kore",   tts: "Densetsu wo... kagami ni fuuin seyo." },
    { text: "八人の巫女の力が、勝る！",                              speed: 0.82, voice: "bf_lily",   tts: "Hachinin no miko no chikara ga... masaru!" },
    { text: "旅は、終わりに近づく…",                                speed: 0.68, voice: "af_sky",    tts: "Tabi wa... owari ni chikadzuku..." },
    { text: "精霊は今も、見守っている。",                            speed: 0.70, voice: "af_river",  tts: "Seirei wa ima mo... mimamotte iru." },
    { text: "思い出は永遠に、心に刻まれる。",                        speed: 0.72, voice: "af_heart",  tts: "Omoide wa eien ni... kokoro ni kizamareru." },
];


/* Conversion rate → speed Kokoro */
function _rateToSpeed(rate) {
    return Math.max(0.5, Math.min(2.0, rate || 0.82));
}

/* Vérifier connectivité */
async function _checkConnectivity() {
    if (typeof WebAssembly !== 'object') return false;
    const proto = location.protocol;
    const host = location.hostname;
    if (proto !== 'https:' && host !== 'localhost' && host !== '127.0.0.1') return false;
    return true;
}

/* Charger Kokoro */
async function initKokoro() {
    if (typeof _kokoroLoading !== 'undefined' && (_kokoroLoading || _kokoroReady)) return;
    _kokoroLoading = true;
    try {
        if (!await _checkConnectivity()) { _kokoroLoading = false; return; }
        _updateSplash(15, 'Connexion au Sanctuaire...');
        const { KokoroTTS } = await import('https://esm.sh/kokoro-js');
        if (!KokoroTTS) throw new Error('KokoroTTS non exporté');
        _updateSplash(30, 'Éveil des esprits gardiens...');
        // Détection WebGPU — 2x plus rapide que WASM si disponible
        const _hasWebGPU = !!navigator.gpu;
        const _device = _hasWebGPU ? 'webgpu' : 'wasm';
        const _dtype  = _hasWebGPU ? 'fp32'   : 'q4'; // q4 WASM = 30% plus rapide
        console.log(`[Kokoro] Device: ${_device} | dtype: ${_dtype}`);
        _kokoroTTS = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', { dtype: _dtype, device: _device });
        _kokoroReady = true;
        console.log('[Kokoro] ✓ Modèle prêt');
        window._kokoroReadyForGame = true;
        _updateSplash(60, 'Invocation des voix des gardiens...');
        _preGenerateKokoro();
    } catch(e) {
        console.warn('[Kokoro] Échec:', e.message);
        _kokoroLoading = false;
        _kokoroReady = false;
        window._kokoroReadyForGame = true;
        _updateSplash(100, 'Sanctuaire prêt ✦');
        setTimeout(kokoroSplashDone, 800);
    }
}

/* Pré-générer */
async function _preGenerateKokoro() {
    if (!_kokoroTTS || !_kokoroReady) return;
    setTimeout(() => {
        const skip = document.getElementById('kokoro-skip-btn');
        if (skip) { skip.style.display = 'block'; setTimeout(() => { skip.style.opacity='1'; }, 50); }
    }, 3000);
    let generated = 0;
    const INTRO_COUNT = 8; // Les 8 phrases intro en priorité
    const introPhrase = KOKORO_PHRASES.slice(0, INTRO_COUNT);
    const outroPhrase = KOKORO_PHRASES.slice(INTRO_COUNT);

    // Générateur commun
    async function _genPhrase({ text, speed, voice, tts }) {
        if (_kokoroCache.has(text)) return;
        try {
            const audio = await _kokoroTTS.generate(tts || text, {
                voice: voice || 'af_sky',
                speed: _rateToSpeed(speed),
            });
            const pcm = audio && audio.audio;
            const sr = (audio && audio.sampling_rate) || 24000;
            if (pcm && pcm.length > 0) {
                _kokoroCache.set(text, { audio: new Float32Array(pcm), sampleRate: sr });
                generated++;
                console.log(`[Kokoro] ${generated}/${KOKORO_PHRASES.length} — "${text.slice(0,15)}…"`);
                const pct = Math.round(60 + (generated / KOKORO_PHRASES.length) * 35);
                _updateSplash(pct, `Invocation des voix... ${generated}/${KOKORO_PHRASES.length} (${pct}%)`);
            }
        } catch(e) {
            console.error('[Kokoro] ERREUR:', text.slice(0,15), e.message);
        }
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    }

    // PHASE 1 — Intro (8 phrases) en priorité absolue
    console.log('[Kokoro] Phase 1 : génération intro...');
    for (const phrase of introPhrase) await _genPhrase(phrase);

    // Intro prête → splash peut disparaître, le jeu peut commencer
    console.log('[Kokoro] ✓ Intro prête — le jeu peut commencer');
    _updateSplash(100, '✦ Le Sanctuaire vous attend ✦');
    setTimeout(kokoroSplashDone, 800);

    // PHASE 2 — Outro (15 phrases) en background pendant le jeu
    console.log('[Kokoro] Phase 2 : génération outro en background...');
    for (const phrase of outroPhrase) await _genPhrase(phrase);
    console.log(`[Kokoro] ✓ Tout prêt — ${_kokoroCache.size}/23 phrases en cache`);
}

/* Jouer */
function _kokoroPlay(text, opts = {}) {
    const cached = _kokoroCache.get(text);
    if (!cached || !audioCtx) return Promise.resolve();
    return new Promise(resolve => {
        try {
            const buf = audioCtx.createBuffer(1, cached.audio.length, cached.sampleRate);
            buf.getChannelData(0).set(cached.audio);
            enterTempleMode();
            const source = audioCtx.createBufferSource();
            source.buffer = buf;
            source.connect(duckGain || masterGain);
            _kokoroCurrentSource = source;
            const finish = () => { _kokoroCurrentSource = null; exitTempleMode(); resolve(); };
            const timeout = setTimeout(() => { try { source.stop(); } catch(e) {} finish(); }, (buf.duration * 1000) + 2000);
            source.onended = () => { clearTimeout(timeout); finish(); };
            source.start();
        } catch(e) {
            console.warn('[Kokoro] Erreur lecture:', e.message);
            exitTempleMode(); resolve();
        }
    });
}

/* Splash */
function _updateSplash(pct, msg) {
    const bar = document.getElementById('kokoro-progress-bar');
    const txt = document.getElementById('kokoro-splash-status');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = msg;
}
function kokoroSplashDone() {
    const splash = document.getElementById('kokoro-splash');
    if (!splash) return;
    splash.style.opacity = '0';
    setTimeout(() => { if (splash.parentNode) splash.remove(); }, 800);
}

/* Variables globales Kokoro */
let _kokoroReady = false;
let _kokoroLoading = false;
let _kokoroTTS = null;
let _kokoroCache = new Map();
let _kokoroCurrentSource = null;

/* Lancer au chargement */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initKokoro, 1000));
} else {
    setTimeout(initKokoro, 1000);
}

/* Étendre cancelVoice */
const _cancelVoiceOriginal = cancelVoice;
cancelVoice = function() {
    if (_kokoroCurrentSource) { try { _kokoroCurrentSource.stop(); } catch(e) {} _kokoroCurrentSource = null; }
    _cancelVoiceOriginal();
};