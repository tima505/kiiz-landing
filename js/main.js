/* ==========================================================
   Ақ Киіз — лендинг скрипті
   ----------------------------------------------------------
   ⚙️  НАСТРОЙКИ: поменяйте номера здесь — они сами
   подставятся на весь сайт (кнопки WhatsApp, телефоны).
   ========================================================== */
const CONFIG = {
  // Номер WhatsApp: только цифры, с кодом страны, без "+" и пробелов
  whatsapp: "77000000000",

  // Телефоны для звонков (показываются в блоке «Байланыс» и в шапке)
  phones: [
    "+7 (700) 000-00-00",
    "+7 (701) 000-00-00",
  ],

  // Текст, который автоматически появится в WhatsApp
  waMessage: "Сәлеметсіз бе! Киіз бұйымдарына тапсырыс бергім келеді.",
  waProductMessage: (name) => `Сәлеметсіз бе! Мені «${name}» қызықтырады. Бағасы мен өлшемін айтып жібересіз бе?`,

  // Интро: через сколько мс шерсть сама превратится в киіз, если не нажали
  introAutoMs: 3600,
};

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const telHref = (p) => "tel:+" + p.replace(/\D/g, "");

/* ==========================================================
   1. Байланыс сілтемелері
   ========================================================== */
function wireContacts() {
  $$("[data-wa]").forEach((a) => (a.href = waLink(CONFIG.waMessage)));
  $$("[data-wa-product]").forEach((a) => (a.href = waLink(CONFIG.waProductMessage(a.dataset.waProduct))));
  $$("[data-phone]").forEach((a) => {
    const p = CONFIG.phones[+a.dataset.phone] || CONFIG.phones[0];
    a.textContent = p;
    a.href = telHref(p);
  });
  const list = $("#phones");
  if (list) list.innerHTML = CONFIG.phones.map((p) => `<li><a href="${telHref(p)}">${p}</a></li>`).join("");
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}

/* ==========================================================
   2. ИНТРО: жүн талшықтары → киіз
   ========================================================== */
