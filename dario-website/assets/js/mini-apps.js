"use strict";
(() => {
 const open=document.getElementById("openMiniApps"),close=document.getElementById("closeMiniApps"),screen=document.getElementById("miniAppsScreen"),actions=document.querySelector(".phone-actions"),profile=document.querySelector(".phone-profile");
 if(!open||!close||!screen||!actions||!profile)return;
 open.addEventListener("click",()=>{actions.hidden=true;profile.hidden=true;screen.hidden=false;open.setAttribute("aria-expanded","true");if(document.activeElement===close)close.blur();});
 close.addEventListener("click",()=>{screen.hidden=true;actions.hidden=false;profile.hidden=false;open.setAttribute("aria-expanded","false");open.focus();});
 screen.addEventListener("keydown",e=>{if(e.key==="Escape")close.click();});
})();
