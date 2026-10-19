/* Visual life: animated world background, particles, parallax, ripples, confetti, level-up, sound.
   Everything is same-origin. canvas-confetti (ISC) is vendored in vendor/confetti.browser.min.js and loaded lazily.
   Quality tier (see prefs.js): "high" full, "low" light, "off" still. prefers-reduced-motion forces "off". */
import { tier, prefs, reduced } from "./prefs.js";
import { esc } from "./util.js";

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "white";
let canvas;
let ctx;
let parts = [];
let raf = 0;
let last = 0;
let W = 0;
let H = 0;

/* ---------- sound (default off) ---------- */
let audio = null;
function tone(freq, dur = 0.12, type = "sine", delay = 0, vol = 0.05) {
  if (!prefs().sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const t0 = audio.currentTime + delay;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audio.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (err) { /* sound is optional */ }
}
export function sound(name) {
  if (name === "tap") tone(660, 0.06, "triangle");
  else if (name === "win") [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", i * 0.09));
  else if (name === "level") [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, "square", i * 0.08, 0.035));
  else if (name === "bad") tone(180, 0.18, "sawtooth", 0, 0.04);
  else if (name === "pop") tone(880, 0.05, "sine");
}

/* ---------- confetti (vendored canvas-confetti) ---------- */
let confettiReady = null;
function loadConfetti() {
  if (window.confetti) return Promise.resolve(window.confetti);
  if (confettiReady) return confettiReady;
  confettiReady = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = new URL("../vendor/confetti.browser.min.js", import.meta.url).href;
    s.onload = () => resolve(window.confetti);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return confettiReady;
}
export async function confetti(power = 1, origin = { x: 0.5, y: 0.35 }) {
  sound("win");
  const t = tier();
  if (t === "off") return false;
  const c = await loadConfetti();
  if (!c) return false;
  const colors = [css("--brand-pink"), css("--brand-gold"), css("--brand-teal")];
  const footer = document.querySelector("#site-footer");
  const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
  if (footerTop < window.innerHeight * 0.72) return true;
  const safeOrigin = { x: origin.x, y: Math.min(origin.y, 0.42) };
  const n = Math.round((t === "high" ? 80 : 36) * power);
  c({ particleCount: n, spread: 70, startVelocity: 28, origin: safeOrigin, colors, useWorker: false, disableForReducedMotion: true, zIndex: 70 });
  return true;
}

/* ---------- level-up and toast ---------- */
let lvTimer = 0;
export function levelUp(level) {
  sound("level");
  document.getElementById("levelup")?.remove();
  const el = document.createElement("div");
  el.id = "levelup";
  el.className = "levelup";
  el.setAttribute("role", "status");
  el.innerHTML = `<div class="lu-card"><div class="lu-ring" aria-hidden="true"><span>${level}</span></div>
    <p class="lu-title">Level up!</p><p class="lu-sub">You reached level ${level}. Keep going!</p></div>`;
  document.body.appendChild(el);
  confetti(1.2, { x: 0.5, y: 0.45 });
  clearTimeout(lvTimer);
  lvTimer = setTimeout(() => el.remove(), 3200);
  el.addEventListener("click", () => el.remove());
}
export function toast(html, ms = 4200) {
  let box = document.getElementById("fx-toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "fx-toasts";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const t = document.createElement("div");
  t.className = "fx-toast toast";
  t.innerHTML = `<span class="toast-ico" aria-hidden="true">★</span><div class="toast-copy">${html}</div><button type="button" class="toast-x" aria-label="Close">×</button>`;
  t.querySelector(".toast-x")?.addEventListener("click", () => t.remove());
  box.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

/* ---------- particles ---------- */
function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seed();
}
let onScreen = true;
function motionOff() {
  return tier() === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.fx === "off";
}
function seed() {
  const t = tier();
  const mobile = window.matchMedia("(max-width: 899px)").matches;
  const base = t === "high" ? 64 : t === "low" ? 22 : 0;
  let n = Math.round(base * Math.min(1, (W * H) / (1280 * 720)) + (base ? 10 : 0));
  if (mobile) n = Math.min(n, 40);
  if (motionOff()) n = 0;
  const cols = [css("--brand-pink"), css("--brand-gold"), css("--brand-teal")];
  parts = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: 1.2 + Math.random() * 3.2, vx: (Math.random() - 0.5) * 0.18, vy: -0.08 - Math.random() * 0.3,
    c: cols[Math.floor(Math.random() * cols.length)], p: Math.random() * Math.PI * 2,
  }));
}
function frame(now) {
  if (document.hidden || motionOff() || !onScreen) {
    stopParticles();
    return;
  }
  raf = requestAnimationFrame(frame);
  const t = tier();
  if (t === "off") return stopParticles();
  if (t === "low" && now - last < 50) return;
  last = now;
  ctx.clearRect(0, 0, W, H);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.p += 0.02;
    if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
    if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
    const a = 0.35 + 0.35 * Math.sin(p.p);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.c;
    ctx.shadowColor = p.c;
    ctx.shadowBlur = t === "high" ? 12 : 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function stopParticles() {
  cancelAnimationFrame(raf);
  raf = 0;
  ctx && ctx.clearRect(0, 0, W, H);
}
function startParticles() {
  if (raf || motionOff() || document.hidden || !onScreen) return;
  resize();
  raf = requestAnimationFrame(frame);
}

/* ---------- ripples ---------- */
const RIPPLE = ".primary, .text-btn, .menu-card, .sec-tile, .lesson-row, .bp-go, .bp-chip, .theme-btn, .tb-btn, .bar-btn, .fx-btn, .game-card, .level-card, .fb-item";
function ripple(e) {
  if (tier() === "off") return;
  const host = e.target.closest(RIPPLE);
  if (!host || host.disabled) return;
  const r = host.getBoundingClientRect();
  const s = document.createElement("span");
  const size = Math.max(r.width, r.height) * 1.6;
  s.className = "fx-ripple";
  s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  host.classList.add("fx-host");
  host.appendChild(s);
  setTimeout(() => s.remove(), 700);
  sound("tap");
}

/* ---------- parallax ---------- */
function bindParallax() {
  const root = document.documentElement;
  let pending = false;
  const set = (x, y) => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { root.style.setProperty("--px", x.toFixed(3)); root.style.setProperty("--py", y.toFixed(3)); pending = false; });
  };
  window.addEventListener("pointermove", (e) => { if (tier() === "high") set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5); }, { passive: true });
  window.addEventListener("scroll", () => { if (tier() !== "off") root.style.setProperty("--sy", String(Math.min(1, window.scrollY / 1200))); }, { passive: true });
}

