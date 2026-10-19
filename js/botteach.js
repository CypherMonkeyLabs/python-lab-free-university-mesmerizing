/* Py as a teacher: hint ladder, Socratic prompts, reactions. Rule-based, offline, no AI service. */
import { esc, readStore, writeStore } from "./util.js";
import { hints, socratic } from "./content/bot-hints.js";
import { lessonRef } from "./content/catalog.js";
import { sayBot } from "./botfx.js";

const KEY = "pythonlab.hints.v1";
const bot = () => document.getElementById("lab-bot");
const state = { fails: 0, key: "", started: 0 };

export function lessonKeyFor(hash = location.hash) {
  const m = hash.match(/^#\/lesson\/([a-z]+)\/([a-z-]+)/);
  return m ? `${m[1]}/${m[2]}` : "";
}

function ladder(key) {
  const [t, l] = key.split("/");
  const found = lessonRef(t, l);
  if (!found) return null;
  const ex = found.lesson.exercise;
  const own = hints[key];
  if (own) return { title: found.lesson.title, ex, own: true, ...own };
  if (!ex) return { title: found.lesson.title, ex: null, own: false };
  return {
    title: found.lesson.title, ex, own: false,
    nudge: "Say the job in one sentence: what goes in, and what must come out?",
    hint: "Re-read the lesson section above the exercise; the idea is in there. Then open the sources list at the bottom of the page.", link: ["Sources in this lab", "#/sources"],
    approach: ["Write down one example input and the output you want.", "Edit the starter so that example works.", "Run the checks and read the first failing line."],
    example: null,
  };
}

const rungs = [["Nudge", "nudge"], ["Hint", "hint"], ["Approach", "approach"], ["A similar problem", "example"]];

function labHref(href) {
  const value = String(href || "");
  if (value.startsWith("#/") || value.startsWith("/") || value.startsWith("./")) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const ok = host === "cyphermonkeylabs.com"
      || (host === "linktr.ee" && url.pathname.replace(/\/$/, "") === "/CypherMonkey")
      || (host === "github.com" && url.pathname.startsWith("/CypherMonkeyLabs"));
    if (ok) return value;
  } catch (err) {
    return "#/sources";
  }
  return "#/sources";
}

export function teachHtml() {
  const key = lessonKeyFor();
  const sock = socratic[Math.floor(Date.now() / 60000) % socratic.length];
  if (!key) {
    return `<div class="bp-teach"><p class="bp-sub">Learn with me</p>
      <p class="bp-line">Open a lesson and I will have a hint ladder for its exercise. Until then, a question to think about:</p>
      <p class="bp-socratic">${esc(sock)}</p></div>`;
  }
  const L = ladder(key);
  if (!L) return "";
  const saved = readStore(KEY, {})[key] || 0;
  const body = L.ex ? rungs.slice(0, saved).map(([name, k]) => {
    let v = L[k];
    if (!v) return "";
    if (k === "approach") v = `<ol>${v.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
    else if (k === "example") v = `<pre class="bp-code"><code>${esc(v)}</code></pre><p class="bp-note">This solves a different problem. Adapt the idea.</p>`;
    else v = `<p>${esc(v)}</p>`;
    const link = k === "hint" && L.link ? `<p><a href="${esc(labHref(L.link[1]))}">${esc(L.link[0])}</a></p>` : "";
    return `<div class="bp-rung"><b>${name}</b>${v}${link}</div>`;
  }).join("") : "";
  const more = L.ex && saved < 4 ? `<button type="button" class="bp-go bp-primary" id="bp-rung"><b>${saved ? "Next rung" : "Give me a nudge"}</b><span>Rung ${saved + 1} of 4: ${rungs[saved][0]}</span></button>` : "";
  const note = L.ex ? (L.own ? "" : `<p class="bp-note">This exercise uses my generic ladder. A hand-written one is not ready yet.</p>`)
    : `<p class="bp-line">This lesson has no exercise. Try this instead:</p>`;
  return `<div class="bp-teach"><p class="bp-sub">Hint ladder: ${esc(L.title)}</p>${note}${body}${more}
    <p class="bp-sub">Think it through</p><p class="bp-socratic">${esc(sock)}</p>
    <p class="bp-note">I do not keep a stored solution: the ladder ends at a worked example of a similar problem. I can be wrong; check the docs links.</p></div>`;
}

export function bindTeach(panel, rerender) {
  panel.addEventListener("click", (e) => {
    if (!e.target.closest("#bp-rung")) return;
    const key = lessonKeyFor(); if (!key) return;
    const all = readStore(KEY, {}); all[key] = Math.min(4, (all[key] || 0) + 1); writeStore(KEY, all);
    rerender(); react("think");
  });
}

/* ---------- reactions ---------- */
const FACE = { tap: ["wave", "Hi! I am Py, a bot."], drag: ["drag", "Wheee!"], drop: ["drop", "Nice spot."], win: ["cheer", "All checks passed. Next time, predict the output first."], fail: ["puzzled", "Read the last failure line first."], think: ["think", "Climb one rung at a time."] };
let timer = 0;
export function react(kind) {
  const node = bot(); if (!node) return;
  const [cls, line] = FACE[kind] || FACE.tap;
  node.dataset.mood = cls;
  const chip = node.querySelector(".bot-mood") || node.appendChild(Object.assign(document.createElement("span"), { className: "bot-mood", ariaHidden: "true" }));
  chip.setAttribute("aria-hidden", "true");
  chip.textContent = { wave: "?", drag: "!", drop: "ok", cheer: "★", puzzled: "?", think: "…" }[cls];
  if (kind !== "drag") sayBot(line);
  clearTimeout(timer);
  if (kind !== "drag") timer = setTimeout(() => { delete node.dataset.mood; chip.textContent = ""; }, kind === "win" ? 2600 : 1600);
  document.getElementById("bot-live")?.replaceChildren(document.createTextNode(line));
}

export function initTeachReactions() {
  if (!document.getElementById("bot-live")) {
    const live = document.createElement("p"); live.id = "bot-live"; live.className = "visually-hidden"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);
  }
  window.addEventListener("lab:result", (e) => {
    const d = e.detail || {};
    if (!d.hasChecks) return;
    if (d.ok) { state.fails = 0; react("win"); } else { state.fails += 1; react("fail"); }
  });
  window.addEventListener("lab:bot", (e) => react(e.detail));
  window.addEventListener("hashchange", () => { state.fails = 0; state.started = Date.now(); });
}
