# Python Lab slides

Text of every slide deck in the lab. Code outputs shown were run on CPython 3.14 unless a note says otherwise.
Content licence: CC BY-NC-SA 4.0. See the repository LICENSE.

## Your first hour with Python (Fundamentals)

Run code, name things, make decisions, repeat, define a function, and read an error.

### 1. What Python is

- A general-purpose language known for readable code.
- You write text; the interpreter compiles it to bytecode and runs it.
- Free to use, with a very large standard library.

### 2. Two ways to run code

- The REPL: type a line, see a result at once.
- A file: save it as hello.py and run python hello.py.
- This lab's practice desk is a browser REPL with checks.

```python
>>> 2 + 3
5
>>> print('hello')
hello
```

### 3. Names point at objects

- x = 5 binds the name x to an int object.
- Assignment does not copy; it points the name at the object.
- type(x) tells you what the object is.

```python
x = 5
y = x
print(type(x), x is y)
```

Output:

```text
<class 'int'> True
```

### 4. Core types

- int, float, str, bool, and None are the building blocks.
- Strings are immutable: a method returns a new string.
- Use // for floor division and ** for powers.

### 5. f-strings

- Prefix a string with f and put expressions in braces.
- A format spec after a colon controls how the value looks.
- Python 3.14 adds t-strings, which build a Template instead of a str.

```python
name = 'Ada'
score = 91.456
print(f'{name}: {score:.1f}')
```

Output:

```text
Ada: 91.5
```

### 6. Decisions

- if, elif, and else pick one branch.
- Indentation is the syntax: four spaces is the convention.
- Empty containers, 0, and None count as false.

```python
n = 7
if n % 2 == 0:
    print('even')
else:
    print('odd')
```

Output:

```text
odd
```

### 7. Loops

- for walks any iterable; while repeats until a condition fails.
- range(n) gives 0 up to n - 1.
- break leaves the loop; continue skips to the next turn.

```python
for i in range(3):
    print(i * i)
```

Output:

```text
0
1
4
```

### 8. Lists and dicts

- A list is an ordered, changeable sequence.
- A dict maps keys to values and keeps insertion order.
- Index with [], slice with [start:stop].

```python
nums = [3, 1, 2]
ages = {'ada': 36}
print(nums[1:], ages['ada'])
```

Output:

```text
[1, 2] 36
```

### 9. Functions

- def names a reusable block; return hands back a value.
- Parameters can have defaults.
- A function with no return gives back None.

```python
def area(w, h=1):
    return w * h

print(area(3, 4), area(5))
```

Output:

```text
12 5
```

### 10. Errors are information

- A traceback reads from the bottom: the last line names the error.
- try/except handles an error you expect.
- Python 3.14 lets you write except A, B: without brackets when you do not use as.

```python
try:
    int('x')
except ValueError as e:
    print('bad:', e)
```

Output:

```text
bad: invalid literal for int() with base 10: 'x'
```

### 11. Read before you run

- Predict the output before pressing Run.
- Change one thing at a time.
- The Sources page lists the official docs behind every lesson.

### 12. Where next

- Fundamentals track: syntax, types, names, files, errors.
- Then data structures, functions, and modules.
- Games and quizzes are good five-minute breaks.

## Data structures that earn their keep (Fundamentals)

Lists, tuples, dicts, sets, comprehensions, and the standard-library containers.

### 1. Pick the container by the question

- Need order and changes? list.
- Need a fixed record? tuple.
- Need lookup by key? dict. Need uniqueness? set.

### 2. Lists

- Append at the end is cheap on average.
- Insert or delete near the front shifts every item.
- x in some_list scans the list, so it is O(n).

```python
xs = [1, 2]
xs.append(3)
xs.insert(0, 0)
print(xs)
```

Output:

```text
[0, 1, 2, 3]
```

### 3. Slicing

- a[start:stop:step]; stop is excluded.
- Negative indexes count from the end.
- A slice makes a new list.

```python
a = [10, 20, 30, 40]
print(a[1:3], a[-1], a[::2])
```

Output:

```text
[20, 30] 40 [10, 30]
```

### 4. Tuples

- Immutable and often used as a small record.
- Unpack them in one line.
- A tuple can be a dict key if everything inside is hashable.

```python
pt = (3, 4)
x, y = pt
print(x + y)
```

Output:

```text
7
```

### 5. Dicts

- Average lookup by key is O(1).
- get() avoids a KeyError.
- Keys must be hashable.

```python
d = {'a': 1}
d['b'] = 2
print(d.get('c', 0), list(d))
```

Output:

```text
0 ['a', 'b']
```

### 6. Sets