export function initFx() {
  const bg = document.createElement("div");
  bg.id = "fx-bg";
  bg.setAttribute("aria-hidden", "true");
  bg.innerHTML = '<i class="fx-blob b1"></i><i class="fx-blob b2"></i><i class="fx-blob b3"></i><i class="fx-grid"></i>';
  canvas = document.createElement("canvas");
  canvas.id = "fx-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  document.body.prepend(bg);
  ctx = canvas.getContext("2d");
  const seen = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    if (!onScreen) stopParticles();
    else if (!raf) startParticles();
  });
  seen.observe(canvas);
  startParticles();
  window.addEventListener("resize", () => { if (raf) resize(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopParticles();
    else if (!raf) startParticles();
  });
  document.addEventListener("lab:prefs", () => { if (tier() === "off") stopParticles(); else if (!raf) startParticles(); else seed(); });
  document.addEventListener("lab:world", () => seed());
  document.addEventListener("pointerdown", ripple, { passive: true });
  bindParallax();
  document.addEventListener("lab:win", () => confetti(1));
  document.addEventListener("lab:levelup", (e) => levelUp(e.detail.level));
  document.addEventListener("lab:badge", (e) => { toast(`<b>${e.detail.icon} Badge: ${esc(e.detail.title)}</b><span>${esc(e.detail.desc)}</span>`, 5200); sound("win"); });
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", () => document.dispatchEvent(new CustomEvent("lab:prefs")));
  return { reduced: reduced() };
}
