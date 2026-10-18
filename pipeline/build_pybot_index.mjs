/* Build the offline chat index from the lab's own content modules.
   Usage: node pipeline/build_pybot_index.mjs
   Writes js/content/pybot-index.json. Do not edit that file by hand. */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tokens } from "../shared/pybot-chat/engine.js";
import { tracks } from "../js/content/catalog.js";
import { sections, sectionFor } from "../js/content/sections.js";
import { guides } from "../js/content/guides.js";
import { decks } from "../js/content/slides.js";
import { diagrams } from "../js/content/diagrams.js";
import { ecosystem } from "../js/content/ecosystem.js";
import { DOWNLOADS } from "../js/content/downloads.js";
import { hints } from "../js/content/bot-hints.js";
import { levels } from "../js/content/levels.js";
import { extras } from "../js/content/catalog.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "js/content/pybot-index.json");

/* Surface form -> token that already appears in the lesson text after stemming.
   Typos are included so a miss stays on the lab's wording. */
const SYN = {
  variable: "name",
  variables: "name",
  varible: "name",
  varibles: "name",
  variabl: "name",
  dictionary: "dict",
  dictionaries: "dict",
  dictionery: "dict",
  hashmap: "dict",
  hashmaps: "dict",
  integer: "int",
  integers: "int",
  boolean: "bool",
  booleans: "bool",
  str: "string",
  substring: "string",
  exception: "error",
  exceptions: "error",
  exeption: "error",
  exeptions: "error",
  iteration: "loop",
  iterating: "loop",
  foreach: "loop",
  func: "function",
  funcs: "function",
  functoin: "function",
  funtion: "function",
  functions: "function",
  oop: "class",
  classes: "class",
  filepath: "file",
  pathlib: "file",
  asynch: "async",
  asynchronous: "async",
  generator: "yield",
  generators: "yield",
  generater: "yield",
  decorator: "decorator",
  decorators: "decorator",
  decorater: "decorator",
  comprehension: "comprehension",
  comprehensions: "comprehension",
  comprehesion: "comprehension",
  recursion: "recursion",
  recursive: "recursion",
  recusion: "recursion",
  memoization: "cache",
  memoisation: "cache",
  unittest: "test",
  pytest: "test",
  testing: "test",
  mutable: "mutability",
  immutable: "mutability",
  immutability: "mutability",
  slicing: "slice",
  slices: "slice",
  fstring: "fstring",
  tstring: "tstring",
};

const TITLE_ALIAS = {
  "lesson:fundamentals/types": "string integer boolean",
  "lesson:fundamentals/syntax": "indentation comment block",
  "lesson:fundamentals/control": "loop while",
  "lesson:dsa/maps": "set dictionary",
  "lesson:fundamentals/errors": "exception try except raise",
  "lesson:fundamentals/files": "pathlib open",
  "lesson:fundamentals/names": "variable",
  "lesson:async/why": "async",
  "lesson:async/coroutines": "await coroutine",
  "lesson:typing/annotations": "type hint typing",
};

const EXTRA = {
  "lesson:fundamentals/names": "variable variables assignment binding",
  "lesson:fundamentals/types": "integer boolean string text",
  "lesson:fundamentals/control": "loop loops iteration",
  "lesson:fundamentals/errors": "exception exceptions try except",
  "lesson:dsa/maps": "dictionary dictionaries hashmap",
  "lesson:dsa/sequences": "list lists tuple tuples slice",
  "lesson:fundamentals/functions": "function functions parameter return",
  "lesson:dsa/recursion-memo": "recursion recursive memoization cache",
};

const GAMES = [
  ["blocks", "Blocks to Python", "Build a program from blocks and see the Python. Statements, loops, and variables."],
  ["turtle", "Turtle art", "Write a few lines and watch a pen draw. Loops make patterns."],
  ["loops", "Loop visualiser", "Step through a loop and watch the variables change."],
  ["lists", "List lab", "Use append, pop, insert, reverse, and sort to reach a target list."],
  ["order", "Code sorter", "Put shuffled lines into the right order. Indentation shows the blocks."],
  ["pong", "Pong", "First to 3. Move with the pointer, a finger, or the arrow keys."],
  ["guess", "Guess the integer", "Higher or lower, from 1 to 100."],
  ["snake", "Snake", "Steer with keys, swipes, or buttons."],
  ["adventure", "Import Error", "A text adventure about a missing module."],
  ["dict-puzzle", "Dictionary Hash Lab", "Use set, get, and pop on a Python dict to build the target mapping."],
  ["complexity", "Big-O Cost Matcher", "Match a CPython operation to its average-case time cost."],
];

