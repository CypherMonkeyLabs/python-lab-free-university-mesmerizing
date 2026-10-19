/* Py's small show: rotating speech bubble, eyes that follow the pointer. */
const MESSAGES = [
  "Hi, I am Py, the lab bot. Tap me!",
  "Need help? Tap me.",
  "Press / to search.",
  "Drag me out of the way.",
  "Try the Slides page.",
  "Hi! I'm Py. Tap me anytime.",
  "Welcome back! Tap me for quick actions.",
];
let timer = 0;
let idx = 0;

const bot = () => document.getElementById("lab-bot");

function side() {
  const node = bot();
  if (!node) return;
  const r = node.getBoundingClientRect();
  node.dataset.side = r.left < 170 ? "left" : "right";
}

export function setIntro(t) {
  const next = String(t || "").trim();
  if (next.length > 0 && next.length <= 40) MESSAGES[0] = next;
}
export function sayBot(text) {
  const b = document.getElementById("bot-bubble");
  if (!b) return;
  const value = String(text || "").trim();
  if (!value || value.length > 40 || !MESSAGES.includes(value)) return;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (value.includes("/") && !fine) return;
  b.textContent = value;
  b.style.animation = "none";
  void b.offsetWidth;
  b.style.animation = "";
  side();
}

export function initBotFx() {
  const node = bot();
  if (!node) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  const look = (x, y) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = node.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height * 0.35);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 220);
      node.style.setProperty("--ex", ((dx / d) * k).toFixed(2));
      node.style.setProperty("--ey", ((dy / d) * k).toFixed(2));
    });
  };
  if (!reduce) {
    document.addEventListener("pointermove", (e) => look(e.clientX, e.clientY), { passive: true });
    document.addEventListener("pointerdown", (e) => look(e.clientX, e.clientY), { passive: true });
  }
  node.addEventListener("pointerup", () => setTimeout(side, 60));
  window.addEventListener("resize", side);
  side();
  const tick = () => {
    if (document.hidden || node.classList.contains("is-open") || node.classList.contains("is-dragging")) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const tips = MESSAGES.filter((tip) => fine || !tip.includes("/"));
    idx = (idx + 1) % tips.length;
    sayBot(tips[idx]);
  };
  timer = window.setInterval(tick, 9000);
  document.addEventListener("visibilitychange", side);
  return () => window.clearInterval(timer);
}
