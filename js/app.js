import { decks, slideCount } from "./content/slides.js";
import { guides } from "./content/guides.js";
import { diagrams } from "./content/diagrams.js";
import { guidesView, guideView } from "./guideviews.js";
import { slidesView, slidesIndexView } from "./slides.js";
import { extras, tracks, trackById, lessonRef } from "./content/catalog.js";
import { sources } from "./content/sources.js";
import { ecosystem } from "./content/ecosystem.js";
import { icon } from "./icons.js";
import { esc, markLesson, markQuiz, progress, THEME_KEY } from "./util.js";
import { initBot, keepBotClear } from "./bot.js";
import { bindSpeech, stopSpeech } from "./speech.js";
import { drawDiagrams } from "./diagrams.js";
import { mountGame, stopGame } from "./games.js";
import { runStudent } from "./runner.js";
import { sections } from "./content/sections.js";
import { initShell, bindTilt, bindHeroParallax } from "./shell.js";
import { initBotPanel } from "./botpanel.js";
import { initHowTo } from "./howto.js";
import { initBotFx } from "./botfx.js";
import { initTeachReactions } from "./botteach.js";
import { mountStudio, disposeStudio, initQualityControl, studioMarkup } from "./studio/studio.js";
import { worldsView, worldView, homeWorlds } from "./levelworlds.js";
import { downloadCenterView } from "./downloadcenter.js";
import { diagramsView, diagramView, diagramStrip, watchDiagramTheme } from "./views.js";
import { applyPrefs } from "./prefs.js";
import { applyWorld } from "./worlds.js";
import { initFx } from "./fx.js";
import { initXP } from "./xp.js";
import { initDisplay } from "./display.js";
import { initTour } from "./tour.js";
import { initWelcome } from "./welcome.js";
import { levelView, meView } from "./views2.js";
import { PLAY, BONUS_PUZZLES } from "./play.js";
import { DOWNLOADS, FORMAT_LABEL } from "./content/downloads.js";
import { initPy } from "./pycustom.js";
import { initPWA } from "./pwa.js";
import { zodiacBrandPill } from "./cm-shared.js";
import { initVoice } from "./voice.js";
import { studioTeaserHtml, studioPageHtml, bindStudioFloor } from "./studio-floor.js";

const main = () => document.getElementById("main");
let viewToken = 0;
let stopOrbit = () => {};
let booted = false;

const THEME_COLORS = {
  ink: "#12161c",
  paper: "#f6f1e7",
  terminal: "#0c1210",
  contrast: "#000",
};

function applyTheme(theme, persist = true) {
  const next = THEME_COLORS[theme] ? theme : "ink";
  document.documentElement.dataset.theme = next;
  document.querySelectorAll("[data-theme-set]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeSet === next));
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[next]);
  if (persist) {
    try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* keep the theme for this visit */ }
  }
}

