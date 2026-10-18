/* Py, the lab bot: customisation, mannerisms, hints and quick actions. Stored on this device only. */
import { readStore, writeStore, esc } from "./util.js";
import { sayBot, setIntro } from "./botfx.js";
import { sound } from "./fx.js";
import { reduced } from "./prefs.js";

const KEY = "pythonlab.py.v1";
export const COLORS = {
  blue: ["#6bb0e6", "#2f6aa3"],
  pink: ["#ff8fc3", "#d63384"],
  green: ["#6ee7b7", "#059669"],
  purple: ["#c4b5fd", "#7c3aed"],
  orange: ["#fdba74", "#ea580c"],
  gold: ["#fde68a", "#d97706"],
};
export const SKINS = {
  robot: "Robot",
  monkey: "Zodiac Monkey",
  cat: "Cat",
  wizard: "Wizard",
  astronaut: "Astronaut",
  royal: "Royal",
};
export const SIZES = { s: ["Small", 0.92], m: ["Medium", 1.18], l: ["Large", 1.45], xl: ["Huge", 1.72] };
const DEF = { color: "blue", skin: "robot", name: "Py", size: "m", voice: false };
export const py = () => {
  const p = { ...DEF, ...readStore(KEY, {}) };
  if (!COLORS[p.color]) p.color = "blue";
  if (!SKINS[p.skin]) p.skin = "robot";
  if (!SIZES[p.size]) p.size = "m";
  p.name = String(p.name || "Py").slice(0, 14) || "Py";
  return p;
};
const bot = () => document.getElementById("lab-bot");

const SKIN_SVG = {
  robot: "",
  monkey: '<circle cx="10" cy="34" r="9.5" fill="#8b5a2b" stroke="#f4b942" stroke-width="2"/><circle cx="10" cy="34" r="5.5" fill="#fbd3a7"/><circle cx="78" cy="34" r="9.5" fill="#8b5a2b" stroke="#f4b942" stroke-width="2"/><circle cx="78" cy="34" r="5.5" fill="#fbd3a7"/><polygon points="28,17 33,5 39,13 44,2 49,13 55,5 60,17" fill="#ffd54f" stroke="#b48a00" stroke-width="1.5"/><circle cx="44" cy="2" r="2.6" fill="#22d3ee"/>',
  cat: '<path d="M16 24L19 4L35 18Z" fill="#ff8fc3" stroke="#1e3a5f" stroke-width="2" stroke-linejoin="round"/><path d="M72 24L69 4L53 18Z" fill="#ff8fc3" stroke="#1e3a5f" stroke-width="2" stroke-linejoin="round"/><g stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M20 46l-12-2M20 49l-12 3M68 46l12-2M68 49l12 3"/></g><path d="M41 42l3 3 3-3z" fill="#ff5da2"/>',
  wizard: '<path d="M24 20L46 -16L66 20Z" fill="#6d28d9" stroke="#1e3a5f" stroke-width="2" stroke-linejoin="round"/><rect x="18" y="16" width="52" height="7" rx="3.5" fill="#4c1d95" stroke="#1e3a5f" stroke-width="2"/><path d="M46 -2l2 5 5 .5-4 3.5 1.3 5-4.3-2.8-4.3 2.8 1.3-5-4-3.5 5-.5z" fill="#ffd43b"/>',
  astronaut: '<circle cx="44" cy="37" r="35" fill="rgba(180,230,255,.22)" stroke="#fff" stroke-width="3"/><path d="M20 22q10-12 26-12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>',
  royal: '<path d="M22 20L24 4L34 12L44 0L54 12L64 4L66 20Z" fill="#ffd43b" stroke="#b48a00" stroke-width="2" stroke-linejoin="round"/><circle cx="44" cy="6" r="2.6" fill="#ff5da2"/><circle cx="26" cy="7" r="2" fill="#22d3ee"/><circle cx="62" cy="7" r="2" fill="#34d399"/>',
};

function apply() {
  const p = py(); const node = bot(); if (!node) return p;
  const [a, b] = COLORS[p.color]; const rs = document.documentElement.style;
  rs.setProperty("--py-a", a); rs.setProperty("--py-b", b); rs.setProperty("--py-s", String(SIZES[p.size][1]));
  node.dataset.skin = p.skin; node.dataset.size = p.size;
  const svg = node.querySelector(".bot-svg"); let g = svg.querySelector(".py-skin");
  if (!g) { g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "py-skin"); svg.appendChild(g); }
  g.innerHTML = SKIN_SVG[p.skin];
  setIntro(`Hi, I am ${p.name}, the lab bot. Tap me!`); { const b = document.getElementById("bot-bubble"); if (b && b.textContent.startsWith("Hi, I am")) b.textContent = `Hi, I am ${p.name}, the lab bot. Tap me!`; }
  node.setAttribute("aria-label", `${p.name}, the lab bot. Tap or press Enter to open the helper. Drag to move it. Arrow keys nudge it.`);
  return p;
}
export function setPy(patch) {
  const next = { ...py(), ...patch }; writeStore(KEY, next); apply();
  document.dispatchEvent(new CustomEvent("lab:py", { detail: next }));
  window.dispatchEvent(new Event("resize"));
}

