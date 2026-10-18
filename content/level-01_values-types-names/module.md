---
id: L01
level: 1
title: Values, Types and Names
slug: Values-Types-and-Names
accent: "#4fd1e6"
audience: beginner
hours: 10
python_min: "3.8"
python_tested: "3.13"
outcomes:
  - Name the basic types int, float, str and bool and check one with type()
  - Bind a value to a name and explain what reassignment does
  - Use f-strings to build readable text
  - Convert between str and numbers and handle the common error
project: "A tip and tax calculator"
sources:
  - {id: tutorial-intro, title: "Python tutorial: An informal introduction", url: "https://docs.python.org/3/tutorial/introduction.html"}
  - {id: datamodel, title: "Python reference: The data model", url: "https://docs.python.org/3/reference/datamodel.html"}
  - {id: fstrings, title: "Python docs: Formatted string literals", url: "https://docs.python.org/3/reference/lexical_analysis.html#f-strings"}
  - {id: pep8, title: "PEP 8 Style Guide for Python Code", url: "https://peps.python.org/pep-0008/"}
---
# Values, Types and Names

## Values have types

Every value has a type. `type()` tells you which.

```python run
print(type(42))
print(type(3.5))
print(type("hi"))
print(type(True))
```

## Names point at values

A name is a label stuck to a value. Reassigning moves the label; it does not change the old value.

```python run
total = 10
total = total + 5
print(total)
```

## Numbers and arithmetic

`/` always gives a float. `//` divides and rounds down. `%` gives the remainder.

```python run
print(7 / 2)
print(7 // 2)
print(7 % 2)
print(2 ** 10)
```

## Strings and f-strings

An f-string puts values into text. Format specs control decimals.

```python run
name = "Ada"
price = 19.5
print(f"{name} pays {price:.2f}")
print(name.upper(), len(name))
```

## Converting types

`input()` always returns text. Convert it before doing arithmetic.

```python run
text = "12"
print(int(text) + 1)
try:
    int("twelve")
except ValueError as err:
    print("ValueError:", err)
```

## Check yourself

1. What is `type(7 / 2)`?
2. After `total = 10` and `total = total + 5`, what does `total` name?
3. Why must you convert the result of `input()` before adding numbers?

## Project: Tip and tax calculator

Ask for a bill, a tip percent and a tax percent, convert them, and print the total with two decimals using an f-string.
