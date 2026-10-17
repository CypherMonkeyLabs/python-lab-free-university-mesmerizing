/* Visual games and puzzles. Hand-written for this lab (no game engine, no CDN).
   Each one explains a Python idea visually and awards XP and badges stored on this device. */
import { esc } from "./util.js";
import { win } from "./xp.js";
import { sound } from "./fx.js";
import { tier } from "./prefs.js";

export const PLAY = [
  { id: "blocks", title: "Blocks to Python", menu: "Build a program from blocks, watch the Python appear, match the target output.", concept: "statements, loops, variables" },
  { id: "turtle", title: "Turtle art", menu: "Write a few lines, watch a pen draw. Loops make patterns.", concept: "for loops, arguments" },
  { id: "loops", title: "Loop visualiser", menu: "Step through a loop and watch the variables change before you predict the result.", concept: "variables and loops" },
  { id: "lists", title: "List lab", menu: "Boxes with index numbers. Use append, pop, insert, reverse and sort to reach a target.", concept: "lists and methods" },
  { id: "order", title: "Code sorter", menu: "Put shuffled lines into the right order. Indentation shows the blocks.", concept: "program order and blocks" },
  { id: "pong", title: "Pong", menu: "First to 3. Move with the pointer, finger or arrow keys.", concept: "coordinates and speed" },
];

const $ = (root, sel) => root.querySelector(sel);
const banner = (root, text, good = true) => {
  const el = $(root, ".play-msg");
  if (!el) return;
  el.textContent = text;
  el.className = `play-msg ${good ? "good" : "bad"}`;
};