const AUDIO = [
  ["syntax", "Names, types, and indentation (audio)", "Four-space blocks, name binding versus copying, and mutable versus immutable built-in types."],
  ["structures", "Choosing a data structure (audio)", "List append versus a front insert, and average dict and set hashing."],
  ["async", "Generators and async coroutines (audio)", "Lazy iteration with yield, and async / await on one thread."],
  ["interview", "Interview problem-solving checklist (audio)", "Clarifying inputs, edge cases, hand tracing, and honest time and space costs."],
];

const CLIPS = [
  ["typing", "First program clip", "print('hi') appearing one character at a time."],
  ["orbit", "Orbiting state clip", "A short WebM of orbiting state in the lab palette."],
  ["list-comprehension", "List comprehension clip", "A list comprehension filter and map, step by step."],
  ["dict-lookup", "Dictionary lookup clip", "A dictionary hash bucket lookup."],
  ["indent", "Indentation clip", "Four-space indentation blocks."],
  ["async-loop", "Async loop clip", "Two tasks interleaving on a single thread while awaiting."],
];

function plain(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(text, max = 360) {
  const clean = plain(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  if (stop > 80) return cut.slice(0, stop + 1);
  return cut.trim();
}

const docs = [];

function add(doc) {
  const id = doc.i;
  const bodyText = [doc.ti, doc.body, EXTRA[id] || ""].filter(Boolean).join("\n");
  docs.push({
    i: id,
    k: doc.k,
    ti: doc.ti,
    h: doc.h,
    s: doc.s || "",
    ex: clip(doc.ex || doc.body || doc.ti),
    eg: String(doc.eg || "").replace(/\s+$/g, "").slice(0, 180),
    fu: doc.fu || "",
    fq: doc.fq || "",
    act: doc.act || "",
    w: tokens(bodyText, SYN, 3),
    tw: tokens(`${doc.ti} ${TITLE_ALIAS[id] || ""}`, SYN, 2),
  });
}

let lessonCount = 0;
for (const track of tracks) {
  track.lessons.forEach((lesson, index) => {
    lessonCount += 1;
    const href = `#/lesson/${track.id}/${lesson.id}`;
    const parts = [lesson.summary || ""];
    const codes = [];
    for (const section of lesson.sections || []) {
      parts.push(section.heading || "");
      parts.push(plain(section.html || ""));
      const blocks = String(section.html || "").match(/<code>([\s\S]*?)<\/code>/g) || [];
      for (const block of blocks) codes.push(plain(block));
    }
    if (lesson.exercise) {
      parts.push(lesson.exercise.prompt || "");
      if (lesson.exercise.starter) codes.push(lesson.exercise.starter);
    }
    const next = track.lessons[index + 1];
    add({
      i: `lesson:${track.id}/${lesson.id}`,
      k: "lesson",
      ti: lesson.title,
      h: href,
      s: sectionFor(href) || "",
      ex: [lesson.summary, plain(lesson.sections?.[0]?.html || "")].filter(Boolean).join(" "),
      body: parts.join("\n"),
      eg: codes[0] || "",
      fu: next ? `What about ${next.title}?` : "",
      fq: next ? next.title : "",
    });
  });
  for (const item of track.quiz || []) {
    add({
      i: `quiz:${track.id}:${docs.length}`,
      k: "quiz",
      ti: clip(item.prompt, 90),
      h: `#/quiz/${track.id}`,
      s: sectionFor(`#/lesson/${track.id}/${track.lessons[0]?.id || ""}`) || "",
      ex: item.why,
      body: `${item.prompt} ${(item.choices || []).join(" ")} ${item.why}`,
    });
  }
}

for (const section of sections) {
  add({
    i: `section:${section.id}`,
    k: "section",
    ti: section.title,
    h: section.href,
    s: section.id,
    ex: `${section.menu} ${section.intro || ""}`,
    body: `${section.menu} ${section.intro || ""}`,
  });
}

for (const guide of guides) {
  const cards = (guide.cards || []).map((card) => card.join(" ")).join(" ");
  add({
    i: `guide:${guide.id}`,
    k: "guide",
    ti: guide.title,
    h: `#/guide/${guide.id}`,
    s: guide.section || "",
    ex: `${guide.blurb} ${(guide.body || [])[0] || ""}`,
    body: `${guide.blurb} ${(guide.body || []).join(" ")} ${cards} ${guide.code || ""}`,
    eg: guide.code || "",
  });
}

decks.forEach((deck) => {
  deck.slides.forEach((slide, index) => {
    const points = (slide.pts || []).join(" ");
    add({
      i: `slide:${deck.id}:${index + 1}`,
      k: "slide",
      ti: slide.t,
      h: `#/slides/${deck.id}/${index + 1}`,
      s: deck.section || "",
      ex: points,
      body: `${deck.title} ${points} ${slide.code || ""}`,
      eg: slide.code || "",
    });
  });
});

for (const term of ecosystem.glossary) {
  add({
    i: `glossary:${term.term}`,
    k: "glossary",
    ti: term.term,
    h: "#/ecosystem/glossary",
    s: "resources",
    ex: term.meaning,
    body: `${term.term} ${term.meaning}`,
  });
}

for (const row of DOWNLOADS) {
  add({
    i: `download:${row.id}`,
    k: "download",
    ti: row.title,
    h: "#/downloads",
    s: "resources",
    ex: row.desc,
    body: `${row.title} ${row.desc}`,
  });
}

for (const [id, title, blurb] of GAMES) {
  add({
    i: `game:${id}`,
    k: "game",
    ti: title,
    h: `#/games/${id}`,
    s: "games",
    ex: blurb,
    body: `${title} ${blurb}`,
  });
}

for (const [id, title, blurb] of AUDIO) {
  add({
    i: `audio:${id}`,
    k: "media",
    ti: title,
    h: "#/",
    s: "resources",
    ex: blurb,
    body: `${title} ${blurb}`,
    act: "audio",
  });
}

for (const [id, title, blurb] of CLIPS) {
  add({
    i: `clip:${id}`,
    k: "media",
    ti: title,
    h: "#/",
    s: "resources",
    ex: blurb,
    body: `${title} ${blurb}`,
    act: "video",
  });
}

for (const diagram of diagrams) {
  add({
    i: `diagram:${diagram.id}`,
    k: "diagram",
    ti: diagram.title,
    h: `#/diagram/${diagram.id}`,
    s: diagram.sections?.[0] || "flows",
    ex: diagram.blurb,
    body: `${diagram.title} ${diagram.type} ${diagram.blurb}`,
  });
}

for (const level of levels) {
  add({
    i: `level:${level.n}`,
    k: "level",
    ti: `Level ${level.n}: ${level.name}`,
    h: `#/level/${level.n}`,
    s: "",
    ex: level.blurb,
    body: `Level ${level.n} ${level.name} ${level.blurb}`,
  });
}

for (const [key, hint] of Object.entries(hints)) {
  add({
    i: `hint:${key}`,
    k: "hint",
    ti: `Hint: ${key}`,
    h: `#/lesson/${key}`,
    s: sectionFor(`#/lesson/${key}`) || "",
    ex: hint.hint,
    body: `${hint.nudge} ${hint.hint} ${(hint.approach || []).join(" ")}`,
    eg: hint.example || "",
  });
}

for (const extra of extras) {
  add({
    i: `page:${extra.href}`,
    k: "page",
    ti: extra.title,
    h: extra.href,
    s: sectionFor(extra.href) || "",
    ex: extra.menu,
    body: `${extra.title} ${extra.menu}`,
  });
}

if (lessonCount !== 56) {
  console.error(`expected 56 lessons, found ${lessonCount}`);
  process.exit(1);
}

const payload = {
  v: 1,
  note: "Generated by pipeline/build_pybot_index.mjs from this lab's lessons, hints, downloads, glossary, games, and media. Do not edit by hand.",
  lessons: lessonCount,
  syn: SYN,
  docs: docs.map((doc) => {
    const row = {
      i: doc.i,
      k: doc.k,
      ti: doc.ti,
      h: doc.h,
      s: doc.s,
      ex: doc.ex,
      w: doc.w,
      tw: doc.tw,
    };
    if (doc.eg) row.eg = doc.eg;
    if (doc.fu) row.fu = doc.fu;
    if (doc.fq) row.fq = doc.fq;
    if (doc.act) row.act = doc.act;
    return row;
  }),
};

writeFileSync(outPath, `${JSON.stringify(payload)}\n`);
const bytes = Buffer.byteLength(JSON.stringify(payload));
console.log(`pybot index: ${docs.length} docs, ${lessonCount} lessons, ${bytes} bytes -> ${outPath}`);
