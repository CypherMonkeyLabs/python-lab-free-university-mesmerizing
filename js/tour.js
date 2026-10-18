/* Guided tour: navigate, download, view, play. Re-openable from Help, the Display menu, the welcome banner and the bot. */
import { readStore, writeStore } from "./util.js";

const KEY = "pythonlab.tour.v1";
const vis = (sel) => [...document.querySelectorAll(sel)].find((n) => {
  const r = n.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(n).visibility !== "hidden";
});

const STEPS = [
  { title: "A 1 minute tour", text: "Four things: navigate, download, view and play. Use Next, or press Esc to leave. You can reopen this tour from Help, the Display menu, or the bot.", target: null },
  { title: "Navigate: the menu", text: "The Menu button opens every section, from Start Here to Resources. On a phone it slides in as a drawer.", target: () => vis("#menu-toggle") },
  { title: "Navigate: search", text: "Press / on a keyboard, or tap the magnifier. Type a word and press Enter to jump to the first match.", target: () => vis("#top-search") || vis("#search-toggle") },
  { title: "Download", text: "Cheat sheets, slides as Markdown, a notebook, diagrams and a whole-lab ZIP are on the Downloads page. Each one says what is inside.", target: () => vis('.top-links a[href="#/downloads"]'), go: { href: "#/downloads", label: "Open Downloads" } },
  { title: "View it your way", text: "Display switches the colour theme, the effects quality (Auto, High, Low, Off) and sound. Sound is off until you turn it on.", target: () => vis(".display-menu summary") },
  { title: "Play and earn XP", text: "Games and puzzles explain loops, variables, lists and code order visually. You earn XP and badges, stored only on this device.", target: null, go: { href: "#/games", label: "Open Games" } },
  { title: "Meet Py", text: "Py is the lab bot. Tap it for quick actions (levels, downloads, games, hints). Drag it anywhere, or customise it from its panel.", target: () => vis("#lab-bot") },
];

let root = null;
let idx = 0;
let lastFocus = null;

function place(ring, card, el) {
  if (!el) { ring.className = "tour-ring none"; ring.style.cssText = ""; card.style.left = `${Math.max(12, (window.innerWidth - card.offsetWidth) / 2)}px`; card.style.top = `${Math.max(12, (window.innerHeight - card.offsetHeight) / 2)}px`; return; }
  const r = el.getBoundingClientRect();
  const pad = 6;
  ring.className = "tour-ring";
  ring.style.left = `${r.left - pad}px`; ring.style.top = `${r.top - pad}px`;
  ring.style.width = `${r.width + pad * 2}px`; ring.style.height = `${r.height + pad * 2}px`;
  const cw = card.offsetWidth; const ch = card.offsetHeight;
  let top = r.bottom + 14;
  if (top + ch > window.innerHeight - 10) top = Math.max(10, r.top - ch - 14);
  card.style.left = `${Math.min(Math.max(12, r.left), window.innerWidth - cw - 12)}px`;
  card.style.top = `${top}px`;
}

function paint() {
  const s = STEPS[idx];
  const card = root.querySelector(".tour-card");
  const last = idx === STEPS.length - 1;
  card.innerHTML = `<h2 id="tour-title">${s.title}</h2><p>${s.text}</p>
    <div class="tc-row">${idx ? '<button type="button" data-back>Back</button>' : ""}
    <button type="button" class="tc-next" data-next>${last ? "Finish" : "Next"}</button>
    ${s.go ? `<a class="tc-go" href="${s.go.href}" data-finish>${s.go.label}</a>` : ""}
    <button type="button" data-skip>Skip</button><span class="tc-step">${idx + 1} of ${STEPS.length}</span></div>`;
  const el = s.target ? s.target() : null;
  if (el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
  requestAnimationFrame(() => place(root.querySelector(".tour-ring"), card, el));
  card.querySelector("[data-next]").focus({ preventScroll: true });
}

export function isTourOpen() { return !!root; }

export function endTour() {
  if (!root) return;
  document.body.classList.remove("tour-open");
  root.remove();
  root = null;
  window.removeEventListener("resize", onResize);
  document.removeEventListener("keydown", onKey, true);
  writeStore(KEY, { done: true, at: new Date().toISOString().slice(0, 10) });
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
const onResize = () => root && paint();
function onKey(e) {
  if (!root) return;
  if (e.key === "Escape") { e.stopPropagation(); endTour(); }
  else if (e.key === "ArrowRight") { idx = Math.min(STEPS.length - 1, idx + 1); paint(); }
  else if (e.key === "ArrowLeft") { idx = Math.max(0, idx - 1); paint(); }
}

export function startTour() {
  if (root) return;
  document.getElementById("howto")?.setAttribute("hidden", "");
  document.body.classList.remove("howto-open");
  document.getElementById("welcome")?.remove();
  lastFocus = document.activeElement;
  idx = 0;
  root = document.createElement("div");
  root.className = "tour-scrim";
  root.id = "tour";
  root.innerHTML = '<div class="tour-ring none"></div><div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title"></div>';
  document.body.classList.add("tour-open");
  document.body.appendChild(root);
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-next]")) { if (idx === STEPS.length - 1) endTour(); else { idx += 1; paint(); } }
    else if (e.target.closest("[data-back]")) { idx -= 1; paint(); }
    else if (e.target.closest("[data-skip]") || e.target.closest("[data-finish]")) endTour();
  });
  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", onKey, true);
  paint();
}

export function initTour() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-start-tour]")) { e.preventDefault(); startTour(); }
  });
}
export const tourDone = () => !!readStore(KEY, null);
