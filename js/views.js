/* Shared view helpers for the newer pages: flow strips, diagram frames, galleries. */
import { esc } from "./util.js";
import { icon } from "./icons.js";
import { sources } from "./content/sources.js";
import { diagrams, diagramById, diagramsFor } from "./content/diagrams.js";
import { bindTilt } from "./shell.js";

export function crumbs(parts) {
  const html = parts.map((part, index) => index === parts.length - 1
    ? `<span>${esc(part.label)}</span>`
    : `<a href="${esc(part.href)}">${esc(part.label)}</a>`).join("<span aria-hidden=\"true\">/</span>");
  return `<nav class="crumbs" aria-label="Breadcrumb">${html}</nav>`;
}

export function sourceList(ids) {
  const items = ids.map((id) => {
    const source = sources.find((item) => item.id === id);
    return `<li><a href="#/sources/${esc(id)}">${esc(source ? source.title : id)}</a></li>`;
  }).join("");
  return `<h2>Sources for this page</h2><ul>${items}</ul>`;
}

/** A row of chained steps with a pulse that travels along it. */
export function flowStrip(steps, label = "Flow") {
  return `<ol class="flow-strip" aria-label="${esc(label)}">${steps.map((s, i) => `<li style="--i:${i}"><span class="fs-dot">${i + 1}</span><span class="fs-text">${esc(s)}</span></li>`).join("")}</ol>`;
}

const themeMode = () => (document.documentElement.dataset.theme === "paper" ? "light" : "dark");
export const diagramSrc = (d) => `diagrams/${d.file}?theme=${themeMode()}`;

export function diagramFrame(d, height = 640) {
  return `<figure class="dframe" data-diagram="${esc(d.id)}">
    <div class="dframe-bar"><span class="pill">${esc(d.type)}</span><b>${esc(d.title)}</b>
      <a class="text-btn" href="#/diagram/${esc(d.id)}">Full page</a>
      <a class="text-btn" href="diagrams/${esc(d.file)}" target="_blank" rel="noopener">Open in a new tab</a>
      <a class="text-btn" href="diagrams/${esc(d.file)}" download>Download HTML</a></div>
    <iframe class="dframe-view" title="${esc(d.title)}. Interactive ${esc(d.type.toLowerCase())} diagram." src="${esc(diagramSrc(d))}" loading="lazy" allow="fullscreen" style="--h:${height}px"></iframe>
    <figcaption>${esc(d.blurb)}</figcaption>
  </figure>`;
}

export function diagramStrip(sectionId) {
  const list = diagramsFor(sectionId);
  if (!list.length) return "";
  return `<h2>Diagrams for this section</h2>
    <p class="muted">Interactive maps made with Archify. Use the views at the top of each diagram, or press Present for a full-screen walk-through.</p>
    <div class="dstrip">${list.slice(0, 3).map((d) => `<a class="dcard" data-tilt href="#/diagram/${esc(d.id)}"><span class="dc-top">${icon(d.icon)}<span class="pill">${esc(d.type)}</span></span><b>${esc(d.title)}</b><span class="dc-blurb">${esc(d.blurb)}</span>${flowStrip(d.steps.slice(0, 4), d.title)}</a>`).join("")}</div>
    <p><a class="text-btn" href="#/diagrams">All diagrams</a></p>`;
}

export function diagramsView() {
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/diagrams", label: "Diagrams" }])}
      <section class="sec-hero"><span class="sec-hero-ico">${icon("ecosystem")}</span>
        <div><h1>Diagrams</h1><p class="lede" data-speak>How Python runs, how imports and calls work, how the event loop schedules tasks, how a pandas pipeline flows, and how this lab runs Python in your browser. Each map is interactive: switch views, trace the paths, present full screen, or export.</p></div></section>
      ${flowStrip(["Source", "Bytecode", "Interpreter", "Objects", "Output"], "Python in five steps")}
      <div class="dgrid">${diagrams.map((d) => `<article class="dcard dcard-big" data-tilt>
        <span class="dc-top">${icon(d.icon)}<span class="pill">${esc(d.type)}</span></span>
        <h2><a href="#/diagram/${esc(d.id)}">${esc(d.title)}</a></h2><p>${esc(d.blurb)}</p>${flowStrip(d.steps, d.title)}
        <p class="dc-actions"><a class="primary" href="#/diagram/${esc(d.id)}">Open the map</a><a class="text-btn" href="diagrams/${esc(d.file)}" download>Download HTML</a></p></article>`).join("")}</div>
      <p class="muted">Made with <a href="#/sources/archify">Archify</a> (MIT). The JSON spec behind each map is stored in the repository under <code>diagrams/specs/</code>.</p>
      ${sourceList(["archify", "tutorial", "asyncio-docs", "pandas", "pyodide"])}`,
    after() { bindTilt(document.getElementById("main")); },
  };
}

export function diagramView(id) {
  const d = diagramById(id);
  if (!d) return null;
  const idx = diagrams.indexOf(d);
  const prev = diagrams[(idx + diagrams.length - 1) % diagrams.length];
  const next = diagrams[(idx + 1) % diagrams.length];
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/diagrams", label: "Diagrams" }, { href: `#/diagram/${d.id}`, label: d.title }])}
      <p class="kicker"><span class="pill">${esc(d.type)}</span><span class="pill">Archify showcase</span></p>
      <h1>${esc(d.title)}</h1>
      <p class="lede" data-speak>${esc(d.blurb)}</p>
      ${flowStrip(d.steps, d.title)}
      ${diagramFrame(d, 720)}
      <h2>What to notice</h2>
      <ul class="notice">${d.notice.map((n) => `<li data-speak>${esc(n)}</li>`).join("")}</ul>
      <h2>Go deeper</h2>
      <p class="chips">${d.related.map(([t, h]) => `<a class="text-btn" href="${esc(h)}">${esc(t)}</a>`).join("")}</p>
      <nav class="pager" aria-label="Diagrams"><a class="text-btn" href="#/diagram/${prev.id}">Previous: ${esc(prev.title)}</a><a class="text-btn" href="#/diagrams">All diagrams</a><a class="text-btn" href="#/diagram/${next.id}">Next: ${esc(next.title)}</a></nav>
      ${sourceList(d.sources)}`,
  };
}

/** Keep iframes in step with the page theme (Archify reads ?theme=). */
export function watchDiagramTheme() {
  new MutationObserver(() => {
    document.querySelectorAll("iframe.dframe-view").forEach((f) => {
      const d = diagramById(f.closest("[data-diagram]")?.dataset.diagram);
      if (d && !f.src.endsWith(`theme=${themeMode()}`)) f.src = diagramSrc(d);
    });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
