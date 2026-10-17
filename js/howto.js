import { readStore, writeStore } from "./util.js";

const KEY = "pythonlab.howto.v2"; // v2: the Worlds and Download Center update, shown once more
const ZIP = "https://github.com/CypherMonkeyLabs/python-lab-free-university-mesmerizing/archive/refs/heads/main.zip";
let root = null;
let lastFocus = null;

const ico = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const card = (c1, c2, d, title, text) => `<div class="howto-card" style="--c1:${c1};--c2:${c2}"><span class="hc-ico">${ico(d)}</span><span><b>${title}</b><span class="hc-t">${text}</span></span></div>`;

function content() {
  return `
  <div class="howto-head"><span class="howto-mascot" aria-hidden="true">py</span><h2 id="howto-title">Welcome. Here is how to use Python Lab.</h2>
    <button type="button" class="howto-x" id="howto-x" aria-label="Close the help window">&times;</button></div>
  <div class="howto-body">
    <p class="howto-lede">Everything here is free, needs no account, and runs in your browser. This window opens once on your first visit. You can open it again any time with the <b>Help</b> button in the top bar.</p>

    <p class="howto-steps" aria-label="Three things to know"><span>1 Navigate</span><span>2 Download</span><span>3 View</span></p>
    <p class="howto-group">1. Navigate</p>
    <div class="howto-grid">
      ${card("#22d3ee", "#a78bfa", '<path d="M4 7h16M4 12h16M4 17h16"/>', "Left menu", "Ten sections, from Start Here to Resources. Use the double arrow to shrink it. On a phone, tap the Menu button.")}
      ${card("#fbbf24", "#f472b6", '<rect x="3" y="4" width="18" height="5" rx="2"/><path d="M7 14h10"/>', "Top bar", "Brand, search, your progress, Help, and Display (the four themes). It stays in place while you scroll.")}
      ${card("#34d399", "#22d3ee", '<path d="M5 16h14M8 12l-3 4 3 4M16 12l3 4-3 4"/>', "Bottom bar", "Prev and Next walk the lessons in order. Home returns to the lobby. A bar shows how many lessons you opened.")}
      ${card("#a78bfa", "#f472b6", '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', "Search", "Press <kbd>/</kbd> on a keyboard, or tap the magnifier on a phone. Type a word, then press Enter to open the first match.")}
    </div>

    <p class="howto-group">2. Download</p>
    <div class="howto-grid">
      ${card("#34d399", "#fbbf24", '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>', "Download Center", 'One card per Level with a PDF guide, Word worksheet, PowerPoint slides, web page and cover image. <a href="#/download-center" data-howto-go>Open the Download Center</a>.')}
      ${card("#fbbf24", "#34d399", '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>', "Cheat sheets and notebook", 'Four PDF and plain-text sheets, slides as Markdown, and a Jupyter notebook. <a href="#/downloads" data-howto-go>Open Downloads</a>.')}
      ${card("#34d399", "#22d3ee", '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>', "Offline copy", `The site is plain files. <a href="${ZIP}" rel="noopener">Download the whole lab as a ZIP</a> from GitHub, then run <code>python3 -m http.server</code> in the folder and open it. The slides as Markdown and a notebook of code samples are on the Downloads page.`)}
      ${card("#f472b6", "#a78bfa", '<path d="M7 8V4h10v4M7 17H5v-7h14v7h-2M7 14h10v6H7z"/>', "Print or save as PDF", "Use your browser's Print command on any lesson or slide deck. The menus step aside for print.")}
    </div>

    <p class="howto-group">3. View it your way</p>
    <div class="howto-grid">
      <div class="howto-card" style="--c1:#fbbf24;--c2:#fb7185"><span class="hc-ico">${ico('<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/>')}</span><span><b>Four themes</b><span class="hc-t">Pick one now. Your choice is remembered.</span>
        <span class="howto-themes" role="group" aria-label="Pick a theme"><button type="button" data-howto-theme="ink">Ink</button><button type="button" data-howto-theme="paper">Paper</button><button type="button" data-howto-theme="terminal">Terminal</button><button type="button" data-howto-theme="contrast">Contrast</button></span></span></div>
      ${card("#22d3ee", "#34d399", '<path d="M4 20V10L12 4l8 6v10"/><path d="M10 20v-6h4v6"/>', "3D worlds", 'Eleven themed worlds, one per Level. <a href="#/worlds" data-howto-go>Open the worlds</a>. Pick the 3D quality in Display. With reduced motion you get still pictures.')}
      ${card("#f472b6", "#fbbf24", '<path d="M4 5h16v11H4zM8 20h8M12 16v4"/>', "Slides", 'Slide decks from fundamentals to advanced. Use the left and right arrow keys, or swipe. <a href="#/slides" data-howto-go>Browse slides</a>.')}
      ${card("#a78bfa", "#22d3ee", '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>', "Videos and diagrams", 'Short clips sit on the home page. Architecture diagrams are under <a href="#/diagrams" data-howto-go>Diagrams</a>.')}
    </div>

    <p class="howto-group">4. Help is one tap away</p>
    <div class="howto-grid">
      ${card("#ff5da2", "#ffd43b", '<rect x="5" y="7" width="14" height="11" rx="4"/><path d="M12 7V4M9 12h.01M15 12h.01"/>', "Py, the lab bot", "The colourful bot near the corner. Tap it to open a helper with the next lesson, quick links, and this guide. Drag it out of the way, or use the arrow keys on it.")}
      ${card("#22d3ee", "#34d399", '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 10h.01M11 10h6M7 14h10"/>', "Keyboard", `<ul class="howto-keys"><li><kbd>/</kbd> search</li><li><kbd>?</kbd> this help</li><li><kbd>Esc</kbd> close</li><li><kbd>&larr;</kbd> <kbd>&rarr;</kbd> slides</li></ul>`)}
    </div>
  </div>
  <div class="howto-foot"><button type="button" class="primary" id="howto-ok">Got it, let me in</button><a class="text-btn" href="#/section/start" data-howto-go>Start Here</a><small>Closing this window is remembered on this device. Nothing leaves your browser.</small></div>`;
}

