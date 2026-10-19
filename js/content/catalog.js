import { startTrack } from "./start.js";
import { fundamentals } from "./fundamentals.js";
import { dsa } from "./dsa.js";
import { asyncTrack, typingTrack, stdlib } from "./language.js";
import { webTrack, dataTrack, aiTrack, automation } from "./applied.js";
import { tooling, licensing, certifications, career, projects } from "./path.js";
import { coreByTrack } from "./core.js";
import { thicken } from "./thicken.js";
import { stampMinutes } from "./readtime.js";

export const tracks = [
  startTrack,
  fundamentals,
  dsa,
  asyncTrack,
  typingTrack,
  stdlib,
  webTrack,
  dataTrack,
  aiTrack,
  automation,
  tooling,
  licensing,
  certifications,
  career,
  projects,
];

fundamentals.lessons.push(...coreByTrack.fundamentals);
stdlib.lessons.push(...coreByTrack.stdlib);
asyncTrack.lessons.push(...coreByTrack.async);
thicken(tracks);
stampMinutes(tracks);

export const extras = [
  { href: "#/studio", title: "Studio", menu: "Clickable stations, a concept explorer, and examples you can run.", icon: "practice" },
  { href: "#/practice", title: "Practice desk", menu: "Run Python in this browser. The code stays on the page.", icon: "practice" },
  { href: "#/games", title: "Games", menu: "Visual puzzles (blocks, turtle, loops, lists, code sorter), Pong, Snake, and more.", icon: "games" },
  { href: "#/quizzes", title: "Quizzes", menu: "Short checks with an explanation and a source.", icon: "quizzes" },
  { href: "#/slides", title: "Slides", menu: "9 slide decks, fundamentals to advanced. Arrow keys or swipe.", icon: "rooms" },
  { href: "#/guides", title: "Guides", menu: "Deep dives with a flow, code with output, a diagram, and sources.", icon: "fundamentals" },
  { href: "#/diagrams", title: "Diagrams", menu: "Interactive maps: how Python runs, imports, calls, async, pandas, Pyodide.", icon: "ecosystem" },
  { href: "#/rooms/lobby", title: "Rooms", menu: "CSS 3D studios. Reduced motion flattens them.", icon: "rooms" },
  { href: "#/ecosystem/glossary", title: "Ecosystem", menu: "Glossary, a mind map, sister technologies, integrations, and future hooks.", icon: "ecosystem" },
  { href: "#/worlds", title: "Worlds", menu: "Eleven themed 3D worlds, Level 0 to Level 10, with a level map.", icon: "rooms" },
  { href: "#/downloads", title: "Downloads", menu: "Level files (PDF, Word, PowerPoint, HTML, image), cheat sheets, notebook.", icon: "downloads" },
  { href: "#/sources", title: "Sources", menu: "The official pages behind the facts in this lab.", icon: "sources" },
  { href: "#/about", title: "About Lucky", menu: "A lifelong student and AI enthusiast, sharing what he learns.", icon: "about" },
  { href: "#/path", title: "Curriculum map", menu: "Every lesson, grouped from foundations through interview practice.", icon: "start" },
];

export function trackById(id) {
  return tracks.find((track) => track.id === id) || null;
}

export function lessonRef(trackId, lessonId) {
  const track = trackById(trackId);
  if (!track) return null;
  const index = track.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;
  return {
    track,
    lesson: track.lessons[index],
    prev: track.lessons[index - 1] || null,
    next: track.lessons[index + 1] || null,
  };
}