function parseRoute() {
  const parts = (location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  const [head, a, b] = parts;
  if (head === "section" && a) return { name: "section", id: a };
  if (head === "track" && a) return { name: "track", id: a };
  if (head === "lesson" && a && b) return { name: "lesson", track: a, lesson: b };
  if (head === "games" && a) return { name: "game", id: a };
  if (head === "games") return { name: "games" };
  if (head === "level" && a) return { name: "level", n: Number(a) };
  if (head === "me") return { name: "me" };
  if (head === "quiz" && a) return { name: "quiz", id: a };
  if (head === "quizzes") return { name: "quizzes" };
  if (head === "ecosystem") return { name: "ecosystem", panel: a || "glossary" };
  if (head === "rooms") return { name: "rooms", id: a || "lobby" };
  if (head === "slides") return { name: "slides", id: a || "", n: b || "" };
  if (head === "guides") return { name: "guides" };
  if (head === "guide" && a) return { name: "guide", id: a };
  if (head === "diagrams") return { name: "diagrams" };
  if (head === "diagram" && a) return { name: "diagram", id: a };
  if (head === "worlds") return a ? { name: "world", id: a } : { name: "worlds" };
  if (head === "download-center") return { name: "download-center", id: a || "" };
  if (head === "sources") return { name: "sources", id: a || "" };
  if (head === "downloads") return { name: "downloads", id: a || "" };
  if (head === "studio") return { name: "studio" };
  if (["practice", "about"].includes(head)) return { name: head };
  return { name: "missing" };
}

function menuCard(item) {
  return `<a class="menu-card" href="${esc(item.href)}">
    <span class="menu-top">${icon(item.icon)}<span><span class="menu-label">${esc(item.title)}</span><span class="menu-desc">${esc(item.menu)}</span></span></span>
  </a>`;
}

function crumbs(parts) {
  const html = parts.map((part, index) => index === parts.length - 1
    ? `<span>${esc(part.label)}</span>`
    : `<a href="${esc(part.href)}">${esc(part.label)}</a>`).join("<span aria-hidden=\"true\">/</span>");
  return `<nav class="crumbs" aria-label="Breadcrumb">${html}</nav>`;
}

function roomScene({ title, cards, screen }) {
  const floats = cards.slice(0, 3).map((card, index) => {
    const name = ["a", "b", "c"][index];
    return `<div class="float-card float-${name}">${esc(card)}</div>`;
  }).join("");
  const flat = cards.map((card) => `<span class="pill">${esc(card)}</span>`).join("");
  return `<section class="room">
    <div class="room-stage" aria-hidden="true">
      <div class="room-wallback"></div>
      <div class="room-floor"></div>
      <div class="desk"></div>
      <div class="prop book"></div>
      <div class="prop lamp"></div>
      <div class="prop monitor"><span>${esc(screen)}</span></div>
      ${floats}
    </div>
    <div class="room-flat">${flat}</div>
    <p class="room-caption">${esc(title)} This room is CSS 3D. If you prefer reduced motion, the same labels sit in a flat list.</p>
  </section>`;
}

function diagramFig(source, caption) {
  if (!source) return "";
  return `<figure class="diagram"><pre class="diagram-source" hidden>${esc(source)}</pre><div class="diagram-host" role="img" aria-label="${esc(caption)}"></div><figcaption>${esc(caption)}</figcaption></figure>`;
}

function sourceLinks(ids) {
  const items = ids.map((id) => {
    const source = sources.find((item) => item.id === id);
    const label = source ? source.title : id;
    return `<li><a href="#/sources/${esc(id)}">${esc(label)}</a></li>`;
  }).join("");
  return `<h2>Sources for this page</h2><ul>${items}</ul>`;
}

function exerciseBlock(exercise) {
  if (!exercise) return "";
  return `<section class="panel" id="exercise">
    <h2>Try it</h2>
    <p data-speak>${esc(exercise.prompt)}</p>
    <label class="muted" for="editor">Your Python</label>
    <textarea id="editor" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
    <div class="toolbar">
      <button type="button" class="primary" id="run-code">Run checks</button>
      <button type="button" class="text-btn" id="reset-code">Restore starter</button>
    </div>
    <p class="muted" id="run-status">The browser runtime is Pyodide 314.0.7 with CPython 3.14.2. It starts when you run.</p>
    <h3>Output</h3>
    <div class="output" id="output">Output appears here after you run.</div>
    <div class="check-list" id="checks"></div>
  </section>`;
}

function heroScene() {
  const faces = ["def", "class", "import", "async", "[ ]", "py"].map((t, i) => `<div class="cube-face f${i}">${esc(t)}</div>`).join("");
  const chips = [["Flows", "a"], ["Methods", "b"], ["Modules", "c"], ["Labs", "d"], ["Games", "e"]].map(([t, k]) => `<div class="hero-chip chip-${k}">${t}</div>`).join("");
  return `<div class="stage3d" aria-hidden="true">
      <div class="grid-floor"></div>
      <div class="scene3d">
        <div class="orbit-ring ring-1"></div><div class="orbit-ring ring-2"></div>
        <div class="cube">${faces}</div>
        ${chips}
        <div class="slab slab-code"><span>&gt;&gt;&gt; print("hello")</span><span>hello</span></div>
      </div>
    </div>`;
}

function sectionTile(s, index) {
  return `<a class="sec-tile" data-tilt href="${esc(s.href)}" style="--i:${index}">
    <span class="sec-ico">${icon(s.icon)}</span>
    <span class="sec-title">${esc(s.title)}</span>
    <span class="sec-desc">${esc(s.menu)}</span></a>`;
}

function sectionView(id) {
  const section = sections.find((item) => item.id === id);
  if (!section) return missingView();
  const links = section.links();
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: section.href, label: section.title }])}
      <section class="sec-hero" data-tilt-hero>
        <span class="sec-hero-ico">${icon(section.icon)}</span>
        <div><h1>${esc(section.title)}</h1><p class="lede" data-speak>${esc(section.intro)}</p></div>
      </section>
      <div class="card-grid">${links.map((link) => `<a class="lesson-row" data-tilt href="${esc(link.href)}">
        <span class="row-top">${icon(link.icon || section.icon)}<span><span class="row-label">${esc(link.title)}</span><span class="row-desc">${esc(link.desc)}</span></span></span></a>`).join("")}</div>
      ${diagramStrip(id)}
      <h2>Other sections</h2>
      <div class="sec-grid">${sections.filter((item) => item.id !== id).map(sectionTile).join("")}</div>`,
    after() { bindTilt(main()); },
  };
}

function homeView() {
  const cards = [
    ...tracks.map((track) => ({ href: `#/track/${track.id}`, title: track.title, menu: track.menu, icon: track.icon })),
    ...extras,
  ];
  return {
    html: `<section class="hero3d">
        <div class="hero-copy">
          <p class="kicker"><span class="pill">Free</span><span class="pill">Static</span><span class="pill">No account</span><span class="pill">Runs in your browser</span></p>
          <h1>Python Lab</h1>
          <p class="lede" data-speak>A free study university for anyone learning Python, for as long as you want to stay. It starts at the first line and keeps going through flows, methods, modules, labs, integrations, and a lifetime of learning.</p>
          <div class="hero-cta">
            <a class="primary cta" href="#/section/start">Start here</a>
            <a class="text-btn cta" href="#/practice">Open a lab</a>
            <a class="text-btn cta" href="#/section/resources">Resources</a>
          </div>
          <p class="hero-hint">Use the menu (left side, or the ☰ button on a phone) or tap the bot for a guide.</p>
        </div>
        ${heroScene()}
        ${studioMarkup({ scene: "fallback", accent: "#f5a623", n: 0, alt: "A slowly turning wireframe shape over a violet and amber aurora.", compact: true })}
      </section>
      ${homeWorlds()}
      ${studioTeaserHtml()}
      <h2 class="sec-heading">${sections.length} sections, one path</h2>
      <p class="sec-sub">Every section opens a landing page with its lessons, labs, and links.</p>
      <div class="sec-grid">${sections.map(sectionTile).join("")}</div>
      <section class="home-decks" aria-labelledby="hd-h"><div><h2 id="hd-h">Slides and guides</h2>
        <p>${decks.length} slide decks (${slideCount} slides) from your first hour to advanced topics, and ${guides.length} guides with diagrams and checked code. Arrow keys or swipe.</p>
        <p><a class="primary" href="#/slides">Open the slides</a> <a class="text-btn" href="#/guides">Read the guides</a> <a class="text-btn" href="#/diagrams">See the diagrams</a></p></div>
        <div class="ring3d" style="--n:${decks.length}" aria-hidden="true"><div class="ring-spin">${decks.map((d, i) => `<span style="--i:${i}">${esc(d.title.split(" ").slice(0, 3).join(" "))}</span>`).join("")}</div><b class="ring-core">py</b></div></section>
      <p data-speak>Cypher Monkey is a lifelong student and an AI builder. Lucky is moving into AI omni-channel agents, and this lab is the notebook he is willing to share: cited, runnable in the browser, and free of invented salary claims.</p>
      ${roomScene({ title: "Lobby of the lab.", cards: ["Syntax", "Data", "Agents"], screen: "print('hello')" })}
      <section class="clips" id="clips">
        <h2>Motion &amp; Visual Explainers, without Flash</h2>
        <p>These short clips and animated explainers were generated for the lab with Python and ffmpeg (licensed CC BY-NC-SA 4.0 / MIT). Each visualises a core Python concept cited in <a href="#/sources">Sources</a>.</p>
        <div class="clip-grid">
          <figure>
            <video controls playsinline preload="metadata" poster="media/typing-poster.jpg">
              <source src="media/typing.mp4" type="video/mp4">
            </video>
            <figcaption>MP4 · First program: <code>print('hi')</code> appearing one character at a time (<a href="#/sources/tutorial">Tutorial</a>).</figcaption>
          </figure>
          <figure>
            <video controls playsinline preload="metadata" poster="media/orbit-poster.jpg">
              <source src="media/lab-orbit.webm" type="video/webm">
            </video>
            <figcaption>WebM · Orbiting state in the lab palette.</figcaption>
          </figure>
          <figure>
            <video controls playsinline preload="metadata" poster="media/list-comp-poster.jpg">
              <source src="media/list-comprehension.mp4" type="video/mp4">
            </video>
            <figcaption>MP4 · List comprehension filter &amp; map step by step (<a href="#/sources/stdtypes">Built-in types</a>).</figcaption>
          </figure>
          <figure>
            <video controls playsinline preload="metadata" poster="media/dict-poster.jpg">
              <source src="media/dict-lookup.webm" type="video/webm">
            </video>
            <figcaption>WebM · Dictionary hash bucket lookup in CPython (<a href="#/sources/timecomplexity">TimeComplexity</a>).</figcaption>
          </figure>
          <figure>
            <img src="media/indent.gif" alt="Three bars step down and to the right, one level at a time, as a picture of indentation.">
            <figcaption>GIF · Four-space indentation blocks (<a href="#/sources/lexical">Lexical analysis</a>).</figcaption>
          </figure>
          <figure>
            <img src="media/async-loop.gif" alt="Two tasks interleaving on a single thread while awaiting I/O in asyncio.">
            <figcaption>GIF · Single-thread cooperative <code>await</code> in <code>asyncio</code> (<a href="#/sources/asyncio-docs">asyncio</a>).</figcaption>
          </figure>
          <figure>
            <canvas id="orbit-canvas" aria-label="HTML5 canvas animation of a satellite circling a core"></canvas>
            <figcaption>HTML5 canvas · Holds still if your system asks for reduced motion.</figcaption>
          </figure>
        </div>
      </section>
      <section class="audio-section" id="audio-lessons" aria-labelledby="audio-h">
        <h2 id="audio-h">Spoken Audio Lessons (Offline MP3)</h2>
        <p>Listen to short, cited audio briefings offline or while you read. Every lesson page also has a browser <b>Read aloud</b> button.</p>
        <div class="audio-grid">
          <article class="audio-card">
            <h3>1. Names, Types &amp; Indentation</h3>
            <p>Four-space blocks, name binding vs. copying, and mutable vs. immutable built-in types (<a href="#/sources/lexical">Lexical analysis</a>, <a href="#/sources/datamodel">Data model</a>).</p>
            <audio controls preload="metadata" data-voice-slot="syntax" src="media/audio-syntax.mp3"></audio>
          </article>
          <article class="audio-card">
            <h3>2. Choosing the Right Data Structure</h3>
            <p>CPython list amortized append vs. linear front insert, plus average O(1) dict/set hashing (<a href="#/sources/stdtypes">Built-in types</a>, <a href="#/sources/timecomplexity">TimeComplexity</a>).</p>
            <audio controls preload="metadata" data-voice-slot="structures" src="media/audio-structures.mp3"></audio>
          </article>
          <article class="audio-card">
            <h3>3. Generators &amp; Async Coroutines</h3>
            <p>Lazy iteration with <code>yield</code> and single-thread cooperative multitasking with <code>async</code> / <code>await</code> (<a href="#/sources/asyncio-docs">asyncio</a>).</p>
            <audio controls preload="metadata" data-voice-slot="async" src="media/audio-async.mp3"></audio>
          </article>
          <article class="audio-card">
            <h3>4. Interview Problem-Solving Checklist</h3>
            <p>Clarifying inputs, edge cases, hand tracing, and stating honest CPython time/space costs (<a href="#/sources/timecomplexity">TimeComplexity</a>, <a href="#/sources/functools">functools</a>).</p>
            <audio controls preload="metadata" data-voice-slot="interview" src="media/audio-interview.mp3"></audio>
          </article>
        </div>
      </section>
      <h2>Topics</h2>
      <label class="filter">Filter the menu
        <input id="menu-filter" type="search" placeholder="Filter topics" autocomplete="off">
      </label>
      <div class="menu-grid" id="menu-grid">${cards.map(menuCard).join("")}</div>
      <p class="empty" id="menu-empty" hidden>No topic matches that filter.</p>`,
    after(token) {
      bindTilt(main());
      bindHeroParallax(main());
      startOrbit();
      const input = document.getElementById("menu-filter");
      const empty = document.getElementById("menu-empty");
      input?.addEventListener("input", () => {
        if (token !== viewToken) return;
        const query = input.value.trim().toLowerCase();
        let shown = 0;
        document.querySelectorAll("#menu-grid .menu-card").forEach((card) => {
          const hit = card.innerText.toLowerCase().includes(query);
          card.hidden = !hit;
          if (hit) shown += 1;
        });
        empty.hidden = shown !== 0;
      });
    },
  };
}

