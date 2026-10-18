/* Rewrite the SHELL_ASSETS list in sw.js from the real import graph and a size budget. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const budget = 3_500_000;
const seen = new Set();

function walk(file) {
  const abs = path.resolve(file);
  if (seen.has(abs) || !fs.existsSync(abs) || !abs.endsWith(".js")) return;
  seen.add(abs);
  const text = fs.readFileSync(abs, "utf8");
  const re = /from\s+["'](\.[^"']+)["']/g;
  let match;
  while ((match = re.exec(text))) {
    let rel = match[1];
    if (!rel.endsWith(".js")) rel += ".js";
    walk(path.resolve(path.dirname(abs), rel));
  }
}

walk(path.join(root, "js/app.js"));

const required = [
  "index.html",
  "manifest.webmanifest",
  "assets/favicon.svg",
  "assets/cyphermonkey-zodiac.svg",
  "media/voices.json",
];
for (const name of fs.readdirSync(path.join(root, "css"))) {
  if (name.endsWith(".css")) required.push(`css/${name}`);
}
for (const name of fs.readdirSync(path.join(root, "assets/fonts"))) {
  if (name.endsWith(".woff2")) required.push(`assets/fonts/${name}`);
}
for (const name of ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "splash.png"]) {
  required.push(`assets/${name}`);
}

const jsFiles = [...seen].map((abs) => path.relative(root, abs).split(path.sep).join("/")).sort();
const mediaPriority = [
  "media/voice-preview-ljspeech.mp3",
  "media/voice-preview-norman.mp3",
  "media/voice-preview-cori.mp3",
  "media/audio-syntax.mp3",
  "media/audio-structures.mp3",
  "media/audio-async.mp3",
  "media/audio-interview.mp3",
  "media/typing.mp4",
  "media/dict-lookup.webm",
  "media/indent.gif",
  "media/async-loop.gif",
  "media/list-comprehension.mp4",
  "vendor/three/three.subset.min.js",
  "media/audio-syntax-norman.mp3",
  "media/audio-structures-norman.mp3",
  "media/audio-async-norman.mp3",
  "media/audio-interview-norman.mp3",
  "media/audio-syntax-cori.mp3",
  "media/audio-structures-cori.mp3",
  "media/audio-async-cori.mp3",
  "media/audio-interview-cori.mp3",
];

const chosen = [];
let total = 0;
function consider(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs) || chosen.includes(rel)) return;
  const size = fs.statSync(abs).size;
  if (total + size > budget) return;
  chosen.push(rel);
  total += size;
}
for (const rel of [...required, ...jsFiles, ...mediaPriority]) consider(rel);

const body = chosen.map((rel) => `  "./${rel}",`).join("\n");
const swPath = path.join(root, "sw.js");
let sw = fs.readFileSync(swPath, "utf8");
sw = sw.replace(/const SHELL_ASSETS = \[[\s\S]*?\];/, `const SHELL_ASSETS = [\n  "./",\n${body}\n];`);
sw = sw.replace(/pythonlab-pwa-v\d+/, "pythonlab-pwa-v4");
fs.writeFileSync(swPath, sw);
console.log(`precache ${chosen.length + 1} files, ${total} bytes, budget ${budget}`);