/* ============ 1. Blocks to Python ============ */
const BLOCK_CHALLENGES = [
  { goal: ["Hi", "Hi", "Hi"], text: "Print Hi three times. Hint: a repeat block holds other blocks.", xp: 20 },
  { goal: ["10"], text: "Show the number 10. Start total at 0, add 2 five times, then show total.", xp: 25 },
  { goal: ["Hi", "6"], text: "Print Hi once, then show 6. Make 6 by adding 2 three times.", xp: 30 },
];
function blockPy(blocks, ind = 0) {
  const pad = "    ".repeat(ind);
  return blocks.map((b) => {
    if (b.t === "print") return `${pad}print(${JSON.stringify(b.v)})`;
    if (b.t === "set") return `${pad}total = ${b.v}`;
    if (b.t === "add") return `${pad}total = total + ${b.v}`;
    if (b.t === "show") return `${pad}print(total)`;
    if (b.t === "repeat") return `${pad}for _ in range(${b.n}):\n${b.body.length ? blockPy(b.body, ind + 1) : `${pad}    pass`}`;
    return "";
  }).join("\n");
}
function blockRun(blocks, env = { total: 0 }, out = []) {
  let guard = 0;
  const go = (list) => list.forEach((b) => {
    if (++guard > 500) return;
    if (b.t === "print") out.push(String(b.v));
    else if (b.t === "set") env.total = Number(b.v);
    else if (b.t === "add") env.total += Number(b.v);
    else if (b.t === "show") out.push(String(env.total));
    else if (b.t === "repeat") for (let i = 0; i < b.n; i += 1) go(b.body);
  });
  go(blocks);
  return out;
}
function mountBlocks(root) {
  let ci = 0;
  let prog = [];
  const container = (p) => (p ? prog[+p].body : prog);
  const render = () => {
    const c = BLOCK_CHALLENGES[ci];
    const draw = (list, path) => list.map((b, i) => {
      const p = path ? `${path}.${i}` : String(i);
      const ctl = `<span class="bk-ctl"><button type="button" data-act="up" data-p="${p}" aria-label="Move block up">▲</button><button type="button" data-act="down" data-p="${p}" aria-label="Move block down">▼</button><button type="button" data-act="del" data-p="${p}" aria-label="Remove block">×</button></span>`;
      if (b.t === "print") return `<div class="bk b-print" draggable="false"><span>print</span><select data-p="${p}" data-f="v" aria-label="Text to print"><option>Hi</option><option>Hello</option><option>Python</option></select>${ctl}</div>`;
      if (b.t === "set") return `<div class="bk b-set"><span>total =</span><input type="number" min="0" max="20" value="${b.v}" data-p="${p}" data-f="v" aria-label="Start value">${ctl}</div>`;
      if (b.t === "add") return `<div class="bk b-add"><span>total = total +</span><input type="number" min="0" max="20" value="${b.v}" data-p="${p}" data-f="v" aria-label="Number to add">${ctl}</div>`;
      if (b.t === "show") return `<div class="bk b-show"><span>print(total)</span>${ctl}</div>`;
      return `<div class="bk b-repeat"><div class="bk-head"><span>repeat</span><input type="number" min="1" max="9" value="${b.n}" data-p="${p}" data-f="n" aria-label="How many times"><span>times</span>${ctl}</div>
        <div class="bk-body" data-drop="${p}">${draw(b.body, p)}<div class="bk-add">${["print", "add", "show"].map((t) => `<button type="button" data-add="${t}" data-into="${p}">+ ${t}</button>`).join("")}</div></div></div>`;
    }).join("");
    root.innerHTML = `<p class="muted">Challenge ${ci + 1} of ${BLOCK_CHALLENGES.length}. ${esc(c.text)}</p>
      <div class="bk-layout">
        <div class="bk-pal" role="group" aria-label="Block palette"><b>Blocks</b>
          ${["print", "set", "add", "show", "repeat"].map((t) => `<button type="button" class="bk-chip fx-btn" draggable="true" data-add="${t}" data-into="">${t === "set" ? "set total" : t === "add" ? "add to total" : t === "show" ? "show total" : t}</button>`).join("")}
          <small>Tap a block to add it, or drag it into the program.</small></div>
        <div class="bk-work" data-drop="" aria-label="Your program">${prog.length ? draw(prog, "") : '<p class="muted bk-empty">Your program is empty. Add a block.</p>'}</div>
        <div class="bk-out"><b>Python it writes</b><pre class="bk-py">${esc(blockPy(prog) || "# add blocks")}</pre>
          <b>Output</b><pre class="bk-res" aria-live="polite">${esc(blockRun(prog).join("\n") || "(nothing yet)")}</pre>
          <b>Target</b><pre>${esc(c.goal.join("\n"))}</pre>
          <button type="button" class="primary" id="bk-check">Check</button> <button type="button" class="text-btn" id="bk-clear">Clear</button></div>
      </div><p class="play-msg" role="status"></p>`;
  };
  const make = (t) => ({ print: { t, v: "Hi" }, set: { t, v: 0 }, add: { t, v: 2 }, show: { t }, repeat: { t, n: 3, body: [] } }[t]);
  root.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { const into = add.dataset.into; container(into).push(make(add.dataset.add)); sound("pop"); render(); return; }
    const act = e.target.closest("[data-act]");
    if (act) {
      const parts = act.dataset.p.split(".");
      const idx = +parts.pop();
      const list = container(parts.join("."));
      if (act.dataset.act === "del") list.splice(idx, 1);
      else if (act.dataset.act === "up" && idx > 0) [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
      else if (act.dataset.act === "down" && idx < list.length - 1) [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
      render();
    } else if (e.target.closest("#bk-clear")) { prog = []; render(); }
    else if (e.target.closest("#bk-check")) {
      const c = BLOCK_CHALLENGES[ci];
      const ok = JSON.stringify(blockRun(prog)) === JSON.stringify(c.goal);
      if (!ok) { sound("bad"); banner(root, "Not yet. Compare the output with the target.", false); return; }
      win(`blocks:${ci}`, c.xp, "block-builder");
      banner(root, ci < BLOCK_CHALLENGES.length - 1 ? `Yes! +${c.xp} XP. Next challenge...` : "All blocks challenges solved!");
      if (ci < BLOCK_CHALLENGES.length - 1) setTimeout(() => { ci += 1; prog = []; render(); }, 1400);
    }
  });
  root.addEventListener("change", (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    const parts = e.target.dataset.p.split(".");
    const idx = +parts.pop();
    const list = container(parts.join("."));
    list[idx][f] = f === "v" && e.target.tagName === "INPUT" ? Math.max(0, Math.min(20, +e.target.value || 0)) : f === "n" ? Math.max(1, Math.min(9, +e.target.value || 1)) : e.target.value;
    render();
  });
  root.addEventListener("dragstart", (e) => { const c = e.target.closest("[data-add]"); if (c) e.dataTransfer.setData("text/plain", c.dataset.add); });
  root.addEventListener("dragover", (e) => { if (e.target.closest("[data-drop]")) e.preventDefault(); });
  root.addEventListener("drop", (e) => {
    const zone = e.target.closest("[data-drop]");
    const t = e.dataTransfer.getData("text/plain");
    if (!zone || !t) return;
    e.preventDefault();
    const p = zone.dataset.drop;
    container(p).push(make(t));
    sound("pop");
    render();
  });
  render();
  return () => {};
}