- Unique items with fast membership tests.
- Union |, intersection &, difference -.
- An empty set is set(), not {}.

```python
a = {1, 2, 3}
b = {2, 3, 4}
print(a & b, a | b)
```

Output:

```text
{2, 3} {1, 2, 3, 4}
```

### 7. Comprehensions

- One expression builds a new list, set, or dict.
- Add an if to filter.
- If it needs three lines to read, use a loop.

```python
sq = [n * n for n in range(5) if n % 2 == 0]
print(sq)
```

Output:

```text
[0, 4, 16]
```

### 8. Sorting

- sorted() returns a new list; list.sort() sorts in place.
- key= takes a function that returns the sort value.
- The sort is stable.

```python
words = ['pear', 'fig', 'apple']
print(sorted(words, key=len))
```

Output:

```text
['fig', 'pear', 'apple']
```

### 9. collections

- deque: fast appends and pops at both ends.
- Counter: counts hashable items.
- defaultdict: a dict that creates missing values.

```python
from collections import Counter
print(Counter('banana').most_common(1))
```

Output:

```text
[('a', 3)]
```

### 10. heapq and bisect

- heapq keeps the smallest item at index 0 of a list.
- bisect finds an insert point in a sorted list.
- Both live in the standard library.

```python
import heapq
h = [5, 1, 3]
heapq.heapify(h)
print(heapq.heappop(h))
```

Output:

```text
1
```

### 11. Talking about cost

- Say what you count: items, comparisons, or memory.
- The TimeComplexity wiki page lists CPython's typical costs.
- Measure with timeit before you optimise.

## Functions, classes, and methods (Intermediate)

Arguments, scope, closures, decorators, classes, dataclasses, and annotations.

### 1. A call is a small machine

- Each call gets its own frame and local names.
- Arguments are bound to parameters; objects are not copied.
- return ends the frame and hands back one object.

### 2. Arguments

- Positional, keyword, default, *args, **kwargs.
- A bare * forces keyword-only parameters.
- A bare / makes earlier parameters positional-only.

```python
def f(a, /, b, *, c=0):
    return a + b + c

print(f(1, 2, c=3))
```

Output:

```text
6
```

### 3. The mutable default trap

- A default value is created once, when def runs.
- A list default is shared between calls.
- Use None and create the list inside.

```python
def add(x, bag=None):
    if bag is None:
        bag = []
    bag.append(x)
    return bag

print(add(1), add(2))
```

Output:

```text
[1] [2]
```

### 4. Scope: LEGB

- Local, Enclosing, Global, Built-in: the lookup order.
- Assignment inside a function makes a name local.
- nonlocal and global change that rule on purpose.

### 5. Closures

- An inner function can remember names from the outer one.
- Handy for small factories.
- Each call to the outer function makes a new closure.

```python
def make(n):
    def times(x):
        return x * n
    return times

double = make(2)
print(double(21))
```

Output:

```text
42
```

### 6. Decorators

- @name above a def is shorthand for f = name(f).
- functools.wraps keeps the original name and docstring.
- Use them for timing, caching, and checks.

```python
from functools import cache

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(30))
```

Output:

```text
832040
```

### 7. Classes

- A class bundles data and the functions that use it.
- __init__ sets up a new instance.
- self is the instance, passed automatically.

```python
class Dog:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return f'{self.name} says woof'

print(Dog('Rex').speak())
```

Output:

```text
Rex says woof
```

### 8. Three kinds of method

- Instance methods take self.
- @classmethod takes cls and is often an alternate constructor.
- @staticmethod takes neither; it is a plain function in a class namespace.

### 9. Dunder methods

- __repr__ for debugging, __str__ for display.
- __eq__ and __hash__ go together.
- __len__, __iter__, and __getitem__ make your class feel built in.

```python
class P:
    def __init__(self, x):
        self.x = x
    def __repr__(self):
        return f'P({self.x})'

print([P(1), P(2)])
```

Output:

```text
[P(1), P(2)]
```

### 10. Dataclasses

- @dataclass writes __init__, __repr__, and __eq__ for you.
- Fields are declared with annotations.
- frozen=True makes instances immutable.

```python
from dataclasses import dataclass

@dataclass
class Pt:
    x: int
    y: int = 0

print(Pt(3))
```

Output:

```text
Pt(x=3, y=0)
```

### 11. Annotations

- Annotations describe intent; Python does not enforce them.
- Checkers such as mypy and Pyright read them.
- Since 3.14, annotations are evaluated lazily (PEP 649), so forward references need no quotes.

```python
def greet(name: str, times: int = 1) -> str:
    return ('hi ' + name + ' ') * times

print(greet('Ada').strip())
```

