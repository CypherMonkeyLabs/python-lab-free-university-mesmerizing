---
id: L02
level: 2
title: Decisions and Loops
slug: Decisions-and-Loops
accent: "#ffd166"
audience: beginner
hours: 14
python_min: "3.8"
python_tested: "3.13"
outcomes:
  - Write if, elif and else branches with comparison and boolean operators
  - Loop with for and range, and with while
  - Use break and continue and say when each is clearer
  - Trace a small program by hand, line by line
project: "A number-guess game"
sources:
  - {id: tutorial-control, title: "Python tutorial: More control flow tools", url: "https://docs.python.org/3/tutorial/controlflow.html"}
  - {id: pep8, title: "PEP 8 Style Guide for Python Code", url: "https://peps.python.org/pep-0008/"}
  - {id: truth, title: "Python docs: Truth value testing", url: "https://docs.python.org/3/library/stdtypes.html#truth-value-testing"}
---
# Decisions and Loops

## Decisions with if

Python runs the first branch whose test is true. Indentation shows which lines belong to the branch.

```python run
score = 72
if score >= 90:
    grade = "A"
elif score >= 70:
    grade = "C or better"
else:
    grade = "keep practising"
print(grade)
```

## Comparing and combining

Comparisons give booleans. Combine them with `and`, `or`, `not`.

```python run
age = 15
has_ticket = True
print(age >= 13 and has_ticket)
print(not has_ticket)
```

## Loops with for and range

`range(n)` counts from 0 up to n - 1.

```python run
for i in range(3):
    print("lap", i)
print(sum(range(1, 6)))
```

## Loops with while

A while loop repeats as long as its test is true. Change something inside, or it never ends.

```python run
n = 3
while n > 0:
    print(n)
    n -= 1
print("go")
```

## break and continue

`break` leaves the loop. `continue` skips to the next pass.

```python run
for i in range(10):
    if i % 2 == 0:
        continue
    if i > 7:
        break
    print(i)
```

## Tracing by hand

Write each name and its value after every line. Compare your table with the output.

```python run
total = 0
for i in range(1, 4):
    total += i
    print(i, total)
```

## Check yourself

1. Which branch runs when `score` is 70?
2. How many times does `for i in range(3)` run its body?
3. What does `continue` do?

## Project: Number-guess game

The computer picks a number from 1 to 20 (use a fixed number first). Loop until the guess is right, print "higher" or "lower", and stop after 6 tries.
