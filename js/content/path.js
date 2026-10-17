import { codeBlock } from "../util.js";

export const tooling = {
  id: "tooling",
  title: "Tooling",
  icon: "tooling",
  menu: "Environments, project files, tests, and the third-party tools people actually run.",
  intro: "The interpreter runs code. The tools around it keep a project installable and a failure repeatable.",
  sources: ["venv", "packaging", "pytest", "ruff", "uv", "git"],
  lessons: [
    {
      id: "environments",
      title: "venv and installers",
      level: "Beginner",
      minutes: 10,
      summary: "One project, one environment, so installs do not collide.",
      sources: ["venv", "pep-405", "uv"],
      sections: [
        {
          heading: "The standard tool and the popular one",
          html: `<p>python -m venv .venv is the standard-library way to create an environment. Activate it, then python -m pip install puts packages there. pip is the installer that ships with that workflow.</p>
          <p>uv is a third-party installer and resolver from Astral, written in Rust. Many people use it because it is fast. It is not part of Python. A tutorial that says "just use uv" without saying that is skipping the map. Either tool is fine if you know which environment is active.</p>`,
        },
      ],
    },
    {
      id: "projects",
      title: "pyproject.toml",
      level: "Intermediate",
      minutes: 10,
      summary: "The project file names the build system and, usually, the metadata.",
      sources: ["pyproject", "packaging", "pypa"],
      sections: [
        {
          heading: "What the file is for",
          html: `<p>The packaging guide shows a pyproject.toml with a [build-system] table and a [project] table. The [project] fields are specified so different tools can read the name, version, and dependencies. A wheel is what you often install. An sdist is the source archive. Build tools such as the ones PyPA documents produce those artifacts. You do not commit a virtual environment. You commit the project file and the source.</p>`,
        },
      ],
      exercise: {
        prompt: "Write project_name(table) that returns the name field from a dict shaped like the [project] table.",
        starter: "def project_name(table):\n    return \"\"\n",
        checks: ["assert project_name({'name': 'python-lab', 'version': '0.1.0'}) == 'python-lab'"],
      },
    },
    {
      id: "daily",
      title: "Tests, lint, and format",
      level: "Intermediate",
      minutes: 10,
      summary: "unittest or pytest for behavior. Ruff for style. Git for history.",
      sources: ["unittest", "pytest", "ruff", "git"],
      sections: [
        {
          heading: "Separate the jobs",
          html: `<p>unittest is in the standard library. pytest is a third-party runner many projects prefer. Use one as the command you actually run. Ruff, also from Astral, lints and can format. Black is another third-party formatter. Neither is required by the language. Git is how you keep history. It is not a Python module. Run the tests before you commit a behavior change. A formatter-only commit is easier to read when it is not mixed with a bug fix.</p>`,
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "uv is",
      choices: ["A standard-library module since 3.13", "A third-party tool from Astral", "The name of the GIL", "A Python Institute exam"],
      answer: 1,
      why: "uv is Astral's installer and resolver. venv and pip are the standard-library-and-default path.",
      source: "uv",
    },
    {
      prompt: "pyproject.toml is",
      choices: ["A virtual environment folder", "The project file used by Python packaging tools", "A pandas frame", "A traceback"],
      answer: 1,
      why: "The packaging specifications describe pyproject.toml, including the [project] table.",
      source: "pyproject",
    },
  ],
};

export const licensing = {
  id: "licensing",
  title: "Licensing",
  icon: "licensing",
  menu: "How Python itself is shared, and how to read MIT, BSD, Apache, and GPL.",
  intro: "This is a reading guide for students, not legal advice. The license text and a lawyer decide a real product.",
  sources: ["license", "mit", "apache", "gpl", "bsd"],
  lessons: [
    {
      id: "python-license",
      title: "Python's own license",
      level: "Beginner",
      minutes: 8,
      summary: "CPython is under the Python Software Foundation License Agreement, which is permissive and not the MIT license.",
      sources: ["license"],
      sections: [
        {
          heading: "Read the history page",
          html: `<p>The documentation page titled History and License includes the Python Software Foundation License Agreement. It is a permissive, BSD-style license with its own wording. Calling it "the MIT license" is a common slip and it is wrong. The PSF publishes the language. The OpenEDG Python Institute exams are a different organization.</p>
          <p>Each package you install has its own license. The license of the language does not become the license of your program, and it does not become the license of pandas.</p>`,
        },
      ],
    },
    {
      id: "reading",
      title: "Four licenses you will meet",
      level: "Intermediate",
      minutes: 12,
      summary: "Permissive licenses and the GPL answer different questions about sharing changes.",
      sources: ["mit", "bsd", "apache", "gpl", "numpy", "pandas"],
      sections: [
        {
          heading: "A pocket comparison",
          html: `<p>The MIT license and the 3-clause BSD license are permissive. They ask you to keep the copyright notice. BSD adds a clause about not using the author's name to endorse a product. NumPy and pandas are distributed on BSD-style terms. Apache-2.0 is also permissive and includes an explicit patent grant. Read that grant in the Apache text rather than in a summary.</p>
          <p>GPL-3.0 is a copyleft license. If you distribute a derivative work of GPL-covered software, the GPL's conditions apply to that work. That is not the same sentence as "a company must publish every repository." Distribution and derivative work are terms in the license. For a product, read the text and ask a lawyer. For study, notice the difference: permissive licenses allow a closed distribution that keeps the notice, and the GPL attaches conditions when you distribute the covered work.</p>
          <p>This page is not a substitute for those texts. The Sources list links to them.</p>`,
        },
      ],
      exercise: {
        prompt: "Write notice(name) that returns Keep the notice for name. A reminder that permissive reuse still carries the copyright line.",
        starter: "def notice(name):\n    return \"\"\n",
        checks: ["assert notice('NumPy') == 'Keep the notice for NumPy'"],
      },
    },
  ],
  quiz: [
    {
      prompt: "The Python language license is",
      choices: ["The GNU GPL by default", "The Python Software Foundation License Agreement", "The Apache license only", "A trade secret"],
      answer: 1,
      why: "docs.python.org publishes the PSF License Agreement. It is permissive and it is not the MIT license.",
      source: "license",
    },
    {
      prompt: "Apache-2.0 is notable here because",
      choices: ["It forbids all commercial use", "Its text includes a patent grant", "It is the PSF license", "It replaces the need to read anything"],
      answer: 1,
      why: "The Apache License 2.0 text includes a patent grant. The summary is not the license.",
      source: "apache",
    },
  ],
};

export const certifications = {
  id: "certifications",
  title: "Certifications",
  icon: "certifications",
  menu: "PCEP, PCAP, PCPP, and the other OpenEDG tracks, with the exam pages as the authority.",
  intro: "These are OpenEDG Python Institute credentials. They are not issued by the Python Software Foundation. Prices and pending dates below were read from the institute's pages on 17 October 2026. Confirm the live page before you pay or book.",
  sources: ["pcep", "pcap", "pcpp1", "pcpp2", "cert-tracks", "pced", "pcad", "pcei"],
  lessons: [
    {
      id: "how-to-read",
      title: "How to read an exam page",
      level: "Beginner",
      minutes: 8,
      summary: "The exam code, the status, the passing score, and the price are the fields that change.",
      sources: ["pcep", "cert-tracks"],
      sections: [
        {
          heading: "Status words",
          html: `<p>Active means the institute is offering that version. Pending release and in development mean you should not tell a friend the new version is bookable. Discontinued means a previous version was retired. A voucher for a retired version can have its own redemption rule, which the exam page states.</p>
          <p>A certification is evidence you passed an exam. It is not a measurement of your worth, and it is not a job offer. The study in this lab is useful with or without the credential.</p>`,
        },
      ],
    },
    {
      id: "tracks",
      title: "The tracks, as published",
      level: "Intermediate",
      minutes: 16,
      summary: "General Python, data, and entry-level AI have public exam pages. PCPP2 does not have a finished syllabus.",
      sources: ["pcep", "pcap", "pcpp1", "pcpp2", "pced", "pcad", "pcei", "cert-tracks"],
      sections: [
        {
          heading: "General-purpose programming",
          html: `<p>PCEP, Certified Entry-Level Python Programmer. On 17 October 2026 the exam page listed PCEP-30-02 as active: 30 questions, 40 minutes plus 5 minutes for the NDA and tutorial, 70 percent to pass, valid 5 years, price listed from 69 USD, delivered on TestNow. PCEP-30-03 was listed as a pending release for 31 October 2026. There is no formal prerequisite.</p>
          <p>PCAP, Certified Associate Python Programmer. PCAP-31-03 was active: 40 questions, 65 minutes plus 10, 70 percent, valid 5 years, price listed from 295 USD. Delivery included Pearson VUE and TestNow. PCAP-31-04 was pending for 31 October 2026. PCEP is recommended, not required.</p>
          <p>PCPP1, Certified Professional Python Programmer Level 1. PCPP-32-101 was active: 45 questions, 65 minutes plus 10, 70 percent, English, price listed from 295 USD. The page lists lifetime validity for PCPP-32-101 and says PCPP-32-102 is in development with 5-year validity planned. PCAP is recommended, not required.</p>
          <p>PCPP2, Level 2. PCPP-32-201 was listed as in development. The syllabus was in development. Do not plan a date around it until the exam page says it is active.</p>`,
        },
        {
          heading: "Data, AI, and the other names",
          html: `<p>PCED, Certified Entry-Level Data Analyst with Python. PCED-30-02 was active, released 15 July 2025. The page listed 40 questions, 60 minutes plus NDA, 75 percent, valid 7 years, from 69 USD, English and Spanish. PCED-30-01 was discontinued on 14 July 2025.</p>
          <p>PCAD, Certified Associate Data Analyst with Python. PCAD-31-02 was active, released 15 July 2025. The exam information table listed 48 questions, 60 minutes plus NDA, 75 percent, valid 6 years, from 195 USD, English. The institute homepage has shown a different card price at times. Use the exam information table, then recheck it. PCPD, the professional data exam, was described as in development.</p>
          <p>PCEI, Certified Entry-Level AI Specialist with Python. PCEI-30-01 was active: 36 questions, 60 minutes plus NDA, 75 percent, valid 7 years, from 69 USD, English. The PCEI page still described PCAI as coming, and the track overview has listed it as work in progress. Treat PCAI as not an active exam until that page changes.</p>
          <p>The certification overview also names testing, security, automation, and web tracks, including PCET, PCES, PCEA, and PCEW and their associate levels. This lab does not repeat question counts it did not read on each exam page. Open the track list and the specific exam page.</p>`,
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "Who issues PCEP and PCAP?",
      choices: ["The Python Software Foundation", "The OpenEDG Python Institute", "NumPy's maintainers", "This lab"],
      answer: 1,
      why: "The exam pages are the OpenEDG Python Institute. The PSF publishes the language and its license.",
      source: "pcep",
    },
    {
      prompt: "On 17 October 2026, which entry-level general exam version was listed as active?",
      choices: ["PCEP-30-03", "PCEP-30-02", "PCPP-32-201", "PCAP-31-04"],
      answer: 1,
      why: "PCEP-30-02 was the active version. PCEP-30-03 was pending for 31 October 2026.",
      source: "pcep",
    },
    {
      prompt: "PCPP-32-201 was listed as",
      choices: ["The only exam that matters", "In development", "Retired in 2019", "A free PSF badge"],
      answer: 1,
      why: "The PCPP2 page listed PCPP-32-201 as in development, with the syllabus also in development.",
      source: "pcpp2",
    },
  ],
};

export const career = {
  id: "career",
  title: "Career maps",
  icon: "career",
  menu: "A study order from first programs to a specialty, with no pay claims.",
  intro: "This is a way to sequence practice. It is not a promise of employment, a ranking of people, or a salary table. Pay varies by country, employer, and year, and this lab will not invent a number.",
  sources: ["tutorial", "unittest", "flask", "pandas"],
  lessons: [
    {
      id: "stages",
      title: "Stages of study",
      level: "Beginner",
      minutes: 10,
      summary: "Language, then a finished project, then a specialty you can explain.",
      diagram: `flowchart LR
  A[First programs] --> B[Functions tests files]
  B --> C[One finished project]
  C --> D[Explain the tradeoffs]
  D --> E[A specialty]`,
      diagramCaption: "A study order. It is not a ladder of job titles.",
      sources: ["tutorial"],
      sections: [
        {
          heading: "What to be able to do",
          html: `<p>First, write small programs until syntax, types, and functions feel ordinary. Then files, exceptions, modules, and tests, so a program can be run again. Then finish one project you can demo: a script, a small web route, or a table with a written check. Then practice explaining the data structure you chose and what would break it.</p>
          <p>Specialties that use Python include web services, data analysis, automation, machine learning support work, and test engineering. Job titles differ by employer. None of them requires you to pretend the earlier stages were a waste.</p>`,
        },
      ],
    },
    {
      id: "interviews",
      title: "Interview practice without folklore",
      level: "Interview",
      minutes: 10,
      summary: "Explain a project, a cost, and a test. Skip memorized company secrets.",
      sources: ["timecomplexity", "unittest"],
      sections: [
        {
          heading: "What you can rehearse",
          html: `<p>Be ready to open a project and say what it does, which structure holds the data, what the slow operation would be, and which test would catch a mistake. Mutable defaults, is versus ==, and the difference between a list and a tuple come up because they reveal whether you have used the language. They are in the fundamentals lessons.</p>
          <p>This lab does not publish alleged questions from named employers, and it does not estimate compensation. If a posting lists a tool, read that tool's docs and build a small example. That is slower than a rumor and it is checkable.</p>`,
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "This career map includes",
      choices: ["A guaranteed salary", "A study order and no pay numbers", "A ranking of candidates", "A promise of a visa"],
      answer: 1,
      why: "The page is a sequence of skills. It refuses invented income claims.",
      source: "tutorial",
    },
  ],
};

export const projects = {
  id: "projects",
  title: "Projects",
  icon: "projects",
  menu: "Small builds you can finish, explain, and test.",
  intro: "A project is finished when someone else can run it and you can say what it does not do. Start in the browser where the lesson has a check. Move to your own machine when you need a real port, a virtual environment, or Git.",
  sources: ["tutorial", "csv", "flask", "fastapi", "pathlib"],
  lessons: [
    {
      id: "catalog",
      title: "Eight builds",
      level: "Beginner",
      minutes: 12,
      summary: "From a greeting to a file organizer. Each one names the skill it practices.",
      sources: ["tutorial", "csv", "flask", "fastapi", "pathlib"],
      sections: [
        {
          heading: "Pick one and finish it",
          html: `<p><strong>Greeting.</strong> A function and a __main__ guard. You already have the shape from fundamentals.</p>
          <p><strong>Guess.</strong> The game in this lab, rewritten as a Python script with a test for the higher/lower rule.</p>
          <p><strong>CSV totals.</strong> Read a file with csv and sum a column. Keep the sum function separate from the file opener.</p>
          <p><strong>Flashcards.</strong> A dict of prompts, a loop, and a score. Store the cards as JSON.</p>
          <p><strong>Notes API, Flask.</strong> One GET route and one POST route on your machine. Write a test for the pure function that stores a note.</p>
          <p><strong>Health check, FastAPI.</strong> A /health route that returns JSON. Run it with the server docs, not with this browser runtime.</p>
          <p><strong>Tool loop.</strong> The agent exercise, extended with two tools and a step limit you print.</p>
          <p><strong>Organizer.</strong> Move files by suffix using pathlib, with a dry run that only prints. The exercise below is the dry-run decision.</p>`,
        },
      ],
      exercise: {
        prompt: "Write plan(names) that returns a dict of suffix to the list of filenames with that suffix. A file with no dot uses the suffix '(none)'. Do not rename anything.",
        starter: "def plan(names):\n    return {}\n",
        checks: [
          "assert plan(['a.py', 'b.py', 'c.txt']) == {'py': ['a.py', 'b.py'], 'txt': ['c.txt']}",
          "assert plan(['README']) == {'(none)': ['README']}",
        ],
      },
    },
    {
      id: "guess-rule",
      title: "The guess rule",
      level: "Beginner",
      minutes: 8,
      summary: "Extract the rule from the game so a test can call it.",
      sources: ["controlflow"],
      sections: [
        {
          heading: "Higher, lower, equal",
          html: `${codeBlock("def judge(guess, secret):\n    if guess == secret:\n        return \"equal\"\n    if guess < secret:\n        return \"higher\"\n    return \"lower\"\n")}<p>The message says what the player should do next. If the guess is below the secret, the next guess should be higher.</p>`,
        },
      ],
      exercise: {
        prompt: "Write judge(guess, secret) that returns equal, higher, or lower, where higher means the secret is above the guess.",
        starter: "def judge(guess, secret):\n    return \"\"\n",
        checks: [
          "assert judge(10, 10) == 'equal'",
          "assert judge(3, 9) == 'higher'",
          "assert judge(9, 3) == 'lower'",
        ],
      },
    },
    {
      id: "agent-limit",
      title: "A step limit",
      level: "Intermediate",
      minutes: 10,
      summary: "Even a toy loop should stop.",
      sources: ["tutorial"],
      sections: [
        {
          heading: "Count the steps",
          html: `<p>Pass a list of tool names and a limit. Run only that many. Return the list of results and ignore the rest. This is the smallest version of the bound in the agent lesson.</p>`,
        },
      ],
      exercise: {
        prompt: "Write bounded(steps, limit) that returns the first limit items. If limit is 0, return an empty list.",
        starter: "def bounded(steps, limit):\n    return list(steps)\n",
        checks: [
          "assert bounded(['a', 'b', 'c'], 2) == ['a', 'b']",
          "assert bounded(['a'], 0) == []",
        ],
      },
    },
  ],
  quiz: [
    {
      prompt: "A useful project split is",
      choices: ["All logic inside the argument parser", "A pure function you can test, and a thin edge that reads files or HTTP", "No tests until the rewrite", "One file that deletes before it prints"],
      answer: 1,
      why: "The pure function can run in this lab and in unittest. The edge belongs on a machine with files and ports.",
      source: "unittest",
    },
  ],
};
