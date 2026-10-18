/* Py's hint ladders, one per exercise: Nudge (a question) -> Hint (concept + docs link) -> Approach (steps in words)
   -> Worked example of a SIMILAR problem (never the answer to this one).
   Lessons without a hand-written ladder get the generic ladder in botteach.js and say so.
   There is no stored full solution for any exercise, so Py offers no "solution" rung. */
const D = "https://docs.python.org/3/";
export const hints = {
  "start/map": {
    nudge: "What must greet() hand back to the caller: print it, or return it?",
    hint: "A function that returns a value ends with the return keyword. Quotes make a string.", link: ["Defining functions", D + "tutorial/controlflow.html#defining-functions"],
    approach: ["Write def greet():", "On the next line, indented, return a string.", "Check the comma and the space against the prompt."],
    example: "def shout():\n    return \"HEY!\"\n\nprint(shout())",
  },
  "fundamentals/syntax": {
    nudge: "Which operator joins two strings together?",
    hint: "The + operator joins strings. A string has no space unless you type one.", link: ["Strings", D + "tutorial/introduction.html#text"],
    approach: ["Take the parameter word.", "Join it with the text \"!\".", "Return the joined string."],
    example: "def wrap(word):\n    return \"[\" + word + \"]\"",
  },
  "fundamentals/types": {
    nudge: "What does type(5) give you? What do you get from it that is just the name, like int?",
    hint: "Every class has a __name__ attribute that holds its name as a string.", link: ["type()", D + "library/functions.html#type"],
    approach: ["Call type(value) to get the class.", "Read its __name__.", "Return that string."],
    example: "def size_of(items):\n    return len(items)\n# Different job, same shape: call something, return its result.",
  },
  "fundamentals/names": {
    nudge: "If two names point at the same list, what happens when you append through one of them?",
    hint: "list(items) or items.copy() builds a new list with the same elements.", link: ["Data model: objects and names", D + "reference/datamodel.html#objects-values-and-types"],
    approach: ["Make a new list from items.", "Return the new list, and leave items alone."],
    example: "def doubled(nums):\n    out = list(nums)\n    out.extend(nums)\n    return out",
  },
  "fundamentals/control": {
    nudge: "Which case must be tested first so that 15 does not stop at Fizz?",
    hint: "The % operator gives a remainder; n % 3 == 0 means divisible by 3. if/elif tests run top to bottom.", link: ["if statements", D + "tutorial/controlflow.html#if-statements"],
    approach: ["Test divisible by both first.", "Then divisible by 3, then by 5.", "Otherwise return the number as the prompt says."],
    example: "def parity(n):\n    if n % 2 == 0:\n        return \"even\"\n    return \"odd\"",
  },
  "fundamentals/functions": {
    nudge: "Default values are made once, when def runs. What would a default of [] share between calls?",
    hint: "Use None as the default, and make a new list inside the function when it is None.", link: ["Default argument values", D + "tutorial/controlflow.html#default-argument-values"],
    approach: ["Default the parameter to None.", "If it is None, set it to a new empty list.", "Append, then return."],
    example: "def tag(name, tags=None):\n    if tags is None:\n        tags = []\n    tags.append(name.lower())\n    return tags",
  },
  "fundamentals/classes": {
    nudge: "Where should the count live so that each Counter keeps its own?",
    hint: "Set self.n = 0 in __init__. Methods read and change self.n.", link: ["Classes", D + "tutorial/classes.html"],
    approach: ["Define __init__ that stores a starting number on self.", "inc() adds one to it.", "value() returns it."],
    example: "class Lamp:\n    def __init__(self):\n        self.on = False\n    def toggle(self):\n        self.on = not self.on",
  },
  "fundamentals/errors": {
    nudge: "What does int(\"abc\") do? Which exception class is it?",
    hint: "int() raises ValueError for bad text. You can raise ValueError yourself with a message.", link: ["Raising exceptions", D + "tutorial/errors.html#raising-exceptions"],
    approach: ["Convert with int().", "Check the allowed range.", "Raise ValueError when either step fails."],
    example: "def need_positive(n):\n    if n <= 0:\n        raise ValueError(\"n must be positive\")\n    return n",
  },
  "dsa/sequences": {
    nudge: "What slice drops the first and last items? Try it on [1, 2, 3, 4].",
    hint: "items[1:-1] starts after the first item and stops before the last. A slice is a new list.", link: ["Lists and slices", D + "tutorial/introduction.html#lists"],
    approach: ["Slice from index 1 to index -1.", "Return the slice; short lists give an empty list."],
    example: "def tail(items):\n    return items[1:]",
  },
  "dsa/maps": {
    nudge: "When a word is new, what should its count start as?",
    hint: "dict.get(key, 0) gives 0 for a missing key. collections.Counter also counts for you.", link: ["dict.get", D + "library/stdtypes.html#dict.get"],
    approach: ["Make an empty dict.", "For each word, set the count to the old count plus one.", "Return the dict."],
    example: "def lengths(words):\n    out = {}\n    for w in words:\n        out[w] = len(w)\n    return out",
  },
  "dsa/sorting": {
    nudge: "If the middle item is too small, which half can you throw away?",
    hint: "Keep two indexes, lo and hi, and move one of them to the middle each step.", link: ["bisect: array bisection", D + "library/bisect.html"],
    approach: ["lo = 0, hi = last index.", "While lo <= hi, look at the middle.", "Equal: return it. Too small: lo = mid + 1. Too big: hi = mid - 1.", "If the loop ends, return -1."],
    example: "def first_big(nums, limit):\n    for i, n in enumerate(nums):\n        if n > limit:\n            return i\n    return -1  # a linear scan: the binary version halves the range instead",
  },
  "async/coroutines": {
    nudge: "What keyword makes a function a coroutine, and what keyword waits for another one?",
    hint: "async def defines it. await asyncio.sleep(0) gives other tasks a turn.", link: ["Coroutines and tasks", D + "library/asyncio-task.html"],
    approach: ["Write async def delayed_sum(a, b).", "await asyncio.sleep(0).", "Return a + b."],
    example: "import asyncio\n\nasync def twice(x):\n    await asyncio.sleep(0)\n    return x * 2\n\nprint(asyncio.run(twice(4)))",
  },
  "projects/guess-rule": {
    nudge: "Which two comparisons does the secret number need, and what does higher mean here?",
    hint: "Compare guess with secret using ==, then <. Read the prompt: higher means the secret is above the guess.", link: ["if statements", D + "tutorial/controlflow.html#if-statements"],
    approach: ["If guess equals secret, return equal.", "If guess is below secret, the secret is higher.", "Otherwise return lower."],
    example: "def sign(n):\n    if n == 0:\n        return \"zero\"\n    if n > 0:\n        return \"plus\"\n    return \"minus\"",
  },
};

/* Socratic prompts: one clarifying question first (PRIMM: predict, run, investigate, modify, make). */
export const socratic = [
  "Before you run it: what do you expect it to print?",
  "Which line changes the value you care about?",
  "What would break if you swapped the order of two lines?",
  "Can you explain what happens on the second call, in your own words?",
  "What is the smallest input that would make it fail?",
  "Which docs page would answer this? Open it and read one paragraph.",
];
