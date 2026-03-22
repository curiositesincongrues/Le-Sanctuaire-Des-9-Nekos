/* --- AUDIO.JS — Musique Cinématique + SFX + Voix --- */

async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } 
    catch (err) { console.log("WakeLock non supporté", err); }
}
document.addEventListener('click', requestWakeLock, {once:true});

/* === TEMPLE AUDIO NODES === */
let templeFilter = null, templeReverb = null, templeDelay = null, templeDelayGain = null;
let dryGain = null, wetGain = null;

/* === MUSIC LAYERS === */
let windNode = null, windFilter = null, windLFO = null, windLFOGain = null;
let padOscs = [], padGain = null;
let chimeInterval = null, chimeGain = null;
let melodyGain = null, melodyInterval = null;
let taikoInterval = null, taikoGain = null;
let subDrone = null, subDroneGain = null;

/* Gamme pentatonique japonaise Yo (Do-Ré-Fa-Sol-La) */
const YO_SCALE = [261.63, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99, 880.00];
/* Gamme sombre In (Mi-Fa-La-Si-Do) pour l'Ombre */
const IN_SCALE = [164.81, 174.61, 220.00, 246.94, 261.63, 329.63, 349.23, 440.00];

let currentChimeScale = YO_SCALE;
let currentMelodyNotes = [];
let melodyIndex = 0;

function createTempleImpulse(ctx, duration, decay) {
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
    }
    return buf;
}

function initSfx() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    /* --- CHAÎNE TEMPLE : masterGain → filter → dry/wet → destination --- */
    masterGain = audioCtx.createGain(); masterGain.gain.value = 0.6;
    dryGain = audioCtx.createGain(); dryGain.gain.value = 1.0;
    wetGain = audioCtx.createGain(); wetGain.gain.value = 0.0;
    
    templeFilter = audioCtx.createBiquadFilter();
    templeFilter.type = 'lowpass'; templeFilter.frequency.value = 20000; templeFilter.Q.value = 0.5;
    
    templeReverb = audioCtx.createConvolver();
    templeReverb.buffer = createTempleImpulse(audioCtx, 3.0, 2.5);
    
    templeDelay = audioCtx.createDelay(1.0); templeDelay.delayTime.value = 0.08;
    templeDelayGain = audioCtx.createGain(); templeDelayGain.gain.value = 0.15;
    
    masterGain.connect(templeFilter);
    templeFilter.connect(dryGain); templeFilter.connect(wetGain);
    dryGain.connect(audioCtx.destination);
    wetGain.connect(templeReverb); templeReverb.connect(audioCtx.destination);
    wetGain.connect(templeDelay); templeDelay.connect(templeDelayGain); templeDelayGain.connect(wetGain);

    /* === LAYER 1 : VENT MODULÉ === */
    audioLayers.wind = audioCtx.createGain(); audioLayers.wind.gain.value = 0; audioLayers.wind.connect(masterGain);
    const bufSize = audioCtx.sampleRate * 2; const noiseBuf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const noiseOut = noiseBuf.getChannelData(0); for (let i = 0; i < bufSize; i++) noiseOut[i] = Math.random() * 2 - 1;
    windNode = audioCtx.createBufferSource(); windNode.buffer = noiseBuf; windNode.loop = true;
    windFilter = audioCtx.createBiquadFilter(); windFilter.type = 'lowpass'; windFilter.frequency.value = 300; windFilter.Q.value = 1.0;
    windLFO = audioCtx.createOscillator(); windLFO.type = 'sine'; windLFO.frequency.value = 0.15;
    windLFOGain = audioCtx.createGain(); windLFOGain.gain.value = 200;
    windLFO.connect(windLFOGain); windLFOGain.connect(windFilter.frequency);
    windNode.connect(windFilter); windFilter.connect(audioLayers.wind);
    windNode.start(); windLFO.start();
    
    /* === LAYER 2 : PAD JAPONAIS === */
    audioLayers.pad = audioCtx.createGain(); audioLayers.pad.gain.value = 0; audioLayers.pad.connect(masterGain);
    padGain = audioCtx.createGain(); padGain.gain.value = 0.12; padGain.connect(audioLayers.pad);
    createPadChord([130.81, 196.00, 174.61]);
    
    /* === LAYER 3 : CHIMES === */
    audioLayers.chime = audioCtx.createGain(); audioLayers.chime.gain.value = 0; audioLayers.chime.connect(masterGain);
    chimeGain = audioCtx.createGain(); chimeGain.gain.value = 0.08; chimeGain.connect(audioLayers.chime);
    
    /* === LAYER 4 : MÉLODIE SHAKUHACHI === */
    audioLayers.melody = audioCtx.createGain(); audioLayers.melody.gain.value = 0; audioLayers.melody.connect(masterGain);
    melodyGain = audioCtx.createGain(); melodyGain.gain.value = 0.1; melodyGain.connect(audioLayers.melody);
    
    /* === LAYER 5 : TAIKO === */
    taikoGain = audioCtx.createGain(); taikoGain.gain.value = 0; taikoGain.connect(masterGain);
    
    /* === LAYER 6 : SUB DRONE === */
    subDroneGain = audioCtx.createGain(); subDroneGain.gain.value = 0; subDroneGain.connect(masterGain);
    subDrone = audioCtx.createOscillator(); subDrone.type = 'sine'; subDrone.frequency.value = 40;
    const subFilter = audioCtx.createBiquadFilter(); subFilter.type = 'lowpass'; subFilter.frequency.value = 80;
    subDrone.connect(subFilter); subFilter.connect(subDroneGain); subDrone.start();
    
    /* === DRONE HARMONIQUE DE BASE === */
    [73.42, 87.31, 110.00].forEach(f => {
        const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
        const gain = audioCtx.createGain(); gain.gain.value = 0;
        osc.connect(gain); gain.connect(masterGain); osc.start(); mainOscillators.push({osc, gain});
    });
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

