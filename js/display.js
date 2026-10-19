/* Display menu extras (effects quality, sound, tour) and the XP chip in the top bar. */
import { prefs, setPref, tier, reduced } from "./prefs.js";
import { state, levelFor, xpForLevel } from "./xp.js";
import { sound } from "./fx.js";

export function initDisplay() {
  const pop = document.querySelector(".display-pop");
  if (pop && !pop.querySelector("#fx-tier")) {
    const wrap = document.createElement("div");
    wrap.className = "fx-controls";
    wrap.innerHTML = `<p class="fx-label" id="fx-tier-label">Effects quality</p>
      <div class="themes" role="group" aria-labelledby="fx-tier-label" id="fx-tier">
        ${["auto", "high", "low", "off"].map((t) => `<button type="button" class="theme-btn" data-fx-tier="${t}" aria-pressed="false">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
      </div>
      <p class="fx-note" id="fx-note"></p>
      <button type="button" class="text-btn" id="fx-sound" aria-pressed="false">Sound: off</button>
      <button type="button" class="text-btn" data-start-tour>Take the tour</button>
      <button type="button" class="text-btn" data-open-help>How to use this site</button>`;
    pop.appendChild(wrap);
  }
  const sync = () => {
    const p = prefs();
    document.querySelectorAll("[data-fx-tier]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fxTier === p.tier)));
    const snd = document.getElementById("fx-sound");
    if (snd) { snd.textContent = `Sound: ${p.sound ? "on" : "off"}`; snd.setAttribute("aria-pressed", String(p.sound)); }
    const note = document.getElementById("fx-note");
    if (note) note.textContent = reduced() ? "Your device asks for reduced motion, so effects are off." : `Running: ${tier()}`;
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-fx-tier]");
    if (t) { setPref("tier", t.dataset.fxTier); sync(); }
    if (e.target.closest("#fx-sound")) { setPref("sound", !prefs().sound); sync(); sound("pop"); }
  });
  document.addEventListener("lab:prefs", sync);
  sync();

  const host = document.querySelector(".display-menu");
  window.addEventListener("hashchange", () => { if (host) host.open = false; });
  if (host && !document.getElementById("xp-chip")) {
    const a = document.createElement("a");
    a.id = "xp-chip";
    a.className = "xp-chip";
    a.href = "#/me";
    const pop = host.querySelector(".display-pop");
    if (pop) pop.prepend(a);
    else host.before(a);
  }
  const chip = () => {
    const s = state();
    const el = document.getElementById("xp-chip");
    if (!el) return;
    const label = `Lv ${levelFor(s.xp)} · ${s.xp} XP`;
    el.textContent = label;
    el.setAttribute("aria-label", `${label}, open my progress`);
  };
  document.addEventListener("lab:xp", chip);
  chip();
}