Output:

```text
hi Ada
```

### 12. Composition over inheritance

- Inherit when the child really is a kind of the parent.
- Otherwise hold the other object as a field.
- Small functions plus plain data often beat deep class trees.

## Modules, packages, and environments (Intermediate)

How import works, how to structure a project, and how to keep dependencies apart.

### 1. A module is a file

- math.py is the module math; import math runs it once.
- Names inside become attributes of the module object.
- A package is a directory of modules, usually with __init__.py.

### 2. Import forms

- import json; json.dumps(x)
- from json import dumps
- import numpy as np is a common alias.

```python
import math
from math import sqrt
print(math.pi > 3, sqrt(16))
```

Output:

```text
True 4.0
```

### 3. What import does

- Check sys.modules first. A hit is a dictionary lookup.
- On a miss, finders locate the module and a loader runs it.
- Source modules can cache bytecode in __pycache__.

### 4. The main guard

- __name__ is '__main__' when the file is run directly.
- Guard demo code so importing the file has no side effects.
- It also makes the file testable.

```python
def main():
    print('running')

if __name__ == '__main__':
    main()
```

Output:

```text
running
```

### 5. Where Python looks

- sys.path is the list of places searched.
- The script folder comes first, then the standard library and site-packages.
- Do not name your file after a standard module such as random.py.

```python
import sys
print(type(sys.path), len(sys.path) > 0)
```

Output:

```text
<class 'list'> True
```

### 6. Virtual environments

- python -m venv .venv makes an isolated folder of packages.
- Activate it, then pip install inside it.
- One environment per project avoids version clashes.

### 7. pyproject.toml

- One file describes the project: name, version, dependencies.
- It is standardised by the PyPA specifications.
- Tools such as uv and pip read it.

```python
[project]
name = "demo"
version = "0.1.0"
dependencies = ["requests"]
```

### 8. Standard library tour

- pathlib for paths, json and csv for data, argparse for command lines.
- datetime, logging, sqlite3, unittest, subprocess.
- Look there before you install a package.

### 9. Circular imports

- A imports B while B imports A: one gets a half-built module.
- Fix by moving shared code to a third module.
- Or import inside the function that needs it.

### 10. Lazy imports in 3.15

- Python 3.15 adds explicit lazy imports (PEP 810).
- This lab's browser runtime is Python 3.14, so do not send that syntax to Run.
- Check which version you are on with python --version.

## Flow: iterators, generators, and async (Advanced)

From loops to generators to the asyncio event loop, tasks, and timeouts.

### 1. Iteration protocol

- for calls iter() then next() until StopIteration.
- Lists, dicts, files, and generators are all iterable.
- You can build your own with __iter__ and __next__.

### 2. Generators

- A function with yield returns a generator.
- It runs until yield, then pauses with its state kept.
- Great for large or endless streams.

```python
def count(n):
    for i in range(n):
        yield i

print(list(count(3)))
```

Output:

```text
[0, 1, 2]
```

### 3. Generator expressions

- Like a list comprehension but lazy.
- Pass one straight to sum, any, or all.
- Memory stays flat.

```python
print(sum(n * n for n in range(1000)))
```

Output:

```text
332833500
```

### 4. Why async

- Waiting on a network is slow; the CPU sits idle.
- Async lets one thread run other tasks while one waits.
- It helps with waiting, not with heavy computation.

### 5. Coroutines

- async def makes a coroutine function.
- Calling it returns a coroutine object; await runs it.
- await only works inside async def.

```python
import asyncio

async def hello():
    await asyncio.sleep(0)
    return 'hi'

print(asyncio.run(hello()))
```

Output:

```text
hi
```

> Run this one on your own computer. The browser practice desk uses await inside checks instead of asyncio.run.

### 6. The event loop

- asyncio.run starts a loop and runs your coroutine to the end.
- The loop picks a ready task, runs it to its next await, then picks another.
- A selector waits for sockets to become ready.

### 7. Tasks and TaskGroup

- create_task schedules a coroutine to run soon.
- asyncio.TaskGroup (3.11+) waits for all tasks and cancels siblings on error.
- gather collects results in order.

```python
import asyncio

async def sq(n):
    return n * n

async def main():
    async with asyncio.TaskGroup() as tg:
        ts = [tg.create_task(sq(i)) for i in range(3)]
    print([t.result() for t in ts])

asyncio.run(main())
```

Output:

```text
[0, 1, 4]
```

> Run this one on your own computer. The browser practice desk uses await inside checks instead of asyncio.run.

### 8. Timeouts and cancellation

