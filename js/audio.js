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

function getFoundCount() {
    if (typeof currentFound === 'number') return currentFound;
    if (window.GameState && Number.isFinite(Number(GameState.currentFound))) return Number(GameState.currentFound);
    return 0;
}

function syncAudioGlobals() {
    window.audioCtx = audioCtx;
    window.masterGain = masterGain;
    window.AudioEngine = Object.assign(window.AudioEngine || {}, {
        ctx: audioCtx,
        masterBus: masterGain,
        duckBus: duckGain,
        musicBus: masterGain,
        ambienceBus: audioLayers && audioLayers.ambience ? audioLayers.ambience : null,
        sfxBus,
        uiBus: window.__uiBus || null,
        voiceBus: window.__voiceBus || null,
        dryGain,
        wetGain,
        ready: !!audioCtx
    });
}

function createMasterChain(ctx) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.42;

    duckGain = ctx.createGain();
    duckGain.gain.value = 1.0;

    dryGain = ctx.createGain();
    dryGain.gain.value = 1.0;

    wetGain = ctx.createGain();
    wetGain.gain.value = 0.0;

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.34;

    window.__uiBus = ctx.createGain();
    window.__uiBus.gain.value = 0.40;

    window.__voiceBus = ctx.createGain();
    window.__voiceBus.gain.value = 1.0;

    const masterComp = ctx.createDynamicsCompressor();
    masterComp.threshold.value = -18;
    masterComp.knee.value = 16;
    masterComp.ratio.value = 2.2;
    masterComp.attack.value = 0.01;
    masterComp.release.value = 0.18;

    const masterTone = ctx.createBiquadFilter();
    masterTone.type = 'lowshelf';
    masterTone.frequency.value = 180;
    masterTone.gain.value = 1.5;

    templeFilter = ctx.createBiquadFilter();
    templeFilter.type = 'lowpass';
    templeFilter.frequency.value = 20000;
    templeFilter.Q.value = 0.5;

    templeReverb = ctx.createConvolver();
    templeReverb.buffer = createTempleImpulse(ctx, 3.0, 2.5);

    templeDelay = ctx.createDelay(1.0);
    templeDelay.delayTime.value = 0.08;

    templeDelayGain = ctx.createGain();
    templeDelayGain.gain.value = 0.028;

    masterGain.connect(duckGain);
    sfxBus.connect(duckGain);
    window.__uiBus.connect(duckGain);
    window.__voiceBus.connect(duckGain);
    duckGain.connect(templeFilter);

    templeFilter.connect(dryGain);
    templeFilter.connect(wetGain);

    dryGain.connect(masterTone);
    wetGain.connect(templeReverb);
    templeReverb.connect(masterTone);

    wetGain.connect(templeDelay);
    templeDelay.connect(templeDelayGain);
    templeDelayGain.connect(wetGain);

    masterTone.connect(masterComp);
    masterComp.connect(ctx.destination);
}

function _startAmbientSpiritBells() {
    if (!audioCtx || !audioLayers.ambience) return;
    if (audioLayers.ambience.__spiritTimer) clearInterval(audioLayers.ambience.__spiritTimer);
    audioLayers.ambience.__spiritTimer = setInterval(() => {
        if (!audioCtx || !audioLayers.ambience) return;
        const now = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const p = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
        o.type = 'sine';
        o.frequency.value = [659.25, 783.99, 987.77][Math.floor(Math.random() * 3)];
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.018, now + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
        if (p) p.pan.value = (Math.random() * 2 - 1) * 0.35;
        o.connect(g);
        if (p) { g.connect(p); p.connect(audioLayers.ambience); }
        else g.connect(audioLayers.ambience);
        o.start(now);
        o.stop(now + 2.8);
    }, 9000);
}

