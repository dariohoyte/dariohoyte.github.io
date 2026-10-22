'use strict';
// Run: node tests/quick-draw-regression.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/word-hunt.js'),'utf8');
const match=source.match(/const QUICK_OFFLINE_WORDS=`([^`]*)`/s);
assert(match,'Embedded Quick Draw dictionary missing');
const dictionary=new Set(match[1].trim().split(/\s+/));
const positive=fs.readFileSync(path.join(__dirname,'quick-draw-positive.txt'),'utf8').trim().split(/\s+/);
const negative=fs.readFileSync(path.join(__dirname,'quick-draw-negative.txt'),'utf8').trim().split(/\s+/);
for(const w of positive)assert(dictionary.has(w),`Familiar word wrongly rejected: ${w}`);
for(const w of negative)assert(!dictionary.has(w),`Unwanted word wrongly accepted: ${w}`);
for(const w of dictionary)assert(/^[A-Z]{3,9}$/.test(w),`Invalid dictionary entry: ${w}`);
for(let n=3;n<=9;n++)assert([...dictionary].some(w=>w.length===n),`No ${n}-letter words`);
// Execute the actual trie and enumeration functions from the shipped website source.
const section=source.match(/const quickTrie=\{\};function rebuildQuickTrie\(\).*?(?=\n\s*const quickTiers=)/s);
assert(section,'Cannot find Quick Draw trie and enumeration code');
const directions=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
const context=vm.createContext({dictionary,directions});
vm.runInContext(section[0]+'\nthis.enumerateQuick=enumerateQuick;',context);
const grid=Array(36).fill('X');
// SEAM follows a turning path: S(0), E(1), A(8), M(14), including a diagonal.
for(const [i,l] of [[0,'S'],[1,'E'],[8,'A'],[14,'M']])grid[i]=l;
const actual=context.enumerateQuick(grid);
assert(actual.has('SEAM'),'SEAM not recognized on valid turning/diagonal path');
// Independent brute-force path validator: each result must be legally traceable.
function legal(word,board){const visit=(i,k,used)=>{if(board[i]!==word[k])return false;if(k===word.length-1)return true;const r=i/6|0,c=i%6;for(let j=0;j<36;j++){if(used.has(j))continue;const rr=j/6|0,cc=j%6;if(Math.max(Math.abs(rr-r),Math.abs(cc-c))===1&&visit(j,k+1,new Set([...used,j])))return true}return false};for(let i=0;i<36;i++)if(visit(i,0,new Set([i])))return true;return false}
for(const w of actual){assert(dictionary.has(w),`Enumerated word not in dictionary: ${w}`);assert(legal(w,grid),`Illegal path for ${w}`)}
// All eligible words are counted by the same enumerator that gameplay checks.
assert(source.includes('quickPossible.has(word)'),'Gameplay is not validating against possible-word set');
assert(source.includes('quickPreparedWords=best.poss'),'Generated board and word total are disconnected');
assert(source.includes('poss.size>=20&&poss.size<=30'),'20–30 word target missing');
// Sanity-check real candidate construction and count distribution over a small batch.
const seedSection=source.match(/const quickLetters=.*?(?=\n\s*async function prepareQuickBoard)/s);
assert(seedSection,'Cannot find Quick Draw board generation');
vm.runInContext(`const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};const pathFor=${'function(word,cells,turns){let candidates=[];for(let attempt=0;attempt<170;attempt++){let start=Math.floor(Math.random()*36),path=[start],dir=directions[Math.floor(Math.random()*directions.length)];for(let i=1;i<word.length;i++){let prev=path.at(-1),r=Math.floor(prev/6),c=prev%6,options=[];for(let d of directions){if(!turns&&d!==dir)continue;let nr=r+d[0],nc=c+d[1],n=nr*6+nc;if(nr>=0&&nr<6&&nc>=0&&nc<6&&!path.includes(n)&&(!cells[n]||cells[n]===word[i]))options.push(n)}if(!options.length)break;options.sort((a,b)=>(cells[b]===word[i]?1:0)-(cells[a]===word[i]?1:0));path.push(options[0])}if(path.length===word.length&&(!cells[start]||cells[start]===word[0]))candidates.push(path)}return candidates.length?shuffle(candidates)[0]:null}'};`+seedSection[0]+'\nthis.quickCandidate=quickCandidate;',context);
let eligible=0;for(let i=0;i<250;i++){const board=context.quickCandidate(i%6!==0);const n=context.enumerateQuick(board.cells).size;if(n>=20&&n<=30)eligible++}
assert(eligible>0,`No suitable boards found among 250 candidates`);
console.log(`Candidate smoke test: ${eligible}/250 boards within 20–30 words`);
console.log(`PASS: ${dictionary.size} dictionary words, ${positive.length} familiar-word cases, ${negative.length} exclusions, legal paths, gameplay/count consistency.`);
