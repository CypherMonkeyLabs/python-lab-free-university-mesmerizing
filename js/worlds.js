/* World themes. Python Lab's lessons are labelled Beginner, Intermediate, Advanced and Interview,
   so "Level 1/2/3" here means those labels (Advanced and Interview share Level 3). */
import { tracks } from "./content/catalog.js";

export const WORLDS = {
  lobby: { name: "Sunrise Lobby", c: ["#ff5da2", "#ffd43b", "#22d3ee"] },
  l1: { name: "Hatchling Meadow", c: ["#34d399", "#fbbf24", "#22d3ee"] },
  l2: { name: "Tidepool Workshop", c: ["#22d3ee", "#60a5fa", "#a78bfa"] },
  l3: { name: "Observatory", c: ["#a78bfa", "#f472b6", "#fbbf24"] },
  play: { name: "Arcade", c: ["#fb923c", "#f472b6", "#facc15"] },
};

export const LEVELS = [
  { n: 1, label: "Beginner", match: ["Beginner"], world: "l1", blurb: "First programs, names, loops, files. Start here." },
  { n: 2, label: "Intermediate", match: ["Intermediate"], world: "l2", blurb: "Classes, modules, data, tools, small apps." },
  { n: 3, label: "Advanced", match: ["Advanced", "Interview"], world: "l3", blurb: "Async, agents, and talking about cost." },
];

export function levelNumber(label) {
  const hit = LEVELS.find((l) => l.match.includes(label));
  return hit ? hit.n : 1;
}

export function lessonsAtLevel(n) {
  const out = [];
  for (const t of tracks) for (const l of t.lessons) if (levelNumber(l.level) === n) out.push({ track: t, lesson: l });
  return out;
}

export function worldForHash(hash) {
  const h = hash || "#/";
  let m = h.match(/^#\/level\/(\d)/);
  if (m) return `l${Math.min(3, Math.max(1, +m[1]))}`;
  m = h.match(/^#\/lesson\/([a-z]+)\/([a-z-]+)/);
  if (m) {
    const t = tracks.find((x) => x.id === m[1]);
    const l = t && t.lessons.find((x) => x.id === m[2]);
    if (l) return `l${levelNumber(l.level)}`;
  }
  m = h.match(/^#\/track\/([a-z]+)/);
  if (m) {
    const t = tracks.find((x) => x.id === m[1]);
    if (t && t.lessons[0]) return `l${levelNumber(t.lessons[0].level)}`;
  }
  if (/^#\/(games|quiz|quizzes|play)/.test(h)) return "play";
  return "lobby";
}

export function applyWorld(hash) {
  const id = worldForHash(hash);
  const w = WORLDS[id];
  const root = document.documentElement;
  root.dataset.world = id;
  root.style.setProperty("--w1", w.c[0]);
  root.style.setProperty("--w2", w.c[1]);
  root.style.setProperty("--w3", w.c[2]);
  return id;
}
