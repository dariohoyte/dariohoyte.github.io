'use strict';
(()=>{
const $=id=>document.getElementById(id),open=$('openFlappy'),screen=$('flappyScreen');if(!open||!screen)return;
const canvas=$('flappyCanvas'),ctx=canvas.getContext('2d'),W=300,H=330,ground=316,birdX=83,radius=12;
const config={easy:{base:1.30,cap:1.30,gap:166,spacing:190,gravity:.21,flap:-3.85},medium:{base:1.65,cap:1.40,gap:150,spacing:180,gravity:.235,flap:-3.9},nightmare:{base:2.03,cap:1.45,gap:138,spacing:175,gravity:.245,flap:-4.05}};
let difficulty='easy',best=0,score=0,y=145,velocity=0,pipes=[],spawn=0,raf=0,last=0,mode='welcome',batPhase=0,previousTop=100;
let audio=null,musicTimer=0,musicStep=0,previousMessage="";
let countrysideTime=0,farmAmbient=0,birds=[],cityTime=0,cityAmbient=0,trainX=360,trainWait=0,taxiX=360,taxiWait=0,libertyX=480,libertyWait=0;
let countdownStart=0,countdownNumber=0;
let speedMultiplier=1.0,speedFlashFrames=0;
let restartTimer=0,restartUnlockedAt=0;
const activeTouches=new Set();
window.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')activeTouches.add(e.pointerId)},true);
const releaseTouch=e=>activeTouches.delete(e.pointerId);
window.addEventListener('pointerup',releaseTouch,true);window.addEventListener('pointercancel',releaseTouch,true);
let cityTrains=[],cityCars=[],trainSpawn=0,carSpawn=0,citySigns=[],cityPlanes=[],cityFlocks=[],flockSpawn=0,planeSpawn=0,hornCooldown=0,crashCooldown=0;
let sirenDelay=0,sirenActive=0,sirenPhase=0;
let phaseBillboard=-1, phaseClockCount=0, activeClockSign=null, clockLastExit=-100;
let nightmareTravel=0,monsterAt=0;
let draculaTimer=0,draculaX=-100,draculaY=55,stormClock=0,nextFlash=0,lightning=0,boltX=180,boltSeed=0,flashEcho=0,rain=[],rainBurst=0,nextRainBurst=0;
const sessionBests={easy:0,medium:0,nightmare:0};
const AudioClass=window.AudioContext||window.webkitAudioContext;
const cheerful=[659,0,784,659,523,0,587,659,784,0,880,784,659,587,523,0];
const sinister=[220,0,233,196,0,175,185,0,164,0,175,147,0,131,147,0];
// Original synthwave-inspired NYC loop: syncopated bass, soft backbeat, neon lead.
const cityRetro=[392,0,466.16,523.25,0,466.16,392,0,349.23,0,392,466.16,0,523.25,466.16,0];
const cityBass=[98,98,116.54,98,87.31,87.31,116.54,130.81];
const messages={easy:['Gravity remains undefeated.','A promising career, briefly.','That pipe came out of nowhere. Allegedly.','Flying lessons are non-refundable.','You almost looked professional.','The little guy believed in you.','A beautiful three-second journey.'],medium:['The MTA would have been faster.','Another meeting missed.','Should have worked from home.','Manhattan traffic: undefeated.','Your boss is typing…','Late again. Classic New York.','Commute status: extremely delayed.'],nightmare:['Count Flapula has left the chat.','Fangs out. Wings down.','Back to the coffin. Again.','Even vampires have bad nights.','Immortality has its limitations.','The night has claimed another intern.','Your cape has been repossessed.']};
function randomMessage(){const pool=messages[difficulty].filter(x=>x!==previousMessage);previousMessage=pool[Math.floor(Math.random()*pool.length)];return previousMessage}
function syncMusicOption(){const enabled=!window.miniAppsSoundEnabled||window.miniAppsSoundEnabled();document.querySelector('.wing-music-option').hidden=!enabled;if(!enabled){$('wingMusic').checked=false;stopMusic()}}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=0}}
function note(freq,duration=.16,volume=.045,type='square'){if(!freq||!audio||audio.state!=='running')return;try{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+.012;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.02)}catch(_){}}
function musicAllowed(){return mode==='running'&&$('wingMusic').checked&&(!window.miniAppsSoundEnabled||window.miniAppsSoundEnabled())&&!document.hidden}
async function startMusic(){stopMusic();if(!musicAllowed()||!AudioClass)return;try{if(!audio)audio=new AudioClass();if(audio.state==='suspended')await audio.resume();if(!musicAllowed()||audio.state!=='running')return;musicStep=0;const tick=()=>{if(!musicAllowed()){stopMusic();return}const night=difficulty==='nightmare',city=difficulty==='medium';if(city){const step=musicStep%16;note(cityRetro[step],.13,.029,'triangle');if(step%2===0)note(cityBass[Math.floor(step/2)],.18,.047,'sawtooth');if(step%4===0)note(65,.09,.035,'triangle');if(step%4===2)note(185,.045,.016,'square');if(step%2===1)note(1244.5,.025,.006,'triangle')}else{const melody=night?sinister:cheerful;note(melody[musicStep%16],night?.19:.15,night?.065:.047,night?'sawtooth':'square');if(musicStep%4===0)note(night?82:165,.24,night?.046:.026,'triangle');if(night&&musicStep%4===2)note(65,.10,.018,'triangle')}musicStep++};tick();musicTimer=setInterval(tick,difficulty==='nightmare'?210:difficulty==='medium'?155:175)}catch(_){}}
function sound(name){if(typeof window.playMiniAppSound==='function')window.playMiniAppSound(name)}
function readBest(){return sessionBests[difficulty]||0}
function saveBest(){sessionBests[difficulty]=Math.max(sessionBests[difficulty],score)}
function updateScores(){best=Math.max(best,score);$('flappyScore').textContent=score;$('flappyBest').textContent=best;$('flappyWelcomeBest').textContent=best;$('wingBestLabel').textContent=difficulty.toUpperCase()+' BEST';$('wingHudMode').textContent=difficulty.toUpperCase();}
function chooseDifficulty(){difficulty=document.querySelector('input[name="wingDifficulty"]:checked')?.value||'easy';best=readBest();screen.classList.toggle('wing-nightmare',difficulty==='nightmare');updateScores();}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;stopMusic()}
function reset(){clearTimeout(restartTimer);restartTimer=0;restartUnlockedAt=0;$('flappyFlap').hidden=false;$('flappyFlap').disabled=false;stop();score=0;speedMultiplier=1.0;speedFlashFrames=0;y=145;velocity=0;pipes=[];spawn=0;previousTop=90;batPhase=0;countrysideTime=0;farmAmbient=0;cityTime=0;cityAmbient=0;trainX=360;trainWait=0;taxiX=170;taxiWait=0;libertyX=450;libertyWait=550+Math.random()*500;cityTrains=[];cityCars=[{x:35,color:"#f2c63d",taxi:true,speed:1.45,dir:1,lane:1,visualLane:1,crashFx:0,brake:0},{x:184,color:"#62798b",taxi:false,speed:1.05,dir:-1,lane:0,visualLane:0,crashFx:0,brake:0},{x:260,color:"#d6a348",taxi:true,speed:2.3,dir:1,lane:1,visualLane:1,crashFx:0,brake:0}];cityPlanes=[];cityFlocks=[];flockSpawn=90+Math.random()*120;trainSpawn=150;carSpawn=18;planeSpawn=650+Math.random()*750;hornCooldown=170+Math.random()*260;crashCooldown=2300+Math.random()*2200;sirenDelay=25+Math.random()*235;sirenActive=0;sirenPhase=0;citySigns=[];phaseBillboard=-1;phaseClockCount=0;activeClockSign=null;clockLastExit=-100;nightmareTravel=0;monsterAt=320+Math.random()*320;birds=Array.from({length:4},(_,i)=>({x:20+i*83+Math.random()*25,y:35+Math.random()*95,s:.6+Math.random()*.6}));draculaTimer=0;draculaX=W+38;draculaY=63;stormClock=0;nextFlash=65+Math.random()*75;lightning=0;flashEcho=0;rainBurst=0;nextRainBurst=150+Math.random()*220;rain=Array.from({length:65},()=>({x:Math.random()*W,y:Math.random()*ground,length:7+Math.random()*10,speed:2.5+Math.random()*2.8}));mode='ready';$('flappyOverlay').hidden=true;document.querySelector('.flappy-hint').hidden=false;$('flappyChangeMode').hidden=true;$('flappyFlap').innerHTML='<i class="fa-solid fa-arrow-up"></i> FLAP';updateScores();draw()}
function start(){chooseDifficulty();reset();mode='countdown';countdownStart=0;countdownNumber=0;$('flappyFlap').disabled=true;$('flappyFlap').innerHTML='<i class="fa-solid fa-hourglass-half"></i> GET READY';raf=requestAnimationFrame(countdownFrame)}
function countdownFrame(now){if(mode!=='countdown')return;if(!countdownStart)countdownStart=now;const elapsed=now-countdownStart,step=Math.min(3,Math.floor(elapsed/850));const number=step<3?3-step:0;if(number!==countdownNumber){countdownNumber=number;if(!window.miniAppsSoundEnabled||window.miniAppsSoundEnabled()){if(!audio&&AudioClass)try{audio=new AudioClass()}catch(_){};if(audio?.state==='suspended')audio.resume().catch(()=>{});note(number?440+step*65:880,.13,.06,'square')}}const dt=Math.min(2,(now-(last||now))/16.6667);last=now;batPhase+=dt;if(difficulty==='easy')updateCountryside(dt,false);if(difficulty==='medium')updateCity(dt,false);if(difficulty==='nightmare'){updateStorm(dt);draculaTimer=200;draculaX-=.85*dt;if(draculaX< -55)draculaX=W+50}draw();ctx.save();ctx.fillStyle=difficulty==='nightmare'?'rgba(18,11,35,.63)':'rgba(255,255,255,.62)';ctx.beginPath();ctx.roundRect(97,91,106,114,15);ctx.fill();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=difficulty==='easy'?'#36844c':difficulty==='medium'?'#c5434d':'#d8a7ff';ctx.font='bold 64px system-ui';ctx.fillText(number?String(number):'GO!',150,143,98);ctx.font='bold 11px system-ui';ctx.fillText(number?'GET READY!':'FLY!',150,182);ctx.restore();if(elapsed>=3400){mode='running';last=0;$('flappyFlap').disabled=false;$('flappyFlap').innerHTML='<i class="fa-solid fa-arrow-up"></i> FLAP';startMusic();raf=requestAnimationFrame(frame)}else raf=requestAnimationFrame(countdownFrame)}
function flap(){if(mode!=='running')return;velocity=config[difficulty].flap;sound('flap')}
function fail(){if(mode!=='running')return;mode='over';stop();clearTimeout(restartTimer);restartUnlockedAt=0;$('flappyFlap').hidden=true;$('flappyFlap').disabled=true;$('flappyChangeMode').hidden=true;sound('lose');$('flappyOverTitle').textContent=difficulty==='nightmare'?'THE NIGHT CLAIMS ANOTHER PILOT':'FLIGHT TERMINATED';$('flappyOverMessage').textContent=randomMessage();$('flappyOverScore').textContent='Score '+score+' · '+difficulty+' best '+best;$('flappyOverlay').hidden=false;document.querySelector('.flappy-hint').hidden=true;draw();restartTimer=setTimeout(()=>{restartTimer=0;if(mode!=='over'||screen.hidden)return;$('flappyFlap').innerHTML='<i class="fa-solid fa-rotate-right"></i> TRY AGAIN';$('flappyFlap').hidden=false;$('flappyFlap').disabled=false;$('flappyChangeMode').hidden=false;restartUnlockedAt=performance.now()},1000)}
function pipe(x,top,gap,multiplier){if(difficulty==='medium'){cityBuilding(x,top,gap,multiplier);return}const night=difficulty==='nightmare';ctx.fillStyle=night?'#703c78':'#31b6a6';ctx.fillRect(x,0,47,top);ctx.fillRect(x,top+gap,47,ground-top-gap);ctx.fillStyle=night?'#bb70aa':'#6ce6d0';ctx.fillRect(x-4,top-12,55,12);ctx.fillRect(x-4,top+gap,55,12);ctx.fillStyle='rgba(0,0,0,.13)';ctx.fillRect(x+37,0,6,Math.max(0,top-12));ctx.fillRect(x+37,top+gap+12,6,Math.max(0,ground-top-gap-12));if(multiplier){const label='×'+multiplier.toFixed(1);ctx.save();ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='middle';const yy=top>60?Math.min(top-32,40):top+gap+29;ctx.fillStyle=night?'#24132f':'#114c41';ctx.fillRect(x+2,yy-15,43,30);ctx.fillStyle='#fff4b0';ctx.font='bold 8px monospace';ctx.fillText('SPEED',x+23.5,yy-6);ctx.font='bold 11px monospace';ctx.fillText(label,x+23.5,yy+7);ctx.restore()}}
function bat(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='rgba(177,138,199,.45)';ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(-10,-8,-5,-3);ctx.lineTo(0,0);ctx.lineTo(5,-3);ctx.quadraticCurveTo(10,-8,12,0);ctx.quadraticCurveTo(8,-2,5,4);ctx.lineTo(0,2);ctx.lineTo(-5,4);ctx.quadraticCurveTo(-8,-2,-12,0);ctx.fill();ctx.restore()}
function spookyScenery(){
 const t=nightmareTravel;ctx.save();
 // Distant castles, woods, ruined walls and graveyards travel with the world.
 for(let i=0;i<12;i++){const x=((i*111-t*.24)%(W+200)+W+200)%(W+200)-95;const type=i%4;ctx.fillStyle=type===0?'#45364e':'#29263d';ctx.globalAlpha=.45;
 if(type===0){ctx.fillRect(x,ground-76,59,76);for(let j=0;j<3;j++){const tx=x+j*24;ctx.fillRect(tx,ground-103+(j%2)*16,16,44);ctx.beginPath();ctx.moveTo(tx-3,ground-103+(j%2)*16);ctx.lineTo(tx+8,ground-120+(j%2)*16);ctx.lineTo(tx+19,ground-103+(j%2)*16);ctx.fill()}}
 else if(type===1){for(let j=0;j<5;j++){const tx=x+j*20;ctx.fillRect(tx,ground-77-(j%2)*17,5,77+(j%2)*17);ctx.beginPath();ctx.moveTo(tx-17,ground-65);ctx.lineTo(tx+2,ground-133-(j%2)*12);ctx.lineTo(tx+22,ground-65);ctx.fill()}}
 else if(type===2){for(let j=0;j<5;j++){ctx.fillRect(x+j*16,ground-17-(j%3)*7,11,18+(j%3)*7);ctx.beginPath();ctx.arc(x+j*16+5,ground-17-(j%3)*7,5,Math.PI,0);ctx.fill()}}
 else {ctx.fillRect(x,ground-39,75,39);for(let j=0;j<5;j++)ctx.clearRect(x+j*15+3,ground-32,7,10)}
 }
 // Rare monster silhouette is attached to the forest, never a collision object.
 const mx=((monsterAt-t*.24)%(W+850)+W+850)%(W+850)-150;
 if(mx>-30&&mx<W+30){ctx.globalAlpha=.68;ctx.fillStyle='#141522';ctx.beginPath();ctx.ellipse(mx,ground-34,13,31,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(mx-11,ground-55);ctx.lineTo(mx-16,ground-80);ctx.lineTo(mx,ground-68);ctx.lineTo(mx+15,ground-81);ctx.lineTo(mx+11,ground-55);ctx.fill();ctx.fillStyle='#df6a81';ctx.fillRect(mx-7,ground-52,4,3);ctx.fillRect(mx+4,ground-52,4,3)}
 ctx.restore();ctx.fillStyle='rgba(186,154,205,.065)';for(let i=0;i<4;i++){const x=((i*109+batPhase*.24)%(W+130))-65;ctx.beginPath();ctx.ellipse(x,ground-11+(i%2)*6,65,10,0,0,Math.PI*2);ctx.fill()}
}
function countryside(){
 const t=countrysideTime;
 const sky=ctx.createLinearGradient(0,0,0,ground);sky.addColorStop(0,'#7dcaf2');sky.addColorStop(1,'#e4f5cd');ctx.fillStyle=sky;ctx.fillRect(0,0,W,ground);
 ctx.fillStyle='#fff2a2';ctx.shadowColor='#ffe79b';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(242,49,26,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 // Only sky objects travel independently of the land.
 for(let i=0;i<5;i++){const x=((i*100-batPhase*.13)%(W+135)+W+135)%(W+135)-55,y=27+(i%3)*33;ctx.fillStyle='rgba(255,255,255,.85)';for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(x+j*14,y+(j%2)*3,19,10,0,0,Math.PI*2);ctx.fill()}}
 // Hills are a distant layer, but the near ground and ALL farm fixtures share one world coordinate.
 const hillOffset=t*.075;
 ctx.fillStyle='#a3d89b';ctx.beginPath();ctx.moveTo(0,245);for(let x=0;x<=W+10;x+=10)ctx.lineTo(x,226+19*Math.sin((x+hillOffset)/70));ctx.lineTo(W,ground);ctx.lineTo(0,ground);ctx.fill();
 ctx.fillStyle='#75bc7e';ctx.beginPath();ctx.moveTo(0,276);for(let x=0;x<=W+10;x+=10)ctx.lineTo(x,261+14*Math.sin((x+hillOffset*1.5)/53));ctx.lineTo(W,ground);ctx.lineTo(0,ground);ctx.fill();
 // Each 400px farm parcel owns its farmhouse, trees, fence and livestock.
 // Draw each parcel with a single translation; never wrap individual fixtures.
 const parcelWidth=400,scroll=t*.24,first=Math.floor(scroll/parcelWidth)-1;
 for(let n=first;n<=first+3;n++){
   const px=n*parcelWidth-scroll;
   if(px>W+20||px+parcelWidth< -20)continue;
   ctx.save();ctx.translate(px,0);
   const variant=((n%3)+3)%3;
   // Fence rails and posts share the parcel position and are clipped only by the canvas edge.
   const fenceStart=variant===1?175:18, fenceEnd=variant===1?374:169;
   ctx.strokeStyle='#f7e5c3';ctx.lineWidth=3;
   for(let fx=fenceStart;fx<=fenceEnd;fx+=24){ctx.beginPath();ctx.moveTo(fx,287);ctx.lineTo(fx,309);ctx.stroke()}
   for(const yy of [292,302]){ctx.beginPath();ctx.moveTo(fenceStart-6,yy);ctx.lineTo(fenceEnd+7,yy);ctx.stroke()}
   // A farmhouse or barn sits on its own parcel; it cannot slide away from its fence.
   const hx=variant===1?268:50,hy=variant===2?269:257;
   ctx.fillStyle=variant===2?'#d9ad86':'#f4dfb1';ctx.fillRect(hx,hy-19,39,34);
   ctx.fillStyle='#ad6950';ctx.beginPath();ctx.moveTo(hx-5,hy-19);ctx.lineTo(hx+19,hy-39);ctx.lineTo(hx+44,hy-19);ctx.fill();
   ctx.fillStyle='#865a45';ctx.fillRect(hx+14,hy-3,10,18);ctx.fillStyle='#f6efc7';ctx.fillRect(hx+5,hy-13,8,7);
   const trees=variant===0?[205,334]:variant===1?[45,122]:[158,326];
   for(const tx of trees){const ty=variant===1?265:272;ctx.fillStyle='#795b40';ctx.fillRect(tx-3,ty-18,6,28);ctx.fillStyle=variant===2?'#3b955e':'#428c4f';for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(tx+(j-1)*8,ty-23-(j%2)*8,13,0,Math.PI*2);ctx.fill()}}
   // Cow remains planted on the pasture, with tail motion only.
   if(variant!==2){const cx=variant===0?267:173;ctx.fillStyle='#f5f3e9';ctx.fillRect(cx,269,28,16);ctx.fillRect(cx+23,266,11,12);ctx.fillRect(cx+3,283,4,12);ctx.fillRect(cx+22,283,4,12);ctx.fillStyle='#48434b';ctx.fillRect(cx+7,270,9,8);ctx.fillRect(cx+26,270,5,4);ctx.strokeStyle='#61544a';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx,273);const tailWag=Math.sin(farmAmbient*.073+n*1.7)+.5*Math.sin(farmAmbient*.119+n);ctx.quadraticCurveTo(cx-9-tailWag*3,271+tailWag*2,cx-9-tailWag*5,282+tailWag*3);ctx.stroke()}
   // Chickens peck in place, with individual phases; feet never translate independently.
   for(let k=0;k<2;k++){const x=(variant===1?213:195)+k*29;const peck=Math.max(0,Math.sin(farmAmbient*(.065+k*.009)+k*3.4+n*1.2)+.25*Math.sin(farmAmbient*.151+k+n));ctx.fillStyle='#f4e8d5';ctx.beginPath();ctx.ellipse(x,302,7,6,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+5,297+peck*3.2,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d65e42';ctx.fillRect(x+4,292+peck*3.2,3,3)}
   ctx.restore();
 }
 ctx.strokeStyle='rgba(61,103,103,.55)';ctx.lineWidth=1.4;for(const b of birds){ctx.beginPath();ctx.moveTo(b.x-7*b.s,b.y);ctx.quadraticCurveTo(b.x-3*b.s,b.y-(4+3*Math.sin(batPhase*.22+b.x*.02))*b.s,b.x,b.y);ctx.quadraticCurveTo(b.x+4*b.s,b.y-(4+3*Math.sin(batPhase*.22+b.x*.02))*b.s,b.x+8*b.s,b.y);ctx.stroke()}
}
function updateCountryside(dt,travel=true){farmAmbient+=dt;if(travel)countrysideTime+=dt*currentWorldSpeed();for(const b of birds){b.x-=.4*dt*b.s;if(b.x< -30){b.x=W+25+Math.random()*95;b.y=25+Math.random()*105}}}

// NYC Rush Hour: all scenery is decorative and sits behind solid, rectangular building hitboxes.
function cityRect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
// NYC's 60-second illustrated clock: 15 seconds per phase.
// Blended palettes avoid abrupt flashes and never affect obstacle hitboxes.
function nycClock(){
 const sec=(cityAmbient/60)%60;
 const stages=[{at:0,sky:[137,175,198],haze:[193,197,194],dark:0,warm:0},{at:15,sky:[241,145,116],haze:[248,185,135],dark:.22,warm:1},{at:30,sky:[26,43,85],haze:[62,74,111],dark:.78,warm:.08},{at:45,sky:[48,65,119],haze:[133,123,157],dark:.50,warm:.45},{at:60,sky:[137,175,198],haze:[193,197,194],dark:0,warm:0}];
 let i=0;while(i<stages.length-2&&sec>=stages[i+1].at)i++;
 const a=stages[i],b=stages[i+1],f=(sec-a.at)/(b.at-a.at),u=f*f*(3-2*f);
 const mix=(x,y)=>x+(y-x)*u;
 const rgb=(key)=>'rgb('+a[key].map((n,j)=>Math.round(mix(n,b[key][j]))).join(',')+')';
 const dark=mix(a.dark,b.dark),warm=mix(a.warm,b.warm);
 // One continuous 24-hour game clock. Its four segments exactly follow the sky phases.
 // The display rounds to the nearest half-hour, including across midnight.
 const simulatedMinutes=sec<15 ? 9*60+sec/15*(8*60+30)
   :sec<30 ? 17*60+30+(sec-15)/15*(2*60+30)
   :sec<45 ? 20*60+(sec-30)/15*(9*60+30)
   :5*60+30+(sec-45)/15*(3*60+30);
 const rounded=(Math.round(simulatedMinutes/30)*30)%(24*60);
 const hour24=Math.floor(rounded/60),minute=rounded%60;
 const clock=(hour24%12||12)+':'+String(minute).padStart(2,'0')+(hour24<12?' AM':' PM');
 return {sec,sky:rgb('sky'),haze:rgb('haze'),dark,warm,night:dark>.43,clock,weather:sec<15?'72°F':sec<30?'68°F':sec<45?'CLEAR':'61°F'};
}
function cityScenery(){
 const t=cityTime,a=cityAmbient,light=nycClock();
 const sky=ctx.createLinearGradient(0,0,0,ground);sky.addColorStop(0,light.sky);sky.addColorStop(1,light.haze);ctx.fillStyle=sky;ctx.fillRect(0,0,W,ground);
 // Sunset finishes before the crescent and stars emerge; dawn reverses the sequence.
 // Both bodies travel completely beyond the visible sky instead of cross-fading in place.
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
 const sec=light.sec;
 const sunset=smooth((sec-15)/12); // sun exits by second 27
 const sunrise=smooth((sec-54)/6); // moon is gone before sunrise begins
 const sunVisible=sec<27?1:sec>=54?1:0;
 const sunX=sec<27?195+(W+35-195)*sunset:-34+(195+34)*sunrise;
 const sunY=sec<27?33+83*sunset:116-83*sunrise;
 if(sunVisible){ctx.save();ctx.fillStyle='#ffdfa0';ctx.beginPath();ctx.arc(sunX,sunY,19,0,Math.PI*2);ctx.fill();ctx.restore()}
 // Moon rises only after sunset has fully left the frame, and sets before sunrise.
 // The moon stays in one spot: a clean, narrow C-shaped crescent fades in/out.
 const moonRise=smooth((sec-29)/6),moonSet=smooth((sec-46)/6);
 const moonVisible=moonRise*(1-moonSet);
 const moonX=226,moonY=36;
 if(moonVisible>.005){
  ctx.save();ctx.globalAlpha=moonVisible;ctx.fillStyle='#f2efd8';
  // Closed crescent outline, not a half-disc and no shaded dark/full disc.
  ctx.beginPath();
  ctx.moveTo(moonX+5,moonY-13);
  ctx.bezierCurveTo(moonX-14,moonY-16,moonX-17,moonY+16,moonX+5,moonY+13);
  ctx.bezierCurveTo(moonX-7,moonY+8,moonX-7,moonY-8,moonX+5,moonY-13);
  ctx.closePath();ctx.fill();ctx.restore();
 }
 const starAlpha=moonRise*(1-moonSet)*.85;
 if(starAlpha>.005){ctx.fillStyle='rgba(238,241,255,'+starAlpha+')';for(let i=0;i<24;i++)ctx.fillRect((i*83+19)%W,(i*41+11)%140,1.2,1.2)}
 for(let i=0;i<4;i++){let x=((i*112-a*.09)%(W+150)+W+150)%(W+150)-45;ctx.fillStyle='rgba(255,255,255,'+(.68-light.dark*.4)+')';for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(x+j*13,26+(i%3)*20,17,7,0,0,7);ctx.fill()}}
 // Distinct distant Manhattan silhouette, including a pointed landmark tower.
 for(let i=0;i<18;i++){const x=((i*29-t*.13)%(W+45)+W+45)%(W+45)-22,h=90+(i*23%77);cityRect(x,ground-h,25,h,i%3?'#8098a9':'#6e8b9d');if(i%5===0){ctx.fillStyle='#718ea5';ctx.beginPath();ctx.moveTo(x+3,ground-h);ctx.lineTo(x+12,ground-h-19);ctx.lineTo(x+22,ground-h);ctx.fill()}for(let xx=x+5;xx<x+23;xx+=8)for(let yy=ground-h+11;yy<ground-5;yy+=14){const col=Math.round((xx-x-5)/8),row=Math.round((yy-(ground-h+11))/14),on=((i*37+col*11+row*7)%13+13)%13<5;cityRect(xx,yy,3,5,'rgba(29,47,69,.43)');if(on){ctx.fillStyle='rgba(255,224,149,'+(Math.max(0,(light.dark-.12)/.66)*.9)+')';ctx.fillRect(xx,yy,3,5)}}}
 // Harbor landmark between the distant skyline and the foreground buildings.
 // Statue of Liberty is a rare, slow-moving distant sighting.
 if(libertyX>-75&&libertyX<W+70){ctx.save();ctx.translate(libertyX,ground-164);ctx.scale(.66,.66);ctx.fillStyle='#6cae9f';cityRect(-14,98,47,10,'#aaa99d');cityRect(-20,108,59,12,'#c3c0ad');cityRect(-18,120,55,127,'#a5aa9f');cityRect(-23,240,65,8,'#c3c0ad');ctx.beginPath();ctx.moveTo(-7,99);ctx.lineTo(-3,42);ctx.lineTo(18,39);ctx.lineTo(27,99);ctx.fill();ctx.beginPath();ctx.arc(7,30,10,0,7);ctx.fill();for(let i=0;i<7;i++){const ang=-Math.PI+i*Math.PI/6;ctx.save();ctx.translate(7,29);ctx.rotate(ang);ctx.fillRect(-2,-20,4,12);ctx.restore()}ctx.save();ctx.translate(-2,47);ctx.rotate(-.42);ctx.fillRect(-4,-34,8,39);ctx.restore();cityRect(-19,3,5,17,'#6cae9f');ctx.fillStyle='#f9d481';ctx.beginPath();ctx.moveTo(-22,4);ctx.lineTo(-16,-9);ctx.lineTo(-10,4);ctx.fill();ctx.restore()}
 // Buildings and advertisements share one unwrapped world coordinate.
 // Draw neighbouring tiles instead of modulo-wrapping each object while visible.
 const signs=['I ♥ NY','COFFEE!','LATE AGAIN?','MIDTOWN','TAKE THE A',light.weather,'BROADWAY','PIZZA 99¢','BAGELS!','NYC TIME','YELLOW CAB','DONUTS!','5TH AVENUE'];
 const blockWidth=9*65, offset=(t*.31)%blockWidth;
 // A clock is an occasional billboard ad, never a permanent overlay.
 // Allow at most two clock appearances per phase, and never show the next
 // one until the previous clock sign has fully left the screen.
 const phaseIndex=Math.floor(cityAmbient/(60*60))*4+(light.sec<15?0:light.sec<30?1:light.sec<45?2:3);
 if(phaseIndex!==phaseBillboard){
   phaseBillboard=phaseIndex;
   phaseClockCount=0;
   // Keep an existing clock until it scrolls out; its time stays in sync.
   // Don't immediately schedule a new one if the previous phase had one.
 }
 const visibleSigns=[];
 for(let tile=-1;tile<=1;tile++)for(let i=1;i<9;i+=2){
   const x=i*65-offset+tile*blockWidth-30;
   if(x+56>=0&&x<=W)visibleSigns.push({id:tile+':'+i,tile,i,x});
 }
 if(activeClockSign&&!visibleSigns.some(s=>s.id===activeClockSign)){
   activeClockSign=null;clockLastExit=cityAmbient;
 }
 const phaseElapsed=light.sec%15;
 const phaseDuration=15;
 if(!activeClockSign&&phaseClockCount<2&&phaseElapsed<phaseDuration-2&&
    (clockLastExit<0||cityAmbient-clockLastExit>=60*2)){
   // Pick a billboard entering on the right, not all visible signs.
   const candidates=visibleSigns.filter(s=>s.x>W*.45&&s.x<W-8);
   const choice=candidates.sort((a,b)=>b.x-a.x)[0];
   if(choice){activeClockSign=choice.id;phaseClockCount++}
 }
 for(let tile=-1;tile<=1;tile++)for(let i=0;i<9;i++){
   const x=i*65-offset+tile*blockWidth-30,h=94+(i*19%39),roof=ground-h;
   if(x+62<0||x>W)continue;
   cityRect(x,roof,59,h,i%2?'#6c7e8e':'#897e83');
   for(let xx=x+9;xx<x+53;xx+=14)for(let yy=roof+10;yy<ground-4;yy+=15){const col=Math.round((xx-x-9)/14),row=Math.round((yy-(roof+10))/15),on=((i*29+col*7+row*3)%17+17)%17<7;cityRect(xx,yy,7,8,'#34485b');if(on){ctx.fillStyle='rgba(255,222,150,'+(Math.max(0,(light.dark-.10)/.68)*.92)+')';ctx.fillRect(xx,yy,7,8)}}
   if(i%3===0){cityRect(x+20,roof-15,17,13,'#786e6e');cityRect(x+17,roof-18,23,4,'#655c64');cityRect(x+23,roof-2,3,8,'#63565b');cityRect(x+33,roof-2,3,8,'#63565b')}
   if(i%4===1){ctx.strokeStyle='#444f60';ctx.lineWidth=1.5;for(let yy=roof+14;yy<ground-10;yy+=15){ctx.strokeRect(x+43,yy,12,7);ctx.beginPath();ctx.moveTo(x+43,yy+7);ctx.lineTo(x+55,yy+14);ctx.stroke()}}
   if(i%2===1){
     // Two posts meet the actual roof. Sign moves with this exact host building.
     const sx=x+4,sy=roof-25;
     cityRect(sx+10,sy+20,3,6,'#455362');cityRect(sx+39,sy+20,3,6,'#455362');
     cityRect(sx,sy,52,21,'#344b5e');cityRect(sx+2,sy+2,48,17,'#e6cda2');
     if(light.dark>.12){ctx.save();ctx.shadowColor='#ffe39a';ctx.shadowBlur=light.dark*9;ctx.strokeStyle='rgba(255,223,143,'+(Math.max(0,(light.dark-.12)/.66)*.95)+')';ctx.lineWidth=2;ctx.strokeRect(sx+1,sy+1,50,19);ctx.restore()}
     ctx.fillStyle='#364a5c';ctx.textAlign='center';
     const showClock=activeClockSign===tile+':'+i;
     const message=showClock?light.clock:signs[((i*7+tile*11+Math.floor(t/blockWidth)*3)%signs.length+signs.length)%signs.length];
     // Scale only when necessary so every message fits inside the sign's inner panel.
     ctx.font=showClock?'bold 9px sans-serif':'bold 8px sans-serif';
     const availableWidth=44;
     const measuredWidth=ctx.measureText(message).width;
     if(measuredWidth>availableWidth){ctx.font='bold '+Math.max(5,Math.floor((showClock?9:8)*availableWidth/measuredWidth*10)/10)+'px sans-serif'}
     ctx.fillText(message,sx+26,sy+13,availableWidth);
   }
 }
 // NYC elevated subway: dark steel track and connected support pillars.
 // All structural pieces share the city world offset; never draw white arches.
 const railY=ground-96, railScroll=(t*.31)%92;
 cityRect(0,railY-5,W,7,'#3b4650');
 cityRect(0,railY-7,W,2,'#65717a');
 for(let px=-railScroll-92;px<W+92;px+=92){
   // Vertical I-beam columns connect the rail to the far sidewalk.
   cityRect(px+37,railY+2,8,(ground-54)-(railY+2),'#45535e');
   cityRect(px+35,railY+2,12,3,'#34414c');
   cityRect(px+35,ground-57,12,3,'#34414c');
   cityRect(px+40,railY+6,2,(ground-60)-(railY+6),'#64717a');
 }

 for(const train of cityTrains){
   const x=train.x,len=train.cars*57;
   if(x>W+8||x+len< -8)continue;
   ctx.save();ctx.translate(x,ground-131);
   for(let car=0;car<train.cars;car++){
     const xx=car*57;
     cityRect(xx,0,55,34,'#929eaa');
     cityRect(xx,26,55,5,'#475867');
     cityRect(xx+5,7,12,13,light.dark>.25?'#e5c58a':'#425d70');
     cityRect(xx+20,7,12,13,light.dark>.25?'#e5c58a':'#425d70');
     cityRect(xx+35,7,10,13,light.dark>.25?'#e5c58a':'#425d70');
     cityRect(xx+53,4,2,22,'#465462');
   }
   ctx.fillStyle=train.color;ctx.beginPath();ctx.arc(17,14,10,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(train.route,17,14);
   ctx.restore();
 }
 // Two readable traffic lanes, proportionate cars, and a low-profile street.
 // Far lane heads left; near lane heads right. The line divides the lanes.
 const roadTop=ground-64, laneHeight=32;
 cityRect(0,roadTop,W,64,'#485461');
 // Far-side low concrete safety barrier, grounded at the road edge.
 cityRect(0,roadTop-6,W,6,'#9a9c9b');
 cityRect(0,roadTop-8,W,2,'#c5c5c1');
 ctx.strokeStyle='#777e81';ctx.lineWidth=1;
 for(let bx=-(cityTime%38);bx<W;bx+=38){ctx.beginPath();ctx.moveTo(bx,roadTop-6);ctx.lineTo(bx,roadTop);ctx.stroke()}

 ctx.save();ctx.strokeStyle='#edc66c';ctx.lineWidth=1.6;ctx.setLineDash([12,10]);ctx.lineDashOffset=t%22;
 ctx.beginPath();ctx.moveTo(0,roadTop+laneHeight);ctx.lineTo(W,roadTop+laneHeight);ctx.stroke();ctx.restore();
 for(const car of [...cityCars].sort((a,b)=>(a.visualLane??a.lane)-(b.visualLane??b.lane))){
   if(car.x< -75||car.x>W+75)continue;
   const dir=car.dir||1, lane=car.visualLane??car.lane;
   const scale=lane===1?.75:.69;
   // Position the whole vehicle within its lane, not on the center stripe or curb.
   const wheelBaseline=roadTop+(lane+0.5)*laneHeight;
   ctx.save();ctx.translate(car.x,wheelBaseline-24*scale);ctx.scale(dir*scale,scale);
   ctx.fillStyle=car.color;ctx.beginPath();ctx.moveTo(0,13);ctx.lineTo(8,12);ctx.lineTo(17,2);ctx.lineTo(36,2);ctx.lineTo(46,12);ctx.lineTo(54,13);ctx.lineTo(54,24);ctx.lineTo(0,24);ctx.closePath();ctx.fill();
   cityRect(20,5,14,7,'#a8d8e6');ctx.fillStyle='#7caec2';ctx.beginPath();ctx.moveTo(36,5);ctx.lineTo(43,12);ctx.lineTo(36,12);ctx.closePath();ctx.fill();
   cityRect(50,15,4,5,'#fff9c6');cityRect(0,15,3,5,'#c65354');
   if(light.dark>.10){ctx.fillStyle='rgba(255,242,175,'+(Math.max(0,(light.dark-.10)/.68)*.34)+')';ctx.beginPath();ctx.moveTo(54,14);ctx.lineTo(77,8);ctx.lineTo(77,26);ctx.lineTo(54,21);ctx.fill();ctx.fillStyle='rgba(255,68,75,'+(Math.max(0,(light.dark-.10)/.68)*.85)+')';ctx.fillRect(-2,14,3,8)}
   if(car.taxi){cityRect(22,-4,14,6,'#f6efdc');ctx.fillStyle='#313942';ctx.font='bold 6px sans-serif';ctx.fillText('TAXI',23,1)}
   ctx.fillStyle='#303a45';ctx.beginPath();ctx.arc(11,24,5,0,7);ctx.arc(43,24,5,0,7);ctx.fill();
   ctx.fillStyle='#b9c5ca';ctx.beginPath();ctx.arc(11,24,2,0,7);ctx.arc(43,24,2,0,7);ctx.fill();
   // Speeding cars get a small, tasteful motion streak behind their rear bumper.
   if(!car.slowed && car.renderSpeed>2.05 && car.renderSpeed>car.cruiseSpeed*.82){ctx.strokeStyle='rgba(245,242,220,.6)';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-4,12);ctx.lineTo(-15,12);ctx.moveTo(-2,19);ctx.lineTo(-11,19);ctx.stroke()}
   ctx.restore();
 }
 // Tiny distant passenger jets: coherent side profile with a distinct fin,
 // swept-back wings and two synchronized red wingtip beacons.
 // These are screen-space sky objects, never tied to the scrolling street.
 for(const plane of cityPlanes){
   ctx.save();ctx.translate(plane.x,plane.y);ctx.scale(plane.dir*plane.scale,plane.scale);
   // Far wing: root forward/right, tip backward/left.
   ctx.fillStyle='#657486';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-19,-19);ctx.lineTo(-11,-19);ctx.lineTo(20,2);ctx.closePath();ctx.fill();
   // Tall vertical tail, with a recognizable rear stabilizer.
   ctx.fillStyle='#526275';ctx.beginPath();ctx.moveTo(-30,4);ctx.lineTo(-39,-19);ctx.lineTo(-32,-19);ctx.lineTo(-16,5);ctx.closePath();ctx.fill();
   ctx.fillStyle='#607184';ctx.beginPath();ctx.moveTo(-24,9);ctx.lineTo(-38,17);ctx.lineTo(-29,17);ctx.lineTo(-10,9);ctx.closePath();ctx.fill();
   // Fuselage is deeper vertically, with a round leading nose.
   ctx.fillStyle='#586b7e';ctx.beginPath();ctx.moveTo(-39,2);ctx.lineTo(30,2);ctx.quadraticCurveTo(44,4,48,10);ctx.quadraticCurveTo(44,16,30,17);ctx.lineTo(-37,17);ctx.quadraticCurveTo(-42,11,-39,2);ctx.fill();
   // Near wing has the same backward sweep as the far wing.
   ctx.fillStyle='#455a6f';ctx.beginPath();ctx.moveTo(9,13);ctx.lineTo(-21,37);ctx.lineTo(-11,37);ctx.lineTo(21,14);ctx.closePath();ctx.fill();
   // Tiny underwing engine makes the silhouette read as a passenger jet.
   ctx.fillStyle='#415367';ctx.beginPath();ctx.ellipse(1,19,8,3.2,0,0,Math.PI*2);ctx.fill();
   if(Math.sin(cityAmbient*.115+plane.blink)>.25){
     ctx.fillStyle='#ff555b';ctx.shadowColor='#f44';ctx.shadowBlur=3;
     for(const [lx,ly] of [[-19,-19],[-21,37]]){ctx.beginPath();ctx.arc(lx,ly,2.1,0,Math.PI*2);ctx.fill()}
     ctx.shadowBlur=0;
   }
   ctx.restore();
 }
 // Distant pigeons: solo flyers and loose flocks, each with independent wingbeats and speed.
 const birdVisibility=Math.max(0,Math.min(1,(.54-light.dark)/.38));
 for(const flock of cityFlocks){
   for(const bird of flock.members){
     const bx=flock.x+bird.dx,by=flock.y+bird.dy+Math.sin(cityAmbient*.045+bird.phase)*1.4;
     if(bx< -12||bx>W+12)continue;
     const wing=3+Math.sin(cityAmbient*.16*bird.flap+bird.phase)*2;
     ctx.strokeStyle='rgba(54,76,91,'+(.76*birdVisibility)+')';ctx.lineWidth=1.1;
     ctx.beginPath();ctx.moveTo(bx-5,by);ctx.quadraticCurveTo(bx-2,by-wing,bx,by);ctx.quadraticCurveTo(bx+2,by-wing,bx+5,by);ctx.stroke();
   }
 }
 // Comic fender-benders remain attached to their vehicles in road coordinates.
 for(const car of cityCars){if(!car.crashFx||car.x< -70||car.x>W+70)continue;const x=car.x+38,y=ground-36;ctx.save();ctx.globalAlpha=Math.min(1,car.crashFx/18);ctx.fillStyle='#ffe2a0';ctx.beginPath();for(let i=0;i<12;i++){const r=i%2?8:17,angle=i*Math.PI/6;ctx.lineTo(x+Math.cos(angle)*r,y+Math.sin(angle)*r)}ctx.closePath();ctx.fill();ctx.fillStyle='#5c4450';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('BONK!',x,y-19);ctx.restore()}
 // Day birds fade out at dusk and return gradually with dawn.
 // Small ambient steam wisps and pigeons; no scrolling during countdown.
 // Removed the three pale curved steam strokes that looked like floating subway arches.
 for(let i=0;i<3;i++){const x=((i*117+a*.34)%(W+80))-40,y=44+(i*37%70);ctx.strokeStyle='rgba(87,121,142,'+birdVisibility+')';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x-7,y);ctx.quadraticCurveTo(x-3,y-5-Math.sin(a*.12+i)*2,x,y);ctx.quadraticCurveTo(x+4,y-5,x+8,y);ctx.stroke()}
}
function speedRate(){return difficulty==='easy'?.12:difficulty==='medium'?.20:.30}
function nextSpeedMultiplier(value){return Math.round((value*(1+speedRate())+Number.EPSILON)*10)/10}
function milestoneMultiplier(number){let value=speedMultiplier;for(let i=Math.floor(score/5);i<number/5;i++)value=nextSpeedMultiplier(value);return value}
function currentWorldSpeed(){return config[difficulty].base*speedMultiplier}
const subwayRoutes=[{route:'A',color:'#2850ad'},{route:'C',color:'#2850ad'},{route:'E',color:'#2850ad'},{route:'1',color:'#ee352e'},{route:'2',color:'#ee352e'},{route:'3',color:'#ee352e'},{route:'4',color:'#00933c'},{route:'5',color:'#00933c'},{route:'6',color:'#00933c'},{route:'7',color:'#b933ad'},{route:'N',color:'#fccc0a'},{route:'Q',color:'#fccc0a'},{route:'R',color:'#fccc0a'},{route:'W',color:'#fccc0a'},{route:'L',color:'#a7a9ac'},{route:'J',color:'#996633'},{route:'Z',color:'#996633'},{route:'F',color:'#ff6319'},{route:'M',color:'#ff6319'},{route:'G',color:'#6cbe45'}];
function spawnTrain(initial=false){const service=subwayRoutes[Math.floor(Math.random()*subwayRoutes.length)];const cars=6+Math.floor(Math.random()*3);/* All cars start beyond the right edge; the lead carriage enters naturally. */cityTrains.push({x:W+8,cars,route:service.route,color:service.color,speed:1.9+Math.random()*.65})}
function cityHorn(long=false){
 if(difficulty!=='medium'||(window.miniAppsSoundEnabled&&!window.miniAppsSoundEnabled())||document.hidden||!AudioClass)return;
 try{if(!audio)audio=new AudioClass();if(audio.state==='suspended')audio.resume().catch(()=>{});const f=long?330:420;note(f,long?.30:.105,long?.032:.025,'sawtooth');if(!long)note(f*1.12,.10,.018,'square')}catch(_){}
}
// Brief, distant EMS-style two-tone siren. No external audio files or timers.
function citySiren(){
 if(difficulty!=='medium'||mode!=='running'||document.hidden||(window.miniAppsSoundEnabled&&!window.miniAppsSoundEnabled())||!AudioClass)return;
 try{
  if(!audio)audio=new AudioClass();if(audio.state==='suspended')audio.resume().catch(()=>{});
  if(audio.state!=='running')return;
  const t=audio.currentTime+.015,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type='sine';gain.gain.setValueAtTime(.0001,t);
  for(let i=0;i<5;i++){
   const at=t+i*.25;
   osc.frequency.setValueAtTime(i%2?610:470,at);
   osc.frequency.linearRampToValueAtTime(i%2?470:610,at+.23);
  }
  gain.gain.linearRampToValueAtTime(.013,t+.12);
  gain.gain.setValueAtTime(.013,t+.92);
  gain.gain.linearRampToValueAtTime(.0001,t+1.25);
  osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+1.28);
 }catch(_){}
}
function updateCity(dt,travel){cityAmbient+=dt;const world=travel?currentWorldSpeed():0;if(travel)cityTime+=world*dt;
 // First distant emergency siren is randomly scheduled in the first ~0.4–4.3 seconds of gameplay;
 // later sirens are sporadic, never continuous. Countdown remains siren-free.
 if(travel){sirenDelay-=dt;if(sirenDelay<=0){citySiren();sirenDelay=1250+Math.random()*1650}}
 // Traffic and trains have actual world velocities. Screen velocity = own velocity - bird velocity.
 trainSpawn-=dt;if(trainSpawn<=0){if(cityTrains.length<2)spawnTrain(cityTrains.length===0&&cityAmbient<180);trainSpawn=350+Math.random()*480}
 for(const train of cityTrains)train.x-=(train.speed+world)*dt;
 cityTrains=cityTrains.filter(train=>train.x+train.cars*57> -12);
 // A steady but bounded stream, with some distinctly fast drivers.
 carSpawn-=dt;
 if(carSpawn<=0){
   if(cityCars.length<9){
     const dir=Math.random()<.55?1:-1;
     const lane=dir===1?1:0;
     const speed=Math.random()<.32?2.25+Math.random()*.8:.95+Math.random()*.9;
     // Spawn at the edge where the car actually enters the camera view.
     // Same-direction cars slower than the bird are overtaken from the right.
     const relative=dir*speed-world;
     const x=relative>=0?-52:W+52;
     // Don't spawn cars directly on top of each other.
     if(!cityCars.some(c=>c.lane===lane&&Math.abs(c.x-x)<75)){
       const taxi=Math.random()<.67;
       cityCars.push({x,color:taxi?'#f2c63d':Math.random()<.5?'#5d697b':'#aeb6bc',taxi,speed,dir,lane,visualLane:lane,targetLane:lane,crashFx:0,brake:0});
     }
   }
   carSpawn=28+Math.random()*45;
 }
 // Predict all cars in a lane together, front to back, using world-relative motion.
 // A follower cannot advance beyond the leader's next position minus the full
 // vehicle length plus a visible bumper clearance. This prevents apparent crashes
 // even when the bird's camera accelerates or frames take longer than usual.
 const minimumBumperGap=16, vehicleWidth=54*.75, minimumSpacing=vehicleWidth+minimumBumperGap;
 for(const car of cityCars){
   car.lane=car.dir===1?1:0;car.visualLane=car.lane;car.targetLane=car.lane;car.passing=false;
   if(car.cruiseSpeed===undefined)car.cruiseSpeed=car.speed;
   if(car.actualSpeed===undefined)car.actualSpeed=car.speed;
   // Smooth throttle response: cars can regain speed once congestion clears.
   const throttle=car.cruiseSpeed-car.actualSpeed;
   car.actualSpeed+=Math.sign(throttle)*Math.min(Math.abs(throttle),.028*dt);
   car.nextX=car.x+(car.dir*car.actualSpeed-world)*dt;
   car.slowed=false;
 }
 for(const dir of [1,-1]){
   const laneCars=cityCars.filter(car=>car.dir===dir).sort((a,b)=>dir*(b.x-a.x));
   for(let i=1;i<laneCars.length;i++){
     const lead=laneCars[i-1],follow=laneCars[i];
     const maxForward=lead.nextX-dir*minimumSpacing;
     if(dir*(follow.nextX-maxForward)>0){
       follow.nextX=maxForward;
       follow.slowed=true;
       // Match the leader's world speed, then accelerate again when clear.
       follow.actualSpeed=Math.min(follow.actualSpeed,lead.actualSpeed);
     }
     // Never pull a car backward in world space; brake to match the lead car.
     const noReverse=follow.x-world*dt;
     if(dir*(follow.nextX-noReverse)<0)follow.nextX=noReverse;
   }
 }
 for(const car of cityCars){
   // Infer the actual road-relative motion after following constraints.
   const moved=car.nextX-car.x;
   car.renderSpeed=Math.max(0,car.dir*(moved+world*dt)/Math.max(dt,.001));
   car.x=car.nextX;
   if(car.brake>0)car.brake=Math.max(0,car.brake-dt);
   if(car.crashFx>0)car.crashFx=Math.max(0,car.crashFx-dt);
 }
 cityCars=cityCars.filter(car=>car.x> -85&&car.x<W+85);
 // Horns are triggered by visible cars and respect the global sound switch.
 hornCooldown-=dt;if(hornCooldown<=0){const visible=cityCars.filter(car=>car.x>8&&car.x<W-55&&!car.brake);if(visible.length)cityHorn(Math.random()<.26);hornCooldown=540+Math.random()*660}
 // Avoid staged bumper collisions: passing traffic should remain collision-free.
 // Aircraft move under their own power even while the bird is counting down.
 planeSpawn-=dt;if(planeSpawn<=0){const dir=Math.random()<.5?1:-1;cityPlanes.push({x:dir===1?-40:W+40,y:Math.min(17+Math.random()*36,ground-185),dir,speed:.75+Math.random()*.35,scale:.27+Math.random()*.055,blink:Math.random()*6.28});planeSpawn=1400+Math.random()*1600}
 for(const plane of cityPlanes)plane.x+=plane.dir*plane.speed*dt;
 cityPlanes=cityPlanes.filter(plane=>plane.x> -65&&plane.x<W+65);
 flockSpawn-=dt;
 if(flockSpawn<=0){
   const dir=Math.random()<.5?1:-1, count=Math.random()<.28?1:3+Math.floor(Math.random()*4);
   const members=Array.from({length:count},(_,i)=>({dx:-dir*i*(10+Math.random()*5),dy:(i%2?-1:1)*Math.ceil(i/2)*(4+Math.random()*2),phase:Math.random()*6.28,flap:.7+Math.random()*.8}));
   cityFlocks.push({x:dir===1?-65:W+65,y:25+Math.random()*95,dir,speed:.32+Math.random()*.72,members});
   flockSpawn=210+Math.random()*360;
 }
 for(const flock of cityFlocks)flock.x+=(flock.dir*flock.speed-world*.10)*dt;
 cityFlocks=cityFlocks.filter(flock=>flock.x> -120&&flock.x<W+120);
 if(travel){if(libertyWait>0)libertyWait-=dt;else{libertyX-=world*.16*dt;if(libertyX< -75){libertyX=W+55;libertyWait=350+Math.random()*600}}}
}
function cityBuilding(x,top,gap,multiplier){
 const index=Math.max(0,Math.round((x+cityTime)/53)),style=index%3;
 const wall=['#aa736b','#5688a8','#827c9a'][style],edge=['#6b5059','#385d7a','#55536f'][style],glass=['#f3d5a7','#b8e4ee','#d3c7e4'][style];
 // Each column has exactly one finished edge: the one facing the flight gap.
 // Draw the wall and windows first, then its cap so no decoration hides the trim.
 const parts=[
   {y:0,h:top,capY:top-6,hanging:true},
   {y:top+gap,h:ground-top-gap,capY:top+gap,hanging:false}
 ];
 for(const part of parts){
   if(part.h<=0)continue;
   const {y,h,capY,hanging}=part;
   cityRect(x,y,47,h,wall);
   cityRect(x+40,y,7,h,edge);
   // Windows fit entirely within the actual wall and never intersect the inner cornice.
   // Align rows to the finished (gap-facing) edge for both building orientations.
   const windowH=11, step=18, safe=9;
   const firstY=y+safe, lastY=y+h-safe-windowH;
   if(lastY>=firstY){
     const rowCount=Math.floor((lastY-firstY)/step)+1;
     for(let row=0;row<rowCount;row++){
       const yy=hanging?lastY-row*step:firstY+row*step;
       for(let xx=x+6;xx<x+39;xx+=14)cityRect(xx,yy,9,windowH,glass);
     }
   }
   // Only the gap-facing side gets a cap, drawn over the wall after the windows.
   cityRect(x-3,capY,53,6,edge);
   cityRect(x-1,capY+1,49,2,style===0?'#c89484':style===1?'#83b6cb':'#aaa0bc');
 }
 // Only the milestone building receives the large, high-contrast billboard.
 if(multiplier){const yy=top>53?Math.min(45,top-28):top+gap+28;cityRect(x+1,yy-17,45,34,'#f6cf54');ctx.strokeStyle='#5c4e45';ctx.lineWidth=2;ctx.strokeRect(x+1,yy-17,45,34);ctx.fillStyle='#293d4a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 9px monospace';ctx.fillText('SPEED',x+23,yy-7);ctx.font='bold 11px monospace';ctx.fillText('×'+multiplier.toFixed(1),x+23,yy+7)}
}

