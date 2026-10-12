"use strict";
(()=>{
 const $=id=>document.getElementById(id),open=$("openCrack"),close=$("closeCrack"),screen=$("crackScreen"),launcher=$("miniAppsScreen"),guess=$("crackGuess"),del=$("crackDelete"),restart=$("crackRestart"),history=$("crackHistory"),feedback=$("crackFeedback"),activeControls=screen.querySelector(".crack-active-controls"),endPanel=$("crackEndPanel"),endTitle=$("crackEndTitle"),endMessage=$("crackEndMessage"),endCode=$("crackEndCode"),endCodeLabel=$("crackEndCodeLabel"),endIcon=$("crackEndIcon");
 if(!open||!close||!screen||!launcher)return;
 const slots=[...screen.querySelectorAll(".crack-slot")],digitButtons=[...screen.querySelectorAll("[data-digit]")];
 let code="",tries=0,ended=false,entry="";
 const render=()=>{slots.forEach((slot,i)=>{slot.textContent=entry[i]||"–";slot.classList.toggle("filled",!!entry[i]);});digitButtons.forEach(b=>{b.disabled=ended||entry.length===4||entry.includes(b.dataset.digit);});del.disabled=ended||!entry.length;guess.disabled=ended||entry.length!==4;};
 const newCode=()=>{const digits=[0,1,2,3,4,5,6,7,8,9];for(let i=digits.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[digits[i],digits[j]]=[digits[j],digits[i]];}code=digits.slice(0,4).join("");tries=0;ended=false;entry="";history.replaceChildren();for(let i=0;i<6;i++){const row=document.createElement("div");row.className="crack-row crack-empty";row.innerHTML='<div class="crack-history-digits"></div>';const cells=row.querySelector('.crack-history-digits');for(let j=0;j<4;j++){const cell=document.createElement('span');cell.className='crack-history-cell';cell.innerHTML='<strong>–</strong><i class="crack-dot"></i>';cells.append(cell);}history.append(row);}feedback.textContent="The code is waiting. Are you?";activeControls.hidden=false;endPanel.hidden=true;render();};
 const submit=()=>{if(ended||entry.length!==4)return;const value=entry;tries++;let exact=0,near=0;for(let i=0;i<4;i++){if(value[i]===code[i])exact++;else if(code.includes(value[i]))near++;}
 const row=history.children[tries-1];row.classList.remove("crack-empty");const cells=[...row.querySelectorAll(".crack-history-cell")];cells.forEach((cell,i)=>{cell.querySelector("strong").textContent=value[i];const dot=cell.querySelector(".crack-dot");dot.className="crack-dot "+(value[i]===code[i]?"exact":code.includes(value[i])?"near":"miss");cell.setAttribute("aria-label",`${value[i]}: ${value[i]===code[i]?"right spot":code.includes(value[i])?"wrong spot":"not in code"}`);});entry="";
 if(exact===4){ended=true;feedback.textContent=`CODE CRACKED in ${tries} ${tries===1?'try':'tries'}! Hacker energy. 😎`;}else if(tries>=6){ended=true;feedback.textContent=`LOCKED OUT! The code was ${code}. The vault wins. 🔒`;}else{feedback.textContent=`${exact} in the right spot · ${near} in the wrong spot. ${6-tries} ${6-tries===1?'try':'tries'} left.`;}if(ended){activeControls.hidden=true;endPanel.hidden=false;endCode.textContent=code;endTitle.textContent=exact===4?"CODE CRACKED!":"LOCKED OUT!";endMessage.textContent=exact===4?"Hacker energy. 😎":"The vault wins. 🔒";endCodeLabel.textContent=exact===4?"SECRET CODE":"CODE WAS";endIcon.className=exact===4?"fa-solid fa-lock-open":"fa-solid fa-lock";endPanel.classList.toggle("lost",exact!==4);feedback.textContent=exact===4?`Cracked in ${tries} ${tries===1?'attempt':'attempts'}!`:`The vault wins this round.`;}render();};
 // Keyboard shortcuts are captured at document level while this app is open.
 // No programmatic focus on the game container (which caused the large outline).
 digitButtons.forEach(b=>b.addEventListener("click",()=>{const d=b.dataset.digit;if(!ended&&entry.length<4&&!entry.includes(d)){entry+=d;render();}}));
 del.addEventListener("click",()=>{if(!ended){entry=entry.slice(0,-1);render();}});
 guess.addEventListener("click",submit);
 open.addEventListener("click",()=>{launcher.hidden=true;screen.hidden=false;open.setAttribute("aria-expanded","true");newCode();if(document.activeElement===open)open.blur();});
 close.addEventListener("click",()=>{screen.hidden=true;launcher.hidden=false;open.setAttribute("aria-expanded","false");open.focus();});
 restart.addEventListener("click",newCode);
 // Only handle keys while this mini-app is visible; never trigger phone navigation.
 document.addEventListener("keydown",e=>{
  if(screen.hidden||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==="Enter"||e.key==="NumpadEnter"||e.code==="NumpadEnter"){
   e.preventDefault();e.stopImmediatePropagation();
   if(!e.repeat){if(ended)newCode();else if(entry.length===4)submit();}
  }else if(e.key==="Backspace"){
   e.preventDefault();e.stopImmediatePropagation();
   if(!ended&&entry.length){entry=entry.slice(0,-1);render();}
  }else if(e.key.length===1&&e.key>="0"&&e.key<="9"){
   e.preventDefault();e.stopImmediatePropagation();
   if(!ended&&entry.length<4&&!entry.includes(e.key)){entry+=e.key;render();}
  }
 },true);
 // Suppress key-release activation as well; some focused buttons activate on keyup.
 document.addEventListener("keyup",e=>{
  if(screen.hidden||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==="Enter"||e.key==="NumpadEnter"||e.code==="NumpadEnter"){
   e.preventDefault();e.stopImmediatePropagation();
  }
 },true);
})();