/* mannerisms: idle (default CSS), wave, celebrate, think, hint */
let actTimer = 0;
export function act(name, ms = 1400) {
  const node = bot(); if (!node || reduced()) { if (node) { node.dataset.mood = name; clearTimeout(actTimer); actTimer = setTimeout(() => delete node.dataset.mood, ms); } return; }
  ["wave", "celebrate", "think", "hint"].forEach((n) => node.classList.remove("py-" + n));
  void node.offsetWidth; node.classList.add("py-" + name); node.dataset.mood = name;
  clearTimeout(actTimer); actTimer = setTimeout(() => { node.classList.remove("py-" + name); delete node.dataset.mood; }, ms);
}
export function speak(text) {
  if (!py().voice || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; u.pitch = 1.3; speechSynthesis.speak(u); } catch (e) { /* voice is optional */ }
}
export function say(text, mood) { sayBot(text); if (mood) act(mood); speak(text); }

const HINTS = {
  lesson: "Run the code, then change one value and run it again. Small experiments teach fastest.",
  games: "Pick any game. Every win earns XP and some earn badges.",
  blocks: "Tap a block in the palette to add it, or drag it in. Repeat blocks hold other blocks inside.",
  turtle: "Try forward(100) then right(90) four times. Or press a preset and read the code it made.",
  loops: "Press Step and watch the variables change. Then type what the loop prints at the end.",
  lists: "Read the target list first, then pick the operations that turn the start list into it.",
  order: "Find the line that starts things (def, or a variable) and put it first. Indented lines come after their header.",
  pong: "Aim for the edge of the paddle to send the ball at an angle that Py cannot reach.",
  snake: "Use the arrow keys or swipe. Eat 8 to earn a badge.",
  guess: "Halve the range each time: always guess the middle.",
  level: "Open the lessons in order, then take the quiz. Passing earns XP.",
  downloads: "PDFs print well. Plain text works with screen readers.",
  slides: "Arrow keys or swipe to move. Press F for full screen.",
  me: "Your XP and badges live only on this device. Earn more by playing games and finishing lessons.",
  "": "Tap Take a tour in the Display menu any time. Or pick a level below.",
};
export function hint() {
  const h = location.hash.replace(/^#\/?/, "").split("/"); const key = h[0] === "games" && h[1] ? h[1] : h[0] === "lesson" ? "lesson" : h[0] || "";
  const t = HINTS[key] || HINTS[h[0]] || HINTS[""]; say(t, "hint"); document.dispatchEvent(new CustomEvent("lab:hint", { detail: t })); return t;
}

/* quick actions shown as tappable chips in the panel */
export function quickActions(sections) {
  const f = sections.find((s) => s.id === "fundamentals")?.href || "#/section/fundamentals";
  return [
    { id: "l1", label: "Level 1", icon: "🌱", href: "#/level/1" }, { id: "l2", label: "Level 2", icon: "🚀", href: "#/level/2" }, { id: "l3", label: "Level 3", icon: "🔥", href: "#/level/3" },
    { id: "fd", label: "Foundations", icon: "🧱", href: f }, { id: "au", label: "Audio", icon: "🔊", act: "audio" }, { id: "vi", label: "Video", icon: "🎬", act: "video" },
    { id: "dl", label: "Downloads", icon: "⬇️", href: "#/downloads" }, { id: "gm", label: "Games", icon: "🎮", href: "#/games" }, { id: "hi", label: "Hints", icon: "💡", act: "hint" },
  ];
}
export function runAction(a) {
  if (a === "hint") return hint();
  if (a === "video") { const go = () => document.querySelector(".clips")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); if (location.hash === "#/" || location.hash === "") go(); else { location.hash = "#/"; setTimeout(go, 500); } say("Here are the short clips and visual explainers.", "wave"); return; }
  if (a === "audio") {
    const audioSec = document.getElementById("audio-lessons");
    const read = () => { const b = document.querySelector("[data-speech]"); if (b) { b.click(); say("Reading this page aloud. Tap Stop to end.", "wave"); return true; } return false; };
    if (read()) return;
    if (audioSec) { audioSec.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); say("Here are the offline audio lessons.", "wave"); return; }
    const lesson = document.querySelector('a[href^="#/lesson/"]')?.getAttribute("href") || "#/lesson/start/how-the-lab-works"; location.hash = lesson; setTimeout(() => { if (!read()) say("Open any lesson and press Read aloud.", "think"); }, 700);
  }
}

