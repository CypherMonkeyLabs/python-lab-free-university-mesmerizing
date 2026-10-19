const KEY = "pythonlab.bot.v1";
const bot = () => document.getElementById("lab-bot");

let drag = null;
let restingPoint = null;
let userPlaced = false;
let tapHandler = () => {};
let dragStartHandler = () => {};
const TAP_SLOP = 8;

export function onBotTap(fn) { tapHandler = fn; }
export function onBotDragStart(fn) { dragStartHandler = fn; }

/* The lab shell reserves space for the top bar, the bottom bar and the side menu.
   The bot stays inside the free area and steps clear of headings, footer icons, and primary action bars. */
function bounds() {
  const { w, h } = metrics();
  const root = getComputedStyle(document.documentElement);
  const num = (name) => parseFloat(root.getPropertyValue(name)) || 0;
  const mobile = window.matchMedia("(max-width: 899px)").matches;
  const minX = 6 + (mobile ? 0 : num("--side-now"));
  const minY = 6 + num("--top-h");
  return {
    minX,
    minY,
    maxX: Math.max(minX, window.innerWidth - w - 6),
    maxY: Math.max(minY, window.innerHeight - h - 6 - num("--bar-h")),
  };
}

function metrics() {
  const node = bot();
  return {
    w: node.offsetWidth || 127,
    h: node.offsetHeight || 170,
  };
}

function obstacles() {
  const selectors = [
    "main h1",
    "#site-footer .disclaimer-panel",
    "#site-footer .footer-zodiac-lockup",
    "#site-footer .brand-icons",
    "#site-footer .footer-bar",
    "#site-footer .site-copy",
    "audio",
    ".voice-picker",
    "main .hero-cta",
    "main .pager",
    "main .dl-actions",
  ];
  const nodes = [];
  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach((el) => nodes.push(el));
  }
  return nodes.map((el) => {
    const rect = el.getBoundingClientRect();
    const pad = el.closest("#site-footer") ? 16 : 10;
    return {
      left: rect.left - pad,
      top: rect.top - pad,
      right: rect.right + pad,
      bottom: rect.bottom + pad,
      isHeading: el.tagName === "H1",
    };
  }).filter((rect) => rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth);
}

function overlaps(x, y, w, h, rect) {
  return x < rect.right && x + w > rect.left && y < rect.bottom && y + h > rect.top;
}

function footerHit(x, y) {
  const { w, h } = metrics();
  return obstacles().some((rect) => !rect.isHeading && overlaps(x, y, w, h, rect));
}

export function clampBot(x, y) {
  const { w, h } = metrics();
  const { minX, minY, maxX, maxY } = bounds();
  x = Math.min(Math.max(minX, x), maxX);
  y = Math.min(Math.max(minY, y), maxY);
  const blocks = obstacles();
  for (let pass = 0; pass < 8; pass += 1) {
    let hit = false;
    for (const rect of blocks) {
      if (!overlaps(x, y, w, h, rect)) continue;
      hit = true;
      const below = rect.bottom + 10;
      const above = rect.top - h - 10;
      if (rect.isHeading) {
        if (below <= maxY) y = below;
        else if (above >= minY) y = above;
        else y = maxY;
      } else {
        if (above >= minY) y = above;
        else if (below <= maxY) y = below;
        else y = minY;
      }
      x = Math.min(Math.max(minX, x), maxX);
      y = Math.min(Math.max(minY, y), maxY);
    }
    if (!hit) break;
  }
  for (const rect of blocks) {
    if (!rect.isHeading || !overlaps(x, y, w, h, rect)) continue;
    const below = rect.bottom + 10;
    if (below <= maxY) y = Math.min(below, maxY);
  }
  return { x, y };
}

function hits(x, y) {
  const { w, h } = metrics();
  return obstacles().some((rect) => overlaps(x, y, w, h, rect));
}

