"""Build the downloadable cheat sheets. Core facts match the Sources page."""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "downloads"
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

NOTE = (
    "Python Lab cheat sheet. Snapshot 17 October 2026. "
    "This is a study aid, not a specification. Confirm details in the Sources section "
    "of Python Lab and on the official pages linked there."
)


class Sheet(FPDF):
    def __init__(self, title: str) -> None:
        super().__init__(format="A4")
        self.sheet_title = title
        self.add_font("Lab", "", FONT)
        self.add_font("Lab", "B", FONT_B)
        self.set_auto_page_break(auto=True, margin=16)
        self.add_page()
        self.set_font("Lab", "B", 18)
        self.multi_cell(0, 9, title)
        self.ln(1)
        self.set_font("Lab", "", 9)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 4.5, NOTE)
        self.ln(2)
        self.set_text_color(0, 0, 0)

    def heading(self, text: str) -> None:
        self.ln(1)
        self.set_font("Lab", "B", 13)
        self.multi_cell(0, 7, text)
        self.ln(0.5)

    def body(self, text: str) -> None:
        self.set_font("Lab", "", 10.5)
        self.multi_cell(0, 5.2, text)
        self.ln(0.6)

    def bullet(self, text: str) -> None:
        self.set_font("Lab", "", 10.5)
        self.multi_cell(0, 5.2, "- " + text)
        self.ln(0.3)