function initSfx() {
    if (audioCtx) {
        try { if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
        syncAudioGlobals();
        if (window.GameState) GameState.isAudioReady = true;
        return audioCtx;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
        console.warn('WebAudio non supporté');
        return null;
    }

    audioCtx = new Ctx();
    createMasterChain(audioCtx);

    audioLayers.wind = audioCtx.createGain();
    audioLayers.wind.gain.value = 0;
    audioLayers.wind.connect(masterGain);

    const bufSize = audioCtx.sampleRate * 2;
    const noiseBuf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const noiseOut = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) noiseOut[i] = Math.random() * 2 - 1;

    windNode = audioCtx.createBufferSource();
    windNode.buffer = noiseBuf;
    windNode.loop = true;

    windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 300;
    windFilter.Q.value = 1.0;

    windLFO = audioCtx.createOscillator();
    windLFO.type = 'sine';
    windLFO.frequency.value = 0.15;

    windLFOGain = audioCtx.createGain();
    windLFOGain.gain.value = 200;
    windLFO.connect(windLFOGain);
    windLFOGain.connect(windFilter.frequency);
    windNode.connect(windFilter);
    windFilter.connect(audioLayers.wind);
    windNode.start();
    windLFO.start();

    audioLayers.pad = audioCtx.createGain();
    audioLayers.pad.gain.value = 0;
    audioLayers.pad.connect(masterGain);

    padGain = audioCtx.createGain();
    padGain.gain.value = 0.03;
    padGain.connect(audioLayers.pad);

    const padLFO = audioCtx.createOscillator();
    const padLFOGain = audioCtx.createGain();
    padLFO.type = 'sine';
    padLFO.frequency.value = 0.025;
    padLFOGain.gain.value = 0.05;
    padLFO.connect(padLFOGain);
    padLFOGain.connect(padGain.gain);
    padLFO.start();
    createPadChord([130.81, 196.00, 174.61]);

    audioLayers.chime = audioCtx.createGain();
    audioLayers.chime.gain.value = 0;
    audioLayers.chime.connect(masterGain);
    chimeGain = audioCtx.createGain();
    chimeGain.gain.value = 0.022;
    chimeGain.connect(audioLayers.chime);

    audioLayers.melody = audioCtx.createGain();
    audioLayers.melody.gain.value = 0;
    audioLayers.melody.connect(masterGain);
    melodyGain = audioCtx.createGain();
    melodyGain.gain.value = 0.040;
    melodyGain.connect(audioLayers.melody);

    taikoGain = audioCtx.createGain();
    taikoGain.gain.value = 0.022;
    taikoGain.connect(masterGain);

    subDroneGain = audioCtx.createGain();
    subDroneGain.gain.value = 0.020;
    subDroneGain.connect(masterGain);

    subDrone = audioCtx.createOscillator();
    subDrone.type = 'sine';
    subDrone.frequency.value = 40;
    const subFilter = audioCtx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 80;
    subDrone.connect(subFilter);
    subFilter.connect(subDroneGain);
    subDrone.start();

    audioLayers.ambience = audioCtx.createGain();
    audioLayers.ambience.gain.value = 0.0;
    audioLayers.ambience.connect(masterGain);
    _startAmbientSpiritBells();

    [73.42, 87.31, 110.00].forEach(f => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        mainOscillators.push({osc, gain});
    });

    syncAudioGlobals();
    if (window.GameState) GameState.isAudioReady = true;

    // Pré-créer et déverrouiller le hub music ici — on est dans un contexte de geste utilisateur.
    // Sans ça, new Audio().play() depuis un setTimeout est bloqué sur iOS/Android.
    _preloadHubMusic();

    return audioCtx;
}

window.initAudio = initSfx;
window.getAudioContext = function () { return audioCtx; };
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
let introMusicEl = null;
window.__silenceGameAudioUntilNextGame = window.__silenceGameAudioUntilNextGame || false;

function shouldBlockGameAudio() {
    return !!(window.__hubMusicActive || window.__silenceGameAudioUntilNextGame);
}

function stopAllGameAudioForHub() {
    window.__silenceGameAudioUntilNextGame = true;
    try { _chimeGen++; _melodyGen++; } catch (e) {}
    try { if (taikoInterval) { clearInterval(taikoInterval); taikoInterval = null; } } catch (e) {}
    try { muteProceduralMusic(0.03); } catch (e) {}
    try { if (audioCtx && audioLayers?.wind?.gain) audioLayers.wind.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && audioLayers?.pad?.gain) audioLayers.pad.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && audioLayers?.chime?.gain) audioLayers.chime.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && audioLayers?.melody?.gain) audioLayers.melody.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && audioLayers?.ambience?.gain) audioLayers.ambience.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && taikoGain?.gain) taikoGain.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && subDroneGain?.gain) subDroneGain.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && wetGain?.gain) wetGain.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (audioCtx && sfxBus?.gain) sfxBus.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    currentMusicMood = null;
}