function trackView(id) {
  const track = trackById(id);
  if (!track) return missingView();
  const done = progress().lessons;
  const rows = track.lessons.map((lesson) => `<a class="lesson-row" href="#/lesson/${track.id}/${lesson.id}">
      <span class="row-top">${icon(track.icon)}<span>
        <span class="row-label">${esc(lesson.title)}</span>
        <span class="row-desc">${esc(lesson.summary)}</span>
      </span></span>
      <span class="kicker"><span class="pill">${esc(lesson.level)}</span><span class="pill">${lesson.minutes} min read</span>${done[`${track.id}/${lesson.id}`] === "passed" ? '<span class="pill">Checks passed</span>' : ""}</span>
    </a>`).join("");
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: `#/track/${track.id}`, label: track.title }])}
      <h1>${esc(track.title)}</h1>
      <p class="lede" data-speak>${esc(track.intro)}</p>
      ${roomScene({ title: track.title + " studio.", cards: track.lessons.slice(0, 3).map((lesson) => lesson.title), screen: "py" })}
      <div class="card-grid">${rows}</div>
      ${track.quiz?.length ? `<p><a class="text-btn" href="#/quiz/${track.id}">Quiz for ${esc(track.title)}</a></p>` : ""}
      ${sourceLinks(track.sources || [])}`,
  };
}

function lessonView(trackId, lessonId) {
  const found = lessonRef(trackId, lessonId);
  if (!found) return missingView();
  const { track, lesson, prev, next } = found;
  const sections = lesson.sections.map((section) => `<section data-speak><h2>${esc(section.heading)}</h2>${section.html}</section>`).join("");
  const pager = `<nav class="pager" aria-label="Lesson">
      ${prev ? `<a class="text-btn" href="#/lesson/${track.id}/${prev.id}">Previous: ${esc(prev.title)}</a>` : ""}
      <a class="text-btn" href="#/track/${track.id}">All ${esc(track.title)}</a>
      ${next ? `<a class="text-btn" href="#/lesson/${track.id}/${next.id}">Next: ${esc(next.title)}</a>` : ""}
    </nav>`;
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: `#/track/${track.id}`, label: track.title }, { href: `#/lesson/${track.id}/${lesson.id}`, label: lesson.title }])}
      <p class="kicker"><span class="pill">${esc(lesson.level)}</span><span class="pill">${lesson.minutes} min read</span></p>
      <h1>${esc(lesson.title)}</h1>
      <p class="summary" data-speak>${esc(lesson.summary)}</p>
      <div class="toolbar">
        <button type="button" class="text-btn" data-speech>Read aloud</button>
        <span class="muted" data-speech-note>Read-aloud uses the speech built into your browser. The voice depends on the device.</span>
      </div>
      ${diagramFig(lesson.diagram, lesson.diagramCaption || "Diagram for this lesson")}
      ${sections}
      ${exerciseBlock(lesson.exercise)}
      ${sourceLinks(lesson.sources || track.sources || [])}
      ${pager}`,
    after(token) {
      bindSpeech(document.querySelector("[data-speech]"));
      const editor = document.getElementById("editor");
      if (editor && lesson.exercise) editor.value = lesson.exercise.starter;
      document.getElementById("reset-code")?.addEventListener("click", () => {
        if (editor && lesson.exercise) editor.value = lesson.exercise.starter;
      });
      document.getElementById("run-code")?.addEventListener("click", () => executeEditor({
        token,
        source: () => editor.value,
        checks: lesson.exercise.checks || [],
        packages: lesson.exercise.packages || [],
        lessonKey: `${track.id}/${lesson.id}`,
      }));
      drawDiagrams(main());
    },
  };
}

const INTERVIEW_CHALLENGES = {
  twosum: {
    title: "Two-Sum Indices (Dict Lookup)",
    summary: "Return (i, j) with i < j such that nums[i] + nums[j] == target in one pass using a dictionary.",
    source: "timecomplexity",
    code: `def two_sum(nums, target):
    seen = {}
    for i, val in enumerate(nums):
        need = target - val
        if need in seen:
            return (seen[need], i)
        seen[val] = i
    return None