- asyncio.timeout() cancels the work inside its block and raises TimeoutError outside.
- cancel() raises CancelledError at the next await.
- Do not swallow CancelledError.

### 9. Pitfalls

- A blocking call such as time.sleep freezes every task.
- Forgetting await gives you a coroutine object and a warning.
- Shared state between tasks still needs care.

### 10. Threads, processes, async

- Async: many waits, one thread.
- Threads: blocking libraries, with the GIL limiting Python bytecode in the default build.
- Processes: CPU-heavy work on several cores.

### 11. Free-threaded and subinterpreters

- PEP 779: free-threaded CPython is officially supported in 3.14 as a separate build.
- PEP 734: multiple interpreters arrive in the standard library in 3.14.
- Check each library for support before relying on it.

## What is new in Python 3.14 and 3.15 (Advanced)

As of October 2026: the 3.14 features this lab teaches and what 3.15 added.

### 1. Where releases stand

- 3.14.0 came out on 7 October 2025.
- 3.15.0 came out on 9 October 2026.
- This lab's runtime is Pyodide 314.0.7, which runs CPython 3.14.2.

### 2. t-strings (PEP 750)

- Prefix t instead of f.
- The result is a Template, not a finished str.
- Libraries can then escape or validate each part.

```python
name = 'Ada'
tpl = t'Hello {name}'
print(type(tpl).__name__)
```

Output:

```text
Template
```

### 3. Deferred annotations (PEP 649)

- Annotations are evaluated lazily.
- Forward references work without quotes.
- Use annotationlib to inspect them.

```python
def f(x: Later) -> Later: ...
class Later: ...
print('ok')
```

Output:

```text
ok
```

### 4. except without brackets (PEP 758)

- except A, B: is allowed when you do not use as.
- A single type never needed brackets.
- Keep brackets when you bind a name.

```python
try:
    {}['k']
except KeyError, TypeError:
    print('caught')
```

Output:

```text
caught
```

### 5. Free-threaded build (PEP 779)

- Officially supported in 3.14, as a separate build.
- It removes the global interpreter lock.
- C extensions must declare support.

### 6. Multiple interpreters (PEP 734)

- Subinterpreters are available from the standard library.
- InterpreterPoolExecutor runs work in separate interpreters.
- They isolate state better than threads.

### 7. compression.zstd (PEP 784)

- Zstandard compression is in the standard library.
- The module is compression.zstd.
- It joins gzip, bz2, and lzma under compression.

### 8. What 3.15 added

- Explicit lazy imports (PEP 810).
- A frozendict built-in (PEP 814).
- See What's new in Python 3.15 for the full list.

### 9. Using new syntax safely

- Check python --version before you copy an example.
- In this lab, 3.15-only syntax is labelled and is not run in the browser.
- Official pages win if a lesson and python.org disagree.

## NumPy and pandas, hands on (Intermediate)

Arrays, vectorised thinking, DataFrames, cleaning, grouping, and merging.

### 1. Why arrays

- A NumPy array stores one dense block of same-typed numbers.
- Operations apply to every element without a Python loop.
- That is what makes numeric code fast.

```python
import numpy as np
a = np.array([1, 2, 3])
print(a * 2, a.mean())
```

Output:

```text
[2 4 6] 2.0
```

### 2. Shape and dtype

- shape says how many rows and columns.
- dtype says what each element is. The default integer size depends on the platform.
- reshape changes the view, not the data.

```python
import numpy as np
m = np.arange(6).reshape(2, 3)
print(m.shape, m.sum())
```

Output:

```text
(2, 3) 15
```

### 3. Boolean masks

- A comparison gives an array of True and False.
- Use it as an index to filter.
- Combine masks with & and |, with brackets.

```python
import numpy as np
a = np.array([5, 12, 7, 20])
print(a[a > 6])
```

Output:

```text
[12  7 20]
```

### 4. DataFrames

- A DataFrame is a table with labelled columns.
- Each column is a Series with one dtype.
- Build one from a dict, a CSV, or records.

```python
import pandas as pd
df = pd.DataFrame({'n': ['a', 'b'], 'v': [1, 2]})
print(df.shape)
```

Output:

```text
(2, 2)
```

### 5. Select and filter

- df['v'] picks a column; df[['n', 'v']] picks several.
- df[df['v'] > 1] filters rows.
- loc uses labels; iloc uses positions.

```python
import pandas as pd
df = pd.DataFrame({'v': [1, 2, 3]})
print(df[df['v'] > 1]['v'].tolist())
```

Output:

```text
[2, 3]
```

### 6. Missing data

