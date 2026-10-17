import { sections, sectionFor, sequence, lessonCount, searchIndex } from "./content/sections.js";
import { rawIcon } from "./icons.js";
import { esc, readStore, writeStore } from "./util.js";

const SIDE_KEY = "pythonlab.side.v1";
const VISIT_KEY = "pythonlab.visited.v1";
const $ = (sel, root = document) => root.querySelector(sel);
const body = document.body;
const mobileQuery = window.matchMedia("(max-width: 899px)");

export const isMobile = () => mobileQuery.matches;

/* ---------- progress ---------- */
function visited() { return readStore(VISIT_KEY, {}); }
function recordVisit(hash) {
  const m = hash.match(/^#\/lesson\/([a-z]+)\/([a-z-]+)/);
  if (!m) return;
  const data = visited();
  data[`${m[1]}/${m[2]}`] = 1;
  writeStore(VISIT_KEY, data);
}
export function progressInfo() {
  const done = Object.keys(visited()).length;
  return { done, total: lessonCount, pct: Math.round((done / lessonCount) * 100) };
}

/* ---------- navigation helpers ---------- */
function currentHash() { return location.hash || "#/"; }

export function neighbors(hash = currentHash()) {
  const idx = sequence.findIndex((item) => item.href === hash);
  if (idx >= 0) {
    return { prev: sequence[idx - 1] || { href: "#/", title: "Home" }, next: sequence[idx + 1] || null };
  }
  const id = sectionFor(hash);
  if (id) {
    const si = sections.findIndex((s) => s.id === id);
    const prev = sections[si - 1] || { href: "#/", title: "Home" };
    const next = sections[si + 1];
    return {
      prev: { href: prev.href, title: prev.title },
      next: next ? { href: next.href, title: next.title } : { href: "#/section/start", title: "Start Here" },
    };
  }
  return { prev: null, next: { href: sections[0].href, title: sections[0].title } };
}

/* ---------- sidebar ---------- */
function buildSidebar() {
  const aside = $("#sidemenu");
  const items = [
    `<a class="side-item" href="#/" data-section="home" data-tip="Home">
      <span class="side-ico">${rawIcon("home", 22)}</span>
      <span class="side-text"><span class="side-label">Home</span><span class="side-desc">The lab lobby with a 3D scene.</span></span></a>`,
    ...sections.map((s) => `<a class="side-item" href="${esc(s.href)}" data-section="${s.id}" data-tip="${esc(s.title)}">
      <span class="side-ico">${rawIcon(s.icon, 22)}</span>
      <span class="side-text"><span class="side-label">${esc(s.title)}</span><span class="side-desc">${esc(s.menu)}</span></span></a>`),
    `<a class="side-item" href="#/worlds" data-section="worlds" data-tip="Worlds">
      <span class="side-ico">${rawIcon("rooms", 22)}</span>
      <span class="side-text"><span class="side-label">Worlds</span><span class="side-desc">Eleven 3D worlds and the level map.</span></span></a>`,
    `<a class="side-item" href="#/download-center" data-section="download-center" data-tip="Download Center">
      <span class="side-ico">${rawIcon("downloads", 22)}</span>
      <span class="side-text"><span class="side-label">Download Center</span><span class="side-desc">PDF, Word, PowerPoint, HTML and images.</span></span></a>`,
  ].join("");
  aside.innerHTML = `<div class="side-head"><span class="side-title">Menu</span>
      <button type="button" class="side-collapse" id="side-collapse" aria-label="Collapse the side menu" aria-expanded="true">${rawIcon("collapse", 18)}</button>
      <button type="button" class="side-close" id="side-close" aria-label="Close the menu">${rawIcon("close", 18)}</button></div>
    <nav class="side-nav" aria-label="Lab sections">${items}</nav>
    <div class="side-foot"><div class="side-progress" aria-hidden="true"><i data-progress-fill></i></div><p class="side-foot-text" data-progress-text></p></div>`;
}

function setCollapsed(on, persist = true) {
  body.classList.toggle("side-collapsed", on);
  document.documentElement.style.setProperty("--side-now", on ? "76px" : "288px");
  const btn = $("#side-collapse");
  if (btn) {
    btn.setAttribute("aria-expanded", String(!on));
    btn.setAttribute("aria-label", on ? "Expand the side menu" : "Collapse the side menu");
  }
  if (persist) writeStore(SIDE_KEY, { collapsed: on });
  window.dispatchEvent(new Event("resize"));
}

function setDrawer(open) {
  body.classList.toggle("side-open", open);
  $("#menu-toggle")?.setAttribute("aria-expanded", String(open));
  $("#side-scrim").hidden = !open;
  if (open) $("#sidemenu .side-item")?.focus();
}

/* ---------- top & bottom bars ---------- */
function updateBars() {
  const hash = currentHash();
  const id = hash.startsWith("#/worlds") ? "worlds" : hash.startsWith("#/download-center") ? "download-center"
    : (sectionFor(hash) || (hash === "#/" ? "home" : ""));
  document.querySelectorAll("#sidemenu .side-item").forEach((a) => {
    const on = a.dataset.section === id;
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const { prev, next } = neighbors(hash);
  const set = (el, target, label) => {
    if (!el) return;
    if (target) {
      el.href = target.href;
      el.removeAttribute("aria-disabled");
      el.setAttribute("aria-label", `${label}: ${target.title}`);
      el.title = `${label}: ${target.title}`;
      $(".bar-sub", el).textContent = target.title;
    } else {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("aria-label", `${label}: none`);
      el.title = `No ${label.toLowerCase()} page`;
      $(".bar-sub", el).textContent = "The end";
    }
  };
  set($("#bar-prev"), prev, "Previous");
  set($("#bar-next"), next, "Next");
  const { done, total, pct } = progressInfo();
  const txt = `${done} of ${total} lessons opened`;
  document.querySelectorAll("[data-progress-fill]").forEach((el) => { el.style.width = `${pct}%`; });
  document.querySelectorAll("[data-progress-text]").forEach((el) => { el.textContent = txt; });
  document.querySelectorAll("[role=progressbar]").forEach((el) => { el.setAttribute("aria-valuenow", String(pct)); el.setAttribute("aria-valuetext", txt); });
  const label = id === "home" ? "Home" : id === "worlds" ? "Worlds" : id === "download-center" ? "Download Center"
    : (sections.find((s) => s.id === id)?.title || "Python Lab");
  const where = $("#bar-where");
  if (where) where.textContent = label;
}

/* ---------- search ---------- */
function bindSearch() {
  const input = $("#top-search");
  const box = $("#search-results");
  if (!input || !box) return;
  const rows = searchIndex();
  let hits = [];
  let active = -1;
  const close = () => { box.hidden = true; active = -1; input.setAttribute("aria-expanded", "false"); };
  const paint = () => {
    box.innerHTML = hits.length
      ? hits.map((r, i) => `<a role="option" id="sr-${i}" class="sr-item${i === active ? " is-active" : ""}" href="${esc(r.href)}"><span class="sr-kind">${esc(r.kind)}</span><span class="sr-title">${esc(r.title)}</span><span class="sr-desc">${esc(r.desc)}</span></a>`).join("")
      : `<p class="sr-empty">No page matches that search.</p>`;
    box.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };
  input.addEventListener("input", () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { close(); return; }
    hits = rows.map((r) => {
      const hay = `${r.title} ${r.desc} ${r.kind}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return null;
      const t = r.title.toLowerCase();
      return { r, score: words.reduce((n, w) => n + (t.startsWith(w) ? 3 : t.includes(w) ? 2 : 1), 0) };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8).map((x) => x.r);
    active = -1;
    paint();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); input.blur(); return; }
    if (box.hidden) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % Math.max(hits.length, 1);
      paint();
      input.setAttribute("aria-activedescendant", `sr-${active}`);
    } else if (e.key === "Enter" && hits.length) {
      e.preventDefault();
      location.hash = (hits[active] || hits[0]).href;
      input.value = "";
      close();
    }
  });
  box.addEventListener("click", () => { input.value = ""; close(); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".top-search-wrap")) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (isMobile()) $("#search-toggle")?.click();
      input.focus();
    }
  });
  $("#search-toggle")?.addEventListener("click", () => {
    const open = !body.classList.contains("search-open");
    body.classList.toggle("search-open", open);
    $("#search-toggle").setAttribute("aria-expanded", String(open));
    if (open) input.focus(); else close();
  });
}

/* ---------- 3D tilt on cards ---------- */
export function bindTilt(root) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelectorAll("[data-tilt]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--tx", `${(-y * 10).toFixed(2)}deg`);
      el.style.setProperty("--ty", `${(x * 12).toFixed(2)}deg`);
    });
    el.addEventListener("pointerleave", () => { el.style.removeProperty("--tx"); el.style.removeProperty("--ty"); });
  });
}

export function bindHeroParallax(root) {
  const hero = $(".hero3d", root);
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width) - 0.5) * 36}deg`);
    hero.style.setProperty("--rx", `${(0.5 - ((e.clientY - r.top) / r.height)) * 22}deg`);
  });
  hero.addEventListener("pointerleave", () => { hero.style.removeProperty("--ry"); hero.style.removeProperty("--rx"); });
}

/* ---------- init ---------- */
export function initShell() {
  buildSidebar();
  const saved = readStore(SIDE_KEY, { collapsed: false });
  setCollapsed(!!saved.collapsed, false);
  $("#side-collapse").addEventListener("click", () => setCollapsed(!body.classList.contains("side-collapsed")));
  $("#side-close").addEventListener("click", () => setDrawer(false));
  $("#side-scrim").addEventListener("click", () => setDrawer(false));
  $("#menu-toggle").addEventListener("click", () => {
    if (isMobile()) setDrawer(!body.classList.contains("side-open"));
    else setCollapsed(!body.classList.contains("side-collapsed"));
  });
  $("#bar-menu")?.addEventListener("click", () => {
    if (isMobile()) setDrawer(!body.classList.contains("side-open"));
    else setCollapsed(!body.classList.contains("side-collapsed"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && body.classList.contains("side-open")) { setDrawer(false); $("#menu-toggle").focus(); }
  });
  $("#sidemenu").addEventListener("click", (e) => { if (e.target.closest("a") && isMobile()) setDrawer(false); });
  $("#bar-prev").addEventListener("click", (e) => { if (e.currentTarget.getAttribute("aria-disabled")) e.preventDefault(); });
  $("#bar-next").addEventListener("click", (e) => { if (e.currentTarget.getAttribute("aria-disabled")) e.preventDefault(); });
  mobileQuery.addEventListener("change", () => setDrawer(false));
  bindSearch();
  recordVisit(currentHash());
  updateBars();
  window.addEventListener("hashchange", () => { recordVisit(currentHash()); updateBars(); });
}

export function firstUnvisited() {
  const seen = visited();
  return sequence.find((item) => {
    const m = item.href.match(/^#\/lesson\/([a-z]+)\/([a-z-]+)/);
    return m && !seen[`${m[1]}/${m[2]}`];
  }) || null;
}
export { currentHash, sectionFor };
