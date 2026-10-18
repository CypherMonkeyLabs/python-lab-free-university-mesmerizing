---
id: L06
level: 6
title: Paths and Patterns
slug: Paths-and-Patterns
accent: "#5eead4"
audience: intermediate
hours: 30
python_min: "3.8"
python_tested: "3.12"
outcomes:
  - Join path pieces with pathlib instead of gluing strings
  - Find a number inside text with a regular expression
  - Give a small program a command-line option with argparse
  - Keep a sample from touching the real filesystem
project: "A tiny note-sorter that accepts --title"
sources:
  - {id: pathlib, title: "Python docs: pathlib", url: "https://docs.python.org/3/library/pathlib.html"}
  - {id: re, title: "Python docs: re", url: "https://docs.python.org/3/library/re.html"}
  - {id: argparse, title: "Python docs: argparse", url: "https://docs.python.org/3/library/argparse.html"}
---
# Paths and Patterns

## Paths are objects

`pathlib.Path` joins pieces with `/`. `as_posix` shows the forward-slash form, which is what the docs use in examples.

```python run
from pathlib import Path
path = Path("notes") / "week" / "a.txt"
print(path.as_posix())
print(path.suffix)
```

## Patterns find a piece of text

`re.search` returns a match object, or `None` when nothing matched. This example looks for digits.

```python run
import re
match = re.search(r"\d+", "room 12b")
print(match.group(0) if match else "none")
print(re.sub(r"\s+", "-", "a  b   c"))
```

## argparse reads options

`parse_args([])` reads an empty argument list, so the build does not depend on how the script was started. The default is what a user would get if they passed no flags.

```python run
import argparse
parser = argparse.ArgumentParser(prog="notes")
parser.add_argument("--title", default="inbox")
args = parser.parse_args([])
print(args.title)
```

## Check yourself

1. What does `Path("notes") / "a.txt"` produce?
2. What does `re.search` return when the pattern is missing?
3. Why does this page call `parse_args([])`?
