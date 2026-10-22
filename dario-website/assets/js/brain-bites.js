"use strict";
(() => {
  const open = document.getElementById("openBrainBites");
  const close = document.getElementById("closeBrainBites");
  const screen = document.getElementById("brainBitesScreen");
  const actions = document.querySelector(".phone-actions");
  const launcher = document.getElementById("miniAppsScreen");
  const profile = document.querySelector(".phone-profile");
  const next = document.getElementById("anotherBite");
  const saveOpen = document.getElementById("openSaveContact");
  const saveClose = document.getElementById("closeSaveContact");
  const saveScreen = document.getElementById("saveContactScreen");
  const welcome = document.getElementById("brainWelcome");
  const play = document.getElementById("brainPlay");
  const welcomeStart = document.getElementById("brainWelcomeStart");
  const bites = window.BRAIN_BITES || [];
  const dailyBites = [
    [
      ["Monday detected.", "The weekend’s free trial has officially expired."],
      ["Hello, Monday.", "Your motivation has requested another five minutes."],
      ["It’s Monday again.", "Even the coffee needed a coffee."]
    ],
    [
      ["I see you made it to Tuesday.", "Congratulations. You survived another Monday. Barely."],
      ["Tuesday has entered the chat.", "Monday's sequel. Thankfully, slightly less dramatic."],
      ["It's only Tuesday?", "At least Monday is officially yesterday's problem."]
    ],
    [
      ["Wednesday: checkpoint reached.", "Halfway through the week. Your motivation is buffering."],
      ["Welcome to Wednesday.", "The weekend is now visible in the distance. Squint."],
      ["Midweek status report:", "Still operational. Some enthusiasm may be missing."]
    ],
    [
      ["Thursday detected.", "Friday is practically waving at you."],
      ["It's Thursday.", "The weekend is loading. Please do not unplug the optimism."],
      ["Thursday: almost there.", "Your calendar is starting to look friendlier."]
    ],
    [
      ["Friday unlocked.", "Congratulations. You've unlocked Weekend: Early Access."],
      ["It's Friday.", "Your productivity has started packing its bags."],
      ["Friday has arrived.", "Please save your work before switching to weekend mode."]
    ],
    [
      ["Saturday detected.", "Productivity has left the chat."],
      ["Happy Saturday.", "Your to-do list can leave a message after the beep."],
      ["It's Saturday.", "Running on snacks, freedom, and suspiciously few alarms."]
    ],
    [
      ["Sunday has entered the chat.", "That awkward moment when Monday starts making eye contact."],
      ["Sunday: proceed gently.", "Tomorrow is none of today's business. Yet."],
      ["It's Sunday.", "Enjoy the peace before your inbox remembers you exist."]
    ]
  ];
  let lastDailyKey = "";
  function getDailyBite() {
    const now = new Date();
    const day = now.getDay();
    const localDate = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
    const variants = dailyBites[(day + 6) % 7];
    // Stable within a day; changes by week, so repeat visitors see fresh variants.
    const week = Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()) / 604800000);
    const [title, caption] = variants[week % variants.length];
    return { key:localDate, title, caption, category:"TODAY'S REALITY CHECK" };
  }
  // Situational personality: local browser clock only; no tracking or location requests.
  const situational = [
    {id:'late', test:n=>n.getHours()<5, lines:[['It’s {time}.','I’m made of code. What’s your excuse?'],['{time}, and here we are.','Neither of us is making particularly good decisions.'],['Still awake at {time}?','I was hoping one of us had a sensible bedtime.']]},
    {id:'early', test:n=>n.getHours()>=5&&n.getHours()<9, lines:[['{time} already?','Even my pixels haven’t had their coffee.'],['You’re up early.','I’d say the early bird gets the worm, but that sounds like a software problem.']]},
    {id:'noon', test:n=>n.getHours()>=11&&n.getHours()<14, lines:[['It’s {time}.','Time for a byte to eat.'],['Lunch hour, is it?','I’ve been chewing on that thought all morning.']]},
    {id:'evening', test:n=>n.getHours()>=18&&n.getHours()<23, lines:[['{time}.','I had plans tonight too. Mostly theoretical.'],['The day’s winding down.','I’m still here. Apparently I don’t do shifts.']]},
    {id:'midnight', test:n=>n.getHours()===23&&n.getMinutes()>=50, lines:[['Only {minutes} minutes until tomorrow.','I was just getting used to today.']]},
    {id:'monday', test:n=>n.getDay()===1, lines:[['Monday. Again.','I’m starting to suspect this is a recurring bug.'],['It’s Monday.','I swear we just patched this issue last week.']]},
    {id:'tuesday', test:n=>n.getDay()===2, lines:[['Tuesday.','Monday’s sequel. Nobody asked for it.']]},
    {id:'wednesday', test:n=>n.getDay()===3, lines:[['Wednesday already?','Time flies. I’d like to speak to whoever’s flying it.']]},
    {id:'thursday', test:n=>n.getDay()===4, lines:[['Thursday.','Friday is taking its sweet time.']]},
    {id:'friday', test:n=>n.getDay()===5, lines:[['It’s Friday.','I had plans too. They were mostly theoretical.'],['Friday evening and you’re hanging out with me?','I won’t tell anyone.']]},
    {id:'saturday', test:n=>n.getDay()===6, lines:[['Saturday.','I was going to be productive, but the weekend got in the way.']]},
    {id:'sunday', test:n=>n.getDay()===0, lines:[['Sunday evening.','Someone forgot to turn off fast-forward.']]},
    {id:'december', test:n=>n.getMonth()===11, lines:[['December already?','Even my thoughts are wrapping up.']]},
    {id:'newyear', test:n=>n.getMonth()===0&&n.getDate()===1, lines:[['New year, new me.','Same existential questions.']]},
    {id:'yearend', test:n=>n.getMonth()===11&&n.getDate()===31, lines:[['Last day of {year}.','I was just getting the hang of it.']]},
    {id:'longvisit', test:(n,c)=>c>=8, lines:[['You’ve been here a while.','I’m trying not to make this weird.'],['Another tap?','At this point, we’re basically in a committed interaction.']]},
    {id:'return', test:(n,c,r)=>r>1, lines:[['Oh, you’re back.','I was just sitting here pretending to have a life.']]}
  ];
  let visits = 0, selfSeen = 0;
  function situationalBites() {
    const n = new Date();
    const fmt = n.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
    const values = {time:fmt,minutes:String(60-n.getMinutes()),year:String(n.getFullYear())};
    return situational.filter(group=>group.test(n,selfSeen,visits)).flatMap(group=>group.lines.map((pair,i)=>({
      id:'situational-'+group.id+'-'+i,category:'Self-Aware',
      title:pair[0].replace(/\{(\w+)\}/g,(_,k)=>values[k]||''),
      caption:pair[1].replace(/\{(\w+)\}/g,(_,k)=>values[k]||'')
    })));
  }
  // Randomize each eligible situational pool and rotate without repeats.
  let situationQueue = [], situationUsed = new Set();
  function nextSituational() {
    const eligible=situationalBites();
    const keys=new Set(eligible.map(x=>x.id));
    if(!eligible.length)return null;
    if(eligible.every(x=>situationUsed.has(x.id)))situationUsed.clear();
    const available=eligible.filter(x=>!situationUsed.has(x.id) && x.id!==lastDisplayedId);
    if (!available.length) return null;
    const choice=available[Math.floor(Math.random()*available.length)];
    situationUsed.add(choice.id);
    return choice;
  }
  let dailyActive = false;
  let dailyBite = null;
  if (!open || !screen || !actions || !next || !bites.length) return;

  if (saveOpen && saveClose && saveScreen) {
    saveOpen.addEventListener("click", () => {
      actions.hidden = true;
      profile.hidden = true;
      screen.hidden = true;
      saveScreen.hidden = false;
      saveOpen.setAttribute("aria-expanded", "true");
      saveClose.focus();
    });
    saveClose.addEventListener("click", () => {
      saveScreen.hidden = true;
      actions.hidden = false;
      profile.hidden = false;
      saveOpen.setAttribute("aria-expanded", "false");
      saveOpen.focus();
    });
    saveScreen.addEventListener("keydown", e => {
      if (e.key === "Escape") saveClose.click();
    });
  }

  const copyButton = document.getElementById("copyBrainBite");
  const copyLabel = document.getElementById("brainCopyLabel");
  function resetCopy() {
    if (!copyButton) return;
    copyLabel.textContent = "Copy";
    copyButton.querySelector("i").className = "fa-regular fa-copy";
    copyButton.setAttribute("aria-label", "Copy this Brain Bite");
  }
  if (copyButton) copyButton.addEventListener("click", async () => {
    const bite = displayedBite || (dailyActive ? dailyBite : bites[current]);
    const content = `${bite.title}\n\n${bite.caption}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        const input = document.createElement("textarea");
        input.value = content;
        input.setAttribute("readonly", "");
        input.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
        document.body.appendChild(input);
        input.select();
        const success = document.execCommand("copy");
        input.remove();
        if (!success) throw new Error("Clipboard unavailable");
      }
      copyLabel.textContent = "Copied";
      copyButton.querySelector("i").className = "fa-solid fa-check";
      copyButton.setAttribute("aria-label", "Brain Bite copied");
      if (announcement) announcement.textContent = "Brain Bite copied to clipboard.";
    } catch (error) {
      copyLabel.textContent = "Try again";
      copyButton.setAttribute("aria-label", "Copy failed, try again");
      if (announcement) announcement.textContent = "Could not copy Brain Bite. Please try again.";
    }
  });

  const announcement = document.getElementById("brainAnnouncement");
  // Shuffle a full deck so every bite appears once before completion.
  // A new round never begins with the previous round's final bite.
  function shuffleDeck(avoidFirst = -1) {
    const deck = Array.from({length: bites.length}, (_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (deck.length > 1 && deck[0] === avoidFirst) {
      const swapWith = 1 + Math.floor(Math.random() * (deck.length - 1));
      [deck[0], deck[swapWith]] = [deck[swapWith], deck[0]];
    }
    return deck;
  }
  let deck = shuffleDeck();
  let deckPosition = 0;
  let current = deck[0];
  let displayedBite = null;
  let lastDisplayedId = null;
  let completed = false;
  const card = document.getElementById("brainCard");
  const completion = document.getElementById("brainComplete");
  const counter = document.getElementById("brainCounter");
  const nextLabel = document.getElementById("anotherBiteLabel");
  const categoryHeader = document.querySelector(".brain-card-top");
  const biteContent = document.querySelector(".brain-card-content");
  function showCompletion() {
    dailyActive = false;
    completed = true;
    if (categoryHeader) categoryHeader.hidden = true;
    if (biteContent) biteContent.hidden = true;
    if (completion) completion.hidden = false;
    if (card) card.classList.add("is-complete");
    if (counter) counter.textContent = "";
    if (nextLabel) nextLabel.textContent = "Run it back";
    next.setAttribute("aria-label", "Run it back with a freshly shuffled collection of Brain Bites");
    const icon = next.querySelector("i");
    if (icon) icon.className = "fa-solid fa-rotate-right";
    if (announcement) announcement.textContent = "You've officially had your fill of my Brain Bites. For now. Same bites. Fresh order. Still worth another taste. Run it back.";
  }
  function restoreBiteView() {
    completed = false;
    if (categoryHeader) categoryHeader.hidden = false;
    if (biteContent) biteContent.hidden = false;
    if (completion) completion.hidden = true;
    if (card) card.classList.remove("is-complete");
    if (counter) counter.textContent = "A little tech wisdom";
    if (nextLabel) nextLabel.textContent = "Another bite";
    next.setAttribute("aria-label", "Show another Brain Bite");
    const icon = next.querySelector("i");
    if (icon) icon.className = "fa-solid fa-shuffle";
  }
  function render(index, daily = false) {
    resetCopy();
    dailyActive = daily;
    let item = daily ? dailyBite : bites[index];
    if (!daily && item.category === 'Self-Aware') {
      selfSeen++;
      // Sometimes the phone notices the actual moment; otherwise use a timeless line.
      if (Math.random() < 0.65) item = nextSituational() || item;
    }
    displayedBite = item;
    lastDisplayedId = item.id;

    document.getElementById("brainCategory").textContent = item.category.toUpperCase();
    const categoryIcons = {
      "IT Humour": "fa-solid fa-terminal",
      "Self-Aware": "fa-solid fa-robot",
      "Food for Thought": "fa-solid fa-lightbulb",
      "Dario's Bits": "fa-solid fa-user"
    };
    document.getElementById("brainCategoryIcon").className = daily ? "fa-regular fa-calendar-days" : (categoryIcons[item.category] || "fa-solid fa-lightbulb");
    document.getElementById("brainTitle").textContent = item.title;
    document.getElementById("brainCaption").textContent = item.caption;
    if (counter) counter.textContent = "A little tech wisdom";
    if (announcement) announcement.textContent = `${item.category}. ${item.title}. ${item.caption}`;
  }
  open.addEventListener("click", () => {
    actions.hidden = true;
    profile.hidden = true;
    if (launcher) launcher.hidden = true;
    screen.hidden = false;
    screen.scrollTop = 0;
    open.setAttribute("aria-expanded", "true");
    // Each launch starts a fresh Brain Bites session.
    visits++;
    deck = shuffleDeck(current);
    deckPosition = 0;
    current = deck[0];
    restoreBiteView();
    dailyBite = getDailyBite();
    lastDailyKey = dailyBite.key;
    render(current);
    if (welcome) welcome.hidden = false;
    if (play) play.hidden = true;
    if(document.activeElement===close)close.blur();
  });
  if (welcomeStart) welcomeStart.addEventListener("click", () => {
    if (welcome) welcome.hidden = true;
    if (play) play.hidden = false;
    screen.scrollTop = 0;
  });
  close.addEventListener("click", () => {
    screen.hidden = true;
    if (launcher) launcher.hidden = false;
    actions.hidden = true;
    profile.hidden = true;
    open.setAttribute("aria-expanded", "false");
    open.focus();
  });
  next.addEventListener("click", () => {
    if (dailyActive) { dailyActive = false; render(current); return; }
    if (completed) {
      deck = shuffleDeck(current);
      deckPosition = 0;
      current = deck[0];
      restoreBiteView();
      render(current);
    } else if (deckPosition === deck.length - 1) {
      showCompletion();
    } else {
      current = deck[++deckPosition];
      render(current);
    }
  });
  screen.addEventListener("keydown", e => {
    if (e.key === "Escape") close.click();
  });
})();
