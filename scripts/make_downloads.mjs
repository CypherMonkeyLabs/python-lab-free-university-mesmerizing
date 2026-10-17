// Generates downloads/python-lab-slides.md and downloads/python-lab-code-samples.ipynb from the lab's content.
import { writeFileSync } from "node:fs";
import { decks } from "../js/content/slides.js";
import { guides } from "../js/content/guides.js";

let md = "# Python Lab slides\n\nText of every slide deck in the lab. Code outputs shown were run on CPython 3.14 unless a note says otherwise.\nContent licence: CC BY-NC-SA 4.0. See the repository LICENSE.\n\n";
for (const d of decks) {
  md += `## ${d.title} (${d.level})\n\n${d.blurb}\n\n`;
  d.slides.forEach((s, i) => {
    md += `### ${i + 1}. ${s.t}\n\n${s.pts.map((p) => `- ${p}`).join("\n")}\n\n`;
    if (s.code) md += "```python\n" + s.code + "\n```\n\n";
    if (s.out) md += "Output:\n\n```text\n" + s.out + "\n```\n\n";
    if (s.note) md += `> ${s.note}\n\n`;
  });
}
writeFileSync("downloads/python-lab-slides.md", md);

const cells = [];
const src = (t) => t.split("\n").map((l, i, a) => (i < a.length - 1 ? l + "\n" : l));
const md1 = (t) => cells.push({ cell_type: "markdown", metadata: {}, source: src(t) });
const code = (c, out) => cells.push({ cell_type: "code", metadata: {}, execution_count: null, outputs: out ? [{ output_type: "stream", name: "stdout", text: src(out + "\n") }] : [], source: src(c) });
md1("# Python Lab code samples\n\nCode from the lab's slides and guides. The saved outputs were produced on CPython 3.14. Run the cells in Jupyter on your own computer. Content licence: CC BY-NC-SA 4.0.");
for (const d of decks) for (const s of d.slides) if (s.code && s.out) { md1(`## ${d.title}: ${s.t}${s.note ? `\n\n${s.note}` : ""}`); code(s.code, s.out); }
for (const g of guides) if (g.code && g.out) { md1(`## Guide: ${g.title}${g.note ? `\n\n${g.note}` : ""}`); code(g.code, g.out); }
writeFileSync("downloads/python-lab-code-samples.ipynb", JSON.stringify({ cells, metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python" } }, nbformat: 4, nbformat_minor: 5 }, null, 1) + "\n");
console.log("slides md and notebook written", cells.length, "cells");