function playMelodyNote() {
    if (!audioCtx || !melodyGain || currentMelodyNotes.length === 0) return;
    const freq = currentMelodyNotes[melodyIndex % currentMelodyNotes.length];
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
    if (!audioCtx || currentMusicMood === scene) return;
    currentMusicMood = scene;
    const now = audioCtx.currentTime;
    const t = 2;
    
    if (chimeInterval) { clearInterval(chimeInterval); chimeInterval = null; }
    if (melodyInterval) { clearInterval(melodyInterval); melodyInterval = null; }
    if (taikoInterval) { clearInterval(taikoInterval); taikoInterval = null; }
    
    function ramp(param, val, dur) {
        param.cancelScheduledValues(now); param.linearRampToValueAtTime(val, now + (dur || t));
    }
    
    if (scene === 'VOYAGE') {
        ramp(audioLayers.wind.gain, 0.25);
        ramp(audioLayers.pad.gain, 0.03);
        ramp(audioLayers.chime.gain, 0);
        ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0);
        ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.1;
        windFilter.frequency.value = 250;
        createPadChord([130.81, 196.00]);
        chimePatternIdx = 0; currentChimeScale = YO_SCALE;
        chimeInterval = setInterval(playChimeNote, 6000);
        
    } else if (scene === 'DECOUVERTE') {
        ramp(audioLayers.wind.gain, 0.18);
        ramp(audioLayers.pad.gain, 0.08);
        ramp(audioLayers.chime.gain, 0.06);
        ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0);
        ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.12;
        windFilter.frequency.value = 350;
        createPadChord([130.81, 196.00, 174.61]);
        currentChimeScale = YO_SCALE;
        chimeInterval = setInterval(playChimeNote, 3500);
        
    } else if (scene === 'SACRE') {
        ramp(audioLayers.wind.gain, 0.12);
        ramp(audioLayers.pad.gain, 0.12);
        ramp(audioLayers.chime.gain, 0.08);
        ramp(audioLayers.melody.gain, 0.10);
        ramp(taikoGain.gain, 0.08);
        ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.08;
        windFilter.frequency.value = 400;
        createPadChord([130.81, 196.00, 174.61, 220.00]);
        currentChimeScale = YO_SCALE;
        currentMelodyNotes = [440, 392, 349.23, 392, 440, 523.25, 440, 349.23];
        melodyIndex = 0;
        chimeInterval = setInterval(playChimeNote, 2500);
        melodyInterval = setInterval(playMelodyNote, 4000);
        taikoInterval = setInterval(playTaikoHit, 5000);
        
    } else if (scene === 'RUPTURE') {
        ramp(audioLayers.wind.gain, 0.35);
        ramp(audioLayers.pad.gain, 0);
        ramp(audioLayers.chime.gain, 0.04);
        ramp(audioLayers.melody.gain, 0);
        ramp(taikoGain.gain, 0.20);
        ramp(subDroneGain.gain, 0.15);
        windLFO.frequency.value = 0.4;
        windFilter.frequency.value = 800;
        currentChimeScale = IN_SCALE;
        chimePatternIdx = 0;
        chimeInterval = setInterval(playChimeNote, 2000);
        taikoInterval = setInterval(playTaikoHit, 1500);
        subDrone.frequency.linearRampToValueAtTime(55, now + 6);
        
    } else if (scene === 'CHUTE') {
        ramp(audioLayers.wind.gain, 0.08, 4);
        ramp(audioLayers.pad.gain, 0, 3);
        ramp(audioLayers.chime.gain, 0, 3);
        ramp(audioLayers.melody.gain, 0, 3);
        ramp(taikoGain.gain, 0, 3);
        ramp(subDroneGain.gain, 0.05, 4);
        windLFO.frequency.value = 0.05;
        windFilter.frequency.value = 150;
        subDrone.frequency.linearRampToValueAtTime(30, now + 5);
        
    } else if (scene === 'VICTOIRE') {
        ramp(audioLayers.wind.gain, 0.05);
        ramp(audioLayers.pad.gain, 0.15);
        ramp(audioLayers.chime.gain, 0.12);
        ramp(audioLayers.melody.gain, 0.14);
        ramp(taikoGain.gain, 0);
        ramp(subDroneGain.gain, 0);
        windLFO.frequency.value = 0.06;
        windFilter.frequency.value = 500;
        createPadChord([261.63, 329.63, 392.00, 523.25]);
        currentChimeScale = YO_SCALE;
        currentMelodyNotes = [523.25, 587.33, 698.46, 587.33, 523.25, 440, 523.25, 698.46];
        melodyIndex = 0;
        chimeInterval = setInterval(playChimeNote, 1800);
        melodyInterval = setInterval(playMelodyNote, 2500);
        
    } else if (scene === 'EPILOGUE') {
        ramp(audioLayers.wind.gain, 0.1);
        ramp(audioLayers.pad.gain, 0.04);
        ramp(audioLayers.chime.gain, 0.06);
        ramp(audioLayers.melody.gain, 0.08);
        ramp(taikoGain.gain, 0);
        ramp(subDroneGain.gain, 0.02);
        windLFO.frequency.value = 0.04;
        windFilter.frequency.value = 200;
        createPadChord([130.81, 196.00]);
        currentChimeScale = YO_SCALE;
        currentMelodyNotes = [440, 392, 349.23, 293.66, 261.63];
        melodyIndex = 0;
        chimeInterval = setInterval(playChimeNote, 6000);
        melodyInterval = setInterval(playMelodyNote, 5000);
        subDrone.frequency.linearRampToValueAtTime(40, now + 4);
    }
    console.log('[Music Mood]', scene);
}

