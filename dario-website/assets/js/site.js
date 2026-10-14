"use strict";document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());document.querySelectorAll('[data-experience]').forEach(el=>el.textContent=Math.max(0,new Date().getFullYear()-2015));document.querySelectorAll('.navbar-nav .nav-link').forEach(link=>link.addEventListener('click',()=>{const nav=document.getElementById('mainNav');if(nav?.classList.contains('show')&&window.bootstrap){bootstrap.Collapse.getOrCreateInstance(nav).hide()}}));
// Update the mock phone clock without document.write or jQuery.
const phoneClock = document.getElementById('phoneTime');
if (phoneClock) {
  const updatePhoneClock = () => { phoneClock.textContent = new Intl.DateTimeFormat(undefined, {hour:'numeric', minute:'2-digit'}).format(new Date()); };
  updatePhoneClock();
  setInterval(updatePhoneClock, 60000);
}
