import { trackById, tracks, extras } from "./catalog.js";

function L(trackId, lessonId) {
  const track = trackById(trackId);
  const lesson = track?.lessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  return { title: lesson.title, href: `#/lesson/${trackId}/${lessonId}`, desc: lesson.summary, icon: track.icon };
}
function T(trackId) {
  const track = trackById(trackId);
  if (!track) return null;
  return { title: track.title, href: `#/track/${trackId}`, desc: track.menu, icon: track.icon };
}
const X = (title, href, desc, icon) => ({ title, href, desc, icon });
const list = (items) => items.filter(Boolean);

export const sections = [
  {
    id: "start", title: "Start Here", icon: "start", menu: "How the lab works and what the browser can run.",
    href: "#/section/start",
    intro: "New here? Read these three pages first. They explain how the lab is organized, give you a map of the language, and say plainly what Python can and cannot do inside a browser tab.",
    links: () => list([L("start", "how-to-use"), L("start", "map"), L("start", "runtime"), X("About Lucky", "#/about", "Who is sharing this notebook and why.", "about")]),
  },
  {
    id: "fundamentals", title: "Fundamentals", icon: "fundamentals", menu: "Syntax, types, names, files, errors, and data structures.",
    href: "#/section/fundamentals",
    intro: "The language itself, in an order that builds. Each lesson has a short read, a runnable exercise with checks, and sources.",
    links: () => list([L("fundamentals", "syntax"), L("fundamentals", "types"), L("fundamentals", "names"), L("fundamentals", "files"), L("fundamentals", "errors"), L("fundamentals", "testing-packaging"), T("dsa")]),
  },
  {
    id: "flows", title: "Flows", icon: "async", menu: "Control flow and async, step by step.",
    href: "#/section/flows",
    intro: "How a program decides and waits: branches and loops first, then coroutines, tasks, and the event loop, plus the mind map that connects them.",
    links: () => list([L("fundamentals", "control"), L("async", "why"), L("async", "coroutines"), L("async", "pitfalls"), X("Mind map", "#/ecosystem/map", "A diagram of how the pieces of Python connect.", "ecosystem")]),
  },
  {
    id: "methods", title: "Methods", icon: "dsa", menu: "Functions, classes, methods, and typing.",
    href: "#/section/methods",
    intro: "Functions and methods are how you name a piece of behaviour. This section covers defining them, attaching them to objects, and describing their shapes with annotations.",
    links: () => list([L("fundamentals", "functions"), L("fundamentals", "classes"), L("typing", "annotations"), L("typing", "shapes"), L("typing", "checkers")]),
  },
  {
    id: "modules", title: "Modules", icon: "stdlib", menu: "Modules, packages, and the standard library.",
    href: "#/section/modules",
    intro: "Code lives in files, files live in packages, and CPython ships a large standard library. Learn to import, to read the tour map, and to set up an environment.",
    links: () => list([L("fundamentals", "modules"), L("stdlib", "map"), L("stdlib", "text-time"), L("stdlib", "processes"), L("stdlib", "quality"), L("tooling", "environments")]),
  },
  {
    id: "labs", title: "Labs", icon: "practice", menu: "Run real Python in your browser with Pyodide.",
    href: "#/section/labs",
    intro: "Hands on. The practice desk runs Python 3.14 compiled to WebAssembly, with NumPy and pandas stored in the site. Your code never leaves the page.",
    links: () => list([X("Practice desk", "#/practice", "A free editor with stdlib, NumPy, and pandas.", "practice"), L("data", "tables"), L("data", "numpy"), L("data", "pandas"), L("automation", "scripts"), L("projects", "catalog")]),
  },
  {
    id: "games", title: "Games", icon: "games", menu: "Guess, Snake, Import Error, and quizzes.",
    href: "#/section/games",
    intro: "Short games and quizzes that start instantly because they do not need the Python runtime. Good for a five minute break.",
    links: () => list([X("Guess the integer", "#/games/guess", "Higher or lower, from 1 to 100.", "games"), X("Snake", "#/games/snake", "Steer with keys, swipes, or buttons.", "games"), X("Import Error", "#/games/adventure", "A text adventure about a missing module.", "games"), X("Quizzes", "#/quizzes", "Short checks with an explanation and a source.", "quizzes"), X("Interview warm-up", "#/quiz/interview", "Mixed questions about language behaviour.", "quizzes"), X("Rooms", "#/rooms/lobby", "Walk the CSS 3D studios.", "rooms")]),
  },
  {
    id: "integrations", title: "Integrations", icon: "web", menu: "Web, AI agents, tooling, and the wider ecosystem.",
    href: "#/section/integrations",
    intro: "Python rarely works alone. See how it meets HTTP, web frameworks, AI libraries, agent loops, and the tools around a project.",
    links: () => list([X("Ecosystem integrations", "#/ecosystem/integrations", "Where Python plugs into other tools.", "ecosystem"), X("Future hooks", "#/ecosystem/hooks", "Ideas the lab may connect to next.", "ecosystem"), X("Sister technologies", "#/ecosystem/sisters", "Neighbours that are not Python.", "ecosystem"), L("web", "http"), L("web", "flask"), L("web", "fastapi"), L("ai", "agents"), L("tooling", "projects")]),
  },
  {
    id: "lifetime", title: "Lifetime Learning", icon: "career", menu: "Career maps, certifications, projects, and licensing.",
    href: "#/section/lifetime",
    intro: "Learning does not stop at a first job. These pages give a study order with no pay claims, honest notes on certifications and licenses, and small projects you can finish.",
    links: () => list([L("career", "stages"), L("career", "interviews"), L("certifications", "how-to-read"), L("certifications", "tracks"), L("licensing", "python-license"), L("projects", "catalog"), L("dsa", "interviews")]),
  },
  {
    id: "resources", title: "Resources", icon: "downloads", menu: "Cheat sheets, sources, glossary, and about Lucky.",
    href: "#/section/resources",
    intro: "Take-away material and the official pages behind every fact in this lab. Official pages win if a lesson and a live page ever disagree.",
    links: () => list([X("Downloads", "#/downloads", "Cheat sheets as PDF and plain text.", "downloads"), X("Sources", "#/sources", "The official pages behind the facts.", "sources"), X("Glossary", "#/ecosystem/glossary", "Terms worth keeping straight.", "ecosystem"), X("About Lucky", "#/about", "A lifelong student sharing what he learns.", "about")]),
  },
];

