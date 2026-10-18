---
id: L05
level: 5
title: Classes and Modules
slug: Classes-and-Modules
accent: "#ff6b6b"
audience: intermediate
hours: 35
python_min: "3.8"
python_tested: "3.12"
outcomes:
  - Define a class with an __init__ method and read an attribute
  - Build one instance and call a method on it
  - Explain that import runs a module once and stores it on sys.modules
  - Say what a virtual environment isolates
project: "A Note class plus a one-line import check"
sources:
  - {id: classes, title: "Python tutorial: Classes", url: "https://docs.python.org/3/tutorial/classes.html"}
  - {id: modules, title: "Python tutorial: Modules", url: "https://docs.python.org/3/tutorial/modules.html"}
  - {id: venv, title: "Python docs: venv", url: "https://docs.python.org/3/library/venv.html"}
  - {id: pep405, title: "PEP 405 – Python Virtual Environments", url: "https://peps.python.org/pep-0405/"}
---
# Classes and Modules

## A class bundles data and methods

The tutorial describes a class as a way to bundle data and the operations on that data. `__init__` runs when you call the class. `self` is the instance.

```python run
class Note:
    def __init__(self, text):
        self.text = text

    def shout(self):
        return self.text.upper()

note = Note("hello")
print(note.text)
print(note.shout())
```

## import runs the module once

`import` executes a module and keeps the module object in `sys.modules`. Importing again returns that same object. `json` is in the standard library, so this sample does not install anything.

```python run
import json
import sys
print("json" in sys.modules)
print(json.dumps({"ok": True}))
```

## A virtual environment isolates installs

`venv` creates an environment with its own site-packages. PEP 405 is the design. This page does not create an environment during the build, because that would write a folder. The check below only reports that the `venv` module can be found.

```python run
import importlib.util
print(importlib.util.find_spec("venv") is not None)
```

## Check yourself

1. When does `__init__` run?
2. Where does Python keep a module after the first import?
3. What does a virtual environment keep separate?