function drawDracula(){
 if(draculaTimer<=0)return;
 const x=draculaX,yy=draculaY+Math.sin(batPhase*.10)*6;
 ctx.save();ctx.translate(x,yy);ctx.globalAlpha=1;
 const wing=Math.sin(batPhase*.32)*7;
 ctx.fillStyle='#100e1e';ctx.strokeStyle='#9c6cb4';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(-13,0);ctx.quadraticCurveTo(-30,-19-wing,-49,-8);ctx.lineTo(-36,0);ctx.lineTo(-47,10);ctx.quadraticCurveTo(-23,3,-12,11);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(13,0);ctx.quadraticCurveTo(30,-19-wing,49,-8);ctx.lineTo(36,0);ctx.lineTo(47,10);ctx.quadraticCurveTo(23,3,12,11);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#292030';ctx.beginPath();ctx.ellipse(0,0,14,16,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.moveTo(-11,-10);ctx.lineTo(-8,-22);ctx.lineTo(-1,-12);ctx.lineTo(7,-22);ctx.lineTo(11,-10);ctx.fill();
 ctx.fillStyle='#ff6985';ctx.fillRect(-7,-4,4,3);ctx.fillRect(4,-4,4,3);
 ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-6,6);ctx.lineTo(-3,12);ctx.lineTo(0,6);ctx.moveTo(2,6);ctx.lineTo(5,12);ctx.lineTo(8,6);ctx.fill();ctx.restore();

}

