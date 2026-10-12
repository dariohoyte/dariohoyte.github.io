"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const open=$('openReflex'), close=$('closeReflex'), screen=$('reflexScreen'), launcher=$('miniAppsScreen');
  const target=$('reflexTarget'), start=$('reflexStart');
  const welcome=$('reflexWelcome'), play=$('reflexPlay'), welcomeStart=$('reflexWelcomeStart'), factCard=$('reflexFact');
  if(!open||!close||!screen||!launcher||!target||!start)return;
  const facts=[
    ['50–90 ms','Snake Strike',"Some snakes can strike in just 50–90 milliseconds. Blink and you've missed it. Literally."],
    ['~200 ms','Formula 1 Race Car Driver','Formula 1 race car drivers can launch around 200 milliseconds after the starting lights go out. Ready to race?'],
    ['~250 ms','Human Reaction Time','A typical human visual reaction takes about 250 milliseconds. Think you can beat that?'],
    ['~285 ms','Eye Blink',"An eye blink can last around 285 milliseconds. Don't blink. Actually, do. Just not during the game."],
    ['~0.13 ms','Trap-Jaw Ant',"A trap-jaw ant can snap its jaws shut in about 0.13 milliseconds. Yes, that's ridiculously fast."],
    ['~100 ms','Venus Flytrap','A Venus flytrap can snap shut in about 100 milliseconds. Even plants have quick moves.'],
    ['~400 ms','Baseball Hitter',"A major-league fastball can reach home plate in roughly 400 milliseconds. That's barely enough time to decide whether to swing."]
  ];
  const falseStartMessages=[
    'Easy there, lightning. I said wait!',
    "Whoa, speedy! Shame the race hasn't started.",
    "Someone's a little trigger-happy today.",
    'Impressive enthusiasm. Terrible timing.',
    "You're fast! Unfortunately, so is your impatience."
  ];
  let falseStartDeck=[], lastFalseStart=null;
  const shuffleFalseStarts=()=>{
    falseStartDeck=falseStartMessages.map((_,i)=>i);
    for(let i=falseStartDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[falseStartDeck[i],falseStartDeck[j]]=[falseStartDeck[j],falseStartDeck[i]];}
    if(lastFalseStart!==null && falseStartDeck[falseStartDeck.length-1]===lastFalseStart){
      const j=falseStartDeck.findIndex(i=>i!==lastFalseStart);
      [falseStartDeck[j],falseStartDeck[falseStartDeck.length-1]]=[falseStartDeck[falseStartDeck.length-1],falseStartDeck[j]];
    }
  };
  const nextFalseStart=()=>{if(!falseStartDeck.length)shuffleFalseStarts();const i=falseStartDeck.pop();lastFalseStart=i;return falseStartMessages[i];};
  let deck=[], lastFact=null, state='idle' , timer=null, greenAt=0, best=null;
  const shuffle=()=>{deck=facts.map((_,i)=>i);for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}if(lastFact!==null && deck[deck.length-1]===lastFact){const swapIndex=deck.findIndex(i=>i!==lastFact);[deck[swapIndex],deck[deck.length-1]]=[deck[deck.length-1],deck[swapIndex]];}};
  const nextFact=()=>{if(!deck.length)shuffle();const index=deck.pop();lastFact=index;const fact=facts[index];$('reflexFactNumber').textContent=fact[0];$('reflexFactName').textContent=fact[1];$('reflexFactText').textContent=fact[2];};
  const setTarget=(mode,icon,title,sub)=>{target.className='reflex-target'+(mode?' '+mode:'');$('reflexTargetIcon').className='fa-solid fa-'+icon;$('reflexTargetTitle').textContent=title;$('reflexTargetSub').textContent=sub;};
  const reset=()=>{clearTimeout(timer);timer=null;state='idle';factCard.hidden=true;setTarget('','hand-pointer','Ready when you are.',"Don't tap too early.");start.disabled=false;$('reflexStartLabel').textContent='Start Reflex Check';$('reflexStatus').textContent='One tap per round';};
  const finish=(title,sub,status,isFalseStart=false)=>{state='done';factCard.hidden=isFalseStart;setTarget(isFalseStart?'false-start':'',isFalseStart?'stopwatch':'stopwatch',title,sub);start.disabled=false;$('reflexStartLabel').textContent='Try Again';$('reflexStatus').textContent=status;$('reflexAnnouncement').textContent=title+'. '+sub;};
  const begin=()=>{if(state==='waiting'||state==='go')return;factCard.hidden=true;state='waiting';start.disabled=true;$('reflexStartLabel').textContent='Get ready…';setTarget('waiting','hourglass-half','Wait for the signal…',"Don't jump the start!");$('reflexStatus').textContent='Waiting…';timer=setTimeout(()=>{if(state!=='waiting')return;state='go';greenAt=performance.now();setTarget('go','bolt','TAP NOW!','Quick!');$('reflexStatus').textContent='GO!';},1500+Math.random()*2500);};
  const tap=()=>{if(state==='waiting'){clearTimeout(timer);finish('TOO SOON!',nextFalseStart(),'Too early',true);return;}if(state!=='go')return;const ms=Math.max(1,Math.round(performance.now()-greenAt));if(best===null||ms<best){best=ms;$('reflexBest').textContent=`Personal best: ${best} ms`;}const comment=ms<180?'Okay, who gave you race-car-driver reflexes? 🏎️':ms<=250?'Fast hands. Questionable superpowers.':ms<=350?'Respectable. The coffee is working.':'Your reflexes were buffering. 😂';nextFact();finish(`${ms} ms`,comment,'Round complete');};
  open.addEventListener('click',()=>{factCard.hidden=true;launcher.hidden=true;screen.hidden=false;welcome.hidden=false;play.hidden=true;open.setAttribute('aria-expanded','true');reset();best=null;$('reflexBest').textContent='Personal best: —';$('reflexAnnouncement').textContent='';deck=[];lastFact=null;falseStartDeck=[];lastFalseStart=null;screen.scrollTop=0;if(document.activeElement===close)close.blur();});
  welcomeStart.addEventListener('click',()=>{welcome.hidden=true;play.hidden=false;reset();});
  close.addEventListener('click',()=>{reset();screen.hidden=true;launcher.hidden=false;open.setAttribute('aria-expanded','false');open.focus();});
  start.addEventListener('click',begin);target.addEventListener('pointerdown',e=>{if(state==='waiting'||state==='go'){e.preventDefault();tap();}});
  target.addEventListener('click',e=>{if(e.detail===0)tap();});
  screen.addEventListener('keydown',e=>{if(e.key==='Escape')close.click();});
  shuffle();
})();
