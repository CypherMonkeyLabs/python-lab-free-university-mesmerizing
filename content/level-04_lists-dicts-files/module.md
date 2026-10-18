---
id: L04
level: 4
title: Lists, Dicts and Files
slug: Lists-Dicts-and-Files
accent: "#c792ff"
audience: beginner
hours: 30
python_min: "3.8"
python_tested: "3.12"
outcomes:
  - Store several values in a list and read one by index
  - Look up a value in a dict by its key
  - Tell a set apart from a list
  - Read and write a small text file with pathlib
project: "An address card kept in a dict and saved as a text file"
sources:
  - {id: stdtypes, title: "Python docs: Built-in types", url: "https://docs.python.org/3/library/stdtypes.html"}
  - {id: pathlib, title: "Python docs: pathlib", url: "https://docs.python.org/3/library/pathlib.html"}
  - {id: io, title: "Python tutorial: Input and output", url: "https://docs.python.org/3/tutorial/inputoutput.html"}
  - {id: timecomplexity, title: "Python wiki: TimeComplexity", url: "https://wiki.python.org/moin/TimeComplexity"}
---
# Lists, Dicts and Files

## A list keeps an order

A list is a mutable sequence. Indexes start at 0. `append` adds at the end. The Python wiki's TimeComplexity page describes CPython list costs; it is community notes, not a language guarantee.

```python run
names = ["Ada", "Grace"]
names.append("Guido")
print(names[0], len(names))
print(names[1:3])
```

## A dict looks up by key

A dict maps each key to one value. `in` tests keys, not values.

```python run
card = {"name": "Ada", "year": 1815}
print(card["name"])
print("year" in card)
print(card.get("city", "unknown"))
```

## A set keeps unique items

A set does not keep order you can rely on, and it drops duplicates.

```python run
tools = {"pen", "ink", "pen"}
print(len(tools))
print("ink" in tools)
```

## A file should say its encoding

`pathlib.Path` is the object-oriented way to name a file. `write_text` and `read_text` take an encoding. This sample uses a temporary directory so the build does not leave a file behind.

```python run
import tempfile
from pathlib import Path
folder = Path(tempfile.mkdtemp())
path = folder / "card.txt"
path.write_text("Ada\n", encoding="utf-8")
print(path.read_text(encoding="utf-8").strip())
```

## Check yourself

1. What is the index of the first item in a list?
2. Does `in` on a dict test keys or values?
3. Why pass `encoding="utf-8"` when you read text?
