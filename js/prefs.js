/* Visitor preferences for effects and sound. Stored on this device only. */
import { readStore, writeStore } from "./util.js";

const KEY = "pythonlab.prefs.v1";
const DEFAULTS = { tier: "auto", sound: false };

export const prefs = () => ({ ...DEFAULTS, ...readStore(KEY, {}) });
export const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* tier is what actually runs: "off" (still), "low" (light), "high" (full). Reduced motion always wins. */
export function tier() {
  if (reduced()) return "off";
  const t = prefs().tier;
  if (t === "high" || t === "low" || t === "off") return t;
  const weak = (navigator.hardwareConcurrency || 4) < 4 || (navigator.deviceMemory && navigator.deviceMemory < 4);
  return weak ? "low" : "high";
}

export function applyPrefs() {
  document.documentElement.dataset.fx = tier();
  document.documentElement.dataset.sound = prefs().sound ? "on" : "off";
}

export function setPref(key, value) {
  const next = { ...prefs(), [key]: value };
  writeStore(KEY, next);
  applyPrefs();
  document.dispatchEvent(new CustomEvent("lab:prefs", { detail: next }));
}
