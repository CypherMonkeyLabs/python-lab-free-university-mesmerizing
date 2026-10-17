/* A bright welcome on every visit. Visit count and last visit are stored on this device only. */
import { readStore, writeStore, esc } from "./util.js";
import { state, levelFor } from "./xp.js";
import { startTour, isTourOpen } from "./tour.js";
import { sayBot } from "./botfx.js";

const KEY = "pythonlab.visits.v1";
const HOWTO_KEY = "pythonlab.howto.v2";

const MORNING = ["Good morning! A fresh day, a fresh `print`.", "Rise and code! Your next lesson is waiting.", "Morning! Ten minutes of Python beats zero."];
const AFTERNOON = ["Good afternoon! Ready to level up?", "Hello again! Pick a game or a lesson, both count.", "Afternoon sparkle: one small program today?"];
const EVENING = ["Good evening! A cosy lesson before the day ends?", "Evening! Tiny steps still add up.", "Welcome! Let the bugs be friendly tonight."];
const NIGHT = ["Burning the midnight oil? Go gently, and take breaks.", "Late-night coder! Hydrate, then run something."];

export function visitInfo() {
  return readStore(KEY, { count: 0, last: null });
}

function pick(list, seed) { return list[seed % list.length]; }

export function buildWelcome(info, xp) {
  const h = new Date().getHours();
  const list = h < 5 ? NIGHT : h < 12 ? MORNING : h < 18 ? AFTERNOON : EVENING;
  const first = info.count <= 1;
  const title = first ? "Welcome to Python Lab! 🎉" : `Welcome back! Visit number ${info.count} ✨`;
  const lvl = levelFor(xp.xp);
  const line = first
    ? "Everything is free, runs in your browser, and has no account. Take the 1 minute tour: navigate, download, view, play."
    : `${pick(list, info.count).replace(/`/g, "")} You are level ${lvl} with ${xp.xp} XP.`;
  return { title, line, first };
}

function show(w, info) {
  document.getElementById("welcome")?.remove();
  const el = document.createElement("div");
  el.id = "welcome";
  el.className = "welcome";
  el.setAttribute("role", "status");
  el.innerHTML = `<span class="wl-emoji" aria-hidden="true">${w.first ? "🐍" : "🌈"}</span>
    <div><b>${esc(w.title)}</b><span class="wl-t">${esc(w.line)}</span>
    <div class="wl-actions"><button type="button" class="wl-go" data-tour>${w.first ? "Start the 1 minute tour" : "Take the tour again"}</button>
    <button type="button" class="wl-go" data-welcome-play>Play a game</button></div></div>
    <button type="button" class="wl-x" aria-label="Dismiss the welcome">&times;</button>`;
  document.body.appendChild(el);
  let timer = setTimeout(() => el.remove(), w.first ? 14000 : 9000);
  const stop = () => clearTimeout(timer);
  el.addEventListener("pointerenter", stop);
  el.addEventListener("focusin", stop);
  el.addEventListener("click", (e) => {
    if (e.target.closest(".wl-x")) el.remove();
    else if (e.target.closest("[data-tour]")) { el.remove(); startTour(); }
    else if (e.target.closest("[data-welcome-play]")) { el.remove(); location.hash = "#/games"; }
  });
  window.addEventListener("hashchange", () => el.remove(), { once: true });
  new MutationObserver(() => { if (/side-open|search-open|howto-open/.test(document.body.className)) el.remove(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("pointerdown", (e) => { if (!el.contains(e.target)) el.remove(); }, { once: true, capture: true });
  sayBot(w.first ? "Hi! I'm Py. Tap me anytime." : "Welcome back! Tap me for quick actions.");
}

export function initWelcome() {
  const info = visitInfo();
  info.count += 1;
  info.last = new Date().toISOString();
  writeStore(KEY, info);
  const go = () => !isTourOpen() && show(buildWelcome(info, state()), info);
  if (readStore(HOWTO_KEY, null)) setTimeout(go, 600);
  else document.addEventListener("lab:howto-closed", () => setTimeout(go, 300), { once: true });
}
