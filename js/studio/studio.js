/* Studio shell: one lazy WebGL scene per host element, with four quality tiers.
   Content pages stay plain HTML. The scene is decorative (aria-hidden) and has a text equivalent. */
import { esc } from "../util.js";
import { posters } from "./posters.js";
import { budget, resolveTier, getChoice, setChoice, CHOICES, reducedMotion } from "./tiers.js";

const THREE_URL = new URL("../../vendor/three/three.subset.min.js", import.meta.url).href;
let threePromise = null;
let current = null;

/* Test and debug hook: read-only numbers about the running scene. */
export const stats = { tier: "none", reason: "", scene: "", threeLoaded: false, frames: 0, canvases: 0, drawCalls: 0, triangles: 0, loadMs: 0, avgFrameMs: 0, fps: 0, worstFrameMs: 0 };
if (typeof window !== "undefined") window.__labStudio = stats;

export function studioMarkup({ scene, accent, n = null, title = "", alt = "", compact = false }) {
  const poster = posters[scene] || posters.fallback;
  return `<div class="studio${compact ? " studio-compact" : ""}" data-studio data-scene="${esc(scene)}" data-accent="${esc(accent)}" data-n="${n ?? ""}" style="--acc:${esc(accent)}">
    <div class="studio-poster">${poster}</div>
    <canvas class="studio-canvas" aria-hidden="true" hidden></canvas>
    <div class="studio-glow" aria-hidden="true"></div>
    <div class="studio-badge" aria-live="polite"><span class="sb-dot" aria-hidden="true"></span><span class="sb-text">3D: starting</span></div>
    ${title ? `<p class="studio-title" aria-hidden="true">${esc(title)}</p>` : ""}
    <p class="visually-hidden">${esc(alt)}</p>
  </div>`;
}

function loadThree() {
  if (!threePromise) {
    const t0 = performance.now();
    threePromise = import(THREE_URL).then((m) => { stats.threeLoaded = true; stats.loadMs = Math.round(performance.now() - t0); return m; });
    threePromise.catch(() => { threePromise = null; });
  }
  return threePromise;
}

function setBadge(host, tier, reason) {
  const t = host.querySelector(".sb-text");
  if (t) t.textContent = `3D: ${tier}`;
  host.querySelector(".studio-badge")?.setAttribute("title", `Visual quality ${tier}: ${reason}. Change it in Display.`);
  host.dataset.tier = tier;
}

/* ---------- flat tier: CSS parallax layers (no WebGL) ---------- */
function startFlat(host) {
  if (reducedMotion()) return () => {};
  let raf = 0; let px = 0; let py = 0;
  const apply = () => { raf = 0; host.style.setProperty("--px", px.toFixed(3)); host.style.setProperty("--py", py.toFixed(3)); };
  const move = (e) => {
    const r = host.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width - 0.5) * 2; py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(apply);
  };
  const leave = () => { px = 0; py = 0; if (!raf) raf = requestAnimationFrame(apply); };
  host.addEventListener("pointermove", move); host.addEventListener("pointerleave", leave);
  return () => { host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
}