function enableGameAudioFX() {
    window.__silenceGameAudioUntilNextGame = false;
    try { if (audioCtx && sfxBus?.gain) sfxBus.gain.setValueAtTime(1, audioCtx.currentTime); } catch (e) {}
}

function _rampGainNode(gainNode, target, dur = 1.5) {
    if (!audioCtx || !gainNode) return;
    const now = audioCtx.currentTime;
    try {
        gainNode.cancelScheduledValues(now);
        gainNode.linearRampToValueAtTime(target, now + dur);
    } catch (e) {}
}

function muteProceduralMusic(dur = 1.2) {
    if (!audioCtx || !window.audioLayers) return;
    _chimeGen++; _melodyGen++;
    if (taikoInterval) { clearInterval(taikoInterval); taikoInterval = null; }
    try { _rampGainNode(audioLayers.wind.gain, 0, dur); } catch (e) {}
    try { _rampGainNode(audioLayers.pad.gain, 0, dur); } catch (e) {}
    try { _rampGainNode(audioLayers.chime.gain, 0, dur); } catch (e) {}
    try { _rampGainNode(audioLayers.melody.gain, 0, dur); } catch (e) {}
    try { _rampGainNode(audioLayers.ambience.gain, 0, dur); } catch (e) {}
    try { _rampGainNode(taikoGain.gain, 0, dur); } catch (e) {}
    try { _rampGainNode(subDroneGain.gain, 0, dur); } catch (e) {}
    try { if (wetGain && wetGain.gain) _rampGainNode(wetGain.gain, 0, Math.max(0.2, dur)); } catch (e) {}
    currentMusicMood = null;
}

async function playIntroMusicTrack() {
    try {
        window.__useIntroMusicOverride = true;
        muteProceduralMusic(0.4);

        if (introMusicEl) {
            try { introMusicEl.pause(); } catch (e) {}
            introMusicEl = null;
        }

        const src = './audio/intro_music_75s.mp3?v=3';
        const a = new Audio(src);
        a.preload = 'auto';
        a.loop = false;
        a.volume = 0.28;
        introMusicEl = a;
        window.__introMusicEl = a;
        await a.play();
        console.log('[INTRO MUSIC] started', src);
        return a;
    } catch (e) {
        console.warn('[INTRO MUSIC] play failed', e);
        return null;
    }
}

function stopIntroMusicTrack(fadeMs = 1200) {
    window.__useIntroMusicOverride = false;
    if (!introMusicEl) return;
    const a = introMusicEl;
    const startVol = a.volume || 0.28;
    const stepMs = 50;
    const steps = Math.max(1, Math.round(fadeMs / stepMs));
    let n = 0;
    const timer = setInterval(() => {
        n += 1;
        try { a.volume = Math.max(0, startVol * (1 - n / steps)); } catch (e) {}
        if (n >= steps) {
            clearInterval(timer);
            try { a.pause(); a.currentTime = 0; } catch (e) {}
            if (introMusicEl === a) introMusicEl = null;
            if (window.__introMusicEl === a) window.__introMusicEl = null;
        }
    }, stepMs);
}

const SCENE_AUDIO_PROFILES = {
    VOYAGE:     { wet: 0.03, cutoff: 17500, ambience: 0.02, duck: 0.20 },
    DECOUVERTE: { wet: 0.08, cutoff: 16000, ambience: 0.04, duck: 0.18 },
    SACRE:      { wet: 0.13, cutoff: 14500, ambience: 0.06, duck: 0.17 },
    RUPTURE:    { wet: 0.10, cutoff: 9000,  ambience: 0.02, duck: 0.23 },
    CHUTE:      { wet: 0.18, cutoff: 7000,  ambience: 0.01, duck: 0.26 },
    VICTOIRE:   { wet: 0.11, cutoff: 17000, ambience: 0.05, duck: 0.16 },
    MIROIR:     { wet: 0.22, cutoff: 12000, ambience: 0.03, duck: 0.14 },
    EPILOGUE:   { wet: 0.19, cutoff: 15000, ambience: 0.05, duck: 0.15 }
};