assert two_sum([2, 7, 11, 15], 9) == (0, 1)
assert two_sum([3, 2, 4], 6) == (1, 2)
assert two_sum([1, 2, 3], 99) is None
print("Two-Sum passed all checks!")
`,
  },
  brackets: {
    title: "Balanced Brackets (Stack)",
    summary: "Use a Python list as a LIFO stack to verify matching (), [], and {} brackets.",
    source: "stdtypes",
    code: `def is_balanced(text):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return len(stack) == 0

assert is_balanced("([{}])") is True
assert is_balanced("([)]") is False
assert is_balanced("") is True
print("Balanced Brackets passed all checks!")
`,
  },
  rle: {
    title: "Run-Length Encoding (Iteration)",
    summary: "Compress consecutive identical characters into (char, count) pairs.",
    source: "itertools",
    code: `def encode_runs(text):
    if not text:
        return []
    out = []
    cur, count = text[0], 1
    for ch in text[1:]:
        if ch == cur:
            count += 1
        else:
            out.append((cur, count))
            cur, count = ch, 1
    out.append((cur, count))
    return out

assert encode_runs("aaabbc") == [("a", 3), ("b", 2), ("c", 1)]
assert encode_runs("") == []
print("Run-Length Encoding passed all checks!")
`,
  },
  window: {
    title: "Sliding Window Maximum Sum",
    summary: "Find the largest sum of k adjacent integers without recomputing every slice from scratch.",
    source: "stdtypes",
    code: `def max_k_sum(nums, k):
    if k <= 0 or k > len(nums):
        return 0
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        if window > best:
            best = window
    return best

