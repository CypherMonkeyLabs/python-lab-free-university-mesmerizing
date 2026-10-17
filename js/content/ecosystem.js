export const ecosystem = {
  labels: {
    glossary: "Glossary",
    map: "Mind map",
    sisters: "Sister technologies",
    integrations: "Integrations",
    hooks: "Future hooks",
  },
  mapText: "The map is a study aid. A line means 'this lab talks about both,' not a dependency that every project must install.",
  map: `flowchart TD
  P[Python]
  P --> L[Language]
  P --> S[Standard library]
  P --> W[Web]
  P --> D[Data]
  P --> A[Models and agents]
  P --> T[Tools around it]
  W --> Flask
  W --> FastAPI
  D --> NumPy
  D --> pandas
  A --> Checks
  T --> venv
  T --> Tests`,
  glossary: [
    { term: "Interpreter", meaning: "The program that reads Python and carries out its instructions. CPython is the reference interpreter." },
    { term: "Bytecode", meaning: "A compact form CPython compiles your module into before executing it. You rarely edit it by hand." },
    { term: "PEP", meaning: "Python Enhancement Proposal. A design document. A PEP is not automatically a finished feature." },
    { term: "Module", meaning: "A file of Python that other code can import." },
    { term: "Package", meaning: "A directory of modules that Python can import. On a package index, 'package' also means a thing you install." },
    { term: "Wheel", meaning: "A built distribution you can install. The browser runtime in this lab includes wheels for NumPy and pandas." },
    { term: "Virtual environment", meaning: "A folder with its own interpreter and installed packages, created by the venv module, so projects do not share one global pile." },
    { term: "REPL", meaning: "Read, eval, print, loop. An interactive prompt. The practice desk is a small one." },
    { term: "Name binding", meaning: "A name refers to an object. Assignment rebinds the name. It does not copy the object." },
    { term: "Mutable", meaning: "An object whose contents can change after it is created, such as a list or dict." },
    { term: "Hashable", meaning: "An object that can be a dict key or a set item. It needs a stable hash. Mutable lists are not hashable." },
    { term: "Iterable", meaning: "An object a for loop can walk. A list is iterable. So is a file, a dict, and a generator." },
    { term: "Iterator", meaning: "An object that produces the next item, and then raises StopIteration when it is done." },
    { term: "Generator", meaning: "A function that uses yield, or the iterator it returns. It produces values one at a time." },
    { term: "Comprehension", meaning: "A compact expression that builds a list, set, dict, or generator. It is still a loop." },
    { term: "Scope", meaning: "The region where a name is visible. Function locals are not visible outside the function." },
    { term: "Closure", meaning: "A function that remembers names from the scope where it was created." },
    { term: "Decorator", meaning: "A function that takes a function and returns a new one. The @ line is syntax for that call." },
    { term: "Context manager", meaning: "An object used with with. It runs setup and cleanup, which is why files are opened that way." },
    { term: "Exception", meaning: "An object raised to say the current path cannot continue. You can catch it, or let it stop the program." },
    { term: "Traceback", meaning: "The stack of calls Python prints when an exception is not caught. Read it from the bottom." },
    { term: "Dunder", meaning: "A method with two underscores on each side, such as __init__ or __str__. Python calls many of them for you." },
    { term: "Duck typing", meaning: "Code asks what an object can do, not what class it claims. If it iterates, a for loop can use it." },
    { term: "f-string", meaning: "A string prefixed with f that interpolates expressions. It produces a str immediately." },
    { term: "t-string", meaning: "A template string prefixed with t, added in Python 3.14. It produces a Template, not a finished str." },
    { term: "Annotation", meaning: "A note on a name, usually a type. In 3.14, annotations are stored lazily. Python does not enforce them by itself." },
    { term: "Coroutine", meaning: "A function defined with async def. Calling it returns a coroutine object. It runs when the event loop drives it." },
    { term: "Event loop", meaning: "The scheduler that runs tasks, waits on await, and resumes them. asyncio has one." },
    { term: "GIL", meaning: "The global interpreter lock in the traditional CPython build. It lets one thread run Python bytecode at a time. Free-threaded builds, officially supported as of 3.14, are a different build." },
    { term: "Free-threading", meaning: "A CPython build that does not rely on the GIL. It is officially supported, and not every library is safe to use that way yet." },
    { term: "Lazy import", meaning: "A Python 3.15 feature. lazy import waits to import a module until the name is used. This lab's browser runtime is 3.14 and will reject that syntax." },
    { term: "WSGI", meaning: "A synchronous calling convention between a Python web app and a server. Flask speaks it." },
    { term: "ASGI", meaning: "An asynchronous calling convention for Python web apps. FastAPI speaks it." },
    { term: "ndarray", meaning: "NumPy's n-dimensional array. It stores numbers in a dense block and operates on them together." },
    { term: "DataFrame", meaning: "A pandas table with labeled columns. It is a library object, not a Python built-in." },
    { term: "Feature", meaning: "In machine learning, an input you measured. The word does not mean the model understood it." },
    { term: "Label", meaning: "The answer attached to an example in supervised learning." },
    { term: "Agent", meaning: "In this lab, a loop that lets a model request a tool, observes the result, and stops under a limit you chose." },
    { term: "Omni-channel", meaning: "More than one place a person can show up, such as a web page and a messaging thread. Lucky studies agents that can meet people across channels without forgetting the task." },
  ],
  sisters: [
    { title: "JavaScript", text: "Browsers run JavaScript as their built-in language. Python reaches this page through WebAssembly, via Pyodide, not because the browser grew a Python keyword. The two languages can call each other at the edge Pyodide provides." },
    { title: "SQL", text: "SQL asks questions of tables. Python does not replace it. The standard library's sqlite3 module lets Python open a SQLite database and send SQL to it." },
    { title: "Rust, Go, and Java", text: "Each is a reasonable choice when the platform, the team, or the performance budget already centers it. This lab will not invent a benchmark that crowns one of them. Python's offer here is a readable language, a large standard library, and a serious scientific stack." },
    { title: "The shell", text: "A shell is the right tool for a short pipeline of programs. A Python script is easier to test once the logic grows branches, dates, or error handling. Many real jobs use both." },
    { title: "HTML and CSS", text: "This lab is HTML, CSS, and JavaScript around a Python runtime. The lessons are not a web-design course, but the page you are reading is the same kind of artifact a Python web framework eventually sends to a browser." },
  ],
  integrations: [
    { title: "Files and tables", text: "pathlib, csv, and json cover a lot of automation. pandas reads the same tables when the file grows columns and missing values. In this browser runtime, write files under paths such as /tmp. They live in the page's memory filesystem." },
    { title: "SQLite", text: "sqlite3 is in the standard library and is bundled in Pyodide 314. A local database file is a sturdy place for a small tool before you adopt a server database." },
    { title: "HTTP", text: "urllib.request can perform basic HTTP. FastAPI and Flask are how you write the other side, the program that answers. This browser build does not provide real TLS sockets, so do not expect the practice desk to call the public internet." },
    { title: "Other programs", text: "subprocess runs a program on a normal operating system. It is not a meaningful way to launch system tools inside this page. Lessons show the pattern for the computer where you install CPython." },
    { title: "Editors and Git", text: "Python does not include an editor or Git. You write files, Git remembers the versions, and the interpreter runs them. The practice desk skips Git because there is nothing to push from the page." },
  ],
  hooks: [
    { title: "Python 3.15, already released", text: "3.15.0 shipped on 9 October 2026 with lazy imports, frozendict, a sentinel built-in, unpacking inside comprehensions, and a profiling package. The browser runtime here is still 3.14.2. Lessons mark 3.15-only syntax so you do not send it to Run." },
    { title: "Free-threaded CPython", text: "PEP 779 made free-threaded Python officially supported in 3.14. It is a build, not a mode switch inside every program. Libraries with C code need to say they are safe. This page does not demonstrate that build." },
    { title: "Agents as a pattern", text: "A useful agent loop has a task, a small set of tools, a stop condition, and a way to check the result. Omni-channel work adds a second door for the same task, such as a page and a message thread. None of that removes the need to test the tools." },
    { title: "How this lab can grow", text: "The site is static files. A new lesson is another object in the catalog, with a source id. There is no account system and no hidden service. If a future runtime tracks CPython 3.15, the version line on the practice desk should change with it, in public." },
  ],
};
