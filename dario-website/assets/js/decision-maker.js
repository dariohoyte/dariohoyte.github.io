"use strict";
(() => {
  const open = document.getElementById("openDecision");
  const close = document.getElementById("closeDecision");
  const screen = document.getElementById("decisionScreen");
  const actions = document.querySelector(".phone-actions");
  const launcher = document.getElementById("miniAppsScreen");
  const profile = document.querySelector(".phone-profile");
  const button = document.getElementById("makeDecision");
  const wheel = document.getElementById("decisionWheel");
  if (!open || !close || !screen || !actions || !profile || !button || !wheel) return;
  const infoToggle = document.getElementById("decisionInfoToggle");
  const infoPopup = document.getElementById("decisionInfoPopup");
  const dismissInfo = () => {
    if (!infoToggle || !infoPopup) return;
    infoPopup.hidden = true;
    infoToggle.setAttribute("aria-expanded", "false");
  };
  if (infoToggle && infoPopup) {
    infoToggle.addEventListener("click", () => {
      const show = infoPopup.hidden;
      infoPopup.hidden = !show;
      infoToggle.setAttribute("aria-expanded", String(show));
    });
    document.addEventListener("pointerdown", (event) => {
      if (!infoPopup.hidden && !infoToggle.contains(event.target) && !infoPopup.contains(event.target)) dismissInfo();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !infoPopup.hidden) { dismissInfo(); infoToggle.focus(); }
    });
  }
  const outcomes = [
    {label:"YES",lines:["Absolutely. I support this questionable decision.","Go for it. If anyone asks, I approved this decision. 😏","Absolutely. You've earned it. 😎"]},
    {label:"NO",lines:["Not today. Even my algorithms have standards.","Nope. Future you says thanks.","The universe has declined your request. Politely."]},
    {label:"MAYBE",lines:["That's a very confident way of saying I have no idea.","That's a strategic maybe. Very corporate of you.","Could go either way. Helpful, aren't I?"]},
    {label:"DO IT",lines:["You've come this far. Might as well commit. 😏","Proceed. With snacks and plausible deniability.","Do it. Confidence first, details later."]},
    {label:"NOT TODAY",lines:["Future you just sent a thank-you note.","Not today. Put it on tomorrow's problem list.","The committee recommends a nap instead."]},
    {label:"ASK AGAIN",lines:["My decision-making department is on a coffee break.","Ask me again after coffee. ☕","Have you tried turning the decision off and on again?"]}
  ];
  let previous = -1, rotation = 0, spinning = false, timer = null, tickTimer = null;
  const stopTicks = () => { clearTimeout(tickTimer); tickTimer = null; };
  const spinTicks = (duration) => {
    stopTicks();
    if (!duration) return;
    const started = performance.now();
    const tick = () => {
      if (!spinning || screen.hidden) return;
      const progress = Math.min(1, (performance.now() - started) / duration);
      if (progress >= 1) return;
      window.playMiniAppSound?.("wheelTick");
      tickTimer = setTimeout(tick, 45 + 330 * progress * progress);
    };
    tick();
  };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  open.addEventListener("click", () => {
    actions.hidden = true; profile.hidden = true; if (launcher) launcher.hidden = true; screen.hidden = false;
    // Reset the wheel, result, and pending animation on every launch.
    clearTimeout(timer); stopTicks(); timer = null; spinning = false; rotation = 0; previous = -1;
    button.disabled = false;
    wheel.classList.remove("is-spinning");
    wheel.style.transition = "none";
    wheel.style.transform = "rotate(0deg)";
    void wheel.offsetWidth;
    wheel.style.removeProperty("transition");
    document.getElementById("decisionTitle").textContent = "Indecision detected.";
    document.getElementById("decisionText").textContent = "Spin the wheel. Blame me later. 😏";
    document.getElementById("decisionButtonLabel").textContent = "Spin the wheel";
    document.getElementById("decisionAnnouncement").textContent = "";
    dismissInfo();
    open.setAttribute("aria-expanded", "true"); if(document.activeElement===close)close.blur();
  });
  close.addEventListener("click", () => {
    clearTimeout(timer); stopTicks(); timer = null; spinning = false; button.disabled = false; wheel.classList.remove("is-spinning");
    dismissInfo();
    screen.hidden = true; actions.hidden = true; profile.hidden = true; if (launcher) launcher.hidden = false;
    open.setAttribute("aria-expanded", "false"); open.focus();
  });
  button.addEventListener("click", () => {
    if (spinning) return;
    const index = (previous + 1 + Math.floor(Math.random() * (outcomes.length - 1))) % outcomes.length;
    previous = index;
    const outcome = outcomes[index];
    const verdict = outcome.lines[Math.floor(Math.random() * outcome.lines.length)];
    const target = (360 - index * 60) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (target - current + 360) % 360;
    rotation += (reduceMotion.matches ? 0 : 360 * 5) + delta;
    spinning = true; button.disabled = true;
    spinTicks(reduceMotion.matches ? 0 : 3150);
    document.getElementById("decisionTitle").textContent = "Spinning…";
    document.getElementById("decisionText").textContent = "The wheel is considering your fate.";
    wheel.classList.remove("is-spinning");
    // Flush the previous transition so consecutive spins always animate.
    void wheel.offsetWidth;
    wheel.classList.toggle("is-spinning", !reduceMotion.matches);
    wheel.style.transform = `rotate(${rotation}deg)`;
    clearTimeout(timer);
    const finish = () => {
      spinning = false; stopTicks(); button.disabled = false;
      window.playMiniAppSound?.("wheelStop");
      document.getElementById("decisionTitle").textContent = outcome.label;
      document.getElementById("decisionText").textContent = verdict;
      document.getElementById("decisionButtonLabel").textContent = "Spin again";
      document.getElementById("decisionAnnouncement").textContent = `${outcome.label}. ${verdict}`;
    };
    timer = setTimeout(finish, reduceMotion.matches ? 0 : 3150);
  });
  screen.addEventListener("keydown", event => { if (event.key === "Escape") close.click(); });
})();