function intro() {
  const root = $("#intro");
  const canvas = $("#woolCanvas");
  const ctx = canvas.getContext("2d");
  const btn = $("#introBtn");
  const kicker = $("#introKicker");
  const title = $("#introTitle");

  let W, H, dpr, felt, fibers = [], drops = [];
  let phase = "idle"; // idle → press → felt → done
  let pressStart = 0;
  const PRESS_MS = 2800;
  const t0 = performance.now();

  const WOOL = ["#fffdf8", "#f7efe0", "#efe4cf", "#e6d8bd", "#fbf6ec"];
  const RED = [163, 39, 31];

  function feltRect() {
    const w = Math.min(520, W * 0.82);
    const h = w * (260 / 400);
    return { x: W / 2 - w / 2, y: H / 2 - h * 0.58 - h * 0.08 + h * 0.08, w, h, cx: W / 2, cy: H / 2 - h * 0.16 };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    felt = feltRect();
    felt.y = felt.cy - felt.h / 2;
  }

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function makeFibers() {
    const count = Math.round(clamp((W * H) / 2600, 260, 520));
    const R = Math.min(W, H) * 0.24;
    fibers = Array.from({ length: count }, () => {
      // пушистое облако шерсти
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.7) * R;
      const sx = felt.cx + Math.cos(a) * r * 1.35;
      const sy = felt.cy + Math.sin(a) * r * 0.85;
      return {
        sx, sy,
        tx: felt.x + 8 + Math.random() * (felt.w - 16),
        ty: felt.y + 8 + Math.random() * (felt.h - 16),
        ang: Math.random() * Math.PI * 2,
        len: rand(26, 70),
        curl: rand(0.6, 1.6),
        freq: rand(2, 5),
        w: rand(0.8, 2.2),
        col: hexToRgb(WOOL[(Math.random() * WOOL.length) | 0]),
        shade: rand(0.85, 1.05),
        sway: rand(0, Math.PI * 2),
        redDelay: Math.random() * 0.35,
      };
    });
  }

  function spawnDrops(now) {
    if (drops.length > 70) return;
    for (let i = 0; i < 3; i++) {
      drops.push({
        x: felt.x + Math.random() * felt.w,
        y: felt.y - rand(60, 220),
        vy: rand(5, 9),
        born: now,
      });
    }
  }

  function drawFiber(f, p, time) {
    // p: 0 (пушистое) → 1 (свалянное)
    const e = ease(p);
    const x = lerp(f.sx, f.tx, e);
    const y = lerp(f.sy, f.ty, e);
    const sway = Math.sin(time * 0.0012 + f.sway) * (1 - e) * 6;
    const len = lerp(f.len, f.len * 0.45, e);
    const curl = lerp(f.curl * 9, 2.2, e);
    const ang = f.ang + Math.sin(time * 0.0007 + f.sway) * 0.25 * (1 - e) + e * 2.5;

    // цвет: шерсть → киіз-қызыл (с небольшим разбросом)
    const rp = clamp((p - 0.45 - f.redDelay * 0.6) / 0.4);
    const c = f.col.map((v, i) => Math.round(lerp(v, RED[i] * f.shade, rp)));
    ctx.strokeStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    ctx.lineWidth = lerp(f.w, f.w * 1.8 + 0.6, e);
    ctx.globalAlpha = lerp(0.85, 1, e);

    const cos = Math.cos(ang), sin = Math.sin(ang);
    ctx.beginPath();
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps - 0.5;
      const along = t * len;
      const off = Math.sin(t * f.freq * Math.PI + time * 0.002 * (1 - e) + f.sway) * curl + sway * t;
      const px = x + cos * along - sin * off;
      const py = y + sin * along + cos * off;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }

  function frame(now) {
    if (phase === "done") return;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    let p = 0;
    let squash = 1;
    if (phase === "press" || phase === "felt") {
      p = clamp((now - pressStart) / PRESS_MS);
      // три «нажатия» — как будто киіз басып жатыр
      const pulses = Math.sin(p * Math.PI * 6);
      squash = 1 - Math.max(0, pulses) * 0.06 * (1 - p);
      if (p < 0.55) spawnDrops(now);
    }

    // мягкая тень под шерстью / будущим киізом
    ctx.save();
    const shadowA = lerp(0.12, 0.25, p);
    const g = ctx.createRadialGradient(felt.cx, felt.cy + felt.h * 0.55, 10, felt.cx, felt.cy + felt.h * 0.55, felt.w * 0.6);
    g.addColorStop(0, `rgba(90,50,20,${shadowA})`);
    g.addColorStop(1, "rgba(90,50,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // подложка-основа: появляется по мере сваливания
    if (p > 0.35) {
      const a = clamp((p - 0.35) / 0.5);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "#9b241d";
      roundRect(felt.x, felt.y, felt.w, felt.h, 14);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(felt.cx, felt.cy);
    ctx.scale(1 + (1 - squash) * 0.6, squash);
    ctx.translate(-felt.cx, -felt.cy);
    ctx.lineCap = "round";
    for (const f of fibers) drawFiber(f, p, now - t0);
    ctx.restore();

    // капли воды
    ctx.globalAlpha = 1;
    drops = drops.filter((d) => {
      d.y += d.vy; d.vy += 0.25;
      const hit = d.y > felt.y + felt.h * 0.5;
      ctx.fillStyle = "rgba(90,150,200,.75)";
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 2.2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (hit) {
        ctx.strokeStyle = "rgba(90,150,200,.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 9, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      return !hit;
    });

    if (phase === "press" && p >= 1) toFelt();
    requestAnimationFrame(frame);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function setText(k, t) {
    kicker.style.opacity = 0; title.style.opacity = 0; title.style.transform = "translateY(10px)";
    setTimeout(() => {
      kicker.textContent = k; title.textContent = t;
      kicker.style.opacity = 1; title.style.opacity = 1; title.style.transform = "none";
    }, 350);
  }

  function press() {
    if (phase !== "idle") return;
    clearTimeout(autoTimer);
    phase = "press";
    pressStart = performance.now();
    root.classList.add("is-pressing");
    setText("Су сеуіп, басамыз…", "Талшықтар бірігуде");
  }

  function toFelt() {
    phase = "felt";
    root.classList.add("is-felt");
    canvas.style.transition = "opacity .9s ease .3s";
    canvas.style.opacity = 0;
    setText("Дәстүрлі қазақ киізі", "Міне, киіз дайын!");
    setTimeout(leave, 2600);
  }

  function leave() {
    if (phase === "done") return;
    phase = "done";
    clearTimeout(autoTimer);
    root.classList.add("is-leaving");
    document.body.classList.remove("is-intro");
    root.setAttribute("aria-hidden", "true");
    setTimeout(() => root.classList.add("is-gone"), 1300);
    startPage();
  }

  // авто-таймер с полоской прогресса на кнопке
  const bar = document.createElement("span");
  bar.className = "progress";
  bar.innerHTML = "<i></i>";
  btn.appendChild(bar);
  const barFill = bar.firstChild;
  barFill.style.transition = `width ${CONFIG.introAutoMs}ms linear`;
  requestAnimationFrame(() => requestAnimationFrame(() => (barFill.style.width = "100%")));
  const autoTimer = setTimeout(press, CONFIG.introAutoMs);

  btn.addEventListener("click", press);
  canvas.addEventListener("click", press);
  $("#introSkip").addEventListener("click", leave);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") leave();
    if ((e.key === "Enter" || e.key === " ") && phase === "idle") { e.preventDefault(); press(); }
  });
  addEventListener("resize", () => { resize(); if (phase === "idle") makeFibers(); });

  resize();
  makeFibers();

  if (reduceMotion) { leave(); return; }
  requestAnimationFrame(frame);
}

/* ==========================================================
   3. Қозылар (барашки)
   ========================================================== */
function sheepSVG() {
  const leg = (x, cls) => `<rect class="leg ${cls}" x="${x}" y="40" width="4" height="15" rx="2" fill="#3a2e28"/>`;
  return `
  <svg viewBox="0 0 84 60" aria-hidden="true">
    <g>
      ${leg(24, "a")}${leg(33, "b")}${leg(49, "b")}${leg(58, "a")}
      <g class="sheep-body">
        <circle cx="16" cy="30" r="5" fill="#efe4cf"/>
        <circle cx="28" cy="31" r="11" fill="#f7f1e4"/>
        <circle cx="40" cy="24" r="12" fill="#fffdf8"/>
        <circle cx="53" cy="30" r="11" fill="#f7f1e4"/>
        <circle cx="34" cy="38" r="10" fill="#efe4cf"/>
        <circle cx="48" cy="38" r="10" fill="#efe4cf"/>
        <circle cx="41" cy="33" r="13" fill="#fbf6ec"/>
        <g class="head">
          <ellipse cx="66" cy="29" rx="8" ry="10" fill="#3a2e28"/>
          <ellipse cx="59" cy="25" rx="5" ry="2.4" fill="#3a2e28" transform="rotate(-25 59 25)"/>
          <circle cx="65" cy="20" r="5" fill="#fffdf8"/>
          <circle cx="69" cy="27" r="1.4" fill="#fff"/>
          <ellipse cx="70" cy="35" rx="2" ry="1.2" fill="#5b4d42"/>
        </g>
      </g>
    </g>
  </svg>`;
}

function buildFlock(el, n, opts = {}) {
  if (!el) return;
  const { minW = 44, maxW = 82, maxY = 46 } = opts;
  const items = Array.from({ length: n }, () => {
    const depth = Math.random(); // 0 — дальше, 1 — ближе
    return { depth, w: lerp(minW, maxW, depth), y: lerp(maxY, 0, depth) };
  }).sort((a, b) => a.depth - b.depth);

  items.forEach((it, i) => {
    const s = document.createElement("div");
    const dur = lerp(80, 38, it.depth) + rand(-6, 6);
    s.className = "sheep" + (Math.random() < 0.3 ? " rev" : "");
    s.style.setProperty("--w", it.w + "px");
    s.style.setProperty("--y", it.y + "px");
    s.style.setProperty("--dur", dur + "s");
    s.style.setProperty("--delay", -(dur * (i / n) + rand(0, 5)) + "s");
    s.style.zIndex = Math.round(it.depth * 10);
    s.innerHTML = `<div class="sheep-inner">${sheepSVG()}</div>`;
    // ножки быстрее у мелких/ближних
    s.querySelectorAll(".leg, .sheep-body").forEach((l) => (l.style.animationDuration = lerp(0.6, 0.38, it.depth) + "s"));
    el.appendChild(s);

    // иногда барашек останавливается пощипать траву
    const graze = () => {
      setTimeout(() => {
        s.classList.add("grazing");
        setTimeout(() => { s.classList.remove("grazing"); graze(); }, rand(1800, 4200));
      }, rand(4000, 14000));
    };
    if (!reduceMotion) graze();

    // клик — барашек подпрыгивает
    s.style.pointerEvents = "auto";
    s.style.cursor = "pointer";
    s.addEventListener("click", () => {
      s.animate([{ translate: "0 0" }, { translate: "0 -26px" }, { translate: "0 0" }], { duration: 450, easing: "ease-out" });
    });
  });
}

/* ==========================================================
   4. Киіз өрнектері (SVG генератор)
   ========================================================== */
const PALETTES = {
  red: { bg: "#a3271f", fg: "#f6efe2", acc: "#c8902e" },
  blue: { bg: "#1f3a5f", fg: "#f6efe2", acc: "#c8902e" },
  ochre: { bg: "#c8902e", fg: "#2a211c", acc: "#a3271f" },
  cream: { bg: "#e9dcc3", fg: "#a3271f", acc: "#1f3a5f" },
  dark: { bg: "#2a211c", fg: "#c8902e", acc: "#a3271f" },
  "cream-on-red": { bg: "#7e1c16", fg: "#f6efe2", acc: "#c8902e" },
};
let patId = 0;

function feltSVG(name) {
  const p = PALETTES[name] || PALETTES.red;
  const id = "f" + ++patId;
  const horn = (x, y, s, c, rot = 0) =>
    `<use href="#orn-horn" x="${x}" y="${y}" width="${s}" height="${s}" style="color:${c}" transform="rotate(${rot} ${x + s / 2} ${y + s / 2})"/>`;

  let band = "";
  for (let x = 30; x <= 340; x += 44) {
    band += horn(x, 30, 30, p.fg) + horn(x, 340, 30, p.fg, 180);
  }
  let side = "";
  for (let y = 96; y <= 280; y += 46) {
    side += horn(30, y, 28, p.fg, -90) + horn(342, y, 28, p.fg, 90);
  }

  return `
  <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <filter id="${id}n" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="${patId * 7}"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 0.28"/></feComponentTransfer>
        <feComposite in2="SourceGraphic" operator="in"/>
        <feBlend in2="SourceGraphic" mode="multiply"/>
      </filter>
      <pattern id="${id}p" width="46" height="46" patternUnits="userSpaceOnUse">
        <path d="M23 6 L40 23 L23 40 L6 23Z" fill="none" stroke="${p.fg}" stroke-opacity=".16" stroke-width="2"/>
        <circle cx="23" cy="23" r="2.5" fill="${p.acc}" fill-opacity=".5"/>
      </pattern>
    </defs>
    <rect width="400" height="400" fill="${p.bg}" filter="url(#${id}n)"/>
    <rect x="76" y="76" width="248" height="248" fill="url(#${id}p)"/>
    <rect x="16" y="16" width="368" height="368" rx="6" fill="none" stroke="${p.fg}" stroke-width="4"/>
    <rect x="72" y="72" width="256" height="256" rx="4" fill="none" stroke="${p.acc}" stroke-width="3" stroke-dasharray="10 6"/>
    ${band}${side}
    <path d="M200 120 L280 200 L200 280 L120 200Z" fill="${p.bg}" stroke="${p.acc}" stroke-width="5"/>
    ${horn(152, 150, 96, p.fg)}
  </svg>`;
}

function renderFelts() {
  $$(".felt-pattern").forEach((el) => (el.innerHTML = feltSVG(el.dataset.pattern)));
}

/* ==========================================================
   5. Жүн талшықтары макро + ұшып жүрген жүн
   ========================================================== */
function macroFibers() {
  const svg = $("#macroFibers");
  if (!svg) return;
  const cols = ["#ffffff", "#f3e9d6", "#e3d3b5", "#d6c19c", "#fbf5ea"];
  let paths = "";
  for (let i = 0; i < 150; i++) {
    let x = rand(-20, 320), y = rand(-20, 320);
    const a = rand(0, Math.PI * 2), L = rand(40, 140), segs = 6;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let s = 1; s <= segs; s++) {
      const t = (s / segs) * L;
      const off = Math.sin(s * rand(1, 2.2)) * rand(4, 12);
      const nx = x + Math.cos(a) * t - Math.sin(a) * off;
      const ny = y + Math.sin(a) * t + Math.cos(a) * off;
      d += ` S${(nx + rand(-8, 8)).toFixed(1)} ${(ny + rand(-8, 8)).toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
    }
    paths += `<path d="${d}" fill="none" stroke="${cols[i % cols.length]}" stroke-width="${rand(0.8, 2.6).toFixed(1)}" stroke-linecap="round" opacity="${rand(0.6, 1).toFixed(2)}"/>`;
  }
  svg.innerHTML = `<g class="spin">${paths}</g>`;
}

function fluffs() {
  const box = $("#fluffs");
  if (!box || reduceMotion) return;
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    const size = rand(10, 26);
    s.style.cssText = `width:${size}px;height:${size}px;left:${rand(0, 100)}%;top:${rand(30, 85)}%;
      animation-duration:${rand(9, 18)}s;animation-delay:${-rand(0, 18)}s;--dx:${rand(-60, 120)}px`;
    box.appendChild(s);
  }
}

/* ==========================================================
   6. Бет: header, мәзір, reveal, қадамдар
   ========================================================== */
let pageStarted = false;
function startPage() {
  if (pageStarted) return;
  pageStarted = true;

  // reveal с лёгкой задержкой между соседями
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const sibs = $$(".reveal", e.target.parentElement);
        e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 5) * 90 + "ms";
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));
}

function pageUI() {
  const header = $("#header");
  const wa = $(".wa-float");
  const steps = $("#steps");
  const fill = $("#stepsFill");
  const stepEls = $$(".step");

  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    wa.classList.toggle("is-visible", y > innerHeight * 0.5);

    // прогресс линии процесса
    const r = steps.getBoundingClientRect();
    const prog = clamp((innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.2));
    if (innerWidth > 980) fill.style.width = prog * 100 + "%";
    else fill.style.setProperty("--h", prog * 100 + "%");
    stepEls.forEach((s, i) => s.classList.toggle("is-active", prog >= i / stepEls.length + 0.02));
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // мобильное меню
  const burger = $("#burger");
  const nav = $("#nav");
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    nav.classList.toggle("is-open");
  });
  $$("a", nav).forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("is-open");
      nav.classList.remove("is-open");
    })
  );

  // лёгкий параллакс киіз-карточки в hero
  const heroFelt = $("#heroFelt");
  if (heroFelt && !reduceMotion && matchMedia("(pointer:fine)").matches) {
    addEventListener("mousemove", (e) => {
      const dx = (e.clientX / innerWidth - 0.5) * 10;
      const dy = (e.clientY / innerHeight - 0.5) * 10;
      heroFelt.style.translate = `${dx}px ${dy}px`;
    });
  }
}

/* ---------- start ---------- */
wireContacts();
renderFelts();
macroFibers();
fluffs();
buildFlock($("#flock"), innerWidth < 700 ? 5 : 8);
buildFlock($("#footerFlock"), innerWidth < 700 ? 3 : 5, { minW: 34, maxW: 52, maxY: 10 });
pageUI();
intro();