function park(preferred) {
  const node = bot();
  const sizes = ["is-docked", "is-mini"];
  for (const size of sizes) {
    node.classList.remove("is-docked", "is-mini");
    node.classList.add(size === "is-mini" ? "is-docked" : size, ...(size === "is-mini" ? ["is-mini"] : []));
    const { w, h } = metrics();
    const box = bounds();
    const rects = obstacles();
    let best = null;
    let bestDist = Infinity;
    for (let y = box.minY; y <= box.maxY; y += 10) {
      for (let x = box.minX; x <= box.maxX; x += 10) {
        if (rects.some((rect) => overlaps(x, y, w, h, rect))) continue;
        const dist = (x - preferred.x) ** 2 + (y - preferred.y) ** 2;
        if (dist < bestDist) { bestDist = dist; best = { x, y }; }
      }
    }
    if (best) return best;
  }
  node.classList.remove("is-docked", "is-mini");
  return null;
}

function wantsDock(node) {
  const wide = window.matchMedia("(min-width: 900px)").matches;
  if (wide || userPlaced || node.classList.contains("is-dragging")) return false;
  const speaking = node.classList.contains("is-speaking");
  const open = node.classList.contains("is-open");
  if (speaking && !open) return false;
  return true;
}

function syncBlocked() {
  const node = bot();
  if (!node) return;
  const menuOpen = !!document.querySelector("details.display-menu[open]");
  const hide = menuOpen
    || document.body.classList.contains("side-open")
    || document.body.classList.contains("howto-open");
  node.classList.toggle("is-blocked", hide);
}

function applyChrome(node) {
  const dock = wantsDock(node);
  node.classList.toggle("is-py-dock", dock);
  syncBlocked();
}

function reserveSpace(node) {
  const root = document.documentElement;
  const wide = window.matchMedia("(min-width: 900px)").matches;
  let inline = "0px";
  let block = "0px";
  if (node.classList.contains("is-py-dock")) {
    inline = "72px";
    block = "72px";
  } else if (wide) {
    inline = `${Math.ceil((node.offsetWidth || 127) + 36)}px`;
  }
  if (root.style.getPropertyValue("--bot-safe-inline") !== inline) {
    root.style.setProperty("--bot-safe-inline", inline);
  }
  if (root.style.getPropertyValue("--bot-safe-block") !== block) {
    root.style.setProperty("--bot-safe-block", block);
  }
}

function place(x, y, bounce) {
  const node = bot();
  node.classList.remove("is-docked", "is-mini", "is-parked");
  applyChrome(node);
  if (node.classList.contains("is-py-dock")) {
    node.style.left = "";
    node.style.top = "";
    node.style.right = "";
    node.style.bottom = "";
    const rect = node.getBoundingClientRect();
    if (footerHit(rect.left, rect.top) && !node.classList.contains("is-speaking")) node.classList.add("is-parked");
    reserveSpace(node);
    return { x: rect.left, y: rect.top };
  }
  let next = clampBot(x, y);
  if (footerHit(next.x, next.y)) {
    const parked = park(next);
    if (parked) next = parked;
    else if (!node.classList.contains("is-speaking")) node.classList.add("is-parked");
  }
  const mid = window.innerWidth / 2;
  node.dataset.side = next.x + metrics().w / 2 < mid ? "left" : "right";
  node.style.left = `${next.x}px`;
  node.style.top = `${next.y}px`;
  node.style.right = "auto";
  node.style.bottom = "auto";
  if (bounce && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    node.classList.remove("bounce");
    void node.offsetWidth;
    node.classList.add("bounce");
  }
  reserveSpace(node);
  return next;
}

function persist(point) {
  restingPoint = { x: point.x, y: point.y };
  try {
    localStorage.setItem(KEY, JSON.stringify(point));
  } catch (err) {
    /* The bot still moves if storage is unavailable. */
  }
}

function snap(x, y) {
  const b = bounds();
  const candidates = [
    { x: b.minX, y },
    { x: b.maxX, y },
    { x, y: b.minY },
    { x, y: b.maxY },
  ].sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2));
  for (const candidate of candidates) {
    const next = clampBot(candidate.x, candidate.y);
    if (!hits(next.x, next.y)) return next;
  }
  return clampBot(x, y);
}

export function resetBot() {
  userPlaced = false;
  const b = bounds();
  const raw = { x: b.maxX - 6, y: b.maxY - 6 };
  restingPoint = raw;
  const next = place(raw.x, raw.y, true);
  persist(next);
}

