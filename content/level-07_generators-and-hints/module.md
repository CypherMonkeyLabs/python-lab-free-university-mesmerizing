---
id: L07
level: 7
title: Generators and Type Hints
slug: Generators-and-Type-Hints
accent: "#8ab4ff"
audience: intermediate
hours: 40
python_min: "3.9"
python_tested: "3.12"
outcomes:
  - Write a generator that yields one value at a time
  - Wrap a def with a decorator
  - Read a hint back from __annotations__
  - State that hints are not enforced while the program runs
project: "A countdown generator with a hinted total"
sources:
  - {id: yield-expr, title: "Python reference: Yield expressions", url: "https://docs.python.org/3/reference/expressions.html#yield-expressions"}
  - {id: glossary-decorator, title: "Python glossary: decorator", url: "https://docs.python.org/3/glossary.html#term-decorator"}
  - {id: typing, title: "Python docs: typing", url: "https://docs.python.org/3/library/typing.html"}
  - {id: pep484, title: "PEP 484 – Type Hints", url: "https://peps.python.org/pep-0484/"}
---
# Generators and Type Hints

## yield pauses and resumes

A generator produces values one at a time. `list` pulls every yielded value. The reference describes `yield` as the way a generator sends a value to its caller.

```python run
def countdown(n):
    while n:
        yield n
        n -= 1

print(list(countdown(3)))
```

## A decorator wraps a def

The glossary defines a decorator as a way to return a new object, usually a wrapper, that replaces the original. This wrapper uppercases the returned text. Hints are not involved yet.

```python run
def shout(fn):
    def wrapped(text):
        return fn(text).upper()
    return wrapped

@shout
def greet(text):
    return "hi " + text

print(greet("ada"))
```

## Hints are readable, not a gate

PEP 484 says type hints are optional and are not required at runtime. CPython stores them on `__annotations__`. It does not reject a call that ignores them. `typing` is the standard-library module for the hint names.

```python run
def add(a: int, b: int) -> int:
    return a + b

print(add(2, 5))
print(add.__annotations__["return"].__name__)
```

## Check yourself

1. What does `yield` do that `return` does not?
2. What does a decorator return?
3. Does Python stop you when a call ignores a hint?