function drawStorm(){
 // Storm effects stay behind obstacles and the bird; no hitboxes or layout changes.
 ctx.save();
 for(const drop of rain){ctx.strokeStyle='rgba(159,185,219,'+(rainBurst>0?'.36':'.23')+')';ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x-3.4,drop.y+drop.length);ctx.stroke()}
 if(lightning>0){
   const alpha=Math.min(1,lightning/11);
   ctx.fillStyle='rgba(199,191,235,'+(.10*alpha)+')';ctx.fillRect(0,0,W,ground);
   let x=boltX,y=0;ctx.beginPath();ctx.moveTo(x,y);
   for(let i=0;i<6;i++){x+=Math.sin(boltSeed+i*2.3)*12;y+=13+((i*7)%9);ctx.lineTo(x,y)}
   ctx.strokeStyle='rgba(245,233,255,'+(.85*alpha)+')';ctx.lineWidth=2.2;ctx.shadowColor='#b8a4f2';ctx.shadowBlur=9;ctx.stroke();
 }
 ctx.restore();
}
function updateStorm(dt){
 stormClock+=dt;
 for(const drop of rain){drop.x-=1.15*dt;drop.y+=drop.speed*dt*(rainBurst>0?1.55:1);if(drop.y>ground+15||drop.x< -20){drop.x=Math.random()*(W+30);drop.y=-Math.random()*35}}
 if(rainBurst>0)rainBurst-=dt;
 if(stormClock>=nextRainBurst){rainBurst=85+Math.random()*95;nextRainBurst=stormClock+170+Math.random()*260}
 if(lightning>0)lightning-=dt;
 if(flashEcho>0){flashEcho-=dt;if(flashEcho<=0){lightning=5;flashEcho=0}}
 if(stormClock>=nextFlash){lightning=10;boltX=30+Math.random()*(W-60);boltSeed=Math.random()*20;flashEcho=Math.random()<.34?8:0;nextFlash=stormClock+230+Math.random()*320}
}
function drawSpeedHud(){
 const label='SPEED  ×'+speedMultiplier.toFixed(1);ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
 // Single-line, semi-transparent speed indicator above the ground, bottom-right.
 ctx.fillStyle='rgba(9,19,31,.60)';ctx.beginPath();ctx.roundRect(W-95,ground-24,90,19,5);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.90)';ctx.font='600 11px system-ui';ctx.fillText(label,W-50,ground-14.5);
 if(speedFlashFrames>0){const alpha=Math.min(.90,speedFlashFrames/25*.90);const pop=1+Math.min(.10,(95-speedFlashFrames)/300);ctx.globalAlpha=alpha;ctx.translate(W-50,ground-36);ctx.scale(pop,pop);ctx.fillStyle='#f5d980';ctx.font='bold 12px system-ui';ctx.fillText('+'+Math.round(speedRate()*100)+'%',0,0);}
 ctx.restore();}
