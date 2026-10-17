/* Quality tiers: off | flat | light | full. See the v2 blueprint 06_STUDIO_3D.md.
   off   : static poster only (reduced motion, Save-Data, user choice)
   flat  : CSS parallax layers, no WebGL
   light : WebGL, DPR cap 1.5, 30 fps cap
   full  : WebGL, DPR cap 2, 60 fps cap, aurora backdrop, more particles */
import { readStore, writeStore } from "../util.js";

export const TIERS = ["off", "flat", "light", "full"];
export const CHOICES = ["auto", ...TIERS];
const KEY = "pythonlab.quality.v1";
const PROBE_KEY = "pythonlab.probe.v1";

export const budget = {
  off: { fps: 0, dpr: 1 },
  flat: { fps: 0, dpr: 1 },
  light: { fps: 30, dpr: 1.5 },
  full: { fps: 60, dpr: 2 },
};

export function getChoice() {
  const q = new URLSearchParams(location.search).get("quality");
  if (CHOICES.includes(q)) return q;
  const saved = readStore(KEY, { choice: "auto" }).choice;
  return CHOICES.includes(saved) ? saved : "auto";
}
export function setChoice(choice) {
  if (CHOICES.includes(choice)) writeStore(KEY, { choice });
  window.dispatchEvent(new CustomEvent("studio:quality"));
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isPhone = () => window.matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 700;

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (err) {
    return false;
  }
}

/* Raw-WebGL probe, no three.js needed: draw 20 frames of a fill-rate heavy shader on a
   small canvas and measure the mean frame time (readPixels forces the GPU to finish). */
export function probe() {
  const cached = readProbe();
  if (cached) return cached;
  let ms = 999;
  try {
    const c = document.createElement("canvas");
    c.width = 192; c.height = 192;
    const gl = c.getContext("webgl", { antialias: false, powerPreference: "high-performance" });
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, "precision mediump float;uniform float t;void main(){vec2 u=gl_FragCoord.xy/192.;float v=0.;for(int i=0;i<24;i++){v+=sin(u.x*float(i)+t)*cos(u.y*float(i)-t);}gl_FragColor=vec4(vec3(v*.02+.5),1.);}"));
    gl.linkProgram(p); gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const px = new Uint8Array(4);
    const t0 = performance.now();
    for (let i = 0; i < 20; i += 1) {
      gl.uniform1f(gl.getUniformLocation(p, "t"), i * 0.1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    }
    ms = (performance.now() - t0) / 20;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch (err) {
    ms = 999;
  }
  try { sessionStorage.setItem(PROBE_KEY, JSON.stringify({ ms })); } catch (err) { /* ignore */ }
  return { ms };
}
function readProbe() {
  try { return JSON.parse(sessionStorage.getItem(PROBE_KEY) || "null"); } catch (err) { return null; }
}

/* Returns { tier, reason } for the current device and the user's choice. */
export function resolveTier() {
  const choice = getChoice();
  if (choice !== "auto") {
    if ((choice === "light" || choice === "full") && !hasWebGL()) return { tier: "flat", reason: "WebGL is not available, so the flat tier is used", choice };
    return { tier: choice, reason: "chosen in Display", choice };
  }
  if (reducedMotion()) return { tier: "off", reason: "reduced motion is on", choice };
  if (navigator.connection?.saveData) return { tier: "off", reason: "Save-Data is on", choice };
  if (!hasWebGL()) return { tier: "flat", reason: "no WebGL", choice };
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (cores <= 2 || mem <= 1) return { tier: "flat", reason: "low-end device", choice };
  const { ms } = probe();
  const phone = isPhone();
  let tier = ms <= 6 ? "full" : ms <= 16 ? "light" : "flat";
  if (phone && tier === "full") tier = "light";
  return { tier, reason: `probe ${ms.toFixed(1)} ms per frame${phone ? " (phone: capped at light)" : ""}`, choice, probeMs: ms };
}
