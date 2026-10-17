import { codeBlock } from "../util.js";

export const webTrack = {
  id: "web",
  title: "Web",
  icon: "web",
  menu: "HTTP, then Flask and FastAPI, with the handler logic you can test here.",
  intro: "A web framework turns an HTTP request into a function call and the return value back into a response. This page cannot open a public port. The lessons show the frameworks and let you test the function you would put inside a route.",
  sources: ["flask", "fastapi", "urllib"],
  lessons: [
    {
      id: "http",
      title: "HTTP in one page",
      level: "Beginner",
      minutes: 10,
      summary: "A request names a method and a path. A response names a status and a body.",
      sources: ["urllib"],
      sections: [
        {
          heading: "The exchange",
          html: `<p>GET reads. POST sends a body the server may store. Status 200 means the request was answered as success. 404 means the path is not there. 400 means the client sent something the server refuses to interpret. The body is bytes. JSON is a common way to put a dict in those bytes.</p>
          <p>urllib.request is the standard-library client. httpx and requests are third-party clients with a smoother API. This browser runtime's TLS support is a stub, so the exercise stays with a pure function.</p>`,
        },
      ],
      exercise: {
        prompt: "Write status_for(found) that returns 200 when found is true and 404 otherwise.",
        starter: "def status_for(found):\n    return 0\n",
        checks: ["assert status_for(True) == 200", "assert status_for(False) == 404"],
      },
    },
    {
      id: "flask",
      title: "Flask",
      level: "Intermediate",
      minutes: 12,
      summary: "Flask is a WSGI microframework. You map a path to a function.",
      sources: ["flask"],
      sections: [
        {
          heading: "A small app",
          html: `<p>Flask is maintained in the Pallets projects. An app is an instance, and a route is a function. WSGI is a synchronous convention between the app and a server. The development server is for your machine, not for the public internet.</p>
          ${codeBlock("from flask import Flask\n\napp = Flask(__name__)\n\n@app.get(\"/health\")\ndef health():\n    return {\"ok\": True}\n")}<p>The decorator registers health. The dict return is Flask's JSON response in current Flask. Read the Flask docs for the version you install, because return behavior has a history. The function below is the part you can test without Flask installed in the page.</p>`,
        },
      ],
      exercise: {
        prompt: "Write health() that returns a dict with the key ok set to True.",
        starter: "def health():\n    return {}\n",
        checks: ["assert health() == {'ok': True}"],
      },
    },
    {
      id: "fastapi",
      title: "FastAPI",
      level: "Intermediate",
      minutes: 12,
      summary: "FastAPI is an ASGI framework that uses type hints to describe parameters.",
      sources: ["fastapi", "typing"],
      sections: [
        {
          heading: "Async where it helps",
          html: `<p>FastAPI builds on Starlette and uses Pydantic to parse and document bodies. ASGI can run async routes. A def route runs in a threadpool. An async def route runs on the event loop, so it should not call blocking code directly. The automatic docs page is generated from the routes. It is a convenience, not a proof that the behavior is correct. Tests still matter.</p>
          ${codeBlock("from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get(\"/health\")\ndef health():\n    return {\"ok\": True}\n")}<p>This sample is for a normal CPython install. It is not executed in the browser.</p>`,
        },
      ],
      exercise: {
        prompt: "Write echo_name(name) that returns a dict {\"name\": name}. This is the body of a route.",
        starter: "def echo_name(name):\n    return {}\n",
        checks: ["assert echo_name('Ada') == {'name': 'Ada'}"],
      },
    },
  ],
  quiz: [
    {
      prompt: "Flask is commonly described as",
      choices: ["An ASGI-only database", "A WSGI microframework", "A type checker", "A standard-library module"],
      answer: 1,
      why: "Flask is a third-party WSGI framework in the Pallets projects.",
      source: "flask",
    },
    {
      prompt: "FastAPI routes are built for",
      choices: ["ASGI", "The venv module", "Spreadsheet files only", "The GIL"],
      answer: 0,
      why: "FastAPI is an ASGI framework. It can still expose a def route, which Starlette runs in a threadpool.",
      source: "fastapi",
    },
  ],
};