function draw(){const night=difficulty==='nightmare';ctx.clearRect(0,0,W,H);ctx.fillStyle=night?'#121026':difficulty==='easy'?'#8bd0e9':'#193b50';ctx.fillRect(0,0,W,H);if(difficulty==='easy')countryside();if(difficulty==='medium')cityScenery();
if(night){ctx.fillStyle='#c5b5e4';ctx.beginPath();ctx.arc(247,43,19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#121026';ctx.beginPath();ctx.arc(255,36,19,0,Math.PI*2);ctx.fill();for(let i=0;i<15;i++){ctx.fillStyle='rgba(215,197,237,.5)';ctx.fillRect((i*79+31)%W,(i*41+13)%210,1.3,1.3)}for(let i=0;i<5;i++)bat(((i*94+batPhase*(.23+i*.035))%(W+60))-30,40+(i*57)%160+Math.sin(batPhase*.025+i)*7,.65+(i%3)*.17)}
else if(difficulty!=='easy'&&difficulty!=='medium'){ctx.strokeStyle='rgba(155,215,229,.12)';ctx.setLineDash([3,9]);for(let x=22;x<W;x+=44){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ground);ctx.stroke()}ctx.setLineDash([])}
if(night){spookyScenery();drawDracula();drawStorm()}
pipes.forEach(p=>pipe(p.x,p.top,p.gap,p.milestone));ctx.fillStyle=night?'#28213c':'#294b53';ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle=night?'#bb70aa':'#6ce6d0';ctx.fillRect(0,ground,W,3);
ctx.save();ctx.translate(birdX,y);ctx.rotate(Math.max(-.38,Math.min(.85,velocity*.09)));ctx.fillStyle=night?'#1c1b27':difficulty==='medium'?'#f05b62':'#ffcd69';ctx.beginPath();ctx.ellipse(0,0,15,12,0,0,Math.PI*2);ctx.fill();if(night){ctx.strokeStyle='rgba(167,123,187,.34)';ctx.lineWidth=.65;ctx.stroke();ctx.fillStyle='#1c1b27';ctx.beginPath();ctx.moveTo(-11,-8);ctx.lineTo(-8,-20);ctx.lineTo(-1,-11);ctx.lineTo(6,-20);ctx.lineTo(10,-8);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(167,123,187,.26)';ctx.lineWidth=.6;ctx.stroke()}ctx.fillStyle=night?'#51405e':difficulty==='medium'?'#c8394c':'#efa857';ctx.beginPath();ctx.ellipse(-6,5,9,6,-.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(6,-4,4.3,0,Math.PI*2);ctx.fill();ctx.fillStyle=night?'#e64b6b':'#172e41';ctx.beginPath();ctx.arc(8,-4,2,0,Math.PI*2);ctx.fill();if(difficulty==='medium'){ctx.strokeStyle='#802936';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(1,-11);ctx.lineTo(11,-8);ctx.stroke()}ctx.fillStyle=night?'#9d4663':'#f68e6d';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(25,5);ctx.lineTo(12,9);ctx.closePath();ctx.fill();if(night){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(2,8);ctx.lineTo(5,14);ctx.lineTo(8,8);ctx.moveTo(9,8);ctx.lineTo(12,14);ctx.lineTo(14,8);ctx.fill()}ctx.restore();drawSpeedHud();}
function frame(now){if(mode!=='running')return;const dt=Math.min(2.1,last?(now-last)/16.6667:1);last=now;const cfg=config[difficulty];batPhase+=dt;if(difficulty==='nightmare'){updateStorm(dt);nightmareTravel+=currentWorldSpeed()*dt}if(difficulty==='easy')updateCountryside(dt,true);if(difficulty==='medium')updateCity(dt,true);if(difficulty==='nightmare'){if(draculaTimer>0){draculaTimer-=dt;draculaX-=1.95*dt}else if(batPhase>240&&Math.random()<.0028*dt){draculaTimer=210;draculaX=W+55;draculaY=47+Math.random()*55;}}velocity+=cfg.gravity*dt;y+=velocity*dt;
const multiplier=speedMultiplier;const speed=cfg.base*multiplier;if(speedFlashFrames>0)speedFlashFrames=Math.max(0,speedFlashFrames-dt);
// Vary gap positions, gap sizes and spacing while limiting vertical jumps for fair, playable transitions.
const nextSpacing=cfg.spacing*(1+Math.log(multiplier)*.42)+Math.sin(score*2.17)*10;
spawn+=speed*dt;if(spawn>nextSpacing){spawn-=nextSpacing;const gap=cfg.gap+(Math.random()-.5)*(difficulty==='easy'?10:16);const lower=32,upper=ground-gap-32;const target=lower+Math.random()*(upper-lower);const top=Math.max(lower,Math.min(upper,Math.max(previousTop-75,Math.min(previousTop+75,target))));previousTop=top;const pipeNumber=score+pipes.filter(p=>!p.passed).length+1;pipes.push({x:W+10,top,gap,passed:false,milestone:pipeNumber%5===0?milestoneMultiplier(pipeNumber):null})}
pipes.forEach(p=>{p.x-=speed*dt;if(!p.passed&&p.x+47<birdX-radius){p.passed=true;score++;if(score%5===0){speedMultiplier=nextSpeedMultiplier(speedMultiplier);speedFlashFrames=95;}if(score>best)saveBest();updateScores();sound('success')}});pipes=pipes.filter(p=>p.x>-60);
if(y-radius<0||y+radius>ground||pipes.some(p=>birdX+radius-3>p.x&&birdX-radius+3<p.x+47&&(y-radius+3<p.top||y+radius-3>p.top+p.gap))){fail();return}draw();raf=requestAnimationFrame(frame)}
function press(e){if(e)e.preventDefault();if(mode==='countdown')return;if(mode==='over'){if(!restartUnlockedAt||performance.now()<restartUnlockedAt||activeTouches.size>1)return;start();return}if(mode==='ready'){start();return}flap()}
$('flappyFlap').addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')press(e)});$('flappyFlap').addEventListener('click',e=>{if(e.detail===0||e.pointerType==='mouse')press(e)});
// Keyboard flapping works without focusing the phone or FLAP button first.
document.addEventListener('keydown',e=>{
 if(e.code!=='Space'&&e.code!=='ArrowUp')return;
 if(screen.hidden||$('flappyPlay').hidden||mode==='closed'||mode==='welcome')return;
 if(e.target?.closest?.('input, textarea, select, [contenteditable="true"]'))return;
 e.preventDefault();
 if(!e.repeat&&mode==='running')flap();
});
open.addEventListener('click',()=>{sessionBests.easy=0;sessionBests.medium=0;sessionBests.nightmare=0;previousMessage='';$('wingMusic').checked=true;syncMusicOption();document.querySelector('input[name="wingDifficulty"][value="easy"]').checked=true;chooseDifficulty();reset();mode='welcome';$('flappyWelcome').hidden=false;$('flappyPlay').hidden=true;$('miniAppsScreen').hidden=true;screen.hidden=false;open.setAttribute('aria-expanded','true')});
document.querySelectorAll('input[name="wingDifficulty"]').forEach(r=>r.addEventListener('change',chooseDifficulty));

$('flappyChangeMode').addEventListener('click',()=>{if(mode==='over'&&!restartUnlockedAt)return;clearTimeout(restartTimer);stop();mode='welcome';$('flappyPlay').hidden=true;$('flappyWelcome').hidden=false;chooseDifficulty();reset();mode='welcome'});
$('wingMusic').addEventListener('change',()=>{if(mode==='running'){if($('wingMusic').checked)startMusic();else stopMusic()}});
window.addEventListener('miniAppsSoundOff',syncMusicOption);document.getElementById('miniAppsSoundOn')?.addEventListener('click',()=>{syncMusicOption()});
$('flappyStart').addEventListener('click',()=>{$('flappyWelcome').hidden=true;$('flappyPlay').hidden=false;start()});
$('closeFlappy').addEventListener('click',()=>{clearTimeout(restartTimer);restartTimer=0;stop();mode='closed';screen.hidden=true;$('miniAppsScreen').hidden=false;open.setAttribute('aria-expanded','false');open.focus()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')fail();else if(document.hidden&&mode==='countdown')stop()});window.addEventListener('pagehide',()=>{clearTimeout(restartTimer);stop()});
})();
