/* Level pages and the My progress page. */
import { esc } from "./util.js";
import { LEVELS, WORLDS, lessonsAtLevel } from "./worlds.js";
import { state, levelFor, xpForLevel, BADGES, resetXP } from "./xp.js";
import { icon } from "./icons.js";

const crumbs = (parts) => `<nav class="crumbs" aria-label="Breadcrumb">${parts.map((p, i) => i === parts.length - 1 ? `<span>${esc(p.label)}</span>` : `<a href="${esc(p.href)}">${esc(p.label)}</a>`).join('<span aria-hidden="true">/</span>')}</nav>`;

export function levelCards() {
  return `<div class="level-row" role="list">${LEVELS.map((l) => {
    const w = WORLDS[l.world];
    return `<a class="level-card lc-tone-${l.n}" role="listitem" href="#/level/${l.n}"><span class="lc-n" aria-hidden="true">${l.n}</span><b>Level ${l.n}: ${esc(l.label)}</b><span class="lc-t">${esc(w.name)}. ${esc(l.blurb)}</span></a>`;
  }).join("")}
    <a class="level-card lc-tone-f" role="listitem" href="#/track/fundamentals"><span class="lc-n" aria-hidden="true">F</span><b>Foundations</b><span class="lc-t">Syntax, types, control flow, functions, files, errors, tests.</span></a></div>`;
}

export function levelView(n) {
  const level = LEVELS.find((l) => l.n === n);
  if (!level) return null;
  const w = WORLDS[level.world];
  const items = lessonsAtLevel(n);
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: `#/level/${n}`, label: `Level ${n}` }])}
      <p><span class="world-tag">World: ${esc(w.name)}</span></p>
      <h1>Level ${n}: ${esc(level.label)}</h1>
      <p class="lede">${esc(level.blurb)} ${items.length} lessons. Lessons in the lab are labelled Beginner, Intermediate, Advanced or Interview; Level 3 holds Advanced and Interview.</p>
      <div class="card-grid">${items.map(({ track, lesson }) => `<a class="lesson-row" href="#/lesson/${esc(track.id)}/${esc(lesson.id)}"><span class="row-top">${icon(track.icon)}<span><span class="row-label">${esc(lesson.title)}</span><span class="row-desc">${esc(track.title)} · ${lesson.minutes} min. ${esc(lesson.summary)}</span></span></span></a>`).join("")}</div>
      <p>${n > 1 ? `<a class="text-btn" href="#/level/${n - 1}">Level ${n - 1}</a> ` : ""}${n < 3 ? `<a class="text-btn" href="#/level/${n + 1}">Level ${n + 1}</a>` : ""}</p>`,
  };
}

export function meView() {
  const s = state();
  const lvl = levelFor(s.xp);
  const lo = xpForLevel(lvl);
  const hi = xpForLevel(lvl + 1);
  const pct = Math.round(((s.xp - lo) / (hi - lo)) * 100);
  const earned = Object.keys(s.badges).length;
  return {
    html: `${crumbs([{ href: "#/", label: "Home" }, { href: "#/me", label: "My progress" }])}
      <h1>My progress</h1>
      <p class="lede">XP and badges live only in this browser (localStorage). Nothing is sent anywhere, and there is no account.</p>
      <section class="me-card"><div class="me-top"><span class="me-lvl">Level ${lvl}</span><span>${s.xp} XP · ${hi - s.xp} to level ${lvl + 1}</span></div>
        <div class="me-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progress to the next level"><i style="width:${pct}%"></i></div>
        <p class="muted">Earn XP by opening lessons (10), passing exercises (20), finishing quizzes, and winning games and puzzles.</p></section>
      <h2>Badges (${earned} of ${BADGES.length})</h2>
      <div class="badge-grid">${BADGES.map((b) => { const got = s.badges[b.id]; return `<div class="badge ${got ? "got" : "locked"}"><span class="b-ico" aria-hidden="true">${b.icon}</span><b>${esc(b.title)}</b><span>${esc(b.desc)}</span><small>${got ? `Earned ${esc(got)}` : "Not yet"}</small></div>`; }).join("")}</div>
      <p><button type="button" class="text-btn" id="me-reset">Delete my XP and badges</button></p>`,
    after() {
      document.getElementById("me-reset")?.addEventListener("click", () => { if (window.confirm("Delete all XP and badges on this device?")) { resetXP(); location.reload(); } });
    },
  };
}