function applySceneProfile(scene) {
    if (!audioCtx) return;
    const profile = SCENE_AUDIO_PROFILES[scene];
    if (!profile) return;
    const now = audioCtx.currentTime;
    try {
        wetGain.gain.cancelScheduledValues(now);
        wetGain.gain.linearRampToValueAtTime(profile.wet, now + 1.3);
        templeFilter.frequency.cancelScheduledValues(now);
        templeFilter.frequency.linearRampToValueAtTime(profile.cutoff, now + 1.5);
        if (audioLayers.ambience) {
            audioLayers.ambience.gain.cancelScheduledValues(now);
            audioLayers.ambience.gain.linearRampToValueAtTime(profile.ambience, now + 1.5);
        }
        window.__duckTarget = profile.duck;
    } catch (e) {}
}

function updateDynamicMusic() {
    if (shouldBlockGameAudio()) return;
    if (!audioCtx) return;
    const count = getFoundCount();
    const now = audioCtx.currentTime;

    if (count >= 9) setMusicMood('VICTOIRE');
    else if (count >= 6) setMusicMood('SACRE');
    else if (count >= 3) setMusicMood('DECOUVERTE');
    else setMusicMood('VOYAGE');

    try {
        if (audioLayers.chime) audioLayers.chime.gain.linearRampToValueAtTime(count >= 3 ? 0.034 : 0.022, now + 1.2);
        if (audioLayers.melody) audioLayers.melody.gain.linearRampToValueAtTime(count >= 6 ? 0.048 : 0.0, now + 1.2);
        if (taikoGain) taikoGain.gain.linearRampToValueAtTime(count >= 9 ? 0.02 : 0.0, now + 1.2);
        if (subDroneGain) subDroneGain.gain.linearRampToValueAtTime(count >= 6 ? 0.018 : 0.0, now + 1.2);
        if (audioLayers.ambience) audioLayers.ambience.gain.linearRampToValueAtTime(Math.min(0.06, count * 0.01), now + 1.2);
    } catch (e) {}
}

function setMusicMood(scene) {
    if (window.__useIntroMusicOverride && ['VOYAGE','DECOUVERTE','SACRE','RUPTURE','CHUTE'].includes(scene)) {
        console.log('[Music Mood] blocked by intro override:', scene);
        return;
    }
    // Bloquer la musique procédurale quand le MP3 hub joue
    if (shouldBlockGameAudio()) {
        console.log('[Music Mood] blocked:', scene, { hub: !!window.__hubMusicActive, silenced: !!window.__silenceGameAudioUntilNextGame });
        return;
    }
    if (!audioCtx) return;
    currentMusicMood = scene;
    const now = audioCtx.currentTime;
    const t = 2;
    _chimeGen++; _melodyGen++;
    if (taikoInterval) { clearInterval(taikoInterval); taikoInterval = null; }

    function ramp(param, val, dur) {
        if (!param) return;
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
        ramp(audioLayers.wind.gain, 0.14); ramp(audioLayers.pad.gain, 0.05);
        ramp(audioLayers.chime.gain, 0.028); ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0); ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.12; windFilter.frequency.value = 350;
        createPadChord([130.81, 196.00, 174.61]);
        currentChimeScale = YO_SCALE;
        scheduleChime(3000, 1200);

    } else if (scene === 'SACRE') {
        ramp(audioLayers.wind.gain, 0.10); ramp(audioLayers.pad.gain, 0.06);
        ramp(audioLayers.chime.gain, 0.035); ramp(audioLayers.melody.gain, 0.05);
        ramp(taikoGain.gain, 0.018); ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.08; windFilter.frequency.value = 400;
        createPadChord([130.81, 196.00, 174.61, 220.00]);
        currentChimeScale = YO_SCALE;
        if (melodyGain) melodyGain.gain.value = 0.05;
        if (chimeGain) chimeGain.gain.value = 0.03;
        currentMelodyNotes = [523.25, 654.06, 784.00, 1046.5, 1308.13, 1046.5, 784.00, 654.06];
        melodyIndex = 0; _lastMelodyNotes = [];
        scheduleChime(1800, 600);
        scheduleMelody(1800, 600);
        taikoInterval = setInterval(playTaikoHit, 3500);

    } else if (scene === 'RUPTURE') {
        ramp(audioLayers.wind.gain, 0.18); ramp(audioLayers.pad.gain, 0);
        ramp(audioLayers.chime.gain, 0.018); ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0.022); ramp(subDroneGain.gain, 0.020);
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
        ramp(audioLayers.wind.gain, 0.04); ramp(audioLayers.pad.gain, 0.07);
        ramp(audioLayers.chime.gain, 0.04); ramp(audioLayers.melody.gain, 0.05);
        ramp(taikoGain.gain, 0); ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.06; windFilter.frequency.value = 500;
        createPadChord([261.63, 329.63, 392.00, 523.25]);
        currentChimeScale = YO_SCALE;
        if (melodyGain) melodyGain.gain.value = 0.06;
        if (chimeGain) chimeGain.gain.value = 0.04;
        currentMelodyNotes = [880.00, 1046.5, 1174.66, 1318.51, 1046.5, 880.00, 784.00, 880.00];
        melodyIndex = 0; _lastMelodyNotes = [];
        scheduleChime(1200, 500);
        scheduleMelody(1500, 600);

    } else if (scene === 'MIROIR') {
        ramp(audioLayers.wind.gain, 0.02, 3); ramp(audioLayers.pad.gain, 0, 3);
        ramp(audioLayers.chime.gain, 0.012, 3); ramp(audioLayers.melody.gain, 0, 3);
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
    applySceneProfile(scene);
    syncAudioGlobals();
    console.log('[Music Mood]', scene);
}

