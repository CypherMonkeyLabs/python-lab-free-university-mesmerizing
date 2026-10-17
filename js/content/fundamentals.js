import { codeBlock } from "../util.js";

export const fundamentals = {
  id: "fundamentals",
  title: "Fundamentals",
  icon: "fundamentals",
  menu: "Syntax, types, control flow, functions, objects, modules, files, errors, tests, and packaging.",
  intro: "The part of Python you need before a framework or a library will make sense. Every lesson stays on the language that CPython 3.14 and 3.15 share, unless it says otherwise.",
  sources: ["tutorial", "lexical", "stdtypes", "controlflow", "classes", "modules", "io", "errors", "venv", "unittest"],
  lessons: [
    {
      id: "syntax",
      title: "Syntax and indentation",
      level: "Beginner",
      minutes: 12,
      summary: "Python uses indentation to show which lines belong together.",
      diagram: `flowchart TD
  A[if condition] -->|true| B[indented block]
  A -->|false| C[else block]
  B --> D[back to the outer indent]
  C --> D`,
      diagramCaption: "A block is the lines indented under a header",
      sources: ["lexical", "tutorial", "compound"],
      sections: [
        {
          heading: "Blocks are indentation",
          html: `<p>A header line ends with a colon. The lines of its block are indented, usually by four spaces. When the indent returns, the block has ended. Mixing tabs and spaces is a syntax error.</p>
          ${codeBlock("def ready(flag):\n    if flag:\n        print(\"yes\")\n    else:\n        print(\"no\")\n")}`,
        },
        {
          heading: "Comments and strings",
          html: `<p>A comment starts with # and is for the reader. A string is data. Triple quotes are still strings, often used as docstrings, which are the first string inside a function, class, or module.</p>`,
        },
      ],
      exercise: {
        prompt: "Write shout(word) that returns the word followed by an exclamation mark, with no space.",
        starter: "def shout(word):\n    return word\n",
        checks: ["assert shout('lab') == 'lab!'", "assert shout('py') == 'py!'"],
      },
    },
    {
      id: "types",
      title: "Values and types",
      level: "Beginner",
      minutes: 14,
      summary: "int, float, str, bool, None, and bytes are different kinds of objects.",
      sources: ["stdtypes", "datamodel"],
      sections: [
        {
          heading: "Numbers and text",
          html: `<p>An int has arbitrary precision. It is not a 64-bit cell. A float is a binary floating-point number, so 0.1 plus 0.2 is not a clean decimal. Text is a str of Unicode code points. bytes is a sequence of octets. You encode text to bytes and decode bytes to text.</p>
          ${codeBlock("n = 10 ** 20\nlabel = \"Python\"\nraw = label.encode(\"utf-8\")\n")}`,
        },
        {
          heading: "Truth and None",
          html: `<p>False, None, zero, and empty containers are false in a condition. Almost everything else is true. bool is a subclass of int, which is a historical fact you should not lean on. Use is None, not equality, when you mean the missing value.</p>`,
        },
      ],
      exercise: {
        prompt: "Write kind(value) that returns the string from type(value).__name__.",
        starter: "def kind(value):\n    return \"\"\n",
        checks: ["assert kind(3) == 'int'", "assert kind('py') == 'str'", "assert kind(None) == 'NoneType'"],
      },
    },
    {
      id: "names",
      title: "Names and mutability",
      level: "Beginner",
      minutes: 12,
      summary: "Assignment binds a name. Two names can refer to one list.",
      sources: ["datamodel", "stdtypes"],
      sections: [
        {
          heading: "Binding is not copying",
          html: `<p>left = right makes both names refer to the same object. For an int that is harmless because you cannot change the int. For a list, append through one name is visible through the other. Copy a list with list(items) or items.copy() when you need a separate container.</p>
          ${codeBlock("shared = [1]\nalias = shared\nalias.append(2)\n# shared is now [1, 2]\n")}`,
        },
        {
          heading: "Hashable keys",
          html: `<p>A dict key must be hashable. Strings, numbers, and tuples of hashable items qualify. Lists do not. A tuple that contains a list does not either.</p>`,
        },
      ],
      exercise: {
        prompt: "Write fresh(items) that returns a new list with the same items, so appending to the result does not change the input.",
        starter: "def fresh(items):\n    return items\n",
        checks: [
          "src = [1]\nout = fresh(src)\nout.append(2)\nassert src == [1]\nassert out == [1, 2]",
        ],
      },
    },
    {
      id: "control",
      title: "Control flow",
      level: "Beginner",
      minutes: 14,
      summary: "Conditions, loops, and match decide which lines run.",
      sources: ["controlflow", "compound", "pep-758"],
      sections: [
        {
          heading: "Choices and loops",
          html: `<p>if, elif, and else choose a block. while repeats while a condition holds. for walks an iterable. range(n) yields 0 through n-1. break leaves the loop. continue skips to the next item. pass is an empty statement, useful while you are sketching.</p>
          ${codeBlock("def label(n):\n    if n < 0:\n        return \"neg\"\n    if n == 0:\n        return \"zero\"\n    return \"pos\"\n")}`,
        },
        {
          heading: "match, and a 3.14 except form",
          html: `<p>match compares a subject against patterns. It arrived in Python 3.10 and is the right tool when you are distinguishing shapes, not when a plain if is clearer.</p>
          <p>Python 3.14, via PEP 758, lets you write except TimeoutError, ConnectionError: when you do not use as. A single exception type never needed brackets. Catching with as still uses parentheses when there are several types.</p>`,
        },
      ],
      exercise: {
        prompt: "Write fizz(n) that returns Fizz when n is divisible by 3, Buzz when divisible by 5, FizzBuzz when divisible by both, and the digits of n otherwise.",
        starter: "def fizz(n):\n    return str(n)\n",
        checks: [
          "assert fizz(3) == 'Fizz'",
          "assert fizz(5) == 'Buzz'",
          "assert fizz(15) == 'FizzBuzz'",
          "assert fizz(2) == '2'",
        ],
      },
    },
    {
      id: "functions",
      title: "Functions",
      level: "Beginner",
      minutes: 14,
      summary: "def names a function. Defaults are evaluated once.",
      sources: ["functions-doc", "controlflow"],
      sections: [
        {
          heading: "Parameters and return",
          html: `<p>A function that reaches the end without return returns None. Arguments can be positional or named. A parameter with a default must come after parameters without one.</p>
          ${codeBlock("def greet(name, punctuation=\"!\"):\n    return f\"Hello, {name}{punctuation}\"\n")}`,
        },
        {
          heading: "The default-argument trap",
          html: `<p>A default expression runs when the function is defined, not on each call. A default list is shared by every caller that omits the argument. Use None and create the list inside the function.</p>
          ${codeBlock("def add(item, box=None):\n    if box is None:\n        box = []\n    box.append(item)\n    return box\n")}`,
        },
      ],
      exercise: {
        prompt: "Write add(item, box=None) so each omitted box is a new list. Return the list after appending item.",
        starter: "def add(item, box=None):\n    return box\n",
        checks: [
          "first = add(1)\nsecond = add(2)\nassert first == [1]\nassert second == [2]",
          "box = [0]\nassert add(1, box) == [0, 1]",
        ],
      },
    },
    {
      id: "classes",
      title: "Classes and objects",
      level: "Intermediate",
      minutes: 16,
      summary: "A class bundles data and the functions that operate on it.",
      sources: ["classes", "datamodel", "dataclasses"],
      sections: [
        {
          heading: "Methods and inheritance",
          html: `<p>__init__ sets up a new instance. The first parameter of a method is the instance, conventionally named self. A subclass calls super().__init__ when the parent also needs to set up. __str__ is what print and str() use. __eq__ is what == uses.</p>
          ${codeBlock("class Note:\n    def __init__(self, text):\n        self.text = text\n\n    def __str__(self):\n        return self.text\n")}`,
        },
        {
          heading: "You do not have to start here",
          html: `<p>Functions and plain dicts are enough for many programs. A class earns its place when several functions share the same data and invariants. dataclasses can write __init__ and __eq__ for a class that mostly stores fields. It is still a class.</p>`,
        },
      ],
      exercise: {
        prompt: "Write a Counter class with inc() that adds one, and value() that returns the count, starting at 0.",
        starter: "class Counter:\n    def __init__(self):\n        self.count = 0\n\n    def inc(self):\n        pass\n\n    def value(self):\n        return self.count\n",
        checks: [
          "c = Counter()\nc.inc()\nc.inc()\nassert c.value() == 2",
          "other = Counter()\nassert other.value() == 0",
        ],
      },
    },
    {
      id: "modules",
      title: "Modules and packages",
      level: "Intermediate",
      minutes: 12,
      summary: "import runs a module once and keeps it in sys.modules.",
      diagram: `flowchart LR
  I[import name] --> F[Find the module]
  F --> R[Run its top level once]
  R --> C[Cache it in sys.modules]`,
      diagramCaption: "A second import reuses the cached module",
      sources: ["modules"],
      sections: [
        {
          heading: "import and __name__",
          html: `<p>import math loads the math module. from math import sqrt binds one name. The first import executes the module's top level. Later imports reuse that module object.</p>
          <p>When you run a file directly, its __name__ is "__main__". When it is imported, __name__ is the module name. Put script-only calls under if __name__ == "__main__": so importing the file does not launch the script.</p>`,
        },
        {
          heading: "Packages",
          html: `<p>A package is a directory Python can import. A regular package contains __init__.py. Namespace packages can omit it, which is a detail you can ignore until a project uses one. Keep import side effects small. A module that opens a network connection on import is hard to test.</p>`,
        },
      ],
      exercise: {
        prompt: "Write is_script(name) that returns True only when name is the string __main__.",
        starter: "def is_script(name):\n    return False\n",
        checks: ["assert is_script('__main__') is True", "assert is_script('notes') is False"],
      },
    },
    {
      id: "files",
      title: "Files and paths",
      level: "Intermediate",
      minutes: 12,
      summary: "Use pathlib, an explicit encoding, and with so the file closes.",
      sources: ["io", "pathlib"],
      sections: [
        {
          heading: "Text is not a filename",
          html: `<p>Path("notes") / "today.txt" builds a path without worrying about slashes. read_text and write_text take an encoding. Pass encoding="utf-8" for text you control. The with statement closes the file even if the block raises.</p>
          ${codeBlock("from pathlib import Path\n\ndef save_note(folder, text):\n    path = Path(folder)\n    path.mkdir(parents=True, exist_ok=True)\n    file = path / \"note.txt\"\n    file.write_text(text, encoding=\"utf-8\")\n    return file.read_text(encoding=\"utf-8\")\n")}`,
        },
        {
          heading: "In this browser",
          html: `<p>The practice desk has a memory filesystem. /tmp is a reasonable place to write. Those files vanish on reload. On your computer, the same pathlib code writes real files.</p>`,
        },
      ],
      exercise: {
        prompt: "Write save_note(folder, text) that creates the folder if needed, writes note.txt as UTF-8, and returns the text it reads back.",
        starter: "from pathlib import Path\n\ndef save_note(folder, text):\n    return \"\"\n",
        checks: ["assert save_note('/tmp/python-lab-notes', 'hi') == 'hi'"],
      },
    },
    {
      id: "errors",
      title: "Errors and exceptions",
      level: "Intermediate",
      minutes: 14,
      summary: "Raise a specific exception. Catch the one you can handle.",
      diagram: `flowchart TD
  B[BaseException]
  B --> E[Exception]
  B --> K[KeyboardInterrupt]
  B --> S[SystemExit]
  E --> V[ValueError]
  E --> T[TypeError]
  E --> L[LookupError]
  L --> KE[KeyError]
  L --> IE[IndexError]`,
      diagramCaption: "Catch Exception when you must be broad. LookupError covers missing keys and indexes.",
      sources: ["errors", "pep-758"],
      sections: [
        {
          heading: "Raise and catch",
          html: `<p>A SyntaxError means the file is not valid Python. A TypeError means an operation does not apply to that type. A ValueError means the type is right and the value is not. KeyError and IndexError are lookup failures.</p>
          <p>try, except, else, and finally split the story: the risky work, the handler, the path that only runs when nothing was raised, and the cleanup that runs either way. Python 3.14 warns when return, break, or continue would leave a finally block, because that cleanup is easy to misunderstand.</p>
          ${codeBlock("def parse_age(text):\n    try:\n        age = int(text)\n    except ValueError as exc:\n        raise ValueError(\"age must be an integer\") from exc\n    if age < 0:\n        raise ValueError(\"age must be >= 0\")\n    return age\n")}`,
        },
        {
          heading: "Do not catch everything by reflex",
          html: `<p>except Exception: hides bugs. Catch the exception you know how to answer. A bare except: also catches KeyboardInterrupt and is worse. Let unexpected failures print a traceback.</p>`,
        },
      ],
      exercise: {
        prompt: "Write parse_age(text) that returns an int, and raises ValueError if the text is not an integer or the integer is negative.",
        starter: "def parse_age(text):\n    return int(text)\n",
        checks: [
          "assert parse_age('12') == 12",
          "failed = False\ntry:\n    parse_age('-1')\nexcept ValueError:\n    failed = True\nassert failed",
          "failed = False\ntry:\n    parse_age('nope')\nexcept ValueError:\n    failed = True\nassert failed",
        ],
      },
    },
    {
      id: "testing-packaging",
      title: "Tests, venvs, and packaging",
      level: "Intermediate",
      minutes: 16,
      summary: "A test is a program that fails when the behavior changes. An environment keeps its installs separate.",
      sources: ["unittest", "venv", "pep-405", "packaging", "pyproject", "pytest"],
      sections: [
        {
          heading: "unittest is in the language install",
          html: `<p>unittest ships with Python. A test method starts with test_, and assertions such as assertEqual fail the test. pytest is a widely used third-party runner with a lighter style. It is not the standard library. The checks in this lab are the same idea: run the function and assert what it returns.</p>
          ${codeBlock("import unittest\n\nclass TestGreet(unittest.TestCase):\n    def test_comma(self):\n        self.assertEqual(greet(\"Ada\"), \"Hello, Ada\")\n")}`,
        },
        {
          heading: "venv and a project file",
          html: `<p>python -m venv .venv creates an environment. You activate it, then pip installs into that environment instead of the system Python. PEP 405 is the design. pyproject.toml is the project file: a [build-system] table and, commonly, a [project] table described by the packaging specs. A wheel is a built archive. An sdist is a source archive.</p>
          <p>You cannot usefully create a venv inside this browser runtime. Do that on a computer where CPython is installed. The exercise below is the small pure function a packaging script might use to render a pin.</p>`,
        },
      ],
      exercise: {
        prompt: "Write pin(name, version) that returns name==version, for example requests==2.32.0.",
        starter: "def pin(name, version):\n    return \"\"\n",
        checks: ["assert pin('requests', '2.32.0') == 'requests==2.32.0'"],
      },
    },
  ],
  quiz: [
    {
      prompt: "What groups the lines of an if block?",
      choices: ["Braces", "Indentation", "A blank line", "The pass keyword"],
      answer: 1,
      why: "The lexical structure of Python uses indentation to delimit blocks.",
      source: "lexical",
    },
    {
      prompt: "When is a default argument expression evaluated?",
      choices: ["Every call", "When the function is defined", "When the module is deleted", "Only in tests"],
      answer: 1,
      why: "Defaults are evaluated at definition time, which is why a mutable default is shared.",
      source: "functions-doc",
    },
    {
      prompt: "Which tool creates the virtual environments described by PEP 405 and ships with CPython?",
      choices: ["pytest", "venv", "Flask", "ruff"],
      answer: 1,
      why: "venv is the standard-library module. pytest, Flask, and ruff are third-party.",
      source: "venv",
    },
    {
      prompt: "A Python int is",
      choices: ["Always 64 bits", "Arbitrary precision", "A str in disguise", "Limited to 32 bits on the web"],
      answer: 1,
      why: "Integers have arbitrary precision. Floats are the binary floating-point type.",
      source: "stdtypes",
    },
  ],
};
