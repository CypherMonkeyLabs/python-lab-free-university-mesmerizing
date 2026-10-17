/* XP, levels and badges. Everything is stored on this device (localStorage), nothing is sent anywhere. */
import { readStore, writeStore } from "./util.js";

export const XP_KEY = "pythonlab.xp.v1";

export const BADGES = [
  { id: "first-lesson", title: "First steps", desc: "Open your first lesson.", icon: "🐣" },
  { id: "five-lessons", title: "Page turner", desc: "Open five lessons.", icon: "📚" },
  { id: "first-pass", title: "Green checks", desc: "Pass a lesson exercise.", icon: "✅" },
  { id: "perfect-quiz", title: "Sharp mind", desc: "Answer every question of a quiz as expected.", icon: "🎯" },
  { id: "first-game", title: "Player one", desc: "Win or finish any game or puzzle.", icon: "🎮" },
  { id: "block-builder", title: "Block builder", desc: "Finish a block-to-Python challenge.", icon: "🧱" },
  { id: "turtle-artist", title: "Turtle artist", desc: "Run a turtle drawing.", icon: "🐢" },
  { id: "loop-master", title: "Loop master", desc: "Solve the loop visualiser.", icon: "🔁" },
  { id: "sorter", title: "Code sorter", desc: "Put a program in the right order.", icon: "🧩" },
  { id: "arcade-pro", title: "Arcade pro", desc: "Score 5 in Snake or Pong.", icon: "🕹️" },
  { id: "level-3", title: "Level 3 reached", desc: "Earn enough XP for level 3.", icon: "🚀" },
];

const blank = () => ({ xp: 0, level: 1, awarded: {}, badges: {} });
export const state = () => ({ ...blank(), ...readStore(XP_KEY, {}) });
export const levelFor = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const xpForLevel = (n) => 50 * (n - 1) * (n - 1);

export function addXP(amount, key) {
  const s = state();
  if (key) {
    if (s.awarded[key]) return false;
    s.awarded[key] = true;
  }
  const before = levelFor(s.xp);
  s.xp += amount;
  s.level = levelFor(s.xp);
  writeStore(XP_KEY, s);
  document.dispatchEvent(new CustomEvent("lab:xp", { detail: { xp: s.xp, level: s.level, gained: amount } }));
  if (s.level > before) {
    document.dispatchEvent(new CustomEvent("lab:levelup", { detail: { level: s.level } }));
    if (s.level >= 3) awardBadge("level-3");
  }
  return true;
}

export function awardBadge(id) {
  const s = state();
  if (s.badges[id]) return false;
  const b = BADGES.find((x) => x.id === id);
  if (!b) return false;
  s.badges[id] = new Date().toISOString().slice(0, 10);
  writeStore(XP_KEY, s);
  document.dispatchEvent(new CustomEvent("lab:badge", { detail: b }));
  return true;
}

export function resetXP() {
  writeStore(XP_KEY, blank());
  document.dispatchEvent(new CustomEvent("lab:xp", { detail: { xp: 0, level: 1, gained: 0 } }));
}

/* A win from a game or puzzle: XP once per id, plus the first-game badge. */
export function win(id, xp = 20, badge) {
  const first = addXP(xp, `win:${id}`);
  awardBadge("first-game");
  if (badge) awardBadge(badge);
  document.dispatchEvent(new CustomEvent("lab:win", { detail: { id, first } }));
  return first;
}

export function initXP() {
  document.addEventListener("lab:lesson", (e) => {
    const { id, state: st } = e.detail;
    if (st === "passed") {
      if (addXP(20, `pass:${id}`)) document.dispatchEvent(new CustomEvent("lab:win", { detail: { id, first: true } }));
      awardBadge("first-pass");
    } else {
      addXP(10, `open:${id}`);
    }
    const lessons = readStore("pythonlab.visited.v1", {});
    const n = Object.keys(lessons).length;
    if (n >= 1) awardBadge("first-lesson");
    if (n >= 5) awardBadge("five-lessons");
  });
  document.addEventListener("lab:quiz", (e) => {
    const { id, score, total } = e.detail;
    addXP(5 + score * 5, `quiz:${id}`);
    if (score === total) {
      awardBadge("perfect-quiz");
      document.dispatchEvent(new CustomEvent("lab:win", { detail: { id, first: true } }));
    }
  });
}
