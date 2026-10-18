---
id: L00
level: 0
title: First Program
slug: First-Program
accent: "#7ee08a"
audience: absolute-beginner
hours: 4
python_min: "3.8"
python_tested: "3.13"
outcomes:
  - Run a one-line program and read what it printed
  - Read an error message from the last line upward
  - Find the official docs page for a built-in function
  - Explain what a program is in your own words
project: "A Hello, me card"
sources:
  - {id: tutorial-intro, title: "Python tutorial: An informal introduction", url: "https://docs.python.org/3/tutorial/introduction.html"}
  - {id: builtin-print, title: "Python docs: print()", url: "https://docs.python.org/3/library/functions.html#print"}
  - {id: errors, title: "Python tutorial: Errors and exceptions", url: "https://docs.python.org/3/tutorial/errors.html"}
---
# First Program

## What a program is

A program is a list of instructions a computer follows in order. Python reads your file from the top and does each instruction in turn.

## Your first print

`print` shows a value on the screen. Text goes inside quotes.

```python run
print("Hello, me")
print("My first program")
```

## Printing more than text

You can print numbers and do arithmetic. Python works the answer out before it prints.

```python run
print(2 + 3)
print("2 + 3 =", 2 + 3)
```

## Reading an error

An error is not a failure. A traceback is a map: start at the last line, which names the problem. This example catches the error so you can see its message.

```python run
try:
    print(undefined_name)
except NameError as err:
    print("NameError:", err)
```

## Find the docs

Every built-in function has a page in the official documentation. Search for `print()` and read its parameters, such as `sep` and `end`.

```python run
print("a", "b", "c", sep="-")
print("no newline", end="!")
print()
```

## Check yourself

1. What does `print("2 + 3")` show, compared with `print(2 + 3)`?
2. Which line of a traceback names the problem?
3. What does `sep` change?

## Project: Hello, me card

Print four lines: your name, one thing you are learning, one thing you like, and today's goal. Then change the `sep` between two items.
