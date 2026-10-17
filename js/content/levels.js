/* The eleven worlds (Levels 0-10) from the v2 blueprint (08_BRAND_SYSTEM.md, 03_COURSE_MAP.md).
   Levels 0-3 have their own 3D scene. Levels 4-10 use the shared "fallback" scene tinted with their accent.
   `module` is the id of a Download Center module that exists today (null = not built yet). */
export const levels = [
  { n: 0, id: "meadow", name: "Hatchling Meadow", accent: "#7ee08a", glyph: "seedling", scene: "level-00", hours: 4, module: "L00",
    blurb: "Run a first program, read an error, find the docs.", alt: "A green meadow with floating stones that each carry a print statement, and drifting fireflies.", lessons: ["#/lesson/start/how-to-use", "#/lesson/start/runtime"] },
  { n: 1, id: "tidepool", name: "Tidepool", accent: "#4fd1e6", glyph: "drop", scene: "level-01", hours: 10, module: "L01",
    blurb: "Values, types, names and strings: model small pieces of data.", alt: "A tide pool with rising bubbles, each bubble standing for one type of value.", lessons: ["#/lesson/fundamentals/types", "#/lesson/fundamentals/names"] },
  { n: 2, id: "crossroads", name: "Crossroads", accent: "#ffd166", glyph: "fork", scene: "level-02", hours: 14, module: "L02",
    blurb: "if, loops and tracing a program by hand.", alt: "A crossroads where lines of light split into branches and pulses travel along them.", lessons: ["#/lesson/fundamentals/control"] },
  { n: 3, id: "workshop", name: "Workshop", accent: "#ff9f43", glyph: "gear", scene: "level-03", hours: 20, module: "L03",
    blurb: "Functions, scope, docstrings and a first test.", alt: "A workshop of meshing gears, each gear a function, with a few sparks.", lessons: ["#/lesson/fundamentals/functions"] },
  { n: 4, id: "stacks", name: "Library Stacks", accent: "#c792ff", glyph: "shelf", scene: "fallback", hours: 30, module: null,
    blurb: "Lists, dicts, sets, files and exceptions.", alt: "Shared studio scene: a slowly turning wireframe shape over an aurora.", lessons: ["#/track/dsa"] },
  { n: 5, id: "forge", name: "Forge", accent: "#ff6b6b", glyph: "anvil", scene: "fallback", hours: 35, module: null,
    blurb: "Classes, modules, packages and virtual environments.", alt: "Shared studio scene: a slowly turning wireframe shape over an aurora.", lessons: ["#/lesson/fundamentals/classes"] },
  { n: 6, id: "yard", name: "Automation Yard", accent: "#5eead4", glyph: "conveyor", scene: "fallback", hours: 30, module: null,
    blurb: "pathlib, re, argparse and safe automation.", alt: "Shared studio scene: a slowly turning wireframe shape over an aurora.", lessons: ["#/section/integrations"] },
  { n: 7, id: "observatory", name: "Observatory", accent: "#8ab4ff", glyph: "telescope", scene: "fallback", hours: 40, module: null,
    blurb: "Generators, decorators and typing in depth.", alt: "Shared studio scene: a slowly turning wireframe shape over an aurora.", lessons: ["#/track/typing"] },
  { n: 8, id: "engine", name: "Engine Room", accent: "#f78fb3", glyph: "turbine", scene: "fallback", hours: 40, module: null,
    blurb: "Concurrency and asyncio.", alt: "Shared studio scene: a slowly turning wireframe shape over an aurora.", lessons: ["#/track/async"] },
  { n: 9, id: "spec", name: "Spec Hall", accent: "#e4d9a8", glyph: "scroll", scene: "fallback", hours: 40, module: null,
    blurb: "Read PEPs and the data model.", alt: "Shared studio scene: a slowly turning wireframe shape over an aurora.", lessons: ["#/section/resources"] },
  { n: 10, id: "reactor", name: "Core Reactor", accent: "#ffffff", glyph: "core", scene: "fallback", hours: 70, module: null,
    blurb: "The ecosystem and a capstone project.", alt: "Shared studio scene: a slowly turning wireframe shape over an aurora.", lessons: ["#/ecosystem/glossary"] },
];
export const levelById = (n) => levels.find((l) => l.n === Number(n));
