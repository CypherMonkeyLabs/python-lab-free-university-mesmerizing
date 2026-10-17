import { codeBlock } from "../util.js";

export const dsa = {
  id: "dsa",
  title: "Data structures and algorithms",
  icon: "dsa",
  menu: "Lists, hash tables, stacks, queues, trees, sorting, and how to talk about cost.",
  intro: "These pages use the structures Python gives you, then name the idea underneath. Cost notes refer to CPython and the Python wiki's TimeComplexity page, which is community maintained, not a promise in the language spec.",
  sources: ["stdtypes", "collections", "heapq", "bisect-doc", "timecomplexity"],
  lessons: [
    {
      id: "sequences",
      title: "Lists, tuples, and slices",
      level: "Beginner",
      minutes: 12,
      summary: "A list is a mutable sequence. A tuple is an immutable one.",
      sources: ["stdtypes", "timecomplexity"],
      sections: [
        {
          heading: "What you can change",
          html: `<p>append adds at the end and, in CPython, is amortized constant time. Inserting at the front shifts every later item, so it grows with the length. A slice copies. Sorting a list with sort changes it. sorted returns a new list.</p>
          <p>A tuple can be a dict key when its items are hashable. A one-item tuple needs a comma: (1,).</p>`,
        },
        {
          heading: "Slicing",
          html: `${codeBlock("items = [10, 20, 30, 40]\nassert items[1:3] == [20, 30]\nassert items[::-1] == [40, 30, 20, 10]\n")}`,
        },
      ],
      exercise: {
        prompt: "Write middle(items) that returns a new list of everything except the first and last items. An empty or one-item list returns an empty list.",
        starter: "def middle(items):\n    return list(items)\n",
        checks: [
          "assert middle([1, 2, 3, 4]) == [2, 3]",
          "assert middle([1]) == []",
          "assert middle([]) == []",
        ],
      },
    },
    {
      id: "maps",
      title: "Dicts, sets, and hashing",
      level: "Intermediate",
      minutes: 14,
      summary: "A dict maps a hashable key to a value and remembers insertion order.",
      sources: ["stdtypes", "timecomplexity"],
      sections: [
        {
          heading: "Average case is not a guarantee",
          html: `<p>In CPython, lookup, insert, and delete for dict and set are constant time on average. Hash collisions and resizing mean a single operation can cost more. Say "average case in CPython" when you quote that.</p>
          <p>set stores unique hashable items. Use it for membership tests. Iterate a dict's keys with for key in mapping. Use .items() when you need both.</p>`,
        },
        {
          heading: "A counting pattern",
          html: `${codeBlock("def counts(words):\n    found = {}\n    for word in words:\n        found[word] = found.get(word, 0) + 1\n    return found\n")}`,
        },
      ],
      exercise: {
        prompt: "Write counts(words) that returns a dict of how many times each word appears.",
        starter: "def counts(words):\n    return {}\n",
        checks: ["assert counts(['a', 'b', 'a']) == {'a': 2, 'b': 1}", "assert counts([]) == {}"],
      },
    },
    {
      id: "stacks",
      title: "Stacks, queues, and heaps",
      level: "Intermediate",
      minutes: 12,
      summary: "A list can be a stack. A deque is the honest queue. heapq is a priority queue.",
      sources: ["collections", "heapq"],
      sections: [
        {
          heading: "Choose the end you touch",
          html: `<p>append and pop on a list are a stack. A queue wants cheap removal from the other end, which is collections.deque and popleft. Indexing the middle of a deque is not the cheap operation. heapq keeps the smallest item at index 0 of a list, with heappush and heappop.</p>`,
        },
      ],
      exercise: {
        prompt: "Write drain(items) that pops from the end until the list is empty and returns the popped values in that order.",
        starter: "def drain(items):\n    return []\n",
        checks: ["assert drain([1, 2, 3]) == [3, 2, 1]"],
      },
    },
    {
      id: "trees",
      title: "Trees and graphs, as data",
      level: "Intermediate",
      minutes: 12,
      summary: "A tree is a node and its children. A graph is nodes and edges, and it may contain cycles.",
      sources: ["tutorial"],
      sections: [
        {
          heading: "Represent them plainly",
          html: `<p>A nested dict or a small class is enough for a tree. A graph is often a dict from a node to its neighbors. Depth-first search uses a stack, or recursion. Breadth-first search uses a queue. If the graph can contain a cycle, remember the nodes you have already seen or you will loop forever.</p>
          ${codeBlock("tree = {\"value\": \"root\", \"kids\": [{\"value\": \"a\", \"kids\": []}]}\ngraph = {\"a\": [\"b\"], \"b\": [\"a\", \"c\"], \"c\": []}\n")}`,
        },
      ],
      exercise: {
        prompt: "Write reachable(graph, start) that returns the set of nodes you can visit from start, including start. The graph is a dict of lists.",
        starter: "def reachable(graph, start):\n    return set()\n",
        checks: [
          "g = {'a': ['b'], 'b': ['c'], 'c': []}\nassert reachable(g, 'a') == {'a', 'b', 'c'}",
          "loop = {'a': ['b'], 'b': ['a']}\nassert reachable(loop, 'a') == {'a', 'b'}",
        ],
      },
    },
    {
      id: "sorting",
      title: "Sorting and searching",
      level: "Intermediate",
      minutes: 12,
      summary: "sorted is the tool. Binary search is the idea, and bisect is the module.",
      sources: ["bisect-doc", "stdtypes"],
      sections: [
        {
          heading: "Do not hand-roll a sort in production",
          html: `<p>CPython's sorted is a stable Timsort. It accepts a key function. Binary search only works on sorted data and halves the remaining range each time. The bisect module does that for you. Knowing the idea matters in an interview. Replacing bisect in a program rarely does.</p>`,
        },
      ],
      exercise: {
        prompt: "Write bsearch(items, target) for a sorted list of numbers. Return the index, or -1 if the target is absent. Do not import bisect. This is practice of the idea.",
        starter: "def bsearch(items, target):\n    return -1\n",
        checks: [
          "assert bsearch([1, 3, 5, 7], 5) == 2",
          "assert bsearch([1, 3, 5, 7], 4) == -1",
          "assert bsearch([], 1) == -1",
        ],
      },
    },
    {
      id: "interviews",
      title: "Talking about cost",
      level: "Interview",
      minutes: 10,
      summary: "Name the structure, the operation, and whether you mean average or worst case.",
      sources: ["timecomplexity"],
      sections: [
        {
          heading: "A sentence that holds up",
          html: `<p>Say "list append is amortized constant time in CPython" rather than "lists are O(1)". Say which operation. Lookup in a dict is not the same cost as "the dict". The TimeComplexity wiki is a useful CPython note. It is not the language reference, and a different Python implementation can differ.</p>
          <p>In an interview, narrate a test: an empty input, a single item, and a case that would break an off-by-one. This lab does not collect employer question banks and does not claim that a pattern guarantees an offer.</p>`,
        },
      ],
      exercise: {
        prompt: "Write cost_note() that returns the exact string amortized append. It is a reminder, not a measurement.",
        starter: "def cost_note():\n    return \"\"\n",
        checks: ["assert cost_note() == 'amortized append'"],
      },
    },
  ],
  quiz: [
    {
      prompt: "Which structure gives cheap pops at both ends?",
      choices: ["A list used only at index 0", "collections.deque", "A set", "A tuple"],
      answer: 1,
      why: "deque is the standard-library double-ended queue. Popping the front of a list shifts the rest.",
      source: "collections",
    },
    {
      prompt: "Binary search requires",
      choices: ["A hash table", "Sorted random-access data", "A linked list", "A running event loop"],
      answer: 1,
      why: "Each step discards half of a sorted range. Unsorted data does not support that.",
      source: "bisect-doc",
    },
    {
      prompt: "A CPython dict lookup is usually described as",
      choices: ["Always constant time, with no exceptions", "Average-case constant time", "Linear in the number of keys, always", "Impossible for strings"],
      answer: 1,
      why: "The TimeComplexity notes describe average-case constant time. Worst cases exist.",
      source: "timecomplexity",
    },
  ],
};
