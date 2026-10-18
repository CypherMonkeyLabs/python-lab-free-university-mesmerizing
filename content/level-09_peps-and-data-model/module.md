---
id: L09
level: 9
title: PEPs and the Data Model
slug: PEPs-and-the-Data-Model
accent: "#e4d9a8"
audience: intermediate
hours: 40
python_min: "3.8"
python_tested: "3.12"
outcomes:
  - Call len and see it use the __len__ method
  - Name two PEPs this lab already cites for dates and style
  - Tell a style guide apart from a language rule
  - Find the data model chapter in the language reference
project: "A small Bag whose len is the number of items you stored"
sources:
  - {id: datamodel, title: "Python reference: Data model", url: "https://docs.python.org/3/reference/datamodel.html"}
  - {id: pep8, title: "PEP 8 – Style Guide for Python Code", url: "https://peps.python.org/pep-0008/"}
  - {id: pep790, title: "PEP 790 – Python 3.15 Release Schedule", url: "https://peps.python.org/pep-0790/"}
  - {id: pep-index, title: "PEP index", url: "https://peps.python.org/"}
---
# PEPs and the Data Model

## len asks the object

The data model says operations such as `len` look up special methods. A class can supply `__len__`. `len` then returns that integer.

```python run
class Bag:
    def __init__(self, items):
        self.items = list(items)

    def __len__(self):
        return len(self.items)

print(len(Bag(["pen", "ink"])))
print("py".__len__())
```

## A PEP is a design document

PEP 8 is the style guide. Formatting tools may warn about it. CPython does not reject a program for ignoring it. PEP 790 is the 3.15 release schedule. This lab's sources record 3.15.0 final as 9 October 2026 from that PEP. The PEP index lists the documents.

```python run
cited = ["PEP 8", "PEP 790"]
print(", ".join(cited))
print("style guide" != "syntax rule")
```

## Where to read next

Open the data model chapter when you want the rule for a special method. Open the PEP index when you want the history of a change. The pages linked under Sources are the ones this Level uses.

## Check yourself

1. Which method does `len` call?
2. Is PEP 8 a compiler rule?
3. Which PEP in the sources is the 3.15 schedule?