export function keepBotClear() {
  const node = bot();
  const rect = node.getBoundingClientRect();
  const hasCustom = node.style.left !== "";
  const origin = restingPoint || (hasCustom ? { x: rect.left, y: rect.top } : defaultPoint());
  place(origin.x, origin.y, false);
}

function defaultPoint() {
  const b = bounds();
  return clampBot(b.maxX - 6, b.maxY - 6);
}

function labelBot(node) {
  node.setAttribute("aria-label", "Py, the lab bot: open helper");
  let help = document.getElementById("bot-drag-help");
  if (!help) {
    help = document.createElement("span");
    help.id = "bot-drag-help";
    help.className = "visually-hidden";
    help.textContent = "Drag to move it. Arrow keys nudge it.";
    node.appendChild(help);
  }
  node.setAttribute("aria-describedby", "bot-drag-help");
  if (!node.querySelector(".bot-name")) {
    const name = document.createElement("span");
    name.className = "bot-name";
    name.textContent = "Py";
    node.appendChild(name);
  }
}

export function initBot() {
  const node = bot();
  labelBot(node);
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (err) {
    saved = null;
  }
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    userPlaced = true;
    restingPoint = { x: saved.x, y: saved.y };
    place(saved.x, saved.y, false);
  } else {
    const b = bounds();
    restingPoint = { x: b.maxX - 6, y: b.maxY - 6 };
    const next = defaultPoint();
    place(next.x, next.y, false);
  }

  node.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = node.getBoundingClientRect();
    drag = {
      id: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      sx: event.clientX,
      sy: event.clientY,
      t: Date.now(),
      moved: false,
    };
    node.setPointerCapture(event.pointerId);
  });

  node.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.sx, event.clientY - drag.sy) < TAP_SLOP) return;
      drag.moved = true;
      node.classList.add("is-dragging");
      dragStartHandler();
      window.dispatchEvent(new CustomEvent("lab:bot", { detail: "drag" }));
    }
    place(event.clientX - drag.dx, event.clientY - drag.dy, false);
  });

  const finish = (event) => {
    if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.id)) return;
    const wasDrag = drag.moved;
    const rect = node.getBoundingClientRect();
    drag = null;
    if (wasDrag) userPlaced = true;
    node.classList.remove("is-dragging");
    if (event.type === "pointercancel") return;
    if (!wasDrag) {
      tapHandler(event);
      return;
    }
    const next = snap(rect.left, rect.top);
    place(next.x, next.y, true);
    persist(next);
    window.dispatchEvent(new CustomEvent("lab:bot", { detail: "drop" }));
  };
  node.addEventListener("pointerup", finish);
  node.addEventListener("pointercancel", finish);

  node.addEventListener("keydown", (event) => {
    const rect = node.getBoundingClientRect();
    let x = rect.left;
    let y = rect.top;
    const step = event.shiftKey ? 32 : 16;
    if (event.key === "ArrowLeft") x -= step;
    else if (event.key === "ArrowRight") x += step;
    else if (event.key === "ArrowUp") y -= step;
    else if (event.key === "ArrowDown") y += step;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      tapHandler(event);
      return;
    } else return;
    event.preventDefault();
    userPlaced = true;
    const next = place(x, y, false);
    persist(next);
  });

  window.addEventListener("resize", () => {
    const rect = node.getBoundingClientRect();
    const next = place(rect.left, rect.top, false);
    persist(next);
  });

  window.addEventListener("scroll", () => {
    if (drag) return;
    const origin = restingPoint || defaultPoint();
    place(origin.x, origin.y, false);
  }, { passive: true });

  document.getElementById("bot-reset")?.addEventListener("click", resetBot);
  const watch = new MutationObserver(() => syncBlocked());
  watch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("toggle", (event) => {
    if (event.target instanceof Element && event.target.matches("details.display-menu")) syncBlocked();
  }, true);
  document.addEventListener("lab:speech", () => {
    window.setTimeout(() => {
      if (!drag && restingPoint) place(restingPoint.x, restingPoint.y, false);
    }, 0);
  });
}