/* ============ 2. Turtle art ============ */
const TURTLE_PRESETS = {
  square: "for i in range(4):\n    forward(90)\n    right(90)",
  star: 'color("gold")\nfor i in range(5):\n    forward(140)\n    right(144)',
  spiral: "for i in range(40):\n    color(i * 9)\n    forward(i * 3 + 4)\n    right(91)",
  flower: "for i in range(12):\n    color(i * 30)\n    for j in range(4):\n        forward(60)\n        right(90)\n    right(30)",
};
const NAMED = { red: "#ef4444", gold: "#facc15", green: "#22c55e", blue: "#3b82f6", pink: "#ec4899", purple: "#a855f7", orange: "#fb923c", cyan: "#22d3ee", white: "#ffffff" };
function safeNum(expr, vars) {
  let s = expr.trim();
  for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\b${k}\\b`, "g"), `(${v})`);
  if (!/^[0-9+\-*/().\s%]+$/.test(s) || s.length > 60) throw new Error(`I cannot use "${expr}" here. Use numbers, loop variables and + - * / only.`);
  const v = Function(`"use strict";return (${s})`)();
  if (!Number.isFinite(v)) throw new Error("That number is not finite.");
  return v;
}
export function turtlePlan(code) {
  const lines = code.replace(/\t/g, "    ").split("\n").map((t, i) => ({ t: t.replace(/#.*$/, "").replace(/\s+$/, ""), n: i + 1 })).filter((l) => l.t.trim());
  const cmds = [];
  let steps = 0;
  function block(i, indent, vars, run) {
    while (i < lines.length) {
      const l = lines[i];
      const ind = l.t.length - l.t.trimStart().length;
      if (ind < indent) return i;
      if (ind > indent) throw new Error(`Line ${l.n}: unexpected indent.`);
      const text = l.t.trim();
      const loop = text.match(/^for\s+([a-z])\s+in\s+range\(([^)]*)\)\s*:$/);
      if (loop) {
        const args = loop[2].split(",").map((a) => safeNum(a, vars));
        const [a, b] = args.length === 1 ? [0, args[0]] : args;
        const next = lines[i + 1];
        if (!next || next.t.length - next.t.trimStart().length <= indent) throw new Error(`Line ${l.n}: the for needs an indented body.`);
        const bodyIndent = next.t.length - next.t.trimStart().length;
        let end = i + 1;
        const count = Math.max(0, Math.min(200, Math.ceil(b - a)));
        if (count === 0) { end = block(i + 1, bodyIndent, { ...vars, [loop[1]]: a }, false); }
        for (let k = 0; k < count; k += 1) end = block(i + 1, bodyIndent, { ...vars, [loop[1]]: a + k }, run);
        i = end;
        continue;
      }
      const call = text.match(/^([a-z]+)\((.*)\)$/);
      if (!call) throw new Error(`Line ${l.n}: I only know commands like forward(50), right(90) and for i in range(4):`);
      const [, name, arg] = call;
      if (run) {
        if (++steps > 4000) throw new Error("That is more than 4000 steps. Try fewer.");
        if (["forward", "fd", "back", "bk", "left", "lt", "right", "rt", "width"].includes(name)) cmds.push([name, safeNum(arg, vars)]);
        else if (name === "color") cmds.push(["color", /^"[a-z]+"$/.test(arg.trim()) ? arg.trim().slice(1, -1) : safeNum(arg, vars)]);
        else if (name === "penup" || name === "pendown") cmds.push([name, 0]);
        else throw new Error(`Line ${l.n}: I do not know ${name}().`);
      }
      i += 1;
    }
    return i;
  }
  block(0, 0, {}, true);
  return cmds;
}
function mountTurtle(root) {
  root.innerHTML = `<div class="tt-layout"><div><label class="muted" for="tt-code">Python-style code (a tiny turtle, not full Python)</label>
    <textarea id="tt-code" spellcheck="false" rows="9" aria-describedby="tt-help">${esc(TURTLE_PRESETS.square)}</textarea>
    <p class="muted" id="tt-help">Commands: forward(n) back(n) left(deg) right(deg) color("gold") or color(number) width(n) penup() pendown(). Loops: for i in range(n):</p>
    <div class="tt-btns"><button type="button" class="primary" id="tt-run">Draw</button> ${Object.keys(TURTLE_PRESETS).map((k) => `<button type="button" class="text-btn" data-preset="${k}">${k}</button>`).join(" ")}</div>
    <p class="play-msg" role="status"></p></div>
    <canvas id="tt-canvas" width="420" height="420" aria-label="Turtle drawing"></canvas></div>`;
  const cv = $(root, "#tt-canvas");
  const ctx = cv.getContext("2d");
  let raf = 0;
  const reset = () => { ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, 420, 420); };
  reset();
  const draw = (cmds) => {
    cancelAnimationFrame(raf);
    reset();
    let x = 210; let y = 210; let a = -90; let pen = true; let col = "#7cf3ff"; ctx.lineWidth = 2; ctx.lineCap = "round";
    let i = 0;
    let minX = 1e9; let maxX = -1e9; let minY = 1e9; let maxY = -1e9; let segs = 0;
    const step = () => {
      const [n, v] = cmds[i];
      if (n === "forward" || n === "fd" || n === "back" || n === "bk") {
        const d = n[0] === "b" ? -v : v;
        const nx = x + Math.cos((a * Math.PI) / 180) * d; const ny = y + Math.sin((a * Math.PI) / 180) * d;
        if (pen) { ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = tier() === "high" ? 6 : 0; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke(); segs += 1; }
        x = nx; y = ny; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      } else if (n === "left" || n === "lt") a -= v;
      else if (n === "right" || n === "rt") a += v;
      else if (n === "color") col = typeof v === "number" ? `hsl(${((v % 360) + 360) % 360} 90% 62%)` : NAMED[v] || "#7cf3ff";
      else if (n === "width") ctx.lineWidth = Math.max(1, Math.min(12, v));
      else if (n === "penup") pen = false; else if (n === "pendown") pen = true;
      i += 1;
    };
    const done = () => { cv.dataset.segments = String(segs); if (segs >= 4) { win("turtle", 25, "turtle-artist"); banner(root, `Nice drawing: ${segs} lines. +XP the first time.`); } };
    if (tier() === "off") { while (i < cmds.length) step(); done(); return; }
    const per = Math.max(1, Math.ceil(cmds.length / 140));
    const tick = () => { for (let k = 0; k < per && i < cmds.length; k += 1) step(); if (i < cmds.length) raf = requestAnimationFrame(tick); else done(); };
    raf = requestAnimationFrame(tick);
  };
  root.addEventListener("click", (e) => {
    const p = e.target.closest("[data-preset]");
    if (p) { $(root, "#tt-code").value = TURTLE_PRESETS[p.dataset.preset]; $(root, "#tt-run").click(); }
    if (e.target.closest("#tt-run")) {
      try { const cmds = turtlePlan($(root, "#tt-code").value); if (!cmds.length) throw new Error("Nothing to draw yet."); banner(root, "Drawing..."); draw(cmds); }
      catch (err) { sound("bad"); banner(root, err.message, false); }
    }
  });
  return () => cancelAnimationFrame(raf);
}

/* ============ 3. Loop visualiser ============ */
const LOOP_PUZZLES = [
  { title: "Add up 1 to 4", code: ["total = 0", "for i in range(1, 5):", "    total = total + i"], ask: "What is total at the end?", answer: "10",
    trace: [{ l: 0, v: { total: 0 } }, { l: 1, v: { total: 0, i: 1 } }, { l: 2, v: { total: 1, i: 1 } }, { l: 1, v: { total: 1, i: 2 } }, { l: 2, v: { total: 3, i: 2 } }, { l: 1, v: { total: 3, i: 3 } }, { l: 2, v: { total: 6, i: 3 } }, { l: 1, v: { total: 6, i: 4 } }, { l: 2, v: { total: 10, i: 4 } }] },
  { title: "Build a word backwards", code: ['word = ""', 'for ch in "abc":', "    word = ch + word"], ask: "What is word at the end?", answer: "cba",
    trace: [{ l: 0, v: { word: '""' } }, { l: 1, v: { word: '""', ch: '"a"' } }, { l: 2, v: { word: '"a"', ch: '"a"' } }, { l: 1, v: { word: '"a"', ch: '"b"' } }, { l: 2, v: { word: '"ba"', ch: '"b"' } }, { l: 1, v: { word: '"ba"', ch: '"c"' } }, { l: 2, v: { word: '"cba"', ch: '"c"' } }] },
  { title: "Halve until 1", code: ["n = 10", "count = 0", "while n > 1:", "    n = n // 2", "    count += 1"], ask: "What is count at the end?", answer: "3",
    trace: [{ l: 0, v: { n: 10 } }, { l: 1, v: { n: 10, count: 0 } }, { l: 2, v: { n: 10, count: 0 } }, { l: 3, v: { n: 5, count: 0 } }, { l: 4, v: { n: 5, count: 1 } }, { l: 2, v: { n: 5, count: 1 } }, { l: 3, v: { n: 2, count: 1 } }, { l: 4, v: { n: 2, count: 2 } }, { l: 2, v: { n: 2, count: 2 } }, { l: 3, v: { n: 1, count: 2 } }, { l: 4, v: { n: 1, count: 3 } }, { l: 2, v: { n: 1, count: 3 } }] },
];
export { LOOP_PUZZLES };
function mountLoops(root) {
  let pi = 0; let si = -1; let prev = {};
  const render = () => {
    const p = LOOP_PUZZLES[pi];
    const st = si >= 0 ? p.trace[si] : null;
    const vars = st ? st.v : {};
    root.innerHTML = `<p class="muted">Puzzle ${pi + 1} of ${LOOP_PUZZLES.length}: ${esc(p.title)}. Step through, then answer.</p>
      <div class="lv-layout"><pre class="lv-code" aria-label="Code">${p.code.map((c, i) => `<span class="lv-line${st && st.l === i ? " on" : ""}">${esc(c) || " "}</span>`).join("\n")}</pre>
      <div class="lv-vars" aria-live="polite">${Object.keys(vars).length ? Object.entries(vars).map(([k, v]) => `<div class="lv-box${prev[k] !== undefined && String(prev[k]) !== String(v) ? " changed" : ""}"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("") : '<p class="muted">Variables appear here as the code runs.</p>'}</div></div>
      <div class="tt-btns"><button type="button" class="primary" id="lv-step">${si < 0 ? "Start" : si >= p.trace.length - 1 ? "Finished" : "Step"}</button>
      <button type="button" class="text-btn" id="lv-all">Run all steps</button> <button type="button" class="text-btn" id="lv-reset">Reset</button></div>
      <form class="guess-row" id="lv-form"><label class="muted" for="lv-ans">${esc(p.ask)}</label><input id="lv-ans" autocomplete="off" required><button class="primary" type="submit">Check</button></form>
      <p class="play-msg" role="status"></p>`;
  };
  root.addEventListener("click", (e) => {
    const p = LOOP_PUZZLES[pi];
    if (e.target.closest("#lv-step")) { if (si < p.trace.length - 1) { prev = si >= 0 ? p.trace[si].v : {}; si += 1; sound("pop"); render(); } }
    else if (e.target.closest("#lv-all")) { prev = p.trace[p.trace.length - 2]?.v || {}; si = p.trace.length - 1; render(); }
    else if (e.target.closest("#lv-reset")) { si = -1; prev = {}; render(); }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = LOOP_PUZZLES[pi];
    const v = $(root, "#lv-ans").value.trim().replace(/^["']|["']$/g, "");
    if (v === p.answer) {
      win(`loops:${pi}`, 20, "loop-master");
      banner(root, pi < LOOP_PUZZLES.length - 1 ? "Correct! Next puzzle..." : "Correct! All loop puzzles solved.");
      if (pi < LOOP_PUZZLES.length - 1) setTimeout(() => { pi += 1; si = -1; prev = {}; render(); }, 1300);
    } else { sound("bad"); banner(root, "Not quite. Step through once more and watch the boxes.", false); }
  });
  render();
  return () => {};
}

/* ============ 4. List lab ============ */
const LIST_PUZZLES = [
  { start: [3, 1, 2], target: [1, 2, 3, 9], max: 3, hint: "sort the list, then add 9 at the end" },
  { start: [1, 2, 3], target: [3, 2, 1, 0], max: 3, hint: "reverse, then append 0" },
  { start: [5, 6], target: [4, 5, 6, 7], max: 3, hint: "insert at the front, append at the end" },
];
function listOp(list, op, x) {
  const l = list.slice();
  if (op === "append") l.push(x); else if (op === "pop") l.pop(); else if (op === "insert") l.unshift(x);
  else if (op === "reverse") l.reverse(); else if (op === "sort") l.sort((a, b) => a - b);
  return l;
}
export { LIST_PUZZLES, listOp };
function mountLists(root) {
  let pi = 0; let list = []; let log = []; let x = 9;
  const load = () => { list = LIST_PUZZLES[pi].start.slice(); log = []; };
  const code = () => `nums = ${JSON.stringify(LIST_PUZZLES[pi].start).replace(/,/g, ", ")}\n${log.map((o) => (o.op === "append" ? `nums.append(${o.x})` : o.op === "insert" ? `nums.insert(0, ${o.x})` : `nums.${o.op}()`)).join("\n")}`.trim();
  const render = () => {
    const p = LIST_PUZZLES[pi];
    root.innerHTML = `<p class="muted">Puzzle ${pi + 1} of ${LIST_PUZZLES.length}. Reach the target using at most ${p.max} operations.</p>
      <div class="ls-row"><b>Now</b><div class="ls-list" aria-label="Current list">${list.map((v, i) => `<span class="ls-cell"><small>${i}</small>${v}</span>`).join("") || '<span class="muted">(empty)</span>'}</div></div>
      <div class="ls-row"><b>Target</b><div class="ls-list target" aria-label="Target list">${p.target.map((v, i) => `<span class="ls-cell"><small>${i}</small>${v}</span>`).join("")}</div></div>
      <div class="tt-btns" role="group" aria-label="List operations">
        <label class="muted" for="ls-x">Number</label><select id="ls-x">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => `<option${n === x ? " selected" : ""}>${n}</option>`).join("")}</select>
        ${["append", "insert", "pop", "reverse", "sort"].map((o) => `<button type="button" class="text-btn fx-btn" data-op="${o}">${o === "insert" ? "insert(0, n)" : o === "append" ? "append(n)" : o + "()"}</button>`).join("")}
        <button type="button" class="text-btn" id="ls-undo">Undo</button> <button type="button" class="text-btn" id="ls-reset">Reset</button></div>
      <pre class="lv-code" aria-label="Python so far">${esc(code())}</pre>
      <p class="muted">Operations used: ${log.length} of ${p.max}. Hint: ${esc(p.hint)}.</p><p class="play-msg" role="status"></p>`;
    if (JSON.stringify(list) === JSON.stringify(p.target)) {
      win(`lists:${pi}`, 20, "first-game");
      banner(root, pi < LIST_PUZZLES.length - 1 ? "You made the target! Next puzzle..." : "All list puzzles solved!");
      if (pi < LIST_PUZZLES.length - 1) setTimeout(() => { pi += 1; load(); render(); }, 1400);
    } else if (log.length >= p.max) banner(root, "Out of operations. Undo or Reset and try another order.", false);
  };
  root.addEventListener("click", (e) => {
    const op = e.target.closest("[data-op]");
    if (op && log.length < LIST_PUZZLES[pi].max) { x = +($(root, "#ls-x").value); list = listOp(list, op.dataset.op, x); log.push({ op: op.dataset.op, x }); sound("pop"); render(); }
    else if (e.target.closest("#ls-undo") && log.length) { log.pop(); list = LIST_PUZZLES[pi].start.slice(); log.forEach((o) => { list = listOp(list, o.op, o.x); }); render(); }
    else if (e.target.closest("#ls-reset")) { load(); render(); }
  });
  load(); render();
  return () => {};
}

/* ============ 5. Code sorter (drag and drop, or move buttons) ============ */
const ORDER_PUZZLES = [
  { title: "A function", lines: ["def add(a, b):", "    return a + b", "print(add(2, 3))"] },
  { title: "Sum a list", lines: ["total = 0", "for n in [1, 2, 3]:", "    total += n", "print(total)"] },
  { title: "Choose with if", lines: ["age = 12", "if age >= 13:", '    print("teen")', "else:", '    print("kid")'] },
];
export { ORDER_PUZZLES };
function mountOrder(root) {
  let pi = 0; let order = [];
  const shuffle = () => {
    const n = ORDER_PUZZLES[pi].lines.length;
    order = Array.from({ length: n }, (_, i) => i);
    do { for (let i = n - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } } while (order.every((v, i) => v === i));
  };
  const render = () => {
    const p = ORDER_PUZZLES[pi];
    root.innerHTML = `<p class="muted">Puzzle ${pi + 1} of ${ORDER_PUZZLES.length}: ${esc(p.title)}. Drag the lines, or use the arrows, then check.</p>
      <ol class="or-list" aria-label="Lines of code, in your order">${order.map((li, pos) => `<li class="or-line" draggable="true" data-pos="${pos}"><span class="or-grip" aria-hidden="true">⋮⋮</span><code>${esc(p.lines[li])}</code>
        <span class="bk-ctl"><button type="button" data-mv="up" data-pos="${pos}" aria-label="Move line ${pos + 1} up">▲</button><button type="button" data-mv="down" data-pos="${pos}" aria-label="Move line ${pos + 1} down">▼</button></span></li>`).join("")}</ol>
      <div class="tt-btns"><button type="button" class="primary" id="or-check">Check order</button> <button type="button" class="text-btn" id="or-shuffle">Shuffle again</button></div><p class="play-msg" role="status"></p>`;
  };
  const move = (a, b) => { if (b < 0 || b >= order.length) return; const [v] = order.splice(a, 1); order.splice(b, 0, v); render(); };
  let from = -1;
  root.addEventListener("click", (e) => {
    const mv = e.target.closest("[data-mv]");
    if (mv) { const pos = +mv.dataset.pos; move(pos, mv.dataset.mv === "up" ? pos - 1 : pos + 1); root.querySelector(`[data-mv="${mv.dataset.mv}"][data-pos="${mv.dataset.mv === "up" ? Math.max(0, pos - 1) : Math.min(order.length - 1, pos + 1)}"]`)?.focus(); }
    else if (e.target.closest("#or-shuffle")) { shuffle(); render(); }
    else if (e.target.closest("#or-check")) {
      if (order.every((v, i) => v === i)) {
        win(`order:${pi}`, 20, "sorter");
        banner(root, pi < ORDER_PUZZLES.length - 1 ? "Perfect order! Next puzzle..." : "All code sorter puzzles solved!");
        if (pi < ORDER_PUZZLES.length - 1) setTimeout(() => { pi += 1; shuffle(); render(); }, 1400);
      } else { sound("bad"); const ok = order.filter((v, i) => v === i).length; banner(root, `${ok} of ${order.length} lines are in the right place.`, false); }
    }
  });
  root.addEventListener("dragstart", (e) => { const li = e.target.closest(".or-line"); if (li) { from = +li.dataset.pos; e.dataTransfer.setData("text/plain", String(from)); e.dataTransfer.effectAllowed = "move"; } });
  root.addEventListener("dragover", (e) => { if (e.target.closest(".or-line")) e.preventDefault(); });
  root.addEventListener("drop", (e) => { const li = e.target.closest(".or-line"); if (li && from >= 0) { e.preventDefault(); move(from, +li.dataset.pos); from = -1; } });
  shuffle(); render();
  return () => {};
}

/* ============ 6. Pong ============ */
function mountPong(root) {
  root.innerHTML = `<canvas id="pong" width="480" height="320" aria-label="Pong. Move the left paddle with the pointer or arrow keys." tabindex="0"></canvas>
    <p aria-live="polite">You <b id="pg-you">0</b> : <b id="pg-ai">0</b> Py. First to 3. <button type="button" class="text-btn" id="pg-again">Restart</button></p><p class="play-msg" role="status"></p>`;
  const cv = $(root, "#pong"); const ctx = cv.getContext("2d");
  const S = { you: 0, ai: 0, py: 130, ay: 130, bx: 240, by: 160, vx: 3.2, vy: 2, over: false };
  const serve = (dir) => { S.bx = 240; S.by = 160; S.vx = 3.2 * dir; S.vy = (Math.random() * 2 - 1) * 2.2; };
  let raf = 0; let key = 0;
  const reset = () => { S.you = 0; S.ai = 0; S.over = false; serve(1); $(root, "#pg-you").textContent = "0"; $(root, "#pg-ai").textContent = "0"; banner(root, ""); };
  const pointer = (e) => { const r = cv.getBoundingClientRect(); S.py = Math.max(0, Math.min(260, ((e.clientY - r.top) / r.height) * 320 - 30)); };
  cv.addEventListener("pointermove", pointer); cv.addEventListener("pointerdown", pointer);
  cv.style.touchAction = "none";
  const kd = (e) => { if (e.key === "ArrowUp") { key = -1; e.preventDefault(); } else if (e.key === "ArrowDown") { key = 1; e.preventDefault(); } };
  const ku = (e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") key = 0; };
  document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
  const score = (who) => {
    S[who] += 1; $(root, "#pg-you").textContent = S.you; $(root, "#pg-ai").textContent = S.ai; sound(who === "you" ? "pop" : "bad");
    if (S.you >= 3) { S.over = true; win("pong", 30, "arcade-pro"); banner(root, "You win Pong! +XP"); } else if (S.ai >= 3) { S.over = true; banner(root, "Py wins this one. Restart to try again.", false); } else serve(who === "you" ? -1 : 1);
  };
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    if (!S.over) {
      S.py = Math.max(0, Math.min(260, S.py + key * 5));
      const target = S.by - 30; S.ay += Math.max(-1.7, Math.min(1.7, target - S.ay));
      S.bx += S.vx; S.by += S.vy;
      if (S.by < 6 || S.by > 314) S.vy *= -1;
      if (S.vx < 0 && S.bx < 24 && S.bx > 10 && S.by > S.py - 4 && S.by < S.py + 64) { S.vx = Math.min(8, -S.vx * 1.06); S.vy += (S.by - (S.py + 30)) / 12; sound("tap"); }
      if (S.vx > 0 && S.bx > 456 && S.bx < 470 && S.by > S.ay - 4 && S.by < S.ay + 64) { S.vx = -S.vx * 1.02; S.vy += (S.by - (S.ay + 30)) / 14; }
      if (S.bx < -10) score("ai"); else if (S.bx > 490) score("you");
    }
    ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, 480, 320);
    ctx.strokeStyle = "#334155"; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(240, 0); ctx.lineTo(240, 320); ctx.stroke(); ctx.setLineDash([]);
    ctx.shadowColor = "#7cf3ff"; ctx.shadowBlur = tier() === "high" ? 12 : 0;
    ctx.fillStyle = "#7cf3ff"; ctx.fillRect(10, S.py, 10, 60);
    ctx.fillStyle = "#ff5da2"; ctx.shadowColor = "#ff5da2"; ctx.fillRect(460, S.ay, 10, 60);
    ctx.fillStyle = "#ffd43b"; ctx.shadowColor = "#ffd43b"; ctx.beginPath(); ctx.arc(S.bx, S.by, 7, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
    cv.dataset.ballY = String(Math.round(S.by)); cv.dataset.you = String(S.you); cv.dataset.ai = String(S.ai);
  };
  $(root, "#pg-again").addEventListener("click", reset);
  reset(); raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); };
}

const MOUNT = { blocks: mountBlocks, turtle: mountTurtle, loops: mountLoops, lists: mountLists, order: mountOrder, pong: mountPong };
export const isPlay = (id) => id in MOUNT;
export function mountPlay(id, root) { return MOUNT[id](root); }