/* ─── TEMPLE MODE — ducking sur duckGain uniquement ─── */
function enterTempleMode() {
    if (!audioCtx || !duckGain) return;
    const now = audioCtx.currentTime;
    const target = typeof window.__duckTarget === 'number' ? window.__duckTarget : 0.18;
    duckGain.gain.cancelScheduledValues(now);
    duckGain.gain.setTargetAtTime(target, now, 0.22);
}

function exitTempleMode() {
    if (!audioCtx || !duckGain) return;
    const now = audioCtx.currentTime;
    duckGain.gain.cancelScheduledValues(now);
    duckGain.gain.setTargetAtTime(1.0, now, 0.45);
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

    // MP3 fast-path — si disponible joue le fichier JP pré-généré
    if (typeof _mp3ArrayBuffers !== 'undefined' && _mp3ArrayBuffers.has(text)) return _playMP3(text);
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
    // MP3 fast-path
    if (typeof _mp3ArrayBuffers !== 'undefined' && _mp3ArrayBuffers.has(txt)) return _playMP3(txt);
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
    if (shouldBlockGameAudio()) return;
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
    if (shouldBlockGameAudio()) return;
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
    if (shouldBlockGameAudio()) return;
    if(!audioCtx || !sfxBus) return;
    const scale = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73];
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = scale[index % scale.length];
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+1.5);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+1.5);
}

function playCorrect() {
    if (shouldBlockGameAudio()) return;
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime+0.1);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.5);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+0.5);
}

function playWrong() {
    if (shouldBlockGameAudio()) return;
    if(!audioCtx || !sfxBus) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime+0.3);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.3);
    osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+0.3);
}

function playEvilLaugh() {
    // Pas de voix — oscillateurs sawtooth uniquement pour l'ambiance
    if (shouldBlockGameAudio()) return;
    if(!audioCtx || !sfxBus) return;
    [100, 115, 130].forEach(f => {
        const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f;
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+2);
        osc.connect(gain); gain.connect(sfxBus); osc.start(); osc.stop(audioCtx.currentTime+2);
    });
}

function enterTempleMode_legacy() { enterTempleMode(); }
function exitTempleMode_legacy() { exitTempleMode(); }

function transitionToDarkAudio() {
    if(!audioCtx) return;
    setMusicMood('RUPTURE');
}





/* ═══════════════════════════════════════════════════════════
   SYSTÈME VOIX MP3 — Fichiers audio individuels JP
   Architecture : 27 fichiers MP3 dans audio/voices/
   Fallback : speechSynthesis si MP3 non disponible
   ═══════════════════════════════════════════════════════════ */

