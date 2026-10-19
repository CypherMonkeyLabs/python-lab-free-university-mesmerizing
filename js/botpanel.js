import { sections } from "./content/sections.js";
import { esc } from "./util.js";
import { onBotTap, onBotDragStart, resetBot } from "./bot.js";
import { py, quickActions, pyControls, bindPyPanel, act, speak, hint } from "./pycustom.js";
import { isHowToOpen, closeHowTo } from "./howto.js";
import { teachHtml, bindTeach, react } from "./botteach.js";
import { neighbors, firstUnvisited, progressInfo, currentHash, sectionFor } from "./shell.js";
import { chatHtml, hydrateChat, initBotChat } from "./botchat.js";

const panel = () => document.getElementById("bot-panel");
const bot = () => document.getElementById("lab-bot");

function greeting() {
  const hour = new Date().getHours();
  const part = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${part}, I am ${py().name}, the lab bot.`;
}

function build(keepOpen = false) {
  const wasOpen = keepOpen && panel().querySelector(".py-custom")?.open;
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
  go.push(`<button type="button" class="bp-go" data-open-help><b>How to use this site</b><span>Menus, search, downloads, themes, slides</span></button>`);
  const inLesson = /^#\/lesson\//.test(hash);
  const quick = sections.map((s) => `<a class="bp-chip" href="${esc(s.href)}">${esc(s.title)}</a>`).join("");
  panel().innerHTML = `<div class="bp-head"><h2 id="bot-panel-title">${esc(greeting())}</h2>
      <button type="button" class="bp-close" id="bp-close" aria-label="Close the helper">&times;</button></div>
    <p class="bp-bot">Py answers only from this lab's lessons and can be wrong.</p>
    <div class="bp-scroll">
    <p class="bp-line">You are in <strong>${esc(here)}</strong>. ${done} of ${total} lessons opened so far. Where would you like to go?</p>
    <div class="bp-quick" role="group" aria-label="Quick actions">${quickActions(sections).map((q) => q.href ? `<a class="bp-qa" href="${esc(q.href)}"><span aria-hidden="true">${q.icon}</span>${esc(q.label)}</a>` : `<button type="button" class="bp-qa" data-qa="${q.act}"><span aria-hidden="true">${q.icon}</span>${esc(q.label)}</button>`).join("")}</div>
    <p class="bp-hint" id="bp-hint" role="status" hidden></p>
    ${inLesson ? teachHtml() : ""}
    <div class="bp-gos">${go.join("")}</div>
    ${inLesson ? "" : teachHtml()}
    <p class="bp-sub">Quick links</p>
    <div class="bp-chips">${quick}<button type="button" class="bp-chip bp-btn" id="bp-search">Search</button></div>
    <p class="bp-foot">Drag me anywhere. Tap me to open this panel. <button type="button" class="bp-link" id="bp-reset">Put me back</button></p>${pyControls()}
    </div>
    ${chatHtml()}`;
  hydrateChat(panel());
  if (wasOpen) panel().querySelector(".py-custom").open = true;
}

function overlaps(a, b) {
  return a.width > 0 && b.width > 0 && a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
}

function viewMetrics() {
  const vv = window.visualViewport;
  if (!vv) return { width: window.innerWidth, height: window.innerHeight, top: 0, left: 0 };
  return { width: vv.width, height: vv.height, top: vv.offsetTop, left: vv.offsetLeft };
}

function position() {
  const p = panel();
  const r = bot().getBoundingClientRect();
  const cs = getComputedStyle(document.documentElement);
  const topH = parseFloat(cs.getPropertyValue("--top-h")) || 60;
  const barH = parseFloat(cs.getPropertyValue("--bar-h")) || 64;
  const view = viewMetrics();
  const minTop = view.top + topH + 8;
  const maxBottom = view.top + view.height - barH - 8;
  const gap = 12;
  const above = Math.max(0, r.top - gap - minTop);
  const below = Math.max(0, maxBottom - (r.bottom + gap));
  const placeAbove = above >= below;
  const cap = Math.max(0, view.height - topH - barH - 16);
  let maxH = Math.min(placeAbove ? above : below, cap);
  if (maxH < 1) maxH = Math.min(Math.max(above, below), cap);
  p.style.maxHeight = `${maxH}px`;
  p.style.height = "auto";
  const short = view.height <= 560;
  if (short || p.scrollHeight > maxH + 1) p.style.height = `${maxH}px`;
  const pw = p.offsetWidth || Math.min(340, view.width - 16);
  const left = Math.min(Math.max(view.left + 8, r.right - pw), view.left + view.width - pw - 8);
  const height = Math.min(p.offsetHeight, maxH);
  let top = placeAbove ? r.top - gap - height : r.bottom + gap;
  top = Math.max(minTop, Math.min(top, maxBottom - height));
  p.style.left = `${left}px`;
  p.style.top = `${top}px`;
  const form = p.querySelector(".py-chat-form");
  if (form && overlaps(form.getBoundingClientRect(), bot().getBoundingClientRect())) {
    const room = Math.max(0, Math.min(r.top - gap - minTop, cap));
    p.style.maxHeight = `${room}px`;
    p.style.height = `${room}px`;
    p.style.top = `${Math.max(minTop, r.top - gap - room)}px`;
  }
}

let openedAt = 0;
export function openPanel() {
  openedAt = Date.now();
  build();
  const p = panel();
  p.hidden = false;
  bot().setAttribute("aria-expanded", "true");
  bot().classList.add("is-open");
  act("wave", 900);
  setTimeout(() => bot().classList.remove("wave"), 700);
  window.dispatchEvent(new CustomEvent("lab:bot", { detail: "tap" }));
  position();
  (p.querySelector("#py-chat-input") || p.querySelector(".bp-qa"))?.focus({ preventScroll: true });
  speak(greeting());
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
  initBotChat(panel());
  bindTeach(panel(), () => { build(); position(); panel().querySelector("#bp-rung")?.focus({ preventScroll: true }); });
  onBotTap(() => {
    /* One popup flow: a tap on the bot first dismisses the how-to window (remembered), so it never blocks the bot. */
    if (isHowToOpen()) { closeHowTo(); return; }
    panel().hidden ? openPanel() : closePanel();
  });
  onBotDragStart(() => closePanel());
  /* The click that follows the tap which opened the panel can land on a link under the finger. Swallow it. */
  panel().addEventListener("click", (e) => { if (Date.now() - openedAt < 450) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  bindPyPanel(panel(), (keep) => { build(keep); position(); });
  document.addEventListener("lab:hint", (e) => { const h = document.getElementById("bp-hint"); if (h) { h.hidden = false; h.textContent = e.detail; } });
  panel().addEventListener("click", (e) => {
    if (e.target.closest('[data-qa="hint"]')) return;
    if (e.target.closest('[data-qa]')) { closePanel(); return; }
    if (e.target.closest("[data-py-color],[data-py-skin],[data-py-size],[data-py-act]")) return;
    if (e.target.closest("#bp-close")) closePanel(true);
    else if (e.target.closest("#bp-reset")) { resetBot(); closePanel(); }
    else if (e.target.closest("#bp-search")) { closePanel(); document.body.classList.add("search-open"); document.getElementById("top-search")?.focus(); }
    else if (e.target.closest("a") || e.target.closest("[data-open-help]")) closePanel();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(true); });
  document.addEventListener("pointerdown", (e) => {
    if (!panel().hidden && !e.target.closest("#bot-panel") && !e.target.closest("#lab-bot")) closePanel();
  });
  window.addEventListener("resize", () => { if (!panel().hidden) position(); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => { if (!panel().hidden) position(); });
    window.visualViewport.addEventListener("scroll", () => { if (!panel().hidden) position(); });
  }
  window.addEventListener("hashchange", () => closePanel());
}
