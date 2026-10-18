/* The eleven worlds (Levels 0-10). Each Level has its own scene module.
   `module` is the Download Center id built from content/<level>/module.md. */
export const levels = [
  { n: 0, id: "meadow", name: "Hatchling Meadow", accent: "#7ee08a", glyph: "seedling", scene: "level-00", hours: 4, module: "L00",
    blurb: "Run a first program, read an error, find the docs.", alt: "A green meadow with floating stones that each carry a print statement, and drifting fireflies.", lessons: ["#/lesson/start/how-to-use", "#/lesson/start/runtime"] },
  { n: 1, id: "tidepool", name: "Tidepool", accent: "#4fd1e6", glyph: "drop", scene: "level-01", hours: 10, module: "L01",
    blurb: "Values, types, names and strings: model small pieces of data.", alt: "A tide pool with rising bubbles, each bubble standing for one type of value.", lessons: ["#/lesson/fundamentals/types", "#/lesson/fundamentals/names"] },
  { n: 2, id: "crossroads", name: "Crossroads", accent: "#ffd166", glyph: "fork", scene: "level-02", hours: 14, module: "L02",
    blurb: "if, loops and tracing a program by hand.", alt: "A crossroads where lines of light split into branches and pulses travel along them.", lessons: ["#/lesson/fundamentals/control"] },
  { n: 3, id: "workshop", name: "Workshop", accent: "#ff9f43", glyph: "gear", scene: "level-03", hours: 20, module: "L03",
    blurb: "Functions, scope, docstrings and a first test.", alt: "A workshop of meshing gears, each gear a function, with a few sparks.", lessons: ["#/lesson/fundamentals/functions"] },
  { n: 4, id: "stacks", name: "Library Stacks", accent: "#c792ff", glyph: "shelf", scene: "level-04", hours: 30, module: "L04",
    blurb: "Lists, dicts, sets, files and exceptions.", alt: "Book stacks in purple and gold, with floating labels for list, dict and set, and a card that bobs.", lessons: ["#/track/dsa"] },
  { n: 5, id: "forge", name: "Forge", accent: "#ff6b6b", glyph: "anvil", scene: "level-05", hours: 35, module: "L05",
    blurb: "Classes, modules, packages and virtual environments.", alt: "A grey anvil with a horn, a wooden base, and orange sparks rising past a class label.", lessons: ["#/lesson/fundamentals/classes"] },
  { n: 6, id: "yard", name: "Automation Yard", accent: "#5eead4", glyph: "conveyor", scene: "level-06", hours: 30, module: "L06",
    blurb: "pathlib, re, argparse and safe automation.", alt: "A teal belt carrying coloured boxes, with labels for path, re and args.", lessons: ["#/section/integrations"] },
  { n: 7, id: "observatory", name: "Observatory", accent: "#8ab4ff", glyph: "telescope", scene: "level-07", hours: 40, module: "L07",
    blurb: "Generators, decorators and typing in depth.", alt: "A pale telescope pointed up, a blue lens, and a field of stars.", lessons: ["#/track/typing"] },
  { n: 8, id: "engine", name: "Engine Room", accent: "#f78fb3", glyph: "turbine", scene: "level-08", hours: 40, module: "L08",
    blurb: "Concurrency and asyncio.", alt: "Three pink turbines with four blades each, spinning in front of an async label.", lessons: ["#/track/async"] },
  { n: 9, id: "spec", name: "Spec Hall", accent: "#e4d9a8", glyph: "scroll", scene: "level-09", hours: 40, module: "L09",
    blurb: "Read PEPs and the data model.", alt: "Three cream pages labelled PEP 8, data and len, turning on a gold rail.", lessons: ["#/section/resources"] },
  { n: 10, id: "reactor", name: "Core Reactor", accent: "#7f8cff", glyph: "core", scene: "level-10", hours: 70, module: "L10",
    blurb: "The ecosystem and a capstone project.", alt: "A bright icosahedron core inside a white wire shell, with py, json and math orbiting it.", lessons: ["#/ecosystem/glossary"] },
];
export const levelById = (n) => levels.find((l) => l.n === Number(n));
