/* The studio floor: clickable stations, a concept toy, and a click-to-run playground.
   The 3D backdrop is the existing same-origin studio. Stations work with CSS alone. */
import { esc } from "./util.js";
import { zodiacMonkeySvg } from "./cm-shared.js";
import { runStudent } from "./runner.js";
import { studioMarkup } from "./studio/studio.js";

const STATIONS = [
  { href: "#/lesson/start/how-to-use", title: "Bench", text: "How the lab is put together." },
  { href: "#/lesson/fundamentals/syntax", title: "Syntax desk", text: "Indentation, names, and types." },
  { href: "#/lesson/dsa/sequences", title: "Structure wall", text: "Lists, dicts, and what they cost." },
  { href: "#/practice", title: "Run bay", text: "CPython in the browser." },
  { href: "#/games", title: "Game table", text: "Loops and lists you can play." },
  { href: "#/downloads", title: "Print shelf", text: "Cheat sheets and level packs." },
];

const EXAMPLES = [
  {
    title: "Say hello",
    source: "print('Hello from the studio')\n",
  },
  {
    title: "Call stack",
    source: "def greet():\n    return 'hi'\n\ndef main():\n    return greet()\n\nprint(main())\n",
  },
  {
    title: "A small loop",
    source: "total = 0\nfor n in range(1, 4):\n    total += n\nprint(total)\n",
  },
];

export function studioTeaserHtml() {
  return `<section class="studio-floor studio-teaser" aria-labelledby="studio-teaser-h">
    <div class="studio-host">${zodiacMonkeySvg(72, "cm-host-svg")}<div>
      <h2 id="studio-teaser-h">Enter the studio</h2>
      <p>Cypher Monkey, a lifelong student and AI builder, keeps this floor open. Pick a station, step a call stack, or run a few lines. Nothing here is a job offer or a promise of pay.</p>
      <p><a class="primary" href="#/studio">Open the studio</a></p>
    </div></div>
  </section>`;
}

function stationHtml() {
  return STATIONS.map((station) => `<a class="station" href="${esc(station.href)}"><b>${esc(station.title)}</b><span>${esc(station.text)}</span></a>`).join("");
}

function exampleHtml() {
  return EXAMPLES.map((example, index) => `<article class="studio-example">
    <h3>${esc(example.title)}</h3>
    <pre><code>${esc(example.source)}</code></pre>
    <button type="button" class="text-btn" data-studio-run="${index}">Run</button>
    <pre class="studio-out" data-studio-out="${index}">Output appears here.</pre>
  </article>`).join("");
}

export function studioPageHtml() {
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span aria-hidden="true">/</span><span>Studio</span></nav>
    <section class="studio-floor" id="studio-floor">
      <div class="studio-host">
        ${zodiacMonkeySvg(88, "cm-host-svg")}
        <div>
          <h1>Studio</h1>
          <p class="lede" data-speak>A floor you can click. Cypher Monkey, a lifelong student and AI builder, is the host. The stations are lessons. The toys below are pictures of ideas from the Python tutorial and data model, not a second language runtime.</p>
        </div>
      </div>
      ${studioMarkup({ scene: "fallback", accent: "#7fe3d0", n: 0, alt: "A decorative wireframe in the studio. The stations below are the clickable part.", compact: true })}
      <h2>Stations</h2>
      <div class="station-stage">${stationHtml()}</div>
      <h2>Concept explorer</h2>
      <div class="concept-grid">
        <article class="concept" data-concept="stack">
          <h3>Call stack</h3>
          <p>Each function waits until the one it called returns. <a href="#/sources/datamodel">Data model</a>.</p>
          <div class="stack-view" data-stack-view aria-live="polite"></div>
          <div class="toolbar">
            <button type="button" class="text-btn" data-stack="push">Call</button>
            <button type="button" class="text-btn" data-stack="pop">Return</button>
          </div>
        </article>
        <article class="concept" data-concept="loop">
          <h3>Loop</h3>
          <p><code>for n in range(3)</code> binds <code>n</code>, then runs the body. <a href="#/sources/tutorial">Tutorial</a>.</p>
          <p class="loop-readout" data-loop-readout>n is not bound yet. total is 0.</p>
          <button type="button" class="text-btn" data-loop-step>Step</button>
        </article>
        <article class="concept" data-concept="list">
          <h3>List</h3>
          <p>Appending is cheap on average. Inserting at the front moves every later item. <a href="#/sources/timecomplexity">TimeComplexity</a>.</p>
          <ol class="list-view" data-list-view></ol>
          <div class="toolbar">
            <button type="button" class="text-btn" data-list="append">append</button>
            <button type="button" class="text-btn" data-list="front">insert at 0</button>
          </div>
        </article>
      </div>
      <h2>Click to run</h2>
      <p>These three examples run on the same CPython build as the practice page. The runtime downloads the first time you press Run.</p>
      <div class="example-grid">${exampleHtml()}</div>
    </section>`;
}

const NAMES = ["main", "greet", "format_name", "lookup"];

export function bindStudioFloor(root) {
  const floor = root.querySelector("#studio-floor");
  if (!floor || floor.dataset.bound === "1") return;
  floor.dataset.bound = "1";
  const stack = ["main"];
  const list = ["a", "b"];
  let step = -1;
  let total = 0;
  const stackView = floor.querySelector("[data-stack-view]");
  const loopView = floor.querySelector("[data-loop-readout]");
  const listView = floor.querySelector("[data-list-view]");

  const paintStack = () => {
    stackView.innerHTML = stack.map((name) => `<span>${esc(name)}</span>`).join("");
  };
  const paintList = () => {
    listView.innerHTML = list.map((item) => `<li>${esc(item)}</li>`).join("");
  };
  const paintLoop = () => {
    loopView.textContent = step < 0 ? "n is not bound yet. total is 0." : `n is ${step}. total is ${total}.`;
  };
  paintStack();
  paintList();
  paintLoop();

  floor.addEventListener("click", async (event) => {
    const stackBtn = event.target.closest("[data-stack]");
    if (stackBtn) {
      if (stackBtn.dataset.stack === "push" && stack.length < NAMES.length) stack.push(NAMES[stack.length]);
      if (stackBtn.dataset.stack === "pop" && stack.length > 1) stack.pop();
      paintStack();
      return;
    }
    if (event.target.closest("[data-loop-step]")) {
      step += 1;
      if (step > 2) { step = -1; total = 0; }
      else total += step;
      paintLoop();
      return;
    }
    const listBtn = event.target.closest("[data-list]");
    if (listBtn) {
      const label = String(list.length);
      if (listBtn.dataset.list === "append") list.push(label);
      if (listBtn.dataset.list === "front") list.unshift(label);
      paintList();
      return;
    }
    const runBtn = event.target.closest("[data-studio-run]");
    if (!runBtn) return;
    const index = Number(runBtn.dataset.studioRun);
    const example = EXAMPLES[index];
    const out = floor.querySelector(`[data-studio-out="${index}"]`);
    if (!example || !out) return;
    runBtn.disabled = true;
    out.textContent = "Starting the runtime…";
    try {
      const result = await runStudent({ source: example.source, checks: [], packages: [], onStatus: (msg) => { out.textContent = msg; } });
      const lines = [result.output, ...(result.failures || [])].filter((line) => line);
      out.textContent = lines.join("\n") || "(no output)";
    } catch (err) {
      out.textContent = err instanceof Error ? err.message : "The runtime did not start.";
    }
    runBtn.disabled = false;
  });
}
