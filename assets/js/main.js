(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Otevírací doba (stejná data jsou v tabulce v index.html) ---------- */
  // index = den v týdnu (0 = neděle), hodnoty v minutách od půlnoci
  const WEEKDAY = [[480, 720], [780, 960]];
  const HOURS = [[], WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, [[540, 660]]];
  const DAY_NAMES = ["v neděli", "v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu"];
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

  function pragueNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Prague", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: +get("hour") * 60 + +get("minute") };
  }

  function nextOpening(day, min) {
    for (let i = 0; i < 8; i++) {
      const d = (day + i) % 7;
      const slot = HOURS[d].find(([o]) => i > 0 || o > min);
      if (slot) {
        const when = i === 0 ? "" : i === 1 ? "zítra " : DAY_NAMES[d] + " ";
        return `${when}v ${fmt(slot[0])}`;
      }
    }
    return "";
  }

  function updateStatus() {
    const { day, min } = pragueNow();
    const today = HOURS[day];
    const open = today.find(([o, c]) => min >= o && min < c);
    let cls, html;
    if (open) {
      cls = "is-open";
      html = `<strong>Otevřeno</strong> · zavíráme v ${fmt(open[1])}`;
    } else if (today.length > 1 && min >= today[0][1] && min < today[1][0]) {
      cls = "is-pause";
      html = `<strong>Polední pauza</strong> · otevíráme v ${fmt(today[1][0])}`;
    } else {
      cls = "is-closed";
      html = `<strong>Zavřeno</strong> · otevíráme ${nextOpening(day, min)}`;
    }
    $$("[data-status]").forEach((el) => {
      el.classList.remove("is-open", "is-pause", "is-closed");
      el.classList.add(cls);
      $(".status__text", el).innerHTML = html;
    });
    $$(".hours tr").forEach((tr) => tr.classList.toggle("is-today", +tr.dataset.day === day));
  }
  updateStatus();
  setInterval(updateStatus, 60_000);

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Hlavička: mobilní menu, drážka jako ukazatel posunu, aktivní odkaz ---------- */
  const head = $(".keyhead");
  const menuBtn = $(".blade__menu");
  const menu = $("#mobmenu");
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Zavřít menu" : "Otevřít menu");
  };
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  const groove = $(".blade__groove");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    groove.style.setProperty("--progress", max > 0 ? (scrollY / max).toFixed(4) : 0);
    head.classList.toggle("is-scrolled", scrollY > 40);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $$(".blade__nav a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["sluzby", "generalni-klic", "recenze", "oteviraci-doba"].forEach((id) => spy.observe(document.getElementById(id)));

  /* ---------- Generální klíč ---------- */
  const ACCESS = {
    gen: ["vchod", "b1", "b2", "kotelna"],
    b1: ["vchod", "b1"],
    b2: ["vchod", "b2"],
    ud: ["vchod", "kotelna"],
  };
  const keyBtns = $$(".master__keys button");
  const doors = $$(".master__doors li");
  const pickKey = (btn) => {
    keyBtns.forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
    const allowed = ACCESS[btn.dataset.key];
    doors.forEach((d) => d.classList.toggle("is-open", allowed.includes(d.dataset.door)));
  };
  keyBtns.forEach((b, i) => {
    b.addEventListener("click", () => pickKey(b));
    b.addEventListener("keydown", (e) => {
      const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = keyBtns[(i + dir + keyBtns.length) % keyBtns.length];
      next.focus(); pickKey(next);
    });
  });
  pickKey(keyBtns[0]);

  /* ---------- Řez vložkou: klíč zvedá stavítka ---------- */
  const svg = $(".cyl");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent && parent.appendChild(n);
    return n;
  };

  const PIN_X = [250, 310, 370, 430, 490];   // poloha stavítek ve vložce
  const DEPTH = [14, 26, 8, 22, 16];         // hloubka zářezů klíče
  const TIP_IN = 530;                        // špička klíče při zasunutí
  const TIP_OUT = 130;                       // špička klíče venku
  const BLADE_TOP = 198, BLADE_BOT = 252, BLADE_LEN = 390;
  const SHEAR = 180, REST = 240, DRIVER = 40, SPRING_TOP = 74, PIN_W = 20;
  const CUTS = PIN_X.map((x) => x - TIP_IN);  // zářezy v souřadnicích klíče (špička = 0)
  const KEY_PIN = DEPTH.map((d) => BLADE_TOP + d - SHEAR);

  const topAt = (u) => {
    let d = 0;
    CUTS.forEach((c, i) => { d = Math.max(d, Math.min(DEPTH[i], DEPTH[i] - (Math.abs(u - c) - 4))); });
    let y = BLADE_TOP + Math.max(0, d);
    if (u > -20) y = Math.max(y, BLADE_TOP + (u + 20) * 1.2);
    return y;
  };

  // tvar čepele
  let dPath = `M${-BLADE_LEN} ${BLADE_BOT} L${-BLADE_LEN} ${BLADE_TOP}`;
  for (let u = -BLADE_LEN; u <= 0; u += 2) dPath += ` L${u} ${topAt(u).toFixed(1)}`;
  dPath += ` L0 ${BLADE_BOT - 12} L-10 ${BLADE_BOT} Z`;
  $("#keyBlade").setAttribute("d", dPath);

  const chambers = $("#chambers");
  const labels = $("#pinLabels");
  const pinsG = $("#pins");
  const pins = PIN_X.map((x, i) => {
    el("rect", { x: x - 13, y: 72, width: 26, height: 122 }, chambers);
    el("line", { x1: x, y1: 36, x2: x, y2: 44, stroke: "#6C737A" }, labels);
    const t = el("text", { x, y: 28, "text-anchor": "middle" }, labels);
    t.textContent = String(i + 1).padStart(2, "0");
    const g = el("g", {}, pinsG);
    return {
      spring: el("polyline", { fill: "none", stroke: "#AEB4BA", "stroke-width": 2, "stroke-linejoin": "round" }, g),
      driver: el("rect", { x: x - PIN_W / 2, width: PIN_W, height: DRIVER, rx: 3, fill: "url(#gNickel)", stroke: "#5F666D" }, g),
      keyPin: el("path", { fill: "url(#gBrass)", stroke: "#7A5A1C" }, g),
      x, len: KEY_PIN[i],
    };
  });

  const key = $("#key");
  const shear = $("#shear");
  const state = $("#lockState");
  const front = $("#frontPlug");

  function render(tip, turn) {
    key.setAttribute("transform", `translate(${tip} 0)`);
    let aligned = true;
    pins.forEach((p) => {
      const u = p.x - tip;
      const bottom = u <= 0 && u >= -BLADE_LEN ? Math.min(REST, topAt(u)) : REST;
      const top = bottom - p.len;
      const half = PIN_W / 2;
      p.keyPin.setAttribute("d",
        `M${p.x - half} ${top + 2} Q${p.x - half} ${top} ${p.x - half + 2} ${top} L${p.x + half - 2} ${top} Q${p.x + half} ${top} ${p.x + half} ${top + 2}` +
        ` L${p.x + half} ${bottom - 7} L${p.x} ${bottom} L${p.x - half} ${bottom - 7} Z`);
      p.driver.setAttribute("y", top - DRIVER);
      const sTop = SPRING_TOP, sBot = top - DRIVER, n = 8;
      let pts = `${p.x} ${sTop}`;
      for (let k = 1; k < n * 2; k++) pts += ` ${p.x + (k % 2 ? 8 : -8)} ${sTop + ((sBot - sTop) * k) / (n * 2)}`;
      p.spring.setAttribute("points", pts + ` ${p.x} ${sBot}`);
      if (Math.abs(top - SHEAR) > 0.6) aligned = false;
    });
    shear.classList.toggle("is-aligned", aligned);
    state.classList.toggle("is-open", turn > 0.5);
    state.textContent = turn > 0.5 ? "ODEMČENO" : aligned ? "SROVNÁNO" : "ZAMČENO";
    front.setAttribute("transform", `rotate(${turn * 90})`);
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const CYCLE = 8400;
  function frameAt(ms) {
    const t = ms % CYCLE;
    let tip = TIP_OUT, turn = 0;
    if (t < 700) tip = TIP_OUT;
    else if (t < 3100) tip = TIP_OUT + (TIP_IN - TIP_OUT) * ease((t - 700) / 2400);
    else if (t < 3500) tip = TIP_IN;
    else if (t < 4200) { tip = TIP_IN; turn = ease(clamp01((t - 3500) / 700)); }
    else if (t < 5600) { tip = TIP_IN; turn = 1; }
    else if (t < 6200) { tip = TIP_IN; turn = 1 - ease(clamp01((t - 5600) / 600)); }
    else if (t < 8000) tip = TIP_IN - (TIP_IN - TIP_OUT) * ease((t - 6200) / 1800);
    render(tip, turn);
  }

  if (reduced) { render(TIP_IN, 1); return; }

  let visible = true, raf = 0, start = performance.now(), paused = 0;
  const loop = (now) => { frameAt(now - start); raf = requestAnimationFrame(loop); };
  const play = () => { if (!raf && visible && !document.hidden) { start = performance.now() - paused; raf = requestAnimationFrame(loop); } };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; paused = (performance.now() - start) % CYCLE; } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? play() : stop(); }).observe(svg);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));
  frameAt(0);
  play();
})();
