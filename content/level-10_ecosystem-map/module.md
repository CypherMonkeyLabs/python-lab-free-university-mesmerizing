---
id: L10
level: 10
title: Ecosystem Map
slug: Ecosystem-Map
accent: "#7f8cff"
audience: intermediate
hours: 70
python_min: "3.8"
python_tested: "3.12"
outcomes:
  - Name three standard-library modules and what each one is for
  - Separate a vendored library in this lab from one that is not
  - Point at the official docs for NumPy, pandas and Flask
  - Sketch a capstone that only uses libraries you can cite
project: "A one-page map of three libraries, each with its docs link"
sources:
  - {id: tutorial, title: "The Python Tutorial", url: "https://docs.python.org/3/tutorial/index.html"}
  - {id: numpy, title: "NumPy documentation", url: "https://numpy.org/doc/stable/"}
  - {id: pandas, title: "pandas documentation", url: "https://pandas.pydata.org/docs/"}
  - {id: flask, title: "Flask documentation", url: "https://flask.palletsprojects.com/"}
  - {id: pyodide, title: "Pyodide", url: "https://pyodide.org/en/stable/"}
---
# Ecosystem Map

## Start from the standard library

`json`, `pathlib` and `math` ship with Python. You do not install them. This sample only checks that `math.sqrt` returns the value the docs describe for a perfect square.

```python run
import math
mods = ["json", "pathlib", "math"]
print(", ".join(mods))
print(math.sqrt(9))
```

## This lab vendors some libraries and not others

The browser runtime in this site vendors Pyodide, NumPy 2.4.6 and pandas 3.0.2. Flask is not part of that runtime. The build machine for these files does not import Flask or NumPy, so this page does not print their versions. Read their docs from the links under Sources.

```python run
vendored_here = ["Pyodide", "NumPy", "pandas"]
not_vendored_here = ["Flask"]
print("vendored: " + ", ".join(vendored_here))
print("not vendored: " + ", ".join(not_vendored_here))
```

## A capstone is a project you choose

Pick one small program that uses the standard library, and optionally NumPy or pandas inside the lab's browser runner. Write down the docs page you followed. This Level does not grade it and does not promise a job, a certificate, or a result.

## Check yourself

1. Name one standard-library module from the first sample.
2. Which of NumPy and Flask is vendored in this lab's browser runtime?
3. What belongs on your capstone map besides the library name?
