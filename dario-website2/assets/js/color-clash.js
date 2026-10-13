"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const open=$("openColor"),close=$("closeColor"),screen=$("colorScreen"),launcher=$("miniAppsScreen");
 if(!open||!close||!screen||!launcher)return;
 const welcome=$("colorWelcome"),play=$("colorPlay"),end=$("colorEnd"),review=$("colorReview");
 const palette=[{name:"RED",hex:"#ff7979"},{name:"BLUE",hex:"#7db7ff"},{name:"GREEN",hex:"#65dfa6"},{name:"YELLOW",hex:"#f5d66c"}];
 const total=10;let history=[],reviewIndex=0;let rounds=[],index=0,score=0,answered=false,mode="relaxed",timed=false,deadline=0,ticker=null,feedbackTimer=null,countdownTimer=null,countdownGoTimer=null,roundActive=false;
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const seconds=()=>mode==="nightmare"?(index<3?3:index<6?2:index<9?1.5:0.75):(index<3?5:index<6?3.5:index<9?2.5:1);
 function makeRounds(){const all=[];for(const word of palette)for(const ink of palette)if(word!==ink)all.push({word,ink});return shuffle(all).slice(0,total);}
 function stopTimers(){if(countdownTimer!==null)clearInterval(countdownTimer);if(countdownGoTimer!==null)clearTimeout(countdownGoTimer);countdownTimer=null;countdownGoTimer=null;if(ticker!==null)clearInterval(ticker);if(feedbackTimer!==null)clearTimeout(feedbackTimer);ticker=null;feedbackTimer=null;}
 function show(view){welcome.hidden=view!==welcome;play.hidden=view!==play;end.hidden=view!==end;review.hidden=view!==review;}
 function updateTimer(){if(!timed||!roundActive)return;const left=Math.max(0,(deadline-performance.now())/1000);$("colorTime").textContent=`${left.toFixed(1)}s`;$("colorProgress").style.width=`${left/seconds()*100}%`;if(left<=0){clearInterval(ticker);ticker=null;answer(null,null,true);}}
 function draw(){stopTimers();roundActive=true;answered=false;const item=rounds[index];$("colorRound").textContent=`Round ${index+1} / ${total}`;$("colorScore").textContent=`Score: ${score}`;$("colorWord").textContent=item.word.name;$("colorWord").style.color=item.ink.hex;$("colorFeedback").textContent=mode==="nightmare"?"No Next button. Just keep going!":" ";$("colorFeedback").style.color="#cbd9e4";$("colorNext").hidden=true;$("colorModeLabel").textContent=mode==="nightmare"?"Nightmare · No breaks":timed?"Time remaining":"Relaxed mode";$("colorTime").textContent=timed?`${seconds().toFixed(1)}s`:"No timer";$("colorProgress").style.width=timed?"100%":`${index/total*100}%`;const choices=$("colorChoices");choices.replaceChildren();for(const color of shuffle([...palette])){const b=document.createElement("button");b.type="button";b.textContent=color.name;b.addEventListener("click",()=>answer(color,b,false));choices.append(b);}if(timed){deadline=performance.now()+seconds()*1000;ticker=setInterval(updateTimer,50);}}
 function answer(color,button,timeout){if(answered||!roundActive)return;answered=true;roundActive=false;if(ticker!==null){clearInterval(ticker);ticker=null;}const correct=!timeout&&color.name===rounds[index].ink.name;history.push({word:rounds[index].word.name,ink:rounds[index].ink.name,picked:timeout?null:color.name,choices:[...$("colorChoices").children].map(b=>b.textContent),round:index+1});if(correct)score++;$("colorScore").textContent=`Score: ${score}`;if(mode==="nightmare"){advance();return;}for(const b of $("colorChoices").children){b.disabled=true;if(b.textContent===rounds[index].ink.name)b.classList.add("is-correct");else if(b===button)b.classList.add("is-wrong");}$("colorFeedback").textContent=timeout?`Time's up! The letters are ${rounds[index].ink.name.toLowerCase()}.`:correct?"Correct! You followed the colour.":`Not quite — the letters are ${rounds[index].ink.name.toLowerCase()}.`;$("colorFeedback").style.color=correct?"#55d5a4":"#f3c66d";$("colorNext").hidden=false;$("colorNext").innerHTML=index===total-1?'See Results <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>':'Next Round <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';}
 function updateRules(){const selected=document.querySelector('input[name="colorMode"]:checked')?.value||"relaxed";$("colorRuleDetail").textContent=selected==="nightmare"?"No breaks. No mercy. 10 rounds advance automatically: 3s, 2s, 1.5s, then 0.75s.":selected==="timed"?"Complete 10 rounds as the clock gets faster: 5s, 3.5s, 2.5s, then 1s.":"Complete 10 rounds with no timer. Take as long as you need!";}
 function countdown(){
   roundActive=false;
   const overlay=$("colorCountdown"),value=$("colorCountdownValue");
   overlay.hidden=false;value.textContent="3";
   let n=3;
   if(typeof window.playMiniAppSound==="function")window.playMiniAppSound("countdownTick");
   countdownTimer=setInterval(()=>{
     n--;
     if(n>=1){value.textContent=String(n);if(typeof window.playMiniAppSound==="function")window.playMiniAppSound("countdownTick");return;}
     clearInterval(countdownTimer);countdownTimer=null;
     value.textContent="GO!";
     if(typeof window.playMiniAppSound==="function")window.playMiniAppSound("countdownGo");
     countdownGoTimer=setTimeout(()=>{countdownGoTimer=null;overlay.hidden=true;draw();},450);
   },1000);
 }
 function start(){stopTimers();$("colorCountdown").hidden=true;mode=document.querySelector('input[name="colorMode"]:checked')?.value||"relaxed";timed=mode!=="relaxed";rounds=makeRounds();index=0;score=0;history=[];show(play);if(timed)countdown();else draw();}
 function exit(){stopTimers();$("colorCountdown").hidden=true;screen.hidden=true;launcher.hidden=false;open.setAttribute("aria-expanded","false");open.focus();}
 open.addEventListener("click",()=>{stopTimers();launcher.hidden=true;screen.hidden=false;open.setAttribute("aria-expanded","true");show(welcome);});
 close.addEventListener("click",exit);
 $("colorStart").addEventListener("click",start);$("colorAgain").addEventListener("click",start);$("colorChangeMode").addEventListener("click",changeMode);$("colorPlayChangeMode").addEventListener("click",changeMode);function changeMode(){stopTimers();roundActive=false;answered=true;$("colorCountdown").hidden=true;show(welcome);updateRules();}document.querySelectorAll('input[name="colorMode"]').forEach(input=>input.addEventListener("change",updateRules));updateRules();
 function advance(){if(!answered)return;stopTimers();index++;if(index>=total){$("colorProgress").style.width="100%";$("colorFinal").textContent=`You scored ${score} out of ${total}. ${score===total?'Perfect focus!':score>=7?'Sharp eyes!':'Ready for another round?'}`;$("colorFinalMode").textContent=mode==="nightmare"?"Nightmare Mode":timed?"Timed Mode":"Relaxed Mode";show(end);}else draw();}
 $("colorNext").addEventListener("click",advance);
 const mistakes=()=>history.filter(item=>item.picked!==item.ink);
 function renderReview(){const items=mistakes(),item=items[reviewIndex],content=$("colorReviewContent");content.replaceChildren();$("colorReviewCount").textContent=items.length?`${reviewIndex+1} of ${items.length}`:"0 mistakes";$("colorReviewPrev").disabled=reviewIndex===0;$("colorReviewNext").disabled=reviewIndex>=items.length-1;$("colorReviewPrev").hidden=!items.length;$("colorReviewNext").hidden=!items.length;if(!item){const msg=document.createElement("p");msg.className="color-review-flawless";msg.textContent="Flawless! Nothing to review.";content.append(msg);return;}
 const status=document.createElement("p");status.className="color-review-status";status.textContent=`ROUND ${item.round} / 10 · ${item.picked===null?"TIME OUT":"INCORRECT"}`;content.append(status);
 const prompt=document.createElement("h3");prompt.className="color-game-heading";prompt.textContent="What colour were the letters?";content.append(prompt);
 const card=document.createElement("div");card.className="color-word-card";const word=document.createElement("strong");word.textContent=item.word;word.style.color=palette.find(c=>c.name===item.ink).hex;card.append(word);content.append(card);
 const choices=document.createElement("div");choices.className="color-choices color-review-choices";for(const name of item.choices){const b=document.createElement("div");b.className="color-review-choice";if(name===item.ink)b.classList.add("is-correct");else if(name===item.picked)b.classList.add("is-wrong");b.textContent=`${name===item.ink?"✓ ":name===item.picked?"✕ ":""}${name}`;choices.append(b);}content.append(choices);
 const summary=document.createElement("div");summary.className="color-review-summary";const right=document.createElement("p"),picked=document.createElement("p");right.textContent=`Correct answer: ${item.ink}`;picked.textContent=`Your answer: ${item.picked||"No answer (time out)"}`;summary.append(right,picked);content.append(summary);}
 function openReview(){reviewIndex=0;show(review);renderReview();}
 function backReview(){show(end);}
 $("colorReviewOpen").addEventListener("click",openReview);$("colorReviewBackTop").addEventListener("click",backReview);$("colorReviewPrev").addEventListener("click",()=>{if(reviewIndex>0){reviewIndex--;renderReview();}});$("colorReviewNext").addEventListener("click",()=>{if(reviewIndex<mistakes().length-1){reviewIndex++;renderReview();}});
 screen.addEventListener("keydown",e=>{if(e.key==="Escape")exit();});
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&ticker!==null){clearInterval(ticker);ticker=null;}else if(!document.hidden&&timed&&roundActive&&!answered&&!play.hidden&&ticker===null){updateTimer();if(!answered)ticker=setInterval(updateTimer,50);}});
})();
