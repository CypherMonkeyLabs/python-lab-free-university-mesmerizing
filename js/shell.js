import { sections, sectionFor, sequence, lessonCount, searchIndex } from "./content/sections.js";
import { tracks } from "./content/catalog.js";
import { rawIcon } from "./icons.js";
import { esc, readStore, writeStore, PROGRESS_KEY } from "./util.js";

const SIDE_KEY = "pythonlab.side.v1";
const VISIT_KEY = "pythonlab.visited.v1";
const $ = (sel, root = document) => root.querySelector(sel);
const body = document.body;
const mobileQuery = window.matchMedia("(max-width: 1099px)");

export const isMobile = () => mobileQuery.matches;

/* ---------- progress ---------- */
function visited() { return readStore(VISIT_KEY, {}); }
function catalogKeys() {
  const keys = [];
  tracks.forEach((track) => track.lessons.forEach((lesson) => keys.push(`${track.id}/${lesson.id}`)));
  return keys;
}

function recordVisit(hash) {
  const m = hash.match(/^#\/lesson\/([a-z]+)\/([a-z0-9-]+)/);
  if (!m) return;
  const id = `${m[1]}/${m[2]}`;
  if (!catalogKeys().includes(id)) return;
  const data = visited();
  data[id] = 1;
  writeStore(VISIT_KEY, data);
  const prog = readStore(PROGRESS_KEY, { lessons: {}, quizzes: {} });
  if (!prog.lessons[id]) {
    prog.lessons[id] = "opened";
    writeStore(PROGRESS_KEY, prog);
  }
  document.dispatchEvent(new CustomEvent("lab:lesson", { detail: { id, state: prog.lessons[id] === "passed" ? "passed" : "opened" } }));
}

/* One count for the top bar, the bottom bar and the side menu.
   A lesson counts once it has been opened or its checks have passed.
   Keys that are not in the catalog are ignored, so the two stores cannot drift apart. */
export function progressInfo() {
  const valid = new Set(catalogKeys());
  const seen = new Set();
  Object.keys(visited()).forEach((key) => { if (valid.has(key)) seen.add(key); });
  const stored = readStore(PROGRESS_KEY, { lessons: {} });
  Object.keys(stored.lessons || {}).forEach((key) => { if (valid.has(key)) seen.add(key); });
  const done = seen.size;
  const total = valid.size || lessonCount;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* ---------- navigation helpers ---------- */
function currentHash() { return location.hash || "#/"; }

const START_LOOP = { href: "#/section/start", title: "Start Here", loop: true };

export function neighbors(hash = currentHash()) {
  const idx = sequence.findIndex((item) => item.href === hash);
  if (idx >= 0) {
    const prev = sequence[idx - 1] || { href: "#/", title: "Home" };
    const next = sequence[idx + 1] || START_LOOP;
    return { prev, next };
  }
  const id = sectionFor(hash);
  if (id) {
    const si = sections.findIndex((s) => s.id === id);
    const prev = sections[si - 1] || { href: "#/", title: "Home" };
    const next = sections[si + 1];
    return {
      prev: { href: prev.href, title: prev.title },
      next: next ? { href: next.href, title: next.title } : START_LOOP,
    };
  }
  return { prev: null, next: { href: sections[0].href, title: sections[0].title } };
}

function openedKeys() {
  const valid = new Set(catalogKeys());
  const seen = new Set();
  Object.keys(visited()).forEach((key) => { if (valid.has(key)) seen.add(key); });
  const stored = readStore(PROGRESS_KEY, { lessons: {} });
  Object.keys(stored.lessons || {}).forEach((key) => { if (valid.has(key)) seen.add(key); });
  return seen;
}

function sectionStats() {
  const opened = openedKeys();
  const stats = {};
  tracks.forEach((track) => {
    track.lessons.forEach((lesson) => {
      const id = sectionFor(`#/lesson/${track.id}/${lesson.id}`);
      if (!id) return;
      const row = stats[id] || (stats[id] = { done: 0, total: 0 });
      row.total += 1;
      if (opened.has(`${track.id}/${lesson.id}`)) row.done += 1;
    });
  });
  return stats;
}

/* ---------- sidebar ---------- */
function sideLink(href, section, title, desc, icon) {
  return `<a class="side-item" href="${esc(href)}" data-section="${esc(section)}" data-tip="${esc(title)}">
      <span class="side-ico">${rawIcon(icon, 22)}</span>
      <span class="side-text"><span class="side-label">${esc(title)}</span><span class="side-desc">${esc(desc)}</span><span class="side-count" data-section-count="${esc(section)}"></span></span></a>`;
}

function buildSidebar() {
  const aside = $("#sidemenu");
  const byId = Object.fromEntries(sections.map((section) => [section.id, section]));
  const sectionRow = (id) => {
    const section = byId[id];
    return sideLink(section.href, section.id, section.title, section.menu, section.icon);
  };
  const groups = [
    ["Learn", ["start", "fundamentals", "flows", "methods", "modules"].map(sectionRow).join("")],
    ["Practise", [
      sectionRow("labs"),
      sectionRow("games"),
      sideLink("#/quizzes", "quizzes", "Quizzes", "Short checks with an explanation and a source.", "quizzes"),
    ].join("")],
    ["Explore", [
      sideLink("#/", "home", "Home", "The lab lobby with a 3D scene.", "home"),
      sideLink("#/worlds", "worlds", "Worlds", "Eleven 3D worlds and the level map.", "rooms"),
      sideLink("#/slides", "slides", "Slides", "Short decks you can click through.", "rooms"),
      sideLink("#/guides", "guides", "Guides", "Longer reads with a diagram and sources.", "fundamentals"),
      sideLink("#/diagrams", "diagrams", "Diagrams", "Maps of how Python runs and imports.", "ecosystem"),
      sectionRow("integrations"),
      sectionRow("lifetime"),
      sideLink("#/path", "path", "Curriculum map", "Every lesson, grouped from first steps to interview practice.", "start"),
    ].join("")],
    ["Resources", [
      sectionRow("resources"),
      sideLink("#/downloads", "download-center", "Downloads", "PDF, Word, PowerPoint, HTML and images.", "downloads"),
      sideLink("#/sources", "sources", "Sources", "The official pages behind the facts.", "sources"),
      sideLink("#/ecosystem/glossary", "glossary", "Glossary", "Terms worth keeping straight.", "ecosystem"),
      sideLink("#/about", "about", "About", "Who is sharing this lab, and why.", "about"),
    ].join("")],
  ];
  const nav = groups.map(([label, rows]) => `<div class="side-group"><p class="side-group-label">${label}</p>${rows}</div>`).join("");
  aside.innerHTML = `<div class="side-head"><span class="side-title">Menu</span>
      <button type="button" class="side-collapse" id="side-collapse" aria-label="Collapse the side menu" aria-expanded="true">${rawIcon("collapse", 18)}</button>
      <button type="button" class="side-close" id="side-close" aria-label="Close the menu">${rawIcon("close", 18)}</button></div>
    <nav class="side-nav" aria-label="Lab sections">${nav}</nav>
    <div class="side-foot"><div class="side-progress" aria-hidden="true"><i data-progress-fill></i></div><p class="side-foot-text" data-progress-text></p></div>`;
}

function syncRailLabels() {
  const collapsed = document.body.classList.contains("side-collapsed") && !isMobile();
  document.querySelectorAll("#sidemenu .side-item").forEach((link) => {
    const title = link.dataset.tip || link.querySelector(".side-label")?.textContent || "Menu";
    if (collapsed) link.setAttribute("aria-label", title);
    else link.removeAttribute("aria-label");
  });
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
  syncRailLabels();
  window.dispatchEvent(new Event("resize"));
}

function focusableIn(root) {
  return [...root.querySelectorAll("a, button")].filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    const style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

function setDrawer(open) {
  body.classList.toggle("side-open", open);
  const toggle = $("#menu-toggle");
  toggle?.setAttribute("aria-expanded", String(open));
  const scrim = $("#side-scrim");
  if (scrim) scrim.hidden = !open;
  if (open) {
    focusableIn($("#sidemenu"))[0]?.focus();
  } else if (toggle && $("#sidemenu")?.contains(document.activeElement)) {
    toggle.focus();
  }
}

function trapDrawer(event) {
  if (event.key !== "Tab" || !body.classList.contains("side-open")) return;
  const items = focusableIn($("#sidemenu"));
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ---------- top & bottom bars ---------- */
function updateBars() {
  const hash = currentHash();
  const id = hash.startsWith("#/worlds") ? "worlds" : hash.startsWith("#/downloads") ? "download-center"
    : (sectionFor(hash) || (hash === "#/" ? "home" : ""));
  document.querySelectorAll("#sidemenu .side-item").forEach((a) => {
    const on = a.dataset.section === id;
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const { prev, next } = neighbors(hash);
  const lessonMatch = hash.match(/^#\/lesson\/([a-z]+)\/([a-z0-9-]+)/);
  let lessonLine = "";
  if (lessonMatch) {
    const track = tracks.find((item) => item.id === lessonMatch[1]);
    const index = track?.lessons.findIndex((lesson) => lesson.id === lessonMatch[2]) ?? -1;
    if (track && index >= 0) lessonLine = `Lesson ${index + 1} of ${track.lessons.length}`;
  }
  const set = (el, target, label, fallback) => {
    if (!el) return;
    const name = el.querySelector(".bar-label");
    if (target && !target.disabled) {
      el.href = target.href;
      el.removeAttribute("aria-disabled");
      const visible = target.loop ? "Back to start ↺" : label;
      if (name) name.textContent = visible;
      const subText = target.loop ? "" : target.title;
      const accessible = [visible, subText].filter(Boolean).join(" ");
      el.setAttribute("aria-label", accessible);
      el.title = accessible;
      const sub = $(".bar-sub", el);
      if (sub) sub.textContent = target.loop ? "" : target.title;
    } else {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      if (name) name.textContent = fallback;
      el.setAttribute("aria-label", fallback);
      el.title = fallback;
      const sub = $(".bar-sub", el);
      if (sub) sub.textContent = "";
    }
  };
  set($("#bar-prev"), prev, "Prev", "Start");
  set($("#bar-next"), next, "Next", "Next");
  const { done, total, pct } = progressInfo();
  const txt = lessonLine ? `${lessonLine} · ${done}/${total} opened` : `${done} of ${total} lessons opened`;
  document.querySelectorAll(".bar-ring").forEach((ring) => ring.style.setProperty("--pct", String(pct)));
  const stats = sectionStats();
  document.querySelectorAll("[data-section-count]").forEach((node) => {
    const row = stats[node.dataset.sectionCount];
    const known = sections.some((section) => section.id === node.dataset.sectionCount);
    node.textContent = row && row.total ? `${row.done} of ${row.total} lessons opened` : (known ? "0 of 0 lessons opened" : "");
  });
  document.querySelectorAll("[data-progress-fill]").forEach((el) => { el.style.width = `${pct}%`; });
  document.querySelectorAll("[data-progress-text]").forEach((el) => { el.textContent = txt; });
  document.querySelectorAll("[role=progressbar]").forEach((el) => { el.setAttribute("aria-valuenow", String(pct)); el.setAttribute("aria-valuetext", txt); });
  const label = id === "home" ? "Home" : id === "worlds" ? "Worlds" : id === "download-center" ? "Downloads"
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
  const sheet = (open) => {
    body.classList.toggle("search-open", open);
    $("#search-toggle")?.setAttribute("aria-expanded", String(open));
    const scrim = $("#search-scrim");
    if (scrim) scrim.hidden = !open;
    if (open) input.focus();
    else close();
  };
  box.addEventListener("click", () => { input.value = ""; close(); sheet(false); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".top-search-wrap") && !e.target.closest("#search-toggle")) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && body.classList.contains("search-open")) { sheet(false); $("#search-toggle")?.focus(); return; }
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (isMobile()) sheet(true);
      else input.focus();
    }
  });
  $("#search-toggle")?.addEventListener("click", () => sheet(!body.classList.contains("search-open")));
  $("#search-scrim")?.addEventListener("click", () => sheet(false));
  window.addEventListener("hashchange", () => sheet(false));
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
      el.classList.add("is-tilting");
    });
    el.addEventListener("pointerleave", () => { el.classList.remove("is-tilting"); el.style.removeProperty("--tx"); el.style.removeProperty("--ty"); });
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
    trapDrawer(e);
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
  document.addEventListener("lab:lesson", () => updateBars());
}

export function firstUnvisited() {
  const seen = visited();
  return sequence.find((item) => {
    const m = item.href.match(/^#\/lesson\/([a-z]+)\/([a-z-]+)/);
    return m && !seen[`${m[1]}/${m[2]}`];
  }) || null;
}
export { currentHash, sectionFor };