// Map texteJP → nom de fichier MP3
const MP3_FILES = {
    "時の霧を越えて、　人の世界から遠く離れて…":     "intro_01.mp3",
    "水の精霊が、秘密を囁く場所が隠されている…":     "intro_02.mp3",
    "荘厳な猫神社が、　天に聳え立っていた。":         "intro_03.mp3",
    "純粋な魔法に満たされた、　領域。":               "intro_04.mp3",
    "古代の精霊が、　静かに見守っていた。":           "intro_05.mp3",
    "守護者は、聖なる剣、草薙を守っていました。":     "intro_06.mp3",
    "しかし…　影の精霊が目覚め、　封印は砕け散った…": "intro_07.mp3",
    "光は闇に飲まれ、　九つの守護者は四方に散った。": "intro_08.mp3",
    "九つの守護者が、　揃いた。":                     "outro_01.mp3",
    "影が…　最後に立つ。":                           "outro_02.mp3",
    "八人の巫女が聖地を、清めた。":                   "outro_03.mp3",
    "光が、　再び聖地を照らした。":                   "outro_04.mp3",
    "妖怪は覚えている…　一枚の花びらで、十分だ。":   "outro_05.mp3",
    "守護者たちは…永遠に…あなたたちを守る。":        "outro_06.mp3",
    "さようなら…　小さな守護者たち。":               "outro_07.mp3",
    "この岸を、　離れる時だ。":                       "outro_08.mp3",
    "灯籠を、追いかけて。":                           "outro_09.mp3",
    "アヴァの屋根の下で、　ご馳走が待つ。":           "outro_10.mp3",
    "伝説を…　鏡に封印せよ。":                       "outro_11.mp3",
    "光が、　再び照らす。":                           "game_01.mp3",
    "友情が…影を清めた。":                           "game_02.mp3",
    "守護者たちが、感謝する。":                       "game_03.mp3",
    "勝利は、封印された。":                           "game_04.mp3",
    "八人の巫女の力が、勝る！":                       "var_01.mp3",
    "旅は、終わりに近づく…":                         "var_02.mp3",
    "精霊は今も、見守っている。":                     "var_03.mp3",
    "思い出は永遠に、心に刻まれる。":                 "var_04.mp3",
};

// Cache des ArrayBuffers bruts — décodés en AudioBuffer au moment du jeu avec le vrai audioCtx
const _mp3ArrayBuffers = new Map();
let _mp3Ready = false;
let _mp3CurrentSource = null;

async function initVoiceMP3() {
    const introFiles = [
        "intro_01.mp3", "intro_02.mp3", "intro_03.mp3", "intro_04.mp3",
        "intro_05.mp3", "intro_06.mp3", "intro_07.mp3", "intro_08.mp3"
    ];
    try {
        _updateSplash(20, 'Éveil des voix...');
        let loaded = 0;
        for (const file of introFiles) {
            try {
                const resp = await fetch('audio/voices/' + file);
                if (!resp.ok) continue;
                const arrayBuf = await resp.arrayBuffer();
                const text = Object.keys(MP3_FILES).find(k => MP3_FILES[k] === file);
                // Stocker l'ArrayBuffer brut — pas d'AudioBuffer ici
                // Le décodage se fait au moment du jeu avec le vrai audioCtx
                if (text) _mp3ArrayBuffers.set(text, arrayBuf);
                loaded++;
                const pct = Math.round(20 + (loaded / introFiles.length) * 75);
                _updateSplash(pct, `Éveil des voix... ${loaded}/${introFiles.length}`);
            } catch(e) { /* silencieux */ }
        }
        _mp3Ready = true;
        _updateSplash(100, '✦ Le Sanctuaire vous attend ✦');
        console.log(`[MP3] ✓ ${loaded}/8 voix intro prêtes`);
        setTimeout(kokoroSplashDone, 800);
        _preloadRemainingMP3();
    } catch(e) {
        console.warn('[MP3] Échec:', e.message);
        _updateSplash(100, 'Sanctuaire prêt ✦');
        setTimeout(kokoroSplashDone, 500);
    }
}