export const dataTrack = {
  id: "data",
  title: "Data",
  icon: "data",
  menu: "Tables in pure Python, then NumPy arrays and pandas frames that this page can run.",
  intro: "Start with the table you can explain. Reach for NumPy when the numbers are a block. Reach for pandas when the columns have names and gaps.",
  sources: ["numpy", "pandas", "csv"],
  lessons: [
    {
      id: "tables",
      title: "A table is rows",
      level: "Beginner",
      minutes: 10,
      summary: "A list of dicts is a fine table until a library earns its import.",
      sources: ["csv"],
      sections: [
        {
          heading: "Name the columns",
          html: `<p>csv.DictReader yields rows as dicts. You can filter them with a comprehension. This stays readable for thousands of rows. It gets clumsy for alignment, missing values, and grouped statistics. That is the moment to talk about pandas, not the first line of a homework file.</p>`,
        },
      ],
      exercise: {
        prompt: "Write total(rows, column) that sums the named column of a list of dicts. Values are numbers.",
        starter: "def total(rows, column):\n    return 0\n",
        checks: ["assert total([{'n': 1}, {'n': 4}], 'n') == 5", "assert total([], 'n') == 0"],
      },
    },
    {
      id: "numpy",
      title: "NumPy",
      level: "Intermediate",
      minutes: 12,
      summary: "An ndarray stores one dense block of numbers and operates on all of them.",
      sources: ["numpy"],
      sections: [
        {
          heading: "Vectors, not loops you can see",
          html: `<p>NumPy is the array library underneath much of scientific Python. This site vendors NumPy 2.4.6. An array has a shape and a dtype. Arithmetic happens element by element. The mean of an array is a method. A Python loop over a million floats is the thing NumPy is designed to avoid.</p>
          ${codeBlock("import numpy as np\n\ndef mean_of(values):\n    return float(np.asarray(values, dtype=float).mean())\n")}`,
        },
      ],
      exercise: {
        prompt: "Write mean_of(values) that returns the mean as a Python float using NumPy.",
        starter: "import numpy as np\n\ndef mean_of(values):\n    return 0.0\n",
        packages: ["numpy"],
        checks: ["assert mean_of([1, 2, 3]) == 2", "assert mean_of([2, 4]) == 3"],
      },
    },
    {
      id: "pandas",
      title: "pandas",
      level: "Intermediate",
      minutes: 12,
      summary: "A DataFrame is a labeled table. This lab vendors pandas 3.0.2.",
      sources: ["pandas"],
      sections: [
        {
          heading: "Columns and groups",
          html: `<p>A DataFrame has columns you can select by name. Boolean indexing filters rows. groupby splits rows by a key. pandas 2 made copy-on-write the direction of travel, and the 3.0 line continues that care about views and copies. Prefer returning a new frame to surprising inplace edits. Read the pandas 3 docs for the release you pin. The wheel in this lab is 3.0.2.</p>
          ${codeBlock("import pandas as pd\n\ndef column_sum(records, column):\n    frame = pd.DataFrame(records)\n    return int(frame[column].sum())\n")}`,
        },
      ],
      exercise: {
        prompt: "Write column_sum(records, column) that builds a DataFrame and returns the column sum as an int.",
        starter: "import pandas as pd\n\ndef column_sum(records, column):\n    return 0\n",
        packages: ["pandas"],
        checks: ["assert column_sum([{'n': 1}, {'n': 4}], 'n') == 5"],
      },
    },
  ],
  quiz: [
    {
      prompt: "An ndarray is",
      choices: ["A Python list subclass defined by the language", "NumPy's n-dimensional array", "A Flask route", "A virtual environment"],
      answer: 1,
      why: "ndarray is a NumPy type. It is not a built-in.",
      source: "numpy",
    },
    {
      prompt: "This lab's browser runtime includes",
      choices: ["No third-party data libraries", "Vendored NumPy 2.4.6 and pandas 3.0.2", "Only pandas 1.0", "A remote Jupyter kernel"],
      answer: 1,
      why: "The wheels stored with the site are NumPy 2.4.6 and pandas 3.0.2.",
      source: "pandas",
    },
  ],
};