function enterTempleMode() {
    if (!audioCtx || !templeFilter) return;
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
    templeFilter.frequency.cancelScheduledValues(now);
    templeFilter.frequency.linearRampToValueAtTime(800, now + 1.0);
    wetGain.gain.cancelScheduledValues(now);
    wetGain.gain.linearRampToValueAtTime(0.35, now + 1.0);
}

function exitTempleMode() {
    if (!audioCtx || !templeFilter) return;
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(0.6, now + 1.5);
    templeFilter.frequency.cancelScheduledValues(now);
    templeFilter.frequency.linearRampToValueAtTime(20000, now + 1.5);
    wetGain.gain.cancelScheduledValues(now);
    wetGain.gain.linearRampToValueAtTime(0.0, now + 2.0);
}

function updateDynamicMusic() {
    if(!audioCtx) return;
    setMusicMood('SACRE');
    const now = audioCtx.currentTime;
    if(currentFound < 3) audioLayers.chime.gain.linearRampToValueAtTime(0.03, now + 1);
    if(currentFound < 6) audioLayers.melody.gain.linearRampToValueAtTime(0, now + 1);
}

function transitionToDarkAudio() {
    if(!audioCtx) return;
    setMusicMood('RUPTURE');
}

function playGameSFX(type, freq=440) {
    if(!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
    
    if(type === 'heartbeat') { 
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(60, now); 
        osc.frequency.exponentialRampToValueAtTime(30, now+0.3); 
        gain.gain.setValueAtTime(0.4, now); // Réduction du volume (calme)
        gain.gain.exponentialRampToValueAtTime(0.01, now+0.3); 
        osc.start(now); osc.stop(now+0.3); 
        // AUCUNE VIBRATION POUR LE CŒUR (Économie batterie)
    }
    else if(type === 'drum_g') { osc.type = 'sine'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now+0.2); gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2); osc.start(now); osc.stop(now+0.2); } 
    else if(type === 'sword') { osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, now); gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1); osc.start(now); osc.stop(now+0.1); } 
    else if(type === 'thud') { osc.type = 'square'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(20, now+0.2); gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2); osc.start(now); osc.stop(now+0.2); } 
    else if(type === 'woosh') { osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now+0.15); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.15); osc.start(now); osc.stop(now+0.15); } 
    else if(type === 'zen') { osc.type = 'sine'; osc.frequency.setValueAtTime(329.63, now); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.4, now+1); gain.gain.exponentialRampToValueAtTime(0.01, now+4); osc.start(now); osc.stop(now+4); } 
    else if(type === 'pop') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now+0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.1); osc.start(now); osc.stop(now+0.1); } 
    else if(type === 'beep') { osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.2); osc.start(now); osc.stop(now+0.2); } 
    else if(type === 'kawaii_pop') {
        const baseFreqs = [523.25, 659.25, 783.99];
        baseFreqs.forEach((f, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(f * 0.5, now);
            o.frequency.exponentialRampToValueAtTime(f * 2, now + 0.06);
            o.frequency.exponentialRampToValueAtTime(f, now + 0.18);
            g.gain.setValueAtTime(0, now + i * 0.02);
            g.gain.linearRampToValueAtTime(0.18, now + i * 0.02 + 0.04);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.02 + 0.5);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now + i * 0.02); o.stop(now + i * 0.02 + 0.5);
        });
        const spark = audioCtx.createOscillator(); const sparkGain = audioCtx.createGain();
        spark.type = 'triangle';
        spark.frequency.setValueAtTime(2400, now); spark.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        sparkGain.gain.setValueAtTime(0.08, now); sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        spark.connect(sparkGain); sparkGain.connect(audioCtx.destination);
        spark.start(now); spark.stop(now + 0.15);
    }
    else if (type === 'chime_portal') {
        const freqs = [880, 1108.73, 1318.51, 1760];
        freqs.forEach((f, i) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, now + i*0.1); g.gain.linearRampToValueAtTime(0.3, now + i*0.1 + 0.1); g.gain.exponentialRampToValueAtTime(0.01, now + i*0.1 + 1.5); o.connect(g); g.connect(audioCtx.destination); o.start(now + i*0.1); o.stop(now + i*0.1 + 1.5); });
    }
}

