import { esc, codeBlock } from "./util.js";
import { icon } from "./icons.js";
import { guides, guideById } from "./content/guides.js";
import { diagramById } from "./content/diagrams.js";
import { deckById } from "./content/slides.js";
import { crumbs, sourceList, flowStrip, diagramFrame } from "./views.js";
import { bindTilt } from "./shell.js";
import { highlight } from "./slides.js";

export function guidesView() {
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/guides", label: "Guides" }])}
      <section class="sec-hero"><span class="sec-hero-ico">${icon("fundamentals")}</span>
        <div><h1>Guides</h1><p class="lede" data-speak>${guides.length} deeper pages. Each has a flow you can scan, cards, code with the output shown, an interactive diagram, a slide deck link, and sources. Code with output was run on CPython 3.14 before it was written down.</p></div></section>
      <div class="dgrid">${guides.map((g, k) => `<article class="dcard dcard-big" data-tilt style="--i:${k}"><span class="dc-top">${icon(g.icon)}<span class="pill">${esc(g.section)}</span></span>
        <h2><a href="#/guide/${esc(g.id)}">${esc(g.title)}</a></h2><p>${esc(g.blurb)}</p>${flowStrip(g.flow, g.title)}
        <p class="dc-actions"><a class="primary" href="#/guide/${esc(g.id)}">Read the guide</a></p></article>`).join("")}</div>
      ${sourceList(["tutorial", "whatsnew-314", "asyncio-docs", "pandas-10min", "venv"])}`,
    after() { bindTilt(document.getElementById("main")); },
  };
}

export function guideView(id) {
  const g = guideById(id);
  if (!g) return null;
  const dg = diagramById(g.diagram);
  const dg2 = g.diagram2 ? diagramById(g.diagram2) : null;
  const deck = deckById(g.deck);
  const i = guides.indexOf(g);
  const prev = guides[i - 1]; const next = guides[i + 1];
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/guides", label: "Guides" }, { href: `#/guide/${g.id}`, label: g.title }])}
      <section class="guide-hero" data-tilt-hero><div class="gh-copy"><h1>${esc(g.title)}</h1><p class="lede" data-speak>${esc(g.blurb)}</p>
        <p><a class="text-btn" href="#/section/${esc(g.section)}">Section: ${esc(g.section)}</a>${deck ? ` <a class="primary" href="#/slides/${deck.id}">Slides: ${esc(deck.title)}</a>` : ""}</p></div>
        <div class="layers3d gh-layers" aria-hidden="true">${g.flow.slice(0, 5).map((f, k) => `<div class="layer" style="--i:${k}">${esc(f)}</div>`).join("")}</div></section>
      ${g.body.map((p) => `<p>${esc(p)}</p>`).join("")}
      <h2>The flow</h2>${flowStrip(g.flow, g.title)}
      <h2>Key ideas</h2><div class="card-grid">${g.cards.map(([t, d]) => `<article class="g-card" data-reveal><b>${esc(t)}</b><span>${esc(d)}</span></article>`).join("")}</div>
      ${g.code ? `<h2>${g.out ? "Code and its output" : "An example"}</h2><div class="term3d g-term"><div class="term-bar"><i></i><i></i><i></i><span>${g.out ? "python" : "pyproject.toml"}</span></div><pre class="term-code"><code>${g.out ? highlight(g.code) : esc(g.code)}</code></pre>${g.out ? `<pre class="term-out" aria-label="Output"><code>${esc(g.out)}</code></pre>` : ""}</div>${g.note ? `<p class="viz-note">${esc(g.note)}</p>` : ""}${g.out && !g.note ? `<p class="muted">Paste this into the <a href="#/practice">practice desk</a> to run it yourself.</p>` : ""}` : ""}
      ${dg ? `<h2>Diagram</h2>${diagramFrame(dg, 560)}` : ""}${dg2 ? diagramFrame(dg2, 560) : ""}
      <nav class="pager" aria-label="Guides">${prev ? `<a class="text-btn" href="#/guide/${prev.id}">&larr; ${esc(prev.title)}</a>` : ""}<a class="text-btn" href="#/guides">All guides</a>${next ? `<a class="text-btn" href="#/guide/${next.id}">${esc(next.title)} &rarr;</a>` : ""}</nav>
      ${sourceList(g.sources)}`,
    after() { bindTilt(document.getElementById("main")); },
  };
}
