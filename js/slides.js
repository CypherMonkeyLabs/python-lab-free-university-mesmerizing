/* Slide-deck viewer: arrow keys, swipe, dots, full screen, print. */
import { esc } from "./util.js";
import { icon } from "./icons.js";
import { decks, deckById, slideCount } from "./content/slides.js";
import { crumbs, sourceList, flowStrip } from "./views.js";
import { bindTilt } from "./shell.js";

const KW = "def|class|return|if|elif|else|for|while|in|import|from|as|try|except|finally|with|async|await|yield|lambda|not|and|or|is|pass|break|continue|raise|assert";
const TOKEN = new RegExp(`(#.*$)|([frbt]?'(?:[^'\\\\\\n]|\\\\.)*'|[frbt]?"(?:[^"\\\\\\n]|\\\\.)*")|\\b(${KW})\\b|\\b(None|True|False)\\b|\\b(\\d+(?:\\.\\d+)?)\\b|(@\\w+)`, "gm");

export function highlight(code) {
  let out = "";
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? "tk-c" : m[2] ? "tk-s" : m[3] ? "tk-k" : m[4] ? "tk-b" : m[5] ? "tk-n" : "tk-d";
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

function viz(s) {
  if (s.viz === "terminal" && s.code) {
    return `<div class="term3d"><div class="term-bar"><i></i><i></i><i></i><span>python</span></div>
      <pre class="term-code"><code>${highlight(s.code)}</code></pre>${s.out ? `<pre class="term-out" aria-label="Output"><code>${esc(s.out)}</code></pre>` : ""}</div>${s.note ? `<p class="viz-note">${esc(s.note)}</p>` : ""}`;
  }
  if (s.viz === "layers") return `<div class="layers3d" role="img" aria-label="Layers: ${esc(s.layers.join(", "))}">${s.layers.map((l, i) => `<div class="layer" style="--i:${i}">${esc(l)}</div>`).join("")}</div>`;
  if (s.viz === "ring") return `<div class="ring3d" style="--n:${s.ring.length}" role="img" aria-label="Ring: ${esc(s.ring.join(", "))}"><div class="ring-spin">${s.ring.map((r, i) => `<span style="--i:${i}">${esc(r)}</span>`).join("")}</div><b class="ring-core">py</b></div>`;
  if (s.viz === "cards") return `<div class="fan3d" role="img" aria-label="${esc(s.cards.join(", "))}">${s.cards.map((c, i) => `<span class="fan-card" style="--i:${i}">${esc(c)}</span>`).join("")}</div>`;
  if (s.viz === "flow") return `<div class="flow3d">${flowStrip(s.steps, "Steps")}</div>`;
  return "";
}

export function slideHTML(s, i, total, deckTitle) {
  return `<article class="slide" aria-roledescription="slide" aria-label="${i + 1} of ${total}: ${esc(s.t)}">
    <div class="slide-copy"><p class="kicker"><span class="pill">${esc(deckTitle)}</span><span class="pill">${i + 1} / ${total}</span></p>
      <h2>${esc(s.t)}</h2><ul>${s.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      ${s.link ? `<p><a class="text-btn" href="${esc(s.link[1])}">${esc(s.link[0])}</a></p>` : ""}</div>
    <div class="slide-viz viz-${esc(s.viz || "none")}">${viz(s)}</div></article>`;
}

export function slidesIndexView() {
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/slides", label: "Slides" }])}
      <section class="sec-hero"><span class="sec-hero-ico">${icon("slides")}</span>
        <div><h1>Slides</h1><p class="lede" data-speak>${decks.length} decks and ${slideCount} slides, from your first hour to advanced topics. Press the left and right arrow keys, or swipe, to move. Every slide has a diagram, a 3D visual, or runnable-style code, and every deck lists its sources.</p></div></section>
      <div class="deck-grid">${decks.map((d, k) => `<article class="dcard dcard-big" data-tilt style="--i:${k}">
        <span class="dc-top">${icon(d.icon)}<span class="pill">${esc(d.level)}</span></span>
        <h2><a href="#/slides/${d.id}">${esc(d.title)}</a></h2><p>${esc(d.blurb)}</p>
        <p class="muted">${d.slides.length} slides</p>
        <p class="dc-actions"><a class="primary" href="#/slides/${d.id}">Start the deck</a><a class="text-btn" href="#/slides/${d.id}/1" data-print-deck="${d.id}">Print view</a></p></article>`).join("")}</div>
      <h2>Take the slides with you</h2>
      <p>Open a deck and use your browser's Print command to save it as a PDF. Every slide prints on its own page. The same text is in <a href="downloads/python-lab-slides.md" download>python-lab-slides.md</a>, and the code samples are in <a href="downloads/python-lab-code-samples.ipynb" download>python-lab-code-samples.ipynb</a>, a notebook you can open in Jupyter on your own computer.</p>
      ${sourceList(["tutorial", "whatsnew-314", "whatsnew-315", "asyncio-docs", "pandas"])}`,
    after() { bindTilt(document.getElementById("main")); },
  };
}

let teardown = null;

export function slidesView(id, nStr) {
  const deck = deckById(id);
  if (!deck) return null;
  const total = deck.slides.length;
  const start = Math.min(total, Math.max(1, parseInt(nStr, 10) || 1));
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/slides", label: "Slides" }, { href: `#/slides/${deck.id}`, label: deck.title }])}
      <section class="deck" data-deck="${esc(deck.id)}">
        <header class="deck-head"><h1>${esc(deck.title)}</h1><span class="pill">${esc(deck.level)}</span></header>
        <div class="deck-stage" id="deck-stage" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Slides: ${esc(deck.title)}. Use the left and right arrow keys."></div>
        <div class="deck-ctl" role="toolbar" aria-label="Slide controls">
          <button type="button" class="text-btn" id="deck-prev" aria-label="Previous slide">&larr; Prev</button>
          <div class="deck-dots" id="deck-dots" role="tablist" aria-label="Slides">${deck.slides.map((s, i) => `<button type="button" role="tab" class="dot" data-i="${i}" aria-label="Slide ${i + 1}: ${esc(s.t)}"></button>`).join("")}</div>
          <button type="button" class="primary" id="deck-next" aria-label="Next slide">Next &rarr;</button>
          <button type="button" class="text-btn" id="deck-full" aria-pressed="false">Full screen</button>
          <button type="button" class="text-btn" id="deck-print">Print</button>
        </div>
        <p class="muted deck-hint">Keys: <kbd>&larr;</kbd> <kbd>&rarr;</kbd> move, <kbd>Home</kbd> <kbd>End</kbd> jump, <kbd>F</kbd> full screen, <kbd>Esc</kbd> leave full screen. On a touch screen, swipe the slide.</p>
        <p class="muted" id="deck-live" aria-live="polite"></p>
      </section>
      <div class="deck-print" aria-hidden="true">${deck.slides.map((s, i) => slideHTML(s, i, total, deck.title)).join("")}</div>
      <nav class="pager" aria-label="Decks">${decks.map((d) => `<a class="text-btn" href="#/slides/${d.id}" ${d.id === deck.id ? 'aria-current="page"' : ""}>${esc(d.title)}</a>`).join("")}</nav>
      ${sourceList(deck.sources)}`,
    after() {
      teardown?.();
      const isCurrent = () => location.hash.startsWith(`#/slides/${deck.id}`);
      const stage = document.getElementById("deck-stage");
      const dots = [...document.querySelectorAll("#deck-dots .dot")];
      const live = document.getElementById("deck-live");
      const section = document.querySelector(".deck");
      let cur = start - 1;
      const show = (i, dir = 0) => {
        cur = Math.min(total - 1, Math.max(0, i));
        stage.innerHTML = slideHTML(deck.slides[cur], cur, total, deck.title);
        const el = stage.firstElementChild;
        if (dir) el.classList.add(dir > 0 ? "enter-next" : "enter-prev");
        dots.forEach((d, k) => { d.setAttribute("aria-selected", String(k === cur)); d.classList.toggle("on", k === cur); d.classList.toggle("seen", k < cur); });
        document.getElementById("deck-prev").disabled = cur === 0;
        document.getElementById("deck-next").disabled = cur === total - 1;
        live.textContent = `Slide ${cur + 1} of ${total}: ${deck.slides[cur].t}`;
        try { history.replaceState(null, "", `#/slides/${deck.id}/${cur + 1}`); } catch (err) { /* keep going */ }
        window.dispatchEvent(new Event("pythonlab:slide"));
      };
      const go = (d) => show(cur + d, d);
      document.getElementById("deck-prev").addEventListener("click", () => go(-1));
      document.getElementById("deck-next").addEventListener("click", () => go(1));
      dots.forEach((d) => d.addEventListener("click", () => show(+d.dataset.i, +d.dataset.i - cur)));
      const full = document.getElementById("deck-full");
      const setFull = (on) => { section.classList.toggle("deck-max", on); document.body.classList.toggle("deck-full", on); full.setAttribute("aria-pressed", String(on)); full.textContent = on ? "Exit full screen" : "Full screen"; };
      full.addEventListener("click", () => setFull(!section.classList.contains("deck-max")));
      document.getElementById("deck-print").addEventListener("click", () => window.print());
      const onKey = (e) => {
        if (!isCurrent()) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.body.classList.contains("howto-open")) return;
        if (document.activeElement?.closest("input, textarea, select, #lab-bot, #bot-panel, #howto")) return;
        if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
        else if (e.key === "Home") { e.preventDefault(); show(0, -1); }
        else if (e.key === "End") { e.preventDefault(); show(total - 1, 1); }
        else if (e.key === "f" || e.key === "F") { e.preventDefault(); setFull(!section.classList.contains("deck-max")); }
        else if (e.key === "Escape" && section.classList.contains("deck-max")) setFull(false);
      };
      document.addEventListener("keydown", onKey);
      let sx = 0, sy = 0, sid = null;
      stage.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse" && e.button !== 0) return; sx = e.clientX; sy = e.clientY; sid = e.pointerId; });
      stage.addEventListener("pointerup", (e) => {
        if (sid !== e.pointerId) return;
        sid = null;
        const dx = e.clientX - sx; const dy = e.clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      });
      stage.addEventListener("pointercancel", () => { sid = null; });
      show(cur, 0);
      // Remove the key handler and full-screen state when the route changes.
      const off = () => { document.removeEventListener("keydown", onKey); document.body.classList.remove("deck-full"); window.removeEventListener("hashchange", onHash); teardown = null; };
      const onHash = () => { if (!isCurrent()) off(); };
      window.addEventListener("hashchange", onHash);
      teardown = off;
    },
  };
}