function playThunder() {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    const bufferSize = audioCtx.sampleRate; const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const rumble = audioCtx.createBufferSource(); rumble.buffer = noiseBuffer;
    const rumbleFilter = audioCtx.createBiquadFilter(); rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(1000, audioCtx.currentTime); rumbleFilter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 1.5);
    const rumbleGain = audioCtx.createGain(); rumbleGain.gain.setValueAtTime(0.8, audioCtx.currentTime); rumbleGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    osc.connect(gain); gain.connect(masterGain); rumble.connect(rumbleFilter); rumbleFilter.connect(rumbleGain); rumbleGain.connect(masterGain); osc.start(); osc.stop(audioCtx.currentTime + 1.5); rumble.start();
}

function playMikoChime(index) {
    if(!audioCtx) return; const scale = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73]; 
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = scale[index % scale.length];
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 1.5);
}

function playCorrect() {
    if(!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

function playWrong() {
    if(!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

function playEvilLaugh() {
    speakDuckedFire("Ha ha ha ha ha", { pitch: 0.1, rate: 0.5, volume: 0.5 });
    if(!audioCtx) return;
    [100, 115, 130].forEach(f => {
        const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f;
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 2);
    });
}

let sageVoice = null, sageVoiceSearched = false;

function findSageVoice() {
    if (sageVoiceSearched) return sageVoice;
    sageVoiceSearched = true;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const femaleRx = /female|woman|femme|kyoko|haruka|nanami|o-ren|mizuki|mei|sakura|hana|yui|aoi|amelie|chloe|marie|audrey|virginie/i;
    const maleRx = /male|man|homme|takumi|ichiro|kenta|kenji|otoko|ryo|daichi|hiro|kenichi|daisuke|thomas|nicolas|philippe/i;
    function pickBestFrom(pool) {
        if (!pool.length) return null;
        const notFemale = pool.filter(v => !femaleRx.test(v.name));
        const male = (notFemale.length ? notFemale : pool).find(v => maleRx.test(v.name));
        return male || notFemale[0] || pool[0];
    }
    const jpVoices = voices.filter(v => v.lang.startsWith('ja'));
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));
    sageVoice = pickBestFrom(jpVoices) || pickBestFrom(frVoices) || voices[0];
    console.log('[Sage Voice]', sageVoice ? `${sageVoice.name} (${sageVoice.lang})` : 'aucune voix');
    return sageVoice;
}

if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => { sageVoiceSearched = false; findSageVoice(); };
}

