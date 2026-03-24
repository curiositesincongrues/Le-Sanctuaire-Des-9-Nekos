// GAME PATCH AAA INTRO/OUTRO

let introMusic, outroMusic;

function startIntro(){
  introMusic = new Audio('./audio/intro_music_75s.mp3');
  introMusic.volume = 0.25;
  introMusic.play();
}

function startOutro(){
  outroMusic = new Audio('./audio/outro_music_90s.mp3');
  outroMusic.volume = 0.25;
  outroMusic.play();
}

function endOutro(){
  const step = outroMusic.volume/40;
  const i = setInterval(()=>{
    outroMusic.volume = Math.max(0, outroMusic.volume-step);
    if(outroMusic.volume<=0){
      clearInterval(i);
      outroMusic.pause();
    }
  },50);
}