/* Charger les autres fichiers en background */
async function _preloadRemainingMP3() {
    const allFiles = Object.values(MP3_FILES);
    const introFiles = ["intro_01.mp3","intro_02.mp3","intro_03.mp3","intro_04.mp3",
                        "intro_05.mp3","intro_06.mp3","intro_07.mp3","intro_08.mp3"];
    const remaining = allFiles.filter(f => !introFiles.includes(f));
    for (const file of remaining) {
        const text = Object.keys(MP3_FILES).find(k => MP3_FILES[k] === file);
        if (!text || _mp3ArrayBuffers.has(text)) continue;
        try {
            const resp = await fetch('audio/voices/' + file);
            if (!resp.ok) continue;
            const arrayBuf = await resp.arrayBuffer();
            _mp3ArrayBuffers.set(text, arrayBuf);
        } catch(e) { /* silencieux */ }
        await new Promise(r => setTimeout(r, 100));
    }
    console.log(`[MP3] ✓ Tout prêt — ${_mp3ArrayBuffers.size}/27 voix chargées`);
}

/* Obtenir ou créer l'AudioContext */
function _getAudioCtx() {
    if (typeof audioCtx !== 'undefined' && audioCtx) return audioCtx;
    return new (window.AudioContext || window.webkitAudioContext)();
}

/* Jouer un fichier MP3 depuis le cache */
async function _playMP3(text) {
    const arrayBuf = _mp3ArrayBuffers.get(text);
    if (!arrayBuf) return;
    const ctx = (typeof audioCtx !== 'undefined' && audioCtx)
        ? audioCtx
        : new (window.AudioContext || window.webkitAudioContext)();
    try {
        const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
        return new Promise(resolve => {
            try {
                enterTempleMode();

                // Nœud source
                const source = ctx.createBufferSource();
                source.buffer = audioBuf;
                _mp3CurrentSource = source;

                // Gain voix +2dB (1.26) pour homogénéité INTRO/OUTRO
                const voiceGain = ctx.createGain();
                voiceGain.gain.value = 1.26;

                // Fade-in 120ms + fade-out 200ms
                const fadeGain = ctx.createGain();
                const now = ctx.currentTime;
                const dur = audioBuf.duration;
                fadeGain.gain.setValueAtTime(0, now);
                fadeGain.gain.linearRampToValueAtTime(1.0, now + 0.12);
                fadeGain.gain.setValueAtTime(1.0, now + Math.max(0, dur - 0.2));
                fadeGain.gain.linearRampToValueAtTime(0, now + dur);

                // Reverb léger — wetGain à 0.08 pendant la voix
                if (typeof wetGain !== 'undefined' && wetGain) {
                    wetGain.gain.cancelScheduledValues(now);
                    wetGain.gain.setTargetAtTime(0.08, now, 0.05);
                    wetGain.gain.setTargetAtTime(0.0, now + dur - 0.1, 0.08);
                }

                // Chaîne : source → voiceGain → fadeGain → duckGain
                source.connect(voiceGain);
                voiceGain.connect(fadeGain);
                fadeGain.connect(duckGain || masterGain || ctx.destination);

                const finish = () => {
                    _mp3CurrentSource = null;
                    if (typeof wetGain !== 'undefined' && wetGain) {
                        wetGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.08);
                    }
                    exitTempleMode();
                    resolve();
                };
                const timeout = setTimeout(() => { try { source.stop(); } catch(e) {} finish(); }, (dur * 1000) + 1200);
                source.onended = () => { clearTimeout(timeout); finish(); };
                source.start();
            } catch(e) {
                console.warn('[MP3] Erreur lecture:', e.message);
                exitTempleMode(); resolve();
            }
        });
    } catch(e) {
        console.warn('[MP3] Erreur décodage:', e.message);
    }
}

/* Splash screen */
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

/* Lancer au chargement */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initVoiceMP3, 500));
} else {
    setTimeout(initVoiceMP3, 500);
}

/* Étendre cancelVoice */
const _cancelVoiceOriginal = cancelVoice;
cancelVoice = function() {
    if (_mp3CurrentSource) { try { _mp3CurrentSource.stop(); } catch(e) {} _mp3CurrentSource = null; }
    _cancelVoiceOriginal();
};

/* ═══════════════════════════════════════════════════════
   HUB MUSIC — Lecture du MP3 hub_music.mp3
   Remplace la musique procédurale pendant le hub
   ═══════════════════════════════════════════════════════ */