assert max_k_sum([2, 1, 5, 1, 3, 2], 3) == 9
assert max_k_sum([4, -1, 2, 1], 2) == 3
print("Sliding Window passed all checks!")
`,
  },
};

function practiceView() {
  const starter = 'print("Hello from Python Lab")\n';
  const challengeCards = Object.entries(INTERVIEW_CHALLENGES).map(([k, c]) => `<article class="challenge-card" data-challenge-card="${esc(k)}">
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.summary)} (<a href="#/sources/${esc(c.source)}">Source</a>)</p>
      <div><button type="button" class="text-btn" data-challenge="${esc(k)}">Load challenge into editor</button></div>
    </article>`).join("");
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/practice", label: "Practice desk" }])}
      <div class="dc-brand-banner">${zodiacBrandPill({ size: 32, title: "CypherMonkey Labs Practice & Interview Desk", link: true })}</div>
      <h1>Practice desk</h1>
      <p class="lede" data-speak>This is a Python 3.14 interpreter compiled to WebAssembly and stored with the site. Your code stays in the browser. The first run reads the local runtime files, which are several megabytes.</p>
      <p>NumPy 2.4.6 and pandas 3.0.2 are included. There is no install from the public internet. Sockets and TLS are limited here, so treat this as a language desk, not a place to call other servers.</p>
      <label class="muted" for="editor">Your Python</label>
      <textarea id="editor" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
      <label class="muted" for="pkg">Local packages</label>
      <select id="pkg">
        <option value="">Standard library only</option>
        <option value="numpy">NumPy</option>
        <option value="pandas">pandas, which also brings NumPy</option>
      </select>
      <div class="toolbar">
        <button type="button" class="primary" id="run-code">Run</button>
        <button type="button" class="text-btn" data-snippet="names">Names</button>
        <button type="button" class="text-btn" data-snippet="loop">Loop</button>
        <button type="button" class="text-btn" data-snippet="function">Function</button>
      </div>
      <p class="muted" id="run-status">Runtime files: Pyodide 314.0.7, CPython 3.14.2. Press Run to start them.</p>
      <h2>Output</h2>
      <div class="output" id="output">Output appears here after you run.</div>
      <h2>Interview-Style Challenges (Runnable in Browser)</h2>
      <p>Load any challenge below into the editor, inspect the assertions, and press <b>Run</b> to verify your solution on CPython 3.14. Or open the full <a href="#/track/dsa">Data Structures &amp; Algorithms track</a>.</p>
      <div class="challenge-grid" id="interview-challenges">${challengeCards}</div>
      <section class="audio-section" id="audio-lessons">
        <h2>Audio Briefings While You Practice</h2>
        <div class="audio-grid">
          <article class="audio-card"><h3>🔊 Syntax &amp; Types</h3><audio controls preload="metadata" data-voice-slot="syntax" src="media/audio-syntax.mp3"></audio></article>
          <article class="audio-card"><h3>🔊 Data Structures Cost</h3><audio controls preload="metadata" data-voice-slot="structures" src="media/audio-structures.mp3"></audio></article>
          <article class="audio-card"><h3>🔊 Generators &amp; Async</h3><audio controls preload="metadata" data-voice-slot="async" src="media/audio-async.mp3"></audio></article>
          <article class="audio-card"><h3>🔊 Interview Checklist</h3><audio controls preload="metadata" data-voice-slot="interview" src="media/audio-interview.mp3"></audio></article>
        </div>
      </section>
      <section class="media-strip" id="video-explainers" aria-label="Visual explainers">
        <h2>Short Video &amp; Animated Explainers</h2>
        <div class="clip-grid">
          <figure><video controls playsinline preload="metadata" poster="media/typing-poster.jpg"><source src="media/typing.mp4" type="video/mp4"></video><figcaption>MP4 · First program (<a href="#/sources/tutorial">Tutorial</a>)</figcaption></figure>
          <figure><video controls playsinline preload="metadata" poster="media/list-comp-poster.jpg"><source src="media/list-comprehension.mp4" type="video/mp4"></video><figcaption>MP4 · List comprehension (<a href="#/sources/stdtypes">Built-in types</a>)</figcaption></figure>
          <figure><video controls playsinline preload="metadata" poster="media/dict-poster.jpg"><source src="media/dict-lookup.webm" type="video/webm"></video><figcaption>WebM · Dict hash lookup (<a href="#/sources/timecomplexity">TimeComplexity</a>)</figcaption></figure>
          <figure><img src="media/indent.gif" alt="Four-space indentation blocks"><figcaption>GIF · Indentation (<a href="#/sources/lexical">Lexical analysis</a>)</figcaption></figure>
          <figure><img src="media/async-loop.gif" alt="Two tasks interleaving on a single thread"><figcaption>GIF · Asyncio event loop (<a href="#/sources/asyncio-docs">asyncio</a>)</figcaption></figure>
        </div>
      </section>`,
    after(token) {
      const editor = document.getElementById("editor");
      editor.value = starter;
      const snippets = {
        names: 'language = "Python"\nyear = 2026\nprint(language, year)\n',
        loop: 'for n in range(3):\n    print(n)\n',
        function: 'def greet(name):\n    return f"Hello, {name}"\n\ngreet("Lucky")\n',
      };
      document.querySelectorAll("[data-snippet]").forEach((button) => {
        button.addEventListener("click", () => {
          editor.value = snippets[button.dataset.snippet];
        });
      });
      document.querySelectorAll("[data-challenge]").forEach((button) => {
        button.addEventListener("click", () => {
          const ch = INTERVIEW_CHALLENGES[button.dataset.challenge];
          if (ch) {
            editor.value = ch.code;
            editor.focus();
          }
        });
      });
      document.getElementById("run-code").addEventListener("click", () => {
        const selected = document.getElementById("pkg").value;
        executeEditor({
          token,
          source: () => editor.value,
          checks: [],
          packages: selected ? [selected] : [],
        });
      });
    },
  };
}

async function executeEditor({ token, source, checks, packages, lessonKey }) {
  const button = document.getElementById("run-code");
  const status = document.getElementById("run-status");
  const output = document.getElementById("output");
  const checksEl = document.getElementById("checks");
  if (!button || !output) return;
  button.disabled = true;
  const previous = button.textContent;
  button.textContent = "Running";
  try {
    const result = await runStudent({
      source: source(),
      checks,
      packages,
      onStatus: (message) => {
        if (token === viewToken && status) status.textContent = message;
      },
    });
    if (token !== viewToken) return;
    output.textContent = result.output || "(The code ran and printed nothing.)";
    if (checksEl) {
      checksEl.textContent = "";
      if (!checks.length) {
        checksEl.textContent = "";
      } else if (result.ok) {
        const line = document.createElement("p");
        line.className = "pass";
        line.textContent = `All ${checks.length} checks passed.`;
        checksEl.append(line);
        if (lessonKey) markLesson(lessonKey, "passed");
      } else {
        result.failures.forEach((failure) => {
          const line = document.createElement("p");
          line.className = "fail";
          line.textContent = failure;
          checksEl.append(line);
        });
      }
    }
    window.dispatchEvent(new CustomEvent("lab:result", { detail: { ok: !!result.ok, hasChecks: checks.length > 0, lessonKey } }));
    if (status) status.textContent = result.ok || !checks.length ? "Run finished." : "Run finished with failed checks.";
  } catch (err) {
    if (token !== viewToken) return;
    output.textContent = `The runtime stopped: ${err && err.message ? err.message : String(err)}`;
    if (status) status.textContent = "The runtime did not finish this run.";
  } finally {
    if (token === viewToken && button) {
      button.disabled = false;
      button.textContent = previous;
    }
  }
}

