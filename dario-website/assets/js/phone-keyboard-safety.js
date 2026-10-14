"use strict";
/* Back controls are pointer/touch or Escape only. Enter/Return must never
   trigger Back; keep Tab navigation and other controls accessible. */
(()=>{
 const backIds=new Set(['closeMiniApps','closeBrainBites','closeDecision','closeReflex','closeCrack','closeTic','closeMemory','closeSaveContact']);
 const isBack=el=>el instanceof Element&&(backIds.has(el.id)||el.matches('.decision-back,.brain-back,.reflex-header button,.crack-header button'));
 for(const type of ['keydown','keypress','keyup'])document.addEventListener(type,e=>{
   if((e.key==='Enter'||e.key==='NumpadEnter'||e.code==='NumpadEnter')&&isBack(document.activeElement)){
     e.preventDefault();e.stopImmediatePropagation();
     if(type==='keydown')document.activeElement.blur();
   }
 },true);
})();
