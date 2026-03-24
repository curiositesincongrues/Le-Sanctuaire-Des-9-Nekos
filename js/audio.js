// AUDIO AAA FINAL

let audioCtx, masterGain, musicBus, sfxBus, voiceBus;

function initAudio(){
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();

  masterGain = audioCtx.createGain(); masterGain.gain.value = 0.44;

  musicBus = audioCtx.createGain(); musicBus.gain.value = 0.75;
  sfxBus   = audioCtx.createGain(); sfxBus.gain.value   = 0.30;
  voiceBus = audioCtx.createGain(); voiceBus.gain.value = 0.85;

  musicBus.connect(masterGain);
  sfxBus.connect(masterGain);
  voiceBus.connect(masterGain);
  masterGain.connect(audioCtx.destination);
}

function duckForVoice(active){
  const now = audioCtx.currentTime;
  musicBus.gain.linearRampToValueAtTime(active?0.18:0.75, now+0.2);
  sfxBus.gain.linearRampToValueAtTime(active?0.12:0.30, now+0.2);
}

async function playVoice(path){
  const a = new Audio(path);
  a.volume = 0;

  duckForVoice(true);

  await a.play();

  let v=0;
  const fade = setInterval(()=>{
    v+=0.05;
    a.volume = Math.min(0.78, v);
    if(v>=0.78) clearInterval(fade);
  },50);

  a.onended = ()=> duckForVoice(false);
}

window.initAudio = initAudio;
window.playVoice = playVoice;
window.duckForVoice = duckForVoice;