function speakDucked(text, opts = {}) {
    const lang    = opts.lang    || 'ja-JP';
    const rate    = opts.rate    || 0.9;
    const pitch   = opts.pitch   || 0.5;
    const volume  = opts.volume  || 0.85;
    const maxMs   = opts.maxMs   || 8000;
    return new Promise(resolve => {
        window.speechSynthesis.cancel();
        enterTempleMode();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang; u.rate = rate; u.pitch = pitch; u.volume = volume;
        const voice = findSageVoice(); if (voice) u.voice = voice;
        let done = false;
        const finish = () => { if (done) return; done = true; clearTimeout(timeout); exitTempleMode(); resolve(); };
        const timeout = setTimeout(() => { window.speechSynthesis.cancel(); finish(); }, maxMs);
        u.onend = finish; u.onerror = finish;
        window.speechSynthesis.speak(u);
    });
}

function speakDuckedFire(text, opts = {}) { speakDucked(text, opts); }

function talkSync(txt, lang, rate=0.7) {
    if(introSkipped) return Promise.resolve();
    return new Promise(r => { 
        enterTempleMode();
        const sageTxt = txt.replace(/、/g, '、...').replace(/。/g, '。...');
        const u = new SpeechSynthesisUtterance(sageTxt);
        u.lang = lang; u.rate = rate; u.pitch = 0.5; u.volume = 0.85;
        const voice = findSageVoice(); if (voice) u.voice = voice;
        const finish = () => { exitTempleMode(); r(); };
        let timeout = setTimeout(() => { window.speechSynthesis.cancel(); finish(); }, 12000);
        u.onend = () => { clearTimeout(timeout); finish(); };
        u.onerror = () => { clearTimeout(timeout); finish(); };
        window.speechSynthesis.speak(u); 
    });
}