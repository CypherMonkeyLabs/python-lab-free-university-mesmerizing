/* Worlds: the eleven Levels as themed 3D studios (#/worlds, #/worlds/<n>). */
import { esc } from "./util.js";
import { icon } from "./icons.js";
import { levels, levelById } from "./content/levels.js";
import { diagramById } from "./content/diagrams.js";
import { crumbs, diagramFrame, flowStrip } from "./views.js";
import { studioMarkup } from "./studio/studio.js";
import { bindTilt } from "./shell.js";
import { moduleFor } from "./downloadcenter.js";

const glyphSvg = (g) => `<span class="lvl-glyph" aria-hidden="true">${icon({ seedling: "start", drop: "fundamentals", fork: "async", gear: "dsa", shelf: "dsa", anvil: "practice", conveyor: "automation", telescope: "ecosystem", turbine: "async", scroll: "sources", core: "rooms" }[g] || "rooms")}</span>`;

function levelCard(l) {
  const scene = l.scene === "fallback" ? "shared scene" : "own 3D scene";
  return `<a class="lvl-card" data-tilt href="#/worlds/${l.n}" style="--acc:${esc(l.accent)}">
    <span class="lvl-n">${l.n}</span>${glyphSvg(l.glyph)}
    <span class="lvl-name">${esc(l.name)}</span>
    <span class="lvl-blurb">${esc(l.blurb)}</span>
    <span class="lvl-meta"><span class="pill">${l.hours} h</span><span class="pill">${scene}</span>${l.module ? '<span class="pill pill-ok">downloads</span>' : ""}</span></a>`;
}

export function worldsView() {
  const map = diagramById("level-map");
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/worlds", label: "Worlds" }])}
      <h1>Worlds</h1>
      <p class="lede" data-speak>Eleven worlds, one for each Level. Pick any of them: the map suggests an order and never locks a Level. Levels 0 to 3 have their own 3D scene. Levels 4 to 10 share one scene tinted with their colour until their own scenes are built.</p>
      ${studioMarkup({ scene: "fallback", accent: "#f5a623", n: 0, title: "Campus of Eleven Worlds", alt: "A slowly turning wireframe shape over a violet and amber aurora, with drifting points of light.", })}
      <p class="muted studio-note">The 3D layer is decoration. Every link on this page works with it off. Change the 3D quality (Auto, Off, Flat, Light, Full) in <b>Display</b>.</p>
      <div class="lvl-grid">${levels.map(levelCard).join("")}</div>
      <h2>Level map</h2>
      ${flowStrip(levels.map((l) => `${l.n} ${l.name}`), "Levels 0 to 10 in the suggested order")}
      ${map ? diagramFrame(map, 520) : ""}`,
    after() { bindTilt(document.getElementById("main")); },
  };
}

export function worldView(n) {
  const l = levelById(n);
  if (!l) return null;
  const prev = levelById(l.n - 1); const next = levelById(l.n + 1);
  const mod = l.module ? moduleFor(l.module) : null;
  const lessons = l.lessons.map((h) => `<li><a href="${esc(h)}">${esc(h.replace(/^#\//, "").replace(/\//g, " / "))}</a></li>`).join("");
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/worlds", label: "Worlds" }, { href: `#/worlds/${l.n}`, label: `Level ${l.n}` }])}
      <p class="kicker"><span class="pill">Level ${l.n}</span><span class="pill">about ${l.hours} h</span><span class="pill">${l.scene === "fallback" ? "shared scene" : "own 3D scene"}</span></p>
      <h1 style="--acc:${esc(l.accent)}"><span class="h1-glyph" style="color:${esc(l.accent)}">${glyphSvg(l.glyph)}</span> ${esc(l.name)}</h1>
      <p class="lede" data-speak>${esc(l.blurb)}</p>
      ${studioMarkup({ scene: l.scene, accent: l.accent, n: l.n, title: `Level ${l.n}: ${l.name}`, alt: l.alt })}
      <div class="lvl-two">
        <section class="panel"><h2>Start here</h2><ul>${lessons}</ul>
          <p class="muted">The lessons are today's 54 lessons. A full map from Level to lesson comes with the content PR.</p></section>
        <section class="panel"><h2>Files for this Level</h2>
          ${mod ? `<p>${esc(mod.blurb)}</p><p><a class="primary" href="#/downloads/${esc(mod.id)}">Open in the Download Center</a></p><p class="muted">PDF, Word, PowerPoint, HTML and a cover image.</p>`
            : `<p>No files for this Level yet. Levels 0 to 3 have a download module today.</p><p><a class="text-btn" href="#/downloads">Download Center</a></p>`}</section>
      </div>
      <nav class="pager" aria-label="Levels">
        ${prev ? `<a class="text-btn" href="#/worlds/${prev.n}">Level ${prev.n}: ${esc(prev.name)}</a>` : ""}
        <a class="text-btn" href="#/worlds">All worlds</a>
        ${next ? `<a class="text-btn" href="#/worlds/${next.n}">Level ${next.n}: ${esc(next.name)}</a>` : ""}
      </nav>`,
    after() {},
  };
}