function gamesView() {
  const cards = [
    { href: "#/games/guess", title: "Guess the integer", menu: "Higher or lower, from 1 to 100.", icon: "games" },
    { href: "#/games/snake", title: "Snake", menu: "A small board you can steer with keys, swipes, or buttons.", icon: "games" },
    { href: "#/games/adventure", title: "Import Error", menu: "A text adventure about finding a missing module.", icon: "games" },
    ...PLAY.map((g) => ({ href: `#/games/${g.id}`, title: g.title, menu: `${g.menu} (${g.concept})`, icon: "games" })),
  ];
  const bonusHtml = BONUS_PUZZLES.map((g) => `<a class="lesson-row puzzle-card" href="#/games/${esc(g.id)}">
    <span class="row-top">${icon("games")}<span><span class="row-label">${esc(g.title)}</span><span class="row-desc">${esc(g.menu)} (${esc(g.concept)})</span></span></span></a>`).join("");
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/games", label: "Games" }])}
      <h1>Games</h1>
      <p class="lede">Visual games and puzzles that explain Python ideas, plus classics. They run in the browser, start immediately, and earn XP and badges stored only on this device. <a href="#/me">See my XP and badges</a>.</p>
      <div class="menu-grid">${cards.map(menuCard).join("")}</div>
      <h2>Interactive Data Structure &amp; Complexity Puzzles</h2>
      <div class="card-grid">${bonusHtml}</div>`,
  };
}

function gameView(id) {
  const titles = {
    guess: ["Guess the integer", "Find the hidden integer."],
    snake: ["Snake", "Eat the brass square. Do not hit the wall or yourself."],
    adventure: ["Import Error", "A text adventure in the lab building."],
    ...Object.fromEntries([...PLAY, ...BONUS_PUZZLES].map((g) => [g.id, [g.title, `${g.menu} Concept: ${g.concept}.`]])),
  };
  if (!titles[id]) return missingView();
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/games", label: "Games" }, { href: `#/games/${id}`, label: titles[id][0] }])}
      <h1>${esc(titles[id][0])}</h1>
      <p class="lede">${esc(titles[id][1])}</p>
      <div id="game-root"></div>`,
    after() { mountGame(id, document.getElementById("game-root")); },
  };
}

function quizzesView() {
  const cards = tracks.filter((track) => track.quiz?.length).map((track) => ({
    href: `#/quiz/${track.id}`,
    title: track.title,
    menu: `${track.quiz.length} questions with explanations.`,
    icon: "quizzes",
  }));
  cards.push({
    href: "#/quiz/interview",
    title: "Interview warm-up",
    menu: "Mixed questions about language behavior, not about a secret employer list.",
    icon: "quizzes",
  });
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/quizzes", label: "Quizzes" }])}
      <h1>Quizzes</h1>
      <p class="lede">Each question has one intended answer and a reason. The reason matters more than the score.</p>
      <div class="menu-grid">${cards.map(menuCard).join("")}</div>`,
  };
}

function quizBank(id) {
  if (id === "interview") {
    const mixed = [];
    tracks.forEach((track) => {
      (track.quiz || []).forEach((question, index) => {
        if (index === 0) mixed.push(question);
      });
    });
    return { title: "Interview warm-up", questions: mixed.slice(0, 8) };
  }
  const track = trackById(id);
  if (!track?.quiz?.length) return null;
  return { title: `${track.title} quiz`, questions: track.quiz };
}

function quizView(id) {
  const bank = quizBank(id);
  if (!bank) return missingView();
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/quizzes", label: "Quizzes" }, { href: `#/quiz/${id}`, label: bank.title }])}
      <h1>${esc(bank.title)}</h1>
      <div id="quiz-root"></div>`,
    after() { mountQuiz(id, bank, document.getElementById("quiz-root")); },
  };
}

function mountQuiz(id, bank, root) {
  let index = 0;
  let score = 0;
  let locked = false;
  const paint = () => {
    if (index >= bank.questions.length) {
      markQuiz(id, score, bank.questions.length);
      root.innerHTML = `<p class="lede">You answered ${score} of ${bank.questions.length} in the way the lab expected.</p>
        <p>Re-read any explanation that surprised you, then open the linked source.</p>
        <p><a class="text-btn" href="#/quizzes">All quizzes</a></p>`;
      return;
    }
    const question = bank.questions[index];
    root.innerHTML = `<p class="muted">Question ${index + 1} of ${bank.questions.length}</p>
      <h2>${esc(question.prompt)}</h2>
      <div class="card-grid">${question.choices.map((choice, choiceIndex) => `<button type="button" class="choice" data-choice="${choiceIndex}">${esc(choice)}</button>`).join("")}</div>
      <div id="quiz-why"></div>
      <div class="quiz-nav"><button type="button" class="primary" id="quiz-next" hidden>Next</button></div>`;
    root.querySelectorAll(".choice").forEach((button) => {
      button.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        const choice = Number(button.dataset.choice);
        const good = choice === question.answer;
        if (good) score += 1;
        button.classList.add("chosen");
        const why = root.querySelector("#quiz-why");
        why.innerHTML = `<p class="${good ? "pass" : "fail"}">${good ? "That matches the intended answer." : "That is not the intended answer."}</p>
          <p>${esc(question.why)}</p>
          <p><a href="#/sources/${esc(question.source)}">Source</a></p>`;
        root.querySelector("#quiz-next").hidden = false;
      });
    });
    root.querySelector("#quiz-next").addEventListener("click", () => {
      index += 1;
      locked = false;
      paint();
    });
  };
  paint();
}

function ecosystemView(panel) {
  const panels = ["glossary", "map", "sisters", "integrations", "hooks"];
  const current = panels.includes(panel) ? panel : "glossary";
  const nav = panels.map((name) => `<a class="text-btn" href="#/ecosystem/${name}" aria-current="${name === current ? "page" : "false"}">${esc(ecosystem.labels[name])}</a>`).join("");
  let body = "";
  if (current === "glossary") {
    body = `<label class="filter">Filter the glossary<input id="glossary-filter" type="search" placeholder="Filter terms" autocomplete="off"></label>
      <div id="glossary">${ecosystem.glossary.map((entry) => `<article class="glossary-item panel" data-speak><h2>${esc(entry.term)}</h2><p>${esc(entry.meaning)}</p></article>`).join("")}</div>
      <p class="empty" id="glossary-empty" hidden>No term matches that filter.</p>`;
  } else if (current === "map") {
    body = `<p data-speak>${esc(ecosystem.mapText)}</p>${diagramFig(ecosystem.map, "A map of Python and the neighborhoods this lab covers")}`;
  } else if (current === "sisters") {
    body = `<div class="card-grid">${ecosystem.sisters.map((item) => `<article class="panel" data-speak><h2>${esc(item.title)}</h2><p>${esc(item.text)}</p></article>`).join("")}</div>`;
  } else if (current === "integrations") {
    body = `<div class="card-grid">${ecosystem.integrations.map((item) => `<article class="panel" data-speak><h2>${esc(item.title)}</h2><p>${esc(item.text)}</p></article>`).join("")}</div>`;
  } else {
    body = `<div class="card-grid">${ecosystem.hooks.map((item) => `<article class="panel" data-speak><h2>${esc(item.title)}</h2><p>${esc(item.text)}</p></article>`).join("")}</div>`;
  }
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/ecosystem/glossary", label: "Ecosystem" }])}
      <h1>Ecosystem</h1>
      <p class="lede" data-speak>Python is a language sitting among other tools. This section names the neighbors without pretending they are a ranking.</p>
      <nav class="toolbar" aria-label="Ecosystem">${nav}</nav>
      ${body}
      ${sourceLinks(["py-downloads", "pyodide", "webassembly"])}`,
    after(token) {
      const input = document.getElementById("glossary-filter");
      input?.addEventListener("input", () => {
        if (token !== viewToken) return;
        const query = input.value.trim().toLowerCase();
        let shown = 0;
        document.querySelectorAll("#glossary .glossary-item").forEach((item) => {
          const hit = item.innerText.toLowerCase().includes(query);
          item.hidden = !hit;
          if (hit) shown += 1;
        });
        document.getElementById("glossary-empty").hidden = shown !== 0;
      });
      drawDiagrams(main());
    },
  };
}

