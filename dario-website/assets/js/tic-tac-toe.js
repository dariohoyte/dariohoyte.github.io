"use strict";
(()=>{const $=id=>document.getElementById(id),open=$('openTic'),close=$('closeTic'),screen=$('ticScreen'),launcher=$('miniAppsScreen'),board=$('ticBoard'),result=$('ticResult');if(!open||!close)return;
let cells=[],state=[],active=false,pending=null,finishTimer=null,winning=[],difficulty='easy',selection=null;
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const check=a=>{for(const line of lines)if(a[line[0]]&&a[line[0]]===a[line[1]]&&a[line[1]]===a[line[2]])return {winner:a[line[0]],line};return a.every(Boolean)?{winner:'draw',line:[]}:null;};
const draw=()=>{cells.forEach((b,i)=>{b.textContent=state[i]||'';b.className='tic-cell'+(state[i]==='O'?' o':'')+(winning.includes(i)?' win':'');b.disabled=!active||!!state[i];b.setAttribute('aria-label',`Row ${Math.floor(i/3)+1}, column ${i%3+1}: ${state[i]||'empty'}`);});};
const finish=out=>{active=false;winning=out.line;draw();$('ticTurn').textContent='Match over';finishTimer=setTimeout(()=>{if(screen.hidden||active)return;board.hidden=true;result.hidden=false;$('ticAgain').textContent='Play Again';$('ticPlayingTagline').hidden=true;const win=out.winner==='X',drawn=out.winner==='draw';$('ticResultIcon').className='fa-solid fa-'+(win?'trophy':drawn?'handshake':'robot');$('ticResultIcon').style.color=win?'#65d9ce':drawn?'#a9b9ff':'#f3bb70';$('ticResultTitle').textContent=win?'YOU WIN!':drawn?"IT'S A DRAW!":'YOU LOSE!';$('ticResultText').textContent=win?'Okay, strategist. I see you. 😎':drawn?'Great minds think alike.':'The machine got you this time. 🤖';},650);};
const available=a=>a.map((v,i)=>v?-1:i).filter(i=>i>=0);
const randomMove=moves=>moves[Math.floor(Math.random()*moves.length)];
const tactical=(symbol,moves)=>{for(const i of moves){const test=state.slice();test[i]=symbol;if(check(test)?.winner===symbol)return i;}return null;};
const minimax=(a,turn,depth=0)=>{const outcome=check(a);if(outcome)return {score:outcome.winner==='O'?10-depth:outcome.winner==='X'?depth-10:0};const moves=available(a);let best=turn==='O'?-Infinity:Infinity,picks=[];for(const i of moves){a[i]=turn;const score=minimax(a,turn==='O'?'X':'O',depth+1).score;a[i]='';if((turn==='O'&&score>best)||(turn==='X'&&score<best)){best=score;picks=[i];}else if(score===best)picks.push(i);}return {score:best,pick:randomMove(picks)};};
const computer=()=>{pending=null;if(screen.hidden||result.hidden===false||active)return;const moves=available(state);if(!moves.length)return;let pick;
if(difficulty==='hard')pick=minimax(state.slice(),'O').pick;
else if(difficulty==='medium'){
 pick=tactical('O',moves);if(pick===null&&Math.random()<.68)pick=tactical('X',moves);
 if(pick===null)pick=Math.random()<.48&&moves.includes(4)?4:randomMove(moves);
}else{
 pick=Math.random()<.22?tactical('O',moves):null;
 if(pick===null)pick=randomMove(moves);
}
state[pick]='O';const outcome=check(state);if(outcome)finish(outcome);else{active=true;$('ticTurn').textContent='Your turn';draw();}};
const move=i=>{if(!active||state[i])return;state[i]='X';const outcome=check(state);if(outcome){finish(outcome);return;}active=false;$('ticTurn').textContent='Computer thinking…';draw();pending=setTimeout(computer,420);};
const choose=()=>{clearTimeout(pending);clearTimeout(finishTimer);pending=null;active=false;selection='easy';$('ticChoose').hidden=false;$('ticPlay').hidden=true;$('ticStart').disabled=false;$('ticPlayingTagline').hidden=false;const easy=document.querySelector('input[name="ticLevel"][value="easy"]');if(easy)easy.checked=true;};
const reset=()=>{if(!selection)return;clearTimeout(pending);clearTimeout(finishTimer);pending=null;state=Array(9).fill('');winning=[];const roll=Math.random();difficulty=selection==='random'?(roll<.4?'easy':roll<.8?'medium':'hard'):selection;$('ticDifficulty').textContent=difficulty[0].toUpperCase()+difficulty.slice(1);active=true;$('ticChoose').hidden=true;$('ticPlay').hidden=false;$('ticEndActions').hidden=false;$('ticAgain').textContent='New Game';$('ticPlayingTagline').hidden=false;result.hidden=true;board.hidden=false;$('ticTurn').textContent='Your turn';draw();};
for(let i=0;i<9;i++){const b=document.createElement('button');b.type='button';b.className='tic-cell';b.addEventListener('click',()=>move(i));board.append(b);cells.push(b);}
open.addEventListener('click',()=>{launcher.hidden=true;screen.hidden=false;open.setAttribute('aria-expanded','true');choose();if(document.activeElement===close)close.blur();});close.addEventListener('click',()=>{clearTimeout(pending);clearTimeout(finishTimer);active=false;screen.hidden=true;launcher.hidden=false;open.setAttribute('aria-expanded','false');open.focus();});document.querySelectorAll('input[name="ticLevel"]').forEach(b=>b.addEventListener('change',()=>{if(b.checked)selection=b.value;}));$('ticStart').addEventListener('click',reset);$('ticAgain').addEventListener('click',reset);$('ticChange').addEventListener('click',choose);screen.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close.click();}else if(e.key==='Enter'&&!result.hidden&&e.target.tagName!=='BUTTON'){e.preventDefault();reset();}});
})();