function build() {
  root = document.createElement("div");
  root.className = "howto-scrim";
  root.id = "howto";
  root.hidden = true;
  root.innerHTML = `<section class="howto" role="dialog" aria-modal="true" aria-labelledby="howto-title" tabindex="-1">${content()}</section>`;
  document.body.appendChild(root);
  root.addEventListener("click", (e) => {
    if (e.target === root || e.target.closest("#howto-x") || e.target.closest("#howto-ok") || e.target.closest("[data-howto-go]")) closeHowTo();
    const t = e.target.closest("[data-howto-theme]");
    if (t) document.querySelector(`[data-theme-set="${t.dataset.howtoTheme}"]`)?.click();
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); closeHowTo(); return; }
    if (e.key !== "Tab") return;
    const f = [...root.querySelectorAll("a[href], button")].filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

export function isHowToOpen() { return !!root && !root.hidden; }

export function openHowTo() {
  if (!root) build();
  if (!root.hidden) return;
  lastFocus = document.activeElement;
  root.hidden = false;
  document.body.classList.add("howto-open");
  root.querySelector(".howto").scrollTop = 0;
  root.querySelector("#howto-ok").focus({ preventScroll: true });
}

export function closeHowTo() {
  if (!root || root.hidden) return;
  root.hidden = true;
  document.body.classList.remove("howto-open");
  writeStore(KEY, { seen: true, at: new Date().toISOString().slice(0, 10) });
  if (lastFocus && document.contains(lastFocus) && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
}

export function initHowTo() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-help]")) { e.preventDefault(); openHowTo(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "?" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openHowTo();
    }
  });
  if (!readStore(KEY, null)) setTimeout(openHowTo, 900);
}
