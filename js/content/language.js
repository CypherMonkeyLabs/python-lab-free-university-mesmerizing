import { codeBlock } from "../util.js";

export const asyncTrack = {
  id: "async",
  title: "Async",
  icon: "async",
  menu: "Coroutines, tasks, and the event loop, including what await does not do.",
  intro: "asyncio lets one thread wait on many slow operations. It does not, by itself, run CPU work on several cores.",
  sources: ["asyncio-docs"],
  lessons: [
    {
      id: "why",
      title: "What async is for",
      level: "Intermediate",
      minutes: 10,
      summary: "Use it when the program spends time waiting, not when it spends time calculating.",
      sources: ["asyncio-docs"],
      sections: [
        {
          heading: "Waiting versus working",
          html: `<p>A download, a database call, or a timer leaves the CPU idle. await marks a place where this coroutine can pause so another one can run. A tight numerical loop does not pause, so marking it async does not make it faster. Threads, processes, or a free-threaded build are different tools, with their own costs.</p>`,
        },
      ],
    },
    {
      id: "coroutines",
      title: "async, await, and tasks",
      level: "Intermediate",
      minutes: 14,
      summary: "Calling an async function returns a coroutine. A task schedules it.",
      diagram: `flowchart LR
  A[async def] --> B[coroutine object]
  B --> C[task on the loop]
  C --> D[await pauses it]
  D --> C`,
      diagramCaption: "The loop resumes a coroutine after the thing it awaited finishes",
      sources: ["asyncio-docs"],
      sections: [
        {
          heading: "The objects",
          html: `<p>async def defines a coroutine function. Calling it does not run the body. It returns a coroutine. asyncio.create_task schedules that coroutine. await waits for a result and gives the loop a chance to run something else. asyncio.gather runs several awaitables and collects their results.</p>
          ${codeBlock("import asyncio\n\nasync def delayed_sum(a, b):\n    await asyncio.sleep(0)\n    return a + b\n")}`,
        },
      ],
      exercise: {
        prompt: "Write delayed_sum(a, b) as a coroutine that awaits asyncio.sleep(0) and returns a + b.",
        starter: "import asyncio\n\nasync def delayed_sum(a, b):\n    return a + b\n",
        checks: ["assert await delayed_sum(2, 3) == 5", "assert await delayed_sum(-1, 1) == 0"],
      },
    },
    {
      id: "pitfalls",
      title: "Timeouts, cancellation, and mistakes",
      level: "Advanced",
      minutes: 12,
      summary: "A task you never await can fail in silence. A timeout should be a choice.",
      sources: ["asyncio-docs"],
      sections: [
        {
          heading: "Keep a handle on the task",
          html: `<p>If you create a task and drop the only reference, you can miss its exception. Await it, or keep the task and attach a done callback you actually read. asyncio.timeout, or wait_for, puts a bound on how long you are willing to wait. Cancellation raises CancelledError inside the coroutine. Cleanup belongs in finally or in a context manager.</p>
          <p>Do not call blocking functions such as time.sleep inside a coroutine if you want the loop to stay responsive. Use asyncio.sleep. Blocking file and network calls have the same problem unless you move them off the loop.</p>`,
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "What does calling an async def function return?",
      choices: ["The return value, immediately", "A coroutine object", "A new thread", "A compiled wheel"],
      answer: 1,
      why: "The body runs when the event loop drives the coroutine, not at the call.",
      source: "asyncio-docs",
    },
    {
      prompt: "await is the right tool when",
      choices: ["You want a CPU loop to use every core", "The coroutine needs to pause for a result", "You are defining a class", "You are writing a type annotation"],
      answer: 1,
      why: "await yields control while something else completes. It is not a multi-core switch.",
      source: "asyncio-docs",
    },
  ],
};

export const typingTrack = {
  id: "typing",
  title: "Typing",
  icon: "typing",
  menu: "Annotations that document shapes, and the separate tools that check them.",
  intro: "Type hints are readable contracts. CPython does not reject a bad argument because you annotated it.",
  sources: ["typing", "pep-649", "mypy", "pyright"],
  lessons: [
    {
      id: "annotations",
      title: "Annotations are not a gate",
      level: "Intermediate",
      minutes: 10,
      summary: "The interpreter stores annotations. A type checker reads them.",
      sources: ["typing", "pep-649"],
      sections: [
        {
          heading: "What 3.14 changed",
          html: `<p>Since Python 3.14, annotations are evaluated lazily, as specified by PEP 649 and PEP 749. You can refer to a class that is defined later without quoting the name. The annotationlib module inspects them. None of that adds a check at call time. A function annotated as taking an int will still accept a str unless your own code, or a library, checks.</p>
          ${codeBlock("def greet(name: str) -> str:\n    return f\"Hello, {name}\"\n")}`,
        },
      ],
      exercise: {
        prompt: "Write greet(name) that returns Hello, followed by a comma, a space, and the name. An annotation is optional. The check calls the function.",
        starter: "def greet(name: str) -> str:\n    return \"\"\n",
        checks: ["assert greet('Ada') == 'Hello, Ada'"],
      },
    },
    {
      id: "shapes",
      title: "Common shapes",
      level: "Intermediate",
      minutes: 12,
      summary: "list[int], unions, TypedDict, and Protocol cover most everyday hints.",
      sources: ["typing"],
      sections: [
        {
          heading: "Forms you will read",
          html: `<p>Built-in generics such as list[str] and dict[str, int] have been valid since Python 3.9. X | None is the union with None. tuple[int, ...] means a tuple of ints of unknown length. TypedDict describes a dict with named keys. Protocol describes methods an object must have, without requiring a base class. TypeAlias gives a long hint a name.</p>
          <p>These forms describe objects. They are not runtime schemas. Pydantic and similar libraries can choose to enforce a model. That behavior belongs to the library.</p>`,
        },
      ],
    },
    {
      id: "checkers",
      title: "mypy and Pyright",
      level: "Intermediate",
      minutes: 8,
      summary: "A type checker is a separate program you run on purpose.",
      sources: ["mypy", "pyright"],
      sections: [
        {
          heading: "Pick one and run it",
          html: `<p>mypy and Pyright both read annotations and report mismatches. They are third-party tools. Their answers can differ on hard cases. In a project, run the checker the same way you run tests, and treat a new error as a failed check. This browser runtime does not include either checker.</p>`,
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "Does a type annotation by itself stop a bad argument at runtime?",
      choices: ["Yes, since Python 3.5", "Yes, since Python 3.14", "No", "Only for int"],
      answer: 2,
      why: "Annotations are stored for tools and for libraries that opt in. The interpreter does not type-check calls.",
      source: "typing",
    },
    {
      prompt: "mypy is",
      choices: ["A standard-library module", "A third-party type checker", "A web framework", "A packaging format"],
      answer: 1,
      why: "mypy is a separate static type checker. typing is the standard-library module of hint forms.",
      source: "mypy",
    },
  ],
};

export const stdlib = {
  id: "stdlib",
  title: "Standard library",
  icon: "stdlib",
  menu: "The modules that arrive with CPython, from text and time to processes and tests.",
  intro: "Look here before you add a dependency. The standard library is large on purpose.",
  sources: ["statistics", "json", "csv", "datetime", "pathlib", "subprocess", "logging", "sqlite"],
  lessons: [
    {
      id: "map",
      title: "A tour map",
      level: "Beginner",
      minutes: 8,
      summary: "Group the library by the job, not by the alphabet.",
      sources: ["tutorial"],
      sections: [
        {
          heading: "Jobs, not a dump",
          html: `<p>Text and formats: string methods, re, json, csv, textwrap. Numbers: math, statistics, random, decimal, fractions. Time: datetime, time, zoneinfo, calendar. Files and processes: pathlib, shutil, os, subprocess, tempfile. Data you keep: sqlite3, pickle with care, shelve rarely. Quality: unittest, logging, traceback, pdb, doctest. Concurrency: threading, multiprocessing, concurrent.futures, asyncio. The rest exists. Learn it when a task names it.</p>`,
        },
      ],
    },
    {
      id: "text-time",
      title: "Text, JSON, CSV, and time",
      level: "Beginner",
      minutes: 12,
      summary: "Most small tools are a file of records and a clock.",
      sources: ["json", "csv", "datetime", "statistics"],
      sections: [
        {
          heading: "Records",
          html: `<p>json is for nested data and speaks Unicode. csv is for rows. Both need an encoding decision when they meet a file. datetime.date and datetime.datetime are aware of calendars. Attach a timezone when the clock time belongs to a place. statistics.mean is clearer than dividing a sum yourself for everyday numbers.</p>
          ${codeBlock("import json\nfrom statistics import mean\n\ndef average_score(payload):\n    rows = json.loads(payload)\n    return mean(row[\"score\"] for row in rows)\n")}`,
        },
      ],
      exercise: {
        prompt: "Write average_score(payload) where payload is a JSON list of objects with a score field. Return the mean as a float.",
        starter: "import json\nfrom statistics import mean\n\ndef average_score(payload):\n    return 0\n",
        checks: ["assert average_score('[{\"score\": 1}, {\"score\": 3}]') == 2"],
      },
    },
    {
      id: "processes",
      title: "Paths, processes, and SQLite",
      level: "Intermediate",
      minutes: 12,
      summary: "pathlib for names, subprocess to launch a program, sqlite3 to keep rows.",
      sources: ["pathlib", "subprocess", "sqlite"],
      sections: [
        {
          heading: "Stay specific",
          html: `<p>Prefer Path over string surgery. subprocess.run takes a list of arguments when you want to avoid the shell. shell=True is a different, riskier mode. sqlite3 gives you a transactional file. This browser build includes sqlite3, per the Pyodide 314 notes, and does not give you a normal operating-system process table, so the exercise stays with paths.</p>`,
        },
      ],
      exercise: {
        prompt: "Write sibling(path, name) using pathlib. Return the path of name in the same directory as path, as a string.",
        starter: "from pathlib import Path\n\ndef sibling(path, name):\n    return \"\"\n",
        checks: ["from pathlib import Path\nassert Path(sibling('/tmp/notes/a.txt', 'b.txt')) == Path('/tmp/notes/b.txt')"],
      },
    },
    {
      id: "quality",
      title: "Logging and breakpoints",
      level: "Intermediate",
      minutes: 8,
      summary: "print is fine while you explore. logging is what you leave in a program.",
      sources: ["logging", "unittest"],
      sections: [
        {
          heading: "Levels",
          html: `<p>logging.getLogger(__name__) gives a logger named for the module. debug, info, warning, and error are levels, not moods. Configure the format once at the edge of the program. pdb.set_trace() stops a local process for inspection. It is not useful in this page. A failing unittest is the thing you can rerun tomorrow.</p>`,
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "Which module is the standard-library JSON codec?",
      choices: ["pickle", "json", "csv", "pandas"],
      answer: 1,
      why: "json encodes and decodes JSON. pickle is a Python-specific serializer. pandas is third-party.",
      source: "json",
    },
    {
      prompt: "subprocess is for",
      choices: ["Defining classes", "Running other programs", "Type hints", "Drawing mermaid diagrams"],
      answer: 1,
      why: "subprocess starts processes. It depends on an operating system this browser runtime does not fully provide.",
      source: "subprocess",
    },
  ],
};