function legacyDownloads() {
  const cards = DOWNLOADS.map((d) => `<article class="download-card" data-download="${esc(d.id)}">
      <h2>${esc(d.title)}</h2>
      <p>${esc(d.desc)}</p>
      <p>${d.formats.map((f, i) => `<a class="${i === 0 ? "primary" : ""}" href="downloads/${d.src}.${f}" download>${FORMAT_LABEL[f]}</a>`).join(" ")}</p>
    </article>`).join("");
  return `<h2 id="dl-more">Cheat sheets, notebook and more</h2>
      <p class="lede">These files are in the site. The PDF and the text copy contain the same notes. They are study aids from 17 October 2026, not specifications.</p>
      <div class="download-grid">${cards}</div>
      <h2>Slides, diagrams, and the whole lab</h2>
      <div class="download-grid">
        <article class="download-card"><h2>Slides on screen</h2><p>Prefer slides you can page through? <a href="#/slides">Open the decks, then use Print to save a PDF</a>.</p></article>
        <article class="download-card"><h2>Diagrams</h2><p>Each diagram is one self-contained HTML file that opens offline.</p><ul class="dl-list">${diagrams.map((d) => `<li><a href="diagrams/${esc(d.file)}" download>${esc(d.title)}</a></li>`).join("")}</ul></article>
        <article class="download-card"><h2>The whole lab</h2><p>Plain files. Unzip, run <code>python3 -m http.server</code> in the folder, and open it.</p><p><a class="primary" href="https://github.com/CypherMonkeyLabs/python-lab-free-university-mesmerizing/archive/refs/heads/main.zip" rel="noopener">Download ZIP from GitHub</a></p></article>
      </div>`;
}

function downloadsView(focus) { return downloadCenterView(focus, legacyDownloads()); }

function sourcesView(id) {
  const groups = [];
  sources.forEach((source) => {
    let group = groups.find((item) => item.name === source.group);
    if (!group) {
      group = { name: source.group, items: [] };
      groups.push(group);
    }
    group.items.push(source);
  });
  const html = groups.map((group) => `<section><h2>${esc(group.name)}</h2><ul class="source-list">${group.items.map((source) => `<li id="${esc(source.id)}"><a href="${esc(source.url)}">${esc(source.title)}</a><p>${esc(source.detail)}</p></li>`).join("")}</ul></section>`).join("");
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/sources", label: "Sources" }])}
      <h1>Sources</h1>
      <p class="lede" data-speak>Facts in the lab point here. Official pages win if a lesson and a live page ever disagree, especially for exam prices and release dates. This snapshot was written on 17 October 2026.</p>
      <section class="voice-credits" id="source-voice-credits">
        <h2>Spoken voice credits</h2>
        <p>The offline MP3s use three Piper voices, each trained from scratch on a public-domain dataset. The Piper engine is MIT, copyright 2022 Michael Hansen. The voice weights are not in this site. “This device” uses the browser speech engine and ships no file.</p>
        <ul>
          <li><strong>Linda · United States</strong> — <code>en_US-ljspeech-medium</code>. LJ Speech is public domain in the US. Keith Ito: “There are no restrictions on its use.” Recordings by Linda Johnson for LibriVox. Alignment and annotation by Keith Ito.</li>
          <li><strong>Norman · United States</strong> — <code>en_US-norman-medium</code>. Trained from scratch by Bryce Beattie on LibriVox recordings. LibriVox: “anyone can use all our recordings however they wish (even to sell them).”</li>
          <li><strong>Cori · Britain</strong> — <code>en_GB-cori-medium</code>. Trained from scratch by Bryce Beattie on LibriVox recordings, under the same public-domain terms.</li>
        </ul>
        <p>LibriVox does not require a credit and prefers one: <a href="https://librivox.org/pages/public-domain/">librivox.org/pages/public-domain</a>. LJ Speech dataset: <a href="https://keithito.com/LJ-Speech-Dataset/">keithito.com/LJ-Speech-Dataset</a>.</p>
      </section>
      ${html}`,
    after() {
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    },
  };
}

function aboutView() {
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/about", label: "About" }])}
      <h1>About Lucky</h1>
      <p class="lede" data-speak>Lucky is a lifelong student and an AI enthusiast. He is moving into AI omni-channel agents: systems that can meet a person on more than one channel and still be studying the same task. Python Lab is part of that study, not a résumé squeezed into one job title.</p>
      <p>He shares what he is learning while he learns it. The lab is free, it cites its sources, and it does not invent income figures or a personal biography that was never written down.</p>
      ${roomScene({ title: "A reading room.", cards: ["Study", "Share", "Cite"], screen: "learn()" })}
      <h2>Elsewhere</h2>
      <ul>
        <li><a href="https://cyphermonkeylabs.com">cyphermonkeylabs.com</a></li>
        <li><a href="https://github.com">GitHub</a></li>
        <li><a href="https://linktr.ee/cyphermonkey">linktr.ee/cyphermonkey</a></li>
      </ul>
      <h2>What is vendored here</h2>
      <p>Pyodide 314.0.7, NumPy 2.4.6, pandas 3.0.2 and the small libraries pandas needs, plus Mermaid 11.12.2, are stored in this site so a lesson can run without calling a CDN. Their licenses are listed in Sources. The typefaces are Atkinson Hyperlegible, Fraunces, and IBM Plex Mono.</p>`,
  };
}