/* ---------- WebGL tiers ---------- */
async function startGL(host, tier) {
  let canvas = host.querySelector(".studio-canvas");
  const fresh = canvas.cloneNode(false); canvas.replaceWith(fresh); canvas = fresh; // a lost context cannot be reused
  const [T, sceneMod] = await Promise.all([loadThree(), import(`./scenes/${host.dataset.scene}.js`)]);
  if (!host.isConnected) return () => {};
  const full = tier === "full";
  const b = budget[tier];
  const renderer = new T.WebGLRenderer({ canvas, antialias: full, alpha: false, powerPreference: "low-power" });
  stats.canvases = document.querySelectorAll("canvas.studio-canvas:not([hidden])").length + 1;
  const size = () => {
    const w = host.clientWidth || 600; const h = host.clientHeight || 340;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, b.dpr));
    renderer.setSize(w, h, false);
    return w / h;
  };
  const aspect = size();
  const built = sceneMod.default(T, { accent: host.dataset.accent, q: full ? 1 : 0.5, full, aspect, n: Number(host.dataset.n) || 0 });
  canvas.hidden = false; host.classList.add("is-gl");
  let visible = true; let raf = 0; let last = 0; let t = 0; let alive = true;
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: 0.01 });
  io.observe(host);
  const ro = new ResizeObserver(() => { built.camera.aspect = size(); built.camera.updateProjectionMatrix(); });
  ro.observe(host);
  let px = 0; let py = 0;
  const input = { px: 0, py: 0, pulse: 0, taps: 0 };
  const onMove = (e) => { const r = host.getBoundingClientRect(); px = ((e.clientX - r.left) / r.width - 0.5) * 2; py = -((e.clientY - r.top) / r.height - 0.5) * 2; input.px = px; input.py = py; };
  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    input.pulse = 1;
    input.taps += 1;
  };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerdown", onDown);
  const frameTimes = [];
  const minGap = 1000 / b.fps - 2;
  const loop = (now) => {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    raf = requestAnimationFrame(loop);
    if (now - last < minGap) return;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
    const gap = now - last; last = now; t += dt;
    const w0 = performance.now();
    built.update(t, dt, px, py, input);
    input.pulse = Math.max(0, input.pulse - dt);
    renderer.render(built.scene, built.camera);
    const cost = performance.now() - w0;
    stats.frames += 1; stats.drawCalls = renderer.info.render.calls; stats.triangles = renderer.info.render.triangles;
    if (stats.frames > 3 && gap < 500) {
      frameTimes.push(gap); if (frameTimes.length > 120) frameTimes.shift();
      const avg = frameTimes.reduce((a, c) => a + c, 0) / frameTimes.length;
      stats.avgFrameMs = +avg.toFixed(1); stats.fps = +(1000 / avg).toFixed(1); stats.cpuMs = +cost.toFixed(2);
      stats.worstFrameMs = +Math.max(...frameTimes).toFixed(1);
    }
  };
  const kick = () => { if (!raf && alive && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  const vis = () => { if (!document.hidden) kick(); };
  document.addEventListener("visibilitychange", vis);
  kick();
  return () => {
    alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
    host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerdown", onDown); document.removeEventListener("visibilitychange", vis);
    built.scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => { mm.map?.dispose?.(); mm.dispose?.(); }); });
    renderer.dispose(); renderer.forceContextLoss(); canvas.hidden = true; host.classList.remove("is-gl");
  };
}

export function disposeStudio() {
  if (current) { try { current(); } catch (err) { /* already gone */ } current = null; }
  stats.tier = "none"; stats.canvases = 0;
}

/* Mount the studio found inside `root` (if any). Only one scene runs at a time. */
export async function mountStudio(root = document) {
  disposeStudio();
  const host = root.querySelector("[data-studio]");
  if (!host) return;
  let { tier, reason } = resolveTier();
  host.classList.remove("is-flat", "is-gl");
  host.dataset.tier = tier; stats.tier = tier; stats.reason = reason; stats.scene = host.dataset.scene;
  setBadge(host, tier, reason);
  if (tier === "off") return;
  if (tier === "flat") { host.classList.add("is-flat"); current = startFlat(host); return; }
  try {
    const stop = await startGL(host, tier);
    if (!host.isConnected) { stop(); return; }
    current = stop;
  } catch (err) {
    console.warn("3D scene unavailable, using the flat tier:", err && err.message);
    tier = "flat"; reason = "the 3D scene failed to start";
    stats.tier = tier; stats.reason = reason; setBadge(host, tier, reason);
    host.classList.add("is-flat"); current = startFlat(host);
  }
}

/* Display menu: quality choice. Added by script so the menu markup stays small. */
export function initQualityControl() {
  const pop = document.querySelector(".display-pop");
  if (!pop || pop.querySelector(".quality")) return;
  const labels = { auto: "Auto", off: "Off (still)", flat: "Flat (CSS)", light: "Light 3D", full: "Full 3D" };
  const wrap = document.createElement("div");
  wrap.className = "quality"; wrap.setAttribute("role", "group"); wrap.setAttribute("aria-label", "3D visual quality");
  wrap.innerHTML = `<p class="quality-h">3D quality</p>${CHOICES.map((c) => `<button type="button" class="theme-btn" data-quality="${c}" aria-pressed="false">${labels[c]}</button>`).join("")}<p class="quality-note">Auto picks from your device. Reduced motion always shows a still picture.</p>`;
  pop.insertBefore(wrap, pop.querySelector("#bot-reset"));
  const sync = () => wrap.querySelectorAll("[data-quality]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.quality === getChoice())));
  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-quality]"); if (!b) return;
    setChoice(b.dataset.quality); sync();
  });
  window.addEventListener("studio:quality", () => { sync(); mountStudio(document); });
  sync();
}