export function pyControls() {
  const p = py();
  const sw = Object.entries(COLORS).map(([k, [a, b]]) => `<button type="button" class="py-sw${p.color === k ? " on" : ""}" data-py-color="${k}" aria-label="Colour ${k}" aria-pressed="${p.color === k}" style="background:linear-gradient(${a},${b})"></button>`).join("");
  const sk = Object.entries(SKINS).map(([k, l]) => `<button type="button" class="bp-chip py-opt${p.skin === k ? " on" : ""}" data-py-skin="${k}" aria-pressed="${p.skin === k}">${l}</button>`).join("");
  const sz = Object.entries(SIZES).map(([k, [l]]) => `<button type="button" class="bp-chip py-opt${p.size === k ? " on" : ""}" data-py-size="${k}" aria-pressed="${p.size === k}">${l}</button>`).join("");
  const mo = ["wave", "celebrate", "think", "hint"].map((m) => `<button type="button" class="bp-chip" data-py-act="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join("");
  return `<details class="py-custom"><summary>Customise ${esc(p.name)}</summary>
    <label class="py-row">Character name <input id="py-name" maxlength="14" value="${esc(p.name)}" autocomplete="off" spellcheck="false" aria-label="Character name"></label>
    <p class="bp-sub">Colour</p><div class="py-swatches">${sw}</div>
    <p class="bp-sub">Character</p><div class="bp-chips">${sk}</div>
    <p class="bp-sub">Size</p><div class="bp-chips">${sz}</div>
    <p class="bp-sub">Voice and sound</p>
    <label class="py-row"><input type="checkbox" id="py-voice" ${p.voice ? "checked" : ""}> ${esc(p.name)} speaks (browser voice)</label>
    <label class="py-row"><input type="checkbox" id="py-sound" ${document.documentElement.dataset.sound === "on" ? "checked" : ""}> Sound effects</label>
    <p class="bp-sub">Moves</p><div class="bp-chips">${mo}</div></details>`;
}

export function bindPyPanel(panelEl, rerender) {
  panelEl.addEventListener("click", (e) => {
    const t = e.target.closest("[data-py-color],[data-py-skin],[data-py-size],[data-py-act],[data-qa]"); if (!t) return;
    if (t.dataset.pyColor) { setPy({ color: t.dataset.pyColor }); act("celebrate", 900); rerender(true); }
    else if (t.dataset.pySkin) { setPy({ skin: t.dataset.pySkin }); act("wave"); rerender(true); }
    else if (t.dataset.pySize) { setPy({ size: t.dataset.pySize }); rerender(true); }
    else if (t.dataset.pyAct) { act(t.dataset.pyAct, 1800); if (t.dataset.pyAct === "hint") hint(); sound("pop"); }
    else if (t.dataset.qa) runAction(t.dataset.qa);
  });
  panelEl.addEventListener("input", (e) => { if (e.target.id === "py-name") { setPy({ name: e.target.value.trim() || "Py" }); const s = panelEl.querySelector(".py-custom summary"); if (s) s.textContent = `Customise ${py().name}`; const h = panelEl.querySelector("#bot-panel-title"); if (h) h.textContent = `I am ${py().name}, the lab bot.`; } });
  panelEl.addEventListener("change", async (e) => {
    if (e.target.id === "py-voice") { setPy({ voice: e.target.checked }); if (e.target.checked) speak(`Hi, I am ${py().name}. I will read my tips aloud.`); else if ("speechSynthesis" in window) speechSynthesis.cancel(); }
    if (e.target.id === "py-sound") { const { setPref } = await import("./prefs.js"); setPref("sound", e.target.checked); if (e.target.checked) sound("win"); }
  });
}

export function initPy() {
  apply();
  const node = bot(); if (!node) return;
  const aura = document.createElement("i"); aura.className = "py-aura"; aura.setAttribute("aria-hidden", "true");
  const sp = document.createElement("div"); sp.className = "py-sparks"; sp.setAttribute("aria-hidden", "true"); sp.innerHTML = "<b>✦</b><b>✧</b><b>✦</b><b>✧</b>";
  node.querySelector(".bot-stage").prepend(aura); node.querySelector(".bot-stage").append(sp);
  document.addEventListener("lab:win", () => { act("celebrate", 2200); say(`${py().name} says: great job!`); });
  document.addEventListener("lab:levelup", (e) => { act("celebrate", 3000); say(`Level ${e.detail.level}! Amazing!`); });
  document.addEventListener("lab:badge", () => act("celebrate", 2200));
  window.addEventListener("hashchange", () => { if (!node.classList.contains("is-open")) act("wave", 900); });
  setInterval(() => { if (document.hidden || node.classList.contains("is-open") || node.classList.contains("is-dragging")) return; act(["wave", "think", "hint"][Math.floor(Math.random() * 3)], 1600); }, 16000);
}
