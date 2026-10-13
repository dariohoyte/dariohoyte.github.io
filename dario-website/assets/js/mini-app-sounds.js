"use strict";
(() => {
  const offButton = document.getElementById('miniAppsSoundOff');
  const onButton = document.getElementById('miniAppsSoundOn');
  const soundIcon = document.getElementById('miniAppsSoundIcon');
  const phone = document.querySelector('.phone-shell');
  if (!offButton || !onButton || !phone) return;
  let enabled = true, ctx = null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const active = new Set();
  const volumeBoost = 1.20; // A subtle global increase across every mini-app tone.
  const stop = () => { for (const o of active) { try { o.stop(); } catch (_) {} } active.clear(); };
  const tone = (frequency=520, duration=.065, type='sine', volume=.035, delay=0) => {
    if (!enabled || !AudioContextClass || !phone.querySelector('#miniAppsScreen:not([hidden]), #brainBitesScreen:not([hidden]), #decisionScreen:not([hidden]), #reflexScreen:not([hidden]), #crackScreen:not([hidden]), #ticScreen:not([hidden]), #memoryScreen:not([hidden]), #colorScreen:not([hidden]), #captchaScreen:not([hidden])')) return;
    try {
      if (!ctx) ctx = new AudioContextClass();
      if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
      const oscillator = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + delay;
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * volumeBoost), start+.008);
      gain.gain.exponentialRampToValueAtTime(.0001, start+duration);
      oscillator.connect(gain); gain.connect(ctx.destination);
      active.add(oscillator); oscillator.onended = () => active.delete(oscillator);
      oscillator.start(start); oscillator.stop(start+duration+.015);
    } catch (_) { /* sound must never affect gameplay */ }
  };
  const sound = (name) => {
    if (!enabled) return;
    switch(name) {
      case 'tap': tone(510,.055); break;
      case 'captchaCheck': tone(670,.055,'sine',.025); break;
      case 'captchaStart': tone(520,.095,'sine',.030); tone(780,.14,'sine',.033,.105); break;
      case 'captchaCorrect': tone(660,.09,'sine',.030); tone(880,.15,'sine',.032,.10); break;
      case 'captchaWrong': tone(380,.11,'triangle',.024); tone(310,.16,'triangle',.022,.14); break;
      case 'captchaFinish': tone(520,.10,'sine',.028); tone(660,.11,'sine',.03,.13); tone(780,.16,'sine',.03,.27); break;
      case 'captchaPerfect': tone(523,.10,'sine',.03); tone(659,.10,'sine',.03,.12); tone(784,.12,'sine',.03,.24); tone(1047,.26,'sine',.035,.39); break;
      case 'countdownTick': tone(440,.115,'triangle',.035); break;
      case 'countdownGo': tone(740,.11,'sine',.045); tone(990,.19,'sine',.04,.105); break;
      case 'key': tone(460,.045,'triangle',.022); break;
      case 'move': tone(580,.075,'sine',.028); break;
      case 'spin': tone(350,.055,'triangle',.025); break;
      case 'start': tone(650,.10); break;
      case 'error': tone(210,.15,'triangle',.04); break;
      case 'lose': tone(392,.13,'sine',.036); tone(329.63,.13,'sine',.036,.145); tone(261.63,.22,'sine',.036,.29); break;
      case 'wheelTick': tone(620,.026,'triangle',.020); break;
      case 'wheelStop': tone(660,.11,'sine',.032); tone(880,.17,'sine',.03,.12); break;
      case 'success': tone(600,.095); tone(790,.13,'sine',.035,.105); break;
      case 'win': tone(520,.095); tone(660,.095,'sine',.035,.11); tone(850,.18,'sine',.035,.22); break;
      case 'memory': tone(440,.09,'sine',.035); break;
    }
  };
  window.playMiniAppSound = sound;
  // A consistent, distinct musical pitch for each of the nine Memory Matrix tiles.
  const memoryNotes = [261.63,293.66,329.63,349.23,392,440,493.88,523.25,587.33];
  window.playMemoryTileTone = index => {
    if (!Number.isInteger(index) || index < 0 || index >= memoryNotes.length) return;
    tone(memoryNotes[index], .20, 'sine', .040);
  };
  const update = () => {
    offButton.setAttribute('aria-pressed', String(!enabled));
    onButton.setAttribute('aria-pressed', String(enabled));
    if (soundIcon) soundIcon.className = `fa-solid ${enabled ? 'fa-volume-high' : 'fa-volume-xmark'}`;
  };
  const setSound = value => {
    enabled = value;
    if (!enabled) stop();
    update();
    if (enabled) sound('start');
  };
  offButton.addEventListener('click', () => setSound(false));
  onButton.addEventListener('click', () => setSound(true));
  update();
  document.addEventListener('click', event => {
    if (!enabled || !event.target.closest('.phone-shell') || event.target.closest('.mini-apps-sound-options')) return;
    const button = event.target.closest('button'); if (!button) return;
    if (button.closest('#crackScreen')) sound(button.hasAttribute('data-digit') || button.closest('[data-digit]') ? 'key' : 'tap');
    else if (button.closest('#ticScreen')) sound(button.closest('#ticBoard') ? 'move' : 'tap');
    else if (button.closest('#memoryScreen')) { if (!button.closest('.memory-cell')) sound('tap'); }
    else if (button.closest('#decisionScreen') && !button.closest('#makeDecision')) sound('tap');
    else if (button.closest('#reflexScreen')) sound('tap');
    else if (button.closest('#brainBitesScreen')) sound('tap');
    else if (button.closest('#miniAppsScreen')) sound('tap');
  });
  // Watch text feedback rather than changing any game's internal logic.
  const watchers = [
    ['#ticResult', /you win|you won|victory/i, 'win', /computer wins|you lose|you lost/i, 'lose'],
    ['#crackResult', /crack|win|solved/i, 'win', /lose|lost|out of/i, 'lose'],
    ['#memoryStatus', /well done/i, 'success', /game over/i, 'lose'],
    ['#reflexStatus', /too soon|early/i, 'error', /ms|reaction/i, 'success']
  ];
  watchers.forEach(([selector, good, positive, bad, negative]) => {
    const el = document.querySelector(selector); if (!el) return;
    let previous = el.textContent;
    new MutationObserver(() => {
      const current = el.textContent;
      if (current === previous) return;
      previous = current;
      if (good.test(current)) sound(positive);
      else if (bad.test(current)) sound(negative);
    }).observe(el, {childList:true,subtree:true,characterData:true});
  });
  ['closeMiniApps','closeBrainBites','closeDecision','closeReflex','closeCrack','closeTic','closeMemory'].forEach(id => {
    document.getElementById(id)?.addEventListener('click',stop);
  });
  window.addEventListener('pagehide', stop);
})();