function roomsView(id) {
  const rooms = {
    lobby: { title: "Lobby", screen: "print('hello')", cards: ["Syntax", "Data", "Agents"], text: "The lobby is the menu. The floating cards name three doors you can actually open." },
    syntax: { title: "Syntax studio", screen: "if ready:", cards: ["Indent", "Names", "Calls"], text: "Indentation is the furniture in this room. The lessons on fundamentals walk through it slowly." },
    data: { title: "Data loft", screen: "np.mean", cards: ["Arrays", "Frames", "Checks"], text: "Arrays and frames live upstairs. The browser runtime can run the vendored NumPy and pandas." },
    agents: { title: "Agent bay", screen: "observe()", cards: ["Ask", "Tool", "Check"], text: "An agent here means a loop: propose, use a bounded tool, look at the result, stop. It is a pattern, not a personality." },
  };
  const room = rooms[id] || rooms.lobby;
  const links = Object.entries(rooms).map(([key, value]) => `<a class="text-btn" href="#/rooms/${key}">${esc(value.title)}</a>`).join("");
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/rooms/lobby", label: "Rooms" }])}
      <h1>${esc(room.title)}</h1>
      <p class="lede" data-speak>${esc(room.text)}</p>
      <nav class="toolbar" aria-label="Rooms">${links}</nav>
      ${roomScene({ title: room.title + ".", cards: room.cards, screen: room.screen })}
      <p><a href="#/track/fundamentals">Start with fundamentals</a> or <a href="#/track/ai">read the agent lesson</a>.</p>`,
  };
}

function missingView() {
  return {
    html: `<h1>That corner of the lab is empty</h1>
      <p>The address does not match a topic, lesson, game, or room.</p>
      <p><a href="#/">Browse the menu</a></p>`,
  };
}

function viewFor(route) {
  if (route.name === "home") return homeView();
  if (route.name === "studio") return { html: studioPageHtml(), after() { bindStudioFloor(main()); } };
  if (route.name === "section") return sectionView(route.id);
  if (route.name === "track") return trackView(route.id);
  if (route.name === "lesson") return lessonView(route.track, route.lesson);
  if (route.name === "practice") return practiceView();
  if (route.name === "level") return levelView(route.n) || missingView();
  if (route.name === "me") return meView();
  if (route.name === "games") return gamesView();
  if (route.name === "game") return gameView(route.id);
  if (route.name === "quizzes") return quizzesView();
  if (route.name === "quiz") return quizView(route.id);
  if (route.name === "ecosystem") return ecosystemView(route.panel);
  if (route.name === "downloads") return downloadsView(route.id);
  if (route.name === "worlds") return worldsView();
  if (route.name === "world") return worldView(route.id) || missingView();
  if (route.name === "download-center") return downloadsView(route.id);
  if (route.name === "sources") return sourcesView(route.id);
  if (route.name === "about") return aboutView();
  if (route.name === "rooms") return roomsView(route.id);
  if (route.name === "slides") return (route.id ? slidesView(route.id, route.n) : slidesIndexView()) || missingView();
  if (route.name === "guides") return guidesView();
  if (route.name === "guide") return guideView(route.id) || missingView();
  if (route.name === "diagrams") return diagramsView();
  if (route.name === "diagram") return diagramView(route.id) || missingView();
  return missingView();
}

function startOrbit() {
  stopOrbit();
  const canvas = document.getElementById("orbit-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  let angle = 0.6;
  const draw = () => {
    const width = canvas.clientWidth || 320;
    const height = Math.max(80, Math.round(width * 9 / 16));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#12161c";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#e2a13a";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.max(8, width * 0.04), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7ec8c3";
    ctx.beginPath();
    ctx.arc(width / 2 + Math.cos(angle) * width * 0.22, height / 2 + Math.sin(angle) * height * 0.28, Math.max(4, width * 0.02), 0, Math.PI * 2);
    ctx.fill();
    if (!reduce) {
      angle += 0.03;
      raf = requestAnimationFrame(draw);
    }
  };
  draw();
  stopOrbit = () => cancelAnimationFrame(raf);
}

function render() {
  viewToken += 1;
  const token = viewToken;
  stopGame();
  stopSpeech();
  stopOrbit();
  disposeStudio();
  const route = parseRoute();
  const view = viewFor(route);
  main().innerHTML = view.html;
  if (booted) {
    window.scrollTo(0, 0);
    main().focus({ preventScroll: true });
  }
  booted = true;
  view.after?.(token);
  applyWorld(location.hash);
  document.dispatchEvent(new CustomEvent("lab:world"));
  mountStudio(main());
  bindStudioFloor(main());
  keepBotClear();
}

applyPrefs();
applyTheme(document.documentElement.dataset.theme || "ink", false);
initShell();
initBot();
initBotPanel();
initBotFx();
initPy();
initTeachReactions();
initQualityControl();
initHowTo();
initFx();
initXP();
initDisplay();
initTour();
initPWA();
initVoice();
window.addEventListener("hashchange", render);
document.addEventListener("click", (event) => {
  const themeButton = event.target.closest("[data-theme-set]");
  if (!themeButton) return;
  applyTheme(themeButton.dataset.themeSet);
  drawDiagrams(main());
});
watchDiagramTheme();
render();
initWelcome();
