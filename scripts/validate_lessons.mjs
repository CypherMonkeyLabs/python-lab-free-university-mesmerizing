// Validates data/lesson-map.json against the real lesson catalog (js/content/catalog.js).
// Every lesson needs: a level 0-10, at least one outcome, at least one source id that exists.
// Run: node scripts/validate_lessons.mjs        (exit 1 on any problem)
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { tracks } = await import(pathToFileURL(path.join(root, "js/content/catalog.js")).href);
const { sources } = await import(pathToFileURL(path.join(root, "js/content/sources.js")).href);
const map = JSON.parse(readFileSync(path.join(root, "data/lesson-map.json"), "utf8"));
const schema = JSON.parse(readFileSync(path.join(root, "data/lesson-schema.json"), "utf8"));

const problems = [];
const sourceIds = new Set(sources.map((s) => s.id));
const mapped = new Map(map.lessons.map((l) => [l.key, l]));
const seen = new Set();
const required = schema.required;

for (const t of tracks) {
  for (const l of t.lessons) {
    const key = `${t.id}/${l.id}`;
    seen.add(key);
    const m = mapped.get(key);
    if (!m) { problems.push(`${key}: not in lesson-map.json`); continue; }
    for (const f of required) if (!(f in m)) problems.push(`${key}: missing field ${f}`);
    if (!Number.isInteger(m.level) || m.level < 0 || m.level > 10) problems.push(`${key}: level must be 0-10`);
    if (!Array.isArray(m.outcomes) || m.outcomes.length < 1 || m.outcomes.some((o) => typeof o !== "string" || o.length < 8)) problems.push(`${key}: needs at least one outcome`);
    if (!Array.isArray(m.sources) || m.sources.length < 1) problems.push(`${key}: needs at least one source`);
    for (const s of m.sources || []) if (!sourceIds.has(s)) problems.push(`${key}: unknown source id ${s}`);
    if (JSON.stringify(m.sources) !== JSON.stringify(l.sources || [])) problems.push(`${key}: sources differ from the lesson file`);
    if (m.title !== l.title) problems.push(`${key}: title differs from the lesson file`);
    if (!/^3\.\d+$/.test(m.python_min || "")) problems.push(`${key}: python_min like 3.13`);
    if (m.last_verified !== null && !/^\d{4}-\d{2}-\d{2}$/.test(m.last_verified)) problems.push(`${key}: last_verified must be null or YYYY-MM-DD`);
  }
}
for (const k of mapped.keys()) if (!seen.has(k)) problems.push(`${k}: in lesson-map.json but no such lesson`);

const perLevel = {};
for (const m of map.lessons) perLevel[m.level] = (perLevel[m.level] || 0) + 1;
for (const p of problems) console.log("FAIL", p);
console.log("lessons:", seen.size, "mapped:", mapped.size, "per level:", JSON.stringify(perLevel));
console.log("validate_lessons:", problems.length, "problems");
process.exit(problems.length ? 1 : 0);
