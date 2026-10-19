/* Core language lessons that the older catalog skipped.
   Each sample.output was checked on the lab's Pyodide runtime (see tests/nav-b.spec.js).
   Snippets marked "not run" in the prose were not executed here. */
import { codeBlock } from "../util.js";

const sampleNote = "Run on this lab's Pyodide build (CPython 3.14.2).";

export const coreByTrack = {
  fundamentals: [
    {
      id: "strings",
      title: "f-strings and string methods",
      level: "Beginner",
      minutes: 2,
      summary: "Build text with f-strings, then clean it with methods that return a new string.",
      learn: [
        "Write an f-string that inserts names and numbers",
        "Use strip, split, upper, and replace without changing the original",
        "Format a number with a width so columns line up",
      ],
      diagram: `flowchart LR
  A[name and number] --> B["f-string"]
  B --> C[new str]
  C --> D[strip or split]
  D --> E[another new str]`,
      diagramCaption: "Every string method returns a new string. The original stays as it was.",
      sources: ["pep-498", "stdtypes", "io"],
      mistake: "Writing name.upper() and then printing name. The method does not edit name. You have to use the value it returns, or bind that value to a name.",
      sample: {
        note: sampleNote,
        code: `name = "Ada"\nn = 3\nprint(f"{name} has {n} snakes")\nprint(f"{n:02d}")\nprint("  py  ".strip().upper())\nprint("a,b,c".split(","))\n`,
        output: "Ada has 3 snakes\n03\nPY\n['a', 'b', 'c']\n",
      },
      sections: [
        {
          heading: "An f-string is a string with holes",
          html: `<p>An f-string starts with the letter f before the quote. Inside the quotes, braces hold an expression. Python evaluates the expression and turns the result into text. The rest of the quotes is ordinary text. <code>f"{name} has {n} snakes"</code> is a short way to write the same text you would build with plus signs, and it stays readable when the sentence grows.</p>
          <p>The expression in the braces can be a name, a sum, or a call. <code>f"{2 + 2}"</code> is the text 4. You can also write a conversion. <code>!r</code> uses the repr of the value, which is useful when you want quotes around a string in a log line. <code>!s</code> is the normal conversion, and it is the default.</p>
          <p>A format spec sits after a colon. <code>f"{n:02d}"</code> means a decimal integer, at least two characters wide, padded with zeros. <code>f"{price:.2f}"</code> means a floating-point number with two digits after the dot. These specs are the same ones format and str.format use. PEP 498 is the design note for f-strings. The tutorial's input and output chapter shows the format mini-language.</p>
          <p>f-strings do not call your code twice in a surprising way, but they do evaluate the expression once, immediately. Do not put a call with a side effect in the braces unless you want that effect every time the f-string runs. If you need the template itself, not the filled text, you are looking at a different tool. Python 3.14 added t-strings for that job. This lesson stays with f-strings, which every current Python has.</p>`,
        },
        {
          heading: "Methods return a new string",
          html: `<p>A str is immutable. strip removes whitespace from both ends and returns a new string. upper and lower change case and return a new string. replace swaps a piece for another piece. split breaks the string on a separator and returns a list. None of these methods change the string you started with. If you ignore the return value, it looks as if the method did nothing.</p>
          <p>Chaining works because each method returns a string. <code>"  py  ".strip().upper()</code> strips first, then uppercases the result. The order matters. upper then strip is the same here, because spaces have no case, but replace then split is not the same as split then replace.</p>
          <p>join is the method you want when you have a list and you want one string. It is called on the separator, not on the list: <code>", ".join(parts)</code>. The parts must already be strings. If they are numbers, convert them first, or use an f-string inside a comprehension.</p>
          <p>startswith, endswith, and in are the checks you use before you slice. Slicing still works, and it never raises for a wild index the way a list lookup can. <code>word[:3]</code> is safe even when word is short. It returns what is there.</p>
          ${codeBlock(`name = "Ada"\nn = 3\nprint(f"{name} has {n} snakes")\nprint(f"{n:02d}")\nprint("  py  ".strip().upper())\nprint("a,b,c".split(","))\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write label(name, n) that returns an f-string like 'Ada has 3 snakes', with the name stripped of extra spaces.",
        starter: "def label(name, n):\n    return \"\"\n",
        checks: ["assert label(' Ada ', 3) == 'Ada has 3 snakes'", "assert label('py', 1) == 'py has 1 snakes'"],
      },
      check: [
        {
          prompt: "What does s.upper() do to s?",
          choices: ["It changes s into uppercase", "It returns a new uppercase string and leaves s as it was", "It returns None"],
          answer: 1,
          why: "Strings cannot be edited in place. upper returns a new string.",
        },
        {
          prompt: "Which line is an f-string?",
          choices: ["'hello {name}'", "f'hello {name}'", "r'hello {name}'"],
          answer: 1,
          why: "The f prefix is what turns braces into expressions. A raw string, with r, does not.",
        },
      ],
    },
    {
      id: "comprehensions",
      title: "Comprehensions",
      level: "Beginner",
      minutes: 2,
      summary: "Build a list, a dict, or a set in one expression that reads left to right.",
      learn: [
        "Write a list comprehension with a filter",
        "Build a dict that maps a key to a computed value",
        "Choose a loop when the comprehension no longer fits on one line",
      ],
      diagram: `flowchart LR
  A[items] --> B{keep this one?}
  B -->|yes| C[transform]
  B -->|no| D[skip]
  C --> E[new list]`,
      diagramCaption: "A comprehension walks the source, keeps some items, and builds a new collection.",
      sources: ["comprehensions-doc", "stdtypes"],
      mistake: "Using a list comprehension for a side effect, such as appending to another list or printing. If you do not need the new list, write a for loop. A comprehension that throws the result away is harder to read.",
      sample: {
        note: sampleNote,
        code: `nums = [1, 2, 3, 4]\nprint([n * n for n in nums if n % 2 == 0])\nprint({n: n * n for n in nums})\nprint(sorted({len(w) for w in ["py", "lab", "py"]}))\n`,
        output: "[4, 16]\n{1: 1, 2: 4, 3: 9, 4: 16}\n[2, 3]\n",
      },
      sections: [
        {
          heading: "One expression, one new collection",
          html: `<p>A list comprehension is a for loop that builds a list. <code>[n * n for n in nums if n % 2 == 0]</code> reads as: for each n in nums, if n is even, put n squared in the new list. The filter is optional. Without the if, every item is transformed.</p>
          <p>The same shape works for a set and for a dict. A set comprehension uses braces and one expression. A dict comprehension uses braces and a key, a colon, and a value. <code>{n: n * n for n in nums}</code> maps each number to its square. Duplicate keys keep the last value, the same way a normal dict does.</p>
          <p>The names you bind in the comprehension stay local to it, in current Python. Do not rely on n existing after the line. That used to leak in very old Python, and people still remember the surprise. Write the name again outside if you need it.</p>
          <p>A comprehension can nest. <code>[c for row in rows for c in row]</code> flattens a list of lists. Read it from the left for, which is the outer loop. Nested comprehensions get hard to read quickly. Two fors is a reasonable limit. After that, a plain loop with a name for the result is kinder.</p>`,
        },
        {
          heading: "When a loop is clearer",
          html: `<p>Use a comprehension when the whole idea is "build this collection". Use a loop when you are counting, stopping early, or handling an error per item. A comprehension that needs try inside it is usually past the point of being clear. You can write a small function and call it from the comprehension if the condition has a name worth keeping.</p>
          <p>Generator expressions use parentheses instead of brackets: <code>sum(n * n for n in nums)</code>. They do not build the whole list. That matters when the source is huge. The lesson on iterators explains yield. A generator expression is the short form of a generator that only yields one expression.</p>
          <p>Do not mutate the list you are walking. Building a new list is the point. If you delete from nums while a comprehension reads it, the result is hard to predict. Filter into a new list instead.</p>
          ${codeBlock(`nums = [1, 2, 3, 4]\nprint([n * n for n in nums if n % 2 == 0])\nprint({n: n * n for n in nums})\nprint(sorted({len(w) for w in ["py", "lab", "py"]}))\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write evens(nums) that returns a new list of the even numbers, in the same order, using a comprehension.",
        starter: "def evens(nums):\n    return []\n",
        checks: ["assert evens([1, 2, 3, 4]) == [2, 4]", "assert evens([1, 3]) == []"],
      },
      check: [
        {
          prompt: "A dict comprehension uses which punctuation between key and value?",
          choices: ["A comma", "A colon", "A semicolon"],
          answer: 1,
          why: "It looks like a dict display: {key: value for ...}.",
        },
        {
          prompt: "What does the if clause in a comprehension do?",
          choices: ["It changes the type of the result", "It skips items that fail the test", "It sorts the result"],
          answer: 1,
          why: "The if is a filter. Sorting is a separate call to sorted.",
        },
      ],
    },
    {
      id: "lambdas",
      title: "lambda, sorted, and functools",
      level: "Intermediate",
      minutes: 2,
      summary: "A lambda is a one-expression function. sorted and partial are where you will actually use one.",
      learn: [
        "Pass a key function to sorted",
        "Write a one-line lambda when a def would be noise",
        "Use functools.partial to fill in the first arguments",
      ],
      diagram: `flowchart TD
  A[names] --> B["sorted(key=str.lower)"]
  B --> C[new list]
  D[def add] --> E["partial(add, 10)"]
  E --> F[plus10]`,
      diagramCaption: "sorted builds a new list. partial builds a new function with some arguments already filled.",
      sources: ["functions-doc", "sorting-howto", "functools"],
      mistake: "Assigning a lambda to a name and then stacking logic inside it. If the function has a name worth keeping, use def. A def can have a docstring, a clear traceback, and more than one line.",
      sample: {
        note: sampleNote,
        code: `from functools import partial\nnames = ["bob", "Ada", "bea"]\nprint(sorted(names, key=str.lower))\nshout = lambda word: word.upper() + "!"\nprint(shout("py"))\ndef add(a, b):\n    return a + b\nplus10 = partial(add, 10)\nprint(plus10(5))\n`,
        output: "['Ada', 'bea', 'bob']\nPY!\n15\n",
      },
      sections: [
        {
          heading: "lambda is a small function",
          html: `<p>lambda makes a function that returns one expression. It has no name unless you bind it, and it cannot contain statements. No assignment, no while, no try. <code>lambda word: word.upper() + "!"</code> is the same shape as a def that returns that expression. The tutorial introduces lambda next to def, and then tells you to prefer def when the function is part of the program's vocabulary.</p>
          <p>The place a lambda earns its keep is as an argument. sorted, min, and max take a key function. The key is called on each item, and the results are compared. The original items stay in the result. <code>sorted(names, key=str.lower)</code> sorts without caring about case. str.lower is already a function, so you do not need a lambda there. A lambda shows up when the key is a field: <code>key=lambda row: row["score"]</code>.</p>
          <p>sorted always returns a new list. list.sort changes the list and returns None. If you write names = names.sort() you have just set names to None. That is a very common mistake, and the traceback is confusing because the failure happens on the next line.</p>`,
        },
        {
          heading: "partial fills in arguments",
          html: `<p>functools.partial builds a new callable with some arguments already supplied. <code>partial(add, 10)</code> returns a function that calls add(10, x) when you pass x. It is useful when an API wants a function of one argument and you have a function of two. The sorting HOW TO shows partial next to operator.itemgetter and operator.attrgetter, which are faster ways to pick a field when you do not need a calculation.</p>
          <p>functools also holds cache and lru_cache, which are decorators. The decorators lesson covers the @ form. You do not need them to use partial or sorted. Keep this lesson to three tools: lambda for a tiny function, sorted with a key, and partial when a function needs fewer arguments than it has.</p>
          ${codeBlock(`from functools import partial\nnames = ["bob", "Ada", "bea"]\nprint(sorted(names, key=str.lower))\nshout = lambda word: word.upper() + "!"\nprint(shout("py"))\ndef add(a, b):\n    return a + b\nplus10 = partial(add, 10)\nprint(plus10(5))\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write by_length(words) that returns a new list of the words sorted by length, shortest first. Equal lengths can stay in either order.",
        starter: "def by_length(words):\n    return list(words)\n",
        checks: ["assert by_length(['python', 'py', 'lab'])[0] == 'py'", "assert by_length(['a', 'bb']) == ['a', 'bb']"],
      },
      check: [
        {
          prompt: "sorted(names) compared with names.sort()",
          choices: ["Both return a new list", "sorted returns a new list; list.sort returns None", "Both return None"],
          answer: 1,
          why: "sorted is a built-in that returns a list. The list method sorts in place and returns None.",
        },
        {
          prompt: "A lambda can contain",
          choices: ["One expression", "A while loop", "A try statement"],
          answer: 0,
          why: "lambda is an expression. Statements belong in a def.",
        },
      ],
    },
    {
      id: "iterators",
      title: "Iterators and generators",
      level: "Intermediate",
      minutes: 2,
      summary: "An iterator hands out one item at a time. A generator is a function that uses yield to become an iterator.",
      learn: [
        "Tell an iterable from an iterator",
        "Write a generator with yield",
        "Use a generator when you do not want the whole list in memory",
      ],
      diagram: `flowchart LR
  A[iterable] -->|iter| B[iterator]
  B -->|next| C[item]
  B -->|next| D[item]
  B -->|StopIteration| E[done]`,
      diagramCaption: "iter starts an iterator. next pulls one item. StopIteration means there are no more.",
      sources: ["iterators-doc", "generators-doc", "itertools"],
      mistake: "Calling next on a list. A list is iterable, not an iterator. Call iter(items) first, or just write a for loop, which does that for you.",
      sample: {
        note: sampleNote,
        code: `def countdown(n):\n    while n:\n        yield n\n        n -= 1\nprint(list(countdown(3)))\nit = iter([10, 20])\nprint(next(it))\nprint(next(it))\n`,
        output: "[3, 2, 1]\n10\n20\n",
      },
      sections: [
        {
          heading: "for already uses the protocol",
          html: `<p>A for loop asks an object for an iterator, then asks that iterator for the next item until it stops. That is the whole protocol. An iterable has __iter__. An iterator has __next__ and usually returns itself from __iter__. A list is iterable. iter(items) returns a list iterator. next on that iterator returns one element.</p>
          <p>You rarely call next yourself. The for loop, the list constructor, and functions such as sum do it. It is worth seeing once, because the error "list object is not an iterator" means you skipped iter. The tutorial's iterator section is short and is the page to keep open.</p>
          <p>An iterator is single use. When it is exhausted, it stays exhausted. A list can build a fresh iterator every time you loop. That is why you can for-loop a list twice, and why you cannot for-loop a consumed iterator twice and expect the same items.</p>`,
        },
        {
          heading: "yield pauses a function",
          html: `<p>A function that contains yield is a generator function. Calling it does not run the body. It returns a generator object, which is an iterator. Each next runs the body until the next yield, hands that value out, and pauses. Local names stay alive between yields. When the function returns, the iterator ends.</p>
          <p>countdown in the example yields n, then n - 1, and so on, until n is zero. list() pulls every value into a list. If the sequence is long, you can loop the generator directly and never store the whole thing. That is the reason generators exist. They describe a stream.</p>
          <p>A generator expression is the one-line form: <code>(n * n for n in nums)</code>. itertools has building blocks such as chain, islice, and count for streams you do not want to write by hand. You do not need them on day one. yield and for are enough to read other people's code.</p>
          ${codeBlock(`def countdown(n):\n    while n:\n        yield n\n        n -= 1\nprint(list(countdown(3)))\nit = iter([10, 20])\nprint(next(it))\nprint(next(it))\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write positives(nums) as a generator that yields the numbers that are greater than zero, in order.",
        starter: "def positives(nums):\n    yield 0\n",
        checks: ["assert list(positives([-1, 2, 0, 4])) == [2, 4]", "assert list(positives([])) == []"],
      },
      check: [
        {
          prompt: "Calling a function that uses yield returns",
          choices: ["The first yielded value", "A generator object", "A list of every yield"],
          answer: 1,
          why: "The body runs later, when something asks the generator for the next value.",
        },
        {
          prompt: "Which line starts an iterator over a list?",
          choices: ["next(items)", "iter(items)", "items.yield()"],
          answer: 1,
          why: "iter asks an iterable for an iterator. next asks an iterator for a value.",
        },
      ],
    },
    {
      id: "decorators",
      title: "Decorators",
      level: "Intermediate",
      minutes: 2,
      summary: "A decorator is a function that takes a function and returns a function. The @ line is syntax for that call.",
      learn: [
        "Read @decorator as 'replace this function with decorator(function)'",
        "Write a wrapper that calls the original function",
        "Keep the original name with functools.wraps when you care about help text",
      ],
      diagram: `flowchart TD
  A["@twice"] --> B[twice receives add_one]
  B --> C[twice returns wrapped]
  C --> D[the name add_one now means wrapped]`,
      diagramCaption: "The @ line runs the decorator once, when the function is defined, not each time it is called.",
      sources: ["decorators-doc", "functools"],
      mistake: "Forgetting to return the inner function. A decorator that returns None makes the decorated name None, and the next call fails with a confusing error.",
      sample: {
        note: sampleNote,
        code: `def twice(fn):\n    def wrapped(x):\n        return fn(fn(x))\n    return wrapped\n\n@twice\ndef add_one(x):\n    return x + 1\n\nprint(add_one(3))\n`,
        output: "5\n",
      },
      sections: [
        {
          heading: "The @ line is a call",
          html: `<p>This definition:</p>
          <p><code>@twice</code> above <code>def add_one</code> means add_one = twice(add_one) after the def runs. twice receives the original function and must return the callable you want the name to hold. In the example, wrapped calls the original twice, so add_one(3) computes 3 + 1 + 1.</p>
          <p>The decorator runs at definition time. It does not run on every call, unless the wrapper you returned does something on every call. That split matters. Logging "defined" belongs in the decorator body. Logging "called" belongs in the wrapper.</p>
          <p>Decorators can stack. They apply from the bottom upward, closest to the def first. Two decorators are already a lot to read. If you stack more, give each one a name that says what it does.</p>`,
        },
        {
          heading: "Wraps, arguments, and functools",
          html: `<p>A wrapper hides the original function's name and docstring. functools.wraps copies those onto the wrapper. Use it when the function is part of a public module. For a one-off example, a bare wrapper is fine, and the sample below keeps it bare so the call is easy to see.</p>
          <p>If the original function takes any arguments, the wrapper usually takes *args and **kwargs and passes them on. The sample uses one argument because that is the whole idea. A decorator that needs its own argument, such as @repeat(3), is a function that returns a decorator. Read it from the inside: repeat(3) returns the real decorator, and that decorator receives the function.</p>
          <p>You have already used decorators if you have seen @dataclass or @contextmanager. They are the same mechanism, written by the standard library. The next two lessons open those two.</p>
          ${codeBlock(`def twice(fn):\n    def wrapped(x):\n        return fn(fn(x))\n    return wrapped\n\n@twice\ndef add_one(x):\n    return x + 1\n\nprint(add_one(3))\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write a decorator shout so that a function returning text returns that text in uppercase. Apply it with @shout to greet(name), which returns 'hi ' plus the name.",
        starter: "def shout(fn):\n    def wrapped(name):\n        return fn(name)\n    return wrapped\n\n@shout\ndef greet(name):\n    return \"hi \" + name\n",
        checks: ["assert greet('ada') == 'HI ADA'"],
      },
      check: [
        {
          prompt: "When does the decorator function itself run?",
          choices: ["Every time the decorated function is called", "Once, when the decorated function is defined", "Only if you call it by name later"],
          answer: 1,
          why: "The @ line is an assignment that happens while the def statement runs.",
        },
        {
          prompt: "A decorator should return",
          choices: ["None", "A callable", "The original source code as a string"],
          answer: 1,
          why: "The name of the function is rebound to whatever the decorator returns.",
        },
      ],
    },
    {
      id: "with-blocks",
      title: "Context managers and with",
      level: "Intermediate",
      minutes: 2,
      summary: "with runs setup and cleanup around a block, including when the block raises.",
      learn: [
        "Open a file with with so it closes",
        "Read a with block as enter, body, exit",
        "Write a small context manager with contextlib.contextmanager",
      ],
      diagram: `flowchart TD
  A[enter] --> B[body]
  B --> C[exit]
  B -->|error| C`,
      diagramCaption: "Exit runs when the block finishes, and also when the block raises.",
      sources: ["compound", "contextlib", "io"],
      mistake: "Opening a file, then returning from the function before close. A with block closes the file on the way out, including on return and on an exception.",
      sample: {
        note: sampleNote,
        code: `from contextlib import contextmanager\n\n@contextmanager\ndef fence(label):\n    print("open", label)\n    yield label\n    print("close", label)\n\nwith fence("lab") as name:\n    print("inside", name)\n`,
        output: "open lab\ninside lab\nclose lab\n",
      },
      sections: [
        {
          heading: "Enter and exit",
          html: `<p>A with statement calls __enter__ before the block and __exit__ after it. The file object is the context manager you already know. open returns it, __enter__ returns the file, and __exit__ closes it. You write:</p>
          <p><code>with open(path, encoding="utf-8") as handle:</code> and then use handle inside the block. When the block ends, the file is closed. You do not write close on the success path and again on the error path.</p>
          <p>The name after as is whatever __enter__ returns. For a file, that is the file. For some managers, __enter__ returns self. For others, it returns a different helper. Read the library's example before you guess.</p>
          <p>__exit__ receives the exception if the block raised. If it returns a true value, the exception is swallowed. Almost no manager should do that. Let the error propagate, after cleanup. The compound statements reference writes the full rule.</p>`,
        },
        {
          heading: "A generator can be a manager",
          html: `<p>contextlib.contextmanager turns a generator into a context manager. Code before yield is enter. The yielded value is the as target. Code after yield is exit. The sample prints open, then the body, then close. If the body raised, close would still run, because the decorator wraps the yield in a try.</p>
          <p>Use this form for a small, local manager. A class with __enter__ and __exit__ is better when the manager holds several methods. Do not reach for a class on the first day.</p>
          <p>This browser runtime can open files in its own virtual folder. The exercise below does not touch the disk. It asks you to write the generator form, which is pure Python.</p>
          ${codeBlock(`from contextlib import contextmanager\n\n@contextmanager\ndef fence(label):\n    print("open", label)\n    yield label\n    print("close", label)\n\nwith fence("lab") as name:\n    print("inside", name)\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write a context manager logged(label) with contextmanager. It yields the label. The checks only look at the yielded value, not at printing.",
        starter: "from contextlib import contextmanager\n\n@contextmanager\ndef logged(label):\n    yield None\n",
        checks: ["with logged('lab') as name:\n    assert name == 'lab'"],
      },
      check: [
        {
          prompt: "When does the cleanup of a with block run?",
          choices: ["Only if the block succeeds", "After the block, including when it raises", "Only if you call close"],
          answer: 1,
          why: "Exit is the point of with. It runs on the way out.",
        },
        {
          prompt: "In a @contextmanager function, the value after as is",
          choices: ["Whatever you yield", "Always None", "The generator function itself"],
          answer: 0,
          why: "yield supplies the value bound by as.",
        },
      ],
    },
    {
      id: "inheritance",
      title: "Inheritance, super, and dataclasses",
      level: "Intermediate",
      minutes: 2,
      summary: "A subclass reuses a class and can override a method. super() calls the version you overrode. A dataclass writes the boring methods for you.",
      learn: [
        "Override a method and call the parent with super()",
        "Know that method resolution follows the class list",
        "Use a dataclass when the class is mostly fields",
      ],
      diagram: `flowchart TD
  A[Animal.sound] --> B[Dog.sound]
  B -->|super| A
  C[fields] --> D["@dataclass"]
  D --> E[init eq repr]`,
      diagramCaption: "super() finds the next sound method. dataclass writes __init__, __eq__, and __repr__ from the fields.",
      sources: ["super-doc", "classes", "dataclasses"],
      mistake: "Calling Animal.sound(self) from Dog when you meant super(). Naming the parent class skips the method resolution order. That breaks once a second parent exists. super() follows the order for you.",
      sample: {
        note: sampleNote,
        code: `from dataclasses import dataclass\n\nclass Animal:\n    def sound(self):\n        return "..."\n\nclass Dog(Animal):\n    def sound(self):\n        return super().sound() + " woof"\n\n@dataclass(frozen=True)\nclass Point:\n    x: int\n    y: int\n\nprint(Dog().sound())\nprint(Point(2, 5))\n`,
        output: "... woof\nPoint(x=2, y=5)\n",
      },
      sections: [
        {
          heading: "A subclass is a new class",
          html: `<p>class Dog(Animal) means Dog's instances also look through Animal for attributes they do not define. Dog.sound replaces Animal.sound for Dog instances. The parent method is still there. super().sound() finds it, following the method resolution order, and calls it with the same instance.</p>
          <p>You do not pass self to super().sound(). super() already knows the instance. Inside the method, self is the Dog, even while Animal.sound runs. That is why a parent method can see attributes the child set.</p>
          <p>Inheritance is a tool for a real "is a" relationship, not for sharing three lines of code. If two classes only share a helper, a function is simpler. The classes tutorial spends its inheritance section on this, and it is the page to re-read when a hierarchy feels heavy.</p>`,
        },
        {
          heading: "A dataclass is a class with fields",
          html: `<p>@dataclass reads the class annotations and writes __init__, __repr__, and __eq__. Point(2, 5) prints as Point(x=2, y=5) because of that generated repr. frozen=True makes assignment to the fields fail after creation, which is what you want for a small value object.</p>
          <p>A dataclass can have methods, and it can inherit. Start without inheritance. Add a method when a behavior belongs to the value. You can still write a normal class when you need a custom __init__. The dataclass module does not replace learning __init__. It removes the copy-paste when the class is a bundle of fields.</p>
          <p>Type annotations on the fields are stored, not enforced, at runtime. Point("a", "b") still constructs unless you add a check. The typing lessons cover checkers. This lesson only needs the generated methods.</p>
          ${codeBlock(`from dataclasses import dataclass\n\nclass Animal:\n    def sound(self):\n        return "..."\n\nclass Dog(Animal):\n    def sound(self):\n        return super().sound() + " woof"\n\n@dataclass(frozen=True)\nclass Point:\n    x: int\n    y: int\n\nprint(Dog().sound())\nprint(Point(2, 5))\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write class Bird(Animal) with sound() returning the parent sound plus ' tweet'. Use the Animal from the lesson idea: sound returns '...'. Define Animal in your code too.",
        starter: "class Animal:\n    def sound(self):\n        return \"...\"\n\nclass Bird(Animal):\n    def sound(self):\n        return \"\"\n",
        checks: ["assert Bird().sound() == '... tweet'"],
      },
      check: [
        {
          prompt: "super().sound() is preferred over Animal.sound(self) because",
          choices: ["It is shorter only", "It follows the method resolution order", "It skips the parent"],
          answer: 1,
          why: "super() finds the next class in the order. Naming Animal locks you to that class.",
        },
        {
          prompt: "A frozen dataclass stops you from",
          choices: ["Calling methods", "Assigning to fields after creation", "Printing the value"],
          answer: 1,
          why: "frozen=True makes field assignment raise. Methods and repr still work.",
        },
      ],
    },
  ],
  stdlib: [
    {
      id: "regular-expressions",
      title: "Regular expressions, the basics",
      level: "Intermediate",
      minutes: 2,
      summary: "The re module finds and replaces text by a pattern. Most jobs still want a string method first.",
      learn: [
        "Reach for str methods before re",
        "Use findall and sub for the common jobs",
        "Raw strings keep backslashes for the pattern",
      ],
      diagram: `flowchart LR
  A[text] --> B{plain method enough?}
  B -->|yes| C[split or replace]
  B -->|no| D[re pattern]
  D --> E[findall or sub]`,
      diagramCaption: "Try a string method. Use re when the shape of the text is a pattern, not a fixed piece.",
      sources: ["re", "stdtypes"],
      mistake: "Writing a pattern in a normal string and losing a backslash. r\"\\d+\" is a raw string, so the pattern engine sees \\d. Without the r, you have to escape the backslash twice.",
      sample: {
        note: sampleNote,
        code: `import re\ntext = "Room 12, desk 3"\nprint(re.findall(r"\\d+", text))\nprint(re.sub(r"\\d+", "#", text))\n`,
        output: "['12', '3']\nRoom #, desk #\n",
      },
      sections: [
        {
          heading: "Patterns, not a second language you must use",
          html: `<p>A regular expression describes a set of strings. \\d means a digit. + means one or more of the previous piece. findall returns every non-overlapping match as a list of strings, when the pattern has no groups. sub replaces each match. The re HOWTO and the library page list the rest of the syntax. You need a small subset to read most Python.</p>
          <p>If the text you want is a fixed word, use in, split, or replace. They are faster to read and harder to get wrong. Reach for re when the text has a shape: a number, a date, a repeated separator. Compiling with re.compile is worth it when you use the same pattern in a loop. For one search, the module-level functions compile and cache for you.</p>
          <p>Groups go in parentheses. findall's return shape changes when you add groups. With one group, you get a list of those group strings. With several groups, you get a list of tuples. That surprise is the usual bug. If you only wanted the whole match, do not add groups, or use (?:...) for a group that should not be captured.</p>`,
        },
        {
          heading: "Raw strings and the edges",
          html: `<p>Patterns are full of backslashes. A raw string, prefix r, tells Python not to treat \\n as a newline. The pattern engine still sees \\d. Always write patterns as raw strings unless you have a reason not to.</p>
          <p>search finds the first match anywhere. match looks only at the start. fullmatch looks at the whole string. People write match and then wonder why a digit in the middle was missed. Use search unless you mean the start.</p>
          <p>This lesson does not cover look-ahead or named groups. They exist, and the re page explains them. Learn them when a pattern you must read already uses them. The sample is the whole daily toolkit: find the numbers, replace the numbers.</p>
          ${codeBlock(`import re\ntext = "Room 12, desk 3"\nprint(re.findall(r"\\d+", text))\nprint(re.sub(r"\\d+", "#", text))\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write numbers(text) that returns the list of digit runs in text, using re.findall.",
        starter: "import re\n\ndef numbers(text):\n    return []\n",
        checks: ["assert numbers('Room 12, desk 3') == ['12', '3']", "assert numbers('none') == []"],
      },
      check: [
        {
          prompt: "Why prefix a pattern with r?",
          choices: ["It makes the search faster", "It keeps backslashes for the pattern engine", "It ignores case"],
          answer: 1,
          why: "A raw string does not eat backslashes as Python escapes.",
        },
        {
          prompt: "findall with no groups returns",
          choices: ["A list of matching strings", "A single Match object", "The count of matches"],
          answer: 0,
          why: "findall returns the matches. search returns one Match or None.",
        },
      ],
    },
    {
      id: "logging-well",
      title: "Logging properly",
      level: "Intermediate",
      minutes: 2,
      summary: "logging is for messages you leave in a program. Configure it once, and use levels instead of print.",
      learn: [
        "Get a logger named for the module",
        "Pick debug, info, warning, or error on purpose",
        "Configure the format once at the edge of the program",
      ],
      diagram: `flowchart TD
  A[your module] --> B["getLogger(__name__)"]
  B --> C[level]
  C --> D[handler]
  D --> E[stderr or a file]`,
      diagramCaption: "Libraries log to a named logger. The application attaches a handler once.",
      sources: ["logging", "logging-howto"],
      mistake: "Calling basicConfig in a library module. The application that imports you should choose the format and the destination. A library only asks for a logger and emits records.",
      sample: {
        note: sampleNote,
        code: `import logging\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s", force=True)\nlog = logging.getLogger("lesson")\nlog.info("server ready")\n`,
        output: "INFO server ready\n",
      },
      sections: [
        {
          heading: "Levels are a filter",
          html: `<p>A log record has a level. debug is for the author who is tracing a bug. info is for a normal event, such as a server starting. warning means something odd that the program survived. error means an operation failed. critical means the process may stop. The logger drops records below its level. That is why you can leave debug calls in the code and not see them in production.</p>
          <p>Get the logger with logging.getLogger(__name__). The name follows the module, so a config can turn one package up or down. Do not use the root logger from deep inside a library. The Logging HOWTO draws the picture: loggers, handlers, and formatters are three separate objects.</p>
          <p>print is still right for a script whose whole job is to write a result to stdout. logging is right when the message is about the run, not the result. Mixing them makes it hard to redirect one and not the other.</p>`,
        },
        {
          heading: "Configure once",
          html: `<p>basicConfig sets a handler on the root logger. Call it once, from the program's entry point, before you emit. force=True, added in Python 3.8, replaces an earlier config. That is what the sample uses, so a second run in the same process still prints the line you expect. In a real program you configure once and you do not pass force.</p>
          <p>Pass arguments as extra fields, not by building the sentence with percent signs yourself if you can avoid a format that always runs. The lazy form log.info("ready on port %s", port) formats only if the record is emitted. An f-string formats even when the level is filtered out. For a cheap message it does not matter. For a message that builds a big repr, the lazy form is the one the HOWTO shows.</p>
          <p>The sample prints to stderr, which this lab's runner captures with stdout. You will see INFO server ready under the example. No file is written.</p>
          ${codeBlock(`import logging\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s", force=True)\nlog = logging.getLogger("lesson")\nlog.info("server ready")\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write banner(log, name) that calls log.info with the message 'ready ' plus the name. Return the message string as well, so the check can see it without reading stderr.",
        starter: "def banner(log, name):\n    message = \"ready \" + name\n    return message\n",
        checks: ["class L:\n    def __init__(self):\n        self.lines = []\n    def info(self, message):\n        self.lines.append(message)\nlog = L()\nassert banner(log, 'lab') == 'ready lab'\nassert log.lines == ['ready lab']"],
      },
      check: [
        {
          prompt: "Who should call basicConfig?",
          choices: ["Every library module", "The program's entry point, once", "Each function that logs"],
          answer: 1,
          why: "The application chooses the format. Libraries only emit records.",
        },
        {
          prompt: "A debug record is hidden when",
          choices: ["The logger's level is INFO or higher", "The message contains a comma", "You used getLogger"],
          answer: 0,
          why: "Records below the logger's level are dropped.",
        },
      ],
    },
    {
      id: "tracebacks",
      title: "Tracebacks and debugging",
      level: "Intermediate",
      minutes: 2,
      summary: "Read a traceback from the bottom. Use breakpoint when you are at a terminal. This page cannot sit inside pdb.",
      learn: [
        "Read the last line of a traceback as the error type and message",
        "Walk upward to the line in your file",
        "Know what breakpoint() does, and why this lab does not run it",
      ],
      diagram: `flowchart BT
  A[error type and message] --> B[your line]
  B --> C[the caller]
  C --> D[the caller above]`,
      diagramCaption: "The last line is the exception. The lines above it are the calls that led there, closest first.",
      sources: ["traceback", "pdb", "errors"],
      mistake: "Fixing the top of the traceback first. The top is usually a library or the runner. Your line is the first frame that sits in a file you wrote.",
      sample: {
        note: sampleNote,
        code: `def parse_age(text):\n    return int(text)\n\ntry:\n    parse_age("ten")\nexcept ValueError as exc:\n    print(type(exc).__name__)\n    print(exc)\n`,
        output: "ValueError\ninvalid literal for int() with base 10: 'ten'\n",
      },
      sections: [
        {
          heading: "Read from the bottom",
          html: `<p>A traceback is a stack. The last line names the exception and its message. The block above it shows the file and the line that raised. The blocks above that are the callers, with the oldest call at the top. Start at the bottom. Ask what the message claims. Then find the first frame that is your code.</p>
          <p>ValueError from int("ten") says the literal is invalid. The message includes the bad text. TypeError often says an argument has the wrong type, or that None was used as a number. AttributeError means the object does not have that name. NameError means the name was never bound. The errors lesson covers the statements. This lesson is about reading the printout.</p>
          <p>The traceback module can format the current exception as a string. You use that when a long-running program should log the stack and keep going. For a script, letting the exception print itself is enough. Catch an exception only when you can do something useful, such as the sample, which prints the type and the message so the page can show a stable result.</p>`,
        },
        {
          heading: "breakpoint is not run here",
          html: `<p>breakpoint() calls pdb.set_trace() unless PYTHONBREAKPOINT says otherwise. pdb stops the process and waits for commands such as n for next and p for print. That is the right tool on your machine, in a terminal. It is not run in this lab. A page cannot type into pdb, and a stopped runtime would look frozen. The snippet below is marked not run.</p>
          <p>Not run:</p>
          <pre><code translate="no">def parse_age(text):
    breakpoint()
    return int(text)</code></pre>
          <p>On your own computer, run that file in a terminal, then use pdb's help. The pdb documentation lists the commands. When you are done learning the shape of the bug, take the breakpoint out. A leftover breakpoint in a program that other people run will stop their process.</p>
          <p>If you cannot reproduce a bug under pdb, log the inputs that reached the function. A good log line plus the traceback is often enough. The logging lesson is the partner of this one.</p>
          ${codeBlock(`def parse_age(text):\n    return int(text)\n\ntry:\n    parse_age("ten")\nexcept ValueError as exc:\n    print(type(exc).__name__)\n    print(exc)\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write safe_int(text) that returns the int, or None if text is not a base-10 integer. Do not let ValueError escape.",
        starter: "def safe_int(text):\n    return int(text)\n",
        checks: ["assert safe_int('12') == 12", "assert safe_int('ten') is None"],
      },
      check: [
        {
          prompt: "The last line of a traceback is",
          choices: ["The oldest caller", "The exception type and message", "Always your filename"],
          answer: 1,
          why: "Read the bottom line for what failed, then walk up to your frame.",
        },
        {
          prompt: "Why is breakpoint() not run in this lab?",
          choices: ["pdb is not part of Python", "It waits for a person at a console, which a page cannot do", "It only works on numbers"],
          answer: 1,
          why: "pdb stops and reads commands. The lesson marks that snippet as not run.",
        },
      ],
    },
  ],
  async: [
    {
      id: "when-which",
      title: "Threads, processes, or asyncio",
      level: "Intermediate",
      minutes: 2,
      summary: "Pick the tool that matches the wait. asyncio for waiting, threads for blocking calls, processes for CPU work.",
      learn: [
        "Choose asyncio when the program is waiting on I/O",
        "Choose a thread for a library that blocks and will not await",
        "Choose a process when the work needs another CPU core",
      ],
      diagram: `flowchart TD
  A[what is the program doing?] --> B[waiting on I/O]
  A --> C[blocked in a library]
  A --> D[burning CPU]
  B --> E[asyncio]
  C --> F[thread]
  D --> G[process]`,
      diagramCaption: "The job picks the tool. Mixing them without a reason makes the program harder to explain.",
      sources: ["asyncio-docs", "threading", "multiprocessing"],
      mistake: "Marking a CPU loop async and expecting it to use more cores. await only helps when the function actually pauses. A tight loop does not pause.",
      sample: {
        note: sampleNote,
        code: `kinds = {\n    "waiting on the network": "asyncio",\n    "a blocking library": "a thread",\n    "heavy CPU work": "a process",\n}\nfor job, tool in kinds.items():\n    print(f"{job}: {tool}")\n`,
        output: "waiting on the network: asyncio\na blocking library: a thread\nheavy CPU work: a process\n",
      },
      sections: [
        {
          heading: "Three different costs",
          html: `<p>asyncio runs many coroutines on one thread. When a coroutine awaits a socket or a timer, the loop can run another coroutine. The async lesson in this track covers the syntax. Use asyncio when you control the code that waits, and that code is written with async libraries.</p>
          <p>A thread runs a function beside other threads in the same process. They share memory. In the usual CPython build, the GIL means only one thread runs Python bytecode at a time. Threads still help when the wait is inside a library that releases the GIL, such as many file and network calls that are not async. They do not speed up a pure Python number crunch.</p>
          <p>A process has its own memory and its own GIL. multiprocessing and ProcessPoolExecutor start processes and send data across a boundary. That costs copies. Use it when the work is heavy and can be split into chunks that do not need to share objects. The multiprocessing page is honest about start methods and about how pickling carries the arguments.</p>`,
        },
        {
          heading: "What this page can run",
          html: `<p>This browser runtime is one page, one interpreter, and it is not a place to spawn operating-system processes. The sample does not start a thread or a process. It prints the choice, so you can see the rule. A thread example and a process example are marked not run.</p>
          <p>Not run:</p>
          <pre><code translate="no">from threading import Thread
def work():
    print("in a thread")
Thread(target=work).start()</code></pre>
          <p>Not run:</p>
          <pre><code translate="no">from multiprocessing import Process
def work():
    print("in a process")
if __name__ == "__main__":
    Process(target=work).start()</code></pre>
          <p>On your own computer those snippets start real workers. Here they would be a bad demo, because the page's process model is not a desktop Python. The decision table is the part you can check. If the program is waiting, start with asyncio. If a library blocks and has no async version, a thread is the usual adapter. If the fan of the laptop is the problem, look at processes, or at a faster algorithm, before you look at threads.</p>
          ${codeBlock(`kinds = {\n    "waiting on the network": "asyncio",\n    "a blocking library": "a thread",\n    "heavy CPU work": "a process",\n}\nfor job, tool in kinds.items():\n    print(f"{job}: {tool}")\n`)}`,
        },
      ],
      exercise: {
        prompt: "Write choose(kind) that returns 'asyncio' for 'io', 'thread' for 'block', and 'process' for 'cpu'. Return 'unsure' for anything else.",
        starter: "def choose(kind):\n    return \"unsure\"\n",
        checks: ["assert choose('io') == 'asyncio'", "assert choose('block') == 'thread'", "assert choose('cpu') == 'process'", "assert choose('other') == 'unsure'"],
      },
      check: [
        {
          prompt: "asyncio speeds up which kind of work?",
          choices: ["Waiting on I/O that can pause", "Any loop, because async means parallel", "Only graphical interfaces"],
          answer: 0,
          why: "The loop switches at await. A CPU loop that never awaits still blocks the thread.",
        },
        {
          prompt: "Why does the lesson mark the Thread snippet as not run?",
          choices: ["threading is not in the standard library", "This page is not a desktop process, so the demo would be misleading", "Threads were removed in Python 3.14"],
          answer: 1,
          why: "The choice is printed and checked. The worker snippets are shown as not run.",
        },
      ],
    },
  ],
};