const FLOW_LESSONS = ["control"];
const METHOD_LESSONS = ["functions", "classes"];

export function sectionFor(hash) {
  const h = hash || "#/";
  let m;
  if ((m = h.match(/^#\/section\/([a-z]+)/))) return m[1];
  if (h === "#/" || h === "#" || h === "") return null;
  if (h.startsWith("#/practice")) return "labs";
  if (/^#\/(games|quiz|quizzes|rooms)/.test(h)) return "games";
  if (/^#\/ecosystem\/(integrations|hooks|sisters)/.test(h)) return "integrations";
  if (/^#\/ecosystem\/map/.test(h)) return "flows";
  if (/^#\/(downloads|sources|about|ecosystem)/.test(h)) return "resources";
  if ((m = h.match(/^#\/(track|lesson)\/([a-z]+)(?:\/([a-z-]+))?/))) {
    const [, , track, lesson] = m;
    if (track === "start") return "start";
    if (track === "fundamentals") {
      if (lesson && FLOW_LESSONS.includes(lesson)) return "flows";
      if (lesson && METHOD_LESSONS.includes(lesson)) return "methods";
      if (lesson === "modules") return "modules";
      return "fundamentals";
    }
    if (track === "dsa") return "fundamentals";
    if (track === "async") return "flows";
    if (track === "typing") return "methods";
    if (track === "stdlib" || track === "tooling") return "modules";
    if (track === "data" || track === "automation") return "labs";
    if (track === "web" || track === "ai") return "integrations";
    return "lifetime";
  }
  return null;
}

/** Linear reading order: every track page, then its lessons. */
export const sequence = tracks.flatMap((track) => [
  { href: `#/track/${track.id}`, title: track.title },
  ...track.lessons.map((lesson) => ({ href: `#/lesson/${track.id}/${lesson.id}`, title: lesson.title })),
]);

export const lessonCount = tracks.reduce((n, t) => n + t.lessons.length, 0);

export function searchIndex() {
  const rows = [];
  sections.forEach((s) => rows.push({ title: s.title, desc: s.menu, href: s.href, kind: "Section", icon: s.icon }));
  tracks.forEach((t) => {
    rows.push({ title: t.title, desc: t.menu, href: `#/track/${t.id}`, kind: "Track", icon: t.icon });
    t.lessons.forEach((l) => rows.push({ title: l.title, desc: l.summary, href: `#/lesson/${t.id}/${l.id}`, kind: "Lesson", icon: t.icon }));
  });
  extras.forEach((e) => rows.push({ title: e.title, desc: e.menu, href: e.href, kind: "Page", icon: e.icon }));
  return rows;
}
