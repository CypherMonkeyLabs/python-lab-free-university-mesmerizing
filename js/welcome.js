/* A bright welcome on every visit. Visit count and last visit are stored on this device only. */
import { readStore, writeStore, esc } from "./util.js";
import { state, levelFor } from "./xp.js";
import { startTour, isTourOpen } from "./tour.js";
import { sayBot } from "./botfx.js";
import { zodiacMonkeySvg, BRAND_DOMAIN } from "./cm-shared.js";
import { howtoClosedAt, isHowToOpen } from "./howto.js";

const KEY = "pythonlab.visits.v1";
const HOWTO_KEY = "pythonlab.howto.v2";

const MORNING = ["Good morning! A bright page, a fresh print, and eleven worlds to tap.", "Rise and code! Pick a colourful world or a game.", "Morning! Ten minutes of Python beats zero."];
const AFTERNOON = ["Good afternoon! The lab is lit up. Ready to level up?", "Hello again! A game, a world, or a lesson — all three count.", "Afternoon sparkle: one small program today?"];
const EVENING = ["Good evening! A cosy, colourful lesson before the day ends?", "Evening! Tiny steps still add up, and the worlds stay bright.", "Welcome! Let the bugs be friendly tonight."];
const NIGHT = ["Burning the midnight oil? Go gently, take breaks, keep the colours.", "Late-night coder! Hydrate, then run something small."];

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
    ? "Everything is free, runs in your browser, and has no account. Tour first: navigate, download, view, then play a bright game."
    : `${pick(list, info.count).replace(/`/g, "")} You are level ${lvl} with ${xp.xp} XP.`;
  return { title, line, first };
}

const queue = [];
let dismissTimer = 0;
let paused = false;

function region() {
  return document.getElementById("toast-region");
}

function placeToasts() {
  const host = region();
  if (!host) return;
  const panel = document.getElementById("bot-panel");
  const open = !!(panel && !panel.hidden);
  const side = document.getElementById("lab-bot")?.dataset.side || "right";
  host.classList.toggle("toast-flip", open && side === "left");
}

function pump() {
  const host = region();
  if (!host || host.firstElementChild || !queue.length) return;
  const next = queue.shift();
  host.appendChild(next);
  paused = false;
  const arm = () => {
    clearTimeout(dismissTimer);
    if (paused || !next.isConnected) return;
    dismissTimer = window.setTimeout(() => {
      if (paused || !next.isConnected) return;
      next.remove();
      pump();
    }, 5000);
  };
  next.addEventListener("pointerenter", () => { paused = true; clearTimeout(dismissTimer); });
  next.addEventListener("pointerleave", () => { paused = false; arm(); });
  next.addEventListener("focusin", () => { paused = true; clearTimeout(dismissTimer); });
  next.addEventListener("focusout", () => { paused = false; arm(); });
  arm();
  placeToasts();
}

function enqueue(node) {
  if (!node || node.closest?.("#toast-region")) return;
  queue.push(node);
  pump();
}

function welcomeAllowed() {
  if (isTourOpen() || isHowToOpen()) return false;
  if (Date.now() - howtoClosedAt() < 5000) return false;
  return true;
}

function show(w) {
  if (!welcomeAllowed()) return;
  document.getElementById("welcome")?.remove();
  const el = document.createElement("div");
  el.id = "welcome";
  el.className = "welcome";
  el.innerHTML = `<span class="wl-emoji wl-zodiac" aria-hidden="true">${zodiacMonkeySvg(40)}<small class="wl-domain">${BRAND_DOMAIN}</small></span>
    <div><b>${esc(w.title)} <span class="wl-brand-inline">· ${BRAND_DOMAIN}</span></b><span class="wl-t">${esc(w.line)}</span>
    <div class="wl-actions"><button type="button" class="wl-go" data-tour>${w.first ? "Start the 1 minute tour" : "Take the tour again"}</button>
    <button type="button" class="wl-go" data-welcome-play>Play a game</button></div></div>
    <button type="button" class="wl-x" aria-label="Dismiss the welcome">&times;</button>`;
  el.addEventListener("click", (e) => {
    if (e.target.closest(".wl-x")) el.remove();
    else if (e.target.closest("[data-tour]")) { el.remove(); startTour(); }
    else if (e.target.closest("[data-welcome-play]")) { el.remove(); location.hash = "#/games"; }
    pump();
  });
  window.addEventListener("hashchange", () => { el.remove(); pump(); }, { once: true });
  enqueue(el);
  sayBot(w.first ? "Hi! I'm Py. Tap me anytime." : "Welcome back! Tap me for quick actions.");
}

function adoptToast(node) {
  if (!(node instanceof HTMLElement)) return;
  if (node.closest("#toast-region")) return;
  const toast = node.matches(".fx-toast, .welcome, .levelup") ? node : null;
  if (!toast) return;
  const copy = toast.cloneNode(true);
  toast.remove();
  copy.addEventListener("click", (event) => {
    if (event.target.closest("button, a")) return;
    copy.remove();
    pump();
  });
  enqueue(copy);
}

function watchToasts() {
  const host = region();
  placeToasts();
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.id === "fx-toasts") {
          [...node.children].forEach(adoptToast);
          return;
        }
        adoptToast(node);
        node.querySelectorAll?.(".fx-toast, .welcome, .levelup").forEach(adoptToast);
      });
    });
    if (host && !host.firstElementChild) pump();
    placeToasts();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "data-side"] });
  document.body.addEventListener("click", () => placeToasts());
}

export function initWelcome() {
  watchToasts();
  const info = visitInfo();
  info.count += 1;
  info.last = new Date().toISOString();
  writeStore(KEY, info);
  if (!readStore(HOWTO_KEY, null)) return;
  const go = () => {
    if (!welcomeAllowed()) return;
    show(buildWelcome(info, state()));
  };
  setTimeout(go, 600);
}
