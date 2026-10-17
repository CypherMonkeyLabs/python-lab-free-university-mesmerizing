import { codeBlock } from "../util.js";

export const startTrack = {
  id: "start",
  title: "Start here",
  icon: "start",
  menu: "How the lab is organized, and what the browser can actually run.",
  intro: "Three short pages before the language lessons. They explain the map, the runtime, and how to read a citation.",
  sources: ["tutorial", "py-downloads", "pyodide", "pyodide-changelog"],
  lessons: [
    {
      id: "how-to-use",
      title: "How to use this lab",
      level: "Beginner",
      minutes: 6,
      summary: "Read a page, run the check, and follow the source when a fact matters.",
      sources: ["tutorial", "py-downloads"],
      sections: [
        {
          heading: "A page, then a check",
          html: `<p>Each lesson states one idea, shows a small program, and often asks you to write a function. The Run button starts a real Python interpreter that lives in this site. A check is an assertion. If it fails, the message names the check.</p>
          <p>You do not need an account. Progress for passed checks is stored in this browser only.</p>`,
        },
        {
          heading: "Citations",
          html: `<p>When a page depends on a release date, an exam code, or a language rule, it links to Sources. If the live page and this lab disagree, believe the live page. Exam prices and pending exam dates move.</p>`,
        },
      ],
    },
    {
      id: "map",
      title: "A map of the language",
      level: "Beginner",
      minutes: 8,
      summary: "Python is a language, a standard library, and a crowd of third-party packages.",
      diagram: `flowchart TD
  A[Your text file] --> B[CPython compiles it]
  B --> C[It runs top to bottom]
  C --> D[import loads other modules]`,
      diagramCaption: "A module is compiled and then executed from top to bottom",
      sources: ["tutorial", "modules", "py-downloads"],
      sections: [
        {
          heading: "Three layers",
          html: `<p>The language is the grammar: indentation, names, calls, classes. The standard library is the set of modules that ship with CPython, such as pathlib, json, and unittest. Everything else, including Flask, FastAPI, NumPy, pandas, and pytest, is a third-party package you choose to install.</p>
          <p>As of 17 October 2026, the newest stable CPython release on python.org is 3.15.0, released 9 October 2026. Python 3.14 is still in bugfix status. This lab teaches the language that both of those releases share, and it labels the 3.15-only syntax.</p>`,
        },
        {
          heading: "A first program",
          html: `<p>A program can be one call. The parentheses matter. Without them, you mention the function and do not run it.</p>${codeBlock('print("Hello")')}`,
        },
      ],
      exercise: {
        prompt: "Write greet() so it returns the string Hello, lab. Include the comma and the space.",
        starter: "def greet():\n    return \"\"\n",
        checks: ["assert greet() == 'Hello, lab'"],
      },
    },
    {
      id: "runtime",
      title: "The browser runtime",
      level: "Beginner",
      minutes: 8,
      summary: "Pyodide 314.0.7 runs CPython 3.14.2 in the page, with NumPy and pandas vendored beside it.",
      sources: ["pyodide", "pyodide-changelog", "whatsnew-315", "numpy", "pandas"],
      sections: [
        {
          heading: "What Run actually starts",
          html: `<p>The practice desk and the lesson checks use Pyodide, a build of CPython compiled to WebAssembly. The copy in this site is Pyodide 314.0.7, which the project changelog describes as upgraded to Python 3.14.2. NumPy 2.4.6 and pandas 3.0.2 are stored next to it, so the data lessons can import them without a network install.</p>
          <p>The first run reads those local files. Later runs reuse the interpreter until you reload the page.</p>`,
        },
        {
          heading: "What it will not do",
          html: `<p>It will not run Python 3.15-only syntax such as lazy import or a frozendict literal built-in that 3.14 does not have. It will not open ordinary TLS connections to the public internet. Files you write exist in the page's memory filesystem, often under /tmp, and disappear when you reload.</p>
          <p>Install CPython from python.org when you want a terminal, a virtual environment, and the newest release.</p>`,
        },
      ],
      exercise: {
        prompt: "Write runtime_note() that returns the string 3.14 desk. This is a label for the browser, not a probe of sys.version.",
        starter: "def runtime_note():\n    return \"\"\n",
        checks: ["assert runtime_note() == '3.14 desk'"],
      },
    },
  ],
  quiz: [
    {
      prompt: "What does the Run button in this lab start?",
      choices: [
        "A remote server that stores your code",
        "A local Pyodide build of CPython 3.14.2",
        "Python 3.15, because that is the newest release",
        "A screenshot of a terminal",
      ],
      answer: 1,
      why: "Pyodide 314.0.7 in this site tracks CPython 3.14.2. Python 3.15.0 is newer and is not the browser runtime.",
      source: "pyodide-changelog",
    },
    {
      prompt: "Which of these ships with CPython itself?",
      choices: ["pytest", "Flask", "pathlib", "pandas"],
      answer: 2,
      why: "pathlib is a standard-library module. pytest, Flask, and pandas are third-party packages.",
      source: "pathlib",
    },
  ],
};
