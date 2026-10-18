/* One catalogue for every download: the app reads it, and scripts/build_release_downloads.mjs mirrors the text files into release/downloads/. */
export const DOWNLOADS = [
  { id: "syntax", title: "Python syntax cheat sheet", desc: "Indentation, types, control flow, and a few current language notes. One printable page.", src: "python-syntax-cheatsheet", release: "python-lab-syntax-cheat-sheet", formats: ["pdf", "txt"] },
  { id: "data", title: "Data structures cheat sheet", desc: "Lists, dicts, sets, deques, and how to talk about cost.", src: "data-structures-cheatsheet", release: "python-lab-data-structures-cheat-sheet", formats: ["pdf", "txt"] },
  { id: "stdlib", title: "Standard library and typing cheat sheet", desc: "Modules to reach for, annotation forms, and what is not in the standard library.", src: "stdlib-typing-cheatsheet", release: "python-lab-standard-library-and-typing-cheat-sheet", formats: ["pdf", "txt"] },
  { id: "study", title: "Study checklist", desc: "A study order, a reminder about pay claims, and the exam pages to open.", src: "study-checklist", release: "python-lab-study-checklist", formats: ["pdf", "txt"] },
  { id: "slides", title: "All slide decks as Markdown", desc: "Every slide from all decks, with code and output. Opens in any text editor.", src: "python-lab-slides", release: "python-lab-all-slides", formats: ["md"] },
  { id: "notebook", title: "Code samples Jupyter notebook", desc: "Code from the slides and guides with saved output. Open it in Jupyter or VS Code on your own computer.", src: "python-lab-code-samples", release: "python-lab-code-samples-notebook", formats: ["ipynb"] },
];
export const FORMAT_LABEL = { pdf: "Download PDF", txt: "Download plain text", md: "Download Markdown", ipynb: "Download notebook (.ipynb)" };