let _hubMusicEl = null;
let _hubMusicFading = false;

/**
 * Lance la musique du hub (MP3).
 * Coupe la musique procédurale le temps de la lecture.
 * Loopable : se relance automatiquement à la fin.
 */
/**
 * Pré-charge et déverrouille le hub music pendant un geste utilisateur.
 * Doit être appelé depuis initSfx() (= contexte de clic).
 */
function _preloadHubMusic() {
    try {
        if (_hubMusicEl) return; // déjà créé
        const a = new Audio('./audio/hub_music.mp3?v=1');
        a.preload = 'auto';
        a.loop = true;
        a.volume = 0;
        _hubMusicEl = a;
        window.__hubMusicEl = a;
        // Jouer puis mettre en pause immédiatement — déverrouille l'élément pour les appels futurs
        a.play().then(() => {
            a.pause();
            a.currentTime = 0;
            console.log('[Hub Music] pré-chargé et déverrouillé ✓');
        }).catch(e => {
            console.warn('[Hub Music] préchargement échoué:', e.message);
            _hubMusicEl = null;
            window.__hubMusicEl = null;
        });
    } catch(e) {
        console.warn('[Hub Music] _preloadHubMusic erreur:', e.message);
    }
}

async function playHubMusic() {
    // Activer le flag — bloque toute musique procédurale pendant le hub
    window.__hubMusicActive = true;
    muteProceduralMusic(0.25);

    try {
        let a = _hubMusicEl;

        if (!a) {
            // Fallback : créer un nouvel élément (ne devrait pas arriver si _preloadHubMusic a tourné)
            a = new Audio('./audio/hub_music.mp3?v=1');
            a.preload = 'auto';
            a.loop = true;
            _hubMusicEl = a;
            window.__hubMusicEl = a;
        }

        // Si déjà en cours, juste remonter le volume
        if (!a.paused) {
            a.volume = 0;
            let n = 0;
            const fadeIn = setInterval(() => {
                n++;
                try { a.volume = Math.min(0.30, 0.30 * (n / 30)); } catch(e) {}
                if (n >= 30) clearInterval(fadeIn);
            }, 50);
            return;
        }

        // En pause — reprendre là où on en était (currentTime non remis à 0)
        a.volume = 0;
        await a.play();

        // Fade in
        let n = 0;
        const fadeIn = setInterval(() => {
            n++;
            try { a.volume = Math.min(0.30, 0.30 * (n / 30)); } catch (e) {}
            if (n >= 30) clearInterval(fadeIn);
        }, 50);

        console.log('[Hub Music] reprise ✓');
    } catch (e) {
        console.warn('[Hub Music] échec lecture:', e.message);
    }
}

/**
 * Arrête la musique du hub avec fondu.
 * Relance la musique procédurale adaptée au contexte.
 */
function stopHubMusic(fadeMs = 1000, resumeProcedural = true) {
    // Désactiver le flag procédural — bloque la musique procédurale
    window.__hubMusicActive = false;
    if (!_hubMusicEl) return;
    if (_hubMusicFading) return;
    _hubMusicFading = true;

    const a = _hubMusicEl;
    // NE PAS nullifier _hubMusicEl — on garde la référence déverrouillée pour iOS
    // Si on la détruit, le prochain play() crée un nouvel élément non autorisé
    const startVol = a.volume || 0.30;
    const stepMs = 50;
    const steps = Math.max(1, Math.round(fadeMs / stepMs));
    let n = 0;

    const fadeOut = setInterval(() => {
        n++;
        try { a.volume = Math.max(0, startVol * (1 - n / steps)); } catch (e) {}
        if (n >= steps) {
            clearInterval(fadeOut);
            try { a.pause(); } catch (e) {}
            // currentTime intentionnellement NON remis à 0 — reprend là où on était
            _hubMusicFading = false;
            console.log('[Hub Music] mise en pause ✓');
        }
    }, stepMs);
}

window.playHubMusic  = playHubMusic;
window.stopHubMusic  = stopHubMusic;

window.stopAllGameAudioForHub = stopAllGameAudioForHub;
window.enableGameAudioFX = enableGameAudioFX;
