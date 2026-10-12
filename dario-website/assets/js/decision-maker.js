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
    {label:"YES",lines:["The wheel has spoken. Try to act surprised.","Permission granted. Don't make me regret this.","Absolutely. I support this questionable decision.","That's a yes. Your conscience may appeal.","Go on, then. I'll pretend I saw nothing.","Yes. That confidence looks suspiciously rehearsed.","Approved. Terms and conditions apply. Probably.","Yes. You were hoping I'd say that, weren't you?"]},
    {label:"NO",lines:["Nope. Even I have standards.","That's a no. Take it up with the wheel.","Denied. Please direct complaints to absolutely nobody.","No. I saved you from yourself. You're welcome.","Absolutely not. Lovely question, though.","No. I can hear your disappointment from here.","The answer is no. Don't look at me like that.","Nope. Consider that character development."]},
    {label:"MAYBE",lines:["Maybe. I enjoy being unhelpful.","That's a solid maybe. Very brave of me.","Possibly. I like to keep things complicated.","Maybe. I'm leaving the drama to you.","Maybe. Commitment isn't my strongest feature.","Could go either way. Riveting, isn't it?","Maybe. You're welcome for the clarity.","Not yes. Not no. You're doing great."]},
    {label:"ASK AGAIN",lines:["I didn't hear you. Speak up!","Sorry, what was that? My imaginary ears were ringing.","Could you repeat that? I was pretending to listen.","You're going to have to say that again. With confidence this time.","Pardon? I was miles away.","I heard something. It wasn't a question.","One more time. And use your outside voice.","Sorry, I zoned out. Where were we?"]}
  ];
  const examples = [
    "Can I get away with one more drink?", "Should I text my ex?",
    "Should I buy it and worry later?", "Should I stay out past my bedtime?",
    "Should I have one more slice?", "Should I tell them what I really think?"
  ];
  const welcome = document.getElementById("decisionWelcome");
  const game = document.getElementById("decisionGame");
  const start = document.getElementById("decisionStart");
  const suggestions = document.getElementById("decisionSuggestions");
  const resultIcon = document.getElementById("decisionResultIcon");
  const resultIcons = ["fa-check", "fa-xmark", "fa-circle-question", "fa-ear-listen"];
  const resultClasses = ["yes", "no", "maybe", "again"];
  const clearResultIcon = () => { resultIcon.hidden = true; resultIcon.className = "decision-result-icon"; resultIcon.replaceChildren(); };
  const shuffled = values => {
    const result = [...values];
    for(let i=result.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[result[i],result[k]]=[result[k],result[i]];}
    return result;
  };
  const showWelcome = () => {
    welcome.hidden = false; game.hidden = true;
    suggestions.replaceChildren();
    shuffled(examples).slice(0,3).forEach(example => {
      const li=document.createElement("li"); li.textContent=example; suggestions.append(li);
    });
  };
  start.addEventListener("click", () => {
    welcome.hidden=true; game.hidden=false; button.focus();
  });
  let previousLine = new Map();
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
    clearResultIcon(); showWelcome();
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
    const index = Math.floor(Math.random() * outcomes.length);
    previous = index;
    const outcome = outcomes[index];
    const available = outcome.lines.map((_,i)=>i).filter(i=>i!==previousLine.get(index));
    const lineIndex = available[Math.floor(Math.random()*available.length)];
    previousLine.set(index,lineIndex);
    const verdict = outcome.lines[lineIndex];
    const target = (360 - index * 90) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (target - current + 360) % 360;
    rotation += (reduceMotion.matches ? 0 : 360 * 5) + delta;
    spinning = true; button.disabled = true;
    spinTicks(reduceMotion.matches ? 0 : 3150);
    clearResultIcon();
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
      resultIcon.className = `decision-result-icon ${resultClasses[index]}`;
      const icon = document.createElement("i"); icon.className = `fa-solid ${resultIcons[index]}`; icon.setAttribute("aria-hidden", "true");
      resultIcon.replaceChildren(icon); resultIcon.hidden = false;
      document.getElementById("decisionTitle").textContent = outcome.label;
      document.getElementById("decisionText").textContent = verdict;
      document.getElementById("decisionButtonLabel").textContent = "Spin again";
      document.getElementById("decisionAnnouncement").textContent = `${outcome.label}. ${verdict}`;
    };
    timer = setTimeout(finish, reduceMotion.matches ? 0 : 3150);
  });
  screen.addEventListener("keydown", event => { if (event.key === "Escape") close.click(); });
})();
