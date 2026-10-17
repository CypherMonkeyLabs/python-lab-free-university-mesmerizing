const KEY = "pythonlab.bot.v1";
const bot = () => document.getElementById("lab-bot");

let drag = null;
let tapHandler = () => {};
let dragStartHandler = () => {};
const TAP_SLOP = 8;

export function onBotTap(fn) { tapHandler = fn; }
export function onBotDragStart(fn) { dragStartHandler = fn; }

/* The lab shell reserves space for the top bar, the bottom bar and the side menu.
   The bot stays inside the free area. */
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
    w: node.offsetWidth || 84,
    h: node.offsetHeight || 108,
  };
}

function obstacles() {
  const nodes = [document.querySelector("main h1")].filter(Boolean);
  return nodes.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left - 10,
      top: rect.top - 10,
      right: rect.right + 10,
      bottom: rect.bottom + 10,
    };
  }).filter((rect) => rect.bottom > 0 && rect.top < window.innerHeight);
}

function overlaps(x, y, w, h, rect) {
  return x < rect.right && x + w > rect.left && y < rect.bottom && y + h > rect.top;
}

export function clampBot(x, y) {
  const { w, h } = metrics();
  const { minX, minY, maxX, maxY } = bounds();
  x = Math.min(Math.max(minX, x), maxX);
  y = Math.min(Math.max(minY, y), maxY);
  const blocks = obstacles();
  for (let pass = 0; pass < 6; pass += 1) {
    let hit = false;
    for (const rect of blocks) {
      if (!overlaps(x, y, w, h, rect)) continue;
      hit = true;
      const below = rect.bottom + 10;
      const above = rect.top - h - 10;
      if (below <= maxY) y = below;
      else if (above >= minY) y = above;
      else y = maxY;
      x = Math.min(Math.max(minX, x), maxX);
      y = Math.min(Math.max(minY, y), maxY);
    }
    if (!hit) break;
  }
  return { x, y };
}

function hits(x, y) {
  const { w, h } = metrics();
  return obstacles().some((rect) => overlaps(x, y, w, h, rect));
}

function place(x, y, bounce) {
  const node = bot();
  const next = clampBot(x, y);
  node.style.left = `${next.x}px`;
  node.style.top = `${next.y}px`;
  node.style.right = "auto";
  node.style.bottom = "auto";
  if (bounce && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    node.classList.remove("bounce");
    // Restart the snap animation even if the class was already present.
    void node.offsetWidth;
    node.classList.add("bounce");
  }
  return next;
}

function persist(point) {
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
  const b = bounds();
  const next = place(b.maxX - 6, b.maxY - 6, true);
  persist(next);
}

export function keepBotClear() {
  const node = bot();
  const rect = node.getBoundingClientRect();
  const hasCustom = node.style.left !== "";
  const origin = hasCustom ? { x: rect.left, y: rect.top } : defaultPoint();
  place(origin.x, origin.y, false);
}

function defaultPoint() {
  const b = bounds();
  return clampBot(b.maxX - 6, b.maxY - 6);
}

export function initBot() {
  const node = bot();
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (err) {
    saved = null;
  }
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    place(saved.x, saved.y, false);
  } else {
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
    }
    place(event.clientX - drag.dx, event.clientY - drag.dy, false);
  });

  const finish = (event) => {
    if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.id)) return;
    const wasDrag = drag.moved;
    drag = null;
    node.classList.remove("is-dragging");
    if (event.type === "pointercancel") return;
    if (!wasDrag) {
      // A press that stayed put is a tap or a click, not a drag.
      tapHandler(event);
      return;
    }
    const rect = node.getBoundingClientRect();
    const next = snap(rect.left, rect.top);
    place(next.x, next.y, true);
    persist(next);
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
    const rect = node.getBoundingClientRect();
    if (hits(rect.left, rect.top)) place(rect.left, rect.top, false);
  }, { passive: true });

  document.getElementById("bot-reset")?.addEventListener("click", resetBot);
}