export const aiTrack = {
  id: "ai",
  title: "AI, ML, and agents",
  icon: "ai",
  menu: "Vocabulary, a tiny model you can run, the major libraries, and a bounded tool loop.",
  intro: "Models find patterns in examples. They do not understand a sentence the way a person does. An agent, in this lab, is a loop with tools and a stop, not a character.",
  sources: ["sklearn", "pytorch"],
  lessons: [
    {
      id: "vocabulary",
      title: "Words worth keeping straight",
      level: "Beginner",
      minutes: 10,
      summary: "Features, labels, training, and evaluation are ordinary ideas with sharp meanings.",
      sources: ["sklearn"],
      sections: [
        {
          heading: "Supervised learning",
          html: `<p>A feature is a measurement you decided to record. A label is the answer attached to an example. Training adjusts a model's parameters so its predictions move toward those labels on the training examples. Evaluation checks a set of examples the adjustment did not use. A high score on the training set alone does not tell you the model will hold up.</p>
          <p>This lab will not quote leaderboard numbers. They move, and a number without a dataset is decoration.</p>`,
        },
      ],
    },
    {
      id: "tiny-model",
      title: "A line you can fit",
      level: "Intermediate",
      minutes: 14,
      summary: "y = w x + b is a model. Squared error is one way to judge it.",
      sources: ["sklearn"],
      sections: [
        {
          heading: "One step of gradient descent",
          html: `<p>Suppose you predict w times x plus b. The error is the prediction minus the actual y. For squared error, a small step subtracts a fraction of the error times x from w, and a fraction of the error from b. That is the whole idea of a linear model. scikit-learn will do a more careful version, with more features, when you want a library. The exercise is the idea in plain Python so you can see the arithmetic.</p>
          ${codeBlock("def step(w, b, x, y, rate):\n    error = (w * x + b) - y\n    w = w - rate * error * x\n    b = b - rate * error\n    return w, b\n")}`,
        },
      ],
      exercise: {
        prompt: "Write step(w, b, x, y, rate) that returns the updated w and b for squared error on one example, as in the lesson.",
        starter: "def step(w, b, x, y, rate):\n    return w, b\n",
        checks: [
          "w, b = step(0.0, 0.0, 2.0, 4.0, 0.1)\nassert abs(w - 0.8) < 1e-9\nassert abs(b - 0.4) < 1e-9",
        ],
      },
    },
    {
      id: "libraries",
      title: "scikit-learn and PyTorch",
      level: "Intermediate",
      minutes: 10,
      summary: "One library is for classical models. The other is for tensors and neural nets.",
      sources: ["sklearn", "pytorch"],
      sections: [
        {
          heading: "What each one is",
          html: `<p>scikit-learn fits and evaluates models such as linear models, trees, and clustering, with a fit and predict style. PyTorch is a tensor library used to build and train neural networks, with automatic differentiation. Neither is in the standard library, and neither is vendored in this browser runtime. Install them into a virtual environment on your computer when a project needs them. NumPy, which is vendored here, is the array layer scikit-learn builds on.</p>
          <p>A library does not choose your split between training and evaluation. You do.</p>`,
        },
      ],
    },
    {
      id: "agents",
      title: "A tool loop",
      level: "Advanced",
      minutes: 14,
      summary: "An agent proposes a tool, you run it inside a limit, and you check the result.",
      diagram: `flowchart TD
  U[Task] --> M[Propose a step]
  M --> T{Tool?}
  T -->|yes| R[Run it inside a limit]
  R --> M
  T -->|no| S[Stop and record the result]`,
      diagramCaption: "The loop is only as trustworthy as the tools and the check",
      sources: ["sklearn"],
      sections: [
        {
          heading: "Bounds before personality",
          html: `<p>A practical loop has a task, a list of tools you wrote, a maximum number of steps, and a check that says whether the result is acceptable. The model can choose a bad tool or invent a fact. The tool should refuse work outside its job. Logging every step matters more than a friendly name.</p>
          <p>Lucky is studying this pattern on the way to AI omni-channel agents: the same task reachable from more than one channel, such as this page and a messaging thread. A second channel does not remove the need for the limit or the check. This lesson is the pattern. It is not a claim that a product already does it.</p>`,
        },
      ],
      exercise: {
        prompt: "Write run_tool(name, tools) that returns the tool's result for a known name and the string unknown tool otherwise. tools maps a name to a zero-argument function. Stop after the call. There is no hidden model.",
        starter: "def run_tool(name, tools):\n    return \"\"\n",
        checks: [
          "assert run_tool('ping', {'ping': lambda: 'pong'}) == 'pong'",
          "assert run_tool('missing', {}) == 'unknown tool'",
        ],
      },
    },
  ],
  quiz: [
    {
      prompt: "In supervised learning, a label is",
      choices: ["The learning-rate number", "The answer attached to an example", "A Python decorator", "The license file"],
      answer: 1,
      why: "The label is the target the model is asked to predict. Features are the recorded inputs.",
      source: "sklearn",
    },
    {
      prompt: "PyTorch is",
      choices: ["A standard-library module for CSV", "A tensor library used to build neural networks", "The Python license", "A WSGI server"],
      answer: 1,
      why: "PyTorch's own documentation describes tensors and neural networks. It is third-party and not vendored in this page.",
      source: "pytorch",
    },
  ],
};

