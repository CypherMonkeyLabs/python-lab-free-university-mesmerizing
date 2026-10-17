import { sections } from "./content/sections.js";
import { esc } from "./util.js";
import { onBotTap, onBotDragStart, resetBot } from "./bot.js";
import { neighbors, firstUnvisited, progressInfo, currentHash, sectionFor } from "./shell.js";

const panel = () => document.getElementById("bot-panel");
const bot = () => document.getElementById("lab-bot");

function greeting() {
  const hour = new Date().getHours();
  const part = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${part}, I am Py, the lab bot.`;
}

function build() {
  const hash = currentHash();
  const id = sectionFor(hash);
  const here = id ? sections.find((s) => s.id === id)?.title : hash === "#/" ? "the lobby" : "a lab page";
  const { next } = neighbors(hash);
  const cont = firstUnvisited();
  const { done, total } = progressInfo();
  const go = [];
  if (cont) go.push(`<a class="bp-go bp-primary" href="${esc(cont.href)}"><b>${done ? "Continue learning" : "Start the first lesson"}</b><span>${esc(cont.title)}</span></a>`);
  if (next && (!cont || next.href !== cont.href)) go.push(`<a class="bp-go" href="${esc(next.href)}"><b>Next page</b><span>${esc(next.title)}</span></a>`);
  go.push(`<a class="bp-go" href="#/practice"><b>Open a lab</b><span>Run Python in your browser</span></a>`);
  const quick = sections.map((s) => `<a class="bp-chip" href="${esc(s.href)}">${esc(s.title)}</a>`).join("");
  panel().innerHTML = `<div class="bp-head"><h2 id="bot-panel-title">${esc(greeting())}</h2>
      <button type="button" class="bp-close" id="bp-close" aria-label="Close the helper">&times;</button></div>
    <p class="bp-line">You are in <strong>${esc(here)}</strong>. ${done} of ${total} lessons opened so far. Where would you like to go?</p>
    <div class="bp-gos">${go.join("")}</div>
    <p class="bp-sub">Quick links</p>
    <div class="bp-chips">${quick}<button type="button" class="bp-chip bp-btn" id="bp-search">Search</button></div>
    <p class="bp-foot">Drag me anywhere. Tap me to open this panel. <button type="button" class="bp-link" id="bp-reset">Put me back</button></p>`;
}

function position() {
  const p = panel();
  const r = bot().getBoundingClientRect();
  const pw = p.offsetWidth;
  const ph = p.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = Math.min(Math.max(8, r.right - pw), vw - pw - 8);
  let top = r.top - ph - 10;
  if (top < 8) top = Math.min(r.bottom + 10, vh - ph - 8);
  p.style.left = `${left}px`;
  p.style.top = `${Math.max(8, top)}px`;
}

export function openPanel() {
  build();
  const p = panel();
  p.hidden = false;
  bot().setAttribute("aria-expanded", "true");
  bot().classList.add("is-open", "wave");
  setTimeout(() => bot().classList.remove("wave"), 700);
  position();
  p.querySelector(".bp-go")?.focus({ preventScroll: true });
}

export function closePanel(returnFocus = false) {
  const p = panel();
  if (p.hidden) return;
  p.hidden = true;
  bot().setAttribute("aria-expanded", "false");
  bot().classList.remove("is-open");
  if (returnFocus) bot().focus({ preventScroll: true });
}

export function initBotPanel() {
  onBotTap(() => (panel().hidden ? openPanel() : closePanel()));
  onBotDragStart(() => closePanel());
  panel().addEventListener("click", (e) => {
    if (e.target.closest("#bp-close")) closePanel(true);
    else if (e.target.closest("#bp-reset")) { resetBot(); closePanel(); }
    else if (e.target.closest("#bp-search")) { closePanel(); document.body.classList.add("search-open"); document.getElementById("top-search")?.focus(); }
    else if (e.target.closest("a")) closePanel();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(true); });
  document.addEventListener("pointerdown", (e) => {
    if (!panel().hidden && !e.target.closest("#bot-panel") && !e.target.closest("#lab-bot")) closePanel();
  });
  window.addEventListener("resize", () => { if (!panel().hidden) position(); });
  window.addEventListener("hashchange", () => closePanel());
}