def write_pair(name: str, title: str, blocks: list[tuple[str, list[str]]], plain: str) -> None:
    pdf = Sheet(title)
    for heading, lines in blocks:
        pdf.heading(heading)
        for line in lines:
            pdf.bullet(line)
    pdf.output(OUT / f"{name}.pdf")
    (OUT / f"{name}.txt").write_text(plain, encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    syntax_blocks = [
        ("Program shape", [
            "Indentation groups a block. Use four spaces. Do not mix tabs and spaces.",
            "Comments start with #. A string literal is not a comment.",
            "print(value) writes text. The call happens because of the parentheses.",
            "A module runs top to bottom. if __name__ == '__main__' guards script-only code.",
        ]),
        ("Names and built-in types", [
            "Assignment binds a name to an object. It does not copy the object.",
            "int has arbitrary precision. float is a binary floating-point number.",
            "str is Unicode text. bytes is raw octets. They are not interchangeable.",
            "bool is a subclass of int. None is the only value of NoneType.",
            "list and dict are mutable. tuple, str, and frozenset are immutable.",
            "A trailing comma makes a one-item tuple: (1,).",
        ]),
        ("Control flow and functions", [
            "if / elif / else, while, for, break, continue, and pass.",
            "for walks any iterable. range(n) yields 0 through n-1.",
            "match / case is structural pattern matching, added in Python 3.10.",
            "def names a function. Return values default to None.",
            "Default arguments are evaluated once, at function definition.",
            "Use a parameter default of None when the default must be a fresh list or dict.",
        ]),
        ("New enough to notice", [
            "3.14: t-strings (t'...') return a string.templatelib.Template, not a str.",
            "3.14: annotations are stored and evaluated lazily (PEP 649 and PEP 749).",
            "3.14: except A, B: is allowed when you do not use as.",
            "3.15.0 (7 Oct 2026 is the 3.14.0 date; 3.15.0 final is 9 Oct 2026): lazy import, frozendict, sentinel, and unpacking in comprehensions. The browser runtime here is 3.14.2, so those 3.15 forms are for reading, not for the Run button.",
        ]),
    ]
    syntax_txt = NOTE + "\n\n" + "\n\n".join(
        heading + "\n" + "\n".join("- " + line for line in lines) for heading, lines in syntax_blocks
    ) + "\n"
    # Fix the clumsy date sentence in the text by rewriting the last bullet cleanly.
    syntax_blocks[3][1][3] = (
        "3.15.0 was released on 9 October 2026. Highlights include lazy import, frozendict, "
        "sentinel, and unpacking in comprehensions. This lab's browser runtime is CPython 3.14.2, "
        "so those 3.15-only forms are shown for reading and are not sent to Run."
    )
    syntax_txt = NOTE + "\n\n" + "\n\n".join(
        heading + "\n" + "\n".join("- " + line for line in lines) for heading, lines in syntax_blocks
    ) + "\n"

    ds_blocks = [
        ("Sequences", [
            "list: ordered, mutable. append is amortized constant time in CPython. Inserting at the front is linear.",
            "tuple: ordered, immutable, hashable when every item is hashable.",
            "str: immutable sequence of Unicode code points. Slicing copies.",
            "deque from collections: append and pop at either end are cheap. Indexing in the middle is not.",
            "A slice is a new object for list, tuple, and str. The source is not mutated by the slice itself.",
        ]),
        ("Maps and sets", [
            "dict preserves insertion order. Keys must be hashable.",
            "Average-case lookup, insert, and delete for dict and set are constant time in CPython. Worst cases exist.",
            "set holds unique hashable items and is unordered for algorithm purposes.",
            "Use a tuple or frozenset when you need a hashable collection.",
        ]),
        ("Study patterns", [
            "Stack: append and pop on a list.",
            "Queue: collections.deque, popleft.",
            "Binary search needs a sorted random-access sequence. bisect is in the standard library.",
            "A hash table is the idea behind dict. A collision strategy is an implementation detail you do not control.",
            "State complexity as a model of growth, and name the implementation (usually CPython) when the cost is specific.",
        ]),
    ]
    lib_blocks = [
        ("Reach for these first", [
            "pathlib for paths. open, or Path.read_text, with an explicit encoding for text.",
            "json, csv, argparse, datetime, statistics, math, random, re.",
            "collections (Counter, deque, defaultdict), itertools, functools, heapq.",
            "sqlite3 for a local database file. unittest for tests that ship with Python.",
            "venv creates virtual environments. pip installs packages into the active one.",
            "typing holds annotation forms. The interpreter does not type-check your program.",
            "asyncio runs coroutines on one thread. await yields. It does not make CPU work parallel by itself.",
        ]),
        ("Annotations you will see", [
            "list[int], dict[str, int], tuple[int, ...], set[str].",
            "X | None is the modern optional form. Optional[X] still exists.",
            "TypedDict, Protocol, and TypeAlias describe shapes. They are not runtime schemas unless a library uses them that way.",
            "A type checker such as mypy or Pyright is a separate tool.",
        ]),
        ("Packaging", [
            "pyproject.toml is the project file. PEP 621 describes the [project] table.",
            "A wheel is a built distribution. An sdist is a source distribution.",
            "uv and ruff are third-party tools from Astral. They are not the standard library.",
            "pytest is third-party. unittest is the standard-library test runner.",
        ]),
    ]
    study_blocks = [
        ("A honest study order", [
            "Write small programs until syntax, types, and functions feel ordinary.",
            "Then files, exceptions, modules, and tests. A program you can rerun is ahead of a program you only watched.",
            "Build one finished project and be able to explain its data structures and its limits.",
            "Practice interview tasks as explanations: what you tried, the cost, and a test that would catch a mistake.",
            "Choose a specialty after that: web, data, automation, or models. The language underneath stays the same.",
        ]),
        ("What this sheet will not do", [
            "It does not estimate pay, promise a job, or rank you against other people.",
            "It does not replace the Python language reference.",
            "Certification facts change. Read the OpenEDG Python Institute exam page before you pay.",
        ]),
        ("Exams worth opening, snapshot 17 October 2026", [
            "PCEP-30-02 is the active entry-level general exam. PCEP-30-03 was listed as pending for 31 October 2026.",
            "PCAP-31-03 is the active associate exam. PCAP-31-04 was listed as pending for 31 October 2026.",
            "PCPP-32-101 is the active professional level 1 exam. PCPP-32-201 (PCPP2) was listed as in development.",
            "These are OpenEDG Python Institute credentials, not Python Software Foundation credentials.",
        ]),
    ]
    write_pair("python-syntax-cheatsheet", "Python syntax cheat sheet", syntax_blocks, syntax_txt)
    write_pair(
        "data-structures-cheatsheet",
        "Data structures cheat sheet",
        ds_blocks,
        NOTE + "\n\n" + "\n\n".join(h + "\n" + "\n".join("- " + line for line in lines) for h, lines in ds_blocks) + "\n",
    )
    write_pair(
        "stdlib-typing-cheatsheet",
        "Standard library and typing cheat sheet",
        lib_blocks,
        NOTE + "\n\n" + "\n\n".join(h + "\n" + "\n".join("- " + line for line in lines) for h, lines in lib_blocks) + "\n",
    )
    write_pair(
        "study-checklist",
        "Study checklist",
        study_blocks,
        NOTE + "\n\n" + "\n\n".join(h + "\n" + "\n".join("- " + line for line in lines) for h, lines in study_blocks) + "\n",
    )
    for path in sorted(OUT.iterdir()):
        print(f"{path.name:40} {path.stat().st_size:8} bytes")


if __name__ == "__main__":
    main()