- NaN marks a missing number.
- isna finds them, dropna removes rows, fillna replaces.
- Decide on purpose; do not hide them.

```python
import pandas as pd
s = pd.Series([1.0, None, 3.0])
print(s.isna().sum(), s.fillna(0).tolist())
```

Output:

```text
1 [1.0, 0.0, 3.0]
```

### 7. groupby

- Split by a key, apply a function, combine the result.
- agg takes several functions at once.
- The result is indexed by the group key.

```python
import pandas as pd
df = pd.DataFrame({'k': list('aab'), 'v': [1, 2, 3]})
print(df.groupby('k')['v'].sum().to_dict())
```

Output:

```text
{'a': 3, 'b': 3}
```

### 8. merge

- Join two tables on a shared key.
- how='left' keeps every row from the left table.
- Check row counts before and after.

### 9. A pipeline

- Read, clean, reshape, aggregate, export.
- Each step returns a new DataFrame.
- Set bad rows aside instead of silently dropping them.

### 10. pandas 3.0 notes

- Copy-on-Write is the default behaviour in pandas 3.0.
- That removes most chained-assignment surprises.
- This lab runs pandas 3.0.2 in the browser.

## Python in the browser with Pyodide (Intermediate)

How this lab runs real CPython as WebAssembly, and what that can and cannot do.

### 1. What Pyodide is

- A port of CPython to WebAssembly.
- It runs in your browser tab, with no server.
- This lab ships Pyodide 314.0.7 with CPython 3.14.2.

### 2. Why it is private

- Your code runs on your device.
- The lab does not send it anywhere.
- Close the tab and it is gone unless you saved it.

### 3. Loading takes a moment

- The runtime is several megabytes, fetched from this site.
- NumPy and pandas wheels load only when a lesson needs them.
- The first run is the slowest; the browser caches files after.

### 4. The JS and Python bridge

- Values cross between JavaScript and Python through conversions and proxies.
- Numbers and strings copy; objects can be proxied.
- The lab runner uses this to show output and run checks.

### 5. A virtual file system

- Python sees an in-memory file system.
- Files you write live in memory only.
- Use the Downloads page for files to keep.

```python
from pathlib import Path
Path('note.txt').write_text('hi')
print(Path('note.txt').read_text())
```

Output:

```text
hi
```

### 6. What does not work

- No raw sockets, so the public internet is out of reach.
- No subprocess for launching other programs.
- Threads are limited in the browser build.

### 7. Packages

- Pure-Python wheels can be loaded from a lock file or package index.
- Packages with C code need a WebAssembly build.
- NumPy and pandas are vendored here, plus dateutil, pytz, and six.

```python
import numpy, pandas
print(numpy.__version__, pandas.__version__)
```

Output:

```text
2.4.6 3.0.2
```

### 8. Same language, different host

- The standard language behaves the same.
- The host decides what the outside world looks like.
- Check sys.platform to see it: it reports emscripten.

```python
import sys
print(sys.platform)
```

Output:

```text
emscripten
```

### 9. Try it

- Open the practice desk and run a few lines.
- Each lesson has an exercise with checks.
- Errors show a traceback just like at home.

## Lifetime learning with Python (Lifelong)

A study loop, honest notes on certifications and licenses, projects, and finding official answers.

### 1. Learning is a loop

- Pick a small goal, read, run, check, then explain it back.
- Short sessions repeated often beat rare marathons.
- Keep a notes file in your own words.

### 2. Levels, not labels

- Fundamentals: syntax, types, functions.
- Intermediate: modules, testing, data, web.
- Advanced: concurrency, packaging, performance.

### 3. Projects teach the gaps

- Finish something small: a CLI, a scraper of your own files, a game.
- Add tests to one project.
- Write a README so you could pick it up in a year.

### 4. Certifications, honestly

- The Python Institute offers PCEP, PCAP, and PCPP tracks.
- Fees and exam content change, so check the official page.
- This site awards none and makes no claim that a certificate leads to a job or pay.

### 5. Licenses in one slide

- MIT and BSD: permissive, keep the notice.
- Apache 2.0: permissive with a patent grant.
- GPL: copyleft, shared-alike for distributed derivatives. Read the text and ask a professional for real decisions.

### 6. Read the official docs

- docs.python.org has the tutorial, reference, and library docs.
- PEPs explain why a feature exists.
- The Sources page of this lab links the pages behind every claim.

### 7. When you are stuck

- Reduce the problem to the smallest code that fails.
- Read the last line of the traceback first.
- Search the docs, then ask with your small example.

### 8. Share what you learn

- Teaching reinforces learning.
- Write a short post or give a short talk.
- Credit your sources and respect licenses.