export const automation = {
  id: "automation",
  title: "Automation and scripting",
  icon: "automation",
  menu: "Scripts that read files, take arguments, and stop when the input is wrong.",
  intro: "A script is a small program with a job. It should fail in a way you can read, and it should not surprise the files it touches.",
  sources: ["argparse", "pathlib", "csv"],
  lessons: [
    {
      id: "scripts",
      title: "A script has a job",
      level: "Beginner",
      minutes: 8,
      summary: "One command, one purpose, and a way to run it again.",
      sources: ["tutorial"],
      sections: [
        {
          heading: "Repeatable",
          html: `<p>If you did it twice in a terminal, write it down as a script. Print a short summary of what changed. Return a non-zero exit status when the input is unusable, which in library code means raising, and at the edge means sys.exit. Keep the pure work in a function so a test can call it without the terminal.</p>`,
        },
      ],
    },
    {
      id: "cli",
      title: "argparse, paths, and CSV",
      level: "Intermediate",
      minutes: 12,
      summary: "Arguments, a folder, and rows are the usual ingredients.",
      sources: ["argparse", "csv", "pathlib"],
      sections: [
        {
          heading: "The edge and the core",
          html: `<p>argparse turns sys.argv into values and writes the help text. The function that sums a column should not read sys.argv. It should take the rows. That split is what makes the exercise below possible in the browser, where you do not have the script's command line.</p>
          ${codeBlock("def sum_column(rows, column):\n    total = 0\n    for row in rows:\n        total += int(row[column])\n    return total\n")}`,
        },
      ],
      exercise: {
        prompt: "Write sum_column(rows, column) that sums integer strings in that column.",
        starter: "def sum_column(rows, column):\n    return 0\n",
        checks: ["assert sum_column([{'n': '2'}, {'n': '5'}], 'n') == 7"],
      },
    },
    {
      id: "safety",
      title: "Do not automate harm",
      level: "Intermediate",
      minutes: 8,
      summary: "A script that deletes, emails, or fetches should show its work first.",
      sources: ["subprocess", "urllib"],
      sections: [
        {
          heading: "A dry run",
          html: `<p>Print the files you would delete, and require an explicit flag before you delete them. Fetch only URLs you were asked to fetch, and respect the site's terms and a reasonable rate. Do not put credentials in the source file. Environment variables or a local secret store are the ordinary places. subprocess with a shell string built from outside input is a classic way to do more than you meant. Pass a list of arguments.</p>
          <p>Scheduling belongs to the operating system: cron, systemd timers, or the task scheduler. Python does not include a personal cloud cron. A long-running process is a choice, with logs and a way to stop it.</p>`,
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "argparse is",
      choices: ["A third-party web framework", "The standard-library command-line parser", "A pandas type", "An exam"],
      answer: 1,
      why: "argparse parses command-line options and is part of the standard library.",
      source: "argparse",
    },
    {
      prompt: "A dry run is useful because",
      choices: ["It hides every action", "It shows what would change before you change it", "It replaces tests", "It installs packages"],
      answer: 1,
      why: "Destructive scripts should be inspectable before they touch files.",
      source: "pathlib",
    },
  ],
};
