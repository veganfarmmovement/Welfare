/* VEGANFARM original piano-style score — generated locally with Web Audio after an explicit play action. */
(function(){
 'use strict';
 if(document.getElementById('vf-piano-player'))return;
 var store={enabled:false,muted:false,volume:32};
 try{
  store.enabled=localStorage.getItem('vf_music_enabled')==='1';
  store.muted=localStorage.getItem('vf_music_muted')==='1';
  var saved=Number(localStorage.getItem('vf_music_volume'));
  if(Number.isFinite(saved)&&saved>=0&&saved<=100)store.volume=saved;
 }catch(_e){}
 var root=document.createElement('section');
 root.id='vf-piano-player';
 root.className='vf-piano-player';
 root.setAttribute('aria-label','Optional VEGANFARM piano music controls');
 root.innerHTML='<button type="button" class="vf-piano-play" id="vf-piano-play" aria-pressed="false">Play music</button><span class="vf-piano-status" id="vf-piano-status" aria-live="polite">Music off</span><button type="button" class="vf-piano-mute" id="vf-piano-mute" aria-pressed="false">Mute</button><label class="vf-piano-volume-label" for="vf-piano-volume">Volume</label><input id="vf-piano-volume" class="vf-piano-volume" type="range" min="0" max="100" value="'+store.volume+'" aria-label="Music volume">';
 document.body.appendChild(root);
 var playBtn=root.querySelector('#vf-piano-play');
 var muteBtn=root.querySelector('#vf-piano-mute');
 var status=root.querySelector('#vf-piano-status');
 var volumeInput=root.querySelector('#vf-piano-volume');
 var ctx=null,master=null,timer=null,playing=false,nextLoop=0;
 var bpm=68,beat=60/bpm,loopBeats=16,loopDuration=loopBeats*beat;
 var notes=[
  // Original, slow four-bar progression in C major / A minor / F major / G major.
  [0,64,1.45,.75],[0,48,2.2,.44],[0.5,55,1.1,.25],[1,60,1.2,.34],[1.5,64,1.0,.25],[2,67,1.3,.32],[2.5,72,1.1,.24],[3,71,1.1,.25],[3.5,67,1.0,.22],
  [4,60,1.4,.7],[4,45,2.2,.42],[4.5,52,1.0,.24],[5,57,1.2,.32],[5.5,60,1.0,.24],[6,64,1.3,.3],[6.5,69,1.0,.23],[7,67,1.0,.24],[7.5,64,1.0,.2],
  [8,65,1.4,.68],[8,41,2.2,.4],[8.5,48,1.0,.23],[9,53,1.2,.3],[9.5,57,1.0,.23],[10,60,1.3,.3],[10.5,65,1.0,.22],[11,64,1.0,.22],[11.5,60,1.0,.2],
  [12,62,1.5,.7],[12,43,2.2,.42],[12.5,50,1.0,.23],[13,55,1.2,.3],[13.5,59,1.0,.22],[14,62,1.2,.3],[14.5,67,1.0,.22],[15,64,1.0,.22],[15.5,59,1.0,.2]
 ];
 function save(){
  try{localStorage.setItem('vf_music_enabled',store.enabled?'1':'0');localStorage.setItem('vf_music_muted',store.muted?'1':'0');localStorage.setItem('vf_music_volume',String(store.volume));}catch(_e){}
 }
 function update(){
  playBtn.textContent=playing?'Pause music':'Play music';
  playBtn.setAttribute('aria-pressed',playing?'true':'false');
  muteBtn.textContent=store.muted?'Unmute':'Mute';
  muteBtn.setAttribute('aria-pressed',store.muted?'true':'false');
  status.textContent=playing?(store.muted?'Music on · muted':'Music on'):(store.enabled?'Music ready · press play':'Music off');
  volumeInput.value=String(store.volume);
  root.classList.toggle('is-playing',playing);
 }
 function midiHz(m){return 440*Math.pow(2,(m-69)/12);}
 function pianoNote(midi,when,duration,velocity){
  if(!ctx||!master)return;
  var f=midiHz(midi),noteGain=ctx.createGain();
  var amp=Math.max(.002,Math.min(.12,velocity*.055));
  noteGain.gain.setValueAtTime(.0001,when);
  noteGain.gain.linearRampToValueAtTime(amp,when+.012);
  noteGain.gain.exponentialRampToValueAtTime(amp*.32,when+.16);
  noteGain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  noteGain.connect(master);
  [[1,1],[2,.25],[3,.1],[4,.045],[5,.018]].forEach(function(part){
   var osc=ctx.createOscillator(),g=ctx.createGain();
   osc.type='sine';osc.frequency.setValueAtTime(f*part[0],when);
   g.gain.value=part[1];osc.connect(g);g.connect(noteGain);
   osc.start(when);osc.stop(when+duration+.04);
  });
 }
 function schedule(){
  if(!ctx||!playing)return;
  var horizon=ctx.currentTime+.7;
  while(nextLoop<horizon){
   notes.forEach(function(n){pianoNote(n[1],nextLoop+n[0]*beat,n[2]*beat,n[3]);});
   nextLoop+=loopDuration;
  }
 }
 async function start(){
  var AC=window.AudioContext||window.webkitAudioContext;
  if(!AC){status.textContent='Audio is not supported in this browser';return;}
  try{
   if(!ctx){ctx=new AC();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);}
   if(ctx.state==='suspended')await ctx.resume();
   playing=true;store.enabled=true;save();
   var target=store.muted?0:store.volume/100*.19;
   master.gain.cancelScheduledValues(ctx.currentTime);
   master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
   master.gain.linearRampToValueAtTime(target,ctx.currentTime+.8);
   nextLoop=ctx.currentTime+.12;
   if(timer)clearInterval(timer);
   schedule();timer=setInterval(schedule,120);
   update();
  }catch(_e){playing=false;status.textContent='Could not start audio. Try again.';update();}
 }
 function pause(){
  playing=false;
  if(timer){clearInterval(timer);timer=null;}
  if(ctx&&master){
   master.gain.cancelScheduledValues(ctx.currentTime);
   master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
   master.gain.linearRampToValueAtTime(0,ctx.currentTime+.35);
  }
  save();update();
 }
 playBtn.addEventListener('click',function(){if(playing)pause();else start();});
 muteBtn.addEventListener('click',function(){
  store.muted=!store.muted;
  if(ctx&&master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(store.muted?0:store.volume/100*.19,ctx.currentTime,.06);}
  save();update();
 });
 volumeInput.addEventListener('input',function(){
  store.volume=Number(volumeInput.value)||0;
  if(ctx&&master&&!store.muted)master.gain.setTargetAtTime(store.volume/100*.19,ctx.currentTime,.06);
  save();update();
 });
 window.addEventListener('pagehide',pause);
 document.addEventListener('visibilitychange',function(){if(document.hidden&&playing)pause();});
 // A remembered preference never triggers autoplay. The visitor must press Play.
 update();
})();
